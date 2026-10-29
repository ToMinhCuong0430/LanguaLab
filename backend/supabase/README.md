# Hướng Dẫn Cơ Sở Dữ Liệu Supabase - Dự Án LanguaLab

Tài liệu này hướng dẫn quản trị cơ sở dữ liệu Supabase, thực thi migrations, cấu hình Row Level Security (RLS), chạy kiểm thử pgTAP, quản trị quyền Admin và triển khai Edge Function cho dự án **LanguaLab**.

---

## 1. Cấu Trúc Thư Mục `backend/supabase/`

```text
backend/supabase/
├── config.toml           # Cấu hình cổng, auth, storage của Supabase CLI
├── seed.sql              # Hướng dẫn seed (đã gỡ sạch 100% user giả và fake data)
├── README.md             # Tài liệu này
├── functions/
│   └── delete-account/   # Edge Function xoá tài khoản + dọn sạch file Storage
├── scripts/
│   └── grant_admin.sql   # Script nâng cấp tài khoản thật thành Quản trị viên (Admin)
├── tests/
│   ├── 01_rls_security_tests.sql  # Bộ test pgTAP kiểm thử RLS & anti-cheat (ROLLBACK sạch)
│   ├── create-test-users.mjs      # Script tạo test user (chỉ cho phép chạy trên localhost)
│   └── rls_checklist.md           # Bảng ma trận kịch bản kiểm thử bảo mật
├── types/
│   └── database.types.ts # TypeScript database definitions cho frontend & backend
└── migrations/
    ├── 20261022000001_init_extensions_and_enums.sql
    ├── 20261022000002_create_profiles.sql
    ├── 20261022000003_create_gamification_and_notifications.sql
    ├── 20261022000004_create_vocabulary.sql
    ├── 20261022000005_create_exams.sql
    ├── 20261022000006_create_stats_views.sql
    ├── 20261022000007_setup_rls_and_storage.sql
    ├── 20261023000008_extend_schema_for_features.sql
    ├── 20261024000009_create_content_import_logs_and_admin_rls.sql
    ├── 20261025000010_ielts_rpc_and_strict_rls.sql
    ├── 20261029000011_seed_learning_content.sql    # Toàn bộ nội dung học thật của hệ thống
    └── 20261029000012_security_hardening.sql       # Thắt chặt RLS, anti-cheat, storage RLS
```

---

## 2. Hướng Dẫn Khởi Tạo Backend Từ Đầu

### Điều kiện tiên quyết
- Cài đặt **Docker Desktop** (đang chạy).
- Node.js >= 18.
- Supabase CLI (`npx supabase`).

### A. Khởi tạo môi trường Local (Phát triển cục bộ)
```bash
# 1. Khởi động các container Supabase (Postgres, Studio, Auth, Storage, Kong)
npx supabase start

# 2. Reset database: tự động chạy toàn bộ migrations (01 -> 12)
npx supabase db reset

# 3. Chạy bộ kiểm thử bảo mật RLS & Anti-cheat (pgTAP)
npx supabase test db

# 4. Sinh file types TypeScript mới nhất từ database local
npx supabase gen types typescript --local > backend/supabase/types/database.types.ts
```

### B. Triển khai lên Cơ sở Dữ liệu Từ Xa (Remote Supabase Project)
> ⚠️ **LƯU Ý AN TOÀN**: Tuyệt đối **KHÔNG** chạy `db reset --linked` trên dự án production/remote!

```bash
# 1. Kiểm tra trước các migration chưa chạy trên Remote (Dry run)
npx supabase db push --dry-run

# 2. Áp dụng migration lên Remote
npx supabase db push

# 3. Triển khai Edge Function delete-account
npx supabase functions deploy delete-account --no-verify-jwt
```

---

## 3. Cấp Quyền Quản Trị Viên (Admin) Cho Tài Khoản Thật

Hệ thống **không có bất kỳ tài khoản admin giả nào được hardcode**. Để cấp quyền Admin cho tài khoản thật của bạn:

1. Đăng ký tài khoản người dùng bình thường trên giao diện Web hoặc Supabase Auth.
2. Mở **Supabase Studio SQL Editor** (hoặc chạy CLI qua `npx supabase db execute`).
3. Mở file `backend/supabase/scripts/grant_admin.sql`, thay thế `'EMAIL_CUA_BAN@example.com'` bằng email tài khoản vừa đăng ký.
4. Bấm **Run**. Tài khoản sẽ được thêm vào `public.user_roles` với vai trò `admin`.

---

## 4. Kiểm Thử Bảo Mật Row Level Security (RLS)

- Bộ test `backend/supabase/tests/01_rls_security_tests.sql` bao gồm 6 tình huống bảo mật trọng yếu:
  1. Người dùng không thể xem trộm bài thi (`exam_attempts`) hay tiến độ từ vựng (`user_word_progress`) của người khác.
  2. Người dùng không thể chỉnh sửa profile của người khác (0 row affected).
  3. Người dùng không thể tự update trực tiếp cột nhạy cảm (`total_xp`, `streak_days`, `level_id`) trên bảng `profiles`.
  4. Hàm `award_xp` đảm bảo tính **Idempotent**: gọi 2 lần với cùng một `reference_id` sẽ từ chối cộng điểm lần 2.
  5. Người dùng thường không thể tự gán quyền admin trong `user_roles`.
  6. Người dùng thường không thể truy cập bảng nhật ký import quản trị (`content_import_logs`).
- **An toàn 100%**: Tất cả test case chạy trong khối giao dịch `BEGIN; ... ROLLBACK;`, database hoàn toàn không bị vướng bẩn sau khi kiểm thử.

---

## 5. Danh Sách Storage Buckets & Phân Quyền
1. **`avatars`** (Public Read): Mọi người có thể xem ảnh đại diện; người dùng chỉ có quyền Upload, Update, Delete ảnh trong thư mục `{auth.uid()}/*` của chính mình.
2. **`speaking-recordings`** (Private): Chỉ người dùng sở hữu mới được Upload, Xem và Xoá file ghi âm nói của mình trong thư mục `{auth.uid()}/*`.
3. **`pronunciation-recordings`** (Private): Tương tự, lưu trữ các bản thu luyện phát âm cá nhân dưới `{auth.uid()}/*`.

---

## 6. Edge Function `delete-account`
- **Đường dẫn**: `backend/supabase/functions/delete-account/index.ts`
- **Cơ chế hoạt động**:
  * Đọc JWT token từ header `Authorization`, xác thực chính chủ qua `supabase.auth.getUser()`.
  * Dùng `service_role` dọn dẹp sạch toàn bộ file trong 3 storage buckets (`avatars/{userId}`, `speaking-recordings/{userId}`, `pronunciation-recordings/{userId}`).
  * Gọi `admin.auth.admin.deleteUser(userId)`. Cơ sở dữ liệu tự động kích hoạt `ON DELETE CASCADE` dọn sạch 100% dữ liệu liên quan trong các bảng con.
