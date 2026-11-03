-- ==============================================================================
-- SCRIPT: grant_admin.sql
-- Mục đích: Cấp quyền Quản trị viên (Admin) cho người dùng thật qua email
-- 
-- HƯỚNG DẪN SỬ DỤNG:
-- Cách 1 (Supabase Dashboard):
--   1. Truy cập vào Dashboard dự án Supabase -> Chọn SQL Editor.
--   2. Thay thế 'EMAIL_CUA_BAN@example.com' ở dòng 16 bằng email tài khoản của bạn.
--   3. Nhấn "Run" để thực thi.
--
-- Cách 2 (Supabase CLI trên máy tính đã liên kết):
--   supabase db execute --file backend/supabase/scripts/grant_admin.sql
-- ==============================================================================

DO $$
DECLARE
  -- THAY ĐỔI EMAIL TÀI KHOẢN CỦA BẠN TẠI ĐÂY:
  v_target_email TEXT := 'EMAIL_CUA_BAN@example.com';
  v_user_id UUID;
  v_full_name TEXT;
BEGIN
  -- 1. Tìm user_id từ auth.users theo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(TRIM(v_target_email));

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ Không tìm thấy người dùng với email: %. Hãy đăng ký tài khoản trước khi cấp quyền Admin!', v_target_email;
  END IF;

  -- 2. Thêm hoặc cập nhật vai trò admin trong public.user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE
  SET role = 'admin';

  -- 3. Lấy tên hiển thị trong profiles để thông báo
  SELECT full_name INTO v_full_name
  FROM public.profiles
  WHERE id = v_user_id;

  RAISE NOTICE '✅ Đã cấp quyền ADMIN thành công cho người dùng: "%" (Email: %, User ID: %)',
    COALESCE(v_full_name, 'Chưa đặt tên'), v_target_email, v_user_id;
END;
$$;
