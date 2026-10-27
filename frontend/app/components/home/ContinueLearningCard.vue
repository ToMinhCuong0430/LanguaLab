<script setup lang="ts">
import { ArrowRight, Play, CheckCircle2 } from '@lucide/vue'

// Dữ liệu bài học gần nhất để làm preview
const inProgressLesson = {
  title: 'Giao tiếp nhà hàng & Gọi món chuẩn ngữ cảnh',
  feature: 'go-cau',
  category: 'Gõ câu phản xạ',
  progress: 65,
  completedSentences: 5,
  totalSentences: 8,
  to: '/go-cau/nha-hang',
}
</script>

<template>
  <div class="rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut flex flex-col justify-between h-full">
    <div>
      <div class="flex items-center justify-between mb-3">
        <BaseBadge tone="green" size="sm" :uppercase="true">
          Bài học đang dở
        </BaseBadge>
        <span class="font-mono text-xs font-bold text-ink-soft">
          {{ inProgressLesson.completedSentences }}/{{ inProgressLesson.totalSentences }} câu
        </span>
      </div>

      <div class="flex items-start gap-3.5 mb-3">
        <!-- Thumbnail / icon preview -->
        <div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-brut border-2 border-line bg-c-green shadow-brut-sm text-on-tone">
          <Play class="h-6 w-6 fill-current ml-0.5" :stroke-width="2.5" />
        </div>

        <div class="space-y-1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-c-green-ink">
            {{ inProgressLesson.category }}
          </span>
          <h3 class="font-display text-base font-black text-ink leading-snug line-clamp-2">
            {{ inProgressLesson.title }}
          </h3>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="space-y-1.5 my-3">
        <div class="flex justify-between text-xs font-bold">
          <span class="text-ink-soft">Tiến độ hoàn thành</span>
          <span class="font-mono text-ink">{{ inProgressLesson.progress }}%</span>
        </div>
        <BaseProgress
          :value="inProgressLesson.progress"
          tone="ok"
          size="sm"
          label="Tiến độ bài học đang dở"
        />
      </div>
    </div>

    <!-- Nút tiếp tục học -->
    <div class="pt-2">
      <BaseButton
        :to="inProgressLesson.to"
        variant="primary"
        size="md"
        block
      >
        <span>Tiếp tục học ngay</span>
        <template #right>
          <ArrowRight class="h-4 w-4" :stroke-width="2.5" />
        </template>
      </BaseButton>
    </div>
  </div>
</template>
