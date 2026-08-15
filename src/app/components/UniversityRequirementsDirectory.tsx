import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ClipboardCheck,
  Database,
  ExternalLink,
  FileText,
  Search,
} from "lucide-react";
import { useUniversityPrograms } from "../hooks/useUniversityPrograms";
import { SafeExternalLink } from "./SafeExternalLink";

const PAGE_SIZE = 16;

export function UniversityRequirementsDirectory({
  institutionId,
  institutionName,
  officialWebsite,
}: {
  institutionId?: string;
  institutionName: string;
  officialWebsite: string;
}) {
  const { backendReachable, loading, snapshot } =
    useUniversityPrograms(institutionId);
  const [level, setLevel] = useState("All levels");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const groups = snapshot?.requirementGroups ?? [];
  const levels = useMemo(
    () =>
      Array.from(new Set(groups.map((group) => group.level).filter(Boolean))).sort(),
    [groups],
  );
  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return groups.filter((group) => {
      const matchesLevel = level === "All levels" || group.level === level;
      const searchable = [
        group.title,
        group.level,
        ...group.facts.flatMap((fact) => [
          fact.label,
          fact.scope,
          fact.value,
        ]),
        ...group.documents,
      ]
        .join(" ")
        .toLocaleLowerCase();
      return matchesLevel && (!needle || searchable.includes(needle));
    });
  }, [groups, level, query]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [level, query]);

  const sourceLabels = new Map(
    (snapshot?.sources ?? []).map((source) => [source.url, source.label]),
  );

  return (
    <section
      className="university-requirement-directory"
      aria-labelledby="requirement-directory-title"
    >
      <div className="requirement-directory-heading">
        <div>
          <span>Admissions evidence</span>
          <h2 id="requirement-directory-title">
            Program requirements at {institutionName}
          </h2>
          <p>
            {loading
              ? "Loading published requirements..."
              : `${groups.length.toLocaleString()} program requirement records`}
          </p>
        </div>
        {(snapshot?.catalogUrl || officialWebsite) && (
          <SafeExternalLink
            url={snapshot?.catalogUrl || officialWebsite}
            className="program-directory-official-link glass-interactive"
          >
            Official admissions directory
            <ExternalLink size={13} aria-hidden="true" />
          </SafeExternalLink>
        )}
      </div>

      <div className="program-directory-status" aria-live="polite">
        <Database size={14} aria-hidden="true" />
        <span>
          {snapshot?.sourceUpdatedAt
            ? `Official sources checked ${snapshot.sourceUpdatedAt}`
            : "Official requirement import pending"}
        </span>
        {!backendReachable && (
          <small>Live database offline; showing cached records.</small>
        )}
      </div>

      {groups.length > 0 && (
        <div className="program-directory-toolbar">
          <label className="program-directory-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Search admissions requirements</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Program, test, GPA, document, or requirement"
            />
          </label>
          <label className="program-directory-level">
            <span className="sr-only">Filter requirements by degree level</span>
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              <option>All levels</option>
              {levels.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <span className="program-directory-result-count">
            {filteredGroups.length.toLocaleString()} results
          </span>
        </div>
      )}

      {!loading && groups.length === 0 && (
        <div className="program-directory-empty">
          <ClipboardCheck size={20} aria-hidden="true" />
          <h3>Program requirements not imported yet</h3>
          <p>
            Requirements vary by credential and applicant category. Use the
            official admissions directory until a reviewed source snapshot is
            published.
          </p>
        </div>
      )}

      <div className="requirement-directory-list">
        {filteredGroups.slice(0, visibleCount).map((group) => (
          <details className="requirement-directory-card" key={group.id}>
            <summary>
              <span>
                <small>{group.level || "Program-specific"}</small>
                <strong>{group.title}</strong>
              </span>
              <ChevronDown size={17} aria-hidden="true" />
            </summary>

            <div className="requirement-directory-body">
              <div className="requirement-directory-facts">
                {group.facts.map((fact) => (
                  <div key={`${fact.label}-${fact.scope}`}>
                    <span>{fact.label}</span>
                    <strong>{fact.value}</strong>
                    <small>{fact.scope}</small>
                  </div>
                ))}
              </div>

              {group.documents.length > 0 && (
                <div className="requirement-directory-documents">
                  <h3>
                    <FileText size={14} aria-hidden="true" />
                    Published application materials
                  </h3>
                  <div>
                    {group.documents.map((document) => (
                      <span key={document}>{document}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="requirement-directory-sources">
                <SafeExternalLink url={group.sourceUrl}>
                  Official program requirements
                  <ExternalLink size={12} aria-hidden="true" />
                </SafeExternalLink>
                {group.supportingSourceUrls.map((url) => (
                  <SafeExternalLink key={url} url={url}>
                    {sourceLabels.get(url) ?? "Supporting official source"}
                    <ExternalLink size={12} aria-hidden="true" />
                  </SafeExternalLink>
                ))}
                <small>Source checked {group.updatedAt}</small>
              </div>
            </div>
          </details>
        ))}
      </div>

      {visibleCount < filteredGroups.length && (
        <button
          type="button"
          className="program-directory-load-more glass-interactive"
          onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
        >
          Show more requirements
        </button>
      )}
    </section>
  );
}
