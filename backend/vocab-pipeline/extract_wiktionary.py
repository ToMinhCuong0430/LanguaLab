#!/usr/bin/env python3
"""
Trích xuất từ vựng tiếng Anh từ file JSONL của Wiktionary (định dạng wiktextract / Kaikki)
thành các file CSV khớp với schema lex_* của LanguaLab.

- KHÔNG kết nối database. Chỉ đọc file đầu vào và ghi CSV (bước 1 trong pipeline).
- Đọc file theo từng dòng (streaming), dùng bộ nhớ thấp dù file 3 GB trở lên.
- Bắt buộc chọn phạm vi: --wordlist (danh sách từ cần lấy) HOẶC --limit-entries (chạy thử).
  Wordlist có cột: lemma,pos,level,source (xem build_cefr_wordlist.py). Cấp độ chỉ gắn cho NGHĨA ĐẦU TIÊN
  của từng từ loại (nghĩa phổ biến nhất); các nghĩa sau để trống, không đoán.
  Cố ý KHÔNG cho trích xuất toàn bộ hàng trăm nghìn mục từ.

Ví dụ:
  python extract_wiktionary.py --input D:\\data\\kaikki-english.jsonl --limit-entries 500
  python extract_wiktionary.py --input D:\\data\\kaikki-english.jsonl --wordlist wordlists\\cefrj.csv
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
from collections import Counter
from pathlib import Path

# ---------------------------------------------------------------------------
# Quy tắc chuyển đổi (chỉnh ở đây nếu cần)
# ---------------------------------------------------------------------------

# Từ loại của wiktextract -> từ loại trong lex_senses.part_of_speech
POS_MAP = {
    "noun": "noun",
    "verb": "verb",
    "adj": "adjective",
    "adv": "adverb",
    "pron": "pronoun",
    "prep": "preposition",
    "conj": "conjunction",
    "intj": "interjection",
    "det": "determiner",
    "article": "determiner",
    "num": "numeral",
    "particle": "particle",
    "phrase": "phrase",
}
# Các từ loại bị bỏ qua mặc định: name (danh từ riêng), prefix, suffix, symbol, contraction...

# Nghĩa mang các thẻ này bị bỏ (không hợp để dạy)
SKIP_SENSE_TAGS = {"form-of", "alt-of", "misspelling", "obsolete", "archaic", "nonstandard", "no-gloss"}
SENSITIVE_TAGS = {"vulgar", "offensive", "derogatory", "slur", "ethnic-slur"}  # bỏ, trừ khi --keep-sensitive

LEVEL_SYSTEM = "cefr"
CEFR_LEVELS = {"A1", "A2", "B1", "B2", "C1", "C2"}

SINGLE_WORD_RE = re.compile(r"^[a-z]+(?:[-'][a-z]+)*$")
MULTI_WORD_RE = re.compile(r"^[a-z]+(?:[-'][a-z]+)*(?: [a-z][a-z'-]*)+$")
VI_CODES = {"vi"}

CSV_FILES = {
    "entries": ["entry_key", "lemma", "entry_type"],
    "senses": ["entry_key", "sense_order", "pos", "definition", "level_system", "level"],
    "forms": ["entry_key", "form", "form_type"],
    "pronunciations": ["entry_key", "kind", "accent", "transcription", "audio_url"],
    "examples": ["entry_key", "sense_order", "sentence"],
    "translations": ["entry_key", "sense_order", "language_code", "translated_text", "note"],
    "relations": ["entry_key", "sense_order", "relation_type", "target_text"],
    # Cấp độ theo từng nguồn (CEFR-J, Octanove...). Chỉ có dòng khi dùng --wordlist có cột source
    "sense_levels": ["entry_key", "sense_order", "source_code", "level_system", "level"],
}


# ---------------------------------------------------------------------------
# Hàm tiện ích
# ---------------------------------------------------------------------------

def norm(text: str) -> str:
    """Chuẩn hóa chuỗi để so khớp: chữ thường, bỏ dấu câu, gộp khoảng trắng."""
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", text.lower())).strip()


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def category_names(obj: dict) -> list[str]:
    out = []
    for c in obj.get("categories", []) or []:
        if isinstance(c, dict):
            name = c.get("name")
            if name:
                out.append(name)
        elif isinstance(c, str):
            out.append(c)
    return out


def classify_accent(tags: list[str]) -> str:
    t = {x.lower() for x in tags}
    if t & {"us", "general-american", "american"}:
        return "en-US"
    if t & {"uk", "received-pronunciation", "british"}:
        return "en-GB"
    return "general"


def map_form_type(tags: list[str]) -> str | None:
    t = set(tags)
    if t & {"table-tags", "inflection-template", "class", "romanization"}:
        return None
    if "plural" in t:
        return "plural"
    if "participle" in t and "past" in t:
        return "past_participle"
    if "participle" in t and "present" in t:
        return "present_participle"
    if "past" in t:
        return "past"
    if "third-person" in t and "singular" in t:
        return "third_person"
    if "comparative" in t:
        return "comparative"
    if "superlative" in t:
        return "superlative"
    return None  # dạng khác: bỏ để dữ liệu sạch


def load_wordlist(path: Path) -> dict[str, dict[str, tuple[str, str]]]:
    """
    CSV có header: lemma,pos,level,source  (pos có thể để trống hoặc '*' = áp dụng mọi từ loại;
    level và source có thể để trống). Trả về {lemma: {pos|'*': (level, source)}}.
    """
    result: dict[str, dict[str, tuple[str, str]]] = {}
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames or "lemma" not in [h.strip().lower() for h in reader.fieldnames]:
            sys.exit(f"Wordlist {path} phải có cột 'lemma' (và tùy chọn 'pos', 'level', 'source').")
        for row in reader:
            row = {k.strip().lower(): (v or "").strip() for k, v in row.items() if k}
            lemma = row.get("lemma", "").lower()
            if not lemma:
                continue
            pos_raw = row.get("pos", "").lower()
            pos = "*" if pos_raw in ("", "*") else POS_MAP.get(pos_raw, pos_raw)
            level = row.get("level", "").upper()
            if level and level not in CEFR_LEVELS:
                sys.exit(f"Cấp độ '{level}' của từ '{lemma}' không hợp lệ (phải là A1..C2).")
            source = row.get("source", "").lower()
            if source and not re.fullmatch(r"[a-z0-9_-]+", source):
                sys.exit(f"Nguồn '{source}' của từ '{lemma}' không hợp lệ (chỉ chữ thường, số, '-' và '_').")
            result.setdefault(lemma, {})[pos] = (level, source)
    return result


# ---------------------------------------------------------------------------
# Trích xuất
# ---------------------------------------------------------------------------

def new_record(lemma: str, entry_type: str) -> dict:
    return {
        "lemma": lemma,
        "entry_type": entry_type,
        "senses": [],          # list of dict(pos, definition, level, examples, relations, translations)
        "seen_senses": set(),  # (pos, definition lower)
        "forms": set(),
        "pron": {},            # accent -> (ipa, audio)
        "relations": set(),    # (relation_type, target)
        "levelled_pos": set(), # các từ loại đã gắn cấp độ (chỉ nghĩa đầu tiên của mỗi từ loại)
    }


def process_line(data: dict, args, wordlist, records: dict, stats: Counter, unmatched: list, matched: set) -> None:
    lemma = (data.get("word") or "").strip()
    pos_raw = (data.get("pos") or "").strip().lower()

    if pos_raw not in POS_MAP:
        stats["skip_pos"] += 1
        return
    pos = POS_MAP[pos_raw]

    cats = category_names(data)
    if SINGLE_WORD_RE.match(lemma):
        entry_type = "word"
    elif args.include_multiword and MULTI_WORD_RE.match(lemma):
        if "English phrasal verbs" in cats:
            entry_type = "phrasal_verb"
        elif "English idioms" in cats:
            entry_type = "idiom"
        else:
            entry_type = "phrase"
    else:
        stats["skip_word_shape"] += 1
        return

    level = ""
    level_source = ""
    wl_key = ""
    if wordlist is not None:
        entry_levels = wordlist.get(lemma)
        if entry_levels is None:
            stats["skip_not_in_wordlist"] += 1
            return
        if pos in entry_levels:
            level, level_source = entry_levels[pos]
            wl_key = pos
        elif "*" in entry_levels:
            level, level_source = entry_levels["*"]
            wl_key = "*"
        else:
            stats["skip_pos_not_in_wordlist"] += 1
            return

    key = f"{entry_type}:{lemma.lower()}"
    rec = records.get(key)
    if rec is None:
        rec = new_record(lemma, entry_type)

    new_senses = []
    for sense in data.get("senses", []) or []:
        tags = {t.lower() for t in (sense.get("tags") or [])}
        if "form_of" in sense or "alt_of" in sense or (tags & SKIP_SENSE_TAGS):
            stats["skip_sense_tag"] += 1
            continue
        if not args.keep_sensitive and (tags & SENSITIVE_TAGS):
            stats["skip_sense_sensitive"] += 1
            continue
        glosses = [clean(g) for g in (sense.get("glosses") or []) if g and g.strip()]
        if not glosses:
            stats["skip_sense_no_gloss"] += 1
            continue
        definition = glosses[-1]
        if len(definition) > args.max_gloss_len or definition.lower().startswith("(please"):
            stats["skip_sense_gloss_len"] += 1
            continue
        sig = (pos, definition.lower())
        if sig in rec["seen_senses"]:
            stats["skip_sense_duplicate"] += 1
            continue
        if len(rec["senses"]) + len(new_senses) >= args.max_senses:
            stats["skip_sense_over_limit"] += 1
            continue

        examples = []
        for ex in sense.get("examples", []) or []:
            text = clean(ex.get("text") or "")
            if not text or ex.get("type") == "quotation":
                continue
            if not (15 <= len(text) <= args.max_example_len):
                continue
            examples.append(text)
            if len(examples) >= args.max_examples:
                break

        relations = []
        for rel_type, field in (("synonym", "synonyms"), ("antonym", "antonyms")):
            for item in (sense.get(field) or [])[:8]:
                target = (item.get("word") or "").strip().lower() if isinstance(item, dict) else ""
                if target and SINGLE_WORD_RE.match(target) and target != lemma.lower():
                    relations.append((rel_type, target))

        new_senses.append({
            "pos": pos,
            "definition": definition,
            "level": "",
            "level_source": "",
            "glosses_norm": {norm(g) for g in glosses},
            "examples": examples,
            "relations": relations,
            "translations": [],
        })

    if not new_senses:
        stats["skip_entry_no_usable_sense"] += 1
        return

    # Phát âm (IPA). Âm thanh chỉ lấy khi bật --with-audio-urls
    for sound in data.get("sounds", []) or []:
        ipa = (sound.get("ipa") or "").strip()
        accent = classify_accent(sound.get("tags") or [])
        audio = ""
        if args.with_audio_urls:
            audio = (sound.get("mp3_url") or sound.get("ogg_url") or "").strip()
        if not ipa and not audio:
            continue
        if ipa and not (ipa.startswith("/") or ipa.startswith("[")):
            continue
        if len(ipa) > 100:
            continue
        existing = rec["pron"].get(accent)
        if existing is None or (not existing[0] and ipa) or (not existing[1] and audio):
            rec["pron"][accent] = (ipa or (existing[0] if existing else ""), audio or (existing[1] if existing else ""))

    # Dạng từ
    for form in data.get("forms", []) or []:
        text = (form.get("form") or "").strip()
        form_type = map_form_type(form.get("tags") or [])
        if not text or form_type is None or text in ("-", lemma) or " " in text or text.startswith("no-"):
            continue
        rec["forms"].add((text, form_type))

    # Quan hệ cấp mục từ
    for rel_type, field in (("synonym", "synonyms"), ("antonym", "antonyms")):
        for item in (data.get(field) or [])[:8]:
            target = (item.get("word") or "").strip().lower() if isinstance(item, dict) else ""
            if target and SINGLE_WORD_RE.match(target) and target != lemma.lower():
                rec["relations"].add((rel_type, target))

    # Bản dịch tiếng Việt: chỉ gắn khi khớp ĐÚNG câu giải nghĩa; không khớp thì đưa vào báo cáo, không đoán
    for tr in data.get("translations", []) or []:
        code = (tr.get("code") or tr.get("lang_code") or "").lower()
        word = clean(tr.get("word") or "")
        if code not in VI_CODES or not word:
            continue
        tr_sense = norm(tr.get("sense") or "")
        target_sense = None
        if tr_sense:
            for s in new_senses:
                if tr_sense in s["glosses_norm"]:
                    target_sense = s
                    break
        if target_sense is None:
            stats["translations_unmatched"] += 1
            if len(unmatched) < 5000:
                unmatched.append((lemma, pos, tr.get("sense") or "", word))
            continue
        target_sense["translations"].append(word)
        stats["translations_matched"] += 1

    # Cấp độ chỉ gắn cho nghĩa ĐẦU TIÊN của từ loại này (nghĩa phổ biến nhất); không đoán cho nghĩa sau
    if wordlist is not None and pos not in rec["levelled_pos"]:
        if level:
            new_senses[0]["level"] = level
            new_senses[0]["level_source"] = level_source
            stats["senses_levelled"] += 1
        rec["levelled_pos"].add(pos)
        matched.add((lemma.lower(), wl_key))
    rec["senses"].extend(new_senses)
    for s in new_senses:
        rec["seen_senses"].add((s["pos"], s["definition"].lower()))
    records[key] = rec
    stats["lines_used"] += 1


def run(args) -> None:
    input_path = Path(args.input)
    if not input_path.is_file():
        sys.exit(f"Không tìm thấy file: {input_path}")
    if not args.wordlist and not args.limit_entries:
        sys.exit("Phải chọn phạm vi: --wordlist FILE.csv hoặc --limit-entries N (ví dụ 500).")

    wordlist = load_wordlist(Path(args.wordlist)) if args.wordlist else None
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    records: dict[str, dict] = {}
    stats: Counter = Counter()
    unmatched: list = []
    matched: set = set()
    started = time.time()
    last_key_lemma = None
    limit_reached = False

    with input_path.open("rb") as f:
        for line_no, raw in enumerate(f, 1):
            if line_no % 200000 == 0:
                print(f"  ... {line_no:,} dòng, {len(records):,} mục từ, {time.time() - started:.0f}s", file=sys.stderr)
            if args.max_lines and line_no > args.max_lines:
                break
            # Lọc nhanh bằng chuỗi trước khi parse JSON (tiết kiệm rất nhiều thời gian)
            if b'"lang_code": "en"' not in raw and b'"lang_code":"en"' not in raw:
                continue
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                stats["bad_json"] += 1
                continue
            if data.get("lang_code") != "en":
                continue
            stats["lines_en"] += 1

            lemma = (data.get("word") or "").strip()
            if limit_reached and lemma != last_key_lemma:
                break  # các dòng của cùng một từ nằm liền nhau; sang từ mới thì dừng
            before = len(records)
            process_line(data, args, wordlist, records, stats, unmatched, matched)
            if len(records) > before:
                last_key_lemma = lemma
            if args.limit_entries and len(records) >= args.limit_entries:
                limit_reached = True
                last_key_lemma = lemma if lemma else last_key_lemma

    # Ghi CSV
    writers = {}
    handles = []
    for name, cols in CSV_FILES.items():
        fh = (out_dir / f"{name}.csv").open("w", encoding="utf-8", newline="")
        handles.append(fh)
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(cols)
        writers[name] = w

    n_pron = n_forms = n_examples = n_trans = n_rel = n_senses = 0
    for key in sorted(records):
        rec = records[key]
        writers["entries"].writerow([key, rec["lemma"], rec["entry_type"]])
        for order, s in enumerate(rec["senses"], 1):
            n_senses += 1
            writers["senses"].writerow([key, order, s["pos"], s["definition"], LEVEL_SYSTEM if s["level"] else "", s["level"]])
            if s["level"] and s["level_source"]:
                writers["sense_levels"].writerow([key, order, s["level_source"], LEVEL_SYSTEM, s["level"]])
            for text in s["examples"]:
                n_examples += 1
                writers["examples"].writerow([key, order, text])
            for tword in dict.fromkeys(s["translations"]):
                n_trans += 1
                writers["translations"].writerow([key, order, "vi", tword, "Wiktionary"])
            for rel_type, target in dict.fromkeys(s["relations"]):
                n_rel += 1
                writers["relations"].writerow([key, order, rel_type, target])
        for text, ftype in sorted(rec["forms"]):
            n_forms += 1
            writers["forms"].writerow([key, text, ftype])
        for accent, (ipa, audio) in sorted(rec["pron"].items()):
            n_pron += 1
            writers["pronunciations"].writerow([key, "ipa", accent, ipa, audio])
        for rel_type, target in sorted(rec["relations"]):
            n_rel += 1
            writers["relations"].writerow([key, "", rel_type, target])
    for fh in handles:
        fh.close()

    if unmatched:
        with (out_dir / "unmatched_translations.csv").open("w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh, lineterminator="\n")
            w.writerow(["lemma", "pos", "wiktionary_sense", "vi_translation"])
            w.writerows(unmatched)

    report = {
        "input": str(input_path),
        "elapsed_seconds": round(time.time() - started, 1),
        "entries": len(records),
        "senses": n_senses,
        "forms": n_forms,
        "pronunciations": n_pron,
        "examples": n_examples,
        "translations_vi": n_trans,
        "relations": n_rel,
        "entries_without_ipa": sum(1 for r in records.values() if not r["pron"]),
        "counters": dict(stats),
    }
    (out_dir / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"\nĐã ghi CSV vào: {out_dir.resolve()}")
    if wordlist is not None:
        # Các dòng trong wordlist không gắn được vào dữ liệu nào (không có trong Wiktionary, hoặc sai từ loại)
        rows_unmatched = []
        for lemma, by_pos in sorted(wordlist.items()):
            for wl_pos, (lv, src) in sorted(by_pos.items()):
                if (lemma, wl_pos) not in matched:
                    rows_unmatched.append((lemma, wl_pos, lv, src))
        with (out_dir / "wordlist_unmatched.csv").open("w", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh, lineterminator="\n")
            w.writerow(["lemma", "pos", "level", "source"])
            w.writerows(rows_unmatched)
        total_rows = sum(len(v) for v in wordlist.values())
        print(f"Wordlist: {total_rows - len(rows_unmatched):,}/{total_rows:,} dòng đã gắn được cấp độ; "
              f"{len(rows_unmatched):,} dòng không khớp (xem wordlist_unmatched.csv)")


def main() -> None:
    p = argparse.ArgumentParser(description="Trích xuất Wiktionary JSONL -> CSV cho kho từ vựng LanguaLab")
    p.add_argument("--input", required=True, help="Đường dẫn file JSONL của Wiktionary")
    p.add_argument("--out", default="datasets/processed", help="Thư mục ghi CSV")
    p.add_argument("--wordlist", help="CSV có cột lemma[,pos,level,source]: chỉ lấy các từ này và gắn cấp độ CEFR")
    p.add_argument("--limit-entries", type=int, help="Chạy thử: dừng sau N mục từ")
    p.add_argument("--max-lines", type=int, help="Chỉ đọc N dòng đầu của file (để thử nhanh)")
    p.add_argument("--max-senses", type=int, default=6, help="Số nghĩa tối đa mỗi mục từ (mặc định 6)")
    p.add_argument("--max-examples", type=int, default=2, help="Số ví dụ tối đa mỗi nghĩa (mặc định 2)")
    p.add_argument("--max-gloss-len", type=int, default=300)
    p.add_argument("--max-example-len", type=int, default=220)
    p.add_argument("--include-multiword", action="store_true", help="Lấy cả cụm từ (phrasal verb, idiom, phrase)")
    p.add_argument("--keep-sensitive", action="store_true", help="Giữ nghĩa thô tục/xúc phạm (mặc định bỏ)")
    p.add_argument("--with-audio-urls", action="store_true", help="Ghi URL audio (mặc định chỉ lấy IPA)")
    run(p.parse_args())


if __name__ == "__main__":
    main()