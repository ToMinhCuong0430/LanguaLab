<script setup lang="ts">
import {
  Layers,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Trophy,
} from '@lucide/vue'
import { useLanguage } from '~/composables/useLanguage'
import { useGrammar, type GrammarPoint } from '~/composables/useGrammar'
import LanguageSelector from '~/components/common/LanguageSelector.vue'
import PageBanner from '~/components/common/PageBanner.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { learnStatusBadge } from '~/constants/badges'
import { BRAND_NAME } from '~/constants/brand'

useHead({
  title: `Bản đồ Ngữ pháp thực chiến - ${BRAND_NAME}`,
})

const { currentLang, currentLanguageOption } = useLanguage()
const {
  levelSections,
  expandedSections,
  completedPointIds,
  isLoading,
  errorMessage,
  fetchGrammarData,
  toggleSection,
  getSectionProgress,
} = useGrammar(currentLang)

const guideSteps: GuideStep[] = [
  {
    title: 'Phân cấp độ & Thu gọn Accordion',
    description: 'Ngữ pháp được chia thành các cấp độ. Cấp đầu tiên mở sẵn, các cấp còn lại thu gọn kèm vòng tiến độ.',
    targetId: 'grammar-level-accordion-0',
    badge: 'Bước 1',
  },
  {
    title: 'Thẻ điểm ngữ pháp có preview',
    description: 'Mỗi thẻ ngữ pháp hiển thị công thức khối, ví dụ thực tế kèm bản dịch và số bài tập.',
    targetId: 'grammar-points-grid',
    badge: 'Bước 2',
  },
]

// Mảng màu riêng cho từng dải cấp độ
const levelColors: Record<string, { bg: string; soft: string; ink: string }> = {
  A1: { bg: 'var(--c-green)', soft: 'var(--c-green-soft)', ink: 'var(--c-green-ink)' },
  A2: { bg: 'var(--c-cyan)', soft: 'var(--c-cyan-soft)', ink: 'var(--c-cyan-ink)' },
  B1: { bg: 'var(--c-yellow)', soft: 'var(--c-yellow-soft)', ink: 'var(--c-yellow-ink)' },
  B2: { bg: 'var(--c-blue)', soft: 'var(--c-blue-soft)', ink: 'var(--c-blue-ink)' },
  C1: { bg: 'var(--c-violet)', soft: 'var(--c-violet-soft)', ink: 'var(--c-violet-ink)' },
  HSK1: { bg: 'var(--c-green)', soft: 'var(--c-green-soft)', ink: 'var(--c-green-ink)' },
  HSK2: { bg: 'var(--c-cyan)', soft: 'var(--c-cyan-soft)', ink: 'var(--c-cyan-ink)' },
  N5: { bg: 'var(--c-green)', soft: 'var(--c-green-soft)', ink: 'var(--c-green-ink)' },
  N4: { bg: 'var(--c-cyan)', soft: 'var(--c-cyan-soft)', ink: 'var(--c-cyan-ink)' },
}

const getLevelTheme = (code: string) => {
  return levelColors[code] || { bg: 'var(--c-yellow)', soft: 'var(--c-yellow-soft)', ink: 'var(--c-yellow-ink)' }
}

// Tổng tiến độ
const totalStats = computed(() => {
  let allPoints: GrammarPoint[] = []
  levelSections.value.forEach(s => allPoints = allPoints.concat(s.points))
  const done = allPoints.filter(p => completedPointIds.value.includes(p.id)).length
  const total = allPoints.length
  return {
    done,
    total,
    percent: total > 0 ? Math.round((done / total) * 100) : 0,
  }
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8" data-feature="ngu-phap">
    <FirstVisitGuide page-key="ngu_phap_index_guide" :steps="guideSteps" />

    <!-- Top Bar with Language Selector -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <LanguageSelector />
      </div>

      <div class="flex items-center gap-2 text-xs font-bold text-ink-soft">
        <span class="px-2.5 py-1 bg-surface-2 border border-line rounded-brut">Phân cấp A1-C1 / HSK / JLPT</span>
        <span class="px-2.5 py-1 bg-surface-2 border border-line rounded-brut">Chấm điểm bài tập ngay</span>
      </div>
    </div>

    <!-- Page Banner (Banner màu yellow, Gộp tiến độ vào trong banner) -->
    <PageBanner
      feature="ngu-phap"
      title="Bản đồ Ngữ pháp theo cấu trúc"
      description="Hệ thống hoá quy tắc ngữ pháp theo từng cấp độ, sơ đồ khối dễ nhớ và bài tập tương tác (chọn đáp án, điền từ, sắp xếp câu) có chấm ngay."
      badge-text="Hệ thống hoá"
      badge-tone="warn"
    >
      <template #icon>
        <Layers class="h-6 w-6 text-on-tone" :stroke-width="2.5" />
      </template>

      <!-- Gộp thanh tiến độ chinh phục ngay trong banner -->
      <template #stats>
        <div class="w-full max-w-xl space-y-1.5 pt-1">
          <div class="flex items-center justify-between text-xs font-mono font-bold text-on-tone">
            <span>Tiến độ chinh phục ngữ pháp:</span>
            <span class="font-black">{{ totalStats.done }}/{{ totalStats.total }} điểm ({{ totalStats.percent }}%)</span>
          </div>
          <div class="w-full bg-surface h-3.5 rounded-brut border-2 border-line overflow-hidden shadow-[1px_1px_0_var(--line)]">
            <div
              class="bg-warn h-full border-r-2 border-line transition-all duration-300"
              :style="{ width: `${totalStats.percent}%` }"
            />
          </div>
        </div>
      </template>

      <template #actions>
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 bg-surface rounded-brut border-2 border-line text-xs font-black text-ink shadow-brut-sm">
            {{ currentLanguageOption.name }} • {{ totalStats.total }} chủ điểm
          </span>
        </div>
      </template>
    </PageBanner>

    <!-- Error Alert with Retry -->
    <div v-if="errorMessage" class="p-4 bg-warn-soft border-2 border-line rounded-brut shadow-brut flex items-center justify-between">
      <span class="text-xs font-bold text-ink">{{ errorMessage }}</span>
      <BaseButton tone="warn" size="sm" @click="fetchGrammarData">Thử lại</BaseButton>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="p-6 bg-surface border-2 border-line rounded-brut shadow-brut space-y-4">
      <BaseSkeleton class="h-6 w-1/4 rounded-brut" />
      <BaseSkeleton class="h-20 w-full rounded-brut" />
    </div>

    <!-- DANH SÁCH CÁC CẤP ĐỘ: MỖI CẤP LÀ MỘT DẢI MÀU RIÊNG, CẤP ĐẦU MỞ SẴN -->
    <div class="space-y-6">
      <div
        v-for="(section, sIdx) in levelSections"
        :id="`grammar-level-accordion-${sIdx}`"
        :key="section.levelCode"
        class="border-[3px] border-line rounded-brut-lg bg-surface shadow-brut overflow-hidden transition-all"
        :class="`border-l-[8px]`"
        :style="{ borderLeftColor: getLevelTheme(section.levelCode).bg }"
      >
        <!-- Accordion Header -->
        <button
          type="button"
          class="w-full p-5 sm:p-6 transition-colors flex items-center justify-between cursor-pointer border-b-2 border-line text-left"
          :style="{ backgroundColor: getLevelTheme(section.levelCode).soft }"
          @click="toggleSection(section.levelCode)"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-2.5">
              <span
                class="px-2.5 py-1 rounded-brut border-2 border-line font-black text-xs uppercase shadow-brut-sm text-on-tone"
                :style="{ backgroundColor: getLevelTheme(section.levelCode).bg }"
              >
                {{ section.levelCode }}
              </span>
              <h2 class="text-lg sm:text-xl font-black text-ink font-display">
                {{ section.levelName }}
              </h2>
            </div>
            <p class="text-xs sm:text-sm font-medium" :style="{ color: getLevelTheme(section.levelCode).ink }">
              {{ section.description }}
            </p>
          </div>

          <div class="flex items-center gap-4 flex-shrink-0 ml-2">
            <!-- Vòng tiến độ SVG mini -->
            <div class="flex items-center gap-2">
              <div class="relative flex h-9 w-9 items-center justify-center">
                <svg class="h-9 w-9 -rotate-90 transform" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" class="stroke-line/20" stroke-width="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke-linecap="round"
                    stroke-width="3"
                    :style="{ stroke: getLevelTheme(section.levelCode).bg }"
                    :stroke-dasharray="88"
                    :stroke-dashoffset="88 - (88 * (getSectionProgress(section.points).completed / getSectionProgress(section.points).total))"
                    class="transition-all duration-300"
                  />
                </svg>
                <span class="absolute font-mono text-[9px] font-black text-ink">
                  {{ getSectionProgress(section.points).percent }}%
                </span>
              </div>
              <span class="text-xs font-mono font-bold text-ink-soft hidden sm:inline">
                {{ getSectionProgress(section.points).completed }}/{{ getSectionProgress(section.points).total }} điểm
              </span>
            </div>

            <div class="p-2 rounded-brut border-2 border-line bg-surface text-ink shadow-brut-sm">
              <component :is="expandedSections[section.levelCode] ? ChevronUp : ChevronDown" class="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </button>

        <!-- Accordion Content: Danh sách điểm ngữ pháp có preview và cùng chiều cao -->
        <div v-show="expandedSections[section.levelCode]" id="grammar-points-grid" class="p-5 sm:p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            <NuxtLink
              v-for="point in section.points"
              :key="point.id"
              :to="`/ngu-phap/${point.id}`"
              class="p-5 rounded-brut-lg border-2 border-line bg-surface hover:bg-surface-2/80 transition-all flex flex-col justify-between group shadow-brut-sm hover:-translate-y-0.5 text-decoration-none h-full"
            >
              <div class="space-y-3">
                <!-- Header Card: Trạng thái & Chip số bài tập -->
                <div class="flex items-center justify-between">
                  <BaseBadge
                    v-bind="learnStatusBadge(completedPointIds.includes(point.id) ? 'done' : 'new')"
                    size="sm"
                    :uppercase="true"
                  />
                  <BaseBadge tone="neutral" size="sm">
                    {{ point.exercises.length }} bài tập
                  </BaseBadge>
                </div>

                <div>
                  <h3 class="text-base sm:text-lg font-black text-ink font-display group-hover:text-c-yellow-ink transition-colors">
                    {{ point.title }}
                  </h3>
                  <p class="text-xs text-ink-soft font-bold mt-0.5">
                    {{ point.vietnameseTitle }}
                  </p>
                </div>

                <!-- PREVIEW: CÔNG THỨC KHỐI MONOSPACE NỔI BẬT -->
                <div class="rounded-brut border-2 border-line bg-surface-2 p-3 space-y-1.5">
                  <span class="text-[10px] font-black uppercase text-ink-soft tracking-wider block">
                    Công thức:
                  </span>
                  <div class="font-mono text-xs sm:text-sm font-black text-ink bg-surface p-2 rounded border border-line overflow-x-auto">
                    {{ point.formula.pattern }}
                  </div>
                </div>

                <!-- PREVIEW: 1 CÂU VÍ DỤ KÈM BẢN DỊCH -->
                <div v-if="point.examples?.length" class="rounded-brut border-2 border-line bg-c-yellow-soft/40 p-3 space-y-1 text-xs">
                  <span class="text-[10px] font-black uppercase text-c-yellow-ink tracking-wider block">
                    Ví dụ mẫu:
                  </span>
                  <p class="font-bold text-ink italic">
                    "{{ point.examples[0].target ?? point.examples[0].sentence ?? '' }}"
                  </p>
                  <p class="text-[11px] text-ink-soft">
                    &rarr; {{ point.examples[0].vi ?? point.examples[0].translation ?? '' }}
                  </p>
                </div>
              </div>

              <!-- Footer hành động -->
              <div class="mt-4 pt-3 border-t-2 border-line/30 flex items-center justify-between text-xs font-bold text-ink">
                <span class="text-ink-soft font-mono">{{ point.summary }}</span>
                <span class="inline-flex items-center gap-1 text-on-tone bg-warn px-2.5 py-1 rounded-brut border border-line shadow-brut-sm font-black group-hover:translate-x-0.5 transition-transform">
                  <span>Vào học</span>
                  <ArrowRight class="w-3.5 h-3.5 stroke-[3]" />
                </span>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
