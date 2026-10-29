<script setup lang="ts">
import { LogIn, AlertTriangle, RotateCcw, Check, X, Clock, ArrowUpRight, MessageSquare, School, LogOut } from '@lucide/vue'
import type { MyClasses } from '~/composables/useClasses'
import { formatDate } from '~/composables/useClasses'
import { SKILL_LABELS } from '~/composables/useProgress'

useHead({ title: 'Lớp của tôi - LanguaLab' })

const route = useRoute()
const user = useSupabaseUser()
const config = useRuntimeConfig()
const api = useClasses()

const unavailable = computed(() => {
  if (config.public.useMock === true || config.public.useMock === 'true') return 'Ứng dụng đang chạy với dữ liệu mẫu nên chưa dùng được lớp học.'
  if (!user.value) return 'Đăng nhập để xem lớp học và bài được giao.'
  return null
})

const data = ref<MyClasses | null>(null)
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const notice = ref<{ kind: 'ok' | 'error'; text: string } | null>(
  route.query.auth_error === 'forbidden_teacher' ? { kind: 'error', text: 'Trang đó chỉ dành cho giáo viên.' } : null,
)

const load = async () => {
  if (unavailable.value) {
    isLoading.value = false
    return
  }
  loadError.value = null
  try {
    data.value = await api.getMyClasses()
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    isLoading.value = false
  }
}
onMounted(load)

const act = async (fn: () => Promise<unknown>, okText: string) => {
  notice.value = null
  try {
    await fn()
    notice.value = { kind: 'ok', text: okText }
    await load()
  } catch (e: any) {
    notice.value = { kind: 'error', text: e.message }
  }
}

const code = ref('')
const isJoining = ref(false)
const join = async () => {
  const c = code.value.trim().toUpperCase()
  if (!/^[A-Z0-9]{6}$/.test(c)) {
    notice.value = { kind: 'error', text: 'Mã lớp gồm 6 chữ cái hoặc số.' }
    return
  }
  isJoining.value = true
  notice.value = null
  try {
    const res = await api.joinClass(c)
    notice.value = { kind: 'ok', text: `Đã tham gia lớp "${res.name}".` }
    code.value = ''
    await load()
  } catch (e: any) {
    notice.value = { kind: 'error', text: e.message }
  } finally {
    isJoining.value = false
  }
}

const leave = (id: string, name: string) => {
  if (!confirm(`Rời lớp "${name}"? Giáo viên sẽ không xem được tiến độ của bạn qua lớp này nữa.`)) return
  act(() => api.leaveClass(id), `Đã rời lớp "${name}".`)
}

const pendingAssignments = computed(() => (data.value?.assignments || []).filter((a) => !a.status.done))
const doneAssignments = computed(() => (data.value?.assignments || []).filter((a) => a.status.done))
const isOverdue = (due: string | null) => Boolean(due && new Date(due) < new Date())
const dueLabel = (due: string | null) => {
  if (!due) return 'Không có hạn'
  const days = Math.ceil((+new Date(due) - Date.now()) / 86_400_000)
  if (days < 0) return `Quá hạn từ ${formatDate(due)}`
  if (days === 0) return `Hạn hôm nay, ${new Date(due).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
  return `Còn ${days} ngày (hạn ${formatDate(due)})`
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8" data-feature="luyen-thi">
    <header class="space-y-1">
      <h1 class="text-3xl sm:text-4xl font-black text-ink">Lớp của tôi</h1>
      <p class="text-sm text-ink-soft">Lớp bạn đang học, bài giáo viên giao và nhận xét cho bài làm của bạn.</p>
    </header>

    <section v-if="unavailable" class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-brut-lg border-[3px] border-line bg-surface-2 p-6 shadow-brut">
      <p class="text-sm font-bold text-ink">{{ unavailable }}</p>
      <BaseButton to="/dang-nhap" variant="primary" size="md"><LogIn class="h-4 w-4" :stroke-width="2.5" /><span>Đăng nhập</span></BaseButton>
    </section>

    <template v-else>
      <p
        v-if="notice"
        class="rounded-brut border-2 p-3 text-sm font-bold"
        :class="notice.kind === 'ok' ? 'border-line bg-ok/20 text-ink' : 'border-bad bg-bad/10 text-bad'"
        :role="notice.kind === 'ok' ? 'status' : 'alert'"
      >{{ notice.text }}</p>

      <!-- Tham gia bằng mã -->
      <form class="flex flex-col gap-3 rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut sm:flex-row sm:items-end" @submit.prevent="join">
        <label class="block flex-1">
          <span class="mb-1 block text-sm font-black text-ink">Tham gia lớp bằng mã</span>
          <input
            v-model="code"
            type="text"
            inputmode="text"
            autocomplete="off"
            maxlength="6"
            placeholder="VD: LAB65T"
            class="w-full max-w-xs min-h-[48px] rounded-brut border-2 border-line bg-surface px-3 font-display text-xl font-black uppercase tracking-[0.25em] text-ink"
          />
        </label>
        <BaseButton type="submit" variant="primary" size="md" :disabled="isJoining">
          <School class="h-4 w-4" :stroke-width="2.5" /><span>{{ isJoining ? 'Đang tham gia...' : 'Tham gia' }}</span>
        </BaseButton>
      </form>

      <div v-if="isLoading" class="space-y-4" aria-busy="true" aria-label="Đang tải lớp học">
        <BaseSkeleton class="h-24 rounded-brut-lg" />
        <BaseSkeleton class="h-40 rounded-brut-lg" />
      </div>

      <section v-else-if="loadError" class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-brut-lg border-[3px] border-line bg-surface p-6 shadow-brut" role="alert">
        <div class="flex items-start gap-3">
          <AlertTriangle class="h-5 w-5 flex-shrink-0 text-bad" :stroke-width="2.5" />
          <p class="text-sm text-ink">{{ loadError }}</p>
        </div>
        <BaseButton variant="secondary" size="md" @click="load"><RotateCcw class="h-4 w-4" :stroke-width="2.5" /><span>Thử lại</span></BaseButton>
      </section>

      <template v-else-if="data">
        <!-- Lời mời -->
        <section v-if="data.invites.length" class="space-y-3" aria-label="Lời mời vào lớp">
          <h2 class="text-lg font-black text-ink">Lời mời vào lớp</h2>
          <ul class="space-y-2" role="list">
            <li v-for="i in data.invites" :key="i.id" class="flex flex-col gap-3 rounded-brut-lg border-[3px] border-line bg-warn p-4 text-on-tone shadow-brut-sm sm:flex-row sm:items-center">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-black">{{ i.class_name }}</p>
                <p class="text-xs font-bold">Giáo viên {{ i.teacher_name || 'chưa đặt tên' }} mời bạn ngày {{ formatDate(i.created_at) }}</p>
              </div>
              <div class="flex gap-2">
                <button type="button" class="inline-flex min-h-[44px] items-center gap-1.5 rounded-brut border-2 border-line bg-surface px-3 text-sm font-black text-ink cursor-pointer" @click="act(() => api.respondInvite(i.id, true), `Đã vào lớp ${i.class_name}.`)">
                  <Check class="h-4 w-4" :stroke-width="3" aria-hidden="true" /> Chấp nhận
                </button>
                <button type="button" class="inline-flex min-h-[44px] items-center gap-1.5 rounded-brut border-2 border-line bg-surface-2 px-3 text-sm font-bold text-ink cursor-pointer" @click="act(() => api.respondInvite(i.id, false), 'Đã từ chối lời mời.')">
                  <X class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" /> Từ chối
                </button>
              </div>
            </li>
          </ul>
        </section>

        <!-- Bài được giao -->
        <section class="space-y-3" aria-label="Bài được giao">
          <h2 class="text-lg font-black text-ink">Bài được giao <span class="tabular-nums text-ink-soft">({{ pendingAssignments.length }} chưa làm)</span></h2>
          <p v-if="!data.assignments.length" class="rounded-brut-lg border-[3px] border-line bg-surface p-6 text-sm text-ink-soft shadow-brut">
            {{ data.classes.length ? 'Giáo viên chưa giao bài nào.' : 'Tham gia một lớp để nhận bài từ giáo viên.' }}
          </p>
          <ul class="space-y-3" role="list">
            <li
              v-for="a in [...pendingAssignments, ...doneAssignments]"
              :key="a.id"
              class="flex flex-col gap-3 rounded-brut-lg border-[3px] bg-surface p-4 sm:flex-row sm:items-center"
              :class="a.status.done ? 'border-line/40' : 'border-line shadow-brut'"
            >
              <div class="min-w-0 flex-1 space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full" :style="{ background: `var(--chart-${a.skill})` }" aria-hidden="true" />
                  <h3 class="text-base font-black text-ink">{{ a.title }}</h3>
                  <span v-if="a.personal" class="rounded border border-line bg-surface-2 px-1.5 text-[10px] font-black text-ink">Giao riêng cho bạn</span>
                </div>
                <p class="text-xs text-ink-soft">{{ SKILL_LABELS[a.skill] }}: {{ a.test_title }}, lớp {{ a.class_name }}</p>
                <p v-if="a.instructions" class="text-xs text-ink max-w-[70ch]">{{ a.instructions }}</p>
                <p v-if="a.status.done" class="inline-flex items-center gap-1 text-xs font-bold text-ink">
                  <Check class="h-3.5 w-3.5 text-ok" :stroke-width="3" aria-hidden="true" />
                  Đã làm ngày {{ formatDate(a.status.last_at) }}{{ a.status.late ? ' (trễ hạn)' : '' }}<template v-if="a.status.best_band != null">, band {{ Number(a.status.best_band).toFixed(1) }}</template>
                </p>
                <p v-else class="inline-flex items-center gap-1 text-xs font-bold" :class="isOverdue(a.due_at) ? 'text-bad' : 'text-ink'">
                  <AlertTriangle v-if="isOverdue(a.due_at)" class="h-3.5 w-3.5" aria-hidden="true" />
                  <Clock v-else class="h-3.5 w-3.5" aria-hidden="true" />
                  {{ dueLabel(a.due_at) }}
                </p>
              </div>
              <NuxtLink
                :to="`/luyen-thi/ielts/lam-bai/${a.test_id}`"
                class="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-brut border-2 border-line px-4 font-display text-sm font-black brut-press"
                :class="a.status.done ? 'bg-surface-2 text-ink' : 'bg-warn text-on-tone shadow-brut-sm'"
              >
                {{ a.status.done ? 'Làm lại' : 'Làm bài' }} <ArrowUpRight class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
              </NuxtLink>
            </li>
          </ul>
        </section>

        <!-- Nhận xét của giáo viên -->
        <section v-if="data.feedback.length" class="space-y-3" aria-label="Nhận xét của giáo viên">
          <h2 class="text-lg font-black text-ink">Nhận xét của giáo viên</h2>
          <ul class="space-y-3" role="list">
            <li v-for="f in data.feedback" :key="f.id" class="rounded-brut-lg border-[3px] border-line bg-surface p-4 shadow-brut space-y-2">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-black text-ink">{{ f.test_title }}</p>
                  <p class="text-[11px] text-ink-soft">{{ SKILL_LABELS[f.skill] }}, bài làm ngày {{ formatDate(f.completed_at) }}, nhận xét bởi {{ f.teacher_name || 'giáo viên' }}</p>
                </div>
                <p v-if="f.override_band != null" class="text-right text-xs text-ink-soft">
                  Band giáo viên chấm
                  <span class="block font-display text-2xl font-black text-ink">{{ Number(f.override_band).toFixed(1) }}</span>
                  <span v-if="f.ai_band != null">AI chấm {{ Number(f.ai_band).toFixed(1) }}</span>
                </p>
              </div>
              <p v-if="f.comment" class="flex gap-2 text-sm leading-relaxed text-ink max-w-[72ch]">
                <MessageSquare class="mt-1 h-4 w-4 flex-shrink-0 text-ink-soft" aria-hidden="true" />
                <span class="whitespace-pre-line">{{ f.comment }}</span>
              </p>
            </li>
          </ul>
        </section>

        <!-- Lớp đang học -->
        <section class="space-y-3" aria-label="Lớp đang học">
          <h2 class="text-lg font-black text-ink">Lớp đang học</h2>
          <p v-if="!data.classes.length" class="rounded-brut-lg border-[3px] border-line bg-surface p-6 text-sm text-ink-soft shadow-brut">
            Bạn chưa ở lớp nào. Nhập mã lớp giáo viên gửi ở ô phía trên.
          </p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article v-for="c in data.classes" :key="c.id" class="flex flex-col gap-3 rounded-brut-lg border-[3px] border-line bg-surface p-4 shadow-brut">
              <div>
                <h3 class="text-base font-black text-ink">{{ c.name }}<span v-if="c.is_archived" class="text-xs font-bold text-ink-soft"> (đã lưu trữ)</span></h3>
                <p v-if="c.description" class="text-xs text-ink-soft">{{ c.description }}</p>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-brut border-2 border-line bg-accent font-display text-sm font-black text-accent-ink">
                  <img v-if="c.teacher.avatar_url" :src="c.teacher.avatar_url" alt="" class="h-full w-full object-cover" />
                  <span v-else>{{ c.teacher.avatar_text || 'GV' }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[11px] text-ink-soft">Giáo viên</p>
                  <p class="truncate text-sm font-bold text-ink">{{ c.teacher.full_name || 'Chưa đặt tên' }}</p>
                </div>
                <button type="button" class="inline-flex min-h-[40px] items-center gap-1 px-2 text-xs font-bold text-ink-soft hover:text-bad cursor-pointer" @click="leave(c.id, c.name)">
                  <LogOut class="h-3.5 w-3.5" aria-hidden="true" /> Rời lớp
                </button>
              </div>
              <p class="text-[11px] text-ink-soft">Tham gia ngày {{ formatDate(c.joined_at) }}</p>
            </article>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>
