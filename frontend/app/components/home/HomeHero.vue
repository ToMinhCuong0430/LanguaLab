<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, ArrowUpRight, Zap } from '@lucide/vue'
import HeroScene from '~/components/illustration/HeroScene.vue'
import { BRAND_NAME } from '~/constants/brand'

const route = useRoute()
const { user, profile } = useAuth()
const { user: homeUser, todayTasks } = useHomeData()

// 1. Xác định buổi: SÁNG (05:00 - 11:59), CHIỀU (12:00 - 17:59), TỐI (18:00 - 04:59)
// Hỗ trợ tham số debug `?period=sang|chieu|toi` khi ở môi trường phát triển (import.meta.dev)
const currentPeriod = computed<'sang' | 'chieu' | 'toi'>(() => {
  if (import.meta.dev && route.query.period) {
    const q = String(route.query.period).toLowerCase()
    if (q === 'sang' || q === 'chieu' || q === 'toi') {
      return q
    }
  }

  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'sang'
  if (hour >= 12 && hour < 18) return 'chieu'
  return 'toi'
})

// 2. Nội dung và cấu hình động theo từng buổi
const periodConfig = computed(() => {
  switch (currentPeriod.value) {
    case 'sang':
      return {
        tagLabel: 'SÁNG',
        tagBg: '#FFFBF0',
        tagInk: '#11141D',
        periodWord: 'sáng',
        description: 'Nạp năng lượng, mở trí thức. Khởi đầu ngày mới với một bài học nhé!',
        motivation: 'Khởi động thật hứng khởi!',
        bgColor: 'var(--hero-sang-bg)',
        hillColor: 'var(--hero-sang-hill)',
        textColor: 'var(--hero-sang-ink)',
        softTextColor: 'var(--hero-sang-ink-soft)',
      }
    case 'chieu':
      return {
        tagLabel: 'CHIỀU',
        tagBg: '#FFFBF0',
        tagInk: '#11141D',
        periodWord: 'chiều',
        description: 'Đánh thức cảm hứng, bứt phá ngoại ngữ. Thêm một bài học, tiến xa hơn!',
        motivation: 'Tiếp đà chinh phục!',
        bgColor: 'var(--hero-chieu-bg)',
        hillColor: 'var(--hero-chieu-hill)',
        textColor: 'var(--hero-chieu-ink)',
        softTextColor: 'var(--hero-chieu-ink-soft)',
      }
    case 'toi':
      return {
        tagLabel: 'TỐI',
        tagBg: '#FFC700',
        tagInk: '#11141D',
        periodWord: 'tối',
        description: 'Khép lại ngày bằng một bài học nhỏ. Để kiến thức lưu giữ bền lâu.',
        motivation: 'Một chút mỗi ngày, giỏi hơn mỗi ngày!',
        bgColor: 'var(--hero-toi-bg)',
        hillColor: 'var(--hero-toi-hill)',
        textColor: 'var(--hero-toi-ink)',
        softTextColor: 'var(--hero-toi-ink-soft)',
      }
  }
})

// Tên người dùng hiển thị
const displayName = computed(() => {
  return profile.value?.full_name || homeUser.value.name || 'bạn'
})

// Lời chào bong bóng thoại theo ngôn ngữ đang học (en / zh / ja)
const speechGreeting = computed(() => {
  const lang = profile.value?.learning_lang || 'en'
  if (lang === 'zh') return '你好!'
  if (lang === 'ja') return 'こんにちは!'
  return 'Hello!'
})

// Thẻ mục tiêu chứng chỉ hiển thị cạnh mascot (ví dụ "IELTS 7+", "HSK 5", "JLPT N2")
const examBadgeText = computed(() => {
  const exam = (profile.value?.target_exam || 'IELTS').toUpperCase()
  const band = profile.value?.target_band ? String(profile.value.target_band) : '7'
  return `${exam} ${band}+`
})

// Nút 1: "Học ngay" -> Dẫn tới nhiệm vụ gợi ý đầu tiên chưa xong, nếu không có thì tới '/go-cau'
const learnNowPath = computed(() => {
  if (todayTasks.value && todayTasks.value.length > 0) {
    return todayTasks.value[0].path || '/go-cau'
  }
  return '/go-cau'
})

// Nút 2: "Luyện đề IELTS" hoặc "Luyện thi" theo profile.target_exam
const examButtonInfo = computed(() => {
  const exam = profile.value?.target_exam?.toLowerCase()

  if (!exam || exam === 'ielts') {
    return {
      title: 'Luyện đề IELTS',
      path: '/luyen-thi/ielts',
    }
  }

  return {
    title: 'Luyện thi chứng chỉ',
    path: '/luyen-thi',
  }
})
</script>

<template>
  <section
    id="home-hero-banner"
    class="home-hero-root relative overflow-hidden rounded-brut-lg border-[3px] border-line shadow-[6px_6px_0px_#11141D]"
    :data-period="currentPeriod"
    :style="{
      backgroundColor: periodConfig.bgColor,
      color: periodConfig.textColor,
    }"
    aria-label="Lời chào và mục tiêu học tập hàng ngày"
  >
    <!-- DẢI ĐỒI LƯỢN SÓNG PHẲNG DƯỚI ĐÁY (Không viền đen, cao tối đa 90px, z-0) -->
    <div class="hero-hills-bg pointer-events-none absolute inset-x-0 bottom-0 z-0 h-20 sm:h-24 overflow-hidden">
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        class="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M0 45 Q320 5 650 50 T1200 35 L1200 120 L0 120 Z"
          :fill="periodConfig.hillColor"
        />
      </svg>
    </div>

    <!-- KHUNG NỘI DUNG CHÍNH (Desktop >= 1024px: Trái 7 cột, Phải 5 cột) -->
    <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-stretch gap-6 p-5 sm:p-8 lg:p-10 min-h-[300px] lg:min-h-[330px]">
      
      <!-- CỘT TRÁI (7 cột): THƯƠNG HIỆU, LỜI CHÀO, NÚT HỌC & ĐỘNG VIÊN -->
      <div class="lg:col-span-7 flex flex-col justify-between space-y-4">
        <!-- Hàng trên cùng: Thương hiệu + Nhãn buổi -->
        <div class="flex items-center gap-2.5">
          <span class="hero-brand-text font-display font-black text-sm tracking-tight text-[#11141D]">
            {{ BRAND_NAME }}
          </span>
          <span
            class="px-2.5 py-0.5 rounded-brut border-2 border-line font-display text-[11px] font-black tracking-wide shadow-brut-sm"
            :style="{ backgroundColor: periodConfig.tagBg, color: periodConfig.tagInk }"
          >
            {{ periodConfig.tagLabel }}
          </span>
        </div>

        <!-- Tiêu đề 2 dòng: Chào buổi [sáng/chiều/tối], / {Tên}! -->
        <div class="space-y-1">
          <h1 class="hero-heading font-display font-black text-3xl sm:text-4xl lg:text-[42px] leading-[1.1] tracking-tight">
            <span class="block">Chào buổi {{ periodConfig.periodWord }},</span>
            <span class="block">{{ displayName }}!</span>
          </h1>
          <p
            class="hero-description text-sm sm:text-base font-medium leading-relaxed max-w-xl"
            :style="{ color: periodConfig.softTextColor }"
          >
            {{ periodConfig.description }}
          </p>
        </div>

        <!-- Hai nút hành động cùng hàng: "Học ngay" (vàng) & "Luyện đề IELTS" (nền kem) -->
        <div class="flex flex-wrap items-center gap-3 pt-1">
          <!-- Nút chính: Học ngay (truyền icon ArrowRight qua slot #right) -->
          <BaseButton
            tone="yellow"
            variant="solid"
            :to="learnNowPath"
            class="whitespace-nowrap min-h-[44px] text-base"
          >
            <template #default>Học ngay</template>
            <template #right>
              <ArrowRight class="w-5 h-5 shrink-0" />
            </template>
          </BaseButton>

          <!-- Nút phụ: Luyện đề IELTS / Luyện thi chứng chỉ -->
          <NuxtLink
            :to="examButtonInfo.path"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-brut border-[2.5px] border-line bg-[#FFFBF0] text-[#11141D] font-display font-bold text-sm shadow-brut hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 whitespace-nowrap min-h-[44px] transition-transform"
          >
            <span>{{ examButtonInfo.title }}</span>
            <ArrowUpRight class="w-4 h-4 shrink-0" />
          </NuxtLink>
        </div>

        <!-- Dòng chip mục tiêu: Biểu tượng tia sét trong vòng tròn vàng + 50 XP + Động viên -->
        <div class="flex items-center gap-2.5 pt-1">
          <div class="w-7 h-7 rounded-full bg-[#FFC700] border-2 border-line flex items-center justify-center shrink-0 shadow-brut-sm">
            <Zap class="w-4 h-4 text-[#11141D] fill-[#11141D]" />
          </div>
          <div class="flex flex-wrap items-baseline gap-1.5 text-xs sm:text-sm">
            <span class="font-display font-black tracking-tight text-[#11141D]">
              Mục tiêu hôm nay: 50 XP
            </span>
            <span
              class="font-medium"
              :style="{ color: periodConfig.softTextColor }"
            >
              — {{ periodConfig.motivation }}
            </span>
          </div>
        </div>
      </div>

      <!-- CỘT PHẢI (5 cột): MINH HOẠ PHẲNG (Linh vật quyển sách mở, thẻ nghiêng, nền buổi) -->
      <div class="lg:col-span-5 flex items-end justify-center lg:justify-end min-h-[220px] sm:min-h-[260px] lg:min-h-[300px]">
        <HeroScene
          :period="currentPeriod"
          :speech-greeting="speechGreeting"
          :exam-badge="examBadgeText"
        />
      </div>

    </div>
  </section>
</template>

<style scoped>
/* 
 * Phạm vi CSS cục bộ cho HomeHero:
 * Thiết lập các biến CSS nền tảng cố định để đảm bảo banner hoạt động như một artwork độc lập,
 * không bị đảo màu khi chuyển chế độ Light / Dark mode.
 */
.home-hero-root {
  --line: #11141D;
  --ink: #11141D;
  --surface: #FFFBF0;
  --on-tone: #11141D;
}

/* Với buổi tối, màu nhãn thương hiệu trên banner là trắng */
.home-hero-root[data-period='toi'] .hero-brand-text {
  color: #FFFFFF;
}

.home-hero-root[data-period='toi'] .hero-hills-bg svg path {
  fill: var(--hero-toi-hill);
}
</style>
