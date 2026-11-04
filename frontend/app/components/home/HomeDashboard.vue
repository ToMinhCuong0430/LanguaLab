<script setup lang="ts">
import ContinueLearningCard from '~/components/home/ContinueLearningCard.vue'
import HomeStreakXp from '~/components/home/HomeStreakXp.vue'
import TodayTasks from '~/components/home/TodayTasks.vue'
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

// Trang học của người đã đăng nhập (pages/index.vue chọn component này khi có session).
// Chỉ đưa ra một hành động học tiếp theo; các chức năng khác mở từ navbar
const { user, continueLesson, todayTasks, leaderboardUsers, toggleCheckIn } = useHomeData()

const homeTourSteps: GuideStep[] = [
  {
    targetId: 'home-continue-action',
    badge: 'BƯỚC 1',
    title: 'Một nút để học tiếp',
    description: 'Bấm Tiếp tục để quay lại đúng bài bạn đang học dở. Chưa có bài nào thì nút sẽ mở Gõ câu.',
  },
  {
    targetId: 'home-streak',
    badge: 'BƯỚC 2',
    title: 'Giữ chuỗi ngày học',
    description: 'Điểm danh mỗi ngày để giữ streak và nhận thêm XP.',
  },
  {
    targetId: 'home-today-tasks',
    badge: 'BƯỚC 3',
    title: 'Nhiệm vụ hôm nay',
    description: 'Ba bài ngắn gợi ý cho hôm nay. Các chức năng khác vẫn mở được từ thanh điều hướng.',
  },
]
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6" data-feature="home">
    <!-- Từ 1024px: [trống, navbar giữ nguyên ở trên] [hành động học chính] [streak, nhiệm vụ, top XP] -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(480px,560px)_minmax(300px,1fr)] lg:gap-6 lg:items-start">
      <!-- Cột giữa: hành động học chính duy nhất -->
      <div id="home-continue-learning" class="order-2 lg:order-none lg:col-start-2 lg:row-start-1">
        <ContinueLearningCard :lesson="continueLesson" />
      </div>

      <!-- Cột phải. Dưới 1024px các khối tách ra lưới chung: streak/XP lên trên nút Tiếp tục, phần còn lại xuống dưới -->
      <aside class="contents lg:col-start-3 lg:row-start-1 lg:flex lg:flex-col lg:gap-6" aria-label="Tiến độ hôm nay">
        <div class="order-1 lg:order-none">
          <HomeStreakXp :user="user" @check-in="toggleCheckIn" />
        </div>
        <div class="order-3 lg:order-none">
          <TodayTasks :tasks="todayTasks" />
        </div>
        <div class="order-4 lg:order-none">
          <XpLeaderboard :users="leaderboardUsers" />
        </div>
      </aside>
    </div>

    <FirstVisitGuide page-key="home" :steps="homeTourSteps" />
  </div>
</template>
