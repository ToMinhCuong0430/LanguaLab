<script setup lang="ts">
import type { Component } from 'vue'

type NewTone = 'neutral' | 'blue' | 'green' | 'yellow' | 'pink' | 'orange' | 'violet' | 'coral' | 'cyan'
// Legacy tone names — mapped in computed below
type LegacyTone = 'surface' | 'surface-2' | 'accent' | 'ok' | 'warn' | 'bad' | 'mark' | 'feature'

const props = withDefaults(
  defineProps<{
    /** Named color tone (new API: neutral/blue/green/…; legacy: warn/ok/accent/…) */
    tone?: NewTone | LegacyTone
    /** Visual variant:
     *  soft    = soft-bg + ink text (default)
     *  solid   = full-color bg + dark/white text
     *  outline = transparent bg, dashed border ("Sắp ra mắt")
     */
    variant?: 'soft' | 'solid' | 'outline'
    /** sm = 20 px height / 11 px text; md = 24 px / 12 px */
    size?: 'sm' | 'md'
    /** Lucide icon component */
    icon?: Component
    /** ALL-CAPS text */
    uppercase?: boolean
  }>(),
  {
    tone: 'neutral',
    variant: 'soft',
    size: 'md',
    uppercase: false,
  },
)

/** Map legacy tone names → new tone names */
const LEGACY_MAP: Record<string, NewTone> = {
  'surface':   'neutral',
  'surface-2': 'neutral',
  'accent':    'yellow',
  'ok':        'green',
  'warn':      'yellow',
  'bad':       'coral',
  'mark':      'orange',
  'feature':   'blue',
}

const resolvedTone = computed<NewTone>(() =>
  (LEGACY_MAP[props.tone as string] ?? props.tone) as NewTone,
)
</script>

<template>
  <span
    class="base-badge"
    :class="[
      `base-badge--${resolvedTone}`,
      `base-badge--${variant}`,
      `base-badge--${size}`,
      { 'base-badge--upper': uppercase },
    ]"
  >
    <component :is="icon" v-if="icon" class="base-badge__icon" />
    <slot />
  </span>
</template>

<style scoped>
/* ─── Base ─────────────────────────────────────────────── */
.base-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--font-display);
  font-weight: 700;
  line-height: 1;
  border-radius: var(--radius);
  white-space: nowrap;
  border: 2px solid var(--line);
  transition: background 0.15s, color 0.15s;
}

.base-badge--upper {
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ─── Sizes ─────────────────────────────────────────────── */
.base-badge--sm {
  height: 20px;
  padding: 0 0.45rem;
  font-size: 0.6875rem; /* 11px */
}
.base-badge--md {
  height: 24px;
  padding: 0 0.6rem;
  font-size: 0.75rem; /* 12px */
}

.base-badge__icon {
  width: 0.9em;
  height: 0.9em;
  flex-shrink: 0;
}

/* ─── Variant: outline (dashed, for "Sắp ra mắt") ─────── */
.base-badge--outline {
  background: transparent;
  border-style: dashed;
  color: var(--ink-soft);
}

/* ═══════════════════════════════════════════════════════
   TONE × VARIANT combos
   ═══════════════════════════════════════════════════════ */

/* neutral */
.base-badge--neutral.base-badge--soft   { background: var(--surface-2); color: var(--ink); }
.base-badge--neutral.base-badge--solid  { background: var(--ink-soft);  color: var(--surface); }
.base-badge--neutral.base-badge--outline{ color: var(--ink-soft); }

/* green */
.base-badge--green.base-badge--soft     { background: var(--c-green-soft); color: var(--c-green-ink); }
.base-badge--green.base-badge--solid    { background: var(--c-green);      color: #11141D; }
.base-badge--green.base-badge--outline  { color: var(--c-green-ink); }

/* blue */
.base-badge--blue.base-badge--soft      { background: var(--c-blue-soft); color: var(--c-blue-ink); }
.base-badge--blue.base-badge--solid     { background: var(--c-blue);      color: #FFFFFF; }
.base-badge--blue.base-badge--outline   { color: var(--c-blue-ink); }

/* yellow */
.base-badge--yellow.base-badge--soft    { background: var(--c-yellow-soft); color: var(--c-yellow-ink); }
.base-badge--yellow.base-badge--solid   { background: var(--c-yellow);      color: #11141D; }
.base-badge--yellow.base-badge--outline { color: var(--c-yellow-ink); }

/* pink */
.base-badge--pink.base-badge--soft      { background: var(--c-pink-soft); color: var(--c-pink-ink); }
.base-badge--pink.base-badge--solid     { background: var(--c-pink);      color: #FFFFFF; }
.base-badge--pink.base-badge--outline   { color: var(--c-pink-ink); }

/* orange */
.base-badge--orange.base-badge--soft    { background: var(--c-orange-soft); color: var(--c-orange-ink); }
.base-badge--orange.base-badge--solid   { background: var(--c-orange);      color: #11141D; }
.base-badge--orange.base-badge--outline { color: var(--c-orange-ink); }

/* violet */
.base-badge--violet.base-badge--soft    { background: var(--c-violet-soft); color: var(--c-violet-ink); }
.base-badge--violet.base-badge--solid   { background: var(--c-violet);      color: #FFFFFF; }
.base-badge--violet.base-badge--outline { color: var(--c-violet-ink); }

/* coral */
.base-badge--coral.base-badge--soft     { background: var(--c-coral-soft); color: var(--c-coral-ink); }
.base-badge--coral.base-badge--solid    { background: var(--c-coral);      color: #FFFFFF; }
.base-badge--coral.base-badge--outline  { color: var(--c-coral-ink); }

/* cyan */
.base-badge--cyan.base-badge--soft      { background: var(--c-cyan-soft); color: var(--c-cyan-ink); }
.base-badge--cyan.base-badge--solid     { background: var(--c-cyan);      color: #11141D; }
.base-badge--cyan.base-badge--outline   { color: var(--c-cyan-ink); }
</style>

