<script setup lang="ts">
import {
  Keyboard,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Volume2,
  CheckCircle2,
  Zap,
  BookOpen,
  Trophy,
  ArrowUpRight,
  HelpCircle,
} from '@lucide/vue'
import { useLanguage } from '~/composables/useLanguage'
import { useTypingPractice, type TypingSentence } from '~/composables/useTypingPractice'
import PageBanner from '~/components/common/PageBanner.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { BRAND_NAME } from '~/constants/brand'

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
  {
    title: 'Chỉ số tốc độ & Tổng kết',
    description: 'Theo dõi WPM (từ/phút), độ chính xác (%) và hoàn thành toàn bộ chủ đề để nhận XP thưởng.',
    targetId: 'practice-stats-dashboard',
    badge: 'Bước 4',
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
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6" data-feature="go-cau">
    <FirstVisitGuide page-key="go_cau_practice_guide" :steps="guideSteps" />

    <!-- Top Navigation Bar -->
    <div class="flex items-center justify-between">
      <NuxtLink
        to="/go-cau"
        class="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-black uppercase text-ink-soft hover:text-ink transition-colors"
      >
        <ArrowLeft class="w-4 h-4 stroke-[2.5]" />
        <span>Về danh sách chủ đề</span>
      </NuxtLink>

      <div class="flex items-center gap-2">
        <BaseBadge tone="warn" size="sm">
          {{ currentTopic?.group === 'life' ? 'Đời sống' : 'Công sở' }}
        </BaseBadge>
        <BaseBadge tone="accent" size="sm">
          {{ currentTopic?.level }}
        </BaseBadge>
      </div>
    </div>

    <!-- DẢI MÀU HIỂN THỊ WPM VÀ ĐỘ CHÍNH XÁC PHÍA TRÊN -->
    <div class="rounded-brut-lg border-[3px] border-line bg-c-green p-4 text-on-tone shadow-brut flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-6">
        <div>
          <span class="text-[11px] font-black uppercase text-on-tone/80 block">Tốc độ gõ tức thời</span>
          <div class="flex items-baseline gap-1.5">
            <span class="font-display text-3xl font-black text-on-tone leading-none">{{ currentStats.wpm }}</span>
            <span class="font-mono text-xs font-bold text-on-tone">WPM</span>
          </div>
        </div>

        <div class="border-l-2 border-line/30 pl-6">
          <span class="text-[11px] font-black uppercase text-on-tone/80 block">Độ chính xác</span>
          <div class="flex items-baseline gap-1.5">
            <span class="font-display text-3xl font-black text-on-tone leading-none">{{ currentStats.accuracy }}%</span>
            <span class="font-mono text-xs font-bold text-on-tone">({{ currentStats.errors }} lỗi)</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="rounded-brut border-2 border-line bg-surface px-3 py-1 text-xs font-black text-ink shadow-[1px_1px_0_var(--line)]">
          Câu {{ currentIndex + 1 }} / {{ sentences.length }}
        </span>
        <span class="rounded-brut border-2 border-line bg-warn px-3 py-1 text-xs font-black text-on-tone shadow-[1px_1px_0_var(--line)]">
          +{{ currentIndex * 25 }} XP
        </span>
      </div>
    </div>

    <!-- MÀN HÌNH TỔNG KẾT KHI HOÀN THÀNH TOÀN BỘ CHỦ ĐỀ -->
    <BaseCard v-if="isTopicFinished" tone="surface" class="border-ok">
      <div class="py-8 text-center space-y-6 max-w-lg mx-auto">
        <div class="w-16 h-16 mx-auto rounded-full border-[3px] border-line bg-warn text-on-tone flex items-center justify-center shadow-brut">
          <Trophy class="w-8 h-8 stroke-[2.5]" />
        </div>

        <div class="space-y-2">
          <h2 class="text-3xl font-black text-ink font-display">
            Hoàn thành xuất sắc chủ đề!
          </h2>
          <p class="text-sm font-medium text-ink-soft">
            Bạn đã phản xạ toàn bộ {{ sentences.length }} câu thuộc chủ đề "{{ currentTopic?.title }}".
          </p>
        </div>

        <!-- Chỉ số tổng kết -->
        <div class="grid grid-cols-3 gap-3 p-4 bg-surface-2 rounded-brut border-2 border-line shadow-brut-sm">
          <div>
            <p class="text-[10px] font-bold uppercase text-ink-soft">Tốc độ trung bình</p>
            <p class="text-2xl font-black text-ink font-mono mt-1">{{ overallStats.avgWpm }}</p>
            <p class="text-[9px] text-ink-soft">WPM</p>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase text-ink-soft">Độ chính xác</p>
            <p class="text-2xl font-black text-ink font-mono mt-1">{{ overallStats.avgAcc }}%</p>
            <p class="text-[9px] text-ink-soft">Accuracy</p>
          </div>
          <div>
            <p class="text-[10px] font-bold uppercase text-ink-soft">Phần thưởng</p>
            <p class="text-2xl font-black text-ok font-mono mt-1">+{{ overallStats.totalXP }}</p>
            <p class="text-[9px] text-ink-soft">XP {{ BRAND_NAME }}</p>
          </div>
        </div>

        <div class="flex items-center justify-center gap-3 pt-2">
          <BaseButton variant="secondary" size="md" @click="restartTopic">
            <RotateCcw class="w-4 h-4 mr-1.5" />
            <span>Luyện lại chủ đề</span>
          </BaseButton>
          <BaseButton to="/go-cau" variant="primary" size="md">
            <span>Chọn chủ đề khác</span>
            <ArrowRight class="w-4 h-4 ml-1.5" />
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- MÀN HÌNH LUYỆN GÕ CHÍNH -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Cột chính: Câu hỏi & Ô gõ (2 cols) -->
      <div class="lg:col-span-2 space-y-6">
        <BaseCard id="practice-target-box" tone="surface">
          <div class="space-y-4">
            <!-- Header câu -->
            <div class="flex items-center justify-between text-xs font-mono font-bold text-ink-soft border-b border-line pb-2">
              <span>Mục tiêu phản xạ #{{ currentIndex + 1 }}</span>
              <span class="px-2 py-0.5 rounded-brut bg-surface-2 border border-line">
                Phím tắt: Tab để gõ lại • Enter để tiếp tục
              </span>
            </div>

            <!-- Câu tiếng Việt nguồn (Cỡ chữ lớn ở giữa) -->
            <div class="p-6 bg-surface-2 rounded-brut-lg border-[3px] border-line shadow-brut text-center space-y-2">
              <span class="inline-block px-2.5 py-0.5 rounded-brut border border-line bg-warn text-[11px] font-black uppercase text-on-tone">
                Dịch và gõ lại câu sau:
              </span>
              <p class="text-2xl sm:text-3xl font-black text-ink leading-relaxed">
                "{{ currentSentence?.sourceText }}"
              </p>
            </div>

            <!-- Phiên âm & Nút nghe -->
            <div class="flex items-center justify-between pt-1">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="inline-flex items-center min-h-[44px] gap-1.5 px-3.5 py-2 text-xs font-bold border-2 border-line rounded-brut bg-surface hover:bg-surface-2 text-ink shadow-brut-sm cursor-pointer transition-transform active:translate-y-0.5"
                  title="Nghe phát âm chuẩn"
                  aria-label="Nghe phát âm mẫu chuẩn"
                  @click="speakSentence"
                >
                  <Volume2 class="w-4 h-4 text-accent" :stroke-width="2.5" />
                  <span>Nghe mẫu</span>
                </button>
                <span v-if="currentSentence?.phonetic" class="text-xs sm:text-sm font-mono text-ink-soft italic">
                  {{ currentSentence.phonetic }}
                </span>
              </div>

              <!-- Gợi ý từ tiếp theo -->
              <div v-if="currentSentence?.hintWord" id="next-word-hint-box" class="text-xs font-mono">
                <span class="text-ink-soft font-bold mr-1">Gợi ý từ:</span>
                <span class="px-2 py-0.5 rounded-brut bg-warn/25 border border-line font-black text-ink">
                  {{ currentSentence.hintWord }}
                </span>
              </div>
            </div>

            <!-- Khung so khớp ký tự trực quan (Tô xanh đúng / Đỏ sai) -->
            <div class="p-4 bg-surface rounded-brut border-[3px] border-line font-mono text-lg sm:text-xl font-bold tracking-wide select-none min-h-[4.5rem] flex flex-wrap items-center">
              <template v-for="(char, idx) in currentSentence?.targetText" :key="idx">
                <span
                  class="transition-colors"
                  :class="{
                    'text-ok font-black bg-ok/20 rounded-xs': idx < userInput.length && userInput[idx] === char,
                    'text-bad font-black bg-bad/20 underline decoration-bad decoration-2': idx < userInput.length && userInput[idx] !== char,
                    'text-ink-soft/40': idx >= userInput.length,
                  }"
                >
                  {{ char === ' ' ? '&nbsp;' : char }}
                </span>
              </template>
            </div>

            <!-- Tiến độ câu -->
            <div class="space-y-1">
              <div class="flex justify-between text-xs font-mono font-bold text-ink-soft">
                <span>Tiến độ câu:</span>
                <span>{{ currentStats.progressPercent }}%</span>
              </div>
              <div class="h-2.5 w-full border-2 border-line bg-surface-2 rounded-brut overflow-hidden">
                <div
                  class="h-full bg-accent transition-all duration-100"
                  :style="{ width: `${currentStats.progressPercent}%` }"
                />
              </div>
            </div>

            <!-- Ô nhập liệu có hỗ trợ IME -->
            <div class="space-y-2 pt-2">
              <label for="practice-input-field" class="block text-xs font-black uppercase text-ink-soft">
                Nhập câu vào đây (Hỗ trợ tiếng Trung / Nhật IME):
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
                class="w-full px-4 py-3.5 text-lg font-mono font-bold rounded-brut border-[3px] border-line bg-surface text-ink shadow-brut focus:shadow-brut-lg focus:border-focus transition-all outline-none disabled:bg-surface-2 disabled:cursor-not-allowed"
                placeholder="Bắt đầu gõ tại đây..."
                @input="onInput"
                @compositionstart="onCompositionStart"
                @compositionend="onCompositionEnd"
                @keydown="onKeyDown"
              >
            </div>

            <!-- Nút điều hướng -->
            <div class="flex items-center justify-between pt-2">
              <BaseButton variant="secondary" size="sm" class="gap-1.5" @click="resetSentenceSession">
                <RotateCcw class="w-4 h-4" />
                <span>Gõ lại (Tab)</span>
              </BaseButton>

              <div class="flex items-center gap-2">
                <BaseButton
                  variant="secondary"
                  size="sm"
                  :disabled="currentIndex === 0"
                  @click="goToPrevSentence"
                >
                  <ArrowLeft class="w-4 h-4 mr-1" />
                  <span>Câu trước</span>
                </BaseButton>
                <BaseButton
                  variant="primary"
                  size="sm"
                  @click="goToNextSentence"
                >
                  <span>{{ currentIndex === sentences.length - 1 ? 'Tổng kết' : 'Câu kế tiếp' }}</span>
                  <ArrowRight class="w-4 h-4 ml-1" />
                </BaseButton>
              </div>
            </div>

            <!-- Banner chúc mừng khi xong câu -->
            <div
              v-if="isSentenceDone"
              class="p-4 rounded-brut border-2 border-line bg-ok/20 text-ink flex items-center justify-between gap-4 animate-in fade-in zoom-in-95 duration-200"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 bg-ok rounded-brut border border-line text-on-tone">
                  <CheckCircle2 class="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <p class="font-black text-sm sm:text-base">Chính xác hoàn toàn!</p>
                  <p class="text-xs text-ink-soft font-bold">
                    Tốc độ: {{ currentStats.wpm }} WPM • Độ chính xác: {{ currentStats.accuracy }}%
                  </p>
                </div>
              </div>

              <BaseButton variant="primary" size="sm" @click="goToNextSentence">
                Tiếp tục (Enter)
              </BaseButton>
            </div>
          </div>
        </BaseCard>

        <!-- Chú thích ngữ pháp & Cấu trúc câu -->
        <BaseCard v-if="currentSentence?.grammarNote" tone="surface-2">
          <template #header>
            <div class="flex items-center gap-2 font-black text-sm">
              <BookOpen class="w-4 h-4 text-accent" :stroke-width="2.5" />
              <span>Ghi chú ngữ pháp & Cách diễn đạt tự nhiên</span>
            </div>
          </template>
          <p class="text-sm font-medium text-ink leading-relaxed">
            {{ currentSentence.grammarNote }}
          </p>
        </BaseCard>
      </div>

      <!-- Cột phụ: Chỉ số phản xạ & Danh sách câu (1 col) -->
      <div id="practice-stats-dashboard" class="space-y-6">
        <BaseCard tone="surface">
          <template #header>
            <div class="flex items-center gap-2 font-black text-sm">
              <Zap class="w-4 h-4 text-warn" :stroke-width="2.5" />
              <span>Chỉ số gõ thời gian thực</span>
            </div>
          </template>

          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-surface-2 rounded-brut border-2 border-line text-center">
              <p class="text-[10px] font-bold text-ink-soft uppercase">Tốc độ gõ</p>
              <p class="text-3xl font-black text-ink mt-1 font-mono">{{ currentStats.wpm }}</p>
              <p class="text-[10px] text-ink-soft mt-0.5">từ / phút</p>
            </div>

            <div class="p-3 bg-surface-2 rounded-brut border-2 border-line text-center">
              <p class="text-[10px] font-bold text-ink-soft uppercase">Chính xác</p>
              <p class="text-3xl font-black text-ink mt-1 font-mono">{{ currentStats.accuracy }}%</p>
              <p class="text-[10px] text-ink-soft mt-0.5">{{ currentStats.errors }} lỗi ký tự</p>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t-2 border-line space-y-2 text-xs font-bold text-ink-soft">
            <div class="flex justify-between">
              <span>Đang làm:</span>
              <span class="text-ink">Câu {{ currentIndex + 1 }} / {{ sentences.length }}</span>
            </div>
            <div class="flex justify-between">
              <span>Tích lũy phiên:</span>
              <span class="text-ok font-black">+{{ (currentIndex) * 25 }} XP</span>
            </div>
          </div>
        </BaseCard>

        <!-- Danh sách câu trong chủ đề -->
        <BaseCard tone="surface">
          <template #header>
            <span class="font-black text-sm">Danh sách câu trong chủ đề</span>
          </template>

          <div class="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            <button
              v-for="(sent, sIdx) in sentences"
              :key="sent.id"
              type="button"
              class="w-full text-left p-2.5 min-h-[44px] rounded-brut border-2 transition-all flex items-center justify-between text-xs cursor-pointer"
              :class="[
                sIdx === currentIndex
                  ? 'border-line bg-warn text-on-tone font-black shadow-brut-sm'
                  : 'border-line/40 bg-surface hover:bg-surface-2 text-ink',
              ]"
              @click="currentIndex = sIdx; resetSentenceSession()"
            >
              <div class="truncate pr-2">
                <span class="font-mono mr-1.5 font-bold">#{{ sIdx + 1 }}</span>
                <span>{{ sent.sourceText }}</span>
              </div>
              <CheckCircle2
                v-if="sessionResults.some(r => r.sentenceId === sent.id)"
                class="w-3.5 h-3.5 text-ok stroke-[3] flex-shrink-0"
              />
            </button>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
