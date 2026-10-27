<script setup lang="ts">
import { KeyRound, Mail, AlertCircle, ArrowLeft, CheckCircle } from '@lucide/vue'

definePageMeta({
  layout: 'auth',
})

useHead({
  title: 'Quên mật khẩu - Langua',
})

const { resetPassword, isLoading, authError } = useAuth()

const email = ref('')
const clientError = ref<string | null>(null)
const successMsg = ref<string | null>(null)

const validateForm = (): boolean => {
  clientError.value = null

  if (!email.value.trim()) {
    clientError.value = 'Vui lòng nhập địa chỉ email của bạn.'
    return false
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value.trim())) {
    clientError.value = 'Định dạng email không hợp lệ (ví dụ: ban@domain.com).'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm() || isLoading.value) return
  const res = await resetPassword(email.value)
  if (res.success) {
    successMsg.value = `Hệ thống đã gửi liên kết khôi phục mật khẩu tới địa chỉ ${email.value}. Vui lòng kiểm tra hộp thư đến (và thư rác/spam).`
  }
}
</script>

<template>
  <div class="w-full max-w-md">
    <BaseCard tone="surface" class="p-6 sm:p-8">
      <template #header>
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="rounded border-2 border-line bg-mark px-2 py-0.5 font-display text-xs font-black text-on-tone">
              KHÔI PHỤC
            </span>
          </div>
          <h1 class="text-2xl font-black text-ink">
            Quên mật khẩu?
          </h1>
          <p class="text-xs text-ink-soft">
            Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu
          </p>
        </div>
      </template>

      <!-- Thông báo thành công -->
      <div
        v-if="successMsg"
        class="mb-5 rounded-brut border-2 border-ok bg-ok/15 p-4 text-xs font-bold text-ink space-y-2"
      >
        <p class="text-sm font-black text-ok flex items-center gap-1.5">
          <CheckCircle class="h-4 w-4" />
          <span>Đã gửi email khôi phục</span>
        </p>
        <p class="leading-relaxed">{{ successMsg }}</p>
        <div class="pt-2">
          <NuxtLink
            to="/dang-nhap"
            class="inline-flex items-center gap-1.5 font-black text-ink underline"
          >
            <ArrowLeft class="h-3.5 w-3.5" />
            <span>Quay lại trang Đăng nhập</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Thông báo lỗi nếu có -->
      <div
        v-else-if="clientError || authError"
        class="mb-5 flex items-start gap-2.5 rounded-brut border-2 border-bad bg-bad/10 p-3 text-xs font-bold text-bad"
      >
        <AlertCircle class="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>{{ clientError || authError }}</span>
      </div>

      <!-- Form Quên mật khẩu -->
      <form v-if="!successMsg" class="space-y-4" @submit.prevent="handleSubmit">
        <BaseInput
          v-model="email"
          label="Địa chỉ Email tài khoản"
          type="email"
          placeholder="email@example.com"
          required
        >
          <template #prefix>
            <Mail class="h-4 w-4" :stroke-width="2.5" />
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
            <KeyRound class="h-4 w-4" :stroke-width="2.5" />
            <span>{{ isLoading ? 'Đang gửi...' : 'Gửi liên kết khôi phục' }}</span>
          </BaseButton>
        </div>
      </form>

      <template #footer>
        <div class="text-center text-xs text-ink-soft">
          <NuxtLink
            to="/dang-nhap"
            class="inline-flex items-center gap-1 font-bold text-ink underline underline-offset-4 hover:text-accent"
          >
            <ArrowLeft class="h-3.5 w-3.5" />
            <span>Quay lại trang Đăng nhập</span>
          </NuxtLink>
        </div>
      </template>
    </BaseCard>
  </div>
</template>
