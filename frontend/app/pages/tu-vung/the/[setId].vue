<script setup lang="ts">
import { ArrowLeft, ArrowRight, Volume2, Mic, Square, Play, RotateCw, Trophy } from '@lucide/vue'
import { useLanguage } from '~/composables/useLanguage'
import { useVocab, type VocabWord, type VocabSet } from '~/composables/useVocab'
import type { LessonPhase } from '~/layouts/lesson.vue'
import { useLessonProgress, resumeIndexFromQuery } from '~/composables/useLessonProgress'
import { BRAND_NAME } from '~/constants/brand'

// Phiên Flashcard / Ôn tập SRS một thẻ mỗi màn, dùng layout lesson
definePageMeta({ layout: false })

const route = useRoute()
const setId = computed(() => String(route.params.setId || ''))
const isSrs = computed(() => route.query.mode === 'srs')

const { currentLang } = useLanguage()
const { curatedSets, mySets, isLoading, rateWordSrs, removeWordFromMySet, uploadPronunciation } = useVocab(currentLang)

const set = computed<VocabSet | undefined>(() => [...curatedSets.value, ...mySets.value].find((s) => s.id === setId.value))
const words = computed<VocabWord[]>(() => set.value?.words ?? [])

useHead({
  title: computed(() => `${isSrs.value ? 'Ôn tập SRS' : 'Flashcard'}: ${set.value?.title || 'Bộ từ'} - ${BRAND_NAME}`),
})

const currentIndex = ref(0)
const isFlipped = ref(false)
const isFinished = ref(false)
const rated = ref<'again' | 'hard' | 'good' | 'easy' | null>(null)
const currentWord = computed(() => words.value[currentIndex.value])

// Chế độ Flashcard có chấm: chọn nghĩa đúng trong 4 lựa chọn -> Kiểm tra -> thẻ lật + banner ở khối đáy
const phase = ref<LessonPhase>('answer')
const options = ref<string[]>([])
const selectedOption = ref<number | null>(null)
// Kết quả theo từng từ, để quay lại thẻ trước và chọn lại không bị đếm hai lần
const answers = ref<Record<string, boolean>>({})
const correctCount = computed(() => Object.values(answers.value).filter(Boolean).length)

const shuffle = <T,>(list: T[]) => {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

// Trộn đáp án một lần cho mỗi thẻ (không trộn lại mỗi lần render)
const buildOptions = () => {
  const word = currentWord.value
  if (!word) {
    options.value = []
    return
  }
  const distractors = shuffle(
    [...new Set(words.value.filter((w) => w.id !== word.id).map((w) => w.meaning))].filter((m) => m !== word.meaning),
  ).slice(0, 3)
  options.value = shuffle([word.meaning, ...distractors])
}
watch([currentWord, () => words.value.length], buildOptions, { immediate: true })

const checkAnswer = () => {
  if (selectedOption.value === null || !currentWord.value) return
  const isRight = options.value[selectedOption.value] === currentWord.value.meaning
  answers.value = { ...answers.value, [currentWord.value.id]: isRight }
  phase.value = isRight ? 'correct' : 'wrong'
  isFlipped.value = true
}

const checkFeedback = computed(() => {
  if (!currentWord.value) return ''
  return phase.value === 'correct'
    ? `${currentWord.value.term} nghĩa là "${currentWord.value.meaning}".`
    : `${currentWord.value.term} ${currentWord.value.phonetic}. Xem ví dụ trên thẻ rồi tiếp tục.`
})

// Lỗi mạng / lưu tiến độ (lưu mức nhớ SRS) hiển thị bằng BaseToast
const saveError = ref<string | null>(null)

const lessonProgress = computed(() => {
  if (!words.value.length) return 0
  if (isFinished.value) return 1
  const doneCurrent = isSrs.value ? (rated.value ? 1 : 0) : (phase.value !== 'answer' ? 1 : 0)
  return (currentIndex.value + doneCurrent) / words.value.length
})

// Chỉ chế độ Flashcard có chấm đúng/sai; SRS và màn tổng kết dùng slot #action
const layoutPhase = computed<LessonPhase | null>(() => {
  if (isSrs.value || isFinished.value || !set.value || !words.value.length) return null
  return phase.value
})

// Trong lúc chọn nghĩa, không cho lật thẻ để xem trước đáp án
const canFlip = computed(() => isSrs.value || phase.value !== 'answer')
const toggleFlip = () => {
  if (canFlip.value) isFlipped.value = !isFlipped.value
}

const SRS_OPTIONS = [
  { grade: 'again', label: 'Quên', hint: '< 1 phút', cls: 'bg-c-coral text-ink' },
  { grade: 'hard', label: 'Khó', hint: '10 phút', cls: 'bg-c-orange text-ink' },
  { grade: 'good', label: 'Tốt', hint: '1 ngày', cls: 'bg-c-green text-on-tone' },
  { grade: 'easy', label: 'Dễ', hint: '4 ngày', cls: 'bg-c-blue text-white' },
] as const

const rate = (grade: 'again' | 'hard' | 'good' | 'easy') => {
  if (!currentWord.value) return
  rated.value = grade
  currentWord.value.srsState = grade
  rateWordSrs(currentWord.value.id, grade)
    .then((res) => {
      if (res && !res.success && res.error) saveError.value = `Chưa lưu được mức nhớ: ${res.error}`
    })
    .catch(() => {
      saveError.value = 'Chưa lưu được mức nhớ do lỗi kết nối. Kiểm tra mạng rồi thử lại.'
    })
}

const resetCard = () => {
  isFlipped.value = false
  rated.value = null
  phase.value = 'answer'
  selectedOption.value = null
  userAudioUrl.value = null
}

const goNext = () => {
  if (currentIndex.value < words.value.length - 1) {
    currentIndex.value += 1
    resetCard()
  } else {
    isFinished.value = true
  }
}

const goPrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1
    resetCard()
  }
}

const restart = () => {
  currentIndex.value = 0
  answers.value = {}
  isFinished.value = false
  buildOptions()
  resetCard()
}

// Một nút hành động: lật thẻ -> (SRS: chọn mức nhớ) -> thẻ tiếp theo
const primaryAction = computed(() => {
  if (!isFlipped.value) return { label: isSrs.value ? 'Xem nghĩa' : 'Lật thẻ', disabled: false }
  if (isSrs.value && !rated.value) return { label: 'Chọn mức độ nhớ', disabled: true }
  return { label: currentIndex.value === words.value.length - 1 ? 'Hoàn thành' : 'Thẻ tiếp theo', disabled: false }
})
const onPrimary = () => {
  if (!isFlipped.value) isFlipped.value = true
  else goNext()
}

const speakWord = () => {
  if (!import.meta.client || !window.speechSynthesis || !currentWord.value) return
  const utterance = new SpeechSynthesisUtterance(currentWord.value.term)
  if (currentLang.value === 'en') utterance.lang = 'en-US'
  else if (currentLang.value === 'zh') utterance.lang = 'zh-CN'
  else if (currentLang.value === 'ja') utterance.lang = 'ja-JP'
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

// Thu âm giọng người học để tự so sánh với phát âm mẫu
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
      if (e.data.size > 0) audioChunks.push(e.data)
    }
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      userAudioUrl.value = URL.createObjectURL(audioBlob)
      stream.getTracks().forEach((track) => track.stop())
      if (currentWord.value) {
        uploadPronunciation(audioBlob, currentWord.value.term, currentWord.value.id).then((res) => {
          if (res?.success && res.audioUrl) userAudioUrl.value = res.audioUrl
        })
      }
    }
    mediaRecorder.start()
    isRecording.value = true
  } catch {
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
  if (userAudioUrl.value) new Audio(userAudioUrl.value).play()
}

const removeCurrentWord = () => {
  if (!set.value || !currentWord.value) return
  removeWordFromMySet(set.value.id, currentWord.value.id)
  if (currentIndex.value >= words.value.length) currentIndex.value = Math.max(0, words.value.length - 1)
  resetCard()
}

// ---- Bài học đang dở: lưu vị trí thẻ để trang chủ mở lại đúng chỗ ----
const progressStore = useLessonProgress()

// Mở từ nút "Tiếp tục" (?the=N, đếm từ 1): nhảy tới đúng thẻ khi bộ từ đã tải
const hasResumed = ref(false)
watch(words, (list) => {
  if (hasResumed.value || !list.length) return
  hasResumed.value = true
  const idx = resumeIndexFromQuery(route.query.the, list.length)
  if (idx > 0) {
    currentIndex.value = idx
    resetCard()
  }
}, { immediate: true })

const reportSave = (res: { success: boolean; error?: string }) => {
  if (!res.success) saveError.value = `Chưa lưu được vị trí bài học: ${res.error}`
}

// Mỗi lần sang thẻ khác thì ghi đè dòng tiến độ của Từ vựng (giữ chế độ SRS trong link)
watch(currentIndex, (idx) => {
  if (!set.value || isFinished.value || !words.value.length) return
  const query = isSrs.value ? `?mode=srs&the=${idx + 1}` : `?the=${idx + 1}`
  progressStore.save({
    feature: 'tu-vung',
    resourceId: set.value.id,
    resourceTitle: `${isSrs.value ? 'Ôn tập SRS' : 'Flashcard'}: ${set.value.title}`,
    currentIndex: idx,
    totalCount: words.value.length,
    link: `/tu-vung/the/${set.value.id}${query}`,
  }).then(reportSave)
})

// Xem hết bộ thì xoá dòng tiến độ
watch(isFinished, (done) => {
  if (done && set.value) progressStore.clear('tu-vung', set.value.id).then(reportSave)
})
</script>

<template>
  <NuxtLayout
    name="lesson"
    :progress="lessonProgress"
    :total-segments="words.length || 1"
    close-to="/tu-vung"
    close-label="Đóng, về danh sách bộ từ"
    :phase="layoutPhase"
    :can-check="selectedOption !== null"
    :feedback="checkFeedback"
    :correct-answer="currentWord?.meaning"
    :continue-label="currentIndex === words.length - 1 ? 'Xem kết quả' : 'Tiếp tục'"
    @check="checkAnswer"
    @continue="goNext"
  >
    <div class="space-y-5" data-feature="tu-vung">
      <BaseSkeleton v-if="isLoading && !set" height="22rem" rounded="lg" />

      <div v-else-if="!set" class="space-y-2 pt-8 text-center">
        <h1 class="font-display text-xl font-black text-ink">Không tìm thấy bộ từ này</h1>
        <p class="text-sm text-ink-soft">Bộ từ có thể đã bị xoá hoặc thuộc ngôn ngữ khác. Chọn lại từ danh sách bộ từ.</p>
      </div>

      <div v-else-if="!words.length" class="space-y-2 pt-8 text-center">
        <h1 class="font-display text-xl font-black text-ink">Bộ từ này chưa có từ nào</h1>
        <p class="text-sm text-ink-soft">Thêm từ vào bộ ở trang Từ vựng rồi quay lại học.</p>
      </div>

      <!-- Tổng kết phiên -->
      <section v-else-if="isFinished" class="space-y-4 pt-6 text-center" aria-labelledby="flash-finish-title">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-line bg-warn text-on-tone">
          <Trophy class="h-8 w-8" :stroke-width="2.5" aria-hidden="true" />
        </div>
        <h1 id="flash-finish-title" class="font-display text-2xl font-black text-ink">
          <template v-if="isSrs">Đã ôn xong {{ words.length }} từ</template>
          <template v-else>Đúng {{ correctCount }} / {{ words.length }} từ</template>
        </h1>
        <p class="text-sm text-ink-soft">Bộ "{{ set.title }}".</p>
        <button
          type="button"
          class="inline-flex min-h-[44px] items-center gap-1.5 px-3 text-sm font-bold text-ink underline cursor-pointer"
          @click="restart"
        >
          <RotateCw class="h-4 w-4" aria-hidden="true" /> Học lại bộ này
        </button>
      </section>

      <!-- Một thẻ -->
      <template v-else-if="currentWord">
        <div class="flex items-center justify-between text-xs font-bold text-ink-soft">
          <span class="truncate pr-2">{{ set.title }}</span>
          <span class="shrink-0 tabular-nums">Thẻ {{ currentIndex + 1 }} / {{ words.length }}</span>
        </div>

        <div
          class="flex min-h-[20rem] flex-col rounded-brut-lg border-2 border-line p-5 select-none"
          :class="[isFlipped ? 'bg-surface' : 'bg-c-pink', canFlip ? 'cursor-pointer' : 'cursor-default']"
          :role="canFlip ? 'button' : undefined"
          :tabindex="canFlip ? 0 : undefined"
          :aria-label="canFlip ? (isFlipped ? 'Mặt sau, bấm để xem lại mặt trước' : 'Mặt trước, bấm để lật thẻ') : undefined"
          @click="toggleFlip"
          @keydown.enter.prevent="toggleFlip"
          @keydown.space.prevent="toggleFlip"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-ink">{{ isFlipped ? 'Nghĩa' : 'Từ vựng' }}</span>
            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-brut border-2 border-line bg-surface text-ink hover:bg-surface-2 cursor-pointer"
              aria-label="Nghe phát âm"
              @click.stop="speakWord"
            >
              <Volume2 class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
            </button>
          </div>

          <div v-if="!isFlipped" class="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <h1 class="font-display text-4xl font-black tracking-tight text-ink sm:text-5xl">{{ currentWord.term }}</h1>
            <p class="font-mono text-lg italic text-ink">{{ currentWord.phonetic }}</p>
            <span class="rounded-brut border-2 border-line bg-surface px-2.5 py-0.5 text-xs font-bold text-ink">{{ currentWord.partOfSpeech }}</span>
          </div>

          <div v-else class="flex flex-1 flex-col justify-center gap-4 text-ink">
            <div>
              <p class="font-display text-2xl font-black sm:text-3xl">{{ currentWord.meaning }}</p>
              <p class="mt-1 text-sm text-ink-soft">{{ currentWord.term }} {{ currentWord.phonetic }}</p>
            </div>
            <div class="space-y-1 text-sm">
              <p class="rounded-brut border-2 border-line bg-surface-2 p-3 italic">"{{ currentWord.exampleTarget }}"</p>
              <p class="pl-1 text-xs text-ink-soft">{{ currentWord.exampleMeaning }}</p>
            </div>
          </div>

          <p v-if="canFlip" class="flex items-center gap-1 pt-2 text-[11px] font-bold text-ink-soft">
            <RotateCw class="h-3 w-3" aria-hidden="true" /> Bấm vào thẻ để lật
          </p>
        </div>

        <!-- Flashcard có chấm: chọn nghĩa đúng rồi bấm Kiểm tra ở khối đáy -->
        <div v-if="!isSrs" class="space-y-2" role="radiogroup" :aria-label="`Nghĩa của ${currentWord.term}`">
          <p class="text-xs font-bold text-ink-soft">Chọn nghĩa đúng của "{{ currentWord.term }}"</p>
          <button
            v-for="(opt, oIdx) in options"
            :key="opt"
            type="button"
            role="radio"
            :aria-checked="selectedOption === oIdx"
            :disabled="phase !== 'answer'"
            class="flex w-full min-h-[52px] items-center rounded-brut border-2 px-4 text-left text-sm font-bold cursor-pointer disabled:cursor-default"
            :class="[
              phase !== 'answer' && opt === currentWord.meaning
                ? 'border-line bg-ok text-on-tone'
                : phase === 'wrong' && selectedOption === oIdx
                  ? 'border-line bg-bad text-white'
                  : selectedOption === oIdx
                    ? 'border-line bg-warn text-on-tone'
                    : 'border-line/50 bg-surface text-ink hover:bg-surface-2',
            ]"
            @click="selectedOption = oIdx"
          >
            {{ opt }}
          </button>
        </div>

        <!-- Ôn tập SRS: chọn mức độ nhớ sau khi xem nghĩa -->
        <fieldset v-if="isSrs && isFlipped" class="space-y-2">
          <legend class="text-xs font-bold text-ink-soft">Bạn nhớ từ này ở mức nào?</legend>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="o in SRS_OPTIONS"
              :key="o.grade"
              type="button"
              class="min-h-[52px] rounded-brut border-2 p-1.5 text-center text-xs font-black cursor-pointer"
              :class="[o.cls, rated === o.grade ? 'border-line ring-2 ring-line ring-offset-2 ring-offset-bg' : 'border-line/60']"
              :aria-pressed="rated === o.grade"
              @click="rate(o.grade)"
            >
              <span class="block">{{ o.label }}</span>
              <span class="block text-[10px] font-medium opacity-90">{{ o.hint }}</span>
            </button>
          </div>
        </fieldset>

        <div class="flex items-center justify-between">
          <button
            type="button"
            class="inline-flex min-h-[44px] items-center gap-1 px-1 text-xs font-bold text-ink-soft hover:text-ink cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="currentIndex === 0"
            @click="goPrev"
          >
            <ArrowLeft class="h-3.5 w-3.5" aria-hidden="true" /> Thẻ trước
          </button>
          <button
            v-if="set.isCustom"
            type="button"
            class="inline-flex min-h-[44px] items-center px-1 text-xs font-bold text-bad hover:underline cursor-pointer"
            @click="removeCurrentWord"
          >
            Xoá từ này khỏi bộ
          </button>
        </div>

        <!-- Luyện phát âm: thu âm rồi nghe lại để so với mẫu -->
        <details id="pronunciation-recorder-box" class="rounded-brut border-2 border-line bg-surface-2 p-3">
          <summary class="flex min-h-[32px] cursor-pointer items-center gap-2 text-sm font-bold text-ink">
            <Mic class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" /> Luyện phát âm từ này
          </summary>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-if="!isRecording"
              type="button"
              class="inline-flex min-h-[44px] items-center gap-1.5 rounded-brut border-2 border-line bg-surface px-3 text-xs font-bold text-ink cursor-pointer"
              @click="startRecording"
            >
              <Mic class="h-4 w-4" aria-hidden="true" /> Thu âm giọng bạn
            </button>
            <button
              v-else
              type="button"
              class="inline-flex min-h-[44px] items-center gap-1.5 rounded-brut border-2 border-line bg-bad px-3 text-xs font-bold text-white cursor-pointer"
              @click="stopRecording"
            >
              <Square class="h-4 w-4 fill-current" aria-hidden="true" /> Dừng thu âm
            </button>
            <button
              v-if="userAudioUrl"
              type="button"
              class="inline-flex min-h-[44px] items-center gap-1.5 rounded-brut border-2 border-line bg-surface px-3 text-xs font-bold text-ink cursor-pointer"
              @click="playUserAudio"
            >
              <Play class="h-4 w-4 fill-current" aria-hidden="true" /> Nghe lại giọng bạn
            </button>
          </div>
          <p class="mt-2 text-xs text-ink-soft">Nghe luân phiên phát âm mẫu và giọng bạn để tự chỉnh khẩu hình và ngữ điệu.</p>
        </details>
      </template>
    </div>

    <!-- SRS và màn tổng kết dùng slot; Flashcard có chấm dùng phase của layout -->
    <template #action>
      <BaseButton v-if="!set || !words.length || isFinished" to="/tu-vung" variant="success" size="lg" block>
        <span>Về danh sách bộ từ</span>
      </BaseButton>
      <BaseButton v-else variant="success" size="lg" block :disabled="primaryAction.disabled" @click="onPrimary">
        <span>{{ primaryAction.label }}</span>
        <template v-if="!primaryAction.disabled" #right><ArrowRight class="h-5 w-5" :stroke-width="2.5" /></template>
      </BaseButton>
    </template>

    <template #toast>
      <BaseToast
        v-if="saveError"
        :model-value="!!saveError"
        tone="error"
        title="Chưa lưu tiến độ"
        :message="saveError"
        :duration="0"
        @close="saveError = null"
      />
    </template>
  </NuxtLayout>
</template>
