import { useMemo, useState } from "react";
import {
  Calendar,
  Check,
  Clock,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { mentors } from "../../data/mockData";

const timeSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const topics = ["University shortlist", "Application strategy", "Scholarship review", "Motivation letter", "Visa preparation"];

type Booking = {
  id: string;
  mentorId: string;
  day: string;
  time: string;
  topic: string;
};

function getUpcomingWeekdays(count: number) {
  const days: Array<{ label: string; value: string }> = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + 1);

  while (days.length < count) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) {
      days.push({
        label: new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(cursor),
        value: cursor.toISOString().slice(0, 10),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function loadBookings(): Booking[] {
  try {
    return JSON.parse(sessionStorage.getItem("edvora.consultations") ?? "[]") as Booking[];
  } catch {
    return [];
  }
}

export function ConsultationsPage() {
  const availableDays = useMemo(() => getUpcomingWeekdays(7), []);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(topics[0]);
  const [bookings, setBookings] = useState<Booking[]>(loadBookings);
  const [showModal, setShowModal] = useState(false);
  const [notice, setNotice] = useState("");

  const mentor = mentors.find((item) => item.id === selectedMentor);

  const persistBookings = (nextBookings: Booking[]) => {
    setBookings(nextBookings);
    sessionStorage.setItem("edvora.consultations", JSON.stringify(nextBookings));
  };

  const openBooking = (mentorId: string) => {
    setSelectedMentor(mentorId);
    setSelectedDay("");
    setSelectedTime("");
    setSelectedTopic(topics[0]);
    setShowModal(true);
  };

  const book = () => {
    if (!selectedMentor || !selectedDay || !selectedTime) return;
    const booking: Booking = {
      id: crypto.randomUUID(),
      mentorId: selectedMentor,
      day: selectedDay,
      time: selectedTime,
      topic: selectedTopic,
    };
    persistBookings([...bookings, booking]);
    setNotice("Consultation booked with " + (mentor?.name ?? "your mentor") + ".");
    setShowModal(false);
  };

  const cancelBooking = (bookingId: string) => {
    persistBookings(bookings.filter((booking) => booking.id !== bookingId));
    setNotice("Consultation cancelled.");
  };

  return (
    <main style={{ background: "#080d1a", minHeight: "100%" }}>
      <div className="px-4 lg:px-8 py-6 pb-24 lg:pb-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>Expert consultations</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7a9e" }}>Book a focused session with a verified student mentor or alumnus.</p>
        </header>

        {notice && (
          <div role="status" className="flex items-center justify-between gap-3 p-3 rounded-lg mb-5" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
            <span className="flex items-center gap-2 text-sm"><Check size={16} /> {notice}</span>
            <button type="button" onClick={() => setNotice("")} aria-label="Dismiss message"><X size={15} /></button>
          </div>
        )}

        {bookings.length > 0 && (
          <section className="mb-6" aria-labelledby="upcoming-consultations">
            <h2 id="upcoming-consultations" className="font-semibold text-white mb-3">Upcoming sessions</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {bookings.map((booking) => {
                const bookedMentor = mentors.find((item) => item.id === booking.mentorId);
                const dayLabel = availableDays.find((day) => day.value === booking.day)?.label ?? booking.day;
                return (
                  <article key={booking.id} className="flex items-center gap-3 p-4 rounded-lg" style={{ background: "rgba(13,20,50,0.64)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <img src={bookedMentor?.photo} alt="" className="w-10 h-10 rounded-md object-cover" />
                    <div className="flex-1 min-w-0"><h3 className="text-sm font-medium text-white">{bookedMentor?.name}</h3><p className="text-xs truncate" style={{ color: "#7d89a2" }}>{booking.topic}</p><p className="text-xs mt-1" style={{ color: "#10b981" }}>{dayLabel} at {booking.time}</p></div>
                    <button type="button" onClick={() => cancelBooking(booking.id)} className="glass-interactive w-8 h-8 flex items-center justify-center rounded-md" title="Cancel session" aria-label={"Cancel session with " + bookedMentor?.name}><Trash2 size={14} /></button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section className="grid grid-cols-3 gap-3 mb-6" aria-label="Consultation benefits">
          {[
            ["First session free", "No payment details required"],
            ["Verified mentors", "Current students and alumni"],
            ["Focused advice", "A practical 30-minute agenda"],
          ].map(([title, description]) => (
            <div key={title} className="p-4 rounded-lg text-center" style={{ background: "rgba(13,20,50,0.6)", border: "1px solid rgba(124,106,247,0.12)" }}><strong className="text-sm text-white">{title}</strong><p className="text-xs mt-1" style={{ color: "#6b7a9e" }}>{description}</p></div>
          ))}
        </section>

        <h2 className="font-semibold text-white mb-4">Available mentors</h2>
        <section className="grid md:grid-cols-2 gap-3" aria-label="Available mentors">
          {mentors.map((item) => (
            <article key={item.id} className="p-5 rounded-lg" style={{ background: "rgba(13,20,50,0.64)", border: "1px solid rgba(124,106,247,0.12)" }}>
              <div className="flex items-start gap-4 mb-4">
                <img src={item.photo} alt={item.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0"><h3 className="font-semibold text-white">{item.name}</h3><p className="text-xs mt-0.5" style={{ color: "#6b7a9e" }}>{item.university} / {item.country}</p><p className="flex items-center gap-1 mt-1 text-xs" style={{ color: "#f0b75c" }}><Star size={12} fill="currentColor" /> {item.rating} <span style={{ color: "#6b7a9e" }}>({item.reviews} reviews)</span></p></div>
                <div className="text-right shrink-0"><strong className="text-sm text-white">{item.price}</strong><p className="text-[10px] mt-1" style={{ color: "#10b981" }}>First free</p></div>
              </div>
              <p className="text-xs leading-relaxed mb-3" style={{ color: "#a8b4d0" }}>{item.bio}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">{item.expertise.map((expertise) => <span key={expertise} className="px-2 py-0.5 rounded-md text-[10px]" style={{ background: "rgba(124,106,247,0.1)", color: "#aaa2f2" }}>{expertise}</span>)}</div>
              <div className="flex items-center justify-between gap-3"><span className="text-xs" style={{ color: "#6b7a9e" }}>{item.languages.join(" / ")}</span><button type="button" onClick={() => openBooking(item.id)} className="app-primary-action px-4 py-2 text-xs font-semibold text-white" style={{ background: "#665bd7" }}>Book session</button></div>
            </article>
          ))}
        </section>
      </div>

      {showModal && mentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}>
          <section className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-lg" role="dialog" aria-modal="true" aria-labelledby="booking-title" style={{ background: "#0d1432", border: "1px solid rgba(124,106,247,0.25)" }}>
            <div className="flex items-start justify-between gap-4 mb-5"><div className="flex items-center gap-3"><img src={mentor.photo} alt="" className="w-10 h-10 rounded-md object-cover" /><div><h2 id="booking-title" className="font-semibold text-white">Book with {mentor.name}</h2><p className="text-xs" style={{ color: "#6b7a9e" }}>30-minute video consultation</p></div></div><button type="button" onClick={() => setShowModal(false)} aria-label="Close booking"><X size={18} /></button></div>

            <label className="block text-xs mb-4" style={{ color: "#7d89a2" }}>Session topic
              <select value={selectedTopic} onChange={(event) => setSelectedTopic(event.target.value)} className="w-full mt-1.5 px-3 py-2.5 rounded-md text-sm outline-none" style={{ background: "#0a1221", border: "1px solid rgba(124,106,247,0.18)", color: "#e8eaf0" }}>{topics.map((topic) => <option key={topic}>{topic}</option>)}</select>
            </label>

            <fieldset className="mb-4"><legend className="text-xs font-semibold mb-2" style={{ color: "#7d89a2" }}>Select day</legend><div className="flex gap-2 overflow-x-auto pb-1">{availableDays.map((day) => <button key={day.value} type="button" onClick={() => { setSelectedDay(day.value); setSelectedTime(""); }} className="shrink-0 px-3 py-2 rounded-md text-xs" style={{ background: selectedDay === day.value ? "rgba(124,106,247,0.2)" : "#0a1221", border: "1px solid " + (selectedDay === day.value ? "#7c6af7" : "rgba(124,106,247,0.15)"), color: selectedDay === day.value ? "#c1bbff" : "#7d89a2" }}>{day.label}</button>)}</div></fieldset>

            <fieldset className="mb-5"><legend className="text-xs font-semibold mb-2" style={{ color: "#7d89a2" }}>Select time (local timezone)</legend><div className="grid grid-cols-4 gap-2">{timeSlots.map((time) => { const unavailable = bookings.some((booking) => booking.mentorId === mentor.id && booking.day === selectedDay && booking.time === time); return <button key={time} type="button" disabled={!selectedDay || unavailable} onClick={() => setSelectedTime(time)} className="py-2 rounded-md text-xs disabled:opacity-35" style={{ background: selectedTime === time ? "rgba(124,106,247,0.2)" : "#0a1221", border: "1px solid " + (selectedTime === time ? "#7c6af7" : "rgba(124,106,247,0.15)"), color: selectedTime === time ? "#c1bbff" : "#7d89a2" }}>{unavailable ? "Booked" : time}</button>; })}</div></fieldset>

            <div className="flex items-center gap-2 p-3 rounded-md mb-4 text-xs" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#71d9b0" }}><Clock size={14} /> The first session is free. No payment information is collected.</div>
            <button type="button" onClick={book} disabled={!selectedDay || !selectedTime} className="app-primary-action w-full py-3 text-sm font-semibold text-white disabled:opacity-40" style={{ background: "#665bd7" }}><Calendar size={15} className="inline mr-2" /> Confirm booking</button>
          </section>
        </div>
      )}
    </main>
  );
}