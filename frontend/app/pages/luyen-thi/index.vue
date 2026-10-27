<script setup lang="ts">
import { Award, ArrowRight, Lock, Headphones, BookOpen, PenTool, Mic } from '@lucide/vue'
import PageBanner from '~/components/common/PageBanner.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { BRAND_NAME } from '~/constants/brand'
import { learnStatusBadge } from '~/constants/badges'

useHead({
  title: `Luyện thi chứng chỉ quốc tế - ${BRAND_NAME}`,
})

const { examOptions } = useHomeData()

const examGuideSteps: GuideStep[] = [
  {
    targetId: 'exam-banner',
    badge: 'BƯỚC 1',
    title: 'Trung tâm Khảo thí & Luyện thi',
    description: 'Nơi tập hợp các đề thi thử chuẩn format quốc tế hoàn toàn miễn phí, có bấm giờ và phân tích chi tiết.',
  },
  {
    targetId: 'exam-ielts-card',
    badge: 'BƯỚC 2',
    title: 'IELTS Academic & General',
    description: 'Kỳ thi đang mở luyện trọn bộ 4 kỹ năng Nghe, Nói, Đọc, Viết với kho đề Cambridge kinh điển.',
  },
  {
    targetId: 'exam-upcoming-grid',
    badge: 'BƯỚC 3',
    title: 'Các kỳ thi sắp ra mắt',
    description: 'TOEIC, TOEFL, HSK và JLPT đang được số hóa và sẽ sớm ra mắt.',
  },
]

// 4 preview kỹ năng riêng biệt
const skillPreviews = [
  {
    name: 'Listening',
    sub: 'Hình sóng âm & 4 Sections',
    color: 'bg-c-blue text-white',
    border: 'border-l-c-blue',
    icon: Headphones,
    preview: 'Audio Section 1: Đàm thoại thông tin thường nhật, bẫy số điện thoại và địa chỉ.',
  },
  {
    name: 'Reading',
    sub: '2 dòng trích bài đọc học thuật',
    color: 'bg-c-green text-ink',
    border: 'border-l-c-green',
    icon: BookOpen,
    preview: '"The history of urban architecture suggests that green spaces profoundly influence cognitive well-being..."',
  },
  {
    name: 'Writing',
    sub: 'Đề Task 1 & 2 rút gọn',
    color: 'bg-c-orange text-ink',
    border: 'border-l-c-orange',
    icon: PenTool,
    preview: 'Task 2: Some believe technology isolates individuals while others argue it bridges cultural barriers. Discuss both views.',
  },
  {
    name: 'Speaking',
    sub: 'Câu hỏi Part 1 trực diện',
    color: 'bg-c-pink text-ink',
    border: 'border-l-c-pink',
    icon: Mic,
    preview: 'Part 1: "Do you prefer studying alone or in a group? How has your routine changed over the past few years?"',
  },
]
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8" data-feature="luyen-thi">
    <!-- Page Banner (Màu coral) -->
    <div id="exam-banner">
      <PageBanner
        feature="luyen-thi"
        title="Luyện thi chứng chỉ quốc tế"
        description="Rèn luyện kỹ năng phòng thi, bấm giờ thực tế và nhận phân tích điểm thô quy đổi sang Band chuẩn quốc tế."
        badge-text="TRUNG TÂM KHẢO THÍ"
        badge-tone="warn"
      >
        <template #icon>
          <Award class="h-6 w-6 text-on-tone" :stroke-width="2.5" />
        </template>

        <template #actions>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 bg-surface rounded-brut border-2 border-line text-xs font-black text-ink shadow-brut-sm">
              IELTS Master: Band 5.5 &rarr; 7.0
            </span>
          </div>
        </template>
      </PageBanner>
    </div>

    <!-- Danh sách các kỳ thi -->
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl sm:text-2xl font-black text-ink">
          Chọn kỳ thi mục tiêu của bạn
        </h2>
        <span class="text-xs font-bold text-ink-soft">
          Ưu tiên IELTS Academic & General
        </span>
      </div>

      <!-- IELTS ACTIVE CARD LỚN: 4 Ô KỸ NĂNG CÓ MÀU VÀ PREVIEW RIÊNG -->
      <div
        id="exam-ielts-card"
        class="rounded-brut-lg border-[4px] border-line bg-surface p-6 sm:p-8 shadow-brut space-y-6"
      >
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b-2 border-line pb-6">
          <div class="space-y-3 max-w-2xl">
            <div class="flex items-center gap-2">
              <BaseBadge tone="green" size="sm" :uppercase="true">
                Đang mở luyện đầy đủ 4 kỹ năng
              </BaseBadge>
              <BaseBadge tone="neutral" size="sm">
                Thang điểm Band 0 - 9.0
              </BaseBadge>
            </div>

            <h3 class="font-display text-2xl sm:text-4xl font-black text-ink">
              IELTS Academic & General Training
            </h3>

            <p class="text-sm sm:text-base text-ink-soft leading-relaxed font-medium">
              Đề thi mô phỏng định dạng thi trên máy tính (Computer-delivered IELTS).
              Reading chia đôi màn hình, Listening giới hạn lượt nghe, Writing đếm từ thời gian thực và Speaking thu âm bấm giờ chuẩn Part 2.
            </p>
          </div>

          <!-- Hiện band hiện tại và band mục tiêu ngay trên thẻ -->
          <div class="flex flex-wrap items-center gap-4 flex-shrink-0">
            <div class="p-3 bg-surface-2 rounded-brut border-2 border-line text-center min-w-[110px]">
              <span class="text-[10px] font-bold uppercase text-ink-soft block">Band hiện tại</span>
              <span class="font-display text-2xl font-black text-ink">5.5</span>
            </div>
            <div class="p-3 bg-warn text-on-tone rounded-brut border-2 border-line text-center min-w-[110px] shadow-brut-sm">
              <span class="text-[10px] font-black uppercase block">Mục tiêu</span>
              <span class="font-display text-2xl font-black">7.0</span>
            </div>

            <BaseButton
              to="/luyen-thi/ielts"
              variant="primary"
              size="lg"
            >
              <span>Vào trung tâm IELTS</span>
              <template #right>
                <ArrowRight class="h-5 w-5" :stroke-width="2.5" />
              </template>
            </BaseButton>
          </div>
        </div>

        <!-- 4 Ô KỸ NĂNG: MỖI Ô MỘT MÀU VÀ MỘT PREVIEW RIÊNG -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NuxtLink
            v-for="skill in skillPreviews"
            :key="skill.name"
            to="/luyen-thi/ielts"
            class="p-4 rounded-brut border-2 border-line bg-surface hover:bg-surface-2 transition-all flex flex-col justify-between shadow-brut-sm hover:-translate-y-0.5 text-decoration-none border-l-[6px]"
            :class="skill.border"
          >
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-brut border-2 border-line shadow-sm"
                  :class="skill.color"
                >
                  <component :is="skill.icon" class="h-5 w-5" :stroke-width="2.5" />
                </div>
                <span class="font-display text-base font-black text-ink">{{ skill.name }}</span>
              </div>

              <span class="text-[11px] font-bold text-ink-soft block">{{ skill.sub }}</span>

              <!-- Nội dung preview trích đoạn -->
              <div class="p-2.5 bg-surface-2 rounded-brut border border-line text-xs font-medium text-ink line-clamp-3 italic leading-relaxed">
                {{ skill.preview }}
              </div>
            </div>

            <div class="mt-3 pt-2 border-t border-line/30 flex items-center justify-between text-xs font-black text-accent">
              <span>Luyện kỹ năng</span>
              <ArrowRight class="w-3.5 h-3.5" />
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- CÁC KỲ THI CHƯA MỞ (TOEIC, TOEFL, HSK, JLPT): NHỎ GỌN, MỜ, MỘT HÀNG -->
      <div id="exam-upcoming-grid" class="space-y-3 pt-2">
        <h3 class="font-display text-sm font-black text-ink-soft uppercase tracking-wider">
          Kỳ thi sắp mở luyện (Đang số hóa đề)
        </h3>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            v-for="exam in examOptions.filter(e => e.id !== 'ielts')"
            :key="exam.id"
            class="flex items-center justify-between rounded-brut border-2 border-line/60 bg-surface-2 p-3 opacity-65 cursor-not-allowed select-none"
          >
            <div class="space-y-0.5">
              <div class="flex items-center gap-1.5">
                <span class="font-display text-sm font-black text-ink">
                  {{ exam.name }}
                </span>
                <Lock class="h-3 w-3 text-ink-soft" :stroke-width="2.5" />
              </div>
              <span class="text-[11px] font-bold text-ink-soft block line-clamp-1">
                {{ exam.fullName }}
              </span>
            </div>
            <BaseBadge v-bind="learnStatusBadge('coming_soon')" size="sm" />
          </div>
        </div>
      </div>
    </div>

    <!-- First Visit Guide -->
    <FirstVisitGuide
      pageKey="exam-select"
      :steps="examGuideSteps"
    />
  </div>
</template>
