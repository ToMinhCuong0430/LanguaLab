import type { InjectionKey } from 'vue'

// Tô sáng và ghi chú trong phòng thi, lưu tạm theo lượt làm bài (localStorage theo testId).
// Vị trí được tính theo offset ký tự trong từng khối văn bản (đoạn văn / câu hỏi).

export interface TextRange {
  id: string
  start: number
  end: number
}

export interface ExamNote {
  id: string
  blockId: string | null // null = ghi chú chung, không gắn với đoạn văn nào
  start: number
  end: number
  quote: string
  text: string
  createdAt: number
}

interface StoredAnnotations {
  highlights: Record<string, TextRange[]>
  notes: ExamNote[]
}

const STORAGE_PREFIX = 'langua-exam-annotations:'

const newId = () => Math.random().toString(36).slice(2, 10)

export const useExamAnnotations = (testId: string) => {
  const highlights = ref<Record<string, TextRange[]>>({})
  const notes = ref<ExamNote[]>([])
  const storageKey = `${STORAGE_PREFIX}${testId}`

  const persist = () => {
    if (!import.meta.client) return
    try {
      const data: StoredAnnotations = { highlights: highlights.value, notes: notes.value }
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch {
      // Bỏ qua khi trình duyệt chặn localStorage
    }
  }

  onMounted(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const data = JSON.parse(raw) as StoredAnnotations
      highlights.value = data.highlights || {}
      notes.value = data.notes || []
    } catch {
      // Dữ liệu hỏng thì bắt đầu lại
    }
  })

  // Gộp các vùng tô sáng chồng lấn trong cùng một khối
  const addHighlight = (blockId: string, start: number, end: number) => {
    if (end <= start) return
    let merged = { id: newId(), start, end }
    const rest: TextRange[] = []
    for (const r of highlights.value[blockId] || []) {
      if (r.start <= merged.end && r.end >= merged.start) {
        merged = { id: merged.id, start: Math.min(r.start, merged.start), end: Math.max(r.end, merged.end) }
      } else {
        rest.push(r)
      }
    }
    highlights.value = { ...highlights.value, [blockId]: [...rest, merged].sort((a, b) => a.start - b.start) }
    persist()
  }

  const removeHighlight = (blockId: string, id: string) => {
    highlights.value = {
      ...highlights.value,
      [blockId]: (highlights.value[blockId] || []).filter((r) => r.id !== id),
    }
    persist()
  }

  const addNote = (input: { blockId: string | null; start?: number; end?: number; quote?: string; text?: string }) => {
    const note: ExamNote = {
      id: newId(),
      blockId: input.blockId,
      start: input.start ?? 0,
      end: input.end ?? 0,
      quote: input.quote ?? '',
      text: input.text ?? '',
      createdAt: Date.now(),
    }
    notes.value = [...notes.value, note]
    persist()
    return note.id
  }

  const updateNote = (id: string, text: string) => {
    notes.value = notes.value.map((n) => (n.id === id ? { ...n, text } : n))
    persist()
  }

  const removeNote = (id: string) => {
    notes.value = notes.value.filter((n) => n.id !== id)
    persist()
  }

  const clear = () => {
    highlights.value = {}
    notes.value = []
    if (!import.meta.client) return
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // bỏ qua
    }
  }

  const highlightsFor = (blockId: string) => highlights.value[blockId] || []
  const notesFor = (blockId: string) => notes.value.filter((n) => n.blockId === blockId && n.end > n.start)

  return {
    highlights,
    notes,
    addHighlight,
    removeHighlight,
    addNote,
    updateNote,
    removeNote,
    clear,
    highlightsFor,
    notesFor,
  }
}

export type ExamAnnotations = ReturnType<typeof useExamAnnotations>

export const EXAM_ANNOTATIONS_KEY: InjectionKey<ExamAnnotations> = Symbol('exam-annotations')
