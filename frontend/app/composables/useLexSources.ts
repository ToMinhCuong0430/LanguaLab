/**
 * composables/useLexSources.ts
 * Truy vấn danh sách nguồn dữ liệu từ vựng và giấy phép mở từ bảng public.lex_sources.
 * Chỉ đọc (read-only), không để lộ cột nội bộ license_verified.
 */

export interface LexSource {
  id: string
  code: string
  name: string
  description: string | null
  source_url: string | null
  license_name: string | null
  license_url: string | null
  attribution_text: string | null
  requires_share_alike: boolean | null
}

export const useLexSources = () => {
  const client = useSupabaseClient<any>()
  const sources = ref<LexSource[]>([])
  const isLoading = ref(true)
  const errorMessage = ref<string | null>(null)

  const fetchSources = async () => {
    isLoading.value = true
    errorMessage.value = null

    try {
      const { data, error } = await client
        .from('lex_sources')
        .select('id, code, name, description, source_url, license_name, license_url, attribution_text, requires_share_alike')
        .order('created_at', { ascending: true })

      if (error) {
        throw error
      }

      sources.value = (data || []) as LexSource[]
    } catch (err: any) {
      errorMessage.value = 'Không thể tải danh sách nguồn học liệu lúc này. Vui lòng thử lại sau.'
      console.warn('[useLexSources] Lỗi tải nguồn dữ liệu:', err.message || err)
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    fetchSources()
  })

  return {
    sources,
    isLoading,
    errorMessage,
    refresh: fetchSources,
  }
}
