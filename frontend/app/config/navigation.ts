import {
  Home,
  Keyboard,
  Play,
  BookOpen,
  Volume2,
  BookMarked,
  Search,
  Trophy,
  Lightbulb,
  type LucideIcon,
} from '@lucide/vue'

export interface NavItem {
  title: string
  shortTitle: string
  path: string
  description?: string
  badge?: string
  feature: string
  icon: LucideIcon
}

export const navigationItems: NavItem[] = [
  {
    title: 'Trang chủ',
    shortTitle: 'Trang chủ',
    path: '/',
    description: 'Tổng quan học tập và tiến độ hàng ngày',
    feature: 'home',
    icon: Home,
  },
  {
    title: 'Gõ câu',
    shortTitle: 'Gõ câu',
    path: '/go-cau',
    description: 'Luyện phản xạ gõ và ráp câu theo ngữ cảnh',
    feature: 'go-cau',
    icon: Keyboard,
  },
  {
    title: 'Video & Podcast',
    shortTitle: 'Video',
    path: '/video-podcast',
    description: 'Luyện nghe thụ động & chủ động qua đa phương tiện',
    feature: 'video-podcast',
    icon: Play,
  },
  {
    title: 'Ngữ pháp',
    shortTitle: 'Ngữ pháp',
    path: '/ngu-phap',
    description: 'Bản đồ ngữ pháp và sơ đồ tư duy thực hành',
    feature: 'ngu-phap',
    icon: BookOpen,
  },
  {
    title: 'Từ vựng & Phát âm',
    shortTitle: 'Từ vựng',
    path: '/tu-vung',
    description: 'Học từ vựng qua thẻ và kiểm tra phát âm chuẩn',
    feature: 'tu-vung',
    icon: Volume2,
  },
  {
    title: 'Đọc & Dịch',
    shortTitle: 'Đọc dịch',
    path: '/doc-dich',
    description: 'Đọc hiểu báo chí, tài liệu song ngữ kèm tra từ',
    feature: 'doc-dich',
    icon: BookMarked,
  },
  {
    title: 'Từ điển',
    shortTitle: 'Từ điển',
    path: '/tu-dien',
    description: 'Tra cứu chuyên sâu, cụm từ và ví dụ thực tế',
    feature: 'tu-dien',
    icon: Search,
  },
  {
    title: 'Luyện thi',
    shortTitle: 'Luyện thi',
    path: '/luyen-thi',
    description: 'Đề thi thử và rèn luyện 4 kỹ năng các chứng chỉ',
    feature: 'luyen-thi',
    icon: Trophy,
  },
  {
    title: 'Góp ý',
    shortTitle: 'Góp ý',
    path: '/yeu-cau-tinh-nang',
    description: 'Đóng góp ý kiến và đề xuất tính năng cho cộng đồng',
    feature: 'yeu-cau-tinh-nang',
    icon: Lightbulb,
  },
]

export const footerLinks = {
  legal: [
    { title: 'Điều khoản sử dụng', path: '/dieu-khoan' },
    { title: 'Chính sách quyền riêng tư', path: '/chinh-sach-quyen-rieng-tu' },
    { title: 'Giấy phép mã nguồn mở', path: '#' },
  ],
  community: [
    { title: 'Yêu cầu tính năng', path: '/yeu-cau-tinh-nang' },
    { title: 'Đóng góp nội dung', path: '#' },
    { title: 'Báo lỗi hệ thống', path: '#' },
  ],
}
