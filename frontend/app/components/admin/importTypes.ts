import type { Database } from '~/types/database.types'

export type ContentType =
  | 'vocab'
  | 'typing'
  | 'grammar'
  | 'reading'
  | 'media'
  | 'dictionary'
  | 'ielts'

export interface ColumnDefinition {
  key: string
  label: string
  required?: boolean
  type?: 'string' | 'number' | 'json' | 'enum'
  allowedValues?: string[]
  description?: string
}

export interface ContentTypeDefinition {
  type: ContentType
  title: string
  description: string
  csvTemplatePath: string
  jsonTemplatePath: string
  extraTemplatePath?: string
  extraTemplateLabel?: string
  notice?: string
  columns: ColumnDefinition[]
  validateRow: (row: Record<string, any>, rowIndex: number) => string | null
  // Hàm chuyển đổi các dòng hợp lệ thành payload để upsert vào Supabase
  importData: (
    rows: Record<string, any>[],
    client: any,
    extraData?: { subtitles?: any[] }
  ) => Promise<{ okCount: number; errors: { row: number; reason: string }[] }>
}

export const CONTENT_TYPE_DEFINITIONS: Record<ContentType, ContentTypeDefinition> = {
  vocab: {
    type: 'vocab',
    title: 'Từ vựng (Vocab Sets & Words)',
    description: 'Nạp bộ từ vựng đề xuất hệ thống cùng danh sách từ chi tiết theo cấp 1-7.',
    csvTemplatePath: '/templates/vocab_template.csv',
    jsonTemplatePath: '/templates/vocab_template.json',
    columns: [
      { key: 'set_title', label: 'Tên bộ từ', required: true },
      { key: 'set_language', label: 'Ngôn ngữ', required: true, allowedValues: ['en', 'zh', 'ja'] },
      { key: 'set_level_number', label: 'Cấp độ (1-7)', required: true },
      { key: 'word', label: 'Từ vựng', required: true },
      { key: 'meaning_vi', label: 'Nghĩa tiếng Việt', required: true },
      { key: 'phonetic', label: 'Phiên âm' },
      { key: 'part_of_speech', label: 'Từ loại' },
      { key: 'example_sentence', label: 'Câu ví dụ' },
      { key: 'example_translation', label: 'Dịch câu ví dụ' },
    ],
    validateRow: (row, idx) => {
      if (!row.set_title?.trim()) return `Dòng ${idx}: Thiếu tên bộ từ (set_title)`
      if (!['en', 'zh', 'ja'].includes(row.set_language)) return `Dòng ${idx}: Ngôn ngữ không hợp lệ ('en' | 'zh' | 'ja')`
      const lvl = parseInt(row.set_level_number)
      if (isNaN(lvl) || lvl < 1 || lvl > 7) return `Dòng ${idx}: Cấp độ phải từ 1 đến 7`
      if (!row.word?.trim()) return `Dòng ${idx}: Thiếu từ vựng (word)`
      if (!row.meaning_vi?.trim()) return `Dòng ${idx}: Thiếu nghĩa tiếng Việt (meaning_vi)`
      return null
    },
    importData: async (rows, client) => {
      // 1. Nhóm theo set_title + language
      const setsMap = new Map<string, { setInfo: any; words: any[] }>()
      for (const r of rows) {
        const setKey = `${r.set_language}_${r.set_title}`
        if (!setsMap.has(setKey)) {
          setsMap.set(setKey, {
            setInfo: {
              title: r.set_title,
              language: r.set_language,
              level_id: parseInt(r.set_level_number),
              is_system: true,
              is_public: true,
              is_published: false,
            },
            words: [],
          })
        }
        setsMap.get(setKey)!.words.push(r)
      }

      let okCount = 0
      const errors: { row: number; reason: string }[] = []

      let currentRowIdx = 1
      for (const [, item] of setsMap) {
        // Tìm hoặc tạo vocab_set
        const { data: existingSet, error: fetchErr } = await client
          .from('vocab_sets')
          .select('id')
          .eq('title', item.setInfo.title)
          .eq('language', item.setInfo.language)
          .maybeSingle()

        if (fetchErr) {
          errors.push({ row: currentRowIdx, reason: `Lỗi truy vấn bộ từ: ${fetchErr.message}` })
          currentRowIdx += item.words.length
          continue
        }

        let setId = existingSet?.id
        if (!setId) {
          const { data: createdSet, error: createErr } = await client
            .from('vocab_sets')
            .insert({
              ...item.setInfo,
              is_published: false,
            })
            .select('id')
            .single()

          if (createErr || !createdSet) {
            errors.push({ row: currentRowIdx, reason: `Không thể tạo bộ từ: ${createErr?.message}` })
            currentRowIdx += item.words.length
            continue
          }
          setId = createdSet.id
        }

        // Insert words theo lô
        const wordPayloads = item.words.map((w) => ({
          set_id: setId,
          word: w.word.trim(),
          phonetic: w.phonetic?.trim() || null,
          part_of_speech: w.part_of_speech?.trim() || null,
          meaning_vi: w.meaning_vi.trim(),
          example_sentence: w.example_sentence?.trim() || null,
          example_translation: w.example_translation?.trim() || null,
          reading: w.reading?.trim() || null,
        }))

        const { error: wordsErr } = await client
          .from('vocab_words')
          .insert(wordPayloads)

        if (wordsErr) {
          errors.push({ row: currentRowIdx, reason: `Lỗi ghi từ vựng: ${wordsErr.message}` })
        } else {
          okCount += item.words.length
        }
        currentRowIdx += item.words.length
      }

      return { okCount, errors }
    },
  },

  typing: {
    type: 'typing',
    title: 'Gõ câu (Typing Topics & Sentences)',
    description: 'Nạp chủ đề luyện gõ (life/work) và các câu mẫu kèm phiên âm và nghĩa tiếng Việt.',
    csvTemplatePath: '/templates/typing_template.csv',
    jsonTemplatePath: '/templates/typing_template.json',
    columns: [
      { key: 'topic_id', label: 'ID Chủ đề', required: true },
      { key: 'topic_language', label: 'Ngôn ngữ', required: true, allowedValues: ['en', 'zh', 'ja'] },
      { key: 'topic_level', label: 'Cấp độ', required: true },
      { key: 'group_type', label: 'Nhóm (life/work)', required: true, allowedValues: ['life', 'work'] },
      { key: 'topic_title', label: 'Tiêu đề chủ đề', required: true },
      { key: 'sentence_content', label: 'Nội dung câu', required: true },
      { key: 'translation', label: 'Bản dịch tiếng Việt', required: true },
    ],
    validateRow: (row, idx) => {
      if (!row.topic_id?.trim()) return `Dòng ${idx}: Thiếu ID chủ đề (topic_id)`
      if (!['en', 'zh', 'ja'].includes(row.topic_language)) return `Dòng ${idx}: Ngôn ngữ không hợp lệ`
      if (!['life', 'work'].includes(row.group_type)) return `Dòng ${idx}: group_type phải là 'life' hoặc 'work'`
      if (!row.topic_title?.trim()) return `Dòng ${idx}: Thiếu tiêu đề chủ đề`
      if (!row.sentence_content?.trim()) return `Dòng ${idx}: Thiếu nội dung câu luyện gõ`
      if (!row.translation?.trim()) return `Dòng ${idx}: Thiếu bản dịch câu`
      return null
    },
    importData: async (rows, client) => {
      const topicMap = new Map<string, { topicInfo: any; sentences: any[] }>()
      for (const r of rows) {
        if (!topicMap.has(r.topic_id)) {
          topicMap.set(r.topic_id, {
            topicInfo: {
              id: r.topic_id.trim(),
              language: r.topic_language,
              level: r.topic_level.trim(),
              group_type: r.group_type,
              title: r.topic_title.trim(),
              description: r.topic_description?.trim() || null,
              is_published: false,
            },
            sentences: [],
          })
        }
        topicMap.get(r.topic_id)!.sentences.push(r)
      }

      let okCount = 0
      const errors: { row: number; reason: string }[] = []
      let rowIdx = 1

      for (const [, item] of topicMap) {
        // Upsert topic
        const { error: topicErr } = await client
          .from('typing_topics')
          .upsert(item.topicInfo, { onConflict: 'id' })

        if (topicErr) {
          errors.push({ row: rowIdx, reason: `Lỗi lưu chủ đề: ${topicErr.message}` })
          rowIdx += item.sentences.length
          continue
        }

        const sentencePayloads = item.sentences.map((s, idx) => ({
          topic_id: item.topicInfo.id,
          content: s.sentence_content.trim(),
          reading: s.reading?.trim() || null,
          translation: s.translation.trim(),
          hint_word: s.hint_word?.trim() || null,
          sort_order: parseInt(s.sort_order) || (idx + 1),
        }))

        const { error: sentErr } = await client
          .from('typing_sentences')
          .insert(sentencePayloads)

        if (sentErr) {
          errors.push({ row: rowIdx, reason: `Lỗi lưu câu: ${sentErr.message}` })
        } else {
          okCount += item.sentences.length
        }
        rowIdx += item.sentences.length
      }

      return { okCount, errors }
    },
  },

  grammar: {
    type: 'grammar',
    title: 'Ngữ pháp (Grammar Points & Exercises)',
    description: 'Nạp điểm ngữ pháp (công thức, giải thích, ví dụ, lỗi thường gặp) và bài tập trắc nghiệm/điền từ.',
    csvTemplatePath: '/templates/grammar_template.csv',
    jsonTemplatePath: '/templates/grammar_template.json',
    columns: [
      { key: 'point_id', label: 'ID Ngữ pháp', required: true },
      { key: 'language', label: 'Ngôn ngữ', required: true, allowedValues: ['en', 'zh', 'ja'] },
      { key: 'level', label: 'Cấp độ', required: true },
      { key: 'title', label: 'Tiêu đề gốc', required: true },
      { key: 'vietnamese_title', label: 'Tiêu đề tiếng Việt', required: true },
      { key: 'explanation', label: 'Giải thích', required: true },
      { key: 'exercise_question_type', label: 'Dạng bài tập', allowedValues: ['multiple_choice', 'fill_blank', 'word_order'] },
      { key: 'exercise_correct_answer', label: 'Đáp án đúng' },
    ],
    validateRow: (row, idx) => {
      if (!row.point_id?.trim()) return `Dòng ${idx}: Thiếu ID ngữ pháp (point_id)`
      if (!['en', 'zh', 'ja'].includes(row.language)) return `Dòng ${idx}: Ngôn ngữ không hợp lệ`
      if (!row.title?.trim()) return `Dòng ${idx}: Thiếu tiêu đề điểm ngữ pháp`
      if (!row.vietnamese_title?.trim()) return `Dòng ${idx}: Thiếu tiêu đề tiếng Việt`
      if (!row.explanation?.trim()) return `Dòng ${idx}: Thiếu giải thích ngữ pháp`
      if (row.exercise_question_type && !['multiple_choice', 'fill_blank', 'word_order'].includes(row.exercise_question_type)) {
        return `Dòng ${idx}: Dạng bài tập không hợp lệ`
      }
      return null
    },
    importData: async (rows, client) => {
      const pointMap = new Map<string, { pointInfo: any; exercises: any[] }>()
      for (const r of rows) {
        if (!pointMap.has(r.point_id)) {
          let formula = {}
          let examples: any[] = []
          let mistakes: any[] = []
          try { if (r.formula) formula = JSON.parse(r.formula) } catch {}
          try { if (r.examples) examples = JSON.parse(r.examples) } catch {}
          try { if (r.common_mistakes) mistakes = JSON.parse(r.common_mistakes) } catch {}

          pointMap.set(r.point_id, {
            pointInfo: {
              id: r.point_id.trim(),
              language: r.language,
              level: r.level.trim(),
              title: r.title.trim(),
              vietnamese_title: r.vietnamese_title.trim(),
              summary: r.summary?.trim() || null,
              formula,
              explanation: r.explanation.trim(),
              examples,
              common_mistakes: mistakes,
              xp_reward: parseInt(r.xp_reward) || 30,
              is_published: false,
            },
            exercises: [],
          })
        }

        if (r.exercise_prompt && r.exercise_correct_answer) {
          let options: any[] = []
          try { if (r.exercise_options) options = JSON.parse(r.exercise_options) } catch {}
          pointMap.get(r.point_id)!.exercises.push({
            point_id: r.point_id.trim(),
            question_type: r.exercise_question_type || 'multiple_choice',
            prompt: r.exercise_prompt.trim(),
            question: r.exercise_question?.trim() || null,
            options,
            correct_answer: r.exercise_correct_answer.trim(),
            explanation: r.exercise_explanation?.trim() || 'Giải thích chi tiết đáp án',
          })
        }
      }

      let okCount = 0
      const errors: { row: number; reason: string }[] = []
      let rowIdx = 1

      for (const [, item] of pointMap) {
        const { error: pErr } = await client
          .from('grammar_points')
          .upsert(item.pointInfo, { onConflict: 'id' })

        if (pErr) {
          errors.push({ row: rowIdx, reason: `Lỗi lưu điểm ngữ pháp: ${pErr.message}` })
          rowIdx++
          continue
        }

        if (item.exercises.length > 0) {
          const { error: exErr } = await client
            .from('grammar_exercises')
            .insert(item.exercises)

          if (exErr) {
            errors.push({ row: rowIdx, reason: `Lỗi lưu bài tập: ${exErr.message}` })
          }
        }
        okCount++
        rowIdx++
      }

      return { okCount, errors }
    },
  },

  reading: {
    type: 'reading',
    title: 'Kho đọc và Dịch (Reading Items & Sections)',
    description: 'Nạp bài đọc song ngữ kèm phân đoạn. BẮT BUỘC khai báo bản quyền (license) và ghi chú nguồn.',
    csvTemplatePath: '/templates/reading_template.csv',
    jsonTemplatePath: '/templates/reading_template.json',
    notice: 'Chỉ nạp văn bản miền công cộng, tự biên soạn hoặc có giấy phép; không dán bài báo hay sách còn bản quyền.',
    columns: [
      { key: 'reading_id', label: 'ID Bài đọc', required: true },
      { key: 'content_type', label: 'Loại bài', required: true, allowedValues: ['news', 'book', 'short_story', 'novel', 'play'] },
      { key: 'language', label: 'Ngôn ngữ', required: true, allowedValues: ['en', 'zh', 'ja'] },
      { key: 'level', label: 'Cấp độ', required: true },
      { key: 'title', label: 'Tiêu đề gốc', required: true },
      { key: 'author', label: 'Tác giả', required: true },
      { key: 'license', label: 'Giấy phép (Bắt buộc)', required: true, allowedValues: ['public_domain', 'original', 'licensed'] },
      { key: 'original_text', label: 'Đoạn văn gốc', required: true },
      { key: 'translated_text', label: 'Bản dịch tiếng Việt', required: true },
    ],
    validateRow: (row, idx) => {
      if (!row.reading_id?.trim()) return `Dòng ${idx}: Thiếu ID bài đọc (reading_id)`
      if (!['news', 'book', 'short_story', 'novel', 'play'].includes(row.content_type)) return `Dòng ${idx}: Loại nội dung không hợp lệ`
      if (!['en', 'zh', 'ja'].includes(row.language)) return `Dòng ${idx}: Ngôn ngữ không hợp lệ`
      if (!row.title?.trim()) return `Dòng ${idx}: Thiếu tiêu đề bài đọc`
      if (!row.author?.trim()) return `Dòng ${idx}: Thiếu tên tác giả`
      if (!row.license || !['public_domain', 'original', 'licensed'].includes(row.license)) {
        return `Dòng ${idx}: License BẮT BUỘC và phải là 'public_domain', 'original' hoặc 'licensed'`
      }
      if (!row.original_text?.trim()) return `Dòng ${idx}: Thiếu đoạn văn gốc`
      if (!row.translated_text?.trim()) return `Dòng ${idx}: Thiếu bản dịch tiếng Việt`
      return null
    },
    importData: async (rows, client) => {
      const readingMap = new Map<string, { readingInfo: any; sections: any[] }>()
      for (const r of rows) {
        if (!readingMap.has(r.reading_id)) {
          readingMap.set(r.reading_id, {
            readingInfo: {
              id: r.reading_id.trim(),
              content_type: r.content_type,
              language: r.language,
              level: r.level.trim(),
              title: r.title.trim(),
              vietnamese_title: r.vietnamese_title?.trim() || null,
              author: r.author.trim(),
              source_url: r.source_url?.trim() || null,
              source_note: r.source_note?.trim() || 'Biên soạn nội bộ',
              license: r.license,
              is_published: false,
            },
            sections: [],
          })
        }
        readingMap.get(r.reading_id)!.sections.push(r)
      }

      let okCount = 0
      const errors: { row: number; reason: string }[] = []
      let rowIdx = 1

      for (const [, item] of readingMap) {
        const totalWords = item.sections.reduce((acc, s) => acc + (s.original_text?.split(/\s+/).length || 0), 0)
        item.readingInfo.word_count = totalWords
        item.readingInfo.reading_time_minutes = Math.max(1, Math.ceil(totalWords / 150))

        const { error: readErr } = await client
          .from('reading_items')
          .upsert(item.readingInfo, { onConflict: 'id' })

        if (readErr) {
          errors.push({ row: rowIdx, reason: `Lỗi lưu bài đọc: ${readErr.message}` })
          rowIdx += item.sections.length
          continue
        }

        const sectionPayloads = item.sections.map((s, idx) => ({
          reading_id: item.readingInfo.id,
          sort_order: parseInt(s.section_sort_order) || (idx + 1),
          original_text: s.original_text.trim(),
          translated_text: s.translated_text.trim(),
        }))

        const { error: secErr } = await client
          .from('reading_sections')
          .insert(sectionPayloads)

        if (secErr) {
          errors.push({ row: rowIdx, reason: `Lỗi lưu đoạn văn: ${secErr.message}` })
        } else {
          okCount += item.sections.length
        }
        rowIdx += item.sections.length
      }

      return { okCount, errors }
    },
  },

  media: {
    type: 'media',
    title: 'Video và Podcast (Media & Subtitles)',
    description: 'Chỉ nhận LINK YouTube hoặc ID YouTube (KHÔNG tải file video), hỗ trợ nạp file phụ đề .srt/.vtt.',
    csvTemplatePath: '/templates/media_template.csv',
    jsonTemplatePath: '/templates/media_template.json',
    extraTemplatePath: '/templates/media_subtitle_template.srt',
    extraTemplateLabel: 'Tải file mẫu phụ đề .SRT',
    columns: [
      { key: 'media_id', label: 'ID Media', required: true },
      { key: 'media_type', label: 'Loại (video/podcast)', required: true, allowedValues: ['video', 'podcast'] },
      { key: 'language', label: 'Ngôn ngữ', required: true, allowedValues: ['en', 'zh', 'ja'] },
      { key: 'level', label: 'Cấp độ', required: true },
      { key: 'topic', label: 'Chủ đề', required: true },
      { key: 'title', label: 'Tiêu đề', required: true },
      { key: 'provider', label: 'Nhà cung cấp', required: true, allowedValues: ['youtube', 'upload'] },
      { key: 'source_url', label: 'YouTube ID / URL Audio', required: true },
    ],
    validateRow: (row, idx) => {
      if (!row.media_id?.trim()) return `Dòng ${idx}: Thiếu ID media (media_id)`
      if (!['video', 'podcast'].includes(row.media_type)) return `Dòng ${idx}: media_type phải là 'video' hoặc 'podcast'`
      if (!['en', 'zh', 'ja'].includes(row.language)) return `Dòng ${idx}: Ngôn ngữ không hợp lệ`
      if (!row.title?.trim()) return `Dòng ${idx}: Thiếu tiêu đề media`
      if (!['youtube', 'upload'].includes(row.provider)) return `Dòng ${idx}: provider phải là 'youtube' hoặc 'upload'`
      if (!row.source_url?.trim()) return `Dòng ${idx}: Thiếu source_url (YouTube Video ID)`
      return null
    },
    importData: async (rows, client, extraData) => {
      let okCount = 0
      const errors: { row: number; reason: string }[] = []

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        const payload = {
          id: r.media_id.trim(),
          media_type: r.media_type,
          language: r.language,
          level: r.level.trim(),
          topic: r.topic.trim(),
          title: r.title.trim(),
          vietnamese_title: r.vietnamese_title?.trim() || null,
          speaker: r.speaker?.trim() || null,
          provider: r.provider,
          source_url: r.source_url.trim(),
          duration_seconds: parseInt(r.duration_seconds) || 120,
          is_published: false,
        }

        const { error: mediaErr } = await client
          .from('media_items')
          .upsert(payload, { onConflict: 'id' })

        if (mediaErr) {
          errors.push({ row: i + 1, reason: `Lỗi lưu Media: ${mediaErr.message}` })
          continue
        }

        // Nếu có subtitle cues gửi kèm
        if (extraData?.subtitles && extraData.subtitles.length > 0) {
          const cues = extraData.subtitles.map((sub, sIdx) => ({
            media_id: payload.id,
            subtitle_lang: payload.language,
            start_ms: Math.round(sub.start * 1000),
            end_ms: Math.round(sub.end * 1000),
            text: sub.text,
            translation_vi: sub.vi || null,
            sort_order: sIdx + 1,
          }))

          await client.from('media_cues').delete().eq('media_id', payload.id)
          await client.from('media_cues').insert(cues)
        }

        // Nếu dòng có câu hỏi trắc nghiệm
        if (r.quiz_question && r.quiz_options) {
          let opts: any[] = []
          try { opts = JSON.parse(r.quiz_options) } catch {}
          await client.from('media_quiz_questions').insert({
            media_id: payload.id,
            segment_time_sec: parseInt(r.quiz_segment_time_sec) || 0,
            question: r.quiz_question.trim(),
            options: opts,
            correct_index: parseInt(r.quiz_correct_index) || 0,
            explanation: r.quiz_explanation?.trim() || null,
          })
        }

        okCount++
      }

      return { okCount, errors }
    },
  },

  dictionary: {
    type: 'dictionary',
    title: 'Từ điển chuyên sâu (Dictionary Entries)',
    description: 'Nạp mục từ điển hợp pháp (Wiktionary, WordNet hoặc tự biên soạn). BẮT BUỘC ghi rõ source và license.',
    csvTemplatePath: '/templates/dictionary_template.csv',
    jsonTemplatePath: '/templates/dictionary_template.json',
    notice: 'Không sao chép dữ liệu từ điển có bản quyền (Oxford, Cambridge...); chỉ dùng dữ liệu tự viết hoặc nguồn mở có giấy phép phù hợp (ví dụ Wiktionary CC-BY-SA, ghi rõ nguồn).',
    columns: [
      { key: 'headword', label: 'Từ tra cứu', required: true },
      { key: 'language', label: 'Ngôn ngữ', required: true, allowedValues: ['en', 'zh', 'ja'] },
      { key: 'source', label: 'Nguồn dữ liệu (Bắt buộc)', required: true },
      { key: 'license', label: 'Giấy phép (Bắt buộc)', required: true },
      { key: 'definition_vi', label: 'Nghĩa tiếng Việt', required: true },
    ],
    validateRow: (row, idx) => {
      if (!row.headword?.trim()) return `Dòng ${idx}: Thiếu từ tra cứu (headword)`
      if (!['en', 'zh', 'ja'].includes(row.language)) return `Dòng ${idx}: Ngôn ngữ không hợp lệ`
      if (!row.source?.trim()) return `Dòng ${idx}: BẮT BUỘC khai báo nguồn dữ liệu (source)`
      if (!row.license?.trim()) return `Dòng ${idx}: BẮT BUỘC khai báo giấy phép (license)`
      if (!row.definition_vi?.trim() && !row.data) return `Dòng ${idx}: Thiếu định nghĩa từ điển`
      return null
    },
    importData: async (rows, client) => {
      let okCount = 0
      const errors: { row: number; reason: string }[] = []

      const payloads = rows.map((r, idx) => {
        let entryData: any = {}
        if (r.data) {
          try {
            entryData = typeof r.data === 'string' ? JSON.parse(r.data) : r.data
          } catch {}
        } else {
          entryData = {
            phonetics: r.phonetic ? [{ text: r.phonetic, audio: '' }] : [],
            senses: [
              {
                index: 1,
                part_of_speech: r.pos || 'general',
                vietnamese: r.definition_vi,
                examples: r.example_en ? [{ sentence: r.example_en, translation: r.example_vi || '' }] : [],
              },
            ],
            collocations: [],
            synonyms: [],
            antonyms: [],
          }
        }

        return {
          headword: r.headword.trim().toLowerCase(),
          language: r.language,
          source: r.source.trim(),
          license: r.license.trim(),
          data: entryData,
          _rowIdx: idx + 1,
        }
      })

      // Upsert theo lô 100
      const BATCH_SIZE = 100
      for (let i = 0; i < payloads.length; i += BATCH_SIZE) {
        const batch = payloads.slice(i, i + BATCH_SIZE)
        const cleanBatch = batch.map(({ _rowIdx, ...rest }) => rest)

        const { error } = await client
          .from('dictionary_entries')
          .upsert(cleanBatch, { onConflict: 'language,headword' })

        if (error) {
          errors.push({ row: i + 1, reason: `Lỗi lô ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}` })
        } else {
          okCount += batch.length
        }
      }

      return { okCount, errors }
    },
  },

  ielts: {
    type: 'ielts',
    title: 'Đề thi IELTS (Tests & Questions)',
    description: 'Nạp đề thi thử 4 kỹ năng (Listening, Reading, Writing, Speaking) cùng danh sách câu hỏi.',
    csvTemplatePath: '/templates/ielts_template.csv',
    jsonTemplatePath: '/templates/ielts_template.json',
    columns: [
      { key: 'test_id', label: 'ID Đề thi', required: true },
      { key: 'exam_id', label: 'Kỳ thi', required: true, allowedValues: ['ielts', 'toeic', 'toefl', 'hsk', 'jlpt'] },
      { key: 'skill', label: 'Kỹ năng', required: true, allowedValues: ['listening', 'reading', 'writing', 'speaking'] },
      { key: 'title', label: 'Tiêu đề đề thi', required: true },
      { key: 'difficulty', label: 'Độ khó', required: true, allowedValues: ['Dễ', 'Trung bình', 'Khó'] },
      { key: 'question_number', label: 'Số thứ tự câu', required: true },
      { key: 'question_type', label: 'Dạng câu hỏi', required: true },
      { key: 'correct_answer', label: 'Đáp án đúng', required: true },
    ],
    validateRow: (row, idx) => {
      if (!row.test_id?.trim()) return `Dòng ${idx}: Thiếu ID đề thi (test_id)`
      if (!['ielts', 'toeic', 'toefl', 'hsk', 'jlpt'].includes(row.exam_id)) return `Dòng ${idx}: Kỳ thi không hợp lệ`
      if (!['listening', 'reading', 'writing', 'speaking'].includes(row.skill)) return `Dòng ${idx}: Kỹ năng không hợp lệ`
      if (!row.title?.trim()) return `Dòng ${idx}: Thiếu tiêu đề đề thi`
      if (!['Dễ', 'Trung bình', 'Khó'].includes(row.difficulty)) return `Dòng ${idx}: Độ khó phải là Dễ, Trung bình, hoặc Khó`
      if (!row.question_number) return `Dòng ${idx}: Thiếu số thứ tự câu hỏi`
      if (!row.correct_answer?.trim()) return `Dòng ${idx}: Thiếu đáp án đúng`
      const start = row.audio_start_seconds?.toString().trim()
      const end = row.audio_end_seconds?.toString().trim()
      if (start && !/^\d+$/.test(start)) return `Dòng ${idx}: audio_start_seconds phải là số giây nguyên`
      if (end && !/^\d+$/.test(end)) return `Dòng ${idx}: audio_end_seconds phải là số giây nguyên`
      if (start && end && Number(end) < Number(start)) return `Dòng ${idx}: audio_end_seconds phải lớn hơn hoặc bằng audio_start_seconds`
      return null
    },
    importData: async (rows, client) => {
      const testMap = new Map<string, { testInfo: any; questions: any[] }>()
      for (const r of rows) {
        if (!testMap.has(r.test_id)) {
          testMap.set(r.test_id, {
            testInfo: {
              id: r.test_id.trim(),
              exam_id: r.exam_id,
              skill: r.skill,
              title: r.title.trim(),
              subtitle: r.subtitle?.trim() || null,
              difficulty: r.difficulty,
              time_minutes: parseInt(r.time_minutes) || 20,
              passage_title: r.passage_title?.trim() || null,
              passage_content: r.passage_content?.trim() || null,
              audio_url: r.audio_url?.trim() || null,
              audio_title: r.audio_title?.trim() || null,
              is_published: false,
            },
            questions: [],
          })
        }
        testMap.get(r.test_id)!.questions.push(r)
      }

      let okCount = 0
      const errors: { row: number; reason: string }[] = []
      let rowIdx = 1

      for (const [, item] of testMap) {
        item.testInfo.total_questions = item.questions.length

        const { error: tErr } = await client
          .from('exam_tests')
          .upsert(item.testInfo, { onConflict: 'id' })

        if (tErr) {
          errors.push({ row: rowIdx, reason: `Lỗi lưu đề thi: ${tErr.message}` })
          rowIdx += item.questions.length
          continue
        }

        const questionPayloads = item.questions.map((q) => {
          let opts: any = null
          try {
            if (q.options) opts = JSON.parse(q.options)
          } catch {}

          return {
            test_id: item.testInfo.id,
            question_number: parseInt(q.question_number),
            type: q.question_type,
            question_text: q.question_text?.trim() || '',
            options: opts,
            correct_answer: q.correct_answer.trim(),
            explanation: q.explanation?.trim() || 'Giải thích đáp án',
            category_tag: q.category_tag?.trim() || null,
            passage_section_ref: q.passage_section_ref?.trim() || null,
            // Dẫn chứng cho phần giải thích (cột tuỳ chọn)
            evidence_quote: q.evidence_quote?.trim() || null,
            audio_start_seconds: q.audio_start_seconds !== undefined && q.audio_start_seconds !== '' ? parseInt(q.audio_start_seconds) : null,
            audio_end_seconds: q.audio_end_seconds !== undefined && q.audio_end_seconds !== '' ? parseInt(q.audio_end_seconds) : null,
          }
        })

        // Xóa câu cũ của đề thi rồi nạp lại để tránh trùng lặp
        await client.from('exam_questions').delete().eq('test_id', item.testInfo.id)
        const { error: qErr } = await client
          .from('exam_questions')
          .insert(questionPayloads)

        if (qErr) {
          errors.push({ row: rowIdx, reason: `Lỗi lưu câu hỏi: ${qErr.message}` })
        } else {
          okCount += item.questions.length
        }
        rowIdx += item.questions.length
      }

      return { okCount, errors }
    },
  },
}
