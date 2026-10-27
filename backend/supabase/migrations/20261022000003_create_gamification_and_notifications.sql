-- Migration 3: Gamification (Điểm danh, Chuỗi Streak, XP, Bảng xếp hạng tuần) & Thông báo

-- 1. Bảng Điểm danh hàng ngày (Daily Check-in)
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_checkin_per_day UNIQUE (user_id, checkin_date)
);

CREATE INDEX idx_checkins_user_date ON public.daily_checkins(user_id, checkin_date DESC);

-- 2. Bảng Sự kiện cộng XP (XP Events)
CREATE TABLE IF NOT EXISTS public.xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  xp_amount INTEGER NOT NULL CHECK (xp_amount > 0),
  source TEXT NOT NULL, -- 'daily_checkin', 'task_complete', 'vocab_review', 'exam_complete', 'streak_bonus'
  reference_id TEXT,    -- ID của bài học / bài thi liên quan nếu có
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_xp_events_user_created ON public.xp_events(user_id, created_at DESC);
CREATE INDEX idx_xp_events_created ON public.xp_events(created_at DESC);

-- 3. Bảng Thông báo (Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category notification_category NOT NULL DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

-- 4. Hàm tính chuỗi ngày học liên tục (Streak) của người dùng
CREATE OR REPLACE FUNCTION public.get_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_current_check DATE;
  v_today DATE := CURRENT_DATE;
  v_has_checkin BOOLEAN;
BEGIN
  -- Kiểm tra xem hôm nay hoặc hôm qua có điểm danh không
  SELECT EXISTS(
    SELECT 1 FROM public.daily_checkins 
    WHERE user_id = p_user_id AND checkin_date = v_today
  ) INTO v_has_checkin;

  IF v_has_checkin THEN
    v_current_check := v_today;
  ELSE
    -- Nếu hôm nay chưa điểm danh, kiểm tra xem hôm qua có không
    SELECT EXISTS(
      SELECT 1 FROM public.daily_checkins 
      WHERE user_id = p_user_id AND checkin_date = v_today - INTERVAL '1 day'
    ) INTO v_has_checkin;
    
    IF v_has_checkin THEN
      v_current_check := v_today - INTERVAL '1 day';
    ELSE
      RETURN 0;
    END IF;
  END IF;

  -- Đếm ngược từng ngày liên tục
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.daily_checkins 
      WHERE user_id = p_user_id AND checkin_date = v_current_check
    ) INTO v_has_checkin;

    IF v_has_checkin THEN
      v_streak := v_streak + 1;
      v_current_check := v_current_check - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 5. View tính tổng XP của từng người dùng
CREATE OR REPLACE VIEW public.user_xp_totals AS
SELECT
  p.id AS user_id,
  p.full_name,
  p.avatar_text,
  COALESCE(SUM(x.xp_amount), 0)::INTEGER AS total_xp
FROM public.profiles p
LEFT JOIN public.xp_events x ON p.id = x.user_id
GROUP BY p.id, p.full_name, p.avatar_text;

-- 6. View Bảng xếp hạng XP tuần (Tuần tính từ Thứ Hai 00:00:00)
-- Chỉ để lộ thông tin công khai: rank, user_id, full_name, avatar_text, weekly_xp
CREATE OR REPLACE VIEW public.weekly_leaderboard AS
WITH current_week_xp AS (
  SELECT
    p.id AS user_id,
    p.full_name,
    p.avatar_text,
    COALESCE(SUM(x.xp_amount), 0)::INTEGER AS weekly_xp
  FROM public.profiles p
  LEFT JOIN public.xp_events x ON p.id = x.user_id 
    AND x.created_at >= DATE_TRUNC('week', NOW())
  GROUP BY p.id, p.full_name, p.avatar_text
)
SELECT
  DENSE_RANK() OVER (ORDER BY weekly_xp DESC, user_id ASC)::INTEGER AS rank,
  user_id,
  full_name,
  avatar_text,
  weekly_xp
FROM current_week_xp
ORDER BY rank ASC;

-- 7. Hàm RPC Thực hiện điểm danh an toàn (Atomic Transaction)
CREATE OR REPLACE FUNCTION public.claim_daily_checkin()
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_today DATE := CURRENT_DATE;
  v_already_checked BOOLEAN;
  v_new_streak INTEGER;
  v_new_xp INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Yêu cầu đăng nhập để điểm danh';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.daily_checkins
    WHERE user_id = v_user_id AND checkin_date = v_today
  ) INTO v_already_checked;

  IF v_already_checked THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Bạn đã điểm danh hôm nay rồi!'
    );
  END IF;

  -- 1. Thêm dòng điểm danh
  INSERT INTO public.daily_checkins (user_id, checkin_date)
  VALUES (v_user_id, v_today);

  -- 2. Thưởng +20 XP
  INSERT INTO public.xp_events (user_id, xp_amount, source)
  VALUES (v_user_id, 20, 'daily_checkin');

  -- 3. Tính streak mới và tổng XP
  v_new_streak := public.get_user_streak(v_user_id);
  SELECT total_xp INTO v_new_xp FROM public.user_xp_totals WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'xp_gained', 20,
    'streak_days', v_new_streak,
    'total_xp', v_new_xp,
    'message', 'Điểm danh thành công! +20 XP'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
