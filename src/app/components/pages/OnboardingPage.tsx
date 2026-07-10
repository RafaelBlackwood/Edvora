import { useState } from "react";
import { useNavigate } from "react-router";
import { Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";

const BOOKSHELF_BG = "https://images.unsplash.com/photo-1653055274479-225eff1cc16b?w=1920&h=1080&fit=crop&auto=format";

const steps = [
  {
    title: "What degree are you targeting?",
    subtitle: "We'll tailor your university matches accordingly",
    field: "targetDegree",
    type: "single",
    options: ["Bachelor's", "Master's", "PhD", "MBA", "Language Course"],
  },
  {
    title: "Where do you want to study?",
    subtitle: "Select one or more destinations",
    field: "countries",
    type: "multi",
    options: ["Germany", "Canada", "United Kingdom", "Netherlands", "United States", "Australia", "France", "Sweden", "Poland", "Italy"],
  },
  {
    title: "What will you study?",
    subtitle: "Choose your primary field of interest",
    field: "field",
    type: "single",
    options: ["Computer Science & IT", "Engineering", "Business & Management", "Medicine & Health", "Social Sciences", "Arts & Humanities", "Law", "Natural Sciences", "Other"],
  },
  {
    title: "Your current education level?",
    subtitle: "Tell us where you are in your academic journey",
    field: "level",
    type: "single",
    options: ["High School", "Bachelor's (1–2nd year)", "Bachelor's (Final Year)", "Bachelor's Completed", "Master's Completed", "Working Professional"],
  },
  {
    title: "Academic performance",
    subtitle: "Your GPA and test scores help us find your best matches",
    field: "scores",
    type: "scores",
  },
  {
    title: "What's your main goal?",
    subtitle: "Help us understand your motivation",
    field: "goal",
    type: "single",
    options: ["Top-ranked university", "Scholarship funding", "Low tuition costs", "Strong research environment", "Work opportunities after graduation", "Specific country or city", "Fastest admission possible"],
  },
  {
    title: "Budget per year?",
    subtitle: "Including tuition and living expenses",
    field: "budget",
    type: "single",
    options: ["Under €10,000", "€10,000–25,000", "€25,000–40,000", "€40,000–60,000", "Over €60,000", "Seeking full scholarship"],
  },
  {
    title: "When do you want to start?",
    subtitle: "Choose your preferred intake season",
    field: "intake",
    type: "single",
    options: ["Fall 2025", "Spring 2026", "Fall 2026", "Still exploring"],
  },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [scores, setScores] = useState({ gpa: "", ielts: "", toefl: "", gre: "", gmat: "" });

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const toggleOption = (option: string) => {
    if (step.type === "single") {
      setAnswers((prev) => ({ ...prev, [step.field]: option }));
    } else if (step.type === "multi") {
      const current = (answers[step.field] as string[]) || [];
      if (current.includes(option)) {
        setAnswers((prev) => ({ ...prev, [step.field]: current.filter((o) => o !== option) }));
      } else {
        setAnswers((prev) => ({ ...prev, [step.field]: [...current, option] }));
      }
    }
  };

  const isSelected = (option: string) => {
    const val = answers[step.field];
    if (Array.isArray(val)) return val.includes(option);
    return val === option;
  };

  const canProceed = () => {
    if (step.type === "scores") return true;
    const val = answers[step.field];
    if (!val) return false;
    if (Array.isArray(val)) return val.length > 0;
    return !!val;
  };

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
    else navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={BOOKSHELF_BG} alt="Bookshelves" className="w-full h-full object-cover" style={{ filter: "brightness(0.18) saturate(0.4)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(8,13,26,0.96) 0%, rgba(13,22,53,0.9) 100%)" }} />
      </div>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "#7c6af7" }} />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}>
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-white font-semibold" style={{ fontFamily: "var(--font-display)" }}>Edvora</span>
        </div>

        {/* Progress */}
        <div className="w-full max-w-lg mb-8">
          <div className="flex justify-between text-xs mb-2" style={{ color: "#6b7a9e" }}>
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(124,106,247,0.15)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, #7c6af7, #06b6d4)" }}
            />
          </div>
        </div>

        {/* Card */}
        <div
          className="w-full max-w-lg p-8 rounded-3xl"
          style={{
            background: "rgba(13,20,50,0.75)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(124,106,247,0.2)",
          }}
        >
          <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>{step.title}</h2>
          <p className="text-sm mb-6" style={{ color: "#6b7a9e" }}>{step.subtitle}</p>

          {step.type === "scores" ? (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(scores).map(([key, val]) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: "#6b7a9e" }}>{key.toUpperCase()}</label>
                  <input
                    type="number"
                    placeholder={key === "gpa" ? "0.0 – 4.0" : key === "ielts" ? "0–9" : key === "toefl" ? "0–120" : "Score"}
                    value={val}
                    onChange={(e) => setScores((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: "rgba(13,22,53,0.8)", border: "1px solid rgba(124,106,247,0.2)", color: "#e8eaf0" }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {step.options?.map((option) => {
                const selected = isSelected(option);
                return (
                  <button
                    key={option}
                    onClick={() => toggleOption(option)}
                    className="relative flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-left transition-all"
                    style={{
                      background: selected ? "rgba(124,106,247,0.2)" : "rgba(13,22,53,0.6)",
                      border: `1px solid ${selected ? "#7c6af7" : "rgba(124,106,247,0.15)"}`,
                      color: selected ? "#c4cde8" : "#a8b4d0",
                    }}
                  >
                    {selected && (
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "#7c6af7" }}
                      >
                        <Check size={10} className="text-white" />
                      </span>
                    )}
                    <span className="leading-tight">{option}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/10"
                style={{ background: "rgba(124,106,247,0.1)", border: "1px solid rgba(124,106,247,0.2)", color: "#a8b4d0" }}
              >
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button
              onClick={next}
              disabled={!canProceed()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
            >
              {currentStep === steps.length - 1 ? (
                <><Sparkles size={15} /> Go to Dashboard</>
              ) : (
                <>Continue <ArrowRight size={15} /></>
              )}
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 text-sm hover:underline"
          style={{ color: "#6b7a9e" }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
