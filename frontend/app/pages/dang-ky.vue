<script setup lang="ts">
import { UserPlus, Mail, Lock, User, AlertCircle, ArrowRight } from '@lucide/vue'

definePageMeta({
  layout: 'auth',
})

useHead({
  title: 'Đăng ký tài khoản - Langua',
})

const { signUp, signInWithGoogle, isLoading, authError } = useAuth()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const clientError = ref<string | null>(null)
const successMsg = ref<string | null>(null)

const validateForm = (): boolean => {
  clientError.value = null

  if (!fullName.value.trim()) {
    clientError.value = 'Vui lòng nhập họ và tên của bạn.'
    return false
  }

  if (!email.value.trim()) {
    clientError.value = 'Vui lòng nhập địa chỉ email.'
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value.trim())) {
    clientError.value = 'Định dạng email không hợp lệ (ví dụ: ban@domain.com).'
    return false
  }

  if (!password.value || password.value.length < 8) {
    clientError.value = 'Mật khẩu phải có độ dài tối thiểu 8 ký tự.'
    return false
  }

  if (password.value !== confirmPassword.value) {
    clientError.value = 'Xác nhận mật khẩu không trùng khớp.'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm() || isLoading.value) return
  const res = await signUp(email.value, password.value, fullName.value)
  if (res.success && !res.data?.session) {
    successMsg.value = 'Đăng ký thành công! Vui lòng kiểm tra hộp thư email để kích hoạt tài khoản trước khi đăng nhập.'
  }
}

const handleGoogleSignUp = async () => {
  if (isLoading.value) return
  await signInWithGoogle()
}
</script>

<template>
  <div class="w-full max-w-md">
    <BaseCard tone="surface" class="p-6 sm:p-8">
      <template #header>
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="rounded border-2 border-line bg-ok px-2 py-0.5 font-display text-xs font-black text-on-tone">
              THÀNH VIÊN MỚI
            </span>
          </div>
          <h1 class="text-2xl font-black text-ink">
            Tạo tài khoản Langua
          </h1>
          <p class="text-xs text-ink-soft">
            Miễn phí 100%, không quảng cáo, mở trọn bộ kho học liệu
          </p>
        </div>
      </template>

      <!-- Thông báo thành công nếu cần xác thực email -->
      <div
        v-if="successMsg"
        class="mb-5 rounded-brut border-2 border-ok bg-ok/15 p-4 text-xs font-bold text-ink space-y-2"
      >
        <p class="text-sm font-black text-ok">🎉 Đăng ký thành công!</p>
        <p>{{ successMsg }}</p>
        <NuxtLink to="/dang-nhap" class="min-h-[44px] inline-flex items-center mt-2 font-black text-ink underline">
          Chuyển tới màn Đăng nhập →
        </NuxtLink>
      </div>

      <!-- Thông báo lỗi nếu có -->
      <div
        v-else-if="clientError || authError"
        class="mb-5 flex items-start gap-2.5 rounded-brut border-2 border-bad bg-bad/10 p-3 text-xs font-bold text-bad"
      >
        <AlertCircle class="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>{{ clientError || authError }}</span>
      </div>

      <!-- Form Đăng ký -->
      <form v-if="!successMsg" class="space-y-4" @submit.prevent="handleSubmit">
        <BaseInput
          v-model="fullName"
          label="Họ và tên hiển thị"
          placeholder="Ví dụ: Nguyễn Văn A"
          required
        >
          <template #prefix>
            <User class="h-4 w-4" :stroke-width="2.5" />
          </template>
        </BaseInput>

        <BaseInput
          v-model="email"
          label="Địa chỉ Email"
          type="email"
          placeholder="email@example.com"
          required
        >
          <template #prefix>
            <Mail class="h-4 w-4" :stroke-width="2.5" />
          </template>
        </BaseInput>

        <BaseInput
          v-model="password"
          label="Mật khẩu (tối thiểu 8 ký tự)"
          type="password"
          placeholder="Tạo mật khẩu an toàn..."
          required
        >
          <template #prefix>
            <Lock class="h-4 w-4" :stroke-width="2.5" />
          </template>
        </BaseInput>

        <BaseInput
          v-model="confirmPassword"
          label="Xác nhận lại mật khẩu"
          type="password"
          placeholder="Nhập lại mật khẩu vừa tạo..."
          required
        >
          <template #prefix>
            <Lock class="h-4 w-4" :stroke-width="2.5" />
          </template>
        </BaseInput>

        <div class="pt-2">
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            block
            :disabled="isLoading"
          >
            <UserPlus class="h-4 w-4" :stroke-width="2.5" />
            <span>{{ isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay' }}</span>
          </BaseButton>
        </div>
      </form>

      <!-- Đường kẻ phân cách -->
      <div v-if="!successMsg" class="relative my-6 text-center">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t-2 border-line/30" />
        </div>
        <span class="relative bg-surface px-3 text-xs font-bold uppercase text-ink-soft">
          Hoặc
        </span>
      </div>

      <!-- Đăng ký Google -->
      <div v-if="!successMsg">
        <button
          type="button"
          class="flex w-full min-h-[44px] items-center justify-center gap-2.5 rounded-brut border-2 border-line bg-surface py-2.5 px-4 font-display text-sm font-bold text-ink shadow-brut-sm hover:bg-surface-2 brut-press disabled:opacity-50 cursor-pointer transition-all"
          :disabled="isLoading"
          @click="handleGoogleSignUp"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.9c2.28-2.1 3.645-5.2 3.645-9.12z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.03c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.72-2.1-6.66-4.92H1.3v3.13C3.34 21.43 7.37 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.34 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.59H1.3A11.97 11.97 0 000 12c0 1.92.45 3.74 1.3 5.41l4.04-3.13z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.34 2.57 1.3 6.59l4.04 3.13c.94-2.82 3.56-4.97 6.66-4.97z"
            />
          </svg>
          <span>Đăng ký nhanh với tài khoản Google</span>
        </button>
      </div>

      <template #footer>
        <div class="text-center text-xs text-ink-soft">
          Đã có tài khoản Langua?
          <NuxtLink
            to="/dang-nhap"
            class="font-black text-ink underline underline-offset-4 hover:text-accent ml-1 min-h-[44px] inline-flex items-center"
          >
            Đăng nhập tại đây →
          </NuxtLink>
        </div>
      </template>
    </BaseCard>
  </div>
</template>
