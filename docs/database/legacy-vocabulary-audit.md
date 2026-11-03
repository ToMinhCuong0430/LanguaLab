# Báo Cáo Kiểm Toán Toàn Diện Hệ Thống Từ Vựng Di Sản (Legacy Vocabulary Audit)

> **Tài liệu kiểm toán mã nguồn & truy vấn cơ sở dữ liệu**  
> **Dự án:** LanguaLab  
> **Thời điểm lập:** Tháng 11/2026  
> **Đối tượng rà soát:** 5 bảng di sản (`vocab_levels`, `vocab_sets`, `vocab_words`, `user_word_progress`, `dictionary_entries`) và các thực thể liên đới (`user_saved_words`, `words_due_today`, `user_vocab_levels_summary`).

---

## 1. Bối cảnh & Ma trận Tổng quan

Hệ thống LanguaLab đang tồn tại 2 kiến trúc lưu trữ dữ liệu từ vựng:
1. **Kiến trúc Di sản (Legacy Vocabulary Stack - Migration 000004 & 000008):**
   - Lưu trữ theo mô hình tập từ vựng đóng (`vocab_sets` -> `vocab_words`), phẳng, không phân loại đa nghĩa.
   - Quản lý học tập lặp lại ngắt quãng SM-2 qua `user_word_progress`.
   - Lưu mục từ điển thử nghiệm thô dạng JSONB qua `dictionary_entries`.
2. **Kiến trúc Kho từ vựng Chuẩn hóa (Canonical Lexicon Core - Migration 000018 -> 000021):**
   - Lưu trữ theo chuẩn ngôn ngữ học quốc tế: Mục từ (`lex_entries`) 1-n Nghĩa (`lex_senses`) 1-n Bản dịch (`lex_translations`) / Ví dụ (`lex_examples`) / Cấp độ theo nguồn (`lex_sense_levels`).
   - Có sẵn 8.554 mục từ và 31.948 nghĩa phân loại CEFR A1-C2 từ CEFR-J và Octanove.
   - Đã có cầu nối dự phòng: `vocab_words.lex_sense_id UUID REFERENCES public.lex_senses(id)`.

---

## 2. Rà soát chi tiết từng Bảng Di sản trong Mã nguồn (Codebase Reference Trace)

### 2.1 Bảng `vocab_levels` (7 Cấp độ khó từ vựng)

- **Mục đích DB:** Lưu trữ định nghĩa 7 mức độ khó từ vựng (Level 1: A1 đến Level 7: C2+ Chuyên sâu & Hiếm gặp).
- **Trạng thái dữ liệu:** 7 dòng cố định.
- **Quan hệ khóa ngoại:**
  - `lex_level_map.vocab_level_number` tham chiếu `vocab_levels.level_number`.
  - `vocab_sets.level_id` tham chiếu `vocab_levels.id`.

#### Danh sách vị trí tham chiếu trong Codebase:

| Đường dẫn file | Dòng mã | Nội dung & Mục đích | Đánh giá & Khả năng di chuyển |
|---|---|---|---|
| `frontend/app/composables/useHomeData.ts` | 226 | `client.from('vocab_levels').select('*').order('level_number')` | **Đang dùng (Active):** Hiển thị 7 thẻ cấp độ độ khó trên Trang chủ. |
| `frontend/app/composables/useVocab.ts` | 571 | `client.from('vocab_levels').select('*')` | **Đang dùng (Active):** Danh sách tab 7 cấp độ tại `/tu-vung`. |
| `frontend/app/composables/useVocabLevels.ts` | 33 | `client.from('vocab_levels').select('*')` | **Đang dùng (Active):** Cache hiển thị tên cấp độ (`getLevelTitle()`) cạnh phiên âm IPA trên trang từ điển `/tu-dien/[tu]`. |
| `frontend/app/pages/tu-dien/[tu].vue` | 29 | `useVocabLevels()` | **Đang dùng (Active):** Hiển thị `Cấp {vocabLevel} · {tên cấp}`. |
| `frontend/app/pages/tu-vung/index.vue` | 499 | `v-for="lvl in vocabLevels"` | **Đang dùng (Active):** Render thanh chọn 7 cấp độ học từ. |
| `backend/supabase/migrations/20261031000019_vocab_level_difficulty_scale.sql` | 11, 23 | Chuẩn hóa Cấp 7 thành 'Chuyên sâu & Hiếm gặp' và tạo FK từ `lex_level_map`. | **Cốt lõi:** Bảng ánh xạ kho Lexicon phụ thuộc vào bảng này. |

> **Kết luận:** **GIỮ LẠI (KEEP)**. Bảng này không chỉ là di sản mà đóng vai trò là bảng danh mục chuẩn hóa (Standard Difficulty Dimension) của toàn bộ nền tảng, được nối trực tiếp với `lex_level_map`.

---

### 2.2 Bảng `vocab_sets` (Bộ từ vựng)

- **Mục đích DB:** Lưu trữ các bộ từ vựng tuyển chọn (Bộ hệ thống `is_system = true`, ví dụ: Oxford 3000, IELTS 7.5+) hoặc bộ từ cá nhân do học viên tự tạo (`user_id = auth.uid()`).
- **Quan hệ khóa ngoại:** `vocab_words.set_id` tham chiếu `vocab_sets.id`.

#### Danh sách vị trí tham chiếu trong Codebase:

| Đường dẫn file | Dòng mã | Nội dung & Mục đích | Đánh giá & Khả năng di chuyển |
|---|---|---|---|
| `frontend/app/composables/useVocab.ts` | 593 | `client.from('vocab_sets').select('*, vocab_levels(*), vocab_words(*)')` | **Đang dùng (Active):** Tải các bộ đề xuất hệ thống. |
| `frontend/app/composables/useVocab.ts` | 625, 711, 769, 794 | CRUD bộ từ cá nhân (`select`, `insert`, `update`, `delete`) | **Đang dùng (Active):** Tính năng "Bộ từ của tôi", tạo danh sách học tập cá nhân. |
| `frontend/app/pages/admin/[loai].vue` | 46 | `tableName: 'vocab_sets', title: 'Bộ từ vựng (Vocab Sets)'` | **Đang dùng (Active):** Quản trị danh sách bộ từ hệ thống tại `/admin/vocab`. |
| `frontend/app/pages/admin/nhat-ky.vue` | 134 | Xem nhật ký thay đổi bộ từ vựng. | **Đang dùng (Active):** Quản trị kiểm toán. |
| `backend/supabase/migrations/20261030000017_admin_audit_bans_reviews.sql` | 259 | Hàm `set_review_status` kiểm tra `vocab_sets.is_system`. | **Đang dùng (Active):** Quy trình kiểm duyệt nội dung. |

> **Kết luận:** **GIỮ LẠI VÀ CHUYỂN ĐỔI (KEEP & ADAPT)**. `vocab_sets` đóng vai trò là "Playlist / Folder" nhóm các từ vựng cho học viên hoặc giáo viên. Cần giữ nguyên cấu trúc bộ từ nhưng chuyển đổi các từ bên trong trỏ tới `lex_senses`.

---

### 2.3 Bảng `vocab_words` (Từ vựng trong bộ)

- **Mục đích DB:** Lưu từng từ cụ thể trong bộ từ. Cấu trúc lưu dạng chuỗi phẳng (`word`, `phonetic`, `meaning_vi`, `example_sentence`).
- **Quan hệ khóa ngoại:**
  - `set_id` tham chiếu `vocab_sets(id)`.
  - `lex_sense_id` (UUID, thêm từ Migration 18) tham chiếu `lex_senses(id)`.
  - Bị `user_word_progress.word_id` tham chiếu.

#### Danh sách vị trí tham chiếu trong Codebase:

| Đường dẫn file | Dòng mã | Nội dung & Mục đích | Đánh giá & Khả năng di chuyển |
|---|---|---|---|
| `frontend/app/composables/useVocab.ts` | 609, 642 | `(s.vocab_words || []).map(...)` | **Đang dùng (Active):** Đọc danh sách từ khi mở bộ từ Flashcard. |
| `frontend/app/composables/useVocab.ts` | 820 | `client.from('vocab_words').insert({ set_id, word, ... })` | **Đang dùng (Active):** Thêm từ mới vào bộ từ của học viên. |
| `frontend/app/composables/useVocab.ts` | 872 | `client.from('vocab_words').delete().eq('id', wordId)` | **Đang dùng (Active):** Xóa từ khỏi bộ từ của học viên. |
| `frontend/app/composables/useGlobalSearch.ts` | 62 | `client.from('vocab_words').select(...).ilike('word', ...)` | **Cần thay thế:** Tìm kiếm toàn cục vẫn quét `vocab_words` thay vì quét `lex_entries`. |
| `backend/supabase/migrations/20261031000018_create_lexicon_core.sql` | 326 | `ALTER TABLE vocab_words ADD COLUMN lex_sense_id UUID REFERENCES lex_senses(id)` | **Cầu nối chuẩn bị sẵn:** Đã có cột khóa ngoại sang kho Lexicon mới. |

> **Kết luận:** **CẦN DI CHUYỂN DỮ LIỆU (MIGRATE)**. Không được xóa ngay vì toàn bộ tiến trình học tập SM-2 (`user_word_progress`) đang liên kết với `vocab_words.id`. Giải pháp là backfill cột `vocab_words.lex_sense_id` từ `lex_senses`.

---

### 2.4 Bảng `user_word_progress` (Tiến trình học lặp lại ngắt quãng SRS)

- **Mục đích DB:** Quản lý thuật toán SuperMemo SM-2 cho từng học viên (`easiness_factor`, `interval_days`, `repetition_count`, `next_review_at`).
- **Quan hệ khóa ngoại:**
  - `user_id` tham chiếu `profiles(id)`.
  - `word_id` tham chiếu `vocab_words(id)`.
  - Ràng buộc duy nhất: `uq_user_word (user_id, word_id)`.

#### Danh sách vị trí tham chiếu trong Codebase:

| Đường dẫn file | Dòng mã | Nội dung & Mục đích | Đánh giá & Khả năng di chuyển |
|---|---|---|---|
| `backend/supabase/migrations/20261023000008_extend_schema_for_features.sql` | 1039 | RPC `review_word(p_word_id UUID, p_rating INTEGER)`: Thực hiện tính toán SM-2 và ghi nhận XP | **Cốt lõi:** Logic học tập Flashcard của toàn bộ ứng dụng chạy qua RPC này. |
| `frontend/app/composables/useVocab.ts` | 985 | Gọi `client.rpc('review_word', { p_word_id, p_rating })` khi học viên lật thẻ Flashcard (Again, Hard, Good, Easy). | **Đang dùng (Active):** Lưu kết quả đánh giá thẻ từ. |
| `backend/supabase/migrations/20261022000004_create_vocabulary.sql` | 79 | View `words_due_today` truy vấn các từ đến hạn ôn (`next_review_at <= NOW()`). | **Đang dùng (Active):** Báo số từ cần ôn trên Dashboard. |
| `backend/supabase/migrations/20261022000004_create_vocabulary.sql` | 104 | View `user_vocab_levels_summary` tính tổng số từ đã học theo từng cấp độ. | **Đang dùng (Active):** Hiển thị số lượng từ đã ghi nhớ trên thanh tiến độ. |

> **Kết luận:** **BẢO TỒN TUYỆT ĐỐI (CRITICAL KEEP)**. Bảng này nắm giữ toàn bộ dữ liệu lịch sử và trí nhớ học tập của người dùng. Không được phép xóa hoặc làm đứt gãy quan hệ dữ liệu.

---

### 2.5 Bảng `dictionary_entries` (Từ điển cũ lưu dạng JSONB)

- **Mục đích DB:** Bảng từ điển đơn giản ban đầu, lưu toàn bộ cấu trúc định nghĩa trong cột `data JSONB`.
- **Trạng thái thực tế:** **Chỉ có đúng 2 dòng seed** (`pragmatic` và `ubiquitous`), không hề có quan hệ khóa ngoại từ bảng nào trỏ đến nó.

#### Danh sách vị trí tham chiếu trong Codebase:

| Đường dẫn file | Dòng mã | Nội dung & Mục đích | Đánh giá & Khả năng di chuyển |
|---|---|---|---|
| `frontend/app/composables/dictionary/provider.ts` | 542, 586, 654 | Fallback nhánh `// 2. Dự phòng: Nếu chưa có trong kho lex_*, tìm trong bảng legacy dictionary_entries` | **Dư thừa (Redundant):** Kho `lex_entries` đã có 8.554 từ (bao gồm cả `pragmatic` và `ubiquitous`). Fallback này gần như không bao giờ được kích hoạt. |
| `frontend/app/composables/useGlobalSearch.ts` | 90 | Truy vấn tìm kiếm từ điển từ `dictionary_entries`. | **Lỗi thời (Obsolete):** Cần chuyển sang gọi hàm `search_lex_entries` để tìm kiếm trên 8.554 từ thay vì 2 từ cũ. |
| `frontend/app/pages/admin/[loai].vue` | 96 | Cấu hình `dictionary: { tableName: 'dictionary_entries' }`. | **Đã có giải pháp thay thế:** Đã có trang quản trị chuyên biệt `/admin/lexicon` với đầy đủ tính năng duyệt. |
| `frontend/app/pages/admin/index.vue` | 50 | Đếm số lượng bản ghi `dictionary_entries` (trả về 2). | **Đã bổ sung:** Đã tích hợp thẻ thống kê Lexicon hiển thị 8.554 mục từ. |

> **Kết luận:** **ỨNG VIÊN XÓA AN TOÀN (CANDIDATE FOR DEPRECATION & SAFE REMOVAL)**. Sau khi chuyển đổi `useGlobalSearch.ts` và loại bỏ fallback trong `provider.ts`, bảng này hoàn toàn vô dụng và có thể xóa an toàn.

---

## 3. Trả lời chi tiết 3 Câu hỏi Kiến trúc Trọng yếu

### Câu hỏi 1: Tiến trình học tập của người dùng và thuật toán SRS có phụ thuộc vào `vocab_words` không?

**CÂU TRẢ LỜI: CÓ, PHỤ THUỘC CHẶT CHẼ 100%.**

#### Chứng minh luồng dữ liệu (Code & Schema Trace):
1. **Ràng buộc lược đồ:**  
   Bảng `user_word_progress` có định nghĩa:
   ```sql
   word_id UUID NOT NULL REFERENCES public.vocab_words(id) ON DELETE CASCADE
   ```
   Nếu xóa `vocab_words`, toàn bộ tiến trình học tập của người dùng trong `user_word_progress` sẽ bị xóa sạch theo cơ chế `CASCADE`.
2. **Hàm RPC `review_word`:**
   ```sql
   CREATE OR REPLACE FUNCTION public.review_word(p_word_id UUID, p_rating INTEGER) ...
   SELECT * INTO v_curr FROM public.user_word_progress WHERE user_id = v_user_id AND word_id = p_word_id;
   ```
   Hàm nhận trực tiếp `p_word_id`. Khi học Flashcard tại `/tu-vung`, mỗi thẻ từ được gán `w.id` chính là `vocab_words.id`.
3. **Cơ chế lưu từ từ kho Lexicon vào bộ từ học:**  
   Khi người học duyệt kho Lexicon (`LexSenseItem`) trên `/tu-vung` và nhấn nút "Lưu bộ từ", hàm `saveLexWordToMySet` gọi:
   ```typescript
   addWordToMySet(setId, { term: item.term, meaning: item.viMeaning || item.definition, ... })
   ```
   Hàm này chèn một bản ghi mới vào `vocab_words`, sinh ra một `vocab_words.id` mới, sau đó học viên mới có thể ôn tập từ đó theo thuật toán SM-2.
4. **Cột cầu nối chưa được tận dụng triệt để:**  
   Migration 18 đã bổ sung cột `vocab_words.lex_sense_id REFERENCES lex_senses(id)`. Tuy nhiên, code hiện tại ở `addWordToMySet` mới chỉ insert text thuần mà **chưa truyền `lex_sense_id`** vào bản ghi `vocab_words`.
   
**Hành động kiến trúc bắt buộc:** Không được xóa `vocab_words`. Cần nâng cấp `addWordToMySet` để lưu kèm `lex_sense_id`, đồng thời chạy script liên kết tự động (backfill) các từ hiện có sang `lex_senses.id`.

---

### Câu hỏi 2: Bảng `dictionary_entries` có còn cần thiết làm phương án dự phòng (fallback) không?

**CÂU TRẢ LỜI: KHÔNG CÒN CẦN THIẾT. HOÀN TOÀN CÓ THỂ DEPRECATE VÀ LOẠI BỎ.**

#### Chứng minh:
1. **Dữ liệu thực tế:**  
   Bảng `dictionary_entries` chỉ chứa **duy nhất 2 bản ghi** được chèn từ seed mẫu (`pragmatic` và `ubiquitous`).
2. **Đối chiếu với kho Lexicon:**  
   - Từ `pragmatic` đã có trong `lex_entries` (ID: mục từ tính từ C1).
   - Từ `ubiquitous` đã có trong `lex_entries` (ID: mục từ tính từ C1).
   - Kho `lex_entries` hiện sở hữu **8.554 mục từ**, bao phủ 100% toàn bộ từ vựng cốt lõi A1 đến C2 và mở rộng.
3. **Hiệu năng & Rủi ro khi giữ fallback:**  
   Trong `SupabaseDictionaryProvider`:
   - Khi người dùng gõ tìm kiếm một từ không có trong từ điển (ví dụ gõ sai chính tả `pragmattic`), code sẽ thực hiện truy vấn `lex_entries`, không tìm thấy, sau đó **bắt buộc chạy thêm một truy vấn thứ hai** tới `dictionary_entries` vô ích trước khi trả về `null`.
   - Điều này gây lãng phí kết nối mạng và độ trễ truy vấn (I/O latency) cho người dùng cuối.
4. **Vị trí duy nhất cần dọn dẹp trước khi xóa:**  
   Chỉ cần cập nhật `frontend/app/composables/useGlobalSearch.ts` chuyển truy vấn từ `dictionary_entries` sang `lex_entries` (qua RPC `search_lex_entries`).

---

### Câu hỏi 3: Dữ liệu CEFR trong `lex_senses` có nhất quán không, và tại sao một mục từ có thể có nhiều cấp độ CEFR khác nhau ở các nghĩa khác nhau?

**CÂU TRẢ LỜI: DỮ LIỆU HOÀN TOÀN NHẤT QUÁN VÀ ĐÚNG CHUẨN KHOA HỌC NGÔN NGỮ (LEXICOGRAPHY).**

#### Giải thích nguyên lý bản chất ngôn ngữ:
Trong ngôn ngữ tự nhiên, **một từ không sở hữu một cấp độ duy nhất, mà cấp độ phụ thuộc vào từng ngữ nghĩa và từ loại cụ thể của nó:**

1. **Ví dụ điển hình từ thực tế từ điển:**
   - Từ **"run"**:
     - Nghĩa 1 (Động từ): *"Di chuyển nhanh bằng hai chân"* -> Cấp độ **A1** (Sơ cấp).
     - Nghĩa 2 (Động từ): *"Quản lý, điều hành một doanh nghiệp"* -> Cấp độ **B2** (Trung cao cấp).
     - Nghĩa 3 (Danh từ): *"Một chuyến đi ngắn / đợt vận hành"* -> Cấp độ **B1**.
   - Từ **"book"**:
     - Nghĩa 1 (Danh từ): *"Cuốn sách để đọc"* -> Cấp độ **A1**.
     - Nghĩa 2 (Động từ): *"Đặt chỗ trước (vé máy bay, khách sạn)"* -> Cấp độ **A2 / B1**.
   - Từ **"interest"**:
     - Nghĩa 1 (Danh từ): *"Sự quan tâm, hứng thú"* -> Cấp độ **A2**.
     - Nghĩa 2 (Danh từ): *"Lãi suất ngân hàng / lợi ích tài chính"* -> Cấp độ **B2**.

2. **Cách tổ chức dữ liệu chuẩn hóa của LanguaLab:**
   - Bảng `lex_entries` đóng vai trò là mục từ gốc (`lemma`), không chứa cột `level`.
   - Cột `level` nằm ở bảng con `lex_senses`. Mỗi nghĩa (`sense`) có một `level` riêng biệt.
   - Nguồn gốc xếp cấp độ được lưu độc lập tại `lex_sense_levels` (CEFR-J cho A1-B2 và Octanove cho C1-C2).
   - **Quy tắc gán cấp độ đã chốt (Phase 3):**
     - Cấp độ CEFR chỉ được gán cho **nghĩa phổ biến nhất (nghĩa đầu tiên) của từng loại từ**.
     - Các nghĩa hiếm gặp phía sau để `level = NULL` (không tự suy đoán).
     - Trên trang từ điển `pages/tu-dien/[tu].vue`, huy hiệu cấp độ cạnh từ gốc hiển thị **cấp độ thấp nhất (dễ nhất)** để người học biết từ này bắt đầu xuất hiện ở trình độ nào, đồng thời trong từng nghĩa bên dưới vẫn hiển thị chính xác badge cấp độ riêng của nghĩa đó.

> **Kết luận:** Mô hình 1 mục từ có nhiều cấp độ CEFR trên các nghĩa khác nhau là **tính năng ưu việt cốt lõi của LanguaLab**, vượt trội hoàn toàn so với mô hình từ vựng phẳng cũ của `vocab_words`.
