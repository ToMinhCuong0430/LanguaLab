-- Migration 12: Dẫn chứng cho phần giải thích đáp án IELTS Reading / Listening
-- Dự án: Langua (Học ngoại ngữ & Luyện thi phi thương mại)
--
-- exam_questions đã có sẵn `explanation` (giải thích) và `passage_section_ref` (vd. "Đoạn 3").
-- Bổ sung để phần giải thích chỉ đúng chỗ liên quan:
--   - evidence_quote: câu/cụm nguyên văn trong bài đọc (Reading) hoặc transcript (Listening)
--     chứa đáp án. Frontend tô sáng đúng câu này trong đoạn văn tương ứng.
--   - audio_start_seconds / audio_end_seconds: đoạn audio chứa đáp án (Listening),
--     dùng cho nút "Nghe lại đoạn này".

ALTER TABLE public.exam_questions
  ADD COLUMN IF NOT EXISTS evidence_quote TEXT,
  ADD COLUMN IF NOT EXISTS audio_start_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS audio_end_seconds INTEGER;

ALTER TABLE public.exam_questions
  DROP CONSTRAINT IF EXISTS chk_exam_questions_audio_range;
ALTER TABLE public.exam_questions
  ADD CONSTRAINT chk_exam_questions_audio_range CHECK (
    (audio_start_seconds IS NULL OR audio_start_seconds >= 0)
    AND (audio_end_seconds IS NULL OR audio_start_seconds IS NULL OR audio_end_seconds >= audio_start_seconds)
  );

COMMENT ON COLUMN public.exam_questions.evidence_quote IS 'Câu nguyên văn trong passage/transcript chứa đáp án, dùng để tô sáng trong phần giải thích';
COMMENT ON COLUMN public.exam_questions.audio_start_seconds IS 'Giây bắt đầu đoạn audio chứa đáp án (Listening)';
COMMENT ON COLUMN public.exam_questions.audio_end_seconds IS 'Giây kết thúc đoạn audio chứa đáp án (Listening)';
