<script setup lang="ts">
import { Flag, Check, ChevronLeft, ChevronRight } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    totalQuestions: number
    currentIndex: number
    answers: Record<number, string>
    flagged: Record<number, boolean>
    skill?: string
  }>(),
  {
    skill: 'reading',
  },
)

const emit = defineEmits<{
  selectQuestion: [index: number]
  toggleFlag: [index: number]
}>()

const isAnswered = (qNum: number) => {
  const ans = props.answers[qNum]
  return ans !== undefined && ans.trim().length > 0
}

const isFlagged = (qNum: number) => {
  return !!props.flagged[qNum]
}

const answeredCount = computed(() => {
  return Object.values(props.answers).filter(a => a && a.trim().length > 0).length
})

// Bảng màu câu hiện tại theo từng kỹ năng
const skillActiveColors: Record<string, string> = {
  listening: 'bg-c-blue text-white',
  reading: 'bg-c-green text-ink',
  writing: 'bg-c-orange text-ink',
  speaking: 'bg-c-pink text-ink',
}

const activeClass = computed(() => skillActiveColors[props.skill] || 'bg-accent text-accent-ink')
</script>

<template>
  <div class="rounded-brut-lg border-[3px] border-line bg-surface p-4 shadow-brut space-y-4">
    <!-- Header: Thống kê số câu đã làm / cờ xem lại -->
    <div class="flex items-center justify-between border-b-2 border-line pb-3">
      <div>
        <h4 class="font-display text-sm font-black text-ink">
          Danh sách câu hỏi
        </h4>
        <span class="text-xs font-bold text-ink-soft">
          Đã làm: <strong class="text-ink">{{ answeredCount }}</strong> / {{ totalQuestions }}
        </span>
      </div>

      <!-- Nút cắm cờ cho câu hiện tại -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-brut border-2 border-line px-2.5 py-1 text-xs font-bold transition-all shadow-brut-sm cursor-pointer brut-press"
        :class="isFlagged(currentIndex + 1) ? 'bg-warn text-on-tone' : 'bg-surface-2 text-ink'"
        :title="isFlagged(currentIndex + 1) ? 'Bỏ đánh dấu xem lại' : 'Đánh dấu xem lại câu này'"
        @click="emit('toggleFlag', currentIndex + 1)"
      >
        <Flag class="h-3.5 w-3.5" :stroke-width="2.5" />
        <span>{{ isFlagged(currentIndex + 1) ? 'Đã cắm cờ' : 'Cắm cờ' }}</span>
      </button>
    </div>

    <!-- Lưới số câu hỏi (1, 2, 3...) -->
    <div class="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-5 gap-2">
      <button
        v-for="idx in totalQuestions"
        :key="idx"
        type="button"
        class="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-brut border-2 border-line font-display text-xs font-black transition-all cursor-pointer brut-press"
        :class="[
          currentIndex === idx - 1
            ? `${activeClass} shadow-brut ring-2 ring-line ring-offset-1`
            : isAnswered(idx)
              ? 'bg-ok text-on-tone shadow-brut-sm'
              : 'bg-surface-2 text-ink hover:bg-surface shadow-none',
        ]"
        @click="emit('selectQuestion', idx - 1)"
      >
        <span>{{ idx }}</span>

        <!-- Huy hiệu cờ nhỏ góc trên -->
        <span
          v-if="isFlagged(idx)"
          class="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-line bg-warn text-[9px] text-on-tone"
        >
          ●
        </span>
      </button>
    </div>

    <!-- Chú thích trạng thái -->
    <div class="flex flex-wrap items-center gap-3 border-t-2 border-line/20 pt-3 text-[11px] font-bold text-ink-soft">
      <div class="flex items-center gap-1.5">
        <span class="h-3 w-3 rounded border border-line bg-ok" />
        <span>Đã làm</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="h-3 w-3 rounded border border-line bg-surface-2" />
        <span>Chưa làm</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="h-3 w-3 rounded border border-line bg-warn" />
        <span>Cắm cờ</span>
      </div>
    </div>
  </div>
</template>
