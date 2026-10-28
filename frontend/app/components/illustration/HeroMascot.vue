<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    period: 'sang' | 'chieu' | 'toi'
    speechGreeting?: string
    examBadge?: string
  }>(),
  {
    speechGreeting: 'Hello!',
    examBadge: 'IELTS 7+',
  }
)

// Màu bìa sách theo buổi
const coverColor = computed(() => {
  switch (props.period) {
    case 'sang':
      return '#2F5BFF' // Xanh dương
    case 'chieu':
      return '#F28B52' // Cam ấm
    case 'toi':
      return '#A99BFF' // Tím nhạt
  }
})

// Màu thẻ lời chào theo buổi
const greetingCardBg = computed(() => {
  return props.period === 'toi' ? '#9BE8C0' : '#FFFBF0'
})
</script>

<template>
  <g class="hero-mascot-root">
    <!-- Thẻ lời chào nổi bên trái mascot (nghiêng -8 độ) -->
    <g transform="translate(-10, 30)">
      <g transform="rotate(-8 60 25)">
        <!-- Bóng cứng của thẻ -->
        <rect
          x="3"
          y="3"
          width="104"
          height="42"
          rx="6"
          fill="#11141D"
        />
        <!-- Thân thẻ -->
        <rect
          x="0"
          y="0"
          width="104"
          height="42"
          rx="6"
          :fill="greetingCardBg"
          stroke="#11141D"
          stroke-width="2.5"
        />
        <!-- Chữ chào -->
        <text
          x="52"
          y="27"
          text-anchor="middle"
          fill="#11141D"
          font-weight="900"
          font-size="16"
          style="font-family: var(--font-display), sans-serif; letter-spacing: -0.02em;"
        >
          {{ speechGreeting }}
        </text>
      </g>
    </g>

    <!-- Thẻ mục tiêu chứng chỉ bên phải mascot (nghiêng +8 độ) -->
    <g transform="translate(190, 45)">
      <g transform="rotate(8 55 22)">
        <!-- Bóng cứng của thẻ -->
        <rect
          x="3"
          y="3"
          width="108"
          height="38"
          rx="6"
          fill="#11141D"
        />
        <!-- Thân thẻ tím nhạt #A99BFF -->
        <rect
          x="0"
          y="0"
          width="108"
          height="38"
          rx="6"
          fill="#A99BFF"
          stroke="#11141D"
          stroke-width="2.5"
        />
        <!-- Chữ Exam Band -->
        <text
          x="54"
          y="24"
          text-anchor="middle"
          fill="#11141D"
          font-weight="900"
          font-size="14"
          style="font-family: var(--font-display), sans-serif; letter-spacing: -0.01em;"
        >
          {{ examBadge }}
        </text>
      </g>
    </g>

    <!-- ĐẾ ĐỨNG VÀNG CỦA LINH VẬT -->
    <g transform="translate(42, 222)">
      <!-- Bóng đế -->
      <rect
        x="4"
        y="4"
        width="196"
        height="32"
        rx="8"
        fill="#11141D"
      />
      <!-- Đế vàng #FFC700 -->
      <rect
        x="0"
        y="0"
        width="196"
        height="32"
        rx="8"
        fill="#FFC700"
        stroke="#11141D"
        stroke-width="3"
      />
      <!-- Nhãn chữ: LITTLE STEPS. BIG DREAMS. -->
      <text
        x="98"
        y="21"
        text-anchor="middle"
        fill="#11141D"
        font-weight="900"
        font-size="11"
        letter-spacing="0.1em"
        style="font-family: var(--font-display), sans-serif;"
      >
        LITTLE STEPS. BIG DREAMS.
      </text>
    </g>

    <!-- HAI CHÂN ĐỨNG NHỎ -->
    <g transform="translate(108, 202)">
      <!-- Chân trái -->
      <rect x="0" y="0" width="16" height="24" rx="4" fill="#FF8A00" stroke="#11141D" stroke-width="2.5" />
      <ellipse cx="8" cy="22" rx="10" ry="5" fill="#11141D" />
      <!-- Chân phải -->
      <rect x="42" y="0" width="16" height="24" rx="4" fill="#FF8A00" stroke="#11141D" stroke-width="2.5" />
      <ellipse cx="50" cy="22" rx="10" ry="5" fill="#11141D" />
    </g>

    <!-- THÂN QUYỂN SÁCH MỞ VÀ KHUÔN MẶT CƯỜI (Được bọc trong animation trôi nhẹ) -->
    <g transform="translate(40, 48)">
      <g class="animate-hero-mascot">
        <!-- Bìa sách sau - bóng đổ cứng 4px -->
        <path
          d="M10 20 Q100 0 190 20 L195 155 Q100 135 15 155 Z"
          fill="#11141D"
          transform="translate(4, 4)"
        />
        <!-- Bìa sách sau -->
        <path
          d="M10 20 Q100 0 190 20 L195 155 Q100 135 15 155 Z"
          :fill="coverColor"
          stroke="#11141D"
          stroke-width="3.5"
          stroke-linejoin="round"
        />

        <!-- Gáy sách trung tâm -->
        <rect
          x="97"
          y="15"
          width="10"
          height="142"
          fill="#11141D"
        />

        <!-- Trang sách bên trái (màu giấy kem #FFFBF0) -->
        <path
          d="M16 26 Q95 12 97 28 L97 148 Q95 136 18 148 Z"
          fill="#FFFBF0"
          stroke="#11141D"
          stroke-width="3"
          stroke-linejoin="round"
        />
        <!-- Dòng kẻ chữ trang trái -->
        <line x1="32" y1="52" x2="82" y2="52" stroke="#D8D0BA" stroke-width="2.5" stroke-linecap="round" />
        <line x1="32" y1="66" x2="80" y2="66" stroke="#D8D0BA" stroke-width="2.5" stroke-linecap="round" />
        <line x1="32" y1="80" x2="75" y2="80" stroke="#D8D0BA" stroke-width="2.5" stroke-linecap="round" />

        <!-- Trang sách bên phải (màu giấy kem #FFFBF0) -->
        <path
          d="M107 28 Q109 12 188 26 L186 148 Q109 136 107 148 Z"
          fill="#FFFBF0"
          stroke="#11141D"
          stroke-width="3"
          stroke-linejoin="round"
        />
        <!-- Dòng kẻ chữ trang phải -->
        <line x1="122" y1="52" x2="172" y2="52" stroke="#D8D0BA" stroke-width="2.5" stroke-linecap="round" />
        <line x1="124" y1="66" x2="172" y2="66" stroke="#D8D0BA" stroke-width="2.5" stroke-linecap="round" />
        <line x1="129" y1="80" x2="168" y2="80" stroke="#D8D0BA" stroke-width="2.5" stroke-linecap="round" />

        <!-- KHUÔN MẶT CƯỜI ĐÁNG YÊU TẠI TRUNG TÂM -->
        <!-- Mắt trái nhắm cười kiểu chibi -->
        <path
          d="M68 100 Q78 88 88 100"
          fill="none"
          stroke="#11141D"
          stroke-width="3.5"
          stroke-linecap="round"
        />
        <!-- Mắt phải nhắm cười kiểu chibi -->
        <path
          d="M116 100 Q126 88 136 100"
          fill="none"
          stroke="#11141D"
          stroke-width="3.5"
          stroke-linecap="round"
        />

        <!-- Má hồng trái -->
        <ellipse cx="64" cy="112" rx="9" ry="6" fill="#FF70A6" />
        <!-- Má hồng phải -->
        <ellipse cx="140" cy="112" rx="9" ry="6" fill="#FF70A6" />

        <!-- Miệng cười mở rộng vui sướng -->
        <path
          d="M93 108 Q102 124 111 108 Z"
          fill="#FF5A4E"
          stroke="#11141D"
          stroke-width="2.5"
        />
        <!-- Lưỡi hồng trong miệng -->
        <path
          d="M97 114 Q102 122 107 114 Z"
          fill="#FFB6C1"
        />

        <!-- TAI NGHE CHÙM ĐẦU THỜI TRANG -->
        <!-- Quai tai nghe vòm trên đầu -->
        <path
          d="M40 50 Q102 -15 164 50"
          fill="none"
          stroke="#11141D"
          stroke-width="6.5"
          stroke-linecap="round"
        />
        <path
          d="M40 50 Q102 -15 164 50"
          fill="none"
          stroke="#2F5BFF"
          stroke-width="3"
          stroke-linecap="round"
        />

        <!-- Ốp tai nghe bên trái (Vàng viền đen) -->
        <g transform="translate(24, 44)">
          <!-- Bóng ốp tai -->
          <rect x="2" y="2" width="22" height="42" rx="9" fill="#11141D" />
          <!-- Thân ốp tai -->
          <rect x="0" y="0" width="22" height="42" rx="9" fill="#FFC700" stroke="#11141D" stroke-width="3" />
          <line x1="11" y1="12" x2="11" y2="30" stroke="#11141D" stroke-width="2.5" stroke-linecap="round" />
        </g>

        <!-- Ốp tai nghe bên phải (Vàng viền đen) -->
        <g transform="translate(158, 44)">
          <!-- Bóng ốp tai -->
          <rect x="2" y="2" width="22" height="42" rx="9" fill="#11141D" />
          <!-- Thân ốp tai -->
          <rect x="0" y="0" width="22" height="42" rx="9" fill="#FFC700" stroke="#11141D" stroke-width="3" />
          <line x1="11" y1="12" x2="11" y2="30" stroke="#11141D" stroke-width="2.5" stroke-linecap="round" />
        </g>
      </g>
    </g>
  </g>
</template>
