<script setup lang="ts">
import {
  GraduationCap,
  Play,
  History,
  Target,
  ArrowRight,
  Clock,
} from '@lucide/vue'
import PageBanner from '~/components/common/PageBanner.vue'
import SkillCard from '~/components/ielts/SkillCard.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { ieltsSkillBadge } from '~/constants/badges'
import { BRAND_NAME } from '~/constants/brand'

useHead({
  title: `Trung tâm Luyện thi IELTS - ${BRAND_NAME}`,
})

const { skillsOverview, recentAttempts } = useIelts()

const ieltsGuideSteps: GuideStep[] = [
  {
    targetId: 'ielts-band-stats',
    badge: 'BƯỚC 1',
    title: 'Theo dõi Band điểm',
    description: 'Quan sát Band điểm Overall ước tính và mốc mục tiêu của bạn để lập kế hoạch ôn thi hợp lý.',
  },
  {
    targetId: 'ielts-skill-cards',
    badge: 'BƯỚC 2',
    title: '4 Kỹ năng Nghe - Nói - Đọc - Viết',
    description: 'Chọn từng kỹ năng để luyện theo dạng bài (Section, Passage, Task hoặc Part).',
  },
  {
    targetId: 'ielts-full-mock',
    badge: 'BƯỚC 3',
    title: 'Thi thử trọn bộ Full Mock',
    description: 'Thử sức với bài thi toàn diện tính giờ nghiêm ngặt giống hệt phòng thi IDP/British Council.',
  },
  {
    targetId: 'ielts-history',
    badge: 'BƯỚC 4',
    title: 'Lịch sử làm bài',
    description: 'Xem lại các lần thi thử, điểm số thô và bài phân tích điểm mạnh điểm yếu.',
  },
]
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8" data-feature="luyen-thi">
    <!-- Page Banner -->
    <PageBanner
      feature="luyen-thi"
      title="Trung tâm Luyện thi IELTS Academic & General"
      description="Luyện đề chuyên sâu 4 kỹ năng với giao diện Computer-delivered mô phỏng phòng thi thật, chấm điểm và giải thích chi tiết."
      badge-text="IELTS MASTER"
      badge-tone="ok"
    >
      <template #icon>
        <GraduationCap class="h-6 w-6" :stroke-width="2.5" />
      </template>
      <template #actions>
        <NuxtLink
          to="/luyen-thi"
          class="text-xs font-bold text-ink underline underline-offset-4 hover:text-accent"
        >
          ← Đổi kỳ thi khác
        </NuxtLink>
      </template>
    </PageBanner>

    <!-- Khối Band điểm hiện tại & Band mục tiêu Overall -->
    <div
      id="ielts-band-stats"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
    >
      <div class="rounded-brut-lg border-[3px] border-line bg-surface p-4 shadow-brut flex items-center justify-between">
        <div>
          <span class="text-xs font-bold text-ink-soft uppercase tracking-wider block">Band hiện tại</span>
          <span class="font-display text-3xl font-black text-ink">5.5 Overall</span>
        </div>
        <div class="p-2.5 rounded-brut border-2 border-line bg-surface-2 text-ink font-display text-sm font-black">
          B2
        </div>
      </div>

      <div class="rounded-brut-lg border-[3px] border-line bg-warn p-4 shadow-brut flex items-center justify-between text-on-tone">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider block">Band mục tiêu</span>
          <span class="font-display text-3xl font-black">7.0 Overall</span>
        </div>
        <div class="p-2.5 rounded-brut border-2 border-line bg-surface text-ink font-display text-sm font-black">
          C1
        </div>
      </div>

      <div class="rounded-brut-lg border-[3px] border-line bg-surface p-4 shadow-brut flex items-center justify-between">
        <div>
          <span class="text-xs font-bold text-ink-soft uppercase tracking-wider block">Đề đã hoàn thành</span>
          <span class="font-display text-3xl font-black text-ink">31 đề</span>
        </div>
        <div class="p-2.5 rounded-brut border-2 border-line bg-ok text-on-tone font-display text-sm font-black">
          ✓
        </div>
      </div>

      <!-- Nút Thi thử trọn bộ (Full Mock Test) -->
      <div
        id="ielts-full-mock"
        class="rounded-brut-lg border-[3px] border-line bg-accent p-4 shadow-brut flex flex-col justify-between text-accent-ink"
      >
        <div>
          <span class="text-[10px] font-black uppercase tracking-wider block opacity-90">Phòng thi giả lập</span>
          <span class="font-display text-base font-black">Thi thử trọn bộ</span>
        </div>

        <div class="pt-2">
          <BaseButton
            to="/luyen-thi/ielts/reading"
            variant="secondary"
            size="sm"
            block
          >
            <Play class="h-3.5 w-3.5 fill-current" :stroke-width="2.5" />
            <span>Bắt đầu Full Test (2h45p)</span>
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Lưới 4 Thẻ kỹ năng Listening, Speaking, Reading, Writing -->
    <div id="ielts-skill-cards" class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl sm:text-2xl font-black text-ink">
          Luyện tập theo từng kỹ năng
        </h2>
        <span class="text-xs font-bold text-ink-soft">
          Chọn kỹ năng để lọc đề theo dạng câu hỏi
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <SkillCard
          v-for="ov in skillsOverview"
          :key="ov.skill"
          :overview="ov"
        />
      </div>
    </div>

    <!-- Lịch sử làm bài gần đây -->
    <div id="ielts-history" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <History class="h-5 w-5 text-ink" :stroke-width="2.5" />
          <h2 class="text-xl font-black text-ink">
            Lịch sử làm bài gần đây
          </h2>
        </div>
        <span class="text-xs font-bold text-ink-soft">
          3 bài gần nhất
        </span>
      </div>

      <div class="overflow-x-auto rounded-brut-lg border-[3px] border-line bg-surface shadow-brut">
        <table class="w-full text-left text-sm text-ink">
          <thead class="border-b-[3px] border-line bg-surface-2 font-display text-xs font-black uppercase tracking-wider">
            <tr>
              <th class="p-3.5">Tên đề thi</th>
              <th class="p-3.5">Kỹ năng</th>
              <th class="p-3.5">Ngày làm</th>
              <th class="p-3.5">Chế độ</th>
              <th class="p-3.5">Kết quả</th>
              <th class="p-3.5 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody class="divide-y-2 divide-line/20 font-medium">
            <tr
              v-for="att in recentAttempts"
              :key="att.id"
              class="hover:bg-surface-2/60 transition-colors"
            >
              <td class="p-3.5 font-bold">
                {{ att.testTitle }}
              </td>
              <td class="p-3.5 capitalize">
                <BaseBadge v-bind="ieltsSkillBadge(att.skill)" size="sm" />
              </td>
              <td class="p-3.5 text-ink-soft text-xs">
                {{ att.date }}
              </td>
              <td class="p-3.5">
                <BaseBadge :tone="att.mode === 'exam' ? 'yellow' : 'neutral'" size="sm">
                  {{ att.mode === 'exam' ? 'Thi thử' : 'Luyện tập' }}
                </BaseBadge>
              </td>
              <td class="p-3.5 font-black text-sm">
                <span v-if="att.rawScore !== undefined" class="text-ink-soft mr-1">
                  {{ att.rawScore }}/{{ att.totalQuestions }}
                </span>
                <span class="rounded border border-line bg-ok px-2 py-0.5 text-xs font-black text-on-tone shadow-brut-sm">
                  Band {{ att.bandScore.toFixed(1) }}
                </span>
              </td>
              <td class="p-3.5 text-right">
                <NuxtLink
                  :to="`/luyen-thi/ielts/lam-bai/${att.testId}`"
                  class="inline-flex items-center gap-1 text-xs font-bold text-ink underline hover:text-accent"
                >
                  <span>Làm lại</span>
                  <ArrowRight class="h-3.5 w-3.5" :stroke-width="2.5" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- First Visit Guide -->
    <FirstVisitGuide
      pageKey="ielts-overview"
      :steps="ieltsGuideSteps"
    />
  </div>
</template>
