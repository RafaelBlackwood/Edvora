"""Build the compact search index used by university admission filters."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CATALOG_DIR = ROOT / "public" / "data" / "program-catalog"
OUTPUT_PATH = CATALOG_DIR / "search-index.json"
IPEDS_INDEX_PATH = CATALOG_DIR / "ipeds-search-index.json"

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

GRADUATE_LEVELS = {
    "Master's / MS",
    "MBA / EMBA",
    "Doctorate / PhD",
    "Professional degree",
    "Postgraduate certificate",
}


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


def requirement_statements(group: dict) -> list[str]:
    statements = []
    for document in group.get("documents") or []:
        if document:
            statements.append(f"Required document: {document}")
    for fact in group.get("facts") or []:
        label = str(fact.get("label") or "").strip()
        value = str(fact.get("value") or "").strip()
        value_names_a_policy = re.search(
            r"\b(?:gre|gmat|portfolio)\b|\bsat\s*(?:/|or)\s*act\b",
            value,
            flags=re.IGNORECASE,
        )
        statement = value if value_names_a_policy else ": ".join(
            part for part in (label, value) if part
        )
        if statement:
            statements.append(statement)
    return statements


def classify_named_test(statement: str, test_name: str) -> set[str]:
    text = re.sub(r"\s+", " ", statement.casefold())
    token = rf"\b{re.escape(test_name.casefold())}\b"
    if not re.search(token, text):
        return set()

    label = test_name.upper()
    if re.search(
        rf"(?:{token}.{{0,60}}\bnot required\b|\bnot required\b.{{0,60}}{token})",
        text,
    ):
        return {f"{label} not required"}
    if re.search(
        r"\brequired only when\b|\bif required\b|\bwhen required\b|"
        r"\bvar(?:y|ies)\b|\bdepend(?:s|ing)?\b",
        text,
    ):
        return {f"{label} varies by program"}
    if re.search(r"\boptional\b|\brecommend(?:ed|ation)?\b|\bone of\b|\beither\b", text):
        return {f"{label} optional or accepted"}
    if re.search(
        rf"(?:{token}.{{0,40}}\brequired\b|\brequired\b.{{0,40}}{token})",
        text,
    ):
        return {f"{label} required"}
    return set()


def classify_test_policies(group: dict) -> set[str]:
    policies: set[str] = set()
    for statement in requirement_statements(group):
        text = re.sub(r"\s+", " ", statement.casefold())
        policies.update(classify_named_test(statement, "gre"))
        policies.update(classify_named_test(statement, "gmat"))

        if re.search(r"\bsat\s*(?:/|or)\s*act\b", text):
            if "test blind" in text or "not considered" in text:
                policies.add("SAT or ACT not considered")
            elif "test optional" in text or "not required" in text:
                policies.add("Test optional")
            elif re.search(r"\brequired\b|\bat least one\b", text):
                policies.add("SAT or ACT required")

        if "portfolio" in text:
            if re.search(r"\bif required\b|\bwhen required\b|\bvar(?:y|ies)\b", text):
                policies.add("Portfolio / competency evidence varies by program")
            elif "not considered" in text:
                policies.add("Portfolio / competency evidence not considered")
            elif re.search(r"\bnot required\b|\boptional\b|\brecommended\b", text):
                policies.add("Portfolio / competency evidence optional")
            elif re.search(r"\brequired\b|\bmust\b", text):
                policies.add("Portfolio / competency evidence required")
    return policies


def requirement_group_levels(group: dict, available_levels: set[str]) -> set[str]:
    levels = degree_levels(
        {
            "degree": group.get("title"),
            "level": group.get("level"),
            "name": group.get("title"),
        }
    )
    level_text = str(group.get("level") or "").casefold()
    if "graduate" in level_text and not levels:
        levels.update(available_levels.intersection(GRADUATE_LEVELS))
    if not levels:
        levels.update(available_levels)
    return levels.intersection(available_levels)


def build_record(snapshot: dict) -> dict:
    programs = snapshot.get("programs") or []
    levels: set[str] = set()
    broad_subjects: set[str] = set()
    modes: set[str] = set()
    languages: set[str] = set()
    subjects_by_degree_level: dict[str, set[str]] = {}
    program_counts_by_degree_level: dict[str, int] = {}

    for program in programs:
        program_levels = degree_levels(program)
        program_subjects = subjects(program)
        levels.update(program_levels)
        broad_subjects.update(program_subjects)
        modes.update(delivery_modes(program))
        for level in program_levels:
            subjects_by_degree_level.setdefault(level, set()).update(program_subjects)
            program_counts_by_degree_level[level] = (
                program_counts_by_degree_level.get(level, 0) + 1
            )
        language = str(program.get("language") or "").strip()
        if language:
            languages.add(language)

    test_policies_by_degree_level: dict[str, set[str]] = {}
    for group in snapshot.get("requirementGroups") or []:
        policies = classify_test_policies(group)
        if not policies:
            continue
        for level in requirement_group_levels(group, levels):
            test_policies_by_degree_level.setdefault(level, set()).update(policies)

    return {
        "degreeLevels": sorted(levels),
        "deliveryModes": sorted(modes),
        "institutionId": snapshot.get("institutionId") or "",
        "institutionName": snapshot.get("institutionName") or "",
        "institutionTypes": [],
        "languages": sorted(languages),
        "officialProgramCount": len(programs),
        "programCount": len(programs),
        "programCountsByDegreeLevel": dict(sorted(program_counts_by_degree_level.items())),
        "sourceKinds": ["official-university-catalog"],
        "sourceUpdatedAt": snapshot.get("sourceUpdatedAt") or "",
        "subjects": sorted(broad_subjects),
        "subjectsByDegreeLevel": {
            level: sorted(level_subjects)
            for level, level_subjects in sorted(subjects_by_degree_level.items())
        },
        "testPoliciesByDegreeLevel": {
            level: sorted(policies)
            for level, policies in sorted(test_policies_by_degree_level.items())
        },
    }


def test_policy_family(policy: str) -> str:
    if policy.startswith("GRE "):
        return "gre"
    if policy.startswith("GMAT "):
        return "gmat"
    if policy.startswith("SAT or ACT ") or policy == "Test optional":
        return "sat-act"
    if policy.startswith("Portfolio / competency evidence "):
        return "portfolio"
    return policy


def merge_records(first: dict, second: dict) -> dict:
    merged = {**first}
    for field in (
        "degreeLevels",
        "deliveryModes",
        "institutionTypes",
        "languages",
        "sourceKinds",
        "subjects",
    ):
        merged[field] = sorted(set(first.get(field) or []).union(second.get(field) or []))

    subject_map: dict[str, set[str]] = {}
    for source in (first, second):
        for level, level_subjects in (source.get("subjectsByDegreeLevel") or {}).items():
            subject_map.setdefault(level, set()).update(level_subjects)
    merged["subjectsByDegreeLevel"] = {
        level: sorted(level_subjects)
        for level, level_subjects in sorted(subject_map.items())
    }

    first_policy_map = first.get("testPoliciesByDegreeLevel") or {}
    second_policy_map = second.get("testPoliciesByDegreeLevel") or {}
    first_is_official = "official-university-catalog" in (first.get("sourceKinds") or [])
    second_is_official = "official-university-catalog" in (second.get("sourceKinds") or [])
    policy_map: dict[str, set[str]] = {}
    for level in set(first_policy_map).union(second_policy_map):
        first_policies = set(first_policy_map.get(level) or [])
        second_policies = set(second_policy_map.get(level) or [])
        families = {
            test_policy_family(policy)
            for policy in first_policies.union(second_policies)
        }
        for family in families:
            first_family = {
                policy
                for policy in first_policies
                if test_policy_family(policy) == family
            }
            second_family = {
                policy
                for policy in second_policies
                if test_policy_family(policy) == family
            }
            if first_is_official and first_family:
                selected = first_family
            elif second_is_official and second_family:
                selected = second_family
            else:
                selected = first_family.union(second_family)
            policy_map.setdefault(level, set()).update(selected)
    merged["testPoliciesByDegreeLevel"] = {
        level: sorted(policies)
        for level, policies in sorted(policy_map.items())
    }

    count_map: dict[str, int] = {}
    for source in (first, second):
        for level, count in (source.get("programCountsByDegreeLevel") or {}).items():
            count_map[level] = max(count_map.get(level, 0), int(count or 0))
    merged["programCountsByDegreeLevel"] = dict(sorted(count_map.items()))

    for field in (
        "admissionsYear",
        "ipedsProgramCount",
        "ipedsUnitIds",
        "ipedsYear",
        "matchMethods",
        "officialProgramCount",
    ):
        if second.get(field) is not None:
            merged[field] = second[field]
        elif first.get(field) is not None:
            merged[field] = first[field]

    merged["sourceUpdatedAt"] = max(
        str(first.get("sourceUpdatedAt") or ""),
        str(second.get("sourceUpdatedAt") or ""),
    )
    merged["programCount"] = (
        merged.get("officialProgramCount")
        or merged.get("ipedsProgramCount")
        or max(int(first.get("programCount") or 0), int(second.get("programCount") or 0))
    )
    return merged


def main() -> None:
    records_by_id: dict[str, dict] = {}

    for path in sorted(CATALOG_DIR.glob("*.json")):
        if path.name in {OUTPUT_PATH.name, IPEDS_INDEX_PATH.name}:
            continue
        snapshot = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(snapshot, dict) or not isinstance(snapshot.get("programs"), list):
            continue
        record = build_record(snapshot)
        if record["institutionId"] and record["programCount"]:
            records_by_id[record["institutionId"]] = record

    ipeds_payload = None
    if IPEDS_INDEX_PATH.exists():
        ipeds_payload = json.loads(IPEDS_INDEX_PATH.read_text(encoding="utf-8"))
        for record in ipeds_payload.get("records") or []:
            identifier = record.get("institutionId") or ""
            if not identifier:
                continue
            existing = records_by_id.get(identifier)
            records_by_id[identifier] = (
                merge_records(existing, record) if existing else record
            )

    records = list(records_by_id.values())
    records.sort(key=lambda item: item["institutionName"].casefold())
    source_dates = [record["sourceUpdatedAt"] for record in records if record["sourceUpdatedAt"]]
    source_names = ["Official university program catalogs"]
    if ipeds_payload:
        source = ipeds_payload.get("source") or {}
        source_names.append(f"{source.get('provider') or 'NCES/IPEDS'} {source.get('year') or ''}".strip())

    payload = {
        "generatedFrom": "Official university catalogs and NCES/IPEDS program offerings",
        "institutionCount": len(records),
        "programCount": sum(record["programCount"] for record in records),
        "records": records,
        "sourceUpdatedAt": max(source_dates, default=""),
        "sources": source_names,
        "version": 3,
    }
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    print(
        f"Indexed {payload['programCount']:,} programs across "
        f"{payload['institutionCount']:,} institutions."
    )


if __name__ == "__main__":
    main()
