import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, BookOpen, DollarSign, Clock, ChevronRight } from "lucide-react";
import { chatMessages } from "../../data/mockData";

type Msg = { id: string; role: "user" | "assistant"; content: string; time: string };

const suggestions = [
  "Which universities fit my profile best?",
  "What documents do I need for TUM?",
  "Compare top 3 CS programs in Germany",
  "Which scholarships can I apply for?",
  "What are my safe options with GPA 3.6?",
  "How do I write a strong motivation letter?",
];

const quickActions = [
  { icon: BookOpen, label: "Document Checklist", color: "#7c6af7" },
  { icon: DollarSign, label: "Scholarship Search", color: "#10b981" },
  { icon: Clock, label: "Deadline Reminders", color: "#f59e0b" },
  { icon: Sparkles, label: "CV Template", color: "#06b6d4" },
];

const botResponses: Record<string, string> = {
  default: "That's a great question! Based on your profile, I'd suggest focusing on universities in Germany and Canada where your GPA 3.6 and IELTS 7.0 give you competitive chances. Would you like me to break down specific programs?",
  germany: "For Germany, your top matches are:\n\n🏆 **TU Munich** — #37 world, free tuition, MSc CS\n🌟 **KIT Karlsruhe** — strong engineering, €1,500/year\n✨ **TU Berlin** — CS & AI programs, €300/semester\n\nAll three accept IELTS 6.5+. Your GPA 3.6 is competitive. Want me to check specific requirements?",
  document: "For most German universities you'll need:\n\n✅ Official transcripts (certified + translated)\n✅ Bachelor's diploma\n✅ IELTS/TOEFL certificate\n✅ CV/Resume (1–2 pages)\n✅ Motivation letter (program-specific)\n✅ 2 recommendation letters\n✅ Passport copy\n\nYou're currently missing: **2nd recommendation letter** and your **TU Munich motivation letter**.",
  scholarship: "Based on your profile, you qualify for:\n\n💰 **DAAD Scholarship** — €1,200/mo, deadline Oct 15\n💰 **TU Munich Merit Scholarship** — €600/mo, 91% match\n💰 **Erasmus+ Grant** — travel + living, if you do exchange\n\nI recommend applying to DAAD first as it has the most competitive ROI for your profile.",
};

function formatMessage(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "#c4cde8" }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function AssistantBotPage() {
  const [messages, setMessages] = useState<Msg[]>(chatMessages as Msg[]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Msg = { id: Date.now().toString(), role: "user", content: text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    const lower = text.toLowerCase();
    let response = botResponses.default;
    if (lower.includes("german") || lower.includes("germany") || lower.includes("tum")) response = botResponses.germany;
    if (lower.includes("document") || lower.includes("what do i need")) response = botResponses.document;
    if (lower.includes("scholarship") || lower.includes("funding") || lower.includes("daad")) response = botResponses.scholarship;
    const botMsg: Msg = { id: (Date.now() + 1).toString(), role: "assistant", content: response, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => [...prev, botMsg]);
    setTyping(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full" style={{ background: "#080d1a" }}>
      {/* Sidebar */}
      <div className="lg:w-72 shrink-0 p-4 border-b lg:border-b-0 lg:border-r overflow-y-auto" style={{ borderColor: "rgba(124,106,247,0.12)" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}>
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Edvora AI</div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: "#10b981" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: "#6b7a9e" }}>Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map(({ icon: Icon, label, color }) => (
              <button
                key={label}
                onClick={() => sendMessage(label)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: "#6b7a9e" }}>Suggested Questions</p>
          <div className="space-y-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs transition-all hover:bg-white/5"
                style={{ background: "rgba(13,22,53,0.4)", border: "1px solid rgba(124,106,247,0.1)", color: "#a8b4d0" }}
              >
                <ChevronRight size={12} style={{ color: "#7c6af7", shrink: 0 }} className="shrink-0" />
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5" style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}>
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div
                className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                style={{
                  background: msg.role === "user" ? "linear-gradient(135deg, #7c6af7, #06b6d4)" : "rgba(13,20,50,0.8)",
                  color: msg.role === "user" ? "white" : "#e8eaf0",
                  border: msg.role === "assistant" ? "1px solid rgba(124,106,247,0.15)" : "none",
                  borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "4px 20px 20px 20px",
                }}
              >
                {msg.role === "assistant" ? formatMessage(msg.content) : msg.content}
                <div className="text-xs mt-1 opacity-60">{msg.time}</div>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}>
                <Bot size={14} className="text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl flex items-center gap-1" style={{ background: "rgba(13,20,50,0.8)", border: "1px solid rgba(124,106,247,0.15)" }}>
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#7c6af7", animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#7c6af7", animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "#7c6af7", animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4" style={{ borderTop: "1px solid rgba(124,106,247,0.12)", background: "rgba(8,13,26,0.8)", backdropFilter: "blur(12px)" }}>
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask me anything about universities, scholarships, or applications..."
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "rgba(13,22,53,0.8)", border: "1px solid rgba(124,106,247,0.2)", color: "#e8eaf0" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || typing}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
            >
              <Send size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
