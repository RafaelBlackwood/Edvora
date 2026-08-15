import { useEffect, useState } from "react";

export type ProgramSearchRecord = {
  admissionsYear?: number;
  degreeLevels: string[];
  deliveryModes: string[];
  institutionId: string;
  institutionName: string;
  institutionTypes: string[];
  ipedsProgramCount?: number;
  ipedsYear?: number;
  languages: string[];
  officialProgramCount?: number;
  programCount: number;
  programCountsByDegreeLevel: Record<string, number>;
  sourceKinds: string[];
  sourceUpdatedAt: string;
  subjects: string[];
  subjectsByDegreeLevel: Record<string, string[]>;
  testPoliciesByDegreeLevel?: Record<string, string[]>;
};

type ProgramSearchIndex = {
  institutionCount: number;
  programCount: number;
  records: ProgramSearchRecord[];
  sourceUpdatedAt: string;
  version: number;
};

let cachedIndex: ProgramSearchIndex | null = null;
let indexRequest: Promise<ProgramSearchIndex> | null = null;

function loadProgramSearchIndex() {
  if (cachedIndex) return Promise.resolve(cachedIndex);

  indexRequest ??= fetch("/data/program-catalog/search-index.json")
    .then((response) => {
      if (!response.ok) throw new Error("Program search index could not be loaded.");
      return response.json() as Promise<ProgramSearchIndex>;
    })
    .then((index) => {
      cachedIndex = index;
      return index;
    })
    .catch((error) => {
      indexRequest = null;
      throw error;
    });

  return indexRequest;
}

export function useProgramSearchCatalog() {
  const [index, setIndex] = useState<ProgramSearchIndex | null>(cachedIndex);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!cachedIndex);

  useEffect(() => {
    let active = true;

    loadProgramSearchIndex()
      .then((result) => {
        if (active) setIndex(result);
      })
      .catch((reason: Error) => {
        if (active) setError(reason.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    error,
    loading,
    programCount: index?.programCount ?? 0,
    records: index?.records ?? [],
    sourceUpdatedAt: index?.sourceUpdatedAt ?? "",
  };
}
