import type { Database } from '~/types/database.types'

export type { IeltsSkill, QuestionType, ExamMode as TestMode } from '~/types/database.types'

export interface QuestionOption {
  id: string
  text: string
}

export interface IeltsQuestion {
  id: number
  type: QuestionType
  questionText: string
  options?: QuestionOption[]
  correctAnswer: string
  explanation: string
  categoryTag: string
  passageSectionRef?: string
}

export interface IeltsTestDetail {
  id: string
  skill: IeltsSkill
  title: string
  subtitle: string
  difficulty: 'Dễ' | 'Trung bình' | 'Khó'
  timeMinutes: number
  totalQuestions: number
  categoryTags: string[]
  status: 'chua_lam' | 'dang_lam' | 'da_xong'
  bestScore?: {
    raw: number
    band: number
  }
  passageTitle?: string
  passageContent?: string
  audioTitle?: string
  audioDurationSeconds?: number
  audioScript?: string
  taskNumber?: 1 | 2
  promptRequirements?: string
  minWords?: number
  partNumber?: 1 | 2 | 3
  prepTimeSeconds?: number
  speakTimeSeconds?: number
  prompts?: string[]
  questions: IeltsQuestion[]
}

export interface SkillOverview {
  skill: IeltsSkill
  name: string
  englishName: string
  currentBand: number
  targetBand: number
  completedTests: number
  totalTests: number
  tone: 'accent' | 'warn' | 'ok' | 'mark'
  iconName: string
  description: string
}

export interface RecentAttempt {
  id: string
  testId: string
  testTitle: string
  skill: IeltsSkill
  date: string
  mode: TestMode
  rawScore?: number
  totalQuestions?: number
  bandScore: number
  durationMinutes: number
}

// Bảng quy đổi điểm thô sang Band IELTS chuẩn
export const RAW_TO_BAND_LISTENING: Record<number, number> = {
  39: 9.0, 40: 9.0,
  37: 8.5, 38: 8.5,
  35: 8.0, 36: 8.0,
  32: 7.5, 33: 7.5, 34: 7.5,
  30: 7.0, 31: 7.0,
  26: 6.5, 27: 6.5, 28: 6.5, 29: 6.5,
  23: 6.0, 24: 6.0, 25: 6.0,
  18: 5.5, 19: 5.5, 20: 5.5, 21: 5.5, 22: 5.5,
  16: 5.0, 17: 5.0,
  13: 4.5, 14: 4.5, 15: 4.5,
  10: 4.0, 11: 4.0, 12: 4.0,
}

export const RAW_TO_BAND_READING_ACADEMIC: Record<number, number> = {
  39: 9.0, 40: 9.0,
  37: 8.5, 38: 8.5,
  35: 8.0, 36: 8.0,
  33: 7.5, 34: 7.5,
  30: 7.0, 31: 7.0, 32: 7.0,
  27: 6.5, 28: 6.5, 29: 6.5,
  23: 6.0, 24: 6.0, 25: 6.0, 26: 6.0,
  19: 5.5, 20: 5.5, 21: 5.5, 22: 5.5,
  15: 5.0, 16: 5.0, 17: 5.0, 18: 5.0,
  13: 4.5, 14: 4.5,
  10: 4.0, 11: 4.0, 12: 4.0,
}

export const convertRawToBand = (raw: number, total: number, skill: IeltsSkill): number => {
  const scaledScore = Math.round((raw / total) * 40)
  if (skill === 'listening') {
    return RAW_TO_BAND_LISTENING[scaledScore] || (scaledScore >= 39 ? 9.0 : scaledScore >= 6 ? 3.5 : 3.0)
  }
  return RAW_TO_BAND_READING_ACADEMIC[scaledScore] || (scaledScore >= 39 ? 9.0 : scaledScore >= 6 ? 3.5 : 3.0)
}

const DEFAULT_SKILLS_OVERVIEW: SkillOverview[] = [
  {
    skill: 'listening',
    name: 'Nghe hiểu',
    englishName: 'Listening',
    currentBand: 6.0,
    targetBand: 7.0,
    completedTests: 0,
    totalTests: 0,
    tone: 'accent',
    iconName: 'Headphones',
    description: '4 Section với đa dạng giọng đọc Anh, Úc, Mỹ và tốc độ tăng dần.',
  },
  {
    skill: 'reading',
    name: 'Đọc hiểu',
    englishName: 'Reading',
    currentBand: 6.5,
    targetBand: 7.5,
    completedTests: 0,
    totalTests: 0,
    tone: 'warn',
    iconName: 'BookOpen',
    description: '3 Passage học thuật với các dạng bài T/F/NG, Matching Headings.',
  },
  {
    skill: 'writing',
    name: 'Viết học thuật',
    englishName: 'Writing',
    currentBand: 5.5,
    targetBand: 6.5,
    completedTests: 0,
    totalTests: 0,
    tone: 'ok',
    iconName: 'PenTool',
    description: 'Task 1 phân tích biểu đồ và Task 2 bài luận nghị luận xã hội.',
  },
  {
    skill: 'speaking',
    name: 'Nói trực tiếp',
    englishName: 'Speaking',
    currentBand: 6.0,
    targetBand: 7.0,
    completedTests: 0,
    totalTests: 0,
    tone: 'mark',
    iconName: 'Mic',
    description: 'Part 1 phỏng vấn, Part 2 thuyết trình cá nhân và Part 3 thảo luận.',
  },
]

export const useIelts = () => {
  const client = useSupabaseClient<Database>()
  const authUser = useSupabaseUser()

  const isLoading = ref(false)
  const errorMsg = ref<string | null>(null)

  const skillsOverview = ref<SkillOverview[]>(DEFAULT_SKILLS_OVERVIEW)
  const recentAttempts = ref<RecentAttempt[]>([])
  const allTests = ref<IeltsTestDetail[]>([])

  // Tải đề thi thật 100% từ Supabase
  const fetchIeltsData = async () => {
    isLoading.value = true
    errorMsg.value = null

    try {
      // 1. Tải danh sách đề thi kèm câu hỏi
      const { data: testsData, error: testsErr } = await client
        .from('exam_tests')
        .select('*, exam_questions(*)')
        .eq('exam_id', 'ielts')
        .order('sort_order', { ascending: true })

      if (testsErr) {
        console.warn('Lỗi tải exam_tests:', testsErr.message)
      } else if (testsData && testsData.length > 0) {
        allTests.value = testsData.map((t: any) => ({
          id: t.id,
          skill: t.skill as IeltsSkill,
          title: t.title,
          subtitle: t.subtitle || '',
          difficulty: (t.difficulty as any) || 'Trung bình',
          timeMinutes: t.time_minutes,
          totalQuestions: t.total_questions || (t.exam_questions?.length || 0),
          categoryTags: t.category_tags || [],
          status: 'chua_lam',
          passageTitle: t.passage_title || undefined,
          passageContent: t.passage_content || undefined,
          audioTitle: t.audio_title || undefined,
          audioDurationSeconds: t.audio_duration_seconds || undefined,
          audioScript: t.audio_script || undefined,
          taskNumber: t.task_number || undefined,
          promptRequirements: t.prompt_requirements || undefined,
          minWords: t.min_words || undefined,
          partNumber: t.part_number || undefined,
          prepTimeSeconds: t.prep_time_seconds || undefined,
          speakTimeSeconds: t.speak_time_seconds || undefined,
          prompts: t.prompts || undefined,
          questions: (t.exam_questions || []).map((q: any) => ({
            id: q.question_number,
            type: q.type,
            questionText: q.question_text,
            options: (q.options as any) || undefined,
            correctAnswer: q.correct_answer,
            explanation: q.explanation,
            categoryTag: q.category_tag || '',
            passageSectionRef: q.passage_section_ref || undefined,
          })).sort((a: any, b: any) => a.id - b.id),
        }))

        // Cập nhật số đề thi theo kỹ năng
        skillsOverview.value = DEFAULT_SKILLS_OVERVIEW.map((sk) => {
          const count = allTests.value.filter((t) => t.skill === sk.skill).length
          return {
            ...sk,
            totalTests: count,
          }
        })
      }

      // 2. Tải lịch sử làm bài gần đây của người dùng nếu đã đăng nhập
      if (authUser.value?.id) {
        const { data: attemptsData, error: attemptsErr } = await client
          .from('exam_attempts')
          .select('*, exam_tests(title, skill)')
          .eq('user_id', authUser.value.id)
          .order('completed_at', { ascending: false })
          .limit(10)

        if (!attemptsErr && attemptsData && attemptsData.length > 0) {
          recentAttempts.value = attemptsData.map((a: any) => ({
            id: a.id,
            testId: a.test_id,
            testTitle: a.exam_tests?.title || a.test_id,
            skill: (a.exam_tests?.skill as IeltsSkill) || 'reading',
            date: new Date(a.completed_at).toLocaleDateString('vi-VN'),
            mode: a.mode,
            rawScore: a.raw_score || undefined,
            totalQuestions: a.total_questions,
            bandScore: Number(a.band_score) || 6.0,
            durationMinutes: Math.round(a.duration_seconds / 60),
          }))

          // Cập nhật số bài đã hoàn thành
          skillsOverview.value = skillsOverview.value.map((sk) => {
            const completedCount = recentAttempts.value.filter((a) => a.skill === sk.skill).length
            return {
              ...sk,
              completedTests: completedCount,
            }
          })
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu IELTS từ Supabase:', err.message)
      errorMsg.value = 'Không thể kết nối đến cơ sở dữ liệu đề thi. Vui lòng kiểm tra lại kết nối mạng.'
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    fetchIeltsData()
  })

  // Lưu kết quả làm bài thi vào Supabase qua RPC an toàn
  const saveAttempt = async (payload: {
    testId: string
    mode: TestMode
    rawScore?: number
    totalQuestions: number
    bandScore?: number
    durationSeconds: number
    submittedEssay?: string
    speakingAudioBlob?: Blob
    answers: Record<number, string>
  }): Promise<{
    success: boolean
    error?: string
    attemptId?: string
    rawScore?: number | null
    bandScore?: number | null
    xpEarned?: number
    questionsResult?: any[]
  }> => {
    if (!authUser.value?.id) {
      return {
        success: false,
        error: 'Vui lòng đăng nhập để lưu kết quả bài thi',
      }
    }

    try {
      let speakingStoragePath: string | null = null

      // Upload file ghi âm Speaking nếu có
      if (payload.speakingAudioBlob) {
        const fileName = `${authUser.value.id}/${payload.testId}_${Date.now()}.webm`
        const { data: storageData, error: uploadErr } = await client.storage
          .from('speaking-recordings')
          .upload(fileName, payload.speakingAudioBlob, {
            contentType: 'audio/webm',
            upsert: true,
          })

        if (!uploadErr && storageData) {
          speakingStoragePath = storageData.path
        }
      }

      // Format mảng câu trả lời
      const answersArray = Object.entries(payload.answers).map(([qNum, ans]) => ({
        question_number: Number(qNum),
        user_answer: ans,
      }))

      // Gọi RPC submit_exam_attempt bảo mật tại Server
      const { data: rpcResult, error: rpcErr } = await client.rpc('submit_exam_attempt', {
        p_test_id: payload.testId,
        p_mode: payload.mode,
        p_answers: answersArray as any,
        p_duration_seconds: payload.durationSeconds,
        p_essay: payload.submittedEssay || null,
        p_audio_path: speakingStoragePath,
      })

      if (rpcErr) {
        throw new Error(rpcErr.message)
      }

      const res = rpcResult as Record<string, any>

      // Làm mới lại lịch sử bài thi
      await fetchIeltsData()

      return {
        success: true,
        attemptId: res.attempt_id,
        rawScore: res.raw_score,
        bandScore: res.band_score,
        xpEarned: res.xp_earned,
        questionsResult: res.results || [],
      }
    } catch (err: any) {
      console.error('Lỗi khi nộp bài thi IELTS:', err.message)
      return {
        success: false,
        error: err.message || 'Lỗi khi lưu bài thi',
      }
    }
  }

  return {
    skillsOverview,
    recentAttempts,
    allTests,
    isLoading,
    errorMsg,
    fetchIeltsData,
    saveAttempt,
  }
}
