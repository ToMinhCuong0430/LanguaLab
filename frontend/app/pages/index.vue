<script setup lang="ts">
import HomeTopBar from '~/components/home/HomeTopBar.vue'
import HomeHero from '~/components/home/HomeHero.vue'
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
import BaseSkeleton from '~/components/BaseSkeleton.vue'
import BaseButton from '~/components/BaseButton.vue'
import { AlertCircle, RotateCcw } from '@lucide/vue'
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

const { isLoading, loadError, fetchHomeData } = useHomeData()

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

    <!-- BANNER LỖI (KHI LOAD LỖI KÈM NÚT THỬ LẠI) -->
    <div
      v-if="loadError"
      class="p-6 bg-amber-50 dark:bg-amber-950/40 border-3 border-amber-600 dark:border-amber-500 rounded-2xl shadow-[4px_4px_0_0_#d97706] flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <div class="flex items-center gap-3">
        <AlertCircle class="w-8 h-8 text-amber-600 dark:text-amber-400 shrink-0" />
        <div>
          <h3 class="font-bold text-lg text-amber-950 dark:text-amber-100">Không thể tải dữ liệu mới nhất</h3>
          <p class="text-sm text-amber-800 dark:text-amber-300">{{ loadError }}</p>
        </div>
      </div>
      <BaseButton
        variant="primary"
        tone="warn"
        class="shrink-0"
        @click="fetchHomeData"
      >
        <RotateCcw class="w-4 h-4 mr-2" />
        Thử lại
      </BaseButton>
    </div>

    <!-- KHUNG XƯƠNG LOADING (KHI ĐANG TẢI DỮ LIỆU) -->
    <div v-if="isLoading" class="space-y-8 animate-pulse">
      <!-- Skeleton Hero -->
      <BaseSkeleton height="180px" rounded="lg" />

      <!-- Skeleton Dual Card -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-5">
          <BaseSkeleton height="220px" rounded="lg" />
        </div>
        <div class="lg:col-span-7">
          <BaseSkeleton height="220px" rounded="lg" />
        </div>
      </div>

      <!-- Skeleton Grid 8 items -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BaseSkeleton v-for="i in 8" :key="i" height="120px" rounded="md" />
      </div>

      <!-- Skeleton Lower Blocks -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-6">
          <BaseSkeleton height="200px" rounded="lg" />
        </div>
        <div class="lg:col-span-6">
          <BaseSkeleton height="200px" rounded="lg" />
        </div>
      </div>
    </div>

    <!-- NỘI DUNG CHÍNH (KHI ĐÃ TẢI XONG) -->
    <template v-else>
      <!-- 2. Hero banner chào theo buổi nền màu, minh hoạ phẳng độc lập -->
      <HomeHero />

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
    </template>
  </div>
</template>
