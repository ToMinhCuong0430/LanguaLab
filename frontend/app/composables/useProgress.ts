import type { Database } from '~/types/database.types'

export type IeltsSkillKey = 'listening' | 'reading' | 'writing' | 'speaking'

export const SKILL_ORDER: IeltsSkillKey[] = ['listening', 'reading', 'writing', 'speaking']
export const SKILL_LABELS: Record<IeltsSkillKey, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
}

export interface TimelinePoint {
  attempt_id: string
  skill: IeltsSkillKey
  band: number
  completed_at: string
  test_title: string
  mode: 'practice' | 'exam'
}

export interface CategoryStat {
  skill: IeltsSkillKey
  category: string
  total: number
  correct: number
  accuracy: number
  attempts: number
  last_at: string
  is_weak: boolean
}

export interface ProgressData {
  timeline: TimelinePoint[]
  categories: CategoryStat[]
  weaknesses: Pick<CategoryStat, 'skill' | 'category' | 'accuracy' | 'attempts' | 'total'>[]
  skills: Partial<Record<IeltsSkillKey, { attempts: number; best_band: number | null; avg_band: number | null; latest_band: number | null; latest_at: string | null }>>
  totals: { attempts: number; answered: number; correct: number }
  rules: { weak_accuracy: number; weak_min_attempts: number }
}

export interface StudyPlanItem {
  id: string
  day_number: number
  sort_order: number
  item_type: 'practice' | 'skill_building' | 'mock_test' | 'review'
  skill: IeltsSkillKey | null
  category: string | null
  title: string
  description: string
  link: string | null
  estimated_minutes: number
  completed_at: string | null
}

export interface StudyPlan {
  id: string
  duration_days: 7 | 14 | 30
  start_date: string
  focus: { skill: IeltsSkillKey; category: string | null; score: number | null; source: string }[]
  created_at: string
  items: StudyPlanItem[]
}

export interface DiagnosticQuestion {
  id: string
  number: number
  type: string
  text: string
  options: { id: string; text: string }[] | null
  category: string
}

export interface DiagnosticGroup {
  test_id: string
  skill: 'reading' | 'listening'
  title: string
  passage_title: string | null
  passage_content: string | null
  audio_title: string | null
  audio_script: string | null
  audio_url: string | null
  questions: DiagnosticQuestion[]
}

export interface DiagnosticResult {
  id: string
  results: {
    skills: Partial<Record<IeltsSkillKey, { source: 'test' | 'self'; band: number; correct?: number; total?: number; accuracy?: number; rating?: number }>>
    categories: { skill: IeltsSkillKey; category: string; correct: number; total: number; accuracy: number }[]
  }
}

// Thông báo lỗi tiếng Việt từ RPC (RAISE EXCEPTION trong SQL) hoặc lỗi mạng
const toMessage = (err: { message?: string } | null | undefined, fallback: string) => {
  const msg = err?.message || ''
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'
  return msg || fallback
}

export const useProgress = () => {
  const client = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const config = useRuntimeConfig()

  const isUseMock = computed(() => config.public.useMock === true || config.public.useMock === 'true')
  // Analytics cần dữ liệu thật trên máy chủ và tài khoản đăng nhập
  const unavailableReason = computed(() => {
    if (isUseMock.value) return 'Ứng dụng đang chạy với dữ liệu mẫu nên chưa có số liệu tiến độ thật.'
    if (!user.value) return 'Đăng nhập để xem tiến độ và lộ trình học của bạn.'
    return null
  })

  const rpc = async <T>(fn: string, args: Record<string, unknown>, fallback: string): Promise<T> => {
    const { data, error } = await (client as any).rpc(fn, args)
    if (error) throw new Error(toMessage(error, fallback))
    return data as T
  }

  const fetchProgress = () => rpc<ProgressData>('get_my_progress', {}, 'Không tải được số liệu tiến độ.')

  const fetchActivePlan = async (): Promise<StudyPlan | null> => {
    const { data, error } = await (client as any)
      .from('study_plans')
      .select('id, duration_days, start_date, focus, created_at, items:study_plan_items(id, day_number, sort_order, item_type, skill, category, title, description, link, estimated_minutes, completed_at)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(toMessage(error, 'Không tải được lộ trình học.'))
    if (!data) return null
    data.items.sort((a: StudyPlanItem, b: StudyPlanItem) => a.day_number - b.day_number || a.sort_order - b.sort_order)
    return data as StudyPlan
  }

  const fetchLatestDiagnostic = async (): Promise<{ id: string; created_at: string } | null> => {
    const { data, error } = await (client as any)
      .from('diagnostic_attempts')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(toMessage(error, 'Không tải được bài kiểm tra đầu vào.'))
    return data
  }

  const setItemDone = (itemId: string, done: boolean) =>
    rpc<string | null>('set_study_item_done', { p_item_id: itemId, p_done: done }, 'Không cập nhật được trạng thái.')

  const createPlan = (duration: 7 | 14 | 30, diagnosticId?: string | null) =>
    rpc<string>('create_study_plan', { p_duration: duration, p_diagnostic_id: diagnosticId ?? null }, 'Không tạo được lộ trình.')

  const fetchDiagnosticQuestions = (skills: IeltsSkillKey[], perSkill = 6) =>
    rpc<DiagnosticGroup[]>('get_diagnostic_questions', { p_skills: skills, p_per_skill: perSkill }, 'Không tải được câu hỏi kiểm tra.')

  const submitDiagnostic = (skills: IeltsSkillKey[], answers: { question_id: string; user_answer: string }[], selfRatings: Partial<Record<'writing' | 'speaking', number[]>>) =>
    rpc<DiagnosticResult>('submit_diagnostic', { p_skills: skills, p_answers: answers, p_self_ratings: selfRatings }, 'Không nộp được bài kiểm tra.')

  return {
    unavailableReason,
    fetchProgress,
    fetchActivePlan,
    fetchLatestDiagnostic,
    setItemDone,
    createPlan,
    fetchDiagnosticQuestions,
    submitDiagnostic,
  }
}

// Ngày hiện tại trong lộ trình (1-based), giới hạn trong [1, duration]
export const currentPlanDay = (plan: Pick<StudyPlan, 'start_date' | 'duration_days'>) => {
  const start = new Date(`${plan.start_date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1
  return Math.min(Math.max(diff, 1), plan.duration_days)
}
