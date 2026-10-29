import type { Database } from '~/types/database.types'

export type ProductiveSkill = 'writing' | 'speaking'
export type AiScoreState = 'idle' | 'loading' | 'completed' | 'failed' | 'unavailable'

export interface AiCriterionResult {
  band: number
  feedback: string
  strengths: string[]
  improvements: string[]
}

export interface AiSuggestion {
  criterion: string
  original: string
  correction: string
  explanation: string
}

export interface AiFeedback {
  id: string
  attempt_id: string | null
  skill: ProductiveSkill
  task_number: number | null
  submission_text: string
  word_count: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  run_count: number
  error_code: string | null
  error_message: string | null
  overall_band: number | null
  criteria: Record<string, AiCriterionResult> | null
  summary: string | null
  suggestions: AiSuggestion[] | null
  model_answer: string | null
  provider: string | null
}

export interface AiScoreError {
  code: string
  message: string
  retryable: boolean
}

// Thứ tự hiển thị + nhãn + màu (token chức năng) của từng tiêu chí
export const CRITERIA_META: Record<string, { label: string; english: string; tone: string }> = {
  task_response: { label: 'Đáp ứng yêu cầu đề', english: 'Task Response', tone: 'blue' },
  coherence_cohesion: { label: 'Mạch lạc & Liên kết', english: 'Coherence & Cohesion', tone: 'violet' },
  fluency_coherence: { label: 'Trôi chảy & Mạch lạc', english: 'Fluency & Coherence', tone: 'green' },
  lexical_resource: { label: 'Vốn từ vựng', english: 'Lexical Resource', tone: 'pink' },
  grammatical_range_accuracy: { label: 'Ngữ pháp', english: 'Grammatical Range & Accuracy', tone: 'orange' },
  pronunciation: { label: 'Phát âm (ước lượng)', english: 'Pronunciation', tone: 'cyan' },
}

export const CRITERIA_ORDER: Record<ProductiveSkill, string[]> = {
  writing: ['task_response', 'coherence_cohesion', 'lexical_resource', 'grammatical_range_accuracy'],
  speaking: ['fluency_coherence', 'lexical_resource', 'grammatical_range_accuracy', 'pronunciation'],
}

export const criterionLabel = (key: string, taskNumber?: number | null) => {
  const meta = CRITERIA_META[key]
  if (!meta) return { label: key, english: key }
  if (key === 'task_response' && taskNumber === 1) {
    return { label: 'Hoàn thành yêu cầu đề', english: 'Task Achievement' }
  }
  return meta
}

const POLL_INTERVAL_MS = 4000
const POLL_TIMEOUT_MS = 3 * 60 * 1000

export const useAiScoring = () => {
  const client = useSupabaseClient<Database>()
  const authUser = useSupabaseUser()
  const config = useRuntimeConfig()

  const state = ref<AiScoreState>('idle')
  const feedback = ref<AiFeedback | null>(null)
  const error = ref<AiScoreError | null>(null)
  const feedbackId = ref<string | null>(null)

  const isUseMock = computed(() => config.public.useMock === true || config.public.useMock === 'true')

  let pollTimer: ReturnType<typeof setTimeout> | null = null
  const stopPolling = () => {
    if (pollTimer) clearTimeout(pollTimer)
    pollTimer = null
  }
  onUnmounted(stopPolling)

  const setFailed = (err: AiScoreError, id?: string | null) => {
    state.value = 'failed'
    error.value = err
    if (id) feedbackId.value = id
  }

  const applyFeedback = (row: AiFeedback) => {
    feedback.value = row
    feedbackId.value = row.id
    if (row.status === 'completed') {
      state.value = 'completed'
      error.value = null
    } else if (row.status === 'failed') {
      setFailed({
        code: row.error_code || 'UNKNOWN',
        message: row.error_message || 'Lần chấm trước bị lỗi.',
        retryable: row.run_count < 5,
      })
    }
  }

  // Khi bài đang được chấm ở một yêu cầu khác (ví dụ tải lại trang), đọc trạng thái từ DB cho đến khi xong
  const pollUntilDone = (id: string, startedAt = Date.now()) => {
    stopPolling()
    state.value = 'loading'
    pollTimer = setTimeout(async () => {
      const { data } = await client.from('ai_feedback').select('*').eq('id', id).maybeSingle()
      if (data && (data.status === 'completed' || data.status === 'failed')) {
        applyFeedback(data as unknown as AiFeedback)
        return
      }
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setFailed({ code: 'TIMEOUT', message: 'Chấm bài mất quá nhiều thời gian. Hãy chấm lại.', retryable: true }, id)
        return
      }
      pollUntilDone(id, startedAt)
    }, POLL_INTERVAL_MS)
  }

  const invoke = async (body: Record<string, unknown>) => {
    state.value = 'loading'
    error.value = null

    const { data, error: fnError } = await client.functions.invoke('ai-score', { body })
    if (!fnError) {
      applyFeedback((data as { feedback: AiFeedback }).feedback)
      return
    }

    // supabase-js trả FunctionsHttpError (máy chủ trả mã lỗi, kèm Response ở `context`)
    // hoặc FunctionsFetchError (không gọi được máy chủ)
    if (fnError.name === 'FunctionsHttpError') {
      let payload: { error?: AiScoreError & { feedback_id?: string; status?: string } } = {}
      try {
        payload = await (fnError as { context: Response }).context.json()
      } catch {
        // Phản hồi không phải JSON (ví dụ gateway lỗi)
      }
      const err = payload.error
      if (!err) {
        setFailed({ code: 'HTTP_ERROR', message: 'Máy chủ chấm bài phản hồi lỗi. Hãy thử lại.', retryable: true })
        return
      }
      if ((err.code === 'ALREADY_PROCESSING' || (err.code === 'ALREADY_EXISTS' && err.status === 'processing')) && err.feedback_id) {
        pollUntilDone(err.feedback_id)
        return
      }
      if (err.code === 'ALREADY_EXISTS' && err.feedback_id) {
        // Lượt làm bài đã có bản chấm lỗi trước đó: hiện nút chấm lại cho đúng bản đó
        setFailed({ code: 'PREVIOUS_FAILED', message: 'Lần chấm trước của bài này bị lỗi.', retryable: true }, err.feedback_id)
        return
      }
      setFailed({ code: err.code, message: err.message, retryable: Boolean(err.retryable) }, err.feedback_id)
      return
    }

    if (fnError.name === 'FunctionsFetchError') {
      setFailed({ code: 'NETWORK', message: 'Không kết nối được máy chủ chấm bài. Kiểm tra mạng rồi thử lại.', retryable: true })
      return
    }
    setFailed({ code: 'UNKNOWN', message: fnError.message || 'Có lỗi không xác định.', retryable: true })
  }

  const score = async (input: { attemptId?: string | null; testId: string; skill: ProductiveSkill; submission: string }) => {
    stopPolling()
    feedback.value = null
    feedbackId.value = null

    if (isUseMock.value) {
      state.value = 'unavailable'
      error.value = { code: 'MOCK_MODE', message: 'Ứng dụng đang chạy với dữ liệu mẫu nên chưa thể chấm bằng AI.', retryable: false }
      return
    }
    if (!authUser.value) {
      state.value = 'unavailable'
      error.value = { code: 'AUTH_REQUIRED', message: 'Đăng nhập để được chấm bài bằng AI theo 4 tiêu chí IELTS.', retryable: false }
      return
    }

    await invoke({
      attempt_id: input.attemptId ?? null,
      test_id: input.testId,
      skill: input.skill,
      submission: input.submission,
    })
  }

  const retry = async () => {
    if (!feedbackId.value) return
    stopPolling()
    await invoke({ feedback_id: feedbackId.value })
  }

  const canRetry = computed(() => state.value === 'failed' && Boolean(feedbackId.value) && Boolean(error.value?.retryable))

  return { state, feedback, error, canRetry, score, retry }
}
