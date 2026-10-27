-- Migration 10: Chấm IELTS bằng RPC an toàn, thu hồi quyền ghi client, và siết RLS đọc nội dung chi tiết
-- Dự án: Langua (Học ngoại ngữ & Luyện thi phi thương mại)

-- ====================================================================
-- PHẦN 1: HÀM RPC CHẤM BÀI THI IELTS AN TOÀN (submit_exam_attempt)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.submit_exam_attempt(
  p_test_id TEXT,
  p_mode exam_mode,
  p_answers JSONB, -- Mảng các câu trả lời: [{"question_id": "uuid", "user_answer": "text"}, ...] hoặc map { "q_id": "ans" }
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
  v_xp_earned INTEGER := 0;
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
    -- Duyệt qua tất cả câu hỏi của đề thi từ cơ sở dữ liệu
    FOR v_item IN
      SELECT id, question_number, correct_answer, explanation
      FROM public.exam_questions
      WHERE test_id = p_test_id
      ORDER BY question_number ASC
    LOOP
      v_total_questions := v_total_questions + 1;
      
      -- Trích xuất câu trả lời của user từ p_answers
      -- Hỗ trợ format array [{"question_id": "...", "user_answer": "..."}] hoặc object {"<id>": "ans"}
      IF jsonb_typeof(p_answers) = 'array' THEN
        SELECT (elem->>'user_answer') INTO v_user_answer
        FROM jsonb_array_elements(p_answers) AS elem
        WHERE elem->>'question_id' = v_item.id::text;
      ELSIF jsonb_typeof(p_answers) = 'object' THEN
        v_user_answer := p_answers->>v_item.id::text;
      ELSE
        v_user_answer := NULL;
      END IF;

      -- So khớp đáp án (không phân biệt hoa thường, bỏ khoảng trắng thừa)
      IF v_user_answer IS NOT NULL AND
         lower(trim(v_user_answer)) = lower(trim(v_item.correct_answer)) THEN
        v_is_correct := TRUE;
        v_raw_score := v_raw_score + 1;
      ELSE
        v_is_correct := FALSE;
      END IF;

      -- Gom kết quả chi tiết từng câu
      v_results := v_results || jsonb_build_object(
        'question_id', v_item.id,
        'question_number', v_item.question_number,
        'user_answer', v_user_answer,
        'correct_answer', v_item.correct_answer,
        'is_correct', v_is_correct,
        'explanation', v_item.explanation
      );
    END LOOP;

    -- Quy đổi Band score chuẩn IELTS Listening / Reading
    -- Listening scale: 39-40: 9.0; 37-38: 8.5; 35-36: 8.0; 32-34: 7.5; 30-31: 7.0; 26-29: 6.5; 23-25: 6.0; 18-22: 5.5; 16-17: 5.0; 13-15: 4.5; 10-12: 4.0; <10: 3.5
    -- Reading Academic scale tương đương
    IF v_raw_score >= 39 THEN v_band_score := 9.0;
    ELSIF v_raw_score >= 37 THEN v_band_score := 8.5;
    ELSIF v_raw_score >= 35 THEN v_band_score := 8.0;
    ELSIF v_raw_score >= 33 THEN v_band_score := 7.5;
    ELSIF v_raw_score >= 30 THEN v_band_score := 7.0;
    ELSIF v_raw_score >= 27 THEN v_band_score := 6.5;
    ELSIF v_raw_score >= 23 THEN v_band_score := 6.0;
    ELSIF v_raw_score >= 19 THEN v_band_score := 5.5;
    ELSIF v_raw_score >= 15 THEN v_band_score := 5.0;
    ELSIF v_raw_score >= 13 THEN v_band_score := 4.5;
    ELSIF v_raw_score >= 10 THEN v_band_score := 4.0;
    ELSIF v_raw_score >= 8 THEN v_band_score := 3.5;
    ELSIF v_raw_score >= 6 THEN v_band_score := 3.0;
    ELSIF v_raw_score >= 4 THEN v_band_score := 2.5;
    ELSE v_band_score := 2.0;
    END IF;

    -- Tính điểm XP thưởng
    v_base_xp := 30 + (v_raw_score * 2);

  ELSE
    -- Kỹ năng Writing hoặc Speaking (Tự luận): Chưa có band ngay, chờ chấm
    v_raw_score := NULL;
    v_band_score := NULL;
    v_total_questions := COALESCE(v_test.total_questions, 1);
    v_base_xp := 25;
  END IF;

  -- 4. Chèn bản ghi vào public.exam_attempts
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
    created_at
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

  -- 6. Cộng XP chống gian lận (Idempotent và tuân thủ trần ngày 500 XP)
  SELECT COALESCE(SUM(amount), 0)
  INTO v_daily_xp_count
  FROM public.xp_events
  WHERE user_id = v_user_id
    AND created_at >= v_today_start;

  IF v_daily_xp_count < 500 THEN
    v_awarded_xp := LEAST(v_base_xp, 500 - v_daily_xp_count);
    IF v_awarded_xp > 0 THEN
      INSERT INTO public.xp_events (user_id, amount, source, ref_id)
      VALUES (v_user_id, v_awarded_xp, 'exam_attempt', v_attempt_id::text)
      ON CONFLICT DO NOTHING;
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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ====================================================================
-- PHẦN 2: THU HỒI QUYỀN GHI TRỰC TIẾP LÊN exam_attempts & exam_answers
-- ====================================================================

-- Thu hồi policy INSERT và UPDATE của client lên exam_attempts
DROP POLICY IF EXISTS "Users can insert own exam attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Users can update own exam attempts" ON public.exam_attempts;

-- Thu hồi quyền ALL trực tiếp của client lên exam_answers
DROP POLICY IF EXISTS "Users can manage own exam answers" ON public.exam_answers;

-- Thiết lập lại policy SELECT: Người dùng chỉ được xem bài làm của chính mình
CREATE POLICY "Users can view own exam answers"
  ON public.exam_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts ea
      WHERE ea.id = exam_answers.attempt_id
      AND ea.user_id = auth.uid()
    )
  );

-- ====================================================================
-- PHẦN 3: SIẾT POLICY ĐỌC NỘI DUNG CON (CHỈ ĐỌC KHI BẢN GHI CHA ĐÃ XUẤT BẢN HOẶC ADMIN)
-- ====================================================================

-- 1. typing_sentences -> typing_topics
DROP POLICY IF EXISTS "Typing sentences are viewable by everyone" ON public.typing_sentences;
CREATE POLICY "Typing sentences are viewable if topic published or admin"
  ON public.typing_sentences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.typing_topics tt
      WHERE tt.id = typing_sentences.topic_id
      AND (tt.is_published = true OR public.is_admin())
    )
  );

-- 2. grammar_exercises -> grammar_points
DROP POLICY IF EXISTS "Grammar exercises are viewable by everyone" ON public.grammar_exercises;
CREATE POLICY "Grammar exercises are viewable if point published or admin"
  ON public.grammar_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.grammar_points gp
      WHERE gp.id = grammar_exercises.point_id
      AND (gp.is_published = true OR public.is_admin())
    )
  );

-- 3. exam_questions -> exam_tests
DROP POLICY IF EXISTS "Exam questions are viewable by everyone" ON public.exam_questions;
CREATE POLICY "Exam questions are viewable if test published or admin"
  ON public.exam_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_tests et
      WHERE et.id = exam_questions.test_id
      AND (et.is_published = true OR public.is_admin())
    )
  );

-- 4. media_cues -> media_items
DROP POLICY IF EXISTS "Media cues are viewable by everyone" ON public.media_cues;
CREATE POLICY "Media cues are viewable if media published or admin"
  ON public.media_cues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.media_items mi
      WHERE mi.id = media_cues.media_id
      AND (mi.is_published = true OR public.is_admin())
    )
  );

-- 5. reading_sections -> reading_items
DROP POLICY IF EXISTS "Reading sections are viewable by everyone" ON public.reading_sections;
CREATE POLICY "Reading sections are viewable if reading published or admin"
  ON public.reading_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reading_items ri
      WHERE ri.id = reading_sections.reading_id
      AND (ri.is_published = true OR public.is_admin())
    )
  );
