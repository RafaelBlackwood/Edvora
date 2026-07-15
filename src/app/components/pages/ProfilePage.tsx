import { useState } from "react";
import { Award, Check, Edit3, Save, X } from "lucide-react";
import { useAppData } from "../../providers/AppDataProvider";

const destinationOptions = [
  "Germany",
  "Canada",
  "Netherlands",
  "United Kingdom",
  "United States",
  "Sweden",
  "Italy",
  "Poland",
  "Austria",
  "Australia",
];

const profileSections = [
  {
    title: "Academic profile",
    fields: [
      { label: "Current education", key: "currentLevel", type: "text" },
      { label: "Field of study", key: "fieldOfStudy", type: "text" },
      { label: "Target degree", key: "targetDegree", type: "text" },
      { label: "GPA (4.0 scale)", key: "gpa", type: "number" },
    ],
  },
  {
    title: "Test scores",
    fields: [
      { label: "IELTS", key: "ielts", type: "number" },
      { label: "TOEFL", key: "toefl", type: "number" },
      { label: "GRE", key: "gre", type: "number" },
      { label: "GMAT", key: "gmat", type: "number" },
    ],
  },
  {
    title: "Application preferences",
    fields: [
      { label: "Application goal", key: "applicationGoal", type: "text" },
      { label: "Budget range", key: "budget", type: "text" },
      { label: "Intake season", key: "intakeSeason", type: "text" },
      { label: "Work experience", key: "workExperience", type: "text" },
    ],
  },
] as const;

export function ProfilePage() {
  const {
    applications,
    documents,
    savedScholarshipIds,
    updateUserProfile,
    userProfile,
    wishlistUniversities,
  } = useAppData();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(userProfile);
  const [notice, setNotice] = useState("");

  const finalDocuments = documents.filter((document) => document.status === "Final").length;
  const completedFields = [
    draft.name,
    draft.email,
    draft.nationality,
    draft.currentLevel,
    draft.fieldOfStudy,
    draft.targetDegree,
    draft.gpa,
    draft.ielts,
    draft.budget,
    draft.intakeSeason,
    draft.applicationGoal,
    draft.destinationCountries.length,
  ].filter(Boolean).length;
  const completion = Math.round((completedFields / 12) * 100);

  const achievements = [
    { name: "Profile started", description: "Created your Edvora profile", earned: true },
    { name: "First search", description: "Explored university matches", earned: true },
    { name: "First save", description: "Saved a university", earned: wishlistUniversities.length > 0 },
    { name: "Documents ready", description: "Finalized six application documents", earned: finalDocuments >= 6 },
    { name: "First application", description: "Submitted an application", earned: applications.some((application) => application.status !== "Draft") },
    { name: "Global applicant", description: "Targeted at least three destinations", earned: draft.destinationCountries.length >= 3 },
    { name: "Scholarship hunter", description: "Saved three scholarships", earned: savedScholarshipIds.length >= 3 },
    { name: "Profile complete", description: "Reached 90% profile completion", earned: completion >= 90 },
  ];

  const startEditing = () => {
    setDraft(userProfile);
    setNotice("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(userProfile);
    setEditing(false);
  };

  const saveProfile = () => {
    updateUserProfile({ ...draft, profileCompletion: completion });
    setEditing(false);
    setNotice("Profile changes saved. Matching and application tools now use the updated values.");
  };

  const updateField = (key: string, value: string, type: string) => {
    const numericValue = value === "" ? null : Number(value);
    setDraft((current) => ({
      ...current,
      [key]: type === "number" ? numericValue : value,
    }));
  };

  const toggleDestination = (country: string) => {
    setDraft((current) => ({
      ...current,
      destinationCountries: current.destinationCountries.includes(country)
        ? current.destinationCountries.filter((item) => item !== country)
        : [...current.destinationCountries, country],
    }));
  };

  return (
    <main style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <header className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>My profile</h1>
            <p className="text-sm mt-1" style={{ color: "#6b7a9e" }}>Your academic profile powers matching, calculations, and applications.</p>
          </div>
          <div className="flex gap-2">
            {editing && (
              <button type="button" onClick={cancelEditing} className="glass-interactive flex items-center gap-2 px-3 py-2 rounded-md text-sm"><X size={14} /> Cancel</button>
            )}
            <button
              type="button"
              onClick={editing ? saveProfile : startEditing}
              className="app-primary-action flex items-center gap-2 px-4 py-2 text-sm font-medium text-white"
              style={{ background: editing ? "#238a68" : "#665bd7" }}
            >
              {editing ? <Save size={14} /> : <Edit3 size={14} />}
              {editing ? "Save profile" : "Edit profile"}
            </button>
          </div>
        </header>

        {notice && (
          <div role="status" className="flex items-center justify-between gap-3 p-3 rounded-lg mb-5" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
            <span className="flex items-center gap-2 text-sm"><Check size={16} /> {notice}</span>
            <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X size={15} /></button>
          </div>
        )}

        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-5">
          <aside className="space-y-4">
            <section className="p-5 rounded-lg text-center" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <img src={draft.avatar} alt={draft.name} className="w-20 h-20 rounded-lg object-cover mx-auto mb-3" />
              <h2 className="text-lg font-bold text-white">{draft.name}</h2>
              <p className="text-xs mt-1" style={{ color: "#7d89a2" }}>{draft.nationality} / {draft.currentLevel}</p>
              <span className="inline-flex items-center gap-1.5 mt-3 text-xs" style={{ color: "#10b981" }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} /> Active applicant</span>
              <div className="mt-5 text-left">
                <div className="flex justify-between text-xs mb-1.5"><span style={{ color: "#6b7a9e" }}>Profile completion</span><strong style={{ color: "#b4adf5" }}>{completion}%</strong></div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(124,106,247,0.1)" }}><div className="h-full rounded-full" style={{ width: completion + "%", background: "#6f65d4" }} /></div>
              </div>
            </section>

            <section className="p-4 rounded-lg" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <div className="flex items-center gap-2 mb-3"><Award size={15} style={{ color: "#f0b75c" }} /><h2 className="font-semibold text-white text-sm">Achievements</h2></div>
              <div className="grid grid-cols-2 gap-2">
                {achievements.map((achievement) => (
                  <div key={achievement.name} title={achievement.description} className="p-2 rounded-md" style={{ background: achievement.earned ? "rgba(108,94,194,0.12)" : "rgba(8,13,26,0.4)", opacity: achievement.earned ? 1 : 0.45 }}>
                    <Check size={13} style={{ color: achievement.earned ? "#66d7aa" : "#68758d" }} />
                    <p className="text-[10px] mt-1" style={{ color: "#9ba5b8" }}>{achievement.name}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <div className="space-y-4">
            <section className="p-5 rounded-lg" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h2 className="font-semibold text-white mb-4">Personal details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: "Full name", key: "name", value: draft.name },
                  { label: "Email", key: "email", value: draft.email },
                  { label: "Nationality", key: "nationality", value: draft.nationality },
                ].map((field) => (
                  <label key={field.key} className="text-xs" style={{ color: "#6b7a9e" }}>{field.label}
                    {editing ? (
                      <input value={field.value} onChange={(event) => updateField(field.key, event.target.value, "text")} className="w-full mt-1.5 px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "#0b1322", border: "1px solid rgba(124,106,247,0.2)", color: "#e8eaf0" }} />
                    ) : (
                      <span className="block mt-1.5 text-sm" style={{ color: "#e1e4ed" }}>{field.value || "Not set"}</span>
                    )}
                  </label>
                ))}
              </div>
            </section>

            {profileSections.map((section) => (
              <section key={section.title} className="p-5 rounded-lg" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <h2 className="font-semibold text-white mb-4">{section.title}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {section.fields.map((field) => {
                    const value = draft[field.key];
                    return (
                      <label key={field.key} className="text-xs" style={{ color: "#6b7a9e" }}>{field.label}
                        {editing ? (
                          <input
                            type={field.type}
                            step={field.key === "gpa" || field.key === "ielts" ? "0.1" : "1"}
                            value={value === null ? "" : String(value)}
                            onChange={(event) => updateField(field.key, event.target.value, field.type)}
                            className="w-full mt-1.5 px-3 py-2.5 rounded-md text-sm outline-none"
                            style={{ background: "#0b1322", border: "1px solid rgba(124,106,247,0.2)", color: "#e8eaf0" }}
                          />
                        ) : (
                          <span className="block mt-1.5 text-sm" style={{ color: value === null || value === "" ? "#68758d" : "#e1e4ed" }}>{value === null || value === "" ? "Not set" : String(value)}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}

            <section className="p-5 rounded-lg" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h2 className="font-semibold text-white mb-3">Target destinations</h2>
              <div className="flex flex-wrap gap-2">
                {(editing ? destinationOptions : draft.destinationCountries).map((country) => {
                  const selected = draft.destinationCountries.includes(country);
                  return editing ? (
                    <button type="button" key={country} onClick={() => toggleDestination(country)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs" style={{ background: selected ? "rgba(124,106,247,0.18)" : "#0b1322", border: "1px solid " + (selected ? "#7c6af7" : "rgba(124,106,247,0.15)"), color: selected ? "#c1bbff" : "#7d89a2" }}>{selected && <Check size={12} />}{country}</button>
                  ) : (
                    <span key={country} className="px-3 py-1.5 rounded-md text-xs" style={{ background: "rgba(124,106,247,0.14)", color: "#b9b2f6", border: "1px solid rgba(124,106,247,0.22)" }}>{country}</span>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}