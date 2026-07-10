import { useState } from "react";
import { Star, Clock, Check, Calendar, X } from "lucide-react";
import { mentors } from "../../data/mockData";

const timeSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const days = ["Mon Jun 23", "Tue Jun 24", "Wed Jun 25", "Thu Jun 26", "Fri Jun 27"];

export function ConsultationsPage() {
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booked, setBooked] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const book = () => {
    if (selectedMentor && selectedDay && selectedTime) {
      setBooked(`${selectedDay} at ${selectedTime}`);
      setShowModal(false);
    }
  };

  return (
    <div style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Expert Consultations</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7a9e" }}>Book a free session with an expert mentor or alumni</p>
        </div>

        {booked && (
          <div className="p-4 rounded-2xl mb-6 flex items-center gap-3" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <Check size={18} style={{ color: "#10b981" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "#10b981" }}>Session booked!</p>
              <p className="text-xs" style={{ color: "#a8b4d0" }}>Your consultation is scheduled for {booked}. You'll receive a confirmation email shortly.</p>
            </div>
          </div>
        )}

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: "🎁", title: "First Session Free", desc: "No commitment, no payment" },
            { icon: "🌍", title: "Expert Mentors", desc: "Current students & alumni" },
            { icon: "⭐", title: "Verified Reviews", desc: "Real student feedback" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="p-4 rounded-2xl text-center" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-sm font-medium text-white">{title}</div>
              <div className="text-xs mt-1" style={{ color: "#6b7a9e" }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Mentor cards */}
        <h3 className="font-semibold text-white mb-4">Available Mentors</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {mentors.map((mentor) => (
            <div
              key={mentor.id}
              className="p-5 rounded-2xl transition-all"
              style={{
                background: "rgba(13,20,50,0.6)",
                border: `1px solid ${selectedMentor === mentor.id ? "#7c6af7" : "rgba(124,106,247,0.12)"}`,
              }}
            >
              <div className="flex items-start gap-4 mb-4">
                <img src={mentor.photo} alt={mentor.name} className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white">{mentor.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#6b7a9e" }}>{mentor.university} · {mentor.country}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} fill="#f59e0b" style={{ color: "#f59e0b" }} />
                    <span className="text-xs font-medium" style={{ color: "#f59e0b" }}>{mentor.rating}</span>
                    <span className="text-xs" style={{ color: "#6b7a9e" }}>({mentor.reviews} reviews)</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold" style={{ color: "#e8eaf0" }}>{mentor.price}</div>
                  <div className="text-xs px-2 py-0.5 rounded-full mt-1" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}>1st free</div>
                </div>
              </div>

              <p className="text-xs mb-3" style={{ color: "#a8b4d0" }}>{mentor.bio}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {mentor.expertise.map((e) => (
                  <span key={e} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(124,106,247,0.1)", color: "#a89bf5" }}>{e}</span>
                ))}
              </div>

              <div className="flex gap-2 mb-3">
                {mentor.languages.map((l) => (
                  <span key={l} className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4" }}>{l}</span>
                ))}
              </div>

              <button
                onClick={() => { setSelectedMentor(mentor.id); setShowModal(true); }}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-all"
                style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
              >
                Book Session
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Booking modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md p-6 rounded-3xl" style={{ background: "#0d1432", border: "1px solid rgba(124,106,247,0.25)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Calendar size={16} style={{ color: "#7c6af7" }} /> Book a Session
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: "#6b7a9e" }}><X size={18} /></button>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: "#6b7a9e" }}>Select Day</p>
              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className="shrink-0 px-3 py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: selectedDay === day ? "rgba(124,106,247,0.2)" : "rgba(8,13,26,0.5)",
                      border: `1px solid ${selectedDay === day ? "#7c6af7" : "rgba(124,106,247,0.15)"}`,
                      color: selectedDay === day ? "#a89bf5" : "#6b7a9e",
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: "#6b7a9e" }}>Select Time (CET)</p>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className="py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: selectedTime === time ? "rgba(124,106,247,0.2)" : "rgba(8,13,26,0.5)",
                      border: `1px solid ${selectedTime === time ? "#7c6af7" : "rgba(124,106,247,0.15)"}`,
                      color: selectedTime === time ? "#a89bf5" : "#6b7a9e",
                    }}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl mb-4" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <p className="text-xs" style={{ color: "#10b981" }}>🎁 Your first session is completely free. No credit card required.</p>
            </div>

            <button
              onClick={book}
              disabled={!selectedDay || !selectedTime}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #7c6af7, #06b6d4)" }}
            >
              Confirm Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
