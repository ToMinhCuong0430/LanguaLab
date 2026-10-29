<script setup lang="ts">
import { UserCog, RefreshCw } from '@lucide/vue'
import type { AppRole } from '~/composables/useClasses'

// Admin cấp vai trò Giáo viên / Admin / Học viên theo email tài khoản
const { setUserRole, listStaff } = useClasses()

const staff = ref<Awaited<ReturnType<typeof listStaff>>>([])
const email = ref('')
const role = ref<AppRole>('teacher')
const isSaving = ref(false)
const message = ref<{ kind: 'ok' | 'error'; text: string } | null>(null)

const ROLE_LABEL: Record<AppRole, string> = { student: 'Học viên', teacher: 'Giáo viên', admin: 'Quản trị viên' }

const load = async () => {
  try {
    staff.value = await listStaff()
  } catch (e: any) {
    message.value = { kind: 'error', text: e.message }
  }
}
onMounted(load)

const submit = async () => {
  message.value = null
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim())) {
    message.value = { kind: 'error', text: 'Nhập email hợp lệ của tài khoản cần phân quyền.' }
    return
  }
  isSaving.value = true
  try {
    const res = await setUserRole(email.value.trim(), role.value)
    message.value = { kind: 'ok', text: `${res.email} giờ là ${ROLE_LABEL[res.role]}.` }
    email.value = ''
    await load()
  } catch (e: any) {
    message.value = { kind: 'error', text: e.message }
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <BaseCard>
    <template #header>
      <h2 class="flex items-center gap-2 font-display text-base font-black text-ink">
        <UserCog class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" /> Phân quyền giáo viên
      </h2>
    </template>
    <div class="space-y-4">
      <form class="flex flex-col gap-3 md:flex-row md:items-end" @submit.prevent="submit">
        <label class="block flex-1">
          <span class="mb-1 block text-xs font-black text-ink">Email tài khoản</span>
          <input v-model="email" type="email" autocomplete="off" placeholder="giaovien@truong.edu.vn" class="w-full min-h-[44px] rounded-brut border-2 border-line bg-surface px-3 text-sm text-ink" />
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-black text-ink">Vai trò</span>
          <select v-model="role" class="min-h-[44px] rounded-brut border-2 border-line bg-surface px-3 text-sm text-ink cursor-pointer">
            <option value="teacher">Giáo viên</option>
            <option value="student">Học viên</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </label>
        <BaseButton type="submit" variant="primary" size="md" :disabled="isSaving">
          <RefreshCw v-if="isSaving" class="h-4 w-4 animate-spin" />
          <UserCog v-else class="h-4 w-4" :stroke-width="2.5" />
          <span>Cập nhật vai trò</span>
        </BaseButton>
      </form>
      <p v-if="message" class="rounded-brut border-2 p-2 text-xs font-bold" :class="message.kind === 'ok' ? 'border-line bg-ok/20 text-ink' : 'border-bad bg-bad/10 text-bad'" :role="message.kind === 'ok' ? 'status' : 'alert'">
        {{ message.text }}
      </p>

      <div class="overflow-x-auto rounded-brut border-2 border-line">
        <table class="w-full text-left text-xs text-ink">
          <thead class="bg-surface-2">
            <tr>
              <th scope="col" class="p-2 font-black">Tên</th>
              <th scope="col" class="p-2 font-black">Email</th>
              <th scope="col" class="p-2 font-black">Vai trò</th>
              <th scope="col" class="p-2 text-right font-black">Số lớp</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in staff" :key="s.user_id" class="border-t border-line/20">
              <td class="p-2 font-bold">{{ s.full_name || '–' }}</td>
              <td class="p-2">{{ s.email }}</td>
              <td class="p-2">{{ ROLE_LABEL[s.role] }}</td>
              <td class="p-2 text-right tabular-nums">{{ s.class_count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </BaseCard>
</template>
