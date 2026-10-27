<script setup lang="ts">
import { PenTool, AlertTriangle, CheckCircle, FileText } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    prompt: string
    taskNumber?: 1 | 2
    minWords?: number
  }>(),
  {
    taskNumber: 2,
    minWords: 250,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const onInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}

const wordCount = computed(() => {
  if (!props.modelValue || !props.modelValue.trim()) return 0
  return props.modelValue.trim().split(/\s+/).filter(Boolean).length
})

const charCount = computed(() => props.modelValue.length)

const isWordsSufficient = computed(() => wordCount.value >= props.minWords)
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
    <!-- Cột trái (5 cột): Đề bài hiển thị cố định -->
    <div class="lg:col-span-5 flex flex-col rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut overflow-y-auto">
      <div class="flex items-center justify-between border-b-2 border-line pb-3 mb-4">
        <span class="rounded border-2 border-line bg-ok px-2.5 py-0.5 font-display text-xs font-black text-on-tone">
          IELTS WRITING TASK {{ taskNumber }}
        </span>
        <span class="text-xs font-bold text-ink-soft">
          Tối thiểu {{ minWords }} từ
        </span>
      </div>

      <div class="space-y-4 text-ink">
        <h3 class="font-display text-lg font-black leading-snug">
          Đề bài yêu cầu
        </h3>

        <!-- Nội dung đề bài dạng thẻ nổi bật -->
        <div class="rounded-brut border-2 border-line bg-surface-2 p-4 text-sm font-medium leading-relaxed whitespace-pre-line font-body shadow-brut-sm">
          {{ prompt }}
        </div>

        <div class="rounded-brut border-2 border-line bg-surface p-3 text-xs space-y-1.5 text-ink-soft">
          <p class="font-bold text-ink flex items-center gap-1.5">
            <FileText class="h-4 w-4 text-accent" :stroke-width="2.5" />
            <span>Tiêu chí chấm điểm IELTS chính thức:</span>
          </p>
          <ul class="list-disc list-inside space-y-1 pl-1">
            <li><strong>Task Achievement / Response:</strong> Trả lời đủ và sâu các phần của đề bài.</li>
            <li><strong>Coherence & Cohesion:</strong> Cấu trúc bài luận mạch lạc, liên kết câu rõ ràng.</li>
            <li><strong>Lexical Resource:</strong> Từ vựng học thuật phong phú, dùng cụm collocation chuẩn xác.</li>
            <li><strong>Grammar Range & Accuracy:</strong> Đa dạng thì và cấu trúc câu phức không mắc lỗi.</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Cột phải (7 cột): Khung soạn thảo + Bộ đếm từ trực tiếp -->
    <div class="lg:col-span-7 flex flex-col rounded-brut-lg border-[3px] border-line bg-surface p-5 shadow-brut space-y-3">
      <!-- Thanh công cụ đếm từ trên đỉnh textarea -->
      <div class="flex flex-wrap items-center justify-between border-b-2 border-line pb-3 gap-2">
        <div class="flex items-center gap-2">
          <PenTool class="h-4 w-4 text-ink" :stroke-width="2.5" />
          <span class="font-display text-sm font-black text-ink">Bài làm của thí sinh</span>
        </div>

        <!-- Trạng thái đếm từ -->
        <div class="flex items-center gap-2">
          <div
            class="flex items-center gap-1.5 rounded-brut border-2 border-line px-2.5 py-1 text-xs font-black shadow-brut-sm"
            :class="isWordsSufficient ? 'bg-ok text-on-tone' : 'bg-warn text-on-tone'"
          >
            <CheckCircle v-if="isWordsSufficient" class="h-3.5 w-3.5" :stroke-width="3" />
            <AlertTriangle v-else class="h-3.5 w-3.5" :stroke-width="2.5" />
            <span>{{ wordCount }} / {{ minWords }} từ</span>
          </div>

          <span class="text-xs font-bold text-ink-soft hidden sm:inline">
            ({{ charCount }} ký tự)
          </span>
        </div>
      </div>

      <!-- Ô soạn thảo văn bản -->
      <div class="flex-1 flex flex-col">
        <textarea
          :value="modelValue"
          rows="18"
          placeholder="Bắt đầu viết bài luận của bạn tại đây... (Nội dung tự động lưu tạm trên trình duyệt)"
          class="w-full flex-1 rounded-brut border-2 border-line bg-surface-2 p-4 font-body text-base text-ink placeholder:text-ink-soft/70 outline-none focus:border-ink focus:bg-surface focus:shadow-brut transition-all resize-none leading-relaxed"
          @input="onInput"
        />
      </div>

      <!-- Footer cảnh báo -->
      <div class="flex items-center justify-between text-xs text-ink-soft pt-1">
        <p v-if="!isWordsSufficient" class="text-bad font-bold flex items-center gap-1">
          <AlertTriangle class="h-3.5 w-3.5" />
          <span>Bài viết còn thiếu {{ minWords - wordCount }} từ để đạt độ dài chuẩn.</span>
        </p>
        <p v-else class="text-ok font-bold flex items-center gap-1">
          <CheckCircle class="h-3.5 w-3.5" />
          <span>Đã đạt số từ yêu cầu tối thiểu.</span>
        </p>
        <span>Định dạng: Đoạn văn cách dòng đôi</span>
      </div>
    </div>
  </div>
</template>
