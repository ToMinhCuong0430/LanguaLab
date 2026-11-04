<script setup lang="ts">
import {
  Volume2,
  Plus,
  Trash2,
  Edit3,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  FolderPlus,
  Layers,
  ArrowRight,
  ArrowLeft,
  X,
  FileQuestion,
} from '@lucide/vue'
import { useLanguage } from '~/composables/useLanguage'
import { useVocab, type VocabWord, type VocabSet } from '~/composables/useVocab'
import LanguageSelector from '~/components/common/LanguageSelector.vue'
import PageBanner from '~/components/common/PageBanner.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { levelBadge } from '~/constants/badges'
import { BRAND_NAME } from '~/constants/brand'

useHead({
  title: `Từ vựng và phát âm chuyên sâu - ${BRAND_NAME}`,
})

const { currentLang, currentLanguageOption } = useLanguage()
const {
  activeTab,
  curatedSets,
  mySets,
  selectedSetId,
  activeSet,
  isLoading,
  errorMessage,
  fetchVocabData,
  createMySet,
  updateMySet,
  deleteMySet,
  addWordToMySet,
} = useVocab(currentLang)

const guideSteps: GuideStep[] = [
  {
    title: 'Bộ đề xuất & Bộ của tôi',
    description: 'Chuyển đổi giữa các bộ từ tuyển chọn theo cấp độ (A1 - C1, HSK, JLPT) hoặc tự tạo bộ từ vựng cá nhân hoá của riêng bạn.',
    targetId: 'vocab-main-tabs',
    badge: 'Bước 1',
  },
  {
    title: 'Chế độ Flashcard & Ôn tập SRS',
    description: 'Mở phiên Flashcard hoặc Ôn tập SRS (lật thẻ, chấm mức nhớ, luyện phát âm) hoặc làm trắc nghiệm nhanh 4 lựa chọn ngay tại đây.',
    targetId: 'vocab-mode-selector',
    badge: 'Bước 2',
  },
  {
    title: 'Quản lý & Thêm từ thủ công',
    description: 'Trong tab "Bộ của tôi", bạn có thể dễ dàng thêm từ mới, chỉnh sửa hoặc xuất nhập dữ liệu theo nhu cầu học.',
    targetId: 'custom-set-actions',
    badge: 'Bước 4',
  },
]

// Chế độ học bộ từ: 'flashcard' | 'srs' | 'quiz'
const studyMode = ref<'flashcard' | 'srs' | 'quiz'>('flashcard')

// Index từ đang hiển thị trong bộ
const currentWordIndex = ref(0)
const isCardFlipped = ref(false)

const currentWord = computed<VocabWord | undefined>(() => {
  return activeSet.value?.words[currentWordIndex.value] || activeSet.value?.words[0]
})

const nextWord = () => {
  isCardFlipped.value = false
  if (currentWordIndex.value < (activeSet.value?.words.length || 1) - 1) {
    currentWordIndex.value += 1
  } else {
    currentWordIndex.value = 0
  }
}

// ==========================================
// QUIZ TRẮC NGHIỆM NHANH (4 đáp án)
// ==========================================
const quizSelectedOption = ref<number | null>(null)
const isQuizSubmitted = ref(false)

const quizOptions = computed(() => {
  if (!activeSet.value || !currentWord.value) return []
  const correctMeaning = currentWord.value.meaning
  const otherWords = activeSet.value.words.filter(w => w.id !== currentWord.value?.id)
  
  // Trộn 3 đáp án sai
  const distractors = otherWords
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .map(w => w.meaning)

  const all = [correctMeaning, ...distractors].sort(() => 0.5 - Math.random())
  return all
})

const submitQuizAnswer = (optIdx: number) => {
  if (isQuizSubmitted.value) return
  quizSelectedOption.value = optIdx
  isQuizSubmitted.value = true
}

const nextQuizQuestion = () => {
  quizSelectedOption.value = null
  isQuizSubmitted.value = false
  nextWord()
}

// ==========================================
// MODAL QUẢN LÝ BỘ CỦA TÔI & THÊM TỪ
// ==========================================
const isCreateSetModalOpen = ref(false)
const newSetTitle = ref('')
const newSetDesc = ref('')
const newSetLevel = ref('B1')

const handleCreateSet = () => {
  if (!newSetTitle.value.trim()) return
  const created = createMySet(newSetTitle.value.trim(), newSetDesc.value.trim(), newSetLevel.value)
  selectedSetId.value = created.id
  newSetTitle.value = ''
  newSetDesc.value = ''
  isCreateSetModalOpen.value = false
}

const isAddWordModalOpen = ref(false)
const newWordTerm = ref('')
const newWordPhonetic = ref('')
const newWordPartOfSpeech = ref('noun')
const newWordMeaning = ref('')
const newWordExample = ref('')
const newWordExampleMeaning = ref('')

const handleAddWord = () => {
  if (!newWordTerm.value.trim() || !newWordMeaning.value.trim()) return
  addWordToMySet(activeSet.value.id, {
    term: newWordTerm.value.trim(),
    phonetic: newWordPhonetic.value.trim() || `/${newWordTerm.value.trim()}/`,
    partOfSpeech: newWordPartOfSpeech.value,
    meaning: newWordMeaning.value.trim(),
    exampleTarget: newWordExample.value.trim() || 'This is an example sentence.',
    exampleMeaning: newWordExampleMeaning.value.trim() || 'Đây là câu ví dụ minh hoạ.',
  })

  newWordTerm.value = ''
  newWordPhonetic.value = ''
  newWordMeaning.value = ''
  newWordExample.value = ''
  newWordExampleMeaning.value = ''
  isAddWordModalOpen.value = false
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8" data-feature="tu-vung">
    <FirstVisitGuide page-key="tu_vung_guide" :steps="guideSteps" />

    <!-- Top Bar with Language Selector -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <LanguageSelector />
      </div>

      <div class="flex items-center gap-2 text-xs font-bold text-ink-soft">
        <span class="px-2 py-1 bg-surface-2 border border-line rounded-brut">Bộ đề xuất & Bộ của tôi</span>
        <span class="px-2 py-1 bg-surface-2 border border-line rounded-brut">Ghi âm so sánh bằng tai</span>
      </div>
    </div>

    <!-- Page Banner -->
    <PageBanner
      feature="tu-vung"
      title="Từ vựng & Luyện phát âm đối chiếu"
      description="Ghi nhớ từ vựng qua thẻ Flashcard lặp lại ngắt quãng (SRS) và luyện chuẩn âm ngữ điệu bằng cách ghi âm tự so sánh với mẫu bản xứ."
      badge-text="SRS & Âm vị"
      badge-tone="mark"
    >
      <template #icon>
        <Volume2 class="h-6 w-6 text-on-tone" :stroke-width="2.5" />
      </template>

      <template #actions>
        <div class="flex items-center gap-2">
          <BaseBadge tone="accent" size="sm">
            {{ currentLanguageOption.name }} • {{ curatedSets.length + mySets.length }} bộ từ
          </BaseBadge>
          <BaseBadge tone="ok" size="sm">
            Đang học: {{ activeSet?.words.length || 0 }} từ
          </BaseBadge>
        </div>
      </template>
    </PageBanner>

    <!-- Error State with Retry -->
    <div v-if="errorMessage" class="p-4 bg-warn-soft border-2 border-line rounded-brut shadow-brut flex items-center justify-between">
      <span class="text-xs font-bold text-ink">{{ errorMessage }}</span>
      <BaseButton tone="warn" size="sm" @click="fetchVocabData">Thử lại</BaseButton>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="p-6 bg-surface border-2 border-line rounded-brut shadow-brut space-y-4">
      <BaseSkeleton class="h-6 w-1/4 rounded-brut" />
      <BaseSkeleton class="h-20 w-full rounded-brut" />
    </div>

    <!-- SECTION 1: TAB SELECTOR (BỘ ĐỀ XUẤT vs BỘ CỦA TÔI) -->
    <div id="vocab-main-tabs" class="space-y-4">
      <BaseTabs
        :model-value="activeTab"
        :items="[
          { id: 'curated', label: `Bộ đề xuất (${curatedSets.length} bộ)`, icon: Layers },
          { id: 'my_sets', label: `Bộ của tôi (${mySets.length} bộ)`, icon: FolderPlus },
        ]"
        tone="warning"
        size="md"
        @change="(id) => { activeTab = id as any; selectedSetId = id === 'curated' ? (curatedSets[0]?.id || '') : (mySets[0]?.id || '') }"
      />

      <!-- Danh sách bộ từ (Bộ đề xuất) - Thẻ to, có preview 3 từ đầu, vòng tiến độ -->
      <div v-if="activeTab === 'curated'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="set in curatedSets"
          :key="set.id"
          class="p-5 rounded-brut-lg border-[3px] transition-all cursor-pointer flex flex-col justify-between shadow-brut hover:-translate-y-1 hover:shadow-brut-lg"
          :class="[
            set.id === activeSet?.id
              ? 'border-line bg-c-pink-soft text-ink font-black ring-2 ring-c-pink'
              : 'border-line bg-surface hover:bg-surface-2 text-ink',
          ]"
          @click="selectedSetId = set.id; currentWordIndex = 0; isCardFlipped = false"
        >
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="rounded-brut border-2 border-line bg-warn px-2.5 py-0.5 text-xs font-black text-on-tone">
                {{ set.level }}
              </span>

              <!-- Mini Progress Circle -->
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold text-ink-soft">{{ set.words.length }} từ</span>
                <span class="px-2 py-0.5 rounded-brut border border-line bg-surface text-[10px] font-black text-c-pink-ink">
                  Đến hạn: {{ Math.min(6, set.words.length) }}
                </span>
              </div>
            </div>

            <div>
              <h3 class="font-black text-lg text-ink font-display line-clamp-1">
                {{ set.title }}
              </h3>
              <p class="text-xs text-ink-soft line-clamp-2 mt-0.5 font-medium leading-relaxed">
                {{ set.description }}
              </p>
            </div>

            <!-- PREVIEW: 3 TỪ ĐẦU HIỂN THỊ DẠNG CHIP -->
            <div class="rounded-brut border-2 border-line bg-surface p-2.5 space-y-1.5">
              <span class="text-[10px] font-black uppercase text-ink-soft tracking-wider block">
                Từ mẫu xem trước:
              </span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="w in set.words.slice(0, 3)"
                  :key="w.id"
                  class="px-2 py-0.5 rounded-brut border border-line bg-c-pink-soft text-c-pink-ink font-mono text-xs font-bold"
                >
                  {{ w.term }}
                </span>
                <span v-if="set.words.length > 3" class="text-[10px] text-ink-soft self-center font-bold">
                  +{{ set.words.length - 3 }} từ
                </span>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t-2 border-line/40 flex items-center justify-between text-xs font-bold text-ink-soft">
            <span class="text-ok font-black">Chuẩn Oxford / CEFR</span>
            <span class="text-c-pink-ink font-black underline">
              {{ set.id === activeSet?.id ? 'Đang chọn học ★' : 'Bấm để học' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Danh sách bộ từ (Bộ của tôi) -->
      <div v-else class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-ink-soft">
            Tự do thêm từ vựng gặp trong bài đọc, video hoặc công việc vào bộ từ riêng.
          </p>

          <button
            id="custom-set-actions"
            type="button"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-brut border-2 border-line bg-warn hover:bg-warn/90 text-on-tone font-black text-xs shadow-brut-sm cursor-pointer"
            @click="isCreateSetModalOpen = true"
          >
            <Plus class="w-4 h-4 stroke-[3]" />
            <span>Tạo bộ từ mới</span>
          </button>
        </div>

        <BaseEmptyState
          v-if="mySets.length === 0"
          title="Bạn chưa có bộ từ nào"
          description="Bấm nút 'Tạo bộ từ mới' phía trên để bắt đầu thêm từ vựng cá nhân hoá!"
        >
          <template #action>
            <BaseButton variant="primary" size="sm" @click="isCreateSetModalOpen = true">
              <Plus class="w-4 h-4 mr-1" />
              <span>Tạo bộ từ mới</span>
            </BaseButton>
          </template>
        </BaseEmptyState>

        <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            v-for="set in mySets"
            :key="set.id"
            class="p-4 rounded-brut border-2 transition-all cursor-pointer flex flex-col justify-between"
            :class="[
              set.id === activeSet?.id
                ? 'border-line bg-warn/25 shadow-brut-sm font-black'
                : 'border-line bg-surface hover:bg-surface-2 text-ink',
            ]"
            @click="selectedSetId = set.id; currentWordIndex = 0; isCardFlipped = false"
          >
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <BaseBadge v-bind="levelBadge(set.level)" size="sm">{{ set.level }}</BaseBadge>
                <button
                  type="button"
                  class="text-bad hover:opacity-80 p-1 min-h-[44px] min-w-[44px] inline-flex items-center justify-center cursor-pointer"
                  title="Xoá bộ từ"
                  aria-label="Xoá bộ từ này"
                  @click.stop="deleteMySet(set.id)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
              <h3 class="font-black text-sm text-ink font-display line-clamp-1">
                {{ set.title }}
              </h3>
              <p class="text-xs text-ink-soft line-clamp-2">
                {{ set.description || 'Bộ từ tự tạo' }}
              </p>
            </div>

            <div class="mt-3 pt-2 border-t border-line/40 flex items-center justify-between text-[11px] font-bold text-ink-soft">
              <span>{{ set.words.length }} từ vựng</span>
              <span class="text-accent underline">Chọn học</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 2: KHU VỰC HỌC TẬP BỘ TỪ ĐANG CHỌN -->
    <div class="space-y-6">
      <!-- Bộ từ Header Bar & Chế độ học -->
      <div
        id="vocab-mode-selector"
        class="p-4 bg-surface rounded-brut border-2 border-line shadow-brut-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <BaseBadge v-if="activeSet?.level" v-bind="levelBadge(activeSet.level)" size="sm">{{ activeSet?.level }}</BaseBadge>
            <h2 class="text-base sm:text-lg font-black text-ink font-display">
              {{ activeSet?.title }}
            </h2>
          </div>
          <p class="text-xs text-ink-soft font-medium">
            Từ {{ currentWordIndex + 1 }} / {{ activeSet?.words.length || 0 }} • {{ activeSet?.description }}
          </p>
        </div>

        <!-- 3 Chế độ học: Flashcard / Ôn tập SRS / Trắc nghiệm -->
        <div class="flex items-center gap-1.5 p-1 bg-surface-2 border border-line rounded-brut">
          <button
            type="button"
            class="px-3.5 py-2 min-h-[44px] text-xs font-bold rounded-brut transition-all cursor-pointer flex items-center justify-center"
            :class="studyMode === 'flashcard' ? 'bg-warn text-on-tone border border-line font-black shadow-brut-sm' : 'text-ink hover:text-black'"
            @click="studyMode = 'flashcard'"
          >
            Flashcard
          </button>
          <button
            type="button"
            class="px-3.5 py-2 min-h-[44px] text-xs font-bold rounded-brut transition-all cursor-pointer flex items-center justify-center"
            :class="studyMode === 'srs' ? 'bg-warn text-on-tone border border-line font-black shadow-brut-sm' : 'text-ink hover:text-black'"
            @click="studyMode = 'srs'"
          >
            Ôn tập SRS
          </button>
          <button
            type="button"
            class="px-3.5 py-2 min-h-[44px] text-xs font-bold rounded-brut transition-all cursor-pointer flex items-center justify-center"
            :class="studyMode === 'quiz' ? 'bg-warn text-on-tone border border-line font-black shadow-brut-sm' : 'text-ink hover:text-black'"
            @click="studyMode = 'quiz'"
          >
            Trắc nghiệm nhanh
          </button>
        </div>
      </div>

      <!-- Khung Thẻ chính nếu không có từ nào -->
      <div v-if="!currentWord" class="p-8 text-center bg-surface rounded-brut border-2 border-line space-y-3">
        <p class="font-bold text-ink">Bộ từ này hiện chưa có từ vựng nào.</p>
        <BaseButton v-if="activeSet?.isCustom" variant="primary" size="sm" @click="isAddWordModalOpen = true">
          Thêm từ vựng đầu tiên
        </BaseButton>
      </div>

      <!-- CHẾ ĐỘ 1 & 2: FLASHCARD VÀ SRS mở thành phiên học riêng (layout lesson, một thẻ mỗi màn) -->
      <div v-else-if="studyMode === 'flashcard' || studyMode === 'srs'" class="mx-auto max-w-2xl space-y-4">
        <BaseCard tone="surface">
          <div class="space-y-4">
            <div>
              <h3 class="font-display text-lg font-black text-ink">
                {{ studyMode === 'srs' ? 'Ôn tập SRS' : 'Flashcard' }}: {{ activeSet?.words.length }} từ
              </h3>
              <p class="text-sm text-ink-soft">
                {{ studyMode === 'srs'
                  ? 'Xem nghĩa từng thẻ rồi chọn mức độ nhớ để lên lịch ôn lại.'
                  : 'Lật từng thẻ để xem nghĩa, ví dụ và luyện phát âm.' }}
              </p>
            </div>
            <ul class="flex flex-wrap gap-1.5" aria-label="Các từ trong bộ">
              <li
                v-for="w in activeSet?.words.slice(0, 12)"
                :key="w.id"
                class="rounded-brut border border-line bg-surface-2 px-2 py-1 text-xs font-bold text-ink"
              >
                {{ w.term }}
              </li>
              <li v-if="(activeSet?.words.length || 0) > 12" class="px-1 py-1 text-xs font-bold text-ink-soft">
                và {{ (activeSet?.words.length || 0) - 12 }} từ nữa
              </li>
            </ul>
            <BaseButton
              :to="{ path: `/tu-vung/the/${activeSet.id}`, query: studyMode === 'srs' ? { mode: 'srs' } : {} }"
              variant="success"
              size="md"
              block
            >
              <span>{{ studyMode === 'srs' ? 'Bắt đầu ôn tập' : 'Bắt đầu học flashcard' }}</span>
              <template #right><ArrowRight class="h-4 w-4" :stroke-width="2.5" /></template>
            </BaseButton>
          </div>
        </BaseCard>
      </div>

      <!-- CHẾ ĐỘ 3: TRẮC NGHIỆM NHANH (QUIZ) -->
      <div v-else-if="studyMode === 'quiz'" class="max-w-2xl mx-auto space-y-4">
        <BaseCard tone="surface">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-black text-sm">
                <FileQuestion class="w-4 h-4 text-accent" />
                <span>Trắc nghiệm kiểm tra nghĩa từ vựng</span>
              </div>
              <span class="text-xs font-mono font-bold text-ink-soft">
                Câu {{ currentWordIndex + 1 }} / {{ activeSet?.words.length }}
              </span>
            </div>
          </template>

          <div class="space-y-5 py-2">
            <!-- Câu hỏi -->
            <div class="p-5 bg-surface-2 rounded-brut border-2 border-line shadow-brut-sm text-center space-y-1">
              <p class="text-xs font-bold uppercase text-ink-soft">Nghĩa của từ vựng sau là gì?</p>
              <h3 class="text-3xl font-black text-ink font-display">
                {{ currentWord.term }}
              </h3>
              <p class="text-xs font-mono text-ink-soft italic">
                {{ currentWord.phonetic }} ({{ currentWord.partOfSpeech }})
              </p>
            </div>

            <!-- 4 Đáp án -->
            <div class="space-y-2">
              <button
                v-for="(opt, oIdx) in quizOptions"
                :key="oIdx"
                type="button"
                class="w-full p-3.5 rounded-brut border-2 text-xs sm:text-sm font-bold text-left transition-all flex items-center justify-between cursor-pointer"
                :class="[
                  quizSelectedOption === oIdx
                    ? 'border-line bg-warn text-on-tone font-black shadow-brut-sm'
                    : 'border-line/40 bg-surface hover:bg-surface-2 text-ink',
                  isQuizSubmitted && opt === currentWord.meaning
                    ? '!bg-ok !border-line !text-on-tone font-black'
                    : '',
                  isQuizSubmitted && quizSelectedOption === oIdx && opt !== currentWord.meaning
                    ? '!bg-bad !border-line !text-white'
                    : '',
                ]"
                @click="submitQuizAnswer(oIdx)"
              >
                <span>{{ opt }}</span>
                <CheckCircle2
                  v-if="isQuizSubmitted && opt === currentWord.meaning"
                  class="w-4 h-4 text-on-tone flex-shrink-0 stroke-[3]"
                />
              </button>
            </div>

            <!-- Nút câu tiếp theo khi đã nộp đáp án -->
            <div v-if="isQuizSubmitted" class="flex justify-end pt-2">
              <BaseButton variant="primary" size="sm" @click="nextQuizQuestion">
                <span>Câu tiếp theo</span>
                <ArrowRight class="w-4 h-4 ml-1.5" />
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Nút thêm từ vào bộ (chỉ hiện khi là Bộ của tôi) -->
      <div v-if="activeSet?.isCustom" class="text-center pt-4">
        <BaseButton variant="secondary" size="sm" class="gap-1.5" @click="isAddWordModalOpen = true">
          <Plus class="w-4 h-4" />
          <span>Thêm từ vựng thủ công vào bộ này</span>
        </BaseButton>
      </div>
    </div>

    <!-- MODAL 1: TẠO BỘ TỪ MỚI -->
    <BaseModal
      v-model="isCreateSetModalOpen"
      title="Tạo bộ từ vựng mới"
      max-width="md"
    >
      <form class="space-y-4" @submit.prevent="handleCreateSet">
        <div class="space-y-1">
          <label class="block text-xs font-bold uppercase text-ink-soft">Tên bộ từ:</label>
          <input
            v-model="newSetTitle"
            type="text"
            required
            placeholder="Ví dụ: Từ vựng Podcast BBC Tập 1..."
            class="w-full px-3 py-2 text-sm font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
          >
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-bold uppercase text-ink-soft">Mô tả ngắn:</label>
          <input
            v-model="newSetDesc"
            type="text"
            placeholder="Bộ từ thu thập khi nghe podcast tuần này"
            class="w-full px-3 py-2 text-xs font-medium rounded-brut border-2 border-line bg-surface text-ink outline-none"
          >
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-bold uppercase text-ink-soft">Cấp độ mục tiêu:</label>
          <select
            v-model="newSetLevel"
            class="w-full px-3 py-2 text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
          >
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="C1">C1</option>
            <option value="HSK 3">HSK 3</option>
            <option value="N3">JLPT N3</option>
          </select>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t-2 border-line">
          <BaseButton type="button" variant="secondary" size="sm" @click="isCreateSetModalOpen = false">
            Huỷ
          </BaseButton>
          <BaseButton type="submit" variant="primary" size="sm">
            Tạo bộ từ
          </BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- MODAL 2: THÊM TỪ THỦ CÔNG VÀO BỘ -->
    <BaseModal
      v-model="isAddWordModalOpen"
      :title="`Thêm từ thủ công vào &quot;${activeSet?.title || ''}&quot;`"
      max-width="lg"
    >
      <form class="space-y-3" @submit.prevent="handleAddWord">
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase text-ink-soft">Từ vựng (*):</label>
            <input
              v-model="newWordTerm"
              type="text"
              required
              placeholder="Ví dụ: Paradigm"
              class="w-full px-3 py-2 text-sm font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
            >
          </div>
          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase text-ink-soft">Phiên âm:</label>
            <input
              v-model="newWordPhonetic"
              type="text"
              placeholder="/ˈpærədaɪm/"
              class="w-full px-3 py-2 text-xs font-mono font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
            >
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase text-ink-soft">Từ loại:</label>
            <select
              v-model="newWordPartOfSpeech"
              class="w-full px-3 py-2 text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
            >
              <option value="noun">Danh từ (Noun)</option>
              <option value="verb">Động từ (Verb)</option>
              <option value="adj">Tính từ (Adjective)</option>
              <option value="adv">Trạng từ (Adverb)</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="block text-xs font-bold uppercase text-ink-soft">Nghĩa tiếng Việt (*):</label>
            <input
              v-model="newWordMeaning"
              type="text"
              required
              placeholder="Mô hình, kiểu mẫu tư duy"
              class="w-full px-3 py-2 text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
            >
          </div>
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-bold uppercase text-ink-soft">Ví dụ câu bản xứ:</label>
          <input
            v-model="newWordExample"
            type="text"
            placeholder="This research represents a new paradigm in physics."
            class="w-full px-3 py-2 text-xs font-medium rounded-brut border-2 border-line bg-surface text-ink outline-none"
          >
        </div>

        <div class="space-y-1">
          <label class="block text-xs font-bold uppercase text-ink-soft">Dịch nghĩa câu ví dụ:</label>
          <input
            v-model="newWordExampleMeaning"
            type="text"
            placeholder="Nghiên cứu này đại diện cho một mô hình mới trong vật lý học."
            class="w-full px-3 py-2 text-xs font-medium rounded-brut border-2 border-line bg-surface text-ink outline-none"
          >
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t-2 border-line">
          <BaseButton type="button" variant="secondary" size="sm" @click="isAddWordModalOpen = false">
            Huỷ
          </BaseButton>
          <BaseButton type="submit" variant="primary" size="sm">
            Lưu từ vựng
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
