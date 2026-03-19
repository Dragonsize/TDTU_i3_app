"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

function toIsoFromLocal(localDateTime) {
  if (!localDateTime) return "";
  return new Date(localDateTime).toISOString();
}

function monthRange(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function eventInDay(event, day) {
  const d = new Date(day);
  const start = new Date(event.start_time);
  return start.getFullYear() === d.getFullYear() && start.getMonth() === d.getMonth() && start.getDate() === d.getDate();
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

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const [editingEventId, setEditingEventId] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [projectId, setProjectId] = useState("");
  const [eventType, setEventType] = useState("meeting");
  const [color, setColor] = useState("#3b82f6");

  const [teamProjectId, setTeamProjectId] = useState("");
  const [teamData, setTeamData] = useState({ members: [], events: [], busy_times: [] });
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [meetingDuration, setMeetingDuration] = useState(60);
  const [meetingWindowStart, setMeetingWindowStart] = useState("");
  const [meetingWindowEnd, setMeetingWindowEnd] = useState("");
  const [meetingSlots, setMeetingSlots] = useState([]);
  const [planningMeeting, setPlanningMeeting] = useState(false);

  const fetchEventsForMonth = async (monthDate) => {
    const { start, end } = monthRange(monthDate);
    const url = `/api/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to load calendar events");
    const data = await res.json();
    setEvents(Array.isArray(data) ? data : []);
  };

  const fetchTeamCalendar = async () => {
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
    setTeamData({
      members: data.members || [],
      events: data.events || [],
      busy_times: data.busy_times || [],
    });
    setSelectedMemberIds((prev) => {
      if (prev.length > 0) return prev;
      return (data.members || []).map((m) => m.id);
    });
  };

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

        await fetchEventsForMonth(new Date());
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
    fetchEventsForMonth(currentMonth).catch((err) => {
      console.error(err);
      setError("Could not refresh events.");
    });
  }, [currentMonth, loading]);

  useEffect(() => {
    if (loading || !teamProjectId || viewMode !== "team") return;
    fetchTeamCalendar().catch((err) => setError(err.message || "Could not refresh team calendar."));
  }, [currentMonth, teamProjectId, viewMode, loading]);

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

  const selectedEvents = eventsByDay[formatDateKey(selectedDay)] || [];
  const selectedMemberSet = new Set(selectedMemberIds);
  const selectedDayTeamEvents = (teamData.events || []).filter(
    (ev) => selectedMemberSet.has(ev.user_id) && eventInDay(ev, selectedDay)
  );
  const selectedDayBusy = (teamData.busy_times || []).filter(
    (ev) => selectedMemberSet.has(ev.user_id) && eventInDay(ev, selectedDay)
  );

  const resetForm = () => {
    setEditingEventId(null);
    setTitle("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    setProjectId("");
    setEventType("meeting");
    setColor("#3b82f6");
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
      await fetchEventsForMonth(currentMonth);
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
    setStartTime(new Date(ev.start_time).toISOString().slice(0, 16));
    setEndTime(new Date(ev.end_time).toISOString().slice(0, 16));
    setProjectId(ev.project_id || "");
    setEventType(ev.event_type || "meeting");
    setColor(ev.color || "#3b82f6");
  };

  const deleteEvent = async (eventId) => {
    if (!confirm("Delete this event?")) return;
    try {
      const res = await fetch(`/api/calendar/events/${eventId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to delete event");
      }
      await fetchEventsForMonth(currentMonth);
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
          color: "#0ea5e9",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to schedule meeting");
      }
      await fetchEventsForMonth(currentMonth);
      await fetchTeamCalendar();
      setMeetingSlots([]);
    } catch (err) {
      setError(err.message || "Failed to schedule meeting.");
    }
  };

  if (loading) {
    return <div className="w-full min-h-screen bg-white flex items-center justify-center text-gray-600">Loading calendar...</div>;
  }

  return (
    <AppShell user={user} activePath="/calendar" contentClassName="flex-1">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-neutral-950 font-['Inter']">Calendar & Meeting Planner</h1>
            <p className="text-gray-600 font-['Arimo'] mt-1">Personal scheduling plus project-wide team availability.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode("personal")} className={`px-3 py-2 rounded-lg text-sm ${viewMode === "personal" ? "bg-black text-white" : "bg-gray-100"}`}>Personal</button>
            <button onClick={() => setViewMode("team")} className={`px-3 py-2 rounded-lg text-sm ${viewMode === "team" ? "bg-black text-white" : "bg-gray-100"}`}>Team</button>
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">{error}</div>}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="px-3 py-2 rounded-lg bg-gray-100 text-sm">Prev</button>
              <div className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium">{currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="px-3 py-2 rounded-lg bg-gray-100 text-sm">Next</button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-xs font-semibold text-gray-500">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="text-center py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((d) => {
                const key = formatDateKey(d);
                const dayEvents = (eventsByDay[key] || []).slice(0, 2);
                const isCurrentMonth = d.getMonth() === currentMonth.getMonth();
                const isSelected = key === formatDateKey(selectedDay);
                return (
                  <button key={key} onClick={() => setSelectedDay(new Date(d))} className={`min-h-[88px] text-left rounded-xl border p-2 ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"} ${isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"}`}>
                    <div className="text-xs font-semibold mb-1">{d.getDate()}</div>
                    {dayEvents.map((ev) => (
                      <div key={ev.id} className="truncate text-[11px] rounded px-1.5 py-0.5 text-white mb-1" style={{ backgroundColor: ev.color || "#3b82f6" }}>{ev.title}</div>
                    ))}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
            <h2 className="text-lg font-bold font-['Arimo'] mb-3">{editingEventId ? "Edit Event" : "Create Event"}</h2>
            <form onSubmit={submitEvent} className="space-y-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Title" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Personal event</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title || p.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="meeting">Meeting</option>
                  <option value="deadline">Deadline</option>
                  <option value="task">Task</option>
                  <option value="focus">Focus</option>
                </select>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-10 border border-gray-300 rounded-lg px-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="submit" disabled={submitting} className="w-full bg-gray-950 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60">{submitting ? "Saving..." : editingEventId ? "Update" : "Add Event"}</button>
                {editingEventId && <button type="button" onClick={resetForm} className="w-full bg-gray-100 rounded-lg py-2 text-sm font-semibold">Cancel</button>}
              </div>
            </form>
          </section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">{selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</h3>
            <div className="space-y-2 max-h-[280px] overflow-auto pr-1">
              {selectedEvents.length === 0 && <p className="text-xs text-gray-500">No events for this day.</p>}
              {selectedEvents.map((ev) => (
                <div key={ev.id} className="border border-gray-200 rounded-lg p-2">
                  <div className="flex justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: ev.color || "#111827" }}>{ev.title}</div>
                      <div className="text-xs text-gray-500">{new Date(ev.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(ev.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEditEvent(ev)} className="text-xs text-blue-600">Edit</button>
                      <button onClick={() => deleteEvent(ev.id)} className="text-xs text-red-600">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {viewMode === "team" && (
            <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
              <h3 className="text-lg font-bold font-['Arimo'] mb-3">Project Team Availability</h3>
              <select value={teamProjectId} onChange={(e) => setTeamProjectId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3">
                <option value="">Select project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title || p.name}</option>)}
              </select>

              <div className="mb-3 max-h-28 overflow-auto border border-gray-200 rounded-lg p-2">
                {(teamData.members || []).map((member) => (
                  <label key={member.id} className="flex items-center gap-2 text-sm py-1">
                    <input type="checkbox" checked={selectedMemberIds.includes(member.id)} onChange={() => toggleMemberSelection(member.id)} />
                    <span>{member.full_name || member.username} ({member.role})</span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-2">
                <input type="datetime-local" value={meetingWindowStart} onChange={(e) => setMeetingWindowStart(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input type="datetime-local" value={meetingWindowEnd} onChange={(e) => setMeetingWindowEnd(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2 mb-3">
                <input type="number" min={15} step={15} value={meetingDuration} onChange={(e) => setMeetingDuration(Number(e.target.value))} className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <button onClick={findMeetingSlots} disabled={planningMeeting} className="px-3 py-2 rounded-lg bg-black text-white text-sm disabled:opacity-60">{planningMeeting ? "Finding..." : "Find Slots"}</button>
              </div>

              <div className="space-y-2 max-h-36 overflow-auto mb-3">
                {meetingSlots.length === 0 && <p className="text-xs text-gray-500">No slots yet. Choose range and click Find Slots.</p>}
                {meetingSlots.map((slot) => (
                  <div key={slot.start_time} className="border border-gray-200 rounded-lg p-2 flex items-center justify-between gap-2">
                    <div className="text-xs text-gray-700">
                      {new Date(slot.start_time).toLocaleString()} - {new Date(slot.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <button onClick={() => scheduleMeetingAtSlot(slot)} className="text-xs px-2 py-1 rounded bg-blue-600 text-white">Schedule</button>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-3">
                <h4 className="text-sm font-semibold mb-2">Selected Day Team Calendar</h4>
                <div className="space-y-2 max-h-44 overflow-auto">
                  {selectedDayTeamEvents.map((ev) => {
                    const member = (teamData.members || []).find((m) => m.id === ev.user_id);
                    return (
                      <div key={ev.id} className="text-xs border border-gray-200 rounded-lg p-2">
                        <div className="font-semibold">{member?.full_name || member?.username || "Member"}: {ev.title}</div>
                        <div className="text-gray-500">{new Date(ev.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(ev.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    );
                  })}
                  {selectedDayBusy.map((busy, idx) => {
                    const member = (teamData.members || []).find((m) => m.id === busy.user_id);
                    return (
                      <div key={`${busy.user_id}-${idx}`} className="text-xs border border-amber-200 bg-amber-50 rounded-lg p-2">
                        <div className="font-semibold">{member?.full_name || member?.username || "Member"}: Busy Block</div>
                        <div className="text-amber-700">{new Date(busy.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(busy.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </AppShell>
  );
}
