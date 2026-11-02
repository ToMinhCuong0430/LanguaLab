<script setup lang="ts">
import {
  Search,
  Volume2,
  BookmarkPlus,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Link,
  Layers,
  ArrowRight,
  ShieldCheck,
} from '@lucide/vue'
import { useLanguage } from '~/composables/useLanguage'
import { useDictionary } from '~/composables/useDictionary'
import { useVocabLevels } from '~/composables/useVocabLevels'
import { useMedia } from '~/composables/useMedia'
import type { DictionaryEntry } from '~/composables/dictionary/provider'
import PageBanner from '~/components/common/PageBanner.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { BRAND_NAME } from '~/constants/brand'
import { levelBadge } from '~/constants/badges'

const route = useRoute()
const wordParam = computed(() => (route.params.tu as string) || 'pragmatic')

const { currentLang, currentLanguageOption } = useLanguage()
const { lookupWord, saveToHistory, providerName, suggestWithLevel } = useDictionary(currentLang)
const { fetchLevels, getLevelTitle } = useVocabLevels()
const { saveVocabToMySet } = useMedia(currentLang)

const entry = ref<DictionaryEntry | null>(null)
const isLoading = ref(true)
const saveSuccess = ref(false)

const guideSteps: GuideStep[] = [
  {
    title: 'Phát âm chuẩn âm vị & Tần suất',
    description: 'Bấm nút loa để nghe giọng đọc bản xứ theo chuẩn IPA, Pinyin hoặc Romaji.',
    targetId: 'word-pronunciation-header',
    badge: 'Bước 1',
  },
  {
    title: 'Các nghĩa đánh số & Ví dụ thực tế',
    description: 'Định nghĩa chuẩn mực chi tiết từng lớp nghĩa kèm câu ví dụ đời thực có dịch song ngữ.',
    targetId: 'word-definitions-list',
    badge: 'Bước 2',
  },
  {
    title: 'Cụm từ cố định & Từ đồng nghĩa / Trái nghĩa',
    description: 'Tích luỹ các cụm Collocations tự nhiên và mở rộng vốn từ tương đương.',
    targetId: 'word-collocations-box',
    badge: 'Bước 3',
  },
  {
    title: 'Lưu vào bộ từ của tôi',
    description: 'Bấm nút "Lưu vào bộ từ" để tự động thêm từ này vào bộ Flashcard SRS cá nhân.',
    targetId: 'save-word-action-btn',
    badge: 'Bước 4',
  },
]

const notFoundSuggestions = ref<{ word: string; level?: string }[]>([])

const loadWord = async () => {
  isLoading.value = true
  fetchLevels()
  const res = await lookupWord(wordParam.value)
  entry.value = res
  if (res) {
    saveToHistory(res.word)
    notFoundSuggestions.value = []
  } else {
    try {
      const suggestions = await suggestWithLevel(wordParam.value)
      notFoundSuggestions.value = suggestions.slice(0, 5)
    } catch {
      notFoundSuggestions.value = []
    }
  }
  isLoading.value = false
}

onMounted(() => {
  loadWord()
})

watch([wordParam, currentLang], () => {
  loadWord()
})

useHead({
  title: computed(() => `Tra từ: ${entry.value?.word || wordParam.value} - Từ điển ${BRAND_NAME}`),
})

// Web Speech API & Native Audio
const fallbackSpeak = () => {
  if (!import.meta.client || !window.speechSynthesis || !entry.value) return
  const utterance = new SpeechSynthesisUtterance(entry.value.word)
  if (currentLang.value === 'en') utterance.lang = 'en-US'
  else if (currentLang.value === 'zh') utterance.lang = 'zh-CN'
  else if (currentLang.value === 'ja') utterance.lang = 'ja-JP'
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

const speak = () => {
  if (entry.value?.audioUrl) {
    try {
      const audio = new Audio(entry.value.audioUrl)
      audio.play().catch(() => {
        fallbackSpeak()
      })
      return
    } catch {
      fallbackSpeak()
      return
    }
  }
  fallbackSpeak()
}

const handleSaveVocab = () => {
  if (!entry.value) return
  const primaryMeaning = entry.value.senses[0]?.definitions[0]?.meaning || 'Từ vựng tra từ điển'
  saveVocabToMySet(entry.value.word, primaryMeaning)
  saveSuccess.value = true
  setTimeout(() => {
    saveSuccess.value = false
  }, 2500)
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6" data-feature="tu-dien">
    <FirstVisitGuide page-key="tu_dien_entry_guide" :steps="guideSteps" />

    <!-- Top Navigation Bar -->
    <div class="flex items-center justify-between">
      <NuxtLink
        to="/tu-dien"
        class="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-black uppercase text-ink-soft hover:text-ink transition-colors"
      >
        <ArrowLeft class="w-4 h-4 stroke-[2.5]" />
        <span>Về trang tra cứu từ điển</span>
      </NuxtLink>

      <div class="flex items-center gap-2">
        <BaseBadge tone="warn" size="sm">{{ currentLanguageOption.name }}</BaseBadge>
        <NuxtLink
          to="/nguon-du-lieu"
          class="text-xs font-mono font-bold text-ink-soft hover:text-accent underline transition-colors"
          title="Xem nguồn dữ liệu mở và bản quyền"
        >
          Nguồn: {{ entry?.sourceProvider || providerName }}
        </NuxtLink>
      </div>
    </div>

    <!-- KHÔNG TÌM THẤY TỪ -->
    <BaseEmptyState
      v-if="!isLoading && !entry"
      :title="`Không tìm thấy từ '${wordParam}'`"
      description="Mục từ này hiện chưa có trong cơ sở dữ liệu từ điển."
      tone="warning"
    >
      <template #action>
        <div class="space-y-4">
          <div v-if="notFoundSuggestions.length > 0" class="space-y-2">
            <span class="text-xs font-black uppercase text-ink-soft tracking-wider block">
              Có thể bạn muốn tìm:
            </span>
            <div class="flex flex-wrap justify-center gap-2">
              <NuxtLink
                v-for="sug in notFoundSuggestions"
                :key="sug.word"
                :to="`/tu-dien/${encodeURIComponent(sug.word.toLowerCase())}`"
                class="px-3 py-1.5 rounded-brut border-2 border-line bg-surface hover:bg-surface-2 text-ink text-xs font-bold shadow-brut-sm hover:-translate-y-0.5 transition-transform inline-flex items-center gap-1.5"
              >
                <span class="font-mono">{{ sug.word }}</span>
                <BaseBadge v-if="sug.level" v-bind="levelBadge(sug.level)" size="sm">
                  {{ sug.level }}
                </BaseBadge>
              </NuxtLink>
            </div>
          </div>

          <div class="flex justify-center">
            <BaseButton to="/tu-dien" variant="primary" size="sm">
              Quay lại trang tra từ
            </BaseButton>
          </div>
        </div>
      </template>
    </BaseEmptyState>

    <!-- NỘI DUNG TRA TỪ CHI TIẾT -->
    <div v-else-if="entry" class="space-y-6">
      <!-- Thông báo dạng từ khi tra qua form (ví dụ went -> go) -->
      <div
        v-if="entry.matchedForm && entry.matchedForm.toLowerCase() !== entry.word.toLowerCase()"
        class="p-2.5 px-3.5 bg-accent/10 border-2 border-line text-ink rounded-brut text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-brut-sm"
      >
        <span class="font-mono text-accent font-black">{{ entry.matchedForm }}</span>
        <span>là dạng của</span>
        <span class="font-black underline">{{ entry.word }}</span>
      </div>

      <!-- Word Header Card -->
      <BaseCard id="word-pronunciation-header" tone="surface">
        <div class="border-b-2 border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <h1 class="text-4xl sm:text-5xl font-black text-ink font-display tracking-tight">
                {{ entry.word }}
              </h1>
              <button
                type="button"
                class="p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-brut border-2 border-line bg-surface hover:bg-surface-2 text-ink shadow-brut-sm cursor-pointer transition-transform active:translate-y-0.5"
                title="Nghe phát âm"
                aria-label="Nghe phát âm từ vựng"
                @click="speak"
              >
                <Volume2 class="w-5 h-5 text-accent stroke-[2.5]" />
              </button>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <span v-if="entry.phonetic" class="text-base sm:text-lg font-mono font-bold text-ink-soft">
                {{ entry.phonetic }}
              </span>
              <!-- Cấp độ của toàn mục từ kèm tên cấp độ từ database vocab_levels -->
              <div v-if="entry.level" class="flex items-center gap-1.5">
                <BaseBadge v-bind="levelBadge(entry.level)" size="sm">
                  {{ entry.level }}
                </BaseBadge>
                <span v-if="entry.vocabLevel" class="text-xs font-bold text-ink-soft">
                  Cấp {{ entry.vocabLevel }}<span v-if="getLevelTitle(entry.vocabLevel)"> · {{ getLevelTitle(entry.vocabLevel) }}</span>
                </span>
              </div>
            </div>

            <!-- Các dạng chia từ (Forms) -->
            <div v-if="entry.forms && entry.forms.length > 0" class="pt-1 flex items-center gap-1.5 flex-wrap text-xs">
              <span class="font-black text-ink-soft uppercase text-[10px] tracking-wider">Biến thể:</span>
              <span
                v-for="f in entry.forms"
                :key="f.form + f.formType"
                class="px-2 py-0.5 rounded-brut bg-surface-2 border border-line font-mono text-xs font-bold text-ink"
              >
                {{ f.form }}
                <span class="text-ink-soft font-sans font-normal text-[10px]">({{ f.formType }})</span>
              </span>
            </div>
          </div>

          <!-- Nút Lưu vào Bộ từ -->
          <div id="save-word-action-btn" class="flex items-center gap-2">
            <button
              type="button"
              class="px-4 py-2.5 min-h-[44px] rounded-brut border-2 border-line bg-warn hover:bg-warn/90 text-on-tone font-black text-xs sm:text-sm shadow-brut cursor-pointer transition-transform active:translate-y-0.5 flex items-center gap-1.5"
              @click="handleSaveVocab"
            >
              <BookmarkPlus class="w-4 h-4 stroke-[2.5]" />
              <span>Lưu vào bộ từ của tôi</span>
            </button>
            <span v-if="saveSuccess" class="text-xs font-black text-ok flex items-center gap-1">
              <CheckCircle2 class="w-4 h-4" />
              Đã lưu!
            </span>
          </div>
        </div>

        <!-- Nguồn gốc từ (Etymology) nếu có -->
        <div v-if="entry.etymology" class="mt-4 p-3 bg-surface-2 rounded-brut border border-line text-xs space-y-0.5">
          <span class="font-black text-accent uppercase mr-1">Nguồn gốc & Cấu tạo từ:</span>
          <span class="text-ink font-medium">{{ entry.etymology }}</span>
        </div>

        <!-- Danh sách các nghĩa đánh số theo từng từ loại -->
        <div id="word-definitions-list" class="py-4 space-y-6">
          <div
            v-for="(sense, sIdx) in entry.senses"
            :key="sIdx"
            class="space-y-4"
          >
            <span class="inline-block px-3 py-1 rounded-brut border-2 border-line bg-warn text-on-tone font-black text-xs uppercase shadow-brut-sm">
              {{ sense.partOfSpeech }}
            </span>

            <div class="space-y-4 pl-3 border-l-2 border-line/40">
              <div
                v-for="def in sense.definitions"
                :key="def.index"
                class="space-y-2.5"
              >
                <div class="flex items-start gap-2.5 text-base sm:text-lg font-bold text-ink">
                  <span class="font-mono text-accent font-black shrink-0">#{{ def.index }}.</span>
                  <div class="flex-1 space-y-1.5">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span>{{ def.meaning }}</span>
                      <BaseBadge
                        v-if="def.level"
                        v-bind="levelBadge(def.level)"
                        size="sm"
                      >
                        {{ def.level }}
                      </BaseBadge>
                    </div>
                    <div
                      v-if="def.viMeaning"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-brut bg-surface-2 border border-line text-xs sm:text-sm font-semibold text-ink"
                    >
                      <span class="text-[10px] font-black text-ink-soft uppercase tracking-wider">Tiếng Việt:</span>
                      <span>{{ def.viMeaning }}</span>
                    </div>
                    <span
                      v-else
                      class="text-xs font-medium text-ink-soft/60 italic block"
                    >
                      Chưa có nghĩa tiếng Việt
                    </span>
                  </div>
                </div>

                <!-- Ví dụ song ngữ -->
                <div
                  v-for="(ex, eIdx) in def.examples"
                  :key="eIdx"
                  class="p-3.5 bg-surface-2/60 rounded-brut border border-line space-y-1 text-xs sm:text-sm"
                >
                  <p class="font-bold text-ink italic font-serif sm:font-sans">
                    "{{ ex.target }}"
                  </p>
                  <p class="text-ink-soft font-medium">
                    {{ ex.vi }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Chú thích cấp độ nguồn CEFR-J và Octanove -->
          <p
            v-if="entry.level"
            class="text-[11px] text-ink-soft font-medium pt-2 border-t border-line/40 flex items-center gap-1 flex-wrap"
          >
            <span>Cấp độ A1-C2 chỉ gắn cho nghĩa phổ biến nhất của từng từ loại. Nguồn: CEFR-J và Octanove.</span>
            <NuxtLink to="/nguon-du-lieu" class="text-accent underline font-bold hover:opacity-80">
              Xem nguồn dữ liệu
            </NuxtLink>
          </p>
        </div>

        <!-- Cụm từ thường gặp (Collocations) -->
        <div
          v-if="entry.collocations && entry.collocations.length > 0"
          id="word-collocations-box"
          class="pt-4 border-t-2 border-line space-y-2"
        >
          <span class="text-xs font-black uppercase text-ink-soft tracking-wider block">
            Cụm từ thường gặp (Collocations & Phrases):
          </span>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="col in entry.collocations"
              :key="col"
              class="px-3 py-1 text-xs font-mono font-bold bg-surface-2 border-2 border-line rounded-brut shadow-brut-sm"
            >
              {{ col }}
            </span>
          </div>
        </div>

        <!-- Từ đồng nghĩa & Trái nghĩa -->
        <div class="pt-4 border-t-2 border-line grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div v-if="entry.synonyms && entry.synonyms.length > 0" class="space-y-1.5">
            <span class="text-xs font-bold uppercase text-ok">Từ đồng nghĩa (Synonyms):</span>
            <div class="flex flex-wrap gap-1.5">
              <NuxtLink
                v-for="syn in entry.synonyms"
                :key="syn"
                :to="`/tu-dien/${syn}`"
                class="px-2 py-0.5 text-xs font-mono font-bold bg-ok/10 border border-ok text-ink rounded-brut hover:bg-ok/25 cursor-pointer"
              >
                {{ syn }}
              </NuxtLink>
            </div>
          </div>

          <div v-if="entry.antonyms && entry.antonyms.length > 0" class="space-y-1.5">
            <span class="text-xs font-bold uppercase text-bad">Từ trái nghĩa (Antonyms):</span>
            <div class="flex flex-wrap gap-1.5">
              <NuxtLink
                v-for="ant in entry.antonyms"
                :key="ant"
                :to="`/tu-dien/${ant}`"
                class="px-2 py-0.5 text-xs font-mono font-bold bg-bad/10 border border-bad text-ink rounded-brut hover:bg-bad/25 cursor-pointer"
              >
                {{ ant }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
