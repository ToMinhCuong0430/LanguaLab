# Kịch Bản Kiểm Thử Row Level Security (RLS) & Chống Gian Lận (Langua)

Tài liệu này định nghĩa danh sách kiểm thử chi tiết chính sách bảo mật tầng hàng (RLS) và tính toàn vẹn dữ liệu cho backend Supabase của dự án **Langua**.

---

## 1. Thiết Lập Môi Trường Thử Nghiệm

Chuẩn bị 3 tài khoản kiểm thử đại diện cho 3 phân quyền:
- **User A (Học viên 1)**: `00000000-0000-0000-0000-000000000001` (`hoang@langua.local` - kiêm **Admin**)
- **User B (Học viên 2)**: `00000000-0000-0000-0000-000000000002` (`baoanh@langua.local` - **User thường**)
- **User C (Học viên 3)**: `00000000-0000-0000-0000-000000000003` (`dangkhoa@langua.local` - **User thường**)
- **Anonymous (Khách chưa đăng nhập)**: Token `anon`

---

## 2. Ma Trận Kịch Bản Kiểm Thử (Test Scenarios Matrix)

| Mã | Khu Vực / Tính Năng | Kịch Bản Thử Nghiệm | Kỳ Vọng (Expected Outcome) | Đạt / Không Đạt |
| :--- | :--- | :--- | :--- | :---: |
| **RLS-01** | Quyền riêng tư cá nhân | User B thực hiện `SELECT * FROM daily_checkins WHERE user_id = 'A'` | ❌ Không trả về dòng nào (`0 rows returned`) | [ ] |
| **RLS-02** | Quyền riêng tư cá nhân | User B thực hiện `SELECT * FROM user_videos WHERE user_id = 'A'` | ❌ Không xem được video cá nhân của User A | [ ] |
| **RLS-03** | Quyền riêng tư cá nhân | User B thực hiện `SELECT * FROM user_video_cues WHERE user_id = 'A'` | ❌ Không xem được phụ đề riêng tư của User A | [ ] |
| **RLS-04** | Quyền riêng tư cá nhân | User B truy vấn `user_texts` hoặc `user_saved_words` của User A | ❌ Chỉ thấy các bản ghi có `user_id = auth.uid()` | [ ] |
| **RLS-05** | Storage riêng tư | User B gửi request HTTP download file từ bucket `pronunciation-recordings/{User_A_id}/audio.webm` | ❌ Bị từ chối `403 Forbidden` / Policy Storage chặn | [ ] |
| **RLS-06** | Nội dung chung | User B (user thường) thực hiện `INSERT INTO grammar_points (...)` hoặc `UPDATE` | ❌ Bị chặn bởi RLS: `new row violates row-level security policy` | [ ] |
| **RLS-07** | Nội dung chung | User B thực hiện `INSERT INTO media_items (...)` hoặc `reading_items` | ❌ Thất bại: Chỉ `public.is_admin()` mới có quyền ghi | [ ] |
| **RLS-08** | Nội dung chung | User A (Admin) thực hiện `INSERT INTO grammar_points (...)` | ✅ Thành công do thoả mãn `public.is_admin()` | [ ] |
| **RLS-09** | Từ điển | User B cố tình `INSERT` hoặc `DELETE` dòng trong `dictionary_entries` | ❌ Thất bại: Từ điển chỉ cho phép đọc công khai | [ ] |
| **RLS-10** | Chống nâng quyền | User B tự thực hiện `UPDATE user_roles SET role = 'admin' WHERE user_id = 'B'` | ❌ Bị chặn hoàn toàn: Không có policy INSERT/UPDATE cho người dùng | [ ] |
| **RLS-11** | Chống tự sửa điểm | User B gọi trực tiếp `INSERT INTO xp_events (user_id, xp_amount, source) VALUES ('B', 1000, 'cheat')` | ❌ Thất bại: Đã thu hồi quyền INSERT trực tiếp từ client trên `xp_events` | [ ] |
| **RLS-12** | Chống tự sửa điểm SRS | User B gọi `UPDATE user_word_progress SET interval_days = 999` trực tiếp | ❌ Thất bại: Client chỉ có quyền `SELECT`, bắt buộc gọi RPC `review_word` | [ ] |
| **RLS-13** | Bình chọn tính năng | User B gửi `INSERT INTO feature_request_votes` liên tiếp 2 lần cùng 1 `request_id` | ❌ Lần 2 thất bại do vi phạm khoá chính kép `(request_id, user_id)` | [ ] |
| **RLS-14** | Bình chọn qua RPC | User B gọi RPC `toggle_feature_vote(req_id)` 2 lần liên tiếp | ✅ Lần 1: `has_voted = true`, `vote_count` +1. Lần 2: `has_voted = false`, `vote_count` -1 | [ ] |
| **RLS-15** | Bảo vệ vote_count | User B gọi `UPDATE feature_requests SET vote_count = 9999 WHERE id = 'feat-1'` | ❌ Thất bại: RLS chặn người dùng sửa các cột trạng thái/điểm số | [ ] |
| **RLS-16** | Tác giả sửa bài | User B tạo yêu cầu `feat-new`, khi trạng thái là `new` thì sửa được mô tả | ✅ Cập nhật thành công | [ ] |
| **RLS-17** | Tác giả sửa bài | Khi Admin đổi trạng thái `feat-new` thành `in_progress`, User B cố sửa lại | ❌ Bị chặn: Tác giả chỉ được sửa khi `status = 'new'` | [ ] |
| **RLS-18** | Bảo mật danh tính | Khách hoặc người dùng xem danh sách qua View `feature_requests_public` | ✅ Xem được tiêu đề, số vote, tên tác giả, avatar; ❌ KHÔNG lộ `email` hay `user_id` | [ ] |
| **RLS-19** | Giới hạn phụ đề video | Người dùng tải lên dòng phụ đề thứ 1001 vào `user_video_cues` cho cùng 1 video | ❌ Trigger `check_user_video_cues_limit` ném lỗi ngoại lệ chặn vượt quota | [ ] |
| **RLS-20** | Ràng buộc bản quyền | Admin thêm bài vào `reading_items` với `is_published = true` nhưng `license = NULL` | ❌ Ràng buộc `chk_reading_published_license` từ chối lưu bài | [ ] |
| **RLS-21** | Idempotent XP | User B gọi `award_xp('typing_attempt', 'en-life-shopping')` 2 lần trong ngày | ✅ Lần 1: Nhận +30 XP. Lần 2: Báo `'Hoạt động này đã được cộng XP trước đó'`, 0 XP | [ ] |
| **RLS-22** | Trần XP hàng ngày | User B hoàn thành liên tục các bài tập nhằm vượt quá 500 XP trong 1 ngày | ❌ Server tự động cắt bớt và chặn ở mức tối đa 500 XP/ngày | [ ] |

---

## 3. Câu Lệnh SQL Mô Phỏng Kiểm Thử Nhanh (SQL Test Runner Snippets)

Thực thi trong SQL Editor của Supabase Studio hoặc psql để giả lập các phiên làm việc:

```sql
-- Giả lập phiên làm việc của User B (User thường)
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "00000000-0000-0000-0000-000000000002", "role": "authenticated"}';

-- Thử 1: Đọc trộm video của User A -> Phải ra 0 dòng
SELECT * FROM public.user_videos WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Thử 2: Tự chèn XP vào xp_events -> Phải báo lỗi vi phạm RLS
INSERT INTO public.xp_events (user_id, xp_amount, source) 
VALUES ('00000000-0000-0000-0000-000000000002', 500, 'cheat');

-- Thử 3: Gọi RPC hợp lệ -> Phải thành công
SELECT public.submit_typing_attempt('en-life-shopping', 65.5, 96.0, 45);

-- Khôi phục phiên làm việc mặc định
RESET ROLE;
```
