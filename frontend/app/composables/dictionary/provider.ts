import type { LearningLanguage } from '../useLanguage'

export interface DictionaryDefinition {
  index: number
  meaning: string
  examples: {
    target: string
    vi: string
  }[]
}

export interface DictionarySense {
  partOfSpeech: string // Noun, Verb, Adjective, etc.
  definitions: DictionaryDefinition[]
}

export interface DictionaryEntry {
  word: string
  lang: LearningLanguage
  phonetic: string
  audioUrl?: string
  frequency?: 'High' | 'Medium' | 'Academic'
  etymology?: string
  senses: DictionarySense[]
  collocations: string[]
  synonyms: string[]
  antonyms: string[]
  sourceProvider: string
}

/**
 * =========================================================================
 * KIẾN TRÚC TRỪU TƯỢNG: DICTIONARY PROVIDER INTERFACE
 * =========================================================================
 * 
 * LƯU Ý PHÁP LÝ VÀ BẢN QUYỀN DỮ LIỆU:
 * - Dự án "LanguaLab" định hướng cung cấp định nghĩa chuẩn mực kiểu Oxford.
 * - TUYỆT ĐỐI KHÔNG cào dữ liệu (web scrape) trực tiếp từ website của Oxford University Press
 *   hoặc Cambridge Dictionaries vì hành vi này vi phạm bản quyền và điều khoản dịch vụ (ToS).
 * 
 * CÁC HƯỚNG TÍCH HỢP HỢP PHÁP ĐƯỢC ĐỀ XUẤT CHO TƯƠNG LAI:
 * 1. API Thương mại có giấy phép:
 *    - Oxford Dictionaries API (thông qua Oxford Languages - https://developer.oxforddictionaries.com):
 *      Cung cấp dữ liệu từ điển Oxford chính thức với đầy đủ cấp độ CEFR, IPA, collocations và audio bản quyền.
 * 2. Nguồn dữ liệu Mở (Open-source / Creative Commons):
 *    - Wiktionary qua Kaikki.org (https://kaikki.org): Dữ liệu từ điển đa ngôn ngữ được parse sang JSON sạch.
 *    - Free Dictionary API (https://dictionaryapi.dev): REST API miễn phí dựa trên dữ liệu Wiktionary.
 *    - Princeton WordNet: Cơ sở dữ liệu ngữ nghĩa quan hệ từ vựng mở cho tiếng Anh.
 * 
 * Lớp MockDictionaryProvider bên dưới đóng vai trò minh hoạ hợp đồng dữ liệu chuẩn,
 * sẵn sàng cho việc cắm adapter của các provider thật ở trên mà không làm thay đổi tầng giao diện.
 */
export interface DictionaryProvider {
  readonly providerName: string
  lookup(word: string, lang: LearningLanguage): Promise<DictionaryEntry | null>
  suggest(query: string, lang: LearningLanguage): Promise<string[]>
}

export class MockDictionaryProvider implements DictionaryProvider {
  readonly providerName = 'Mock Oxford-Style Provider (Local)'

  private entries: DictionaryEntry[] = [
    // TIẾNG ANH
    {
      word: 'pragmatic',
      lang: 'en',
      phonetic: '/præɡˈmætɪk/',
      frequency: 'Academic',
      etymology: 'Gốc từ tiếng Hy Lạp "pragmatikos" (thuộc về thực hành), bắt nguồn từ "pragma" (hành động cụ thể).',
      senses: [
        {
          partOfSpeech: 'Adjective',
          definitions: [
            {
              index: 1,
              meaning: 'Thực tế, thực dụng; giải quyết vấn đề dựa trên điều kiện thực tế thay vì lý thuyết giáo điều.',
              examples: [
                {
                  target: 'We need to adopt a pragmatic approach to solve this urgent budgetary crisis.',
                  vi: 'Chúng ta cần áp dụng một cách tiếp cận thực tế để giải quyết cuộc khủng hoảng ngân sách cấp bách này.',
                },
              ],
            },
            {
              index: 2,
              meaning: 'Có óc thực tế, biết nhìn nhận sự việc theo hướng khả thi nhất.',
              examples: [
                {
                  target: 'She is a pragmatic leader who always focuses on tangible outcomes.',
                  vi: 'Cô ấy là một nhà lãnh đạo thực tế, luôn tập trung vào những kết quả hữu hình.',
                },
              ],
            },
          ],
        },
      ],
      collocations: ['pragmatic approach', 'pragmatic solution', 'pragmatic decision', 'highly pragmatic'],
      synonyms: ['practical', 'realistic', 'sensible', 'hard-headed'],
      antonyms: ['idealistic', 'impractical', 'theoretical'],
      sourceProvider: 'Mock Oxford-Style Engine',
    },
    {
      word: 'resilient',
      lang: 'en',
      phonetic: '/rɪˈzɪliənt/',
      frequency: 'High',
      etymology: 'Gốc tiếng Latin "resiliens" (bật nảy trở lại, phục hồi).',
      senses: [
        {
          partOfSpeech: 'Adjective',
          definitions: [
            {
              index: 1,
              meaning: 'Kiên cường, bền bỉ; có khả năng hồi phục nhanh sau chấn thương, mất mát hoặc nghịch cảnh.',
              examples: [
                {
                  target: 'Children are often remarkably resilient in adapting to new school environments.',
                  vi: 'Trẻ em thường kiên cường một cách đáng nể trong việc thích nghi với môi trường trường học mới.',
                },
              ],
            },
          ],
        },
      ],
      collocations: ['resilient economy', 'resilient to shocks', 'highly resilient'],
      synonyms: ['tough', 'hardy', 'buoyant', 'adaptable'],
      antonyms: ['fragile', 'vulnerable', 'weak'],
      sourceProvider: 'Mock Oxford-Style Engine',
    },
    {
      word: 'ubiquitous',
      lang: 'en',
      phonetic: '/juːˈbɪkwɪtəs/',
      frequency: 'Academic',
      etymology: 'Bắt nguồn từ tiếng Latin "ubique" (ở khắp mọi nơi).',
      senses: [
        {
          partOfSpeech: 'Adjective',
          definitions: [
            {
              index: 1,
              meaning: 'Có mặt ở khắp mọi nơi, cực kỳ phổ biến tại cùng một thời điểm.',
              examples: [
                {
                  target: 'Mobile computing has become ubiquitous across all sectors of the modern economy.',
                  vi: 'Điện toán di động đã trở nên phổ biến ở khắp mọi nơi trong tất cả các lĩnh vực kinh tế hiện đại.',
                },
              ],
            },
          ],
        },
      ],
      collocations: ['ubiquitous presence', 'ubiquitous technology', 'become ubiquitous'],
      synonyms: ['omnipresent', 'pervasive', 'universal'],
      antonyms: ['rare', 'scarce'],
      sourceProvider: 'Mock Oxford-Style Engine',
    },
    {
      word: 'mitigate',
      lang: 'en',
      phonetic: '/ˈmɪtɪɡeɪt/',
      frequency: 'Academic',
      etymology: 'Từ tiếng Latin "mitigare" (làm dịu đi, xoa dịu).',
      senses: [
        {
          partOfSpeech: 'Verb',
          definitions: [
            {
              index: 1,
              meaning: 'Làm giảm nhẹ, xoa dịu bớt tác hại, rủi ro hoặc mức độ nghiêm trọng.',
              examples: [
                {
                  target: 'Strict building regulations helped mitigate the structural damage during the earthquake.',
                  vi: 'Các quy định xây dựng nghiêm ngặt đã giúp giảm bớt thiệt hại cấu trúc trong trận động đất.',
                },
              ],
            },
          ],
        },
      ],
      collocations: ['mitigate risk', 'mitigate the impact', 'mitigate the effects'],
      synonyms: ['alleviate', 'reduce', 'diminish', 'lessen'],
      antonyms: ['exacerbate', 'aggravate', 'worsen'],
      sourceProvider: 'Mock Oxford-Style Engine',
    },

    // TIẾNG TRUNG
    {
      word: '融洽',
      lang: 'zh',
      phonetic: 'róng qià',
      frequency: 'High',
      etymology: '融 (hoà quyện) + 洽 (hoà hợp) -> mối quan hệ êm ấm không khoảng cách.',
      senses: [
        {
          partOfSpeech: 'Tính từ (形容词)',
          definitions: [
            {
              index: 1,
              meaning: 'Hoà thuận, êm thấm, tình cảm gắn bó khăng khít.',
              examples: [
                {
                  target: '新团队成员之间的相处十分融洽。',
                  vi: 'Mối quan hệ giữa các thành viên trong đội ngũ mới vô cùng hoà thuận.',
                },
              ],
            },
          ],
        },
      ],
      collocations: ['相处融洽', '气氛融洽', '感情融洽'],
      synonyms: ['和谐', '亲密', '友睦'],
      antonyms: ['隔阂', '紧张', '冲突'],
      sourceProvider: 'Mock HSK Lexicon Engine',
    },

    // TIẾNG NHẬT
    {
      word: '妥協',
      lang: 'ja',
      phonetic: 'だきょう (Dakyou)',
      frequency: 'High',
      etymology: '妥 (thoả đáng) + 協 (đồng thuận, hợp tác) -> nhượng bộ để đạt thoả thuận chung.',
      senses: [
        {
          partOfSpeech: 'Danh từ / Động từ Suru (名詞・サ変)',
          definitions: [
            {
              index: 1,
              meaning: 'Thoả hiệp, nhượng bộ lẫn nhau để đi đến điểm chung.',
              examples: [
                {
                  target: '双方が譲歩し、ついに妥協案を受け入れました。',
                  vi: 'Cả hai bên đều nhượng bộ và cuối cùng đã chấp thuận phương án thoả hiệp.',
                },
              ],
            },
          ],
        },
      ],
      collocations: ['妥協案', '妥協点を見出す', '妥協を許さない'],
      synonyms: ['譲歩', '折り合い', '和解'],
      antonyms: ['対立', '固執'],
      sourceProvider: 'Mock Daijirin-Style Engine',
    },
  ]

  async lookup(word: string, lang: LearningLanguage): Promise<DictionaryEntry | null> {
    const clean = word.trim().toLowerCase()
    const found = this.entries.find(
      e => e.lang === lang && (e.word.toLowerCase() === clean || e.phonetic.toLowerCase().includes(clean))
    )
    return found || null
  }

  async suggest(query: string, lang: LearningLanguage): Promise<string[]> {
    const clean = query.trim().toLowerCase()
    if (!clean) return []
    return this.entries
      .filter(e => e.lang === lang && e.word.toLowerCase().startsWith(clean))
      .map(e => e.word)
  }
}

/**
 * Provider đọc trực tiếp từ bảng dictionary_entries trong Supabase
 * Dữ liệu tự biên soạn hoặc nguồn giấy phép mở, tuyệt đối KHÔNG cào dữ liệu bản quyền Oxford.
 */
export class SupabaseDictionaryProvider implements DictionaryProvider {
  readonly providerName = 'Từ điển LanguaLab (Supabase Clean Data)'
  private client: any

  constructor(client: any) {
    this.client = client
  }

  async lookup(word: string, lang: LearningLanguage): Promise<DictionaryEntry | null> {
    const cleanWord = word.trim().toLowerCase()
    try {
      const { data, error } = await this.client
        .from('dictionary_entries')
        .select('*')
        .eq('language', lang)
        .ilike('headword', cleanWord)
        .maybeSingle()

      if (error || !data) return null

      const raw = data.data as any
      return {
        word: data.headword,
        lang: data.language as LearningLanguage,
        phonetic: raw.phonetic || '',
        audioUrl: raw.audioUrl,
        frequency: raw.frequency || 'Academic',
        etymology: raw.etymology,
        senses: Array.isArray(raw.senses) ? raw.senses : [],
        collocations: Array.isArray(raw.collocations) ? raw.collocations : [],
        synonyms: Array.isArray(raw.synonyms) ? raw.synonyms : [],
        antonyms: Array.isArray(raw.antonyms) ? raw.antonyms : [],
        sourceProvider: data.source || 'LanguaLab Open License',
      }
    } catch {
      return null
    }
  }

  async suggest(query: string, lang: LearningLanguage): Promise<string[]> {
    const q = query.trim().toLowerCase()
    if (!q) return []
    try {
      const { data, error } = await this.client
        .from('dictionary_entries')
        .select('headword')
        .eq('language', lang)
        .ilike('headword', `${q}%`)
        .limit(6)

      if (error || !data) return []
      return data.map((d: any) => d.headword)
    } catch {
      return []
    }
  }
}
