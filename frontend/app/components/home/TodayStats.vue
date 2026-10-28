<script setup lang="ts">
import { Clock, BookPlus, CheckSquare, Zap } from '@lucide/vue'

const { todayStats } = useHomeData()

const statCards = computed(() => [
  {
    label: 'Thời gian học',
    value: `${todayStats.value.learningTimeMinutes}`,
    unit: 'phút',
    icon: Clock,
    bg: 'bg-warn text-on-tone',
  },
  {
    label: 'Từ vựng mới',
    value: `${todayStats.value.newWordsLearned}`,
    unit: 'từ',
    icon: BookPlus,
    bg: 'bg-ok text-on-tone',
  },
  {
    label: 'Bài hoàn thành',
    value: `${todayStats.value.completedLessons}`,
    unit: 'bài',
    icon: CheckSquare,
    bg: 'bg-c-blue text-white',
  },
  {
    label: 'XP hôm nay',
    value: `+${todayStats.value.xpGainedToday}`,
    unit: 'XP',
    icon: Zap,
    bg: 'bg-mark text-on-tone',
  },
])
</script>

<template>
  <div id="home-today-stats">
    <BaseCard tone="surface" class="h-full">
      <template #header>
        <span class="font-display font-black text-base text-ink">
          Thống kê rèn luyện hôm nay
        </span>
      </template>

      <!-- 4 thẻ thống kê: nền màu đặc, số lớn, icon lớn -->
      <div class="grid grid-cols-2 gap-3.5">
        <div
          v-for="item in statCards"
          :key="item.label"
          class="flex flex-col justify-between rounded-brut-lg border-2 border-line p-4 shadow-brut transition-transform hover:-translate-y-0.5"
          :class="item.bg"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-black uppercase tracking-wider">
              {{ item.label }}
            </span>
            <div class="p-1.5 rounded-brut border-2 border-line bg-surface text-ink shadow-[1px_1px_0_var(--line)]">
              <component :is="item.icon" class="h-5 w-5" :stroke-width="2.5" />
            </div>
          </div>

          <div class="mt-2 flex items-baseline gap-1.5">
            <span class="font-display text-3xl sm:text-4xl font-black tracking-tight leading-none">
              {{ item.value }}
            </span>
            <span class="font-mono text-xs font-bold uppercase">
              {{ item.unit }}
            </span>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
