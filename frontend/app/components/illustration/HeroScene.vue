<script setup lang="ts">
import HeroMascot from './HeroMascot.vue'

defineProps<{
  period: 'sang' | 'chieu' | 'toi'
  speechGreeting?: string
  examBadge?: string
}>()
</script>

<template>
  <div class="hero-scene-wrapper relative w-full h-full flex items-center justify-end select-none pointer-events-none">
    <svg
      viewBox="0 0 540 330"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="w-full h-full max-h-[330px] object-contain object-right-bottom"
      aria-hidden="true"
    >
      <!-- ==================== CẢNH VẬT: BUỔI SÁNG ==================== -->
      <g v-if="period === 'sang'">
        <!-- MẶT TRỜI CƯỜI TƯƠI Ở GÓC TRÊN BÊN PHẢI -->
        <g transform="translate(420, 55)">
          <g class="animate-hero-celestial">
            <!-- Tia nắng phẳng xung quanh mặt trời (8 tia) -->
            <path d="M0 -36 L0 -24" stroke="#11141D" stroke-width="3" stroke-linecap="round" />
            <path d="M25 -25 L17 -17" stroke="#11141D" stroke-width="3" stroke-linecap="round" />
            <path d="M36 0 L24 0" stroke="#11141D" stroke-width="3" stroke-linecap="round" />
            <path d="M25 25 L17 17" stroke="#11141D" stroke-width="3" stroke-linecap="round" />
            <path d="M0 36 L0 24" stroke="#11141D" stroke-width="3" stroke-linecap="round" />
            <path d="M-25 25 L-17 17" stroke="#11141D" stroke-width="3" stroke-linecap="round" />
            <path d="M-36 0 L-24 0" stroke="#11141D" stroke-width="3" stroke-linecap="round" />
            <path d="M-25 -25 L-17 -17" stroke="#11141D" stroke-width="3" stroke-linecap="round" />

            <!-- Bóng cứng mặt trời -->
            <circle cx="3" cy="3" r="22" fill="#11141D" />
            <!-- Vòng tròn mặt trời vàng rực #FFC700 -->
            <circle cx="0" cy="0" r="22" fill="#FFC700" stroke="#11141D" stroke-width="3" />

            <!-- Khuôn mặt cười hiền lành -->
            <circle cx="-6" cy="-2" r="2.5" fill="#11141D" />
            <circle cx="6" cy="-2" r="2.5" fill="#11141D" />
            <ellipse cx="-11" cy="5" rx="3" ry="2" fill="#FF70A6" />
            <ellipse cx="11" cy="5" rx="3" ry="2" fill="#FF70A6" />
            <path d="M-5 4 Q0 10 5 4" fill="none" stroke="#11141D" stroke-width="2" stroke-linecap="round" />
          </g>
        </g>

        <!-- MÂY TRẮNG TRÔI BỀN BỒNG 1 -->
        <g transform="translate(60, 35)">
          <g class="animate-hero-cloud">
            <!-- Bóng mây -->
            <path
              d="M10 24 A12 12 0 0 1 32 14 A16 16 0 0 1 60 14 A12 12 0 0 1 82 24 A10 10 0 0 1 76 34 L14 34 A10 10 0 0 1 10 24 Z"
              fill="#11141D"
              transform="translate(3, 3)"
            />
            <!-- Thân mây -->
            <path
              d="M10 24 A12 12 0 0 1 32 14 A16 16 0 0 1 60 14 A12 12 0 0 1 82 24 A10 10 0 0 1 76 34 L14 34 A10 10 0 0 1 10 24 Z"
              fill="#FFFBF0"
              stroke="#11141D"
              stroke-width="2.5"
              stroke-linejoin="round"
            />
          </g>
        </g>

        <!-- MÂY TRẮNG TRÔI 2 (nhỏ hơn, phía xa) -->
        <g transform="translate(330, 20)">
          <g class="animate-hero-cloud">
            <path
              d="M8 18 A9 9 0 0 1 25 10 A12 12 0 0 1 46 10 A9 9 0 0 1 62 18 L6 18 Z"
              fill="#FFFBF0"
              stroke="#11141D"
              stroke-width="2"
              stroke-linejoin="round"
            />
          </g>
        </g>

        <!-- TÁCH CÀ PHÊ NÓNG BỐC KHÓI CẠNH CHÂN MASCOT -->
        <g transform="translate(390, 215)">
          <!-- Bóng tách -->
          <rect x="2" y="2" width="34" height="26" rx="5" fill="#11141D" />
          <!-- Thân tách sứ trắng kem -->
          <rect x="0" y="0" width="34" height="26" rx="5" fill="#FFFBF0" stroke="#11141D" stroke-width="2.5" />
          <!-- Quai tách -->
          <path d="M34 5 Q44 5 44 14 Q44 23 34 23" fill="none" stroke="#11141D" stroke-width="2.5" />
          <!-- Đĩa lót tách -->
          <ellipse cx="17" cy="28" rx="22" ry="4" fill="#FFC700" stroke="#11141D" stroke-width="2" />
          <!-- Làn khói nóng uốn lượn -->
          <path d="M12 -4 Q8 -12 14 -18" fill="none" stroke="#11141D" stroke-width="2" stroke-linecap="round" />
          <path d="M22 -6 Q26 -14 20 -20" fill="none" stroke="#11141D" stroke-width="2" stroke-linecap="round" />
        </g>

        <!-- 4 NGÔI SAO TĨNH 4 CÁNH TOẢ SÁNG -->
        <g transform="translate(190, 22)">
          <path d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z" fill="#FFC700" stroke="#11141D" stroke-width="1.5" />
        </g>
        <g transform="translate(485, 115)">
          <path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" fill="#FFC700" stroke="#11141D" stroke-width="1.5" />
        </g>
        <g transform="translate(50, 105)">
          <path d="M0 -5 L1.5 -1.5 L5 0 L1.5 1.5 L0 5 L-1.5 1.5 L-5 0 L-1.5 -1.5 Z" fill="#FFFBF0" stroke="#11141D" stroke-width="1.5" />
        </g>
      </g>

      <!-- ==================== CẢNH VẬT: BUỔI CHIỀU ==================== -->
      <g v-else-if="period === 'chieu'">
        <!-- MẶT TRỜI CAM HOÀNG HÔN NỞ NỤ CƯỜI -->
        <g transform="translate(415, 60)">
          <g class="animate-hero-celestial">
            <!-- 8 tia nắng cam ấm -->
            <path d="M0 -34 L0 -24" stroke="#11141D" stroke-width="3" stroke-linecap="round" />
            <path d="M24 -24 L17 -17" stroke="#11141D" stroke-width="3" stroke-linecap="round" />
            <path d="M34 0 L24 0" stroke="#11141D" stroke-width="3" stroke-linecap="round" />
            <path d="M24 24 L17 17" stroke="#11141D" stroke-width="3" stroke-linecap="round" />
            <path d="M0 34 L0 24" stroke="#11141D" stroke-width="3" stroke-linecap="round" />
            <path d="M-24 24 L-17 17" stroke="#11141D" stroke-width="3" stroke-linecap="round" />
            <path d="M-34 0 L-24 0" stroke="#11141D" stroke-width="3" stroke-linecap="round" />
            <path d="M-24 -24 L-17 -17" stroke="#11141D" stroke-width="3" stroke-linecap="round" />

            <!-- Bóng cứng mặt trời -->
            <circle cx="3" cy="3" r="22" fill="#11141D" />
            <!-- Mặt trời cam #FF8A00 -->
            <circle cx="0" cy="0" r="22" fill="#FF8A00" stroke="#11141D" stroke-width="3" />

            <!-- Khuôn mặt tươi vui -->
            <circle cx="-6" cy="-2" r="2.5" fill="#11141D" />
            <circle cx="6" cy="-2" r="2.5" fill="#11141D" />
            <ellipse cx="-11" cy="5" rx="3" ry="2" fill="#FFC700" />
            <ellipse cx="11" cy="5" rx="3" ry="2" fill="#FFC700" />
            <path d="M-5 4 Q0 9 5 4" fill="none" stroke="#11141D" stroke-width="2" stroke-linecap="round" />
          </g>
        </g>

        <!-- MÂY CHIỀU ẤM ÁP -->
        <g transform="translate(65, 38)">
          <g class="animate-hero-cloud">
            <path
              d="M10 24 A12 12 0 0 1 32 14 A16 16 0 0 1 60 14 A12 12 0 0 1 82 24 L10 24 Z"
              fill="#FFFBF0"
              stroke="#11141D"
              stroke-width="2.5"
              stroke-linejoin="round"
            />
          </g>
        </g>

        <!-- LY NƯỚC MÁT TRÁI CÂY CÓ ỐNG HÚT CẠNH MASCOT -->
        <g transform="translate(395, 205)">
          <!-- Ống hút chéo sọc -->
          <line x1="16" y1="5" x2="26" y2="-18" stroke="#11141D" stroke-width="4" stroke-linecap="round" />
          <line x1="16" y1="5" x2="26" y2="-18" stroke="#FF5A4E" stroke-width="2" stroke-linecap="round" />
          <!-- Bóng ly -->
          <path d="M6 8 L10 38 L26 38 L30 8 Z" fill="#11141D" transform="translate(2, 2)" />
          <!-- Thân ly cam tươi -->
          <path d="M6 8 L10 38 L26 38 L30 8 Z" fill="#FFFBF0" stroke="#11141D" stroke-width="2.5" />
          <!-- Mức nước cam -->
          <path d="M8 18 L10 36 L26 36 L28 18 Z" fill="#FF8A00" />
          <!-- Lát chanh vàng kẹp miệng ly -->
          <ellipse cx="8" cy="8" rx="8" ry="8" fill="#FFC700" stroke="#11141D" stroke-width="2" />
        </g>

        <!-- 4 NGÔI SAO TĨNH 4 CÁNH -->
        <g transform="translate(180, 24)">
          <path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" fill="#FF8A00" stroke="#11141D" stroke-width="1.5" />
        </g>
        <g transform="translate(485, 120)">
          <path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" fill="#FFFBF0" stroke="#11141D" stroke-width="1.5" />
        </g>
      </g>

      <!-- ==================== CẢNH VẬT: BUỔI TỐI ==================== -->
      <g v-else>
        <!-- MẶT TRĂNG LƯỠI LIỀM VÀNG MỈM CƯỜI Ở GÓC TRÊN BÊN PHẢI -->
        <g transform="translate(425, 60)">
          <g class="animate-hero-celestial">
            <!-- Bóng mặt trăng -->
            <path
              d="M0 -22 A22 22 0 1 1 -18 14 A17 17 0 1 0 0 -22 Z"
              fill="#11141D"
              transform="translate(3, 3)"
            />
            <!-- Trăng lưỡi liềm vàng rực #FFD23F -->
            <path
              d="M0 -22 A22 22 0 1 1 -18 14 A17 17 0 1 0 0 -22 Z"
              fill="#FFD23F"
              stroke="#11141D"
              stroke-width="3"
            />
            <!-- Mắt nhắm cười của chị Hằng -->
            <path d="M-3 -4 Q0 -9 3 -4" fill="none" stroke="#11141D" stroke-width="2" stroke-linecap="round" />
            <ellipse cx="-1" cy="2" rx="3" ry="1.5" fill="#FF70A6" />
          </g>
        </g>

        <!-- ĐÈN BÀN HỌC ẤM ÁP CẠNH CHÂN MASCOT -->
        <g transform="translate(390, 195)">
          <!-- Đế đèn tròn -->
          <ellipse cx="20" cy="46" rx="16" ry="5" fill="#11141D" />
          <ellipse cx="20" cy="44" rx="16" ry="5" fill="#A99BFF" stroke="#11141D" stroke-width="2" />
          <!-- Thân đèn uốn cong -->
          <path d="M20 44 Q16 25 24 16" fill="none" stroke="#11141D" stroke-width="3.5" stroke-linecap="round" />
          <!-- Chụp đèn quay về phía mascot -->
          <path d="M14 16 L32 8 L26 2 Z" fill="#FFD23F" stroke="#11141D" stroke-width="2.5" />
          <!-- Quầng sáng ấm áp -->
          <polygon points="12 18, -10 46, 20 46" fill="#FFD23F" opacity="0.35" />
        </g>

        <!-- 6 NGÔI SAO TĨNH 4 CÁNH TRÊN BẦU TRỜI ĐÊM (Không animation) -->
        <g transform="translate(180, 25)">
          <path d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2 Z" fill="#FFD23F" stroke="#11141D" stroke-width="1.5" />
        </g>
        <g transform="translate(310, 35)">
          <path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" fill="#FFFFFF" stroke="#11141D" stroke-width="1.5" />
        </g>
        <g transform="translate(485, 125)">
          <path d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5 Z" fill="#FFD23F" stroke="#11141D" stroke-width="1.5" />
        </g>
        <g transform="translate(70, 60)">
          <path d="M0 -5 L1.5 -1.5 L5 0 L1.5 1.5 L0 5 L-1.5 1.5 L-5 0 L-1.5 -1.5 Z" fill="#FFFFFF" stroke="#11141D" stroke-width="1.5" />
        </g>
        <g transform="translate(110, 120)">
          <path d="M0 -5 L1.5 -1.5 L5 0 L1.5 1.5 L0 5 L-1.5 1.5 L-5 0 L-1.5 -1.5 Z" fill="#9BE8C0" stroke="#11141D" stroke-width="1.5" />
        </g>
        <g transform="translate(490, 30)">
          <path d="M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z" fill="#FFFFFF" stroke="#11141D" stroke-width="1.5" />
        </g>
      </g>

      <!-- ==================== LINH VẬT QUYỂN SÁCH MASCOTBOOK ==================== -->
      <!-- Toạ độ định vị cố định đặt trên thẻ <g> ngoài -->
      <g transform="translate(120, 20)">
        <HeroMascot
          :period="period"
          :speech-greeting="speechGreeting"
          :exam-badge="examBadge"
        />
      </g>
    </svg>
  </div>
</template>
