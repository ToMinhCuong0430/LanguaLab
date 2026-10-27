<script setup lang="ts">
import {
  BookOpen,
  Newspaper,
  Book,
  Scroll,
  Drama,
  FileText,
  Clock,
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Upload,
  Info,
} from '@lucide/vue'
import { useLanguage } from '~/composables/useLanguage'
import { useReading, type ReadingType } from '~/composables/useReading'
import LanguageSelector from '~/components/common/LanguageSelector.vue'
import PageBanner from '~/components/common/PageBanner.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { levelBadge } from '~/constants/badges'
import { BRAND_NAME } from '~/constants/brand'

useHead({
  title: `Kho Luyện đọc và Dịch song ngữ - ${BRAND_NAME}`,
})

const { currentLang, currentLanguageOption } = useLanguage()
const {
  activeTab,
  typeFilter,
  levelFilter,
  filteredMaterials,
  myCustomTexts,
  isLoading,
  errorMessage,
  fetchReadingData,
  addCustomText,
  deleteCustomText,
} = useReading(currentLang)

const guideSteps: GuideStep[] = [
  {
    title: 'Phân loại tác phẩm phong phú',
    description: 'Lọc nhanh giữa Báo chí, Sách mở, Truyện ngắn, Tiểu thuyết kinh điển và Trích đoạn kịch.',
    targetId: 'reading-type-filter-bar',
    badge: 'Bước 1',
  },
  {
    title: 'Bìa sách theo thể loại & Trích đoạn preview',
    description: 'Mỗi tác phẩm có bìa màu riêng và trích 2-3 dòng đầu tiên để xem trước trước khi vào đọc.',
    targetId: 'reading-materials-grid',
    badge: 'Bước 2',
  },
  {
    title: 'Dán văn bản riêng để đọc & tra từ',
    description: 'Bạn có thể dán bất kỳ bài báo, tài liệu học tập nào để sử dụng công cụ đọc song ngữ.',
    targetId: 'custom-paste-tab-btn',
    badge: 'Bước 3',
  },
]

// Modal dán văn bản riêng
const isCustomModalOpen = ref(false)
const inputCustomTitle = ref('')
const inputCustomAuthor = ref('')
const inputCustomContent = ref('')
const inputCustomLevel = ref('B1')
const showCopyrightInfo = ref(false)

const handleAddCustomText = () => {
  if (!inputCustomTitle.value.trim() || !inputCustomContent.value.trim()) {
    alert('Vui lòng nhập Tiêu đề và Nội dung bài đọc.')
    return
  }

  addCustomText({
    title: inputCustomTitle.value.trim(),
    viTitle: inputCustomTitle.value.trim(),
    author: inputCustomAuthor.value.trim() || 'Cá nhân sưu tầm',
    lang: currentLang.value,
    level: inputCustomLevel.value,
    content: inputCustomContent.value.trim(),
  })

  inputCustomTitle.value = ''
  inputCustomAuthor.value = ''
  inputCustomContent.value = ''
  isCustomModalOpen.value = false
  activeTab.value = 'custom_paste'
}

// Bảng màu và icon phẳng cho từng thể loại sách
const genreThemes: Record<ReadingType, { bg: string; soft: string; ink: string; icon: any; label: string }> = {
  short_story: { bg: 'var(--c-green)', soft: 'var(--c-green-soft)', ink: 'var(--c-green-ink)', icon: Scroll, label: 'Truyện ngắn' },
  novel: { bg: 'var(--c-violet)', soft: 'var(--c-violet-soft)', ink: 'var(--c-violet-ink)', icon: Book, label: 'Tiểu thuyết' },
  book: { bg: 'var(--c-blue)', soft: 'var(--c-blue-soft)', ink: 'var(--c-blue-ink)', icon: BookOpen, label: 'Sách tri thức' },
  news: { bg: 'var(--c-coral)', soft: 'var(--c-coral-soft)', ink: 'var(--c-coral-ink)', icon: Newspaper, label: 'Báo chí' },
  play: { bg: 'var(--c-pink)', soft: 'var(--c-pink-soft)', ink: 'var(--c-pink-ink)', icon: Drama, label: 'Trích kịch' },
}

const getGenreTheme = (type: ReadingType) => genreThemes[type] || genreThemes.book
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8" data-feature="doc-dich">
    <FirstVisitGuide page-key="doc_dich_index_guide" :steps="guideSteps" />

    <!-- Top Bar with Language Selector -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <LanguageSelector />
      </div>

      <div class="flex items-center gap-2 text-xs font-bold text-ink-soft">
        <span class="px-2.5 py-1 bg-surface-2 border border-line rounded-brut">Song ngữ đối chiếu 2 cột</span>
        <span class="px-2.5 py-1 bg-surface-2 border border-line rounded-brut">Tra từ một chạm</span>
      </div>
    </div>

    <!-- Page Banner (Màu orange) -->
    <PageBanner
      feature="doc-dich"
      title="Kho Luyện đọc & Dịch song ngữ"
      description="Đọc hiểu văn học kinh điển, báo chí và truyện ngụ ngôn với chế độ song ngữ đối chiếu (xen kẽ hoặc chia đôi 2 cột), tra từ và thử thách tự dịch."
      badge-text="Đọc sâu & Dịch"
      badge-tone="warn"
    >
      <template #icon>
        <BookOpen class="h-6 w-6 text-on-tone" :stroke-width="2.5" />
      </template>

      <template #actions>
        <div class="flex items-center gap-2">
          <BaseBadge tone="accent" size="sm">
            {{ currentLanguageOption.name }} • {{ filteredMaterials.length }} bài đọc
          </BaseBadge>
          <button
            type="button"
            class="px-3.5 py-1.5 rounded-brut border-2 border-line bg-warn hover:bg-warn/90 text-on-tone font-black text-xs shadow-brut-sm transition-transform active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
            @click="isCustomModalOpen = true"
          >
            <Plus class="w-4 h-4 stroke-[3]" />
            <span>Dán văn bản riêng</span>
          </button>
        </div>
      </template>
    </PageBanner>

    <!-- DÒNG THÔNG TIN BẢN QUYỀN NHỎ GỌN CÓ NÚT INFO (KHÔNG CHIẾM KHỐI TO) -->
    <div class="flex items-center justify-between text-xs text-ink-soft bg-surface px-4 py-2 rounded-brut border-2 border-line shadow-brut-sm">
      <div class="flex items-center gap-2">
        <ShieldCheck class="w-4 h-4 text-ok" />
        <span>Văn bản mẫu thuộc <strong>Miền công cộng (Public Domain)</strong> hoặc do {{ BRAND_NAME }} tự biên soạn.</span>
      </div>
      <button
        type="button"
        class="text-accent underline font-bold cursor-pointer flex items-center gap-1"
        @click="showCopyrightInfo = !showCopyrightInfo"
      >
        <Info class="w-3.5 h-3.5" />
        <span>{{ showCopyrightInfo ? 'Ẩn chi tiết' : 'Thông tin nguồn' }}</span>
      </button>
    </div>

    <div
      v-if="showCopyrightInfo"
      class="p-4 bg-surface-2 rounded-brut border-2 border-line text-xs text-ink-soft leading-relaxed animate-in fade-in"
    >
      Tất cả trích đoạn từ Aesop, Andersen, Shakespeare, Thoreau đã hết hạn bảo hộ bản quyền theo luật quốc tế. Chúng tôi cam kết không cào và phân phối nội dung có bản quyền mà không có thỏa thuận pháp lý.
    </div>

    <!-- Error State with Retry -->
    <div v-if="errorMessage" class="p-4 bg-warn-soft border-2 border-line rounded-brut shadow-brut flex items-center justify-between">
      <span class="text-xs font-bold text-ink">{{ errorMessage }}</span>
      <BaseButton tone="warn" size="sm" @click="fetchReadingData">Thử lại</BaseButton>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="p-6 bg-surface border-2 border-line rounded-brut shadow-brut animate-pulse space-y-4">
      <div class="h-5 bg-surface-2 rounded-brut w-1/4"></div>
      <div class="h-20 bg-surface-2 rounded-brut w-full"></div>
    </div>

    <!-- SECTION 1: TABS (KHO CÔNG CỘNG vs VĂN BẢN RIÊNG) -->
    <div class="flex items-center gap-2 border-b-2 border-line pb-2">
      <button
        type="button"
        class="px-5 py-2.5 rounded-brut border-2 font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
        :class="[
          activeTab === 'catalog'
            ? 'bg-warn text-on-tone border-line shadow-brut-sm'
            : 'bg-surface hover:bg-surface-2 text-ink border-transparent hover:border-line',
        ]"
        @click="activeTab = 'catalog'"
      >
        <BookOpen class="w-4 h-4 stroke-[2.5]" />
        <span>Kho tác phẩm tuyển chọn</span>
      </button>

      <button
        id="custom-paste-tab-btn"
        type="button"
        class="px-5 py-2.5 rounded-brut border-2 font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
        :class="[
          activeTab === 'custom_paste'
            ? 'bg-warn text-on-tone border-line shadow-brut-sm'
            : 'bg-surface hover:bg-surface-2 text-ink border-transparent hover:border-line',
        ]"
        @click="activeTab = 'custom_paste'"
      >
        <FileText class="w-4 h-4 stroke-[2.5]" />
        <span>Văn bản riêng của tôi ({{ myCustomTexts.length }})</span>
      </button>
    </div>

    <!-- SECTION 2: BỘ LỌC THỂ LOẠI GỌN GÀNG -->
    <div
      id="reading-type-filter-bar"
      class="p-3.5 bg-surface rounded-brut border-2 border-line shadow-brut-sm flex flex-col md:flex-row md:items-center justify-between gap-3"
    >
      <!-- Thể loại -->
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="text-xs font-bold text-ink-soft mr-1">Thể loại:</span>
        <button
          v-for="cat in [
            { id: 'all', label: 'Tất cả' },
            { id: 'short_story', label: 'Truyện ngắn' },
            { id: 'novel', label: 'Tiểu thuyết' },
            { id: 'book', label: 'Sách' },
            { id: 'news', label: 'Báo chí' },
            { id: 'play', label: 'Kịch' },
          ]"
          :key="cat.id"
          type="button"
          class="px-2.5 py-1 text-xs font-bold rounded-brut border-2 transition-colors cursor-pointer"
          :class="typeFilter === cat.id ? 'bg-warn text-on-tone border-line font-black shadow-brut-sm' : 'bg-surface border-transparent hover:border-line text-ink'"
          @click="typeFilter = cat.id as any"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Trình độ -->
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-bold text-ink-soft">Trình độ:</span>
        <select
          v-model="levelFilter"
          class="px-2.5 py-1 text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
        >
          <option value="all">Tất cả trình độ</option>
          <option value="A2">A2 (Cơ bản)</option>
          <option value="B1">B1 - B2 (Trung cấp)</option>
          <option value="C1">C1 (Học thuật)</option>
          <option value="HSK">HSK</option>
          <option value="JLPT">JLPT</option>
        </select>
      </div>
    </div>

    <!-- SECTION 3: DANH SÁCH BÀI ĐỌC (CÓ "BÌA SÁCH" THEO THỂ LOẠI & PREVIEW 2-3 DÒNG ĐẦU) -->
    <div id="reading-materials-grid">
      <div
        v-if="filteredMaterials.length === 0"
        class="p-12 text-center bg-surface rounded-brut border-2 border-line border-dashed space-y-3"
      >
        <p class="font-black text-ink text-base">Chưa có bài đọc nào phù hợp bộ lọc</p>
        <p class="text-xs text-ink-soft">
          {{ activeTab === 'custom_paste' ? 'Bấm "Dán văn bản riêng" phía trên để dán bài báo hoặc trích đoạn sách của bạn.' : 'Vui lòng chọn thể loại khác để xem tác phẩm.' }}
        </p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        <div
          v-for="item in filteredMaterials"
          :key="item.id"
          class="rounded-brut-lg border-[3px] border-line bg-surface shadow-brut flex flex-col justify-between hover:-translate-y-1 hover:shadow-brut-lg transition-all overflow-hidden h-full"
        >
          <div>
            <!-- BÌA SÁCH PHẲNG THEO THỂ LOẠI -->
            <div
              class="p-4 border-b-2 border-line flex items-center justify-between"
              :style="{ backgroundColor: getGenreTheme(item.type).soft }"
            >
              <div class="flex items-center gap-2">
                <div
                  class="p-2 rounded-brut border-2 border-line shadow-[1px_1px_0_var(--line)]"
                  :style="{ backgroundColor: getGenreTheme(item.type).bg, color: '#11141D' }"
                >
                  <component :is="getGenreTheme(item.type).icon" class="w-4 h-4 stroke-[2.5]" />
                </div>
                <span class="font-display text-xs font-black uppercase text-ink">
                  {{ getGenreTheme(item.type).label }}
                </span>
              </div>

              <BaseBadge v-bind="levelBadge(item.level)" size="sm">{{ item.level }}</BaseBadge>
            </div>

            <div class="p-5 space-y-3">
              <div>
                <h3 class="text-lg font-black text-ink font-display line-clamp-1 leading-snug">
                  {{ item.title }}
                </h3>
                <p class="text-xs font-bold text-ink-soft mt-0.5 line-clamp-1">
                  {{ item.viTitle }}
                </p>
                <p class="text-[11px] text-ink-soft/80 font-mono mt-1">
                  Tác giả: {{ item.author }}
                </p>
              </div>

              <!-- PREVIEW: TRÍCH ĐOẠN 2-3 DÒNG ĐẦU TIÊN CỦA TÁC PHẨM -->
              <div class="rounded-brut border-2 border-line bg-surface-2 p-3 space-y-1">
                <span class="text-[10px] font-black uppercase text-ink-soft tracking-wider block">
                  Trích đoạn đầu tác phẩm:
                </span>
                <p class="text-xs font-medium text-ink line-clamp-3 leading-relaxed italic">
                  "{{ item.paragraphs[0]?.targetText || item.paragraphs[0]?.text || 'Chưa có đoạn xem trước.' }}"
                </p>
              </div>

              <!-- Chỉ số thời gian đọc & số từ -->
              <div class="flex items-center gap-3 text-xs font-mono font-bold text-ink-soft pt-1">
                <span>{{ item.wordCount }} từ</span>
                <span>•</span>
                <span class="flex items-center gap-1">
                  <Clock class="w-3.5 h-3.5" />
                  ~{{ item.readingTimeMin }} phút
                </span>
              </div>
            </div>
          </div>

          <!-- Bottom Action Bar -->
          <div class="px-5 pb-5 pt-3 border-t-2 border-line/30 flex items-center justify-between">
            <span class="text-xs font-mono text-ink-soft font-bold">
              {{ item.paragraphs.length }} đoạn văn
            </span>

            <div class="flex items-center gap-2">
              <button
                v-if="item.isCustom"
                type="button"
                class="p-1.5 text-bad hover:opacity-80 cursor-pointer"
                title="Xoá bài này"
                @click="deleteCustomText(item.id)"
              >
                <Trash2 class="w-4 h-4" />
              </button>

              <NuxtLink
                :to="`/doc-dich/${item.id}`"
                class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-brut border-2 border-line bg-c-orange hover:bg-c-orange/90 text-white font-black text-xs shadow-brut-sm transition-transform active:translate-y-0.5"
              >
                <span>Vào đọc ngay</span>
                <ArrowRight class="w-3.5 h-3.5 stroke-[3]" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DÁN VĂN BẢN RIÊNG -->
    <div
      v-if="isCustomModalOpen"
      class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div class="bg-surface rounded-brut-lg border-[3px] border-line shadow-brut-lg max-w-lg w-full p-6 space-y-4">
        <div class="flex items-center justify-between border-b-2 border-line pb-2">
          <h3 class="font-display font-black text-lg text-ink">Dán văn bản riêng để đọc</h3>
          <button type="button" class="text-ink-soft hover:text-ink cursor-pointer" @click="isCustomModalOpen = false">
            ✕
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-black uppercase text-ink-soft mb-1">Tiêu đề:</label>
            <input v-model="inputCustomTitle" type="text" class="w-full px-3 py-2 text-sm font-bold rounded-brut border-2 border-line bg-surface" placeholder="Nhập tên bài đọc...">
          </div>
          <div>
            <label class="block text-xs font-black uppercase text-ink-soft mb-1">Nội dung văn bản (đoạn cách nhau bằng dòng trống):</label>
            <textarea v-model="inputCustomContent" rows="6" class="w-full px-3 py-2 text-xs font-mono rounded-brut border-2 border-line bg-surface" placeholder="Dán văn bản cần đọc tại đây..."></textarea>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t-2 border-line">
          <BaseButton variant="secondary" size="sm" @click="isCustomModalOpen = false">Hủy</BaseButton>
          <BaseButton variant="primary" size="sm" @click="handleAddCustomText">Lưu & Đọc ngay</BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
