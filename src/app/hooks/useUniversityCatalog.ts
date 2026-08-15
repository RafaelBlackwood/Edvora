import { useEffect, useState } from "react";

export type CatalogCountry = {
  count: number;
  country: string;
  countryCode: string;
  file: string;
};

export type CatalogManifest = {
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

export type CatalogInstitution = {
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

export type CatalogInstitutionDetail = CatalogInstitution & {
  coordinates: {
    lat: number | null;
    lng: number | null;
  };
  domains: string[];
  source: {
    provider: string;
    recordUpdated: string | null;
    recordUrl: string;
  };
};

type CatalogData = {
  institutions: CatalogInstitution[];
  manifest: CatalogManifest;
};

let cachedCatalog: CatalogData | null = null;
let catalogRequest: Promise<CatalogData> | null = null;
const countryCatalogCache = new Map<string, CatalogInstitutionDetail[]>();
const countryCatalogRequests = new Map<string, Promise<CatalogInstitutionDetail[]>>();

function loadCatalog() {
  if (cachedCatalog) return Promise.resolve(cachedCatalog);

  catalogRequest ??= fetch("/data/university-catalog/manifest.json")
    .then((response) => {
      if (!response.ok) throw new Error("Catalog manifest could not be loaded.");
      return response.json() as Promise<CatalogManifest>;
    })
    .then(async (manifest) => {
      const response = await fetch("/data/university-catalog/" + manifest.indexFile);

      if (!response.ok) {
        throw new Error("Worldwide institution index could not be loaded.");
      }

      const institutions = (await response.json()) as CatalogInstitution[];
      cachedCatalog = { institutions, manifest };
      return cachedCatalog;
    })
    .catch((error) => {
      catalogRequest = null;
      throw error;
    });

  return catalogRequest;
}

function loadCountryCatalog(countryCode: string) {
  const normalizedCode = countryCode.toUpperCase();
  const cachedCountry = countryCatalogCache.get(normalizedCode);
  if (cachedCountry) return Promise.resolve(cachedCountry);

  const existingRequest = countryCatalogRequests.get(normalizedCode);
  if (existingRequest) return existingRequest;

  if (!/^[A-Z]{2}$/.test(normalizedCode)) {
    return Promise.reject(new Error("Institution country data is unavailable."));
  }

  const request = fetch(`/data/university-catalog/${normalizedCode}.json`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Full institution record could not be loaded.");
      }

      return response.json() as Promise<CatalogInstitutionDetail[]>;
    })
    .then((institutions) => {
      countryCatalogCache.set(normalizedCode, institutions);
      return institutions;
    })
    .catch((error) => {
      countryCatalogRequests.delete(normalizedCode);
      throw error;
    });

  countryCatalogRequests.set(normalizedCode, request);
  return request;
}

export function useUniversityCatalog() {
  const [data, setData] = useState<CatalogData | null>(cachedCatalog);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!cachedCatalog);

  useEffect(() => {
    let active = true;

    loadCatalog()
      .then((catalog) => {
        if (active) setData(catalog);
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
    institutions: data?.institutions ?? [],
    loading,
    manifest: data?.manifest ?? null,
  };
}

export function useCatalogInstitutionDetail(institution?: CatalogInstitution) {
  const [detail, setDetail] = useState<CatalogInstitutionDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(institution));

  useEffect(() => {
    let active = true;

    if (!institution) {
      setDetail(null);
      setError("");
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError("");

    loadCountryCatalog(institution.countryCode)
      .then((countryInstitutions) => {
        if (!active) return;

        const match = countryInstitutions.find((item) => item.id === institution.id);
        setDetail(match ?? null);
        if (!match) {
          setError("Full institution record is not present in this catalog release.");
        }
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
  }, [institution?.countryCode, institution?.id]);

  return {
    error,
    institution: detail,
    loading,
  };
}
