<script setup lang="ts">
import {
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Volume2,
  CheckCircle2,
  BookOpen,
  Trophy,
} from '@lucide/vue'
import { useLanguage } from '~/composables/useLanguage'
import { useTypingPractice, type TypingSentence } from '~/composables/useTypingPractice'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { BRAND_NAME } from '~/constants/brand'

// Phiên gõ từng câu dùng layout lesson (bọc bằng <NuxtLayout name="lesson"> để truyền tiến độ)
definePageMeta({ layout: false })

const route = useRoute()
const chuDeSlug = computed(() => (route.params.chuDe as string) || 'mua-sam')

const { currentLang, currentLanguageOption } = useLanguage()
const { getTopicBySlug, submitAttempt } = useTypingPractice(currentLang)

const currentTopic = computed(() => getTopicBySlug(chuDeSlug.value))
const sentences = computed(() => currentTopic.value?.sentences || [])

useHead({
  title: computed(() => `Luyện gõ: ${currentTopic.value?.title || 'Chủ đề'} - ${BRAND_NAME}`),
})

const guideSteps: GuideStep[] = [
  {
    title: 'Câu nguồn & Nghĩa tiếng Việt',
    description: 'Đọc ý nghĩa câu văn và quan sát phiên âm mẫu. Bấm nút loa để nghe giọng đọc bản xứ.',
    targetId: 'practice-target-box',
    badge: 'Bước 1',
  },
  {
    title: 'Gõ câu & Hỗ trợ IME',
    description: 'Gõ lại câu vào ô nhập liệu. Hệ thống hỗ trợ hoàn toàn bộ gõ Tiếng Trung (Pinyin) và Tiếng Nhật (Mozc) mà không bị bắt lỗi khi đang gõ dở.',
    targetId: 'practice-input-field',
    badge: 'Bước 2',
  },
  {
    title: 'Gợi ý từ tiếp theo',
    description: 'Nếu bạn bị mắc kẹt, từ khóa quan trọng tiếp theo sẽ được hiển thị để bạn tiếp tục phản xạ.',
    targetId: 'next-word-hint-box',
    badge: 'Bước 3',
  },
]

// State quản lý phiên luyện gõ
const currentIndex = ref(0)
const currentSentence = computed<TypingSentence | undefined>(() => sentences.value[currentIndex.value] || sentences.value[0])

const inputRef = ref<HTMLInputElement | null>(null)
const userInput = ref('')
const isComposing = ref(false) // Quản lý IME cho Trung/Nhật
const startTime = ref<number | null>(null)
const endTime = ref<number | null>(null)
const isSentenceDone = ref(false)
const isTopicFinished = ref(false)

// Lịch sử kết quả từng câu
interface SentenceResult {
  sentenceId: string
  wpm: number
  accuracy: number
  errors: number
  durationSec: number
}
const sessionResults = ref<SentenceResult[]>([])

// Tiến độ cho thanh chia đoạn của layout lesson: số câu đã xong / tổng số câu
const lessonProgress = computed(() => {
  const total = sentences.value.length
  if (!total) return 0
  if (isTopicFinished.value) return 1
  return (currentIndex.value + (isSentenceDone.value ? 1 : 0)) / total
})

const resetSentenceSession = () => {
  userInput.value = ''
  isComposing.value = false
  startTime.value = null
  endTime.value = null
  isSentenceDone.value = false
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// Bắt đầu gõ
const onInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  userInput.value = val

  if (!startTime.value && val.length > 0) {
    startTime.value = Date.now()
  }

  // Nếu đang gõ IME (chưa ấn Enter chọn từ chữ Hán/Hiragana) thì chờ compositionend
  if (isComposing.value) return

  checkMatch(val)
}

const onCompositionStart = () => {
  isComposing.value = true
}

const onCompositionEnd = (e: CompositionEvent) => {
  isComposing.value = false
  checkMatch(userInput.value)
}

const checkMatch = (val: string) => {
  const target = currentSentence.value?.targetText.trim() || ''
  if (val.trim() === target) {
    endTime.value = Date.now()
    isSentenceDone.value = true

    // Ghi nhận chỉ số câu này
    const durationSec = Math.max(1, Math.round(((endTime.value || Date.now()) - (startTime.value || Date.now())) / 1000))
    const words = target.split(/\s+/).length
    const wpm = Math.round((words / durationSec) * 60)
    
    sessionResults.value.push({
      sentenceId: currentSentence.value?.id || '',
      wpm: Math.max(15, wpm),
      accuracy: currentStats.value.accuracy,
      errors: currentStats.value.errors,
      durationSec,
    })
  }
}

// Tính WPM và Accuracy thời gian thực
const currentStats = computed(() => {
  const target = currentSentence.value?.targetText || ''
  const current = userInput.value

  let errors = 0
  const compareLength = Math.min(current.length, target.length)
  for (let i = 0; i < compareLength; i++) {
    if (current[i] !== target[i]) {
      errors++
    }
  }

  // Nếu gõ dài hơn target thì các ký tự thừa cũng tính là lỗi
  if (current.length > target.length) {
    errors += (current.length - target.length)
  }

  const accuracy = current.length > 0
    ? Math.max(0, Math.round(((current.length - errors) / current.length) * 100))
    : 100

  let elapsedMinutes = 0
  if (startTime.value) {
    const now = endTime.value || Date.now()
    elapsedMinutes = (now - startTime.value) / 1000 / 60
  }

  const wordsTyped = current.trim().split(/\s+/).filter(Boolean).length
  const wpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0

  return {
    wpm,
    accuracy,
    errors,
    progressPercent: target.length > 0 ? Math.min(100, Math.round((current.length / target.length) * 100)) : 0,
  }
})

// Chuyển câu
const goToNextSentence = () => {
  if (currentIndex.value < sentences.value.length - 1) {
    currentIndex.value += 1
    resetSentenceSession()
  } else {
    isTopicFinished.value = true
    if (currentTopic.value) {
      submitAttempt(
        currentTopic.value.id,
        overallStats.value.avgWpm,
        overallStats.value.avgAcc,
        Math.max(10, sentences.value.length * 15)
      )
    }
  }
}

const goToPrevSentence = () => {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1
    resetSentenceSession()
  }
}

const restartTopic = () => {
  currentIndex.value = 0
  sessionResults.value = []
  isTopicFinished.value = false
  resetSentenceSession()
}

// Tổng kết chủ đề
const overallStats = computed(() => {
  const count = sessionResults.value.length || 1
  const avgWpm = Math.round(sessionResults.value.reduce((acc, r) => acc + r.wpm, 0) / count)
  const avgAcc = Math.round(sessionResults.value.reduce((acc, r) => acc + r.accuracy, 0) / count)
  const totalXP = sentences.value.length * 25
  return {
    avgWpm: avgWpm || currentStats.value.wpm,
    avgAcc: avgAcc || currentStats.value.accuracy,
    totalXP,
  }
})

// Web Speech API
const speakSentence = () => {
  if (!import.meta.client || !window.speechSynthesis || !currentSentence.value) return
  const utterance = new SpeechSynthesisUtterance(currentSentence.value.targetText)
  if (currentLang.value === 'en') utterance.lang = 'en-US'
  else if (currentLang.value === 'zh') utterance.lang = 'zh-CN'
  else if (currentLang.value === 'ja') utterance.lang = 'ja-JP'
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

// Bắt phím Enter / Tab
const onKeyDown = (e: KeyboardEvent) => {
  if (isSentenceDone.value && e.key === 'Enter') {
    e.preventDefault()
    goToNextSentence()
  } else if (e.key === 'Tab') {
    e.preventDefault()
    resetSentenceSession()
  }
}

onMounted(() => {
  inputRef.value?.focus()
})

watch(currentIndex, () => {
  resetSentenceSession()
})
</script>

<template>
  <NuxtLayout
    name="lesson"
    :progress="lessonProgress"
    :total-segments="sentences.length"
    close-to="/go-cau"
    close-label="Đóng, về danh sách chủ đề"
  >
    <div class="space-y-5" data-feature="go-cau">
      <FirstVisitGuide page-key="go_cau_practice_guide" :steps="guideSteps" />

      <!-- TỔNG KẾT KHI HOÀN THÀNH TOÀN BỘ CHỦ ĐỀ -->
      <section v-if="isTopicFinished" class="space-y-5 pt-4 text-center" aria-labelledby="typing-finish-title">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-line bg-warn text-on-tone">
          <Trophy class="h-8 w-8" :stroke-width="2.5" aria-hidden="true" />
        </div>
        <div class="space-y-1">
          <h1 id="typing-finish-title" class="font-display text-2xl font-black text-ink">Hoàn thành chủ đề</h1>
          <p class="text-sm text-ink-soft">
            Bạn đã gõ {{ sentences.length }} câu của chủ đề "{{ currentTopic?.title }}".
          </p>
        </div>
        <dl class="grid grid-cols-3 gap-2 rounded-brut border-2 border-line bg-surface p-4">
          <div>
            <dt class="text-[11px] font-bold text-ink-soft">Tốc độ TB</dt>
            <dd class="mt-1 font-mono text-2xl font-black text-ink tabular-nums">{{ overallStats.avgWpm }}</dd>
            <dd class="text-[11px] text-ink-soft">WPM</dd>
          </div>
          <div>
            <dt class="text-[11px] font-bold text-ink-soft">Chính xác</dt>
            <dd class="mt-1 font-mono text-2xl font-black text-ink tabular-nums">{{ overallStats.avgAcc }}%</dd>
          </div>
          <div>
            <dt class="text-[11px] font-bold text-ink-soft">Phần thưởng</dt>
            <dd class="mt-1 font-mono text-2xl font-black text-ink tabular-nums">+{{ overallStats.totalXP }}</dd>
            <dd class="text-[11px] text-ink-soft">XP</dd>
          </div>
        </dl>
        <button
          type="button"
          class="inline-flex min-h-[44px] items-center gap-1.5 px-3 text-sm font-bold text-ink underline cursor-pointer"
          @click="restartTopic"
        >
          <RotateCcw class="h-4 w-4" aria-hidden="true" />
          <span>Luyện lại chủ đề này</span>
        </button>
      </section>

      <!-- MÀN GÕ MỘT CÂU -->
      <template v-else>
        <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-ink-soft">
          <span class="flex items-center gap-1.5">
            <BaseBadge tone="warn" size="sm">{{ currentTopic?.group === 'life' ? 'Đời sống' : 'Công sở' }}</BaseBadge>
            <BaseBadge tone="accent" size="sm">{{ currentTopic?.level }}</BaseBadge>
          </span>
          <span class="tabular-nums" aria-live="polite">
            {{ currentStats.wpm }} WPM, {{ currentStats.accuracy }}% chính xác
          </span>
        </div>

        <!-- Câu tiếng Việt cần dịch và gõ lại -->
        <section id="practice-target-box" class="space-y-3" aria-labelledby="typing-source">
          <p class="text-xs font-bold text-ink-soft">Câu {{ currentIndex + 1 }} / {{ sentences.length }}. Dịch và gõ lại câu sau:</p>
          <h1 id="typing-source" class="font-display text-2xl font-black leading-snug text-ink sm:text-3xl">
            {{ currentSentence?.sourceText }}
          </h1>

          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-brut border-2 border-line bg-surface px-3 text-xs font-bold text-ink hover:bg-surface-2 cursor-pointer"
                aria-label="Nghe phát âm mẫu"
                @click="speakSentence"
              >
                <Volume2 class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
                <span>Nghe mẫu</span>
              </button>
              <span v-if="currentSentence?.phonetic" class="font-mono text-xs italic text-ink-soft">
                {{ currentSentence.phonetic }}
              </span>
            </div>
            <p v-if="currentSentence?.hintWord" id="next-word-hint-box" class="text-xs font-bold text-ink-soft">
              Gợi ý: <span class="rounded-brut border border-line bg-warn/25 px-1.5 py-0.5 font-mono text-ink">{{ currentSentence.hintWord }}</span>
            </p>
          </div>
        </section>

        <!-- So khớp từng ký tự: xanh đúng, đỏ sai -->
        <div
          class="flex min-h-[4.5rem] select-none flex-wrap items-center rounded-brut border-2 border-line bg-surface p-4 font-mono text-lg font-bold tracking-wide"
          aria-hidden="true"
        >
          <template v-for="(char, idx) in currentSentence?.targetText" :key="idx">
            <span
              :class="{
                'rounded-xs bg-ok/20 text-ok': idx < userInput.length && userInput[idx] === char,
                'bg-bad/20 text-bad underline decoration-2': idx < userInput.length && userInput[idx] !== char,
                'text-ink-soft opacity-40': idx >= userInput.length,
              }"
            >{{ char === ' ' ? '&nbsp;' : char }}</span>
          </template>
        </div>

        <div class="space-y-1.5">
          <label for="practice-input-field" class="block text-xs font-bold text-ink-soft">
            Gõ câu vào đây (hỗ trợ bộ gõ tiếng Trung / Nhật)
          </label>
          <input
            id="practice-input-field"
            ref="inputRef"
            type="text"
            :value="userInput"
            :disabled="isSentenceDone"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            class="w-full rounded-brut border-2 border-line bg-surface px-4 py-3 font-mono text-lg font-bold text-ink outline-none focus:border-focus focus:ring-2 focus:ring-focus disabled:cursor-not-allowed disabled:bg-surface-2"
            placeholder="Bắt đầu gõ tại đây..."
            @input="onInput"
            @compositionstart="onCompositionStart"
            @compositionend="onCompositionEnd"
            @keydown="onKeyDown"
          >
          <div class="flex items-center justify-between">
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center gap-1 px-1 text-xs font-bold text-ink-soft hover:text-ink cursor-pointer"
              @click="resetSentenceSession"
            >
              <RotateCcw class="h-3.5 w-3.5" aria-hidden="true" /> Gõ lại (Tab)
            </button>
            <button
              type="button"
              class="inline-flex min-h-[44px] items-center gap-1 px-1 text-xs font-bold text-ink-soft hover:text-ink cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="currentIndex === 0"
              @click="goToPrevSentence"
            >
              <ArrowLeft class="h-3.5 w-3.5" aria-hidden="true" /> Câu trước
            </button>
          </div>
        </div>

        <p
          v-if="isSentenceDone"
          class="flex items-center gap-2 rounded-brut border-2 border-line bg-ok/20 p-3 text-sm font-bold text-ink"
          role="status"
        >
          <CheckCircle2 class="h-5 w-5 shrink-0 text-ok" :stroke-width="2.5" aria-hidden="true" />
          Chính xác. {{ currentStats.wpm }} WPM, {{ currentStats.accuracy }}% chính xác. Nhấn Enter để tiếp tục.
        </p>

        <details v-if="currentSentence?.grammarNote" class="rounded-brut border-2 border-line bg-surface-2 p-3">
          <summary class="flex min-h-[32px] cursor-pointer items-center gap-2 text-sm font-bold text-ink">
            <BookOpen class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" /> Ghi chú ngữ pháp
          </summary>
          <p class="mt-2 text-sm leading-relaxed text-ink">{{ currentSentence.grammarNote }}</p>
        </details>
      </template>
    </div>

    <template #action>
      <BaseButton v-if="isTopicFinished" to="/go-cau" variant="success" size="lg" block>
        <span>Chọn chủ đề khác</span>
        <template #right><ArrowRight class="h-5 w-5" :stroke-width="2.5" /></template>
      </BaseButton>
      <BaseButton v-else-if="isSentenceDone" variant="success" size="lg" block @click="goToNextSentence">
        <span>{{ currentIndex === sentences.length - 1 ? 'Xem tổng kết' : 'Tiếp tục' }}</span>
        <template #right><ArrowRight class="h-5 w-5" :stroke-width="2.5" /></template>
      </BaseButton>
      <BaseButton v-else variant="secondary" size="lg" block @click="goToNextSentence">
        <span>{{ currentIndex === sentences.length - 1 ? 'Bỏ qua và xem tổng kết' : 'Bỏ qua câu này' }}</span>
      </BaseButton>
    </template>
  </NuxtLayout>
</template>
