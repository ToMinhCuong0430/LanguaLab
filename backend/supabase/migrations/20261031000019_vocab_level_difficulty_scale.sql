-- Migration 19: 7 cấp độ từ vựng là THANG ĐỘ KHÓ từ dễ (1) đến khó (7)
--
-- Vấn đề: seed (migration 11) đặt cấp 7 là 'HSK_JLPT' (một nhóm kỳ thi), không phải một mức độ khó.
-- Sửa: cấp 7 = "Chuyên sâu & Hiếm gặp" (vượt C2). Thang 1-7 dùng chung cho mọi ngôn ngữ;
-- bảng lex_level_map ánh xạ cấp của từng hệ gốc (CEFR, HSK, JLPT) về thang này.
-- Cần chạy SAU migration 20261031000018 (hàm lex_level_is_valid).
--
-- Bảng ánh xạ là DỮ LIỆU: muốn đổi cách quy đổi chỉ cần sửa các dòng, không cần sửa code.

-- 1. Sửa cấp 7 (idempotent: chỉ đổi khi còn là giá trị cũ)
UPDATE public.vocab_levels
SET code = 'C2+',
    title = 'Chuyên sâu & Hiếm gặp',
    cefr_equivalent = 'C2+ Expert',
    description = 'Từ vựng rất khó, hiếm gặp hoặc chuyên ngành, vượt trên mức C2.'
WHERE level_number = 7
  AND code = 'HSK_JLPT';

-- 2. Bảng ánh xạ
CREATE TABLE IF NOT EXISTS public.lex_level_map (
  level_system TEXT NOT NULL CHECK (level_system IN ('cefr', 'hsk', 'jlpt', 'custom')),
  level TEXT NOT NULL,
  vocab_level_number INTEGER NOT NULL
    REFERENCES public.vocab_levels(level_number) ON DELETE RESTRICT,
  PRIMARY KEY (level_system, level),
  CONSTRAINT chk_lex_level_map_valid CHECK (public.lex_level_is_valid(level_system, level))
);

-- Đề xuất mặc định (sửa được):
--   CEFR A1..C2 -> 1..6;  HSK 1..6 -> 1..6, HSK 7..9 -> 7;  JLPT N5..N1 -> 1..5
--   Từ rất khó của tiếng Anh: level_system = 'custom', level = 'expert' -> 7
INSERT INTO public.lex_level_map (level_system, level, vocab_level_number) VALUES
  ('cefr', 'A1', 1), ('cefr', 'A2', 2), ('cefr', 'B1', 3),
  ('cefr', 'B2', 4), ('cefr', 'C1', 5), ('cefr', 'C2', 6),
  ('hsk', '1', 1), ('hsk', '2', 2), ('hsk', '3', 3), ('hsk', '4', 4), ('hsk', '5', 5), ('hsk', '6', 6),
  ('hsk', '7', 7), ('hsk', '8', 7), ('hsk', '9', 7), ('hsk', '7-9', 7),
  ('jlpt', 'N5', 1), ('jlpt', 'N4', 2), ('jlpt', 'N3', 3), ('jlpt', 'N2', 4), ('jlpt', 'N1', 5),
  ('custom', 'expert', 7)
ON CONFLICT (level_system, level) DO NOTHING;

-- 3. Hàm tra cấp 1-7 từ (hệ, cấp)
CREATE OR REPLACE FUNCTION public.lex_vocab_level(p_system TEXT, p_level TEXT)
RETURNS INTEGER
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT m.vocab_level_number
  FROM public.lex_level_map m
  WHERE m.level_system = p_system AND m.level = p_level;
$$;

GRANT EXECUTE ON FUNCTION public.lex_vocab_level(TEXT, TEXT) TO anon, authenticated;

-- 4. RLS và quyền: đọc công khai, chỉ admin được sửa
ALTER TABLE public.lex_level_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads lex_level_map" ON public.lex_level_map;
CREATE POLICY "Public reads lex_level_map"
  ON public.lex_level_map FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin manages lex_level_map" ON public.lex_level_map;
CREATE POLICY "Admin manages lex_level_map"
  ON public.lex_level_map FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

REVOKE ALL ON public.lex_level_map FROM anon, authenticated;
GRANT SELECT ON public.lex_level_map TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lex_level_map TO authenticated;

COMMENT ON TABLE public.lex_level_map IS
  'Ánh xạ cấp độ của từng hệ (CEFR/HSK/JLPT/custom) về thang độ khó 1-7 của vocab_levels (dễ -> khó).';