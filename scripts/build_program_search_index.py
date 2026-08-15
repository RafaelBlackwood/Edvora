"""Build the compact search index used by university admission filters."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CATALOG_DIR = ROOT / "public" / "data" / "program-catalog"
OUTPUT_PATH = CATALOG_DIR / "search-index.json"

SUBJECT_PATTERNS: tuple[tuple[str, str], ...] = (
    ("Agriculture and forestry", r"agricultur|forestry|forest"),
    ("Architecture and design", r"architect|design|urban planning|landscape"),
    ("Arts and creative studies", r"\barts?\b|creative|music|theatre|dance|film|visual"),
    ("Business and management", r"business|management|commerce|econom|account|finance|marketing|analytics"),
    ("Computer science and IT", r"computer|software|information science|informatics|cyber|technology"),
    ("Data science and artificial intelligence", r"data science|artificial intelligence|\bai\b|machine learning"),
    ("Education", r"education|teaching|pedagog"),
    ("Engineering", r"engineer|robotics|aerospace|mechatronic"),
    ("Environmental and earth sciences", r"environment|earth|geolog|climate|sustainab"),
    ("Health and medicine", r"medicine|medical|health|dent|nurs|pharmacy|biological|therapy|kinesiology"),
    ("Hospitality and tourism", r"hospitality|tourism"),
    ("Humanities and languages", r"humanit|language|literature|history|philosoph|classics|religio"),
    ("Law", r"\blaw\b|legal|juris"),
    ("Mathematics and statistics", r"mathemat|statistic|actuari"),
    ("Natural sciences", r"natural science|physics|chemistry|astronomy|biochemistry"),
    ("Social and behavioral sciences", r"social science|psychology|behavior|sociolog|politic|anthropolog"),
)


def degree_levels(program: dict) -> set[str]:
    text = " ".join(
        str(program.get(key) or "") for key in ("level", "degree", "name")
    ).casefold()
    levels: set[str] = set()

    if "postgraduate certificate" in text or "graduate certificate" in text:
        levels.add("Postgraduate certificate")
    elif "certificate" in text:
        levels.add("Certificate")
    if "diploma" in text:
        levels.add("Diploma")
    if "associate" in text:
        levels.add("Associate")
    if "bachelor" in text or "undergraduate" in text or re.search(r"\bb\.?s\.?\b", text):
        levels.add("Bachelor's / BS")
    if re.search(r"\b(mba|emba)\b", text):
        levels.add("MBA / EMBA")
    if "master" in text or re.search(r"\bm\.?s\.?c?\.?\b", text):
        levels.add("Master's / MS")
    if "doctor" in text or "ph.d" in text or re.search(r"\bphd\b", text):
        levels.add("Doctorate / PhD")
    if "professional" in text or re.search(
        r"\b(jd|md|do|dds|dmd|dvm|pharmd|dpt|otd)\b", text
    ):
        levels.add("Professional degree")
    if "foundation" in text or "pathway" in text:
        levels.add("Foundation / pathway")

    return levels


def subjects(program: dict) -> set[str]:
    text = " ".join(
        str(program.get(key) or "")
        for key in ("name", "subject", "school", "summary")
    ).casefold()
    return {
        subject
        for subject, pattern in SUBJECT_PATTERNS
        if re.search(pattern, text, flags=re.IGNORECASE)
    }


def delivery_modes(program: dict) -> set[str]:
    value = str(program.get("deliveryMode") or "").casefold()
    modes: set[str] = set()

    if re.search(r"online|distance|remote", value):
        modes.add("Online")
    if re.search(r"hybrid|blended", value):
        modes.add("Hybrid")
    if re.search(r"campus|residential|in.person|face.to.face", value):
        modes.add("On campus")

    return modes


def build_record(snapshot: dict) -> dict:
    programs = snapshot.get("programs") or []
    levels: set[str] = set()
    broad_subjects: set[str] = set()
    modes: set[str] = set()
    languages: set[str] = set()

    for program in programs:
        levels.update(degree_levels(program))
        broad_subjects.update(subjects(program))
        modes.update(delivery_modes(program))
        language = str(program.get("language") or "").strip()
        if language:
            languages.add(language)

    return {
        "degreeLevels": sorted(levels),
        "deliveryModes": sorted(modes),
        "institutionId": snapshot.get("institutionId") or "",
        "institutionName": snapshot.get("institutionName") or "",
        "languages": sorted(languages),
        "programCount": len(programs),
        "sourceUpdatedAt": snapshot.get("sourceUpdatedAt") or "",
        "subjects": sorted(broad_subjects),
    }


def main() -> None:
    records = []

    for path in sorted(CATALOG_DIR.glob("*.json")):
        if path.name == OUTPUT_PATH.name:
            continue
        snapshot = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(snapshot, dict) or not isinstance(snapshot.get("programs"), list):
            continue
        record = build_record(snapshot)
        if record["institutionId"] and record["programCount"]:
            records.append(record)

    records.sort(key=lambda item: item["institutionName"].casefold())
    source_dates = [record["sourceUpdatedAt"] for record in records if record["sourceUpdatedAt"]]
    payload = {
        "generatedFrom": "Official university program snapshots",
        "institutionCount": len(records),
        "programCount": sum(record["programCount"] for record in records),
        "records": records,
        "sourceUpdatedAt": max(source_dates, default=""),
        "version": 1,
    }
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Indexed {payload['programCount']:,} programs across "
        f"{payload['institutionCount']} institutions."
    )


if __name__ == "__main__":
    main()
