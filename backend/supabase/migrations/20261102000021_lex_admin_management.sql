-- Migration 21: Quản trị kho từ vựng Wiktionary (Lexicon Admin Management)
-- Dự án: LanguaLab
--
-- Mục tiêu:
--  * Cung cấp các hàm RPC thống kê và duyệt nội dung an toàn cho trang quản trị /admin/lexicon
--  * Bảo đảm tuân thủ ràng buộc toàn vẹn dữ liệu: chỉ publish mục từ khi có ít nhất 1 nghĩa đã approved
--  * Kiểm tra quyền quản trị viên (public.is_admin()) trên mọi thao tác ghi/duyệt
--  * Thêm chỉ mục part_of_speech để tối ưu hoá bộ lọc loại từ

-- ====================================================================
-- PHẦN 1: CHỈ MỤC TỐI ƯU HOÁ BỘ LỌC
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_lex_senses_pos ON public.lex_senses(part_of_speech);

-- ====================================================================
-- PHẦN 2: THỐNG KÊ KHO TỪ VỰNG DÀNH CHO ADMIN
-- ====================================================================

CREATE OR REPLACE FUNCTION public.admin_lex_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền xem thống kê kho từ vựng.' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'total_entries', (SELECT count(*) FROM public.lex_entries),
    'entries_by_status', (
      SELECT jsonb_build_object(
        'published', count(*) FILTER (WHERE status = 'published'),
        'draft', count(*) FILTER (WHERE status = 'draft'),
        'review', count(*) FILTER (WHERE status = 'review'),
        'rejected', count(*) FILTER (WHERE status = 'rejected')
      ) FROM public.lex_entries
    ),
    'total_senses', (SELECT count(*) FROM public.lex_senses),
    'senses_by_review', (
      SELECT jsonb_build_object(
        'approved', count(*) FILTER (WHERE review_status = 'approved'),
        'pending', count(*) FILTER (WHERE review_status = 'pending'),
        'rejected', count(*) FILTER (WHERE review_status = 'rejected')
      ) FROM public.lex_senses
    ),
    'senses_by_level', (
      SELECT jsonb_build_object(
        'A1', count(*) FILTER (WHERE level = 'A1'),
        'A2', count(*) FILTER (WHERE level = 'A2'),
        'B1', count(*) FILTER (WHERE level = 'B1'),
        'B2', count(*) FILTER (WHERE level = 'B2'),
        'C1', count(*) FILTER (WHERE level = 'C1'),
        'C2', count(*) FILTER (WHERE level = 'C2'),
        'unassigned', count(*) FILTER (WHERE level IS NULL)
      ) FROM public.lex_senses
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$;

-- ====================================================================
-- PHẦN 3: DUYỆT TỪNG NGHĨA, BẢN DỊCH, VÍ DỤ
-- ====================================================================

-- 3.1 Duyệt nghĩa (Approve / Reject / Pending)
CREATE OR REPLACE FUNCTION public.admin_set_sense_review(
  p_sense_id UUID,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry_id UUID;
  v_entry_status TEXT;
  v_approved_count INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền duyệt nghĩa.' USING ERRCODE = '42501';
  END IF;

  IF p_status NOT IN ('approved', 'pending', 'rejected') THEN
    RAISE EXCEPTION 'Trạng thái duyệt nghĩa không hợp lệ: %', p_status USING ERRCODE = '22023';
  END IF;

  SELECT entry_id INTO v_entry_id FROM public.lex_senses WHERE id = p_sense_id;
  IF v_entry_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy nghĩa với mã %', p_sense_id USING ERRCODE = 'P0002';
  END IF;

  SELECT status INTO v_entry_status FROM public.lex_entries WHERE id = v_entry_id;

  -- Nếu mục từ đang published mà nghĩa này bị từ chối/trả về pending, kiểm tra còn nghĩa approved nào khác không
  IF v_entry_status = 'published' AND p_status <> 'approved' THEN
    SELECT count(*) INTO v_approved_count
    FROM public.lex_senses
    WHERE entry_id = v_entry_id AND id <> p_sense_id AND review_status = 'approved';

    IF v_approved_count = 0 THEN
      -- Tự động đưa mục từ về review để bảo đảm toàn vẹn
      UPDATE public.lex_entries SET status = 'review', updated_at = NOW() WHERE id = v_entry_id;
    END IF;
  END IF;

  UPDATE public.lex_senses
  SET review_status = p_status, updated_at = NOW()
  WHERE id = p_sense_id;

  RETURN jsonb_build_object(
    'success', true,
    'sense_id', p_sense_id,
    'review_status', p_status,
    'entry_id', v_entry_id
  );
END;
$$;

-- 3.2 Duyệt bản dịch tiếng Việt
CREATE OR REPLACE FUNCTION public.admin_set_translation_review(
  p_translation_id UUID,
  p_status TEXT,
  p_translated_text TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền duyệt bản dịch.' USING ERRCODE = '42501';
  END IF;

  IF p_status NOT IN ('approved', 'pending', 'rejected') THEN
    RAISE EXCEPTION 'Trạng thái duyệt bản dịch không hợp lệ: %', p_status USING ERRCODE = '22023';
  END IF;

  UPDATE public.lex_translations
  SET review_status = p_status,
      translated_text = COALESCE(NULLIF(btrim(p_translated_text), ''), translated_text),
      updated_at = NOW()
  WHERE id = p_translation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy bản dịch với mã %', p_translation_id USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'translation_id', p_translation_id,
    'review_status', p_status
  );
END;
$$;

-- 3.3 Duyệt câu ví dụ
CREATE OR REPLACE FUNCTION public.admin_set_example_review(
  p_example_id UUID,
  p_status TEXT,
  p_sentence_vi TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền duyệt câu ví dụ.' USING ERRCODE = '42501';
  END IF;

  IF p_status NOT IN ('approved', 'pending', 'rejected') THEN
    RAISE EXCEPTION 'Trạng thái duyệt câu ví dụ không hợp lệ: %', p_status USING ERRCODE = '22023';
  END IF;

  UPDATE public.lex_examples
  SET review_status = p_status,
      sentence_vi = COALESCE(p_sentence_vi, sentence_vi),
      updated_at = NOW()
  WHERE id = p_example_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy câu ví dụ với mã %', p_example_id USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'example_id', p_example_id,
    'review_status', p_status
  );
END;
$$;

-- ====================================================================
-- PHẦN 4: XUẤT BẢN / GỠ XUẤT BẢN MỤC TỪ
-- ====================================================================

-- 4.1 Cập nhật trạng thái một mục từ
CREATE OR REPLACE FUNCTION public.admin_set_entry_status(
  p_entry_id UUID,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lemma TEXT;
  v_approved_senses INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền thay đổi trạng thái mục từ.' USING ERRCODE = '42501';
  END IF;

  IF p_status NOT IN ('draft', 'review', 'published', 'rejected') THEN
    RAISE EXCEPTION 'Trạng thái mục từ không hợp lệ: %', p_status USING ERRCODE = '22023';
  END IF;

  SELECT lemma INTO v_lemma FROM public.lex_entries WHERE id = p_entry_id;
  IF v_lemma IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy mục từ với mã %', p_entry_id USING ERRCODE = 'P0002';
  END IF;

  IF p_status = 'published' THEN
    SELECT count(*) INTO v_approved_senses
    FROM public.lex_senses
    WHERE entry_id = p_entry_id AND review_status = 'approved';

    IF v_approved_senses = 0 THEN
      RAISE EXCEPTION 'Không thể xuất bản mục từ "%": cần ít nhất một nghĩa được duyệt (approved).', v_lemma
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  UPDATE public.lex_entries
  SET status = p_status, updated_at = NOW()
  WHERE id = p_entry_id;

  RETURN jsonb_build_object(
    'success', true,
    'entry_id', p_entry_id,
    'lemma', v_lemma,
    'status', p_status
  );
END;
$$;

-- 4.2 Cập nhật trạng thái hàng loạt (Batch publish / unpublish)
CREATE OR REPLACE FUNCTION public.admin_batch_set_entry_status(
  p_entry_ids UUID[],
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_lemma TEXT;
  v_approved INT;
  v_updated INT := 0;
  v_skipped JSONB := '[]'::jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền cập nhật trạng thái hàng loạt.' USING ERRCODE = '42501';
  END IF;

  IF p_status NOT IN ('draft', 'review', 'published', 'rejected') THEN
    RAISE EXCEPTION 'Trạng thái mục từ không hợp lệ: %', p_status USING ERRCODE = '22023';
  END IF;

  IF p_entry_ids IS NULL OR cardinality(p_entry_ids) = 0 THEN
    RETURN jsonb_build_object('updated', 0, 'skipped', '[]'::jsonb);
  END IF;

  FOREACH v_id IN ARRAY p_entry_ids LOOP
    SELECT lemma INTO v_lemma FROM public.lex_entries WHERE id = v_id;
    IF v_lemma IS NULL THEN
      v_skipped := v_skipped || jsonb_build_object('id', v_id, 'reason', 'Không tìm thấy mục từ');
      CONTINUE;
    END IF;

    IF p_status = 'published' THEN
      SELECT count(*) INTO v_approved
      FROM public.lex_senses
      WHERE entry_id = v_id AND review_status = 'approved';

      IF v_approved = 0 THEN
        v_skipped := v_skipped || jsonb_build_object('id', v_id, 'lemma', v_lemma, 'reason', 'Chưa có nghĩa nào được duyệt (approved)');
        CONTINUE;
      END IF;
    END IF;

    UPDATE public.lex_entries
    SET status = p_status, updated_at = NOW()
    WHERE id = v_id;

    v_updated := v_updated + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'updated', v_updated,
    'skipped', v_skipped
  );
END;
$$;

-- ====================================================================
-- PHẦN 5: PHÂN QUYỀN THỰC THI (SECURITY)
-- ====================================================================

REVOKE ALL ON FUNCTION public.admin_lex_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_sense_review(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_translation_review(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_example_review(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_entry_status(UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_batch_set_entry_status(UUID[], TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_lex_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_sense_review(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_translation_review(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_example_review(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_entry_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_batch_set_entry_status(UUID[], TEXT) TO authenticated;
