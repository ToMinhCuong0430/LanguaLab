<script setup lang="ts">
import { ArrowLeft, Copy, RefreshCw, Users, Mail, ClipboardList, Trash2, AlertTriangle, RotateCcw, Check, ChevronDown, Archive, Pencil, Clock } from '@lucide/vue'
import type { AssignableTest, ClassAssignment, ClassDetail } from '~/composables/useClasses'
import { formatDate } from '~/composables/useClasses'
import { SKILL_LABELS, SKILL_ORDER } from '~/composables/useProgress'

definePageMeta({ middleware: 'teacher' })

const route = useRoute()
const classId = route.params.id as string
const api = useClasses()

const detail = ref<ClassDetail | null>(null)
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const notice = ref<{ kind: 'ok' | 'error'; text: string } | null>(null)

useHead({ title: computed(() => `${detail.value?.class.name || 'Lớp học'} - Giáo viên - LanguaLab`) })

const load = async () => {
  loadError.value = null
  try {
    detail.value = await api.getClassDetail(classId)
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    isLoading.value = false
  }
}
onMounted(load)

const run = async (fn: () => Promise<unknown>, okText?: string) => {
  notice.value = null
  try {
    await fn()
    if (okText) notice.value = { kind: 'ok', text: okText }
    await load()
    return true
  } catch (e: any) {
    notice.value = { kind: 'error', text: e.message }
    return false
  }
}

type Tab = 'members' | 'invite' | 'assignments'
const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'members', label: 'Học viên', icon: Users },
  { key: 'invite', label: 'Mời học viên', icon: Mail },
  { key: 'assignments', label: 'Bài được giao', icon: ClipboardList },
]
const tab = ref<Tab>((route.query.tab as Tab) || 'members')

// ── Thông tin lớp ──
const isEditing = ref(false)
const editName = ref('')
const editDesc = ref('')
const startEdit = () => {
  editName.value = detail.value!.class.name
  editDesc.value = detail.value!.class.description || ''
  isEditing.value = true
}
const saveEdit = async () => {
  if (await run(() => api.updateClass(classId, editName.value, editDesc.value || null, detail.value!.class.is_archived), 'Đã lưu thông tin lớp.')) {
    isEditing.value = false
  }
}
const toggleArchive = async () => {
  const c = detail.value!.class
  if (!c.is_archived && !confirm('Lưu trữ lớp? Học viên vẫn xem được lịch sử, nhưng không ai tham gia thêm được và bạn không xem tiến độ mới của họ qua lớp này.')) return
  await run(() => api.updateClass(classId, c.name, c.description, !c.is_archived), c.is_archived ? 'Đã mở lại lớp.' : 'Đã lưu trữ lớp.')
}

const copied = ref(false)
const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(detail.value!.class.join_code)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {
    notice.value = { kind: 'error', text: 'Trình duyệt chặn sao chép, hãy chép mã thủ công.' }
  }
}
const regenerate = async () => {
  if (!confirm('Đổi mã lớp? Mã cũ sẽ không dùng được nữa.')) return
  await run(() => api.regenerateCode(classId), 'Đã đổi mã lớp.')
}

// ── Học viên ──
const removeMember = async (id: string, name: string | null) => {
  if (!confirm(`Xoá ${name || 'học viên này'} khỏi lớp? Học viên vẫn giữ toàn bộ lịch sử làm bài.`)) return
  await run(() => api.removeMember(classId, id), 'Đã xoá học viên khỏi lớp.')
}
const relDays = (iso: string | null) => {
  if (!iso) return 'Chưa làm bài'
  const d = Math.floor((Date.now() - +new Date(iso)) / 86_400_000)
  return d <= 0 ? 'Hôm nay' : d === 1 ? 'Hôm qua' : `${d} ngày trước`
}

// ── Mời ──
const emailsText = ref('')
const inviteResult = ref<{ invited: string[]; already_members: string[]; invalid: string[] } | null>(null)
const isInviting = ref(false)
const sendInvites = async () => {
  const emails = emailsText.value.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean)
  if (!emails.length) {
    notice.value = { kind: 'error', text: 'Nhập ít nhất một email.' }
    return
  }
  isInviting.value = true
  notice.value = null
  try {
    inviteResult.value = await api.inviteToClass(classId, emails)
    emailsText.value = inviteResult.value.invalid.join('\n')
    await load()
  } catch (e: any) {
    notice.value = { kind: 'error', text: e.message }
  } finally {
    isInviting.value = false
  }
}

// ── Giao bài ──
const tests = ref<AssignableTest[]>([])
const showAssignForm = ref(false)
const form = reactive({ testId: '', title: '', instructions: '', due: '', target: 'all' as 'all' | 'some', studentIds: [] as string[] })
const isAssigning = ref(false)
const openAssignForm = async () => {
  showAssignForm.value = true
  if (!tests.value.length) {
    try {
      tests.value = await api.listAssignableTests()
    } catch (e: any) {
      notice.value = { kind: 'error', text: e.message }
    }
  }
}
const testsBySkill = computed(() =>
  SKILL_ORDER.map((s) => ({ skill: s, items: tests.value.filter((t) => t.skill === s) })).filter((g) => g.items.length),
)
watch(() => form.testId, (id) => {
  const t = tests.value.find((x) => x.id === id)
  if (t && !form.title) form.title = t.title
})
const submitAssignment = async () => {
  if (!form.testId) {
    notice.value = { kind: 'error', text: 'Chọn đề cần giao.' }
    return
  }
  if (form.target === 'some' && !form.studentIds.length) {
    notice.value = { kind: 'error', text: 'Chọn ít nhất một học viên, hoặc giao cho cả lớp.' }
    return
  }
  isAssigning.value = true
  const ok = await run(() => api.createAssignment({
    classId,
    testId: form.testId,
    title: form.title,
    instructions: form.instructions,
    dueAt: form.due ? new Date(form.due).toISOString() : null,
    studentIds: form.target === 'some' ? form.studentIds : null,
  }), 'Đã giao bài.')
  isAssigning.value = false
  if (ok) {
    Object.assign(form, { testId: '', title: '', instructions: '', due: '', target: 'all', studentIds: [] })
    showAssignForm.value = false
  }
}
const deleteAssignment = async (a: ClassAssignment) => {
  if (!confirm(`Xoá bài "${a.title}"? Học viên sẽ không thấy bài này nữa (lượt làm bài vẫn được giữ).`)) return
  await run(() => api.deleteAssignment(a.id), 'Đã xoá bài được giao.')
}
const doneCount = (a: ClassAssignment) => a.recipients.filter((r) => r.status.done).length
const openAssignments = ref<Set<string>>(new Set())
const toggleAssignment = (id: string) => {
  const s = new Set(openAssignments.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  openAssignments.value = s
}
const minDue = computed(() => {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
    <NuxtLink to="/giao-vien" class="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-ink hover:underline">
      <ArrowLeft class="h-4 w-4" :stroke-width="2.5" /> Lớp học của tôi
    </NuxtLink>

    <div v-if="isLoading" class="space-y-4" aria-busy="true" aria-label="Đang tải lớp">
      <BaseSkeleton class="h-32 rounded-brut-lg" />
      <BaseSkeleton class="h-64 rounded-brut-lg" />
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
      <BaseButton variant="secondary" size="md" @click="load"><RotateCcw class="h-4 w-4" :stroke-width="2.5" /><span>Thử lại</span></BaseButton>
    </section>

    <template v-else-if="detail">
      <!-- Thông tin lớp + mã -->
      <section class="rounded-brut-lg border-[3px] border-line bg-surface p-5 sm:p-6 shadow-brut">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div class="min-w-0 flex-1 space-y-2">
            <template v-if="!isEditing">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-2xl sm:text-3xl font-black text-ink">{{ detail.class.name }}</h1>
                <span v-if="detail.class.is_archived" class="rounded border-2 border-line bg-surface-2 px-2 text-xs font-black text-ink">Đã lưu trữ</span>
              </div>
              <p v-if="detail.class.description" class="text-sm text-ink-soft max-w-[70ch]">{{ detail.class.description }}</p>
              <p class="text-xs text-ink-soft">Tạo ngày {{ formatDate(detail.class.created_at) }}, {{ detail.members.length }} học viên.</p>
              <div class="flex flex-wrap gap-2 pt-1">
                <button type="button" class="inline-flex min-h-[40px] items-center gap-1.5 rounded-brut border-2 border-line bg-surface-2 px-3 text-xs font-bold text-ink cursor-pointer" @click="startEdit">
                  <Pencil class="h-3.5 w-3.5" aria-hidden="true" /> Sửa thông tin
                </button>
                <button type="button" class="inline-flex min-h-[40px] items-center gap-1.5 rounded-brut border-2 border-line bg-surface-2 px-3 text-xs font-bold text-ink cursor-pointer" @click="toggleArchive">
                  <Archive class="h-3.5 w-3.5" aria-hidden="true" /> {{ detail.class.is_archived ? 'Mở lại lớp' : 'Lưu trữ lớp' }}
                </button>
              </div>
            </template>
            <form v-else class="space-y-3 max-w-xl" @submit.prevent="saveEdit">
              <label class="block">
                <span class="mb-1 block text-xs font-black text-ink">Tên lớp</span>
                <input v-model="editName" maxlength="80" class="w-full min-h-[44px] rounded-brut border-2 border-line bg-surface px-3 text-sm text-ink" />
              </label>
              <label class="block">
                <span class="mb-1 block text-xs font-black text-ink">Mô tả</span>
                <textarea v-model="editDesc" maxlength="500" rows="2" class="w-full rounded-brut border-2 border-line bg-surface p-3 text-sm text-ink" />
              </label>
              <div class="flex gap-3">
                <BaseButton type="submit" variant="primary" size="sm"><span>Lưu</span></BaseButton>
                <button type="button" class="min-h-[40px] px-2 text-sm font-bold text-ink underline cursor-pointer" @click="isEditing = false">Huỷ</button>
              </div>
            </form>
          </div>

          <!-- Mã tham gia: thứ đáng nhớ nhất của trang -->
          <div class="rounded-brut-lg border-[3px] border-line bg-warn p-4 text-on-tone shadow-brut-sm lg:min-w-[260px]">
            <p class="text-xs font-black">Mã tham gia lớp</p>
            <p class="font-display text-4xl font-black tracking-[0.25em]" :aria-label="`Mã lớp ${detail.class.join_code.split('').join(' ')}`">{{ detail.class.join_code }}</p>
            <div class="mt-2 flex gap-2">
              <button type="button" class="inline-flex min-h-[40px] items-center gap-1.5 rounded-brut border-2 border-line bg-surface px-3 text-xs font-black text-ink cursor-pointer" @click="copyCode">
                <Check v-if="copied" class="h-3.5 w-3.5" aria-hidden="true" /><Copy v-else class="h-3.5 w-3.5" aria-hidden="true" />
                {{ copied ? 'Đã chép' : 'Sao chép' }}
              </button>
              <button type="button" class="inline-flex min-h-[40px] items-center gap-1.5 rounded-brut border-2 border-line bg-surface px-3 text-xs font-black text-ink cursor-pointer" @click="regenerate">
                <RefreshCw class="h-3.5 w-3.5" aria-hidden="true" /> Đổi mã
              </button>
            </div>
            <p class="mt-2 text-[11px] font-bold">Học viên nhập mã ở trang "Lớp của tôi".</p>
          </div>
        </div>
      </section>

      <p
        v-if="notice"
        class="rounded-brut border-2 p-3 text-sm font-bold"
        :class="notice.kind === 'ok' ? 'border-line bg-ok/20 text-ink' : 'border-bad bg-bad/10 text-bad'"
        :role="notice.kind === 'ok' ? 'status' : 'alert'"
      >{{ notice.text }}</p>

      <!-- Tabs -->
      <div class="flex flex-wrap gap-2" role="tablist" aria-label="Quản lý lớp">
        <button
          v-for="t in TABS"
          :id="`tab-${t.key}`"
          :key="t.key"
          type="button"
          role="tab"
          :aria-selected="tab === t.key"
          :aria-controls="`panel-${t.key}`"
          class="inline-flex min-h-[44px] items-center gap-2 rounded-brut border-2 px-4 font-display text-sm font-black cursor-pointer"
          :class="tab === t.key ? 'border-line bg-ink text-surface shadow-brut-sm' : 'border-line/40 bg-surface text-ink hover:border-line'"
          @click="tab = t.key"
        >
          <component :is="t.icon" class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" />
          {{ t.label }}
          <span v-if="t.key === 'members'" class="tabular-nums">({{ detail.members.length }})</span>
          <span v-else-if="t.key === 'invite' && detail.invites.length" class="tabular-nums">({{ detail.invites.length }})</span>
          <span v-else-if="t.key === 'assignments'" class="tabular-nums">({{ detail.assignments.length }})</span>
        </button>
      </div>

      <!-- TAB: Học viên -->
      <section v-if="tab === 'members'" id="panel-members" role="tabpanel" aria-labelledby="tab-members" class="rounded-brut-lg border-[3px] border-line bg-surface shadow-brut">
        <p v-if="!detail.members.length" class="p-8 text-center text-sm text-ink-soft">
          Lớp chưa có học viên. Chia sẻ mã <strong class="text-ink">{{ detail.class.join_code }}</strong> hoặc mời bằng email ở tab "Mời học viên".
        </p>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[760px] text-left text-sm">
            <thead class="border-b-[3px] border-line bg-surface-2 text-xs text-ink">
              <tr>
                <th scope="col" class="p-3 font-black">Học viên</th>
                <th v-for="s in SKILL_ORDER" :key="s" scope="col" class="p-3 text-center font-black">{{ SKILL_LABELS[s].slice(0, 1) }}<span class="sr-only">{{ SKILL_LABELS[s].slice(1) }}</span></th>
                <th scope="col" class="p-3 text-right font-black">Lượt làm</th>
                <th scope="col" class="p-3 font-black">Hoạt động</th>
                <th scope="col" class="p-3 font-black">Điểm yếu</th>
                <th scope="col" class="p-3"><span class="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in detail.members" :key="m.student_id" class="border-b border-line/20 text-ink">
                <td class="p-3">
                  <NuxtLink :to="`/giao-vien/hoc-vien/${m.student_id}`" class="font-bold underline-offset-2 hover:underline">{{ m.full_name || m.email }}</NuxtLink>
                  <span class="block text-[11px] text-ink-soft">{{ m.email }}<template v-if="m.target_band">, mục tiêu {{ Number(m.target_band).toFixed(1) }}</template></span>
                </td>
                <td v-for="s in SKILL_ORDER" :key="s" class="p-3 text-center font-display font-black tabular-nums">
                  <span v-if="m.bands[s] != null" class="inline-flex items-center gap-1">
                    <span class="h-2 w-2 rounded-full" :style="{ background: `var(--chart-${s})` }" aria-hidden="true" />{{ Number(m.bands[s]).toFixed(1) }}
                  </span>
                  <span v-else class="text-ink-soft" aria-label="Chưa có">–</span>
                </td>
                <td class="p-3 text-right tabular-nums">{{ m.attempts }}</td>
                <td class="p-3 whitespace-nowrap text-xs" :class="m.last_active ? 'text-ink' : 'text-ink-soft'">{{ relDays(m.last_active) }}</td>
                <td class="p-3 text-xs">
                  <span v-if="m.weak_count" class="inline-flex items-center gap-1 font-bold text-ink">
                    <AlertTriangle class="h-3.5 w-3.5 text-bad" aria-hidden="true" /> {{ m.weak_count }} dạng
                  </span>
                  <span v-else class="text-ink-soft">Không có</span>
                </td>
                <td class="p-3 text-right whitespace-nowrap">
                  <NuxtLink :to="`/giao-vien/hoc-vien/${m.student_id}`" class="mr-2 text-xs font-bold text-ink underline">Tiến độ</NuxtLink>
                  <button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-brut text-ink-soft hover:text-bad cursor-pointer" :aria-label="`Xoá ${m.full_name || m.email} khỏi lớp`" @click="removeMember(m.student_id, m.full_name)">
                    <Trash2 class="h-4 w-4" :stroke-width="2.5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- TAB: Mời -->
      <section v-else-if="tab === 'invite'" id="panel-invite" role="tabpanel" aria-labelledby="tab-invite" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form class="rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut space-y-3" @submit.prevent="sendInvites">
          <h2 class="text-lg font-black text-ink">Mời bằng email</h2>
          <p class="text-xs text-ink-soft">
            Mỗi email một dòng hoặc cách nhau bằng dấu phẩy, tối đa 50 email. Học viên thấy lời mời ở trang "Lớp của tôi" sau khi đăng nhập bằng đúng email này và tự chấp nhận.
          </p>
          <label class="block">
            <span class="sr-only">Danh sách email</span>
            <textarea v-model="emailsText" rows="5" placeholder="hocvien1@gmail.com&#10;hocvien2@gmail.com" class="w-full rounded-brut border-2 border-line bg-surface p-3 text-sm text-ink" />
          </label>
          <BaseButton type="submit" variant="primary" size="md" :disabled="isInviting || detail.class.is_archived">
            <Mail class="h-4 w-4" :stroke-width="2.5" /><span>{{ isInviting ? 'Đang gửi...' : 'Gửi lời mời' }}</span>
          </BaseButton>
          <div v-if="inviteResult" class="space-y-1 rounded-brut border-2 border-line bg-surface-2 p-3 text-xs text-ink" role="status">
            <p v-if="inviteResult.invited.length"><strong>Đã mời {{ inviteResult.invited.length }}:</strong> {{ inviteResult.invited.join(', ') }}</p>
            <p v-if="inviteResult.already_members.length"><strong>Đã ở trong lớp:</strong> {{ inviteResult.already_members.join(', ') }}</p>
            <p v-if="inviteResult.invalid.length" class="text-bad"><strong>Email không hợp lệ (giữ lại trong ô để sửa):</strong> {{ inviteResult.invalid.join(', ') }}</p>
          </div>
        </form>

        <div class="rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut space-y-3">
          <h2 class="text-lg font-black text-ink">Lời mời đang chờ</h2>
          <p v-if="!detail.invites.length" class="text-sm text-ink-soft">Không có lời mời nào đang chờ.</p>
          <ul v-else class="space-y-2" role="list">
            <li v-for="i in detail.invites" :key="i.id" class="flex items-center justify-between gap-3 rounded-brut border-2 border-line/40 px-3 py-2">
              <span class="min-w-0">
                <span class="block truncate text-sm font-bold text-ink">{{ i.email }}</span>
                <span class="block text-[11px] text-ink-soft">Mời ngày {{ formatDate(i.created_at) }}</span>
              </span>
              <button type="button" class="min-h-[40px] px-2 text-xs font-bold text-bad underline cursor-pointer" @click="run(() => api.revokeInvite(i.id), 'Đã huỷ lời mời.')">Huỷ</button>
            </li>
          </ul>
        </div>
      </section>

      <!-- TAB: Bài được giao -->
      <section v-else id="panel-assignments" role="tabpanel" aria-labelledby="tab-assignments" class="space-y-4">
        <div v-if="!showAssignForm">
          <BaseButton variant="primary" size="md" :disabled="detail.class.is_archived || !detail.members.length" @click="openAssignForm">
            <ClipboardList class="h-4 w-4" :stroke-width="2.5" /><span>Giao bài mới</span>
          </BaseButton>
          <p v-if="!detail.members.length" class="mt-2 text-xs text-ink-soft">Lớp cần có học viên trước khi giao bài.</p>
        </div>

        <form v-else class="rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut space-y-4" @submit.prevent="submitAssignment">
          <h2 class="text-lg font-black text-ink">Giao bài mới</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="block">
              <span class="mb-1 block text-xs font-black text-ink">Đề thi <span class="text-bad">*</span></span>
              <select v-model="form.testId" class="w-full min-h-[44px] rounded-brut border-2 border-line bg-surface px-3 text-sm text-ink cursor-pointer">
                <option value="" disabled>Chọn đề...</option>
                <optgroup v-for="g in testsBySkill" :key="g.skill" :label="SKILL_LABELS[g.skill]">
                  <option v-for="t in g.items" :key="t.id" :value="t.id" :disabled="!t.is_published">
                    {{ t.title }}{{ t.is_published ? '' : ' (chưa xuất bản)' }}
                  </option>
                </optgroup>
              </select>
              <span class="mt-1 block text-[11px] text-ink-soft">Chỉ giao được đề đã xuất bản, vì học viên không mở được đề nháp.</span>
            </label>
            <label class="block">
              <span class="mb-1 block text-xs font-black text-ink">Tiêu đề</span>
              <input v-model="form.title" maxlength="120" placeholder="Mặc định là tên đề" class="w-full min-h-[44px] rounded-brut border-2 border-line bg-surface px-3 text-sm text-ink" />
            </label>
            <label class="block">
              <span class="mb-1 block text-xs font-black text-ink">Hạn nộp</span>
              <input v-model="form.due" type="datetime-local" :min="minDue" class="w-full min-h-[44px] rounded-brut border-2 border-line bg-surface px-3 text-sm text-ink" />
            </label>
            <label class="block">
              <span class="mb-1 block text-xs font-black text-ink">Hướng dẫn</span>
              <input v-model="form.instructions" maxlength="1000" placeholder="vd. Làm chế độ Thi thử, không tra từ điển" class="w-full min-h-[44px] rounded-brut border-2 border-line bg-surface px-3 text-sm text-ink" />
            </label>
          </div>

          <fieldset class="space-y-2">
            <legend class="text-xs font-black text-ink">Giao cho</legend>
            <div class="flex flex-wrap gap-3">
              <label class="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-brut border-2 px-3 text-sm font-bold" :class="form.target === 'all' ? 'border-line bg-surface-2 text-ink' : 'border-line/40 text-ink'">
                <input v-model="form.target" type="radio" value="all" class="accent-accent" /> Cả lớp ({{ detail.members.length }})
              </label>
              <label class="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-brut border-2 px-3 text-sm font-bold" :class="form.target === 'some' ? 'border-line bg-surface-2 text-ink' : 'border-line/40 text-ink'">
                <input v-model="form.target" type="radio" value="some" class="accent-accent" /> Chọn học viên
              </label>
            </div>
            <div v-if="form.target === 'some'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              <label v-for="m in detail.members" :key="m.student_id" class="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-brut border-2 border-line/40 px-3 text-sm text-ink">
                <input v-model="form.studentIds" type="checkbox" :value="m.student_id" class="h-4 w-4 accent-accent" />
                {{ m.full_name || m.email }}
              </label>
            </div>
          </fieldset>

          <div class="flex gap-3">
            <BaseButton type="submit" variant="primary" size="md" :disabled="isAssigning"><span>{{ isAssigning ? 'Đang giao...' : 'Giao bài' }}</span></BaseButton>
            <button type="button" class="min-h-[44px] px-2 text-sm font-bold text-ink underline cursor-pointer" @click="showAssignForm = false">Huỷ</button>
          </div>
        </form>

        <p v-if="!detail.assignments.length" class="rounded-brut-lg border-[3px] border-line bg-surface p-8 text-center text-sm text-ink-soft shadow-brut">Chưa giao bài nào.</p>
        <ul v-else class="space-y-3" role="list">
          <li v-for="a in detail.assignments" :key="a.id" class="rounded-brut-lg border-[3px] border-line bg-surface shadow-brut">
            <div class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div class="min-w-0 flex-1 space-y-1">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full" :style="{ background: `var(--chart-${a.skill})` }" aria-hidden="true" />
                  <h3 class="text-base font-black text-ink">{{ a.title }}</h3>
                  <span class="rounded border border-line bg-surface-2 px-1.5 text-[10px] font-black text-ink">{{ a.student_ids ? `${a.student_ids.length} học viên` : 'Cả lớp' }}</span>
                </div>
                <p class="text-xs text-ink-soft">{{ SKILL_LABELS[a.skill] }}: {{ a.test_title }}</p>
                <p class="flex items-center gap-1 text-xs text-ink-soft">
                  <Clock class="h-3 w-3" aria-hidden="true" />
                  {{ a.due_at ? `Hạn ${formatDate(a.due_at, true)}` : 'Không có hạn' }}, giao ngày {{ formatDate(a.created_at) }}
                </p>
              </div>
              <div class="w-full sm:w-48 space-y-1">
                <p class="text-xs font-bold text-ink tabular-nums">{{ doneCount(a) }}/{{ a.recipients.length }} đã làm</p>
                <div class="h-2.5 rounded-full border-2 border-line bg-surface-2 overflow-hidden" role="progressbar" aria-valuemin="0" :aria-valuemax="a.recipients.length" :aria-valuenow="doneCount(a)" :aria-label="`${a.title}: ${doneCount(a)} trên ${a.recipients.length} học viên đã làm`">
                  <div class="h-full bg-ok" :style="{ width: `${a.recipients.length ? (doneCount(a) / a.recipients.length) * 100 : 0}%` }" />
                </div>
              </div>
              <div class="flex items-center gap-1">
                <button type="button" class="inline-flex min-h-[40px] items-center gap-1 rounded-brut border-2 border-line bg-surface-2 px-2.5 text-xs font-bold text-ink cursor-pointer" :aria-expanded="openAssignments.has(a.id)" @click="toggleAssignment(a.id)">
                  Chi tiết <ChevronDown class="h-3.5 w-3.5 transition-transform" :class="{ 'rotate-180': openAssignments.has(a.id) }" aria-hidden="true" />
                </button>
                <button type="button" class="inline-flex h-10 w-10 items-center justify-center rounded-brut text-ink-soft hover:text-bad cursor-pointer" :aria-label="`Xoá bài ${a.title}`" @click="deleteAssignment(a)">
                  <Trash2 class="h-4 w-4" :stroke-width="2.5" />
                </button>
              </div>
            </div>
            <ul v-if="openAssignments.has(a.id)" class="divide-y divide-line/20 border-t-2 border-line/30" role="list">
              <li v-for="r in a.recipients" :key="r.student_id" class="flex items-center justify-between gap-3 px-4 py-2 text-sm">
                <NuxtLink :to="`/giao-vien/hoc-vien/${r.student_id}`" class="text-ink hover:underline">{{ r.full_name || 'Học viên' }}</NuxtLink>
                <span v-if="r.status.done" class="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
                  <Check class="h-3.5 w-3.5 text-ok" :stroke-width="3" aria-hidden="true" />
                  Đã làm{{ r.status.late ? ' (trễ hạn)' : '' }}<template v-if="r.status.best_band != null">, band {{ Number(r.status.best_band).toFixed(1) }}</template>
                </span>
                <span v-else class="text-xs font-bold text-ink-soft">
                  {{ a.due_at && new Date(a.due_at) < new Date() ? 'Quá hạn, chưa làm' : 'Chưa làm' }}
                </span>
              </li>
            </ul>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
