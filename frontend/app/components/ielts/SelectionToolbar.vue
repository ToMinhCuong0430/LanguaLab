<script setup lang="ts">
import { Highlighter, StickyNote, Eraser } from '@lucide/vue'
import { EXAM_ANNOTATIONS_KEY } from '~/composables/useExamAnnotations'

// Thanh công cụ nổi khi bôi đen văn bản trong phòng thi: Tô sáng / Ghi chú,
// hoặc khi bấm vào chỗ đã tô: Bỏ tô sáng / Mở ghi chú.
const props = defineProps<{
  // Vùng được phép tô (thường là phần thân phòng thi)
  container: HTMLElement | null
}>()

const emit = defineEmits<{ openNote: [noteId: string] }>()

const store = inject(EXAM_ANNOTATIONS_KEY)!

type Pending =
  | { kind: 'selection'; blockId: string; start: number; end: number; quote: string }
  | { kind: 'mark'; blockId: string; highlightId: string | null; noteId: string | null }

const pending = ref<Pending | null>(null)
const position = ref({ top: 0, left: 0 })
const toolbarRef = ref<HTMLElement | null>(null)

// Offset ký tự tính từ đầu khối tới (node, offset)
const offsetWithin = (root: Element, node: Node, offset: number) => {
  const range = document.createRange()
  range.selectNodeContents(root)
  range.setEnd(node, offset)
  return range.toString().length
}

const placeAbove = (rect: DOMRect) => {
  const width = 220
  const left = Math.min(Math.max(8, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 8)
  const top = rect.top > 64 ? rect.top - 52 : rect.bottom + 8
  position.value = { top, left }
}

const close = () => {
  pending.value = null
}

const blockOf = (node: Node | null) => {
  const el = node instanceof Element ? node : node?.parentElement
  return el?.closest('[data-annot-block]') || null
}

const handleSelection = () => {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || sel.rangeCount === 0 || !props.container) return false
  const range = sel.getRangeAt(0)
  if (!props.container.contains(range.commonAncestorContainer)) return false

  const startBlock = blockOf(range.startContainer)
  const endBlock = blockOf(range.endContainer)
  // Chỉ hỗ trợ tô trong một khối (một đoạn văn hoặc một câu hỏi)
  if (!startBlock || startBlock !== endBlock) return false

  const start = offsetWithin(startBlock, range.startContainer, range.startOffset)
  const end = offsetWithin(startBlock, range.endContainer, range.endOffset)
  const quote = range.toString().trim()
  if (end <= start || !quote) return false

  pending.value = { kind: 'selection', blockId: startBlock.getAttribute('data-annot-block')!, start, end, quote }
  placeAbove(range.getBoundingClientRect())
  return true
}

const onPointerUp = (e: Event) => {
  if (toolbarRef.value?.contains(e.target as Node)) return
  // Đợi trình duyệt cập nhật vùng chọn
  requestAnimationFrame(() => {
    if (handleSelection()) return
    const mark = (e.target as Element | null)?.closest?.('mark[data-annot-hl], mark[data-annot-note]')
    if (mark && props.container?.contains(mark)) {
      const block = blockOf(mark)
      if (!block) return
      pending.value = {
        kind: 'mark',
        blockId: block.getAttribute('data-annot-block')!,
        highlightId: mark.getAttribute('data-annot-hl'),
        noteId: mark.getAttribute('data-annot-note'),
      }
      placeAbove(mark.getBoundingClientRect())
      return
    }
    close()
  })
}

// Người dùng bàn phím: chọn bằng Shift + mũi tên rồi nhả phím
const onKeyUp = (e: KeyboardEvent) => {
  if (e.key === 'Escape') return close()
  if (e.shiftKey || e.key === 'Shift') handleSelection()
}

onMounted(() => {
  document.addEventListener('mouseup', onPointerUp)
  document.addEventListener('touchend', onPointerUp)
  document.addEventListener('keyup', onKeyUp)
  window.addEventListener('scroll', close, true)
})
onUnmounted(() => {
  document.removeEventListener('mouseup', onPointerUp)
  document.removeEventListener('touchend', onPointerUp)
  document.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('scroll', close, true)
})

const doHighlight = () => {
  const p = pending.value
  if (p?.kind !== 'selection') return
  store.addHighlight(p.blockId, p.start, p.end)
  window.getSelection()?.removeAllRanges()
  close()
}

const doNote = () => {
  const p = pending.value
  if (p?.kind !== 'selection') return
  const id = store.addNote({ blockId: p.blockId, start: p.start, end: p.end, quote: p.quote })
  window.getSelection()?.removeAllRanges()
  close()
  emit('openNote', id)
}

const doRemoveHighlight = () => {
  const p = pending.value
  if (p?.kind !== 'mark' || !p.highlightId) return
  store.removeHighlight(p.blockId, p.highlightId)
  close()
}

const doOpenNote = () => {
  const p = pending.value
  if (p?.kind !== 'mark' || !p.noteId) return
  close()
  emit('openNote', p.noteId)
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="pending"
      ref="toolbarRef"
      class="selection-toolbar fixed z-[60] flex items-center gap-1 rounded-brut border-2 border-line bg-surface p-1 shadow-brut"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }"
      role="toolbar"
      aria-label="Công cụ văn bản"
    >
      <template v-if="pending.kind === 'selection'">
        <button type="button" class="tb-btn" @mousedown.prevent @click="doHighlight">
          <Highlighter class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
          <span>Tô sáng</span>
        </button>
        <button type="button" class="tb-btn" @mousedown.prevent @click="doNote">
          <StickyNote class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
          <span>Ghi chú</span>
        </button>
      </template>
      <template v-else>
        <button v-if="pending.highlightId" type="button" class="tb-btn" @click="doRemoveHighlight">
          <Eraser class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
          <span>Bỏ tô sáng</span>
        </button>
        <button v-if="pending.noteId" type="button" class="tb-btn" @click="doOpenNote">
          <StickyNote class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
          <span>Xem ghi chú</span>
        </button>
      </template>
    </div>
  </Teleport>
</template>

<style scoped>
.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 10px;
  border-radius: calc(var(--radius) - 2px);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 800;
  color: var(--ink);
  cursor: pointer;
  white-space: nowrap;
}

.tb-btn:hover {
  background: var(--surface-2);
}
</style>
