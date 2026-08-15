"""Sync University of Toronto programs and admissions facts from official pages."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from urllib.robotparser import RobotFileParser


INSTITUTION_ID = "https://ror.org/03dbr7087"
INSTITUTION_NAME = "University of Toronto"
UNDERGRADUATE_URL = "https://www.utoronto.ca/academics/undergraduate-programs"
UNDERGRADUATE_REQUIREMENTS_URL = (
    "https://future.utoronto.ca/requirements-international-high-schools"
)
UNDERGRADUATE_ENGLISH_URL = "https://future.utoronto.ca/english-language-requirements"
UNDERGRADUATE_DEADLINES_URL = "https://future.utoronto.ca/deadlines"
UNDERGRADUATE_APPLY_URL = "https://future.utoronto.ca/applying"
GRADUATE_URL = "https://www.sgs.utoronto.ca/programs/"
GRADUATE_REQUIREMENTS_URL = (
    "https://www.sgs.utoronto.ca/future-students/admission-application-requirements/"
)
GRADUATE_ENGLISH_URL = (
    "https://www.sgs.utoronto.ca/future-students/"
    "admission-application-requirements/english-language-proficiency-testing/"
)
OUTPUT_PATH = (
    Path(__file__).resolve().parents[1]
    / "public"
    / "data"
    / "program-catalog"
    / "03dbr7087.json"
)
USER_AGENT = "EdvoraCatalogBot/1.0 (official-source catalog refresh)"


def clean_text(value: str) -> str:
    return re.sub(
        r"\s+",
        " ",
        html.unescape(value).replace("\u200b", "").replace("\ufeff", ""),
    ).strip()


def class_names(attrs: list[tuple[str, str | None]]) -> set[str]:
    value = dict(attrs).get("class") or ""
    return set(value.split())


def stable_id(prefix: str, *parts: str) -> str:
    value = "|".join(clean_text(part).casefold() for part in parts)
    return f"{prefix}-{hashlib.sha256(value.encode('utf-8')).hexdigest()[:16]}"


class UndergraduateDirectoryParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.programs: list[dict] = []
        self.current: dict | None = None
        self.card_depth = 0
        self.capture = ""
        self.capture_tag = ""
        self.buffer: list[str] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        classes = class_names(attrs)
        attr_map = dict(attrs)

        if tag == "div":
            if self.current is None and "card" in classes:
                self.current = {
                    "campus": "",
                    "degree": "",
                    "highSchoolOnly": False,
                    "name": "",
                    "officialUrl": "",
                    "text": [],
                    "types": [],
                }
                self.card_depth = 1
            elif self.current is not None:
                self.card_depth += 1

        if self.current is None:
            return

        if tag == "a" and "nav-accordion" in classes:
            self._start_capture("name", tag)
        elif tag == "b" and not self.current["degree"]:
            self._start_capture("degree", tag)
        elif tag == "span" and "types" in classes:
            self._start_capture("type", tag)
        elif tag == "span" and "campus" in classes:
            self._start_capture("campus", tag)
        elif tag == "a" and "btn-programs" in classes:
            href = clean_text(attr_map.get("href") or "")
            if href:
                self.current["officialUrl"] = urljoin(UNDERGRADUATE_URL, href)

    def handle_data(self, data: str) -> None:
        if self.current is None:
            return
        self.current["text"].append(data)
        if self.capture:
            self.buffer.append(data)

    def handle_endtag(self, tag: str) -> None:
        if self.current is None:
            return

        if self.capture and tag == self.capture_tag:
            value = clean_text(" ".join(self.buffer))
            if self.capture == "type" and value:
                self.current["types"].append(value)
            elif value:
                self.current[self.capture] = value
            self.capture = ""
            self.capture_tag = ""
            self.buffer = []

        if tag == "div":
            self.card_depth -= 1
            if self.card_depth == 0:
                self._finish_card()

    def _start_capture(self, field: str, tag: str) -> None:
        self.capture = field
        self.capture_tag = tag
        self.buffer = []

    def _finish_card(self) -> None:
        assert self.current is not None
        all_text = clean_text(" ".join(self.current.pop("text")))
        self.current["highSchoolOnly"] = (
            "only available to high school applicants" in all_text.casefold()
        )
        self.current["types"] = list(dict.fromkeys(self.current["types"]))
        if (
            self.current["name"]
            and self.current["degree"]
            and self.current["officialUrl"]
        ):
            self.programs.append(self.current)
        self.current = None
        self.card_depth = 0


class GraduateDirectoryParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.rows: list[dict] = []
        self.in_row = False
        self.in_cell = False
        self.cells: list[dict] = []
        self.cell_text: list[str] = []
        self.cell_href = ""

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        if tag == "tr":
            self.in_row = True
            self.cells = []
        elif tag == "td" and self.in_row:
            self.in_cell = True
            self.cell_text = []
            self.cell_href = ""
        elif tag == "a" and self.in_cell and not self.cell_href:
            self.cell_href = clean_text(dict(attrs).get("href") or "")

    def handle_data(self, data: str) -> None:
        if self.in_cell:
            self.cell_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "td" and self.in_cell:
            self.cells.append(
                {
                    "href": self.cell_href,
                    "text": clean_text(" ".join(self.cell_text)),
                }
            )
            self.in_cell = False
        elif tag == "tr" and self.in_row:
            self._finish_row()
            self.in_row = False

    def _finish_row(self) -> None:
        if len(self.cells) < 3:
            return
        program_url = self.cells[0]["href"]
        parsed = urlparse(program_url)
        if (
            not self.cells[0]["text"]
            or not self.cells[2]["text"]
            or parsed.netloc != "www.sgs.utoronto.ca"
            or not parsed.path.startswith("/programs/")
        ):
            return
        self.rows.append(
            {
                "degrees": self.cells[2]["text"],
                "name": self.cells[0]["text"],
                "officialUrl": program_url,
                "unit": self.cells[1]["text"],
            }
        )


class GraduateProgramParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.heading = ""
        self.capture_heading = False
        self.heading_text: list[str] = []
        self.capture_overview = False
        self.overview_text: list[str] = []
        self.overview_paragraphs: list[str] = []
        self.quick_table = False
        self.table_depth = 0
        self.in_row = False
        self.in_cell = False
        self.cells: list[dict] = []
        self.cell_text: list[str] = []
        self.cell_links: list[str] = []
        self.rows: list[dict] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        if tag == "h2":
            self.capture_heading = True
            self.heading_text = []
        elif tag == "p" and self.heading == "Program Overview":
            self.capture_overview = True
            self.overview_text = []
        elif tag == "table" and self.heading == "Quick Facts":
            self.quick_table = True
            self.table_depth = 1
        elif tag == "table" and self.quick_table:
            self.table_depth += 1
        elif tag == "tr" and self.quick_table:
            self.in_row = True
            self.cells = []
        elif tag == "td" and self.in_row:
            self.in_cell = True
            self.cell_text = []
            self.cell_links = []
        elif tag == "a" and self.in_cell:
            href = clean_text(dict(attrs).get("href") or "")
            if href:
                self.cell_links.append(href)
        elif tag in {"br", "li", "p"} and self.in_cell:
            self.cell_text.append(" | ")

    def handle_data(self, data: str) -> None:
        if self.capture_heading:
            self.heading_text.append(data)
        if self.capture_overview:
            self.overview_text.append(data)
        if self.in_cell:
            self.cell_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "h2" and self.capture_heading:
            self.heading = clean_text(" ".join(self.heading_text))
            self.capture_heading = False
        elif tag == "p" and self.capture_overview:
            paragraph = clean_text(" ".join(self.overview_text))
            if paragraph:
                self.overview_paragraphs.append(paragraph)
            self.capture_overview = False
        elif tag == "td" and self.in_cell:
            self.cells.append(
                {
                    "links": list(dict.fromkeys(self.cell_links)),
                    "text": clean_text(" ".join(self.cell_text).strip(" |")),
                }
            )
            self.in_cell = False
        elif tag == "tr" and self.in_row:
            if len(self.cells) >= 3 and self.cells[0]["text"]:
                self.rows.append(
                    {
                        "domestic": self.cells[1],
                        "international": self.cells[2],
                        "label": self.cells[0]["text"],
                    }
                )
            self.in_row = False
        elif tag == "table" and self.quick_table:
            self.table_depth -= 1
            if self.table_depth == 0:
                self.quick_table = False

    @property
    def summary(self) -> str:
        return clean_text(" ".join(self.overview_paragraphs[:3]))


def fetch_text(url: str, timeout: int = 35) -> str:
    request = Request(
        url,
        headers={
            "Accept": "text/html,application/xhtml+xml",
            "User-Agent": USER_AGENT,
        },
    )
    with urlopen(request, timeout=timeout) as response:
        payload = response.read()
        try:
            return payload.decode("utf-8")
        except UnicodeDecodeError:
            charset = response.headers.get_content_charset() or "utf-8"
            return payload.decode(charset, errors="replace")


def robots_allowed(url: str, cache: dict[str, RobotFileParser]) -> bool:
    parsed = urlparse(url)
    root = f"{parsed.scheme}://{parsed.netloc}"
    if root not in cache:
        robots_url = f"{root}/robots.txt"
        parser = RobotFileParser(robots_url)
        parser.parse(fetch_text(robots_url).splitlines())
        cache[root] = parser
    return cache[root].can_fetch(USER_AGENT, url)


def fetch_official(url: str, robots: dict[str, RobotFileParser]) -> str:
    if not robots_allowed(url, robots):
        raise RuntimeError(f"robots.txt does not allow catalog access: {url}")
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            return fetch_text(url)
        except Exception as error:  # Network failures are retried and reported.
            last_error = error
            if attempt < 2:
                time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Could not fetch {url}: {last_error}") from last_error


def split_degrees(value: str) -> list[str]:
    return [clean_text(part) for part in re.split(r"\s*/\s*", value) if clean_text(part)]


def degree_level(degree: str) -> str:
    doctorate_prefixes = ("DMA", "DN", "DrPH", "EdD", "PhD", "SJD")
    if degree.startswith(doctorate_prefixes):
        return "Doctorate"
    if degree.startswith("Bachelor") or degree.startswith("Honours Bachelor"):
        return "Bachelor"
    if degree.startswith("M") or degree.startswith("GPLLM"):
        return "Master"
    return "Graduate"


def degree_aliases(degree: str) -> set[str]:
    aliases = {degree.casefold()}
    first_token = re.match(r"[A-Za-z][A-Za-z0-9]*", degree)
    if first_token:
        aliases.add(first_token.group(0).casefold())
    return aliases


DEGREE_TOKEN = r"[A-Z][A-Za-z0-9]*(?:\s*\([^:)]*\))?"
DEGREE_CLAUSE = re.compile(
    rf"(?P<prefix>{DEGREE_TOKEN}(?:\s*,\s*{DEGREE_TOKEN})*)\s*:"
)


def value_for_degree(value: str, degree: str) -> str:
    value = clean_text(value.replace(" | ", " "))
    if not value:
        return ""
    matches = list(DEGREE_CLAUSE.finditer(value))
    if not matches:
        return value

    aliases = degree_aliases(degree)
    selected: list[str] = []
    recognized_degree_clause = False
    for index, match in enumerate(matches):
        prefix = clean_text(match.group("prefix"))
        tokens = {clean_text(item).casefold() for item in prefix.split(",")}
        looks_like_degree = any(
            sum(character.isupper() for character in item) >= 2
            for item in [clean_text(part) for part in prefix.split(",")]
        )
        if not looks_like_degree:
            continue
        recognized_degree_clause = True
        end = matches[index + 1].start() if index + 1 < len(matches) else len(value)
        clause_value = clean_text(value[match.end() : end])
        if aliases.intersection(tokens) and clause_value:
            selected.append(clause_value)

    if selected:
        return clean_text("; ".join(dict.fromkeys(selected)))
    return "" if recognized_degree_clause else value


def global_graduate_facts(level: str) -> list[dict[str, str]]:
    if level == "Doctorate":
        degree_fact = {
            "label": "SGS minimum academic requirement",
            "scope": "Doctoral applicants",
            "value": (
                "An appropriate master's degree or equivalent with at least a B+ average; "
                "approved direct-entry routes require at least an A- average"
            ),
        }
    else:
        degree_fact = {
            "label": "SGS minimum academic requirement",
            "scope": "Master's applicants",
            "value": (
                "An appropriate bachelor's degree or equivalent with at least a mid-B "
                "average in the final year"
            ),
        }
    return [
        degree_fact,
        {
            "label": "Graduate English proficiency minimum",
            "scope": "Applicants who are not exempt; programs may require higher scores",
            "value": (
                "IELTS Academic 7.0 with at least 6.5 in each component; TOEFL iBT 93 "
                "with Writing and Speaking 22 on the 0-120 scale, or the current "
                "1-6 scale minimums published by SGS"
            ),
        },
        {
            "label": "Graduate application fee",
            "scope": "Standard SGS application",
            "value": "CAD 130; a program-specific supplementary fee may also apply",
        },
    ]


def undergraduate_requirement_group(program: dict, requirement_id: str, updated: str) -> dict:
    types = ", ".join(program["types"]) or "See official program page"
    facts = [
        {
            "label": "Program options",
            "scope": program["campus"] or "University of Toronto",
            "value": types,
        },
        {
            "label": "Academic curriculum",
            "scope": "International high-school applicants",
            "value": (
                "Meet the minimum for the applicant's country or curriculum and present "
                "all program prerequisites at the senior/Grade 12 equivalent level"
            ),
        },
        {
            "label": "Required English course",
            "scope": "All undergraduate applicants",
            "value": "Senior-level English equivalent to Ontario ENG4U/EAE4U",
        },
        {
            "label": "English proficiency",
            "scope": "Applicants who are not exempt",
            "value": (
                "IELTS Academic 6.5 with no band below 6.0; TOEFL requirements depend "
                "on whether the test was taken before or after January 21, 2026"
            ),
        },
        {
            "label": "Application deadline",
            "scope": "Faculty/program and applicant type",
            "value": "Confirm the current date in U of T's official deadline table",
        },
    ]
    if program["highSchoolOnly"]:
        facts.append(
            {
                "label": "Entry route",
                "scope": program["name"],
                "value": "The official directory marks this option as available only to high-school applicants",
            }
        )
    return {
        "documents": [
            "OUAC application",
            "Personalized academic records requested in the applicant portal",
            "English proficiency results when required",
            "Program-specific supplementary materials when required",
        ],
        "facts": facts,
        "id": requirement_id,
        "level": "Bachelor",
        "sourceUrl": program["officialUrl"],
        "supportingSourceUrls": [
            UNDERGRADUATE_REQUIREMENTS_URL,
            UNDERGRADUATE_ENGLISH_URL,
            UNDERGRADUATE_DEADLINES_URL,
        ],
        "title": f"Admission requirements for {program['name']}",
        "updatedAt": updated,
    }


def graduate_requirement_group(
    row: dict,
    degree: str,
    requirement_id: str,
    page: GraduateProgramParser | None,
    updated: str,
) -> tuple[dict, str, str]:
    level = degree_level(degree)
    facts: list[dict[str, str]] = []
    application_deadline = "See the official program page"
    application_url = row["officialUrl"]

    if page:
        for quick_fact in page.rows:
            source_cell = quick_fact["international"] or quick_fact["domestic"]
            value = value_for_degree(source_cell["text"], degree)
            if not value:
                continue
            facts.append(
                {
                    "label": quick_fact["label"],
                    "scope": f"International applicants / {degree}",
                    "value": value,
                }
            )
            if "application deadline" in quick_fact["label"].casefold():
                application_deadline = value
                if source_cell["links"]:
                    application_url = source_cell["links"][0]

    existing_labels = {fact["label"].casefold() for fact in facts}
    for fact in global_graduate_facts(level):
        if fact["label"].casefold() not in existing_labels:
            facts.append(fact)

    group = {
        "documents": [
            "Online graduate application",
            "Academic records requested by the graduate unit",
            "English proficiency results when required",
            "Program-specific supporting materials",
        ],
        "facts": facts,
        "id": requirement_id,
        "level": level,
        "sourceUrl": row["officialUrl"],
        "supportingSourceUrls": [GRADUATE_REQUIREMENTS_URL, GRADUATE_ENGLISH_URL],
        "title": f"{row['name']} ({degree}) requirements",
        "updatedAt": updated,
    }
    return group, application_deadline, application_url


def load_existing() -> dict | None:
    if not OUTPUT_PATH.exists():
        return None
    try:
        return json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def build_catalog(delay: float, strict: bool) -> dict:
    robots: dict[str, RobotFileParser] = {}
    updated = datetime.now(timezone.utc).date().isoformat()
    existing = load_existing() or {}
    old_programs = {item["id"]: item for item in existing.get("programs", [])}
    old_requirements = {
        item["id"]: item for item in existing.get("requirementGroups", [])
    }

    undergraduate_parser = UndergraduateDirectoryParser()
    undergraduate_parser.feed(fetch_official(UNDERGRADUATE_URL, robots))
    graduate_parser = GraduateDirectoryParser()
    graduate_parser.feed(fetch_official(GRADUATE_URL, robots))

    programs: list[dict] = []
    requirements: list[dict] = []
    graduate_pages_fetched = 0
    graduate_pages_failed = 0
    graduate_pages_with_quick_facts = 0

    for item in undergraduate_parser.programs:
        program_id = stable_id(
            "utoronto-ug",
            item["name"],
            item["degree"],
            item["campus"],
            ",".join(item["types"]),
            item["officialUrl"],
        )
        requirement_id = f"{program_id}-requirements"
        display_options = ", ".join(item["types"])
        display_name = item["name"]
        if display_options or item["campus"]:
            qualifier = ", ".join(
                part for part in [display_options, item["campus"]] if part
            )
            display_name = f"{display_name} ({qualifier})"
        program = {
            "applicationDeadline": "See current U of T undergraduate deadlines",
            "applicationUrl": UNDERGRADUATE_APPLY_URL,
            "degree": item["degree"],
            "deliveryMode": "Campus",
            "durationMonths": 48,
            "id": program_id,
            "language": "English",
            "level": "Bachelor",
            "name": display_name,
            "officialUrl": item["officialUrl"],
            "requirementGroupId": requirement_id,
            "school": item["campus"] or "University of Toronto",
            "subject": item["name"],
            "summary": (
                f"Official {item['degree']} program listing. Options: "
                f"{display_options or 'see the official program page'}."
            ),
            "updatedAt": updated,
        }
        programs.append(program)
        requirements.append(undergraduate_requirement_group(item, requirement_id, updated))

    for row in graduate_parser.rows:
        page: GraduateProgramParser | None = None
        try:
            time.sleep(delay)
            page = GraduateProgramParser()
            page.feed(fetch_official(row["officialUrl"], robots))
            graduate_pages_fetched += 1
            if page.rows:
                graduate_pages_with_quick_facts += 1
        except Exception as error:
            graduate_pages_failed += 1
            print(f"Warning: retaining available data for {row['officialUrl']}: {error}")
            page = None

        for degree in split_degrees(row["degrees"]):
            program_id = stable_id("utoronto-grad", row["name"], degree, row["officialUrl"])
            requirement_id = f"{program_id}-requirements"
            group, deadline, application_url = graduate_requirement_group(
                row, degree, requirement_id, page, updated
            )
            if page is None and requirement_id in old_requirements:
                group = old_requirements[requirement_id]
            old_program = old_programs.get(program_id, {})
            summary = page.summary if page and page.summary else old_program.get("summary", "")
            if not summary:
                summary = f"Official {degree} credential offered by {row['unit']}."
            if page is None:
                deadline = old_program.get("applicationDeadline", deadline)
                application_url = old_program.get("applicationUrl", application_url)
            programs.append(
                {
                    "applicationDeadline": deadline,
                    "applicationUrl": application_url,
                    "degree": degree,
                    "deliveryMode": "See official program page",
                    "durationMonths": None,
                    "id": program_id,
                    "language": "English",
                    "level": degree_level(degree),
                    "name": f"{row['name']} ({degree})",
                    "officialUrl": row["officialUrl"],
                    "requirementGroupId": requirement_id,
                    "school": row["unit"],
                    "subject": row["name"],
                    "summary": summary,
                    "updatedAt": updated if page is not None else old_program.get("updatedAt", updated),
                }
            )
            requirements.append(group)

    programs.sort(key=lambda item: (item["level"], item["name"]))
    requirements.sort(key=lambda item: (item["level"], item["title"]))
    undergraduate_count = sum(1 for item in programs if item["id"].startswith("utoronto-ug"))
    graduate_count = len(programs) - undergraduate_count

    if strict:
        if undergraduate_count < 350:
            raise RuntimeError(
                f"Strict mode expected at least 350 undergraduate listings, found {undergraduate_count}."
            )
        if graduate_count < 200:
            raise RuntimeError(
                f"Strict mode expected at least 200 graduate credentials, found {graduate_count}."
            )
        if graduate_pages_with_quick_facts < 100:
            raise RuntimeError(
                "Strict mode expected Quick Facts on at least 100 graduate program pages, "
                f"found {graduate_pages_with_quick_facts}."
            )
        if len(requirements) != len(programs):
            raise RuntimeError("Every program must have a matching requirement group.")

    return {
        "catalogUrl": UNDERGRADUATE_URL,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "institutionId": INSTITUTION_ID,
        "institutionName": INSTITUTION_NAME,
        "programs": programs,
        "requirementGroups": requirements,
        "sourceCounts": {
            "graduateDirectoryRows": len(graduate_parser.rows),
            "graduatePagesFailed": graduate_pages_failed,
            "graduatePagesFetched": graduate_pages_fetched,
            "graduatePagesWithQuickFacts": graduate_pages_with_quick_facts,
            "graduatePrograms": graduate_count,
            "officialPrograms": len(programs),
            "programRequirementSources": len(requirements),
            "undergraduatePrograms": undergraduate_count,
        },
        "sources": [
            {"label": "Undergraduate program directory", "url": UNDERGRADUATE_URL},
            {"label": "International undergraduate requirements", "url": UNDERGRADUATE_REQUIREMENTS_URL},
            {"label": "Undergraduate English requirements", "url": UNDERGRADUATE_ENGLISH_URL},
            {"label": "Undergraduate deadlines", "url": UNDERGRADUATE_DEADLINES_URL},
            {"label": "Graduate program directory and Quick Facts", "url": GRADUATE_URL},
            {"label": "Graduate admission requirements", "url": GRADUATE_REQUIREMENTS_URL},
            {"label": "Graduate English requirements", "url": GRADUATE_ENGLISH_URL},
        ],
        "sourceUpdatedAt": updated,
        "syncMode": "live-official",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--delay", type=float, default=0.15)
    parser.add_argument("--offline", action="store_true")
    parser.add_argument("--strict", action="store_true")
    args = parser.parse_args()

    if args.offline:
        existing = load_existing()
        if not existing:
            raise SystemExit("No existing University of Toronto snapshot is available.")
        print(
            f"Kept offline snapshot with {len(existing.get('programs', []))} programs "
            f"at {OUTPUT_PATH}."
        )
        return

    payload = build_catalog(max(0.0, args.delay), args.strict)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Published {len(payload['programs'])} University of Toronto program credentials "
        f"and {len(payload['requirementGroups'])} requirement groups to {OUTPUT_PATH}."
    )


if __name__ == "__main__":
    main()
