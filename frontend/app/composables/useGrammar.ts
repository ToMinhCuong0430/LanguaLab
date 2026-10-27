import type { LearningLanguage } from './useLanguage'
import type { Database } from '~/types/database.types'
import { translateSupabaseError, handleAuthExpired } from '~/utils/supabaseErrors'

export type ExerciseType = 'multiple_choice' | 'fill_in_blank' | 'word_reorder'

export interface GrammarExercise {
  id: string
  type: ExerciseType
  prompt: string
  question: string
  // Cho multiple choice
  options?: string[]
  correctIndex?: number
  // Cho fill in blank
  correctAnswer?: string
  hint?: string
  // Cho word reorder
  scrambledWords?: string[]
  correctOrder?: string[]
  explanation: string
}

export interface GrammarExample {
  sentence: string
  translation: string
  reading?: string
  phonetic?: string
  target: string
  vi: string
}

export function normalizeGrammarExample(item: any): GrammarExample {
  if (!item || typeof item !== 'object') {
    return { sentence: '', translation: '', target: '', vi: '' }
  }
  const sentence = item.sentence || item.target || item.text || ''
  const translation = item.translation || item.vi || item.meaning || ''
  const reading = item.reading || item.phonetic || undefined
  return {
    sentence,
    translation,
    target: sentence,
    vi: translation,
    reading,
    phonetic: reading,
  }
}

export interface GrammarPoint {
  id: string
  level: string
  title: string
  vietnameseTitle: string
  summary: string
  formula: {
    pattern: string
    tokens: { label: string; role: 'subject' | 'verb' | 'object' | 'particle' | 'modifier' }[]
  }
  explanationNotes: string[]
  examples: GrammarExample[]
  pitfalls: {
    wrong: string
    correct: string
    explanation: string
  }[]
  exercises: GrammarExercise[]
  xpReward: number
}

export interface GrammarLevelSection {
  levelCode: string
  levelName: string
  description: string
  points: GrammarPoint[]
}

// =========================================================================
// MOCK DATA: 2 CẤP ĐỘ, MỖI CẤP 4 ĐIỂM NGỮ PHÁP ĐẦY ĐỦ
// =========================================================================
export const MOCK_GRAMMAR_LEVELS: Record<LearningLanguage, GrammarLevelSection[]> = {
  // ========== TIẾNG ANH (Cấp A1 & Cấp A2) ==========
  en: [
    {
      levelCode: 'A1',
      levelName: 'Cấp độ A1 - Nền tảng sơ cấp',
      description: 'Làm quen với cấu trúc câu đơn, động từ To Be, thì hiện tại đơn và đại từ nhân xưng.',
      points: [
        {
          id: 'en-a1-tobe',
          level: 'A1',
          title: 'Động từ "To Be" ở thì Hiện tại đơn',
          vietnameseTitle: 'Cấu trúc Am / Is / Are trong câu khẳng định, phủ định và nghi vấn',
          summary: 'Động từ "to be" biểu thị trạng thái, tính chất hoặc danh tính của chủ ngữ.',
          formula: {
            pattern: 'S + am / is / are + Noun / Adjective',
            tokens: [
              { label: 'Subject (I/He/She/They...)', role: 'subject' },
              { label: 'am / is / are', role: 'verb' },
              { label: 'Danh từ / Tính từ bổ nghĩa', role: 'object' },
            ],
          },
          explanationNotes: [
            'Chủ ngữ "I" đi với "am".',
            'Chủ ngữ số ít (He, She, It, danh từ số ít) đi với "is".',
            'Chủ ngữ số nhiều (You, We, They, danh từ số nhiều) đi với "are".',
            'Phủ định: thêm "not" ngay sau động từ to be (am not, isn\'t, aren\'t).',
          ],
          examples: [
            {
              target: 'She is a talented architect.',
              vi: 'Cô ấy là một kiến trúc sư tài năng.',
              phonetic: '/ʃiː ɪz ə ˈtæləntɪd ˈɑːrkɪtekt/',
            },
            {
              target: 'They are very friendly to newcomers.',
              vi: 'Họ rất thân thiện với những người mới đến.',
              phonetic: '/ðeɪ ɑːr ˈveri ˈfrendli tuː ˈnuːkʌmərz/',
            },
          ],
          pitfalls: [
            {
              wrong: 'They is teachers at my local school.',
              correct: 'They are teachers at my local school.',
              explanation: 'Chủ ngữ "They" là ngôi thứ 3 số nhiều nên bắt buộc dùng "are", không dùng "is".',
            },
          ],
          exercises: [
            {
              id: 'ex-a1-1-1',
              type: 'multiple_choice',
              prompt: 'Chọn dạng đúng của to be:',
              question: 'My brother and I _____ big fans of science fiction movies.',
              options: ['am', 'is', 'are', 'be'],
              correctIndex: 2,
              explanation: '"My brother and I" tương đương với đại từ "We" (chúng tôi - số nhiều), do đó dùng "are".',
            },
            {
              id: 'ex-a1-1-2',
              type: 'fill_in_blank',
              prompt: 'Điền dạng đúng của động từ to be (phủ định ngắn gọn):',
              question: 'He _____ (not be) ready for the final exam yet.',
              correctAnswer: "isn't",
              hint: "Viết dạng viết tắt isn't",
              explanation: 'Ngôi "He" đi với "is not", dạng viết tắt là "isn\'t".',
            },
            {
              id: 'ex-a1-1-3',
              type: 'word_reorder',
              prompt: 'Sắp xếp các từ sau thành câu hoàn chỉnh:',
              question: 'very / the weather / pleasant / today / is',
              scrambledWords: ['pleasant', 'today', 'is', 'The weather', 'very'],
              correctOrder: ['The weather', 'is', 'very', 'pleasant', 'today'],
              explanation: 'Trật tự câu: Chủ ngữ (The weather) + Động từ (is) + Trạng từ + Tính từ (very pleasant) + Thời gian (today).',
            },
          ],
          xpReward: 30,
        },
        {
          id: 'en-a1-present-simple',
          level: 'A1',
          title: 'Thì Hiện tại đơn (Present Simple)',
          vietnameseTitle: 'Diễn tả thói quen thường nhật và chân lý bất biến',
          summary: 'Dùng động từ nguyên mẫu (V) cho I/You/We/They và thêm -s/-es cho He/She/It.',
          formula: {
            pattern: 'S + V(s/es) + Object',
            tokens: [
              { label: 'Subject', role: 'subject' },
              { label: 'Verb (thêm -s / -es khi cần)', role: 'verb' },
              { label: 'Object / Complement', role: 'object' },
            ],
          },
          explanationNotes: [
            'Thêm "-es" vào sau các động từ tận cùng bằng: -o, -s, -z, -ch, -x, -sh (ví dụ: go -> goes, watch -> watches).',
            'Câu phủ định mượn trợ động từ "do not (don\'t)" hoặc "does not (doesn\'t)".',
            'Các trạng từ chỉ tần suất hay đi kèm: always, usually, often, sometimes, never.',
          ],
          examples: [
            {
              target: 'My father reads the morning newspaper every single day.',
              vi: 'Bố tôi đọc báo buổi sáng vào mỗi ngày.',
              phonetic: '/maɪ ˈfɑːðər riːdz ðə ˈmɔːrnɪŋ ˈnjuːzpeɪpər ˈevri ˈsɪŋɡl deɪ/',
            },
          ],
          pitfalls: [
            {
              wrong: 'He don\'t likes waking up early.',
              correct: 'He doesn\'t like waking up early.',
              explanation: 'Với ngôi "He", trợ động từ phủ định là "doesn\'t", và động từ chính trở về nguyên mẫu "like".',
            },
          ],
          exercises: [
            {
              id: 'ex-a1-2-1',
              type: 'multiple_choice',
              prompt: 'Chọn đáp án đúng:',
              question: 'Water _____ at 100 degrees Celsius under standard atmospheric pressure.',
              options: ['boil', 'boils', 'is boiling', 'boiled'],
              correctIndex: 1,
              explanation: 'Sự thật hiển nhiên/chân lý khoa học dùng thì hiện tại đơn, "Water" là danh từ không đếm được nên chia "boils".',
            },
            {
              id: 'ex-a1-2-2',
              type: 'word_reorder',
              prompt: 'Sắp xếp các từ thành câu đúng:',
              question: 'breakfast / always / at seven / eats / David',
              scrambledWords: ['always', 'eats', 'David', 'breakfast', 'at seven'],
              correctOrder: ['David', 'always', 'eats', 'breakfast', 'at seven'],
              explanation: 'Trạng từ tần suất "always" đứng trước động từ thường "eats".',
            },
          ],
          xpReward: 30,
        },
        {
          id: 'en-a1-articles',
          level: 'A1',
          title: 'Mạo từ A, An, The trong tiếng Anh',
          vietnameseTitle: 'Quy tắc phân biệt mạo từ không xác định và mạo từ xác định',
          summary: 'Dùng "a/an" cho danh từ đếm được số ít chưa xác định, dùng "the" cho đối tượng đã biết rõ.',
          formula: {
            pattern: 'A / An (nguyên âm) + Danh từ đếm được số ít',
            tokens: [
              { label: 'a / an / the', role: 'particle' },
              { label: 'Noun (Danh từ)', role: 'object' },
            ],
          },
          explanationNotes: [
            'Dùng "an" trước các từ phát âm bắt đầu bằng một nguyên âm (/e/, /æ/, /aɪ/, /ɒ/...) ví dụ: an hour (h câm), an apple.',
            'Dùng "a" trước từ phát âm bắt đầu bằng phụ âm, ví dụ: a university (/juː.../ là bán phụ âm).',
            'Dùng "the" khi đối tượng là duy nhất (the sun, the earth) hoặc đã được nhắc đến ở câu trước.',
          ],
          examples: [
            {
              target: 'I saw an owl sitting on the roof last night.',
              vi: 'Tối qua tôi nhìn thấy một con cú đang đậu trên mái nhà.',
            },
          ],
          pitfalls: [
            {
              wrong: 'She wants to study at an university in Europe.',
              correct: 'She wants to study at a university in Europe.',
              explanation: '"University" phiên âm bắt đầu bằng âm phụ âm /j/ nên phải dùng "a".',
            },
          ],
          exercises: [
            {
              id: 'ex-a1-3-1',
              type: 'multiple_choice',
              prompt: 'Điền mạo từ thích hợp:',
              question: 'It took us almost _____ hour to reach the train station.',
              options: ['a', 'an', 'the', 'no article'],
              correctIndex: 1,
              explanation: '"Hour" có âm "h" câm, phát âm bắt đầu bằng nguyên âm /ˈaʊər/ nên dùng "an".',
            },
          ],
          xpReward: 30,
        },
        {
          id: 'en-a1-pronouns',
          level: 'A1',
          title: 'Đại từ nhân xưng & Tính từ sở hữu',
          vietnameseTitle: 'Phân biệt Subject, Object Pronouns và Possessive Adjectives',
          summary: 'Đại từ làm chủ ngữ (I, you, he), tân ngữ (me, you, him) và tính từ sở hữu (my, your, his).',
          formula: {
            pattern: 'Subject Pronoun + Verb + Object Pronoun',
            tokens: [
              { label: 'S-Pronoun (I/He/She)', role: 'subject' },
              { label: 'Verb', role: 'verb' },
              { label: 'O-Pronoun (me/him/them)', role: 'object' },
            ],
          },
          explanationNotes: [
            'Tính từ sở hữu (my, his, her, their) bắt buộc phải đi kèm một danh từ phía sau.',
            'Tân ngữ (me, him, her, us, them) đứng sau động từ hoặc giới từ.',
          ],
          examples: [
            {
              target: 'Our teacher gave us very helpful advice.',
              vi: 'Giáo viên của chúng tôi đã cho chúng tôi lời khuyên rất hữu ích.',
            },
          ],
          pitfalls: [
            {
              wrong: 'Her invited me and he to the party.',
              correct: 'She invited me and him to the party.',
              explanation: 'Đầu câu làm chủ ngữ phải là "She", sau động từ làm tân ngữ phải là "him".',
            },
          ],
          exercises: [
            {
              id: 'ex-a1-4-1',
              type: 'fill_in_blank',
              prompt: 'Điền tính từ sở hữu thích hợp (của họ):',
              question: 'The students forgot to bring _____ textbooks to class.',
              correctAnswer: 'their',
              hint: 'Tính từ sở hữu của They',
              explanation: 'Tính từ sở hữu tương ứng với "The students" (They) là "their".',
            },
          ],
          xpReward: 30,
        },
      ],
    },

    // CẤP ĐỘ A2
    {
      levelCode: 'A2',
      levelName: 'Cấp độ A2 - Giao tiếp mở rộng',
      description: 'Nắm vững thì quá khứ đơn, so sánh hơn/nhất, động từ khuyết thiếu và thì hiện tại tiếp diễn.',
      points: [
        {
          id: 'en-a2-past-simple',
          level: 'A2',
          title: 'Thì Quá khứ đơn (Past Simple)',
          vietnameseTitle: 'Diễn tả hành động đã kết thúc hoàn toàn trong quá khứ',
          summary: 'Thêm -ed cho động từ có quy tắc hoặc dùng dạng V2 của bảng động từ bất quy tắc.',
          formula: {
            pattern: 'S + V2 / V-ed + (thời gian quá khứ: yesterday, in 2020...)',
            tokens: [
              { label: 'Subject', role: 'subject' },
              { label: 'Verb (V-ed / V2 bất quy tắc)', role: 'verb' },
              { label: 'Thời gian quá khứ', role: 'modifier' },
            ],
          },
          explanationNotes: [
            'Dấu hiệu nhận biết: yesterday, last night/week, ago, in the past, in + năm quá khứ.',
            'Phủ định dùng: did not (didn\'t) + V-nguyên mẫu.',
            'Nghi vấn: Did + S + V-nguyên mẫu?',
          ],
          examples: [
            {
              target: 'We bought a cozy little house by the sea two years ago.',
              vi: 'Chúng tôi đã mua một căn nhà nhỏ ấm cúng bên bờ biển hai năm trước.',
              phonetic: '/wiː bɔːt ə ˈkoʊzi ˈlɪtl haʊs baɪ ðə siː tuː jɪərz əˈɡoʊ/',
            },
          ],
          pitfalls: [
            {
              wrong: 'We didn\'t went to the concert last Saturday.',
              correct: 'We didn\'t go to the concert last Saturday.',
              explanation: 'Sau trợ động từ "didn\'t", động từ chính bắt buộc phải trở về nguyên mẫu "go".',
            },
          ],
          exercises: [
            {
              id: 'ex-a2-1-1',
              type: 'multiple_choice',
              prompt: 'Chọn đáp án đúng:',
              question: 'Alexander Fleming _____ penicillin by accident in 1928.',
              options: ['discover', 'discovered', 'has discovered', 'discovering'],
              correctIndex: 1,
              explanation: 'Sự kiện lịch sử có mốc năm xác định trong quá khứ (in 1928) bắt buộc chia quá khứ đơn "discovered".',
            },
            {
              id: 'ex-a2-1-2',
              type: 'word_reorder',
              prompt: 'Sắp xếp các từ thành câu đúng:',
              question: 'yesterday / finish / she / her homework / did not',
              scrambledWords: ['did not', 'her homework', 'finish', 'She', 'yesterday'],
              correctOrder: ['She', 'did not', 'finish', 'her homework', 'yesterday'],
              explanation: 'Cấu trúc S + did not + V + O + Time.',
            },
          ],
          xpReward: 30,
        },
        {
          id: 'en-a2-comparatives',
          level: 'A2',
          title: 'So sánh hơn và So sánh nhất của Tính từ',
          vietnameseTitle: 'Quy tắc thêm -er/-est và dùng more/most cho tính từ ngắn/dài',
          summary: 'Tính từ ngắn thêm -er/-est (tall -> taller -> tallest); tính từ dài dùng more/most.',
          formula: {
            pattern: 'S1 + be + Adj-er / more Adj + than + S2',
            tokens: [
              { label: 'Subject 1', role: 'subject' },
              { label: 'Adj-er / More Adj', role: 'verb' },
              { label: 'than', role: 'particle' },
              { label: 'Subject 2', role: 'object' },
            ],
          },
          explanationNotes: [
            'Tính từ bất quy tắc cần nhớ: good -> better -> best, bad -> worse -> worst, far -> further -> furthest.',
            'So sánh nhất luôn có mạo từ "the" đứng trước (the most expensive, the fastest).',
          ],
          examples: [
            {
              target: 'Tokyo is significantly more crowded than Kyoto.',
              vi: 'Tokyo đông đúc hơn Kyoto một cách rõ rệt.',
            },
          ],
          pitfalls: [
            {
              wrong: 'This smartphone is more cheaper than that one.',
              correct: 'This smartphone is cheaper than that one.',
              explanation: '"Cheap" là tính từ ngắn nên chỉ thêm đuôi -er thành "cheaper", không dùng đồng thời "more".',
            },
          ],
          exercises: [
            {
              id: 'ex-a2-2-1',
              type: 'fill_in_blank',
              prompt: 'Điền dạng so sánh hơn của tính từ "good":',
              question: 'Today the weather is much _____ than it was yesterday.',
              correctAnswer: 'better',
              hint: 'Bất quy tắc của good',
              explanation: 'So sánh hơn của "good" là "better".',
            },
          ],
          xpReward: 30,
        },
        {
          id: 'en-a2-modals',
          level: 'A2',
          title: 'Động từ khuyết thiếu: Can, Could, Must, Should',
          vietnameseTitle: 'Biểu thị khả năng, xin phép, lời khuyên và sự bắt buộc',
          summary: 'Sau động từ khuyết thiếu (Modal verbs) luôn là một động từ nguyên mẫu không "to".',
          formula: {
            pattern: 'S + can / should / must + V-bare',
            tokens: [
              { label: 'Subject', role: 'subject' },
              { label: 'can / should / must', role: 'particle' },
              { label: 'V-nguyên mẫu không To', role: 'verb' },
            ],
          },
          explanationNotes: [
            'Can: chỉ khả năng ở hiện tại; Could: khả năng trong quá khứ hoặc lời đề nghị lịch sự.',
            'Should: khuyên nhủ nên làm gì.',
            'Must: bắt buộc phải làm theo quy định luật lệ.',
          ],
          examples: [
            {
              target: 'You should consult a doctor if the fever persists.',
              vi: 'Bạn nên đi khám bác sĩ nếu cơn sốt vẫn kéo dài.',
            },
          ],
          pitfalls: [
            {
              wrong: 'He must to wear a safety helmet on site.',
              correct: 'He must wear a safety helmet on site.',
              explanation: 'Sau "must" là động từ nguyên mẫu không to (bare infinitive).',
            },
          ],
          exercises: [
            {
              id: 'ex-a2-3-1',
              type: 'multiple_choice',
              prompt: 'Chọn đáp án thích hợp:',
              question: 'It is raining cats and dogs. You _____ take an umbrella.',
              options: ['should', 'should to', 'must to', 'can to'],
              correctIndex: 0,
              explanation: 'Đưa ra lời khuyên hợp lý và theo sau là V-bare nên dùng "should".',
            },
          ],
          xpReward: 30,
        },
        {
          id: 'en-a2-future-goingto',
          level: 'A2',
          title: 'Thì Tương lai gần: "Be going to" vs "Will"',
          vietnameseTitle: 'Phân biệt kế hoạch dự định trước và quyết định nảy sinh tức thì',
          summary: '"Be going to" dùng cho kế hoạch đã dự tính từ trước hoặc có bằng chứng thấy rõ.',
          formula: {
            pattern: 'S + am / is / are + going to + V-infinitive',
            tokens: [
              { label: 'Subject', role: 'subject' },
              { label: 'am/is/are + going to', role: 'verb' },
              { label: 'V-nguyên mẫu', role: 'object' },
            ],
          },
          explanationNotes: [
            'Dùng "be going to" khi có dấu hiệu nhìn thấy: "Look at those dark clouds! It is going to rain."',
            'Dùng "will" cho quyết định bộc phát ngay lúc nói: "The phone is ringing. I will answer it."',
          ],
          examples: [
            {
              target: 'They are going to launch the new application next Monday.',
              vi: 'Họ dự định sẽ phát hành ứng dụng mới vào thứ Hai tới.',
            },
          ],
          pitfalls: [
            {
              wrong: 'I am going to meeting him tomorrow.',
              correct: 'I am going to meet him tomorrow.',
              explanation: 'Sau "be going to" là động từ nguyên mẫu "meet", không dùng V-ing.',
            },
          ],
          exercises: [
            {
              id: 'ex-a2-4-1',
              type: 'word_reorder',
              prompt: 'Sắp xếp các từ thành câu đúng:',
              question: 'visit / to / are / going / grandparents / we / our',
              scrambledWords: ['our', 'visit', 'are', 'going', 'We', 'grandparents', 'to'],
              correctOrder: ['We', 'are', 'going', 'to', 'visit', 'our', 'grandparents'],
              explanation: 'Cấu trúc S + are going to + V + O.',
            },
          ],
          xpReward: 30,
        },
      ],
    },
  ],

  // ========== TIẾNG TRUNG ==========
  zh: [
    {
      levelCode: 'HSK 1',
      levelName: 'HSK 1 - Nhập môn Hán ngữ',
      description: 'Đại từ nhân xưng, trợ từ 是 (shì), 的 (de) và trợ từ nghi vấn 吗 (ma).',
      points: [
        {
          id: 'zh-hsk1-shi',
          level: 'HSK 1',
          title: 'Câu phán đoán với chữ "是" (shì)',
          vietnameseTitle: 'Cách dùng chữ 是 tương đương động từ "là" trong tiếng Việt',
          summary: 'Dùng để nối chủ ngữ với danh từ biểu thị danh tính, nghề nghiệp hoặc quốc tịch.',
          formula: {
            pattern: 'Chủ ngữ + 是 + Danh từ bổ ngữ',
            tokens: [
              { label: '主语 (S)', role: 'subject' },
              { label: '是 (shì)', role: 'verb' },
              { label: '名词 (Danh từ)', role: 'object' },
            ],
          },
          explanationNotes: [
            'Phủ định dùng "不是" (bù shì).',
            'Không dùng "是" trước tính từ (Ví dụ: "Cô ấy rất đẹp" là 她很漂亮, không nói 她是漂亮).',
          ],
          examples: [
            {
              target: '我是越南人，他是中国人。',
              vi: 'Tôi là người Việt Nam, anh ấy là người Trung Quốc.',
              phonetic: 'Wǒ shì Yuènán rén, tā shì Zhōngguó rén.',
            },
          ],
          pitfalls: [
            {
              wrong: '今天天气是很好。',
              correct: '今天天气很好。',
              explanation: 'Tính từ làm vị ngữ không cần dùng chữ "是", chỉ cần phó từ chỉ mức độ như "很".',
            },
          ],
          exercises: [
            {
              id: 'ex-zh-1-1',
              type: 'multiple_choice',
              prompt: 'Chọn từ thích hợp điền vào chỗ trống:',
              question: '李老师 _____ 我们学校的汉语老师。',
              options: ['很', '在', '是', '有'],
              correctIndex: 2,
              explanation: 'Câu biểu thị nghề nghiệp/danh tính dùng "是".',
            },
          ],
          xpReward: 30,
        },
        {
          id: 'zh-hsk1-de',
          level: 'HSK 1',
          title: 'Trợ từ kết cấu "的" (de)',
          vietnameseTitle: 'Biểu thị quan hệ sở hữu và định ngữ bổ nghĩa cho danh từ',
          summary: 'Đứng giữa định ngữ và trung tâm ngữ (A 的 B nghĩa là B của A).',
          formula: {
            pattern: 'Định ngữ + 的 + Trung tâm ngữ',
            tokens: [
              { label: 'Người sở hữu / Tính chất', role: 'modifier' },
              { label: '的 (de)', role: 'particle' },
              { label: 'Danh từ chính', role: 'object' },
            ],
          },
          explanationNotes: [
            'Biểu thị sở hữu: 我的书 (Sách của tôi).',
            'Quan hệ thân thuộc ruột thịt có thể lược bỏ 的: 我妈妈 (Mẹ tôi).',
          ],
          examples: [
            {
              target: '这是我朋友的新手机。',
              vi: 'Đây là điện thoại mới của bạn tôi.',
              phonetic: 'Zhè shì wǒ péngyou de xīn shǒujī.',
            },
          ],
          pitfalls: [
            {
              wrong: '这是我书。',
              correct: '这是我的书。',
              explanation: 'Quan hệ sở hữu đồ vật thông thường bắt buộc phải có trợ từ "的".',
            },
          ],
          exercises: [
            {
              id: 'ex-zh-1-2',
              type: 'word_reorder',
              prompt: 'Sắp xếp các từ thành câu đúng:',
              question: '汉语词典 / 的 / 这 / 是 / 我',
              scrambledWords: ['汉语词典', '我', '的', '这', '是'],
              correctOrder: ['这', '是', '我', '的', '汉语词典'],
              explanation: 'Trật tự: 这是 (Đây là) + 我的 (của tôi) + 汉语词典 (từ điển tiếng Hán).',
            },
          ],
          xpReward: 30,
        },
        {
          id: 'zh-hsk1-ma',
          level: 'HSK 1',
          title: 'Trợ từ nghi vấn "吗" (ma)',
          vietnameseTitle: 'Biến câu trần thuật thành câu hỏi Có/Không',
          summary: 'Đặt ở cuối câu khẳng định để tạo câu hỏi nghi vấn.',
          formula: {
            pattern: 'Câu khẳng định + 吗？',
            tokens: [
              { label: 'Câu hoàn chỉnh', role: 'subject' },
              { label: '吗 (ma)', role: 'particle' },
            ],
          },
          explanationNotes: ['Khi câu đã có đại từ nghi vấn (什么, 谁, 哪) thì không dùng "吗" nữa.'],
          examples: [{ target: '你喜欢喝中国茶吗？', vi: 'Bạn có thích uống trà Trung Quốc không?' }],
          pitfalls: [{ wrong: '他是谁吗？', correct: '他是谁？', explanation: 'Đã có đại từ nghi vấn "谁" (ai) thì không dùng thêm "吗".' }],
          exercises: [{ id: 'ex-zh-1-3', type: 'multiple_choice', prompt: 'Chọn từ thích hợp:', question: '你明天去学校 _____ ？', options: ['呢', '吧', '吗', '的'], correctIndex: 2, explanation: 'Câu hỏi có/không đặt "吗" ở cuối.' }],
          xpReward: 30,
        },
        {
          id: 'zh-hsk1-zai',
          level: 'HSK 1',
          title: 'Giới từ nơi chốn "在" (zài)',
          vietnameseTitle: 'Biểu thị vị trí "ở / tại đâu đó"',
          summary: 'Trong tiếng Hán, trạng ngữ chỉ nơi chốn (在 + Nơi chốn) luôn đứng trước động từ hành động.',
          formula: {
            pattern: 'Chủ ngữ + 在 + Nơi chốn + Động từ',
            tokens: [
              { label: 'Chủ ngữ', role: 'subject' },
              { label: '在 + Nơi chốn', role: 'modifier' },
              { label: 'Động từ chính', role: 'verb' },
            ],
          },
          explanationNotes: ['Khác tiếng Việt: Ta nói "Tôi học ở thư viện", tiếng Trung nói "Tôi ở thư viện học" (我在图书馆学习).'],
          examples: [{ target: '我们在家吃晚饭。', vi: 'Chúng tôi ăn cơm tối ở nhà.' }],
          pitfalls: [{ wrong: '我看书在图书馆。', correct: '我在图书馆看书。', explanation: 'Trạng ngữ nơi chốn bắt buộc phải đặt trước động từ.' }],
          exercises: [{ id: 'ex-zh-1-4', type: 'word_reorder', prompt: 'Sắp xếp thành câu đúng:', question: '在 / 他 / 公司 / 工作', scrambledWords: ['工作', '他', '在', '公司'], correctOrder: ['他', '在', '公司', '工作'], explanation: 'Cấu trúc Chủ ngữ + 在 Nơi chốn + Động từ.' }],
          xpReward: 30,
        },
      ],
    },
    {
      levelCode: 'HSK 2',
      levelName: 'HSK 2 - Cấu trúc mở rộng',
      description: 'Bổ ngữ chỉ thời lượng, câu so sánh 比 (bǐ), câu chữ 把 (bǎ) cơ bản.',
      points: [
        {
          id: 'zh-hsk2-bi',
          level: 'HSK 2',
          title: 'Câu so sánh chữ "比" (bǐ)',
          vietnameseTitle: 'Cấu trúc so sánh hơn giữa hai sự vật',
          summary: 'A 比 B + Tính từ (A hơn B về mặt nào đó).',
          formula: {
            pattern: 'A + 比 + B + Tính từ (+ 一点儿 / 得多)',
            tokens: [
              { label: 'A', role: 'subject' },
              { label: '比 (bǐ)', role: 'particle' },
              { label: 'B', role: 'object' },
              { label: 'Tính từ', role: 'verb' },
            ],
          },
          explanationNotes: ['Không dùng phó từ "很", "非常" trong câu chữ 比.'],
          examples: [{ target: '今天比昨天冷得多。', vi: 'Hôm nay lạnh hơn hôm qua rất nhiều.' }],
          pitfalls: [{ wrong: '他比我很高。', correct: '他比我高。', explanation: 'Trong câu chữ 比 không được dùng chữ "很".' }],
          exercises: [{ id: 'ex-zh-2-1', type: 'multiple_choice', prompt: 'Chọn đáp án đúng:', question: '妹妹 _____ 姐姐更喜欢听音乐。', options: ['跟', '比', '对', '在'], correctIndex: 1, explanation: 'Câu so sánh dùng "比".' }],
          xpReward: 30,
        },
        {
          id: 'zh-hsk2-le',
          level: 'HSK 2',
          title: 'Trợ từ ngữ khí "了" (le)',
          vietnameseTitle: 'Biểu thị sự hoàn thành của động tác hoặc sự thay đổi trạng thái',
          summary: 'Đứng sau động từ hoặc ở cuối câu để báo hiệu trạng thái mới xuất hiện.',
          formula: { pattern: 'S + V + 了 + O', tokens: [{ label: 'S', role: 'subject' }, { label: 'V + 了', role: 'verb' }] },
          explanationNotes: ['Phủ định không dùng "不" mà dùng "没/没有 + V" (khi đó bỏ 了).'],
          examples: [{ target: '我吃过早饭了。', vi: 'Tôi đã ăn sáng xong rồi.' }],
          pitfalls: [{ wrong: '我没买了这本书。', correct: '我没买这本书。', explanation: 'Khi đã dùng "没" thì không dùng "了" nữa.' }],
          exercises: [{ id: 'ex-zh-2-2', type: 'fill_in_blank', prompt: 'Điền từ phủ định quá khứ:', question: '他昨天 _____ 来上课。', correctAnswer: '没', hint: 'Phủ định của đã làm', explanation: 'Hành động chưa diễn ra trong quá khứ dùng "没".' }],
          xpReward: 30,
        },
        {
          id: 'zh-hsk2-guò',
          level: 'HSK 2',
          title: 'Trợ từ động thái "过" (guo)',
          vietnameseTitle: 'Diễn tả trải nghiệm từng làm điều gì trong đời',
          summary: 'V + 过 = đã từng làm gì đó trong quá khứ.',
          formula: { pattern: 'S + V + 过 + O', tokens: [{ label: 'S', role: 'subject' }, { label: 'V + 过', role: 'verb' }] },
          explanationNotes: ['Nhấn mạnh vào kinh nghiệm, trải nghiệm bản thân.'],
          examples: [{ target: '我去过两次北京。', vi: 'Tôi đã từng đi Bắc Kinh hai lần.' }],
          pitfalls: [{ wrong: '我没去北京过。', correct: '我没去过北京。', explanation: 'Trợ từ "过" phải gắn liền ngay sau động từ.' }],
          exercises: [{ id: 'ex-zh-2-3', type: 'multiple_choice', prompt: 'Chọn đáp án đúng:', question: '你吃 _____ 烤鸭吗？', options: ['了', '过', '着', '得'], correctIndex: 1, explanation: 'Hỏi kinh nghiệm đã từng ăn chưa dùng "过".' }],
          xpReward: 30,
        },
        {
          id: 'zh-hsk2-jiu-cai',
          level: 'HSK 2',
          title: 'Phân biệt "就" (jiù) và "才" (cái)',
          vietnameseTitle: 'Diễn tả hành động diễn ra sớm/nhanh (就) hay muộn/chậm (才)',
          summary: '就 nhấn mạnh tính thuận lợi, nhanh chóng; 才 biểu thị sự chậm trễ, khó khăn mới đạt được.',
          formula: { pattern: 'Thời gian + 就 / 才 + Động từ', tokens: [{ label: 'Thời gian', role: 'modifier' }, { label: '就 / 才', role: 'particle' }, { label: 'V', role: 'verb' }] },
          explanationNotes: ['Sau "才" cuối câu không dùng "了".'],
          examples: [{ target: '他八点就到了，我九点才来。', vi: 'Anh ấy 8 giờ đã đến rồi, còn tôi 9 giờ mới tới.' }],
          pitfalls: [{ wrong: '他昨天十点才睡了。', correct: '他昨天十点才睡。', explanation: 'Sau "才" không dùng trợ từ "了".' }],
          exercises: [{ id: 'ex-zh-2-4', type: 'multiple_choice', prompt: 'Chọn từ đúng:', question: '作业太难了，我花了一个晚上 _____ 做完。', options: ['就', '才', '也', '还'], correctIndex: 1, explanation: 'Nhấn mạnh sự khó khăn, mất nhiều thời gian dùng "才".' }],
          xpReward: 30,
        },
      ],
    },
  ],

  // ========== TIẾNG NHẬT ==========
  ja: [
    {
      levelCode: 'N5',
      levelName: 'Cấp độ JLPT N5 - Nhập môn',
      description: 'Các trợ từ cơ bản は, が, を, に, で và các thể lịch sự です / ます.',
      points: [
        {
          id: 'ja-n5-particles-wa-ga',
          level: 'N5',
          title: 'Phân biệt Trợ từ は (Wa) và が (Ga)',
          vietnameseTitle: 'Chủ đề câu (は) đối lập với chủ ngữ nhấn mạnh (が)',
          summary: 'は nêu lên chủ đề của câu, còn が nhấn mạnh chính đối tượng đứng trước nó.',
          formula: { pattern: 'A は B です / A が V-ます', tokens: [{ label: 'Danh từ', role: 'subject' }, { label: 'は / が', role: 'particle' }, { label: 'Vị ngữ', role: 'verb' }] },
          explanationNotes: ['Trong câu có từ để hỏi (誰, 何) làm chủ ngữ, bắt buộc dùng が: 誰が来ましたか？'],
          examples: [{ target: '私は学生です。田中さんが先生です。', vi: 'Tôi là học sinh. Anh Tanaka là giáo viên.' }],
          pitfalls: [{ wrong: '誰は来ましたか？', correct: '誰が来ましたか？', explanation: 'Từ để hỏi đứng đầu làm chủ ngữ bắt buộc đi với が.' }],
          exercises: [{ id: 'ex-ja-1-1', type: 'multiple_choice', prompt: 'Chọn trợ từ thích hợp:', question: 'どれ _____ あなたの傘ですか。', options: ['は', 'が', 'を', 'に'], correctIndex: 1, explanation: 'Từ để hỏi "どれ" đi với trợ từ が.' }],
          xpReward: 30,
        },
        {
          id: 'ja-n5-te-form',
          level: 'N5',
          title: 'Thể Te (〜てください / 〜ています)',
          vietnameseTitle: 'Chia thể Te để nhờ vả lịch sự hoặc diễn tả hành động đang diễn ra',
          summary: 'Thể Te là thể biến đổi quan trọng bậc nhất của động từ tiếng Nhật.',
          formula: { pattern: 'V-て + ください / います', tokens: [{ label: 'V-て', role: 'verb' }, { label: 'ください / います', role: 'particle' }] },
          explanationNotes: ['Nhóm 1: chia theo vần đuôi (ku -> ite, su -> shite, mu/bu/nu -> nde).'],
          examples: [{ target: 'ちょっと待ってください。', vi: 'Xin vui lòng đợi một chút.' }],
          pitfalls: [{ wrong: '待ってをください。', correct: '待ってください。', explanation: 'Sau thể Te không chèn thêm trợ từ を.' }],
          exercises: [{ id: 'ex-ja-1-2', type: 'fill_in_blank', prompt: 'Chia động từ 読む (đọc) sang thể Te:', question: '本を _____ ください。', correctAnswer: '読んで', hint: 'đuôi mu biến thành nde', explanation: 'Nhóm 1 đuôi む chuyển thành んで: 読んで.' }],
          xpReward: 30,
        },
        {
          id: 'ja-n5-ni-de',
          level: 'N5',
          title: 'Trợ từ chỉ nơi chốn: に (Ni) vs で (De)',
          vietnameseTitle: 'Nơi tồn tại (に) và Nơi diễn ra hành động (で)',
          summary: 'Dùng に với động từ tồn tại (いる, ある); dùng で với động từ hành động (食べる, 勉強する).',
          formula: { pattern: 'Nơi chốn + に (Tồn tại) / で (Hành động)', tokens: [{ label: 'Địa điểm', role: 'modifier' }, { label: 'に / で', role: 'particle' }] },
          explanationNotes: ['Ví dụ: 図書館で本を読む (Hành động) vs 図書館に本がある (Tồn tại).'],
          examples: [{ target: '公園で散歩をします。', vi: 'Tôi đi dạo ở công viên.' }],
          pitfalls: [{ wrong: '部屋で猫がいます。', correct: '部屋に猫がいます。', explanation: 'Động từ tồn tại "います" bắt buộc đi với に.' }],
          exercises: [{ id: 'ex-ja-1-3', type: 'multiple_choice', prompt: 'Chọn trợ từ đúng:', question: '机の上 _____ ノートがあります。', options: ['で', 'に', 'を', 'へ'], correctIndex: 1, explanation: 'Chỉ nơi tồn tại của đồ vật (ある) dùng に.' }],
          xpReward: 30,
        },
        {
          id: 'ja-n5-adjectives',
          level: 'N5',
          title: 'Tính từ đuôi い (I) và đuôi な (Na)',
          vietnameseTitle: 'Quy tắc chia phủ định và quá khứ của 2 nhóm tính từ',
          summary: 'Tính từ đuôi い: bỏ い thêm くない / かった; tính từ đuôi な thêm じゃない / でした.',
          formula: { pattern: 'Adj-i -> くない / Adj-na -> じゃない', tokens: [{ label: 'Tính từ', role: 'verb' }] },
          explanationNotes: ['Lưu ý tính từ bất quy tắc いい (tốt) -> よくない, よかった.'],
          examples: [{ target: '昨日はあまり寒くなかったです。', vi: 'Hôm qua trời không lạnh lắm.' }],
          pitfalls: [{ wrong: '昨日は寒くないでした。', correct: '昨日は寒くなかったです。', explanation: 'Quá khứ tính từ đuôi i phải đổi thành かった.' }],
          exercises: [{ id: 'ex-ja-1-4', type: 'multiple_choice', prompt: 'Chọn dạng đúng:', question: 'この部屋はとても _____ です。', options: ['静かな', '静か', '静かに', '静かだ'], correctIndex: 1, explanation: 'Tính từ đuôi na đứng trước です thì bỏ な.' }],
          xpReward: 30,
        },
      ],
    },
    {
      levelCode: 'N4',
      levelName: 'Cấp độ JLPT N4 - Trung sơ cấp',
      description: 'Thể điều kiện (たら, ば), thể khả năng, thể bị động và thể sai khiến.',
      points: [
        {
          id: 'ja-n4-potential',
          level: 'N4',
          title: 'Thể Khả năng (可能形 - Kanoukei)',
          vietnameseTitle: 'Diễn tả năng lực có thể làm được việc gì',
          summary: 'Nhóm 1: cột u -> e + る; Nhóm 2: bỏ る + られる; Nhóm 3: できる, こられる.',
          formula: { pattern: 'N + が + V-khả năng', tokens: [{ label: 'Tân ngữ', role: 'object' }, { label: 'が', role: 'particle' }, { label: 'V-khả năng', role: 'verb' }] },
          explanationNotes: ['Trong thể khả năng, trợ từ を thường chuyển thành が: 日本語が話せる.'],
          examples: [{ target: '私は漢字が少し読めます。', vi: 'Tôi có thể đọc được một chút chữ Hán.' }],
          pitfalls: [{ wrong: '漢字を読めます。', correct: '漢字が読めます。', explanation: 'Tân ngữ của thể khả năng ưu tiên dùng trợ từ が.' }],
          exercises: [{ id: 'ex-ja-2-1', type: 'multiple_choice', prompt: 'Chọn dạng khả năng:', question: '一人で病院へ _____ か。', options: ['行けます', '行きます', '行かれます', '行かせます'], correctIndex: 0, explanation: 'Động từ 行く nhóm 1 chuyển cột e thành 行ける -> 行けます.' }],
          xpReward: 30,
        },
        {
          id: 'ja-n4-tara',
          level: 'N4',
          title: 'Thể Điều kiện 〜たら (Tara)',
          vietnameseTitle: 'Cấu trúc "Nếu... thì..." hoặc "Sau khi làm A thì làm B"',
          summary: 'Động từ chia thể Quá khứ Ta + ら (V-た + ら).',
          formula: { pattern: 'V-たら + Kết quả', tokens: [{ label: 'V-たら', role: 'modifier' }, { label: 'Mệnh đề sau', role: 'verb' }] },
          explanationNotes: ['Có tính ứng dụng rộng nhất trong các mẫu câu điều kiện tiếng Nhật.'],
          examples: [{ target: '時間があったら、映画を見に行きましょう。', vi: 'Nếu có thời gian thì chúng ta cùng đi xem phim nhé.' }],
          pitfalls: [{ wrong: '時間があるたら、行きます。', correct: '時間があったら、行きます。', explanation: 'Phải chia về thể Ta rồi mới thêm ら (あったら).' }],
          exercises: [{ id: 'ex-ja-2-2', type: 'fill_in_blank', prompt: 'Chia điều kiện tara của 降る (mưa rơi):', question: '雨が _____ 、試合は中止です。', correctAnswer: '降ったら', hint: 'đuôi ru chia ta thành futta', explanation: '降る -> 降った -> 降ったら.' }],
          xpReward: 30,
        },
        {
          id: 'ja-n4-passive',
          level: 'N4',
          title: 'Thể Bị động (受身形 - Ukemi)',
          vietnameseTitle: 'Chủ ngữ bị/được tác động bởi người khác',
          summary: 'Nhóm 1: cột a + れる; Nhóm 2: られる; Nhóm 3: される, こられる.',
          formula: { pattern: 'Chủ ngữ + は + Tác nhân + に + V-bị động', tokens: [{ label: 'Chủ ngữ', role: 'subject' }, { label: 'Tác nhân + に', role: 'object' }, { label: 'V-bị động', role: 'verb' }] },
          explanationNotes: ['Bị động phiền toái (Meiwaku ukemi): 雨に降られた (Bị dính mưa phiền toái).'],
          examples: [{ target: '先生に名前を呼ばれました。', vi: 'Tôi đã được giáo viên gọi tên.' }],
          pitfalls: [{ wrong: '先生を呼ばれました。', correct: '先生に呼ばれました。', explanation: 'Tác nhân gây tác động đi với trợ từ に.' }],
          exercises: [{ id: 'ex-ja-2-3', type: 'multiple_choice', prompt: 'Chọn trợ từ thích hợp:', question: '妹は母 _____ 叱られました。', options: ['に', 'を', 'で', 'から'], correctIndex: 0, explanation: 'Người mắng (tác nhân) đi với trợ từ に.' }],
          xpReward: 30,
        },
        {
          id: 'ja-n4-causative',
          level: 'N4',
          title: 'Thể Sai khiến (使役形 - Shieki)',
          vietnameseTitle: 'Cho phép hoặc bắt buộc ai đó làm việc gì',
          summary: 'Nhóm 1: cột a + せる; Nhóm 2: させる; Nhóm 3: させる, こさせる.',
          formula: { pattern: 'A は B に + V-sai khiến', tokens: [{ label: 'Người ra lệnh', role: 'subject' }, { label: 'Người nhận lệnh + に', role: 'object' }, { label: 'V-sai khiến', role: 'verb' }] },
          explanationNotes: ['〜させてください dùng để xin phép cho bản thân mình được làm gì một cách lịch thiệp.'],
          examples: [{ target: '私にその仕事をやらせてください。', vi: 'Xin hãy cho phép tôi được làm công việc đó.' }],
          pitfalls: [{ wrong: '私をやらせてください。', correct: '私にやらせてください。', explanation: 'Đối tượng được cho phép nhận trợ từ に.' }],
          exercises: [{ id: 'ex-ja-2-4', type: 'multiple_choice', prompt: 'Chọn dạng đúng:', question: '母は子どもに野菜を _____ 。', options: ['食べさせました', '食べられました', '食べました', '食べたがりました'], correctIndex: 0, explanation: 'Mẹ bắt con ăn rau (sai khiến) dùng 食べさせました.' }],
          xpReward: 30,
        },
      ],
    },
  ],
}

export const useGrammar = (targetLang?: Ref<LearningLanguage>) => {
  const currentLang = targetLang || ref<LearningLanguage>('en')
  const client = useSupabaseClient<Database>()
  const authUser = useSupabaseUser()
  const config = useRuntimeConfig()

  const isUseMock = computed(() => {
    return (
      config.public.useMock === true ||
      config.public.useMock === 'true' ||
      process.env.NUXT_PUBLIC_USE_MOCK === 'true'
    )
  })

  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)
  const dbSections = ref<GrammarLevelSection[]>([])

  // Trạng thái mở rộng accordion theo cấp độ
  const expandedSections = ref<Record<string, boolean>>({
    A1: true,
    A2: true,
    'HSK 1': true,
    'HSK 2': true,
    N5: true,
    N4: true,
  })

  const toggleSection = (levelCode: string) => {
    expandedSections.value[levelCode] = !expandedSections.value[levelCode]
  }

  // Điểm ngữ pháp đã hoàn thành
  const completedPointIds = ref<string[]>([])

  // Tải dữ liệu từ Supabase
  const fetchGrammarData = async () => {
    if (isUseMock.value) return

    isLoading.value = true
    errorMessage.value = null

    try {
      const uid = authUser.value?.id

      // 1. Tải các điểm ngữ pháp kèm bài tập
      const { data: pointsData, error: pointsErr } = await client
        .from('grammar_points')
        .select('*, grammar_exercises(*)')
        .eq('language', currentLang.value)
        .order('sort_order', { ascending: true })

      if (pointsErr) throw pointsErr

      // 2. Tải tiến trình hoàn thành của người dùng
      if (uid) {
        const { data: progData } = await client
          .from('user_grammar_progress')
          .select('point_id, is_completed')
          .eq('user_id', uid)
          .eq('is_completed', true)

        if (progData) {
          completedPointIds.value = progData.map((p: any) => p.point_id)
        }
      }

      // 3. Gom nhóm theo level
      if (pointsData && pointsData.length > 0) {
        const grouped: Record<string, GrammarPoint[]> = {}

        pointsData.forEach((row: any) => {
          const lvl = row.level || 'A1'
          if (!grouped[lvl]) grouped[lvl] = []

          const exercises = (row.grammar_exercises || []).map((ex: any) => ({
            id: ex.id,
            type: ex.question_type as ExerciseType,
            prompt: ex.prompt,
            question: ex.question || '',
            options: Array.isArray(ex.options) ? ex.options : [],
            correctAnswer: ex.correct_answer,
            explanation: ex.explanation,
          }))

          grouped[lvl].push({
            id: row.id,
            level: row.level,
            title: row.title,
            vietnameseTitle: row.vietnamese_title,
            summary: row.summary || '',
            formula: (row.formula as any) || { pattern: '', tokens: [] },
            explanationNotes: [row.explanation],
            examples: Array.isArray(row.examples) ? row.examples.map(normalizeGrammarExample) : [],
            pitfalls: Array.isArray(row.common_mistakes) ? (row.common_mistakes as any) : [],
            exercises,
            xpReward: row.xp_reward || 30,
          })
        })

        dbSections.value = Object.keys(grouped).map(lvl => ({
          levelCode: lvl,
          levelName: `Cấp độ ${lvl}`,
          description: `Toàn bộ các quy tắc và mẫu câu ngữ pháp trọng điểm của cấp ${lvl}.`,
          points: grouped[lvl],
        }))
      }
    } catch (err: any) {
      if (handleAuthExpired(err)) return
      errorMessage.value = translateSupabaseError(err)
      console.warn('Lỗi khi tải ngữ pháp từ Supabase, dùng mock fallback:', err.message)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      const saved = localStorage.getItem('langua_completed_grammar')
      if (saved) {
        try {
          completedPointIds.value = JSON.parse(saved)
        } catch {
          completedPointIds.value = []
        }
      }
    }
    fetchGrammarData()
  })

  watch(currentLang, () => {
    fetchGrammarData()
  })

  // Danh sách cấp độ theo ngôn ngữ
  const levelSections = computed<GrammarLevelSection[]>(() => {
    if (!isUseMock.value && dbSections.value.length > 0) {
      return dbSections.value
    }
    const raw = MOCK_GRAMMAR_LEVELS[currentLang.value] || MOCK_GRAMMAR_LEVELS.en
    return raw.map(sec => ({
      ...sec,
      points: sec.points.map(p => ({
        ...p,
        examples: (p.examples || []).map(normalizeGrammarExample),
      })),
    }))
  })

  // Nộp bài và chấm điểm ngữ pháp qua RPC server
  const submitGrammarAttempt = async (
    pointId: string,
    answers: Record<string, string>,
    durationSeconds: number = 0
  ) => {
    const uid = authUser.value?.id

    if (!isUseMock.value && uid) {
      try {
        const { data, error } = await client.rpc('submit_grammar_attempt', {
          p_point_id: pointId,
          p_answers: answers as any,
          p_duration_seconds: durationSeconds,
        })

        if (error) {
          if (handleAuthExpired(error)) return { success: false }
          return { success: false, error: translateSupabaseError(error) }
        }

        if (data && typeof data === 'object') {
          const res = data as Record<string, any>
          if (res.passed && !completedPointIds.value.includes(pointId)) {
            completedPointIds.value.push(pointId)
          }
          return {
            success: true,
            score: res.score,
            totalQuestions: res.total_questions,
            accuracyPercent: res.accuracy_percent,
            passed: res.passed,
            xpEarned: res.xp_earned,
          }
        }
      } catch (err: any) {
        return { success: false, error: translateSupabaseError(err) }
      }
    }

    // Mock fallback
    if (!completedPointIds.value.includes(pointId)) {
      completedPointIds.value.push(pointId)
      if (import.meta.client) {
        localStorage.setItem('langua_completed_grammar', JSON.stringify(completedPointIds.value))
      }
    }
    return { success: true, passed: true, xpEarned: 30 }
  }

  const markPointCompleted = (pointId: string) => {
    if (!completedPointIds.value.includes(pointId)) {
      completedPointIds.value.push(pointId)
      if (import.meta.client) {
        localStorage.setItem('langua_completed_grammar', JSON.stringify(completedPointIds.value))
      }
    }
  }

  // Tính tiến độ theo từng cấp độ
  const getSectionProgress = (points: GrammarPoint[]) => {
    const total = points.length
    if (total === 0) return { completed: 0, total: 0, percent: 0 }
    const done = points.filter(p => completedPointIds.value.includes(p.id)).length
    return {
      completed: done,
      total,
      percent: Math.round((done / total) * 100),
    }
  }

  // Lấy chi tiết 1 điểm ngữ pháp theo id
  const getGrammarPointById = (id: string): GrammarPoint | undefined => {
    for (const sec of levelSections.value) {
      const p = sec.points.find(item => item.id === id)
      if (p) return p
    }
    // Fallback tìm trên tất cả ngôn ngữ
    for (const lang of Object.keys(MOCK_GRAMMAR_LEVELS) as LearningLanguage[]) {
      for (const sec of MOCK_GRAMMAR_LEVELS[lang]) {
        const p = sec.points.find(item => item.id === id)
        if (p) return { ...p, examples: (p.examples || []).map(normalizeGrammarExample) }
      }
    }
    return levelSections.value[0]?.points[0]
  }

  return {
    levelSections,
    expandedSections,
    completedPointIds,
    isLoading,
    errorMessage,
    fetchGrammarData,
    toggleSection,
    getSectionProgress,
    getGrammarPointById,
    markPointCompleted,
    submitGrammarAttempt,
  }
}
