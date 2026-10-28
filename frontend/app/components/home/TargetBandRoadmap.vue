<script setup lang="ts">
import { Target, CheckCircle2, ChevronRight, Compass } from '@lucide/vue'

const { targetBandRoadmap } = useHomeData()
</script>

<template>
  <section id="home-target-roadmap">
    <BaseCard tone="surface">
      <template #header>
        <div class="flex flex-wrap items-center justify-between w-full gap-2">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded border-2 border-line bg-warn text-on-tone">
              <Target class="h-4 w-4" :stroke-width="2.5" />
            </div>
            <span class="font-display font-black text-base sm:text-lg text-ink">
              Lộ trình đến Band mục tiêu: {{ targetBandRoadmap.examName }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <BaseBadge tone="neutral" size="sm">
              Hiện tại: {{ targetBandRoadmap.currentBand }}
            </BaseBadge>
            <span class="font-bold text-ink-soft">→</span>
            <BaseBadge tone="green" size="sm">
              Mục tiêu: {{ targetBandRoadmap.targetBand }}
            </BaseBadge>
          </div>
        </div>
      </template>

      <div class="space-y-6">
        <!-- Thanh tiến độ chính -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-bold text-ink-soft">
            <span>Tiến độ hoàn thành lộ trình</span>
            <span class="text-ink font-black text-sm">{{ targetBandRoadmap.progressPct }}%</span>
          </div>
          <BaseProgress
            :value="targetBandRoadmap.progressPct"
            :max="100"
            tone="ok"
            size="lg"
            label="Tiến độ lộ trình band điểm"
          />
        </div>

        <!-- Các mốc chặng (Milestones) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          <div
            v-for="step in targetBandRoadmap.milestones"
            :key="step.band"
            class="rounded-brut border-2 border-line p-3 transition-all"
            :class="[
              step.isCurrent
                ? 'bg-warn text-on-tone shadow-brut ring-2 ring-line'
                : step.isPassed
                  ? 'bg-surface-2 text-ink shadow-brut-sm'
                  : 'bg-surface text-ink-soft border-dashed',
            ]"
          >
            <div class="flex items-center justify-between mb-1.5">
              <span class="font-display text-base font-black">Band {{ step.band }}</span>
              <span v-if="step.isPassed && !step.isCurrent" class="text-ok">
                <CheckCircle2 class="h-4 w-4" :stroke-width="2.5" />
              </span>
              <span
                v-else-if="step.isCurrent"
                class="rounded border border-line bg-surface px-1.5 py-0.2 text-[10px] font-black text-ink"
              >
                Bạn đang ở đây
              </span>
            </div>
            <p class="text-xs font-semibold leading-snug">
              {{ step.label }}
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <p class="font-medium text-ink-soft">
            Cần tích lũy thêm khoảng <strong>120 từ vựng nâng cao</strong> và <strong>4 bài thi thử Reading/Listening</strong> để vượt mốc 6.0.
          </p>
          <NuxtLink
            to="/tu-vung"
            class="inline-flex items-center gap-1 font-display font-bold text-ink underline underline-offset-4 hover:text-accent whitespace-nowrap"
          >
            <span>Luyện từ vựng theo band</span>
            <ChevronRight class="h-3.5 w-3.5" :stroke-width="2.5" />
          </NuxtLink>
        </div>
      </template>
    </BaseCard>
  </section>
</template>
