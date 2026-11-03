# LanguaLab Database Cleanup Readiness Checklist & Gating Criteria

> **Tài liệu kiểm soát sẵn sàng dọn dẹp & Tiêu chí nghiệm thu an toàn CSDL**  
> **Dự án:** LanguaLab (Giai đoạn 2: Hợp nhất Cơ sở Dữ liệu & Từ vựng)  
> **Kiến trúc sư:** Senior Supabase / PostgreSQL Database Architect  
> **Nguyên tắc cốt lõi:** Tuyệt đối không xóa bảng khi chưa hoàn thành 100% việc chuyển đổi ở cả Frontend và Backend.

---

## 1. Danh sách phân loại khả năng xóa bảng (Table Deprecation Eligibility List)

### 1.1 Danh mục bảng TUYỆT ĐỐI KHÔNG ĐƯỢC XÓA (MUST NEVER DROP)

| Tên bảng | Lý do kỹ thuật & Ràng buộc phụ thuộc | Hậu quả nghiêm trọng nếu bị xóa |
|---|---|---|
| **`lex_*` (16 bảng)** | Kho từ vựng trung tâm chuẩn hóa của nền tảng LanguaLab. | Mất toàn bộ từ điển, phát âm, ví dụ, nghĩa và tra cứu toàn hệ thống. |
| **`vocab_levels`** | Được `lex_level_map.vocab_level_number` tham chiếu với ràng buộc `ON DELETE RESTRICT`. | Lỗi vi phạm khóa ngoại CSDL, làm sụp đổ toàn bộ logic ánh xạ độ khó CEFR về thang 1-7. |
| **`user_word_progress`** | Nắm giữ toàn bộ dữ liệu trí nhớ học tập lặp lại ngắt quãng SM-2 của học viên. | Xóa sạch lịch sử học tập, mất chuỗi ôn tập và gây phẫn nộ cho người dùng. |
| **`vocab_sets`** | Bảng danh mục chứa các bộ từ vựng cá nhân ("Bộ từ của tôi") và bộ đề xuất. | Học viên mất toàn bộ các danh sách từ đã tự tay tạo và phân loại. |
| **`user_saved_words`** | Chứa danh sách các từ vựng người học lưu nhanh khi xem Video YouTube hoặc Đọc báo. | Mất toàn bộ bookmark ghi nhớ nhanh của người học. |
| **`pronunciation_recordings`** | Lưu trữ lịch sử ghi âm giọng nói của người học và điểm phát âm. | Mất toàn bộ lịch sử luyện nói của học viên. |

---

### 1.2 Bảng CHỈ ĐƯỢC XÓA SAU KHI hoàn thành chuyển đổi toàn diện (CAN ONLY BE REMOVED AFTER COMPLETE MIGRATION)

| Tên bảng | Điều kiện tiên quyết bắt buộc trước khi xóa | Mức độ rủi ro |
|---|---|:---:|
| **`vocab_words`** | **CHỈ ĐƯỢC PHÉP XÓA KHI:**<br>1. Toàn bộ tiến trình trong `user_word_progress` đã được chuyển sang trỏ trực tiếp vào `lex_senses.id` (hoặc bảng trung gian mới `user_set_items`).<br>2. Toàn bộ các bộ từ trong `vocab_sets` đã được chuyển đổi cấu trúc.<br>3. Khóa ngoại `user_word_progress.word_id` đã được gỡ bỏ an toàn mà không kích hoạt `ON DELETE CASCADE`. | **RẤT CAO (EXTREME RISK)** |

> [!WARNING]
> Hiện tại `vocab_words` **CHƯA ĐỦ ĐIỀU KIỆN ĐỂ XÓA**. Bảng này tiếp tục được giữ lại và chuyển sang vai trò "Bảng cầu nối Flashcard", được backfill cột `lex_sense_id`.

---

### 1.3 Bảng ĐỦ ĐIỀU KIỆN để Deprecate & Xóa an toàn sau bước cắt mã (READY FOR IMMEDIATE PHASE 2 CUTOVER & REMOVAL)

| Tên bảng | Hiện trạng dữ liệu | Phụ thuộc khóa ngoại | Điều kiện trước khi thực thi lệnh DROP |
|---|---|:---:|---|
| **`dictionary_entries`** | **Chỉ có đúng 2 dòng** seed (`pragmatic`, `ubiquitous`), cả 2 đều đã có sẵn trong `lex_entries`. | **Không có bất kỳ bảng nào** trỏ khóa ngoại vào bảng này. | 1. Sửa `provider.ts` gỡ bỏ fallback.<br>2. Sửa `useGlobalSearch.ts` chuyển sang gọi RPC `search_lex_entries`.<br>3. Tạo bản backup 2 dòng ra file SQL hoặc CSV. |

---

## 2. Tiêu chí cổng kiểm soát (Gating Criteria Checklist)

Trước khi thực thi bất kỳ migration dọn dẹp nào trên môi trường Staging hoặc Production, bắt buộc phải vượt qua 5 cổng kiểm soát sau:

### Cổng 1: Kiểm toán Mã nguồn (Code Audit Gate)
- [ ] Lệnh tìm kiếm toàn bộ repository không còn bất kỳ tham chiếu nào tới bảng mục tiêu:
  ```bash
  grep -rn "dictionary_entries" frontend/ backend/
  ```
  *(Kết quả mong đợi: 0 kết quả ngoài các file tài liệu audit).*
- [ ] Không còn bất kỳ file Nuxt SFC (`.vue`) hoặc Composable (`.ts`) nào gửi truy vấn `client.from('dictionary_entries')`.

### Cổng 2: Kiểm toán Khóa ngoại CSDL (Foreign Key Gate)
- [ ] Chạy truy vấn kiểm tra không còn bảng nào tham chiếu khóa ngoại:
  ```sql
  SELECT count(*) 
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'dictionary_entries';
  ```
  *(Kết quả bắt buộc: 0).*

### Cổng 3: Kiểm toán View & Trigger CSDL (Views & Triggers Gate)
- [ ] Chạy truy vấn kiểm tra không còn View nào chứa tên bảng mục tiêu trong định nghĩa:
  ```sql
  SELECT count(*) FROM pg_views WHERE schemaname = 'public' AND definition ILIKE '%dictionary_entries%';
  ```
  *(Kết quả bắt buộc: 0).*
- [ ] Không còn hàm thủ tục (RPC) nào gọi tới bảng mục tiêu:
  ```sql
  SELECT count(*) FROM pg_proc WHERE prosrc ILIKE '%dictionary_entries%';
  ```
  *(Kết quả bắt buộc: 0).*

### Cổng 4: Kiểm toán Lưu lượng Truy vấn Thực tế (Telemetry & Traffic Gate)
- [ ] Theo dõi log trên Supabase Dashboard tối thiểu **7 ngày liên tục**:
  - Tần suất truy vấn SELECT/INSERT/UPDATE tới `dictionary_entries` = **0 requests**.

### Cổng 5: Sao lưu An toàn (Disaster Recovery Backup Gate)
- [ ] Đã xuất file sao lưu dữ liệu bảng mục tiêu và lưu trữ tại thư mục an toàn:
  ```sql
  COPY public.dictionary_entries TO '/tmp/backup_dictionary_entries.csv' WITH CSV HEADER;
  ```

---

## 3. Quy trình thực thi Migration dọn dẹp (Execution Runbook)

Khi và chỉ khi cả 5 cổng kiểm soát trên đều đạt trạng thái **PASS**, tiến hành các bước sau trên môi trường Production:

1. **Thông báo bảo trì nội bộ:** Ghi nhận sự kiện vào nhật ký kiểm toán `admin_audit_log`.
2. **Khởi tạo Transaction có kiểm tra an toàn:**
   ```sql
   BEGIN;
   -- Khóa bảng ở chế độ EXCLUSIVE để chặn mọi truy vấn đồng thời
   LOCK TABLE public.dictionary_entries IN ACCESS EXCLUSIVE MODE;

   -- Xóa trigger
   DROP TRIGGER IF EXISTS tr_dictionary_entries_updated_at ON public.dictionary_entries;

   -- Xóa chính sách bảo mật RLS
   DROP POLICY IF EXISTS "Dictionary entries are viewable by everyone" ON public.dictionary_entries;
   DROP POLICY IF EXISTS "Dictionary entries are manageable by admin" ON public.dictionary_entries;

   -- Thực hiện xóa bảng
   DROP TABLE IF EXISTS public.dictionary_entries;

   COMMIT;
   ```
3. **Kiểm tra sức khỏe ứng dụng (Smoke Test):**
   - Truy cập `/tu-dien`, gõ tìm kiếm từ `pragmatic` và `run`.
   - Mở thanh tìm kiếm toàn cục (Ctrl + K), tìm kiếm từ vựng.
   - Truy cập `/admin/lexicon`, kiểm tra thống kê và phân trang.
   - Kiểm tra Console browser và Network tab không phát sinh bất kỳ mã lỗi `404` hay `400` nào từ Supabase PostgREST.

---

## 4. Kế hoạch ứng phó sự cố (Contingency & Rollback Plan)

Nếu có sự cố không lường trước phát sinh ngay sau khi xóa bảng `dictionary_entries`:

```sql
-- KỊCH BẢN PHỤC HỒI KHẨN CẤP (EMERGENCY RESTORE SCRIPT)
BEGIN;

CREATE TABLE IF NOT EXISTS public.dictionary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language learning_language NOT NULL,
  headword TEXT NOT NULL,
  data JSONB NOT NULL,
  source TEXT NOT NULL,
  license TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_dict_lang_headword UNIQUE (language, headword)
);

CREATE INDEX IF NOT EXISTS idx_dict_entries_lang_word ON public.dictionary_entries(language, headword);

CREATE TRIGGER tr_dictionary_entries_updated_at
  BEFORE UPDATE ON public.dictionary_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.dictionary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dictionary entries are viewable by everyone"
  ON public.dictionary_entries FOR SELECT USING (true);
CREATE POLICY "Dictionary entries are manageable by admin"
  ON public.dictionary_entries FOR ALL USING (public.is_admin());

-- Khôi phục 2 bản ghi gốc
INSERT INTO public.dictionary_entries (id, language, headword, source, license, data) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'en', 'pragmatic', 'in_house', 'CC-BY-SA 4.0', '{"word": "pragmatic", "phonetic": "/præɡˈmætɪk/", "frequency": "Academic", "senses": []}'::jsonb),
  ('c0000000-0000-0000-0000-000000000002', 'en', 'ubiquitous', 'in_house', 'CC-BY-SA 4.0', '{"word": "ubiquitous", "phonetic": "/juːˈbɪkwɪtəs/", "frequency": "Academic", "senses": []}'::jsonb)
ON CONFLICT (language, headword) DO NOTHING;

COMMIT;
```
*(Hệ thống sẽ lập tức quay trở lại trạng thái hoạt động bình thường trong vòng dưới 3 giây).*
