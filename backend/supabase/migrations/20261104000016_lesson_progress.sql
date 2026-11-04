-- Migration 16: Lưu bài học đang dở
-- Dự án: Langua (Học ngoại ngữ & Luyện thi phi thương mại)
--
-- Mỗi user giữ tối đa một dòng cho mỗi chức năng (go-cau | tu-vung | ngu-phap): phiên học ghi đè dòng
-- này mỗi khi sang câu / thẻ / bài tiếp theo và xoá khi học xong. Trang chủ đọc dòng mới nhất (updated_at)
-- để nút "Tiếp tục" mở lại đúng chỗ.

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL CHECK (feature IN ('go-cau', 'tu-vung', 'ngu-phap')),
  resource_id TEXT NOT NULL CHECK (char_length(resource_id) BETWEEN 1 AND 200),
  resource_title TEXT NOT NULL CHECK (char_length(resource_title) BETWEEN 1 AND 300),
  current_index INTEGER NOT NULL CHECK (current_index >= 0),
  total_count INTEGER NOT NULL CHECK (total_count > 0),
  -- Đường dẫn nội bộ để mở lại đúng câu (vd: /go-cau/nha-hang?cau=3)
  link TEXT NOT NULL CHECK (link LIKE '/%' AND link NOT LIKE '//%' AND char_length(link) <= 500),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, feature),
  CHECK (current_index < total_count)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_recent ON public.lesson_progress(user_id, updated_at DESC);

-- updated_at luôn do server đặt, kể cả khi client gửi giá trị khác
CREATE OR REPLACE FUNCTION public.touch_lesson_progress()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_lesson_progress_touch ON public.lesson_progress;
CREATE TRIGGER tr_lesson_progress_touch
  BEFORE INSERT OR UPDATE ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.touch_lesson_progress();

-- RLS: chỉ chủ tài khoản đọc / ghi / xoá dòng của mình
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lesson progress readable by owner" ON public.lesson_progress;
CREATE POLICY "Lesson progress readable by owner" ON public.lesson_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Lesson progress insertable by owner" ON public.lesson_progress;
CREATE POLICY "Lesson progress insertable by owner" ON public.lesson_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Lesson progress updatable by owner" ON public.lesson_progress;
CREATE POLICY "Lesson progress updatable by owner" ON public.lesson_progress
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Lesson progress deletable by owner" ON public.lesson_progress;
CREATE POLICY "Lesson progress deletable by owner" ON public.lesson_progress
  FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
REVOKE ALL ON public.lesson_progress FROM anon;
