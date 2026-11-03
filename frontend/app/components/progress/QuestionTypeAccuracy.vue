<script setup lang="ts">
import { AlertTriangle } from '@lucide/vue'
import type { CategoryStat } from '~/composables/useProgress'
import { SKILL_LABELS } from '~/composables/useProgress'

// Cột ngang: accuracy theo dạng bài qua mọi lần làm. Một chuỗi số liệu nên không cần chú thích;
// cột yếu (< ngưỡng sau đủ số lượt) dùng màu cảnh báo kèm icon + chữ, không chỉ dựa vào màu.
const props = defineProps<{
  categories: CategoryStat[]
  weakAccuracy: number
  minAttempts: number
}>()

const rows = computed(() =>
  [...props.categories].sort((a, b) => a.accuracy - b.accuracy || b.total - a.total),
)

const pct = (v: number) => `${Math.round(v * 100)}%`
const hovered = ref<string | null>(null)
const keyOf = (c: CategoryStat) => `${c.skill}:${c.category}`
</script>

<template>
  <div class="space-y-3">
    <ul class="space-y-3" role="list">
      <li
        v-for="c in rows"
        :key="keyOf(c)"
        class="grid grid-cols-1 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] items-center gap-x-4 gap-y-1"
        @pointerenter="hovered = keyOf(c)"
        @pointerleave="hovered = null"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-bold text-ink" :title="c.category">{{ c.category }}</p>
          <p class="text-[11px] text-ink-soft">
            {{ SKILL_LABELS[c.skill] }}, {{ c.attempts }} lượt, {{ c.total }} câu
          </p>
        </div>

        <div class="relative flex items-center gap-3">
          <!-- Rãnh 0–100% với vạch ngưỡng điểm yếu -->
          <div
            class="relative h-6 flex-1"
            role="meter"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="Math.round(c.accuracy * 100)"
            :aria-label="`${c.category} (${SKILL_LABELS[c.skill]}): đúng ${pct(c.accuracy)}, ${c.correct}/${c.total} câu qua ${c.attempts} lượt${c.is_weak ? ', điểm yếu' : ''}`"
          >
            <div class="absolute inset-y-[5px] left-0 right-0 rounded-full" style="background: var(--chart-grid)" aria-hidden="true" />
            <div
              class="acc-bar absolute inset-y-0 left-0"
              :class="{ 'acc-bar--weak': c.is_weak, 'acc-bar--hover': hovered === keyOf(c) }"
              :style="{ width: `max(${c.accuracy * 100}%, 4px)` }"
              aria-hidden="true"
            />
            <div
              class="absolute inset-y-[-4px] w-0.5"
              :style="{ left: `${weakAccuracy * 100}%`, background: 'var(--ink)' }"
              aria-hidden="true"
            />
          </div>
          <span class="w-11 text-right text-sm font-black text-ink tabular-nums">{{ pct(c.accuracy) }}</span>
        </div>

        <p
          v-if="c.is_weak"
          class="sm:col-start-2 flex items-center gap-1.5 text-[11px] font-bold text-ink"
        >
          <AlertTriangle class="h-3.5 w-3.5 text-bad" :stroke-width="2.5" aria-hidden="true" />
          Điểm yếu cố định: dưới {{ pct(weakAccuracy) }} sau {{ c.attempts }} lượt
        </p>
        <p
          v-else-if="c.accuracy < weakAccuracy"
          class="sm:col-start-2 text-[11px] font-bold text-ink-soft"
        >
          Đang theo dõi: dưới {{ pct(weakAccuracy) }}, đã có {{ c.attempts }}/{{ minAttempts }} lượt
        </p>
      </li>
    </ul>

    <p class="flex items-center gap-2 text-[11px] text-ink-soft">
      <span class="inline-block h-3 w-0.5" style="background: var(--ink)" aria-hidden="true" />
      Vạch đứng là ngưỡng {{ pct(weakAccuracy) }}. Dạng bài dưới ngưỡng sau ít nhất {{ minAttempts }} lượt làm được tính là điểm yếu cố định.
    </p>
  </div>
</template>

<style scoped>
.acc-bar {
  max-height: 24px;
  border-radius: 0 4px 4px 0;
  /* Một chuỗi số liệu: dùng tím (không trùng màu kỹ năng nào trên biểu đồ band) */
  background: var(--c-violet);
  transition: filter 0.12s ease;
}

.acc-bar--weak {
  background: var(--bad);
}

.acc-bar--hover {
  filter: brightness(1.08);
}
</style>
