-- ==============================================================================
-- SCRIPT: purge_fake_data.sql
-- Mục đích: Dọn dẹp AN TOÀN dữ liệu ảo, user ảo trên Database Remote
-- Tiêu chí HẸP (Chống xóa nhầm tài khoản thật):
--   - CHỈ nhắm đúng tài khoản có email LIKE '%@langua.local' hoặc 6 UUID seed cũ:
--     00000000-0000-0000-0000-000000000001 -> 00000000-0000-0000-0000-000000000006
--   - TUYỆT ĐỐI BỎ các mẫu nguy hiểm (@example.com, test_%, dummy_%, full_name, feature_requests).
--
-- Cơ chế: Xóa tài khoản trong auth.users -> ON DELETE CASCADE tự dọn dẹp các bảng con.
-- ⚠️ AN TOÀN: Bọc trong transaction. Nếu có lỗi, giao dịch tự động hoàn nguyên.
-- ==============================================================================

-- 1. BƯỚC XEM TRƯỚC (PREVIEW): Danh sách tài khoản ảo sẽ bị xử lý
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'full_name' AS full_name, 
  created_at 
FROM auth.users
WHERE email ILIKE '%@langua.local'
   OR id IN (
     '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000004',
     '00000000-0000-0000-0000-000000000005',
     '00000000-0000-0000-0000-000000000006'
   );

BEGIN;

DO $$
DECLARE
  v_deleted_users INTEGER := 0;
  v_remaining_fake INTEGER := 0;
  v_fake_user_ids UUID[];
BEGIN
  RAISE NOTICE '======================================================================';
  RAISE NOTICE '🧹 BẮT ĐẦU DỌN DẸP USER ẢO (@langua.local) TRÊN HỆ THỐNG';
  RAISE NOTICE '======================================================================';

  -- 2. Thu thập danh sách user_id ảo theo đúng tiêu chí hẹp an toàn
  SELECT ARRAY_AGG(id) INTO v_fake_user_ids
  FROM auth.users
  WHERE email ILIKE '%@langua.local'
     OR id IN (
       '00000000-0000-0000-0000-000000000001',
       '00000000-0000-0000-0000-000000000002',
       '00000000-0000-0000-0000-000000000003',
       '00000000-0000-0000-0000-000000000004',
       '00000000-0000-0000-0000-000000000005',
       '00000000-0000-0000-0000-000000000006'
     );

  IF v_fake_user_ids IS NOT NULL AND ARRAY_LENGTH(v_fake_user_ids, 1) > 0 THEN
    -- Xoá vai trò trong user_roles
    DELETE FROM public.user_roles
    WHERE user_id = ANY(v_fake_user_ids);

    -- Xoá trong auth.users (CASCADE tự dọn profiles, checkins, attempts, xp_events...)
    DELETE FROM auth.users
    WHERE id = ANY(v_fake_user_ids);

    GET DIAGNOSTICS v_deleted_users = ROW_COUNT;
    RAISE NOTICE '✅ Đã xoá thành công % tài khoản ảo (@langua.local) và cascade dọn các bảng phụ thuộc!', v_deleted_users;
  ELSE
    RAISE NOTICE 'ℹ️ Không tìm thấy tài khoản ảo (@langua.local) nào. Database đã sạch!';
  END IF;

  -- 3. Kiểm tra kiểm chứng: Số tài khoản ảo còn lại BẮT BUỘC phải bằng 0
  SELECT COUNT(*) INTO v_remaining_fake
  FROM auth.users
  WHERE email ILIKE '%@langua.local'
     OR id IN (
       '00000000-0000-0000-0000-000000000001',
       '00000000-0000-0000-0000-000000000002',
       '00000000-0000-0000-0000-000000000003',
       '00000000-0000-0000-0000-000000000004',
       '00000000-0000-0000-0000-000000000005',
       '00000000-0000-0000-0000-000000000006'
     );

  IF v_remaining_fake > 0 THEN
    RAISE EXCEPTION '❌ LỖI TOÀN VẸN: Vẫn còn % tài khoản ảo chưa được xoá sạch! Huỷ giao dịch.', v_remaining_fake;
  END IF;

  RAISE NOTICE '======================================================================';
  RAISE NOTICE '🎉 XÁC MINH COUNT = 0 THÀNH CÔNG! SẴN SÀNG COMMIT.';
  RAISE NOTICE '======================================================================';
END;
$$;

-- 4. BƯỚC KIỂM TRA LẦN CUỐI TRƯỚC COMMIT (kỳ vọng count = 0)
SELECT 
  'remaining_fake_users_check' AS check_name, 
  count(*) AS remaining_count,
  CASE WHEN count(*) = 0 THEN '✅ SẠCH 100%' ELSE '❌ CÒN SÓT' END AS status
FROM auth.users
WHERE email ILIKE '%@langua.local'
   OR id IN (
     '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000004',
     '00000000-0000-0000-0000-000000000005',
     '00000000-0000-0000-0000-000000000006'
   );

COMMIT;
