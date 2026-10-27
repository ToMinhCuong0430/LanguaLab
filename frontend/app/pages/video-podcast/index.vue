<script setup lang="ts">
import {
  Video,
  Headphones,
  Plus,
  Play,
  Trash2,
  Film,
  Upload,
  Link as LinkIcon,
  X,
  Radio,
} from '@lucide/vue'
import { useLanguage } from '~/composables/useLanguage'
import { useMedia } from '~/composables/useMedia'
import { extractYouTubeId } from '~/utils/subtitleParser'
import LanguageSelector from '~/components/common/LanguageSelector.vue'
import PageBanner from '~/components/common/PageBanner.vue'
import PreviewThumb from '~/components/common/PreviewThumb.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { BRAND_NAME } from '~/constants/brand'

useHead({
  title: `Kho Video & Podcast song ngữ - ${BRAND_NAME}`,
})

const { currentLang, currentLanguageOption } = useLanguage()
const {
  activeTab,
  typeFilter,
  categoryFilter,
  levelFilter,
  filteredMediaList,
  myCustomVideos,
  isLoading,
  errorMessage,
  fetchMediaData,
  addCustomVideo,
  deleteCustomVideo,
} = useMedia(currentLang)

const guideSteps: GuideStep[] = [
  {
    title: 'Kho tuyển chọn & Video của tôi',
    description: 'Chuyển đổi giữa các tài liệu chọn lọc từ TED, BBC hoặc tự dán link YouTube cá nhân kèm phụ đề để luyện tập.',
    targetId: 'media-main-tabs',
    badge: 'Bước 1',
  },
  {
    title: 'Bộ lọc gọn theo dải',
    description: 'Lọc nhanh theo Cấp độ (A1-C1), Loại (Video/Podcast) và Chủ đề để tìm nội dung phù hợp.',
    targetId: 'media-filters-bar',
    badge: 'Bước 2',
  },
  {
    title: 'Dán link YouTube & Phân tách phụ đề',
    description: 'Tại tab Video của tôi, bạn dán link YouTube và xem trước thumbnail trực tiếp.',
    targetId: 'custom-paste-hero-box',
    badge: 'Bước 3',
  },
]

// Modal form state
const isAddModalOpen = ref(false)
const inputTitle = ref('')
const inputViTitle = ref('')
const inputYouTubeUrl = ref('')
const inputSubtitles = ref('')
const inputLevel = ref('B1')
const inputCategory = ref<'tech' | 'life' | 'culture' | 'news'>('life')
const srtFileName = ref('')

// Live preview YouTube ID from input
const livePreviewYoutubeId = computed(() => {
  return extractYouTubeId(inputYouTubeUrl.value)
})

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  srtFileName.value = file.name
  const reader = new FileReader()
  reader.onload = (event) => {
    inputSubtitles.value = (event.target?.result as string) || ''
  }
  reader.readAsText(file)
}

const handleAddCustom = () => {
  if (!inputTitle.value.trim() || !inputYouTubeUrl.value.trim() || !inputSubtitles.value.trim()) {
    alert('Vui lòng điền đầy đủ: Tiêu đề, Link YouTube và Nội dung phụ đề SRT/VTT.')
    return
  }

  try {
    addCustomVideo({
      title: inputTitle.value.trim(),
      viTitle: inputViTitle.value.trim() || inputTitle.value.trim(),
      youtubeUrl: inputYouTubeUrl.value.trim(),
      subtitlesContent: inputSubtitles.value.trim(),
      lang: currentLang.value,
      level: inputLevel.value,
      category: inputCategory.value,
    })

    inputTitle.value = ''
    inputViTitle.value = ''
    inputYouTubeUrl.value = ''
    inputSubtitles.value = ''
    srtFileName.value = ''
    isAddModalOpen.value = false
    activeTab.value = 'my_videos'
  } catch (err: any) {
    alert(err.message || 'Lỗi khi thêm video. Vui lòng kiểm tra lại link YouTube.')
  }
}

const formatDuration = (secs: number) => {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8" data-feature="video-podcast">
    <FirstVisitGuide page-key="video_podcast_index_guide" :steps="guideSteps" />

    <!-- Top Bar with Language Selector -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <LanguageSelector />
      </div>

      <div class="flex items-center gap-2 text-xs font-bold text-ink-soft">
        <span class="px-2.5 py-1 bg-surface-2 border border-line rounded-brut">Phụ đề song ngữ đồng bộ</span>
        <span class="px-2.5 py-1 bg-surface-2 border border-line rounded-brut">4 chế độ luyện</span>
      </div>
    </div>

    <!-- Page Banner -->
    <PageBanner
      feature="video-podcast"
      title="Kho Video & Podcast song ngữ tương tác"
      description="Luyện nghe ngấm tự nhiên với phụ đề song ngữ đồng bộ, kết hợp 4 chế độ: Chép chính tả, Nói nhại Shadowing, Trắc nghiệm nghe và Xem tương tác."
      badge-text="Đa phương tiện"
      badge-tone="warn"
    >
      <template #icon>
        <Video class="h-6 w-6 text-on-tone" :stroke-width="2.5" />
      </template>

      <template #actions>
        <div class="flex items-center gap-2">
          <BaseBadge tone="accent" size="sm">
            {{ currentLanguageOption.name }} • {{ filteredMediaList.length }} tài liệu
          </BaseBadge>
          <button
            id="add-custom-video-btn"
            type="button"
            class="px-4 py-2 min-h-[44px] rounded-brut border-2 border-line bg-warn hover:bg-warn/90 text-on-tone font-black text-xs shadow-brut-sm transition-transform active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
            @click="isAddModalOpen = true"
          >
            <Plus class="w-4 h-4 stroke-[3]" />
            <span>Thêm video riêng</span>
          </button>
        </div>
      </template>
    </PageBanner>

    <!-- Error State with Retry -->
    <div v-if="errorMessage" class="p-4 bg-warn-soft border-2 border-line rounded-brut shadow-brut flex items-center justify-between">
      <span class="text-xs font-bold text-ink">{{ errorMessage }}</span>
      <BaseButton tone="warn" size="sm" @click="fetchMediaData">Thử lại</BaseButton>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="p-6 bg-surface border-2 border-line rounded-brut shadow-brut space-y-4">
      <BaseSkeleton class="h-6 w-1/4 rounded-brut" />
      <BaseSkeleton class="h-28 w-full rounded-brut" />
    </div>

    <!-- SECTION 1: TABS CHÍNH (Kho tuyển chọn vs Video của tôi) -->
    <div id="media-main-tabs" class="flex items-center gap-2 border-b-2 border-line pb-2">
      <button
        type="button"
        class="px-5 py-2.5 min-h-[44px] rounded-brut border-2 font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
        :class="[
          activeTab === 'explore'
            ? 'bg-warn text-on-tone border-line shadow-brut-sm'
            : 'bg-surface hover:bg-surface-2 text-ink border-transparent hover:border-line',
        ]"
        @click="activeTab = 'explore'"
      >
        <Film class="w-4 h-4 stroke-[2.5]" />
        <span>Kho tuyển chọn (TED / BBC)</span>
      </button>

      <button
        type="button"
        class="px-5 py-2.5 min-h-[44px] rounded-brut border-2 font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2"
        :class="[
          activeTab === 'my_videos'
            ? 'bg-warn text-on-tone border-line shadow-brut-sm'
            : 'bg-surface hover:bg-surface-2 text-ink border-transparent hover:border-line',
        ]"
        @click="activeTab = 'my_videos'"
      >
        <Film class="w-4 h-4 stroke-[2.5]" />
        <span>Video của tôi ({{ myCustomVideos.length }})</span>
      </button>
    </div>

    <!-- Ô DÁN LINK ĐẶT NGAY ĐẦU TAB "VIDEO CỦA TÔI" -->
    <div
      v-if="activeTab === 'my_videos'"
      id="custom-paste-hero-box"
      class="rounded-brut-lg border-[3px] border-line bg-surface p-5 sm:p-6 shadow-brut space-y-4"
    >
      <div class="flex items-center justify-between border-b-2 border-line pb-3">
        <div class="flex items-center gap-2">
          <LinkIcon class="w-5 h-5 text-c-blue" :stroke-width="2.5" />
          <h3 class="font-display text-lg font-black text-ink">
            Dán link YouTube để học ngay
          </h3>
        </div>
        <span class="text-xs font-bold text-ink-soft hidden sm:inline">
          Tự động nạp thumbnail YouTube & hỗ trợ chia phụ đề
        </span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-8 space-y-3">
          <div>
            <label class="block text-xs font-black uppercase text-ink-soft mb-1">
              Đường link YouTube:
            </label>
            <input
              v-model="inputYouTubeUrl"
              type="text"
              placeholder="https://www.youtube.com/watch?v=yOgabx8503Q"
              class="w-full px-3.5 py-2.5 text-sm font-mono font-bold rounded-brut border-2 border-line bg-surface text-ink shadow-brut-sm focus:border-focus outline-none"
            >
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-black uppercase text-ink-soft mb-1">Tiêu đề video:</label>
              <input
                v-model="inputTitle"
                type="text"
                placeholder="Tiêu đề gốc tiếng Anh..."
                class="w-full px-3 py-2 text-xs font-bold rounded-brut border-2 border-line bg-surface"
              >
            </div>
            <div>
              <label class="block text-xs font-black uppercase text-ink-soft mb-1">Nội dung phụ đề (SRT/VTT):</label>
              <label class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-brut border-2 border-dashed border-line bg-surface-2 hover:bg-surface text-xs font-bold cursor-pointer">
                <Upload class="w-3.5 h-3.5" />
                <span>{{ srtFileName || 'Tải file .srt hoặc .vtt' }}</span>
                <input type="file" accept=".srt,.vtt,.txt" class="hidden" @change="handleFileUpload">
              </label>
            </div>
          </div>

          <div class="pt-2 flex items-center justify-between">
            <span class="text-[11px] text-ink-soft font-medium">Hệ thống chỉ nhúng iframe xem trực tiếp, không tải dữ liệu lậu.</span>
            <BaseButton variant="primary" size="sm" @click="handleAddCustom">
              <Plus class="w-4 h-4 mr-1" />
              <span>Lưu và bắt đầu luyện</span>
            </BaseButton>
          </div>
        </div>

        <!-- Live Preview Thumbnail khi dán link YouTube hợp lệ -->
        <div class="lg:col-span-4">
          <div class="rounded-brut border-2 border-line bg-surface-2 p-3 text-center">
            <span class="text-[10px] font-black uppercase text-ink-soft block mb-2">Xem trước thumbnail:</span>
            <div v-if="livePreviewYoutubeId" class="space-y-2">
              <PreviewThumb
                :src="`https://img.youtube.com/vi/${livePreviewYoutubeId}/hqdefault.jpg`"
                alt="Live thumbnail preview"
                level="YouTube"
                duration="Live"
              />
              <span class="text-[11px] font-mono text-ok font-black block">ID: {{ livePreviewYoutubeId }}</span>
            </div>
            <div v-else class="h-32 rounded-brut border-2 border-dashed border-line/40 flex items-center justify-center text-xs text-ink-soft font-medium p-4">
              Dán đường dẫn YouTube để hiển thị ảnh thumbnail tại đây
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 2: BỘ LỌC GỌN GÀNG THÀNH 1 DẢI -->
    <div
      id="media-filters-bar"
      class="p-3.5 bg-surface rounded-brut border-2 border-line shadow-brut-sm flex flex-wrap items-center justify-between gap-3"
    >
      <!-- Loại Media (Video / Podcast) -->
      <div class="flex items-center gap-1.5">
        <span class="text-xs font-bold text-ink-soft mr-1">Định dạng:</span>
        <div class="inline-flex p-0.5 bg-surface-2 border border-line rounded-brut">
          <button
            v-for="mode in [
              { id: 'all', label: 'Tất cả' },
              { id: 'video', label: 'Video' },
              { id: 'podcast', label: 'Podcast' },
            ]"
            :key="mode.id"
            type="button"
            class="px-3.5 py-1.5 min-h-[44px] flex items-center justify-center text-xs font-bold rounded-brut transition-all cursor-pointer"
            :class="typeFilter === mode.id ? 'bg-warn text-on-tone border border-line font-black shadow-brut-sm' : 'text-ink hover:text-black'"
            @click="typeFilter = mode.id as any"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>

      <!-- Cấp độ & Chủ đề gộp gọn -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-1.5">
          <span class="text-xs font-bold text-ink-soft">Trình độ:</span>
          <select
            v-model="levelFilter"
            class="px-3 py-1.5 min-h-[44px] text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
          >
            <option value="all">Tất cả cấp độ</option>
            <option value="A1">A1 - A2 (Cơ bản)</option>
            <option value="B1">B1 - B2 (Trung cấp)</option>
            <option value="C1">C1 - C2 (Nâng cao)</option>
            <option value="HSK">HSK</option>
            <option value="JLPT">JLPT</option>
          </select>
        </div>

        <div class="flex items-center gap-1.5">
          <span class="text-xs font-bold text-ink-soft">Chủ đề:</span>
          <select
            v-model="categoryFilter"
            class="px-3 py-1.5 min-h-[44px] text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
          >
            <option value="all">Tất cả chủ đề</option>
            <option value="tech">Khoa học & Não bộ</option>
            <option value="life">Đời sống & Thói quen</option>
            <option value="culture">Văn hoá & Triết học</option>
            <option value="news">Bản tin thời sự</option>
          </select>
        </div>
      </div>
    </div>

    <!-- SECTION 3: LƯỚI NỘI DUNG 3 CỘT (CÓ THUMBNAIL THẬT + HOVER HIỆN 2 DÒNG PHỤ ĐỀ SONG NGỮ + CHIP CHẾ ĐỘ) -->
    <div id="media-grid-list">
      <!-- Trống -->
      <BaseEmptyState
        v-if="filteredMediaList.length === 0"
        title="Chưa có nội dung nào trong danh mục này"
        :description="activeTab === 'my_videos' ? 'Dán link YouTube bất kỳ để hệ thống tự động phân tách phụ đề song ngữ và tạo bài tập luyện nghe!' : 'Vui lòng chọn bộ lọc khác để hiển thị tài liệu.'"
      />

      <!-- Grid Cards 3 Cột (Thẻ đầu tiên span-2 nếu là danh sách tuyển chọn) -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="(item, idx) in filteredMediaList"
          :key="item.id"
          class="group rounded-brut-lg border-[3px] border-line bg-surface shadow-brut flex flex-col justify-between hover:-translate-y-1 hover:shadow-brut-lg transition-all overflow-hidden"
          :class="[idx === 0 && activeTab === 'explore' ? 'md:col-span-2 lg:col-span-2 bg-c-blue-soft/30' : '']"
        >
          <div class="p-4 sm:p-5 space-y-3">
            <!-- Thumbnail thật qua PreviewThumb (YouTube HQDefault hoặc Minh hoạ Podcast Flat) -->
            <div class="relative">
              <PreviewThumb
                :src="item.youtubeId ? `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg` : undefined"
                :alt="item.title"
                :duration="formatDuration(item.durationSec)"
                :level="item.level"
                :type="item.type"
              />
            </div>

            <!-- Title & Speaker -->
            <div>
              <div class="flex items-center gap-1.5 mb-1">
                <BaseBadge :tone="item.type === 'video' ? 'blue' : 'pink'" size="sm" :uppercase="true">
                  {{ item.type }}
                </BaseBadge>
                <BaseBadge tone="neutral" size="sm">{{ item.category }}</BaseBadge>
              </div>

              <h3 class="text-base sm:text-lg font-black text-ink font-display line-clamp-2 leading-snug group-hover:text-c-blue">
                {{ item.title }}
              </h3>
              <p class="text-xs text-ink-soft font-bold mt-1 line-clamp-1">
                {{ item.viTitle }}
              </p>
              <p class="text-[11px] text-ink-soft/70 font-mono mt-0.5">
                {{ item.speaker }}
              </p>
            </div>

            <!-- PREVIEW HOVER & KEYBOARD FOCUS: 2 DÒNG PHỤ ĐỀ ĐẦU TIÊN (SONG NGỮ) -->
            <div class="rounded-brut border-2 border-line bg-surface-2 p-3 space-y-1.5 transition-all">
              <span class="text-[10px] font-black uppercase text-ink-soft tracking-wider block">
                Xem trước phụ đề song ngữ:
              </span>
              <p class="text-xs font-bold text-ink line-clamp-1">
                1. {{ item.subtitles[0]?.text || 'Chưa có phụ đề xem trước.' }}
              </p>
              <p class="text-[11px] text-ink-soft italic line-clamp-1">
                &rarr; {{ item.subtitles[0]?.vi || 'Chưa có bản dịch' }}
              </p>
            </div>

            <!-- CHIPS 4 CHẾ ĐỘ LUYỆN CÓ SẴN -->
            <div class="flex flex-wrap items-center gap-1 pt-1">
              <span class="px-2 py-0.5 rounded border border-line bg-c-blue-soft text-c-blue-ink text-[10px] font-bold">
                Chép chính tả
              </span>
              <span class="px-2 py-0.5 rounded border border-line bg-c-pink-soft text-c-pink-ink text-[10px] font-bold">
                Shadowing
              </span>
              <span class="px-2 py-0.5 rounded border border-line bg-c-yellow-soft text-c-yellow-ink text-[10px] font-bold">
                Trắc nghiệm
              </span>
              <span class="px-2 py-0.5 rounded border border-line bg-surface text-ink text-[10px] font-bold">
                Song ngữ
              </span>
            </div>
          </div>

          <!-- Bottom Action Bar -->
          <div class="px-4 sm:px-5 pb-4 pt-2 border-t-2 border-line/30 flex items-center justify-between">
            <span class="text-xs font-mono font-bold text-ink-soft">
              {{ item.subtitles.length }} câu thoại
            </span>

            <div class="flex items-center gap-2">
              <button
                v-if="item.isCustom"
                type="button"
                class="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-bad hover:opacity-80 cursor-pointer"
                title="Xoá video này"
                aria-label="Xoá video này"
                @click="deleteCustomVideo(item.id)"
              >
                <Trash2 class="w-4 h-4" />
              </button>

              <NuxtLink
                :to="`/video-podcast/${item.id}`"
                class="inline-flex items-center min-h-[44px] gap-1 px-4 py-2 rounded-brut border-2 border-line bg-warn hover:bg-warn/90 text-on-tone font-black text-xs shadow-brut-sm transition-transform active:translate-y-0.5"
              >
                <Play class="w-3.5 h-3.5 fill-current" />
                <span>Vào luyện ngay</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
