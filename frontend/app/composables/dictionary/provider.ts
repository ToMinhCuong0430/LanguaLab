import type { LearningLanguage } from '../useLanguage'

export interface DictionaryDefinition {
  index: number
  meaning: string
  level?: string
  levelSystem?: string
  viMeaning?: string
  examples: {
    target: string
    vi: string
  }[]
}

export interface DictionarySense {
  partOfSpeech: string // Noun, Verb, Adjective, etc.
  definitions: DictionaryDefinition[]
}

export interface DictionaryWordForm {
  form: string
  formType: string
}

export const CEFR_TO_VOCAB_LEVEL: Record<string, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
}

export interface DictionaryEntry {
  word: string
  lang: LearningLanguage
  phonetic: string
  audioUrl?: string
  frequency?: 'High' | 'Medium' | 'Academic'
  level?: string
  vocabLevel?: number
  matchedForm?: string
  etymology?: string
  forms?: DictionaryWordForm[]
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
 * NGUYÊN TẮC DỮ LIỆU & BẢN QUYỀN MỞ:
 * - Dự án "LanguaLab" sử dụng hoàn toàn dữ liệu từ điển mã nguồn mở với giấy phép minh bạch:
 *   + Wiktionary (trích xuất qua Kaikki.org) - Giấy phép CC BY-SA 4.0 & GFDL.
 *   + CEFR-J Vocabulary Profile 1.5 & Octanove C1/C2 - Thang phân loại cấp độ năng lực ngôn ngữ mở.
 * - TUYỆT ĐỐI KHÔNG cào dữ liệu (web scrape) từ Oxford Dictionaries, Cambridge Dictionaries hay bất kỳ nguồn đóng nào.
 * - Minh bạch nguồn dữ liệu tại trang /nguon-du-lieu.
 */
export interface DictionaryProvider {
  readonly providerName: string
  lookup(word: string, lang: LearningLanguage): Promise<DictionaryEntry | null>
  suggest(query: string, lang: LearningLanguage): Promise<string[]>
  suggestWithLevel(query: string, lang: LearningLanguage): Promise<{ word: string; level?: string }[]>
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

  async suggestWithLevel(query: string, lang: LearningLanguage): Promise<{ word: string; level?: string }[]> {
    const clean = query.trim().toLowerCase()
    if (!clean) return []
    return this.entries
      .filter(e => e.lang === lang && e.word.toLowerCase().startsWith(clean))
      .map(e => ({ word: e.word, level: e.level }))
  }
}

/**
 * Provider đọc từ kho từ vựng trung tâm (lex_entries, lex_senses, ...)
 * và fallback về bảng dictionary_entries nếu mục từ chưa có trong kho mới.
 * Dữ liệu tự biên soạn hoặc nguồn giấy phép mở (Wiktionary CC BY-SA, CEFR-J),
 * tuyệt đối KHÔNG cào dữ liệu bản quyền Oxford.
 */
export class SupabaseDictionaryProvider implements DictionaryProvider {
  readonly providerName = 'Từ điển LanguaLab (Kho từ vựng trung tâm)'
  private client: any

  constructor(client: any) {
    this.client = client
  }

  async lookup(word: string, lang: LearningLanguage): Promise<DictionaryEntry | null> {
    const cleanWord = word.trim().toLowerCase()
    if (!cleanWord) return null

    try {
      // 1. Thử tra cứu từ kho từ vựng trung tâm (lex_entries)
      let { data: lexList, error: lexError } = await this.client
        .from('lex_entries')
        .select(`
          id,
          lemma,
          language,
          entry_type,
          frequency_rank,
          status,
          lex_senses (
            id,
            sense_order,
            part_of_speech,
            definition,
            definition_lang,
            level,
            level_system,
            review_status,
            lex_translations (
              language_code,
              translated_text
            ),
            lex_examples (
              sentence,
              sentence_vi
            )
          ),
          lex_pronunciations (
            kind,
            accent,
            transcription,
            audio_url
          ),
          lex_forms (
            form,
            form_type
          ),
          lex_relations!source_entry_id (
            relation_type,
            target_text
          )
        `)
        .eq('normalized_lemma', cleanWord)
        .eq('language', lang)
        .eq('status', 'published')
        .order('frequency_rank', { ascending: true, nullsFirst: false })
        .limit(1)

      let entryData = lexList?.[0]

      let matchedForm: string | undefined = undefined

      // 1.1 Nếu không tìm thấy bằng lemma, thử tìm qua các biến thể từ (lex_forms)
      // Ví dụ: tra "went" -> dẫn tới "go"
      if (!entryData) {
        const escapedForm = cleanWord.replace(/([%_\\])/g, '\\$1')
        const { data: formMatch } = await this.client
          .from('lex_forms')
          .select('entry_id')
          .ilike('form', escapedForm)
          .limit(1)
          .maybeSingle()

        if (formMatch?.entry_id) {
          matchedForm = cleanWord
          const { data: formEntryList } = await this.client
            .from('lex_entries')
            .select(`
              id,
              lemma,
              language,
              entry_type,
              frequency_rank,
              status,
              lex_senses (
                id,
                sense_order,
                part_of_speech,
                definition,
                definition_lang,
                level,
                level_system,
                review_status,
                lex_translations (
                  language_code,
                  translated_text
                ),
                lex_examples (
                  sentence,
                  sentence_vi
                )
              ),
              lex_pronunciations (
                kind,
                accent,
                transcription,
                audio_url
              ),
              lex_forms (
                form,
                form_type
              ),
              lex_relations!source_entry_id (
                relation_type,
                target_text
              )
            `)
            .eq('id', formMatch.entry_id)
            .eq('language', lang)
            .eq('status', 'published')
            .limit(1)

          entryData = formEntryList?.[0]
        }
      }

      // Nếu có dữ liệu trong kho lex_*, biến đổi thành DictionaryEntry
      if (entryData) {
        const posMap: Record<string, string> = {
          noun: 'Danh từ (Noun)',
          verb: 'Động từ (Verb)',
          adjective: 'Tính từ (Adjective)',
          adverb: 'Trạng từ (Adverb)',
          preposition: 'Giới từ (Preposition)',
          conjunction: 'Liên từ (Conjunction)',
          pronoun: 'Đại từ (Pronoun)',
          interjection: 'Thán từ (Interjection)',
          determiner: 'Từ hạn định (Determiner)',
          numeral: 'Số từ (Numeral)',
          particle: 'Trợ từ (Particle)',
          classifier: 'Lượng từ (Classifier)',
          phrase: 'Cụm từ (Phrase)',
          other: 'Nghĩa khác',
        }

        const pronList = entryData.lex_pronunciations || []
        const ipaPron = pronList.find((p: any) => p.kind === 'ipa' && p.transcription) || pronList[0]
        const phonetic = ipaPron?.transcription || ''
        const audioUrl = pronList.find((p: any) => p.audio_url)?.audio_url

        const forms = (entryData.lex_forms || []).map((f: any) => ({
          form: f.form,
          formType: f.form_type,
        }))

        // Gom nhóm senses theo part_of_speech
        const sensesList = (entryData.lex_senses || []).sort(
          (a: any, b: any) => (a.sense_order ?? 0) - (b.sense_order ?? 0)
        )
        const groups = new Map<string, DictionaryDefinition[]>()

        for (const s of sensesList) {
          const rawPos = (s.part_of_speech || 'other').toLowerCase()
          const posLabel = posMap[rawPos] || (s.part_of_speech ? s.part_of_speech.toUpperCase() : 'Nghĩa')
          if (!groups.has(posLabel)) {
            groups.set(posLabel, [])
          }
          const defs = groups.get(posLabel)!

          const viTrans = s.lex_translations?.find((t: any) => t.language_code === 'vi')?.translated_text
          const exList = (s.lex_examples || []).map((ex: any) => ({
            target: ex.sentence,
            vi: ex.sentence_vi || '',
          }))

          defs.push({
            index: defs.length + 1,
            meaning: s.definition,
            level: s.level || undefined,
            levelSystem: s.level_system || undefined,
            viMeaning: viTrans || undefined,
            examples: exList,
          })
        }

        const senses: DictionarySense[] = Array.from(groups.entries()).map(([partOfSpeech, definitions]) => ({
          partOfSpeech,
          definitions,
        }))

        const collocations: string[] = []
        const synonyms: string[] = []
        const antonyms: string[] = []
        for (const r of (entryData.lex_relations || [])) {
          const text = r.target_text?.trim()
          if (!text) continue
          if (r.relation_type === 'synonym' && !synonyms.includes(text)) synonyms.push(text)
          else if (r.relation_type === 'antonym' && !antonyms.includes(text)) antonyms.push(text)
          else if ((r.relation_type === 'collocation' || r.relation_type === 'derived_from') && !collocations.includes(text)) collocations.push(text)
        }

        // Tính cấp CEFR thấp nhất cho toàn bộ mục từ
        const cefrLevels: string[] = (entryData.lex_senses || [])
          .filter((s: any) => s.level_system === 'cefr' && s.level && CEFR_TO_VOCAB_LEVEL[s.level])
          .map((s: any) => s.level)

        let level: string | undefined = undefined
        let vocabLevel: number | undefined = undefined

        if (cefrLevels.length > 0) {
          cefrLevels.sort((a, b) => CEFR_TO_VOCAB_LEVEL[a] - CEFR_TO_VOCAB_LEVEL[b])
          level = cefrLevels[0]
          vocabLevel = CEFR_TO_VOCAB_LEVEL[level]
        }

        // Chỉ gán frequency khi frequency_rank có giá trị, nếu không để undefined
        let frequency: 'High' | 'Medium' | 'Academic' | undefined = undefined
        if (entryData.frequency_rank != null) {
          if (entryData.frequency_rank <= 3000) {
            frequency = 'High'
          } else if (entryData.frequency_rank <= 10000) {
            frequency = 'Medium'
          } else {
            frequency = 'Academic'
          }
        }

        return {
          word: entryData.lemma,
          lang: entryData.language as LearningLanguage,
          phonetic,
          audioUrl,
          frequency,
          level,
          vocabLevel,
          matchedForm,
          forms,
          senses,
          collocations,
          synonyms,
          antonyms,
          sourceProvider: 'Wiktionary · CEFR-J · Octanove',
        }
      }

      // 2. Dự phòng: Nếu chưa có trong kho lex_*, tìm trong bảng legacy dictionary_entries
      const { data: legacyData, error: legacyErr } = await this.client
        .from('dictionary_entries')
        .select('*')
        .eq('language', lang)
        .ilike('headword', cleanWord)
        .maybeSingle()

      if (legacyErr || !legacyData) return null

      const raw = legacyData.data as any
      return {
        word: legacyData.headword,
        lang: legacyData.language as LearningLanguage,
        phonetic: raw.phonetic || '',
        audioUrl: raw.audioUrl,
        frequency: raw.frequency || 'Academic',
        etymology: raw.etymology,
        senses: Array.isArray(raw.senses) ? raw.senses : [],
        collocations: Array.isArray(raw.collocations) ? raw.collocations : [],
        synonyms: Array.isArray(raw.synonyms) ? raw.synonyms : [],
        antonyms: Array.isArray(raw.antonyms) ? raw.antonyms : [],
        sourceProvider: legacyData.source || 'LanguaLab Open License',
      }
    } catch {
      return null
    }
  }

  async suggest(query: string, lang: LearningLanguage): Promise<string[]> {
    const q = query.trim().toLowerCase()
    if (!q) return []
    try {
      // 1. Thử gợi ý bằng RPC search_lex_entries từ kho từ vựng trung tâm
      const { data: rpcData, error: rpcErr } = await this.client.rpc('search_lex_entries', {
        p_query: q,
        p_language: lang,
        p_limit: 8,
      })

      if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
        return rpcData.map((d: any) => d.lemma)
      }

      // 2. Dự phòng: Gợi ý từ bảng dictionary_entries
      const { data: legacyData, error: legacyErr } = await this.client
        .from('dictionary_entries')
        .select('headword')
        .eq('language', lang)
        .ilike('headword', `${q}%`)
        .limit(8)

      if (!legacyErr && legacyData) {
        return legacyData.map((d: any) => d.headword)
      }
      return []
    } catch {
      return []
    }
  }

  async suggestWithLevel(query: string, lang: LearningLanguage): Promise<{ word: string; level?: string }[]> {
    const q = query.trim().toLowerCase()
    if (!q) return []
    try {
      // 1. Thử gợi ý bằng RPC search_lex_entries từ kho từ vựng trung tâm
      const { data: rpcData, error: rpcErr } = await this.client.rpc('search_lex_entries', {
        p_query: q,
        p_language: lang,
        p_limit: 8,
      })

      if (!rpcErr && Array.isArray(rpcData) && rpcData.length > 0) {
        const lemmas: string[] = rpcData.map((d: any) => d.lemma)
        const normalizedLemmas = lemmas.map(l => l.trim().toLowerCase())

        // Truy vấn lấy cấp CEFR thấp nhất cho các lemma vừa tìm được
        const { data: senseData } = await this.client
          .from('lex_entries')
          .select(`
            lemma,
            normalized_lemma,
            lex_senses (
              level,
              level_system
            )
          `)
          .in('normalized_lemma', normalizedLemmas)
          .eq('language', lang)
          .eq('status', 'published')

        const levelMap = new Map<string, string>()
        if (senseData) {
          for (const item of senseData) {
            const norm = item.normalized_lemma || item.lemma.toLowerCase()
            const cefrLevels: string[] = (item.lex_senses || [])
              .filter((s: any) => s.level_system === 'cefr' && s.level && CEFR_TO_VOCAB_LEVEL[s.level])
              .map((s: any) => s.level)

            if (cefrLevels.length > 0) {
              cefrLevels.sort((a, b) => CEFR_TO_VOCAB_LEVEL[a] - CEFR_TO_VOCAB_LEVEL[b])
              levelMap.set(norm, cefrLevels[0])
            }
          }
        }

        return lemmas.map(w => ({
          word: w,
          level: levelMap.get(w.trim().toLowerCase()),
        }))
      }

      // 2. Dự phòng: Gợi ý từ bảng dictionary_entries
      const { data: legacyData, error: legacyErr } = await this.client
        .from('dictionary_entries')
        .select('headword')
        .eq('language', lang)
        .ilike('headword', `${q}%`)
        .limit(8)

      if (!legacyErr && legacyData) {
        return legacyData.map((d: any) => ({ word: d.headword }))
      }
      return []
    } catch {
      return []
    }
  }
}
