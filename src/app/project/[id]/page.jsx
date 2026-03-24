"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageLoader from "@/components/PageLoader";

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
  const [workspaceError, setWorkspaceError] = useState("");
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [deadlines, setDeadlines] = useState([]);
  const [deadlineLoading, setDeadlineLoading] = useState(false);
  const [deadlineError, setDeadlineError] = useState("");
  const [deadlineWorkflows, setDeadlineWorkflows] = useState([]);
  const [deadlineMembers, setDeadlineMembers] = useState([]);
  const [deadlineTitle, setDeadlineTitle] = useState("");
  const [deadlineDueDate, setDeadlineDueDate] = useState("");
  const [deadlineAssignee, setDeadlineAssignee] = useState("");
  const [deadlineWorkflowId, setDeadlineWorkflowId] = useState("");
  const [creatingDeadline, setCreatingDeadline] = useState(false);
  const [updatingDeadlineId, setUpdatingDeadlineId] = useState(null);
  const [deletingDeadlineId, setDeletingDeadlineId] = useState(null);
  const [editingDeadlineId, setEditingDeadlineId] = useState(null);
  const [deadlineDrafts, setDeadlineDrafts] = useState({});
  const [showCreateFlowModal, setShowCreateFlowModal] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [newFlowDesc, setNewFlowDesc] = useState("");
  const [newFlowDeadline, setNewFlowDeadline] = useState("");
  const [newFlowDeadlineTime, setNewFlowDeadlineTime] = useState("09:00");
  const [selectedFlowMembers, setSelectedFlowMembers] = useState([]);
  const [newFlowParentId, setNewFlowParentId] = useState(null);

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
      const isoDeadlineDate = (newFlowDeadline || "").trim();
      const hasValidDeadlineDate = /^\d{4}-\d{2}-\d{2}$/.test(isoDeadlineDate);
      const isoDeadline = hasValidDeadlineDate ? `${isoDeadlineDate}T${newFlowDeadlineTime || "09:00"}` : "";

      const workflowRes = await fetch(`/api/projects/${id}/workflows`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newFlowName,
          description: newFlowDesc,
          member_ids: selectedFlowMembers,
          parent_id: newFlowParentId,
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
      // 3. Optionally create a deadline when both assignee and due date are available
      const deadlineAssignee = members.find((m) => m.id === selectedFlowMembers[0]);
      if (deadlineAssignee && isoDeadline) {
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
      setNewFlowParentId(null);
      // Optionally, refetch workspaces
      setWorkspaceLoading(true);
      setWorkspaceError("");
      fetch(`/api/projects/${id}/workflows`, { credentials: "include" })
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Failed to load workspace flows");
          }
          return res.json();
        })
        .then((data) => setWorkspaces(Array.isArray(data) ? data : []))
        .catch((err) => {
          setWorkspaceError(err.message || "Failed to load workspace flows");
          setWorkspaces([]);
        })
        .finally(() => setWorkspaceLoading(false));
    } catch (err) {
      alert("Failed to create workspace flow: " + err.message);
    }
  };

  const loadDeadlinesForWorkflows = async (workflows) => {
    if (!Array.isArray(workflows) || workflows.length === 0) {
      setDeadlines([]);
      return;
    }

    const allDeadlines = await Promise.all(
      workflows.map(async (ws) => {
        const response = await fetch(`/api/workflows/${ws.id}/deadlines`, {
          credentials: "include",
        });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data.map((dl) => ({ ...dl, workflow: ws })) : [];
      })
    );

    setDeadlines(allDeadlines.flat());
  };

  useEffect(() => {
    if (!showDeadlineModal || !id) return;

    const loadDeadlineData = async () => {
      setDeadlineLoading(true);
      setDeadlineError("");

      try {
        const [workflowRes, memberRes] = await Promise.all([
          fetch(`/api/projects/${id}/workflows`, { credentials: "include" }),
          fetch(`/api/projects/${id}/members`, { credentials: "include" }),
        ]);

        if (!workflowRes.ok) {
          const errorData = await workflowRes.json().catch(() => ({}));
          throw new Error(errorData.detail || "Failed to load workflows");
        }

        const workflows = await workflowRes.json();
        const safeWorkflows = Array.isArray(workflows) ? workflows : [];
        setDeadlineWorkflows(safeWorkflows);

        let safeMembers = Array.isArray(members) ? members : [];
        if (memberRes.ok) {
          const memberData = await memberRes.json();
          safeMembers = Array.isArray(memberData) ? memberData : [];
          setMembers(safeMembers);
        }
        setDeadlineMembers(safeMembers);

        setDeadlineWorkflowId((prev) =>
          prev && safeWorkflows.some((wf) => wf.id === prev)
            ? prev
            : safeWorkflows[0]?.id || ""
        );

        setDeadlineAssignee((prev) =>
          prev && safeMembers.some((member) => member.username === prev)
            ? prev
            : safeMembers[0]?.username || ""
        );

        if (!deadlineDueDate) {
          setDeadlineDueDate(formatDateKey(new Date()));
        }

        await loadDeadlinesForWorkflows(safeWorkflows);
      } catch (error) {
        setDeadlineError(error.message || "Failed to load deadlines");
        setDeadlines([]);
        setDeadlineWorkflows([]);
      } finally {
        setDeadlineLoading(false);
      }
    };

    loadDeadlineData();
  }, [showDeadlineModal, id]);

  const handleCreateDeadline = async (event) => {
    event.preventDefault();
    setDeadlineError("");

    if (!deadlineWorkflowId) {
      setDeadlineError("Please choose a workflow.");
      return;
    }
    if (!deadlineTitle.trim()) {
      setDeadlineError("Please enter a deadline title.");
      return;
    }
    if (!deadlineDueDate) {
      setDeadlineError("Please choose a due date.");
      return;
    }
    if (!deadlineAssignee) {
      setDeadlineError("Please choose an assignee.");
      return;
    }

    setCreatingDeadline(true);
    try {
      const response = await fetch(`/api/workflows/${deadlineWorkflowId}/deadlines`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: deadlineTitle.trim(),
          due_date: `${deadlineDueDate}T09:00`,
          assigned_to: deadlineAssignee,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create deadline");
      }

      setDeadlineTitle("");
      await loadDeadlinesForWorkflows(deadlineWorkflows);
    } catch (error) {
      setDeadlineError(error.message || "Failed to create deadline");
    } finally {
      setCreatingDeadline(false);
    }
  };

  const handleDeadlineStatusChange = async (deadline, status) => {
    setUpdatingDeadlineId(deadline.id);
    setDeadlineError("");

    try {
      const response = await fetch(`/api/workflows/${deadline.workflow?.id}/deadlines/${deadline.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update deadline status");
      }

      setDeadlines((prev) =>
        prev.map((item) => (item.id === deadline.id ? { ...item, status } : item))
      );
    } catch (error) {
      setDeadlineError(error.message || "Failed to update deadline status");
    } finally {
      setUpdatingDeadlineId(null);
    }
  };

  const handleDeleteDeadline = async (deadline) => {
    if (!window.confirm(`Delete deadline \"${deadline.title}\"?`)) return;

    setDeletingDeadlineId(deadline.id);
    setDeadlineError("");

    try {
      const response = await fetch(`/api/workflows/${deadline.workflow?.id}/deadlines/${deadline.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to delete deadline");
      }

      setDeadlines((prev) => prev.filter((item) => item.id !== deadline.id));
    } catch (error) {
      setDeadlineError(error.message || "Failed to delete deadline");
    } finally {
      setDeletingDeadlineId(null);
    }
  };

  const startDeadlineEdit = (deadline) => {
    setEditingDeadlineId(deadline.id);
    setDeadlineDrafts((prev) => ({
      ...prev,
      [deadline.id]: {
        title: deadline.title || "",
        due_date: deadline.due_date ? String(deadline.due_date).slice(0, 10) : "",
        assigned_to: deadline.assigned_to || "",
      },
    }));
  };

  const handleDeadlineDraftChange = (deadlineId, field, value) => {
    setDeadlineDrafts((prev) => ({
      ...prev,
      [deadlineId]: {
        ...(prev[deadlineId] || {}),
        [field]: value,
      },
    }));
  };

  const saveDeadlineEdit = async (deadline) => {
    const draft = deadlineDrafts[deadline.id];
    if (!draft) return;

    setUpdatingDeadlineId(deadline.id);
    setDeadlineError("");

    try {
      const response = await fetch(`/api/workflows/${deadline.workflow?.id}/deadlines/${deadline.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: (draft.title || "").trim(),
          due_date: draft.due_date ? `${draft.due_date}T09:00` : null,
          assigned_to: draft.assigned_to || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to save deadline changes");
      }

      setDeadlines((prev) =>
        prev.map((item) =>
          item.id === deadline.id
            ? {
                ...item,
                title: (draft.title || item.title).trim(),
                due_date: draft.due_date ? `${draft.due_date}T09:00` : item.due_date,
                assigned_to: draft.assigned_to || item.assigned_to,
              }
            : item
        )
      );

      setEditingDeadlineId(null);
    } catch (error) {
      setDeadlineError(error.message || "Failed to save deadline changes");
    } finally {
      setUpdatingDeadlineId(null);
    }
  };

  const deadlineMemberMap = deadlineMembers.reduce((acc, member) => {
    acc[member.username] = member;
    return acc;
  }, {});

  const deadlineStatusLabel = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
  };

  // Fetch workspaces when modal opens
  useEffect(() => {
    if (!showWorkspaceModal || !id) return;
    setWorkspaceLoading(true);
    setWorkspaceError("");
    fetch(`/api/projects/${id}/workflows`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to load workspace flows");
        }
        return res.json();
      })
      .then(data => setWorkspaces(Array.isArray(data) ? data : []))
      .catch((err) => {
        setWorkspaceError(err.message || "Failed to load workspace flows");
        setWorkspaces([]);
      })
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

  const handleWorkspaceStatusChange = async (workspaceId, newStatus) => {
    try {
      const res = await fetch(`/api/workflows/${workspaceId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setWorkspaces(prev => prev.map(ws => ws.id === workspaceId ? { ...ws, status: newStatus } : ws));
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  const renderWorkflowTree = (parentId = null, level = 0) => {
    const children = workspaces.filter(ws => (ws.parent_id || null) === parentId);
    if (children.length === 0) return null;
    return children.map((ws, idx) => (
      <div key={ws.id} className="w-full flex flex-col mb-3">
        <div 
          className="w-full min-h-[56px] py-2 bg-stone-500 rounded-[14px] flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-4 gap-3 relative" 
          style={{ marginLeft: `${level * 24}px`, width: `calc(100% - ${level * 24}px)` }}
        >
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden min-w-[40%]">
            <div className="shrink-0 w-7 h-7 bg-zinc-300 rounded-[14px] flex items-center justify-center text-black text-base font-['Habibi']">{idx + 1}</div>
            <div className="text-white text-sm sm:text-base font-normal font-['Habibi'] truncate" title={ws.name}>Flow: {ws.name}</div>
            <div className="hidden md:block text-white text-[13px] font-normal font-['Habibi'] shrink-0">{ws.created_at ? new Date(ws.created_at).toLocaleDateString("en-GB") : "-"}</div>
          </div>
          <div className="flex items-center justify-end gap-2 shrink-0 flex-wrap">
            <select
              value={ws.status || "in_process"}
              onChange={(e) => handleWorkspaceStatusChange(ws.id, e.target.value)}
              className="bg-stone-600 text-white text-[12px] sm:text-[13px] rounded px-1 sm:px-2 py-1 outline-none border border-stone-400 max-w-[100px] sm:max-w-none"
            >
              <option value="in_process">In process</option>
              <option value="pause">Pause</option>
              <option value="completed">Completed</option>
            </select>
            {level < 5 && (
              <button
                className="px-2 h-6 bg-zinc-200 rounded-md flex items-center justify-center text-black text-[11px] sm:text-xs font-bold hover:bg-zinc-100 whitespace-nowrap"
                onClick={() => {
                  setNewFlowParentId(ws.id);
                  if (!newFlowDeadline) setNewFlowDeadline(formatDateKey(new Date()));
                  setNewFlowDeadlineTime(prev => prev || "09:00");
                  setShowCreateFlowModal(true);
                }}
                title="Create Sub-Flow"
              >
                + Sub-flow
              </button>
            )}
          </div>
        </div>
        {renderWorkflowTree(ws.id, level + 1)}
      </div>
    ));
  };

  if (loading || userLoading) {
    return (
      <AppShell user={currentUser} activePath="/project" contentClassName="flex-1">
        <PageLoader label="Loading..." />
      </AppShell>
    );
  }
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
        </div>
      {/* Deadlines Modal */}
      {showDeadlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4">
          <div className="relative w-full max-w-4xl h-auto max-h-[90dvh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="w-full h-14 px-6 bg-white border-b border-black/10 flex items-center justify-between">
              <span className="text-neutral-950 text-lg font-bold font-['Arimo']">Manager Deadlines</span>
              <button
                className="text-2xl text-gray-400 hover:text-gray-700"
                onClick={() => {
                  setShowDeadlineModal(false);
                  setEditingDeadlineId(null);
                  setDeadlineError("");
                }}
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 bg-slate-50/60">
              {deadlineError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {deadlineError}
                </div>
              )}

              <form
                onSubmit={handleCreateDeadline}
                className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm"
              >
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Create Deadline</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
                    placeholder="Deadline title"
                    value={deadlineTitle}
                    onChange={(event) => setDeadlineTitle(event.target.value)}
                    disabled={creatingDeadline || deadlineWorkflows.length === 0}
                    required
                  />
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
                    value={deadlineDueDate}
                    onChange={(event) => setDeadlineDueDate(event.target.value)}
                    disabled={creatingDeadline || deadlineWorkflows.length === 0}
                    required
                  />
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
                    value={deadlineWorkflowId}
                    onChange={(event) => setDeadlineWorkflowId(event.target.value)}
                    disabled={creatingDeadline || deadlineWorkflows.length === 0}
                    required
                  >
                    {deadlineWorkflows.length === 0 && <option value="">No workflows</option>}
                    {deadlineWorkflows.map((workflow) => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
                    value={deadlineAssignee}
                    onChange={(event) => setDeadlineAssignee(event.target.value)}
                    disabled={creatingDeadline || deadlineMembers.length === 0}
                    required
                  >
                    {deadlineMembers.length === 0 && <option value="">No members</option>}
                    {deadlineMembers.map((member) => (
                      <option key={member.id} value={member.username}>
                        {member.full_name || member.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={creatingDeadline || deadlineWorkflows.length === 0 || deadlineMembers.length === 0}
                    className="px-4 py-2 rounded-md bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingDeadline ? "Creating..." : "Create Deadline"}
                  </button>
                </div>
              </form>

              {deadlineLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                  Loading deadlines...
                </div>
              ) : deadlines.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                  No deadlines found for this project.
                </div>
              ) : (
                <div className="space-y-3">
                  {deadlines.map((deadline) => {
                    const isEditing = editingDeadlineId === deadline.id;
                    const draft = deadlineDrafts[deadline.id] || {};
                    const assigneeProfile = deadlineMemberMap[deadline.assigned_to || ""];

                    return (
                      <div key={deadline.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        {isEditing ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                            <input
                              type="text"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
                              value={draft.title || ""}
                              onChange={(event) =>
                                handleDeadlineDraftChange(deadline.id, "title", event.target.value)
                              }
                            />
                            <input
                              type="date"
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
                              value={draft.due_date || ""}
                              onChange={(event) =>
                                handleDeadlineDraftChange(deadline.id, "due_date", event.target.value)
                              }
                            />
                            <select
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
                              value={draft.assigned_to || ""}
                              onChange={(event) =>
                                handleDeadlineDraftChange(deadline.id, "assigned_to", event.target.value)
                              }
                            >
                              {deadlineMembers.map((member) => (
                                <option key={member.id} value={member.username}>
                                  {member.full_name || member.username}
                                </option>
                              ))}
                            </select>
                            <select
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
                              value={deadline.status || "pending"}
                              onChange={(event) =>
                                handleDeadlineStatusChange(deadline, event.target.value)
                              }
                              disabled={updatingDeadlineId === deadline.id}
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                        ) : (
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                            <div>
                              <div className="text-base font-semibold text-slate-900">{deadline.title}</div>
                              <div className="text-xs sm:text-sm text-slate-600 mt-1">
                                Workflow: {deadline.workflow?.name || "Unknown"}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-700">
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                                Due: {deadline.due_date ? new Date(deadline.due_date).toLocaleDateString("en-GB") : "-"}
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                                Assignee: {assigneeProfile?.full_name || deadline.assigned_to || "-"}
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white">
                                {deadlineStatusLabel[deadline.status] || "Pending"}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-md border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => setEditingDeadlineId(null)}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-md bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50"
                                onClick={() => saveDeadlineEdit(deadline)}
                                disabled={updatingDeadlineId === deadline.id}
                              >
                                {updatingDeadlineId === deadline.id ? "Saving..." : "Save"}
                              </button>
                            </>
                          ) : (
                            <>
                              <select
                                className="rounded-md border border-gray-300 px-2 py-1.5 text-sm text-black"
                                value={deadline.status || "pending"}
                                onChange={(event) => handleDeadlineStatusChange(deadline, event.target.value)}
                                disabled={updatingDeadlineId === deadline.id}
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-md border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => startDeadlineEdit(deadline)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-md border border-red-200 text-red-700 text-sm hover:bg-red-50 disabled:opacity-50"
                                onClick={() => handleDeleteDeadline(deadline)}
                                disabled={deletingDeadlineId === deadline.id}
                              >
                                {deletingDeadlineId === deadline.id ? "Deleting..." : "Delete"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-4 bg-white flex justify-end">
              <button
                className="px-4 py-2 bg-black rounded-md text-white text-sm hover:bg-gray-800"
                onClick={() => {
                  setShowDeadlineModal(false);
                  setEditingDeadlineId(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Manage Workspace Modal */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4">
          <div className="relative w-full max-w-4xl h-auto max-h-[90dvh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="w-full h-14 px-6 bg-white/60 border-b border-black/10 flex items-center justify-between">
              <span className="text-neutral-950 text-lg font-bold font-['Arimo']">Workspace</span>
              <button className="text-2xl text-gray-400 hover:text-gray-700" onClick={() => setShowWorkspaceModal(false)}>&times;</button>
            </div>
            {/* Modal Content */}
            <div className="flex-1 bg-white flex flex-col items-center pt-6">
              <div className="w-full flex flex-col items-center">
                <div className="w-full max-w-3xl min-h-[240px] max-h-[56dvh] bg-zinc-300 rounded-[16px] mx-auto relative p-4 overflow-y-auto">
                  {workspaceError && (
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {workspaceError}
                    </div>
                  )}
                  {workspaceLoading ? (
                    <div className="text-center text-gray-500 text-base mt-16">Loading workspace flows...</div>
                  ) : workspaces.length === 0 ? (
                    <div className="text-center text-gray-500 text-base mt-16">No workspace flows found.</div>
                  ) : (
                    renderWorkflowTree(null, 0)
                  )}
                  {/* Create Flow Button */}
                  <button
                    className="mt-6 w-full h-12 bg-stone-400 rounded-[14px] flex items-center justify-center text-white text-base font-normal font-['Habibi'] hover:bg-stone-500 transition"
                    onClick={() => {
                      setNewFlowParentId(null);
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
                <button type="button" onClick={() => setShowWorkspaceModal(false)} className="mt-8 mb-6 w-40 h-10 bg-gray-950 rounded-md flex items-center justify-center hover:bg-gray-800 transition">
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
          <div className="flex flex-col gap-4 max-h-[50dvh] overflow-y-auto pr-2">
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
