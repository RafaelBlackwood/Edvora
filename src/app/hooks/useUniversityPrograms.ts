import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type ProgramRequirementFact = {
  label: string;
  scope: string;
  value: string;
};

export type UniversityRequirementGroup = {
  documents: string[];
  facts: ProgramRequirementFact[];
  id: string;
  level: string;
  sourceUrl: string;
  supportingSourceUrls: string[];
  title: string;
  updatedAt: string;
};

export type UniversityProgramSource = {
  label: string;
  url: string;
};

export type UniversityProgramRecord = {
  acceptingApplications?: boolean;
  applicationDeadline?: string;
  applicationUrl?: string;
  degree?: string;
  deliveryMode: string;
  durationMonths: number | null;
  id: string;
  language: string;
  level: string;
  name: string;
  officialUrl: string;
  requirementGroupId?: string;
  school?: string;
  subject: string;
  summary: string;
  updatedAt: string;
};

export type UniversityProgramSnapshot = {
  catalogUrl: string;
  institutionId: string;
  institutionName: string;
  programs: UniversityProgramRecord[];
  requirementGroups?: UniversityRequirementGroup[];
  sourceCounts?: Record<string, number>;
  sources?: UniversityProgramSource[];
  sourceUpdatedAt: string;
};

type ProgramState = {
  backendReachable: boolean;
  error: string;
  institutionId: string;
  loading: boolean;
  programs: UniversityProgramRecord[];
  snapshot: UniversityProgramSnapshot | null;
};

function emptyState(institutionId = "", loading = false): ProgramState {
  return {
    backendReachable: true,
    error: "",
    institutionId,
    loading,
    programs: [],
    snapshot: null,
  };
}

function mapDatabaseProgram(program: {
  delivery_mode: string | null;
  duration_months: number | null;
  id: string;
  language: string | null;
  level: string | null;
  name: string;
  official_url: string;
  subject: string | null;
  updated_at: string;
}): UniversityProgramRecord {
  return {
    deliveryMode: program.delivery_mode ?? "",
    durationMonths: program.duration_months,
    id: program.id,
    language: program.language ?? "",
    level: program.level ?? "",
    name: program.name,
    officialUrl: program.official_url,
    subject: program.subject ?? "",
    summary: "",
    updatedAt: program.updated_at,
  };
}

function mergePrograms(
  databasePrograms: UniversityProgramRecord[],
  snapshotPrograms: UniversityProgramRecord[],
) {
  const records = new Map<string, UniversityProgramRecord>();

  snapshotPrograms.forEach((program) => {
    const key = `${program.name.toLocaleLowerCase()}|${program.level.toLocaleLowerCase()}`;
    records.set(key, program);
  });

  databasePrograms.forEach((program) => {
    const key = `${program.name.toLocaleLowerCase()}|${program.level.toLocaleLowerCase()}`;
    const snapshotProgram = records.get(key);
    records.set(key, {
      ...snapshotProgram,
      ...program,
      summary: program.summary || snapshotProgram?.summary || "",
    });
  });

  return Array.from(records.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

export function useUniversityPrograms(institutionId?: string) {
  const requestedInstitutionId = institutionId ?? "";
  const [state, setState] = useState<ProgramState>(() =>
    emptyState(requestedInstitutionId, Boolean(requestedInstitutionId)),
  );

  useEffect(() => {
    let active = true;

    if (!requestedInstitutionId) {
      setState(emptyState());
      return () => {
        active = false;
      };
    }

    const rorCode = requestedInstitutionId.split("/").pop() ?? "";
    setState(emptyState(requestedInstitutionId, true));

    const snapshotRequest = fetch(`/data/program-catalog/${rorCode}.json`)
      .then((response) => {
        if (response.status === 404) return null;
        if (!response.ok) throw new Error("Official program snapshot could not be loaded.");
        return response.json() as Promise<UniversityProgramSnapshot>;
      })
      .catch(() => null);

    const databaseQuery = supabase
      ? Promise.resolve(
          supabase
            .from("programs")
            .select(
              "id, official_url, name, level, subject, delivery_mode, language, duration_months, updated_at",
            )
            .eq("institution_id", requestedInstitutionId)
            .eq("published", true)
            .order("name"),
        )
      : Promise.resolve({ data: [], error: null });
    const databaseRequest = Promise.race([
      databaseQuery,
      new Promise<{ data: []; error: { message: string } }>((resolve) => {
        window.setTimeout(
          () =>
            resolve({
              data: [],
              error: { message: "Program database request timed out." },
            }),
          2500,
        );
      }),
    ]);

    Promise.all([snapshotRequest, databaseRequest])
      .then(([snapshot, databaseResult]) => {
        if (!active) return;

        const databasePrograms = (databaseResult.data ?? []).map(mapDatabaseProgram);
        const snapshotPrograms = snapshot?.programs ?? [];
        const backendReachable = !databaseResult.error;
        const programs = mergePrograms(databasePrograms, snapshotPrograms);

        setState({
          backendReachable,
          error:
            programs.length === 0 && databaseResult.error
              ? "Published program data is temporarily unavailable."
              : "",
          institutionId: requestedInstitutionId,
          loading: false,
          programs,
          snapshot,
        });
      })
      .catch(() => {
        if (!active) return;

        setState({
          backendReachable: false,
          error: "Published program data is temporarily unavailable.",
          institutionId: requestedInstitutionId,
          loading: false,
          programs: [],
          snapshot: null,
        });
      });

    return () => {
      active = false;
    };
  }, [requestedInstitutionId]);

  if (state.institutionId !== requestedInstitutionId) {
    return emptyState(requestedInstitutionId, Boolean(requestedInstitutionId));
  }

  return state;
}
