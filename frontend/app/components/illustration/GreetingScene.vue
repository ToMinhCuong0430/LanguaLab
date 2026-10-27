<script setup lang="ts">
import MascotBook from './MascotBook.vue'

/**
 * GreetingScene.vue
 * Minh hoạ Flat SVG Neo-brutalism bên phải Banner:
 * - Mascot Book trung tâm nhún nhảy nhẹ
 * - Bong bóng thoại: Lời chào đổi theo ngôn ngữ học (en: "Hello!", zh: "你好!", ja: "こんにちは!")
 * - Thẻ mục tiêu kỳ thi cắm bên phải sách (IELTS 7+, TOEIC 800+...)
 * - Chi tiết trang trí theo buổi:
 *    + Sáng: Mặt trời cười vàng, tia nắng, 2 đám mây trắng, chim én bay, sao 4 cánh, cốc cà phê
 *    + Chiều: Mặt trời cam, mây, ly nước trà xanh, đồi cam
 *    + Tối: Trăng lưỡi liềm vàng, nhiều sao trắng/vàng lấp lánh, đèn bàn góc dưới phải
 */
const props = withDefaults(
  defineProps<{
    period: 'sang' | 'chieu' | 'toi'
    speechText?: string
    targetBand?: string | null
    examName?: string | null
  }>(),
  {
    speechText: 'Hello!',
    targetBand: '7.0',
    examName: 'IELTS',
  }
)

// Màu nền bong bóng thoại: Trắng cho sáng/chiều, xanh ngọc/lá nhạt cho tối
const bubbleBg = computed(() => {
  if (props.period === 'toi') return '#D6FFF0'
  return '#FFFFFF'
})

// Định dạng text trên thẻ mục tiêu: "{EXAM} {BAND}+"
const targetBadgeText = computed(() => {
  if (!props.examName && !props.targetBand) return null
  const exam = (props.examName || 'IELTS').toUpperCase()
  const band = props.targetBand || '7'
  return `${exam} ${band}+`
})
</script>

<template>
  <svg
    viewBox="0 0 460 270"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="greeting-scene-svg w-full h-full select-none overflow-visible"
    aria-hidden="true"
  >
    <!-- ==================== CÁC PHẦN TỬ THEO BUỔI ==================== -->

    <!-- 1. BUỔI SÁNG: Mặt trời vàng tươi, mây trắng, chim én, sao 4 cánh, cốc nước -->
    <g v-if="period === 'sang'">
      <!-- Mặt trời vàng có tia nắng và mặt cười -->
      <g class="anim-float-sun" transform="translate(380, 50)">
        <!-- Các tia nắng (đường thẳng viền đen) -->
        <g stroke="#11141D" stroke-width="3" stroke-linecap="round">
          <line x1="0" y1="-34" x2="0" y2="-26" />
          <line x1="24" y1="-24" x2="18" y2="-18" />
          <line x1="34" y1="0" x2="26" y2="0" />
          <line x1="24" y1="24" x2="18" y2="18" />
          <line x1="0" y1="34" x2="0" y2="26" />
          <line x1="-24" y1="24" x2="-18" y2="18" />
          <line x1="-34" y1="0" x2="-26" y2="0" />
          <line x1="-24" y1="-24" x2="-18" y2="-18" />
        </g>
        <!-- Vòng tròn mặt trời -->
        <circle cx="0" cy="0" r="22" fill="#FFD23F" stroke="#11141D" stroke-width="3.5" />
        <!-- Khuôn mặt cười mặt trời -->
        <circle cx="-6" cy="-3" r="2.5" fill="#11141D" />
        <circle cx="6" cy="-3" r="2.5" fill="#11141D" />
        <path d="M-6 4 Q0 9 6 4" fill="none" stroke="#11141D" stroke-width="2.5" stroke-linecap="round" />
        <ellipse cx="-10" cy="1" rx="2.5" ry="1.5" fill="#FF70A6" />
        <ellipse cx="10" cy="1" rx="2.5" ry="1.5" fill="#FF70A6" />
      </g>

      <!-- Đám mây 1 bên trái -->
      <g class="anim-drift-cloud-1" transform="translate(70, 35)">
        <path
          d="M10 24 C2 24, 0 16, 8 12 C6 4, 18 0, 26 6 C32 0, 44 2, 46 10 C54 10, 56 20, 48 24 Z"
          fill="#FFFFFF"
          stroke="#11141D"
          stroke-width="3"
          stroke-linejoin="round"
        />
      </g>

      <!-- Đám mây 2 bên phải -->
      <g class="anim-drift-cloud-2" transform="translate(320, 25)">
        <path
          d="M8 20 C2 20, 0 14, 6 10 C5 3, 15 0, 22 5 C27 0, 38 1, 40 8 C46 8, 48 16, 42 20 Z"
          fill="#FFFFFF"
          stroke="#11141D"
          stroke-width="3"
          stroke-linejoin="round"
        />
      </g>

      <!-- Chim én bay (dấu ^ mềm) -->
      <path d="M170 30 Q176 24 182 28 Q188 24 194 30" fill="none" stroke="#11141D" stroke-width="2.5" stroke-linecap="round" />
      <path d="M196 42 Q200 38 205 41 Q210 38 214 42" fill="none" stroke="#11141D" stroke-width="2" stroke-linecap="round" />

      <!-- Ngôi sao 4 cánh lấp lánh (vàng & xanh) -->
      <g class="anim-sparkle" transform="translate(130, 60)">
        <path d="M0 -8 Q0 0 8 0 Q0 0 0 8 Q0 0 -8 0 Q0 0 0 -8 Z" fill="#FFD23F" stroke="#11141D" stroke-width="2" />
      </g>
      <g class="anim-sparkle" transform="translate(340, 95)">
        <path d="M0 -6 Q0 0 6 0 Q0 0 0 6 Q0 0 -6 0 Q0 0 0 -6 Z" fill="#2F5BFF" stroke="#11141D" stroke-width="1.8" />
      </g>

      <!-- Cốc cà phê nhỏ góc dưới bên phải -->
      <g transform="translate(390, 205)">
        <rect x="0" y="0" width="22" height="26" rx="4" fill="#FFFFFF" stroke="#11141D" stroke-width="3" />
        <path d="M22 6 C28 6, 28 16, 22 16" fill="none" stroke="#11141D" stroke-width="3" />
        <!-- Miếng tag trà -->
        <rect x="6" y="8" width="10" height="12" rx="2" fill="#FFD23F" stroke="#11141D" stroke-width="1.5" />
        <!-- Khói bốc -->
        <path d="M6 -6 Q10 -3 8 0" fill="none" stroke="#11141D" stroke-width="2" stroke-linecap="round" />
        <path d="M14 -8 Q18 -5 16 -2" fill="none" stroke="#11141D" stroke-width="2" stroke-linecap="round" />
      </g>
    </g>

    <!-- 2. BUỔI CHIỀU: Mặt trời cam đào, ly nước chanh xanh lá, đồi cam -->
    <g v-else-if="period === 'chieu'">
      <!-- Mặt trời cam chiều -->
      <g class="anim-float-sun" transform="translate(370, 55)">
        <g stroke="#11141D" stroke-width="3" stroke-linecap="round">
          <line x1="0" y1="-32" x2="0" y2="-24" />
          <line x1="22" y1="-22" x2="16" y2="-16" />
          <line x1="32" y1="0" x2="24" y2="0" />
          <line x1="22" y1="22" x2="16" y2="16" />
          <line x1="-22" y1="22" x2="-16" y2="16" />
          <line x1="-32" y1="0" x2="-24" y2="0" />
          <line x1="-22" y1="-22" x2="-16" y2="-16" />
        </g>
        <circle cx="0" cy="0" r="22" fill="#FF8A3D" stroke="#11141D" stroke-width="3.5" />
        <circle cx="-6" cy="-3" r="2.5" fill="#11141D" />
        <circle cx="6" cy="-3" r="2.5" fill="#11141D" />
        <path d="M-6 4 Q0 9 6 4" fill="none" stroke="#11141D" stroke-width="2.5" stroke-linecap="round" />
        <ellipse cx="-10" cy="1" rx="2.5" ry="1.5" fill="#FF4D4D" />
        <ellipse cx="10" cy="1" rx="2.5" ry="1.5" fill="#FF4D4D" />
      </g>

      <!-- Mây chiều -->
      <g class="anim-drift-cloud-1" transform="translate(60, 30)">
        <path
          d="M10 24 C2 24, 0 16, 8 12 C6 4, 18 0, 26 6 C32 0, 44 2, 46 10 C54 10, 56 20, 48 24 Z"
          fill="#FFF4E6"
          stroke="#11141D"
          stroke-width="3"
          stroke-linejoin="round"
        />
      </g>

      <!-- Ly nước quả xanh lá góc phải -->
      <g transform="translate(390, 200)">
        <polygon points="0,0 24,0 19,30 5,30" fill="#D6FFF0" stroke="#11141D" stroke-width="3" stroke-linejoin="round" />
        <line x1="16" y1="-12" x2="10" y2="16" stroke="#FF70A6" stroke-width="3.5" stroke-linecap="round" />
        <circle cx="8" cy="10" r="3" fill="#00D084" />
      </g>

      <!-- Sao 4 cánh -->
      <g class="anim-sparkle" transform="translate(140, 55)">
        <path d="M0 -7 Q0 0 7 0 Q0 0 0 7 Q0 0 -7 0 Q0 0 0 -7 Z" fill="#FFD23F" stroke="#11141D" stroke-width="2" />
      </g>
    </g>

    <!-- 3. BUỔI TỐI: Trăng lưỡi liềm vàng, đèn bàn, nhiều ngôi sao lấp lánh -->
    <g v-else>
      <!-- Mặt trăng lưỡi liềm vàng có mắt nhắm ngủ/cười -->
      <g class="anim-float-sun" transform="translate(370, 45)">
        <path
          d="M10 -22 C-15 -22, -26 0, -10 24 C-3 29, 6 30, 14 26 C-4 22, -10 6, -2 -14 C2 -18, 6 -20, 10 -22 Z"
          fill="#FFD23F"
          stroke="#11141D"
          stroke-width="3.5"
          stroke-linejoin="round"
        />
        <!-- Mắt trăng nhắm dịu dàng -->
        <path d="M-9 5 Q-6 8 -3 5" fill="none" stroke="#11141D" stroke-width="2" stroke-linecap="round" />
      </g>

      <!-- Các ngôi sao nhỏ trắng & vàng rực rỡ buổi tối -->
      <g class="anim-sparkle" transform="translate(90, 30)">
        <path d="M0 -7 Q0 0 7 0 Q0 0 0 7 Q0 0 -7 0 Q0 0 0 -7 Z" fill="#FFD23F" stroke="#11141D" stroke-width="2" />
      </g>
      <g class="anim-sparkle" transform="translate(160, 50)">
        <circle cx="0" cy="0" r="3" fill="#FFFFFF" stroke="#11141D" stroke-width="1.5" />
      </g>
      <g class="anim-sparkle" transform="translate(300, 30)">
        <path d="M0 -5 Q0 0 5 0 Q0 0 0 5 Q0 0 -5 0 Q0 0 0 -5 Z" fill="#FFFFFF" stroke="#11141D" stroke-width="1.8" />
      </g>
      <g class="anim-sparkle" transform="translate(420, 90)">
        <path d="M0 -6 Q0 0 6 0 Q0 0 0 6 Q0 0 -6 0 Q0 0 0 -6 Z" fill="#FFD23F" stroke="#11141D" stroke-width="2" />
      </g>
      <circle cx="210" cy="35" r="2.5" fill="#FFFFFF" />
      <circle cx="340" cy="75" r="2" fill="#FFD23F" />

      <!-- Chiếc đèn bàn học nhỏ góc dưới phải -->
      <g transform="translate(385, 195)">
        <!-- Chân đế -->
        <rect x="2" y="32" width="26" height="5" rx="2" fill="#FFD23F" stroke="#11141D" stroke-width="2.5" />
        <!-- Cần đèn -->
        <path d="M15 32 L15 15 L8 8" fill="none" stroke="#11141D" stroke-width="3" stroke-linecap="round" />
        <!-- Chụp đèn vàng hắt sáng -->
        <polygon points="2,8 20,4 26,16 6,18" fill="#FFD23F" stroke="#11141D" stroke-width="2.5" stroke-linejoin="round" />
        <!-- Luồng sáng dịu -->
        <polygon points="6,18 26,16 34,36 -2,36" fill="rgba(255, 210, 63, 0.25)" />
      </g>
    </g>

    <!-- ==================== MASCOT SÁCH & BONG BÓNG ==================== -->
    <g class="anim-mascot-bob" transform="translate(115, 20)">
      <!-- Quyển sách mở MascotBook -->
      <MascotBook :period="period" />

      <!-- BONG BÓNG THOẠI (Bên trái trên đầu Mascot) -->
      <g transform="translate(10, 10)">
        <!-- Đuôi bong bóng thoại -->
        <polygon
          points="60,34 50,44 68,34"
          :fill="bubbleBg"
          stroke="#11141D"
          stroke-width="3"
        />
        <!-- Khung thân bong bóng -->
        <rect
          x="0"
          y="0"
          width="82"
          height="34"
          rx="12"
          :fill="bubbleBg"
          stroke="#11141D"
          stroke-width="3"
        />
        <!-- Chữ chào theo ngôn ngữ -->
        <text
          x="41"
          y="23"
          text-anchor="middle"
          font-family="var(--font-display)"
          font-weight="900"
          font-size="14"
          fill="#11141D"
        >
          {{ speechText }}
        </text>
      </g>

      <!-- THẺ MỤC TIÊU KỲ THI (IELTS 7+, TOEIC 800+...) cắm bên phải sách -->
      <g v-if="targetBadgeText" transform="translate(162, 50) rotate(12)">
        <!-- Thẻ tím nhạt viền đen -->
        <rect
          x="0"
          y="0"
          width="88"
          height="28"
          rx="6"
          fill="#EAE0FF"
          stroke="#11141D"
          stroke-width="3"
        />
        <text
          x="44"
          y="18"
          text-anchor="middle"
          font-family="var(--font-display)"
          font-weight="900"
          font-size="11"
          letter-spacing="0.5"
          fill="#11141D"
        >
          {{ targetBadgeText }}
        </text>
      </g>
    </g>
  </svg>
</template>

<style scoped>
/* CSS Animations nhẹ nhàng phẳng */
@keyframes floatSun {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes driftCloud1 {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(8px);
  }
}

@keyframes driftCloud2 {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-6px);
  }
}

@keyframes sparkle {
  0%, 100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

@keyframes mascotBob {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.anim-float-sun {
  animation: floatSun 4s ease-in-out infinite;
}

.anim-drift-cloud-1 {
  animation: driftCloud1 8s ease-in-out infinite;
}

.anim-drift-cloud-2 {
  animation: driftCloud2 7s ease-in-out infinite;
}

.anim-sparkle {
  transform-origin: center;
  animation: sparkle 2.5s ease-in-out infinite;
}

.anim-mascot-bob {
  animation: mascotBob 3.5s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .anim-float-sun,
  .anim-drift-cloud-1,
  .anim-drift-cloud-2,
  .anim-sparkle,
  .anim-mascot-bob {
    animation: none !important;
  }
}
</style>
