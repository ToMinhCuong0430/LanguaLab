<script setup lang="ts">
import { X, Plus, Trash2, StickyNote } from '@lucide/vue'
import { EXAM_ANNOTATIONS_KEY } from '~/composables/useExamAnnotations'

// Khung ghi chú bên phải phòng thi. Không chặn bài làm (không phải modal).
const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ focusNoteId?: string | null }>()

const store = inject(EXAM_ANNOTATIONS_KEY)!
const sortedNotes = computed(() => [...store.notes.value].sort((a, b) => a.createdAt - b.createdAt))

const panelRef = ref<HTMLElement | null>(null)

const focusNote = (id: string) => {
  nextTick(() => {
    const el = document.getElementById(`exam-note-${id}`) as HTMLTextAreaElement | null
    el?.focus()
    el?.scrollIntoView({ block: 'nearest' })
  })
}

watch(
  () => [open.value, props.focusNoteId] as const,
  ([isOpen, id]) => {
    if (isOpen && id) focusNote(id)
  },
)

const addGeneralNote = () => {
  const id = store.addNote({ blockId: null })
  focusNote(id)
}

const blockLabel = (blockId: string | null) => {
  if (!blockId) return 'Ghi chú chung'
  if (blockId.startsWith('p-')) return `Đoạn ${String.fromCharCode(65 + Number(blockId.slice(2)))}`
  if (blockId.startsWith('q-')) return `Câu ${blockId.slice(2)}`
  return 'Ghi chú'
}
</script>

<template>
  <aside
    v-if="open"
    ref="panelRef"
    class="notes-panel fixed z-50 flex flex-col border-[3px] border-line bg-surface shadow-brut-lg"
    aria-label="Ghi chú bài làm"
    @keydown.esc="open = false"
  >
    <header class="flex items-center justify-between gap-2 border-b-[3px] border-line px-4 py-3">
      <h2 class="flex items-center gap-2 font-display text-base font-black text-ink">
        <StickyNote class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
        Ghi chú ({{ sortedNotes.length }})
      </h2>
      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-brut border-2 border-line bg-surface-2 text-ink cursor-pointer"
        aria-label="Đóng ghi chú"
        @click="open = false"
      >
        <X class="h-4 w-4" :stroke-width="2.5" />
      </button>
    </header>

    <div class="flex-1 overflow-y-auto p-3 space-y-3">
      <p v-if="!sortedNotes.length" class="px-1 py-4 text-sm text-ink-soft">
        Bôi đen một câu trong bài rồi chọn "Ghi chú", hoặc thêm ghi chú chung bên dưới. Ghi chú chỉ lưu trên máy này cho lượt làm bài hiện tại.
      </p>
      <article
        v-for="note in sortedNotes"
        :key="note.id"
        class="rounded-brut border-2 border-line bg-surface-2 p-3 space-y-2"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-black text-ink">{{ blockLabel(note.blockId) }}</span>
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-brut text-ink-soft hover:text-bad cursor-pointer"
            :aria-label="`Xoá ghi chú ${blockLabel(note.blockId)}`"
            @click="store.removeNote(note.id)"
          >
            <Trash2 class="h-4 w-4" :stroke-width="2.5" />
          </button>
        </div>
        <blockquote v-if="note.quote" class="border-l-4 pl-2.5 text-xs italic leading-relaxed text-ink" style="border-color: var(--c-violet)">
          {{ note.quote }}
        </blockquote>
        <label :for="`exam-note-${note.id}`" class="sr-only">Nội dung ghi chú</label>
        <textarea
          :id="`exam-note-${note.id}`"
          :value="note.text"
          rows="3"
          class="w-full rounded-brut border-2 border-line bg-surface p-2 text-sm leading-relaxed text-ink outline-none focus:shadow-brut-sm"
          placeholder="Viết ghi chú..."
          @input="store.updateNote(note.id, ($event.target as HTMLTextAreaElement).value)"
        />
      </article>
    </div>

    <footer class="border-t-[3px] border-line p-3">
      <button
        type="button"
        class="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-brut border-2 border-line bg-surface font-display text-sm font-black text-ink shadow-brut-sm brut-press cursor-pointer"
        @click="addGeneralNote"
      >
        <Plus class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
        Thêm ghi chú chung
      </button>
    </footer>
  </aside>
</template>

<style scoped>
.notes-panel {
  right: 12px;
  top: 88px;
  bottom: 104px;
  width: min(360px, calc(100vw - 24px));
  border-radius: var(--radius-lg);
}

@media (max-width: 640px) {
  .notes-panel {
    right: 8px;
    left: 8px;
    width: auto;
    top: auto;
    height: 60vh;
  }
}
</style>
