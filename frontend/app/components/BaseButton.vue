<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'neutral' | 'danger' | 'warning' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    to?: string | Record<string, any>
    block?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    block: false,
  },
)

const NuxtLink = resolveComponent('NuxtLink')
const tag = computed(() => (props.to ? NuxtLink : 'button'))
const attrs = computed(() =>
  props.to
    ? { to: props.to }
    : { type: props.type, disabled: props.disabled },
)
</script>

<template>
  <component
    :is="tag"
    v-bind="attrs"
    class="base-btn"
    :class="[
      `base-btn--${variant}`,
      `base-btn--${size}`,
      { 'base-btn--block': block },
    ]"
  >
    <slot name="left" />
    <span><slot /></span>
    <slot name="right" />
  </component>
</template>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  border: var(--bw) solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  cursor: pointer;
  user-select: none;
  transition: transform 0.08s ease, box-shadow 0.08s ease, background-color 0.15s ease;
  white-space: nowrap;
}

.base-btn:hover:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: var(--shadow-sm);
}

.base-btn:active:not(:disabled) {
  transform: translate(4px, 4px);
  box-shadow: 0 0 0 var(--line);
}

/* Kích cỡ */
.base-btn--sm {
  min-height: 36px;
  padding: 0.4rem 0.85rem;
  font-size: 0.875rem;
}

.base-btn--md {
  min-height: 44px;
  padding: 0.65rem 1.25rem;
  font-size: 1rem;
}

.base-btn--lg {
  min-height: 52px;
  padding: 0.85rem 1.75rem;
  font-size: 1.125rem;
}

.base-btn--block {
  display: flex;
  width: 100%;
}

/* Các biến thể màu Neo-brutalism */
.base-btn--primary {
  background: var(--accent);
  color: var(--accent-ink);
}

.base-btn--secondary {
  background: var(--surface);
  color: var(--ink);
}

.base-btn--neutral {
  background: var(--surface-2);
  color: var(--ink);
}

.base-btn--warning {
  background: var(--warn);
  color: var(--on-tone);
}

.base-btn--danger {
  background: var(--bad);
  color: var(--on-tone);
}

.base-btn--ghost {
  background: transparent;
  color: var(--ink);
  border-color: transparent;
  box-shadow: none;
}

.base-btn--ghost:hover:not(:disabled) {
  background: var(--surface-2);
  border-color: var(--line);
  transform: none;
  box-shadow: none;
}

.base-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}
</style>
