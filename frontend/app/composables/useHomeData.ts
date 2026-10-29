import type { Database } from '~/types/database.types'

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
  badgeTone?: 'accent' | 'warn' | 'ok' | 'mark'
  tone?: 'accent' | 'warn' | 'ok' | 'mark'
  isViewed?: boolean
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

// Nhiệm vụ gợi ý mặc định theo lộ trình hệ thống khi user mới tham gia
const DEFAULT_TASKS: DailyTask[] = [
  {
    id: 'task-typing-intro',
    title: 'Khởi động 5 phút gõ câu chủ đề Chào hỏi',
    category: 'Gõ câu',
    estMinutes: 5,
    xpReward: 30,
    tone: 'accent',
    path: '/go-cau',
  },
  {
    id: 'task-vocab-core',
    title: 'Học 10 từ vựng Cốt lõi A1',
    category: 'Từ vựng',
    estMinutes: 8,
    xpReward: 25,
    tone: 'ok',
    path: '/tu-vung',
  },
  {
    id: 'task-grammar-tenses',
    title: 'Ôn tập ngữ pháp thì Hiện tại đơn',
    category: 'Ngữ pháp',
    estMinutes: 7,
    xpReward: 40,
    tone: 'warn',
    path: '/ngu-phap',
  },
]

export const useHomeData = () => {
  const client = useSupabaseClient<Database>()
  const authUser = useSupabaseUser()

  // Trạng thái Loading và Error
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)

  // Reactive state với giá trị mặc định chuẩn xác (không dùng user ảo)
  const user = ref<UserSummary>({
    id: '',
    name: 'Bạn',
    avatarText: 'LL',
    xp: 0,
    streakDays: 0,
    checkedInToday: false,
  })

  const notifications = ref<NotificationItem[]>([])
  const todayTasks = ref<DailyTask[]>(DEFAULT_TASKS)
  const examOptions = ref<ExamOption[]>([])
  const targetBandRoadmap = ref<TargetBandRoadmap>({
    examName: 'IELTS Academic',
    currentBand: 5.0,
    targetBand: 6.5,
    progressPct: 0,
    milestones: [
      { band: 5.0, label: 'Khởi điểm', isPassed: true, isCurrent: true },
      { band: 5.5, label: 'Sơ trung', isPassed: false, isCurrent: false },
      { band: 6.0, label: 'Trung cấp', isPassed: false, isCurrent: false },
      { band: 6.5, label: 'Mục tiêu', isPassed: false, isCurrent: false },
      { band: 7.0, label: 'Nâng cao', isPassed: false, isCurrent: false },
    ],
  })
  const vocabLevels = ref<VocabLevelItem[]>([])
  const reviewData = ref<ReviewVocabData>({
    dueTodayCount: 0,
    criticalCount: 0,
    streakReviewsDays: 0,
    message: 'Không có từ vựng nào cần ôn tập hôm nay.',
  })
  const todayStats = ref<DailyStatsData>({
    learningTimeMinutes: 0,
    newWordsLearned: 0,
    completedLessons: 0,
    xpGainedToday: 0,
  })
  const weeklyStories = ref<WeeklyStoryGroup[]>([])
  const leaderboardUsers = ref<LeaderboardUserItem[]>([])

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

  // Tải dữ liệu thật 100% từ Supabase
  const fetchHomeData = async () => {
    isLoading.value = true
    loadError.value = null

    try {
      // 1. Tải Kỳ thi từ bảng exams (Public data)
      const { data: examsData, error: examsErr } = await client
        .from('exams')
        .select('*')
        .order('sort_order', { ascending: true })

      if (examsErr) {
        console.warn('Lỗi tải exams:', examsErr.message)
      } else if (examsData && examsData.length > 0) {
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

      // 2. Tải 7 cấp độ từ vựng từ vocab_levels (Public data)
      const { data: levelsData, error: levelsErr } = await client
        .from('vocab_levels')
        .select('*')
        .order('level_number', { ascending: true })

      if (levelsErr) {
        console.warn('Lỗi tải vocab_levels:', levelsErr.message)
      } else if (levelsData && levelsData.length > 0) {
        vocabLevels.value = levelsData.map((l) => ({
          level: l.level_number,
          code: l.code,
          title: l.title,
          learned: 0,
          total: l.target_word_count,
          colorTone: (l.color_tone as any) || 'ok',
        }))
      }

      // 3. Tải Bảng xếp hạng tuần từ view weekly_leaderboard (Public data)
      const { data: boardData, error: boardErr } = await client
        .from('weekly_leaderboard')
        .select('*')
        .limit(10)

      if (boardErr) {
        console.warn('Lỗi tải weekly_leaderboard:', boardErr.message)
      } else if (boardData && boardData.length > 0) {
        leaderboardUsers.value = boardData.map((b) => ({
          rank: b.rank,
          id: b.user_id,
          name: b.full_name || 'Học viên',
          avatarChar: b.avatar_text || 'LL',
          xp: b.weekly_xp || 0,
          isCurrentUser: authUser.value?.id === b.user_id,
        }))
      }

      // 4. Nếu người dùng đã đăng nhập: Tải Profile, điểm danh, tiến độ cá nhân
      if (authUser.value?.id) {
        const uid = authUser.value.id
        const todayStr = new Date().toISOString().split('T')[0]

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
            avatarText: p.avatar_text || 'LL',
            xp: xpRes.data?.total_xp || p.total_xp || 0,
            streakDays: p.streak_days || 0,
            checkedInToday: !!checkinRes.data,
          }

          if (p.target_band) {
            targetBandRoadmap.value.currentBand = Number(p.current_band) || 5.0
            targetBandRoadmap.value.targetBand = Number(p.target_band) || 6.5
            const curr = targetBandRoadmap.value.currentBand
            const tgt = targetBandRoadmap.value.targetBand
            targetBandRoadmap.value.progressPct = Math.min(100, Math.max(0, Math.round((curr / tgt) * 100)))
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

        // Từ cần ôn hôm nay
        if (dueRes.data) {
          const dueCount = dueRes.data.length
          const critCount = dueRes.data.filter((d: any) => d.is_critical).length
          reviewData.value = {
            dueTodayCount: dueCount,
            criticalCount: critCount,
            streakReviewsDays: user.value.streakDays,
            message: dueCount > 0
              ? `Bạn có ${dueCount} từ cần củng cố hôm nay.`
              : 'Tuyệt vời! Bạn đã hoàn thành toàn bộ từ ôn tập hôm nay.',
          }
        }

        // Tổng kết tuần thật
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
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu trang chủ từ Supabase:', err.message)
      loadError.value = 'Không thể tải dữ liệu trang chủ. Vui lòng thử lại.'
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

  // Hành động: Điểm danh hôm nay (ghi vào Supabase qua RPC claim_daily_checkin)
  const toggleCheckIn = async () => {
    if (user.value.checkedInToday || !authUser.value?.id) return

    // Optimistic update
    user.value.checkedInToday = true
    user.value.streakDays += 1
    user.value.xp += 20
    todayStats.value.xpGainedToday += 20

    try {
      const { data, error } = await client.rpc('claim_daily_checkin')
      if (error) {
        console.warn('Lỗi RPC claim_daily_checkin:', error.message)
      } else if (data && typeof data === 'object') {
        const res = data as Record<string, any>
        if (res.total_xp) user.value.xp = res.total_xp
        if (res.streak_days) user.value.streakDays = res.streak_days
      }
    } catch (e: any) {
      console.warn('Ghi nhận điểm danh thất bại:', e.message)
    }
  }

  // Hành động: Đánh dấu đã đọc thông báo
  const markNotificationAsRead = async (id: string) => {
    const item = notifications.value.find((n) => n.id === id)
    if (item) {
      item.isRead = true
    }

    if (authUser.value?.id) {
      try {
        await client.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', authUser.value.id)
      } catch (_) {}
    }
  }

  const markAllNotificationsAsRead = async () => {
    notifications.value.forEach((n) => {
      n.isRead = true
    })

    if (authUser.value?.id) {
      try {
        await client.from('notifications').update({ is_read: true }).eq('user_id', authUser.value.id)
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
