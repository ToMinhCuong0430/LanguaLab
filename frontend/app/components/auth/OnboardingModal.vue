<script setup lang="ts">
import { Star, Check, ArrowRight } from '@lucide/vue'

const { profile, updateProfile, isLoading } = useAuth()

const isModalOpen = ref(false)
const fullName = ref('')
const selectedLang = ref<'en' | 'zh' | 'ja'>('en')
const selectedExam = ref<'ielts' | 'toeic' | 'toefl' | 'hsk' | 'jlpt'>('ielts')
const currentBand = ref(5.5)
const targetBand = ref(7.0)

// Kiểm tra khi profile được load
watch(
  () => profile.value,
  (p) => {
    if (p && (!p.full_name || p.full_name === 'Người học mới' || !p.target_band)) {
      fullName.value = p.full_name && p.full_name !== 'Người học mới' ? p.full_name : ''
      selectedLang.value = p.learning_lang || 'en'
      selectedExam.value = p.target_exam || 'ielts'
      currentBand.value = p.current_band || 5.5
      targetBand.value = p.target_band || 7.0
      isModalOpen.value = true
    } else {
      isModalOpen.value = false
    }
  },
  { immediate: true },
)

const handleSave = async () => {
  if (!fullName.value.trim() || isLoading.value) return

  // Tự sinh avatar text từ 2 chữ cái đầu
  const avatar = fullName.value.trim().substring(0, 2).toUpperCase()

  await updateProfile({
    full_name: fullName.value.trim(),
    avatar_text: avatar,
    learning_lang: selectedLang.value,
    target_exam: selectedExam.value,
    current_band: Number(currentBand.value),
    target_band: Number(targetBand.value),
  })

  isModalOpen.value = false
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/70"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-lg rounded-brut-lg border-[4px] border-line bg-surface p-6 sm:p-8 shadow-brut-lg text-ink space-y-5 animate-in zoom-in-95">
        <div class="border-b-2 border-line pb-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="rounded border-2 border-line bg-warn px-2 py-0.5 font-display text-xs font-black text-on-tone">
              THIẾT LẬP BAN ĐẦU
            </span>
          </div>
          <h2 class="text-2xl font-black text-ink">
            Chào mừng bạn đến với LanguaLab!
          </h2>
          <p class="text-xs text-ink-soft">
            Dành 30 giây để cá nhân hóa lộ trình học và mục tiêu chứng chỉ của bạn
          </p>
        </div>

        <form class="space-y-4" @submit.prevent="handleSave">
          <BaseInput
            v-model="fullName"
            label="Họ và tên hiển thị"
            placeholder="Ví dụ: Hoàng Minh"
            required
          />

          <!-- Chọn ngôn ngữ học -->
          <div class="space-y-1.5">
            <label class="font-display font-bold text-sm text-ink">Ngôn ngữ bạn muốn tập trung học:</label>
            <div class="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                class="py-2 px-3 rounded-brut border-2 border-line font-display text-xs font-bold transition-all cursor-pointer"
                :class="selectedLang === 'en' ? 'bg-accent text-accent-ink shadow-brut-sm ring-2 ring-line' : 'bg-surface-2 text-ink'"
                @click="selectedLang = 'en'"
              >
                🇬🇧 Tiếng Anh
              </button>
              <button
                type="button"
                class="py-2 px-3 rounded-brut border-2 border-line font-display text-xs font-bold transition-all cursor-pointer"
                :class="selectedLang === 'zh' ? 'bg-accent text-accent-ink shadow-brut-sm ring-2 ring-line' : 'bg-surface-2 text-ink'"
                @click="selectedLang = 'zh'"
              >
                🇨🇳 Tiếng Trung
              </button>
              <button
                type="button"
                class="py-2 px-3 rounded-brut border-2 border-line font-display text-xs font-bold transition-all cursor-pointer"
                :class="selectedLang === 'ja' ? 'bg-accent text-accent-ink shadow-brut-sm ring-2 ring-line' : 'bg-surface-2 text-ink'"
                @click="selectedLang = 'ja'"
              >
                🇯🇵 Tiếng Nhật
              </button>
            </div>
          </div>

          <!-- Chọn kỳ thi mục tiêu -->
          <div class="space-y-1.5">
            <label class="font-display font-bold text-sm text-ink">Kỳ thi mục tiêu chính:</label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                v-for="exam in [
                  { id: 'ielts', label: 'IELTS Academic' },
                  { id: 'toeic', label: 'TOEIC' },
                  { id: 'toefl', label: 'TOEFL iBT' },
                  { id: 'hsk', label: 'HSK' },
                  { id: 'jlpt', label: 'JLPT' },
                ]"
                :key="exam.id"
                type="button"
                class="py-1.5 px-2.5 rounded-brut border-2 border-line font-display text-xs font-bold transition-all cursor-pointer"
                :class="selectedExam === exam.id ? 'bg-warn text-on-tone shadow-brut-sm ring-2 ring-line' : 'bg-surface-2 text-ink'"
                @click="selectedExam = exam.id as any"
              >
                {{ exam.label }}
              </button>
            </div>
          </div>

          <!-- Band hiện tại & Band mục tiêu -->
          <div class="grid grid-cols-2 gap-3 pt-1">
            <BaseInput
              v-model="currentBand"
              label="Band hiện tại ước tính"
              type="number"
              step="0.5"
              min="0"
              max="9"
            />
            <BaseInput
              v-model="targetBand"
              label="Band mục tiêu"
              type="number"
              step="0.5"
              min="0"
              max="9"
            />
          </div>

          <div class="pt-4 border-t-2 border-line">
            <BaseButton
              type="submit"
              variant="primary"
              size="lg"
              block
              :disabled="isLoading || !fullName.trim()"
            >
              <span>{{ isLoading ? 'Đang lưu...' : 'Lưu & Bắt đầu học ngay' }}</span>
              <ArrowRight class="h-4 w-4" :stroke-width="2.5" />
            </BaseButton>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
