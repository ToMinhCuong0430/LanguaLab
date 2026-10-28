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
} from '@lucide/vue'
import { stringifyCsv } from '~/utils/csvParser'
import type { Database } from '~/types/database.types'

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
const selectedStatus = ref<string>('all') // 'all' | 'published' | 'draft'
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
      query = query.eq('is_published', selectedStatus.value === 'published')
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

// Bật/tắt xuất bản 1 dòng
const togglePublish = async (item: any) => {
  const cfg = currentConfig.value
  if (!cfg.hasPublish) return

  const nextStatus = !item.is_published

  // Kiểm tra điều kiện ràng buộc: Nếu là reading_items, license bắt buộc phải hợp lệ
  if (nextStatus && cfg.hasLicense && (!item.license || !['public_domain', 'original', 'licensed'].includes(item.license))) {
    alert('Không thể xuất bản: Bài đọc này chưa khai báo giấy phép bản quyền hợp lệ (public_domain, original, hoặc licensed).')
    return
  }

  try {
    const { error } = await (client.from(cfg.tableName as any) as any)
      .update({ is_published: nextStatus })
      .eq(cfg.idField, item[cfg.idField])

    if (error) {
      alert(`Lỗi khi đổi trạng thái: ${error.message}`)
    } else {
      item.is_published = nextStatus
    }
  } catch (e: any) {
    alert(`Lỗi hệ thống: ${e.message}`)
  }
}

// Xuất bản hàng loạt
const batchPublish = async (publish: boolean) => {
  if (selectedIds.value.length === 0) return
  const cfg = currentConfig.value
  if (!cfg.hasPublish) return

  if (!confirm(`Bạn có chắc muốn ${publish ? 'XUẤT BẢN' : 'GỠ XUẤT BẢN'} ${selectedIds.value.length} bản ghi đã chọn?`)) {
    return
  }

  try {
    const { error } = await (client.from(cfg.tableName as any) as any)
      .update({ is_published: publish })
      .in(cfg.idField, selectedIds.value)

    if (error) {
      alert(`Lỗi xử lý hàng loạt: ${error.message}`)
    } else {
      await loadItems()
    }
  } catch (e: any) {
    alert(`Lỗi hệ thống: ${e.message}`)
  }
}

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
}

// Lưu chỉnh sửa từ Slide-over
const saveEdit = async () => {
  if (!editingItem.value) return
  const cfg = currentConfig.value
  isSaving.value = true
  saveError.value = null

  try {
    const { error } = await (client.from(cfg.tableName as any) as any)
      .update(editingItem.value)
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
            <option value="published">Đã xuất bản (Published)</option>
            <option value="draft">Bản nháp (Draft)</option>
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
          <button
            v-if="currentConfig.hasPublish"
            type="button"
            class="min-h-[44px] px-3 py-1.5 rounded-brut border border-line bg-ok/20 text-ok font-bold text-xs hover:bg-ok/30 cursor-pointer"
            @click="batchPublish(true)"
          >
            Xuất bản hàng loạt
          </button>
          <button
            v-if="currentConfig.hasPublish"
            type="button"
            class="min-h-[44px] px-3 py-1.5 rounded-brut border border-line bg-surface text-ink-soft font-bold text-xs hover:bg-surface-2 cursor-pointer"
            @click="batchPublish(false)"
          >
            Gỡ xuất bản
          </button>
          <button
            type="button"
            class="min-h-[44px] px-3 py-1.5 rounded-brut border border-line bg-bad/20 text-bad font-bold text-xs hover:bg-bad/30 cursor-pointer"
            @click="batchDelete"
          >
            Xoá hàng loạt
          </button>
        </div>
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
              <th v-if="currentConfig.hasPublish" class="p-3 border-r border-line w-28 text-center">Xuất bản</th>
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

              <td v-if="currentConfig.hasPublish" class="p-3 border-r border-line text-center">
                <button
                  type="button"
                  class="min-h-[44px] px-3 py-1.5 rounded-brut border text-[11px] font-black cursor-pointer transition-all inline-flex items-center justify-center"
                  :class="[
                    item.is_published
                      ? 'border-ok bg-ok/20 text-ok hover:bg-ok/30'
                      : 'border-line bg-surface-2 text-ink-soft hover:bg-surface'
                  ]"
                  @click="togglePublish(item)"
                >
                  {{ item.is_published ? '✓ ĐÃ ĐĂNG' : '○ BẢN NHÁP' }}
                </button>
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

    <!-- Ngăn trượt sửa nhanh (Slide-over Editor) -->
    <div
      v-if="isSlideOverOpen"
      class="fixed inset-0 z-50 overflow-hidden bg-black/40 flex justify-end"
    >
      <div class="w-full max-w-lg bg-surface border-l-[3px] border-line h-full flex flex-col shadow-brut-lg">
        <!-- Slide-over Header -->
        <div class="p-4 sm:p-5 border-b-[3px] border-line flex items-center justify-between bg-surface-2">
          <div>
            <h3 class="font-display font-black text-base text-ink">Chỉnh sửa nhanh bản ghi</h3>
            <p class="text-xs font-mono text-ink-soft">{{ editingItem?.[currentConfig.idField] }}</p>
          </div>
          <button
            type="button"
            class="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-brut border-2 border-line bg-surface hover:bg-surface-2 cursor-pointer"
            aria-label="Đóng ngăn chỉnh sửa"
            @click="isSlideOverOpen = false"
          >
            <X class="h-4 w-4 text-ink" />
          </button>
        </div>

        <!-- Slide-over Body -->
        <div class="p-5 flex-1 overflow-y-auto space-y-4">
          <div v-if="saveError" class="p-3 rounded-brut border-2 border-bad bg-bad/10 text-xs font-bold text-bad">
            {{ saveError }}
          </div>

          <div>
            <label class="block text-xs font-black text-ink mb-1">Tiêu đề chính / Từ vựng:</label>
            <input
              v-model="editingItem[currentConfig.titleField]"
              type="text"
              class="w-full p-2 text-xs rounded-brut border-2 border-line bg-surface text-ink"
            />
          </div>

          <div v-if="editingItem.vietnamese_title !== undefined">
            <label class="block text-xs font-black text-ink mb-1">Tiêu đề tiếng Việt:</label>
            <input
              v-model="editingItem.vietnamese_title"
              type="text"
              class="w-full p-2 text-xs rounded-brut border-2 border-line bg-surface text-ink"
            />
          </div>

          <div v-if="currentConfig.hasLicense">
            <label class="block text-xs font-black text-ink mb-1">Giấy phép bản quyền (License):</label>
            <select
              v-model="editingItem.license"
              class="w-full p-2 text-xs rounded-brut border-2 border-line bg-surface text-ink"
            >
              <option value="public_domain">Public Domain (Miền công cộng)</option>
              <option value="original">Original (Tự biên soạn độc quyền)</option>
              <option value="licensed">Licensed (Có giấy phép sử dụng)</option>
            </select>
          </div>

          <div v-if="currentConfig.hasPublish" class="pt-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="editingItem.is_published"
                type="checkbox"
                class="h-4 w-4 rounded border-2 border-line accent-ok"
              />
              <span class="text-xs font-bold text-ink">Xuất bản công khai cho mọi người học</span>
            </label>
          </div>
        </div>

        <!-- Slide-over Footer -->
        <div class="p-4 border-t-2 border-line bg-surface-2 flex items-center justify-between">
          <BaseButton tone="neutral" @click="isSlideOverOpen = false">
            <span>Hủy bỏ</span>
          </BaseButton>

          <BaseButton tone="ok" :disabled="isSaving" @click="saveEdit">
            <RefreshCw v-if="isSaving" class="h-3.5 w-3.5 animate-spin mr-1" />
            <span>Lưu thay đổi</span>
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
