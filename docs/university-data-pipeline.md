# University Data Pipeline

Edvora separates stable institution identity from frequently changing admissions facts. This prevents a tuition update from overwriting an institution record and makes every published value traceable to its source.

## Current Catalog

`scripts/sync_ror_catalog.py` downloads the latest complete Research Organization Registry (ROR) data dump from Zenodo, verifies the published MD5 checksum, and selects active records classified as `education`.

The generated catalog is written to `public/data/university-catalog/`:

- `manifest.json` contains release metadata, total coverage, and country chunk details.
- `index.json` contains the compact worldwide identity and location fields used by browser search.
- `<country-code>.json` contains normalized institutions for one country or territory.
- Each institution retains its ROR ID, names, location, domains, website, establishment year, and source modification date.

The scheduled workflow in `.github/workflows/sync-university-catalog.yml` checks the connected catalog sources daily. When data changes, it commits the updated catalog to `main`; the repository push then triggers the normal Vercel deployment.

Run the same process locally with:

```bash
npm run data:sync
```

The public Zenodo record does not require authentication. A `ZENODO_API_KEY` can be configured in GitHub Actions for higher API limits.

## U.S. Program Offering Index

`scripts/sync_ipeds_program_index.py` discovers the newest year for which NCES publishes both the IPEDS institution directory (`HD`) and program-offering (`CDEP`) files. The committed index currently uses the 2025 release.

The importer:

- joins IPEDS institutions to ROR identities through unique official domains, normalized names, or a high-confidence same-location name match;
- reads only six-digit CIP program rows so institution totals and two-digit subtotals are not double-counted;
- preserves degree-level-to-subject relationships for combined filters;
- maps the IPEDS control field to public, private nonprofit, and private for-profit types;
- rejects a generated index when national or doctoral coverage falls below a safety threshold.

The normalized source snapshot is written to `public/data/program-catalog/ipeds-search-index.json`. `scripts/build_program_search_index.py` merges it with university-owned program catalogs into the browser search index.

Run the refresh locally with:

```bash
npm run data:sync:ipeds
```

IPEDS verifies that a program was reported as offered for its release year. It does not establish current admissions requirements, deadlines, test policies, tuition, or funding; those fields still require a university-owned source.

## Admissions Fact Model

Programs, requirements, deadlines, tuition, scholarships, and intake dates must be stored as source observations rather than fields directly on the institution identity record.

```text
institution
  id, ror_id, official_domain, names, location, status

program
  id, institution_id, official_url, name, level, subject, delivery_mode

source_observation
  id, institution_id, program_id, source_url, fetched_at,
  content_hash, http_status, extractor_version, evidence_snapshot

fact
  id, observation_id, field, normalized_value, raw_value,
  currency, academic_year, effective_from, confidence, review_status
```

Every visible changing value should retain `source_url`, `fetched_at`, `academic_year`, and `confidence`. Conflicting observations are preserved; publication rules choose the newest authoritative value instead of deleting history.

## Search Filter Contract

Search filters are published only when the corresponding field has a defined source and freshness policy.

| Unified search fields | Fields | Authoritative source | Refresh status |
| --- | --- | --- | --- |
| Institution fields | Identity, country, region, founding year, official website | ROR data dump | Automatic daily release check |
| U.S. program offerings | Degree level, broad CIP subject, public/private control | NCES/IPEDS `HD` and `CDEP` complete files | Daily availability check for each annual release |
| Enriched program fields | Named programs, delivery mode, teaching language | Connected official university catalogs | Daily source refresh |
| Admissions requirement fields | Tuition, funding, GPA, language tests, entrance exams, deadlines, research focus | Official university pages or feeds | Requires a published source observation |

The search page presents these field groups in one filter panel and one result list. Identity filters apply across the complete ROR catalog. U.S. degree-level, subject, and institution-type selections include only ROR identities matched to the newest IPEDS reporting or a connected official catalog; unknown values are not treated as matches.

IPEDS program offerings must not be used to infer admissions requirements. Requirement filters remain limited to source-backed university profiles, and records without a published requirement remain discoverable until that criterion is selected.

A changing fact is eligible for publication only when it includes:

- an official source URL associated with the institution's known domain;
- the fetch time and content hash;
- a normalized value and the original evidence;
- an academic year or effective date when the source provides one;
- a confidence score and review status.

## Website Refresh Pipeline

The website ingestion service should run outside the static Vite deployment and use durable storage and a queue:

1. Seed institutions and official domains from ROR.
2. Fetch and evaluate each domain's `robots.txt` before crawling.
3. Discover sitemap indexes and likely admissions, program, fees, funding, and requirements pages.
4. Store raw response metadata and a content hash in object storage.
5. Run source-specific structured extractors before general page extraction.
6. Normalize currencies, academic years, degree levels, tests, GPA scales, and deadlines.
7. Validate changed facts and route low-confidence or conflicting values to review.
8. Publish accepted facts to the search API and university detail pages.
9. Schedule the next check from the field's volatility and observed change rate.

Recommended refresh targets:

| Data | Target refresh |
| --- | --- |
| Deadlines and open intakes | Daily during admissions periods |
| Tuition and program requirements | Weekly |
| Scholarships | Weekly, daily near deadlines |
| Program catalog | Monthly |
| Institution identity and domains | On each ROR release |

The crawler must identify itself, honor the Robots Exclusion Protocol, use per-domain rate limits, back off on errors, and respect website terms and applicable database rights. Sites that prohibit automated access require an official feed, API, data-sharing agreement, or manual review process.

## Production Services Still Required

The static catalog now provides broad institution discovery. Continuously extracting all admissions facts requires a backend with:

- PostgreSQL for canonical records, observations, provenance, and review state.
- Object storage for raw snapshots and extraction evidence.
- A durable crawl queue with per-domain throttling and retry policies.
- Worker processes for discovery, fetching, extraction, normalization, and validation.
- A read API for search, filters, university profiles, and freshness indicators.
- Monitoring for stale sources, crawl failures, schema drift, and suspicious changes.

This architecture can grow country by country without claiming that a single registry or crawler has complete, accreditation-grade coverage of every higher-education provider.
