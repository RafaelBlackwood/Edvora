import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Bot,
  ChevronRight,
  Clock,
  DollarSign,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router";
import { scholarships } from "../../data/mockData";
import { useAppData } from "../../providers/AppDataProvider";

const suggestions = [
  "Which saved universities fit my profile best?",
  "Which documents are still missing?",
  "Summarize my application deadlines",
  "Which saved scholarships should I prioritize?",
  "What should I improve in my profile?",
];

const quickActions = [
  { icon: BookOpen, label: "Document checklist", color: "#8f84e8", route: "/documents" },
  { icon: DollarSign, label: "Scholarship search", color: "#4dd39e", route: "/scholarships" },
  { icon: Clock, label: "Deadline summary", color: "#f0b75c", prompt: "Summarize my application deadlines" },
  { icon: Sparkles, label: "Profile review", color: "#55cde6", route: "/profile" },
];

function formatMessage(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index} style={{ color: "#d8dcef" }}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export function AssistantBotPage() {
  const navigate = useNavigate();
  const {
    addChatMessage,
    applications,
    chatMessages,
    clearChatMessages,
    documents,
    savedScholarshipIds,
    userProfile,
    wishlistUniversities,
  } = useAppData();
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, typing]);

  const buildResponse = (question: string) => {
    const lower = question.toLowerCase();
    const lineBreak = String.fromCharCode(10);
    const paragraphBreak = lineBreak + lineBreak;
    const finalDocuments = documents.filter((document) => document.status === "Final");
    const pendingDocuments = documents.filter((document) => document.status !== "Final");
    const savedScholarships = scholarships.filter((scholarship) => savedScholarshipIds.includes(scholarship.id));

    if (lower.includes("document") || lower.includes("missing")) {
      return (
        "**Document readiness: " + finalDocuments.length + " finalized, " + pendingDocuments.length + " needing attention.**" +
        paragraphBreak +
        (pendingDocuments.length
          ? "Prioritize: " + pendingDocuments.slice(0, 5).map((document) => document.name + " (" + document.status + ")").join(", ") + "."
          : "Your current document set is ready. Check expiry dates before each submission.") +
        paragraphBreak +
        "Open the Document Hub to replace drafts or upload missing files."
      );
    }

    if (lower.includes("deadline") || lower.includes("application")) {
      if (!applications.length) return "You do not have any applications yet. Start one from the Applications workspace.";
      return (
        "**Application summary:**" +
        paragraphBreak +
        applications
          .slice()
          .sort((first, second) => first.deadline.localeCompare(second.deadline))
          .map((application) => application.university + " - " + application.program + ": " + application.status + ", deadline " + application.deadline)
          .join(lineBreak) +
        paragraphBreak +
        "Review old or placeholder deadlines against the university source before submitting."
      );
    }

    if (lower.includes("scholarship") || lower.includes("funding")) {
      if (!savedScholarships.length) return "You have not saved any scholarships yet. Use Scholarship Search to build a funding shortlist.";
      return (
        "**Saved funding priorities:**" +
        paragraphBreak +
        savedScholarships
          .sort((first, second) => second.matchScore - first.matchScore)
          .map((scholarship) => scholarship.name + ": " + scholarship.matchScore + "% match, " + scholarship.amount + ", deadline " + scholarship.deadline)
          .join(lineBreak) +
        paragraphBreak +
        "Start with the highest match whose required documents are already finalized."
      );
    }

    if (lower.includes("profile") || lower.includes("improve")) {
      const profileSuggestions: string[] = [];
      if (userProfile.profileCompletion < 90) profileSuggestions.push("complete the remaining profile fields");
      if (!userProfile.gre) profileSuggestions.push("confirm whether target programs require GRE results");
      if (!userProfile.toefl && !userProfile.ielts) profileSuggestions.push("add an English-language score");
      if (finalDocuments.length < 6) profileSuggestions.push("finalize at least six core documents");
      return (
        "**Profile snapshot:** GPA " + userProfile.gpa + ", IELTS " + (userProfile.ielts ?? "not added") + ", " + userProfile.profileCompletion + "% complete." +
        paragraphBreak +
        (profileSuggestions.length ? "Next priorities: " + profileSuggestions.join("; ") + "." : "The core profile is strong. Focus next on program-specific motivation letters and references.")
      );
    }

    if (lower.includes("university") || lower.includes("fit") || lower.includes("safe") || lower.includes("compare")) {
      if (!wishlistUniversities.length) return "Your wishlist is empty. Save universities from Search and I can compare them against your profile.";
      const ranked = wishlistUniversities
        .map((university) => {
          let fit = university.matchScore;
          if (userProfile.gpa < university.gpaMin) fit -= 12;
          if ((userProfile.ielts ?? 0) < university.ieltsMin) fit -= 12;
          return { fit: Math.max(0, fit), university };
        })
        .sort((first, second) => second.fit - first.fit);
      return (
        "**Best saved matches:**" +
        paragraphBreak +
        ranked.map(({ fit, university }) => university.name + ": " + fit + "% profile fit, GPA minimum " + university.gpaMin + ", IELTS " + university.ieltsMin).join(lineBreak) +
        paragraphBreak +
        "Treat this as shortlist guidance; final requirements must be checked on each official program page."
      );
    }

    return (
      "I can use your Edvora profile and saved workspace data to compare universities, summarize deadlines, check document readiness, and prioritize scholarships. " +
      "Try asking about one of those areas."
    );
  };

  const sendMessage = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText || typing) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    addChatMessage({ role: "user", content: cleanText, time });
    setInput("");
    setTyping(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    addChatMessage({
      role: "assistant",
      content: buildResponse(cleanText),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    setTyping(false);
  };

  return (
    <main className="flex flex-col lg:flex-row h-full" style={{ background: "#080d1a" }}>
      <aside className="lg:w-72 shrink-0 p-4 border-b lg:border-b-0 lg:border-r overflow-y-auto" style={{ borderColor: "rgba(124,106,247,0.12)" }}>
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "#665bd7" }}><Bot size={16} className="text-white" /></span>
            <div><h1 className="text-sm font-semibold text-white">Edvora Assistant</h1><p className="text-[10px]" style={{ color: "#10b981" }}>Profile-aware</p></div>
          </div>
          <button type="button" onClick={clearChatMessages} className="glass-interactive w-8 h-8 rounded-md flex items-center justify-center" title="Clear conversation" aria-label="Clear conversation"><Trash2 size={13} /></button>
        </div>

        <section className="mb-5">
          <h2 className="text-[10px] font-semibold mb-2 uppercase" style={{ color: "#6b7a9e" }}>Quick actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(({ icon: Icon, label, color, route, prompt }) => (
              <button key={label} type="button" onClick={() => route ? navigate(route) : sendMessage(prompt ?? label)} className="glass-interactive flex flex-col items-center gap-1.5 p-3 rounded-md text-[10px] font-semibold" style={{ color }}><Icon size={16} />{label}</button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-[10px] font-semibold mb-2 uppercase" style={{ color: "#6b7a9e" }}>Suggested questions</h2>
          <div className="space-y-1.5">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => sendMessage(suggestion)} className="glass-interactive w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-left text-xs"><ChevronRight size={12} className="shrink-0" style={{ color: "#8f84e8" }} />{suggestion}</button>
            ))}
          </div>
        </section>
      </aside>

      <section className="flex-1 flex flex-col min-h-0" aria-label="Assistant conversation">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 && (
            <div className="h-full min-h-64 flex flex-col items-center justify-center text-center px-6"><span className="w-14 h-14 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(124,106,247,0.12)", color: "#9f95ef" }}><Bot size={25} /></span><h2 className="font-semibold text-white">Ask about your application journey</h2><p className="text-xs max-w-sm mt-2" style={{ color: "#6b7a9e" }}>I answer from the profile, documents, shortlist, applications, and funding saved in this browser session.</p></div>
          )}

          {chatMessages.map((message) => (
            <div key={message.id} className={"flex gap-3 " + (message.role === "user" ? "justify-end" : "justify-start")}>
              {message.role === "assistant" && <span className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5" style={{ background: "#665bd7" }}><Bot size={14} className="text-white" /></span>}
              <div className="max-w-[82%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap" style={{ background: message.role === "user" ? "#665bd7" : "rgba(13,20,50,0.82)", color: "#e8eaf0", border: message.role === "assistant" ? "1px solid rgba(124,106,247,0.15)" : "none", borderRadius: message.role === "user" ? "8px 8px 2px 8px" : "2px 8px 8px 8px" }}>
                {message.role === "assistant" ? formatMessage(message.content) : message.content}
                <p className="text-[10px] mt-1 opacity-55">{message.time}</p>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex gap-3"><span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#665bd7" }}><Bot size={14} className="text-white" /></span><div className="px-4 py-3 rounded-md flex gap-1" style={{ background: "rgba(13,20,50,0.82)" }}>{[0, 1, 2].map((item) => <span key={item} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#8f84e8", animationDelay: item * 120 + "ms" }} />)}</div></div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={(event) => { event.preventDefault(); sendMessage(input); }} className="p-4" style={{ borderTop: "1px solid rgba(124,106,247,0.12)", background: "rgba(8,13,26,0.9)" }}>
          <div className="flex gap-2">
            <label className="sr-only" htmlFor="assistant-message">Message</label>
            <input id="assistant-message" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about universities, documents, funding, or deadlines" className="flex-1 px-4 py-3 rounded-md text-sm outline-none" style={{ background: "#0e1729", border: "1px solid rgba(124,106,247,0.2)", color: "#e8eaf0" }} />
            <button type="submit" disabled={!input.trim() || typing} className="app-primary-action w-11 h-11 flex items-center justify-center text-white disabled:opacity-40" style={{ background: "#665bd7" }} aria-label="Send message"><Send size={16} /></button>
          </div>
        </form>
      </section>
    </main>
  );
}