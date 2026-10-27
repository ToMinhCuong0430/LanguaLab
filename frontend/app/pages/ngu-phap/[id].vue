<script setup lang="ts">
import {
  Layers,
  Volume2,
  AlertTriangle,
  Check,
  X,
  BookOpen,
  HelpCircle,
  Trophy,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
} from '@lucide/vue'
import { useLanguage } from '~/composables/useLanguage'
import { useGrammar, type GrammarPoint, type GrammarExercise } from '~/composables/useGrammar'
import PageBanner from '~/components/common/PageBanner.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { levelBadge, xpBadge } from '~/constants/badges'

const route = useRoute()
const pointId = computed(() => (route.params.id as string) || 'en-a1-tobe')

const { currentLang } = useLanguage()
const { getGrammarPointById, markPointCompleted, completedPointIds, submitGrammarAttempt } = useGrammar(currentLang)

const currentPoint = computed<GrammarPoint>(() => {
  return getGrammarPointById(pointId.value) || getGrammarPointById('en-a1-tobe')!
})

useHead({
  title: computed(() => `Ngữ pháp: ${currentPoint.value?.title || 'Bài học'} - Langua`),
})

const guideSteps: GuideStep[] = [
  {
    title: 'Sơ đồ khối công thức & Giải thích',
    description: 'Nắm vững bản chất quy tắc qua sơ đồ khối và lưu ý ngữ pháp trước khi thực hành.',
    targetId: 'lesson-formula-card',
    badge: 'Bước 1',
  },
  {
    title: 'Ví dụ bản xứ & Nghe phát âm',
    description: 'Bấm nút loa để nghe phát âm câu ví dụ chuẩn ngữ điệu và tham khảo bản dịch tiếng Việt.',
    targetId: 'lesson-examples-card',
    badge: 'Bước 2',
  },
  {
    title: 'Bẫy ngữ pháp thường gặp',
    description: 'Đối chiếu các lỗi sai kinh điển người học hay mắc với cách viết chuẩn mực.',
    targetId: 'lesson-pitfalls-card',
    badge: 'Bước 3',
  },
  {
    title: 'Bài tập 3 dạng: Chọn, Điền & Xếp câu',
    description: 'Làm bài tập tương tác có chấm điểm tức thì và giải thích chi tiết. Hoàn thành để nhận +30 XP.',
    targetId: 'lesson-exercises-card',
    badge: 'Bước 4',
  },
]

// ==========================================
// QUẢN LÝ BÀI TẬP THỰC HÀNH
// ==========================================
// State cho Multiple Choice
const userChoiceAnswers = ref<Record<string, number>>({})

// State cho Fill in Blank
const userBlankAnswers = ref<Record<string, string>>({})

// State cho Word Reorder
const userWordOrders = ref<Record<string, string[]>>({})
const availableWords = ref<Record<string, string[]>>({})

// Khởi tạo các từ xáo trộn cho bài tập xếp câu
watch(currentPoint, (pt) => {
  if (pt?.exercises) {
    userChoiceAnswers.value = {}
    userBlankAnswers.value = {}
    userWordOrders.value = {}
    availableWords.value = {}
    isSubmitted.value = false

    pt.exercises.forEach((ex) => {
      if (ex.type === 'word_reorder' && ex.scrambledWords) {
        availableWords.value[ex.id] = [...ex.scrambledWords]
        userWordOrders.value[ex.id] = []
      }
    })
  }
}, { immediate: true })

// Thao tác bấm từ trong bài tập xếp câu
const selectWordForOrder = (exId: string, word: string, wordIdx: number) => {
  if (isSubmitted.value) return
  if (!userWordOrders.value[exId]) userWordOrders.value[exId] = []
  userWordOrders.value[exId].push(word)
  availableWords.value[exId].splice(wordIdx, 1)
}

const deselectWordFromOrder = (exId: string, word: string, wordIdx: number) => {
  if (isSubmitted.value) return
  userWordOrders.value[exId].splice(wordIdx, 1)
  availableWords.value[exId].push(word)
}

const resetWordOrder = (ex: GrammarExercise) => {
  if (isSubmitted.value) return
  if (ex.scrambledWords) {
    availableWords.value[ex.id] = [...ex.scrambledWords]
    userWordOrders.value[ex.id] = []
  }
}

// Chấm điểm bài tập
const isSubmitted = ref(false)
const isAllCorrect = ref(false)
const showCelebration = ref(false)

const submitAllExercises = () => {
  isSubmitted.value = true

  let allOk = true
  currentPoint.value.exercises.forEach((ex) => {
    if (ex.type === 'multiple_choice') {
      if (userChoiceAnswers.value[ex.id] !== ex.correctIndex) allOk = false
    } else if (ex.type === 'fill_in_blank') {
      const userVal = (userBlankAnswers.value[ex.id] || '').trim().toLowerCase()
      const correctVal = (ex.correctAnswer || '').trim().toLowerCase()
      if (userVal !== correctVal) allOk = false
    } else if (ex.type === 'word_reorder') {
      const userOrder = userWordOrders.value[ex.id] || []
      const correctOrder = ex.correctOrder || []
      if (userOrder.join(' ') !== correctOrder.join(' ')) allOk = false
    }
  })

  isAllCorrect.value = allOk
  if (allOk) {
    markPointCompleted(currentPoint.value.id)
    showCelebration.value = true

    // Gửi bài làm lên server để RPC chấm điểm và tự động nhận thưởng XP
    const answersMap: Record<string, string> = {}
    currentPoint.value.exercises.forEach((ex) => {
      if (ex.type === 'multiple_choice') {
        const idx = userChoiceAnswers.value[ex.id]
        if (idx !== undefined && ex.options?.[idx]) {
          answersMap[ex.id] = ex.options[idx]
        }
      } else if (ex.type === 'fill_in_blank') {
        answersMap[ex.id] = userBlankAnswers.value[ex.id] || ''
      } else if (ex.type === 'word_reorder') {
        answersMap[ex.id] = (userWordOrders.value[ex.id] || []).join(' ')
      }
    })
    submitGrammarAttempt(currentPoint.value.id, answersMap)
  }
}

const resetExercises = () => {
  isSubmitted.value = false
  isAllCorrect.value = false
  showCelebration.value = false
  userChoiceAnswers.value = {}
  userBlankAnswers.value = {}
  currentPoint.value.exercises.forEach((ex) => {
    if (ex.type === 'word_reorder' && ex.scrambledWords) {
      availableWords.value[ex.id] = [...ex.scrambledWords]
      userWordOrders.value[ex.id] = []
    }
  })
}

// Web Speech API
const speakText = (text: string) => {
  if (!import.meta.client || !window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(text)
  if (currentLang.value === 'en') utterance.lang = 'en-US'
  else if (currentLang.value === 'zh') utterance.lang = 'zh-CN'
  else if (currentLang.value === 'ja') utterance.lang = 'ja-JP'
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6" data-feature="ngu-phap">
    <FirstVisitGuide page-key="ngu_phap_lesson_guide" :steps="guideSteps" />

    <!-- Top Navigation Bar -->
    <div class="flex items-center justify-between">
      <NuxtLink
        to="/ngu-phap"
        class="inline-flex items-center gap-1.5 text-xs font-black uppercase text-ink-soft hover:text-ink transition-colors"
      >
        <ArrowLeft class="w-4 h-4 stroke-[2.5]" />
        <span>Về danh mục Ngữ pháp</span>
      </NuxtLink>

      <div class="flex items-center gap-2">
        <BaseBadge v-bind="levelBadge(currentPoint.level)" size="sm">{{ currentPoint.level }}</BaseBadge>
        <span
          v-if="completedPointIds.includes(currentPoint.id)"
          class="inline-flex items-center gap-1 text-xs font-black text-ok bg-ok/15 px-2.5 py-1 rounded-brut border border-ok"
        >
          <CheckCircle2 class="w-3.5 h-3.5 stroke-[3]" />
          Đã hoàn thành
        </span>
      </div>
    </div>

    <!-- Page Banner -->
    <PageBanner
      feature="ngu-phap"
      :title="currentPoint.title"
      :description="currentPoint.vietnameseTitle"
      badge-text="Chuyên đề ngữ pháp"
      badge-tone="warn"
    >
      <template #icon>
        <Layers class="h-6 w-6 text-on-tone" :stroke-width="2.5" />
      </template>

      <template #actions>
        <div class="flex items-center gap-2">
          <BaseBadge tone="green" size="sm">
            {{ currentPoint.exercises.length }} bài tập
          </BaseBadge>
          <BaseBadge v-bind="xpBadge(currentPoint.xpReward)" size="sm" />
        </div>
      </template>
    </PageBanner>

    <!-- BANNER CHÚC MỪNG HOÀN THÀNH CỘNG XP -->
    <div
      v-if="showCelebration"
      class="p-5 rounded-brut border-[3px] border-line bg-ok/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-200"
    >
      <div class="flex items-center gap-3">
        <div class="p-3 bg-ok rounded-brut border-2 border-line text-on-tone shadow-brut-sm">
          <Trophy class="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <h3 class="font-black text-base sm:text-lg text-ink">Xuất sắc! Bạn đã làm đúng 100% bài tập</h3>
          <p class="text-xs text-ink-soft font-bold">Điểm ngữ pháp "{{ currentPoint.title }}" đã được đánh dấu hoàn thành. Bạn nhận được +{{ currentPoint.xpReward }} XP!</p>
        </div>
      </div>

      <NuxtLink
        to="/ngu-phap"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-brut border-2 border-line bg-warn text-on-tone font-black text-xs shadow-brut transition-transform active:translate-y-0.5"
      >
        <span>Tiếp tục chuyên đề khác</span>
        <ArrowRight class="w-4 h-4 stroke-[3]" />
      </NuxtLink>
    </div>

    <!-- MAIN LESSON WORKSPACE (2 COLS) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Cột trái: Lý thuyết, Ví dụ, Bẫy lỗi (2 cols) -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Card 1: Công thức & Giải thích -->
        <BaseCard id="lesson-formula-card" tone="surface">
          <template #header>
            <div class="flex items-center gap-2 font-black text-sm">
              <BookOpen class="w-4 h-4 text-accent" />
              <span>Sơ đồ khối công thức & Bản chất ngữ pháp</span>
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-sm font-medium text-ink leading-relaxed">
              {{ currentPoint.summary }}
            </p>

            <!-- Khối công thức trực quan -->
            <div class="p-4 bg-surface-2 rounded-brut border-2 border-line shadow-brut-sm space-y-3">
              <p class="text-xs font-mono font-bold text-ink-soft uppercase tracking-wide">
                Cấu trúc: {{ currentPoint.formula.pattern }}
              </p>

              <div class="flex flex-wrap items-center gap-2">
                <div
                  v-for="(token, tIdx) in currentPoint.formula.tokens"
                  :key="tIdx"
                  class="px-3 py-2 rounded-brut border-2 border-line text-xs font-black shadow-brut-sm"
                  :class="{
                    'bg-warn text-on-tone': token.role === 'subject',
                    'bg-accent text-white': token.role === 'verb',
                    'bg-ok text-on-tone': token.role === 'object',
                    'bg-mark text-on-tone': token.role === 'particle',
                    'bg-surface text-ink': token.role === 'modifier',
                  }"
                >
                  {{ token.label }}
                </div>
              </div>
            </div>

            <!-- Giải thích ngắn bằng tiếng Việt -->
            <div class="space-y-2 pt-2">
              <span class="text-xs font-black uppercase text-ink-soft block">Lưu ý sử dụng cốt lõi:</span>
              <ul class="space-y-1.5 text-xs sm:text-sm text-ink font-medium">
                <li
                  v-for="(note, nIdx) in currentPoint.explanationNotes"
                  :key="nIdx"
                  class="flex items-start gap-2 p-2 bg-surface-2/60 rounded-brut border border-line"
                >
                  <span class="p-0.5 bg-warn text-on-tone rounded-xs font-mono font-bold text-[10px]">{{ nIdx + 1 }}</span>
                  <span>{{ note }}</span>
                </li>
              </ul>
            </div>
          </div>
        </BaseCard>

        <!-- Card 2: Ví dụ thực tế có Nghe & Dịch -->
        <BaseCard v-if="currentPoint.examples?.length" id="lesson-examples-card" tone="surface">
          <template #header>
            <div class="flex items-center gap-2 font-black text-sm">
              <Volume2 class="w-4 h-4 text-accent" />
              <span>Ví dụ ngữ cảnh thực tế (Bấm nghe giọng mẫu)</span>
            </div>
          </template>

          <div class="space-y-3">
            <div
              v-for="(ex, exIdx) in currentPoint.examples"
              :key="exIdx"
              class="p-4 rounded-brut border-2 border-line bg-surface space-y-2 shadow-brut-sm hover:bg-surface-2/50 transition-colors"
            >
              <div class="flex items-start justify-between gap-3">
                <p class="text-base sm:text-lg font-black text-ink font-display">
                  "{{ ex.sentence || ex.target }}"
                </p>
                <button
                  type="button"
                  class="p-1.5 rounded-brut border-2 border-line bg-surface hover:bg-surface-2 text-ink shadow-brut-sm cursor-pointer flex-shrink-0"
                  title="Nghe phát âm"
                  @click="speakText(ex.sentence || ex.target)"
                >
                  <Volume2 class="w-4 h-4 text-accent stroke-[2.5]" />
                </button>
              </div>

              <p v-if="ex.reading || ex.phonetic" class="text-xs font-mono text-ink-soft italic">
                {{ ex.reading || ex.phonetic }}
              </p>

              <p class="text-xs sm:text-sm text-ink-soft font-medium">
                Dịch: {{ ex.translation || ex.vi }}
              </p>
            </div>
          </div>
        </BaseCard>

        <!-- Card 3: Bẫy lỗi thường gặp (Common Pitfalls) -->
        <BaseCard id="lesson-pitfalls-card" tone="surface-2">
          <template #header>
            <div class="flex items-center gap-2 font-black text-sm">
              <AlertTriangle class="w-4 h-4 text-bad" />
              <span>Bẫy lỗi thường gặp cần tránh</span>
            </div>
          </template>

          <div class="space-y-4">
            <div
              v-for="(pit, pIdx) in currentPoint.pitfalls"
              :key="pIdx"
              class="p-4 rounded-brut border-2 border-line bg-surface space-y-2.5 shadow-brut-sm"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-1.5 text-xs font-black text-bad">
                  <X class="w-4 h-4 stroke-[3]" />
                  <span>Cách dùng SAI:</span>
                </div>
                <p class="p-2.5 rounded-brut border border-bad bg-bad/10 text-bad font-mono text-xs sm:text-sm line-through">
                  {{ pit.wrong }}
                </p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center gap-1.5 text-xs font-black text-ok">
                  <Check class="w-4 h-4 stroke-[3]" />
                  <span>Cách dùng ĐÚNG:</span>
                </div>
                <p class="p-2.5 rounded-brut border border-ok bg-ok/10 text-ink font-mono text-xs sm:text-sm font-bold">
                  {{ pit.correct }}
                </p>
              </div>

              <p class="text-xs text-ink-soft pt-1 font-medium">
                <strong class="text-ink">Giải thích: </strong> {{ pit.explanation }}
              </p>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Cột phải: 3 Dạng Bài tập củng cố (1 col) -->
      <div id="lesson-exercises-card" class="space-y-6">
        <BaseCard tone="surface">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-black text-sm">
                <HelpCircle class="w-4 h-4 text-accent" />
                <span>Bài tập thực hành củng cố</span>
              </div>
              <BaseBadge tone="warn" size="sm">
                {{ currentPoint.exercises.length }} câu
              </BaseBadge>
            </div>
          </template>

          <div class="space-y-6 py-2">
            <div
              v-for="(ex, exIdx) in currentPoint.exercises"
              :key="ex.id"
              class="p-4 rounded-brut border-2 border-line bg-surface-2 space-y-3"
            >
              <!-- DẠNG 1: TRẮC NGHIỆM CHỌN ĐÁP ÁN -->
              <div v-if="ex.type === 'multiple_choice'" class="space-y-3">
                <div class="flex items-center justify-between text-xs font-bold text-ink-soft">
                  <span class="font-mono">#{{ exIdx + 1 }} • Trắc nghiệm</span>
                </div>
                <p class="text-xs font-bold text-ink-soft">{{ ex.prompt }}</p>
                <p class="text-sm font-black text-ink font-mono">{{ ex.question }}</p>

                <div class="space-y-1.5">
                  <button
                    v-for="(opt, optIdx) in ex.options"
                    :key="optIdx"
                    type="button"
                    class="w-full text-left p-2.5 rounded-brut border-2 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
                    :class="[
                      userChoiceAnswers[ex.id] === optIdx
                        ? 'border-line bg-warn text-on-tone font-black shadow-brut-sm'
                        : 'border-line/40 bg-surface hover:bg-surface-2 text-ink',
                      isSubmitted && optIdx === ex.correctIndex
                        ? '!bg-ok !border-line !text-on-tone font-black'
                        : '',
                      isSubmitted && userChoiceAnswers[ex.id] === optIdx && optIdx !== ex.correctIndex
                        ? '!bg-bad !border-line !text-white'
                        : '',
                    ]"
                    @click="userChoiceAnswers[ex.id] = optIdx"
                  >
                    <span>{{ opt }}</span>
                    <Check
                      v-if="isSubmitted && optIdx === ex.correctIndex"
                      class="w-4 h-4 text-on-tone stroke-[3]"
                    />
                  </button>
                </div>
              </div>

              <!-- DẠNG 2: ĐIỀN CHỖ TRỐNG -->
              <div v-else-if="ex.type === 'fill_in_blank'" class="space-y-3">
                <div class="flex items-center justify-between text-xs font-bold text-ink-soft">
                  <span class="font-mono">#{{ exIdx + 1 }} • Điền từ</span>
                </div>
                <p class="text-xs font-bold text-ink-soft">{{ ex.prompt }}</p>
                <p class="text-sm font-black text-ink font-mono">{{ ex.question }}</p>

                <input
                  v-model="userBlankAnswers[ex.id]"
                  type="text"
                  :disabled="isSubmitted"
                  :placeholder="ex.hint || 'Nhập từ thích hợp...'"
                  class="w-full px-3 py-2 text-sm font-mono font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
                  :class="{
                    '!border-ok !bg-ok/20': isSubmitted && (userBlankAnswers[ex.id] || '').trim().toLowerCase() === (ex.correctAnswer || '').trim().toLowerCase(),
                    '!border-bad !bg-bad/20': isSubmitted && (userBlankAnswers[ex.id] || '').trim().toLowerCase() !== (ex.correctAnswer || '').trim().toLowerCase(),
                  }"
                >
              </div>

              <!-- DẠNG 3: SẮP XẾP TỪ THÀNH CÂU -->
              <div v-else-if="ex.type === 'word_reorder'" class="space-y-3">
                <div class="flex items-center justify-between text-xs font-bold text-ink-soft">
                  <span class="font-mono">#{{ exIdx + 1 }} • Xếp câu</span>
                  <button
                    v-if="!isSubmitted"
                    type="button"
                    class="text-[11px] font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                    @click="resetWordOrder(ex)"
                  >
                    <RotateCcw class="w-3 h-3" />
                    <span>Làm lại</span>
                  </button>
                </div>

                <p class="text-xs font-bold text-ink-soft">{{ ex.prompt }}</p>

                <!-- Vùng câu người học đang ghép -->
                <div class="p-3 bg-surface rounded-brut border-2 border-line min-h-[3rem] flex flex-wrap gap-1.5 items-center">
                  <span v-if="!userWordOrders[ex.id] || userWordOrders[ex.id].length === 0" class="text-xs text-ink-soft italic">
                    Nhấp vào các từ bên dưới để ghép vào đây...
                  </span>

                  <button
                    v-for="(w, wIdx) in userWordOrders[ex.id]"
                    :key="wIdx"
                    type="button"
                    class="px-2 py-1 bg-warn text-on-tone rounded-brut border border-line text-xs font-black shadow-brut-sm cursor-pointer"
                    @click="deselectWordFromOrder(ex.id, w, wIdx)"
                  >
                    {{ w }} &times;
                  </button>
                </div>

                <!-- Danh sách từ xáo trộn để chọn -->
                <div class="flex flex-wrap gap-1.5 pt-1">
                  <button
                    v-for="(w, wIdx) in availableWords[ex.id]"
                    :key="wIdx"
                    type="button"
                    class="px-2.5 py-1 bg-surface-2 hover:bg-surface text-ink rounded-brut border border-line text-xs font-bold cursor-pointer"
                    @click="selectWordForOrder(ex.id, w, wIdx)"
                  >
                    {{ w }}
                  </button>
                </div>
              </div>

              <!-- Giải thích chi tiết sau khi nộp bài -->
              <div v-if="isSubmitted" class="p-2.5 bg-surface rounded-brut border border-line text-xs space-y-1">
                <p class="font-black text-accent">Đáp án & Giải thích:</p>
                <p class="text-ink-soft font-medium">{{ ex.explanation }}</p>
              </div>
            </div>

            <!-- Nút Nộp bài / Làm lại -->
            <div class="flex items-center justify-between pt-2">
              <BaseButton v-if="isSubmitted" variant="secondary" size="sm" @click="resetExercises">
                <RotateCcw class="w-4 h-4 mr-1.5" />
                <span>Làm lại bài tập</span>
              </BaseButton>

              <BaseButton v-else variant="primary" size="sm" class="w-full" @click="submitAllExercises">
                <span>Chấm điểm bài tập</span>
                <ArrowRight class="w-4 h-4 ml-1.5" />
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
