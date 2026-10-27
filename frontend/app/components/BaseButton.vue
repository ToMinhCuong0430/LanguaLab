<script setup lang="ts">
import { Loader2 } from '@lucide/vue'

type ButtonVariant = 'primary' | 'secondary' | 'neutral' | 'danger' | 'warning' | 'success' | 'ghost'
type LegacyTone = 'warn' | 'ok' | 'bad' | 'accent' | 'surface'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    tone?: ButtonVariant | LegacyTone
    size?: 'sm' | 'md' | 'lg'
    to?: string | Record<string, any>
    block?: boolean
    disabled?: boolean
    loading?: boolean
    type?: 'button' | 'submit' | 'reset'
    ariaLabel?: string
  }>(),
  {
    variant: 'primary',
    size: 'md',
    type: 'button',
    disabled: false,
    loading: false,
    block: false,
  },
)

const NuxtLink = resolveComponent('NuxtLink')
const tag = computed(() => (props.to ? NuxtLink : 'button'))

const LEGACY_MAP: Record<string, ButtonVariant> = {
  warn: 'warning',
  ok: 'success',
  bad: 'danger',
  accent: 'primary',
  surface: 'secondary',
}

const resolvedVariant = computed<ButtonVariant>(() => {
  if (props.tone) {
    return LEGACY_MAP[props.tone] || (props.tone as ButtonVariant)
  }
  return props.variant
})

const attrs = computed(() =>
  props.to
    ? { to: props.to, 'aria-label': props.ariaLabel }
    : { type: props.type, disabled: props.disabled || props.loading, 'aria-label': props.ariaLabel },
)
</script>

<template>
  <component
    :is="tag"
    v-bind="attrs"
    class="base-btn"
    :class="[
      `base-btn--${resolvedVariant}`,
      `base-btn--${size}`,
      {
        'base-btn--block': block,
        'base-btn--loading': loading,
      },
    ]"
  >
    <Loader2 v-if="loading" class="w-4 h-4 animate-spin shrink-0 stroke-[2.5]" />
    <slot v-else name="left" />
    <span :class="{ 'opacity-90': loading }"><slot /></span>
    <slot v-if="!loading" name="right" />
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

.base-btn:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}

.base-btn:hover:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: var(--shadow-sm);
}

.base-btn:active:not(:disabled) {
  transform: translate(4px, 4px);
  box-shadow: 0 0 0 var(--line);
}

/* Kích cỡ (Touch target >= 44px chuẩn ui-ux-pro-max) */
.base-btn--sm {
  min-height: 44px;
  min-width: 44px;
  padding: 0.45rem 0.95rem;
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

.base-btn--loading {
  cursor: wait;
}

/* Các biến thể màu Neo-brutalism */
.base-btn--primary {
  background: var(--c-yellow);
  color: var(--on-tone);
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

.base-btn--success {
  background: var(--ok);
  color: var(--on-tone);
}

.base-btn--danger {
  background: var(--bad);
  color: var(--on-tone, #ffffff);
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
