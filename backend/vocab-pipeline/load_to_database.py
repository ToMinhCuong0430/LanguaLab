#!/usr/bin/env python3
"""
Nạp các file CSV (do extract_wiktionary.py tạo ra) vào các bảng lex_* của Supabase.

An toàn theo thiết kế:
- Chạy TRONG MỘT TRANSACTION. Có lỗi là hoàn tác toàn bộ. --dry-run luôn hoàn tác.
- CHỈ THÊM MỚI: mục từ đã có trong kho (cùng ngôn ngữ, loại, lemma) bị bỏ qua, không bị ghi đè.
  Nhờ vậy chạy lại nhiều lần không tạo bản sao và không phá dữ liệu đã duyệt.
- Mục từ mới luôn ở trạng thái 'draft'. Nghĩa/ví dụ chỉ thành 'approved' khi bạn thêm --approve.
  Bản dịch tiếng Việt luôn ở 'pending' (cần duyệt).
- Chuỗi kết nối đọc từ biến môi trường DATABASE_URL. KHÔNG ghi vào code, KHÔNG commit lên Git.

Cấp độ CEFR (khi CSV có sense_levels.csv, tức là đã trích xuất bằng --wordlist có cột source):
- Ghi cấp độ vào lex_senses.level và ghi nguồn xếp cấp vào lex_sense_levels (CEFR-J, Octanove...).
- Mục từ ĐÃ CÓ trong kho không bị đổi, trừ khi bạn thêm --attach-levels: khi đó chỉ GẮN cấp độ cho
  những nghĩa đang trống cấp độ (khớp theo mục từ + từ loại + định nghĩa), không ghi đè cấp độ đã có.

Ví dụ (PowerShell):
  $env:DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres"
  python load_to_database.py --input-dir datasets/processed --dry-run
  python load_to_database.py --input-dir datasets/processed
"""
from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    import psycopg
except ImportError:  # pragma: no cover
    sys.exit("Thiếu thư viện. Chạy: pip install -r requirements.txt")

SOURCE_CODE = "wiktionary-en"

# Nguồn xếp cấp độ. Giấy phép lấy từ README của Open Language Profiles; license_verified luôn FALSE,
# bạn tự đối chiếu trang chính thức rồi mới bật TRUE.
LEVEL_SOURCES = {
    "cefrj": dict(
        name="CEFR-J Vocabulary Profile 1.5",
        description="Danh sách từ vựng A1-B2 gắn cấp độ CEFR-J, do Tono Laboratory (Tokyo University of Foreign Studies) biên soạn.",
        source_url="http://www.cefr-j.org/download.html",
        license_name="Miễn phí cho nghiên cứu và thương mại, bắt buộc trích dẫn (theo README Open Language Profiles; cần xác minh)",
        license_url=None,
        attribution_text="The CEFR-J Wordlist Version 1.5. Compiled by Yukio Tono, Tokyo University of Foreign Studies. http://www.cefr-j.org/download.html",
        requires_share_alike=False,
    ),
    "octanove": dict(
        name="Octanove Vocabulary Profile C1/C2 1.0",
        description="Danh sách từ vựng C1-C2 do Octanove Labs biên soạn, phân phối qua Open Language Profiles.",
        source_url="https://github.com/openlanguageprofiles/olp-en-cefrj",
        license_name="CC BY-SA 4.0 (cần xác minh)",
        license_url="https://creativecommons.org/licenses/by-sa/4.0/",
        attribution_text="Octanove Vocabulary Profile C1/C2 (ver 1.0), Octanove Labs, phân phối qua Open Language Profiles.",
        requires_share_alike=True,
    ),
}

# bảng tạm -> (file CSV, danh sách cột theo đúng thứ tự trong CSV, định nghĩa cột)
STAGING = {
    "stg_entries": ("entries.csv", "entry_key text, lemma text, entry_type text"),
    "stg_senses": ("senses.csv", "entry_key text, sense_order int, pos text, definition text, level_system text, level text"),
    "stg_forms": ("forms.csv", "entry_key text, form text, form_type text"),
    "stg_pron": ("pronunciations.csv", "entry_key text, kind text, accent text, transcription text, audio_url text"),
    "stg_examples": ("examples.csv", "entry_key text, sense_order int, sentence text"),
    "stg_translations": ("translations.csv", "entry_key text, sense_order int, language_code text, translated_text text, note text"),
    "stg_relations": ("relations.csv", "entry_key text, sense_order int, relation_type text, target_text text"),
    "stg_sense_levels": ("sense_levels.csv", "entry_key text, sense_order int, source_code text, level_system text, level text"),
}
OPTIONAL_STAGING = {"stg_sense_levels"}  # file có thể không tồn tại (CSV tạo từ bản cũ)


def copy_csv(cur, table: str, path: Path, columns_ddl: str) -> None:
    cols = ", ".join(part.strip().split(" ")[0] for part in columns_ddl.split(","))
    with cur.copy(f"COPY {table} ({cols}) FROM STDIN WITH (FORMAT csv, HEADER true)") as copy:
        with path.open("rb") as f:
            while chunk := f.read(1 << 20):
                copy.write(chunk)


def run(args) -> None:
    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("Chưa đặt biến môi trường DATABASE_URL (xem README).")

    input_dir = Path(args.input_dir)
    for table, (filename, _) in STAGING.items():
        if table in OPTIONAL_STAGING:
            continue
        if not (input_dir / filename).is_file():
            sys.exit(f"Thiếu file {input_dir / filename}. Hãy chạy extract_wiktionary.py trước.")

    review = "approved" if args.approve else "pending"
    counts: dict[str, int] = {}

    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            # Kiểm tra schema đã có
            cur.execute("SELECT to_regclass('public.lex_entries') IS NOT NULL")
            if not cur.fetchone()[0]:
                sys.exit("Chưa có bảng lex_entries. Hãy áp dụng migration 20261031000018 (và 19) trước.")

            # 1. Nguồn dữ liệu (giấy phép CHƯA xác minh: bạn tự đối chiếu rồi mới bật license_verified)
            cur.execute(
                """
                INSERT INTO public.lex_sources
                  (code, name, description, source_url, license_name, license_url,
                   attribution_text, requires_share_alike, license_verified)
                VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE, FALSE)
                ON CONFLICT (code) DO NOTHING
                """,
                (
                    SOURCE_CODE,
                    "English Wiktionary (qua wiktextract/Kaikki)",
                    "Nghĩa, phiên âm IPA, dạng từ, ví dụ và quan hệ từ vựng trích từ English Wiktionary.",
                    "https://en.wiktionary.org",
                    "CC BY-SA (cần xác minh trên trang chính thức)",
                    None,
                    "Nội dung từ English Wiktionary (en.wiktionary.org) do cộng đồng Wikimedia đóng góp.",
                ),
            )
            cur.execute("SELECT id FROM public.lex_sources WHERE code = %s", (SOURCE_CODE,))
            source_id = cur.fetchone()[0]

            # 2. Batch
            batch_name = f"wiktionary {input_dir.name} {datetime.now():%Y-%m-%d %H:%M}"
            with (input_dir / "entries.csv").open("rb") as f:
                total = max(sum(1 for _ in f) - 1, 0)
            cur.execute(
                """
                INSERT INTO public.lex_import_batches (source_id, batch_name, status, total_records)
                VALUES (%s, %s, 'processing', %s) RETURNING id
                """,
                (source_id, batch_name, total),
            )
            batch_id = cur.fetchone()[0]

            # 3. Bảng tạm và nạp CSV
            for table, (filename, ddl) in STAGING.items():
                cur.execute(f"CREATE TEMP TABLE {table} ({ddl}) ON COMMIT DROP")
                if table in OPTIONAL_STAGING and not (input_dir / filename).is_file():
                    continue
                copy_csv(cur, table, input_dir / filename, ddl)
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                counts[f"staging.{table}"] = cur.fetchone()[0]

            # 4. Mục từ MỚI (bỏ qua mục từ đã có, không ghi đè)
            cur.execute("CREATE TEMP TABLE stg_new (entry_key text PRIMARY KEY, entry_id uuid) ON COMMIT DROP")
            cur.execute(
                """
                WITH ins AS (
                  INSERT INTO public.lex_entries (language, entry_type, lemma)
                  SELECT 'en'::public.learning_language, s.entry_type, s.lemma
                  FROM stg_entries s
                  ON CONFLICT ON CONSTRAINT uq_lex_entry DO NOTHING
                  RETURNING id, entry_type, normalized_lemma
                )
                INSERT INTO stg_new (entry_key, entry_id)
                SELECT entry_type || ':' || normalized_lemma, id FROM ins
                """
            )
            counts["lex_entries.inserted"] = cur.rowcount
            counts["lex_entries.skipped_existing"] = total - cur.rowcount

            # 5. Các bảng con (chỉ cho mục từ mới)
            cur.execute(
                """
                INSERT INTO public.lex_senses
                  (entry_id, sense_order, part_of_speech, definition, level_system, level,
                   content_origin, review_status)
                SELECT n.entry_id, s.sense_order, s.pos, s.definition,
                       COALESCE(NULLIF(s.level_system, ''), 'cefr'), NULLIF(s.level, ''),
                       'imported', %s
                FROM stg_senses s JOIN stg_new n USING (entry_key)
                """,
                (review,),
            )
            counts["lex_senses.inserted"] = cur.rowcount

            # 5b. Cấp độ theo nguồn (CEFR-J, Octanove...)
            cur.execute("SELECT DISTINCT source_code FROM stg_sense_levels WHERE source_code IS NOT NULL")
            level_codes = [r[0] for r in cur.fetchall()]
            for code in level_codes:
                meta = LEVEL_SOURCES.get(code)
                if meta is None:
                    cur.execute("SELECT 1 FROM public.lex_sources WHERE code = %s", (code,))
                    if cur.fetchone() is None:
                        sys.exit(f"Nguồn cấp độ '{code}' chưa có trong lex_sources và không nằm trong LEVEL_SOURCES.")
                    continue
                cur.execute(
                    """
                    INSERT INTO public.lex_sources
                      (code, name, description, source_url, license_name, license_url,
                       attribution_text, requires_share_alike, license_verified)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, FALSE)
                    ON CONFLICT (code) DO NOTHING
                    """,
                    (code, meta["name"], meta["description"], meta["source_url"], meta["license_name"],
                     meta["license_url"], meta["attribution_text"], meta["requires_share_alike"]),
                )

            cur.execute(
                """
                INSERT INTO public.lex_sense_levels (sense_id, source_id, level_system, level)
                SELECT se.id, src.id, l.level_system, l.level
                FROM stg_sense_levels l
                JOIN stg_new n USING (entry_key)
                JOIN public.lex_senses se ON se.entry_id = n.entry_id AND se.sense_order = l.sense_order
                JOIN public.lex_sources src ON src.code = l.source_code
                ON CONFLICT DO NOTHING
                """
            )
            counts["lex_sense_levels.inserted"] = cur.rowcount

            # 5c. (tùy chọn) Gắn cấp độ cho mục từ ĐÃ CÓ: chỉ điền chỗ đang trống, không ghi đè
            cur.execute("SELECT COUNT(*) FROM stg_entries e WHERE e.entry_key NOT IN (SELECT entry_key FROM stg_new)")
            existing_count = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM stg_sense_levels")
            has_levels = cur.fetchone()[0] > 0
            if args.attach_levels and has_levels and existing_count:
                cur.execute(
                    """
                    CREATE TEMP TABLE stg_attach ON COMMIT DROP AS
                    SELECT se.id AS sense_id, l.level_system, l.level, l.source_code
                    FROM stg_sense_levels l
                    JOIN stg_senses ss ON ss.entry_key = l.entry_key AND ss.sense_order = l.sense_order
                    JOIN stg_entries e ON e.entry_key = l.entry_key
                    JOIN public.lex_entries le
                      ON le.language = 'en'::public.learning_language
                     AND le.entry_type = e.entry_type
                     AND le.normalized_lemma = lower(btrim(e.lemma))
                    JOIN public.lex_senses se
                      ON se.entry_id = le.id AND se.part_of_speech = ss.pos AND se.definition = ss.definition
                    WHERE l.entry_key NOT IN (SELECT entry_key FROM stg_new)
                    """
                )
                cur.execute(
                    """
                    UPDATE public.lex_senses se
                    SET level_system = a.level_system, level = a.level
                    FROM stg_attach a
                    WHERE se.id = a.sense_id AND se.level IS NULL
                    """
                )
                counts["lex_senses.level_attached_existing"] = cur.rowcount
                cur.execute(
                    """
                    INSERT INTO public.lex_sense_levels (sense_id, source_id, level_system, level)
                    SELECT a.sense_id, src.id, a.level_system, a.level
                    FROM stg_attach a
                    JOIN public.lex_sources src ON src.code = a.source_code
                    ON CONFLICT DO NOTHING
                    """
                )
                counts["lex_sense_levels.inserted_existing"] = cur.rowcount
            elif has_levels and existing_count:
                print(f"Lưu ý: {existing_count:,} mục từ đã có sẵn trong kho nên giữ nguyên. "
                      "Muốn gắn cấp độ cho chúng, thêm --attach-levels.")

            cur.execute(
                """
                INSERT INTO public.lex_forms (entry_id, form, form_type)
                SELECT DISTINCT n.entry_id, f.form, f.form_type
                FROM stg_forms f JOIN stg_new n USING (entry_key)
                ON CONFLICT DO NOTHING
                """
            )
            counts["lex_forms.inserted"] = cur.rowcount

            cur.execute(
                """
                INSERT INTO public.lex_pronunciations
                  (entry_id, kind, accent, transcription, audio_url, audio_source)
                SELECT n.entry_id, p.kind, p.accent, NULLIF(p.transcription, ''), NULLIF(p.audio_url, ''),
                       CASE WHEN NULLIF(p.audio_url, '') IS NOT NULL THEN 'dataset' END
                FROM stg_pron p JOIN stg_new n USING (entry_key)
                ON CONFLICT DO NOTHING
                """
            )
            counts["lex_pronunciations.inserted"] = cur.rowcount

            cur.execute(
                """
                INSERT INTO public.lex_examples
                  (sense_id, sentence, source_id, content_origin, review_status)
                SELECT se.id, x.sentence, %s, 'imported', %s
                FROM stg_examples x
                JOIN stg_new n USING (entry_key)
                JOIN public.lex_senses se ON se.entry_id = n.entry_id AND se.sense_order = x.sense_order
                """,
                (source_id, review),
            )
            counts["lex_examples.inserted"] = cur.rowcount

            # Bản dịch tiếng Việt: LUÔN 'pending' (cần duyệt thủ công), bất kể --approve
            cur.execute(
                """
                INSERT INTO public.lex_translations
                  (sense_id, language_code, translated_text, note, content_origin, review_status)
                SELECT se.id, t.language_code, t.translated_text, NULLIF(t.note, ''), 'imported', 'pending'
                FROM stg_translations t
                JOIN stg_new n USING (entry_key)
                JOIN public.lex_senses se ON se.entry_id = n.entry_id AND se.sense_order = t.sense_order
                ON CONFLICT DO NOTHING
                """
            )
            counts["lex_translations.inserted"] = cur.rowcount

            cur.execute(
                """
                INSERT INTO public.lex_relations
                  (source_entry_id, source_sense_id, relation_type, target_text)
                SELECT n.entry_id, se.id, r.relation_type, r.target_text
                FROM stg_relations r
                JOIN stg_new n USING (entry_key)
                LEFT JOIN public.lex_senses se ON se.entry_id = n.entry_id AND se.sense_order = r.sense_order
                ON CONFLICT DO NOTHING
                """
            )
            counts["lex_relations.inserted"] = cur.rowcount

            # 6. Truy vết nguồn cho từng mục từ mới (liên kết tới trang Wiktionary tương ứng)
            cur.execute(
                """
                INSERT INTO public.lex_attributions
                  (source_id, entity_type, entity_id, source_url, license_name, attribution_text)
                SELECT %s, 'entry', n.entry_id,
                       'https://en.wiktionary.org/wiki/' || replace(e.lemma, ' ', '_'),
                       'CC BY-SA (cần xác minh)',
                       'English Wiktionary, người đóng góp Wikimedia'
                FROM stg_new n JOIN stg_entries e USING (entry_key)
                """,
                (source_id,),
            )
            counts["lex_attributions.inserted"] = cur.rowcount

            # 7. Kết thúc batch
            cur.execute(
                """
                UPDATE public.lex_import_batches
                SET status = 'completed', processed_records = %s, failed_records = 0, finished_at = NOW()
                WHERE id = %s
                """,
                (counts["lex_entries.inserted"], batch_id),
            )

        print("Kết quả:")
        for k, v in counts.items():
            print(f"  {k:<36} {v:>9,}")

        if args.dry_run:
            conn.rollback()
            print("\n[DRY-RUN] Đã hoàn tác toàn bộ, database không thay đổi.")
        else:
            conn.commit()
            print("\nĐã ghi vào database (mục từ mới ở trạng thái 'draft').")
            if not args.approve:
                print("Nghĩa và ví dụ đang 'pending'. Sau khi kiểm tra mẫu, duyệt rồi mới publish (xem README).")


def main() -> None:
    p = argparse.ArgumentParser(description="Nạp CSV vào bảng lex_* của Supabase (chỉ thêm mới)")
    p.add_argument("--input-dir", default="datasets/processed", help="Thư mục chứa CSV từ extract_wiktionary.py")
    p.add_argument("--dry-run", action="store_true", help="Chạy thử rồi hoàn tác, không ghi gì")
    p.add_argument("--attach-levels", action="store_true",
                   help="Gắn cấp độ CEFR cho mục từ ĐÃ CÓ (chỉ điền nghĩa đang trống cấp độ, không ghi đè)")
    p.add_argument("--approve", action="store_true",
                   help="Đánh dấu nghĩa và ví dụ mới là 'approved' (bản dịch vẫn 'pending')")
    run(p.parse_args())


if __name__ == "__main__":
    main()