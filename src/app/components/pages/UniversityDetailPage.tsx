import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Heart, GitCompare, ArrowLeft, MapPin, Users, Globe, Star, Award, CheckCircle2, ExternalLink } from "lucide-react";
import { universities, programs } from "../../data/mockData";
import { useAppData } from "../../providers/AppDataProvider";

const tabs = ["Overview", "Programs", "Requirements", "Costs", "Scholarships", "Application Guide"];

const appGuideSteps = [
  { step: 1, title: "Choose Program", desc: "Browse and select your target program with our smart search." },
  { step: 2, title: "Check Requirements", desc: "Review GPA, language scores, and document requirements." },
  { step: 3, title: "Prepare Documents", desc: "Upload transcripts, CV, motivation letter, and references." },
  { step: 4, title: "Fill Application Form", desc: "Complete your personal, academic, and professional details." },
  { step: 5, title: "Submit Application", desc: "Submit directly via Edvora or export a PDF package." },
  { step: 6, title: "Apply for Scholarship", desc: "Simultaneously apply for available scholarships." },
  { step: 7, title: "Wait for Review", desc: "Track your application status in real time." },
  { step: 8, title: "Accept Offer", desc: "Confirm your place and begin visa preparation." },
];

export function UniversityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    compareUniversityIds,
    isUniversitySaved,
    toggleUniversityCompare,
    toggleUniversitySave,
  } = useAppData();
  const [activeTab, setActiveTab] = useState("Overview");

  const uni = universities.find((u) => u.id === id) || universities[0];
  const uniPrograms = programs.filter((p) => p.universityId === uni.id);
  const displayPrograms = uniPrograms.length > 0
    ? uniPrograms
    : uni.programs.map((name, index) => ({
        id: "catalog-" + uni.id + "-" + index,
        name,
        universityId: uni.id,
        university: uni.name,
        duration: name.startsWith("PhD") ? "4-5 years" : name.startsWith("Bachelor") ? "3-4 years" : "1-2 years",
        tuition: uni.tuition,
        currency: uni.currency,
        deadline: uni.deadline,
        intake: "Fall",
        language: "English",
        department: name.startsWith("PhD") ? "Doctoral School" : "Graduate Studies",
        requirements: {
          gpa: uni.gpaMin,
          ielts: uni.ieltsMin,
          gre: uni.greRequired,
          portfolio: false,
        },
        description: "A full-time " + name + " pathway with access to " + uni.strengths.slice(0, 2).join(" and ") + ".",
      }));
  const saved = isUniversitySaved(uni.id);
  const comparing = compareUniversityIds.includes(uni.id);

  return (
    <div style={{ background: "#080d1a", minHeight: "100%" }}>
      {/* Hero */}
      <div className="relative h-64 overflow-hidden">
        <img src={uni.image} alt={uni.name} className="w-full h-full object-cover" style={{ filter: "brightness(0.5)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,13,26,0.2) 0%, rgba(8,13,26,0.85) 80%, #080d1a 100%)" }} />

        <div className="absolute top-4 left-4 lg:left-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-xl transition-all hover:bg-white/10"
            style={{ background: "rgba(0,0,0,0.4)", color: "#a8b4d0" }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        <div className="absolute bottom-6 left-4 lg:left-8 right-4 flex items-end justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ background: "rgba(13,20,50,0.9)", border: "1px solid rgba(124,106,247,0.2)" }}>
              {uni.logo}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{uni.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-sm" style={{ color: "#a8b4d0" }}>
                  <MapPin size={12} /> {uni.city}, {uni.country}
                </span>
                <span className="flex items-center gap-1 text-sm" style={{ color: "#f59e0b" }}>
                  <Star size={12} /> #{uni.ranking} World
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toggleUniversitySave(uni.id)}
              className="glass-interactive w-10 h-10 flex items-center justify-center"
              style={{ color: saved ? "#ef6d75" : "#a8b4d0" }}
              aria-label={(saved ? "Remove " : "Save ") + uni.name}
              title={saved ? "Remove from wishlist" : "Save to wishlist"}
            >
              <Heart size={16} fill={saved ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => toggleUniversityCompare(uni.id)}
              disabled={!comparing && compareUniversityIds.length >= 3}
              className="glass-interactive w-10 h-10 flex items-center justify-center disabled:opacity-40"
              style={{ color: comparing ? "#a89bf5" : "#a8b4d0" }}
              aria-label={(comparing ? "Remove " : "Compare ") + uni.name}
              title={comparing ? "Remove from comparison" : "Add to comparison"}
            >
              <GitCompare size={16} />
            </button>
            <button
              onClick={() => navigate("/applications?new=1&university=" + uni.id)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
            >
              Apply Now
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid rgba(124,106,247,0.12)", background: "rgba(8,13,26,0.8)", backdropFilter: "blur(12px)" }}
        className="sticky top-0 z-10 px-4 lg:px-8">
        <div className="flex overflow-x-auto gap-1 -mb-px scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2"
              style={{
                borderBottomColor: activeTab === tab ? "#7c6af7" : "transparent",
                color: activeTab === tab ? "#a89bf5" : "#6b7a9e",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        {activeTab === "Overview" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <h3 className="font-semibold text-white mb-3">About</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#a8b4d0" }}>{uni.description}</p>
              </div>
              <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <h3 className="font-semibold text-white mb-3">Key Strengths</h3>
                <div className="flex flex-wrap gap-2">
                  {uni.strengths.map((s) => (
                    <span key={s} className="px-3 py-1.5 rounded-full text-sm" style={{ background: "rgba(124,106,247,0.1)", color: "#a89bf5", border: "1px solid rgba(124,106,247,0.2)" }}>{s}</span>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <h3 className="font-semibold text-white mb-3">Available Programs</h3>
                <div className="space-y-2">
                  {uni.programs.map((p) => (
                    <div key={p} className="flex items-center gap-2 text-sm" style={{ color: "#a8b4d0" }}>
                      <CheckCircle2 size={14} style={{ color: "#10b981" }} /> {p}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <h3 className="font-semibold text-white mb-4">At a Glance</h3>
                <div className="space-y-3">
                  {[
                    { icon: Users, label: "Students", value: `${(uni.studentPopulation / 1000).toFixed(0)}K+` },
                    { icon: Globe, label: "International", value: `${uni.internationalPercent}%` },
                    { icon: Star, label: "World Ranking", value: `#${uni.worldRanking}` },
                    { icon: Award, label: "Type", value: uni.type },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm" style={{ color: "#6b7a9e" }}>
                        <Icon size={14} /> {label}
                      </div>
                      <span className="text-sm font-medium" style={{ color: "#e8eaf0" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <h3 className="font-semibold text-white mb-3">Quick Facts</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: "#6b7a9e" }}>Acceptance Rate</span>
                    <span style={{ color: "#10b981" }}>{uni.acceptanceRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#6b7a9e" }}>IELTS Minimum</span>
                    <span style={{ color: "#a8b4d0" }}>{uni.ieltsMin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#6b7a9e" }}>Min GPA</span>
                    <span style={{ color: "#a8b4d0" }}>{uni.gpaMin}/4.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#6b7a9e" }}>GRE Required</span>
                    <span style={{ color: uni.greRequired ? "#f59e0b" : "#10b981" }}>{uni.greRequired ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "#6b7a9e" }}>Scholarship</span>
                    <span style={{ color: uni.scholarshipAvailable ? "#10b981" : "#6b7a9e" }}>{uni.scholarshipAvailable ? "Available" : "Limited"}</span>
                  </div>
                </div>
              </div>
              <a
                href={uni.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                style={{ background: "rgba(124,106,247,0.1)", border: "1px solid rgba(124,106,247,0.2)", color: "#a89bf5" }}
              >
                <ExternalLink size={14} /> Official Website
              </a>
            </div>
          </div>
        )}

        {activeTab === "Programs" && (
          <div className="space-y-4">
            {displayPrograms.map((prog) => (
              <div key={prog.id} className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{prog.name}</h3>
                    <p className="text-sm mt-0.5" style={{ color: "#6b7a9e" }}>{prog.department} · {prog.duration}</p>
                  </div>
                  <button
                    onClick={() => navigate("/applications?new=1&university=" + uni.id + "&program=" + encodeURIComponent(prog.name))}
                    className="shrink-0 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
                  >
                    Apply
                  </button>
                </div>
                <p className="text-sm mb-3" style={{ color: "#a8b4d0" }}>{prog.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    ["Tuition", prog.tuition === 0 ? "Free" : `${prog.currency} ${prog.tuition.toLocaleString()}/yr`],
                    ["Deadline", prog.deadline],
                    ["Language", prog.language],
                    ["Intake", prog.intake],
                  ].map(([k, v]) => (
                    <div key={k as string} className="px-3 py-2 rounded-xl" style={{ background: "rgba(8,13,26,0.5)" }}>
                      <div className="text-xs" style={{ color: "#6b7a9e" }}>{k as string}</div>
                      <div className="text-sm font-medium mt-0.5" style={{ color: "#e8eaf0" }}>{v as string}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Requirements" && (
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: "Academic Requirements", items: [
                [`GPA Minimum`, `${uni.gpaMin}/4.0`],
                [`IELTS Minimum`, `${uni.ieltsMin}`],
                [`TOEFL`, `90+ (alternative to IELTS)`],
                [`GRE`, uni.greRequired ? "Required" : "Not required"],
                [`GMAT`, uni.gmatRequired ? "Required" : "Not required"],
              ]},
              { title: "Required Documents", items: [
                ["Official Transcripts", "Certified, translated"],
                ["CV / Resume", "Academic + professional"],
                ["Motivation Letter", "Program-specific"],
                ["Letters of Recommendation", "2 academic references"],
                ["Passport Copy", "Valid for program duration"],
                ["Bachelor's Diploma", "Certified copy"],
              ]},
            ].map(({ title, items }) => (
              <div key={title} className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <h3 className="font-semibold text-white mb-4">{title}</h3>
                <div className="space-y-2.5">
                  {items.map(([k, v]) => (
                    <div key={k as string} className="flex items-center justify-between gap-4">
                      <span className="text-sm" style={{ color: "#a8b4d0" }}>{k as string}</span>
                      <span className="text-sm font-medium text-right" style={{ color: "#e8eaf0" }}>{v as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Costs" && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h3 className="font-semibold text-white mb-4">Tuition Fees</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "#6b7a9e" }}>Annual Tuition</span>
                  <span className="font-medium" style={{ color: uni.tuition === 0 ? "#10b981" : "#e8eaf0" }}>
                    {uni.tuition === 0 ? "Free / €0" : `${uni.currency} ${uni.tuition.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#6b7a9e" }}>Semester Fee</span>
                  <span style={{ color: "#a8b4d0" }}>{uni.tuition === 0 ? "~€150–350" : `${uni.currency} ${(uni.tuition / 2).toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#6b7a9e" }}>Application Fee</span>
                  <span style={{ color: "#a8b4d0" }}>~$75–150</span>
                </div>
              </div>
            </div>
            <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h3 className="font-semibold text-white mb-4">Estimated Living Costs in {uni.city}</h3>
              <div className="space-y-3 text-sm">
                {[["Housing", "€450–900/mo"], ["Food", "€200–350/mo"], ["Transport", "€70–100/mo"], ["Health Insurance", "€80–120/mo"], ["Personal", "€100–200/mo"]].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between">
                    <span style={{ color: "#6b7a9e" }}>{k as string}</span>
                    <span style={{ color: "#a8b4d0" }}>{v as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Scholarships" && (
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: "University Merit Scholarship", amount: "€600/mo", type: "University-funded", coverage: "Living stipend" },
              { name: "DAAD Scholarship", amount: "€1,200/mo", type: "Government-funded", coverage: "Full — tuition + living" },
              { name: "Department Assistantship", amount: "€800/mo", type: "Research position", coverage: "Stipend + fee waiver" },
            ].map((s) => (
              <div key={s.name} className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-white">{s.name}</h3>
                  <span className="text-sm font-bold" style={{ color: "#10b981" }}>{s.amount}</span>
                </div>
                <p className="text-xs mb-2" style={{ color: "#6b7a9e" }}>{s.type}</p>
                <p className="text-sm" style={{ color: "#a8b4d0" }}>{s.coverage}</p>
                <button
                  onClick={() => navigate("/scholarships")}
                  className="mt-3 text-xs font-medium hover:underline flex items-center gap-1"
                  style={{ color: "#a89bf5" }}
                >
                  See details <ArrowLeft size={10} className="rotate-180" />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Application Guide" && (
          <div className="max-w-2xl mx-auto">
            <div className="space-y-3">
              {appGuideSteps.map((step, i) => (
                <div
                  key={step.step}
                  className="flex items-start gap-4 p-4 rounded-2xl transition-all"
                  style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                    style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)", color: "white" }}
                  >
                    {step.step}
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">{step.title}</h4>
                    <p className="text-sm mt-0.5" style={{ color: "#6b7a9e" }}>{step.desc}</p>
                  </div>
                  {i < appGuideSteps.length - 1 && (
                    <div className="ml-4 mt-8 w-0.5 h-4 shrink-0" style={{ background: "rgba(124,106,247,0.2)" }} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate("/applications?new=1&university=" + uni.id)}
                className="px-8 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
                style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
              >
                Start Your Application
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
