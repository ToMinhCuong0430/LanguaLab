# vocab-pipeline: nhập Wiktionary vào kho từ vựng LanguaLab

Chương trình Python gồm 4 bước nhỏ, mỗi bước có thể chạy lại độc lập:

| Bước | File | Làm gì | Có đụng database? |
|---|---|---|---|
| 0 | `inspect_dump.py` | Xem cấu trúc thật của file JSONL | Không |
| 1a | `build_cefr_wordlist.py` | Gộp CEFR-J và Octanove thành wordlist có cấp độ | Không |
| 1 | `extract_wiktionary.py` | Lọc và chuyển JSONL thành CSV khớp schema `lex_*` | Không |
| 2 | `load_to_database.py` | Nạp CSV vào bảng `lex_*` (chỉ thêm mới) | Có |
| 3 | `publish_entries.py` | Chuyển mục từ đủ điều kiện từ `draft` sang `published` | Có |

## Điều kiện trước khi chạy

- Đã áp dụng migration `20261031000018` và `20261031000019` (có bảng `lex_*`).
- Python 3.10 trở lên.
- File JSONL của Wiktionary (định dạng wiktextract/Kaikki), ví dụ `D:\data\kaikki-english.jsonl`.

## Cài đặt (PowerShell)

```powershell
cd backend\vocab-pipeline
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Quy trình chạy thử với 500 từ

**1. Xem file dump** (vài giây, chỉ đọc 30.000 dòng đầu):

```powershell
python inspect_dump.py --input D:\data\kaikki-english.jsonl
python inspect_dump.py --input D:\data\kaikki-english.jsonl --word run
```
Kiểm tra các khóa như `word`, `lang_code`, `pos`, `senses`, `sounds`, `forms`, `translations` có xuất hiện không. Nếu tên khóa khác, báo lại để sửa `extract_wiktionary.py`.

**2. Trích xuất 500 mục từ ra CSV** (không đụng database):

```powershell
python extract_wiktionary.py --input D:\data\kaikki-english.jsonl --limit-entries 500 --out datasets\processed
```
Kết quả: `entries.csv`, `senses.csv`, `forms.csv`, `pronunciations.csv`, `examples.csv`, `translations.csv`, `relations.csv`, `report.json`, và `unmatched_translations.csv` (bản dịch tiếng Việt không khớp nghĩa nào, chương trình không đoán).

**3. Đọc thử 30 dòng ngẫu nhiên trước khi nạp:**

```powershell
Import-Csv datasets\processed\senses.csv | Get-Random -Count 30 | Format-Table
```

**4. Nạp vào database LOCAL trước** (bật `supabase start`; kiểm tra cổng DB trong `backend\supabase\config.toml`):

```powershell
$env:DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
python load_to_database.py --input-dir datasets\processed --dry-run
python load_to_database.py --input-dir datasets\processed --approve
```
`--dry-run` chạy thử rồi hoàn tác. `--approve` đánh dấu nghĩa và ví dụ mới là đã duyệt (bản dịch tiếng Việt luôn ở trạng thái chờ duyệt).

**5. Publish và thử tìm kiếm:**

```powershell
python publish_entries.py --require-ipa --dry-run
python publish_entries.py --require-ipa
```
Rồi trong SQL Editor: `select * from public.search_lex_entries('run');`

**6. Chạy `scripts/verify_lexicon_schema.sql`.** Mục [A] đến [F] và [H] phải trả về 0 dòng.

Khi mọi thứ ổn trên local, đổi `DATABASE_URL` sang chuỗi kết nối của project Supabase thật (lấy ở trang Connect của dashboard) rồi chạy lại các bước 4 và 5. **Không commit** chuỗi này, không dán vào code.

## Gắn cấp độ CEFR A1-C2 (Giai đoạn 3)

Wiktionary không có cấp độ CEFR, nên cấp độ lấy từ hai danh sách đi kèm trong `wordlists\source\`:
CEFR-J Vocabulary Profile 1.5 (A1-B2) và Octanove Vocabulary Profile C1/C2 (C1-C2).

**Bước A. Gộp hai danh sách thành một wordlist** (không cần Wiktionary, không cần database):

```powershell
python build_cefr_wordlist.py `
  --cefrj wordlists\source\cefrj-vocabulary-profile-1.5.csv `
  --octanove wordlists\source\octanove-vocabulary-profile-c1c2-1.0.csv `
  --out wordlists
```

Kết quả trong `wordlists\`:
- `cefr_combined.csv`: `lemma,pos,level,source` (khoảng 9.900 dòng, 8.800 từ), dùng ở bước B.
- `cefr_conflicts.csv`: các cặp (từ, từ loại) bị hai nguồn xếp cấp khác nhau (khoảng 128). Chương trình giữ **cấp thấp nhất**; cấp còn lại nằm ở file này để bạn xem lại.
- `cefr_skipped.csv`: mục không đưa vào được (viết hoa như `April`, `CD`; ký tự đặc biệt như `café`, `a.m.`).
- `cefr_report.json`: thống kê theo cấp và nguồn.

**Bước B. Trích xuất từ Wiktionary theo wordlist** (vài phút đến vài chục phút):

```powershell
python extract_wiktionary.py --input $dump --wordlist wordlists\cefr_combined.csv --include-multiword --out datasets\cefr
```

Ngoài các CSV thường, có thêm `sense_levels.csv` (cấp độ theo từng nguồn) và `wordlist_unmatched.csv` (dòng trong wordlist không tìm thấy trong Wiktionary hoặc sai từ loại).
**Cấp độ chỉ gắn cho nghĩa đầu tiên của mỗi từ loại** (nghĩa phổ biến nhất); các nghĩa sau để trống vì không có dữ liệu để biết chúng khó đến đâu.

**Bước C. Nạp vào database** (thử local trước):

```powershell
python load_to_database.py --input-dir datasets\cefr --dry-run
python load_to_database.py --input-dir datasets\cefr --approve
```

Nếu trước đó bạn đã nạp thử 500 từ không có cấp độ, các mục từ đó đã tồn tại nên bị giữ nguyên. Thêm `--attach-levels` để gắn cấp độ cho chúng (chỉ điền chỗ đang trống, không ghi đè). Cách đơn giản hơn trên DB local là `supabase db reset` rồi nạp lại từ đầu.

Kiểm tra số lượng theo cấp: `select level, count(*) from lex_senses where level is not null group by level order by level;` rồi chạy `scripts\verify_lexicon_schema.sql` (mục [H] phải trả về 0 dòng).

**Lưu ý giấy phép:** CEFR-J yêu cầu trích dẫn đúng; Octanove C1/C2 theo CC BY-SA 4.0 (ghi công và chia sẻ lại theo cùng giấy phép). Hai nguồn được tạo với `license_verified = false` để bạn tự đối chiếu, và cần hiển thị ở trang Credits.

Các tùy chọn khác của `extract_wiktionary.py`: `--with-audio-urls`, `--max-senses`, `--keep-sensitive`.

## Quyết định thiết kế

- **Bắt buộc chọn phạm vi** (`--wordlist` hoặc `--limit-entries`), để không vô tình nhập cả trăm nghìn mục từ.
- **Chỉ thêm mới, không ghi đè.** Chạy lại không tạo bản sao và không phá dữ liệu đã duyệt.
- **Dữ liệu gốc nằm trong chính file JSONL.** Hãy giữ file đó (và ghi lại ngày tải); chương trình không chép bản gốc vào database để tiết kiệm dung lượng.
- **Cấp độ không do Wiktionary cung cấp.** Chỉ có khi bạn đưa wordlist có `level`.
- **Bỏ mặc định:** danh từ riêng, hậu tố/tiền tố, dạng biến cách của từ khác, nghĩa lỗi thời, sai chính tả, nghĩa thô tục. Mục từ viết hoa (ví dụ `US`) cũng bị bỏ.
- **Âm thanh:** chỉ lấy IPA. URL audio chỉ ghi khi có `--with-audio-urls`, vì giấy phép từng file âm thanh cần kiểm tra riêng (Giai đoạn 5).
- **Ví dụ:** bỏ các câu trích dẫn sách báo, chỉ lấy câu ví dụ ngắn.

## Giấy phép

Nguồn `wiktionary-en` được tạo với `license_verified = false`. Hãy tự đối chiếu giấy phép trên trang chính thức của Wiktionary/Kaikki và các yêu cầu ghi công, rồi mới bật `true` và làm trang Credits.

## Sự cố thường gặp

- `Chưa có bảng lex_entries`: chưa áp dụng migration 18.
- `Chưa đặt biến môi trường DATABASE_URL`: đặt lại trong cùng cửa sổ PowerShell (biến chỉ có hiệu lực trong cửa sổ đó).
- `skip_not_in_wordlist` rất cao: bình thường, nghĩa là file dump có nhiều từ ngoài danh sách của bạn.
- Chạy chậm: file 3 GB cần vài phút đến vài chục phút. Dùng `--max-lines 200000` để thử nhanh.
- `entries = 0`: chạy `inspect_dump.py` kiểm tra `lang_code` và `pos` có đúng như chương trình mong đợi không.