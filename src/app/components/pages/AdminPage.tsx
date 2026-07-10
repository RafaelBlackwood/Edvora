import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Users, Building2, Award, FileText, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";

const tabs = ["Overview", "Users", "Universities", "Scholarships", "Support", "B2B Portal"];

const userGrowth = [
  { month: "Jan", users: 3200 },
  { month: "Feb", users: 4800 },
  { month: "Mar", users: 6100 },
  { month: "Apr", users: 8900 },
  { month: "May", users: 11200 },
  { month: "Jun", users: 14800 },
  { month: "Jul", users: 18300 },
  { month: "Aug", users: 22100 },
  { month: "Sep", users: 28400 },
  { month: "Oct", users: 36500 },
  { month: "Nov", users: 44200 },
  { month: "Dec", users: 52400 },
];

const topCountries = [
  { country: "Germany", searches: 12400 },
  { country: "Canada", searches: 10200 },
  { country: "UK", searches: 8900 },
  { country: "Netherlands", searches: 6700 },
  { country: "USA", searches: 5400 },
];

const pendingReviews = [
  { id: "1", user: "Maria Garcia", action: "Consultant application", time: "2h ago", status: "pending" },
  { id: "2", user: "Ahmed Hassan", action: "University review posted", time: "4h ago", status: "pending" },
  { id: "3", user: "Priya Shah", action: "Community report", time: "6h ago", status: "pending" },
  { id: "4", user: "John Smith", action: "Scholarship listing", time: "1d ago", status: "approved" },
];

const supportTickets = [
  { id: "T-001", user: "Kwame Asante", issue: "Application submission failed", priority: "High", status: "open" },
  { id: "T-002", user: "Lin Wei", issue: "IELTS score not updating", priority: "Medium", status: "open" },
  { id: "T-003", user: "Aisha Patel", issue: "Document upload error", priority: "Low", status: "resolved" },
  { id: "T-004", user: "Omar Farouk", issue: "Payment not processing", priority: "High", status: "open" },
];

export function AdminPage() {
  const [activeTab, setActiveTab] = useState("Overview");

  return (
    <div style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="px-4 lg:px-8 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10b981" }} />
            <span className="text-xs font-medium" style={{ color: "#10b981" }}>Admin Panel</span>
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Back Office Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none mb-6 p-1 rounded-xl" style={{ background: "rgba(13,22,53,0.4)" }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab ? "rgba(124,106,247,0.25)" : "transparent",
                color: activeTab === tab ? "#a89bf5" : "#6b7a9e",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: "52,400", change: "+18%", icon: Users, color: "#7c6af7" },
                { label: "Universities Listed", value: "10,240", change: "+2.1%", icon: Building2, color: "#06b6d4" },
                { label: "Active Applications", value: "8,920", change: "+34%", icon: FileText, color: "#10b981" },
                { label: "Scholarships", value: "4,100", change: "+12%", icon: Award, color: "#f59e0b" },
              ].map(({ label, value, change, icon: Icon, color }) => (
                <div key={label} className="p-4 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>{change}</span>
                  </div>
                  <div className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-mono)" }}>{value}</div>
                  <div className="text-xs mt-1" style={{ color: "#6b7a9e" }}>{label}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* User growth */}
              <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <h3 className="font-semibold text-white mb-4">User Growth 2024</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userGrowth}>
                      <XAxis dataKey="month" stroke="#6b7a9e" tick={{ fontSize: 11, fill: "#6b7a9e" }} />
                      <YAxis stroke="#6b7a9e" tick={{ fontSize: 11, fill: "#6b7a9e" }} />
                      <Tooltip contentStyle={{ background: "#0d1432", border: "1px solid rgba(124,106,247,0.2)", color: "#e8eaf0", borderRadius: "12px" }} />
                      <Line type="monotone" dataKey="users" stroke="#7c6af7" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top countries */}
              <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
                <h3 className="font-semibold text-white mb-4">Top Searched Countries</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCountries} layout="vertical" barSize={16}>
                      <XAxis type="number" stroke="#6b7a9e" tick={{ fontSize: 11, fill: "#6b7a9e" }} />
                      <YAxis type="category" dataKey="country" stroke="#6b7a9e" tick={{ fontSize: 11, fill: "#6b7a9e" }} width={70} />
                      <Tooltip contentStyle={{ background: "#0d1432", border: "1px solid rgba(124,106,247,0.2)", color: "#e8eaf0", borderRadius: "12px" }} />
                      <Bar dataKey="searches" fill="#06b6d4" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Pending reviews */}
            <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h3 className="font-semibold text-white mb-4">Pending Reviews</h3>
              <div className="space-y-2">
                {pendingReviews.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(8,13,26,0.4)" }}>
                    <div>
                      <span className="text-sm font-medium text-white">{item.user}</span>
                      <span className="text-xs ml-2" style={{ color: "#6b7a9e" }}>{item.action}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "#6b7a9e" }}>{item.time}</span>
                      {item.status === "pending" ? (
                        <>
                          <button className="px-2 py-1 rounded-lg text-xs text-white" style={{ background: "#10b981" }}>Approve</button>
                          <button className="px-2 py-1 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>Reject</button>
                        </>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>Approved</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support tickets */}
            <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h3 className="font-semibold text-white mb-4">Support Tickets</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(124,106,247,0.12)" }}>
                      {["ID", "User", "Issue", "Priority", "Status", "Action"].map((h) => (
                        <th key={h} className="text-left pb-2 text-xs font-medium" style={{ color: "#6b7a9e" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="space-y-1">
                    {supportTickets.map((ticket) => (
                      <tr key={ticket.id} style={{ borderBottom: "1px solid rgba(124,106,247,0.06)" }}>
                        <td className="py-2.5 text-xs font-mono" style={{ color: "#7c6af7" }}>{ticket.id}</td>
                        <td className="py-2.5 text-sm" style={{ color: "#a8b4d0" }}>{ticket.user}</td>
                        <td className="py-2.5 text-sm" style={{ color: "#a8b4d0" }}>{ticket.issue}</td>
                        <td className="py-2.5">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{
                            background: ticket.priority === "High" ? "rgba(239,68,68,0.1)" : ticket.priority === "Medium" ? "rgba(245,158,11,0.1)" : "rgba(107,122,158,0.1)",
                            color: ticket.priority === "High" ? "#ef4444" : ticket.priority === "Medium" ? "#f59e0b" : "#6b7a9e",
                          }}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{
                            background: ticket.status === "resolved" ? "rgba(16,185,129,0.1)" : "rgba(6,182,212,0.1)",
                            color: ticket.status === "resolved" ? "#10b981" : "#06b6d4",
                          }}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <button className="text-xs px-2 py-1 rounded-lg hover:opacity-80" style={{ background: "rgba(124,106,247,0.15)", color: "#a89bf5" }}>
                            {ticket.status === "resolved" ? "View" : "Respond"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Universities" && (
          <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
            <h3 className="font-semibold text-white mb-4">University Management</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <button className="p-4 rounded-xl text-left hover:opacity-80 transition-all" style={{ background: "rgba(8,13,26,0.5)", border: "1px solid rgba(124,106,247,0.15)" }}>
                <div className="text-lg mb-2">➕</div>
                <div className="font-medium text-white">Add New University</div>
                <div className="text-xs mt-1" style={{ color: "#6b7a9e" }}>Add a university with programs and requirements</div>
              </button>
              <button className="p-4 rounded-xl text-left hover:opacity-80 transition-all" style={{ background: "rgba(8,13,26,0.5)", border: "1px solid rgba(124,106,247,0.15)" }}>
                <div className="text-lg mb-2">✏️</div>
                <div className="font-medium text-white">Update Programs</div>
                <div className="text-xs mt-1" style={{ color: "#6b7a9e" }}>Edit program details, deadlines, and requirements</div>
              </button>
            </div>
          </div>
        )}

        {activeTab === "B2B Portal" && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <h3 className="font-semibold text-white mb-4">University Partner Portal</h3>
              <p className="text-sm mb-4" style={{ color: "#a8b4d0" }}>Universities can manage their profile, programs, and view student interest analytics directly through Edvora's B2B portal.</p>
              <div className="grid md:grid-cols-2 gap-3">
                {["University Profile Management", "Program Management", "Scholarship Management", "Admission Requirements", "Application Statistics", "Student Interest Analytics", "Featured Program Promotion", "Contact Requests"].map((f) => (
                  <div key={f} className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "rgba(8,13,26,0.4)" }}>
                    <CheckCircle2 size={14} style={{ color: "#10b981" }} />
                    <span className="text-sm" style={{ color: "#a8b4d0" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
