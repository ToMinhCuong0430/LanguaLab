<script setup lang="ts">
import { Flag, ChevronLeft, ChevronRight } from '@lucide/vue'

// Thanh điều hướng câu hỏi cố định ở đáy phòng thi (kiểu IELTS trên máy tính).
// Trạng thái mỗi ô: đang chọn / đã cắm cờ / đã trả lời / chưa trả lời,
// phân biệt bằng cả màu, kiểu viền và icon (không chỉ dựa vào màu).
const props = defineProps<{
  totalQuestions: number
  currentIndex: number
  answers: Record<number, string>
  flagged: Record<number, boolean>
}>()

const emit = defineEmits<{
  select: [index: number]
  toggleFlag: [questionNumber: number]
  prev: []
  next: []
}>()

const isAnswered = (n: number) => Boolean(props.answers[n]?.trim())
const isFlagged = (n: number) => Boolean(props.flagged[n])

const answeredCount = computed(() => {
  let c = 0
  for (let n = 1; n <= props.totalQuestions; n++) if (isAnswered(n)) c++
  return c
})
const flaggedCount = computed(() => {
  let c = 0
  for (let n = 1; n <= props.totalQuestions; n++) if (isFlagged(n)) c++
  return c
})

const stateLabel = (n: number) => {
  const parts = [`Câu ${n}`]
  parts.push(isAnswered(n) ? 'đã trả lời' : 'chưa trả lời')
  if (isFlagged(n)) parts.push('đã cắm cờ')
  return parts.join(', ')
}

const currentNumber = computed(() => props.currentIndex + 1)

// Giữ ô đang chọn trong tầm nhìn khi danh sách dài
const stripRef = ref<HTMLElement | null>(null)
watch(
  () => props.currentIndex,
  () => {
    nextTick(() => {
      stripRef.value?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    })
  },
)
</script>

<template>
  <nav
    class="exam-bottom-bar fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-line bg-surface"
    aria-label="Điều hướng câu hỏi"
  >
    <div class="mx-auto flex max-w-7xl items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2.5">
      <button
        type="button"
        class="bar-btn"
        :disabled="currentIndex === 0"
        aria-label="Câu trước (Alt+P)"
        title="Câu trước (Alt+P)"
        @click="emit('prev')"
      >
        <ChevronLeft class="h-5 w-5" :stroke-width="2.5" />
      </button>

      <ol ref="stripRef" class="flex flex-1 items-center gap-1.5 overflow-x-auto py-1.5 px-0.5" role="list">
        <li v-for="n in totalQuestions" :key="n" class="flex-shrink-0">
          <button
            type="button"
            class="q-cell"
            :class="{
              'q-cell--answered': isAnswered(n),
              'q-cell--flagged': isFlagged(n),
              'q-cell--current': currentNumber === n,
            }"
            :aria-label="stateLabel(n)"
            :aria-current="currentNumber === n ? 'true' : undefined"
            :title="stateLabel(n)"
            @click="emit('select', n - 1)"
          >
            <span class="tabular-nums">{{ n }}</span>
            <Flag v-if="isFlagged(n)" class="q-cell__flag" :stroke-width="3" aria-hidden="true" />
          </button>
        </li>
      </ol>

      <button
        type="button"
        class="bar-btn"
        :disabled="currentIndex >= totalQuestions - 1"
        aria-label="Câu tiếp (Alt+N)"
        title="Câu tiếp (Alt+N)"
        @click="emit('next')"
      >
        <ChevronRight class="h-5 w-5" :stroke-width="2.5" />
      </button>

      <button
        type="button"
        class="flag-btn"
        :class="{ 'flag-btn--on': isFlagged(currentNumber) }"
        :aria-pressed="isFlagged(currentNumber)"
        @click="emit('toggleFlag', currentNumber)"
      >
        <Flag class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
        <span class="hidden sm:inline">{{ isFlagged(currentNumber) ? 'Bỏ cờ câu' : 'Cắm cờ câu' }} {{ currentNumber }}</span>
        <span class="sm:hidden">{{ currentNumber }}</span>
      </button>

      <p class="hidden lg:block text-right text-[11px] font-bold leading-tight text-ink-soft tabular-nums whitespace-nowrap" aria-live="polite">
        Đã làm <strong class="text-ink">{{ answeredCount }}/{{ totalQuestions }}</strong><br>
        Cắm cờ <strong class="text-ink">{{ flaggedCount }}</strong>
      </p>
    </div>
  </nav>
</template>

<style scoped>
.bar-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 2px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface-2);
  color: var(--ink);
  cursor: pointer;
}

.bar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.q-cell {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px dashed var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.08s ease, box-shadow 0.08s ease;
}

/* Đã trả lời: nền xanh, viền liền */
.q-cell--answered {
  border-style: solid;
  background: var(--ok);
  color: var(--on-tone);
}

/* Cắm cờ: nền vàng, viền liền, có icon cờ (ưu tiên hơn "đã trả lời") */
.q-cell--flagged {
  border-style: solid;
  background: var(--warn);
  color: var(--on-tone);
}

.q-cell__flag {
  position: absolute;
  top: -7px;
  right: -7px;
  width: 16px;
  height: 16px;
  padding: 2px;
  border: 1.5px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  color: var(--ink);
}

/* Câu đang làm: viền dày, nổi lên */
.q-cell--current {
  border-width: 3px;
  border-style: solid;
  transform: translateY(-3px);
  box-shadow: var(--shadow-sm);
}

.flag-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 12px;
  border: 2px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface-2);
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.flag-btn--on {
  background: var(--warn);
  color: var(--on-tone);
  box-shadow: var(--shadow-sm);
}
</style>
