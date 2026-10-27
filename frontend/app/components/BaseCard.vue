<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: 'surface' | 'surface-2' | 'accent' | 'ok' | 'warn' | 'bad' | 'mark' | 'feature' | 'feature-soft'
    interactive?: boolean
    flat?: boolean
    accent?: 'top' | 'left' | 'none'
    accentColor?: string
    as?: string
  }>(),
  {
    tone: 'surface',
    interactive: false,
    flat: false,
    accent: 'none',
    as: 'section',
  },
)
</script>

<template>
  <component
    :is="as"
    class="base-card"
    :class="[
      `base-card--${tone}`,
      {
        'base-card--interactive': interactive,
        'base-card--flat': flat,
        'border-t-[6px]': accent === 'top',
        'border-l-[6px]': accent === 'left',
      },
    ]"
    :style="accent !== 'none' && accentColor ? (accent === 'top' ? { borderTopColor: accentColor } : { borderLeftColor: accentColor }) : {}"
  >
    <header v-if="$slots.header" class="base-card__header">
      <slot name="header" />
    </header>

    <div class="base-card__body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="base-card__footer">
      <slot name="footer" />
    </footer>
  </component>
</template>

<style scoped>
.base-card {
  --card-bg: var(--surface);
  --card-ink: var(--ink);
  background: var(--card-bg);
  color: var(--card-ink);
  border: var(--bw) solid var(--line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
  transition: transform 0.08s ease, box-shadow 0.08s ease;
}

.base-card--surface {
  --card-bg: var(--surface);
  --card-ink: var(--ink);
}

.base-card--surface-2 {
  --card-bg: var(--surface-2);
  --card-ink: var(--ink);
}

.base-card--accent {
  --card-bg: var(--accent);
  --card-ink: var(--accent-ink);
}

.base-card--ok {
  --card-bg: var(--ok);
  --card-ink: var(--on-tone);
}

.base-card--warn {
  --card-bg: var(--warn);
  --card-ink: var(--on-tone);
}

.base-card--bad {
  --card-bg: var(--bad);
  --card-ink: var(--on-tone);
}

.base-card--mark {
  --card-bg: var(--mark);
  --card-ink: var(--on-tone);
}

.base-card--feature {
  --card-bg: var(--feature);
  --card-ink: var(--ink);
}

.base-card--feature-soft {
  --card-bg: var(--feature-soft);
  --card-ink: var(--feature-ink);
}

.base-card--flat {
  box-shadow: none;
}

.base-card--interactive {
  cursor: pointer;
}

.base-card--interactive:hover {
  transform: translate(2px, 2px);
  box-shadow: var(--shadow-sm);
}

.base-card__header {
  padding: 1rem 1.25rem;
  font-family: var(--font-display);
  font-weight: 700;
  border-bottom: var(--bw) solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.base-card__body {
  padding: 1.25rem;
}

.base-card__footer {
  padding: 0.85rem 1.25rem;
  border-top: var(--bw) solid var(--line);
}
</style>
