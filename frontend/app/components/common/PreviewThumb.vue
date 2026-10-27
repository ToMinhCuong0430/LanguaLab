<script setup lang="ts">
import { Play, Headphones, Radio } from '@lucide/vue'
import { levelBadge } from '~/constants/badges'

const props = withDefaults(
  defineProps<{
    src?: string
    alt?: string
    duration?: string
    level?: string
    type?: 'video' | 'podcast'
    aspectRatio?: '16:9' | '4:3' | '1:1'
  }>(),
  {
    type: 'video',
    aspectRatio: '16:9',
  },
)

const hasError = ref(false)
const handleImageError = () => {
  hasError.value = true
}
</script>

<template>
  <div
    class="relative w-full overflow-hidden rounded-brut border-2 border-line bg-surface-2 shadow-brut-sm group-hover:border-line"
    :class="[
      aspectRatio === '16:9' ? 'aspect-video' : '',
      aspectRatio === '4:3' ? 'aspect-[4/3]' : '',
      aspectRatio === '1:1' ? 'aspect-square' : '',
    ]"
  >
    <!-- Actual Image -->
    <img
      v-if="src && !hasError"
      :src="src"
      :alt="alt || 'Preview thumbnail'"
      loading="lazy"
      class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
      @error="handleImageError"
    >

    <!-- Fallback Illustration / Placeholder -->
    <div
      v-else
      class="flex h-full w-full flex-col items-center justify-center p-4 text-center"
      :style="{ backgroundColor: type === 'podcast' ? 'var(--c-violet-soft)' : 'var(--c-blue-soft)' }"
    >
      <div
        class="flex h-12 w-12 items-center justify-center rounded-brut border-2 border-line mb-2 shadow-brut-sm"
        :style="{ backgroundColor: type === 'podcast' ? 'var(--c-violet)' : 'var(--c-blue)' }"
      >
        <Headphones v-if="type === 'podcast'" class="h-6 w-6 text-white" :stroke-width="2.5" />
        <Radio v-else class="h-6 w-6 text-white" :stroke-width="2.5" />
      </div>
      <span class="font-display text-xs font-black uppercase text-ink line-clamp-1">
        {{ type === 'podcast' ? 'Podcast Audio' : 'Video Song Ngữ' }}
      </span>
    </div>

    <!-- Play Button Overlay -->
    <div class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity group-hover:bg-black/20">
      <div class="flex h-10 w-10 items-center justify-center rounded-brut border-2 border-line bg-warn text-on-tone shadow-brut-sm transition-transform group-hover:scale-110">
        <Play class="h-5 w-5 fill-current ml-0.5" :stroke-width="2.5" />
      </div>
    </div>

    <!-- Top Left Badge: Level -->
    <div v-if="level" class="absolute left-2 top-2">
      <BaseBadge v-bind="levelBadge(level)" size="sm">{{ level }}</BaseBadge>
    </div>

    <!-- Bottom Right: Duration -->
    <div v-if="duration" class="absolute bottom-2 right-2">
      <span class="rounded-brut border border-line bg-ink px-1.5 py-0.5 font-mono text-[11px] font-bold text-white shadow-[1px_1px_0_var(--line)]">
        {{ duration }}
      </span>
    </div>
  </div>
</template>
