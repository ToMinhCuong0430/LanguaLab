<script setup lang="ts">
import { ArrowLeft, AlertTriangle, RotateCcw, ChevronDown, MessageSquare, Check } from '@lucide/vue'
import BandTimelineChart from '~/components/progress/BandTimelineChart.vue'
import QuestionTypeAccuracy from '~/components/progress/QuestionTypeAccuracy.vue'
import type { HistoryItem, StudentProgress } from '~/composables/useClasses'
import { formatDate } from '~/composables/useClasses'
import { SKILL_LABELS, SKILL_ORDER } from '~/composables/useProgress'
import { CRITERIA_META } from '~/composables/useAiScoring'

definePageMeta({ middleware: 'teacher' })

const route = useRoute()
const studentId = route.params.id as string
const api = useClasses()

const data = ref<StudentProgress | null>(null)
const isLoading = ref(true)
const loadError = ref<string | null>(null)

useHead({ title: computed(() => `${data.value?.student.full_name || 'Học viên'} - Giáo viên - LanguaLab`) })

const open = ref<Set<string>>(new Set())
const toggle = (id: string) => {
  const s = new Set(open.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  open.value = s
}

// Form nhận xét cho từng lượt làm bài Writing / Speaking
const drafts = reactive<Record<string, { comment: string; band: string; saving: boolean; error: string | null; saved: boolean }>>({})
const initDrafts = () => {
  for (const h of data.value?.history || []) {
    if (h.skill !== 'writing' && h.skill !== 'speaking') continue
    drafts[h.attempt_id] = {
      comment: h.my_feedback?.comment || '',
      band: h.my_feedback?.override_band != null ? Number(h.my_feedback.override_band).toFixed(1) : '',
      saving: false,
      error: null,
      saved: false,
    }
  }
}

const load = async () => {
  loadError.value = null
  try {
    data.value = await api.getStudentProgress(studentId)
    initDrafts()
    const hash = route.hash.replace('#attempt-', '')
    if (hash) {
      open.value = new Set([hash])
      nextTick(() => document.getElementById(`attempt-${hash}`)?.scrollIntoView({ block: 'start' }))
    }
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    isLoading.value = false
  }
}
onMounted(load)

const BAND_OPTIONS = Array.from({ length: 19 }, (_, i) => (i * 0.5).toFixed(1)).reverse()

const saveFeedback = async (h: HistoryItem) => {
  const d = drafts[h.attempt_id]!
  d.error = null
  d.saved = false
  d.saving = true
  try {
    const res = await api.saveFeedback(h.attempt_id, d.comment, d.band === '' ? null : Number(d.band))
    h.band = res.band_score
    h.my_feedback = d.comment.trim() || d.band !== ''
      ? { comment: d.comment.trim() || null, override_band: d.band === '' ? null : Number(d.band), updated_at: new Date().toISOString() }
      : null
    d.saved = true
  } catch (e: any) {
    d.error = e.message
  } finally {
    d.saving = false
  }
}

const isProductive = (h: HistoryItem) => h.skill === 'writing' || h.skill === 'speaking'
const targetBand = computed(() => (data.value?.student.target_band ? Number(data.value.student.target_band) : null))
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
    <button type="button" class="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-ink hover:underline cursor-pointer" @click="$router.back()">
      <ArrowLeft class="h-4 w-4" :stroke-width="2.5" /> Quay lại
    </button>

    <div v-if="isLoading" class="space-y-4" aria-busy="true" aria-label="Đang tải tiến độ học viên">
      <BaseSkeleton class="h-28 rounded-brut-lg" />
      <BaseSkeleton class="h-80 rounded-brut-lg" />
    </div>

    <section v-else-if="loadError" class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-brut-lg border-[3px] border-line bg-surface p-6 shadow-brut" role="alert">
      <div class="flex items-start gap-3">
        <AlertTriangle class="h-5 w-5 flex-shrink-0 text-bad" :stroke-width="2.5" />
        <p class="text-sm text-ink">{{ loadError }}</p>
      </div>
      <BaseButton variant="secondary" size="md" @click="load"><RotateCcw class="h-4 w-4" :stroke-width="2.5" /><span>Thử lại</span></BaseButton>
    </section>

    <template v-else-if="data">
      <header class="flex flex-wrap items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-brut border-[3px] border-line bg-accent font-display text-lg font-black text-accent-ink">
          <img v-if="data.student.avatar_url" :src="data.student.avatar_url" alt="" class="h-full w-full object-cover" />
          <span v-else>{{ data.student.avatar_text || '?' }}</span>
        </div>
        <div class="min-w-0">
          <h1 class="text-2xl sm:text-3xl font-black text-ink">{{ data.student.full_name || data.student.email }}</h1>
          <p class="text-sm text-ink-soft">
            {{ data.student.email }}<template v-if="data.student.target_band">, mục tiêu {{ data.student.target_exam?.toUpperCase() }} {{ Number(data.student.target_band).toFixed(1) }}</template>
          </p>
        </div>
      </header>

      <section class="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Band gần nhất theo kỹ năng">
        <article v-for="s in SKILL_ORDER" :key="s" class="relative overflow-hidden rounded-brut-lg border-[3px] border-line bg-surface p-4 shadow-brut">
          <span class="absolute inset-x-0 top-0 h-1.5" :style="{ background: `var(--chart-${s})` }" aria-hidden="true" />
          <p class="pt-1 text-xs font-black text-ink">{{ SKILL_LABELS[s] }}</p>
          <p class="mt-1 font-display text-3xl font-black text-ink">{{ data.skills[s]?.latest_band != null ? Number(data.skills[s]!.latest_band).toFixed(1) : '–' }}</p>
          <p class="text-[11px] text-ink-soft">{{ data.skills[s]?.attempts || 0 }} lượt</p>
        </article>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section class="lg:col-span-7 rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut space-y-4">
          <h2 class="text-lg font-black text-ink">Band theo thời gian</h2>
          <BandTimelineChart v-if="data.timeline.length" :points="data.timeline" :target-band="targetBand" />
          <p v-else class="py-10 text-center text-sm text-ink-soft">Học viên chưa có lượt làm bài nào có band.</p>
        </section>
        <section class="lg:col-span-5 rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut space-y-4">
          <h2 class="text-lg font-black text-ink">Độ chính xác theo dạng bài</h2>
          <QuestionTypeAccuracy
            v-if="data.categories.length"
            :categories="data.categories"
            :weak-accuracy="data.rules.weak_accuracy"
            :min-attempts="data.rules.weak_min_attempts"
          />
          <p v-else class="text-sm text-ink-soft">Chưa có bài Reading / Listening nào.</p>
        </section>
      </div>

      <!-- Lịch sử làm bài -->
      <section class="space-y-3">
        <h2 class="text-lg font-black text-ink">Lịch sử làm bài ({{ data.history.length }})</h2>
        <p v-if="!data.history.length" class="rounded-brut-lg border-[3px] border-line bg-surface p-6 text-sm text-ink-soft shadow-brut">Chưa có lượt làm bài nào.</p>
        <ul class="space-y-3" role="list">
          <li v-for="h in data.history" :id="`attempt-${h.attempt_id}`" :key="h.attempt_id" class="scroll-mt-24 rounded-brut-lg border-[3px] border-line bg-surface shadow-brut">
            <button type="button" class="flex w-full min-h-[60px] items-center gap-3 px-4 py-3 text-left cursor-pointer" :aria-expanded="open.has(h.attempt_id)" @click="toggle(h.attempt_id)">
              <span class="h-2.5 w-2.5 flex-shrink-0 rounded-full" :style="{ background: `var(--chart-${h.skill})` }" aria-hidden="true" />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-bold text-ink">{{ h.test_title }}</span>
                <span class="block text-[11px] text-ink-soft">
                  {{ SKILL_LABELS[h.skill] }}, {{ h.mode === 'exam' ? 'Thi thử' : 'Luyện tập' }}, {{ formatDate(h.completed_at, true) }}
                  <template v-if="h.raw_score != null">, đúng {{ h.raw_score }}/{{ h.total_questions }}</template>
                </span>
              </span>
              <span v-if="h.my_feedback" class="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-ink">
                <MessageSquare class="h-3.5 w-3.5" aria-hidden="true" /> Đã nhận xét
              </span>
              <span class="font-display text-lg font-black text-ink tabular-nums">{{ h.band != null ? Number(h.band).toFixed(1) : '–' }}</span>
              <ChevronDown v-if="isProductive(h)" class="h-4 w-4 text-ink transition-transform" :class="{ 'rotate-180': open.has(h.attempt_id) }" aria-hidden="true" />
            </button>

            <div v-if="open.has(h.attempt_id) && isProductive(h)" class="grid grid-cols-1 lg:grid-cols-2 gap-5 border-t-2 border-line/30 p-4">
              <!-- Kết quả AI -->
              <div class="space-y-3">
                <h3 class="text-sm font-black text-ink">Chấm bằng AI</h3>
                <template v-if="h.ai?.status === 'completed' && h.ai.criteria">
                  <p class="text-sm text-ink">Band AI: <strong class="font-display">{{ Number(h.ai.overall_band).toFixed(1) }}</strong><span v-if="h.ai.provider === 'mock'" class="text-xs text-ink-soft"> (điểm giả lập)</span></p>
                  <ul class="space-y-1 text-xs" role="list">
                    <li v-for="(c, key) in h.ai.criteria" :key="key" class="flex justify-between gap-3 text-ink">
                      <span>{{ CRITERIA_META[key]?.label || key }}</span><strong class="tabular-nums">{{ Number(c.band).toFixed(1) }}</strong>
                    </li>
                  </ul>
                  <p v-if="h.ai.summary" class="text-xs text-ink-soft">{{ h.ai.summary }}</p>
                </template>
                <p v-else class="text-xs text-ink-soft">{{ h.ai ? 'Lần chấm AI chưa hoàn tất.' : 'Bài chưa được chấm bằng AI.' }}</p>
                <details v-if="h.ai?.submission_text" class="rounded-brut border-2 border-line/40">
                  <summary class="flex min-h-[40px] cursor-pointer items-center px-3 text-xs font-bold text-ink">Xem bài làm</summary>
                  <p class="max-h-72 overflow-y-auto whitespace-pre-wrap border-t border-line/20 p-3 text-sm leading-7 text-ink">{{ h.ai.submission_text }}</p>
                </details>
              </div>

              <!-- Nhận xét & chỉnh band -->
              <form v-if="drafts[h.attempt_id]" class="space-y-3 rounded-brut border-2 border-line bg-surface-2 p-4" @submit.prevent="saveFeedback(h)">
                <h3 class="text-sm font-black text-ink">Nhận xét của bạn</h3>
                <label class="block">
                  <span class="sr-only">Nhận xét</span>
                  <textarea v-model="drafts[h.attempt_id]!.comment" rows="4" maxlength="4000" placeholder="Điểm làm tốt, lỗi cần sửa, gợi ý luyện tiếp..." class="w-full rounded-brut border-2 border-line bg-surface p-3 text-sm text-ink" />
                </label>
                <label class="block">
                  <span class="mb-1 block text-xs font-black text-ink">Band chính thức</span>
                  <select v-model="drafts[h.attempt_id]!.band" class="w-full max-w-xs min-h-[44px] rounded-brut border-2 border-line bg-surface px-3 text-sm text-ink cursor-pointer">
                    <option value="">Giữ band AI{{ h.ai?.overall_band != null ? ` (${Number(h.ai.overall_band).toFixed(1)})` : '' }}</option>
                    <option v-for="b in BAND_OPTIONS" :key="b" :value="b">{{ b }}</option>
                  </select>
                  <span class="mt-1 block text-[11px] text-ink-soft">Band bạn chọn thay band AI trong tiến độ của học viên. Chọn "Giữ band AI" để bỏ chỉnh.</span>
                </label>
                <p v-if="drafts[h.attempt_id]!.error" class="rounded-brut border-2 border-bad bg-bad/10 p-2 text-xs font-bold text-bad" role="alert">{{ drafts[h.attempt_id]!.error }}</p>
                <div class="flex items-center gap-3">
                  <BaseButton type="submit" variant="primary" size="sm" :disabled="drafts[h.attempt_id]!.saving">
                    <span>{{ drafts[h.attempt_id]!.saving ? 'Đang lưu...' : 'Lưu nhận xét' }}</span>
                  </BaseButton>
                  <span v-if="drafts[h.attempt_id]!.saved" class="inline-flex items-center gap-1 text-xs font-bold text-ink" role="status">
                    <Check class="h-3.5 w-3.5 text-ok" :stroke-width="3" aria-hidden="true" /> Đã lưu, học viên sẽ thấy nhận xét
                  </span>
                </div>
              </form>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
