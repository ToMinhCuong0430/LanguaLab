<script setup lang="ts">
import { Home, RefreshCw, AlertOctagon, HelpCircle } from '@lucide/vue'
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => props.error.statusCode || 500)
const isDev = import.meta.dev

const errorDetails = computed(() => {
  switch (statusCode.value) {
    case 404:
      return {
        badge: 'LỖI 404',
        title: 'Trang không tồn tại',
        description: 'Đường dẫn bạn yêu cầu không tìm thấy hoặc đã được di chuyển sang vị trí mới.',
      }
    case 403:
      return {
        badge: 'LỖI 403',
        title: 'Truy cập bị từ chối',
        description: 'Bạn không có đủ quyền hạn để truy cập vào khu vực nội dung này.',
      }
    default:
      return {
        badge: `LỖI ${statusCode.value}`,
        title: 'Đã có sự cố xảy ra',
        description: 'Hệ thống gặp lỗi trong quá trình xử lý yêu cầu. Vui lòng thử lại sau giây lát.',
      }
  }
})

const handleError = () => clearError({ redirect: '/' })
const handleReload = () => {
  if (import.meta.client) {
    window.location.reload()
  }
}
</script>

<template>
  <div class="min-h-screen bg-bg text-ink flex flex-col items-center justify-center p-4 sm:p-6" data-feature="home">
    <div class="w-full max-w-lg border-[3px] border-line rounded-brut-lg bg-surface p-6 sm:p-8 shadow-brut text-center space-y-6">
      <!-- Badge mã lỗi -->
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-brut border-2 border-line bg-warn text-on-tone font-display font-black text-xs shadow-brut-sm">
        <AlertOctagon class="h-4 w-4" :stroke-width="2.5" />
        <span>{{ errorDetails.badge }}</span>
      </div>

      <!-- Minh họa Flat SVG Neo-brutalism -->
      <div class="mx-auto w-40 h-32 flex items-center justify-center">
        <svg viewBox="0 0 160 120" fill="none" class="w-full h-full select-none" aria-hidden="true">
          <!-- Hộp lỗi 404/500 -->
          <rect x="15" y="15" width="130" height="90" rx="8" fill="var(--surface-2)" stroke="#11141D" stroke-width="3.5" />
          <rect x="25" y="25" width="110" height="20" rx="4" fill="var(--bad)" stroke="#11141D" stroke-width="2.5" />
          <circle cx="35" cy="35" r="3" fill="#FFFFFF" />
          <circle cx="45" cy="35" r="3" fill="#FFFFFF" />
          <circle cx="55" cy="35" r="3" fill="#FFFFFF" />
          <!-- Chữ số lớn bên trong -->
          <text
            x="80"
            y="85"
            text-anchor="middle"
            font-family="var(--font-display)"
            font-weight="900"
            font-size="34"
            fill="#11141D"
          >
            {{ statusCode === 404 ? '404' : statusCode === 403 ? '403' : '500' }}
          </text>
        </svg>
      </div>

      <!-- Nội dung lỗi -->
      <div class="space-y-2">
        <h1 class="font-display font-black text-2xl sm:text-3xl text-ink">
          {{ errorDetails.title }}
        </h1>
        <p class="text-xs sm:text-sm text-ink-soft leading-relaxed max-w-md mx-auto">
          {{ errorDetails.description }}
        </p>
      </div>

      <!-- Hiển thị stack trace CHỈ TRONG MÔI TRƯỜNG DEV -->
      <div v-if="isDev && error.message" class="text-left p-3 rounded-brut border-2 border-line bg-surface-2 font-mono text-[11px] text-ink-soft overflow-x-auto max-h-36">
        <p class="font-bold text-bad">{{ error.message }}</p>
        <pre v-if="error.stack" class="mt-1 text-[10px]">{{ error.stack }}</pre>
      </div>

      <!-- Các nút hành động -->
      <div class="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-brut border-2 border-line bg-surface font-display text-xs font-bold text-ink shadow-brut-sm hover:bg-surface-2 brut-press cursor-pointer"
          @click="handleReload"
        >
          <RefreshCw class="h-4 w-4" :stroke-width="2.5" />
          <span>Thử lại</span>
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-2 px-5 py-2.5 rounded-brut border-2 border-line bg-warn font-display text-xs font-black text-on-tone shadow-brut hover:bg-warn/90 brut-press cursor-pointer"
          @click="handleError"
        >
          <Home class="h-4 w-4" :stroke-width="2.5" />
          <span>Về trang chủ</span>
        </button>
      </div>
    </div>
  </div>
</template>
