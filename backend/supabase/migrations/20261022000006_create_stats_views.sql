-- Migration 6: Các View và Hàm Thống kê (Hôm nay & Tổng kết tuần)

-- 1. View Thống kê rèn luyện hôm nay của người dùng
-- Khớp với component TodayStats.vue (thời gian học, từ mới, bài hoàn thành, XP hôm nay)
CREATE OR REPLACE VIEW public.daily_user_stats AS
SELECT
  p.id AS user_id,
  CURRENT_DATE AS stat_date,
  
  -- Thời gian học hôm nay (tính bằng phút từ các lượt làm bài)
  COALESCE(ROUND(SUM(ea.duration_seconds) / 60.0), 0)::INTEGER AS learning_time_minutes,
  
  -- Số từ mới thêm vào tiến trình hôm nay
  (
    SELECT COUNT(id)::INTEGER 
    FROM public.user_word_progress 
    WHERE user_id = p.id AND created_at >= CURRENT_DATE
  ) AS new_words_learned,
  
  -- Số bài thi / bài luyện hoàn thành hôm nay
  COUNT(ea.id)::INTEGER AS completed_lessons,
  
  -- Tổng XP nhận được hôm nay
  (
    SELECT COALESCE(SUM(xp_amount), 0)::INTEGER 
    FROM public.xp_events 
    WHERE user_id = p.id AND created_at >= CURRENT_DATE
  ) AS xp_gained_today

FROM public.profiles p
LEFT JOIN public.exam_attempts ea ON p.id = ea.user_id AND ea.completed_at >= CURRENT_DATE
GROUP BY p.id;

-- 2. View Tổng kết tuần của người dùng
-- Khớp với component WeeklyStory.vue (tổng thời gian học tuần, chuỗi streak, từ đã học, bài hoàn thành)
CREATE OR REPLACE VIEW public.weekly_user_summary AS
SELECT
  p.id AS user_id,
  DATE_TRUNC('week', NOW())::DATE AS week_start,
  
  -- Chuỗi streak hiện tại
  public.get_user_streak(p.id) AS current_streak_days,
  
  -- Tổng thời gian rèn luyện trong tuần (phút)
  COALESCE(ROUND(SUM(ea.duration_seconds) / 60.0), 0)::INTEGER AS total_weekly_minutes,
  
  -- Tổng số bài thi hoàn thành trong tuần
  COUNT(ea.id)::INTEGER AS completed_tests_count,
  
  -- Số từ vựng mới tiếp nạp trong tuần
  (
    SELECT COUNT(id)::INTEGER
    FROM public.user_word_progress
    WHERE user_id = p.id AND created_at >= DATE_TRUNC('week', NOW())
  ) AS weekly_words_learned,
  
  -- Tổng XP kiếm được trong tuần
  (
    SELECT COALESCE(SUM(xp_amount), 0)::INTEGER
    FROM public.xp_events
    WHERE user_id = p.id AND created_at >= DATE_TRUNC('week', NOW())
  ) AS weekly_xp

FROM public.profiles p
LEFT JOIN public.exam_attempts ea ON p.id = ea.user_id AND ea.completed_at >= DATE_TRUNC('week', NOW())
GROUP BY p.id;

-- 3. Hàm RPC Lấy thống kê của người dùng hiện tại một cách tiện lợi
CREATE OR REPLACE FUNCTION public.get_my_today_stats()
RETURNS TABLE (
  learning_time_minutes INTEGER,
  new_words_learned INTEGER,
  completed_lessons INTEGER,
  xp_gained_today INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.learning_time_minutes,
    d.new_words_learned,
    d.completed_lessons,
    d.xp_gained_today
  FROM public.daily_user_stats d
  WHERE d.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
