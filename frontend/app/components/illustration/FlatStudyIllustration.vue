<script setup lang="ts">
// Flat Neo-brutalism SVG Illustration
// Vẽ bằng các hình khối cơ bản (hình hộp, hình tròn, ngôi sao, quyển sách) với viền đen dày và màu phẳng.
</script>

<template>
  <svg
    viewBox="0 0 240 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="w-full h-auto max-w-[200px] select-none"
    aria-hidden="true"
  >
    <!-- Bóng nền hình chữ nhật -->
    <rect x="24" y="24" width="190" height="135" rx="8" fill="var(--line)" />
    <!-- Khung chính bảng ghi chú -->
    <rect x="20" y="20" width="190" height="135" rx="8" fill="var(--surface-2)" stroke="var(--line)" stroke-width="3" />

    <!-- Thanh tiêu đề bảng -->
    <rect x="20" y="20" width="190" height="26" rx="6" fill="var(--warn)" stroke="var(--line)" stroke-width="3" />
    <circle cx="34" cy="33" r="4" fill="var(--bad)" stroke="var(--line)" stroke-width="2" />
    <circle cx="48" cy="33" r="4" fill="var(--ok)" stroke="var(--line)" stroke-width="2" />
    <circle cx="62" cy="33" r="4" fill="var(--accent)" stroke="var(--line)" stroke-width="2" />

    <!-- Quyển sách mở phẳng -->
    <g transform="translate(42, 60)">
      <!-- Trang trái -->
      <path d="M0 45 L0 5 Q35 0 70 8 L70 48 Q35 40 0 45 Z" fill="var(--surface)" stroke="var(--line)" stroke-width="3" />
      <!-- Dòng chữ tượng trưng trang trái -->
      <line x1="12" y1="18" x2="58" y2="20" stroke="var(--ink-soft)" stroke-width="2.5" stroke-linecap="round" />
      <line x1="12" y1="28" x2="50" y2="30" stroke="var(--ink-soft)" stroke-width="2.5" stroke-linecap="round" />
      <line x1="12" y1="38" x2="45" y2="40" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" />

      <!-- Trang phải -->
      <path d="M70 8 Q105 0 140 5 L140 45 Q105 40 70 48 Z" fill="var(--surface)" stroke="var(--line)" stroke-width="3" />
      <!-- Dòng chữ tượng trưng trang phải -->
      <line x1="82" y1="20" x2="128" y2="18" stroke="var(--ink-soft)" stroke-width="2.5" stroke-linecap="round" />
      <line x1="82" y1="30" x2="120" y2="28" stroke="var(--ink-soft)" stroke-width="2.5" stroke-linecap="round" />
      <line x1="82" y1="40" x2="115" y2="38" stroke="var(--ok)" stroke-width="3" stroke-linecap="round" />

      <!-- Gáy sách -->
      <line x1="70" y1="8" x2="70" y2="48" stroke="var(--line)" stroke-width="3" />
    </g>

    <!-- Ngôi sao / Phù hiệu thành tích nổi bật bên góc -->
    <g transform="translate(150, 95)">
      <rect x="4" y="4" width="46" height="46" rx="6" fill="var(--line)" />
      <rect x="0" y="0" width="46" height="46" rx="6" fill="var(--mark)" stroke="var(--line)" stroke-width="3" />
      <!-- Dấu check to -->
      <path d="M12 23 L20 31 L34 14" stroke="var(--on-tone)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    </g>

    <!-- Chiếc bút chì đặt nghiêng -->
    <g transform="translate(25, 120) rotate(-15)">
      <rect x="0" y="0" width="70" height="12" rx="2" fill="var(--warn)" stroke="var(--line)" stroke-width="2.5" />
      <!-- Đầu chì -->
      <polygon points="70,0 84,6 70,12" fill="var(--surface)" stroke="var(--line)" stroke-width="2.5" />
      <polygon points="78,3 84,6 78,9" fill="var(--line)" />
      <!-- Tẩy phía sau -->
      <rect x="-12" y="0" width="12" height="12" rx="2" fill="var(--bad)" stroke="var(--line)" stroke-width="2.5" />
    </g>
  </svg>
</template>
