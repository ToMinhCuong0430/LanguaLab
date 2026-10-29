<script setup lang="ts">
import { Plus, Users, Mail, ClipboardList, Activity, ArrowRight, AlertTriangle, RotateCcw, PenLine, Mic } from '@lucide/vue'
import type { ClassSummary, ReviewItem } from '~/composables/useClasses'
import { formatDate } from '~/composables/useClasses'
import { SKILL_LABELS } from '~/composables/useProgress'

definePageMeta({ middleware: 'teacher' })
useHead({ title: 'Lớp học của tôi (Giáo viên) - LanguaLab' })

const { getTeacherOverview, createClass } = useClasses()
const router = useRouter()

const classes = ref<ClassSummary[]>([])
const toReview = ref<ReviewItem[]>([])
const isLoading = ref(true)
const loadError = ref<string | null>(null)

const load = async () => {
  isLoading.value = true
  loadError.value = null
  try {
    const data = await getTeacherOverview()
    classes.value = data.classes
    toReview.value = data.to_review
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    isLoading.value = false
  }
}
onMounted(load)

const activeClasses = computed(() => classes.value.filter((c) => !c.is_archived))
const archivedClasses = computed(() => classes.value.filter((c) => c.is_archived))
const totalStudents = computed(() => activeClasses.value.reduce((n, c) => n + c.member_count, 0))

// Tạo lớp
const showCreate = ref(false)
const newName = ref('')
const newDesc = ref('')
const createError = ref<string | null>(null)
const isCreating = ref(false)
const submitCreate = async () => {
  createError.value = null
  if (newName.value.trim().length < 2) {
    createError.value = 'Tên lớp cần ít nhất 2 ký tự.'
    return
  }
  isCreating.value = true
  try {
    const id = await createClass(newName.value.trim(), newDesc.value.trim() || undefined)
    await router.push(`/giao-vien/lop/${id}`)
  } catch (e: any) {
    createError.value = e.message
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
    <header class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div class="space-y-1">
        <h1 class="text-3xl sm:text-4xl font-black text-ink">Lớp học của tôi</h1>
        <p class="text-sm text-ink-soft">
          <template v-if="!isLoading && !loadError">
            {{ activeClasses.length }} lớp đang mở, {{ totalStudents }} học viên.
          </template>
          <template v-else>Quản lý lớp, giao bài và theo dõi tiến độ học viên.</template>
        </p>
      </div>
      <BaseButton variant="primary" size="md" @click="showCreate = !showCreate">
        <Plus class="h-4 w-4" :stroke-width="2.5" />
        <span>Tạo lớp mới</span>
      </BaseButton>
    </header>

    <!-- Tạo lớp -->
    <form
      v-if="showCreate"
      class="rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut space-y-4"
      @submit.prevent="submitCreate"
    >
      <h2 class="text-lg font-black text-ink">Lớp mới</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="block">
          <span class="mb-1 block text-xs font-black text-ink">Tên lớp <span class="text-bad">*</span></span>
          <input
            v-model="newName"
            type="text"
            maxlength="80"
            placeholder="vd. IELTS 6.5 tối thứ 3 - 5"
            class="w-full min-h-[44px] rounded-brut border-2 border-line bg-surface px-3 text-sm text-ink"
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-black text-ink">Mô tả</span>
          <input
            v-model="newDesc"
            type="text"
            maxlength="500"
            placeholder="Mục tiêu, lịch học..."
            class="w-full min-h-[44px] rounded-brut border-2 border-line bg-surface px-3 text-sm text-ink"
          />
        </label>
      </div>
      <p v-if="createError" class="rounded-brut border-2 border-bad bg-bad/10 p-2 text-xs font-bold text-bad" role="alert">{{ createError }}</p>
      <div class="flex gap-3">
        <BaseButton type="submit" variant="primary" size="md" :disabled="isCreating">
          <span>{{ isCreating ? 'Đang tạo...' : 'Tạo lớp' }}</span>
        </BaseButton>
        <button type="button" class="min-h-[44px] px-2 text-sm font-bold text-ink underline cursor-pointer" @click="showCreate = false">Huỷ</button>
      </div>
    </form>

    <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true" aria-label="Đang tải lớp học">
      <BaseSkeleton v-for="i in 3" :key="i" class="h-48 rounded-brut-lg" />
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
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Danh sách lớp -->
        <section class="lg:col-span-8 space-y-4" aria-label="Danh sách lớp">
          <p v-if="!activeClasses.length" class="rounded-brut-lg border-[3px] border-line bg-surface p-8 text-center text-sm text-ink-soft shadow-brut">
            Chưa có lớp nào. Bấm "Tạo lớp mới" để bắt đầu, sau đó chia sẻ mã lớp cho học viên.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <NuxtLink
              v-for="c in activeClasses"
              :key="c.id"
              :to="`/giao-vien/lop/${c.id}`"
              class="group flex flex-col gap-4 rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut brut-press"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h2 class="text-lg font-black text-ink">{{ c.name }}</h2>
                  <p v-if="c.description" class="mt-0.5 line-clamp-2 text-xs text-ink-soft">{{ c.description }}</p>
                </div>
                <span class="flex-shrink-0 rounded-brut border-2 border-line bg-warn px-2 py-1 font-display text-sm font-black tracking-[0.15em] text-on-tone" :aria-label="`Mã lớp ${c.join_code}`">
                  {{ c.join_code }}
                </span>
              </div>
              <dl class="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                <div class="flex items-center gap-1.5 text-ink-soft">
                  <Users class="h-3.5 w-3.5" aria-hidden="true" /><dt class="sr-only">Học viên</dt>
                  <dd><strong class="text-ink tabular-nums">{{ c.member_count }}</strong> học viên</dd>
                </div>
                <div class="flex items-center gap-1.5 text-ink-soft">
                  <Activity class="h-3.5 w-3.5" aria-hidden="true" /><dt class="sr-only">Hoạt động 7 ngày</dt>
                  <dd><strong class="text-ink tabular-nums">{{ c.active_7d }}</strong> hoạt động 7 ngày</dd>
                </div>
                <div class="flex items-center gap-1.5 text-ink-soft">
                  <ClipboardList class="h-3.5 w-3.5" aria-hidden="true" /><dt class="sr-only">Bài đã giao</dt>
                  <dd><strong class="text-ink tabular-nums">{{ c.assignment_count }}</strong> bài đã giao</dd>
                </div>
                <div class="flex items-center gap-1.5 text-ink-soft">
                  <Mail class="h-3.5 w-3.5" aria-hidden="true" /><dt class="sr-only">Lời mời đang chờ</dt>
                  <dd><strong class="text-ink tabular-nums">{{ c.pending_invites }}</strong> lời mời chờ</dd>
                </div>
              </dl>
              <span class="mt-auto inline-flex items-center gap-1 text-sm font-bold text-ink">
                Mở lớp <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" :stroke-width="2.5" aria-hidden="true" />
              </span>
            </NuxtLink>
          </div>

          <details v-if="archivedClasses.length" class="rounded-brut border-2 border-line/50 bg-surface-2">
            <summary class="flex min-h-[44px] cursor-pointer items-center px-4 text-sm font-bold text-ink">
              Lớp đã lưu trữ ({{ archivedClasses.length }})
            </summary>
            <ul class="space-y-1 px-4 pb-3" role="list">
              <li v-for="c in archivedClasses" :key="c.id">
                <NuxtLink :to="`/giao-vien/lop/${c.id}`" class="text-sm text-ink underline underline-offset-2">{{ c.name }}</NuxtLink>
                <span class="text-xs text-ink-soft"> ({{ c.member_count }} học viên)</span>
              </li>
            </ul>
          </details>
        </section>

        <!-- Bài cần nhận xét -->
        <section class="lg:col-span-4 rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut space-y-3">
          <div>
            <h2 class="text-lg font-black text-ink">Bài cần nhận xét</h2>
            <p class="text-xs text-ink-soft">Writing và Speaking trong 30 ngày, bạn chưa nhận xét.</p>
          </div>
          <p v-if="!toReview.length" class="rounded-brut border-2 border-line/40 p-3 text-sm text-ink-soft">Không có bài nào đang chờ.</p>
          <ul v-else class="space-y-2" role="list">
            <li v-for="r in toReview" :key="r.attempt_id">
              <NuxtLink
                :to="`/giao-vien/hoc-vien/${r.student_id}#attempt-${r.attempt_id}`"
                class="flex items-start gap-3 rounded-brut border-2 border-line p-3 hover:bg-surface-2"
              >
                <component :is="r.skill === 'writing' ? PenLine : Mic" class="mt-0.5 h-4 w-4 flex-shrink-0 text-ink" :stroke-width="2.5" aria-hidden="true" />
                <span class="min-w-0 flex-1">
                  <span class="block text-sm font-bold text-ink">{{ r.student_name || 'Học viên' }}</span>
                  <span class="block truncate text-[11px] text-ink-soft">{{ SKILL_LABELS[r.skill] }}: {{ r.test_title }}</span>
                  <span class="block text-[11px] text-ink-soft">{{ r.class_name }}, {{ formatDate(r.completed_at) }}</span>
                </span>
                <span class="font-display text-sm font-black text-ink tabular-nums">{{ r.band != null ? Number(r.band).toFixed(1) : 'Chưa chấm' }}</span>
              </NuxtLink>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>
