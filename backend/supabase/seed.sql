-- ====================================================================
-- SEED DATA CHO DỰ ÁN LANGUA (Khớp 100% với Mock Data của Frontend)
-- ====================================================================

-- 1. TẠO NGƯỜI DÙNG TRONG AUTH.USERS VÀ PROFILES
-- UUID cố định cho người dùng chính: Minh Hoàng
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'hoang@langua.local', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Minh Hoàng"}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'baoanh@langua.local', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Trần Bảo Anh"}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'dangkhoa@langua.local', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nguyễn Đăng Khoa"}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'thaomy@langua.local', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Lê Thảo My"}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'duchuy@langua.local', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Phạm Đức Huy"}', NOW(), NOW(), 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'thuylinh@langua.local', crypt('Password123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Vũ Thuỳ Linh"}', NOW(), NOW(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- GoTrue không đọc được NULL ở các cột token (lỗi "Database error querying schema" khi đăng nhập)
UPDATE auth.users SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE email LIKE '%@langua.local';

-- Cập nhật/chèn Profile chi tiết cho Minh Hoàng
INSERT INTO public.profiles (
  id,
  full_name,
  avatar_text,
  learning_lang,
  target_exam,
  current_band,
  target_band,
  target_exam_date
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Minh Hoàng',
  'MH',
  'en',
  'ielts',
  5.5,
  7.0,
  CURRENT_DATE + INTERVAL '90 days'
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  avatar_text = EXCLUDED.avatar_text,
  current_band = EXCLUDED.current_band,
  target_band = EXCLUDED.target_band;

-- Cập nhật profile cho các đối thủ trên Bảng Vàng Top XP
INSERT INTO public.profiles (id, full_name, avatar_text) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Trần Bảo Anh', 'BA'),
  ('00000000-0000-0000-0000-000000000003', 'Nguyễn Đăng Khoa', 'DK'),
  ('00000000-0000-0000-0000-000000000004', 'Lê Thảo My', 'TM'),
  ('00000000-0000-0000-0000-000000000005', 'Phạm Đức Huy', 'DH'),
  ('00000000-0000-0000-0000-000000000006', 'Vũ Thuỳ Linh', 'TL')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_text = EXCLUDED.avatar_text;

-- 2. ĐIỂM DANH 14 NGÀY LIÊN TIẾP CHO MINH HOÀNG (Tạo Streak 14 ngày)
INSERT INTO public.daily_checkins (user_id, checkin_date)
SELECT
  '00000000-0000-0000-0000-000000000001',
  CURRENT_DATE - (i || ' day')::INTERVAL
FROM generate_series(1, 14) AS i
ON CONFLICT DO NOTHING;

-- 3. CỘNG XP EVENTS (Minh Hoàng 2840 XP, đối thủ xếp trên và dưới)
INSERT INTO public.xp_events (user_id, xp_amount, source, created_at) VALUES
  -- Top 1: Trần Bảo Anh (3420 XP)
  ('00000000-0000-0000-0000-000000000002', 3420, 'weekly_grind', NOW()),
  -- Top 2: Nguyễn Đăng Khoa (3190 XP)
  ('00000000-0000-0000-0000-000000000003', 3190, 'weekly_grind', NOW()),
  -- Top 3: Lê Thảo My (2980 XP)
  ('00000000-0000-0000-0000-000000000004', 2980, 'weekly_grind', NOW()),
  -- Top 4: Minh Hoàng (2840 XP)
  ('00000000-0000-0000-0000-000000000001', 2725, 'historical_xp', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000001', 35, 'task_bbc_listening', NOW() - INTERVAL '2 hours'),
  ('00000000-0000-0000-0000-000000000001', 40, 'task_grammar_clause', NOW() - INTERVAL '1 hour'),
  ('00000000-0000-0000-0000-000000000001', 40, 'task_vocab_review', NOW() - INTERVAL '30 minutes'),
  -- Top 5: Phạm Đức Huy (2610 XP)
  ('00000000-0000-0000-0000-000000000005', 2610, 'weekly_grind', NOW()),
  -- Top 6: Vũ Thuỳ Linh (2470 XP)
  ('00000000-0000-0000-0000-000000000006', 2470, 'weekly_grind', NOW());

-- 4. THÔNG BÁO MẪU CỦA MINH HOÀNG
INSERT INTO public.notifications (user_id, title, content, category, is_read, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Duy trì chuỗi học tập!', 'Chỉ còn 3 tiếng để hoàn thành 1 bài luyện và giữ chuỗi ngày thứ 15.', 'streak', false, NOW() - INTERVAL '15 minutes'),
  ('00000000-0000-0000-0000-000000000001', 'Đã có 25 từ vựng đến hạn ôn', 'Thuật toán lặp lại ngắt quãng gợi ý ôn tập ngay để nhớ sâu hơn.', 'lesson', false, NOW() - INTERVAL '1 hour'),
  ('00000000-0000-0000-0000-000000000001', 'Cập nhật đề thi IELTS Listening Section 3', 'Đã bổ sung dạng bài Multiple Choice kèm giải thích chi tiết đáp án.', 'system', true, NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000001', 'Thăng hạng bảng tuần!', 'Bạn đã lọt vào Top 5 Bảng Vàng tuần này với hơn 450 XP.', 'award', true, NOW() - INTERVAL '2 days');

-- 5. 7 CẤP ĐỘ TỪ VỰNG (VOCAB LEVELS)
INSERT INTO public.vocab_levels (level_number, code, title, cefr_equivalent, target_word_count, color_tone, description) VALUES
  (1, 'L1', 'Cốt lõi A1', 'A1', 500, 'ok', '500 từ vựng căn bản sinh tồn hằng ngày'),
  (2, 'L2', 'Sơ cấp A2', 'A2', 800, 'ok', 'Giao tiếp gia đình, công việc đơn giản và chỉ đường'),
  (3, 'L3', 'Trung cấp B1', 'B1', 1200, 'warn', 'Diễn đạt ý kiến cá nhân, kế hoạch tương lai và báo chí cơ bản'),
  (4, 'L4', 'Trung cao B2', 'B2', 1500, 'accent', 'Giao tiếp trôi chảy tự nhiên với người bản xứ và văn bản học thuật'),
  (5, 'L5', 'Cao cấp C1', 'C1', 1800, 'mark', 'Văn phong học thuật sắc sảo, tài liệu chuyên môn và phản biện'),
  (6, 'L6', 'Tinh thông C2', 'C2', 2000, 'surface', 'Đọc hiểu mọi tài liệu phức tạp, sắc thái ẩn dụ tinh tế'),
  (7, 'L7', 'Chuyên ngành & Thành ngữ', 'Academic', 1200, 'surface', 'Collocations, idioms chuyên sâu và thuật ngữ khoa học')
ON CONFLICT (level_number) DO UPDATE SET
  title = EXCLUDED.title,
  target_word_count = EXCLUDED.target_word_count;

-- 6. BỘ TỪ VỰNG MẪU & CÁC TỪ VỰNG MẪU
INSERT INTO public.vocab_sets (id, title, description, level_id, is_system) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Academic Collocations Topic Environment', 'Các cụm từ cố định chủ đề Môi trường và Biến đổi khí hậu cho IELTS', 4, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.vocab_words (id, set_id, word, phonetic, part_of_speech, meaning_vi, example_sentence, example_translation) VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'biodiversity', '/ˌbaɪ.oʊ.daɪˈvɜː.sə.ti/', 'noun', 'sự đa dạng sinh học', 'The Amazon rainforest hosts unparalleled levels of biodiversity.', 'Rừng nhiệt đới Amazon lưu giữ mức độ đa dạng sinh học vô song.'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'sustainable', '/səˈsteɪ.nə.bəl/', 'adjective', 'bền vững, có thể duy trì lâu dài', 'We need to adopt sustainable energy alternatives immediately.', 'Chúng ta cần áp dụng các nguồn năng lượng thay thế bền vững ngay lập tức.'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111111', 'degradation', '/ˌdeɡ.rəˈdeɪ.ʃən/', 'noun', 'sự suy thoái, xuống cấp', 'Soil degradation threatens global agricultural production.', 'Sự suy thoái đất đai đe dọa sản lượng nông nghiệp toàn cầu.')
ON CONFLICT (id) DO NOTHING;

-- Gán tiến trình học từ cho Minh Hoàng (Từ đến hạn ôn hôm nay)
INSERT INTO public.user_word_progress (user_id, word_id, repetition_count, interval_days, next_review_at) VALUES
  ('00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222201', 3, 4, NOW() - INTERVAL '2 hours'),
  ('00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222202', 2, 2, NOW() - INTERVAL '1 hour'),
  ('00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222203', 1, 1, NOW() - INTERVAL '30 minutes')
ON CONFLICT (user_id, word_id) DO NOTHING;

-- 7. DANH MỤC KỲ THI (EXAMS) & KỸ NĂNG (EXAM SKILLS)
INSERT INTO public.exams (id, name, full_name, is_active, status_badge, target_format, sort_order) VALUES
  ('ielts', 'IELTS Academic', 'International English Language Testing System', true, 'Đang mở luyện', '4 Kỹ năng (Band 0-9.0)', 1),
  ('toeic', 'TOEIC LR/SW', 'Test of English for International Communication', false, 'Sắp ra mắt', 'Nghe - Đọc (Tối đa 990)', 2),
  ('toefl', 'TOEFL iBT', 'Test of English as a Foreign Language', false, 'Sắp ra mắt', 'Khảo thí máy tính (0-120)', 3),
  ('hsk', 'HSK 1-6 / HSKK', 'Kỳ thi kiểm tra năng lực Hán ngữ', false, 'Sắp ra mắt', 'Cấp độ HSK 3.0', 4),
  ('jlpt', 'JLPT N5-N1', 'Kỳ thi năng lực Nhật ngữ', false, 'Sắp ra mắt', 'Từ vựng, Nghe, Đọc', 5)
ON CONFLICT (id) DO UPDATE SET is_active = EXCLUDED.is_active;

INSERT INTO public.exam_skills (exam_id, skill_code, name, english_name, description, tone) VALUES
  ('ielts', 'listening', 'Nghe hiểu', 'Listening', 'Luyện 4 Section: Đối thoại hằng ngày, thuyết minh hướng dẫn, thảo luận học thuật và bài giảng đại học.', 'accent'),
  ('ielts', 'reading', 'Đọc hiểu', 'Reading', 'Chiến thuật Skimming & Scanning, xử lý bẫy True/False/Not Given, Matching Headings và Summary Completion.', 'warn'),
  ('ielts', 'writing', 'Viết học thuật', 'Writing', 'Phân tích biểu đồ xu hướng Task 1 và cấu trúc bài luận nghị luận xã hội Task 2 chuẩn mạch lạc Cohesion.', 'ok'),
  ('ielts', 'speaking', 'Nói trực tiếp', 'Speaking', 'Luyện phản xạ Part 1, thuyết trình 2 phút Part 2 theo sườn Cue Card và thảo luận trừu tượng Part 3.', 'mark')
ON CONFLICT (exam_id, skill_code) DO NOTHING;

-- 8. ĐỀ THI MẪU (EXAM TESTS)
-- Reading Test 1: Con đường Trà Mã
INSERT INTO public.exam_tests (
  id, exam_id, skill, title, subtitle, difficulty, time_minutes, total_questions, category_tags,
  passage_title, passage_content
) VALUES (
  'read_cam18_p1',
  'ielts',
  'reading',
  'Lịch sử Cây Chè và Con đường Trà Mã Cổ Đạo',
  'Cambridge IELTS Academic 18 - Passage 1',
  'Dễ',
  20,
  6,
  ARRAY['True/False/Not Given', 'Điền từ', 'Lịch sử'],
  'The Ancient Tea Horse Road: Heritage and Trade',
  'Tea has shaped human civilizations for millennia. Originating in the lush highlands of southwestern China, wild tea plants (Camellia sinensis) were first harvested not as a leisurely brew, but as a bitter medicinal herb. According to legendary records dating back to Emperor Shennong around 2737 BCE, leaves fell into a cauldron of boiling water, unleashing a refreshing fragrance that marked the serendipitous birth of tea consumption.

By the Tang Dynasty (618–907 CE), tea had transformed from an elite remedy into a national obsession. Buddhist monks embraced the beverage to maintain alertness during marathon meditation sessions, fostering an elaborate culture of tea preparation. However, it was during the Song Dynasty that tea acquired geopolitical importance through the creation of the Tea Horse Road (Cha Ma Gu Dao).

Stretching across thousands of perilous kilometers through snowy passes, sheer gorges, and dense subtropical jungles, the Tea Horse Road linked Sichuan and Yunnan provinces with the Tibetan plateau. Tibetans required tremendous amounts of brick tea to balance their high-meat, high-fat diet in sub-zero altitudes. In exchange, the Chinese imperial military urgently needed hardy Tibetan mountain horses to defend their northern frontiers against nomadic incursions. An elaborate barter exchange flourished: one prime Tibetan warhorse could command up to sixty kilograms of compressed brick tea.

The human porters and mule caravans faced unimaginable hardships. Caravans navigated cliffside paths barely two feet wide, suspended precariously over roaring currents of the Yangtze and Mekong rivers. Modern preservationists consider this ancient network a cultural conduit comparable in significance to the Silk Road, demonstrating how a simple beverage bridged disparate geographies and empires.'
) ON CONFLICT (id) DO NOTHING;

-- Câu hỏi cho Đề Reading Test 1
INSERT INTO public.exam_questions (test_id, question_number, type, question_text, options, correct_answer, explanation, category_tag, passage_section_ref) VALUES
  ('read_cam18_p1', 1, 'true_false_not_given', 'Wild tea leaves were originally consumed as a medicine rather than a recreational beverage.', '[{"id":"TRUE","text":"TRUE"},{"id":"FALSE","text":"FALSE"},{"id":"NOT GIVEN","text":"NOT GIVEN"}]'::jsonb, 'TRUE', 'Đoạn 1 nêu rõ: wild tea plants were first harvested not as a leisurely brew, but as a bitter medicinal herb.', 'True/False/Not Given', 'Đoạn 1'),
  ('read_cam18_p1', 2, 'true_false_not_given', 'Emperor Shennong intentionally conducted experiments to discover tea.', '[{"id":"TRUE","text":"TRUE"},{"id":"FALSE","text":"FALSE"},{"id":"NOT GIVEN","text":"NOT GIVEN"}]'::jsonb, 'FALSE', 'Đoạn 1 ghi serendipitous (tình cờ) birth of tea, chứng minh đây là việc ngẫu nhiên.', 'True/False/Not Given', 'Đoạn 1'),
  ('read_cam18_p1', 3, 'true_false_not_given', 'Tibetan warriors taught Chinese soldiers advanced equestrian tactics.', '[{"id":"TRUE","text":"TRUE"},{"id":"FALSE","text":"FALSE"},{"id":"NOT GIVEN","text":"NOT GIVEN"}]'::jsonb, 'NOT GIVEN', 'Bài đọc chỉ nhắc người Trung Hoa đổi trà lấy ngựa Tây Tạng, không hề đề cập việc dạy chiến thuật.', 'True/False/Not Given', 'Đoạn 3'),
  ('read_cam18_p1', 4, 'multiple_choice', 'Why did Tibetan people have an urgent demand for brick tea?', '[{"id":"A","text":"It was used as religious offering in Buddhist temples"},{"id":"B","text":"It helped counteract their heavy meat and fat diet in cold weather"},{"id":"C","text":"It was much cheaper than drinking fresh mountain water"},{"id":"D","text":"It was required by the Chinese emperor as yearly tax"}]'::jsonb, 'B', 'Đoạn 3 giải thích: Tibetans required tremendous amounts of brick tea to balance their high-meat, high-fat diet.', 'Multiple Choice', 'Đoạn 3'),
  ('read_cam18_p1', 5, 'fill_blank', 'A single high-quality Tibetan warhorse could be traded for approximately sixty kilograms of compressed ______ tea.', NULL, 'brick', 'Đoạn 3 ghi: one prime Tibetan warhorse could command up to sixty kilograms of compressed brick tea.', 'Điền từ', 'Đoạn 3'),
  ('read_cam18_p1', 6, 'fill_blank', 'Historical experts compare the cultural and commercial importance of the Tea Horse Road to the famous ______ Road.', NULL, 'Silk', 'Đoạn 4 ghi: cultural conduit comparable in significance to the Silk Road.', 'Điền từ', 'Đoạn 4')
ON CONFLICT (test_id, question_number) DO NOTHING;

-- Dẫn chứng nguyên văn trong bài đọc cho phần giải thích đáp án (migration 12)
UPDATE public.exam_questions AS q SET evidence_quote = v.quote
FROM (VALUES
  (1, 'wild tea plants (Camellia sinensis) were first harvested not as a leisurely brew, but as a bitter medicinal herb'),
  (2, 'leaves fell into a cauldron of boiling water, unleashing a refreshing fragrance that marked the serendipitous birth of tea consumption'),
  (3, 'In exchange, the Chinese imperial military urgently needed hardy Tibetan mountain horses to defend their northern frontiers against nomadic incursions.'),
  (4, 'Tibetans required tremendous amounts of brick tea to balance their high-meat, high-fat diet in sub-zero altitudes.'),
  (5, 'one prime Tibetan warhorse could command up to sixty kilograms of compressed brick tea'),
  (6, 'Modern preservationists consider this ancient network a cultural conduit comparable in significance to the Silk Road')
) AS v(num, quote)
WHERE q.test_id = 'read_cam18_p1' AND q.question_number = v.num;

-- Listening Test 1: Homestay Section 1
INSERT INTO public.exam_tests (
  id, exam_id, skill, title, subtitle, difficulty, time_minutes, total_questions, category_tags,
  audio_title, audio_duration_seconds, audio_script
) VALUES (
  'list_sec1_homestay',
  'ielts',
  'listening',
  'Đăng Ký Lưu Trú Homestay Tại New Zealand',
  'Cambridge IELTS 18 - Listening Section 1',
  'Dễ',
  10,
  5,
  ARRAY['Form Completion', 'Thông tin cá nhân', 'Section 1'],
  'Section 1: International Student Homestay Application',
  180,
  'OFFICER: Good morning. Welcome to Auckland International Student Services.
STUDENT: Hello. I am Keiko Tanaka. That is T-A-N-A-K-A. I study Environmental Science. I arrive on the 15th of February. Strictly no seafood, and I am allergic to cats.'
) ON CONFLICT (id) DO NOTHING;

-- Câu hỏi cho Đề Listening Section 1, kèm câu dẫn chứng trong transcript và đoạn audio (giây)
INSERT INTO public.exam_questions (test_id, question_number, type, question_text, options, correct_answer, explanation, category_tag, evidence_quote, audio_start_seconds, audio_end_seconds) VALUES
  ('list_sec1_homestay', 1, 'fill_blank', 'Student Full Name: Keiko ______', NULL, 'Tanaka', 'Học sinh đánh vần họ của mình: T-A-N-A-K-A.', 'Form Completion', 'I am Keiko Tanaka. That is T-A-N-A-K-A.', 9, 16),
  ('list_sec1_homestay', 2, 'fill_blank', 'Academic Program: Environmental ______', NULL, 'Science', 'Học sinh nói ngành học là Environmental Science.', 'Form Completion', 'I study Environmental Science.', 16, 20),
  ('list_sec1_homestay', 3, 'fill_blank', 'Arrival date in Auckland: 15th of ______', NULL, 'February', 'Học sinh nói ngày đến là 15 tháng Hai.', 'Form Completion', 'I arrive on the 15th of February.', 20, 24),
  ('list_sec1_homestay', 4, 'fill_blank', 'Dietary restriction: Cannot consume ______', NULL, 'seafood', 'Học sinh nói rõ không ăn hải sản ("Strictly no seafood").', 'Form Completion', 'Strictly no seafood', 24, 27),
  ('list_sec1_homestay', 5, 'multiple_choice', 'What pet allergy does the student specify?', '[{"id":"A","text":"Dogs"},{"id":"B","text":"Birds"},{"id":"C","text":"Cats"},{"id":"D","text":"Rabbits"}]'::jsonb, 'C', 'Học sinh nói bị dị ứng với mèo.', 'Multiple Choice', 'I am allergic to cats.', 27, 31)
ON CONFLICT (test_id, question_number) DO NOTHING;

-- Writing Test 2: AI in Education
INSERT INTO public.exam_tests (
  id, exam_id, skill, title, subtitle, difficulty, time_minutes, total_questions, category_tags,
  task_number, min_words, prompt_requirements
) VALUES (
  'write_task2_ai',
  'ielts',
  'writing',
  'Trí Tuệ Nhân Tạo và Tương Lai Giáo Dục',
  'IELTS Academic Writing Task 2 - Essay',
  'Khó',
  40,
  1,
  ARRAY['Task 2', 'Nghị luận xã hội', 'Agree or Disagree'],
  2,
  250,
  'Some people believe that artificial intelligence and automated teaching applications will soon replace human teachers in classrooms. Others argue that human educators remain irreplaceable in developing emotional intelligence and critical thinking.

Discuss both views and give your own opinion.
Write at least 250 words.'
) ON CONFLICT (id) DO NOTHING;

-- Speaking Test: Travel
INSERT INTO public.exam_tests (
  id, exam_id, skill, title, subtitle, difficulty, time_minutes, total_questions, category_tags,
  prep_time_seconds, speak_time_seconds, prompts
) VALUES (
  'speak_cue_travel',
  'ielts',
  'speaking',
  'Chuyến Đi Đáng Nhớ và Văn Hóa Bản Địa',
  'IELTS Speaking Full 3 Parts',
  'Trung bình',
  14,
  3,
  ARRAY['Part 1, 2, 3', 'Cue Card', 'Du lịch & Văn hóa'],
  60,
  120,
  ARRAY[
    'Part 1: Do you prefer travelling alone or with friends? What was the most interesting place you visited recently?',
    'Part 2 (Cue Card): Describe a memorable journey you made by public transport. You should say: Where you went, What transport you used, Who was with you, and explain why this journey was so memorable to you.',
    'Part 3: How has modern high-speed transportation changed tourism? Do you think remote natural attractions should limit visitor numbers to prevent pollution?'
  ]
) ON CONFLICT (id) DO NOTHING;

-- 9. LƯỢT LÀM BÀI GẦN ĐÂY CỦA MINH HOÀNG (Khớp bảng History trên frontend)
INSERT INTO public.exam_attempts (
  id, user_id, test_id, mode, raw_score, total_questions, band_score, duration_seconds, completed_at
) VALUES
  ('33333333-3333-3333-3333-333333333301', '00000000-0000-0000-0000-000000000001', 'read_cam18_p1', 'exam', 5, 6, 7.0, 1140, NOW() - INTERVAL '1 day'),
  ('33333333-3333-3333-3333-333333333302', '00000000-0000-0000-0000-000000000001', 'list_sec1_homestay', 'practice', 5, 5, 7.5, 620, NOW() - INTERVAL '3 days'),
  ('33333333-3333-3333-3333-333333333303', '00000000-0000-0000-0000-000000000001', 'write_task2_ai', 'exam', NULL, 1, 6.5, 2400, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;


-- ====================================================================
-- 10. PHÂN QUYỀN VAI TRÒ (USER ROLES)
-- ====================================================================
INSERT INTO public.user_roles (user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'user'),
  ('00000000-0000-0000-0000-000000000003', 'user')
ON CONFLICT (user_id) DO NOTHING;

-- ====================================================================
-- 11. LỘ TRÌNH CHẶNG HỌC (LEARNING STAGES)
-- ====================================================================
-- Chặng Gõ câu tiếng Anh
INSERT INTO public.learning_stages (id, stage_type, language, level, title, description, sort_order, xp_required) VALUES
  ('en-a1', 'typing', 'en', 'A1', 'Khởi động & Chào hỏi cơ bản', 'Luyện gõ các cấu trúc chào hỏi và giới thiệu bản thân thông dụng', 1, 0),
  ('en-a2', 'typing', 'en', 'A2', 'Đời sống thường nhật & Giao tiếp', 'Luyện phản xạ gõ các câu giao tiếp hàng ngày', 2, 150),
  ('en-b1', 'typing', 'en', 'B1', 'Diễn đạt ý kiến & Thảo luận', 'Rèn luyện gõ các cấu trúc câu phức và bày tỏ quan điểm', 3, 400),
  ('en-b2', 'typing', 'en', 'B2', 'Thuyết trình & Công việc chuyên môn', 'Gõ văn phong công sở và trình bày báo cáo', 4, 800),
  ('en-c1', 'typing', 'en', 'C1', 'Lập luận học thuật & Tư duy phản biện', 'Tốc độ gõ và độ chính xác cho văn bản học thuật chuyên sâu', 5, 1400)
ON CONFLICT (id) DO NOTHING;

-- Chặng Lộ trình Từ điển kiểu Duolingo
INSERT INTO public.learning_stages (id, stage_type, language, level, title, description, sort_order, xp_required) VALUES
  ('duo-en-1', 'dictionary', 'en', 'A1', 'Khởi Động & Chào Hỏi', 'Làm quen các đại từ xưng hô, câu chào hỏi lịch sự và từ vựng mở đầu', 1, 0),
  ('duo-en-2', 'dictionary', 'en', 'A2', 'Ẩm Thực & Mua Sắm', 'Nắm vững các từ vựng gọi món, giá cả, hương vị và thói quen sinh hoạt', 2, 120),
  ('duo-en-3', 'dictionary', 'en', 'B1', 'Công Việc & Giao Tiếp', 'Từ vựng văn phòng, email, thương lượng và họp dự án', 3, 300),
  ('duo-en-4', 'dictionary', 'en', 'B2', 'Học Thuật & Đời Sống', 'Các thuật ngữ nghiên cứu, suy luận logic và thảo luận chuyên sâu', 4, 600)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 12. CHỦ ĐỀ VÀ CÂU LUYỆN GÕ (TYPING TOPICS & SENTENCES)
-- ====================================================================
-- Chủ đề 1: Mua sắm (Life)
INSERT INTO public.typing_topics (id, language, level, group_type, title, description, icon_name, sort_order) VALUES
  ('en-life-shopping', 'en', 'A2', 'life', 'Mua sắm & Trả giá', 'Hỏi giá, đổi trả hàng và thanh toán tại cửa hàng quốc tế', 'ShoppingBag', 1),
  ('en-life-restaurant', 'en', 'A2', 'life', 'Gọi món tại nhà hàng', 'Đặt bàn, gọi món ăn, hỏi nguyên liệu và thanh toán hoá đơn', 'Utensils', 2),
  ('en-work-meeting', 'en', 'B1', 'work', 'Họp dự án & Thảo luận', 'Phát biểu ý kiến, xin phép ngắt lời và tổng kết hành động sau buổi họp', 'Briefcase', 3),
  ('en-work-email', 'en', 'B1', 'work', 'Soạn email công việc chuyên nghiệp', 'Viết thư chào hàng, theo dõi tiến độ và phúc đáp đối tác lịch sự', 'Mail', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.typing_sentences (topic_id, content, reading, translation, hint_word, sort_order) VALUES
  ('en-life-shopping', 'Could you tell me how much this jacket costs?', '/kʊd juː tel miː haʊ mʌtʃ ðɪs ˈdʒækɪt kɒsts/', 'Bạn có thể cho tôi biết chiếc áo khoác này giá bao nhiêu không?', 'Could', 1),
  ('en-life-shopping', 'Do you have this shirt in a medium size?', '/duː juː hæv ðɪs ʃɜːt ɪn ə ˈmiːdiəm saɪz/', 'Bạn có chiếc áo sơ mi này cỡ vừa không?', 'Do', 2),
  ('en-life-shopping', 'Can I get a tax refund receipt for this purchase?', '/kæn aɪ ɡet ə tæks rɪˈfʌnd rɪˈsiːt fɔː ðɪs ˈpɜːtʃəs/', 'Tôi có thể xin biên lai hoàn thuế cho món hàng này không?', 'Can', 3),
  ('en-life-shopping', 'I would like to return this item because it is slightly damaged.', '/aɪ wʊd laɪk tuː rɪˈtɜːn ðɪs ˈaɪtəm bɪˈkɒz ɪt ɪz ˈslaɪtli ˈdæmɪdʒd/', 'Tôi muốn trả lại món đồ này vì nó bị trầy xước nhẹ.', 'I', 4),

  ('en-life-restaurant', 'We would like a table for four near the window, please.', '/wiː wʊd laɪk ə ˈteɪbl fɔː fɔː nɪə ðə ˈwɪndəʊ pliːz/', 'Cho chúng tôi một bàn bốn người gần cửa sổ nhé.', 'We', 1),
  ('en-life-restaurant', 'What do you recommend as the specialty of the house?', '/wɒt duː juː ˌrekəˈmend æz ðə ˈspeʃəlti əv ðə haʊs/', 'Bạn gợi ý món gì là đặc sản của nhà hàng?', 'What', 2),
  ('en-life-restaurant', 'Could we have the bill split equally among us?', '/kʊd wiː hæv ðə bɪl splɪt ˈiːkwəli əˈmʌŋ ʌs/', 'Bạn có thể chia đều hoá đơn cho chúng tôi được không?', 'Could', 3),
  ('en-life-restaurant', 'Excuse me, could you bring us some extra napkins?', '/ɪkˈskjuːz miː kʊd juː brɪŋ ʌs sʌm ˈekstrə ˈnæpkɪnz/', 'Xin lỗi, bạn có thể mang thêm cho chúng tôi ít khăn ăn được không?', 'Excuse', 4),

  ('en-work-meeting', 'Let us go through the main agenda items before moving on to Q&A.', '/let ʌs ɡəʊ θruː ðə meɪn əˈdʒendə ˈaɪtəmz bɪˈfɔː ˈmuːvɪŋ ɒn tuː kjuː ænd eɪ/', 'Chúng ta hãy điểm qua các nội dung chính trước khi chuyển sang phần hỏi đáp.', 'Let', 1),
  ('en-work-meeting', 'Could you please elaborate on the budget projection for next quarter?', '/kʊd juː pliːz ɪˈlæbəreɪt ɒn ðə ˈbʌdʒɪt prəˈdʒekʃn fɔː nekst ˈkwɔːtə/', 'Bạn có thể giải thích chi tiết hơn về dự toán ngân sách quý tới được không?', 'Could', 2),
  ('en-work-meeting', 'I completely agree with your proposal regarding team reorganization.', '/aɪ kəmˈpliːtli əˈɡriː wɪð jɔː prəˈpəʊzl rɪˈɡɑːdɪŋ tiːm ˌriːˌɔːɡənaɪˈzeɪʃn/', 'Tôi hoàn toàn đồng ý với đề xuất của bạn về việc tái cấu trúc đội ngũ.', 'I', 3),
  ('en-work-meeting', 'Who will be responsible for finalizing the action items by Friday?', '/huː wɪl biː rɪˈspɒnsəbl fɔː ˈfaɪnəlaɪzɪŋ ðə ˈækʃn ˈaɪtəmz baɪ ˈfraɪdeɪ/', 'Ai sẽ chịu trách nhiệm chốt các đầu việc cần làm trước thứ Sáu?', 'Who', 4),

  ('en-work-email', 'Please find attached the updated project milestone report for your review.', '/pliːz faɪnd əˈtætʃt ðiː ʌpˈdeɪtɪd ˈprɒdʒekt ˈmaɪlstəʊn rɪˈpɔːt fɔː jɔː rɪˈvjuː/', 'Xin vui lòng xem báo cáo tiến độ dự án cập nhật đính kèm.', 'Please', 1),
  ('en-work-email', 'I am writing to inquire about the delivery schedule for our recent order.', '/aɪ æm ˈraɪtɪŋ tuː ɪnˈkwaɪə əˈbaʊt ðə dɪˈlɪvəri ˈʃedjuːl fɔː ˈaʊə ˈriːsnt ˈɔːdə/', 'Tôi viết thư này để hỏi về lịch giao hàng cho đơn hàng gần đây của chúng tôi.', 'I', 2),
  ('en-work-email', 'Thank you for your prompt response; we truly appreciate your assistance.', '/θæŋk juː fɔː jɔː prɒmpt rɪˈspɒns wiː ˈtruːli əˈpriːʃieɪt jɔː əˈsɪstəns/', 'Cảm ơn phản hồi nhanh chóng của bạn; chúng tôi rất trân trọng sự hỗ trợ này.', 'Thank', 3),
  ('en-work-email', 'Do not hesitate to reach out if you require any further clarification.', '/duː nɒt ˈhezɪteɪt tuː riːtʃ aʊt ɪf juː rɪˈkwaɪə ˈeni ˈfɜːðə ˌklærɪfɪˈkeɪʃn/', 'Đừng ngần ngại liên hệ nếu bạn cần làm rõ thêm bất kỳ điều gì.', 'Do', 4)
ON CONFLICT DO NOTHING;

-- ====================================================================
-- 13. BỘ TỪ ĐỀ XUẤT (CURATED VOCAB SETS & WORDS)
-- ====================================================================
INSERT INTO public.vocab_sets (id, user_id, level_id, title, description, is_system, language, is_public) VALUES
  ('44444444-4444-4444-4444-444444444401', NULL, 4, 'Oxford 3000 từ vựng học thuật cốt lõi', 'Nền tảng từ vựng học thuật quan trọng nhất xuất hiện trong mọi bài thi quốc tế', true, 'en', true),
  ('44444444-4444-4444-4444-444444444402', NULL, 5, 'IELTS Academic Essential Vocabulary', 'Tổng hợp từ vựng band 7.0+ chuyên dụng cho kỹ năng Writing và Reading', true, 'en', true),
  ('44444444-4444-4444-4444-444444444403', NULL, 3, 'Thành ngữ công sở & Giao tiếp thường nhật', 'Cụm từ tự nhiên người bản xứ sử dụng hàng ngày trong môi trường làm việc', true, 'en', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.vocab_words (id, set_id, word, phonetic, part_of_speech, meaning_vi, example_sentence, example_translation, reading, examples) VALUES
  ('55555555-5555-5555-5555-555555555501', '44444444-4444-4444-4444-444444444401', 'Resilient', '/rɪˈzɪliənt/', 'adj', 'Kiên cường, có khả năng phục hồi nhanh chóng sau nghịch cảnh', 'Local communities have proven remarkably resilient in the face of natural disasters.', 'Các cộng đồng địa phương đã chứng minh sự kiên cường đáng nể trước thiên tai.', NULL, '[{"target": "She is remarkably resilient.", "vi": "Cô ấy kiên cường một cách phi thường."}]'::jsonb),
  ('55555555-5555-5555-5555-555555555502', '44444444-4444-4444-4444-444444444401', 'Allocate', '/ˈæləkeɪt/', 'verb', 'Phân bổ, chỉ định nguồn vốn hoặc tài nguyên cho mục đích cụ thể', 'The government decided to allocate more funds to renewable energy research.', 'Chính phủ đã quyết định phân bổ thêm ngân quỹ cho nghiên cứu năng lượng tái tạo.', NULL, '[]'::jsonb),
  ('55555555-5555-5555-5555-555555555503', '44444444-4444-4444-4444-444444444401', 'Comprehensive', '/ˌkɒmprɪˈhensɪv/', 'adj', 'Toàn diện, bao hàm đầy đủ mọi khía cạnh', 'The university offers a comprehensive guide to international admissions.', 'Trường đại học cung cấp một cuốn cẩm nang toàn diện về tuyển sinh quốc tế.', NULL, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 14. NGỮ PHÁP (GRAMMAR POINTS & EXERCISES)
-- ====================================================================
-- Cấp A1
INSERT INTO public.grammar_points (id, language, level, title, vietnamese_title, summary, formula, explanation, examples, common_mistakes, xp_reward, sort_order) VALUES
  ('en-a1-present-simple', 'en', 'A1', 'Present Simple', 'Thì Hiện tại đơn', 'Diễn tả thói quen, chân lý hiển nhiên hoặc lịch trình cố định.', '{"pattern": "S + V(s/es) + O", "tokens": [{"label": "S", "role": "subject"}, {"label": "V(s/es)", "role": "verb"}, {"label": "O", "role": "object"}]}'::jsonb, 'Dùng thì hiện tại đơn khi sự việc xảy ra đều đặn hoặc là sự thật không đổi. Thêm -s/-es với chủ ngữ ngôi thứ 3 số ít.', '[{"target": "She works in a software company.", "vi": "Cô ấy làm việc tại một công ty phần mềm."}]'::jsonb, '[{"wrong": "He work here.", "correct": "He works here.", "explanation": "Chủ ngữ he là ngôi thứ 3 số ít, động từ cần thêm s."}]'::jsonb, 30, 1),
  ('en-a1-present-continuous', 'en', 'A1', 'Present Continuous', 'Thì Hiện tại tiếp diễn', 'Diễn đạt hành động đang diễn ra tại thời điểm nói hoặc xu hướng tạm thời.', '{"pattern": "S + am/is/are + V-ing", "tokens": [{"label": "S", "role": "subject"}, {"label": "am/is/are", "role": "verb"}, {"label": "V-ing", "role": "verb"}]}'::jsonb, 'Sử dụng trợ động từ to be đi kèm với động từ nguyên mẫu thêm đuôi -ing.', '[{"target": "They are preparing the monthly financial report.", "vi": "Họ đang chuẩn bị báo cáo tài chính hàng tháng."}]'::jsonb, '[]'::jsonb, 30, 2),
  ('en-a1-past-simple', 'en', 'A1', 'Past Simple', 'Thì Quá khứ đơn', 'Diễn đạt hành động đã chấm dứt hoàn toàn trong quá khứ.', '{"pattern": "S + V2/ed + O", "tokens": []}'::jsonb, 'Thêm -ed với động từ có quy tắc, tra bảng bất quy tắc với từ đặc biệt.', '[{"target": "We visited the museum yesterday.", "vi": "Chúng tôi đã thăm viện bảo tàng vào hôm qua."}]'::jsonb, '[]'::jsonb, 30, 3),
  ('en-a1-modal-can', 'en', 'A1', 'Modal Verb: Can / Could', 'Động từ khuyết thiếu: Can / Could', 'Diễn đạt khả năng, năng lực hoặc lời yêu cầu lịch sự.', '{"pattern": "S + can/could + V-bare", "tokens": []}'::jsonb, 'Sau modal verb luôn là động từ nguyên mẫu không chia to.', '[{"target": "Can you speak Spanish fluently?", "vi": "Bạn có thể nói tiếng Tây Ban Nha trôi chảy không?"}]'::jsonb, '[]'::jsonb, 30, 4)
ON CONFLICT (id) DO NOTHING;

-- Bài tập ngữ pháp mẫu
INSERT INTO public.grammar_exercises (id, point_id, question_type, prompt, question, options, correct_answer, explanation, sort_order) VALUES
  ('ex-ps-1', 'en-a1-present-simple', 'multiple_choice', 'Chọn dạng đúng của động từ trong ngoặc:', 'She _____ (read) the news online every morning.', '["read", "reads", "is reading", "reading"]'::jsonb, 'reads', 'Chủ ngữ "She" là ngôi thứ 3 số ít nên động từ thêm -s', 1),
  ('ex-ps-2', 'en-a1-present-simple', 'fill_blank', 'Điền trợ động từ thích hợp:', '_____ you understand the instructions clearly?', '[]'::jsonb, 'Do', 'Câu hỏi ở hiện tại đơn với chủ ngữ "you" dùng trợ động từ "Do"', 2)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 15. KHO VIDEO & PODCAST (MEDIA ITEMS, CUES, QUIZ)
-- ====================================================================
INSERT INTO public.media_items (id, media_type, language, level, topic, title, vietnamese_title, speaker, provider, source_url, duration_seconds, is_published) VALUES
  ('media-en-ted-memory', 'video', 'en', 'B1', 'tech', 'How Memories Form and How We Lose Them', 'Ký ức được hình thành và mất đi như thế nào trong não bộ', 'TED-Ed • Catharine Young', 'youtube', 'yOgabx8503Q', 154, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.media_cues (media_id, subtitle_lang, start_ms, end_ms, text, translation_vi, sort_order) VALUES
  ('media-en-ted-memory', 'en', 0, 8000, 'Imagine your brain as a vast library filled with millions of complex memories.', 'Hãy tưởng tượng bộ não của bạn như một thư viện khổng lồ chứa hàng triệu ký ức phức tạp.', 1),
  ('media-en-ted-memory', 'en', 8000, 16000, 'Memories are encoded by neurons connecting through microscopic junctions called synapses.', 'Ký ức được mã hóa bởi các nơ-ron kết nối qua các điểm tiếp hợp siêu nhỏ gọi là khớp thần kinh (synapse).', 2),
  ('media-en-ted-memory', 'en', 16000, 25000, 'Every time you recall an event, that neural connection is reactivated and strengthened.', 'Mỗi khi bạn gợi nhớ lại một sự kiện, kết nối thần kinh đó lại được tái kích hoạt và củng cố bền chặt hơn.', 3)
ON CONFLICT DO NOTHING;

INSERT INTO public.media_quiz_questions (media_id, segment_time_sec, question, options, correct_index, explanation) VALUES
  ('media-en-ted-memory', 16, 'What encodes memories in the human brain according to the video?', '["Hormones in the bloodstream", "Neurons connecting through synapses", "Muscle tissue reactions", "Genetic sequences"]'::jsonb, 1, 'Ký ức được lưu trữ thông qua mạng lưới liên kết giữa các nơ-ron thần kinh tại các synapse.')
ON CONFLICT DO NOTHING;

-- ====================================================================
-- 16. KHO ĐỌC (READING ITEMS & SECTIONS - VĂN BẢN MIỀN CÔNG CỘNG)
-- ====================================================================
INSERT INTO public.reading_items (id, content_type, language, level, title, vietnamese_title, author, source_note, word_count, reading_time_minutes, license, is_published) VALUES
  ('read-en-tortoise-hare', 'short_story', 'en', 'A2', 'The Tortoise and the Hare', 'Rùa và Thỏ - Truyện ngụ ngôn Aesop', 'Aesop (Phạm vi công cộng)', 'Nguồn: Truyện ngụ ngôn cổ Hy Lạp (Public Domain)', 210, 2, 'public_domain', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.reading_sections (reading_id, sort_order, original_text, translated_text, vocab_notes) VALUES
  ('read-en-tortoise-hare', 1, 'A Hare was once ridiculing the slow feet of a Tortoise. The Tortoise, smiling quietly, replied that despite his heavy shell, he could beat the nimble Hare in a race across the countryside.', 'Một ngày nọ, chú Thỏ buông lời chế giễu đôi chân chậm chạp của Rùa. Rùa chỉ mỉm cười điềm tĩnh đáp lại rằng bất chấp chiếc mai nặng nề, chú vẫn có thể đánh bại chú Thỏ lanh lợi trong một cuộc đua xuyên qua cánh đồng.', '[{"word": "ridiculing", "meaning": "Chế giễu"}, {"word": "nimble", "meaning": "Nhanh nhẹn"}]'::jsonb),
  ('read-en-tortoise-hare', 2, 'The Hare, amused by what he considered an impossible challenge, readily agreed. The Fox was chosen as the judge, and the race commenced under the warm afternoon sun.', 'Thỏ ta cảm thấy đây là một lời thách thức nực cười và không tưởng, liền sẵn sàng chấp thuận. Cáo được chọn làm trọng tài và cuộc đua chính thức khởi tranh dưới ánh nắng chiều ấm áp.', '[{"word": "commenced", "meaning": "Bắt đầu, khởi sự"}]'::jsonb)
ON CONFLICT DO NOTHING;

-- ====================================================================
-- 17. TỪ ĐIỂN CHUYÊN SÂU (DICTIONARY ENTRIES)
-- ====================================================================
INSERT INTO public.dictionary_entries (language, headword, source, license, data) VALUES
  ('en', 'pragmatic', 'in_house', 'CC-BY-SA 4.0', '{
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
  ('en', 'ubiquitous', 'in_house', 'CC-BY-SA 4.0', '{
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
ON CONFLICT (language, headword) DO NOTHING;

-- ====================================================================
-- 18. YÊU CẦU TÍNH NĂNG (FEATURE REQUESTS, VOTES & COMMENTS)
-- ====================================================================
INSERT INTO public.feature_requests (id, user_id, title, description, category, status, vote_count, comment_count, tags) VALUES
  ('66666666-6666-6666-6666-666666666601', '00000000-0000-0000-0000-000000000001', 'Hỗ trợ xuất bộ thẻ Flashcard Anki (.apkg)', 'Cho phép người học export trực tiếp các từ vựng đã lưu hoặc bộ từ theo chủ đề ra định dạng của Anki để ôn offline trên điện thoại.', 'tu_vung', 'in_progress', 1, 2, ARRAY['Anki', 'SRS', 'Export']),
  ('66666666-6666-6666-6666-666666666602', '00000000-0000-0000-0000-000000000002', 'Chấm điểm phát âm chi tiết từng âm vị (Phoneme scoring)', 'Sử dụng phân tích sóng âm để chỉ ra chính xác âm nào người học phát âm chưa chuẩn (ví dụ âm /θ/, /ð/, /r/ và /l/) thay vì chỉ chấm chung chung.', 'nghe_noi', 'under_review', 1, 0, ARRAY['Phonetics', 'Speech', 'Speaking']),
  ('66666666-6666-6666-6666-666666666603', '00000000-0000-0000-0000-000000000001', 'Giao diện bàn phím cơ ảo với âm thanh phím gõ tùy chỉnh', 'Thêm tùy chọn bật âm thanh gõ bàn phím cơ (Blue, Brown, Red switch) để tăng cảm hứng rèn luyện tốc độ gõ câu.', 'tien_ich', 'new', 0, 0, ARRAY['Typing', 'Audio', 'UX']),
  ('66666666-6666-6666-6666-666666666604', '00000000-0000-0000-0000-000000000003', 'Chế độ dịch câu song song thời gian thực kèm phân tích cú pháp', 'Hiển thị sơ đồ phân tích ngữ pháp dạng cây cho từng câu trong kho bài đọc để người học hiểu sâu cấu trúc ngữ pháp.', 'luyen_thi', 'completed', 1, 0, ARRAY['Grammar', 'Reading']),
  ('66666666-6666-6666-6666-666666666605', '00000000-0000-0000-0000-000000000004', 'Tích hợp phòng chat âm thanh trực tuyến tự do', 'Mở kênh voice chat công cộng để người dùng tự do trò chuyện ngẫu nhiên không có kiểm duyệt.', 'cong_dong', 'rejected', 0, 0, ARRAY['Community', 'Voice'])
ON CONFLICT (id) DO NOTHING;

-- Votes mẫu
INSERT INTO public.feature_request_votes (request_id, user_id) VALUES
  ('66666666-6666-6666-6666-666666666601', '00000000-0000-0000-0000-000000000002'),
  ('66666666-6666-6666-6666-666666666602', '00000000-0000-0000-0000-000000000001'),
  ('66666666-6666-6666-6666-666666666604', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Comments mẫu
INSERT INTO public.feature_request_comments (id, request_id, user_id, content) VALUES
  ('77777777-7777-7777-7777-777777777701', '66666666-6666-6666-6666-666666666601', '00000000-0000-0000-0000-000000000002', 'Rất cần tính năng này ạ! Em hay đi tàu điện ngầm không có mạng 4G, xuất ra Anki ôn thì tiện tuyệt vời.'),
  ('77777777-7777-7777-7777-777777777702', '66666666-6666-6666-6666-666666666601', '00000000-0000-0000-0000-000000000001', 'Chào bạn, đội ngũ đang tích hợp thư viện tạo file .apkg trực tiếp trên trình duyệt, dự kiến sẽ ra mắt trong tuần tới!')
ON CONFLICT (id) DO NOTHING;
