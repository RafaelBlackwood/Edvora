import { useState } from "react";
import { Calculator, Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { universities } from "../../data/mockData";
import { useAppData } from "../../providers/AppDataProvider";

const CALC_BG = "https://images.unsplash.com/photo-1419640303358-44f0d27f48e7?w=1920&h=400&fit=crop&auto=format";

function scoreUniversity(
  university: (typeof universities)[number],
  profile: { gpa: number; ielts: number; research: boolean; portfolio: boolean; motivation: boolean; recommendations: number },
) {
  let score = 42 + Math.min(16, university.acceptanceRate * 0.35) + (university.matchScore - 70) * 0.2;
  const gpaMargin = profile.gpa - university.gpaMin;
  const ieltsMargin = profile.ielts - university.ieltsMin;
  score += gpaMargin >= 0.4 ? 18 : gpaMargin >= 0 ? 10 : Math.max(-24, gpaMargin * 28);
  score += ieltsMargin >= 0.5 ? 12 : ieltsMargin >= 0 ? 7 : Math.max(-20, ieltsMargin * 22);
  if (profile.research) score += 5;
  if (profile.portfolio) score += 3;
  if (profile.motivation) score += 5;
  if (profile.recommendations >= 2) score += 4;
  if (university.greRequired && !profile.research) score -= 4;
  return Math.round(Math.min(95, Math.max(8, score)));
}

export function AcceptanceCalculatorPage() {
  const { userProfile } = useAppData();
  const [form, setForm] = useState({
    gpa: String(userProfile.gpa), ielts: String(userProfile.ielts ?? ""), toefl: String(userProfile.toefl ?? ""), gre: String(userProfile.gre ?? ""), gmat: String(userProfile.gmat ?? ""), sat: String(userProfile.sat ?? ""),
    degree: userProfile.targetDegree, field: userProfile.fieldOfStudy, work: userProfile.workExperience,
    research: false, portfolio: false, motivation: false, recommendations: "1",
    targetProgram: universities[1].id,
  });
  const [result, setResult] = useState<null | { chance: number; strong: string[]; weak: string[]; missing: string[]; risk: string; safe: string[]; target: string[]; ambitious: string[]; explanation: string }>(null);
  const [calculating, setCalculating] = useState(false);

  const calculate = async () => {
    setCalculating(true);
    await new Promise((resolve) => setTimeout(resolve, 450));

    const gpa = Number.parseFloat(form.gpa) || 0;
    const ielts = Number.parseFloat(form.ielts) || 0;
    const recommendations = Number.parseInt(form.recommendations, 10) || 0;
    const targetUniversity = universities.find((university) => university.id === form.targetProgram) ?? universities[0];
    const profile = {
      gpa,
      ielts,
      research: form.research,
      portfolio: form.portfolio,
      motivation: form.motivation,
      recommendations,
    };
    const chance = scoreUniversity(targetUniversity, profile);
    const rankedOptions = universities
      .map((university) => ({
        chance: scoreUniversity(university, profile),
        label: university.name + " - " + university.programs[0],
      }))
      .sort((first, second) => second.chance - first.chance);

    const strong = [
      gpa >= targetUniversity.gpaMin
        ? "GPA meets the listed minimum of " + targetUniversity.gpaMin.toFixed(1)
        : null,
      ielts >= targetUniversity.ieltsMin
        ? "English score meets the IELTS-equivalent minimum of " + targetUniversity.ieltsMin.toFixed(1)
        : null,
      form.research ? "Research experience strengthens academic fit" : null,
      form.motivation ? "Motivation letter is ready" : null,
      recommendations >= 2 ? "Recommendation coverage is competitive" : null,
    ].filter((item): item is string => Boolean(item));

    const weak = [
      gpa < targetUniversity.gpaMin
        ? "GPA is below the listed minimum by " + (targetUniversity.gpaMin - gpa).toFixed(1)
        : null,
      ielts < targetUniversity.ieltsMin
        ? "English score is below the listed minimum by " + (targetUniversity.ieltsMin - ielts).toFixed(1)
        : null,
      recommendations < 2 ? "Most graduate applications expect two references" : null,
      targetUniversity.greRequired && !form.research
        ? "This university lists the GRE and the profile has limited research evidence"
        : null,
    ].filter((item): item is string => Boolean(item));

    const missing = [
      !form.motivation ? "Motivation letter not prepared" : null,
      !form.portfolio && targetUniversity.programs.some((program) => program.toLowerCase().includes("hci"))
        ? "Portfolio may strengthen this program"
        : null,
    ].filter((item): item is string => Boolean(item));

    setResult({
      chance,
      strong: strong.length ? strong : ["Program and study field are broadly aligned"],
      weak: weak.length ? weak : ["No major threshold gaps detected"],
      missing,
      risk: chance >= 70 ? "Low" : chance >= 50 ? "Medium" : "High",
      safe: rankedOptions.filter((option) => option.chance >= Math.max(65, chance + 8)).slice(0, 3).map((option) => option.label),
      target: rankedOptions.filter((option) => option.chance >= 45 && option.chance < Math.max(65, chance + 8)).slice(0, 3).map((option) => option.label),
      ambitious: rankedOptions.filter((option) => option.chance < 45).slice(0, 3).map((option) => option.label),
      explanation:
        "This estimate compares your GPA and English score with " +
        targetUniversity.name +
        "'s listed thresholds, then adjusts for selectivity, profile match, and application readiness. It is a planning estimate, not an admission guarantee.",
    });
    setCalculating(false);
  };

  const riskColor = (r: string) => r === "Low" ? "#10b981" : r === "Medium" ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="relative h-40 overflow-hidden">
        <img src={CALC_BG} alt="Study" className="w-full h-full object-cover" style={{ filter: "brightness(0.2) saturate(0.5)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,13,26,0.4), rgba(8,13,26,0.92) 80%, #080d1a 100%)" }} />
        <div className="absolute inset-0 flex items-center px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Acceptance Calculator</h1>
            <p className="text-sm mt-1" style={{ color: "#a8b4d0" }}>Profile-based admission readiness estimate</p>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input form */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h3 className="font-semibold text-white mb-4">Your Profile</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "GPA (0–4.0)", key: "gpa", placeholder: "3.6" },
                  { label: "IELTS Score", key: "ielts", placeholder: "7.0" },
                  { label: "TOEFL Score", key: "toefl", placeholder: "Optional" },
                  { label: "GRE Score", key: "gre", placeholder: "Optional" },
                  { label: "GMAT Score", key: "gmat", placeholder: "Optional" },
                  { label: "SAT Score", key: "sat", placeholder: "Optional" },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#6b7a9e" }}>{label}</label>
                    <input
                      type="number"
                      placeholder={placeholder}
                      value={form[key as keyof typeof form] as string}
                      onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: "rgba(8,13,26,0.6)", border: "1px solid rgba(124,106,247,0.15)", color: "#e8eaf0" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h3 className="font-semibold text-white mb-4">Application Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#6b7a9e" }}>Target Program</label>
                  <select
                    value={form.targetProgram}
                    onChange={(event) => setForm((previous) => ({ ...previous, targetProgram: event.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(8,13,26,0.6)", border: "1px solid rgba(124,106,247,0.15)", color: "#e8eaf0" }}
                  >
                    {universities.map((university) => (
                      <option key={university.id} value={university.id}>
                        {university.name} - {university.programs[0]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#6b7a9e" }}>Work Experience</label>
                  <select
                    value={form.work}
                    onChange={(e) => setForm((prev) => ({ ...prev, work: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
                    style={{ background: "rgba(8,13,26,0.6)", border: "1px solid rgba(124,106,247,0.15)", color: "#e8eaf0" }}
                  >
                    {["None", "< 6 months", "1 year", "2+ years", "5+ years"].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#6b7a9e" }}>Recommendation Letters</label>
                  <select
                    value={form.recommendations}
                    onChange={(e) => setForm((prev) => ({ ...prev, recommendations: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
                    style={{ background: "rgba(8,13,26,0.6)", border: "1px solid rgba(124,106,247,0.15)", color: "#e8eaf0" }}
                  >
                    {["0", "1", "2", "3+"].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Research experience", key: "research" },
                    { label: "Portfolio prepared", key: "portfolio" },
                    { label: "Motivation letter ready", key: "motivation" },
                  ].map(({ label, key }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => setForm((prev) => ({ ...prev, [key]: !prev[key as keyof typeof form] }))}
                        className="w-5 h-5 rounded flex items-center justify-center transition-all"
                        style={{
                          background: form[key as keyof typeof form] ? "#7c6af7" : "rgba(8,13,26,0.6)",
                          border: `1px solid ${form[key as keyof typeof form] ? "#7c6af7" : "rgba(124,106,247,0.2)"}`,
                        }}
                      >
                        {form[key as keyof typeof form] && <CheckCircle2 size={12} className="text-white" />}
                      </div>
                      <span className="text-sm" style={{ color: "#a8b4d0" }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={calculate}
              disabled={calculating}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
            >
              {calculating ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing your profile...</>
              ) : (
                <><Sparkles size={16} /> Calculate My Chances</>
              )}
            </button>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {result ? (
              <>
                {/* Main chance indicator */}
                <div className="p-6 rounded-2xl text-center" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.2)" }}>
                  <p className="text-sm mb-3" style={{ color: "#6b7a9e" }}>Estimated Admission Chance</p>
                  <div className="relative h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="80%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={[{ value: result.chance, fill: result.chance >= 70 ? "#10b981" : result.chance >= 50 ? "#f59e0b" : "#ef4444" }]}>
                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar background dataKey="value" cornerRadius={10} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
                      <div className="text-5xl font-bold" style={{ color: result.chance >= 70 ? "#10b981" : result.chance >= 50 ? "#f59e0b" : "#ef4444", fontFamily: "var(--font-mono)" }}>
                        {result.chance}%
                      </div>
                      <div className="text-xs mt-1 px-3 py-1 rounded-full" style={{ background: `${riskColor(result.risk)}20`, color: riskColor(result.risk) }}>
                        {result.risk} Risk
                      </div>
                    </div>
                  </div>
                  <p className="text-sm mt-3 leading-relaxed" style={{ color: "#a8b4d0" }}>{result.explanation}</p>
                </div>

                {/* Strong/Weak */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={14} style={{ color: "#10b981" }} />
                      <span className="text-sm font-medium" style={{ color: "#10b981" }}>Strengths</span>
                    </div>
                    {result.strong.map((s, i) => (
                      <p key={i} className="text-xs mb-1" style={{ color: "#a8b4d0" }}>• {s}</p>
                    ))}
                  </div>
                  <div className="p-4 rounded-2xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown size={14} style={{ color: "#f59e0b" }} />
                      <span className="text-sm font-medium" style={{ color: "#f59e0b" }}>Weaknesses</span>
                    </div>
                    {result.weak.map((s, i) => (
                      <p key={i} className="text-xs mb-1" style={{ color: "#a8b4d0" }}>• {s}</p>
                    ))}
                  </div>
                </div>

                {/* Suggestions */}
                {[
                  { label: "Safe Options", items: result.safe, color: "#10b981" },
                  { label: "Target Options", items: result.target, color: "#7c6af7" },
                  { label: "Ambitious Options", items: result.ambitious, color: "#f59e0b" },
                ].map(({ label, items, color }) => (
                  <div key={label} className="p-4 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="text-sm font-medium text-white">{label}</span>
                    </div>
                    {items.map((item, i) => (
                      <p key={i} className="text-xs py-1" style={{ color: "#a8b4d0", borderBottom: i < items.length - 1 ? "1px solid rgba(124,106,247,0.08)" : "none" }}>{item}</p>
                    ))}
                  </div>
                ))}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(124,106,247,0.1)", border: "1px solid rgba(124,106,247,0.2)" }}>
                  <Calculator size={32} style={{ color: "#7c6af7" }} />
                </div>
                <h3 className="font-semibold text-white mb-2">Ready to analyze</h3>
                <p className="text-sm" style={{ color: "#6b7a9e" }}>Fill in your profile details on the left and click Calculate to see your admission probability.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
