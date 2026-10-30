<script setup lang="ts">
import type { IeltsSkillKey, TimelinePoint } from '~/composables/useProgress'
import { SKILL_LABELS, SKILL_ORDER } from '~/composables/useProgress'

// Biểu đồ đường: band từng lượt làm bài theo thời gian, mỗi kỹ năng một đường.
// Theo dataviz: đường 2px, điểm r=4 có viền màu nền, lưới mảnh, chú thích luôn hiện,
// nhãn cuối đường khi không chồng nhau, tooltip khi rê chuột, có bảng dữ liệu thay thế.
const props = defineProps<{
  points: TimelinePoint[]
  targetBand?: number | null
}>()

const HEIGHT = 280
const M = { top: 16, right: 96, bottom: 30, left: 40 }

const wrapRef = ref<HTMLElement | null>(null)
const width = ref(640)
let ro: ResizeObserver | null = null
onMounted(() => {
  if (!wrapRef.value) return
  ro = new ResizeObserver(([entry]) => {
    width.value = Math.max(320, Math.floor(entry!.contentRect.width))
  })
  ro.observe(wrapRef.value)
})
onUnmounted(() => ro?.disconnect())

const hidden = ref<Set<IeltsSkillKey>>(new Set())
const toggleSkill = (s: IeltsSkillKey) => {
  const next = new Set(hidden.value)
  if (next.has(s)) next.delete(s)
  else next.add(s)
  hidden.value = next
}

const skillsPresent = computed(() => SKILL_ORDER.filter((s) => props.points.some((p) => p.skill === s)))
const visiblePoints = computed(() => props.points.filter((p) => !hidden.value.has(p.skill)))

const times = computed(() => props.points.map((p) => new Date(p.completed_at).getTime()))
const xDomain = computed<[number, number]>(() => {
  if (!times.value.length) return [Date.now() - 86_400_000, Date.now()]
  let lo = Math.min(...times.value)
  let hi = Math.max(...times.value)
  if (hi - lo < 86_400_000) {
    lo -= 86_400_000
    hi += 86_400_000
  }
  return [lo, hi]
})
const yDomain = computed<[number, number]>(() => {
  const bands = props.points.map((p) => p.band)
  if (props.targetBand) bands.push(props.targetBand)
  const lo = bands.length ? Math.max(0, Math.floor(Math.min(...bands) - 0.5)) : 3
  return [Math.min(lo, 8), 9]
})

const innerW = computed(() => width.value - M.left - M.right)
const innerH = HEIGHT - M.top - M.bottom
const x = (t: number) => M.left + ((t - xDomain.value[0]) / (xDomain.value[1] - xDomain.value[0])) * innerW.value
const y = (b: number) => M.top + (1 - (b - yDomain.value[0]) / (yDomain.value[1] - yDomain.value[0])) * innerH

const yTicks = computed(() => {
  const out: number[] = []
  for (let b = Math.ceil(yDomain.value[0]); b <= yDomain.value[1]; b++) out.push(b)
  return out
})
const fmtDate = (t: number | string) => new Date(t).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
const xTicks = computed(() => {
  const count = Math.max(2, Math.min(5, Math.floor(innerW.value / 110)))
  const [a, b] = xDomain.value
  const ticks = Array.from({ length: count }, (_, i) => a + ((b - a) * i) / (count - 1))
  // Khoảng thời gian ngắn cho ra nhiều mốc cùng ngày: chỉ giữ một nhãn cho mỗi ngày
  return ticks.filter((t, i) => i === 0 || fmtDate(t) !== fmtDate(ticks[i - 1]!))
})

const series = computed(() =>
  skillsPresent.value
    .filter((s) => !hidden.value.has(s))
    .map((s) => {
      const pts = props.points
        .filter((p) => p.skill === s)
        .sort((a, b) => +new Date(a.completed_at) - +new Date(b.completed_at))
        .map((p) => ({ ...p, px: x(+new Date(p.completed_at)), py: y(p.band) }))
      return { skill: s, pts, path: pts.map((p) => `${p.px},${p.py}`).join(' ') }
    }),
)

// Nhãn cuối đường: bỏ nhãn nào cách nhãn trước < 14px (để chú thích + tooltip đảm nhận)
const endLabels = computed(() => {
  const labels = series.value
    .filter((s) => s.pts.length)
    .map((s) => {
      const last = s.pts[s.pts.length - 1]!
      return { skill: s.skill, x: last.px, y: last.py, band: last.band }
    })
    .sort((a, b) => a.y - b.y)
  const kept: typeof labels = []
  for (const l of labels) {
    if (kept.every((k) => Math.abs(k.y - l.y) >= 14)) kept.push(l)
  }
  return kept
})

// Tooltip: điểm gần con trỏ nhất trong bán kính 28px
const hover = ref<(TimelinePoint & { px: number; py: number }) | null>(null)
const onMove = (e: PointerEvent) => {
  const svg = e.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const mx = ((e.clientX - rect.left) / rect.width) * width.value
  const my = ((e.clientY - rect.top) / rect.height) * HEIGHT
  let best: typeof hover.value = null
  let bestD = 28
  for (const s of series.value) {
    for (const p of s.pts) {
      const d = Math.hypot(p.px - mx, p.py - my)
      if (d < bestD) {
        bestD = d
        best = p
      }
    }
  }
  hover.value = best
}

const summary = computed(() => {
  const parts = skillsPresent.value.map((s) => {
    const pts = props.points.filter((p) => p.skill === s)
    const last = pts.reduce((a, b) => (+new Date(b.completed_at) > +new Date(a.completed_at) ? b : a))
    return `${SKILL_LABELS[s]} gần nhất ${last.band.toFixed(1)}`
  })
  return `Biểu đồ band theo thời gian. ${parts.join(', ')}.`
})

const tableRows = computed(() =>
  [...props.points].sort((a, b) => +new Date(b.completed_at) - +new Date(a.completed_at)),
)
</script>

<template>
  <div class="space-y-3">
    <!-- Chú thích = bộ lọc: bấm để ẩn/hiện một kỹ năng -->
    <div class="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc kỹ năng trên biểu đồ">
      <button
        v-for="s in skillsPresent"
        :key="s"
        type="button"
        class="inline-flex min-h-[36px] items-center gap-2 rounded-brut border-2 px-2.5 text-xs font-bold cursor-pointer transition-colors"
        :class="hidden.has(s) ? 'border-line/40 text-ink-soft' : 'border-line text-ink bg-surface'"
        :aria-pressed="!hidden.has(s)"
        @click="toggleSkill(s)"
      >
        <span class="h-0.5 w-4 rounded-full" :style="{ background: hidden.has(s) ? 'var(--line)' : `var(--chart-${s})`, opacity: hidden.has(s) ? 0.4 : 1 }" aria-hidden="true" />
        {{ SKILL_LABELS[s] }}
      </button>
    </div>

    <div ref="wrapRef" class="relative">
      <svg
        :viewBox="`0 0 ${width} ${HEIGHT}`"
        :width="width"
        :height="HEIGHT"
        class="block max-w-full"
        role="img"
        :aria-label="summary"
        @pointermove="onMove"
        @pointerleave="hover = null"
      >
        <!-- Lưới & trục: mảnh, lùi về sau -->
        <g>
          <line
            v-for="t in yTicks"
            :key="`g${t}`"
            :x1="M.left"
            :x2="M.left + innerW"
            :y1="y(t)"
            :y2="y(t)"
            stroke="var(--chart-grid)"
            stroke-width="1"
          />
          <text
            v-for="t in yTicks"
            :key="`yt${t}`"
            :x="M.left - 8"
            :y="y(t) + 4"
            text-anchor="end"
            class="chart-tick"
          >{{ t.toFixed(1) }}</text>
          <text
            v-for="(t, i) in xTicks"
            :key="`xt${i}`"
            :x="x(t)"
            :y="HEIGHT - 8"
            :text-anchor="i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'"
            class="chart-tick"
          >{{ fmtDate(t) }}</text>
        </g>

        <!-- Band mục tiêu -->
        <g v-if="targetBand && targetBand >= yDomain[0] && targetBand <= yDomain[1]">
          <line :x1="M.left" :x2="M.left + innerW" :y1="y(targetBand)" :y2="y(targetBand)" stroke="var(--ink-soft)" stroke-width="1.5" />
          <text :x="M.left + 6" :y="y(targetBand) - 6" class="chart-ref">Mục tiêu {{ targetBand.toFixed(1) }}</text>
        </g>

        <!-- Đường & điểm -->
        <g v-for="s in series" :key="s.skill">
          <polyline
            v-if="s.pts.length > 1"
            :points="s.path"
            fill="none"
            :stroke="`var(--chart-${s.skill})`"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
          <circle
            v-for="p in s.pts"
            :key="p.attempt_id"
            :cx="p.px"
            :cy="p.py"
            :r="hover?.attempt_id === p.attempt_id ? 6 : 4"
            :fill="`var(--chart-${s.skill})`"
            stroke="var(--surface)"
            stroke-width="2"
          />
        </g>

        <!-- Nhãn cuối đường: chữ dùng màu chữ, vạch nhỏ mang màu kỹ năng -->
        <g v-for="l in endLabels" :key="`end-${l.skill}`">
          <line :x1="l.x + 8" :x2="l.x + 18" :y1="l.y" :y2="l.y" :stroke="`var(--chart-${l.skill})`" stroke-width="2" />
          <text :x="l.x + 22" :y="l.y + 4" class="chart-end">{{ SKILL_LABELS[l.skill] }} {{ l.band.toFixed(1) }}</text>
        </g>

        <line
          v-if="hover"
          :x1="hover.px"
          :x2="hover.px"
          :y1="M.top"
          :y2="M.top + innerH"
          stroke="var(--ink-soft)"
          stroke-width="1"
        />
      </svg>

      <div
        v-if="hover"
        class="pointer-events-none absolute z-10 w-56 rounded-brut border-2 border-line bg-surface p-2.5 text-xs shadow-brut-sm"
        :style="{
          left: `${Math.min(Math.max(hover.px / width * 100, 0), 100)}%`,
          top: `${hover.py - 12}px`,
          transform: `translate(${hover.px > width * 0.5 ? '-105%' : '12px'}, -100%)`,
        }"
        role="status"
      >
        <div class="flex items-center gap-1.5 font-bold text-ink">
          <span class="h-2.5 w-2.5 rounded-full" :style="{ background: `var(--chart-${hover.skill})` }" aria-hidden="true" />
          {{ SKILL_LABELS[hover.skill] }}: band {{ hover.band.toFixed(1) }}
        </div>
        <p class="mt-1 text-ink-soft line-clamp-2">{{ hover.test_title }}</p>
        <p class="mt-0.5 text-ink-soft">
          {{ new Date(hover.completed_at).toLocaleDateString('vi-VN') }}, {{ hover.mode === 'exam' ? 'Thi thử' : 'Luyện tập' }}
        </p>
      </div>
    </div>

    <details class="group">
      <summary class="inline-flex min-h-[36px] cursor-pointer items-center text-xs font-bold text-ink underline underline-offset-4">
        Xem dạng bảng ({{ points.length }} lượt)
      </summary>
      <div class="mt-2 max-h-64 overflow-auto rounded-brut border-2 border-line">
        <table class="w-full text-left text-xs">
          <thead class="sticky top-0 bg-surface-2 text-ink">
            <tr>
              <th scope="col" class="p-2 font-black">Ngày</th>
              <th scope="col" class="p-2 font-black">Kỹ năng</th>
              <th scope="col" class="p-2 font-black">Đề</th>
              <th scope="col" class="p-2 font-black text-right">Band</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in tableRows" :key="p.attempt_id" class="border-t border-line/20 text-ink">
              <td class="p-2 tabular-nums whitespace-nowrap">{{ new Date(p.completed_at).toLocaleDateString('vi-VN') }}</td>
              <td class="p-2">{{ SKILL_LABELS[p.skill] }}</td>
              <td class="p-2 text-ink-soft">{{ p.test_title }}</td>
              <td class="p-2 text-right font-bold tabular-nums">{{ p.band.toFixed(1) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>
  </div>
</template>

<style scoped>
.chart-tick {
  fill: var(--ink-soft);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  font-family: var(--font-body);
}

.chart-ref {
  fill: var(--ink-soft);
  font-size: 11px;
  font-weight: 700;
  font-family: var(--font-body);
}

.chart-end {
  fill: var(--ink);
  font-size: 12px;
  font-weight: 700;
  font-family: var(--font-body);
}
</style>
