import { useState } from "react";
import { DollarSign, TrendingDown, PieChart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from "recharts";

const CHART_COLORS = ["#7c6af7", "#06b6d4", "#10b981", "#f59e0b", "#f43f5e", "#a855f7", "#3b82f6"];

const defaultBudget = {
  tuition: 16000,
  housing: 800,
  food: 300,
  transport: 80,
  health: 110,
  visa: 200,
  examFees: 250,
  appFees: 150,
  flights: 800,
  personal: 200,
};

const currencies: Record<string, number> = { EUR: 1, USD: 1.08, GBP: 0.85, CAD: 1.47, AUD: 1.65, SEK: 11.4 };

export function BudgetSimulatorPage() {
  const [budget, setBudget] = useState(defaultBudget);
  const [currency, setCurrency] = useState("EUR");
  const [duration, setDuration] = useState(2);
  const [scholarship, setScholarship] = useState(0);

  const rate = currencies[currency];
  const monthly = Object.values(budget).reduce((a, b) => a + b, 0) - budget.tuition / 12 + budget.tuition / 12;
  const monthlyLiving = budget.housing + budget.food + budget.transport + budget.health + budget.personal;
  const yearly = budget.tuition + monthlyLiving * 12 + budget.visa + budget.examFees + budget.appFees + budget.flights;
  const total = yearly * duration;
  const afterScholarship = total - scholarship;

  const fmt = (n: number) => `${currency === "EUR" ? "€" : currency === "USD" ? "$" : currency === "GBP" ? "£" : currency === "CAD" ? "CA$" : "A$"}${Math.round(n * rate).toLocaleString()}`;

  const pieData = [
    { name: "Tuition", value: budget.tuition * duration },
    { name: "Housing", value: budget.housing * 12 * duration },
    { name: "Food", value: budget.food * 12 * duration },
    { name: "Transport", value: budget.transport * 12 * duration },
    { name: "Health", value: budget.health * 12 * duration },
    { name: "Other", value: (budget.visa + budget.examFees + budget.appFees + budget.flights + budget.personal * 12) * duration },
  ];

  const comparisonData = [
    { country: "Germany", tuition: 0, living: 900, total: 900 },
    { country: "Netherlands", tuition: 16000, living: 1100, total: 17100 },
    { country: "Poland", tuition: 4000, living: 700, total: 4700 },
    { country: "UK", tuition: 28500, living: 1600, total: 30100 },
    { country: "Canada", tuition: 22000, living: 1500, total: 23500 },
    { country: "USA", tuition: 45000, living: 2000, total: 47000 },
  ];

  return (
    <div style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Budget Simulator</h1>
            <p className="text-sm mt-1" style={{ color: "#6b7a9e" }}>Estimate your total cost of studying abroad</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm outline-none appearance-none"
              style={{ background: "rgba(13,22,53,0.8)", border: "1px solid rgba(124,106,247,0.2)", color: "#a8b4d0" }}
            >
              {Object.keys(currencies).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Monthly Living", value: fmt(monthlyLiving), color: "#7c6af7" },
            { label: "Yearly Total", value: fmt(yearly), color: "#06b6d4" },
            { label: `Total (${duration}yr degree)`, value: fmt(total), color: "#f59e0b" },
            { label: "After Scholarship", value: fmt(afterScholarship), color: "#10b981" },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-4 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <div className="text-sm" style={{ color: "#6b7a9e" }}>{label}</div>
              <div className="text-xl font-bold mt-1" style={{ color, fontFamily: "var(--font-mono)" }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Sliders */}
          <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
            <h3 className="font-semibold text-white mb-4">Adjust Expenses</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "#6b7a9e" }}>Duration (years)</span>
                  <span style={{ color: "#a8b4d0" }}>{duration}</span>
                </div>
                <input type="range" min="1" max="5" step="1" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full" style={{ accentColor: "#7c6af7" }} />
              </div>
              {[
                { label: "Annual Tuition", key: "tuition", min: 0, max: 60000, step: 1000 },
                { label: "Monthly Housing", key: "housing", min: 300, max: 2500, step: 50 },
                { label: "Monthly Food", key: "food", min: 150, max: 800, step: 25 },
                { label: "Monthly Transport", key: "transport", min: 30, max: 300, step: 10 },
                { label: "Monthly Health Insurance", key: "health", min: 50, max: 400, step: 10 },
                { label: "Scholarship/Funding (total)", key: "_scholarship", min: 0, max: 50000, step: 1000, special: true },
              ].map(({ label, key, min, max, step, special }) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "#6b7a9e" }}>{label}</span>
                    <span style={{ color: special ? "#10b981" : "#a8b4d0" }}>
                      {special ? `-${fmt(scholarship)}` : fmt(budget[key as keyof typeof budget] as number)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={special ? scholarship : budget[key as keyof typeof budget] as number}
                    onChange={(e) => {
                      if (special) setScholarship(Number(e.target.value));
                      else setBudget((prev) => ({ ...prev, [key]: Number(e.target.value) }));
                    }}
                    className="w-full"
                    style={{ accentColor: special ? "#10b981" : "#7c6af7" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Pie chart */}
          <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
            <h3 className="font-semibold text-white mb-4">Cost Breakdown</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "#0d1432", border: "1px solid rgba(124,106,247,0.2)", color: "#e8eaf0", borderRadius: "12px" }} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs" style={{ color: "#a8b4d0" }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CHART_COLORS[i] }} />
                  {item.name}: {fmt(item.value)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Country comparison */}
        <div className="p-5 rounded-2xl" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
          <h3 className="font-semibold text-white mb-4">Country Cost Comparison (Annual €)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} barSize={20}>
                <XAxis dataKey="country" stroke="#6b7a9e" tick={{ fontSize: 11, fill: "#6b7a9e" }} />
                <YAxis stroke="#6b7a9e" tick={{ fontSize: 11, fill: "#6b7a9e" }} />
                <Tooltip contentStyle={{ background: "#0d1432", border: "1px solid rgba(124,106,247,0.2)", color: "#e8eaf0", borderRadius: "12px" }} />
                <Bar dataKey="tuition" name="Tuition" fill="#7c6af7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="living" name="Living (mo)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2 text-xs" style={{ color: "#6b7a9e" }}>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: "#7c6af7" }} /> Annual Tuition (€)</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: "#06b6d4" }} /> Monthly Living (€)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
