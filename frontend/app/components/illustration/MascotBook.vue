<script setup lang="ts">
/**
 * MascotBook.vue
 * Quyển sách đứng thẳng Neo-brutalism:
 * - Hai trang mở màu kem (#FFF9E6), có dòng chữ gạch ngang
 * - Gáy và viền bìa màu theo buổi (sáng: xanh dương, chiều: cam, tối: tím)
 * - Khuôn mặt cười: hai mắt tròn đen, miệng cười cong, má hồng
 * - Đội tai nghe chụp (headphone) vòng qua đầu
 * - Hai chân đen nhỏ đứng trên đế dẹt màu vàng
 * - Tấm thẻ nhỏ phía dưới đế có dòng chữ: "LITTLE STEPS. BIG DREAMS."
 */
const props = withDefaults(
  defineProps<{
    period?: 'sang' | 'chieu' | 'toi'
    spineColor?: string
    headphoneColor?: string
  }>(),
  {
    period: 'sang',
  }
)

const spineFill = computed(() => {
  if (props.spineColor) return props.spineColor
  if (props.period === 'sang') return '#2F5BFF' // Xanh dương
  if (props.period === 'chieu') return '#FF8A3D' // Cam
  return '#9B6BFF' // Tím
})

const headphoneFill = computed(() => {
  if (props.headphoneColor) return props.headphoneColor
  if (props.period === 'toi') return '#FFD23F' // Vàng nổi bật trên tối
  return '#2F5BFF'
})
</script>

<template>
  <g class="mascot-book-group">
    <!-- Hai chân đen nhỏ -->
    <line x1="88" y1="172" x2="88" y2="186" stroke="#11141D" stroke-width="4.5" stroke-linecap="round" />
    <ellipse cx="86" cy="186" rx="6" ry="3" fill="#11141D" />

    <line x1="112" y1="172" x2="112" y2="186" stroke="#11141D" stroke-width="4.5" stroke-linecap="round" />
    <ellipse cx="114" cy="186" rx="6" ry="3" fill="#11141D" />

    <!-- Đế dẹt màu vàng phía dưới -->
    <g transform="translate(100, 192)">
      <!-- Bóng đế -->
      <path d="M-68 8 C-68 8, 0 16, 68 8 C68 8, 0 0, -68 8 Z" fill="rgba(0,0,0,0.2)" />
      <!-- Đế dẹt vàng -->
      <ellipse cx="0" cy="0" rx="72" ry="10" fill="#FFD23F" stroke="#11141D" stroke-width="3.5" />
      
      <!-- Tấm thẻ nhỏ gắn dưới đế: "LITTLE STEPS. BIG DREAMS." -->
      <rect x="-62" y="10" width="124" height="15" rx="3" fill="#FFFFFF" stroke="#11141D" stroke-width="2.5" />
      <text
        x="0"
        y="21"
        text-anchor="middle"
        font-family="var(--font-display)"
        font-weight="900"
        font-size="7"
        letter-spacing="0.5"
        fill="#11141D"
      >
        LITTLE STEPS. BIG DREAMS.
      </text>
    </g>

    <!-- Thân sách: Bìa ngoài (màu theo buổi) -->
    <!-- Bìa trái -->
    <path
      d="M38 56 Q66 50 97 54 L97 172 Q66 166 38 170 Z"
      :fill="spineFill"
      stroke="#11141D"
      stroke-width="3.5"
      stroke-linejoin="round"
    />
    <!-- Bìa phải -->
    <path
      d="M103 54 Q134 50 162 56 L162 170 Q134 166 103 172 Z"
      :fill="spineFill"
      stroke="#11141D"
      stroke-width="3.5"
      stroke-linejoin="round"
    />

    <!-- Trang sách mở (Màu kem #FFF9E6) -->
    <!-- Trang trái -->
    <path
      d="M44 58 Q70 53 98 56 L98 168 Q70 163 44 166 Z"
      fill="#FFF9E6"
      stroke="#11141D"
      stroke-width="3.5"
      stroke-linejoin="round"
    />
    <!-- Trang phải -->
    <path
      d="M102 56 Q130 53 156 58 L156 166 Q130 163 102 168 Z"
      fill="#FFF9E6"
      stroke="#11141D"
      stroke-width="3.5"
      stroke-linejoin="round"
    />

    <!-- Gáy giữa (rãnh sách) -->
    <line x1="100" y1="55" x2="100" y2="170" stroke="#11141D" stroke-width="3.5" stroke-linecap="round" />

    <!-- Dòng chữ gạch trang trí trang trái -->
    <line x1="52" y1="72" x2="72" y2="70" stroke="#7E8B9B" stroke-width="2.5" stroke-linecap="round" />
    <line x1="52" y1="80" x2="68" y2="78" stroke="#7E8B9B" stroke-width="2.5" stroke-linecap="round" />
    
    <!-- Dòng chữ gạch trang trí trang phải -->
    <line x1="128" y1="70" x2="148" y2="72" stroke="#7E8B9B" stroke-width="2.5" stroke-linecap="round" />
    <line x1="132" y1="78" x2="148" y2="80" stroke="#7E8B9B" stroke-width="2.5" stroke-linecap="round" />

    <!-- KHUÔN MẶT CƯỜI TRUNG TÂM -->
    <!-- Mắt trái -->
    <circle cx="82" cy="106" r="4.5" fill="#11141D" />
    <circle cx="83.5" cy="104.5" r="1.5" fill="#FFFFFF" />

    <!-- Mắt phải -->
    <circle cx="118" cy="106" r="4.5" fill="#11141D" />
    <circle cx="119.5" cy="104.5" r="1.5" fill="#FFFFFF" />

    <!-- Má hồng trái & phải -->
    <ellipse cx="74" cy="114" rx="4.5" ry="3" fill="#FF70A6" opacity="0.8" />
    <ellipse cx="126" cy="114" rx="4.5" ry="3" fill="#FF70A6" opacity="0.8" />

    <!-- Miệng cười tươi -->
    <path
      d="M93 115 Q100 124 107 115"
      fill="none"
      stroke="#11141D"
      stroke-width="3.5"
      stroke-linecap="round"
    />

    <!-- TAI NGHE (HEADPHONES) CHỤP ĐẦU -->
    <!-- Quai vòm qua đầu -->
    <path
      d="M40 92 C32 40, 168 40, 160 92"
      fill="none"
      stroke="#11141D"
      stroke-width="5"
      stroke-linecap="round"
    />
    <path
      d="M40 92 C32 40, 168 40, 160 92"
      fill="none"
      :stroke="headphoneFill"
      stroke-width="2.5"
      stroke-linecap="round"
    />

    <!-- Ốp tai trái -->
    <rect
      x="28"
      y="84"
      width="14"
      height="26"
      rx="6"
      fill="#FFD23F"
      stroke="#11141D"
      stroke-width="3.5"
    />
    <ellipse cx="35" cy="97" rx="3.5" ry="7" fill="#11141D" />

    <!-- Ốp tai phải -->
    <rect
      x="158"
      y="84"
      width="14"
      height="26"
      rx="6"
      fill="#FFD23F"
      stroke="#11141D"
      stroke-width="3.5"
    />
    <ellipse cx="165" cy="97" rx="3.5" ry="7" fill="#11141D" />
  </g>
</template>
