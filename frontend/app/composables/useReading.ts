import type { LearningLanguage } from './useLanguage'
import type { Database } from '~/types/database.types'
import { translateSupabaseError, handleAuthExpired } from '~/utils/supabaseErrors'

export type ReadingType = 'news' | 'book' | 'short_story' | 'novel' | 'play'

export interface ParagraphItem {
  id: string
  targetText: string
  viTranslation: string
  vocabNotes?: Array<{ word: string; meaning: string }>
}

export interface ReadingMaterial {
  id: string
  title: string
  viTitle: string
  author: string
  type: ReadingType
  lang: LearningLanguage
  level: string
  wordCount: number
  readingTimeMin: number
  isCustom?: boolean
  sourceNote?: string
  paragraphs: ParagraphItem[]
}

/**
 * LƯU Ý BẢN QUYỀN VÀ MÃ NGUỒN:
 * Toàn bộ các văn bản mẫu bên dưới đều thuộc PHẠM VI CÔNG CỘNG (Public Domain)
 * như truyện ngụ ngôn Aesop (Aesop's Fables), truyện cổ tích Hans Christian Andersen,
 * hoặc tác phẩm văn học cổ điển đã hết thời hạn bảo hộ bản quyền.
 * Tuyệt đối không sao chép tác phẩm có bản quyền.
 * Nguồn dữ liệu thật sau này của hệ thống bắt buộc phải có giấy phép bản quyền rõ ràng hoặc thuộc phạm vi công cộng.
 */
export const PUBLIC_DOMAIN_READING_LIST: ReadingMaterial[] = [
  // ========== TIẾNG ANH ==========
  // 1. Truyện ngắn ngụ ngôn (Aesop's Fables - Public Domain)
  {
    id: 'read-en-tortoise-hare',
    title: 'The Tortoise and the Hare',
    viTitle: 'Rùa và Thỏ - Truyện ngụ ngôn Aesop',
    author: 'Aesop (Phạm vi công cộng)',
    type: 'short_story',
    lang: 'en',
    level: 'A2 - B1',
    wordCount: 210,
    readingTimeMin: 2,
    sourceNote: 'Nguồn: Truyện ngụ ngôn cổ đại Hy Lạp (Public Domain)',
    paragraphs: [
      {
        id: 'p1',
        targetText: 'A Hare was once ridiculing the slow feet of a Tortoise. The Tortoise, smiling quietly, replied that despite his heavy shell, he could beat the nimble Hare in a race across the countryside.',
        viTranslation: 'Một ngày nọ, chú Thỏ buông lời chế giễu đôi chân chậm chạp của Rùa. Rùa chỉ mỉm cười điềm tĩnh đáp lại rằng bất chấp chiếc mai nặng nề, chú vẫn có thể đánh bại chú Thỏ lanh lợi trong một cuộc đua xuyên qua cánh đồng.',
        vocabNotes: [
          { word: 'ridiculing', meaning: 'Chế giễu, nhạo báng' },
          { word: 'nimble', meaning: 'Nhanh nhẹn, lanh lẹ' },
        ],
      },
      {
        id: 'p2',
        targetText: 'The Hare, overly confident in his natural swiftness, accepted the challenge without hesitation. Soon after the starting signal, the Hare sprinted far ahead and decided to take a brief nap under a shady oak tree.',
        viTranslation: 'Thỏ vì quá tự phụ vào tốc độ bẩm sinh của mình nên đã nhận lời thách đấu không chút đắn đo. Ngay sau hiệu lệnh xuất phát, Thỏ phóng vụt lên phía trước rồi quyết định đánh một giấc ngủ ngắn dưới bóng râm của cây sồi.',
        vocabNotes: [
          { word: 'swiftness', meaning: 'Sự nhanh nhẹn, tốc độ cao' },
          { word: 'sprinted', meaning: 'Chạy nước rút, phóng vọt đi' },
        ],
      },
      {
        id: 'p3',
        targetText: 'Meanwhile, the Tortoise kept plodding on steadily without pausing for a single moment. When the Hare finally awoke from his slumber, he rushed towards the finish line only to see the Tortoise comfortably resting as the victor.',
        viTranslation: 'Trong lúc đó, Rùa vẫn kiên trì từng bước vững chắc không ngừng nghỉ một giây nào. Khi Thỏ cuối cùng tỉnh dậy khỏi giấc ngủ, chú vội vã lao về phía vạch đích nhưng chỉ thấy Rùa đã thảnh thơi nghỉ ngơi trong tư cách người chiến thắng.',
        vocabNotes: [
          { word: 'plodding', meaning: 'Bước đi nặng nhọc nhưng kiên trì' },
          { word: 'slumber', meaning: 'Giấc ngủ say' },
          { word: 'victor', meaning: 'Người chiến thắng vinh quang' },
        ],
      },
    ],
  },

  // 2. Tiểu thuyết kinh điển (Alice in Wonderland - Lewis Carroll - Public Domain)
  {
    id: 'read-en-alice-rabbit-hole',
    title: 'Down the Rabbit Hole',
    viTitle: 'Xuống hang thỏ - Trích Alice ở xứ sở diệu kỳ',
    author: 'Lewis Carroll (1865, Public Domain)',
    type: 'novel',
    lang: 'en',
    level: 'B1 - B2',
    wordCount: 260,
    readingTimeMin: 3,
    sourceNote: 'Nguồn: Văn học thiếu nhi kinh điển thế giới (Public Domain)',
    paragraphs: [
      {
        id: 'p-al-1',
        targetText: 'Alice was beginning to get very tired of sitting by her sister on the riverbank, and of having nothing to do. Once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it.',
        viTranslation: 'Alice bắt đầu cảm thấy rất mệt mỏi khi phải ngồi cạnh chị gái bên bờ sông mà chẳng có việc gì để làm. Một hai lần cô bé đã liếc nhìn vào cuốn sách chị đang đọc, nhưng trong đó chẳng hề có tranh ảnh hay những lời đối thoại nào.',
        vocabNotes: [
          { word: 'riverbank', meaning: 'Bờ sông, bến nước' },
          { word: 'peeped', meaning: 'Liếc trộm, nhìn lén' },
        ],
      },
      {
        id: 'p-al-2',
        targetText: 'Suddenly, a White Rabbit with curious pink eyes ran close by her. It took a pocket-watch out of its waistcoat pocket, looked at it with anxiety, and hurried away into a large rabbit-hole under the hedge.',
        viTranslation: 'Bất thình lình, một chú Thỏ Trắng với đôi mắt màu hồng kỳ lạ chạy vụt qua sát cạnh cô. Chú rút một chiếc đồng hồ quả quýt ra khỏi túi áo gi-lê, nhìn vào nó với vẻ bồn chồn lo lắng, rồi vội vã chui tọt vào một chiếc hang thỏ lớn bên dưới hàng rào cây.',
        vocabNotes: [
          { word: 'waistcoat', meaning: 'Áo gi-lê cài khuy' },
          { word: 'anxiety', meaning: 'Sự lo âu, bồn chồn' },
        ],
      },
    ],
  },

  // 3. Trích đoạn kịch Shakespeare (As You Like It - Public Domain)
  {
    id: 'read-en-shakespeare-stage',
    title: 'All the World is a Stage',
    viTitle: 'Cả thế gian này là một sân khấu kịch',
    author: 'William Shakespeare (Public Domain)',
    type: 'play',
    lang: 'en',
    level: 'C1',
    wordCount: 220,
    readingTimeMin: 3,
    sourceNote: 'Nguồn: Kịch kinh điển William Shakespeare (Public Domain)',
    paragraphs: [
      {
        id: 'p-sh-1',
        targetText: 'All the world\'s a stage, and all the men and women merely players. They have their exits and their entrances, and one man in his time plays many different parts across his life journey.',
        viTranslation: 'Cả thế gian này tựa như một sân khấu kịch, và mọi đàn ông lẫn đàn bà chỉ là những diễn viên. Họ có những lần bước ra và những lần rút lui, và một con người trong cuộc đời mình sẽ sắm rất nhiều vai diễn khác nhau trong suốt hành trình sống.',
        vocabNotes: [
          { word: 'merely', meaning: 'Chỉ là, thuần tuý' },
          { word: 'players', meaning: 'Diễn viên sân khấu kịch' },
        ],
      },
    ],
  },

  // 4. Bài báo công cộng tự biên soạn về Khoa học nhận thức
  {
    id: 'read-en-science-habits',
    title: 'The Architecture of Human Habit Loops',
    viTitle: 'Cấu trúc của vòng lặp thói quen ở con người',
    author: 'Ban biên tập LanguaLab (Tự biên soạn, Giấy phép mở)',
    type: 'news',
    lang: 'en',
    level: 'B2',
    wordCount: 230,
    readingTimeMin: 3,
    sourceNote: 'Nguồn: Bài viết giáo dục phi thương mại do LanguaLab biên soạn',
    paragraphs: [
      {
        id: 'p-hb-1',
        targetText: 'Neuroscientists have discovered that habits emerge because the human brain constantly seeks ways to conserve energy. An efficient brain transforms routine behavioral sequences into automatic reflexes.',
        viTranslation: 'Các nhà khoa học thần kinh phát hiện ra rằng thói quen xuất hiện bởi vì bộ não con người luôn tìm kiếm cách để bảo tồn năng lượng. Một bộ não hoạt động hiệu quả sẽ biến chuỗi hành vi thường nhật thành những phản xạ tự động.',
        vocabNotes: [
          { word: 'conserve', meaning: 'Bảo tồn, gìn giữ năng lượng' },
          { word: 'sequences', meaning: 'Chuỗi trình tự liên tiếp' },
        ],
      },
    ],
  },

  // 5. Trích sách mở (Henry David Thoreau - Walden - Public Domain)
  {
    id: 'read-en-walden-woods',
    title: 'Where I Lived, and What I Lived For',
    viTitle: 'Tôi đã sống ở đâu và sống vì điều gì - Trích Walden',
    author: 'Henry David Thoreau (1854, Public Domain)',
    type: 'book',
    lang: 'en',
    level: 'C1',
    wordCount: 240,
    readingTimeMin: 3,
    sourceNote: 'Nguồn: Văn học tư tưởng triết học cổ điển (Public Domain)',
    paragraphs: [
      {
        id: 'p-wd-1',
        targetText: 'I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived.',
        viTranslation: 'Tôi tìm về chốn rừng sâu bởi vì tôi muốn sống một cách có chủ đích, để đối diện trực tiếp với những thực tại cốt lõi của đời sống, và xem liệu tôi có thể học được những điều cuộc đời muốn dạy, để khi nhắm mắt xuôi tay, tôi không nhận ra mình chưa từng thực sự sống.',
        vocabNotes: [
          { word: 'deliberately', meaning: 'Có chủ đích, suy xét cẩn trọng' },
          { word: 'essential', meaning: 'Cốt lõi, thiết yếu nhất' },
        ],
      },
    ],
  },

  // ========== TIẾNG TRUNG ==========
  {
    id: 'read-zh-saiweng',
    title: '塞翁失马，焉知非福',
    viTitle: 'Tái ông thất mã, an tri hoạ phúc',
    author: 'Hoài Nam Tử (Văn ngôn cổ điển, Public Domain)',
    type: 'short_story',
    lang: 'zh',
    level: 'HSK 4',
    wordCount: 180,
    readingTimeMin: 2,
    sourceNote: 'Nguồn: Điển tích cổ đại Trung Hoa (Public Domain)',
    paragraphs: [
      {
        id: 'p-zh-1',
        targetText: '从前，边塞住着一位老翁。一天，他家的马无缘无故跑到了胡人的领地，邻居们都来安慰他。老翁却笑着说：“这怎么就不能是一件好事呢？”',
        viTranslation: 'Thuở xưa, nơi biên ải có một ông lão sinh sống. Một hôm, con ngựa nhà ông chẳng rõ duyên cớ chạy lạc vào lãnh thổ của người Hồ, hàng xóm đều đến an ủi. Ông lão lại cười bảo: "Việc này biết đâu lại là chuyện tốt?"',
        vocabNotes: [
          { word: '无缘无故', meaning: 'Vô duyên vô cớ, không có lý do' },
          { word: '领地', meaning: 'Lãnh địa, vùng đất' },
        ],
      },
      {
        id: 'p-zh-2',
        targetText: '过了几个月，那匹马不仅自己回来了，还带回了一匹胡人的骏马。好事与坏事在生活中往往可以相互转化，不可因一时的得失而过于悲喜。',
        viTranslation: 'Mấy tháng sau, con ngựa đó chẳng những tự quay về, mà còn dẫn theo một con tuấn mã của người Hồ. Chuyện vui và việc buồn trong đời thường chuyển hoá lẫn nhau, chớ nên vì được mất nhất thời mà quá bi luỵ hay mừng rỡ.',
        vocabNotes: [
          { word: '骏马', meaning: 'Tuấn mã, ngựa tốt chạy nhanh' },
          { word: '转化', meaning: 'Chuyển hoá, thay đổi trạng thái' },
        ],
      },
    ],
  },

  // ========== TIẾNG NHẬT ==========
  {
    id: 'read-ja-momotaro',
    title: '桃太郎（ももたろう）',
    viTitle: 'Cậu bé quả đào Momotaro - Truyện cổ tích Nhật Bản',
    author: 'Truyền thuyết dân gian Nhật Bản (Public Domain)',
    type: 'short_story',
    lang: 'ja',
    level: 'JLPT N4',
    wordCount: 200,
    readingTimeMin: 2,
    sourceNote: 'Nguồn: Truyện cổ tích dân gian Nhật Bản (Public Domain)',
    paragraphs: [
      {
        id: 'p-ja-1',
        targetText: '昔々、ある所におじいさんとおばあさんが住んでいました。おじいさんは山へ柴刈りに、おばあさんは川へ洗濯に行きました。',
        viTranslation: 'Ngày xửa ngày xưa, ở một ngôi làng nọ có một ông lão và một bà lão sinh sống. Ông lão lên núi đốn củi, còn bà lão ra bờ sông giặt giũ quần áo.',
        vocabNotes: [
          { word: '柴刈り', meaning: 'Đốn củi, nhặt cành cây khô' },
          { word: '洗濯', meaning: 'Giặt giũ đồ' },
        ],
      },
      {
        id: 'p-ja-2',
        targetText: 'おばあさんが洗濯をしていると、川上から大きな桃がどんぶらこ、どんぶらこと流れてきました。家に持ち帰って切ってみると、中から元気な男の子が生まれました。',
        viTranslation: 'Khi bà lão đang giặt áo thì từ thượng nguồn dòng sông, một quả đào khổng lồ bồng bềnh trôi xuôi về phía bà. Đem về nhà bổ ra xem thì thấy một cậu bé khoẻ mạnh kháu khỉnh sinh ra từ bên trong.',
        vocabNotes: [
          { word: 'どんぶらこ', meaning: 'Từ tượng hình chỉ vật bồng bềnh dập dềnh trôi trên nước' },
          { word: '持ち帰る', meaning: 'Mang về nhà' },
        ],
      },
    ],
  },
]

export const useReading = (targetLang?: Ref<LearningLanguage>) => {
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

  // Bộ lọc
  const activeTab = ref<'catalog' | 'custom_paste'>('catalog')
  const typeFilter = ref<'all' | ReadingType>('all')
  const levelFilter = ref<string>('all')

  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  // Dữ liệu từ Supabase
  const dbMaterials = ref<ReadingMaterial[]>([])
  const dbCustomTexts = ref<ReadingMaterial[]>([])
  const localCustomTexts = ref<ReadingMaterial[]>([])

  // Tải dữ liệu bài đọc từ Supabase
  const fetchReadingData = async () => {
    if (isUseMock.value) return

    isLoading.value = true
    errorMessage.value = null

    try {
      const uid = authUser.value?.id

      // 1. Tải kho bài đọc công khai (chỉ lấy is_published = true)
      const { data: itemsData, error: itemsErr } = await client
        .from('reading_items')
        .select('*, reading_sections(*)')
        .eq('is_published', true)
        .eq('language', currentLang.value)
        .order('created_at', { ascending: false })

      if (itemsErr) throw itemsErr

      if (itemsData) {
        dbMaterials.value = itemsData.map((item: any) => {
          const sections = (item.reading_sections || []).sort(
            (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
          )
          return {
            id: item.id,
            title: item.title,
            viTitle: item.vietnamese_title || item.title,
            author: item.author,
            type: item.content_type as ReadingType,
            lang: item.language as LearningLanguage,
            level: item.level,
            wordCount: item.word_count || 150,
            readingTimeMin: item.reading_time_minutes || 2,
            isCustom: false,
            sourceNote: item.source_note || undefined,
            paragraphs: sections.map((sec: any) => ({
              id: sec.id,
              targetText: sec.original_text,
              viTranslation: sec.translated_text,
              vocabNotes: Array.isArray(sec.vocab_notes) ? sec.vocab_notes : [],
            })),
          }
        })
      }

      // 2. Tải văn bản cá nhân từ user_texts
      if (uid) {
        const { data: userTextsData, error: userTextsErr } = await client
          .from('user_texts')
          .select('*')
          .eq('user_id', uid)
          .eq('language', currentLang.value)
          .order('created_at', { ascending: false })

        if (userTextsErr) throw userTextsErr

        if (userTextsData) {
          dbCustomTexts.value = userTextsData.map((t: any) => {
            const paragraphs = t.content
              .split(/\n\s*\n/)
              .map((p: string, idx: number) => ({
                id: `p-${idx + 1}`,
                targetText: p.trim(),
                viTranslation: 'Chưa có bản dịch mẫu (chế độ tự dịch).',
              }))

            const wordsCount = t.content.split(/\s+/).length

            return {
              id: t.id,
              title: t.title,
              viTitle: 'Văn bản của bạn',
              author: 'Bạn (Tự nhập)',
              type: 'short_story' as ReadingType,
              lang: t.language as LearningLanguage,
              level: 'Tùy chọn',
              wordCount: wordsCount,
              readingTimeMin: Math.max(1, Math.round(wordsCount / 100)),
              isCustom: true,
              sourceNote: 'Văn bản dán riêng tư',
              paragraphs,
            }
          })
        }
      }
    } catch (err: any) {
      if (handleAuthExpired(err)) return
      errorMessage.value = translateSupabaseError(err)
      console.warn('Lỗi khi tải kho đọc từ Supabase, dùng mock fallback:', err.message)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      const saved = localStorage.getItem('langua_my_custom_reading')
      if (saved) {
        try {
          localCustomTexts.value = JSON.parse(saved)
        } catch {
          localCustomTexts.value = []
        }
      }
    }
    fetchReadingData()
  })

  watch(currentLang, () => {
    fetchReadingData()
  })

  const saveCustomTextsLocal = () => {
    if (import.meta.client) {
      localStorage.setItem('langua_my_custom_reading', JSON.stringify(localCustomTexts.value))
    }
  }

  // Thêm văn bản dán riêng (lưu vào user_texts)
  const addCustomText = async (data: {
    title: string
    viTitle?: string
    author?: string
    type: ReadingType
    rawTargetText: string
    rawViText?: string
    lang: LearningLanguage
    level: string
  }) => {
    const uid = authUser.value?.id

    if (!isUseMock.value && uid) {
      try {
        const { data: row, error } = await client
          .from('user_texts')
          .insert({
            user_id: uid,
            title: data.title,
            content: data.rawTargetText,
            language: data.lang,
          })
          .select()
          .single()

        if (error) throw error

        if (row) {
          const targetParagraphs = data.rawTargetText
            .split(/\n\s*\n/)
            .map(p => p.trim())
            .filter(Boolean)

          const viParagraphs = (data.rawViText || '')
            .split(/\n\s*\n/)
            .map(p => p.trim())
            .filter(Boolean)

          const paragraphs: ParagraphItem[] = targetParagraphs.map((text, idx) => ({
            id: `custom-p-${idx + 1}`,
            targetText: text,
            viTranslation: viParagraphs[idx] || 'Chưa có bản dịch mẫu.',
          }))

          const wordsCount = data.rawTargetText.split(/\s+/).length

          const newMaterial: ReadingMaterial = {
            id: row.id,
            title: row.title,
            viTitle: data.viTitle || 'Văn bản của bạn',
            author: data.author || 'Bạn (Tự nhập)',
            type: data.type,
            lang: data.lang,
            level: data.level,
            wordCount: wordsCount,
            readingTimeMin: Math.max(1, Math.round(wordsCount / 100)),
            isCustom: true,
            sourceNote: 'Văn bản dán riêng tư',
            paragraphs,
          }

          dbCustomTexts.value.unshift(newMaterial)
          return newMaterial
        }
      } catch (err: any) {
        if (handleAuthExpired(err)) throw new Error('Hết phiên đăng nhập')
        console.warn('Lỗi khi lưu user_texts lên Supabase:', err.message)
      }
    }

    // Local fallback
    const targetParagraphs = data.rawTargetText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean)

    const viParagraphs = (data.rawViText || '')
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean)

    const paragraphs: ParagraphItem[] = targetParagraphs.map((text, idx) => ({
      id: `custom-p-${idx + 1}`,
      targetText: text,
      viTranslation: viParagraphs[idx] || 'Chưa có bản dịch mẫu.',
    }))

    const wordsCount = data.rawTargetText.split(/\s+/).length

    const newMaterial: ReadingMaterial = {
      id: `custom-read-${Date.now()}`,
      title: data.title,
      viTitle: data.viTitle || 'Văn bản người học tự dán',
      author: data.author || 'Bạn (Tự nhập)',
      type: data.type,
      lang: data.lang,
      level: data.level,
      wordCount: wordsCount,
      readingTimeMin: Math.max(1, Math.round(wordsCount / 100)),
      isCustom: true,
      sourceNote: 'Văn bản do người dùng dán thủ công để luyện đọc',
      paragraphs,
    }

    localCustomTexts.value.unshift(newMaterial)
    saveCustomTextsLocal()
    return newMaterial
  }

  const deleteCustomText = async (id: string) => {
    const uid = authUser.value?.id

    if (!isUseMock.value && uid && !id.startsWith('custom-read-')) {
      try {
        await client.from('user_texts').delete().eq('id', id).eq('user_id', uid)
      } catch (err: any) {
        console.warn('Lỗi khi xóa user_texts trên Supabase:', err.message)
      }
    }

    dbCustomTexts.value = dbCustomTexts.value.filter(t => t.id !== id)
    localCustomTexts.value = localCustomTexts.value.filter(t => t.id !== id)
    saveCustomTextsLocal()
  }

  // Danh sách hiển thị theo bộ lọc
  const myCustomTexts = computed(() => {
    if (!isUseMock.value && authUser.value?.id) {
      return dbCustomTexts.value
    }
    return localCustomTexts.value
  })

  const filteredMaterials = computed(() => {
    const catalog = !isUseMock.value && dbMaterials.value.length > 0
      ? dbMaterials.value
      : PUBLIC_DOMAIN_READING_LIST.filter(r => r.lang === currentLang.value)

    const list = activeTab.value === 'catalog'
      ? catalog
      : myCustomTexts.value.filter(r => r.lang === currentLang.value)

    return list.filter((item) => {
      const matchType = typeFilter.value === 'all' || item.type === typeFilter.value
      const matchLevel = levelFilter.value === 'all' || item.level.includes(levelFilter.value)
      return matchType && matchLevel
    })
  })

  // Lấy chi tiết 1 bài đọc
  const getMaterialById = (id: string): ReadingMaterial | undefined => {
    const all = [...dbMaterials.value, ...dbCustomTexts.value, ...PUBLIC_DOMAIN_READING_LIST, ...localCustomTexts.value]
    return all.find(r => r.id === id) || all[0]
  }

  // Lưu tiến độ đọc & đoạn đánh dấu (debounce)
  let progressTimer: any = null
  const saveReadingProgress = (
    readingId: string,
    lastReadSection: number,
    bookmarks: string[] = [],
    isCompleted: boolean = false
  ) => {
    const uid = authUser.value?.id
    if (!uid || isUseMock.value) return

    clearTimeout(progressTimer)
    progressTimer = setTimeout(async () => {
      try {
        if (!readingId.startsWith('custom-')) {
          await client.from('user_reading_progress').upsert(
            {
              user_id: uid,
              reading_id: readingId,
              last_read_section: lastReadSection,
              bookmarks: bookmarks as any,
              is_completed: isCompleted,
              last_read_at: new Date().toISOString(),
            },
            { onConflict: 'user_id, reading_id' }
          )

          // Nếu hoàn thành bài đọc, thưởng XP qua RPC award_xp
          if (isCompleted) {
            await client.rpc('award_xp', {
              p_source: 'reading_complete',
              p_ref_id: readingId,
            })
          }
        }
      } catch (err: any) {
        console.warn('Lỗi khi lưu user_reading_progress:', err.message)
      }
    }, 1200)
  }

  // Lưu bản tự dịch của người học vào translation_attempts
  const saveTranslationAttempt = async (sectionId: string, userTranslation: string) => {
    const uid = authUser.value?.id
    if (!uid || isUseMock.value || !userTranslation.trim()) return

    try {
      await client.from('translation_attempts').insert({
        user_id: uid,
        section_id: sectionId,
        user_translation: userTranslation,
      })
    } catch (err: any) {
      console.warn('Lỗi khi lưu bản tự dịch:', err.message)
    }
  }

  return {
    activeTab,
    typeFilter,
    levelFilter,
    filteredMaterials,
    myCustomTexts,
    isLoading,
    errorMessage,
    fetchReadingData,
    addCustomText,
    deleteCustomText,
    getMaterialById,
    saveReadingProgress,
    saveTranslationAttempt,
  }
}
