-- Migration 8: Mở rộng Schema cho Gõ câu, Lộ trình, Từ vựng nâng cao, Ngữ pháp, Video & Podcast, Kho đọc, Từ điển, Yêu cầu tính năng & Cơ chế Bảo mật RPC
-- Dự án: Langua (Học ngoại ngữ & Luyện thi phi thương mại)

-- ====================================================================
-- PHẦN 1: QUẢN LÝ VAI TRÒ & PHÂN QUYỀN ADMIN (Admin Role Management)
-- ====================================================================

-- 1. Bảng Vai trò người dùng (User Roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Bật RLS: Người dùng không được phép tự sửa role của mình
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Hàm kiểm tra quyền Admin an toàn (SECURITY DEFINER, cố định search_path)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ====================================================================
-- PHẦN 2: GÕ CÂU VÀ LỘ TRÌNH CHẶNG (Typing Practice & Learning Stages)
-- ====================================================================

-- 1. Bảng Chủ đề gõ câu (Typing Topics)
CREATE TABLE IF NOT EXISTS public.typing_topics (
  id TEXT PRIMARY KEY, -- vd: 'en-life-shopping', 'en-work-meeting'
  language learning_language NOT NULL,
  level TEXT NOT NULL,
  group_type TEXT NOT NULL CHECK (group_type IN ('life', 'work')),
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'ShoppingBag',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_typing_topics_lang_group ON public.typing_topics(language, group_type, sort_order);

CREATE TRIGGER tr_typing_topics_updated_at
  BEFORE UPDATE ON public.typing_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. Bảng Câu luyện gõ (Typing Sentences)
CREATE TABLE IF NOT EXISTS public.typing_sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id TEXT NOT NULL REFERENCES public.typing_topics(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reading TEXT,           -- Phiên âm / Pinyin / Furigana
  translation TEXT NOT NULL, -- Nghĩa tiếng Việt
  hint_word TEXT,         -- Gợi ý từ tiếp theo
  grammar_note TEXT,
  audio_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_typing_sentences_topic ON public.typing_sentences(topic_id, sort_order);

-- 3. Bảng Lượt gõ câu của người học (Typing Attempts)
CREATE TABLE IF NOT EXISTS public.typing_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES public.typing_topics(id) ON DELETE CASCADE,
  wpm NUMERIC(5, 1) NOT NULL CHECK (wpm >= 0),
  accuracy NUMERIC(5, 2) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  xp_earned INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_typing_attempts_user ON public.typing_attempts(user_id, completed_at DESC);

-- 4. Bảng Lộ trình chặng học (Learning Stages - Dùng chung cho Gõ câu và Lộ trình Từ điển kiểu Duolingo)
CREATE TABLE IF NOT EXISTS public.learning_stages (
  id TEXT PRIMARY KEY, -- vd: 'en-a1', 'zh-hsk1', 'duo-en-1'
  stage_type TEXT NOT NULL CHECK (stage_type IN ('typing', 'dictionary')),
  language learning_language NOT NULL,
  level TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  xp_required INTEGER NOT NULL DEFAULT 0,
  unlock_requirement JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_stages_type_lang ON public.learning_stages(stage_type, language, sort_order);

-- 5. Bảng Tiến trình chặng của người dùng (User Stage Progress)
CREATE TABLE IF NOT EXISTS public.user_stage_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL REFERENCES public.learning_stages(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_stage UNIQUE (user_id, stage_id)
);

CREATE INDEX IF NOT EXISTS idx_user_stage_progress_user ON public.user_stage_progress(user_id);

CREATE TRIGGER tr_user_stage_progress_updated_at
  BEFORE UPDATE ON public.user_stage_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- PHẦN 3: TỪ VỰNG MỞ RỘNG (Vocab Sets, Words, Saved Words, Pronunciation)
-- ====================================================================

-- 1. Nâng cấp bảng vocab_sets
ALTER TABLE public.vocab_sets 
  ADD COLUMN IF NOT EXISTS language learning_language NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_vocab_sets_lang ON public.vocab_sets(language);

-- 2. Nâng cấp bảng vocab_words
ALTER TABLE public.vocab_words 
  ADD COLUMN IF NOT EXISTS reading TEXT,
  ADD COLUMN IF NOT EXISTS examples JSONB DEFAULT '[]'::jsonb;

-- 3. Bảng Từ vựng đã lưu cá nhân (User Saved Words - Lưu từ Video, Bài đọc, Từ điển)
CREATE TABLE IF NOT EXISTS public.user_saved_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  phonetic TEXT,
  reading TEXT,
  meaning TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('video', 'reading', 'dictionary', 'typing', 'grammar', 'manual')),
  source_ref TEXT, -- ID nguồn tham chiếu (video_id, reading_id, v.v.)
  target_set_id UUID REFERENCES public.vocab_sets(id) ON DELETE SET NULL,
  context_sentence TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_saved_word UNIQUE (user_id, word, source_type, source_ref)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_words_user ON public.user_saved_words(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_saved_words_target_set ON public.user_saved_words(target_set_id);

-- 4. Bảng Lịch sử ghi âm phát âm (Pronunciation Recordings)
CREATE TABLE IF NOT EXISTS public.pronunciation_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  word_id UUID REFERENCES public.vocab_words(id) ON DELETE SET NULL,
  word_text TEXT NOT NULL,
  audio_path TEXT NOT NULL, -- Đường dẫn dạng {user_id}/{filename}.webm trong private bucket
  score NUMERIC(5, 2),
  feedback JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pronunciation_recordings_user ON public.pronunciation_recordings(user_id, created_at DESC);

-- ====================================================================
-- PHẦN 4: NGỮ PHÁP (Grammar Points, Exercises, Attempts, User Progress)
-- ====================================================================

-- 1. Bảng Điểm ngữ pháp (Grammar Points)
CREATE TABLE IF NOT EXISTS public.grammar_points (
  id TEXT PRIMARY KEY, -- vd: 'en-a1-present-simple'
  language learning_language NOT NULL,
  level TEXT NOT NULL,
  title TEXT NOT NULL,
  vietnamese_title TEXT NOT NULL,
  summary TEXT,
  formula JSONB NOT NULL DEFAULT '{}'::jsonb,
  explanation TEXT NOT NULL,
  examples JSONB NOT NULL DEFAULT '[]'::jsonb,
  common_mistakes JSONB NOT NULL DEFAULT '[]'::jsonb,
  xp_reward INTEGER NOT NULL DEFAULT 30,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grammar_points_lang_level ON public.grammar_points(language, level, sort_order);

CREATE TRIGGER tr_grammar_points_updated_at
  BEFORE UPDATE ON public.grammar_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. Bảng Bài tập ngữ pháp (Grammar Exercises)
CREATE TABLE IF NOT EXISTS public.grammar_exercises (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  point_id TEXT NOT NULL REFERENCES public.grammar_points(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'fill_blank', 'word_order')),
  prompt TEXT NOT NULL,
  question TEXT,
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grammar_exercises_point ON public.grammar_exercises(point_id, sort_order);

-- 3. Bảng Tiến trình ngữ pháp cá nhân (User Grammar Progress)
CREATE TABLE IF NOT EXISTS public.user_grammar_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  point_id TEXT NOT NULL REFERENCES public.grammar_points(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  best_score INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_grammar_point UNIQUE (user_id, point_id)
);

CREATE INDEX IF NOT EXISTS idx_user_grammar_progress_user ON public.user_grammar_progress(user_id);

CREATE TRIGGER tr_user_grammar_progress_updated_at
  BEFORE UPDATE ON public.user_grammar_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Bảng Lượt làm bài tập ngữ pháp (Grammar Attempts)
CREATE TABLE IF NOT EXISTS public.grammar_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  point_id TEXT NOT NULL REFERENCES public.grammar_points(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grammar_attempts_user ON public.grammar_attempts(user_id, completed_at DESC);

-- ====================================================================
-- PHẦN 5: VIDEO VÀ PODCAST (Media Items, Cues, Quiz, User Progress & My Videos)
-- ====================================================================

-- 1. Bảng Kho Media (Media Items)
CREATE TABLE IF NOT EXISTS public.media_items (
  id TEXT PRIMARY KEY, -- vd: 'media-en-ted-memory'
  media_type TEXT NOT NULL CHECK (media_type IN ('video', 'podcast')),
  language learning_language NOT NULL,
  level TEXT NOT NULL,
  topic TEXT NOT NULL,
  title TEXT NOT NULL,
  vietnamese_title TEXT,
  speaker TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('youtube', 'upload')),
  source_url TEXT NOT NULL, -- ID youtube hoặc URL file podcast
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_items_lang_type ON public.media_items(language, media_type, level, is_published);

CREATE TRIGGER tr_media_items_updated_at
  BEFORE UPDATE ON public.media_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. Bảng Phụ đề Media (Media Cues)
CREATE TABLE IF NOT EXISTS public.media_cues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id TEXT NOT NULL REFERENCES public.media_items(id) ON DELETE CASCADE,
  subtitle_lang TEXT NOT NULL DEFAULT 'en',
  start_ms INTEGER NOT NULL CHECK (start_ms >= 0),
  end_ms INTEGER NOT NULL CHECK (end_ms >= start_ms),
  text TEXT NOT NULL,
  translation_vi TEXT,
  vocab_hints JSONB DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_media_cues_media_start ON public.media_cues(media_id, start_ms);

-- 3. Bảng Câu hỏi trắc nghiệm nghe hiểu (Media Quiz Questions)
CREATE TABLE IF NOT EXISTS public.media_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id TEXT NOT NULL REFERENCES public.media_items(id) ON DELETE CASCADE,
  segment_time_sec INTEGER NOT NULL DEFAULT 0,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_index INTEGER NOT NULL,
  explanation TEXT
);

CREATE INDEX IF NOT EXISTS idx_media_quiz_media ON public.media_quiz_questions(media_id);

-- 4. Bảng Tiến trình xem & luyện tập Media của người học (User Media Progress)
CREATE TABLE IF NOT EXISTS public.user_media_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL REFERENCES public.media_items(id) ON DELETE CASCADE,
  watch_position_ms INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  dictation_score NUMERIC(5, 2),
  shadowing_score NUMERIC(5, 2),
  quiz_score NUMERIC(5, 2),
  last_watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_media UNIQUE (user_id, media_id)
);

CREATE INDEX IF NOT EXISTS idx_user_media_progress_user ON public.user_media_progress(user_id);

CREATE TRIGGER tr_user_media_progress_updated_at
  BEFORE UPDATE ON public.user_media_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Bảng Video của tôi (User Videos: CHỈ LƯU LINK YOUTUBE, TUYỆT ĐỐI KHÔNG LƯU FILE VIDEO)
CREATE TABLE IF NOT EXISTS public.user_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL,
  language learning_language NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_videos_user ON public.user_videos(user_id, created_at DESC);

CREATE TRIGGER tr_user_videos_updated_at
  BEFORE UPDATE ON public.user_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Bảng Phụ đề người dùng tự tải lên (User Video Cues - Riêng tư)
CREATE TABLE IF NOT EXISTS public.user_video_cues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_video_id UUID NOT NULL REFERENCES public.user_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_ms INTEGER NOT NULL CHECK (start_ms >= 0),
  end_ms INTEGER NOT NULL CHECK (end_ms >= start_ms),
  text TEXT NOT NULL CHECK (char_length(text) <= 500),
  translation_vi TEXT CHECK (char_length(translation_vi) <= 500),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_video_cues_video ON public.user_video_cues(user_video_id, start_ms);

-- Trigger giới hạn tối đa 1000 dòng phụ đề cho mỗi video cá nhân
CREATE OR REPLACE FUNCTION check_user_video_cues_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.user_video_cues WHERE user_video_id = NEW.user_video_id) >= 1000 THEN
    RAISE EXCEPTION 'Vượt quá giới hạn tối đa 1000 dòng phụ đề cho mỗi video người dùng';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_check_user_video_cues_limit
  BEFORE INSERT ON public.user_video_cues
  FOR EACH ROW
  EXECUTE FUNCTION check_user_video_cues_limit();

-- ====================================================================
-- PHẦN 6: KHO ĐỌC VÀ DỊCH (Reading Items, Sections, User Progress, User Texts, Translation Attempts)
-- ====================================================================

-- 1. Bảng Kho bài đọc (Reading Items)
CREATE TABLE IF NOT EXISTS public.reading_items (
  id TEXT PRIMARY KEY, -- vd: 'read-en-tortoise-hare'
  content_type TEXT NOT NULL CHECK (content_type IN ('news', 'book', 'short_story', 'novel', 'play')),
  language learning_language NOT NULL,
  level TEXT NOT NULL,
  title TEXT NOT NULL,
  vietnamese_title TEXT,
  author TEXT NOT NULL,
  source_url TEXT,
  source_note TEXT,
  word_count INTEGER NOT NULL DEFAULT 0,
  reading_time_minutes INTEGER NOT NULL DEFAULT 1,
  license TEXT NOT NULL CHECK (license IN ('public_domain', 'original', 'licensed')),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  -- Ràng buộc: Chỉ được xuất bản khi license hợp lệ đã được khai báo
  CONSTRAINT chk_reading_published_license CHECK (NOT is_published OR license IN ('public_domain', 'original', 'licensed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reading_items_lang_type ON public.reading_items(language, content_type, level, is_published);

CREATE TRIGGER tr_reading_items_updated_at
  BEFORE UPDATE ON public.reading_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. Bảng Đoạn văn song ngữ (Reading Sections)
CREATE TABLE IF NOT EXISTS public.reading_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reading_id TEXT NOT NULL REFERENCES public.reading_items(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  vocab_notes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reading_sections_item ON public.reading_sections(reading_id, sort_order);

-- 3. Bảng Tiến trình đọc của người dùng (User Reading Progress)
CREATE TABLE IF NOT EXISTS public.user_reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reading_id TEXT NOT NULL REFERENCES public.reading_items(id) ON DELETE CASCADE,
  last_read_section INTEGER NOT NULL DEFAULT 0,
  bookmarks JSONB DEFAULT '[]'::jsonb,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_reading UNIQUE (user_id, reading_id)
);

CREATE INDEX IF NOT EXISTS idx_user_reading_progress_user ON public.user_reading_progress(user_id);

-- 4. Bảng Văn bản người dùng tự dán (User Texts - Riêng tư)
CREATE TABLE IF NOT EXISTS public.user_texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  language learning_language NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_texts_user ON public.user_texts(user_id, created_at DESC);

CREATE TRIGGER tr_user_texts_updated_at
  BEFORE UPDATE ON public.user_texts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Bảng Lượt tự dịch của người học (Translation Attempts)
CREATE TABLE IF NOT EXISTS public.translation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.reading_sections(id) ON DELETE CASCADE,
  user_translation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_translation_attempts_user_section ON public.translation_attempts(user_id, section_id);

-- ====================================================================
-- PHẦN 7: TỪ ĐIỂN CHUYÊN SÂU (Dictionary Entries)
-- ====================================================================

-- Bảng Mục từ điển (Dictionary Entries - Đọc công khai, Chỉ admin ghi, dữ liệu hợp pháp)
CREATE TABLE IF NOT EXISTS public.dictionary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language learning_language NOT NULL,
  headword TEXT NOT NULL,
  data JSONB NOT NULL, -- phonetics, senses đánh số, collocations, synonyms, antonyms
  source TEXT NOT NULL, -- Nguồn hợp pháp: 'wiktionary', 'wordnet', 'in_house'
  license TEXT NOT NULL, -- 'CC-BY-SA 4.0', 'Public Domain'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dict_lang_headword UNIQUE (language, headword)
);

CREATE INDEX IF NOT EXISTS idx_dict_entries_lang_word ON public.dictionary_entries(language, headword);

CREATE TRIGGER tr_dictionary_entries_updated_at
  BEFORE UPDATE ON public.dictionary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- PHẦN 8: YÊU CẦU TÍNH NĂNG (Feature Requests, Votes, Comments & Trigger)
-- ====================================================================

-- 1. Bảng Yêu cầu tính năng (Feature Requests)
CREATE TABLE IF NOT EXISTS public.feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) >= 6),
  description TEXT NOT NULL CHECK (char_length(description) >= 15),
  category TEXT NOT NULL CHECK (category IN ('luyen_thi', 'tu_vung', 'nghe_noi', 'tien_ich', 'cong_dong')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'under_review', 'in_progress', 'completed', 'rejected')),
  vote_count INTEGER NOT NULL DEFAULT 0 CHECK (vote_count >= 0),
  comment_count INTEGER NOT NULL DEFAULT 0 CHECK (comment_count >= 0),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON public.feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_votes ON public.feature_requests(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_feature_requests_created ON public.feature_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_requests_user ON public.feature_requests(user_id);

CREATE TRIGGER tr_feature_requests_updated_at
  BEFORE UPDATE ON public.feature_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. Bảng Bình chọn tính năng (Feature Request Votes - Khóa chính kép chống vote trùng)
CREATE TABLE IF NOT EXISTS public.feature_request_votes (
  request_id UUID NOT NULL REFERENCES public.feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (request_id, user_id)
);

-- Trigger tự động cập nhật vote_count trên feature_requests
CREATE OR REPLACE FUNCTION update_feature_request_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feature_requests
    SET vote_count = vote_count + 1
    WHERE id = NEW.request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feature_requests
    SET vote_count = GREATEST(0, vote_count - 1)
    WHERE id = OLD.request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_feature_request_votes_count
  AFTER INSERT OR DELETE ON public.feature_request_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_request_vote_count();

-- 3. Bảng Bình luận tính năng (Feature Request Comments)
CREATE TABLE IF NOT EXISTS public.feature_request_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.feature_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_comments_req ON public.feature_request_comments(request_id, created_at ASC);

-- Trigger tự động cập nhật comment_count trên feature_requests
CREATE OR REPLACE FUNCTION update_feature_request_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feature_requests
    SET comment_count = comment_count + 1
    WHERE id = NEW.request_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feature_requests
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_feature_request_comments_count
  AFTER INSERT OR DELETE ON public.feature_request_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_request_comment_count();

-- 4. View Công khai yêu cầu tính năng (Ẩn email và user_id riêng tư)
CREATE OR REPLACE VIEW public.feature_requests_public AS
SELECT
  fr.id,
  fr.title,
  fr.description,
  fr.category,
  fr.status,
  fr.vote_count,
  fr.comment_count,
  fr.tags,
  fr.created_at,
  fr.updated_at,
  p.full_name AS author_name,
  p.avatar_text AS author_avatar
FROM public.feature_requests fr
JOIN public.profiles p ON fr.user_id = p.id;

-- ====================================================================
-- PHẦN 9: BẬT RLS & CHÍNH SÁCH BẢO MẬT CHO TOÀN BỘ CÁC BẢNG MỚI
-- ====================================================================

ALTER TABLE public.typing_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stage_progress ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.user_saved_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pronunciation_recordings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.grammar_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_grammar_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_attempts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_cues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_media_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_video_cues ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reading_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_attempts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.dictionary_entries ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_request_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_request_comments ENABLE ROW LEVEL SECURITY;

-- 1. Policies Nội dung chung: Đọc công khai, Ghi chỉ Admin
CREATE POLICY "Typing topics are viewable by everyone"
  ON public.typing_topics FOR SELECT USING (true);
CREATE POLICY "Typing topics are manageable by admin"
  ON public.typing_topics FOR ALL USING (public.is_admin());

CREATE POLICY "Typing sentences are viewable by everyone"
  ON public.typing_sentences FOR SELECT USING (true);
CREATE POLICY "Typing sentences are manageable by admin"
  ON public.typing_sentences FOR ALL USING (public.is_admin());

CREATE POLICY "Learning stages are viewable by everyone"
  ON public.learning_stages FOR SELECT USING (true);
CREATE POLICY "Learning stages are manageable by admin"
  ON public.learning_stages FOR ALL USING (public.is_admin());

CREATE POLICY "Grammar points are viewable by everyone"
  ON public.grammar_points FOR SELECT USING (true);
CREATE POLICY "Grammar points are manageable by admin"
  ON public.grammar_points FOR ALL USING (public.is_admin());

CREATE POLICY "Grammar exercises are viewable by everyone"
  ON public.grammar_exercises FOR SELECT USING (true);
CREATE POLICY "Grammar exercises are manageable by admin"
  ON public.grammar_exercises FOR ALL USING (public.is_admin());

CREATE POLICY "Media items are viewable if published or admin"
  ON public.media_items FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "Media items are manageable by admin"
  ON public.media_items FOR ALL USING (public.is_admin());

CREATE POLICY "Media cues are viewable by everyone"
  ON public.media_cues FOR SELECT USING (true);
CREATE POLICY "Media cues are manageable by admin"
  ON public.media_cues FOR ALL USING (public.is_admin());

CREATE POLICY "Media quiz questions are viewable by everyone"
  ON public.media_quiz_questions FOR SELECT USING (true);
CREATE POLICY "Media quiz questions are manageable by admin"
  ON public.media_quiz_questions FOR ALL USING (public.is_admin());

CREATE POLICY "Reading items are viewable if published or admin"
  ON public.reading_items FOR SELECT USING (is_published = true OR public.is_admin());
CREATE POLICY "Reading items are manageable by admin"
  ON public.reading_items FOR ALL USING (public.is_admin());

CREATE POLICY "Reading sections are viewable by everyone"
  ON public.reading_sections FOR SELECT USING (true);
CREATE POLICY "Reading sections are manageable by admin"
  ON public.reading_sections FOR ALL USING (public.is_admin());

CREATE POLICY "Dictionary entries are viewable by everyone"
  ON public.dictionary_entries FOR SELECT USING (true);
CREATE POLICY "Dictionary entries are manageable by admin"
  ON public.dictionary_entries FOR ALL USING (public.is_admin());

-- 2. Policies Dữ liệu cá nhân: Chỉ chủ sở hữu đọc ghi
CREATE POLICY "Users can view own typing attempts"
  ON public.typing_attempts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stage progress"
  ON public.user_stage_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own saved words"
  ON public.user_saved_words FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own recordings"
  ON public.pronunciation_recordings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own grammar progress"
  ON public.user_grammar_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own grammar attempts"
  ON public.grammar_attempts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own media progress"
  ON public.user_media_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own videos"
  ON public.user_videos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own video cues"
  ON public.user_video_cues FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own reading progress"
  ON public.user_reading_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own texts"
  ON public.user_texts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own translation attempts"
  ON public.translation_attempts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Policies Yêu cầu tính năng & Bình luận
CREATE POLICY "Feature requests are viewable by everyone"
  ON public.feature_requests FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create feature request"
  ON public.feature_requests FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    status = 'new' AND
    vote_count = 0 AND
    comment_count = 0
  );

CREATE POLICY "Authors can update own request only when new"
  ON public.feature_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'new')
  WITH CHECK (auth.uid() = user_id AND status = 'new');

CREATE POLICY "Admins can update any feature request"
  ON public.feature_requests FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Authors or admins can delete feature request"
  ON public.feature_requests FOR DELETE
  USING ((auth.uid() = user_id AND status = 'new') OR public.is_admin());

CREATE POLICY "Users can view own votes"
  ON public.feature_request_votes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vote"
  ON public.feature_request_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vote"
  ON public.feature_request_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Feature comments are viewable by everyone"
  ON public.feature_request_comments FOR SELECT USING (true);

CREATE POLICY "Users can insert own comment"
  ON public.feature_request_comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users or admins can delete comment"
  ON public.feature_request_comments FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- 4. Storage Bucket pronunciation-recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('pronunciation-recordings', 'pronunciation-recordings', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own pronunciation recordings"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pronunciation-recordings' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Users can read own pronunciation recordings"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pronunciation-recordings' AND
    (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- ====================================================================
-- PHẦN 10: THU HỒI QUYỀN TRỰC TIẾP CLIENT & BẢO VỆ CHỐNG GIAN LẬN
-- ====================================================================

-- Thu hồi quyền INSERT trực tiếp của client lên xp_events (chỉ RPC award_xp được ghi)
DROP POLICY IF EXISTS "Users can insert own xp events" ON public.xp_events;

-- Thu hồi quyền ALL trực tiếp của client lên user_word_progress (chỉ SELECT; việc cập nhật SRS do review_word RPC làm)
DROP POLICY IF EXISTS "Users can manage own word progress" ON public.user_word_progress;
CREATE POLICY "Users can view own word progress"
  ON public.user_word_progress FOR SELECT
  USING (auth.uid() = user_id);

-- ====================================================================
-- PHẦN 11: CÁC HÀM RPC AN TOÀN (ANTI-CHEAT SECURITY DEFINER)
-- ====================================================================

-- 1. RPC Cộng XP an toàn, Idempotent, Giới hạn ngày (award_xp)
CREATE OR REPLACE FUNCTION public.award_xp(
  p_source TEXT,
  p_ref_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := COALESCE(p_user_id, auth.uid());
  v_base_xp INTEGER := 0;
  v_daily_total INTEGER := 0;
  v_already_awarded BOOLEAN := FALSE;
  v_new_total INTEGER := 0;
  v_max_daily_xp CONSTANT INTEGER := 500;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để nhận XP';
  END IF;

  -- 1. Bảng quy đổi điểm cố định trên server
  CASE p_source
    WHEN 'daily_checkin' THEN v_base_xp := 20;
    WHEN 'typing_attempt' THEN v_base_xp := 30;
    WHEN 'grammar_attempt' THEN v_base_xp := 40;
    WHEN 'media_dictation' THEN v_base_xp := 25;
    WHEN 'reading_complete' THEN v_base_xp := 35;
    WHEN 'stage_complete' THEN v_base_xp := 50;
    WHEN 'word_review' THEN v_base_xp := 5;
    WHEN 'exam_complete' THEN v_base_xp := 50;
    ELSE v_base_xp := 10;
  END CASE;

  -- 2. Kiểm tra Idempotent nếu có reference_id
  IF p_ref_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.xp_events
      WHERE user_id = v_user_id AND source = p_source AND reference_id = p_ref_id
    ) INTO v_already_awarded;

    IF v_already_awarded THEN
      SELECT total_xp INTO v_new_total FROM public.user_xp_totals WHERE user_id = v_user_id;
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Hoạt động này đã được cộng XP trước đó',
        'xp_gained', 0,
        'total_xp', v_new_total
      );
    END IF;
  END IF;

  -- 3. Kiểm tra trần XP hàng ngày
  SELECT COALESCE(SUM(xp_amount), 0) INTO v_daily_total
  FROM public.xp_events
  WHERE user_id = v_user_id AND created_at >= CURRENT_DATE;

  IF v_daily_total + v_base_xp > v_max_daily_xp THEN
    v_base_xp := GREATEST(0, v_max_daily_xp - v_daily_total);
    IF v_base_xp = 0 THEN
      SELECT total_xp INTO v_new_total FROM public.user_xp_totals WHERE user_id = v_user_id;
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Bạn đã đạt giới hạn tối đa 500 XP hôm nay',
        'xp_gained', 0,
        'total_xp', v_new_total
      );
    END IF;
  END IF;

  -- 4. Thêm sự kiện XP
  INSERT INTO public.xp_events (user_id, xp_amount, source, reference_id)
  VALUES (v_user_id, v_base_xp, p_source, p_ref_id);

  SELECT total_xp INTO v_new_total FROM public.user_xp_totals WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Đã nhận thành công +%s XP!', v_base_xp),
    'xp_gained', v_base_xp,
    'total_xp', v_new_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. RPC Nộp kết quả gõ câu an toàn (submit_typing_attempt)
CREATE OR REPLACE FUNCTION public.submit_typing_attempt(
  p_topic_id TEXT,
  p_wpm NUMERIC,
  p_accuracy NUMERIC,
  p_duration_seconds INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_attempt_id UUID;
  v_xp_result JSONB;
  v_xp_earned INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để nộp bài gõ';
  END IF;

  IF p_wpm < 0 OR p_accuracy < 0 OR p_accuracy > 100 THEN
    RAISE EXCEPTION 'Chỉ số WPM hoặc độ chính xác không hợp lệ';
  END IF;

  -- Thưởng XP nếu độ chính xác >= 80%
  IF p_accuracy >= 80 THEN
    v_xp_result := public.award_xp('typing_attempt', p_topic_id, v_user_id);
    v_xp_earned := (v_xp_result->>'xp_gained')::INTEGER;
  END IF;

  INSERT INTO public.typing_attempts (
    user_id, topic_id, wpm, accuracy, duration_seconds, xp_earned
  ) VALUES (
    v_user_id, p_topic_id, p_wpm, p_accuracy, GREATEST(1, p_duration_seconds), v_xp_earned
  ) RETURNING id INTO v_attempt_id;

  RETURN jsonb_build_object(
    'attempt_id', v_attempt_id,
    'wpm', p_wpm,
    'accuracy', p_accuracy,
    'xp_earned', v_xp_earned
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. RPC Chấm bài tập ngữ pháp tại Server (submit_grammar_attempt)
CREATE OR REPLACE FUNCTION public.submit_grammar_attempt(
  p_point_id TEXT,
  p_answers JSONB,
  p_duration_seconds INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_total_questions INTEGER := 0;
  v_correct_count INTEGER := 0;
  v_exercise RECORD;
  v_user_answer TEXT;
  v_score_percent NUMERIC(5, 2);
  v_xp_result JSONB;
  v_xp_earned INTEGER := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để nộp bài ngữ pháp';
  END IF;

  -- Chấm điểm trực tiếp từ database
  FOR v_exercise IN 
    SELECT id, correct_answer 
    FROM public.grammar_exercises 
    WHERE point_id = p_point_id 
    ORDER BY sort_order ASC
  LOOP
    v_total_questions := v_total_questions + 1;
    v_user_answer := TRIM(COALESCE(p_answers->>v_exercise.id, ''));
    
    IF LOWER(v_user_answer) = LOWER(TRIM(v_exercise.correct_answer)) THEN
      v_correct_count := v_correct_count + 1;
    END IF;
  END LOOP;

  IF v_total_questions = 0 THEN
    -- Nếu chưa có bài tập trong DB, nhận tổng câu từ payload
    v_total_questions := GREATEST(1, jsonb_array_length(jsonb_path_query_array(p_answers, '$.*')));
    v_correct_count := v_total_questions;
  END IF;

  v_score_percent := ROUND((v_correct_count::NUMERIC / v_total_questions::NUMERIC) * 100, 2);

  -- Đạt >= 75% thì thưởng XP và đánh dấu hoàn thành
  IF v_score_percent >= 75 THEN
    v_xp_result := public.award_xp('grammar_attempt', p_point_id, v_user_id);
    v_xp_earned := (v_xp_result->>'xp_gained')::INTEGER;

    INSERT INTO public.user_grammar_progress (
      user_id, point_id, is_completed, best_score, completed_at
    ) VALUES (
      v_user_id, p_point_id, true, v_correct_count, NOW()
    ) ON CONFLICT (user_id, point_id) DO UPDATE SET
      is_completed = true,
      best_score = GREATEST(public.user_grammar_progress.best_score, EXCLUDED.best_score),
      completed_at = COALESCE(public.user_grammar_progress.completed_at, NOW()),
      updated_at = NOW();
  END IF;

  INSERT INTO public.grammar_attempts (
    user_id, point_id, score, total_questions, answers, duration_seconds
  ) VALUES (
    v_user_id, p_point_id, v_correct_count, v_total_questions, p_answers, GREATEST(0, p_duration_seconds)
  );

  RETURN jsonb_build_object(
    'score', v_correct_count,
    'total_questions', v_total_questions,
    'accuracy_percent', v_score_percent,
    'passed', (v_score_percent >= 75),
    'xp_earned', v_xp_earned
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. RPC Ôn tập từ vựng & Tính toán SRS SuperMemo SM-2 (review_word)
CREATE OR REPLACE FUNCTION public.review_word(
  p_word_id UUID,
  p_rating INTEGER -- 1: Again, 2: Hard, 3: Good, 4: Easy
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_curr RECORD;
  v_ef NUMERIC(4, 2) := 2.50;
  v_reps INTEGER := 0;
  v_interval INTEGER := 1;
  v_next_review TIMESTAMPTZ;
  v_xp_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để ôn từ';
  END IF;

  IF p_rating < 1 OR p_rating > 4 THEN
    RAISE EXCEPTION 'Đánh giá rating phải từ 1 đến 4';
  END IF;

  -- Lấy trạng thái hiện tại nếu có
  SELECT * INTO v_curr
  FROM public.user_word_progress
  WHERE user_id = v_user_id AND word_id = p_word_id;

  IF FOUND THEN
    v_ef := v_curr.easiness_factor;
    v_reps := v_curr.repetition_count;
    v_interval := v_curr.interval_days;
  END IF;

  -- Thuật toán SM-2:
  IF p_rating >= 3 THEN -- Good hoặc Easy
    IF v_reps = 0 THEN
      v_interval := 1;
    ELSIF v_reps = 1 THEN
      v_interval := 6;
    ELSE
      v_interval := ROUND(v_interval * v_ef);
    END IF;
    v_reps := v_reps + 1;
  ELSE -- Again hoặc Hard
    v_reps := 0;
    v_interval := 1;
  END IF;

  -- Điều chỉnh Easiness Factor (EF)
  -- grade tương ứng từ 1..4 quy ra thang 2..5 của SM-2
  v_ef := v_ef + (0.1 - (5 - (p_rating + 1)) * (0.08 + (5 - (p_rating + 1)) * 0.02));
  v_ef := GREATEST(1.30, v_ef);

  v_next_review := NOW() + (v_interval || ' days')::INTERVAL;

  -- Cập nhật hoặc thêm mới tiến trình
  INSERT INTO public.user_word_progress (
    user_id, word_id, easiness_factor, repetition_count, interval_days,
    correct_count, incorrect_count, last_reviewed_at, next_review_at
  ) VALUES (
    v_user_id, p_word_id, v_ef, v_reps, v_interval,
    CASE WHEN p_rating >= 3 THEN 1 ELSE 0 END,
    CASE WHEN p_rating < 3 THEN 1 ELSE 0 END,
    NOW(), v_next_review
  ) ON CONFLICT (user_id, word_id) DO UPDATE SET
    easiness_factor = EXCLUDED.easiness_factor,
    repetition_count = EXCLUDED.repetition_count,
    interval_days = EXCLUDED.interval_days,
    correct_count = public.user_word_progress.correct_count + EXCLUDED.correct_count,
    incorrect_count = public.user_word_progress.incorrect_count + EXCLUDED.incorrect_count,
    last_reviewed_at = NOW(),
    next_review_at = EXCLUDED.next_review_at,
    updated_at = NOW();

  -- Thưởng 5 XP cho mỗi lần ôn
  v_xp_result := public.award_xp('word_review', p_word_id::text, v_user_id);

  RETURN jsonb_build_object(
    'word_id', p_word_id,
    'next_review_at', v_next_review,
    'interval_days', v_interval,
    'repetition_count', v_reps,
    'easiness_factor', v_ef,
    'xp_gained', (v_xp_result->>'xp_gained')::INTEGER
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. RPC Toggle Bình chọn tính năng an toàn (toggle_feature_vote)
CREATE OR REPLACE FUNCTION public.toggle_feature_vote(p_request_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_has_voted BOOLEAN;
  v_current_votes INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để bình chọn';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.feature_request_votes
    WHERE request_id = p_request_id AND user_id = v_user_id
  ) INTO v_has_voted;

  IF v_has_voted THEN
    DELETE FROM public.feature_request_votes
    WHERE request_id = p_request_id AND user_id = v_user_id;
  ELSE
    INSERT INTO public.feature_request_votes (request_id, user_id)
    VALUES (p_request_id, v_user_id);
  END IF;

  SELECT vote_count INTO v_current_votes
  FROM public.feature_requests
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'request_id', p_request_id,
    'has_voted', NOT v_has_voted,
    'vote_count', v_current_votes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. RPC Hoàn thành chặng học & Mở khóa chặng kế (complete_stage)
CREATE OR REPLACE FUNCTION public.complete_stage(p_stage_id TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_stage RECORD;
  v_next_stage RECORD;
  v_xp_result JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để hoàn thành chặng';
  END IF;

  SELECT * INTO v_stage FROM public.learning_stages WHERE id = p_stage_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chặng học không tồn tại';
  END IF;

  -- 1. Đánh dấu hoàn thành
  INSERT INTO public.user_stage_progress (user_id, stage_id, is_completed, completed_at)
  VALUES (v_user_id, p_stage_id, true, NOW())
  ON CONFLICT (user_id, stage_id) DO UPDATE SET
    is_completed = true,
    completed_at = COALESCE(public.user_stage_progress.completed_at, NOW()),
    updated_at = NOW();

  -- 2. Thưởng XP hoàn thành chặng (50 XP)
  v_xp_result := public.award_xp('stage_complete', p_stage_id, v_user_id);

  -- 3. Tìm chặng tiếp theo
  SELECT id, title, level INTO v_next_stage
  FROM public.learning_stages
  WHERE stage_type = v_stage.stage_type 
    AND language = v_stage.language 
    AND sort_order > v_stage.sort_order
  ORDER BY sort_order ASC
  LIMIT 1;

  RETURN jsonb_build_object(
    'stage_id', p_stage_id,
    'is_completed', true,
    'xp_earned', (v_xp_result->>'xp_gained')::INTEGER,
    'next_stage_id', v_next_stage.id,
    'next_stage_title', v_next_stage.title
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ====================================================================
-- PHẦN 12: CẬP NHẬT VIEW THỐNG KÊ (DAILY USER STATS & WEEKLY USER SUMMARY)
-- ====================================================================

CREATE OR REPLACE VIEW public.daily_user_stats AS
SELECT
  p.id AS user_id,
  CURRENT_DATE AS stat_date,
  
  -- Thời gian học hôm nay: thi thử + gõ câu + làm ngữ pháp (phút)
  COALESCE(ROUND((
    COALESCE((SELECT SUM(duration_seconds) FROM public.exam_attempts WHERE user_id = p.id AND completed_at >= CURRENT_DATE), 0) +
    COALESCE((SELECT SUM(duration_seconds) FROM public.typing_attempts WHERE user_id = p.id AND completed_at >= CURRENT_DATE), 0) +
    COALESCE((SELECT SUM(duration_seconds) FROM public.grammar_attempts WHERE user_id = p.id AND completed_at >= CURRENT_DATE), 0)
  ) / 60.0), 0)::INTEGER AS learning_time_minutes,
  
  -- Số từ mới thêm hôm nay
  (
    SELECT COUNT(id)::INTEGER 
    FROM public.user_word_progress 
    WHERE user_id = p.id AND created_at >= CURRENT_DATE
  ) AS new_words_learned,
  
  -- Số bài hoàn thành hôm nay (thi + gõ câu + ngữ pháp + video + đọc)
  (
    COALESCE((SELECT COUNT(id) FROM public.exam_attempts WHERE user_id = p.id AND completed_at >= CURRENT_DATE), 0) +
    COALESCE((SELECT COUNT(id) FROM public.typing_attempts WHERE user_id = p.id AND completed_at >= CURRENT_DATE), 0) +
    COALESCE((SELECT COUNT(id) FROM public.grammar_attempts WHERE user_id = p.id AND completed_at >= CURRENT_DATE), 0) +
    COALESCE((SELECT COUNT(id) FROM public.user_media_progress WHERE user_id = p.id AND is_completed = true AND updated_at >= CURRENT_DATE), 0) +
    COALESCE((SELECT COUNT(id) FROM public.user_reading_progress WHERE user_id = p.id AND is_completed = true AND last_read_at >= CURRENT_DATE), 0)
  )::INTEGER AS completed_lessons,
  
  -- Tổng XP hôm nay
  (
    SELECT COALESCE(SUM(xp_amount), 0)::INTEGER 
    FROM public.xp_events 
    WHERE user_id = p.id AND created_at >= CURRENT_DATE
  ) AS xp_gained_today

FROM public.profiles p;

CREATE OR REPLACE VIEW public.weekly_user_summary AS
SELECT
  p.id AS user_id,
  DATE_TRUNC('week', NOW())::DATE AS week_start,
  
  -- Chuỗi streak hiện tại
  public.get_user_streak(p.id) AS current_streak_days,
  
  -- Tổng thời gian tuần (phút)
  COALESCE(ROUND((
    COALESCE((SELECT SUM(duration_seconds) FROM public.exam_attempts WHERE user_id = p.id AND completed_at >= DATE_TRUNC('week', NOW())), 0) +
    COALESCE((SELECT SUM(duration_seconds) FROM public.typing_attempts WHERE user_id = p.id AND completed_at >= DATE_TRUNC('week', NOW())), 0) +
    COALESCE((SELECT SUM(duration_seconds) FROM public.grammar_attempts WHERE user_id = p.id AND completed_at >= DATE_TRUNC('week', NOW())), 0)
  ) / 60.0), 0)::INTEGER AS total_weekly_minutes,
  
  -- Tổng bài hoàn thành tuần
  (
    COALESCE((SELECT COUNT(id) FROM public.exam_attempts WHERE user_id = p.id AND completed_at >= DATE_TRUNC('week', NOW())), 0) +
    COALESCE((SELECT COUNT(id) FROM public.typing_attempts WHERE user_id = p.id AND completed_at >= DATE_TRUNC('week', NOW())), 0) +
    COALESCE((SELECT COUNT(id) FROM public.grammar_attempts WHERE user_id = p.id AND completed_at >= DATE_TRUNC('week', NOW())), 0) +
    COALESCE((SELECT COUNT(id) FROM public.user_media_progress WHERE user_id = p.id AND is_completed = true AND updated_at >= DATE_TRUNC('week', NOW())), 0) +
    COALESCE((SELECT COUNT(id) FROM public.user_reading_progress WHERE user_id = p.id AND is_completed = true AND last_read_at >= DATE_TRUNC('week', NOW())), 0)
  )::INTEGER AS completed_tests_count,
  
  -- Từ mới trong tuần
  (
    SELECT COUNT(id)::INTEGER
    FROM public.user_word_progress
    WHERE user_id = p.id AND created_at >= DATE_TRUNC('week', NOW())
  ) AS weekly_words_learned,
  
  -- XP trong tuần
  (
    SELECT COALESCE(SUM(xp_amount), 0)::INTEGER
    FROM public.xp_events
    WHERE user_id = p.id AND created_at >= DATE_TRUNC('week', NOW())
  ) AS weekly_xp

FROM public.profiles p;
