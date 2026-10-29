# Kịch Bản Kiểm Thử Row Level Security (RLS) & Chống Gian Lận (LanguaLab)

Tài liệu này định nghĩa danh sách kiểm thử chi tiết chính sách bảo mật tầng hàng (RLS), chống gian lận và tính toàn vẹn dữ liệu cho backend Supabase của dự án **LanguaLab**.

---

## 1. Nguyên Tắc An Toàn Dữ Liệu
- **Không sử dụng user giả cố định trong mã nguồn**: Mọi test case tự động được viết bằng `pgTAP` và bọc trong transaction `ROLLBACK`. Sau khi test chạy xong, database được hoàn nguyên 100%, không lưu bất kỳ user hay bản ghi rác nào.
- **Bảo vệ môi trường Production**: Các script bổ trợ chạy cục bộ (như `create-test-users.mjs`) tích hợp sẵn cơ chế kiểm tra `SUPABASE_URL`, tự động chặn và ném lỗi nếu phát hiện URL không phải `localhost` hoặc `127.0.0.1`.

---

## 2. Cách Chạy Bộ Kiểm Thử RLS Tự Động

### Cách 1: Sử dụng Supabase CLI (Khuyến nghị trên Local)
```bash
# Khởi động Supabase local nếu chưa chạy
npx supabase start

# Chạy toàn bộ test suites trong thư mục tests
npx supabase test db
```

### Cách 2: Chạy trực tiếp trên Supabase Studio (SQL Editor)
1. Mở file `backend/supabase/tests/01_rls_security_tests.sql`.
2. Sao chép toàn bộ nội dung và dán vào tab **SQL Editor** trên Supabase Studio Dashboard.
3. Bấm **Run**. Toàn bộ 6 test case sẽ được đánh giá và giao dịch được `ROLLBACK` an toàn ngay lập tức.

---

## 3. Ma Trận Kịch Bản Kiểm Thử Trọng Yếu (Critical Test Matrix)

| Mã | Khu Vực / Tính Năng | Kịch Bản Thử Nghiệm | Kỳ Vọng (Expected Outcome) | Tự Động Hóa (pgTAP) |
| :--- | :--- | :--- | :--- | :---: |
| **RLS-01** | Quyền riêng tư | User A đọc `user_word_progress`, `exam_attempts` của User B | ❌ Không trả về dòng nào (`0 rows returned`) | ✅ TC1 trong `01_rls_security_tests.sql` |
| **RLS-02** | Toàn vẹn hồ sơ | User A cố `UPDATE profiles` của User B | ❌ Bị chặn bởi RLS: 0 rows affected | ✅ TC2 trong `01_rls_security_tests.sql` |
| **RLS-03** | Chống hack XP/Streak | User A tự gọi `UPDATE profiles SET total_xp = 999999` | ❌ Trigger `tr_protect_profile_fields` chặn và ném exception | ✅ TC3 trong `01_rls_security_tests.sql` |
| **RLS-04** | Idempotent XP | Gọi `award_xp` 2 lần liên tiếp với cùng một `reference_id` | ✅ Lần 2 trả về `success: false, xp_gained: 0` | ✅ TC4 trong `01_rls_security_tests.sql` |
| **RLS-05** | Phân quyền vai trò | User thường cố `INSERT/UPDATE` vào bảng `user_roles` | ❌ Bị chặn bởi RLS (`42501 Insufficient Privilege`) | ✅ TC5 trong `01_rls_security_tests.sql` |
| **RLS-06** | Dữ liệu quản trị | User thường cố `SELECT` bảng `content_import_logs` | ❌ Không xem được bản ghi nào (`0 rows returned`) | ✅ TC6 trong `01_rls_security_tests.sql` |
| **RLS-07** | Giới hạn trần XP | User tích lũy vượt 500 XP trong cùng một ngày | ❌ Server tự động cắt bớt và chặn ở mức tối đa 500 XP/ngày | ✅ Được bảo đảm qua hàm `award_xp` |
| **RLS-08** | Storage riêng tư | User upload/xóa file ngoài thư mục `{auth.uid()}/*` | ❌ Bị chặn bởi Storage RLS policies | ✅ Kiểm tra bởi Storage policies |
