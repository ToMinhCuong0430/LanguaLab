<script setup lang="ts">
import { Hammer } from '@lucide/vue'

defineProps<{
  size?: 'xs' | 'sm' | 'md'
}>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1 font-black rounded-brut border border-line bg-warn/20 text-ink shadow-[1px_1px_0_var(--line)] whitespace-nowrap"
    :class="[
      size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : (size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'),
    ]"
  >
    <Hammer class="h-3 w-3 text-warn-ink stroke-[2.5]" />
    <span>Đang phát triển</span>
  </span>
</template>
