<script setup lang="ts">
import {
  User,
  Settings,
  Flame,
  Zap,
  BookOpen,
  Calendar,
  Camera,
  Trash2,
  Lock,
  Moon,
  Sun,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Target,
  LogOut,
} from '@lucide/vue'
import type { Database } from '~/types/database.types'
import { translateSupabaseError } from '~/utils/supabaseErrors'

const route = useRoute()
const router = useRouter()
const colorMode = useColorMode()
const client = useSupabaseClient<Database>()
const { user, profile, fetchProfile, signOut } = useAuth()
const { todayStats, user: homeUser } = useHomeData()
const { resetVisit } = useFirstVisit('home')

// Quản lý tab: 'profile' (Hồ sơ) hoặc 'settings' (Cài đặt)
const activeTab = ref<'profile' | 'settings'>('profile')

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab === 'settings' || newTab === 'profile') {
      activeTab.value = newTab
    }
  },
  { immediate: true }
)

const changeTab = (tab: 'profile' | 'settings') => {
  activeTab.value = tab
  router.replace({ query: { ...route.query, tab } })
}

// -------------------------------------------------------------
// 1. CHỈNH SỬA HỒ SƠ
// -------------------------------------------------------------
const profileForm = reactive({
  full_name: '',
  avatar_text: '',
  avatar_url: '',
  learning_lang: 'en' as 'en' | 'zh' | 'ja',
  target_exam: 'ielts' as 'ielts' | 'toeic' | 'toefl' | 'hsk' | 'jlpt',
  current_band: 5.5,
  target_band: 7.0,
  target_exam_date: '',
})

// Khởi tạo form từ profile hiện có
watch(
  profile,
  (p) => {
    if (p) {
      profileForm.full_name = p.full_name || ''
      profileForm.avatar_text = p.avatar_text || ''
      profileForm.avatar_url = p.avatar_url || ''
      profileForm.learning_lang = (p.learning_lang as any) || 'en'
      profileForm.target_exam = (p.target_exam as any) || 'ielts'
      profileForm.current_band = p.current_band !== null ? Number(p.current_band) : 5.5
      profileForm.target_band = p.target_band !== null ? Number(p.target_band) : 7.0
      profileForm.target_exam_date = p.target_exam_date || ''
    }
  },
  { immediate: true }
)

const isSavingProfile = ref(false)
const profileMessage = ref<{ type: 'ok' | 'err'; text: string } | null>(null)

const validateProfileForm = (): string | null => {
  if (!profileForm.full_name.trim()) {
    return 'Họ và tên không được để trống.'
  }
  if (profileForm.current_band < 0 || profileForm.current_band > 9) {
    return 'Band điểm hiện tại phải từ 0 đến 9.'
  }
  if (profileForm.target_band < 0 || profileForm.target_band > 9) {
    return 'Band điểm mục tiêu phải từ 0 đến 9.'
  }
  if (profileForm.target_exam_date) {
    const selected = new Date(profileForm.target_exam_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selected < today) {
      return 'Ngày thi mục tiêu không được ở trong quá khứ.'
    }
  }
  return null
}

const saveProfile = async () => {
  profileMessage.value = null
  const err = validateProfileForm()
  if (err) {
    profileMessage.value = { type: 'err', text: err }
    return
  }

  if (!user.value) return
  isSavingProfile.value = true

  try {
    const { error } = await client
      .from('profiles')
      .update({
        full_name: profileForm.full_name.trim(),
        avatar_text: profileForm.avatar_text.trim() || profileForm.full_name.trim().slice(0, 2).toUpperCase(),
        learning_lang: profileForm.learning_lang,
        target_exam: profileForm.target_exam,
        current_band: profileForm.current_band,
        target_band: profileForm.target_band,
        target_exam_date: profileForm.target_exam_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.value.id)

    if (error) {
      profileMessage.value = { type: 'err', text: translateSupabaseError(error) }
    } else {
      await fetchProfile()
      profileMessage.value = { type: 'ok', text: 'Cập nhật thông tin hồ sơ thành công!' }
    }
  } catch (e: any) {
    profileMessage.value = { type: 'err', text: e.message || 'Lỗi hệ thống' }
  } finally {
    isSavingProfile.value = false
  }
}

// -------------------------------------------------------------
// 2. UPLOAD & XOÁ ẢNH ĐẠI DIỆN
// -------------------------------------------------------------
const avatarFileInput = ref<HTMLInputElement | null>(null)
const isUploadingAvatar = ref(false)

const triggerAvatarUpload = () => {
  avatarFileInput.value?.click()
}

const handleAvatarChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !user.value) return

  // Kiểm tra kích thước <= 2MB
  if (file.size > 2 * 1024 * 1024) {
    profileMessage.value = { type: 'err', text: 'Ảnh đại diện tối đa 2MB. Vui lòng chọn ảnh nhỏ hơn.' }
    input.value = ''
    return
  }

  // Kiểm tra định dạng
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
  if (!allowed.includes(file.type)) {
    profileMessage.value = { type: 'err', text: 'Chỉ chấp nhận file ảnh PNG, JPG hoặc WEBP.' }
    input.value = ''
    return
  }

  isUploadingAvatar.value = true
  profileMessage.value = null

  try {
    const ext = file.name.split('.').pop() || 'png'
    const filePath = `${user.value.id}/avatar.${ext}`

    const { error: uploadError } = await client.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      profileMessage.value = { type: 'err', text: `Lỗi upload: ${uploadError.message}` }
      return
    }

    // Lấy URL công khai (public url)
    const { data: urlData } = client.storage.from('avatars').getPublicUrl(filePath)
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

    // Cập nhật profile
    await client
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.value.id)

    profileForm.avatar_url = publicUrl
    await fetchProfile()
    profileMessage.value = { type: 'ok', text: 'Cập nhật ảnh đại diện thành công!' }
  } catch (err: any) {
    profileMessage.value = { type: 'err', text: err.message }
  } finally {
    isUploadingAvatar.value = false
    input.value = ''
  }
}

const removeAvatar = async () => {
  if (!user.value || !profileForm.avatar_url) return
  if (!confirm('Bạn có chắc muốn xoá ảnh đại diện này không?')) return

  isUploadingAvatar.value = true
  try {
    await client
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.value.id)

    profileForm.avatar_url = ''
    await fetchProfile()
    profileMessage.value = { type: 'ok', text: 'Đã xoá ảnh đại diện.' }
  } catch (err: any) {
    profileMessage.value = { type: 'err', text: err.message }
  } finally {
    isUploadingAvatar.value = false
  }
}

// -------------------------------------------------------------
// 3. CÀI ĐẶT: GIAO DIỆN, TOUR, ĐỔI MẬT KHẨU
// -------------------------------------------------------------
const passwordForm = reactive({
  new_password: '',
  confirm_password: '',
})
const isChangingPassword = ref(false)
const passwordMessage = ref<{ type: 'ok' | 'err'; text: string } | null>(null)

const changePassword = async () => {
  passwordMessage.value = null
  if (!passwordForm.new_password || passwordForm.new_password.length < 8) {
    passwordMessage.value = { type: 'err', text: 'Mật khẩu mới phải có tối thiểu 8 ký tự.' }
    return
  }
  if (passwordForm.new_password !== passwordForm.confirm_password) {
    passwordMessage.value = { type: 'err', text: 'Mật khẩu xác nhận không khớp.' }
    return
  }

  isChangingPassword.value = true
  try {
    const { error } = await client.auth.updateUser({
      password: passwordForm.new_password,
    })

    if (error) {
      passwordMessage.value = { type: 'err', text: translateSupabaseError(error) }
    } else {
      passwordMessage.value = { type: 'ok', text: 'Đổi mật khẩu thành công!' }
      passwordForm.new_password = ''
      passwordForm.confirm_password = ''
    }
  } catch (err: any) {
    passwordMessage.value = { type: 'err', text: err.message }
  } finally {
    isChangingPassword.value = false
  }
}

const resetAllGuides = () => {
  resetVisit()
  // Xóa toàn bộ cờ hướng dẫn khác trong localStorage
  if (import.meta.client) {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('first_visit_')) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k))
  }
  alert('Đã bật lại toàn bộ hướng dẫn lần đầu! Các hộp hướng dẫn sẽ xuất hiện khi bạn mở các trang tương ứng.')
}

// -------------------------------------------------------------
// 4. XOÁ TÀI KHOẢN VĨNH VIỄN
// -------------------------------------------------------------
const deleteConfirmText = ref('')
const isDeletingAccount = ref(false)
const deleteErrorMsg = ref('')

const canDeleteAccount = computed(() => deleteConfirmText.value.trim().toUpperCase() === 'XOA')

const handleDeleteAccount = async () => {
  if (!canDeleteAccount.value) return
  isDeletingAccount.value = true
  deleteErrorMsg.value = ''

  try {
    const { error } = await client.functions.invoke('delete-account')
    if (error) {
      deleteErrorMsg.value = 'Không xoá được tài khoản. Hãy thử lại sau.'
      isDeletingAccount.value = false
      return
    }

    await signOut()
    await router.push('/')
  } catch (err: any) {
    deleteErrorMsg.value = err.message || 'Lỗi hệ thống khi xoá tài khoản.'
    isDeletingAccount.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8" data-feature="home">
    <!-- Header -->
    <div class="border-[3px] border-line rounded-brut-lg bg-surface p-6 shadow-brut flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-display font-black text-2xl sm:text-3xl text-ink">Hồ sơ & Cài đặt</h1>
        <p class="text-xs sm:text-sm text-ink-soft mt-1">Quản lý thông tin cá nhân, mục tiêu chứng chỉ và tuỳ chọn ứng dụng.</p>
      </div>

      <!-- Tabs chuyển đổi -->
      <div class="flex items-center gap-2 p-1.5 rounded-brut border-2 border-line bg-surface-2 self-start sm:self-auto">
        <button
          type="button"
          class="flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-brut border-2 font-display text-xs font-bold transition-all cursor-pointer"
          :class="activeTab === 'profile' ? 'border-line bg-surface text-ink shadow-brut-sm' : 'border-transparent text-ink-soft hover:text-ink'"
          @click="changeTab('profile')"
        >
          <User class="h-3.5 w-3.5" :stroke-width="2.5" />
          <span>Hồ sơ học tập</span>
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-brut border-2 font-display text-xs font-bold transition-all cursor-pointer"
          :class="activeTab === 'settings' ? 'border-line bg-surface text-ink shadow-brut-sm' : 'border-transparent text-ink-soft hover:text-ink'"
          @click="changeTab('settings')"
        >
          <Settings class="h-3.5 w-3.5" :stroke-width="2.5" />
          <span>Cài đặt & Bảo mật</span>
        </button>
      </div>
    </div>

    <!-- ==================== TAB 1: HỒ SƠ HỌC TẬP ==================== -->
    <div v-if="activeTab === 'profile'" class="space-y-6">
      <!-- Thống kê học tập cá nhân -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div class="p-4 rounded-brut border-[3px] border-line bg-surface shadow-brut">
          <div class="flex items-center gap-2 text-ink-soft text-xs font-bold mb-1">
            <Zap class="h-4 w-4 text-warn fill-warn" />
            <span>Tổng XP</span>
          </div>
          <p class="font-display font-black text-2xl text-ink">{{ homeUser.xp }}</p>
        </div>

        <div class="p-4 rounded-brut border-[3px] border-line bg-surface shadow-brut">
          <div class="flex items-center gap-2 text-ink-soft text-xs font-bold mb-1">
            <Flame class="h-4 w-4 text-bad fill-bad" />
            <span>Chuỗi Streak</span>
          </div>
          <p class="font-display font-black text-2xl text-ink">{{ homeUser.streakDays }} ngày</p>
        </div>

        <div class="p-4 rounded-brut border-[3px] border-line bg-surface shadow-brut">
          <div class="flex items-center gap-2 text-ink-soft text-xs font-bold mb-1">
            <BookOpen class="h-4 w-4 text-accent" />
            <span>Từ đã học</span>
          </div>
          <p class="font-display font-black text-2xl text-ink">{{ todayStats.newWordsLearned }}</p>
        </div>

        <div class="p-4 rounded-brut border-[3px] border-line bg-surface shadow-brut">
          <div class="flex items-center gap-2 text-ink-soft text-xs font-bold mb-1">
            <Target class="h-4 w-4 text-ok" />
            <span>Band hiện tại / Mục tiêu</span>
          </div>
          <p class="font-display font-black text-xl text-ink">
            {{ profileForm.current_band }} → {{ profileForm.target_band }}
          </p>
        </div>
      </div>

      <!-- Form thông tin cá nhân & Ảnh đại diện -->
      <BaseCard title="Thông tin người học" accent="left" accent-color="var(--c-blue)">
        <!-- Thông báo lưu -->
        <div
          v-if="profileMessage"
          class="p-3.5 rounded-brut border-2 mb-5 flex items-start gap-2.5 text-xs font-bold"
          :class="profileMessage.type === 'ok' ? 'border-ok bg-ok/15 text-ok' : 'border-bad bg-bad/15 text-bad'"
        >
          <CheckCircle2 v-if="profileMessage.type === 'ok'" class="h-4 w-4 shrink-0" />
          <AlertTriangle v-else class="h-4 w-4 shrink-0" />
          <span>{{ profileMessage.text }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <!-- Cột trái: Ảnh đại diện -->
          <div class="md:col-span-4 flex flex-col items-center p-4 border-2 border-line rounded-brut bg-surface-2/40 text-center space-y-3">
            <div class="relative group">
              <!-- Avatar ảnh hoặc chữ -->
              <div class="h-28 w-28 rounded-full border-[3px] border-line overflow-hidden bg-warn flex items-center justify-center font-display font-black text-2xl text-on-tone shadow-brut">
                <img
                  v-if="profileForm.avatar_url"
                  :src="profileForm.avatar_url"
                  alt="Avatar"
                  class="h-full w-full object-cover"
                />
                <span v-else>{{ profileForm.avatar_text || 'LA' }}</span>
              </div>

              <!-- Nút tải ảnh nổi trên avatar -->
              <button
                type="button"
                class="absolute bottom-0 right-0 h-11 w-11 min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-full border-2 border-line bg-surface hover:bg-surface-2 text-ink shadow-brut-sm cursor-pointer"
                title="Thay đổi ảnh đại diện"
                aria-label="Thay đổi ảnh đại diện"
                @click="triggerAvatarUpload"
              >
                <Camera class="h-4 w-4" />
              </button>
            </div>

            <!-- Input file ẩn -->
            <input
              ref="avatarFileInput"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="hidden"
              @change="handleAvatarChange"
            />

            <div>
              <p class="font-display font-black text-xs text-ink">{{ user?.email }}</p>
              <p class="text-[11px] text-ink-soft">PNG, JPG, WEBP tối đa 2MB</p>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="px-3.5 py-2 min-h-[44px] text-xs font-bold rounded-brut border-2 border-line bg-surface hover:bg-surface-2 cursor-pointer shadow-brut-sm inline-flex items-center"
                :disabled="isUploadingAvatar"
                @click="triggerAvatarUpload"
              >
                {{ isUploadingAvatar ? 'Đang tải...' : 'Tải ảnh mới' }}
              </button>

              <button
                v-if="profileForm.avatar_url"
                type="button"
                class="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-xs rounded-brut border-2 border-line bg-surface hover:bg-bad/10 text-bad cursor-pointer shadow-brut-sm"
                title="Xoá ảnh hiện tại"
                aria-label="Xoá ảnh đại diện hiện tại"
                @click="removeAvatar"
              >
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <!-- Cột phải: Các trường thông tin -->
          <div class="md:col-span-8 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Họ và tên -->
              <div>
                <label class="block text-xs font-black text-ink mb-1">Họ và tên *</label>
                <input
                  v-model="profileForm.full_name"
                  type="text"
                  class="w-full p-2.5 text-xs rounded-brut border-2 border-line bg-surface text-ink font-bold focus:outline-none focus:border-ink"
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </div>

              <!-- Chữ viết tắt Avatar -->
              <div>
                <label class="block text-xs font-black text-ink mb-1">Chữ viết tắt Avatar (2 ký tự)</label>
                <input
                  v-model="profileForm.avatar_text"
                  type="text"
                  maxlength="3"
                  class="w-full p-2.5 text-xs rounded-brut border-2 border-line bg-surface text-ink uppercase font-bold focus:outline-none focus:border-ink"
                  placeholder="LA"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Ngôn ngữ học mặc định -->
              <div>
                <label class="block text-xs font-black text-ink mb-1">Ngôn ngữ theo học chính</label>
                <select
                  v-model="profileForm.learning_lang"
                  class="w-full p-2.5 text-xs rounded-brut border-2 border-line bg-surface text-ink font-bold focus:outline-none cursor-pointer"
                >
                  <option value="en">Tiếng Anh (English)</option>
                  <option value="zh">Tiếng Trung (中文)</option>
                  <option value="ja">Tiếng Nhật (日本語)</option>
                </select>
              </div>

              <!-- Chứng chỉ mục tiêu -->
              <div>
                <label class="block text-xs font-black text-ink mb-1">Kỳ thi mục tiêu</label>
                <select
                  v-model="profileForm.target_exam"
                  class="w-full p-2.5 text-xs rounded-brut border-2 border-line bg-surface text-ink font-bold focus:outline-none cursor-pointer"
                >
                  <option value="ielts">IELTS Academic / General</option>
                  <option value="toeic">TOEIC 4 Kỹ năng</option>
                  <option value="toefl">TOEFL iBT</option>
                  <option value="hsk">HSK (Tiếng Trung)</option>
                  <option value="jlpt">JLPT (Tiếng Nhật)</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- Band hiện tại -->
              <div>
                <label class="block text-xs font-black text-ink mb-1">Band hiện tại</label>
                <input
                  v-model.number="profileForm.current_band"
                  type="number"
                  step="0.5"
                  min="0"
                  max="9"
                  class="w-full p-2.5 text-xs rounded-brut border-2 border-line bg-surface text-ink font-bold focus:outline-none"
                />
              </div>

              <!-- Band mục tiêu -->
              <div>
                <label class="block text-xs font-black text-ink mb-1">Band mục tiêu</label>
                <input
                  v-model.number="profileForm.target_band"
                  type="number"
                  step="0.5"
                  min="0"
                  max="9"
                  class="w-full p-2.5 text-xs rounded-brut border-2 border-line bg-surface text-ink font-bold focus:outline-none"
                />
              </div>

              <!-- Ngày thi dự kiến -->
              <div>
                <label class="block text-xs font-black text-ink mb-1">Ngày thi dự kiến</label>
                <input
                  v-model="profileForm.target_exam_date"
                  type="date"
                  class="w-full p-2.5 text-xs rounded-brut border-2 border-line bg-surface text-ink font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <BaseButton tone="warn" :disabled="isSavingProfile" @click="saveProfile">
              <span>{{ isSavingProfile ? 'Đang lưu...' : 'Lưu thay đổi hồ sơ' }}</span>
            </BaseButton>
          </div>
        </template>
      </BaseCard>
    </div>

    <!-- ==================== TAB 2: CÀI ĐẶT & BẢO MẬT ==================== -->
    <div v-else class="space-y-6">
      <!-- Cài đặt giao diện & Hướng dẫn -->
      <BaseCard title="Tuỳ chọn ứng dụng">
        <div class="space-y-5">
          <!-- Chế độ màu (Sáng / Tối / Hệ thống) -->
          <div>
            <label class="block text-xs font-black text-ink mb-2">Chế độ hiển thị (Theme):</label>
            <div class="grid grid-cols-3 gap-3 max-w-md">
              <button
                type="button"
                class="flex items-center justify-center gap-2 p-2.5 min-h-[44px] rounded-brut border-2 font-display text-xs font-bold cursor-pointer transition-all"
                :class="colorMode.preference === 'light' ? 'border-line bg-surface-2 shadow-brut-sm text-ink' : 'border-line/40 bg-surface text-ink-soft'"
                @click="colorMode.preference = 'light'"
              >
                <Sun class="h-4 w-4" />
                <span>Sáng</span>
              </button>

              <button
                type="button"
                class="flex items-center justify-center gap-2 p-2.5 min-h-[44px] rounded-brut border-2 font-display text-xs font-bold cursor-pointer transition-all"
                :class="colorMode.preference === 'dark' ? 'border-line bg-surface-2 shadow-brut-sm text-ink' : 'border-line/40 bg-surface text-ink-soft'"
                @click="colorMode.preference = 'dark'"
              >
                <Moon class="h-4 w-4" />
                <span>Tối</span>
              </button>

              <button
                type="button"
                class="flex items-center justify-center gap-2 p-2.5 min-h-[44px] rounded-brut border-2 font-display text-xs font-bold cursor-pointer transition-all"
                :class="colorMode.preference === 'system' ? 'border-line bg-surface-2 shadow-brut-sm text-ink' : 'border-line/40 bg-surface text-ink-soft'"
                @click="colorMode.preference = 'system'"
              >
                <Laptop class="h-4 w-4" />
                <span>Hệ thống</span>
              </button>
            </div>
          </div>

          <!-- Bật lại hướng dẫn lần đầu -->
          <div class="pt-4 border-t-2 border-line/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p class="font-display font-black text-xs text-ink">Bật lại hướng dẫn lần đầu (Tour)</p>
              <p class="text-xs text-ink-soft">Khôi phục các gợi ý tính năng xuất hiện lần đầu trên các trang.</p>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-brut border-2 border-line bg-surface hover:bg-surface-2 font-display text-xs font-bold text-ink shadow-brut-sm cursor-pointer self-start sm:self-auto"
              @click="resetAllGuides"
            >
              <RotateCcw class="h-3.5 w-3.5" />
              <span>Khôi phục hướng dẫn</span>
            </button>
          </div>
        </div>
      </BaseCard>

      <!-- Đổi mật khẩu -->
      <BaseCard title="Đổi mật khẩu tài khoản" accent="left" accent-color="var(--c-violet)">
        <div class="max-w-md space-y-4">
          <div
            v-if="passwordMessage"
            class="p-3.5 rounded-brut border-2 flex items-start gap-2.5 text-xs font-bold"
            :class="passwordMessage.type === 'ok' ? 'border-ok bg-ok/15 text-ok' : 'border-bad bg-bad/15 text-bad'"
          >
            <CheckCircle2 v-if="passwordMessage.type === 'ok'" class="h-4 w-4 shrink-0" />
            <AlertTriangle v-else class="h-4 w-4 shrink-0" />
            <span>{{ passwordMessage.text }}</span>
          </div>

          <div>
            <label class="block text-xs font-black text-ink mb-1">Mật khẩu mới (Tối thiểu 8 ký tự)</label>
            <input
              v-model="passwordForm.new_password"
              type="password"
              class="w-full p-2.5 text-xs rounded-brut border-2 border-line bg-surface text-ink focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label class="block text-xs font-black text-ink mb-1">Xác nhận mật khẩu mới</label>
            <input
              v-model="passwordForm.confirm_password"
              type="password"
              class="w-full p-2.5 text-xs rounded-brut border-2 border-line bg-surface text-ink focus:outline-none"
              placeholder="••••••••"
            />
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <BaseButton tone="neutral" :disabled="isChangingPassword" @click="changePassword">
              <Lock class="h-3.5 w-3.5 mr-1" />
              <span>{{ isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu' }}</span>
            </BaseButton>
          </div>
        </template>
      </BaseCard>

      <!-- Vùng nguy hiểm: Xoá tài khoản -->
      <BaseCard title="Vùng nguy hiểm: Xoá tài khoản" accent="left" accent-color="var(--bad)">
        <div class="space-y-4">
          <p class="text-xs sm:text-sm text-ink-soft leading-relaxed">
            Toàn bộ tiến độ học tập, điểm XP, lượt thi thử, bài ghi âm nói và dữ liệu cá nhân của bạn sẽ bị xoá vĩnh viễn khỏi máy chủ và không thể khôi phục.
          </p>

          <div class="p-3.5 rounded-brut border-2 border-bad bg-bad/10 text-xs font-bold text-bad">
            Gõ chữ <strong class="underline">XOA</strong> vào ô bên dưới để xác nhận hành động xoá tài khoản:
          </div>

          <div v-if="deleteErrorMsg" class="text-xs font-bold text-bad">
            {{ deleteErrorMsg }}
          </div>

          <div class="max-w-xs">
            <input
              v-model="deleteConfirmText"
              type="text"
              class="w-full p-2.5 text-xs font-mono font-black uppercase rounded-brut border-2 border-bad bg-surface text-bad focus:outline-none"
              placeholder="Gõ XOA"
            />
          </div>

          <button
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-brut border-2 border-line bg-bad text-white font-display text-xs font-black shadow-brut hover:bg-bad/90 disabled:opacity-40 cursor-pointer"
            :disabled="!canDeleteAccount || isDeletingAccount"
            @click="handleDeleteAccount"
          >
            <Trash2 class="h-4 w-4" />
            <span>{{ isDeletingAccount ? 'Đang xoá vĩnh viễn...' : 'Xác nhận xoá tài khoản vĩnh viễn' }}</span>
          </button>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
