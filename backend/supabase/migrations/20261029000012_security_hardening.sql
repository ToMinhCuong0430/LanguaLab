-- ====================================================================
-- MIGRATION: 20261029000012_security_hardening.sql
-- Thắt chặt bảo mật RLS, hàm SECURITY DEFINER, chống gian lận XP & Storage
-- ====================================================================

-- 1. TRIGGER BẢO VỆ CỘT NHẠY CẢM TRÊN PROFILES (total_xp, streak_days, level_id)
-- Chỉ RPC hệ thống / trigger nội bộ / Admin mới được thay đổi điểm và streak.
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Nếu request đến từ client đã đăng nhập và không phải Admin
  IF (auth.role() = 'authenticated' AND NOT public.is_admin()) THEN
    IF NEW.total_xp IS DISTINCT FROM OLD.total_xp THEN
      RAISE EXCEPTION 'Không được phép cập nhật trực tiếp tổng XP (chỉ qua RPC thi/học thật)';
    END IF;
    IF NEW.streak_days IS DISTINCT FROM OLD.streak_days THEN
      RAISE EXCEPTION 'Không được phép cập nhật trực tiếp chuỗi streak (chỉ qua claim_daily_checkin)';
    END IF;
    IF NEW.level_id IS DISTINCT FROM OLD.level_id THEN
      RAISE EXCEPTION 'Không được phép cập nhật trực tiếp level_id';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_protect_profile_fields ON public.profiles;
CREATE TRIGGER tr_protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_fields();

-- 2. THẮT CHẶT USER_ROLES (CHỈ ADMIN MỚI ĐƯỢC INSERT/UPDATE/DELETE)
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role or admins can view all"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to user_roles" ON public.user_roles;
CREATE POLICY "Admins have full access to user_roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. CỦNG CỐ HÀM is_admin VỚI SEARCH_PATH = public
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 4. CỦNG CỐ HÀM award_xp CHỐNG GIẢ MẠO USER VÀ KHÓA SEARCH_PATH
CREATE OR REPLACE FUNCTION public.award_xp(
  p_source TEXT,
  p_ref_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_target_user_id UUID;
  v_base_xp INTEGER := 0;
  v_daily_total INTEGER := 0;
  v_already_awarded BOOLEAN := FALSE;
  v_new_total INTEGER := 0;
  v_max_daily_xp CONSTANT INTEGER := 500;
BEGIN
  -- Anti-spoofing: Người dùng không được phép cấp XP cho tài khoản khác trừ khi là Admin
  IF p_user_id IS NOT NULL AND v_caller_id IS NOT NULL AND p_user_id <> v_caller_id THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Từ chối: Không có quyền cấp XP cho người dùng khác';
    END IF;
  END IF;

  v_target_user_id := COALESCE(p_user_id, v_caller_id);

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để nhận XP';
  END IF;

  -- Bảng quy đổi điểm cố định trên server
  CASE p_source
    WHEN 'daily_checkin' THEN v_base_xp := 20;
    WHEN 'typing_attempt' THEN v_base_xp := 30;
    WHEN 'grammar_attempt' THEN v_base_xp := 40;
    WHEN 'media_dictation' THEN v_base_xp := 25;
    WHEN 'reading_complete' THEN v_base_xp := 35;
    WHEN 'stage_complete' THEN v_base_xp := 50;
    WHEN 'word_review' THEN v_base_xp := 5;
    WHEN 'exam_complete' THEN v_base_xp := 50;
    ELSE v_base_xp := 10;
  END CASE;

  -- Kiểm tra Idempotent nếu có reference_id
  IF p_ref_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.xp_events
      WHERE user_id = v_target_user_id AND source = p_source AND reference_id = p_ref_id
    ) INTO v_already_awarded;

    IF v_already_awarded THEN
      SELECT total_xp INTO v_new_total FROM public.user_xp_totals WHERE user_id = v_target_user_id;
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Hoạt động này đã được cộng XP trước đó',
        'xp_gained', 0,
        'total_xp', COALESCE(v_new_total, 0)
      );
    END IF;
  END IF;

  -- Kiểm tra trần XP hàng ngày (500 XP / ngày)
  SELECT COALESCE(SUM(xp_amount), 0) INTO v_daily_total
  FROM public.xp_events
  WHERE user_id = v_target_user_id AND created_at >= CURRENT_DATE;

  IF v_daily_total + v_base_xp > v_max_daily_xp THEN
    v_base_xp := GREATEST(0, v_max_daily_xp - v_daily_total);
    IF v_base_xp = 0 THEN
      SELECT total_xp INTO v_new_total FROM public.user_xp_totals WHERE user_id = v_target_user_id;
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Bạn đã đạt giới hạn tối đa 500 XP hôm nay',
        'xp_gained', 0,
        'total_xp', COALESCE(v_new_total, 0)
      );
    END IF;
  END IF;

  -- Ghi nhận sự kiện XP
  INSERT INTO public.xp_events (user_id, xp_amount, source, reference_id)
  VALUES (v_target_user_id, v_base_xp, p_source, p_ref_id);

  -- Cập nhật tổng điểm profiles
  UPDATE public.profiles
  SET total_xp = total_xp + v_base_xp,
      updated_at = NOW()
  WHERE id = v_target_user_id
  RETURNING total_xp INTO v_new_total;

  RETURN jsonb_build_object(
    'success', true,
    'xp_gained', v_base_xp,
    'total_xp', v_new_total,
    'daily_total', v_daily_total + v_base_xp
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. CỦNG CỐ claim_daily_checkin DÙNG CHUNG award_xp VÀ AN TOÀN TRẦN XP
CREATE OR REPLACE FUNCTION public.claim_daily_checkin()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := CURRENT_DATE;
  v_already_checked BOOLEAN;
  v_new_streak INTEGER;
  v_xp_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để điểm danh';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.daily_checkins
    WHERE user_id = v_user_id AND checkin_date = v_today
  ) INTO v_already_checked;

  IF v_already_checked THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Bạn đã điểm danh hôm nay rồi!'
    );
  END IF;

  -- 1. Thêm dòng điểm danh
  INSERT INTO public.daily_checkins (user_id, checkin_date)
  VALUES (v_user_id, v_today);

  -- 2. Thưởng XP qua hàm chuẩn award_xp
  v_xp_result := public.award_xp('daily_checkin', v_today::TEXT, v_user_id);

  -- 3. Cập nhật chuỗi streak
  v_new_streak := public.get_user_streak(v_user_id);
  UPDATE public.profiles
  SET streak_days = v_new_streak,
      last_active_at = NOW(),
      updated_at = NOW()
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'xp_gained', COALESCE((v_xp_result->>'xp_gained')::INTEGER, 20),
    'streak_days', v_new_streak,
    'total_xp', (v_xp_result->>'total_xp')::INTEGER
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. CỦNG CỐ CÁC HÀM GET STATS VÀ STREAK VỚI SEARCH_PATH = public
CREATE OR REPLACE FUNCTION public.get_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_check_date DATE := CURRENT_DATE;
  v_has_today BOOLEAN;
BEGIN
  -- Kiểm tra hôm nay có điểm danh không
  SELECT EXISTS(
    SELECT 1 FROM public.daily_checkins
    WHERE user_id = p_user_id AND checkin_date = CURRENT_DATE
  ) INTO v_has_today;

  -- Nếu hôm nay chưa điểm danh, kiểm tra từ hôm qua xem streak có còn giữ không
  IF NOT v_has_today THEN
    v_check_date := CURRENT_DATE - INTERVAL '1 day';
  END IF;

  -- Đếm lùi từng ngày liên tiếp
  WHILE EXISTS(
    SELECT 1 FROM public.daily_checkins
    WHERE user_id = p_user_id AND checkin_date = v_check_date
  ) LOOP
    v_streak := v_streak + 1;
    v_check_date := v_check_date - INTERVAL '1 day';
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_my_today_stats()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_words_learned INTEGER := 0;
  v_practice_minutes INTEGER := 0;
  v_today_xp INTEGER := 0;
  v_streak INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'words_learned_today', 0,
      'practice_time_minutes', 0,
      'today_xp', 0,
      'streak_days', 0
    );
  END IF;

  SELECT COUNT(*) INTO v_words_learned
  FROM public.user_word_progress
  WHERE user_id = v_user_id AND last_reviewed_at >= CURRENT_DATE;

  SELECT COALESCE(SUM(duration_seconds), 0) / 60 INTO v_practice_minutes
  FROM (
    SELECT duration_seconds FROM public.typing_attempts
    WHERE user_id = v_user_id AND created_at >= CURRENT_DATE
    UNION ALL
    SELECT duration_seconds FROM public.exam_attempts
    WHERE user_id = v_user_id AND created_at >= CURRENT_DATE
    UNION ALL
    SELECT duration_seconds FROM public.grammar_attempts
    WHERE user_id = v_user_id AND created_at >= CURRENT_DATE
  ) today_practices;

  SELECT COALESCE(SUM(xp_amount), 0) INTO v_today_xp
  FROM public.xp_events
  WHERE user_id = v_user_id AND created_at >= CURRENT_DATE;

  SELECT streak_days INTO v_streak
  FROM public.profiles
  WHERE id = v_user_id;

  RETURN jsonb_build_object(
    'words_learned_today', v_words_learned,
    'practice_time_minutes', v_practice_minutes,
    'today_xp', v_today_xp,
    'streak_days', COALESCE(v_streak, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 7. THẮT CHẶT VIEW WEEKLY_LEADERBOARD (KHÔNG CHỨA THÔNG TIN NHẠY CẢM)
CREATE OR REPLACE VIEW public.weekly_leaderboard AS
WITH current_week_xp AS (
  SELECT
    p.id AS user_id,
    p.full_name,
    p.avatar_text,
    COALESCE(SUM(x.xp_amount), 0)::INTEGER AS weekly_xp
  FROM public.profiles p
  LEFT JOIN public.xp_events x ON p.id = x.user_id 
    AND x.created_at >= DATE_TRUNC('week', NOW())
  GROUP BY p.id, p.full_name, p.avatar_text
)
SELECT
  DENSE_RANK() OVER (ORDER BY weekly_xp DESC, user_id ASC)::INTEGER AS rank,
  user_id,
  full_name,
  avatar_text,
  weekly_xp
FROM current_week_xp
ORDER BY rank ASC
LIMIT 100;

GRANT SELECT ON public.weekly_leaderboard TO anon, authenticated;

-- 8. THẮT CHẶT STORAGE POLICIES CHO 3 BUCKETS (UPDATE & DELETE THEO THƯ MỤC USER ID)
-- 8.1. avatars bucket
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    ((storage.foldername(name))[1] = auth.uid()::TEXT OR public.is_admin())
  );

-- 8.2. speaking-recordings bucket
DROP POLICY IF EXISTS "Users can update own speaking recordings" ON storage.objects;
CREATE POLICY "Users can update own speaking recordings"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'speaking-recordings' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  )
  WITH CHECK (
    bucket_id = 'speaking-recordings' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "Users can delete own speaking recordings" ON storage.objects;
CREATE POLICY "Users can delete own speaking recordings"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'speaking-recordings' AND
    ((storage.foldername(name))[1] = auth.uid()::TEXT OR public.is_admin())
  );

-- 8.3. pronunciation-recordings bucket
DROP POLICY IF EXISTS "Users can update own pronunciation recordings" ON storage.objects;
CREATE POLICY "Users can update own pronunciation recordings"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'pronunciation-recordings' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  )
  WITH CHECK (
    bucket_id = 'pronunciation-recordings' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "Users can delete own pronunciation recordings" ON storage.objects;
CREATE POLICY "Users can delete own pronunciation recordings"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pronunciation-recordings' AND
    ((storage.foldername(name))[1] = auth.uid()::TEXT OR public.is_admin())
  );
