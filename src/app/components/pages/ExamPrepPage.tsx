import { useState } from "react";
import { BookOpen, Target, ExternalLink, CheckCircle2 } from "lucide-react";
import { examData } from "../../data/mockData";

export function ExamPrepPage() {
  const [activeExam, setActiveExam] = useState("IELTS");
  const exam = examData.find((e) => e.name === activeExam)!;

  const studyPlans: Record<string, string[]> = {
    IELTS: ["Practice 1 full test per week", "Focus on Academic Writing Task 2", "Listen to BBC World Service daily", "Review grammar: conditionals & passive voice"],
    TOEFL: ["Complete 2 TPO tests per week", "Practice integrated speaking responses", "Build vocabulary with 10 words/day", "Focus on note-taking for listening section"],
    GRE: ["Quant: 30 min daily problem solving", "Verbal: 10 vocabulary words daily", "AWA: Write 1 essay per week", "Full test every 2 weeks"],
    GMAT: ["Focus on Data Sufficiency patterns", "Practice Sentence Correction grammar rules", "Read Business Insider / WSJ for RC", "Time management: 2 min per Q target"],
  };

  return (
    <div style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Exam Preparation</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7a9e" }}>Track your exam progress and get personalized study resources</p>
        </div>

        {/* Exam tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none mb-6">
          {examData.map((e) => (
            <button
              key={e.name}
              onClick={() => setActiveExam(e.name)}
              className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
              style={{
                background: activeExam === e.name ? "rgba(124,106,247,0.2)" : "rgba(13,22,53,0.6)",
                border: `1px solid ${activeExam === e.name ? "#7c6af7" : "rgba(124,106,247,0.15)"}`,
                color: activeExam === e.name ? "#a89bf5" : "#6b7a9e",
              }}
            >
              <span>{e.icon}</span> {e.name}
              {e.status === "Met" && <span className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} />}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Score card */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h3 className="font-semibold text-white mb-4">{exam.name} Score Tracker</h3>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "#6b7a9e" }}>Your Score</span>
                    <span style={{ color: exam.color }}>{exam.userScore ?? "Not taken"}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(124,106,247,0.1)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: exam.userScore ? `${(exam.userScore / exam.targetScore) * 100}%` : "0%",
                        background: exam.color,
                      }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: exam.color, fontFamily: "var(--font-mono)" }}>
                    {exam.userScore ?? "—"}
                  </div>
                  <div className="text-xs" style={{ color: "#6b7a9e" }}>/ {exam.targetScore} target</div>
                </div>
              </div>

              <div
                className="px-4 py-3 rounded-xl mb-4"
                style={{
                  background: exam.status === "Met" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                  border: `1px solid ${exam.status === "Met" ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
                }}
              >
                <div className="flex items-center gap-2">
                  {exam.status === "Met" ? <CheckCircle2 size={15} style={{ color: "#10b981" }} /> : <Target size={15} style={{ color: "#f59e0b" }} />}
                  <span className="text-sm font-medium" style={{ color: exam.status === "Met" ? "#10b981" : "#f59e0b" }}>
                    {exam.status === "Met" ? "Requirement met ✓" : exam.status}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: "#a8b4d0" }}>{exam.nextExamDate}</p>
              </div>

              <p className="text-xs" style={{ color: "#6b7a9e" }}>{exam.description}</p>
            </div>

            {/* Study plan */}
            {studyPlans[exam.name] && (
              <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <h3 className="font-semibold text-white mb-3">Personalized Study Plan</h3>
                <div className="space-y-2">
                  {studyPlans[exam.name].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold" style={{ background: "rgba(124,106,247,0.2)", color: "#a89bf5" }}>{i + 1}</div>
                      <span style={{ color: "#a8b4d0" }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resources */}
          <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
            <h3 className="font-semibold text-white mb-4">Study Resources</h3>
            <div className="space-y-2 mb-6">
              {exam.resources.map((r) => (
                <div
                  key={r}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/5"
                  style={{ background: "rgba(8,13,26,0.5)", border: "1px solid rgba(124,106,247,0.1)" }}
                >
                  <BookOpen size={15} style={{ color: "#7c6af7" }} />
                  <span className="flex-1 text-sm" style={{ color: "#a8b4d0" }}>{r}</span>
                  <ExternalLink size={13} style={{ color: "#6b7a9e" }} />
                </div>
              ))}
            </div>

            {/* Score required by program */}
            <h4 className="font-medium text-white mb-3 text-sm">Score Requirements by Saved Programs</h4>
            <div className="space-y-2">
              {[
                { program: "TU Munich — MSc CS", score: exam.name === "IELTS" ? "6.5" : exam.name === "TOEFL" ? "88" : "N/A", met: (exam.userScore || 0) >= (exam.name === "IELTS" ? 6.5 : 88) },
                { program: "UBC — MSc CS", score: exam.name === "IELTS" ? "7.0" : exam.name === "TOEFL" ? "100" : "N/A", met: (exam.userScore || 0) >= (exam.name === "IELTS" ? 7.0 : 100) },
                { program: "UofA — MSc DS", score: exam.name === "IELTS" ? "6.5" : exam.name === "TOEFL" ? "90" : "N/A", met: (exam.userScore || 0) >= (exam.name === "IELTS" ? 6.5 : 90) },
              ].map((item) => (
                <div key={item.program} className="flex items-center justify-between p-2 rounded-xl" style={{ background: "rgba(8,13,26,0.4)" }}>
                  <span className="text-xs" style={{ color: "#a8b4d0" }}>{item.program}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono" style={{ color: "#6b7a9e" }}>Min: {item.score}</span>
                    {item.score !== "N/A" && (
                      item.met
                        ? <CheckCircle2 size={12} style={{ color: "#10b981" }} />
                        : <div className="w-3 h-3 rounded-full" style={{ background: "rgba(239,68,68,0.4)", border: "1px solid #ef4444" }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
