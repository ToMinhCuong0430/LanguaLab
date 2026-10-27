<script setup lang="ts">
import {
  Volume2,
  Mic,
  Square,
  Play,
  RotateCw,
  Plus,
  Trash2,
  Edit3,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  FolderPlus,
  Layers,
  ArrowRight,
  ArrowLeft,
  X,
  AlertCircle,
  FileQuestion,
} from '@lucide/vue'
import { useLanguage } from '~/composables/useLanguage'
import { useVocab, type VocabWord, type VocabSet } from '~/composables/useVocab'
import LanguageSelector from '~/components/common/LanguageSelector.vue'
import PageBanner from '~/components/common/PageBanner.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { levelBadge } from '~/constants/badges'
import { BRAND_NAME } from '~/constants/brand'

useHead({
  title: `Từ vựng và phát âm chuyên sâu - ${BRAND_NAME}`,
})

const { currentLang, currentLanguageOption } = useLanguage()
const {
  activeTab,
  curatedSets,
  mySets,
  selectedSetId,
  activeSet,
  isLoading,
  errorMessage,
  fetchVocabData,
  createMySet,
  updateMySet,
  deleteMySet,
  addWordToMySet,
  removeWordFromMySet,
  rateWordSrs,
  uploadPronunciation,
} = useVocab(currentLang)

const guideSteps: GuideStep[] = [
  {
    title: 'Bộ đề xuất & Bộ của tôi',
    description: 'Chuyển đổi giữa các bộ từ tuyển chọn theo cấp độ (A1 - C1, HSK, JLPT) hoặc tự tạo bộ từ vựng cá nhân hoá của riêng bạn.',
    targetId: 'vocab-main-tabs',
    badge: 'Bước 1',
  },
  {
    title: 'Chế độ Flashcard & Ôn tập SRS',
    description: 'Lật thẻ xem nghĩa, đánh giá lặp lại ngắt quãng (SRS) hoặc làm trắc nghiệm nhanh 4 lựa chọn để khắc sâu từ mới.',
    targetId: 'vocab-mode-selector',
    badge: 'Bước 2',
  },
  {
    title: 'Ghi âm & So sánh phát âm bằng tai',
    description: 'Bấm nút mic để ghi âm giọng đọc của bạn, sau đó nghe lại song song với phát âm chuẩn bản xứ để tự điều chỉnh âm sắc.',
    targetId: 'pronunciation-recorder-box',
    badge: 'Bước 3',
  },
  {
    title: 'Quản lý & Thêm từ thủ công',
    description: 'Trong tab "Bộ của tôi", bạn có thể dễ dàng thêm từ mới, chỉnh sửa hoặc xuất nhập dữ liệu theo nhu cầu học.',
    targetId: 'custom-set-actions',
    badge: 'Bước 4',
  },
]

// Chế độ học bộ từ: 'flashcard' | 'srs' | 'quiz'
const studyMode = ref<'flashcard' | 'srs' | 'quiz'>('flashcard')

// Index từ đang hiển thị trong bộ
const currentWordIndex = ref(0)
const isCardFlipped = ref(false)

const currentWord = computed<VocabWord | undefined>(() => {
  return activeSet.value?.words[currentWordIndex.value] || activeSet.value?.words[0]
})

// Chuyển thẻ
const flipCard = () => {
  isCardFlipped.value = !isCardFlipped.value
}

const nextWord = () => {
  isCardFlipped.value = false
  if (currentWordIndex.value < (activeSet.value?.words.length || 1) - 1) {
    currentWordIndex.value += 1
  } else {
    currentWordIndex.value = 0
  }
}

const prevWord = () => {
  isCardFlipped.value = false
  if (currentWordIndex.value > 0) {
    currentWordIndex.value -= 1
  } else {
    currentWordIndex.value = (activeSet.value?.words.length || 1) - 1
  }
}

// Chấm điểm SRS và đồng bộ RPC SuperMemo SM-2
const rateSrs = (grade: 'again' | 'hard' | 'good' | 'easy') => {
  if (currentWord.value) {
    currentWord.value.srsState = grade
    rateWordSrs(currentWord.value.id, grade)
  }
  nextWord()
}

// Web Speech API
const speakWord = (text?: string) => {
  if (!import.meta.client || !window.speechSynthesis) return
  const wordToSpeak = text || currentWord.value?.term
  if (!wordToSpeak) return

  const utterance = new SpeechSynthesisUtterance(wordToSpeak)
  if (currentLang.value === 'en') utterance.lang = 'en-US'
  else if (currentLang.value === 'zh') utterance.lang = 'zh-CN'
  else if (currentLang.value === 'ja') utterance.lang = 'ja-JP'

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

// ==========================================
// THU ÂM NGƯỜI HỌC (MediaRecorder API)
// ==========================================
const isRecording = ref(false)
const userAudioUrl = ref<string | null>(null)
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []

const startRecording = async () => {
  if (!import.meta.client || !navigator.mediaDevices) return
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioChunks = []
    mediaRecorder = new MediaRecorder(stream)

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunks.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      userAudioUrl.value = URL.createObjectURL(audioBlob)
      stream.getTracks().forEach(track => track.stop())

      // Tải lên Supabase Storage bucket 'pronunciation-recordings' và lấy Signed URL
      if (currentWord.value) {
        uploadPronunciation(audioBlob, currentWord.value.term, currentWord.value.id).then(res => {
          if (res?.success && res.audioUrl) {
            userAudioUrl.value = res.audioUrl
          }
        })
      }
    }

    mediaRecorder.start()
    isRecording.value = true
  } catch (err) {
    alert('Không thể truy cập microphone. Vui lòng cấp quyền micro trên trình duyệt của bạn.')
  }
}

const stopRecording = () => {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
  }
}

const playUserAudio = () => {
  if (userAudioUrl.value) {
    const audio = new Audio(userAudioUrl.value)
    audio.play()
  }
}

// Reset thu âm khi chuyển từ
watch(currentWordIndex, () => {
  userAudioUrl.value = null
  isRecording.value = false
})

// ==========================================
// QUIZ TRẮC NGHIỆM NHANH (4 đáp án)
// ==========================================
const quizSelectedOption = ref<number | null>(null)
const isQuizSubmitted = ref(false)

const quizOptions = computed(() => {
  if (!activeSet.value || !currentWord.value) return []
  const correctMeaning = currentWord.value.meaning
  const otherWords = activeSet.value.words.filter(w => w.id !== currentWord.value?.id)
  
  // Trộn 3 đáp án sai
  const distractors = otherWords
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map(w => w.meaning)

  const all = [correctMeaning, ...distractors].sort(() => 0.5 - Math.random())
  return all
})

const submitQuizAnswer = (optIdx: number) => {
  if (isQuizSubmitted.value) return
  quizSelectedOption.value = optIdx
  isQuizSubmitted.value = true
}

const nextQuizQuestion = () => {
  quizSelectedOption.value = null
  isQuizSubmitted.value = false
  nextWord()
}

// ==========================================
// MODAL QUẢN LÝ BỘ CỦA TÔI & THÊM TỪ
// ==========================================
const isCreateSetModalOpen = ref(false)
const newSetTitle = ref('')
const newSetDesc = ref('')
const newSetLevel = ref('B1')

const handleCreateSet = () => {
  if (!newSetTitle.value.trim()) return
  const created = createMySet(newSetTitle.value.trim(), newSetDesc.value.trim(), newSetLevel.value)
  selectedSetId.value = created.id
  newSetTitle.value = ''
  newSetDesc.value = ''
  isCreateSetModalOpen.value = false
}

const isAddWordModalOpen = ref(false)
const newWordTerm = ref('')
const newWordPhonetic = ref('')
const newWordPartOfSpeech = ref('noun')
const newWordMeaning = ref('')
const newWordExample = ref('')
const newWordExampleMeaning = ref('')

const handleAddWord = () => {
  if (!newWordTerm.value.trim() || !newWordMeaning.value.trim()) return
  addWordToMySet(activeSet.value.id, {
    term: newWordTerm.value.trim(),
    phonetic: newWordPhonetic.value.trim() || `/${newWordTerm.value.trim()}/`,
    partOfSpeech: newWordPartOfSpeech.value,
    meaning: newWordMeaning.value.trim(),
    exampleTarget: newWordExample.value.trim() || 'This is an example sentence.',
    exampleMeaning: newWordExampleMeaning.value.trim() || 'Đây là câu ví dụ minh hoạ.',
  })

  newWordTerm.value = ''
  newWordPhonetic.value = ''
  newWordMeaning.value = ''
  newWordExample.value = ''
  newWordExampleMeaning.value = ''
  isAddWordModalOpen.value = false
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8" data-feature="tu-vung">
    <FirstVisitGuide page-key="tu_vung_guide" :steps="guideSteps" />

    <!-- Top Bar with Language Selector -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <LanguageSelector />
      </div>

      <div class="flex items-center gap-2 text-xs font-bold text-ink-soft">
        <span class="px-2 py-1 bg-surface-2 border border-line rounded-brut">Bộ đề xuất & Bộ của tôi</span>
        <span class="px-2 py-1 bg-surface-2 border border-line rounded-brut">Ghi âm so sánh bằng tai</span>
      </div>
    </div>

    <!-- Page Banner -->
    <PageBanner
      feature="tu-vung"
      title="Từ vựng & Luyện phát âm đối chiếu"
      description="Ghi nhớ từ vựng qua thẻ Flashcard lặp lại ngắt quãng (SRS) và luyện chuẩn âm ngữ điệu bằng cách ghi âm tự so sánh với mẫu bản xứ."
      badge-text="SRS & Âm vị"
      badge-tone="mark"
    >
      <template #icon>
        <Volume2 class="h-6 w-6 text-on-tone" :stroke-width="2.5" />
      </template>

      <template #actions>
        <div class="flex items-center gap-2">
          <BaseBadge tone="accent" size="sm">
            {{ currentLanguageOption.name }} • {{ curatedSets.length + mySets.length }} bộ từ
          </BaseBadge>
          <BaseBadge tone="ok" size="sm">
            Đang học: {{ activeSet?.words.length || 0 }} từ
          </BaseBadge>
        </div>
      </template>
    </PageBanner>

    <!-- Error State with Retry -->
    <div v-if="errorMessage" class="p-4 bg-warn-soft border-2 border-line rounded-brut shadow-brut flex items-center justify-between">
      <span class="text-xs font-bold text-ink">{{ errorMessage }}</span>
      <BaseButton tone="warn" size="sm" @click="fetchVocabData">Thử lại</BaseButton>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="p-6 bg-surface border-2 border-line rounded-brut shadow-brut animate-pulse space-y-4">
      <div class="h-5 bg-surface-2 rounded-brut w-1/4"></div>
      <div class="h-20 bg-surface-2 rounded-brut w-full"></div>
    </div>

    <!-- SECTION 1: TAB SELECTOR (BỘ ĐỀ XUẤT vs BỘ CỦA TÔI) -->
    <div id="vocab-main-tabs" class="space-y-4">
      <div class="flex items-center gap-2 border-b-2 border-line pb-2">
        <button
          type="button"
          class="px-5 py-2.5 rounded-brut border-2 font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
          :class="[
            activeTab === 'curated'
              ? 'bg-warn text-on-tone border-line shadow-brut-sm'
              : 'bg-surface hover:bg-surface-2 text-ink border-transparent hover:border-line',
          ]"
          @click="activeTab = 'curated'; selectedSetId = curatedSets[0]?.id || ''"
        >
          <Layers class="w-4 h-4 stroke-[2.5]" />
          <span>Bộ đề xuất ({{ curatedSets.length }} bộ)</span>
        </button>

        <button
          type="button"
          class="px-5 py-2.5 rounded-brut border-2 font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
          :class="[
            activeTab === 'my_sets'
              ? 'bg-warn text-on-tone border-line shadow-brut-sm'
              : 'bg-surface hover:bg-surface-2 text-ink border-transparent hover:border-line',
          ]"
          @click="activeTab = 'my_sets'; selectedSetId = mySets[0]?.id || ''"
        >
          <FolderPlus class="w-4 h-4 stroke-[2.5]" />
          <span>Bộ của tôi ({{ mySets.length }} bộ)</span>
        </button>
      </div>

      <!-- Danh sách bộ từ (Bộ đề xuất) - Thẻ to, có preview 3 từ đầu, vòng tiến độ -->
      <div v-if="activeTab === 'curated'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="set in curatedSets"
          :key="set.id"
          class="p-5 rounded-brut-lg border-[3px] transition-all cursor-pointer flex flex-col justify-between shadow-brut hover:-translate-y-1 hover:shadow-brut-lg"
          :class="[
            set.id === activeSet?.id
              ? 'border-line bg-c-pink-soft text-ink font-black ring-2 ring-c-pink'
              : 'border-line bg-surface hover:bg-surface-2 text-ink',
          ]"
          @click="selectedSetId = set.id; currentWordIndex = 0; isCardFlipped = false"
        >
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="rounded-brut border-2 border-line bg-warn px-2.5 py-0.5 text-xs font-black text-on-tone">
                {{ set.level }}
              </span>

              <!-- Mini Progress Circle -->
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold text-ink-soft">{{ set.words.length }} từ</span>
                <span class="px-2 py-0.5 rounded-brut border border-line bg-surface text-[10px] font-black text-c-pink-ink">
                  Đến hạn: {{ Math.min(6, set.words.length) }}
                </span>
              </div>
            </div>

            <div>
              <h3 class="font-black text-lg text-ink font-display line-clamp-1">
                {{ set.title }}
              </h3>
              <p class="text-xs text-ink-soft line-clamp-2 mt-0.5 font-medium leading-relaxed">
                {{ set.description }}
              </p>
            </div>

            <!-- PREVIEW: 3 TỪ ĐẦU HIỂN THỊ DẠNG CHIP -->
            <div class="rounded-brut border-2 border-line bg-surface p-2.5 space-y-1.5">
              <span class="text-[10px] font-black uppercase text-ink-soft tracking-wider block">
                Từ mẫu xem trước:
              </span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="w in set.words.slice(0, 3)"
                  :key="w.id"
                  class="px-2 py-0.5 rounded-brut border border-line bg-c-pink-soft text-c-pink-ink font-mono text-xs font-bold"
                >
                  {{ w.term }}
                </span>
                <span v-if="set.words.length > 3" class="text-[10px] text-ink-soft self-center font-bold">
                  +{{ set.words.length - 3 }} từ
                </span>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t-2 border-line/40 flex items-center justify-between text-xs font-bold text-ink-soft">
            <span class="text-ok font-black">Chuẩn Oxford / CEFR</span>
            <span class="text-c-pink-ink font-black underline">
              {{ set.id === activeSet?.id ? 'Đang chọn học ★' : 'Bấm để học' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Danh sách bộ từ (Bộ của tôi) -->
      <div v-else class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-ink-soft">
            Tự do thêm từ vựng gặp trong bài đọc, video hoặc công việc vào bộ từ riêng.
          </p>

          <button
            id="custom-set-actions"
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-brut border-2 border-line bg-warn hover:bg-warn/90 text-on-tone font-black text-xs shadow-brut-sm cursor-pointer"
            @click="isCreateSetModalOpen = true"
          >
            <Plus class="w-4 h-4 stroke-[3]" />
            <span>Tạo bộ từ mới</span>
          </button>
        </div>

        <div v-if="mySets.length === 0" class="p-8 text-center bg-surface rounded-brut border-2 border-line border-dashed space-y-2">
          <p class="font-black text-ink text-sm">Bạn chưa có bộ từ nào</p>
          <p class="text-xs text-ink-soft">Bấm "Tạo bộ từ mới" phía trên để bắt đầu thêm từ vựng cá nhân hoá!</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            v-for="set in mySets"
            :key="set.id"
            class="p-4 rounded-brut border-2 transition-all cursor-pointer flex flex-col justify-between"
            :class="[
              set.id === activeSet?.id
                ? 'border-line bg-warn/25 shadow-brut-sm font-black'
                : 'border-line bg-surface hover:bg-surface-2 text-ink',
            ]"
            @click="selectedSetId = set.id; currentWordIndex = 0; isCardFlipped = false"
          >
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <BaseBadge v-bind="levelBadge(set.level)" size="sm">{{ set.level }}</BaseBadge>
                <button
                  type="button"
                  class="text-bad hover:opacity-80 p-1"
                  title="Xoá bộ từ"
                  @click.stop="deleteMySet(set.id)"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
              <h3 class="font-black text-sm text-ink font-display line-clamp-1">
                {{ set.title }}
              </h3>
              <p class="text-xs text-ink-soft line-clamp-2">
                {{ set.description || 'Bộ từ tự tạo' }}
              </p>
            </div>

            <div class="mt-3 pt-2 border-t border-line/40 flex items-center justify-between text-[11px] font-bold text-ink-soft">
              <span>{{ set.words.length }} từ vựng</span>
              <span class="text-accent underline">Chọn học</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 2: KHU VỰC HỌC TẬP BỘ TỪ ĐANG CHỌN -->
    <div class="space-y-6">
      <!-- Bộ từ Header Bar & Chế độ học -->
      <div
        id="vocab-mode-selector"
        class="p-4 bg-surface rounded-brut border-2 border-line shadow-brut-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <BaseBadge v-if="activeSet?.level" v-bind="levelBadge(activeSet.level)" size="sm">{{ activeSet?.level }}</BaseBadge>
            <h2 class="text-base sm:text-lg font-black text-ink font-display">
              {{ activeSet?.title }}
            </h2>
          </div>
          <p class="text-xs text-ink-soft font-medium">
            Từ {{ currentWordIndex + 1 }} / {{ activeSet?.words.length || 0 }} • {{ activeSet?.description }}
          </p>
        </div>

        <!-- 3 Chế độ học: Flashcard / Ôn tập SRS / Trắc nghiệm -->
        <div class="flex items-center gap-1.5 p-1 bg-surface-2 border border-line rounded-brut">
          <button
            type="button"
            class="px-3 py-1 text-xs font-bold rounded-brut transition-all cursor-pointer"
            :class="studyMode === 'flashcard' ? 'bg-warn text-on-tone border border-line font-black shadow-brut-sm' : 'text-ink hover:text-black'"
            @click="studyMode = 'flashcard'"
          >
            Flashcard
          </button>
          <button
            type="button"
            class="px-3 py-1 text-xs font-bold rounded-brut transition-all cursor-pointer"
            :class="studyMode === 'srs' ? 'bg-warn text-on-tone border border-line font-black shadow-brut-sm' : 'text-ink hover:text-black'"
            @click="studyMode = 'srs'"
          >
            Ôn tập SRS
          </button>
          <button
            type="button"
            class="px-3 py-1 text-xs font-bold rounded-brut transition-all cursor-pointer"
            :class="studyMode === 'quiz' ? 'bg-warn text-on-tone border border-line font-black shadow-brut-sm' : 'text-ink hover:text-black'"
            @click="studyMode = 'quiz'"
          >
            Trắc nghiệm nhanh
          </button>
        </div>
      </div>

      <!-- Khung Thẻ chính nếu không có từ nào -->
      <div v-if="!currentWord" class="p-8 text-center bg-surface rounded-brut border-2 border-line space-y-3">
        <p class="font-bold text-ink">Bộ từ này hiện chưa có từ vựng nào.</p>
        <BaseButton v-if="activeSet?.isCustom" variant="primary" size="sm" @click="isAddWordModalOpen = true">
          Thêm từ vựng đầu tiên
        </BaseButton>
      </div>

      <!-- CHẾ ĐỘ 1 & 2: FLASHCARD VÀ SRS (TRÊN DESKTOP: FLASHCARD VÀ PHÁT ÂM ĐẶT CẠNH NHAU TRÊN 2 CỘT) -->
      <div v-else-if="studyMode === 'flashcard' || studyMode === 'srs'" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Cột trái (7 cols): Flashcard to hơn, mặt trước màu pink, mặt sau màu surface -->
        <div class="lg:col-span-7 space-y-4">
          <!-- Thẻ lật Neo-brutalism -->
          <div
            tabindex="0"
            role="button"
            class="min-h-[24rem] p-6 sm:p-8 rounded-brut-lg border-[3px] border-line shadow-brut-lg cursor-pointer select-none transition-all duration-200 relative flex flex-col justify-between hover:-translate-y-1 hover:shadow-brut"
            :class="[
              isCardFlipped
                ? 'bg-surface text-ink'
                : 'bg-c-pink text-ink',
            ]"
            @click="flipCard"
          >
            <!-- Card Header -->
            <div class="flex items-center justify-between border-b-2 border-line/40 pb-3">
              <span class="text-xs font-mono font-black" :class="isCardFlipped ? 'text-ink-soft' : 'text-ink'">
                Từ #{{ currentWordIndex + 1 }} / {{ activeSet?.words.length }}
              </span>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-brut border-2 border-line bg-surface hover:bg-surface-2 text-ink shadow-brut-sm cursor-pointer"
                  title="Nghe phát âm chuẩn"
                  aria-label="Nghe phát âm chuẩn từ vựng"
                  @click.stop="speakWord()"
                >
                  <Volume2 class="w-4 h-4 text-ink" :stroke-width="2.5" />
                </button>
                <span class="text-xs font-bold" :class="isCardFlipped ? 'text-ink-soft' : 'text-ink'">
                  {{ isCardFlipped ? 'Mặt sau (Nghĩa)' : 'Mặt trước (Bấm lật)' }}
                </span>
              </div>
            </div>

            <!-- Mặt trước (Nền màu Pink, chữ ink tương phản cao) -->
            <div v-if="!isCardFlipped" class="py-8 text-center space-y-4 flex-1 flex flex-col justify-center items-center">
              <h2 class="text-4xl sm:text-6xl font-black text-ink font-display tracking-tight">
                {{ currentWord.term }}
              </h2>
              <p class="text-lg sm:text-xl text-ink font-mono italic">
                {{ currentWord.phonetic }}
              </p>
              <div class="inline-block px-3 py-1 bg-surface rounded-brut border-2 border-line text-xs font-black text-ink shadow-[1px_1px_0_var(--line)]">
                Từ loại: {{ currentWord.partOfSpeech }}
              </div>
            </div>

            <!-- Mặt sau (Nền Surface trắng) -->
            <div v-else class="py-6 space-y-4 flex-1 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-150 text-ink">
              <div class="p-4 bg-c-pink-soft rounded-brut border-2 border-line">
                <p class="text-xs font-black uppercase text-c-pink-ink">Định nghĩa & Nghĩa:</p>
                <p class="text-2xl sm:text-3xl font-black text-ink mt-1">
                  {{ currentWord.meaning }}
                </p>
              </div>

              <div class="space-y-1 text-xs sm:text-sm">
                <p class="font-bold text-ink">Ví dụ ngữ cảnh:</p>
                <p class="p-3 bg-surface-2 rounded-brut border border-line text-ink font-medium italic">
                  "{{ currentWord.exampleTarget }}"
                </p>
                <p class="text-xs text-ink-soft font-medium pl-1">
                  Dịch: {{ currentWord.exampleMeaning }}
                </p>
              </div>
            </div>

            <!-- Card Footer -->
            <div class="flex items-center justify-between border-t-2 border-line/40 pt-3 text-xs font-bold" :class="isCardFlipped ? 'text-ink-soft' : 'text-ink'">
              <div class="flex items-center gap-1">
                <RotateCw class="w-3.5 h-3.5" />
                <span>Bấm vào thẻ để xoay</span>
              </div>

              <button
                v-if="activeSet?.isCustom"
                type="button"
                class="min-h-[44px] px-2 inline-flex items-center text-bad hover:underline font-bold text-xs"
                aria-label="Xoá từ này khỏi bộ từ"
                @click.stop="removeWordFromMySet(activeSet.id, currentWord.id)"
              >
                Xoá từ này
              </button>
            </div>
          </div>

          <!-- 4 NÚT ĐÁNH GIÁ LẶP LẠI NGẮT QUÃNG (SRS) CÓ 4 MÀU PHÂN BIỆT: CORAL, ORANGE, GREEN, BLUE -->
          <div v-if="studyMode === 'srs'" class="space-y-2">
            <p class="text-center text-xs font-black uppercase text-ink-soft">
              Đánh giá mức độ ghi nhớ (SRS):
            </p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <!-- Quên (Coral / Red) -->
              <button
                type="button"
                class="min-h-[44px] p-2.5 rounded-brut border-2 border-line bg-c-coral text-ink font-black text-xs shadow-brut-sm cursor-pointer text-center hover:opacity-90"
                @click="rateSrs('again')"
              >
                <span>Quên (Again)</span>
                <span class="block text-[10px] font-normal opacity-90 mt-0.5">&lt; 1 phút</span>
              </button>
              <!-- Khó (Orange) -->
              <button
                type="button"
                class="min-h-[44px] p-2.5 rounded-brut border-2 border-line bg-c-orange text-ink font-black text-xs shadow-brut-sm cursor-pointer text-center hover:opacity-90"
                @click="rateSrs('hard')"
              >
                <span>Khó (Hard)</span>
                <span class="block text-[10px] font-normal opacity-90 mt-0.5">10 phút</span>
              </button>
              <!-- Tốt (Green) -->
              <button
                type="button"
                class="p-2.5 rounded-brut border-2 border-line bg-c-green text-on-tone font-black text-xs shadow-brut-sm cursor-pointer text-center hover:opacity-90"
                @click="rateSrs('good')"
              >
                <span>Tốt (Good)</span>
                <span class="block text-[10px] font-normal opacity-90 mt-0.5">1 ngày</span>
              </button>
              <!-- Dễ (Blue) -->
              <button
                type="button"
                class="p-2.5 rounded-brut border-2 border-line bg-c-blue text-white font-black text-xs shadow-brut-sm cursor-pointer text-center hover:opacity-90"
                @click="rateSrs('easy')"
              >
                <span>Dễ (Easy)</span>
                <span class="block text-[10px] font-normal opacity-90 mt-0.5">4 ngày</span>
              </button>
            </div>
          </div>

          <!-- Điều hướng tới/lùi -->
          <div class="flex items-center justify-between pt-1">
            <BaseButton variant="secondary" size="sm" class="gap-1" @click="prevWord">
              <ArrowLeft class="w-4 h-4" />
              <span>Từ trước</span>
            </BaseButton>

            <span class="text-xs font-mono font-bold text-ink-soft">
              {{ currentWordIndex + 1 }} / {{ activeSet?.words.length }}
            </span>

            <BaseButton variant="secondary" size="sm" class="gap-1" @click="nextWord">
              <span>Từ sau</span>
              <ArrowRight class="w-4 h-4" />
            </BaseButton>
          </div>
        </div>

        <!-- Cột phải (5 cols): Khối luyện phát âm đối chiếu đặt cạnh Flashcard trên Desktop -->
        <div class="lg:col-span-5 space-y-4">
          <BaseCard id="pronunciation-recorder-box" tone="surface-2">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 font-black text-sm">
                  <Mic class="w-4 h-4 text-accent" />
                  <span>Luyện phát âm đối chiếu</span>
                </div>
                <span class="text-[11px] font-mono font-bold text-ink-soft">
                  {{ currentWord.phonetic }}
                </span>
              </div>
            </template>

            <div class="space-y-4 py-2">
              <div class="p-3 bg-surface rounded-brut border-2 border-line space-y-3">
                <p class="text-xs font-bold text-ink-soft uppercase tracking-wider">Từ đang luyện:</p>
                <div class="flex items-center justify-between">
                  <span class="font-display text-2xl font-black text-ink">{{ currentWord.term }}</span>
                  <button
                    type="button"
                    class="px-3 py-1.5 rounded-brut border-2 border-line bg-surface hover:bg-surface-2 text-ink font-black text-xs shadow-brut-sm cursor-pointer flex items-center gap-1.5"
                    @click="speakWord()"
                  >
                    <Volume2 class="w-4 h-4 text-c-blue stroke-[2.5]" />
                    <span>Nghe mẫu</span>
                  </button>
                </div>
              </div>

              <!-- Ghi âm người học -->
              <div class="space-y-2 p-3 bg-surface rounded-brut border-2 border-line">
                <div class="flex flex-col gap-2">
                  <button
                    v-if="!isRecording"
                    type="button"
                    class="w-full py-2.5 rounded-brut border-2 border-line bg-warn hover:bg-warn/90 text-on-tone font-black text-xs shadow-brut cursor-pointer flex items-center justify-center gap-2"
                    @click="startRecording"
                  >
                    <Mic class="w-4 h-4 stroke-[2.5]" />
                    <span>Bắt đầu thu âm giọng bạn</span>
                  </button>

                  <button
                    v-else
                    type="button"
                    class="w-full py-2.5 rounded-brut border-2 border-line bg-bad text-white font-black text-xs shadow-brut cursor-pointer flex items-center justify-center gap-2 animate-pulse"
                    @click="stopRecording"
                  >
                    <Square class="w-4 h-4 fill-current" />
                    <span>Dừng thu âm ngay</span>
                  </button>

                  <button
                    v-if="userAudioUrl"
                    type="button"
                    class="w-full py-2 rounded-brut border-2 border-line bg-ok text-on-tone font-black text-xs shadow-brut-sm cursor-pointer flex items-center justify-center gap-1.5"
                    @click="playUserAudio"
                  >
                    <Play class="w-4 h-4 fill-current" />
                    <span>Nghe lại giọng bạn đã thu</span>
                  </button>
                </div>
              </div>

              <div class="p-3 bg-surface rounded-brut border border-line/60 flex items-start gap-2 text-xs text-ink-soft">
                <AlertCircle class="w-4 h-4 text-warn flex-shrink-0 mt-0.5" />
                <span>So sánh bằng tai: nghe luân phiên giữa mẫu bản xứ và giọng thu âm của bạn để tự chỉnh khẩu hình & ngữ điệu.</span>
              </div>
            </div>
          </BaseCard>
        </div>
      </div>

      <!-- CHẾ ĐỘ 3: TRẮC NGHIỆM NHANH (QUIZ) -->
      <div v-else-if="studyMode === 'quiz'" class="max-w-2xl mx-auto space-y-4">
        <BaseCard tone="surface">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-black text-sm">
                <FileQuestion class="w-4 h-4 text-accent" />
                <span>Trắc nghiệm kiểm tra nghĩa từ vựng</span>
              </div>
              <span class="text-xs font-mono font-bold text-ink-soft">
                Câu {{ currentWordIndex + 1 }} / {{ activeSet?.words.length }}
              </span>
            </div>
          </template>

          <div class="space-y-5 py-2">
            <!-- Câu hỏi -->
            <div class="p-5 bg-surface-2 rounded-brut border-2 border-line shadow-brut-sm text-center space-y-1">
              <p class="text-xs font-bold uppercase text-ink-soft">Nghĩa của từ vựng sau là gì?</p>
              <h3 class="text-3xl font-black text-ink font-display">
                {{ currentWord.term }}
              </h3>
              <p class="text-xs font-mono text-ink-soft italic">
                {{ currentWord.phonetic }} ({{ currentWord.partOfSpeech }})
              </p>
            </div>

            <!-- 4 Đáp án -->
            <div class="space-y-2">
              <button
                v-for="(opt, oIdx) in quizOptions"
                :key="oIdx"
                type="button"
                class="w-full p-3.5 rounded-brut border-2 text-xs sm:text-sm font-bold text-left transition-all flex items-center justify-between cursor-pointer"
                :class="[
                  quizSelectedOption === oIdx
                    ? 'border-line bg-warn text-on-tone font-black shadow-brut-sm'
                    : 'border-line/40 bg-surface hover:bg-surface-2 text-ink',
                  isQuizSubmitted && opt === currentWord.meaning
                    ? '!bg-ok !border-line !text-on-tone font-black'
                    : '',
                  isQuizSubmitted && quizSelectedOption === oIdx && opt !== currentWord.meaning
                    ? '!bg-bad !border-line !text-white'
                    : '',
                ]"
                @click="submitQuizAnswer(oIdx)"
              >
                <span>{{ opt }}</span>
                <CheckCircle2
                  v-if="isQuizSubmitted && opt === currentWord.meaning"
                  class="w-4 h-4 text-on-tone flex-shrink-0 stroke-[3]"
                />
              </button>
            </div>

            <!-- Nút câu tiếp theo khi đã nộp đáp án -->
            <div v-if="isQuizSubmitted" class="flex justify-end pt-2">
              <BaseButton variant="primary" size="sm" @click="nextQuizQuestion">
                <span>Câu tiếp theo</span>
                <ArrowRight class="w-4 h-4 ml-1.5" />
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Nút thêm từ vào bộ (chỉ hiện khi là Bộ của tôi) -->
      <div v-if="activeSet?.isCustom" class="text-center pt-4">
        <BaseButton variant="secondary" size="sm" class="gap-1.5" @click="isAddWordModalOpen = true">
          <Plus class="w-4 h-4" />
          <span>Thêm từ vựng thủ công vào bộ này</span>
        </BaseButton>
      </div>
    </div>

    <!-- MODAL 1: TẠO BỘ TỪ MỚI -->
    <BaseModal
      v-model="isCreateSetModalOpen"
      title="Tạo bộ từ vựng mới"
      max-width="md"
    >
      <form class="space-y-4" @submit.prevent="handleCreateSet">
        <div class="space-y-1">
          <label class="block text-xs font-bold uppercase text-ink-soft">Tên bộ từ:</label>
          <input
            v-model="newSetTitle"
            type="text"
            required
            placeholder="Ví dụ: Từ vựng Podcast BBC Tập 1..."
            class="w-full px-3 py-2 text-sm font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
          >
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-bold uppercase text-ink-soft">Mô tả ngắn:</label>
          <input
            v-model="newSetDesc"
            type="text"
            placeholder="Bộ từ thu thập khi nghe podcast tuần này"
            class="w-full px-3 py-2 text-xs font-medium rounded-brut border-2 border-line bg-surface text-ink outline-none"
          >
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-bold uppercase text-ink-soft">Cấp độ mục tiêu:</label>
          <select
            v-model="newSetLevel"
            class="w-full px-3 py-2 text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
          >
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="HSK 3">HSK 3</option>
            <option value="N3">JLPT N3</option>
          </select>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t-2 border-line">
          <BaseButton type="button" variant="secondary" size="sm" @click="isCreateSetModalOpen = false">
            Huỷ
          </BaseButton>
          <BaseButton type="submit" variant="primary" size="sm">
            Tạo bộ từ
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- MODAL 2: THÊM TỪ THỦ CÔNG VÀO BỘ -->
    <BaseModal
      v-model="isAddWordModalOpen"
      :title="`Thêm từ thủ công vào &quot;${activeSet?.title || ''}&quot;`"
      max-width="lg"
    >
      <form class="space-y-3" @submit.prevent="handleAddWord">
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase text-ink-soft">Từ vựng (*):</label>
            <input
              v-model="newWordTerm"
              type="text"
              required
              placeholder="Ví dụ: Paradigm"
              class="w-full px-3 py-2 text-sm font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
            >
          </div>
          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase text-ink-soft">Phiên âm:</label>
            <input
              v-model="newWordPhonetic"
              type="text"
              placeholder="/ˈpærədaɪm/"
              class="w-full px-3 py-2 text-xs font-mono font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
            >
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase text-ink-soft">Từ loại:</label>
            <select
              v-model="newWordPartOfSpeech"
              class="w-full px-3 py-2 text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
            >
              <option value="noun">Danh từ (Noun)</option>
              <option value="verb">Động từ (Verb)</option>
              <option value="adj">Tính từ (Adjective)</option>
              <option value="adv">Trạng từ (Adverb)</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase text-ink-soft">Nghĩa tiếng Việt (*):</label>
            <input
              v-model="newWordMeaning"
              type="text"
              required
              placeholder="Mô hình, kiểu mẫu tư duy"
              class="w-full px-3 py-2 text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
            >
          </div>
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-bold uppercase text-ink-soft">Ví dụ câu bản xứ:</label>
          <input
            v-model="newWordExample"
            type="text"
            placeholder="This research represents a new paradigm in physics."
            class="w-full px-3 py-2 text-xs font-medium rounded-brut border-2 border-line bg-surface text-ink outline-none"
          >
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-bold uppercase text-ink-soft">Dịch nghĩa câu ví dụ:</label>
          <input
            v-model="newWordExampleMeaning"
            type="text"
            placeholder="Nghiên cứu này đại diện cho một mô hình mới trong vật lý học."
            class="w-full px-3 py-2 text-xs font-medium rounded-brut border-2 border-line bg-surface text-ink outline-none"
          >
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t-2 border-line">
          <BaseButton type="button" variant="secondary" size="sm" @click="isAddWordModalOpen = false">
            Huỷ
          </BaseButton>
          <BaseButton type="submit" variant="primary" size="sm">
            Lưu từ vựng
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
