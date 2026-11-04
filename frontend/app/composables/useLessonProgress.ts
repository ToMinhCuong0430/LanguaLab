import type { Database } from '~/types/database.types'
import { translateSupabaseError } from '~/utils/supabaseErrors'

// Bài học đang dở (bảng lesson_progress, migration 16): mỗi user một dòng cho mỗi chức năng.
// Phiên học ghi đè dòng mỗi khi sang câu / thẻ / bài tiếp theo và xoá khi học xong; trang chủ đọc dòng mới nhất.
export type LessonFeature = 'go-cau' | 'tu-vung' | 'ngu-phap'

export interface LessonProgressRow {
  feature: LessonFeature
  resource_id: string
  resource_title: string
  current_index: number
  total_count: number
  link: string
  updated_at: string
}

export interface SaveProgressInput {
  feature: LessonFeature
  resourceId: string
  resourceTitle: string
  currentIndex: number // 0-based: câu / thẻ / bài sẽ làm tiếp
  totalCount: number
  link: string // đường dẫn nội bộ mở lại đúng chỗ
}

type Result = { success: true } | { success: false; error: string }

// Đọc vị trí cần mở lại từ query (?cau=3 / ?the=3 / ?bai=3, đếm từ 1), trả về index 0-based hợp lệ
export const resumeIndexFromQuery = (value: unknown, total: number) => {
  const n = Number(Array.isArray(value) ? value[0] : value)
  if (!Number.isInteger(n) || n < 1 || total < 1) return 0
  return Math.min(n, total) - 1
}

export const useLessonProgress = () => {
  const client = useSupabaseClient<Database>()
  const authUser = useSupabaseUser()

  const uid = () => authUser.value?.sub ?? null

  const save = async (input: SaveProgressInput): Promise<Result> => {
    const userId = uid()
    // Chưa đăng nhập hoặc dữ liệu chưa sẵn sàng: không có gì để lưu
    if (!userId || input.totalCount < 1) return { success: true }
    const currentIndex = Math.min(Math.max(0, input.currentIndex), input.totalCount - 1)
    const { error } = await (client as any).from('lesson_progress').upsert(
      {
        user_id: userId,
        feature: input.feature,
        resource_id: input.resourceId,
        resource_title: input.resourceTitle.slice(0, 300),
        current_index: currentIndex,
        total_count: input.totalCount,
        link: input.link,
      },
      { onConflict: 'user_id,feature' },
    )
    return error ? { success: false, error: translateSupabaseError(error) } : { success: true }
  }

  // Xoá khi học xong; chỉ xoá nếu dòng đang trỏ vào đúng bài này (không xoá tiến độ của bài khác cùng chức năng)
  const clear = async (feature: LessonFeature, resourceId: string): Promise<Result> => {
    const userId = uid()
    if (!userId) return { success: true }
    const { error } = await (client as any)
      .from('lesson_progress')
      .delete()
      .eq('user_id', userId)
      .eq('feature', feature)
      .eq('resource_id', resourceId)
    return error ? { success: false, error: translateSupabaseError(error) } : { success: true }
  }

  const latest = async (): Promise<LessonProgressRow | null> => {
    const userId = uid()
    if (!userId) return null
    const { data, error } = await (client as any)
      .from('lesson_progress')
      .select('feature, resource_id, resource_title, current_index, total_count, link, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(translateSupabaseError(error))
    return (data as LessonProgressRow | null) ?? null
  }

  return { save, clear, latest }
}
