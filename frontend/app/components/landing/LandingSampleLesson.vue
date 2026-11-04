<script setup lang="ts">
import { CheckCircle2, XCircle, RotateCcw } from '@lucide/vue'

// Thẻ bài học mẫu trên landing: một câu tiếng Việt, ba đáp án, Kiểm tra -> đúng / sai -> Tiếp tục.
// Chạy hoàn toàn ở client, không gọi API; môn do LandingPage truyền vào.
export type SampleSubject = 'en' | 'ielts' | 'typing' | 'zh' | 'ja'

interface SampleQuestion {
  prompt: string // câu tiếng Việt
  options: string[]
  answer: number
}

const props = defineProps<{ subject: SampleSubject }>()

const QUESTIONS: Record<SampleSubject, SampleQuestion[]> = {
  en: [
    { prompt: 'Tôi uống cà phê mỗi sáng.', options: ['I drinks coffee every morning.', 'I drink coffee every morning.', 'I am drink coffee every morning.'], answer: 1 },
    { prompt: 'Hôm qua cô ấy đi làm muộn.', options: ['She was late for work yesterday.', 'She is late for work yesterday.', 'She late for work yesterday.'], answer: 0 },
    { prompt: 'Bạn có thể nói chậm hơn không?', options: ['Can you speaking slowly?', 'Can you speak more slow?', 'Can you speak more slowly?'], answer: 2 },
    { prompt: 'Chúng tôi đã sống ở đây ba năm.', options: ['We live here since three years.', 'We have lived here for three years.', 'We are living here three years ago.'], answer: 1 },
    { prompt: 'Tôi chưa bao giờ đến Nhật Bản.', options: ['I have never been to Japan.', 'I never have gone Japan.', 'I am never to Japan.'], answer: 0 },
  ],
  ielts: [
    { prompt: 'Ô nhiễm không khí ảnh hưởng nghiêm trọng đến sức khoẻ cộng đồng.', options: ['Air pollution serious impacts on public health.', 'Air pollution has a serious impact on public health.', 'Air pollution is impact seriously public health.'], answer: 1 },
    { prompt: 'Ngày càng nhiều người làm việc từ xa.', options: ['An increasing number of people work remotely.', 'A increasing number of people works remote.', 'More and more people is working remotely.'], answer: 0 },
    { prompt: 'Biểu đồ cho thấy doanh số tăng mạnh từ 2010 đến 2020.', options: ['The chart show sales rise sharp from 2010 to 2020.', 'The chart is showing a sharply rise of sales between 2010 to 2020.', 'The chart shows a sharp rise in sales from 2010 to 2020.'], answer: 2 },
    { prompt: 'Chính phủ nên đầu tư nhiều hơn vào giao thông công cộng.', options: ['The government should investing more on public transport.', 'The government should invest more in public transport.', 'The government should to invest more in public transport.'], answer: 1 },
    { prompt: 'Dù có nhiều lợi ích, mạng xã hội cũng có mặt trái.', options: ['Despite its many benefits, social media also has drawbacks.', 'Despite of many benefits, social media also have drawbacks.', 'Although its many benefits, social media has also drawback.'], answer: 0 },
  ],
  typing: [
    { prompt: 'Cho tôi xem thực đơn được không?', options: ['Could I see menu, please?', 'Can I seeing the menu?', 'Could I see the menu, please?'], answer: 2 },
    { prompt: 'Cái áo này giá bao nhiêu?', options: ['How much is this shirt?', 'How many is this shirt?', 'How much this shirt costs?'], answer: 0 },
    { prompt: 'Tôi muốn đặt bàn cho hai người.', options: ['I want booking table for two.', "I'd like to book a table for two.", "I'd like book a table for two."], answer: 1 },
    { prompt: 'Ga tàu gần nhất ở đâu?', options: ['Where the nearest train station is?', 'Where is nearest the train station?', 'Where is the nearest train station?'], answer: 2 },
    { prompt: 'Chiều nay tôi sẽ gửi email cho bạn.', options: ["I'll send you an email this afternoon.", "I'll sending you an email this afternoon.", 'I send you email this afternoon will.'], answer: 0 },
  ],
  zh: [
    { prompt: 'Xin chào.', options: ['谢谢 (xièxie)', '你好 (nǐ hǎo)', '再见 (zàijiàn)'], answer: 1 },
    { prompt: 'Cảm ơn bạn.', options: ['谢谢你 (xièxie nǐ)', '对不起 (duìbuqǐ)', '没关系 (méi guānxi)'], answer: 0 },
    { prompt: 'Tôi là sinh viên.', options: ['我是老师 (wǒ shì lǎoshī)', '你是学生 (nǐ shì xuésheng)', '我是学生 (wǒ shì xuésheng)'], answer: 2 },
    { prompt: 'Bao nhiêu tiền?', options: ['几点了？(jǐ diǎn le)', '多少钱？(duōshao qián)', '在哪儿？(zài nǎr)'], answer: 1 },
    { prompt: 'Tôi không hiểu.', options: ['我不懂 (wǒ bù dǒng)', '我知道 (wǒ zhīdào)', '我喜欢 (wǒ xǐhuan)'], answer: 0 },
  ],
  ja: [
    { prompt: 'Chào buổi sáng.', options: ['こんばんは (konbanwa)', 'おはようございます (ohayō gozaimasu)', 'おやすみなさい (oyasuminasai)'], answer: 1 },
    { prompt: 'Cảm ơn.', options: ['ありがとうございます (arigatō gozaimasu)', 'すみません (sumimasen)', 'いただきます (itadakimasu)'], answer: 0 },
    { prompt: 'Nhà vệ sinh ở đâu?', options: ['これはなんですか (kore wa nan desu ka)', 'いくらですか (ikura desu ka)', 'トイレはどこですか (toire wa doko desu ka)'], answer: 2 },
    { prompt: 'Tôi là người Việt Nam.', options: ['わたしはにほんじんです (watashi wa nihonjin desu)', 'わたしはベトナムじんです (watashi wa betonamujin desu)', 'あなたはベトナムじんです (anata wa betonamujin desu)'], answer: 1 },
    { prompt: 'Cái này bao nhiêu tiền?', options: ['これはいくらですか (kore wa ikura desu ka)', 'これはなんですか (kore wa nan desu ka)', 'どこですか (doko desu ka)'], answer: 0 },
  ],
}

const SUBJECT_LABEL: Record<SampleSubject, string> = {
  en: 'Tiếng Anh',
  ielts: 'IELTS',
  typing: 'Gõ câu',
  zh: 'Tiếng Trung',
  ja: 'Tiếng Nhật',
}

const questions = computed(() => QUESTIONS[props.subject])
const index = ref(0)
const selected = ref<number | null>(null)
const phase = ref<'answer' | 'correct' | 'wrong' | 'done'>('answer')
const correctCount = ref(0)

const question = computed(() => questions.value[index.value]!)
const TOTAL = 5

const reset = () => {
  index.value = 0
  selected.value = null
  phase.value = 'answer'
  correctCount.value = 0
}
// Đổi môn thì làm lại từ câu đầu
watch(() => props.subject, reset)

const check = () => {
  if (selected.value === null || phase.value !== 'answer') return
  const ok = selected.value === question.value.answer
  if (ok) correctCount.value += 1
  phase.value = ok ? 'correct' : 'wrong'
}

const next = () => {
  if (index.value < questions.value.length - 1) {
    index.value += 1
    selected.value = null
    phase.value = 'answer'
  } else {
    phase.value = 'done'
  }
}

// Số đoạn đã xong trên thanh tiến độ
const doneSegments = computed(() => {
  if (phase.value === 'done') return TOTAL
  return index.value + (phase.value === 'answer' ? 0 : 1)
})

const optionVariant = (i: number): 'warning' | 'secondary' | 'success' | 'danger' => {
  if (phase.value === 'answer') return selected.value === i ? 'warning' : 'secondary'
  if (i === question.value.answer) return 'success'
  if (i === selected.value) return 'danger'
  return 'secondary'
}
</script>

<template>
  <section
    class="flex flex-col overflow-hidden rounded-brut-lg border-[3px] border-line bg-surface shadow-brut-lg"
    :aria-label="`Bài học mẫu ${SUBJECT_LABEL[subject]}`"
  >
    <div class="space-y-4 p-5">
      <div
        class="flex gap-1"
        role="progressbar"
        aria-label="Tiến độ bài mẫu"
        :aria-valuemin="0"
        :aria-valuemax="TOTAL"
        :aria-valuenow="doneSegments"
      >
        <span
          v-for="i in TOTAL"
          :key="i"
          class="h-2.5 flex-1 rounded-full transition-colors duration-200"
          :style="{ background: i <= doneSegments ? 'var(--success)' : 'var(--surface-2)' }"
        />
      </div>

      <template v-if="phase !== 'done'">
        <div class="space-y-1">
          <p class="text-xs font-bold text-ink-soft">{{ SUBJECT_LABEL[subject] }}. Chọn câu đúng nghĩa:</p>
          <p class="font-display text-xl font-black leading-snug text-ink" aria-live="polite">{{ question.prompt }}</p>
        </div>

        <div class="space-y-2.5" role="radiogroup" :aria-label="question.prompt">
          <BaseButton
            v-for="(opt, i) in question.options"
            :key="`${subject}-${index}-${i}`"
            :variant="optionVariant(i)"
            size="md"
            block
            role="radio"
            :aria-checked="selected === i"
            :disabled="phase !== 'answer' && i !== question.answer && i !== selected"
            class="!justify-start !whitespace-normal text-left !text-sm leading-snug"
            @click="phase === 'answer' && (selected = i)"
          >
            {{ opt }}
          </BaseButton>
        </div>
      </template>

      <div v-else class="space-y-2 py-6 text-center">
        <p class="font-display text-2xl font-black text-ink">Đúng {{ correctCount }} / {{ TOTAL }} câu</p>
        <p class="text-sm text-ink-soft">Mỗi bài trong LanguaLab đi đúng nhịp này: một câu, biết đúng sai ngay, rồi câu tiếp theo.</p>
        <NuxtLink to="/dang-ky" class="inline-flex min-h-[44px] items-center text-sm font-bold text-ink underline">
          Tạo tài khoản để lưu tiến độ
        </NuxtLink>
      </div>
    </div>

    <!-- Khối kết quả + nút ở đáy thẻ: đổi nền theo đúng / sai -->
    <div
      class="mt-auto border-t-[1px] border-line p-4 transition-colors duration-150"
      :style="phase === 'correct'
        ? { background: 'var(--success)', color: 'var(--success-ink)' }
        : phase === 'wrong'
          ? { background: 'var(--danger)', color: 'var(--danger-ink)' }
          : {}"
    >
      <div v-if="phase === 'correct' || phase === 'wrong'" class="mb-3 flex items-start gap-2" role="status">
        <CheckCircle2 v-if="phase === 'correct'" class="mt-0.5 h-5 w-5 shrink-0" :stroke-width="2.5" aria-hidden="true" />
        <XCircle v-else class="mt-0.5 h-5 w-5 shrink-0" :stroke-width="2.5" aria-hidden="true" />
        <div class="min-w-0">
          <p class="font-display font-black">{{ phase === 'correct' ? 'Chính xác' : 'Chưa đúng' }}</p>
          <p v-if="phase === 'wrong'" class="break-words text-sm font-bold">Đáp án: {{ question.options[question.answer] }}</p>
        </div>
      </div>

      <BaseButton v-if="phase === 'answer'" variant="success" size="lg" block :disabled="selected === null" @click="check">
        Kiểm tra
      </BaseButton>
      <BaseButton v-else-if="phase !== 'done'" variant="secondary" size="lg" block @click="next">
        Tiếp tục
      </BaseButton>
      <BaseButton v-else variant="secondary" size="lg" block @click="reset">
        <template #left><RotateCcw class="h-4 w-4" :stroke-width="2.5" /></template>
        Làm lại
      </BaseButton>
    </div>
  </section>
</template>
