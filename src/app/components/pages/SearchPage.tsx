import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowRight,
  Award,
  Banknote,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GitCompare,
  Globe2,
  Heart,
  LayoutGrid,
  List,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { universities } from "../../data/mockData";
import { getUniversitySourceData } from "../../data/universitySourceData";
import {
  useProgramSearchCatalog,
  type ProgramSearchRecord,
} from "../../hooks/useProgramSearchCatalog";
import {
  useUniversityCatalog,
  type CatalogInstitution,
} from "../../hooks/useUniversityCatalog";
import { useAppData } from "../../providers/AppDataProvider";
import { SafeExternalLink } from "../SafeExternalLink";
import { UniversityLogo } from "../UniversityLogo";

type University = (typeof universities)[number];
type ViewMode = "grid" | "list";
type SortMode =
  | "match"
  | "ranking"
  | "tuition"
  | "acceptance"
  | "scholarship"
  | "international";

type GpaSystem = "us4" | "fivePoint" | "tenPoint" | "twentyPoint" | "percentage" | "german";
type EnglishTest = "ielts" | "toefl" | "pte" | "duolingo";

type ScoreScale = {
  decimals: number;
  defaultScore: number;
  label: string;
  max: number;
  min: number;
  step: number;
};

type UniversitySearchMetadata = {
  applicationMethods: string[];
  deliveryModes: string[];
  funding: string[];
  institutionTypes: string[];
  portfolioRequired: boolean;
  researchFocus: string[];
};

type ListFilters = {
  applicationMethods: string[];
  countries: string[];
  degreeLevels: string[];
  deliveryModes: string[];
  funding: string[];
  institutionTypes: string[];
  intakes: string[];
  researchFocus: string[];
  subjects: string[];
  testPreferences: string[];
};

type Filters = ListFilters & {
  admissionsDataOnly: boolean;
  englishOnly: boolean;
  englishTest: EnglishTest;
  englishTestScore: number;
  foundedFrom: string;
  foundedTo: string;
  gpaScore: number;
  gpaSystem: GpaSystem;
  maxRanking: number;
  maxTuition: number;
  minInternational: number;
  region: string;
  scholarshipOnly: boolean;
  tuitionFreeOnly: boolean;
  websiteOnly: boolean;
};

type ListFilterKey = keyof ListFilters;

const ECB_EUR_REFERENCE_RATES: Record<string, number> = {
  CAD: 1.6026,
  EUR: 1,
  GBP: 0.85388,
  PLN: 4.3155,
  SEK: 11.055,
  USD: 1.1377,
};
const ECB_REFERENCE_DATE = "24 July 2026";
const ECB_REFERENCE_URL =
  "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html";

function getAnnualTuition(university: University) {
  return getUniversitySourceData(university.id)?.tuition.annualFilterAmount ?? university.tuition;
}

function getAnnualTuitionCurrency(university: University) {
  return getUniversitySourceData(university.id)?.tuition.currency ?? university.currency;
}

function getAnnualTuitionUsd(university: University) {
  const amount = getAnnualTuition(university);
  const unitsPerEuro = ECB_EUR_REFERENCE_RATES[getAnnualTuitionCurrency(university)];
  if (!unitsPerEuro) return amount;

  return Math.round((amount / unitsPerEuro) * ECB_EUR_REFERENCE_RATES.USD);
}

function formatUsdEstimate(amount: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

const MAX_TUITION =
  Math.ceil(Math.max(...universities.map(getAnnualTuitionUsd)) / 5000) * 5000;
const MAX_RANKING = 500;

const PAGE_SIZE = 24;
const gpaSystems: Record<GpaSystem, ScoreScale> = {
  us4: { decimals: 1, defaultScore: 4, label: "US / Canada GPA (4.0)", max: 4, min: 2, step: 0.1 },
  fivePoint: { decimals: 1, defaultScore: 5, label: "Five-point GPA (5.0)", max: 5, min: 2.5, step: 0.1 },
  tenPoint: { decimals: 1, defaultScore: 10, label: "CGPA (10.0)", max: 10, min: 5, step: 0.1 },
  twentyPoint: { decimals: 1, defaultScore: 20, label: "European grade (20)", max: 20, min: 10, step: 0.5 },
  percentage: { decimals: 0, defaultScore: 100, label: "Percentage (100)", max: 100, min: 50, step: 1 },
  german: { decimals: 1, defaultScore: 1, label: "German grade (1.0 best)", max: 4, min: 1, step: 0.1 },
};

const englishTests: Record<EnglishTest, ScoreScale> = {
  ielts: { decimals: 1, defaultScore: 9, label: "IELTS Academic", max: 9, min: 4, step: 0.5 },
  toefl: { decimals: 0, defaultScore: 120, label: "TOEFL iBT", max: 120, min: 30, step: 1 },
  pte: { decimals: 0, defaultScore: 90, label: "PTE Academic", max: 90, min: 30, step: 1 },
  duolingo: { decimals: 0, defaultScore: 160, label: "Duolingo English Test", max: 160, min: 60, step: 5 },
};

function toFourPointGpa(system: GpaSystem, score: number) {
  if (system === "german") return 4 - ((score - 1) / 3) * 2;
  return (score / gpaSystems[system].max) * 4;
}

function toIeltsEquivalent(test: EnglishTest, score: number) {
  if (test === "ielts") return score;
  if (score >= englishTests[test].max) return 9;

  if (test === "toefl") {
    if (score >= 100) return 7.5;
    if (score >= 94) return 7;
    if (score >= 79) return 6.5;
    if (score >= 60) return 6;
    return score >= 46 ? 5.5 : 5;
  }

  if (test === "pte") {
    if (score >= 76) return 7.5;
    if (score >= 66) return 7;
    if (score >= 58) return 6.5;
    if (score >= 50) return 6;
    return score >= 42 ? 5.5 : 5;
  }

  if (score >= 135) return 7.5;
  if (score >= 125) return 7;
  if (score >= 115) return 6.5;
  if (score >= 105) return 6;
  return score >= 95 ? 5.5 : 5;
}

const defaultFilters: Filters = {
  admissionsDataOnly: false,
  applicationMethods: [],
  countries: [],
  degreeLevels: [],
  deliveryModes: [],
  englishOnly: false,
  englishTest: "ielts",
  englishTestScore: englishTests.ielts.defaultScore,
  foundedFrom: "",
  foundedTo: "",
  funding: [],
  gpaScore: gpaSystems.us4.defaultScore,
  gpaSystem: "us4",
  institutionTypes: [],
  intakes: [],
  maxRanking: MAX_RANKING,
  maxTuition: MAX_TUITION,
  minInternational: 0,
  region: "",
  researchFocus: [],
  scholarshipOnly: false,
  subjects: [],
  testPreferences: [],
  tuitionFreeOnly: false,
  websiteOnly: false,
};

const metadataByUniversity: Record<string, UniversitySearchMetadata> = {
  "1": {
    applicationMethods: ["Direct application"],
    deliveryModes: ["On campus", "Hybrid"],
    funding: ["Merit scholarships", "Research assistantships", "Need-based aid", "Fee waivers"],
    institutionTypes: ["Public", "Research-intensive"],
    portfolioRequired: true,
    researchFocus: ["AI and machine learning", "Data and analytics", "Human-computer interaction", "Health technology"],
  },
  "2": {
    applicationMethods: ["Direct application", "Uni-Assist"],
    deliveryModes: ["On campus", "Hybrid"],
    funding: ["Merit scholarships", "Research assistantships", "Tuition-free study"],
    institutionTypes: ["Public", "Technical university", "Research-intensive"],
    portfolioRequired: false,
    researchFocus: ["AI and machine learning", "Robotics", "Software and systems", "Engineering"],
  },
  "3": {
    applicationMethods: ["Direct application", "UCAS"],
    deliveryModes: ["On campus", "Online"],
    funding: ["Merit scholarships", "Need-based aid", "Teaching assistantships"],
    institutionTypes: ["Public", "Research-intensive"],
    portfolioRequired: false,
    researchFocus: ["AI and machine learning", "Data and analytics", "Engineering", "Business and economics"],
  },
  "4": {
    applicationMethods: ["Direct application", "Studielink"],
    deliveryModes: ["On campus", "Hybrid"],
    funding: ["Merit scholarships", "Need-based aid"],
    institutionTypes: ["Public", "Research-intensive"],
    portfolioRequired: true,
    researchFocus: ["AI and machine learning", "Data and analytics", "Human-computer interaction", "Social sciences"],
  },
  "5": {
    applicationMethods: ["Direct application"],
    deliveryModes: ["On campus"],
    funding: ["Merit scholarships", "Fee waivers"],
    institutionTypes: ["Public", "Research-intensive"],
    portfolioRequired: false,
    researchFocus: ["Data and analytics", "Software and systems", "Business and economics", "Humanities"],
  },
  "6": {
    applicationMethods: ["Direct application"],
    deliveryModes: ["On campus", "Hybrid"],
    funding: [
      "Merit scholarships",
      "Fellowships and grants",
      "Research assistantships",
      "Need-based aid",
    ],
    institutionTypes: ["Public", "Research-intensive"],
    portfolioRequired: true,
    researchFocus: ["AI and machine learning", "Human-computer interaction", "Health technology", "Engineering"],
  },
  "7": {
    applicationMethods: ["Direct application"],
    deliveryModes: ["On campus", "Hybrid"],
    funding: ["Merit scholarships", "Fee waivers"],
    institutionTypes: ["Public", "Technical university"],
    portfolioRequired: true,
    researchFocus: ["Software and systems", "Engineering", "Robotics", "Design"],
  },
  "8": {
    applicationMethods: ["Direct application"],
    deliveryModes: ["On campus", "Hybrid"],
    funding: ["Merit scholarships", "Research assistantships", "Teaching assistantships", "Fee waivers"],
    institutionTypes: ["Public", "Research-intensive"],
    portfolioRequired: false,
    researchFocus: ["AI and machine learning", "Data and analytics", "Information science", "Health technology"],
  },
  "9": {
    applicationMethods: ["University Admissions Sweden"],
    deliveryModes: ["On campus", "Hybrid"],
    funding: ["Merit scholarships", "Research assistantships"],
    institutionTypes: ["Public", "Research-intensive"],
    portfolioRequired: false,
    researchFocus: ["Engineering", "Health technology", "Social sciences", "Sustainability"],
  },
  "10": {
    applicationMethods: ["Common App", "Direct application"],
    deliveryModes: ["On campus", "Online"],
    funding: [
      "Merit scholarships",
      "Fellowships and grants",
      "Research assistantships",
      "Teaching assistantships",
      "Need-based aid",
    ],
    institutionTypes: ["Public", "Research-intensive"],
    portfolioRequired: false,
    researchFocus: ["AI and machine learning", "Data and analytics", "Software and systems", "Business and economics"],
  },
};

const coreDegreeLevels = ["Bachelor's / BS", "Master's / MS", "Doctorate / PhD"];
const degreeLevelsByUniversity: Record<string, string[]> = {
  "1": [...coreDegreeLevels, "MBA / EMBA", "Professional degree"],
  "2": [...coreDegreeLevels, "MBA / EMBA"],
  "3": [...coreDegreeLevels, "MBA / EMBA"],
  "4": [...coreDegreeLevels, "MBA / EMBA"],
  "5": [...coreDegreeLevels, "MBA / EMBA"],
  "6": [...coreDegreeLevels, "MBA / EMBA", "Professional degree"],
  "7": [...coreDegreeLevels, "MBA / EMBA"],
  "8": [...coreDegreeLevels, "MBA / EMBA", "Professional degree"],
  "9": coreDegreeLevels,
  "10": [...coreDegreeLevels, "MBA / EMBA", "Professional degree"],
};

const degreeLevels = [
  "Certificate",
  "Diploma",
  "Associate",
  "Bachelor's / BS",
  "Master's / MS",
  "MBA / EMBA",
  "Doctorate / PhD",
  "Professional degree",
  "Foundation / pathway",
  "Postgraduate certificate",
];
const subjects = [
  "Agriculture and forestry",
  "Architecture and design",
  "Arts and creative studies",
  "Business and management",
  "Computer science and IT",
  "Data science and artificial intelligence",
  "Education",
  "Engineering",
  "Environmental and earth sciences",
  "Health and medicine",
  "Hospitality and tourism",
  "Humanities and languages",
  "Law",
  "Mathematics and statistics",
  "Natural sciences",
  "Social and behavioral sciences",
];
const researchFocus = [
  "AI and machine learning",
  "Data and analytics",
  "Human-computer interaction",
  "Software and systems",
  "Robotics",
  "Engineering",
  "Business and economics",
  "Health technology",
  "Information science",
  "Social sciences",
  "Sustainability",
  "Design",
  "Humanities",
];
const fundingOptions = [
  "Full scholarships",
  "Merit scholarships",
  "Need-based aid",
  "Government funding",
  "University funding",
  "External and private funding",
  "Fellowships and grants",
  "Research assistantships",
  "Teaching assistantships",
  "Student loans",
  "Work-study",
  "Tuition waivers",
  "Fee waivers",
  "Tuition-free study",
];
const institutionTypes = [
  "Public",
  "Private",
  "Private nonprofit",
  "Private for-profit",
  "Technical university",
  "Research-intensive",
  "Liberal arts college",
  "Community college",
  "Online university",
  "Specialized or professional school",
];
const deliveryModes = ["On campus", "Hybrid", "Online"];
const applicationMethods = [
  "Direct application",
  "Uni-Assist",
  "UCAS",
  "Studielink",
  "Common App",
  "University Admissions Sweden",
];
const testPreferences = [
  "GRE required",
  "GRE not required",
  "GMAT required",
  "GMAT not required",
  "SAT or ACT required",
  "Test optional",
  "Portfolio required",
  "Portfolio not required",
];
const intakeOptions = ["Fall", "Spring", "Summer"];

const countryCodes: Record<string, string> = {
  Canada: "CA",
  Germany: "DE",
  Italy: "IT",
  Netherlands: "NL",
  Poland: "PL",
  Sweden: "SE",
  "United Kingdom": "UK",
  "United States": "US",
};

function getMetadata(university: University) {
  return (
    metadataByUniversity[university.id] ?? {
      applicationMethods: ["Direct application"],
      deliveryModes: ["On campus"],
      funding: university.scholarshipAvailable ? ["Merit scholarships"] : [],
      institutionTypes: [university.type],
      portfolioRequired: false,
      researchFocus: university.strengths,
    }
  );
}

function getDegreeLevels(university: University) {
  const levels = new Set<string>(degreeLevelsByUniversity[university.id] ?? []);

  university.programs.forEach((program) => {
    const normalized = program.toLowerCase();
    if (normalized.includes("certificate")) {
      levels.add(normalized.includes("postgraduate") ? "Postgraduate certificate" : "Certificate");
    }
    if (normalized.includes("diploma")) levels.add("Diploma");
    if (normalized.includes("associate")) levels.add("Associate");
    if (normalized.includes("bachelor") || /\bbs\b/.test(normalized)) {
      levels.add("Bachelor's / BS");
    }
    if (normalized.includes("mba")) levels.add("MBA / EMBA");
    if (normalized.includes("msc") || normalized.includes("master") || /\bms\b/.test(normalized)) {
      levels.add("Master's / MS");
    }
    if (normalized.includes("phd") || normalized.includes("doctor")) {
      levels.add("Doctorate / PhD");
    }
    if (/\b(jd|md|dds|dvm)\b/.test(normalized)) levels.add("Professional degree");
    if (normalized.includes("foundation") || normalized.includes("pathway")) {
      levels.add("Foundation / pathway");
    }
  });

  return Array.from(levels);
}

function getSubjects(university: University) {
  const searchable = [...university.programs, ...university.strengths].join(" ").toLowerCase();
  const matched = new Set<string>();

  if (/agricultur|forestry/.test(searchable)) matched.add("Agriculture and forestry");
  if (/architect|design|urban planning/.test(searchable)) matched.add("Architecture and design");
  if (/arts?|creative/.test(searchable)) matched.add("Arts and creative studies");
  if (/business|management|econom|analytics/.test(searchable)) {
    matched.add("Business and management");
  }
  if (/computer|software|information science|technology/.test(searchable)) {
    matched.add("Computer science and IT");
  }
  if (/data science|artificial intelligence|\bai\b|machine learning/.test(searchable)) {
    matched.add("Data science and artificial intelligence");
  }
  if (/education|teaching/.test(searchable)) matched.add("Education");
  if (/engineer|robotics/.test(searchable)) matched.add("Engineering");
  if (/environment|earth|sustainability/.test(searchable)) {
    matched.add("Environmental and earth sciences");
  }
  if (/medicine|medical|health|biological/.test(searchable)) matched.add("Health and medicine");
  if (/hospitality|tourism/.test(searchable)) matched.add("Hospitality and tourism");
  if (/humanit|language|literature|history/.test(searchable)) {
    matched.add("Humanities and languages");
  }
  if (/\blaw\b|legal/.test(searchable)) matched.add("Law");
  if (/mathemat|statistic/.test(searchable)) matched.add("Mathematics and statistics");
  if (/natural science|physics|chemistry/.test(searchable)) matched.add("Natural sciences");
  if (/social science|psychology|behavior/.test(searchable)) {
    matched.add("Social and behavioral sciences");
  }

  return Array.from(matched);
}

function hasSelectedValue(selected: string[], available: Iterable<string>) {
  const availableValues = new Set(available);
  return selected.length === 0 || selected.some((value) => availableValues.has(value));
}

function matchesBinaryPreference(
  selected: string[],
  requiredLabel: string,
  notRequiredLabel: string,
  actual: boolean,
) {
  const relevant = selected.filter(
    (value) => value === requiredLabel || value === notRequiredLabel,
  );

  return (
    relevant.length === 0 ||
    relevant.some((value) => (value === requiredLabel ? actual : !actual))
  );
}

function matchesTestPreferences(
  university: University,
  metadata: UniversitySearchMetadata,
  selected: string[],
) {
  if (
    !matchesBinaryPreference(
      selected,
      "GRE required",
      "GRE not required",
      university.greRequired,
    )
  ) {
    return false;
  }
  if (
    !matchesBinaryPreference(
      selected,
      "GMAT required",
      "GMAT not required",
      university.gmatRequired,
    )
  ) {
    return false;
  }
  if (
    !matchesBinaryPreference(
      selected,
      "Portfolio required",
      "Portfolio not required",
      metadata.portfolioRequired,
    )
  ) {
    return false;
  }

  const generalTestPolicies = selected.filter(
    (value) => value === "SAT or ACT required" || value === "Test optional",
  );
  if (
    generalTestPolicies.length > 0 &&
    !generalTestPolicies.some((value) =>
      value === "SAT or ACT required"
        ? university.id === "10"
        : !university.greRequired && !university.gmatRequired,
    )
  ) {
    return false;
  }

  return true;
}

function matchesProgramFilters(
  university: University | undefined,
  programRecord: ProgramSearchRecord | undefined,
  filters: Filters,
) {
  const metadata = university ? getMetadata(university) : undefined;
  const availableDegreeLevels = [
    ...(university ? getDegreeLevels(university) : []),
    ...(programRecord?.degreeLevels ?? []),
  ];
  const availableSubjects = [
    ...(university ? getSubjects(university) : []),
    ...(programRecord?.subjects ?? []),
  ];
  const availableDeliveryModes = [
    ...(metadata?.deliveryModes ?? []),
    ...(programRecord?.deliveryModes ?? []),
  ];

  if (!hasSelectedValue(filters.degreeLevels, availableDegreeLevels)) return false;
  if (!hasSelectedValue(filters.subjects, availableSubjects)) return false;
  if (!hasSelectedValue(filters.deliveryModes, availableDeliveryModes)) return false;

  if (filters.englishOnly) {
    const hasEnglishPrograms =
      Boolean(university?.englishTaught) ||
      Boolean(
        programRecord?.languages.some((language) =>
          language.toLocaleLowerCase().includes("english"),
        ),
      );
    if (!hasEnglishPrograms) return false;
  }

  return true;
}

function requiresProfileData(filters: Filters) {
  return (
    filters.researchFocus.length > 0 ||
    filters.funding.length > 0 ||
    filters.institutionTypes.length > 0 ||
    filters.applicationMethods.length > 0 ||
    filters.intakes.length > 0 ||
    filters.testPreferences.length > 0 ||
    filters.maxTuition < MAX_TUITION ||
    filters.maxRanking < MAX_RANKING ||
    filters.gpaScore !== gpaSystems[filters.gpaSystem].defaultScore ||
    filters.englishTestScore !== englishTests[filters.englishTest].defaultScore ||
    filters.minInternational > 0 ||
    filters.scholarshipOnly ||
    filters.tuitionFreeOnly
  );
}


function normalizeUniversityName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^the\s+/i, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function getCatalogProfile(institution: CatalogInstitution) {
  const catalogNames = [institution.name, ...institution.aliases].map(normalizeUniversityName);
  return universities.find((university) =>
    catalogNames.includes(normalizeUniversityName(university.name)),
  );
}

function getCatalogRoute(institution: CatalogInstitution, profile?: University) {
  if (profile) return "/university/" + profile.id;
  return "/university/ror-" + institution.id.split("/").pop();
}

function formatTuition(university: University) {
  const sourceData = getUniversitySourceData(university.id);
  if (sourceData) return sourceData.tuition.amountLabel;
  if (university.tuition === 0) return "No tuition";

  return (
    new Intl.NumberFormat("en", {
      currency: university.currency,
      maximumFractionDigits: 0,
      style: "currency",
    }).format(university.tuition) + " / year"
  );
}

function FilterSection({
  children,
  defaultOpen = true,
  title,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={"search-filter-section " + (isOpen ? "is-open" : "")}>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{title}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {isOpen && <div className="search-filter-section-body">{children}</div>}
    </section>
  );
}

function CheckboxList({
  onToggle,
  options,
  selected,
}: {
  onToggle: (value: string) => void;
  options: string[];
  selected: string[];
}) {
  return (
    <div className="search-checkbox-list">
      {options.map((option) => {
        const checked = selected.includes(option);

        return (
          <label className={checked ? "is-checked" : ""} key={option}>
            <input type="checkbox" checked={checked} onChange={() => onToggle(option)} />
            <span className="search-checkbox-box">{checked && <Check size={11} aria-hidden="true" />}</span>
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );
}

function SearchableCheckboxList({
  onToggle,
  options,
  placeholder,
  selected,
}: {
  onToggle: (value: string) => void;
  options: string[];
  placeholder: string;
  selected: string[];
}) {
  const [filterQuery, setFilterQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const normalizedQuery = filterQuery.trim().toLowerCase();
  const orderedOptions = [
    ...selected.filter((option) => options.includes(option)),
    ...options.filter((option) => !selected.includes(option)),
  ];
  const matchingOptions = normalizedQuery
    ? orderedOptions.filter((option) => option.toLowerCase().includes(normalizedQuery))
    : orderedOptions;
  const visibleOptions = normalizedQuery || showAll
    ? matchingOptions
    : matchingOptions.slice(0, 12);

  return (
    <div className="search-filter-option-search">
      <label>
        <Search size={13} aria-hidden="true" />
        <span className="sr-only">{placeholder}</span>
        <input
          type="search"
          value={filterQuery}
          onChange={(event) => setFilterQuery(event.target.value)}
          placeholder={placeholder}
        />
      </label>
      <CheckboxList options={visibleOptions} selected={selected} onToggle={onToggle} />
      {!normalizedQuery && matchingOptions.length > 12 && (
        <button type="button" onClick={() => setShowAll((current) => !current)}>
          {showAll ? "Show fewer" : "Show all " + matchingOptions.length}
          <ChevronDown
            size={12}
            aria-hidden="true"
            style={{ transform: showAll ? "rotate(180deg)" : undefined }}
          />
        </button>
      )}
      {normalizedQuery && visibleOptions.length === 0 && (
        <span className="search-filter-no-options">No matching options</span>
      )}
    </div>
  );
}

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    error: catalogError,
    institutions,
    loading: catalogLoading,
    manifest,
  } = useUniversityCatalog();
  const { records: programSearchRecords } = useProgramSearchCatalog();
  const {
    clearCompareUniversities,
    compareUniversityIds,
    isUniversitySaved,
    toggleUniversityCompare,
    toggleUniversitySave,
  } = useAppData();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sortMode, setSortMode] = useState<SortMode>("match");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(1);
  const compareUniversities = universities.filter((university) =>
    compareUniversityIds.includes(university.id),
  );

  const toggleListFilter = (key: ListFilterKey, value: string) => {
    setFilters((current) => {
      const values = current[key];

      return {
        ...current,
        [key]: values.includes(value)
          ? values.filter((candidate) => candidate !== value)
          : [...values, value],
      };
    });
  };

  const removeListFilter = (key: ListFilterKey, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: current[key].filter((candidate) => candidate !== value),
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setQuery("");
  };

  const admissionsFiltersActive = useMemo(
    () =>
      filters.admissionsDataOnly ||
      filters.degreeLevels.length > 0 ||
      filters.subjects.length > 0 ||
      filters.researchFocus.length > 0 ||
      filters.funding.length > 0 ||
      filters.institutionTypes.length > 0 ||
      filters.deliveryModes.length > 0 ||
      filters.applicationMethods.length > 0 ||
      filters.intakes.length > 0 ||
      filters.testPreferences.length > 0 ||
      filters.maxTuition < MAX_TUITION ||
      filters.maxRanking < MAX_RANKING ||
      filters.gpaScore !== gpaSystems[filters.gpaSystem].defaultScore ||
      filters.englishTestScore !== englishTests[filters.englishTest].defaultScore ||
      filters.minInternational > 0 ||
      filters.englishOnly ||
      filters.scholarshipOnly ||
      filters.tuitionFreeOnly,
    [filters],
  );

  const countryOptions = useMemo(
    () => (manifest?.countries ?? []).map((country) => country.country),
    [manifest],
  );


  const filteredUniversities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return universities
      .filter((university) => {
        const metadata = getMetadata(university);
        const searchableText = [
          university.name,
          university.city,
          university.country,
          university.description,
          ...university.programs,
          ...university.strengths,
          ...metadata.researchFocus,
        ]
          .join(" ")
          .toLowerCase();

        if (normalizedQuery && !searchableText.includes(normalizedQuery)) return false;
        if (filters.countries.length && !filters.countries.includes(university.country)) return false;
        if (
          filters.researchFocus.length &&
          !filters.researchFocus.some((focus) => metadata.researchFocus.includes(focus))
        ) {
          return false;
        }
        if (
          filters.funding.length &&
          !filters.funding.some((funding) => metadata.funding.includes(funding))
        ) {
          return false;
        }
        if (
          filters.institutionTypes.length &&
          !filters.institutionTypes.some((type) => metadata.institutionTypes.includes(type))
        ) {
          return false;
        }
        if (
          filters.applicationMethods.length &&
          !filters.applicationMethods.some((method) => metadata.applicationMethods.includes(method))
        ) {
          return false;
        }
        if (
          filters.intakes.length &&
          !filters.intakes.some((intake) => university.intakes.includes(intake))
        ) {
          return false;
        }
        if (getAnnualTuitionUsd(university) > filters.maxTuition) return false;
        if (university.ranking > filters.maxRanking) return false;
        if (university.gpaMin > toFourPointGpa(filters.gpaSystem, filters.gpaScore)) {
          return false;
        }
        if (
          university.ieltsMin >
          toIeltsEquivalent(filters.englishTest, filters.englishTestScore)
        ) {
          return false;
        }
        if (university.internationalPercent < filters.minInternational) return false;
        if (filters.scholarshipOnly && !university.scholarshipAvailable) return false;
        if (filters.tuitionFreeOnly && getAnnualTuition(university) !== 0) return false;
        if (!matchesTestPreferences(university, metadata, filters.testPreferences)) {
          return false;
        }

        return true;
      })
      .sort((first, second) => {
        if (sortMode === "ranking") return first.ranking - second.ranking;
        if (sortMode === "tuition") {
          return getAnnualTuitionUsd(first) - getAnnualTuitionUsd(second);
        }
        if (sortMode === "acceptance") return second.acceptanceRate - first.acceptanceRate;
        if (sortMode === "scholarship") {
          return Number(second.scholarshipAvailable) - Number(first.scholarshipAvailable);
        }
        if (sortMode === "international") {
          return second.internationalPercent - first.internationalPercent;
        }
        return second.matchScore - first.matchScore;
      });
  }, [filters, query, sortMode]);

  const programSearchByInstitutionId = useMemo(
    () =>
      new Map(
        programSearchRecords.map((record) => [record.institutionId, record] as const),
      ),
    [programSearchRecords],
  );

  const catalogEntries = useMemo(
    () =>
      institutions.map((institution) => ({
        institution,
        profile: getCatalogProfile(institution),
        programRecord: programSearchByInstitutionId.get(institution.id),
      })),
    [institutions, programSearchByInstitutionId],
  );

  const unifiedResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedRegion = filters.region.trim().toLowerCase();
    const minimumYear = filters.foundedFrom ? Number(filters.foundedFrom) : null;
    const maximumYear = filters.foundedTo ? Number(filters.foundedTo) : null;
    const eligibleProfileIds = new Set(filteredUniversities.map((university) => university.id));

    return catalogEntries
      .filter(({ institution, profile, programRecord }) => {
        if (
          normalizedQuery &&
          ![
            institution.name,
            institution.city,
            institution.region,
            institution.country,
            ...institution.aliases,
            ...(profile?.programs ?? []),
            ...(profile?.strengths ?? []),
            ...(programRecord?.degreeLevels ?? []),
            ...(programRecord?.subjects ?? []),
            ...(programRecord?.deliveryModes ?? []),
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery)
        ) {
          return false;
        }
        if (
          filters.countries.length &&
          !filters.countries.includes(institution.country)
        ) {
          return false;
        }
        if (
          normalizedRegion &&
          !institution.region.toLowerCase().includes(normalizedRegion)
        ) {
          return false;
        }
        if (
          minimumYear &&
          (!institution.established || institution.established < minimumYear)
        ) {
          return false;
        }
        if (
          maximumYear &&
          (!institution.established || institution.established > maximumYear)
        ) {
          return false;
        }
        if (filters.websiteOnly && !institution.website) return false;
        if (admissionsFiltersActive) {
          if (!matchesProgramFilters(profile, programRecord, filters)) return false;

          if (profile) {
            if (!eligibleProfileIds.has(profile.id)) return false;
          } else if (!programRecord || requiresProfileData(filters)) {
            return false;
          }
        }
        if (filters.admissionsDataOnly && !profile && !programRecord) return false;

        return true;
      })
      .sort((first, second) => {
        if (first.profile && second.profile) {
          if (sortMode === "ranking") return first.profile.ranking - second.profile.ranking;
          if (sortMode === "tuition") {
            return getAnnualTuitionUsd(first.profile) - getAnnualTuitionUsd(second.profile);
          }
          if (sortMode === "acceptance") {
            return second.profile.acceptanceRate - first.profile.acceptanceRate;
          }
          if (sortMode === "scholarship") {
            return Number(second.profile.scholarshipAvailable) -
              Number(first.profile.scholarshipAvailable);
          }
          if (sortMode === "international") {
            return second.profile.internationalPercent - first.profile.internationalPercent;
          }
          return second.profile.matchScore - first.profile.matchScore;
        }
        if (first.profile !== second.profile) return first.profile ? -1 : 1;
        return first.institution.name.localeCompare(second.institution.name);
      });
  }, [admissionsFiltersActive, catalogEntries, filteredUniversities, filters, query, sortMode]);

  const pageCount = Math.max(1, Math.ceil(unifiedResults.length / PAGE_SIZE));
  const visibleResults = unifiedResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [filters, query, sortMode]);
  useEffect(() => setPage((current) => Math.min(current, pageCount)), [pageCount]);
  useEffect(() => {
    if (window.innerWidth <= 900) return;

    const workspace = workspaceRef.current;
    if (!workspace) return;

    const scrollContainer = workspace.closest<HTMLElement>("main.overflow-y-auto");
    if (!scrollContainer) return;

    const containerTop = scrollContainer.getBoundingClientRect().top;
    const workspaceTop =
      scrollContainer.scrollTop + workspace.getBoundingClientRect().top - containerTop - 12;

    if (scrollContainer.scrollTop > workspaceTop) {
      scrollContainer.scrollTo({
        behavior: "auto",
        top: Math.max(0, workspaceTop),
      });
    }
  }, [filters]);

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; remove: () => void }> = [];

    if (query.trim()) {
      chips.push({ key: "query", label: 'Search: "' + query.trim() + '"', remove: () => setQuery("") });
    }

    if (filters.region.trim()) {
      chips.push({
        key: "region",
        label: "Region: " + filters.region.trim(),
        remove: () => setFilters((current) => ({ ...current, region: "" })),
      });
    }
    if (filters.foundedFrom) {
      chips.push({
        key: "founded-from",
        label: "Founded from " + filters.foundedFrom,
        remove: () => setFilters((current) => ({ ...current, foundedFrom: "" })),
      });
    }
    if (filters.foundedTo) {
      chips.push({
        key: "founded-to",
        label: "Founded before " + filters.foundedTo,
        remove: () => setFilters((current) => ({ ...current, foundedTo: "" })),
      });
    }
    if (filters.websiteOnly) {
      chips.push({
        key: "website",
        label: "Official website available",
        remove: () => setFilters((current) => ({ ...current, websiteOnly: false })),
      });
    }
    if (filters.admissionsDataOnly) {
      chips.push({
        key: "admissions-data",
        label: "Verified admissions data",
        remove: () =>
          setFilters((current) => ({ ...current, admissionsDataOnly: false })),
      });
    }

    const listLabels: Array<{ key: ListFilterKey; values: string[] }> = [
      { key: "countries", values: filters.countries },
      { key: "degreeLevels", values: filters.degreeLevels },
      { key: "subjects", values: filters.subjects },
      { key: "researchFocus", values: filters.researchFocus },
      { key: "funding", values: filters.funding },
      { key: "institutionTypes", values: filters.institutionTypes },
      { key: "deliveryModes", values: filters.deliveryModes },
      { key: "applicationMethods", values: filters.applicationMethods },
      { key: "intakes", values: filters.intakes },
      { key: "testPreferences", values: filters.testPreferences },
    ];

    listLabels.forEach(({ key, values }) => {
      values.forEach((value) => {
        chips.push({
          key: key + "-" + value,
          label: value,
          remove: () => removeListFilter(key, value),
        });
      });
    });

    if (filters.maxTuition < MAX_TUITION) {
      chips.push({
        key: "tuition",
        label: "Tuition up to " + formatUsdEstimate(filters.maxTuition) + " (USD est.)",
        remove: () => setFilters((current) => ({ ...current, maxTuition: MAX_TUITION })),
      });
    }
    if (filters.maxRanking < MAX_RANKING) {
      chips.push({
        key: "ranking",
        label: "Ranked within " + filters.maxRanking,
        remove: () => setFilters((current) => ({ ...current, maxRanking: MAX_RANKING })),
      });
    }
    const gpaScale = gpaSystems[filters.gpaSystem];
    if (filters.gpaScore !== gpaScale.defaultScore) {
      chips.push({
        key: "gpa",
        label: "GPA: " + filters.gpaScore.toFixed(gpaScale.decimals),
        remove: () =>
          setFilters((current) => ({
            ...current,
            gpaScore: gpaSystems[current.gpaSystem].defaultScore,
          })),
      });
    }

    const englishScale = englishTests[filters.englishTest];
    if (filters.englishTestScore !== englishScale.defaultScore) {
      chips.push({
        key: "english-test",
        label:
          englishScale.label +
          ": " +
          filters.englishTestScore.toFixed(englishScale.decimals),
        remove: () =>
          setFilters((current) => ({
            ...current,
            englishTestScore: englishTests[current.englishTest].defaultScore,
          })),
      });
    }
    if (filters.minInternational > 0) {
      chips.push({
        key: "international",
        label: filters.minInternational + "%+ international",
        remove: () => setFilters((current) => ({ ...current, minInternational: 0 })),
      });
    }
    if (filters.englishOnly) {
      chips.push({
        key: "english",
        label: "English taught",
        remove: () => setFilters((current) => ({ ...current, englishOnly: false })),
      });
    }
    if (filters.scholarshipOnly) {
      chips.push({
        key: "scholarship",
        label: "Scholarship available",
        remove: () => setFilters((current) => ({ ...current, scholarshipOnly: false })),
      });
    }
    if (filters.tuitionFreeOnly) {
      chips.push({
        key: "free",
        label: "Tuition-free only",
        remove: () => setFilters((current) => ({ ...current, tuitionFreeOnly: false })),
      });
    }

    return chips;
  }, [filters, query]);

  const filteredProgramCount = unifiedResults.reduce(
    (total, result) =>
      total +
      (result.programRecord?.programCount ?? result.profile?.programs.length ?? 0),
    0,
  );
  const verifiedUniversityCount = unifiedResults.reduce(
    (total, result) =>
      total + Number(Boolean(result.profile || result.programRecord)),
    0,
  );

  return (
    <div className="search-page">
      <div className="search-container">
        <header className="search-heading">
          <div>
            <span className="search-eyebrow">University discovery</span>
            <h1>Search universities and programs</h1>
            <p>
              Explore institutions worldwide and refine results by program, admissions tests,
              academic fit, funding, cost, university type, location, and delivery mode.
            </p>
          </div>
          <button
            type="button"
            className="search-mobile-filter-button glass-interactive"
            onClick={() => setShowFilters(true)}
          >
            <SlidersHorizontal size={16} aria-hidden="true" />
            All filters
            {activeChips.length > 0 && <span>{activeChips.length}</span>}
          </button>
        </header>

        <div className="search-toolbar">
          <label className="search-query">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search universities and programs</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="University, program, subject, city, or research area"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                title="Clear search"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </label>

          <label className="search-sort">
            <span>Sort</span>
            <select
              aria-label="Sort universities"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
            >
              <option value="match">Best match</option>
              <option value="ranking">Highest ranking</option>
              <option value="tuition">Lowest tuition</option>
              <option value="acceptance">Highest acceptance rate</option>
              <option value="scholarship">Scholarship first</option>
              <option value="international">Most international</option>
            </select>
            <ChevronDown size={13} aria-hidden="true" />
          </label>

          <div className="search-view-toggle" aria-label="Result layout">
            <button
              type="button"
              className={viewMode === "grid" ? "is-active" : ""}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
              title="Grid view"
            >
              <LayoutGrid size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={viewMode === "list" ? "is-active" : ""}
              onClick={() => setViewMode("list")}
              aria-label="List view"
              title="List view"
            >
              <List size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="search-active-filters">
            <span>Active filters</span>
            <div>
              {activeChips.map((chip) => (
                <button type="button" key={chip.key} onClick={chip.remove}>
                  {chip.label}
                  <X size={11} aria-hidden="true" />
                </button>
              ))}
            </div>
            <button type="button" onClick={resetFilters}>
              Clear all
            </button>
          </div>
        )}

        {compareUniversities.length > 0 && (
          <div className="search-compare-bar">
            <GitCompare size={17} aria-hidden="true" />
            <div>
              <strong>{compareUniversities.length} of 3 selected</strong>
              <span>{compareUniversities.map((university) => university.name).join(", ")}</span>
            </div>
            <button type="button" onClick={() => navigate("/wishlist")}>
              Compare now
              <ArrowRight size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={clearCompareUniversities}
              aria-label="Clear comparison"
              title="Clear comparison"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="search-workspace" ref={workspaceRef}>
          <button
            type="button"
            className={showFilters ? "search-filter-overlay is-visible" : "search-filter-overlay"}
            onClick={() => setShowFilters(false)}
            aria-label="Close filters"
          />

          <aside className={showFilters ? "search-filter-panel is-open" : "search-filter-panel"}>
            <div className="search-filter-header">
              <div>
                <SlidersHorizontal size={17} aria-hidden="true" />
                <strong>All filters</strong>
                {activeChips.length > 0 && <span>{activeChips.length}</span>}
              </div>
              <button type="button" onClick={resetFilters}>
                <RotateCcw size={13} aria-hidden="true" />
                Reset
              </button>
              <button
                type="button"
                className="search-filter-close"
                onClick={() => setShowFilters(false)}
                aria-label="Close filters"
                title="Close filters"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>

            <div className="search-filter-scroll">
              <FilterSection title="Location and institution">
                <SearchableCheckboxList
                  options={countryOptions}
                  selected={filters.countries}
                  onToggle={(value) => toggleListFilter("countries", value)}
                  placeholder="Search countries"
                />

                <label className="search-filter-text-field">
                  <span>Region or state</span>
                  <span>
                    <Globe2 size={13} aria-hidden="true" />
                    <input
                      type="search"
                      value={filters.region}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          region: event.target.value,
                        }))
                      }
                      placeholder="Any region"
                    />
                  </span>
                </label>

                <div className="search-filter-year-grid">
                  <label className="search-filter-text-field">
                    <span>Founded from</span>
                    <span>
                      <CalendarDays size={13} aria-hidden="true" />
                      <input
                        type="number"
                        min="1000"
                        max={new Date().getFullYear()}
                        value={filters.foundedFrom}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            foundedFrom: event.target.value,
                          }))
                        }
                        placeholder="Any"
                      />
                    </span>
                  </label>
                  <label className="search-filter-text-field">
                    <span>Founded before</span>
                    <span>
                      <CalendarDays size={13} aria-hidden="true" />
                      <input
                        type="number"
                        min="1000"
                        max={new Date().getFullYear()}
                        value={filters.foundedTo}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            foundedTo: event.target.value,
                          }))
                        }
                        placeholder="Any"
                      />
                    </span>
                  </label>
                </div>

                <label className="search-switch-row">
                  <span>
                    <strong>Official website available</strong>
                    <small>Institution has a verified website in the registry</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={filters.websiteOnly}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        websiteOnly: event.target.checked,
                      }))
                    }
                  />
                </label>
              </FilterSection>

              <FilterSection title="Admissions data">
                <label className="search-switch-row">
                  <span>
                    <strong>Verified admissions data only</strong>
                    <small>Programs, requirements, costs, tests, and funding</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={filters.admissionsDataOnly}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        admissionsDataOnly: event.target.checked,
                      }))
                    }
                  />
                </label>
                <p className="search-filter-coverage-note">
                  Admissions filters exclude institutions whose matching fields have not
                  been verified yet.
                </p>
              </FilterSection>

              <FilterSection title="Program level">
                <CheckboxList
                  options={degreeLevels}
                  selected={filters.degreeLevels}
                  onToggle={(value) => toggleListFilter("degreeLevels", value)}
                />
              </FilterSection>

              <FilterSection title="Subject and program">
                <CheckboxList
                  options={subjects}
                  selected={filters.subjects}
                  onToggle={(value) => toggleListFilter("subjects", value)}
                />
                <label className="search-switch-row">
                  <span>
                    <strong>English-taught only</strong>
                    <small>Hide programs not taught in English</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={filters.englishOnly}
                    onChange={(event) =>
                      setFilters((current) => ({ ...current, englishOnly: event.target.checked }))
                    }
                  />
                </label>
              </FilterSection>

              <FilterSection title="Research focus" defaultOpen={false}>
                <CheckboxList
                  options={researchFocus}
                  selected={filters.researchFocus}
                  onToggle={(value) => toggleListFilter("researchFocus", value)}
                />
              </FilterSection>

              <FilterSection title="Financial support">
                <label className="search-switch-row">
                  <span>
                    <strong>Scholarships available</strong>
                    <small>University or external funding listed</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={filters.scholarshipOnly}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        scholarshipOnly: event.target.checked,
                      }))
                    }
                  />
                </label>
                <CheckboxList
                  options={fundingOptions}
                  selected={filters.funding}
                  onToggle={(value) => toggleListFilter("funding", value)}
                />
              </FilterSection>

              <FilterSection title="Tuition and price">
                <div className="search-range-control">
                  <div>
                    <span>Maximum annual tuition (USD estimate)</span>
                    <strong>
                      {filters.maxTuition === MAX_TUITION
                        ? "Any"
                        : formatUsdEstimate(filters.maxTuition)}
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={MAX_TUITION}
                    step="2000"
                    value={filters.maxTuition}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        maxTuition: Number(event.target.value),
                      }))
                    }
                  />
                  <small>
                    Converted for comparison using{" "}
                    <a href={ECB_REFERENCE_URL} target="_blank" rel="noreferrer">
                      ECB reference rates
                    </a>{" "}
                    from {ECB_REFERENCE_DATE}. Displayed fees remain in local currency.
                  </small>
                </div>
                <label className="search-switch-row">
                  <span>
                    <strong>Tuition-free only</strong>
                    <small>Show programs with no listed tuition</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={filters.tuitionFreeOnly}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        tuitionFreeOnly: event.target.checked,
                      }))
                    }
                  />
                </label>
              </FilterSection>

              <FilterSection title="Tests and academic fit">
                <div className="search-academic-group">
                  <label className="search-score-select">
                    <span>Grading system</span>
                    <div>
                      <select
                        aria-label="Grading system"
                        value={filters.gpaSystem}
                        onChange={(event) => {
                          const gpaSystem = event.target.value as GpaSystem;
                          setFilters((current) => ({
                            ...current,
                            gpaScore: gpaSystems[gpaSystem].defaultScore,
                            gpaSystem,
                          }));
                        }}
                      >
                        {Object.entries(gpaSystems).map(([key, scale]) => (
                          <option value={key} key={key}>
                            {scale.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={12} aria-hidden="true" />
                    </div>
                  </label>
                  <div className="search-range-control">
                    <div>
                      <span>My grade</span>
                      <strong>
                        {filters.gpaScore.toFixed(gpaSystems[filters.gpaSystem].decimals)}
                      </strong>
                    </div>
                    <input
                      type="range"
                      aria-label="My grade"
                      min={gpaSystems[filters.gpaSystem].min}
                      max={gpaSystems[filters.gpaSystem].max}
                      step={gpaSystems[filters.gpaSystem].step}
                      value={filters.gpaScore}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          gpaScore: Number(event.target.value),
                        }))
                      }
                    />
                    <small>
                      Estimated 4.0 equivalent:{" "}
                      {toFourPointGpa(filters.gpaSystem, filters.gpaScore).toFixed(1)}
                    </small>
                  </div>
                </div>

                <div className="search-academic-group">
                  <label className="search-score-select">
                    <span>English language test</span>
                    <div>
                      <select
                        aria-label="English language test"
                        value={filters.englishTest}
                        onChange={(event) => {
                          const englishTest = event.target.value as EnglishTest;
                          setFilters((current) => ({
                            ...current,
                            englishTest,
                            englishTestScore: englishTests[englishTest].defaultScore,
                          }));
                        }}
                      >
                        {Object.entries(englishTests).map(([key, scale]) => (
                          <option value={key} key={key}>
                            {scale.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={12} aria-hidden="true" />
                    </div>
                  </label>
                  <div className="search-range-control">
                    <div>
                      <span>My result</span>
                      <strong>
                        {filters.englishTestScore.toFixed(
                          englishTests[filters.englishTest].decimals,
                        )}
                      </strong>
                    </div>
                    <input
                      type="range"
                      aria-label="My English language test result"
                      min={englishTests[filters.englishTest].min}
                      max={englishTests[filters.englishTest].max}
                      step={englishTests[filters.englishTest].step}
                      value={filters.englishTestScore}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          englishTestScore: Number(event.target.value),
                        }))
                      }
                    />
                    {filters.englishTest !== "ielts" && (
                      <small>
                        Approximate IELTS equivalent:{" "}
                        {toIeltsEquivalent(
                          filters.englishTest,
                          filters.englishTestScore,
                        ).toFixed(1)}
                      </small>
                    )}
                  </div>
                </div>

                <CheckboxList
                  options={testPreferences}
                  selected={filters.testPreferences}
                  onToggle={(value) => toggleListFilter("testPreferences", value)}
                />
              </FilterSection>

              <FilterSection title="University type" defaultOpen={false}>
                <CheckboxList
                  options={institutionTypes}
                  selected={filters.institutionTypes}
                  onToggle={(value) => toggleListFilter("institutionTypes", value)}
                />
              </FilterSection>

              <FilterSection title="Ranking and student mix" defaultOpen={false}>
                <div className="search-range-control">
                  <div>
                    <span>Maximum world ranking</span>
                    <strong>Top {filters.maxRanking}</strong>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max={MAX_RANKING}
                    step="25"
                    value={filters.maxRanking}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        maxRanking: Number(event.target.value),
                      }))
                    }
                  />
                </div>
                <div className="search-range-control">
                  <div>
                    <span>International students</span>
                    <strong>{filters.minInternational}%+</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="35"
                    step="5"
                    value={filters.minInternational}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        minInternational: Number(event.target.value),
                      }))
                    }
                  />
                </div>
              </FilterSection>

              <FilterSection title="Delivery mode" defaultOpen={false}>
                <CheckboxList
                  options={deliveryModes}
                  selected={filters.deliveryModes}
                  onToggle={(value) => toggleListFilter("deliveryModes", value)}
                />
              </FilterSection>

              <FilterSection title="Intake season" defaultOpen={false}>
                <CheckboxList
                  options={intakeOptions}
                  selected={filters.intakes}
                  onToggle={(value) => toggleListFilter("intakes", value)}
                />
              </FilterSection>

              <FilterSection title="Application method" defaultOpen={false}>
                <CheckboxList
                  options={applicationMethods}
                  selected={filters.applicationMethods}
                  onToggle={(value) => toggleListFilter("applicationMethods", value)}
                />
              </FilterSection>
            </div>

            <div className="search-filter-mobile-footer">
              <button type="button" onClick={resetFilters}>
                Reset
              </button>
              <button type="button" onClick={() => setShowFilters(false)}>
                Show {unifiedResults.length.toLocaleString()} results
              </button>
            </div>
          </aside>

          <main className="search-results">
            <div className="search-results-heading">
              <div>
                <strong>
                  {unifiedResults.length.toLocaleString()} universities
                </strong>
                <span>
                  {admissionsFiltersActive
                    ? verifiedUniversityCount.toLocaleString() +
                      " verified universities / " +
                      filteredProgramCount.toLocaleString() +
                      " indexed programs"
                    : (manifest?.institutionCount.toLocaleString() ?? "Worldwide") + " in catalog"}
                </span>
              </div>
              <span>
                {activeChips.length
                  ? activeChips.length + " active filter" + (activeChips.length === 1 ? "" : "s")
                  : manifest?.source.publicationDate
                    ? "Registry updated " + manifest.source.publicationDate
                    : "Showing all options"}
              </span>
            </div>

            {catalogError ? (
              <section className="search-empty" role="alert">
                <span>
                  <Globe2 size={23} aria-hidden="true" />
                </span>
                <h2>University catalog unavailable</h2>
                <p>{catalogError}</p>
              </section>
            ) : catalogLoading ? (
              <section className="search-empty" aria-live="polite">
                <span>
                  <Globe2 size={23} aria-hidden="true" />
                </span>
                <h2>Loading universities worldwide</h2>
                <p>Preparing the searchable institution and admissions index.</p>
              </section>
            ) : unifiedResults.length === 0 ? (
              <section className="search-empty">
                <span>
                  <Search size={23} aria-hidden="true" />
                </span>
                <h2>
                  {admissionsFiltersActive
                    ? "No verified universities match every filter"
                    : "No universities match every filter"}
                </h2>
                <p>
                  {admissionsFiltersActive
                    ? "No connected source verifies every selected criterion. Remove a constraint or reset the filters."
                    : "Remove one or two constraints, or reset the search to see all available options."}
                </p>
                <button type="button" onClick={resetFilters}>
                  Reset all filters
                </button>
              </section>
            ) : (
              <>
                <div className={"search-result-grid " + (viewMode === "list" ? "is-list" : "")}>
                {visibleResults.map(({ institution, profile, programRecord }) => {
                  if (!profile) {
                    const location = [
                      institution.city,
                      institution.region,
                      institution.country,
                    ]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <article
                        className={
                          "search-result-card is-directory " +
                          (viewMode === "list" ? "is-list" : "")
                        }
                        key={institution.id}
                      >
                        <button
                          type="button"
                          className="search-result-card-open"
                          onClick={() => navigate(getCatalogRoute(institution))}
                          aria-label={"Open " + institution.name}
                          title={"Open " + institution.name}
                        />

                        <div className="search-result-media search-result-logo-media">
                          <UniversityLogo
                            name={institution.name}
                            website={institution.website}
                          />
                          <span className="search-result-match is-directory">
                            Verified identity
                          </span>
                        </div>

                        <div className="search-result-body">
                          <div className="search-result-location">
                            <span>{institution.countryCode}</span>
                            <MapPin size={11} aria-hidden="true" />
                            {location}
                          </div>

                          <div className="search-result-title">
                            <div>
                              <h2>{institution.name}</h2>
                              <p>
                                {institution.aliases[0] ||
                                  "Verified education institution"}
                              </p>
                            </div>
                            <span>
                              {institution.established ?? "ROR"}
                            </span>
                          </div>

                          <div className="search-result-tags">
                            <span>
                              <Globe2 size={11} aria-hidden="true" />
                              {institution.website ? "Official site" : "ROR record"}
                            </span>
                            <span>
                              <BookOpen size={11} aria-hidden="true" />
                              {programRecord ? "Official program catalog" : "Degree profile"}
                            </span>
                          </div>

                          <div className="search-result-programs">
                            <span>Program information</span>
                            <div>
                              <span>
                                {programRecord
                                  ? programRecord.programCount.toLocaleString() +
                                    " official programs indexed"
                                  : admissionsFiltersActive
                                    ? "Selected admissions data is being verified"
                                    : "Open the profile for published programs"}
                              </span>
                            </div>
                          </div>

                          <dl className="search-result-facts">
                            <div>
                              <dt>Founded</dt>
                              <dd>{institution.established ?? "Not listed"}</dd>
                            </div>
                            <div>
                              <dt>Location</dt>
                              <dd>{institution.city || institution.region || institution.country}</dd>
                            </div>
                            <div>
                              <dt>Website</dt>
                              <dd>{institution.website ? "Available" : "Not listed"}</dd>
                            </div>
                            <div>
                              <dt>Registry</dt>
                              <dd>Current ROR release</dd>
                            </div>
                          </dl>

                          <div className="search-result-actions">
                            <button
                              type="button"
                              className="glass-interactive"
                              onClick={() => navigate(getCatalogRoute(institution))}
                            >
                              View details
                            </button>
                            <SafeExternalLink url={institution.website}>
                              Official website
                            </SafeExternalLink>
                          </div>
                        </div>
                      </article>
                    );
                  }

                  const university = profile;
                  const metadata = getMetadata(university);
                  const saved = isUniversitySaved(university.id);
                  const comparing = compareUniversityIds.includes(university.id);
                  const compareDisabled = !comparing && compareUniversityIds.length >= 3;

                  return (
                    <article
                      className={
                        "search-result-card " +
                        (comparing ? "is-comparing " : "") +
                        (viewMode === "list" ? "is-list" : "")
                      }
                      key={institution.id}
                    >
                      <button
                        type="button"
                        className="search-result-card-open"
                        onClick={() => navigate(getCatalogRoute(institution, university))}
                        aria-label={"Open " + university.name}
                        title={"Open " + university.name}
                      />
                      <div className="search-result-media search-result-logo-media">
                        <UniversityLogo
                          name={university.name}
                          website={university.website}
                        />
                        <span className="search-result-match">{university.matchScore}% match</span>
                        <div className="search-result-media-actions">
                          <button
                            type="button"
                            className={saved ? "is-saved" : ""}
                            onClick={() => toggleUniversitySave(university.id)}
                            aria-label={(saved ? "Remove " : "Save ") + university.name}
                            title={saved ? "Remove from wishlist" : "Save to wishlist"}
                          >
                            <Heart
                              size={16}
                              fill={saved ? "currentColor" : "none"}
                              aria-hidden="true"
                            />
                          </button>
                          <button
                            type="button"
                            className={comparing ? "is-comparing" : ""}
                            disabled={compareDisabled}
                            onClick={() => toggleUniversityCompare(university.id)}
                            aria-label={(comparing ? "Remove " : "Compare ") + university.name}
                            title={comparing ? "Remove from comparison" : "Add to comparison"}
                          >
                            <GitCompare size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="search-result-body">
                        <div className="search-result-location">
                          <span>
                            {countryCodes[university.country] ??
                              university.country.slice(0, 2).toUpperCase()}
                          </span>
                          <MapPin size={11} aria-hidden="true" />
                          {university.city}, {university.country}
                        </div>

                        <div className="search-result-title">
                          <div>
                            <h2>{university.name}</h2>
                            <p>{metadata.institutionTypes.slice(0, 2).join(" / ")}</p>
                          </div>
                          <span>#{university.ranking}</span>
                        </div>

                        <div className="search-result-tags">
                          {university.scholarshipAvailable && (
                            <span className="is-funding">
                              <Award size={11} aria-hidden="true" />
                              Scholarship
                            </span>
                          )}
                          {getAnnualTuition(university) === 0 && (
                            <span className="is-free">
                              <Banknote size={11} aria-hidden="true" />
                              Tuition-free
                            </span>
                          )}
                          {university.englishTaught && (
                            <span>
                              <BookOpen size={11} aria-hidden="true" />
                              English taught
                            </span>
                          )}
                        </div>

                        <div className="search-result-programs">
                          <span>Popular programs</span>
                          <div>
                            {university.programs.slice(0, 2).map((program) => (
                              <span key={program}>{program}</span>
                            ))}
                          </div>
                        </div>

                        <dl className="search-result-facts">
                          <div>
                            <dt>Tuition</dt>
                            <dd>{formatTuition(university)}</dd>
                          </div>
                          <div>
                            <dt>Academic fit</dt>
                            <dd>
                              GPA {university.gpaMin} / IELTS {university.ieltsMin}
                            </dd>
                          </div>
                          <div>
                            <dt>Acceptance</dt>
                            <dd>{university.acceptanceRate}%</dd>
                          </div>
                          <div>
                            <dt>International</dt>
                            <dd>{university.internationalPercent}% students</dd>
                          </div>
                        </dl>

                        <div className="search-result-actions">
                          <button
                            type="button"
                            className="glass-interactive"
                            onClick={() => navigate("/university/" + university.id)}
                          >
                            View details
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              navigate("/applications?new=1&university=" + university.id)
                            }
                          >
                            Start application
                            <ArrowRight size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
                </div>

                {pageCount > 1 && (
                  <nav className="search-pagination" aria-label="University results pages">
                    <button
                      type="button"
                      disabled={page === 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      aria-label="Previous page"
                      title="Previous page"
                    >
                      <ChevronLeft size={16} aria-hidden="true" />
                    </button>
                    <span>
                      Page {page.toLocaleString()} of {pageCount.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      disabled={page === pageCount}
                      onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                      aria-label="Next page"
                      title="Next page"
                    >
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </nav>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
