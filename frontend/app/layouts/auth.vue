<script setup lang="ts">
import { Languages, Sun, Moon } from '@lucide/vue'
import { BRAND_NAME } from '~/constants/brand'
import AnimeSparkle from '~/components/illustration/AnimeSparkle.vue'

const { toggleTheme } = useTheme()
</script>

<template>
  <div class="min-h-screen flex flex-col bg-bg text-ink relative overflow-hidden bg-neo-grid dark:bg-neo-grid-dark">
    <!-- Anime decorative background elements -->
    <AnimeSparkle color="#FFD23F" color2="#FF70A6" color3="#2F5BFF" class="opacity-70" />

    <!-- Top Header nhỏ của trang Auth -->
    <header class="border-b-[3px] border-line bg-surface py-3 px-4 sm:px-8 relative z-10 shadow-brut-sm">
      <div class="mx-auto max-w-6xl flex items-center justify-between">
        <!-- Logo LanguaLab Neo-brutalism -->
        <NuxtLink to="/" class="flex items-center gap-2 min-h-[44px] text-decoration-none group">
          <div class="flex h-9 w-9 items-center justify-center rounded-brut border-2 border-line bg-warn shadow-brut-sm group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform hover-bounce">
            <Languages class="h-5 w-5 text-on-tone icon-bounce" :stroke-width="2.5" />
          </div>
          <span class="font-display text-2xl font-black text-ink tracking-tight">{{ BRAND_NAME }}</span>
        </NuxtLink>

        <!-- Nút chuyển Light/Dark mode -->
        <button
          type="button"
          class="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-brut border-2 border-line bg-surface shadow-brut-sm brut-press cursor-pointer hover:rotate-12 transition-transform"
          title="Đổi chế độ sáng / tối"
          aria-label="Đổi chế độ sáng / tối"
          @click="toggleTheme"
        >
          <Sun class="hidden dark:block h-4 w-4 text-warn" :stroke-width="2.5" />
          <Moon class="block dark:hidden h-4 w-4 text-ink" :stroke-width="2.5" />
        </button>
      </div>
    </header>

    <!-- Main Content Form -->
    <main class="flex-1 flex items-center justify-center p-4 sm:p-6 py-12 relative z-10">
      <slot />
    </main>

    <!-- Footer gọn gàng cho Auth -->
    <footer class="border-t-2 border-line/40 py-4 text-center text-xs text-ink-soft relative z-10 bg-surface/80 backdrop-blur-sm">
      <p>© {{ new Date().getFullYear() }} {{ BRAND_NAME }}. Nền tảng học ngoại ngữ & luyện thi mở phi thương mại.</p>
    </footer>
  </div>
</template>
