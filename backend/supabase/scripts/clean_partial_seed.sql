-- ==============================================================================
-- SCRIPT: clean_partial_seed.sql
-- Mục đích: Dọn dẹp sạch sẽ dữ liệu bộ từ vựng hệ thống cũ (1 bộ, 3 từ) 
--           đang tồn tại trên remote để chuẩn bị áp dụng Seed mới chuẩn xác 100%
--
-- ⚠️ AN TOÀN: Bọc trong transaction. Không xoá dữ liệu người dùng cá nhân (user_id IS NOT NULL).
-- ==============================================================================

BEGIN;

-- 1. Xoá từ vựng thuộc các bộ hệ thống cũ
DELETE FROM public.vocab_words 
WHERE set_id IN (
  SELECT id FROM public.vocab_sets WHERE user_id IS NULL
);

-- 2. Xoá bộ từ vựng hệ thống cũ
DELETE FROM public.vocab_sets 
WHERE user_id IS NULL;

-- 3. Kiểm tra lại trạng thái sau khi xoá
SELECT 'vocab_sets_system' AS t, count(*) FROM public.vocab_sets WHERE user_id IS NULL
UNION ALL
SELECT 'vocab_words', count(*) FROM public.vocab_words;

COMMIT;
