// ====================================================================
// backend/supabase/scripts/gen-seed/generate.mjs
// Đọc source.json và sinh ra migration 20261029000011_seed_learning_content.sql
// ====================================================================

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../');

// Đọc source.json
const sourcePath = path.join(__dirname, 'source.json');
if (!fs.existsSync(sourcePath)) {
  console.error('❌ Không tìm thấy source.json! Vui lòng chạy node extract.mjs trước.');
  process.exit(1);
}
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

// Helper: UUID v5 xác định từ chuỗi
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
function uuidv5(name, ns = NAMESPACE) {
  const nsBuffer = Buffer.from(ns.replace(/-/g, ''), 'hex');
  const nameBuffer = Buffer.from(name, 'utf8');
  const hash = crypto.createHash('sha1').update(Buffer.concat([nsBuffer, nameBuffer])).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50; // v5
  hash[8] = (hash[8] & 0x3f) | 0x80; // variant
  const hex = hash.toString('hex', 0, 16);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

// Helper thoát chuỗi SQL an toàn
function sqlStr(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function sqlJson(obj) {
  if (obj === null || obj === undefined) return "'[]'::jsonb";
  const jsonStr = JSON.stringify(obj);
  // Xác thực parse
  JSON.parse(jsonStr);
  return `'${jsonStr.replace(/'/g, "''")}'::jsonb`;
}

const out = [];

out.push(`-- ====================================================================
-- Migration: 20261029000011_seed_learning_content.sql
-- Mục đích: Nạp nội dung học thật vào cơ sở dữ liệu Supabase
-- Được SINH TỰ ĐỘNG bởi scripts/gen-seed/generate.mjs từ source.json
-- Tính chất: 100% IDEMPOTENT (ON CONFLICT DO UPDATE với khóa chính/UUID xác định)
-- ====================================================================
`);

// -----------------------------------------------------------------------------
// 1. VOCAB LEVELS (7 bản ghi)
// -----------------------------------------------------------------------------
out.push(`-- 1. CÁC CẤP ĐỘ TỪ VỰNG CHUẨN KHUNG CEFR (Kỳ vọng: 7 bản ghi)
INSERT INTO public.vocab_levels (level_number, code, title, cefr_equivalent, target_word_count, color_tone, description) VALUES
  (1, 'A1', 'Khởi động & Sinh tồn cơ bản', 'A1 Breakthrough', 500, 'ocean', 'Vốn từ thiết yếu cho các giao tiếp thường ngày cực kỳ đơn giản.'),
  (2, 'A2', 'Sơ cấp & Giao tiếp nền tảng', 'A2 Waystage', 1000, 'primary', 'Từ vựng diễn đạt nhu cầu thiết yếu, mua sắm, hỏi đường và thói quen.'),
  (3, 'B1', 'Trung cấp cơ sở (Ngưỡng tự chủ)', 'B1 Threshold', 2000, 'cyan', 'Tự tin trao đổi về công việc, sở thích, trường học và các trải nghiệm.'),
  (4, 'B2', 'Trung cấp độc lập & Học thuật', 'B2 Vantage', 4000, 'yellow', 'Hiểu văn bản chuyên môn, giao tiếp trôi chảy tự nhiên với người bản xứ.'),
  (5, 'C1', 'Cao cấp & Chuyên môn sâu', 'C1 Operational', 8000, 'coral', 'Làm chủ các chủ đề học thuật trừu tượng, đàm phán hợp đồng phức tạp.'),
  (6, 'C2', 'Tinh thông & Gần như bản ngữ', 'C2 Mastery', 16000, 'violet', 'Thông hiểu và sử dụng sắc thái ngôn ngữ tinh tế không giới hạn.'),
  (7, 'HSK_JLPT', 'Bộ từ định hướng kỳ thi HSK & JLPT', 'HSK / JLPT', 2500, 'pink', 'Bộ từ chuyên biệt cho người học tiếng Trung và tiếng Nhật mục tiêu thi chứng chỉ.')
ON CONFLICT (level_number) DO UPDATE SET 
  code = EXCLUDED.code, 
  title = EXCLUDED.title, 
  cefr_equivalent = EXCLUDED.cefr_equivalent,
  description = EXCLUDED.description;
`);

// -----------------------------------------------------------------------------
// 2. EXAMS (5 bản ghi)
// -----------------------------------------------------------------------------
out.push(`-- 2. DANH MỤC KỲ THI CHỨNG CHỈ QUỐC TẾ (Kỳ vọng: 5 bản ghi)
INSERT INTO public.exams (id, name, full_name, is_active, status_badge, target_format, sort_order) VALUES
  ('ielts', 'IELTS Academic', 'International English Language Testing System (Academic)', true, 'Phổ biến nhất', 'Academic 4 Skills', 1),
  ('toeic', 'TOEIC LR/SW', 'Test of English for International Communication', true, 'Doanh nghiệp', '2 Skills / 4 Skills', 2),
  ('toefl', 'TOEFL iBT', 'Test of English as a Foreign Language', true, 'Du học Bắc Mỹ', 'Internet-based Test', 3),
  ('hsk', 'HSK Hán Ngữ', 'Hanyu Shuiping Kaoshi (Kỳ thi năng lực Hán ngữ cấp 1 - 6)', true, 'Chứng chỉ tiếng Trung', 'Cấp 1 đến 6', 4),
  ('jlpt', 'JLPT Nhật Ngữ', 'Japanese-Language Proficiency Test (Kỳ thi năng lực tiếng Nhật N5 - N1)', true, 'Chứng chỉ tiếng Nhật', 'Cấp độ N5 đến N1', 5)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  full_name = EXCLUDED.full_name, 
  status_badge = EXCLUDED.status_badge, 
  is_active = EXCLUDED.is_active;
`);

// -----------------------------------------------------------------------------
// 3. EXAM SKILLS (4 bản ghi)
// -----------------------------------------------------------------------------
out.push(`-- 3. CÁC PHẦN THI KỸ NĂNG IELTS (Kỳ vọng: 4 bản ghi)
INSERT INTO public.exam_skills (exam_id, skill_code, name, english_name, description, tone) VALUES
`);

const skillRows = (source.ielts.skills || []).map((sk) => {
  return `  ('ielts', ${sqlStr(sk.skill)}, ${sqlStr(sk.name)}, ${sqlStr(sk.englishName)}, ${sqlStr(sk.description)}, ${sqlStr(sk.tone)})`;
});
out.push(skillRows.join(',\n') + '\nON CONFLICT (exam_id, skill_code) DO UPDATE SET name = EXCLUDED.name, english_name = EXCLUDED.english_name, description = EXCLUDED.description;\n');

// -----------------------------------------------------------------------------
// 4. LEARNING STAGES (25 bản ghi)
// -----------------------------------------------------------------------------
out.push(`-- 4. BẢN ĐỒ LỘ TRÌNH HỌC TẬP CÁ NHÂN (LEARNING STAGES) (Kỳ vọng: 25 bản ghi)
INSERT INTO public.learning_stages (id, stage_type, language, level, title, description, sort_order, xp_required) VALUES
  -- Tiếng Anh Typing (10 chặng)
  ('stage-en-type-1', 'typing', 'en', 'A1', 'Chào hỏi & Làm quen', 'Luyện gõ các mẫu câu chào hỏi và giới thiệu căn bản nhất.', 1, 0),
  ('stage-en-type-2', 'typing', 'en', 'A1', 'Mua sắm & Giá cả', 'Thực hành các câu mua sắm, trả giá và thanh toán tiện lợi.', 2, 80),
  ('stage-en-type-3', 'typing', 'en', 'A2', 'Ẩm thực & Nhà hàng', 'Gọi món, hỏi thành phần thức ăn và cảm ơn đầu bếp.', 3, 180),
  ('stage-en-type-4', 'typing', 'en', 'A2', 'Hỏi đường & Di chuyển', 'Hỏi vị trí nhà ga, bắt taxi và xe buýt thuận tiện.', 4, 300),
  ('stage-en-type-5', 'typing', 'en', 'B1', 'Du lịch & Khách sạn', 'Check-in phòng nghỉ, yêu cầu dịch vụ buồng và hủy đặt phòng.', 5, 450),
  ('stage-en-type-6', 'typing', 'en', 'B1', 'Phỏng vấn & Xin việc', 'Trả lời tự tin về kinh nghiệm làm việc và điểm mạnh bản thân.', 6, 620),
  ('stage-en-type-7', 'typing', 'en', 'B2', 'Giao tiếp công sở', 'Viết email trao đổi công việc, báo cáo tiến độ dự án.', 7, 820),
  ('stage-en-type-8', 'typing', 'en', 'B2', 'Đàm phán & Thuyết trình', 'Thương lượng điều khoản hợp đồng và thuyết phục đối tác.', 8, 1050),
  ('stage-en-type-9', 'typing', 'en', 'C1', 'Học thuật & Tranh biện', 'Trình bày quan điểm phản biện các vấn đề xã hội sâu sắc.', 9, 1350),
  ('stage-en-type-10', 'typing', 'en', 'C2', 'Văn chương & Báo chí', 'Gõ các đoạn văn báo chí, tiểu luận triết học cao cấp.', 10, 1700),

  -- Tiếng Trung Typing (5 chặng)
  ('stage-zh-type-1', 'typing', 'zh', 'HSK 1', 'Nhập môn Pinyin & Chào hỏi', 'Luyện gõ các câu giao tiếp cơ bản với Pinyin chuẩn.', 1, 0),
  ('stage-zh-type-2', 'typing', 'zh', 'HSK 2', 'Đi chợ & Trả giá', 'Mẫu câu mua sắm hàng ngày và đếm số lượng.', 2, 100),
  ('stage-zh-type-3', 'typing', 'zh', 'HSK 3', 'Gặp gỡ bạn bè & Ăn uống', 'Giao lưu cuối tuần, gọi các món ăn Trung Hoa phổ biến.', 3, 250),
  ('stage-zh-type-4', 'typing', 'zh', 'HSK 4', 'Làm việc & Công sở', 'Mẫu câu trao đổi nội bộ nơi làm việc bằng tiếng Hán.', 4, 450),
  ('stage-zh-type-5', 'typing', 'zh', 'HSK 5', 'Thương mại & Hợp đồng', 'Gõ nhanh các thuật ngữ xuất nhập khẩu và ký kết.', 5, 700),

  -- Tiếng Nhật Typing (5 chặng)
  ('stage-ja-type-1', 'typing', 'ja', 'N5', 'Chào hỏi Kana & Câu đơn', 'Gõ Romaji chuyển đổi Hiragana và Katakana chuẩn xác.', 1, 0),
  ('stage-ja-type-2', 'typing', 'ja', 'N5', 'Mua sắm Konbini & Nhà ga', 'Mẫu câu đi lại hàng ngày và mua hàng ở cửa hàng tiện lợi.', 2, 100),
  ('stage-ja-type-3', 'typing', 'ja', 'N4', 'Quán ăn Izakaya & Cuộc sống', 'Gọi món, nhờ giúp đỡ và nói về kế hoạch tương lai.', 3, 250),
  ('stage-ja-type-4', 'typing', 'ja', 'N3', 'Công ty & Kính ngữ cơ bản', 'Trao đổi qua email nội bộ và chào hỏi đồng nghiệp.', 4, 450),
  ('stage-ja-type-5', 'typing', 'ja', 'N2', 'Thương mại Nhật Bản', 'Đàm phán Keigo chuẩn mực cao trong các buổi họp đối tác.', 5, 700),

  -- Chặng tra từ điển & học thuật (5 chặng)
  ('stage-dict-en-1', 'dictionary', 'en', 'A1', 'Khám phá Từ vựng Oxford 3000', 'Tích luỹ 50 từ đầu tiên qua thẻ ghi nhớ thông minh.', 1, 0),
  ('stage-dict-en-2', 'dictionary', 'en', 'B1', 'Làm chủ Cụm động từ (Phrasal Verbs)', 'Tra cứu và ghi nhớ 40 cụm động từ thường gặp nhất.', 2, 150),
  ('stage-dict-en-3', 'dictionary', 'en', 'B2', 'Từ vựng Học thuật IELTS 7.0+', 'Bộ từ vựng ăn điểm cho Writing Task 2 & Speaking.', 3, 400),
  ('stage-dict-zh-1', 'dictionary', 'zh', 'HSK 3', '50 Từ vựng Vàng HSK 3 - 4', 'Nắm vững ý nghĩa và ví dụ thực tế qua từ điển mẫu.', 1, 0),
  ('stage-dict-ja-1', 'dictionary', 'ja', 'N4', '50 Từ vựng Thiết yếu N4 - N3', 'Nắm vững Kanji và cách chuyển âm On/Kun chuẩn xác.', 1, 0)
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title, 
  description = EXCLUDED.description, 
  xp_required = EXCLUDED.xp_required;
`);

// -----------------------------------------------------------------------------
// 5. TYPING TOPICS & SENTENCES (8 chủ đề, 48 câu)
// -----------------------------------------------------------------------------
out.push(`-- 5. CHỦ ĐỀ GÕ CÂU & CÂU LUYỆN TẬP THỰC TẾ (Kỳ vọng: 8 chủ đề, 48 câu)
INSERT INTO public.typing_topics (id, language, level, group_type, title, description, icon_name, sort_order) VALUES
`);

const topicRows = source.typingTopics.map((t, idx) => {
  return `  (${sqlStr(t.id)}, ${sqlStr(t.lang)}, ${sqlStr(t.level)}, ${sqlStr(t.group)}, ${sqlStr(t.title)}, ${sqlStr(t.description)}, ${sqlStr(t.icon)}, ${idx + 1})`;
});
out.push(topicRows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;\n');

out.push(`INSERT INTO public.typing_sentences (id, topic_id, content, reading, translation, hint_word, grammar_note, sort_order) VALUES\n`);
const sentenceRows = [];
for (const topic of source.typingTopics) {
  (topic.sentences || []).forEach((s, idx) => {
    const sId = uuidv5(`typing:${topic.id}:${idx + 1}`);
    const content = s.targetText || s.content || s.text;
    const translation = s.sourceText || s.translation || s.meaning;
    const reading = s.phonetic || s.reading || null;
    sentenceRows.push(
      `  ('${sId}', ${sqlStr(topic.id)}, ${sqlStr(content)}, ${sqlStr(reading)}, ${sqlStr(translation)}, ${sqlStr(s.hintWord)}, ${sqlStr(s.grammarNote)}, ${idx + 1})`
    );
  });
}
out.push(sentenceRows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, translation = EXCLUDED.translation, reading = EXCLUDED.reading, hint_word = EXCLUDED.hint_word, grammar_note = EXCLUDED.grammar_note;\n');

// -----------------------------------------------------------------------------
// 6. VOCAB SETS & WORDS (5 bộ, 50 từ)
// -----------------------------------------------------------------------------
out.push(`-- 6. BỘ TỪ VỰNG HỆ THỐNG & TỪ VỰNG CHI TIẾT (Kỳ vọng: 5 bộ từ, 50 từ vựng)
INSERT INTO public.vocab_sets (id, user_id, level_id, title, description, is_system, language, is_public) VALUES
`);

const vocabSetUuids = [
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005',
];

const setRows = source.curatedVocabSets.map((s, idx) => {
  const setId = vocabSetUuids[idx];
  const levelNum = s.lang === 'en' ? (idx === 0 ? 3 : idx === 1 ? 5 : 4) : 4;
  return `  ('${setId}', NULL, ${levelNum}, ${sqlStr(s.title)}, ${sqlStr(s.description)}, true, ${sqlStr(s.lang)}, true)`;
});
out.push(setRows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;\n');

out.push(`INSERT INTO public.vocab_words (id, set_id, word, phonetic, part_of_speech, meaning_vi, example_sentence, example_translation, reading, examples) VALUES\n`);
const wordRows = [];
source.curatedVocabSets.forEach((set, setIdx) => {
  const setId = vocabSetUuids[setIdx];
  (set.words || []).forEach((w, wIdx) => {
    const wordId = `b000000${setIdx + 1}-0000-0000-0000-${String(wIdx + 1).padStart(12, '0')}`;
    wordRows.push(
      `  ('${wordId}', '${setId}', ${sqlStr(w.term)}, ${sqlStr(w.phonetic)}, ${sqlStr(w.partOfSpeech)}, ${sqlStr(w.meaning)}, ${sqlStr(w.exampleTarget)}, ${sqlStr(w.exampleMeaning)}, NULL, '[]'::jsonb)`
    );
  });
});
out.push(wordRows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET meaning_vi = EXCLUDED.meaning_vi, example_sentence = EXCLUDED.example_sentence, phonetic = EXCLUDED.phonetic;\n');

// -----------------------------------------------------------------------------
// 7. GRAMMAR LEVELS (6 bản ghi)
// -----------------------------------------------------------------------------
out.push(`-- 7. CẤP ĐỘ NGỮ PHÁP (GRAMMAR LEVELS) (Kỳ vọng: 6 bản ghi)
INSERT INTO public.grammar_levels (language, code, name, description, sort_order) VALUES
`);

const grammarLevelRows = [];
let gLvlOrder = 0;
for (const lang of ['en', 'zh', 'ja']) {
  const sections = source.grammarLevels[lang] || [];
  sections.forEach((sec, idx) => {
    gLvlOrder++;
    grammarLevelRows.push(
      `  (${sqlStr(lang)}, ${sqlStr(sec.levelCode)}, ${sqlStr(sec.levelName)}, ${sqlStr(sec.description)}, ${idx + 1})`
    );
  });
}
out.push(grammarLevelRows.join(',\n') + '\nON CONFLICT (language, code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;\n');

// -----------------------------------------------------------------------------
// 8. GRAMMAR POINTS & EXERCISES (24 điểm, 28 bài tập)
// -----------------------------------------------------------------------------
out.push(`-- 8. ĐIỂM NGỮ PHÁP & BÀI TẬP THỰC CHIẾN (Kỳ vọng: 24 điểm, 28 bài tập)
INSERT INTO public.grammar_points (id, language, level, title, vietnamese_title, summary, formula, explanation, explanation_notes, examples, common_mistakes, xp_reward, sort_order) VALUES
`);

const pointRows = [];
const exerciseRows = [];

for (const lang of ['en', 'zh', 'ja']) {
  const sections = source.grammarLevels[lang] || [];
  sections.forEach((sec) => {
    (sec.points || []).forEach((p, pIdx) => {
      const explanationText = (p.explanationNotes || []).join('\n');
      pointRows.push(
        `  (${sqlStr(p.id)}, ${sqlStr(lang)}, ${sqlStr(p.level)}, ${sqlStr(p.title)}, ${sqlStr(p.vietnameseTitle)}, ${sqlStr(p.summary)}, ${sqlJson(p.formula)}, ${sqlStr(explanationText)}, ${sqlJson(p.explanationNotes || [])}, ${sqlJson(p.examples || [])}, ${sqlJson(p.pitfalls || [])}, ${p.xpReward || 30}, ${pIdx + 1})`
      );

      // Exercises
      (p.exercises || []).forEach((ex, exIdx) => {
        // Ánh xạ question_type sang CHECK constraint DB
        let dbType = 'multiple_choice';
        if (ex.type === 'fill_in_blank' || ex.type === 'fill_blank') dbType = 'fill_blank';
        else if (ex.type === 'word_reorder' || ex.type === 'word_order') dbType = 'word_order';

        // Ánh xạ đáp án chuẩn
        let correctIdx = ex.correctIndex !== undefined ? ex.correctIndex : null;
        let correctAns = null;
        let correctOrd = null;
        let scramWords = null;

        if (dbType === 'multiple_choice') {
          correctAns = ex.options && ex.correctIndex !== undefined ? ex.options[ex.correctIndex] : null;
        } else if (dbType === 'fill_blank') {
          correctAns = ex.correctAnswer || null;
        } else if (dbType === 'word_order') {
          correctOrd = ex.correctOrder || null;
          scramWords = ex.scrambledWords || null;
          correctAns = correctOrd ? correctOrd.join(' ') : null;
        }

        exerciseRows.push(
          `  (${sqlStr(ex.id)}, ${sqlStr(p.id)}, ${sqlStr(dbType)}, ${sqlStr(ex.prompt)}, ${sqlStr(ex.question)}, ${sqlJson(ex.options || [])}, ${correctIdx !== null ? correctIdx : 'NULL'}, ${sqlStr(correctAns)}, ${sqlJson(correctOrd)}, ${sqlJson(scramWords)}, ${sqlStr(ex.hint || null)}, ${sqlStr(ex.explanation || '')}, ${exIdx + 1})`
        );
      });
    });
  });
}

out.push(pointRows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, level = EXCLUDED.level, explanation = EXCLUDED.explanation, explanation_notes = EXCLUDED.explanation_notes, examples = EXCLUDED.examples, common_mistakes = EXCLUDED.common_mistakes;\n');

out.push(`INSERT INTO public.grammar_exercises (id, point_id, question_type, prompt, question, options, correct_index, correct_answer, correct_order, scrambled_words, hint, explanation, sort_order) VALUES\n`);
out.push(exerciseRows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET prompt = EXCLUDED.prompt, question = EXCLUDED.question, options = EXCLUDED.options, correct_index = EXCLUDED.correct_index, correct_answer = EXCLUDED.correct_answer, correct_order = EXCLUDED.correct_order, scrambled_words = EXCLUDED.scrambled_words, hint = EXCLUDED.hint, explanation = EXCLUDED.explanation;\n');

// -----------------------------------------------------------------------------
// 9. MEDIA ITEMS, CUES & QUIZZES (4 bài học, 15 cues, 3 quiz)
// -----------------------------------------------------------------------------
out.push(`-- 9. BÀI HỌC MEDIA VIDEO / PODCAST (Kỳ vọng: 4 bài học, 15 cues, 3 câu quiz)
INSERT INTO public.media_items (id, media_type, language, level, topic, title, vietnamese_title, speaker, provider, source_url, duration_seconds, is_published) VALUES
`);

const mediaItemRows = source.curatedMediaList.map((m) => {
  return `  (${sqlStr(m.id)}, ${sqlStr(m.type)}, ${sqlStr(m.lang)}, ${sqlStr(m.level)}, ${sqlStr(m.category)}, ${sqlStr(m.title)}, ${sqlStr(m.viTitle)}, ${sqlStr(m.speaker)}, 'youtube', 'https://www.youtube.com/watch?v=sample', ${m.durationSec || 120}, true)`;
});
out.push(mediaItemRows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, vietnamese_title = EXCLUDED.vietnamese_title, speaker = EXCLUDED.speaker, duration_seconds = EXCLUDED.duration_seconds;\n');

out.push(`INSERT INTO public.media_cues (id, media_id, subtitle_lang, start_ms, end_ms, text, translation_vi, vocab_hints, sort_order) VALUES\n`);
const cueRows = [];
const quizRows = [];

source.curatedMediaList.forEach((m) => {
  (m.subtitles || []).forEach((c, cIdx) => {
    const cueId = uuidv5(`media_cue:${m.id}:${c.start}:${cIdx + 1}`);
    cueRows.push(
      `  ('${cueId}', ${sqlStr(m.id)}, ${sqlStr(m.lang)}, ${c.start * 1000}, ${c.end * 1000}, ${sqlStr(c.text)}, ${sqlStr(c.vi)}, ${sqlJson(c.vocabHints || [])}, ${cIdx + 1})`
    );
  });

  (m.quiz || []).forEach((q, qIdx) => {
    const qId = uuidv5(`media_quiz:${m.id}:${qIdx + 1}`);
    quizRows.push(
      `  ('${qId}', ${sqlStr(m.id)}, ${q.segmentTime || 0}, ${sqlStr(q.question)}, ${sqlJson(q.options || [])}, ${q.correctIndex || 0}, ${sqlStr(q.explanation || '')})`
    );
  });
});

out.push(cueRows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, translation_vi = EXCLUDED.translation_vi, vocab_hints = EXCLUDED.vocab_hints;\n');

out.push(`INSERT INTO public.media_quiz_questions (id, media_id, segment_time_sec, question, options, correct_index, explanation) VALUES\n`);
out.push(quizRows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET question = EXCLUDED.question, options = EXCLUDED.options, correct_index = EXCLUDED.correct_index, explanation = EXCLUDED.explanation;\n');

// -----------------------------------------------------------------------------
// 10. READING ITEMS & SECTIONS (7 bài đọc, 12 đoạn)
// -----------------------------------------------------------------------------
out.push(`-- 10. BÀI ĐỌC SONG NGỮ & VĂN BẢN HỌC THUẬT (Kỳ vọng: 7 bài đọc, 12 đoạn văn)
INSERT INTO public.reading_items (id, content_type, language, level, title, vietnamese_title, author, source_note, word_count, reading_time_minutes, license, is_published) VALUES
`);

const readingItemRows = source.readingList.map((r) => {
  return `  (${sqlStr(r.id)}, ${sqlStr(r.type)}, ${sqlStr(r.lang)}, ${sqlStr(r.level)}, ${sqlStr(r.title)}, ${sqlStr(r.viTitle)}, ${sqlStr(r.author)}, ${sqlStr(r.sourceNote)}, ${r.wordCount || 100}, ${r.readingTimeMin || 3}, 'Public Domain / Open Educational Resource', true)`;
});
out.push(readingItemRows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, vietnamese_title = EXCLUDED.vietnamese_title, author = EXCLUDED.author, source_note = EXCLUDED.source_note;\n');

out.push(`INSERT INTO public.reading_sections (id, reading_id, sort_order, original_text, translated_text, vocab_notes) VALUES\n`);
const sectionRows = [];
source.readingList.forEach((r) => {
  (r.paragraphs || []).forEach((p, pIdx) => {
    const secId = uuidv5(`reading_section:${r.id}:${pIdx + 1}`);
    const origText = p.targetText || p.original_text || p.text;
    const transText = p.viTranslation || p.translated_text || p.vi;
    sectionRows.push(
      `  ('${secId}', ${sqlStr(r.id)}, ${pIdx + 1}, ${sqlStr(origText)}, ${sqlStr(transText)}, ${sqlJson(p.vocabNotes || [])})`
    );
  });
});
out.push(sectionRows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET original_text = EXCLUDED.original_text, translated_text = EXCLUDED.translated_text, vocab_notes = EXCLUDED.vocab_notes;\n');

// -----------------------------------------------------------------------------
// 11. IELTS TESTS & QUESTIONS (5 đề thi, 20 câu hỏi)
// -----------------------------------------------------------------------------
out.push(`-- 11. ĐỀ THI LUYỆN THI IELTS & BỘ CÂU HỎI HỌC THUẬT (Kỳ vọng: 5 đề thi, 20 câu hỏi)
INSERT INTO public.exam_tests (
  id, exam_id, skill_id, title, description, time_allowed_minutes, total_questions, is_published,
  passage_title, passage_content, passage_summary, category_tags, audio_url
) VALUES
`);

const testRows = source.ielts.tests.map((t) => {
  const passageTitle = t.passageTitle || t.audioTitle || null;
  let passageContent = t.passageContent || t.audioScript || t.promptRequirements || null;
  if (!passageContent && t.prompts) {
    if (Array.isArray(t.prompts)) passageContent = t.prompts.join('\n\n');
    else if (typeof t.prompts === 'object') passageContent = Object.values(t.prompts).join('\n\n');
  }

  return `  (
    ${sqlStr(t.id)}, 'ielts', ${sqlStr(t.skill)}, ${sqlStr(t.title)}, ${sqlStr(t.subtitle || t.title)}, ${t.timeMinutes || 20}, ${t.totalQuestions || (t.questions || []).length}, true,
    ${sqlStr(passageTitle)}, ${sqlStr(passageContent)}, NULL, ${sqlJson(t.categoryTags || [])}, NULL
  )`;
});
out.push(testRows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, passage_title = EXCLUDED.passage_title, passage_content = EXCLUDED.passage_content;\n');

out.push(`INSERT INTO public.exam_questions (id, test_id, question_number, type, question_text, options, correct_answer, explanation, category_tag, passage_section_ref) VALUES\n`);
const examQuestionRows = [];
source.ielts.tests.forEach((t) => {
  (t.questions || []).forEach((q, qIdx) => {
    const qNum = q.id !== undefined ? q.id : qIdx + 1;
    const qUuid = uuidv5(`exam_question:${t.id}:${qNum}`);
    examQuestionRows.push(
      `  ('${qUuid}', ${sqlStr(t.id)}, ${qNum}, ${sqlStr(q.type)}, ${sqlStr(q.questionText)}, ${sqlJson(q.options || [])}, ${sqlStr(q.correctAnswer)}, ${sqlStr(q.explanation || '')}, ${sqlStr(q.categoryTag || '')}, ${sqlStr(q.passageSectionRef || '')})`
    );
  });
});
out.push(examQuestionRows.join(',\n') + '\nON CONFLICT (id) DO UPDATE SET question_text = EXCLUDED.question_text, options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer, explanation = EXCLUDED.explanation;\n');

// -----------------------------------------------------------------------------
// 12. DICTIONARY ENTRIES (2 mục)
// -----------------------------------------------------------------------------
out.push(`-- 12. MỤC TỪ ĐIỂN MẪU TÍCH HỢP (Kỳ vọng: 2 mục)
INSERT INTO public.dictionary_entries (id, language, headword, source, license, data) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'en', 'pragmatic', 'in_house', 'CC-BY-SA 4.0', '{
    "word": "pragmatic",
    "phonetic": "/præɡˈmætɪk/",
    "frequency": "Academic",
    "etymology": "Xuất phát từ tiếng Hy Lạp pragmaticos (thực tế, có thể hành động).",
    "senses": [
      {
        "partOfSpeech": "Adjective",
        "definitions": [
          {
            "index": 1,
            "meaning": "Thực tế, giải quyết vấn đề dựa trên điều kiện thực tế thay vì lý thuyết suông.",
            "examples": [
              {
                "target": "We need to adopt a pragmatic approach to meet our project deadline.",
                "vi": "Chúng ta cần áp dụng cách tiếp cận thực tế để kịp thời hạn dự án."
              }
            ]
          }
        ]
      }
    ],
    "collocations": ["pragmatic approach", "pragmatic solution", "pragmatic policy"],
    "synonyms": ["practical", "realistic", "down-to-earth"],
    "antonyms": ["idealistic", "impractical", "theoretical"]
  }'::jsonb),
  ('c0000000-0000-0000-0000-000000000002', 'en', 'ubiquitous', 'in_house', 'CC-BY-SA 4.0', '{
    "word": "ubiquitous",
    "phonetic": "/juːˈbɪkwɪtəs/",
    "frequency": "Academic",
    "etymology": "Từ tiếng Latin ubique (ở khắp mọi nơi).",
    "senses": [
      {
        "partOfSpeech": "Adjective",
        "definitions": [
          {
            "index": 1,
            "meaning": "Có mặt ở khắp mọi nơi, phổ biến cùng lúc tại nhiều nơi.",
            "examples": [
              {
                "target": "Smartphones have become ubiquitous in modern everyday life.",
                "vi": "Điện thoại thông minh đã trở nên phổ biến ở khắp mọi nơi trong cuộc sống hiện đại."
              }
            ]
          }
        ]
      }
    ],
    "collocations": ["ubiquitous presence", "ubiquitous technology"],
    "synonyms": ["omnipresent", "pervasive", "everywhere"],
    "antonyms": ["rare", "scarce", "unusual"]
  }'::jsonb)
ON CONFLICT (language, headword) DO UPDATE SET data = EXCLUDED.data;
`);

const finalSql = out.join('\n');
const targetMigrationPath = path.join(rootDir, 'backend/supabase/migrations/20261029000011_seed_learning_content.sql');
fs.writeFileSync(targetMigrationPath, finalSql, 'utf8');

console.log(`\n🎉 Sinh thành công file migration seed: ${targetMigrationPath}`);
console.log(`- vocab_levels: 7`);
console.log(`- exams: 5`);
console.log(`- exam_skills: 4`);
console.log(`- learning_stages: 25`);
console.log(`- typing_topics: ${source.typingTopics.length}`);
console.log(`- typing_sentences: ${sentenceRows.length}`);
console.log(`- vocab_sets: ${source.curatedVocabSets.length}`);
console.log(`- vocab_words: ${wordRows.length}`);
console.log(`- grammar_levels: ${grammarLevelRows.length}`);
console.log(`- grammar_points: ${pointRows.length}`);
console.log(`- grammar_exercises: ${exerciseRows.length}`);
console.log(`- media_items: ${source.curatedMediaList.length}`);
console.log(`- media_cues: ${cueRows.length}`);
console.log(`- media_quiz_questions: ${quizRows.length}`);
console.log(`- reading_items: ${source.readingList.length}`);
console.log(`- reading_sections: ${sectionRows.length}`);
console.log(`- exam_tests: ${source.ielts.tests.length}`);
console.log(`- exam_questions: ${examQuestionRows.length}`);
console.log(`- dictionary_entries: 2`);
