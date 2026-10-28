<script setup lang="ts">
import { Clock, Zap, ArrowUpRight, CheckCircle2 } from '@lucide/vue'

const { todayTasks } = useHomeData()
</script>

<template>
  <section id="home-today-tasks" class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h2 class="text-xl sm:text-2xl font-black text-ink">
          Hôm nay học gì?
        </h2>
        <span class="rounded border-2 border-line bg-warn px-2 py-0.5 text-xs font-black text-on-tone">
          {{ todayTasks.length }} nhiệm vụ
        </span>
      </div>
      <span class="text-xs font-bold text-ink-soft hidden sm:inline">
        Hoàn thành để nhận tối đa +130 XP
      </span>
    </div>

    <!-- Lưới 4 thẻ nhiệm vụ gợi ý -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <BaseCard
        v-for="task in todayTasks"
        :key="task.id"
        :tone="task.tone"
        interactive
        class="flex flex-col justify-between"
      >
        <template #header>
          <div class="flex items-center justify-between w-full">
            <span class="text-xs font-bold uppercase tracking-wider">
              {{ task.category }}
            </span>
            <span class="flex items-center gap-1 text-xs font-black">
              <Zap class="h-3.5 w-3.5 fill-current" :stroke-width="2.5" />
              +{{ task.xpReward }} XP
            </span>
          </div>
        </template>

        <div class="space-y-3">
          <h3 class="font-display text-base font-bold line-clamp-2 leading-snug">
            {{ task.title }}
          </h3>

          <div class="flex items-center gap-1.5 text-xs font-bold">
            <Clock class="h-3.5 w-3.5" :stroke-width="2.5" />
            <span>Thời lượng ước tính: {{ task.estMinutes }} phút</span>
          </div>
        </div>

        <template #footer>
          <BaseButton
            :to="task.path"
            variant="secondary"
            size="sm"
            block
          >
            <span>Bắt đầu</span>
            <template #right>
              <ArrowUpRight class="h-4 w-4" :stroke-width="2.5" />
            </template>
          </BaseButton>
        </template>
      </BaseCard>
    </div>
  </section>
</template>
