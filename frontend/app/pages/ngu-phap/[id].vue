<script setup lang="ts">
import {
  Layers,
  Volume2,
  AlertTriangle,
  Check,
  X,
  BookOpen,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from '@lucide/vue'
import { useLanguage } from '~/composables/useLanguage'
import { useGrammar, type GrammarPoint } from '~/composables/useGrammar'
import PageBanner from '~/components/common/PageBanner.vue'
import FirstVisitGuide, { type GuideStep } from '~/components/common/FirstVisitGuide.vue'
import { levelBadge, xpBadge } from '~/constants/badges'

const route = useRoute()
const pointId = computed(() => (route.params.id as string) || 'en-a1-tobe')

const { currentLang } = useLanguage()
const { getGrammarPointById, completedPointIds } = useGrammar(currentLang)

const currentPoint = computed<GrammarPoint>(() => {
  return getGrammarPointById(pointId.value) || getGrammarPointById('en-a1-tobe')!
})

useHead({
  title: computed(() => `Ngữ pháp: ${currentPoint.value?.title || 'Bài học'} - Langua`),
})

const guideSteps: GuideStep[] = [
  {
    title: 'Sơ đồ khối công thức & Giải thích',
    description: 'Nắm vững bản chất quy tắc qua sơ đồ khối và lưu ý ngữ pháp trước khi thực hành.',
    targetId: 'lesson-formula-card',
    badge: 'Bước 1',
  },
  {
    title: 'Ví dụ bản xứ & Nghe phát âm',
    description: 'Bấm nút loa để nghe phát âm câu ví dụ chuẩn ngữ điệu và tham khảo bản dịch tiếng Việt.',
    targetId: 'lesson-examples-card',
    badge: 'Bước 2',
  },
  {
    title: 'Bẫy ngữ pháp thường gặp',
    description: 'Đối chiếu các lỗi sai kinh điển người học hay mắc với cách viết chuẩn mực.',
    targetId: 'lesson-pitfalls-card',
    badge: 'Bước 3',
  },
  {
    title: 'Bài tập 3 dạng: Chọn, Điền & Xếp câu',
    description: 'Mở phiên bài tập: mỗi màn một bài, kiểm tra và xem giải thích ngay. Làm đúng tất cả để nhận XP.',
    targetId: 'lesson-exercises-card',
    badge: 'Bước 4',
  },
]

// Web Speech API
const speakText = (text: string) => {
  if (!import.meta.client || !window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(text)
  if (currentLang.value === 'en') utterance.lang = 'en-US'
  else if (currentLang.value === 'zh') utterance.lang = 'zh-CN'
  else if (currentLang.value === 'ja') utterance.lang = 'ja-JP'
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6" data-feature="ngu-phap">
    <FirstVisitGuide page-key="ngu_phap_lesson_guide" :steps="guideSteps" />

    <!-- Top Navigation Bar -->
    <div class="flex items-center justify-between">
      <NuxtLink
        to="/ngu-phap"
        class="inline-flex items-center gap-1.5 min-h-[44px] text-xs font-black uppercase text-ink-soft hover:text-ink transition-colors"
      >
        <ArrowLeft class="w-4 h-4 stroke-[2.5]" />
        <span>Về danh mục Ngữ pháp</span>
      </NuxtLink>

      <div class="flex items-center gap-2">
        <BaseBadge v-bind="levelBadge(currentPoint.level)" size="sm">{{ currentPoint.level }}</BaseBadge>
        <span
          v-if="completedPointIds.includes(currentPoint.id)"
          class="inline-flex items-center gap-1 text-xs font-black text-ok bg-ok/15 px-2.5 py-1 rounded-brut border border-ok"
        >
          <CheckCircle2 class="w-3.5 h-3.5 stroke-[3]" />
          Đã hoàn thành
        </span>
      </div>
    </div>

    <!-- Page Banner -->
    <PageBanner
      feature="ngu-phap"
      :title="currentPoint.title"
      :description="currentPoint.vietnameseTitle"
      badge-text="Chuyên đề ngữ pháp"
      badge-tone="warn"
    >
      <template #icon>
        <Layers class="h-6 w-6 text-on-tone" :stroke-width="2.5" />
      </template>

      <template #actions>
        <div class="flex items-center gap-2">
          <BaseBadge tone="green" size="sm">
            {{ currentPoint.exercises.length }} bài tập
          </BaseBadge>
          <BaseBadge v-bind="xpBadge(currentPoint.xpReward)" size="sm" />
        </div>
      </template>
    </PageBanner>

    <!-- MAIN LESSON WORKSPACE (2 COLS) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Cột trái: Lý thuyết, Ví dụ, Bẫy lỗi (2 cols) -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Card 1: Công thức & Giải thích -->
        <BaseCard id="lesson-formula-card" tone="surface">
          <template #header>
            <div class="flex items-center gap-2 font-black text-sm">
              <BookOpen class="w-4 h-4 text-accent" />
              <span>Sơ đồ khối công thức & Bản chất ngữ pháp</span>
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-sm font-medium text-ink leading-relaxed">
              {{ currentPoint.summary }}
            </p>

            <!-- Khối công thức trực quan -->
            <div class="p-4 bg-surface-2 rounded-brut border-2 border-line shadow-brut-sm space-y-3">
              <p class="text-xs font-mono font-bold text-ink-soft uppercase tracking-wide">
                Cấu trúc: {{ currentPoint.formula.pattern }}
              </p>

              <div class="flex flex-wrap items-center gap-2">
                <div
                  v-for="(token, tIdx) in currentPoint.formula.tokens"
                  :key="tIdx"
                  class="px-3 py-2 rounded-brut border-2 border-line text-xs font-black shadow-brut-sm"
                  :class="{
                    'bg-warn text-on-tone': token.role === 'subject',
                    'bg-accent text-white': token.role === 'verb',
                    'bg-ok text-on-tone': token.role === 'object',
                    'bg-mark text-on-tone': token.role === 'particle',
                    'bg-surface text-ink': token.role === 'modifier',
                  }"
                >
                  {{ token.label }}
                </div>
              </div>
            </div>

            <!-- Giải thích ngắn bằng tiếng Việt -->
            <div class="space-y-2 pt-2">
              <span class="text-xs font-black uppercase text-ink-soft block">Lưu ý sử dụng cốt lõi:</span>
              <ul class="space-y-1.5 text-xs sm:text-sm text-ink font-medium">
                <li
                  v-for="(note, nIdx) in currentPoint.explanationNotes"
                  :key="nIdx"
                  class="flex items-start gap-2 p-2 bg-surface-2/60 rounded-brut border border-line"
                >
                  <span class="p-0.5 bg-warn text-on-tone rounded-xs font-mono font-bold text-[10px]">{{ nIdx + 1 }}</span>
                  <span>{{ note }}</span>
                </li>
              </ul>
            </div>
          </div>
        </BaseCard>

        <!-- Card 2: Ví dụ thực tế có Nghe & Dịch -->
        <BaseCard v-if="currentPoint.examples?.length" id="lesson-examples-card" tone="surface">
          <template #header>
            <div class="flex items-center gap-2 font-black text-sm">
              <Volume2 class="w-4 h-4 text-accent" />
              <span>Ví dụ ngữ cảnh thực tế (Bấm nghe giọng mẫu)</span>
            </div>
          </template>

          <div class="space-y-3">
            <div
              v-for="(ex, exIdx) in currentPoint.examples"
              :key="exIdx"
              class="p-4 rounded-brut border-2 border-line bg-surface space-y-2 shadow-brut-sm hover:bg-surface-2/50 transition-colors"
            >
              <div class="flex items-start justify-between gap-3">
                <p class="text-base sm:text-lg font-black text-ink font-display">
                  "{{ ex.sentence || ex.target }}"
                </p>
                <button
                  type="button"
                  class="p-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-brut border-2 border-line bg-surface hover:bg-surface-2 text-ink shadow-brut-sm cursor-pointer flex-shrink-0"
                  title="Nghe phát âm"
                  aria-label="Nghe phát âm ví dụ câu"
                  @click="speakText(ex.sentence || ex.target)"
                >
                  <Volume2 class="w-4 h-4 text-accent stroke-[2.5]" />
                </button>
              </div>

              <p v-if="ex.reading || ex.phonetic" class="text-xs font-mono text-ink-soft italic">
                {{ ex.reading || ex.phonetic }}
              </p>

              <p class="text-xs sm:text-sm text-ink-soft font-medium">
                Dịch: {{ ex.translation || ex.vi }}
              </p>
            </div>
          </div>
        </BaseCard>

        <!-- Card 3: Bẫy lỗi thường gặp (Common Pitfalls) -->
        <BaseCard id="lesson-pitfalls-card" tone="surface-2">
          <template #header>
            <div class="flex items-center gap-2 font-black text-sm">
              <AlertTriangle class="w-4 h-4 text-bad" />
              <span>Bẫy lỗi thường gặp cần tránh</span>
            </div>
          </template>

          <div class="space-y-4">
            <div
              v-for="(pit, pIdx) in currentPoint.pitfalls"
              :key="pIdx"
              class="p-4 rounded-brut border-2 border-line bg-surface space-y-2.5 shadow-brut-sm"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-1.5 text-xs font-black text-bad">
                  <X class="w-4 h-4 stroke-[3]" />
                  <span>Cách dùng SAI:</span>
                </div>
                <p class="p-2.5 rounded-brut border border-bad bg-bad/10 text-bad font-mono text-xs sm:text-sm line-through">
                  {{ pit.wrong }}
                </p>
              </div>

              <div class="space-y-1">
                <div class="flex items-center gap-1.5 text-xs font-black text-ok">
                  <Check class="w-4 h-4 stroke-[3]" />
                  <span>Cách dùng ĐÚNG:</span>
                </div>
                <p class="p-2.5 rounded-brut border border-ok bg-ok/10 text-ink font-mono text-xs sm:text-sm font-bold">
                  {{ pit.correct }}
                </p>
              </div>

              <p class="text-xs text-ink-soft pt-1 font-medium">
                <strong class="text-ink">Giải thích: </strong> {{ pit.explanation }}
              </p>
            </div>
          </div>
        </BaseCard>
      </div>

      <!-- Cột phải: mở phiên bài tập (layout lesson, một bài mỗi màn) -->
      <div id="lesson-exercises-card" class="lg:sticky lg:top-24 lg:self-start">
        <BaseCard tone="surface">
          <template #header>
            <div class="flex items-center gap-2 font-black text-sm">
              <HelpCircle class="w-4 h-4 text-accent" />
              <span>Bài tập thực hành</span>
            </div>
          </template>
          <div class="space-y-3">
            <p class="text-sm text-ink">
              {{ currentPoint.exercises.length }} bài: chọn đáp án, điền từ và xếp câu. Mỗi bài có giải thích ngay sau khi kiểm tra.
            </p>
            <p class="text-xs text-ink-soft">Làm đúng tất cả để hoàn thành bài học và nhận +{{ currentPoint.xpReward }} XP.</p>
            <BaseButton
              v-if="currentPoint.exercises.length"
              :to="`/ngu-phap/bai-tap/${currentPoint.id}`"
              variant="primary"
              size="md"
              block
            >
              <span>{{ completedPointIds.includes(currentPoint.id) ? 'Làm lại bài tập' : 'Làm bài tập' }}</span>
              <template #right><ArrowRight class="h-4 w-4" :stroke-width="2.5" /></template>
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
