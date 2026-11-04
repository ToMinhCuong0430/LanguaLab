<script setup lang="ts">
import {
  Keyboard,
  CheckCircle,
  Lock,
  ShoppingBag,
  Utensils,
  Mail,
  Users,
  Briefcase,
  ChevronRight,
} from '@lucide/vue'
import { useLanguage } from '~/composables/useLanguage'
import { useTypingPractice, type TypingTopic } from '~/composables/useTypingPractice'
import { buildPathUnits } from '~/utils/typingRoadmap'
import LanguageSelector from '~/components/common/LanguageSelector.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { BRAND_NAME } from '~/constants/brand'

useHead({
  title: `Gõ câu phản xạ - Bản đồ lộ trình & Chủ đề - ${BRAND_NAME}`,
})

const { currentLang } = useLanguage()
const { roadmapNodes, lifeTopics, workTopics, isLoading, errorMessage, fetchTypingData } = useTypingPractice(currentLang)

const guideSteps: GuideStep[] = [
  {
    title: 'Chọn ngôn ngữ',
    description: 'Đổi giữa lộ trình Tiếng Anh (A1 - C1), Tiếng Trung (HSK 1 - 6) và Tiếng Nhật (JLPT N5 - N1).',
    targetId: 'typing-lang-selector',
    badge: 'Bước 1',
  },
  {
    title: 'Bạn ở đây',
    description: 'Chặng đang mở được đánh dấu "Bạn ở đây". Bấm Học để vào bài gõ câu tiếp theo của chặng này.',
    targetId: 'typing-current-node',
    badge: 'Bước 2',
  },
]

const getTopicIcon = (iconName: string) => {
  switch (iconName) {
    case 'ShoppingBag': return ShoppingBag
    case 'Utensils': return Utensils
    case 'Mail': return Mail
    case 'Users': return Users
    case 'Briefcase': return Briefcase
    default: return Keyboard
  }
}

// Gộp chủ đề đời sống và công sở thành unit theo chặng thấp nhất mà khoảng cấp độ của chủ đề chạm tới.
// Chủ đề vẫn mở được ở mọi chặng như trước; chỉ node chặng khoá không có link.
const units = computed(() => buildPathUnits(roadmapNodes.value, [...lifeTopics.value, ...workTopics.value]))

// "Học" mở chủ đề gần nhất tính từ chặng đang mở trở đi (chặng đang mở chưa có chủ đề thì lấy unit kế tiếp)
const learnTopic = computed<TypingTopic | null>(() => {
  const start = Math.max(0, units.value.findIndex((u) => u.node?.status === 'active'))
  const next = units.value.slice(start).find((u) => u.topics.length) ?? units.value.find((u) => u.topics.length)
  return next?.topics[0] ?? null
})
const GROUP_LABEL: Record<TypingTopic['group'], string> = { life: 'Đời sống', work: 'Công sở' }
</script>

<template>
  <div class="mx-auto w-full max-w-[560px] px-4 py-6 space-y-6" data-feature="go-cau">
    <FirstVisitGuide page-key="go_cau_index_guide" :steps="guideSteps" />

    <div class="space-y-3">
      <h1 class="font-display text-2xl font-black text-ink">Gõ câu</h1>
      <!-- Bộ chọn ngôn ngữ: một hàng ngay trên đường đi, cuộn ngang trong khung nếu chật -->
      <div id="typing-lang-selector" class="max-w-full overflow-x-auto">
        <LanguageSelector />
      </div>
    </div>

    <div v-if="errorMessage" class="flex items-center justify-between gap-3 rounded-brut border-[1px] border-line bg-surface p-3" role="alert">
      <span class="text-xs font-bold text-ink">{{ errorMessage }}</span>
      <BaseButton variant="secondary" size="sm" @click="fetchTypingData">Thử lại</BaseButton>
    </div>

    <div v-if="isLoading" class="space-y-3">
      <BaseSkeleton height="4rem" rounded="lg" :count="4" />
    </div>

    <!-- Lộ trình: một đường dọc, mỗi chặng là một node tròn kèm unit chủ đề của chặng đó -->
    <ol v-else class="relative" aria-label="Lộ trình gõ câu">
      <span class="absolute bottom-6 left-[27px] top-6 w-1 rounded-full bg-surface-2" aria-hidden="true" />

      <li v-for="(unit, uIdx) in units" :key="unit.node?.id || `others-${uIdx}`" class="relative pb-8 last:pb-0">
        <!-- Node chặng -->
        <div class="flex items-start gap-4">
          <div class="flex w-14 shrink-0 justify-center">
            <div
              v-if="unit.node?.status === 'active'"
              id="typing-current-node"
              class="brut-control relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-success font-display text-sm font-black text-success-ink"
            >
              {{ unit.node.level }}
            </div>
            <div
              v-else-if="unit.node?.status === 'completed'"
              class="relative z-10 mt-1 flex h-12 w-12 items-center justify-center rounded-full bg-success text-success-ink"
              :aria-label="`Chặng ${unit.node.level} đã xong`"
            >
              <CheckCircle class="h-6 w-6" :stroke-width="2.5" aria-hidden="true" />
            </div>
            <div
              v-else-if="unit.node"
              class="relative z-10 mt-1 flex h-12 w-12 items-center justify-center rounded-full border-[1px] border-line bg-surface-2 text-ink-soft"
              :aria-label="`Chặng ${unit.node.level} đang khoá`"
            >
              <Lock class="h-5 w-5" :stroke-width="2.5" aria-hidden="true" />
            </div>
            <div v-else class="relative z-10 mt-2 h-10 w-10 rounded-full border-[1px] border-line bg-surface" aria-hidden="true" />
          </div>

          <!-- Tiêu đề unit -->
          <div class="min-w-0 flex-1 pt-1">
            <p v-if="unit.node?.status === 'active'" class="mb-1 inline-block rounded-brut border-[1px] border-line bg-warn px-2 py-0.5 text-[11px] font-black text-on-tone">
              Bạn ở đây
            </p>
            <h2 class="font-display text-base font-black leading-snug text-ink">
              <template v-if="unit.node">Chặng {{ unit.node.level }}: {{ unit.node.title }}</template>
              <template v-else>Chủ đề khác</template>
            </h2>
            <p class="text-xs font-bold text-ink-soft">
              <template v-if="unit.node?.status === 'completed'">Đã xong. </template>
              <template v-else-if="unit.node?.status === 'locked'">Mở khi bạn đạt {{ unit.node.xpRequired }} XP. </template>
              {{ unit.topics.length ? `${unit.topics.length} chủ đề` : 'Chưa có chủ đề' }}
            </p>

            <div v-if="unit.node?.status === 'active' && learnTopic" class="mt-3">
              <BaseButton :to="`/go-cau/${learnTopic.slug}`" variant="success" size="md" block>
                <span>Học</span>
                <template #right><ChevronRight class="h-4 w-4" :stroke-width="2.5" /></template>
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- Unit: các chủ đề đời sống + công sở của chặng -->
        <ul v-if="unit.topics.length" class="mt-3 space-y-2 pl-[72px]">
          <li v-for="topic in unit.topics" :key="topic.id">
            <NuxtLink
              :to="`/go-cau/${topic.slug}`"
              class="group flex min-h-[56px] items-center gap-3 rounded-brut border-[1px] border-line bg-surface px-3 py-2 hover:bg-surface-2"
            >
              <component :is="getTopicIcon(topic.iconName)" class="h-5 w-5 shrink-0 text-ink" :stroke-width="2.5" aria-hidden="true" />
              <div class="min-w-0 flex-1">
                <p class="truncate font-display text-sm font-bold text-ink group-hover:underline">{{ topic.title }}</p>
                <p class="text-[11px] font-bold text-ink-soft">
                  {{ GROUP_LABEL[topic.group] }}, {{ topic.sentences.length }} câu, {{ topic.level }}
                </p>
              </div>
              <ChevronRight class="h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </li>
    </ol>
  </div>
</template>
