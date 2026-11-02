-- Test 03: Kiểm thử các hàm hỗ trợ tra từ điển (lex_word_of_the_day, lex_featured_words)
BEGIN;
SELECT plan(6);

-- 1. Kiểm tra quyền thực thi hàm cho anonymous
SELECT has_function('public', 'lex_word_of_the_day', ARRAY['learning_language', 'date'], 'Hàm lex_word_of_the_day phải tồn tại');
SELECT has_function('public', 'lex_featured_words', ARRAY['learning_language', 'text', 'integer'], 'Hàm lex_featured_words phải tồn tại');

-- 2. Đổi vai trò sang anon (khách)
SET LOCAL ROLE anon;

-- 3. Khách gọi được hàm lex_word_of_the_day
SELECT lives_ok(
  $$ SELECT * FROM public.lex_word_of_the_day('en', CURRENT_DATE) $$,
  'Khách (anon) gọi được hàm lex_word_of_the_day mà không bị lỗi'
);

-- 4. Khách gọi được hàm lex_featured_words
SELECT lives_ok(
  $$ SELECT * FROM public.lex_featured_words('en', NULL, 5) $$,
  'Khách (anon) gọi được hàm lex_featured_words mà không bị lỗi'
);

-- 5. Giới hạn p_limit: truyền số lớn hơn 20 vẫn không vượt quá 20
SELECT ok(
  (SELECT count(*) FROM public.lex_featured_words('en', NULL, 100)) <= 20,
  'lex_featured_words giới hạn tối đa 20 dòng ngay cả khi truyền p_limit = 100'
);

-- 6. Không lộ mục từ nháp: tạo thử entry nháp (draft) bằng quyền admin rồi kiểm tra anon không thấy
SET LOCAL ROLE postgres;

INSERT INTO public.lex_entries (id, language, entry_type, lemma, status)
VALUES ('e0000000-0000-0000-0000-000000000099', 'en', 'word', 'supersecretworddraft', 'draft')
ON CONFLICT DO NOTHING;

INSERT INTO public.lex_senses (entry_id, sense_order, part_of_speech, definition, level_system, level, review_status)
VALUES ('e0000000-0000-0000-0000-000000000099', 1, 'noun', 'a draft definition', 'cefr', 'A1', 'approved')
ON CONFLICT DO NOTHING;

SET LOCAL ROLE anon;

SELECT is_empty(
  $$ SELECT * FROM public.lex_featured_words('en', 'A1', 20) WHERE lemma = 'supersecretworddraft' $$,
  'lex_featured_words không trả về mục từ có status draft'
);

SELECT * FROM finish();
ROLLBACK;
