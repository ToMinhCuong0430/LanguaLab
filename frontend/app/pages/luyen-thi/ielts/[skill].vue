<script setup lang="ts">
import {
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Filter,
  Clock,
  HelpCircle,
  Play,
  CheckCircle,
  ArrowRight,
} from '@lucide/vue'
import type { IeltsSkill, TestMode } from '~/composables/useIelts'
import PageBanner from '~/components/common/PageBanner.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { BRAND_NAME } from '~/constants/brand'

const route = useRoute()
const skillParam = computed(() => (route.params.skill as string).toLowerCase() as IeltsSkill)

const { getSkillOverview, getTestsBySkill } = useIelts()

const validSkills: IeltsSkill[] = ['listening', 'reading', 'writing', 'speaking']

// Nếu URL gõ sai kỹ năng thì chuyển về trang tổng quan
if (!validSkills.includes(skillParam.value)) {
  navigateTo('/luyen-thi/ielts')
}

const skillOverview = computed(() => getSkillOverview(skillParam.value))
const allSkillTests = computed(() => getTestsBySkill(skillParam.value))

// Bộ lọc dạng bài & độ khó & trạng thái
const selectedCategory = ref('Tất cả')
const selectedDifficulty = ref('Tất cả')
const selectedStatus = ref('Tất cả')

// Lấy danh sách các categories khả dụng cho kỹ năng này
const availableCategories = computed(() => {
  const set = new Set<string>()
  allSkillTests.value.forEach(t => {
    t.categoryTags.forEach(tag => set.add(tag))
  })
  return ['Tất cả', ...Array.from(set)]
})

const filteredTests = computed(() => {
  return allSkillTests.value.filter(t => {
    const matchCat = selectedCategory.value === 'Tất cả' || t.categoryTags.includes(selectedCategory.value)
    const matchDiff = selectedDifficulty.value === 'Tất cả' || t.difficulty === selectedDifficulty.value
    const matchStatus = selectedStatus.value === 'Tất cả' || t.status === selectedStatus.value
    return matchCat && matchDiff && matchStatus
  })
})

const getSkillIcon = (skill: string) => {
  switch (skill) {
    case 'listening': return Headphones
    case 'reading': return BookOpen
    case 'writing': return PenTool
    case 'speaking': return Mic
    default: return BookOpen
  }
}

useHead({
  title: computed(() => `Luyện đề IELTS ${skillOverview.value?.englishName || ''} - ${BRAND_NAME}`),
})

const skillGuideSteps: GuideStep[] = [
  {
    targetId: 'skill-filter-bar',
    badge: 'BƯỚC 1',
    title: 'Bộ lọc dạng bài thông minh',
    description: 'Lọc đề theo đúng dạng bài bạn cần cải thiện (True/False/Not Given, Matching Headings, Section hoặc Task).',
  },
  {
    targetId: 'skill-test-list',
    badge: 'BƯỚC 2',
    title: 'Danh sách đề thi & Độ khó',
    description: 'Mỗi đề hiển thị rõ thời lượng, độ khó và điểm số cao nhất đã đạt được.',
  },
  {
    targetId: 'skill-mode-tip',
    badge: 'BƯỚC 3',
    title: 'Chế độ Luyện tập vs Thi thử',
    description: 'Chọn "Luyện tập" để xem giải thích ngay hoặc "Thi thử" để áp lực thời gian như phòng thi thật.',
  },
]
</script>

<template>
  <div v-if="skillOverview" class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
    <!-- Page Banner kỹ năng -->
    <PageBanner
      :title="`Luyện đề IELTS ${skillOverview.englishName} (${skillOverview.name})`"
      :description="skillOverview.description"
      :badge-text="`BAND ƯỚC TÍNH: ${skillOverview.currentBand.toFixed(1)} / MỤC TIÊU: ${skillOverview.targetBand.toFixed(1)}`"
      :badge-tone="skillOverview.tone"
    >
      <template #icon>
        <component :is="getSkillIcon(skillOverview.skill)" class="h-6 w-6" :stroke-width="2.5" />
      </template>
      <template #actions>
        <NuxtLink
          to="/luyen-thi/ielts"
          class="text-xs font-bold text-ink underline underline-offset-4 hover:text-accent"
        >
          ← Quay lại tổng quan IELTS
        </NuxtLink>
      </template>
    </PageBanner>

    <!-- Bộ lọc dạng bài, độ khó, trạng thái -->
    <div
      id="skill-filter-bar"
      class="rounded-brut-lg border-[3px] border-line bg-surface p-4 sm:p-5 shadow-brut space-y-4"
    >
      <div class="flex items-center gap-2 border-b-2 border-line pb-3">
        <Filter class="h-4 w-4 text-ink" :stroke-width="2.5" />
        <h3 class="font-display text-sm font-black text-ink">
          Bộ lọc & Phân loại đề thi
        </h3>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
        <!-- Lọc theo dạng bài -->
        <div class="space-y-1.5">
          <label class="text-ink-soft">Dạng câu hỏi / Section:</label>
          <select
            v-model="selectedCategory"
            class="w-full rounded-brut border-2 border-line bg-surface-2 p-2 text-ink outline-none focus:bg-surface font-display"
          >
            <option v-for="cat in availableCategories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>

        <!-- Lọc theo độ khó -->
        <div class="space-y-1.5">
          <label class="text-ink-soft">Độ khó:</label>
          <select
            v-model="selectedDifficulty"
            class="w-full rounded-brut border-2 border-line bg-surface-2 p-2 text-ink outline-none focus:bg-surface font-display"
          >
            <option value="Tất cả">Tất cả độ khó</option>
            <option value="Dễ">Dễ</option>
            <option value="Trung bình">Trung bình</option>
            <option value="Khó">Khó</option>
          </select>
        </div>

        <!-- Lọc theo trạng thái làm bài -->
        <div class="space-y-1.5">
          <label class="text-ink-soft">Trạng thái:</label>
          <select
            v-model="selectedStatus"
            class="w-full rounded-brut border-2 border-line bg-surface-2 p-2 text-ink outline-none focus:bg-surface font-display"
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            <option value="chua_lam">Chưa làm</option>
            <option value="dang_lam">Đang làm dở</option>
            <option value="da_xong">Đã hoàn thành</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Danh sách đề thi -->
    <div id="skill-test-list" class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-xl font-black text-ink">
          Danh sách đề luyện tập ({{ filteredTests.length }} đề)
        </h3>
        <span id="skill-mode-tip" class="text-xs font-bold text-ink-soft hidden sm:inline">
          Hỗ trợ 2 chế độ: Luyện tập (không áp lực giờ) & Thi thử (bấm giờ)
        </span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          v-for="test in filteredTests"
          :key="test.id"
          class="flex flex-col justify-between rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut hover:shadow-brut-lg transition-all"
        >
          <div class="space-y-3">
            <!-- Header đề thi: Độ khó + Số câu + Trạng thái -->
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-1.5">
                <span
                  class="rounded border-2 border-line px-2 py-0.5 text-[11px] font-black"
                  :class="[
                    test.difficulty === 'Dễ' ? 'bg-ok text-on-tone' :
                    test.difficulty === 'Trung bình' ? 'bg-warn text-on-tone' : 'bg-bad text-on-tone',
                  ]"
                >
                  {{ test.difficulty }}
                </span>
                <span class="rounded border border-line bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-ink">
                  {{ test.totalQuestions }} câu hỏi
                </span>
              </div>

              <!-- Trạng thái -->
              <span
                class="rounded border border-line px-2 py-0.5 text-xs font-bold"
                :class="test.status === 'da_xong' ? 'bg-ok/20 text-ok' : 'text-ink-soft'"
              >
                {{ test.status === 'da_xong' ? `Đã làm (Band ${test.bestScore?.band.toFixed(1)})` : 'Chưa làm' }}
              </span>
            </div>

            <!-- Tên đề & Subtitle -->
            <div>
              <h4 class="font-display text-lg font-black text-ink leading-snug">
                {{ test.title }}
              </h4>
              <p class="text-xs text-ink-soft mt-0.5">
                {{ test.subtitle }}
              </p>
            </div>

            <!-- Tags dạng bài -->
            <div class="flex flex-wrap gap-1.5 pt-1">
              <span
                v-for="tag in test.categoryTags"
                :key="tag"
                class="rounded border border-line bg-surface-2 px-2 py-0.5 text-[11px] font-bold text-ink-soft"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- Footer hành động: Thời lượng + Nút bắt đầu làm bài -->
          <div class="flex items-center justify-between border-t-2 border-line/20 pt-4 mt-4">
            <span class="flex items-center gap-1 text-xs font-bold text-ink-soft">
              <Clock class="h-3.5 w-3.5" :stroke-width="2.5" />
              <span>{{ test.timeMinutes }} phút</span>
            </span>

            <div class="flex items-center gap-2">
              <NuxtLink
                :to="`/luyen-thi/ielts/lam-bai/${test.id}?mode=practice`"
                class="rounded-brut border-2 border-line bg-surface px-3 py-1.5 font-display text-xs font-bold text-ink hover:bg-surface-2 shadow-brut-sm brut-press transition-all"
              >
                Luyện tập
              </NuxtLink>

              <NuxtLink
                :to="`/luyen-thi/ielts/lam-bai/${test.id}?mode=exam`"
                class="flex items-center gap-1 rounded-brut border-2 border-line bg-warn px-3.5 py-1.5 font-display text-xs font-black text-on-tone shadow-brut-sm brut-press hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                <Play class="h-3 w-3 fill-current" />
                <span>Thi thử</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- First Visit Guide -->
    <FirstVisitGuide
      :page-key="`ielts-skill-${skillParam}`"
      :steps="skillGuideSteps"
    />
  </div>
</template>
