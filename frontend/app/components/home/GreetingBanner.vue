<script setup lang="ts">
import { ArrowRight, ArrowUpRight, Zap } from '@lucide/vue'
import GreetingScene from '~/components/illustration/GreetingScene.vue'
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

// 2. Nội dung và thông điệp động theo từng buổi
const periodConfig = computed(() => {
  switch (currentPeriod.value) {
    case 'sang':
      return {
        tagLabel: 'BUỔI SÁNG',
        tagBg: 'var(--surface)',
        tagInk: 'var(--ink)',
        greetingTitle: 'Chào buổi sáng,',
        description: 'Nạp năng lượng, mở trí thức. Khởi đầu ngày mới với một bài học nhé!',
        motivation: 'Khởi động thật hứng khởi!',
      }
    case 'chieu':
      return {
        tagLabel: 'BUỔI CHIỀU',
        tagBg: 'var(--surface)',
        tagInk: 'var(--ink)',
        greetingTitle: 'Chào buổi chiều,',
        description: 'Đánh thức cảm hứng, bứt phá ngoại ngữ. Thêm một bài học, tiến xa hơn!',
        motivation: 'Tiếp đà chinh phục!',
      }
    case 'toi':
      return {
        tagLabel: 'BUỔI TỐI',
        tagBg: 'var(--c-blue)',
        tagInk: 'var(--on-tone, #ffffff)',
        greetingTitle: 'Chào buổi tối,',
        description: 'Khép lại ngày bằng một bài học nhỏ. Để kiến thức lưu giữ bền lâu.',
        motivation: 'Một chút mỗi ngày, giỏi hơn mỗi ngày!',
      }
  }
})

// Tên người dùng hiển thị
const displayName = computed(() => {
  return profile.value?.full_name || homeUser.value.name || 'bạn'
})

// Lời chào bong bóng thoại theo ngôn ngữ đang học (en / zh / ja)
// (Ảnh thiết kế dùng Hello!, Hola!, Bonsoir! theo buổi, nhưng web LanguaLab hỗ trợ en/zh/ja nên ánh xạ theo ngôn ngữ người dùng)
const speechGreeting = computed(() => {
  const lang = profile.value?.learning_lang || 'en'
  if (lang === 'zh') return '你好!'
  if (lang === 'ja') return 'こんにちは!'
  return 'Hello!'
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
  if (!exam) return null

  if (exam === 'ielts') {
    return {
      title: 'Luyện đề IELTS',
      path: '/luyen-thi/ielts',
    }
  }

  return {
    title: 'Luyện thi',
    path: '/luyen-thi',
  }
})

// Số XP mục tiêu hôm nay
const targetXp = 50
</script>

<template>
  <section
    id="home-greeting-banner"
    class="greeting-banner-root relative overflow-hidden rounded-brut-lg border-[3px] border-line shadow-brut"
    :data-period="currentPeriod"
    aria-label="Lời chào và mục tiêu học tập hàng ngày"
  >
    <!-- NỀN ĐỒI LƯỢN SÓNG DƯỚI ĐÁY BẰNG SVG NỘI TUYẾN -->
    <div class="banner-hills-bg pointer-events-none absolute inset-x-0 bottom-0 z-0 h-28 sm:h-36 overflow-hidden">
      <svg
        viewBox="0 0 1200 160"
        preserveAspectRatio="none"
        class="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <!-- Lớp đồi xa nhẹ -->
        <path
          d="M0 80 Q320 30 650 90 T1200 70 L1200 160 L0 160 Z"
          fill="var(--banner-hill-far)"
        />
        <!-- Lớp đồi chính lượn sóng viền đen -->
        <path
          d="M0 100 Q280 40 580 95 T1200 85 L1200 160 L0 160 Z"
          fill="var(--banner-hill)"
          stroke="var(--line, #11141D)"
          stroke-width="3.5"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <!-- KHUNG NỘI DUNG CHÍNH (Desktop: Chữ 55% trái, Minh hoạ 45% phải) -->
    <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-stretch gap-6 p-5 sm:p-8 lg:p-10 min-h-[270px] sm:min-h-[300px]">
      
      <!-- CỘT TRÁI: THƯƠNG HIỆU, LỜI CHÀO, NÚT HỌC & ĐỘNG VIÊN -->
      <div class="lg:col-span-7 flex flex-col justify-between space-y-4">
        <!-- Hàng trên cùng: Thương hiệu đậm + Nhãn buổi -->
        <div class="flex items-center gap-2.5">
          <span class="banner-brand-text font-display font-black text-sm tracking-tight">
            {{ BRAND_NAME }}
          </span>
          <span
            class="px-2.5 py-0.5 rounded-brut border-2 border-line font-display text-[11px] font-black tracking-wide shadow-brut-sm"
            :style="{ backgroundColor: periodConfig.tagBg, color: periodConfig.tagInk }"
          >
            {{ periodConfig.tagLabel }}
          </span>
        </div>

        <!-- Tiêu đề lớn 2 dòng: Chào buổi sáng / {Tên}! -->
        <div class="space-y-1.5">
          <h1 class="banner-heading font-display font-black text-3xl sm:text-4xl lg:text-[42px] leading-[1.1] tracking-tight">
            <span class="block">{{ periodConfig.greetingTitle }}</span>
            <span class="block">{{ displayName }}!</span>
          </h1>

          <p class="banner-desc text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
            {{ periodConfig.description }}
          </p>
        </div>

        <!-- Hàng 2 nút cạnh nhau: Học ngay + Luyện đề IELTS -->
        <div class="flex flex-wrap items-center gap-3 pt-1">
          <!-- Nút 1: Học ngay (Nền vàng, chữ đen viền đen) -->
          <BaseButton
            :to="learnNowPath"
            tone="warn"
            class="banner-action-btn font-black"
          >
            <span>Học ngay</span>
            <ArrowRight class="h-4 w-4 ml-1.5" :stroke-width="2.5" />
          </BaseButton>

          <!-- Nút 2: Luyện đề IELTS (Nền trắng viền đen) -->
          <NuxtLink
            v-if="examButtonInfo"
            :to="examButtonInfo.path"
            class="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-brut border-2 border-line bg-surface font-display text-xs sm:text-sm font-bold text-ink shadow-brut-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-decoration-none cursor-pointer brut-press"
          >
            <span>{{ examButtonInfo.title }}</span>
            <ArrowUpRight class="h-4 w-4" :stroke-width="2.5" />
          </NuxtLink>
        </div>

        <!-- Dòng cuối: Icon tia chớp + Mục tiêu XP + Câu động viên -->
        <div class="banner-footer-line flex items-center gap-2 text-xs font-bold pt-2">
          <!-- Icon tia chớp trong vòng tròn vàng viền đen -->
          <span class="flex h-5 w-5 items-center justify-center rounded-full border-2 border-line bg-warn shrink-0">
            <Zap class="h-3 w-3 text-on-tone fill-current" />
          </span>
          <span class="font-black">Mục tiêu hôm nay: {{ targetXp }} XP</span>
          <span class="opacity-60">•</span>
          <span class="opacity-90 font-medium truncate">{{ periodConfig.motivation }}</span>
        </div>
      </div>

      <!-- CỘT PHẢI: MINH HOẠ PHẲNG SVG ĐẶC TRƯNG -->
      <div class="lg:col-span-5 flex items-center justify-center lg:justify-end">
        <div class="w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[440px] h-[190px] sm:h-[220px] lg:h-[250px] flex items-center justify-center">
          <GreetingScene
            :period="currentPeriod"
            :speech-text="speechGreeting"
            :exam-name="profile?.target_exam || 'IELTS'"
            :target-band="profile?.target_band ? String(profile.target_band) : '7'"
          />
        </div>
      </div>

    </div>
  </section>
</template>

<style scoped>
/* KHAI BÁO BẢNG BIẾN MÀU THEO BUỔI (data-period) */
.greeting-banner-root {
  transition: background-color 0.25s ease, color 0.25s ease;
}

/* 1. SÁNG: Xanh ngọc nhạt, đồi ngọc */
[data-period='sang'] {
  --banner-bg: var(--greeting-morning-bg, #BDEFF7);
  --banner-hill: var(--greeting-morning-hill, #7FD6D0);
  --banner-hill-far: var(--greeting-morning-hill-far, #9FE3DE);
  --banner-ink: var(--greeting-morning-ink, #11141D);
  --banner-ink-soft: var(--greeting-morning-ink-soft, #233842);
  background-color: var(--banner-bg);
  color: var(--banner-ink);
}

/* 2. CHIỀU: Cam đào nhạt, đồi cam */
[data-period='chieu'] {
  --banner-bg: var(--greeting-afternoon-bg, #FFD3A1);
  --banner-hill: var(--greeting-afternoon-hill, #F4A261);
  --banner-hill-far: var(--greeting-afternoon-hill-far, #F9BC89);
  --banner-ink: var(--greeting-afternoon-ink, #11141D);
  --banner-ink-soft: var(--greeting-afternoon-ink-soft, #422818);
  background-color: var(--banner-bg);
  color: var(--banner-ink);
}

/* 3. TỐI: Xanh navy đậm, đồi navy, chữ trắng */
[data-period='toi'] {
  --banner-bg: var(--greeting-evening-bg, #1B2565);
  --banner-hill: var(--greeting-evening-hill, #34479B);
  --banner-hill-far: var(--greeting-evening-hill-far, #25337E);
  --banner-ink: var(--greeting-evening-ink, #FFFFFF);
  --banner-ink-soft: var(--greeting-evening-ink-soft, #D3DBFF);
  background-color: var(--banner-bg);
  color: var(--banner-ink);
}

/* Các chi tiết chữ trong Banner */
.banner-brand-text {
  color: var(--banner-ink);
}

.banner-heading {
  color: var(--banner-ink);
}

.banner-desc {
  color: var(--banner-ink-soft);
}

.banner-footer-line {
  color: var(--banner-ink);
}
</style>
