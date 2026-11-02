-- ==============================================================================
-- TEST SUITE: 02_lexicon_rls_tests.sql
-- Mục đích: kiểm thử RLS, quyền bảng và quy tắc xuất bản của kho từ vựng (lex_*)
-- Toàn bộ chạy trong transaction và ROLLBACK, không để lại dữ liệu.
--
-- Cách chạy:
--   supabase test db        (chạy trên DB local)
-- KHÔNG chạy trên database production.
-- ==============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(15);

-- ==============================================================================
-- DỮ LIỆU TẠM: 1 user thường, 1 admin, 3 mục từ (published / draft / draft không có nghĩa)
-- ==============================================================================
DO $$
DECLARE
  v_user  UUID := gen_random_uuid();
  v_admin UUID := gen_random_uuid();
  v_pub   UUID;
  v_draft UUID;
  v_nosns UUID;
  v_pub_sense UUID;
  v_draft_sense UUID;
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES
    (v_user,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lex_user@test.local',  '{"provider":"email","providers":["email"]}', '{"full_name":"Lex User"}',  NOW(), NOW()),
    (v_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lex_admin@test.local', '{"provider":"email","providers":["email"]}', '{"full_name":"Lex Admin"}', NOW(), NOW());

  INSERT INTO public.profiles (id, full_name, avatar_text, target_exam)
  VALUES (v_user, 'Lex User', 'L', 'ielts')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  INSERT INTO public.user_roles (user_id, role) VALUES (v_admin, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

  -- Mục từ sẽ được publish (phải thêm nghĩa đã duyệt trước)
  INSERT INTO public.lex_entries (language, lemma) VALUES ('en', 'zzt_pub') RETURNING id INTO v_pub;
  INSERT INTO public.lex_senses (entry_id, part_of_speech, definition, level, review_status)
  VALUES (v_pub, 'noun', 'test definition', 'A1', 'approved') RETURNING id INTO v_pub_sense;
  INSERT INTO public.lex_translations (sense_id, translated_text, review_status)
  VALUES (v_pub_sense, 'bản dịch đã duyệt', 'approved'),
         (v_pub_sense, 'bản dịch chờ duyệt', 'pending');
  UPDATE public.lex_entries SET status = 'published' WHERE id = v_pub;

  -- Mục từ nháp có nghĩa đã duyệt (vẫn không được lộ ra ngoài vì entry chưa published)
  INSERT INTO public.lex_entries (language, lemma) VALUES ('en', 'zzt_draft') RETURNING id INTO v_draft;
  INSERT INTO public.lex_senses (entry_id, part_of_speech, definition, review_status)
  VALUES (v_draft, 'noun', 'draft definition', 'approved') RETURNING id INTO v_draft_sense;

  -- Mục từ nháp không có nghĩa nào
  INSERT INTO public.lex_entries (language, lemma) VALUES ('en', 'zzt_nosense') RETURNING id INTO v_nosns;

  PERFORM set_config('test.user',  v_user::TEXT,  true);
  PERFORM set_config('test.admin', v_admin::TEXT, true);
  PERFORM set_config('test.pub',   v_pub::TEXT,   true);
  PERFORM set_config('test.draft', v_draft::TEXT, true);
  PERFORM set_config('test.nosns', v_nosns::TEXT, true);
  PERFORM set_config('test.pub_sense', v_pub_sense::TEXT, true);
END;
$$;

-- ==============================================================================
-- KHÁCH (anon)
-- ==============================================================================
SELECT set_config('role', 'anon', true);
SELECT set_config('request.jwt.claims', '{"role": "anon"}', true);

-- 1. Khách chỉ thấy mục từ published
SELECT is(
  (SELECT COUNT(*)::INT FROM public.lex_entries WHERE lemma LIKE 'zzt\_%'),
  1,
  'Khách chỉ thấy mục từ đã published'
);

-- 2. Khách không thấy nghĩa của mục từ nháp
SELECT is_empty(
  format('SELECT 1 FROM public.lex_senses WHERE entry_id = %L::uuid', current_setting('test.draft')),
  'Khách không thấy nghĩa của mục từ nháp'
);

-- 3. Khách chỉ thấy bản dịch đã duyệt
SELECT is(
  (SELECT COUNT(*)::INT FROM public.lex_translations WHERE sense_id = current_setting('test.pub_sense')::uuid),
  1,
  'Khách chỉ thấy bản dịch đã duyệt (approved)'
);

-- 4. Khách không đọc được bảng nội bộ
SELECT throws_ok(
  'SELECT * FROM public.lex_raw_records',
  '42501',
  NULL,
  'Khách không có quyền đọc lex_raw_records'
);

-- 5. Khách không ghi được
SELECT throws_ok(
  $$INSERT INTO public.lex_entries (language, lemma) VALUES ('en', 'zzt_hack')$$,
  '42501',
  NULL,
  'Khách không có quyền ghi lex_entries'
);

-- 6. Tìm kiếm chỉ trả mục từ published
SELECT is(
  (SELECT COUNT(*)::INT FROM public.search_lex_entries('zzt_p') WHERE lemma LIKE 'zzt\_%'),
  1,
  'search_lex_entries chỉ trả mục từ published'
);

-- 6b. Khách đọc được bảng ánh xạ cấp độ (6 CEFR + 10 HSK + 5 JLPT + 1 custom = 22 dòng)
--     (cần migration 20261031000019)
SELECT is(
  (SELECT COUNT(*)::INT FROM public.lex_level_map),
  22,
  'Bảng lex_level_map có đủ 22 dòng ánh xạ về thang 1-7'
);

-- ==============================================================================
-- NGƯỜI DÙNG THƯỜNG
-- ==============================================================================
SELECT set_config('role', 'authenticated', true);
SELECT set_config('request.jwt.claims',
  format('{"sub": "%s", "role": "authenticated"}', current_setting('test.user')), true);

-- 7. Gửi báo lỗi cho chính mình, trên mục từ published
SELECT lives_ok(
  format($f$INSERT INTO public.lex_reports (user_id, entry_id, report_type, message)
            VALUES (%L::uuid, %L::uuid, 'wrong_meaning', 'nghĩa chưa đúng')$f$,
         current_setting('test.user'), current_setting('test.pub')),
  'Người dùng gửi được báo lỗi của chính mình'
);

-- 8. Không được gửi báo lỗi mạo danh người khác
SELECT throws_ok(
  format($f$INSERT INTO public.lex_reports (user_id, entry_id, report_type)
            VALUES (%L::uuid, %L::uuid, 'other')$f$,
         current_setting('test.admin'), current_setting('test.pub')),
  '42501',
  NULL,
  'Không thể báo lỗi dưới danh nghĩa người khác'
);

-- 9. Không báo lỗi được mục từ chưa published
SELECT throws_ok(
  format($f$INSERT INTO public.lex_reports (user_id, entry_id, report_type)
            VALUES (%L::uuid, %L::uuid, 'other')$f$,
         current_setting('test.user'), current_setting('test.draft')),
  '42501',
  NULL,
  'Không báo lỗi được mục từ nháp'
);

-- 10. Người dùng thường cố sửa mục từ: bị RLS chặn êm (0 dòng bị ảnh hưởng)
SELECT lives_ok(
  format($f$UPDATE public.lex_entries SET status = 'rejected' WHERE id = %L::uuid$f$, current_setting('test.pub')),
  'UPDATE bởi người thường không lỗi nhưng không có tác dụng'
);

RESET ROLE;

-- 11. Mục từ vẫn còn nguyên trạng thái
SELECT is(
  (SELECT status FROM public.lex_entries WHERE id = current_setting('test.pub')::uuid),
  'published',
  'Người thường không đổi được trạng thái mục từ'
);

-- ==============================================================================
-- ADMIN
-- ==============================================================================
SELECT set_config('role', 'authenticated', true);
SELECT set_config('request.jwt.claims',
  format('{"sub": "%s", "role": "authenticated"}', current_setting('test.admin')), true);

-- 12. Admin sửa được
SELECT lives_ok(
  format($f$UPDATE public.lex_entries SET status = 'rejected' WHERE id = %L::uuid$f$, current_setting('test.draft')),
  'Admin cập nhật được mục từ'
);

-- 13. Và thay đổi có hiệu lực
SELECT is(
  (SELECT status FROM public.lex_entries WHERE id = current_setting('test.draft')::uuid),
  'rejected',
  'Admin đổi trạng thái thành công'
);

RESET ROLE;

-- ==============================================================================
-- QUY TẮC XUẤT BẢN
-- ==============================================================================

-- 14. Không publish được mục từ chưa có nghĩa nào được duyệt (kể cả khi là superuser/service_role)
SELECT throws_ok(
  format($f$UPDATE public.lex_entries SET status = 'published' WHERE id = %L::uuid$f$, current_setting('test.nosns')),
  '23514',
  NULL,
  'Chặn publish mục từ chưa có nghĩa được duyệt'
);

SELECT * FROM finish();

ROLLBACK;

