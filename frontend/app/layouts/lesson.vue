<script setup lang="ts">
import { X, CheckCircle2, XCircle } from '@lucide/vue'
import { useFeatureColor } from '~/composables/useFeatureColor'

// Layout cho phiên luyện tập ngắn (một câu / một thẻ / một bài tập mỗi màn).
// Không có navbar và AppFooter: thanh trên chỉ có nút đóng + tiến độ, đáy sticky giữ nút hành động.
// Trang dùng: definePageMeta({ layout: false }) rồi bọc nội dung trong
// <NuxtLayout name="lesson" :progress :total-segments close-to="/go-cau"> ... <template #action>...</template></NuxtLayout>
//
// Chấm một câu: truyền `phase` thì khối đáy tự hiển thị nút và banner kết quả, phát sự kiện check / continue.
//   answer  -> nút "Kiểm tra" (disabled khi canCheck = false)
//   correct -> banner --success với `feedback`, nút "Tiếp tục"
//   wrong   -> banner --danger với `feedback` và `correctAnswer`, nút "Tiếp tục"
// Không truyền `phase` (màn tổng kết...) thì dùng slot #action như cũ. Slot #toast để đặt BaseToast cho lỗi mạng / lưu tiến độ.
export type LessonPhase = 'answer' | 'correct' | 'wrong'

const props = withDefaults(
  defineProps<{
    progress: number // 0–1
    totalSegments: number
    closeTo: string // trang danh sách của feature
    closeLabel?: string
    phase?: LessonPhase | null
    canCheck?: boolean
    feedback?: string
    correctAnswer?: string
    checkLabel?: string
    continueLabel?: string
  }>(),
  {
    closeLabel: 'Đóng bài luyện tập',
    phase: null,
    canCheck: false,
    feedback: '',
    correctAnswer: '',
    checkLabel: 'Kiểm tra',
    continueLabel: 'Tiếp tục',
  },
)

const emit = defineEmits<{ check: []; continue: [] }>()

// Sau khi chấm: banner làm khối đáy cao lên, nên cuộn vừa đủ để cuối nội dung nằm trên khối đáy
// (đẩy câu hỏi lên thay vì che), rồi đưa focus vào nút Tiếp tục để Enter / trình đọc màn hình đi tiếp ngay
const actionRef = ref<HTMLElement | null>(null)
const mainRef = ref<HTMLElement | null>(null)
watch(() => props.phase, (val, old) => {
  if (old === 'answer' && (val === 'correct' || val === 'wrong')) {
    nextTick(() => {
      const footerTop = actionRef.value?.getBoundingClientRect().top ?? window.innerHeight
      const contentBottom = mainRef.value?.getBoundingClientRect().bottom ?? 0
      const overlap = contentBottom - footerTop
      if (overlap > 0) window.scrollBy({ top: overlap, behavior: 'smooth' })
      actionRef.value?.querySelector<HTMLElement>('.base-btn')?.focus({ preventScroll: true })
    })
  }
})

// Màu theo chức năng lấy từ route như layout default
useFeatureColor()

// viewport-fit=cover để env(safe-area-inset-bottom) có giá trị trên iPhone (chỉ áp dụng cho layout này)
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }],
})

const segments = computed(() => Math.max(1, Math.round(props.totalSegments || 1)))
const doneSegments = computed(() => {
  const p = Math.min(1, Math.max(0, props.progress || 0))
  return Math.round(p * segments.value)
})
</script>

<template>
  <div class="lesson-layout flex min-h-dvh flex-col bg-bg text-ink">
    <header class="sticky top-0 z-20 bg-bg">
      <div class="mx-auto flex h-16 w-full max-w-[560px] items-center gap-3 px-4">
        <NuxtLink
          :to="closeTo"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-brut border-[3px] border-line bg-surface text-ink shadow-brut brut-press"
          :aria-label="closeLabel"
          :title="closeLabel"
        >
          <X class="h-5 w-5" :stroke-width="3" aria-hidden="true" />
        </NuxtLink>

        <div
          class="flex flex-1 items-center gap-1"
          role="progressbar"
          aria-label="Tiến độ bài luyện tập"
          :aria-valuemin="0"
          :aria-valuemax="segments"
          :aria-valuenow="doneSegments"
          :aria-valuetext="`${doneSegments} trên ${segments}`"
        >
          <span
            v-for="i in segments"
            :key="i"
            class="h-3 flex-1 rounded-full transition-colors duration-200"
            :style="{ background: i <= doneSegments ? 'var(--success)' : 'var(--surface-2)' }"
          />
        </div>
      </div>
    </header>

    <main ref="mainRef" class="mx-auto w-full max-w-[560px] flex-1 px-4 pb-6 pt-2">
      <slot />
    </main>

    <!-- Khối đáy sticky: banner kết quả + nút; khối này cao lên khi có banner nên đẩy nội dung câu hỏi lên trên -->
    <footer
      v-if="phase || $slots.action"
      ref="actionRef"
      class="lesson-action sticky bottom-0 z-20 border-t-2 border-line transition-colors duration-150"
      :class="phase === 'correct' ? 'lesson-action--correct' : phase === 'wrong' ? 'lesson-action--wrong' : 'bg-bg'"
    >
      <div class="mx-auto w-full max-w-[560px] px-4 pt-3">
        <template v-if="phase">
          <div v-if="phase !== 'answer'" class="mb-3 flex items-start gap-2.5" role="status" aria-live="assertive">
            <CheckCircle2 v-if="phase === 'correct'" class="mt-0.5 h-6 w-6 shrink-0" :stroke-width="2.5" aria-hidden="true" />
            <XCircle v-else class="mt-0.5 h-6 w-6 shrink-0" :stroke-width="2.5" aria-hidden="true" />
            <div class="min-w-0 space-y-0.5">
              <p class="font-display text-lg font-black">{{ phase === 'correct' ? 'Chính xác' : 'Chưa đúng' }}</p>
              <p v-if="phase === 'wrong' && correctAnswer" class="text-sm font-bold">
                Đáp án đúng: <span class="break-words font-mono">{{ correctAnswer }}</span>
              </p>
              <p v-if="feedback" class="text-sm">{{ feedback }}</p>
            </div>
          </div>
          <BaseButton
            v-if="phase === 'answer'"
            variant="success"
            size="lg"
            block
            :disabled="!canCheck"
            @click="emit('check')"
          >
            <span>{{ checkLabel }}</span>
          </BaseButton>
          <BaseButton v-else variant="secondary" size="lg" block @click="emit('continue')">
            <span>{{ continueLabel }}</span>
          </BaseButton>
        </template>
        <slot v-else name="action" />
      </div>
    </footer>

    <div class="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4">
      <div class="pointer-events-auto">
        <slot name="toast" />
      </div>
    </div>
  </div>
</template>

<style>
/* Nút hành động: full width, cao tối thiểu 48px, nằm trong vùng ngón cái; chừa safe-area đáy */
.lesson-action {
  padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
}

/* Nút mở lại hướng dẫn đặt trên thanh đáy, không che nút hành động */
.lesson-layout .first-visit-fab {
  bottom: calc(max(0.75rem, env(safe-area-inset-bottom)) + 5rem);
  box-shadow: none;
}

.lesson-action--correct {
  background: var(--success);
  color: var(--success-ink);
}

.lesson-action--wrong {
  background: var(--danger);
  color: var(--danger-ink);
}

.lesson-action .base-btn {
  display: flex;
  width: 100%;
  min-height: 48px;
}
</style>
