<script setup lang="ts">
import { Star, Check, ArrowRight } from '@lucide/vue'
import DevelopmentBadge from '~/components/common/DevelopmentBadge.vue'

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
      // Tiếng Trung / Nhật chuyển sang đang phát triển -> mặc định luôn là tiếng Anh
      selectedLang.value = p.learning_lang === 'en' ? 'en' : 'en'
      // HSK / JLPT chuyển sang đang phát triển -> mặc định là ielts
      selectedExam.value = (p.target_exam && ['ielts', 'toeic', 'toefl'].includes(p.target_exam)) ? p.target_exam as any : 'ielts'
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
    learning_lang: 'en', // luôn lưu tiếng Anh đang sẵn sàng
    target_exam: selectedExam.value,
    current_band: Number(currentBand.value),
    target_band: Number(targetBand.value),
  })

  isModalOpen.value = false
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isModalOpen.value) {
    isModalOpen.value = false
  }
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', onKeydown)
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', onKeydown)
  }
})
</script>

<template>
  <BaseModal
    v-model="isModalOpen"
    max-width="lg"
    :close-on-backdrop="false"
    :close-on-esc="false"
    :show-close-button="false"
  >
    <template #header>
      <div class="border-b-2 border-line pb-3 w-full">
        <div class="flex items-center gap-2 mb-1">
          <span class="rounded border-2 border-line bg-warn px-2 py-0.5 font-display text-xs font-black text-on-tone">
            THIẾT LẬP BAN ĐẦU
          </span>
        </div>
        <h2 class="text-xl sm:text-2xl font-black text-ink">
          Chào mừng bạn đến với LanguaLab!
        </h2>
        <p class="text-xs text-ink-soft">
          Dành 30 giây để cá nhân hóa lộ trình học và mục tiêu chứng chỉ của bạn
        </p>
      </div>
    </template>

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
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            class="min-h-[44px] py-2 px-3 rounded-brut border-2 border-line font-display text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            :class="selectedLang === 'en' ? 'bg-accent text-accent-ink shadow-brut-sm ring-2 ring-line font-black' : 'bg-surface-2 text-ink'"
            @click="selectedLang = 'en'"
          >
            <span>🇬🇧 Tiếng Anh</span>
            <Check v-if="selectedLang === 'en'" class="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled
            aria-disabled="true"
            class="min-h-[44px] py-2 px-3 rounded-brut border-2 border-dashed border-line font-display text-xs font-bold bg-surface-2 text-ink-soft opacity-60 cursor-not-allowed flex items-center justify-between gap-1"
          >
            <span>🇨🇳 Tiếng Trung</span>
            <DevelopmentBadge size="xs" />
          </button>

          <button
            type="button"
            disabled
            aria-disabled="true"
            class="min-h-[44px] py-2 px-3 rounded-brut border-2 border-dashed border-line font-display text-xs font-bold bg-surface-2 text-ink-soft opacity-60 cursor-not-allowed flex items-center justify-between gap-1"
          >
            <span>🇯🇵 Tiếng Nhật</span>
            <DevelopmentBadge size="xs" />
          </button>
        </div>
      </div>

      <!-- Chọn kỳ thi mục tiêu -->
      <div class="space-y-1.5">
        <label class="font-display font-bold text-sm text-ink">Kỳ thi mục tiêu chính:</label>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            v-for="exam in [
              { id: 'ielts', label: 'IELTS Academic', available: true },
              { id: 'toeic', label: 'TOEIC', available: true },
              { id: 'toefl', label: 'TOEFL iBT', available: true },
              { id: 'hsk', label: 'HSK', available: false },
              { id: 'jlpt', label: 'JLPT', available: false },
            ]"
            :key="exam.id"
            type="button"
            :disabled="!exam.available"
            :aria-disabled="!exam.available"
            class="min-h-[44px] py-2 px-2.5 rounded-brut border-2 font-display text-xs font-bold transition-all flex items-center justify-between gap-1"
            :class="[
              !exam.available
                ? 'border-dashed border-line bg-surface-2 text-ink-soft opacity-60 cursor-not-allowed'
                : (selectedExam === exam.id
                  ? 'border-line bg-warn text-on-tone shadow-brut-sm ring-2 ring-line cursor-pointer font-black'
                  : 'border-line bg-surface-2 text-ink hover:bg-surface cursor-pointer'),
            ]"
            @click="exam.available && (selectedExam = exam.id as any)"
          >
            <span>{{ exam.label }}</span>
            <DevelopmentBadge v-if="!exam.available" size="xs" />
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
  </BaseModal>
</template>
