<script setup lang="ts">
import {
  Clock,
  Send,
  ArrowLeft,
  ArrowRight,
  Flag,
  CheckCircle,
  AlertCircle,
  FileText,
  HelpCircle,
  Eye,
  X,
  BookOpen,
  Maximize,
  Minimize,
  StickyNote,
} from '@lucide/vue'
import type { TestMode, IeltsTestDetail } from '~/composables/useIelts'
import { EXAM_ANNOTATIONS_KEY } from '~/composables/useExamAnnotations'
import ReadingPane from '~/components/ielts/ReadingPane.vue'
import AudioPlayer from '~/components/ielts/AudioPlayer.vue'
import WritingEditor from '~/components/ielts/WritingEditor.vue'
import SpeakingRecorder from '~/components/ielts/SpeakingRecorder.vue'
import ResultSummary from '~/components/ielts/ResultSummary.vue'
import AnnotatedText from '~/components/ielts/AnnotatedText.vue'
import ExamBottomBar from '~/components/ielts/ExamBottomBar.vue'
import SelectionToolbar from '~/components/ielts/SelectionToolbar.vue'
import NotesPanel from '~/components/ielts/NotesPanel.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'

const route = useRoute()
const testId = route.params.id as string
const initialMode = (route.query.mode as TestMode) || 'practice'

const { getTestById, saveAttempt, convertRawToBand } = useIelts()
const test = computed(() => getTestById(testId))

// Chấm Writing / Speaking bằng AI theo 4 tiêu chí IELTS
const aiScoring = useAiScoring()
const isProductive = computed(() => test.value?.skill === 'writing' || test.value?.skill === 'speaking')
// Reading / Listening: có tô sáng, ghi chú và thanh điều hướng câu hỏi ở đáy
const isObjective = computed(() => test.value?.skill === 'reading' || test.value?.skill === 'listening')

// Tô sáng & ghi chú, lưu tạm theo lượt làm bài
const annotations = useExamAnnotations(testId)
provide(EXAM_ANNOTATIONS_KEY, annotations)
const examRoomRef = ref<HTMLElement | null>(null)
const isNotesOpen = ref(false)
const focusNoteId = ref<string | null>(null)
const openNote = (id: string | null = null) => {
  focusNoteId.value = id
  isNotesOpen.value = true
}

// Toàn màn hình
const isFullscreen = ref(false)
const syncFullscreen = () => { isFullscreen.value = Boolean(document.fullscreenElement) }
const toggleFullscreen = async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await document.documentElement.requestFullscreen()
  } catch {
    // Trình duyệt chặn (vd. trong iframe): bỏ qua
  }
}

// Chế độ: practice (Luyện tập) | exam (Thi thử)
const mode = ref<TestMode>(initialMode)

// Trạng thái làm bài
const currentQuestionIndex = ref(0)
const userAnswers = ref<Record<number, string>>({})
const flaggedQuestions = ref<Record<number, boolean>>({})
const essayContent = ref('') // Dành cho Writing
const speakingTranscripts = ref<string[]>([]) // Dành cho Speaking, mỗi phần tử là một Part
const isSubmitted = ref(false)

// Bài làm gửi đi chấm: essay (Writing) hoặc transcript ghép các Part (Speaking)
const productiveSubmission = computed(() => {
  if (test.value?.skill === 'writing') return essayContent.value.trim()
  if (test.value?.skill === 'speaking') {
    return speakingTranscripts.value
      .map((t, i) => (t?.trim() ? `Part ${i + 1}:\n${t.trim()}` : ''))
      .filter(Boolean)
      .join('\n\n')
  }
  return ''
})
const productiveWordCount = computed(() => {
  const text = test.value?.skill === 'speaking' ? speakingTranscripts.value.join(' ') : essayContent.value
  return (text.trim().match(/\S+/g) || []).length
})
const minWordsForAi = computed(() => (test.value?.skill === 'speaking' ? 20 : 50))
const showConfirmModal = ref(false)

// Tab trên mobile cho Reading: 'passage' | 'questions'
const mobileActiveTab = ref<'passage' | 'questions'>('passage')

// Đồng hồ thời gian
const timeRemainingSeconds = ref(test.value ? test.value.timeMinutes * 60 : 1200)
const timeSpentSeconds = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const startTimer = () => {
  stopTimer()
  timer = setInterval(() => {
    timeSpentSeconds.value += 1
    if (mode.value === 'exam') {
      if (timeRemainingSeconds.value > 0) {
        timeRemainingSeconds.value -= 1
      } else {
        // Hết giờ tự động nộp bài
        submitTest()
      }
    }
  }, 1000)
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const formattedTime = computed(() => {
  const sec = mode.value === 'exam' ? timeRemainingSeconds.value : timeSpentSeconds.value
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
})

// Mức cảnh báo thời gian (chỉ khi thi thử đếm ngược): < 10 phút và < 5 phút
const timerLevel = computed<'normal' | 'warning' | 'critical'>(() => {
  if (mode.value !== 'exam') return 'normal'
  if (timeRemainingSeconds.value <= 300) return 'critical'
  if (timeRemainingSeconds.value <= 600) return 'warning'
  return 'normal'
})
const timerLabel = computed(() => {
  if (timerLevel.value === 'critical') return 'Còn dưới 5 phút'
  if (timerLevel.value === 'warning') return 'Còn dưới 10 phút'
  return mode.value === 'exam' ? 'Thời gian còn lại' : 'Thời gian đã làm'
})

// Chuyển câu hỏi
const currentQuestion = computed(() => {
  if (!test.value || !test.value.questions.length) return null
  return test.value.questions[currentQuestionIndex.value] || null
})

const totalQuestions = computed(() => test.value?.questions.length || 0)

const selectQuestion = (idx: number) => {
  currentQuestionIndex.value = idx
  // Nếu ở mobile và là Reading, chuyển sang tab questions khi chọn câu
  if (mobileActiveTab.value === 'passage') {
    mobileActiveTab.value = 'questions'
  }
  // Listening hiển thị tất cả câu: cuộn tới câu được chọn
  if (test.value?.skill === 'listening' && import.meta.client) {
    nextTick(() => {
      const card = document.getElementById(`q-card-${idx + 1}`)
      card?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      card?.querySelector<HTMLElement>('input')?.focus({ preventScroll: true })
    })
  }
}

const toggleFlag = (qNum: number) => {
  flaggedQuestions.value[qNum] = !flaggedQuestions.value[qNum]
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < totalQuestions.value - 1) {
    selectQuestion(currentQuestionIndex.value + 1)
  }
}

const prevQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    selectQuestion(currentQuestionIndex.value - 1)
  }
}

// Trả lời câu hỏi hiện tại
const setAnswer = (qNum: number, ans: string) => {
  userAnswers.value[qNum] = ans
}

// Số câu chưa làm
const unansweredCount = computed(() => {
  let count = 0
  for (let i = 1; i <= totalQuestions.value; i++) {
    if (!userAnswers.value[i] || userAnswers.value[i].trim() === '') {
      count++
    }
  }
  return count
})

const openSubmitConfirm = () => {
  showConfirmModal.value = true
}

const cancelSubmit = () => {
  showConfirmModal.value = false
}

const submitTest = async () => {
  stopTimer()
  showConfirmModal.value = false
  isSubmitted.value = true
  // Tô sáng & ghi chú chỉ lưu tạm trong lượt làm bài
  isNotesOpen.value = false
  annotations.clear()

  // Tính điểm thô
  let correctCount = 0
  test.value?.questions.forEach((q, idx) => {
    const userAns = userAnswers.value[idx + 1]
    if (userAns && userAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
      correctCount++
    }
  })

  // Writing / Speaking: band do AI chấm sau khi lưu lượt làm bài
  const band = isProductive.value
    ? undefined
    : convertRawToBand(correctCount, totalQuestions.value, test.value?.skill || 'reading')

  // Ghi nhận vào Supabase
  const saved = await saveAttempt({
    testId,
    mode: mode.value,
    rawScore: correctCount,
    totalQuestions: totalQuestions.value,
    bandScore: band,
    durationSeconds: timeSpentSeconds.value,
    submittedEssay: essayContent.value || undefined,
    answers: userAnswers.value,
  })

  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isProductive.value && test.value) {
    await aiScoring.score({
      attemptId: saved.attemptId,
      testId,
      skill: test.value.skill as 'writing' | 'speaking',
      submission: productiveSubmission.value,
    })
  }
}

const retryTest = () => {
  userAnswers.value = {}
  flaggedQuestions.value = {}
  essayContent.value = ''
  speakingTranscripts.value = []
  annotations.clear()
  currentQuestionIndex.value = 0
  isSubmitted.value = false
  timeSpentSeconds.value = 0
  timeRemainingSeconds.value = test.value ? test.value.timeMinutes * 60 : 1200
  startTimer()
}

// Bắt phím tắt
const handleKeyDown = (e: KeyboardEvent) => {
  if (isSubmitted.value || showConfirmModal.value) return
  if (e.altKey && (e.key === 'n' || e.key === 'N')) {
    nextQuestion()
  } else if (e.altKey && (e.key === 'p' || e.key === 'P')) {
    prevQuestion()
  }
}

onMounted(() => {
  startTimer()
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('fullscreenchange', syncFullscreen)
  }
})

onUnmounted(() => {
  stopTimer()
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('fullscreenchange', syncFullscreen)
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
  }
})

useHead({
  title: computed(() => (test.value ? `${test.value.title} - Luyện thi Langua` : 'Làm bài thi')),
})

const examRoomGuideSteps: GuideStep[] = [
  {
    targetId: 'exam-header-bar',
    badge: 'BƯỚC 1',
    title: 'Thanh điều khiển phòng thi',
    description: 'Chuyển đổi chế độ Luyện tập / Thi thử và theo dõi đồng hồ bấm giờ.',
  },
  {
    targetId: 'exam-main-workspace',
    badge: 'BƯỚC 2',
    title: 'Không gian làm bài chuyên biệt',
    description: 'Reading chia đôi màn hình độc lập, Listening có audio player, Writing có đếm từ và Speaking có thu âm.',
  },
  {
    targetId: 'exam-question-nav',
    badge: 'BƯỚC 3',
    title: 'Điều hướng & Cắm cờ xem lại',
    description: 'Thanh dưới cùng hiện mọi câu hỏi: xanh là đã làm, vàng có cờ là cần xem lại, viền nét đứt là chưa làm. Bôi đen văn bản để tô sáng hoặc ghi chú.',
  },
]
</script>

<template>
  <div
    v-if="test"
    ref="examRoomRef"
    class="exam-room mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6"
    :class="{ 'pb-32': isObjective && !isSubmitted }"
  >
    <!-- MÀN HÌNH KẾT QUẢ KHI ĐÃ NỘP BÀI -->
    <ResultSummary
      v-if="isSubmitted"
      :test="test"
      :user-answers="userAnswers"
      :time-spent-seconds="timeSpentSeconds"
      :mode="mode"
      :submission="productiveSubmission"
      :ai-state="aiScoring.state.value"
      :ai-feedback="aiScoring.feedback.value"
      :ai-error="aiScoring.error.value"
      :ai-can-retry="aiScoring.canRetry.value"
      @retry="retryTest"
      @retry-ai="aiScoring.retry"
    />

    <!-- MÀN HÌNH LÀM BÀI CHÍNH -->
    <div v-else class="space-y-6">
      <!-- Top Bar phòng thi: Tiêu đề + Đồng hồ + Đổi chế độ + Nộp bài -->
      <header
        id="exam-header-bar"
        class="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-3 rounded-brut-lg border-[3px] border-line bg-surface p-3.5 sm:p-4 shadow-brut"
      >
        <!-- Cột trái: Tên đề & Nút quay lại -->
        <div class="flex items-center gap-3">
          <NuxtLink
            :to="`/luyen-thi/ielts/${test.skill}`"
            class="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-brut border-2 border-line bg-surface-2 text-ink hover:bg-surface shadow-brut-sm cursor-pointer"
            aria-label="Thoát về danh sách đề thi"
            title="Thoát về danh sách đề"
          >
            <ArrowLeft class="h-4 w-4" :stroke-width="2.5" />
          </NuxtLink>

          <div>
            <div class="flex items-center gap-2">
              <span class="rounded border border-line bg-warn px-2 py-0.2 text-[10px] font-black uppercase text-on-tone">
                {{ test.skill }}
              </span>
              <span class="rounded border border-line bg-surface-2 px-1.5 py-0.2 text-[10px] font-bold text-ink-soft">
                {{ test.subtitle }}
              </span>
            </div>
            <h1 class="font-display text-sm sm:text-base font-black text-ink line-clamp-1">
              {{ test.title }}
            </h1>
          </div>
        </div>

        <!-- Cột phải: Đồng hồ + Chuyển Mode + Nút Nộp bài -->
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <!-- Toggle Chế độ Luyện tập / Thi thử -->
          <div class="hidden sm:flex items-center gap-1 rounded-brut border-2 border-line bg-surface-2 p-1 text-xs font-bold">
            <button
              type="button"
              class="px-2.5 py-1 rounded transition-all cursor-pointer"
              :class="mode === 'practice' ? 'bg-accent text-accent-ink shadow-brut-sm font-black' : 'text-ink'"
              @click="mode = 'practice'"
            >
              Luyện tập
            </button>
            <button
              type="button"
              class="px-2.5 py-1 rounded transition-all cursor-pointer"
              :class="mode === 'exam' ? 'bg-warn text-on-tone shadow-brut-sm font-black' : 'text-ink'"
              @click="mode = 'exam'"
            >
              Thi thử
            </button>
          </div>

          <!-- Đồng hồ: vàng khi còn < 10 phút, đỏ khi còn < 5 phút (kèm chữ, không chỉ dựa vào màu) -->
          <div
            class="flex items-center gap-1.5 rounded-brut border-2 border-line px-3 py-1.5 font-display text-sm font-black shadow-brut-sm"
            :class="{
              'bg-surface-2 text-ink': timerLevel === 'normal',
              'bg-warn text-on-tone': timerLevel === 'warning',
              'bg-bad text-on-tone animate-pulse': timerLevel === 'critical',
            }"
            role="timer"
            :aria-label="`${timerLabel}: ${formattedTime}`"
          >
            <Clock class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
            <span class="tabular-nums">{{ formattedTime }}</span>
            <span v-if="timerLevel !== 'normal'" class="hidden md:inline text-[11px] font-bold">
              {{ timerLevel === 'critical' ? '< 5 phút' : '< 10 phút' }}
            </span>
          </div>
          <span class="sr-only" aria-live="assertive">{{ timerLevel !== 'normal' ? timerLabel : '' }}</span>

          <!-- Ghi chú (Reading / Listening) -->
          <button
            v-if="isObjective"
            type="button"
            class="flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-brut border-2 border-line px-2.5 font-display text-xs font-black shadow-brut-sm cursor-pointer"
            :class="isNotesOpen ? 'bg-c-violet text-on-tone' : 'bg-surface-2 text-ink'"
            :aria-pressed="isNotesOpen"
            :aria-label="`Ghi chú (${annotations.notes.value.length})`"
            @click="isNotesOpen ? (isNotesOpen = false) : openNote()"
          >
            <StickyNote class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
            <span class="hidden sm:inline">Ghi chú</span>
            <span class="tabular-nums">{{ annotations.notes.value.length }}</span>
          </button>

          <!-- Toàn màn hình -->
          <button
            type="button"
            class="flex h-11 w-11 items-center justify-center rounded-brut border-2 border-line bg-surface-2 text-ink shadow-brut-sm cursor-pointer"
            :aria-label="isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'"
            :title="isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'"
            @click="toggleFullscreen"
          >
            <Minimize v-if="isFullscreen" class="h-4 w-4" :stroke-width="2.5" />
            <Maximize v-else class="h-4 w-4" :stroke-width="2.5" />
          </button>

          <!-- Nút Nộp bài -->
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-brut border-2 border-line bg-ok px-4 py-2 font-display text-xs font-black text-on-tone shadow-brut brut-press cursor-pointer"
            @click="openSubmitConfirm"
          >
            <Send class="h-3.5 w-3.5" :stroke-width="2.5" />
            <span>Nộp bài</span>
          </button>
        </div>
      </header>

      <!-- KHÔNG GIAN LÀM BÀI CHUYÊN BIỆT THEO TỪNG KỸ NĂNG -->
      <main id="exam-main-workspace" class="space-y-6">
        <!-- 1. GIAO DIỆN READING (Chia đôi màn hình Desktop / Tab Mobile) -->
        <div v-if="test.skill === 'reading'" class="space-y-4">
          <!-- Tab chuyển đổi Bài đọc / Câu hỏi trên Mobile -->
          <div class="lg:hidden flex rounded-brut border-2 border-line bg-surface-2 p-1 text-xs font-black">
            <button
              type="button"
              class="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 py-2 text-center rounded transition-all cursor-pointer"
              :class="mobileActiveTab === 'passage' ? 'bg-warn text-on-tone shadow-brut-sm' : 'text-ink'"
              @click="mobileActiveTab = 'passage'"
            >
              <BookOpen class="h-4 w-4" :stroke-width="2.5" />
              <span>Bài đọc (Passage)</span>
            </button>
            <button
              type="button"
              class="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 py-2 text-center rounded transition-all cursor-pointer"
              :class="mobileActiveTab === 'questions' ? 'bg-accent text-accent-ink shadow-brut-sm' : 'text-ink'"
              @click="mobileActiveTab = 'questions'"
            >
              <HelpCircle class="h-4 w-4" :stroke-width="2.5" />
              <span>Câu hỏi ({{ totalQuestions }})</span>
            </button>
          </div>

          <!-- Layout 2 cột Desktop: Trái bài đọc, Phải câu hỏi -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
            <!-- Cột trái: Bài đọc (Passage) cuộn độc lập -->
            <div
              class="lg:col-span-7 h-full"
              :class="{ 'hidden lg:block': mobileActiveTab === 'questions' }"
            >
              <ReadingPane
                :title="test.passageTitle || test.title"
                :content="test.passageContent || ''"
              />
            </div>

            <!-- Cột phải: Câu hỏi đang chọn (điều hướng ở thanh dưới cùng) -->
            <div
              class="lg:col-span-5 flex flex-col h-full space-y-4"
              :class="{ 'hidden lg:flex': mobileActiveTab === 'passage' }"
            >
              <!-- Chi tiết câu hỏi đang chọn -->
              <div
                v-if="currentQuestion"
                class="flex-1 flex flex-col justify-between rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut overflow-y-auto"
              >
                <div class="space-y-4">
                  <div class="flex items-center justify-between border-b-2 border-line pb-3">
                    <span class="rounded border-2 border-line bg-warn px-2.5 py-0.5 font-display text-xs font-black text-on-tone">
                      CÂU HỎI {{ currentQuestionIndex + 1 }} / {{ totalQuestions }}
                    </span>
                    <span class="rounded border border-line bg-surface-2 px-2 py-0.2 text-[11px] font-bold text-ink">
                      {{ currentQuestion.categoryTag }}
                    </span>
                  </div>

                  <AnnotatedText
                    :key="currentQuestion.id"
                    tag="p"
                    :block-id="`q-${currentQuestionIndex + 1}`"
                    :text="currentQuestion.questionText"
                    class="block font-display text-base font-bold text-ink leading-relaxed"
                  />

                  <!-- Dạng True/False/Not Given hoặc Multiple Choice -->
                  <div
                    v-if="currentQuestion.type === 'true_false_not_given' || currentQuestion.type === 'multiple_choice'"
                    class="space-y-2 pt-2"
                  >
                    <label
                      v-for="opt in currentQuestion.options"
                      :key="opt.id"
                      class="flex items-center gap-3 rounded-brut border-2 p-3 font-medium text-sm transition-all cursor-pointer"
                      :class="[
                        userAnswers[currentQuestionIndex + 1] === opt.id
                          ? 'border-line bg-accent text-accent-ink shadow-brut-sm ring-1 ring-line'
                          : 'border-line/40 bg-surface hover:bg-surface-2 text-ink',
                      ]"
                    >
                      <input
                        type="radio"
                        :name="`q-${currentQuestion.id}`"
                        :value="opt.id"
                        :checked="userAnswers[currentQuestionIndex + 1] === opt.id"
                        class="accent-accent h-4 w-4"
                        @change="setAnswer(currentQuestionIndex + 1, opt.id)"
                      >
                      <span><strong>{{ opt.id }}.</strong> {{ opt.text }}</span>
                    </label>
                  </div>

                  <!-- Dạng điền từ vào chỗ trống (Fill in the blanks) -->
                  <div v-else-if="currentQuestion.type === 'fill_blank'" class="space-y-2 pt-2">
                    <label class="text-xs font-bold text-ink-soft">Nhập câu trả lời của bạn:</label>
                    <input
                      type="text"
                      :value="userAnswers[currentQuestionIndex + 1] || ''"
                      placeholder="Nhập từ chính xác từ bài đọc..."
                      class="w-full rounded-brut border-2 border-line bg-surface-2 p-3 font-display font-bold text-ink outline-none focus:bg-surface focus:shadow-brut-sm"
                      @input="(e) => setAnswer(currentQuestionIndex + 1, (e.target as HTMLInputElement).value)"
                    >
                  </div>

                  <!-- Chế độ Luyện tập: Cho phép xem gợi ý / giải thích ngay nếu muốn -->
                  <div
                    v-if="mode === 'practice' && userAnswers[currentQuestionIndex + 1]"
                    class="rounded border-2 border-line bg-surface-2 p-3 text-xs text-ink space-y-1 mt-4"
                  >
                    <span class="font-bold text-accent">Gợi ý luyện tập:</span>
                    <p>{{ currentQuestion.explanation }}</p>
                  </div>
                </div>

                <!-- Footer điều hướng Trước / Sau -->
                <div class="flex items-center justify-between border-t-2 border-line pt-4 mt-6">
                  <button
                    type="button"
                    class="flex items-center gap-1 text-xs font-bold text-ink hover:underline disabled:opacity-40 cursor-pointer"
                    :disabled="currentQuestionIndex === 0"
                    @click="prevQuestion"
                  >
                    <ArrowLeft class="h-4 w-4" :stroke-width="2.5" />
                    <span>Câu trước (Alt+P)</span>
                  </button>

                  <button
                    type="button"
                    class="flex items-center gap-1 text-xs font-bold text-ink hover:underline disabled:opacity-40 cursor-pointer"
                    :disabled="currentQuestionIndex === totalQuestions - 1"
                    @click="nextQuestion"
                  >
                    <span>Câu tiếp (Alt+N)</span>
                    <ArrowRight class="h-4 w-4" :stroke-width="2.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. GIAO DIỆN LISTENING (Audio player trên đỉnh + Câu hỏi bên dưới) -->
        <div v-else-if="test.skill === 'listening'" class="space-y-6">
          <!-- Trình phát audio chuyên sâu -->
          <AudioPlayer
            :audio-title="test.audioTitle || test.title"
            :audio-url="test.audioUrl"
            :duration-seconds="test.audioDurationSeconds || 180"
            :mode="mode"
          />

          <!-- Danh sách câu hỏi Listening (điều hướng ở thanh dưới cùng) -->
          <div class="mx-auto max-w-3xl">
            <div class="space-y-5">
              <div
                v-for="(q, qIdx) in test.questions"
                :id="`q-card-${qIdx + 1}`"
                :key="q.id"
                class="scroll-mt-40 rounded-brut-lg border-[3px] bg-surface p-5 shadow-brut space-y-3 transition-colors"
                :class="currentQuestionIndex === qIdx ? 'border-line ring-2 ring-line ring-offset-2 ring-offset-bg' : 'border-line'"
                @focusin="currentQuestionIndex = qIdx"
              >
                <div class="flex items-center justify-between border-b-2 border-line pb-2.5">
                  <span class="rounded border-2 border-line bg-accent px-2 py-0.5 font-display text-xs font-black text-accent-ink">
                    CÂU HỎI {{ qIdx + 1 }}
                  </span>
                  <span class="text-xs font-bold text-ink-soft">
                    {{ q.categoryTag }}
                  </span>
                </div>

                <AnnotatedText
                  tag="p"
                  :block-id="`q-${qIdx + 1}`"
                  :text="q.questionText"
                  class="block font-display text-base font-bold text-ink"
                />

                <!-- Trắc nghiệm -->
                <div v-if="q.options && q.options.length" class="space-y-2">
                  <label
                    v-for="opt in q.options"
                    :key="opt.id"
                    class="flex items-center gap-3 rounded-brut border-2 p-2.5 text-sm font-medium transition-all cursor-pointer"
                    :class="[
                      userAnswers[qIdx + 1] === opt.id
                        ? 'border-line bg-accent text-accent-ink shadow-brut-sm'
                        : 'border-line/40 bg-surface hover:bg-surface-2 text-ink',
                    ]"
                  >
                    <input
                      type="radio"
                      :name="`q-${q.id}`"
                      :value="opt.id"
                      :checked="userAnswers[qIdx + 1] === opt.id"
                      class="accent-accent"
                      @change="setAnswer(qIdx + 1, opt.id)"
                    >
                    <span><strong>{{ opt.id }}.</strong> {{ opt.text }}</span>
                  </label>
                </div>

                <!-- Điền từ -->
                <div v-else class="max-w-md pt-1">
                  <input
                    type="text"
                    :value="userAnswers[qIdx + 1] || ''"
                    placeholder="Gõ từ nghe được vào đây..."
                    class="w-full rounded-brut border-2 border-line bg-surface-2 p-2.5 font-display font-bold text-ink outline-none focus:bg-surface focus:shadow-brut-sm"
                    @input="(e) => setAnswer(qIdx + 1, (e.target as HTMLInputElement).value)"
                  >
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- 3. GIAO DIỆN WRITING (Đề bài cố định bên cạnh + Soạn thảo đếm từ live) -->
        <div v-else-if="test.skill === 'writing'" class="h-[750px]">
          <WritingEditor
            v-model="essayContent"
            :prompt="test.promptRequirements || test.title"
            :task-number="test.taskNumber || 2"
            :min-words="test.minWords || 250"
          />
        </div>

        <!-- 4. GIAO DIỆN SPEAKING (Hỏi đáp từng Part + Ghi âm MediaRecorder + Đếm giờ) -->
        <div v-else-if="test.skill === 'speaking'">
          <SpeakingRecorder
            v-model:transcripts="speakingTranscripts"
            :prompts="test.prompts || ['Part 1...', 'Part 2...', 'Part 3...']"
            :prep-time-seconds="test.prepTimeSeconds || 60"
            :speak-time-seconds="test.speakTimeSeconds || 120"
          />
        </div>
      </main>

      <!-- Reading / Listening: điều hướng câu hỏi, tô sáng và ghi chú -->
      <template v-if="isObjective">
        <ExamBottomBar
          id="exam-question-nav"
          :total-questions="totalQuestions"
          :current-index="currentQuestionIndex"
          :answers="userAnswers"
          :flagged="flaggedQuestions"
          @select="selectQuestion"
          @toggle-flag="toggleFlag"
          @prev="prevQuestion"
          @next="nextQuestion"
        />
        <SelectionToolbar :container="examRoomRef" @open-note="openNote" />
        <NotesPanel v-model:open="isNotesOpen" :focus-note-id="focusNoteId" />
      </template>
    </div>

    <!-- MODAL XÁC NHẬN NỘP BÀI THI -->
    <BaseModal
      v-model="showConfirmModal"
      max-width="md"
      :close-on-backdrop="false"
      @close="cancelSubmit"
    >
      <template #header>
        <span class="rounded border-2 border-line bg-warn px-2.5 py-1 font-display text-xs font-black text-on-tone">
          XÁC NHẬN NỘP BÀI
        </span>
      </template>

      <div class="space-y-3">
        <h3 class="font-display text-lg font-black text-ink">
          Bạn có chắc chắn muốn nộp bài thi?
        </h3>

        <!-- Cảnh báo nếu còn câu chưa làm -->
        <div
          v-if="unansweredCount > 0"
          class="flex items-start gap-2.5 rounded-brut border-2 border-bad bg-bad/10 p-3 text-xs font-bold text-bad"
        >
          <AlertCircle class="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            Hiện còn <strong>{{ unansweredCount }} câu</strong> chưa được trả lời. Bạn có thể kiểm tra lại trước khi hoàn tất.
          </span>
        </div>

        <!-- Writing / Speaking: cảnh báo bài quá ngắn để AI chấm -->
        <div
          v-if="isProductive && productiveWordCount < minWordsForAi"
          class="flex items-start gap-2.5 rounded-brut border-2 border-bad bg-bad/10 p-3 text-xs font-bold text-bad"
        >
          <AlertCircle class="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            {{ test.skill === 'writing' ? 'Bài viết' : 'Transcript' }} mới có <strong>{{ productiveWordCount }} từ</strong>.
            Cần ít nhất {{ minWordsForAi }} từ để AI chấm được.
          </span>
        </div>

        <p v-if="isProductive" class="text-xs text-ink-soft">
          Sau khi nộp, bài làm được chấm theo 4 tiêu chí IELTS kèm nhận xét và cách sửa lỗi. Quá trình chấm thường mất 20 đến 60 giây.
        </p>
        <p v-else class="text-xs text-ink-soft">
          Sau khi nộp, hệ thống sẽ tính điểm thô, quy đổi thang Band chuẩn và hiển thị bảng phân tích giải thích cặn kẽ từng câu.
        </p>
      </div>

      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <BaseButton variant="secondary" size="sm" @click="cancelSubmit">
            Tiếp tục làm bài
          </BaseButton>

          <BaseButton variant="primary" size="sm" @click="submitTest">
            <span>Xác nhận nộp bài</span>
            <Send class="h-3.5 w-3.5 ml-1.5" :stroke-width="2.5" />
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- First Visit Guide -->
    <FirstVisitGuide
      page-key="ielts-exam-room"
      :steps="examRoomGuideSteps"
    />
  </div>
</template>
