import { useMemo, useState } from "react";
import {
  Award,
  Check,
  ChevronDown,
  FileCheck2,
  Heart,
  Search,
  X,
} from "lucide-react";
import { useNavigate } from "react-router";
import { scholarships } from "../../data/mockData";
import { useAppData } from "../../providers/AppDataProvider";

const SCHOLARSHIP_BG = "https://images.unsplash.com/photo-1722977735215-d28f2ac6efba?w=1920&h=400&fit=crop&auto=format";

const categoryShortcuts = [
  { label: "DAAD", query: "daad" },
  { label: "Fulbright", query: "fulbright" },
  { label: "Erasmus+", query: "erasmus" },
  { label: "University grants", type: "University" },
  { label: "Assistantships", type: "Assistantship" },
];

function difficultyColor(difficulty: string) {
  if (difficulty === "Very High") return "#ef6d75";
  if (difficulty === "High") return "#f0b75c";
  if (difficulty === "Medium") return "#55cde6";
  return "#4dd39e";
}

export function ScholarshipsPage() {
  const navigate = useNavigate();
  const {
    applyToScholarship,
    documents,
    isScholarshipApplied,
    isScholarshipSaved,
    toggleScholarshipSave,
  } = useAppData();
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterLevel, setFilterLevel] = useState("All");
  const [filterCountry, setFilterCountry] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  const selectedScholarship = scholarships.find((scholarship) => scholarship.id === selectedId);
  const types = useMemo(() => ["All", ...new Set(scholarships.map((scholarship) => scholarship.type))], []);
  const countries = useMemo(() => ["All", ...new Set(scholarships.map((scholarship) => scholarship.country))], []);

  const filteredScholarships = scholarships.filter((scholarship) => {
    const searchText = [scholarship.name, scholarship.country, scholarship.type, scholarship.eligibility].join(" ").toLowerCase();
    if (query.trim() && !searchText.includes(query.trim().toLowerCase())) return false;
    if (filterType !== "All" && scholarship.type !== filterType) return false;
    if (filterLevel !== "All" && !scholarship.degreeLevel.includes(filterLevel)) return false;
    if (filterCountry !== "All" && scholarship.country !== filterCountry) return false;
    if (showSavedOnly && !isScholarshipSaved(scholarship.id)) return false;
    return true;
  });

  const useShortcut = (shortcut: (typeof categoryShortcuts)[number]) => {
    setQuery(shortcut.query ?? "");
    setFilterType(shortcut.type ?? "All");
    setShowSavedOnly(false);
  };

  const documentIsReady = (requirement: string) => {
    const keywords = requirement.toLowerCase().split(/W+/).filter((word) => word.length > 3);
    return documents.some((document) => {
      if (document.status !== "Final") return false;
      const searchable = (document.name + " " + document.category).toLowerCase();
      return keywords.some((keyword) => searchable.includes(keyword));
    });
  };

  return (
    <main style={{ background: "#080d1a", minHeight: "100%" }}>
      <header className="relative h-40 overflow-hidden">
        <img src={SCHOLARSHIP_BG} alt="" className="w-full h-full object-cover" style={{ filter: "brightness(0.24) saturate(0.55)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,13,26,0.3), #080d1a 100%)" }} />
        <div className="absolute inset-0 flex flex-col justify-center px-5 lg:px-8">
          <span className="text-xs font-semibold uppercase" style={{ color: "#9d93ef" }}>Funding discovery</span>
          <h1 className="text-2xl font-bold text-white mt-1" style={{ fontFamily: "var(--font-display)" }}>Scholarships and funding</h1>
          <p className="text-sm mt-1" style={{ color: "#a8b4d0" }}>{scholarships.length} curated opportunities with profile matching and document checks.</p>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-5" aria-label="Scholarship shortcuts">
          {categoryShortcuts.map((shortcut) => (
            <button key={shortcut.label} type="button" onClick={() => useShortcut(shortcut)} className="glass-interactive p-3 rounded-md text-left">
              <Award size={15} style={{ color: "#9d93ef" }} />
              <strong className="block text-xs text-white mt-2">{shortcut.label}</strong>
              <span className="block text-[10px] mt-0.5" style={{ color: "#6f7c95" }}>Browse opportunities</span>
            </button>
          ))}
        </section>

        <section className="grid sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-2 mb-4" aria-label="Scholarship filters">
          <label className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#6b7a9e" }} />
            <span className="sr-only">Search scholarships</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by scholarship, country, or eligibility" className="w-full pl-9 pr-9 py-2.5 rounded-md text-sm outline-none" style={{ background: "#0e1729", border: "1px solid rgba(124,106,247,0.18)", color: "#e8eaf0" }} />
            {query && <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Clear search"><X size={13} /></button>}
          </label>
          {[
            { label: "Type", value: filterType, options: types, setter: setFilterType },
            { label: "Level", value: filterLevel, options: ["All", "Bachelor", "Masters", "PhD"], setter: setFilterLevel },
            { label: "Country", value: filterCountry, options: countries, setter: setFilterCountry },
          ].map((filter) => (
            <label key={filter.label} className="relative">
              <span className="sr-only">{filter.label}</span>
              <select value={filter.value} onChange={(event) => filter.setter(event.target.value)} className="appearance-none w-full min-w-28 pl-3 pr-8 py-2.5 rounded-md text-sm outline-none" style={{ background: "#0e1729", border: "1px solid rgba(124,106,247,0.18)", color: "#a8b4d0" }}>
                {filter.options.map((option) => <option key={option}>{option}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#6b7a9e" }} />
            </label>
          ))}
        </section>

        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-xs" style={{ color: "#6b7a9e" }}>{filteredScholarships.length} opportunities</p>
          <label className="flex items-center gap-2 text-xs" style={{ color: "#9ca6b8" }}>
            <input type="checkbox" checked={showSavedOnly} onChange={(event) => setShowSavedOnly(event.target.checked)} />
            Saved only
          </label>
        </div>

        <section className="grid md:grid-cols-2 gap-3" aria-label="Scholarship results">
          {filteredScholarships.map((scholarship) => {
            const saved = isScholarshipSaved(scholarship.id);
            const applied = isScholarshipApplied(scholarship.id);
            const color = difficultyColor(scholarship.difficulty);
            return (
              <article key={scholarship.id} className="p-5 rounded-lg" style={{ background: "rgba(13,20,50,0.64)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0"><span className="text-2xl" aria-hidden="true">{scholarship.logo}</span><div><h2 className="font-semibold text-white">{scholarship.name}</h2><p className="text-xs mt-0.5" style={{ color: "#6b7a9e" }}>{scholarship.country} / {scholarship.type}</p></div></div>
                  <button type="button" onClick={() => toggleScholarshipSave(scholarship.id)} className="glass-interactive w-8 h-8 flex items-center justify-center rounded-md" aria-label={(saved ? "Remove " : "Save ") + scholarship.name}><Heart size={15} fill={saved ? "currentColor" : "none"} style={{ color: saved ? "#ef6d75" : "#8793ad" }} /></button>
                </div>

                <div className="flex items-end justify-between gap-3 mb-3">
                  <div><strong className="text-lg" style={{ color: "#4dd39e", fontFamily: "var(--font-mono)" }}>{scholarship.amount}</strong><p className="text-xs" style={{ color: "#6b7a9e" }}>{scholarship.coverage}</p></div>
                  <div className="text-right"><span className="inline-block px-2 py-1 rounded-full text-[10px] font-semibold" style={{ background: color + "18", color }}>{scholarship.difficulty} competition</span><p className="text-xs mt-1" style={{ color: "#8f98ab" }}>{scholarship.matchScore}% match</p></div>
                </div>

                <p className="text-xs leading-relaxed mb-3" style={{ color: "#a8b4d0" }}>{scholarship.eligibility}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">{scholarship.degreeLevel.map((level) => <span key={level} className="px-2 py-0.5 rounded-md text-[10px]" style={{ background: "rgba(124,106,247,0.1)", color: "#aaa2f2" }}>{level}</span>)}</div>
                <div className="flex items-center justify-between text-xs mb-4" style={{ color: "#6b7a9e" }}><span>Deadline <strong style={{ color: "#f0b75c" }}>{scholarship.deadline}</strong></span><span>{scholarship.requiredDocs.length} documents</span></div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setSelectedId(scholarship.id)} className="glass-interactive py-2 rounded-md text-xs font-semibold">View details</button>
                  <button type="button" disabled={applied} onClick={() => applyToScholarship(scholarship.id)} className="app-primary-action py-2 rounded-md text-xs font-semibold text-white disabled:opacity-60" style={{ background: applied ? "#238a68" : "#665bd7" }}>{applied ? "Checklist started" : "Start checklist"}</button>
                </div>
              </article>
            );
          })}
        </section>

        {filteredScholarships.length === 0 && (
          <div className="py-16 text-center" style={{ color: "#6b7a9e" }}><Award size={28} className="mx-auto mb-3" /><h2 className="text-sm font-semibold text-white">No matching scholarships</h2><p className="text-xs mt-1 mb-4">Remove a filter to broaden your funding search.</p><button type="button" onClick={() => { setQuery(""); setFilterType("All"); setFilterLevel("All"); setFilterCountry("All"); setShowSavedOnly(false); }} className="glass-interactive px-4 py-2 rounded-md text-xs">Reset filters</button></div>
        )}
      </div>

      {selectedScholarship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}>
          <section className="w-full max-w-lg max-h-[88vh] overflow-y-auto p-6 rounded-lg" role="dialog" aria-modal="true" aria-labelledby="scholarship-title" style={{ background: "#0d1432", border: "1px solid rgba(124,106,247,0.25)" }}>
            <div className="flex items-start justify-between gap-4 mb-5"><div className="flex gap-3"><span className="text-3xl">{selectedScholarship.logo}</span><div><h2 id="scholarship-title" className="font-semibold text-white">{selectedScholarship.name}</h2><p className="text-xs" style={{ color: "#6b7a9e" }}>{selectedScholarship.country} / {selectedScholarship.type}</p></div></div><button type="button" onClick={() => setSelectedId(null)} aria-label="Close details" style={{ color: "#7d89a2" }}><X size={18} /></button></div>
            <div className="grid grid-cols-2 gap-3 mb-5"><div className="p-3 rounded-md" style={{ background: "#0a1221" }}><span className="text-[10px]" style={{ color: "#6b7a9e" }}>Funding</span><strong className="block mt-1" style={{ color: "#4dd39e" }}>{selectedScholarship.amount}</strong></div><div className="p-3 rounded-md" style={{ background: "#0a1221" }}><span className="text-[10px]" style={{ color: "#6b7a9e" }}>Deadline</span><strong className="block mt-1 text-white">{selectedScholarship.deadline}</strong></div></div>
            <h3 className="text-sm font-semibold text-white mb-2">Eligibility</h3><p className="text-xs leading-relaxed mb-5" style={{ color: "#a8b4d0" }}>{selectedScholarship.eligibility}</p>
            <h3 className="text-sm font-semibold text-white mb-2">Document readiness</h3>
            <div className="space-y-2 mb-5">{selectedScholarship.requiredDocs.map((requirement) => { const ready = documentIsReady(requirement); return <div key={requirement} className="flex items-center justify-between gap-3 p-2.5 rounded-md" style={{ background: "#0a1221" }}><span className="text-xs" style={{ color: "#a8b4d0" }}>{requirement}</span><span className="flex items-center gap-1 text-[10px]" style={{ color: ready ? "#4dd39e" : "#f0b75c" }}>{ready && <Check size={12} />}{ready ? "Ready" : "Check file"}</span></div>; })}</div>
            <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => navigate("/documents")} className="glass-interactive py-2.5 rounded-md text-xs flex items-center justify-center gap-2"><FileCheck2 size={14} /> Documents</button><button type="button" disabled={isScholarshipApplied(selectedScholarship.id)} onClick={() => applyToScholarship(selectedScholarship.id)} className="app-primary-action py-2.5 rounded-md text-xs font-semibold text-white disabled:opacity-60" style={{ background: isScholarshipApplied(selectedScholarship.id) ? "#238a68" : "#665bd7" }}>{isScholarshipApplied(selectedScholarship.id) ? "Checklist started" : "Start application checklist"}</button></div>
          </section>
        </div>
      )}
    </main>
  );
}