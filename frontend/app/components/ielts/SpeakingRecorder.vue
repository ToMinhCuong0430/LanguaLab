<script setup lang="ts">
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  Timer,
  AlertCircle,
  Volume2,
  CheckCircle,
} from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    prompts: string[]
    prepTimeSeconds?: number
    speakTimeSeconds?: number
  }>(),
  {
    prepTimeSeconds: 60,
    speakTimeSeconds: 120,
  },
)

// Transcript từng Part (dùng để chấm Speaking bằng AI)
const transcripts = defineModel<string[]>('transcripts', { default: () => [] })

const activePromptIndex = ref(0)
const isRecording = ref(false)
const recordedAudioUrls = ref<Record<number, string>>({})
const micError = ref<string | null>(null)

// Nhận dạng giọng nói trên trình duyệt (Chrome / Edge / Safari). Không hỗ trợ thì người học gõ lại câu trả lời.
type SpeechRecognitionLike = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: any) => void) | null
  onerror: ((e: any) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
const speechSupported = ref(false)
const interimText = ref('')
let recognition: SpeechRecognitionLike | null = null
let recognitionPart = 0
let keepListening = false

onMounted(() => {
  const w = window as any
  speechSupported.value = Boolean(w.SpeechRecognition || w.webkitSpeechRecognition)
})

const setTranscript = (idx: number, text: string) => {
  const next = [...transcripts.value]
  while (next.length <= idx) next.push('')
  next[idx] = text
  transcripts.value = next
}

const startRecognition = () => {
  const w = window as any
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  if (!Ctor) return
  recognitionPart = activePromptIndex.value
  keepListening = true
  recognition = new Ctor() as SpeechRecognitionLike
  recognition.lang = 'en-US'
  recognition.continuous = true
  recognition.interimResults = true
  recognition.onresult = (event: any) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i]
      if (res.isFinal) {
        const current = (transcripts.value[recognitionPart] || '').trim()
        setTranscript(recognitionPart, `${current} ${res[0].transcript.trim()}`.trim())
      } else {
        interim += res[0].transcript
      }
    }
    interimText.value = interim
  }
  recognition.onerror = (event: any) => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      keepListening = false
    }
  }
  // Chrome tự dừng sau một quãng im lặng: khởi động lại khi vẫn đang ghi âm
  recognition.onend = () => {
    interimText.value = ''
    if (keepListening && recognition) {
      try { recognition.start() } catch { /* đã chạy lại */ }
    }
  }
  try { recognition.start() } catch { /* bỏ qua nếu trình duyệt chặn */ }
}

const activeWordCount = computed(() => ((transcripts.value[activePromptIndex.value] || '').trim().match(/\S+/g) || []).length)

const stopRecognition = () => {
  keepListening = false
  interimText.value = ''
  recognition?.stop()
  recognition = null
}

// Bộ đếm giờ chuẩn bị & nói cho Part 2
const timerMode = ref<'idle' | 'prep' | 'speak'>('idle')
const timeLeft = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []

const startPrepTimer = () => {
  stopTimer()
  timerMode.value = 'prep'
  timeLeft.value = props.prepTimeSeconds
  timerInterval = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value -= 1
    } else {
      stopTimer()
      startRecording() // Tự động bắt đầu ghi âm khi hết giờ chuẩn bị
    }
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

// Bắt đầu ghi âm thật với MediaRecorder API
const startRecording = async () => {
  micError.value = null
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    micError.value = 'Trình duyệt không hỗ trợ truy cập microphone.'
    return
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      const audioUrl = URL.createObjectURL(audioBlob)
      recordedAudioUrls.value[activePromptIndex.value] = audioUrl
      // Ngắt kết nối micro
      stream.getTracks().forEach(track => track.stop())
    }

    mediaRecorder.start()
    startRecognition()
    isRecording.value = true
    timerMode.value = 'speak'
    timeLeft.value = props.speakTimeSeconds

    stopTimer()
    timerInterval = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value -= 1
      } else {
        stopRecording()
      }
    }, 1000)
  } catch (err: any) {
    micError.value = 'Không thể truy cập Microphone. Vui lòng cấp quyền trong cài đặt trình duyệt.'
    isRecording.value = false
  }
}

const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  stopRecognition()
  isRecording.value = false
  stopTimer()
  timerMode.value = 'idle'
}

const formattedTimeLeft = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
  const s = Math.floor(timeLeft.value % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
})

onUnmounted(() => {
  stopTimer()
  stopRecognition()
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
})
</script>

<template>
  <div class="rounded-brut-lg border-[3px] border-line bg-surface p-5 sm:p-6 shadow-brut space-y-6">
    <!-- Header chuyển đổi các phần Part 1 / Part 2 / Part 3 -->
    <div class="flex flex-wrap items-center justify-between border-b-2 border-line pb-4 gap-3">
      <div class="flex items-center gap-2">
        <button
          v-for="(_, pIdx) in prompts"
          :key="pIdx"
          type="button"
          class="px-3.5 py-1.5 rounded-brut border-2 border-line font-display text-xs font-black transition-all cursor-pointer"
          :class="[
            activePromptIndex === pIdx
              ? 'bg-mark text-on-tone shadow-brut-sm ring-2 ring-line'
              : 'bg-surface-2 text-ink hover:bg-surface',
          ]"
          @click="activePromptIndex = pIdx"
        >
          <span>Part {{ pIdx + 1 }}</span>
          <span v-if="recordedAudioUrls[pIdx]" class="ml-1 text-ok font-bold">✓</span>
        </button>
      </div>

      <!-- Đồng hồ đếm thời gian -->
      <div
        v-if="timerMode !== 'idle'"
        class="flex items-center gap-2 rounded-brut border-2 border-line px-3 py-1 font-display text-sm font-black shadow-brut-sm"
        :class="timerMode === 'prep' ? 'bg-warn text-on-tone' : 'bg-bad text-on-tone animate-pulse'"
      >
        <Timer class="h-4 w-4" :stroke-width="2.5" />
        <span>{{ timerMode === 'prep' ? 'Chuẩn bị:' : 'Thời gian nói:' }} {{ formattedTimeLeft }}</span>
      </div>
    </div>

    <!-- Khung hiển thị câu hỏi / Cue Card của phần đang chọn -->
    <div class="space-y-3">
      <span class="rounded border-2 border-line bg-surface-2 px-2 py-0.5 text-xs font-black text-ink">
        CÂU HỎI & HƯỚNG DẪN THỰC HIỆN
      </span>

      <div class="rounded-brut-lg border-2 border-line bg-surface-2 p-5 text-sm sm:text-base font-medium leading-relaxed font-body shadow-brut-sm whitespace-pre-line text-ink">
        {{ prompts[activePromptIndex] }}
      </div>
    </div>

    <!-- Thông báo lỗi microphone nếu có -->
    <div
      v-if="micError"
      class="flex items-start gap-2 rounded-brut border-2 border-bad bg-bad/10 p-3 text-xs text-bad font-bold"
    >
      <AlertCircle class="h-4 w-4 flex-shrink-0 mt-0.5" />
      <span>{{ micError }}</span>
    </div>

    <!-- Khu vực điều khiển thu âm & Nghe lại -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between border-t-2 border-line pt-5 gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Nút bấm bắt đầu chuẩn bị (chỉ hiện cho Part 2) -->
        <button
          v-if="activePromptIndex === 1 && timerMode === 'idle' && !isRecording"
          type="button"
          class="flex items-center gap-2 rounded-brut border-2 border-line bg-warn px-4 py-2 font-display text-xs font-black text-on-tone shadow-brut brut-press cursor-pointer"
          @click="startPrepTimer"
        >
          <Timer class="h-4 w-4" :stroke-width="2.5" />
          <span>Bắt đầu 1 phút chuẩn bị</span>
        </button>

        <!-- Nút Ghi âm / Dừng ghi âm -->
        <button
          type="button"
          class="flex items-center gap-2 rounded-brut border-2 border-line px-5 py-2.5 font-display text-sm font-black shadow-brut brut-press cursor-pointer"
          :class="isRecording ? 'bg-bad text-on-tone animate-pulse' : 'bg-mark text-on-tone'"
          @click="isRecording ? stopRecording() : startRecording()"
        >
          <Square v-if="isRecording" class="h-4 w-4 fill-current" :stroke-width="2.5" />
          <Mic v-else class="h-4 w-4" :stroke-width="2.5" />
          <span>{{ isRecording ? 'Dừng thu âm' : 'Bắt đầu ghi âm câu trả lời' }}</span>
        </button>
      </div>

      <!-- Trình phát nghe lại audio đã thu -->
      <div v-if="recordedAudioUrls[activePromptIndex]" class="flex items-center gap-2">
        <span class="text-xs font-bold text-ok flex items-center gap-1">
          <CheckCircle class="h-4 w-4" />
          <span>Đã có bản ghi âm:</span>
        </span>
        <audio
          :src="recordedAudioUrls[activePromptIndex]"
          controls
          class="h-9 max-w-[220px]"
        />
      </div>
    </div>

    <!-- Transcript của Part đang chọn: tự điền khi nói, có thể sửa tay -->
    <div class="space-y-2 border-t-2 border-line pt-5">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <label :for="`transcript-${activePromptIndex}`" class="font-display text-sm font-black text-ink">
          Transcript Part {{ activePromptIndex + 1 }}
        </label>
        <span class="text-xs font-bold text-ink-soft tabular-nums">
          {{ activeWordCount }} từ
        </span>
      </div>
      <p class="text-xs text-ink-soft">
        {{ speechSupported
          ? 'Lời nói được chuyển thành chữ trong lúc ghi âm. Sửa lại những chỗ nhận dạng sai trước khi nộp bài.'
          : 'Trình duyệt này không hỗ trợ chuyển giọng nói thành chữ. Hãy gõ lại câu trả lời bạn vừa nói để được chấm.' }}
      </p>
      <textarea
        :id="`transcript-${activePromptIndex}`"
        :value="transcripts[activePromptIndex] || ''"
        rows="5"
        class="w-full rounded-brut border-2 border-line bg-surface-2 p-3 text-sm leading-relaxed text-ink outline-none focus:bg-surface focus:shadow-brut-sm"
        placeholder="Câu trả lời bằng tiếng Anh của bạn..."
        @input="(e) => setTranscript(activePromptIndex, (e.target as HTMLTextAreaElement).value)"
      />
      <p v-if="isRecording && interimText" class="text-xs italic text-ink-soft" aria-live="polite">
        Đang nghe: {{ interimText }}
      </p>
    </div>
  </div>
</template>
