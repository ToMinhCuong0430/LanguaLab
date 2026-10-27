<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    badgeText?: string
    badgeTone?: 'warn' | 'accent' | 'ok' | 'bad' | 'mark' | 'feature'
    feature?: string
  }>(),
  {
    badgeTone: 'warn',
  },
)
</script>

<template>
  <section
    class="relative overflow-hidden border-[3px] border-line rounded-brut-lg shadow-brut"
    :data-feature="feature"
    :style="feature ? { backgroundColor: 'var(--feature)', color: 'var(--ink)' } : { backgroundColor: 'var(--surface)' }"
  >
    <div class="flex flex-col sm:flex-row sm:items-stretch justify-between gap-0">
      <!-- Left content -->
      <div class="flex-1 p-5 sm:p-7">
        <div class="flex items-start gap-3.5">
          <!-- Icon chip -->
          <div
            v-if="$slots.icon"
            class="flex-shrink-0 p-2.5 rounded-brut border-2 border-line bg-surface text-ink shadow-brut-sm"
          >
            <slot name="icon" />
          </div>

          <div class="space-y-2 flex-1">
            <!-- Badge -->
            <div v-if="badgeText" class="inline-block">
              <span
                class="inline-flex items-center gap-1.5 font-display text-xs font-black uppercase tracking-wide px-2.5 py-1 rounded-brut border-2 border-line shadow-[2px_2px_0_var(--line)]"
                :style="feature ? { backgroundColor: 'rgba(0,0,0,0.12)', color: 'var(--ink)' } : { backgroundColor: 'var(--warn)', color: 'var(--on-tone)' }"
              >
                {{ badgeText }}
              </span>
            </div>

            <h1
              class="text-2xl sm:text-3xl font-black tracking-tight"
              :style="feature ? { color: 'var(--ink)' } : { color: 'var(--ink)' }"
            >
              {{ title }}
            </h1>

            <p
              v-if="description"
              class="text-sm sm:text-base max-w-2xl font-medium leading-relaxed"
              :style="feature ? { color: 'rgba(17,20,29,0.85)' } : { color: 'var(--ink-soft)' }"
            >
              {{ description }}
            </p>

            <!-- Stats slot -->
            <div v-if="$slots.stats" class="flex flex-wrap gap-3 pt-1">
              <slot name="stats" />
            </div>
          </div>
        </div>

        <!-- Actions slot -->
        <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2.5 mt-4">
          <slot name="actions" />
        </div>
      </div>

      <!-- Illustration slot (right side, hidden on mobile) -->
      <div
        v-if="$slots.illustration"
        class="hidden sm:flex items-center justify-center px-6 border-l-[3px] border-line"
        :style="feature ? { backgroundColor: 'rgba(0,0,0,0.08)' } : { backgroundColor: 'var(--surface-2)' }"
      >
        <slot name="illustration" />
      </div>
    </div>

    <!-- Extra slot -->
    <div v-if="$slots.extra" class="px-5 sm:px-7 pb-5 sm:pb-7 pt-0 border-t-2 border-line/30 mt-0">
      <slot name="extra" />
    </div>
  </section>
</template>
