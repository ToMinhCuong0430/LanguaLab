-- Migration 7: Bật Row Level Security (RLS) cho tất cả các bảng & Cấu hình Storage Policies

-- ========================================================
-- 1. BẬT ROW LEVEL SECURITY (RLS) CHO TOÀN BỘ CÁC BẢNG
-- ========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.vocab_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_word_progress ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- 2. POLICIES CHO PROFILES
-- ========================================================
-- Mọi người (cả đã đăng nhập và ẩn danh) có thể xem profile cơ bản (tên, avatar, band)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Người dùng chỉ được sửa hồ sơ của chính mình
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ========================================================
-- 3. POLICIES CHO GAMIFICATION & THÔNG BÁO
-- ========================================================
-- Điểm danh: chỉ xem và thêm điểm danh của chính mình
CREATE POLICY "Users can view own checkins"
  ON public.daily_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins"
  ON public.daily_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sự kiện XP: chỉ xem sự kiện XP của chính mình
CREATE POLICY "Users can view own xp events"
  ON public.xp_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp events"
  ON public.xp_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Thông báo: người dùng chỉ xem và cập nhật trạng thái đã đọc của thông báo gửi cho mình
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ========================================================
-- 4. POLICIES CHO TỪ VỰNG (VOCABULARY)
-- ========================================================
-- Cấp độ từ vựng: công khai đọc
CREATE POLICY "Vocab levels are viewable by everyone"
  ON public.vocab_levels FOR SELECT
  USING (true);

-- Bộ từ vựng: đọc nếu là bộ hệ thống (is_system = true) hoặc là bộ của chính người dùng tạo
CREATE POLICY "Vocab sets are viewable if system or owned"
  ON public.vocab_sets FOR SELECT
  USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own vocab sets"
  ON public.vocab_sets FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can update own vocab sets"
  ON public.vocab_sets FOR UPDATE
  USING (auth.uid() = user_id AND is_system = false)
  WITH CHECK (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can delete own vocab sets"
  ON public.vocab_sets FOR DELETE
  USING (auth.uid() = user_id AND is_system = false);

-- Từ vựng: đọc nếu thuộc bộ từ mà người dùng có quyền xem
CREATE POLICY "Vocab words are viewable if set is viewable"
  ON public.vocab_words FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vocab_sets vs
      WHERE vs.id = vocab_words.set_id
      AND (vs.is_system = true OR vs.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage words in their own sets"
  ON public.vocab_words FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.vocab_sets vs
      WHERE vs.id = vocab_words.set_id
      AND vs.user_id = auth.uid()
    )
  );

-- Tiến trình ghi nhớ từ vựng cá nhân: chỉ người dùng sở hữu
CREATE POLICY "Users can manage own word progress"
  ON public.user_word_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ========================================================
-- 5. POLICIES CHO LUYỆN THI (EXAMS & PRACTICE)
-- ========================================================
-- Danh mục kỳ thi, kỹ năng, đề thi, câu hỏi: ĐỌC CÔNG KHAI
CREATE POLICY "Exams are viewable by everyone"
  ON public.exams FOR SELECT
  USING (true);

CREATE POLICY "Exam skills are viewable by everyone"
  ON public.exam_skills FOR SELECT
  USING (true);

CREATE POLICY "Exam tests are viewable by everyone"
  ON public.exam_tests FOR SELECT
  USING (true);

CREATE POLICY "Exam questions are viewable by everyone"
  ON public.exam_questions FOR SELECT
  USING (true);

-- Lượt làm bài thi: Người dùng chỉ đọc và ghi lượt thi của mình
CREATE POLICY "Users can view own exam attempts"
  ON public.exam_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exam attempts"
  ON public.exam_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exam attempts"
  ON public.exam_attempts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Chi tiết câu trả lời: Người dùng chỉ truy cập câu trả lời trong lượt thi của mình
CREATE POLICY "Users can manage own exam answers"
  ON public.exam_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts ea
      WHERE ea.id = exam_answers.attempt_id
      AND ea.user_id = auth.uid()
    )
  );

-- ========================================================
-- 6. POLICIES CHO SUPABASE STORAGE
-- ========================================================
-- Bucket speaking-recordings (riêng tư, thí sinh chỉ tải lên và nghe bài của mình)
INSERT INTO storage.buckets (id, name, public)
VALUES ('speaking-recordings', 'speaking-recordings', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own speaking recordings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'speaking-recordings' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Users can read own speaking recordings"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'speaking-recordings' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- Bucket avatars (công khai đọc, người dùng tải ảnh vào thư mục user_id)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  );
