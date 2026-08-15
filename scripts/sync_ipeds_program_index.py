#!/usr/bin/env python3
"""Build the U.S. degree-offering search index from the latest NCES/IPEDS files."""

from __future__ import annotations

import csv
import io
import json
import re
import tempfile
import unicodedata
import urllib.parse
import urllib.error
import urllib.request
import zipfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ROR_US_PATH = ROOT / "public" / "data" / "university-catalog" / "US.json"
OUTPUT_PATH = ROOT / "public" / "data" / "program-catalog" / "ipeds-search-index.json"
DATA_FILES_URL = "https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx"
COMPLETE_DATA_BASE_URL = "https://nces.ed.gov/ipeds/complete-data-files/"
USER_AGENT = "Edvora-University-Catalog/1.0 (https://github.com/RafaelBlackwood/Edvora)"

STATE_CODES = {
    "alabama": "AL",
    "alaska": "AK",
    "arizona": "AZ",
    "arkansas": "AR",
    "california": "CA",
    "colorado": "CO",
    "connecticut": "CT",
    "delaware": "DE",
    "district of columbia": "DC",
    "florida": "FL",
    "georgia": "GA",
    "hawaii": "HI",
    "idaho": "ID",
    "illinois": "IL",
    "indiana": "IN",
    "iowa": "IA",
    "kansas": "KS",
    "kentucky": "KY",
    "louisiana": "LA",
    "maine": "ME",
    "maryland": "MD",
    "massachusetts": "MA",
    "michigan": "MI",
    "minnesota": "MN",
    "mississippi": "MS",
    "missouri": "MO",
    "montana": "MT",
    "nebraska": "NE",
    "nevada": "NV",
    "new hampshire": "NH",
    "new jersey": "NJ",
    "new mexico": "NM",
    "new york": "NY",
    "north carolina": "NC",
    "north dakota": "ND",
    "ohio": "OH",
    "oklahoma": "OK",
    "oregon": "OR",
    "pennsylvania": "PA",
    "rhode island": "RI",
    "south carolina": "SC",
    "south dakota": "SD",
    "tennessee": "TN",
    "texas": "TX",
    "utah": "UT",
    "vermont": "VT",
    "virginia": "VA",
    "washington": "WA",
    "west virginia": "WV",
    "wisconsin": "WI",
    "wyoming": "WY",
    "puerto rico": "PR",
    "guam": "GU",
    "virgin islands": "VI",
    "american samoa": "AS",
    "northern mariana islands": "MP",
}

DEGREE_COLUMNS: dict[str, tuple[str, ...]] = {
    "Certificate": ("PCERT1A", "PCERT1B", "PCERT2", "PCERT4"),
    "Associate": ("PASSOC",),
    "Bachelor's / BS": ("PBACHL",),
    "Master's / MS": ("PMASTR",),
    "Doctorate / PhD": ("PDOCRS", "PDOCOT"),
    "Professional degree": ("PDOCPP",),
    "Postgraduate certificate": ("PPBACC", "PPMAST"),
}

UNDERGRADUATE_LEVELS = ("Certificate", "Associate", "Bachelor's / BS")

IPEDS_ADMISSION_POLICIES: dict[str, dict[str, str]] = {
    "ADMCON6": {
        "1": "Portfolio / competency evidence required",
        "5": "Portfolio / competency evidence optional",
        "3": "Portfolio / competency evidence not considered",
    },
    "ADMCON7": {
        "1": "SAT or ACT required",
        "5": "Test optional",
        "3": "SAT or ACT not considered",
    },
}

CIP_SUBJECTS: dict[str, tuple[str, ...]] = {
    "01": ("Agriculture and forestry",),
    "03": ("Environmental and earth sciences",),
    "04": ("Architecture and design",),
    "05": ("Humanities and languages", "Social and behavioral sciences"),
    "09": ("Arts and creative studies", "Social and behavioral sciences"),
    "10": ("Arts and creative studies", "Computer science and IT"),
    "11": ("Computer science and IT",),
    "13": ("Education",),
    "14": ("Engineering",),
    "15": ("Engineering",),
    "16": ("Humanities and languages",),
    "19": ("Social and behavioral sciences",),
    "22": ("Law",),
    "23": ("Humanities and languages",),
    "24": ("Humanities and languages",),
    "25": ("Humanities and languages",),
    "26": ("Natural sciences",),
    "27": ("Mathematics and statistics",),
    "28": ("Engineering",),
    "29": ("Engineering",),
    "31": ("Health and medicine",),
    "38": ("Humanities and languages",),
    "39": ("Humanities and languages",),
    "40": ("Natural sciences",),
    "41": ("Natural sciences",),
    "42": ("Social and behavioral sciences",),
    "43": ("Law", "Social and behavioral sciences"),
    "44": ("Social and behavioral sciences",),
    "45": ("Social and behavioral sciences",),
    "46": ("Engineering",),
    "47": ("Engineering",),
    "48": ("Engineering",),
    "49": ("Engineering",),
    "50": ("Arts and creative studies",),
    "51": ("Health and medicine",),
    "52": ("Business and management",),
    "54": ("Humanities and languages",),
    "60": ("Health and medicine",),
    "61": ("Health and medicine",),
}


def subjects_for_cip(cip_code: str) -> tuple[str, ...]:
    subjects = set(CIP_SUBJECTS.get(cip_code[:2], ()))
    if cip_code == "11.0102" or cip_code.startswith(("30.70", "30.71")):
        subjects.add("Data science and artificial intelligence")
    if cip_code.startswith(("12.05", "52.09")):
        subjects.add("Hospitality and tourism")
    return tuple(sorted(subjects))


def request(url: str, method: str = "GET"):
    return urllib.request.urlopen(
        urllib.request.Request(
            url,
            headers={"User-Agent": USER_AGENT},
            method=method,
        ),
        timeout=180,
    )


def normalize_text(value: str | None) -> str:
    text = unicodedata.normalize("NFKD", value or "")
    text = "".join(character for character in text if not unicodedata.combining(character))
    text = text.casefold().replace("&", " and ")
    text = re.sub(r"^the\s+", "", text)
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def normalize_domain(value: str | None) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    parsed = urllib.parse.urlparse(raw if "://" in raw else "//" + raw)
    hostname = (parsed.hostname or "").casefold().removeprefix("www.")
    return hostname.rstrip(".")


def ror_state_code(record: dict) -> str:
    region = normalize_text(record.get("region"))
    if len(region) == 2:
        return region.upper()
    return STATE_CODES.get(region, "")


def unique_index(values: list[tuple[str, str]]) -> dict[str, str]:
    grouped: dict[str, set[str]] = defaultdict(set)
    for key, identifier in values:
        if key:
            grouped[key].add(identifier)
    return {key: next(iter(ids)) for key, ids in grouped.items() if len(ids) == 1}


def discover_files() -> tuple[int, str, str]:
    print("Discovering the latest NCES/IPEDS complete data files...")
    current_year = datetime.now(timezone.utc).year
    for year in range(current_year + 1, current_year - 6, -1):
        hd_url = urllib.parse.urljoin(COMPLETE_DATA_BASE_URL, f"HD{year}.zip")
        programs_url = urllib.parse.urljoin(COMPLETE_DATA_BASE_URL, f"C{year}DEP.zip")
        try:
            with request(hd_url, method="HEAD"), request(programs_url, method="HEAD"):
                return year, hd_url, programs_url
        except urllib.error.HTTPError as error:
            if error.code != 404:
                raise

    raise RuntimeError("No matching recent HD and CDEP files were available from NCES.")


def discover_admissions_file() -> tuple[int, str]:
    print("Discovering the latest NCES/IPEDS admissions file...")
    current_year = datetime.now(timezone.utc).year
    for year in range(current_year + 1, current_year - 6, -1):
        admissions_url = urllib.parse.urljoin(
            COMPLETE_DATA_BASE_URL, f"ADM{year}.zip"
        )
        try:
            with request(admissions_url, method="HEAD"):
                return year, admissions_url
        except urllib.error.HTTPError as error:
            if error.code != 404:
                raise

    raise RuntimeError("No recent ADM file was available from NCES.")


def download(url: str, target: Path) -> None:
    print(f"Downloading {url}...")
    with request(url) as response, target.open("wb") as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)


def csv_rows(archive_path: Path):
    with zipfile.ZipFile(archive_path) as archive:
        csv_name = next(
            (name for name in archive.namelist() if name.casefold().endswith(".csv")), None
        )
        if not csv_name:
            raise RuntimeError(f"{archive_path.name} did not contain a CSV file.")
        with archive.open(csv_name) as source:
            text = io.TextIOWrapper(source, encoding="utf-8-sig", newline="")
            yield from csv.DictReader(text)


def load_ror_records() -> tuple[
    dict[str, dict],
    dict[str, str],
    dict[str, str],
    dict[tuple[str, str], list[str]],
]:
    records = json.loads(ROR_US_PATH.read_text(encoding="utf-8"))
    by_id = {record["id"]: record for record in records}

    domain_values: list[tuple[str, str]] = []
    name_values: list[tuple[str, str]] = []
    by_location: dict[tuple[str, str], list[str]] = defaultdict(list)
    for record in records:
        identifier = record["id"]
        for value in [record.get("website"), *(record.get("domains") or [])]:
            domain_values.append((normalize_domain(value), identifier))
        for value in [record.get("name"), *(record.get("aliases") or [])]:
            name_values.append((normalize_text(value), identifier))
        by_location[(normalize_text(record.get("city")), ror_state_code(record))].append(identifier)

    return by_id, unique_index(domain_values), unique_index(name_values), by_location


def match_ror_id(
    institution: dict,
    ror_by_id: dict[str, dict],
    domain_index: dict[str, str],
    name_index: dict[str, str],
    location_index: dict[tuple[str, str], list[str]],
) -> tuple[str, str]:
    domain = normalize_domain(institution.get("WEBADDR"))
    if domain and domain in domain_index:
        return domain_index[domain], "domain"

    names = [institution.get("INSTNM"), institution.get("IALIAS")]
    for name in names:
        normalized = normalize_text(name)
        if normalized and normalized in name_index:
            return name_index[normalized], "name"

    location = (normalize_text(institution.get("CITY")), (institution.get("STABBR") or "").upper())
    candidates = location_index.get(location, [])
    source_name = normalize_text(institution.get("INSTNM"))
    best_id = ""
    best_score = 0.0
    second_score = 0.0
    for identifier in candidates:
        candidate = ror_by_id[identifier]
        candidate_names = [candidate.get("name"), *(candidate.get("aliases") or [])]
        score = max(
            (SequenceMatcher(None, source_name, normalize_text(name)).ratio() for name in candidate_names),
            default=0.0,
        )
        if score > best_score:
            second_score = best_score
            best_id = identifier
            best_score = score
        elif score > second_score:
            second_score = score

    if best_score >= 0.92 and best_score - second_score >= 0.04:
        return best_id, "location-name"
    return "", "unmatched"


def as_count(value: str | None) -> int:
    try:
        return max(0, int(value or 0))
    except ValueError:
        return 0


def institution_types(control: str | None) -> list[str]:
    if control == "1":
        return ["Public"]
    if control == "2":
        return ["Private", "Private nonprofit"]
    if control == "3":
        return ["Private", "Private for-profit"]
    return []


def main() -> None:
    year, hd_url, programs_url = discover_files()
    admissions_year, admissions_url = discover_admissions_file()
    ror_by_id, domain_index, name_index, location_index = load_ror_records()

    with tempfile.TemporaryDirectory(prefix="edvora-ipeds-") as directory:
        temp_dir = Path(directory)
        hd_archive = temp_dir / f"HD{year}.zip"
        programs_archive = temp_dir / f"C{year}DEP.zip"
        admissions_archive = temp_dir / f"ADM{admissions_year}.zip"
        download(hd_url, hd_archive)
        download(programs_url, programs_archive)
        download(admissions_url, admissions_archive)

        unit_to_match: dict[str, tuple[str, str]] = {}
        unit_metadata: dict[str, dict] = {}
        match_methods: Counter[str] = Counter()
        for institution in csv_rows(hd_archive):
            if institution.get("CYACTIVE") != "1" or institution.get("POSTSEC") != "1":
                continue
            identifier, method = match_ror_id(
                institution, ror_by_id, domain_index, name_index, location_index
            )
            match_methods[method] += 1
            if not identifier:
                continue
            unit_id = institution.get("UNITID") or ""
            unit_to_match[unit_id] = (identifier, method)
            unit_metadata[unit_id] = {
                "institutionTypes": institution_types(institution.get("CONTROL")),
                "ipedsName": institution.get("INSTNM") or "",
            }

        aggregated: dict[str, dict] = {}
        for row in csv_rows(programs_archive):
            cip_code = row.get("CIPCODE") or ""
            if not re.fullmatch(r"\d{2}\.\d{4}", cip_code):
                continue
            unit_id = row.get("UNITID") or ""
            match = unit_to_match.get(unit_id)
            if not match:
                continue
            identifier, method = match
            ror = ror_by_id[identifier]
            record = aggregated.setdefault(
                identifier,
                {
                    "degreeLevels": set(),
                    "deliveryModes": set(),
                    "institutionId": identifier,
                    "institutionName": ror.get("name") or unit_metadata[unit_id]["ipedsName"],
                    "institutionTypes": set(),
                    "ipedsProgramCount": 0,
                    "ipedsUnitIds": set(),
                    "languages": set(),
                    "matchMethods": set(),
                    "programCountsByDegreeLevel": defaultdict(int),
                    "sourceKinds": {"ipeds-program-offerings"},
                    "subjects": set(),
                    "subjectsByDegreeLevel": defaultdict(set),
                },
            )
            record["institutionTypes"].update(unit_metadata[unit_id]["institutionTypes"])
            record["ipedsUnitIds"].add(unit_id)
            record["matchMethods"].add(method)
            record["ipedsProgramCount"] += as_count(row.get("PTOTAL"))

            cip_subjects = subjects_for_cip(cip_code)
            if as_count(row.get("PTOTAL")) > 0:
                record["subjects"].update(cip_subjects)

            for level, columns in DEGREE_COLUMNS.items():
                count = sum(as_count(row.get(column)) for column in columns)
                if count <= 0:
                    continue
                record["degreeLevels"].add(level)
                record["programCountsByDegreeLevel"][level] += count
                record["subjectsByDegreeLevel"][level].update(cip_subjects)

        admission_policies_by_id: dict[str, set[str]] = defaultdict(set)
        for row in csv_rows(admissions_archive):
            unit_id = row.get("UNITID") or ""
            match = unit_to_match.get(unit_id)
            if not match:
                continue
            identifier, _ = match
            for column, policy_by_code in IPEDS_ADMISSION_POLICIES.items():
                policy = policy_by_code.get(row.get(column) or "")
                if policy:
                    admission_policies_by_id[identifier].add(policy)

    records = []
    for record in aggregated.values():
        if not record["degreeLevels"] or record["ipedsProgramCount"] <= 0:
            continue
        admission_policies = admission_policies_by_id.get(
            record["institutionId"], set()
        )
        test_policies_by_degree_level = {
            level: sorted(admission_policies)
            for level in UNDERGRADUATE_LEVELS
            if level in record["degreeLevels"] and admission_policies
        }
        source_kinds = set(record["sourceKinds"])
        if admission_policies:
            source_kinds.add("ipeds-undergraduate-admissions")
        records.append(
            {
                **(
                    {"admissionsYear": admissions_year}
                    if admission_policies
                    else {}
                ),
                "degreeLevels": sorted(record["degreeLevels"]),
                "deliveryModes": [],
                "institutionId": record["institutionId"],
                "institutionName": record["institutionName"],
                "institutionTypes": sorted(record["institutionTypes"]),
                "ipedsProgramCount": record["ipedsProgramCount"],
                "ipedsUnitIds": sorted(record["ipedsUnitIds"]),
                "ipedsYear": year,
                "languages": [],
                "matchMethods": sorted(record["matchMethods"]),
                "programCount": record["ipedsProgramCount"],
                "programCountsByDegreeLevel": dict(sorted(record["programCountsByDegreeLevel"].items())),
                "sourceKinds": sorted(source_kinds),
                "sourceUpdatedAt": str(year),
                "subjects": sorted(record["subjects"]),
                "subjectsByDegreeLevel": {
                    level: sorted(subjects)
                    for level, subjects in sorted(record["subjectsByDegreeLevel"].items())
                },
                "testPoliciesByDegreeLevel": test_policies_by_degree_level,
            }
        )

    records.sort(key=lambda item: item["institutionName"].casefold())
    doctoral_count = sum(
        "Doctorate / PhD" in record["degreeLevels"] for record in records
    )
    if len(records) < 1_000 or doctoral_count < 100:
        raise RuntimeError(
            "IPEDS-to-ROR coverage is unexpectedly low: "
            f"{len(records):,} institutions and {doctoral_count:,} doctoral institutions."
        )

    payload = {
        "generatedFrom": "NCES/IPEDS program offerings joined to ROR institution identities",
        "institutionCount": len(records),
        "programCount": sum(record["programCount"] for record in records),
        "records": records,
        "source": {
            "admissionsDataFile": f"ADM{admissions_year}",
            "admissionsYear": admissions_year,
            "dataFile": f"C{year}DEP",
            "directoryFile": f"HD{year}",
            "provider": "National Center for Education Statistics (NCES), IPEDS",
            "sourceUrl": DATA_FILES_URL,
            "year": year,
        },
        "sourceUpdatedAt": str(year),
        "statistics": {
            "admissionsPolicyInstitutionCount": len(admission_policies_by_id),
            "doctoralInstitutionCount": doctoral_count,
            "matchMethods": dict(sorted(match_methods.items())),
            "matchedInstitutionCount": len(records),
        },
        "version": 2,
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    print(
        f"Indexed {payload['programCount']:,} IPEDS program offerings across "
        f"{len(records):,} matched institutions ({doctoral_count:,} doctoral)."
    )


if __name__ == "__main__":
    main()
