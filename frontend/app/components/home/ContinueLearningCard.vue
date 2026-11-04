<script setup lang="ts">
import { ArrowRight, Keyboard } from '@lucide/vue'
import type { ContinueLesson } from '~/composables/useHomeData'

// Hành động học chính của trang chủ (một nút): tiếp tục bài dở đã lưu, hoặc bắt đầu mục đầu của lộ trình
withDefaults(
  defineProps<{
    lesson: ContinueLesson | null
    startLink?: string
    loading?: boolean
  }>(),
  { startLink: '/go-cau', loading: false },
)
</script>

<template>
  <section
    class="rounded-brut-lg border-[1px] border-line bg-surface p-5 sm:p-6 space-y-5"
    aria-labelledby="home-continue-title"
  >
    <div v-if="loading" class="space-y-4" aria-busy="true" aria-label="Đang tải bài học đang dở">
      <BaseSkeleton height="1.25rem" width="40%" />
      <BaseSkeleton height="2rem" />
      <BaseSkeleton height="52px" rounded="md" />
    </div>

    <template v-else-if="lesson">
      <div class="flex items-center justify-between gap-3">
        <BaseBadge tone="green" size="sm">Bài học đang dở</BaseBadge>
        <span class="font-mono text-xs font-bold text-ink-soft">
          {{ lesson.completedSteps }}/{{ lesson.totalSteps }} {{ lesson.unit }}
        </span>
      </div>

      <div class="space-y-1">
        <p class="text-xs font-bold text-c-green-ink">{{ lesson.category }}</p>
        <h1 id="home-continue-title" class="font-display text-2xl font-black leading-tight text-ink">
          {{ lesson.title }}
        </h1>
      </div>

      <div class="space-y-1.5">
        <div class="flex justify-between text-xs font-bold">
          <span class="text-ink-soft">Tiến độ</span>
          <span class="font-mono text-ink">{{ lesson.progress }}%</span>
        </div>
        <BaseProgress :value="lesson.progress" tone="ok" size="sm" label="Tiến độ bài học đang dở" />
      </div>

      <div id="home-continue-action">
        <BaseButton :to="lesson.to" variant="success" size="lg" block>
          <span>Tiếp tục</span>
          <template #right>
            <ArrowRight class="h-5 w-5" :stroke-width="2.5" />
          </template>
        </BaseButton>
      </div>
    </template>

    <template v-else>
      <div class="flex items-start gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-brut border-[1px] border-line bg-c-green text-on-tone">
          <Keyboard class="h-6 w-6" :stroke-width="2.5" aria-hidden="true" />
        </div>
        <div class="space-y-1">
          <h1 id="home-continue-title" class="font-display text-2xl font-black leading-tight text-ink">
            Chưa có bài học đang dở
          </h1>
          <p class="text-sm text-ink-soft">
            Bắt đầu từ bài đầu tiên của lộ trình tiếng Anh: đọc câu tiếng Việt và gõ lại bằng tiếng Anh.
          </p>
        </div>
      </div>

      <div id="home-continue-action">
        <BaseButton :to="startLink" variant="success" size="lg" block>
          <span>Bắt đầu bài học</span>
          <template #right>
            <ArrowRight class="h-5 w-5" :stroke-width="2.5" />
          </template>
        </BaseButton>
      </div>
    </template>
  </section>
</template>
