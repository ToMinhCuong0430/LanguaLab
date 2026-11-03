export type WhatsNewTag = 'new' | 'improved' | 'soon'

export interface WhatsNewItem {
  tag: WhatsNewTag
  icon: string
  title: string
  description: string
  to?: string
}

export interface WhatsNewRelease {
  version: string
  date: string
  title: string
  items: WhatsNewItem[]
}

export const WHATS_NEW_RELEASES: WhatsNewRelease[] = [
  {
    version: '2026.11.02',
    date: '2026-11-02',
    title: 'Từ điển mới và thang cấp độ A1-C2',
    items: [
      {
        tag: 'new',
        icon: 'BookOpen',
        title: 'Từ điển mới với cấp độ A1-C2',
        description: 'Tra hàng nghìn từ tiếng Anh kèm cấp độ A1-C2, phiên âm IPA, ví dụ và các dạng từ (gõ went ra go).',
        to: '/tu-dien',
      },
      {
        tag: 'improved',
        icon: 'Library',
        title: 'Nguồn dữ liệu minh bạch',
        description: 'Xem từ điển và phân loại cấp độ lấy từ những nguồn mở nào.',
        to: '/nguon-du-lieu',
      },
      {
        tag: 'soon',
        icon: 'Hammer',
        title: 'Tiếng Trung và tiếng Nhật đang phát triển',
        description: 'Hai ngôn ngữ này đang được xây dựng lại với dữ liệu thật. Hiện tại bạn có thể học tiếng Anh.',
      },
    ],
  },
]
