#!/usr/bin/env python3
"""
Gộp hai danh sách phân loại CEFR thành MỘT wordlist dùng cho extract_wiktionary.py:
  - CEFR-J Vocabulary Profile 1.5   (A1-B2)
  - Octanove Vocabulary Profile 1.0 (C1-C2)

Không kết nối database, không cần mạng. Chạy lại bao nhiêu lần cũng được.

Đầu ra (thư mục --out, mặc định wordlists/):
  cefr_combined.csv   lemma,pos,level,source   <- đưa vào extract_wiktionary.py --wordlist
  cefr_conflicts.csv  các cặp (từ, từ loại) bị hai nguồn xếp cấp khác nhau (để bạn xem lại)
  cefr_skipped.csv    các mục không đưa vào được và lý do
  cefr_report.json    thống kê

Quy tắc:
  * Mỗi (từ, từ loại) chỉ giữ MỘT cấp để hiển thị: cấp THẤP NHẤT (nghĩa phổ biến nhất).
    Cấp bị loại được ghi vào cefr_conflicts.csv, không bị mất.
  * Tách biến thể gạch chéo: "analyze/analyse" thành 2 dòng cùng cấp.
  * Chuẩn hóa từ loại về tên dùng trong lex_senses (noun, verb, adjective, ...).
  * Bỏ mục viết hoa, viết tắt, ký tự đặc biệt (ghi lý do vào cefr_skipped.csv).

Ví dụ (PowerShell):
  python build_cefr_wordlist.py `
    --cefrj  wordlists\\source\\cefrj-vocabulary-profile-1.5.csv `
    --octanove wordlists\\source\\octanove-vocabulary-profile-c1c2-1.0.csv
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"]

# Từ loại trong hai file nguồn -> từ loại của lex_senses.part_of_speech
POS_NORMALIZE = {
    "noun": "noun",
    "verb": "verb",
    "adjective": "adjective",
    "adverb": "adverb",
    "pronoun": "pronoun",
    "preposition": "preposition",
    "conjunction": "conjunction",
    "determiner": "determiner",
    "interjection": "interjection",
    "number": "numeral",
    "modal auxiliary": "verb",
    "be-verb": "verb",
    "do-verb": "verb",
    "have-verb": "verb",
    "infinitive-to": "particle",
    "vern": "verb",  # lỗi gõ trong file Octanove
}

SINGLE_RE = re.compile(r"^[a-z]+(?:[-'][a-z]+)*$")
MULTI_RE = re.compile(r"^[a-z]+(?:[-'][a-z]+)*(?: [a-z][a-z'-]*)+$")

SOURCES = {
    "cefrj": "CEFR-J Vocabulary Profile 1.5",
    "octanove": "Octanove Vocabulary Profile C1/C2 1.0",
}


def read_csv(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return [{(k or "").strip(): (v or "").strip() for k, v in row.items()} for row in csv.DictReader(f)]


def main() -> None:
    p = argparse.ArgumentParser(description="Gộp CEFR-J và Octanove thành wordlist cho pipeline")
    p.add_argument("--cefrj", required=True, help="cefrj-vocabulary-profile-1.5.csv")
    p.add_argument("--octanove", required=True, help="octanove-vocabulary-profile-c1c2-1.0.csv")
    p.add_argument("--out", default="wordlists", help="Thư mục ghi kết quả")
    args = p.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    skipped: list[tuple] = []
    ratings: dict[tuple[str, str], list[tuple[str, str, str]]] = defaultdict(list)  # (lemma,pos) -> [(level, source, notes)]
    stats: Counter = Counter()

    for source, path in (("cefrj", args.cefrj), ("octanove", args.octanove)):
        rows = read_csv(Path(path))
        for row in rows:
            stats[f"rows_{source}"] += 1
            headword = row.get("headword", "")
            pos_raw = row.get("pos", "").lower()
            level = row.get("CEFR", "").upper()
            notes = row.get("notes", "")

            if level not in LEVEL_ORDER:
                skipped.append((headword, pos_raw, level, source, "cấp độ không hợp lệ"))
                continue

            if pos_raw == "":
                pos = "*"  # không rõ từ loại: áp dụng cho mọi từ loại
                stats["pos_empty_to_any"] += 1
            elif pos_raw in POS_NORMALIZE:
                pos = POS_NORMALIZE[pos_raw]
                if pos_raw != pos:
                    stats["pos_renamed"] += 1
            else:
                skipped.append((headword, pos_raw, level, source, f"từ loại lạ: {pos_raw}"))
                continue

            variants = [v.strip() for v in headword.split("/") if v.strip()]
            if len(variants) > 1:
                stats["variants_split"] += 1
            for variant in variants:
                if re.search(r"[A-Z]", variant):
                    skipped.append((variant, pos_raw, level, source, "viết hoa (danh từ riêng hoặc viết tắt)"))
                    continue
                if not (SINGLE_RE.match(variant) or MULTI_RE.match(variant)):
                    skipped.append((variant, pos_raw, level, source, "ký tự đặc biệt hoặc viết tắt"))
                    continue
                ratings[(variant, pos)].append((level, source, notes))

    combined_rows = []
    conflict_rows = []
    for (lemma, pos), items in sorted(ratings.items()):
        items_sorted = sorted(items, key=lambda x: (LEVEL_ORDER.index(x[0]), x[1]))
        win_level, win_source, _ = items_sorted[0]
        combined_rows.append((lemma, pos, win_level, win_source))
        for level, source, notes in items_sorted[1:]:
            if (level, source) != (win_level, win_source):
                conflict_rows.append((lemma, pos, win_level, win_source, level, source, notes))

    with (out / "cefr_combined.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["lemma", "pos", "level", "source"])
        w.writerows(combined_rows)

    with (out / "cefr_conflicts.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["lemma", "pos", "kept_level", "kept_source", "other_level", "other_source", "other_notes"])
        w.writerows(conflict_rows)

    with (out / "cefr_skipped.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, lineterminator="\n")
        w.writerow(["headword", "pos", "level", "source", "reason"])
        w.writerows(skipped)

    by_level = Counter(r[2] for r in combined_rows)
    by_source = Counter(r[3] for r in combined_rows)
    report = {
        "combined_rows": len(combined_rows),
        "unique_lemmas": len({r[0] for r in combined_rows}),
        "by_level": {lv: by_level.get(lv, 0) for lv in LEVEL_ORDER},
        "by_source": dict(by_source),
        "conflicts": len(conflict_rows),
        "skipped": len(skipped),
        "skipped_by_reason": dict(Counter(r[4].split(":")[0] for r in skipped)),
        "stats": dict(stats),
        "sources": SOURCES,
    }
    (out / "cefr_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"\nĐã ghi vào: {out.resolve()}")


if __name__ == "__main__":
    try:
        main()
    except FileNotFoundError as e:
        sys.exit(f"Không tìm thấy file: {e.filename}")