<script setup lang="ts">
import { ArrowUpRight, type LucideIcon } from '@lucide/vue'

defineProps<{
  title: string
  description?: string
  feature: string
  to: string
  statBadge?: string
  icon?: LucideIcon
  colorVar?: string
}>()

// Màu chức năng chỉ dùng cho chấm tròn cạnh tiêu đề; nền tile, ô icon và stat badge giữ màu trung tính
const featureColorMap: Record<string, { bg: string; soft: string; ink: string }> = {
  'go-cau': { bg: 'var(--c-green)', soft: 'var(--c-green-soft)', ink: 'var(--c-green-ink)' },
  'video-podcast': { bg: 'var(--c-blue)', soft: 'var(--c-blue-soft)', ink: 'var(--c-blue-ink)' },
  'ngu-phap': { bg: 'var(--c-yellow)', soft: 'var(--c-yellow-soft)', ink: 'var(--c-yellow-ink)' },
  'tu-vung': { bg: 'var(--c-pink)', soft: 'var(--c-pink-soft)', ink: 'var(--c-pink-ink)' },
  'doc-dich': { bg: 'var(--c-orange)', soft: 'var(--c-orange-soft)', ink: 'var(--c-orange-ink)' },
  'tu-dien': { bg: 'var(--c-violet)', soft: 'var(--c-violet-soft)', ink: 'var(--c-violet-ink)' },
  'luyen-thi': { bg: 'var(--c-coral)', soft: 'var(--c-coral-soft)', ink: 'var(--c-coral-ink)' },
  'yeu-cau-tinh-nang': { bg: 'var(--c-cyan)', soft: 'var(--c-cyan-soft)', ink: 'var(--c-cyan-ink)' },
  'home': { bg: 'var(--c-blue)', soft: 'var(--c-blue-soft)', ink: 'var(--c-blue-ink)' },
}
</script>

<template>
  <NuxtLink
    :to="to"
    class="shadow-brut brut-press group relative flex flex-col justify-between rounded-brut-lg border-[3px] border-line bg-surface p-5 transition-all duration-100 text-decoration-none"
    :data-feature="feature"
  >
    <!-- Top Row: Icon + Stat pill -->
    <div class="flex items-center justify-between gap-3 mb-4">
      <div class="flex h-12 w-12 items-center justify-center rounded-brut border-[1px] border-line bg-surface-2 text-ink">
        <component :is="icon" v-if="icon" class="h-6 w-6" :stroke-width="2.5" aria-hidden="true" />
        <span v-else class="font-display font-black text-sm">LA</span>
      </div>

      <div
        v-if="statBadge"
        class="inline-flex items-center gap-1 rounded-brut border-[1px] border-line bg-surface-2 px-2 py-0.5 font-mono text-xs font-black text-ink"
      >
        {{ statBadge }}
      </div>
    </div>

    <!-- Middle: Title + Description -->
    <div class="space-y-1.5 flex-1">
      <div class="flex items-center justify-between">
        <h3 class="flex items-center gap-2 font-display text-lg font-black tracking-tight text-ink">
          <span
            class="h-2 w-2 shrink-0 rounded-full"
            :style="{ backgroundColor: featureColorMap[feature]?.bg || colorVar || 'var(--feature)' }"
            aria-hidden="true"
          />
          {{ title }}
        </h3>
        <ArrowUpRight class="h-4 w-4 text-ink-soft opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" :stroke-width="2.5" />
      </div>
      <p v-if="description" class="text-xs font-medium text-ink-soft line-clamp-2 leading-relaxed">
        {{ description }}
      </p>
    </div>

    <!-- Bottom: Progress or extra slot -->
    <div v-if="$slots.preview" class="mt-4 pt-3 border-t-2 border-line/20">
      <slot name="preview" />
    </div>
  </NuxtLink>
</template>
