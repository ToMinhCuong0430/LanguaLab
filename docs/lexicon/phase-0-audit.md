# Kho từ vựng LanguaLab - Giai đoạn 0: Rà soát và quyết định

Ngày rà soát: 2026-10-31. Phạm vi: `backend/supabase/migrations` (000001 đến 000017), seed, test và phần frontend liên quan từ điển/từ vựng.

Lưu ý: mình chưa chạy được database thật, nên mọi nhận xét dưới đây dựa trên việc đọc file migration, không phải trạng thái thật của project Supabase đang chạy. Hãy đối chiếu bằng `scripts/check_remote_state.sql` nếu cần.

## 1. Hiện trạng

| Thành phần | Có sẵn | Ghi chú |
|---|---|---|
| Cấp độ | `vocab_levels`, 7 cấp | Chủ dự án xác nhận: **7 cấp là thang độ khó từ dễ đến khó**. Seed hiện có L1-L6 = A1-C2 (500/1000/2000/4000/8000/16000 từ) nhưng **L7 đang bị đặt nhầm là `HSK_JLPT`** (nhóm kỳ thi, không phải mức khó). Migration 19 sửa lại. Tổng mục tiêu 34.000 từ |
| Bộ từ | `vocab_sets` | Có `is_system`, `is_public`, `is_published`, `language`, `user_id` (bộ của tôi) |
| Từ | `vocab_words` | **Phẳng**: một dòng = từ + `meaning_vi` + ví dụ + phiên âm, bắt buộc thuộc một bộ (`set_id NOT NULL`) |
| Ôn tập | `user_word_progress` + RPC `review_word` | Đã có SM-2 và XP. Không cần làm lại |
| Từ đã lưu | `user_saved_words` | Lưu từ khi xem video/bài đọc/từ điển |
| Từ điển | `dictionary_entries` | `headword` + cột `data JSONB` (nghĩa, collocation, synonym...), có `source` và `license`. Frontend đọc qua `SupabaseDictionaryProvider` |
| Import | `content_import_logs` + `ImportWizard.vue` | Chỉ ghi nhật ký import, chưa có vùng staging hay lưu dữ liệu gốc |
| Quyền | `user_roles`, hàm `is_admin()` | Mẫu RLS: `is_published = true OR is_admin()` |
| Tìm kiếm | Không có | Chưa bật `pg_trgm` |
| Dữ liệu seed | Rất nhỏ | Khoảng 50 từ trong `vocab_words`, 5 bộ từ, 2 mục từ điển (đếm xấp xỉ) |

Điểm tốt có sẵn: provider từ điển đã ghi rõ **không scrape Oxford/Cambridge**, và đã có cột `license` cho từng mục.

## 2. So với thiết kế trong tài liệu

| Thiết kế tài liệu | Đã có | Quyết định |
|---|---|---|
| `vocabulary` | `dictionary_entries.headword` | Tạo `lex_entries` |
| `definitions` | nằm trong JSONB | Tạo `lex_senses` (cấp độ theo nghĩa) |
| `word_forms` | không | Tạo `lex_forms` |
| `translations` | `vocab_words.meaning_vi` | Tạo `lex_translations` (có cờ AI và trạng thái duyệt) |
| `pronunciations` | `vocab_words.phonetic`, `audio_url` | Tạo `lex_pronunciations` (hỗ trợ IPA, pinyin, kana) |
| `examples` | `example_sentence`, `examples JSONB` | Tạo `lex_examples` |
| `topics` | `typing_topics` (dành cho Gõ câu) | Tạo `lex_topics` (có loại `exam_tag` cho IELTS...) |
| `lexical_relations` | trong JSONB | Tạo `lex_relations` (collocation lưu dạng chữ tự do) |
| `data_sources`, `import_batches`, `raw_records`, `source_attributions` | chỉ `content_import_logs` | Tạo `lex_sources`, `lex_import_batches`, `lex_raw_records`, `lex_attributions` |
| `user_vocabulary` | `user_word_progress`, `user_saved_words` | **Không tạo**, dùng lại |

Phần tài liệu còn thiếu và đã bổ sung ở Giai đoạn 1: cấp độ từng nguồn (`lex_sense_levels`), hệ cấp độ không chỉ CEFR (HSK, JLPT), loại mục từ (phrasal verb, idiom...), thẻ kỳ thi, báo lỗi từ người dùng (`lex_reports`), cờ nội dung AI, chặn publish khi chưa có nghĩa được duyệt, tìm kiếm gần đúng, RLS đầy đủ.

## 3. Quyết định đã áp dụng (đổi ý được, nói mình sửa)

1. **Cộng thêm, không thay thế.** Bảng cũ và frontend hiện tại giữ nguyên. Kho mới nằm cạnh với tiền tố `lex_`.
2. **Giữ `dictionary_entries` đến hết Giai đoạn 2.** Sau đó đổi `SupabaseDictionaryProvider` sang đọc kho mới (qua RPC), rồi mới bỏ bảng cũ.
3. **Nối hai bên bằng một cột:** `vocab_words.lex_sense_id` (có thể trống). Flashcard cũ chạy bình thường; từ mới trỏ về nghĩa chuẩn.
4. **Làm tiếng Anh trước.** Schema đã sẵn cho `zh` và `ja` (hệ cấp độ HSK/JLPT, pinyin, kana).
5. **Chưa dùng 5 agent hay nhiều MCP.** Script chạy tay + Supabase CLI là đủ. AI chỉ dùng để dịch tiếng Việt và viết ví dụ, và luôn qua bước duyệt.
6. **7 cấp = độ khó từ dễ đến khó, dùng chung cho mọi ngôn ngữ.** L7 là "Chuyên sâu & Hiếm gặp" (vượt C2). Bảng `lex_level_map` ánh xạ từng cấp của hệ gốc về 1-7: CEFR A1-C2 -> 1-6; HSK 1-6 -> 1-6, HSK 7-9 -> 7; JLPT N5-N1 -> 1-5. Từ L7 của tiếng Anh gắn `level_system = 'custom'`, `level = 'expert'`. Đây là **đề xuất mặc định, sửa được** bằng cách đổi dữ liệu trong `lex_level_map`, không cần đổi code.

## 4. Nguồn dữ liệu và giấy phép (BẠN phải kiểm tra)

Các thông tin giấy phép dưới đây lấy từ tài liệu thiết kế bạn dán, **mình chưa xác minh**. Cột "license_verified" trong `lex_sources` mặc định là `false`, chỉ bật sau khi bạn tự đối chiếu trang chính thức của từng nguồn.

| Nguồn | Dùng cho | Tài liệu nói | Việc cần làm |
|---|---|---|---|
| CEFR-J | Danh sách A1-B2 | Dùng miễn phí, yêu cầu ghi công | Đọc điều khoản, ghi công ở trang Credits |
| Octanove Vocabulary Profile | C1-C2 | CC BY-SA 4.0 | Hiểu nghĩa vụ chia sẻ lại cùng giấy phép |
| CEFRLex (EFLLex) | Đối chiếu cấp độ | Không nêu | Kiểm tra điều khoản sử dụng |
| NGSL | Từ thông dụng | Không nêu | Kiểm tra giấy phép |
| Wiktionary (qua dump/Kaikki) | Nghĩa, IPA, dạng từ | Không nêu rõ | Kiểm tra giấy phép và cách ghi công |
| Open English WordNet | Synonym, antonym | Không nêu | Kiểm tra giấy phép |
| Tatoeba | Câu ví dụ | Giữ người đóng góp và giấy phép từng câu | Lưu `author_credit`, kiểm tra giấy phép |
| Free Dictionary API | Nghĩa, audio | "Kiểm tra điều khoản trước khi lưu lâu dài" | Đọc điều khoản trước khi lưu |
| Dataset WortUniversum | Thử nghiệm | CC BY-SA 4.0 | Chỉ dùng thử, kiểm tra trước khi dùng thật |
| Oxford, Cambridge | **Không dùng** | | Không scrape. Chỉ dùng nếu có API được cấp phép |

Quy tắc chung: giấy phép CC BY-SA bắt buộc ghi công và chia sẻ dữ liệu phái sinh theo cùng giấy phép, kể cả với dự án phi thương mại. Cần một trang **Credits** đọc từ `lex_sources`.

## 5. Phát hiện cần xử lý

1. **`frontend/.env` nằm trong file zip bạn gửi.** Nó đã được `.gitignore` che nên không vào Git, và mình không đọc nội dung. Nhưng nếu file zip từng được gửi cho ai khác, hãy đổi các key trong đó.
2. **Bộ từ "Oxford 3000 từ vựng học thuật cốt lõi"** (trong seed 000011). Oxford 3000 là danh sách có bản quyền. Nên đổi tên, hoặc thay nội dung bằng nguồn mở (ví dụ NGSL hay danh sách tự soạn).
3. **Test cũ có thể đã lệch schema.** `01_rls_security_tests.sql` chèn vào `user_word_progress` các cột `srs_stage`, `repetitions`, `ease_factor` và `word_id` dạng chữ, trong khi migration 4 dùng `easiness_factor`, `repetition_count` và `word_id` kiểu UUID. Có thể các migration sau đã đổi, mình chưa xác minh được. Hãy chạy `supabase test db` để biết.
4. **Seed hiện tại chỉ là dữ liệu mẫu.** Đừng coi là kho từ vựng thật.
5. **Dung lượng.** Hãy kiểm tra giới hạn database và storage của gói Supabase hiện tại trước khi import hàng chục nghìn từ hoặc audio.

## 6. Checklist hoàn thành Giai đoạn 0

- [ ] Đọc mục 3, báo mình quyết định nào cần đổi (đặc biệt bảng ánh xạ cấp độ ở quyết định 6)
- [ ] Đối chiếu giấy phép từng nguồn ở mục 4 (ít nhất CEFR-J, Wiktionary, Tatoeba cho giai đoạn đầu)
- [ ] Quyết định xử lý bộ từ "Oxford 3000"
- [ ] Kiểm tra `frontend/.env` (mục 5.1)
- [ ] Chạy `supabase test db` để biết test cũ còn đúng không

## 7. Chạy Giai đoạn 1

Chép các file trong gói này vào repo cùng đường dẫn, rồi (PowerShell, từ thư mục gốc dự án):

```powershell
cd backend
supabase start
supabase db reset          # áp dụng toàn bộ migration trên DB local
supabase test db           # chạy test pgTAP, gồm 02_lexicon_rls_tests.sql
supabase db push --dry-run # xem trước thay đổi lên DB thật
supabase db push           # chỉ chạy khi local đã ổn
```

Sau khi đẩy lên DB thật, chạy `scripts/verify_lexicon_schema.sql` trong SQL Editor. Các mục [A] đến [F] phải trả về 0 dòng.