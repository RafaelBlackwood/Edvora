import { useState } from "react";
import { MapPin, DollarSign, Shield, Heart, Briefcase, ArrowLeft, Search, Building2, Calculator } from "lucide-react";
import { useNavigate } from "react-router";
import { countryGuides, universities } from "../../data/mockData";

const GUIDE_BG = "https://images.unsplash.com/photo-1548013146-72479768bada?w=1920&h=400&fit=crop&auto=format";

const budgetBreakdowns: Record<string, Array<[string, string]>> = {
  Germany: [["Housing", "EUR 500-950"], ["Food", "EUR 220-360"], ["Transport", "EUR 49-90"], ["Personal", "EUR 150-280"]],
  Canada: [["Housing", "CAD 900-1,700"], ["Food", "CAD 350-550"], ["Transport", "CAD 100-170"], ["Personal", "CAD 180-350"]],
  "United Kingdom": [["Housing", "GBP 700-1,300"], ["Food", "GBP 250-420"], ["Transport", "GBP 80-180"], ["Personal", "GBP 150-300"]],
  Netherlands: [["Housing", "EUR 650-1,200"], ["Food", "EUR 250-400"], ["Transport", "EUR 70-120"], ["Personal", "EUR 150-280"]],
  "United States": [["Housing", "USD 900-2,000"], ["Food", "USD 350-650"], ["Transport", "USD 80-220"], ["Personal", "USD 200-400"]],
  Australia: [["Housing", "AUD 900-1,700"], ["Food", "AUD 350-600"], ["Transport", "AUD 120-220"], ["Personal", "AUD 200-380"]],
  France: [["Housing", "EUR 550-1,100"], ["Food", "EUR 230-380"], ["Transport", "EUR 35-85"], ["Personal", "EUR 150-280"]],
  Poland: [["Housing", "EUR 300-600"], ["Food", "EUR 180-300"], ["Transport", "EUR 20-45"], ["Personal", "EUR 100-220"]],
  Italy: [["Housing", "EUR 450-850"], ["Food", "EUR 220-350"], ["Transport", "EUR 30-60"], ["Personal", "EUR 130-250"]],
  Austria: [["Housing", "EUR 500-950"], ["Food", "EUR 230-380"], ["Transport", "EUR 30-75"], ["Personal", "EUR 140-270"]],
};

export function DestinationGuidePage() {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const country = countryGuides.find((c) => c.id === selectedCountry);
  const filteredCountries = countryGuides.filter((item) =>
    [item.name, item.visaType, ...item.popularCities].join(" ").toLowerCase().includes(query.trim().toLowerCase()),
  );

  if (selectedCountry && country) {
    return (
      <div style={{ background: "#080d1a", minHeight: "100%" }}>
        <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
          <button
            onClick={() => setSelectedCountry(null)}
            className="flex items-center gap-2 text-sm mb-6 hover:opacity-80 transition-all"
            style={{ color: "#a8b4d0" }}
          >
            <ArrowLeft size={15} /> Back to Countries
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="text-5xl">{country.flag}</div>
            <div>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{country.name}</h1>
              <p className="text-xs mt-1" style={{ color: "#8f9ab0" }}>{universities.filter((university) => university.country === country.name).length} universities currently indexed</p>
              <p className="text-sm" style={{ color: "#6b7a9e" }}>Student Living Guide</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[
              { icon: DollarSign, label: "Avg Tuition", value: country.tuitionAvg, color: "#7c6af7" },
              { icon: MapPin, label: "Monthly Living", value: country.livingCost, color: "#06b6d4" },
              { icon: Shield, label: "Safety Score", value: `${country.safetyScore}/100`, color: "#10b981" },
              { icon: Heart, label: "Healthcare", value: country.healthcareRating, color: "#f59e0b" },
              { icon: Briefcase, label: "Work Rights", value: country.workAllowed, color: "#a855f7" },
              { icon: MapPin, label: "Visa Type", value: country.visaType, color: "#06b6d4" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="p-4 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={15} style={{ color }} />
                  <span className="text-xs" style={{ color: "#6b7a9e" }}>{label}</span>
                </div>
                <div className="text-sm font-medium" style={{ color: "#e8eaf0" }}>{value}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            <button type="button" onClick={() => navigate("/search?q=" + encodeURIComponent(country.name))} className="app-primary-action flex items-center gap-2 px-4 py-2 text-sm text-white" style={{ background: "#665bd7" }}><Building2 size={15} /> Explore universities</button>
            <button type="button" onClick={() => navigate("/budget?country=" + encodeURIComponent(country.name))} className="glass-interactive flex items-center gap-2 px-4 py-2 rounded-md text-sm"><Calculator size={15} /> Build country budget</button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h3 className="font-semibold text-white mb-3">Best Student Cities</h3>
              <div className="space-y-2">
                {country.popularCities.map((city, i) => (
                  <div key={city} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: "rgba(8,13,26,0.4)" }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(124,106,247,0.2)", color: "#a89bf5" }}>{i + 1}</div>
                    <span className="text-sm" style={{ color: "#a8b4d0" }}>{city}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h3 className="font-semibold text-white mb-3">Practical Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span style={{ color: "#6b7a9e" }}>Student Visa: </span>
                  <span style={{ color: "#a8b4d0" }}>{country.visaType}</span>
                </div>
                <div>
                  <span style={{ color: "#6b7a9e" }}>Work allowed: </span>
                  <span style={{ color: "#a8b4d0" }}>{country.workAllowed}</span>
                </div>
                <div>
                  <span style={{ color: "#6b7a9e" }}>Healthcare: </span>
                  <span style={{ color: "#a8b4d0" }}>{country.healthcareRating}</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl md:col-span-2" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h3 className="font-semibold text-white mb-3">Monthly Budget Estimate</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(budgetBreakdowns[country.name] ?? [["Housing", country.livingCost], ["Food", "See city guide"], ["Transport", "See city guide"], ["Personal", "Set a custom budget"]]).map(([k, v]) => (
                  <div key={k as string} className="p-3 rounded-xl text-center" style={{ background: "rgba(8,13,26,0.5)" }}>
                    <div className="text-xs mb-1" style={{ color: "#6b7a9e" }}>{k as string}</div>
                    <div className="text-sm font-medium" style={{ color: "#e8eaf0" }}>{v as string}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="relative h-40 overflow-hidden">
        <img src={GUIDE_BG} alt="World" className="w-full h-full object-cover" style={{ filter: "brightness(0.2) saturate(0.4)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,13,26,0.4), rgba(8,13,26,0.92) 80%, #080d1a 100%)" }} />
        <div className="absolute inset-0 flex items-center px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Destination Guide</h1>
            <p className="text-sm mt-1" style={{ color: "#a8b4d0" }}>Everything you need to know about studying abroad</p>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <label className="relative block max-w-xl mb-5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#6b7a9e" }} />
          <span className="sr-only">Search destinations</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search countries, cities, or visa types" className="w-full pl-9 pr-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "#0e1729", border: "1px solid rgba(124,106,247,0.18)", color: "#e8eaf0" }} />
        </label>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCountries.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCountry(c.id)}
              className="p-5 rounded-2xl text-left transition-all hover:-translate-y-1 hover:border-purple-500/30 group"
              style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}
            >
              <div className="text-4xl mb-3">{c.flag}</div>
              <h3 className="font-semibold text-white mb-1">{c.name}</h3>
              <div className="space-y-1 text-xs">
                <div style={{ color: "#6b7a9e" }}>Tuition: <span style={{ color: "#a8b4d0" }}>{c.tuitionAvg}</span></div>
                <div style={{ color: "#6b7a9e" }}>Living: <span style={{ color: "#a8b4d0" }}>{c.livingCost}</span></div>
                <div style={{ color: "#6b7a9e" }}>Safety: <span style={{ color: "#10b981" }}>{c.safetyScore}/100</span></div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium" style={{ color: "#a89bf5" }}>
                Explore guide →
              </div>
            </button>
          ))}
        </div>
        {filteredCountries.length === 0 && <div className="py-16 text-center" style={{ color: "#6b7a9e" }}><MapPin size={28} className="mx-auto mb-3" /><p className="text-sm">No destinations match that search.</p></div>}
      </div>
    </div>
  );
}
