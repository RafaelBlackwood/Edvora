import { useState } from "react";
import { useSearchParams } from "react-router";
import { Check, RotateCcw, Save } from "lucide-react";
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

const countryPresets: Record<string, typeof defaultBudget> = {
  Germany: { ...defaultBudget, tuition: 0, housing: 850, food: 320, transport: 65, health: 125 },
  Netherlands: { ...defaultBudget, tuition: 16000, housing: 1050, food: 340, transport: 95, health: 135 },
  Poland: { ...defaultBudget, tuition: 4000, housing: 520, food: 260, transport: 35, health: 70 },
  "United Kingdom": { ...defaultBudget, tuition: 28500, housing: 1250, food: 420, transport: 150, health: 90 },
  Canada: { ...defaultBudget, tuition: 22000, housing: 1250, food: 430, transport: 115, health: 95 },
  "United States": { ...defaultBudget, tuition: 45000, housing: 1650, food: 520, transport: 130, health: 280 },
};

type BudgetScenario = {
  budget: typeof defaultBudget;
  currency: string;
  duration: number;
  preset: string;
  scholarship: number;
};

function loadBudgetScenario() {
  try {
    const stored = sessionStorage.getItem("edvora.budget.scenario");
    return stored ? (JSON.parse(stored) as BudgetScenario) : null;
  } catch {
    return null;
  }
}
export function BudgetSimulatorPage() {
  const [searchParams] = useSearchParams();
  const savedScenario = loadBudgetScenario();
  const requestedPreset = searchParams.get("country");
  const initialPreset = requestedPreset && countryPresets[requestedPreset]
    ? requestedPreset
    : savedScenario?.preset && countryPresets[savedScenario.preset]
      ? savedScenario.preset
      : "Netherlands";
  const useSavedScenario = !requestedPreset ? savedScenario : null;
  const [budget, setBudget] = useState<typeof defaultBudget>(() => useSavedScenario?.budget ?? countryPresets[initialPreset]);
  const [currency, setCurrency] = useState(useSavedScenario?.currency ?? "EUR");
  const [duration, setDuration] = useState(useSavedScenario?.duration ?? 2);
  const [scholarship, setScholarship] = useState(useSavedScenario?.scholarship ?? 0);
  const [preset, setPreset] = useState(initialPreset);
  const [notice, setNotice] = useState("");

  const rate = currencies[currency];
  const monthlyLiving = budget.housing + budget.food + budget.transport + budget.health + budget.personal;
  const recurringTotal = (budget.tuition + monthlyLiving * 12) * duration;
  const oneTimeTotal = budget.visa + budget.examFees + budget.appFees + budget.flights;
  const yearly = budget.tuition + monthlyLiving * 12;
  const total = recurringTotal + oneTimeTotal;
  const afterScholarship = Math.max(0, total - scholarship);

  const fmt = (amount: number) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Math.round(amount * rate));

  const applyPreset = (country: string) => {
    setPreset(country);
    setBudget(countryPresets[country]);
    setNotice("");
  };

  const resetBudget = () => {
    setPreset("Netherlands");
    setBudget(defaultBudget);
    setDuration(2);
    setScholarship(0);
    setCurrency("EUR");
    setNotice("");
  };

  const saveScenario = () => {
    sessionStorage.setItem(
      "edvora.budget.scenario",
      JSON.stringify({ budget, currency, duration, preset, scholarship }),
    );
    setNotice("Budget scenario saved for this session.");
  };
  const pieData = [
    { name: "Tuition", value: budget.tuition * duration },
    { name: "Housing", value: budget.housing * 12 * duration },
    { name: "Food", value: budget.food * 12 * duration },
    { name: "Transport", value: budget.transport * 12 * duration },
    { name: "Health", value: budget.health * 12 * duration },
    { name: "Other", value: oneTimeTotal + budget.personal * 12 * duration },
  ];

  const comparisonData = [
    { country: "Germany", tuition: 0, livingAnnual: 10800, total: 10800 },
    { country: "Netherlands", tuition: 16000, livingAnnual: 13200, total: 29200 },
    { country: "Poland", tuition: 4000, livingAnnual: 8400, total: 12400 },
    { country: "UK", tuition: 28500, livingAnnual: 19200, total: 47700 },
    { country: "Canada", tuition: 22000, livingAnnual: 18000, total: 40000 },
    { country: "USA", tuition: 45000, livingAnnual: 24000, total: 69000 },
  ];

  return (
    <div style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Budget Simulator</h1>
            <p className="text-sm mt-1" style={{ color: "#6b7a9e" }}>Estimate your total cost of studying abroad</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <select value={preset} onChange={(event) => applyPreset(event.target.value)} aria-label="Country preset" className="px-3 py-2 rounded-md text-sm outline-none" style={{ background: "#0e1729", border: "1px solid rgba(124,106,247,0.2)", color: "#a8b4d0" }}>
              {Object.keys(countryPresets).map((country) => <option key={country}>{country}</option>)}
            </select>
            <select value={currency} onChange={(event) => setCurrency(event.target.value)} aria-label="Display currency" className="px-3 py-2 rounded-md text-sm outline-none" style={{ background: "#0e1729", border: "1px solid rgba(124,106,247,0.2)", color: "#a8b4d0" }}>
              {Object.keys(currencies).map((item) => <option key={item}>{item}</option>)}
            </select>
            <button type="button" onClick={saveScenario} className="glass-interactive w-9 h-9 flex items-center justify-center rounded-md" title="Save scenario" aria-label="Save scenario"><Save size={15} /></button>
            <button type="button" onClick={resetBudget} className="glass-interactive w-9 h-9 flex items-center justify-center rounded-md" title="Reset budget" aria-label="Reset budget"><RotateCcw size={15} /></button>
          </div>
        </div>

        {notice && <div role="status" className="flex items-center gap-2 p-3 rounded-md mb-4 text-sm" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}><Check size={15} /> {notice}</div>}

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
                <Bar dataKey="livingAnnual" name="Annual living" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2 text-xs" style={{ color: "#6b7a9e" }}>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: "#7c6af7" }} /> Annual Tuition (€)</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: "#06b6d4" }} /> Annual Living (€)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
