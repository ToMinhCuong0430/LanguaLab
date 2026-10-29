-- ==============================================================================
-- SCRIPT: audit_fake_data.sql
-- Mục đích: Kiểm kê & Báo cáo toàn diện dữ liệu ảo, user ảo trên Database Remote
-- Chế độ: READ-ONLY (Chỉ đọc, tuyệt đối KHÔNG xoá hoặc sửa đổi dữ liệu)
--
-- HƯỚNG DẪN:
--   Dán toàn bộ script này vào SQL Editor trên Supabase Dashboard và bấm "Run".
-- ==============================================================================

DO $$
DECLARE
  v_fake_users_count INTEGER := 0;
  v_fake_profiles_count INTEGER := 0;
  v_fake_checkins_count INTEGER := 0;
  v_fake_xp_events_count INTEGER := 0;
  v_fake_notifs_count INTEGER := 0;
  v_fake_progress_count INTEGER := 0;
  v_fake_attempts_count INTEGER := 0;
  v_fake_feature_reqs_count INTEGER := 0;
  v_real_users_count INTEGER := 0;
  r RECORD;
BEGIN
  RAISE NOTICE '======================================================================';
  RAISE NOTICE '🔍 BẮT ĐẦU KIỂM KÊ DỮ LIỆU ẢO / USER ẢO TRÊN HỆ THỐNG SUPABASE';
  RAISE NOTICE '======================================================================';

  -- 1. Đếm người dùng ảo theo mẫu email hoặc metadata
  SELECT COUNT(*) INTO v_fake_users_count
  FROM auth.users
  WHERE email ILIKE '%@langua.local'
     OR email ILIKE '%@example.com'
     OR email ILIKE 'test_%@%'
     OR email ILIKE 'dummy_%@%'
     OR raw_user_meta_data->>'full_name' IN ('Minh Hoàng', 'Alice Johnson', 'Bob Smith', 'Charlie Nguyen', 'Admin User');

  SELECT COUNT(*) INTO v_real_users_count
  FROM auth.users
  WHERE NOT (
    email ILIKE '%@langua.local'
    OR email ILIKE '%@example.com'
    OR email ILIKE 'test_%@%'
    OR email ILIKE 'dummy_%@%'
    OR raw_user_meta_data->>'full_name' IN ('Minh Hoàng', 'Alice Johnson', 'Bob Smith', 'Charlie Nguyen', 'Admin User')
  );

  -- 2. Đếm profiles ảo
  SELECT COUNT(*) INTO v_fake_profiles_count
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE u.email ILIKE '%@langua.local'
     OR u.email ILIKE '%@example.com'
     OR u.email ILIKE 'test_%@%'
     OR p.full_name IN ('Minh Hoàng', 'Alice Johnson', 'Bob Smith', 'Charlie Nguyen', 'Admin User');

  -- 3. Đếm dữ liệu điểm danh ảo
  SELECT COUNT(*) INTO v_fake_checkins_count
  FROM public.daily_checkins c
  JOIN auth.users u ON c.user_id = u.id
  WHERE u.email ILIKE '%@langua.local'
     OR u.email ILIKE '%@example.com'
     OR u.email ILIKE 'test_%@%';

  -- 4. Đếm sự kiện XP ảo
  SELECT COUNT(*) INTO v_fake_xp_events_count
  FROM public.xp_events x
  JOIN auth.users u ON x.user_id = u.id
  WHERE u.email ILIKE '%@langua.local'
     OR u.email ILIKE '%@example.com'
     OR u.email ILIKE 'test_%@%';

  -- 5. Đếm thông báo ảo
  SELECT COUNT(*) INTO v_fake_notifs_count
  FROM public.notifications n
  JOIN auth.users u ON n.user_id = u.id
  WHERE u.email ILIKE '%@langua.local'
     OR u.email ILIKE '%@example.com'
     OR u.email ILIKE 'test_%@%';

  -- 6. Đếm tiến độ từ vựng ảo
  SELECT COUNT(*) INTO v_fake_progress_count
  FROM public.user_word_progress w
  JOIN auth.users u ON w.user_id = u.id
  WHERE u.email ILIKE '%@langua.local'
     OR u.email ILIKE '%@example.com'
     OR u.email ILIKE 'test_%@%';

  -- 7. Đếm bài thi ảo
  SELECT COUNT(*) INTO v_fake_attempts_count
  FROM public.exam_attempts a
  JOIN auth.users u ON a.user_id = u.id
  WHERE u.email ILIKE '%@langua.local'
     OR u.email ILIKE '%@example.com'
     OR u.email ILIKE 'test_%@%';

  -- In kết quả
  RAISE NOTICE '📊 KẾT QUẢ KIỂM KÊ:';
  RAISE NOTICE ' - Số tài khoản người dùng THẬT: %', v_real_users_count;
  RAISE NOTICE ' - Số tài khoản người dùng ẢO phát hiện: %', v_fake_users_count;
  RAISE NOTICE ' - Số Hồ sơ (profiles) ảo: %', v_fake_profiles_count;
  RAISE NOTICE ' - Số bản ghi điểm danh (daily_checkins) ảo: %', v_fake_checkins_count;
  RAISE NOTICE ' - Số sự kiện kinh nghiệm (xp_events) ảo: %', v_fake_xp_events_count;
  RAISE NOTICE ' - Số thông báo (notifications) ảo: %', v_fake_notifs_count;
  RAISE NOTICE ' - Số tiến độ ôn tập (user_word_progress) ảo: %', v_fake_progress_count;
  RAISE NOTICE ' - Số lượt thi thử (exam_attempts) ảo: %', v_fake_attempts_count;

  IF v_fake_users_count = 0 AND v_fake_profiles_count = 0 THEN
    RAISE NOTICE '✅ TUYỆT VỜI: Cơ sở dữ liệu HOÀN TOÀN SẠCH, không phát hiện tài khoản ảo nào!';
  ELSE
    RAISE NOTICE '⚠️ CẢNH BÁO: Phát hiện dữ liệu ảo còn sót. Hãy chạy script purge_fake_data.sql để làm sạch an toàn!';
  END IF;
  RAISE NOTICE '======================================================================';
END;
$$;
