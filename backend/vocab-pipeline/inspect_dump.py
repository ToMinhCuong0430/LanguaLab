#!/usr/bin/env python3
"""
Xem nhanh cấu trúc file JSONL của Wiktionary TRƯỚC khi trích xuất.
Cho biết: ngôn ngữ nào có trong file, từ loại, các khóa (field) thật sự xuất hiện,
và in ra một mục từ mẫu. Dùng để kiểm tra chương trình trích xuất khớp với file của bạn.

  python inspect_dump.py --input D:\\data\\kaikki-english.jsonl
  python inspect_dump.py --input D:\\data\\kaikki-english.jsonl --word run
"""
import argparse
import json
from collections import Counter
from pathlib import Path


def compact(d: dict) -> dict:
    """Bản thu gọn của một mục từ: bỏ phần từ nguyên/khuôn mẫu rất dài, chỉ giữ phần chương trình dùng."""
    out = {
        "word": d.get("word"),
        "lang_code": d.get("lang_code"),
        "pos": d.get("pos"),
        "TOP_LEVEL_KEYS": sorted(d.keys()),
    }
    senses = d.get("senses") or []
    out["senses_count"] = len(senses)
    out["senses_first3"] = []
    for s in senses[:3]:
        item = {k: s[k] for k in ("glosses", "tags", "form_of", "alt_of", "synonyms", "antonyms") if k in s}
        item["SENSE_KEYS"] = sorted(s.keys())
        exs = s.get("examples") or []
        item["examples_first2"] = exs[:2]
        out["senses_first3"].append(item)
    out["sounds_first4"] = (d.get("sounds") or [])[:4]
    out["forms_first6"] = (d.get("forms") or [])[:6]
    tr = d.get("translations") or []
    out["translations_total"] = len(tr)
    out["translations_vi_first4"] = [t for t in tr if (t.get("code") or t.get("lang_code")) == "vi"][:4]
    out["translations_first2_any"] = tr[:2]
    out["categories_first5"] = (d.get("categories") or [])[:5]
    return out


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--limit", type=int, default=30000, help="Số dòng đầu để thống kê (mặc định 30000)")
    p.add_argument("--word", help="In toàn bộ các dòng của một từ (tìm trong --max-scan dòng đầu)")
    p.add_argument("--raw", action="store_true", help="Với --word: in toàn bộ dữ liệu gốc (rất dài, gồm từ nguyên)")
    p.add_argument("--max-scan", type=int, default=3000000, help="Số dòng tối đa khi tìm --word")
    args = p.parse_args()

    path = Path(args.input)
    if not path.is_file():
        raise SystemExit(f"Không tìm thấy file: {path}")
    print(f"File: {path} ({path.stat().st_size / 1e9:.2f} GB)")

    if args.word:
        found = 0
        with path.open("rb") as f:
            for i, raw in enumerate(f, 1):
                if i > args.max_scan:
                    break
                if args.word.encode() not in raw:
                    continue
                data = json.loads(raw)
                if data.get("word") == args.word and data.get("lang_code") == "en":
                    found += 1
                    if args.raw:
                        print(json.dumps(data, ensure_ascii=False, indent=2)[:20000])
                    else:
                        print(json.dumps(compact(data), ensure_ascii=False, indent=2))
                    print("-" * 60)
        if not found:
            print("Không tìm thấy (thử tăng --max-scan).")
        return

    langs, pos, keys, sense_keys = Counter(), Counter(), Counter(), Counter()
    sample = None
    n = 0
    with path.open("rb") as f:
        for raw in f:
            n += 1
            if n > args.limit:
                break
            try:
                d = json.loads(raw)
            except json.JSONDecodeError:
                continue
            langs[d.get("lang_code")] += 1
            if d.get("lang_code") == "en":
                pos[d.get("pos")] += 1
                keys.update(d.keys())
                for s in d.get("senses", []) or []:
                    sense_keys.update(s.keys())
                if sample is None and d.get("senses") and d.get("sounds") and d.get("forms"):
                    sample = d
    print(f"\nĐã đọc {n - 1:,} dòng đầu.")
    print("Ngôn ngữ (top 8):", langs.most_common(8))
    print("Từ loại tiếng Anh (top 15):", pos.most_common(15))
    print("\nCác khóa cấp mục từ (tiếng Anh):")
    for k, v in keys.most_common():
        print(f"  {k:<20} {v:>8,}")
    print("\nCác khóa cấp nghĩa:")
    for k, v in sense_keys.most_common():
        print(f"  {k:<20} {v:>8,}")
    if sample:
        print("\nMột mục từ mẫu (cắt ngắn):")
        print(json.dumps(sample, ensure_ascii=False, indent=2)[:3500])


if __name__ == "__main__":
    main()