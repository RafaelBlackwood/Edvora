import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowRight,
  Award,
  Banknote,
  BookOpen,
  Check,
  ChevronDown,
  GitCompare,
  Heart,
  LayoutGrid,
  List,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import campusImage from "../../../assets/edvora-campus.jpg";
import { universities } from "../../data/mockData";
import { useAppData } from "../../providers/AppDataProvider";

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
  englishOnly: boolean;
  englishTest: EnglishTest;
  englishTestScore: number;
  gpaScore: number;
  gpaSystem: GpaSystem;
  maxRanking: number;
  maxTuition: number;
  minInternational: number;
  scholarshipOnly: boolean;
  tuitionFreeOnly: boolean;
};

type ListFilterKey = keyof ListFilters;

const MAX_TUITION =
  Math.ceil(Math.max(...universities.map((university) => university.tuition)) / 5000) * 5000;
const MAX_RANKING = 500;

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
  applicationMethods: [],
  countries: [],
  degreeLevels: [],
  deliveryModes: [],
  englishOnly: false,
  englishTest: "ielts",
  englishTestScore: englishTests.ielts.defaultScore,
  funding: [],
  gpaScore: gpaSystems.us4.defaultScore,
  gpaSystem: "us4",
  institutionTypes: [],
  intakes: [],
  maxRanking: MAX_RANKING,
  maxTuition: MAX_TUITION,
  minInternational: 0,
  researchFocus: [],
  scholarshipOnly: false,
  subjects: [],
  testPreferences: [],
  tuitionFreeOnly: false,
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
    funding: ["Merit scholarships", "Research assistantships", "Need-based aid"],
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
    funding: ["Merit scholarships", "Research assistantships", "Teaching assistantships", "Need-based aid"],
    institutionTypes: ["Public", "Research-intensive"],
    portfolioRequired: false,
    researchFocus: ["AI and machine learning", "Data and analytics", "Software and systems", "Business and economics"],
  },
};

const countries = Array.from(new Set(universities.map((university) => university.country))).sort();
const degreeLevels = ["Bachelor's", "Master's", "PhD", "MBA"];
const subjects = [
  "Computer Science",
  "Artificial Intelligence",
  "Data Science",
  "Software Engineering",
  "Human-computer Interaction",
  "Business Analytics",
  "Information Science",
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
  "Merit scholarships",
  "Need-based aid",
  "Research assistantships",
  "Teaching assistantships",
  "Fee waivers",
  "Tuition-free study",
];
const institutionTypes = ["Public", "Private", "Technical university", "Research-intensive"];
const deliveryModes = ["On campus", "Hybrid", "Online"];
const applicationMethods = [
  "Direct application",
  "Uni-Assist",
  "UCAS",
  "Studielink",
  "Common App",
  "University Admissions Sweden",
];
const testPreferences = ["GRE not required", "GMAT not required", "Portfolio not required"];
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
  const levels = new Set<string>();

  university.programs.forEach((program) => {
    const normalized = program.toLowerCase();
    if (normalized.includes("bachelor")) levels.add("Bachelor's");
    if (normalized.includes("msc") || normalized.includes("master") || normalized.includes("mba")) {
      levels.add(normalized.includes("mba") ? "MBA" : "Master's");
    }
    if (normalized.includes("phd") || normalized.includes("doctor")) levels.add("PhD");
  });

  return Array.from(levels);
}

function getSubjects(university: University) {
  const searchable = university.programs.join(" ").toLowerCase();
  const matched = new Set<string>();

  if (searchable.includes("computer science")) matched.add("Computer Science");
  if (searchable.includes(" ai") || searchable.includes("artificial intelligence")) {
    matched.add("Artificial Intelligence");
  }
  if (searchable.includes("data science")) matched.add("Data Science");
  if (searchable.includes("software engineering")) matched.add("Software Engineering");
  if (searchable.includes("hci") || searchable.includes("human computer")) {
    matched.add("Human-computer Interaction");
  }
  if (searchable.includes("business analytics")) matched.add("Business Analytics");
  if (searchable.includes("information science")) matched.add("Information Science");

  return Array.from(matched);
}

function formatTuition(university: University) {
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

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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


  const filteredUniversities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return universities
      .filter((university) => {
        const metadata = getMetadata(university);
        const universityDegrees = getDegreeLevels(university);
        const universitySubjects = getSubjects(university);
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
          filters.degreeLevels.length &&
          !filters.degreeLevels.some((level) => universityDegrees.includes(level))
        ) {
          return false;
        }
        if (
          filters.subjects.length &&
          !filters.subjects.some((subject) => universitySubjects.includes(subject))
        ) {
          return false;
        }
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
          filters.deliveryModes.length &&
          !filters.deliveryModes.some((mode) => metadata.deliveryModes.includes(mode))
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
        if (university.tuition > filters.maxTuition) return false;
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
        if (filters.englishOnly && !university.englishTaught) return false;
        if (filters.scholarshipOnly && !university.scholarshipAvailable) return false;
        if (filters.tuitionFreeOnly && university.tuition !== 0) return false;
        if (filters.testPreferences.includes("GRE not required") && university.greRequired) {
          return false;
        }
        if (filters.testPreferences.includes("GMAT not required") && university.gmatRequired) {
          return false;
        }
        if (
          filters.testPreferences.includes("Portfolio not required") &&
          metadata.portfolioRequired
        ) {
          return false;
        }

        return true;
      })
      .sort((first, second) => {
        if (sortMode === "ranking") return first.ranking - second.ranking;
        if (sortMode === "tuition") return first.tuition - second.tuition;
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

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; remove: () => void }> = [];

    if (query.trim()) {
      chips.push({ key: "query", label: 'Search: "' + query.trim() + '"', remove: () => setQuery("") });
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
        label: "Tuition up to " + filters.maxTuition.toLocaleString(),
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

  const filteredProgramCount = filteredUniversities.reduce(
    (total, university) => total + university.programs.length,
    0,
  );

  return (
    <div className="search-page">
      <div className="search-container">
        <header className="search-heading">
          <div>
            <span className="search-eyebrow">University discovery</span>
            <h1>Find the programs that fit your profile</h1>
            <p>
              Search {universities.length} universities and{" "}
              {universities.reduce((total, university) => total + university.programs.length, 0)}{" "}
              programs with detailed academic, funding, and research filters.
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
              <option value="match">Best profile match</option>
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

        <div className="search-workspace">
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
              <FilterSection title="Destination">
                <CheckboxList
                  options={countries}
                  selected={filters.countries}
                  onToggle={(value) => toggleListFilter("countries", value)}
                />
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
                    <span>Maximum annual tuition</span>
                    <strong>
                      {filters.maxTuition === MAX_TUITION
                        ? "Any"
                        : filters.maxTuition.toLocaleString()}
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
                  <small>Compared using each university's listed currency.</small>
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
                Show {filteredUniversities.length} results
              </button>
            </div>
          </aside>

          <main className="search-results">
            <div className="search-results-heading">
              <div>
                <strong>{filteredUniversities.length} universities</strong>
                <span>{filteredProgramCount} matching programs</span>
              </div>
              <span>
                {activeChips.length
                  ? activeChips.length + " active filter" + (activeChips.length === 1 ? "" : "s")
                  : "Showing all options"}
              </span>
            </div>

            {filteredUniversities.length === 0 ? (
              <section className="search-empty">
                <span>
                  <Search size={23} aria-hidden="true" />
                </span>
                <h2>No universities match every filter</h2>
                <p>Remove one or two constraints, or reset the search to see all available options.</p>
                <button type="button" onClick={resetFilters}>
                  Reset all filters
                </button>
              </section>
            ) : (
              <div className={"search-result-grid " + (viewMode === "list" ? "is-list" : "")}>
                {filteredUniversities.map((university) => {
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
                      key={university.id}
                    >
                      <div className="search-result-media">
                        <img
                          src={university.image}
                          alt={university.name + " campus"}
                          onError={(event) => {
                            if (event.currentTarget.src !== campusImage) {
                              event.currentTarget.src = campusImage;
                            }
                          }}
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
                          {university.tuition === 0 && (
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
                          <button type="button" onClick={() => navigate("/applications")}>
                            Start application
                            <ArrowRight size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
