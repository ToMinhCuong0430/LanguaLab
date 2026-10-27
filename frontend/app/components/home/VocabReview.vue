<script setup lang="ts">
import { RotateCw, AlertCircle, ArrowRight, Brain } from '@lucide/vue'

const { reviewData } = useHomeData()
</script>

<template>
  <div id="home-vocab-review">
    <BaseCard tone="surface" class="h-full flex flex-col justify-between">
      <template #header>
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded border-2 border-line bg-bad text-on-tone">
            <RotateCw class="h-4 w-4" :stroke-width="2.5" />
          </div>
          <span class="font-display font-black text-base text-ink">
            Ôn tập ngắt quãng (SRS)
          </span>
        </div>
      </template>

      <div class="space-y-4">
        <div class="flex items-baseline gap-2">
          <span class="font-display text-4xl sm:text-5xl font-black text-bad">
            {{ reviewData.dueTodayCount }}
          </span>
          <span class="font-display text-base font-bold text-ink">
            từ vựng đến hạn ôn hôm nay
          </span>
        </div>

        <div class="flex items-start gap-2 rounded-brut border-2 border-line bg-surface-2 p-2.5 text-xs">
          <AlertCircle class="h-4 w-4 text-bad flex-shrink-0 mt-0.5" :stroke-width="2.5" />
          <p class="font-medium text-ink-soft leading-relaxed">
            Trong đó có <strong>{{ reviewData.criticalCount }} từ</strong> thuộc nhóm nguy cơ quên cao nếu không ôn trước 24h đêm nay.
          </p>
        </div>

        <p class="text-xs text-ink-soft">
          Chuỗi ôn tập đúng hạn: <strong class="text-ink">{{ reviewData.streakReviewsDays }} ngày liên tiếp</strong>.
        </p>
      </div>

      <template #footer>
        <BaseButton
          to="/tu-vung"
          variant="primary"
          size="md"
          block
        >
          <span>Ôn tập ngay (khoảng 5 phút)</span>
          <template #right>
            <ArrowRight class="h-4 w-4" :stroke-width="2.5" />
          </template>
        </BaseButton>
      </template>
    </BaseCard>
  </div>
</template>
