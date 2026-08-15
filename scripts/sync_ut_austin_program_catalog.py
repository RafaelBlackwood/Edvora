"""Sync UT Austin's official degree directories into Edvora's program snapshot."""

from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen


UNDERGRADUATE_URL = "https://registrar.utexas.edu/catalogs/degree-plans"
UNDERGRADUATE_ADMISSIONS_URL = (
    "https://admissions.utexas.edu/apply/international-students/"
)
UNDERGRADUATE_ENGLISH_URL = (
    "https://admissions.utexas.edu/apply/frequently-asked-questions/"
)
GRADUATE_URL = "https://gradschool.utexas.edu/degrees-programs"
GRADUATE_ADMISSIONS_URL = "https://gradschool.utexas.edu/admissions/begin"
GRADUATE_APPLICATION_URL = "https://gradschool.utexas.edu/admissions/apply"
GRADUATE_ENGLISH_URL = (
    "https://gradschool.utexas.edu/admissions/apply/international"
)
INSTITUTION_ID = "https://ror.org/00hj54h04"
OUTPUT_PATH = (
    Path(__file__).resolve().parents[1]
    / "public"
    / "data"
    / "program-catalog"
    / "00hj54h04.json"
)

SCHOOL_NAMES = {
    "architecture": "School of Architecture",
    "business": "Red McCombs School of Business",
    "civic-leadership": "School of Civic Leadership",
    "communication": "Moody College of Communication",
    "education": "College of Education",
    "engineering": "Cockrell School of Engineering",
    "fine-arts": "College of Fine Arts",
    "geosciences": "Jackson School of Geosciences",
    "information": "School of Information",
    "liberal-arts": "College of Liberal Arts",
    "natural-sciences": "College of Natural Sciences",
    "nursing": "School of Nursing",
    "pharmacy": "College of Pharmacy",
    "public-affairs": "LBJ School of Public Affairs",
    "social-work": "Steve Hicks School of Social Work",
}


def clean_text(value: str) -> str:
    return " ".join(value.split())


def stable_id(prefix: str, value: str) -> str:
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]
    return f"{prefix}-{digest}"


def fetch(url: str) -> str:
    request = Request(
        url,
        headers={
            "Accept": "text/html,application/xhtml+xml",
            "User-Agent": "EdvoraProgramSync/1.0 (+https://github.com/RafaelBlackwood)",
        },
    )
    with urlopen(request, timeout=45) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


class UndergraduateProgramParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[tuple[str, str]] = []
        self.current_url = ""
        self.current_text: list[str] = []
        self.capturing = False

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        if tag != "a":
            return

        href = dict(attrs).get("href") or ""
        if href.startswith("https://catalog.utexas.edu/undergraduate/"):
            self.current_url = href.split("#", 1)[0]
            self.current_text = []
            self.capturing = True

    def handle_data(self, data: str) -> None:
        if self.capturing:
            self.current_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag != "a" or not self.capturing:
            return

        label = clean_text("".join(self.current_text))
        if re.search(r"\([A-Za-z][^()]{1,30}\)$", label):
            self.links.append((label, self.current_url))

        self.current_url = ""
        self.current_text = []
        self.capturing = False


class GraduateProgramParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.programs: list[dict[str, str]] = []
        self.school = ""
        self.capture_summary = False
        self.summary_text: list[str] = []
        self.in_row = False
        self.current_row: dict[str, str] = {}
        self.current_field = ""
        self.field_text: list[str] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        values = dict(attrs)

        if tag == "summary":
            self.capture_summary = True
            self.summary_text = []
            return

        if tag == "tr":
            self.in_row = True
            self.current_row = {"school": self.school}
            return

        if tag == "td" and self.in_row:
            header = values.get("headers") or ""
            if "gs-pc-program-title" in header:
                self.current_field = "title"
            elif "gs-pc-degree-description" in header:
                self.current_field = "degree"
            elif "gs-pc-app-deadlines" in header:
                self.current_field = "deadline"
            else:
                self.current_field = ""
            self.field_text = []
            return

        if tag == "a" and self.in_row and self.current_field == "title":
            href = values.get("href") or ""
            if href.startswith("http://"):
                href = "https://" + href.removeprefix("http://")
            if href.startswith("https://"):
                self.current_row["officialUrl"] = href.split("#", 1)[0]

    def handle_data(self, data: str) -> None:
        if self.capture_summary:
            self.summary_text.append(data)
        if self.in_row and self.current_field:
            self.field_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "summary" and self.capture_summary:
            self.school = clean_text("".join(self.summary_text))
            self.capture_summary = False
            self.summary_text = []
            return

        if tag == "td" and self.in_row:
            if self.current_field:
                self.current_row[self.current_field] = clean_text(
                    "".join(self.field_text)
                )
            self.current_field = ""
            self.field_text = []
            return

        if tag == "tr" and self.in_row:
            if self.current_row.get("title") and self.current_row.get("degree"):
                self.programs.append(self.current_row)
            self.in_row = False
            self.current_row = {}


def parse_undergraduate_programs(document: str, updated_at: str) -> list[dict]:
    parser = UndergraduateProgramParser()
    parser.feed(document)
    records: dict[str, dict] = {}

    for label, official_url in parser.links:
        match = re.match(r"^(?P<name>.+?)\s+\((?P<degree>[^()]+)\)$", label)
        if not match:
            continue

        name = clean_text(match.group("name"))
        degree = clean_text(match.group("degree"))
        path_parts = official_url.split("/undergraduate/", 1)[-1].split("/")
        school = SCHOOL_NAMES.get(
            path_parts[0], path_parts[0].replace("-", " ").title()
        )
        level = "Professional" if degree.casefold() == "pharmd" else "Bachelor"
        record = {
            "acceptingApplications": True,
            "applicationDeadline": "See current undergraduate admissions key dates",
            "applicationUrl": UNDERGRADUATE_ADMISSIONS_URL,
            "deliveryMode": "Campus",
            "degree": degree,
            "durationMonths": 48,
            "id": stable_id("ut-undergrad", official_url),
            "language": "English",
            "level": level,
            "name": f"{name} ({degree})",
            "officialUrl": official_url,
            "requirementGroupId": "undergraduate-international",
            "school": school,
            "subject": name,
            "summary": (
                f"Official UT Austin degree plan for {name}. "
                "Major-specific admission materials may apply."
            ),
            "updatedAt": updated_at,
        }
        records[official_url] = record

    return sorted(
        records.values(),
        key=lambda item: (item["name"].casefold(), item["degree"].casefold()),
    )


def credential_level(credential: str) -> str:
    normalized = re.sub(r"[^a-z]", "", credential.casefold())
    if normalized == "mba":
        return "MBA"
    if normalized in {"jd", "llm", "mjs"}:
        return "Law"
    if normalized == "md":
        return "Medicine"
    if normalized == "pharmd":
        return "Professional"
    if normalized.startswith(("phd", "edd", "dnp", "dma", "aud")):
        return "Doctorate"
    if normalized.startswith("m"):
        return "Master"
    return "Graduate"


def parse_graduate_programs(
    document: str, updated_at: str
) -> tuple[list[dict], int]:
    parser = GraduateProgramParser()
    parser.feed(document)
    programs: list[dict] = []

    for row in parser.programs:
        code_match = re.search(r"\s+\((\d{6})\)$", row["title"])
        program_code = code_match.group(1) if code_match else ""
        title = (
            row["title"][: code_match.start()].strip()
            if code_match
            else row["title"].strip()
        )
        official_url = row.get("officialUrl") or GRADUATE_URL
        deadline = row.get("deadline", "")
        credentials = [
            clean_text(item)
            for item in re.split(r"\s*,\s*", row["degree"])
            if clean_text(item)
        ]

        for credential in credentials:
            key = "|".join((program_code, title, credential, official_url))
            programs.append(
                {
                    "acceptingApplications": (
                        "not accepting applications" not in deadline.casefold()
                    ),
                    "applicationDeadline": deadline,
                    "applicationUrl": GRADUATE_APPLICATION_URL,
                    "deliveryMode": "",
                    "degree": credential,
                    "durationMonths": None,
                    "id": stable_id("ut-graduate", key),
                    "language": "English",
                    "level": credential_level(credential),
                    "name": f"{title} - {credential}",
                    "officialUrl": official_url,
                    "requirementGroupId": "graduate",
                    "school": row.get("school", ""),
                    "subject": title,
                    "summary": (
                        f"{row.get('school', 'UT Austin graduate program')}. "
                        "Use the linked program page for its additional materials "
                        "and test policy."
                    ),
                    "updatedAt": updated_at,
                }
            )

    unique_programs = {program["id"]: program for program in programs}
    return (
        sorted(
            unique_programs.values(),
            key=lambda item: (item["name"].casefold(), item["degree"].casefold()),
        ),
        len(parser.programs),
    )


def requirement_groups(updated_at: str) -> list[dict]:
    return [
        {
            "documents": [
                "Application",
                "Essays and short answers",
                "Official SAT or ACT score",
                "High school transcript",
                "English proficiency score when required",
                "Major-specific materials when required",
            ],
            "facts": [
                {
                    "label": "International application fee",
                    "scope": "International freshman applicants",
                    "value": "USD 90; fee waivers are not available",
                },
                {
                    "label": "SAT or ACT",
                    "scope": "International freshman applicants",
                    "value": "At least one official SAT or ACT score",
                },
                {
                    "label": "English proficiency minimum",
                    "scope": "Applicants who are not exempt",
                    "value": "TOEFL 79, IELTS Academic 6.5, or DET 115",
                },
                {
                    "label": "Additional materials",
                    "scope": "Varies by first- and second-choice major",
                    "value": "Confirm major-specific items on the official college page",
                },
            ],
            "id": "undergraduate-international",
            "level": "Bachelor",
            "sourceUrl": UNDERGRADUATE_ADMISSIONS_URL,
            "supportingSourceUrls": [UNDERGRADUATE_ENGLISH_URL],
            "title": "International undergraduate application requirements",
            "updatedAt": updated_at,
        },
        {
            "documents": [
                "Application",
                "Transcripts from every senior college attended",
                "Official GRE or GMAT score when required by the program",
                "Official English proficiency score when required",
                "Program-specific supporting materials",
                "Letters of recommendation when required",
            ],
            "facts": [
                {
                    "label": "Previous degree",
                    "scope": "Graduate admission minimum",
                    "value": (
                        "Bachelor's degree from a regionally accredited US "
                        "institution or a comparable foreign degree"
                    ),
                },
                {
                    "label": "Minimum GPA",
                    "scope": "Graduate admission minimum",
                    "value": (
                        "3.0 on a 4.0 scale, or comparable, in upper-division "
                        "and completed graduate work"
                    ),
                },
                {
                    "label": "English proficiency minimum",
                    "scope": "International applicants who are not exempt",
                    "value": "TOEFL 79, IELTS Academic 6.5, or DET 115",
                },
                {
                    "label": "GRE or GMAT",
                    "scope": "Program-specific",
                    "value": "Required only when stated by the selected program",
                },
                {
                    "label": "Application fee",
                    "scope": "Most graduate programs",
                    "value": (
                        "USD 65 US graduate / USD 90 international; "
                        "MBA USD 200; MPA USD 125"
                    ),
                },
            ],
            "id": "graduate",
            "level": "Graduate",
            "sourceUrl": GRADUATE_ADMISSIONS_URL,
            "supportingSourceUrls": [
                GRADUATE_APPLICATION_URL,
                GRADUATE_ENGLISH_URL,
            ],
            "title": "Graduate admission minimums",
            "updatedAt": updated_at,
        },
    ]


def main() -> None:
    updated_at = datetime.now(timezone.utc).date().isoformat()
    undergraduate_programs = parse_undergraduate_programs(
        fetch(UNDERGRADUATE_URL), updated_at
    )
    graduate_programs, graduate_row_count = parse_graduate_programs(
        fetch(GRADUATE_URL), updated_at
    )

    if len(undergraduate_programs) < 130:
        raise RuntimeError(
            "UT Austin undergraduate parser returned "
            f"{len(undergraduate_programs)} records; expected at least 130."
        )
    if graduate_row_count < 180:
        raise RuntimeError(
            "UT Austin graduate parser returned "
            f"{graduate_row_count} rows; expected at least 180."
        )

    programs = undergraduate_programs + graduate_programs
    payload = {
        "catalogUrl": GRADUATE_URL,
        "institutionId": INSTITUTION_ID,
        "institutionName": "University of Texas at Austin",
        "programs": programs,
        "requirementGroups": requirement_groups(updated_at),
        "sourceCounts": {
            "graduateDirectoryRows": graduate_row_count,
            "graduateProgramCredentials": len(graduate_programs),
            "undergraduateDegreePlans": len(undergraduate_programs),
        },
        "sources": [
            {
                "label": "Undergraduate four-year degree plans",
                "url": UNDERGRADUATE_URL,
            },
            {
                "label": "Graduate degrees and programs",
                "url": GRADUATE_URL,
            },
            {
                "label": "Graduate admission minimums",
                "url": GRADUATE_ADMISSIONS_URL,
            },
        ],
        "sourceUpdatedAt": updated_at,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        "Published "
        f"{len(programs)} UT Austin program credentials "
        f"({len(undergraduate_programs)} undergraduate, "
        f"{len(graduate_programs)} graduate) to {OUTPUT_PATH}."
    )


if __name__ == "__main__":
    main()
