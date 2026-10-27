<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value: number
    max?: number
    tone?: 'accent' | 'ok' | 'warn' | 'bad' | 'mark'
    size?: 'sm' | 'md' | 'lg'
    label?: string
  }>(),
  { max: 100, tone: 'accent', size: 'md' },
)

const pct = computed(() => Math.min(100, Math.max(0, (props.value / props.max) * 100)))
</script>

<template>
  <div
    class="base-progress"
    :class="[`base-progress--${tone}`, `base-progress--${size}`]"
    role="progressbar"
    :aria-valuenow="value"
    aria-valuemin="0"
    :aria-valuemax="max"
    :aria-label="label"
  >
    <div
      class="base-progress__fill"
      :class="{ 'is-empty': pct === 0, 'is-full': pct === 100 }"
      :style="{ width: pct + '%' }"
    />
  </div>
</template>

<style scoped>
.base-progress {
  background: var(--surface);
  border: var(--bw) solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
}

.base-progress--sm { height: 14px; }
.base-progress--md { height: 22px; }
.base-progress--lg { height: 32px; }

.base-progress__fill {
  height: 100%;
  background: var(--accent);
  border-right: var(--bw) solid var(--line);
  transition: width 0.3s ease;
}

.base-progress__fill.is-empty,
.base-progress__fill.is-full {
  border-right: 0;
}

.base-progress--ok .base-progress__fill { background: var(--ok); }
.base-progress--warn .base-progress__fill { background: var(--warn); }
.base-progress--bad .base-progress__fill { background: var(--bad); }
.base-progress--mark .base-progress__fill { background: var(--mark); }
</style>
