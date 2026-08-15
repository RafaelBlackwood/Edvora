import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  FileText,
  GraduationCap,
  ListChecks,
  Save,
  Trash2,
  User,
} from "lucide-react";
import { universities } from "../../data/mockData";
import { useAppData } from "../../providers/AppDataProvider";
import { applicationStatuses, type ApplicationRecord } from "../../types/application";
import { SafeExternalLink } from "../SafeExternalLink";

const panelStyle = {
  background: "rgba(13,20,50,0.64)",
  border: "1px solid rgba(124,106,247,0.15)",
};

const inputStyle = {
  background: "rgba(8,13,26,0.72)",
  border: "1px solid rgba(124,106,247,0.2)",
  color: "#e8eaf0",
};

const tabs = [
  { icon: FileText, id: "overview", label: "Overview" },
  { icon: User, id: "form", label: "Application form" },
  { icon: ListChecks, id: "checklist", label: "Checklist" },
  { icon: GraduationCap, id: "documents", label: "Documents" },
] as const;

const statusColors: Record<string, { background: string; color: string }> = {
  Accepted: { background: "rgba(16,185,129,0.14)", color: "#4adea8" },
  Draft: { background: "rgba(107,122,158,0.16)", color: "#9aa7c5" },
  Rejected: { background: "rgba(239,68,68,0.14)", color: "#f57b82" },
  Reviewed: { background: "rgba(245,158,11,0.14)", color: "#f8b84e" },
  Submitted: { background: "rgba(6,182,212,0.14)", color: "#31c7dc" },
};

export function formatApplicationDate(value: string | null) {
  if (!value) return "Not set";
  const date = new Date(value.includes("T") ? value : value + "T00:00:00");
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function Field({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs mb-1.5" style={{ color: "#8f9bb8" }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none focus:border-indigo-400"
        style={inputStyle}
      />
    </label>
  );
}

export function ApplicationWorkspace({
  application,
  onBack,
}: {
  application: ApplicationRecord;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const { deleteApplication, documents, duplicateApplication, updateApplication } = useAppData();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("overview");
  const [draft, setDraft] = useState(application);
  const [feedback, setFeedback] = useState("");
  const [newTask, setNewTask] = useState("");

  useEffect(() => setDraft(application), [application]);

  const university = universities.find((candidate) => candidate.id === draft.universityId);
  const completedTasks = draft.tasks.filter((task) => task.completed).length;
  const statusStyle = statusColors[draft.status] ?? statusColors.Draft;

  const save = () => {
    const result = updateApplication(draft.id, {
      applicant: draft.applicant,
      applicationReference: draft.applicationReference,
      deadline: draft.deadline,
      documents: draft.documents,
      education: draft.education,
      intake: draft.intake,
      notes: draft.notes,
      portalUrl: draft.portalUrl,
      program: draft.program,
      status: draft.status,
      submittedDate: draft.submittedDate,
      tasks: draft.tasks,
    });
    setFeedback(result.ok ? "Changes saved." : result.message ?? "Changes could not be saved.");
  };

  const duplicate = () => {
    const result = duplicateApplication(draft.id);
    if (result.ok && result.id) {
      navigate("/applications?application=" + encodeURIComponent(result.id));
      return;
    }
    setFeedback(result.message ?? "Application could not be duplicated.");
  };

  const remove = () => {
    if (!window.confirm("Delete this application? This cannot be undone.")) return;
    deleteApplication(draft.id);
    onBack();
  };

  const markSubmitted = () => {
    const submittedDate = draft.submittedDate ?? new Date().toISOString().slice(0, 10);
    const tasks = draft.tasks.map((task) => ({ ...task, completed: true }));
    setDraft((current) => ({ ...current, status: "Submitted", submittedDate, tasks }));
    const result = updateApplication(draft.id, { status: "Submitted", submittedDate, tasks });
    setFeedback(result.ok ? "Application marked as submitted." : result.message ?? "Status could not be updated.");
  };

  const changeApplicant = (key: keyof ApplicationRecord["applicant"], value: string) => {
    setDraft((current) => ({ ...current, applicant: { ...current.applicant, [key]: value } }));
  };

  const changeEducation = (key: keyof ApplicationRecord["education"], value: string) => {
    setDraft((current) => ({ ...current, education: { ...current.education, [key]: value } }));
  };

  return (
    <div className="px-4 lg:px-8 py-5 pb-24 lg:pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/10" style={{ color: "#a8b4d0" }}>
          <ArrowLeft size={16} /> Applications
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {draft.portalUrl && (
            <SafeExternalLink url={draft.portalUrl} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-white/10" style={{ border: "1px solid rgba(124,106,247,0.22)", color: "#b9c2da" }}>
              University portal
            </SafeExternalLink>
          )}
          <button type="button" onClick={duplicate} title="Duplicate application" className="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-white/10" style={{ border: "1px solid rgba(124,106,247,0.22)", color: "#a8b4d0" }}><Copy size={16} /></button>
          <button type="button" onClick={remove} title="Delete application" className="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-red-500/10" style={{ border: "1px solid rgba(239,68,68,0.2)", color: "#ef7f86" }}><Trash2 size={16} /></button>
          <button type="button" onClick={save} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90" style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}>
            <Save size={15} /> Save changes
          </button>
        </div>
      </div>

      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0" style={{ background: "rgba(124,106,247,0.12)", border: "1px solid rgba(124,106,247,0.18)" }}>{university?.logo || "U"}</div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl lg:text-2xl font-bold text-white truncate" style={{ fontFamily: "var(--font-display)" }}>{draft.university}</h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={statusStyle}>{draft.status}</span>
            </div>
            <p className="text-sm truncate" style={{ color: "#8f9bb8" }}>{draft.program} - {draft.intake}</p>
          </div>
        </div>
        <div className="flex items-center gap-5 text-xs" style={{ color: "#6b7a9e" }}>
          <span>Deadline <strong className="block mt-1 text-sm" style={{ color: "#f8b84e" }}>{draft.deadline ? formatApplicationDate(draft.deadline) : draft.deadlineLabel || "Not set"}</strong></span>
          <span>Completion <strong className="block mt-1 text-sm" style={{ color: "#a89bf5" }}>{draft.progress}%</strong></span>
          <span>Updated <strong className="block mt-1 text-sm" style={{ color: "#c7cde0" }}>{formatApplicationDate(draft.lastUpdated)}</strong></span>
        </div>
      </header>

      <div className="h-1.5 rounded-full overflow-hidden mb-5" style={{ background: "rgba(124,106,247,0.1)" }}>
        <div className="h-full rounded-full" style={{ width: draft.progress + "%", background: "linear-gradient(90deg, #7c6af7, #06b6d4)" }} />
      </div>

      <nav className="flex gap-1 overflow-x-auto mb-5 pb-1" aria-label="Application workspace">
        {tabs.map(({ icon: Icon, id, label }) => (
          <button key={id} type="button" onClick={() => setActiveTab(id)} className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: activeTab === id ? "rgba(124,106,247,0.16)" : "transparent", border: "1px solid " + (activeTab === id ? "rgba(124,106,247,0.36)" : "transparent"), color: activeTab === id ? "#d6d1ff" : "#8592b0" }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </nav>

      {feedback && <div role="status" className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: feedback.includes("could not") ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", color: feedback.includes("could not") ? "#f58a90" : "#59d9a8" }}>{feedback}</div>}

      {activeTab === "overview" && (
        <div className="grid xl:grid-cols-[1.4fr_0.8fr] gap-4">
          <section className="p-5 rounded-lg" style={panelStyle}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div><h2 className="font-semibold text-white">Application progress</h2><p className="text-xs mt-1" style={{ color: "#6b7a9e" }}>{completedTasks} of {draft.tasks.length} checklist items complete</p></div>
              {draft.status === "Draft" && <button type="button" onClick={markSubmitted} className="px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: "#5968d9" }}>Mark submitted</button>}
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mb-5">
              {[["Application reference", draft.applicationReference || "Not assigned"], ["Submission date", formatApplicationDate(draft.submittedDate)], ["Documents linked", String(draft.documents.length)], ["Current status", draft.status]].map(([label, value]) => (
                <div key={label} className="p-3 rounded-lg" style={{ background: "rgba(8,13,26,0.55)", border: "1px solid rgba(124,106,247,0.1)" }}><p className="text-xs mb-1" style={{ color: "#6b7a9e" }}>{label}</p><p className="text-sm font-medium text-white">{value}</p></div>
              ))}
            </div>
            <label className="block text-xs mb-2" style={{ color: "#8f9bb8" }}>Private notes</label>
            <textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} rows={7} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-y" style={inputStyle} placeholder="Add decisions, questions, interview notes, or follow-up details." />
          </section>
          <aside className="space-y-4">
            <section className="p-5 rounded-lg" style={panelStyle}>
              <h2 className="font-semibold text-white mb-4">Status and dates</h2>
              <label className="block text-xs mb-1.5" style={{ color: "#8f9bb8" }}>Status</label>
              <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as ApplicationRecord["status"] }))} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none mb-3" style={inputStyle}>{applicationStatuses.map((status) => <option key={status}>{status}</option>)}</select>
              <Field label="Deadline" type="date" value={draft.deadline} onChange={(value) => setDraft((current) => ({ ...current, deadline: value }))} />
              {draft.deadlineLabel && (
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "#8f9bb8" }}>
                  Official listing: {draft.deadlineLabel}
                </p>
              )}
              <div className="mt-3"><Field label="Application reference" value={draft.applicationReference ?? ""} onChange={(value) => setDraft((current) => ({ ...current, applicationReference: value || null }))} /></div>
            </section>
            <section className="p-5 rounded-lg" style={panelStyle}>
              <h2 className="font-semibold text-white mb-3">Official program source</h2>
              <Field label="HTTPS portal address" type="url" value={draft.portalUrl} onChange={(value) => setDraft((current) => ({ ...current, portalUrl: value }))} />
              {draft.programSourceUrl && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs" style={{ color: "#7785a4" }}>
                    {draft.programVerifiedAt ? `Catalog checked ${draft.programVerifiedAt}` : "Official listing"}
                  </span>
                  <SafeExternalLink
                    url={draft.programSourceUrl}
                    className="inline-flex items-center gap-1.5 text-xs hover:text-white"
                  >
                    Verify details <ExternalLink size={12} />
                  </SafeExternalLink>
                </div>
              )}
            </section>
          </aside>
        </div>
      )}

      {activeTab === "form" && (
        <div className="space-y-4">
          <FormSection title="Program details"><Field label="Program" value={draft.program} onChange={(value) => setDraft((current) => ({ ...current, program: value }))} /><Field label="Intake" value={draft.intake} onChange={(value) => setDraft((current) => ({ ...current, intake: value }))} /><Field label="Deadline" type="date" value={draft.deadline} onChange={(value) => setDraft((current) => ({ ...current, deadline: value }))} /></FormSection>
          <FormSection title="Applicant information"><Field label="First name" value={draft.applicant.firstName} onChange={(value) => changeApplicant("firstName", value)} /><Field label="Last name" value={draft.applicant.lastName} onChange={(value) => changeApplicant("lastName", value)} /><Field label="Email" type="email" value={draft.applicant.email} onChange={(value) => changeApplicant("email", value)} /><Field label="Phone" type="tel" value={draft.applicant.phone} onChange={(value) => changeApplicant("phone", value)} /><Field label="Date of birth" type="date" value={draft.applicant.dateOfBirth} onChange={(value) => changeApplicant("dateOfBirth", value)} /><Field label="Nationality" value={draft.applicant.nationality} onChange={(value) => changeApplicant("nationality", value)} /><Field label="Address" value={draft.applicant.address} onChange={(value) => changeApplicant("address", value)} /></FormSection>
          <FormSection title="Education"><Field label="Institution" value={draft.education.institution} onChange={(value) => changeEducation("institution", value)} /><Field label="Degree" value={draft.education.degree} onChange={(value) => changeEducation("degree", value)} /><Field label="Field of study" value={draft.education.fieldOfStudy} onChange={(value) => changeEducation("fieldOfStudy", value)} /><Field label="GPA" value={draft.education.gpa} onChange={(value) => changeEducation("gpa", value)} /><Field label="GPA scale" value={draft.education.gpaScale} onChange={(value) => changeEducation("gpaScale", value)} /><Field label="Graduation year" value={draft.education.graduationYear} onChange={(value) => changeEducation("graduationYear", value)} /></FormSection>
        </div>
      )}

      {activeTab === "checklist" && (
        <section className="p-5 rounded-lg" style={panelStyle}>
          <div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-white">Application checklist</h2><span className="text-xs" style={{ color: "#a89bf5" }}>{completedTasks}/{draft.tasks.length} complete</span></div>
          <div className="space-y-2 mb-4">
            {draft.tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(8,13,26,0.55)", border: "1px solid rgba(124,106,247,0.1)" }}>
                <button type="button" onClick={() => setDraft((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, completed: !item.completed } : item) }))} className="w-7 h-7 inline-flex items-center justify-center" style={{ color: task.completed ? "#4adea8" : "#7180a3" }}>{task.completed ? <CheckCircle2 size={19} /> : <Circle size={19} />}</button>
                <input value={task.title} onChange={(event) => setDraft((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, title: event.target.value } : item) }))} className="flex-1 min-w-0 bg-transparent outline-none text-sm" style={{ color: task.completed ? "#8190ad" : "#e8eaf0", textDecoration: task.completed ? "line-through" : "none" }} />
                <input type="date" value={task.dueDate ?? ""} onChange={(event) => setDraft((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, dueDate: event.target.value || null } : item) }))} className="hidden sm:block px-2 py-1.5 rounded-lg text-xs outline-none" style={inputStyle} />
                <button type="button" title="Remove checklist item" onClick={() => setDraft((current) => ({ ...current, tasks: current.tasks.filter((item) => item.id !== task.id) }))} className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-red-500/10" style={{ color: "#b66c76" }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2"><input value={newTask} onChange={(event) => setNewTask(event.target.value)} className="flex-1 min-w-0 px-3 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} placeholder="Add a checklist item" /><button type="button" onClick={() => { if (!newTask.trim()) return; setDraft((current) => ({ ...current, tasks: [...current.tasks, { completed: false, dueDate: current.deadline || null, id: crypto.randomUUID(), title: newTask.trim() }] })); setNewTask(""); }} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "#5968d9" }}>Add</button></div>
        </section>
      )}

      {activeTab === "documents" && (
        <section className="p-5 rounded-lg" style={panelStyle}>
          <div className="flex items-center justify-between gap-3 mb-4"><div><h2 className="font-semibold text-white">Linked documents</h2><p className="text-xs mt-1" style={{ color: "#6b7a9e" }}>Select document versions used for this application.</p></div><button type="button" onClick={() => navigate("/documents")} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-white/10" style={{ color: "#b8c1d9" }}>Manage documents <ExternalLink size={13} /></button></div>
          <div className="grid md:grid-cols-2 gap-2">
            {documents.map((document) => {
              const selected = draft.documents.includes(document.name);
              return <button key={document.id} type="button" onClick={() => setDraft((current) => ({ ...current, documents: selected ? current.documents.filter((name) => name !== document.name) : [...current.documents, document.name] }))} className="flex items-center gap-3 p-3 rounded-lg text-left hover:bg-white/5" style={{ background: selected ? "rgba(124,106,247,0.12)" : "rgba(8,13,26,0.55)", border: "1px solid " + (selected ? "rgba(124,106,247,0.38)" : "rgba(124,106,247,0.1)") }}><span className="w-7 h-7 rounded-lg inline-flex items-center justify-center shrink-0" style={{ background: selected ? "#5968d9" : "rgba(124,106,247,0.08)", color: selected ? "white" : "#7180a3" }}>{selected ? <Check size={15} /> : <FileText size={15} />}</span><span className="min-w-0 flex-1"><strong className="block text-sm text-white truncate">{document.name}</strong><span className="text-xs" style={{ color: "#6b7a9e" }}>{document.category} - {document.status}</span></span></button>;
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function FormSection({ children, title }: { children: React.ReactNode; title: string }) {
  return <section className="p-5 rounded-lg" style={panelStyle}><h2 className="font-semibold text-white mb-4">{title}</h2><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div></section>;
}
