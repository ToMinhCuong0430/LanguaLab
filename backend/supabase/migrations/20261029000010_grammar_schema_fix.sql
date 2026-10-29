-- ====================================================================
-- Migration: 20261029000010_grammar_schema_fix.sql
-- Mục đích: Bổ sung bảng grammar_levels, mở rộng grammar_points và grammar_exercises
--           hỗ trợ đầy đủ 3 loại bài tập (multiple_choice, fill_blank, word_order)
-- ====================================================================

-- 1. BẢNG MỚI: grammar_levels (Lưu phân cấp trình độ ngữ pháp)
CREATE TABLE IF NOT EXISTS public.grammar_levels (
  language learning_language NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (language, code)
);

CREATE INDEX IF NOT EXISTS idx_grammar_levels_lang_order 
  ON public.grammar_levels(language, sort_order);

DROP TRIGGER IF EXISTS tr_grammar_levels_updated_at ON public.grammar_levels;
CREATE TRIGGER tr_grammar_levels_updated_at
  BEFORE UPDATE ON public.grammar_levels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS cho grammar_levels: Xem công khai, Admin chỉnh sửa
ALTER TABLE public.grammar_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Grammar levels are viewable by everyone" ON public.grammar_levels;
CREATE POLICY "Grammar levels are viewable by everyone"
  ON public.grammar_levels FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Grammar levels are manageable by admin" ON public.grammar_levels;
CREATE POLICY "Grammar levels are manageable by admin"
  ON public.grammar_levels FOR ALL
  USING (public.is_admin());

-- 2. MỞ RỘNG grammar_points: Thêm explanation_notes (JSONB)
ALTER TABLE public.grammar_points
  ADD COLUMN IF NOT EXISTS explanation_notes JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 3. MỞ RỘNG grammar_exercises: Thêm correct_index, correct_order, scrambled_words, hint
ALTER TABLE public.grammar_exercises
  ADD COLUMN IF NOT EXISTS correct_index INTEGER,
  ADD COLUMN IF NOT EXISTS correct_order JSONB,
  ADD COLUMN IF NOT EXISTS scrambled_words JSONB,
  ADD COLUMN IF NOT EXISTS hint TEXT;

-- Cho phép correct_answer DROP NOT NULL (vì câu word_order dùng correct_order)
ALTER TABLE public.grammar_exercises
  ALTER COLUMN correct_answer DROP NOT NULL;

-- Thêm CHECK constraint đảm bảo tính hợp lệ theo question_type
ALTER TABLE public.grammar_exercises
  DROP CONSTRAINT IF EXISTS chk_grammar_exercise_type_fields;

ALTER TABLE public.grammar_exercises
  ADD CONSTRAINT chk_grammar_exercise_type_fields CHECK (
    (question_type = 'multiple_choice' AND correct_index IS NOT NULL AND jsonb_array_length(options) >= 2) OR
    (question_type = 'fill_blank' AND correct_answer IS NOT NULL AND length(trim(correct_answer)) > 0) OR
    (question_type = 'word_order' AND correct_order IS NOT NULL AND scrambled_words IS NOT NULL)
  );

-- 4. CẬP NHẬT RPC submit_grammar_attempt ĐÁNH GIÁ CHÍNH XÁC CẢ 3 DẠNG BÀI
CREATE OR REPLACE FUNCTION public.submit_grammar_attempt(
  p_point_id TEXT,
  p_answers JSONB,
  p_duration_seconds INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_total_questions INTEGER := 0;
  v_correct_count INTEGER := 0;
  v_exercise RECORD;
  v_user_answer TEXT;
  v_expected_answer TEXT;
  v_score_percent NUMERIC(5, 2);
  v_xp_result JSONB;
  v_xp_earned INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để nộp bài ngữ pháp';
  END IF;

  FOR v_exercise IN 
    SELECT id, question_type, correct_answer, correct_index, options, correct_order
    FROM public.grammar_exercises 
    WHERE point_id = p_point_id 
    ORDER BY sort_order ASC
  LOOP
    v_total_questions := v_total_questions + 1;
    v_user_answer := TRIM(COALESCE(p_answers->>v_exercise.id, ''));

    IF v_exercise.question_type = 'multiple_choice' THEN
      IF v_exercise.options IS NOT NULL AND v_exercise.correct_index IS NOT NULL THEN
        v_expected_answer := TRIM(COALESCE(v_exercise.options->>v_exercise.correct_index, v_exercise.correct_answer, ''));
      ELSE
        v_expected_answer := TRIM(COALESCE(v_exercise.correct_answer, ''));
      END IF;
      IF LOWER(v_user_answer) = LOWER(v_expected_answer) OR v_user_answer = v_exercise.correct_index::TEXT THEN
        v_correct_count := v_correct_count + 1;
      END IF;

    ELSIF v_exercise.question_type = 'word_order' THEN
      IF v_exercise.correct_order IS NOT NULL THEN
        SELECT string_agg(elem, ' ') INTO v_expected_answer
        FROM jsonb_array_elements_text(v_exercise.correct_order) AS elem;
      ELSE
        v_expected_answer := TRIM(COALESCE(v_exercise.correct_answer, ''));
      END IF;
      IF LOWER(v_user_answer) = LOWER(TRIM(COALESCE(v_expected_answer, ''))) THEN
        v_correct_count := v_correct_count + 1;
      END IF;

    ELSE -- fill_blank hoặc các dạng khác
      v_expected_answer := TRIM(COALESCE(v_exercise.correct_answer, ''));
      IF LOWER(v_user_answer) = LOWER(v_expected_answer) THEN
        v_correct_count := v_correct_count + 1;
      END IF;
    END IF;
  END LOOP;

  IF v_total_questions = 0 THEN
    v_total_questions := GREATEST(1, jsonb_array_length(jsonb_path_query_array(p_answers, '$.*')));
    v_correct_count := v_total_questions;
  END IF;

  v_score_percent := ROUND((v_correct_count::NUMERIC / v_total_questions::NUMERIC) * 100, 2);

  IF v_score_percent >= 75 THEN
    v_xp_result := public.award_xp('grammar_attempt', p_point_id, v_user_id);
    v_xp_earned := COALESCE((v_xp_result->>'xp_gained')::INTEGER, 0);

    INSERT INTO public.user_grammar_progress (
      user_id, point_id, is_completed, best_score, completed_at
    ) VALUES (
      v_user_id, p_point_id, true, v_correct_count, NOW()
    ) ON CONFLICT (user_id, point_id) DO UPDATE SET
      is_completed = true,
      best_score = GREATEST(public.user_grammar_progress.best_score, EXCLUDED.best_score),
      completed_at = COALESCE(public.user_grammar_progress.completed_at, NOW()),
      updated_at = NOW();
  END IF;

  INSERT INTO public.grammar_attempts (
    user_id, point_id, score, total_questions, answers, duration_seconds
  ) VALUES (
    v_user_id, p_point_id, v_correct_count, v_total_questions, p_answers, GREATEST(0, p_duration_seconds)
  );

  RETURN jsonb_build_object(
    'score', v_correct_count,
    'total_questions', v_total_questions,
    'accuracy_percent', v_score_percent,
    'passed', (v_score_percent >= 75),
    'xp_earned', v_xp_earned
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
