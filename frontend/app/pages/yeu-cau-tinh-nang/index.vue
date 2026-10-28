<script setup lang="ts">
import {
  Lightbulb,
  ThumbsUp,
  PlusCircle,
  MessageSquare,
  Clock,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  ArrowRight,
  ShieldAlert,
  Flame,
} from '@lucide/vue'
import { useFeatureRequests, type FeatureCategory } from '~/composables/useFeatureRequests'
import PageBanner from '~/components/common/PageBanner.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { requestStatusBadge } from '~/constants/badges'
import { BRAND_NAME } from '~/constants/brand'

useHead({
  title: `Yêu cầu & Bình chọn tính năng cộng đồng - ${BRAND_NAME}`,
})

const {
  requests,
  filteredRequests,
  selectedStatus,
  sortBy,
  isAdmin,
  isLoading,
  errorMessage,
  fetchRequests,
  toggleUpvote,
  addRequest,
} = useFeatureRequests()

const guideSteps: GuideStep[] = [
  {
    title: 'Lộ trình phát triển minh bạch',
    description: 'Theo dõi các đề xuất tính năng theo 5 trạng thái: Mới, Đang xem xét, Đang làm, Hoàn thành và Từ chối.',
    targetId: 'feature-status-filters-bar',
    badge: 'Bước 1',
  },
  {
    title: 'Top 3 tính năng được ủng hộ nhiều nhất',
    description: 'Khu vực nổi bật vinh danh 3 đề xuất có số phiếu bầu cao nhất từ cộng đồng người học.',
    targetId: 'top-voted-features-grid',
    badge: 'Bước 2',
  },
  {
    title: 'Mỗi người 1 phiếu bình chọn (Upvote)',
    description: 'Bấm nút vote để đẩy tính năng bạn cần nhất lên đầu danh sách ưu tiên. Bấm lại để huỷ vote.',
    targetId: 'feature-cards-list',
    badge: 'Bước 3',
  },
  {
    title: 'Gửi đề xuất tính năng mới',
    description: 'Bấm nút "Gửi đề xuất mới" để đóng góp ý tưởng xây dựng nền tảng.',
    targetId: 'new-request-action-btn',
    badge: 'Bước 4',
  },
]

// Quản lý Modal / Form gửi yêu cầu mới
const isFormOpen = ref(false)
const newTitle = ref('')
const newDescription = ref('')
const newCategory = ref<FeatureCategory>('tu_vung')
const formError = ref('')

const handleFormSubmit = () => {
  const title = newTitle.value.trim()
  const desc = newDescription.value.trim()

  if (title.length < 6) {
    formError.value = 'Tiêu đề tính năng phải có ít nhất 6 ký tự.'
    return
  }

  if (desc.length < 15) {
    formError.value = 'Mô tả tính năng phải có ít nhất 15 ký tự để đội ngũ hiểu rõ nhu cầu của bạn.'
    return
  }

  formError.value = ''
  const created = addRequest({
    title,
    description: desc,
    category: newCategory.value,
  })

  newTitle.value = ''
  newDescription.value = ''
  isFormOpen.value = false
  navigateTo(`/yeu-cau-tinh-nang/${created.id}`)
}

// Bảng màu trạng thái: Mới = xám, Đang xem xét = yellow, Đang làm = blue, Hoàn thành = green, Từ chối = coral
const statusColors: Record<string, { label: string; tone: any; border: string; bg: string; text: string }> = {
  new: { label: 'Mới đề xuất', tone: 'surface', border: 'border-l-ink-soft/40', bg: 'bg-surface-2', text: 'text-ink' },
  under_review: { label: 'Đang xem xét', tone: 'warn', border: 'border-l-c-yellow', bg: 'bg-c-yellow-soft', text: 'text-c-yellow-ink' },
  in_progress: { label: 'Đang làm', tone: 'accent', border: 'border-l-c-blue', bg: 'bg-c-blue-soft', text: 'text-c-blue-ink' },
  completed: { label: 'Hoàn thành', tone: 'ok', border: 'border-l-c-green', bg: 'bg-c-green-soft', text: 'text-c-green-ink' },
  rejected: { label: 'Từ chối', tone: 'bad', border: 'border-l-c-coral', bg: 'bg-c-coral-soft', text: 'text-c-coral-ink' },
}

const getStatusBadge = (status: string) => {
  return statusColors[status] || statusColors.new
}

// Top 3 đề xuất theo lượt upvote
const top3Voted = computed(() => {
  return [...requests.value].sort((a, b) => b.upvotes - a.upvotes).slice(0, 3)
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8" data-feature="yeu-cau-tinh-nang">
    <FirstVisitGuide page-key="yeu_cau_tinh_nang_index_guide" :steps="guideSteps" />

    <!-- Page Banner (Banner màu cyan) -->
    <PageBanner
      feature="yeu-cau-tinh-nang"
      title="Đề xuất & Bình chọn tính năng"
      :description="`${BRAND_NAME} là nền tảng vì cộng đồng người học. Mọi định hướng phát triển đều do bạn và cộng đồng cùng quyết định.`"
      badge-text="Cùng xây dựng"
      badge-tone="warn"
    >
      <template #icon>
        <Lightbulb class="h-6 w-6 text-on-tone" :stroke-width="2.5" />
      </template>

      <template #actions>
        <div class="flex items-center gap-2">
          <BaseBadge tone="ok" size="sm">
            {{ requests.length }} đề xuất
          </BaseBadge>
          <button
            id="new-request-action-btn"
            type="button"
            class="px-4 py-2 min-h-[44px] rounded-brut border-2 border-line bg-warn hover:bg-warn/90 text-on-tone font-black text-xs sm:text-sm shadow-brut transition-transform active:translate-y-0.5 cursor-pointer flex items-center gap-1.5"
            @click="isFormOpen = !isFormOpen"
          >
            <PlusCircle class="w-4 h-4 stroke-[2.5]" />
            <span>{{ isFormOpen ? 'Đóng form' : 'Gửi đề xuất mới' }}</span>
          </button>
        </div>
      </template>
    </PageBanner>

    <!-- Error State with Retry -->
    <div v-if="errorMessage" class="p-4 bg-warn-soft border-2 border-line rounded-brut shadow-brut flex items-center justify-between">
      <span class="text-xs font-bold text-ink">{{ errorMessage }}</span>
      <BaseButton tone="warn" size="sm" @click="fetchRequests">Thử lại</BaseButton>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="p-6 bg-surface border-2 border-line rounded-brut shadow-brut space-y-4">
      <BaseSkeleton class="h-6 w-1/4 rounded-brut" />
      <BaseSkeleton class="h-20 w-full rounded-brut" />
    </div>

    <!-- TOP 3 TÍNH NĂNG ĐƯỢC ỦNG HỘ NHIỀU NHẤT -->
    <div id="top-voted-features-grid" class="space-y-4">
      <div class="flex items-center gap-2">
        <Flame class="w-5 h-5 text-c-coral fill-c-coral" />
        <h2 class="text-lg sm:text-xl font-black text-ink font-display">
          Được ủng hộ nhiều nhất (Top 3)
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          v-for="(topReq, tIdx) in top3Voted"
          :key="topReq.id"
          class="rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut flex flex-col justify-between hover:-translate-y-1 hover:shadow-brut-lg transition-all border-t-[6px]"
          :class="[
            tIdx === 0 ? 'border-t-warn bg-c-yellow-soft/20' :
            tIdx === 1 ? 'border-t-c-blue bg-c-blue-soft/20' : 'border-t-c-cyan bg-c-cyan-soft/20',
          ]"
        >
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="rounded-brut border-2 border-line px-2 py-0.5 text-[11px] font-black uppercase"
                :class="tIdx === 0 ? 'bg-warn text-on-tone' : 'bg-surface text-ink'"
              >
                Top #{{ tIdx + 1 }}
              </span>
              <span class="text-xs font-mono font-black text-ok">
                {{ topReq.upvotes }} phiếu
              </span>
            </div>

            <NuxtLink :to="`/yeu-cau-tinh-nang/${topReq.id}`" class="block group">
              <h3 class="font-display text-base font-black text-ink group-hover:text-c-cyan-ink line-clamp-2 leading-snug">
                {{ topReq.title }}
              </h3>
            </NuxtLink>

            <p class="text-xs text-ink-soft line-clamp-2 font-medium">
              {{ topReq.description }}
            </p>
          </div>

          <div class="mt-4 pt-3 border-t border-line/30 flex items-center justify-between text-xs">
            <span class="text-[11px] font-bold text-ink-soft">{{ topReq.authorName }}</span>
            <button
              type="button"
              class="px-3 py-1.5 min-h-[44px] rounded-brut border-2 border-line text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              :class="topReq.hasVoted ? 'bg-ok text-on-tone' : 'bg-surface hover:bg-surface-2 text-ink'"
              @click="toggleUpvote(topReq.id)"
            >
              <ThumbsUp class="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{{ topReq.hasVoted ? 'Đã vote' : 'Vote' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- FORM GỬI ĐỀ XUẤT MỚI -->
    <BaseCard
      v-if="isFormOpen"
      tone="surface"
      class="animate-in fade-in zoom-in-95 duration-200 border-c-cyan"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <PlusCircle class="w-5 h-5 text-c-cyan" />
          <span class="font-display font-black text-base text-ink">
            Gửi đề xuất tính năng mới cho cộng đồng
          </span>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="handleFormSubmit">
        <div v-if="formError" class="p-3 bg-bad/15 border-2 border-bad rounded-brut text-xs font-bold text-bad">
          {{ formError }}
        </div>

        <div>
          <label class="block text-xs font-black uppercase text-ink-soft mb-1">
            Tiêu đề tính năng (Ngắn gọn, rõ ý):
          </label>
          <input
            v-model="newTitle"
            type="text"
            placeholder="Ví dụ: Bổ sung chế độ luyện gõ theo nhịp gõ phím mù..."
            class="w-full px-3.5 py-2.5 text-sm font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none focus:border-focus"
          >
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-black uppercase text-ink-soft mb-1">
              Phân hệ tính năng:
            </label>
            <select
              v-model="newCategory"
              class="w-full px-3.5 py-2 text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
            >
              <option value="go_cau">Gõ câu phản xạ</option>
              <option value="video_podcast">Video & Podcast</option>
              <option value="ngu_phap">Ngữ pháp</option>
              <option value="tu_vung">Từ vựng & Phát âm</option>
              <option value="doc_dich">Luyện đọc & Dịch</option>
              <option value="tu_dien">Từ điển chuyên sâu</option>
              <option value="luyen_thi">Luyện thi chứng chỉ</option>
              <option value="khac">Khác / Toàn hệ thống</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-black uppercase text-ink-soft mb-1">
            Mô tả chi tiết và giải pháp đề xuất:
          </label>
          <textarea
            v-model="newDescription"
            rows="3"
            placeholder="Hãy mô tả vấn đề bạn gặp phải và lý do tính năng này giúp việc học hiệu quả hơn..."
            class="w-full px-3.5 py-2.5 text-xs font-medium rounded-brut border-2 border-line bg-surface text-ink outline-none focus:border-focus"
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t-2 border-line">
          <BaseButton variant="secondary" size="sm" @click="isFormOpen = false">
            Hủy bỏ
          </BaseButton>
          <BaseButton type="submit" variant="primary" size="sm">
            <Send class="w-4 h-4 mr-1" />
            <span>Gửi đề xuất ngay</span>
          </BaseButton>
        </div>
      </form>
    </BaseCard>

    <!-- SECTION: BỘ LỌC TRẠNG THÁI & SẮP XẾP -->
    <div
      id="feature-status-filters-bar"
      class="p-4 bg-surface rounded-brut border-2 border-line shadow-brut-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="text-xs font-bold text-ink-soft mr-1">Trạng thái:</span>
        <button
          v-for="st in [
            { id: 'all', label: 'Tất cả' },
            { id: 'new', label: 'Mới' },
            { id: 'under_review', label: 'Đang xem xét' },
            { id: 'in_progress', label: 'Đang làm' },
            { id: 'completed', label: 'Hoàn thành' },
            { id: 'rejected', label: 'Từ chối' },
          ]"
          :key="st.id"
          type="button"
          class="px-3 py-1.5 min-h-[44px] flex items-center text-xs font-bold rounded-brut border-2 transition-colors cursor-pointer"
          :class="selectedStatus === st.id ? 'bg-warn text-on-tone border-line font-black shadow-brut-sm' : 'bg-surface border-transparent hover:border-line text-ink'"
          @click="selectedStatus = st.id"
        >
          {{ st.label }}
        </button>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-ink-soft flex items-center gap-1">
          <ArrowUpDown class="w-3.5 h-3.5" />
          Sắp xếp:
        </span>
        <select
          v-model="sortBy"
          class="px-3 py-1.5 min-h-[44px] text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
        >
          <option value="votes">Nhiều bình chọn nhất</option>
          <option value="newest">Mới nhất trước</option>
        </select>
      </div>
    </div>

    <!-- DANH SÁCH YÊU CẦU TÍNH NĂNG (DẢI MÀU BÊN TRÁI THEO TRẠNG THÁI + KHỐI VOTE MÀU FEATURE TO DỄ BẤM) -->
    <div id="feature-cards-list" class="space-y-4">
      <BaseEmptyState
        v-if="filteredRequests.length === 0"
        title="Không tìm thấy yêu cầu nào theo trạng thái này"
        description="Hãy chọn bộ lọc 'Tất cả' hoặc gửi một đề xuất tính năng mới!"
      />

      <div
        v-for="req in filteredRequests"
        :key="req.id"
        class="p-5 sm:p-6 rounded-brut-lg border-[3px] border-line bg-surface shadow-brut flex flex-col sm:flex-row sm:items-start justify-between gap-5 transition-transform hover:-translate-y-0.5 border-l-[8px]"
        :class="getStatusBadge(req.status).border"
      >
        <!-- Khối bình chọn (Nút Vote là ô màu feature to, nổi bật và dễ bấm) -->
        <button
          type="button"
          class="sm:flex-shrink-0 flex sm:flex-col items-center justify-center gap-1.5 px-4 py-3 sm:py-4 rounded-brut-lg border-[3px] border-line shadow-brut transition-all active:translate-y-0.5 cursor-pointer min-w-[85px]"
          :class="[
            req.hasVoted
              ? 'bg-c-cyan text-on-tone font-black'
              : 'bg-c-cyan-soft hover:bg-c-cyan text-c-cyan-ink',
          ]"
          :title="req.hasVoted ? 'Bấm để huỷ bình chọn' : 'Bình chọn cho tính năng này'"
          @click="toggleUpvote(req.id)"
        >
          <ThumbsUp class="w-6 h-6 stroke-[2.5]" />
          <span class="text-xl sm:text-2xl font-black font-mono leading-none">{{ req.upvotes }}</span>
          <span class="text-[10px] uppercase font-black tracking-wider sm:block hidden opacity-90">
            {{ req.hasVoted ? 'Đã vote' : 'Vote' }}
          </span>
        </button>

        <!-- Nội dung đề xuất -->
        <div class="flex-1 space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <BaseBadge v-bind="requestStatusBadge(req.status)" size="sm" :uppercase="true" />
            <span class="text-xs font-bold text-ink-soft">
              Đề xuất bởi: <strong class="text-ink">{{ req.authorName }}</strong>
            </span>
            <span class="text-xs text-ink-soft/70 font-mono">• {{ req.createdAt }}</span>
          </div>

          <NuxtLink
            :to="`/yeu-cau-tinh-nang/${req.id}`"
            class="block group"
          >
            <h3 class="text-lg sm:text-xl font-black text-ink font-display group-hover:text-c-cyan-ink transition-colors leading-snug">
              {{ req.title }}
            </h3>
          </NuxtLink>

          <p class="text-xs sm:text-sm text-ink-soft font-medium leading-relaxed">
            {{ req.description }}
          </p>

          <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-line/40">
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="tag in req.tags"
                :key="tag"
                class="px-2 py-0.5 text-[10px] font-mono font-bold bg-surface-2 border border-line rounded-brut"
              >
                #{{ tag }}
              </span>
            </div>

            <NuxtLink
              :to="`/yeu-cau-tinh-nang/${req.id}`"
              class="inline-flex items-center min-h-[44px] gap-1.5 text-xs font-bold text-c-cyan-ink hover:underline font-black"
            >
              <MessageSquare class="w-3.5 h-3.5" />
              <span>{{ req.comments?.length || 0 }} bình luận</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
