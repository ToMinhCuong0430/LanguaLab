import type { Database } from '~/types/database.types'
import type { IeltsSkillKey, ProgressData } from '~/composables/useProgress'

export type AppRole = 'student' | 'teacher' | 'admin'

export interface ClassSummary {
  id: string
  name: string
  description: string | null
  join_code: string
  is_archived: boolean
  created_at: string
  member_count: number
  pending_invites: number
  assignment_count: number
  active_7d: number
}

export interface ReviewItem {
  attempt_id: string
  student_id: string
  student_name: string | null
  class_name: string
  skill: IeltsSkillKey
  test_title: string
  band: number | null
  completed_at: string
}

export interface AssignmentStatus {
  done: boolean
  attempts: number
  best_band: number | null
  last_at: string | null
  late: boolean | null
}

export interface ClassMember {
  student_id: string
  full_name: string | null
  avatar_text: string | null
  avatar_url: string | null
  email: string
  joined_at: string
  joined_via: 'code' | 'invite'
  target_band: number | null
  attempts: number
  last_active: string | null
  bands: Partial<Record<IeltsSkillKey, number>>
  weak_count: number
}

export interface ClassAssignment {
  id: string
  title: string
  instructions: string | null
  due_at: string | null
  created_at: string
  test_id: string
  skill: IeltsSkillKey
  test_title: string
  student_ids: string[] | null
  recipients: { student_id: string; full_name: string | null; status: AssignmentStatus }[]
}

export interface ClassDetail {
  class: { id: string; name: string; description: string | null; join_code: string; is_archived: boolean; created_at: string }
  members: ClassMember[]
  invites: { id: string; email: string; created_at: string }[]
  assignments: ClassAssignment[]
}

export interface AssignableTest {
  id: string
  title: string
  skill: IeltsSkillKey
  subtitle: string | null
  time_minutes: number
  is_published: boolean
}

export interface HistoryItem {
  attempt_id: string
  test_id: string
  test_title: string
  skill: IeltsSkillKey
  mode: 'practice' | 'exam'
  band: number | null
  raw_score: number | null
  total_questions: number
  completed_at: string
  duration_seconds: number
  ai: { status: string; overall_band: number | null; summary: string | null; criteria: Record<string, { band: number; feedback: string }> | null; submission_text: string; provider: string | null } | null
  my_feedback: { comment: string | null; override_band: number | null; updated_at: string } | null
}

export interface StudentProgress extends ProgressData {
  student: { id: string; full_name: string | null; avatar_text: string | null; avatar_url: string | null; target_band: number | null; target_exam: string | null; email: string }
  history: HistoryItem[]
}

export interface MyClasses {
  classes: { id: string; name: string; description: string | null; joined_at: string; is_archived: boolean; teacher: { id: string; full_name: string | null; avatar_text: string | null; avatar_url: string | null } }[]
  invites: { id: string; class_id: string; class_name: string; teacher_name: string | null; created_at: string }[]
  assignments: { id: string; class_id: string; class_name: string; title: string; instructions: string | null; due_at: string | null; created_at: string; test_id: string; skill: IeltsSkillKey; test_title: string; personal: boolean; status: AssignmentStatus }[]
  feedback: { id: string; attempt_id: string; comment: string | null; override_band: number | null; ai_band: number | null; updated_at: string; teacher_name: string | null; test_title: string; skill: IeltsSkillKey; completed_at: string }[]
}

const toMessage = (err: { message?: string } | null | undefined, fallback: string) => {
  const msg = err?.message || ''
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'
  return msg || fallback
}

export const useClasses = () => {
  const client = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  // Vai trò dùng chung toàn app, tải một lần cho mỗi phiên đăng nhập
  const role = useState<AppRole | null>('app-role', () => null)
  const roleFor = useState<string | null>('app-role-user', () => null)

  const rpc = async <T>(fn: string, args: Record<string, unknown> = {}, fallback = 'Có lỗi xảy ra, hãy thử lại.'): Promise<T> => {
    const { data, error } = await (client as any).rpc(fn, args)
    if (error) throw new Error(toMessage(error, fallback))
    return data as T
  }

  const loadRole = async (): Promise<AppRole> => {
    const uid = user.value?.sub ?? null
    if (!uid) {
      role.value = null
      roleFor.value = null
      return 'student'
    }
    if (role.value && roleFor.value === uid) return role.value
    try {
      role.value = await rpc<AppRole>('current_app_role')
    } catch {
      role.value = 'student'
    }
    roleFor.value = uid
    return role.value
  }

  const isTeacher = computed(() => role.value === 'teacher' || role.value === 'admin')

  return {
    role,
    isTeacher,
    loadRole,
    // Giáo viên
    getTeacherOverview: () => rpc<{ classes: ClassSummary[]; to_review: ReviewItem[] }>('get_teacher_overview', {}, 'Không tải được danh sách lớp.'),
    createClass: (name: string, description?: string) => rpc<string>('create_class', { p_name: name, p_description: description ?? null }, 'Không tạo được lớp.'),
    updateClass: (id: string, name: string, description: string | null, archived: boolean) =>
      rpc<void>('update_class', { p_class: id, p_name: name, p_description: description, p_archived: archived }, 'Không cập nhật được lớp.'),
    regenerateCode: (id: string) => rpc<string>('regenerate_join_code', { p_class: id }, 'Không đổi được mã lớp.'),
    getClassDetail: (id: string) => rpc<ClassDetail>('get_class_detail', { p_class: id }, 'Không tải được lớp.'),
    inviteToClass: (id: string, emails: string[]) =>
      rpc<{ invited: string[]; already_members: string[]; invalid: string[] }>('invite_to_class', { p_class: id, p_emails: emails }, 'Không gửi được lời mời.'),
    revokeInvite: (inviteId: string) => rpc<void>('revoke_invite', { p_invite: inviteId }, 'Không huỷ được lời mời.'),
    removeMember: (classId: string, studentId: string) => rpc<void>('remove_class_member', { p_class: classId, p_student: studentId }, 'Không xoá được học viên.'),
    listAssignableTests: () => rpc<AssignableTest[]>('list_assignable_tests', {}, 'Không tải được danh sách đề.'),
    createAssignment: (input: { classId: string; testId: string; title: string; instructions?: string; dueAt?: string | null; studentIds?: string[] | null }) =>
      rpc<string>('create_assignment', {
        p_class: input.classId,
        p_test_id: input.testId,
        p_title: input.title,
        p_instructions: input.instructions ?? null,
        p_due_at: input.dueAt ?? null,
        p_student_ids: input.studentIds?.length ? input.studentIds : null,
      }, 'Không giao được bài.'),
    deleteAssignment: (id: string) => rpc<void>('delete_assignment', { p_assignment: id }, 'Không xoá được bài đã giao.'),
    getStudentProgress: (studentId: string) => rpc<StudentProgress>('get_student_progress', { p_student: studentId }, 'Không tải được tiến độ học viên.'),
    saveFeedback: (attemptId: string, comment: string, overrideBand: number | null) =>
      rpc<{ band_score: number | null; ai_band: number | null }>('upsert_teacher_feedback', { p_attempt: attemptId, p_comment: comment, p_override_band: overrideBand }, 'Không lưu được nhận xét.'),
    // Học viên
    getMyClasses: () => rpc<MyClasses>('get_my_classes', {}, 'Không tải được lớp của bạn.'),
    joinClass: (code: string) => rpc<{ class_id: string; name: string }>('join_class', { p_code: code }, 'Không tham gia được lớp.'),
    respondInvite: (inviteId: string, accept: boolean) => rpc<void>('respond_invite', { p_invite: inviteId, p_accept: accept }, 'Không phản hồi được lời mời.'),
    leaveClass: (classId: string) => rpc<void>('leave_class', { p_class: classId }, 'Không rời được lớp.'),
    // Admin
    setUserRole: (email: string, newRole: AppRole) => rpc<{ email: string; role: AppRole }>('set_user_role', { p_email: email, p_role: newRole }, 'Không cấp được vai trò.'),
    listStaff: () => rpc<{ user_id: string; email: string; full_name: string | null; role: 'teacher' | 'admin'; class_count: number }[]>('list_staff', {}, 'Không tải được danh sách.'),
  }
}

export const formatDate = (iso: string | null | undefined, withTime = false) =>
  iso
    ? new Date(iso).toLocaleDateString('vi-VN', withTime ? { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: '2-digit', year: 'numeric' })
    : ''
