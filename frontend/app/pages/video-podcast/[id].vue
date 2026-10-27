<script setup lang="ts">
import {
  Video,
  Headphones,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Volume2,
  Subtitles,
  Mic,
  Square,
  BookmarkPlus,
  HelpCircle,
  FileCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  BookOpen,
  X,
  Zap,
} from '@lucide/vue'
import { useLanguage } from '~/composables/useLanguage'
import { useMedia, type MediaContent, type SubtitleItem } from '~/composables/useMedia'
import PageBanner from '~/components/common/PageBanner.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { BRAND_NAME } from '~/constants/brand'

const route = useRoute()
const mediaId = computed(() => (route.params.id as string) || 'media-en-ted-memory')

const { currentLang, currentLanguageOption } = useLanguage()
const { getMediaById, saveVocabToMySet, saveMediaProgress } = useMedia(currentLang)

const currentMedia = computed<MediaContent>(() => {
  return getMediaById(mediaId.value) || getMediaById('media-en-ted-memory')!
})

useHead({
  title: computed(() => `Xem & Luyện: ${currentMedia.value?.title || 'Video'} - ${BRAND_NAME}`),
})

const guideSteps: GuideStep[] = [
  {
    title: 'Trình phát Video & Đồng bộ phụ đề',
    description: 'Video phát cùng phụ đề song ngữ. Nhấp vào bất kỳ dòng nào để tua nhanh tới thời điểm đó.',
    targetId: 'video-player-container',
    badge: 'Bước 1',
  },
  {
    title: '4 Chế độ luyện tập chuyên sâu',
    description: 'Chuyển đổi giữa Xem bình thường, Chép chính tả (Dictation), Nói nhại (Shadowing) và Trắc nghiệm nghe hiểu.',
    targetId: 'practice-modes-tabs',
    badge: 'Bước 2',
  },
  {
    title: 'Tra từ nhanh & Lưu vào bộ từ',
    description: 'Bấm vào bất kỳ từ vựng nào trong phụ đề để tra nghĩa nhanh và bấm "Lưu vào bộ từ" để ôn tập sau với Flashcard.',
    targetId: 'interactive-transcript-pane',
    badge: 'Bước 3',
  },
  {
    title: 'Tuỳ chỉnh hiển thị song ngữ',
    description: 'Linh hoạt bật/tắt hiển thị câu gốc hoặc bản dịch tiếng Việt để thử thách khả năng nghe hiểu độc lập.',
    targetId: 'subtitle-toggle-controls',
    badge: 'Bước 4',
  },
]

// ==========================================
// 4 CHẾ ĐỘ LUYỆN
// ==========================================
const currentPracticeMode = ref<'watch' | 'dictation' | 'shadowing' | 'quiz'>('watch')

// Điều khiển phát video/audio
const isPlaying = ref(false)
const currentTime = ref(0)
const playbackSpeed = ref(1)
let playbackTimer: any = null

const startTimer = () => {
  stopTimer()
  playbackTimer = setInterval(() => {
    if (currentTime.value < currentMedia.value.durationSec) {
      currentTime.value += 1
    } else {
      isPlaying.value = false
      stopTimer()
    }
  }, 1000 / playbackSpeed.value)
}

const stopTimer = () => {
  if (playbackTimer) {
    clearInterval(playbackTimer)
    playbackTimer = null
  }
}

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) startTimer()
  else stopTimer()
}

const seekToTime = (sec: number) => {
  currentTime.value = sec
}

const setSpeed = (spd: number) => {
  playbackSpeed.value = spd
  if (isPlaying.value) startTimer()
}

onUnmounted(() => {
  stopTimer()
})

// Cài đặt hiển thị phụ đề song ngữ
const showTargetText = ref(true)
const showViText = ref(true)

// Dòng phụ đề active hiện tại
const activeSubtitleIndex = computed(() => {
  const subs = currentMedia.value?.subtitles || []
  let active = 0
  for (let i = 0; i < subs.length; i++) {
    if (currentTime.value >= subs[i].start) {
      active = i
    }
  }
  return active
})

// ==========================================
// TRA TỪ NHANH & LƯU VÀO BỘ TỪ
// ==========================================
const selectedLookupWord = ref<{ word: string; meaning: string } | null>(null)
const saveSuccessMessage = ref(false)

const openWordLookup = (word: string, meaning?: string) => {
  selectedLookupWord.value = {
    word: word.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ''),
    meaning: meaning || 'Từ vựng quan trọng trong bài nói.',
  }
  saveSuccessMessage.value = false
}

const handleSaveToVocabSet = () => {
  if (!selectedLookupWord.value) return
  saveVocabToMySet(selectedLookupWord.value.word, selectedLookupWord.value.meaning)
  saveSuccessMessage.value = true
  setTimeout(() => {
    saveSuccessMessage.value = false
  }, 2500)
}

// ==========================================
// CHẾ ĐỘ 1: CHÉP CHÍNH TẢ (DICTATION)
// ==========================================
const dictationIndex = ref(0)
const dictationInput = ref('')
const isDictationChecked = ref(false)

const currentDictationSub = computed(() => {
  const subs = currentMedia.value?.subtitles || []
  return subs[dictationIndex.value] || subs[0]
})

const playDictationSegment = () => {
  seekToTime(currentDictationSub.value.start)
  if (!isPlaying.value) togglePlay()
}

const checkDictation = () => {
  isDictationChecked.value = true
}

const nextDictation = () => {
  dictationInput.value = ''
  isDictationChecked.value = false
  if (dictationIndex.value < (currentMedia.value?.subtitles.length || 1) - 1) {
    dictationIndex.value += 1
  }
  playDictationSegment()
}

// ==========================================
// CHẾ ĐỘ 2: NÓI NHẠI (SHADOWING)
// ==========================================
const shadowingIndex = ref(0)
const isRecordingShadowing = ref(false)
const shadowingAudioUrl = ref<string | null>(null)
let shadowRecorder: MediaRecorder | null = null
let shadowChunks: Blob[] = []

const currentShadowingSub = computed(() => {
  const subs = currentMedia.value?.subtitles || []
  return subs[shadowingIndex.value] || subs[0]
})

const playShadowingSegment = () => {
  seekToTime(currentShadowingSub.value.start)
  if (!isPlaying.value) togglePlay()
}

const startShadowRecording = async () => {
  if (!import.meta.client || !navigator.mediaDevices) return
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    shadowChunks = []
    shadowRecorder = new MediaRecorder(stream)

    shadowRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) shadowChunks.push(e.data)
    }

    shadowRecorder.onstop = () => {
      const audioBlob = new Blob(shadowChunks, { type: 'audio/webm' })
      shadowAudioUrl.value = URL.createObjectURL(audioBlob)
      stream.getTracks().forEach(t => t.stop())
    }

    shadowRecorder.start()
    isRecordingShadowing.value = true
  } catch (err) {
    alert('Không thể truy cập microphone để luyện nói.')
  }
}

const stopShadowRecording = () => {
  if (shadowRecorder && isRecordingShadowing.value) {
    shadowRecorder.stop()
    isRecordingShadowing.value = false
  }
}

const playShadowRecording = () => {
  if (shadowAudioUrl.value) {
    new Audio(shadowAudioUrl.value).play()
  }
}

// ==========================================
// CHẾ ĐỘ 3: TRẮC NGHIỆM NGHE (QUIZ)
// ==========================================
const quizUserAnswers = ref<Record<string, number>>({})
const isQuizSubmitted = ref(false)

const selectQuizOption = (qId: string, optIdx: number) => {
  if (isQuizSubmitted.value) return
  quizUserAnswers.value[qId] = optIdx
}

const submitComprehensionQuiz = () => {
  isQuizSubmitted.value = true
}

const resetComprehensionQuiz = () => {
  quizUserAnswers.value = {}
  isQuizSubmitted.value = false
}

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6" data-feature="video-podcast">
    <FirstVisitGuide page-key="video_practice_guide" :steps="guideSteps" />

    <!-- Top Navigation Bar -->
    <div class="flex items-center justify-between">
      <NuxtLink
        to="/video-podcast"
        class="inline-flex items-center gap-1.5 text-xs font-black uppercase text-ink-soft hover:text-ink transition-colors"
      >
        <ArrowLeft class="w-4 h-4 stroke-[2.5]" />
        <span>Về kho Video & Podcast</span>
      </NuxtLink>

      <div class="flex items-center gap-2">
        <BaseBadge tone="warn" size="sm">{{ currentMedia.level }}</BaseBadge>
        <BaseBadge tone="accent" size="sm">{{ currentMedia.category }}</BaseBadge>
      </div>
    </div>

    <!-- Page Banner -->
    <PageBanner
      feature="video-podcast"
      :title="currentMedia.title"
      :description="currentMedia.viTitle"
      badge-text="Học đa phương tiện"
      badge-tone="warn"
    >
      <template #icon>
        <Video class="h-6 w-6 text-on-tone" :stroke-width="2.5" />
      </template>

      <template #actions>
        <div class="flex items-center gap-2 font-mono text-xs font-black">
          <span class="px-2.5 py-1 bg-surface rounded-brut border-2 border-line shadow-brut-sm">
            {{ formatTime(currentMedia.durationSec) }}
          </span>
          <span class="px-2.5 py-1 bg-warn text-on-tone rounded-brut border-2 border-line shadow-brut-sm">
            {{ currentMedia.subtitles.length }} câu song ngữ
          </span>
        </div>
      </template>
    </PageBanner>

    <!-- 4 TABS CHẾ ĐỘ LUYỆN TẬP BẰNG CÁC TAB MÀU NỔI BẬT -->
    <div id="practice-modes-tabs" class="flex flex-wrap items-center gap-2.5 border-b-2 border-line pb-3">
      <button
        type="button"
        class="px-4 py-2 rounded-brut border-2 font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5"
        :class="[
          currentPracticeMode === 'watch'
            ? 'bg-c-blue text-white border-line shadow-brut'
            : 'bg-surface hover:bg-surface-2 text-ink border-line shadow-brut-sm',
        ]"
        @click="currentPracticeMode = 'watch'"
      >
        <Play class="w-4 h-4 fill-current" />
        <span>Xem bình thường</span>
      </button>

      <button
        type="button"
        class="px-4 py-2 rounded-brut border-2 font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5"
        :class="[
          currentPracticeMode === 'dictation'
            ? 'bg-c-green text-on-tone border-line shadow-brut'
            : 'bg-surface hover:bg-surface-2 text-ink border-line shadow-brut-sm',
        ]"
        @click="currentPracticeMode = 'dictation'; playDictationSegment()"
      >
        <Zap class="w-4 h-4 stroke-[2.5]" />
        <span>Chép chính tả</span>
      </button>

      <button
        type="button"
        class="px-4 py-2 rounded-brut border-2 font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5"
        :class="[
          currentPracticeMode === 'shadowing'
            ? 'bg-c-pink text-white border-line shadow-brut'
            : 'bg-surface hover:bg-surface-2 text-ink border-line shadow-brut-sm',
        ]"
        @click="currentPracticeMode = 'shadowing'; playShadowingSegment()"
      >
        <Mic class="w-4 h-4 stroke-[2.5]" />
        <span>Nói nhại (Shadowing)</span>
      </button>

      <button
        v-if="currentMedia.quiz && currentMedia.quiz.length > 0"
        type="button"
        class="px-4 py-2 rounded-brut border-2 font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5"
        :class="[
          currentPracticeMode === 'quiz'
            ? 'bg-c-yellow text-on-tone border-line shadow-brut'
            : 'bg-surface hover:bg-surface-2 text-ink border-line shadow-brut-sm',
        ]"
        @click="currentPracticeMode = 'quiz'"
      >
        <HelpCircle class="w-4 h-4 stroke-[2.5]" />
        <span>Trắc nghiệm nghe</span>
      </button>
    </div>

    <!-- MAIN PLAYER & WORKSPACE -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Cột Trình phát Video (2 cols) -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Khung nhúng YouTube Player hoặc Media Box -->
        <BaseCard id="video-player-container" tone="surface">
          <!-- YouTube Iframe Embed hoặc Audio Frame -->
          <div class="aspect-video w-full rounded-brut border-2 border-line bg-black relative overflow-hidden shadow-brut-sm">
            <iframe
              v-if="currentMedia.youtubeId"
              :src="`https://www.youtube.com/embed/${currentMedia.youtubeId}?enablejsapi=1&origin=*`"
              title="YouTube video player"
              class="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            />
            <div v-else class="w-full h-full flex flex-col items-center justify-center bg-surface-2 p-6 text-center">
              <Headphones class="w-12 h-12 text-accent mb-2" />
              <p class="font-black text-lg text-ink">{{ currentMedia.title }}</p>
              <p class="text-xs text-ink-soft">{{ currentMedia.speaker }}</p>
            </div>
          </div>

          <!-- Controls Bar -->
          <div class="mt-4 space-y-3">
            <div class="space-y-1">
              <div class="flex justify-between text-xs font-mono font-bold text-ink-soft">
                <span>{{ formatTime(currentTime) }}</span>
                <span>{{ formatTime(currentMedia.durationSec) }}</span>
              </div>
              <input
                type="range"
                min="0"
                :max="currentMedia.durationSec"
                :value="currentTime"
                class="w-full accent-accent cursor-pointer"
                @input="seekToTime(Number(($event.target as HTMLInputElement).value))"
              >
            </div>

            <!-- Các nút bấm điều khiển -->
            <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="p-2 rounded-brut border-2 border-line bg-surface hover:bg-surface-2 text-ink shadow-brut-sm cursor-pointer"
                  title="Lùi 5s"
                  @click="seekToTime(Math.max(0, currentTime - 5))"
                >
                  <Rewind class="w-4 h-4" />
                </button>

                <button
                  type="button"
                  class="px-4 py-1.5 rounded-brut border-2 border-line bg-surface hover:bg-surface-2 text-ink font-black text-xs shadow-brut-sm cursor-pointer flex items-center gap-1.5"
                  @click="togglePlay"
                >
                  <component :is="isPlaying ? Pause : Play" class="w-4 h-4 fill-current" />
                  <span>{{ isPlaying ? 'Tạm dừng' : 'Phát tiếp' }}</span>
                </button>

                <button
                  type="button"
                  class="p-2 rounded-brut border-2 border-line bg-surface hover:bg-surface-2 text-ink shadow-brut-sm cursor-pointer"
                  title="Tiến 5s"
                  @click="seekToTime(Math.min(currentMedia.durationSec, currentTime + 5))"
                >
                  <FastForward class="w-4 h-4" />
                </button>
              </div>

              <!-- Tốc độ phát -->
              <div class="flex items-center gap-1">
                <span class="text-xs font-bold text-ink-soft mr-1">Tốc độ:</span>
                <button
                  v-for="spd in [0.75, 1, 1.25]"
                  :key="spd"
                  type="button"
                  class="px-2 py-0.5 text-xs font-mono font-bold rounded-brut border transition-colors cursor-pointer"
                  :class="playbackSpeed === spd ? 'bg-warn text-on-tone border-line font-black' : 'bg-surface border-line/40 text-ink hover:bg-surface-2'"
                  @click="setSpeed(spd)"
                >
                  {{ spd }}x
                </button>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- NỘI DUNG THEO TỪNG CHẾ ĐỘ LUYỆN -->
        <!-- CHẾ ĐỘ 1: CHÉP CHÍNH TẢ -->
        <BaseCard v-if="currentPracticeMode === 'dictation'" tone="surface" class="border-accent">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-black text-sm">
                <Zap class="w-4 h-4 text-warn" />
                <span>Chép chính tả: Câu {{ dictationIndex + 1 }} / {{ currentMedia.subtitles.length }}</span>
              </div>
              <BaseBadge tone="warn" size="sm">
                Mốc: {{ formatTime(currentDictationSub.start) }} - {{ formatTime(currentDictationSub.end) }}
              </BaseBadge>
            </div>
          </template>

          <div class="space-y-4 py-2">
            <div class="flex items-center justify-between">
              <p class="text-xs font-bold uppercase text-ink-soft">
                Nghe và gõ lại chính xác câu vừa phát:
              </p>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="px-3 py-1 rounded-brut border border-line bg-surface hover:bg-surface-2 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  @click="playDictationSegment"
                >
                  <RotateCcw class="w-3.5 h-3.5" />
                  <span>Nghe lại câu này</span>
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1 rounded-brut border border-line bg-surface text-xs font-bold cursor-pointer"
                  @click="setSpeed(0.75); playDictationSegment()"
                >
                  Tốc độ 0.75x
                </button>
              </div>
            </div>

            <!-- Ô gõ chính tả -->
            <textarea
              v-model="dictationInput"
              rows="2"
              placeholder="Gõ lại câu tiếng bản xứ bạn nghe được..."
              class="w-full p-3 font-mono text-sm sm:text-base font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none focus:border-focus"
            />

            <!-- Đối chiếu kết quả khi bấm kiểm tra -->
            <div v-if="isDictationChecked" class="p-3 bg-surface-2 rounded-brut border border-line space-y-2">
              <p class="text-xs font-black uppercase text-accent">Câu mẫu chuẩn:</p>
              <p class="text-sm sm:text-base font-bold text-ink font-mono">
                {{ currentDictationSub.text }}
              </p>
              <p class="text-xs text-ink-soft italic">
                Dịch: {{ currentDictationSub.vi }}
              </p>
            </div>

            <div class="flex justify-between items-center pt-2">
              <BaseButton variant="secondary" size="sm" @click="checkDictation">
                Kiểm tra đáp án
              </BaseButton>
              <BaseButton variant="primary" size="sm" @click="nextDictation">
                <span>Câu kế tiếp</span>
                <ArrowRight class="w-4 h-4 ml-1" />
              </BaseButton>
            </div>
          </div>
        </BaseCard>

        <!-- CHẾ ĐỘ 2: NÓI NHẠI (SHADOWING) -->
        <BaseCard v-else-if="currentPracticeMode === 'shadowing'" tone="surface" class="border-warn">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-black text-sm">
                <Mic class="w-4 h-4 text-accent" />
                <span>Nói nhại (Shadowing): Câu {{ shadowingIndex + 1 }} / {{ currentMedia.subtitles.length }}</span>
              </div>
              <span class="text-xs font-mono font-bold text-ink-soft">
                {{ formatTime(currentShadowingSub.start) }} - {{ formatTime(currentShadowingSub.end) }}
              </span>
            </div>
          </template>

          <div class="space-y-4 py-2">
            <!-- Câu mẫu cần nhại -->
            <div class="p-4 bg-surface-2 rounded-brut border-2 border-line space-y-1">
              <p class="text-lg sm:text-xl font-black text-ink font-display">
                "{{ currentShadowingSub.text }}"
              </p>
              <p class="text-xs sm:text-sm text-ink-soft font-medium">
                {{ currentShadowingSub.vi }}
              </p>
            </div>

            <!-- Các nút thao tác thu âm & so sánh -->
            <div class="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface rounded-brut border-2 border-line">
              <button
                type="button"
                class="px-3.5 py-1.5 rounded-brut border-2 border-line bg-surface hover:bg-surface-2 text-ink font-black text-xs shadow-brut-sm cursor-pointer flex items-center gap-1.5"
                @click="playShadowingSegment"
              >
                <Volume2 class="w-4 h-4 text-accent stroke-[2.5]" />
                <span>Nghe câu mẫu bản xứ</span>
              </button>

              <div class="flex items-center gap-2">
                <button
                  v-if="!isRecordingShadowing"
                  type="button"
                  class="px-3.5 py-1.5 rounded-brut border-2 border-line bg-warn hover:bg-warn/90 text-on-tone font-black text-xs shadow-brut-sm cursor-pointer flex items-center gap-1.5"
                  @click="startShadowRecording"
                >
                  <Mic class="w-4 h-4 stroke-[2.5]" />
                  <span>Ghi âm giọng bạn</span>
                </button>

                <button
                  v-else
                  type="button"
                  class="px-3.5 py-1.5 rounded-brut border-2 border-line bg-bad text-white font-black text-xs shadow-brut-sm cursor-pointer flex items-center gap-1.5 animate-pulse"
                  @click="stopShadowRecording"
                >
                  <Square class="w-4 h-4 fill-current" />
                  <span>Dừng thu âm</span>
                </button>

                <button
                  v-if="shadowAudioUrl"
                  type="button"
                  class="px-3.5 py-1.5 rounded-brut border-2 border-line bg-ok text-on-tone font-black text-xs shadow-brut-sm cursor-pointer flex items-center gap-1.5"
                  @click="playShadowRecording"
                >
                  <Play class="w-4 h-4 fill-current" />
                  <span>Nghe lại bản thu</span>
                </button>
              </div>
            </div>

            <div class="flex justify-end pt-1">
              <BaseButton
                variant="primary"
                size="sm"
                @click="shadowingIndex = (shadowingIndex + 1) % currentMedia.subtitles.length; shadowAudioUrl = null; playShadowingSegment()"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight class="w-4 h-4 ml-1" />
              </BaseButton>
            </div>
          </div>
        </BaseCard>

        <!-- CHẾ ĐỘ 3: TRẮC NGHIỆM NGHE (QUIZ) -->
        <BaseCard v-else-if="currentPracticeMode === 'quiz'" tone="surface">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-black text-sm">
                <HelpCircle class="w-4 h-4 text-accent" />
                <span>Trắc nghiệm kiểm tra độ hiểu bài</span>
              </div>
              <BaseBadge tone="warn" size="sm">
                {{ currentMedia.quiz?.length }} câu hỏi
              </BaseBadge>
            </div>
          </template>

          <div class="space-y-6 py-2">
            <div
              v-for="(q, qIdx) in currentMedia.quiz"
              :key="q.id"
              class="p-4 rounded-brut border-2 border-line bg-surface-2 space-y-3"
            >
              <div class="flex items-center justify-between text-xs font-mono font-bold text-ink-soft">
                <span>Câu hỏi #{{ qIdx + 1 }}</span>
                <button
                  type="button"
                  class="text-accent underline cursor-pointer"
                  @click="seekToTime(q.segmentTime)"
                >
                  Nghe lại đoạn này ({{ formatTime(q.segmentTime) }})
                </button>
              </div>

              <p class="font-black text-sm sm:text-base text-ink">
                {{ q.question }}
              </p>

              <div class="space-y-2">
                <button
                  v-for="(opt, optIdx) in q.options"
                  :key="optIdx"
                  type="button"
                  class="w-full text-left p-3 rounded-brut border-2 text-xs sm:text-sm font-bold transition-all flex items-center justify-between cursor-pointer"
                  :class="[
                    quizUserAnswers[q.id] === optIdx
                      ? 'border-line bg-warn text-on-tone font-black shadow-brut-sm'
                      : 'border-line/40 bg-surface hover:bg-surface-2 text-ink',
                    isQuizSubmitted && optIdx === q.correctIndex
                      ? '!bg-ok !border-line !text-on-tone font-black'
                      : '',
                    isQuizSubmitted && quizUserAnswers[q.id] === optIdx && optIdx !== q.correctIndex
                      ? '!bg-bad !border-line !text-white'
                      : '',
                  ]"
                  @click="selectQuizOption(q.id, optIdx)"
                >
                  <span>{{ opt }}</span>
                  <CheckCircle2
                    v-if="isQuizSubmitted && optIdx === q.correctIndex"
                    class="w-4 h-4 text-on-tone stroke-[3]"
                  />
                </button>
              </div>

              <div v-if="isQuizSubmitted" class="p-2.5 bg-surface rounded-brut border border-line text-xs">
                <span class="font-black text-accent">Giải thích: </span>
                <span class="text-ink-soft font-medium">{{ q.explanation }}</span>
              </div>
            </div>

            <div class="flex justify-between items-center pt-2">
              <BaseButton v-if="isQuizSubmitted" variant="secondary" size="sm" @click="resetComprehensionQuiz">
                Làm lại trắc nghiệm
              </BaseButton>
              <BaseButton v-else variant="primary" size="sm" @click="submitComprehensionQuiz">
                Nộp bài trắc nghiệm
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Cột Phụ đề song ngữ tương tác & Tra từ (1 col) -->
      <div id="interactive-transcript-pane" class="space-y-4">
        <!-- Bật / Tắt song ngữ -->
        <BaseCard tone="surface">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-black text-sm">
                <Subtitles class="w-4 h-4 text-accent" />
                <span>Phụ đề song ngữ</span>
              </div>

              <!-- Controls bật tắt từng ngôn ngữ -->
              <div id="subtitle-toggle-controls" class="flex items-center gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  class="px-2 py-0.5 rounded-brut border cursor-pointer"
                  :class="showTargetText ? 'bg-warn text-on-tone border-line' : 'bg-surface-2 text-ink-soft border-line/40'"
                  title="Bật/Tắt ngôn ngữ gốc"
                  @click="showTargetText = !showTargetText"
                >
                  Gốc
                </button>
                <button
                  type="button"
                  class="px-2 py-0.5 rounded-brut border cursor-pointer"
                  :class="showViText ? 'bg-warn text-on-tone border-line' : 'bg-surface-2 text-ink-soft border-line/40'"
                  title="Bật/Tắt tiếng Việt"
                  @click="showViText = !showViText"
                >
                  Dịch
                </button>
              </div>
            </div>
          </template>

          <p class="text-[11px] text-ink-soft font-medium mb-3">
            Nhấp vào dòng để tua đến mốc nói. <strong>Bấm vào từ</strong> có gạch chân để tra nghĩa và lưu vào Flashcard.
          </p>

          <!-- Danh sách câu phụ đề cuộn đồng bộ -->
          <div class="space-y-2.5 max-h-[28rem] overflow-y-auto pr-1">
            <div
              v-for="(sub, sIdx) in currentMedia.subtitles"
              :key="sub.id"
              class="p-3 rounded-brut border-2 transition-all cursor-pointer space-y-1.5"
              :class="[
                sIdx === activeSubtitleIndex
                  ? 'border-line bg-warn/25 shadow-brut-sm font-black'
                  : 'border-line/40 bg-surface hover:bg-surface-2 text-ink',
              ]"
              @click="seekToTime(sub.start)"
            >
              <div class="flex items-center justify-between text-[10px] font-mono font-bold text-ink-soft">
                <span>{{ formatTime(sub.start) }}</span>
                <span v-if="sIdx === activeSubtitleIndex" class="text-accent font-black animate-pulse">
                  Đang phát
                </span>
              </div>

              <!-- Tiếng bản xứ (Hỗ trợ nhấp từng từ) -->
              <p v-if="showTargetText" class="text-xs sm:text-sm font-bold text-ink leading-relaxed">
                <span
                  v-for="(w, wIdx) in sub.text.split(' ')"
                  :key="wIdx"
                  class="inline-block hover:bg-accent/20 hover:text-accent rounded-xs px-0.5 cursor-pointer"
                  @click.stop="openWordLookup(w, sub.vocabHints?.find(v => v.word.toLowerCase() === w.toLowerCase())?.meaning)"
                >
                  {{ w }}&nbsp;
                </span>
              </p>

              <!-- Bản dịch tiếng Việt -->
              <p v-if="showViText" class="text-[11px] text-ink-soft font-medium leading-normal">
                {{ sub.vi }}
              </p>
            </div>
          </div>
        </BaseCard>

        <!-- Tooltip / Box Tra từ nhanh & Nút Lưu vào Bộ từ -->
        <BaseCard v-if="selectedLookupWord" tone="surface-2" class="border-accent animate-in fade-in zoom-in-95 duration-150">
          <div class="space-y-2">
            <div class="flex items-center justify-between border-b border-line pb-1.5">
              <span class="text-xs font-black uppercase text-accent">Tra từ nhanh trong câu</span>
              <button type="button" class="text-ink-soft hover:text-ink cursor-pointer" @click="selectedLookupWord = null">
                <X class="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <p class="text-base font-black text-ink font-display">
                {{ selectedLookupWord.word }}
              </p>
              <p class="text-xs text-ink font-medium mt-0.5">
                {{ selectedLookupWord.meaning }}
              </p>
            </div>

            <!-- Nút Lưu vào Bộ từ -->
            <div class="pt-2 flex items-center justify-between">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-brut border-2 border-line bg-warn hover:bg-warn/90 text-on-tone font-black text-xs shadow-brut-sm cursor-pointer"
                @click="handleSaveToVocabSet"
              >
                <BookmarkPlus class="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Lưu vào bộ từ</span>
              </button>

              <span v-if="saveSuccessMessage" class="text-[11px] font-bold text-ok flex items-center gap-1">
                <CheckCircle2 class="w-3.5 h-3.5" />
                Đã lưu thành công!
              </span>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
