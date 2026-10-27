-- Migration 9: Bảng Content Import Logs, Phân quyền Admin quản lý nội dung và Bổ sung RLS
-- Dự án: Langua (Học ngoại ngữ & Luyện thi phi thương mại)

-- ====================================================================
-- PHẦN 1: BẢNG LỊCH SỬ NHẬP NỘI DUNG (content_import_logs)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.content_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN (
    'vocab',
    'typing',
    'grammar',
    'reading',
    'media',
    'dictionary',
    'ielts'
  )),
  file_name TEXT NOT NULL,
  rows_total INTEGER NOT NULL DEFAULT 0 CHECK (rows_total >= 0),
  rows_ok INTEGER NOT NULL DEFAULT 0 CHECK (rows_ok >= 0),
  rows_failed INTEGER NOT NULL DEFAULT 0 CHECK (rows_failed >= 0),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'partial')),
  errors JSONB DEFAULT '[]'::jsonb, -- Tối đa 50 lỗi đầu tiên
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_import_logs_admin ON public.content_import_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_import_logs_type ON public.content_import_logs(content_type, created_at DESC);

-- Bật RLS cho content_import_logs: Chỉ Admin mới có quyền đọc và ghi
ALTER TABLE public.content_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Content import logs are readable by admin"
  ON public.content_import_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Content import logs are insertable by admin"
  ON public.content_import_logs FOR INSERT
  WITH CHECK (public.is_admin());

-- ====================================================================
-- PHẦN 2: BỔ SUNG CỘT CHO BẢNG NỘI DUNG (NẾU CẦN)
-- ====================================================================

-- 1. vocab_sets: Đã có is_system (BOOLEAN DEFAULT FALSE) và is_public (BOOLEAN DEFAULT FALSE).
-- Để nhất quán kiểm tra xuất bản giống reading_items/media_items, thêm is_published nếu chưa có
ALTER TABLE public.vocab_sets
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. typing_topics: Thêm is_published để hỗ trợ xuất bản / bản nháp
ALTER TABLE public.typing_topics
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. grammar_points: Thêm is_published để hỗ trợ xuất bản / bản nháp
ALTER TABLE public.grammar_points
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;

-- 4. exam_tests: Thêm is_published để hỗ trợ xuất bản / bản nháp
ALTER TABLE public.exam_tests
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;

-- ====================================================================
-- PHẦN 3: BỔ SUNG CHÍNH SÁCH RLS ADMIN GHI & MỌI NGƯỜI ĐỌC ĐÃ XUẤT BẢN
-- ====================================================================

-- 1. VOCABULARY (vocab_sets, vocab_words)
DROP POLICY IF EXISTS "Vocab sets are manageable by admin" ON public.vocab_sets;
CREATE POLICY "Vocab sets are manageable by admin"
  ON public.vocab_sets FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Vocab words are manageable by admin" ON public.vocab_words;
CREATE POLICY "Vocab words are manageable by admin"
  ON public.vocab_words FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. EXAMS (exam_tests, exam_questions)
DROP POLICY IF EXISTS "Exam tests are manageable by admin" ON public.exam_tests;
CREATE POLICY "Exam tests are manageable by admin"
  ON public.exam_tests FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Exam questions are manageable by admin" ON public.exam_questions;
CREATE POLICY "Exam questions are manageable by admin"
  ON public.exam_questions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Cập nhật các bảng nội dung có RLS để người thường chỉ đọc khi is_published = true (hoặc admin)
-- Media items: đã có (is_published = true OR public.is_admin())
-- Reading items: đã có (is_published = true OR public.is_admin())

-- Typing topics: cập nhật policy đọc công khai có xét is_published
DROP POLICY IF EXISTS "Typing topics are viewable by everyone" ON public.typing_topics;
CREATE POLICY "Typing topics are viewable by everyone"
  ON public.typing_topics FOR SELECT
  USING (is_published = true OR public.is_admin());

-- Grammar points: cập nhật policy đọc công khai có xét is_published
DROP POLICY IF EXISTS "Grammar points are viewable by everyone" ON public.grammar_points;
CREATE POLICY "Grammar points are viewable by everyone"
  ON public.grammar_points FOR SELECT
  USING (is_published = true OR public.is_admin());

-- Exam tests: cập nhật policy đọc công khai có xét is_published
DROP POLICY IF EXISTS "Exam tests are viewable by everyone" ON public.exam_tests;
CREATE POLICY "Exam tests are viewable by everyone"
  ON public.exam_tests FOR SELECT
  USING (is_published = true OR public.is_admin());
