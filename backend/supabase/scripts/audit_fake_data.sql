-- ==============================================================================
-- SCRIPT: audit_fake_data.sql
-- Mục đích: Kiểm kê & Báo cáo toàn diện dữ liệu ảo, user ảo trên Database Remote
-- Chế độ: READ-ONLY (Chỉ đọc, tuyệt đối KHÔNG xoá hoặc sửa đổi dữ liệu)
-- Tiêu chí HẸP (Chống báo nhầm tài khoản thật):
--   - CHỈ nhắm đúng tài khoản có email LIKE '%@langua.local' hoặc 6 UUID seed cũ:
--     00000000-0000-0000-0000-000000000001 -> 00000000-0000-0000-0000-000000000006
--   - BỎ các mẫu phỏng đoán nguy hiểm (@example.com, test_%, dummy_%, full_name).
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
  v_real_users_count INTEGER := 0;
  r RECORD;
BEGIN
  RAISE NOTICE '======================================================================';
  RAISE NOTICE '🔍 BẮT ĐẦU KIỂM KÊ DỮ LIỆU USER ẢO (@langua.local) TRÊN HỆ THỐNG';
  RAISE NOTICE '======================================================================';

  -- 1. Đếm người dùng ảo theo tiêu chí hẹp an toàn
  SELECT COUNT(*) INTO v_fake_users_count
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

  SELECT COUNT(*) INTO v_real_users_count
  FROM auth.users
  WHERE NOT (
    email ILIKE '%@langua.local'
    OR id IN (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000004',
      '00000000-0000-0000-0000-000000000005',
      '00000000-0000-0000-0000-000000000006'
    )
  );

  -- 2. Đếm profiles ảo
  SELECT COUNT(*) INTO v_fake_profiles_count
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  WHERE u.email ILIKE '%@langua.local'
     OR u.id IN (
       '00000000-0000-0000-0000-000000000001',
       '00000000-0000-0000-0000-000000000002',
       '00000000-0000-0000-0000-000000000003',
       '00000000-0000-0000-0000-000000000004',
       '00000000-0000-0000-0000-000000000005',
       '00000000-0000-0000-0000-000000000006'
     );

  -- 3. Đếm dữ liệu điểm danh ảo
  SELECT COUNT(*) INTO v_fake_checkins_count
  FROM public.daily_checkins c
  JOIN auth.users u ON c.user_id = u.id
  WHERE u.email ILIKE '%@langua.local'
     OR u.id IN (
       '00000000-0000-0000-0000-000000000001',
       '00000000-0000-0000-0000-000000000002',
       '00000000-0000-0000-0000-000000000003',
       '00000000-0000-0000-0000-000000000004',
       '00000000-0000-0000-0000-000000000005',
       '00000000-0000-0000-0000-000000000006'
     );

  -- 4. Đếm sự kiện XP ảo
  SELECT COUNT(*) INTO v_fake_xp_events_count
  FROM public.xp_events x
  JOIN auth.users u ON x.user_id = u.id
  WHERE u.email ILIKE '%@langua.local'
     OR u.id IN (
       '00000000-0000-0000-0000-000000000001',
       '00000000-0000-0000-0000-000000000002',
       '00000000-0000-0000-0000-000000000003',
       '00000000-0000-0000-0000-000000000004',
       '00000000-0000-0000-0000-000000000005',
       '00000000-0000-0000-0000-000000000006'
     );

  -- 5. Đếm thông báo ảo
  SELECT COUNT(*) INTO v_fake_notifs_count
  FROM public.notifications n
  JOIN auth.users u ON n.user_id = u.id
  WHERE u.email ILIKE '%@langua.local'
     OR u.id IN (
       '00000000-0000-0000-0000-000000000001',
       '00000000-0000-0000-0000-000000000002',
       '00000000-0000-0000-0000-000000000003',
       '00000000-0000-0000-0000-000000000004',
       '00000000-0000-0000-0000-000000000005',
       '00000000-0000-0000-0000-000000000006'
     );

  -- 6. Đếm tiến độ từ vựng ảo
  SELECT COUNT(*) INTO v_fake_progress_count
  FROM public.user_word_progress w
  JOIN auth.users u ON w.user_id = u.id
  WHERE u.email ILIKE '%@langua.local'
     OR u.id IN (
       '00000000-0000-0000-0000-000000000001',
       '00000000-0000-0000-0000-000000000002',
       '00000000-0000-0000-0000-000000000003',
       '00000000-0000-0000-0000-000000000004',
       '00000000-0000-0000-0000-000000000005',
       '00000000-0000-0000-0000-000000000006'
     );

  -- 7. Đếm bài thi ảo
  SELECT COUNT(*) INTO v_fake_attempts_count
  FROM public.exam_attempts a
  JOIN auth.users u ON a.user_id = u.id
  WHERE u.email ILIKE '%@langua.local'
     OR u.id IN (
       '00000000-0000-0000-0000-000000000001',
       '00000000-0000-0000-0000-000000000002',
       '00000000-0000-0000-0000-000000000003',
       '00000000-0000-0000-0000-000000000004',
       '00000000-0000-0000-0000-000000000005',
       '00000000-0000-0000-0000-000000000006'
     );

  -- In kết quả
  RAISE NOTICE '📊 KẾT QUẢ KIỂM KÊ:';
  RAISE NOTICE ' - Số tài khoản người dùng THẬT: %', v_real_users_count;
  RAISE NOTICE ' - Số tài khoản người dùng ẢO phát hiện: %', v_fake_users_count;
  RAISE NOTICE ' - Số Hồ sơ (profiles) ảo: %', v_fake_profiles_count;
  RAISE NOTICE ' - Số bản ghi điểm danh (daily_checkins) ảo: %', v_fake_checkins_count;
  RAISE NOTICE ' - Số sự kiện XP (xp_events) ảo: %', v_fake_xp_events_count;
  RAISE NOTICE ' - Số thông báo (notifications) ảo: %', v_fake_notifs_count;
  RAISE NOTICE ' - Số bản ghi tiến độ từ vựng (user_word_progress) ảo: %', v_fake_progress_count;
  RAISE NOTICE ' - Số lượt thi (exam_attempts) ảo: %', v_fake_attempts_count;
  RAISE NOTICE '======================================================================';
END;
$$;

-- Danh sách chi tiết các tài khoản ảo phát hiện
SELECT 
  u.id, 
  u.email, 
  p.full_name, 
  p.avatar_text, 
  u.created_at,
  'TÀI KHOẢN ẢO' AS audit_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email ILIKE '%@langua.local'
   OR u.id IN (
     '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000004',
     '00000000-0000-0000-0000-000000000005',
     '00000000-0000-0000-0000-000000000006'
   )
ORDER BY u.created_at ASC;
