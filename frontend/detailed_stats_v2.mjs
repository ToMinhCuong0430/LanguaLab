import fs from 'fs';

// Đọc useGrammar.ts
const grammarCode = fs.readFileSync('frontend/app/composables/useGrammar.ts', 'utf8');
// Đếm các grammar point trong MOCK_GRAMMAR_LEVELS
// Mỗi grammar point có id: 'en-...' hoặc 'zh-...' hoặc 'ja-...'
const grammarPointIds = (grammarCode.match(/id:\s*['"](en|zh|ja)-[a-z0-9-]+['"]/g) || []);
// Đếm các bài tập (exercises) trong grammar points
// Mỗi bài tập thường có question: hoặc prompt:
const grammarExPrompts = (grammarCode.match(/prompt:\s*['"][^'"]+['"]/g) || []);

// Đọc useTypingPractice.ts
const typingCode = fs.readFileSync('frontend/app/composables/useTypingPractice.ts', 'utf8');
const typingTopicIds = (typingCode.match(/id:\s*['"]topic-[a-z0-9-]+['"]/g) || []);
const typingSentenceTargets = (typingCode.match(/targetText:\s*['"][^'"]+['"]/g) || []);
const roadmapNodeIds = (typingCode.match(/id:\s*['"](en|zh|ja)-[a-z0-9]+['"]/g) || []);

// Đọc useVocab.ts
const vocabCode = fs.readFileSync('frontend/app/composables/useVocab.ts', 'utf8');
const vocabSetIds = (vocabCode.match(/id:\s*['"]set_[a-z0-9_]+['"]/g) || []);
// Đếm words trong CURATED_VOCAB_SETS: mỗi word có word: '...'
const vocabWords = (vocabCode.match(/word:\s*['"][^'"]+['"]/g) || []);

// Đọc useMedia.ts
const mediaCode = fs.readFileSync('frontend/app/composables/useMedia.ts', 'utf8');
const mediaItemIds = (mediaCode.match(/id:\s*['"]media-[a-z0-9-]+['"]/g) || []);
const mediaCues = (mediaCode.match(/startMs:\s*\d+/g) || []);
const mediaQuizQuestions = (mediaCode.match(/question:\s*['"][^'"]+['"]/g) || []);

// Đọc useReading.ts
const readingCode = fs.readFileSync('frontend/app/composables/useReading.ts', 'utf8');
const readingItemIds = (readingCode.match(/id:\s*['"]read-[a-z0-9-]+['"]/g) || []);
// Trong reading, các section nằm trong sections: [{ originalText: ... }]
const readingSections = (readingCode.match(/originalText:\s*`[\s\S]*?`/g) || []);

// Đọc ielts.mock.ts
const ieltsCode = fs.readFileSync('frontend/app/mocks/ielts.mock.ts', 'utf8');
// Trong mockAllTests, mỗi test có id: 'read_...' | 'list_...' | 'write_...' | 'speak_...'
const ieltsTestIds = ['read_cam18_p1', 'read_coral_p2', 'list_sec1_homestay', 'write_task2_ai', 'speak_cue_travel'];
const ieltsQuestions = (ieltsCode.match(/questionText:\s*['"][^'"]+['"]/g) || []);

// Đọc home.mock.ts
const homeCode = fs.readFileSync('frontend/app/mocks/home.mock.ts', 'utf8');
// mockVocabLevels: 7 cấp độ
// mockExamOptions: 5 kỳ thi
// mockTargetBandRoadmap: 1 roadmap với 5 milestones

console.log('--- CHI TIẾT SỐ LƯỢNG BẢN GHI NHÓM B ---');
console.log('1. Ngữ pháp (useGrammar.ts):');
console.log('   - Điểm ngữ pháp (grammar_points):', grammarPointIds.length);
console.log('   - Bài tập ngữ pháp (grammar_exercises):', grammarExPrompts.length);
console.log('2. Gõ câu (useTypingPractice.ts):');
console.log('   - Lộ trình chặng học (learning_stages - typing):', roadmapNodeIds.length);
console.log('   - Chủ đề luyện gõ (typing_topics):', typingTopicIds.length);
console.log('   - Câu luyện gõ (typing_sentences):', typingSentenceTargets.length);
console.log('3. Từ vựng (useVocab.ts & home.mock.ts):');
console.log('   - Cấp độ từ vựng (vocab_levels): 7 (từ home.mock.ts & seed.sql)');
console.log('   - Bộ từ vựng hệ thống (vocab_sets):', vocabSetIds.length);
console.log('   - Từ vựng hệ thống (vocab_words):', vocabWords.length);
console.log('4. Media & Podcast (useMedia.ts):');
console.log('   - Nội dung media (media_items):', mediaItemIds.length);
console.log('   - Dòng phụ đề song ngữ (media_cues):', mediaCues.length);
console.log('   - Câu hỏi trắc nghiệm video (media_quiz_questions):', mediaQuizQuestions.length);
console.log('5. Đọc & Dịch (useReading.ts):');
console.log('   - Bài đọc văn bản (reading_items):', readingItemIds.length);
console.log('   - Đoạn văn song ngữ (reading_sections):', readingSections.length);
console.log('6. Luyện thi IELTS (ielts.mock.ts):');
console.log('   - Danh mục kỳ thi (exams): 5');
console.log('   - Kỹ năng kỳ thi (exam_skills): 4');
console.log('   - Đề thi IELTS (exam_tests):', ieltsTestIds.length);
console.log('   - Câu hỏi đề thi (exam_questions):', ieltsQuestions.length);
console.log('7. Lộ trình từ điển & band (useDictionary.ts & home.mock.ts):');
console.log('   - Chặng học lộ trình từ điển (learning_stages - dictionary): 11 chặng (en: 4, zh: 4, ja: 3)');
console.log('   - Milestones mục tiêu band:', 5);
