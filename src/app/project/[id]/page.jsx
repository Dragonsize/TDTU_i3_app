"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppShell from "@/components/AppShell";
import PageLoader from "@/components/PageLoader";
import DateDropdown from "@/components/DateDropdown";
import TimeDropdown from "@/components/TimeDropdown";
import StatusBadge, { STATUS_CONFIG } from "@/components/StatusBadge";
import { dFetch } from "@/lib/api";
import { formatDateKey } from "@/lib/utils";
import {
  FolderOpen, Plus, CalendarDays, Clock, CheckCircle2, PauseCircle, Loader2,
  X, Check, Calendar, Users, ChevronRight, AlertCircle,
  LayoutGrid, Flag, Target, Sparkles, GitBranch, Layers, UserCheck,
  Calendar as CalendarIcon, Trash2, Pencil, MoreHorizontal
} from "lucide-react";

function DeadlineStatusBadge({ status }) {
  const configs = {
    pending: { label: "Pending", icon: Clock, color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400", gradient: "from-amber-50 to-amber-100 dark:from-amber-900/10 dark:to-amber-900/20" },
    in_progress: { label: "In Progress", icon: Loader2, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400", gradient: "from-blue-50 to-blue-100 dark:from-blue-900/10 dark:to-blue-900/20" },
    completed: { label: "Completed", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400", gradient: "from-emerald-50 to-emerald-100 dark:from-emerald-900/10 dark:to-emerald-900/20" },
  };
  const cfg = configs[status] || configs.pending;
  const Icon = cfg.icon;
  return (
    <motion.span
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium bg-gradient-to-r ${cfg.gradient} ${cfg.color} border border-black/5 dark:border-white/5`}
    >
      <Icon className={`w-3 h-3 ${status === 'in_progress' ? 'animate-spin' : ''}`} />
      {cfg.label}
    </motion.span>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
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
  const [flowCreateError, setFlowCreateError] = useState("");
  const [hoveredWorkspace, setHoveredWorkspace] = useState(null);

  const isLead = useMemo(() => {
    if (!currentUser || members.length === 0) return false;
    const projectMember = members.find(m => m.id === currentUser.id);
    return projectMember && (projectMember.role === "lead" || projectMember.role === "admin");
  }, [currentUser, members]);

  const handleFlowMemberToggle = (memberId, checked) => {
    if (checked) {
      setSelectedFlowMembers((prev) => [...prev, memberId]);
    } else {
      setSelectedFlowMembers((prev) => prev.filter((id) => id !== memberId));
    }
  };

  const handleCreateFlowSubmit = async (e) => {
    e.preventDefault();
    setFlowCreateError("");
    if (!isLead) {
      setFlowCreateError("Failed to create workspace flow: Only lead can create flow!");
      return;
    }
    if (!selectedFlowMembers || selectedFlowMembers.length === 0) {
      setFlowCreateError("Please select at least one member for this flow!");
      return;
    }
    try {
      const isoDeadlineDate = (newFlowDeadline || "").trim();
      const hasValidDeadlineDate = /^\d{4}-\d{2}-\d{2}$/.test(isoDeadlineDate);
      const isoDeadline = hasValidDeadlineDate ? `${isoDeadlineDate}T${newFlowDeadlineTime || "09:00"}` : "";

      const workflowRes = await dFetch(`/api/projects/${id}/workflows`, {
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
      
      for (const memberId of selectedFlowMembers) {
        const member = members.find((m) => m.id === memberId);
        if (!member) continue;
        const assignRes = await dFetch(`/api/workflows/${workflow.id}/members`, {
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
      
      const deadlineAssigneeMember = members.find((m) => m.id === selectedFlowMembers[0]);
      if (deadlineAssigneeMember && isoDeadline) {
        const deadlineRes = await dFetch(`/api/workflows/${workflow.id}/deadlines`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: `${newFlowName} Deadline`, due_date: isoDeadline, assigned_to: deadlineAssigneeMember.username }),
        });
        if (!deadlineRes.ok) {
          const errData = await deadlineRes.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to create deadline");
        }
      }
      
      setShowCreateFlowModal(false);
      setNewFlowName("");
      setNewFlowDesc("");
      setNewFlowDeadline("");
      setNewFlowDeadlineTime("09:00");
      setSelectedFlowMembers([]);
      setNewFlowParentId(null);
      
      setWorkspaceLoading(true);
      setWorkspaceError("");
      dFetch(`/api/projects/${id}/workflows`, { credentials: "include" })
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Failed to load workspace flows");
          }
          return res.json();
        })
        .then((data) => setWorkspaces(Array.isArray(data) ? data : []))
        .catch((err) => {
          setWorkspaceError(err.message || "Failed to load updated workspace flows");
          setWorkspaces([]);
        })
        .finally(() => setWorkspaceLoading(false));
    } catch (err) {
      setFlowCreateError(err.message || "Failed to create flow");
    }
  };

  const loadDeadlinesForWorkflows = async (workflows) => {
    if (!Array.isArray(workflows) || workflows.length === 0) {
      setDeadlines([]);
      return;
    }

    const allDeadlines = await Promise.all(
      workflows.map(async (ws) => {
        const response = await dFetch(`/api/workflows/${ws.id}/deadlines`, {
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
          dFetch(`/api/projects/${id}/workflows`, { credentials: "include" }),
          dFetch(`/api/projects/${id}/members`, { credentials: "include" }),
        ]);

        if (!workflowRes.ok) {
          const errorData = await workflowRes.json().catch(() => ({}));
          throw new Error(errorData.detail || "Failed to load workflows");
        }

        const workflows = await workflowRes.json();
        const safeWorkflows = Array.isArray(workflows) ? workflows : [];
        setDeadlineWorkflows(safeWorkflows);

        let safeMembers = [];
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

        setDeadlineDueDate((prev) => prev || formatDateKey(new Date()));

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
      const response = await dFetch(`/api/workflows/${deadlineWorkflowId}/deadlines`, {
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
      const response = await dFetch(`/api/workflows/${deadline.workflow?.id}/deadlines/${deadline.id}`, {
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
    if (!window.confirm(`Delete deadline "${deadline.title}"?`)) return;

    setDeletingDeadlineId(deadline.id);
    setDeadlineError("");

    try {
      const response = await dFetch(`/api/workflows/${deadline.workflow?.id}/deadlines/${deadline.id}`, {
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
      const response = await dFetch(`/api/workflows/${deadline.workflow?.id}/deadlines/${deadline.id}`, {
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

  useEffect(() => {
    if (!showWorkspaceModal || !id) return;
    setWorkspaceLoading(true);
    setWorkspaceError("");
    dFetch(`/api/projects/${id}/workflows`, { credentials: "include" })
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
        // 1. Fetch profile and project data concurrently
        const [profileRes, projRes, memRes] = await Promise.all([
          dFetch("/api/profile", { credentials: "include" }),
          dFetch(`/api/projects/${id}`, { credentials: "include" }),
          dFetch(`/api/projects/${id}/members`, { credentials: "include" })
        ]);

        // 2. Handle Profile
        const profileData = await profileRes.json();
        if (profileData.profile) {
          setCurrentUser(profileData.profile);
        } else {
          router.push("/login");
          return;
        }
        setUserLoading(false);

        // 3. Handle Project & Members
        if (projRes.ok && memRes.ok) {
          const projData = await projRes.json();
          const memData = await memRes.json();
          setProject(projData);
          setMembers(memData);
        }
      } catch (error) {
        console.error("Error loading project:", error);
        // Don't redirect immediately on every error, maybe only on 401 which is handled by dFetch
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  const handleWorkspaceStatusChange = async (workspaceId, newStatus) => {
    try {
      const res = await dFetch(`/api/workflows/${workspaceId}`, {
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

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddMemberError("");
    if (!newMemberUsername.trim()) {
      setAddMemberError("Please enter a username");
      return;
    }

    setAddingMember(true);
    try {
      const res = await dFetch(`/api/projects/${id}/members`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_username: newMemberUsername.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to add member");
      }

      // Reload members
      const memRes = await dFetch(`/api/projects/${id}/members`, { credentials: "include" });
      if (memRes.ok) {
        const memData = await memRes.json();
        setMembers(memData);
      }

      setNewMemberUsername("");
      setShowAddMemberForm(false);
    } catch (err) {
      setAddMemberError(err.message);
    } finally {
      setAddingMember(false);
    }
  };

  const handleLinkProjectSubmit = async (e) => {
    e.preventDefault();
    setLinkProjectError("");
    if (!selectedSourceProject) {
      setLinkProjectError("Please select a project to link");
      return;
    }

    setLinkingProject(true);
    try {
      const res = await dFetch(`/api/projects/${id}/link-project`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_project_id: selectedSourceProject }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to link project");
      }

      const result = await res.json();

      // Reload members
      const memRes = await dFetch(`/api/projects/${id}/members`, { credentials: "include" });
      if (memRes.ok) {
        const memData = await memRes.json();
        setMembers(memData);
      }

      setShowLinkProjectModal(false);
      setSelectedSourceProject(null);
      setLinkedProjectMembers([]);
      alert(`Successfully added ${result.added_count} members from linked project`);
    } catch (err) {
      setLinkProjectError(err.message);
    } finally {
      setLinkingProject(false);
    }
  };

  const loadProjectsForLinking = async () => {
    try {
      const res = await dFetch("/api/projects", { credentials: "include" });
      if (res.ok) {
        const projectsList = await res.json();
        // Filter out current project
        const filteredProjects = (Array.isArray(projectsList) ? projectsList : []).filter((p) => p.id !== id);
        setAllProjects(filteredProjects);
      }
    } catch (err) {
      console.error("Error loading projects:", err);
      setAllProjects([]);
    }
  };

  const renderWorkflowTree = (parentId = null, level = 0) => {
    const children = workspaces.filter(ws => (ws.parent_id || null) === parentId);
    if (children.length === 0) return null;
    return children.map((ws, idx) => (
      <motion.div
        key={ws.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.05 }}
        className="w-full flex flex-col mb-3"
      >
        <motion.div 
          whileHover={{ scale: 1.01 }}
          onHoverStart={() => setHoveredWorkspace(ws.id)}
          onHoverEnd={() => setHoveredWorkspace(null)}
          className="w-full min-h-[56px] py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl flex flex-wrap sm:flex-nowrap items-center justify-between px-3 sm:px-4 gap-3 relative shadow-md" 
          style={{ marginLeft: `${level * 24}px`, width: `calc(100% - ${level * 24}px)` }}
        >
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden min-w-[40%]">
            <div className="shrink-0 w-7 h-7 bg-white/20 rounded-xl flex items-center justify-center text-white text-base font-bold">
              {idx + 1}
            </div>
            <div className="text-white text-sm sm:text-base font-medium truncate" title={ws.name}>
              {level > 0 && <GitBranch className="w-3 h-3 inline mr-1" />}
              {ws.name}
            </div>
            <div className="hidden md:block text-white/70 text-xs shrink-0">
              {ws.created_at ? new Date(ws.created_at).toLocaleDateString("en-GB") : "-"}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 shrink-0 flex-wrap">
            <select
              value={ws.status || "in_process"}
              onChange={(e) => handleWorkspaceStatusChange(ws.id, e.target.value)}
              className="bg-white/20 text-white text-xs sm:text-sm rounded-lg px-2 py-1 outline-none border border-white/30 hover:bg-white/30 transition-colors"
            >
              <option value="in_process" className="text-gray-900">In process</option>
              <option value="pause" className="text-gray-900">Pause</option>
              <option value="completed" className="text-gray-900">Completed</option>
            </select>
            {level < 5 && isLead && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-2 h-6 bg-white/20 rounded-lg flex items-center justify-center text-white text-xs font-semibold hover:bg-white/30 transition-all whitespace-nowrap"
                onClick={() => {
                  setNewFlowParentId(ws.id);
                  if (!newFlowDeadline) setNewFlowDeadline(formatDateKey(new Date()));
                  setNewFlowDeadlineTime(prev => prev || "09:00");
                  setShowCreateFlowModal(true);
                }}
                title="Create Sub-Flow"
              >
                + Sub-flow
              </motion.button>
            )}
          </div>
        </motion.div>
        {renderWorkflowTree(ws.id, level + 1)}
      </motion.div>
    ));
  };

  const totalDeadlines = deadlines.length;
  const completedDeadlines = deadlines.filter(d => d.status === "completed").length;
  const completionRate = totalDeadlines > 0 ? Math.round((completedDeadlines / totalDeadlines) * 100) : 0;

  if (loading || userLoading) {
    return (
      <AppShell user={currentUser} activePath="/project" contentClassName="flex-1">
        <PageLoader label="Loading..." />
      </AppShell>
    );
  }
  if (!project) return <div className="min-h-[100dvh] flex items-center justify-center px-4 text-center">Project not found.</div>;

  return (
    <AppShell user={currentUser} activePath="/project" contentClassName="flex-1 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-8 sm:py-10 lg:py-12">
        
        {/* Project Header with Gradient */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-10 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-6 border border-gray-100 shadow-sm"
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-r from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md"
                style={{ backgroundColor: project.color || "#6366f1" }}
              >
                <FolderOpen className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {project.title}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <StatusBadge status={project.status || "in_process"} />
                  <span className="text-xs text-gray-500">
                    Created by {project.creator?.full_name || project.creator?.username || "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Day Create</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {project.created_at ? new Date(project.created_at).toLocaleDateString("en-GB") : "-"}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Status</h3>
            </div>
            <StatusBadge status={project.status || "in_process"} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Created by</h3>
            </div>
            <p className="text-base font-medium text-gray-700">
              {project.creator?.full_name || project.creator?.username || "Unknown"}
            </p>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-10">
          {isLead && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl text-white text-base font-medium hover:shadow-lg transition-all flex items-center gap-2"
              onClick={() => {
                setNewFlowParentId(null);
                if (!newFlowDeadline) setNewFlowDeadline(formatDateKey(new Date()));
                setNewFlowDeadlineTime(prev => prev || "09:00");
                setShowCreateFlowModal(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Create Flow
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl text-white text-base font-medium hover:shadow-lg transition-all flex items-center gap-2"
            onClick={() => setShowWorkspaceModal(true)}
          >
            <Layers className="w-4 h-4" />
            {isLead ? "Manage Workspace" : "View Workspace"}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl text-white text-base font-medium hover:shadow-lg transition-all flex items-center gap-2"
            onClick={() => setShowDeadlineModal(true)}
          >
            <Flag className="w-4 h-4" />
            {isLead ? "Manage Deadlines" : "View Deadlines"}
          </motion.button>
        </div>

        {/* Members Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Team Members</h2>
            <span className="text-white/50 text-sm">({members.length})</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {members.length === 0 ? (
              <div className="col-span-full text-center text-white/50 py-10">
                No members found
              </div>
            ) : (
              members.map((member, idx) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between hover:bg-white/15 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {(member.full_name || member.username || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{member.full_name || member.username}</p>
                      <p className="text-white/50 text-xs">{member.email || member.username}</p>
                    </div>
                  </div>
                  {member.role === "lead" && (
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-semibold">
                      LEAD
                    </span>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </main>

      {/* Manage Workspace Modal */}
      <AnimatePresence>
        {showWorkspaceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-4xl h-auto max-h-[90dvh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="relative px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <Layers className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Workspace Flows</h2>
                  </div>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/50 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowWorkspaceModal(false)}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {workspaceError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {workspaceError}
                  </div>
                )}
                
                {workspaceLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  </div>
                ) : workspaces.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                      <Layers className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No workspace flows found</p>
                    {isLead && <p className="text-xs text-gray-400 mt-1">Click &quot;Create Flow&quot; to get started</p>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {renderWorkflowTree(null, 0)}
                  </div>
                )}

                {isLead && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center gap-2 text-white font-medium hover:shadow-lg transition-all"
                    onClick={() => {
                      setFlowCreateError("");
                      setNewFlowParentId(null);
                      if (!newFlowDeadline) {
                        setNewFlowDeadline(formatDateKey(new Date()));
                      }
                      setNewFlowDeadlineTime((prev) => prev || "09:00");
                      setShowCreateFlowModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Create Flow
                  </motion.button>
                )}
              </div>

              <div className="border-t border-gray-100 px-6 py-4 bg-white flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowWorkspaceModal(false)}
                  className="px-5 py-2 bg-gray-900 rounded-xl text-white text-sm font-medium hover:bg-gray-800 transition-all"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Flow Modal */}
      <AnimatePresence>
        {showCreateFlowModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
               onClick={() => setShowCreateFlowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="relative w-full max-w-lg h-auto max-h-[90dvh] bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col border border-white/20"
            >
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-2xl -mr-10 -mt-10" />
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      {newFlowParentId ? <GitBranch className="w-6 h-6 text-white" /> : <Layers className="w-6 h-6 text-white" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-800 bg-clip-text text-transparent">
                        {newFlowParentId ? "Create Sub-Flow" : "Create Workspace Flow"}
                      </h2>
                      {newFlowParentId && (
                        <p className="text-sm font-medium text-indigo-600 mt-0.5 flex items-center gap-1">
                          <span className="opacity-70">to</span> {workspaces.find(w => w.id === newFlowParentId)?.name || 'Parent Flow'}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setShowCreateFlowModal(false)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <form className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar bg-gray-50/30" onSubmit={handleCreateFlowSubmit}>
                {flowCreateError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="leading-tight">{flowCreateError}</p>
                  </motion.div>
                )}
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Flow Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                    value={newFlowName}
                    onChange={e => setNewFlowName(e.target.value)}
                    required
                    placeholder="e.g., Q3 Design Review"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Description</label>
                  <textarea
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm resize-none"
                    value={newFlowDesc}
                    onChange={e => setNewFlowDesc(e.target.value)}
                    rows={3}
                    placeholder="Describe the purpose of this workflow..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Deadline (Optional)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl shadow-sm overflow-hidden border border-gray-200 bg-white overflow-visible">
                      <DateDropdown value={newFlowDeadline} onChange={setNewFlowDeadline} />
                    </div>
                    <div className="rounded-xl shadow-sm overflow-hidden border border-gray-200 bg-white overflow-visible">
                      <TimeDropdown value={newFlowDeadlineTime} onChange={setNewFlowDeadlineTime} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Assign Members <span className="text-red-500">*</span></label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 bg-white rounded-xl p-2.5 shadow-sm custom-scrollbar">
                    {members.map(member => (
                      <label key={member.id} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group">
                        <div className="relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedFlowMembers.includes(member.id)}
                            onChange={e => handleFlowMemberToggle(member.id, e.target.checked)}
                            className="peer w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold">
                            {(member.full_name || member.username || "?")[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                            {member.full_name || member.username}
                          </span>
                        </div>
                        {member.role === "lead" && (
                          <span className="ml-auto text-[10px] font-bold tracking-wider bg-amber-100 text-amber-700 px-2 py-1 rounded-md">LEAD</span>
                        )}
                      </label>
                    ))}
                    {members.length === 0 && (
                      <div className="p-4 text-center text-sm text-gray-500">No members found in project.</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateFlowModal(false)}
                    className="flex-1 px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!newFlowName.trim() || selectedFlowMembers.length === 0}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    {newFlowParentId ? "Create Sub-Flow" : "Create Flow"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deadline Modal */}
      <AnimatePresence>
        {showDeadlineModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-4xl h-auto max-h-[90dvh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="relative px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <Flag className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Manager Deadlines</h2>
                  </div>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/50 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => {
                      setShowDeadlineModal(false);
                      setEditingDeadlineId(null);
                      setDeadlineError("");
                    }}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {totalDeadlines > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${completionRate}%` }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-600">{completionRate}% completed</span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 bg-gray-50">
                {deadlineError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {deadlineError}
                  </div>
                )}

                <form onSubmit={handleCreateDeadline} className="mb-6 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-500" />
                    Create New Deadline
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input
                      type="text"
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                      placeholder="Deadline title"
                      value={deadlineTitle}
                      onChange={(event) => setDeadlineTitle(event.target.value)}
                      disabled={creatingDeadline || deadlineWorkflows.length === 0}
                      required
                    />
                    <input
                      type="date"
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                      value={deadlineDueDate}
                      onChange={(event) => setDeadlineDueDate(event.target.value)}
                      disabled={creatingDeadline || deadlineWorkflows.length === 0}
                      required
                    />
                    <select
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
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
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
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
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 text-white text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {creatingDeadline ? "Creating..." : "Create Deadline"}
                    </button>
                  </div>
                </form>

                {deadlineLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  </div>
                ) : deadlines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-gray-100">
                    <Clock className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No deadlines found</p>
                    <p className="text-xs text-gray-400 mt-1">Create your first deadline above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deadlines.map((deadline, idx) => {
                      const isEditing = editingDeadlineId === deadline.id;
                      const draft = deadlineDrafts[deadline.id] || {};
                      const assigneeProfile = deadlineMemberMap[deadline.assigned_to || ""];
                      const dueDate = new Date(deadline.due_date);
                      const isOverdue = dueDate < new Date() && deadline.status !== "completed";

                      return (
                        <motion.div
                          key={deadline.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`rounded-xl bg-white p-4 shadow-sm border transition-all ${
                            isOverdue ? 'border-red-200 bg-red-50/30' : 'border-gray-100 hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              {isEditing ? (
                                <input
                                  type="text"
                                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-900"
                                  value={draft.title || ""}
                                  onChange={(event) =>
                                    handleDeadlineDraftChange(deadline.id, "title", event.target.value)
                                  }
                                />
                              ) : (
                                <h4 className="font-semibold text-gray-900">{deadline.title}</h4>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Workflow: {deadline.workflow?.name || "Unknown"}
                              </p>
                            </div>
                            <DeadlineStatusBadge status={deadline.status || "pending"} />
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <CalendarIcon className="w-4 h-4 text-gray-400" />
                              {isEditing ? (
                                <input
                                  type="date"
                                  className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm"
                                  value={draft.due_date || ""}
                                  onChange={(event) =>
                                    handleDeadlineDraftChange(deadline.id, "due_date", event.target.value)
                                  }
                                />
                              ) : (
                                <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                                  Due: {new Date(deadline.due_date).toLocaleDateString("en-GB")}
                                  {isOverdue && " (Overdue)"}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="w-4 h-4 text-gray-400" />
                              {isEditing ? (
                                <select
                                  className="flex-1 rounded-lg border border-gray-200 px-2 py-1 text-sm"
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
                              ) : (
                                <span>Assignee: {assigneeProfile?.full_name || deadline.assigned_to || "-"}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-100">
                            <select
                              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              value={deadline.status || "pending"}
                              onChange={(event) => handleDeadlineStatusChange(deadline, event.target.value)}
                              disabled={updatingDeadlineId === deadline.id}
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                            
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setEditingDeadlineId(null)}
                                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveDeadlineEdit(deadline)}
                                  disabled={updatingDeadlineId === deadline.id}
                                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
                                >
                                  {updatingDeadlineId === deadline.id ? "Saving..." : "Save"}
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startDeadlineEdit(deadline)}
                                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDeadline(deadline)}
                                  disabled={deletingDeadlineId === deadline.id}
                                  className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 disabled:opacity-50"
                                >
                                  {deletingDeadlineId === deadline.id ? "Deleting..." : "Delete"}
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 px-6 py-4 bg-white flex justify-end">
                <button
                  className="px-5 py-2 bg-gray-900 rounded-xl text-white text-sm font-medium hover:bg-gray-800 transition-all"
                  onClick={() => {
                    setShowDeadlineModal(false);
                    setEditingDeadlineId(null);
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </AppShell>
  );
}