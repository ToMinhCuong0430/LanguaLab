<script setup lang="ts">
import {
  Sun,
  Moon,
  Languages,
  LogOut,
  Target,
  ShieldCheck,
  User,
  Settings,
  Laptop,
  Clock,
  Check,
  TrendingUp,
  School,
  Presentation,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from '@lucide/vue'
import OnboardingModal from '~/components/auth/OnboardingModal.vue'
import { BRAND_NAME } from '~/constants/brand'

const { items, isActive } = useNavigation()
const { mode: themeMode, setMode: setThemeMode } = useTheme()
const { user, profile, isAdmin, signOut } = useAuth()
const { isTeacher, loadRole } = useClasses()
watch(() => user.value?.sub, (uid) => { if (uid && import.meta.client) loadRole() }, { immediate: true })

// ─── Sidebar state ───────────────────────────────────────────────────
const { isExpanded, toggle: toggleSidebar } = useSidebar()

onMounted(() => {
  if (!import.meta.client) return
  const saved = localStorage.getItem('sidebar-expanded')
  if (saved !== null) {
    isExpanded.value = saved === 'true'
  } else {
    // Mobile/tablet: collapsed mặc định; desktop: mở rộng
    isExpanded.value = window.innerWidth >= 1024
  }
  // Nếu resize xuống mobile thì tự thu gọn
  window.addEventListener('resize', () => {
    if (window.innerWidth < 768 && isExpanded.value) {
      isExpanded.value = false
    }
  })
})

// ─── Mobile bottom-nav ────────────────────────────────────────────────
const isMobile = ref(false)
onMounted(() => {
  if (!import.meta.client) return
  const mq = window.matchMedia('(max-width: 767px)')
  isMobile.value = mq.matches
  mq.addEventListener('change', (e) => { isMobile.value = e.matches })
})

// ─── User / Theme menus ────────────────────────────────────────────────
const isUserMenuOpen = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const isThemeMenuOpen = ref(false)
const themeMenuRef = ref<HTMLElement | null>(null)

const themeOptions = [
  { value: 'light', label: 'Sáng', icon: Sun },
  { value: 'dark', label: 'Tối', icon: Moon },
  { value: 'system', label: 'Theo hệ thống', icon: Laptop },
  { value: 'auto', label: 'Theo giờ (18h–5h tối)', icon: Clock },
] as const

const chooseTheme = (value: (typeof themeOptions)[number]['value']) => {
  setThemeMode(value)
  isThemeMenuOpen.value = false
}

// Feature color map
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
  if (feature === 'home' || feature === 'video-podcast' || !featureColorMap[feature]) return '#FFFFFF'
  return 'var(--ink)'
}

const displayName = computed(() => {
  if (profile.value?.full_name) return profile.value.full_name
  if (user.value?.email) return user.value.email.split('@')[0]
  return 'Hồ sơ'
})

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
  isThemeMenuOpen.value = false
}
const toggleThemeMenu = () => {
  isThemeMenuOpen.value = !isThemeMenuOpen.value
  isUserMenuOpen.value = false
}
const closeUserMenu = () => { isUserMenuOpen.value = false }

const handleClickOutside = (event: MouseEvent) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) closeUserMenu()
  if (themeMenuRef.value && !themeMenuRef.value.contains(event.target as Node)) isThemeMenuOpen.value = false
}

const route = useRoute()
watch(() => route.path, () => {
  closeUserMenu()
  isThemeMenuOpen.value = false
})

onMounted(() => { if (import.meta.client) document.addEventListener('click', handleClickOutside) })
onUnmounted(() => { if (import.meta.client) document.removeEventListener('click', handleClickOutside) })
</script>

<template>
  <!-- ══════════════════════════════════════════
       SIDEBAR  (mọi màn hình)
  ══════════════════════════════════════════ -->
  <aside
    class="sidebar"
    :class="isExpanded ? 'sidebar--expanded' : 'sidebar--collapsed'"
    :aria-label="'Thanh điều hướng chính'"
  >
    <!-- ── Toggle button ── -->
    <button
      type="button"
      class="sidebar-toggle"
      :aria-label="isExpanded ? 'Thu gọn sidebar' : 'Mở rộng sidebar'"
      @click="toggleSidebar"
    >
      <PanelLeftClose v-if="isExpanded" class="h-4 w-4" :stroke-width="2.5" />
      <PanelLeftOpen v-else class="h-4 w-4" :stroke-width="2.5" />
    </button>

    <!-- ── Brand Logo ── -->
    <NuxtLink
      to="/"
      class="brand-link"
      :class="{ 'brand-link--collapsed': !isExpanded }"
      aria-label="Trang chủ LanguaLab"
    >
      <div class="brand-icon">
        <Languages class="h-5 w-5 text-on-tone" :stroke-width="2.5" />
      </div>
      <Transition name="label-fade">
        <span v-if="isExpanded" class="brand-name">{{ BRAND_NAME }}</span>
      </Transition>
    </NuxtLink>

    <!-- ── Nav divider ── -->
    <div class="sidebar-divider" />

    <!-- ── Navigation items ── -->
    <nav class="sidebar-nav" aria-label="Điều hướng chính">
      <NuxtLink
        v-for="item in items"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ 'nav-item--active': isActive(item.path) }"
        :style="isActive(item.path)
          ? { backgroundColor: getFeatureColor(item.feature), borderColor: 'var(--line)' }
          : {}"
        :aria-current="isActive(item.path) ? 'page' : undefined"
        :title="!isExpanded ? item.shortTitle : undefined"
      >
        <!-- Icon box -->
        <span
          class="nav-item__icon"
          :style="{ backgroundColor: getFeatureColor(item.feature) }"
        >
          <component
            :is="item.icon"
            class="h-4 w-4 icon-wiggle"
            :style="{ color: isActive(item.path) ? getFeatureInk(item.feature) : 'var(--ink)' }"
            :stroke-width="2.5"
          />
        </span>

        <!-- Label (hidden when collapsed) -->
        <Transition name="label-fade">
          <span
            v-if="isExpanded"
            class="nav-item__label"
            :style="{ color: isActive(item.path) ? getFeatureInk(item.feature) : 'inherit' }"
          >{{ item.shortTitle }}</span>
        </Transition>

        <!-- Active indicator dot (collapsed state) -->
        <span v-if="!isExpanded && isActive(item.path)" class="active-dot" />
      </NuxtLink>
    </nav>

    <!-- ── Bottom section: user + theme ── -->
    <div class="sidebar-bottom">
      <div class="sidebar-divider" />

      <!-- Theme toggle -->
      <div ref="themeMenuRef" class="relative">
        <button
          type="button"
          class="nav-item nav-item--action w-full"
          aria-label="Chọn chế độ hiển thị"
          :aria-expanded="isThemeMenuOpen"
          @click.stop="toggleThemeMenu"
        >
          <span class="nav-item__icon bg-surface-2">
            <Sun class="hidden dark:block h-4 w-4 text-warn" :stroke-width="2.5" />
            <Moon class="block dark:hidden h-4 w-4 text-ink" :stroke-width="2.5" />
          </span>
          <Transition name="label-fade">
            <span v-if="isExpanded" class="nav-item__label">Giao diện</span>
          </Transition>
        </button>

        <!-- Theme dropdown — opens upward -->
        <div
          v-if="isThemeMenuOpen"
          class="theme-dropdown"
          :class="isExpanded ? 'theme-dropdown--expanded' : 'theme-dropdown--collapsed'"
          role="menu"
          @keydown.esc="isThemeMenuOpen = false"
        >
          <button
            v-for="opt in themeOptions"
            :key="opt.value"
            type="button"
            role="menuitemradio"
            :aria-checked="themeMode === opt.value"
            class="theme-opt"
            :class="{ 'theme-opt--active': themeMode === opt.value }"
            @click="chooseTheme(opt.value)"
          >
            <component :is="opt.icon" class="h-4 w-4" :stroke-width="2.5" />
            <span class="flex-1 text-left text-xs">{{ opt.label }}</span>
            <Check v-if="themeMode === opt.value" class="h-3.5 w-3.5" :stroke-width="2.5" />
          </button>
        </div>
      </div>

      <!-- User menu -->
      <div ref="userMenuRef" class="relative">
        <!-- Logged in -->
        <button
          v-if="user"
          type="button"
          class="nav-item nav-item--user w-full"
          aria-label="Menu tài khoản"
          :aria-expanded="isUserMenuOpen"
          @click.stop="toggleUserMenu"
        >
          <span class="nav-item__avatar">
            <img
              v-if="profile?.avatar_url"
              :src="profile.avatar_url"
              alt="Avatar"
              class="h-full w-full object-cover"
            />
            <span v-else class="text-[10px] font-black">{{ profile?.avatar_text || 'LA' }}</span>
          </span>
          <Transition name="label-fade">
            <span v-if="isExpanded" class="nav-item__label truncate max-w-[110px]">{{ displayName }}</span>
          </Transition>
        </button>

        <!-- Not logged in -->
        <div v-else class="px-2 py-2 space-y-1">
          <NuxtLink
            to="/dang-nhap"
            class="sidebar-auth-btn sidebar-auth-btn--primary"
          >
            <Transition name="label-fade">
              <span v-if="isExpanded">Đăng nhập</span>
              <User v-else class="h-4 w-4" :stroke-width="2.5" />
            </Transition>
          </NuxtLink>
          <Transition name="label-fade">
            <NuxtLink
              v-if="isExpanded"
              to="/dang-ky"
              class="sidebar-auth-btn sidebar-auth-btn--ghost"
            >Đăng ký</NuxtLink>
          </Transition>
        </div>

        <!-- User dropdown -->
        <div
          v-if="isUserMenuOpen && user"
          class="user-dropdown"
          :class="isExpanded ? 'user-dropdown--expanded' : 'user-dropdown--collapsed'"
          role="menu"
        >
          <div class="border-b-2 border-line pb-3 mb-2 px-1">
            <p class="font-display font-black text-sm truncate">{{ displayName }}</p>
            <p class="text-xs text-ink-soft truncate">{{ user.email }}</p>
            <div v-if="profile?.target_exam" class="mt-1.5 flex items-center gap-1 text-[11px] font-bold">
              <Target class="h-3 w-3 text-accent" />
              <span>{{ profile.target_exam.toUpperCase() }} • Band {{ profile.target_band }}</span>
            </div>
          </div>

          <div class="space-y-0.5">
            <NuxtLink to="/cai-dat?tab=profile" class="user-menu-item" @click="closeUserMenu">
              <User class="h-4 w-4" :stroke-width="2.5" />
              <span>Hồ sơ học tập</span>
            </NuxtLink>
            <NuxtLink to="/tien-do" class="user-menu-item" @click="closeUserMenu">
              <TrendingUp class="h-4 w-4" :stroke-width="2.5" />
              <span>Tiến độ &amp; Lộ trình học</span>
            </NuxtLink>
            <NuxtLink to="/lop-hoc" class="user-menu-item" @click="closeUserMenu">
              <School class="h-4 w-4" :stroke-width="2.5" />
              <span>Lớp của tôi</span>
            </NuxtLink>
            <NuxtLink v-if="isTeacher" to="/giao-vien" class="user-menu-item user-menu-item--special" @click="closeUserMenu">
              <Presentation class="h-4 w-4" :stroke-width="2.5" />
              <span>Dạy học (Giáo viên)</span>
            </NuxtLink>
            <NuxtLink to="/cai-dat?tab=settings" class="user-menu-item" @click="closeUserMenu">
              <Settings class="h-4 w-4" :stroke-width="2.5" />
              <span>Cài đặt &amp; Bảo mật</span>
            </NuxtLink>
            <NuxtLink v-if="isAdmin" to="/admin" class="user-menu-item user-menu-item--special" @click="closeUserMenu">
              <ShieldCheck class="h-4 w-4" :stroke-width="2.5" />
              <span>Quản trị viên (Admin)</span>
            </NuxtLink>
            <button type="button" class="user-menu-item user-menu-item--danger w-full" @click="signOut">
              <LogOut class="h-4 w-4" :stroke-width="2.5" />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <OnboardingModal />
  </aside>

</template>

<style scoped>
/* ═══════════════════════════════════════
   SIDEBAR BASE
═══════════════════════════════════════ */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 40;
  flex-direction: column;
  overflow: hidden;
  background: #92B9E3;
  border-right: 3px solid var(--line);
  box-shadow: 4px 0 0 var(--line);
  transition: width 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: width;
}

.dark .sidebar {
  background: #2A2A2A;
}

.sidebar--expanded  { width: 220px; }
.sidebar--collapsed { width: 64px; }

/* ─── Toggle button ─── */
.sidebar-toggle {
  position: absolute;
  top: 12px;
  right: -14px;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius);
  border: 2px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  box-shadow: 2px 2px 0 var(--line);
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}
.sidebar-toggle:hover {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--line);
}

/* ─── Brand logo ─── */
.brand-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.75rem 0.75rem;
  text-decoration: none;
  min-height: 60px;
  flex-shrink: 0;
  overflow: hidden;
}
.brand-link--collapsed {
  justify-content: center;
  padding: 1rem 0;
}
.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: var(--radius);
  border: 2px solid var(--line);
  background: var(--warn);
  box-shadow: 2px 2px 0 var(--line);
  transition: transform 0.1s ease;
}
.brand-link:hover .brand-icon {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--line);
}
.brand-name {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 900;
  color: var(--ink);
  white-space: nowrap;
  letter-spacing: -0.02em;
}

/* ─── Divider ─── */
.sidebar-divider {
  height: 2px;
  background: var(--line);
  margin: 0.25rem 0.75rem;
  border-radius: 2px;
}

/* ─── Nav section ─── */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.375rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
  scrollbar-width: none;
}
.sidebar-nav::-webkit-scrollbar { display: none; }

/* ─── Nav item ─── */
.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.5rem;
  border-radius: var(--radius);
  border: 2px solid transparent;
  text-decoration: none;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  cursor: pointer;
  background: transparent;
  transition: background 0.12s ease, border-color 0.12s ease, transform 0.1s ease, box-shadow 0.1s ease;
  min-height: 44px;
}
.nav-item:hover {
  background: rgba(0,0,0,0.08);
  border-color: var(--line);
}
.dark .nav-item:hover {
  background: rgba(255,255,255,0.07);
}
.nav-item--active {
  border-color: var(--line) !important;
  box-shadow: 2px 2px 0 var(--line);
  color: var(--ink) !important;
}
.nav-item--action {
  text-align: left;
}

/* ─── Icon box inside nav item ─── */
.nav-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 6px;
  border: 1.5px solid var(--line);
}

/* ─── Avatar chip ─── */
.nav-item__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 6px;
  border: 2px solid var(--line);
  background: var(--accent);
  color: var(--accent-ink);
  font-family: var(--font-display);
  overflow: hidden;
}

.nav-item__label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Active dot (collapsed mode) */
.active-dot {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ink);
  border: 1px solid var(--line);
}

/* ─── Bottom section ─── */
.sidebar-bottom {
  padding: 0 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* ─── Auth buttons ─── */
.sidebar-auth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: var(--radius);
  border: 2px solid var(--line);
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 800;
  text-decoration: none;
  box-shadow: 2px 2px 0 var(--line);
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  cursor: pointer;
  min-height: 36px;
}
.sidebar-auth-btn:hover {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0 var(--line);
}
.sidebar-auth-btn--primary {
  background: var(--surface);
  color: var(--ink);
}
.sidebar-auth-btn--ghost {
  background: transparent;
  border-color: transparent;
  color: var(--ink);
  box-shadow: none;
  font-size: 0.7rem;
}

/* ─── Theme dropdown ─── */
.theme-dropdown {
  position: absolute;
  bottom: calc(100% + 6px);
  z-index: 60;
  width: 200px;
  border-radius: var(--radius);
  border: 3px solid var(--line);
  background: var(--surface);
  padding: 0.375rem;
  box-shadow: 4px 4px 0 var(--line);
}
.theme-dropdown--expanded { left: 0; }
.theme-dropdown--collapsed { left: 68px; bottom: 0; }

.theme-opt {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.5rem;
  border-radius: 6px;
  border: 2px solid transparent;
  background: transparent;
  color: var(--ink);
  cursor: pointer;
  min-height: 40px;
  transition: background 0.1s ease, border-color 0.1s ease;
  font-family: var(--font-display);
  font-weight: 700;
}
.theme-opt:hover { background: var(--surface-2); border-color: var(--line); }
.theme-opt--active { background: var(--surface-2); border-color: var(--line); }

/* ─── User dropdown ─── */
.user-dropdown {
  position: absolute;
  bottom: calc(100% + 6px);
  z-index: 60;
  width: 240px;
  border-radius: var(--radius);
  border: 3px solid var(--line);
  background: var(--surface);
  padding: 0.75rem;
  box-shadow: 4px 4px 0 var(--line);
}
.user-dropdown--expanded { left: 0; }
.user-dropdown--collapsed { left: 68px; bottom: 0; }

.user-menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.45rem 0.5rem;
  border-radius: 6px;
  border: 2px solid transparent;
  background: transparent;
  color: var(--ink);
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  min-height: 36px;
  transition: background 0.1s ease, border-color 0.1s ease;
}
.user-menu-item:hover { background: var(--surface-2); border-color: var(--line); }
.user-menu-item--special { background: var(--surface-2); border-color: var(--line); }
.user-menu-item--danger { color: var(--bad); }
.user-menu-item--danger:hover { background: color-mix(in srgb, var(--bad) 10%, transparent); }

/* ═══════════════════════════════════════
   LABEL FADE TRANSITION
═══════════════════════════════════════ */
.label-fade-enter-active {
  transition: opacity 0.18s ease 0.1s, transform 0.18s ease 0.1s;
}
.label-fade-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.label-fade-enter-from,
.label-fade-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}

/* ═══════════════════════════════════════
   MOBILE BOTTOM NAV
═══════════════════════════════════════ */
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  display: flex;
  align-items: stretch;
  background: var(--surface);
  border-top: 3px solid var(--line);
  box-shadow: 0 -3px 0 var(--line);
  padding: 0;
  height: 58px;
}

.mobile-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 4px;
  text-decoration: none;
  color: var(--ink-soft);
  transition: color 0.12s ease;
  min-width: 0;
}
.mobile-nav-item--active {
  color: var(--ink) !important;
}
.mobile-nav-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1.5px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.mobile-nav-item--active .mobile-nav-item__icon {
  border-color: var(--line);
}
.mobile-nav-item__label {
  font-size: 0.6rem;
  font-weight: 700;
  font-family: var(--font-display);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 56px;
}
</style>
