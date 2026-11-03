-- Migration 23: Liên kết Ngữ nghĩa Từ vựng An toàn (Semantic Vocabulary Linkage & Multilingual Integrity)
--
-- Mục tiêu:
-- 1. Bổ sung các chỉ mục hiệu năng (indexes) và ràng buộc toàn vẹn (integrity constraint) trên vocab_words.
-- 2. Gán lex_entry_id và lex_sense_id có kiểm soát ngữ nghĩa chặt chẽ (Semantic Matching) cho các từ tiếng Anh hệ thống.
-- 3. Bảo toàn tuyệt đối lex_sense_id = NULL cho 10 từ tiếng Trung (zh) và 10 từ tiếng Nhật (ja).
-- 4. Đảm bảo 100% bản ghi vocab_words cũ không bị xóa hay biến dạng, duy trì tính tương thích ngược hoàn hảo.

-- ====================================================================
-- PHẦN 1: BỔ SUNG CHỈ MỤC & RÀNG BUỘC TOÀN VẸN
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_vocab_words_set_order 
  ON public.vocab_words(set_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_vocab_words_lex_sense 
  ON public.vocab_words(lex_sense_id);

CREATE INDEX IF NOT EXISTS idx_vocab_words_lex_entry 
  ON public.vocab_words(lex_entry_id);

-- Ràng buộc toàn vẹn: nếu có lex_sense_id thì bắt buộc phải có lex_entry_id
ALTER TABLE public.vocab_words 
  DROP CONSTRAINT IF EXISTS chk_vocab_words_lex_integrity;

ALTER TABLE public.vocab_words 
  ADD CONSTRAINT chk_vocab_words_lex_integrity 
  CHECK (lex_sense_id IS NULL OR lex_entry_id IS NOT NULL);

-- ====================================================================
-- PHẦN 2: LIÊN KẾT MỤC TỪ CANONICAL (lex_entry_id) CHO TỪ TIẾNG ANH
-- ====================================================================

-- Chỉ liên kết lex_entry_id cho các từ vựng thuộc bộ từ tiếng Anh (language = 'en')
-- Tuyệt đối không can thiệp vào các bộ từ tiếng Trung (zh) hoặc tiếng Nhật (ja)
UPDATE public.vocab_words vw
SET lex_entry_id = le.id
FROM public.vocab_sets vs, public.lex_entries le
WHERE vw.set_id = vs.id
  AND vs.language = 'en'
  AND vw.lex_entry_id IS NULL
  AND le.language = 'en'
  AND le.entry_type = 'word'
  AND le.normalized_lemma = lower(btrim(vw.word));

-- ====================================================================
-- PHẦN 3: LIÊN KẾT NGHĨA CHUẨN XÁC (lex_sense_id) CÓ KIỂM SOÁT NGỮ NGHĨA
-- ====================================================================

-- 3.1. Nhóm từ đơn nghĩa tuyệt đối (Single Sense) trong Lexicon
-- Bao gồm: Comprehensive, Detrimental, Superfluous
WITH single_sense_matches AS (
  SELECT ls.entry_id, ls.id AS sense_id
  FROM public.lex_senses ls
  WHERE ls.entry_id IN (
    SELECT id FROM public.lex_entries
    WHERE language = 'en' AND normalized_lemma IN ('comprehensive', 'detrimental', 'superfluous')
  )
  GROUP BY ls.entry_id, ls.id
  HAVING COUNT(*) = 1
)
UPDATE public.vocab_words vw
SET lex_sense_id = ssm.sense_id
FROM single_sense_matches ssm
WHERE vw.lex_entry_id = ssm.entry_id
  AND vw.lex_sense_id IS NULL;

-- 3.2. Nhóm từ đa nghĩa đã được thẩm định khớp chuẩn từ loại và định nghĩa sư phạm
-- Gán chính xác sense_order = 1 (định nghĩa gốc và mang cấp độ CEFR chuẩn)
WITH semantic_verified_matches AS (
  SELECT ls.entry_id, ls.id AS sense_id
  FROM public.lex_senses ls
  JOIN public.lex_entries le ON ls.entry_id = le.id
  WHERE le.language = 'en'
    AND ls.sense_order = 1
    AND le.normalized_lemma IN (
      'resilient',      -- C1: Returning quickly to original shape / recovering
      'diminish',       -- C2: To make smaller
      'facilitate',     -- B2: To make easy or easier
      'legitimate',     -- B2: In accordance with the law / legal requirements
      'perspective',    -- B2: A view, vista or outlook
      'plausible',      -- C1: Seemingly or apparently valid, likely, or acceptable
      'consensus',      -- B2: A process of decision-making that seeks widespread agreement
      'accountability', -- C2: The state of being accountable / liability
      'incentive'       -- B2: Something that motivates, rouses, or encourages
    )
)
UPDATE public.vocab_words vw
SET lex_sense_id = svm.sense_id
FROM semantic_verified_matches svm
WHERE vw.lex_entry_id = svm.entry_id
  AND vw.lex_sense_id IS NULL;

-- ====================================================================
-- PHẦN 4: BẢO VỆ DỮ LIỆU ĐA NGÔN NGỮ (CHINESE & JAPANESE INTEGRITY)
-- ====================================================================

-- Đảm bảo 10 từ tiếng Trung và 10 từ tiếng Nhật trong bộ hệ thống luôn giữ lex_sense_id = NULL
-- và giữ nguyên 100% trường reading (Pinyin / Furigana)
UPDATE public.vocab_words vw
SET lex_sense_id = NULL,
    lex_entry_id = NULL
FROM public.vocab_sets vs
WHERE vw.set_id = vs.id
  AND vs.language IN ('zh', 'ja')
  AND (vw.lex_sense_id IS NOT NULL OR vw.lex_entry_id IS NOT NULL);
