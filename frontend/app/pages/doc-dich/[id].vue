<script setup lang="ts">
import {
  BookOpen,
  Eye,
  EyeOff,
  Columns,
  Rows,
  Bookmark,
  BookmarkCheck,
  Star,
  BookmarkPlus,
  Volume2,
  X,
  CheckCircle2,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  FileEdit,
  Type,
} from '@lucide/vue'
import { useLanguage } from '~/composables/useLanguage'
import { useReading, type ReadingMaterial, type ParagraphItem } from '~/composables/useReading'
import { useMedia } from '~/composables/useMedia'
import PageBanner from '~/components/common/PageBanner.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { BRAND_NAME } from '~/constants/brand'

const route = useRoute()
const materialId = computed(() => (route.params.id as string) || 'read-en-tortoise-hare')

const { currentLang } = useLanguage()
const { getMaterialById, saveReadingProgress, saveTranslationAttempt } = useReading(currentLang)
const { saveVocabToMySet } = useMedia(currentLang)

const currentMaterial = computed<ReadingMaterial>(() => {
  return getMaterialById(materialId.value) || getMaterialById('read-en-tortoise-hare')!
})

useHead({
  title: computed(() => `Đọc & Dịch: ${currentMaterial.value?.title || 'Bài đọc'} - ${BRAND_NAME}`),
})

const guideSteps: GuideStep[] = [
  {
    title: 'Chế độ hiển thị Xen kẽ hoặc 2 cột',
    description: 'Chuyển đổi linh hoạt giữa giao diện đọc xen kẽ từng đoạn hoặc chia đôi 2 cột song ngữ đối chiếu song song.',
    targetId: 'reader-layout-toggle',
    badge: 'Bước 1',
  },
  {
    title: 'Tuỳ chỉnh cỡ chữ & Tra từ nhanh',
    description: 'Điều chỉnh cỡ chữ thoải mái và bấm vào bất kỳ từ vựng nào để tra nghĩa, lưu vào bộ Flashcard cá nhân.',
    targetId: 'reader-controls-toolbar',
    badge: 'Bước 2',
  },
  {
    title: 'Ghi nhớ vị trí đọc & Đánh dấu đoạn',
    description: 'Hệ thống tự động lưu vị trí đoạn bạn đang đọc dở. Bạn cũng có thể bấm ngôi sao để đánh dấu đoạn văn hay.',
    targetId: 'reader-content-workspace',
    badge: 'Bước 3',
  },
  {
    title: 'Chế độ Tự dịch đối chiếu',
    description: 'Bật chế độ Tự dịch để tự gõ bản dịch của bạn cho từng đoạn, sau đó bấm nút đối chiếu với bản dịch mẫu.',
    targetId: 'self-translate-toggle-btn',
    badge: 'Bước 4',
  },
]

// ==========================================
// CÀI ĐẶT GIAO DIỆN ĐỌC
// ==========================================
// Chế độ bố cục: 'parallel' (xen kẽ) | 'split' (chia đôi 2 cột)
const layoutMode = ref<'parallel' | 'split'>('parallel')

// Cỡ chữ: 'sm' | 'base' | 'lg' | 'xl'
const fontSize = ref<'sm' | 'base' | 'lg' | 'xl'>('base')

const fontSizeClasses = computed(() => {
  switch (fontSize.value) {
    case 'sm': return 'text-sm sm:text-base leading-relaxed'
    case 'lg': return 'text-lg sm:text-xl leading-relaxed'
    case 'xl': return 'text-xl sm:text-2xl leading-loose'
    default: return 'text-base sm:text-lg leading-relaxed'
  }
})

// Chế độ Tự dịch (Self-translation)
const isSelfTranslateMode = ref(false)
const userTranslations = ref<Record<string, string>>({})
const revealedSampleIds = ref<Record<string, boolean>>({})

const toggleRevealSample = (paraId: string) => {
  revealedSampleIds.value[paraId] = !revealedSampleIds.value[paraId]
}

// ==========================================
// ĐÁNH DẤU & GHI NHỚ VỊ TRÍ ĐỌC
// ==========================================
const bookmarkedParagraphIds = ref<string[]>([])
const lastReadIndex = ref(0)

onMounted(() => {
  if (import.meta.client) {
    // Vị trí đọc dở
    const savedPos = localStorage.getItem(`langua_pos_${currentMaterial.value.id}`)
    if (savedPos) {
      lastReadIndex.value = parseInt(savedPos, 10) || 0
    }

    // Đoạn đã đánh dấu
    const savedBookmarks = localStorage.getItem(`langua_bkmk_${currentMaterial.value.id}`)
    if (savedBookmarks) {
      try {
        bookmarkedParagraphIds.value = JSON.parse(savedBookmarks)
      } catch {
        bookmarkedParagraphIds.value = []
      }
    }
  }
})

const setReadingPosition = (index: number) => {
  lastReadIndex.value = index
  if (import.meta.client) {
    localStorage.setItem(`langua_pos_${currentMaterial.value.id}`, index.toString())
  }
  const isCompleted = index >= (currentMaterial.value?.paragraphs?.length || 1) - 1
  saveReadingProgress(currentMaterial.value.id, index, bookmarkedParagraphIds.value, isCompleted)
}

const toggleBookmarkParagraph = (paraId: string) => {
  if (bookmarkedParagraphIds.value.includes(paraId)) {
    bookmarkedParagraphIds.value = bookmarkedParagraphIds.value.filter(id => id !== paraId)
  } else {
    bookmarkedParagraphIds.value.push(paraId)
  }
  if (import.meta.client) {
    localStorage.setItem(`langua_bkmk_${currentMaterial.value.id}`, JSON.stringify(bookmarkedParagraphIds.value))
  }
  saveReadingProgress(currentMaterial.value.id, lastReadIndex.value, bookmarkedParagraphIds.value)
}

const scrollToParagraph = (index: number) => {
  if (!import.meta.client) return
  setReadingPosition(index)
  const el = document.getElementById(`para-block-${index}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('ring-4', 'ring-warn')
    setTimeout(() => {
      el.classList.remove('ring-4', 'ring-warn')
    }, 1500)
  }
}

// ==========================================
// TRA TỪ & LƯU VÀO BỘ TỪ
// ==========================================
const selectedLookupWord = ref<{ word: string; meaning: string } | null>(null)
const saveSuccess = ref(false)

const openWordLookup = (rawWord: string, hintMeaning?: string) => {
  const clean = rawWord.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '').trim()
  if (!clean) return
  selectedLookupWord.value = {
    word: clean,
    meaning: hintMeaning || 'Từ vựng trong bài đọc.',
  }
  saveSuccess.value = false
}

const saveWordToVocab = () => {
  if (!selectedLookupWord.value) return
  saveVocabToMySet(selectedLookupWord.value.word, selectedLookupWord.value.meaning)
  saveSuccess.value = true
  setTimeout(() => {
    saveSuccess.value = false
  }, 2200)
}

// Web Speech API
const speakSentence = (text: string) => {
  if (!import.meta.client || !window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(text)
  if (currentLang.value === 'en') utterance.lang = 'en-US'
  else if (currentLang.value === 'zh') utterance.lang = 'zh-CN'
  else if (currentLang.value === 'ja') utterance.lang = 'ja-JP'
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6" data-feature="doc-dich">
    <FirstVisitGuide page-key="doc_dich_reader_guide" :steps="guideSteps" />

    <!-- Top Navigation Bar -->
    <div class="flex items-center justify-between">
      <NuxtLink
        to="/doc-dich"
        class="inline-flex items-center gap-1.5 text-xs font-black uppercase text-ink-soft hover:text-ink transition-colors"
      >
        <ArrowLeft class="w-4 h-4 stroke-[2.5]" />
        <span>Về kho Luyện đọc</span>
      </NuxtLink>

      <div class="flex items-center gap-2">
        <BaseBadge tone="warn" size="sm">{{ currentMaterial.level }}</BaseBadge>
        <span class="text-xs font-mono font-bold text-ink-soft">
          Đoạn {{ lastReadIndex + 1 }} / {{ currentMaterial.paragraphs.length }}
        </span>
      </div>
    </div>

    <!-- Page Banner -->
    <PageBanner
      feature="doc-dich"
      :title="currentMaterial.title"
      :description="`${currentMaterial.viTitle} • Tác giả: ${currentMaterial.author}`"
      badge-text="Đọc & Dịch chuyên sâu"
      badge-tone="ok"
    >
      <template #icon>
        <BookOpen class="h-6 w-6 text-on-tone" :stroke-width="2.5" />
      </template>

      <template #actions>
        <div class="flex items-center gap-2 font-mono text-xs font-black">
          <span class="px-2.5 py-1 bg-surface rounded-brut border-2 border-line shadow-brut-sm">
            {{ currentMaterial.wordCount }} từ
          </span>
          <span class="px-2.5 py-1 bg-warn text-on-tone rounded-brut border-2 border-line shadow-brut-sm">
            ~{{ currentMaterial.readingTimeMin }} phút
          </span>
        </div>
      </template>
    </PageBanner>

    <!-- THANH CÔNG CỤ ĐỌC CHUYÊN NGHIỆP (TOOLBAR DÍNH TRÊN ĐẦU - STICKY) -->
    <div
      id="reader-controls-toolbar"
      class="sticky top-20 z-30 p-3.5 bg-surface rounded-brut-lg border-[3px] border-line shadow-brut flex flex-wrap items-center justify-between gap-3"
    >
      <!-- Bố cục (Xen kẽ vs 2 cột) -->
      <div id="reader-layout-toggle" class="flex items-center gap-1.5">
        <span class="text-xs font-bold text-ink-soft mr-1">Bố cục:</span>
        <button
          type="button"
          class="px-3 py-1.5 rounded-brut border-2 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          :class="layoutMode === 'parallel' ? 'bg-warn text-on-tone border-line font-black shadow-brut-sm' : 'bg-surface hover:bg-surface-2 text-ink border-line/40'"
          @click="layoutMode = 'parallel'"
        >
          <Rows class="w-3.5 h-3.5" />
          <span>Xen kẽ đoạn</span>
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded-brut border-2 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          :class="layoutMode === 'split' ? 'bg-warn text-on-tone border-line font-black shadow-brut-sm' : 'bg-surface hover:bg-surface-2 text-ink border-line/40'"
          @click="layoutMode = 'split'"
        >
          <Columns class="w-3.5 h-3.5" />
          <span>Chia đôi 2 cột</span>
        </button>
      </div>

      <!-- Chế độ Tự dịch Toggle -->
      <div class="flex items-center gap-2">
        <button
          id="self-translate-toggle-btn"
          type="button"
          class="px-3.5 py-1.5 rounded-brut border-2 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer"
          :class="isSelfTranslateMode ? 'bg-ok text-on-tone border-line shadow-brut-sm' : 'bg-surface hover:bg-surface-2 text-ink border-line'"
          @click="isSelfTranslateMode = !isSelfTranslateMode"
        >
          <FileEdit class="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{{ isSelfTranslateMode ? 'Đang bật Tự dịch' : 'Bật chế độ Tự dịch' }}</span>
        </button>
      </div>

      <!-- Điều chỉnh cỡ chữ (sm, base, lg, xl) -->
      <div class="flex items-center gap-1">
        <span class="text-xs font-bold text-ink-soft mr-1">Cỡ chữ:</span>
        <div class="inline-flex p-0.5 bg-surface-2 border border-line rounded-brut">
          <button
            v-for="size in ['sm', 'base', 'lg', 'xl']"
            :key="size"
            type="button"
            class="px-2 py-0.5 text-xs font-mono font-bold rounded-brut transition-all cursor-pointer"
            :class="fontSize === size ? 'bg-warn text-on-tone border border-line font-black shadow-brut-sm' : 'text-ink hover:text-black'"
            @click="fontSize = size as any"
          >
            {{ size === 'sm' ? 'A-' : size === 'base' ? 'A' : size === 'lg' ? 'A+' : 'A++' }}
          </button>
        </div>
      </div>
    </div>

    <!-- KHU VỰC VĂN BẢN ĐỌC CHÍNH -->
    <div id="reader-content-workspace" class="space-y-6">
      <!-- Nút nhảy đến vị trí đọc dở nếu có -->
      <div
        v-if="lastReadIndex > 0"
        class="p-3 bg-surface rounded-brut border-2 border-line flex items-center justify-between text-xs"
      >
        <span class="font-bold text-ink">
          Lần trước bạn đang đọc đến <strong>Đoạn {{ lastReadIndex + 1 }}</strong>
        </span>
        <button
          type="button"
          class="text-accent underline font-black cursor-pointer"
          @click="scrollToParagraph(lastReadIndex)"
        >
          Cuộn đến đoạn này
        </button>
      </div>

      <!-- BỐ CỤC 1: XEN KẼ TỪNG ĐOẠN (PARALLEL) -->
      <div v-if="layoutMode === 'parallel'" class="space-y-6">
        <div
          v-for="(para, pIdx) in currentMaterial.paragraphs"
          :id="`para-block-${pIdx}`"
          :key="para.id"
          class="p-5 sm:p-6 rounded-brut-lg border-[3px] border-line bg-surface shadow-brut transition-all space-y-4"
          @click="setReadingPosition(pIdx)"
        >
          <!-- Header mỗi đoạn -->
          <div class="flex items-center justify-between border-b border-line pb-2 text-xs font-mono font-bold text-ink-soft">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded-brut bg-surface-2 border border-line">
                Đoạn #{{ pIdx + 1 }}
              </span>
              <button
                type="button"
                class="p-1 rounded-brut border border-line bg-surface hover:bg-surface-2 text-ink cursor-pointer"
                title="Nghe phát âm đoạn này"
                @click.stop="speakSentence(para.targetText)"
              >
                <Volume2 class="w-3.5 h-3.5 text-accent stroke-[2.5]" />
              </button>
            </div>

            <!-- Nút đánh dấu đoạn -->
            <button
              type="button"
              class="flex items-center gap-1 cursor-pointer"
              :class="bookmarkedParagraphIds.includes(para.id) ? 'text-warn font-black' : 'text-ink-soft hover:text-ink'"
              @click.stop="toggleBookmarkParagraph(para.id)"
            >
              <Star class="w-4 h-4" :class="{ 'fill-warn': bookmarkedParagraphIds.includes(para.id) }" />
              <span>{{ bookmarkedParagraphIds.includes(para.id) ? 'Đã lưu' : 'Đánh dấu' }}</span>
            </button>
          </div>

          <!-- Văn bản ngôn ngữ gốc (Từng từ có thể click để tra nghĩa) -->
          <div :class="fontSizeClasses" class="font-medium text-ink font-serif sm:font-sans">
            <span
              v-for="(w, wIdx) in para.targetText.split(' ')"
              :key="wIdx"
              class="inline-block hover:bg-accent/20 hover:text-accent rounded-xs px-0.5 cursor-pointer transition-colors"
              @click.stop="openWordLookup(w, para.vocabNotes?.find(v => v.word.toLowerCase() === w.toLowerCase())?.meaning)"
            >
              {{ w }}&nbsp;
            </span>
          </div>

          <!-- PHẦN DỊCH: HOẶC BẢN DỊCH MẪU HOẶC KHUNG TỰ DỊCH -->
          <!-- Chế độ Tự dịch -->
          <div v-if="isSelfTranslateMode" class="pt-3 border-t-2 border-line/40 space-y-3">
            <div class="space-y-1">
              <label class="block text-xs font-black uppercase text-ok">Bản dịch của bạn:</label>
              <textarea
                v-model="userTranslations[para.id]"
                rows="2"
                placeholder="Gõ bản dịch tiếng Việt của bạn cho đoạn trên..."
                class="w-full p-3 text-xs sm:text-sm font-medium rounded-brut border-2 border-line bg-surface-2 text-ink outline-none focus:border-focus"
              />
            </div>

            <!-- Nút đối chiếu bản dịch mẫu -->
            <div class="flex items-center justify-between">
              <button
                type="button"
                class="text-xs font-black text-accent underline cursor-pointer"
                @click.stop="toggleRevealSample(para.id)"
              >
                {{ revealedSampleIds[para.id] ? 'Ẩn bản dịch mẫu' : 'Xem bản dịch mẫu để đối chiếu' }}
              </button>
            </div>

            <!-- Bản dịch mẫu mở ra để so sánh -->
            <div
              v-if="revealedSampleIds[para.id]"
              class="p-3 bg-surface rounded-brut border-2 border-line text-xs sm:text-sm text-ink-soft space-y-1 animate-in fade-in duration-150"
            >
              <p class="font-black text-ink uppercase text-[10px]">Bản dịch mẫu chuẩn:</p>
              <p class="leading-relaxed font-medium">{{ para.viTranslation }}</p>
            </div>
          </div>

          <!-- Chế độ Đọc song ngữ bình thường -->
          <div
            v-else
            class="pt-3 border-t-2 border-line/40 text-sm sm:text-base text-ink-soft font-medium leading-relaxed bg-surface-2/60 p-3.5 rounded-brut"
          >
            <span class="text-xs font-black text-ink uppercase block mb-1">Dịch nghĩa:</span>
            {{ para.viTranslation }}
          </div>
        </div>
      </div>

      <!-- BỐ CỤC 2: CHIA ĐÔI 2 CỘT (SPLIT VIEW) -->
      <div v-else class="space-y-6">
        <div
          v-for="(para, pIdx) in currentMaterial.paragraphs"
          :id="`para-block-${pIdx}`"
          :key="para.id"
          class="rounded-brut-lg border-[3px] border-line bg-surface shadow-brut overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y-2 md:divide-y-0 md:divide-x-2 divide-line"
          @click="setReadingPosition(pIdx)"
        >
          <!-- Cột trái: Văn bản gốc -->
          <div class="p-5 sm:p-6 space-y-3 bg-surface">
            <div class="flex items-center justify-between text-xs font-mono font-bold text-ink-soft border-b border-line pb-1.5">
              <span>Bản gốc #{{ pIdx + 1 }}</span>
              <button
                type="button"
                class="p-1 rounded-brut border border-line bg-surface hover:bg-surface-2 text-ink cursor-pointer"
                title="Nghe phát âm"
                @click.stop="speakSentence(para.targetText)"
              >
                <Volume2 class="w-3.5 h-3.5 text-accent stroke-[2.5]" />
              </button>
            </div>

            <div :class="fontSizeClasses" class="font-medium text-ink font-serif sm:font-sans">
              <span
                v-for="(w, wIdx) in para.targetText.split(' ')"
                :key="wIdx"
                class="inline-block hover:bg-accent/20 hover:text-accent rounded-xs px-0.5 cursor-pointer transition-colors"
                @click.stop="openWordLookup(w, para.vocabNotes?.find(v => v.word.toLowerCase() === w.toLowerCase())?.meaning)"
              >
                {{ w }}&nbsp;
              </span>
            </div>
          </div>

          <!-- Cột phải: Bản dịch hoặc Tự dịch -->
          <div class="p-5 sm:p-6 space-y-3 bg-surface-2/40">
            <div class="flex items-center justify-between text-xs font-mono font-bold text-ink-soft border-b border-line pb-1.5">
              <span>{{ isSelfTranslateMode ? 'Tự dịch' : 'Bản dịch tiếng Việt' }}</span>
              <button
                type="button"
                class="flex items-center gap-1 cursor-pointer"
                :class="bookmarkedParagraphIds.includes(para.id) ? 'text-warn font-black' : 'text-ink-soft hover:text-ink'"
                @click.stop="toggleBookmarkParagraph(para.id)"
              >
                <Star class="w-3.5 h-3.5" :class="{ 'fill-warn': bookmarkedParagraphIds.includes(para.id) }" />
              </button>
            </div>

            <div v-if="isSelfTranslateMode" class="space-y-3">
              <textarea
                v-model="userTranslations[para.id]"
                rows="3"
                placeholder="Gõ bản dịch của bạn..."
                class="w-full p-2.5 text-xs sm:text-sm font-medium rounded-brut border-2 border-line bg-surface text-ink outline-none"
              />
              <button
                type="button"
                class="text-xs font-bold text-accent underline cursor-pointer"
                @click.stop="toggleRevealSample(para.id)"
              >
                {{ revealedSampleIds[para.id] ? 'Ẩn bản dịch mẫu' : 'Xem bản dịch mẫu' }}
              </button>

              <p v-if="revealedSampleIds[para.id]" class="text-xs text-ink font-medium p-2 bg-surface rounded-brut border border-line">
                {{ para.viTranslation }}
              </p>
            </div>

            <p v-else :class="fontSizeClasses" class="text-ink-soft font-medium">
              {{ para.viTranslation }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- POPUP / TOOLTIP TRA TỪ & LƯU VÀO BỘ TỪ -->
    <div
      v-if="selectedLookupWord"
      class="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 bg-surface rounded-brut-lg border-[3px] border-line shadow-brut-lg animate-in slide-in-from-bottom-5 duration-200 space-y-2.5"
    >
      <div class="flex items-center justify-between border-b-2 border-line pb-1.5">
        <span class="text-xs font-black uppercase text-accent">Tra từ trong bài đọc</span>
        <button type="button" class="text-ink-soft hover:text-ink cursor-pointer" @click="selectedLookupWord = null">
          <X class="w-4 h-4" />
        </button>
      </div>

      <div>
        <p class="text-lg font-black text-ink font-display">
          {{ selectedLookupWord.word }}
        </p>
        <p class="text-xs text-ink font-medium mt-1">
          {{ selectedLookupWord.meaning }}
        </p>
      </div>

      <div class="pt-2 flex items-center justify-between border-t border-line/40">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-brut border-2 border-line bg-warn hover:bg-warn/90 text-on-tone font-black text-xs shadow-brut-sm cursor-pointer"
          @click="saveWordToVocab"
        >
          <BookmarkPlus class="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Lưu vào bộ từ</span>
        </button>

        <span v-if="saveSuccess" class="text-[11px] font-bold text-ok flex items-center gap-1">
          <CheckCircle2 class="w-3.5 h-3.5" />
          Đã lưu!
        </span>
      </div>
    </div>
  </div>
</template>
