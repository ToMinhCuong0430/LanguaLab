<script setup lang="ts">
import type { Component } from 'vue'
import { Inbox } from '@lucide/vue'

withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: Component
    tone?: 'neutral' | 'accent' | 'warning'
  }>(),
  {
    title: 'Chưa có dữ liệu',
    description: 'Nội dung này hiện đang trống hoặc chưa được kích hoạt.',
    icon: Inbox,
    tone: 'neutral',
  },
)
</script>

<template>
  <div class="base-empty-state" :class="`base-empty-state--${tone}`">
    <div class="base-empty-state__icon-box">
      <component :is="icon" class="base-empty-state__icon" />
    </div>

    <h3 class="base-empty-state__title">{{ title }}</h3>
    <p v-if="description" class="base-empty-state__desc">{{ description }}</p>

    <div v-if="$slots.action" class="base-empty-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.base-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--surface);
  border: var(--bw) dashed var(--line);
  border-radius: var(--radius-lg);
  color: var(--ink);
}

.base-empty-state__icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border: var(--bw) solid var(--line);
  border-radius: var(--radius);
  background: var(--surface-2);
  box-shadow: var(--shadow-sm);
  margin-bottom: 1.25rem;
}

.base-empty-state--accent .base-empty-state__icon-box {
  background: var(--c-blue-soft);
  color: var(--c-blue-ink);
}

.base-empty-state--warning .base-empty-state__icon-box {
  background: var(--c-yellow-soft);
  color: var(--c-yellow-ink);
}

.base-empty-state__icon {
  width: 32px;
  height: 32px;
  stroke-width: 2.2;
}

.base-empty-state__title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
}

.base-empty-state__desc {
  font-size: 0.875rem;
  color: var(--ink-soft);
  max-width: 24rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.base-empty-state__action {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
</style>
