<script setup lang="ts">
// Biểu đồ cột một chuỗi theo ngày (không chú thích: tiêu đề thẻ đã gọi tên chuỗi).
// Theo dataviz: cột mảnh bo 4px phía trên, khe 2px, lưới nhạt, nhãn trục thưa,
// tooltip khi rê/focus từng cột, có bảng dữ liệu thay thế.
const props = defineProps<{
  points: { date: string; value: number }[]
  color: string // CSS var, ví dụ var(--chart-listening)
  unit: string // "người dùng mới"
}>()

const HEIGHT = 200
const M = { top: 12, right: 8, bottom: 26, left: 32 }

const wrapRef = ref<HTMLElement | null>(null)
const width = ref(600)
let ro: ResizeObserver | null = null
onMounted(() => {
  if (!wrapRef.value) return
  ro = new ResizeObserver(([entry]) => {
    width.value = Math.max(280, Math.floor(entry!.contentRect.width))
  })
  ro.observe(wrapRef.value)
})
onUnmounted(() => ro?.disconnect())

const showTable = ref(false)
const active = ref<number | null>(null)

const innerW = computed(() => width.value - M.left - M.right)
const innerH = HEIGHT - M.top - M.bottom
const maxVal = computed(() => {
  const m = Math.max(0, ...props.points.map((p) => p.value))
  // Trục nguyên, tối thiểu 4 để vài người dùng không vẽ thành cột kịch trần
  return Math.max(4, Math.ceil(m / 4) * 4)
})
const yTicks = computed(() => [0, 1, 2, 3, 4].map((i) => (maxVal.value / 4) * i))
const slot = computed(() => innerW.value / Math.max(1, props.points.length))
const barW = computed(() => Math.max(2, Math.min(28, slot.value - 2)))
const barX = (i: number) => M.left + i * slot.value + (slot.value - barW.value) / 2
const barH = (v: number) => (v / maxVal.value) * innerH
const y = (v: number) => M.top + innerH - barH(v)

const fmtDay = (d: string) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
const xLabels = computed(() => {
  const n = props.points.length
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW.value / 70))))
  const kept = props.points.map((p, i) => ({ i, label: fmtDay(p.date) })).filter(({ i }) => i % every === 0)
  // Luôn giữ ngày cuối; bỏ nhãn đứng ngay trước nếu quá sát để không chồng chữ
  const last = kept[kept.length - 1]
  if (n > 0 && last?.i !== n - 1) {
    if (last && n - 1 - last.i < every * 0.75) kept.pop()
    kept.push({ i: n - 1, label: fmtDay(props.points[n - 1]!.date) })
  }
  return kept
})

// Cột có giá trị 0 vẫn có vùng hover cao bằng toàn khung
const barPath = (i: number, v: number) => {
  const h = barH(v)
  if (h <= 0) return ''
  const x0 = barX(i)
  const r = Math.min(4, barW.value / 2, h)
  const yTop = y(v)
  const yBase = M.top + innerH
  return `M${x0},${yBase} V${yTop + r} Q${x0},${yTop} ${x0 + r},${yTop} H${x0 + barW.value - r} Q${x0 + barW.value},${yTop} ${x0 + barW.value},${yTop + r} V${yBase} Z`
}

const tooltip = computed(() => {
  if (active.value === null) return null
  const p = props.points[active.value]
  if (!p) return null
  const left = Math.min(Math.max(barX(active.value) + barW.value / 2, 70), width.value - 70)
  return { left, top: Math.max(0, y(p.value) - 8), p }
})
const total = computed(() => props.points.reduce((s, p) => s + p.value, 0))
</script>

<template>
  <div>
    <div class="mb-2 flex items-center justify-end">
      <button
        type="button"
        class="min-h-[44px] px-2 text-xs font-bold text-ink-soft underline hover:text-ink cursor-pointer"
        :aria-pressed="showTable"
        @click="showTable = !showTable"
      >
        {{ showTable ? 'Xem biểu đồ' : 'Xem bảng số liệu' }}
      </button>
    </div>

    <div v-show="!showTable" ref="wrapRef" class="relative">
      <svg
        :width="width"
        :height="HEIGHT"
        role="img"
        :aria-label="`Biểu đồ cột ${unit} theo ngày, tổng ${total}`"
        class="block max-w-full"
        @mouseleave="active = null"
      >
        <g>
          <line
            v-for="t in yTicks"
            :key="t"
            :x1="M.left" :x2="width - M.right" :y1="y(t)" :y2="y(t)"
            stroke="var(--chart-grid)" stroke-width="1"
          />
          <text
            v-for="t in yTicks"
            :key="`l${t}`"
            :x="M.left - 6" :y="y(t) + 4" text-anchor="end"
            class="fill-[var(--ink-soft)] text-[10px] tabular-nums"
          >{{ t }}</text>
        </g>
        <g>
          <g v-for="(p, i) in points" :key="p.date">
            <path :d="barPath(i, p.value)" :fill="color" :opacity="active === null || active === i ? 1 : 0.45" />
            <rect
              :x="M.left + i * slot" :y="M.top" :width="slot" :height="innerH"
              fill="transparent" tabindex="0"
              :aria-label="`${fmtDay(p.date)}: ${p.value} ${unit}`"
              class="cursor-default focus:outline-none"
              @mouseenter="active = i" @focus="active = i" @blur="active = null"
            />
          </g>
        </g>
        <line :x1="M.left" :x2="width - M.right" :y1="M.top + innerH" :y2="M.top + innerH" stroke="var(--ink-soft)" stroke-width="1" />
        <text
          v-for="l in xLabels"
          :key="l.i"
          :x="barX(l.i) + barW / 2" :y="HEIGHT - 8" text-anchor="middle"
          class="fill-[var(--ink-soft)] text-[10px] tabular-nums"
        >{{ l.label }}</text>
      </svg>

      <div
        v-if="tooltip"
        class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-brut border-2 border-line bg-surface px-2.5 py-1.5 text-xs text-ink shadow-brut-sm"
        :style="{ left: `${tooltip.left}px`, top: `${tooltip.top}px` }"
      >
        <p class="font-bold">{{ new Date(tooltip.p.date).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }) }}</p>
        <p class="tabular-nums"><span class="font-black">{{ tooltip.p.value }}</span> {{ unit }}</p>
      </div>
    </div>

    <div v-if="showTable" class="max-h-[240px] overflow-y-auto rounded-brut border-2 border-line">
      <table class="w-full text-left text-xs text-ink">
        <thead class="sticky top-0 bg-surface-2">
          <tr>
            <th scope="col" class="p-2 font-black">Ngày</th>
            <th scope="col" class="p-2 text-right font-black">{{ unit }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in [...points].reverse()" :key="p.date" class="border-t border-line/20">
            <td class="p-2 tabular-nums">{{ new Date(p.date).toLocaleDateString('vi-VN') }}</td>
            <td class="p-2 text-right font-bold tabular-nums">{{ p.value }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
