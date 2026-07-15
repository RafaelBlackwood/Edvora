import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, CheckCircle2, FileText, Plus, Search } from "lucide-react";
import { universities } from "../../data/mockData";
import { useAppData } from "../../providers/AppDataProvider";
import { applicationStatuses } from "../../types/application";
import { ApplicationWorkspace, formatApplicationDate } from "./ApplicationWorkspace";

const panelStyle = {
  background: "rgba(13,20,50,0.64)",
  border: "1px solid rgba(124,106,247,0.15)",
};

const inputStyle = {
  background: "rgba(8,13,26,0.72)",
  border: "1px solid rgba(124,106,247,0.2)",
  color: "#e8eaf0",
};

const statusColors: Record<string, { background: string; color: string }> = {
  Accepted: { background: "rgba(16,185,129,0.14)", color: "#4adea8" },
  Draft: { background: "rgba(107,122,158,0.16)", color: "#9aa7c5" },
  Rejected: { background: "rgba(239,68,68,0.14)", color: "#f57b82" },
  Reviewed: { background: "rgba(245,158,11,0.14)", color: "#f8b84e" },
  Submitted: { background: "rgba(6,182,212,0.14)", color: "#31c7dc" },
};

export function ApplicationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { applications, createApplication } = useAppData();
  const requestedApplication = applications.find((application) => application.id === searchParams.get("application"));
  const preselectedUniversity = searchParams.get("university") ?? "";
  const preselectedProgram = searchParams.get("program") ?? "";
  const [view, setView] = useState<"tracker" | "new">(
    searchParams.get("new") === "1" || Boolean(preselectedUniversity) ? "new" : "tracker",
  );
  const [newStep, setNewStep] = useState(0);
  const [selectedUniversityId, setSelectedUniversityId] = useState(preselectedUniversity);
  const [selectedProgram, setSelectedProgram] = useState(preselectedProgram);
  const [selectedIntake, setSelectedIntake] = useState("");
  const [formError, setFormError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");

  const selectedUniversity = universities.find((university) => university.id === selectedUniversityId);
  const filteredApplications = useMemo(() => applications.filter((application) => {
    const matchesStatus = statusFilter === "All" || application.status === statusFilter;
    const needle = query.trim().toLowerCase();
    const searchable = [application.university, application.program, application.intake].join(" ").toLowerCase();
    return matchesStatus && (!needle || searchable.includes(needle));
  }), [applications, query, statusFilter]);

  if (requestedApplication) {
    return (
      <div style={{ background: "#080d1a", minHeight: "100%" }}>
        <ApplicationWorkspace application={requestedApplication} onBack={() => navigate("/applications")} />
      </div>
    );
  }

  const startNew = () => {
    setSelectedUniversityId("");
    setSelectedProgram("");
    setSelectedIntake("");
    setNewStep(0);
    setFormError("");
    setView("new");
    navigate("/applications?new=1", { replace: true });
  };

  const continueNew = () => {
    const missing =
      (newStep === 0 && !selectedUniversityId && "university") ||
      (newStep === 1 && !selectedProgram && "program") ||
      (newStep === 2 && !selectedIntake && "intake");

    if (missing) {
      setFormError("Choose a " + missing + " to continue.");
      return;
    }
    setFormError("");
    setNewStep((step) => Math.min(3, step + 1));
  };

  const createDraft = () => {
    const result = createApplication({ intake: selectedIntake, program: selectedProgram, universityId: selectedUniversityId });
    if (!result.ok || !result.id) {
      setFormError(result.message ?? "Application could not be created.");
      return;
    }
    navigate("/applications?application=" + encodeURIComponent(result.id), { replace: true });
  };

  return (
    <div style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div><h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>My Applications</h1><p className="text-sm mt-1" style={{ color: "#6b7a9e" }}>Prepare, submit, and track every application record.</p></div>
          <button type="button" onClick={startNew} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90" style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}><Plus size={15} /> New application</button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          {[["Total", applications.length], ["Draft", applications.filter((application) => application.status === "Draft").length], ["Submitted", applications.filter((application) => application.status === "Submitted").length], ["In review", applications.filter((application) => application.status === "Reviewed").length], ["Decisions", applications.filter((application) => ["Accepted", "Rejected"].includes(application.status)).length]].map(([label, count]) => (
            <div key={label} className="p-3 rounded-lg" style={panelStyle}><div className="text-xl font-bold text-white mb-1" style={{ fontFamily: "var(--font-mono)" }}>{count}</div><div className="text-xs" style={{ color: "#6b7a9e" }}>{label}</div></div>
          ))}
        </div>

        {view === "tracker" ? (
          <Tracker applications={filteredApplications} query={query} setQuery={setQuery} setStatusFilter={setStatusFilter} statusFilter={statusFilter} />
        ) : (
          <div className="max-w-3xl mx-auto">
            <button type="button" onClick={() => { setView("tracker"); navigate("/applications", { replace: true }); }} className="inline-flex items-center gap-2 px-2 py-2 mb-3 text-sm hover:text-white" style={{ color: "#8f9bb8" }}><ArrowLeft size={15} /> Back to applications</button>
            <div className="flex items-center gap-2 mb-4" aria-label="New application progress">
              {["University", "Program", "Intake", "Review"].map((label, index) => <div key={label} className="flex-1"><div className="h-1.5 rounded-full mb-2" style={{ background: index <= newStep ? "#6875df" : "rgba(124,106,247,0.12)" }} /><span className="text-xs" style={{ color: index <= newStep ? "#c9c4ff" : "#5d6987" }}>{label}</span></div>)}
            </div>
            {formError && <p role="alert" className="mb-3 text-sm" style={{ color: "#f58a90" }}>{formError}</p>}
            <section className="p-5 rounded-lg" style={panelStyle}>
              {newStep === 0 && <UniversityStep selectedId={selectedUniversityId} onSelect={(id) => { setSelectedUniversityId(id); setSelectedProgram(""); setFormError(""); }} />}
              {newStep === 1 && <ChoiceStep title="Choose a program" choices={selectedUniversity?.programs ?? []} selected={selectedProgram} onSelect={(value) => { setSelectedProgram(value); setFormError(""); }} />}
              {newStep === 2 && <ChoiceStep title="Choose an intake" choices={["Fall 2026", "Spring 2027", "Fall 2027"]} selected={selectedIntake} onSelect={(value) => { setSelectedIntake(value); setFormError(""); }} columns />}
              {newStep === 3 && <ReviewStep university={selectedUniversity?.name ?? "Not selected"} program={selectedProgram} intake={selectedIntake} deadline={selectedUniversity?.deadline ?? ""} />}
            </section>
            <div className="flex gap-3 mt-4">
              {newStep > 0 && <button type="button" onClick={() => setNewStep((step) => Math.max(0, step - 1))} className="px-5 py-2.5 rounded-lg text-sm" style={{ border: "1px solid rgba(124,106,247,0.22)", color: "#a8b4d0" }}>Back</button>}
              <button type="button" onClick={newStep === 3 ? createDraft : continueNew} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90" style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}>{newStep === 3 ? "Create application draft" : "Continue"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UniversityStep({ onSelect, selectedId }: { onSelect: (id: string) => void; selectedId: string }) {
  return <><h2 className="font-semibold text-white mb-4">Choose a university</h2><div className="grid sm:grid-cols-2 gap-2">{universities.map((university) => <button key={university.id} type="button" onClick={() => onSelect(university.id)} className="flex items-center gap-3 p-3 rounded-lg text-left hover:bg-white/5" style={{ background: selectedId === university.id ? "rgba(124,106,247,0.15)" : "rgba(8,13,26,0.5)", border: "1px solid " + (selectedId === university.id ? "#716ee0" : "rgba(124,106,247,0.1)") }}><span className="text-lg">{university.logo}</span><span className="min-w-0 flex-1"><strong className="block text-sm text-white truncate">{university.name}</strong><span className="text-xs" style={{ color: "#6b7a9e" }}>{university.country}</span></span>{selectedId === university.id && <CheckCircle2 size={16} style={{ color: "#4adea8" }} />}</button>)}</div></>;
}

function ChoiceStep({ choices, columns = false, onSelect, selected, title }: { choices: string[]; columns?: boolean; onSelect: (value: string) => void; selected: string; title: string }) {
  return <><h2 className="font-semibold text-white mb-4">{title}</h2><div className={columns ? "grid sm:grid-cols-3 gap-2" : "space-y-2"}>{choices.map((choice) => <button key={choice} type="button" onClick={() => onSelect(choice)} className="w-full flex items-center justify-between p-3 rounded-lg text-left hover:bg-white/5" style={{ background: selected === choice ? "rgba(124,106,247,0.15)" : "rgba(8,13,26,0.5)", border: "1px solid " + (selected === choice ? "#716ee0" : "rgba(124,106,247,0.1)") }}><span className="text-sm text-white">{choice}</span>{selected === choice && <CheckCircle2 size={16} style={{ color: "#4adea8" }} />}</button>)}</div></>;
}

function ReviewStep({ deadline, intake, program, university }: { deadline: string; intake: string; program: string; university: string }) {
  return <><h2 className="font-semibold text-white mb-4">Review draft</h2><div className="space-y-2">{[["University", university], ["Program", program || "Not selected"], ["Intake", intake || "Not selected"], ["Deadline", formatApplicationDate(deadline)]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 p-3 rounded-lg" style={{ background: "rgba(8,13,26,0.55)" }}><span className="text-sm" style={{ color: "#6b7a9e" }}>{label}</span><strong className="text-sm text-white text-right">{value}</strong></div>)}</div></>;
}

function Tracker({ applications, query, setQuery, setStatusFilter, statusFilter }: { applications: ReturnType<typeof useAppData>["applications"]; query: string; setQuery: (value: string) => void; setStatusFilter: (value: string) => void; statusFilter: string }) {
  const navigate = useNavigate();
  return <><div className="flex flex-col sm:flex-row gap-3 mb-4"><label className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#6b7a9e" }} /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} placeholder="Search applications" /></label><div className="flex gap-1 overflow-x-auto">{["All", ...applicationStatuses].map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className="shrink-0 px-3 py-2 rounded-lg text-xs" style={{ background: statusFilter === status ? "rgba(124,106,247,0.18)" : "rgba(13,20,50,0.5)", border: "1px solid rgba(124,106,247,0.14)", color: statusFilter === status ? "#d2ccff" : "#8290ae" }}>{status}</button>)}</div></div><div className="space-y-3">{applications.map((application) => {
    const university = universities.find((candidate) => candidate.id === application.universityId);
    const statusStyle = statusColors[application.status] ?? statusColors.Draft;
    return <article key={application.id} className="p-4 lg:p-5 rounded-lg hover:bg-white/[0.025]" style={panelStyle}><div className="flex flex-col lg:flex-row lg:items-center gap-4"><div className="flex items-start gap-3 flex-1 min-w-0"><div className="w-11 h-11 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: "rgba(124,106,247,0.1)" }}>{university?.logo || "U"}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2 mb-1"><h2 className="font-semibold text-white truncate">{application.university}</h2><span className="px-2.5 py-1 rounded-full text-xs font-medium" style={statusStyle}>{application.status}</span></div><p className="text-sm truncate" style={{ color: "#8f9bb8" }}>{application.program} - {application.intake}</p><div className="flex flex-wrap gap-x-4 gap-y-1 text-xs mt-2" style={{ color: "#6b7a9e" }}><span>Deadline <strong style={{ color: "#e7ad4f" }}>{formatApplicationDate(application.deadline)}</strong></span><span>{application.documents.length} documents</span><span>{application.tasks.filter((task) => task.completed).length}/{application.tasks.length} tasks</span></div></div></div><div className="flex items-center gap-3 lg:w-64"><div className="flex-1"><div className="flex justify-between text-xs mb-1.5" style={{ color: "#6b7a9e" }}><span>Completion</span><span style={{ color: "#a89bf5" }}>{application.progress}%</span></div><div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(124,106,247,0.1)" }}><div className="h-full rounded-full" style={{ width: application.progress + "%", background: "linear-gradient(90deg, #7c6af7, #06b6d4)" }} /></div></div><button type="button" onClick={() => navigate("/applications?application=" + encodeURIComponent(application.id))} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500/20" style={{ background: "rgba(124,106,247,0.12)", border: "1px solid rgba(124,106,247,0.3)", color: "#d2ccff" }}>Open</button></div></div></article>;
  })}{!applications.length && <div className="p-10 rounded-lg text-center" style={panelStyle}><FileText size={24} className="mx-auto mb-3" style={{ color: "#6b7a9e" }} /><h2 className="font-medium text-white">No matching applications</h2><p className="text-sm mt-1" style={{ color: "#6b7a9e" }}>Change the search or status filter.</p></div>}</div></>;
}
