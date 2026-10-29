-- ====================================================================
-- MIGRATION: 20261029000012_security_hardening.sql
-- Thắt chặt bảo mật RLS, hàm SECURITY DEFINER, chống gian lận XP & Storage
-- ====================================================================

-- 1. TRIGGER BẢO VỆ CÁC TRƯỜNG NHẠY CẢM TRÊN PROFILES (id, created_at)
-- Chỉ Admin hoặc trigger nội bộ mới được phép sửa đổi thông tin nhận dạng gốc
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Nếu request đến từ client đã đăng nhập và không phải Admin
  IF (auth.role() = 'authenticated' AND NOT public.is_admin()) THEN
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Không được phép thay đổi id tài khoản';
    END IF;
    IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Không được phép cập nhật trực tiếp ngày tạo tài khoản';
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
DROP POLICY IF EXISTS "Users can view own role or admins can view all" ON public.user_roles;
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

-- 4. CỦNG CỐ HÀM award_xp CHỐNG GIẢ MẠO USER, KHÓA SEARCH_PATH VÀ LẤY TỔNG XP TỪ VIEW
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

  -- Ghi nhận sự kiện XP vào bảng nguồn sự thật duy nhất (Single Source of Truth)
  INSERT INTO public.xp_events (user_id, xp_amount, source, reference_id)
  VALUES (v_target_user_id, v_base_xp, p_source, p_ref_id);

  -- Tổng điểm XP được tính toán tập trung từ view public.user_xp_totals
  SELECT total_xp INTO v_new_total
  FROM public.user_xp_totals
  WHERE user_id = v_target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'xp_gained', v_base_xp,
    'total_xp', COALESCE(v_new_total, 0),
    'daily_total', v_daily_total + v_base_xp
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

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

  -- 3. Tính toán chuỗi streak động từ hàm get_user_streak
  v_new_streak := public.get_user_streak(v_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'xp_gained', COALESCE((v_xp_result->>'xp_gained')::INTEGER, 20),
    'streak_days', v_new_streak,
    'total_xp', COALESCE((v_xp_result->>'total_xp')::INTEGER, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

-- 6. CỦNG CỐ HÀM get_user_streak VỚI SEARCH_PATH = public
CREATE OR REPLACE FUNCTION public.get_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_check_date DATE := CURRENT_DATE;
  v_has_today BOOLEAN;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 0;
  END IF;

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

-- 7. CỦNG CỐ get_my_today_stats (THÊM DROP TRƯỚC ĐÓ VÌ THAY ĐỔI KIỂU TRẢ VỀ TỪ TABLE SANG JSONB)
DROP FUNCTION IF EXISTS public.get_my_today_stats();

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

  -- Đếm từ ôn luyện hôm nay
  SELECT COUNT(*) INTO v_words_learned
  FROM public.user_word_progress
  WHERE user_id = v_user_id AND last_reviewed_at >= CURRENT_DATE;

  -- Tính thời gian luyện tập qua cột completed_at của các bảng attempts
  SELECT COALESCE(SUM(duration_seconds), 0) / 60 INTO v_practice_minutes
  FROM (
    SELECT duration_seconds FROM public.typing_attempts
    WHERE user_id = v_user_id AND completed_at >= CURRENT_DATE
    UNION ALL
    SELECT duration_seconds FROM public.exam_attempts
    WHERE user_id = v_user_id AND completed_at >= CURRENT_DATE
    UNION ALL
    SELECT duration_seconds FROM public.grammar_attempts
    WHERE user_id = v_user_id AND completed_at >= CURRENT_DATE
  ) today_practices;

  -- Tổng XP nhận được hôm nay
  SELECT COALESCE(SUM(xp_amount), 0) INTO v_today_xp
  FROM public.xp_events
  WHERE user_id = v_user_id AND created_at >= CURRENT_DATE;

  -- Chuỗi ngày học liên tục qua hàm chuẩn get_user_streak
  v_streak := public.get_user_streak(v_user_id);

  RETURN jsonb_build_object(
    'words_learned_today', v_words_learned,
    'practice_time_minutes', v_practice_minutes,
    'today_xp', v_today_xp,
    'streak_days', COALESCE(v_streak, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 8. VÁ HÀM submit_exam_attempt (SỬA CỘT COMPLETED_AT VÀ XP_EVENTS TỪ MIGRATION 10)
CREATE OR REPLACE FUNCTION public.submit_exam_attempt(
  p_test_id TEXT,
  p_mode exam_mode,
  p_answers JSONB,
  p_duration_seconds INTEGER,
  p_essay TEXT DEFAULT NULL,
  p_audio_path TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_test RECORD;
  v_total_questions INTEGER := 0;
  v_raw_score INTEGER := 0;
  v_band_score NUMERIC(3, 1) := NULL;
  v_attempt_id UUID := gen_random_uuid();
  v_results JSONB := '[]'::jsonb;
  v_item RECORD;
  v_user_answer TEXT;
  v_is_correct BOOLEAN;
  v_today_start TIMESTAMPTZ := date_trunc('day', NOW() AT TIME ZONE 'UTC');
  v_daily_xp_count INTEGER := 0;
  v_base_xp INTEGER := 0;
  v_awarded_xp INTEGER := 0;
BEGIN
  -- 1. Kiểm tra xác thực người dùng
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để nộp bài thi.';
  END IF;

  -- 2. Kiểm tra đề thi tồn tại và đã xuất bản
  SELECT id, exam_id, skill, total_questions, is_published, difficulty
  INTO v_test
  FROM public.exam_tests
  WHERE id = p_test_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Đề thi không tồn tại.';
  END IF;

  IF NOT v_test.is_published AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Đề thi này chưa được xuất bản.';
  END IF;

  -- 3. Xử lý chấm điểm trắc nghiệm (Listening / Reading)
  IF v_test.skill IN ('listening', 'reading') THEN
    FOR v_item IN
      SELECT id, question_number, correct_answer, explanation
      FROM public.exam_questions
      WHERE test_id = p_test_id
      ORDER BY question_number ASC
    LOOP
      v_total_questions := v_total_questions + 1;

      -- Lấy câu trả lời của thí sinh từ JSONB mảng hoặc map
      IF jsonb_typeof(p_answers) = 'array' THEN
        SELECT elem->>'user_answer' INTO v_user_answer
        FROM jsonb_array_elements(p_answers) AS elem
        WHERE (elem->>'question_id')::TEXT = v_item.id::TEXT
           OR (elem->>'question_number')::INTEGER = v_item.question_number;
      ELSE
        v_user_answer := p_answers->>v_item.id::TEXT;
        IF v_user_answer IS NULL THEN
          v_user_answer := p_answers->>(v_item.question_number::TEXT);
        END IF;
      END IF;

      -- So khớp đáp án (chấp nhận chữ hoa thường và khoảng trắng thừa)
      IF v_user_answer IS NOT NULL AND LOWER(TRIM(v_user_answer)) = LOWER(TRIM(v_item.correct_answer)) THEN
        v_is_correct := TRUE;
        v_raw_score := v_raw_score + 1;
      ELSE
        v_is_correct := FALSE;
      END IF;

      v_results := v_results || jsonb_build_object(
        'question_id', v_item.id,
        'question_number', v_item.question_number,
        'user_answer', v_user_answer,
        'correct_answer', v_item.correct_answer,
        'is_correct', v_is_correct,
        'explanation', v_item.explanation
      );
    END LOOP;

    -- Quy đổi điểm Band Score IELTS chuẩn
    IF v_total_questions > 0 THEN
      v_band_score := public.calculate_ielts_band(v_raw_score, v_total_questions, v_test.skill);
    ELSE
      v_band_score := 0.0;
    END IF;

    v_base_xp := 10 + (v_raw_score * 3);
  ELSE
    -- Kỹ năng Tự luận (Writing / Speaking)
    v_total_questions := COALESCE(v_test.total_questions, 1);
    v_base_xp := 25;
  END IF;

  -- 4. Chèn bản ghi vào public.exam_attempts (dùng completed_at)
  INSERT INTO public.exam_attempts (
    id,
    user_id,
    test_id,
    mode,
    raw_score,
    total_questions,
    band_score,
    duration_seconds,
    submitted_essay,
    speaking_audio_url,
    completed_at
  ) VALUES (
    v_attempt_id,
    v_user_id,
    p_test_id,
    p_mode,
    v_raw_score,
    v_total_questions,
    v_band_score,
    COALESCE(p_duration_seconds, 0),
    p_essay,
    p_audio_path,
    NOW()
  );

  -- 5. Chèn chi tiết câu trả lời vào public.exam_answers (nếu có câu hỏi trắc nghiệm)
  IF jsonb_array_length(v_results) > 0 THEN
    INSERT INTO public.exam_answers (
      attempt_id,
      question_id,
      user_answer,
      is_correct
    )
    SELECT
      v_attempt_id,
      (elem->>'question_id')::UUID,
      elem->>'user_answer',
      (elem->>'is_correct')::BOOLEAN
    FROM jsonb_array_elements(v_results) AS elem;
  END IF;

  -- 6. Cộng XP (Tuân thủ trần 500 XP/ngày và cấu trúc đúng cột của xp_events)
  SELECT COALESCE(SUM(xp_amount), 0)
  INTO v_daily_xp_count
  FROM public.xp_events
  WHERE user_id = v_user_id
    AND created_at >= v_today_start;

  IF v_daily_xp_count < 500 THEN
    v_awarded_xp := LEAST(v_base_xp, 500 - v_daily_xp_count);
    IF v_awarded_xp > 0 THEN
      INSERT INTO public.xp_events (user_id, xp_amount, source, reference_id)
      VALUES (v_user_id, v_awarded_xp, 'exam_attempt', v_attempt_id::TEXT);
    END IF;
  END IF;

  -- 7. Trả về kết quả JSON cho frontend
  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'raw_score', v_raw_score,
    'total_questions', v_total_questions,
    'band_score', v_band_score,
    'xp_earned', v_awarded_xp,
    'skill', v_test.skill,
    'questions_result', v_results
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

-- 9. THẮT CHẶT VIEW WEEKLY_LEADERBOARD (KHÔNG CHỨA THÔNG TIN NHẠY CẢM)
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

-- 10. THẮT CHẶT STORAGE POLICIES CHO 3 BUCKETS (UPDATE & DELETE THEO THƯ MỤC USER ID)
-- 10.1. avatars bucket
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

-- 10.2. speaking-recordings bucket
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

-- 10.3. pronunciation-recordings bucket
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
