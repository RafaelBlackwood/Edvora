import { useState } from "react";
import { Calculator, Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";

const CALC_BG = "https://images.unsplash.com/photo-1419640303358-44f0d27f48e7?w=1920&h=400&fit=crop&auto=format";

export function AcceptanceCalculatorPage() {
  const [form, setForm] = useState({
    gpa: "3.6", ielts: "7.0", toefl: "", gre: "", gmat: "", sat: "",
    degree: "Masters", field: "Computer Science", work: "1 year",
    research: false, portfolio: false, motivation: false, recommendations: "1",
    targetProgram: "Technical University of Munich — MSc CS",
  });
  const [result, setResult] = useState<null | { chance: number; strong: string[]; weak: string[]; missing: string[]; risk: string; safe: string[]; target: string[]; ambitious: string[]; explanation: string }>(null);
  const [calculating, setCalculating] = useState(false);

  const calculate = async () => {
    setCalculating(true);
    await new Promise((r) => setTimeout(r, 1800));
    const gpa = parseFloat(form.gpa) || 0;
    const ielts = parseFloat(form.ielts) || 0;
    let base = 50;
    if (gpa >= 3.7) base += 20;
    else if (gpa >= 3.3) base += 10;
    else if (gpa < 3.0) base -= 15;
    if (ielts >= 7.0) base += 15;
    else if (ielts >= 6.5) base += 8;
    else if (ielts < 6.0) base -= 20;
    if (form.motivation) base += 5;
    if (form.portfolio) base += 5;
    if (parseInt(form.recommendations) >= 2) base += 5;
    if (form.research) base += 8;
    const chance = Math.min(95, Math.max(15, base));
    setResult({
      chance,
      strong: ["IELTS 7.0 meets program requirements", "Field of study aligns with target program", "Work experience adds competitive edge"],
      weak: ["GPA slightly below average admitted students (avg. 3.7)", "Only 1 recommendation letter (2 expected)"],
      missing: !form.motivation ? ["Motivation letter not prepared"] : !form.portfolio ? ["Portfolio may be required"] : [],
      risk: chance >= 70 ? "Low" : chance >= 50 ? "Medium" : "High",
      safe: ["University of Warsaw — MSc CS", "Politecnico di Milano — MSc SE", "Lund University — MSc CS"],
      target: ["Technical University of Munich — MSc CS", "University of Amsterdam — MSc DS"],
      ambitious: ["University of Toronto — MSc HCI", "UC Irvine — MSc CS"],
      explanation: `Your estimated admission chance is ${chance}%. Your IELTS score and field match are strong, but your GPA is slightly below the average for this program. Adding a second recommendation letter and preparing a strong motivation letter could improve your profile by 8–12 percentage points.`,
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
            <p className="text-sm mt-1" style={{ color: "#a8b4d0" }}>AI-powered admission probability analysis</p>
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
                  <input
                    value={form.targetProgram}
                    onChange={(e) => setForm((prev) => ({ ...prev, targetProgram: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(8,13,26,0.6)", border: "1px solid rgba(124,106,247,0.15)", color: "#e8eaf0" }}
                  />
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
