<script setup lang="ts">
import { Heart, ShieldCheck, FileText } from '@lucide/vue'
import { BRAND_NAME } from '~/constants/brand'

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="mt-auto border-t-[3px] border-line bg-surface pt-8 pb-16 sm:pb-8 text-ink">
    <div class="mx-auto max-w-7xl px-4 sm:px-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <!-- Cột 1: Giới thiệu dự án -->
        <div class="md:col-span-2 space-y-2">
          <div class="flex items-center gap-2">
            <span class="font-display text-2xl font-black">{{ BRAND_NAME }}</span>
            <BaseBadge tone="green" size="sm">
              Phi thương mại
            </BaseBadge>
          </div>
          <p class="text-xs sm:text-sm text-ink-soft max-w-md leading-relaxed">
            Dự án học ngoại ngữ và luyện thi chứng chỉ mở hoàn toàn miễn phí.
            Xây dựng với tinh thần cởi mở, minh bạch, tập trung vào hiệu quả luyện tập thực tế và không rào cản tài chính.
          </p>
        </div>

        <!-- Cột 2: Điều khoản & Pháp lý -->
        <div class="space-y-2">
          <h3 class="font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-ink">Pháp lý & Quy định</h3>
          <ul class="space-y-1 text-xs sm:text-sm">
            <li>
              <NuxtLink to="/dieu-khoan" class="footer-link inline-flex items-center gap-1.5 py-1 min-h-[36px]">
                <FileText class="h-3.5 w-3.5" :stroke-width="2.5" />
                <span>Điều khoản sử dụng</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/chinh-sach-quyen-rieng-tu" class="footer-link inline-flex items-center gap-1.5 py-1 min-h-[36px]">
                <ShieldCheck class="h-3.5 w-3.5" :stroke-width="2.5" />
                <span>Chính sách quyền riêng tư</span>
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Cột 3: Cộng đồng & Đóng góp -->
        <div class="space-y-2">
          <h3 class="font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-ink">Cộng đồng</h3>
          <ul class="space-y-1 text-xs sm:text-sm">
            <li>
              <NuxtLink to="/yeu-cau-tinh-nang" class="footer-link inline-flex items-center py-1 min-h-[36px]">
                Góp ý & Yêu cầu tính năng
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/yeu-cau-tinh-nang" class="footer-link inline-flex items-center py-1 min-h-[36px]">
                Đóng góp học liệu mở
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Dòng đáy copyright -->
      <div class="border-t-2 border-line pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-ink-soft">
        <p>© {{ currentYear }} {{ BRAND_NAME }}. Nền tảng học mở phi thương mại.</p>
        <p class="flex items-center gap-1.5">
          <span>Xây dựng vì cộng đồng người học</span>
          <Heart class="h-3.5 w-3.5 text-bad fill-bad" />
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer-link {
  color: var(--ink);
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 3px;
  font-weight: 600;
  transition: color 0.1s ease;
}

.footer-link:hover {
  color: var(--accent);
}
</style>
