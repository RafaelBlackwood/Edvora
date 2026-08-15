import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useAppData } from "../../providers/AppDataProvider";

const categories = [
  "All",
  "Transcripts",
  "Diplomas",
  "Test Results",
  "Passport",
  "CV",
  "Motivation Letter",
  "Letters of Recommendation",
  "Portfolio",
  "Other",
];

const statusTone: Record<string, { background: string; color: string }> = {
  Draft: { background: "rgba(245,158,11,0.1)", color: "#f59e0b" },
  Final: { background: "rgba(16,185,129,0.1)", color: "#10b981" },
  Pending: { background: "rgba(239,68,68,0.1)", color: "#ef6d75" },
};

export function DocumentsPage() {
  const { addDocument, documents, removeDocument, replaceDocument } = useAppData();
  const [category, setCategory] = useState("All");
  const [showUpload, setShowUpload] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("Transcripts");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocuments = documents.filter(
    (document) => category === "All" || document.category === category,
  );
  const previewDocument = documents.find((document) => document.id === previewId);
  const complete = documents.filter((document) => document.status === "Final").length;
  const draft = documents.filter((document) => document.status === "Draft").length;
  const pending = documents.filter((document) => document.status === "Pending").length;
  const completion = documents.length ? Math.round((complete / documents.length) * 100) : 0;

  const openUpload = (documentId?: string) => {
    const document = documents.find((candidate) => candidate.id === documentId);
    setUploadTargetId(document?.id ?? null);
    setUploadCategory(document?.category ?? "Transcripts");
    setSelectedFile(null);
    setUploadError("");
    setShowUpload(true);
  };

  const closeUpload = () => {
    setShowUpload(false);
    setDragging(false);
    setSelectedFile(null);
    setUploadTargetId(null);
    setUploadError("");
  };

  const chooseFile = (file?: File) => {
    setSelectedFile(file ?? null);
    setUploadError("");
  };

  const submitUpload = async () => {
    if (!selectedFile) {
      setUploadError("Choose a document before uploading.");
      return;
    }

    setUploading(true);
    const result = uploadTargetId
      ? await replaceDocument(uploadTargetId, { category: uploadCategory, file: selectedFile })
      : await addDocument({ category: uploadCategory, file: selectedFile });
    setUploading(false);

    if (!result.ok) {
      setUploadError(result.message ?? "The document could not be uploaded.");
      return;
    }

    setNotice(uploadTargetId ? "Document updated successfully." : "Document uploaded successfully.");
    closeUpload();
  };

  return (
    <main style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <header className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
              Document Hub
            </h1>
            <p className="text-sm mt-1" style={{ color: "#6b7a9e" }}>
              Manage every file used across your applications.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openUpload()}
            className="app-primary-action flex items-center gap-2 px-4 text-sm font-medium text-white"
            style={{ background: "#665bd7" }}
          >
            <Plus size={15} /> Upload document
          </button>
        </header>

        {notice && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 p-3 rounded-lg mb-5"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}
          >
            <span className="flex items-center gap-2 text-sm"><CheckCircle2 size={16} /> {notice}</span>
            <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X size={15} /></button>
          </div>
        )}

        <section className="grid grid-cols-3 gap-3 mb-5" aria-label="Document summary">
          {[
            { label: "Complete", count: complete, icon: CheckCircle2, color: "#10b981" },
            { label: "Draft", count: draft, icon: Clock, color: "#f59e0b" },
            { label: "Missing", count: pending, icon: AlertCircle, color: "#ef6d75" },
          ].map(({ label, count, icon: Icon, color }) => (
            <div key={label} className="p-4 rounded-lg" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <div className="flex items-center gap-2 mb-1"><Icon size={15} style={{ color }} /><span className="text-xs" style={{ color: "#7d89a2" }}>{label}</span></div>
              <strong className="text-2xl" style={{ color, fontFamily: "var(--font-mono)" }}>{count}</strong>
            </div>
          ))}
        </section>

        <section className="p-4 rounded-lg mb-5" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
          <div className="flex justify-between text-xs mb-2"><span style={{ color: "#a8b4d0" }}>Document readiness</span><strong style={{ color: "#10b981" }}>{completion}%</strong></div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(124,106,247,0.1)" }}><div className="h-full rounded-full" style={{ width: completion + "%", background: "#6f65d4" }} /></div>
        </section>

        <nav className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none" aria-label="Document categories">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className="shrink-0 px-3 py-1.5 rounded-md text-xs font-medium"
              style={{
                background: category === item ? "rgba(124,106,247,0.18)" : "rgba(13,22,53,0.5)",
                border: "1px solid " + (category === item ? "#7c6af7" : "rgba(124,106,247,0.14)"),
                color: category === item ? "#c1bbff" : "#7d89a2",
              }}
            >
              {item}
            </button>
          ))}
        </nav>

        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-3" aria-label="Documents">
          {filteredDocuments.map((document) => {
            const tone = statusTone[document.status] ?? statusTone.Pending;
            return (
              <article key={document.id} className="p-4 rounded-lg" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ background: "rgba(124,106,247,0.1)" }}><FileText size={17} style={{ color: "#a89bf5" }} /></span>
                    <div className="min-w-0"><h2 className="text-sm font-medium text-white truncate">{document.name}</h2><p className="text-xs mt-0.5" style={{ color: "#6b7a9e" }}>{document.category}</p></div>
                  </div>
                  <span className="px-2 py-1 rounded-full text-[10px] font-semibold shrink-0" style={tone}>{document.status}</span>
                </div>

                {document.status === "Pending" ? (
                  <button type="button" onClick={() => openUpload(document.id)} className="w-full flex items-center justify-center gap-2 py-4 rounded-md border-dashed border mb-3 text-xs" style={{ borderColor: "rgba(124,106,247,0.28)", color: "#8793ad" }}><Upload size={14} /> Upload required file</button>
                ) : (
                  <dl className="grid grid-cols-2 gap-2 mb-4 text-xs">
                    <div><dt style={{ color: "#66738c" }}>Version</dt><dd style={{ color: "#b7c0d1" }}>v{document.version}</dd></div>
                    <div><dt style={{ color: "#66738c" }}>Size</dt><dd style={{ color: "#b7c0d1" }}>{document.size}</dd></div>
                    <div><dt style={{ color: "#66738c" }}>Uploaded</dt><dd style={{ color: "#b7c0d1" }}>{document.uploadDate}</dd></div>
                    <div><dt style={{ color: "#66738c" }}>Used in</dt><dd className="truncate" style={{ color: "#b7c0d1" }}>{document.usedIn.length ? document.usedIn.join(", ") : "Not used yet"}</dd></div>
                  </dl>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button type="button" disabled={document.status === "Pending"} onClick={() => setPreviewId(document.id)} className="glass-interactive flex items-center justify-center gap-1 py-2 rounded-md text-xs disabled:opacity-40"><Eye size={12} /> Details</button>
                  <button type="button" onClick={() => openUpload(document.id)} className="glass-interactive flex items-center justify-center gap-1 py-2 rounded-md text-xs"><Upload size={12} /> Replace</button>
                </div>
              </article>
            );
          })}
        </section>

        {filteredDocuments.length === 0 && (
          <div className="py-16 text-center" style={{ color: "#6b7a9e" }}><FileText size={28} className="mx-auto mb-3" /><p className="text-sm">No documents in this category.</p></div>
        )}
      </div>

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}>
          <section className="w-full max-w-md p-6 rounded-lg" role="dialog" aria-modal="true" aria-labelledby="upload-title" style={{ background: "#0d1432", border: "1px solid rgba(124,106,247,0.25)" }}>
            <div className="flex items-center justify-between mb-4"><h2 id="upload-title" className="font-semibold text-white">{uploadTargetId ? "Replace document" : "Upload document"}</h2><button type="button" onClick={closeUpload} aria-label="Close upload" style={{ color: "#7d89a2" }}><X size={18} /></button></div>
            <button
              type="button"
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]); }}
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-3 py-9 rounded-lg mb-4"
              style={{ border: "2px dashed " + (dragging ? "#7c6af7" : "rgba(124,106,247,0.25)"), background: dragging ? "rgba(124,106,247,0.08)" : "rgba(8,13,26,0.5)" }}
            >
              <input ref={fileInputRef} type="file" className="sr-only" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(event) => chooseFile(event.target.files?.[0])} />
              <Upload size={27} style={{ color: "#7c6af7" }} />
              <span className="text-sm font-medium text-white">{selectedFile?.name ?? "Drop a file or browse"}</span>
              <small style={{ color: "#6b7a9e" }}>{selectedFile ? (selectedFile.size / (1024 * 1024)).toFixed(1) + " MB selected" : "PDF, Word, JPG, or PNG up to 50MB"}</small>
            </button>
            <label className="block text-xs mb-4" style={{ color: "#7d89a2" }}>Category
              <select value={uploadCategory} onChange={(event) => setUploadCategory(event.target.value)} className="w-full mt-1.5 px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "#101a2e", border: "1px solid rgba(124,106,247,0.2)", color: "#d8dce6" }}>
                {categories.slice(1).map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            {uploadError && <p role="alert" className="text-xs mb-3" style={{ color: "#ef6d75" }}>{uploadError}</p>}
            <button type="button" disabled={!selectedFile || uploading} onClick={() => void submitUpload()} className="app-primary-action w-full py-3 text-sm font-semibold text-white disabled:opacity-40" style={{ background: "#665bd7" }}>{uploading ? "Uploading..." : uploadTargetId ? "Replace file" : "Upload document"}</button>
          </section>
        </div>
      )}

      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}>
          <section className="w-full max-w-md p-6 rounded-lg" role="dialog" aria-modal="true" aria-labelledby="document-title" style={{ background: "#0d1432", border: "1px solid rgba(124,106,247,0.25)" }}>
            <div className="flex items-start justify-between gap-4 mb-5"><div className="flex gap-3"><FileText size={22} style={{ color: "#a89bf5" }} /><div><h2 id="document-title" className="font-semibold text-white">{previewDocument.name}</h2><p className="text-xs" style={{ color: "#6b7a9e" }}>{previewDocument.category}</p></div></div><button type="button" onClick={() => setPreviewId(null)} aria-label="Close details" style={{ color: "#7d89a2" }}><X size={18} /></button></div>
            <dl className="grid grid-cols-2 gap-3 mb-5 text-sm">
              <div><dt style={{ color: "#6b7a9e" }}>Status</dt><dd style={{ color: "#e8eaf0" }}>{previewDocument.status}</dd></div>
              <div><dt style={{ color: "#6b7a9e" }}>Version</dt><dd style={{ color: "#e8eaf0" }}>v{previewDocument.version}</dd></div>
              <div><dt style={{ color: "#6b7a9e" }}>Size</dt><dd style={{ color: "#e8eaf0" }}>{previewDocument.size ?? "Not uploaded"}</dd></div>
              <div><dt style={{ color: "#6b7a9e" }}>Uploaded</dt><dd style={{ color: "#e8eaf0" }}>{previewDocument.uploadDate ?? "Not uploaded"}</dd></div>
            </dl>
            <div className="flex gap-2">
              <button type="button" className="glass-interactive flex-1 py-2.5 rounded-md text-sm" onClick={() => { setPreviewId(null); openUpload(previewDocument.id); }}>Replace file</button>
              <button type="button" className="px-4 py-2.5 rounded-md text-sm flex items-center gap-2" style={{ background: "rgba(239,68,68,0.12)", color: "#ef6d75", border: "1px solid rgba(239,68,68,0.25)" }} onClick={() => { void removeDocument(previewDocument.id); setPreviewId(null); }}><Trash2 size={14} /> Remove</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}