<script setup lang="ts">
import { Globe, Check } from '@lucide/vue'
import { useLanguage, type LearningLanguage } from '~/composables/useLanguage'

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
  en: { bg: 'var(--c-blue)', text: '#FFFFFF' },
  zh: { bg: 'var(--c-coral)', text: '#FFFFFF' },
  ja: { bg: 'var(--c-pink)', text: '#11141D' },
}

const selectLang = (lang: LearningLanguage) => {
  setLanguage(lang)
  emit('change', lang)
}
</script>

<template>
  <div class="inline-flex items-center gap-1.5 p-1.5 rounded-brut border-2 border-line bg-surface shadow-brut-sm">
    <div class="flex items-center gap-1 px-2 py-1 text-xs font-black uppercase text-ink-soft select-none">
      <Globe class="w-3.5 h-3.5 text-ink" :stroke-width="2.5" />
      <span class="hidden sm:inline">Mục tiêu:</span>
    </div>

    <div class="flex items-center gap-1" role="radiogroup" aria-label="Chọn ngôn ngữ học">
      <button
        v-for="item in supportedLanguages"
        :key="item.code"
        type="button"
        role="radio"
        :aria-checked="currentLang === item.code"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-brut border-2 transition-all cursor-pointer"
        :class="[
          currentLang === item.code
            ? 'border-line shadow-brut-sm font-black'
            : 'bg-surface hover:bg-surface-2 text-ink border-transparent hover:border-line',
        ]"
        :style="currentLang === item.code ? { backgroundColor: langColorMap[item.code]?.bg || 'var(--warn)', color: langColorMap[item.code]?.text || '#11141D' } : {}"
        @click="selectLang(item.code)"
      >
        <span class="text-sm leading-none">{{ item.flag }}</span>
        <span>{{ item.name }}</span>
        <Check v-if="currentLang === item.code" class="w-3 h-3 stroke-[3]" />
      </button>
    </div>
  </div>
</template>
