-- Migration 15: Nâng cấp Admin
-- Dự án: Langua (Học ngoại ngữ & Luyện thi phi thương mại)
--
-- 1. Nhật ký hoạt động admin (admin_audit_log): trigger mức câu lệnh trên bảng nội dung (một lần import
--    nhiều dòng = một mục), cộng các mục ghi tay từ RPC (đổi vai trò, khoá tài khoản, duyệt nội dung, import).
-- 2. Quy trình duyệt nội dung draft -> pending -> published cho 6 bảng nội dung có is_published.
--    review_status là nguồn chính; is_published được trigger giữ đồng bộ nên RLS cũ không đổi.
--    Phiên người dùng không thể đặt is_published = true trực tiếp, phải qua RPC set_review_status.
-- 3. Khoá / mở khoá tài khoản (auth.users.banned_until + thu hồi phiên) và đổi vai trò theo user id.
-- 4. RPC danh sách người dùng và thống kê nền tảng cho admin.

-- ====================================================================
-- PHẦN 1: NHẬT KÝ HOẠT ĐỘNG ADMIN
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,       -- create | update | delete | import | review | role | ban | unban
  entity_type TEXT NOT NULL,  -- tên bảng hoặc nhóm (user, vocab, ...)
  entity_ids TEXT[] NOT NULL DEFAULT '{}',
  summary TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor ON public.admin_audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_entity ON public.admin_audit_log(entity_type, created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Audit log readable by admin" ON public.admin_audit_log;
CREATE POLICY "Audit log readable by admin" ON public.admin_audit_log FOR SELECT USING (public.is_admin());
-- Không có policy ghi: chỉ hàm SECURITY DEFINER bên dưới ghi được

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT, p_entity_type TEXT, p_entity_ids TEXT[], p_summary TEXT, p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
  INSERT INTO public.admin_audit_log (actor_id, actor_email, action, entity_type, entity_ids, summary, details)
  VALUES (auth.uid(), public.my_email(), p_action, p_entity_type, COALESCE(p_entity_ids, '{}'), p_summary, COALESCE(p_details, '{}'::jsonb));
$$ LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.log_admin_action(TEXT, TEXT, TEXT[], TEXT, JSONB) FROM PUBLIC, anon, authenticated;

-- Trigger mức câu lệnh dùng transition tables: ghi 1 mục cho mỗi câu lệnh INSERT/UPDATE/DELETE của admin
CREATE OR REPLACE FUNCTION public.audit_content_statement()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
  v_ids TEXT[];
  v_titles TEXT[];
  v_columns TEXT[];
  v_action TEXT := lower(TG_OP);
BEGIN
  -- Chỉ ghi thao tác của admin đăng nhập; bỏ qua seed/migration/service role và RPC duyệt (tự ghi riêng)
  IF auth.uid() IS NULL OR NOT public.is_admin() OR COALESCE(current_setting('langua.workflow', true), '') = 'on' THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'DELETE' THEN
    SELECT count(*), (array_agg(to_jsonb(o)->>'id'))[1:20],
           (array_agg(COALESCE(to_jsonb(o)->>'title', to_jsonb(o)->>'headword', to_jsonb(o)->>'question_text', to_jsonb(o)->>'word', to_jsonb(o)->>'id')))[1:5]
    INTO v_count, v_ids, v_titles FROM old_rows o;
  ELSE
    SELECT count(*), (array_agg(to_jsonb(n)->>'id'))[1:20],
           (array_agg(COALESCE(to_jsonb(n)->>'title', to_jsonb(n)->>'headword', to_jsonb(n)->>'question_text', to_jsonb(n)->>'word', to_jsonb(n)->>'id')))[1:5]
    INTO v_count, v_ids, v_titles FROM new_rows n;
  END IF;
  IF v_count = 0 THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(DISTINCT kv.key ORDER BY kv.key) INTO v_columns
    FROM new_rows n
    JOIN old_rows o ON to_jsonb(o)->>'id' = to_jsonb(n)->>'id'
    CROSS JOIN LATERAL jsonb_each(to_jsonb(n)) kv
    WHERE kv.key NOT IN ('updated_at') AND kv.value IS DISTINCT FROM to_jsonb(o)->kv.key;
    IF v_columns IS NULL THEN
      RETURN NULL; -- Cập nhật không đổi gì
    END IF;
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, actor_email, action, entity_type, entity_ids, summary, details)
  VALUES (
    auth.uid(), public.my_email(), v_action, TG_TABLE_NAME, v_ids,
    CASE v_action WHEN 'insert' THEN 'Thêm' WHEN 'update' THEN 'Sửa' ELSE 'Xoá' END
      || ' ' || v_count || ' bản ghi ' || TG_TABLE_NAME
      || COALESCE(': ' || array_to_string(v_titles, ', '), '') || CASE WHEN v_count > 5 THEN ', ...' ELSE '' END,
    jsonb_build_object('count', v_count) || CASE WHEN v_columns IS NOT NULL THEN jsonb_build_object('columns', v_columns) ELSE '{}'::jsonb END
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'vocab_sets', 'vocab_words', 'typing_topics', 'typing_sentences', 'grammar_points', 'grammar_exercises',
    'reading_items', 'reading_sections', 'media_items', 'media_cues', 'media_quiz_questions',
    'dictionary_entries', 'exam_tests', 'exam_questions'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS tr_audit_ins ON public.%I', t);
    EXECUTE format('DROP TRIGGER IF EXISTS tr_audit_upd ON public.%I', t);
    EXECUTE format('DROP TRIGGER IF EXISTS tr_audit_del ON public.%I', t);
    EXECUTE format('CREATE TRIGGER tr_audit_ins AFTER INSERT ON public.%I REFERENCING NEW TABLE AS new_rows FOR EACH STATEMENT EXECUTE FUNCTION public.audit_content_statement()', t);
    EXECUTE format('CREATE TRIGGER tr_audit_upd AFTER UPDATE ON public.%I REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows FOR EACH STATEMENT EXECUTE FUNCTION public.audit_content_statement()', t);
    EXECUTE format('CREATE TRIGGER tr_audit_del AFTER DELETE ON public.%I REFERENCING OLD TABLE AS old_rows FOR EACH STATEMENT EXECUTE FUNCTION public.audit_content_statement()', t);
  END LOOP;
END $$;

-- Mỗi lần Import Wizard ghi content_import_logs -> một mục "import" trong nhật ký
CREATE OR REPLACE FUNCTION public.audit_import_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_audit_log (actor_id, actor_email, action, entity_type, entity_ids, summary, details)
  VALUES (
    NEW.admin_id, (SELECT email FROM auth.users WHERE id = NEW.admin_id), 'import', NEW.content_type, ARRAY[NEW.id::text],
    'Import ' || NEW.content_type || ' từ ' || COALESCE(NEW.file_name, 'tệp') || ': ' || NEW.rows_ok || '/' || NEW.rows_total || ' dòng thành công',
    jsonb_build_object('file_name', NEW.file_name, 'rows_total', NEW.rows_total, 'rows_ok', NEW.rows_ok, 'rows_failed', NEW.rows_failed, 'status', NEW.status)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
DROP TRIGGER IF EXISTS tr_audit_import ON public.content_import_logs;
CREATE TRIGGER tr_audit_import AFTER INSERT ON public.content_import_logs
  FOR EACH ROW EXECUTE FUNCTION public.audit_import_log();

-- ====================================================================
-- PHẦN 2: QUY TRÌNH DUYỆT NỘI DUNG
-- ====================================================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['vocab_sets', 'typing_topics', 'grammar_points', 'reading_items', 'media_items', 'exam_tests'] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT ''draft''', t);
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', t, t || '_review_status_check');
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (review_status IN (''draft'', ''pending'', ''published''))', t, t || '_review_status_check');
    EXECUTE format('UPDATE public.%I SET review_status = CASE WHEN is_published THEN ''published'' ELSE ''draft'' END WHERE review_status IS DISTINCT FROM CASE WHEN is_published THEN ''published'' ELSE ''draft'' END', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(review_status)', 'idx_' || t || '_review_status', t);
  END LOOP;
END $$;

-- Giữ is_published = (review_status = 'published'). Với phiên người dùng (có auth.uid()), chỉ RPC duyệt
-- (đặt cờ langua.workflow) mới được đưa nội dung lên published.
CREATE OR REPLACE FUNCTION public.sync_review_status()
RETURNS TRIGGER AS $$
DECLARE
  v_workflow BOOLEAN := COALESCE(current_setting('langua.workflow', true), '') = 'on';
  v_user_session BOOLEAN := auth.uid() IS NOT NULL;
BEGIN
  -- Bộ từ cá nhân của học viên không thuộc quy trình duyệt
  -- (IF lồng nhau: plpgsql phân giải NEW.is_system cả khi vế trái sai, bảng khác không có cột này)
  IF TG_TABLE_NAME = 'vocab_sets' THEN
    IF NOT COALESCE((to_jsonb(NEW)->>'is_system')::boolean, false) THEN
      RETURN NEW;
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.is_published AND NEW.review_status <> 'published' THEN
      NEW.review_status := 'published';
    END IF;
  ELSIF NEW.review_status IS DISTINCT FROM OLD.review_status THEN
    NULL; -- review_status đổi: is_published theo sau ở cuối hàm
  ELSIF NEW.is_published IS DISTINCT FROM OLD.is_published THEN
    NEW.review_status := CASE WHEN NEW.is_published THEN 'published' ELSE 'draft' END;
  END IF;

  IF NEW.review_status = 'published' AND (TG_OP = 'INSERT' OR OLD.review_status <> 'published')
     AND v_user_session AND NOT v_workflow THEN
    RAISE EXCEPTION 'Nội dung phải qua quy trình duyệt (gửi duyệt rồi được duyệt) trước khi xuất bản.' USING ERRCODE = '42501';
  END IF;

  NEW.is_published := NEW.review_status = 'published';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['vocab_sets', 'typing_topics', 'grammar_points', 'reading_items', 'media_items', 'exam_tests'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS tr_sync_review_status ON public.%I', t);
    EXECUTE format('CREATE TRIGGER tr_sync_review_status BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.sync_review_status()', t);
  END LOOP;
END $$;

-- Lịch sử duyệt (ghi chú khi trả về nháp hiển thị cho người soạn)
CREATE TABLE IF NOT EXISTS public.content_reviews (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  note TEXT CHECK (note IS NULL OR char_length(note) <= 1000),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_content_reviews_item ON public.content_reviews(content_type, content_id, created_at DESC);
ALTER TABLE public.content_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Content reviews readable by admin" ON public.content_reviews;
CREATE POLICY "Content reviews readable by admin" ON public.content_reviews FOR SELECT USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.content_table_for(p_type TEXT)
RETURNS TEXT AS $$
  SELECT CASE p_type
    WHEN 'vocab' THEN 'vocab_sets' WHEN 'typing' THEN 'typing_topics' WHEN 'grammar' THEN 'grammar_points'
    WHEN 'reading' THEN 'reading_items' WHEN 'media' THEN 'media_items' WHEN 'ielts' THEN 'exam_tests'
  END;
$$ LANGUAGE sql IMMUTABLE;

-- Chuyển trạng thái duyệt cho một hoặc nhiều mục cùng loại.
--   draft -> pending      : gửi duyệt
--   pending -> published  : duyệt & xuất bản
--   pending -> draft      : trả về nháp (bắt buộc ghi chú lý do)
--   published -> draft    : gỡ xuất bản
-- Trả về số mục đã chuyển và các mục bị bỏ qua kèm lý do.
CREATE OR REPLACE FUNCTION public.set_review_status(p_type TEXT, p_ids TEXT[], p_status TEXT, p_note TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_table TEXT := public.content_table_for(p_type);
  v_note TEXT := NULLIF(btrim(p_note), '');
  v_item RECORD;
  v_done TEXT[] := '{}';
  v_skipped JSONB := '[]'::jsonb;
  v_allowed TEXT[];
  v_label TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên được duyệt nội dung.' USING ERRCODE = '42501';
  END IF;
  IF v_table IS NULL THEN
    RAISE EXCEPTION 'Loại nội dung không hỗ trợ duyệt.' USING ERRCODE = '22023';
  END IF;
  IF p_status NOT IN ('draft', 'pending', 'published') THEN
    RAISE EXCEPTION 'Trạng thái không hợp lệ.' USING ERRCODE = '22023';
  END IF;
  IF p_ids IS NULL OR cardinality(p_ids) = 0 OR cardinality(p_ids) > 200 THEN
    RAISE EXCEPTION 'Chọn từ 1 đến 200 mục.' USING ERRCODE = '22023';
  END IF;

  v_allowed := CASE p_status
    WHEN 'pending' THEN ARRAY['draft']
    WHEN 'published' THEN ARRAY['pending']
    ELSE ARRAY['pending', 'published'] END;

  PERFORM set_config('langua.workflow', 'on', true);

  FOR v_item IN EXECUTE format(
    'SELECT id::text AS id, review_status, to_jsonb(t) AS row FROM public.%I t WHERE id::text = ANY ($1) FOR UPDATE', v_table
  ) USING p_ids LOOP
    v_label := COALESCE(v_item.row->>'title', v_item.id);
    IF v_table = 'vocab_sets' AND NOT COALESCE((v_item.row->>'is_system')::boolean, false) THEN
      v_skipped := v_skipped || jsonb_build_object('id', v_item.id, 'title', v_label, 'reason', 'Bộ từ cá nhân của học viên không qua quy trình duyệt');
      CONTINUE;
    END IF;
    IF NOT (v_item.review_status = ANY (v_allowed)) THEN
      v_skipped := v_skipped || jsonb_build_object('id', v_item.id, 'title', v_label,
        'reason', 'Đang ở trạng thái ' || CASE v_item.review_status WHEN 'draft' THEN 'Bản nháp' WHEN 'pending' THEN 'Chờ duyệt' ELSE 'Đã xuất bản' END
          || ', không chuyển sang ' || CASE p_status WHEN 'draft' THEN 'Bản nháp' WHEN 'pending' THEN 'Chờ duyệt' ELSE 'Đã xuất bản' END || ' được');
      CONTINUE;
    END IF;
    IF p_status = 'draft' AND v_item.review_status = 'pending' AND v_note IS NULL THEN
      v_skipped := v_skipped || jsonb_build_object('id', v_item.id, 'title', v_label, 'reason', 'Cần ghi chú lý do khi trả về nháp');
      CONTINUE;
    END IF;
    IF p_status = 'published' AND v_table = 'reading_items'
       AND COALESCE(v_item.row->>'license', '') NOT IN ('public_domain', 'original', 'licensed') THEN
      v_skipped := v_skipped || jsonb_build_object('id', v_item.id, 'title', v_label, 'reason', 'Chưa khai báo giấy phép bản quyền hợp lệ');
      CONTINUE;
    END IF;

    EXECUTE format('UPDATE public.%I SET review_status = $1 WHERE id::text = $2', v_table) USING p_status, v_item.id;
    INSERT INTO public.content_reviews (content_type, content_id, from_status, to_status, note, actor_id)
    VALUES (p_type, v_item.id, v_item.review_status, p_status, v_note, auth.uid());
    v_done := v_done || v_item.id;
  END LOOP;

  PERFORM set_config('langua.workflow', 'off', true);

  IF cardinality(v_done) > 0 THEN
    PERFORM public.log_admin_action('review', p_type, v_done,
      CASE p_status WHEN 'pending' THEN 'Gửi duyệt' WHEN 'published' THEN 'Duyệt & xuất bản' ELSE 'Chuyển về nháp' END
        || ' ' || cardinality(v_done) || ' mục ' || CASE p_type WHEN 'vocab' THEN 'từ vựng' WHEN 'typing' THEN 'gõ câu' WHEN 'grammar' THEN 'ngữ pháp' WHEN 'reading' THEN 'bài đọc' WHEN 'media' THEN 'video / podcast' ELSE 'đề IELTS' END,
      jsonb_build_object('to_status', p_status, 'note', v_note));
  END IF;

  RETURN jsonb_build_object('updated', cardinality(v_done), 'skipped', v_skipped);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

-- Số mục theo trạng thái cho từng loại nội dung (trang tổng quan admin)
CREATE OR REPLACE FUNCTION public.admin_review_counts()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '{}'::jsonb;
  t RECORD;
  v_counts JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên.' USING ERRCODE = '42501';
  END IF;
  FOR t IN SELECT * FROM (VALUES ('vocab'), ('typing'), ('grammar'), ('reading'), ('media'), ('ielts')) v(k) LOOP
    EXECUTE format(
      'SELECT jsonb_build_object(''draft'', count(*) FILTER (WHERE review_status = ''draft''), ''pending'', count(*) FILTER (WHERE review_status = ''pending''), ''published'', count(*) FILTER (WHERE review_status = ''published''), ''total'', count(*)) FROM public.%I %s',
      public.content_table_for(t.k), CASE WHEN t.k = 'vocab' THEN 'WHERE is_system' ELSE '' END
    ) INTO v_counts;
    v_result := v_result || jsonb_build_object(t.k, v_counts);
  END LOOP;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ====================================================================
-- PHẦN 3: QUẢN LÝ NGƯỜI DÙNG
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.user_bans (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 3 AND 500),
  banned_until TIMESTAMPTZ, -- NULL = vĩnh viễn
  banned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User bans readable by admin" ON public.user_bans;
CREATE POLICY "User bans readable by admin" ON public.user_bans FOR SELECT USING (public.is_admin());

CREATE OR REPLACE FUNCTION public.admin_list_users(
  p_search TEXT DEFAULT NULL, p_role TEXT DEFAULT NULL, p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20, p_offset INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_search TEXT := NULLIF(lower(btrim(p_search)), '');
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên được xem danh sách người dùng.' USING ERRCODE = '42501';
  END IF;

  WITH base AS (
    SELECT u.id, u.email, u.created_at, u.last_sign_in_at, u.banned_until,
           p.full_name, p.avatar_text, p.avatar_url,
           CASE r.role WHEN 'admin' THEN 'admin' WHEN 'teacher' THEN 'teacher' ELSE 'student' END AS role,
           (u.banned_until IS NOT NULL AND u.banned_until > NOW()) AS is_banned,
           b.reason AS ban_reason
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    LEFT JOIN public.user_roles r ON r.user_id = u.id
    LEFT JOIN public.user_bans b ON b.user_id = u.id
    WHERE u.deleted_at IS NULL
      AND (v_search IS NULL OR lower(u.email) LIKE '%' || v_search || '%' OR lower(COALESCE(p.full_name, '')) LIKE '%' || v_search || '%')
  ),
  filtered AS (
    SELECT * FROM base
    WHERE (p_role IS NULL OR role = p_role)
      AND (p_status IS NULL OR (p_status = 'banned' AND is_banned) OR (p_status = 'active' AND NOT is_banned))
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM filtered),
    'rows', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', f.id, 'email', f.email, 'full_name', f.full_name, 'avatar_text', f.avatar_text, 'avatar_url', f.avatar_url,
        'role', f.role, 'created_at', f.created_at, 'last_sign_in_at', f.last_sign_in_at,
        'is_banned', f.is_banned, 'banned_until', CASE WHEN f.is_banned THEN f.banned_until END, 'ban_reason', CASE WHEN f.is_banned THEN f.ban_reason END,
        'attempts', (SELECT count(*) FROM public.exam_attempts a WHERE a.user_id = f.id),
        'last_active', GREATEST(
          (SELECT max(completed_at) FROM public.exam_attempts a WHERE a.user_id = f.id),
          (SELECT max(created_at) FROM public.xp_events x WHERE x.user_id = f.id)
        )
      ) ORDER BY f.created_at DESC, f.email)
      FROM (SELECT * FROM filtered ORDER BY created_at DESC, email LIMIT LEAST(GREATEST(p_limit, 1), 100) OFFSET GREATEST(p_offset, 0)) f
    ), '[]'::jsonb),
    'counts', jsonb_build_object(
      'all', (SELECT count(*) FROM base),
      'student', (SELECT count(*) FROM base WHERE role = 'student'),
      'teacher', (SELECT count(*) FROM base WHERE role = 'teacher'),
      'admin', (SELECT count(*) FROM base WHERE role = 'admin'),
      'banned', (SELECT count(*) FROM base WHERE is_banned)
    )
  ) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.role_label_vi(p_role TEXT)
RETURNS TEXT AS $$
  SELECT CASE p_role WHEN 'admin' THEN 'Quản trị viên' WHEN 'teacher' THEN 'Giáo viên' ELSE 'Học viên' END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(p_user UUID, p_role TEXT)
RETURNS VOID AS $$
DECLARE
  v_email TEXT;
  v_old TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên được phân quyền.' USING ERRCODE = '42501';
  END IF;
  IF p_role NOT IN ('student', 'teacher', 'admin') THEN
    RAISE EXCEPTION 'Vai trò phải là student, teacher hoặc admin.' USING ERRCODE = '22023';
  END IF;
  IF p_user = auth.uid() AND p_role <> 'admin' THEN
    RAISE EXCEPTION 'Không thể tự hạ quyền quản trị của chính mình.' USING ERRCODE = '42501';
  END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = p_user;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy người dùng.' USING ERRCODE = 'P0002';
  END IF;
  SELECT CASE role WHEN 'admin' THEN 'admin' WHEN 'teacher' THEN 'teacher' ELSE 'student' END INTO v_old
  FROM public.user_roles WHERE user_id = p_user;
  v_old := COALESCE(v_old, 'student');
  IF v_old = p_role THEN
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (p_user, CASE p_role WHEN 'student' THEN 'user' ELSE p_role END)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

  PERFORM public.log_admin_action('role', 'user', ARRAY[p_user::text],
    'Đổi vai trò ' || v_email || ': ' || public.role_label_vi(v_old) || ' -> ' || public.role_label_vi(p_role), jsonb_build_object('from', v_old, 'to', p_role, 'email', v_email));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public, auth;

-- set_user_role (migration 14, theo email) cũng ghi nhật ký
CREATE OR REPLACE FUNCTION public.set_user_role(p_email TEXT, p_role TEXT)
RETURNS JSONB AS $$
DECLARE
  v_target UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên được phân quyền.' USING ERRCODE = '42501';
  END IF;
  SELECT id INTO v_target FROM auth.users WHERE lower(email) = lower(btrim(p_email));
  IF v_target IS NULL THEN
    RAISE EXCEPTION 'Không có tài khoản nào dùng email này.' USING ERRCODE = 'P0002';
  END IF;
  PERFORM public.admin_set_user_role(v_target, p_role);
  RETURN jsonb_build_object('user_id', v_target, 'email', lower(btrim(p_email)), 'role', p_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

-- Khoá tài khoản: Supabase Auth từ chối đăng nhập / làm mới token khi banned_until ở tương lai.
-- Phiên đang mở bị thu hồi; access token đã cấp vẫn dùng được tới khi hết hạn (mặc định 1 giờ).
CREATE OR REPLACE FUNCTION public.admin_ban_user(p_user UUID, p_reason TEXT, p_days INTEGER DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  v_email TEXT;
  v_until TIMESTAMPTZ := CASE WHEN p_days IS NULL THEN NULL ELSE NOW() + make_interval(days => p_days) END;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên được khoá tài khoản.' USING ERRCODE = '42501';
  END IF;
  IF p_user = auth.uid() THEN
    RAISE EXCEPTION 'Không thể tự khoá tài khoản của chính mình.' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user AND role = 'admin') THEN
    RAISE EXCEPTION 'Không khoá được quản trị viên. Hãy hạ quyền trước.' USING ERRCODE = '42501';
  END IF;
  IF p_days IS NOT NULL AND (p_days < 1 OR p_days > 3650) THEN
    RAISE EXCEPTION 'Thời hạn khoá từ 1 đến 3650 ngày.' USING ERRCODE = '22023';
  END IF;
  IF p_reason IS NULL OR char_length(btrim(p_reason)) < 3 THEN
    RAISE EXCEPTION 'Ghi lý do khoá (ít nhất 3 ký tự).' USING ERRCODE = '22023';
  END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = p_user;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy người dùng.' USING ERRCODE = 'P0002';
  END IF;

  UPDATE auth.users SET banned_until = COALESCE(v_until, 'infinity'::timestamptz) WHERE id = p_user;
  DELETE FROM auth.refresh_tokens WHERE user_id = p_user::text;
  DELETE FROM auth.sessions WHERE user_id = p_user;
  INSERT INTO public.user_bans (user_id, reason, banned_until, banned_by)
  VALUES (p_user, btrim(p_reason), v_until, auth.uid())
  ON CONFLICT (user_id) DO UPDATE SET reason = EXCLUDED.reason, banned_until = EXCLUDED.banned_until, banned_by = EXCLUDED.banned_by, created_at = NOW();

  PERFORM public.log_admin_action('ban', 'user', ARRAY[p_user::text],
    'Khoá ' || v_email || CASE WHEN p_days IS NULL THEN ' vĩnh viễn' ELSE ' ' || p_days || ' ngày' END,
    jsonb_build_object('reason', btrim(p_reason), 'days', p_days, 'email', v_email));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.admin_unban_user(p_user UUID)
RETURNS VOID AS $$
DECLARE
  v_email TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên được mở khoá tài khoản.' USING ERRCODE = '42501';
  END IF;
  UPDATE auth.users SET banned_until = NULL WHERE id = p_user RETURNING email INTO v_email;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy người dùng.' USING ERRCODE = 'P0002';
  END IF;
  DELETE FROM public.user_bans WHERE user_id = p_user;
  PERFORM public.log_admin_action('unban', 'user', ARRAY[p_user::text], 'Mở khoá ' || v_email, jsonb_build_object('email', v_email));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public, auth;

-- ====================================================================
-- PHẦN 4: THỐNG KÊ NỀN TẢNG
-- ====================================================================
-- "Hoạt động" = có lượt làm bài, có sự kiện XP hoặc điểm danh.
-- Retention 7 ngày = tỉ lệ người dùng mới có hoạt động trong 7 ngày sau ngày đăng ký (không tính ngày đăng ký).

CREATE OR REPLACE FUNCTION public.admin_platform_stats(p_days INTEGER DEFAULT 30)
RETURNS JSONB AS $$
DECLARE
  v_days INTEGER := LEAST(GREATEST(COALESCE(p_days, 30), 7), 180);
  v_from TIMESTAMPTZ := date_trunc('day', NOW()) - make_interval(days => v_days - 1);
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên được xem thống kê.' USING ERRCODE = '42501';
  END IF;

  WITH activity AS (
    SELECT user_id, completed_at AS at FROM public.exam_attempts
    UNION ALL SELECT user_id, created_at FROM public.xp_events
    UNION ALL SELECT user_id, created_at FROM public.daily_checkins
  ),
  users AS (
    SELECT id, created_at FROM auth.users WHERE deleted_at IS NULL
  ),
  cohort AS (
    -- Người đăng ký đã đủ 7 ngày để đo retention
    SELECT u.id, u.created_at, date_trunc('week', u.created_at) AS week,
           EXISTS (
             SELECT 1 FROM activity a
             WHERE a.user_id = u.id
               AND a.at >= date_trunc('day', u.created_at) + INTERVAL '1 day'
               AND a.at < date_trunc('day', u.created_at) + INTERVAL '8 days'
           ) AS retained
    FROM users u
    WHERE u.created_at < date_trunc('day', NOW()) - INTERVAL '7 days'
      AND u.created_at >= date_trunc('week', NOW()) - INTERVAL '10 weeks'
  )
  SELECT jsonb_build_object(
    'days', v_days,
    'totals', jsonb_build_object(
      'users', (SELECT count(*) FROM users),
      'new_users', (SELECT count(*) FROM users WHERE created_at >= v_from),
      'new_users_7d', (SELECT count(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days'),
      'active_7d', (SELECT count(DISTINCT user_id) FROM activity WHERE at >= NOW() - INTERVAL '7 days'),
      'active_today', (SELECT count(DISTINCT user_id) FROM activity WHERE at >= date_trunc('day', NOW())),
      'attempts', (SELECT count(*) FROM public.exam_attempts WHERE completed_at >= v_from),
      'banned', (SELECT count(*) FROM auth.users WHERE banned_until > NOW())
    ),
    'daily', (
      SELECT jsonb_agg(jsonb_build_object(
        'date', d::date,
        'new_users', (SELECT count(*) FROM users u WHERE u.created_at >= d AND u.created_at < d + INTERVAL '1 day'),
        'active_users', (SELECT count(DISTINCT a.user_id) FROM activity a WHERE a.at >= d AND a.at < d + INTERVAL '1 day')
      ) ORDER BY d)
      FROM generate_series(v_from, date_trunc('day', NOW()), INTERVAL '1 day') d
    ),
    'top_tests', COALESCE((
      SELECT jsonb_agg(row_to_json(x) ORDER BY x.attempts DESC, x.users DESC)
      FROM (
        SELECT t.id, t.title, t.skill, count(*)::int AS attempts, count(DISTINCT a.user_id)::int AS users,
               round(avg(a.band_score), 2) AS avg_band
        FROM public.exam_attempts a JOIN public.exam_tests t ON t.id = a.test_id
        WHERE a.completed_at >= v_from
        GROUP BY t.id
        ORDER BY count(*) DESC, count(DISTINCT a.user_id) DESC
        LIMIT 10
      ) x
    ), '[]'::jsonb),
    'retention', jsonb_build_object(
      'cohort_size', (SELECT count(*) FROM cohort),
      'retained', (SELECT count(*) FROM cohort WHERE retained),
      'rate', (SELECT round(count(*) FILTER (WHERE retained)::numeric / NULLIF(count(*), 0), 4) FROM cohort),
      'weeks', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'week', week::date, 'size', size, 'retained', retained,
          'rate', round(retained::numeric / NULLIF(size, 0), 4)
        ) ORDER BY week)
        FROM (SELECT week, count(*) AS size, count(*) FILTER (WHERE retained) AS retained FROM cohort GROUP BY week) w
      ), '[]'::jsonb)
    )
  ) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Nhật ký admin có lọc & phân trang
CREATE OR REPLACE FUNCTION public.admin_list_audit(
  p_action TEXT DEFAULT NULL, p_entity TEXT DEFAULT NULL, p_actor UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 30, p_offset INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên được xem nhật ký.' USING ERRCODE = '42501';
  END IF;
  RETURN jsonb_build_object(
    'total', (
      SELECT count(*) FROM public.admin_audit_log
      WHERE (p_action IS NULL OR action = p_action) AND (p_entity IS NULL OR entity_type = p_entity) AND (p_actor IS NULL OR actor_id = p_actor)
    ),
    'rows', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', l.id, 'actor_id', l.actor_id, 'actor_email', l.actor_email, 'actor_name', p.full_name,
        'action', l.action, 'entity_type', l.entity_type, 'entity_ids', l.entity_ids,
        'summary', l.summary, 'details', l.details, 'created_at', l.created_at
      ) ORDER BY l.created_at DESC, l.id DESC)
      FROM (
        SELECT * FROM public.admin_audit_log
        WHERE (p_action IS NULL OR action = p_action) AND (p_entity IS NULL OR entity_type = p_entity) AND (p_actor IS NULL OR actor_id = p_actor)
        ORDER BY created_at DESC, id DESC
        LIMIT LEAST(GREATEST(p_limit, 1), 100) OFFSET GREATEST(p_offset, 0)
      ) l
      LEFT JOIN public.profiles p ON p.id = l.actor_id
    ), '[]'::jsonb),
    'actors', COALESCE((
      SELECT jsonb_agg(DISTINCT jsonb_build_object('id', actor_id, 'email', actor_email))
      FROM public.admin_audit_log WHERE actor_id IS NOT NULL
    ), '[]'::jsonb),
    'entities', COALESCE((SELECT jsonb_agg(DISTINCT entity_type) FROM public.admin_audit_log), '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

REVOKE ALL ON FUNCTION public.set_review_status(TEXT, TEXT[], TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.admin_review_counts() FROM anon;
REVOKE ALL ON FUNCTION public.admin_list_users(TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.admin_set_user_role(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.admin_ban_user(UUID, TEXT, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.admin_unban_user(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.admin_platform_stats(INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.admin_list_audit(TEXT, TEXT, UUID, INTEGER, INTEGER) FROM anon;
