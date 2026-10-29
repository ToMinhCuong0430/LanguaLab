<script setup lang="ts">
import { Check, ArrowUpRight, Clock } from '@lucide/vue'
import type { StudyPlanItem } from '~/composables/useProgress'
import { SKILL_LABELS } from '~/composables/useProgress'

// Một mục trong lộ trình: ô đánh dấu hoàn thành + nội dung + nút mở bài luyện tương ứng
const props = defineProps<{ item: StudyPlanItem }>()
const emit = defineEmits<{ toggle: [item: StudyPlanItem, done: boolean] }>()

const TYPE_LABEL: Record<StudyPlanItem['item_type'], string> = {
  practice: 'Luyện dạng yếu',
  skill_building: 'Bổ trợ',
  mock_test: 'Thi thử',
  review: 'Xem lại',
}

const done = computed(() => Boolean(props.item.completed_at))
</script>

<template>
  <li
    class="flex items-start gap-3 rounded-brut border-2 p-3 transition-colors"
    :class="done ? 'border-line/40 bg-surface-2' : 'border-line bg-surface'"
  >
    <button
      type="button"
      role="checkbox"
      class="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-brut border-2 border-line cursor-pointer"
      :class="done ? 'bg-ok text-on-tone' : 'bg-surface'"
      :aria-checked="done"
      :aria-label="`${done ? 'Bỏ đánh dấu' : 'Đánh dấu đã hoàn thành'}: ${item.title}`"
      @click="emit('toggle', item, !done)"
    >
      <Check v-if="done" class="h-4 w-4" :stroke-width="3" aria-hidden="true" />
    </button>

    <div class="min-w-0 flex-1 space-y-1">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span class="rounded border border-line bg-surface-2 px-1.5 text-[10px] font-black text-ink">{{ TYPE_LABEL[item.item_type] }}</span>
        <span v-if="item.skill" class="text-[11px] font-bold text-ink-soft">{{ SKILL_LABELS[item.skill] }}</span>
        <span class="inline-flex items-center gap-1 text-[11px] text-ink-soft">
          <Clock class="h-3 w-3" aria-hidden="true" /> {{ item.estimated_minutes }} phút
        </span>
      </div>
      <p class="text-sm font-bold text-ink" :class="{ 'line-through decoration-2 text-ink-soft': done }">{{ item.title }}</p>
      <p class="text-xs leading-relaxed text-ink-soft max-w-[70ch]">{{ item.description }}</p>
    </div>

    <NuxtLink
      v-if="item.link"
      :to="item.link"
      class="flex h-11 min-w-[44px] flex-shrink-0 items-center justify-center gap-1 rounded-brut border-2 border-line bg-surface-2 px-2.5 text-xs font-black text-ink hover:bg-surface"
      :aria-label="`Mở bài: ${item.title}`"
    >
      <span class="hidden sm:inline">Bắt đầu</span>
      <ArrowUpRight class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
    </NuxtLink>
  </li>
</template>
