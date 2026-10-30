<script setup lang="ts">
import { ClipboardCheck, Route, RotateCcw, AlertTriangle, LogIn, ArrowRight, Target } from '@lucide/vue'
import BandTimelineChart from '~/components/progress/BandTimelineChart.vue'
import QuestionTypeAccuracy from '~/components/progress/QuestionTypeAccuracy.vue'
import StudyPlanItemRow from '~/components/progress/StudyPlanItemRow.vue'
import type { ProgressData, StudyPlan, StudyPlanItem } from '~/composables/useProgress'
import { SKILL_LABELS, SKILL_ORDER, currentPlanDay } from '~/composables/useProgress'

useHead({ title: 'Tiến độ của tôi - LanguaLab' })

const { unavailableReason, fetchProgress, fetchActivePlan, setItemDone } = useProgress()
const { profile } = useAuth()

const progress = ref<ProgressData | null>(null)
const plan = ref<StudyPlan | null>(null)
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const itemError = ref<string | null>(null)

const load = async () => {
  if (unavailableReason.value) {
    isLoading.value = false
    return
  }
  isLoading.value = true
  loadError.value = null
  try {
    const [p, sp] = await Promise.all([fetchProgress(), fetchActivePlan()])
    progress.value = p
    plan.value = sp
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    isLoading.value = false
  }
}
onMounted(load)

const hasHistory = computed(() => (progress.value?.totals.attempts ?? 0) > 0)
const targetBand = computed(() => (profile.value?.target_band ? Number(profile.value.target_band) : null))
const overallAccuracy = computed(() => {
  const t = progress.value?.totals
  return t && t.answered ? Math.round((t.correct / t.answered) * 100) : null
})

// Mục theo dõi: dưới ngưỡng nhưng chưa đủ số lượt để kết luận
const watchList = computed(() => {
  const p = progress.value
  if (!p) return []
  return p.categories.filter((c) => !c.is_weak && c.accuracy < p.rules.weak_accuracy)
})

const planDay = computed(() => (plan.value ? currentPlanDay(plan.value) : 1))
const todayItems = computed(() => plan.value?.items.filter((i) => i.day_number === planDay.value) ?? [])
const planDone = computed(() => plan.value?.items.filter((i) => i.completed_at).length ?? 0)

// Cập nhật lạc quan, hoàn tác nếu lỗi
const toggleItem = async (item: StudyPlanItem, done: boolean) => {
  itemError.value = null
  const prev = item.completed_at
  item.completed_at = done ? new Date().toISOString() : null
  try {
    item.completed_at = await setItemDone(item.id, done)
  } catch (e: any) {
    item.completed_at = prev
    itemError.value = e.message
  }
}

const pct = (v: number) => `${Math.round(v * 100)}%`
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8" data-feature="luyen-thi">
    <!-- Tiêu đề -->
    <header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div class="space-y-1">
        <h1 class="text-3xl sm:text-4xl font-black text-ink">Tiến độ của tôi</h1>
        <p class="text-sm text-ink-soft max-w-[60ch]">
          Band qua từng lượt làm bài, độ chính xác theo dạng câu hỏi và những dạng cần ưu tiên luyện.
        </p>
      </div>
      <div class="flex flex-wrap gap-3">
        <BaseButton to="/tien-do/kiem-tra-dau-vao" variant="secondary" size="md">
          <ClipboardCheck class="h-4 w-4" :stroke-width="2.5" />
          <span>Kiểm tra đầu vào</span>
        </BaseButton>
        <BaseButton to="/tien-do/lo-trinh" variant="primary" size="md">
          <Route class="h-4 w-4" :stroke-width="2.5" />
          <span>{{ plan ? 'Xem lộ trình' : 'Tạo lộ trình' }}</span>
        </BaseButton>
      </div>
    </header>

    <!-- Chưa đăng nhập / chế độ mock -->
    <section
      v-if="unavailableReason"
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-brut-lg border-[3px] border-line bg-surface-2 p-6 shadow-brut"
    >
      <p class="text-sm font-bold text-ink">{{ unavailableReason }}</p>
      <BaseButton to="/dang-nhap" variant="primary" size="md">
        <LogIn class="h-4 w-4" :stroke-width="2.5" />
        <span>Đăng nhập</span>
      </BaseButton>
    </section>

    <!-- Đang tải -->
    <div v-else-if="isLoading" class="space-y-6" aria-busy="true" aria-label="Đang tải tiến độ">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BaseSkeleton v-for="i in 4" :key="i" class="h-28 rounded-brut-lg" />
      </div>
      <BaseSkeleton class="h-80 rounded-brut-lg" />
    </div>

    <!-- Lỗi -->
    <section
      v-else-if="loadError"
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-brut-lg border-[3px] border-line bg-surface p-6 shadow-brut"
      role="alert"
    >
      <div class="flex items-start gap-3">
        <AlertTriangle class="h-5 w-5 flex-shrink-0 text-bad" :stroke-width="2.5" />
        <div>
          <p class="font-display font-black text-ink">Không tải được tiến độ</p>
          <p class="text-sm text-ink-soft">{{ loadError }}</p>
        </div>
      </div>
      <BaseButton variant="secondary" size="md" @click="load">
        <RotateCcw class="h-4 w-4" :stroke-width="2.5" />
        <span>Thử lại</span>
      </BaseButton>
    </section>

    <!-- Chưa có lượt làm bài nào -->
    <section
      v-else-if="!hasHistory"
      class="rounded-brut-lg border-[3px] border-line bg-surface p-8 shadow-brut space-y-3 text-center"
    >
      <h2 class="text-xl font-black text-ink">Chưa có lượt làm bài nào</h2>
      <p class="text-sm text-ink-soft max-w-[52ch] mx-auto">
        Làm bài kiểm tra đầu vào khoảng 15 phút để biết band hiện tại và nhận lộ trình học phù hợp.
      </p>
      <div class="flex justify-center pt-2">
        <BaseButton to="/tien-do/kiem-tra-dau-vao" variant="primary" size="md">
          <ClipboardCheck class="h-4 w-4" :stroke-width="2.5" />
          <span>Làm bài kiểm tra đầu vào</span>
        </BaseButton>
      </div>
    </section>

    <template v-else-if="progress">
      <!-- Band gần nhất theo kỹ năng -->
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Band gần nhất theo kỹ năng">
        <article
          v-for="s in SKILL_ORDER"
          :key="s"
          class="relative overflow-hidden rounded-brut-lg border-[3px] border-line bg-surface p-4 shadow-brut"
        >
          <span class="absolute inset-x-0 top-0 h-1.5" :style="{ background: `var(--chart-${s})` }" aria-hidden="true" />
          <p class="pt-1 text-xs font-black text-ink">{{ SKILL_LABELS[s] }}</p>
          <template v-if="progress.skills[s]?.latest_band != null">
            <p class="mt-1 font-display text-4xl font-black text-ink">{{ Number(progress.skills[s]!.latest_band).toFixed(1) }}</p>
            <p class="text-[11px] text-ink-soft">
              Cao nhất {{ Number(progress.skills[s]!.best_band).toFixed(1) }}, {{ progress.skills[s]!.attempts }} lượt
            </p>
          </template>
          <template v-else>
            <p class="mt-2 text-sm font-bold text-ink-soft">Chưa có band</p>
            <NuxtLink :to="`/luyen-thi/ielts/${s}`" class="text-[11px] font-bold text-ink underline underline-offset-2">Làm một đề</NuxtLink>
          </template>
        </article>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Biểu đồ band -->
        <section class="lg:col-span-8 rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut space-y-4">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h2 class="text-lg font-black text-ink">Band theo thời gian</h2>
            <p v-if="targetBand" class="flex items-center gap-1.5 text-xs font-bold text-ink-soft">
              <Target class="h-3.5 w-3.5" aria-hidden="true" /> Mục tiêu {{ targetBand.toFixed(1) }}
            </p>
          </div>
          <BandTimelineChart v-if="progress.timeline.length" :points="progress.timeline" :target-band="targetBand" />
          <p v-else class="py-10 text-center text-sm text-ink-soft">Chưa có lượt làm bài nào có band.</p>
        </section>

        <!-- Điểm yếu -->
        <section class="lg:col-span-4 rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut space-y-4">
          <div>
            <h2 class="text-lg font-black text-ink">Điểm yếu cố định</h2>
            <p class="text-xs text-ink-soft">
              Dạng bài dưới {{ pct(progress.rules.weak_accuracy) }} sau ít nhất {{ progress.rules.weak_min_attempts }} lượt làm.
            </p>
          </div>

          <ul v-if="progress.weaknesses.length" class="space-y-2.5" role="list">
            <li
              v-for="w in progress.weaknesses"
              :key="`${w.skill}:${w.category}`"
              class="flex items-start gap-3 rounded-brut border-2 border-line bg-bad/10 p-3"
            >
              <AlertTriangle class="mt-0.5 h-4 w-4 flex-shrink-0 text-bad" :stroke-width="2.5" aria-hidden="true" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-black text-ink">{{ w.category }}</p>
                <p class="text-[11px] text-ink-soft">{{ SKILL_LABELS[w.skill] }}, {{ w.attempts }} lượt, {{ w.total }} câu</p>
              </div>
              <span class="font-display text-lg font-black text-ink tabular-nums">{{ pct(w.accuracy) }}</span>
            </li>
          </ul>
          <p v-else class="rounded-brut border-2 border-line/40 p-3 text-sm text-ink-soft">
            Chưa có dạng bài nào là điểm yếu cố định.
          </p>

          <div v-if="watchList.length" class="space-y-1.5">
            <p class="text-xs font-black text-ink">Đang theo dõi</p>
            <p v-for="c in watchList" :key="`${c.skill}:${c.category}`" class="text-xs text-ink-soft">
              {{ c.category }} ({{ SKILL_LABELS[c.skill] }}): {{ pct(c.accuracy) }}, {{ c.attempts }}/{{ progress.rules.weak_min_attempts }} lượt
            </p>
          </div>

          <NuxtLink
            to="/tien-do/lo-trinh"
            class="flex min-h-[44px] items-center justify-between gap-2 rounded-brut border-2 border-line bg-warn px-3 font-display text-sm font-black text-on-tone shadow-brut-sm brut-press"
          >
            {{ plan ? 'Tiếp tục lộ trình' : 'Tạo lộ trình từ điểm yếu' }}
            <ArrowRight class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
          </NuxtLink>
        </section>
      </div>

      <!-- Accuracy theo dạng bài -->
      <section class="rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut space-y-4">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="text-lg font-black text-ink">Độ chính xác theo dạng bài</h2>
          <p v-if="overallAccuracy !== null" class="text-xs font-bold text-ink-soft">
            Tổng: {{ overallAccuracy }}% trên {{ progress.totals.answered }} câu Reading và Listening
          </p>
        </div>
        <QuestionTypeAccuracy
          v-if="progress.categories.length"
          :categories="progress.categories"
          :weak-accuracy="progress.rules.weak_accuracy"
          :min-attempts="progress.rules.weak_min_attempts"
        />
        <p v-else class="text-sm text-ink-soft">Làm một đề Reading hoặc Listening để xem độ chính xác theo dạng bài.</p>
      </section>

      <!-- Việc hôm nay trong lộ trình -->
      <section v-if="plan" class="rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-black text-ink">Hôm nay: ngày {{ planDay }}/{{ plan.duration_days }}</h2>
            <p class="text-xs text-ink-soft">Đã hoàn thành {{ planDone }}/{{ plan.items.length }} mục trong lộ trình.</p>
          </div>
          <NuxtLink to="/tien-do/lo-trinh" class="text-sm font-bold text-ink underline underline-offset-4">Xem cả lộ trình</NuxtLink>
        </div>
        <p v-if="itemError" class="rounded-brut border-2 border-bad bg-bad/10 p-2 text-xs font-bold text-bad" role="alert">{{ itemError }}</p>
        <ul class="space-y-2.5" role="list">
          <StudyPlanItemRow v-for="item in todayItems" :key="item.id" :item="item" @toggle="toggleItem" />
        </ul>
      </section>
    </template>
  </div>
</template>
