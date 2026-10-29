import type { LearningLanguage } from './useLanguage'
import type { Database } from '~/types/database.types'
import { translateSupabaseError, handleAuthExpired } from '~/utils/supabaseErrors'
import {
  MockDictionaryProvider,
  SupabaseDictionaryProvider,
  type DictionaryEntry,
  type DictionaryProvider,
} from './dictionary/provider'

export interface VocabRoadmapQuestion {
  id: string
  prompt: string
  word: string
  options: string[]
  correctIndex: number
  explanation: string
}
/** Alias for backward compatibility */
export type DuolingoQuestion = VocabRoadmapQuestion

export interface VocabRoadmapNode {
  id: string
  level: string
  title: string
  topic: string
  status: 'completed' | 'active' | 'locked'
  icon: string
  xpReward: number
  questions: VocabRoadmapQuestion[]
}
/** Alias for backward compatibility */
export type DuolingoNode = VocabRoadmapNode

// Lộ trình học từ vựng theo chặng trực quan theo ngôn ngữ
export const VOCAB_ROADMAP: Record<LearningLanguage, VocabRoadmapNode[]> = {
  en: [
    {
      id: 'duo-en-1',
      level: 'A1',
      title: 'Chào hỏi & Bản thân',
      topic: 'Greetings & Personal Bio',
      status: 'completed',
      icon: 'Smile',
      xpReward: 20,
      questions: [
        {
          id: 'q1',
          prompt: 'Từ nào đồng nghĩa với "Delighted" trong lời chào trang trọng?',
          word: 'Delighted',
          options: ['Angry', 'Pleased / Very happy', 'Exhausted', 'Confused'],
          correctIndex: 1,
          explanation: '"Delighted" mang nghĩa rất vui mừng, hân hạnh (I am delighted to meet you).',
        },
        {
          id: 'q2',
          prompt: 'Chọn từ diễn đạt "quê hương / nơi sinh ra":',
          word: 'Hometown',
          options: ['Workplace', 'Hometown', 'Downtown', 'Suburbs'],
          correctIndex: 1,
          explanation: '"Hometown" là quê hương, quê quán sinh ra.',
        },
      ],
    },
    {
      id: 'duo-en-2',
      level: 'A2',
      title: 'Ẩm thực & Nhà hàng',
      topic: 'Food & Dining Out',
      status: 'active',
      icon: 'Utensils',
      xpReward: 25,
      questions: [
        {
          id: 'q3',
          prompt: 'Nghĩa của từ "Appetizer" trong thực đơn là gì?',
          word: 'Appetizer',
          options: ['Món tráng miệng', 'Món khai vị', 'Món chính', 'Đồ uống có cồn'],
          correctIndex: 1,
          explanation: '"Appetizer" là món khai vị trước bữa ăn chính.',
        },
        {
          id: 'q4',
          prompt: 'Khi muốn nói nước lọc không có ga, ta dùng từ nào?',
          word: 'Still water',
          options: ['Sparkling water', 'Tap water', 'Still water', 'Soda water'],
          correctIndex: 2,
          explanation: '"Still water" là nước lọc tĩnh không ga, ngược với "sparkling water".',
        },
      ],
    },
    {
      id: 'duo-en-3',
      level: 'B1',
      title: 'Mua sắm & Tài chính',
      topic: 'Shopping & Budgeting',
      status: 'locked',
      icon: 'ShoppingBag',
      xpReward: 30,
      questions: [
        {
          id: 'q5',
          prompt: 'Từ "Affordable" mang nghĩa là gì?',
          word: 'Affordable',
          options: ['Quá xa xỉ', 'Giá cả phải chăng, vừa túi tiền', 'Hàng kém chất lượng', 'Miễn phí hoàn toàn'],
          correctIndex: 1,
          explanation: '"Affordable" có nghĩa là giá cả hợp lý, có thể chi trả được.',
        },
      ],
    },
    {
      id: 'duo-en-4',
      level: 'B2',
      title: 'Công sở & Đàm phán',
      topic: 'Business & Meetings',
      status: 'locked',
      icon: 'Briefcase',
      xpReward: 35,
      questions: [
        {
          id: 'q6',
          prompt: 'Từ "Consensus" trong cuộc họp chỉ điều gì?',
          word: 'Consensus',
          options: ['Sự chia rẽ ý kiến', 'Sự đồng thuận của tập thể', 'Biên bản cuộc họp', 'Lịch trình công tác'],
          correctIndex: 1,
          explanation: '"Consensus" là sự nhất trí, đồng thuận chung giữa các bên.',
        },
      ],
    },
    {
      id: 'duo-en-5',
      level: 'C1',
      title: 'Tư duy học thuật & Phản biện',
      topic: 'Academic Debate',
      status: 'locked',
      icon: 'GraduationCap',
      xpReward: 40,
      questions: [
        {
          id: 'q7',
          prompt: 'Từ "Pragmatic" có ý nghĩa chính là gì?',
          word: 'Pragmatic',
          options: ['Lý thuyết suông', 'Thực tế, thực dụng và khả thi', 'Mơ mộng xa vời', 'Bảo thủ'],
          correctIndex: 1,
          explanation: '"Pragmatic" nghĩa là dựa vào thực tế khách quan thay vì giả thuyết.',
        },
      ],
    },
  ],
  zh: [
    {
      id: 'duo-zh-1',
      level: 'HSK 1',
      title: 'Nhập môn & Chào hỏi',
      topic: '问候与数字',
      status: 'completed',
      icon: 'Smile',
      xpReward: 20,
      questions: [
        {
          id: 'q-zh-1',
          prompt: 'Chọn từ mang nghĩa "Rất vui được gặp bạn":',
          word: '很高兴认识你',
          options: ['对不起', '很高兴认识你', '没关系', '明天见'],
          correctIndex: 1,
          explanation: '"很高兴认识你" (Hěn gāoxìng rènshí nǐ) nghĩa là Rất vui được quen biết bạn.',
        },
      ],
    },
    {
      id: 'duo-zh-2',
      level: 'HSK 2',
      title: 'Mua sắm & Trả giá',
      topic: '买东西与价格',
      status: 'active',
      icon: 'ShoppingBag',
      xpReward: 25,
      questions: [
        {
          id: 'q-zh-2',
          prompt: 'Từ "便宜" (piányi) mang nghĩa là gì?',
          word: '便宜',
          options: ['Đắt đỏ', 'Rẻ, giá cả hợp lý', 'Đẹp mắt', 'Ngon miệng'],
          correctIndex: 1,
          explanation: '"便宜" nghĩa là rẻ, tính từ trái nghĩa với "贵" (đắt).',
        },
      ],
    },
  ],
  ja: [
    {
      id: 'duo-ja-1',
      level: 'N5',
      title: 'Chào hỏi & Gia đình',
      topic: 'あいさつと家族',
      status: 'completed',
      icon: 'Smile',
      xpReward: 20,
      questions: [
        {
          id: 'q-ja-1',
          prompt: 'Lời chào khi gặp ai đó lần đầu tiên là gì?',
          word: '初めまして',
          options: ['さようなら', '初めまして', 'お疲れ様', 'すみません'],
          correctIndex: 1,
          explanation: '"初めまして" (Hajimemashite) nghĩa là Rất vui được gặp bạn lần đầu.',
        },
      ],
    },
    {
      id: 'duo-ja-2',
      level: 'N4',
      title: 'Nhà hàng & Gọi món',
      topic: 'レストランで注文',
      status: 'active',
      icon: 'Utensils',
      xpReward: 25,
      questions: [
        {
          id: 'q-ja-2',
          prompt: 'Từ "お会計" (O-kaikei) dùng khi nào?',
          word: 'お会計',
          options: ['Khi gọi món khai vị', 'Khi yêu cầu thanh toán hoá đơn', 'Khi xin thêm nước', 'Khi vào quán'],
          correctIndex: 1,
          explanation: '"お会計" (O-kaikei) nghĩa là thanh toán tiền trong nhà hàng Nhật.',
        },
      ],
    },
  ],
}

/** Backward compatibility alias */
export const DUOLINGO_VOCAB_ROADMAP = VOCAB_ROADMAP

export const useDictionary = (targetLang?: Ref<LearningLanguage>) => {
  const currentLang = targetLang || ref<LearningLanguage>('en')
  const client = useSupabaseClient<Database>()
  const authUser = useSupabaseUser()
  const config = useRuntimeConfig()

  // Chọn Provider: Đọc trực tiếp từ bảng dictionary_entries của Supabase
  const provider: DictionaryProvider = new SupabaseDictionaryProvider(client)

  // State tra từ
  const searchQuery = ref('')
  const searchSuggestions = ref<string[]>([])
  const isSearching = ref(false)

  // Cập nhật gợi ý khi gõ
  const updateSuggestions = async (query: string) => {
    if (!query.trim()) {
      searchSuggestions.value = []
      return
    }
    searchSuggestions.value = await provider.suggest(query, currentLang.value)
  }

  // Tra cứu chi tiết
  const lookupWord = async (word: string): Promise<DictionaryEntry | null> => {
    return await provider.lookup(word, currentLang.value)
  }

  // Lịch sử tra cứu
  const searchHistory = ref<string[]>([])

  onMounted(() => {
    if (import.meta.client) {
      const saved = localStorage.getItem('langua_dict_history')
      if (saved) {
        try {
          searchHistory.value = JSON.parse(saved)
        } catch {
          searchHistory.value = []
        }
      }
    }
  })

  const saveToHistory = (term: string) => {
    if (!term.trim()) return
    const list = [term, ...searchHistory.value.filter(t => t.toLowerCase() !== term.toLowerCase())].slice(0, 8)
    searchHistory.value = list
    if (import.meta.client) {
      localStorage.setItem('langua_dict_history', JSON.stringify(list))
    }
  }

  const clearHistory = () => {
    searchHistory.value = []
    if (import.meta.client) {
      localStorage.removeItem('langua_dict_history')
    }
  }

  // ==========================================
  // LỘ TRÌNH HỌC TỪ VỰNG THEO CHẶNG TRỰC QUAN
  // ==========================================
  const duoRoadmap = computed(() => VOCAB_ROADMAP[currentLang.value] || VOCAB_ROADMAP.en)
  const hearts = ref(5)
  const streak = ref(4)
  const totalXp = ref(380)

  // Hoàn thành bài học theo chặng và đồng bộ RPC complete_stage
  const completeDuoNode = async (nodeId: string, xpReward: number) => {
    const node = duoRoadmap.value.find(n => n.id === nodeId)
    if (node) {
      node.status = 'completed'
      totalXp.value += xpReward

      // Mở chặng kế tiếp
      const idx = duoRoadmap.value.findIndex(n => n.id === nodeId)
      if (idx !== -1 && idx < duoRoadmap.value.length - 1) {
        duoRoadmap.value[idx + 1].status = 'active'
      }

      // Gọi RPC complete_stage trên server để nhận XP an toàn
      const uid = authUser.value?.id
      if (uid) {
        try {
          await client.rpc('complete_stage', { p_stage_id: nodeId })
        } catch (err: any) {
          console.warn('Lỗi gọi RPC complete_stage:', err.message)
        }
      }
    }
  }

  const loseHeart = () => {
    if (hearts.value > 0) hearts.value -= 1
  }

  const refillHearts = () => {
    hearts.value = 5
  }

  return {
    providerName: provider.providerName,
    searchQuery,
    searchSuggestions,
    searchHistory,
    isSearching,
    updateSuggestions,
    lookupWord,
    saveToHistory,
    clearHistory,
    duoRoadmap,
    hearts,
    streak,
    totalXp,
    completeDuoNode,
    loseHeart,
    refillHearts,
  }
}
