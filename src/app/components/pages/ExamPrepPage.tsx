import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Save,
  Target,
} from "lucide-react";
import { examData } from "../../data/mockData";
import { useAppData } from "../../providers/AppDataProvider";

const studyPlans: Record<string, string[]> = {
  IELTS: ["Practice one full test each week", "Focus on Academic Writing Task 2", "Listen to English news daily", "Review conditionals and passive voice"],
  TOEFL: ["Complete two official practice sets each week", "Practice integrated speaking responses", "Build vocabulary with ten words per day", "Improve listening note-taking"],
  GRE: ["Solve quantitative problems for 30 minutes daily", "Learn ten verbal words daily", "Write one analytical essay each week", "Complete a timed test every two weeks"],
  GMAT: ["Practice Data Sufficiency patterns", "Review Sentence Correction rules", "Read business journalism for comprehension", "Target two minutes per question"],
};

const officialExamSites: Record<string, string> = {
  IELTS: "https://ielts.org/",
  TOEFL: "https://www.ets.org/toefl.html",
  GRE: "https://www.ets.org/gre.html",
  GMAT: "https://www.mba.com/exams/gmat-exam",
};

export function ExamPrepPage() {
  const { updateUserProfile, userProfile, wishlistUniversities } = useAppData();
  const [activeExam, setActiveExam] = useState("IELTS");
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({
    IELTS: userProfile.ielts === null ? "" : String(userProfile.ielts),
    TOEFL: userProfile.toefl === null ? "" : String(userProfile.toefl),
    GRE: userProfile.gre === null ? "" : String(userProfile.gre),
    GMAT: userProfile.gmat === null ? "" : String(userProfile.gmat),
  });
  const [completedTasks, setCompletedTasks] = useState<Record<string, number[]>>({});
  const [notice, setNotice] = useState("");

  const exam = examData.find((item) => item.name === activeExam) ?? examData[0];
  const score = scoreInputs[activeExam] === "" ? null : Number(scoreInputs[activeExam]);
  const requirementMet = score !== null && score >= exam.targetScore;
  const completedCount = (completedTasks[activeExam] ?? []).length;
  const plan = studyPlans[activeExam] ?? [];

  const saveScore = () => {
    const profileKey = activeExam.toLowerCase() as "ielts" | "toefl" | "gre" | "gmat";
    updateUserProfile({ [profileKey]: score } as Partial<typeof userProfile>);
    setNotice(activeExam + " score saved to your profile.");
  };

  const toggleTask = (index: number) => {
    setCompletedTasks((current) => {
      const tasks = current[activeExam] ?? [];
      return {
        ...current,
        [activeExam]: tasks.includes(index)
          ? tasks.filter((task) => task !== index)
          : [...tasks, index],
      };
    });
  };

  const requirementFor = (university: (typeof wishlistUniversities)[number]) => {
    if (activeExam === "IELTS") return university.ieltsMin;
    if (activeExam === "TOEFL") return Math.round(60 + (university.ieltsMin - 5) * 20);
    if (activeExam === "GRE") return university.greRequired ? "Required" : "Not required";
    return university.gmatRequired ? "Required" : "Not required";
  };

  const universityRequirementMet = (university: (typeof wishlistUniversities)[number]) => {
    const requirement = requirementFor(university);
    if (typeof requirement === "number") return score !== null && score >= requirement;
    return requirement === "Not required";
  };

  return (
    <main style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Exam preparation</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7a9e" }}>Save scores to your profile and work through a focused study plan.</p>
        </header>

        <nav className="flex gap-2 overflow-x-auto scrollbar-none mb-6" aria-label="Exam selection">
          {examData.map((item) => {
            const itemScore = scoreInputs[item.name] === "" ? null : Number(scoreInputs[item.name]);
            const met = itemScore !== null && itemScore >= item.targetScore;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => { setActiveExam(item.name); setNotice(""); }}
                className="shrink-0 px-4 py-2.5 rounded-md text-sm font-medium flex items-center gap-2"
                style={{
                  background: activeExam === item.name ? "rgba(124,106,247,0.18)" : "rgba(13,22,53,0.55)",
                  border: "1px solid " + (activeExam === item.name ? "#7c6af7" : "rgba(124,106,247,0.15)"),
                  color: activeExam === item.name ? "#c1bbff" : "#7d89a2",
                }}
              >
                <span aria-hidden="true">{item.icon}</span> {item.name}
                {met && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />}
              </button>
            );
          })}
        </nav>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <section className="p-5 rounded-lg" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <div className="flex items-start justify-between gap-4 mb-5">
                <div><h2 className="font-semibold text-white">{exam.name} score tracker</h2><p className="text-xs mt-1" style={{ color: "#6b7a9e" }}>{exam.description}</p></div>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: requirementMet ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)", color: requirementMet ? "#10b981" : "#f0b75c" }}>{requirementMet ? "Target met" : "In progress"}</span>
              </div>

              <div className="flex items-end gap-4 mb-5">
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1.5"><span style={{ color: "#6b7a9e" }}>Saved score</span><strong style={{ color: exam.color }}>{score ?? "Not added"}</strong></div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(124,106,247,0.1)" }}><div className="h-full rounded-full" style={{ width: score ? Math.min(100, (score / exam.targetScore) * 100) + "%" : "0%", background: exam.color }} /></div>
                </div>
                <div className="text-right"><strong className="text-2xl" style={{ color: exam.color, fontFamily: "var(--font-mono)" }}>{score ?? "-"}</strong><p className="text-xs" style={{ color: "#6b7a9e" }}>/ {exam.targetScore} target</p></div>
              </div>

              <div className="flex gap-2">
                <label className="flex-1 text-xs" style={{ color: "#6b7a9e" }}>Update score
                  <input type="number" step={activeExam === "IELTS" ? "0.5" : "1"} value={scoreInputs[activeExam]} onChange={(event) => { setScoreInputs((current) => ({ ...current, [activeExam]: event.target.value })); setNotice(""); }} className="w-full mt-1 px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "#0b1322", border: "1px solid rgba(124,106,247,0.2)", color: "#e8eaf0" }} />
                </label>
                <button type="button" onClick={saveScore} className="glass-interactive self-end flex items-center gap-2 px-3 py-2.5 rounded-md text-xs"><Save size={13} /> Save</button>
              </div>
              {notice && <p role="status" className="text-xs mt-2" style={{ color: "#10b981" }}>{notice}</p>}
            </section>

            <section className="p-5 rounded-lg" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <div className="flex items-center justify-between mb-3"><h2 className="font-semibold text-white">Study plan</h2><span className="text-xs" style={{ color: "#8f9ab0" }}>{completedCount}/{plan.length} done</span></div>
              <div className="space-y-1">
                {plan.map((tip, index) => {
                  const complete = (completedTasks[activeExam] ?? []).includes(index);
                  return (
                    <button type="button" key={tip} onClick={() => toggleTask(index)} className="w-full flex items-start gap-2 p-2.5 rounded-md text-sm text-left" style={{ background: complete ? "rgba(16,185,129,0.08)" : "transparent" }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs" style={{ background: complete ? "rgba(16,185,129,0.16)" : "rgba(124,106,247,0.18)", color: complete ? "#10b981" : "#aaa2f2" }}>{complete ? <CheckCircle2 size={13} /> : index + 1}</span>
                      <span style={{ color: complete ? "#8fbbaa" : "#a8b4d0", textDecoration: complete ? "line-through" : "none" }}>{tip}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="p-5 rounded-lg" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h2 className="font-semibold text-white mb-4">Official resources</h2>
              <div className="space-y-2">
                {exam.resources.map((resource) => (
                  <a key={resource} href={officialExamSites[exam.name]} target="_blank" rel="noreferrer" className="glass-interactive flex items-center gap-3 p-3 rounded-md">
                    <BookOpen size={15} style={{ color: "#8f84e8" }} />
                    <span className="flex-1 text-sm" style={{ color: "#a8b4d0" }}>{resource}</span>
                    <ExternalLink size={13} style={{ color: "#6b7a9e" }} />
                  </a>
                ))}
              </div>
            </section>

            <section className="p-5 rounded-lg" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h2 className="font-semibold text-white mb-1">Saved-university requirements</h2>
              <p className="text-xs mb-4" style={{ color: "#6b7a9e" }}>Compared with universities currently in your wishlist.</p>
              <div className="space-y-2">
                {wishlistUniversities.slice(0, 5).map((university) => {
                  const minimum = requirementFor(university);
                  const met = universityRequirementMet(university);
                  return (
                    <div key={university.id} className="flex items-center justify-between gap-3 p-2.5 rounded-md" style={{ background: "#0a1221" }}>
                      <span className="text-xs truncate" style={{ color: "#a8b4d0" }}>{university.name}</span>
                      <span className="flex items-center gap-1.5 text-xs shrink-0" style={{ color: met ? "#10b981" : "#f0b75c" }}>Min: {minimum}{met ? <CheckCircle2 size={12} /> : <Target size={12} />}</span>
                    </div>
                  );
                })}
                {wishlistUniversities.length === 0 && <p className="text-xs py-6 text-center" style={{ color: "#6b7a9e" }}>Save universities to compare their exam requirements.</p>}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}