// Dữ liệu Mock dự phòng cho Trang chủ (dùng khi NUXT_PUBLIC_USE_MOCK=true hoặc offline)

import type {
  UserSummary,
  NotificationItem,
  DailyTask,
  ExamOption,
  TargetBandRoadmap,
  VocabLevelItem,
  ReviewVocabData,
  DailyStatsData,
  WeeklyStoryGroup,
  LeaderboardUserItem,
} from '~/composables/useHomeData'

export const mockUserSummary: UserSummary = {
  id: 'usr_007',
  name: 'Minh Hoàng',
  avatarText: 'MH',
  xp: 2840,
  streakDays: 14,
  checkedInToday: false,
}

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Duy trì chuỗi học tập!',
    content: 'Chỉ còn 3 tiếng để hoàn thành 1 bài luyện và giữ chuỗi ngày thứ 15.',
    timeAgo: '15 phút trước',
    isRead: false,
    category: 'streak',
  },
  {
    id: 'notif_2',
    title: 'Đã có 25 từ vựng đến hạn ôn',
    content: 'Thuật toán lặp lại ngắt quãng gợi ý ôn tập ngay để nhớ sâu hơn.',
    timeAgo: '1 giờ trước',
    isRead: false,
    category: 'lesson',
  },
  {
    id: 'notif_3',
    title: 'Cập nhật đề thi IELTS Listening Section 3',
    content: 'Đã bổ sung dạng bài Multiple Choice kèm giải thích chi tiết đáp án.',
    timeAgo: 'Hôm qua',
    isRead: true,
    category: 'system',
  },
  {
    id: 'notif_4',
    title: 'Thăng hạng bảng tuần!',
    content: 'Bạn đã lọt vào Top 5 Bảng Vàng tuần này với hơn 450 XP.',
    timeAgo: '2 ngày trước',
    isRead: true,
    category: 'award',
  },
]

export const mockTodayTasks: DailyTask[] = [
  {
    id: 'task_1',
    title: 'Luyện nghe: Bản tin công nghệ BBC 6-Minute',
    category: 'Nghe hiểu',
    estMinutes: 8,
    xpReward: 35,
    tone: 'accent',
    path: '/luyen-thi/ielts/listening',
  },
  {
    id: 'task_2',
    title: 'Học 15 từ vựng: Academic Collocations Topic Environment',
    category: 'Từ vựng',
    estMinutes: 6,
    xpReward: 25,
    tone: 'mark',
    path: '/tu-vung',
  },
  {
    id: 'task_3',
    title: 'Ngữ pháp thực chiến: Mệnh đề quan hệ rút gọn',
    category: 'Ngữ pháp',
    estMinutes: 10,
    xpReward: 40,
    tone: 'warn',
    path: '/ngu-phap',
  },
  {
    id: 'task_4',
    title: 'Gõ câu phản xạ: 10 câu mô tả xu hướng biểu đồ IELTS Task 1',
    category: 'Gõ câu',
    estMinutes: 7,
    xpReward: 30,
    tone: 'ok',
    path: '/go-cau',
  },
]

export const mockExamOptions: ExamOption[] = [
  {
    id: 'ielts',
    name: 'IELTS Academic',
    fullName: 'International English Language Testing System',
    isActive: true,
    statusBadge: 'Đang mở luyện',
    targetFormat: '4 Kỹ năng (Band 0-9.0)',
    path: '/luyen-thi/ielts',
  },
  {
    id: 'toeic',
    name: 'TOEIC LR/SW',
    fullName: 'Test of English for International Communication',
    isActive: false,
    statusBadge: 'Sắp ra mắt',
    targetFormat: 'Nghe - Đọc (Tối đa 990)',
    path: '#',
  },
  {
    id: 'toefl',
    name: 'TOEFL iBT',
    fullName: 'Test of English as a Foreign Language',
    isActive: false,
    statusBadge: 'Sắp ra mắt',
    targetFormat: 'Khảo thí máy tính (0-120)',
    path: '#',
  },
  {
    id: 'hsk',
    name: 'HSK 1-6 / HSKK',
    fullName: 'Kỳ thi kiểm tra năng lực Hán ngữ',
    isActive: false,
    statusBadge: 'Sắp ra mắt',
    targetFormat: 'Cấp độ HSK 3.0',
    path: '#',
  },
  {
    id: 'jlpt',
    name: 'JLPT N5-N1',
    fullName: 'Kỳ thi năng lực Nhật ngữ',
    isActive: false,
    statusBadge: 'Sắp ra mắt',
    targetFormat: 'Từ vựng, Nghe, Đọc',
    path: '#',
  },
]

export const mockTargetBandRoadmap: TargetBandRoadmap = {
  examName: 'IELTS Academic',
  currentBand: 5.5,
  targetBand: 7.0,
  progressPct: 62,
  milestones: [
    { band: 5.0, label: 'Nền tảng căn bản', isPassed: true, isCurrent: false },
    { band: 5.5, label: 'Band hiện tại', isPassed: true, isCurrent: true },
    { band: 6.0, label: 'Bứt phá từ vựng & Collocation', isPassed: false, isCurrent: false },
    { band: 6.5, label: 'Làm chủ đề thi & Tốc độ', isPassed: false, isCurrent: false },
    { band: 7.0, label: 'Mục tiêu hoàn thành', isPassed: false, isCurrent: false },
  ],
}

export const mockVocabLevels: VocabLevelItem[] = [
  { level: 1, code: 'L1', title: 'Cốt lõi A1', learned: 500, total: 500, colorTone: 'ok' },
  { level: 2, code: 'L2', title: 'Sơ cấp A2', learned: 680, total: 800, colorTone: 'ok' },
  { level: 3, code: 'L3', title: 'Trung cấp B1', learned: 920, total: 1200, colorTone: 'warn' },
  { level: 4, code: 'L4', title: 'Trung cao B2', learned: 640, total: 1500, colorTone: 'accent' },
  { level: 5, code: 'L5', title: 'Cao cấp C1', learned: 280, total: 1800, colorTone: 'mark' },
  { level: 6, code: 'L6', title: 'Tinh thông C2', learned: 75, total: 2000, colorTone: 'surface' },
  { level: 7, code: 'L7', title: 'Chuyên ngành & Thành ngữ', learned: 40, total: 1200, colorTone: 'surface' },
]

export const mockReviewData: ReviewVocabData = {
  dueTodayCount: 28,
  criticalCount: 7,
  streakReviewsDays: 9,
  message: 'Thuật toán SRS Spaced Repetition đề xuất ôn tập ngay để tránh rơi vào đường cong quên lãng.',
}

export const mockTodayStats: DailyStatsData = {
  learningTimeMinutes: 38,
  newWordsLearned: 14,
  completedLessons: 3,
  xpGainedToday: 115,
}

export const mockWeeklyStories: WeeklyStoryGroup[] = [
  {
    id: 'story_week_summary',
    title: 'Tuần học rực lửa',
    shortLabel: 'Tổng kết tuần',
    tone: 'warn',
    isViewed: false,
    slides: [
      {
        title: 'Chuỗi học liên tiếp',
        highlight: '14 ngày',
        description: 'Bạn đã không bỏ lỡ ngày nào trong 2 tuần vừa qua. Đỉnh cao kiên trì!',
        statBadge: 'Top 8% người học chăm chỉ',
        iconType: 'flame',
      },
      {
        title: 'Tổng thời gian rèn luyện',
        highlight: '4 giờ 15 phút',
        description: 'Tăng 22% so với tuần trước. Bạn tập trung cao nhất vào buổi sáng.',
        statBadge: '+45 phút so với mục tiêu',
        iconType: 'clock',
      },
      {
        title: 'Từ vựng mới tiếp nạp',
        highlight: '92 từ',
        description: 'Đã hoàn thành ôn tập đúng hạn 88% số từ theo thuật toán lặp lại ngắt quãng.',
        statBadge: 'Tỷ lệ ghi nhớ: 91%',
        iconType: 'book',
      },
      {
        title: 'Kỹ năng tiến bộ vượt bậc',
        highlight: 'Listening +0.5 Band',
        description: 'Tốc độ làm bài Listening Part 3 cải thiện đáng kể, trả lời đúng 8/10 câu thử.',
        statBadge: 'Tiến độ lộ trình: 62%',
        iconType: 'award',
      },
    ],
  },
  {
    id: 'story_vocab_master',
    title: 'Bậc thầy từ vựng',
    shortLabel: 'Chiến tích từ',
    tone: 'ok',
    isViewed: false,
    slides: [
      {
        title: 'Bộ từ hoàn tất',
        highlight: 'Cấp độ B1 (920 từ)',
        description: 'Bạn đã đạt mốc 76% toàn bộ từ vựng trung cấp B1. Sắp mở khóa cấp độ B2!',
        statBadge: 'Đạt danh hiệu "Từ vựng cừ khôi"',
        iconType: 'zap',
      },
    ],
  },
  {
    id: 'story_xp_champion',
    title: 'Đua top Bảng vàng',
    shortLabel: 'Xếp hạng tuần',
    tone: 'accent',
    isViewed: false,
    slides: [
      {
        title: 'Vị trí hiện tại',
        highlight: 'Hạng #4 tuần này',
        description: 'Với 2,840 XP, bạn chỉ cách Top 3 đúng 140 XP nữa. Cố lên!',
        statBadge: 'League: Kim Cương',
        iconType: 'award',
      },
    ],
  },
]

export const mockLeaderboardUsers: LeaderboardUserItem[] = [
  { rank: 1, id: 'u_1', name: 'Trần Bảo Anh', avatarChar: 'BA', xp: 3420, isCurrentUser: false },
  { rank: 2, id: 'u_2', name: 'Nguyễn Đăng Khoa', avatarChar: 'DK', xp: 3190, isCurrentUser: false },
  { rank: 3, id: 'u_3', name: 'Lê Thảo My', avatarChar: 'TM', xp: 2980, isCurrentUser: false },
  { rank: 4, id: 'usr_007', name: 'Minh Hoàng (Bạn)', avatarChar: 'MH', xp: 2840, isCurrentUser: true },
  { rank: 5, id: 'u_5', name: 'Phạm Đức Huy', avatarChar: 'DH', xp: 2610, isCurrentUser: false },
  { rank: 6, id: 'u_6', name: 'Vũ Thuỳ Linh', avatarChar: 'TL', xp: 2470, isCurrentUser: false },
  { rank: 7, id: 'u_7', name: 'Hoàng Quốc Việt', avatarChar: 'QV', xp: 2310, isCurrentUser: false },
  { rank: 8, id: 'u_8', name: 'Đỗ Quỳnh Chi', avatarChar: 'QC', xp: 2150, isCurrentUser: false },
  { rank: 9, id: 'u_9', name: 'Bùi Gia Khang', avatarChar: 'GK', xp: 1980, isCurrentUser: false },
  { rank: 10, id: 'u_10', name: 'Ngô Thanh Vân', avatarChar: 'TV', xp: 1840, isCurrentUser: false },
]
