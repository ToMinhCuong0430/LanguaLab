<script setup lang="ts">
import { ArrowLeft, Play, Square, Headphones, BookOpen, PenLine, Mic, Route, RotateCcw, AlertTriangle, LogIn, Check } from '@lucide/vue'
import type { DiagnosticGroup, DiagnosticResult, IeltsSkillKey } from '~/composables/useProgress'
import { SKILL_LABELS, SKILL_ORDER } from '~/composables/useProgress'

useHead({ title: 'Kiểm tra đầu vào - LanguaLab' })

const router = useRouter()
const { unavailableReason, fetchDiagnosticQuestions, submitDiagnostic, createPlan } = useProgress()

type Step = 'setup' | 'test' | 'result'
const step = ref<Step>('setup')

const SKILL_META: Record<IeltsSkillKey, { icon: any; desc: string }> = {
  listening: { icon: Headphones, desc: 'Nghe 1 đoạn hội thoại, trả lời tối đa 6 câu.' },
  reading: { icon: BookOpen, desc: 'Đọc 1 bài, trả lời tối đa 6 câu.' },
  writing: { icon: PenLine, desc: 'Tự đánh giá 4 tiêu chí Writing.' },
  speaking: { icon: Mic, desc: 'Tự đánh giá 4 tiêu chí Speaking.' },
}

const selected = ref<IeltsSkillKey[]>([...SKILL_ORDER])
const toggleSkill = (s: IeltsSkillKey) => {
  selected.value = selected.value.includes(s) ? selected.value.filter((x) => x !== s) : SKILL_ORDER.filter((x) => x === s || selected.value.includes(x))
}

// ── Bài làm ──
const groups = ref<DiagnosticGroup[]>([])
const answers = ref<Record<string, string>>({})
const isLoading = ref(false)
const error = ref<string | null>(null)

const SELF_ITEMS: Record<'writing' | 'speaking', string[]> = {
  writing: [
    'Tôi viết được bài 250 từ trong 40 phút với mở bài, thân bài, kết bài rõ ràng.',
    'Tôi trả lời đúng và đủ mọi ý mà đề bài yêu cầu.',
    'Tôi dùng được câu phức và từ nối đa dạng mà ít mắc lỗi ngữ pháp.',
    'Tôi dùng từ vựng theo chủ đề chính xác, ít lặp từ.',
  ],
  speaking: [
    'Tôi nói liên tục 2 phút về một chủ đề quen thuộc mà ít ngập ngừng.',
    'Tôi trả lời được câu hỏi trừu tượng ở Part 3 kèm lý do và ví dụ.',
    'Người nghe hiểu tôi nói mà không cần hỏi lại.',
    'Tôi dùng được cách diễn đạt tự nhiên thay vì dịch từng từ.',
  ],
}
const SCALE = ['Chưa làm được', 'Còn khó', 'Khá ổn', 'Tự tin']
const ratings = ref<Record<'writing' | 'speaking', (number | null)[]>>({
  writing: [null, null, null, null],
  speaking: [null, null, null, null],
})

const objectiveSkills = computed(() => selected.value.filter((s) => s === 'reading' || s === 'listening'))
const selfSkills = computed(() => selected.value.filter((s): s is 'writing' | 'speaking' => s === 'writing' || s === 'speaking'))
const missingObjective = computed(() => objectiveSkills.value.filter((s) => !groups.value.some((g) => g.skill === s)))
const orderedGroups = computed(() => [...groups.value].sort((a, b) => SKILL_ORDER.indexOf(a.skill) - SKILL_ORDER.indexOf(b.skill)))

const totalQuestions = computed(() => groups.value.reduce((n, g) => n + g.questions.length, 0))
const answeredCount = computed(() => Object.values(answers.value).filter((v) => v?.trim()).length)
const unratedCount = computed(() => selfSkills.value.reduce((n, s) => n + ratings.value[s].filter((r) => r === null).length, 0))

const start = async () => {
  if (!selected.value.length) return
  error.value = null
  isLoading.value = true
  try {
    groups.value = objectiveSkills.value.length ? await fetchDiagnosticQuestions(objectiveSkills.value, 6) : []
    answers.value = {}
    step.value = 'test'
    if (import.meta.client) window.scrollTo({ top: 0 })
  } catch (e: any) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}

// ── Nghe: phát file audio nếu có, nếu không đọc transcript bằng giọng đọc của trình duyệt ──
const MAX_PLAYS = 2
const playCounts = ref<Record<string, number>>({})
const playingId = ref<string | null>(null)
const ttsSupported = ref(true)
const showScript = ref<Record<string, boolean>>({})
let audioEl: HTMLAudioElement | null = null

onMounted(() => {
  ttsSupported.value = 'speechSynthesis' in window
})

const stopAudio = () => {
  if (import.meta.client) window.speechSynthesis?.cancel()
  audioEl?.pause()
  playingId.value = null
}
onUnmounted(stopAudio)

const playListening = (g: DiagnosticGroup) => {
  if (playingId.value === g.test_id) return stopAudio()
  stopAudio()
  if ((playCounts.value[g.test_id] || 0) >= MAX_PLAYS) return
  playCounts.value[g.test_id] = (playCounts.value[g.test_id] || 0) + 1
  playingId.value = g.test_id

  if (g.audio_url) {
    audioEl = new Audio(g.audio_url)
    audioEl.onended = () => { playingId.value = null }
    audioEl.play().catch(() => { playingId.value = null })
    return
  }
  // Bỏ nhãn người nói ("OFFICER:") để giọng đọc tự nhiên
  const text = (g.audio_script || '').replace(/^[A-Z][A-Z\s]{1,20}:\s*/gm, '')
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-GB'
  u.rate = 0.92
  u.onend = () => { playingId.value = null }
  u.onerror = () => { playingId.value = null }
  window.speechSynthesis.speak(u)
}

const paragraphsOf = (text: string | null) => (text || '').split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean)

// ── Nộp bài ──
const result = ref<DiagnosticResult | null>(null)
const isSubmitting = ref(false)

const submit = async () => {
  error.value = null
  if (unratedCount.value > 0) {
    error.value = `Còn ${unratedCount.value} câu tự đánh giá chưa chọn mức.`
    return
  }
  stopAudio()
  isSubmitting.value = true
  try {
    const payload = groups.value.flatMap((g) => g.questions.map((q) => ({ question_id: q.id, user_answer: answers.value[q.id] || '' })))
    const self: Partial<Record<'writing' | 'speaking', number[]>> = {}
    for (const s of selfSkills.value) self[s] = ratings.value[s] as number[]
    result.value = await submitDiagnostic(selected.value, payload, self)
    step.value = 'result'
    if (import.meta.client) window.scrollTo({ top: 0 })
  } catch (e: any) {
    error.value = e.message
  } finally {
    isSubmitting.value = false
  }
}

// ── Kết quả → lộ trình ──
const DURATIONS = [7, 14, 30] as const
const duration = ref<7 | 14 | 30>(14)
const isCreating = ref(false)
const weakCategories = computed(() => (result.value?.results.categories || []).filter((c) => c.accuracy < 0.7))

const makePlan = async () => {
  if (!result.value) return
  isCreating.value = true
  error.value = null
  try {
    await createPlan(duration.value, result.value.id)
    await router.push('/tien-do/lo-trinh')
  } catch (e: any) {
    error.value = e.message
  } finally {
    isCreating.value = false
  }
}

const restart = () => {
  result.value = null
  groups.value = []
  answers.value = {}
  ratings.value = { writing: [null, null, null, null], speaking: [null, null, null, null] }
  playCounts.value = {}
  step.value = 'setup'
}
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

    <!-- BƯỚC 1: Chọn kỹ năng -->
    <section v-else-if="step === 'setup'" class="rounded-brut-lg border-[3px] border-line bg-surface p-6 shadow-brut space-y-5">
      <div class="space-y-1">
        <h1 class="text-2xl sm:text-3xl font-black text-ink">Kiểm tra đầu vào</h1>
        <p class="text-sm text-ink-soft max-w-[62ch]">
          Khoảng 15 phút. Reading và Listening được chấm tự động; Writing và Speaking là phần tự đánh giá
          để ước lượng band. Kết quả dùng để gợi ý lộ trình 7, 14 hoặc 30 ngày.
        </p>
      </div>

      <fieldset>
        <legend class="mb-2 text-sm font-black text-ink">Chọn kỹ năng muốn kiểm tra</legend>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            v-for="s in SKILL_ORDER"
            :key="s"
            class="flex cursor-pointer items-start gap-3 rounded-brut border-2 p-3 transition-colors"
            :class="selected.includes(s) ? 'border-line bg-surface-2 shadow-brut-sm' : 'border-line/40 bg-surface hover:border-line'"
          >
            <input type="checkbox" class="sr-only" :checked="selected.includes(s)" @change="toggleSkill(s)" />
            <span
              class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 border-line"
              :class="selected.includes(s) ? 'bg-ok text-on-tone' : 'bg-surface'"
              aria-hidden="true"
            >
              <Check v-if="selected.includes(s)" class="h-4 w-4" :stroke-width="3" />
            </span>
            <component :is="SKILL_META[s].icon" class="mt-0.5 h-5 w-5 flex-shrink-0 text-ink" :stroke-width="2.5" aria-hidden="true" />
            <span>
              <span class="block text-sm font-black text-ink">{{ SKILL_LABELS[s] }}</span>
              <span class="block text-xs text-ink-soft">{{ SKILL_META[s].desc }}</span>
            </span>
          </label>
        </div>
      </fieldset>

      <p v-if="error" class="rounded-brut border-2 border-bad bg-bad/10 p-2 text-xs font-bold text-bad" role="alert">{{ error }}</p>

      <BaseButton variant="primary" size="md" :disabled="!selected.length || isLoading" @click="start">
        <span>{{ isLoading ? 'Đang tải câu hỏi...' : `Bắt đầu (${selected.length} kỹ năng)` }}</span>
      </BaseButton>
    </section>

    <!-- BƯỚC 2: Làm bài -->
    <template v-else-if="step === 'test'">
      <div class="sticky top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-brut-lg border-[3px] border-line bg-surface px-4 py-3 shadow-brut">
        <p class="text-sm font-black text-ink">Kiểm tra đầu vào</p>
        <p class="text-xs font-bold text-ink-soft tabular-nums" aria-live="polite">
          <template v-if="totalQuestions">Đã trả lời {{ answeredCount }}/{{ totalQuestions }} câu</template>
          <template v-if="totalQuestions && selfSkills.length">, </template>
          <template v-if="selfSkills.length">còn {{ unratedCount }} mục tự đánh giá</template>
        </p>
      </div>

      <p
        v-if="missingObjective.length"
        class="flex items-start gap-2 rounded-brut border-2 border-line bg-surface-2 p-3 text-xs font-bold text-ink"
      >
        <AlertTriangle class="h-4 w-4 flex-shrink-0 text-warn" aria-hidden="true" />
        Chưa có đề {{ missingObjective.map((s) => SKILL_LABELS[s]).join(' và ') }} được xuất bản để làm bài kiểm tra; phần này sẽ được bỏ qua.
      </p>

      <!-- Reading / Listening -->
      <section
        v-for="g in orderedGroups"
        :key="g.test_id"
        class="rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut space-y-4"
      >
        <header class="flex items-center gap-2 border-b-2 border-line pb-3">
          <component :is="SKILL_META[g.skill].icon" class="h-5 w-5 text-ink" :stroke-width="2.5" aria-hidden="true" />
          <h2 class="text-lg font-black text-ink">{{ SKILL_LABELS[g.skill] }}</h2>
          <span class="text-xs text-ink-soft">{{ g.questions.length }} câu</span>
        </header>

        <!-- Listening: phát audio / đọc transcript -->
        <div v-if="g.skill === 'listening'" class="space-y-2">
          <div class="flex flex-wrap items-center gap-3">
            <button
              v-if="g.audio_url || ttsSupported"
              type="button"
              class="inline-flex min-h-[44px] items-center gap-2 rounded-brut border-2 border-line bg-warn px-4 font-display text-sm font-black text-on-tone shadow-brut-sm brut-press cursor-pointer disabled:opacity-50"
              :disabled="playingId !== g.test_id && (playCounts[g.test_id] || 0) >= MAX_PLAYS"
              @click="playListening(g)"
            >
              <Square v-if="playingId === g.test_id" class="h-4 w-4 fill-current" :stroke-width="2.5" aria-hidden="true" />
              <Play v-else class="h-4 w-4 fill-current" :stroke-width="2.5" aria-hidden="true" />
              {{ playingId === g.test_id ? 'Dừng' : 'Nghe đoạn hội thoại' }}
            </button>
            <span class="text-xs font-bold text-ink-soft">Đã nghe {{ playCounts[g.test_id] || 0 }}/{{ MAX_PLAYS }} lần</span>
          </div>
          <p class="text-[11px] text-ink-soft">
            <template v-if="g.audio_url">Phát file audio của đề.</template>
            <template v-else-if="ttsSupported">Đề này chưa có file audio; đoạn hội thoại được đọc bằng giọng đọc của trình duyệt.</template>
            <template v-else>
              Trình duyệt không đọc được văn bản thành giọng nói.
              <button type="button" class="font-bold underline cursor-pointer" @click="showScript[g.test_id] = !showScript[g.test_id]">
                {{ showScript[g.test_id] ? 'Ẩn transcript' : 'Xem transcript' }}
              </button>
              (kết quả Listening khi đó chỉ mang tính tham khảo).
            </template>
          </p>
          <p v-if="showScript[g.test_id]" class="whitespace-pre-line rounded-brut border-2 border-line bg-surface-2 p-3 text-sm text-ink">{{ g.audio_script }}</p>
        </div>

        <!-- Reading: bài đọc -->
        <details v-else class="group rounded-brut border-2 border-line bg-surface-2" open>
          <summary class="flex min-h-[44px] cursor-pointer items-center px-3 text-sm font-black text-ink">
            {{ g.passage_title || g.title }}
          </summary>
          <div class="max-h-80 space-y-3 overflow-y-auto border-t-2 border-line/30 px-3 py-3 text-sm leading-7 text-ink max-w-[72ch]">
            <p v-for="(p, i) in paragraphsOf(g.passage_content)" :key="i">{{ p }}</p>
          </div>
        </details>

        <ol class="space-y-4" role="list">
          <li v-for="q in g.questions" :key="q.id" class="space-y-2">
            <p class="text-sm font-bold text-ink">
              <span class="tabular-nums">{{ q.number }}.</span> {{ q.text }}
            </p>
            <div v-if="q.options?.length" class="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" :aria-label="`Câu ${q.number}`">
              <label
                v-for="o in q.options"
                :key="o.id"
                class="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-brut border-2 px-3 text-sm transition-colors"
                :class="answers[q.id] === o.id ? 'border-line bg-accent text-accent-ink shadow-brut-sm' : 'border-line/40 bg-surface text-ink hover:border-line'"
              >
                <input v-model="answers[q.id]" type="radio" :name="`q-${q.id}`" :value="o.id" class="accent-accent" />
                <span><strong>{{ o.id }}.</strong> {{ o.text }}</span>
              </label>
            </div>
            <input
              v-else
              v-model="answers[q.id]"
              type="text"
              :aria-label="`Câu trả lời câu ${q.number}`"
              placeholder="Nhập câu trả lời..."
              class="w-full max-w-sm min-h-[44px] rounded-brut border-2 border-line bg-surface-2 px-3 text-sm font-bold text-ink outline-none focus:bg-surface focus:shadow-brut-sm"
            />
          </li>
        </ol>
      </section>

      <!-- Writing / Speaking: tự đánh giá -->
      <section
        v-for="s in selfSkills"
        :key="s"
        class="rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut space-y-4"
      >
        <header class="flex items-center gap-2 border-b-2 border-line pb-3">
          <component :is="SKILL_META[s].icon" class="h-5 w-5 text-ink" :stroke-width="2.5" aria-hidden="true" />
          <h2 class="text-lg font-black text-ink">{{ SKILL_LABELS[s] }}: tự đánh giá</h2>
        </header>
        <fieldset v-for="(statement, i) in SELF_ITEMS[s]" :key="i" class="space-y-2">
          <legend class="text-sm font-bold text-ink">{{ statement }}</legend>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <label
              v-for="(label, v) in SCALE"
              :key="v"
              class="flex min-h-[44px] cursor-pointer items-center justify-center rounded-brut border-2 px-2 text-center text-xs font-bold transition-colors"
              :class="ratings[s][i] === v + 1 ? 'border-line bg-accent text-accent-ink shadow-brut-sm' : 'border-line/40 bg-surface text-ink hover:border-line'"
            >
              <input v-model="ratings[s][i]" type="radio" :name="`${s}-${i}`" :value="v + 1" class="sr-only" />
              {{ label }}
            </label>
          </div>
        </fieldset>
      </section>

      <p v-if="error" class="rounded-brut border-2 border-bad bg-bad/10 p-2 text-xs font-bold text-bad" role="alert">{{ error }}</p>

      <div class="flex flex-wrap items-center gap-3">
        <BaseButton variant="primary" size="md" :disabled="isSubmitting" @click="submit">
          <span>{{ isSubmitting ? 'Đang chấm...' : 'Nộp bài kiểm tra' }}</span>
        </BaseButton>
        <button type="button" class="min-h-[44px] px-2 text-sm font-bold text-ink underline cursor-pointer" @click="restart">Chọn lại kỹ năng</button>
      </div>
    </template>

    <!-- BƯỚC 3: Kết quả + chọn lộ trình -->
    <template v-else-if="step === 'result' && result">
      <section class="rounded-brut-lg border-[3px] border-line bg-surface p-6 shadow-brut space-y-5">
        <h1 class="text-2xl sm:text-3xl font-black text-ink">Kết quả kiểm tra đầu vào</h1>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <article
            v-for="s in SKILL_ORDER.filter((k) => result!.results.skills[k])"
            :key="s"
            class="relative overflow-hidden rounded-brut border-2 border-line bg-surface-2 p-3"
          >
            <span class="absolute inset-x-0 top-0 h-1.5" :style="{ background: `var(--chart-${s})` }" aria-hidden="true" />
            <p class="pt-1 text-xs font-black text-ink">{{ SKILL_LABELS[s] }}</p>
            <p class="font-display text-3xl font-black text-ink">{{ Number(result.results.skills[s]!.band).toFixed(1) }}</p>
            <p class="text-[11px] text-ink-soft">
              <template v-if="result.results.skills[s]!.source === 'test'">
                Đúng {{ result.results.skills[s]!.correct }}/{{ result.results.skills[s]!.total }} câu
              </template>
              <template v-else>Ước lượng từ tự đánh giá</template>
            </p>
          </article>
        </div>

        <div v-if="result.results.categories.length" class="space-y-2">
          <h2 class="text-sm font-black text-ink">Theo dạng bài</h2>
          <ul class="space-y-1.5" role="list">
            <li v-for="c in result.results.categories" :key="`${c.skill}:${c.category}`" class="flex items-center justify-between gap-3 text-sm">
              <span class="text-ink">{{ c.category }} <span class="text-xs text-ink-soft">({{ SKILL_LABELS[c.skill] }})</span></span>
              <span class="flex items-center gap-2 font-bold tabular-nums text-ink">
                <AlertTriangle v-if="c.accuracy < 0.7" class="h-3.5 w-3.5 text-bad" :stroke-width="2.5" aria-label="Cần luyện" />
                {{ c.correct }}/{{ c.total }}
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section class="rounded-brut-lg border-[3px] border-line bg-surface p-6 shadow-brut space-y-4">
        <div class="space-y-1">
          <h2 class="text-xl font-black text-ink">Chọn lộ trình gợi ý</h2>
          <p class="text-sm text-ink-soft max-w-[62ch]">
            <template v-if="weakCategories.length">
              Lộ trình ưu tiên {{ weakCategories.map((c) => c.category).join(', ') }} và kỹ năng có band thấp nhất.
            </template>
            <template v-else>Bạn làm tốt các dạng bài trong bài kiểm tra; lộ trình sẽ cân bằng giữa các kỹ năng có band thấp hơn.</template>
          </p>
        </div>
        <fieldset>
          <legend class="sr-only">Thời lượng lộ trình</legend>
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
        </fieldset>
        <p v-if="error" class="rounded-brut border-2 border-bad bg-bad/10 p-2 text-xs font-bold text-bad" role="alert">{{ error }}</p>
        <div class="flex flex-wrap items-center gap-3">
          <BaseButton variant="primary" size="md" :disabled="isCreating" @click="makePlan">
            <Route class="h-4 w-4" :stroke-width="2.5" />
            <span>{{ isCreating ? 'Đang tạo...' : `Tạo lộ trình ${duration} ngày` }}</span>
          </BaseButton>
          <BaseButton variant="secondary" size="md" @click="restart">
            <RotateCcw class="h-4 w-4" :stroke-width="2.5" />
            <span>Làm lại</span>
          </BaseButton>
        </div>
      </section>
    </template>
  </div>
</template>
