-- ==============================================================================
-- SCRIPT KIỂM THỬ TRANSACTION MIGRATION 12 (SECURITY HARDENING)
-- Chạy trên Supabase Remote SQL Editor (BEGIN ... ROLLBACK)
-- Kiểm chứng bằng các lời gọi hàm THỰC TẾ với người dùng giả lập
-- Kết thúc bằng ROLLBACK nên tuyệt đối KHÔNG làm biến đổi dữ liệu cơ sở dữ liệu
-- ==============================================================================
BEGIN;

-- Nạp toàn bộ nội dung của Migration 12
-- ====================================================================
-- 1. TRIGGER BẢO VỆ CÁC TRƯỜNG NHẠY CẢM TRÊN PROFILES (id, created_at)
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
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

-- 2. THẮT CHẶT USER_ROLES
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

-- 3. CỦNG CỐ is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 4. CỦNG CỐ award_xp
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
  IF p_user_id IS NOT NULL AND v_caller_id IS NOT NULL AND p_user_id <> v_caller_id THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Từ chối: Không có quyền cấp XP cho người dùng khác';
    END IF;
  END IF;

  v_target_user_id := COALESCE(p_user_id, v_caller_id);

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để nhận XP';
  END IF;

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

  INSERT INTO public.xp_events (user_id, xp_amount, source, reference_id)
  VALUES (v_target_user_id, v_base_xp, p_source, p_ref_id);

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

-- 5. CỦNG CỐ claim_daily_checkin
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

  INSERT INTO public.daily_checkins (user_id, checkin_date)
  VALUES (v_user_id, v_today);

  v_xp_result := public.award_xp('daily_checkin', v_today::TEXT, v_user_id);
  v_new_streak := public.get_user_streak(v_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'xp_gained', COALESCE((v_xp_result->>'xp_gained')::INTEGER, 20),
    'streak_days', v_new_streak,
    'total_xp', COALESCE((v_xp_result->>'total_xp')::INTEGER, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

-- 6. CỦNG CỐ get_user_streak
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

  SELECT EXISTS(
    SELECT 1 FROM public.daily_checkins
    WHERE user_id = p_user_id AND checkin_date = CURRENT_DATE
  ) INTO v_has_today;

  IF NOT v_has_today THEN
    v_check_date := CURRENT_DATE - INTERVAL '1 day';
  END IF;

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

-- 7. CỦNG CỐ get_my_today_stats (THAY ĐỔI KIỂU TRẢ VỀ TỪ TABLE SANG JSONB)
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

  SELECT COUNT(*) INTO v_words_learned
  FROM public.user_word_progress
  WHERE user_id = v_user_id AND last_reviewed_at >= CURRENT_DATE;

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

  SELECT COALESCE(SUM(xp_amount), 0) INTO v_today_xp
  FROM public.xp_events
  WHERE user_id = v_user_id AND created_at >= CURRENT_DATE;

  v_streak := public.get_user_streak(v_user_id);

  RETURN jsonb_build_object(
    'words_learned_today', v_words_learned,
    'practice_time_minutes', v_practice_minutes,
    'today_xp', v_today_xp,
    'streak_days', COALESCE(v_streak, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 8. VÁ HÀM submit_exam_attempt
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
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để nộp bài thi.';
  END IF;

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

  IF v_test.skill IN ('listening', 'reading') THEN
    FOR v_item IN
      SELECT id, question_number, correct_answer, explanation
      FROM public.exam_questions
      WHERE test_id = p_test_id
      ORDER BY question_number ASC
    LOOP
      v_total_questions := v_total_questions + 1;

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

    IF v_total_questions > 0 THEN
      v_band_score := public.calculate_ielts_band(v_raw_score, v_total_questions, v_test.skill);
    ELSE
      v_band_score := 0.0;
    END IF;

    v_base_xp := 10 + (v_raw_score * 3);
  ELSE
    v_total_questions := COALESCE(v_test.total_questions, 1);
    v_base_xp := 25;
  END IF;

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

-- 9. THẮT CHẶT VIEW WEEKLY_LEADERBOARD
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

-- ==============================================================================
-- BẮT ĐẦU CHẠY THỬ NGHIỆM VỚI DỮ LIỆU THẬT TRONG TRANSACTION
-- ==============================================================================

DO $$
DECLARE
  v_user_a UUID := 'ffffffff-0000-0000-0000-00000000000a'::uuid;
  v_user_b UUID := 'ffffffff-0000-0000-0000-00000000000b'::uuid;
  v_res JSONB;
  v_xp_res JSONB;
  v_today_stats JSONB;
  v_exam_res JSONB;
  v_caught_spoof BOOLEAN := FALSE;
  v_caught_protect_id BOOLEAN := FALSE;
  v_caught_protect_created_at BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '>>> BẮT ĐẦU KIỂM THỬ MIGRATION 12 <<<';

  -- Khởi tạo 2 users tạm thời
  INSERT INTO auth.users (id, email, role, aud, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES
    (v_user_a, 'test_a@langua.local', 'authenticated', 'authenticated', '', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test User A"}', NOW(), NOW()),
    (v_user_b, 'test_b@langua.local', 'authenticated', 'authenticated', '', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Test User B"}', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, full_name, avatar_text)
  VALUES 
    (v_user_a, 'Test User A', 'TA'),
    (v_user_b, 'Test User B', 'TB')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- Giả lập phiên đăng nhập là User A
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_user_a, 'role', 'authenticated')::text, true);

  -- -------------------------------------------------------------
  -- TEST 1: claim_daily_checkin
  -- -------------------------------------------------------------
  -- Lần 1: Điểm danh thành công
  v_res := public.claim_daily_checkin();
  IF (v_res->>'success')::BOOLEAN <> TRUE OR (v_res->>'xp_gained')::INTEGER <> 20 THEN
    RAISE EXCEPTION 'TEST 1 Thất bại: claim_daily_checkin lần 1 không hợp lệ: %', v_res;
  END IF;
  RAISE NOTICE '✅ TEST 1.1: claim_daily_checkin lần 1 thành công: %', v_res;

  -- Lần 2: Báo đã điểm danh hôm nay
  v_res := public.claim_daily_checkin();
  IF (v_res->>'success')::BOOLEAN <> FALSE THEN
    RAISE EXCEPTION 'TEST 1 Thất bại: claim_daily_checkin lần 2 không bị chặn: %', v_res;
  END IF;
  RAISE NOTICE '✅ TEST 1.2: claim_daily_checkin lần 2 báo đã điểm danh đúng chuẩn: %', v_res;

  -- -------------------------------------------------------------
  -- TEST 2: award_xp (Cộng điểm, Idempotency, Anti-spoofing, Trần XP)
  -- -------------------------------------------------------------
  -- 2.1. Cộng điểm bình thường
  v_xp_res := public.award_xp('typing_attempt', 'type-run-1', v_user_a);
  IF (v_xp_res->>'success')::BOOLEAN <> TRUE OR (v_xp_res->>'xp_gained')::INTEGER <> 30 THEN
    RAISE EXCEPTION 'TEST 2.1 Thất bại: award_xp không thành công: %', v_xp_res;
  END IF;
  RAISE NOTICE '✅ TEST 2.1: award_xp thành công (+30 XP): %', v_xp_res;

  -- 2.2. Kiểm tra tính Idempotent với cùng reference_id
  v_xp_res := public.award_xp('typing_attempt', 'type-run-1', v_user_a);
  IF (v_xp_res->>'success')::BOOLEAN <> FALSE OR (v_xp_res->>'xp_gained')::INTEGER <> 0 THEN
    RAISE EXCEPTION 'TEST 2.2 Thất bại: award_xp không chặn lặp lại ref_id: %', v_xp_res;
  END IF;
  RAISE NOTICE '✅ TEST 2.2: award_xp Idempotent chặn thành công trùng lặp: %', v_xp_res;

  -- 2.3. Anti-spoofing: Người học A không được cấp XP cho người học B
  BEGIN
    PERFORM public.award_xp('stage_complete', 'spoof-ref', v_user_b);
  EXCEPTION WHEN OTHERS THEN
    v_caught_spoof := TRUE;
    RAISE NOTICE '✅ TEST 2.3: Anti-spoofing chặn thành công người học A cấp XP cho B (Thông điệp: %)', SQLERRM;
  END;
  IF NOT v_caught_spoof THEN
    RAISE EXCEPTION 'TEST 2.3 Thất bại: Người học A vẫn cấp được XP cho B!';
  END IF;

  -- -------------------------------------------------------------
  -- TEST 3: get_my_today_stats
  -- -------------------------------------------------------------
  -- Thêm 1 attempt luyện gõ để kiểm tra tính thời gian
  INSERT INTO public.typing_attempts (user_id, topic_id, wpm, accuracy, duration_seconds, xp_earned, completed_at)
  VALUES (v_user_a, 'topic-en-daily-1', 65.5, 98.0, 180, 30, NOW());

  v_today_stats := public.get_my_today_stats();
  IF (v_today_stats->>'today_xp')::INTEGER < 50 OR (v_today_stats->>'practice_time_minutes')::INTEGER < 3 THEN
    RAISE EXCEPTION 'TEST 3 Thất bại: get_my_today_stats thống kê sai: %', v_today_stats;
  END IF;
  RAISE NOTICE '✅ TEST 3: get_my_today_stats trả về dữ liệu chuẩn xác: %', v_today_stats;

  -- -------------------------------------------------------------
  -- TEST 4: submit_exam_attempt (Trắc nghiệm Listening / Reading)
  -- -------------------------------------------------------------
  v_exam_res := public.submit_exam_attempt(
    'read_cam18_p1',
    'practice',
    '[{"question_number": 1, "user_answer": "TRUE"}, {"question_number": 2, "user_answer": "NOT GIVEN"}]'::jsonb,
    450
  );
  IF v_exam_res->>'attempt_id' IS NULL OR (v_exam_res->>'total_questions')::INTEGER = 0 THEN
    RAISE EXCEPTION 'TEST 4 Thất bại: submit_exam_attempt trắc nghiệm không thành công: %', v_exam_res;
  END IF;
  RAISE NOTICE '✅ TEST 4: submit_exam_attempt trắc nghiệm thành công: %', v_exam_res;

  -- -------------------------------------------------------------
  -- TEST 5: submit_exam_attempt (Tự luận Writing / Speaking)
  -- -------------------------------------------------------------
  v_exam_res := public.submit_exam_attempt(
    'ielts_write_t2_sample',
    'practice',
    '[]'::jsonb,
    1500,
    'Some people believe that technology reduces human interaction. In my opinion, I completely agree with this view because...',
    NULL
  );
  IF v_exam_res->>'attempt_id' IS NULL OR (v_exam_res->>'skill') <> 'writing' THEN
    RAISE EXCEPTION 'TEST 5 Thất bại: submit_exam_attempt tự luận không thành công: %', v_exam_res;
  END IF;
  RAISE NOTICE '✅ TEST 5: submit_exam_attempt tự luận thành công: %', v_exam_res;

  -- -------------------------------------------------------------
  -- TEST 6: protect_profile_sensitive_fields (Trigger bảo vệ)
  -- -------------------------------------------------------------
  -- 6.1. Thử đổi ID tài khoản
  BEGIN
    UPDATE public.profiles
    SET id = 'ffffffff-0000-0000-0000-000000000099'::uuid
    WHERE id = v_user_a;
  EXCEPTION WHEN OTHERS THEN
    v_caught_protect_id := TRUE;
    RAISE NOTICE '✅ TEST 6.1: Trigger bảo vệ chặn thành công cố gắng đổi id (Thông điệp: %)', SQLERRM;
  END;
  IF NOT v_caught_protect_id THEN
    RAISE EXCEPTION 'TEST 6.1 Thất bại: Người học đổi được id tài khoản!';
  END IF;

  -- 6.2. Thử đổi created_at
  BEGIN
    UPDATE public.profiles
    SET created_at = NOW() - INTERVAL '100 days'
    WHERE id = v_user_a;
  EXCEPTION WHEN OTHERS THEN
    v_caught_protect_created_at := TRUE;
    RAISE NOTICE '✅ TEST 6.2: Trigger bảo vệ chặn thành công cố gắng đổi created_at (Thông điệp: %)', SQLERRM;
  END;
  IF NOT v_caught_protect_created_at THEN
    RAISE EXCEPTION 'TEST 6.2 Thất bại: Người học đổi được created_at!';
  END IF;

  RAISE NOTICE '🎉 TẤT CẢ CÁC BÀI TEST ĐỀU HOÀN TOÀN ĐẠT CHUẨN 100%! HỦY TRANSACTION ĐỂ DỌN SẠCH DỮ LIỆU.';
END $$;

-- Thống kê xác nhận lại trước khi ROLLBACK
SELECT 'Trạng thái kiểm thử hoàn tất thành công 100%' AS test_summary;

ROLLBACK;
