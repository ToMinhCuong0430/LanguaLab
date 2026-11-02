<script setup lang="ts">
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Volume2,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  AlertTriangle,
  X,
  ExternalLink,
  Check,
  Send,
  Layers,
  Sparkles,
  Info,
} from '@lucide/vue'
import type { Database } from '~/types/database.types'
import {
  useAdmin,
  formatDateTime,
  type LexEntryStatus,
  type LexSenseReviewStatus,
  type LexAdminStats,
} from '~/composables/useAdmin'
import { levelBadge } from '~/constants/badges'
import { stringifyCsv } from '~/utils/csvParser'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useHead({
  title: 'Quản trị Kho từ vựng (Lexicon) - Langua Admin',
})

const client = useSupabaseClient<Database>()
const {
  lexStats,
  setSenseReview,
  setTranslationReview,
  setExampleReview,
  setEntryStatus,
  batchSetEntryStatus,
} = useAdmin()

// ==========================================
// THỐNG KÊ KHO TỪ VỰNG TỔNG QUAN
// ==========================================
const stats = ref<LexAdminStats | null>(null)
const isLoadingStats = ref(true)

const loadStats = async () => {
  isLoadingStats.value = true
  try {
    const res = await lexStats()
    stats.value = res
  } catch (err: any) {
    console.warn('Lỗi tải thống kê lexicon:', err)
  } finally {
    isLoadingStats.value = false
  }
}

// ==========================================
// BỘ LỌC & PHÂN TRANG SERVER-SIDE
// ==========================================
const searchQuery = ref('')
const selectedLevel = ref<string>('all') // 'all' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
const selectedPos = ref<string>('all')
const selectedStatus = ref<string>('all') // 'all' | 'published' | 'draft' | 'review' | 'rejected'
const selectedSenseReview = ref<string>('all') // 'all' | 'approved' | 'pending' | 'rejected'
const currentPage = ref(1)
const pageSize = ref(20)
const totalRecords = ref(0)
const items = ref<any[]>([])
const isLoading = ref(true)
const errorMessage = ref<string | null>(null)

// Danh sách loại từ (Part of Speech)
const POS_OPTIONS = [
  { value: 'all', label: 'Tất cả loại từ' },
  { value: 'noun', label: 'Danh từ (Noun)' },
  { value: 'verb', label: 'Động từ (Verb)' },
  { value: 'adjective', label: 'Tính từ (Adjective)' },
  { value: 'adverb', label: 'Trạng từ (Adverb)' },
  { value: 'pronoun', label: 'Đại từ (Pronoun)' },
  { value: 'preposition', label: 'Giới từ (Preposition)' },
  { value: 'conjunction', label: 'Liên từ (Conjunction)' },
  { value: 'interjection', label: 'Thán từ (Interjection)' },
  { value: 'phrase', label: 'Cụm từ (Phrase)' },
  { value: 'other', label: 'Khác (Other)' },
]

// ==========================================
// TẢI DANH SÁCH MỤC TỪ
// ==========================================
const loadEntries = async () => {
  isLoading.value = true
  errorMessage.value = null
  selectedIds.value = []

  try {
    const needsInnerSense = selectedLevel.value !== 'all' || selectedPos.value !== 'all' || selectedSenseReview.value !== 'all'
    const senseJoin = needsInnerSense ? '!inner' : ''

    let query = client
      .from('lex_entries')
      .select(
        `
        id,
        language,
        entry_type,
        lemma,
        status,
        frequency_rank,
        created_at,
        updated_at,
        lex_pronunciations (
          id,
          kind,
          accent,
          transcription,
          audio_url
        ),
        lex_forms (
          id,
          form,
          form_type
        ),
        lex_senses${senseJoin} (
          id,
          sense_order,
          part_of_speech,
          definition,
          level_system,
          level,
          review_status,
          lex_translations (
            id,
            language_code,
            translated_text,
            review_status
          ),
          lex_examples (
            id,
            sentence,
            sentence_vi,
            review_status
          )
        )
      `,
        { count: 'exact' },
      )
      .eq('language', 'en')

    // Tìm kiếm theo Lemma
    if (searchQuery.value.trim()) {
      query = query.ilike('lemma', `%${searchQuery.value.trim().toLowerCase()}%`)
    }

    // Lọc theo trạng thái mục từ
    if (selectedStatus.value !== 'all') {
      query = query.eq('status', selectedStatus.value)
    }

    // Lọc theo cấp độ CEFR của nghĩa
    if (selectedLevel.value !== 'all') {
      query = query.eq('lex_senses.level', selectedLevel.value)
    }

    // Lọc theo loại từ
    if (selectedPos.value !== 'all') {
      query = query.eq('lex_senses.part_of_speech', selectedPos.value)
    }

    // Lọc theo trạng thái duyệt của nghĩa
    if (selectedSenseReview.value !== 'all') {
      query = query.eq('lex_senses.review_status', selectedSenseReview.value)
    }

    // Sắp xếp theo lemma
    query = query.order('lemma', { ascending: true })

    // Phân trang
    const from = (currentPage.value - 1) * pageSize.value
    const to = from + pageSize.value - 1
    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) throw error

    items.value = data || []
    totalRecords.value = count || 0
  } catch (err: any) {
    errorMessage.value = err.message || 'Không thể tải danh sách từ vựng.'
  } finally {
    isLoading.value = false
  }
}

// Theo dõi thay đổi bộ lọc để tải lại trang 1
let searchDebounceTimer: any = null
watch(searchQuery, () => {
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    currentPage.value = 1
    loadEntries()
  }, 350)
})

watch([selectedLevel, selectedPos, selectedStatus, selectedSenseReview, pageSize], () => {
  currentPage.value = 1
  loadEntries()
})

watch(currentPage, () => {
  loadEntries()
})

const resetFilters = () => {
  searchQuery.value = ''
  selectedLevel.value = 'all'
  selectedPos.value = 'all'
  selectedStatus.value = 'all'
  selectedSenseReview.value = 'all'
  currentPage.value = 1
}

// ==========================================
// CHỌN HÀNG LOẠT (BATCH ACTIONS)
// ==========================================
const selectedIds = ref<string[]>([])
const isSelectAll = computed({
  get: () => items.value.length > 0 && selectedIds.value.length === items.value.length,
  set: (val: boolean) => {
    selectedIds.value = val ? items.value.map(i => i.id) : []
  },
})

const batchActionLoading = ref(false)
const batchNotice = ref<{ type: 'ok' | 'error'; message: string } | null>(null)

const handleBatchPublish = async (targetStatus: LexEntryStatus) => {
  if (selectedIds.value.length === 0) return
  batchActionLoading.value = true
  batchNotice.value = null

  try {
    const res = await batchSetEntryStatus(selectedIds.value, targetStatus)
    const label = targetStatus === 'published' ? 'xuất bản' : 'chuyển trạng thái'
    if (res.updated > 0) {
      batchNotice.value = {
        type: 'ok',
        message: `Đã ${label} thành công ${res.updated} mục từ.${res.skipped?.length ? ` (${res.skipped.length} mục bị bỏ qua do chưa đủ điều kiện)` : ''}`,
      }
    } else {
      batchNotice.value = {
        type: 'error',
        message: `Không có mục từ nào được cập nhật. (${res.skipped?.[0]?.reason || 'Chưa có nghĩa nào được duyệt'})`,
      }
    }
    await loadEntries()
    await loadStats()
  } catch (err: any) {
    batchNotice.value = { type: 'error', message: err.message || 'Lỗi thao tác hàng loạt.' }
  } finally {
    batchActionLoading.value = false
  }
}

// ==========================================
// CHI TIẾT MỤC TỪ & TRÌNH BIÊN TẬP / DUYỆT (SLIDE-OVER DRAWER)
// ==========================================
const isDetailOpen = ref(false)
const selectedEntry = ref<any | null>(null)
const isDetailLoading = ref(false)
const actionFeedback = ref<{ type: 'ok' | 'error'; message: string } | null>(null)
const editingTranslationId = ref<string | null>(null)
const editingTranslationText = ref('')

const openEntryDetail = async (entry: any) => {
  selectedEntry.value = null
  actionFeedback.value = null
  isDetailOpen.value = true
  isDetailLoading.value = true

  try {
    const { data, error } = await client
      .from('lex_entries')
      .select(
        `
        id,
        language,
        entry_type,
        lemma,
        status,
        frequency_rank,
        created_at,
        updated_at,
        lex_pronunciations (
          id,
          kind,
          accent,
          transcription,
          audio_url
        ),
        lex_forms (
          id,
          form,
          form_type
        ),
        lex_attributions (
          id,
          source_url,
          license_name,
          attribution_text,
          lex_sources (
            name,
            code,
            source_url,
            license_name
          )
        ),
        lex_senses (
          id,
          sense_order,
          part_of_speech,
          definition,
          level_system,
          level,
          review_status,
          created_at,
          lex_sense_levels (
            id,
            level_system,
            level,
            lex_sources (
              name,
              code
            )
          ),
          lex_translations (
            id,
            language_code,
            translated_text,
            note,
            review_status
          ),
          lex_examples (
            id,
            sentence,
            sentence_vi,
            review_status
          )
        )
      `,
      )
      .eq('id', entry.id)
      .single()

    if (error) throw error

    // Sắp xếp các nghĩa theo thứ tự
    if (data?.lex_senses) {
      data.lex_senses.sort((a: any, b: any) => a.sense_order - b.sense_order)
    }

    selectedEntry.value = data
  } catch (err: any) {
    actionFeedback.value = { type: 'error', message: err.message || 'Lỗi tải chi tiết mục từ.' }
  } finally {
    isDetailLoading.value = false
  }
}

const closeDetail = () => {
  isDetailOpen.value = false
  selectedEntry.value = null
  actionFeedback.value = null
}

// Điều kiện xuất bản: ít nhất 1 nghĩa đã approved
const hasApprovedSense = computed(() => {
  if (!selectedEntry.value?.lex_senses) return false
  return selectedEntry.value.lex_senses.some((s: any) => s.review_status === 'approved')
})

// Cập nhật trạng thái mục từ
const handleSetEntryStatus = async (status: LexEntryStatus) => {
  if (!selectedEntry.value) return
  actionFeedback.value = null

  if (status === 'published' && !hasApprovedSense.value) {
    actionFeedback.value = {
      type: 'error',
      message: 'Không thể xuất bản: Cần ít nhất một nghĩa được duyệt (approved) trước khi xuất bản mục từ này.',
    }
    return
  }

  try {
    await setEntryStatus(selectedEntry.value.id, status)
    selectedEntry.value.status = status
    actionFeedback.value = {
      type: 'ok',
      message: status === 'published' ? 'Đã xuất bản mục từ thành công.' : `Đã chuyển trạng thái mục từ sang "${status}".`,
    }
    // Cập nhật dòng tương ứng ở bảng ngoài
    const idx = items.value.findIndex(i => i.id === selectedEntry.value.id)
    if (idx !== -1) items.value[idx].status = status
    loadStats()
  } catch (err: any) {
    actionFeedback.value = { type: 'error', message: err.message || 'Không thể đổi trạng thái mục từ.' }
  }
}

// Duyệt / Từ chối nghĩa
const handleSetSenseReview = async (sense: any, status: LexSenseReviewStatus) => {
  actionFeedback.value = null
  try {
    await setSenseReview(sense.id, status)
    sense.review_status = status
    actionFeedback.value = {
      type: 'ok',
      message: `Đã cập nhật trạng thái nghĩa thành "${status === 'approved' ? 'Đã duyệt' : status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}".`,
    }
    // Nếu chuyển sang approved và mục từ đang draft, có thể xuất bản
    loadStats()
  } catch (err: any) {
    actionFeedback.value = { type: 'error', message: err.message || 'Lỗi cập nhật nghĩa.' }
  }
}

// Duyệt / Từ chối bản dịch tiếng Việt
const handleSetTranslationReview = async (trans: any, status: LexSenseReviewStatus, updatedText?: string) => {
  actionFeedback.value = null
  try {
    await setTranslationReview(trans.id, status, updatedText)
    trans.review_status = status
    if (updatedText) trans.translated_text = updatedText
    editingTranslationId.value = null
    actionFeedback.value = { type: 'ok', message: 'Đã cập nhật bản dịch tiếng Việt.' }
  } catch (err: any) {
    actionFeedback.value = { type: 'error', message: err.message || 'Lỗi cập nhật bản dịch.' }
  }
}

// Duyệt / Từ chối câu ví dụ
const handleSetExampleReview = async (ex: any, status: LexSenseReviewStatus) => {
  actionFeedback.value = null
  try {
    await setExampleReview(ex.id, status)
    ex.review_status = status
    actionFeedback.value = { type: 'ok', message: 'Đã cập nhật câu ví dụ.' }
  } catch (err: any) {
    actionFeedback.value = { type: 'error', message: err.message || 'Lỗi cập nhật ví dụ.' }
  }
}

// ==========================================
// PHÁT ÂM TTS & XUẤT DỮ LIỆU
// ==========================================
const playPronunciation = (audioUrl?: string, word?: string) => {
  if (audioUrl) {
    const audio = new Audio(audioUrl)
    audio.play().catch(() => playBrowserTts(word || ''))
  } else if (word) {
    playBrowserTts(word)
  }
}

const playBrowserTts = (text: string) => {
  if (!import.meta.client || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.95
  window.speechSynthesis.speak(u)
}

const exportData = (format: 'csv' | 'json') => {
  if (items.value.length === 0) return
  const dataToExport = items.value.map(i => ({
    id: i.id,
    lemma: i.lemma,
    entry_type: i.entry_type,
    status: i.status,
    frequency_rank: i.frequency_rank || '',
    ipa: i.lex_pronunciations?.[0]?.transcription || '',
    senses_count: i.lex_senses?.length || 0,
    cefr_levels: Array.from(new Set(i.lex_senses?.map((s: any) => s.level).filter(Boolean))).join(', '),
    parts_of_speech: Array.from(new Set(i.lex_senses?.map((s: any) => s.part_of_speech).filter(Boolean))).join(', '),
  }))

  const filename = `lexicon_entries_${new Date().toISOString().split('T')[0]}`

  if (format === 'csv') {
    const csv = stringifyCsv(dataToExport)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}.csv`
    link.click()
  } else {
    const json = JSON.stringify(dataToExport, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${filename}.json`
    link.click()
  }
}

// Helpers hiển thị Badge
const statusBadgeConfig = (status: string) => {
  switch (status) {
    case 'published':
      return { tone: 'green' as const, label: 'Đã xuất bản' }
    case 'review':
      return { tone: 'yellow' as const, label: 'Chờ duyệt' }
    case 'rejected':
      return { tone: 'coral' as const, label: 'Từ chối' }
    default:
      return { tone: 'neutral' as const, label: 'Bản nháp' }
  }
}

const reviewBadgeConfig = (review: string) => {
  switch (review) {
    case 'approved':
      return { tone: 'green' as const, label: 'Đã duyệt' }
    case 'rejected':
      return { tone: 'coral' as const, label: 'Từ chối' }
    default:
      return { tone: 'yellow' as const, label: 'Chờ duyệt' }
  }
}

// Tổng số trang
const totalPages = computed(() => Math.ceil(totalRecords.value / pageSize.value) || 1)

onMounted(() => {
  loadStats()
  loadEntries()
})
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-6">
    <!-- Header trang quản trị -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <NuxtLink to="/admin" class="text-xs font-bold text-ink-soft hover:underline">Admin</NuxtLink>
          <span class="text-xs text-ink-soft">/</span>
          <span class="text-xs font-bold uppercase text-ink">Kho từ vựng Lexicon</span>
        </div>
        <h1 class="font-display font-black text-2xl text-ink">Kho từ vựng trung tâm (Lexicon)</h1>
        <p class="text-xs text-ink-soft">
          Quản trị 8.554 mục từ Wiktionary, phân cấp CEFR A1-C2, duyệt nghĩa và kiểm soát xuất bản.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-brut border-2 border-line bg-surface font-display text-xs font-bold text-ink shadow-brut-sm hover:bg-surface-2 cursor-pointer"
          @click="loadEntries"
        >
          <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': isLoading }" />
          <span>Làm mới</span>
        </button>

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
      </div>
    </div>

    <!-- Bảng thông số tổng quan (Overview Stats) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Thẻ Tổng số mục từ -->
      <BaseCard accent="left" accent-color="var(--c-yellow)">
        <template #header>
          <h4 class="font-display text-xs font-black text-ink flex items-center gap-1.5">
            <BookOpen class="h-4 w-4 text-accent" /> Tổng mục từ (Entries)
          </h4>
        </template>
        <div class="mt-2 flex items-baseline justify-between">
          <span class="font-display font-black text-2xl text-ink tabular-nums">
            {{ isLoadingStats ? '...' : stats?.total_entries?.toLocaleString() || '0' }}
          </span>
          <span class="text-xs text-ink-soft font-bold">tiếng Anh</span>
        </div>
        <div class="mt-2 text-[11px] flex items-center justify-between font-bold text-ink-soft pt-2 border-t border-line/40">
          <span class="text-ok">✓ {{ stats?.entries_by_status?.published || 0 }} đã xuất bản</span>
          <span>{{ (stats?.entries_by_status?.draft || 0) + (stats?.entries_by_status?.review || 0) }} bản nháp</span>
        </div>
      </BaseCard>

      <!-- Thẻ Tổng số nghĩa -->
      <BaseCard accent="left" accent-color="var(--c-blue)">
        <template #header>
          <h4 class="font-display text-xs font-black text-ink flex items-center gap-1.5">
            <Layers class="h-4 w-4 text-tone-blue" /> Tổng số nghĩa (Senses)
          </h4>
        </template>
        <div class="mt-2 flex items-baseline justify-between">
          <span class="font-display font-black text-2xl text-ink tabular-nums">
            {{ isLoadingStats ? '...' : stats?.total_senses?.toLocaleString() || '0' }}
          </span>
          <span class="text-xs text-ink-soft font-bold">nghĩa chi tiết</span>
        </div>
        <div class="mt-2 text-[11px] flex items-center justify-between font-bold text-ink-soft pt-2 border-t border-line/40">
          <span class="text-ok">✓ {{ stats?.senses_by_review?.approved?.toLocaleString() || 0 }} đã duyệt</span>
          <span :class="stats?.senses_by_review?.pending ? 'text-warn font-black' : ''">
            {{ stats?.senses_by_review?.pending?.toLocaleString() || 0 }} chờ duyệt
          </span>
        </div>
      </BaseCard>

      <!-- Thẻ Phân bố cấp độ CEFR A1-B2 -->
      <BaseCard accent="left" accent-color="var(--c-green)">
        <template #header>
          <h4 class="font-display text-xs font-black text-ink flex items-center gap-1.5">
            <Sparkles class="h-4 w-4 text-tone-green" /> Cấp độ CEFR Cơ bản & Trung cấp
          </h4>
        </template>
        <div class="mt-2 grid grid-cols-4 gap-1 text-center font-mono text-xs">
          <div class="p-1 rounded-brut bg-surface-2 border border-line/50">
            <div class="text-[10px] font-bold text-ink-soft">A1</div>
            <div class="font-black text-ink">{{ stats?.senses_by_level?.A1 || 0 }}</div>
          </div>
          <div class="p-1 rounded-brut bg-surface-2 border border-line/50">
            <div class="text-[10px] font-bold text-ink-soft">A2</div>
            <div class="font-black text-ink">{{ stats?.senses_by_level?.A2 || 0 }}</div>
          </div>
          <div class="p-1 rounded-brut bg-surface-2 border border-line/50">
            <div class="text-[10px] font-bold text-ink-soft">B1</div>
            <div class="font-black text-ink">{{ stats?.senses_by_level?.B1 || 0 }}</div>
          </div>
          <div class="p-1 rounded-brut bg-surface-2 border border-line/50">
            <div class="text-[10px] font-bold text-ink-soft">B2</div>
            <div class="font-black text-ink">{{ stats?.senses_by_level?.B2 || 0 }}</div>
          </div>
        </div>
        <div class="mt-2 text-[10px] text-ink-soft font-bold pt-1.5 border-t border-line/40">
          Nguồn: CEFR-J Vocabulary Profile 1.5
        </div>
      </BaseCard>

      <!-- Thẻ Phân bố cấp độ C1-C2 -->
      <BaseCard accent="left" accent-color="var(--c-violet)">
        <template #header>
          <h4 class="font-display text-xs font-black text-ink flex items-center gap-1.5">
            <Sparkles class="h-4 w-4 text-tone-violet" /> Cấp độ Cao cấp C1 & C2
          </h4>
        </template>
        <div class="mt-2 grid grid-cols-3 gap-1 text-center font-mono text-xs">
          <div class="p-1 rounded-brut bg-surface-2 border border-line/50">
            <div class="text-[10px] font-bold text-ink-soft">C1</div>
            <div class="font-black text-ink">{{ stats?.senses_by_level?.C1 || 0 }}</div>
          </div>
          <div class="p-1 rounded-brut bg-surface-2 border border-line/50">
            <div class="text-[10px] font-bold text-ink-soft">C2</div>
            <div class="font-black text-ink">{{ stats?.senses_by_level?.C2 || 0 }}</div>
          </div>
          <div class="p-1 rounded-brut bg-surface-2 border border-line/50">
            <div class="text-[10px] font-bold text-ink-soft">Chưa gán</div>
            <div class="font-black text-ink-soft">{{ stats?.senses_by_level?.unassigned?.toLocaleString() || 0 }}</div>
          </div>
        </div>
        <div class="mt-2 text-[10px] text-ink-soft font-bold pt-1.5 border-t border-line/40">
          Nguồn: Octanove C1/C2 Profile 1.0
        </div>
      </BaseCard>
    </div>

    <!-- Thanh công cụ tìm kiếm & bộ lọc -->
    <BaseCard>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        <!-- Ô tìm kiếm Lemma -->
        <div class="lg:col-span-4 relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Tìm theo English lemma (ví dụ: abandon, run, happy)..."
            class="w-full min-h-[44px] pl-9 pr-3 py-2 text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink focus:outline-none focus:border-ink shadow-brut-sm"
          />
          <Search class="h-4 w-4 text-ink-soft absolute left-3 top-3.5" />
        </div>

        <!-- Lọc CEFR Level -->
        <div class="lg:col-span-2">
          <select
            v-model="selectedLevel"
            class="w-full min-h-[44px] px-3 py-2 text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink focus:outline-none cursor-pointer shadow-brut-sm"
          >
            <option value="all">Tất cả cấp CEFR</option>
            <option value="A1">Cấp A1 (Cấp 1)</option>
            <option value="A2">Cấp A2 (Cấp 2)</option>
            <option value="B1">Cấp B1 (Cấp 3)</option>
            <option value="B2">Cấp B2 (Cấp 4)</option>
            <option value="C1">Cấp C1 (Cấp 5)</option>
            <option value="C2">Cấp C2 (Cấp 6)</option>
          </select>
        </div>

        <!-- Lọc Loại từ (Part of Speech) -->
        <div class="lg:col-span-2">
          <select
            v-model="selectedPos"
            class="w-full min-h-[44px] px-3 py-2 text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink focus:outline-none cursor-pointer shadow-brut-sm"
          >
            <option v-for="pos in POS_OPTIONS" :key="pos.value" :value="pos.value">
              {{ pos.label }}
            </option>
          </select>
        </div>

        <!-- Lọc Trạng thái xuất bản mục từ -->
        <div class="lg:col-span-2">
          <select
            v-model="selectedStatus"
            class="w-full min-h-[44px] px-3 py-2 text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink focus:outline-none cursor-pointer shadow-brut-sm"
          >
            <option value="all">Tất cả xuất bản</option>
            <option value="published">Đã xuất bản (Published)</option>
            <option value="draft">Bản nháp (Draft)</option>
            <option value="review">Đang duyệt (Review)</option>
            <option value="rejected">Bị từ chối (Rejected)</option>
          </select>
        </div>

        <!-- Lọc Trạng thái duyệt nghĩa -->
        <div class="lg:col-span-2">
          <select
            v-model="selectedSenseReview"
            class="w-full min-h-[44px] px-3 py-2 text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink focus:outline-none cursor-pointer shadow-brut-sm"
          >
            <option value="all">Tất cả duyệt nghĩa</option>
            <option value="approved">Nghĩa đã duyệt (Approved)</option>
            <option value="pending">Nghĩa chờ duyệt (Pending)</option>
            <option value="rejected">Nghĩa bị từ chối (Rejected)</option>
          </select>
        </div>
      </div>

      <!-- Footer thanh công cụ: Thao tác hàng loạt & Reset -->
      <div class="mt-4 pt-3 border-t-2 border-line/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="text-xs font-bold text-ink-soft">
            Tìm thấy <strong class="text-ink font-black">{{ totalRecords.toLocaleString() }}</strong> mục từ
          </span>

          <button
            v-if="searchQuery || selectedLevel !== 'all' || selectedPos !== 'all' || selectedStatus !== 'all' || selectedSenseReview !== 'all'"
            type="button"
            class="text-xs font-bold text-accent hover:underline cursor-pointer"
            @click="resetFilters"
          >
            Đặt lại bộ lọc ✕
          </button>
        </div>

        <!-- Batch Action Toolbar khi có mục được tick -->
        <div v-if="selectedIds.length > 0" class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-bold text-ink">
            Đã chọn <strong class="font-black">{{ selectedIds.length }}</strong> mục:
          </span>
          <button
            type="button"
            class="min-h-[36px] px-3 py-1 text-xs font-black rounded-brut border-2 border-line bg-ok hover:bg-ok/90 text-on-tone shadow-brut-sm cursor-pointer disabled:opacity-50"
            :disabled="batchActionLoading"
            @click="handleBatchPublish('published')"
          >
            Xuất bản đã chọn
          </button>
          <button
            type="button"
            class="min-h-[36px] px-3 py-1 text-xs font-black rounded-brut border-2 border-line bg-surface hover:bg-surface-2 text-ink shadow-brut-sm cursor-pointer disabled:opacity-50"
            :disabled="batchActionLoading"
            @click="handleBatchPublish('draft')"
          >
            Gỡ xuất bản
          </button>
        </div>
      </div>

      <!-- Thông báo thao tác hàng loạt -->
      <div
        v-if="batchNotice"
        class="mt-3 p-3 rounded-brut border-2 border-line text-xs font-bold flex items-center justify-between gap-2"
        :class="batchNotice.type === 'ok' ? 'bg-ok/10 text-ok border-ok' : 'bg-bad/10 text-bad border-bad'"
      >
        <span>{{ batchNotice.message }}</span>
        <button type="button" class="cursor-pointer" @click="batchNotice = null">✕</button>
      </div>
    </BaseCard>

    <!-- Bảng dữ liệu từ vựng Lexicon -->
    <BaseCard class="overflow-hidden p-0">
      <!-- Loading Skeleton -->
      <div v-if="isLoading" class="p-6 space-y-4">
        <BaseSkeleton v-for="i in 5" :key="i" class="h-12 w-full rounded-brut" />
      </div>

      <!-- Trạng thái Lỗi -->
      <div v-else-if="errorMessage" class="p-8 text-center space-y-3">
        <AlertTriangle class="h-8 w-8 text-bad mx-auto" />
        <p class="font-bold text-sm text-bad">{{ errorMessage }}</p>
        <button
          type="button"
          class="px-4 py-2 rounded-brut border-2 border-line bg-surface text-ink text-xs font-bold hover:bg-surface-2 shadow-brut-sm cursor-pointer"
          @click="loadEntries"
        >
          Thử lại
        </button>
      </div>

      <!-- Trạng thái Rỗng -->
      <BaseEmptyState
        v-else-if="items.length === 0"
        title="Không tìm thấy mục từ nào"
        description="Không có từ vựng nào khớp với điều kiện tìm kiếm và bộ lọc hiện tại."
        tone="warning"
      />

      <!-- Bảng Data Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b-2 border-line bg-surface-2/60 text-[11px] font-display font-black uppercase text-ink-soft">
              <th class="p-3 w-10 text-center">
                <input
                  v-model="isSelectAll"
                  type="checkbox"
                  class="rounded-brut border-2 border-line h-4 w-4 accent-accent cursor-pointer"
                />
              </th>
              <th class="p-3">Từ gốc (Lemma)</th>
              <th class="p-3">Phát âm (IPA)</th>
              <th class="p-3">Loại từ & Cấp độ</th>
              <th class="p-3">Số nghĩa & Bản dịch</th>
              <th class="p-3">Trạng thái</th>
              <th class="p-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody class="divide-y-2 divide-line/40 text-xs">
            <tr
              v-for="item in items"
              :key="item.id"
              class="hover:bg-surface-2/40 transition-colors"
            >
              <!-- Checkbox chọn -->
              <td class="p-3 text-center">
                <input
                  v-model="selectedIds"
                  type="checkbox"
                  :value="item.id"
                  class="rounded-brut border-2 border-line h-4 w-4 accent-accent cursor-pointer"
                />
              </td>

              <!-- Lemma & Loại mục từ -->
              <td class="p-3">
                <div class="flex items-center gap-2">
                  <span class="font-display font-black text-sm text-ink">{{ item.lemma }}</span>
                  <span
                    v-if="item.entry_type && item.entry_type !== 'word'"
                    class="px-1.5 py-0.5 rounded-brut border border-line bg-surface-2 text-[10px] font-bold text-ink-soft uppercase"
                  >
                    {{ item.entry_type }}
                  </span>
                </div>
                <div v-if="item.frequency_rank" class="text-[10px] text-ink-soft font-mono mt-0.5">
                  Xếp hạng: #{{ item.frequency_rank.toLocaleString() }}
                </div>
              </td>

              <!-- Phiên âm IPA -->
              <td class="p-3">
                <div v-if="item.lex_pronunciations?.[0]" class="flex items-center gap-1.5">
                  <span class="font-mono text-xs font-bold text-ink">
                    {{ item.lex_pronunciations[0].transcription || '–' }}
                  </span>
                  <button
                    type="button"
                    class="p-1 rounded-brut border border-line bg-surface hover:bg-surface-2 text-ink cursor-pointer"
                    title="Nghe phát âm"
                    @click="playPronunciation(item.lex_pronunciations[0].audio_url, item.lemma)"
                  >
                    <Volume2 class="h-3 w-3 text-accent" />
                  </button>
                </div>
                <span v-else class="text-ink-soft font-mono text-[11px]">–</span>
              </td>

              <!-- Loại từ & CEFR -->
              <td class="p-3">
                <div class="flex flex-wrap gap-1 items-center">
                  <!-- Badges loại từ -->
                  <span
                    v-for="pos in Array.from(new Set(item.lex_senses?.map((s: any) => s.part_of_speech).filter(Boolean)))"
                    :key="String(pos)"
                    class="px-1.5 py-0.5 rounded-brut border border-line bg-surface-2 text-[10px] font-black uppercase text-ink-soft"
                  >
                    {{ pos }}
                  </span>
                  <!-- Badges cấp độ CEFR -->
                  <BaseBadge
                    v-for="lvl in Array.from(new Set(item.lex_senses?.map((s: any) => s.level).filter(Boolean)))"
                    :key="String(lvl)"
                    v-bind="levelBadge(String(lvl))"
                    size="sm"
                  >
                    {{ lvl }}
                  </BaseBadge>
                </div>
              </td>

              <!-- Xem trước nghĩa & bản dịch -->
              <td class="p-3 max-w-xs">
                <div class="text-[11px] font-bold text-ink-soft">
                  {{ item.lex_senses?.length || 0 }} nghĩa
                  <span v-if="item.lex_senses?.some((s: any) => s.review_status === 'approved')" class="text-ok font-black ml-1">
                    (✓ Đã duyệt)
                  </span>
                </div>
                <!-- Nghĩa đầu tiên -->
                <p v-if="item.lex_senses?.[0]" class="text-xs text-ink truncate mt-0.5">
                  {{ item.lex_senses[0].definition }}
                </p>
                <!-- Dịch tiếng Việt đầu tiên nếu có -->
                <p
                  v-if="item.lex_senses?.[0]?.lex_translations?.[0]"
                  class="text-[11px] font-bold text-accent truncate"
                >
                  🇻🇳 {{ item.lex_senses[0].lex_translations[0].translated_text }}
                </p>
              </td>

              <!-- Trạng thái xuất bản -->
              <td class="p-3">
                <BaseBadge v-bind="statusBadgeConfig(item.status)" size="sm">
                  {{ statusBadgeConfig(item.status).label }}
                </BaseBadge>
              </td>

              <!-- Hành động -->
              <td class="p-3 text-right">
                <button
                  type="button"
                  class="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-brut border-2 border-line bg-surface hover:bg-surface-2 text-ink font-bold text-xs shadow-brut-sm cursor-pointer"
                  @click="openEntryDetail(item)"
                >
                  <Eye class="h-3.5 w-3.5" />
                  <span>Duyệt & Chi tiết</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Phân trang Server-side -->
      <div class="p-4 border-t-2 border-line bg-surface-2/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-xs font-bold text-ink-soft">
          <span>Hiển thị</span>
          <select
            v-model="pageSize"
            class="px-2 py-1 rounded-brut border-2 border-line bg-surface text-ink text-xs font-bold"
          >
            <option :value="10">10</option>
            <option :value="20">20</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span>mục / trang (Trang {{ currentPage }} / {{ totalPages }})</span>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class="min-h-[36px] min-w-[36px] p-2 rounded-brut border-2 border-line bg-surface hover:bg-surface-2 text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-brut-sm flex items-center justify-center"
            :disabled="currentPage <= 1 || isLoading"
            @click="currentPage--"
          >
            <ChevronLeft class="h-4 w-4" />
          </button>

          <span class="px-3 text-xs font-black text-ink">
            {{ currentPage }} / {{ totalPages }}
          </span>

          <button
            type="button"
            class="min-h-[36px] min-w-[36px] p-2 rounded-brut border-2 border-line bg-surface hover:bg-surface-2 text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-brut-sm flex items-center justify-center"
            :disabled="currentPage >= totalPages || isLoading"
            @click="currentPage++"
          >
            <ChevronRight class="h-4 w-4" />
          </button>
        </div>
      </div>
    </BaseCard>

    <!-- SLIDE-OVER DRAWER BIÊN TẬP VÀ DUYỆT CHI TIẾT (SLIDE-OVER / MODAL) -->
    <BaseModal
      v-model="isDetailOpen"
      max-width="2xl"
      title="Biên tập & Duyệt mục từ Lexicon"
      @close="closeDetail"
    >
      <div v-if="isDetailLoading" class="py-12 text-center space-y-3">
        <RefreshCw class="h-8 w-8 text-accent animate-spin mx-auto" />
        <p class="text-xs font-bold text-ink-soft">Đang tải toàn bộ dữ liệu nghĩa, dịch và ví dụ...</p>
      </div>

      <div v-else-if="selectedEntry" class="space-y-6">
        <!-- Thông báo kết quả thao tác trong modal -->
        <div
          v-if="actionFeedback"
          class="p-3 rounded-brut border-2 border-line text-xs font-bold flex items-center justify-between gap-2"
          :class="actionFeedback.type === 'ok' ? 'bg-ok/10 text-ok border-ok' : 'bg-bad/10 text-bad border-bad'"
        >
          <span>{{ actionFeedback.message }}</span>
          <button type="button" class="cursor-pointer" @click="actionFeedback = null">✕</button>
        </div>

        <!-- Header mục từ -->
        <div class="p-4 rounded-brut-lg border-2 border-line bg-surface-2/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-2xl font-black font-display text-ink tracking-tight">{{ selectedEntry.lemma }}</h2>
              <BaseBadge v-bind="statusBadgeConfig(selectedEntry.status)" size="sm">
                {{ statusBadgeConfig(selectedEntry.status).label }}
              </BaseBadge>
            </div>
            <div class="flex items-center gap-3 text-xs text-ink-soft font-bold mt-1">
              <span>Loại: {{ selectedEntry.entry_type }}</span>
              <span v-if="selectedEntry.frequency_rank">Xếp hạng: #{{ selectedEntry.frequency_rank }}</span>
              <span>Cập nhật: {{ formatDateTime(selectedEntry.updated_at) }}</span>
            </div>
          </div>

          <!-- Nút hành động Xuất bản / Gỡ xuất bản -->
          <div class="flex items-center gap-2">
            <button
              v-if="selectedEntry.status !== 'published'"
              type="button"
              class="min-h-[44px] px-4 py-2 rounded-brut border-2 border-line bg-ok hover:bg-ok/90 text-on-tone font-black text-xs shadow-brut cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              :disabled="!hasApprovedSense"
              @click="handleSetEntryStatus('published')"
            >
              <CheckCircle2 class="h-4 w-4" />
              <span>Xuất bản mục từ</span>
            </button>

            <button
              v-else
              type="button"
              class="min-h-[44px] px-4 py-2 rounded-brut border-2 border-line bg-surface hover:bg-warn/20 text-ink font-bold text-xs shadow-brut cursor-pointer"
              @click="handleSetEntryStatus('draft')"
            >
              Gỡ xuất bản (về Nháp)
            </button>
          </div>
        </div>

        <!-- Cảnh báo nếu chưa có nghĩa approved -->
        <div
          v-if="selectedEntry.status !== 'published' && !hasApprovedSense"
          class="p-3 rounded-brut border-2 border-line bg-warn/15 text-xs text-ink font-bold flex items-center gap-2.5"
        >
          <AlertTriangle class="h-4 w-4 text-warn shrink-0" />
          <span>
            Mục từ này chưa thể xuất bản vì chưa có nghĩa nào được duyệt. Hãy duyệt ít nhất một nghĩa bên dưới để mở khóa xuất bản.
          </span>
        </div>

        <!-- Phát âm & Dạng từ biến thể -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Phát âm -->
          <div class="p-3.5 rounded-brut border-2 border-line bg-surface space-y-2">
            <h4 class="text-xs font-black uppercase text-ink-soft">Phiên âm & Giọng đọc</h4>
            <div v-if="selectedEntry.lex_pronunciations?.length" class="space-y-1.5">
              <div
                v-for="p in selectedEntry.lex_pronunciations"
                :key="p.id"
                class="flex items-center justify-between text-xs"
              >
                <div class="flex items-center gap-1.5 font-mono font-bold">
                  <span class="text-ink-soft uppercase text-[10px]">[{{ p.accent || 'general' }}]</span>
                  <span class="text-ink">{{ p.transcription || '–' }}</span>
                </div>
                <button
                  type="button"
                  class="p-1 rounded-brut border border-line bg-surface hover:bg-surface-2 text-ink cursor-pointer"
                  title="Nghe"
                  @click="playPronunciation(p.audio_url, selectedEntry.lemma)"
                >
                  <Volume2 class="h-3.5 w-3.5 text-accent" />
                </button>
              </div>
            </div>
            <p v-else class="text-xs text-ink-soft italic">Chưa có bản ghi phiên âm.</p>
          </div>

          <!-- Dạng từ biến thể (Forms) -->
          <div class="p-3.5 rounded-brut border-2 border-line bg-surface space-y-2">
            <h4 class="text-xs font-black uppercase text-ink-soft">Dạng từ biến thể (Forms)</h4>
            <div v-if="selectedEntry.lex_forms?.length" class="flex flex-wrap gap-1.5">
              <span
                v-for="f in selectedEntry.lex_forms"
                :key="f.id"
                class="px-2 py-0.5 rounded-brut border border-line bg-surface-2 text-xs font-bold text-ink"
              >
                <strong class="font-black">{{ f.form }}</strong>
                <span class="text-[10px] text-ink-soft ml-1">({{ f.form_type }})</span>
              </span>
            </div>
            <p v-else class="text-xs text-ink-soft italic">Không có dạng biến thể đặc biệt.</p>
          </div>
        </div>

        <!-- Nguồn gốc dữ liệu & Giấy phép (Attribution) -->
        <div v-if="selectedEntry.lex_attributions?.length" class="p-3 rounded-brut border-2 border-line bg-surface-2/40 text-xs space-y-1">
          <div class="flex items-center gap-1.5 font-bold text-ink">
            <Info class="h-3.5 w-3.5 text-accent" />
            <span>Nguồn dữ liệu & Bản quyền:</span>
          </div>
          <div
            v-for="attr in selectedEntry.lex_attributions"
            :key="attr.id"
            class="text-[11px] text-ink-soft flex items-center justify-between"
          >
            <span>{{ attr.attribution_text }} ({{ attr.license_name }})</span>
            <a
              v-if="attr.source_url"
              :href="attr.source_url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-accent hover:underline inline-flex items-center gap-1"
            >
              <span>Xem nguồn gốc</span>
              <ExternalLink class="h-3 w-3" />
            </a>
          </div>
        </div>

        <!-- DANH SÁCH TỪNG NGHĨA & DUYỆT (SENSES REVIEW WORKFLOW) -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-display font-black text-sm text-ink uppercase tracking-wider">
              Danh sách định nghĩa ({{ selectedEntry.lex_senses?.length || 0 }} nghĩa)
            </h3>
            <span class="text-xs text-ink-soft font-bold">
              Mỗi nghĩa có cấp độ và trạng thái duyệt độc lập
            </span>
          </div>

          <div
            v-for="(sense, sIdx) in selectedEntry.lex_senses"
            :key="sense.id"
            class="p-4 rounded-brut-lg border-2 border-line bg-surface space-y-3 shadow-brut-sm"
          >
            <!-- Header Nghĩa -->
            <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b-2 border-line/40">
              <div class="flex items-center gap-2">
                <span class="font-display font-black text-xs text-ink bg-surface-2 px-2 py-0.5 rounded-brut border border-line">
                  #{{ sense.sense_order || sIdx + 1 }}
                </span>
                <span class="px-2 py-0.5 rounded-brut border border-line bg-surface-2 text-xs font-black uppercase text-ink">
                  {{ sense.part_of_speech }}
                </span>
                <BaseBadge v-if="sense.level" v-bind="levelBadge(sense.level)" size="sm">
                  {{ sense.level }}
                </BaseBadge>
              </div>

              <!-- Trạng thái duyệt nghĩa & Các nút thao tác -->
              <div class="flex items-center gap-2">
                <BaseBadge v-bind="reviewBadgeConfig(sense.review_status)" size="sm">
                  {{ reviewBadgeConfig(sense.review_status).label }}
                </BaseBadge>

                <div class="flex items-center gap-1">
                  <button
                    v-if="sense.review_status !== 'approved'"
                    type="button"
                    class="px-2.5 py-1 text-[11px] font-black rounded-brut border border-line bg-ok/20 hover:bg-ok text-ink cursor-pointer"
                    title="Duyệt nghĩa này"
                    @click="handleSetSenseReview(sense, 'approved')"
                  >
                    ✓ Duyệt nghĩa
                  </button>
                  <button
                    v-if="sense.review_status !== 'rejected'"
                    type="button"
                    class="px-2.5 py-1 text-[11px] font-bold rounded-brut border border-line bg-bad/20 hover:bg-bad text-ink cursor-pointer"
                    title="Từ chối nghĩa này"
                    @click="handleSetSenseReview(sense, 'rejected')"
                  >
                    ✕ Từ chối
                  </button>
                  <button
                    v-if="sense.review_status !== 'pending'"
                    type="button"
                    class="px-2 py-1 text-[11px] font-bold rounded-brut border border-line bg-surface-2 text-ink-soft hover:text-ink cursor-pointer"
                    title="Đưa về chờ duyệt"
                    @click="handleSetSenseReview(sense, 'pending')"
                  >
                    Chờ duyệt
                  </button>
                </div>
              </div>
            </div>

            <!-- Định nghĩa tiếng Anh -->
            <div>
              <p class="text-xs font-bold text-ink leading-relaxed">
                {{ sense.definition }}
              </p>
            </div>

            <!-- Bản dịch tiếng Việt -->
            <div class="p-3 bg-surface-2/60 rounded-brut border border-line/60 space-y-2">
              <div class="flex items-center justify-between text-[11px] font-bold text-ink-soft">
                <span>Bản dịch tiếng Việt:</span>
                <span v-if="!sense.lex_translations?.length" class="text-warn italic">Chưa có bản dịch</span>
              </div>

              <div
                v-for="trans in sense.lex_translations"
                :key="trans.id"
                class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <!-- Trình xem hoặc sửa text -->
                <div v-if="editingTranslationId === trans.id" class="flex-1 flex items-center gap-2">
                  <input
                    v-model="editingTranslationText"
                    type="text"
                    class="flex-1 px-2.5 py-1 text-xs font-bold rounded-brut border-2 border-line bg-surface text-ink"
                  />
                  <button
                    type="button"
                    class="px-2.5 py-1 text-xs font-black rounded-brut border border-line bg-ok text-on-tone cursor-pointer"
                    @click="handleSetTranslationReview(trans, trans.review_status, editingTranslationText)"
                  >
                    Lưu
                  </button>
                  <button
                    type="button"
                    class="px-2 py-1 text-xs font-bold text-ink-soft cursor-pointer"
                    @click="editingTranslationId = null"
                  >
                    Hủy
                  </button>
                </div>

                <div v-else class="flex-1 font-bold text-ink">
                  🇻🇳 {{ trans.translated_text }}
                </div>

                <!-- Thao tác duyệt dịch -->
                <div v-if="editingTranslationId !== trans.id" class="flex items-center gap-1.5 shrink-0">
                  <BaseBadge v-bind="reviewBadgeConfig(trans.review_status)" size="sm">
                    {{ reviewBadgeConfig(trans.review_status).label }}
                  </BaseBadge>

                  <button
                    v-if="trans.review_status !== 'approved'"
                    type="button"
                    class="px-2 py-0.5 text-[10px] font-bold rounded-brut border border-line bg-ok/20 hover:bg-ok text-ink cursor-pointer"
                    @click="handleSetTranslationReview(trans, 'approved')"
                  >
                    Duyệt dịch
                  </button>
                  <button
                    v-if="trans.review_status !== 'rejected'"
                    type="button"
                    class="px-2 py-0.5 text-[10px] font-bold rounded-brut border border-line bg-bad/20 hover:bg-bad text-ink cursor-pointer"
                    @click="handleSetTranslationReview(trans, 'rejected')"
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    class="px-2 py-0.5 text-[10px] font-bold text-accent hover:underline cursor-pointer"
                    @click="editingTranslationId = trans.id; editingTranslationText = trans.translated_text"
                  >
                    Sửa
                  </button>
                </div>
              </div>
            </div>

            <!-- Câu ví dụ minh họa -->
            <div v-if="sense.lex_examples?.length" class="space-y-2 pt-1">
              <div class="text-[11px] font-bold text-ink-soft">Câu ví dụ:</div>
              <div
                v-for="ex in sense.lex_examples"
                :key="ex.id"
                class="p-2.5 rounded-brut border border-line/50 bg-surface-2/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div class="space-y-0.5">
                  <p class="font-bold text-ink italic">"{{ ex.sentence }}"</p>
                  <p v-if="ex.sentence_vi" class="text-ink-soft">{{ ex.sentence_vi }}</p>
                </div>

                <div class="flex items-center gap-1.5 shrink-0">
                  <BaseBadge v-bind="reviewBadgeConfig(ex.review_status)" size="sm">
                    {{ reviewBadgeConfig(ex.review_status).label }}
                  </BaseBadge>

                  <button
                    v-if="ex.review_status !== 'approved'"
                    type="button"
                    class="px-2 py-0.5 text-[10px] font-bold rounded-brut border border-line bg-ok/20 hover:bg-ok text-ink cursor-pointer"
                    @click="handleSetExampleReview(ex, 'approved')"
                  >
                    Duyệt
                  </button>
                  <button
                    v-if="ex.review_status !== 'rejected'"
                    type="button"
                    class="px-2 py-0.5 text-[10px] font-bold rounded-brut border border-line bg-bad/20 hover:bg-bad text-ink cursor-pointer"
                    @click="handleSetExampleReview(ex, 'rejected')"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
