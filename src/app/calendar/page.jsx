"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import PageLoader from "@/components/PageLoader";

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
  return `${twelveHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

function TimeDropdown({ value, onChange, dark = false }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full h-[40px] rounded-md px-3 text-sm text-left flex items-center justify-between ${
          dark
            ? "border border-[#3c4043] bg-[#202124] text-white"
            : "border border-slate-300 bg-slate-50 text-slate-900"
        }`}
      >
        <span>{formatTimeLabel(value)}</span>
        <span className={`${dark ? "text-[#9aa0a6]" : "text-slate-500"}`}>▾</span>
      </button>

      {open && (
        <div
          className={`absolute left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-md shadow-xl z-40 ${
            dark ? "bg-[#202124] border border-[#3c4043]" : "bg-white border border-slate-300"
          }`}
        >
          {TIME_OPTIONS.map((option) => {
            const active = option === value;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm ${
                  dark
                    ? active
                      ? "bg-[#e8eaed] text-[#202124] font-semibold"
                      : "text-white hover:bg-[#2d2f31]"
                    : active
                      ? "bg-slate-200 text-slate-900 font-semibold"
                      : "text-slate-800 hover:bg-slate-100"
                }`}
              >
                {formatTimeLabel(option)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function monthRange(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
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

function parseDateOnly(dateValue) {
  if (!dateValue || !dateValue.includes("-")) return null;
  const [yearText, monthText, dayText] = dateValue.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
  return new Date(year, month - 1, day);
}

function formatDateButtonLabel(dateValue) {
  const parsed = parseDateOnly(dateValue);
  if (!parsed) return "Select date";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function DateDropdown({ value, onChange, dark = false }) {
  const [open, setOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(() => parseDateOnly(value) || new Date());
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const parsed = parseDateOnly(value);
    if (parsed) setDisplayMonth(parsed);
  }, [value]);

  const days = monthGridMonday(displayMonth);
  const selected = parseDateOnly(value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full h-[40px] rounded-md px-3 text-sm text-left flex items-center justify-between ${
          dark
            ? "border border-[#3c4043] bg-[#202124] text-white"
            : "border border-slate-300 bg-slate-50 text-slate-900"
        }`}
      >
        <span>{formatDateButtonLabel(value)}</span>
        <span className={`${dark ? "text-[#9aa0a6]" : "text-slate-500"}`}>▾</span>
      </button>

      {open && (
        <div
          className={`absolute left-0 mt-1 w-[280px] rounded-lg shadow-xl z-40 p-3 ${
            dark ? "bg-[#202124] border border-[#3c4043]" : "bg-white border border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}
              className={`w-7 h-7 rounded-full ${dark ? "text-[#e8eaed] hover:bg-[#2d2f31]" : "text-slate-700 hover:bg-slate-100"}`}
            >
              ‹
            </button>
            <div className={`text-sm font-medium ${dark ? "text-white" : "text-slate-900"}`}>
              {displayMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
            <button
              type="button"
              onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}
              className={`w-7 h-7 rounded-full ${dark ? "text-[#e8eaed] hover:bg-[#2d2f31]" : "text-slate-700 hover:bg-slate-100"}`}
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {["M", "T", "W", "T", "F", "S", "S"].map((label, idx) => (
              <div key={`${label}-${idx}`} className={`text-center text-xs py-1 ${dark ? "text-[#9aa0a6]" : "text-slate-500"}`}>
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {days.map((day) => {
              const inCurrentMonth = day.getMonth() === displayMonth.getMonth();
              const isSelected = selected && isSameDate(day, selected);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    onChange(formatDateKey(day));
                    setOpen(false);
                  }}
                  className={`w-9 h-9 mx-auto rounded-full text-sm ${
                    dark
                      ? isSelected
                        ? "bg-[#e8eaed] text-[#202124] font-semibold"
                        : inCurrentMonth
                          ? "text-[#e8eaed] hover:bg-[#2d2f31]"
                          : "text-[#5f6368]"
                      : isSelected
                        ? "bg-slate-900 text-white font-semibold"
                        : inCurrentMonth
                          ? "text-slate-800 hover:bg-slate-100"
                          : "text-slate-400"
                  }`}
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

function eventInDay(event, day) {
  const d = new Date(day);
  const start = new Date(event.start_time);
  return isSameDate(start, d);
}

function formatTimeRange(start, end) {
  const s = new Date(start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const e = new Date(end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${s} - ${e}`;
}

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

  const [teamProjectId, setTeamProjectId] = useState("");
  const [teamData, setTeamData] = useState({ members: [], events: [], busy_times: [] });
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [meetingDuration, setMeetingDuration] = useState(60);
  const [meetingWindowStart, setMeetingWindowStart] = useState("");
  const [meetingWindowEnd, setMeetingWindowEnd] = useState("");
  const [meetingSlots, setMeetingSlots] = useState([]);
  const [planningMeeting, setPlanningMeeting] = useState(false);

  const fetchEventsForView = async (view, monthDate, selectedDate) => {
    const { start, end } = rangeForView(view, monthDate, selectedDate);
    const url = `/api/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to load calendar events");
    const data = await res.json();
    setEvents(Array.isArray(data) ? data : []);
  };

  const fetchTeamCalendar = useCallback(async () => {
    if (!teamProjectId) return;
    const { start, end } = monthRange(currentMonth);
    const res = await fetch(
      `/api/projects/${teamProjectId}/calendar/team?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
      { credentials: "include" }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || "Failed to load team calendar");
    }
    const data = await res.json();
    const members = data.members || [];
    setTeamData({
      members,
      events: data.events || [],
      busy_times: data.busy_times || [],
    });
    setSelectedMemberIds((prev) => (prev.length > 0 ? prev : members.map((m) => m.id)));
  }, [teamProjectId, currentMonth]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const meRes = await fetch("/api/profile", { credentials: "include" });
        const meData = await meRes.json();
        if (!meData?.profile) {
          router.push("/login");
          return;
        }
        setUser(meData.profile);

        const projRes = await fetch("/api/projects", { credentials: "include" });
        if (projRes.ok) {
          const projData = await projRes.json();
          const safeProjects = Array.isArray(projData) ? projData : [];
          setProjects(safeProjects);
          if (safeProjects[0]) setTeamProjectId(safeProjects[0].id);
        }

        await fetchEventsForView("month", new Date(), new Date());
      } catch (err) {
        console.error(err);
        setError("Could not load calendar data.");
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [router]);

  useEffect(() => {
    if (loading) return;
    fetchEventsForView(calendarView, currentMonth, selectedDay).catch((err) => {
      console.error(err);
      setError("Could not refresh events.");
    });
  }, [calendarView, currentMonth, selectedDay, loading]);

  useEffect(() => {
    if (loading || !teamProjectId || viewMode !== "team") return;
    fetchTeamCalendar().catch((err) => setError(err.message || "Could not refresh team calendar."));
  }, [fetchTeamCalendar, loading, teamProjectId, viewMode]);

  const eventsByDay = useMemo(() => {
    const map = {};
    for (const ev of events) {
      const key = formatDateKey(new Date(ev.start_time));
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    }
    return map;
  }, [events]);

  const selectedMemberSet = useMemo(() => new Set(selectedMemberIds), [selectedMemberIds]);

  const filteredTeamEvents = useMemo(
    () => (teamData.events || []).filter((ev) => selectedMemberSet.has(ev.user_id)),
    [teamData.events, selectedMemberSet]
  );

  const teamEventsByDay = useMemo(() => {
    const map = {};
    for (const ev of filteredTeamEvents) {
      const key = formatDateKey(new Date(ev.start_time));
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    }
    return map;
  }, [filteredTeamEvents]);

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

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDay);
    return Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      return d;
    });
  }, [selectedDay]);

  const dayHours = useMemo(() => Array.from({ length: 24 }, (_, idx) => idx), []);

  const sourceMap = viewMode === "team" ? teamEventsByDay : eventsByDay;
  const selectedEvents = sourceMap[formatDateKey(selectedDay)] || [];

  const eventsById = useMemo(() => {
    const map = {};
    for (const ev of events) {
      map[ev.id] = ev;
    }
    return map;
  }, [events]);

  const headerLabel = useMemo(() => {
    if (calendarView === "day") {
      return selectedDay.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }

    if (calendarView === "week") {
      const start = weekDays[0];
      const end = weekDays[6];
      if (!start || !end) return "Week";
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }

    return currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [calendarView, currentMonth, selectedDay, weekDays]);

  const goToToday = () => {
    const today = new Date();
    setSelectedDay(today);
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const goToPrevious = () => {
    if (calendarView === "month") {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
      return;
    }
    if (calendarView === "week") {
      const prev = new Date(selectedDay);
      prev.setDate(prev.getDate() - 7);
      setSelectedDay(prev);
      setCurrentMonth(new Date(prev.getFullYear(), prev.getMonth(), 1));
      return;
    }
    const prev = new Date(selectedDay);
    prev.setDate(prev.getDate() - 1);
    setSelectedDay(prev);
    setCurrentMonth(new Date(prev.getFullYear(), prev.getMonth(), 1));
  };

  const goToNext = () => {
    if (calendarView === "month") {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
      return;
    }
    if (calendarView === "week") {
      const next = new Date(selectedDay);
      next.setDate(next.getDate() + 7);
      setSelectedDay(next);
      setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
      return;
    }
    const next = new Date(selectedDay);
    next.setDate(next.getDate() + 1);
    setSelectedDay(next);
    setCurrentMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  const startParts = splitDateTime(startTime);
  const endParts = splitDateTime(endTime);
  const windowStartParts = splitDateTime(meetingWindowStart);
  const windowEndParts = splitDateTime(meetingWindowEnd);

  const memberById = useMemo(() => {
    const m = {};
    for (const member of teamData.members || []) {
      m[member.id] = member;
    }
    return m;
  }, [teamData.members]);

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
    setError("");
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        start_time: toIsoFromLocal(startTime),
        end_time: toIsoFromLocal(endTime),
        project_id: projectId || null,
        event_type: eventType,
        status,
        color,
      };

      const url = editingEventId ? `/api/calendar/events/${editingEventId}` : "/api/calendar/events";
      const method = editingEventId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to save event");
      }

      resetForm();
      setShowEventModal(false);
      await fetchEventsForView(calendarView, currentMonth, selectedDay);
      if (viewMode === "team") await fetchTeamCalendar();
    } catch (err) {
      setError(err.message || "Failed to save event.");
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

  const openEventMenu = (event, ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    setSelectedDay(new Date(event.start_time));
    setActiveEventMenu({ eventId: event.id, x: ev.clientX, y: ev.clientY });
  };

  useEffect(() => {
    const handleClose = (ev) => {
      // Don't close if clicking inside the menu
      if (eventMenuRef.current && eventMenuRef.current.contains(ev.target)) {
        return;
      }
      // Don't close if clicking on an event button (has data-event-id)
      if (ev.target.closest('[data-event-button]')) {
        return;
      }
      setActiveEventMenu(null);
    };
    document.addEventListener("click", handleClose);
    return () => document.removeEventListener("click", handleClose);
  }, []);

  const deleteEvent = async (eventId) => {
    if (!confirm("Delete this event?")) return;
    try {
      const res = await fetch(`/api/calendar/events/${eventId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to delete event");
      }
      await fetchEventsForView(calendarView, currentMonth, selectedDay);
      if (viewMode === "team") await fetchTeamCalendar();
    } catch (err) {
      setError(err.message || "Failed to delete event.");
    }
  };

  const toggleMemberSelection = (memberId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const findMeetingSlots = async () => {
    if (!teamProjectId || !meetingWindowStart || !meetingWindowEnd) {
      setError("Select project and meeting window first.");
      return;
    }
    setPlanningMeeting(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${teamProjectId}/calendar/meeting-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          start_time: toIsoFromLocal(meetingWindowStart),
          end_time: toIsoFromLocal(meetingWindowEnd),
          duration_minutes: Number(meetingDuration),
          member_ids: selectedMemberIds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to find meeting slots");
      }
      const data = await res.json();
      setMeetingSlots(data.slots || []);
    } catch (err) {
      setError(err.message || "Failed to find meeting slots.");
    } finally {
      setPlanningMeeting(false);
    }
  };

  const scheduleMeetingAtSlot = async (slot) => {
    if (!teamProjectId) return;
    try {
      const meetingTitle = prompt("Meeting title", "Project sync");
      if (!meetingTitle) return;
      const res = await fetch(`/api/projects/${teamProjectId}/calendar/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: meetingTitle,
          start_time: slot.start_time,
          end_time: slot.end_time,
          member_ids: selectedMemberIds,
          event_type: "meeting",
          color: "#1a73e8",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to schedule meeting");
      }
      await fetchEventsForView(calendarView, currentMonth, selectedDay);
      await fetchTeamCalendar();
      setMeetingSlots([]);
    } catch (err) {
      setError(err.message || "Failed to schedule meeting.");
    }
  };

  if (loading) {
    return (
      <AppShell user={user} activePath="/calendar" contentClassName="flex-1">
        <PageLoader label="Loading calendar..." />
      </AppShell>
    );
  }

  return (
    <AppShell user={user} activePath="/calendar" contentClassName="flex-1">
      <main className="max-w-[1500px] mx-auto px-3 sm:px-6 lg:px-8 py-4 bg-[#f8fafd] min-h-[calc(100vh-64px)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={openCreateEventModal}
              className="px-4 py-2 rounded-full bg-white border border-slate-300 text-slate-700 text-sm font-semibold hover:shadow-sm"
            >
              + Add event
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Today
            </button>
            <button
              onClick={goToPrevious}
              className="w-9 h-9 rounded-full bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
              title="Previous"
            >
              ‹
            </button>
            <button
              onClick={goToNext}
              className="w-9 h-9 rounded-full bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
              title="Next"
            >
              ›
            </button>
            <h1 className="ml-2 text-2xl font-semibold text-slate-900 font-['Arimo']">
              {headerLabel}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="inline-flex items-center rounded-md border border-slate-300 bg-white p-1">
              {[
                { key: "day", label: "Day" },
                { key: "week", label: "Week" },
                { key: "month", label: "Month" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setCalendarView(item.key)}
                  className={`px-3 py-1.5 rounded text-sm font-medium ${
                    calendarView === item.key
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setViewMode("personal")}
              className={`px-4 py-2 rounded-md text-sm font-medium border ${
                viewMode === "personal"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => setViewMode("team")}
              className={`px-4 py-2 rounded-md text-sm font-medium border ${
                viewMode === "team"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              Team
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
          <aside className="space-y-4">
            {viewMode === "team" && (
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Team meeting finder</h3>
                <select
                  value={teamProjectId}
                  onChange={(e) => setTeamProjectId(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 mb-2"
                >
                  <option value="">Select project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title || p.name}
                    </option>
                  ))}
                </select>

                <div className="mb-2 max-h-24 overflow-auto border border-slate-200 rounded-md p-2 bg-slate-50">
                  {(teamData.members || []).map((member) => (
                    <label key={member.id} className="flex items-center gap-2 text-xs text-slate-700 py-0.5">
                      <input
                        type="checkbox"
                        checked={selectedMemberIds.includes(member.id)}
                        onChange={() => toggleMemberSelection(member.id)}
                      />
                      <span>{member.full_name || member.username}</span>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-2 mb-2">
                  <div className="rounded-md border border-slate-300 p-2 bg-white">
                    <div className="text-[11px] font-semibold text-slate-500 mb-1">Window start</div>
                    <div className="grid grid-cols-2 gap-2">
                      <DateDropdown
                        value={windowStartParts.date}
                        onChange={(nextDate) => setMeetingWindowStart(mergeDateTime(nextDate, windowStartParts.time || "09:00"))}
                      />
                      <TimeDropdown
                        value={windowStartParts.time}
                        onChange={(nextTime) =>
                          setMeetingWindowStart(mergeDateTime(windowStartParts.date || formatDateKey(new Date()), nextTime))
                        }
                      />
                    </div>
                  </div>
                  <div className="rounded-md border border-slate-300 p-2 bg-white">
                    <div className="text-[11px] font-semibold text-slate-500 mb-1">Window end</div>
                    <div className="grid grid-cols-2 gap-2">
                      <DateDropdown
                        value={windowEndParts.date}
                        onChange={(nextDate) => setMeetingWindowEnd(mergeDateTime(nextDate, windowEndParts.time || "18:00"))}
                      />
                      <TimeDropdown
                        value={windowEndParts.time}
                        onChange={(nextTime) =>
                          setMeetingWindowEnd(mergeDateTime(windowEndParts.date || formatDateKey(new Date()), nextTime))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={meetingDuration}
                    onChange={(e) => setMeetingDuration(Number(e.target.value))}
                    className="w-24 border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900"
                  />
                  <button
                    onClick={findMeetingSlots}
                    disabled={planningMeeting}
                    className="px-3 py-2 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-black disabled:opacity-60"
                  >
                    {planningMeeting ? "Finding..." : "Find slots"}
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-auto">
                  {meetingSlots.map((slot) => (
                    <div key={slot.start_time} className="border border-slate-200 rounded-md p-2 flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-700">{new Date(slot.start_time).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                      <button
                        onClick={() => scheduleMeetingAtSlot(slot)}
                        className="text-xs px-2 py-1 rounded bg-slate-900 text-white"
                      >
                        Schedule
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </aside>

          <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {calendarView === "month" && (
              <>
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                    <div key={label} className="py-2 text-center text-xs font-semibold text-slate-600">{label}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {monthDays.map((d, idx) => {
                    const key = formatDateKey(d);
                    const dayEvents = (sourceMap[key] || []).slice(0, 4);
                    const isCurrentMonth = d.getMonth() === currentMonth.getMonth();
                    const isSelected = isSameDate(d, selectedDay);
                    const isToday = isSameDate(d, new Date());
                    const isLastCol = (idx + 1) % 7 === 0;
                    const isLastRow = idx >= 35;

                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedDay(new Date(d));
                          setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                        }}
                        className={`min-h-[122px] p-1.5 text-left align-top ${!isLastCol ? "border-r border-slate-200" : ""} ${!isLastRow ? "border-b border-slate-200" : ""} ${isSelected ? "bg-[#e8f0fe]" : "bg-white hover:bg-slate-50"}`}
                      >
                        <div className={`mb-1 text-xs font-semibold ${isCurrentMonth ? "text-slate-800" : "text-slate-400"}`}>
                          <span className={`${isToday ? "inline-flex w-6 h-6 items-center justify-center rounded-full bg-slate-900 text-white" : ""}`}>
                            {d.getDate()}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((ev) => {
                            const memberName = memberById[ev.user_id]?.username;
                            return (
                              <button
                                key={ev.id}
                                type="button"
                                data-event-button
                                onClick={(clickEv) => openEventMenu(ev, clickEv)}
                                className="w-full truncate rounded px-1.5 py-0.5 text-[11px] text-white font-medium bg-slate-900 text-left"
                                title={viewMode === "team" && memberName ? `${ev.title} (${memberName})` : ev.title}
                              >
                                {viewMode === "team" && memberName ? `${memberName}: ${ev.title}` : ev.title}
                                {ev.status === "in_progress" && " ⏳"}
                                {ev.status === "completed" && " ✅"}
                              </button>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <div className="text-[11px] text-slate-500 px-1.5 py-0.5">
                              ... {dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {calendarView === "week" && (
              <>
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                  {weekDays.map((d) => (
                    <button
                      key={formatDateKey(d)}
                      onClick={() => setSelectedDay(new Date(d))}
                      className={`py-2 text-center text-xs font-semibold border-r border-slate-200 last:border-r-0 ${isSameDate(d, selectedDay) ? "bg-slate-900 text-white" : "text-slate-600"}`}
                    >
                      {d.toLocaleDateString("en-US", { weekday: "short" })} {d.getDate()}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-7 min-h-[720px]">
                  {weekDays.map((d, idx) => {
                    const key = formatDateKey(d);
                    const dayEvents = sourceMap[key] || [];
                    return (
                      <div key={key} className={`p-2 align-top ${idx < 6 ? "border-r border-slate-200" : ""}`}>
                        <div className="space-y-1">
                          {dayEvents.length === 0 && <div className="text-[11px] text-slate-400">No events</div>}
                          {dayEvents.slice(0, 15).map((ev) => {
                            const memberName = memberById[ev.user_id]?.username;
                            return (
                              <button
                                key={ev.id}
                                type="button"
                                data-event-button
                                onClick={(clickEv) => openEventMenu(ev, clickEv)}
                                className="w-full rounded px-2 py-1 text-[11px] text-white font-medium bg-slate-900 text-left"
                                title={viewMode === "team" && memberName ? `${ev.title} (${memberName})` : ev.title}
                              >
                                <div className="truncate">{viewMode === "team" && memberName ? `${memberName}: ${ev.title}` : ev.title}</div>
                                <div className="opacity-90">{new Date(ev.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                              </button>
                            );
                          })}
                          {dayEvents.length > 15 && (
                            <div className="text-[11px] text-slate-500 px-2 py-1">
                              ... {dayEvents.length - 15} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {calendarView === "day" && (
              <div className="min-h-[720px] divide-y divide-slate-200">
                {dayHours.map((hour) => {
                  const hourEvents = selectedEvents.filter((ev) => new Date(ev.start_time).getHours() === hour);
                  return (
                    <div key={hour} className="grid grid-cols-[70px_1fr]">
                      <div className="px-3 py-2 text-xs text-slate-500 bg-slate-50 border-r border-slate-200">
                        {String(hour).padStart(2, "0")}:00
                      </div>
                      <div className="p-2 min-h-[60px]">
                        <div className="space-y-1">
                          {hourEvents.map((ev) => {
                            const memberName = memberById[ev.user_id]?.username;
                            return (
                              <button
                                key={ev.id}
                                type="button"
                                data-event-button
                                onClick={(clickEv) => openEventMenu(ev, clickEv)}
                                className="w-full rounded px-2 py-1 text-xs text-white font-medium bg-slate-900 text-left"
                                title={viewMode === "team" && memberName ? `${ev.title} (${memberName})` : ev.title}
                              >
                                {viewMode === "team" && memberName ? `${memberName}: ${ev.title}` : ev.title}
                                {ev.status === "in_progress" && " ⏳"}
                                {ev.status === "completed" && " ✅"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {showEventModal && (
          <div className="fixed inset-0 z-50 bg-black/55 flex items-start justify-center p-3 sm:p-8 overflow-y-auto">
            <div className="w-full max-w-3xl rounded-2xl bg-[#202124] text-white shadow-2xl border border-[#3c4043]">
              <form onSubmit={submitEvent}>
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventModal(false);
                      resetForm();
                    }}
                    className="text-[#9aa0a6] hover:text-white text-2xl leading-none"
                  >
                    ×
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-full bg-white text-[#202124] font-semibold text-sm disabled:opacity-60"
                  >
                    {submitting ? "Saving..." : "Save"}
                  </button>
                </div>

                <div className="px-8 pb-8">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Add title"
                    className="w-full bg-transparent border-0 border-b border-[#5f6368] focus:border-[#8ab4f8] outline-none text-4xl text-white pb-2 placeholder:text-[#9aa0a6]"
                  />

                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-[#3c4043] bg-[#2d2f31] p-3">
                      <div className="text-[11px] uppercase tracking-wide text-[#9aa0a6] mb-2">Start</div>
                      <div className="grid grid-cols-[1.3fr_1fr] gap-2">
                        <DateDropdown
                          value={startParts.date}
                          onChange={(nextDate) => setStartTime(mergeDateTime(nextDate, startParts.time || "09:00"))}
                          dark
                        />
                        <TimeDropdown
                          value={startParts.time}
                          onChange={(nextTime) => setStartTime(mergeDateTime(startParts.date || formatDateKey(new Date()), nextTime))}
                          dark
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border border-[#3c4043] bg-[#2d2f31] p-3">
                      <div className="text-[11px] uppercase tracking-wide text-[#9aa0a6] mb-2">End</div>
                      <div className="grid grid-cols-[1.3fr_1fr] gap-2">
                        <DateDropdown
                          value={endParts.date}
                          onChange={(nextDate) => setEndTime(mergeDateTime(nextDate, endParts.time || "10:00"))}
                          dark
                        />
                        <TimeDropdown
                          value={endParts.time}
                          onChange={(nextTime) =>
                            setEndTime(mergeDateTime(endParts.date || startParts.date || formatDateKey(new Date()), nextTime))
                          }
                          dark
                        />
                      </div>
                    </div>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full border border-[#3c4043] bg-[#2d2f31] rounded-md px-3 py-2 text-sm text-white"
                    >
                      <option value="">Personal event</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title || p.name}
                        </option>
                      ))}
                    </select>
                    <div className="grid grid-cols-[1fr_56px] gap-2">
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full border border-[#3c4043] bg-[#2d2f31] rounded-md px-3 py-2 text-sm text-white"
                      >
                        <option value="meeting">Meeting</option>
                        <option value="deadline">Deadline</option>
                        <option value="task">Task</option>
                        <option value="focus">Focus</option>
                      </select>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="h-[40px] border border-[#3c4043] bg-[#2d2f31] rounded-md px-1"
                      />
                    </div>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full border border-[#3c4043] bg-[#2d2f31] rounded-md px-3 py-2 text-sm text-white mt-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div className="mt-5">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={7}
                      placeholder="Add description"
                      className="w-full border border-[#3c4043] bg-[#111318] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#9aa0a6]"
                    />
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeEventMenu && eventsById[activeEventMenu.eventId] && (
          <div
            ref={eventMenuRef}
            className="fixed z-50 bg-white border border-slate-300 rounded-lg shadow-xl p-2 min-w-[140px]"
            style={{ left: `${activeEventMenu.x}px`, top: `${activeEventMenu.y}px` }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <button
              type="button"
              className="w-full text-left px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded"
              onClick={() => {
                startEditEvent(eventsById[activeEventMenu.eventId]);
                setActiveEventMenu(null);
              }}
            >
              Edit {eventsById[activeEventMenu.eventId]?.title || "event"}
            </button>
            <button
              type="button"
              className="w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
              onClick={() => {
                deleteEvent(activeEventMenu.eventId);
                setActiveEventMenu(null);
              }}
            >
              Delete event
            </button>
          </div>
        )}
      </main>
    </AppShell>
  );
}
