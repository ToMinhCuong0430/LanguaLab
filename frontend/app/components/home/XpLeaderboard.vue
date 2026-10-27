<script setup lang="ts">
import { Trophy, Crown, ArrowRight } from '@lucide/vue'

const { leaderboardUsers } = useHomeData()

const top3 = computed(() => leaderboardUsers.value.slice(0, 3))
const remainingUsers = computed(() => leaderboardUsers.value.slice(3))

// Avatar palette ngẫu nhiên đẹp mắt
const avatarColors = [
  'bg-c-blue text-white',
  'bg-c-pink text-ink',
  'bg-c-violet text-ink',
  'bg-c-green text-ink',
  'bg-c-orange text-ink',
  'bg-c-cyan text-ink',
]

const getAvatarColor = (idx: number) => avatarColors[idx % avatarColors.length]
</script>

<template>
  <div id="home-xp-leaderboard" class="space-y-4">
    <BaseCard tone="surface" class="h-full flex flex-col justify-between">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-brut border-2 border-line bg-warn text-on-tone shadow-brut-sm">
              <Trophy class="h-4 w-4" :stroke-width="2.5" />
            </div>
            <span class="font-display font-black text-base text-ink">
              Bảng vàng rèn luyện tuần
            </span>
          </div>
          <BaseBadge tone="neutral" size="sm">
            Top 10
          </BaseBadge>
        </div>
      </template>

      <div class="space-y-5">
        <!-- TOP 3 PODIUM (BỤC VINH QUANG PHẲNG) -->
        <div class="grid grid-cols-3 gap-2 pt-4 pb-2 border-b-2 border-line items-end text-center">
          <!-- Hạng 2 (Bạc) -->
          <div v-if="top3[1]" class="flex flex-col items-center">
            <div class="relative mb-2">
              <div class="flex h-11 w-11 items-center justify-center rounded-brut border-2 border-line bg-surface-2 text-ink font-display text-xs font-black shadow-brut-sm">
                {{ top3[1].avatarChar }}
              </div>
              <span class="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-brut border border-line bg-surface-2 px-1.5 text-[10px] font-black shadow-sm">
                #2
              </span>
            </div>
            <span class="font-display text-xs font-black text-ink line-clamp-1 max-w-[80px]">
              {{ top3[1].name }}
            </span>
            <span class="font-mono text-[11px] font-bold text-ink-soft">
              {{ top3[1].weeklyXp }} XP
            </span>
            <!-- Bục Bạc phẳng -->
            <div class="mt-2 w-full h-12 rounded-t-brut border-2 border-line bg-surface-2 flex items-center justify-center font-display font-black text-xs">
              2
            </div>
          </div>

          <!-- Hạng 1 (Vàng - cao nhất) -->
          <div v-if="top3[0]" class="flex flex-col items-center -mt-3">
            <Crown class="h-5 w-5 text-warn fill-warn mb-1" :stroke-width="2.5" />
            <div class="relative mb-2">
              <div class="flex h-14 w-14 items-center justify-center rounded-brut border-2 border-line bg-warn text-on-tone font-display text-sm font-black shadow-brut">
                {{ top3[0].avatarChar }}
              </div>
              <span class="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-brut border-2 border-line bg-warn px-2 text-[11px] font-black text-on-tone shadow-sm">
                #1
              </span>
            </div>
            <span class="font-display text-xs font-black text-ink line-clamp-1 max-w-[90px]">
              {{ top3[0].name }}
            </span>
            <span class="font-mono text-xs font-black text-ink">
              {{ top3[0].weeklyXp }} XP
            </span>
            <!-- Bục Vàng phẳng -->
            <div class="mt-2 w-full h-18 rounded-t-brut border-2 border-line bg-warn flex items-center justify-center font-display font-black text-sm text-on-tone">
              1
            </div>
          </div>

          <!-- Hạng 3 (Đồng) -->
          <div v-if="top3[2]" class="flex flex-col items-center">
            <div class="relative mb-2">
              <div class="flex h-11 w-11 items-center justify-center rounded-brut border-2 border-line bg-c-orange text-ink font-display text-xs font-black shadow-brut-sm">
                {{ top3[2].avatarChar }}
              </div>
              <span class="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-brut border border-line bg-c-orange px-1.5 text-[10px] font-black text-ink shadow-sm">
                #3
              </span>
            </div>
            <span class="font-display text-xs font-black text-ink line-clamp-1 max-w-[80px]">
              {{ top3[2].name }}
            </span>
            <span class="font-mono text-[11px] font-bold text-ink-soft">
              {{ top3[2].weeklyXp }} XP
            </span>
            <!-- Bục Đồng phẳng -->
            <div class="mt-2 w-full h-9 rounded-t-brut border-2 border-line bg-c-orange flex items-center justify-center font-display font-black text-xs text-ink">
              3
            </div>
          </div>
        </div>

        <!-- DANH SÁCH TỪ HẠNG 4 TRỞ XUỐNG -->
        <div class="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          <div
            v-for="(userItem, idx) in remainingUsers"
            :key="userItem.id"
            class="flex items-center justify-between rounded-brut border-2 p-2 sm:p-2.5 transition-all"
            :class="[
              userItem.isCurrentUser
                ? 'border-line bg-warn text-on-tone shadow-brut ring-2 ring-line font-black'
                : 'border-line/40 bg-surface hover:bg-surface-2 text-ink',
            ]"
          >
            <!-- Cột trái: Hạng + Avatar + Tên -->
            <div class="flex items-center gap-2.5">
              <span class="flex h-6 w-6 items-center justify-center rounded-brut border border-line bg-surface font-mono text-xs font-bold text-ink">
                {{ userItem.rank }}
              </span>

              <div
                class="flex h-7 w-7 items-center justify-center rounded-brut border border-line font-display text-xs font-black"
                :class="getAvatarColor(idx)"
              >
                {{ userItem.avatarChar }}
              </div>

              <div>
                <span class="font-display text-xs font-bold leading-none line-clamp-1">
                  {{ userItem.name }}
                </span>
                <span v-if="userItem.isCurrentUser" class="text-[10px] font-black uppercase text-on-tone/70 block">
                  (Bạn)
                </span>
              </div>
            </div>

            <!-- Cột phải: XP -->
            <span class="font-mono text-xs font-black">
              {{ userItem.weeklyXp }} XP
            </span>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
