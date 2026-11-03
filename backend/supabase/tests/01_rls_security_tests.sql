-- ==============================================================================
-- TEST SUITE: 01_rls_security_tests.sql
-- Mục đích: Kiểm thử bảo mật RLS và chống gian lận (bọc hoàn toàn trong ROLLBACK)
-- Tự động dọn sạch 100%, không để lại user hay dữ liệu rác sau khi chạy.
--
-- Cách chạy:
--   1. Qua Supabase CLI: supabase test db
--   2. Hoặc dán trực tiếp toàn bộ nội dung file vào Supabase SQL Editor và nhấn Run
-- ==============================================================================

BEGIN;

-- Tạo extension pgtap nếu chưa có
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Khai báo số lượng test cases
SELECT plan(6);

-- ==============================================================================
-- THIẾT LẬP TEST USERS TẠM THỜI TRONG TRANSACTION
-- ==============================================================================
DO $$
DECLARE
  v_user_a UUID := gen_random_uuid();
  v_user_b UUID := gen_random_uuid();
BEGIN
  -- Tạo tạm 2 user trong auth.users
  INSERT INTO auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES 
    (v_user_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_user_a@test.local', '{"provider":"email","providers":["email"]}', '{"full_name":"Test User A"}', NOW(), NOW()),
    (v_user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_user_b@test.local', '{"provider":"email","providers":["email"]}', '{"full_name":"Test User B"}', NOW(), NOW());

  -- Đảm bảo có profile cho cả 2
  INSERT INTO public.profiles (id, full_name, avatar_text, target_exam, total_xp, streak_days)
  VALUES 
    (v_user_a, 'Test User A', 'A', 'ielts', 100, 1),
    (v_user_b, 'Test User B', 'B', 'ielts', 200, 2)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- Lưu ID vào biến cấu hình phiên để dùng trong các câu test
  PERFORM set_config('test.user_a', v_user_a::TEXT, true);
  PERFORM set_config('test.user_b', v_user_b::TEXT, true);

  -- Thêm dữ liệu bài làm riêng tư của User B
  INSERT INTO public.exam_attempts (id, user_id, test_id, exam_mode, score_listening, raw_score, total_questions, duration_seconds)
  VALUES (gen_random_uuid(), v_user_b, 'ielts-cam18-test1-reading', 'full_test', 7.5, 30, 40, 3600);

  INSERT INTO public.user_word_progress (user_id, word_id, srs_stage, repetitions, interval_days, ease_factor)
  VALUES (v_user_b, 'w-en-resilient', 3, 2, 6, 2.5);
END;
$$;

-- ==============================================================================
-- TEST CASE 1: User A đọc bài làm và từ vựng của User B -> Rỗng (0 rows)
-- ==============================================================================
SELECT set_config('role', 'authenticated', true);
SELECT set_config('request.jwt.claims', format('{"sub": "%s", "role": "authenticated"}', current_setting('test.user_a')), true);

SELECT is_empty(
  format('SELECT * FROM public.exam_attempts WHERE user_id = ''%s''::uuid', current_setting('test.user_b')),
  'TC1.1: User A không thể đọc exam_attempts của User B'
);

SELECT is_empty(
  format('SELECT * FROM public.user_word_progress WHERE user_id = ''%s''::uuid', current_setting('test.user_b')),
  'TC1.2: User A không thể đọc user_word_progress của User B'
);

-- ==============================================================================
-- TEST CASE 2: User A cố UPDATE profiles của User B -> 0 rows affected
-- ==============================================================================
DO $$
DECLARE
  v_updated_rows INTEGER;
BEGIN
  UPDATE public.profiles 
  SET full_name = 'Hacked Name'
  WHERE id = current_setting('test.user_b')::uuid;
  
  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  PERFORM set_config('test.tc2_rows', v_updated_rows::TEXT, true);
END;
$$;

SELECT is(
  current_setting('test.tc2_rows')::INTEGER,
  0,
  'TC2: User A cố update profile của User B bị RLS chặn (0 row updated)'
);

-- ==============================================================================
-- TEST CASE 3: User A cố trực tiếp sửa total_xp của chính mình -> Bị trigger chặn
-- ==============================================================================
SELECT throws_ok(
  format('UPDATE public.profiles SET total_xp = 999999 WHERE id = ''%s''::uuid', current_setting('test.user_a')),
  'P0001',
  'Không được phép cập nhật trực tiếp tổng XP (chỉ qua RPC thi/học thật)',
  'TC3: Chặn direct UPDATE vào profiles.total_xp đối với user thường'
);

-- ==============================================================================
-- TEST CASE 4: Gọi award_xp 2 lần cùng reference_id -> Lần 2 trả success: false
-- ==============================================================================
DO $$
DECLARE
  v_ref_id TEXT := 'test-idempotent-' || gen_random_uuid()::TEXT;
  v_res1 JSONB;
  v_res2 JSONB;
BEGIN
  -- Lần 1: Nhận XP thành công
  v_res1 := public.award_xp('typing_attempt', v_ref_id, current_setting('test.user_a')::uuid);
  -- Lần 2: Cùng reference_id -> Phải bị từ chối
  v_res2 := public.award_xp('typing_attempt', v_ref_id, current_setting('test.user_a')::uuid);

  PERFORM set_config('test.tc4_res1_success', (v_res1->>'success')::TEXT, true);
  PERFORM set_config('test.tc4_res2_success', (v_res2->>'success')::TEXT, true);
  PERFORM set_config('test.tc4_res2_xp', (v_res2->>'xp_gained')::TEXT, true);
END;
$$;

SELECT is(
  current_setting('test.tc4_res2_success'),
  'false',
  'TC4: award_xp idempotent chặn cộng điểm lần 2 cùng reference_id'
);

-- ==============================================================================
-- TEST CASE 5: User thường cố INSERT vào user_roles -> Bị RLS chặn
-- ==============================================================================
SELECT throws_ok(
  format('INSERT INTO public.user_roles (user_id, role) VALUES (''%s''::uuid, ''admin'')', current_setting('test.user_a')),
  '42501',
  NULL,
  'TC5: User thường không được phép INSERT vào user_roles'
);

-- ==============================================================================
-- TEST CASE 6: User thường cố truy cập bảng content_import_logs -> Bị chặn
-- ==============================================================================
SELECT is_empty(
  'SELECT * FROM public.content_import_logs',
  'TC6: User thường không thể xem content_import_logs (chỉ dành cho Admin)'
);

-- Kết thúc test plan
SELECT * FROM finish();

-- ROLLBACK toàn bộ thay đổi để giữ database sạch 100%
ROLLBACK;
