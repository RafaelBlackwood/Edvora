import { useMemo, useState } from "react";
import { CheckCircle2, Database, ExternalLink, Search } from "lucide-react";
import {
  type UniversityProgramRecord,
  type UniversityProgramSnapshot,
  type UniversityRequirementGroup,
} from "../hooks/useUniversityPrograms";
import { SafeExternalLink } from "./SafeExternalLink";

const inputStyle = {
  background: "rgba(8,13,26,0.72)",
  border: "1px solid rgba(124,106,247,0.2)",
  color: "#e8eaf0",
};

export function createProfiledPrograms(
  names: string[],
  institutionName: string,
): UniversityProgramRecord[] {
  return names.map((name, index) => ({
    acceptingApplications: true,
    applicationDeadline: "Confirm in the official program directory",
    deliveryMode: "",
    durationMonths: null,
    id: `profiled-${index}`,
    language: "",
    level: inferLevel(name),
    name,
    officialUrl: "",
    subject: "",
    summary: `Profiled study area at ${institutionName}; official catalog import pending.`,
    updatedAt: "",
  }));
}

function inferLevel(name: string) {
  const normalized = name.toLocaleLowerCase();
  if (normalized.includes("phd") || normalized.includes("doctoral")) return "Doctorate";
  if (normalized.includes("mba")) return "MBA";
  if (normalized.includes("master") || normalized.includes("msc")) return "Master";
  if (normalized.includes("bachelor") || normalized.includes("bsc")) return "Bachelor";
  return "Other";
}

export function getProgramIntakes(program?: UniversityProgramRecord) {
  if (program?.acceptingApplications === false) return [];

  const now = new Date();
  const intakeYear = now.getMonth() >= 5 ? now.getFullYear() + 1 : now.getFullYear();
  const deadline = program?.applicationDeadline?.toLocaleLowerCase() ?? "";
  const seasons: string[] = [];

  if (deadline.includes("spring")) seasons.push(`Spring ${intakeYear}`);
  if (deadline.includes("summer")) seasons.push(`Summer ${intakeYear}`);
  if (deadline.includes("fall")) seasons.push(`Fall ${intakeYear}`);

  if (seasons.length) return seasons;
  if (program?.level === "Bachelor" || program?.level === "Professional") {
    return [`Summer ${intakeYear}`, `Fall ${intakeYear}`];
  }
  return [`Spring ${intakeYear}`, `Fall ${intakeYear}`];
}

export function findRequirementGroup(
  program: UniversityProgramRecord | undefined,
  snapshot: UniversityProgramSnapshot | null,
) {
  if (!program?.requirementGroupId) return undefined;
  return snapshot?.requirementGroups?.find(
    (group) => group.id === program.requirementGroupId,
  );
}

export function ApplicationProgramStep({
  backendReachable,
  error,
  loading,
  onSelect,
  programs,
  selected,
  snapshot,
}: {
  backendReachable: boolean;
  error: string;
  loading: boolean;
  onSelect: (program: UniversityProgramRecord) => void;
  programs: UniversityProgramRecord[];
  selected: string;
  snapshot: UniversityProgramSnapshot | null;
}) {
  const [level, setLevel] = useState("All levels");
  const [query, setQuery] = useState("");
  const selectedProgram = programs.find((program) => program.name === selected);
  const requirementGroup = findRequirementGroup(selectedProgram, snapshot);
  const levels = useMemo(
    () => Array.from(new Set(programs.map((program) => program.level).filter(Boolean))).sort(),
    [programs],
  );
  const filteredPrograms = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return programs.filter((program) => {
      const matchesLevel = level === "All levels" || program.level === level;
      const searchable = [
        program.name,
        program.degree,
        program.level,
        program.school,
        program.subject,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      return matchesLevel && (!needle || searchable.includes(needle));
    });
  }, [level, programs, query]);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-semibold text-white">Choose a program</h2>
          <p className="text-xs mt-1" style={{ color: "#7885a3" }}>
            {loading
              ? "Loading official catalog..."
              : `${programs.length.toLocaleString()} program credentials`}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs" style={{ color: "#8491ad" }}>
          <Database size={14} />
          {snapshot?.sourceUpdatedAt
            ? `Official sources checked ${snapshot.sourceUpdatedAt}`
            : "Official catalog import pending"}
        </div>
      </div>

      <div className="grid sm:grid-cols-[1fr_180px] gap-2 mb-3">
        <label className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#7180a3" }}
          />
          <span className="sr-only">Search programs</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none"
            style={inputStyle}
            placeholder="Program, degree, or school"
          />
        </label>
        <label>
          <span className="sr-only">Filter by degree level</span>
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={inputStyle}
          >
            <option>All levels</option>
            {levels.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      {!backendReachable && programs.length > 0 && (
        <p className="mb-3 text-xs" style={{ color: "#d2a764" }}>
          Live database offline; showing the verified local snapshot.
        </p>
      )}
      {error && programs.length === 0 && (
        <p role="alert" className="mb-3 text-sm" style={{ color: "#f58a90" }}>
          {error}
        </p>
      )}

      <div className="max-h-[430px] overflow-y-auto pr-1 space-y-2">
        {filteredPrograms.map((program) => {
          const isSelected = selected === program.name;
          const unavailable = program.acceptingApplications === false;
          return (
            <button
              key={program.id}
              type="button"
              disabled={unavailable}
              onClick={() => onSelect(program)}
              className="w-full p-3 rounded-lg text-left hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-55"
              style={{
                background: isSelected ? "rgba(124,106,247,0.15)" : "rgba(8,13,26,0.5)",
                border: `1px solid ${isSelected ? "#716ee0" : "rgba(124,106,247,0.1)"}`,
              }}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <strong className="block text-sm text-white">{program.name}</strong>
                  <span className="block text-xs mt-1" style={{ color: "#7f8ca9" }}>
                    {[program.level, program.school].filter(Boolean).join(" ? ")}
                  </span>
                </span>
                {isSelected && <CheckCircle2 size={17} className="shrink-0" style={{ color: "#4adea8" }} />}
              </span>
              {program.applicationDeadline && (
                <span className="block text-xs mt-2" style={{ color: unavailable ? "#e48a91" : "#caa963" }}>
                  {program.applicationDeadline}
                </span>
              )}
            </button>
          );
        })}
        {!loading && filteredPrograms.length === 0 && (
          <div className="py-10 text-center">
            <p className="text-sm text-white">No matching programs</p>
            <p className="text-xs mt-1" style={{ color: "#7885a3" }}>Try a broader title or another level.</p>
          </div>
        )}
      </div>

      {selectedProgram && (
        <ProgramVerification
          program={selectedProgram}
          requirementGroup={requirementGroup}
          sourceUpdatedAt={snapshot?.sourceUpdatedAt ?? ""}
        />
      )}
    </>
  );
}

function ProgramVerification({
  program,
  requirementGroup,
  sourceUpdatedAt,
}: {
  program: UniversityProgramRecord;
  requirementGroup?: UniversityRequirementGroup;
  sourceUpdatedAt: string;
}) {
  return (
    <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(124,106,247,0.14)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-[11px] uppercase" style={{ color: "#72809f" }}>Selected credential</span>
          <h3 className="text-sm font-semibold text-white mt-1">{program.name}</h3>
          {program.applicationDeadline && (
            <p className="text-xs mt-1" style={{ color: "#caa963" }}>
              Official deadline listing: {program.applicationDeadline}
            </p>
          )}
        </div>
        {program.officialUrl && (
          <SafeExternalLink
            url={program.officialUrl}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs hover:bg-white/10"
          >
            Official program page <ExternalLink size={12} />
          </SafeExternalLink>
        )}
      </div>

      {requirementGroup ? (
        <>
          <div className="grid sm:grid-cols-2 gap-x-5 gap-y-3">
            {requirementGroup.facts.map((fact) => (
              <div key={`${fact.label}-${fact.scope}`}>
                <span className="block text-[11px]" style={{ color: "#71809d" }}>{fact.label}</span>
                <strong className="block text-xs font-medium mt-0.5" style={{ color: "#d7dceb" }}>{fact.value}</strong>
                <small className="block text-[10px] mt-0.5" style={{ color: "#66738f" }}>{fact.scope}</small>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
            <span className="text-[11px]" style={{ color: "#71809d" }}>
              {sourceUpdatedAt ? `Source snapshot ${sourceUpdatedAt}` : requirementGroup.title}
            </span>
            <SafeExternalLink url={requirementGroup.sourceUrl} className="text-xs hover:text-white">
              Admission minimums <ExternalLink size={11} className="inline ml-1" />
            </SafeExternalLink>
          </div>
        </>
      ) : (
        <p className="text-xs leading-relaxed" style={{ color: "#8f9bb8" }}>
          Program-specific requirements have not been imported. Confirm every requirement on the official program page before submission.
        </p>
      )}
    </div>
  );
}
