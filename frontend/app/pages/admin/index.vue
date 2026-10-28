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
import type { Database } from '~/types/database.types'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({
  title: 'Quản trị nội dung - Langua Admin',
})

const client = useSupabaseClient<Database>()

// State thống kê số lượng bản ghi
const stats = ref({
  vocab: { total: 0, drafts: 0 },
  typing: { total: 0, drafts: 0 },
  grammar: { total: 0, drafts: 0 },
  reading: { total: 0, drafts: 0 },
  media: { total: 0, drafts: 0 },
  dictionary: { total: 0, drafts: 0 },
  ielts: { total: 0, drafts: 0 },
})
const isLoadingStats = ref(true)

// Lịch sử 10 lần import gần nhất
const importLogs = ref<any[]>([])
const isLoadingLogs = ref(true)

const loadDashboardData = async () => {
  isLoadingStats.value = true
  isLoadingLogs.value = true

  try {
    // 1. Đếm song song các bảng
    const [
      vocabTotal, vocabDrafts,
      typingTotal, typingDrafts,
      grammarTotal, grammarDrafts,
      readingTotal, readingDrafts,
      mediaTotal, mediaDrafts,
      dictTotal,
      ieltsTotal, ieltsDrafts,
    ] = await Promise.all([
      client.from('vocab_sets').select('*', { count: 'exact', head: true }),
      client.from('vocab_sets').select('*', { count: 'exact', head: true }).eq('is_published', false),
      client.from('typing_topics').select('*', { count: 'exact', head: true }),
      client.from('typing_topics').select('*', { count: 'exact', head: true }).eq('is_published', false),
      client.from('grammar_points').select('*', { count: 'exact', head: true }),
      client.from('grammar_points').select('*', { count: 'exact', head: true }).eq('is_published', false),
      client.from('reading_items').select('*', { count: 'exact', head: true }),
      client.from('reading_items').select('*', { count: 'exact', head: true }).eq('is_published', false),
      client.from('media_items').select('*', { count: 'exact', head: true }),
      client.from('media_items').select('*', { count: 'exact', head: true }).eq('is_published', false),
      client.from('dictionary_entries').select('*', { count: 'exact', head: true }),
      client.from('exam_tests').select('*', { count: 'exact', head: true }),
      client.from('exam_tests').select('*', { count: 'exact', head: true }).eq('is_published', false),
    ])

    stats.value = {
      vocab: { total: vocabTotal.count || 0, drafts: vocabDrafts.count || 0 },
      typing: { total: typingTotal.count || 0, drafts: typingDrafts.count || 0 },
      grammar: { total: grammarTotal.count || 0, drafts: grammarDrafts.count || 0 },
      reading: { total: readingTotal.count || 0, drafts: readingDrafts.count || 0 },
      media: { total: mediaTotal.count || 0, drafts: mediaDrafts.count || 0 },
      dictionary: { total: dictTotal.count || 0, drafts: 0 },
      ielts: { total: ieltsTotal.count || 0, drafts: ieltsDrafts.count || 0 },
    }
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
          :title="item.title"
          accent="left"
          :accent-color="item.tone"
          class="h-full flex flex-col justify-between"
        >
          <div class="space-y-2 mt-1">
            <div class="flex items-baseline justify-between">
              <span class="text-xs text-ink-soft font-bold">Tổng số bản ghi:</span>
              <span class="font-display font-black text-xl text-ink">
                {{ isLoadingStats ? '...' : (stats as any)[item.key]?.total || 0 }}
              </span>
            </div>

            <div v-if="item.key !== 'dictionary'" class="flex items-baseline justify-between">
              <span class="text-xs text-ink-soft font-bold">Bản nháp chờ duyệt:</span>
              <span
                class="font-display font-black text-xs px-2 py-0.5 rounded-brut border"
                :class="(stats as any)[item.key]?.drafts > 0 ? 'bg-warn/20 border-line text-ink' : 'bg-surface-2 border-line/40 text-ink-soft'"
              >
                {{ isLoadingStats ? '...' : (stats as any)[item.key]?.drafts || 0 }} bản nháp
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
    <BaseCard title="10 lần nạp nội dung gần nhất (Audit Log)">
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
  </div>
</template>
