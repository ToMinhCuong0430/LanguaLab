<script setup lang="ts">
import { EXAM_ANNOTATIONS_KEY } from '~/composables/useExamAnnotations'

// Một khối văn bản có thể tô sáng / ghi chú trong phòng thi.
// Nội dung text phải được render nguyên văn (không thêm ký tự) để offset khớp với vùng chọn.
const props = withDefaults(
  defineProps<{
    blockId: string
    text: string
    tag?: string
  }>(),
  { tag: 'span' },
)

const store = inject(EXAM_ANNOTATIONS_KEY, null)

interface Segment {
  text: string
  highlightId: string | null
  noteId: string | null
}

const segments = computed<Segment[]>(() => {
  const hls = store?.highlightsFor(props.blockId) || []
  const nts = store?.notesFor(props.blockId) || []
  if (!hls.length && !nts.length) return [{ text: props.text, highlightId: null, noteId: null }]

  const points = new Set<number>([0, props.text.length])
  for (const r of [...hls, ...nts]) {
    points.add(Math.max(0, Math.min(props.text.length, r.start)))
    points.add(Math.max(0, Math.min(props.text.length, r.end)))
  }
  const sorted = [...points].sort((a, b) => a - b)
  const out: Segment[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]!
    const b = sorted[i + 1]!
    if (b <= a) continue
    const hl = hls.find((r) => r.start <= a && r.end >= b)
    const nt = nts.find((r) => r.start <= a && r.end >= b)
    out.push({ text: props.text.slice(a, b), highlightId: hl?.id ?? null, noteId: nt?.id ?? null })
  }
  return out
})
</script>

<template>
  <component :is="tag" :data-annot-block="blockId"><template v-for="(seg, i) in segments" :key="i"><mark v-if="seg.highlightId || seg.noteId" class="exam-mark" :class="{ 'exam-mark--hl': seg.highlightId, 'exam-mark--note': seg.noteId }" :data-annot-hl="seg.highlightId || undefined" :data-annot-note="seg.noteId || undefined">{{ seg.text }}</mark><template v-else>{{ seg.text }}</template></template></component>
</template>

<style scoped>
.exam-mark {
  color: inherit;
  background: transparent;
  border-radius: 2px;
  cursor: pointer;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

.exam-mark--hl {
  background: var(--c-yellow-soft);
  box-shadow: inset 0 -0.45em 0 var(--c-yellow);
}

.exam-mark--note {
  text-decoration: underline dashed;
  text-decoration-color: var(--c-violet);
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}

.exam-mark--note:not(.exam-mark--hl) {
  background: var(--c-violet-soft);
}

:global([data-theme='dark']) .exam-mark--hl {
  box-shadow: inset 0 -0.2em 0 var(--c-yellow);
}
</style>
