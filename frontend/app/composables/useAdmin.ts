import type { Database } from '~/types/database.types'
import type { AppRole } from '~/composables/useClasses'

// Quản trị nền tảng: người dùng, duyệt nội dung, nhật ký hoạt động, thống kê.
// Mọi kiểm tra quyền nằm trong RPC (migration 15); composable chỉ gọi và chuẩn hoá lỗi.

export type ReviewStatus = 'draft' | 'pending' | 'published'
export type ReviewType = 'vocab' | 'typing' | 'grammar' | 'reading' | 'media' | 'ielts'

export interface AdminUserRow {
  id: string
  email: string
  full_name: string | null
  avatar_text: string | null
  avatar_url: string | null
  role: AppRole
  created_at: string
  last_sign_in_at: string | null
  is_banned: boolean
  banned_until: string | null
  ban_reason: string | null
  attempts: number
  last_active: string | null
}

export interface AdminUserList {
  total: number
  rows: AdminUserRow[]
  counts: { all: number; student: number; teacher: number; admin: number; banned: number }
}

export interface AuditEntry {
  id: number
  actor_id: string | null
  actor_email: string | null
  actor_name: string | null
  action: 'insert' | 'update' | 'delete' | 'import' | 'review' | 'role' | 'ban' | 'unban'
  entity_type: string
  entity_ids: string[]
  summary: string
  details: Record<string, any>
  created_at: string
}

export interface AuditList {
  total: number
  rows: AuditEntry[]
  actors: { id: string; email: string }[]
  entities: string[]
}

export interface PlatformStats {
  days: number
  totals: {
    users: number
    new_users: number
    new_users_7d: number
    active_7d: number
    active_today: number
    attempts: number
    banned: number
  }
  daily: { date: string; new_users: number; active_users: number }[]
  top_tests: { id: string; title: string; skill: string; attempts: number; users: number; avg_band: number | null }[]
  retention: {
    cohort_size: number
    retained: number
    rate: number | null
    weeks: { week: string; size: number; retained: number; rate: number | null }[]
  }
}

export type ReviewCounts = Record<ReviewType, { draft: number; pending: number; published: number; total: number }>

export interface ReviewResult {
  updated: number
  skipped: { id: string; title: string; reason: string }[]
}

export const REVIEW_LABEL: Record<ReviewStatus, string> = {
  draft: 'Bản nháp',
  pending: 'Chờ duyệt',
  published: 'Đã xuất bản',
}

export const ROLE_LABEL: Record<AppRole, string> = {
  student: 'Học viên',
  teacher: 'Giáo viên',
  admin: 'Quản trị viên',
}

const toMessage = (err: { message?: string } | null | undefined, fallback: string) => {
  const msg = err?.message || ''
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'
  return msg || fallback
}

export const useAdmin = () => {
  const client = useSupabaseClient<Database>()

  const rpc = async <T>(fn: string, args: Record<string, unknown> = {}, fallback = 'Có lỗi xảy ra, hãy thử lại.'): Promise<T> => {
    const { data, error } = await (client as any).rpc(fn, args)
    if (error) throw new Error(toMessage(error, fallback))
    return data as T
  }

  // Người dùng
  const listUsers = (opts: { search?: string; role?: AppRole | null; status?: 'active' | 'banned' | null; limit?: number; offset?: number }) =>
    rpc<AdminUserList>('admin_list_users', {
      p_search: opts.search?.trim() || null,
      p_role: opts.role || null,
      p_status: opts.status || null,
      p_limit: opts.limit ?? 20,
      p_offset: opts.offset ?? 0,
    }, 'Không tải được danh sách người dùng.')

  const setRole = (userId: string, role: AppRole) =>
    rpc<void>('admin_set_user_role', { p_user: userId, p_role: role }, 'Không đổi được vai trò.')

  // days = null: khoá vĩnh viễn
  const banUser = (userId: string, reason: string, days: number | null) =>
    rpc<void>('admin_ban_user', { p_user: userId, p_reason: reason, p_days: days }, 'Không khoá được tài khoản.')

  const unbanUser = (userId: string) =>
    rpc<void>('admin_unban_user', { p_user: userId }, 'Không mở khoá được tài khoản.')

  // Duyệt nội dung
  const setReviewStatus = (type: ReviewType, ids: string[], status: ReviewStatus, note?: string) =>
    rpc<ReviewResult>('set_review_status', { p_type: type, p_ids: ids, p_status: status, p_note: note?.trim() || null }, 'Không cập nhật được trạng thái duyệt.')

  const reviewCounts = () => rpc<ReviewCounts>('admin_review_counts', {}, 'Không tải được số liệu duyệt.')

  const reviewHistory = async (type: ReviewType, id: string) => {
    const { data, error } = await (client as any)
      .from('content_reviews')
      .select('id, from_status, to_status, note, created_at, actor_id')
      .eq('content_type', type)
      .eq('content_id', id)
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) throw new Error(toMessage(error, 'Không tải được lịch sử duyệt.'))
    return (data ?? []) as { id: number; from_status: ReviewStatus; to_status: ReviewStatus; note: string | null; created_at: string; actor_id: string | null }[]
  }

  // Nhật ký & thống kê
  const listAudit = (opts: { action?: string | null; entity?: string | null; actor?: string | null; limit?: number; offset?: number }) =>
    rpc<AuditList>('admin_list_audit', {
      p_action: opts.action || null,
      p_entity: opts.entity || null,
      p_actor: opts.actor || null,
      p_limit: opts.limit ?? 30,
      p_offset: opts.offset ?? 0,
    }, 'Không tải được nhật ký.')

  const platformStats = (days = 30) => rpc<PlatformStats>('admin_platform_stats', { p_days: days }, 'Không tải được thống kê.')

  return { listUsers, setRole, banUser, unbanUser, setReviewStatus, reviewCounts, reviewHistory, listAudit, platformStats }
}

export const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return '–'
  const d = new Date(iso)
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const formatRelative = (iso: string | null | undefined) => {
  if (!iso) return 'Chưa có'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'Vừa xong'
  if (min < 60) return `${min} phút trước`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.round(h / 24)
  if (d < 30) return `${d} ngày trước`
  return new Date(iso).toLocaleDateString('vi-VN')
}
