<script setup lang="ts">
import { ShieldCheck, ArrowLeft } from '@lucide/vue'

useHead({
  title: 'Chính sách quyền riêng tư - Langua',
})
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6 text-ink">
    <div class="flex items-center gap-3">
      <NuxtLink
        to="/"
        class="flex h-9 w-9 items-center justify-center rounded-brut border-2 border-line bg-surface text-ink hover:bg-surface-2 shadow-brut-sm cursor-pointer"
      >
        <ArrowLeft class="h-4 w-4" :stroke-width="2.5" />
      </NuxtLink>
      <div>
        <h1 class="text-3xl font-black">Chính sách quyền riêng tư</h1>
        <p class="text-xs text-ink-soft">Cam kết bảo vệ dữ liệu người dùng tại Langua</p>
      </div>
    </div>

    <BaseCard tone="surface" class="p-6 sm:p-8 space-y-4 text-sm leading-relaxed">
      <h2 class="font-display text-lg font-black">1. Thu thập dữ liệu</h2>
      <p class="text-ink-soft">
        Langua chỉ thu thập các thông tin tối thiểu cần thiết để vận hành tài khoản học tập: địa chỉ email, tên hiển thị và tiến trình học (lượt làm bài thi, từ vựng đã ôn, chuỗi streak).
      </p>

      <h2 class="font-display text-lg font-black">2. Tuyệt đối không thương mại hóa dữ liệu</h2>
      <p class="text-ink-soft">
        Chúng tôi cam kết không bán, không chia sẻ hoặc cung cấp thông tin người dùng cho bất kỳ bên thứ ba hay mạng lưới quảng cáo nào.
      </p>

      <h2 class="font-display text-lg font-black">3. Bản ghi âm giọng nói Speaking</h2>
      <p class="text-ink-soft">
        File thu âm phần thi Speaking của thí sinh được lưu trữ trong phân vùng Supabase Storage bảo mật riêng tư (Private Bucket), chỉ thí sinh sở hữu mới có quyền truy cập nghe lại bài làm của mình.
      </p>
    </BaseCard>
  </div>
</template>
