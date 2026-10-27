<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string
    height?: string
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'
    variant?: 'text' | 'rect' | 'circle'
    count?: number
  }>(),
  {
    width: '100%',
    height: '1.25rem',
    rounded: 'sm',
    variant: 'rect',
    count: 1,
  },
)
</script>

<template>
  <div class="base-skeleton-wrapper">
    <div
      v-for="i in count"
      :key="i"
      class="base-skeleton animate-pulse"
      :class="[
        `base-skeleton--rounded-${rounded}`,
        { 'base-skeleton--circle': variant === 'circle' },
      ]"
      :style="{
        width: variant === 'circle' ? height : width,
        height: height,
      }"
      aria-hidden="true"
    />
  </div>
</template>

<style scoped>
.base-skeleton-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.base-skeleton {
  background: var(--surface-2);
  border: 2px solid var(--line);
  box-shadow: 2px 2px 0 var(--line);
  position: relative;
  overflow: hidden;
}

.base-skeleton--rounded-none { border-radius: 0; }
.base-skeleton--rounded-sm { border-radius: var(--radius); }
.base-skeleton--rounded-md { border-radius: var(--radius); }
.base-skeleton--rounded-lg { border-radius: var(--radius-lg); }
.base-skeleton--rounded-full { border-radius: 9999px; }
.base-skeleton--circle { border-radius: 9999px; flex-shrink: 0; }
</style>
