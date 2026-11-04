<script setup lang="ts">
import { Flame, Zap, Check } from '@lucide/vue'
import type { UserSummary } from '~/composables/useHomeData'

// Streak + điểm danh và tổng XP (tách từ cụm bên phải của HomeTopBar)
defineProps<{
  user: UserSummary
}>()
const emit = defineEmits<{ checkIn: [] }>()
</script>

<template>
  <div id="home-streak" class="grid grid-cols-3 gap-2">
    <div
      class="flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-brut border-2 border-line bg-surface px-2 font-display text-sm font-black text-ink shadow-brut-sm tabular-nums"
      title="Chuỗi ngày học liên tục"
    >
      <Flame class="h-4 w-4 text-bad fill-bad" :stroke-width="2.5" aria-hidden="true" />
      <span>{{ user.streakDays }} ngày</span>
    </div>

    <div
      class="flex min-h-[44px] items-center justify-center gap-1.5 whitespace-nowrap rounded-brut border-2 border-line bg-surface px-2 font-display text-sm font-black text-ink shadow-brut-sm tabular-nums"
      title="Tổng điểm kinh nghiệm tích luỹ"
    >
      <Zap class="h-4 w-4 text-warn fill-warn" :stroke-width="2.5" aria-hidden="true" />
      <span>{{ user.xp }} XP</span>
    </div>

    <button
      type="button"
      class="inline-flex min-h-[44px] items-center justify-center gap-1 whitespace-nowrap rounded-brut border-2 border-line px-2 font-display text-xs font-bold text-on-tone shadow-brut-sm brut-press cursor-pointer disabled:cursor-default"
      :class="user.checkedInToday ? 'bg-ok' : 'bg-warn'"
      :disabled="user.checkedInToday"
      :title="user.checkedInToday ? undefined : 'Điểm danh hôm nay để nhận 20 XP'"
      @click="emit('checkIn')"
    >
      <Check v-if="user.checkedInToday" class="h-3.5 w-3.5" :stroke-width="3" aria-hidden="true" />
      <span>{{ user.checkedInToday ? 'Đã điểm danh' : 'Điểm danh' }}</span>
    </button>
  </div>
</template>
