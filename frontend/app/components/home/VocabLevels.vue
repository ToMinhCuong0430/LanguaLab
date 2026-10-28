<script setup lang="ts">
import { ArrowUpRight } from '@lucide/vue'

const { vocabLevels } = useHomeData()

// 7 màu riêng cho 7 cấp độ
const levelColors: Record<number, { bg: string; soft: string; ink: string }> = {
  1: { bg: 'var(--c-green)', soft: 'var(--c-green-soft)', ink: 'var(--c-green-ink)' },
  2: { bg: 'var(--c-cyan)', soft: 'var(--c-cyan-soft)', ink: 'var(--c-cyan-ink)' },
  3: { bg: 'var(--c-blue)', soft: 'var(--c-blue-soft)', ink: 'var(--c-blue-ink)' },
  4: { bg: 'var(--c-violet)', soft: 'var(--c-violet-soft)', ink: 'var(--c-violet-ink)' },
  5: { bg: 'var(--c-pink)', soft: 'var(--c-pink-soft)', ink: 'var(--c-pink-ink)' },
  6: { bg: 'var(--c-orange)', soft: 'var(--c-orange-soft)', ink: 'var(--c-orange-ink)' },
  7: { bg: 'var(--c-coral)', soft: 'var(--c-coral-soft)', ink: 'var(--c-coral-ink)' },
}
</script>

<template>
  <section id="home-vocab-levels" class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <h2 class="text-xl sm:text-2xl font-black text-ink">
          Từ vựng 7 cấp độ
        </h2>
        <BaseBadge tone="neutral" size="sm">
          Chuẩn CEFR & Học thuật
        </BaseBadge>
      </div>
      <NuxtLink
        to="/tu-vung"
        class="text-xs font-bold text-ink underline underline-offset-4 hover:text-accent flex items-center gap-1"
      >
        <span>Xem tất cả</span>
        <ArrowUpRight class="h-3.5 w-3.5" :stroke-width="2.5" />
      </NuxtLink>
    </div>

    <!-- Lưới 7 thẻ cấp độ có màu riêng và vòng tiến độ -->
    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      <NuxtLink
        v-for="lvl in vocabLevels"
        :key="lvl.level"
        to="/tu-vung"
        class="group flex flex-col justify-between rounded-brut-lg border-2 border-line p-3.5 shadow-brut-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-decoration-none"
        :style="{ backgroundColor: levelColors[lvl.level]?.soft || 'var(--surface)' }"
      >
        <div>
          <!-- Header: Code + Progress Circle -->
          <div class="flex items-center justify-between mb-2">
            <span
              class="rounded-brut border-2 border-line px-2 py-0.5 font-display text-xs font-black shadow-[1px_1px_0_var(--line)]"
              :class="levelColors[lvl.level]?.bg === 'var(--c-blue)' ? 'text-white' : 'text-on-tone'"
              :style="{ backgroundColor: levelColors[lvl.level]?.bg || 'var(--warn)' }"
            >
              {{ lvl.code }}
            </span>

            <!-- SVG Vòng tiến độ mini -->
            <div class="relative flex h-8 w-8 items-center justify-center">
              <svg class="h-8 w-8 -rotate-90 transform" viewBox="0 0 36 36">
                <!-- Background track -->
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  class="stroke-line/20"
                  stroke-width="3"
                />
                <!-- Progress track -->
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke-linecap="round"
                  stroke-width="3"
                  :style="{ stroke: levelColors[lvl.level]?.bg || 'var(--accent)' }"
                  :stroke-dasharray="88"
                  :stroke-dashoffset="88 - (88 * (lvl.learned / lvl.total))"
                  class="transition-all duration-300"
                />
              </svg>
              <span class="absolute font-mono text-[9px] font-black text-ink">
                {{ Math.round((lvl.learned / lvl.total) * 100) }}%
              </span>
            </div>
          </div>

          <h3 class="font-display text-xs font-black text-ink line-clamp-1 mt-1">
            {{ lvl.title }}
          </h3>

          <p class="text-[11px] font-medium text-ink-soft mt-0.5">
            <strong class="text-ink">{{ lvl.learned }}</strong> / {{ lvl.total }} từ
          </p>
        </div>

        <!-- Thanh mini đáy -->
        <div class="mt-3 h-1.5 w-full rounded border border-line bg-surface overflow-hidden">
          <div
            class="h-full border-r border-line transition-all duration-300"
            :style="{
              width: `${(lvl.learned / lvl.total) * 100}%`,
              backgroundColor: levelColors[lvl.level]?.bg || 'var(--accent)',
            }"
          />
        </div>
      </NuxtLink>
    </div>
  </section>
</template>
