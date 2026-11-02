-- verify_lexicon_schema.sql
-- Chạy sau khi đẩy migration 20261031000018 (SQL Editor hoặc psql).
-- Quy ước: các mục [A]..[F] và [H] phải trả về 0 dòng. Mục [G] chỉ để xem số liệu.

-- [A] Bảng lex_* chưa bật RLS  -> mong đợi 0 dòng
SELECT c.relname AS table_without_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname LIKE 'lex\_%'
  AND NOT c.relrowsecurity;

-- [B] Bảng lex_* có RLS nhưng không có policy nào -> mong đợi 0 dòng
SELECT c.relname AS table_without_policy
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p ON p.schemaname = 'public' AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname LIKE 'lex\_%'
GROUP BY c.relname
HAVING COUNT(p.policyname) = 0;

-- [C] anon có quyền khác SELECT trên bảng lex_* -> mong đợi 0 dòng
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'anon'
  AND table_schema = 'public'
  AND table_name LIKE 'lex\_%'
  AND privilege_type <> 'SELECT';

-- [D] anon đọc được bảng nội bộ (batches, raw_records, attributions, reports) -> mong đợi 0 dòng
SELECT table_name
FROM information_schema.role_table_grants
WHERE grantee = 'anon'
  AND table_schema = 'public'
  AND table_name IN ('lex_import_batches', 'lex_raw_records', 'lex_attributions', 'lex_reports');

-- [E] Hàm SECURITY DEFINER của lexicon thiếu search_path cố định -> mong đợi 0 dòng
SELECT p.proname AS function_without_search_path
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.proname LIKE 'lex\_%'
  AND p.prosecdef
  AND (p.proconfig IS NULL OR p.proconfig::TEXT NOT LIKE '%search_path%');

-- [F] Dữ liệu vi phạm quy tắc xuất bản -> mong đợi 0 dòng
--     (mục từ published mà không có nghĩa nào được duyệt)
SELECT e.id, e.lemma
FROM public.lex_entries e
WHERE e.status = 'published'
  AND NOT EXISTS (
    SELECT 1 FROM public.lex_senses s
    WHERE s.entry_id = e.id AND s.review_status = 'approved'
  );

-- [H] Nghĩa có cấp độ nhưng chưa có ánh xạ về thang 1-7 -> mong đợi 0 dòng
--     (chỉ chạy được sau migration 20261031000019)
SELECT s.id, s.level_system, s.level
FROM public.lex_senses s
LEFT JOIN public.lex_level_map m ON m.level_system = s.level_system AND m.level = s.level
WHERE s.level IS NOT NULL AND m.level IS NULL;

-- [G] Số liệu tổng quan (chỉ để xem)
SELECT 'lex_entries' AS table_name, COUNT(*) AS rows FROM public.lex_entries
UNION ALL SELECT 'lex_senses', COUNT(*) FROM public.lex_senses
UNION ALL SELECT 'lex_translations', COUNT(*) FROM public.lex_translations
UNION ALL SELECT 'lex_examples', COUNT(*) FROM public.lex_examples
UNION ALL SELECT 'lex_sources', COUNT(*) FROM public.lex_sources
UNION ALL SELECT 'vocab_words (bảng cũ, không đổi)', COUNT(*) FROM public.vocab_words
UNION ALL SELECT 'dictionary_entries (bảng cũ, không đổi)', COUNT(*) FROM public.dictionary_entries;