import { useEffect, useMemo, useState } from "react";
import { BookOpen, Database, Search } from "lucide-react";
import { useNavigate } from "react-router";
import {
  useUniversityPrograms,
  type UniversityProgramRecord,
} from "../hooks/useUniversityPrograms";
import { SafeExternalLink } from "./SafeExternalLink";

const PAGE_SIZE = 18;

function inferLevel(name: string) {
  const normalizedName = name.toLocaleLowerCase();
  if (normalizedName.includes("phd") || normalizedName.includes("doctoral")) return "Doctorate";
  if (normalizedName.includes("master") || normalizedName.includes("msc")) return "Master";
  if (normalizedName.includes("bachelor") || normalizedName.includes("bsc")) return "Bachelor";
  if (normalizedName.includes("mba")) return "MBA";
  return "Other";
}

function formatDuration(months: number | null) {
  if (!months) return "";
  if (months < 12) return `${months} months`;
  if (months % 12 === 0) return `${months / 12} years`;
  return `${Math.floor(months / 12)} years ${months % 12} months`;
}

function toProfiledProgram(name: string, institutionName: string, index: number): UniversityProgramRecord {
  return {
    deliveryMode: "",
    durationMonths: null,
    id: `profiled-${index}`,
    language: "",
    level: inferLevel(name),
    name,
    officialUrl: "",
    subject: "",
    summary: `A profiled study area at ${institutionName}. Confirm the current title, curriculum, and admission rules in the official directory.`,
    updatedAt: "",
  } satisfies UniversityProgramRecord;
}

export function UniversityProgramDirectory({
  applicationUniversityId,
  catalogUrl = "",
  fallbackProgramNames = [],
  institutionId,
  institutionName,
  officialWebsite,
}: {
  applicationUniversityId?: string;
  catalogUrl?: string;
  fallbackProgramNames?: string[];
  institutionId?: string;
  institutionName: string;
  officialWebsite: string;
}) {
  const navigate = useNavigate();
  const { backendReachable, error, loading, programs, snapshot } =
    useUniversityPrograms(institutionId);
  const [level, setLevel] = useState("All levels");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const usingProfiledFallback = programs.length === 0 && fallbackProgramNames.length > 0;
  const availablePrograms = useMemo(
    () =>
      usingProfiledFallback
        ? fallbackProgramNames.map((name, index) =>
            toProfiledProgram(name, institutionName, index),
          )
        : programs,
    [fallbackProgramNames, institutionName, programs, usingProfiledFallback],
  );

  const levels = useMemo(
    () =>
      Array.from(
        new Set(availablePrograms.map((program) => program.level).filter(Boolean)),
      ).sort(),
    [availablePrograms],
  );

  const filteredPrograms = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return availablePrograms.filter((program) => {
      const matchesLevel = level === "All levels" || program.level === level;
      const matchesQuery =
        !normalizedQuery ||
        [program.name, program.level, program.subject, program.summary]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      return matchesLevel && matchesQuery;
    });
  }, [availablePrograms, level, query]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [level, query]);

  const officialCatalogUrl = snapshot?.catalogUrl || catalogUrl || officialWebsite;
  const sourceLabel = snapshot
    ? `Official directory snapshot from ${snapshot.sourceUpdatedAt}`
    : usingProfiledFallback
      ? "Profiled study areas; official catalog import pending"
      : programs.length > 0
        ? "Published program records"
        : "Official catalog import pending";

  return (
    <section className="university-program-directory" aria-labelledby="program-directory-title">
      <div className="program-directory-heading">
        <div>
          <span>Degree directory</span>
          <h2 id="program-directory-title">Programs at {institutionName}</h2>
          <p>
            {loading
              ? "Loading published programs..."
              : `${availablePrograms.length.toLocaleString()} ${
                  usingProfiledFallback ? "profiled areas" : "programs"
                } available`}
          </p>
        </div>
        {officialCatalogUrl && (
          <SafeExternalLink
            url={officialCatalogUrl}
            className="program-directory-official-link glass-interactive"
          >
            Official program directory
          </SafeExternalLink>
        )}
      </div>

      <div className="program-directory-status" aria-live="polite">
        <Database size={14} aria-hidden="true" />
        <span>{sourceLabel}</span>
        {!backendReachable && <small>Live database offline; showing cached records.</small>}
      </div>

      {availablePrograms.length > 0 && (
        <div className="program-directory-toolbar">
          <label className="program-directory-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Search university programs</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by program, degree, or subject"
            />
          </label>
          <label className="program-directory-level">
            <span className="sr-only">Filter programs by level</span>
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              <option>All levels</option>
              {levels.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <span className="program-directory-result-count">
            {filteredPrograms.length.toLocaleString()} results
          </span>
        </div>
      )}

      {!loading && availablePrograms.length === 0 && (
        <div className="program-directory-empty">
          <BookOpen size={20} aria-hidden="true" />
          <h3>Program catalog not published yet</h3>
          <p>
            Edvora has verified this institution, but its official degree directory has
            not been imported. Use the official link for the complete current offering.
            {error ? " The live database is currently unavailable." : ""}
          </p>
        </div>
      )}

      {availablePrograms.length > 0 && filteredPrograms.length === 0 && (
        <div className="program-directory-empty">
          <Search size={20} aria-hidden="true" />
          <h3>No programs match this search</h3>
          <p>Try another degree level or a broader subject term.</p>
        </div>
      )}

      <div className="program-directory-grid">
        {filteredPrograms.slice(0, visibleCount).map((program) => {
          const duration = formatDuration(program.durationMonths);
          return (
            <article className="program-directory-card" key={program.id}>
              <div className="program-directory-card-heading">
                <div>
                  <span>{program.level || "Degree program"}</span>
                  <h3>{program.name}</h3>
                </div>
                {program.subject && <small>{program.subject}</small>}
              </div>

              {program.summary && <p>{program.summary}</p>}
              {program.applicationDeadline && (
                <span className="program-directory-deadline">
                  Application: {program.applicationDeadline}
                </span>
              )}

              <div className="program-directory-meta">
                {program.language && <span>{program.language}</span>}
                {program.deliveryMode && <span>{program.deliveryMode}</span>}
                {duration && <span>{duration}</span>}
              </div>

              <div className="program-directory-card-actions">
                {program.officialUrl ? (
                  <SafeExternalLink url={program.officialUrl}>Program details</SafeExternalLink>
                ) : (
                  <SafeExternalLink url={officialCatalogUrl}>Verify program</SafeExternalLink>
                )}
                {applicationUniversityId && (
                  program.acceptingApplications === false ? (
                    <span className="program-directory-unavailable">Not accepting</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/applications?new=1&university=${encodeURIComponent(
                            applicationUniversityId,
                          )}&program=${encodeURIComponent(program.name)}`,
                        )
                      }
                    >
                      Start application
                    </button>
                  )
                )}
              </div>
            </article>
          );
        })}
      </div>

      {visibleCount < filteredPrograms.length && (
        <button
          type="button"
          className="program-directory-load-more glass-interactive"
          onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
        >
          Show more programs
        </button>
      )}
    </section>
  );
}
