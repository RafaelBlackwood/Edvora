import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Plus, ChevronRight, CheckCircle2 } from "lucide-react";
import { universities } from "../../data/mockData";
import { useAppData } from "../../providers/AppDataProvider";

const statusSteps = ["Draft", "Submitted", "Reviewed", "Accepted", "Rejected"];
const statusColors: Record<string, { bg: string; color: string }> = {
  Draft: { bg: "rgba(107,122,158,0.15)", color: "#6b7a9e" },
  Submitted: { bg: "rgba(6,182,212,0.15)", color: "#06b6d4" },
  Reviewed: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
  Accepted: { bg: "rgba(16,185,129,0.15)", color: "#10b981" },
  Rejected: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
};

const appFormSteps = ["University", "Program", "Intake", "Personal Info", "Education", "Documents", "Review", "Submit"];

export function ApplicationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { applications: apps, createApplication } = useAppData();
  const preselectedUniversity = searchParams.get("university") ?? "";
  const preselectedProgram = searchParams.get("program") ?? "";
  const [formStep, setFormStep] = useState(0);
  const [selectedUni, setSelectedUni] = useState(preselectedUniversity);
  const [selectedProgram, setSelectedProgram] = useState(preselectedProgram);
  const [selectedIntake, setSelectedIntake] = useState("");
  const [formError, setFormError] = useState("");
  const [activeTab, setActiveTab] = useState<"tracker" | "new">(
    searchParams.get("new") === "1" || preselectedUniversity ? "new" : "tracker",
  );
  const selectedUniversity = universities.find((university) => university.id === selectedUni);

  const startNewApplication = () => {
    setSelectedUni("");
    setSelectedProgram("");
    setSelectedIntake("");
    setFormError("");
    setFormStep(0);
    setActiveTab("new");
    navigate("/applications", { replace: true });
  };

  const continueApplication = () => {
    const missingSelection =
      (formStep === 0 && !selectedUni && "university") ||
      (formStep === 1 && !selectedProgram && "program") ||
      (formStep === 2 && !selectedIntake && "intake");

    if (missingSelection) {
      setFormError("Choose a " + missingSelection + " to continue.");
      return;
    }

    setFormError("");
    setFormStep((current) => Math.min(7, current + 1));
  };

  const submitApplication = () => {
    const result = createApplication({
      intake: selectedIntake,
      program: selectedProgram,
      universityId: selectedUni,
    });

    if (!result.ok) {
      setFormError(result.message ?? "The application could not be submitted.");
      return;
    }

    setFormError("");
    setFormStep(7);
  };

  return (
    <div style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>My Applications</h1>
            <p className="text-sm mt-1" style={{ color: "#6b7a9e" }}>Track and manage all your university applications</p>
          </div>
          <button
            onClick={startNewApplication}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-all"
            style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
          >
            <Plus size={15} /> New Application
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {Object.entries({ Total: apps.length, Submitted: apps.filter(a => a.status === "Submitted").length, Reviewed: apps.filter(a => a.status === "Reviewed").length, Draft: apps.filter(a => a.status === "Draft").length }).map(([label, count]) => (
            <div key={label} className="p-4 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <div className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-mono)" }}>{count}</div>
              <div className="text-xs" style={{ color: "#6b7a9e" }}>{label}</div>
            </div>
          ))}
        </div>

        {activeTab === "tracker" ? (
          <div className="space-y-4">
            {apps.map((app) => {
              const sc = statusColors[app.status] || statusColors.Draft;
              const stepIdx = statusSteps.indexOf(app.status);
              const uni = universities.find((u) => u.id === app.universityId);
              return (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl"
                  style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: "rgba(124,106,247,0.1)" }}>
                        {uni?.logo || "🎓"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{app.university}</h3>
                        <p className="text-sm" style={{ color: "#6b7a9e" }}>{app.program}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: sc.bg, color: sc.color }}>
                        {app.status}
                      </span>
                    </div>
                  </div>

                  {/* Status progress */}
                  <div className="flex items-center mb-4">
                    {statusSteps.slice(0, 4).map((s, i) => (
                      <div key={s} className="flex-1 flex items-center">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                          style={{
                            background: i <= stepIdx ? "linear-gradient(135deg, #7c6af7, #06b6d4)" : "rgba(124,106,247,0.1)",
                            color: i <= stepIdx ? "white" : "#6b7a9e",
                          }}
                        >
                          {i < stepIdx ? "✓" : i + 1}
                        </div>
                        {i < 3 && (
                          <div className="flex-1 h-0.5 mx-1" style={{ background: i < stepIdx ? "#7c6af7" : "rgba(124,106,247,0.15)" }} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs mb-3" style={{ color: "#6b7a9e" }}>
                    {statusSteps.slice(0, 4).map((s) => <span key={s} className="text-center">{s}</span>)}
                  </div>

                  {/* Documents */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {app.documents.map((doc) => (
                      <span key={doc} className="px-2 py-0.5 rounded-full text-xs flex items-center gap-1" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                        <CheckCircle2 size={10} /> {doc}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs" style={{ color: "#6b7a9e" }}>
                    <span>Deadline: <span style={{ color: "#f59e0b" }}>{app.deadline}</span></span>
                    {app.submittedDate && <span>Submitted: {app.submittedDate}</span>}
                    <span>Progress: <span style={{ color: "#a89bf5" }}>{app.progress}%</span></span>
                  </div>

                  <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(124,106,247,0.1)" }}>
                    <div className="h-full rounded-full" style={{ width: `${app.progress}%`, background: "linear-gradient(90deg, #7c6af7, #06b6d4)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* New Application Form */
          <div className="max-w-2xl mx-auto">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-6 overflow-x-auto scrollbar-none gap-1">
              {appFormSteps.map((step, i) => (
                <div key={step} className="flex items-center gap-1 shrink-0">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: i <= formStep ? "linear-gradient(135deg, #7c6af7, #06b6d4)" : "rgba(124,106,247,0.1)",
                      color: i <= formStep ? "white" : "#6b7a9e",
                    }}
                  >
                    {i < formStep ? "✓" : i + 1}
                  </div>
                  {i < appFormSteps.length - 1 && (
                    <div className="w-6 h-0.5" style={{ background: i < formStep ? "#7c6af7" : "rgba(124,106,247,0.15)" }} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-center mb-2" style={{ color: "#6b7a9e" }}>Step {formStep + 1} of {appFormSteps.length}: <span style={{ color: "#a89bf5" }}>{appFormSteps[formStep]}</span></p>
            {formError && <p role="alert" className="text-xs text-center mb-4" style={{ color: "#ef6d75" }}>{formError}</p>}

            <div className="p-6 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.15)" }}>
              {formStep === 0 && (
                <div>
                  <h3 className="font-semibold text-white mb-4">Select University</h3>
                  <div className="space-y-2">
                    {universities.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setSelectedUni(u.id);
                          setSelectedProgram("");
                          setFormError("");
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                        style={{
                          background: selectedUni === u.id ? "rgba(124,106,247,0.15)" : "rgba(8,13,26,0.5)",
                          border: `1px solid ${selectedUni === u.id ? "#7c6af7" : "rgba(124,106,247,0.1)"}`,
                        }}
                      >
                        <span className="text-lg">{u.logo}</span>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white">{u.name}</div>
                          <div className="text-xs" style={{ color: "#6b7a9e" }}>{u.country} · #{u.ranking}</div>
                        </div>
                        {selectedUni === u.id && <CheckCircle2 size={16} style={{ color: "#10b981" }} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formStep === 1 && (
                <div>
                  <h3 className="font-semibold text-white mb-4">Select Program</h3>
                  <div className="space-y-2">
                    {(selectedUniversity?.programs ?? []).map((prog) => (
                      <button
                        key={prog}
                        type="button"
                        onClick={() => {
                          setSelectedProgram(prog);
                          setFormError("");
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all hover:bg-white/5"
                        style={{
                          background: selectedProgram === prog ? "rgba(124,106,247,0.15)" : "rgba(8,13,26,0.5)",
                          border: "1px solid " + (selectedProgram === prog ? "#7c6af7" : "rgba(124,106,247,0.1)"),
                        }}
                      >
                        <span className="text-sm text-white">{prog}</span>
                        {selectedProgram === prog ? <CheckCircle2 size={15} style={{ color: "#10b981" }} /> : <ChevronRight size={14} style={{ color: "#6b7a9e" }} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formStep > 1 && formStep < 7 && (
                <div>
                  <h3 className="font-semibold text-white mb-4">{appFormSteps[formStep]}</h3>
                  <div className="space-y-3">
                    {formStep === 2 && ["Fall 2026", "Spring 2027", "Fall 2027"].map((intake) => (
                      <button
                        key={intake}
                        type="button"
                        onClick={() => {
                          setSelectedIntake(intake);
                          setFormError("");
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl text-sm text-white text-left hover:bg-white/5 transition-all"
                        style={{
                          background: selectedIntake === intake ? "rgba(124,106,247,0.15)" : "rgba(8,13,26,0.5)",
                          border: "1px solid " + (selectedIntake === intake ? "#7c6af7" : "rgba(124,106,247,0.1)"),
                        }}
                      >
                        {intake}
                        {selectedIntake === intake && <CheckCircle2 size={15} style={{ color: "#10b981" }} />}
                      </button>
                    ))}
                    {[3, 4].includes(formStep) && (
                      <div className="grid grid-cols-2 gap-3">
                        {["First Name", "Last Name", "Date of Birth", "Nationality", "Phone", "Address"].slice(0, formStep === 3 ? 6 : 4).map((field) => (
                          <div key={field}>
                            <label className="block text-xs mb-1" style={{ color: "#6b7a9e" }}>{field}</label>
                            <input className="w-full px-3 py-2 rounded-xl text-sm outline-none" style={{ background: "rgba(8,13,26,0.6)", border: "1px solid rgba(124,106,247,0.15)", color: "#e8eaf0" }} />
                          </div>
                        ))}
                      </div>
                    )}
                    {formStep === 5 && (
                      <div className="space-y-2">
                        {["Transcript", "CV", "Motivation Letter", "IELTS Certificate", "Reference Letters", "Passport"].map((doc) => (
                          <div key={doc} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(8,13,26,0.5)" }}>
                            <span className="text-sm" style={{ color: "#a8b4d0" }}>{doc}</span>
                            <CheckCircle2 size={14} style={{ color: "#10b981" }} />
                          </div>
                        ))}
                      </div>
                    )}
                    {formStep === 6 && (
                      <div className="space-y-2 text-sm">
                        {[
                          ["University", selectedUniversity?.name || "Not selected"],
                          ["Program", selectedProgram || "Not selected"],
                          ["Intake", selectedIntake || "Not selected"],
                          ["Documents", "6 required items"],
                        ].map(([k, v]) => (
                          <div key={k as string} className="flex justify-between p-3 rounded-xl" style={{ background: "rgba(8,13,26,0.5)" }}>
                            <span style={{ color: "#6b7a9e" }}>{k as string}</span>
                            <span style={{ color: "#e8eaf0" }}>{v as string}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {formStep === 7 && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(16,185,129,0.15)" }}>
                    <CheckCircle2 size={32} style={{ color: "#10b981" }} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>Application Submitted!</h3>
                  <p className="text-sm" style={{ color: "#a8b4d0" }}>Your application has been submitted successfully. You'll receive a confirmation email shortly.</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              {formStep > 0 && formStep < 8 && (
                <button
                  onClick={() => setFormStep(Math.max(0, formStep - 1))}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "rgba(124,106,247,0.1)", border: "1px solid rgba(124,106,247,0.2)", color: "#a8b4d0" }}
                >
                  Back
                </button>
              )}
              {formStep < 7 ? (
                <button
                  onClick={() => formStep === 6 ? submitApplication() : continueApplication()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
                  style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
                >
                  {formStep === 6 ? "Submit Application" : "Continue"}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setActiveTab("tracker");
                    setFormStep(0);
                    navigate("/applications", { replace: true });
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
                  style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)" }}
                >
                  View My Applications
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
