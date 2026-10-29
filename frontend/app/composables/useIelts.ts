import type { Database } from '~/types/database.types'
import {
  mockSkillsOverview,
  mockRecentAttempts,
  mockAllTests,
} from '~/mocks/ielts.mock'

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
  // Dẫn chứng cho phần giải thích: câu nguyên văn trong passage/transcript và đoạn audio (giây)
  evidenceQuote?: string
  audioStartSeconds?: number
  audioEndSeconds?: number
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
  audioUrl?: string
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

export const useIelts = () => {
  const client = useSupabaseClient<Database>()
  const authUser = useSupabaseUser()
  const config = useRuntimeConfig()

  const isUseMock = computed(() => {
    return (
      config.public.useMock === true ||
      config.public.useMock === 'true' ||
      process.env.NUXT_PUBLIC_USE_MOCK === 'true'
    )
  })

  const isLoading = ref(false)
  const errorMsg = ref<string | null>(null)

  const skillsOverview = ref<SkillOverview[]>(mockSkillsOverview)
  const recentAttempts = ref<RecentAttempt[]>(mockRecentAttempts)
  const allTests = ref<IeltsTestDetail[]>(mockAllTests)

  // Tải đề thi thật từ Supabase
  const fetchIeltsData = async () => {
    if (isUseMock.value) return

    isLoading.value = true
    errorMsg.value = null

    try {
      // 1. Tải danh sách đề thi kèm câu hỏi
      const { data: testsData, error: testsErr } = await client
        .from('exam_tests')
        .select('*, exam_questions(*)')
        .eq('exam_id', 'ielts')

      if (testsData && testsData.length > 0) {
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
          audioUrl: t.audio_url || undefined,
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
            evidenceQuote: q.evidence_quote || undefined,
            audioStartSeconds: q.audio_start_seconds ?? undefined,
            audioEndSeconds: q.audio_end_seconds ?? undefined,
          })).sort((a: any, b: any) => a.id - b.id),
        }))
      }

      // 2. Tải lịch sử làm bài gần đây của người dùng
      if (authUser.value?.sub) {
        const { data: attemptsData } = await client
          .from('exam_attempts')
          .select('*, exam_tests(title, skill)')
          .eq('user_id', authUser.value.sub)
          .order('completed_at', { ascending: false })
          .limit(10)

        if (attemptsData && attemptsData.length > 0) {
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
        }
      }
    } catch (err: any) {
      console.warn('Lỗi khi tải dữ liệu IELTS từ Supabase, dùng mock fallback:', err.message)
      errorMsg.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    fetchIeltsData()
  })

  // Lưu kết quả làm bài thi vào Supabase
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
    if (isUseMock.value || !authUser.value?.sub) {
      return {
        success: true,
        rawScore: payload.rawScore,
        bandScore: payload.bandScore,
      }
    }

    try {
      let speakingStoragePath: string | null = null

      // Upload file ghi âm Speaking nếu có
      if (payload.speakingAudioBlob) {
        const fileName = `${authUser.value.sub}/${payload.testId}_${Date.now()}.webm`
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

      // Chuẩn bị payload câu trả lời cho RPC submit_exam_attempt
      const currentTest = getTestById(payload.testId)
      // q.id ở frontend là số thứ tự câu; RPC khớp theo question_number (hoặc UUID nếu có)
      const formattedAnswers: { question_id: string; question_number: number; user_answer: string }[] = []
      if (currentTest?.questions && payload.answers) {
        for (const q of currentTest.questions) {
          const ans = payload.answers[q.id]
          if (ans !== undefined) {
            formattedAnswers.push({
              question_id: String(q.id),
              question_number: q.id,
              user_answer: ans,
            })
          }
        }
      }

      // 1. Gọi RPC submit_exam_attempt (Server tự chấm trắc nghiệm, tính band, ghi exam_attempts & exam_answers, cộng XP an toàn)
      const { data: rpcResult, error: rpcErr } = await (client as any).rpc('submit_exam_attempt', {
        p_test_id: payload.testId,
        p_mode: payload.mode,
        p_answers: formattedAnswers,
        p_duration_seconds: payload.durationSeconds,
        p_essay: payload.submittedEssay || null,
        p_audio_path: speakingStoragePath,
      })

      if (rpcErr) {
        console.error('Lỗi khi gọi RPC submit_exam_attempt:', rpcErr)
        return { success: false, error: rpcErr.message }
      }

      const res = rpcResult as {
        attempt_id: string
        raw_score: number | null
        total_questions: number
        band_score: number | null
        xp_earned: number
        questions_result: any[]
      }

      return {
        success: true,
        attemptId: res.attempt_id,
        rawScore: res.raw_score,
        bandScore: res.band_score,
        xpEarned: res.xp_earned,
        questionsResult: res.questions_result,
      }
    } catch (e: any) {
      console.error('Lỗi ngoại lệ khi lưu bài thi:', e)
      return { success: false, error: e.message }
    }
  }

  const getTestById = (id: string): IeltsTestDetail | undefined => {
    return allTests.value.find((t) => t.id === id)
  }

  const getTestsBySkill = (skill: IeltsSkill): IeltsTestDetail[] => {
    return allTests.value.filter((t) => t.skill === skill)
  }

  const getSkillOverview = (skill: IeltsSkill): SkillOverview | undefined => {
    return skillsOverview.value.find((s) => s.skill === skill)
  }

  return {
    skillsOverview,
    recentAttempts,
    allTests,
    isLoading,
    errorMsg,
    getTestById,
    getTestsBySkill,
    getSkillOverview,
    convertRawToBand,
    saveAttempt,
    fetchIeltsData,
  }
}
