"""Sync TUM's public degree directory into Edvora's lazy program snapshot."""

from __future__ import annotations

import json
import math
import re
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen


BASE_URL = "https://www.tum.de"
CATALOG_URL = f"{BASE_URL}/en/studies/degree-programs"
INSTITUTION_ID = "https://ror.org/02kkvpp62"
OUTPUT_PATH = (
    Path(__file__).resolve().parents[1]
    / "public"
    / "data"
    / "program-catalog"
    / "02kkvpp62.json"
)


class ProgramResultParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.programs: list[dict] = []
        self.current: dict | None = None
        self.capture_field = ""
        self.capture_tag = ""
        self.capture_text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        classes = set((values.get("class") or "").split())

        if tag == "article" and "list-teaser" in classes:
            self.current = {
                "deliveryMode": "",
                "durationMonths": None,
                "id": values.get("id") or "",
                "language": "",
                "level": "",
                "name": "",
                "officialUrl": "",
                "subject": "",
                "summary": "",
                "updatedAt": "",
            }
            return

        if not self.current:
            return

        if tag == "p" and "roofline" in classes:
            self._start_capture("level", tag)
        elif tag == "h3":
            self._start_capture("name", tag)
        elif tag == "p" and not self.current["summary"]:
            self._start_capture("summary", tag)
        elif tag == "a":
            href = values.get("href") or ""
            if "/degree-programs/detail/" in href:
                self.current["officialUrl"] = urljoin(BASE_URL, href)

    def handle_data(self, data: str) -> None:
        if self.capture_field:
            self.capture_text.append(data)

    def handle_endtag(self, tag: str) -> None:
        if self.current and self.capture_field and tag == self.capture_tag:
            value = " ".join("".join(self.capture_text).split())
            self.current[self.capture_field] = value
            self.capture_field = ""
            self.capture_tag = ""
            self.capture_text = []

        if tag == "article" and self.current:
            if self.current["name"] and self.current["officialUrl"]:
                self.programs.append(self.current)
            self.current = None

    def _start_capture(self, field: str, tag: str) -> None:
        self.capture_field = field
        self.capture_tag = tag
        self.capture_text = []


def fetch(url: str) -> str:
    request = Request(
        url,
        headers={
            "Accept": "text/html,application/xhtml+xml",
            "User-Agent": "EdvoraProgramSync/1.0 (+https://github.com/RafaelBlackwood)",
        },
    )
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def parse_programs(document: str) -> list[dict]:
    parser = ProgramResultParser()
    parser.feed(document)
    return parser.programs


def page_url(page: int) -> str:
    if page == 1:
        return CATALOG_URL
    return f"{CATALOG_URL}?tx_solr%5Bpage%5D={page}"


def main() -> None:
    first_document = fetch(page_url(1))
    result_match = re.search(r"([\d,]+)\s+results found", first_document)
    if not result_match:
        raise RuntimeError("TUM program result count was not found.")

    expected_count = int(result_match.group(1).replace(",", ""))
    page_count = math.ceil(expected_count / 10)
    programs: list[dict] = []

    for page in range(1, page_count + 1):
        document = first_document if page == 1 else fetch(page_url(page))
        programs.extend(parse_programs(document))
        if page < page_count:
            time.sleep(0.1)

    unique_programs = {program["id"]: program for program in programs}
    if len(unique_programs) != expected_count:
        raise RuntimeError(
            f"Expected {expected_count} programs but parsed {len(unique_programs)}."
        )

    updated_at = datetime.now(timezone.utc).date().isoformat()
    normalized_programs = sorted(
        (
            {
                **program,
                "officialUrl": program["officialUrl"].split("#", 1)[0],
                "updatedAt": updated_at,
            }
            for program in unique_programs.values()
        ),
        key=lambda program: (program["name"].casefold(), program["level"].casefold()),
    )

    payload = {
        "catalogUrl": CATALOG_URL,
        "institutionId": INSTITUTION_ID,
        "institutionName": "Technical University of Munich",
        "programs": normalized_programs,
        "sourceUpdatedAt": updated_at,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Published {len(normalized_programs)} TUM programs to {OUTPUT_PATH}.")


if __name__ == "__main__":
    main()
