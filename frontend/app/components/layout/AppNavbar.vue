<script setup lang="ts">
import {
  Sun,
  Moon,
  Menu,
  X,
  Languages,
  LogOut,
  Target,
  ShieldCheck,
  User,
  Settings,
} from '@lucide/vue'
import OnboardingModal from '~/components/auth/OnboardingModal.vue'
import { BRAND_NAME } from '~/constants/brand'

const { items, isActive } = useNavigation()
const { isDark, toggleTheme } = useTheme()
const { user, profile, isAdmin, signOut } = useAuth()

const isMobileMenuOpen = ref(false)
const isUserMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)

// Feature color map for inline styles
const featureColorMap: Record<string, string> = {
  'home':              'var(--c-blue)',
  'go-cau':            'var(--c-green)',
  'video-podcast':     'var(--c-blue)',
  'ngu-phap':          'var(--c-yellow)',
  'tu-vung':           'var(--c-pink)',
  'doc-dich':          'var(--c-orange)',
  'tu-dien':           'var(--c-violet)',
  'luyen-thi':         'var(--c-coral)',
  'yeu-cau-tinh-nang': 'var(--c-cyan)',
}

function getFeatureColor(feature: string) {
  return featureColorMap[feature] ?? 'var(--c-blue)'
}

function getFeatureInk(feature: string) {
  if (feature === 'home' || feature === 'video-podcast' || !featureColorMap[feature]) {
    return '#FFFFFF'
  }
  return 'var(--ink)'
}

const closeMobileMenu = () => { isMobileMenuOpen.value = false }
const toggleUserMenu = () => { isUserMenuOpen.value = !isUserMenuOpen.value }
const closeUserMenu = () => { isUserMenuOpen.value = false }

/** Falls back to email prefix when full_name is empty */
const displayName = computed(() => {
  if (profile.value?.full_name) return profile.value.full_name
  if (user.value?.email) return user.value.email.split('@')[0]
  return 'Hồ sơ'
})

const handleClickOutside = (event: MouseEvent) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    closeUserMenu()
  }
}

const route = useRoute()
watch(() => route.path, () => {
  closeMobileMenu()
  closeUserMenu()
})

onMounted(() => {
  if (import.meta.client) document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  if (import.meta.client) document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b-[3px] border-line bg-surface">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
      <!-- Brand Logo -->
      <NuxtLink to="/" class="group flex items-center gap-2 flex-shrink-0 text-decoration-none min-h-[44px]" aria-label="Trang chủ LanguaLab">
        <div class="flex h-9 w-9 items-center justify-center rounded-brut border-2 border-line bg-warn shadow-brut-sm transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5">
          <Languages class="h-5 w-5 text-on-tone" :stroke-width="2.5" />
        </div>
        <span class="font-display text-xl font-black tracking-tight text-ink">{{ BRAND_NAME }}</span>
      </NuxtLink>

      <!-- Desktop Navigation -->
      <nav class="hidden lg:flex items-center gap-1 overflow-x-auto py-1" aria-label="Điều hướng chính">
        <NuxtLink
          v-for="item in items"
          :key="item.path"
          :to="item.path"
          class="nav-chip"
          :class="{ 'nav-chip--active': isActive(item.path) }"
          :style="isActive(item.path) ? { backgroundColor: getFeatureColor(item.feature), color: getFeatureInk(item.feature), borderColor: 'var(--line)' } : {}"
          :aria-current="isActive(item.path) ? 'page' : undefined"
        >
          <span
            class="nav-chip__icon"
            :style="{ backgroundColor: getFeatureColor(item.feature) }"
          >
            <component :is="item.icon" class="h-3.5 w-3.5" :style="{ color: isActive(item.path) ? getFeatureInk(item.feature) : 'var(--ink)' }" :stroke-width="2.5" />
          </span>
          <span class="nav-chip__label" :style="{ color: isActive(item.path) ? getFeatureInk(item.feature) : 'inherit' }">{{ item.shortTitle }}</span>
        </NuxtLink>
      </nav>

      <!-- Actions -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <!-- Logged in: User menu -->
        <div v-if="user" ref="userMenuRef" class="relative">
          <button
            type="button"
            class="flex items-center gap-2 rounded-brut border-2 border-line bg-surface py-1 px-2.5 min-h-[44px] text-ink shadow-brut-sm brut-press cursor-pointer"
            aria-label="Menu tài khoản"
            :aria-expanded="isUserMenuOpen"
            @click.stop="toggleUserMenu"
          >
            <div class="flex h-7 w-7 items-center justify-center rounded-brut border border-line bg-accent text-accent-ink font-display text-xs font-black overflow-hidden">
              <img
                v-if="profile?.avatar_url"
                :src="profile.avatar_url"
                alt="Avatar"
                class="h-full w-full object-cover"
              />
              <span v-else>{{ profile?.avatar_text || 'LA' }}</span>
            </div>
            <span class="font-display text-xs font-bold hidden sm:inline max-w-[90px] truncate">
              {{ displayName }}
            </span>
          </button>

          <div
            v-if="isUserMenuOpen"
            class="absolute right-0 top-11 z-50 w-64 rounded-brut-lg border-[3px] border-line bg-surface p-4 shadow-brut-lg text-ink"
            role="menu"
          >
            <div class="border-b-2 border-line pb-3 mb-2">
              <p class="font-display font-black text-sm truncate">{{ displayName }}</p>
              <p class="text-xs text-ink-soft truncate">{{ user.email }}</p>
              <div v-if="profile?.target_exam" class="mt-2 flex items-center gap-1 text-[11px] font-bold text-ink">
                <Target class="h-3 w-3 text-accent" />
                <span>{{ profile.target_exam.toUpperCase() }} • Band {{ profile.target_band }}</span>
              </div>
            </div>
            <div class="space-y-1">
              <NuxtLink
                to="/cai-dat?tab=profile"
                class="flex w-full items-center gap-2 rounded-brut border border-transparent p-2 text-xs font-bold text-ink hover:border-line hover:bg-surface-2 cursor-pointer transition-all"
                @click="closeUserMenu"
              >
                <User class="h-4 w-4" :stroke-width="2.5" />
                <span>Hồ sơ học tập</span>
              </NuxtLink>

              <NuxtLink
                to="/cai-dat?tab=settings"
                class="flex w-full items-center gap-2 rounded-brut border border-transparent p-2 text-xs font-bold text-ink hover:border-line hover:bg-surface-2 cursor-pointer transition-all"
                @click="closeUserMenu"
              >
                <Settings class="h-4 w-4" :stroke-width="2.5" />
                <span>Cài đặt & Bảo mật</span>
              </NuxtLink>

              <NuxtLink
                v-if="isAdmin"
                to="/admin"
                class="flex w-full items-center gap-2 rounded-brut border border-line bg-surface-2 p-2 text-xs font-bold text-ink hover:bg-surface cursor-pointer transition-all mb-1"
                @click="closeUserMenu"
              >
                <ShieldCheck class="h-4 w-4 text-ink" :stroke-width="2.5" />
                <span>Quản trị viên (Admin)</span>
              </NuxtLink>
              <button
                type="button"
                class="flex w-full items-center gap-2 rounded-brut border border-transparent p-2 text-xs font-bold text-bad hover:border-line hover:bg-bad/10 cursor-pointer transition-all"
                @click="signOut"
              >
                <LogOut class="h-4 w-4" :stroke-width="2.5" />
                <span>Đăng xuất tài khoản</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Not logged in -->
        <div v-else class="hidden sm:flex items-center gap-2">
          <NuxtLink
            to="/dang-nhap"
            class="rounded-brut border-2 border-line bg-surface px-3 py-1.5 font-display text-xs font-bold text-ink shadow-brut-sm hover:bg-surface-2 brut-press transition-all"
          >
            Đăng nhập
          </NuxtLink>
          <NuxtLink
            to="/dang-ky"
            class="rounded-brut border-2 border-line bg-warn px-3 py-1.5 font-display text-xs font-black text-on-tone shadow-brut-sm brut-press transition-all"
          >
            Đăng ký
          </NuxtLink>
        </div>

        <!-- Theme toggle -->
        <button
          type="button"
          class="theme-toggle-btn"
          :aria-label="isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'"
          @click="toggleTheme"
        >
          <Sun v-if="isDark" class="h-5 w-5 text-warn" :stroke-width="2.5" />
          <Moon v-else class="h-5 w-5 text-ink" :stroke-width="2.5" />
        </button>

        <!-- Mobile menu toggle -->
        <button
          type="button"
          class="lg:hidden mobile-toggle-btn"
          :aria-label="isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <X v-if="isMobileMenuOpen" class="h-6 w-6" :stroke-width="2.5" />
          <Menu v-else class="h-6 w-6" :stroke-width="2.5" />
        </button>
      </div>
    </div>

    <!-- Mobile Drawer -->
    <div
      v-if="isMobileMenuOpen"
      class="lg:hidden border-t-[3px] border-line bg-surface px-4 pb-4 pt-3 shadow-brut"
    >
      <div v-if="!user" class="flex gap-2 border-b-2 border-line pb-3 mb-3">
        <NuxtLink to="/dang-nhap" class="flex-1 text-center py-2 rounded-brut border-2 border-line bg-surface font-display text-xs font-bold text-ink shadow-brut-sm" @click="closeMobileMenu">Đăng nhập</NuxtLink>
        <NuxtLink to="/dang-ky" class="flex-1 text-center py-2 rounded-brut border-2 border-line bg-warn font-display text-xs font-black text-on-tone shadow-brut-sm" @click="closeMobileMenu">Đăng ký</NuxtLink>
      </div>

      <nav class="grid grid-cols-2 gap-2" aria-label="Điều hướng mobile">
        <NuxtLink
          v-for="item in items"
          :key="item.path"
          :to="item.path"
          class="mobile-nav-chip"
          :class="{ 'mobile-nav-chip--active': isActive(item.path) }"
          :style="isActive(item.path) ? { backgroundColor: getFeatureColor(item.feature), color: getFeatureInk(item.feature) } : {}"
          @click="closeMobileMenu"
        >
          <span class="mobile-nav-chip__icon" :style="{ backgroundColor: isActive(item.path) ? 'rgba(0,0,0,0.15)' : getFeatureColor(item.feature) }">
            <component :is="item.icon" class="h-4 w-4" :style="{ color: isActive(item.path) ? getFeatureInk(item.feature) : 'var(--ink)' }" :stroke-width="2.5" />
          </span>
          <span class="text-xs font-bold leading-tight" :style="{ color: isActive(item.path) ? getFeatureInk(item.feature) : 'inherit' }">{{ item.shortTitle }}</span>
        </NuxtLink>
      </nav>
    </div>

    <OnboardingModal />
  </header>
</template>

<style scoped>
.nav-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.5rem 0.3rem 0.3rem;
  border: 2px solid transparent;
  border-radius: var(--radius);
  text-decoration: none;
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--ink);
  white-space: nowrap;
  transition: background-color 0.1s ease, border-color 0.1s ease, box-shadow 0.1s ease;
}

.nav-chip:hover {
  background: var(--surface-2);
  border-color: var(--line);
}

.nav-chip--active {
  color: var(--ink);
  border-color: var(--line) !important;
  box-shadow: 2px 2px 0 var(--line);
}

.nav-chip__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 1.5px solid var(--line);
  flex-shrink: 0;
}

.nav-chip__label {
  line-height: 1;
}

.theme-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border: var(--bw) solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: transform 0.08s ease, box-shadow 0.08s ease;
}

.theme-toggle-btn:hover {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 var(--line);
}

.theme-toggle-btn:focus-visible,
.mobile-toggle-btn:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
}

.mobile-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  border: var(--bw) solid var(--line);
  border-radius: var(--radius);
  background: var(--surface-2);
  color: var(--ink);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
}

.mobile-nav-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border: 2px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
  text-decoration: none;
  color: var(--ink);
  box-shadow: 2px 2px 0 var(--line);
  transition: transform 0.08s ease;
}

.mobile-nav-chip:hover {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--line);
}

.mobile-nav-chip--active {
  color: var(--ink);
}

.mobile-nav-chip__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: 1.5px solid var(--line);
  flex-shrink: 0;
}
</style>
