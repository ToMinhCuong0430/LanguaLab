<script setup lang="ts">
import { Plus, Trash2, Save, ChevronDown, AlertTriangle, CheckCircle2, RefreshCw } from '@lucide/vue'
import type { Database } from '~/types/database.types'

type QuestionRow = Database['public']['Tables']['exam_questions']['Row']
type QuestionType = Database['public']['Enums']['question_type']

// Quản lý câu hỏi của một đề thi trong trang admin: tạo / sửa / xoá, nhập giải thích và dẫn chứng
const props = defineProps<{
  testId: string
  skill: string
  passageContent?: string | null
  audioScript?: string | null
}>()

const client = useSupabaseClient<Database>()

interface Draft {
  key: string
  id: string | null // null = câu mới chưa lưu
  question_number: number
  type: QuestionType
  question_text: string
  optionsText: string // Mỗi dòng: "A. Nội dung"
  correct_answer: string
  explanation: string
  category_tag: string
  passage_section_ref: string
  evidence_quote: string
  // v-model trên <input type="number"> có thể trả về number, nên đọc qua toSeconds()
  audio_start_seconds: string | number
  audio_end_seconds: string | number
  open: boolean
  saving: boolean
  error: string | null
  savedAt: number | null
}

const TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'multiple_choice', label: 'Trắc nghiệm (Multiple Choice)' },
  { value: 'true_false_not_given', label: 'True / False / Not Given' },
  { value: 'fill_blank', label: 'Điền từ (Fill in the blank)' },
  { value: 'matching', label: 'Nối (Matching)' },
]
const TFNG_OPTIONS = [
  { id: 'TRUE', text: 'TRUE' },
  { id: 'FALSE', text: 'FALSE' },
  { id: 'NOT GIVEN', text: 'NOT GIVEN' },
]

const drafts = ref<Draft[]>([])
const isLoading = ref(false)
const loadError = ref<string | null>(null)

const isListening = computed(() => props.skill === 'listening')
const evidenceSource = computed(() => (isListening.value ? props.audioScript : props.passageContent) || '')

// '' -> null, còn lại -> number (NaN nếu không phải số)
const toSeconds = (v: string | number) => (String(v ?? '').trim() === '' ? null : Number(v))

const optionsToText = (options: unknown) =>
  Array.isArray(options) ? options.map((o: any) => `${o.id}. ${o.text}`).join('\n') : ''

const parseOptions = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^([A-Za-z0-9]+)[.)]\s*(.+)$/)
      return m ? { id: m[1]!.toUpperCase(), text: m[2]!.trim() } : null
    })

const toDraft = (q: QuestionRow): Draft => ({
  key: q.id,
  id: q.id,
  question_number: q.question_number,
  type: q.type,
  question_text: q.question_text,
  optionsText: q.type === 'true_false_not_given' ? '' : optionsToText(q.options),
  correct_answer: q.correct_answer,
  explanation: q.explanation,
  category_tag: q.category_tag || '',
  passage_section_ref: q.passage_section_ref || '',
  evidence_quote: q.evidence_quote || '',
  audio_start_seconds: q.audio_start_seconds?.toString() ?? '',
  audio_end_seconds: q.audio_end_seconds?.toString() ?? '',
  open: false,
  saving: false,
  error: null,
  savedAt: null,
})

const load = async () => {
  isLoading.value = true
  loadError.value = null
  const { data, error } = await client
    .from('exam_questions')
    .select('*')
    .eq('test_id', props.testId)
    .order('question_number', { ascending: true })
  isLoading.value = false
  if (error) {
    loadError.value = `Không tải được câu hỏi: ${error.message}`
    return
  }
  drafts.value = (data || []).map(toDraft)
}

watch(() => props.testId, load, { immediate: true })

const syncTotalQuestions = async () => {
  const { count } = await client
    .from('exam_questions')
    .select('id', { count: 'exact', head: true })
    .eq('test_id', props.testId)
  if (count !== null) await client.from('exam_tests').update({ total_questions: count }).eq('id', props.testId)
}

const addQuestion = () => {
  const next = Math.max(0, ...drafts.value.map((d) => d.question_number)) + 1
  drafts.value.push({
    key: `new-${Date.now()}`,
    id: null,
    question_number: next,
    type: 'multiple_choice',
    question_text: '',
    optionsText: 'A. \nB. \nC. \nD. ',
    correct_answer: '',
    explanation: '',
    category_tag: '',
    passage_section_ref: '',
    evidence_quote: '',
    audio_start_seconds: '',
    audio_end_seconds: '',
    open: true,
    saving: false,
    error: null,
    savedAt: null,
  })
}

// Cảnh báo (không chặn lưu) khi câu dẫn chứng không có nguyên văn trong bài
const evidenceWarning = (d: Draft) => {
  const quote = d.evidence_quote.trim()
  if (!quote || !evidenceSource.value) return null
  return evidenceSource.value.includes(quote)
    ? null
    : `Không tìm thấy nguyên văn câu này trong ${isListening.value ? 'transcript' : 'bài đọc'}. Học viên sẽ không thấy phần tô sáng.`
}

const validate = (d: Draft): string | null => {
  if (!Number.isInteger(d.question_number) || d.question_number < 1) return 'Số thứ tự câu phải là số nguyên từ 1 trở lên.'
  if (drafts.value.some((o) => o !== d && o.question_number === d.question_number)) return `Đã có câu số ${d.question_number} trong đề này.`
  if (!d.question_text.trim()) return 'Nhập nội dung câu hỏi.'
  if (!d.correct_answer.trim()) return 'Nhập đáp án đúng.'
  if (!d.explanation.trim()) return 'Nhập lời giải thích. Học viên sẽ thấy phần này khi bấm "Xem giải thích".'
  if (d.type === 'multiple_choice') {
    const opts = parseOptions(d.optionsText)
    if (opts.length < 2 || opts.some((o) => !o)) return 'Lựa chọn trắc nghiệm phải có ít nhất 2 dòng dạng "A. Nội dung".'
    if (!opts.some((o) => o!.id === d.correct_answer.trim().toUpperCase())) return 'Đáp án đúng phải trùng với một mã lựa chọn (A, B, C...).'
  }
  if (d.type === 'true_false_not_given' && !TFNG_OPTIONS.some((o) => o.id === d.correct_answer.trim().toUpperCase())) {
    return 'Đáp án đúng phải là TRUE, FALSE hoặc NOT GIVEN.'
  }
  const start = toSeconds(d.audio_start_seconds)
  const end = toSeconds(d.audio_end_seconds)
  if (start !== null && (!Number.isInteger(start) || start < 0)) return 'Giây bắt đầu phải là số nguyên không âm.'
  if (end !== null && (!Number.isInteger(end) || end < 0)) return 'Giây kết thúc phải là số nguyên không âm.'
  if (start !== null && end !== null && end < start) return 'Giây kết thúc phải lớn hơn hoặc bằng giây bắt đầu.'
  return null
}

const save = async (d: Draft) => {
  d.savedAt = null
  d.error = validate(d)
  if (d.error) return
  d.saving = true

  const upperChoice = d.type === 'multiple_choice' || d.type === 'true_false_not_given'
  const payload = {
    test_id: props.testId,
    question_number: d.question_number,
    type: d.type,
    question_text: d.question_text.trim(),
    options:
      d.type === 'true_false_not_given' ? TFNG_OPTIONS : d.type === 'multiple_choice' ? parseOptions(d.optionsText) : null,
    correct_answer: upperChoice ? d.correct_answer.trim().toUpperCase() : d.correct_answer.trim(),
    explanation: d.explanation.trim(),
    category_tag: d.category_tag.trim() || null,
    passage_section_ref: d.passage_section_ref.trim() || null,
    evidence_quote: d.evidence_quote.trim() || null,
    audio_start_seconds: toSeconds(d.audio_start_seconds),
    audio_end_seconds: toSeconds(d.audio_end_seconds),
  }

  const { data, error } = d.id
    ? await client.from('exam_questions').update(payload).eq('id', d.id).select('*').single()
    : await client.from('exam_questions').insert(payload).select('*').single()

  d.saving = false
  if (error) {
    d.error = error.code === '23505' ? `Đã có câu số ${d.question_number} trong đề này.` : `Lưu thất bại: ${error.message}`
    return
  }
  const wasNew = !d.id
  Object.assign(d, toDraft(data), { key: d.key, open: true, savedAt: Date.now() })
  if (wasNew) await syncTotalQuestions()
}

const remove = async (d: Draft) => {
  if (!d.id) {
    drafts.value = drafts.value.filter((x) => x !== d)
    return
  }
  if (!confirm(`Xoá vĩnh viễn câu ${d.question_number}? Thao tác này không thể hoàn tác.`)) return
  const { error } = await client.from('exam_questions').delete().eq('id', d.id)
  if (error) {
    d.error = `Xoá thất bại: ${error.message}`
    return
  }
  drafts.value = drafts.value.filter((x) => x !== d)
  await syncTotalQuestions()
}

const fieldClass = 'w-full min-h-[44px] rounded-brut border-2 border-line bg-surface p-2 text-xs text-ink'
</script>

<template>
  <section class="space-y-3 border-t-2 border-line pt-4" aria-label="Câu hỏi của đề thi">
    <div class="flex items-center justify-between gap-2">
      <h3 class="font-display text-sm font-black text-ink">Câu hỏi ({{ drafts.length }})</h3>
      <button
        type="button"
        class="inline-flex min-h-[44px] items-center gap-1.5 rounded-brut border-2 border-line bg-surface px-3 text-xs font-black text-ink shadow-brut-sm brut-press cursor-pointer"
        @click="addQuestion"
      >
        <Plus class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
        Thêm câu hỏi
      </button>
    </div>

    <p v-if="isLoading" class="flex items-center gap-2 text-xs text-ink-soft">
      <RefreshCw class="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Đang tải câu hỏi...
    </p>
    <p v-else-if="loadError" class="rounded-brut border-2 border-bad bg-bad/10 p-2 text-xs font-bold text-bad" role="alert">
      {{ loadError }}
    </p>
    <p v-else-if="!drafts.length" class="text-xs text-ink-soft">Đề này chưa có câu hỏi nào.</p>

    <article
      v-for="d in drafts"
      :key="d.key"
      class="rounded-brut border-2 border-line bg-surface-2"
    >
      <button
        type="button"
        class="flex w-full min-h-[44px] items-center gap-2 px-3 py-2 text-left cursor-pointer"
        :aria-expanded="d.open"
        @click="d.open = !d.open"
      >
        <span class="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded border-2 border-line bg-surface font-display text-xs font-black text-ink">
          {{ d.question_number }}
        </span>
        <span class="min-w-0 flex-1 truncate text-xs font-bold text-ink">{{ d.question_text || 'Câu hỏi mới' }}</span>
        <span v-if="!d.id" class="rounded border border-line bg-warn px-1.5 text-[10px] font-black text-on-tone">Chưa lưu</span>
        <span v-else-if="!d.explanation.trim()" class="rounded border border-line bg-bad px-1.5 text-[10px] font-black text-on-tone">Thiếu giải thích</span>
        <ChevronDown class="h-4 w-4 flex-shrink-0 text-ink transition-transform" :class="{ 'rotate-180': d.open }" aria-hidden="true" />
      </button>

      <div v-if="d.open" class="space-y-3 border-t-2 border-line p-3">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label class="block">
            <span class="block text-xs font-black text-ink mb-1">Số thứ tự</span>
            <input v-model.number="d.question_number" type="number" min="1" :class="fieldClass" />
          </label>
          <label class="block sm:col-span-2">
            <span class="block text-xs font-black text-ink mb-1">Dạng câu hỏi</span>
            <select v-model="d.type" :class="[fieldClass, 'cursor-pointer']">
              <option v-for="t in TYPE_OPTIONS" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </label>
        </div>

        <label class="block">
          <span class="block text-xs font-black text-ink mb-1">Nội dung câu hỏi <span class="text-bad">*</span></span>
          <textarea v-model="d.question_text" rows="2" :class="fieldClass" />
        </label>

        <label v-if="d.type === 'multiple_choice' || d.type === 'matching'" class="block">
          <span class="block text-xs font-black text-ink mb-1">Các lựa chọn (mỗi dòng "A. Nội dung")</span>
          <textarea v-model="d.optionsText" rows="4" :class="[fieldClass, 'font-mono']" />
        </label>
        <p v-else-if="d.type === 'true_false_not_given'" class="text-[11px] text-ink-soft">
          Lựa chọn tự động: TRUE, FALSE, NOT GIVEN.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-xs font-black text-ink mb-1">Đáp án đúng <span class="text-bad">*</span></span>
            <input v-model="d.correct_answer" type="text" :class="fieldClass" />
          </label>
          <label class="block">
            <span class="block text-xs font-black text-ink mb-1">Nhãn dạng bài</span>
            <input v-model="d.category_tag" type="text" placeholder="vd. True/False/Not Given" :class="fieldClass" />
          </label>
        </div>

        <label class="block">
          <span class="block text-xs font-black text-ink mb-1">Giải thích đáp án <span class="text-bad">*</span></span>
          <textarea
            v-model="d.explanation"
            rows="3"
            :class="fieldClass"
            placeholder="Vì sao đáp án đúng, vì sao các lựa chọn khác sai..."
          />
          <span class="mt-1 block text-[11px] text-ink-soft">Học viên thấy phần này khi bấm "Xem giải thích" sau khi nộp bài.</span>
        </label>

        <label class="block">
          <span class="block text-xs font-black text-ink mb-1">
            Câu dẫn chứng nguyên văn trong {{ isListening ? 'transcript' : 'bài đọc' }}
          </span>
          <textarea v-model="d.evidence_quote" rows="2" :class="fieldClass" />
          <span class="mt-1 block text-[11px] text-ink-soft">
            Dán đúng câu chứa đáp án. Câu này sẽ được tô sáng trong {{ isListening ? 'phần giải thích' : 'đoạn văn' }}.
          </span>
          <span v-if="evidenceWarning(d)" class="mt-1 flex items-start gap-1.5 text-[11px] font-bold text-ink">
            <AlertTriangle class="h-3.5 w-3.5 flex-shrink-0 text-warn" aria-hidden="true" />
            {{ evidenceWarning(d) }}
          </span>
        </label>

        <div v-if="isListening" class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-xs font-black text-ink mb-1">Audio từ giây</span>
            <input v-model="d.audio_start_seconds" type="number" min="0" inputmode="numeric" :class="fieldClass" />
          </label>
          <label class="block">
            <span class="block text-xs font-black text-ink mb-1">Đến giây</span>
            <input v-model="d.audio_end_seconds" type="number" min="0" inputmode="numeric" :class="fieldClass" />
          </label>
        </div>
        <label v-else class="block">
          <span class="block text-xs font-black text-ink mb-1">Tham chiếu đoạn văn</span>
          <input v-model="d.passage_section_ref" type="text" placeholder="vd. Đoạn 3" :class="fieldClass" />
        </label>

        <p v-if="d.error" class="rounded-brut border-2 border-bad bg-bad/10 p-2 text-xs font-bold text-bad" role="alert">
          {{ d.error }}
        </p>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            class="inline-flex min-h-[44px] items-center gap-1.5 rounded-brut border-2 border-line px-3 text-xs font-bold text-bad hover:bg-bad/10 cursor-pointer"
            @click="remove(d)"
          >
            <Trash2 class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
            {{ d.id ? 'Xoá câu' : 'Bỏ câu mới' }}
          </button>
          <div class="flex items-center gap-3">
            <span v-if="d.savedAt" class="flex items-center gap-1 text-xs font-bold text-ink" role="status">
              <CheckCircle2 class="h-4 w-4 text-ok" aria-hidden="true" /> Đã lưu
            </span>
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center gap-1.5 rounded-brut border-2 border-line bg-ok px-3.5 text-xs font-black text-on-tone shadow-brut-sm brut-press cursor-pointer disabled:opacity-50"
              :disabled="d.saving"
              @click="save(d)"
            >
              <RefreshCw v-if="d.saving" class="h-4 w-4 animate-spin" aria-hidden="true" />
              <Save v-else class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
              {{ d.id ? 'Lưu câu hỏi' : 'Tạo câu hỏi' }}
            </button>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>
