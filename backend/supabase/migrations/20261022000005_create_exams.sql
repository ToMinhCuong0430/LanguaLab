-- Migration 5: Hệ thống Luyện thi (Kỳ thi, Kỹ năng, Đề thi, Câu hỏi, Lượt thi & Bài nộp)

-- 1. Bảng Danh mục Kỳ thi (Exams)
CREATE TABLE IF NOT EXISTS public.exams (
  id target_exam PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  full_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  status_badge VARCHAR(50) NOT NULL DEFAULT 'Sắp ra mắt',
  target_format TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 2. Bảng Kỹ năng trong kỳ thi (Exam Skills)
CREATE TABLE IF NOT EXISTS public.exam_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id target_exam NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  skill_code ielts_skill NOT NULL,
  name VARCHAR(100) NOT NULL,
  english_name VARCHAR(100) NOT NULL,
  description TEXT,
  tone VARCHAR(20) NOT NULL DEFAULT 'accent',
  CONSTRAINT uq_exam_skill UNIQUE (exam_id, skill_code)
);

-- 3. Bảng Đề thi (Exam Tests)
CREATE TABLE IF NOT EXISTS public.exam_tests (
  id TEXT PRIMARY KEY, -- Chuỗi định danh ngắn như 'read_cam18_p1', 'list_sec1_homestay'
  exam_id target_exam NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  skill ielts_skill NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  difficulty difficulty_level NOT NULL DEFAULT 'Trung bình',
  time_minutes INTEGER NOT NULL DEFAULT 20,
  total_questions INTEGER NOT NULL DEFAULT 0,
  category_tags TEXT[] NOT NULL DEFAULT '{}',
  
  -- Dữ liệu riêng cho Reading
  passage_title TEXT,
  passage_content TEXT,
  
  -- Dữ liệu riêng cho Listening
  audio_title TEXT,
  audio_duration_seconds INTEGER,
  audio_url TEXT,
  audio_script TEXT,
  
  -- Dữ liệu riêng cho Writing
  task_number SMALLINT CHECK (task_number IN (1, 2)),
  min_words INTEGER,
  prompt_requirements TEXT,
  
  -- Dữ liệu riêng cho Speaking
  part_number SMALLINT,
  prep_time_seconds INTEGER DEFAULT 60,
  speak_time_seconds INTEGER DEFAULT 120,
  prompts TEXT[],

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exam_tests_exam_skill ON public.exam_tests(exam_id, skill);
CREATE INDEX idx_exam_tests_difficulty ON public.exam_tests(difficulty);

CREATE TRIGGER tr_exam_tests_updated_at
  BEFORE UPDATE ON public.exam_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Bảng Câu hỏi trong đề thi (Exam Questions)
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id TEXT NOT NULL REFERENCES public.exam_tests(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  type question_type NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB, -- Mảng các lựa chọn: [{"id": "A", "text": "..."}, ...]
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  category_tag VARCHAR(100),
  passage_section_ref VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_test_question_number UNIQUE (test_id, question_number)
);

CREATE INDEX idx_exam_questions_test ON public.exam_questions(test_id, question_number);

-- 5. Bảng Lượt làm bài thi (Exam Attempts)
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL REFERENCES public.exam_tests(id) ON DELETE CASCADE,
  mode exam_mode NOT NULL DEFAULT 'practice',
  raw_score INTEGER,
  total_questions INTEGER NOT NULL,
  band_score NUMERIC(3, 1),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  
  -- Bài nộp kỹ năng tự luận
  submitted_essay TEXT,          -- Dành cho Writing
  speaking_audio_url TEXT,       -- Đường dẫn file ghi âm trong Supabase Storage

  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exam_attempts_user ON public.exam_attempts(user_id, completed_at DESC);
CREATE INDEX idx_exam_attempts_test ON public.exam_attempts(test_id);

-- 6. Bảng Chi tiết câu trả lời của thí sinh (Exam Answers)
CREATE TABLE IF NOT EXISTS public.exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_attempt_question UNIQUE (attempt_id, question_id)
);

CREATE INDEX idx_exam_answers_attempt ON public.exam_answers(attempt_id);
