<script setup lang="ts">
import { Search, Ban, LockOpen, RefreshCw, ChevronLeft, ChevronRight, UserCog, Users } from '@lucide/vue'
import PageBanner from '~/components/common/PageBanner.vue'
import type { TabItem } from '~/components/BaseTabs.vue'
import type { AppRole } from '~/composables/useClasses'
import { ROLE_LABEL, formatRelative, formatDateTime, type AdminUserList, type AdminUserRow } from '~/composables/useAdmin'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Người dùng - Langua Admin' })

const { listUsers, setRole, banUser, unbanUser } = useAdmin()
const currentUser = useSupabaseUser()
const myId = computed(() => currentUser.value?.sub ?? null)

const PAGE_SIZE = 20
const search = ref('')
const roleTab = ref<'all' | AppRole | 'banned'>('all')
const page = ref(0)
const data = ref<AdminUserList | null>(null)
const isLoading = ref(true)
const loadError = ref('')
const flash = ref<{ kind: 'ok' | 'error'; text: string } | null>(null)

const load = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    data.value = await listUsers({
      search: search.value,
      role: roleTab.value === 'all' || roleTab.value === 'banned' ? null : roleTab.value,
      status: roleTab.value === 'banned' ? 'banned' : null,
      limit: PAGE_SIZE,
      offset: page.value * PAGE_SIZE,
    })
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    isLoading.value = false
  }
}
onMounted(load)

// Tìm kiếm có trễ để không gọi RPC theo từng phím
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 0; load() }, 300)
})
watch(roleTab, () => { page.value = 0; load() })

const tabs = computed<TabItem[]>(() => {
  const c = data.value?.counts
  return [
    { id: 'all', label: 'Tất cả', count: c?.all ?? '–' },
    { id: 'student', label: 'Học viên', count: c?.student ?? '–' },
    { id: 'teacher', label: 'Giáo viên', count: c?.teacher ?? '–' },
    { id: 'admin', label: 'Quản trị viên', count: c?.admin ?? '–' },
    { id: 'banned', label: 'Đang bị khoá', count: c?.banned ?? '–' },
  ]
})

const pageCount = computed(() => Math.max(1, Math.ceil((data.value?.total ?? 0) / PAGE_SIZE)))
const goPage = (delta: number) => {
  page.value = Math.min(Math.max(page.value + delta, 0), pageCount.value - 1)
  load()
}

const initials = (u: AdminUserRow) =>
  u.avatar_text || (u.full_name || u.email).split(/\s+/).map((w) => w[0]).slice(-2).join('').toUpperCase()

// ---- Đổi vai trò (xác nhận trước khi lưu) ----
const roleDialog = ref<{ user: AdminUserRow; to: AppRole } | null>(null)
const isSavingRole = ref(false)

const askRole = (u: AdminUserRow, ev: Event) => {
  const to = (ev.target as HTMLSelectElement).value as AppRole
  ;(ev.target as HTMLSelectElement).value = u.role // giữ nguyên tới khi xác nhận
  if (to !== u.role) roleDialog.value = { user: u, to }
}

const confirmRole = async () => {
  if (!roleDialog.value) return
  const { user, to } = roleDialog.value
  isSavingRole.value = true
  try {
    await setRole(user.id, to)
    flash.value = { kind: 'ok', text: `${user.email} giờ là ${ROLE_LABEL[to]}.` }
    roleDialog.value = null
    await load()
  } catch (e: any) {
    flash.value = { kind: 'error', text: e.message }
    roleDialog.value = null
  } finally {
    isSavingRole.value = false
  }
}

// ---- Khoá / mở khoá ----
const BAN_OPTIONS = [
  { value: '1', label: '1 ngày' },
  { value: '7', label: '7 ngày' },
  { value: '30', label: '30 ngày' },
  { value: 'forever', label: 'Vĩnh viễn (tới khi mở khoá)' },
]
const banTarget = ref<AdminUserRow | null>(null)
const banReason = ref('')
const banDuration = ref('7')
const banError = ref('')
const isBanning = ref(false)

const openBan = (u: AdminUserRow) => {
  banTarget.value = u
  banReason.value = ''
  banDuration.value = '7'
  banError.value = ''
}

const confirmBan = async () => {
  if (!banTarget.value) return
  if (banReason.value.trim().length < 3) {
    banError.value = 'Ghi lý do khoá (ít nhất 3 ký tự). Lý do được lưu vào nhật ký admin.'
    return
  }
  isBanning.value = true
  try {
    await banUser(banTarget.value.id, banReason.value, banDuration.value === 'forever' ? null : Number(banDuration.value))
    flash.value = { kind: 'ok', text: `Đã khoá ${banTarget.value.email}. Các phiên đăng nhập của tài khoản này đã bị thu hồi.` }
    banTarget.value = null
    await load()
  } catch (e: any) {
    banError.value = e.message
  } finally {
    isBanning.value = false
  }
}

const unbanningId = ref<string | null>(null)
const doUnban = async (u: AdminUserRow) => {
  unbanningId.value = u.id
  try {
    await unbanUser(u.id)
    flash.value = { kind: 'ok', text: `Đã mở khoá ${u.email}.` }
    await load()
  } catch (e: any) {
    flash.value = { kind: 'error', text: e.message }
  } finally {
    unbanningId.value = null
  }
}

const banLabel = (u: AdminUserRow) => {
  if (!u.banned_until) return 'Đang khoá'
  const until = new Date(u.banned_until)
  return until.getFullYear() > 9000 ? 'Khoá vĩnh viễn' : `Khoá tới ${until.toLocaleDateString('vi-VN')}`
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-5">
    <PageBanner
      title="Người dùng"
      description="Tìm tài khoản, đổi vai trò và khoá tài khoản vi phạm. Mọi thay đổi được ghi vào nhật ký admin."
      badge-text="Quản trị"
      feature="admin"
    />

    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div class="overflow-x-auto -mx-1 px-1">
        <BaseTabs v-model="roleTab" :items="tabs" size="sm" tone="neutral" />
      </div>
      <label class="relative block lg:w-80">
        <span class="sr-only">Tìm theo tên hoặc email</span>
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
        <input
          v-model="search"
          type="search"
          placeholder="Tìm theo tên hoặc email"
          class="w-full min-h-[44px] rounded-brut border-2 border-line bg-surface pl-9 pr-3 text-sm text-ink"
        />
      </label>
    </div>

    <p
      v-if="flash"
      class="rounded-brut border-2 p-3 text-xs font-bold"
      :class="flash.kind === 'ok' ? 'border-line bg-ok/20 text-ink' : 'border-bad bg-bad/10 text-bad'"
      :role="flash.kind === 'ok' ? 'status' : 'alert'"
    >
      {{ flash.text }}
    </p>

    <BaseCard>
      <div v-if="loadError" class="flex flex-col items-center gap-3 py-8 text-center">
        <p class="text-sm font-bold text-bad" role="alert">{{ loadError }}</p>
        <BaseButton variant="secondary" size="sm" @click="load"><RefreshCw class="h-4 w-4" /> <span>Tải lại</span></BaseButton>
      </div>

      <BaseSkeleton v-else-if="isLoading && !data" height="3rem" :count="6" />

      <BaseEmptyState
        v-else-if="data && data.rows.length === 0"
        :icon="Users"
        title="Không có tài khoản nào khớp"
        description="Thử từ khoá khác hoặc chọn nhóm Tất cả."
      />

      <div v-else-if="data" class="relative overflow-x-auto rounded-brut border-2 border-line" :class="{ 'opacity-60': isLoading }">
        <table class="w-full min-w-[860px] text-left text-xs text-ink">
          <thead class="bg-surface-2 border-b-2 border-line font-display">
            <tr>
              <th scope="col" class="p-3 font-black">Tài khoản</th>
              <th scope="col" class="p-3 font-black">Vai trò</th>
              <th scope="col" class="p-3 font-black">Tham gia</th>
              <th scope="col" class="p-3 font-black">Hoạt động gần nhất</th>
              <th scope="col" class="p-3 text-right font-black">Lượt làm bài</th>
              <th scope="col" class="p-3 font-black">Trạng thái</th>
              <th scope="col" class="p-3 text-right font-black"><span class="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in data.rows" :key="u.id" class="border-t border-line/30 align-middle" :class="{ 'bg-bad/5': u.is_banned }">
              <td class="p-3">
                <div class="flex items-center gap-3">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-brut border-2 border-line bg-surface-2 font-display text-[11px] font-black">
                    {{ initials(u) }}
                  </span>
                  <div class="min-w-0">
                    <p class="truncate font-bold">
                      {{ u.full_name || 'Chưa đặt tên' }}
                      <span v-if="u.id === myId" class="ml-1 text-[11px] font-bold text-ink-soft">(bạn)</span>
                    </p>
                    <p class="truncate text-ink-soft">{{ u.email }}</p>
                  </div>
                </div>
              </td>
              <td class="p-3">
                <label class="sr-only" :for="`role-${u.id}`">Vai trò của {{ u.email }}</label>
                <select
                  :id="`role-${u.id}`"
                  :value="u.role"
                  :disabled="u.id === myId"
                  :title="u.id === myId ? 'Không thể tự đổi vai trò của chính mình' : undefined"
                  class="min-h-[44px] rounded-brut border-2 border-line bg-surface px-2 text-xs font-bold text-ink cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  @change="askRole(u, $event)"
                >
                  <option value="student">Học viên</option>
                  <option value="teacher">Giáo viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </td>
              <td class="p-3 tabular-nums" :title="formatDateTime(u.created_at)">{{ new Date(u.created_at).toLocaleDateString('vi-VN') }}</td>
              <td class="p-3" :title="formatDateTime(u.last_active || u.last_sign_in_at)">
                <p>{{ formatRelative(u.last_active) }}</p>
                <p class="text-[11px] text-ink-soft">Đăng nhập: {{ formatRelative(u.last_sign_in_at) }}</p>
              </td>
              <td class="p-3 text-right font-bold tabular-nums">{{ u.attempts }}</td>
              <td class="p-3">
                <BaseBadge v-if="u.is_banned" tone="coral" size="sm" :icon="Ban">{{ banLabel(u) }}</BaseBadge>
                <BaseBadge v-else tone="green" size="sm">Hoạt động</BaseBadge>
                <p v-if="u.is_banned && u.ban_reason" class="mt-1 max-w-[200px] truncate text-[11px] text-ink-soft" :title="u.ban_reason">
                  {{ u.ban_reason }}
                </p>
              </td>
              <td class="p-3 text-right whitespace-nowrap">
                <BaseButton
                  v-if="u.is_banned"
                  variant="secondary"
                  size="sm"
                  :disabled="unbanningId === u.id"
                  @click="doUnban(u)"
                >
                  <RefreshCw v-if="unbanningId === u.id" class="h-4 w-4 animate-spin" />
                  <LockOpen v-else class="h-4 w-4" :stroke-width="2.5" />
                  <span>Mở khoá</span>
                </BaseButton>
                <BaseButton
                  v-else
                  variant="secondary"
                  size="sm"
                  :disabled="u.id === myId || u.role === 'admin'"
                  :title="u.role === 'admin' ? 'Hạ quyền quản trị trước khi khoá' : undefined"
                  @click="openBan(u)"
                >
                  <Ban class="h-4 w-4" :stroke-width="2.5" />
                  <span>Khoá</span>
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template v-if="data && data.total > PAGE_SIZE" #footer>
        <div class="flex items-center justify-between gap-3 pt-2 text-xs">
          <span class="text-ink-soft tabular-nums">
            {{ page * PAGE_SIZE + 1 }}–{{ Math.min((page + 1) * PAGE_SIZE, data.total) }} / {{ data.total }} tài khoản
          </span>
          <div class="flex gap-2">
            <BaseButton variant="secondary" size="sm" :disabled="page === 0" aria-label="Trang trước" @click="goPage(-1)">
              <ChevronLeft class="h-4 w-4" />
            </BaseButton>
            <BaseButton variant="secondary" size="sm" :disabled="page >= pageCount - 1" aria-label="Trang sau" @click="goPage(1)">
              <ChevronRight class="h-4 w-4" />
            </BaseButton>
          </div>
        </div>
      </template>
    </BaseCard>

    <!-- Xác nhận đổi vai trò -->
    <BaseModal :model-value="!!roleDialog" title="Đổi vai trò" max-width="sm" @update:model-value="roleDialog = null">
      <div v-if="roleDialog" class="space-y-4 text-sm text-ink">
        <p>
          Đổi <strong>{{ roleDialog.user.email }}</strong> từ {{ ROLE_LABEL[roleDialog.user.role] }} thành
          <strong>{{ ROLE_LABEL[roleDialog.to] }}</strong>?
        </p>
        <p v-if="roleDialog.to === 'admin'" class="rounded-brut border-2 border-line bg-warn/20 p-3 text-xs font-bold">
          Quản trị viên có toàn quyền với nội dung, người dùng và nhật ký.
        </p>
        <p v-else-if="roleDialog.user.role === 'teacher'" class="text-xs text-ink-soft">
          Lớp học của giáo viên này vẫn được giữ, nhưng họ sẽ không vào được khu Dạy học nữa.
        </p>
        <div class="flex justify-end gap-2">
          <BaseButton variant="secondary" size="md" @click="roleDialog = null">Huỷ</BaseButton>
          <BaseButton variant="primary" size="md" :disabled="isSavingRole" @click="confirmRole">
            <RefreshCw v-if="isSavingRole" class="h-4 w-4 animate-spin" />
            <UserCog v-else class="h-4 w-4" :stroke-width="2.5" />
            <span>Đổi vai trò</span>
          </BaseButton>
        </div>
      </div>
    </BaseModal>

    <!-- Khoá tài khoản -->
    <BaseModal :model-value="!!banTarget" title="Khoá tài khoản" max-width="md" @update:model-value="banTarget = null">
      <form v-if="banTarget" class="space-y-4 text-sm text-ink" @submit.prevent="confirmBan">
        <p>
          <strong>{{ banTarget.email }}</strong> sẽ bị đăng xuất khỏi mọi thiết bị và không đăng nhập được cho tới khi hết hạn khoá.
        </p>
        <label class="block">
          <span class="mb-1 block text-xs font-black">Thời hạn</span>
          <select v-model="banDuration" class="w-full min-h-[44px] rounded-brut border-2 border-line bg-surface px-3 text-sm cursor-pointer">
            <option v-for="o in BAN_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-black">Lý do <span class="text-bad" aria-hidden="true">*</span></span>
          <textarea
            v-model="banReason"
            rows="3"
            maxlength="500"
            required
            aria-describedby="ban-help"
            placeholder="Ví dụ: Gửi nội dung spam trong lớp học"
            class="w-full rounded-brut border-2 border-line bg-surface p-3 text-sm"
          />
          <span id="ban-help" class="mt-1 block text-[11px] text-ink-soft">Lý do được lưu vào nhật ký admin.</span>
        </label>
        <p v-if="banError" class="rounded-brut border-2 border-bad bg-bad/10 p-2 text-xs font-bold text-bad" role="alert">{{ banError }}</p>
        <p class="text-[11px] text-ink-soft">
          Phiên làm việc đang mở có thể còn dùng được tối đa khoảng 1 giờ, tới khi mã truy cập hết hạn.
        </p>
        <div class="flex justify-end gap-2">
          <BaseButton type="button" variant="secondary" size="md" @click="banTarget = null">Huỷ</BaseButton>
          <BaseButton type="submit" variant="danger" size="md" :disabled="isBanning">
            <RefreshCw v-if="isBanning" class="h-4 w-4 animate-spin" />
            <Ban v-else class="h-4 w-4" :stroke-width="2.5" />
            <span>Khoá tài khoản</span>
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
