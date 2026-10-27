<script setup lang="ts">
import { LogIn, Mail, Lock, AlertCircle, ArrowRight } from '@lucide/vue'

definePageMeta({
  layout: 'auth',
})

useHead({
  title: 'Đăng nhập - Langua',
})

const { signIn, signInWithGoogle, isLoading, authError } = useAuth()

const email = ref('')
const password = ref('')
const clientError = ref<string | null>(null)

const validateForm = (): boolean => {
  clientError.value = null

  if (!email.value.trim()) {
    clientError.value = 'Vui lòng nhập địa chỉ email.'
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value.trim())) {
    clientError.value = 'Định dạng email không hợp lệ (ví dụ: ban@domain.com).'
    return false
  }

  if (!password.value) {
    clientError.value = 'Vui lòng nhập mật khẩu.'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm() || isLoading.value) return
  await signIn(email.value, password.value)
}

const handleGoogleSignIn = async () => {
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
            <span class="rounded border-2 border-line bg-warn px-2 py-0.5 font-display text-xs font-black text-on-tone">
              XÁC THỰC
            </span>
          </div>
          <h1 class="text-2xl font-black text-ink">
            Đăng nhập tài khoản
          </h1>
          <p class="text-xs text-ink-soft">
            Tiếp tục chuỗi ngày học tập và lưu trữ kết quả luyện thi
          </p>
        </div>
      </template>

      <!-- Thông báo lỗi nếu có -->
      <div
        v-if="clientError || authError"
        class="mb-5 flex items-start gap-2.5 rounded-brut border-2 border-bad bg-bad/10 p-3 text-xs font-bold text-bad"
      >
        <AlertCircle class="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>{{ clientError || authError }}</span>
      </div>

      <!-- Form đăng nhập Email & Mật khẩu -->
      <form class="space-y-4" @submit.prevent="handleSubmit">
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

        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <label class="font-display font-bold text-sm text-ink">Mật khẩu</label>
            <NuxtLink
              to="/quen-mat-khau"
              class="min-h-[44px] inline-flex items-center text-xs font-bold text-ink-soft underline hover:text-accent"
            >
              Quên mật khẩu?
            </NuxtLink>
          </div>
          <BaseInput
            v-model="password"
            type="password"
            placeholder="Nhập mật khẩu của bạn..."
            required
          >
            <template #prefix>
              <Lock class="h-4 w-4" :stroke-width="2.5" />
            </template>
          </BaseInput>
        </div>

        <div class="pt-2">
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            block
            :disabled="isLoading"
          >
            <LogIn class="h-4 w-4" :stroke-width="2.5" />
            <span>{{ isLoading ? 'Đang xác thực...' : 'Đăng nhập ngay' }}</span>
          </BaseButton>
        </div>
      </form>

      <!-- Đường kẻ phân cách -->
      <div class="relative my-6 text-center">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t-2 border-line/30" />
        </div>
        <span class="relative bg-surface px-3 text-xs font-bold uppercase text-ink-soft">
          Hoặc
        </span>
      </div>

      <!-- Đăng nhập Google (OAuth) -->
      <div>
        <button
          type="button"
          class="flex w-full min-h-[44px] items-center justify-center gap-2.5 rounded-brut border-2 border-line bg-surface py-2.5 px-4 font-display text-sm font-bold text-ink shadow-brut-sm hover:bg-surface-2 brut-press disabled:opacity-50 cursor-pointer transition-all"
          :disabled="isLoading"
          @click="handleGoogleSignIn"
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
          <span>Đăng nhập với tài khoản Google</span>
        </button>
      </div>

      <template #footer>
        <div class="text-center text-xs text-ink-soft">
          Chưa có tài khoản?
          <NuxtLink
            to="/dang-ky"
            class="font-black text-ink underline underline-offset-4 hover:text-accent ml-1 min-h-[44px] inline-flex items-center"
          >
            Đăng ký tài khoản miễn phí →
          </NuxtLink>
        </div>
      </template>
    </BaseCard>
  </div>
</template>
