#!/usr/bin/env python3
"""Build Edvora's global institution identity catalog from the latest ROR dump."""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import tempfile
import urllib.request
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


ZENODO_RECORD_URL = "https://zenodo.org/api/records/6347574"
OUTPUT_DIR = Path("public/data/university-catalog")
USER_AGENT = "Edvora-University-Catalog/1.0 (https://github.com/RafaelBlackwood/Edvora)"


def request(url: str):
    headers = {"Accept": "application/json", "User-Agent": USER_AGENT}
    api_key = os.environ.get("ZENODO_API_KEY")
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    return urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=180)


def download_latest_dump(temp_dir: Path):
    print("Fetching the latest ROR release metadata...")
    with request(ZENODO_RECORD_URL) as response:
        metadata = json.load(response)

    files = metadata.get("files", [])
    archive = next((item for item in files if item.get("key", "").endswith(".zip")), None)
    if not archive:
        raise RuntimeError("The ROR Zenodo record did not contain a ZIP data dump.")

    target = temp_dir / archive["key"]
    expected_md5 = archive.get("checksum", "").removeprefix("md5:")
    digest = hashlib.md5()
    print(f"Downloading {archive['key']}...")
    with request(archive["links"]["self"]) as response, target.open("wb") as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)
            digest.update(chunk)

    if expected_md5 and digest.hexdigest() != expected_md5:
        raise RuntimeError("ROR archive checksum verification failed.")

    return target, metadata, digest.hexdigest()


def find_registry_json(archive: zipfile.ZipFile):
    candidates = [name for name in archive.namelist() if name.lower().endswith(".json")]
    if not candidates:
        raise RuntimeError("The ROR archive did not contain a JSON registry.")

    schema_v2 = [name for name in candidates if "schema_v2" in name.lower()]
    return sorted(schema_v2 or candidates, key=len)[0]


def display_name(record: dict):
    names = record.get("names") or []
    preferred = next((item.get("value") for item in names if "ror_display" in (item.get("types") or [])), None)
    return preferred or record.get("name") or "Unnamed institution"


def aliases(record: dict, selected_name: str):
    values = []
    for item in record.get("names") or []:
        value = item.get("value")
        if value and value != selected_name and value not in values:
            values.append(value)
    return values


def website(record: dict):
    links = record.get("links") or []
    if links and isinstance(links[0], str):
        return links[0]
    selected = next((item.get("value") for item in links if item.get("type") == "website"), None)
    return selected or ""


def normalize(record: dict):
    locations = record.get("locations") or []
    location = locations[0] if locations else {}
    details = location.get("geonames_details") or {}
    name = display_name(record)
    modified = ((record.get("admin") or {}).get("last_modified") or {}).get("date")
    country_code = (details.get("country_code") or "ZZ").upper()

    return {
        "aliases": aliases(record, name),
        "city": details.get("name") or "",
        "coordinates": {
            "lat": details.get("lat"),
            "lng": details.get("lng"),
        },
        "country": details.get("country_name") or "Unknown",
        "countryCode": country_code,
        "domains": record.get("domains") or [],
        "established": record.get("established"),
        "id": record.get("id"),
        "name": name,
        "region": details.get("country_subdivision_name") or "",
        "source": {
            "provider": "ROR",
            "recordUpdated": modified,
            "recordUrl": record.get("id"),
        },
        "website": website(record),
    }


def write_catalog(records: list[dict], metadata: dict, checksum: str):
    grouped = defaultdict(list)
    for record in records:
        grouped[record["countryCode"]].append(record)

    staging = OUTPUT_DIR.parent / ".university-catalog-stage"
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir(parents=True)

    chunks = []
    for country_code, institutions in sorted(grouped.items()):
        institutions.sort(key=lambda item: item["name"].casefold())
        filename = f"{country_code}.json"
        (staging / filename).write_text(
            json.dumps(institutions, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        chunks.append({
            "country": institutions[0]["country"],
            "countryCode": country_code,
            "count": len(institutions),
            "file": filename,
        })

    manifest = {
        "catalogScope": "Active ROR organizations classified as education",
        "countries": chunks,
        "generatedAt": ((metadata.get("metadata") or {}).get("publication_date") or "") + "T00:00:00Z",
        "institutionCount": len(records),
        "license": "CC0-1.0",
        "source": {
            "checksum": f"md5:{checksum}",
            "conceptDoi": metadata.get("conceptdoi"),
            "publicationDate": (metadata.get("metadata") or {}).get("publication_date"),
            "provider": "Research Organization Registry (ROR)",
            "versionDoi": metadata.get("doi"),
        },
    }
    (staging / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    staging.replace(OUTPUT_DIR)
    print(f"Published {len(records):,} institutions across {len(chunks)} country files.")


def main():
    with tempfile.TemporaryDirectory(prefix="edvora-ror-") as directory:
        archive_path, metadata, checksum = download_latest_dump(Path(directory))
        with zipfile.ZipFile(archive_path) as archive:
            registry_name = find_registry_json(archive)
            print(f"Reading {registry_name}...")
            with archive.open(registry_name) as source:
                payload = json.load(source)

    raw_records = payload if isinstance(payload, list) else payload.get("items", [])
    records = [
        normalize(record)
        for record in raw_records
        if record.get("status") == "active" and "education" in (record.get("types") or [])
    ]
    write_catalog(records, metadata, checksum)


if __name__ == "__main__":
    main()
