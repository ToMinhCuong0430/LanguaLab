<script setup lang="ts">
import { Clock, CircleCheck, GraduationCap, Flame, Zap, Trophy } from '@lucide/vue'
import LandingSampleLesson, { type SampleSubject } from '~/components/landing/LandingSampleLesson.vue'
import { BRAND_NAME } from '~/constants/brand'

// Trang giới thiệu cho khách chưa đăng nhập ở "/" (layout landing)
useHead({
  title: `${BRAND_NAME} - Học ngoại ngữ mỗi ngày, mỗi lượt một câu`,
  meta: [
    {
      name: 'description',
      content: 'Học tiếng Anh, tiếng Trung, tiếng Nhật và luyện IELTS: mỗi lượt một câu, biết đúng sai ngay, khoảng năm phút một bài. Miễn phí.',
    },
  ],
})

const SUBJECTS: { id: SampleSubject; label: string }[] = [
  { id: 'en', label: 'Tiếng Anh' },
  { id: 'ielts', label: 'IELTS' },
  { id: 'typing', label: 'Gõ câu' },
  { id: 'zh', label: 'Tiếng Trung' },
  { id: 'ja', label: 'Tiếng Nhật' },
]
const subject = ref<SampleSubject>('en')

const VALUES = [
  { icon: Clock, title: 'Năm phút', text: 'Mỗi bài chỉ vài câu. Khoảng năm phút là xong một bài, chen được vào giờ nghỉ.' },
  { icon: CircleCheck, title: 'Biết ngay', text: 'Bấm Kiểm tra là biết đúng hay sai. Sai thì thấy luôn đáp án đúng để sửa.' },
  {
    icon: GraduationCap,
    title: 'Rồi tới IELTS',
    text: 'Quen nhịp rồi thì luyện đề IELTS 4 kỹ năng. Phòng thi là màn hình đọc dài, có đồng hồ và ghi chú như bài thi trên máy.',
  },
]

const STEPS = [
  { title: 'Chọn câu', text: 'Đọc câu tiếng Việt, chọn hoặc gõ lại câu đúng.' },
  { title: 'Kiểm tra', text: 'Biết ngay đúng hay sai. Sai thì thấy đáp án.' },
  { title: 'Tiếp tục', text: 'Sang câu sau. Hết bài, thanh tiến độ đầy.' },
]

const HABITS = [
  { icon: Flame, title: 'Chuỗi ngày', text: 'Học mỗi ngày để giữ chuỗi. Điểm danh cũng được cộng 20 XP.' },
  { icon: Zap, title: 'XP', text: 'Mỗi bài làm xong cộng XP vào tổng điểm của bạn.' },
  { icon: Trophy, title: 'Hạng tuần', text: 'XP trong tuần xếp bạn lên bảng xếp hạng, bảng làm mới mỗi thứ Hai.' },
]
</script>

<template>
  <div class="mx-auto w-full max-w-[988px] space-y-20 px-4 pb-16 pt-10 sm:pt-14">
    <!-- Hero + bài mẫu -->
    <section class="space-y-8" aria-labelledby="landing-title">
      <div class="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div class="space-y-6">
          <h1 id="landing-title" class="font-display text-4xl font-black leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Cách vui để học tiếng Anh mỗi ngày.
          </h1>
          <p class="max-w-[46ch] text-lg leading-relaxed text-ink-soft">
            Mỗi lượt một câu, biết đúng sai ngay, khoảng năm phút là xong một bài. Miễn phí.
          </p>
          <div class="grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
            <BaseButton to="/dang-ky" variant="success" size="lg" block>Bắt đầu học</BaseButton>
            <BaseButton to="/dang-nhap" variant="secondary" size="lg" block>Tôi đã có tài khoản</BaseButton>
          </div>
        </div>

        <LandingSampleLesson :subject="subject" />
      </div>

      <!-- Dải môn: đổi câu mẫu trong thẻ bài -->
      <div class="space-y-2">
        <p id="landing-subjects-label" class="text-xs font-bold text-ink-soft">Thử câu mẫu theo môn</p>
        <div class="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="landing-subjects-label">
          <BaseButton
            v-for="s in SUBJECTS"
            :key="s.id"
            :variant="subject === s.id ? 'warning' : 'secondary'"
            size="sm"
            role="radio"
            :aria-checked="subject === s.id"
            @click="subject = s.id"
          >
            {{ s.label }}
          </BaseButton>
        </div>
      </div>
    </section>

    <!-- Giá trị -->
    <section class="space-y-6" aria-labelledby="landing-values">
      <h2 id="landing-values" class="font-display text-3xl font-black tracking-tight text-ink">miễn phí. vui. hiệu quả.</h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div v-for="v in VALUES" :key="v.title" class="brut-box space-y-2 bg-surface p-5">
          <component :is="v.icon" class="h-6 w-6 text-ink" :stroke-width="2.5" aria-hidden="true" />
          <h3 class="font-display text-lg font-black text-ink">{{ v.title }}</h3>
          <p class="text-sm leading-relaxed text-ink-soft">{{ v.text }}</p>
        </div>
      </div>
    </section>

    <!-- Vòng học: ba bước theo thứ tự -->
    <section class="space-y-6" aria-labelledby="landing-loop">
      <h2 id="landing-loop" class="font-display text-3xl font-black tracking-tight text-ink">Một vòng, rồi lặp lại.</h2>
      <ol class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <li v-for="(step, i) in STEPS" :key="step.title" class="brut-box flex gap-4 bg-surface p-5">
          <span class="font-display text-3xl font-black leading-none text-ink-soft tabular-nums" aria-hidden="true">{{ i + 1 }}</span>
          <div class="space-y-1">
            <h3 class="font-display text-lg font-black text-ink">{{ step.title }}</h3>
            <p class="text-sm leading-relaxed text-ink-soft">{{ step.text }}</p>
          </div>
        </li>
      </ol>
    </section>

    <!-- Thói quen -->
    <section class="space-y-6" aria-labelledby="landing-habit">
      <h2 id="landing-habit" class="font-display text-3xl font-black tracking-tight text-ink">Giữ được thói quen.</h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div v-for="h in HABITS" :key="h.title" class="brut-box space-y-2 bg-surface p-5">
          <component :is="h.icon" class="h-6 w-6 text-ink" :stroke-width="2.5" aria-hidden="true" />
          <h3 class="font-display text-lg font-black text-ink">{{ h.title }}</h3>
          <p class="text-sm leading-relaxed text-ink-soft">{{ h.text }}</p>
        </div>
      </div>
    </section>

    <!-- Band vàng cuối trang -->
    <section class="brut-box flex flex-col items-start gap-5 bg-warn p-8 text-on-tone sm:flex-row sm:items-center sm:justify-between" aria-labelledby="landing-cta">
      <h2 id="landing-cta" class="font-display text-3xl font-black tracking-tight">Bắt đầu bài đầu tiên.</h2>
      <BaseButton to="/dang-ky" variant="success" size="lg">Bắt đầu học</BaseButton>
    </section>
  </div>
</template>
