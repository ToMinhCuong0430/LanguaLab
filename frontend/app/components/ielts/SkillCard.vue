<script setup lang="ts">
import {
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  ArrowRight,
  Target,
} from '@lucide/vue'
import type { SkillOverview } from '~/composables/useIelts'

const props = defineProps<{
  overview: SkillOverview
}>()

const getSkillIcon = (skill: string) => {
  switch (skill) {
    case 'listening': return Headphones
    case 'reading': return BookOpen
    case 'writing': return PenTool
    case 'speaking': return Mic
    default: return BookOpen
  }
}

const getToneClasses = (skill: string, tone: string) => {
  switch (skill) {
    case 'listening': return { badge: 'bg-c-blue text-white', bar: 'bg-c-blue', border: 'border-c-blue' }
    case 'reading': return { badge: 'bg-c-green text-ink', bar: 'bg-c-green', border: 'border-c-green' }
    case 'writing': return { badge: 'bg-c-orange text-ink', bar: 'bg-c-orange', border: 'border-c-orange' }
    case 'speaking': return { badge: 'bg-c-pink text-ink', bar: 'bg-c-pink', border: 'border-c-pink' }
  }
  switch (tone) {
    case 'accent': return { badge: 'bg-accent text-accent-ink', bar: 'bg-accent', border: 'border-accent' }
    case 'warn': return { badge: 'bg-warn text-on-tone', bar: 'bg-warn', border: 'border-warn' }
    case 'ok': return { badge: 'bg-ok text-on-tone', bar: 'bg-ok', border: 'border-ok' }
    case 'mark': return { badge: 'bg-mark text-on-tone', bar: 'bg-mark', border: 'border-mark' }
    default: return { badge: 'bg-surface text-ink', bar: 'bg-ink', border: 'border-line' }
  }
}

const toneStyles = computed(() => getToneClasses(props.overview.skill, props.overview.tone))
const progressPct = computed(() => Math.round((props.overview.completedTests / props.overview.totalTests) * 100))
</script>

<template>
  <div class="flex flex-col justify-between rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut transition-all hover:-translate-y-1 hover:shadow-brut-lg">
    <div class="space-y-4">
      <!-- Header thẻ: Icon + Tên kỹ năng + Badge -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-brut border-2 border-line shadow-brut-sm"
            :class="toneStyles.badge"
          >
            <component :is="getSkillIcon(overview.skill)" class="h-6 w-6" :stroke-width="2.5" />
          </div>
          <div>
            <h3 class="font-display text-lg font-black text-ink">
              {{ overview.name }}
            </h3>
            <span class="text-xs font-bold uppercase tracking-wider text-ink-soft">
              {{ overview.englishName }}
            </span>
          </div>
        </div>

        <!-- Band hiện tại -->
        <div class="text-right">
          <span class="text-[10px] font-bold uppercase tracking-wider text-ink-soft block">Ước tính</span>
          <span class="font-display text-2xl font-black text-ink">
            Band {{ overview.currentBand.toFixed(1) }}
          </span>
        </div>
      </div>

      <!-- Mô tả kỹ năng -->
      <p class="text-xs text-ink-soft font-medium leading-relaxed">
        {{ overview.description }}
      </p>

      <!-- Mục tiêu & Tiến độ hoàn thành -->
      <div class="space-y-2 border-t-2 border-line/20 pt-3">
        <div class="flex items-center justify-between text-xs font-bold text-ink">
          <span class="flex items-center gap-1">
            <Target class="h-3.5 w-3.5 text-ink-soft" :stroke-width="2.5" />
            <span>Mục tiêu: Band {{ overview.targetBand.toFixed(1) }}</span>
          </span>
          <span class="text-ink-soft">
            Đã làm {{ overview.completedTests }}/{{ overview.totalTests }} đề
          </span>
        </div>

        <!-- Thanh tiến độ -->
        <div class="h-2.5 w-full rounded border border-line bg-surface-2 overflow-hidden">
          <div
            class="h-full border-r border-line transition-all duration-300"
            :class="toneStyles.bar"
            :style="{ width: `${progressPct}%` }"
          />
        </div>
      </div>
    </div>

    <!-- Nút hành động Luyện tập -->
    <div class="pt-5 mt-auto">
      <BaseButton
        :to="`/luyen-thi/ielts/${overview.skill}`"
        variant="secondary"
        size="md"
        block
      >
        <span>Luyện tập {{ overview.englishName }}</span>
        <template #right>
          <ArrowRight class="h-4 w-4" :stroke-width="2.5" />
        </template>
      </BaseButton>
    </div>
  </div>
</template>
