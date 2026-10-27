<script setup lang="ts">
import {
  Search,
  BookOpen,
  History,
  Heart,
  Flame,
  Zap,
  Lock,
  CheckCircle2,
  Smile,
  Utensils,
  ShoppingBag,
  Briefcase,
  GraduationCap,
  ArrowRight,
  RotateCcw,
  Volume2,
  BookmarkPlus,
  X,
} from '@lucide/vue'
import { useLanguage } from '~/composables/useLanguage'
import { useDictionary, type DuolingoNode } from '~/composables/useDictionary'
import LanguageSelector from '~/components/common/LanguageSelector.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { BRAND_NAME } from '~/constants/brand'

useHead({
  title: `Từ điển chuyên sâu & Lộ trình học từ - ${BRAND_NAME}`,
})

const { currentLang, currentLanguageOption } = useLanguage()
const {
  searchQuery,
  searchSuggestions,
  searchHistory,
  updateSuggestions,
  clearHistory,
  duoRoadmap,
  hearts,
  streak,
  totalXp,
  completeDuoNode,
  loseHeart,
  refillHearts,
} = useDictionary(currentLang)

const guideSteps: GuideStep[] = [
  {
    title: 'Ô tra từ lớn & Gợi ý tức thì',
    description: 'Gõ từ vựng cần tra, hệ thống sẽ gợi ý ngay các từ khớp và điều hướng sang trang định nghĩa chuyên sâu.',
    targetId: 'dict-search-autocomplete-box',
    badge: 'Bước 1',
  },
  {
    title: 'Từ của hôm nay & Từ gợi ý có preview',
    description: 'Học ngay 1 từ vựng nổi bật trong ngày kèm ví dụ thực tế và các từ gợi ý có định nghĩa sẵn.',
    targetId: 'word-of-the-day-card',
    badge: 'Bước 2',
  },
  {
    title: 'Lộ trình học theo chặng trực quan',
    description: 'Chuyển sang tab Lộ trình để trải nghiệm các chặng học từ vựng dạng bản đồ uốn lượn có tim và streak.',
    targetId: 'dict-main-tabs',
    badge: 'Bước 3',
  },
]

// Tab chính
const activeTab = ref<'search' | 'roadmap'>('search')

// Autocomplete khi gõ
const onSearchInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  searchQuery.value = target.value
  updateSuggestions(target.value)
}

const goToWord = (word: string) => {
  if (!word.trim()) return
  navigateTo(`/tu-dien/${encodeURIComponent(word.trim().toLowerCase())}`)
}

// Từ của hôm nay
const wordOfTheDay = computed(() => {
  if (currentLang.value === 'zh') {
    return {
      term: '融洽',
      pinyin: 'róng qià',
      pos: 'tính từ',
      shortMeaning: 'Hài hoà, êm ấm, quan hệ khăng khít không có bất đồng.',
      example: '同事之间的关系非常融洽。',
      exampleVi: 'Mối quan hệ giữa các đồng nghiệp vô cùng hài hoà.',
    }
  } else if (currentLang.value === 'ja') {
    return {
      term: '妥協',
      pinyin: 'だきょう (dakyō)',
      pos: 'danh từ / suru',
      shortMeaning: 'Thỏa hiệp, nhượng bộ lẫn nhau để đạt được đồng thuận.',
      example: '双方が歩み寄り、妥協点を見出した。',
      exampleVi: 'Hai bên cùng nhượng bộ và tìm ra điểm thoả hiệp.',
    }
  }
  return {
    term: 'pragmatic',
    pinyin: '/præɡˈmæt.ɪk/',
    pos: 'adjective',
    shortMeaning: 'Thực tế, thực dụng, giải quyết vấn đề dựa trên hiệu quả thực tiễn thay vì lý thuyết suông.',
    example: 'We need to adopt a pragmatic approach to solve this engineering bottleneck.',
    exampleVi: 'Chúng ta cần áp dụng cách tiếp cận thực tế để giải quyết nút thắt kỹ thuật này.',
  }
})

// Web Speech API
const speakWord = (text: string) => {
  if (!import.meta.client || !window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(text)
  if (currentLang.value === 'en') utterance.lang = 'en-US'
  else if (currentLang.value === 'zh') utterance.lang = 'zh-CN'
  else if (currentLang.value === 'ja') utterance.lang = 'ja-JP'
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}

// Danh sách từ gợi ý có sẵn kèm nghĩa preview
const sampleWordsWithMeaning = computed(() => {
  if (currentLang.value === 'zh') {
    return [
      { word: '融洽', pos: 'tính từ', meaning: 'Hài hoà, êm ấm, không xích mích' },
      { word: '坚韧', pos: 'tính từ', meaning: 'Kiên cường, bền bỉ trước khó khăn' },
      { word: '无所不在', pos: 'thành ngữ', meaning: 'Có mặt ở khắp mọi nơi' },
      { word: '缓解', pos: 'động từ', meaning: 'Làm dịu bớt, giảm nhẹ căng thẳng' },
    ]
  } else if (currentLang.value === 'ja') {
    return [
      { word: '妥協', pos: 'danh từ', meaning: 'Thỏa hiệp, nhượng bộ đôi bên' },
      { word: '回復力', pos: 'danh từ', meaning: 'Khả năng phục hồi, kiên cường' },
      { word: '偏在', pos: 'danh từ', meaning: 'Có mặt ở mọi lúc mọi nơi' },
      { word: '緩和', pos: 'động từ', meaning: 'Xoa dịu, giảm thiểu xung đột' },
    ]
  }
  return [
    { word: 'pragmatic', pos: 'adj', meaning: 'Thực tế, chú trọng hiệu quả thực tiễn' },
    { word: 'resilient', pos: 'adj', meaning: 'Kiên cường, mau hồi phục sau nghịch cảnh' },
    { word: 'ubiquitous', pos: 'adj', meaning: 'Phổ biến, xuất hiện ở khắp mọi nơi' },
    { word: 'mitigate', pos: 'verb', meaning: 'Giảm nhẹ, xoa dịu hậu quả tiêu cực' },
  ]
})

// Duolingo Quiz Modal
const activeLessonNode = ref<DuolingoNode | null>(null)
const currentQuestionIdx = ref(0)
const selectedOptionIdx = ref<number | null>(null)
const isAnswerChecked = ref(false)
const isAnswerCorrect = ref(false)
const lessonCompleted = ref(false)

const openLesson = (node: DuolingoNode) => {
  if (node.status === 'locked') return
  if (hearts.value <= 0) {
    alert('Bạn đã hết tim! Hãy nạp lại tim để tiếp tục hành trình.')
    return
  }
  activeLessonNode.value = node
  currentQuestionIdx.value = 0
  selectedOptionIdx.value = null
  isAnswerChecked.value = false
  isAnswerCorrect.value = false
  lessonCompleted.value = false
}

const checkAnswer = () => {
  if (selectedOptionIdx.value === null || !activeLessonNode.value) return
  const q = activeLessonNode.value.quiz[currentQuestionIdx.value]
  if (!q) return

  isAnswerChecked.value = true
  if (selectedOptionIdx.value === q.correctIndex) {
    isAnswerCorrect.value = true
  } else {
    isAnswerCorrect.value = false
    loseHeart()
  }
}

const nextQuestion = () => {
  if (!activeLessonNode.value) return
  if (currentQuestionIdx.value < activeLessonNode.value.quiz.length - 1) {
    currentQuestionIdx.value += 1
    selectedOptionIdx.value = null
    isAnswerChecked.value = false
    isAnswerCorrect.value = false
  } else {
    completeDuoNode(activeLessonNode.value.id)
    lessonCompleted.value = true
  }
}

const getNodeIcon = (iconName: string) => {
  switch (iconName) {
    case 'Smile': return Smile
    case 'Utensils': return Utensils
    case 'ShoppingBag': return ShoppingBag
    case 'Briefcase': return Briefcase
    case 'GraduationCap': return GraduationCap
    default: return BookOpen
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8" data-feature="tu-dien">
    <FirstVisitGuide page-key="tu_dien_index_guide" :steps="guideSteps" />

    <!-- Top Bar with Language Selector & Duolingo Status -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <LanguageSelector />
      </div>

      <!-- DẢI NHỎ GỌN: TIM, STREAK, XP -->
      <div class="flex items-center gap-3 font-mono text-xs font-black">
        <div class="flex items-center gap-1.5 px-3 py-1 bg-surface rounded-brut border-2 border-line shadow-brut-sm text-bad">
          <Heart class="w-4 h-4 fill-bad text-bad" />
          <span>{{ hearts }}/5</span>
        </div>
        <div class="flex items-center gap-1.5 px-3 py-1 bg-surface rounded-brut border-2 border-line shadow-brut-sm text-warn">
          <Flame class="w-4 h-4 fill-warn text-warn" />
          <span>{{ streak }} ngày</span>
        </div>
        <div class="flex items-center gap-1.5 px-3 py-1 bg-surface rounded-brut border-2 border-line shadow-brut-sm text-ok">
          <Zap class="w-4 h-4 text-ok fill-ok" />
          <span>{{ totalXp }} XP</span>
        </div>
      </div>
    </div>

    <!-- BANNER MÀU VIOLET: Ô TRA TỪ RẤT LỚN Ở GIỮA (NỔI BẬT HƠN CẢ TIÊU ĐỀ) -->
    <div class="rounded-brut-lg border-[3px] border-line bg-c-violet p-6 sm:p-10 shadow-brut text-ink space-y-6">
      <div class="text-center space-y-1">
        <span class="rounded-brut border-2 border-line bg-surface px-3 py-1 text-xs font-black uppercase tracking-wider text-ink shadow-brut-sm">
          Từ điển học thuật chuyên sâu
        </span>
        <h1 class="text-2xl sm:text-4xl font-black tracking-tight text-ink font-display">
          Tra cứu nghĩa chuẩn xác & ngữ cảnh bản xứ
        </h1>
      </div>

      <!-- Ô TRA TỪ SIÊU LỚN NẰM CHÍNH GIỮA BANNER -->
      <div id="dict-search-autocomplete-box" class="max-w-2xl mx-auto relative">
        <form class="flex items-center gap-2" @submit.prevent="goToWord(searchQuery)">
          <div class="relative flex-1">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-ink-soft stroke-[2.5]" />
            <input
              type="text"
              :value="searchQuery"
              placeholder="Gõ từ cần tra (ví dụ: pragmatic, resilient, ubiquitous, 融洽)..."
              class="w-full pl-14 pr-12 py-4 sm:py-5 text-lg sm:text-xl font-black rounded-brut border-[3px] border-line bg-surface text-ink shadow-brut focus:border-focus outline-none"
              @input="onSearchInput"
            >
            <button
              v-if="searchQuery"
              type="button"
              class="absolute right-4 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-1 text-ink-soft hover:text-ink cursor-pointer"
              aria-label="Xóa từ khóa tìm kiếm"
              @click="searchQuery = ''; searchSuggestions = []"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <BaseButton type="submit" variant="primary" size="lg" class="shadow-brut">
            <span>Tra cứu</span>
          </BaseButton>
        </form>

        <!-- Dropdown Gợi ý khi gõ (Autocomplete) -->
        <div
          v-if="searchSuggestions.length > 0"
          class="absolute left-0 right-0 top-full mt-2 z-50 bg-surface rounded-brut-lg border-[3px] border-line shadow-brut-lg overflow-hidden text-ink animate-in fade-in zoom-in-95 duration-100"
        >
          <div class="p-2.5 border-b-2 border-line bg-surface-2 text-xs font-black uppercase text-ink-soft">
            Gợi ý từ vựng liên quan:
          </div>
          <div class="divide-y-2 divide-line/20">
            <button
              v-for="word in searchSuggestions"
              :key="word"
              type="button"
              class="w-full text-left px-4 py-3 hover:bg-warn/25 font-black text-base text-ink transition-colors flex items-center justify-between cursor-pointer"
              @click="goToWord(word)"
            >
              <span class="font-display">{{ word }}</span>
              <ArrowRight class="w-4 h-4 text-ink-soft" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 1: MAIN TABS (TRA TỪ vs LỘ TRÌNH DUOLINGO) -->
    <div id="dict-main-tabs" class="flex items-center gap-2 border-b-2 border-line pb-2">
      <button
        type="button"
        class="px-5 py-2.5 min-h-[44px] rounded-brut border-2 font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
        :class="[
          activeTab === 'search'
            ? 'bg-warn text-on-tone border-line shadow-brut-sm'
            : 'bg-surface hover:bg-surface-2 text-ink border-transparent hover:border-line',
        ]"
        @click="activeTab = 'search'"
      >
        <Search class="w-4 h-4 stroke-[2.5]" />
        <span>Tra cứu từ điển</span>
      </button>

      <button
        type="button"
        class="px-5 py-2.5 min-h-[44px] rounded-brut border-2 font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
        :class="[
          activeTab === 'roadmap'
            ? 'bg-warn text-on-tone border-line shadow-brut-sm'
            : 'bg-surface hover:bg-surface-2 text-ink border-transparent hover:border-line',
        ]"
        @click="activeTab = 'roadmap'"
      >
        <Zap class="w-4 h-4 stroke-[2.5]" />
        <span>Lộ trình học theo chặng</span>
      </button>
    </div>

    <!-- TAB 1: TRA CỨU TỪ ĐIỂN -->
    <div v-if="activeTab === 'search'" class="space-y-6">
      <!-- "TỪ CỦA HÔM NAY" DẠNG THẺ LỚN (TỪ, PHIÊN ÂM, NGHĨA NGẮN, NÚT NGHE, NÚT LƯU) -->
      <div
        id="word-of-the-day-card"
        class="rounded-brut-lg border-[3px] border-line bg-c-violet-soft p-6 sm:p-7 shadow-brut flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="rounded-brut border-2 border-line bg-c-violet text-ink px-2.5 py-0.5 text-xs font-black uppercase shadow-brut-sm">
              Từ của hôm nay
            </span>
            <span class="rounded border border-line bg-surface px-2 py-0.5 text-xs font-bold text-ink">
              {{ wordOfTheDay.pos }}
            </span>
          </div>

          <div class="flex items-baseline gap-3">
            <h2 class="text-3xl sm:text-4xl font-black text-ink font-display">
              {{ wordOfTheDay.term }}
            </h2>
            <span class="text-sm sm:text-base font-mono text-c-violet-ink font-bold">
              {{ wordOfTheDay.pinyin }}
            </span>
          </div>

          <p class="text-base font-black text-ink">
            {{ wordOfTheDay.shortMeaning }}
          </p>

          <p class="text-xs sm:text-sm text-ink-soft italic pt-1">
            "{{ wordOfTheDay.example }}" &rarr; {{ wordOfTheDay.exampleVi }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 flex-shrink-0">
          <button
            type="button"
            class="px-4 py-2.5 min-h-[44px] rounded-brut border-2 border-line bg-surface hover:bg-surface-2 text-ink font-black text-xs shadow-brut-sm cursor-pointer flex items-center gap-1.5"
            aria-label="Nghe phát âm từ của hôm nay"
            @click="speakWord(wordOfTheDay.term)"
          >
            <Volume2 class="w-4 h-4 text-c-violet stroke-[2.5]" />
            <span>Nghe phát âm</span>
          </button>

          <BaseButton
            variant="primary"
            size="md"
            @click="goToWord(wordOfTheDay.term)"
          >
            <span>Xem chi tiết từ này</span>
            <ArrowRight class="w-4 h-4 ml-1" />
          </BaseButton>
        </div>
      </div>

      <!-- TỪ GỢI Ý (MỖI THẺ HIỆN NGHĨA ĐẦU TIÊN LÀM PREVIEW) & LỊCH SỬ TRA CỨU -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Lưới từ gợi ý có preview định nghĩa -->
        <BaseCard tone="surface">
          <template #header>
            <div class="flex items-center gap-2 font-black text-sm">
              <BookOpen class="w-4 h-4 text-warn" />
              <span>Từ vựng mẫu có sẵn (Kèm định nghĩa preview)</span>
            </div>
          </template>

          <div class="space-y-2.5">
            <div
              v-for="item in sampleWordsWithMeaning"
              :key="item.word"
              class="p-3.5 rounded-brut border-2 border-line bg-surface hover:bg-surface-2 transition-all flex flex-col justify-between cursor-pointer gap-1 group shadow-[2px_2px_0_var(--line)]"
              @click="goToWord(item.word)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-black text-base text-ink font-display group-hover:text-c-violet">{{ item.word }}</span>
                  <span class="rounded border border-line bg-surface-2 px-1.5 py-0.2 text-[10px] font-bold text-ink-soft">{{ item.pos }}</span>
                </div>
                <span class="text-xs text-c-violet font-black underline">&rarr; Chi tiết</span>
              </div>
              <p class="text-xs text-ink-soft font-medium line-clamp-1">
                {{ item.meaning }}
              </p>
            </div>
          </div>
        </BaseCard>

        <!-- Lịch sử tra cứu gần đây -->
        <BaseCard tone="surface">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-black text-sm">
                <History class="w-4 h-4 text-ink-soft" />
                <span>Lịch sử tra cứu gần đây</span>
              </div>
              <button
                v-if="searchHistory.length > 0"
                type="button"
                class="text-xs font-bold text-bad hover:underline cursor-pointer"
                @click="clearHistory"
              >
                Xóa hết
              </button>
            </div>
          </template>

          <div v-if="searchHistory.length === 0" class="py-8 text-center text-xs text-ink-soft">
            Chưa có từ nào trong lịch sử tra cứu của bạn.
          </div>

          <div v-else class="flex flex-wrap gap-2">
            <button
              v-for="term in searchHistory"
              :key="term"
              type="button"
              class="px-3 py-1.5 rounded-brut border-2 border-line bg-surface-2 hover:bg-surface font-mono font-bold text-xs text-ink shadow-brut-sm cursor-pointer"
              @click="goToWord(term)"
            >
              {{ term }}
            </button>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- TAB 2: LỘ TRÌNH HỌC TỪ VỰNG DẠNG BẢN ĐỒ NHIỀU NÚT MÀU -->
    <div v-else id="vocab-roadmap-section" class="space-y-6">
      <BaseCard tone="surface">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Zap class="w-5 h-5 text-warn" />
              <span class="font-black text-base">Đường đi các chặng từ vựng</span>
            </div>

            <button
              v-if="hearts < 5"
              type="button"
              class="px-3 py-1.5 min-h-[44px] text-xs font-black rounded-brut border border-line bg-bad/15 text-bad hover:bg-bad hover:text-white cursor-pointer inline-flex items-center"
              @click="refillHearts"
            >
              Nạp đầy lại 5 tim ❤️
            </button>
          </div>
        </template>

        <p class="text-xs text-ink-soft font-medium mb-8">
          Vượt qua các câu hỏi trắc nghiệm của từng chặng để mở khoá chặng tiếp theo và tích luỹ điểm XP:
        </p>

        <!-- Bản đồ nối nút Duolingo uốn lượn nhiều màu sắc -->
        <div class="relative max-w-md mx-auto py-4 space-y-10">
          <div
            v-for="(node, nIdx) in duoRoadmap"
            :key="node.id"
            class="flex items-center justify-center relative"
            :class="{
              '-translate-x-12': nIdx % 2 === 1,
              'translate-x-12': nIdx % 2 === 0 && nIdx > 0,
            }"
          >
            <!-- Đường kẻ nối nút trước -->
            <div
              v-if="nIdx > 0"
              class="absolute -top-10 w-2 h-10 bg-line -z-10"
            />

            <!-- Nút tròn Duolingo đa sắc phẳng -->
            <button
              type="button"
              class="w-20 h-20 rounded-full border-[3px] border-line flex flex-col items-center justify-center shadow-brut transition-all duration-200 cursor-pointer group"
              :class="[
                node.status === 'completed'
                  ? 'bg-c-green text-on-tone hover:-translate-y-1'
                  : node.status === 'active'
                    ? 'bg-c-violet text-ink hover:-translate-y-1 ring-4 ring-c-violet/30 animate-pulse'
                    : 'bg-surface-2 text-ink-soft/40 cursor-not-allowed',
              ]"
              @click="openLesson(node)"
            >
              <CheckCircle2 v-if="node.status === 'completed'" class="w-8 h-8 stroke-[3]" />
              <component :is="getNodeIcon(node.icon)" v-else-if="node.status === 'active'" class="w-7 h-7 stroke-[2.5]" />
              <Lock v-else class="w-6 h-6 opacity-40" />

              <span class="text-[9px] font-black font-mono mt-0.5 uppercase">
                {{ node.level }}
              </span>
            </button>

            <!-- Tiêu đề chặng bên cạnh -->
            <div
              class="absolute left-full ml-4 w-40 text-left pointer-events-none"
              :class="{
                '!left-auto !right-full !mr-4 !text-right': nIdx % 2 === 1,
              }"
            >
              <p class="font-black text-xs text-ink leading-tight">{{ node.title }}</p>
              <p class="text-[10px] text-ink-soft font-mono mt-0.5">{{ node.topic }}</p>
              <span class="text-[10px] font-black text-ok">+{{ node.xpReward }} XP</span>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- MODAL LÀM BÀI HỌC DUOLINGO -->
    <BaseModal
      :model-value="!!activeLessonNode"
      :title="activeLessonNode ? `${activeLessonNode.level} • ${activeLessonNode.title}` : ''"
      max-width="md"
      @close="activeLessonNode = null"
      @update:model-value="(val) => { if (!val) activeLessonNode = null }"
    >
      <div v-if="activeLessonNode">
        <div v-if="lessonCompleted" class="py-6 text-center space-y-4">
          <div class="w-16 h-16 mx-auto rounded-full border-[3px] border-line bg-ok text-on-tone flex items-center justify-center shadow-brut">
            <CheckCircle2 class="w-8 h-8 stroke-[3]" />
          </div>
          <h4 class="text-2xl font-black text-ink font-display">Hoàn thành chặng học!</h4>
          <p class="text-xs text-ink-soft font-bold">Bạn nhận được +{{ activeLessonNode.xpReward }} XP vào tài khoản.</p>
          <BaseButton variant="primary" size="md" block @click="activeLessonNode = null">
            Tiếp tục chặng tiếp
          </BaseButton>
        </div>

        <div v-else-if="activeLessonNode.quiz[currentQuestionIdx]" class="space-y-4">
          <div class="p-4 bg-surface-2 rounded-brut border-2 border-line">
            <span class="text-[10px] font-black uppercase text-ink-soft block mb-1">
              Câu {{ currentQuestionIdx + 1 }} / {{ activeLessonNode.quiz.length }}
            </span>
            <p class="text-base font-black text-ink">
              {{ activeLessonNode.quiz[currentQuestionIdx].prompt }}
            </p>
          </div>

          <div class="space-y-2">
            <button
              v-for="(opt, oIdx) in activeLessonNode.quiz[currentQuestionIdx].options"
              :key="oIdx"
              type="button"
              class="w-full text-left p-3 min-h-[44px] flex items-center rounded-brut border-2 font-bold text-xs transition-all cursor-pointer"
              :class="[
                selectedOptionIdx === oIdx
                  ? 'border-line bg-warn text-on-tone font-black shadow-brut-sm'
                  : 'border-line/40 bg-surface hover:bg-surface-2 text-ink',
              ]"
              @click="selectedOptionIdx = oIdx"
            >
              {{ opt }}
            </button>
          </div>

          <div class="pt-2">
            <BaseButton
              v-if="!isAnswerChecked"
              variant="primary"
              size="md"
              block
              :disabled="selectedOptionIdx === null"
              @click="checkAnswer"
            >
              Kiểm tra đáp án
            </BaseButton>

            <div v-else class="space-y-3">
              <div
                class="p-3 rounded-brut border-2 text-xs font-bold"
                :class="isAnswerCorrect ? 'border-ok bg-ok/20 text-ok' : 'border-bad bg-bad/20 text-bad'"
              >
                {{ isAnswerCorrect ? 'Chính xác! Làm rất tốt.' : 'Sai rồi! Hãy xem lại giải thích.' }}
              </div>
              <BaseButton variant="primary" size="md" block @click="nextQuestion">
                Tiếp tục
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
