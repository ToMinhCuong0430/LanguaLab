<script setup lang="ts">
import HomeTopBar from '~/components/home/HomeTopBar.vue'
import ContinueLearningCard from '~/components/home/ContinueLearningCard.vue'
import TodayTasks from '~/components/home/TodayTasks.vue'
import HomeFeatureGrid from '~/components/home/HomeFeatureGrid.vue'
import VocabReview from '~/components/home/VocabReview.vue'
import TodayStats from '~/components/home/TodayStats.vue'
import TargetBandRoadmap from '~/components/home/TargetBandRoadmap.vue'
import ExamPractice from '~/components/home/ExamPractice.vue'
import VocabLevels from '~/components/home/VocabLevels.vue'
import WeeklyStory from '~/components/home/WeeklyStory.vue'
import XpLeaderboard from '~/components/home/XpLeaderboard.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { BRAND_NAME } from '~/constants/brand'

useHead({
  title: `${BRAND_NAME} - Trang chủ học tập & Luyện thi`,
  meta: [
    {
      name: 'description',
      content: 'Nền tảng học ngoại ngữ và luyện thi chứng chỉ thực chiến phi thương mại',
    },
  ],
})

// Cấu hình các bước hướng dẫn lần đầu cho Trang chủ
const homeTourSteps: GuideStep[] = [
  {
    targetId: 'home-top-bar',
    badge: 'BƯỚC 1',
    title: 'Điểm danh & Quản lý tiến độ',
    description:
      'Điểm danh mỗi ngày để duy trì chuỗi Streak rực lửa, nhận thưởng XP và cập nhật các thông báo học tập quan trọng.',
  },
  {
    targetId: 'home-continue-learning',
    badge: 'BƯỚC 2',
    title: 'Tiếp tục bài học đang dở',
    description:
      'Truy cập nhanh bài học bạn vừa thực hành gần nhất để không bị đứt đoạn mạch tư duy và phản xạ.',
  },
  {
    targetId: 'home-feature-grid',
    badge: 'BƯỚC 3',
    title: '8 Chức năng học chuyên sâu',
    description:
      'Khám phá toàn bộ 8 phân hệ học tập từ Gõ câu, Video song ngữ, Ngữ pháp, Từ vựng, Đọc dịch đến Luyện thi IELTS.',
  },
  {
    targetId: 'home-exam-practice',
    badge: 'BƯỚC 4',
    title: 'Thực chiến đề thi chuẩn',
    description:
      'Luyện đề thi thử IELTS 4 kỹ năng với giao diện bấm giờ thực tế, chấm điểm và giải thích đáp án chi tiết.',
  },
  {
    targetId: 'home-xp-leaderboard',
    badge: 'BƯỚC 5',
    title: 'Đua top Bảng vàng tuần',
    description:
      `Tích lũy XP qua mỗi bài học để thăng hạng trong Top 10 Bảng vàng cộng đồng học tập ${BRAND_NAME}.`,
  },
]
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-8" data-feature="home">
    <!-- 1. Thanh trên cùng của trang: Ô tìm kiếm, điểm danh, streak, XP, thông báo -->
    <HomeTopBar />

    <!-- 2. Hero banner (sẽ được thay thế bởi HomeHero) -->

    <!-- 3. Khối hàng đôi: "Tiếp tục học" có preview bài dở cạnh khối "Hôm nay học gì?" -->
    <div id="home-continue-learning" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <div class="lg:col-span-5 h-full">
        <ContinueLearningCard />
      </div>
      <div class="lg:col-span-7 h-full">
        <TodayTasks />
      </div>
    </div>

    <!-- 4. Lưới "Chức năng chính": 8 FeatureTile màu theo chức năng có preview số liệu -->
    <HomeFeatureGrid />

    <!-- 5. Hàng ôn từ vựng SRS + Thống kê hôm nay đặt cạnh nhau -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <div class="lg:col-span-6 h-full">
        <VocabReview />
      </div>
      <div class="lg:col-span-6 h-full">
        <TodayStats />
      </div>
    </div>

    <!-- 6. Từ vựng 7 cấp độ (mỗi cấp một màu riêng có vòng tiến độ) -->
    <VocabLevels />

    <!-- 7. Lộ trình band + Chọn kỳ thi (IELTS to hơn, 4 kỳ thi còn lại nhỏ gọn) -->
    <TargetBandRoadmap />
    <ExamPractice />

    <!-- 8. Tổng kết tuần dạng story và Bảng xếp hạng bục vinh quang -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div class="lg:col-span-5 space-y-6">
        <WeeklyStory />
      </div>
      <div class="lg:col-span-7 space-y-6">
        <XpLeaderboard />
      </div>
    </div>

    <!-- Hướng dẫn lần đầu (First Visit Tour) -->
    <FirstVisitGuide
      page-key="home"
      :steps="homeTourSteps"
    />
  </div>
</template>
