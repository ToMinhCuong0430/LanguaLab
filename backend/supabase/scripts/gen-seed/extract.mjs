// ====================================================================
// backend/supabase/scripts/gen-seed/extract.mjs
// Trích xuất các hằng nội dung nguồn từ Frontend & Git History ra source.json
// ====================================================================

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../');

function extractLiteral(fileContent, constName) {
  const regex = new RegExp(`(?:export\\s+)?const\\s+${constName}[^=]*=`, 'm');
  const match = regex.exec(fileContent);
  if (!match) throw new Error(`Could not find const ${constName}`);

  const equalsIndex = match.index + match[0].length;
  let startIdx = -1;
  let startChar = '';
  let endChar = '';

  for (let i = equalsIndex; i < fileContent.length; i++) {
    const c = fileContent[i];
    if (c === '[' || c === '{') {
      startIdx = i;
      startChar = c;
      endChar = c === '[' ? ']' : '}';
      break;
    }
  }
  if (startIdx === -1) throw new Error(`Could not find [ or { for ${constName}`);

  let depth = 0;
  let inStr = false;
  let strChar = '';
  let inLineComment = false;
  let inBlockComment = false;
  let endIdx = -1;

  for (let i = startIdx; i < fileContent.length; i++) {
    const c = fileContent[i];
    const prev = i > 0 ? fileContent[i - 1] : '';
    const next = i + 1 < fileContent.length ? fileContent[i + 1] : '';

    if (inLineComment) {
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (c === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inStr) {
      if (c === strChar && prev !== '\\') {
        inStr = false;
      }
      continue;
    }

    if (c === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }
    if (c === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }

    if (c === "'" || c === '"' || c === '`') {
      inStr = true;
      strChar = c;
      continue;
    }

    if (c === startChar) {
      depth++;
    } else if (c === endChar) {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  if (endIdx === -1) throw new Error(`Unterminated literal for ${constName}`);
  const literalCode = fileContent.slice(startIdx, endIdx + 1);

  // Evaluate inside new Function
  return new Function(`return (${literalCode})`)();
}

console.log('--- Đang trích xuất dữ liệu học từ Frontend và Git History ---');

// 1. MOCK_GRAMMAR_LEVELS từ useGrammar.ts
const grammarPath = path.join(rootDir, 'frontend/app/composables/useGrammar.ts');
const grammarContent = fs.readFileSync(grammarPath, 'utf8');
const grammarLevels = extractLiteral(grammarContent, 'MOCK_GRAMMAR_LEVELS');
console.log('✅ Đã trích xuất MOCK_GRAMMAR_LEVELS:', Object.keys(grammarLevels));

// 2. MOCK_TYPING_TOPICS từ useTypingPractice.ts
const typingPath = path.join(rootDir, 'frontend/app/composables/useTypingPractice.ts');
const typingContent = fs.readFileSync(typingPath, 'utf8');
const typingTopics = extractLiteral(typingContent, 'MOCK_TYPING_TOPICS');
console.log('✅ Đã trích xuất MOCK_TYPING_TOPICS:', typingTopics.length, 'chủ đề');

// 3. CURATED_VOCAB_SETS từ useVocab.ts
const vocabPath = path.join(rootDir, 'frontend/app/composables/useVocab.ts');
const vocabContent = fs.readFileSync(vocabPath, 'utf8');
const curatedVocabSets = extractLiteral(vocabContent, 'CURATED_VOCAB_SETS');
console.log('✅ Đã trích xuất CURATED_VOCAB_SETS:', curatedVocabSets.length, 'bộ từ');

// 4. CURATED_MEDIA_LIST từ useMedia.ts
const mediaPath = path.join(rootDir, 'frontend/app/composables/useMedia.ts');
const mediaContent = fs.readFileSync(mediaPath, 'utf8');
const curatedMediaList = extractLiteral(mediaContent, 'CURATED_MEDIA_LIST');
console.log('✅ Đã trích xuất CURATED_MEDIA_LIST:', curatedMediaList.length, 'bài học media');

// 5. PUBLIC_DOMAIN_READING_LIST từ useReading.ts
const readingPath = path.join(rootDir, 'frontend/app/composables/useReading.ts');
const readingContent = fs.readFileSync(readingPath, 'utf8');
const readingList = extractLiteral(readingContent, 'PUBLIC_DOMAIN_READING_LIST');
console.log('✅ Đã trích xuất PUBLIC_DOMAIN_READING_LIST:', readingList.length, 'bài đọc');

// 6. Dữ liệu IELTS từ Git History (commit trước khi xoá app/mocks: ca2428754cd358b231e7de1228137bcfd6c6350c)
const gitIeltsCmd = 'git show ca2428754cd358b231e7de1228137bcfd6c6350c:frontend/app/mocks/ielts.mock.ts';
const gitIeltsRaw = execSync(gitIeltsCmd, { cwd: rootDir, maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
const ieltsSkillsOverview = extractLiteral(gitIeltsRaw, 'mockSkillsOverview');
const ieltsAllTests = extractLiteral(gitIeltsRaw, 'mockAllTests');
console.log('✅ Đã trích xuất IELTS từ Git:', ieltsSkillsOverview.length, 'kỹ năng,', ieltsAllTests.length, 'đề thi');

// Tạo object tổng hợp
const source = {
  extractedAt: new Date().toISOString(),
  grammarLevels,
  typingTopics,
  curatedVocabSets,
  curatedMediaList,
  readingList,
  ielts: {
    skills: ieltsSkillsOverview,
    tests: ieltsAllTests,
  },
};

const outputPath = path.join(__dirname, 'source.json');
fs.writeFileSync(outputPath, JSON.stringify(source, null, 2), 'utf8');
console.log(`\n🎉 Trích xuất hoàn tất! File đã được lưu tại: ${outputPath}`);
