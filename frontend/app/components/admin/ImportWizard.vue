<script setup lang="ts">
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  FileText,
  AlertCircle,
  Info,
} from '@lucide/vue'
import { parseCsv, stringifyCsv } from '~/utils/csvParser'
import { parseSRT, type ParsedSubtitle } from '~/utils/subtitleParser'
import {
  CONTENT_TYPE_DEFINITIONS,
  type ContentType,
  type ContentTypeDefinition,
} from './importTypes'
import type { Database } from '~/types/database.types'

const props = defineProps<{
  initialType?: ContentType
}>()

const client = useSupabaseClient<Database>()
const { user } = useAuth()

// 1. Quản lý Step: 1 -> 2 -> 3 -> 4
const currentStep = ref<1 | 2 | 3 | 4>(1)
const selectedType = ref<ContentType>(props.initialType || 'vocab')
const currentDef = computed<ContentTypeDefinition>(() => CONTENT_TYPE_DEFINITIONS[selectedType.value])

// 2. Dữ liệu nạp từ Step 2
const rawInputMode = ref<'file' | 'paste'>('file')
const pastedText = ref('')
const fileName = ref('')
const fileSize = ref(0)
const uploadError = ref<string | null>(null)

// Dành riêng cho phụ đề video
const subtitleFileName = ref('')
const parsedSubtitles = ref<ParsedSubtitle[]>([])

// 3. Kết quả Dry-Run từ Step 3
interface ValidatedRow {
  index: number
  data: Record<string, any>
  error: string | null
}
const validatedRows = ref<ValidatedRow[]>([])
const validRows = computed(() => validatedRows.value.filter(r => !r.error))
const errorRows = computed(() => validatedRows.value.filter(r => r.error))
const ignoreErrorRows = ref(true)

// 4. Quá trình Import ở Step 4
const isImporting = ref(false)
const importProgress = ref(0)
const importSummary = ref<{
  total: number
  ok: number
  failed: number
  errors: { row: number; reason: string }[]
} | null>(null)

// Đổi loại nội dung
const changeType = (t: ContentType) => {
  selectedType.value = t
  resetWizard()
}

const resetWizard = () => {
  pastedText.value = ''
  fileName.value = ''
  fileSize.value = 0
  uploadError.value = null
  subtitleFileName.value = ''
  parsedSubtitles.value = []
  validatedRows.value = []
  importSummary.value = null
  importProgress.value = 0
}

// Xử lý upload file nội dung
const handleFileUpload = (e: Event) => {
  uploadError.value = null
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Giới hạn 2MB
  if (file.size > 2 * 1024 * 1024) {
    uploadError.value = 'File vượt quá kích thước tối đa 2MB. Vui lòng giảm dung lượng file.'
    input.value = ''
    return
  }

  fileName.value = file.name
  fileSize.value = file.size

  const reader = new FileReader()
  reader.onload = (event) => {
    const text = event.target?.result as string
    processRawText(text, file.name)
  }
  reader.readAsText(file, 'utf-8')
}

// Xử lý upload file phụ đề riêng cho Video
const handleSubtitleUpload = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  subtitleFileName.value = file.name
  const reader = new FileReader()
  reader.onload = (event) => {
    const text = event.target?.result as string
    parsedSubtitles.value = parseSRT(text)
  }
  reader.readAsText(file, 'utf-8')
}

// Chuyển chuỗi thô thành danh sách đối tượng
const processRawText = (text: string, sourceName = 'pasted_content') => {
  uploadError.value = null
  let rows: Record<string, any>[] = []

  const trimmed = text.trim()
  if (!trimmed) {
    uploadError.value = 'Nội dung trống, vui lòng tải file hoặc dán nội dung.'
    return
  }

  try {
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      // JSON
      const parsed = JSON.parse(trimmed)
      rows = Array.isArray(parsed) ? parsed : [parsed]
    } else {
      // CSV
      rows = parseCsv(trimmed, { trimValues: true })
    }
  } catch (err: any) {
    uploadError.value = `Lỗi định dạng dữ liệu: ${err.message}`
    return
  }

  // Giới hạn tối đa 2000 dòng
  if (rows.length > 2000) {
    uploadError.value = `Số lượng dòng (${rows.length}) vượt quá giới hạn tối đa 2000 dòng mỗi lần import.`
    return
  }

  if (rows.length === 0) {
    uploadError.value = 'Không tìm thấy dòng dữ liệu nào sau khi phân tích.'
    return
  }

  // Chuyển sang Step 3 và thực hiện Dry-Run kiểm tra
  runDryRun(rows, sourceName)
}

// Dry-Run: Kiểm tra hợp lệ từng dòng
const runDryRun = (rows: Record<string, any>[], sourceName: string) => {
  fileName.value = sourceName
  const def = currentDef.value
  const results: ValidatedRow[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const err = def.validateRow(row, i + 1)
    results.push({
      index: i + 1,
      data: row,
      error: err,
    })
  }

  validatedRows.value = results
  currentStep.value = 3
}

// Thực hiện chuyển từ Step 2 sang Step 3 khi dán nội dung
const proceedFromStep2 = () => {
  if (rawInputMode.value === 'paste') {
    processRawText(pastedText.value, 'pasted_text.csv')
  }
}

// Tiến hành Import vào Supabase ở Step 4
const executeImport = async () => {
  if (validRows.value.length === 0) return

  isImporting.value = true
  importProgress.value = 10
  currentStep.value = 4

  const rowsToImport = ignoreErrorRows.value ? validRows.value.map(r => r.data) : validatedRows.value.map(r => r.data)
  const def = currentDef.value

  try {
    importProgress.value = 35
    const result = await def.importData(rowsToImport, client, {
      subtitles: parsedSubtitles.value,
    })

    importProgress.value = 85

    // Tổng hợp lỗi từ kiểm tra trước và lỗi từ Supabase
    const allErrors = [
      ...errorRows.value.map(r => ({ row: r.index, reason: r.error! })),
      ...result.errors,
    ].slice(0, 50)

    const totalRows = validatedRows.value.length
    const okRows = result.okCount
    const failedRows = totalRows - okRows

    // Ghi nhật ký vào bảng content_import_logs
    if (user.value) {
      await client.from('content_import_logs').insert({
        admin_id: user.value.id,
        content_type: selectedType.value,
        file_name: fileName.value || 'direct_input',
        rows_total: totalRows,
        rows_ok: okRows,
        rows_failed: failedRows,
        status: failedRows === 0 ? 'completed' : okRows > 0 ? 'partial' : 'failed',
        errors: allErrors,
      })
    }

    importSummary.value = {
      total: totalRows,
      ok: okRows,
      failed: failedRows,
      errors: allErrors,
    }

    importProgress.value = 100
  } catch (err: any) {
    importSummary.value = {
      total: validatedRows.value.length,
      ok: 0,
      failed: validatedRows.value.length,
      errors: [{ row: 0, reason: `Lỗi hệ thống: ${err.message}` }],
    }
  } finally {
    isImporting.value = false
  }
}

// Tải file CSV chứa các dòng bị lỗi
const downloadErrorCsv = () => {
  if (!importSummary.value || importSummary.value.errors.length === 0) return
  const csvContent = stringifyCsv(importSummary.value.errors)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `import_errors_${selectedType.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Stepper Navigation -->
    <div class="border-[3px] border-line rounded-brut-lg bg-surface p-4 sm:p-5 shadow-brut">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div
          v-for="step in [
            { num: 1, title: '1. Chọn loại' },
            { num: 2, title: '2. Tải dữ liệu' },
            { num: 3, title: '3. Kiểm tra' },
            { num: 4, title: '4. Kết quả' }
          ]"
          :key="step.num"
          class="flex items-center gap-2 px-3 py-2 rounded-brut border-2 font-display text-xs font-black transition-all"
          :class="[
            currentStep === step.num
              ? 'border-line bg-warn text-on-tone shadow-brut-sm'
              : currentStep > step.num
                ? 'border-line bg-surface-2 text-ink'
                : 'border-transparent text-ink-soft'
          ]"
        >
          <span
            class="flex h-5 w-5 items-center justify-center rounded-full border border-line text-[10px]"
            :class="currentStep >= step.num ? 'bg-surface text-ink' : 'bg-surface-2 text-ink-soft'"
          >
            {{ step.num }}
          </span>
          <span class="truncate">{{ step.title }}</span>
        </div>
      </div>
    </div>

    <!-- BƯỚC 1: CHỌN LOẠI NỘI DUNG & TẢI FILE MẪU -->
    <div v-if="currentStep === 1" class="space-y-6">
      <BaseCard title="Chọn loại nội dung cần nạp vào hệ thống">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-3">
          <button
            v-for="(def, key) in CONTENT_TYPE_DEFINITIONS"
            :key="key"
            type="button"
            class="p-4 rounded-brut border-2 text-left cursor-pointer transition-all brut-press flex flex-col justify-between"
            :class="[
              selectedType === key
                ? 'border-line bg-surface-2 shadow-brut font-black'
                : 'border-line bg-surface hover:bg-surface-2/40 shadow-brut-sm'
            ]"
            @click="changeType(key)"
          >
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <h4 class="font-display font-black text-sm text-ink">{{ def.title }}</h4>
                <span v-if="selectedType === key" class="flex h-2.5 w-2.5 rounded-full bg-ok border border-line" />
              </div>
              <p class="text-xs text-ink-soft line-clamp-2 leading-relaxed">{{ def.description }}</p>
            </div>
            <div class="mt-3 pt-2 border-t border-line/20 flex items-center justify-between text-[11px] font-bold text-ink-soft">
              <span>{{ def.columns.length }} trường dữ liệu</span>
              <span class="text-ink underline">Chọn</span>
            </div>
          </button>
        </div>
      </BaseCard>

      <!-- Tải File Mẫu và Thông tin bản quyền -->
      <BaseCard :title="`File mẫu cho: ${currentDef.title}`" accent="left" accent-color="var(--warn)">
        <div class="space-y-4">
          <p class="text-xs sm:text-sm text-ink-soft leading-relaxed">
            Tải các file mẫu bên dưới đã được chuẩn hoá cấu trúc cột và dữ liệu mẫu tự biên soạn (`license: original`):
          </p>

          <!-- Warning Notice nếu có -->
          <div v-if="currentDef.notice" class="p-3.5 rounded-brut border-2 border-line bg-warn/15 flex items-start gap-2.5">
            <AlertTriangle class="h-4 w-4 text-warn shrink-0 mt-0.5" :stroke-width="2.5" />
            <p class="text-xs font-bold text-ink leading-relaxed">
              {{ currentDef.notice }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            <a
              :href="currentDef.csvTemplatePath"
              download
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-brut border-2 border-line bg-surface font-display text-xs font-bold text-ink shadow-brut-sm hover:bg-surface-2 brut-press text-decoration-none"
            >
              <Download class="h-3.5 w-3.5" :stroke-width="2.5" />
              <span>Tải mẫu CSV (.csv)</span>
            </a>

            <a
              :href="currentDef.jsonTemplatePath"
              download
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-brut border-2 border-line bg-surface font-display text-xs font-bold text-ink shadow-brut-sm hover:bg-surface-2 brut-press text-decoration-none"
            >
              <Download class="h-3.5 w-3.5" :stroke-width="2.5" />
              <span>Tải mẫu JSON (.json)</span>
            </a>

            <a
              v-if="currentDef.extraTemplatePath"
              :href="currentDef.extraTemplatePath"
              download
              class="inline-flex items-center gap-2 px-3.5 py-2 rounded-brut border-2 border-line bg-warn font-display text-xs font-black text-on-tone shadow-brut-sm hover:bg-warn/80 brut-press text-decoration-none"
            >
              <Download class="h-3.5 w-3.5" :stroke-width="2.5" />
              <span>{{ currentDef.extraTemplateLabel || 'Tải phụ đề mẫu' }}</span>
            </a>
          </div>

          <!-- Các cột bắt buộc -->
          <div class="mt-4 pt-3 border-t-2 border-line/20">
            <h5 class="font-display font-black text-xs text-ink mb-2">Quy chuẩn cột dữ liệu:</h5>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="col in currentDef.columns"
                :key="col.key"
                class="px-2 py-0.5 rounded-brut border border-line text-[11px] font-mono"
                :class="col.required ? 'bg-bad/15 text-bad font-bold border-bad' : 'bg-surface text-ink-soft'"
                :title="col.label + (col.required ? ' (Bắt buộc)' : '')"
              >
                {{ col.key }}{{ col.required ? '*' : '' }}
              </span>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <BaseButton tone="warn" @click="currentStep = 2">
              <span>Tiếp tục: Tải file dữ liệu</span>
              <ArrowRight class="h-4 w-4 ml-1.5" />
            </BaseButton>
          </div>
        </template>
      </BaseCard>
    </div>

    <!-- BƯỚC 2: TẢI FILE LÊN HOẶC DÁN NỘI DUNG -->
    <div v-if="currentStep === 2" class="space-y-6">
      <BaseCard :title="`Tải dữ liệu cho: ${currentDef.title}`">
        <!-- Chuyển tab tải file hoặc dán -->
        <div class="flex items-center gap-2 mb-4 border-b-2 border-line pb-3">
          <button
            type="button"
            class="min-h-[44px] px-3.5 py-2 rounded-brut border-2 font-display text-xs font-bold transition-all"
            :class="rawInputMode === 'file' ? 'border-line bg-surface-2 text-ink shadow-brut-sm' : 'border-transparent text-ink-soft'"
            @click="rawInputMode = 'file'"
          >
            Tải file CSV/JSON (Tối đa 2MB)
          </button>
          <button
            type="button"
            class="min-h-[44px] px-3.5 py-2 rounded-brut border-2 font-display text-xs font-bold transition-all"
            :class="rawInputMode === 'paste' ? 'border-line bg-surface-2 text-ink shadow-brut-sm' : 'border-transparent text-ink-soft'"
            @click="rawInputMode = 'paste'"
          >
            Dán nội dung trực tiếp
          </button>
        </div>

        <!-- Mode 1: File Upload -->
        <div v-if="rawInputMode === 'file'" class="space-y-4">
          <label class="block border-2 border-dashed border-line rounded-brut-lg p-8 text-center bg-surface hover:bg-surface-2/30 cursor-pointer transition-colors">
            <Upload class="h-8 w-8 mx-auto text-ink-soft mb-2" :stroke-width="2" />
            <span class="block font-display font-black text-sm text-ink mb-1">
              Bấm để chọn file hoặc kéo thả file vào đây
            </span>
            <span class="block text-xs text-ink-soft">
              Hỗ trợ .csv, .json • Tối đa 2MB và 2,000 dòng
            </span>
            <input
              type="file"
              accept=".csv,.json,text/csv,application/json"
              class="hidden"
              @change="handleFileUpload"
            />
          </label>

          <!-- File phụ đề kèm theo (dành riêng cho Video) -->
          <div v-if="selectedType === 'media'" class="p-4 rounded-brut border-2 border-line bg-surface-2/40 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-display font-black text-xs text-ink">Phụ đề song ngữ đính kèm (.srt hoặc .vtt):</span>
              <span v-if="subtitleFileName" class="text-[11px] font-bold text-ok">
                ✓ Đã tải: {{ subtitleFileName }} ({{ parsedSubtitles.length }} câu)
              </span>
            </div>
            <input
              type="file"
              accept=".srt,.vtt,text/plain"
              class="block w-full text-xs text-ink file:mr-3 file:py-1.5 file:px-3 file:rounded-brut file:border-2 file:border-line file:bg-surface file:text-xs file:font-bold file:cursor-pointer"
              @change="handleSubtitleUpload"
            />
          </div>

          <div v-if="fileName" class="p-3 rounded-brut border-2 border-line bg-surface flex items-center justify-between">
            <div class="flex items-center gap-2">
              <FileSpreadsheet class="h-4 w-4 text-ink" />
              <span class="font-bold text-xs text-ink">{{ fileName }}</span>
              <span class="text-[11px] text-ink-soft">({{ (fileSize / 1024).toFixed(1) }} KB)</span>
            </div>
            <span class="text-xs font-bold text-ok flex items-center gap-1">
              <CheckCircle2 class="h-3.5 w-3.5" /> Đã nạp
            </span>
          </div>
        </div>

        <!-- Mode 2: Dán nội dung -->
        <div v-else class="space-y-3">
          <textarea
            v-model="pastedText"
            rows="10"
            class="w-full p-3 font-mono text-xs rounded-brut border-2 border-line bg-surface text-ink focus:outline-none focus:border-ink"
            placeholder="Dán nội dung CSV hoặc JSON vào đây... (dòng đầu tiên là tiêu đề cột)"
          />
        </div>

        <!-- Lỗi tải file -->
        <div v-if="uploadError" class="mt-4 p-3.5 rounded-brut border-2 border-bad bg-bad/10 flex items-start gap-2.5">
          <AlertCircle class="h-4 w-4 text-bad shrink-0 mt-0.5" />
          <p class="text-xs font-bold text-bad leading-relaxed">{{ uploadError }}</p>
        </div>

        <template #footer>
          <div class="flex items-center justify-between">
            <BaseButton tone="neutral" @click="currentStep = 1">
              <ArrowLeft class="h-4 w-4 mr-1.5" />
              <span>Quay lại</span>
            </BaseButton>

            <BaseButton
              tone="warn"
              :disabled="rawInputMode === 'paste' ? !pastedText.trim() : !fileName"
              @click="proceedFromStep2"
            >
              <span>Kiểm tra trước (Dry-Run)</span>
              <ArrowRight class="h-4 w-4 ml-1.5" />
            </BaseButton>
          </div>
        </template>
      </BaseCard>
    </div>

    <!-- BƯỚC 3: KIỂM TRA TRƯỚC (DRY-RUN) -->
    <div v-if="currentStep === 3" class="space-y-6">
      <BaseCard :title="`Kết quả kiểm tra trước: ${fileName}`">
        <!-- Bảng thống kê sơ bộ -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div class="p-3 rounded-brut border-2 border-line bg-surface">
            <span class="text-[11px] font-bold text-ink-soft">Tổng số dòng đọc được</span>
            <p class="font-display font-black text-xl text-ink">{{ validatedRows.length }}</p>
          </div>
          <div class="p-3 rounded-brut border-2 border-line bg-ok/10">
            <span class="text-[11px] font-bold text-ok">Dòng hợp lệ sẵn sàng nạp</span>
            <p class="font-display font-black text-xl text-ok">{{ validRows.length }}</p>
          </div>
          <div class="p-3 rounded-brut border-2 border-line" :class="errorRows.length > 0 ? 'bg-bad/10' : 'bg-surface'">
            <span class="text-[11px] font-bold" :class="errorRows.length > 0 ? 'text-bad' : 'text-ink-soft'">Dòng lỗi</span>
            <p class="font-display font-black text-xl" :class="errorRows.length > 0 ? 'text-bad' : 'text-ink-soft'">{{ errorRows.length }}</p>
          </div>
        </div>

        <!-- Tùy chọn xử lý dòng lỗi -->
        <div v-if="errorRows.length > 0" class="p-3.5 rounded-brut border-2 border-line bg-surface-2/40 mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <input
              id="ignoreErrors"
              v-model="ignoreErrorRows"
              type="checkbox"
              class="h-4 w-4 rounded border-2 border-line accent-warn cursor-pointer"
            />
            <label for="ignoreErrors" class="text-xs font-bold text-ink cursor-pointer">
              Bỏ qua các dòng lỗi và chỉ nạp {{ validRows.length }} dòng hợp lệ
            </label>
          </div>
          <span class="text-[11px] text-ink-soft font-mono">Lỗi: {{ errorRows.length }} dòng</span>
        </div>

        <!-- Bảng xem trước dữ liệu có cuộn ngang -->
        <div class="border-2 border-line rounded-brut overflow-hidden max-h-96 overflow-y-auto">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs border-collapse">
              <thead class="bg-surface-2 border-b-2 border-line font-display font-black sticky top-0 z-10">
                <tr>
                  <th class="p-2.5 border-r border-line w-12 text-center">#</th>
                  <th class="p-2.5 border-r border-line w-28">Trạng thái</th>
                  <th
                    v-for="col in currentDef.columns.slice(0, 5)"
                    :key="col.key"
                    class="p-2.5 border-r border-line whitespace-nowrap"
                  >
                    {{ col.label }}
                  </th>
                  <th class="p-2.5">Ghi chú lỗi / Chi tiết</th>
                </tr>
              </thead>
              <tbody class="divide-y border-line">
                <tr
                  v-for="r in validatedRows.slice(0, 100)"
                  :key="r.index"
                  :class="r.error ? 'bg-bad/10' : 'bg-surface hover:bg-surface-2/20'"
                >
                  <td class="p-2 border-r border-line text-center font-mono font-bold">{{ r.index }}</td>
                  <td class="p-2 border-r border-line">
                    <span
                      class="inline-block px-1.5 py-0.5 rounded text-[10px] font-black"
                      :class="r.error ? 'bg-bad text-on-tone' : 'bg-ok/20 text-ok'"
                    >
                      {{ r.error ? 'LỖI' : 'HỢP LỆ' }}
                    </span>
                  </td>
                  <td
                    v-for="col in currentDef.columns.slice(0, 5)"
                    :key="col.key"
                    class="p-2 border-r border-line max-w-[150px] truncate"
                    :title="String(r.data[col.key] || '')"
                  >
                    {{ r.data[col.key] || '-' }}
                  </td>
                  <td class="p-2 text-[11px]" :class="r.error ? 'text-bad font-bold' : 'text-ink-soft'">
                    {{ r.error || 'Sẵn sàng nạp' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p v-if="validatedRows.length > 100" class="text-[11px] text-ink-soft mt-2 text-right">
          (Đang hiển thị 100 dòng đầu tiên trong tổng số {{ validatedRows.length }} dòng)
        </p>

        <template #footer>
          <div class="flex items-center justify-between">
            <BaseButton tone="neutral" @click="currentStep = 2">
              <ArrowLeft class="h-4 w-4 mr-1.5" />
              <span>Quay lại</span>
            </BaseButton>

            <BaseButton
              tone="ok"
              :disabled="validRows.length === 0 || (!ignoreErrorRows && errorRows.length > 0)"
              @click="executeImport"
            >
              <span>Tiến hành nạp vào cơ sở dữ liệu ({{ ignoreErrorRows ? validRows.length : validatedRows.length }} dòng)</span>
              <ArrowRight class="h-4 w-4 ml-1.5" />
            </BaseButton>
          </div>
        </template>
      </BaseCard>
    </div>

    <!-- BƯỚC 4: KẾT QUẢ IMPORT & TIẾN TRÌNH -->
    <div v-if="currentStep === 4" class="space-y-6">
      <BaseCard title="Tiến trình & Kết quả nạp nội dung">
        <!-- Đang thực thi -->
        <div v-if="isImporting" class="py-10 text-center space-y-4">
          <RefreshCw class="h-8 w-8 mx-auto text-ink animate-spin" />
          <h4 class="font-display font-black text-base text-ink">Đang nạp dữ liệu vào Supabase...</h4>
          <p class="text-xs text-ink-soft">Vui lòng không đóng trình duyệt trong quá trình này.</p>
          <div class="max-w-md mx-auto h-3 rounded-full border-2 border-line bg-surface overflow-hidden">
            <div class="h-full bg-warn transition-all duration-300" :style="{ width: `${importProgress}%` }" />
          </div>
        </div>

        <!-- Báo cáo kết quả -->
        <div v-else-if="importSummary" class="space-y-5">
          <div
            class="p-4 rounded-brut border-2 border-line flex items-start gap-3"
            :class="importSummary.failed === 0 ? 'bg-ok/15' : 'bg-warn/20'"
          >
            <CheckCircle2 v-if="importSummary.failed === 0" class="h-6 w-6 text-ok shrink-0 mt-0.5" />
            <AlertTriangle v-else class="h-6 w-6 text-warn shrink-0 mt-0.5" />
            <div>
              <h4 class="font-display font-black text-base text-ink">
                {{ importSummary.failed === 0 ? 'Nhập dữ liệu thành công hoàn toàn!' : 'Đã nhập dữ liệu (có một số dòng lỗi)' }}
              </h4>
              <p class="text-xs text-ink-soft mt-0.5">
                Các bản ghi mới mặc định lưu ở trạng thái bản nháp (`is_published = false`). Bạn có thể vào trang quản lý để xem và duyệt xuất bản.
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-3.5 rounded-brut border-2 border-line bg-surface">
              <span class="text-xs font-bold text-ink-soft">Tổng số dòng xử lý</span>
              <p class="font-display font-black text-2xl text-ink">{{ importSummary.total }}</p>
            </div>
            <div class="p-3.5 rounded-brut border-2 border-line bg-ok/10">
              <span class="text-xs font-bold text-ok">Thành công</span>
              <p class="font-display font-black text-2xl text-ok">{{ importSummary.ok }}</p>
            </div>
            <div class="p-3.5 rounded-brut border-2 border-line" :class="importSummary.failed > 0 ? 'bg-bad/10' : 'bg-surface'">
              <span class="text-xs font-bold" :class="importSummary.failed > 0 ? 'text-bad' : 'text-ink-soft'">Thất bại / Bỏ qua</span>
              <p class="font-display font-black text-2xl" :class="importSummary.failed > 0 ? 'text-bad' : 'text-ink-soft'">{{ importSummary.failed }}</p>
            </div>
          </div>

          <!-- Nút tải file dòng lỗi nếu có -->
          <div v-if="importSummary.errors.length > 0" class="p-4 rounded-brut border-2 border-line bg-surface space-y-3">
            <div class="flex items-center justify-between">
              <h5 class="font-display font-black text-xs text-bad flex items-center gap-1.5">
                <AlertCircle class="h-4 w-4" />
                Danh sách chi tiết các dòng gặp sự cố (tối đa 50 lỗi):
              </h5>
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-brut border-2 border-line bg-surface text-xs font-bold text-ink shadow-brut-sm hover:bg-surface-2 cursor-pointer"
                @click="downloadErrorCsv"
              >
                <Download class="h-3 w-3" /> Tải file CSV lỗi
              </button>
            </div>

            <ul class="text-xs space-y-1 max-h-48 overflow-y-auto font-mono text-ink-soft pl-4 list-disc">
              <li v-for="(err, idx) in importSummary.errors" :key="idx">
                <span class="font-bold text-bad">Dòng {{ err.row }}:</span> {{ err.reason }}
              </li>
            </ul>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between">
            <BaseButton tone="neutral" @click="resetWizard(); currentStep = 1">
              <RefreshCw class="h-4 w-4 mr-1.5" />
              <span>Nạp file mới</span>
            </BaseButton>

            <NuxtLink
              :to="`/admin/${selectedType}`"
              class="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-brut border-2 border-line bg-warn font-display text-xs font-black text-on-tone shadow-brut hover:bg-warn/90 brut-press text-decoration-none"
            >
              <span>Xem và duyệt danh sách vừa nạp</span>
              <ArrowRight class="h-4 w-4" />
            </NuxtLink>
          </div>
        </template>
      </BaseCard>
    </div>
  </div>
</template>
