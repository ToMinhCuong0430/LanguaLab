<script setup lang="ts">
import { ArrowRight, Check, CheckCircle2, RotateCcw, Trophy, XCircle } from '@lucide/vue'
import { useLanguage } from '~/composables/useLanguage'
import { useGrammar, type GrammarExercise, type GrammarPoint } from '~/composables/useGrammar'
import { BRAND_NAME } from '~/constants/brand'

// Phiên bài tập ngữ pháp: một bài mỗi màn, Kiểm tra -> Tiếp tục. Dùng layout lesson.
definePageMeta({ layout: false })

const route = useRoute()
const pointId = computed(() => String(route.params.id || ''))

const { currentLang } = useLanguage()
const { getGrammarPointById, markPointCompleted, submitGrammarAttempt } = useGrammar(currentLang)

const point = computed<GrammarPoint | undefined>(() => getGrammarPointById(pointId.value))
const exercises = computed<GrammarExercise[]>(() => point.value?.exercises ?? [])

useHead({
  title: computed(() => `Bài tập: ${point.value?.title || 'Ngữ pháp'} - ${BRAND_NAME}`),
})

const currentIndex = ref(0)
const isChecked = ref(false)
const isFinished = ref(false)
const results = ref<boolean[]>([])

// Câu trả lời theo từng bài
const choiceAnswers = ref<Record<string, number>>({})
const blankAnswers = ref<Record<string, string>>({})
const wordOrders = ref<Record<string, string[]>>({})
const availableWords = ref<Record<string, string[]>>({})

const exercise = computed(() => exercises.value[currentIndex.value])

const resetAll = () => {
  currentIndex.value = 0
  isChecked.value = false
  isFinished.value = false
  results.value = []
  choiceAnswers.value = {}
  blankAnswers.value = {}
  wordOrders.value = {}
  availableWords.value = {}
  exercises.value.forEach((ex) => {
    if (ex.type === 'word_reorder' && ex.scrambledWords) {
      availableWords.value[ex.id] = [...ex.scrambledWords]
      wordOrders.value[ex.id] = []
    }
  })
}
watch(point, resetAll, { immediate: true })

const pickWord = (ex: GrammarExercise, word: string, idx: number) => {
  if (isChecked.value) return
  wordOrders.value[ex.id] = [...(wordOrders.value[ex.id] || []), word]
  availableWords.value[ex.id]!.splice(idx, 1)
}
const unpickWord = (ex: GrammarExercise, word: string, idx: number) => {
  if (isChecked.value) return
  wordOrders.value[ex.id]!.splice(idx, 1)
  availableWords.value[ex.id]!.push(word)
}
const resetOrder = (ex: GrammarExercise) => {
  if (isChecked.value || !ex.scrambledWords) return
  availableWords.value[ex.id] = [...ex.scrambledWords]
  wordOrders.value[ex.id] = []
}

const hasAnswer = computed(() => {
  const ex = exercise.value
  if (!ex) return false
  if (ex.type === 'multiple_choice') return choiceAnswers.value[ex.id] !== undefined
  if (ex.type === 'fill_in_blank') return (blankAnswers.value[ex.id] || '').trim().length > 0
  return (wordOrders.value[ex.id] || []).length > 0
})

const isCorrect = (ex: GrammarExercise) => {
  if (ex.type === 'multiple_choice') return choiceAnswers.value[ex.id] === ex.correctIndex
  if (ex.type === 'fill_in_blank') {
    return (blankAnswers.value[ex.id] || '').trim().toLowerCase() === (ex.correctAnswer || '').trim().toLowerCase()
  }
  return (wordOrders.value[ex.id] || []).join(' ') === (ex.correctOrder || []).join(' ')
}

const correctAnswerText = (ex: GrammarExercise) => {
  if (ex.type === 'multiple_choice') return ex.options?.[ex.correctIndex ?? -1] ?? ''
  if (ex.type === 'fill_in_blank') return ex.correctAnswer ?? ''
  return (ex.correctOrder || []).join(' ')
}

const lastCorrect = computed(() => results.value[currentIndex.value] === true)
const correctCount = computed(() => results.value.filter(Boolean).length)

const check = () => {
  if (!exercise.value || !hasAnswer.value) return
  results.value[currentIndex.value] = isCorrect(exercise.value)
  isChecked.value = true
}

// Đúng hết thì đánh dấu hoàn thành và gửi bài để RPC chấm điểm, cộng XP (như trang bài học trước đây)
const finish = () => {
  isFinished.value = true
  if (!point.value || correctCount.value !== exercises.value.length) return
  markPointCompleted(point.value.id)
  const answers: Record<string, string> = {}
  exercises.value.forEach((ex) => {
    if (ex.type === 'multiple_choice') {
      const idx = choiceAnswers.value[ex.id]
      if (idx !== undefined && ex.options?.[idx]) answers[ex.id] = ex.options[idx]
    } else if (ex.type === 'fill_in_blank') {
      answers[ex.id] = blankAnswers.value[ex.id] || ''
    } else {
      answers[ex.id] = (wordOrders.value[ex.id] || []).join(' ')
    }
  })
  submitGrammarAttempt(point.value.id, answers)
}

const next = () => {
  if (currentIndex.value < exercises.value.length - 1) {
    currentIndex.value += 1
    isChecked.value = false
  } else {
    finish()
  }
}

const lessonProgress = computed(() => {
  const total = exercises.value.length
  if (!total) return 0
  if (isFinished.value) return 1
  return (currentIndex.value + (isChecked.value ? 1 : 0)) / total
})

const TYPE_LABEL: Record<string, string> = {
  multiple_choice: 'Chọn đáp án đúng',
  fill_in_blank: 'Điền vào chỗ trống',
  word_reorder: 'Sắp xếp thành câu',
}
</script>

<template>
  <NuxtLayout
    name="lesson"
    :progress="lessonProgress"
    :total-segments="exercises.length || 1"
    :close-to="point ? `/ngu-phap/${point.id}` : '/ngu-phap'"
    close-label="Đóng, về bài học ngữ pháp"
  >
    <div class="space-y-5" data-feature="ngu-phap">
      <div v-if="!point || !exercises.length" class="space-y-2 pt-8 text-center">
        <h1 class="font-display text-xl font-black text-ink">{{ point ? 'Bài học này chưa có bài tập' : 'Không tìm thấy bài học' }}</h1>
        <p class="text-sm text-ink-soft">Quay lại danh mục Ngữ pháp để chọn bài khác.</p>
      </div>

      <!-- Kết quả -->
      <section v-else-if="isFinished" class="space-y-4 pt-6 text-center" aria-labelledby="grammar-finish-title">
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-line text-on-tone"
          :class="correctCount === exercises.length ? 'bg-ok' : 'bg-warn'"
        >
          <Trophy class="h-8 w-8" :stroke-width="2.5" aria-hidden="true" />
        </div>
        <h1 id="grammar-finish-title" class="font-display text-2xl font-black text-ink">
          Đúng {{ correctCount }} / {{ exercises.length }} bài
        </h1>
        <p class="text-sm text-ink-soft">
          <template v-if="correctCount === exercises.length">
            "{{ point.title }}" đã được đánh dấu hoàn thành. Bạn nhận +{{ point.xpReward }} XP.
          </template>
          <template v-else>Làm đúng tất cả bài để hoàn thành "{{ point.title }}" và nhận +{{ point.xpReward }} XP.</template>
        </p>
        <button
          type="button"
          class="inline-flex min-h-[44px] items-center gap-1.5 px-3 text-sm font-bold text-ink underline cursor-pointer"
          @click="resetAll"
        >
          <RotateCcw class="h-4 w-4" aria-hidden="true" /> Làm lại bài tập
        </button>
      </section>

      <!-- Một bài tập -->
      <template v-else-if="exercise">
        <div class="flex items-center justify-between text-xs font-bold text-ink-soft">
          <span class="truncate pr-2">{{ point.title }}</span>
          <span class="shrink-0 tabular-nums">Bài {{ currentIndex + 1 }} / {{ exercises.length }}</span>
        </div>

        <div class="space-y-2">
          <p class="text-xs font-bold text-ink-soft">{{ TYPE_LABEL[exercise.type] }}. {{ exercise.prompt }}</p>
          <h1 v-if="exercise.type !== 'word_reorder'" class="font-display text-2xl font-black leading-snug text-ink">
            {{ exercise.question }}
          </h1>
        </div>

        <!-- Trắc nghiệm -->
        <div v-if="exercise.type === 'multiple_choice'" class="space-y-2" role="radiogroup" :aria-label="exercise.question">
          <button
            v-for="(opt, oIdx) in exercise.options"
            :key="oIdx"
            type="button"
            role="radio"
            :aria-checked="choiceAnswers[exercise.id] === oIdx"
            :disabled="isChecked"
            class="flex w-full min-h-[52px] items-center justify-between gap-2 rounded-brut border-2 px-4 text-left text-sm font-bold cursor-pointer disabled:cursor-default"
            :class="[
              isChecked && oIdx === exercise.correctIndex
                ? 'border-line bg-ok text-on-tone'
                : isChecked && choiceAnswers[exercise.id] === oIdx
                  ? 'border-line bg-bad text-white'
                  : choiceAnswers[exercise.id] === oIdx
                    ? 'border-line bg-warn text-on-tone'
                    : 'border-line/50 bg-surface text-ink hover:bg-surface-2',
            ]"
            @click="choiceAnswers[exercise.id] = oIdx"
          >
            <span>{{ opt }}</span>
            <Check v-if="isChecked && oIdx === exercise.correctIndex" class="h-4 w-4 shrink-0" :stroke-width="3" aria-hidden="true" />
          </button>
        </div>

        <!-- Điền từ -->
        <div v-else-if="exercise.type === 'fill_in_blank'" class="space-y-1.5">
          <label :for="`blank-${exercise.id}`" class="block text-xs font-bold text-ink-soft">Câu trả lời của bạn</label>
          <input
            :id="`blank-${exercise.id}`"
            v-model="blankAnswers[exercise.id]"
            type="text"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            :disabled="isChecked"
            :placeholder="exercise.hint || 'Nhập từ thích hợp'"
            class="w-full rounded-brut border-2 bg-surface px-4 py-3 font-mono text-lg font-bold text-ink outline-none focus:ring-2 focus:ring-focus"
            :class="isChecked ? (lastCorrect ? 'border-ok bg-ok/15' : 'border-bad bg-bad/10') : 'border-line'"
            @keydown.enter.prevent="isChecked ? next() : check()"
          >
        </div>

        <!-- Xếp câu -->
        <div v-else class="space-y-3">
          <div class="flex min-h-[4rem] flex-wrap items-center gap-1.5 rounded-brut border-2 border-line bg-surface p-3" aria-live="polite">
            <span v-if="!(wordOrders[exercise.id] || []).length" class="text-sm italic text-ink-soft">Chạm vào các từ bên dưới để ghép câu</span>
            <button
              v-for="(w, wIdx) in wordOrders[exercise.id]"
              :key="`o-${wIdx}`"
              type="button"
              class="min-h-[44px] rounded-brut border-2 border-line bg-warn px-3 text-sm font-bold text-on-tone cursor-pointer disabled:cursor-default"
              :disabled="isChecked"
              :aria-label="`Bỏ từ ${w}`"
              @click="unpickWord(exercise, w, wIdx)"
            >
              {{ w }}
            </button>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="(w, wIdx) in availableWords[exercise.id]"
              :key="`a-${wIdx}`"
              type="button"
              class="min-h-[44px] rounded-brut border-2 border-line/60 bg-surface-2 px-3 text-sm font-bold text-ink hover:bg-surface cursor-pointer"
              :disabled="isChecked"
              @click="pickWord(exercise, w, wIdx)"
            >
              {{ w }}
            </button>
          </div>
          <button
            v-if="!isChecked"
            type="button"
            class="inline-flex min-h-[44px] items-center gap-1 px-1 text-xs font-bold text-ink-soft hover:text-ink cursor-pointer"
            @click="resetOrder(exercise)"
          >
            <RotateCcw class="h-3.5 w-3.5" aria-hidden="true" /> Xếp lại
          </button>
        </div>

        <!-- Nhận xét sau khi kiểm tra -->
        <div
          v-if="isChecked"
          class="space-y-1 rounded-brut border-2 p-3 text-sm"
          :class="lastCorrect ? 'border-line bg-ok/20' : 'border-bad bg-bad/10'"
          role="status"
        >
          <p class="flex items-center gap-2 font-black text-ink">
            <CheckCircle2 v-if="lastCorrect" class="h-5 w-5 text-ok" :stroke-width="2.5" aria-hidden="true" />
            <XCircle v-else class="h-5 w-5 text-bad" :stroke-width="2.5" aria-hidden="true" />
            {{ lastCorrect ? 'Chính xác' : 'Chưa đúng' }}
          </p>
          <p v-if="!lastCorrect" class="text-ink">Đáp án: <strong class="font-mono">{{ correctAnswerText(exercise) }}</strong></p>
          <p class="text-ink-soft">{{ exercise.explanation }}</p>
        </div>
      </template>
    </div>

    <template #action>
      <BaseButton
        v-if="!point || !exercises.length || isFinished"
        to="/ngu-phap"
        variant="success"
        size="lg"
        block
      >
        <span>Về danh mục Ngữ pháp</span>
      </BaseButton>
      <BaseButton v-else-if="!isChecked" variant="success" size="lg" block :disabled="!hasAnswer" @click="check">
        <span>Kiểm tra</span>
      </BaseButton>
      <BaseButton v-else variant="success" size="lg" block @click="next">
        <span>{{ currentIndex === exercises.length - 1 ? 'Xem kết quả' : 'Tiếp tục' }}</span>
        <template #right><ArrowRight class="h-5 w-5" :stroke-width="2.5" /></template>
      </BaseButton>
    </template>
  </NuxtLayout>
</template>
