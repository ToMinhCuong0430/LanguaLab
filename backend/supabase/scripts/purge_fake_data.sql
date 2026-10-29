-- ==============================================================================
-- SCRIPT: purge_fake_data.sql
-- Mục đích: Dọn dẹp AN TOÀN dữ liệu ảo, user ảo trên Database Remote
-- Cơ chế: Xóa tài khoản ảo trong auth.users -> ON DELETE CASCADE tự dọn dẹp các bảng con.
-- 
-- ⚠️ AN TOÀN: Bọc trong transaction. Nếu có lỗi, giao dịch tự động hoàn nguyên.
--
-- HƯỚNG DẪN:
--   Dán toàn bộ script này vào SQL Editor trên Supabase Dashboard và bấm "Run".
-- ==============================================================================

BEGIN;

DO $$
DECLARE
  v_deleted_users INTEGER := 0;
  v_fake_user_ids UUID[];
BEGIN
  RAISE NOTICE '======================================================================';
  RAISE NOTICE '🧹 BẮT ĐẦU DỌN DẸP DỮ LIỆU ẢO / USER ẢO';
  RAISE NOTICE '======================================================================';

  -- 1. Thu thập danh sách user_id ảo cần dọn dẹp
  SELECT ARRAY_AGG(id) INTO v_fake_user_ids
  FROM auth.users
  WHERE email ILIKE '%@langua.local'
     OR email ILIKE '%@example.com'
     OR email ILIKE 'test_%@%'
     OR email ILIKE 'dummy_%@%'
     OR raw_user_meta_data->>'full_name' IN ('Minh Hoàng', 'Alice Johnson', 'Bob Smith', 'Charlie Nguyen', 'Admin User');

  IF v_fake_user_ids IS NOT NULL AND ARRAY_LENGTH(v_fake_user_ids, 1) > 0 THEN
    -- 2. Xóa các vai trò trong user_roles
    DELETE FROM public.user_roles
    WHERE user_id = ANY(v_fake_user_ids);

    -- 3. Xóa trực tiếp trong auth.users (Tự động kích hoạt CASCADE trên profiles, attempts, xp...)
    DELETE FROM auth.users
    WHERE id = ANY(v_fake_user_ids);

    GET DIAGNOSTICS v_deleted_users = ROW_COUNT;
    RAISE NOTICE '✅ Đã xoá thành công % tài khoản ảo và cascade dọn dẹp toàn bộ dữ liệu phụ thuộc!', v_deleted_users;
  ELSE
    RAISE NOTICE 'ℹ️ Không tìm thấy tài khoản ảo nào cần xoá. Database đã sạch!';
  END IF;

  -- 4. Dọn dẹp thêm các bài đề xuất tính năng rác do user ảo tạo (nếu còn sót)
  DELETE FROM public.feature_requests
  WHERE author_name IN ('Minh Hoàng', 'Alice Johnson', 'Bob Smith', 'Charlie Nguyen', 'Admin User');

  RAISE NOTICE '======================================================================';
  RAISE NOTICE '🎉 HOÀN TẤT DỌN DẸP DỮ LIỆU ẢO THÀNH CÔNG!';
  RAISE NOTICE '======================================================================';
END;
$$;

COMMIT;
