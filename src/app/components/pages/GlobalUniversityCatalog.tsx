import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe2,
  Link2,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { SafeExternalLink } from "../SafeExternalLink";

type CatalogCountry = {
  count: number;
  country: string;
  countryCode: string;
  file: string;
};

type CatalogManifest = {
  countries: CatalogCountry[];
  generatedAt: string;
  indexFile: string;
  institutionCount: number;
  source: {
    publicationDate: string;
    provider: string;
    versionDoi: string;
  };
};

type CatalogInstitution = {
  aliases: string[];
  city: string;
  country: string;
  countryCode: string;
  established: number | null;
  id: string;
  name: string;
  region: string;
  website: string;
};

const pageSize = 24;
const currentYear = new Date().getFullYear();

type GlobalUniversityCatalogProps = {
  initialQuery?: string;
};

export function GlobalUniversityCatalog({ initialQuery = "" }: GlobalUniversityCatalogProps) {
  const [manifest, setManifest] = useState<CatalogManifest | null>(null);
  const [institutions, setInstitutions] = useState<CatalogInstitution[]>([]);
  const [countryCode, setCountryCode] = useState("");
  const [query, setQuery] = useState(initialQuery);
  const [region, setRegion] = useState("");
  const [foundedFrom, setFoundedFrom] = useState("");
  const [foundedTo, setFoundedTo] = useState("");
  const [websiteOnly, setWebsiteOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  useEffect(() => {
    let active = true;
    fetch("/data/university-catalog/manifest.json")
      .then((response) => {
        if (!response.ok) throw new Error("Catalog manifest could not be loaded.");
        return response.json() as Promise<CatalogManifest>;
      })
      .then(async (data) => {
        if (!active) return;
        setManifest(data);
        const response = await fetch("/data/university-catalog/" + data.indexFile);

        if (!response.ok) {
          throw new Error("Worldwide institution index could not be loaded.");
        }

        const index = (await response.json()) as CatalogInstitution[];

        if (active) {
          setInstitutions(index);
        }
      })
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const regionNeedle = region.trim().toLocaleLowerCase();
    const minimumYear = foundedFrom ? Number(foundedFrom) : null;
    const maximumYear = foundedTo ? Number(foundedTo) : null;

    return institutions.filter((institution) => {
      if (countryCode && institution.countryCode !== countryCode) return false;
      if (regionNeedle && !institution.region.toLocaleLowerCase().includes(regionNeedle)) return false;
      if (minimumYear && (!institution.established || institution.established < minimumYear)) return false;
      if (maximumYear && (!institution.established || institution.established > maximumYear)) return false;
      if (websiteOnly && !institution.website) return false;
      if (!needle) return true;

      return [institution.name, institution.city, institution.region, ...institution.aliases]
        .some((value) => value.toLocaleLowerCase().includes(needle));
    });
  }, [countryCode, foundedFrom, foundedTo, institutions, query, region, websiteOnly]);

  useEffect(() => setPage(1), [countryCode, foundedFrom, foundedTo, query, region, websiteOnly]);

  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  const visible = results.slice((page - 1) * pageSize, page * pageSize);
  const selectedCountry = manifest?.countries.find((country) => country.countryCode === countryCode);
  const activeFilterCount = [
    countryCode,
    region.trim(),
    foundedFrom,
    foundedTo,
    websiteOnly,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setCountryCode("");
    setRegion("");
    setFoundedFrom("");
    setFoundedTo("");
    setWebsiteOnly(false);
  };

  return (
    <section className="global-university-catalog pb-8" aria-labelledby="global-catalog-heading">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-4">
        <div>
          <span className="text-xs font-semibold uppercase" style={{ color: "#7f8bac" }}>Global directory</span>
          <h2 id="global-catalog-heading" className="text-xl font-bold text-white mt-1" style={{ fontFamily: "var(--font-display)" }}>Universities and education institutions worldwide</h2>
          <p className="text-sm mt-1" style={{ color: "#7180a3" }}>
            {manifest ? manifest.institutionCount.toLocaleString() + " active institutions" : "Loading institution index"}
            {manifest?.source.publicationDate ? " - ROR release " + manifest.source.publicationDate : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "#7180a3" }}><Globe2 size={15} /> {manifest?.countries.length ?? 0} countries and territories</div>
      </div>

      <label className="global-catalog-search">
        <span className="sr-only">Search the worldwide institution directory</span>
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={selectedCountry
            ? "Search institutions in " + selectedCountry.country
            : "Search all " + (manifest?.institutionCount.toLocaleString() ?? "") + " institutions"}
        />
      </label>

      <section className="global-catalog-filters" aria-labelledby="global-filter-heading">
        <div className="global-catalog-filter-heading">
          <div>
            <SlidersHorizontal size={16} aria-hidden="true" />
            <strong id="global-filter-heading">Directory filters</strong>
            {activeFilterCount > 0 && <span>{activeFilterCount} active</span>}
          </div>
          <button
            type="button"
            onClick={resetFilters}
            disabled={activeFilterCount === 0}
            title="Reset directory filters"
          >
            <RotateCcw size={14} aria-hidden="true" />
            Reset
          </button>
        </div>

        <div className="global-catalog-filter-grid">
          <label>
            <span>Country or territory</span>
            <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>
              <option value="">All countries ({manifest?.institutionCount.toLocaleString() ?? 0})</option>
              {(manifest?.countries ?? []).map((country) => (
                <option key={country.countryCode} value={country.countryCode}>
                  {country.country} ({country.count.toLocaleString()})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Region or state</span>
            <span className="global-catalog-input-with-icon">
              <Globe2 size={15} aria-hidden="true" />
              <input
                type="search"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                placeholder="Any region"
              />
            </span>
          </label>

          <label>
            <span>Founded from</span>
            <span className="global-catalog-input-with-icon">
              <CalendarDays size={15} aria-hidden="true" />
              <input
                type="number"
                min="1000"
                max={currentYear}
                inputMode="numeric"
                value={foundedFrom}
                onChange={(event) => setFoundedFrom(event.target.value)}
                placeholder="Any year"
              />
            </span>
          </label>

          <label>
            <span>Founded before</span>
            <span className="global-catalog-input-with-icon">
              <CalendarDays size={15} aria-hidden="true" />
              <input
                type="number"
                min="1000"
                max={currentYear}
                inputMode="numeric"
                value={foundedTo}
                onChange={(event) => setFoundedTo(event.target.value)}
                placeholder="Any year"
              />
            </span>
          </label>

          <label className="global-catalog-website-filter">
            <input
              type="checkbox"
              checked={websiteOnly}
              onChange={(event) => setWebsiteOnly(event.target.checked)}
            />
            <span aria-hidden="true" />
            <Link2 size={15} aria-hidden="true" />
            Official website available
          </label>
        </div>
      </section>

      <div className="global-catalog-result-summary" aria-live="polite">
        <strong>{results.length.toLocaleString()}</strong>
        <span>{results.length === 1 ? "institution" : "institutions"} match</span>
        {selectedCountry && <span>in {selectedCountry.country}</span>}
      </div>

      {error && <div role="alert" className="p-4 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#f58a90" }}>{error}</div>}
      {loading && <div className="p-8 rounded-lg text-center text-sm" style={{ background: "#0d1630", border: "1px solid rgba(124,106,247,0.14)", color: "#7180a3" }}>Loading directory...</div>}

      {!loading && !error && (
        <>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {visible.map((institution) => (
              <article key={institution.id} className="p-4 rounded-lg" style={{ background: "#0d1630", border: "1px solid rgba(124,106,247,0.14)" }}>
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-lg inline-flex items-center justify-center shrink-0" style={{ background: "rgba(124,106,247,0.12)", color: "#a89bf5" }}><Building2 size={17} /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-white leading-snug">{institution.name}</h3>
                    <p className="text-xs mt-1" style={{ color: "#7180a3" }}>{[institution.city, institution.region, institution.country].filter(Boolean).join(", ")}</p>
                    <div className="flex items-center justify-between gap-3 mt-3">
                      <span className="text-xs" style={{ color: "#5f6d8e" }}>{institution.established ? "Est. " + institution.established : "ROR verified identity"}</span>
                      {institution.website && <SafeExternalLink url={institution.website} className="inline-flex items-center gap-1 text-xs hover:text-white" style={{ color: "#a89bf5" }}>Website</SafeExternalLink>}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {!visible.length && <div className="p-8 rounded-lg text-center text-sm" style={{ background: "#0d1630", color: "#7180a3" }}>No institutions match this search.</div>}
          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button type="button" title="Previous page" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="w-9 h-9 inline-flex items-center justify-center rounded-lg disabled:opacity-30 hover:bg-white/10" style={{ border: "1px solid rgba(124,106,247,0.2)", color: "#a89bf5" }}><ChevronLeft size={17} /></button>
              <span className="text-xs" style={{ color: "#7180a3" }}>Page {page} of {pageCount} - {results.length.toLocaleString()} results</span>
              <button type="button" title="Next page" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="w-9 h-9 inline-flex items-center justify-center rounded-lg disabled:opacity-30 hover:bg-white/10" style={{ border: "1px solid rgba(124,106,247,0.2)", color: "#a89bf5" }}><ChevronRight size={17} /></button>
            </div>
          )}
        </>
      )}

      {manifest?.source.versionDoi && (
        <a href={"https://doi.org/" + manifest.source.versionDoi} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 mt-4 text-xs hover:text-white" style={{ color: "#647293" }}>
          Research Organization Registry - CC0 <ExternalLink size={12} />
        </a>
      )}
    </section>
  );
}
