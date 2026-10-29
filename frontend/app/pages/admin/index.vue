<script setup lang="ts">
import {
  FileSpreadsheet,
  BookOpen,
  Keyboard,
  BookMarked,
  Play,
  Search,
  Trophy,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
} from '@lucide/vue'
import PageBanner from '~/components/common/PageBanner.vue'
import type { Database } from '~/types/database.types'
import AdminRolesPanel from '~/components/admin/AdminRolesPanel.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({
  title: 'Quản trị nội dung - Langua Admin',
})

const client = useSupabaseClient<Database>()

// Số bản ghi theo trạng thái duyệt (draft / pending / published) cho từng loại nội dung
type Counts = { total: number; draft: number; pending: number; published: number }
const stats = ref<Record<string, Counts>>({})
const isLoadingStats = ref(true)
const { reviewCounts } = useAdmin()

// Lịch sử 10 lần import gần nhất
const importLogs = ref<any[]>([])
const isLoadingLogs = ref(true)

const pendingTotal = computed(() => Object.values(stats.value).reduce((sum, c) => sum + (c.pending || 0), 0))

const loadDashboardData = async () => {
  isLoadingStats.value = true
  isLoadingLogs.value = true

  try {
    const [counts, dict] = await Promise.all([
      reviewCounts(),
      client.from('dictionary_entries').select('*', { count: 'exact', head: true }),
    ])
    stats.value = { ...counts, dictionary: { total: dict.count || 0, draft: 0, pending: 0, published: 0 } }
  } catch (e) {
    console.warn('Lỗi tải thống kê dashboard:', e)
  } finally {
    isLoadingStats.value = false
  }

  // 2. Tải 10 lần import gần nhất
  try {
    const { data: logs } = await client
      .from('content_import_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    importLogs.value = logs || []
  } catch (e) {
    console.warn('Lỗi tải import logs:', e)
  } finally {
    isLoadingLogs.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})

const featureCards = [
  { key: 'vocab', title: 'Từ vựng (Vocab)', path: '/admin/vocab', icon: BookOpen, tone: 'var(--c-pink)' },
  { key: 'typing', title: 'Gõ câu (Typing)', path: '/admin/typing', icon: Keyboard, tone: 'var(--c-green)' },
  { key: 'grammar', title: 'Ngữ pháp (Grammar)', path: '/admin/grammar', icon: BookOpen, tone: 'var(--c-yellow)' },
  { key: 'reading', title: 'Kho đọc & Dịch', path: '/admin/reading', icon: BookMarked, tone: 'var(--c-orange)' },
  { key: 'media', title: 'Video & Podcast', path: '/admin/media', icon: Play, tone: 'var(--c-blue)' },
  { key: 'dictionary', title: 'Từ điển chuyên sâu', path: '/admin/dictionary', icon: Search, tone: 'var(--c-violet)' },
  { key: 'ielts', title: 'Luyện thi IELTS', path: '/admin/ielts', icon: Trophy, tone: 'var(--c-coral)' },
]
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-6">
    <!-- Header banner -->
    <PageBanner
      title="Bảng điều khiển Quản trị viên"
      description="Quản lý và nạp dữ liệu học tập hàng loạt (CSV / JSON) cho toàn bộ hệ thống Langua."
      badge-text="Admin Panel"
      feature="admin"
    >
      <template #actions>
        <NuxtLink
          to="/admin/import"
          class="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-brut border-2 border-line bg-surface font-display text-xs font-black text-ink shadow-brut hover:bg-surface-2 brut-press text-decoration-none"
        >
          <FileSpreadsheet class="h-4 w-4" :stroke-width="2.5" />
          <span>Mở trình hướng dẫn Import mới</span>
        </NuxtLink>
      </template>
    </PageBanner>

    <div
      v-if="!isLoadingStats && pendingTotal > 0"
      class="flex flex-col gap-2 rounded-brut border-2 border-line bg-warn/20 p-4 sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <p class="flex items-center gap-2 text-sm font-bold text-ink">
        <Clock class="h-4 w-4 shrink-0" :stroke-width="2.5" aria-hidden="true" />
        Có {{ pendingTotal }} mục đang chờ duyệt.
      </p>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="item in featureCards.filter((c) => stats[c.key]?.pending)"
          :key="item.key"
          :to="`${item.path}?status=pending`"
          class="min-h-[44px] inline-flex items-center gap-1 rounded-brut border-2 border-line bg-surface px-3 text-xs font-black text-ink shadow-brut-sm brut-press"
        >
          {{ item.title }}: {{ stats[item.key]?.pending }}
        </NuxtLink>
      </div>
    </div>

    <!-- Lưới thống kê các loại nội dung -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-display font-black text-base text-ink">Tổng quan kho nội dung</h3>
        <span class="text-xs text-ink-soft">Dữ liệu thời gian thực từ Supabase</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <BaseCard
          v-for="item in featureCards"
          :key="item.key"
          accent="left"
          :accent-color="item.tone"
          class="h-full flex flex-col justify-between"
        >
          <template #header>
            <h4 class="flex items-center gap-2 font-display text-sm font-black text-ink">
              <component :is="item.icon" class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" /> {{ item.title }}
            </h4>
          </template>
          <div class="space-y-2 mt-1">
            <div class="flex items-baseline justify-between">
              <span class="text-xs text-ink-soft font-bold">{{ item.key === 'vocab' ? 'Bộ hệ thống:' : 'Tổng số bản ghi:' }}</span>
              <span class="font-display font-black text-xl text-ink tabular-nums">
                {{ isLoadingStats ? '...' : stats[item.key]?.total || 0 }}
              </span>
            </div>

            <div v-if="item.key !== 'dictionary'" class="flex flex-wrap items-center justify-between gap-1">
              <span class="text-xs text-ink-soft font-bold">Duyệt:</span>
              <span class="flex flex-wrap gap-1 text-[11px] font-black">
                <span
                  class="px-2 py-0.5 rounded-brut border tabular-nums"
                  :class="stats[item.key]?.pending ? 'bg-warn/30 border-line text-ink' : 'bg-surface-2 border-line/40 text-ink-soft'"
                >
                  {{ isLoadingStats ? '...' : stats[item.key]?.pending || 0 }} chờ duyệt
                </span>
                <span class="px-2 py-0.5 rounded-brut border border-line/40 bg-surface-2 text-ink-soft tabular-nums">
                  {{ isLoadingStats ? '...' : stats[item.key]?.draft || 0 }} nháp
                </span>
              </span>
            </div>
          </div>

          <template #footer>
            <div class="flex items-center justify-between pt-2">
              <NuxtLink
                :to="item.path"
                class="min-h-[44px] inline-flex items-center gap-1 text-xs font-bold text-ink hover:underline"
              >
                <span>Quản lý</span>
                <ArrowRight class="h-3 w-3" />
              </NuxtLink>

              <NuxtLink
                :to="`/admin/import?type=${item.key}`"
                class="min-h-[44px] inline-flex items-center text-[11px] font-bold text-ink-soft hover:text-ink underline"
              >
                + Nạp thêm
              </NuxtLink>
            </div>
          </template>
        </BaseCard>
      </div>
    </div>

    <!-- 10 lần import gần nhất từ content_import_logs -->
    <BaseCard>
      <template #header>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="flex items-center gap-2 font-display text-base font-black text-ink">
            <History class="h-4 w-4" :stroke-width="2.5" aria-hidden="true" /> 10 lần nạp nội dung gần nhất
          </h3>
          <NuxtLink to="/admin/nhat-ky?action=import" class="min-h-[44px] inline-flex items-center gap-1 text-xs font-bold text-ink hover:underline">
            <span>Toàn bộ nhật ký</span>
            <ArrowRight class="h-3 w-3" />
          </NuxtLink>
        </div>
      </template>
      <div v-if="isLoadingLogs" class="py-6 text-center text-xs text-ink-soft">
        Đang tải lịch sử import...
      </div>

      <div v-else-if="importLogs.length === 0" class="py-6 text-center text-xs text-ink-soft">
        Chưa có lịch sử nạp nội dung nào được ghi nhận.
      </div>

      <div v-else class="overflow-x-auto border-2 border-line rounded-brut">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-surface-2 border-b-2 border-line font-display font-black">
            <tr>
              <th class="p-2.5 border-r border-line">Thời gian</th>
              <th class="p-2.5 border-r border-line">Loại nội dung</th>
              <th class="p-2.5 border-r border-line">Tên file</th>
              <th class="p-2.5 border-r border-line text-center">Tổng dòng</th>
              <th class="p-2.5 border-r border-line text-center">Thành công</th>
              <th class="p-2.5 border-r border-line text-center">Lỗi</th>
              <th class="p-2.5">Trạng thái</th>
            </tr>
          </thead>
          <tbody class="divide-y border-line">
            <tr v-for="log in importLogs" :key="log.id" class="bg-surface hover:bg-surface-2/20">
              <td class="p-2 border-r border-line font-mono text-[11px] text-ink-soft">
                {{ new Date(log.created_at).toLocaleString('vi-VN') }}
              </td>
              <td class="p-2 border-r border-line font-bold uppercase text-[11px]">
                {{ log.content_type }}
              </td>
              <td class="p-2 border-r border-line font-mono text-[11px] max-w-[180px] truncate" :title="log.file_name">
                {{ log.file_name }}
              </td>
              <td class="p-2 border-r border-line text-center font-bold">{{ log.rows_total }}</td>
              <td class="p-2 border-r border-line text-center text-ok font-black">{{ log.rows_ok }}</td>
              <td class="p-2 border-r border-line text-center text-bad font-black">{{ log.rows_failed }}</td>
              <td class="p-2">
                <span
                  class="inline-block px-2 py-0.5 rounded-brut border border-line text-[10px] font-black"
                  :class="[
                    log.status === 'completed' ? 'bg-ok/20 text-ok' :
                    log.status === 'partial' ? 'bg-warn/30 text-on-tone' : 'bg-bad/20 text-bad'
                  ]"
                >
                  {{ log.status === 'completed' ? 'Thành công' : log.status === 'partial' ? 'Một phần' : 'Thất bại' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>

    <!-- Phân quyền giáo viên -->
    <AdminRolesPanel />
  </div>
</template>
