-- Migration 14: Vai trò Giáo viên, lớp học, lời mời, bài được giao và nhận xét của giáo viên
-- Dự án: Langua (Học ngoại ngữ & Luyện thi phi thương mại)
--
-- Vai trò lưu trong public.user_roles (đã có): 'user' = học viên (mặc định, không cần dòng),
-- 'teacher' = giáo viên / nhân viên quản lý, 'admin' = quản trị viên.
--
-- Nguyên tắc phân quyền:
--   - Client chỉ có quyền SELECT (giới hạn bởi RLS) trên các bảng mới; mọi thao tác ghi đi qua
--     RPC SECURITY DEFINER có kiểm tra vai trò, quyền sở hữu lớp và dữ liệu đầu vào.
--   - Hàm kiểm tra quyền (is_class_teacher, is_class_member, teaches_student) là SECURITY DEFINER
--     để policy không gọi đệ quy RLS của nhau.
--   - Giáo viên chỉ đọc được dữ liệu học tập của học viên đang ở trong lớp mình.
--   - Mời bằng email cần học viên tự chấp nhận; không ai bị thêm vào lớp khi chưa đồng ý.

-- ====================================================================
-- PHẦN 1: VAI TRÒ
-- ====================================================================

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check CHECK (role IN ('user', 'teacher', 'admin', 'moderator'));
COMMENT ON COLUMN public.user_roles.role IS 'user = học viên (student), teacher = giáo viên, admin = quản trị viên';

-- Vai trò hiển thị cho ứng dụng: student | teacher | admin
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (SELECT CASE role WHEN 'admin' THEN 'admin' WHEN 'teacher' THEN 'teacher' ELSE 'student' END
     FROM public.user_roles WHERE user_id = auth.uid()),
    'student'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Giáo viên hoặc admin (admin có mọi quyền của giáo viên)
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ====================================================================
-- PHẦN 2: BẢNG
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 80),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  join_code TEXT NOT NULL UNIQUE CHECK (join_code ~ '^[A-Z2-9]{6}$'),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id, created_at DESC);
DROP TRIGGER IF EXISTS tr_classes_updated_at ON public.classes;
CREATE TRIGGER tr_classes_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.class_members (
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_via TEXT NOT NULL CHECK (joined_via IN ('code', 'invite')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (class_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_class_members_student ON public.class_members(student_id);

-- Lời mời theo email (kể cả email chưa có tài khoản); học viên chấp nhận mới thành thành viên
CREATE TABLE IF NOT EXISTS public.class_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (email = lower(email) AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_class_invites_pending
  ON public.class_invites(class_id, email) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_class_invites_email ON public.class_invites(email) WHERE status = 'pending';

-- Bài được giao: student_ids NULL = cả lớp, ngược lại là danh sách học viên cụ thể
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL REFERENCES public.exam_tests(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 2 AND 120),
  instructions TEXT CHECK (instructions IS NULL OR char_length(instructions) <= 1000),
  due_at TIMESTAMPTZ,
  student_ids UUID[] CHECK (student_ids IS NULL OR cardinality(student_ids) > 0),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON public.assignments(class_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assignments_students ON public.assignments USING GIN (student_ids);

-- Nhận xét / chỉnh điểm của giáo viên cho bài Writing / Speaking (mỗi giáo viên 1 bản / lượt làm)
CREATE TABLE IF NOT EXISTS public.teacher_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment TEXT CHECK (comment IS NULL OR char_length(comment) <= 4000),
  override_band NUMERIC(2, 1) CHECK (override_band IS NULL OR (override_band BETWEEN 0 AND 9 AND override_band * 2 = trunc(override_band * 2))),
  ai_band NUMERIC(2, 1), -- Band AI lúc giáo viên chỉnh (để hiển thị so sánh)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (attempt_id, teacher_id),
  CHECK (comment IS NOT NULL OR override_band IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_teacher_feedback_attempt ON public.teacher_feedback(attempt_id, updated_at DESC);
DROP TRIGGER IF EXISTS tr_teacher_feedback_updated_at ON public.teacher_feedback;
CREATE TRIGGER tr_teacher_feedback_updated_at BEFORE UPDATE ON public.teacher_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- PHẦN 3: HÀM KIỂM TRA QUYỀN (SECURITY DEFINER, tránh RLS đệ quy)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.is_class_teacher(p_class UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM public.classes WHERE id = p_class AND teacher_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_class_member(p_class UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members WHERE class_id = p_class AND student_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Người gọi là giáo viên của một lớp (chưa lưu trữ) có học viên này, hoặc là admin
CREATE OR REPLACE FUNCTION public.teaches_student(p_student UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1
    FROM public.class_members m
    JOIN public.classes c ON c.id = m.class_id
    WHERE m.student_id = p_student AND c.teacher_id = auth.uid() AND NOT c.is_archived
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.my_email()
RETURNS TEXT AS $$
  SELECT lower(COALESCE(auth.jwt()->>'email', (SELECT email FROM auth.users WHERE id = auth.uid())));
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ====================================================================
-- PHẦN 4: RLS
-- ====================================================================

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Class visible to teacher and members" ON public.classes;
CREATE POLICY "Class visible to teacher and members" ON public.classes FOR SELECT
  USING (teacher_id = auth.uid() OR public.is_class_member(id) OR public.is_admin());

DROP POLICY IF EXISTS "Membership visible to self and class teacher" ON public.class_members;
CREATE POLICY "Membership visible to self and class teacher" ON public.class_members FOR SELECT
  USING (student_id = auth.uid() OR public.is_class_teacher(class_id));

DROP POLICY IF EXISTS "Invite visible to class teacher and invitee" ON public.class_invites;
CREATE POLICY "Invite visible to class teacher and invitee" ON public.class_invites FOR SELECT
  USING (public.is_class_teacher(class_id) OR (status = 'pending' AND email = public.my_email()));

DROP POLICY IF EXISTS "Assignment visible to class teacher and assignees" ON public.assignments;
CREATE POLICY "Assignment visible to class teacher and assignees" ON public.assignments FOR SELECT
  USING (
    public.is_class_teacher(class_id)
    OR (public.is_class_member(class_id) AND (student_ids IS NULL OR auth.uid() = ANY (student_ids)))
  );

DROP POLICY IF EXISTS "Feedback visible to author, student and admin" ON public.teacher_feedback;
CREATE POLICY "Feedback visible to author, student and admin" ON public.teacher_feedback FOR SELECT
  USING (
    teacher_id = auth.uid() OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.exam_attempts a WHERE a.id = teacher_feedback.attempt_id AND a.user_id = auth.uid())
  );

-- Giáo viên đọc dữ liệu học tập của học viên trong lớp mình
DROP POLICY IF EXISTS "Teachers can view their students attempts" ON public.exam_attempts;
CREATE POLICY "Teachers can view their students attempts" ON public.exam_attempts FOR SELECT
  USING (public.teaches_student(user_id));

DROP POLICY IF EXISTS "Teachers can view their students answers" ON public.exam_answers;
CREATE POLICY "Teachers can view their students answers" ON public.exam_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.exam_attempts ea WHERE ea.id = exam_answers.attempt_id AND public.teaches_student(ea.user_id)
  ));

DROP POLICY IF EXISTS "Teachers can view their students ai feedback" ON public.ai_feedback;
CREATE POLICY "Teachers can view their students ai feedback" ON public.ai_feedback FOR SELECT
  USING (public.teaches_student(user_id));

DROP POLICY IF EXISTS "Teachers can view their students diagnostics" ON public.diagnostic_attempts;
CREATE POLICY "Teachers can view their students diagnostics" ON public.diagnostic_attempts FOR SELECT
  USING (public.teaches_student(user_id));

-- ====================================================================
-- PHẦN 5: ANALYTICS DÙNG CHUNG CHO HỌC VIÊN VÀ GIÁO VIÊN
-- ====================================================================
-- get_my_progress (migration 13) được tách thành progress_for_user(uid) nội bộ;
-- client không gọi trực tiếp được, chỉ qua get_my_progress / get_student_progress.

CREATE OR REPLACE FUNCTION public.progress_for_user(p_uid UUID, p_since TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_uid UUID := p_uid;
  v_since TIMESTAMPTZ := COALESCE(p_since, '-infinity'::timestamptz);
  v_result JSONB;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Thiếu người dùng.' USING ERRCODE = '22023';
  END IF;

  WITH attempts AS (
    SELECT a.id, a.band_score, a.completed_at, a.mode, a.raw_score, a.total_questions,
           t.skill::text AS skill, t.title
    FROM public.exam_attempts a
    JOIN public.exam_tests t ON t.id = a.test_id
    WHERE a.user_id = v_uid AND a.completed_at >= v_since
  ),
  cats AS (
    SELECT at.skill,
           public.question_category_label(q.category_tag, q.type) AS category,
           count(*)::int AS total,
           count(*) FILTER (WHERE ans.is_correct)::int AS correct,
           count(DISTINCT ans.attempt_id)::int AS attempts,
           max(at.completed_at) AS last_at
    FROM public.exam_answers ans
    JOIN attempts at ON at.id = ans.attempt_id
    JOIN public.exam_questions q ON q.id = ans.question_id
    GROUP BY 1, 2
  ),
  cats_scored AS (
    SELECT *, round(correct::numeric / NULLIF(total, 0), 4) AS accuracy,
           (attempts >= 5 AND correct::numeric / NULLIF(total, 0) < 0.6) AS is_weak
    FROM cats
  ),
  latest AS (
    SELECT DISTINCT ON (skill) skill, band_score, completed_at
    FROM attempts WHERE band_score IS NOT NULL
    ORDER BY skill, completed_at DESC
  ),
  per_skill AS (
    SELECT skill, count(*)::int AS attempts,
           max(band_score) AS best_band,
           round(avg(band_score), 2) AS avg_band
    FROM attempts GROUP BY skill
  )
  SELECT jsonb_build_object(
    'timeline', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'attempt_id', id, 'skill', skill, 'band', band_score, 'completed_at', completed_at,
        'test_title', title, 'mode', mode
      ) ORDER BY completed_at)
      FROM attempts WHERE band_score IS NOT NULL
    ), '[]'::jsonb),
    'categories', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'skill', skill, 'category', category, 'total', total, 'correct', correct,
        'accuracy', accuracy, 'attempts', attempts, 'last_at', last_at, 'is_weak', is_weak
      ) ORDER BY accuracy ASC, total DESC)
      FROM cats_scored
    ), '[]'::jsonb),
    'weaknesses', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'skill', skill, 'category', category, 'accuracy', accuracy, 'attempts', attempts, 'total', total
      ) ORDER BY accuracy ASC)
      FROM cats_scored WHERE is_weak
    ), '[]'::jsonb),
    'skills', COALESCE((
      SELECT jsonb_object_agg(ps.skill, jsonb_build_object(
        'attempts', ps.attempts, 'best_band', ps.best_band, 'avg_band', ps.avg_band,
        'latest_band', l.band_score, 'latest_at', l.completed_at
      ))
      FROM per_skill ps LEFT JOIN latest l ON l.skill = ps.skill
    ), '{}'::jsonb),
    'totals', jsonb_build_object(
      'attempts', (SELECT count(*) FROM attempts),
      'answered', (SELECT COALESCE(sum(total), 0) FROM cats),
      'correct', (SELECT COALESCE(sum(correct), 0) FROM cats)
    ),
    'rules', jsonb_build_object('weak_accuracy', 0.6, 'weak_min_attempts', 5)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_my_progress(p_since TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để xem tiến độ.' USING ERRCODE = '28000';
  END IF;
  RETURN public.progress_for_user(auth.uid(), p_since);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

REVOKE ALL ON FUNCTION public.progress_for_user(UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;

-- ====================================================================
-- PHẦN 6: RPC QUẢN TRỊ VAI TRÒ (admin)
-- ====================================================================

CREATE OR REPLACE FUNCTION public.set_user_role(p_email TEXT, p_role TEXT)
RETURNS JSONB AS $$
DECLARE
  v_target UUID;
  v_db_role TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên được phân quyền.' USING ERRCODE = '42501';
  END IF;
  IF p_role NOT IN ('student', 'teacher', 'admin') THEN
    RAISE EXCEPTION 'Vai trò phải là student, teacher hoặc admin.' USING ERRCODE = '22023';
  END IF;
  SELECT id INTO v_target FROM auth.users WHERE lower(email) = lower(btrim(p_email));
  IF v_target IS NULL THEN
    RAISE EXCEPTION 'Không có tài khoản nào dùng email này.' USING ERRCODE = 'P0002';
  END IF;
  IF v_target = auth.uid() AND p_role <> 'admin' THEN
    RAISE EXCEPTION 'Không thể tự hạ quyền quản trị của chính mình.' USING ERRCODE = '42501';
  END IF;

  v_db_role := CASE p_role WHEN 'student' THEN 'user' ELSE p_role END;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_target, v_db_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

  RETURN jsonb_build_object('user_id', v_target, 'email', lower(btrim(p_email)), 'role', p_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

CREATE OR REPLACE FUNCTION public.list_staff()
RETURNS JSONB AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên được xem danh sách này.' USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'user_id', r.user_id, 'email', u.email, 'full_name', p.full_name,
      'role', CASE r.role WHEN 'admin' THEN 'admin' ELSE 'teacher' END,
      'class_count', (SELECT count(*) FROM public.classes c WHERE c.teacher_id = r.user_id)
    ) ORDER BY r.role, p.full_name)
    FROM public.user_roles r
    JOIN auth.users u ON u.id = r.user_id
    LEFT JOIN public.profiles p ON p.id = r.user_id
    WHERE r.role IN ('teacher', 'admin')
  ), '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ====================================================================
-- PHẦN 7: RPC LỚP HỌC (giáo viên)
-- ====================================================================

-- Mã 6 ký tự, bỏ các ký tự dễ nhầm (0/O, 1/I)
CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT AS $$
DECLARE
  alphabet CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code TEXT;
BEGIN
  LOOP
    SELECT string_agg(substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1), '')
    INTO v_code FROM generate_series(1, 6);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.classes WHERE join_code = v_code);
  END LOOP;
  RETURN v_code;
END;
$$ LANGUAGE plpgsql VOLATILE SET search_path = public;
REVOKE ALL ON FUNCTION public.generate_join_code() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_class(p_name TEXT, p_description TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT public.is_teacher() THEN
    RAISE EXCEPTION 'Chỉ giáo viên được tạo lớp.' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.classes (teacher_id, name, description, join_code)
  VALUES (auth.uid(), btrim(p_name), NULLIF(btrim(p_description), ''), public.generate_join_code())
  RETURNING id INTO v_id;
  RETURN v_id;
EXCEPTION WHEN check_violation THEN
  RAISE EXCEPTION 'Tên lớp cần 2–80 ký tự, mô tả tối đa 500 ký tự.' USING ERRCODE = '22023';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_class(p_class UUID, p_name TEXT, p_description TEXT, p_archived BOOLEAN)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_class_teacher(p_class) THEN
    RAISE EXCEPTION 'Bạn không quản lý lớp này.' USING ERRCODE = '42501';
  END IF;
  UPDATE public.classes
  SET name = btrim(p_name), description = NULLIF(btrim(p_description), ''), is_archived = COALESCE(p_archived, is_archived)
  WHERE id = p_class;
EXCEPTION WHEN check_violation THEN
  RAISE EXCEPTION 'Tên lớp cần 2–80 ký tự, mô tả tối đa 500 ký tự.' USING ERRCODE = '22023';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

CREATE OR REPLACE FUNCTION public.regenerate_join_code(p_class UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT := public.generate_join_code();
BEGIN
  IF NOT public.is_class_teacher(p_class) THEN
    RAISE EXCEPTION 'Bạn không quản lý lớp này.' USING ERRCODE = '42501';
  END IF;
  UPDATE public.classes SET join_code = v_code WHERE id = p_class;
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

-- Mời theo email. Trả về số lời mời mới, email đã là thành viên, email sai định dạng.
CREATE OR REPLACE FUNCTION public.invite_to_class(p_class UUID, p_emails TEXT[])
RETURNS JSONB AS $$
DECLARE
  v_email TEXT;
  v_invited TEXT[] := '{}';
  v_members TEXT[] := '{}';
  v_invalid TEXT[] := '{}';
BEGIN
  IF NOT public.is_class_teacher(p_class) THEN
    RAISE EXCEPTION 'Bạn không quản lý lớp này.' USING ERRCODE = '42501';
  END IF;
  IF p_emails IS NULL OR cardinality(p_emails) = 0 OR cardinality(p_emails) > 50 THEN
    RAISE EXCEPTION 'Nhập từ 1 đến 50 email mỗi lần.' USING ERRCODE = '22023';
  END IF;
  IF (SELECT is_archived FROM public.classes WHERE id = p_class) THEN
    RAISE EXCEPTION 'Lớp đã lưu trữ, không thể mời thêm.' USING ERRCODE = '22023';
  END IF;

  FOREACH v_email IN ARRAY p_emails LOOP
    v_email := lower(btrim(v_email));
    CONTINUE WHEN v_email = '';
    IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
      v_invalid := v_invalid || v_email;
    ELSIF EXISTS (
      SELECT 1 FROM public.class_members m JOIN auth.users u ON u.id = m.student_id
      WHERE m.class_id = p_class AND lower(u.email) = v_email
    ) THEN
      v_members := v_members || v_email;
    ELSE
      INSERT INTO public.class_invites (class_id, email, invited_by)
      VALUES (p_class, v_email, auth.uid())
      ON CONFLICT (class_id, email) WHERE status = 'pending' DO NOTHING;
      v_invited := v_invited || v_email;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('invited', to_jsonb(v_invited), 'already_members', to_jsonb(v_members), 'invalid', to_jsonb(v_invalid));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

CREATE OR REPLACE FUNCTION public.revoke_invite(p_invite UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.class_invites i SET status = 'revoked', responded_at = NOW()
  WHERE i.id = p_invite AND i.status = 'pending' AND public.is_class_teacher(i.class_id);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy lời mời đang chờ trong lớp của bạn.' USING ERRCODE = 'P0002';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

CREATE OR REPLACE FUNCTION public.remove_class_member(p_class UUID, p_student UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_class_teacher(p_class) THEN
    RAISE EXCEPTION 'Bạn không quản lý lớp này.' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.class_members WHERE class_id = p_class AND student_id = p_student;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

-- Giao bài: cả lớp (p_student_ids NULL/rỗng) hoặc một số học viên trong lớp. Chỉ đề đã xuất bản.
CREATE OR REPLACE FUNCTION public.create_assignment(
  p_class UUID, p_test_id TEXT, p_title TEXT, p_instructions TEXT DEFAULT NULL,
  p_due_at TIMESTAMPTZ DEFAULT NULL, p_student_ids UUID[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_test RECORD;
  v_ids UUID[] := NULLIF(p_student_ids, '{}');
  v_id UUID;
BEGIN
  IF NOT public.is_class_teacher(p_class) THEN
    RAISE EXCEPTION 'Bạn không quản lý lớp này.' USING ERRCODE = '42501';
  END IF;
  SELECT id, is_published, title INTO v_test FROM public.exam_tests WHERE id = p_test_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Đề thi không tồn tại.' USING ERRCODE = 'P0002';
  END IF;
  IF NOT v_test.is_published THEN
    RAISE EXCEPTION 'Đề "%" chưa xuất bản nên học viên chưa mở được. Hãy xuất bản đề trước khi giao.', v_test.title USING ERRCODE = '22023';
  END IF;
  IF p_due_at IS NOT NULL AND p_due_at < NOW() THEN
    RAISE EXCEPTION 'Hạn nộp phải ở tương lai.' USING ERRCODE = '22023';
  END IF;
  IF v_ids IS NOT NULL AND EXISTS (
    SELECT 1 FROM unnest(v_ids) s(id)
    WHERE NOT EXISTS (SELECT 1 FROM public.class_members m WHERE m.class_id = p_class AND m.student_id = s.id)
  ) THEN
    RAISE EXCEPTION 'Có học viên được chọn không thuộc lớp này.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.assignments (class_id, test_id, title, instructions, due_at, student_ids, created_by)
  VALUES (p_class, p_test_id, btrim(COALESCE(NULLIF(btrim(p_title), ''), v_test.title)),
          NULLIF(btrim(p_instructions), ''), p_due_at,
          (SELECT array_agg(DISTINCT x) FROM unnest(v_ids) x), auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
EXCEPTION WHEN check_violation THEN
  RAISE EXCEPTION 'Tiêu đề cần 2–120 ký tự, hướng dẫn tối đa 1000 ký tự.' USING ERRCODE = '22023';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

CREATE OR REPLACE FUNCTION public.delete_assignment(p_assignment UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.assignments a WHERE a.id = p_assignment AND public.is_class_teacher(a.class_id);
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy bài được giao trong lớp của bạn.' USING ERRCODE = 'P0002';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

-- Nhận xét và/hoặc chỉnh band cho bài Writing / Speaking của học viên trong lớp mình.
-- Band dùng cho analytics (exam_attempts.band_score) = band giáo viên chỉnh gần nhất, nếu không có thì band AI.
CREATE OR REPLACE FUNCTION public.upsert_teacher_feedback(p_attempt UUID, p_comment TEXT, p_override_band NUMERIC)
RETURNS JSONB AS $$
DECLARE
  v_attempt RECORD;
  v_ai_band NUMERIC(2, 1);
  v_effective NUMERIC(2, 1);
  v_comment TEXT := NULLIF(btrim(p_comment), '');
BEGIN
  SELECT a.id, a.user_id, t.skill INTO v_attempt
  FROM public.exam_attempts a JOIN public.exam_tests t ON t.id = a.test_id
  WHERE a.id = p_attempt;
  IF NOT FOUND OR NOT public.teaches_student(v_attempt.user_id) THEN
    RAISE EXCEPTION 'Không tìm thấy bài làm của học viên trong lớp bạn.' USING ERRCODE = 'P0002';
  END IF;
  IF v_attempt.skill NOT IN ('writing', 'speaking') THEN
    RAISE EXCEPTION 'Chỉ nhận xét / chỉnh band cho bài Writing hoặc Speaking.' USING ERRCODE = '22023';
  END IF;
  IF p_override_band IS NOT NULL AND (p_override_band < 0 OR p_override_band > 9 OR p_override_band * 2 <> trunc(p_override_band * 2)) THEN
    RAISE EXCEPTION 'Band phải từ 0 đến 9, bước 0.5.' USING ERRCODE = '22023';
  END IF;

  SELECT overall_band INTO v_ai_band FROM public.ai_feedback WHERE attempt_id = p_attempt AND status = 'completed';

  IF v_comment IS NULL AND p_override_band IS NULL THEN
    DELETE FROM public.teacher_feedback WHERE attempt_id = p_attempt AND teacher_id = auth.uid();
  ELSE
    INSERT INTO public.teacher_feedback (attempt_id, teacher_id, comment, override_band, ai_band)
    VALUES (p_attempt, auth.uid(), v_comment, p_override_band, v_ai_band)
    ON CONFLICT (attempt_id, teacher_id) DO UPDATE
      SET comment = EXCLUDED.comment, override_band = EXCLUDED.override_band, ai_band = EXCLUDED.ai_band;
  END IF;

  SELECT override_band INTO v_effective FROM public.teacher_feedback
  WHERE attempt_id = p_attempt AND override_band IS NOT NULL
  ORDER BY updated_at DESC LIMIT 1;
  v_effective := COALESCE(v_effective, v_ai_band);
  UPDATE public.exam_attempts SET band_score = v_effective WHERE id = p_attempt;

  RETURN jsonb_build_object('attempt_id', p_attempt, 'band_score', v_effective, 'ai_band', v_ai_band);
EXCEPTION WHEN check_violation THEN
  RAISE EXCEPTION 'Nhận xét tối đa 4000 ký tự.' USING ERRCODE = '22023';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

-- ====================================================================
-- PHẦN 8: RPC HỌC VIÊN
-- ====================================================================

CREATE OR REPLACE FUNCTION public.join_class(p_code TEXT)
RETURNS JSONB AS $$
DECLARE
  v_class RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập.' USING ERRCODE = '28000';
  END IF;
  SELECT * INTO v_class FROM public.classes WHERE join_code = upper(btrim(p_code));
  IF NOT FOUND OR v_class.is_archived THEN
    RAISE EXCEPTION 'Mã lớp không đúng hoặc lớp đã đóng.' USING ERRCODE = 'P0002';
  END IF;
  IF v_class.teacher_id = auth.uid() THEN
    RAISE EXCEPTION 'Bạn là giáo viên của lớp này.' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.class_members (class_id, student_id, joined_via)
  VALUES (v_class.id, auth.uid(), 'code')
  ON CONFLICT DO NOTHING;
  UPDATE public.class_invites SET status = 'accepted', responded_at = NOW()
  WHERE class_id = v_class.id AND email = public.my_email() AND status = 'pending';
  RETURN jsonb_build_object('class_id', v_class.id, 'name', v_class.name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

CREATE OR REPLACE FUNCTION public.respond_invite(p_invite UUID, p_accept BOOLEAN)
RETURNS VOID AS $$
DECLARE
  v_inv RECORD;
BEGIN
  SELECT i.*, c.is_archived, c.teacher_id INTO v_inv
  FROM public.class_invites i JOIN public.classes c ON c.id = i.class_id
  WHERE i.id = p_invite AND i.status = 'pending' AND i.email = public.my_email();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy lời mời dành cho bạn.' USING ERRCODE = 'P0002';
  END IF;
  IF p_accept THEN
    IF v_inv.is_archived THEN
      RAISE EXCEPTION 'Lớp đã đóng.' USING ERRCODE = '22023';
    END IF;
    IF v_inv.teacher_id = auth.uid() THEN
      RAISE EXCEPTION 'Bạn là giáo viên của lớp này.' USING ERRCODE = '22023';
    END IF;
    INSERT INTO public.class_members (class_id, student_id, joined_via)
    VALUES (v_inv.class_id, auth.uid(), 'invite') ON CONFLICT DO NOTHING;
  END IF;
  UPDATE public.class_invites SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END, responded_at = NOW()
  WHERE id = p_invite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

CREATE OR REPLACE FUNCTION public.leave_class(p_class UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.class_members WHERE class_id = p_class AND student_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bạn không ở trong lớp này.' USING ERRCODE = 'P0002';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE SET search_path = public;

-- Trạng thái bài được giao của một học viên: đã làm khi có lượt làm đề đó sau thời điểm giao
CREATE OR REPLACE FUNCTION public.assignment_status_for(p_assignment UUID, p_student UUID)
RETURNS JSONB AS $$
  SELECT jsonb_build_object(
    'done', count(at.id) > 0,
    'attempts', count(at.id),
    'best_band', max(at.band_score),
    'last_at', max(at.completed_at),
    'late', bool_or(a.due_at IS NOT NULL AND at.completed_at > a.due_at)
  )
  FROM public.assignments a
  LEFT JOIN public.exam_attempts at
    ON at.test_id = a.test_id AND at.user_id = p_student AND at.completed_at >= a.created_at
  WHERE a.id = p_assignment
  GROUP BY a.id;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
REVOKE ALL ON FUNCTION public.assignment_status_for(UUID, UUID) FROM PUBLIC, anon, authenticated;

-- Trang "Lớp của tôi": lớp, giáo viên, lời mời đang chờ, bài được giao, nhận xét của giáo viên
CREATE OR REPLACE FUNCTION public.get_my_classes()
RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập.' USING ERRCODE = '28000';
  END IF;
  RETURN jsonb_build_object(
    'classes', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'description', c.description, 'joined_at', m.joined_at,
        'is_archived', c.is_archived,
        'teacher', jsonb_build_object('id', tp.id, 'full_name', tp.full_name, 'avatar_text', tp.avatar_text, 'avatar_url', tp.avatar_url)
      ) ORDER BY m.joined_at DESC)
      FROM public.class_members m
      JOIN public.classes c ON c.id = m.class_id
      JOIN public.profiles tp ON tp.id = c.teacher_id
      WHERE m.student_id = v_uid
    ), '[]'::jsonb),
    'invites', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id, 'class_id', c.id, 'class_name', c.name, 'teacher_name', tp.full_name, 'created_at', i.created_at
      ) ORDER BY i.created_at DESC)
      FROM public.class_invites i
      JOIN public.classes c ON c.id = i.class_id
      JOIN public.profiles tp ON tp.id = c.teacher_id
      WHERE i.status = 'pending' AND i.email = public.my_email() AND NOT c.is_archived
        AND NOT EXISTS (SELECT 1 FROM public.class_members m WHERE m.class_id = c.id AND m.student_id = v_uid)
    ), '[]'::jsonb),
    'assignments', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', a.id, 'class_id', a.class_id, 'class_name', c.name, 'title', a.title,
        'instructions', a.instructions, 'due_at', a.due_at, 'created_at', a.created_at,
        'test_id', a.test_id, 'skill', t.skill, 'test_title', t.title,
        'personal', a.student_ids IS NOT NULL,
        'status', public.assignment_status_for(a.id, v_uid)
      ) ORDER BY a.due_at ASC NULLS LAST, a.created_at DESC)
      FROM public.assignments a
      JOIN public.class_members m ON m.class_id = a.class_id AND m.student_id = v_uid
      JOIN public.classes c ON c.id = a.class_id
      JOIN public.exam_tests t ON t.id = a.test_id
      WHERE (a.student_ids IS NULL OR v_uid = ANY (a.student_ids)) AND NOT c.is_archived
    ), '[]'::jsonb),
    'feedback', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', f.id, 'attempt_id', f.attempt_id, 'comment', f.comment, 'override_band', f.override_band,
        'ai_band', f.ai_band, 'updated_at', f.updated_at, 'teacher_name', tp.full_name,
        'test_title', t.title, 'skill', t.skill, 'completed_at', at.completed_at
      ) ORDER BY f.updated_at DESC)
      FROM public.teacher_feedback f
      JOIN public.exam_attempts at ON at.id = f.attempt_id AND at.user_id = v_uid
      JOIN public.exam_tests t ON t.id = at.test_id
      JOIN public.profiles tp ON tp.id = f.teacher_id
    ), '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ====================================================================
-- PHẦN 9: RPC DASHBOARD GIÁO VIÊN
-- ====================================================================

CREATE OR REPLACE FUNCTION public.get_teacher_overview()
RETURNS JSONB AS $$
BEGIN
  IF NOT public.is_teacher() THEN
    RAISE EXCEPTION 'Chỉ giáo viên được xem trang này.' USING ERRCODE = '42501';
  END IF;
  RETURN jsonb_build_object(
    'classes', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'description', c.description, 'join_code', c.join_code,
        'is_archived', c.is_archived, 'created_at', c.created_at,
        'member_count', (SELECT count(*) FROM public.class_members m WHERE m.class_id = c.id),
        'pending_invites', (SELECT count(*) FROM public.class_invites i WHERE i.class_id = c.id AND i.status = 'pending'),
        'assignment_count', (SELECT count(*) FROM public.assignments a WHERE a.class_id = c.id),
        'active_7d', (
          SELECT count(DISTINCT at.user_id) FROM public.exam_attempts at
          JOIN public.class_members m ON m.student_id = at.user_id AND m.class_id = c.id
          WHERE at.completed_at >= NOW() - INTERVAL '7 days'
        )
      ) ORDER BY c.is_archived, c.created_at DESC)
      FROM public.classes c WHERE c.teacher_id = auth.uid()
    ), '[]'::jsonb),
    -- Bài Writing/Speaking của học viên chưa có nhận xét của giáo viên (30 ngày gần đây)
    'to_review', COALESCE((
      SELECT jsonb_agg(r ORDER BY (r->>'completed_at') DESC) FROM (
        SELECT DISTINCT ON (at.id) jsonb_build_object(
          'attempt_id', at.id, 'student_id', at.user_id, 'student_name', sp.full_name,
          'class_name', c.name, 'skill', t.skill, 'test_title', t.title,
          'band', at.band_score, 'completed_at', at.completed_at
        ) AS r
        FROM public.exam_attempts at
        JOIN public.exam_tests t ON t.id = at.test_id AND t.skill IN ('writing', 'speaking')
        JOIN public.class_members m ON m.student_id = at.user_id
        JOIN public.classes c ON c.id = m.class_id AND c.teacher_id = auth.uid() AND NOT c.is_archived
        JOIN public.profiles sp ON sp.id = at.user_id
        WHERE at.completed_at >= NOW() - INTERVAL '30 days'
          AND NOT EXISTS (SELECT 1 FROM public.teacher_feedback f WHERE f.attempt_id = at.id AND f.teacher_id = auth.uid())
        ORDER BY at.id
        LIMIT 20
      ) x
    ), '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_class_detail(p_class UUID)
RETURNS JSONB AS $$
DECLARE
  v_class RECORD;
BEGIN
  IF NOT public.is_class_teacher(p_class) THEN
    RAISE EXCEPTION 'Bạn không quản lý lớp này.' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_class FROM public.classes WHERE id = p_class;

  RETURN jsonb_build_object(
    'class', to_jsonb(v_class),
    'members', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'student_id', m.student_id, 'full_name', p.full_name, 'avatar_text', p.avatar_text, 'avatar_url', p.avatar_url,
        'email', u.email, 'joined_at', m.joined_at, 'joined_via', m.joined_via, 'target_band', p.target_band,
        'attempts', (SELECT count(*) FROM public.exam_attempts at WHERE at.user_id = m.student_id),
        'last_active', (SELECT max(completed_at) FROM public.exam_attempts at WHERE at.user_id = m.student_id),
        'bands', (
          SELECT COALESCE(jsonb_object_agg(skill, band_score), '{}'::jsonb) FROM (
            SELECT DISTINCT ON (t.skill) t.skill::text AS skill, at.band_score
            FROM public.exam_attempts at JOIN public.exam_tests t ON t.id = at.test_id
            WHERE at.user_id = m.student_id AND at.band_score IS NOT NULL
            ORDER BY t.skill, at.completed_at DESC
          ) lb
        ),
        'weak_count', (
          SELECT count(*) FROM (
            SELECT 1
            FROM public.exam_answers ans
            JOIN public.exam_attempts at ON at.id = ans.attempt_id AND at.user_id = m.student_id
            JOIN public.exam_questions q ON q.id = ans.question_id
            JOIN public.exam_tests t ON t.id = at.test_id
            GROUP BY t.skill, public.question_category_label(q.category_tag, q.type)
            HAVING count(DISTINCT ans.attempt_id) >= 5 AND count(*) FILTER (WHERE ans.is_correct)::numeric / count(*) < 0.6
          ) w
        )
      ) ORDER BY p.full_name)
      FROM public.class_members m
      JOIN public.profiles p ON p.id = m.student_id
      JOIN auth.users u ON u.id = m.student_id
      WHERE m.class_id = p_class
    ), '[]'::jsonb),
    'invites', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', i.id, 'email', i.email, 'created_at', i.created_at) ORDER BY i.created_at DESC)
      FROM public.class_invites i WHERE i.class_id = p_class AND i.status = 'pending'
    ), '[]'::jsonb),
    'assignments', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', a.id, 'title', a.title, 'instructions', a.instructions, 'due_at', a.due_at, 'created_at', a.created_at,
        'test_id', a.test_id, 'skill', t.skill, 'test_title', t.title, 'student_ids', a.student_ids,
        'recipients', (
          SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'student_id', m.student_id, 'full_name', p.full_name,
            'status', public.assignment_status_for(a.id, m.student_id)
          ) ORDER BY p.full_name), '[]'::jsonb)
          FROM public.class_members m JOIN public.profiles p ON p.id = m.student_id
          WHERE m.class_id = a.class_id AND (a.student_ids IS NULL OR m.student_id = ANY (a.student_ids))
        )
      ) ORDER BY a.created_at DESC)
      FROM public.assignments a JOIN public.exam_tests t ON t.id = a.test_id
      WHERE a.class_id = p_class
    ), '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Tiến độ + lịch sử làm bài của một học viên (chỉ giáo viên của học viên đó hoặc admin)
CREATE OR REPLACE FUNCTION public.get_student_progress(p_student UUID)
RETURNS JSONB AS $$
BEGIN
  IF NOT public.teaches_student(p_student) THEN
    RAISE EXCEPTION 'Học viên này không thuộc lớp nào của bạn.' USING ERRCODE = '42501';
  END IF;
  RETURN public.progress_for_user(p_student) || jsonb_build_object(
    'student', (
      SELECT jsonb_build_object('id', p.id, 'full_name', p.full_name, 'avatar_text', p.avatar_text,
        'avatar_url', p.avatar_url, 'target_band', p.target_band, 'target_exam', p.target_exam, 'email', u.email)
      FROM public.profiles p JOIN auth.users u ON u.id = p.id WHERE p.id = p_student
    ),
    'history', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'attempt_id', at.id, 'test_id', at.test_id, 'test_title', t.title, 'skill', t.skill, 'mode', at.mode,
        'band', at.band_score, 'raw_score', at.raw_score, 'total_questions', at.total_questions,
        'completed_at', at.completed_at, 'duration_seconds', at.duration_seconds,
        'ai', (
          SELECT jsonb_build_object('status', f.status, 'overall_band', f.overall_band, 'summary', f.summary,
            'criteria', f.criteria, 'submission_text', f.submission_text, 'provider', f.provider)
          FROM public.ai_feedback f WHERE f.attempt_id = at.id
        ),
        'my_feedback', (
          SELECT jsonb_build_object('comment', tf.comment, 'override_band', tf.override_band, 'updated_at', tf.updated_at)
          FROM public.teacher_feedback tf WHERE tf.attempt_id = at.id AND tf.teacher_id = auth.uid()
        )
      ) ORDER BY at.completed_at DESC)
      FROM public.exam_attempts at JOIN public.exam_tests t ON t.id = at.test_id
      WHERE at.user_id = p_student
    ), '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Danh sách đề đã xuất bản để giao (giáo viên)
CREATE OR REPLACE FUNCTION public.list_assignable_tests()
RETURNS JSONB AS $$
BEGIN
  IF NOT public.is_teacher() THEN
    RAISE EXCEPTION 'Chỉ giáo viên được giao bài.' USING ERRCODE = '42501';
  END IF;
  RETURN COALESCE((
    SELECT jsonb_agg(jsonb_build_object('id', id, 'title', title, 'skill', skill, 'subtitle', subtitle,
      'time_minutes', time_minutes, 'is_published', is_published) ORDER BY skill, title)
    FROM public.exam_tests WHERE exam_id = 'ielts'
  ), '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

REVOKE ALL ON FUNCTION public.set_user_role(TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.list_staff() FROM anon;
REVOKE ALL ON FUNCTION public.create_class(TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.update_class(UUID, TEXT, TEXT, BOOLEAN) FROM anon;
REVOKE ALL ON FUNCTION public.regenerate_join_code(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.invite_to_class(UUID, TEXT[]) FROM anon;
REVOKE ALL ON FUNCTION public.revoke_invite(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.remove_class_member(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.create_assignment(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, UUID[]) FROM anon;
REVOKE ALL ON FUNCTION public.delete_assignment(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.upsert_teacher_feedback(UUID, TEXT, NUMERIC) FROM anon;
REVOKE ALL ON FUNCTION public.join_class(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.respond_invite(UUID, BOOLEAN) FROM anon;
REVOKE ALL ON FUNCTION public.leave_class(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.get_my_classes() FROM anon;
REVOKE ALL ON FUNCTION public.get_teacher_overview() FROM anon;
REVOKE ALL ON FUNCTION public.get_class_detail(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.get_student_progress(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.list_assignable_tests() FROM anon;
