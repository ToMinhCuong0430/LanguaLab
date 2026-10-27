<script setup lang="ts">
import { Award, ArrowRight, Lock, Headphones, BookOpen, PenTool, Mic } from '@lucide/vue'
import { learnStatusBadge } from '~/constants/badges'

const { examOptions } = useHomeData()

const ieltsExam = computed(() => examOptions.value.find(e => e.id === 'ielts'))
const otherExams = computed(() => examOptions.value.filter(e => e.id !== 'ielts'))

const ieltsSkills = [
  { name: 'Listening', desc: '40 câu • 30 phút', icon: Headphones, color: 'bg-c-blue text-white' },
  { name: 'Reading', desc: '40 câu • 60 phút', icon: BookOpen, color: 'bg-c-green text-white' },
  { name: 'Writing', desc: '2 Task • 60 phút', icon: PenTool, color: 'bg-c-orange text-white' },
  { name: 'Speaking', desc: '3 Part • 15 phút', icon: Mic, color: 'bg-c-pink text-white' },
]
</script>

<template>
  <section id="home-exam-practice" class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl sm:text-2xl font-black text-ink">
          Thực chiến đề thi chứng chỉ
        </h2>
        <p class="text-xs sm:text-sm text-ink-soft">
          Đề thi bám sát cấu trúc mới nhất, bấm giờ thực tế và tự động chấm điểm
        </p>
      </div>
    </div>

    <div class="space-y-4">
      <!-- 1. THẺ IELTS TO NỔI BẬT VỚI 4 Ô KỸ NĂNG PREVIEW -->
      <div
        v-if="ieltsExam"
        class="rounded-brut-lg border-[3px] border-line bg-surface p-5 sm:p-7 shadow-brut transition-all hover:shadow-brut-lg"
      >
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b-2 border-line pb-6 mb-6">
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <BaseBadge tone="green" size="sm" :uppercase="true">
                Đang mở luyện đề
              </BaseBadge>
              <BaseBadge tone="yellow" size="sm" :uppercase="true">
                Chứng chỉ trọng tâm
              </BaseBadge>
            </div>

            <h3 class="font-display text-2xl sm:text-3xl font-black text-ink">
              {{ ieltsExam.name }} • Academic & General
            </h3>
            <p class="text-sm font-medium text-ink-soft max-w-xl">
              {{ ieltsExam.fullName }}. Giao diện máy tính Computer-delivered mô phỏng phòng thi thật với kho đề Cambridge kinh điển.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div class="rounded-brut border-2 border-line bg-surface-2 p-3 font-mono text-center min-w-[120px]">
              <span class="text-[11px] font-bold text-ink-soft block uppercase">Mục tiêu</span>
              <span class="font-display text-2xl font-black text-ink">Band 7.0+</span>
            </div>

            <BaseButton
              to="/luyen-thi/ielts"
              variant="primary"
              size="lg"
            >
              <span>Vào trung tâm IELTS</span>
              <template #right>
                <ArrowRight class="h-5 w-5" :stroke-width="2.5" />
              </template>
            </BaseButton>
          </div>
        </div>

        <!-- 4 ô kỹ năng preview -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <NuxtLink
            v-for="skill in ieltsSkills"
            :key="skill.name"
            to="/luyen-thi/ielts"
            class="group flex items-center gap-3 rounded-brut border-2 border-line bg-surface p-3.5 shadow-brut-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all text-decoration-none"
          >
            <div
              class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-brut border-2 border-line shadow-[1px_1px_0_var(--line)]"
              :class="skill.color"
            >
              <component :is="skill.icon" class="h-5 w-5" :stroke-width="2.5" />
            </div>
            <div>
              <span class="font-display text-sm font-black text-ink block leading-tight group-hover:text-accent">
                {{ skill.name }}
              </span>
              <span class="text-xs font-mono font-bold text-ink-soft">
                {{ skill.desc }}
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- 2. CÁC KỲ THI CÒN LẠI (TOEIC, TOEFL, HSK, JLPT): NHỎ GỌN, MỜ HƠN TRÊN MỘT HÀNG -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          v-for="exam in otherExams"
          :key="exam.id"
          class="flex items-center justify-between rounded-brut border-2 border-line bg-surface-2 p-3 opacity-70 select-none"
        >
          <div class="space-y-0.5">
            <div class="flex items-center gap-1.5">
              <span class="font-display text-sm font-black text-ink">
                {{ exam.name }}
              </span>
              <Lock class="h-3 w-3 text-ink-soft" :stroke-width="2.5" />
            </div>
            <span class="text-[11px] font-bold text-ink-soft block line-clamp-1">
              {{ exam.statusBadge }}
            </span>
          </div>
          <BaseBadge v-bind="learnStatusBadge('coming_soon')" size="sm" />
        </div>
      </div>
    </div>
  </section>
</template>
