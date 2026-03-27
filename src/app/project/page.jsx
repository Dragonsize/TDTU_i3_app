"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageLoader from "@/components/PageLoader";
import SkeletonLoader from "@/components/SkeletonLoader";
import { dFetch } from "@/lib/api";
import {
  FolderOpen, Plus, Search, MoreHorizontal, Pencil, Trash2,
  CalendarDays, Clock, CheckCircle2, PauseCircle, Loader2,
  X, Check, Calendar, Users, ChevronRight, AlertCircle,
  LayoutGrid, Flag
} from "lucide-react";

const PROJECT_COLORS = [
  "#78716c", // Stone
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#a855f7", // Purple
  "#ec4899", // Pink
];

const STATUS_CONFIG = {
  in_process: { label: "In Progress", icon: Loader2, color: "text-blue-600 bg-blue-50 border-blue-100" },
  pause: { label: "Paused", icon: PauseCircle, color: "text-amber-600 bg-amber-50 border-amber-100" },
  completed: { label: "Completed", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.in_process;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

export default function ProjectPage() {
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [step, setStep] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [projectColor, setProjectColor] = useState(PROJECT_COLORS[0]);
  const [projectStatus, setProjectStatus] = useState("in_process");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [showManagerDeadlineModal, setShowManagerDeadlineModal] = useState(false);
  const [managerProject, setManagerProject] = useState(null);
  const [managerWorkflows, setManagerWorkflows] = useState([]);
  const [managerMembers, setManagerMembers] = useState([]);
  const [managerDeadlines, setManagerDeadlines] = useState([]);
  const [managerLoading, setManagerLoading] = useState(false);
  const [managerError, setManagerError] = useState("");
  const [deadlineTitle, setDeadlineTitle] = useState("");
  const [deadlineDate, setDeadlineDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [deadlineAssignee, setDeadlineAssignee] = useState("");
  const [deadlineWorkflowId, setDeadlineWorkflowId] = useState("");
  const [creatingDeadline, setCreatingDeadline] = useState(false);
  const [updatingDeadlineId, setUpdatingDeadlineId] = useState("");
  const [deletingDeadlineId, setDeletingDeadlineId] = useState("");
  const [deadlineDrafts, setDeadlineDrafts] = useState({});

  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const profileRes = await dFetch('/api/profile');
        const profileData = await profileRes.json();
        if (!profileData.profile) { router.push('/login'); return; }
        setCurrentUser(profileData.profile);
        setMembers([profileData.profile]);
        const projRes = await dFetch("/api/projects");
        const projData = await projRes.json();
        if (Array.isArray(projData)) setProjects(projData);
        setLoading(false);
      } catch { router.push('/login'); }
    };
    checkAuthAndFetch();
  }, [router]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError("");
    try {
      const res = await dFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: projectName.trim(), color: projectColor }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Server error" }));
        throw new Error(data.detail || "Failed to create project");
      }
      const newProject = await res.json();
      const membersToAdd = members.filter((m) => m.id !== currentUser?.id);
      await Promise.all(membersToAdd.map((member) =>
        dFetch(`/api/projects/${newProject.id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ member_username: member.username, role: "member" }),
        })
      ));
      setProjects([...projects, { ...newProject, deadline_count: 0 }]);
      resetModal();
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setProjectName("");
    setStep(1);
    setMembers(currentUser ? [currentUser] : []);
    setSearchQuery("");
    setSearchResults([]);
    setCreateError("");
    setIsCreating(false);
    setProjectColor(PROJECT_COLORS[0]);
  };

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      dFetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
        .then((res) => res.json())
        .then((data) => setSearchResults(data || []));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addMember = (user) => {
    if (!members.find((m) => m.id === user.id)) setMembers([...members, user]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      const res = await dFetch(`/api/projects/${projectToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects(projects.filter((p) => p.id !== projectToDelete.id));
        setShowDeleteModal(false);
        setProjectToDelete(null);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.detail || "Failed to delete project");
      }
    } catch (error) { alert("Error: " + error.message); }
    setActiveMenu(null);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!projectToEdit) return;
    try {
      const res = await dFetch(`/api/projects/${projectToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: projectName, color: projectColor, status: projectStatus }),
      });
      if (res.ok) {
        const updatedProject = await res.json();
        setProjects(projects.map(p => p.id === updatedProject.id ? { ...p, ...updatedProject } : p));
        setShowEditModal(false);
        setProjectToEdit(null);
        setProjectName("");
        setProjectStatus("in_process");
      }
    } catch (error) { console.error("Failed to update project", error); }
  };

  const loadDeadlinesForWorkflows = async (workflows) => {
    if (!Array.isArray(workflows) || workflows.length === 0) { setManagerDeadlines([]); return; }
    const workflowById = workflows.reduce((acc, ws) => { acc[ws.id] = ws; return acc; }, {});
    const allDeadlines = await Promise.all(workflows.map(async (ws) => {
      const response = await dFetch(`/api/workflows/${ws.id}/deadlines`);
      if (!response.ok) return [];
      const data = await response.json().catch(() => []);
      return Array.isArray(data) ? data.map((d) => ({ ...d, workflow: workflowById[ws.id] })) : [];
    }));
    const sorted = allDeadlines.flat().sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0));
    setManagerDeadlines(sorted);
  };

  const openManagerDeadlineModal = async (project) => {
    setManagerProject(project);
    setShowManagerDeadlineModal(true);
    setManagerLoading(true);
    setManagerError("");
    setDeadlineTitle("");
    setDeadlineDate(new Date().toISOString().slice(0, 10));
    try {
      const [workflowRes, memberRes] = await Promise.all([
        dFetch(`/api/projects/${project.id}/workflows`),
        dFetch(`/api/projects/${project.id}/members`),
      ]);
      if (!workflowRes.ok) throw new Error("Failed to load workflows");
      if (!memberRes.ok) throw new Error("Failed to load members");
      const workflows = await workflowRes.json();
      const members = await memberRes.json();
      const safeWorkflows = Array.isArray(workflows) ? workflows : [];
      const safeMembers = Array.isArray(members) ? members : [];
      setManagerWorkflows(safeWorkflows);
      setManagerMembers(safeMembers);
      setDeadlineWorkflowId(safeWorkflows[0]?.id || "");
      setDeadlineAssignee(safeMembers.find((m) => m.username)?.username || "");
      await loadDeadlinesForWorkflows(safeWorkflows);
    } catch (error) {
      setManagerError(error.message || "Failed to load data");
      setManagerWorkflows([]); setManagerMembers([]); setManagerDeadlines([]);
    } finally { setManagerLoading(false); }
  };

  const handleCreateManagerDeadline = async (e) => {
    e.preventDefault();
    if (!managerProject || !deadlineWorkflowId || !deadlineAssignee || !deadlineDate || !deadlineTitle.trim()) {
      setManagerError("Please fill all deadline fields."); return;
    }
    setCreatingDeadline(true);
    setManagerError("");
    try {
      const response = await dFetch(`/api/workflows/${deadlineWorkflowId}/deadlines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: deadlineTitle.trim(), due_date: deadlineDate, assigned_to: deadlineAssignee }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 403) throw new Error("You are not allowed to create deadlines.");
        throw new Error(data.detail || "Failed to create deadline");
      }
      setDeadlineTitle("");
      await loadDeadlinesForWorkflows(managerWorkflows);
      setProjects((prev) => prev.map((p) =>
        p.id === managerProject.id ? { ...p, deadline_count: (Number(p.deadline_count) || 0) + 1 } : p
      ));
    } catch (error) { setManagerError(error.message || "Failed to create deadline"); }
    finally { setCreatingDeadline(false); }
  };

  const handleUpdateDeadlineStatus = async (deadline, status) => {
    if (!deadline?.id || !deadline?.workflow?.id) return;
    setUpdatingDeadlineId(deadline.id);
    try {
      const response = await dFetch(`/api/workflows/${deadline.workflow.id}/deadlines/${deadline.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update");
      const updated = await response.json();
      setManagerDeadlines((prev) => prev.map((item) => item.id === deadline.id ? { ...item, ...updated } : item));
    } catch (error) { setManagerError(error.message); }
    finally { setUpdatingDeadlineId(""); }
  };

  const handleDeleteDeadline = async (deadline) => {
    if (!deadline?.id || !deadline?.workflow?.id) return;
    if (!confirm("Delete this deadline?")) return;
    setDeletingDeadlineId(deadline.id);
    try {
      const response = await dFetch(`/api/workflows/${deadline.workflow.id}/deadlines/${deadline.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      setManagerDeadlines((prev) => prev.filter((item) => item.id !== deadline.id));
      setDeadlineDrafts((prev) => { const n = { ...prev }; delete n[deadline.id]; return n; });
      if (managerProject) {
        setProjects((prev) => prev.map((p) =>
          p.id === managerProject.id ? { ...p, deadline_count: Math.max((Number(p.deadline_count) || 1) - 1, 0) } : p
        ));
      }
    } catch (error) { setManagerError(error.message); }
    finally { setDeletingDeadlineId(""); }
  };

  const updateDeadlineDraft = (deadlineId, patch) => {
    setDeadlineDrafts((prev) => ({ ...prev, [deadlineId]: { ...(prev[deadlineId] || {}), ...patch } }));
  };

  const getDeadlineDraft = (deadline) => {
    const defaultDraft = {
      title: deadline.title || "",
      due_date: (deadline.due_date || "").slice(0, 10),
      assigned_to: managerMemberById[deadline.assigned_to]?.username || "",
    };
    return { ...defaultDraft, ...(deadlineDrafts[deadline.id] || {}) };
  };

  const handleSaveDeadlineEdits = async (deadline) => {
    if (!deadline?.id || !deadline?.workflow?.id) return;
    const draft = getDeadlineDraft(deadline);
    if (!draft.title?.trim() || !draft.due_date || !draft.assigned_to) {
      setManagerError("Title, assignee, and due date are required."); return;
    }
    setUpdatingDeadlineId(deadline.id);
    setManagerError("");
    try {
      const response = await dFetch(`/api/workflows/${deadline.workflow.id}/deadlines/${deadline.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: draft.title.trim(), due_date: draft.due_date, assigned_to: draft.assigned_to }),
      });
      if (!response.ok) throw new Error("Failed to save");
      const updated = await response.json();
      setManagerDeadlines((prev) => prev.map((item) => item.id === deadline.id ? { ...item, ...updated } : item));
      setDeadlineDrafts((prev) => { const n = { ...prev }; delete n[deadline.id]; return n; });
    } catch (error) { setManagerError(error.message); }
    finally { setUpdatingDeadlineId(""); }
  };

  const isCurrentUserProjectLead = managerMembers.some((m) => m.id === currentUser?.id && m.role === "lead");
  const canManageDeadlines = Boolean(currentUser);
  const managerMemberById = managerMembers.reduce((acc, m) => { acc[m.id] = m; return acc; }, {});

  const filteredProjects = React.useMemo(() => {
    if (!projectSearchQuery.trim()) return projects;
    const query = projectSearchQuery.toLowerCase().trim();
    return [...projects]
      .map((p) => {
        const title = (p.title || "").toLowerCase();
        let score = title === query ? 100 : title.startsWith(query) ? 50 : title.includes(query) ? 10 : 0;
        return { project: p, score };
      })
      .filter((i) => i.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((i) => i.project);
  }, [projects, projectSearchQuery]);

  if (loading) {
    return (
      <AppShell user={currentUser} activePath="/project" contentClassName="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonLoader count={6} type="projects" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={currentUser} activePath="/project" contentClassName="flex-1 bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-blue-500" />
            Projects
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-xl px-5 py-2.5 font-semibold hover:bg-black transition-all active:scale-[0.98] shadow-sm shadow-gray-200 text-sm"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full h-11 bg-white border border-gray-200 rounded-xl pl-11 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm"
            placeholder="Search projects..."
            value={projectSearchQuery}
            onChange={(e) => setProjectSearchQuery(e.target.value)}
          />
        </div>

        {/* Projects Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-white/50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-500" />
              All Projects
              <span className="ml-1 text-sm font-normal text-gray-400">({filteredProjects.length})</span>
            </h3>
          </div>

          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/80 border-b border-gray-100">
            <div className="col-span-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Project Name</div>
            <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</div>
            <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</div>
            <div className="col-span-2 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Deadlines</div>
            <div className="col-span-2"></div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-50">
            {filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <FolderOpen className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">
                  {projects.length === 0 ? "No projects yet. Create your first one!" : "No projects match your search."}
                </p>
                {projects.length === 0 && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Create Project
                  </button>
                )}
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 px-6 py-4 items-center hover:bg-gray-50/70 transition-colors group"
                >
                  {/* Name */}
                  <Link
                    href={`/project/${project.id}`}
                    className="col-span-4 flex items-center gap-3 group/link"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: project.color || "#78716c" }}
                    >
                      <FolderOpen className="w-4 h-4 text-white/90" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate group-hover/link:text-blue-600 transition-colors text-sm">
                        {project.title}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover/link:text-blue-400 transition-all -translate-x-1 group-hover/link:translate-x-0 flex-shrink-0 hidden md:block" />
                  </Link>

                  {/* Created Date */}
                  <div className="col-span-2 flex items-center gap-1.5 text-sm text-gray-500">
                    <CalendarDays className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{new Date(project.created_at || Date.now()).toLocaleDateString("en-GB")}</span>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <StatusBadge status={project.status || "in_process"} />
                  </div>

                  {/* Deadline Count */}
                  <div className="col-span-2 flex justify-center">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600">
                      <Flag className="w-3.5 h-3.5 text-gray-400" />
                      {project.deadline_count || 0}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end items-center gap-2">
                    <button
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 transition-colors"
                      onClick={() => openManagerDeadlineModal(project)}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Deadlines
                    </button>
                    <div className="relative">
                      <button
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => setActiveMenu(activeMenu === project.id ? null : project.id)}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {activeMenu === project.id && (
                        <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg z-50 py-1.5 border border-gray-100 overflow-hidden">
                          <button
                            onClick={() => {
                              setProjectToEdit(project);
                              setProjectName(project.title);
                              setProjectColor(project.color || PROJECT_COLORS[0]);
                              setProjectStatus(project.status || "in_process");
                              setShowEditModal(true);
                              setActiveMenu(null);
                            }}
                            className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition font-medium"
                          >
                            <Pencil className="w-4 h-4 text-gray-400" /> Edit Project
                          </button>
                          <button
                            onClick={() => {
                              setProjectToDelete(project);
                              setShowDeleteModal(true);
                              setActiveMenu(null);
                            }}
                            className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition font-medium"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Create Project Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-7 py-5 border-b border-gray-100 flex items-center justify-between bg-white/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {step === 1 ? "Create New Project" : "Add Team Members"}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">Step {step} of 2</p>
              </div>
              <button
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                onClick={resetModal}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-100">
              <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: step === 1 ? "50%" : "100%" }} />
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-7">
              <form
                onSubmit={step === 1 ? (e) => {
                  e.preventDefault();
                  if (projectName.trim()) { setStep(2); setCreateError(""); }
                  else setCreateError("Please enter a project name");
                } : handleCreateProject}
                className="space-y-6"
              >
                {step === 1 ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Project Name</label>
                      <input
                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        placeholder="e.g. Marketing Campaign Q2"
                        value={projectName}
                        onChange={e => setProjectName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Project Color</label>
                      <div className="flex gap-2.5 flex-wrap">
                        {PROJECT_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setProjectColor(color)}
                            className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 ${projectColor === color ? "border-gray-900 scale-110 shadow-md" : "border-transparent"}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      {/* Preview */}
                      <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: projectColor }}>
                          <FolderOpen className="w-4 h-4 text-white/90" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{projectName || "Project preview"}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                        placeholder="Search by email or username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto z-20">
                          {searchResults.map((user) => (
                            <div
                              key={user.id}
                              className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b last:border-0 border-gray-50"
                              onClick={() => addMember(user)}
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                                  {(user.full_name || user.username || "?")[0].toUpperCase()}
                                </div>
                                <span className="font-medium text-sm text-gray-900">{user.full_name || user.username}</span>
                              </div>
                              <span className="text-xs text-gray-400">{user.email}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-gray-400" />
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Team Members ({members.length})</h3>
                      </div>
                      <div className="space-y-2 max-h-52 overflow-y-auto">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {(member.full_name || member.email || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{member.full_name || member.username}</div>
                                <div className="text-xs text-gray-400">{member.email}</div>
                              </div>
                            </div>
                            {member.id === currentUser?.id ? (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">Lead</span>
                            ) : (
                              <button type="button" onClick={() => setMembers(members.filter(m => m.id !== member.id))}
                                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {createError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {createError}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  {step === 2 ? (
                    <button type="button" onClick={() => setStep(1)} className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
                      ← Back
                    </button>
                  ) : <div />}
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-xl px-7 py-2.5 font-semibold text-sm hover:bg-black transition-all active:scale-[0.98] disabled:opacity-60 shadow-sm"
                  >
                    {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : step === 1 ? <>Next <ChevronRight className="w-4 h-4" /></> : <><Check className="w-4 h-4" /> Create Project</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Deadlines Modal ── */}
      {showManagerDeadlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-7 py-5 border-b border-gray-100 bg-white/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Flag className="w-5 h-5 text-blue-500" />
                  Manage Deadlines
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">{managerProject?.title}</p>
              </div>
              <button
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                onClick={() => setShowManagerDeadlineModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-7 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Deadline */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-500" /> Create Deadline
                </h3>
                {!managerLoading && managerWorkflows.length === 0 && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    No workflows found. Create a workflow first.
                  </div>
                )}
                <form className="space-y-3.5" onSubmit={handleCreateManagerDeadline}>
                  {[
                    { label: "Title", node: <input className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-gray-50" value={deadlineTitle} onChange={(e) => setDeadlineTitle(e.target.value)} placeholder="Release candidate" disabled={!canManageDeadlines || managerLoading || creatingDeadline || managerWorkflows.length === 0} /> },
                    { label: "Workflow", node: <select className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-gray-50" value={deadlineWorkflowId} onChange={(e) => setDeadlineWorkflowId(e.target.value)} disabled={!canManageDeadlines || managerLoading || creatingDeadline || managerWorkflows.length === 0}><option value="">Select workflow...</option>{managerWorkflows.map((wf) => <option key={wf.id} value={wf.id}>{wf.name || wf.title || "Untitled"}</option>)}</select> },
                    { label: "Assign to", node: <select className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-gray-50" value={deadlineAssignee} onChange={(e) => setDeadlineAssignee(e.target.value)} disabled={!canManageDeadlines || managerLoading || creatingDeadline || managerWorkflows.length === 0}><option value="">Select member...</option>{managerMembers.map((m) => <option key={m.id} value={m.username}>{m.full_name || m.username} ({m.username})</option>)}</select> },
                    { label: "Due Date", node: <input type="date" min={new Date().toISOString().slice(0, 10)} className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all bg-gray-50" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} disabled={!canManageDeadlines || managerLoading || creatingDeadline || managerWorkflows.length === 0} /> },
                  ].map(({ label, node }) => (
                    <div key={label}>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                      {node}
                    </div>
                  ))}
                  <button
                    type="submit"
                    disabled={!canManageDeadlines || managerLoading || creatingDeadline || managerWorkflows.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-black transition-all disabled:opacity-60 active:scale-[0.98] shadow-sm mt-1"
                  >
                    {creatingDeadline ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...</> : <><Plus className="w-3.5 h-3.5" /> Create Deadline</>}
                  </button>
                </form>
              </div>

              {/* Existing Deadlines */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" /> Existing Deadlines
                </h3>
                {managerLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                  </div>
                ) : managerDeadlines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-gray-50 rounded-2xl border border-gray-100">
                    <Clock className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400 font-medium">No deadlines yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {managerDeadlines.map((deadline) => {
                      const draft = getDeadlineDraft(deadline);
                      const isUpdating = updatingDeadlineId === deadline.id;
                      const isDeleting = deletingDeadlineId === deadline.id;
                      const disabled = !isCurrentUserProjectLead || isUpdating || isDeleting;
                      return (
                        <div key={deadline.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
                          <input
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                            value={draft.title}
                            onChange={(e) => updateDeadlineDraft(deadline.id, { title: e.target.value })}
                            disabled={disabled}
                          />
                          <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <LayoutGrid className="w-3 h-3" />
                            {deadline.workflow?.name || deadline.workflow?.title || "Untitled workflow"}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              min={new Date().toISOString().slice(0, 10)}
                              className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                              value={draft.due_date}
                              onChange={(e) => updateDeadlineDraft(deadline.id, { due_date: e.target.value })}
                              disabled={disabled}
                            />
                            <select
                              className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                              value={draft.assigned_to}
                              onChange={(e) => updateDeadlineDraft(deadline.id, { assigned_to: e.target.value })}
                              disabled={disabled}
                            >
                              <option value="">Assignee...</option>
                              {managerMembers.map((m) => <option key={m.id} value={m.username}>{m.full_name || m.username}</option>)}
                            </select>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <select
                              className="rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all flex-1 min-w-0"
                              value={deadline.status || "pending"}
                              onChange={(e) => handleUpdateDeadlineStatus(deadline, e.target.value)}
                              disabled={disabled}
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60 transition-colors"
                              onClick={() => handleSaveDeadlineEdits(deadline)}
                              disabled={disabled}
                            >
                              {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              {isUpdating ? "Saving..." : "Save"}
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-xl border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60 transition-colors"
                              onClick={() => handleDeleteDeadline(deadline)}
                              disabled={disabled}
                            >
                              {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                              {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {managerError && (
                <div className="lg:col-span-2 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {managerError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Project Modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-7 py-5 border-b border-gray-100 bg-white/50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-500" /> Edit Project
              </h2>
              <button
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                onClick={() => setShowEditModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateProject} className="p-7 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Project Name</label>
                <input
                  className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value)}
                >
                  <option value="in_process">In Progress</option>
                  <option value="pause">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Color</label>
                <div className="flex gap-2.5 flex-wrap">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setProjectColor(color)}
                      className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 ${projectColor === color ? "border-gray-900 scale-110 shadow-md" : "border-transparent"}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-all active:scale-[0.98] shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-8 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-900">Delete Project?</h2>
            <p className="text-gray-500 text-sm mb-7 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-bold text-gray-800">&quot;{projectToDelete?.title}&quot;</span>?
              This will remove all workflows and files. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all active:scale-[0.98] shadow-sm shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
