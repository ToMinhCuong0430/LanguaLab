# LanguaLab – Báo Cáo Thẩm Định & Kiểm Thử Di Chuyển (Migration Validation)

## 1. Mục Đích & Phạm Vi
Báo cáo thẩm định tính an toàn, tính lũy thừa (Idempotency), khả năng tương thích ngược và tính toàn vẹn dữ liệu cho migration `20261102000022_consolidate_lexicon_learning.sql` và `20261102000023_semantic_vocab_linkage.sql` cùng các sửa đổi mã nguồn tương ứng.

---

## 2. Kiểm Tra Tính Lũy Thừa (Idempotency Verification)

Tất cả các câu lệnh DDL và DML trong Migration 22 và Migration 23 đều được thiết kế để chạy lặp lại nhiều lần mà không gây lỗi hoặc làm biến dạng dữ liệu:

| Đối Tượng | Cơ Chế Đảm Bảo Tính Lũy Thừa | Kết Quả Thẩm Định |
| :--- | :--- | :--- |
| `user_sense_progress` | `CREATE TABLE IF NOT EXISTS` | Đạt |
| Các chỉ mục `idx_vocab_words_*`, `idx_user_sense_*` | `CREATE INDEX IF NOT EXISTS` | Đạt |
| Ràng buộc toàn vẹn `chk_vocab_words_lex_integrity` | `DROP CONSTRAINT IF EXISTS` + `ADD CONSTRAINT` | Đạt |
| Cột mở rộng `lex_entry_id`, `lex_sense_id` | `ADD COLUMN IF NOT EXISTS` trên `vocab_words`, `user_saved_words`, `pronunciation_recordings` | Đạt |
| Backfill ngữ nghĩa (Semantic Backfill) | Điều kiện lọc chỉ định theo `set_id` tiếng Anh (`language = 'en'`) và bảo vệ tiếng Trung/Nhật | Đạt |
| Hàm RPC `review_lex_sense`, `review_word` | `CREATE OR REPLACE FUNCTION` | Đạt |
| Chính sách RLS | `DROP POLICY IF EXISTS` trước khi `CREATE POLICY` | Đạt |
| Các Views `words_due_today`, v.v. | `CREATE OR REPLACE VIEW` | Đạt |

---

## 3. Kiểm Thử Khả Năng An Toàn Đa Nghĩa & Bảo Vệ Đa Ngôn Ngữ

### 3.1. Các Kịch Bản Thử Nghiệm

#### Kịch Bản A: Từ đơn nghĩa (Single Sense)
- **Ví dụ**: *Comprehensive*, *Detrimental*, *Superfluous* chỉ có đúng 1 nghĩa trong `lex_senses`.
- **Kết quả mong đợi**: `lex_entry_id` và `lex_sense_id` được gán chính xác vào bản ghi `vocab_words` tương ứng.
- **Thực tế**: Khớp quy tắc Single-Sense Matching, liên kết 1:1 thành công.

#### Kịch Bản B: Từ đa nghĩa được khử mơ hồ có kiểm soát (Verified Polysemy)
- **Ví dụ**: *Resilient*, *Diminish*, *Facilitate*, *Legitimate*, *Perspective*, *Plausible*, *Consensus*, *Accountability*, *Incentive*.
- **Kết quả mong đợi**: Hệ thống gán chính xác `sense_order = 1` mang định nghĩa gốc và cấp độ CEFR chuẩn, không gán bừa nghĩa phụ.
- **Thực tế**: Khớp quy tắc Semantic-Verified Matching, liên kết chuẩn xác.

#### Kịch Bản C: Từ chưa có trong Lexicon đợt 1 (Unmatched English Words)
- **Ví dụ**: 18 từ tiếng Anh còn lại chưa có trong đợt nạp CEFR hiện tại.
- **Kết quả mong đợi**: Cột `lex_sense_id` giữ nguyên giá trị `NULL`. Dữ liệu nội tại (`phonetic`, `meaning_vi`, `example_sentence`) hiển thị bình thường.
- **Thực tế**: Đạt 100%.

#### Kịch Bản D: Bảo vệ ngôn ngữ Tiếng Trung (`zh`) và Tiếng Nhật (`ja`)
- **Ví dụ**: 10 từ tiếng Trung trong Bộ 4 (HSK 3-4) và 10 từ tiếng Nhật trong Bộ 5 (JLPT N3-N2).
- **Kết quả mong đợi**: Tuyệt đối không gán `lex_sense_id` (luôn giữ `NULL`), bảo tồn trọn vẹn `reading` (Pinyin, Furigana), nghĩa tiếng Việt và câu ví dụ.
- **Thực tế**: Đạt 100%. Cả 20 từ hoạt động hoàn hảo trên giao diện Flashcard và Quiz.

---

## 4. Kiểm Thử Toàn Vẹn Tiến Trình Người Dùng (Zero Data Loss Validation)

### 4.1. Lịch sử học tập cũ
- Bảng `user_word_progress` được giữ nguyên vẹn 100%. Không có bất kỳ dòng nào bị DELETE hoặc UPDATE sai lệch.
- View `words_due_today` sử dụng `UNION ALL` kết hợp:
  - Tất cả các từ đến hạn từ `user_word_progress`.
  - Tất cả các nghĩa đến hạn từ `user_sense_progress`.
  - Mệnh đề `NOT EXISTS` đảm bảo nếu một từ vựng đã được học qua `vocab_words` thì không bị hiển thị lặp hai lần trong hàng đợi ôn tập.

### 4.2. Thống kê cấp độ (User Vocab Levels Summary)
- Bảng ánh xạ `lex_level_map` liên kết hệ CEFR (A1..C2) về 6 cấp độ đầu của thang đo độ khó 7 nấc.
- Khung nhìn `user_vocab_levels_summary` tính tổng gộp `legacy_learned + sense_learned`, đảm bảo số từ đã học của học viên trên Dashboard trang chủ (`useHomeData.ts`) luôn tăng trưởng liên tục mà không bị sụt giảm về 0.

### 4.3. Thống kê Ngày và Tuần (`daily_user_stats`, `weekly_user_summary`)
- Chỉ số `new_words_learned` hôm nay và trong tuần tính tổng số bản ghi tạo mới ở cả 2 bảng `user_word_progress` và `user_sense_progress`.

---

## 5. Thẩm Định Bảo Mật RLS & Quyền Thực Thi (Security Audit)

1. **Bảng `user_sense_progress`**:
   - `ROW LEVEL SECURITY` đã được kích hoạt (`ENABLE ROW LEVEL SECURITY`).
   - Học viên thông thường chỉ có quyền `SELECT`, `INSERT`, `UPDATE`, `DELETE` trên các hàng có `auth.uid() = user_id`.
   - Quản trị viên (`public.is_admin()`) có toàn quyền kiểm tra và hỗ trợ học viên.

2. **Hàm RPC `review_lex_sense`**:
   - Khai báo với `SECURITY DEFINER SET search_path = public` ngăn chặn triệt để tấn công search_path injection.
   - Kiểm tra `v_user_id := auth.uid()`, từ chối người dùng chưa đăng nhập.
   - Giới hạn `p_rating` nghiêm ngặt trong khoảng từ 1 đến 4.
   - Thưởng điểm XP được thực hiện thông qua hàm chuẩn `award_xp`, áp dụng cơ chế idempotent và trần XP hàng ngày (500 XP/ngày).

---

## 6. Kiểm Thử Biên Dịch Ứng Dụng (Build Verification)

- **Lệnh thực thi**: `npm --prefix frontend run build`
- **Môi trường**: Nuxt 4.6.2 · Nitro 2.13.5 · Vite 8.3.5 · Vue 3.5.44
- **Kết quả**:
  - `Total modules transformed: 2431`
  - `Server built in: 4.4s`
  - `Nitro bundle completed: 16.2s`
  - **Mã thoát (Exit Code)**: `0` (Thành công hoàn toàn, không có lỗi TypeScript hoặc Bundler)
  - **Dung lượng build**: 6.35 MB (1.42 MB gzip)
