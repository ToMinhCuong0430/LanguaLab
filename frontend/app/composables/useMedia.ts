import type { LearningLanguage } from './useLanguage'
import { parseSubtitles, extractYouTubeId } from '~/utils/subtitleParser'
import type { Database } from '~/types/database.types'
import { translateSupabaseError, handleAuthExpired } from '~/utils/supabaseErrors'
import { BRAND_NAME } from '~/constants/brand'

export interface SubtitleItem {
  id: string
  start: number // Giây
  end: number   // Giây
  text: string
  vi: string
  vocabHints?: Array<{ word: string; meaning: string }>
}

export interface QuizQuestion {
  id: string
  segmentTime: number
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface MediaContent {
  id: string
  title: string
  viTitle: string
  speaker: string
  lang: LearningLanguage
  type: 'video' | 'podcast'
  level: string
  category: 'tech' | 'life' | 'culture' | 'news'
  durationSec: number
  youtubeId?: string
  audioUrl?: string
  isCustom?: boolean
  subtitles: SubtitleItem[]
  quiz?: QuizQuestion[]
}

// Mock các nội dung video và podcast tuyển chọn
export const CURATED_MEDIA_LIST: MediaContent[] = [
  // ========== TIẾNG ANH ==========
  {
    id: 'media-en-ted-memory',
    title: 'How Memories Form and How We Lose Them',
    viTitle: 'Ký ức được hình thành và mất đi như thế nào trong não bộ',
    speaker: 'TED-Ed • Catharine Young',
    lang: 'en',
    type: 'video',
    level: 'B1 - B2',
    category: 'tech',
    durationSec: 154,
    // youtubeId được để trống để PreviewThumb rơi về minh hoạ phẳng dự phòng
    subtitles: [
      {
        id: 'sub-en-1',
        start: 0,
        end: 8,
        text: 'Imagine your brain as a vast library filled with millions of complex memories.',
        vi: 'Hãy tưởng tượng bộ não của bạn như một thư viện khổng lồ chứa hàng triệu ký ức phức tạp.',
        vocabHints: [
          { word: 'vast', meaning: 'Bao la, rộng lớn khổng lồ' },
          { word: 'complex', meaning: 'Phức tạp, nhiều tầng lớp' },
        ],
      },
      {
        id: 'sub-en-2',
        start: 8,
        end: 17,
        text: 'Memories are encoded by networks of neurons firing in specific synchronous patterns.',
        vi: 'Ký ức được mã hoá bởi các mạng lưới tế bào thần kinh kích hoạt theo những mô thức đồng bộ cụ thể.',
        vocabHints: [
          { word: 'encoded', meaning: 'Được mã hoá, lưu trữ' },
          { word: 'synchronous', meaning: 'Đồng bộ, cùng lúc' },
        ],
      },
      {
        id: 'sub-en-3',
        start: 17,
        end: 27,
        text: 'Short-term memory holds information temporarily, like a scratchpad for immediate calculations.',
        vi: 'Trí nhớ ngắn hạn lưu giữ thông tin tạm thời, tựa như một cuốn sổ nháp cho những phép tính tức thì.',
        vocabHints: [
          { word: 'temporarily', meaning: 'Tạm thời, ngắn hạn' },
          { word: 'scratchpad', meaning: 'Sổ nháp ghi nhanh' },
        ],
      },
      {
        id: 'sub-en-4',
        start: 27,
        end: 38,
        text: 'To convert this into long-term memory, the brain undergoes a biochemical process called consolidation.',
        vi: 'Để chuyển đổi điều này thành trí nhớ dài hạn, não bộ trải qua một quá trình sinh hoá gọi là sự củng cố ký ức.',
        vocabHints: [
          { word: 'consolidation', meaning: 'Sự củng cố, làm bền vững' },
          { word: 'undergoes', meaning: 'Trải qua, chịu sự biến đổi' },
        ],
      },
      {
        id: 'sub-en-5',
        start: 38,
        end: 50,
        text: 'During sleep, the hippocampus replays these events to strengthen the synaptic connections.',
        vi: 'Trong giấc ngủ, hồi hải mã tái phát lại các sự kiện này nhằm củng cố các liên kết synap thần kinh.',
        vocabHints: [
          { word: 'hippocampus', meaning: 'Hồi hải mã (vùng não lưu giữ ký ức)' },
          { word: 'strengthen', meaning: 'Làm mạnh thêm, củng cố' },
        ],
      },
    ],
    quiz: [
      {
        id: 'q1',
        segmentTime: 8,
        question: 'Ký ức được mã hoá trong não bộ nhờ cơ chế nào?',
        options: [
          'Nhờ sự lưu trữ tĩnh của các tế bào mỡ',
          'Mạng lưới neuron kích hoạt theo mô thức đồng bộ',
          'Thông qua việc ghi chép trực tiếp vào võng mạc',
          'Não bộ không tự mã hoá mà phụ thuộc vào âm thanh',
        ],
        correctIndex: 1,
        explanation: 'Đoạn thoại nêu rõ: "Memories are encoded by networks of neurons firing in specific synchronous patterns".',
      },
      {
        id: 'q2',
        segmentTime: 38,
        question: 'Não bộ củng cố ký ức dài hạn chủ yếu vào thời điểm nào?',
        options: [
          'Khi đang tập thể dục thể thao cường độ cao',
          'Trong giấc ngủ nhờ hoạt động của vùng hồi hải mã',
          'Ngay lập tức sau khi uống cà phê',
          'Vào buổi sáng sớm trước khi ăn sáng',
        ],
        correctIndex: 1,
        explanation: 'Đoạn thoại chỉ ra: "During sleep, the hippocampus replays these events to strengthen synaptic connections".',
      },
    ],
  },
  {
    id: 'media-en-bbc-habit',
    title: '6 Minute English: Breaking Bad Habits',
    viTitle: 'Bản tin 6 phút tiếng Anh: Cách từ bỏ những thói quen xấu',
    speaker: 'BBC Learning English',
    lang: 'en',
    type: 'podcast',
    level: 'B1 - B2',
    category: 'life',
    durationSec: 180,
    // youtubeId được để trống để PreviewThumb rơi về minh hoạ phẳng dự phòng
    subtitles: [
      {
        id: 'sub-bbc-1',
        start: 0,
        end: 9,
        text: 'Hello and welcome to 6 Minute English from BBC Learning English. I am Neil.',
        vi: 'Xin chào và chào mừng bạn đến với 6 Minute English của BBC Learning English. Tôi là Neil.',
      },
      {
        id: 'sub-bbc-2',
        start: 9,
        end: 19,
        text: 'And I am Sam. Today we are talking about habits, particularly those annoying habits we want to kick.',
        vi: 'Và tôi là Sam. Hôm nay chúng ta sẽ thảo luận về thói quen, đặc biệt là những thói quen phiền toái mà ta muốn từ bỏ.',
        vocabHints: [
          { word: 'annoying', meaning: 'Gây phiền toái, bực mình' },
          { word: 'kick', meaning: 'Từ bỏ, dứt bỏ (thói quen xấu)' },
        ],
      },
      {
        id: 'sub-bbc-3',
        start: 19,
        end: 32,
        text: 'Psychologists suggest that habits form a neurological loop: cue, routine, and reward.',
        vi: 'Các nhà tâm lý học chỉ ra rằng thói quen hình thành một vòng lặp thần kinh: gợi ý, hành vi và phần thưởng.',
        vocabHints: [
          { word: 'neurological loop', meaning: 'Vòng lặp dẫn truyền thần kinh' },
          { word: 'cue', meaning: 'Tín hiệu gợi nhắc, kích hoạt' },
        ],
      },
      {
        id: 'sub-bbc-4',
        start: 32,
        end: 45,
        text: 'To replace an unhealthy routine, you must first identify the underlying trigger.',
        vi: 'Để thay thế một hành vi không lành mạnh, trước tiên bạn phải xác định được tác nhân kích hoạt ẩn sâu bên dưới.',
        vocabHints: [
          { word: 'replace', meaning: 'Thay thế, hoán đổi' },
          { word: 'trigger', meaning: 'Tác nhân kích hoạt phản xạ' },
        ],
      },
    ],
    quiz: [
      {
        id: 'q-bbc-1',
        segmentTime: 19,
        question: 'Vòng lặp thói quen thần kinh bao gồm 3 yếu tố nào?',
        options: [
          'Mục tiêu, Kế hoạch và Thành công',
          'Tín hiệu (Cue), Hành vi (Routine) và Phần thưởng (Reward)',
          'Suy nghĩ, Cảm xúc và Hành động',
          'Bắt đầu, Thử thách và Kết thúc',
        ],
        correctIndex: 1,
        explanation: 'Bài nói chỉ rõ: "habits form a neurological loop: cue, routine, and reward".',
      },
    ],
  },

  // ========== TIẾNG TRUNG ==========
  {
    id: 'media-zh-tea-culture',
    title: '中国传统茶艺与慢生活哲学',
    viTitle: 'Nghệ thuật trà đạo truyền thống Trung Hoa và triết lý sống an nhiên',
    speaker: 'CCTV 纪录片',
    lang: 'zh',
    type: 'video',
    level: 'HSK 3 - 4',
    category: 'culture',
    durationSec: 160,
    // youtubeId được để trống để PreviewThumb rơi về minh hoạ phẳng dự phòng
    subtitles: [
      {
        id: 'sub-zh-1',
        start: 0,
        end: 8,
        text: '茶在中国不仅是一种日常饮品，更是千年文化的传承。',
        vi: 'Trà ở Trung Quốc không chỉ là thức uống thường ngày, mà còn là sự kế thừa văn hoá ngàn năm.',
        vocabHints: [
          { word: '饮品', meaning: 'Đồ uống, thức uống' },
          { word: '传承', meaning: 'Kế thừa, lưu truyền' },
        ],
      },
      {
        id: 'sub-zh-2',
        start: 8,
        end: 18,
        text: '泡好一壶清茶，需要心平气和与恰到好处的水温。',
        vi: 'Pha được một ấm trà ngon cần sự tâm bình khí hoà và nhiệt độ nước vừa vặn.',
        vocabHints: [
          { word: '心平气和', meaning: 'Tâm bình khí hoà, điềm tĩnh' },
          { word: '水温', meaning: 'Nhiệt độ của nước' },
        ],
      },
      {
        id: 'sub-zh-3',
        start: 18,
        end: 30,
        text: '品茶的过程教会人们在快节奏的生活中停下脚步，感受宁静。',
        vi: 'Quá trình thưởng trà dạy con người dừng bước giữa nhịp sống hối hả để cảm nhận sự tĩnh lặng.',
        vocabHints: [
          { word: '快节奏', meaning: 'Nhịp sống nhanh, hối hả' },
          { word: '宁静', meaning: 'Tĩnh lặng, an yên' },
        ],
      },
    ],
  },

  // ========== TIẾNG NHẬT ==========
  {
    id: 'media-ja-daily-routine',
    title: '日本の朝のルーティンと自然な挨拶',
    viTitle: 'Thói quen buổi sáng tại Nhật Bản và cách chào hỏi tự nhiên',
    speaker: 'Nihongo no Mori Channel',
    lang: 'ja',
    type: 'video',
    level: 'JLPT N4 - N3',
    category: 'life',
    durationSec: 150,
    // youtubeId được để trống để PreviewThumb rơi về minh hoạ phẳng dự phòng
    subtitles: [
      {
        id: 'sub-ja-1',
        start: 0,
        end: 8,
        text: '皆さん、おはようございます！今日も清々しい朝ですね。',
        vi: 'Chào buổi sáng mọi người! Hôm nay quả là một buổi sáng trong lành sảng khoái.',
        vocabHints: [
          { word: '清々しい', meaning: 'Trong lành, tươi mát sảng khoái' },
        ],
      },
      {
        id: 'sub-ja-2',
        start: 8,
        end: 18,
        text: '朝起きたら、まずコップ一杯の白湯を飲むのが私のルーティンです。',
        vi: 'Sau khi thức dậy vào buổi sáng, thói quen của tôi là uống một cốc nước ấm trước tiên.',
        vocabHints: [
          { word: '白湯', meaning: 'Nước ấm đun sôi để nguội' },
          { word: 'ルーティン', meaning: 'Thói quen định kỳ hàng ngày' },
        ],
      },
      {
        id: 'sub-ja-3',
        start: 18,
        end: 30,
        text: '近所の人に笑顔で「いってきます」と声をかけると、気持ちよく一日が始まります。',
        vi: 'Khi mỉm cười chào "Tôi đi đây nhé" với hàng xóm, ngày mới sẽ bắt đầu thật dễ chịu.',
        vocabHints: [
          { word: '近所', meaning: 'Hàng xóm láng giềng gần nhà' },
        ],
      },
    ],
  },
]

export const useMedia = (targetLang?: Ref<LearningLanguage>) => {
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

  // Filters
  const activeTab = ref<'explore' | 'my_videos'>('explore')
  const typeFilter = ref<'all' | 'video' | 'podcast'>('all')
  const categoryFilter = ref<'all' | 'tech' | 'life' | 'culture' | 'news'>('all')
  const levelFilter = ref<string>('all')

  const isLoading = ref(false)
  const errorMessage = ref<string | null>(null)

  // Dữ liệu từ Supabase
  const dbCuratedMedia = ref<MediaContent[]>([])
  const dbCustomVideos = ref<MediaContent[]>([])
  const localCustomVideos = ref<MediaContent[]>([])

  // Tải Media từ Supabase
  const fetchMediaData = async () => {
    if (isUseMock.value) return

    isLoading.value = true
    errorMessage.value = null

    try {
      const uid = authUser.value?.id

      // 1. Tải kho nội dung chung (chỉ lấy is_published = true)
      const { data: mediaRows, error: mediaErr } = await client
        .from('media_items')
        .select('*, media_cues(*), media_quiz_questions(*)')
        .eq('is_published', true)
        .eq('language', currentLang.value)
        .order('created_at', { ascending: false })

      if (mediaErr) throw mediaErr

      if (mediaRows) {
        dbCuratedMedia.value = mediaRows.map((m: any) => {
          const sortedCues = (m.media_cues || []).sort(
            (a: any, b: any) => (a.start_ms || 0) - (b.start_ms || 0)
          )
          return {
            id: m.id,
            title: m.title,
            viTitle: m.vietnamese_title || m.title,
            speaker: m.speaker || `${BRAND_NAME} Media`,
            lang: m.language as LearningLanguage,
            type: m.media_type as 'video' | 'podcast',
            level: m.level,
            category: (m.topic as any) || 'life',
            durationSec: m.duration_seconds || 120,
            youtubeId: m.provider === 'youtube' ? m.source_url : undefined,
            audioUrl: m.provider === 'upload' ? m.source_url : undefined,
            isCustom: false,
            subtitles: sortedCues.map((c: any) => ({
              id: c.id,
              start: (c.start_ms || 0) / 1000,
              end: (c.end_ms || 0) / 1000,
              text: c.text,
              vi: c.translation_vi || '',
              vocabHints: Array.isArray(c.vocab_hints) ? c.vocab_hints : [],
            })),
            quiz: (m.media_quiz_questions || []).map((q: any) => ({
              id: q.id,
              segmentTime: q.segment_time_sec || 0,
              question: q.question,
              options: Array.isArray(q.options) ? q.options : [],
              correctIndex: q.correct_index,
              explanation: q.explanation || '',
            })),
          }
        })
      }

      // 2. Tải Video của tôi (user_videos & user_video_cues)
      if (uid) {
        const { data: userVids, error: userVidsErr } = await client
          .from('user_videos')
          .select('*, user_video_cues(*)')
          .eq('user_id', uid)
          .eq('language', currentLang.value)
          .order('created_at', { ascending: false })

        if (userVidsErr) throw userVidsErr

        if (userVids) {
          dbCustomVideos.value = userVids.map((v: any) => {
            const cues = (v.user_video_cues || []).sort(
              (a: any, b: any) => (a.start_ms || 0) - (b.start_ms || 0)
            )
            return {
              id: v.id,
              title: v.title,
              viTitle: 'Video cá nhân của bạn',
              speaker: 'YouTube Creator',
              lang: v.language as LearningLanguage,
              type: 'video',
              level: 'Tùy chọn',
              category: 'life',
              durationSec: cues.length > 0 ? Math.round((cues[cues.length - 1].end_ms || 0) / 1000) : 180,
              youtubeId: v.youtube_id,
              isCustom: true,
              subtitles: cues.map((c: any) => ({
                id: c.id,
                start: (c.start_ms || 0) / 1000,
                end: (c.end_ms || 0) / 1000,
                text: c.text,
                vi: c.translation_vi || '',
              })),
            }
          })
        }
      }
    } catch (err: any) {
      if (handleAuthExpired(err)) return
      errorMessage.value = translateSupabaseError(err)
      console.warn('Lỗi khi tải media từ Supabase, dùng mock fallback:', err.message)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      const saved = localStorage.getItem('langua_my_custom_videos')
      if (saved) {
        try {
          localCustomVideos.value = JSON.parse(saved)
        } catch {
          localCustomVideos.value = []
        }
      }
    }
    fetchMediaData()
  })

  watch(currentLang, () => {
    fetchMediaData()
  })

  const saveCustomVideosLocal = () => {
    if (import.meta.client) {
      localStorage.setItem('langua_my_custom_videos', JSON.stringify(localCustomVideos.value))
    }
  }

  // Thêm Video của tôi (kiểm tra YouTube ID, phụ đề, giới hạn file và 1000 dòng)
  const addCustomVideo = async (data: {
    title: string
    viTitle?: string
    youtubeUrl: string
    subtitlesContent: string
    lang: LearningLanguage
    level: string
    category: 'tech' | 'life' | 'culture' | 'news'
  }) => {
    // 1. Kiểm tra link YouTube hợp lệ
    const yId = extractYouTubeId(data.youtubeUrl)
    if (!yId) throw new Error('Đường dẫn YouTube không hợp lệ. Vui lòng dán link dạng https://www.youtube.com/watch?v=...')

    // 2. Giới hạn dung lượng chuỗi phụ đề (tối đa 2MB)
    if (data.subtitlesContent.length > 2 * 1024 * 1024) {
      throw new Error('Tệp phụ đề vượt quá kích thước cho phép (tối đa 2MB).')
    }

    // 3. Phân tích nội dung phụ đề
    const parsedSubs = parseSubtitles(data.subtitlesContent)
    if (parsedSubs.length > 1000) {
      throw new Error('Tệp phụ đề có hơn 1000 dòng. Vui lòng rút gọn để không vượt hạn mức hệ thống.')
    }

    if (parsedSubs.length === 0) {
      parsedSubs.push({
        id: 'sub-1',
        start: 0,
        end: 10,
        text: 'Nội dung video YouTube.',
        vi: 'Phụ đề mẫu.',
      })
    }

    const uid = authUser.value?.id

    // 4. Lưu vào Supabase nếu đã đăng nhập và không dùng mock
    if (!isUseMock.value && uid) {
      try {
        // Lưu user_videos
        const { data: vidRow, error: vidErr } = await client
          .from('user_videos')
          .insert({
            user_id: uid,
            youtube_url: data.youtubeUrl,
            youtube_id: yId,
            title: data.title,
            language: data.lang,
          })
          .select()
          .single()

        if (vidErr) throw vidErr

        // Lưu user_video_cues
        if (vidRow && parsedSubs.length > 0) {
          const cueRows = parsedSubs.map((s, idx) => ({
            user_video_id: vidRow.id,
            user_id: uid,
            start_ms: Math.round(s.start * 1000),
            end_ms: Math.round(s.end * 1000),
            text: s.text.slice(0, 500),
            translation_vi: (s.vi || '').slice(0, 500),
            sort_order: idx,
          }))

          const { error: cueErr } = await client.from('user_video_cues').insert(cueRows)
          if (cueErr) throw cueErr
        }

        const newMedia: MediaContent = {
          id: vidRow.id,
          title: vidRow.title,
          viTitle: data.viTitle || 'Video của bạn',
          speaker: 'YouTube Creator',
          lang: data.lang,
          type: 'video',
          level: data.level,
          category: data.category,
          durationSec: Math.round(parsedSubs[parsedSubs.length - 1].end) || 120,
          youtubeId: yId,
          isCustom: true,
          subtitles: parsedSubs,
        }

        dbCustomVideos.value.unshift(newMedia)
        return newMedia
      } catch (err: any) {
        if (handleAuthExpired(err)) throw new Error('Hết phiên đăng nhập')
        throw new Error(translateSupabaseError(err))
      }
    }

    // Local fallback
    const newVideo: MediaContent = {
      id: `custom-video-${Date.now()}`,
      title: data.title,
      viTitle: data.viTitle || 'Video do bạn thêm',
      speaker: 'YouTube Creator',
      lang: data.lang,
      type: 'video',
      level: data.level,
      category: data.category,
      durationSec: Math.round(parsedSubs[parsedSubs.length - 1].end) || 120,
      youtubeId: yId,
      isCustom: true,
      subtitles: parsedSubs,
    }

    localCustomVideos.value.unshift(newVideo)
    saveCustomVideosLocal()
    return newVideo
  }

  const deleteCustomVideo = async (id: string) => {
    const uid = authUser.value?.id

    if (!isUseMock.value && uid && !id.startsWith('custom-video-')) {
      try {
        await client.from('user_videos').delete().eq('id', id).eq('user_id', uid)
      } catch (err: any) {
        console.warn('Lỗi khi xóa video trên Supabase:', err.message)
      }
    }

    dbCustomVideos.value = dbCustomVideos.value.filter(v => v.id !== id)
    localCustomVideos.value = localCustomVideos.value.filter(v => v.id !== id)
    saveCustomVideosLocal()
  }

  // Danh sách video của tôi
  const myCustomVideos = computed(() => {
    if (!isUseMock.value && authUser.value?.id) {
      return dbCustomVideos.value
    }
    return localCustomVideos.value
  })

  // Danh sách video hiển thị theo filter
  const filteredMediaList = computed(() => {
    const curated = !isUseMock.value && dbCuratedMedia.value.length > 0
      ? dbCuratedMedia.value
      : CURATED_MEDIA_LIST.filter(m => m.lang === currentLang.value)

    const list = activeTab.value === 'explore'
      ? curated
      : myCustomVideos.value.filter(m => m.lang === currentLang.value)

    return list.filter((item) => {
      const matchType = typeFilter.value === 'all' || item.type === typeFilter.value
      const matchCat = categoryFilter.value === 'all' || item.category === categoryFilter.value
      const matchLevel = levelFilter.value === 'all' || item.level.includes(levelFilter.value)
      return matchType && matchCat && matchLevel
    })
  })

  // Tìm video theo ID
  const getMediaById = (id: string): MediaContent | undefined => {
    const all = [...dbCuratedMedia.value, ...dbCustomVideos.value, ...CURATED_MEDIA_LIST, ...localCustomVideos.value]
    return all.find(m => m.id === id) || all[0]
  }

  // Lưu tiến độ xem và điểm các chế độ vào user_media_progress (lưu định kỳ / debounce)
  let saveTimer: any = null
  const saveMediaProgress = (
    mediaId: string,
    watchPositionMs: number,
    isCompleted: boolean = false,
    dictationScore?: number,
    shadowingScore?: number,
    quizScore?: number
  ) => {
    const uid = authUser.value?.id
    if (!uid || isUseMock.value) return

    clearTimeout(saveTimer)
    saveTimer = setTimeout(async () => {
      try {
        // Chỉ lưu tiến độ với media_items có sẵn trong bảng media_items
        if (!mediaId.startsWith('custom-')) {
          await client.from('user_media_progress').upsert(
            {
              user_id: uid,
              media_id: mediaId,
              watch_position_ms: Math.round(watchPositionMs),
              is_completed: isCompleted,
              dictation_score: dictationScore !== undefined ? dictationScore : null,
              shadowing_score: shadowingScore !== undefined ? shadowingScore : null,
              quiz_score: quizScore !== undefined ? quizScore : null,
              last_watched_at: new Date().toISOString(),
            },
            { onConflict: 'user_id, media_id' }
          )

          // Nếu hoàn thành, cộng XP qua RPC award_xp
          if (isCompleted) {
            await client.rpc('award_xp', {
              p_source: 'media_dictation',
              p_ref_id: mediaId,
            })
          }
        }
      } catch (err: any) {
        console.warn('Lỗi khi lưu user_media_progress:', err.message)
      }
    }, 1500)
  }

  // Lưu từ vựng nhanh vào user_saved_words và localStorage
  const saveVocabToMySet = async (word: string, meaning: string, mediaId?: string) => {
    const uid = authUser.value?.id

    if (!isUseMock.value && uid) {
      try {
        await client.from('user_saved_words').upsert(
          {
            user_id: uid,
            word,
            meaning,
            source_type: 'video',
            source_ref: mediaId || null,
          },
          { onConflict: 'user_id, word, source_type, source_ref' }
        )
      } catch (err: any) {
        console.warn('Lỗi lưu từ vào user_saved_words:', err.message)
      }
    }

    if (!import.meta.client) return false
    const savedSets = localStorage.getItem('langua_my_vocab_sets')
    let sets = savedSets ? JSON.parse(savedSets) : []
    if (sets.length === 0) {
      sets.push({
        id: `custom-set-${Date.now()}`,
        title: 'Từ vựng lưu từ Video & Podcast',
        description: 'Các từ vựng hay được lưu khi xem video',
        level: 'B1',
        lang: currentLang.value,
        isCustom: true,
        words: [],
      })
    }

    sets[0].words.push({
      id: `w-${Date.now()}`,
      term: word,
      phonetic: `/${word}/`,
      partOfSpeech: 'vocab',
      meaning,
      exampleTarget: `Saved from video practice.`,
      exampleMeaning: `Được lưu khi luyện nghe video.`,
      srsState: 'new',
    })

    localStorage.setItem('langua_my_vocab_sets', JSON.stringify(sets))
    return true
  }

  return {
    activeTab,
    typeFilter,
    categoryFilter,
    levelFilter,
    filteredMediaList,
    myCustomVideos,
    isLoading,
    errorMessage,
    fetchMediaData,
    getMediaById,
    addCustomVideo,
    deleteCustomVideo,
    saveMediaProgress,
    saveVocabToMySet,
  }
}
