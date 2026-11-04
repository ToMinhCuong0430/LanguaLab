<script setup lang="ts">
import { Languages } from '@lucide/vue'
import { BRAND_NAME } from '~/constants/brand'

// Layout cho khách chưa đăng nhập ở "/": header dính tối giản và footer một dòng, không navbar / footer của app
const year = new Date().getFullYear()
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-bg text-ink" data-feature="home">
    <header class="sticky top-0 z-30 border-b-[1px] border-line bg-bg">
      <div class="mx-auto flex h-16 w-full max-w-[988px] items-center justify-between gap-4 px-4">
        <NuxtLink to="/" class="flex min-h-[44px] items-center gap-2 text-ink" :aria-label="`${BRAND_NAME}, trang chủ`">
          <span class="flex h-9 w-9 items-center justify-center rounded-brut border-[1px] border-line bg-warn text-on-tone">
            <Languages class="h-5 w-5" :stroke-width="2.5" aria-hidden="true" />
          </span>
          <span class="font-display text-xl font-black tracking-tight">{{ BRAND_NAME }}</span>
        </NuxtLink>
        <BaseButton to="/dang-ky" variant="success" size="sm">Bắt đầu học</BaseButton>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t-[1px] border-line">
      <div class="mx-auto flex w-full max-w-[988px] flex-wrap items-center gap-x-5 gap-y-1 px-4 py-4 text-xs font-bold text-ink-soft">
        <span>© {{ year }} {{ BRAND_NAME }}</span>
        <NuxtLink to="/dieu-khoan" class="inline-flex min-h-[44px] items-center hover:text-ink hover:underline">Điều khoản sử dụng</NuxtLink>
        <NuxtLink to="/chinh-sach-quyen-rieng-tu" class="inline-flex min-h-[44px] items-center hover:text-ink hover:underline">Chính sách quyền riêng tư</NuxtLink>
      </div>
    </footer>
  </div>
</template>
