-- ====================================================================
-- audit_vocabulary_cleanup.sql
-- SCRIPT KIỂM TOÁN VÀ ĐỐI CHIẾU HỆ THỐNG TỪ VỰNG LANGUALAB
-- ====================================================================
-- Mục đích: Kiểm tra cấu trúc, khóa ngoại, view, hàm, RLS và đối chiếu
--          giữa hệ thống từ vựng di sản (legacy) và kho chuẩn hóa (lex_*).
-- NGUYÊN TẮC: CHỈ ĐỌC (READ-ONLY) - TUYỆT ĐỐI KHÔNG XÓA HAY SỬA DỮ LIỆU.
-- ====================================================================

-- --------------------------------------------------------------------
-- PHẦN 1: KIỂM TRA KHÓA NGOẠI & PHỤ THUỘC (FOREIGN KEY DEPENDENCIES)
-- --------------------------------------------------------------------
-- Mục tiêu: Xác định tất cả các bảng có quan hệ khóa ngoại trỏ vào
-- các bảng di sản và bảng Lexicon.

SELECT
    tc.table_schema, 
    tc.table_name AS dependent_table, 
    kcu.column_name AS dependent_column,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON rc.unique_constraint_name = ccu.constraint_name
WHERE ccu.table_name IN (
    'vocab_levels', 'vocab_sets', 'vocab_words', 'user_word_progress', 'dictionary_entries',
    'lex_entries', 'lex_senses'
)
ORDER BY ccu.table_name, tc.table_name;

-- --------------------------------------------------------------------
-- PHẦN 2: KIỂM TRA KHUNG NHÌN (VIEWS) VÀ HÀM PHỤ THUỘC
-- --------------------------------------------------------------------
-- Mục tiêu: Xác định các view và hàm đang phụ thuộc vào bảng di sản.

SELECT 
    viewname, 
    definition 
FROM pg_views 
WHERE schemaname = 'public' 
  AND (
    definition ILIKE '%vocab_words%' 
    OR definition ILIKE '%vocab_sets%' 
    OR definition ILIKE '%dictionary_entries%'
    OR definition ILIKE '%user_word_progress%'
    OR definition ILIKE '%lex_%'
  );

-- Danh sách các hàm RPC đọc hoặc sửa các bảng từ vựng:
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname IN ('review_word', 'search_lex_entries', 'lex_word_of_the_day', 'lex_featured_words', 'admin_lex_stats')
    OR p.proname LIKE 'admin_set_%'
    OR p.proname LIKE 'lex_%'
  )
ORDER BY p.proname;

-- --------------------------------------------------------------------
-- PHẦN 3: KIỂM TRA CHÍNH SÁCH BẢO MẬT HÀNG (RLS POLICIES)
-- --------------------------------------------------------------------
-- Mục tiêu: Đảm bảo toàn bộ bảng liên quan đều đã bật RLS và có chính sách bảo vệ.

SELECT 
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled,
    COUNT(p.policyname) AS total_policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p ON p.schemaname = 'public' AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND (
    c.relname IN ('vocab_levels', 'vocab_sets', 'vocab_words', 'user_word_progress', 'dictionary_entries')
    OR c.relname LIKE 'lex\_%'
  )
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;

-- --------------------------------------------------------------------
-- PHẦN 4: KIỂM TRA BẢN GHI MỒ CÔI (ORPHANED RECORDS CHECK)
-- --------------------------------------------------------------------
-- Mục tiêu: Phát hiện các bản ghi bị đứt gãy quan hệ dữ liệu.

-- 4.1 user_word_progress không có vocab_words tương ứng (Kỳ vọng: 0 dòng)
SELECT COUNT(*) AS orphaned_progress_count
FROM public.user_word_progress uwp
LEFT JOIN public.vocab_words vw ON uwp.word_id = vw.id
WHERE vw.id IS NULL;

-- 4.2 vocab_words không có vocab_sets tương ứng (Kỳ vọng: 0 dòng)
SELECT COUNT(*) AS orphaned_words_count
FROM public.vocab_words vw
LEFT JOIN public.vocab_sets vs ON vw.set_id = vs.id
WHERE vs.id IS NULL;

-- 4.3 lex_senses không có lex_entries tương ứng (Kỳ vọng: 0 dòng)
SELECT COUNT(*) AS orphaned_senses_count
FROM public.lex_senses ls
LEFT JOIN public.lex_entries le ON ls.entry_id = le.id
WHERE le.id IS NULL;

-- 4.4 lex_translations không có lex_senses tương ứng (Kỳ vọng: 0 dòng)
SELECT COUNT(*) AS orphaned_translations_count
FROM public.lex_translations lt
LEFT JOIN public.lex_senses ls ON lt.sense_id = ls.id
WHERE ls.id IS NULL;

-- --------------------------------------------------------------------
-- PHẦN 5: ĐỐI CHIẾU DỮ LIỆU GIỮA HỆ THỐNG DI SẢN VÀ KHO LEXICON
-- --------------------------------------------------------------------

-- 5.1 So sánh số lượng bản ghi tổng thể
SELECT 'dictionary_entries (legacy)' AS table_source, count(*) AS total_rows FROM public.dictionary_entries
UNION ALL
SELECT 'vocab_words (legacy)', count(*) FROM public.vocab_words
UNION ALL
SELECT 'user_word_progress (legacy active)', count(*) FROM public.user_word_progress
UNION ALL
SELECT 'lex_entries (canonical)', count(*) FROM public.lex_entries
UNION ALL
SELECT 'lex_senses (canonical)', count(*) FROM public.lex_senses
UNION ALL
SELECT 'lex_forms (canonical)', count(*) FROM public.lex_forms
UNION ALL
SELECT 'lex_translations (canonical)', count(*) FROM public.lex_translations;

-- 5.2 Kiểm tra 2 mục từ trong dictionary_entries đã có trong lex_entries chưa
SELECT 
    de.headword AS legacy_word,
    le.id AS lex_entry_id,
    le.lemma AS canonical_lemma,
    le.status AS canonical_status,
    (SELECT count(*) FROM public.lex_senses s WHERE s.entry_id = le.id) AS sense_count
FROM public.dictionary_entries de
LEFT JOIN public.lex_entries le 
  ON lower(trim(de.headword)) = le.normalized_lemma;

-- 5.3 Tỷ lệ bao phủ: Bao nhiêu từ trong vocab_words đã có trong kho lex_entries?
SELECT 
    count(vw.id) AS total_legacy_words,
    count(le.id) AS matched_in_lexicon,
    round(count(le.id)::numeric / NULLIF(count(vw.id), 0) * 100, 2) AS coverage_percent
FROM public.vocab_words vw
LEFT JOIN public.lex_entries le 
  ON lower(trim(vw.word)) = le.normalized_lemma;

-- 5.4 Các từ trong vocab_words đã được liên kết với lex_sense_id chưa?
SELECT 
    count(*) AS total_vocab_words,
    count(lex_sense_id) AS linked_to_lex_senses,
    count(*) - count(lex_sense_id) AS unlinked_words
FROM public.vocab_words;

-- --------------------------------------------------------------------
-- PHẦN 6: KIỂM TRA TÍNH NHẤT QUÁN CEFR ĐA NGHĨA TRONG LEX_SENSES
-- --------------------------------------------------------------------
-- Mục tiêu: Xác nhận một từ có nhiều cấp độ CEFR khác nhau ở từng nghĩa
-- và kiểm tra tính toàn vẹn của thang CEFR A1-C2.

-- 6.1 Phân bố số lượng nghĩa theo từng cấp độ CEFR
SELECT 
    COALESCE(level, 'NULL (Chưa gán)') AS cefr_level,
    level_system,
    count(*) AS total_senses,
    count(*) FILTER (WHERE review_status = 'approved') AS approved_senses
FROM public.lex_senses
GROUP BY level, level_system
ORDER BY 
    CASE level
        WHEN 'A1' THEN 1
        WHEN 'A2' THEN 2
        WHEN 'B1' THEN 3
        WHEN 'B2' THEN 4
        WHEN 'C1' THEN 5
        WHEN 'C2' THEN 6
        ELSE 7
    END;

-- 6.2 Top các mục từ đa nghĩa có nhiều cấp độ CEFR khác nhau (Minh chứng tính nhất quán)
SELECT 
    e.lemma,
    count(DISTINCT s.id) AS total_senses,
    string_agg(DISTINCT s.part_of_speech, ', ') AS parts_of_speech,
    string_agg(DISTINCT s.level, ', ' ORDER BY s.level) AS distinct_cefr_levels
FROM public.lex_entries e
JOIN public.lex_senses s ON s.entry_id = e.id
WHERE s.level IS NOT NULL
GROUP BY e.id, e.lemma
HAVING count(DISTINCT s.level) > 1
ORDER BY count(DISTINCT s.id) DESC
LIMIT 20;

-- ====================================================================
-- KẾT THÚC BẢN SCRIPT KIỂM TOÁN
-- ====================================================================
