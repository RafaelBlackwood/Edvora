import { useState } from "react";
import { MapPin, DollarSign, Shield, Heart, Briefcase, ArrowLeft } from "lucide-react";
import { countryGuides } from "../../data/mockData";

const GUIDE_BG = "https://images.unsplash.com/photo-1548013146-72479768bada?w=1920&h=400&fit=crop&auto=format";

export function DestinationGuidePage() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const country = countryGuides.find((c) => c.id === selectedCountry);

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
                {[["Housing", "€450–900"], ["Food", "€200–350"], ["Transport", "€70–100"], ["Other", "€150–300"]].map(([k, v]) => (
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {countryGuides.map((c) => (
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
      </div>
    </div>
  );
}
