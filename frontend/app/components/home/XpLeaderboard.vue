<script setup lang="ts">
import { ChevronDown, Trophy } from '@lucide/vue'
import type { LeaderboardUserItem } from '~/composables/useHomeData'

// 5 hạng đầu bảng XP tuần. Dưới 1024px thu gọn, dòng tóm tắt cho biết hạng của bạn.
const props = defineProps<{
  users: LeaderboardUserItem[]
}>()

const top5 = computed(() => props.users.slice(0, 5))
const me = computed(() => props.users.find((u) => u.isCurrentUser) ?? null)
const isOpen = ref(false)
</script>

<template>
  <section id="home-xp-leaderboard" class="rounded-brut-lg border-[1px] border-line bg-surface">
    <h2 class="m-0">
      <button
        type="button"
        class="flex w-full min-h-[52px] items-center justify-between gap-2 px-4 text-left cursor-pointer lg:cursor-default"
        :aria-expanded="isOpen"
        aria-controls="home-xp-leaderboard-list"
        @click="isOpen = !isOpen"
      >
        <span class="flex items-center gap-2 font-display text-base font-black text-ink">
          <Trophy class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" /> Top XP tuần
        </span>
        <span class="flex items-center gap-2 text-xs font-bold text-ink-soft">
          <span v-if="me" class="tabular-nums">Bạn hạng {{ me.rank }}</span>
          <ChevronDown class="h-4 w-4 transition-transform lg:hidden" :class="{ 'rotate-180': isOpen }" aria-hidden="true" />
        </span>
      </button>
    </h2>

    <ol
      id="home-xp-leaderboard-list"
      class="border-t-2 border-line px-2 py-2 lg:block"
      :class="isOpen ? 'block' : 'hidden'"
    >
      <li
        v-for="u in top5"
        :key="u.id"
        class="flex min-h-[44px] items-center gap-3 rounded-brut px-2"
        :class="u.isCurrentUser ? 'bg-warn text-on-tone font-black' : 'text-ink'"
      >
        <span class="w-5 text-right font-mono text-xs font-bold tabular-nums">{{ u.rank }}</span>
        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-brut border-2 border-line bg-surface-2 font-display text-[10px] font-black text-ink">
          {{ u.avatarChar }}
        </span>
        <span class="min-w-0 flex-1 truncate font-display text-sm font-bold">{{ u.name }}</span>
        <span class="font-mono text-xs font-black tabular-nums">{{ u.xp }} XP</span>
      </li>
      <li v-if="top5.length === 0" class="px-2 py-3 text-xs text-ink-soft">Chưa có ai nhận XP trong tuần này.</li>
    </ol>
  </section>
</template>
