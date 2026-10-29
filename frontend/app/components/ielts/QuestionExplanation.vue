<script setup lang="ts">
import { Play, Square, FileText, Headphones } from '@lucide/vue'
import type { IeltsQuestion, IeltsTestDetail } from '~/composables/useIelts'

// Giải thích một câu Reading / Listening, chỉ đúng đoạn văn hoặc đoạn audio chứa đáp án
const props = defineProps<{
  question: IeltsQuestion
  test: IeltsTestDetail
}>()

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// ── Reading: tìm đoạn chứa dẫn chứng ──
const paragraphs = computed(() =>
  // Tách giống ReadingPane để chữ cái đoạn (A, B, C...) khớp với bài đọc
  (props.test.passageContent || '').split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean),
)

const evidence = computed(() => {
  if (props.test.skill !== 'reading') return null
  const quote = props.question.evidenceQuote?.trim()
  let index = quote ? paragraphs.value.findIndex((p) => p.includes(quote)) : -1
  // Không có câu dẫn chứng: dùng tham chiếu "Đoạn 3" của câu hỏi
  if (index < 0) {
    const n = Number(props.question.passageSectionRef?.match(/\d+/)?.[0])
    if (n >= 1 && n <= paragraphs.value.length) index = n - 1
  }
  if (index < 0) return null
  const text = paragraphs.value[index]!
  const at = quote ? text.indexOf(quote) : -1
  return {
    letter: String.fromCharCode(65 + index),
    order: index + 1,
    before: at >= 0 ? text.slice(0, at) : text,
    quote: at >= 0 ? quote! : '',
    after: at >= 0 ? text.slice(at + quote!.length) : '',
  }
})

// ── Listening: đoạn audio chứa đáp án ──
const hasTimestamp = computed(() => props.test.skill === 'listening' && props.question.audioStartSeconds !== undefined)
const segmentLabel = computed(() => {
  const start = props.question.audioStartSeconds ?? 0
  const end = props.question.audioEndSeconds
  return end !== undefined ? `${formatTime(start)} – ${formatTime(end)}` : `từ ${formatTime(start)}`
})

const audioEl = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)

const stopSegment = () => {
  audioEl.value?.pause()
  isPlaying.value = false
}

const playSegment = async () => {
  const el = audioEl.value
  if (!el) return
  if (isPlaying.value) return stopSegment()
  // Dừng các đoạn khác đang phát trên trang
  document.querySelectorAll<HTMLAudioElement>('audio[data-explain-audio]').forEach((a) => {
    if (a !== el) a.pause()
  })
  el.currentTime = props.question.audioStartSeconds ?? 0
  try {
    await el.play()
    isPlaying.value = true
  } catch {
    isPlaying.value = false
  }
}

const onTimeUpdate = () => {
  const end = props.question.audioEndSeconds
  // Phát dư 1 giây để không cắt mất từ cuối
  if (end !== undefined && audioEl.value && audioEl.value.currentTime >= end + 1) stopSegment()
}

onUnmounted(stopSegment)
</script>

<template>
  <div class="space-y-3">
    <p class="text-sm leading-relaxed text-ink">{{ question.explanation }}</p>

    <!-- Reading: đúng đoạn văn, tô sáng câu chứa đáp án -->
    <figure v-if="evidence" class="rounded-brut border-2 border-line bg-surface p-3 space-y-2">
      <figcaption class="flex items-center gap-2 text-xs font-black text-ink">
        <FileText class="h-3.5 w-3.5" :stroke-width="2.5" aria-hidden="true" />
        <span>Đoạn {{ evidence.letter }} trong bài đọc (đoạn thứ {{ evidence.order }})</span>
      </figcaption>
      <blockquote class="text-sm leading-7 text-ink-soft max-w-[72ch]">
        {{ evidence.before }}<mark v-if="evidence.quote" class="evidence-mark">{{ evidence.quote }}</mark>{{ evidence.after }}
      </blockquote>
    </figure>

    <!-- Listening: đúng đoạn audio + câu trong transcript -->
    <figure
      v-else-if="test.skill === 'listening' && (hasTimestamp || question.evidenceQuote)"
      class="rounded-brut border-2 border-line bg-surface p-3 space-y-2.5"
    >
      <figcaption class="flex flex-wrap items-center gap-2 text-xs font-black text-ink">
        <Headphones class="h-3.5 w-3.5" :stroke-width="2.5" aria-hidden="true" />
        <span v-if="hasTimestamp">Đáp án nằm ở đoạn audio <span class="tabular-nums">{{ segmentLabel }}</span></span>
        <span v-else>Câu chứa đáp án trong transcript</span>
      </figcaption>

      <blockquote v-if="question.evidenceQuote" class="border-l-4 pl-3 text-sm italic leading-relaxed text-ink" style="border-color: var(--c-blue)">
        {{ question.evidenceQuote }}
      </blockquote>

      <template v-if="hasTimestamp">
        <div v-if="test.audioUrl" class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex min-h-[44px] items-center gap-2 rounded-brut border-2 border-line bg-warn px-3 font-display text-xs font-black text-on-tone shadow-brut-sm brut-press cursor-pointer"
            :aria-pressed="isPlaying"
            @click="playSegment"
          >
            <Square v-if="isPlaying" class="h-3.5 w-3.5 fill-current" :stroke-width="2.5" aria-hidden="true" />
            <Play v-else class="h-3.5 w-3.5 fill-current" :stroke-width="2.5" aria-hidden="true" />
            <span>{{ isPlaying ? 'Dừng' : 'Nghe lại đoạn này' }}</span>
          </button>
          <audio
            ref="audioEl"
            :src="test.audioUrl"
            preload="none"
            data-explain-audio
            class="hidden"
            @timeupdate="onTimeUpdate"
            @ended="isPlaying = false"
          />
        </div>
        <p v-else class="text-[11px] text-ink-soft">
          Đề này chưa có file audio để nghe lại, hãy dựa vào câu trong transcript ở trên.
        </p>
      </template>
    </figure>
  </div>
</template>

<style scoped>
.evidence-mark {
  padding: 1px 2px;
  border-radius: 2px;
  background: var(--c-yellow-soft);
  color: var(--ink);
  font-weight: 600;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  box-shadow: inset 0 -3px 0 var(--c-yellow);
}
</style>
