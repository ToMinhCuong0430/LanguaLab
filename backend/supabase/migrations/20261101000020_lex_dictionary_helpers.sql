-- Migration 20: Các hàm hỗ trợ tra cứu và hiển thị trang Từ điển (Word of the day, Featured words)
-- Dự án: Langua (Học ngoại ngữ & Luyện thi phi thương mại)

-- ====================================================================
-- 1. HÀM LẤY TỪ CỦA HÔM NAY (Ổn định theo ngày bằng md5)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.lex_word_of_the_day(
  p_language learning_language DEFAULT 'en',
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  lemma TEXT,
  ipa TEXT,
  part_of_speech TEXT,
  definition TEXT,
  level TEXT,
  example_sentence TEXT,
  example_translation TEXT,
  meaning_vi TEXT
)
LANGUAGE sql STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH candidate_senses AS (
    SELECT
      s.id AS sense_id,
      s.entry_id,
      s.part_of_speech,
      s.definition,
      s.level,
      e.lemma
    FROM public.lex_senses s
    JOIN public.lex_entries e ON e.id = s.entry_id
    WHERE e.language = p_language
      AND e.status = 'published'
      AND s.review_status = 'approved'
      AND s.level_system = 'cefr'
      AND s.level IN ('A1', 'A2', 'B1', 'B2')
      AND EXISTS (
        SELECT 1
        FROM public.lex_examples ex
        WHERE ex.sense_id = s.id
          AND ex.review_status = 'approved'
      )
    ORDER BY md5(e.lemma || p_date::text)
    LIMIT 1
  )
  SELECT
    c.lemma,
    (
      SELECT p.transcription
      FROM public.lex_pronunciations p
      WHERE p.entry_id = c.entry_id
        AND p.kind = 'ipa'
        AND p.transcription IS NOT NULL
      ORDER BY (p.accent = 'general') DESC, p.id
      LIMIT 1
    ) AS ipa,
    c.part_of_speech,
    c.definition,
    c.level,
    (
      SELECT ex.sentence
      FROM public.lex_examples ex
      WHERE ex.sense_id = c.sense_id
        AND ex.review_status = 'approved'
      ORDER BY ex.created_at
      LIMIT 1
    ) AS example_sentence,
    (
      SELECT ex.sentence_vi
      FROM public.lex_examples ex
      WHERE ex.sense_id = c.sense_id
        AND ex.review_status = 'approved'
      ORDER BY ex.created_at
      LIMIT 1
    ) AS example_translation,
    (
      SELECT t.translated_text
      FROM public.lex_translations t
      WHERE t.sense_id = c.sense_id
        AND t.language_code = 'vi'
        AND t.review_status = 'approved'
      LIMIT 1
    ) AS meaning_vi
  FROM candidate_senses c;
$$;

GRANT EXECUTE ON FUNCTION public.lex_word_of_the_day(learning_language, DATE) TO anon, authenticated;

-- ====================================================================
-- 2. HÀM LẤY DANH SÁCH TỪ NỔI BẬT THEO CẤP ĐỘ HOẶC NGẪU NHIÊN ỔN ĐỊNH
-- ====================================================================
CREATE OR REPLACE FUNCTION public.lex_featured_words(
  p_language learning_language DEFAULT 'en',
  p_level TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 8
)
RETURNS TABLE (
  lemma TEXT,
  part_of_speech TEXT,
  definition TEXT,
  level TEXT,
  meaning_vi TEXT
)
LANGUAGE sql STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    e.lemma,
    s.part_of_speech,
    s.definition,
    s.level,
    (
      SELECT t.translated_text
      FROM public.lex_translations t
      WHERE t.sense_id = s.id
        AND t.language_code = 'vi'
        AND t.review_status = 'approved'
      LIMIT 1
    ) AS meaning_vi
  FROM public.lex_senses s
  JOIN public.lex_entries e ON e.id = s.entry_id
  WHERE e.language = p_language
    AND e.status = 'published'
    AND s.review_status = 'approved'
    AND (
      (p_level IS NOT NULL AND s.level = p_level)
      OR (p_level IS NULL AND s.level_system = 'cefr' AND s.level IN ('A1', 'A2', 'B1', 'B2'))
    )
    AND EXISTS (
      SELECT 1
      FROM public.lex_examples ex
      WHERE ex.sense_id = s.id
        AND ex.review_status = 'approved'
    )
  ORDER BY md5(e.lemma || CURRENT_DATE::text)
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 8), 1), 20);
$$;

GRANT EXECUTE ON FUNCTION public.lex_featured_words(learning_language, TEXT, INTEGER) TO anon, authenticated;

COMMENT ON FUNCTION public.lex_word_of_the_day IS 'Trả về từ vựng của hôm nay ổn định theo ngày (A1-B2, có ví dụ và nghĩa đã duyệt).';
COMMENT ON FUNCTION public.lex_featured_words IS 'Trả về danh sách từ vựng nổi bật theo cấp độ (tối đa 20 từ) ổn định theo ngày.';
