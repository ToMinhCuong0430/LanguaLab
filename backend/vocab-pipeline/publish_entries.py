#!/usr/bin/env python3
"""
Publish các mục từ Wiktionary đã đạt điều kiện (draft -> published).

Điều kiện luôn áp dụng: có ít nhất 1 nghĩa 'approved' (database cũng chặn nếu thiếu).
Tùy chọn: --require-ipa, --require-level.
Chạy --dry-run trước. Chuỗi kết nối lấy từ biến môi trường DATABASE_URL.

  python publish_entries.py --require-ipa --dry-run
  python publish_entries.py --require-ipa --limit 500
"""
import argparse
import os
import sys

try:
    import psycopg
except ImportError:
    sys.exit("Thiếu thư viện. Chạy: pip install -r requirements.txt")

SOURCE_CODE = "wiktionary-en"


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--require-ipa", action="store_true", help="Chỉ publish mục từ có phiên âm IPA")
    p.add_argument("--require-level", action="store_true", help="Chỉ publish mục từ có nghĩa đã gắn cấp độ")
    p.add_argument("--limit", type=int, default=0, help="Giới hạn số mục từ publish (0 = không giới hạn)")
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    url = os.environ.get("DATABASE_URL")
    if not url:
        sys.exit("Chưa đặt biến môi trường DATABASE_URL.")

    conds = [
        "e.status = 'draft'",
        """EXISTS (SELECT 1 FROM public.lex_attributions a
                   JOIN public.lex_sources s ON s.id = a.source_id
                   WHERE a.entity_type = 'entry' AND a.entity_id = e.id AND s.code = %(src)s)""",
        """EXISTS (SELECT 1 FROM public.lex_senses se
                   WHERE se.entry_id = e.id AND se.review_status = 'approved')""",
    ]
    if args.require_ipa:
        conds.append("""EXISTS (SELECT 1 FROM public.lex_pronunciations pr
                         WHERE pr.entry_id = e.id AND pr.transcription IS NOT NULL)""")
    if args.require_level:
        conds.append("""EXISTS (SELECT 1 FROM public.lex_senses sl
                         WHERE sl.entry_id = e.id AND sl.review_status = 'approved' AND sl.level IS NOT NULL)""")

    where = " AND ".join(conds)
    limit_sql = "ORDER BY e.lemma LIMIT %(lim)s" if args.limit else ""
    sql = f"""
        UPDATE public.lex_entries SET status = 'published'
        WHERE id IN (SELECT e.id FROM public.lex_entries e WHERE {where} {limit_sql})
    """
    with psycopg.connect(url) as conn:
        with conn.cursor() as cur:
            cur.execute(sql, {"src": SOURCE_CODE, "lim": args.limit})
            n = cur.rowcount
        print(f"Số mục từ đủ điều kiện publish: {n:,}")
        if args.dry_run:
            conn.rollback()
            print("[DRY-RUN] Đã hoàn tác, chưa publish gì.")
        else:
            conn.commit()
            print("Đã publish.")


if __name__ == "__main__":
    main()