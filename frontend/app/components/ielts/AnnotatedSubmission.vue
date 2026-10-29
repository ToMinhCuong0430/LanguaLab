<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import type { AiSuggestion } from '~/composables/useAiScoring'
import { CRITERIA_META } from '~/composables/useAiScoring'

const props = defineProps<{
  text: string
  suggestions: AiSuggestion[]
  title: string
}>()

const activeIndex = ref<number | null>(null)

const toneVars = (criterion: string) => {
  const tone = CRITERIA_META[criterion]?.tone || 'yellow'
  return {
    '--hl': `var(--c-${tone})`,
    '--hl-soft': `var(--c-${tone}-soft)`,
    '--hl-ink': `var(--c-${tone}-ink)`,
  }
}

// Tìm vị trí từng lỗi trong bài (theo thứ tự xuất hiện, không chồng lấn) để tô màu
const located = computed(() => {
  const ranges: { start: number; end: number; index: number }[] = []
  const lower = props.text.toLowerCase()
  let cursor = 0
  props.suggestions.forEach((s, index) => {
    const needle = s.original.trim()
    if (!needle) return
    let start = props.text.indexOf(needle, cursor)
    if (start < 0) start = lower.indexOf(needle.toLowerCase(), cursor)
    if (start < 0) start = lower.indexOf(needle.toLowerCase())
    if (start < 0) return
    const end = start + needle.length
    if (ranges.some((r) => start < r.end && end > r.start)) return
    ranges.push({ start, end, index })
    cursor = end
  })
  return ranges.sort((a, b) => a.start - b.start)
})

const segments = computed(() => {
  const out: { text: string; index: number | null }[] = []
  let pos = 0
  for (const r of located.value) {
    if (r.start > pos) out.push({ text: props.text.slice(pos, r.start), index: null })
    out.push({ text: props.text.slice(r.start, r.end), index: r.index })
    pos = r.end
  }
  if (pos < props.text.length) out.push({ text: props.text.slice(pos), index: null })
  return out
})

// Số thứ tự hiển thị theo vị trí trong bài; lỗi không tìm thấy trong bài xếp cuối
const displayOrder = computed(() => {
  const order = located.value.map((r) => r.index)
  props.suggestions.forEach((_, i) => {
    if (!order.includes(i)) order.push(i)
  })
  return order
})
const numberOf = (index: number) => displayOrder.value.indexOf(index) + 1
const isLocated = (index: number) => located.value.some((r) => r.index === index)

const select = (index: number) => {
  activeIndex.value = activeIndex.value === index ? null : index
  if (activeIndex.value === null || !import.meta.client) return
  nextTick(() => {
    document.getElementById(`fix-${index}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    document.getElementById(`mark-${index}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  })
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
    <!-- Bài làm có tô lỗi -->
    <section class="lg:col-span-7 rounded-brut-lg border-[3px] border-line bg-surface shadow-brut">
      <header class="flex items-center justify-between gap-3 border-b-[3px] border-line px-5 py-3">
        <h3 class="font-display text-base font-black text-ink">{{ title }}</h3>
        <span class="text-xs font-bold text-ink-soft">{{ located.length }} chỗ cần sửa được đánh dấu</span>
      </header>
      <div class="max-h-[560px] overflow-y-auto px-5 py-4">
        <p class="whitespace-pre-wrap text-[15px] leading-8 text-ink max-w-[68ch]">
          <template v-for="(seg, i) in segments" :key="i">
            <span v-if="seg.index === null">{{ seg.text }}</span>
            <button
              v-else
              :id="`mark-${seg.index}`"
              type="button"
              class="annotated-mark"
              :class="{ 'annotated-mark--active': activeIndex === seg.index }"
              :style="toneVars(suggestions[seg.index].criterion)"
              :aria-pressed="activeIndex === seg.index"
              :aria-label="`Lỗi ${numberOf(seg.index)}: ${seg.text}. Sửa thành ${suggestions[seg.index].correction}`"
              @click="select(seg.index)"
            >{{ seg.text }}<sup class="annotated-mark__num">{{ numberOf(seg.index) }}</sup></button>
          </template>
        </p>
      </div>
    </section>

    <!-- Danh sách sửa lỗi -->
    <section class="lg:col-span-5 rounded-brut-lg border-[3px] border-line bg-surface-2 shadow-brut">
      <header class="border-b-[3px] border-line px-5 py-3">
        <h3 class="font-display text-base font-black text-ink">Lỗi và cách sửa</h3>
      </header>
      <p v-if="!suggestions.length" class="px-5 py-6 text-sm text-ink-soft">
        Không có lỗi đáng kể nào cần sửa trong bài này.
      </p>
      <ol v-else class="max-h-[560px] overflow-y-auto p-3 space-y-2.5">
        <li
          v-for="index in displayOrder"
          :id="`fix-${index}`"
          :key="index"
        >
          <button
            type="button"
            class="fix-item w-full text-left rounded-brut border-2 bg-surface p-3 cursor-pointer"
            :class="activeIndex === index ? 'border-line shadow-brut-sm' : 'border-transparent hover:border-line'"
            :style="toneVars(suggestions[index].criterion)"
            :aria-pressed="activeIndex === index"
            @click="select(index)"
          >
            <div class="flex items-start gap-2.5">
              <span class="fix-item__num">{{ numberOf(index) }}</span>
              <div class="min-w-0 flex-1 space-y-1.5">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span class="font-semibold text-ink line-through decoration-2 decoration-bad">{{ suggestions[index].original }}</span>
                  <ArrowRight class="h-3.5 w-3.5 text-ink-soft flex-shrink-0" :stroke-width="2.5" aria-hidden="true" />
                  <span class="font-bold text-ink">{{ suggestions[index].correction }}</span>
                </div>
                <p class="text-xs leading-relaxed text-ink-soft">{{ suggestions[index].explanation }}</p>
                <p class="text-[11px] font-bold" :style="{ color: 'var(--hl-ink)' }">
                  {{ CRITERIA_META[suggestions[index].criterion]?.label }}
                  <span v-if="!isLocated(index)" class="font-medium text-ink-soft"> (không tìm thấy nguyên văn trong bài)</span>
                </p>
              </div>
            </div>
          </button>
        </li>
      </ol>
    </section>
  </div>
</template>

<style scoped>
.annotated-mark {
  display: inline;
  padding: 0 2px;
  margin: 0 1px;
  border-radius: 3px;
  background: var(--hl-soft);
  color: inherit;
  font: inherit;
  line-height: inherit;
  text-decoration: underline;
  text-decoration-color: var(--hl);
  text-decoration-thickness: 3px;
  text-underline-offset: 4px;
  cursor: pointer;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

.annotated-mark--active {
  background: var(--hl);
  color: var(--on-tone);
  text-decoration-color: var(--line);
  outline: 2px solid var(--line);
}

.annotated-mark__num {
  margin-left: 2px;
  font-family: var(--font-display);
  font-size: 0.65em;
  font-weight: 800;
  color: var(--hl-ink);
}

.annotated-mark--active .annotated-mark__num {
  color: var(--on-tone);
}

.fix-item__num {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 2px solid var(--line);
  border-radius: var(--radius);
  background: var(--hl);
  color: var(--on-tone);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 800;
}
</style>
