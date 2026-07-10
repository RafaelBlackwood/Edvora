import { useState } from "react";
import { Upload, Eye, MoreHorizontal, CheckCircle2, Clock, AlertCircle, FileText, Plus, X } from "lucide-react";
import { documents } from "../../data/mockData";

const categories = ["All", "Transcripts", "Diplomas", "Test Results", "Passport", "CV", "Motivation Letter", "Letters of Recommendation", "Portfolio", "Other"];

const statusIcon = (s: string) => {
  if (s === "Final") return <CheckCircle2 size={13} style={{ color: "#10b981" }} />;
  if (s === "Draft") return <Clock size={13} style={{ color: "#f59e0b" }} />;
  return <AlertCircle size={13} style={{ color: "#ef4444" }} />;
};

const statusColor = (s: string) => {
  if (s === "Final") return { bg: "rgba(16,185,129,0.1)", color: "#10b981" };
  if (s === "Draft") return { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" };
  return { bg: "rgba(239,68,68,0.1)", color: "#ef4444" };
};

export function DocumentsPage() {
  const [category, setCategory] = useState("All");
  const [docs, setDocs] = useState(documents);
  const [showUpload, setShowUpload] = useState(false);
  const [dragging, setDragging] = useState(false);

  const filtered = docs.filter((d) => category === "All" || d.category === category);
  const complete = docs.filter((d) => d.status === "Final").length;
  const pending = docs.filter((d) => d.status === "Pending").length;
  const draft = docs.filter((d) => d.status === "Draft").length;

  return (
    <div style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Document Hub</h1>
            <p className="text-sm mt-1" style={{ color: "#6b7a9e" }}>Manage all your application documents in one place</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-all"
            style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
          >
            <Plus size={15} /> Upload Document
          </button>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Complete", count: complete, icon: CheckCircle2, color: "#10b981" },
            { label: "Draft", count: draft, icon: Clock, color: "#f59e0b" },
            { label: "Missing", count: pending, icon: AlertCircle, color: "#ef4444" },
          ].map(({ label, count, icon: Icon, color }) => (
            <div key={label} className="p-4 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color }} />
                <span className="text-sm" style={{ color: "#6b7a9e" }}>{label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color, fontFamily: "var(--font-mono)" }}>{count}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="p-4 rounded-2xl mb-6" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: "#a8b4d0" }}>Overall Document Completeness</span>
            <span style={{ color: "#10b981" }}>{Math.round((complete / docs.length) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(124,106,247,0.1)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(complete / docs.length) * 100}%`, background: "linear-gradient(90deg, #7c6af7, #10b981)" }}
            />
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: category === cat ? "rgba(124,106,247,0.2)" : "rgba(13,22,53,0.6)",
                border: `1px solid ${category === cat ? "#7c6af7" : "rgba(124,106,247,0.15)"}`,
                color: category === cat ? "#a89bf5" : "#6b7a9e",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Document grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const sc = statusColor(doc.status);
            return (
              <div
                key={doc.id}
                className="p-4 rounded-2xl transition-all hover:border-purple-500/25"
                style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(124,106,247,0.1)" }}>
                      <FileText size={18} style={{ color: "#a89bf5" }} />
                    </div>
                    <div>
                      <div className="font-medium text-white text-sm">{doc.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#6b7a9e" }}>{doc.category}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0" style={{ background: sc.bg, color: sc.color }}>
                    {statusIcon(doc.status)}
                    {doc.status}
                  </div>
                </div>

                {doc.status === "Pending" ? (
                  <div
                    className="flex items-center justify-center gap-2 py-4 rounded-xl border-dashed border-2 mb-3 cursor-pointer hover:opacity-80 transition-all"
                    style={{ borderColor: "rgba(124,106,247,0.25)" }}
                    onClick={() => setShowUpload(true)}
                  >
                    <Upload size={14} style={{ color: "#6b7a9e" }} />
                    <span className="text-xs" style={{ color: "#6b7a9e" }}>Upload document</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "#6b7a9e" }}>Version</span>
                      <span style={{ color: "#a8b4d0" }}>v{doc.version}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "#6b7a9e" }}>Size</span>
                      <span style={{ color: "#a8b4d0" }}>{doc.size}</span>
                    </div>
                    {doc.expiry && (
                      <div className="flex justify-between text-xs">
                        <span style={{ color: "#6b7a9e" }}>Expires</span>
                        <span style={{ color: "#f59e0b" }}>{doc.expiry}</span>
                      </div>
                    )}
                    {doc.usedIn.length > 0 && (
                      <div className="flex justify-between text-xs">
                        <span style={{ color: "#6b7a9e" }}>Used in</span>
                        <span style={{ color: "#a8b4d0" }}>{doc.usedIn.join(", ")}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                    style={{ background: "rgba(124,106,247,0.1)", color: "#a89bf5", border: "1px solid rgba(124,106,247,0.2)" }}
                    disabled={doc.status === "Pending"}
                  >
                    <Eye size={12} /> Preview
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                    style={{ background: "rgba(8,13,26,0.5)", color: "#6b7a9e", border: "1px solid rgba(124,106,247,0.1)" }}
                    onClick={() => setShowUpload(true)}
                  >
                    <Upload size={12} /> Update
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md p-6 rounded-3xl" style={{ background: "#0d1432", border: "1px solid rgba(124,106,247,0.25)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Upload Document</h3>
              <button onClick={() => setShowUpload(false)} style={{ color: "#6b7a9e" }}><X size={18} /></button>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={() => { setDragging(false); setShowUpload(false); }}
              className="flex flex-col items-center justify-center gap-3 py-10 rounded-2xl mb-4 cursor-pointer transition-all"
              style={{
                border: `2px dashed ${dragging ? "#7c6af7" : "rgba(124,106,247,0.25)"}`,
                background: dragging ? "rgba(124,106,247,0.08)" : "rgba(8,13,26,0.5)",
              }}
            >
              <Upload size={28} style={{ color: "#7c6af7" }} />
              <div className="text-center">
                <p className="text-sm font-medium text-white">Drop files here or click to browse</p>
                <p className="text-xs mt-1" style={{ color: "#6b7a9e" }}>PDF, DOC, JPG up to 50MB</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: "#6b7a9e" }}>Category</label>
              <select
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "rgba(13,22,53,0.8)", border: "1px solid rgba(124,106,247,0.2)", color: "#a8b4d0" }}
              >
                {categories.slice(1).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <button
              onClick={() => setShowUpload(false)}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
              style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
            >
              Upload
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
