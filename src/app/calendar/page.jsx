"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import PageLoader from "@/components/PageLoader";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  X,
  Trash2,
  Edit2,
  MoreVertical,
  Settings,
  LayoutGrid,
  List,
  Target,
  Zap,
  Tag,
  Type,
  Layout,
  Bell
} from "lucide-react";

// --- LOGIC UTILS ---
function toIsoFromLocal(localDateTime) {
  if (!localDateTime) return "";
  return new Date(localDateTime).toISOString();
}

function toInputDateTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function splitDateTime(localValue) {
  if (!localValue || !localValue.includes("T")) return { date: "", time: "" };
  const [date, time] = localValue.split("T");
  return { date, time: (time || "").slice(0, 5) };
}

function mergeDateTime(date, time) {
  if (!date || !time) return "";
  return `${date}T${time}`;
}

const TIME_OPTIONS = Array.from({ length: 96 }, (_, idx) => {
  const hour = String(Math.floor(idx / 4)).padStart(2, "0");
  const minute = String((idx % 4) * 15).padStart(2, "0");
  return `${hour}:${minute}`;
});

function formatTimeLabel(timeValue) {
  if (!timeValue || !timeValue.includes(":")) return "Select time";
  const [hoursText, minutesText] = timeValue.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeValue;
  const period = hours >= 12 ? "PM" : "AM";
  const twelveHour = hours % 12 || 12;
  const baseTimeStr = `${twelveHour}:${String(minutes).padStart(2, "0")} ${period}`;
  if (hours === 0 && minutes === 0) return `${baseTimeStr} (Midnight)`;
  if (hours === 12 && minutes === 0) return `${baseTimeStr} (Noon)`;
  return baseTimeStr;
}

function TimeDropdown({ value, onChange, dark = false }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full h-[44px] rounded-xl px-4 text-sm text-left flex items-center justify-between transition-all ${
          dark
            ? "border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500/20"
            : "border border-gray-100 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10"
        }`}
      >
        <span className="font-medium">{formatTimeLabel(value)}</span>
        <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
      </button>

      {open && (
        <div className={`absolute left-0 right-0 mt-2 max-h-52 overflow-y-auto rounded-2xl shadow-xl z-50 border ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          {TIME_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => { onChange(option); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${option === value ? (dark ? "bg-gray-700 text-white" : "bg-gray-900 text-white") : (dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50")}`}
            >
              {formatTimeLabel(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DateDropdown({ value, onChange, dark = false }) {
  const [open, setOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(() => parseDateOnly(value) || new Date());
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const days = monthGridMonday(displayMonth);
  const selected = parseDateOnly(value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full h-[44px] rounded-xl px-4 text-sm text-left flex items-center justify-between transition-all ${
          dark
            ? "border border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-blue-500/20"
            : "border border-gray-100 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-gray-900/10"
        }`}
      >
        <span className="font-medium">{selected ? selected.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Select date"}</span>
        <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
      </button>

      {open && (
        <div className={`absolute left-0 mt-2 w-[300px] rounded-2xl shadow-2xl z-50 p-4 border ${dark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}><ChevronLeft className="w-4 h-4" /></button>
            <div className={`text-sm font-bold ${dark ? "text-white" : "text-gray-900"}`}>{displayMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
            <button type="button" onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${dark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {["M", "T", "W", "T", "F", "S", "S"].map(d => <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>)}
            {days.map((day) => {
              const isSelected = selected && isSameDate(day, selected);
              const inMonth = day.getMonth() === displayMonth.getMonth();
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => { onChange(`${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`); setOpen(false); }}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all ${isSelected ? (dark ? "bg-white text-gray-900 shadow-lg" : "bg-gray-900 text-white shadow-lg shadow-gray-200") : (inMonth ? (dark ? "text-white hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100") : "text-gray-300")}`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function parseDateOnly(dateValue) {
  if (!dateValue || !dateValue.includes("-")) return null;
  const [y, m, d] = dateValue.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function monthGridMonday(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const start = new Date(year, month, 1 - firstDayOffset);
  return Array.from({ length: 42 }, (_, idx) => {
    const d = new Date(start);
    d.setDate(start.getDate() + idx);
    return d;
  });
}

function isSameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date) {
  const d = startOfDay(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function monthRange(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function rangeForView(view, monthDate, selectedDate) {
  if (view === "day") {
    const start = startOfDay(selectedDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  if (view === "week") {
    const start = startOfWeek(selectedDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  return monthRange(monthDate);
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// --- MAIN APPLICATION ---
export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("personal");
  const [calendarView, setCalendarView] = useState("month");

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const [editingEventId, setEditingEventId] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [activeEventMenu, setActiveEventMenu] = useState(null);
  const eventMenuRef = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [projectId, setProjectId] = useState("");
  const [eventType, setEventType] = useState("meeting");
  const [status, setStatus] = useState("pending");
  const [color, setColor] = useState("#111827");

  const STATUS_CONFIG = {
    pending: { label: "Pending", color: "bg-gray-400", hex: "#94a3b8" },
    in_process: { label: "In Process", color: "bg-blue-500", hex: "#3b82f6" },
    finished: { label: "Finished", color: "bg-green-500", hex: "#22c55e" },
    pause: { label: "Pause", color: "bg-amber-500", hex: "#f59e0b" },
  };

  const PRESET_COLORS = [
    { name: "Slate", hex: "#111827", bg: "bg-gray-950" },
    { name: "Blue", hex: "#2563eb", bg: "bg-blue-600" },
    { name: "Indigo", hex: "#4f46e5", bg: "bg-indigo-600" },
    { name: "Purple", hex: "#7c3aed", bg: "bg-purple-600" },
    { name: "Rose", hex: "#e11d48", bg: "bg-rose-600" },
    { name: "Amber", hex: "#d97706", bg: "bg-amber-600" },
    { name: "Emerald", hex: "#059669", bg: "bg-emerald-600" },
  ];

  const [teamProjectId, setTeamProjectId] = useState("");
  const [teamData, setTeamData] = useState({ members: [], events: [], busy_times: [] });
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [meetingDuration, setMeetingDuration] = useState(60);
  const [meetingWindowStart, setMeetingWindowStart] = useState("");
  const [meetingWindowEnd, setMeetingWindowEnd] = useState("");
  const [meetingSlots, setMeetingSlots] = useState([]);
  const [planningMeeting, setPlanningMeeting] = useState(false);

  const fetchEventsForView = async (view, monthDate, selectedDate) => {
    try {
      const { start, end } = rangeForView(view, monthDate, selectedDate);
      const url = `/api/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load events");
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch events.");
    }
  };

  const fetchTeamCalendar = useCallback(async () => {
    if (!teamProjectId) return;
    try {
      const { start, end } = monthRange(currentMonth);
      const res = await fetch(`/api/projects/${teamProjectId}/calendar/team?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load team data");
      const data = await res.json();
      setTeamData({
        members: data.members || [],
        events: data.events || [],
        busy_times: data.busy_times || [],
      });
      setSelectedMemberIds((prev) => (prev.length > 0 ? prev : (data.members || []).map(m => m.id)));
    } catch (err) {
      console.error(err);
    }
  }, [teamProjectId, currentMonth]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const meRes = await fetch("/api/profile", { credentials: "include" });
        const meData = await meRes.json();
        if (!meData?.profile) { router.push("/login"); return; }
        setUser(meData.profile);

        const projRes = await fetch("/api/projects", { credentials: "include" });
        if (projRes.ok) {
          const projData = await projRes.json();
          const safe = Array.isArray(projData) ? projData : [];
          setProjects(safe);
          if (safe[0]) setTeamProjectId(safe[0].id);
        }
        await fetchEventsForView("month", new Date(), new Date());
      } catch (err) {
        setError("Init failed.");
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [router]);

  useEffect(() => {
    if (loading) return;
    fetchEventsForView(calendarView, currentMonth, selectedDay);
  }, [calendarView, currentMonth, selectedDay, loading]);

  useEffect(() => {
    if (loading || !teamProjectId || viewMode !== "team") return;
    fetchTeamCalendar();
  }, [fetchTeamCalendar, loading, teamProjectId, viewMode]);

  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      return d;
    });
  }, [currentMonth]);

  const headerLabel = useMemo(() => {
    return currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [currentMonth]);

  const resetForm = () => {
    setEditingEventId(null);
    setTitle("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    setProjectId("");
    setEventType("meeting");
    setStatus("pending");
    setColor("#111827");
  };

  const openCreateEventModal = () => {
    resetForm();
    const start = new Date(selectedDay);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(10, 0, 0, 0);
    setStartTime(toInputDateTime(start.toISOString()));
    setEndTime(toInputDateTime(end.toISOString()));
    setShowEventModal(true);
  };

  const submitEvent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        start_time: toIsoFromLocal(startTime),
        end_time: toIsoFromLocal(endTime),
        project_id: projectId || null,
        event_type: eventType,
        status: status,
        color: color || STATUS_CONFIG[status]?.hex || "#111827",
      };
      const url = editingEventId ? `/api/calendar/events/${editingEventId}` : "/api/calendar/events";
      const method = editingEventId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save error");
      setShowEventModal(false);
      await fetchEventsForView(calendarView, currentMonth, selectedDay);
    } catch (err) {
      setError("Failed to save.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEditEvent = (ev) => {
    setEditingEventId(ev.id);
    setTitle(ev.title || "");
    setDescription(ev.description || "");
    setStartTime(toInputDateTime(ev.start_time));
    setEndTime(toInputDateTime(ev.end_time));
    setProjectId(ev.project_id || "");
    setEventType(ev.event_type || "meeting");
    setStatus(ev.status || "pending");
    setColor(ev.color || "#111827");
    setShowEventModal(true);
  };

  const deleteEvent = async (id) => {
    if (!confirm("Delete?")) return;
    await fetch(`/api/calendar/events/${id}`, { method: "DELETE", credentials: "include" });
    await fetchEventsForView(calendarView, currentMonth, selectedDay);
  };

  if (loading) {
    return (
      <AppShell user={user} activePath="/calendar" contentClassName="flex-1 bg-gray-50/50">
        <PageLoader label="Opening your schedule..." />
      </AppShell>
    );
  }

  return (
    <AppShell user={user} activePath="/calendar" contentClassName="flex-1 bg-gray-50/50">
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-64px)]">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={openCreateEventModal}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gray-900 text-white text-sm font-bold hover:bg-black transition-all active:scale-[0.98] shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
            <div className="flex items-center bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
              <button onClick={() => { const now = new Date(); setCurrentMonth(now); setSelectedDay(now); }} className="px-4 py-1.5 rounded-xl text-gray-700 text-sm font-bold hover:bg-gray-50 transition-all">Today</button>
              <div className="w-px h-6 bg-gray-100 mx-1" />
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} 
                className="w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-50 flex items-center justify-center transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} 
                className="w-10 h-10 rounded-xl text-gray-500 hover:bg-gray-50 flex items-center justify-center transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <h1 className="ml-2 text-2xl font-extrabold text-gray-900 tracking-tight">{headerLabel}</h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex items-center rounded-2xl border border-gray-100 bg-white p-1 shadow-sm">
              {[
                { key: "day", label: "Day", icon: Layout },
                { key: "week", label: "Week", icon: List },
                { key: "month", label: "Month", icon: LayoutGrid },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setCalendarView(item.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    calendarView === item.key ? "bg-gray-900 text-white shadow-md shadow-gray-200 border-transparent" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
            
            <div className="flex items-center bg-white border border-gray-100 rounded-2xl p-1 shadow-sm">
              <button 
                onClick={() => setViewMode("personal")} 
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === "personal" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                <Target className="w-4 h-4" />
                Personal
              </button>
              <button 
                onClick={() => setViewMode("team")} 
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === "team" ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                <Users className="w-4 h-4" />
                Team Session
              </button>
            </div>
          </div>
        </div>

        {/* Layout with Sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-8">
          
          {/* Sidebar */}
          <aside className="space-y-6">
            {viewMode === "team" && (
              <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-500" />
                  Meeting Finder
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Context Project</label>
                    <select
                      value={teamProjectId}
                      onChange={(e) => setTeamProjectId(e.target.value)}
                      className="w-full h-[40px] bg-gray-50 border-0 rounded-xl px-4 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/10"
                    >
                      {projects.map(p => <option key={p.id} value={p.id}>{p.title || p.name}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 ml-1">Team Members</label>
                    <div className="space-y-1.5 max-h-48 overflow-auto pr-2 custom-scrollbar">
                      {teamData.members.map(m => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedMemberIds(prev => prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id]);
                          }}
                          className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${selectedMemberIds.includes(m.id) ? "bg-blue-50" : "hover:bg-gray-50"}`}
                        >
                          <div className={`w-3 h-3 rounded-full border-2 ${selectedMemberIds.includes(m.id) ? "bg-blue-500 border-blue-500" : "bg-white border-gray-200"}`} />
                          <span className={`text-xs font-bold ${selectedMemberIds.includes(m.id) ? "text-blue-700" : "text-gray-600"}`}>{m.full_name || m.username}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    className="w-full py-3 bg-gray-900 text-white rounded-2xl text-xs font-bold hover:bg-black transition-all active:scale-[0.98] mt-2 shadow-sm"
                  >
                    Find Optimum Slots
                  </button>
                </div>
              </div>
            )}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                Upcoming
              </h3>
              <div className="space-y-3">
                {events.slice(0, 3).map(ev => (
                  <div key={ev.id} className="group cursor-pointer">
                    <p className="text-xs font-bold text-gray-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{ev.title}</p>
                    <p className="text-[10px] font-medium text-gray-400 mt-0.5">{new Date(ev.start_time).toLocaleDateString("en-US", { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Calendar Grid Container */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-3 text-center text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 flex-1 min-h-[700px]">
              {monthDays.map((d, idx) => {
                const isCurrentMonth = d.getMonth() === currentMonth.getMonth();
                const isToday = isSameDate(d, new Date());
                const dayKey = formatDateKey(d);
                const dayEvents = (events.filter(e => isSameDate(new Date(e.start_time), d))).slice(0, 4);
                
                return (
                  <div
                    key={d.toISOString()}
                    className={`min-h-[120px] p-3 text-left border-r border-b border-gray-50 last:border-r-0 transition-colors ${!isCurrentMonth ? "bg-gray-50/20" : "bg-white hover:bg-gray-50/30"}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-xs font-extrabold px-1.5 py-0.5 rounded-lg ${isToday ? "bg-gray-900 text-white" : (isCurrentMonth ? "text-gray-900" : "text-gray-300")}`}>
                        {d.getDate()}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {dayEvents.map(ev => (
                        <button
                          key={ev.id}
                          onClick={() => startEditEvent(ev)}
                          style={{ backgroundColor: ev.color || STATUS_CONFIG[ev.status]?.hex || "#111827" }}
                          className="w-full text-left truncate rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-white transition-all transform hover:scale-[1.02] shadow-sm active:scale-[0.98]"
                          title={`${ev.title} (${ev.status})`}
                        >
                          {ev.title}
                        </button>
                      ))}
                      {dayEvents.length > 3 && <div className="text-[9px] font-bold text-gray-400 pl-1">+ More</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal: Redesigned as White Premium Card */}
        {showEventModal && (
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-xl rounded-[32px] bg-white text-gray-900 shadow-2xl p-8 border border-white relative">
              <button 
                onClick={() => setShowEventModal(false)} 
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                  <Zap className="w-3 h-3" /> {editingEventId ? "Update Session" : "New Event Entry"}
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">{editingEventId ? "Edit Event" : "Create Event"}</h2>
              </div>

              <form onSubmit={submitEvent} className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 ml-1">Event Name</label>
                  <div className="relative">
                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Product Workshop..."
                      className="w-full h-14 bg-gray-50 border-0 rounded-2xl pl-12 pr-4 text-sm font-bold placeholder:text-gray-300 outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 ml-1">Start Date</label>
                    <DateDropdown value={splitDateTime(startTime).date} onChange={(d) => setStartTime(mergeDateTime(d, splitDateTime(startTime).time))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 ml-1">End Date</label>
                    <DateDropdown value={splitDateTime(endTime).date} onChange={(d) => setEndTime(mergeDateTime(d, splitDateTime(endTime).time))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 ml-1">Begins At</label>
                    <TimeDropdown value={splitDateTime(startTime).time} onChange={(t) => setStartTime(mergeDateTime(splitDateTime(startTime).date, t))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 ml-1">Concludes At</label>
                    <TimeDropdown value={splitDateTime(endTime).time} onChange={(t) => setEndTime(mergeDateTime(splitDateTime(endTime).date, t))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 ml-1">Event Type</label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full h-11 bg-gray-50 border-0 rounded-2xl px-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none"
                    >
                      <option value="meeting">Meeting</option>
                      <option value="task">Task / Job</option>
                      <option value="deadline">Deadline</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 ml-1">Status</label>
                    <div className="flex gap-1 p-1 bg-gray-50 rounded-2xl border border-gray-100 h-11">
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setStatus(key)}
                          className={`flex-1 rounded-xl flex items-center justify-center text-[9px] font-black uppercase tracking-tight transition-all ${
                            status === key ? `${config.color} text-white shadow-sm` : "text-gray-400 hover:bg-white hover:text-gray-900"
                          }`}
                          title={config.label}
                        >
                          {key === "in_process" ? "Proc" : key === "finished" ? "Done" : key === "pause" ? "Wait" : "Pend"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-3 ml-1">Custom Identification Color</label>
                  <div className="flex flex-wrap gap-3 ml-1">
                     {PRESET_COLORS.map(c => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setColor(c.hex)}
                          className={`w-8 h-8 rounded-full ${c.bg} transition-all transform hover:scale-110 active:scale-90 border-2 ${color === c.hex ? "border-gray-900 scale-110 shadow-md ring-4 ring-gray-100" : "border-transparent"}`}
                          title={c.name}
                        />
                     ))}
                     <button
                        type="button"
                        onClick={() => setColor("")}
                        className={`px-4 h-8 rounded-full bg-gray-50 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900 border-2 transition-all ${!color ? "border-gray-900 bg-white" : "border-transparent"}`}
                     >
                        Auto (By Status)
                     </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  {editingEventId && (
                    <button 
                      type="button" 
                      onClick={() => deleteEvent(editingEventId)}
                      className="w-14 h-14 flex items-center justify-center rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-all border border-red-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="flex-1 h-14 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-gray-200"
                  >
                    {submitting ? "Processing..." : (editingEventId ? "Apply Changes" : "Confirm Event")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </AppShell>
  );
}