<script setup lang="ts">
import {
  Trophy,
  CheckCircle,
  XCircle,
  HelpCircle,
  RotateCcw,
  ListFilter,
  ArrowRight,
  Clock,
  PieChart,
  Lightbulb,
  ChevronDown,
} from '@lucide/vue'
import QuestionExplanation from '~/components/ielts/QuestionExplanation.vue'
import type { IeltsTestDetail, TestMode } from '~/composables/useIelts'
import { convertRawToBand } from '~/composables/useIelts'
import type { AiFeedback, AiScoreError, AiScoreState } from '~/composables/useAiScoring'
import AiScoreReport from '~/components/ielts/AiScoreReport.vue'

const props = defineProps<{
  test: IeltsTestDetail
  userAnswers: Record<number, string>
  timeSpentSeconds: number
  mode: TestMode
  // Writing / Speaking: kết quả chấm AI và bài làm gốc
  submission?: string
  aiState?: AiScoreState
  aiFeedback?: AiFeedback | null
  aiError?: AiScoreError | null
  aiCanRetry?: boolean
}>()

const emit = defineEmits<{
  retry: []
  retryAi: []
}>()

const isProductive = computed(() => props.test.skill === 'writing' || props.test.skill === 'speaking')

// Câu nào đang mở phần giải thích
const openExplanations = ref<Record<number, boolean>>({})

// Tính số câu đúng
const checkIsCorrect = (qNum: number, userAns?: string, correctAns?: string) => {
  if (!userAns || !correctAns) return false
  return userAns.trim().toLowerCase() === correctAns.trim().toLowerCase()
}

const correctCount = computed(() => {
  let count = 0
  props.test.questions.forEach((q, idx) => {
    if (checkIsCorrect(idx + 1, props.userAnswers[idx + 1], q.correctAnswer)) {
      count++
    }
  })
  return count
})

const totalQuestions = computed(() => props.test.questions.length)

// Writing / Speaking lấy band từ kết quả chấm AI; null khi đang chấm hoặc chưa chấm được
const bandScore = computed<number | null>(() => {
  if (isProductive.value) {
    return props.aiState === 'completed' ? (props.aiFeedback?.overall_band ?? null) : null
  }
  return convertRawToBand(correctCount.value, totalQuestions.value, props.test.skill)
})

const accuracyPct = computed(() =>
  totalQuestions.value ? Math.round((correctCount.value / totalQuestions.value) * 100) : 0,
)

const submissionWordCount = computed(() => ((props.submission || '').trim().match(/\S+/g) || []).length)

// Phân tích thống kê theo dạng bài
const categoryStats = computed(() => {
  const map: Record<string, { total: number; correct: number }> = {}
  props.test.questions.forEach((q, idx) => {
    const tag = q.categoryTag || 'Dạng khác'
    if (!map[tag]) map[tag] = { total: 0, correct: 0 }
    map[tag].total += 1
    if (checkIsCorrect(idx + 1, props.userAnswers[idx + 1], q.correctAnswer)) {
      map[tag].correct += 1
    }
  })
  return Object.entries(map).map(([tag, data]) => ({
    tag,
    total: data.total,
    correct: data.correct,
    pct: Math.round((data.correct / data.total) * 100),
  }))
})

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m} phút ${s} giây`
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-200">
    <!-- Thẻ Tổng kết Điểm số & Band đạt được -->
    <div class="rounded-brut-lg border-[4px] border-line bg-surface p-6 sm:p-8 shadow-brut-lg text-ink">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-[3px] border-line pb-6">
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="rounded border-2 border-line bg-ok px-2.5 py-0.5 font-display text-xs font-black text-on-tone">
              HOÀN THÀNH BÀI THI
            </span>
            <span class="text-xs font-bold text-ink-soft">
              Chế độ: {{ mode === 'exam' ? 'Thi thử tính giờ' : 'Luyện tập tự do' }}
            </span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-black text-ink">
            Kết quả: {{ test.title }}
          </h2>
          <p class="text-xs sm:text-sm text-ink-soft">
            Thời gian hoàn thành: <strong>{{ formatDuration(timeSpentSeconds) }}</strong>
          </p>
        </div>

        <!-- Band Score cực lớn phong cách Neo-brutalism -->
        <div class="flex items-center gap-4">
          <div class="rounded-brut-lg border-[3px] border-line bg-warn p-4 text-center shadow-brut min-w-[130px]">
            <span class="text-[10px] font-black uppercase tracking-wider text-on-tone block">
              {{ isProductive ? 'Band tổng (AI chấm)' : 'Quy đổi IELTS' }}
            </span>
            <span v-if="bandScore !== null" class="font-display text-4xl sm:text-5xl font-black text-on-tone">
              Band {{ bandScore.toFixed(1) }}
            </span>
            <span v-else-if="aiState === 'loading'" class="font-display text-2xl font-black text-on-tone block py-2 animate-pulse">
              Đang chấm
            </span>
            <span v-else class="font-display text-2xl font-black text-on-tone block py-2">
              Chưa có
            </span>
          </div>

          <div
            v-if="isProductive"
            class="rounded-brut-lg border-[3px] border-line bg-surface-2 p-4 text-center shadow-brut min-w-[120px]"
          >
            <span class="text-[10px] font-black uppercase tracking-wider text-ink-soft block">
              {{ test.skill === 'writing' ? 'Số từ' : 'Số từ đã nói' }}
            </span>
            <span class="font-display text-3xl sm:text-4xl font-black text-ink tabular-nums">
              {{ submissionWordCount }}
            </span>
            <span v-if="test.skill === 'writing' && test.minWords" class="text-xs font-bold text-ink-soft block mt-0.5">
              (tối thiểu {{ test.minWords }})
            </span>
          </div>

          <div v-else class="rounded-brut-lg border-[3px] border-line bg-surface-2 p-4 text-center shadow-brut min-w-[120px]">
            <span class="text-[10px] font-black uppercase tracking-wider text-ink-soft block">
              Điểm số thô
            </span>
            <span class="font-display text-3xl sm:text-4xl font-black text-ink">
              {{ correctCount }}/{{ totalQuestions }}
            </span>
            <span class="text-xs font-bold text-ink-soft block mt-0.5">({{ accuracyPct }}%)</span>
          </div>
        </div>
      </div>

      <!-- Phân tích tỷ lệ đúng theo từng dạng bài -->
      <div v-if="!isProductive" class="mt-6 space-y-3">
        <h3 class="font-display text-sm font-black uppercase tracking-wider text-ink flex items-center gap-1.5">
          <PieChart class="h-4 w-4" :stroke-width="2.5" />
          <span>Phân tích độ chính xác theo dạng câu hỏi</span>
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div
            v-for="cat in categoryStats"
            :key="cat.tag"
            class="rounded-brut border-2 border-line bg-surface-2 p-3 shadow-brut-sm"
          >
            <div class="flex items-center justify-between text-xs font-bold mb-1.5">
              <span class="line-clamp-1 text-ink">{{ cat.tag }}</span>
              <span class="text-ink font-black">{{ cat.correct }}/{{ cat.total }}</span>
            </div>
            <div class="h-2 w-full rounded border border-line bg-surface overflow-hidden">
              <div
                class="h-full bg-ok transition-all"
                :style="{ width: `${cat.pct}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Nút hành động -->
      <div
        class="flex flex-wrap items-center gap-3"
        :class="isProductive ? 'pt-6' : 'mt-6 border-t-2 border-line pt-6'"
      >
        <BaseButton variant="primary" size="md" @click="emit('retry')">
          <RotateCcw class="h-4 w-4" :stroke-width="2.5" />
          <span>Làm lại đề này</span>
        </BaseButton>

        <BaseButton :to="`/luyen-thi/ielts/${test.skill}`" variant="secondary" size="md">
          <span>Xem danh sách đề {{ test.skill }}</span>
          <ArrowRight class="h-4 w-4" :stroke-width="2.5" />
        </BaseButton>
      </div>
    </div>

    <!-- Writing / Speaking: Báo cáo chấm AI theo 4 tiêu chí -->
    <AiScoreReport
      v-if="isProductive"
      :state="aiState || 'idle'"
      :feedback="aiFeedback || null"
      :error="aiError || null"
      :can-retry="Boolean(aiCanRetry)"
      :skill="test.skill as 'writing' | 'speaking'"
      :task-number="test.taskNumber"
      :submission="submission || ''"
      @retry="emit('retryAi')"
    />

    <!-- Chi tiết từng câu hỏi & Lời giải thích -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-xl font-black text-ink">
          Chi tiết bài làm & Giải thích đáp án
        </h3>
        <span class="text-xs font-bold text-ink-soft">
          Xem lại để rút kinh nghiệm
        </span>
      </div>

      <div class="space-y-4">
        <div
          v-for="(q, idx) in test.questions"
          :key="q.id"
          class="rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut space-y-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2 border-b-2 border-line pb-2.5">
            <div class="flex items-center gap-2">
              <span class="flex h-6 w-6 items-center justify-center rounded border border-line bg-surface-2 font-display text-xs font-black">
                {{ idx + 1 }}
              </span>
              <span class="rounded border border-line bg-warn px-2 py-0.2 text-[10px] font-black text-on-tone">
                {{ q.categoryTag }}
              </span>
              <span v-if="q.passageSectionRef" class="text-xs text-ink-soft font-bold">
                (Tham chiếu: {{ q.passageSectionRef }})
              </span>
            </div>

            <!-- Huy hiệu Đúng / Sai -->
            <div class="flex items-center gap-1.5">
              <span
                v-if="checkIsCorrect(idx + 1, userAnswers[idx + 1], q.correctAnswer)"
                class="flex items-center gap-1 rounded border-2 border-line bg-ok px-2 py-0.5 text-xs font-black text-on-tone shadow-brut-sm"
              >
                <CheckCircle class="h-3.5 w-3.5" :stroke-width="3" />
                <span>Đúng</span>
              </span>
              <span
                v-else
                class="flex items-center gap-1 rounded border-2 border-line bg-bad px-2 py-0.5 text-xs font-black text-on-tone shadow-brut-sm"
              >
                <XCircle class="h-3.5 w-3.5" :stroke-width="3" />
                <span>Sai</span>
              </span>
            </div>
          </div>

          <!-- Nội dung câu hỏi -->
          <p class="font-display text-sm sm:text-base font-bold text-ink">
            {{ q.questionText }}
          </p>

          <!-- So sánh câu trả lời của thí sinh vs Đáp án đúng -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div class="rounded border-2 border-line bg-surface-2 p-2.5">
              <span class="text-ink-soft font-bold block mb-1">Câu trả lời của bạn:</span>
              <p class="font-black text-sm" :class="checkIsCorrect(idx + 1, userAnswers[idx + 1], q.correctAnswer) ? 'text-ok' : 'text-bad'">
                {{ userAnswers[idx + 1] || '(Chưa trả lời)' }}
              </p>
            </div>

            <div class="rounded border-2 border-line bg-ok/20 p-2.5">
              <span class="text-ink-soft font-bold block mb-1">Đáp án đúng chính thức:</span>
              <p class="font-black text-sm text-ink">
                {{ q.correctAnswer }}
              </p>
            </div>
          </div>

          <!-- Giải thích: mở khi cần, chỉ đúng đoạn văn / đoạn audio liên quan -->
          <div>
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center gap-2 rounded-brut border-2 border-line px-3.5 font-display text-xs font-black cursor-pointer brut-press"
              :class="checkIsCorrect(idx + 1, userAnswers[idx + 1], q.correctAnswer)
                ? 'bg-surface-2 text-ink'
                : 'bg-accent text-accent-ink shadow-brut-sm'"
              :aria-expanded="Boolean(openExplanations[idx])"
              :aria-controls="`explain-${idx}`"
              @click="openExplanations[idx] = !openExplanations[idx]"
            >
              <Lightbulb class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
              <span>{{ openExplanations[idx] ? 'Ẩn giải thích' : 'Xem giải thích' }}</span>
              <ChevronDown
                class="h-4 w-4 transition-transform"
                :class="{ 'rotate-180': openExplanations[idx] }"
                :stroke-width="2.5"
                aria-hidden="true"
              />
            </button>
            <div
              v-if="openExplanations[idx]"
              :id="`explain-${idx}`"
              class="mt-3 rounded-brut border-2 border-line bg-surface-2 p-3.5"
            >
              <QuestionExplanation :question="q" :test="test" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
