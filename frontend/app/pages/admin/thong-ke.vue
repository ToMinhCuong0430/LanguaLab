<script setup lang="ts">
import { RefreshCw, Trophy, Repeat } from '@lucide/vue'
import PageBanner from '~/components/common/PageBanner.vue'
import DailyBarChart from '~/components/admin/DailyBarChart.vue'
import { SKILL_LABELS, type IeltsSkillKey } from '~/composables/useProgress'
import type { PlatformStats } from '~/composables/useAdmin'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Thống kê nền tảng - Langua Admin' })

const { platformStats } = useAdmin()

const PERIODS = [7, 30, 90] as const
const days = ref<number>(30)
const stats = ref<PlatformStats | null>(null)
const isLoading = ref(true)
const loadError = ref('')

const load = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    stats.value = await platformStats(days.value)
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    isLoading.value = false
  }
}
onMounted(load)
watch(days, load)

const pct = (r: number | null | undefined) => (r === null || r === undefined ? '–' : `${Math.round(r * 100)}%`)

const kpis = computed(() => {
  const t = stats.value?.totals
  const r = stats.value?.retention
  if (!t || !r) return []
  return [
    { label: 'Tổng người dùng', value: String(t.users), note: t.banned ? `${t.banned} tài khoản đang khoá` : 'Không có tài khoản bị khoá' },
    { label: `Người dùng mới (${days.value} ngày)`, value: String(t.new_users), note: `${t.new_users_7d} người trong 7 ngày qua` },
    { label: 'Hoạt động 7 ngày', value: String(t.active_7d), note: `${t.active_today} người hôm nay` },
    {
      label: 'Giữ chân 7 ngày',
      value: pct(r.rate),
      note: r.cohort_size ? `${r.retained}/${r.cohort_size} người quay lại trong tuần đầu` : 'Chưa có người đăng ký đủ 7 ngày',
    },
  ]
})

const newUsersSeries = computed(() => (stats.value?.daily ?? []).map((d) => ({ date: d.date, value: d.new_users })))
const activeSeries = computed(() => (stats.value?.daily ?? []).map((d) => ({ date: d.date, value: d.active_users })))
const maxAttempts = computed(() => Math.max(1, ...(stats.value?.top_tests ?? []).map((t) => t.attempts)))
const skillLabel = (s: string) => SKILL_LABELS[s as IeltsSkillKey] ?? s
const weekLabel = (w: string) => {
  const start = new Date(w)
  const end = new Date(start.getTime() + 6 * 86_400_000)
  const f = (d: Date) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  return `${f(start)} – ${f(end)}`
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-5">
    <PageBanner
      title="Thống kê nền tảng"
      description="Người dùng mới, mức độ hoạt động, bài thi được làm nhiều nhất và tỉ lệ quay lại trong tuần đầu."
      badge-text="Quản trị"
      feature="admin"
    >
      <template #actions>
        <div class="inline-flex rounded-brut border-2 border-line bg-surface shadow-brut-sm" role="group" aria-label="Khoảng thời gian">
          <button
            v-for="p in PERIODS"
            :key="p"
            type="button"
            class="min-h-[44px] px-3 text-xs font-black cursor-pointer border-r-2 border-line last:border-r-0"
            :class="days === p ? 'bg-ink text-surface' : 'text-ink hover:bg-surface-2'"
            :aria-pressed="days === p"
            @click="days = p"
          >
            {{ p }} ngày
          </button>
        </div>
      </template>
    </PageBanner>

    <div v-if="loadError" class="flex flex-col items-center gap-3 rounded-brut border-2 border-bad bg-bad/10 p-6 text-center">
      <p class="text-sm font-bold text-bad" role="alert">{{ loadError }}</p>
      <BaseButton variant="secondary" size="sm" @click="load"><RefreshCw class="h-4 w-4" /> <span>Tải lại</span></BaseButton>
    </div>

    <template v-else>
      <!-- Chỉ số chính -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" :class="{ 'opacity-60': isLoading && stats }">
        <template v-if="stats">
          <BaseCard v-for="k in kpis" :key="k.label">
            <p class="text-xs font-bold text-ink-soft">{{ k.label }}</p>
            <p class="mt-1 font-display text-3xl font-black text-ink tabular-nums">{{ k.value }}</p>
            <p class="mt-1 text-[11px] text-ink-soft">{{ k.note }}</p>
          </BaseCard>
        </template>
        <template v-else>
          <BaseSkeleton v-for="i in 4" :key="i" height="6.5rem" rounded="md" />
        </template>
      </div>

      <!-- Hai biểu đồ riêng, không dùng trục kép -->
      <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <BaseCard>
          <template #header>
            <h2 class="font-display text-base font-black text-ink">Người dùng mới mỗi ngày</h2>
          </template>
          <DailyBarChart v-if="stats" :points="newUsersSeries" color="var(--chart-listening)" unit="người dùng mới" />
          <BaseSkeleton v-else height="200px" rounded="md" />
        </BaseCard>
        <BaseCard>
          <template #header>
            <h2 class="font-display text-base font-black text-ink">Người học hoạt động mỗi ngày</h2>
          </template>
          <DailyBarChart v-if="stats" :points="activeSeries" color="var(--chart-reading)" unit="người hoạt động" />
          <BaseSkeleton v-else height="200px" rounded="md" />
        </BaseCard>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <!-- Bài thi được làm nhiều nhất -->
        <BaseCard class="xl:col-span-3">
          <template #header>
            <h2 class="flex items-center gap-2 font-display text-base font-black text-ink">
              <Trophy class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" /> Bài thi được làm nhiều nhất
            </h2>
          </template>
          <BaseSkeleton v-if="!stats" height="2.5rem" :count="4" />
          <BaseEmptyState
            v-else-if="stats.top_tests.length === 0"
            :icon="Trophy"
            title="Chưa có lượt làm bài"
            :description="`Không có lượt nộp bài nào trong ${days} ngày qua.`"
          />
          <div v-else class="overflow-x-auto rounded-brut border-2 border-line">
            <table class="w-full min-w-[520px] text-left text-xs text-ink">
              <thead class="bg-surface-2">
                <tr>
                  <th scope="col" class="p-2.5 font-black">Bài thi</th>
                  <th scope="col" class="p-2.5 font-black">Lượt làm</th>
                  <th scope="col" class="p-2.5 text-right font-black">Người làm</th>
                  <th scope="col" class="p-2.5 text-right font-black">Band TB</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in stats.top_tests" :key="t.id" class="border-t border-line/20">
                  <td class="p-2.5">
                    <p class="font-bold">{{ t.title }}</p>
                    <p class="text-[11px] text-ink-soft">{{ skillLabel(t.skill) }}</p>
                  </td>
                  <td class="p-2.5">
                    <div class="flex items-center gap-2">
                      <span class="h-2 rounded-full" :style="{ width: `${Math.max(4, (t.attempts / maxAttempts) * 120)}px`, background: 'var(--chart-listening)' }" aria-hidden="true" />
                      <span class="font-black tabular-nums">{{ t.attempts }}</span>
                    </div>
                  </td>
                  <td class="p-2.5 text-right tabular-nums">{{ t.users }}</td>
                  <td class="p-2.5 text-right font-bold tabular-nums">{{ t.avg_band === null ? '–' : Number(t.avg_band).toFixed(1) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>

        <!-- Retention theo tuần đăng ký -->
        <BaseCard class="xl:col-span-2">
          <template #header>
            <h2 class="flex items-center gap-2 font-display text-base font-black text-ink">
              <Repeat class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" /> Giữ chân 7 ngày theo tuần đăng ký
            </h2>
          </template>
          <p class="mb-3 text-[11px] text-ink-soft">
            Tỉ lệ người đăng ký trong tuần có làm bài, nhận XP hoặc điểm danh từ ngày thứ 2 đến ngày thứ 8 sau khi đăng ký.
            Chỉ tính người đã đăng ký đủ 7 ngày, tối đa 10 tuần gần nhất.
          </p>
          <BaseSkeleton v-if="!stats" height="2rem" :count="4" />
          <BaseEmptyState
            v-else-if="stats.retention.weeks.length === 0"
            :icon="Repeat"
            title="Chưa đủ dữ liệu"
            description="Cần có người dùng đăng ký từ 8 ngày trước trở lên để đo tỉ lệ quay lại."
          />
          <table v-else class="w-full text-left text-xs text-ink">
            <thead>
              <tr class="border-b-2 border-line">
                <th scope="col" class="py-2 font-black">Tuần</th>
                <th scope="col" class="py-2 text-right font-black">Đăng ký</th>
                <th scope="col" class="py-2 pl-3 font-black">Quay lại</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="w in [...stats.retention.weeks].reverse()" :key="w.week" class="border-b border-line/20">
                <td class="py-2 tabular-nums">{{ weekLabel(w.week) }}</td>
                <td class="py-2 text-right tabular-nums">{{ w.size }}</td>
                <td class="py-2 pl-3">
                  <div class="flex items-center gap-2">
                    <div class="h-2 w-20 overflow-hidden rounded-full bg-[var(--chart-grid)]" aria-hidden="true">
                      <div class="h-full rounded-full" :style="{ width: `${(w.rate ?? 0) * 100}%`, background: 'var(--chart-reading)' }" />
                    </div>
                    <span class="font-black tabular-nums">{{ pct(w.rate) }}</span>
                    <span class="text-ink-soft tabular-nums">({{ w.retained }})</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </BaseCard>
      </div>
    </template>
  </div>
</template>
