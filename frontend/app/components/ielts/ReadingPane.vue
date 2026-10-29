<script setup lang="ts">
import AnnotatedText from '~/components/ielts/AnnotatedText.vue'

const props = defineProps<{
  title: string
  content: string
}>()

const fontSize = ref<'sm' | 'base' | 'lg'>('base')

const fontSizeClass = computed(() => {
  switch (fontSize.value) {
    case 'sm': return 'text-sm leading-relaxed'
    case 'lg': return 'text-lg leading-loose'
    default: return 'text-base leading-relaxed'
  }
})

// Tách các đoạn văn bản
const paragraphs = computed(() => {
  // Tách theo dòng trống, chấp nhận cả xuống dòng kiểu Windows (\r\n) từ dữ liệu nhập
  return props.content
    .split(/\r?\n\s*\r?\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
})

const getParagraphLetter = (index: number) => {
  return String.fromCharCode(65 + index) // A, B, C, D...
}
</script>

<template>
  <div class="flex flex-col h-full rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut">
    <!-- Header bài đọc & công cụ phóng to/thu nhỏ cỡ chữ -->
    <div class="flex flex-wrap items-center justify-between border-b-2 border-line pb-4 gap-2">
      <div>
        <span class="rounded border-2 border-line bg-warn px-2 py-0.5 text-xs font-black text-on-tone">
          BÀI ĐỌC (READING PASSAGE)
        </span>
        <h2 class="mt-2 text-xl sm:text-2xl font-black text-ink">
          {{ title }}
        </h2>
      </div>

      <!-- Chỉnh kích thước chữ -->
      <div class="flex items-center gap-1.5 rounded-brut border-2 border-line bg-surface-2 p-1">
        <button
          type="button"
          class="px-2 py-1 rounded font-display text-xs font-bold transition-all cursor-pointer"
          :class="fontSize === 'sm' ? 'bg-accent text-accent-ink shadow-brut-sm' : 'text-ink hover:bg-surface'"
          title="Cỡ chữ nhỏ"
          @click="fontSize = 'sm'"
        >
          A-
        </button>
        <button
          type="button"
          class="px-2 py-1 rounded font-display text-xs font-bold transition-all cursor-pointer"
          :class="fontSize === 'base' ? 'bg-accent text-accent-ink shadow-brut-sm' : 'text-ink hover:bg-surface'"
          title="Cỡ chữ vừa"
          @click="fontSize = 'base'"
        >
          A
        </button>
        <button
          type="button"
          class="px-2 py-1 rounded font-display text-xs font-bold transition-all cursor-pointer"
          :class="fontSize === 'lg' ? 'bg-accent text-accent-ink shadow-brut-sm' : 'text-ink hover:bg-surface'"
          title="Cỡ chữ lớn"
          @click="fontSize = 'lg'"
        >
          A+
        </button>
      </div>
    </div>

    <!-- Nội dung bài đọc có thể cuộn riêng -->
    <div class="mt-4 flex-1 overflow-y-auto pr-3 space-y-4 font-body text-ink" :class="fontSizeClass">
      <div
        v-for="(para, idx) in paragraphs"
        :key="idx"
        class="relative pl-7"
      >
        <!-- Nhãn đoạn văn A, B, C... -->
        <span :id="`passage-para-${idx}`" class="absolute left-0 top-0.5 flex h-5 w-5 items-center justify-center rounded border border-line bg-surface-2 font-display text-xs font-black text-ink select-none">
          {{ getParagraphLetter(idx) }}
        </span>
        <AnnotatedText tag="p" :block-id="`p-${idx}`" :text="para" class="font-medium text-ink" />

      </div>
    </div>
  </div>
</template>
