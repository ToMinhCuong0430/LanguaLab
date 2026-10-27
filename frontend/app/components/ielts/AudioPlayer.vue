<script setup lang="ts">
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Gauge,
  Lock,
} from '@lucide/vue'
import type { TestMode } from '~/composables/useIelts'

const props = withDefaults(
  defineProps<{
    audioTitle: string
    durationSeconds?: number
    mode?: TestMode
  }>(),
  {
    durationSeconds: 180,
    mode: 'practice',
  },
)

const isPlaying = ref(false)
const currentTime = ref(0)
const playbackRate = ref(1.0)
const playCount = ref(0)
const maxPlays = computed(() => (props.mode === 'exam' ? 1 : 99))
const enforceLimit = ref(props.mode === 'exam')

let interval: ReturnType<typeof setInterval> | null = null

const formattedCurrentTime = computed(() => formatTime(currentTime.value))
const formattedDuration = computed(() => formatTime(props.durationSeconds))

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const togglePlay = () => {
  if (isPlaying.value) {
    pauseAudio()
  } else {
    playAudio()
  }
}

const playAudio = () => {
  if (enforceLimit.value && playCount.value >= maxPlays.value) {
    return
  }
  isPlaying.value = true
  if (currentTime.value === 0) {
    playCount.value += 1
  }

  stopTimer()
  interval = setInterval(() => {
    if (currentTime.value < props.durationSeconds) {
      currentTime.value += 0.5 * playbackRate.value
    } else {
      pauseAudio()
      currentTime.value = props.durationSeconds
    }
  }, 500)
}

const pauseAudio = () => {
  isPlaying.value = false
  stopTimer()
}

const stopTimer = () => {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
}

const seekRelative = (offsetSeconds: number) => {
  if (enforceLimit.value && props.mode === 'exam') return
  currentTime.value = Math.max(0, Math.min(props.durationSeconds, currentTime.value + offsetSeconds))
}

const onSeek = (e: Event) => {
  if (enforceLimit.value && props.mode === 'exam') return
  const target = e.target as HTMLInputElement
  currentTime.value = parseFloat(target.value)
}

const changeSpeed = () => {
  const speeds = [0.8, 1.0, 1.2, 1.5]
  const nextIdx = (speeds.indexOf(playbackRate.value) + 1) % speeds.length
  playbackRate.value = speeds[nextIdx]
}

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div class="rounded-brut-lg border-[3px] border-line bg-surface p-4 sm:p-5 shadow-brut space-y-4">
    <!-- Header thông tin file nghe -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-line pb-3">
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded border-2 border-line bg-accent text-accent-ink shadow-brut-sm">
          <Volume2 class="h-5 w-5" :stroke-width="2.5" />
        </div>
        <div>
          <span class="rounded border border-line bg-surface-2 px-1.5 py-0.2 text-[10px] font-black uppercase text-ink">
            AUDIO TRACK
          </span>
          <h3 class="font-display text-sm sm:text-base font-bold text-ink">
            {{ audioTitle }}
          </h3>
        </div>
      </div>

      <!-- Giới hạn lượt nghe -->
      <div class="flex items-center gap-2">
        <span
          class="rounded border-2 border-line px-2 py-0.5 text-xs font-bold shadow-brut-sm"
          :class="playCount >= maxPlays && enforceLimit ? 'bg-bad text-on-tone' : 'bg-surface-2 text-ink'"
        >
          Lượt nghe: {{ playCount }}/{{ enforceLimit ? maxPlays : '∞' }}
        </span>

        <!-- Cho phép bật tắt giới hạn ở chế độ Luyện tập -->
        <button
          v-if="mode === 'practice'"
          type="button"
          class="text-xs font-bold text-ink underline cursor-pointer hover:text-accent"
          @click="enforceLimit = !enforceLimit"
        >
          {{ enforceLimit ? 'Bỏ giới hạn' : 'Bật giới hạn 1 lần' }}
        </button>
      </div>
    </div>

    <!-- Thanh tiến trình Audio -->
    <div class="space-y-1">
      <div class="flex items-center justify-between text-xs font-black font-display text-ink">
        <span>{{ formattedCurrentTime }}</span>
        <span>{{ formattedDuration }}</span>
      </div>

      <div class="relative flex items-center">
        <input
          type="range"
          min="0"
          :max="durationSeconds"
          step="0.5"
          :value="currentTime"
          :disabled="mode === 'exam' && enforceLimit"
          class="w-full h-3 rounded border-2 border-line bg-surface-2 accent-accent cursor-pointer disabled:cursor-not-allowed"
          @input="onSeek"
        >
      </div>
    </div>

    <!-- Cụm nút điều khiển audio (Play/Pause, Tua, Tốc độ) -->
    <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
      <div class="flex items-center gap-2">
        <!-- Nút lùi 5s -->
        <button
          type="button"
          class="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-brut border-2 border-line bg-surface text-ink shadow-brut-sm brut-press disabled:opacity-50 cursor-pointer"
          :disabled="mode === 'exam' && enforceLimit"
          aria-label="Lùi lại 5 giây"
          title="Lùi 5 giây"
          @click="seekRelative(-5)"
        >
          <RotateCcw class="h-4 w-4" :stroke-width="2.5" />
        </button>

        <!-- Nút Play / Pause chính -->
        <button
          type="button"
          class="flex h-11 min-h-[44px] px-4 items-center gap-2 rounded-brut border-2 border-line bg-warn text-on-tone font-display text-sm font-black shadow-brut brut-press disabled:opacity-50 cursor-pointer"
          :disabled="playCount >= maxPlays && enforceLimit && !isPlaying"
          @click="togglePlay"
        >
          <Pause v-if="isPlaying" class="h-5 w-5" :stroke-width="2.5" />
          <Play v-else class="h-5 w-5 fill-current" :stroke-width="2.5" />
          <span>{{ isPlaying ? 'Tạm dừng' : currentTime > 0 ? 'Tiếp tục' : 'Bắt đầu nghe' }}</span>
        </button>

        <!-- Nút tiến 5s -->
        <button
          type="button"
          class="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-brut border-2 border-line bg-surface text-ink shadow-brut-sm brut-press disabled:opacity-50 cursor-pointer"
          :disabled="mode === 'exam' && enforceLimit"
          aria-label="Tua tới 5 giây"
          title="Tua tới 5 giây"
          @click="seekRelative(5)"
        >
          <RotateCw class="h-4 w-4" :stroke-width="2.5" />
        </button>
      </div>

      <!-- Tốc độ phát -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-brut border-2 border-line bg-surface px-3 py-1.5 font-display text-xs font-black text-ink shadow-brut-sm brut-press cursor-pointer"
        title="Đổi tốc độ phát âm thanh"
        @click="changeSpeed"
      >
        <Gauge class="h-3.5 w-3.5" :stroke-width="2.5" />
        <span>Tốc độ: {{ playbackRate }}x</span>
      </button>
    </div>
  </div>
</template>
