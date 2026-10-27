<script setup lang="ts">
import {
  Flame,
  Clock,
  BookOpen,
  Award,
  Zap,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
} from '@lucide/vue'
import type { WeeklyStoryGroup, StorySlide } from '~/composables/useHomeData'

const { weeklyStories } = useHomeData()

const activeGroupIndex = ref<number | null>(null)
const currentSlideIndex = ref(0)
const isPaused = ref(false)
const progress = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const activeGroup = computed(() => {
  if (activeGroupIndex.value === null) return null
  return weeklyStories.value[activeGroupIndex.value] || null
})

const currentSlide = computed(() => {
  if (!activeGroup.value) return null
  return activeGroup.value.slides[currentSlideIndex.value] || null
})

const totalSlides = computed(() => activeGroup.value?.slides.length || 0)

const SLIDE_DURATION_MS = 5000 // 5 giây một slide
const TICK_INTERVAL_MS = 50

const openStory = (groupIndex: number) => {
  activeGroupIndex.value = groupIndex
  currentSlideIndex.value = 0
  progress.value = 0
  isPaused.value = false
  weeklyStories.value[groupIndex].isViewed = true
  startTimer()
}

const closeStory = () => {
  stopTimer()
  activeGroupIndex.value = null
  currentSlideIndex.value = 0
  progress.value = 0
}

const startTimer = () => {
  stopTimer()
  progress.value = 0
  timer = setInterval(() => {
    if (isPaused.value) return
    progress.value += (TICK_INTERVAL_MS / SLIDE_DURATION_MS) * 100
    if (progress.value >= 100) {
      nextSlide()
    }
  }, TICK_INTERVAL_MS)
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const nextSlide = () => {
  if (!activeGroup.value) return
  if (currentSlideIndex.value < totalSlides.value - 1) {
    currentSlideIndex.value += 1
    progress.value = 0
  } else {
    // Chuyển sang story tiếp theo nếu có
    if (activeGroupIndex.value !== null && activeGroupIndex.value < weeklyStories.value.length - 1) {
      activeGroupIndex.value += 1
      currentSlideIndex.value = 0
      progress.value = 0
      weeklyStories.value[activeGroupIndex.value].isViewed = true
    } else {
      closeStory()
    }
  }
}

const prevSlide = () => {
  if (!activeGroup.value) return
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value -= 1
    progress.value = 0
  } else {
    // Lùi về story trước nếu có
    if (activeGroupIndex.value !== null && activeGroupIndex.value > 0) {
      activeGroupIndex.value -= 1
      currentSlideIndex.value = weeklyStories.value[activeGroupIndex.value].slides.length - 1
      progress.value = 0
    }
  }
}

// Bắt phím bàn phím
const handleKeyDown = (e: KeyboardEvent) => {
  if (activeGroupIndex.value === null) return
  if (e.key === 'Escape') {
    closeStory()
  } else if (e.key === 'ArrowRight' || e.key === 'Space') {
    nextSlide()
  } else if (e.key === 'ArrowLeft') {
    prevSlide()
  }
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  stopTimer()
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeyDown)
  }
})

const getSlideIcon = (type?: string) => {
  switch (type) {
    case 'flame': return Flame
    case 'clock': return Clock
    case 'book': return BookOpen
    case 'award': return Award
    case 'zap': return Zap
    default: return Award
  }
}
</script>

<template>
  <div id="home-weekly-story" class="space-y-3">
    <div class="flex items-center justify-between">
      <span class="font-display font-black text-base text-ink">
        Khoảnh khắc tuần qua
      </span>
      <span class="text-xs font-bold text-ink-soft">
        Bấm để xem Story
      </span>
    </div>

    <!-- Dải avatar hình tròn/vuông kiểu Story Neo-brutalism -->
    <div class="flex items-center gap-3 overflow-x-auto pb-2">
      <button
        v-for="(story, idx) in weeklyStories"
        :key="story.id"
        type="button"
        class="flex flex-col items-center gap-1.5 focus:outline-none group cursor-pointer"
        @click="openStory(idx)"
      >
        <div
          class="relative flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-line transition-transform duration-100 group-hover:scale-105"
          :class="[
            story.tone === 'warn' ? 'bg-warn text-on-tone' :
            story.tone === 'ok' ? 'bg-ok text-on-tone' :
            story.tone === 'accent' ? 'bg-accent text-accent-ink' : 'bg-mark text-on-tone',
            story.isViewed ? 'shadow-none opacity-80' : 'shadow-brut ring-2 ring-line ring-offset-2',
          ]"
        >
          <Flame v-if="story.tone === 'warn'" class="h-7 w-7" :stroke-width="2.5" />
          <Award v-else-if="story.tone === 'ok'" class="h-7 w-7" :stroke-width="2.5" />
          <Zap v-else class="h-7 w-7" :stroke-width="2.5" />
        </div>
        <span class="font-display text-xs font-bold text-ink group-hover:underline line-clamp-1 max-w-[70px] text-center">
          {{ story.shortLabel }}
        </span>
      </button>
    </div>

    <!-- Story Viewer Toàn Màn Hình Neo-brutalism -->
    <Teleport to="body">
      <div
        v-if="activeGroup && currentSlide"
        class="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 select-none"
        role="dialog"
        aria-modal="true"
        @click.self="closeStory"
      >
        <!-- Khung Slide Neo-brutalism -->
        <div class="relative flex flex-col justify-between w-full max-w-md h-[560px] rounded-brut-lg border-[4px] border-line bg-surface p-6 shadow-brut-lg text-ink overflow-hidden animate-in zoom-in-95 duration-150">
          <!-- Top Bar: Thanh tiến độ các slide và nút đóng -->
          <div class="space-y-3 z-20">
            <!-- Dãy thanh tiến độ -->
            <div class="flex items-center gap-1.5 w-full">
              <div
                v-for="(_, sIdx) in activeGroup.slides"
                :key="sIdx"
                class="h-2 flex-1 rounded border border-line bg-surface-2 overflow-hidden"
              >
                <div
                  class="h-full bg-accent transition-all duration-75"
                  :style="{
                    width: sIdx < currentSlideIndex ? '100%' : sIdx === currentSlideIndex ? `${progress}%` : '0%',
                  }"
                />
              </div>
            </div>

            <!-- Header Story: Nhóm và Nút X -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="rounded border-2 border-line bg-warn px-2 py-0.5 font-display text-xs font-black text-on-tone">
                  {{ activeGroup.title }}
                </span>
                <span class="text-xs font-bold text-ink-soft">
                  {{ currentSlideIndex + 1 }}/{{ totalSlides }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-brut border-2 border-line bg-surface p-1 text-ink hover:bg-surface-2 shadow-brut-sm cursor-pointer"
                  :aria-label="isPaused ? 'Tiếp tục bảng tin' : 'Tạm dừng bảng tin'"
                  :title="isPaused ? 'Tiếp tục' : 'Tạm dừng'"
                  @click="isPaused = !isPaused"
                >
                  <Play v-if="isPaused" class="h-4 w-4" :stroke-width="2.5" />
                  <Pause v-else class="h-4 w-4" :stroke-width="2.5" />
                </button>
                <button
                  type="button"
                  class="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-brut border-2 border-line bg-surface p-1 text-ink hover:bg-surface-2 shadow-brut-sm cursor-pointer"
                  aria-label="Đóng bảng tin story"
                  @click="closeStory"
                >
                  <X class="h-4 w-4" :stroke-width="2.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Nội dung chính của Slide (ở giữa) -->
          <div class="my-auto text-center space-y-4 z-20 px-2">
            <!-- Icon nổi bật hình khối neo-brutalism -->
            <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-brut-lg border-[3px] border-line bg-warn text-on-tone shadow-brut">
              <component
                :is="getSlideIcon(currentSlide.iconType)"
                class="h-10 w-10"
                :stroke-width="2.5"
              />
            </div>

            <div class="space-y-2">
              <h3 class="font-display text-lg font-bold uppercase tracking-wider text-ink-soft">
                {{ currentSlide.title }}
              </h3>

              <!-- Highlight cực đậm -->
              <div class="inline-block rounded-brut border-[3px] border-line bg-accent px-4 py-2 font-display text-3xl sm:text-4xl font-black text-accent-ink shadow-brut">
                {{ currentSlide.highlight }}
              </div>
            </div>

            <p class="text-sm sm:text-base font-medium leading-relaxed text-ink max-w-xs mx-auto">
              {{ currentSlide.description }}
            </p>

            <div v-if="currentSlide.statBadge" class="inline-block">
              <span class="rounded border-2 border-line bg-ok px-3 py-1 font-display text-xs font-black text-on-tone shadow-brut-sm">
                {{ currentSlide.statBadge }}
              </span>
            </div>
          </div>

          <!-- Footer: Nút bấm chuyển slide thủ công -->
          <div class="flex items-center justify-between border-t-2 border-line pt-3 z-20">
            <button
              type="button"
              class="flex items-center gap-1 text-xs font-bold text-ink hover:underline cursor-pointer"
              @click="prevSlide"
            >
              <ChevronLeft class="h-4 w-4" :stroke-width="2.5" />
              <span>Trước</span>
            </button>

            <span class="text-[11px] text-ink-soft">
              Phím mũi tên ← → hoặc click màn hình
            </span>

            <button
              type="button"
              class="flex items-center gap-1 text-xs font-bold text-ink hover:underline cursor-pointer"
              @click="nextSlide"
            >
              <span>Tiếp</span>
              <ChevronRight class="h-4 w-4" :stroke-width="2.5" />
            </button>
          </div>

          <!-- Nửa màn hình cảm ứng để bấm trái/phải -->
          <div
            class="absolute top-16 left-0 bottom-12 w-1/2 z-10 cursor-pointer"
            title="Slide trước"
            @click="prevSlide"
          />
          <div
            class="absolute top-16 right-0 bottom-12 w-1/2 z-10 cursor-pointer"
            title="Slide tiếp"
            @click="nextSlide"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>
