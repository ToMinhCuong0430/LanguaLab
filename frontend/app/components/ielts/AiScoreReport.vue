<script setup lang="ts">
import {
  AlertTriangle,
  Check,
  ArrowUpRight,
  RotateCcw,
  LogIn,
  FileText,
  ChevronDown,
} from '@lucide/vue'
import AnnotatedSubmission from '~/components/ielts/AnnotatedSubmission.vue'
import type { AiFeedback, AiScoreError, AiScoreState, ProductiveSkill } from '~/composables/useAiScoring'
import { CRITERIA_META, CRITERIA_ORDER, criterionLabel } from '~/composables/useAiScoring'

const props = defineProps<{
  state: AiScoreState
  feedback: AiFeedback | null
  error: AiScoreError | null
  canRetry: boolean
  skill: ProductiveSkill
  taskNumber?: number | null
  submission: string
}>()

const emit = defineEmits<{ retry: [] }>()

const criteriaKeys = computed(() => CRITERIA_ORDER[props.skill])
const toneOf = (key: string) => CRITERIA_META[key]?.tone || 'blue'

// 18 ô = thang 0–9 theo bước 0.5
const BAND_STEPS = 18
const filledSteps = (band: number) => Math.round(band * 2)

// Đồng hồ chờ để người học biết hệ thống vẫn đang chạy
const elapsed = ref(0)
let tick: ReturnType<typeof setInterval> | null = null
watch(
  () => props.state,
  (s) => {
    if (tick) clearInterval(tick)
    tick = null
    if (s === 'loading') {
      elapsed.value = 0
      tick = setInterval(() => { elapsed.value += 1 }, 1000)
    }
  },
  { immediate: true },
)
onUnmounted(() => { if (tick) clearInterval(tick) })

// Lần lượt "đánh dấu" từng tiêu chí trong lúc chờ
const scanningIndex = computed(() => Math.floor(elapsed.value / 3) % criteriaKeys.value.length)

const submissionText = computed(() => props.feedback?.submission_text || props.submission)
const wordCount = computed(() => (submissionText.value.trim().match(/\S+/g) || []).length)
</script>

<template>
  <div class="space-y-6">
    <!-- ĐANG CHẤM -->
    <section
      v-if="state === 'loading'"
      class="rounded-brut-lg border-[3px] border-line bg-surface p-5 sm:p-6 shadow-brut"
      role="status"
      aria-live="polite"
    >
      <div class="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-line pb-4">
        <h3 class="font-display text-lg font-black text-ink">Đang chấm bài theo 4 tiêu chí IELTS</h3>
        <span class="font-display text-sm font-bold text-ink-soft tabular-nums">{{ elapsed }} giây</span>
      </div>
      <ul class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <li
          v-for="(key, i) in criteriaKeys"
          :key="key"
          class="flex items-center gap-3 rounded-brut border-2 p-3 transition-colors"
          :class="scanningIndex === i ? 'border-line shadow-brut-sm' : 'border-line/30'"
          :style="scanningIndex === i ? { background: `var(--c-${toneOf(key)}-soft)` } : {}"
        >
          <span
            class="h-3 w-3 flex-shrink-0 rounded-full border-2 border-line"
            :class="{ 'animate-pulse': scanningIndex === i }"
            :style="{ background: `var(--c-${toneOf(key)})` }"
            aria-hidden="true"
          />
          <span class="text-sm font-bold text-ink">{{ criterionLabel(key, taskNumber).label }}</span>
          <span v-if="scanningIndex === i" class="ml-auto text-xs font-bold text-ink-soft">đang xem</span>
        </li>
      </ul>
      <p class="mt-4 text-xs text-ink-soft">
        Thường mất 20 đến 60 giây. Bạn có thể ở lại trang này, kết quả sẽ tự hiện khi chấm xong.
      </p>
    </section>

    <!-- CHƯA THỂ CHẤM (mock mode / chưa đăng nhập) -->
    <section
      v-else-if="state === 'unavailable'"
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-brut-lg border-[3px] border-line bg-surface-2 p-5 shadow-brut"
    >
      <div class="space-y-1">
        <h3 class="font-display text-base font-black text-ink">Chưa thể chấm bài bằng AI</h3>
        <p class="text-sm text-ink-soft">{{ error?.message }}</p>
      </div>
      <BaseButton v-if="error?.code === 'AUTH_REQUIRED'" to="/dang-nhap" variant="primary" size="md">
        <LogIn class="h-4 w-4" :stroke-width="2.5" />
        <span>Đăng nhập</span>
      </BaseButton>
    </section>

    <!-- LỖI -->
    <section
      v-else-if="state === 'failed'"
      class="rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut space-y-4"
      role="alert"
    >
      <div class="flex items-start gap-3 rounded-brut border-2 border-bad bg-bad/10 p-4">
        <AlertTriangle class="h-5 w-5 flex-shrink-0 text-bad" :stroke-width="2.5" />
        <div class="space-y-1">
          <h3 class="font-display text-base font-black text-ink">Chấm bài chưa thành công</h3>
          <p class="text-sm text-ink">{{ error?.message }}</p>
          <p class="text-[11px] font-bold text-ink-soft">Mã lỗi: {{ error?.code }}</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <BaseButton v-if="canRetry" variant="primary" size="md" @click="emit('retry')">
          <RotateCcw class="h-4 w-4" :stroke-width="2.5" />
          <span>Chấm lại bằng AI</span>
        </BaseButton>
        <p v-else class="text-xs text-ink-soft">
          Lỗi này không thể chấm lại ngay. Hãy kiểm tra bài làm hoặc thử lại sau.
        </p>
      </div>
    </section>

    <!-- KẾT QUẢ -->
    <template v-else-if="state === 'completed' && feedback?.criteria">
      <div
        v-if="feedback.provider === 'mock'"
        class="flex items-start gap-2.5 rounded-brut border-2 border-line bg-warn p-3 text-xs font-bold text-on-tone"
      >
        <AlertTriangle class="h-4 w-4 flex-shrink-0" :stroke-width="2.5" />
        <span>Điểm giả lập để thử giao diện (AI_PROVIDER=mock). Đây không phải kết quả chấm thật.</span>
      </div>

      <!-- Nhận xét chung -->
      <section v-if="feedback.summary" class="rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut">
        <h3 class="font-display text-base font-black text-ink mb-2">Nhận xét chung</h3>
        <p class="text-sm leading-relaxed text-ink max-w-[75ch]">{{ feedback.summary }}</p>
      </section>

      <!-- 4 tiêu chí -->
      <section class="grid grid-cols-1 md:grid-cols-2 gap-5" aria-label="Điểm từng tiêu chí">
        <article
          v-for="key in criteriaKeys"
          :key="key"
          class="flex flex-col rounded-brut-lg border-[3px] border-line bg-surface shadow-brut overflow-hidden"
        >
          <header
            class="flex items-start justify-between gap-3 border-b-[3px] border-line px-4 py-3"
            :style="{ background: `var(--c-${toneOf(key)}-soft)` }"
          >
            <div class="min-w-0">
              <h4 class="font-display text-base font-black text-ink">{{ criterionLabel(key, taskNumber).label }}</h4>
              <p class="text-xs font-bold" :style="{ color: `var(--c-${toneOf(key)}-ink)` }">
                {{ criterionLabel(key, taskNumber).english }}
              </p>
            </div>
            <span
              class="flex-shrink-0 rounded-brut border-2 border-line px-2.5 py-1 font-display text-2xl font-black leading-none text-on-tone shadow-brut-sm tabular-nums"
              :style="{ background: `var(--c-${toneOf(key)})` }"
            >
              {{ feedback.criteria[key]?.band.toFixed(1) }}
            </span>
          </header>

          <div class="flex flex-1 flex-col gap-4 p-4">
            <!-- Thang 0–9 chia nấc 0.5 -->
            <div
              class="band-scale"
              role="meter"
              aria-valuemin="0"
              aria-valuemax="9"
              :aria-valuenow="feedback.criteria[key]?.band"
              :aria-label="`${criterionLabel(key, taskNumber).label}: band ${feedback.criteria[key]?.band}`"
            >
              <span
                v-for="step in BAND_STEPS"
                :key="step"
                class="band-scale__cell"
                :class="{ 'band-scale__cell--whole': step % 2 === 0 }"
                :style="step <= filledSteps(feedback.criteria[key]?.band ?? 0) ? { background: `var(--c-${toneOf(key)})` } : {}"
              />
            </div>

            <p class="text-sm leading-relaxed text-ink">{{ feedback.criteria[key]?.feedback }}</p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
              <div v-if="feedback.criteria[key]?.strengths.length">
                <p class="text-xs font-black text-ink mb-1.5">Điểm mạnh</p>
                <ul class="space-y-1.5">
                  <li v-for="(s, i) in feedback.criteria[key]?.strengths" :key="i" class="flex gap-1.5 text-xs leading-relaxed text-ink">
                    <Check class="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-ok" :stroke-width="3" aria-hidden="true" />
                    <span>{{ s }}</span>
                  </li>
                </ul>
              </div>
              <div v-if="feedback.criteria[key]?.improvements.length">
                <p class="text-xs font-black text-ink mb-1.5">Cần cải thiện</p>
                <ul class="space-y-1.5">
                  <li v-for="(s, i) in feedback.criteria[key]?.improvements" :key="i" class="flex gap-1.5 text-xs leading-relaxed text-ink">
                    <ArrowUpRight class="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-ink-soft" :stroke-width="3" aria-hidden="true" />
                    <span>{{ s }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </article>
      </section>

      <!-- Bài làm có đánh dấu lỗi -->
      <AnnotatedSubmission
        :text="submissionText"
        :suggestions="feedback.suggestions || []"
        :title="skill === 'writing' ? `Bài viết của bạn (${wordCount} từ)` : `Transcript của bạn (${wordCount} từ)`"
      />

      <!-- Bài mẫu -->
      <details
        v-if="feedback.model_answer"
        class="group rounded-brut-lg border-[3px] border-line bg-surface shadow-brut"
      >
        <summary class="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-3 px-5 py-3.5">
          <span class="flex items-center gap-2 font-display text-base font-black text-ink">
            <FileText class="h-4 w-4" :stroke-width="2.5" />
            Xem bài mẫu band 8+ dựa trên ý của bạn
          </span>
          <ChevronDown class="h-5 w-5 text-ink transition-transform group-open:rotate-180" :stroke-width="2.5" aria-hidden="true" />
        </summary>
        <div class="border-t-[3px] border-line px-5 py-4">
          <p class="whitespace-pre-wrap text-[15px] leading-8 text-ink max-w-[68ch]">{{ feedback.model_answer }}</p>
        </div>
      </details>
    </template>
  </div>
</template>

<style scoped>
.band-scale {
  display: grid;
  grid-template-columns: repeat(18, minmax(0, 1fr));
  gap: 2px;
  padding: 3px;
  border: 2px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface-2);
}

.band-scale__cell {
  height: 12px;
  border-radius: 1px;
  background: transparent;
}

/* Vạch ở mỗi band nguyên giúp đọc nhanh thang điểm */
.band-scale__cell--whole {
  box-shadow: inset -1px 0 0 var(--line);
}
</style>
