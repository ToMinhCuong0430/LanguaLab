/**
 * create-test-users.mjs
 * Script tạo người dùng kiểm thử cục bộ cho môi trường phát triển (Local Test Only).
 * 
 * BẢO MẬT: Chặn chạy trên bất kỳ môi trường Remote / Staging / Production nào.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 1. KIỂM TRA MÔI TRƯỜNG AN TOÀN
function assertLocalEnvironment(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
    if (!isLocal) {
      console.error(`❌ BẢO VỆ AN TOÀN: Phát hiện URL từ xa (${url})!`);
      console.error(`Script create-test-users.mjs CHỈ ĐƯỢC CHẠY trên localhost/127.0.0.1 để tránh làm bẩn database thật.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ URL không hợp lệ: ${url}`, err.message);
    process.exit(1);
  }
}

assertLocalEnvironment(supabaseUrl);

if (!serviceRoleKey) {
  console.error('❌ Thiếu SUPABASE_SERVICE_ROLE_KEY! Cần service_role key để tạo user auth cục bộ.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`🚀 Bắt đầu khởi tạo test users trên môi trường cục bộ: ${supabaseUrl}`);

  const testUsers = [
    { email: 'local_learner_1@langua.local', password: 'Password123!', name: 'Local Learner 1' },
    { email: 'local_learner_2@langua.local', password: 'Password123!', name: 'Local Learner 2' },
  ];

  for (const u of testUsers) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.name },
    });

    if (error) {
      if (error.message?.includes('already registered')) {
        console.log(`ℹ️ User ${u.email} đã tồn tại trên local.`);
      } else {
        console.warn(`⚠️ Lỗi tạo ${u.email}:`, error.message);
      }
    } else {
      console.log(`✅ Đã tạo test user: ${u.email} (ID: ${data.user.id})`);
    }
  }

  console.log('🎉 Hoàn tất.');
}

main().catch((err) => {
  console.error('Lỗi thực thi:', err);
  process.exit(1);
});
