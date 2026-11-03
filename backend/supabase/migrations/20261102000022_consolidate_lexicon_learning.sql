-- Migration 22: Chuyển đổi và hợp nhất Hệ thống Học từ vựng sang Canonical Lexicon (SM-2 & SRS)
--
-- Mục tiêu:
-- 1. Đưa lex_entries & lex_senses thành nguồn dữ liệu từ điển chuẩn (canonical).
-- 2. Tạo bảng user_sense_progress để lưu tiến trình học lặp lại ngắt quãng (SRS) trực tiếp trên từng nghĩa (lex_senses).
-- 3. Mở rộng vocab_words, user_saved_words, pronunciation_recordings tham chiếu sang lex_entries và lex_senses.
-- 4. Backfill dữ liệu có kiểm soát đa nghĩa (polysemy-safe): CHỈ gán sense_id khi từ chỉ có đúng 1 nghĩa hoặc từ loại đơn nhất; tuyệt đối không gán tùy tiện khi từ đa nghĩa.
-- 5. Cung cấp RPC review_lex_sense(p_sense_id, p_rating) và cập nhật review_word() để đồng bộ 2 chiều.
-- 6. Tái tạo các View thống kê words_due_today, user_vocab_levels_summary, daily_user_stats, weekly_user_summary hợp nhất dữ liệu mới và cũ mà KHÔNG làm mất dữ liệu lịch sử.

-- ====================================================================
-- PHẦN 1: BẢNG TIẾN TRÌNH HỌC TỪNG NGHĨA (user_sense_progress)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.user_sense_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sense_id UUID NOT NULL REFERENCES public.lex_senses(id) ON DELETE CASCADE,
  easiness_factor NUMERIC(4, 2) NOT NULL DEFAULT 2.50 CHECK (easiness_factor >= 1.30),
  repetition_count INTEGER NOT NULL DEFAULT 0 CHECK (repetition_count >= 0),
  interval_days INTEGER NOT NULL DEFAULT 1 CHECK (interval_days >= 1),
  correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
  incorrect_count INTEGER NOT NULL DEFAULT 0 CHECK (incorrect_count >= 0),
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_sense UNIQUE (user_id, sense_id)
);

CREATE INDEX IF NOT EXISTS idx_user_sense_progress_user_due 
  ON public.user_sense_progress(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_user_sense_progress_sense 
  ON public.user_sense_progress(sense_id);
CREATE INDEX IF NOT EXISTS idx_user_sense_progress_user 
  ON public.user_sense_progress(user_id);

CREATE OR REPLACE TRIGGER tr_user_sense_progress_updated_at
  BEFORE UPDATE ON public.user_sense_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Bật RLS cho user_sense_progress
ALTER TABLE public.user_sense_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sense progress" ON public.user_sense_progress;
CREATE POLICY "Users can view own sense progress"
  ON public.user_sense_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sense progress" ON public.user_sense_progress;
CREATE POLICY "Users can insert own sense progress"
  ON public.user_sense_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sense progress" ON public.user_sense_progress;
CREATE POLICY "Users can update own sense progress"
  ON public.user_sense_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sense progress" ON public.user_sense_progress;
CREATE POLICY "Users can delete own sense progress"
  ON public.user_sense_progress FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin full access user_sense_progress" ON public.user_sense_progress;
CREATE POLICY "Admin full access user_sense_progress"
  ON public.user_sense_progress FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ====================================================================
-- PHẦN 2: MỞ RỘNG CÁC BẢNG HIỆN HỮU LIÊN KẾT VỚI LEXICON
-- ====================================================================

-- 1. vocab_words
ALTER TABLE public.vocab_words
  ADD COLUMN IF NOT EXISTS lex_entry_id UUID REFERENCES public.lex_entries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lex_sense_id UUID REFERENCES public.lex_senses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vocab_words_lex_entry ON public.vocab_words(lex_entry_id);
CREATE INDEX IF NOT EXISTS idx_vocab_words_lex_sense ON public.vocab_words(lex_sense_id);

-- 2. user_saved_words
ALTER TABLE public.user_saved_words
  ADD COLUMN IF NOT EXISTS lex_entry_id UUID REFERENCES public.lex_entries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lex_sense_id UUID REFERENCES public.lex_senses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_saved_words_lex_entry ON public.user_saved_words(lex_entry_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_words_lex_sense ON public.user_saved_words(lex_sense_id);

-- 3. pronunciation_recordings
ALTER TABLE public.pronunciation_recordings
  ADD COLUMN IF NOT EXISTS lex_entry_id UUID REFERENCES public.lex_entries(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lex_sense_id UUID REFERENCES public.lex_senses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pronunciation_recordings_lex_entry ON public.pronunciation_recordings(lex_entry_id);
CREATE INDEX IF NOT EXISTS idx_pronunciation_recordings_lex_sense ON public.pronunciation_recordings(lex_sense_id);

-- ====================================================================
-- PHẦN 3: BACKFILL DỮ LIỆU AN TOÀN ĐA NGHĨA (POLYSEMY-SAFE)
-- ====================================================================

-- 1. Gán lex_entry_id cho vocab_words dựa theo chuẩn hóa lower(btrim(word))
UPDATE public.vocab_words vw
SET lex_entry_id = le.id
FROM public.lex_entries le
WHERE vw.lex_entry_id IS NULL
  AND le.language = 'en'
  AND le.entry_type = 'word'
  AND le.normalized_lemma = lower(btrim(vw.word));

-- 2. Polysemy-Safe: Gán lex_sense_id cho vocab_words
-- Trường hợp 2.1: Mục từ trong lex_entries CHỈ CÓ ĐÚNG 1 NGHĨA duy nhất
WITH single_sense_entries AS (
  SELECT entry_id, (ARRAY_AGG(id ORDER BY id))[1] AS sense_id
  FROM public.lex_senses
  GROUP BY entry_id
  HAVING COUNT(*) = 1
)
UPDATE public.vocab_words vw
SET lex_sense_id = sse.sense_id
FROM single_sense_entries sse
WHERE vw.lex_entry_id = sse.entry_id
  AND vw.lex_sense_id IS NULL;

-- Trường hợp 2.2: Mục từ có nhiều nghĩa nhưng chỉ có DUY NHẤT 1 NGHĨA khớp đúng từ loại (part_of_speech)
WITH unambiguous_pos_senses AS (
  SELECT ls.entry_id, ls.part_of_speech, MIN(ls.id) AS sense_id
  FROM public.lex_senses ls
  GROUP BY ls.entry_id, ls.part_of_speech
  HAVING COUNT(*) = 1
)
UPDATE public.vocab_words vw
SET lex_sense_id = ups.sense_id
FROM unambiguous_pos_senses ups
WHERE vw.lex_entry_id = ups.entry_id
  AND vw.lex_sense_id IS NULL
  AND lower(btrim(vw.part_of_speech)) = lower(btrim(ups.part_of_speech));

-- 3. Gán lex_entry_id cho user_saved_words
UPDATE public.user_saved_words usw
SET lex_entry_id = le.id
FROM public.lex_entries le
WHERE usw.lex_entry_id IS NULL
  AND le.language = 'en'
  AND le.entry_type = 'word'
  AND le.normalized_lemma = lower(btrim(usw.word));

-- 4. Gán lex_entry_id cho pronunciation_recordings
UPDATE public.pronunciation_recordings pr
SET lex_entry_id = le.id
FROM public.lex_entries le
WHERE pr.lex_entry_id IS NULL
  AND le.language = 'en'
  AND le.entry_type = 'word'
  AND le.normalized_lemma = lower(btrim(pr.word_text));

-- ====================================================================
-- PHẦN 4: HÀM RPC ÔN TẬP SRS (SuperMemo SM-2) CHO CANONICAL LEXICON
-- ====================================================================

CREATE OR REPLACE FUNCTION public.review_lex_sense(
  p_sense_id UUID,
  p_rating INTEGER -- 1: Again, 2: Hard, 3: Good, 4: Easy
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_curr RECORD;
  v_ef NUMERIC(4, 2) := 2.50;
  v_reps INTEGER := 0;
  v_interval INTEGER := 1;
  v_next_review TIMESTAMPTZ;
  v_xp_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để ôn tập từ vựng';
  END IF;

  IF p_rating < 1 OR p_rating > 4 THEN
    RAISE EXCEPTION 'Đánh giá rating phải từ 1 đến 4';
  END IF;

  -- Kiểm tra sự tồn tại của sense
  IF NOT EXISTS (SELECT 1 FROM public.lex_senses WHERE id = p_sense_id) THEN
    RAISE EXCEPTION 'Nghĩa từ vựng không tồn tại trong Lexicon';
  END IF;

  -- Lấy trạng thái hiện tại nếu có
  SELECT * INTO v_curr
  FROM public.user_sense_progress
  WHERE user_id = v_user_id AND sense_id = p_sense_id;

  IF FOUND THEN
    v_ef := v_curr.easiness_factor;
    v_reps := v_curr.repetition_count;
    v_interval := v_curr.interval_days;
  END IF;

  -- Thuật toán SM-2:
  IF p_rating >= 3 THEN -- Good (3) hoặc Easy (4)
    IF v_reps = 0 THEN
      v_interval := 1;
    ELSIF v_reps = 1 THEN
      v_interval := 6;
    ELSE
      v_interval := ROUND(v_interval * v_ef);
    END IF;
    v_reps := v_reps + 1;
  ELSE -- Again (1) hoặc Hard (2)
    v_reps := 0;
    v_interval := 1;
  END IF;

  -- Điều chỉnh Easiness Factor (EF)
  -- grade tương ứng từ 1..4 quy ra thang 2..5 của SM-2 chuẩn
  v_ef := v_ef + (0.1 - (5 - (p_rating + 1)) * (0.08 + (5 - (p_rating + 1)) * 0.02));
  v_ef := GREATEST(1.30, v_ef);

  v_next_review := NOW() + (v_interval || ' days')::INTERVAL;

  -- Cập nhật hoặc thêm mới tiến trình học nghĩa
  INSERT INTO public.user_sense_progress (
    user_id, sense_id, easiness_factor, repetition_count, interval_days,
    correct_count, incorrect_count, last_reviewed_at, next_review_at
  ) VALUES (
    v_user_id, p_sense_id, v_ef, v_reps, v_interval,
    CASE WHEN p_rating >= 3 THEN 1 ELSE 0 END,
    CASE WHEN p_rating < 3 THEN 1 ELSE 0 END,
    NOW(), v_next_review
  ) ON CONFLICT (user_id, sense_id) DO UPDATE SET
    easiness_factor = EXCLUDED.easiness_factor,
    repetition_count = EXCLUDED.repetition_count,
    interval_days = EXCLUDED.interval_days,
    correct_count = public.user_sense_progress.correct_count + EXCLUDED.correct_count,
    incorrect_count = public.user_sense_progress.incorrect_count + EXCLUDED.incorrect_count,
    last_reviewed_at = NOW(),
    next_review_at = EXCLUDED.next_review_at,
    updated_at = NOW();

  -- Thưởng 5 XP cho mỗi lần hoàn thành ôn tập
  v_xp_result := public.award_xp('word_review', p_sense_id::text, v_user_id);

  RETURN jsonb_build_object(
    'sense_id', p_sense_id,
    'next_review_at', v_next_review,
    'interval_days', v_interval,
    'repetition_count', v_reps,
    'easiness_factor', v_ef,
    'xp_earned', COALESCE((v_xp_result->>'xp_gained')::INTEGER, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.review_lex_sense(UUID, INTEGER) TO authenticated;

-- ====================================================================
-- PHẦN 5: CẬP NHẬT RPC review_word() TƯƠNG THÍCH NGƯỢC & ĐỒNG BỘ
-- ====================================================================

CREATE OR REPLACE FUNCTION public.review_word(
  p_word_id UUID,
  p_rating INTEGER -- 1: Again, 2: Hard, 3: Good, 4: Easy
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_curr RECORD;
  v_ef NUMERIC(4, 2) := 2.50;
  v_reps INTEGER := 0;
  v_interval INTEGER := 1;
  v_next_review TIMESTAMPTZ;
  v_xp_result JSONB;
  v_lex_sense_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để ôn từ';
  END IF;

  IF p_rating < 1 OR p_rating > 4 THEN
    RAISE EXCEPTION 'Đánh giá rating phải từ 1 đến 4';
  END IF;

  -- Lấy trạng thái hiện tại nếu có
  SELECT * INTO v_curr
  FROM public.user_word_progress
  WHERE user_id = v_user_id AND word_id = p_word_id;

  IF FOUND THEN
    v_ef := v_curr.easiness_factor;
    v_reps := v_curr.repetition_count;
    v_interval := v_curr.interval_days;
  END IF;

  -- Thuật toán SM-2:
  IF p_rating >= 3 THEN
    IF v_reps = 0 THEN
      v_interval := 1;
    ELSIF v_reps = 1 THEN
      v_interval := 6;
    ELSE
      v_interval := ROUND(v_interval * v_ef);
    END IF;
    v_reps := v_reps + 1;
  ELSE
    v_reps := 0;
    v_interval := 1;
  END IF;

  v_ef := v_ef + (0.1 - (5 - (p_rating + 1)) * (0.08 + (5 - (p_rating + 1)) * 0.02));
  v_ef := GREATEST(1.30, v_ef);

  v_next_review := NOW() + (v_interval || ' days')::INTERVAL;

  -- Cập nhật hoặc thêm mới tiến trình user_word_progress (legacy)
  INSERT INTO public.user_word_progress (
    user_id, word_id, easiness_factor, repetition_count, interval_days,
    correct_count, incorrect_count, last_reviewed_at, next_review_at
  ) VALUES (
    v_user_id, p_word_id, v_ef, v_reps, v_interval,
    CASE WHEN p_rating >= 3 THEN 1 ELSE 0 END,
    CASE WHEN p_rating < 3 THEN 1 ELSE 0 END,
    NOW(), v_next_review
  ) ON CONFLICT (user_id, word_id) DO UPDATE SET
    easiness_factor = EXCLUDED.easiness_factor,
    repetition_count = EXCLUDED.repetition_count,
    interval_days = EXCLUDED.interval_days,
    correct_count = public.user_word_progress.correct_count + EXCLUDED.correct_count,
    incorrect_count = public.user_word_progress.incorrect_count + EXCLUDED.incorrect_count,
    last_reviewed_at = NOW(),
    next_review_at = EXCLUDED.next_review_at,
    updated_at = NOW();

  -- Đồng bộ hai chiều sang user_sense_progress nếu từ vựng đã được gắn lex_sense_id
  SELECT lex_sense_id INTO v_lex_sense_id FROM public.vocab_words WHERE id = p_word_id;
  IF v_lex_sense_id IS NOT NULL THEN
    INSERT INTO public.user_sense_progress (
      user_id, sense_id, easiness_factor, repetition_count, interval_days,
      correct_count, incorrect_count, last_reviewed_at, next_review_at
    ) VALUES (
      v_user_id, v_lex_sense_id, v_ef, v_reps, v_interval,
      CASE WHEN p_rating >= 3 THEN 1 ELSE 0 END,
      CASE WHEN p_rating < 3 THEN 1 ELSE 0 END,
      NOW(), v_next_review
    ) ON CONFLICT (user_id, sense_id) DO UPDATE SET
      easiness_factor = EXCLUDED.easiness_factor,
      repetition_count = EXCLUDED.repetition_count,
      interval_days = EXCLUDED.interval_days,
      correct_count = public.user_sense_progress.correct_count + EXCLUDED.correct_count,
      incorrect_count = public.user_sense_progress.incorrect_count + EXCLUDED.incorrect_count,
      last_reviewed_at = NOW(),
      next_review_at = EXCLUDED.next_review_at,
      updated_at = NOW();
  END IF;

  v_xp_result := public.award_xp('word_review', p_word_id::text, v_user_id);

  RETURN jsonb_build_object(
    'word_id', p_word_id,
    'next_review_at', v_next_review,
    'interval_days', v_interval,
    'repetition_count', v_reps,
    'easiness_factor', v_ef,
    'xp_earned', COALESCE((v_xp_result->>'xp_gained')::INTEGER, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ====================================================================
-- PHẦN 6: TÁI TẠO CÁC VIEW THỐNG KÊ HỢP NHẤT
-- ====================================================================

-- 1. View words_due_today: Hợp nhất từ vựng legacy và Lexicon senses cần ôn hôm nay
CREATE OR REPLACE VIEW public.words_due_today AS
-- 1.1 Dữ liệu legacy từ user_word_progress
SELECT
  p.id AS progress_id,
  p.user_id,
  p.next_review_at,
  p.repetition_count,
  p.easiness_factor,
  p.interval_days,
  w.id AS word_id,
  w.lex_sense_id AS sense_id,
  w.word,
  w.phonetic,
  w.part_of_speech,
  w.meaning_vi,
  w.example_sentence,
  w.example_translation,
  w.audio_url,
  s.title AS set_title,
  CASE WHEN p.interval_days <= 1 OR p.incorrect_count > p.correct_count THEN true ELSE false END AS is_critical
FROM public.user_word_progress p
JOIN public.vocab_words w ON p.word_id = w.id
JOIN public.vocab_sets s ON w.set_id = s.id
WHERE p.next_review_at <= NOW()

UNION ALL

-- 1.2 Dữ liệu mới từ user_sense_progress (chỉ lấy những nghĩa chưa được tính trùng qua legacy)
SELECT
  usp.id AS progress_id,
  usp.user_id,
  usp.next_review_at,
  usp.repetition_count,
  usp.easiness_factor,
  usp.interval_days,
  NULL::UUID AS word_id,
  ls.id AS sense_id,
  le.lemma AS word,
  (SELECT pron.ipa FROM public.lex_pronunciations pron WHERE pron.entry_id = le.id LIMIT 1) AS phonetic,
  ls.part_of_speech::TEXT AS part_of_speech,
  COALESCE(
    (SELECT trans.gloss FROM public.lex_translations trans WHERE trans.sense_id = ls.id AND trans.target_lang = 'vi' LIMIT 1),
    ls.definition
  ) AS meaning_vi,
  (SELECT ex.sentence FROM public.lex_examples ex WHERE ex.sense_id = ls.id LIMIT 1) AS example_sentence,
  (SELECT ex.translation FROM public.lex_examples ex WHERE ex.sense_id = ls.id LIMIT 1) AS example_translation,
  (SELECT pron.audio_url FROM public.lex_pronunciations pron WHERE pron.entry_id = le.id AND pron.audio_url IS NOT NULL LIMIT 1) AS audio_url,
  COALESCE(ls.definition, 'Từ điển Lexicon') AS set_title,
  CASE WHEN usp.interval_days <= 1 OR usp.incorrect_count > usp.correct_count THEN true ELSE false END AS is_critical
FROM public.user_sense_progress usp
JOIN public.lex_senses ls ON usp.sense_id = ls.id
JOIN public.lex_entries le ON ls.entry_id = le.id
WHERE usp.next_review_at <= NOW()
  AND NOT EXISTS (
    -- Tránh hiển thị trùng lặp nếu nghĩa này đã liên kết với một vocab_word có trong user_word_progress đến hạn
    SELECT 1 FROM public.vocab_words vw
    JOIN public.user_word_progress uwp ON uwp.word_id = vw.id
    WHERE vw.lex_sense_id = usp.sense_id 
      AND uwp.user_id = usp.user_id 
      AND uwp.next_review_at <= NOW()
  );

-- 2. View user_vocab_levels_summary: Thống kê số từ đã học theo 7 cấp độ khó
CREATE OR REPLACE VIEW public.user_vocab_levels_summary AS
WITH legacy_counts AS (
  SELECT
    vl.level_number,
    uwp.user_id,
    COUNT(DISTINCT uwp.id)::INTEGER AS legacy_learned
  FROM public.vocab_levels vl
  JOIN public.vocab_sets vs ON vs.level_id = vl.id
  JOIN public.vocab_words vw ON vw.set_id = vs.id
  JOIN public.user_word_progress uwp ON uwp.word_id = vw.id
  GROUP BY vl.level_number, uwp.user_id
),
sense_counts AS (
  SELECT
    COALESCE(llm.vocab_level_number, 1) AS level_number,
    usp.user_id,
    COUNT(DISTINCT usp.id)::INTEGER AS sense_learned
  FROM public.user_sense_progress usp
  JOIN public.lex_senses ls ON ls.id = usp.sense_id
  LEFT JOIN public.lex_level_map llm 
    ON llm.level_system = ls.level_system AND llm.level = ls.level
  WHERE NOT EXISTS (
    -- Không đếm trùng lặp nếu đã tính trong legacy
    SELECT 1 FROM public.vocab_words vw
    JOIN public.user_word_progress uwp ON uwp.word_id = vw.id
    WHERE vw.lex_sense_id = usp.sense_id AND uwp.user_id = usp.user_id
  )
  GROUP BY COALESCE(llm.vocab_level_number, 1), usp.user_id
),
all_users_levels AS (
  SELECT 
    p.id AS user_id, 
    vl.level_number, 
    vl.code, 
    vl.title, 
    vl.color_tone, 
    vl.target_word_count AS total_target
  FROM public.profiles p
  CROSS JOIN public.vocab_levels vl
)
SELECT
  aul.level_number,
  aul.code,
  aul.title,
  aul.color_tone,
  aul.total_target,
  aul.user_id,
  (COALESCE(lc.legacy_learned, 0) + COALESCE(sc.sense_learned, 0))::INTEGER AS learned_count
FROM all_users_levels aul
LEFT JOIN legacy_counts lc ON lc.user_id = aul.user_id AND lc.level_number = aul.level_number
LEFT JOIN sense_counts sc ON sc.user_id = aul.user_id AND sc.level_number = aul.level_number;

-- 3. View daily_user_stats: Thống kê ngày kết hợp cả user_word_progress và user_sense_progress
CREATE OR REPLACE VIEW public.daily_user_stats AS
SELECT
  p.id AS user_id,
  CURRENT_DATE AS stat_date,
  
  -- Thời gian học hôm nay (phút)
  COALESCE(ROUND(SUM(ea.duration_seconds) / 60.0), 0)::INTEGER AS learning_time_minutes,
  
  -- Số từ mới thêm vào tiến trình hôm nay (hợp nhất từ cả legacy và lexicon senses)
  (
    SELECT (
      (SELECT COUNT(id) FROM public.user_word_progress WHERE user_id = p.id AND created_at >= CURRENT_DATE)
      +
      (SELECT COUNT(id) FROM public.user_sense_progress WHERE user_id = p.id AND created_at >= CURRENT_DATE)
    )::INTEGER
  ) AS new_words_learned,
  
  -- Số bài thi / bài luyện hoàn thành hôm nay
  COUNT(ea.id)::INTEGER AS completed_lessons,
  
  -- Tổng XP nhận được hôm nay
  (
    SELECT COALESCE(SUM(xp_amount), 0)::INTEGER 
    FROM public.xp_events 
    WHERE user_id = p.id AND created_at >= CURRENT_DATE
  ) AS xp_gained_today

FROM public.profiles p
LEFT JOIN public.exam_attempts ea ON p.id = ea.user_id AND ea.completed_at >= CURRENT_DATE
GROUP BY p.id;

-- 4. View weekly_user_summary: Thống kê tuần kết hợp cả user_word_progress và user_sense_progress
CREATE OR REPLACE VIEW public.weekly_user_summary AS
SELECT
  p.id AS user_id,
  DATE_TRUNC('week', NOW())::DATE AS week_start,
  
  -- Chuỗi streak hiện tại
  public.get_user_streak(p.id) AS current_streak_days,
  
  -- Tổng thời gian rèn luyện trong tuần (phút)
  COALESCE(ROUND(SUM(ea.duration_seconds) / 60.0), 0)::INTEGER AS total_weekly_minutes,
  
  -- Tổng số bài thi hoàn thành trong tuần
  COUNT(ea.id)::INTEGER AS completed_tests_count,
  
  -- Số từ vựng mới tiếp nạp trong tuần (hợp nhất)
  (
    SELECT (
      (SELECT COUNT(id) FROM public.user_word_progress WHERE user_id = p.id AND created_at >= DATE_TRUNC('week', NOW()))
      +
      (SELECT COUNT(id) FROM public.user_sense_progress WHERE user_id = p.id AND created_at >= DATE_TRUNC('week', NOW()))
    )::INTEGER
  ) AS weekly_words_learned,
  
  -- Tổng XP kiếm được trong tuần
  (
    SELECT COALESCE(SUM(xp_amount), 0)::INTEGER
    FROM public.xp_events
    WHERE user_id = p.id AND created_at >= DATE_TRUNC('week', NOW())
  ) AS weekly_xp

FROM public.profiles p
LEFT JOIN public.exam_attempts ea ON p.id = ea.user_id AND ea.completed_at >= DATE_TRUNC('week', NOW())
GROUP BY p.id;
