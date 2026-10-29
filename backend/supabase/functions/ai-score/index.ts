import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { countWords, ScoringError, scoreSubmission, type ProductiveSkill } from './scoring.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

const fail = (code: string, message: string, status: number, extra: Record<string, unknown> = {}) =>
  json({ error: { code, message, retryable: false, ...extra } }, status)

// Giới hạn đầu vào để chặn bài quá ngắn (không đủ để chấm) hoặc quá dài (tốn chi phí)
const LIMITS: Record<ProductiveSkill, { minWords: number; maxChars: number }> = {
  writing: { minWords: 50, maxChars: 12_000 },
  speaking: { minWords: 20, maxChars: 12_000 },
}
const MAX_RUNS_PER_FEEDBACK = 5
// Một bản chấm kẹt ở "processing" quá lâu (function bị dừng giữa chừng) được phép chấm lại
const STALE_PROCESSING_MS = 5 * 60 * 1000

const NewScoreBody = z.object({
  attempt_id: z.string().uuid().nullable().optional(),
  test_id: z.string().min(1).max(100),
  skill: z.enum(['writing', 'speaking']),
  submission: z.string(),
})
const RetryBody = z.object({ feedback_id: z.string().uuid() })

const PUBLIC_COLUMNS =
  'id, attempt_id, test_id, skill, task_number, submission_text, word_count, status, run_count, error_code, error_message, overall_band, criteria, summary, suggestions, model_answer, provider, model, created_at, completed_at'

type FeedbackRow = {
  id: string
  attempt_id: string | null
  user_id: string
  skill: ProductiveSkill
  task_number: number | null
  prompt_text: string
  submission_text: string
  status: string
  run_count: number
  started_at: string | null
}

// Lấy đề bài từ DB thay vì tin dữ liệu client gửi lên
async function loadTestPrompt(admin: SupabaseClient, testId: string, skill: ProductiveSkill) {
  const { data: test, error } = await admin
    .from('exam_tests')
    .select('id, skill, task_number, min_words, prompt_requirements, prompts, title')
    .eq('id', testId)
    .maybeSingle()
  if (error) throw error
  if (!test) return null
  if (test.skill !== skill) return { mismatch: true as const }
  const prompt = skill === 'writing'
    ? (test.prompt_requirements || test.title)
    : (test.prompts || []).map((p: string, i: number) => `Part ${i + 1}: ${p}`).join('\n\n') || test.title
  return { mismatch: false as const, prompt: String(prompt), taskNumber: test.task_number as number | null }
}

async function runScoring(admin: SupabaseClient, row: FeedbackRow) {
  try {
    const result = await scoreSubmission({
      skill: row.skill,
      taskNumber: row.task_number,
      prompt: row.prompt_text,
      submission: row.submission_text,
    })

    const { data: saved, error } = await admin
      .from('ai_feedback')
      .update({
        status: 'completed',
        error_code: null,
        error_message: null,
        overall_band: result.overallBand,
        criteria: result.criteria,
        summary: result.summary,
        suggestions: result.suggestions,
        model_answer: result.modelAnswer,
        provider: result.provider,
        model: result.model,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        completed_at: new Date().toISOString(),
      })
      .eq('id', row.id)
      .select(PUBLIC_COLUMNS)
      .single()
    if (error) throw error

    // Ghi band thật vào lượt làm bài để lịch sử / thống kê dùng chung một nguồn,
    // trừ khi giáo viên đã chỉnh band (điểm giáo viên được ưu tiên hơn điểm AI)
    const { count: overrides } = row.attempt_id
      ? await admin
        .from('teacher_feedback')
        .select('id', { count: 'exact', head: true })
        .eq('attempt_id', row.attempt_id)
        .not('override_band', 'is', null)
      : { count: 0 }
    if (row.attempt_id && !overrides) {
      const { error: attemptErr } = await admin
        .from('exam_attempts')
        .update({ band_score: result.overallBand })
        .eq('id', row.attempt_id)
      if (attemptErr) console.error('[ai-score] Không cập nhật được band_score của attempt:', attemptErr.message)
    }

    return json({ feedback: saved })
  } catch (err) {
    const scoringErr = err instanceof ScoringError
      ? err
      : new ScoringError('INTERNAL', 'Có lỗi không mong muốn khi chấm bài. Hãy chấm lại.', 500)
    if (!(err instanceof ScoringError)) console.error('[ai-score] Lỗi ngoài dự kiến:', err)

    const canRetry = scoringErr.retryable && row.run_count < MAX_RUNS_PER_FEEDBACK
    await admin
      .from('ai_feedback')
      .update({ status: 'failed', error_code: scoringErr.code, error_message: scoringErr.message })
      .eq('id', row.id)

    return fail(scoringErr.code, scoringErr.message, scoringErr.status, {
      retryable: canRetry,
      feedback_id: row.id,
    })
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return fail('METHOD_NOT_ALLOWED', 'Chỉ hỗ trợ phương thức POST.', 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return fail('AUTH_REQUIRED', 'Bạn cần đăng nhập để chấm bài bằng AI.', 401)

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // 1. Xác định người gọi từ JWT của chính họ
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } })
  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) return fail('AUTH_REQUIRED', 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.', 401)

  const admin = createClient(url, serviceKey)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return fail('INVALID_INPUT', 'Dữ liệu gửi lên không phải JSON hợp lệ.', 400)
  }

  try {
    // 2a. Chấm lại một bản chấm đã thất bại
    const retry = RetryBody.safeParse(body)
    if (retry.success) {
      const { data: existing, error } = await admin
        .from('ai_feedback')
        .select('*')
        .eq('id', retry.data.feedback_id)
        .maybeSingle()
      if (error) throw error
      if (!existing || existing.user_id !== user.id) {
        return fail('NOT_FOUND', 'Không tìm thấy bản chấm này.', 404)
      }
      if (existing.status === 'completed') return json({ feedback: await selectPublic(admin, existing.id) })
      if (existing.run_count >= MAX_RUNS_PER_FEEDBACK) {
        return fail('NOT_RETRYABLE', `Bài này đã được chấm lại ${MAX_RUNS_PER_FEEDBACK} lần. Hãy làm một lượt mới.`, 429)
      }

      // Giành quyền chấm một cách nguyên tử để hai lần bấm liên tiếp không gọi AI hai lần
      const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS).toISOString()
      const { data: claimed, error: claimErr } = await admin
        .from('ai_feedback')
        .update({ status: 'processing', run_count: existing.run_count + 1, started_at: new Date().toISOString() })
        .eq('id', existing.id)
        .or(`status.eq.failed,status.eq.pending,and(status.eq.processing,started_at.lt.${staleBefore})`)
        .select('*')
        .maybeSingle()
      if (claimErr) throw claimErr
      if (!claimed) return fail('ALREADY_PROCESSING', 'Bài đang được chấm. Vui lòng đợi kết quả.', 409, { feedback_id: existing.id })

      return await runScoring(admin, claimed as FeedbackRow)
    }

    // 2b. Chấm một bài mới
    const parsed = NewScoreBody.safeParse(body)
    if (!parsed.success) return fail('INVALID_INPUT', 'Thiếu hoặc sai thông tin bài làm cần chấm.', 400)
    const { test_id, skill } = parsed.data
    const attemptId = parsed.data.attempt_id ?? null
    const submission = parsed.data.submission.trim()

    const limits = LIMITS[skill]
    const words = countWords(submission)
    if (words < limits.minWords) {
      const what = skill === 'writing' ? 'Bài viết' : 'Transcript'
      return fail('SUBMISSION_TOO_SHORT', `${what} cần ít nhất ${limits.minWords} từ để chấm (hiện có ${words} từ).`, 422)
    }
    if (submission.length > limits.maxChars) {
      return fail('SUBMISSION_TOO_LONG', `Bài làm vượt quá ${limits.maxChars.toLocaleString('vi-VN')} ký tự.`, 422)
    }

    if (attemptId) {
      const { data: attempt, error } = await admin
        .from('exam_attempts')
        .select('id, user_id, test_id')
        .eq('id', attemptId)
        .maybeSingle()
      if (error) throw error
      if (!attempt || attempt.user_id !== user.id || attempt.test_id !== test_id) {
        return fail('NOT_FOUND', 'Không tìm thấy lượt làm bài tương ứng.', 404)
      }

      // Idempotent: lượt làm bài đã có bản chấm thì trả lại bản đó
      const { data: existing, error: exErr } = await admin
        .from('ai_feedback')
        .select('id, status')
        .eq('attempt_id', attemptId)
        .maybeSingle()
      if (exErr) throw exErr
      if (existing?.status === 'completed') return json({ feedback: await selectPublic(admin, existing.id) })
      if (existing) {
        return fail('ALREADY_EXISTS', 'Lượt làm bài này đã có bản chấm. Dùng "Chấm lại bằng AI" nếu lần trước bị lỗi.', 409, {
          feedback_id: existing.id,
          status: existing.status,
        })
      }
    }

    const test = await loadTestPrompt(admin, test_id, skill)
    if (!test) return fail('NOT_FOUND', 'Đề thi không tồn tại.', 404)
    if (test.mismatch) return fail('INVALID_INPUT', 'Kỹ năng không khớp với đề thi.', 400)

    // Hạn mức theo ngày để kiểm soát chi phí AI
    const dailyLimit = Number(Deno.env.get('AI_SCORING_DAILY_LIMIT') || 20)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count, error: countErr } = await admin
      .from('ai_feedback')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', since)
    if (countErr) throw countErr
    if ((count ?? 0) >= dailyLimit) {
      return fail('DAILY_LIMIT_REACHED', `Bạn đã dùng hết ${dailyLimit} lượt chấm AI trong 24 giờ. Hãy quay lại sau.`, 429)
    }

    const { data: created, error: insertErr } = await admin
      .from('ai_feedback')
      .insert({
        attempt_id: attemptId,
        user_id: user.id,
        test_id,
        skill,
        task_number: test.taskNumber,
        prompt_text: test.prompt,
        submission_text: submission,
        word_count: words,
        status: 'processing',
        run_count: 1,
        started_at: new Date().toISOString(),
      })
      .select('*')
      .single()
    if (insertErr) {
      // Hai yêu cầu cùng lúc cho một attempt: unique index chặn bản thứ hai
      if (insertErr.code === '23505') return fail('ALREADY_PROCESSING', 'Bài đang được chấm. Vui lòng đợi kết quả.', 409)
      throw insertErr
    }

    return await runScoring(admin, created as FeedbackRow)
  } catch (err) {
    console.error('[ai-score] Lỗi máy chủ:', err)
    return fail('INTERNAL', 'Máy chủ gặp lỗi khi xử lý yêu cầu chấm bài.', 500)
  }
})

async function selectPublic(admin: SupabaseClient, id: string) {
  const { data, error } = await admin.from('ai_feedback').select(PUBLIC_COLUMNS).eq('id', id).single()
  if (error) throw error
  return data
}
