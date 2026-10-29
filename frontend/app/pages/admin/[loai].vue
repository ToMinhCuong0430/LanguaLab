<script setup lang="ts">
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Download,
  Plus,
  ArrowLeft,
  X,
  AlertTriangle,
  RefreshCw,
  Send,
  Undo2,
} from '@lucide/vue'
import { stringifyCsv } from '~/utils/csvParser'
import ExamQuestionsEditor from '~/components/admin/ExamQuestionsEditor.vue'
import type { Database } from '~/types/database.types'
import { REVIEW_LABEL, formatDateTime, type ReviewResult, type ReviewStatus, type ReviewType } from '~/composables/useAdmin'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const route = useRoute()
const client = useSupabaseClient<Database>()

// Xác định loại nội dung từ URL param
const loai = computed(() => route.params.loai as string)

// Tiêu đề & Cấu hình theo từng loại
const TYPE_CONFIGS: Record<string, {
  tableName: string
  title: string
  idField: string
  titleField: string
  hasPublish: boolean
  hasLicense: boolean
  hasLanguage: boolean
  hasLevel: boolean
}> = {
  vocab: {
    tableName: 'vocab_sets',
    title: 'Bộ từ vựng (Vocab Sets)',
    idField: 'id',
    titleField: 'title',
    hasPublish: true,
    hasLicense: false,
    hasLanguage: true,
    hasLevel: false,
  },
  typing: {
    tableName: 'typing_topics',
    title: 'Chủ đề gõ câu (Typing Topics)',
    idField: 'id',
    titleField: 'title',
    hasPublish: true,
    hasLicense: false,
    hasLanguage: true,
    hasLevel: true,
  },
  grammar: {
    tableName: 'grammar_points',
    title: 'Điểm ngữ pháp (Grammar Points)',
    idField: 'id',
    titleField: 'vietnamese_title',
    hasPublish: true,
    hasLicense: false,
    hasLanguage: true,
    hasLevel: true,
  },
  reading: {
    tableName: 'reading_items',
    title: 'Kho đọc và dịch (Reading Items)',
    idField: 'id',
    titleField: 'title',
    hasPublish: true,
    hasLicense: true,
    hasLanguage: true,
    hasLevel: true,
  },
  media: {
    tableName: 'media_items',
    title: 'Kho Video và Podcast',
    idField: 'id',
    titleField: 'title',
    hasPublish: true,
    hasLicense: false,
    hasLanguage: true,
    hasLevel: true,
  },
  dictionary: {
    tableName: 'dictionary_entries',
    title: 'Mục từ điển chuyên sâu',
    idField: 'id',
    titleField: 'headword',
    hasPublish: false,
    hasLicense: true,
    hasLanguage: true,
    hasLevel: false,
  },
  ielts: {
    tableName: 'exam_tests',
    title: 'Đề thi IELTS',
    idField: 'id',
    titleField: 'title',
    hasPublish: true,
    hasLicense: false,
    hasLanguage: false,
    hasLevel: false,
  },
}

const currentConfig = computed(() => TYPE_CONFIGS[loai.value] || {
  tableName: 'reading_items',
  title: 'Nội dung',
  idField: 'id',
  titleField: 'title',
  hasPublish: true,
  hasLicense: false,
  hasLanguage: true,
  hasLevel: true,
})

useHead({
  title: computed(() => `Quản lý ${currentConfig.value.title} - Langua Admin`),
})

// Bộ lọc & Phân trang Server-side
const searchQuery = ref('')
const selectedLang = ref<string>('all')
const selectedStatus = ref<string>(['draft', 'pending', 'published'].includes(String(route.query.status)) ? String(route.query.status) : 'all') // 'all' | ReviewStatus
const currentPage = ref(1)
const pageSize = ref(20)
const totalRecords = ref(0)
const items = ref<any[]>([])
const isLoading = ref(true)

// Chọn nhiều dòng (Batch actions)
const selectedIds = ref<string[]>([])
const isSelectAll = computed({
  get: () => items.value.length > 0 && selectedIds.value.length === items.value.length,
  set: (val: boolean) => {
    selectedIds.value = val ? items.value.map(i => i[currentConfig.value.idField]) : []
  },
})

// Ngăn trượt sửa nhanh (Slide-over editor)
const editingItem = ref<any | null>(null)
const isSlideOverOpen = ref(false)
const isSaving = ref(false)
const saveError = ref<string | null>(null)

// Tải dữ liệu từ Supabase
const loadItems = async () => {
  isLoading.value = true
  selectedIds.value = []
  const cfg = currentConfig.value

  try {
    let query = (client.from(cfg.tableName as any) as any).select('*', { count: 'exact' })

    // Lọc theo ngôn ngữ
    if (cfg.hasLanguage && selectedLang.value !== 'all') {
      query = query.eq('language', selectedLang.value)
    }

    // Lọc theo trạng thái xuất bản
    if (cfg.hasPublish && selectedStatus.value !== 'all') {
      query = query.eq('review_status', selectedStatus.value)
    }

    // Tìm kiếm văn bản
    if (searchQuery.value.trim()) {
      query = query.ilike(cfg.titleField, `%${searchQuery.value.trim()}%`)
    }

    // Phân trang
    const from = (currentPage.value - 1) * pageSize.value
    const to = from + pageSize.value - 1

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.warn('Lỗi tải danh sách:', error.message)
    } else {
      items.value = data || []
      totalRecords.value = count || 0
    }
  } catch (err: any) {
    console.warn('Lỗi truy vấn:', err)
  } finally {
    isLoading.value = false
  }
}

watch([searchQuery, selectedLang, selectedStatus], () => {
  currentPage.value = 1
  loadItems()
})

watch(currentPage, () => {
  loadItems()
})

onMounted(() => {
  loadItems()
})

// ---- Quy trình duyệt: draft -> pending -> published (RPC set_review_status ghi lịch sử & nhật ký) ----
const { setReviewStatus, reviewHistory } = useAdmin()
const reviewFlash = ref<{ kind: 'ok' | 'error'; text: string; skipped?: ReviewResult['skipped'] } | null>(null)
const reviewingIds = ref<string[]>([])

// Bộ từ cá nhân của học viên không qua duyệt
const inWorkflow = (item: any) => currentConfig.value.hasPublish && (loai.value !== 'vocab' || item.is_system !== false)

const REVIEW_DONE: Record<ReviewStatus, string> = {
  pending: 'Đã gửi duyệt',
  published: 'Đã duyệt và xuất bản',
  draft: 'Đã chuyển về nháp',
}

const runReview = async (ids: string[], status: ReviewStatus, note?: string) => {
  if (!ids.length) return
  reviewingIds.value = ids
  reviewFlash.value = null
  try {
    const res = await setReviewStatus(loai.value as ReviewType, ids, status, note)
    reviewFlash.value = {
      kind: res.updated > 0 ? 'ok' : 'error',
      text: res.updated > 0 ? `${REVIEW_DONE[status]} ${res.updated} mục.` : 'Không mục nào được chuyển trạng thái.',
      skipped: res.skipped,
    }
    await loadItems()
  } catch (e: any) {
    reviewFlash.value = { kind: 'error', text: e.message }
  } finally {
    reviewingIds.value = []
  }
}

// Trả về nháp / gỡ xuất bản qua hộp thoại ghi chú (trả về nháp bắt buộc có lý do)
const noteDialog = ref<{ ids: string[]; mode: 'reject' | 'unpublish' } | null>(null)
const noteText = ref('')
const noteError = ref('')
const openNoteDialog = (ids: string[], mode: 'reject' | 'unpublish') => {
  noteDialog.value = { ids, mode }
  noteText.value = ''
  noteError.value = ''
}
const confirmNote = async () => {
  if (!noteDialog.value) return
  if (noteDialog.value.mode === 'reject' && noteText.value.trim().length < 3) {
    noteError.value = 'Ghi lý do trả về để người soạn biết cần sửa gì.'
    return
  }
  const { ids } = noteDialog.value
  noteDialog.value = null
  await runReview(ids, 'draft', noteText.value)
}

// Ghi chú duyệt gần nhất hiển thị trong ngăn sửa nhanh
const lastReview = ref<Awaited<ReturnType<typeof reviewHistory>>[number] | null>(null)

// Xoá hàng loạt
const batchDelete = async () => {
  if (selectedIds.value.length === 0) return
  const cfg = currentConfig.value

  if (!confirm(`HÀNH ĐỘNG NGUY HIỂM: Bạn có chắc muốn XOÁ VĨNH VIỄN ${selectedIds.value.length} bản ghi đã chọn? Thao tác này không thể hoàn tác.`)) {
    return
  }

  try {
    const { error } = await (client.from(cfg.tableName as any) as any)
      .delete()
      .in(cfg.idField, selectedIds.value)

    if (error) {
      alert(`Lỗi xoá dữ liệu: ${error.message}`)
    } else {
      await loadItems()
    }
  } catch (e: any) {
    alert(`Lỗi hệ thống: ${e.message}`)
  }
}

// Mở ngăn trượt sửa nhanh
const openEditSlideOver = (item: any) => {
  editingItem.value = JSON.parse(JSON.stringify(item))
  saveError.value = null
  isSlideOverOpen.value = true
  lastReview.value = null
  if (inWorkflow(item)) {
    reviewHistory(loai.value as ReviewType, String(item[currentConfig.value.idField]))
      .then((rows) => { lastReview.value = rows[0] ?? null })
      .catch(() => { lastReview.value = null })
  }
}

// Lưu chỉnh sửa từ Slide-over
const saveEdit = async () => {
  if (!editingItem.value) return
  const cfg = currentConfig.value
  isSaving.value = true
  saveError.value = null

  try {
    // Trạng thái duyệt chỉ đổi qua quy trình duyệt, không ghi từ form sửa
    const { is_published: _p, review_status: _r, ...payload } = editingItem.value
    const { error } = await (client.from(cfg.tableName as any) as any)
      .update(payload)
      .eq(cfg.idField, editingItem.value[cfg.idField])

    if (error) {
      saveError.value = error.message
    } else {
      isSlideOverOpen.value = false
      await loadItems()
    }
  } catch (e: any) {
    saveError.value = e.message
  } finally {
    isSaving.value = false
  }
}

// Xuất danh sách đang xem ra CSV hoặc JSON
const exportData = (format: 'csv' | 'json') => {
  if (items.value.length === 0) return

  let content = ''
  let mimeType = 'text/csv'
  let fileName = `${loai.value}_export.${format}`

  if (format === 'json') {
    content = JSON.stringify(items.value, null, 2)
    mimeType = 'application/json'
  } else {
    content = stringifyCsv(items.value)
    mimeType = 'text/csv;charset=utf-8;'
  }

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-6">
    <!-- Header banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-[3px] border-line rounded-brut-lg bg-surface p-5 shadow-brut">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <NuxtLink to="/admin" class="min-h-[44px] inline-flex items-center text-xs font-bold text-ink-soft hover:text-ink gap-1">
            <ArrowLeft class="h-3.5 w-3.5" /> Quản trị
          </NuxtLink>
          <span class="text-xs text-ink-soft">/</span>
          <span class="text-xs font-bold uppercase text-ink">{{ loai }}</span>
        </div>
        <h1 class="font-display font-black text-2xl text-ink">{{ currentConfig.title }}</h1>
        <p class="text-xs text-ink-soft">Tổng số {{ totalRecords }} bản ghi trong hệ thống</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-brut border-2 border-line bg-surface font-display text-xs font-bold text-ink shadow-brut-sm hover:bg-surface-2 cursor-pointer"
          @click="exportData('csv')"
        >
          <Download class="h-3.5 w-3.5" />
          <span>Xuất CSV</span>
        </button>

        <button
          type="button"
          class="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-brut border-2 border-line bg-surface font-display text-xs font-bold text-ink shadow-brut-sm hover:bg-surface-2 cursor-pointer"
          @click="exportData('json')"
        >
          <Download class="h-3.5 w-3.5" />
          <span>Xuất JSON</span>
        </button>

        <NuxtLink
          :to="`/admin/import?type=${loai}`"
          class="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-brut border-2 border-line bg-warn font-display text-xs font-black text-on-tone shadow-brut hover:bg-warn/80 brut-press text-decoration-none"
        >
          <Plus class="h-4 w-4" :stroke-width="2.5" />
          <span>Import thêm dữ liệu</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Thanh công cụ tìm kiếm & bộ lọc -->
    <BaseCard>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Ô tìm kiếm -->
        <div class="lg:col-span-2 relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm theo tiêu đề hoặc từ khóa..."
            class="w-full min-h-[44px] pl-9 pr-3 py-2 text-xs rounded-brut border-2 border-line bg-surface text-ink focus:outline-none focus:border-ink"
          />
          <Search class="h-4 w-4 text-ink-soft absolute left-3 top-3.5" />
        </div>

        <!-- Lọc ngôn ngữ nếu có -->
        <div v-if="currentConfig.hasLanguage">
          <select
            v-model="selectedLang"
            class="w-full min-h-[44px] px-3 py-2 text-xs rounded-brut border-2 border-line bg-surface text-ink focus:outline-none cursor-pointer"
          >
            <option value="all">Tất cả ngôn ngữ</option>
            <option value="en">Tiếng Anh (en)</option>
            <option value="zh">Tiếng Trung (zh)</option>
            <option value="ja">Tiếng Nhật (ja)</option>
          </select>
        </div>

        <!-- Lọc trạng thái xuất bản nếu có -->
        <div v-if="currentConfig.hasPublish">
          <select
            v-model="selectedStatus"
            class="w-full min-h-[44px] px-3 py-2 text-xs rounded-brut border-2 border-line bg-surface text-ink focus:outline-none cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Bản nháp</option>
            <option value="pending">Chờ duyệt</option>
            <option value="published">Đã xuất bản</option>
          </select>
        </div>
      </div>

      <!-- Thanh tác vụ hàng loạt khi có chọn dòng -->
      <div
        v-if="selectedIds.length > 0"
        class="mt-4 p-3 rounded-brut border-2 border-line bg-surface-2 flex flex-wrap items-center justify-between gap-2"
      >
        <span class="text-xs font-bold text-ink">
          Đang chọn {{ selectedIds.length }} dòng:
        </span>
        <div class="flex items-center gap-2">
          <template v-if="currentConfig.hasPublish">
            <button
              type="button"
              class="min-h-[44px] px-3 py-1.5 rounded-brut border border-line bg-surface text-ink font-bold text-xs hover:bg-surface-2 cursor-pointer disabled:opacity-50"
              :disabled="reviewingIds.length > 0"
              @click="runReview([...selectedIds], 'pending')"
            >
              Gửi duyệt
            </button>
            <button
              type="button"
              class="min-h-[44px] px-3 py-1.5 rounded-brut border border-line bg-ok/20 text-ink font-bold text-xs hover:bg-ok/30 cursor-pointer disabled:opacity-50"
              :disabled="reviewingIds.length > 0"
              @click="runReview([...selectedIds], 'published')"
            >
              Duyệt &amp; xuất bản
            </button>
            <button
              type="button"
              class="min-h-[44px] px-3 py-1.5 rounded-brut border border-line bg-surface text-ink-soft font-bold text-xs hover:bg-surface-2 cursor-pointer disabled:opacity-50"
              :disabled="reviewingIds.length > 0"
              @click="openNoteDialog([...selectedIds], 'unpublish')"
            >
              Chuyển về nháp
            </button>
          </template>
          <button
            type="button"
            class="min-h-[44px] px-3 py-1.5 rounded-brut border border-line bg-bad/20 text-bad font-bold text-xs hover:bg-bad/30 cursor-pointer"
            @click="batchDelete"
          >
            Xoá hàng loạt
          </button>
        </div>
      </div>
      <div
        v-if="reviewFlash"
        class="mt-4 rounded-brut border-2 p-3 text-xs"
        :class="reviewFlash.kind === 'ok' ? 'border-line bg-ok/15 text-ink' : 'border-bad bg-bad/10 text-ink'"
        :role="reviewFlash.kind === 'ok' ? 'status' : 'alert'"
      >
        <div class="flex items-start justify-between gap-3">
          <p class="font-bold">{{ reviewFlash.text }}</p>
          <button type="button" class="min-h-[32px] min-w-[32px] inline-flex items-center justify-center cursor-pointer" aria-label="Đóng thông báo" @click="reviewFlash = null">
            <X class="h-4 w-4" />
          </button>
        </div>
        <ul v-if="reviewFlash.skipped?.length" class="mt-1 space-y-0.5 text-ink-soft">
          <li v-for="sk in reviewFlash.skipped" :key="sk.id">Bỏ qua "{{ sk.title }}": {{ sk.reason }}</li>
        </ul>
      </div>
    </BaseCard>

    <!-- Bảng dữ liệu chính cuộn ngang an toàn ở mobile -->
    <div class="border-[3px] border-line rounded-brut-lg bg-surface shadow-brut overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="bg-surface-2 border-b-2 border-line font-display font-black">
            <tr>
              <th class="p-3 border-r border-line w-10 text-center">
                <input
                  v-model="isSelectAll"
                  type="checkbox"
                  class="h-4 w-4 rounded border-2 border-line accent-warn cursor-pointer"
                />
              </th>
              <th class="p-3 border-r border-line w-16">Mã / ID</th>
              <th class="p-3 border-r border-line min-w-[200px]">Tiêu đề / Nội dung</th>
              <th v-if="currentConfig.hasLanguage" class="p-3 border-r border-line w-20 text-center">Ngôn ngữ</th>
              <th v-if="currentConfig.hasLevel" class="p-3 border-r border-line w-20 text-center">Cấp độ</th>
              <th v-if="currentConfig.hasLicense" class="p-3 border-r border-line w-28">Bản quyền</th>
              <th v-if="currentConfig.hasPublish" class="p-3 border-r border-line w-44">Trạng thái duyệt</th>
              <th class="p-3 text-center w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y border-line">
            <!-- Loading skeleton -->
            <tr v-if="isLoading" v-for="n in 5" :key="n" class="animate-pulse">
              <td colspan="8" class="p-4 text-center text-xs text-ink-soft">
                Đang tải dữ liệu từ máy chủ...
              </td>
            </tr>

            <!-- Rỗng -->
            <tr v-else-if="items.length === 0">
              <td colspan="8" class="p-8 text-center text-xs text-ink-soft">
                Không tìm thấy bản ghi nào phù hợp với bộ lọc hiện tại.
              </td>
            </tr>

            <!-- Danh sách dữ liệu -->
            <tr
              v-else
              v-for="item in items"
              :key="item[currentConfig.idField]"
              class="bg-surface hover:bg-surface-2/30 transition-colors"
            >
              <td class="p-3 border-r border-line text-center">
                <input
                  v-model="selectedIds"
                  :value="item[currentConfig.idField]"
                  type="checkbox"
                  class="h-4 w-4 rounded border-2 border-line accent-warn cursor-pointer"
                />
              </td>

              <td class="p-3 border-r border-line font-mono text-[11px] text-ink-soft max-w-[120px] truncate" :title="item[currentConfig.idField]">
                {{ item[currentConfig.idField] }}
              </td>

              <td class="p-3 border-r border-line font-bold text-ink">
                <div>{{ item[currentConfig.titleField] || item.title || item.headword }}</div>
                <div v-if="item.vietnamese_title" class="text-[11px] font-normal text-ink-soft">
                  {{ item.vietnamese_title }}
                </div>
              </td>

              <td v-if="currentConfig.hasLanguage" class="p-3 border-r border-line text-center uppercase font-mono text-[11px]">
                {{ item.language || '-' }}
              </td>

              <td v-if="currentConfig.hasLevel" class="p-3 border-r border-line text-center font-bold text-[11px]">
                {{ item.level || '-' }}
              </td>

              <td v-if="currentConfig.hasLicense" class="p-3 border-r border-line text-[11px]">
                <span
                  class="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                  :class="item.license ? 'bg-surface-2 text-ink border border-line' : 'bg-bad/20 text-bad'"
                >
                  {{ item.license || 'Chưa có' }}
                </span>
              </td>

              <td v-if="currentConfig.hasPublish" class="p-3 border-r border-line">
                <span v-if="!inWorkflow(item)" class="text-[11px] font-bold text-ink-soft">Bộ cá nhân</span>
                <div v-else class="flex flex-col items-start gap-1.5">
                  <BaseBadge
                    size="sm"
                    :tone="item.review_status === 'published' ? 'green' : item.review_status === 'pending' ? 'yellow' : 'neutral'"
                  >
                    {{ REVIEW_LABEL[item.review_status as ReviewStatus] ?? item.review_status }}
                  </BaseBadge>
                  <div class="flex flex-wrap gap-1">
                    <button
                      v-if="item.review_status === 'draft'"
                      type="button"
                      class="min-h-[36px] inline-flex items-center gap-1 px-2 rounded-brut border border-line bg-surface text-[11px] font-bold text-ink hover:bg-surface-2 cursor-pointer disabled:opacity-50"
                      :disabled="reviewingIds.includes(item[currentConfig.idField])"
                      @click="runReview([item[currentConfig.idField]], 'pending')"
                    >
                      <Send class="h-3 w-3" aria-hidden="true" /> Gửi duyệt
                    </button>
                    <template v-else-if="item.review_status === 'pending'">
                      <button
                        type="button"
                        class="min-h-[36px] inline-flex items-center gap-1 px-2 rounded-brut border border-line bg-ok/20 text-[11px] font-bold text-ink hover:bg-ok/30 cursor-pointer disabled:opacity-50"
                        :disabled="reviewingIds.includes(item[currentConfig.idField])"
                        @click="runReview([item[currentConfig.idField]], 'published')"
                      >
                        <CheckCircle2 class="h-3 w-3" aria-hidden="true" /> Duyệt
                      </button>
                      <button
                        type="button"
                        class="min-h-[36px] inline-flex items-center gap-1 px-2 rounded-brut border border-line bg-surface text-[11px] font-bold text-ink hover:bg-surface-2 cursor-pointer"
                        @click="openNoteDialog([item[currentConfig.idField]], 'reject')"
                      >
                        <Undo2 class="h-3 w-3" aria-hidden="true" /> Trả về
                      </button>
                    </template>
                    <button
                      v-else
                      type="button"
                      class="min-h-[36px] inline-flex items-center gap-1 px-2 rounded-brut border border-line bg-surface text-[11px] font-bold text-ink-soft hover:bg-surface-2 cursor-pointer"
                      @click="openNoteDialog([item[currentConfig.idField]], 'unpublish')"
                    >
                      <XCircle class="h-3 w-3" aria-hidden="true" /> Gỡ xuất bản
                    </button>
                  </div>
                </div>
              </td>

              <td class="p-3 text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    class="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-brut border border-line hover:bg-surface-2 text-ink cursor-pointer"
                    title="Chỉnh sửa nhanh"
                    aria-label="Chỉnh sửa nhanh"
                    @click="openEditSlideOver(item)"
                  >
                    <Edit2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Phân trang -->
      <div class="p-3 border-t-2 border-line bg-surface flex items-center justify-between">
        <span class="text-xs text-ink-soft">
          Trang {{ currentPage }} / {{ Math.max(1, Math.ceil(totalRecords / pageSize)) }}
        </span>

        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class="min-h-[44px] px-3 py-1.5 rounded-brut border-2 border-line text-xs font-bold disabled:opacity-40 cursor-pointer"
            :disabled="currentPage <= 1"
            @click="currentPage--"
          >
            Trang trước
          </button>
          <button
            type="button"
            class="min-h-[44px] px-3 py-1.5 rounded-brut border-2 border-line text-xs font-bold disabled:opacity-40 cursor-pointer"
            :disabled="currentPage * pageSize >= totalRecords"
            @click="currentPage++"
          >
            Trang sau
          </button>
        </div>
      </div>
    </div>

    <!-- Hộp thoại sửa nhanh (Slide-over / Modal Editor) -->
    <BaseModal
      v-model="isSlideOverOpen"
      max-width="lg"
      :title="`Chỉnh sửa: ${editingItem?.[currentConfig.idField] || ''}`"
    >
      <div class="space-y-4">
        <div v-if="saveError" class="p-3 rounded-brut border-2 border-bad bg-bad/10 text-xs font-bold text-bad">
          {{ saveError }}
        </div>

        <div>
          <label class="block text-xs font-black text-ink mb-1">Tiêu đề chính / Từ vựng:</label>
          <input
            v-if="editingItem"
            v-model="editingItem[currentConfig.titleField]"
            type="text"
            class="w-full min-h-[44px] p-2 text-xs rounded-brut border-2 border-line bg-surface text-ink"
          />
        </div>

        <div v-if="editingItem && editingItem.vietnamese_title !== undefined">
          <label class="block text-xs font-black text-ink mb-1">Tiêu đề tiếng Việt:</label>
          <input
            v-model="editingItem.vietnamese_title"
            type="text"
            class="w-full min-h-[44px] p-2 text-xs rounded-brut border-2 border-line bg-surface text-ink"
          />
        </div>

        <div v-if="editingItem && currentConfig.hasLicense">
          <label class="block text-xs font-black text-ink mb-1">Giấy phép bản quyền (License):</label>
          <select
            v-model="editingItem.license"
            class="w-full min-h-[44px] p-2 text-xs rounded-brut border-2 border-line bg-surface text-ink cursor-pointer"
          >
            <option value="public_domain">Public Domain (Miền công cộng)</option>
            <option value="original">Original (Tự biên soạn độc quyền)</option>
            <option value="licensed">Licensed (Có giấy phép sử dụng)</option>
          </select>
        </div>

        <div v-if="editingItem && inWorkflow(editingItem)" class="pt-2 space-y-2">
          <p class="text-xs font-black text-ink">Trạng thái duyệt</p>
          <div class="flex flex-wrap items-center gap-2">
            <BaseBadge
              size="sm"
              :tone="editingItem.review_status === 'published' ? 'green' : editingItem.review_status === 'pending' ? 'yellow' : 'neutral'"
            >
              {{ REVIEW_LABEL[editingItem.review_status as ReviewStatus] ?? editingItem.review_status }}
            </BaseBadge>
            <span class="text-[11px] text-ink-soft">Đổi trạng thái bằng các nút ở cột Trạng thái duyệt.</span>
          </div>
          <p v-if="lastReview?.note" class="rounded-brut border-2 border-line bg-warn/15 p-2 text-xs text-ink">
            <span class="font-bold">Ghi chú duyệt ({{ formatDateTime(lastReview.created_at) }}):</span> {{ lastReview.note }}
          </p>
        </div>

        <!-- Đề IELTS: tạo / sửa câu hỏi kèm giải thích và dẫn chứng (lưu riêng từng câu) -->
        <ExamQuestionsEditor
          v-if="editingItem && loai === 'ielts'"
          :test-id="editingItem.id"
          :skill="editingItem.skill"
          :passage-content="editingItem.passage_content"
          :audio-script="editingItem.audio_script"
        />
      </div>

      <template #footer>
        <div class="flex items-center justify-between w-full">
          <BaseButton tone="neutral" @click="isSlideOverOpen = false">
            <span>Hủy bỏ</span>
          </BaseButton>

          <BaseButton tone="ok" :disabled="isSaving" @click="saveEdit">
            <RefreshCw v-if="isSaving" class="h-3.5 w-3.5 animate-spin mr-1" />
            <span>Lưu thay đổi</span>
          </BaseButton>
        </div>
      </template>
    </BaseModal>

    <!-- Ghi chú khi trả về nháp / gỡ xuất bản -->
    <BaseModal
      :model-value="!!noteDialog"
      :title="noteDialog?.mode === 'reject' ? 'Trả về bản nháp' : 'Chuyển về bản nháp'"
      max-width="md"
      @update:model-value="noteDialog = null"
    >
      <form v-if="noteDialog" class="space-y-3 text-sm text-ink" @submit.prevent="confirmNote">
        <p>
          {{ noteDialog.ids.length }} mục sẽ về trạng thái Bản nháp
          <template v-if="noteDialog.mode === 'unpublish'"> và không còn hiển thị với người học</template>.
          <template v-if="noteDialog.mode === 'unpublish' && noteDialog.ids.length > 1"> Mục đang chờ duyệt cần có ghi chú lý do.</template>
        </p>
        <label class="block">
          <span class="mb-1 block text-xs font-black">
            {{ noteDialog.mode === 'reject' ? 'Lý do trả về' : 'Ghi chú (không bắt buộc)' }}
            <span v-if="noteDialog.mode === 'reject'" class="text-bad" aria-hidden="true">*</span>
          </span>
          <textarea
            v-model="noteText"
            rows="3"
            maxlength="1000"
            :required="noteDialog.mode === 'reject'"
            placeholder="Ví dụ: Thiếu câu ví dụ cho mục 3, đáp án câu 5 chưa đúng"
            class="w-full rounded-brut border-2 border-line bg-surface p-3 text-sm"
          />
        </label>
        <p v-if="noteError" class="rounded-brut border-2 border-bad bg-bad/10 p-2 text-xs font-bold text-bad" role="alert">{{ noteError }}</p>
        <div class="flex justify-end gap-2">
          <BaseButton type="button" variant="secondary" size="md" @click="noteDialog = null">Huỷ</BaseButton>
          <BaseButton type="submit" variant="primary" size="md">
            <Undo2 class="h-4 w-4" :stroke-width="2.5" />
            <span>Chuyển về nháp</span>
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
