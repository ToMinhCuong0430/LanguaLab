<script setup lang="ts">
import { X } from '@lucide/vue'
import { useFeatureColor } from '~/composables/useFeatureColor'

// Layout cho phiên luyện tập ngắn (một câu / một thẻ / một bài tập mỗi màn).
// Không có navbar và AppFooter: thanh trên chỉ có nút đóng + tiến độ, đáy sticky giữ nút hành động.
// Trang dùng: definePageMeta({ layout: false }) rồi bọc nội dung trong
// <NuxtLayout name="lesson" :progress :total-segments close-to="/go-cau"> ... <template #action>...</template></NuxtLayout>
const props = withDefaults(
  defineProps<{
    progress: number // 0–1
    totalSegments: number
    closeTo: string // trang danh sách của feature
    closeLabel?: string
  }>(),
  {
    closeLabel: 'Đóng bài luyện tập',
  },
)

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

    <main class="mx-auto w-full max-w-[560px] flex-1 px-4 pb-6 pt-2">
      <slot />
    </main>

    <footer v-if="$slots.action" class="lesson-action sticky bottom-0 z-20 border-t-2 border-line bg-bg">
      <div class="mx-auto w-full max-w-[560px] px-4 pt-3">
        <slot name="action" />
      </div>
    </footer>
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

.lesson-action .base-btn {
  display: flex;
  width: 100%;
  min-height: 48px;
}
</style>
