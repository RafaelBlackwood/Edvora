import { useState } from "react";
import { Award, Heart, ExternalLink, ChevronDown, Search } from "lucide-react";
import { scholarships } from "../../data/mockData";

const SCHOLARSHIP_BG = "https://images.unsplash.com/photo-1722977735215-d28f2ac6efba?w=1920&h=400&fit=crop&auto=format";

export function ScholarshipsPage() {
  const [query, setQuery] = useState("");
  const [savedIds, setSavedIds] = useState<string[]>(["2", "5"]);
  const [filterType, setFilterType] = useState("All");
  const [filterLevel, setFilterLevel] = useState("All");

  const filtered = scholarships.filter((s) => {
    if (query && !s.name.toLowerCase().includes(query.toLowerCase()) && !s.country.toLowerCase().includes(query.toLowerCase())) return false;
    if (filterType !== "All" && s.type !== filterType) return false;
    if (filterLevel !== "All" && !s.degreeLevel.includes(filterLevel)) return false;
    return true;
  });

  const toggleSave = (id: string) => setSavedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const diffColor = (d: string) => {
    if (d === "Very High") return "#ef4444";
    if (d === "High") return "#f59e0b";
    if (d === "Medium") return "#06b6d4";
    return "#10b981";
  };

  return (
    <div style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="relative h-40 overflow-hidden">
        <img src={SCHOLARSHIP_BG} alt="Library" className="w-full h-full object-cover" style={{ filter: "brightness(0.2) saturate(0.4)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,13,26,0.4), rgba(8,13,26,0.9) 80%, #080d1a 100%)" }} />
        <div className="absolute inset-0 flex flex-col justify-center px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Scholarships & Funding</h1>
          <p className="text-sm mt-1" style={{ color: "#a8b4d0" }}>Discover {scholarships.length} scholarships matching your profile</p>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        {/* Popular categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[
            { name: "DAAD", flag: "🇩🇪", color: "#7c6af7" },
            { name: "Fulbright", flag: "🇺🇸", color: "#ef4444" },
            { name: "Erasmus+", flag: "🇪🇺", color: "#f59e0b" },
            { name: "Chevening", flag: "🇬🇧", color: "#06b6d4" },
            { name: "University Grants", flag: "🏫", color: "#10b981" },
          ].map((cat) => (
            <div
              key={cat.name}
              className="p-3 rounded-2xl text-center cursor-pointer hover:opacity-90 transition-all"
              style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}30` }}
            >
              <div className="text-2xl mb-1">{cat.flag}</div>
              <div className="text-sm font-medium" style={{ color: cat.color }}>{cat.name}</div>
            </div>
          ))}
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#6b7a9e" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search scholarships..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "rgba(13,22,53,0.8)", border: "1px solid rgba(124,106,247,0.2)", color: "#e8eaf0" }}
            />
          </div>
          {[
            { label: "Type", value: filterType, options: ["All", "Government", "University"], setter: setFilterType },
            { label: "Level", value: filterLevel, options: ["All", "Bachelor", "Masters", "PhD"], setter: setFilterLevel },
          ].map(({ label, value, options, setter }) => (
            <div key={label} className="relative">
              <select
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "rgba(13,22,53,0.8)", border: "1px solid rgba(124,106,247,0.2)", color: "#a8b4d0" }}
              >
                {options.map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#6b7a9e" }} />
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((s) => {
            const saved = savedIds.includes(s.id);
            return (
              <div
                key={s.id}
                className="p-5 rounded-2xl transition-all hover:-translate-y-0.5"
                style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.logo}</span>
                    <div>
                      <h3 className="font-semibold text-white">{s.name}</h3>
                      <p className="text-xs mt-0.5" style={{ color: "#6b7a9e" }}>{s.country} · {s.type}</p>
                    </div>
                  </div>
                  <button onClick={() => toggleSave(s.id)}>
                    <Heart size={16} fill={saved ? "#ef4444" : "none"} style={{ color: saved ? "#ef4444" : "#6b7a9e" }} />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-lg font-bold" style={{ color: "#10b981", fontFamily: "var(--font-mono)" }}>{s.amount}</div>
                    <div className="text-xs" style={{ color: "#6b7a9e" }}>{s.coverage}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium px-2 py-1 rounded-full" style={{ background: `${diffColor(s.difficulty)}20`, color: diffColor(s.difficulty) }}>
                      {s.difficulty} competition
                    </div>
                    <div className="text-xs mt-1" style={{ color: "#6b7a9e" }}>Match: {s.matchScore}%</div>
                  </div>
                </div>

                <p className="text-xs mb-3" style={{ color: "#a8b4d0" }}>{s.eligibility}</p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {s.degreeLevel.map((l) => (
                    <span key={l} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(124,106,247,0.1)", color: "#a89bf5" }}>{l}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs mb-4" style={{ color: "#6b7a9e" }}>
                  <span>Deadline: <span style={{ color: "#f59e0b" }}>{s.deadline}</span></span>
                  <span>{s.requiredDocs.length} docs required</span>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-90"
                    style={{ background: "rgba(124,106,247,0.15)", color: "#a89bf5", border: "1px solid rgba(124,106,247,0.25)" }}
                  >
                    View Details
                  </button>
                  <button
                    className="flex-1 py-2 rounded-xl text-xs font-medium text-white transition-all hover:opacity-90 flex items-center justify-center gap-1"
                    style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
                  >
                    Apply <ExternalLink size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Funding guide */}
        <div className="mt-8 p-6 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Award size={18} style={{ color: "#f59e0b" }} />
            <h3 className="font-semibold text-white">Funding Guide</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { q: "What does 'full scholarship' cover?", a: "Tuition fees, living stipend (€800–1,500/mo), health insurance, and often travel allowance." },
              { q: "Can I apply for multiple scholarships?", a: "Yes — most scholarships allow concurrent applications. Some have stacking restrictions; check individual terms." },
              { q: "Are assistantships automatic?", a: "No. Teaching/Research Assistantships are separate positions you apply for, often after admission." },
            ].map(({ q, a }) => (
              <div key={q} className="p-4 rounded-xl" style={{ background: "rgba(8,13,26,0.5)" }}>
                <p className="text-sm font-medium text-white mb-2">{q}</p>
                <p className="text-xs" style={{ color: "#a8b4d0" }}>{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
