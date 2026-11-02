# LanguaLab – Ma Trận Phụ Thuộc Bảng Từ Vựng Legacy (Legacy Dependency Matrix)

## 1. Bảng Tổng Quan Trạng Thái Khấu Hao (Deprecation Status Matrix)

| Tên Bảng Legacy | Trạng Thái Sau Migration 22 | Phụ Thuộc FK CSDL Còn Lại | Phụ Thuộc Frontend Còn Lại | Có Thể Khấu Hao (Deprecate)? | Điều Kiện & Ghi Chú |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`dictionary_entries`** | **SẴN SÀNG KHẤU HAO (Deprecate Ready)** | 0 FK ngoại | **0 (Đã ngắt hoàn toàn)** | **CÓ (An toàn 100%)** | Toàn bộ tìm kiếm & từ điển đã chuyển sang `lex_entries`. Dữ liệu 2 bản ghi cũ (`pragmatic`, `ubiquitous`) đã có trong Lexicon. |
| **`vocab_levels`** | **ĐANG SỬ DỤNG (Active Reference)** | `lex_level_map.vocab_level_number`, `vocab_sets.level_id` | `useVocabLevels.ts`, `useVocab.ts` | **KHÔNG** | Là bảng danh mục 7 bậc độ khó (Difficulty Scale 1-7). Giữ nguyên vĩnh viễn hoặc chuyển thành enum/bảng tham chiếu chuẩn. |
| **`vocab_sets`** | **ĐANG SỬ DỤNG (User Collections)** | `vocab_words.set_id`, `user_saved_words.target_set_id` | `useVocab.ts` (My Sets, Flashcard sets) | **KHÔNG** | Là bảng bộ sưu tập cá nhân (User Folders / Flashcard Sets) do người dùng tự tạo. Không thuộc từ điển. |
| **`vocab_words`** | **BẮC CẦU (Bridged with Lexicon)** | `user_word_progress.word_id`, `pronunciation_recordings.word_id` | `useVocab.ts` (render danh sách từ trong My Sets) | **TỪNG BƯỚC (Giai đoạn 3)** | Đã mở rộng thêm `lex_entry_id` và `lex_sense_id`. Lưu các thẻ từ trong bộ sưu tập cá nhân của người học. |
| **`user_word_progress`** | **TƯƠNG THÍCH NGƯỢC (Dual Sync SRS)** | FK tới `vocab_words(id)` | Đồng bộ tự động qua RPC `review_word()` | **TỪNG BƯỚC (Giai đoạn 3)** | Đã chuyển giao vai trò chính cho `user_sense_progress`. Giữ lại để đảm bảo người dùng cũ không mất số lượt review. |
| **`user_saved_words`** | **ĐÃ MỞ RỘNG (Enhanced with Lexicon)** | `target_set_id` -> `vocab_sets(id)` | `useVocab.ts` (`saveWordToDatabase`) | **KHÔNG (Active Feature)** | Tính năng "Sổ tay lưu từ" từ Video, Bài đọc. Đã thêm `lex_entry_id`, `lex_sense_id`. |
| **`pronunciation_recordings`** | **ĐÃ MỞ RỘNG (Enhanced with Lexicon)** | `word_id` -> `vocab_words(id)` | `useVocab.ts` (`uploadPronunciation`) | **KHÔNG (Active Feature)** | Tính năng ghi âm phát âm học viên. Đã thêm `lex_entry_id`, `lex_sense_id`. |

---

## 2. Chi Tiết Từng Bảng & Bằng Chứng Triệt Tiêu Phụ Thuộc (Zero Dependency Proof)

### 2.1. `dictionary_entries` (Triệt tiêu 100% phụ thuộc)
- **Hiện trạng trước**: 
  - `frontend/app/composables/dictionary/provider.ts`: 3 block truy vấn fallback (`lookup`, `suggest`, `suggestWithLevel`).
  - `frontend/app/composables/useGlobalSearch.ts`: Truy vấn tìm kiếm mục từ điển nhóm 5.
- **Sau Migration 22 & Code Refactoring**:
  - `frontend/app/composables/useGlobalSearch.ts`: Đã chuyển 100% sang `lex_entries` (lọc `status = 'published'`).
  - `frontend/app/composables/dictionary/provider.ts`: Đã loại bỏ toàn bộ 3 block fallback legacy. `SupabaseDictionaryProvider` chỉ đọc từ `lex_entries`, `lex_senses`, `lex_translations`, `lex_examples`, `lex_pronunciations`, và RPC `search_lex_entries`.
  - Không có bất kỳ Foreign Key nào trong PostgreSQL trỏ đến `dictionary_entries`.
  - **Kết luận**: Bảng `dictionary_entries` có thể đánh dấu `DEPRECATED` ngay lập tức và đưa vào danh sách xóa an toàn ở Phase 4 sau khi hoàn tất backup.

---

### 2.2. `vocab_levels` (Danh mục thang đo độ khó)
- **Mối quan hệ CSDL**:
  - `lex_level_map (vocab_level_number)` tham chiếu `vocab_levels (level_number)` với `ON DELETE RESTRICT`.
  - `vocab_sets (level_id)` tham chiếu `vocab_levels (id)` với `ON DELETE SET NULL`.
- **Frontend**:
  - `useVocabLevels.ts` và `useHomeData.ts` đọc danh sách cấp bậc để hiển thị tiến độ 7 nấc học tập.
- **Kết luận**: Giữ nguyên làm bảng phân loại độ khó chuẩn toàn hệ thống (Scale 1-7: A1, A2, B1, B2, C1, C2, C2+).

---

### 2.3. `vocab_sets` & `vocab_words` (Bộ sưu tập học tập cá nhân)
- **Bản chất**: Không phải từ điển tĩnh, mà là **danh mục bộ thẻ từ của người học** (User-Created Flashcard Decks).
- **Cải tiến Migration 22**:
  - Cột `lex_entry_id` và `lex_sense_id` được bổ sung vào `vocab_words`.
  - Khi người dùng lưu một từ từ từ điển vào bộ từ cá nhân (`saveLexWordToMySet`), thẻ từ được liên kết trực tiếp với mục từ và nghĩa trong Lexicon.
  - Phép backfill an toàn đa nghĩa (Polysemy-Safe) đã gán `lex_entry_id` cho các từ khớp `lower(btrim(word))` và gán `lex_sense_id` cho các trường hợp đơn nghĩa hoặc đơn nhất từ loại.

---

### 2.4. `user_word_progress` vs `user_sense_progress` (Chuyển giao SM-2 SRS)
- **Trước**: Tiến trình SRS tính trên `word_id` (`vocab_words`).
- **Sau Migration 22**:
  - Tạo bảng mới `user_sense_progress` với khóa ngoại trỏ trực tiếp đến `lex_senses(id)`.
  - Cung cấp RPC độc lập `review_lex_sense(p_sense_id, p_rating)`.
  - RPC cũ `review_word(p_word_id, p_rating)` được duy trì và tự động cập nhật cả `user_sense_progress` nếu từ có liên kết nghĩa.
  - View `words_due_today` hợp nhất cả 2 bảng bằng `UNION ALL`, tránh đếm trùng thông qua mệnh đề `NOT EXISTS`.

---

## 3. Ma Trận Gọi Frontend (Frontend Callers Matrix)

| Tệp Mã Nguồn | Tác Vụ | Bảng/RPC Truy Vấn | Tình Trạng Sau Migration 22 |
| :--- | :--- | :--- | :--- |
| `useGlobalSearch.ts` | Tìm kiếm thanh điều hướng | `lex_entries` (published) | **Đã hoàn thành chuyển đổi** |
| `provider.ts` | Tra cứu từ điển chi tiết | `lex_entries`, `lex_senses`, `search_lex_entries` | **Đã gỡ bỏ fallback cũ** |
| `useVocab.ts` | Thêm từ vào My Set | `vocab_words` (+ `lex_entry_id`, `lex_sense_id`) | **Đã hỗ trợ Lexicon links** |
| `useVocab.ts` | Lưu từ từ kho trung tâm | `saveLexWordToMySet` | **Ghi trực tiếp senseId & entryId** |
| `useVocab.ts` | Ôn tập SRS từ điển mới | `review_lex_sense` RPC | **Đã bổ sung hàm `rateLexSenseSrs`** |
| `useHomeData.ts` | Đếm từ cần ôn hôm nay | `words_due_today` VIEW | **Hợp nhất tự động 2 nguồn** |
| `useHomeData.ts` | Thống kê từ theo 7 cấp | `user_vocab_levels_summary` VIEW | **Hợp nhất độ khó qua `lex_level_map`** |
| `admin/lexicon.vue` | Quản trị từ điển | `lex_entries`, `lex_senses`, `admin_lex_stats` | **Canonical Lexicon chuẩn** |
