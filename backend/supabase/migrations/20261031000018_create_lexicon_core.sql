-- Migration 18: Kho từ vựng trung tâm (Lexicon) - Giai đoạn 1
-- Dự án: Langua (Học ngoại ngữ & Luyện thi phi thương mại)
--
-- NGUYÊN TẮC
--  * CỘNG THÊM, không sửa hay xóa bảng cũ (vocab_sets, vocab_words, dictionary_entries,
--    user_word_progress...). Frontend hiện tại vẫn chạy bình thường sau migration này.
--  * Tiền tố lex_ cho mọi bảng mới để không nhầm với bảng cũ.
--  * Mọi bảng bật RLS. Khách chỉ đọc nội dung đã published và đã được duyệt.
--  * Ghi dữ liệu: chỉ admin (public.is_admin()) hoặc script chạy bằng service_role.
--
-- MÔ HÌNH
--  lex_entries (mục từ) 1-n lex_senses (nghĩa, có cấp độ riêng từng nghĩa)
--  lex_senses 1-n lex_translations (dịch) / lex_examples (ví dụ) / lex_sense_levels (cấp độ theo từng nguồn)
--  lex_entries 1-n lex_forms / lex_pronunciations / lex_relations, n-n lex_topics
--  Nguồn gốc: lex_sources, lex_import_batches, lex_raw_records, lex_attributions

-- ====================================================================
-- PHẦN 0: EXTENSION TÌM KIẾM
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- ====================================================================
-- PHẦN 1: HÀM TIỆN ÍCH
-- ====================================================================

-- Kiểm tra cấp độ hợp lệ theo hệ thống (CEFR / HSK / JLPT / tùy chỉnh)
CREATE OR REPLACE FUNCTION public.lex_level_is_valid(p_system TEXT, p_level TEXT)
RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN p_level IS NULL THEN TRUE
    WHEN p_system = 'cefr'   THEN p_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
    WHEN p_system = 'hsk'    THEN p_level IN ('1', '2', '3', '4', '5', '6', '7', '8', '9', '7-9')
    WHEN p_system = 'jlpt'   THEN p_level IN ('N5', 'N4', 'N3', 'N2', 'N1')
    WHEN p_system = 'custom' THEN TRUE
    ELSE FALSE
  END;
$$;

-- ====================================================================
-- PHẦN 2: NGUỒN GỐC DỮ LIỆU (governance)
-- ====================================================================

-- Nguồn dữ liệu và giấy phép. Đọc công khai (để làm trang Credits) nên KHÔNG ghi thông tin nội bộ ở đây.
CREATE TABLE IF NOT EXISTS public.lex_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9_-]+$'),
  name TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  license_name TEXT,
  license_url TEXT,
  attribution_text TEXT,
  requires_share_alike BOOLEAN,
  license_verified BOOLEAN NOT NULL DEFAULT FALSE, -- chỉ bật sau khi bạn tự đối chiếu giấy phép
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mỗi lần import là một batch
CREATE TABLE IF NOT EXISTS public.lex_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.lex_sources(id) ON DELETE SET NULL,
  batch_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_records INTEGER NOT NULL DEFAULT 0 CHECK (total_records >= 0),
  processed_records INTEGER NOT NULL DEFAULT 0 CHECK (processed_records >= 0),
  failed_records INTEGER NOT NULL DEFAULT 0 CHECK (failed_records >= 0),
  started_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  error_summary JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);


CREATE INDEX IF NOT EXISTS idx_lex_batches_source ON public.lex_import_batches(source_id);
CREATE INDEX IF NOT EXISTS idx_lex_batches_source_status ON public.lex_import_batches(source_id, status);

-- Dữ liệu gốc, giữ nguyên để truy vết và import lại
CREATE TABLE IF NOT EXISTS public.lex_raw_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.lex_import_batches(id) ON DELETE CASCADE,
  external_id TEXT,
  raw_data JSONB NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (processing_status IN ('pending', 'processed', 'failed', 'skipped')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_lex_raw_batch_external
  ON public.lex_raw_records(batch_id, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lex_raw_batch_status
  ON public.lex_raw_records(batch_id, processing_status);

-- ====================================================================
-- PHẦN 3: MỤC TỪ, NGHĨA
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.lex_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language learning_language NOT NULL DEFAULT 'en',
  entry_type TEXT NOT NULL DEFAULT 'word'
    CHECK (entry_type IN ('word', 'phrasal_verb', 'idiom', 'collocation', 'phrase', 'character')),
  lemma TEXT NOT NULL CHECK (char_length(btrim(lemma)) BETWEEN 1 AND 200),
  -- Khóa tìm kiếm tự sinh: giữ nguyên dạng hiển thị trong cột lemma
  normalized_lemma TEXT GENERATED ALWAYS AS (lower(btrim(lemma))) STORED,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'review', 'published', 'rejected')),
  frequency_rank INTEGER CHECK (frequency_rank > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lex_entry UNIQUE (language, entry_type, normalized_lemma)
);

CREATE INDEX IF NOT EXISTS idx_lex_entries_prefix
  ON public.lex_entries(language, normalized_lemma text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_lex_entries_trgm
  ON public.lex_entries USING gin (normalized_lemma extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_lex_entries_status ON public.lex_entries(status);
CREATE INDEX IF NOT EXISTS idx_lex_entries_freq ON public.lex_entries(language, frequency_rank);

-- Mỗi nghĩa có cấp độ RIÊNG (run = chạy: A1, run = điều hành: B2)
CREATE TABLE IF NOT EXISTS public.lex_senses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.lex_entries(id) ON DELETE CASCADE,
  sense_order INTEGER NOT NULL DEFAULT 1 CHECK (sense_order >= 1),
  part_of_speech TEXT NOT NULL CHECK (part_of_speech IN (
    'noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction',
    'interjection', 'determiner', 'numeral', 'particle', 'classifier', 'phrase', 'other'
  )),
  definition TEXT NOT NULL CHECK (char_length(btrim(definition)) > 0),
  definition_lang TEXT NOT NULL DEFAULT 'en',
  -- Cấp độ hiển thị. Đánh giá của từng nguồn nằm ở lex_sense_levels
  level_system TEXT NOT NULL DEFAULT 'cefr' CHECK (level_system IN ('cefr', 'hsk', 'jlpt', 'custom')),
  level TEXT,
  content_origin TEXT NOT NULL DEFAULT 'imported'
    CHECK (content_origin IN ('imported', 'ai_generated', 'human_written')),
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lex_sense_order UNIQUE (entry_id, sense_order),
  CONSTRAINT chk_lex_sense_level CHECK (public.lex_level_is_valid(level_system, level))
);

CREATE INDEX IF NOT EXISTS idx_lex_senses_level ON public.lex_senses(level_system, level);
CREATE INDEX IF NOT EXISTS idx_lex_senses_review ON public.lex_senses(review_status);

-- Giữ NGUYÊN từng đánh giá của từng nguồn, không lấy trung bình
CREATE TABLE IF NOT EXISTS public.lex_sense_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sense_id UUID NOT NULL REFERENCES public.lex_senses(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.lex_sources(id) ON DELETE CASCADE,
  level_system TEXT NOT NULL CHECK (level_system IN ('cefr', 'hsk', 'jlpt', 'custom')),
  level TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lex_sense_level UNIQUE (sense_id, source_id, level_system),
  CONSTRAINT chk_lex_sense_levels_valid CHECK (public.lex_level_is_valid(level_system, level))
);

CREATE INDEX IF NOT EXISTS idx_lex_sense_levels_source ON public.lex_sense_levels(source_id);

-- ====================================================================
-- PHẦN 4: DẠNG TỪ, PHÁT ÂM, DỊCH, VÍ DỤ
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.lex_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.lex_entries(id) ON DELETE CASCADE,
  form TEXT NOT NULL CHECK (char_length(btrim(form)) > 0),
  form_type TEXT NOT NULL CHECK (form_type IN (
    'plural', 'past', 'past_participle', 'present_participle', 'third_person',
    'comparative', 'superlative', 'variant_spelling', 'other'
  )),
  CONSTRAINT uq_lex_form UNIQUE (entry_id, form, form_type)
);

-- Tra "went" ra "go"
CREATE INDEX IF NOT EXISTS idx_lex_forms_lower ON public.lex_forms(lower(form));

CREATE TABLE IF NOT EXISTS public.lex_pronunciations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.lex_entries(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'ipa' CHECK (kind IN ('ipa', 'pinyin', 'kana', 'romaji')),
  accent TEXT NOT NULL DEFAULT 'general', -- 'en-US', 'en-GB', ...
  transcription TEXT,
  audio_url TEXT,
  audio_source TEXT CHECK (audio_source IN ('dataset', 'tts', 'recorded', 'browser_tts')),
  audio_license TEXT,
  CONSTRAINT chk_lex_pron_content CHECK (transcription IS NOT NULL OR audio_url IS NOT NULL),
  CONSTRAINT uq_lex_pron UNIQUE (entry_id, kind, accent)
);

CREATE TABLE IF NOT EXISTS public.lex_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sense_id UUID NOT NULL REFERENCES public.lex_senses(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL DEFAULT 'vi' CHECK (language_code ~ '^[a-z]{2,3}(-[A-Za-z]{2,4})?$'),
  translated_text TEXT NOT NULL CHECK (char_length(btrim(translated_text)) > 0),
  note TEXT,
  content_origin TEXT NOT NULL DEFAULT 'imported'
    CHECK (content_origin IN ('imported', 'ai_generated', 'human_written')),
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lex_translation UNIQUE (sense_id, language_code, translated_text)
);

CREATE INDEX IF NOT EXISTS idx_lex_translations_sense ON public.lex_translations(sense_id);
CREATE INDEX IF NOT EXISTS idx_lex_translations_trgm
  ON public.lex_translations USING gin (translated_text extensions.gin_trgm_ops);

CREATE TABLE IF NOT EXISTS public.lex_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sense_id UUID NOT NULL REFERENCES public.lex_senses(id) ON DELETE CASCADE,
  sentence TEXT NOT NULL CHECK (char_length(btrim(sentence)) > 0),
  sentence_vi TEXT,
  source_id UUID REFERENCES public.lex_sources(id) ON DELETE SET NULL,
  source_ref TEXT,      -- ví dụ: id câu trong Tatoeba
  author_credit TEXT,   -- người đóng góp, nếu giấy phép yêu cầu ghi
  content_origin TEXT NOT NULL DEFAULT 'imported'
    CHECK (content_origin IN ('imported', 'ai_generated', 'human_written')),
  review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lex_examples_sense ON public.lex_examples(sense_id);
CREATE INDEX IF NOT EXISTS idx_lex_examples_source ON public.lex_examples(source_id);

-- ====================================================================
-- PHẦN 5: QUAN HỆ TỪ VỰNG, CHỦ ĐỀ, THẺ KỲ THI
-- ====================================================================

-- Đích là một mục từ (target_entry_id) HOẶC một cụm chữ tự do (target_text, dùng cho collocation)
CREATE TABLE IF NOT EXISTS public.lex_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entry_id UUID NOT NULL REFERENCES public.lex_entries(id) ON DELETE CASCADE,
  source_sense_id UUID REFERENCES public.lex_senses(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL CHECK (relation_type IN (
    'synonym', 'antonym', 'hypernym', 'hyponym', 'collocation', 'related', 'derived_from'
  )),
  target_entry_id UUID REFERENCES public.lex_entries(id) ON DELETE CASCADE,
  target_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_lex_rel_one_target CHECK (num_nonnulls(target_entry_id, target_text) = 1),
  CONSTRAINT chk_lex_rel_not_self CHECK (target_entry_id IS NULL OR target_entry_id <> source_entry_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_lex_rel_entry
  ON public.lex_relations(source_entry_id, relation_type, target_entry_id) WHERE target_entry_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_lex_rel_text
  ON public.lex_relations(source_entry_id, relation_type, lower(target_text)) WHERE target_text IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lex_rel_target ON public.lex_relations(target_entry_id);

-- kind = 'topic' (Daily Life, Business...) hoặc 'exam_tag' (ielts, toeic, hsk...)
CREATE TABLE IF NOT EXISTS public.lex_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL DEFAULT 'topic' CHECK (kind IN ('topic', 'exam_tag')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lex_topic_name UNIQUE (kind, name)
);

CREATE TABLE IF NOT EXISTS public.lex_entry_topics (
  entry_id UUID NOT NULL REFERENCES public.lex_entries(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.lex_topics(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_lex_entry_topics_topic ON public.lex_entry_topics(topic_id);

-- ====================================================================
-- PHẦN 6: TRUY VẾT NGUỒN TỪNG BẢN GHI, BÁO LỖI TỪ NGƯỜI DÙNG
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.lex_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.lex_sources(id) ON DELETE CASCADE,
  raw_record_id UUID REFERENCES public.lex_raw_records(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'entry', 'sense', 'example', 'translation', 'pronunciation', 'relation'
  )),
  entity_id UUID NOT NULL,
  source_url TEXT,
  license_name TEXT,
  attribution_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lex_attr_entity ON public.lex_attributions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_lex_attr_source ON public.lex_attributions(source_id);
CREATE INDEX IF NOT EXISTS idx_lex_attr_raw ON public.lex_attributions(raw_record_id);

CREATE TABLE IF NOT EXISTS public.lex_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES public.lex_entries(id) ON DELETE CASCADE,
  sense_id UUID REFERENCES public.lex_senses(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN (
    'wrong_meaning', 'wrong_translation', 'wrong_pronunciation', 'wrong_level',
    'bad_example', 'offensive', 'other'
  )),
  message TEXT CHECK (char_length(message) <= 1000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lex_reports_user ON public.lex_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lex_reports_status ON public.lex_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lex_reports_entry ON public.lex_reports(entry_id);
CREATE INDEX IF NOT EXISTS idx_lex_reports_sense ON public.lex_reports(sense_id);

-- ====================================================================
-- PHẦN 7: LIÊN KẾT VỚI BẢNG CŨ (flashcard dùng nghĩa trong kho trung tâm)
-- ====================================================================

ALTER TABLE public.vocab_words
  ADD COLUMN IF NOT EXISTS lex_sense_id UUID REFERENCES public.lex_senses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vocab_words_lex_sense ON public.vocab_words(lex_sense_id);

-- ====================================================================
-- PHẦN 8: TRIGGER
-- ====================================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['lex_entries', 'lex_senses', 'lex_translations', 'lex_examples', 'lex_reports'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS tr_%1$s_updated_at ON public.%1$I', t);
    EXECUTE format(
      'CREATE TRIGGER tr_%1$s_updated_at BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t
    );
  END LOOP;
END $$;

-- Không cho publish mục từ nếu chưa có nghĩa nào được duyệt (áp dụng cả cho script service_role)
CREATE OR REPLACE FUNCTION public.lex_guard_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'published'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.lex_senses s
      WHERE s.entry_id = NEW.id AND s.review_status = 'approved'
    ) THEN
      RAISE EXCEPTION 'Không thể publish mục từ "%": chưa có nghĩa nào được duyệt', NEW.lemma
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_lex_entries_guard_publish ON public.lex_entries;
CREATE TRIGGER tr_lex_entries_guard_publish
  BEFORE INSERT OR UPDATE OF status ON public.lex_entries
  FOR EACH ROW EXECUTE FUNCTION public.lex_guard_publish();

-- ====================================================================
-- PHẦN 9: HÀM HỖ TRỢ RLS (SECURITY DEFINER, khóa search_path)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.lex_entry_is_published(p_entry_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lex_entries e WHERE e.id = p_entry_id AND e.status = 'published'
  );
$$;

CREATE OR REPLACE FUNCTION public.lex_sense_is_public(p_sense_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.lex_senses s
    JOIN public.lex_entries e ON e.id = s.entry_id
    WHERE s.id = p_sense_id AND s.review_status = 'approved' AND e.status = 'published'
  );
$$;

REVOKE ALL ON FUNCTION public.lex_entry_is_published(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lex_sense_is_public(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lex_entry_is_published(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lex_sense_is_public(UUID) TO anon, authenticated;

-- ====================================================================
-- PHẦN 10: RLS
-- ====================================================================

-- 10.1 Bật RLS + admin được toàn quyền trên mọi bảng lex_*
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'lex_sources', 'lex_import_batches', 'lex_raw_records', 'lex_entries', 'lex_senses',
    'lex_sense_levels', 'lex_forms', 'lex_pronunciations', 'lex_translations', 'lex_examples',
    'lex_relations', 'lex_topics', 'lex_entry_topics', 'lex_attributions', 'lex_reports'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Admin manages %1$s" ON public.%1$I', t);
    EXECUTE format(
      'CREATE POLICY "Admin manages %1$s" ON public.%1$I FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())',
      t
    );
  END LOOP;
END $$;

-- 10.2 Đọc công khai: chỉ nội dung đã published và đã duyệt
DROP POLICY IF EXISTS "Public reads published lex_entries" ON public.lex_entries;
CREATE POLICY "Public reads published lex_entries"
  ON public.lex_entries FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Public reads approved lex_senses" ON public.lex_senses;
CREATE POLICY "Public reads approved lex_senses"
  ON public.lex_senses FOR SELECT
  USING (review_status = 'approved' AND public.lex_entry_is_published(entry_id));

DROP POLICY IF EXISTS "Public reads lex_sense_levels" ON public.lex_sense_levels;
CREATE POLICY "Public reads lex_sense_levels"
  ON public.lex_sense_levels FOR SELECT
  USING (public.lex_sense_is_public(sense_id));

DROP POLICY IF EXISTS "Public reads lex_forms" ON public.lex_forms;
CREATE POLICY "Public reads lex_forms"
  ON public.lex_forms FOR SELECT
  USING (public.lex_entry_is_published(entry_id));

DROP POLICY IF EXISTS "Public reads lex_pronunciations" ON public.lex_pronunciations;
CREATE POLICY "Public reads lex_pronunciations"
  ON public.lex_pronunciations FOR SELECT
  USING (public.lex_entry_is_published(entry_id));

DROP POLICY IF EXISTS "Public reads approved lex_translations" ON public.lex_translations;
CREATE POLICY "Public reads approved lex_translations"
  ON public.lex_translations FOR SELECT
  USING (review_status = 'approved' AND public.lex_sense_is_public(sense_id));

DROP POLICY IF EXISTS "Public reads approved lex_examples" ON public.lex_examples;
CREATE POLICY "Public reads approved lex_examples"
  ON public.lex_examples FOR SELECT
  USING (review_status = 'approved' AND public.lex_sense_is_public(sense_id));

DROP POLICY IF EXISTS "Public reads lex_relations" ON public.lex_relations;
CREATE POLICY "Public reads lex_relations"
  ON public.lex_relations FOR SELECT
  USING (
    public.lex_entry_is_published(source_entry_id)
    AND (target_entry_id IS NULL OR public.lex_entry_is_published(target_entry_id))
  );

DROP POLICY IF EXISTS "Public reads lex_entry_topics" ON public.lex_entry_topics;
CREATE POLICY "Public reads lex_entry_topics"
  ON public.lex_entry_topics FOR SELECT
  USING (public.lex_entry_is_published(entry_id));

DROP POLICY IF EXISTS "Public reads lex_topics" ON public.lex_topics;
CREATE POLICY "Public reads lex_topics"
  ON public.lex_topics FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public reads lex_sources" ON public.lex_sources;
CREATE POLICY "Public reads lex_sources"
  ON public.lex_sources FOR SELECT
  USING (true);

-- 10.3 Báo lỗi từ: người dùng gửi và xem báo lỗi của chính mình
DROP POLICY IF EXISTS "Users read own lex_reports" ON public.lex_reports;
CREATE POLICY "Users read own lex_reports"
  ON public.lex_reports FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users create own lex_reports" ON public.lex_reports;
CREATE POLICY "Users create own lex_reports"
  ON public.lex_reports FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 'open'
    AND public.lex_entry_is_published(entry_id)
  );

-- lex_import_batches, lex_raw_records, lex_attributions: chỉ có policy admin ở 10.1

-- ====================================================================
-- PHẦN 11: QUYỀN BẢNG (không dựa vào grant mặc định)
-- ====================================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'lex_sources', 'lex_import_batches', 'lex_raw_records', 'lex_entries', 'lex_senses',
    'lex_sense_levels', 'lex_forms', 'lex_pronunciations', 'lex_translations', 'lex_examples',
    'lex_relations', 'lex_topics', 'lex_entry_topics', 'lex_attributions', 'lex_reports'
  ] LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    -- RLS quyết định ai thực sự được ghi (admin); service_role bỏ qua RLS
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;

  -- Khách (chưa đăng nhập) chỉ được ĐỌC các bảng nội dung công khai
  FOREACH t IN ARRAY ARRAY[
    'lex_sources', 'lex_entries', 'lex_senses', 'lex_sense_levels', 'lex_forms',
    'lex_pronunciations', 'lex_translations', 'lex_examples', 'lex_relations',
    'lex_topics', 'lex_entry_topics'
  ] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
  END LOOP;
END $$;

-- ====================================================================
-- PHẦN 12: TÌM KIẾM VÀ THỐNG KÊ
-- ====================================================================

-- Tìm mục từ theo tiền tố hoặc gần đúng (gõ sai chính tả). SECURITY INVOKER nên RLS vẫn áp dụng.
CREATE OR REPLACE FUNCTION public.search_lex_entries(
  p_query TEXT,
  p_language learning_language DEFAULT 'en',
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  entry_id UUID,
  lemma TEXT,
  entry_type TEXT,
  match_rank INTEGER,
  score REAL
)
LANGUAGE sql STABLE
SET search_path = public, extensions
AS $$
  WITH q AS (
    SELECT lower(btrim(p_query)) AS term
  )
  SELECT
    e.id AS entry_id,
    e.lemma AS lemma,
    e.entry_type AS entry_type,
    (CASE
       WHEN e.normalized_lemma = q.term THEN 0
       WHEN e.normalized_lemma LIKE
         replace(replace(replace(q.term, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%' THEN 1
       ELSE 2
     END) AS match_rank,
    similarity(e.normalized_lemma, q.term) AS score
  FROM public.lex_entries e
  CROSS JOIN q
  WHERE char_length(q.term) >= 1
    AND e.language = p_language
    AND (
      e.normalized_lemma LIKE
        replace(replace(replace(q.term, E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%'
      OR e.normalized_lemma % q.term
    )
  ORDER BY match_rank, score DESC, e.frequency_rank NULLS LAST, e.lemma
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);
$$;

GRANT EXECUTE ON FUNCTION public.search_lex_entries(TEXT, learning_language, INTEGER) TO anon, authenticated;

-- Thống kê độ phủ để kiểm tra từng đợt import. security_invoker: người thường chỉ thấy phần published.
CREATE OR REPLACE VIEW public.lex_coverage_stats
WITH (security_invoker = true) AS
SELECT
  e.language,
  e.entry_type,
  e.status,
  s.level_system,
  s.level,
  COUNT(DISTINCT e.id)::INTEGER AS entries,
  COUNT(s.id)::INTEGER AS senses
FROM public.lex_entries e
LEFT JOIN public.lex_senses s ON s.entry_id = e.id
GROUP BY e.language, e.entry_type, e.status, s.level_system, s.level;

REVOKE ALL ON public.lex_coverage_stats FROM anon, authenticated;
GRANT SELECT ON public.lex_coverage_stats TO authenticated;

COMMENT ON TABLE public.lex_entries IS 'Kho từ vựng trung tâm: mục từ (lemma). Nghĩa nằm ở lex_senses.';
COMMENT ON TABLE public.lex_senses IS 'Từng nghĩa của mục từ; cấp độ gắn theo nghĩa, không gắn theo từ.';
COMMENT ON TABLE public.lex_sources IS 'Nguồn dữ liệu và giấy phép. Đọc công khai cho trang Credits, không ghi thông tin nội bộ.';
COMMENT ON COLUMN public.vocab_words.lex_sense_id IS 'Liên kết tùy chọn tới nghĩa trong kho trung tâm (lex_senses).';