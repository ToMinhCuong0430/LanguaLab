<script setup lang="ts">
import { ChevronDown, ChevronRight, Clock, Zap } from '@lucide/vue'
import type { DailyTask } from '~/composables/useHomeData'

// Tối đa 3 nhiệm vụ hôm nay. Dưới 1024px thu gọn, chỉ hiện dòng tóm tắt cho tới khi mở.
const props = defineProps<{
  tasks: DailyTask[]
}>()

const shown = computed(() => props.tasks.slice(0, 3))
const totalXp = computed(() => shown.value.reduce((sum, t) => sum + t.xpReward, 0))
const isOpen = ref(false)
</script>

<template>
  <section id="home-today-tasks" class="rounded-brut-lg border-[1px] border-line bg-surface">
    <h2 class="m-0">
      <button
        type="button"
        class="flex w-full min-h-[52px] items-center justify-between gap-2 px-4 text-left cursor-pointer lg:cursor-default"
        :aria-expanded="isOpen"
        aria-controls="home-today-tasks-list"
        @click="isOpen = !isOpen"
      >
        <span class="font-display text-base font-black text-ink">Nhiệm vụ hôm nay</span>
        <span class="flex items-center gap-2 text-xs font-bold text-ink-soft">
          <span class="tabular-nums">{{ shown.length }} nhiệm vụ, +{{ totalXp }} XP</span>
          <ChevronDown class="h-4 w-4 transition-transform lg:hidden" :class="{ 'rotate-180': isOpen }" aria-hidden="true" />
        </span>
      </button>
    </h2>

    <ul
      id="home-today-tasks-list"
      class="border-t-2 border-line px-2 py-2 lg:block"
      :class="isOpen ? 'block' : 'hidden'"
    >
      <li v-for="task in shown" :key="task.id">
        <NuxtLink
          :to="task.path"
          class="group flex min-h-[56px] items-center gap-3 rounded-brut px-2 py-2 hover:bg-surface-2"
        >
          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-bold text-ink-soft">{{ task.category }}</p>
            <p class="truncate font-display text-sm font-bold text-ink group-hover:underline">{{ task.title }}</p>
            <p class="flex items-center gap-3 text-[11px] font-bold text-ink-soft">
              <span class="inline-flex items-center gap-1"><Clock class="h-3 w-3" aria-hidden="true" />{{ task.estMinutes }} phút</span>
              <span class="inline-flex items-center gap-1"><Zap class="h-3 w-3 fill-current" aria-hidden="true" />+{{ task.xpReward }} XP</span>
            </p>
          </div>
          <ChevronRight class="h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
