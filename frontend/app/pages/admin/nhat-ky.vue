<script setup lang="ts">
import { RefreshCw, ChevronLeft, ChevronRight, ScrollText, ChevronDown } from '@lucide/vue'
import PageBanner from '~/components/common/PageBanner.vue'
import { formatDateTime, type AuditEntry, type AuditList } from '~/composables/useAdmin'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Nhật ký hoạt động - Langua Admin' })

const { listAudit } = useAdmin()

const route = useRoute()
const PAGE_SIZE = 30
const action = ref(typeof route.query.action === 'string' ? route.query.action : '')
const entity = ref('')
const actor = ref('')
const page = ref(0)
const data = ref<AuditList | null>(null)
const isLoading = ref(true)
const loadError = ref('')
const expanded = ref<Set<number>>(new Set())

const ACTION_META: Record<AuditEntry['action'], { label: string; tone: 'blue' | 'green' | 'yellow' | 'coral' | 'violet' | 'neutral' | 'orange' }> = {
  insert: { label: 'Thêm', tone: 'green' },
  update: { label: 'Sửa', tone: 'blue' },
  delete: { label: 'Xoá', tone: 'coral' },
  import: { label: 'Import', tone: 'violet' },
  review: { label: 'Duyệt', tone: 'yellow' },
  role: { label: 'Vai trò', tone: 'orange' },
  ban: { label: 'Khoá', tone: 'coral' },
  unban: { label: 'Mở khoá', tone: 'neutral' },
}

// Tên dễ đọc cho bảng / nhóm nội dung
const ENTITY_LABEL: Record<string, string> = {
  user: 'Người dùng',
  vocab: 'Từ vựng', vocab_sets: 'Bộ từ vựng', vocab_words: 'Từ trong bộ',
  typing: 'Gõ câu', typing_topics: 'Chủ đề gõ câu', typing_sentences: 'Câu gõ',
  grammar: 'Ngữ pháp', grammar_points: 'Điểm ngữ pháp', grammar_exercises: 'Bài tập ngữ pháp',
  reading: 'Kho đọc', reading_items: 'Bài đọc', reading_sections: 'Đoạn bài đọc',
  media: 'Video & Podcast', media_items: 'Video / Podcast', media_cues: 'Phụ đề', media_quiz_questions: 'Câu hỏi media',
  dictionary: 'Từ điển', dictionary_entries: 'Mục từ điển',
  ielts: 'IELTS', exam_tests: 'Đề IELTS', exam_questions: 'Câu hỏi IELTS',
}
const entityLabel = (e: string) => ENTITY_LABEL[e] ?? e

const REVIEW_TO: Record<string, string> = { draft: 'Bản nháp', pending: 'Chờ duyệt', published: 'Đã xuất bản' }

const load = async () => {
  isLoading.value = true
  loadError.value = ''
  try {
    data.value = await listAudit({
      action: action.value || null,
      entity: entity.value || null,
      actor: actor.value || null,
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
watch([action, entity, actor], () => { page.value = 0; load() })

const pageCount = computed(() => Math.max(1, Math.ceil((data.value?.total ?? 0) / PAGE_SIZE)))
const goPage = (delta: number) => {
  page.value = Math.min(Math.max(page.value + delta, 0), pageCount.value - 1)
  load()
}

const toggle = (id: number) => {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

// Chi tiết hiển thị được của từng loại mục
const detailLines = (e: AuditEntry): string[] => {
  const d = e.details || {}
  const out: string[] = []
  if (d.columns?.length) out.push(`Trường thay đổi: ${d.columns.join(', ')}`)
  if (d.to_status) out.push(`Trạng thái mới: ${REVIEW_TO[d.to_status] ?? d.to_status}`)
  if (d.note) out.push(`Ghi chú: ${d.note}`)
  if (d.reason) out.push(`Lý do: ${d.reason}`)
  if (d.days !== undefined) out.push(`Thời hạn: ${d.days === null ? 'vĩnh viễn' : `${d.days} ngày`}`)
  if (d.file_name) out.push(`Tệp: ${d.file_name} (${d.rows_ok}/${d.rows_total} dòng thành công, ${d.rows_failed} lỗi)`)
  if (e.entity_ids?.length) out.push(`Mã bản ghi: ${e.entity_ids.slice(0, 20).join(', ')}${(d.count ?? 0) > 20 ? ' …' : ''}`)
  return out
}

const hasFilter = computed(() => !!(action.value || entity.value || actor.value))
const clearFilters = () => {
  action.value = ''
  entity.value = ''
  actor.value = ''
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 space-y-5">
    <PageBanner
      title="Nhật ký hoạt động"
      description="Ai đã import, sửa, xoá, duyệt nội dung hay đổi quyền tài khoản, và vào lúc nào."
      badge-text="Quản trị"
      feature="admin"
    />

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-3xl">
      <label class="block">
        <span class="mb-1 block text-xs font-black text-ink">Hành động</span>
        <select v-model="action" class="w-full min-h-[44px] rounded-brut border-2 border-line bg-surface px-3 text-sm text-ink cursor-pointer">
          <option value="">Tất cả</option>
          <option v-for="(m, k) in ACTION_META" :key="k" :value="k">{{ m.label }}</option>
        </select>
      </label>
      <label class="block">
        <span class="mb-1 block text-xs font-black text-ink">Đối tượng</span>
        <select v-model="entity" class="w-full min-h-[44px] rounded-brut border-2 border-line bg-surface px-3 text-sm text-ink cursor-pointer">
          <option value="">Tất cả</option>
          <option v-for="e in data?.entities ?? []" :key="e" :value="e">{{ entityLabel(e) }}</option>
        </select>
      </label>
      <label class="block">
        <span class="mb-1 block text-xs font-black text-ink">Người thực hiện</span>
        <select v-model="actor" class="w-full min-h-[44px] rounded-brut border-2 border-line bg-surface px-3 text-sm text-ink cursor-pointer">
          <option value="">Tất cả</option>
          <option v-for="a in data?.actors ?? []" :key="a.id" :value="a.id">{{ a.email }}</option>
        </select>
      </label>
    </div>

    <BaseCard>
      <div v-if="loadError" class="flex flex-col items-center gap-3 py-8 text-center">
        <p class="text-sm font-bold text-bad" role="alert">{{ loadError }}</p>
        <BaseButton variant="secondary" size="sm" @click="load"><RefreshCw class="h-4 w-4" /> <span>Tải lại</span></BaseButton>
      </div>

      <BaseSkeleton v-else-if="isLoading && !data" height="3.5rem" :count="6" />

      <BaseEmptyState
        v-else-if="data && data.rows.length === 0"
        :icon="ScrollText"
        :title="hasFilter ? 'Không có mục nào khớp bộ lọc' : 'Chưa có hoạt động nào'"
        :description="hasFilter ? 'Bỏ bớt điều kiện lọc để xem thêm.' : 'Các thao tác import, sửa nội dung, duyệt bài và phân quyền sẽ xuất hiện ở đây.'"
      >
        <template v-if="hasFilter" #action>
          <BaseButton variant="secondary" size="sm" @click="clearFilters">Bỏ lọc</BaseButton>
        </template>
      </BaseEmptyState>

      <ol v-else-if="data" :class="{ 'opacity-60': isLoading }">
        <li v-for="e in data.rows" :key="e.id" class="border-t border-line/30 py-3 first:border-t-0 first:pt-0 last:pb-0">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
            <time :datetime="e.created_at" class="shrink-0 text-[11px] font-bold text-ink-soft tabular-nums sm:w-32 sm:pt-0.5">
              {{ formatDateTime(e.created_at) }}
            </time>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <BaseBadge :tone="ACTION_META[e.action]?.tone ?? 'neutral'" size="sm">{{ ACTION_META[e.action]?.label ?? e.action }}</BaseBadge>
                <span class="text-[11px] font-bold text-ink-soft">{{ entityLabel(e.entity_type) }}</span>
              </div>
              <p class="mt-1 break-words text-sm text-ink">{{ e.summary }}</p>
              <p class="mt-0.5 text-[11px] text-ink-soft">
                {{ e.actor_name || e.actor_email || 'Hệ thống' }}<template v-if="e.actor_name && e.actor_email"> ({{ e.actor_email }})</template>
              </p>
              <div v-if="detailLines(e).length" class="mt-1">
                <button
                  type="button"
                  class="inline-flex min-h-[44px] items-center gap-1 text-xs font-bold text-ink-soft hover:text-ink cursor-pointer"
                  :aria-expanded="expanded.has(e.id)"
                  @click="toggle(e.id)"
                >
                  <ChevronDown class="h-3.5 w-3.5 transition-transform" :class="{ 'rotate-180': expanded.has(e.id) }" aria-hidden="true" />
                  {{ expanded.has(e.id) ? 'Ẩn chi tiết' : 'Xem chi tiết' }}
                </button>
                <ul v-if="expanded.has(e.id)" class="mt-1 space-y-1 rounded-brut border-2 border-line bg-surface-2 p-3 text-xs text-ink">
                  <li v-for="(line, i) in detailLines(e)" :key="i" class="break-words">{{ line }}</li>
                </ul>
              </div>
            </div>
          </div>
        </li>
      </ol>

      <template v-if="data && data.total > PAGE_SIZE" #footer>
        <div class="flex items-center justify-between gap-3 pt-2 text-xs">
          <span class="text-ink-soft tabular-nums">
            {{ page * PAGE_SIZE + 1 }}–{{ Math.min((page + 1) * PAGE_SIZE, data.total) }} / {{ data.total }} mục
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
  </div>
</template>
