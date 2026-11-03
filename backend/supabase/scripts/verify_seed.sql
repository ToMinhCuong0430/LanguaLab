-- ==============================================================================
-- SCRIPT: verify_seed.sql
-- Mục đích: Kiểm tra số lượng và ràng buộc toàn vẹn của dữ liệu Seed sau khi áp dụng
-- CHỈ SELECT - Hoàn toàn không ghi/sửa dữ liệu.
-- ==============================================================================

-- 1. KIỂM TRA SỐ LƯỢNG TỪNG BẢNG SO VỚI KỲ VỌNG
SELECT 'vocab_levels' AS table_name, count(*) AS actual_count, 7 AS expected_count FROM public.vocab_levels
UNION ALL SELECT 'exams', count(*), 5 FROM public.exams
UNION ALL SELECT 'exam_skills', count(*), 4 FROM public.exam_skills
UNION ALL SELECT 'learning_stages', count(*), 25 FROM public.learning_stages
UNION ALL SELECT 'typing_topics', count(*), 8 FROM public.typing_topics
UNION ALL SELECT 'typing_sentences', count(*), 48 FROM public.typing_sentences
UNION ALL SELECT 'vocab_sets_system', count(*), 5 FROM public.vocab_sets WHERE user_id IS NULL
UNION ALL SELECT 'vocab_words', count(*), 50 FROM public.vocab_words
UNION ALL SELECT 'grammar_levels', count(*), 6 FROM public.grammar_levels
UNION ALL SELECT 'grammar_points', count(*), 24 FROM public.grammar_points
UNION ALL SELECT 'grammar_exercises', count(*), 28 FROM public.grammar_exercises
UNION ALL SELECT 'media_items', count(*), 4 FROM public.media_items
UNION ALL SELECT 'media_cues', count(*), 15 FROM public.media_cues
UNION ALL SELECT 'media_quiz_questions', count(*), 3 FROM public.media_quiz_questions
UNION ALL SELECT 'reading_items', count(*), 7 FROM public.reading_items
UNION ALL SELECT 'reading_sections', count(*), 12 FROM public.reading_sections
UNION ALL SELECT 'exam_tests', count(*), 5 FROM public.exam_tests
UNION ALL SELECT 'exam_questions', count(*), 20 FROM public.exam_questions
UNION ALL SELECT 'dictionary_entries', count(*), 2 FROM public.dictionary_entries;

-- 2. KIỂM TRA RÀNG BUỘC TOÀN VẸN VÀ CHẤT LƯỢNG NỘI DUNG (Mọi giá trị phải = 0)
SELECT 
  -- (a) Không có grammar_points nào bị rỗng level
  (SELECT count(*) FROM public.grammar_points WHERE level IS NULL OR trim(level) = '') AS invalid_grammar_points_level,

  -- (b) Không có bài tập nào thiếu đáp án hợp lệ theo question_type
  (SELECT count(*) FROM public.grammar_exercises 
   WHERE (question_type = 'multiple_choice' AND (correct_index IS NULL OR jsonb_array_length(options) < 2))
      OR (question_type = 'fill_blank' AND (correct_answer IS NULL OR length(trim(correct_answer)) = 0))
      OR (question_type = 'word_order' AND (correct_order IS NULL OR scrambled_words IS NULL))
  ) AS invalid_grammar_exercises,

  -- (c) Tổng số ghi chú explanation_notes trong 24 grammar_points (kỳ vọng: 40)
  (SELECT sum(jsonb_array_length(explanation_notes)) FROM public.grammar_points) AS total_explanation_notes,

  -- (d) Tổng số bẫy pitfalls trong 24 grammar_points (kỳ vọng: 24)
  (SELECT sum(jsonb_array_length(common_mistakes)) FROM public.grammar_points) AS total_common_mistakes,

  -- (e) Số bài tập word_order có đủ cả scrambled_words và correct_order (kỳ vọng: 6)
  (SELECT count(*) FROM public.grammar_exercises WHERE question_type = 'word_order' AND scrambled_words IS NOT NULL AND correct_order IS NOT NULL) AS valid_word_order_exercises;

-- 3. KIỂM TRA TÍNH DUY NHẤT (IDEMPOTENCY - Không bị nhân đôi dòng)
SELECT 'duplicate_typing_sentences' AS check_name, count(*) AS duplicate_groups
FROM (
  SELECT topic_id, sort_order, count(*) 
  FROM public.typing_sentences 
  GROUP BY topic_id, sort_order 
  HAVING count(*) > 1
) sub
UNION ALL
SELECT 'duplicate_media_cues', count(*)
FROM (
  SELECT media_id, sort_order, count(*) 
  FROM public.media_cues 
  GROUP BY media_id, sort_order 
  HAVING count(*) > 1
) sub
UNION ALL
SELECT 'duplicate_reading_sections', count(*)
FROM (
  SELECT reading_id, sort_order, count(*) 
  FROM public.reading_sections 
  GROUP BY reading_id, sort_order 
  HAVING count(*) > 1
) sub
UNION ALL
SELECT 'duplicate_exam_questions', count(*)
FROM (
  SELECT test_id, question_number, count(*) 
  FROM public.exam_questions 
  GROUP BY test_id, question_number 
  HAVING count(*) > 1
) sub;
