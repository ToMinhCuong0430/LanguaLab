import type { Database } from '~/types/database.types'
import {
  mockUserSummary,
  mockNotifications,
  mockTodayTasks,
  mockExamOptions,
  mockTargetBandRoadmap,
  mockVocabLevels,
  mockReviewData,
  mockTodayStats,
  mockWeeklyStories,
  mockLeaderboardUsers,
} from '~/mocks/home.mock'

export interface UserSummary {
  id: string
  name: string
  avatarText: string
  xp: number
  streakDays: number
  checkedInToday: boolean
}

export interface NotificationItem {
  id: string
  title: string
  content: string
  timeAgo: string
  isRead: boolean
  category: 'system' | 'streak' | 'lesson' | 'award'
}

export interface DailyTask {
  id: string
  title: string
  category: 'Nghe hiểu' | 'Từ vựng' | 'Ngữ pháp' | 'Gõ câu'
  estMinutes: number
  xpReward: number
  tone: 'accent' | 'warn' | 'ok' | 'mark'
  path: string
}

export interface ExamOption {
  id: string
  name: string
  fullName: string
  isActive: boolean
  statusBadge: string
  targetFormat: string
  path: string
}

export interface TargetBandRoadmap {
  examName: string
  currentBand: number
  targetBand: number
  progressPct: number
  milestones: {
    band: number
    label: string
    isPassed: boolean
    isCurrent: boolean
  }[]
}

export interface VocabLevelItem {
  level: number
  code: string
  title: string
  learned: number
  total: number
  colorTone: 'surface' | 'ok' | 'warn' | 'accent' | 'mark'
}

export interface ReviewVocabData {
  dueTodayCount: number
  criticalCount: number
  streakReviewsDays: number
  message: string
}

export interface DailyStatsData {
  learningTimeMinutes: number
  newWordsLearned: number
  completedLessons: number
  xpGainedToday: number
}

export interface StorySlide {
  title: string
  highlight: string
  description: string
  statBadge?: string
  iconType: 'flame' | 'clock' | 'book' | 'award' | 'zap'
}

export interface WeeklyStoryGroup {
  id: string
  title: string
  shortLabel: string
  tone: 'accent' | 'warn' | 'ok' | 'mark'
  isViewed: boolean
  slides: StorySlide[]
}

export interface LeaderboardUserItem {
  rank: number
  id: string
  name: string
  avatarChar: string
  xp: number
  isCurrentUser: boolean
}

export const useHomeData = () => {
  const client = useSupabaseClient<Database>()
  const authUser = useSupabaseUser()
  const config = useRuntimeConfig()

  // Kiểm tra cờ dùng mock fallback
  const isUseMock = computed(() => {
    return (
      config.public.useMock === true ||
      config.public.useMock === 'true' ||
      process.env.NUXT_PUBLIC_USE_MOCK === 'true'
    )
  })

  // Trạng thái Loading và Error
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)

  // Reactive state
  const user = ref<UserSummary>(mockUserSummary)
  const notifications = ref<NotificationItem[]>(mockNotifications)
  const todayTasks = ref<DailyTask[]>(mockTodayTasks)
  const examOptions = ref<ExamOption[]>(mockExamOptions)
  const targetBandRoadmap = ref<TargetBandRoadmap>(mockTargetBandRoadmap)
  const vocabLevels = ref<VocabLevelItem[]>(mockVocabLevels)
  const reviewData = ref<ReviewVocabData>(mockReviewData)
  const todayStats = ref<DailyStatsData>(mockTodayStats)
  const weeklyStories = ref<WeeklyStoryGroup[]>(mockWeeklyStories)
  const leaderboardUsers = ref<LeaderboardUserItem[]>(mockLeaderboardUsers)

  // Hàm chuyển đổi timestamp thành timeAgo tiếng Việt
  const formatTimeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes < 60) return `${Math.max(1, minutes)} phút trước`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} giờ trước`
    const days = Math.floor(hours / 24)
    return `${days} ngày trước`
  }

  // Tải dữ liệu thật từ Supabase
  const fetchHomeData = async () => {
    if (isUseMock.value) return

    isLoading.value = true
    loadError.value = null

    try {
      // 1. Tải Profile & Điểm danh hôm nay
      if (authUser.value?.sub) {
        const uid = authUser.value.sub
        const todayStr = new Date().toISOString().split('T')[0]

        // Profile & XP & Thống kê tổng hợp đa kỹ năng
        const [profileRes, checkinRes, xpRes, notifRes, statsRes, dueRes, weeklyRes] = await Promise.all([
          client.from('profiles').select('*').eq('id', uid).maybeSingle(),
          client.from('daily_checkins').select('id').eq('user_id', uid).eq('checkin_date', todayStr).maybeSingle(),
          client.from('user_xp_totals').select('total_xp').eq('user_id', uid).maybeSingle(),
          client.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(10),
          client.from('daily_user_stats').select('*').eq('user_id', uid).maybeSingle(),
          client.from('words_due_today').select('word_id, is_critical').eq('user_id', uid),
          client.from('weekly_user_summary').select('*').eq('user_id', uid).maybeSingle(),
        ])

        if (profileRes.data) {
          const p = profileRes.data
          user.value = {
            id: p.id,
            name: p.full_name || 'Học viên',
            avatarText: p.avatar_text || 'LA',
            xp: xpRes.data?.total_xp || 0,
            streakDays: 1, // Sẽ tính hoặc lấy từ checkins
            checkedInToday: !!checkinRes.data,
          }

          if (p.target_band) {
            targetBandRoadmap.value.currentBand = Number(p.current_band) || 5.5
            targetBandRoadmap.value.targetBand = Number(p.target_band) || 7.0
          }
        }

        // Tính streak thật qua RPC get_user_streak
        try {
          const { data: streak } = await client.rpc('get_user_streak', { p_user_id: uid })
          if (streak !== null && streak !== undefined) {
            user.value.streakDays = Number(streak)
          }
        } catch (_) {}

        // Danh sách thông báo thật
        if (notifRes.data && notifRes.data.length > 0) {
          notifications.value = notifRes.data.map((n) => ({
            id: n.id,
            title: n.title,
            content: n.content,
            timeAgo: formatTimeAgo(n.created_at),
            isRead: n.is_read,
            category: n.category as any,
          }))
        }

        // Thống kê hôm nay thật
        if (statsRes.data) {
          todayStats.value = {
            learningTimeMinutes: statsRes.data.learning_time_minutes || 0,
            newWordsLearned: statsRes.data.new_words_learned || 0,
            completedLessons: statsRes.data.completed_lessons || 0,
            xpGainedToday: statsRes.data.xp_gained_today || 0,
          }
        }

        // Tổng kết tuần tổng hợp đa kỹ năng thật
        if (weeklyRes.data) {
          const w = weeklyRes.data
          weeklyStories.value = [
            {
              id: 'week-streak',
              title: 'Chuỗi Rèn Luyện Tuần',
              shortLabel: 'Streak tuần',
              badgeTone: 'warn',
              slides: [
                {
                  title: 'Duy trì bền bỉ',
                  highlight: `${w.current_streak_days || user.value.streakDays} ngày`,
                  description: 'Thói quen học tập liên tục giúp củng cố phản xạ tự nhiên.',
                  iconType: 'flame',
                },
              ],
            },
            {
              id: 'week-time',
              title: 'Thời Gian Rèn Luyện',
              shortLabel: 'Thời gian',
              badgeTone: 'accent',
              slides: [
                {
                  title: 'Tổng phút rèn luyện',
                  highlight: `${w.total_weekly_minutes || 0} phút`,
                  description: 'Tính gộp từ thi thử, gõ câu, bài tập ngữ pháp và luyện nghe.',
                  iconType: 'clock',
                },
              ],
            },
            {
              id: 'week-xp',
              title: 'Tổng Điểm Kinh Nghiệm Tuần',
              shortLabel: 'Kinh nghiệm',
              badgeTone: 'ok',
              slides: [
                {
                  title: 'XP tích lũy tuần',
                  highlight: `+${w.weekly_xp || 0} XP`,
                  description: 'Số điểm đạt được từ các hoạt động học tập trong tuần này.',
                  iconType: 'zap',
                },
              ],
            },
          ]
        }
      }

      // 2. Tải Kỳ thi từ bảng exams
      const { data: examsData } = await client.from('exams').select('*').order('sort_order', { ascending: true })
      if (examsData && examsData.length > 0) {
        examOptions.value = examsData.map((e) => ({
          id: e.id,
          name: e.name,
          fullName: e.full_name,
          isActive: e.is_active,
          statusBadge: e.status_badge,
          targetFormat: e.target_format || '',
          path: e.id === 'ielts' ? '/luyen-thi/ielts' : '#',
        }))
      }

      // 3. Tải 7 cấp độ từ vựng từ vocab_levels
      const { data: levelsData } = await client.from('vocab_levels').select('*').order('level_number', { ascending: true })
      if (levelsData && levelsData.length > 0) {
        vocabLevels.value = levelsData.map((l) => ({
          level: l.level_number,
          code: l.code,
          title: l.title,
          learned: Math.round(l.target_word_count * 0.4), // Mặc định hoặc join user progress
          total: l.target_word_count,
          colorTone: (l.color_tone as any) || 'ok',
        }))
      }

      // 4. Tải Bảng xếp hạng tuần từ view weekly_leaderboard
      const { data: boardData } = await client.from('weekly_leaderboard').select('*').limit(10)
      if (boardData && boardData.length > 0) {
        leaderboardUsers.value = boardData.map((b) => ({
          rank: b.rank,
          id: b.user_id,
          name: b.full_name,
          avatarChar: b.avatar_text || 'LA',
          xp: b.weekly_xp,
          isCurrentUser: authUser.value?.sub === b.user_id,
        }))
      }
    } catch (err: any) {
      console.warn('Lỗi khi tải dữ liệu từ Supabase, sử dụng mock fallback:', err.message)
      loadError.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  // Tự động gọi fetch khi mount
  onMounted(() => {
    fetchHomeData()
  })

  // Đếm thông báo chưa đọc
  const unreadNotificationsCount = computed(() => {
    return notifications.value.filter((n) => !n.isRead).length
  })

  // Lời chào theo buổi
  const greetingInfo = computed(() => {
    const hour = new Date().getHours()
    let timeGreeting = 'Chào buổi sáng'
    let quote = 'Một ngày mới tràn đầy năng lượng để làm chủ thêm từ vựng mới!'

    if (hour >= 12 && hour < 18) {
      timeGreeting = 'Chào buổi chiều'
      quote = 'Dành 15 phút rèn phản xạ gõ câu để tái tạo năng lượng nhé!'
    } else if (hour >= 18 || hour < 5) {
      timeGreeting = 'Chào buổi tối'
      quote = 'Ôn tập nhẹ nhàng trước khi kết thúc ngày để kiến thức lưu giữ bền lâu.'
    }

    return {
      timeGreeting,
      quote,
      fullNameGreeting: `${timeGreeting}, ${user.value.name}!`,
    }
  })

  // Hành động: Điểm danh hôm nay (ghi vào Supabase)
  const toggleCheckIn = async () => {
    if (user.value.checkedInToday) return

    // Cập nhật optimistic UI ngay lập tức
    user.value.checkedInToday = true
    user.value.streakDays += 1
    user.value.xp += 20
    todayStats.value.xpGainedToday += 20

    if (!isUseMock.value && authUser.value?.sub) {
      try {
        // Gọi hàm RPC claim_daily_checkin an toàn (server tự cộng XP và tính streak)
        const { data, error } = await client.rpc('claim_daily_checkin')
        if (error) {
          console.warn('Lỗi RPC claim_daily_checkin:', error.message)
        } else if (data && typeof data === 'object') {
          const res = data as Record<string, any>
          if (res.total_xp) user.value.xp = res.total_xp
          if (res.streak_days) user.value.streakDays = res.streak_days
        }
      } catch (e) {
        console.warn('Ghi nhận điểm danh offline:', e)
      }
    }
  }

  // Hành động: Đánh dấu đã đọc thông báo (ghi vào Supabase)
  const markNotificationAsRead = async (id: string) => {
    const item = notifications.value.find((n) => n.id === id)
    if (item) {
      item.isRead = true
    }

    if (!isUseMock.value && authUser.value?.sub) {
      try {
        await client.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', authUser.value.sub)
      } catch (_) {}
    }
  }

  const markAllNotificationsAsRead = async () => {
    notifications.value.forEach((n) => {
      n.isRead = true
    })

    if (!isUseMock.value && authUser.value?.sub) {
      try {
        await client.from('notifications').update({ is_read: true }).eq('user_id', authUser.value.sub)
      } catch (_) {}
    }
  }

  return {
    user,
    notifications,
    unreadNotificationsCount,
    greetingInfo,
    todayTasks,
    examOptions,
    targetBandRoadmap,
    vocabLevels,
    reviewData,
    todayStats,
    weeklyStories,
    leaderboardUsers,
    isLoading,
    loadError,
    fetchHomeData,
    toggleCheckIn,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  }
}
