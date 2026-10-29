-- Migration 13: Analytics tiến độ, bài kiểm tra đầu vào (diagnostic) và lộ trình học (study plan)
-- Dự án: Langua (Học ngoại ngữ & Luyện thi phi thương mại)
--
-- Phần 1. Sửa dữ liệu nguồn của analytics
--   - submit_exam_attempt trước đây so đáp án theo UUID trong khi frontend gửi số thứ tự câu,
--     nên mọi câu đều bị lưu là chưa trả lời / sai; band lại tra ngưỡng của bài 40 câu cho điểm thô
--     của bài ngắn. Nay khớp theo UUID hoặc số câu và quy đổi band theo tỷ lệ trên thang 40.
-- Phần 2. Bảng diagnostic_attempts, study_plans, study_plan_items (+ RLS).
-- Phần 3. RPC: get_my_progress, get_diagnostic_questions, submit_diagnostic,
--          create_study_plan, set_study_item_done.

-- ====================================================================
-- PHẦN 1: QUY ĐỔI BAND VÀ SỬA submit_exam_attempt
-- ====================================================================

-- Quy đổi điểm thô sang band IELTS: scale về thang 40 câu rồi tra bảng Listening / Reading Academic
CREATE OR REPLACE FUNCTION public.ielts_band_from_raw(p_raw INTEGER, p_total INTEGER, p_skill TEXT)
RETURNS NUMERIC(3, 1) AS $$
DECLARE
  s INTEGER;
BEGIN
  IF p_total IS NULL OR p_total <= 0 THEN
    RETURN NULL;
  END IF;
  s := round(p_raw::numeric / p_total * 40);
  IF p_skill = 'listening' THEN
    RETURN CASE
      WHEN s >= 39 THEN 9.0 WHEN s >= 37 THEN 8.5 WHEN s >= 35 THEN 8.0 WHEN s >= 32 THEN 7.5
      WHEN s >= 30 THEN 7.0 WHEN s >= 26 THEN 6.5 WHEN s >= 23 THEN 6.0 WHEN s >= 18 THEN 5.5
      WHEN s >= 16 THEN 5.0 WHEN s >= 13 THEN 4.5 WHEN s >= 10 THEN 4.0 WHEN s >= 6 THEN 3.5
      ELSE 3.0 END;
  END IF;
  RETURN CASE
    WHEN s >= 39 THEN 9.0 WHEN s >= 37 THEN 8.5 WHEN s >= 35 THEN 8.0 WHEN s >= 33 THEN 7.5
    WHEN s >= 30 THEN 7.0 WHEN s >= 27 THEN 6.5 WHEN s >= 23 THEN 6.0 WHEN s >= 19 THEN 5.5
    WHEN s >= 15 THEN 5.0 WHEN s >= 13 THEN 4.5 WHEN s >= 10 THEN 4.0 WHEN s >= 6 THEN 3.5
    ELSE 3.0 END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

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
      -- Khớp theo UUID câu hỏi hoặc theo số thứ tự câu (frontend gửi question_number)
      -- Hỗ trợ format array [{"question_id": "...", "question_number": 1, "user_answer": "..."}] hoặc object {"<id|số câu>": "ans"}
      v_user_answer := NULL;
      IF jsonb_typeof(p_answers) = 'array' THEN
        SELECT (elem->>'user_answer') INTO v_user_answer
        FROM jsonb_array_elements(p_answers) AS elem
        WHERE elem->>'question_id' = v_item.id::text
           OR elem->>'question_number' = v_item.question_number::text
           OR elem->>'question_id' = v_item.question_number::text
        LIMIT 1;
      ELSIF jsonb_typeof(p_answers) = 'object' THEN
        v_user_answer := COALESCE(p_answers->>v_item.id::text, p_answers->>v_item.question_number::text);
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

    -- Quy đổi Band theo tỷ lệ đúng trên thang 40 câu (giống convertRawToBand ở frontend)
    v_band_score := public.ielts_band_from_raw(v_raw_score, v_total_questions, v_test.skill::text);

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
    speaking_audio_url
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
    p_audio_path
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
  SELECT COALESCE(SUM(xp_amount), 0)
  INTO v_daily_xp_count
  FROM public.xp_events
  WHERE user_id = v_user_id
    AND created_at >= v_today_start;

  IF v_daily_xp_count < 500 THEN
    v_awarded_xp := LEAST(v_base_xp, 500 - v_daily_xp_count);
    IF v_awarded_xp > 0 THEN
      INSERT INTO public.xp_events (user_id, xp_amount, source, reference_id)
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
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

-- ====================================================================
-- PHẦN 2: BẢNG DIAGNOSTIC & STUDY PLAN
-- ====================================================================

-- Kết quả bài kiểm tra đầu vào. Chấm ở server (submit_diagnostic), client không nhận đáp án đúng.
CREATE TABLE IF NOT EXISTS public.diagnostic_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skills TEXT[] NOT NULL CHECK (
    cardinality(skills) > 0 AND skills <@ ARRAY['listening', 'reading', 'writing', 'speaking']
  ),
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,      -- [{question_id, user_answer, is_correct}]
  self_ratings JSONB NOT NULL DEFAULT '{}'::jsonb, -- {"writing": [1-4,...], "speaking": [1-4,...]}
  results JSONB NOT NULL,                          -- {skills: {...}, categories: [...]}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_diagnostic_attempts_user ON public.diagnostic_attempts(user_id, created_at DESC);

-- Lộ trình học 7 / 14 / 30 ngày. Mỗi người chỉ có một lộ trình đang chạy.
CREATE TABLE IF NOT EXISTS public.study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  diagnostic_id UUID REFERENCES public.diagnostic_attempts(id) ON DELETE SET NULL,
  duration_days SMALLINT NOT NULL CHECK (duration_days IN (7, 14, 30)),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  focus JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Điểm yếu đã dùng để sinh lộ trình, xếp theo mức ưu tiên
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_study_plans_one_active
  ON public.study_plans(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_study_plans_user ON public.study_plans(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.study_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  day_number SMALLINT NOT NULL CHECK (day_number >= 1),
  sort_order SMALLINT NOT NULL DEFAULT 0,
  item_type TEXT NOT NULL CHECK (item_type IN ('practice', 'skill_building', 'mock_test', 'review')),
  skill ielts_skill,
  category TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT,
  estimated_minutes SMALLINT NOT NULL DEFAULT 15 CHECK (estimated_minutes > 0),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_study_plan_items_plan ON public.study_plan_items(plan_id, day_number, sort_order);

-- RLS: chỉ đọc dữ liệu của chính mình; mọi thao tác ghi đi qua RPC SECURITY DEFINER bên dưới
ALTER TABLE public.diagnostic_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plan_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own diagnostic attempts" ON public.diagnostic_attempts;
CREATE POLICY "Users can view own diagnostic attempts"
  ON public.diagnostic_attempts FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own study plans" ON public.study_plans;
CREATE POLICY "Users can view own study plans"
  ON public.study_plans FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own study plan items" ON public.study_plan_items;
CREATE POLICY "Users can view own study plan items"
  ON public.study_plan_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.study_plans p WHERE p.id = study_plan_items.plan_id AND p.user_id = auth.uid())
  );

-- ====================================================================
-- PHẦN 3: RPC
-- ====================================================================

-- Tên dạng bài thống nhất: ưu tiên category_tag, không có thì suy ra từ type
CREATE OR REPLACE FUNCTION public.question_category_label(p_tag TEXT, p_type question_type)
RETURNS TEXT AS $$
  SELECT COALESCE(
    NULLIF(trim(p_tag), ''),
    CASE p_type
      WHEN 'true_false_not_given' THEN 'True/False/Not Given'
      WHEN 'multiple_choice' THEN 'Multiple Choice'
      WHEN 'fill_blank' THEN 'Điền từ'
      WHEN 'matching' THEN 'Matching'
      ELSE initcap(replace(p_type::text, '_', ' '))
    END
  );
$$ LANGUAGE sql IMMUTABLE;

-- 3.1 Analytics "Tiến độ của tôi"
--   timeline   : band từng lượt làm bài theo thời gian (4 kỹ năng)
--   categories : accuracy theo dạng bài trên tất cả các lần làm (từ exam_answers)
--   weaknesses : dạng bài < 60% sau >= 5 lượt làm có dạng đó
CREATE OR REPLACE FUNCTION public.get_my_progress(p_since TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_since TIMESTAMPTZ := COALESCE(p_since, '-infinity'::timestamptz);
  v_result JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để xem tiến độ.' USING ERRCODE = '28000';
  END IF;

  WITH attempts AS (
    SELECT a.id, a.band_score, a.completed_at, a.mode, a.raw_score, a.total_questions,
           t.skill::text AS skill, t.title
    FROM public.exam_attempts a
    JOIN public.exam_tests t ON t.id = a.test_id
    WHERE a.user_id = v_uid AND a.completed_at >= v_since
  ),
  cats AS (
    SELECT at.skill,
           public.question_category_label(q.category_tag, q.type) AS category,
           count(*)::int AS total,
           count(*) FILTER (WHERE ans.is_correct)::int AS correct,
           count(DISTINCT ans.attempt_id)::int AS attempts,
           max(at.completed_at) AS last_at
    FROM public.exam_answers ans
    JOIN attempts at ON at.id = ans.attempt_id
    JOIN public.exam_questions q ON q.id = ans.question_id
    GROUP BY 1, 2
  ),
  cats_scored AS (
    SELECT *, round(correct::numeric / NULLIF(total, 0), 4) AS accuracy,
           (attempts >= 5 AND correct::numeric / NULLIF(total, 0) < 0.6) AS is_weak
    FROM cats
  ),
  latest AS (
    SELECT DISTINCT ON (skill) skill, band_score, completed_at
    FROM attempts WHERE band_score IS NOT NULL
    ORDER BY skill, completed_at DESC
  ),
  per_skill AS (
    SELECT skill, count(*)::int AS attempts,
           max(band_score) AS best_band,
           round(avg(band_score), 2) AS avg_band
    FROM attempts GROUP BY skill
  )
  SELECT jsonb_build_object(
    'timeline', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'attempt_id', id, 'skill', skill, 'band', band_score, 'completed_at', completed_at,
        'test_title', title, 'mode', mode
      ) ORDER BY completed_at)
      FROM attempts WHERE band_score IS NOT NULL
    ), '[]'::jsonb),
    'categories', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'skill', skill, 'category', category, 'total', total, 'correct', correct,
        'accuracy', accuracy, 'attempts', attempts, 'last_at', last_at, 'is_weak', is_weak
      ) ORDER BY accuracy ASC, total DESC)
      FROM cats_scored
    ), '[]'::jsonb),
    'weaknesses', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'skill', skill, 'category', category, 'accuracy', accuracy, 'attempts', attempts, 'total', total
      ) ORDER BY accuracy ASC)
      FROM cats_scored WHERE is_weak
    ), '[]'::jsonb),
    'skills', COALESCE((
      SELECT jsonb_object_agg(ps.skill, jsonb_build_object(
        'attempts', ps.attempts, 'best_band', ps.best_band, 'avg_band', ps.avg_band,
        'latest_band', l.band_score, 'latest_at', l.completed_at
      ))
      FROM per_skill ps LEFT JOIN latest l ON l.skill = ps.skill
    ), '{}'::jsonb),
    'totals', jsonb_build_object(
      'attempts', (SELECT count(*) FROM attempts),
      'answered', (SELECT COALESCE(sum(total), 0) FROM cats),
      'correct', (SELECT COALESCE(sum(correct), 0) FROM cats)
    ),
    'rules', jsonb_build_object('weak_accuracy', 0.6, 'weak_min_attempts', 5)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- 3.2 Câu hỏi cho bài kiểm tra đầu vào: mỗi kỹ năng Reading / Listening lấy ngẫu nhiên 1 đề,
--     tối đa p_per_skill câu. KHÔNG trả về đáp án đúng / giải thích.
CREATE OR REPLACE FUNCTION public.get_diagnostic_questions(p_skills TEXT[], p_per_skill INTEGER DEFAULT 6)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập.' USING ERRCODE = '28000';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'test_id', t.id, 'skill', t.skill, 'title', t.title,
    'passage_title', t.passage_title, 'passage_content', t.passage_content,
    'audio_title', t.audio_title, 'audio_script', t.audio_script, 'audio_url', t.audio_url,
    'questions', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', q.id, 'number', q.question_number, 'type', q.type, 'text', q.question_text,
        'options', q.options, 'category', public.question_category_label(q.category_tag, q.type)
      ) ORDER BY q.question_number)
      FROM (
        SELECT * FROM public.exam_questions
        WHERE test_id = t.id ORDER BY question_number LIMIT LEAST(GREATEST(p_per_skill, 1), 15)
      ) q
    )
  ) ORDER BY t.skill), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT DISTINCT ON (et.skill) et.*
    FROM public.exam_tests et
    WHERE et.exam_id = 'ielts'
      AND et.skill IN ('reading', 'listening')
      AND et.skill::text = ANY (p_skills)
      AND (et.is_published OR public.is_admin())
      AND EXISTS (SELECT 1 FROM public.exam_questions q WHERE q.test_id = et.id)
    ORDER BY et.skill, random()
  ) t;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

-- 3.3 Nộp bài kiểm tra đầu vào: chấm Reading / Listening ở server, Writing / Speaking dựa trên
--     tự đánh giá (thang 1–4) vì chưa có bài viết / ghi âm để chấm.
CREATE OR REPLACE FUNCTION public.submit_diagnostic(
  p_skills TEXT[],
  p_answers JSONB,       -- [{"question_id": "uuid", "user_answer": "..."}] (gửi cả câu bỏ trống)
  p_self_ratings JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_graded JSONB;
  v_skills JSONB := '{}'::jsonb;
  v_categories JSONB;
  v_results JSONB;
  v_id UUID;
  v_skill TEXT;
  v_ratings JSONB;
  v_avg NUMERIC;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập.' USING ERRCODE = '28000';
  END IF;
  IF p_skills IS NULL OR cardinality(p_skills) = 0
     OR NOT (p_skills <@ ARRAY['listening', 'reading', 'writing', 'speaking']) THEN
    RAISE EXCEPTION 'Danh sách kỹ năng không hợp lệ.' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(COALESCE(p_answers, '[]'::jsonb)) <> 'array' OR jsonb_array_length(COALESCE(p_answers, '[]'::jsonb)) > 60 THEN
    RAISE EXCEPTION 'Danh sách câu trả lời không hợp lệ.' USING ERRCODE = '22023';
  END IF;

  -- Chấm từng câu theo đáp án trong DB (chỉ câu thuộc kỹ năng đã chọn)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'question_id', q.id, 'skill', t.skill, 'category', public.question_category_label(q.category_tag, q.type),
    'user_answer', NULLIF(trim(elem->>'user_answer'), ''),
    'is_correct', COALESCE(lower(trim(elem->>'user_answer')) = lower(trim(q.correct_answer)), FALSE)
  )), '[]'::jsonb)
  INTO v_graded
  FROM jsonb_array_elements(COALESCE(p_answers, '[]'::jsonb)) elem
  JOIN public.exam_questions q ON q.id::text = elem->>'question_id'
  JOIN public.exam_tests t ON t.id = q.test_id
  WHERE t.skill::text = ANY (p_skills) AND t.skill IN ('reading', 'listening');

  -- Kết quả theo kỹ năng trắc nghiệm
  SELECT COALESCE(jsonb_object_agg(skill, jsonb_build_object(
    'source', 'test', 'correct', correct, 'total', total,
    'accuracy', round(correct::numeric / total, 4),
    'band', public.ielts_band_from_raw(correct, total, skill)
  )), '{}'::jsonb)
  INTO v_skills
  FROM (
    SELECT g->>'skill' AS skill,
           count(*) FILTER (WHERE (g->>'is_correct')::boolean)::int AS correct,
           count(*)::int AS total
    FROM jsonb_array_elements(v_graded) g GROUP BY 1
  ) s;

  -- Writing / Speaking: tự đánh giá 1–4, quy về band ước lượng 4.0–7.5
  FOREACH v_skill IN ARRAY ARRAY['writing', 'speaking'] LOOP
    IF v_skill = ANY (p_skills) THEN
      v_ratings := p_self_ratings->v_skill;
      IF jsonb_typeof(v_ratings) <> 'array' OR jsonb_array_length(v_ratings) = 0 THEN
        RAISE EXCEPTION 'Thiếu phần tự đánh giá %.', v_skill USING ERRCODE = '22023';
      END IF;
      SELECT avg(LEAST(GREATEST(r::numeric, 1), 4)) INTO v_avg FROM jsonb_array_elements_text(v_ratings) r;
      v_skills := v_skills || jsonb_build_object(v_skill, jsonb_build_object(
        'source', 'self', 'rating', round(v_avg, 2),
        'band', (round((4.0 + (v_avg - 1) / 3 * 3.5) * 2) / 2)::numeric(3, 1)
      ));
    END IF;
  END LOOP;

  -- Accuracy theo dạng bài
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'skill', skill, 'category', category, 'correct', correct, 'total', total,
    'accuracy', round(correct::numeric / total, 4)
  ) ORDER BY correct::numeric / total ASC), '[]'::jsonb)
  INTO v_categories
  FROM (
    SELECT g->>'skill' AS skill, g->>'category' AS category,
           count(*) FILTER (WHERE (g->>'is_correct')::boolean)::int AS correct,
           count(*)::int AS total
    FROM jsonb_array_elements(v_graded) g GROUP BY 1, 2
  ) c;

  v_results := jsonb_build_object('skills', v_skills, 'categories', v_categories);

  INSERT INTO public.diagnostic_attempts (user_id, skills, answers, self_ratings, results)
  VALUES (v_uid, p_skills, v_graded, COALESCE(p_self_ratings, '{}'::jsonb), v_results)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id, 'results', v_results);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

-- Nội dung nhiệm vụ luyện tập theo dạng bài
CREATE OR REPLACE FUNCTION public.study_focus_copy(p_skill TEXT, p_category TEXT)
RETURNS JSONB AS $$
DECLARE
  c TEXT := lower(COALESCE(p_category, ''));
BEGIN
  IF p_skill = 'writing' AND p_category IS NULL THEN
    RETURN jsonb_build_object('title', 'Viết 1 bài Writing và chấm bằng AI',
      'description', 'Lập dàn ý 5 phút, viết trong 40 phút, sau đó đọc nhận xét 4 tiêu chí và sửa các lỗi được đánh dấu.', 'minutes', 50);
  ELSIF p_skill = 'speaking' AND p_category IS NULL THEN
    RETURN jsonb_build_object('title', 'Ghi âm 1 bài Speaking đủ 3 Part',
      'description', 'Trả lời đủ thời gian từng Part, sửa transcript rồi chấm bằng AI; ghi lại 3 cụm từ muốn dùng tốt hơn.', 'minutes', 25);
  ELSIF p_skill = 'reading' AND p_category IS NULL THEN
    RETURN jsonb_build_object('title', 'Làm 1 đề Reading và đọc giải thích',
      'description', 'Làm 1 passage trong 20 phút, sau đó mở giải thích từng câu sai và tô lại câu dẫn chứng trong bài.', 'minutes', 30);
  ELSIF p_skill = 'listening' AND p_category IS NULL THEN
    RETURN jsonb_build_object('title', 'Làm 1 đề Listening và nghe lại đoạn sai',
      'description', 'Làm 1 section ở chế độ Luyện tập, sau đó nghe lại đúng đoạn audio chứa đáp án của từng câu sai.', 'minutes', 25);
  ELSIF c LIKE '%true%false%' OR c LIKE '%yes%no%' THEN
    RETURN jsonb_build_object('title', 'Luyện True/False/Not Given',
      'description', 'Gạch chân từ khoá của mỗi câu rồi tìm câu tương ứng trong bài. Chỉ chọn NOT GIVEN khi bài hoàn toàn không nhắc tới ý đó.', 'minutes', 25);
  ELSIF c LIKE '%heading%' THEN
    RETURN jsonb_build_object('title', 'Luyện Matching Headings',
      'description', 'Đọc câu đầu và câu cuối mỗi đoạn, tự tóm ý chính trong 5 từ trước khi nhìn danh sách tiêu đề.', 'minutes', 25);
  ELSIF c LIKE '%map%' OR c LIKE '%diagram%' OR c LIKE '%plan%' THEN
    RETURN jsonb_build_object('title', 'Luyện Map / Diagram Labeling',
      'description', 'Xác định điểm bắt đầu và hướng đi trước khi nghe; ghi chú các cụm chỉ vị trí như opposite, next to, behind.', 'minutes', 25);
  ELSIF c LIKE '%multiple%' OR c LIKE '%trắc nghiệm%' THEN
    RETURN jsonb_build_object('title', 'Luyện Multiple Choice',
      'description', 'Loại trừ phương án sai bằng dẫn chứng trong bài; cảnh giác với phương án lặp đúng từ trong bài nhưng sai ý.', 'minutes', 25);
  ELSIF c LIKE '%form%' OR c LIKE '%điền%' OR c LIKE '%completion%' OR c LIKE '%fill%' OR c LIKE '%note%' THEN
    RETURN jsonb_build_object('title', 'Luyện dạng điền từ',
      'description', 'Đoán loại từ cần điền (danh từ, số, tên riêng) trước khi đọc hoặc nghe; kiểm tra chính tả và giới hạn số từ.', 'minutes', 25);
  ELSIF c LIKE '%matching%' THEN
    RETURN jsonb_build_object('title', 'Luyện dạng Matching',
      'description', 'Đọc kỹ các lựa chọn trước, đánh dấu từ đồng nghĩa khi tìm trong bài; mỗi lựa chọn có thể không dùng hoặc dùng nhiều lần.', 'minutes', 25);
  END IF;
  RETURN jsonb_build_object('title', 'Luyện dạng ' || COALESCE(p_category, initcap(p_skill)),
    'description', 'Làm 1 bộ câu dạng này, sau đó đọc giải thích của mọi câu sai và ghi lại lý do sai.', 'minutes', 25);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Bài bổ trợ theo kỹ năng, dùng các mục học sẵn có của LanguaLab
CREATE OR REPLACE FUNCTION public.study_support_copy(p_skill TEXT)
RETURNS JSONB AS $$
  SELECT CASE p_skill
    WHEN 'reading' THEN jsonb_build_object('title', 'Đọc và dịch một bài', 'description',
      'Đọc 1 bài ở mục Đọc & Dịch, tra 5 từ mới và tóm tắt nội dung bằng 2 câu tiếng Anh.', 'link', '/doc-dich', 'minutes', 20)
    WHEN 'listening' THEN jsonb_build_object('title', 'Nghe chép chính tả', 'description',
      'Chọn 1 video hoặc podcast, nghe và chép lại 2 phút đầu rồi so với phụ đề.', 'link', '/video-podcast', 'minutes', 20)
    WHEN 'writing' THEN jsonb_build_object('title', 'Ôn một điểm ngữ pháp', 'description',
      'Học 1 điểm ngữ pháp và viết 5 câu áp dụng vào chủ đề Writing gần nhất.', 'link', '/ngu-phap', 'minutes', 15)
    ELSE jsonb_build_object('title', 'Luyện phản xạ câu', 'description',
      'Luyện 20 câu mẫu ở mục Gõ câu, đọc to từng câu sau khi gõ để tăng phản xạ nói.', 'link', '/go-cau', 'minutes', 15)
  END;
$$ LANGUAGE sql IMMUTABLE;

-- 3.4 Tạo lộ trình 7 / 14 / 30 ngày dựa trên điểm yếu (từ bài đầu vào và/hoặc lịch sử làm bài).
--     Lộ trình đang chạy (nếu có) được lưu trữ, không bị xoá.
CREATE OR REPLACE FUNCTION public.create_study_plan(p_duration INTEGER, p_diagnostic_id UUID DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_diag_results JSONB := '{}'::jsonb; -- Kết quả bài đầu vào (rỗng nếu không dùng)
  v_focus JSONB;
  v_count INTEGER;
  v_plan_id UUID;
  v_day INTEGER;
  v_f JSONB;
  v_copy JSONB;
  v_support JSONB;
  v_weakest_skill TEXT;
  v_order SMALLINT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập.' USING ERRCODE = '28000';
  END IF;
  IF p_duration NOT IN (7, 14, 30) THEN
    RAISE EXCEPTION 'Lộ trình chỉ hỗ trợ 7, 14 hoặc 30 ngày.' USING ERRCODE = '22023';
  END IF;
  IF p_diagnostic_id IS NOT NULL THEN
    SELECT results INTO v_diag_results FROM public.diagnostic_attempts WHERE id = p_diagnostic_id AND user_id = v_uid;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Không tìm thấy bài kiểm tra đầu vào.' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  -- Gom điểm yếu: (1) dạng bài < 70% trong bài đầu vào, (2) Writing/Speaking tự đánh giá < 6.0,
  -- (3) điểm yếu cố định từ lịch sử (< 60% sau >= 5 lượt). Lấy 4 mục yếu nhất.
  WITH candidates AS (
    SELECT c->>'skill' AS skill, c->>'category' AS category, (c->>'accuracy')::numeric AS score, 'diagnostic' AS source
    FROM jsonb_array_elements(COALESCE(v_diag_results->'categories', '[]'::jsonb)) c
    WHERE (c->>'accuracy')::numeric < 0.7
    UNION ALL
    SELECT s.key, NULL, (s.value->>'band')::numeric / 9, 'diagnostic'
    FROM jsonb_each(COALESCE(v_diag_results->'skills', '{}'::jsonb)) s
    WHERE s.value->>'source' = 'self' AND (s.value->>'band')::numeric < 6.0
    UNION ALL
    SELECT t.skill::text, public.question_category_label(q.category_tag, q.type),
           count(*) FILTER (WHERE ans.is_correct)::numeric / count(*), 'history'
    FROM public.exam_answers ans
    JOIN public.exam_attempts a ON a.id = ans.attempt_id
    JOIN public.exam_tests t ON t.id = a.test_id
    JOIN public.exam_questions q ON q.id = ans.question_id
    WHERE a.user_id = v_uid
    GROUP BY 1, 2
    HAVING count(DISTINCT ans.attempt_id) >= 5 AND count(*) FILTER (WHERE ans.is_correct)::numeric / count(*) < 0.6
  ),
  ranked AS (
    SELECT DISTINCT ON (skill, COALESCE(category, '')) skill, category, score, source
    FROM candidates ORDER BY skill, COALESCE(category, ''), score ASC
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object('skill', skill, 'category', category, 'score', round(score, 4), 'source', source)
                            ORDER BY score ASC), '[]'::jsonb)
  INTO v_focus
  FROM (SELECT * FROM ranked ORDER BY score ASC LIMIT 4) r;

  -- Ít hơn 3 trọng tâm: bổ sung kỹ năng có band thấp nhất (từ bài đầu vào, hoặc band trung bình
  -- trong lịch sử nếu không dùng bài đầu vào) để các ngày luân phiên, không lặp một bài suốt lộ trình
  IF jsonb_array_length(v_focus) < 3 THEN
    SELECT v_focus || COALESCE(jsonb_agg(x ORDER BY (x->>'score')::numeric ASC), '[]'::jsonb)
    INTO v_focus
    FROM (
      SELECT jsonb_build_object('skill', s.skill, 'category', NULL, 'score', round(s.band / 9, 4), 'source', 'balanced') AS x
      FROM (
        SELECT d.key AS skill, (d.value->>'band')::numeric AS band
        FROM jsonb_each(COALESCE(v_diag_results->'skills', '{}'::jsonb)) d
        UNION ALL
        SELECT t.skill::text, avg(a.band_score)
        FROM public.exam_attempts a JOIN public.exam_tests t ON t.id = a.test_id
        WHERE a.user_id = v_uid AND a.band_score IS NOT NULL AND NOT (v_diag_results ? 'skills')
        GROUP BY 1
      ) s
      WHERE NOT EXISTS (
        SELECT 1 FROM jsonb_array_elements(v_focus) f WHERE f->>'skill' = s.skill AND f->>'category' IS NULL
      )
      ORDER BY s.band ASC
      LIMIT 3 - jsonb_array_length(v_focus)
    ) y;
  END IF;

  -- Không có điểm yếu rõ ràng: lộ trình cân bằng theo kỹ năng có band thấp nhất trong bài đầu vào,
  -- hoặc cả 4 kỹ năng nếu chưa có dữ liệu
  IF jsonb_array_length(v_focus) = 0 THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object('skill', s.key, 'category', NULL, 'score', (s.value->>'band')::numeric / 9, 'source', 'balanced')
                              ORDER BY (s.value->>'band')::numeric ASC), '[]'::jsonb)
    INTO v_focus
    FROM jsonb_each(COALESCE(v_diag_results->'skills', '{}'::jsonb)) s;
  END IF;
  IF jsonb_array_length(v_focus) = 0 THEN
    v_focus := '[{"skill":"reading","category":null,"score":null,"source":"balanced"},
                 {"skill":"listening","category":null,"score":null,"source":"balanced"},
                 {"skill":"writing","category":null,"score":null,"source":"balanced"},
                 {"skill":"speaking","category":null,"score":null,"source":"balanced"}]'::jsonb;
  END IF;
  v_count := jsonb_array_length(v_focus);
  v_weakest_skill := v_focus->0->>'skill';

  UPDATE public.study_plans SET status = 'archived', archived_at = NOW()
  WHERE user_id = v_uid AND status = 'active';

  INSERT INTO public.study_plans (user_id, diagnostic_id, duration_days, focus)
  VALUES (v_uid, p_diagnostic_id, p_duration, v_focus)
  RETURNING id INTO v_plan_id;

  FOR v_day IN 1..p_duration LOOP
    v_order := 0;
    v_f := v_focus->((v_day - 1) % v_count);

    -- (1) Luyện dạng bài yếu, xoay vòng các điểm yếu theo ngày
    v_copy := public.study_focus_copy(v_f->>'skill', v_f->>'category');
    INSERT INTO public.study_plan_items (plan_id, day_number, sort_order, item_type, skill, category, title, description, link, estimated_minutes)
    VALUES (v_plan_id, v_day, v_order, 'practice', (v_f->>'skill')::ielts_skill, v_f->>'category',
            v_copy->>'title', v_copy->>'description', '/luyen-thi/ielts/' || (v_f->>'skill'), (v_copy->>'minutes')::smallint);
    v_order := v_order + 1;

    -- (2) Ngày lẻ: bổ trợ kỹ năng; ngày chẵn: ôn từ vựng
    IF v_day % 2 = 1 THEN
      v_support := public.study_support_copy(v_f->>'skill');
      INSERT INTO public.study_plan_items (plan_id, day_number, sort_order, item_type, skill, title, description, link, estimated_minutes)
      VALUES (v_plan_id, v_day, v_order, 'skill_building', (v_f->>'skill')::ielts_skill,
              v_support->>'title', v_support->>'description', v_support->>'link', (v_support->>'minutes')::smallint);
    ELSE
      INSERT INTO public.study_plan_items (plan_id, day_number, sort_order, item_type, title, description, link, estimated_minutes)
      VALUES (v_plan_id, v_day, v_order, 'skill_building', 'Ôn từ vựng đến hạn',
              'Ôn các từ đến hạn theo lịch lặp lại ngắt quãng và thêm 5 từ mới gặp trong bài luyện hôm trước.', '/tu-vung', 10);
    END IF;
    v_order := v_order + 1;

    -- (3) Cuối mỗi tuần và ngày cuối: thi thử kỹ năng yếu nhất + xem lại tiến độ
    IF v_day % 7 = 0 OR v_day = p_duration THEN
      INSERT INTO public.study_plan_items (plan_id, day_number, sort_order, item_type, skill, title, description, link, estimated_minutes)
      VALUES (v_plan_id, v_day, v_order, 'mock_test', v_weakest_skill::ielts_skill,
              'Làm 1 đề ' || initcap(v_weakest_skill) || ' ở chế độ Thi thử',
              'Làm trọn đề trong thời gian quy định, không tra cứu; sau đó đọc giải thích mọi câu sai.',
              '/luyen-thi/ielts/' || v_weakest_skill, 60);
      INSERT INTO public.study_plan_items (plan_id, day_number, sort_order, item_type, title, description, link, estimated_minutes)
      VALUES (v_plan_id, v_day, v_order + 1, 'review', 'Xem lại tiến độ tuần ' || ceil(v_day / 7.0)::int,
              'Mở trang Tiến độ, so band với tuần trước và chọn 1 dạng bài cần ưu tiên cho tuần tới.', '/tien-do', 15);
    END IF;
  END LOOP;

  RETURN v_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

-- 3.5 Đánh dấu hoàn thành / bỏ đánh dấu một mục trong lộ trình của chính mình
CREATE OR REPLACE FUNCTION public.set_study_item_done(p_item_id UUID, p_done BOOLEAN)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_completed TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập.' USING ERRCODE = '28000';
  END IF;
  UPDATE public.study_plan_items i
  SET completed_at = CASE WHEN p_done THEN COALESCE(i.completed_at, NOW()) ELSE NULL END
  FROM public.study_plans p
  WHERE i.id = p_item_id AND p.id = i.plan_id AND p.user_id = auth.uid()
  RETURNING i.completed_at INTO v_completed;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy mục trong lộ trình của bạn.' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_completed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

REVOKE ALL ON FUNCTION public.get_my_progress(TIMESTAMPTZ) FROM anon;
REVOKE ALL ON FUNCTION public.get_diagnostic_questions(TEXT[], INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.submit_diagnostic(TEXT[], JSONB, JSONB) FROM anon;
REVOKE ALL ON FUNCTION public.create_study_plan(INTEGER, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.set_study_item_done(UUID, BOOLEAN) FROM anon;
