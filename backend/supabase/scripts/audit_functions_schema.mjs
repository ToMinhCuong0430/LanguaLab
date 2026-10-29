// ====================================================================
// backend/supabase/scripts/audit_functions_schema.mjs
// Quét toàn bộ thân hàm/trigger/policy trong migrations 8, 10, 12
// So sánh với schema thực tế từ migrations 1-11 để phát hiện cột/bảng không tồn tại
// ====================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../migrations');

// 1. Đọc và trích xuất schema của tất cả các bảng từ migrations 1-11
const schemaFiles = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql') && f <= '20261029000011_seed_learning_content.sql')
  .sort();

const allSchemaSql = schemaFiles.map(f => fs.readFileSync(path.join(migrationsDir, f), 'utf8')).join('\n');

const tables = {}; // { tableName: Set([col1, col2, ...]) }

const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(([\s\S]*?)\n\);/gi;
let match;
while ((match = tableRegex.exec(allSchemaSql)) !== null) {
  const tableName = match[1];
  const body = match[2];
  tables[tableName] = tables[tableName] || new Set();

  const lines = body.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--')) continue;
    if (/^CONSTRAINT\b/i.test(trimmed)) continue;
    if (/^PRIMARY\s+KEY\b/i.test(trimmed)) continue;
    if (/^FOREIGN\s+KEY\b/i.test(trimmed)) continue;
    if (/^CHECK\b/i.test(trimmed)) continue;
    if (/^UNIQUE\b/i.test(trimmed)) continue;

    const colMatch = /^(\w+)\s+/i.exec(trimmed);
    if (colMatch) {
      tables[tableName].add(colMatch[1].toLowerCase());
    }
  }
}

console.log('📋 Danh sách các bảng và số lượng cột đã trích xuất từ schema:');
for (const [tbl, cols] of Object.entries(tables)) {
  console.log(`   - ${tbl}: ${cols.size} cột [${Array.from(cols).join(', ')}]`);
}

// 2. Quét các hàm trong migration 12, 10, 8
const targetMigrations = [
  '20261023000008_extend_schema_for_features.sql',
  '20261025000010_ielts_rpc_and_strict_rls.sql',
  '20261029000012_security_hardening.sql'
];

console.log('\n🔎 Bắt đầu quét các hàm trong migrations 8, 10, 12...');

const issues = [];

targetMigrations.forEach(file => {
  const filePath = path.join(migrationsDir, file);
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');

  // Quét INSERT INTO table (cols)
  const insertRegex = /INSERT\s+INTO\s+(?:public\.)?(\w+)\s*\(([^)]+)\)/gi;
  let im;
  while ((im = insertRegex.exec(content)) !== null) {
    const table = im[1].toLowerCase();
    const cols = im[2].split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
    if (tables[table]) {
      cols.forEach(col => {
        // bỏ qua các biểu thức
        if (col.includes('(') || col.includes(' ')) return;
        if (!tables[table].has(col)) {
          issues.push({
            file,
            table,
            column: col,
            type: 'INSERT INTO invalid column',
            raw: im[0]
          });
        }
      });
    }
  }

  // Quét UPDATE table SET col = ...
  const updateRegex = /UPDATE\s+(?:public\.)?(\w+)\s+SET\s+([\s\S]*?)(?:WHERE|RETURNING|;)/gi;
  let um;
  while ((um = updateRegex.exec(content)) !== null) {
    const table = um[1].toLowerCase();
    const setClause = um[2];
    const assignments = setClause.split(',');
    if (tables[table]) {
      assignments.forEach(assign => {
        const parts = assign.trim().split('=');
        if (parts.length >= 2) {
          const col = parts[0].trim().toLowerCase();
          if (/^\w+$/.test(col) && !tables[table].has(col)) {
            issues.push({
              file,
              table,
              column: col,
              type: 'UPDATE invalid column',
              raw: assign.trim()
            });
          }
        }
      });
    }
  }

  // Quét SELECT col FROM table WHERE col
  // Kiểm tra cụ thể các bảng hay dùng: profiles, exam_attempts, typing_attempts, grammar_attempts, xp_events
  const checkTables = ['profiles', 'exam_attempts', 'typing_attempts', 'grammar_attempts', 'xp_events'];
  checkTables.forEach(t => {
    // Regex tìm SELECT ... FROM public.t
    const selectRegex = new RegExp(`SELECT\\s+([\\s\\S]*?)\\s+FROM\\s+(?:public\\.)?${t}\\b`, 'gi');
    let sm;
    while ((sm = selectRegex.exec(content)) !== null) {
      const selectCols = sm[1].split(',').map(c => c.trim().toLowerCase());
      selectCols.forEach(sc => {
        // lấy tên cột đơn giản
        const m = /^(\w+)$/.exec(sc);
        if (m && tables[t] && !tables[t].has(m[1])) {
          issues.push({
            file,
            table: t,
            column: m[1],
            type: `SELECT invalid column from ${t}`,
            raw: sm[0]
          });
        }
      });
    }

    // Regex tìm FROM public.t WHERE col ...
    const whereRegex = new RegExp(`FROM\\s+(?:public\\.)?${t}\\s+WHERE\\s+([\\s\\S]*?)(?:GROUP|ORDER|LIMIT|;|\\))`, 'gi');
    let wm;
    while ((wm = whereRegex.exec(content)) !== null) {
      const whereClause = wm[1];
      // Tìm các từ khóa dạng col_name = hoặc col_name >=
      const colRegex = /(\b\w+\b)\s*(?:=|>=|<=|>|<|IS|IN|LIKE)/gi;
      let cm;
      while ((cm = colRegex.exec(whereClause)) !== null) {
        const colCandidate = cm[1].toLowerCase();
        if (['and', 'or', 'not', 'select', 'exists', 'null', 'true', 'false', 'coalesce', 'date_trunc', 'current_date', 'now'].includes(colCandidate)) continue;
        if (tables[t] && !tables[t].has(colCandidate)) {
          issues.push({
            file,
            table: t,
            column: colCandidate,
            type: `WHERE invalid column on ${t}`,
            raw: cm[0]
          });
        }
      }
    }
  });
});

console.log(`\n🚨 KẾT QUẢ QUÉT TĨNH: Phát hiện ${issues.length} lỗi cột không tồn tại:`);
console.table(issues);
