-- Migration 4: Hệ thống Từ vựng 7 cấp độ, Bộ từ & Thuật toán lặp lại ngắt quãng (Spaced Repetition)

-- 1. Bảng 7 Cấp độ từ vựng (Vocab Levels)
CREATE TABLE IF NOT EXISTS public.vocab_levels (
  id SERIAL PRIMARY KEY,
  level_number INTEGER NOT NULL UNIQUE CHECK (level_number BETWEEN 1 AND 7),
  code VARCHAR(10) NOT NULL UNIQUE, -- 'L1', 'L2' ... 'L7'
  title TEXT NOT NULL,              -- 'Cốt lõi A1', 'Sơ cấp A2', ...
  cefr_equivalent VARCHAR(20),      -- 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Academic'
  target_word_count INTEGER NOT NULL DEFAULT 500,
  color_tone VARCHAR(20) NOT NULL DEFAULT 'ok',
  description TEXT
);

-- 2. Bảng Bộ từ vựng (Vocab Sets: Đề xuất hệ thống hoặc Người dùng tự tạo)
CREATE TABLE IF NOT EXISTS public.vocab_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL nếu là bộ hệ thống
  level_id INTEGER REFERENCES public.vocab_levels(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vocab_sets_level ON public.vocab_sets(level_id);
CREATE INDEX idx_vocab_sets_user ON public.vocab_sets(user_id);
CREATE INDEX idx_vocab_sets_system ON public.vocab_sets(is_system);

CREATE TRIGGER tr_vocab_sets_updated_at
  BEFORE UPDATE ON public.vocab_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. Bảng Từ vựng chi tiết (Vocab Words)
CREATE TABLE IF NOT EXISTS public.vocab_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES public.vocab_sets(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  phonetic TEXT,
  part_of_speech VARCHAR(50),
  meaning_vi TEXT NOT NULL,
  example_sentence TEXT,
  example_translation TEXT,
  audio_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vocab_words_set ON public.vocab_words(set_id);
CREATE INDEX idx_vocab_words_word ON public.vocab_words(word);

-- 4. Bảng Tiến trình ghi nhớ & Thuật toán lặp lại ngắt quãng SRS (User Word Progress)
CREATE TABLE IF NOT EXISTS public.user_word_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  word_id UUID NOT NULL REFERENCES public.vocab_words(id) ON DELETE CASCADE,
  easiness_factor NUMERIC(4, 2) NOT NULL DEFAULT 2.50, -- Hệ số độ dễ (SM-2 Algorithm)
  repetition_count INTEGER NOT NULL DEFAULT 0,          -- Số lần đã ôn thành công liên tiếp
  interval_days INTEGER NOT NULL DEFAULT 1,             -- Khoảng cách ngày đến lần ôn tới
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_word UNIQUE (user_id, word_id)
);

CREATE INDEX idx_user_word_progress_due ON public.user_word_progress(user_id, next_review_at);
CREATE INDEX idx_user_word_progress_user ON public.user_word_progress(user_id);

CREATE TRIGGER tr_user_word_progress_updated_at
  BEFORE UPDATE ON public.user_word_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. View Truy vấn các từ đến hạn ôn tập hôm nay (SRS Due Words)
CREATE OR REPLACE VIEW public.words_due_today AS
SELECT
  p.id AS progress_id,
  p.user_id,
  p.next_review_at,
  p.repetition_count,
  p.easiness_factor,
  p.interval_days,
  w.id AS word_id,
  w.word,
  w.phonetic,
  w.part_of_speech,
  w.meaning_vi,
  w.example_sentence,
  w.example_translation,
  w.audio_url,
  s.title AS set_title,
  -- Đánh dấu từ có nguy cơ quên cao (interval < 2 ngày hoặc trả lời sai gần đây)
  CASE WHEN p.interval_days <= 1 OR p.incorrect_count > p.correct_count THEN true ELSE false END AS is_critical
FROM public.user_word_progress p
JOIN public.vocab_words w ON p.word_id = w.id
JOIN public.vocab_sets s ON w.set_id = s.id
WHERE p.next_review_at <= NOW();

-- 6. View Thống kê tổng số từ đã học theo từng cấp độ 1 đến 7 của người dùng
CREATE OR REPLACE VIEW public.user_vocab_levels_summary AS
SELECT
  vl.level_number,
  vl.code,
  vl.title,
  vl.color_tone,
  vl.target_word_count AS total_target,
  uwp.user_id,
  COUNT(uwp.id)::INTEGER AS learned_count
FROM public.vocab_levels vl
LEFT JOIN public.vocab_sets vs ON vs.level_id = vl.id
LEFT JOIN public.vocab_words vw ON vw.set_id = vs.id
LEFT JOIN public.user_word_progress uwp ON uwp.word_id = vw.id
GROUP BY vl.level_number, vl.code, vl.title, vl.color_tone, vl.target_word_count, uwp.user_id;
