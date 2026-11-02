import type { Database } from '~/types/database.types'

export interface VocabLevelInfo {
  id: string
  level_number: number
  code: string
  title: string
  cefr_equivalent: string | null
  description: string | null
}

export const useVocabLevels = () => {
  const client = useSupabaseClient<Database>()
  const levels = useState<VocabLevelInfo[]>('vocab_levels_global_cache', () => [])
  const isLoading = useState<boolean>('vocab_levels_loading', () => false)

  const fetchLevels = async () => {
    if (levels.value.length > 0) return levels.value
    isLoading.value = true
    try {
      const { data, error } = await client
        .from('vocab_levels')
        .select('*')
        .order('level_number', { ascending: true })

      if (!error && data && data.length > 0) {
        levels.value = data as VocabLevelInfo[]
      }
    } catch (err) {
      console.warn('Lỗi khi tải vocab_levels:', err)
    } finally {
      isLoading.value = false
    }
    return levels.value
  }

  const getLevelTitle = (levelNumber?: number): string => {
    if (!levelNumber) return ''
    const found = levels.value.find(l => l.level_number === levelNumber)
    return found ? found.title : ''
  }

  const getLevelInfo = (levelNumber?: number): VocabLevelInfo | undefined => {
    if (!levelNumber) return undefined
    return levels.value.find(l => l.level_number === levelNumber)
  }

  return {
    levels,
    isLoading,
    fetchLevels,
    getLevelTitle,
    getLevelInfo,
  }
}
