<script setup lang="ts">
import {
  LayoutDashboard,
  BookOpen,
  Keyboard,
  BookMarked,
  Play,
  Search,
  Trophy,
  ArrowLeft,
  FileSpreadsheet,
  LogOut,
  ShieldAlert,
  Users,
  BarChart3,
  ScrollText,
} from '@lucide/vue'
import { BRAND_NAME } from '~/constants/brand'

useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})

const { user, profile, signOut } = useAuth()
const route = useRoute()

const navItems = [
  { title: 'Tổng quan & Lịch sử', path: '/admin', icon: LayoutDashboard },
  { title: 'Thống kê nền tảng', path: '/admin/thong-ke', icon: BarChart3 },
  { title: 'Người dùng', path: '/admin/nguoi-dung', icon: Users },
  { title: 'Nhật ký hoạt động', path: '/admin/nhat-ky', icon: ScrollText },
  { title: 'Nhập dữ liệu (Import)', path: '/admin/import', icon: FileSpreadsheet },
  { title: 'Từ vựng (Vocab)', path: '/admin/vocab', icon: BookOpen },
  { title: 'Gõ câu (Typing)', path: '/admin/typing', icon: Keyboard },
  { title: 'Ngữ pháp (Grammar)', path: '/admin/grammar', icon: BookOpen },
  { title: 'Kho đọc & Dịch', path: '/admin/reading', icon: BookMarked },
  { title: 'Video & Podcast', path: '/admin/media', icon: Play },
  { title: 'Từ điển (Dictionary)', path: '/admin/dictionary', icon: Search },
  { title: 'Luyện thi IELTS', path: '/admin/ielts', icon: Trophy },
]

const isActive = (path: string) => {
  if (path === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="min-h-screen bg-bg text-ink flex flex-col md:flex-row" data-feature="admin">
    <!-- Sidebar Admin -->
    <aside class="w-full md:w-64 border-b-[3px] md:border-b-0 md:border-r-[3px] border-line bg-surface flex flex-col shrink-0">
      <!-- Header -->
      <div class="p-4 sm:p-5 border-b-[3px] border-line flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="h-9 w-9 rounded-brut border-2 border-line bg-surface-2 flex items-center justify-center font-display font-black text-xs shadow-brut-sm">
            ADM
          </div>
          <div>
            <h2 class="font-display font-black text-sm leading-tight text-ink">{{ BRAND_NAME }} Admin</h2>
            <p class="text-[11px] font-bold text-ink-soft">Quản trị nội dung</p>
          </div>
        </div>

        <NuxtLink
          to="/"
          class="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1 text-xs font-bold text-ink-soft hover:text-ink hover:underline p-1"
          title="Về khu học tập"
          aria-label="Về khu học tập"
        >
          <ArrowLeft class="h-4 w-4" />
          <span class="hidden sm:inline">Về học</span>
        </NuxtLink>
      </div>

      <!-- Navigation links -->
      <nav class="p-3 space-y-1.5 flex-1 overflow-y-auto">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-brut border-2 text-xs font-bold transition-all brut-press"
          :class="[
            isActive(item.path)
              ? 'border-line bg-surface-2 text-ink shadow-brut-sm font-black'
              : 'border-transparent text-ink-soft hover:border-line hover:bg-surface-2/60 hover:text-ink'
          ]"
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0" :stroke-width="2.5" />
          <span>{{ item.title }}</span>
        </NuxtLink>
      </nav>

      <!-- User footer -->
      <div class="p-3.5 border-t-2 border-line bg-surface-2/40">
        <div class="flex items-center justify-between">
          <div class="truncate pr-2">
            <p class="font-display font-black text-xs truncate">{{ profile?.full_name || 'Admin' }}</p>
            <p class="text-[10px] text-ink-soft truncate">{{ user?.email }}</p>
          </div>
          <button
            type="button"
            class="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-brut border-2 border-line bg-surface hover:bg-bad/10 text-bad shadow-brut-sm cursor-pointer"
            title="Đăng xuất"
            aria-label="Đăng xuất"
            @click="signOut"
          >
            <LogOut class="h-4 w-4" :stroke-width="2.5" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 min-w-0 flex flex-col">
      <slot />
    </main>
  </div>
</template>
