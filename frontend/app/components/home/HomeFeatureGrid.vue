<script setup lang="ts">
import {
  Keyboard,
  Play,
  BookOpen,
  Volume2,
  BookMarked,
  Search,
  Trophy,
  Lightbulb,
} from '@lucide/vue'
import FeatureTile from '~/components/common/FeatureTile.vue'
import { BRAND_NAME } from '~/constants/brand'

const featureTiles = [
  {
    title: 'Gõ câu phản xạ',
    shortTitle: 'Gõ câu',
    description: 'Luyện ráp câu tốc độ cao, hỗ trợ IME Pinyin & Romaji không ngắt quãng.',
    feature: 'go-cau',
    to: '/go-cau',
    statBadge: '12 câu đang chờ',
    icon: Keyboard,
  },
  {
    title: 'Video & Podcast',
    shortTitle: 'Video',
    description: 'Nghe ngấm tự nhiên với phụ đề song ngữ và 4 chế độ shadowing chuyên sâu.',
    feature: 'video-podcast',
    to: '/video-podcast',
    statBadge: '8 bài mới',
    icon: Play,
  },
  {
    title: 'Ngữ pháp thực chiến',
    shortTitle: 'Ngữ pháp',
    description: 'Bản đồ cấu trúc ngữ pháp có sơ đồ khối dễ nhớ và bài tập chấm điểm ngay.',
    feature: 'ngu-phap',
    to: '/ngu-phap',
    statBadge: '4 quy tắc mở',
    icon: BookOpen,
  },
  {
    title: 'Từ vựng & Phát âm',
    shortTitle: 'Từ vựng',
    description: 'Thẻ Flashcard lặp lại ngắt quãng (SRS) và luyện phát âm đối chiếu bằng tai.',
    feature: 'tu-vung',
    to: '/tu-vung',
    statBadge: '28 từ cần ôn',
    icon: Volume2,
  },
  {
    title: 'Luyện đọc & Dịch',
    shortTitle: 'Đọc dịch',
    description: 'Kho văn học, báo chí song ngữ xen kẽ đối chiếu, tra từ và tự dịch.',
    feature: 'doc-dich',
    to: '/doc-dich',
    statBadge: '5 tác phẩm hay',
    icon: BookMarked,
  },
  {
    title: 'Từ điển chuyên sâu',
    shortTitle: 'Từ điển',
    description: 'Tra cứu ngữ cảnh, ví dụ thực tế và lộ trình học theo chặng trực quan.',
    feature: 'tu-dien',
    to: '/tu-dien',
    statBadge: '150+ từ tra cứu',
    icon: Search,
  },
  {
    title: 'Luyện thi chứng chỉ',
    shortTitle: 'Luyện thi',
    description: 'Đề thi thử IELTS 4 kỹ năng mô phỏng máy tính, bấm giờ và phân tích kết quả.',
    feature: 'luyen-thi',
    to: '/luyen-thi',
    statBadge: 'Band 5.5 → 7.0',
    icon: Trophy,
  },
  {
    title: 'Góp ý tính năng',
    shortTitle: 'Góp ý',
    description: `Đề xuất ý tưởng, bình chọn tính năng cho cộng đồng học mở ${BRAND_NAME}.`,
    feature: 'yeu-cau-tinh-nang',
    to: '/yeu-cau-tinh-nang',
    statBadge: '16 đề xuất mới',
    icon: Lightbulb,
  },
]
</script>

<template>
  <section id="home-feature-grid" class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h2 class="text-xl sm:text-2xl font-black text-ink">
          Chức năng chính
        </h2>
        <span class="rounded border-2 border-line bg-warn px-2 py-0.5 text-xs font-black text-on-tone">
          8 phân hệ
        </span>
      </div>
      <span class="text-xs font-bold text-ink-soft hidden sm:inline">
        Tất cả miễn phí & mở hoàn toàn
      </span>
    </div>

    <!-- Lưới 8 FeatureTile -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <FeatureTile
        v-for="item in featureTiles"
        :key="item.feature"
        :title="item.title"
        :description="item.description"
        :feature="item.feature"
        :to="item.to"
        :stat-badge="item.statBadge"
        :icon="item.icon"
      />
    </div>
  </section>
</template>
