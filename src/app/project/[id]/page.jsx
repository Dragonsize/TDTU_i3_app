"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";

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

function DateDropdown({ value, onChange }) {
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
        className="w-full h-[40px] rounded-md px-3 text-sm text-left flex items-center justify-between border border-gray-300 bg-white text-black"
      >
        <span>{formatDateButtonLabel(value)}</span>
        <span className="text-gray-500">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 mt-1 w-[280px] rounded-lg shadow-xl z-40 p-3 bg-white border border-gray-300">
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1))}
              className="w-7 h-7 rounded-full text-slate-700 hover:bg-slate-100"
            >
              ‹
            </button>
            <div className="text-sm font-medium text-slate-900">
              {displayMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
            <button
              type="button"
              onClick={() => setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1))}
              className="w-7 h-7 rounded-full text-slate-700 hover:bg-slate-100"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {["M", "T", "W", "T", "F", "S", "S"].map((label, idx) => (
              <div key={`${label}-${idx}`} className="text-center text-xs py-1 text-slate-500">
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
                    isSelected
                      ? "bg-[#1a73e8] text-white font-semibold"
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

function TimeDropdown({ value, onChange }) {
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
        className="w-full h-[40px] rounded-md px-3 text-sm text-left flex items-center justify-between border border-gray-300 bg-white text-black"
      >
        <span>{formatTimeLabel(value)}</span>
        <span className="text-gray-500">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-md shadow-xl z-40 bg-white border border-slate-300">
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
                  active
                    ? "bg-[#e8f0fe] text-[#1a73e8] font-semibold"
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


export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id;
  const router = typeof window !== "undefined" ? require('next/navigation').useRouter() : null;
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [deadlines, setDeadlines] = useState([]);
  const [deadlineLoading, setDeadlineLoading] = useState(false);
  const [showCreateFlowModal, setShowCreateFlowModal] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDesc, setNewFlowDesc] = useState("");
  const [newFlowDeadline, setNewFlowDeadline] = useState("");
  const [newFlowDeadlineTime, setNewFlowDeadlineTime] = useState("09:00");
  const [selectedFlowMembers, setSelectedFlowMembers] = useState([]);

  const handleFlowMemberToggle = (memberId, checked) => {
    if (checked) {
      setSelectedFlowMembers((prev) => [...prev, memberId]);
    } else {
      setSelectedFlowMembers((prev) => prev.filter((id) => id !== memberId));
    }
  };

  const handleCreateFlowSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedFlowMembers.length === 0) {
        alert("You must assign at least one member to the flow.");
        return;
      }

      const isoDeadlineDate = (newFlowDeadline || "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDeadlineDate)) {
        alert("Please choose a deadline date.");
        return;
      }
      const isoDeadline = `${isoDeadlineDate}T${newFlowDeadlineTime || "09:00"}`;

      const workflowRes = await fetch(`/api/projects/${id}/workflows`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newFlowName,
          description: newFlowDesc
        }),
      });

      if (!workflowRes.ok) {
        const errData = await workflowRes.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to create workflow");
      }
      const workflow = await workflowRes.json();
      // 2. Assign members
      for (const memberId of selectedFlowMembers) {
        const member = members.find((m) => m.id === memberId);
        if (!member) continue;
        const assignRes = await fetch(`/api/workflows/${workflow.id}/members`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: member.username, role: member.role || "member" }),
        });
        if (!assignRes.ok) {
          const errData = await assignRes.json().catch(() => ({}));
          throw new Error(errData.detail || `Failed to assign ${member.username}`);
        }
      }
      // 3. Create deadline (assign to lead or first member)
      const deadlineAssignee = members.find((m) => m.id === selectedFlowMembers[0]);
      if (deadlineAssignee) {
        const deadlineRes = await fetch(`/api/workflows/${workflow.id}/deadlines`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: `${newFlowName} Deadline`, due_date: isoDeadline, assigned_to: deadlineAssignee.username }),
        });
        if (!deadlineRes.ok) {
          const errData = await deadlineRes.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to create deadline");
        }
      }
      // 4. Refresh workspace list
      setShowCreateFlowModal(false);
      setNewFlowName("");
      setNewFlowDesc("");
      setNewFlowDeadline("");
      setNewFlowDeadlineTime("09:00");
      setSelectedFlowMembers([]);
      // Optionally, refetch workspaces
      setWorkspaceLoading(true);
      fetch(`/api/projects/${id}/workflows`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => setWorkspaces(Array.isArray(data) ? data : []))
        .catch(() => setWorkspaces([]))
        .finally(() => setWorkspaceLoading(false));
    } catch (err) {
      alert("Failed to create workspace flow: " + err.message);
    }
  };

  // Fetch deadlines for all workflows in this project when modal opens
  useEffect(() => {
    if (!showDeadlineModal || !id) return;
    setDeadlineLoading(true);
    // Fetch all workflows for this project
    fetch(`/api/projects/${id}/workflows`, { credentials: "include" })
      .then(res => res.json())
      .then(async (workflows) => {
        if (!Array.isArray(workflows) || workflows.length === 0) {
          setDeadlines([]);
          return;
        }
        // For each workflow, fetch its deadlines
        const allDeadlines = await Promise.all(
          workflows.map(async (ws) => {
            const res = await fetch(`/api/workflows/${ws.id}/deadlines`, { credentials: "include" });
            if (!res.ok) return [];
            const data = await res.json();
            // Attach workflow info to each deadline
            return Array.isArray(data) ? data.map(dl => ({ ...dl, workflow: ws })) : [];
          })
        );
        setDeadlines(allDeadlines.flat());
      })
      .catch(() => setDeadlines([]))
      .finally(() => setDeadlineLoading(false));
  }, [showDeadlineModal, id]);
  // Fetch workspaces when modal opens
  useEffect(() => {
    if (!showWorkspaceModal || !id) return;
    setWorkspaceLoading(true);
    fetch(`/api/projects/${id}/workflows`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setWorkspaces(Array.isArray(data) ? data : []))
      .catch(() => setWorkspaces([]))
      .finally(() => setWorkspaceLoading(false));
  }, [showWorkspaceModal, id]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        // Fetch user profile for header and auth
        const profileRes = await fetch("/api/profile", { credentials: "include" });
        const profileData = await profileRes.json();
        if (profileData.profile) {
          setCurrentUser(profileData.profile);
        } else {
          if (router) router.push("/login");
          return;
        }
        setUserLoading(false);

        // Fetch project and members
        const [projRes, memRes] = await Promise.all([
          fetch(`/api/projects/${id}`, { credentials: "include" }),
          fetch(`/api/projects/${id}/members`, { credentials: "include" })
        ]);

        if (projRes.ok && memRes.ok) {
          const projData = await projRes.json();
          const memData = await memRes.json();
          setProject(projData);
          setMembers(memData);
        }
      } catch (error) {
        if (router) router.push("/login");
        console.error("Error loading project:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading || userLoading) return <div className="min-h-[100dvh] flex items-center justify-center px-4 text-center">Loading...</div>;
  if (!project) return <div className="min-h-[100dvh] flex items-center justify-center px-4 text-center">Project not found.</div>;

  return (
    <AppShell user={currentUser} activePath="/project" contentClassName="flex-1">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-8 sm:py-10 lg:py-12">
        {/* Project Info */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal font-['Habibi'] text-neutral-950 mb-6 sm:mb-8 break-words">{project.title}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            <div className="flex flex-col gap-2">
              <span className="text-black text-2xl font-normal font-['Habibi']">Day Create</span>
              <span className="text-black text-xl font-normal font-['Habibi'] text-gray-600">
                {project.created_at ? new Date(project.created_at).toLocaleDateString("en-GB") : "-"}
              </span>
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-black text-2xl font-normal font-['Habibi']">Status</span>
              <span className="text-black text-xl font-normal font-['Habibi'] text-gray-600">
                {project.status === "active" ? "In process" : project.status}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-black text-2xl font-normal font-['Arimo']">Created by</span>
              <span className="text-black text-base font-normal font-['Arimo'] text-gray-600">
                {project.creator?.full_name || project.creator?.username || "Unknown"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            className="px-6 py-3 bg-black rounded-md text-white text-base font-normal font-['Arimo'] hover:bg-gray-800 transition"
            onClick={() => setShowWorkspaceModal(true)}
          >
            Manage workspace
          </button>
          <button
            className="px-6 py-3 bg-black rounded-md text-white text-base font-normal font-['Arimo'] hover:bg-gray-800 transition"
            onClick={() => setShowDeadlineModal(true)}
          >
            Manager Deadline
          </button>
              {/* Deadlines Modal */}
              {showDeadlineModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4">
                  <div className="relative w-full max-w-[540px] h-auto max-h-[90dvh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="w-full h-14 px-6 bg-white/60 border-b border-black/10 flex items-center justify-between">
                      <span className="text-neutral-950 text-lg font-bold font-['Arimo']">Deadlines</span>
                      <button className="text-2xl text-gray-400 hover:text-gray-700" onClick={() => setShowDeadlineModal(false)}>&times;</button>
                    </div>
                    {/* Modal Content */}
                    <div className="flex-1 bg-white flex flex-col items-center pt-6">
                      <div className="w-full flex flex-col items-center">
                        <div className="w-full max-w-[420px] min-h-[240px] max-h-[56dvh] bg-zinc-300 rounded-[16px] mx-auto relative p-4 overflow-y-auto">
                          {deadlineLoading ? (
                            <div className="text-center text-gray-500 text-base mt-16">Loading deadlines...</div>
                          ) : deadlines.length === 0 ? (
                            <div className="text-center text-gray-500 text-base mt-16">No deadlines found.</div>
                          ) : (
                            deadlines.map((dl, idx) => (
                              <div key={dl.id || idx} className="w-full h-14 mb-3 bg-stone-500 rounded-[14px] flex items-center px-4 relative">
                                <div className="flex-1 flex flex-row items-center gap-4">
                                  <div className="w-7 h-7 bg-zinc-300 rounded-[14px] flex items-center justify-center text-black text-base font-['Habibi']">{idx + 1}</div>
                                  <div className="text-white text-base font-normal font-['Habibi'] truncate max-w-[120px]">{dl.title}</div>
                                  <div className="text-white text-base font-normal font-['Habibi']">{dl.due_date ? new Date(dl.due_date).toLocaleDateString("en-GB") : "-"}</div>
                                  <div className="text-white text-base font-normal font-['Habibi']">{dl.status || "Pending"}</div>
                                </div>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                  <button className="w-6 h-6 bg-zinc-300 rounded-full flex items-center justify-center text-black text-lg font-['Habibi']">...</button>
                                </div>
                              </div>
                            ))
                          )}
                          {/* Create Deadline Button */}
                          <button className="mt-6 w-full h-12 bg-stone-400 rounded-[14px] flex items-center justify-center text-white text-base font-normal font-['Habibi'] hover:bg-stone-500 transition">
                            + Create Deadline
                          </button>
                        </div>
                        <button className="mt-8 w-40 h-10 bg-gray-950 rounded-md flex items-center justify-center">
                          <span className="text-white text-base font-normal font-['Arimo']">Finish</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
        </div>
      {/* Manage Workspace Modal */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4">
          <div className="relative w-full max-w-[540px] h-auto max-h-[90dvh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="w-full h-14 px-6 bg-white/60 border-b border-black/10 flex items-center justify-between">
              <span className="text-neutral-950 text-lg font-bold font-['Arimo']">Workspace</span>
              <button className="text-2xl text-gray-400 hover:text-gray-700" onClick={() => setShowWorkspaceModal(false)}>&times;</button>
            </div>
            {/* Modal Content */}
            <div className="flex-1 bg-white flex flex-col items-center pt-6">
              <div className="w-full flex flex-col items-center">
                <div className="w-full max-w-[420px] min-h-[240px] max-h-[56dvh] bg-zinc-300 rounded-[16px] mx-auto relative p-4 overflow-y-auto">
                  {workspaceLoading ? (
                    <div className="text-center text-gray-500 text-base mt-16">Loading workspace flows...</div>
                  ) : workspaces.length === 0 ? (
                    <div className="text-center text-gray-500 text-base mt-16">No workspace flows found.</div>
                  ) : (
                    workspaces.map((ws, idx) => (
                      <div key={ws.id} className="w-full h-14 mb-3 bg-stone-500 rounded-[14px] flex items-center px-4 relative">
                        <div className="flex-1 flex flex-row items-center gap-4">
                          <div className="w-7 h-7 bg-zinc-300 rounded-[14px] flex items-center justify-center text-black text-base font-['Habibi']">{idx + 1}</div>
                          <div className="text-white text-base font-normal font-['Habibi'] truncate max-w-[120px]">Flow: {ws.name}</div>
                          <div className="text-white text-base font-normal font-['Habibi']">{ws.created_at ? new Date(ws.created_at).toLocaleDateString("en-GB") : "-"}</div>
                          <div className="text-white text-base font-normal font-['Habibi']">{ws.status || "In process"}</div>
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <button className="w-6 h-6 bg-zinc-300 rounded-full flex items-center justify-center text-black text-lg font-['Habibi']">...</button>
                        </div>
                      </div>
                    ))
                  )}
                  {/* Create Flow Button */}
                  <button
                    className="mt-6 w-full h-12 bg-stone-400 rounded-[14px] flex items-center justify-center text-white text-base font-normal font-['Habibi'] hover:bg-stone-500 transition"
                    onClick={() => {
                      if (!newFlowDeadline) {
                        setNewFlowDeadline(formatDateKey(new Date()));
                      }
                      setNewFlowDeadlineTime((prev) => prev || "09:00");
                      setShowCreateFlowModal(true);
                    }}
                  >
                    + Create Flow
                  </button>
                      {/* Create Flow Modal */}
                      {showCreateFlowModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4">
                          <div className="relative w-full max-w-[480px] h-auto max-h-[90dvh] bg-white rounded-2xl shadow-2xl overflow-visible flex flex-col">
                            {/* Header */}
                            <div className="w-full h-14 px-6 bg-white/60 border-b border-black/10 flex items-center justify-between">
                              <span className="text-neutral-950 text-lg font-bold font-['Arimo']">Create Workspace Flow</span>
                              <button className="text-2xl text-gray-400 hover:text-gray-700" onClick={() => setShowCreateFlowModal(false)}>&times;</button>
                            </div>
                            {/* Modal Content */}
                            <form className="flex-1 bg-white flex flex-col items-center pt-6 px-6" onSubmit={handleCreateFlowSubmit}>
                              <div className="w-full flex flex-col gap-4">
                                <label className="text-black text-base font-normal font-['Arimo']">Flow Name</label>
                                <input type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-black" value={newFlowName} onChange={e => setNewFlowName(e.target.value)} required />
                                <label className="text-black text-base font-normal font-['Arimo']">Description</label>
                                <textarea className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-black" value={newFlowDesc} onChange={e => setNewFlowDesc(e.target.value)} />
                                <label className="text-black text-base font-normal font-['Arimo']">Deadline</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <DateDropdown
                                    value={newFlowDeadline}
                                    onChange={setNewFlowDeadline}
                                  />
                                  <TimeDropdown
                                    value={newFlowDeadlineTime}
                                    onChange={setNewFlowDeadlineTime}
                                  />
                                </div>
                                <label className="text-black text-base font-normal font-['Arimo']">Assign Members</label>
                                <div className="w-full flex flex-col gap-2">
                                  {members.map(member => (
                                    <label key={member.id} className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={selectedFlowMembers.includes(member.id)}
                                        onChange={e => handleFlowMemberToggle(member.id, e.target.checked)}
                                      />
                                      <span className="text-black text-base font-normal font-['Arimo']">{member.full_name || member.username} ({member.username})</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              <button type="submit" className="mt-6 w-full h-12 bg-black rounded-md flex items-center justify-center text-white text-base font-normal font-['Arimo'] hover:bg-gray-800 transition">Finish</button>
                            </form>
                          </div>
                        </div>
                      )}
                </div>
                <button className="mt-8 w-40 h-10 bg-gray-950 rounded-md flex items-center justify-center">
                  <span className="text-white text-base font-normal font-['Arimo']">Finish</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Member List */}
        <div className="bg-zinc-300 rounded-2xl p-4 sm:p-6 min-h-[320px]">
          <div className="text-white text-2xl font-bold mb-6 px-2">Members</div>
          <div className="flex flex-col gap-4">
            {members.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">No members found</div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="w-full bg-stone-500 rounded-2xl flex items-center px-4 sm:px-8 py-3 sm:py-4 relative">
                  <div className="text-black text-base sm:text-xl md:text-2xl font-normal font-['ABeeZee'] break-words">
                    {member.full_name || member.username} 
                    <span className="text-lg opacity-70 ml-2">({member.username})</span>
                    {member.role && <span className="text-sm ml-2 opacity-60 uppercase">- {member.role}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
