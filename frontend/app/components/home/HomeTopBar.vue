<script setup lang="ts">
import {
  Search,
  Flame,
  Check,
  Zap,
  Bell,
  CheckCheck,
  X,
  Loader2,
  ArrowRight,
} from '@lucide/vue'
import { useGlobalSearch, type GlobalSearchResultItem } from '~/composables/useGlobalSearch'

const {
  user,
  notifications,
  unreadNotificationsCount,
  toggleCheckIn,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = useHomeData()

const {
  searchQuery,
  isSearching,
  results,
  clearSearch,
} = useGlobalSearch()

const searchInputRef = ref<HTMLInputElement | null>(null)
const searchContainerRef = ref<HTMLElement | null>(null)
const isSearchOpen = ref(false)
const selectedResultIndex = ref(-1)

// Danh sách phẳng tất cả kết quả để phục vụ điều hướng bằng phím
const flatResults = computed<GlobalSearchResultItem[]>(() => {
  const list: GlobalSearchResultItem[] = []
  for (const group of results.value) {
    list.push(...group.items)
  }
  return list
})

watch(searchQuery, (val) => {
  isSearchOpen.value = val.trim().length >= 2
  selectedResultIndex.value = -1
})

const isNotificationOpen = ref(false)
const notificationRef = ref<HTMLElement | null>(null)

const toggleNotification = () => {
  isNotificationOpen.value = !isNotificationOpen.value
}

const closeNotification = () => {
  isNotificationOpen.value = false
}

// Bấm phím mũi tên / Enter / Esc trong ô tìm kiếm
const handleSearchKeyDown = (e: KeyboardEvent) => {
  if (!isSearchOpen.value) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (flatResults.value.length === 0) return
    selectedResultIndex.value = (selectedResultIndex.value + 1) % flatResults.value.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (flatResults.value.length === 0) return
    selectedResultIndex.value =
      selectedResultIndex.value <= 0 ? flatResults.value.length - 1 : selectedResultIndex.value - 1
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (selectedResultIndex.value >= 0 && selectedResultIndex.value < flatResults.value.length) {
      const target = flatResults.value[selectedResultIndex.value]
      navigateTo(target.path)
      isSearchOpen.value = false
    }
  } else if (e.key === 'Escape') {
    isSearchOpen.value = false
    searchInputRef.value?.blur()
  }
}

// Phím tắt toàn cục: '/' hoặc 'Ctrl+K' / 'Cmd+K' để focus ô tìm
const handleGlobalKeyDown = (e: KeyboardEvent) => {
  if (
    (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) ||
    ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K'))
  ) {
    e.preventDefault()
    searchInputRef.value?.focus()
    searchInputRef.value?.select()
  }

  if (e.key === 'Escape') {
    if (isSearchOpen.value) isSearchOpen.value = false
    if (isNotificationOpen.value) isNotificationOpen.value = false
  }
}

// Click outside để đóng dropdowns
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  if (notificationRef.value && !notificationRef.value.contains(target)) {
    closeNotification()
  }
  if (searchContainerRef.value && !searchContainerRef.value.contains(target)) {
    isSearchOpen.value = false
  }
}

onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleGlobalKeyDown)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleGlobalKeyDown)
  }
})
</script>

<template>
  <div
    id="home-top-bar"
    class="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-brut-lg border-[3px] border-line bg-surface p-3.5 sm:p-4 shadow-brut relative z-30"
  >
    <!-- Ô tìm kiếm nhanh toàn cục có Dropdown & Phím tắt -->
    <div ref="searchContainerRef" class="flex-1 max-w-md relative">
      <div class="relative flex items-center">
        <Search class="absolute left-3.5 h-4 w-4 text-ink-soft pointer-events-none" :stroke-width="2.5" />
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          placeholder="Tìm bài học, từ vựng, video... (Phím / hoặc Ctrl+K)"
          class="w-full rounded-brut border-2 border-line bg-surface-2 py-2 pl-9 pr-9 text-sm font-medium text-ink placeholder:text-ink-soft outline-none transition-all focus:border-ink focus:bg-surface focus:shadow-brut-sm"
          @focus="isSearchOpen = searchQuery.trim().length >= 2"
          @keydown="handleSearchKeyDown"
        >
        <!-- Icon Loading hoặc Xoá -->
        <div class="absolute right-3 flex items-center">
          <Loader2 v-if="isSearching" class="h-4 w-4 animate-spin text-ink-soft" />
          <button
            v-else-if="searchQuery"
            type="button"
            class="p-0.5 rounded text-ink-soft hover:text-ink cursor-pointer"
            @click="clearSearch"
          >
            <X class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <!-- Dropdown kết quả tìm kiếm -->
      <div
        v-if="isSearchOpen"
        class="absolute left-0 top-12 z-50 w-full rounded-brut-lg border-[3px] border-line bg-surface shadow-brut-lg overflow-hidden max-h-[420px] overflow-y-auto"
      >
        <!-- Đang tìm kiếm -->
        <div v-if="isSearching && results.length === 0" class="p-6 text-center text-xs text-ink-soft flex items-center justify-center gap-2">
          <Loader2 class="h-4 w-4 animate-spin" />
          <span>Đang tìm kiếm...</span>
        </div>

        <!-- Không có kết quả -->
        <div v-else-if="!isSearching && results.length === 0" class="p-6 text-center text-xs text-ink-soft">
          Không tìm thấy bài học hay từ vựng nào khớp với "<strong class="text-ink">{{ searchQuery }}</strong>"
        </div>

        <!-- Danh sách kết quả phân nhóm -->
        <div v-else class="divide-y-2 border-line">
          <div v-for="group in results" :key="group.group" class="p-2">
            <!-- Nhãn nhóm chức năng -->
            <div class="flex items-center gap-1.5 px-2 py-1 mb-1">
              <span
                class="inline-block h-2.5 w-2.5 rounded-full border border-line"
                :style="{ backgroundColor: group.color }"
              />
              <span class="font-display font-black text-[11px] uppercase tracking-wide text-ink">
                {{ group.label }}
              </span>
            </div>

            <!-- Các mục trong nhóm -->
            <div class="space-y-1">
              <NuxtLink
                v-for="item in group.items"
                :key="item.id"
                :to="item.path"
                class="flex items-center justify-between p-2 rounded-brut border-2 border-transparent hover:border-line hover:bg-surface-2 transition-all cursor-pointer text-decoration-none group"
                :class="{
                  'border-line bg-surface-2': flatResults[selectedResultIndex]?.id === item.id
                }"
                @click="isSearchOpen = false"
              >
                <div class="min-w-0 pr-2">
                  <p class="font-display font-bold text-xs text-ink truncate group-hover:underline">
                    {{ item.title }}
                  </p>
                  <p v-if="item.subtitle" class="text-[11px] text-ink-soft truncate">
                    {{ item.subtitle }}
                  </p>
                </div>
                <ArrowRight class="h-3.5 w-3.5 text-ink-soft group-hover:text-ink shrink-0" />
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Footer hướng dẫn bàn phím -->
        <div class="p-2 border-t border-line/20 bg-surface-2 text-[10px] text-ink-soft flex items-center justify-between">
          <span>Dùng phím <kbd class="px-1 py-0.5 rounded border border-line bg-surface">↑</kbd> <kbd class="px-1 py-0.5 rounded border border-line bg-surface">↓</kbd> để chọn</span>
          <span><kbd class="px-1 py-0.5 rounded border border-line bg-surface">Enter</kbd> xem chi tiết</span>
        </div>
      </div>
    </div>

    <!-- Cụm chức năng: Điểm danh + Streak, XP, Chuông thông báo -->
    <div class="flex flex-wrap items-center justify-between sm:justify-end gap-2.5">
      <!-- Streak & Điểm danh -->
      <div class="flex items-center gap-1.5">
        <!-- Khối hiển thị số ngày streak -->
        <div
          class="flex items-center gap-1.5 rounded-brut border-2 border-line bg-surface-2 px-3 py-1.5 font-display text-sm font-black text-ink shadow-brut-sm"
          title="Chuỗi ngày học liên tục"
        >
          <Flame class="h-4 w-4 text-bad fill-bad animate-pulse" :stroke-width="2.5" />
          <span>{{ user.streakDays }} ngày</span>
        </div>

        <!-- Nút điểm danh hôm nay -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-brut border-2 border-line px-3 py-1.5 font-display text-xs font-bold transition-all shadow-brut-sm cursor-pointer brut-press"
          :class="user.checkedInToday ? 'bg-ok text-on-tone' : 'bg-warn text-on-tone'"
          :disabled="user.checkedInToday"
          @click="toggleCheckIn"
        >
          <Check v-if="user.checkedInToday" class="h-3.5 w-3.5" :stroke-width="3" />
          <span>{{ user.checkedInToday ? 'Đã điểm danh' : 'Điểm danh (+20 XP)' }}</span>
        </button>
      </div>

      <!-- Khối hiển thị XP -->
      <div
        class="flex items-center gap-1.5 rounded-brut border-2 border-line bg-surface-2 px-3 py-1.5 font-display text-sm font-black text-ink shadow-brut-sm"
        title="Tổng điểm kinh nghiệm tích luỹ"
      >
        <Zap class="h-4 w-4 text-warn fill-warn" :stroke-width="2.5" />
        <span>{{ user.xp }} XP</span>
      </div>

      <!-- Chuông thông báo -->
      <div ref="notificationRef" class="relative">
        <button
          type="button"
          class="relative flex h-9 w-9 items-center justify-center rounded-brut border-2 border-line bg-surface shadow-brut-sm transition-all hover:bg-surface-2 cursor-pointer brut-press"
          :aria-expanded="isNotificationOpen"
          aria-label="Thông báo"
          @click="toggleNotification"
        >
          <Bell class="h-4 w-4 text-ink" :stroke-width="2.5" />
          <span
            v-if="unreadNotificationsCount > 0"
            class="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-line bg-bad px-1 text-[10px] font-black text-white"
          >
            {{ unreadNotificationsCount }}
          </span>
        </button>

        <!-- Menu dropdown thông báo -->
        <div
          v-if="isNotificationOpen"
          class="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-brut-lg border-[3px] border-line bg-surface p-4 shadow-brut-lg"
        >
          <div class="flex items-center justify-between border-b-2 border-line pb-3 mb-3">
            <h3 class="font-display font-black text-sm text-ink">Thông báo học tập</h3>
            <div class="flex items-center gap-2">
              <button
                v-if="unreadNotificationsCount > 0"
                type="button"
                class="flex items-center gap-1 text-[11px] font-bold text-accent hover:underline cursor-pointer"
                @click="markAllNotificationsAsRead"
              >
                <CheckCheck class="h-3.5 w-3.5" />
                <span>Đã đọc tất cả</span>
              </button>
              <button
                type="button"
                class="text-ink-soft hover:text-ink cursor-pointer"
                @click="closeNotification"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="max-h-80 overflow-y-auto space-y-2">
            <div
              v-for="item in notifications"
              :key="item.id"
              class="group flex items-start gap-2.5 rounded-brut border-2 p-2.5 transition-all cursor-pointer"
              :class="item.isRead ? 'border-transparent bg-surface-2/40 opacity-75' : 'border-line bg-surface shadow-brut-sm'"
              @click="markNotificationAsRead(item.id)"
            >
              <div class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-xs">
                <Bell class="h-3 w-3 text-ink" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-display font-bold text-xs text-ink truncate">{{ item.title }}</p>
                <p class="text-xs text-ink-soft line-clamp-2 mt-0.5">{{ item.content }}</p>
                <span class="text-[10px] font-medium text-ink-soft mt-1 block">{{ item.timeAgo }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
