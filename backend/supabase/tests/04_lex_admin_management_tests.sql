-- Test suite: Kiểm thử quyền hạn và quy tắc nghiệp vụ quản trị Lexicon (Migration 21)
-- Chạy: supabase test db

BEGIN;
SELECT plan(8);

-- 1. Hàm admin_lex_stats tồn tại
SELECT has_function(
  'public',
  'admin_lex_stats',
  'Hàm admin_lex_stats phải tồn tại'
);

-- 2. Hàm admin_set_sense_review tồn tại
SELECT has_function(
  'public',
  'admin_set_sense_review',
  ARRAY['uuid', 'text'],
  'Hàm admin_set_sense_review phải tồn tại'
);

-- 3. Hàm admin_set_translation_review tồn tại
SELECT has_function(
  'public',
  'admin_set_translation_review',
  ARRAY['uuid', 'text', 'text'],
  'Hàm admin_set_translation_review phải tồn tại'
);

-- 4. Hàm admin_set_example_review tồn tại
SELECT has_function(
  'public',
  'admin_set_example_review',
  ARRAY['uuid', 'text', 'text'],
  'Hàm admin_set_example_review phải tồn tại'
);

-- 5. Hàm admin_set_entry_status tồn tại
SELECT has_function(
  'public',
  'admin_set_entry_status',
  ARRAY['uuid', 'text'],
  'Hàm admin_set_entry_status phải tồn tại'
);

-- 6. Hàm admin_batch_set_entry_status tồn tại
SELECT has_function(
  'public',
  'admin_batch_set_entry_status',
  ARRAY['uuid[]', 'text'],
  'Hàm admin_batch_set_entry_status phải tồn tại'
);

-- 7. Chỉ mục idx_lex_senses_pos tồn tại
SELECT has_index(
  'public',
  'lex_senses',
  'idx_lex_senses_pos',
  'Chỉ mục idx_lex_senses_pos trên bảng lex_senses phải tồn tại'
);

-- 8. Người dùng anon không được gọi hàm admin_lex_stats
SET ROLE anon;
SELECT throws_ok(
  'SELECT public.admin_lex_stats()',
  '42501',
  NULL,
  'Anon không được quyền thực thi admin_lex_stats'
);

SELECT * FROM finish();
ROLLBACK;
