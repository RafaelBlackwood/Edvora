import { useState } from "react";
import { User, Award, Edit3, Save } from "lucide-react";
import { userProfile } from "../../data/mockData";

const badges = [
  { name: "Profile Started", icon: "⭐", desc: "Created your Edvora profile", earned: true },
  { name: "First Search", icon: "🔍", desc: "Searched for universities", earned: true },
  { name: "First Save", icon: "❤️", desc: "Saved a university", earned: true },
  { name: "Documents Complete", icon: "📁", desc: "Upload all required docs", earned: false },
  { name: "First Application", icon: "📋", desc: "Submit your first application", earned: false },
  { name: "Deadline Master", icon: "⏰", desc: "Apply before all deadlines", earned: false },
  { name: "Global Applicant", icon: "🌍", desc: "Apply to 5+ countries", earned: false },
  { name: "Scholarship Hunter", icon: "💰", desc: "Apply for 3 scholarships", earned: false },
];

export function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(userProfile);

  return (
    <div style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>My Profile</h1>
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: editing ? "rgba(16,185,129,0.15)" : "rgba(124,106,247,0.15)",
              border: `1px solid ${editing ? "rgba(16,185,129,0.3)" : "rgba(124,106,247,0.25)"}`,
              color: editing ? "#10b981" : "#a89bf5",
            }}
          >
            {editing ? <><Save size={14} /> Save</> : <><Edit3 size={14} /> Edit Profile</>}
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Avatar + basics */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl text-center" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <div className="relative inline-block mb-4">
                <img src={profile.avatar} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover" />
                {editing && (
                  <button className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#7c6af7" }}>
                    <Edit3 size={12} className="text-white" />
                  </button>
                )}
              </div>
              <h2 className="text-xl font-bold text-white">{profile.name}</h2>
              <p className="text-sm" style={{ color: "#6b7a9e" }}>{profile.nationality} · {profile.currentLevel}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} />
                <span className="text-xs" style={{ color: "#10b981" }}>Active applicant</span>
              </div>

              {/* Profile completion */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "#6b7a9e" }}>Profile complete</span>
                  <span style={{ color: "#a89bf5" }}>{profile.profileCompletion}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(124,106,247,0.1)" }}>
                  <div className="h-full rounded-full" style={{ width: `${profile.profileCompletion}%`, background: "linear-gradient(90deg, #7c6af7, #06b6d4)" }} />
                </div>
              </div>

              {/* Streak */}
              <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <div className="text-2xl mb-1">🔥</div>
                <div className="text-sm font-medium" style={{ color: "#f59e0b" }}>{profile.streakDays}-day streak</div>
                <div className="text-xs" style={{ color: "#6b7a9e" }}>Keep it up!</div>
              </div>
            </div>

            {/* Badges */}
            <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Award size={15} style={{ color: "#f59e0b" }} />
                <h3 className="font-semibold text-white">Achievements</h3>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {badges.map((badge) => (
                  <div
                    key={badge.name}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl"
                    style={{
                      background: badge.earned ? "rgba(124,106,247,0.1)" : "rgba(8,13,26,0.4)",
                      opacity: badge.earned ? 1 : 0.4,
                    }}
                    title={badge.desc}
                  >
                    <span className="text-xl">{badge.icon}</span>
                    <span className="text-[9px] text-center leading-tight" style={{ color: "#6b7a9e" }}>{badge.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Profile details */}
          <div className="lg:col-span-2 space-y-4">
            {[
              {
                title: "Academic Profile",
                fields: [
                  { label: "Current Education", key: "currentLevel" },
                  { label: "Field of Study", key: "fieldOfStudy" },
                  { label: "Target Degree", key: "targetDegree" },
                  { label: "GPA", key: "gpa" },
                ],
              },
              {
                title: "Test Scores",
                fields: [
                  { label: "IELTS Score", key: "ielts" },
                  { label: "TOEFL Score", key: "toefl" },
                  { label: "GRE Score", key: "gre" },
                  { label: "GMAT Score", key: "gmat" },
                ],
              },
              {
                title: "Application Preferences",
                fields: [
                  { label: "Application Goal", key: "applicationGoal" },
                  { label: "Budget Range", key: "budget" },
                  { label: "Intake Season", key: "intakeSeason" },
                  { label: "Work Experience", key: "workExperience" },
                ],
              },
            ].map(({ title, fields }) => (
              <div key={title} className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <h3 className="font-semibold text-white mb-4">{title}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {fields.map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#6b7a9e" }}>{label}</label>
                      {editing ? (
                        <input
                          value={String(profile[key as keyof typeof profile] ?? "")}
                          onChange={(e) => setProfile((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ background: "rgba(8,13,26,0.6)", border: "1px solid rgba(124,106,247,0.2)", color: "#e8eaf0" }}
                        />
                      ) : (
                        <div className="text-sm" style={{ color: profile[key as keyof typeof profile] ? "#e8eaf0" : "#6b7a9e" }}>
                          {String(profile[key as keyof typeof profile] ?? "Not set")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Destination countries */}
            <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h3 className="font-semibold text-white mb-3">Target Destinations</h3>
              <div className="flex flex-wrap gap-2">
                {profile.destinationCountries.map((c) => (
                  <span key={c} className="px-3 py-1.5 rounded-full text-sm" style={{ background: "rgba(124,106,247,0.15)", color: "#a89bf5", border: "1px solid rgba(124,106,247,0.25)" }}>
                    {c}
                  </span>
                ))}
                {editing && (
                  <button className="px-3 py-1.5 rounded-full text-sm border-dashed transition-all hover:bg-white/5" style={{ border: "1px dashed rgba(124,106,247,0.3)", color: "#6b7a9e" }}>+ Add</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
