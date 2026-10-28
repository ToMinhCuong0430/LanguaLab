<script setup lang="ts">
import {
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from '@lucide/vue'

export interface GuideStep {
  title: string
  description: string
  targetId?: string
  badge?: string
}

const props = defineProps<{
  pageKey: string
  steps: GuideStep[]
}>()

const { hasVisited, isLoaded, markAsVisited, resetVisit } = useFirstVisit(props.pageKey)

const currentStepIndex = ref(0)
const isModalOpen = ref(false)

// Khi client mount, nếu chưa xem thì tự động mở
watch(isLoaded, (loaded) => {
  if (loaded && !hasVisited.value && props.steps.length > 0) {
    isModalOpen.value = true
  }
})

const currentStep = computed(() => props.steps[currentStepIndex.value] || props.steps[0])
const isLastStep = computed(() => currentStepIndex.value === props.steps.length - 1)
const isFirstStep = computed(() => currentStepIndex.value === 0)

const scrollToTarget = (targetId?: string) => {
  if (!targetId || !import.meta.client) return
  const el = document.getElementById(targetId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('guide-highlight-target')
    setTimeout(() => {
      el.classList.remove('guide-highlight-target')
    }, 1800)
  }
}

const handleNext = () => {
  if (isLastStep.value) {
    completeGuide()
  } else {
    currentStepIndex.value += 1
    scrollToTarget(props.steps[currentStepIndex.value]?.targetId)
  }
}

const handlePrev = () => {
  if (!isFirstStep.value) {
    currentStepIndex.value -= 1
    scrollToTarget(props.steps[currentStepIndex.value]?.targetId)
  }
}

const skipGuide = () => {
  isModalOpen.value = false
  markAsVisited()
}

const completeGuide = () => {
  isModalOpen.value = false
  markAsVisited()
}

const openGuideManually = () => {
  currentStepIndex.value = 0
  isModalOpen.value = true
  scrollToTarget(props.steps[0]?.targetId)
}

// Bắt phím Esc, Mũi tên trái/phải
const onKeyDown = (e: KeyboardEvent) => {
  if (!isModalOpen.value) return
  if (e.key === 'Escape') {
    skipGuide()
  } else if (e.key === 'ArrowRight') {
    handleNext()
  } else if (e.key === 'ArrowLeft') {
    handlePrev()
  }
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', onKeyDown)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', onKeyDown)
  }
})
</script>

<template>
  <div>
    <!-- Nút nhỏ ở góc để người dùng mở lại hướng dẫn: bo tròn trên mobile, có chữ trên desktop -->
    <button
      type="button"
      class="fixed bottom-4 right-4 z-30 inline-flex items-center justify-center gap-1.5 rounded-full sm:rounded-brut border-2 border-line bg-surface p-2.5 sm:px-3 sm:py-2 text-xs font-display font-bold text-ink shadow-brut brut-press"
      title="Xem lại hướng dẫn trang này"
      aria-label="Xem lại hướng dẫn trang này"
      @click="openGuideManually"
    >
      <HelpCircle class="h-4 w-4 text-warn" :stroke-width="2.5" />
      <span class="hidden sm:inline">Hướng dẫn trang</span>
    </button>

    <!-- Modal Hướng Dẫn Neo-brutalism qua BaseModal -->
    <BaseModal
      v-model="isModalOpen"
      max-width="lg"
      @close="skipGuide"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <span class="rounded border-2 border-line bg-warn px-2.5 py-0.5 font-display text-xs font-black text-on-tone">
            HƯỚNG DẪN TRANG
          </span>
          <span class="text-xs font-bold text-ink-soft">
            Bước {{ currentStepIndex + 1 }} / {{ steps.length }}
          </span>
        </div>
      </template>

      <div class="space-y-4">
        <!-- Progress indicators -->
        <div class="flex gap-1.5 w-full">
          <div
            v-for="(_, idx) in steps"
            :key="idx"
            class="h-2 flex-1 rounded border border-line transition-all duration-150"
            :class="idx <= currentStepIndex ? 'bg-accent' : 'bg-surface-2'"
          />
        </div>

        <!-- Body Content -->
        <div class="space-y-2 py-1">
          <div class="flex items-center gap-2">
            <span
              v-if="currentStep.badge"
              class="rounded border border-line bg-ok px-2 py-0.5 text-xs font-bold text-on-tone"
            >
              {{ currentStep.badge }}
            </span>
            <h2 id="guide-title" class="text-xl font-black text-ink">
              {{ currentStep.title }}
            </h2>
          </div>
          <p class="text-sm text-ink-soft leading-relaxed font-medium">
            {{ currentStep.description }}
          </p>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between w-full">
          <button
            type="button"
            class="min-h-[44px] inline-flex items-center text-xs font-bold text-ink-soft underline underline-offset-4 hover:text-ink cursor-pointer"
            @click="skipGuide"
          >
            Bỏ qua toàn bộ
          </button>

          <div class="flex items-center gap-2">
            <BaseButton
              v-if="!isFirstStep"
              variant="secondary"
              size="sm"
              @click="handlePrev"
            >
              <ChevronLeft class="h-4 w-4" :stroke-width="2.5" />
              <span>Trước</span>
            </BaseButton>

            <BaseButton
              variant="primary"
              size="sm"
              @click="handleNext"
            >
              <span>{{ isLastStep ? 'Hoàn tất' : 'Tiếp theo' }}</span>
              <component
                :is="isLastStep ? CheckCircle : ChevronRight"
                class="h-4 w-4 ml-1"
                :stroke-width="2.5"
              />
            </BaseButton>
          </div>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<style>
/* Hiệu ứng nhấp nháy viền nhẹ khi hướng dẫn chỉ vào một target */
.guide-highlight-target {
  outline: 4px solid var(--accent) !important;
  outline-offset: 4px !important;
  transition: outline 0.2s ease;
}
</style>
