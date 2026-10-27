<script setup lang="ts">
import {
  Lightbulb,
  ThumbsUp,
  MessageSquare,
  Send,
  ArrowLeft,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from '@lucide/vue'
import { useFeatureRequests, type FeatureRequest } from '~/composables/useFeatureRequests'
import PageBanner from '~/components/common/PageBanner.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { requestStatusBadge } from '~/constants/badges'
import { BRAND_NAME } from '~/constants/brand'

const route = useRoute()
const requestId = computed(() => (route.params.id as string) || 'feat-1')

const { getRequestById, toggleUpvote, addComment, isAdmin, updateStatus } = useFeatureRequests()

const currentRequest = computed<FeatureRequest | undefined>(() => {
  return getRequestById(requestId.value)
})

useHead({
  title: computed(() => `${currentRequest.value?.title || 'Yêu cầu tính năng'} - ${BRAND_NAME}`),
})

const guideSteps: GuideStep[] = [
  {
    title: 'Chi tiết đề xuất & Trạng thái',
    description: 'Theo dõi mô tả chi tiết của tính năng và trạng thái xử lý hiện tại từ đội ngũ phát triển.',
    targetId: 'feature-detail-header-card',
    badge: 'Bước 1',
  },
  {
    title: 'Bình chọn tăng độ ưu tiên (Upvote)',
    description: 'Bấm nút vote để ủng hộ tính năng này. Mỗi tài khoản có 1 lượt bình chọn cho mỗi đề xuất.',
    targetId: 'detail-upvote-button',
    badge: 'Bước 2',
  },
  {
    title: 'Thảo luận & Đóng góp ý kiến',
    description: 'Gửi bình luận hoặc chia sẻ trường hợp sử dụng cụ thể của bạn để đội ngũ hoàn thiện tính năng tốt hơn.',
    targetId: 'comments-discussion-section',
    badge: 'Bước 3',
  },
]

// Form gửi bình luận
const commentInput = ref('')
const authorInput = ref('')
const commentError = ref('')

const handleCommentSubmit = () => {
  if (!commentInput.value.trim()) {
    commentError.value = 'Vui lòng nhập nội dung bình luận.'
    return
  }
  if (commentInput.value.trim().length < 5) {
    commentError.value = 'Bình luận phải có ít nhất 5 ký tự.'
    return
  }

  commentError.value = ''
  addComment(
    currentRequest.value?.id || '',
    commentInput.value.trim(),
    authorInput.value.trim() || 'Bạn (Người học)'
  )

  commentInput.value = ''
}

const getStatusBadge = (status?: string) => {
  switch (status) {
    case 'completed':
      return { label: 'Đã hoàn thành', tone: 'ok' as const }
    case 'in_progress':
      return { label: 'Đang phát triển', tone: 'warn' as const }
    case 'under_review':
      return { label: 'Đang xem xét', tone: 'accent' as const }
    case 'rejected':
      return { label: 'Từ chối', tone: 'bad' as const }
    default:
      return { label: 'Mới đề xuất', tone: 'surface' as const }
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6" data-feature="yeu-cau-tinh-nang">
    <FirstVisitGuide page-key="feature_detail_guide" :steps="guideSteps" />

    <!-- Top Navigation -->
    <div class="flex items-center justify-between">
      <NuxtLink
        to="/yeu-cau-tinh-nang"
        class="inline-flex items-center gap-1.5 text-xs font-black uppercase text-ink-soft hover:text-ink transition-colors"
      >
        <ArrowLeft class="w-4 h-4 stroke-[2.5]" />
        <span>Về danh sách yêu cầu tính năng</span>
      </NuxtLink>

      <BaseBadge v-if="currentRequest" v-bind="requestStatusBadge(currentRequest.status)" size="sm" />
    </div>

    <!-- KHÔNG TÌM THẤY YÊU CẦU -->
    <div v-if="!currentRequest" class="p-8 text-center bg-surface rounded-brut border-2 border-line space-y-3">
      <p class="font-black text-lg text-ink">Không tìm thấy yêu cầu tính năng này.</p>
      <NuxtLink to="/yeu-cau-tinh-nang" class="text-xs font-bold text-accent underline">
        Quay lại danh sách
      </NuxtLink>
    </div>

    <!-- CHI TIẾT YÊU CẦU -->
    <div v-else class="space-y-6">
      <BaseCard id="feature-detail-header-card" tone="surface">
        <div class="space-y-4">
          <!-- Header with Meta -->
          <div class="flex flex-wrap items-center justify-between gap-3 border-b-2 border-line pb-3">
            <div class="flex items-center gap-2">
              <BaseBadge v-bind="requestStatusBadge(currentRequest.status)" size="sm" />
              <span class="text-xs font-mono font-bold text-ink-soft">
                Đăng ngày: {{ currentRequest.createdAt }}
              </span>
            </div>

            <div class="flex items-center gap-1.5 text-xs font-bold text-ink-soft">
              <User class="w-3.5 h-3.5" />
              <span>Đề xuất bởi: <strong class="text-ink">{{ currentRequest.authorName }}</strong></span>
            </div>
          </div>

          <!-- Khu vực Quản trị viên (Admin Controls): Chỉ hiện khi isAdmin = true -->
          <div
            v-if="isAdmin"
            class="p-3 bg-accent/10 rounded-brut border-2 border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <span class="text-xs font-black uppercase text-accent flex items-center gap-1.5">
              <span>★</span> Quyền Quản trị viên (Admin)
            </span>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-ink">Chuyển trạng thái:</span>
              <select
                class="px-2.5 py-1 bg-surface border-2 border-line rounded-brut text-xs font-bold font-mono cursor-pointer"
                :value="currentRequest.status"
                @change="(e: any) => updateStatus(currentRequest!.id, e.target.value)"
              >
                <option value="new">Mới đề xuất (new)</option>
                <option value="under_review">Đang xem xét (under_review)</option>
                <option value="in_progress">Đang làm (in_progress)</option>
                <option value="completed">Đã hoàn thành (completed)</option>
                <option value="rejected">Từ chối (rejected)</option>
              </select>
            </div>
          </div>

          <!-- Main Title & Upvote Button -->
          <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <h1 class="text-2xl sm:text-3xl font-black text-ink font-display tracking-tight flex-1">
              {{ currentRequest.title }}
            </h1>

            <button
              id="detail-upvote-button"
              type="button"
              class="flex-shrink-0 flex sm:flex-col items-center justify-center gap-1 px-5 py-3 rounded-brut border-[3px] border-line shadow-brut transition-all active:translate-y-0.5 cursor-pointer"
              :class="[
                currentRequest.hasVoted
                  ? 'bg-ok text-on-tone font-black'
                  : 'bg-surface hover:bg-surface-2 text-ink',
              ]"
              @click="toggleUpvote(currentRequest.id)"
            >
              <ThumbsUp class="w-5 h-5 stroke-[2.5]" />
              <span class="text-xl font-black font-mono leading-none">{{ currentRequest.upvotes }}</span>
              <span class="text-[10px] uppercase font-bold sm:block hidden opacity-80">
                {{ currentRequest.hasVoted ? 'Đã bình chọn' : 'Bình chọn' }}
              </span>
            </button>
          </div>

          <!-- Description -->
          <div class="p-4 bg-surface-2/60 rounded-brut border-2 border-line">
            <p class="text-sm sm:text-base text-ink font-medium leading-relaxed">
              {{ currentRequest.description }}
            </p>
          </div>

          <!-- Tags -->
          <div class="flex flex-wrap gap-1.5 pt-1">
            <span
              v-for="tag in currentRequest.tags"
              :key="tag"
              class="px-2.5 py-1 text-xs font-mono font-bold bg-surface-2 border border-line rounded-brut"
            >
              #{{ tag }}
            </span>
          </div>
        </div>
      </BaseCard>

      <!-- KHU VỰC BÌNH LUẬN CỘNG ĐỒNG -->
      <BaseCard id="comments-discussion-section" tone="surface">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 font-black text-base">
              <MessageSquare class="w-5 h-5 text-accent" />
              <span>Bình luận & Thảo luận ({{ currentRequest.comments.length }})</span>
            </div>
          </div>
        </template>

        <div class="space-y-6 py-2">
          <!-- Form gửi bình luận mới -->
          <form class="p-4 bg-surface-2 rounded-brut border-2 border-line space-y-3" @submit.prevent="handleCommentSubmit">
            <p class="text-xs font-bold uppercase text-ink-soft">Thêm ý kiến của bạn:</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                v-model="authorInput"
                type="text"
                placeholder="Tên của bạn (mặc định: Bạn)"
                class="px-3 py-1.5 text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink outline-none"
              >
            </div>

            <textarea
              v-model="commentInput"
              rows="3"
              required
              placeholder="Chia sẻ lý do bạn cần tính năng này hoặc các đề xuất cải tiến cụ thể..."
              class="w-full p-3 text-xs sm:text-sm font-medium rounded-brut border-2 border-line bg-surface text-ink outline-none focus:border-focus"
            />

            <p v-if="commentError" class="text-xs font-bold text-bad">
              {{ commentError }}
            </p>

            <div class="flex justify-end">
              <BaseButton type="submit" variant="primary" size="sm" class="gap-1.5">
                <Send class="w-4 h-4" />
                <span>Gửi bình luận</span>
              </BaseButton>
            </div>
          </form>

          <!-- Danh sách bình luận -->
          <div v-if="currentRequest.comments.length === 0" class="py-6 text-center text-xs text-ink-soft">
            Chưa có bình luận nào cho đề xuất này. Hãy là người đầu tiên chia sẻ ý kiến!
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="comm in currentRequest.comments"
              :key="comm.id"
              class="p-4 rounded-brut border-2 border-line bg-surface space-y-2 shadow-brut-sm"
            >
              <div class="flex items-center justify-between border-b border-line pb-1.5">
                <div class="flex items-center gap-2">
                  <span class="w-7 h-7 rounded-full border border-line bg-warn text-on-tone font-black text-xs flex items-center justify-center font-mono">
                    {{ comm.avatarText }}
                  </span>
                  <span class="font-black text-xs text-ink">{{ comm.authorName }}</span>
                </div>
                <span class="text-[11px] font-mono text-ink-soft">{{ comm.createdAt }}</span>
              </div>

              <p class="text-xs sm:text-sm text-ink-soft font-medium leading-relaxed pl-1">
                {{ comm.content }}
              </p>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
