// ====================================================================
// backend/supabase/scripts/gen-seed/verify_seed.mjs
// Kiểm tra nội dung SQL sinh ra so với source.json (Offline Content Audit)
// ====================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../');

const sourcePath = path.join(__dirname, 'source.json');
const sqlPath = path.join(rootDir, 'backend/supabase/migrations/20261029000011_seed_learning_content.sql');

if (!fs.existsSync(sourcePath) || !fs.existsSync(sqlPath)) {
  console.error('❌ Thiếu source.json hoặc 20261029000011_seed_learning_content.sql');
  process.exit(1);
}

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const sqlContent = fs.readFileSync(sqlPath, 'utf8');

console.log('--- BẮT ĐẦU KIỂM CHỨNG TĨNH DỮ LIỆU SEED VỚI NGUỒN ---');

// 1. Thu thập tất cả các chuỗi dài >= 14 ký tự trong source.json
const stringsToFind = new Set();

function collectStrings(obj) {
  if (!obj) return;
  if (typeof obj === 'string') {
    const s = obj.trim();
    if (s.length >= 14) {
      stringsToFind.add(s);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach(collectStrings);
  } else if (typeof obj === 'object') {
    Object.values(obj).forEach(collectStrings);
  }
}

collectStrings(source);
console.log(`📊 Tổng số chuỗi độ dài >= 14 ký tự cần kiểm tra: ${stringsToFind.size}`);

let matchedCount = 0;
const unmatched = [];

for (const str of stringsToFind) {
  // Bỏ qua timestamp trích xuất
  if (str === source.extractedAt) continue;

  // Kiểm tra chuỗi gốc, chuỗi escape SQL '', chuỗi escape JSON \" hoặc kết hợp cả hai
  const sqlEscaped = str.replace(/'/g, "''");
  const jsonEscaped = str.replace(/"/g, '\\"');
  const bothEscaped = str.replace(/"/g, '\\"').replace(/'/g, "''");

  if (
    sqlContent.includes(str) ||
    sqlContent.includes(sqlEscaped) ||
    sqlContent.includes(jsonEscaped) ||
    sqlContent.includes(bothEscaped)
  ) {
    matchedCount++;
  } else {
    unmatched.push(str);
  }
}

console.log(`✅ Khớp thành công: ${matchedCount} / ${stringsToFind.size} chuỗi (${((matchedCount / stringsToFind.size) * 100).toFixed(2)}%)`);

if (unmatched.length > 0) {
  console.warn(`⚠️ Có ${unmatched.length} chuỗi không tìm thấy trong file SQL:`);
  unmatched.slice(0, 10).forEach(s => console.warn(`   - "${s}"`));
}

// 2. Kiểm tra ràng buộc nội dung ngữ pháp
let explanationNotesCount = 0;
let pitfallsCount = 0;
let wordOrderCount = 0;
let pointsTotal = 0;
let exercisesTotal = 0;

for (const lang of ['en', 'zh', 'ja']) {
  for (const sec of source.grammarLevels[lang] || []) {
    for (const p of sec.points || []) {
      pointsTotal++;
      explanationNotesCount += (p.explanationNotes || []).length;
      pitfallsCount += (p.pitfalls || []).length;
      for (const ex of p.exercises || []) {
        exercisesTotal++;
        if (ex.type === 'word_reorder' || ex.type === 'word_order') {
          wordOrderCount++;
        }
      }
    }
  }
}

console.log('\n--- RÀNG BUỘC ĐẶC BIỆT NGỮ PHÁP ---');
console.log(`- Tổng số grammar_points: ${pointsTotal} (Kỳ vọng: 24)`);
console.log(`- Tổng số explanation_notes: ${explanationNotesCount} (Kỳ vọng: 40)`);
console.log(`- Tổng số common_mistakes (pitfalls): ${pitfallsCount} (Kỳ vọng: 24)`);
console.log(`- Tổng số bài tập word_order: ${wordOrderCount} (Kỳ vọng: 6)`);
console.log(`- Tổng số bài tập ngữ pháp: ${exercisesTotal} (Kỳ vọng: 28)`);

if (explanationNotesCount === 40 && pitfallsCount === 24 && wordOrderCount === 6 && pointsTotal === 24 && exercisesTotal === 28) {
  console.log('🎉 TẤT CẢ RÀNG BUỘC NỘI DUNG NGỮ PHÁP ĐỀU ĐẠT CHUẨN 100%!');
} else {
  console.error('❌ Có ràng buộc nội dung chưa khớp với yêu cầu đề bài!');
  process.exit(1);
}
