<script setup lang="ts">
import { Globe, Check } from '@lucide/vue'
import { useLanguage, type LearningLanguage } from '~/composables/useLanguage'
import DevelopmentBadge from '~/components/common/DevelopmentBadge.vue'

withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  {
    compact: false,
  },
)

const emit = defineEmits<{
  (e: 'change', lang: LearningLanguage): void
}>()

const { currentLang, supportedLanguages, setLanguage } = useLanguage()

const langColorMap: Record<string, { bg: string; text: string }> = {
  en: { bg: 'var(--c-blue)', text: 'var(--accent-ink, #FFFFFF)' },
  zh: { bg: 'var(--c-coral)', text: 'var(--ink)' },
  ja: { bg: 'var(--c-pink)', text: 'var(--ink)' },
}

const noticeMessage = ref<string | null>(null)
let noticeTimer: any = null

const selectLang = (item: any) => {
  if (item.status === 'in_development') {
    noticeMessage.value = `${item.name} đang được phát triển, sẽ ra mắt sau.`
    if (noticeTimer) clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => {
      noticeMessage.value = null
    }, 3500)
    return
  }

  noticeMessage.value = null
  const ok = setLanguage(item.code)
  if (ok) {
    emit('change', item.code)
  }
}
</script>

<template>
  <div class="inline-flex flex-col gap-1.5">
    <div class="inline-flex items-center gap-1.5 p-1.5 rounded-brut border-2 border-line bg-surface shadow-brut-sm flex-wrap">
      <div class="flex items-center gap-1 px-2 py-1 text-xs font-black uppercase text-ink-soft select-none">
        <Globe class="w-3.5 h-3.5 text-ink" :stroke-width="2.5" />
        <span class="hidden sm:inline">Mục tiêu:</span>
      </div>

      <div class="flex items-center gap-1.5 flex-wrap" role="radiogroup" aria-label="Chọn ngôn ngữ học">
        <button
          v-for="item in supportedLanguages"
          :key="item.code"
          type="button"
          role="radio"
          :aria-checked="currentLang === item.code"
          :aria-disabled="item.status === 'in_development'"
          class="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-brut border-2 transition-all"
          :class="[
            item.status === 'in_development'
              ? 'opacity-60 bg-surface-2 text-ink-soft border-dashed border-line cursor-not-allowed'
              : (currentLang === item.code
                ? 'border-line shadow-brut-sm font-black cursor-pointer'
                : 'bg-surface hover:bg-surface-2 text-ink border-transparent hover:border-line cursor-pointer'),
          ]"
          :style="currentLang === item.code && item.status !== 'in_development' ? { backgroundColor: langColorMap[item.code]?.bg || 'var(--warn)', color: langColorMap[item.code]?.text || 'var(--ink)' } : {}"
          @click="selectLang(item)"
        >
          <span class="text-sm leading-none">{{ item.flag }}</span>
          <span>{{ item.name }}</span>
          <Check v-if="currentLang === item.code && item.status !== 'in_development'" class="w-3 h-3 stroke-[3]" />
          <DevelopmentBadge v-if="item.status === 'in_development'" size="xs" />
        </button>
      </div>
    </div>

    <!-- Thông báo ngắn khi bấm vào ngôn ngữ đang phát triển -->
    <div
      v-if="noticeMessage"
      aria-live="polite"
      class="text-xs font-bold text-warn-ink bg-warn-soft/90 px-3 py-1.5 rounded-brut border border-line shadow-brut-sm animate-in fade-in slide-in-from-top-1 duration-150"
    >
      {{ noticeMessage }}
    </div>
  </div>
</template>
