<script setup lang="ts">
import { ArrowLeft, Route, RotateCcw, AlertTriangle, LogIn, ChevronDown, ClipboardCheck } from '@lucide/vue'
import StudyPlanItemRow from '~/components/progress/StudyPlanItemRow.vue'
import type { StudyPlan, StudyPlanItem } from '~/composables/useProgress'
import { SKILL_LABELS, currentPlanDay } from '~/composables/useProgress'

useHead({ title: 'Lộ trình học - LanguaLab' })

const route = useRoute()
const { unavailableReason, fetchActivePlan, fetchLatestDiagnostic, createPlan, setItemDone } = useProgress()

const DURATIONS = [7, 14, 30] as const

const plan = ref<StudyPlan | null>(null)
const latestDiagnostic = ref<{ id: string; created_at: string } | null>(null)
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const actionError = ref<string | null>(null)
const isCreating = ref(false)
const showCreator = ref(false)
const duration = ref<7 | 14 | 30>(Number(route.query.ngay) === 7 || Number(route.query.ngay) === 30 ? (Number(route.query.ngay) as 7 | 30) : 14)

const load = async () => {
  if (unavailableReason.value) {
    isLoading.value = false
    return
  }
  isLoading.value = true
  loadError.value = null
  try {
    const [p, d] = await Promise.all([fetchActivePlan(), fetchLatestDiagnostic()])
    plan.value = p
    latestDiagnostic.value = d
    if (p) openDays.value = new Set([currentPlanDay(p)])
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    isLoading.value = false
  }
}
onMounted(load)

const create = async () => {
  if (plan.value && !confirm('Lộ trình hiện tại sẽ được lưu trữ và thay bằng lộ trình mới. Tiếp tục?')) return
  isCreating.value = true
  actionError.value = null
  try {
    await createPlan(duration.value, latestDiagnostic.value?.id)
    showCreator.value = false
    await load()
  } catch (e: any) {
    actionError.value = e.message
  } finally {
    isCreating.value = false
  }
}

const days = computed(() => {
  if (!plan.value) return []
  const map = new Map<number, StudyPlanItem[]>()
  for (const item of plan.value.items) {
    if (!map.has(item.day_number)) map.set(item.day_number, [])
    map.get(item.day_number)!.push(item)
  }
  return [...map.entries()].map(([day, items]) => ({
    day,
    items,
    done: items.filter((i) => i.completed_at).length,
    minutes: items.reduce((s, i) => s + i.estimated_minutes, 0),
  }))
})
const today = computed(() => (plan.value ? currentPlanDay(plan.value) : 1))
const doneCount = computed(() => plan.value?.items.filter((i) => i.completed_at).length ?? 0)
const progressPct = computed(() => (plan.value?.items.length ? Math.round((doneCount.value / plan.value.items.length) * 100) : 0))

const openDays = ref<Set<number>>(new Set())
const toggleDay = (d: number) => {
  const next = new Set(openDays.value)
  if (next.has(d)) next.delete(d)
  else next.add(d)
  openDays.value = next
}

const dateOfDay = (d: number) => {
  if (!plan.value) return ''
  const dt = new Date(`${plan.value.start_date}T00:00:00`)
  dt.setDate(dt.getDate() + d - 1)
  return dt.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

const toggleItem = async (item: StudyPlanItem, done: boolean) => {
  actionError.value = null
  const prev = item.completed_at
  item.completed_at = done ? new Date().toISOString() : null
  try {
    item.completed_at = await setItemDone(item.id, done)
  } catch (e: any) {
    item.completed_at = prev
    actionError.value = e.message
  }
}

const focusLabel = (f: StudyPlan['focus'][number]) =>
  f.category ? `${f.category} (${SKILL_LABELS[f.skill]})` : SKILL_LABELS[f.skill]
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-6" data-feature="luyen-thi">
    <NuxtLink to="/tien-do" class="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-ink hover:underline">
      <ArrowLeft class="h-4 w-4" :stroke-width="2.5" /> Tiến độ của tôi
    </NuxtLink>

    <section
      v-if="unavailableReason"
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-brut-lg border-[3px] border-line bg-surface-2 p-6 shadow-brut"
    >
      <p class="text-sm font-bold text-ink">{{ unavailableReason }}</p>
      <BaseButton to="/dang-nhap" variant="primary" size="md">
        <LogIn class="h-4 w-4" :stroke-width="2.5" /><span>Đăng nhập</span>
      </BaseButton>
    </section>

    <div v-else-if="isLoading" class="space-y-4" aria-busy="true" aria-label="Đang tải lộ trình">
      <BaseSkeleton class="h-36 rounded-brut-lg" />
      <BaseSkeleton v-for="i in 3" :key="i" class="h-16 rounded-brut-lg" />
    </div>

    <section
      v-else-if="loadError"
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-brut-lg border-[3px] border-line bg-surface p-6 shadow-brut"
      role="alert"
    >
      <div class="flex items-start gap-3">
        <AlertTriangle class="h-5 w-5 flex-shrink-0 text-bad" :stroke-width="2.5" />
        <p class="text-sm text-ink">{{ loadError }}</p>
      </div>
      <BaseButton variant="secondary" size="md" @click="load">
        <RotateCcw class="h-4 w-4" :stroke-width="2.5" /><span>Thử lại</span>
      </BaseButton>
    </section>

    <template v-else>
      <!-- Tạo lộ trình (khi chưa có, hoặc muốn tạo lại) -->
      <section
        v-if="!plan || showCreator"
        class="rounded-brut-lg border-[3px] border-line bg-surface p-6 shadow-brut space-y-5"
      >
        <div class="space-y-1">
          <h1 class="text-2xl sm:text-3xl font-black text-ink">{{ plan ? 'Tạo lộ trình mới' : 'Tạo lộ trình học' }}</h1>
          <p class="text-sm text-ink-soft max-w-[62ch]">
            <template v-if="latestDiagnostic">
              Lộ trình dựa trên bài kiểm tra đầu vào ngày {{ new Date(latestDiagnostic.created_at).toLocaleDateString('vi-VN') }}
              và các dạng bài bạn hay sai trong lịch sử làm bài.
            </template>
            <template v-else>
              Lộ trình dựa trên các dạng bài bạn hay sai trong lịch sử làm bài. Làm bài kiểm tra đầu vào trước để lộ trình sát hơn.
            </template>
          </p>
        </div>

        <fieldset class="space-y-2">
          <legend class="text-sm font-black text-ink">Thời lượng</legend>
          <div class="grid grid-cols-3 gap-3 max-w-md">
            <label
              v-for="d in DURATIONS"
              :key="d"
              class="flex min-h-[64px] cursor-pointer flex-col items-center justify-center rounded-brut border-2 p-2 text-center transition-colors"
              :class="duration === d ? 'border-line bg-warn text-on-tone shadow-brut-sm' : 'border-line/40 bg-surface text-ink hover:border-line'"
            >
              <input v-model="duration" type="radio" name="duration" :value="d" class="sr-only" />
              <span class="font-display text-xl font-black">{{ d }}</span>
              <span class="text-[11px] font-bold">ngày</span>
            </label>
          </div>
          <p class="text-xs text-ink-soft">Mỗi ngày khoảng 30–45 phút; cuối mỗi tuần có một buổi thi thử và xem lại tiến độ.</p>
        </fieldset>

        <p v-if="actionError" class="rounded-brut border-2 border-bad bg-bad/10 p-2 text-xs font-bold text-bad" role="alert">{{ actionError }}</p>

        <div class="flex flex-wrap items-center gap-3">
          <BaseButton variant="primary" size="md" :disabled="isCreating" @click="create">
            <Route class="h-4 w-4" :stroke-width="2.5" />
            <span>{{ isCreating ? 'Đang tạo...' : `Tạo lộ trình ${duration} ngày` }}</span>
          </BaseButton>
          <BaseButton v-if="!latestDiagnostic" to="/tien-do/kiem-tra-dau-vao" variant="secondary" size="md">
            <ClipboardCheck class="h-4 w-4" :stroke-width="2.5" />
            <span>Làm kiểm tra đầu vào trước</span>
          </BaseButton>
          <button v-if="plan" type="button" class="min-h-[44px] px-2 text-sm font-bold text-ink underline cursor-pointer" @click="showCreator = false">
            Huỷ
          </button>
        </div>
      </section>

      <!-- Lộ trình đang chạy -->
      <template v-if="plan">
        <section class="rounded-brut-lg border-[3px] border-line bg-surface p-6 shadow-brut space-y-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="space-y-1">
              <h1 class="text-2xl sm:text-3xl font-black text-ink">Lộ trình {{ plan.duration_days }} ngày</h1>
              <p class="text-sm text-ink-soft">
                Bắt đầu {{ new Date(`${plan.start_date}T00:00:00`).toLocaleDateString('vi-VN') }}, hôm nay là ngày {{ today }}.
              </p>
            </div>
            <button
              v-if="!showCreator"
              type="button"
              class="min-h-[44px] rounded-brut border-2 border-line bg-surface-2 px-3 text-xs font-black text-ink cursor-pointer"
              @click="showCreator = true"
            >
              Tạo lộ trình mới
            </button>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-baseline justify-between text-xs font-bold text-ink">
              <span>Đã hoàn thành {{ doneCount }}/{{ plan.items.length }} mục</span>
              <span class="tabular-nums">{{ progressPct }}%</span>
            </div>
            <div
              class="h-3 rounded-full border-2 border-line bg-surface-2 overflow-hidden"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuenow="progressPct"
              aria-label="Tiến độ lộ trình"
            >
              <div class="h-full bg-ok transition-all" :style="{ width: `${progressPct}%` }" />
            </div>
          </div>

          <div v-if="plan.focus.length" class="space-y-1.5">
            <p class="text-xs font-black text-ink">Tập trung vào</p>
            <ul class="flex flex-wrap gap-2" role="list">
              <li
                v-for="(f, i) in plan.focus"
                :key="i"
                class="inline-flex items-center gap-1.5 rounded-brut border-2 border-line bg-surface-2 px-2 py-1 text-xs font-bold text-ink"
              >
                <span class="h-2 w-2 rounded-full" :style="{ background: `var(--chart-${f.skill})` }" aria-hidden="true" />
                {{ focusLabel(f) }}
                <span v-if="f.score !== null && f.category" class="text-ink-soft">{{ Math.round(f.score * 100) }}%</span>
              </li>
            </ul>
          </div>
        </section>

        <p v-if="actionError && !showCreator" class="rounded-brut border-2 border-bad bg-bad/10 p-2 text-xs font-bold text-bad" role="alert">{{ actionError }}</p>

        <!-- Các ngày -->
        <ol class="space-y-3" role="list">
          <li
            v-for="d in days"
            :key="d.day"
            class="rounded-brut-lg border-[3px] bg-surface"
            :class="d.day === today ? 'border-line shadow-brut' : 'border-line/50'"
          >
            <button
              type="button"
              class="flex w-full min-h-[56px] items-center gap-3 px-4 py-2 text-left cursor-pointer"
              :aria-expanded="openDays.has(d.day)"
              @click="toggleDay(d.day)"
            >
              <span
                class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-brut border-2 border-line font-display text-sm font-black"
                :class="d.done === d.items.length ? 'bg-ok text-on-tone' : d.day === today ? 'bg-warn text-on-tone' : 'bg-surface-2 text-ink'"
              >{{ d.day }}</span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-black text-ink">
                  Ngày {{ d.day }}<span v-if="d.day === today"> (hôm nay)</span>
                </span>
                <span class="block text-[11px] text-ink-soft">{{ dateOfDay(d.day) }}, {{ d.items.length }} mục, khoảng {{ d.minutes }} phút</span>
              </span>
              <span class="text-xs font-bold text-ink tabular-nums">{{ d.done }}/{{ d.items.length }}</span>
              <ChevronDown class="h-4 w-4 text-ink transition-transform" :class="{ 'rotate-180': openDays.has(d.day) }" aria-hidden="true" />
            </button>
            <ul v-if="openDays.has(d.day)" class="space-y-2.5 border-t-2 border-line/30 p-3" role="list">
              <StudyPlanItemRow v-for="item in d.items" :key="item.id" :item="item" @toggle="toggleItem" />
            </ul>
          </li>
        </ol>
      </template>
    </template>
  </div>
</template>
