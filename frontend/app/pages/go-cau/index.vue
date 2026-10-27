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
  Compass,
  ArrowRight,
  Zap,
} from '@lucide/vue'
import { useLanguage } from '~/composables/useLanguage'
import { useTypingPractice } from '~/composables/useTypingPractice'
import LanguageSelector from '~/components/common/LanguageSelector.vue'
import PageBanner from '~/components/common/PageBanner.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { BRAND_NAME } from '~/constants/brand'

useHead({
  title: `Gõ câu phản xạ - Bản đồ lộ trình & Chủ đề - ${BRAND_NAME}`,
})

const { currentLang, currentLanguageOption } = useLanguage()
const { roadmapNodes, lifeTopics, workTopics, isLoading, errorMessage, fetchTypingData } = useTypingPractice(currentLang)

const guideSteps: GuideStep[] = [
  {
    title: 'Bộ chọn ngôn ngữ mục tiêu',
    description: 'Chuyển đổi giữa lộ trình Tiếng Anh (A1 - C1), Tiếng Trung (HSK 1 - 6) và Tiếng Nhật (JLPT N5 - N1).',
    targetId: 'typing-lang-selector',
    badge: 'Bước 1',
  },
  {
    title: 'Bản đồ chặng lộ trình phản xạ',
    description: 'Các chặng được mở khoá tuần tự. Chặng đang mở sẽ hiển thị nhãn Bạn ở đây nổi bật.',
    targetId: 'roadmap-node-map',
    badge: 'Bước 2',
  },
  {
    title: 'Tình huống đời sống hàng ngày',
    description: 'Thực hành các mẫu câu phản xạ giao tiếp với câu preview mẫu tô màu trực tiếp.',
    targetId: 'life-topics-group',
    badge: 'Bước 3',
  },
  {
    title: 'Môi trường làm việc chuyên nghiệp',
    description: 'Rèn luyện tốc độ gõ email chuẩn ngữ pháp, báo cáo tiến độ và họp công sở.',
    targetId: 'work-topics-group',
    badge: 'Bước 4',
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
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8" data-feature="go-cau">
    <FirstVisitGuide page-key="go_cau_index_guide" :steps="guideSteps" />

    <!-- Top Bar with Language Selector -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div id="typing-lang-selector">
        <LanguageSelector />
      </div>

      <div class="flex items-center gap-2 text-xs font-bold text-ink-soft">
        <span class="px-2.5 py-1 bg-surface-2 border border-line rounded-brut">Bản đồ lộ trình tương tác</span>
        <span class="px-2.5 py-1 bg-surface-2 border border-line rounded-brut">Hỗ trợ gõ IME</span>
      </div>
    </div>

    <!-- Page Banner -->
    <PageBanner
      feature="go-cau"
      title="Gõ câu phản xạ theo lộ trình"
      description="Rèn luyện kỹ năng dịch thoát ý, độ nhạy ngữ pháp và tốc độ gõ phím trực tiếp bằng ngôn ngữ bản xứ mà không cần dịch nhẩm."
      badge-text="Phản xạ tốc độ"
      badge-tone="warn"
    >
      <template #icon>
        <Keyboard class="h-6 w-6 text-on-tone" :stroke-width="2.5" />
      </template>

      <template #actions>
        <div class="flex items-center gap-2">
          <BaseBadge tone="accent" size="sm">
            {{ currentLanguageOption.name }} • {{ roadmapNodes.length }} chặng
          </BaseBadge>
          <BaseBadge tone="ok" size="sm">
            {{ lifeTopics.length + workTopics.length }} chủ đề mở
          </BaseBadge>
        </div>
      </template>
    </PageBanner>

    <!-- Error State with Retry -->
    <div v-if="errorMessage" class="p-4 bg-warn-soft border-2 border-line rounded-brut shadow-brut flex items-center justify-between">
      <span class="text-xs font-bold text-ink">{{ errorMessage }}</span>
      <BaseButton tone="warn" size="sm" @click="fetchTypingData">Thử lại</BaseButton>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="p-6 bg-surface border-2 border-line rounded-brut shadow-brut animate-pulse space-y-4">
      <div class="h-5 bg-surface-2 rounded-brut w-1/4"></div>
      <div class="h-24 bg-surface-2 rounded-brut w-full"></div>
    </div>

    <!-- SECTION 1: LỘ TRÌNH ĐỀ XUẤT DẠNG BẢN ĐỒ NỐI NÚT (RESPONSIVE: DỌC TRÊN MOBILE, NGANG TRÊN DESKTOP) -->
    <BaseCard id="roadmap-node-map" tone="surface">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Compass class="w-5 h-5 text-c-green-ink" :stroke-width="2.5" />
            <span class="font-black text-base">Lộ trình đề xuất theo cấp độ</span>
          </div>
          <BaseBadge tone="warn" size="sm">
            Mục tiêu: {{ currentLanguageOption.levelLabels[2] || 'B1' }}
          </BaseBadge>
        </div>
      </template>

      <div class="py-4">
        <p class="text-xs text-ink-soft font-bold mb-6">
          Vượt qua các mốc bài tập gõ câu để mở khoá chặng tiếp theo và nâng cao phản xạ tự nhiên:
        </p>

        <!-- Bản đồ chặng: Trên Mobile là đường dọc, Trên SM+ là đường ngang -->
        <div class="hidden sm:block relative overflow-x-auto pb-6 pt-2">
          <div class="min-w-[620px] flex items-center justify-between relative px-6">
            <div class="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-2 bg-line z-0" />

            <!-- Roadmap Nodes -->
            <div
              v-for="node in roadmapNodes"
              :key="node.id"
              class="relative z-10 flex flex-col items-center group cursor-pointer"
            >
              <!-- Nút chặng đang mở nổi bật to hơn, viền dày, nhãn "Bạn ở đây" -->
              <div v-if="node.status === 'active'" class="absolute -top-7 rounded-brut border-2 border-line bg-warn px-2 py-0.5 text-[10px] font-black uppercase text-on-tone shadow-[1px_1px_0_var(--line)] animate-bounce whitespace-nowrap">
                Bạn ở đây
              </div>

              <!-- Node Circle Button -->
              <div
                class="rounded-full flex items-center justify-center font-black text-sm shadow-brut transition-all duration-200 group-hover:-translate-y-1"
                :class="[
                  node.status === 'active'
                    ? 'w-16 h-16 border-[4px] border-line bg-c-green text-on-tone ring-4 ring-c-green/40'
                    : node.status === 'completed'
                      ? 'w-12 h-12 border-[3px] border-line bg-c-green text-on-tone'
                      : 'w-12 h-12 border-[3px] border-line bg-surface-2 text-ink-soft/60 cursor-not-allowed',
                ]"
              >
                <CheckCircle v-if="node.status === 'completed'" class="w-6 h-6 stroke-[3]" />
                <span v-else-if="node.status === 'active'" class="text-base font-black font-display">{{ node.level }}</span>
                <Lock v-else class="w-4 h-4 opacity-50" />
              </div>

              <!-- Node Info Card below -->
              <div class="mt-3 text-center max-w-[120px]">
                <div
                  class="inline-block px-1.5 py-0.5 rounded-brut border border-line text-[10px] font-black uppercase mb-1"
                  :class="node.status === 'completed' ? 'bg-c-green-soft text-c-green-ink' : node.status === 'active' ? 'bg-warn text-on-tone' : 'bg-surface-2 text-ink-soft'"
                >
                  {{ node.level }}
                </div>
                <p class="text-xs font-bold text-ink leading-tight line-clamp-2">
                  {{ node.title }}
                </p>
                <p class="text-[10px] text-ink-soft font-mono mt-0.5">
                  {{ node.status === 'completed' ? 'Đã xong' : node.status === 'active' ? 'Đang thực hiện' : 'Khoá' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Layout: Đường dọc nối các nút -->
        <div class="sm:hidden relative pl-6 space-y-6">
          <div class="absolute left-10 top-4 bottom-4 w-1 bg-line z-0" />
          <div
            v-for="node in roadmapNodes"
            :key="node.id"
            class="relative z-10 flex items-start gap-4"
          >
            <!-- Circle Button -->
            <div
              class="rounded-full flex items-center justify-center flex-shrink-0 shadow-brut"
              :class="[
                node.status === 'active'
                  ? 'w-12 h-12 border-[3px] border-line bg-c-green text-on-tone ring-4 ring-c-green/40'
                  : node.status === 'completed'
                    ? 'w-9 h-9 border-2 border-line bg-c-green text-on-tone'
                    : 'w-9 h-9 border-2 border-line bg-surface-2 text-ink-soft/60',
              ]"
            >
              <CheckCircle v-if="node.status === 'completed'" class="w-4 h-4 stroke-[3]" />
              <span v-else-if="node.status === 'active'" class="text-xs font-black font-display">{{ node.level }}</span>
              <Lock v-else class="w-3.5 h-3.5 opacity-50" />
            </div>

            <!-- Content -->
            <div class="flex-1 rounded-brut border-2 border-line bg-surface p-3 shadow-brut-sm">
              <div class="flex items-center justify-between mb-1">
                <span
                  class="rounded border border-line px-1.5 py-0.2 text-[10px] font-black uppercase"
                  :class="node.status === 'active' ? 'bg-warn text-on-tone' : 'bg-surface-2 text-ink'"
                >
                  {{ node.level }}
                </span>
                <span v-if="node.status === 'active'" class="text-[10px] font-black text-c-green-ink uppercase">
                  Bạn ở đây
                </span>
              </div>
              <h4 class="font-display text-sm font-bold text-ink">
                {{ node.title }}
              </h4>
            </div>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- SECTION 2: DANH SÁCH CHỦ ĐỀ CÓ PREVIEW CÂU MẪU TÔ SẴN -->
    <div class="space-y-8">
      <!-- NHÓM 1: TÌNH HUỐNG ĐỜI SỐNG (MÀU NHẤN: GREEN/MARK) -->
      <section id="life-topics-group" class="space-y-4">
        <div class="flex items-center justify-between border-b-2 border-line pb-2">
          <div class="flex items-center gap-2">
            <span class="p-1.5 bg-c-green text-on-tone rounded-brut border-2 border-line shadow-brut-sm font-black text-xs">
              01
            </span>
            <h2 class="text-xl sm:text-2xl font-black text-ink font-display">
              Tình huống đời sống hàng ngày
            </h2>
          </div>
          <BaseBadge tone="surface" size="sm">
            {{ lifeTopics.length }} chủ đề
          </BaseBadge>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            v-for="topic in lifeTopics"
            :key="topic.id"
            class="p-5 rounded-brut-lg border-[3px] border-line bg-surface shadow-brut flex flex-col justify-between hover:-translate-y-1 hover:shadow-brut-lg transition-all border-l-[6px] border-l-c-green"
          >
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="p-2 rounded-brut border-2 border-line bg-c-green-soft text-c-green-ink shadow-brut-sm">
                    <component :is="getTopicIcon(topic.iconName)" class="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h3 class="text-lg font-black text-ink font-display">
                    {{ topic.title }}
                  </h3>
                </div>

                <div class="flex items-center gap-1.5">
                  <span class="h-2.5 w-2.5 rounded-full border border-line bg-ok" title="Độ khó cơ bản" />
                  <BaseBadge tone="warn" size="sm">{{ topic.level }}</BaseBadge>
                </div>
              </div>

              <p class="text-xs sm:text-sm text-ink-soft font-medium leading-relaxed">
                {{ topic.description }}
              </p>

              <!-- PREVIEW CÂU MẪU (1 DÒNG TÔ PHẦN ĐẦU NHƯ ĐANG GÕ) -->
              <div class="rounded-brut border-2 border-line bg-surface-2 p-3 space-y-1.5">
                <span class="text-[10px] font-black uppercase text-ink-soft tracking-wider block">
                  Xem trước câu mẫu:
                </span>
                <p class="font-mono text-xs sm:text-sm text-ink font-bold line-clamp-1 leading-snug">
                  <span class="bg-c-green/30 text-c-green-ink px-1 rounded border border-c-green/40 font-black">
                    {{ (topic.sentences[0]?.targetText || 'Could you please').split(' ').slice(0, 2).join(' ') }}
                  </span>
                  <span> {{ (topic.sentences[0]?.targetText || '').split(' ').slice(2).join(' ') }}</span>
                </p>
                <p class="text-[11px] font-medium text-ink-soft italic line-clamp-1">
                  Nghĩa: "{{ topic.sentences[0]?.viTranslation || 'Xin vui lòng hỗ trợ...' }}"
                </p>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t-2 border-line/40 flex items-center justify-between">
              <div class="flex items-center gap-3 text-xs font-mono font-bold text-ink-soft">
                <span>{{ topic.sentences.length }} câu</span>
                <span>•</span>
                <span class="text-ok font-black" v-if="topic.bestWpm">WPM tốt nhất: {{ topic.bestWpm }}</span>
              </div>

              <NuxtLink
                :to="`/go-cau/${topic.slug}`"
                class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-brut border-2 border-line bg-c-green hover:bg-c-green/90 text-on-tone font-black text-xs shadow-brut-sm transition-transform active:translate-y-0.5"
              >
                <span>Bắt đầu gõ</span>
                <ArrowRight class="w-3.5 h-3.5 stroke-[3]" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- NHÓM 2: MÔI TRƯỜNG LÀM VIỆC (MÀU NHẤN: BLUE/CORAL) -->
      <section id="work-topics-group" class="space-y-4">
        <div class="flex items-center justify-between border-b-2 border-line pb-2">
          <div class="flex items-center gap-2">
            <span class="p-1.5 bg-c-blue text-white rounded-brut border-2 border-line shadow-brut-sm font-black text-xs">
              02
            </span>
            <h2 class="text-xl sm:text-2xl font-black text-ink font-display">
              Môi trường làm việc & Công sở
            </h2>
          </div>
          <BaseBadge tone="surface" size="sm">
            {{ workTopics.length }} chủ đề
          </BaseBadge>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div
            v-for="topic in workTopics"
            :key="topic.id"
            class="p-5 rounded-brut-lg border-[3px] border-line bg-surface shadow-brut flex flex-col justify-between hover:-translate-y-1 hover:shadow-brut-lg transition-all border-l-[6px] border-l-c-blue"
          >
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="p-2 rounded-brut border-2 border-line bg-c-blue-soft text-c-blue-ink shadow-brut-sm">
                    <component :is="getTopicIcon(topic.iconName)" class="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <h3 class="text-lg font-black text-ink font-display">
                    {{ topic.title }}
                  </h3>
                </div>

                <div class="flex items-center gap-1.5">
                  <span class="h-2.5 w-2.5 rounded-full border border-line bg-warn" title="Độ khó trung cấp" />
                  <BaseBadge tone="accent" size="sm">{{ topic.level }}</BaseBadge>
                </div>
              </div>

              <p class="text-xs sm:text-sm text-ink-soft font-medium leading-relaxed">
                {{ topic.description }}
              </p>

              <!-- PREVIEW CÂU MẪU CÔNG SỞ -->
              <div class="rounded-brut border-2 border-line bg-surface-2 p-3 space-y-1.5">
                <span class="text-[10px] font-black uppercase text-ink-soft tracking-wider block">
                  Xem trước câu mẫu:
                </span>
                <p class="font-mono text-xs sm:text-sm text-ink font-bold line-clamp-1 leading-snug">
                  <span class="bg-c-blue/25 text-c-blue-ink px-1 rounded border border-c-blue/40 font-black">
                    {{ (topic.sentences[0]?.targetText || 'I am writing to').split(' ').slice(0, 3).join(' ') }}
                  </span>
                  <span> {{ (topic.sentences[0]?.targetText || '').split(' ').slice(3).join(' ') }}</span>
                </p>
                <p class="text-[11px] font-medium text-ink-soft italic line-clamp-1">
                  Nghĩa: "{{ topic.sentences[0]?.viTranslation || 'Tôi viết email này để thảo luận...' }}"
                </p>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t-2 border-line/40 flex items-center justify-between">
              <div class="flex items-center gap-3 text-xs font-mono font-bold text-ink-soft">
                <span>{{ topic.sentences.length }} câu</span>
                <span>•</span>
                <span class="text-c-blue-ink font-black" v-if="topic.bestWpm">WPM tốt nhất: {{ topic.bestWpm }}</span>
              </div>

              <NuxtLink
                :to="`/go-cau/${topic.slug}`"
                class="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-brut border-2 border-line bg-warn hover:bg-warn/90 text-on-tone font-black text-xs shadow-brut-sm transition-transform active:translate-y-0.5"
              >
                <span>Bắt đầu gõ</span>
                <ArrowRight class="w-3.5 h-3.5 stroke-[3]" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
