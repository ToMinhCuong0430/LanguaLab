<script setup lang="ts">
import type { Component } from 'vue'

export interface TabItem {
  id: string
  label: string
  icon?: Component
  count?: number | string
  badge?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    items: TabItem[]
    tone?: 'primary' | 'warning' | 'neutral'
    size?: 'sm' | 'md'
  }>(),
  {
    tone: 'warning',
    size: 'md',
  },
)

const emit = defineEmits<{
  'update:modelValue': [id: string]
  change: [id: string]
}>()

const selectTab = (item: TabItem) => {
  if (item.disabled) return
  emit('update:modelValue', item.id)
  emit('change', item.id)
}
</script>

<template>
  <div class="base-tabs" role="tablist">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      role="tab"
      :aria-selected="modelValue === item.id"
      :disabled="item.disabled"
      class="base-tab-btn"
      :class="[
        `base-tab-btn--${size}`,
        modelValue === item.id ? `base-tab-btn--active base-tab-btn--active-${tone}` : 'base-tab-btn--inactive',
      ]"
      @click="selectTab(item)"
    >
      <component :is="item.icon" v-if="item.icon" class="base-tab-icon" />
      <span>{{ item.label }}</span>
      <span
        v-if="item.count !== undefined"
        class="base-tab-count"
        :class="{ 'base-tab-count--active': modelValue === item.id }"
      >
        {{ item.count }}
      </span>
      <span v-else-if="item.badge" class="base-tab-badge">
        {{ item.badge }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.base-tabs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  scrollbar-width: thin;
}

.base-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-weight: 800;
  border: var(--bw) solid var(--line);
  border-radius: var(--radius);
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  transition: transform 0.08s ease, box-shadow 0.08s ease, background-color 0.15s ease;
  min-height: 44px; /* Touch target */
}

.base-tab-btn:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}

.base-tab-btn--sm {
  min-height: 38px;
  padding: 0.35rem 0.85rem;
  font-size: 0.8125rem;
}

.base-tab-btn--md {
  min-height: 44px;
  padding: 0.55rem 1.15rem;
  font-size: 0.9375rem;
}

.base-tab-btn--inactive {
  background: var(--surface);
  color: var(--ink-soft);
  box-shadow: none;
  border-color: var(--line);
}

.base-tab-btn--inactive:hover:not(:disabled) {
  background: var(--surface-2);
  color: var(--ink);
  transform: translateY(-1px);
}

.base-tab-btn--active {
  box-shadow: var(--shadow-sm);
  color: var(--on-tone);
  transform: translate(1px, 1px);
}

.base-tab-btn--active-warning {
  background: var(--warn);
}

.base-tab-btn--active-primary {
  background: var(--c-blue);
  color: var(--on-tone, #ffffff);
}

.base-tab-btn--active-neutral {
  background: var(--surface-2);
  color: var(--ink);
}

.base-tab-icon {
  width: 1.1em;
  height: 1.1em;
  flex-shrink: 0;
  stroke-width: 2.5;
}

.base-tab-count,
.base-tab-badge {
  font-family: monospace;
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
}

.base-tab-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
