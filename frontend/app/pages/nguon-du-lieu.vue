<script setup lang="ts">
import {
  Database,
  ExternalLink,
  ArrowLeft,
  Scale,
  BookOpen,
  Share2,
} from '@lucide/vue'
import { BRAND_NAME } from '~/constants/brand'
import { useLexSources } from '~/composables/useLexSources'

useHead({
  title: `Nguồn dữ liệu từ vựng & Giấy phép mở - ${BRAND_NAME}`,
  meta: [
    {
      name: 'description',
      content: 'Minh bạch nguồn gốc dữ liệu học liệu mở, từ điển và các dự án ngôn ngữ học cộng đồng được tích hợp trong Langua.',
    },
  ],
})

const { sources, isLoading, errorMessage } = useLexSources()
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6 text-ink">
    <!-- Header điều hướng -->
    <div class="flex items-center gap-3">
      <NuxtLink
        to="/"
        class="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-brut border-2 border-line bg-surface text-ink hover:bg-surface-2 shadow-brut-sm cursor-pointer"
        aria-label="Quay lại trang chủ"
      >
        <ArrowLeft class="h-4 w-4" :stroke-width="2.5" />
      </NuxtLink>
      <div>
        <h1 class="text-2xl sm:text-3xl font-black">Nguồn dữ liệu & Giấy phép</h1>
        <p class="text-xs text-ink-soft">
          Minh bạch học liệu mở và ghi công bản quyền cộng đồng theo chuẩn CC BY-SA & Open Access
        </p>
      </div>
    </div>

    <!-- Giới thiệu cam kết mở -->
    <BaseCard tone="surface" class="p-5 sm:p-6 space-y-3">
      <div class="flex items-center gap-2">
        <div class="p-1.5 rounded-brut border-2 border-line bg-accent text-on-accent">
          <Database class="h-4 w-4" :stroke-width="2.5" />
        </div>
        <h2 class="font-display text-base font-black">Cam kết học liệu mở</h2>
      </div>
      <p class="text-xs sm:text-sm text-ink-soft leading-relaxed">
        {{ BRAND_NAME }} là nền tảng phi thương mại xây dựng vì cộng đồng. Chúng tôi trân trọng công sức của các nhà nghiên cứu và cộng đồng học thuật toàn cầu. Hệ thống chỉ sử dụng các tập dữ liệu mở có giấy phép cho phép chia sẻ hoặc học tập phi lợi nhuận, tuyệt đối không trích xuất trái phép (scrape) nội dung từ các từ điển thương mại có bản quyền đóng.
      </p>
    </BaseCard>

    <!-- Trạng thái Đang tải -->
    <div v-if="isLoading" class="space-y-4">
      <div
        v-for="i in 3"
        :key="i"
        class="rounded-brut-lg border-2 border-line bg-surface p-5 shadow-brut-sm space-y-3 animate-pulse"
      >
        <div class="h-6 w-1/3 bg-surface-2 rounded-brut" />
        <div class="h-4 w-full bg-surface-2 rounded-brut" />
        <div class="h-16 w-full bg-surface-2 rounded-brut" />
      </div>
    </div>

    <!-- Thông báo lỗi thân thiện -->
    <div
      v-else-if="errorMessage"
      class="rounded-brut border-2 border-bad bg-bad/10 p-4 text-xs sm:text-sm font-medium text-bad flex items-center gap-2"
    >
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Trạng thái Rỗng -->
    <div
      v-else-if="sources.length === 0"
      class="rounded-brut-lg border-2 border-line bg-surface p-8 text-center space-y-2 shadow-brut-sm"
    >
      <BookOpen class="h-8 w-8 mx-auto text-ink-soft" :stroke-width="2" />
      <p class="text-sm font-bold text-ink">Danh sách học liệu đang được cập nhật</p>
      <p class="text-xs text-ink-soft">
        Hệ thống đang đồng bộ dữ liệu nguồn từ các đối tác học thuật. Vui lòng quay lại sau ít phút.
      </p>
    </div>

    <!-- Danh sách các nguồn dữ liệu -->
    <div v-else class="space-y-4">
      <article
        v-for="src in sources"
        :key="src.id"
        class="rounded-brut-lg border-2 border-line bg-surface p-5 sm:p-6 shadow-brut-sm space-y-4"
      >
        <!-- Tiêu đề & Giấy phép -->
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="space-y-1">
            <h3 class="font-display text-lg font-black text-ink">
              {{ src.name }}
            </h3>
            <span class="font-mono text-[11px] font-bold text-ink-soft bg-surface-2 px-2 py-0.5 rounded-brut border border-line">
              Mã nhận diện: {{ src.code }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <BaseBadge v-if="src.license_name" tone="blue" size="sm">
              <Scale class="h-3 w-3 mr-1" />
              {{ src.license_name }}
            </BaseBadge>
            <BaseBadge v-if="src.requires_share_alike" tone="pink" size="sm">
              <Share2 class="h-3 w-3 mr-1" />
              Yêu cầu chia sẻ tương tự (Share-Alike)
            </BaseBadge>
          </div>
        </div>

        <!-- Mô tả -->
        <p v-if="src.description" class="text-xs sm:text-sm text-ink-soft leading-relaxed">
          {{ src.description }}
        </p>

        <!-- Trích dẫn ghi công (Attribution) -->
        <div v-if="src.attribution_text" class="rounded-brut border-2 border-line bg-surface-2 p-3.5 space-y-1">
          <span class="block font-mono text-[10px] font-black uppercase tracking-wider text-ink-soft">
            Trích dẫn ghi công bản quyền (Attribution statement):
          </span>
          <p class="font-mono text-xs text-ink leading-relaxed break-words select-all">
            {{ src.attribution_text }}
          </p>
        </div>

        <!-- Liên kết nguồn gốc -->
        <div class="pt-1 flex items-center justify-between text-xs">
          <a
            v-if="src.source_url"
            :href="src.source_url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 font-bold text-accent underline underline-offset-4 hover:text-ink cursor-pointer"
          >
            <span>Trang chủ dự án / Kho lưu trữ nguồn</span>
            <ExternalLink class="h-3.5 w-3.5" :stroke-width="2.5" />
          </a>
          <a
            v-if="src.license_url"
            :href="src.license_url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 font-medium text-ink-soft hover:underline"
          >
            <span>Điều khoản giấy phép</span>
            <ExternalLink class="h-3 w-3" />
          </a>
        </div>
      </article>
    </div>
  </div>
</template>
