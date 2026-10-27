import type { Database } from '~/types/database.types'

export type SearchGroupKey = 'vocab' | 'grammar' | 'media' | 'reading' | 'dictionary' | 'typing'

export interface GlobalSearchResultItem {
  id: string
  title: string
  subtitle?: string
  path: string
  group: SearchGroupKey
  groupLabel: string
  badgeTone?: string
}

export interface SearchGroupResult {
  group: SearchGroupKey
  label: string
  color: string
  items: GlobalSearchResultItem[]
}

/**
 * Escape các ký tự đại diện trong câu truy vấn LIKE / ILIKE của PostgreSQL
 */
export function escapeLikeQuery(str: string): string {
  return str.replace(/[%_\\]/g, '\\$&')
}

export function useGlobalSearch() {
  const client = useSupabaseClient<Database>()
  const searchQuery = ref('')
  const isSearching = ref(false)
  const results = ref<SearchGroupResult[]>([])
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // Cấu hình nhãn & màu sắc từng nhóm kết quả
  const GROUP_METAS: Record<SearchGroupKey, { label: string; color: string }> = {
    vocab: { label: 'Từ vựng', color: 'var(--c-pink)' },
    grammar: { label: 'Ngữ pháp', color: 'var(--c-yellow)' },
    media: { label: 'Video & Podcast', color: 'var(--c-blue)' },
    reading: { label: 'Bài đọc & Dịch', color: 'var(--c-orange)' },
    dictionary: { label: 'Từ điển', color: 'var(--c-violet)' },
    typing: { label: 'Gõ câu', color: 'var(--c-green)' },
  }

  const performSearch = async (queryText: string) => {
    const raw = queryText.trim()
    if (raw.length < 2) {
      results.value = []
      isSearching.value = false
      return
    }

    isSearching.value = true
    const safeQuery = `%${escapeLikeQuery(raw)}%`

    try {
      // Chạy song song 6 truy vấn bằng Promise.allSettled
      const [vocabRes, grammarRes, mediaRes, readingRes, dictRes, typingRes] = await Promise.allSettled([
        // 1. Vocab words
        client
          .from('vocab_words')
          .select('id, word, meaning_vi, set_id')
          .ilike('word', safeQuery)
          .limit(5),

        // 2. Grammar points (chỉ lấy đã xuất bản)
        client
          .from('grammar_points')
          .select('id, title, vietnamese_title, level')
          .or(`title.ilike.${safeQuery},vietnamese_title.ilike.${safeQuery}`)
          .limit(5),

        // 3. Media items (video / podcast đã xuất bản)
        client
          .from('media_items')
          .select('id, title, vietnamese_title, media_type')
          .or(`title.ilike.${safeQuery},vietnamese_title.ilike.${safeQuery}`)
          .limit(5),

        // 4. Reading items (đã xuất bản)
        client
          .from('reading_items')
          .select('id, title, vietnamese_title, content_type')
          .or(`title.ilike.${safeQuery},vietnamese_title.ilike.${safeQuery}`)
          .limit(5),

        // 5. Dictionary entries
        client
          .from('dictionary_entries')
          .select('id, headword, language')
          .ilike('headword', safeQuery)
          .limit(5),

        // 6. Typing topics (đã xuất bản)
        client
          .from('typing_topics')
          .select('id, title, group_type')
          .ilike('title', safeQuery)
          .limit(5),
      ])

      const grouped: SearchGroupResult[] = []

      // 1. Map Vocab
      if (vocabRes.status === 'fulfilled' && vocabRes.value.data) {
        const items: GlobalSearchResultItem[] = vocabRes.value.data.map(v => ({
          id: v.id,
          title: v.word,
          subtitle: v.meaning_vi,
          path: '/tu-vung',
          group: 'vocab',
          groupLabel: GROUP_METAS.vocab.label,
        }))
        if (items.length > 0) {
          grouped.push({ group: 'vocab', label: GROUP_METAS.vocab.label, color: GROUP_METAS.vocab.color, items })
        }
      }

      // 2. Map Grammar
      if (grammarRes.status === 'fulfilled' && grammarRes.value.data) {
        const items: GlobalSearchResultItem[] = grammarRes.value.data.map(g => ({
          id: g.id,
          title: g.vietnamese_title || g.title,
          subtitle: `${g.level} • ${g.title}`,
          path: `/ngu-phap/${g.id}`,
          group: 'grammar',
          groupLabel: GROUP_METAS.grammar.label,
        }))
        if (items.length > 0) {
          grouped.push({ group: 'grammar', label: GROUP_METAS.grammar.label, color: GROUP_METAS.grammar.color, items })
        }
      }

      // 3. Map Media
      if (mediaRes.status === 'fulfilled' && mediaRes.value.data) {
        const items: GlobalSearchResultItem[] = mediaRes.value.data.map(m => ({
          id: m.id,
          title: m.title,
          subtitle: m.vietnamese_title || m.media_type,
          path: `/video-podcast/${m.id}`,
          group: 'media',
          groupLabel: GROUP_METAS.media.label,
        }))
        if (items.length > 0) {
          grouped.push({ group: 'media', label: GROUP_METAS.media.label, color: GROUP_METAS.media.color, items })
        }
      }

      // 4. Map Reading
      if (readingRes.status === 'fulfilled' && readingRes.value.data) {
        const items: GlobalSearchResultItem[] = readingRes.value.data.map(r => ({
          id: r.id,
          title: r.title,
          subtitle: r.vietnamese_title || r.content_type,
          path: `/doc-dich/${r.id}`,
          group: 'reading',
          groupLabel: GROUP_METAS.reading.label,
        }))
        if (items.length > 0) {
          grouped.push({ group: 'reading', label: GROUP_METAS.reading.label, color: GROUP_METAS.reading.color, items })
        }
      }

      // 5. Map Dictionary
      if (dictRes.status === 'fulfilled' && dictRes.value.data) {
        const items: GlobalSearchResultItem[] = dictRes.value.data.map(d => ({
          id: d.id,
          title: d.headword,
          subtitle: `Ngôn ngữ: ${d.language.toUpperCase()}`,
          path: `/tu-dien/${encodeURIComponent(d.headword)}`,
          group: 'dictionary',
          groupLabel: GROUP_METAS.dictionary.label,
        }))
        if (items.length > 0) {
          grouped.push({ group: 'dictionary', label: GROUP_METAS.dictionary.label, color: GROUP_METAS.dictionary.color, items })
        }
      }

      // 6. Map Typing
      if (typingRes.status === 'fulfilled' && typingRes.value.data) {
        const items: GlobalSearchResultItem[] = typingRes.value.data.map(t => ({
          id: t.id,
          title: t.title,
          subtitle: `Nhóm ${t.group_type === 'life' ? 'Đời sống' : 'Công việc'}`,
          path: `/go-cau/${t.id}`,
          group: 'typing',
          groupLabel: GROUP_METAS.typing.label,
        }))
        if (items.length > 0) {
          grouped.push({ group: 'typing', label: GROUP_METAS.typing.label, color: GROUP_METAS.typing.color, items })
        }
      }

      results.value = grouped
    } catch (e) {
      console.warn('Lỗi trong quá trình tìm kiếm toàn cục:', e)
    } finally {
      isSearching.value = false
    }
  }

  // Watch và debounce 300ms
  watch(searchQuery, (newVal) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    if (!newVal || newVal.trim().length < 2) {
      results.value = []
      isSearching.value = false
      return
    }
    debounceTimer = setTimeout(() => {
      performSearch(newVal)
    }, 300)
  })

  const clearSearch = () => {
    searchQuery.value = ''
    results.value = []
    isSearching.value = false
  }

  return {
    searchQuery,
    isSearching,
    results,
    clearSearch,
  }
}
