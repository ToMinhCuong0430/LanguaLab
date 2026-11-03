# Kho từ vựng LanguaLab - Giai đoạn 3: Gắn phân loại CEFR A1-C2

Tài liệu ghi nhận quy trình, nguồn dữ liệu, quy tắc phân loại và kết quả tổng hợp cấp độ CEFR A1-C2 vào kho từ vựng trung tâm `lex_*`.

---

## 1. Nguồn dữ liệu và Số liệu thực tế

Nguồn phân loại cấp độ được xây dựng từ việc kết hợp hai bộ chuẩn mở:
1. **CEFR-J Vocabulary Profile 1.5 (A1 - B2)**: biên soạn bởi Tono Laboratory (Tokyo University of Foreign Studies).
2. **Octanove Vocabulary Profile C1/C2 1.0 (C1 - C2)**: biên soạn bởi Octanove Labs, phân phối qua Open Language Profiles.

### Báo cáo thống kê tổng hợp (`wordlists/cefr_report.json`):
- **Tổng số dòng kết hợp (`combined_rows`)**: 9.919 dòng.
- **Số lượng mục từ duy nhất (`unique_lemmas`)**: 8.785 từ.
- **Phân bố theo cấp độ (`by_level`)**:
  - **A1**: 1.149 dòng
  - **A2**: 1.433 dòng
  - **B1**: 2.474 dòng
  - **B2**: 2.844 dòng
  - **C1**: 1.064 dòng
  - **C2**: 955 dòng
- **Phân bố theo nguồn (`by_source`)**:
  - `cefrj`: 7.900 dòng
  - `octanove`: 2.019 dòng
- **Số lượng xung đột cấp độ (`conflicts`)**: 128 trường hợp (ghi nhận tại `wordlists/cefr_conflicts.csv`).
- **Số lượng mục bị bỏ qua (`skipped`)**: 71 trường hợp (ghi nhận tại `wordlists/cefr_skipped.csv`):
  - Ký tự đặc biệt hoặc viết tắt: 7 mục.
  - Viết hoa (danh từ riêng hoặc viết tắt): 64 mục.

---

## 2. So sánh Số liệu thực tế với `vocab_levels.target_word_count`

Bảng đối chiếu giữa số lượng từ thực tế thu được từ 2 danh sách phân loại chuẩn và chỉ tiêu số từ `target_word_count` hiện tại trong cơ sở dữ liệu (`public.vocab_levels`):

| Cấp | Tên cấp độ | Mã | Số lượng thực tế (dòng) | `target_word_count` hiện tại | Chênh lệch | Đánh giá & Gợi ý |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **1** | Cốt lõi A1 | `L1` | **1.149** | 500 | +649 (230%) | Vượt xa mục tiêu tối thiểu 500 từ. Rất phong phú cho người mới bắt đầu. |
| **2** | Sơ cấp A2 | `L2` | **1.433** | 1.000 | +433 (143%) | Đạt và vượt mục tiêu chuẩn A2. |
| **3** | Trung cấp B1 | `L3` | **2.474** | 2.000 | +474 (124%) | Độ phủ hoàn hảo cho giao tiếp tự chủ. |
| **4** | Trung cao B2 | `L4` | **2.844** | 4.000 | -1.156 (71%) | Đạt 71% dung lượng mục tiêu lý thuyết. |
| **5** | Cao cấp C1 | `L5` | **1.064** | 8.000 | -6.936 (13%) | Danh mục Octanove C1 chỉ tập trung vào từ vựng học thuật tinh chọn (~1.000 từ). |
| **6** | Tinh thông C2 | `L6` | **955** | 16.000 | -15.045 (6%) | C2 tập trung vào các từ vựng mức độ tinh tế cao cấp. |
| **7** | Chuyên sâu & Hiếm gặp | `C2+` | **0** | 2.500 | Chưa có | **Chưa có nguồn dữ liệu**. Tuyệt đối không bịa dữ liệu. |
| **Tổng** | *(Toàn bộ thang 1-7)* | | **9.919** *(8.785 từ)* | **34.000** | | |

> [!NOTE]
> **Khuyến nghị cho Chủ dự án**:
> Mục tiêu `target_word_count` ban đầu được thiết kế theo cấp số nhân (500 -> 16.000) phù hợp với quy mô toàn bộ vốn từ điển ngôn ngữ. Tuy nhiên, các danh sách phân loại khảo thí uy tín thế giới (như Oxford 3000/5000 hay CEFR-J/Octanove) thường giới hạn ở quy mô ~10.000 từ tinh chọn thực dụng. Bạn có thể cân nhắc:
> 1. Giữ nguyên `target_word_count` nếu sau này dự định nhập thêm các tập từ điển lớn (như Webster / WordNet).
> 2. Hoặc điều chỉnh lại `target_word_count` của C1/C2 sát với thực tế học thuật (~1.500 - 2.000 từ mỗi cấp) để thanh tiến độ của học viên hiển thị trực quan và khả thi hơn.

---

## 3. Quy tắc dữ liệu đã chốt

1. **Nguyên tắc ưu tiên cấp độ thấp nhất**:
   - Nếu một cặp `(lemma, pos)` được cả hai nguồn xếp cấp khác nhau (ví dụ một nguồn xếp A2, một nguồn xếp B1), hệ thống luôn chọn **cấp thấp nhất** (`A2`) để hiển thị.
   - Cấp cao hơn bị loại được lưu trữ nguyên vẹn trong `wordlists/cefr_conflicts.csv` để phục vụ đối chiếu, không bị mất thông tin.
2. **Gắn cấp cho nghĩa đầu tiên (Primary Sense)**:
   - Cấp độ CEFR chỉ được gắn cho **nghĩa đầu tiên của từng từ loại** (nghĩa cơ bản và thông dụng nhất của từ).
   - Các nghĩa thứ 2 trở đi để `level = NULL`, không tự ý suy đoán cấp độ.
3. **Lưu trữ nguồn phân loại đầy đủ**:
   - Mọi phân loại cấp độ được ghi nhận vào `lex_sense_levels` kèm theo `source_id` trỏ về bảng `lex_sources` (`cefrj` hoặc `octanove`).
4. **Bảo toàn dữ liệu đã có (Idempotency)**:
   - Mục từ đã tồn tại trong kho trung tâm `lex_entries` không bị ghi đè. Tùy chọn `--attach-levels` chỉ điền cấp độ cho những nghĩa đang để trống cấp độ, không ghi đè cấp độ đã có.

---

## 4. Các giới hạn đã biết

1. **Các mục bị loại bỏ (`wordlists/cefr_skipped.csv`)**:
   - **Mục viết hoa**: Các danh từ riêng hoặc từ viết tắt (như *April*, *CD*, *I*, *Monday*...) bị bỏ qua để bảo đảm kho từ vựng chuẩn hóa chữ thường.
   - **Ký tự đặc biệt & viết tắt**: Các từ có dấu phụ hoặc dấu chấm viết tắt (như *café*, *a.m.*...) tạm thời được đưa vào danh sách xem xét riêng.
2. **Cấp độ 7 ("Chuyên sâu & Hiếm gặp")**:
   - Chưa có nguồn dữ liệu trong đợt này. Hệ thống không tạo dữ liệu giả. Khi nào có bộ dữ liệu chuyên ngành / GRE / SAT, sẽ nạp vào cấp này qua `level_system = 'custom', level = 'expert'`.
3. **Các mục trong wordlist không khớp với Wiktionary (`wordlist_unmatched.csv`)**:
   - Xuất hiện khi từ có trong danh sách CEFR nhưng file dump Wiktionary không có mục tương ứng hoặc khác từ loại. Cần xem xét bổ sung nghĩa thủ công hoặc qua các nguồn từ điển mở khác trong Giai đoạn sau.

---

## 5. Hướng dẫn lệnh chạy thật (khi có file dump Wiktionary)

Dành cho khi bạn tự chạy trên máy tính với file dump Wiktionary đầy đủ:

```powershell
# Di chuyển vào thư mục pipeline
cd backend\vocab-pipeline

# Kích hoạt môi trường ảo
.\.venv\Scripts\Activate.ps1

# Bước A: Gộp danh sách CEFR (chạy 1 lần, kết quả đã có sẵn trong wordlists/)
python build_cefr_wordlist.py `
  --cefrj wordlists\source\cefrj-vocabulary-profile-1.5.csv `
  --octanove wordlists\source\octanove-vocabulary-profile-c1c2-1.0.csv `
  --out wordlists

# Bước B: Trích xuất từ file dump Wiktionary theo wordlist CEFR
$dump = "D:\data\kaikki-english.jsonl"
python extract_wiktionary.py `
  --input $dump `
  --wordlist wordlists\cefr_combined.csv `
  --include-multiword `
  --out datasets\cefr

# Bước C: Nạp vào cơ sở dữ liệu Supabase Local (hoặc Remote)
# Lưu ý: Đổi cổng hoặc chuỗi kết nối tương ứng
$env:DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Chạy thử kiểm tra trước (Rollback an toàn)
python load_to_database.py --input-dir datasets\cefr --dry-run

# Nạp thật và duyệt nghĩa
python load_to_database.py --input-dir datasets\cefr --approve --attach-levels

# Bước D: Xuất bản các mục từ đạt tiêu chuẩn (có phiên âm IPA và có cấp độ CEFR)
python publish_entries.py --require-ipa --require-level --dry-run
python publish_entries.py --require-ipa --require-level
```
