<script setup lang="ts">
import { FileText, ArrowLeft } from '@lucide/vue'

useHead({
  title: 'Điều khoản sử dụng - Langua',
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
        <h1 class="text-3xl font-black">Điều khoản sử dụng</h1>
        <p class="text-xs text-ink-soft">Dự án học ngoại ngữ và luyện thi phi thương mại Langua</p>
      </div>
    </div>

    <BaseCard tone="surface" class="p-6 sm:p-8 space-y-4 text-sm leading-relaxed">
      <h2 class="font-display text-lg font-black">1. Mục đích phi thương mại</h2>
      <p class="text-ink-soft">
        Langua được xây dựng vì cộng đồng người học ngoại ngữ, hoàn toàn miễn phí và không vì mục đích lợi nhuận. Toàn bộ học liệu, đề thi và công cụ luyện tập đều nhằm phục vụ mục đích giáo dục cá nhân.
      </p>

      <h2 class="font-display text-lg font-black">2. Trách nhiệm người dùng</h2>
      <p class="text-ink-soft">
        Người dùng chịu trách nhiệm bảo mật thông tin đăng nhập cá nhân, không thực hiện các hành vi gây hại đến hệ thống máy chủ hoặc cố ý gian lận điểm số trên bảng xếp hạng.
      </p>

      <h2 class="font-display text-lg font-black">3. Bản quyền nội dung</h2>
      <p class="text-ink-soft">
        Các đề thi Cambridge IELTS và tài liệu tham khảo thuộc bản quyền của các tổ chức khảo thí tương ứng. Langua chỉ cung cấp giao diện mô phỏng phòng thi học tập trực tuyến.
      </p>
    </BaseCard>
  </div>
</template>
