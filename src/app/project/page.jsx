"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageLoader from "@/components/PageLoader";

const PROJECT_COLORS = [
  "#78716c", // Stone (Default)
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
        // Fetch profile for header and auth
        const profileRes = await fetch('/api/profile', { credentials: 'include' });
        const profileData = await profileRes.json();
        if (!profileData.profile) {
          router.push('/login');
          return;
        }
        setCurrentUser(profileData.profile);
        setMembers([profileData.profile]);
        // Fetch projects
        const projRes = await fetch("/api/projects", { credentials: "include" });
        const projData = await projRes.json();
        if (Array.isArray(projData)) setProjects(projData);
        setLoading(false);
      } catch (err) {
        router.push('/login');
      }
    };
    checkAuthAndFetch();
  }, [router]);

  // Handle creating a new project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError("");

    try {
      // 1. Create Project
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: projectName.trim(), color: projectColor }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Server error (invalid JSON response)" }));
        throw new Error(data.detail || "Failed to create project");
      }

      const newProject = await res.json();

      // 2. Add selected members (excluding current user who is already lead)
      const membersToAdd = members.filter((m) => m.id !== currentUser?.id);

      await Promise.all(
        membersToAdd.map((member) =>
          fetch(`/api/projects/${newProject.id}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ member_username: member.username, role: "member" }),
            credentials: "include",
          })
        )
      );

      setProjects([...projects, { ...newProject, deadline_count: 0 }]); // Add new project to list
      resetModal();
    } catch (error) {
      console.error("Failed to create project", error);
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

  // Search users effect
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => setSearchResults(data || []));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const addMember = (user) => {
    if (!members.find((m) => m.id === user.id)) {
      setMembers([...members, user]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      const res = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setProjects(projects.filter((p) => p.id !== projectToDelete.id));
        setShowDeleteModal(false);
        setProjectToDelete(null);
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Failed to delete project", data);
        alert(data.detail || "Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Error deleting project: " + error.message);
    }
    setActiveMenu(null);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (!projectToEdit) return;

    try {
      const res = await fetch(`/api/projects/${projectToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: projectName, color: projectColor }),
        credentials: "include",
      });

      if (res.ok) {
        const updatedProject = await res.json();
        setProjects(projects.map(p => p.id === updatedProject.id ? { ...p, title: updatedProject.title, color: updatedProject.color } : p));
        setShowEditModal(false);
        setProjectToEdit(null);
        setProjectName("");
      }
    } catch (error) {
      console.error("Failed to update project", error);
    }
  };

  const loadDeadlinesForWorkflows = async (workflows) => {
    if (!Array.isArray(workflows) || workflows.length === 0) {
      setManagerDeadlines([]);
      return;
    }

    const workflowById = workflows.reduce((acc, ws) => {
      acc[ws.id] = ws;
      return acc;
    }, {});

    const allDeadlines = await Promise.all(
      workflows.map(async (ws) => {
        const response = await fetch(`/api/workflows/${ws.id}/deadlines`, { credentials: "include" });
        if (!response.ok) {
          return [];
        }
        const data = await response.json().catch(() => []);
        return Array.isArray(data)
          ? data.map((deadline) => ({ ...deadline, workflow: workflowById[ws.id] }))
          : [];
      })
    );

    const sorted = allDeadlines
      .flat()
      .sort((a, b) => new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime());

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
        fetch(`/api/projects/${project.id}/workflows`, { credentials: "include" }),
        fetch(`/api/projects/${project.id}/members`, { credentials: "include" }),
      ]);

      if (!workflowRes.ok) {
        const data = await workflowRes.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to load workflows");
      }
      if (!memberRes.ok) {
        const data = await memberRes.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to load members");
      }

      const workflows = await workflowRes.json();
      const members = await memberRes.json();

      const safeWorkflows = Array.isArray(workflows) ? workflows : [];
      const safeMembers = Array.isArray(members) ? members : [];

      setManagerWorkflows(safeWorkflows);
      setManagerMembers(safeMembers);
      const firstWorkflowId = safeWorkflows[0]?.id || "";
      const firstAssignableMember = safeMembers.find((member) => member.username) || null;
      setDeadlineWorkflowId(firstWorkflowId);
      setDeadlineAssignee(firstAssignableMember?.username || "");

      await loadDeadlinesForWorkflows(safeWorkflows);
    } catch (error) {
      setManagerError(error.message || "Failed to load manager deadlines");
      setManagerWorkflows([]);
      setManagerMembers([]);
      setManagerDeadlines([]);
    } finally {
      setManagerLoading(false);
    }
  };

  const handleCreateManagerDeadline = async (e) => {
    e.preventDefault();
    if (!managerProject || !deadlineWorkflowId || !deadlineAssignee || !deadlineDate || !deadlineTitle.trim()) {
      setManagerError("Please fill all deadline fields.");
      return;
    }

    setCreatingDeadline(true);
    setManagerError("");
    try {
      const response = await fetch(`/api/workflows/${deadlineWorkflowId}/deadlines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: deadlineTitle.trim(),
          due_date: deadlineDate,
          assigned_to: deadlineAssignee,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 403) {
          throw new Error("You are not allowed to create deadlines for this project.");
        }
        throw new Error(data.detail || "Failed to create deadline");
      }

      setDeadlineTitle("");
      await loadDeadlinesForWorkflows(managerWorkflows);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === managerProject.id
            ? { ...p, deadline_count: (Number(p.deadline_count) || 0) + 1 }
            : p
        )
      );
    } catch (error) {
      setManagerError(error.message || "Failed to create deadline");
    } finally {
      setCreatingDeadline(false);
    }
  };

  const handleUpdateDeadlineStatus = async (deadline, status) => {
    if (!deadline?.id || !deadline?.workflow?.id) {
      return;
    }

    setUpdatingDeadlineId(deadline.id);
    setManagerError("");
    try {
      const response = await fetch(`/api/workflows/${deadline.workflow.id}/deadlines/${deadline.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to update deadline status");
      }

      const updated = await response.json();
      setManagerDeadlines((prev) => prev.map((item) => (item.id === deadline.id ? { ...item, ...updated } : item)));
    } catch (error) {
      setManagerError(error.message || "Failed to update deadline status");
    } finally {
      setUpdatingDeadlineId("");
    }
  };

  const handleDeleteDeadline = async (deadline) => {
    if (!deadline?.id || !deadline?.workflow?.id) {
      return;
    }
    if (!confirm("Delete this deadline?")) {
      return;
    }

    setDeletingDeadlineId(deadline.id);
    setManagerError("");
    try {
      const response = await fetch(`/api/workflows/${deadline.workflow.id}/deadlines/${deadline.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to delete deadline");
      }

      setManagerDeadlines((prev) => prev.filter((item) => item.id !== deadline.id));
      setDeadlineDrafts((prev) => {
        const next = { ...prev };
        delete next[deadline.id];
        return next;
      });
      if (managerProject) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === managerProject.id
              ? { ...p, deadline_count: Math.max((Number(p.deadline_count) || 1) - 1, 0) }
              : p
          )
        );
      }
    } catch (error) {
      setManagerError(error.message || "Failed to delete deadline");
    } finally {
      setDeletingDeadlineId("");
    }
  };

  const updateDeadlineDraft = (deadlineId, patch) => {
    setDeadlineDrafts((prev) => ({
      ...prev,
      [deadlineId]: {
        ...(prev[deadlineId] || {}),
        ...patch,
      },
    }));
  };

  const getDefaultDeadlineDraft = (deadline) => ({
    title: deadline.title || "",
    due_date: (deadline.due_date || "").slice(0, 10),
    assigned_to: managerMemberById[deadline.assigned_to]?.username || "",
  });

  const getDeadlineDraft = (deadline) => {
    const defaultDraft = getDefaultDeadlineDraft(deadline);
    const currentDraft = deadlineDrafts[deadline.id] || {};
    return {
      ...defaultDraft,
      ...currentDraft,
    };
  };

  const handleSaveDeadlineEdits = async (deadline) => {
    if (!deadline?.id || !deadline?.workflow?.id) {
      return;
    }

    const draft = getDeadlineDraft(deadline);
    if (!draft.title?.trim() || !draft.due_date || !draft.assigned_to) {
      setManagerError("Title, assignee, and due date are required.");
      return;
    }

    setUpdatingDeadlineId(deadline.id);
    setManagerError("");
    try {
      const response = await fetch(`/api/workflows/${deadline.workflow.id}/deadlines/${deadline.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: draft.title.trim(),
          due_date: draft.due_date,
          assigned_to: draft.assigned_to,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to save deadline changes");
      }

      const updated = await response.json();
      setManagerDeadlines((prev) => prev.map((item) => (item.id === deadline.id ? { ...item, ...updated } : item)));
      setDeadlineDrafts((prev) => {
        const next = { ...prev };
        delete next[deadline.id];
        return next;
      });
    } catch (error) {
      setManagerError(error.message || "Failed to save deadline changes");
    } finally {
      setUpdatingDeadlineId("");
    }
  };

  const isCurrentUserProjectLead = managerMembers.some(
    (member) => member.id === currentUser?.id && member.role === "lead"
  );
  const canManageDeadlines = Boolean(currentUser);
  const managerMemberById = managerMembers.reduce((acc, member) => {
    acc[member.id] = member;
    return acc;
  }, {});

  // Filter and sort projects based on search query
  const filteredProjects = React.useMemo(() => {
    if (!projectSearchQuery.trim()) return projects;
    const query = projectSearchQuery.toLowerCase().trim();
    return [...projects]
      .map((project) => {
        const title = (project.title || "").toLowerCase();
        let score = 0;
        if (title === query) score = 100;
        else if (title.startsWith(query)) score = 50;
        else if (title.includes(query)) score = 10;
        return { project, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.project);
  }, [projects, projectSearchQuery]);

  if (loading) {
    return <PageLoader label="Loading projects..." fullHeight={false} />;
  }

  return (
    <AppShell user={currentUser} activePath="/project" contentClassName="flex-1">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-8 sm:py-10 lg:py-12">
        {/* Search and Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="relative w-full md:w-2/3">
            <input
              className="w-full h-12 sm:h-14 md:h-16 bg-zinc-300 rounded-2xl px-4 sm:px-6 text-base sm:text-lg md:text-xl font-normal font-['Arimo'] placeholder-black/40 text-black focus:outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Search Your project"
              value={projectSearchQuery}
              onChange={(e) => setProjectSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="w-full md:w-48 h-12 sm:h-14 md:h-16 flex items-center justify-center text-black text-base sm:text-lg md:text-xl font-normal font-['IM_FELL_Great_Primer_SC'] bg-zinc-300 rounded-2xl border border-gray-300 cursor-pointer hover:bg-zinc-400 transition shadow-sm"
            type="button"
            onClick={() => setShowModal(true)}
          >
            NEW PROJECT
          </button>
        </div>

        {/* Project Table */}
        <div className="bg-zinc-300 rounded-2xl p-4 sm:p-6 min-h-[480px]">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 mb-4 px-4 hidden md:grid">
            <div className="col-span-4 text-black text-2xl font-normal font-['Habibi']">Name Project</div>
            <div className="col-span-2 text-center text-black text-2xl font-normal font-['Habibi']">Day Create</div>
            <div className="col-span-2 text-center text-black text-2xl font-normal font-['Habibi']">Status</div>
            <div className="col-span-2 text-center text-black text-2xl font-normal font-['Habibi']">Deadline</div>
            <div className="col-span-2"></div>
          </div>

          <div className="w-full h-px bg-black mb-6 hidden md:block"></div>

          {/* Rows */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-gray-500 py-10">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="text-center text-gray-500 py-10">No projects found. Create one!</div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center text-gray-500 py-10">No projects match your search.</div>
            ) : (
              filteredProjects.map((project) => (
                <div 
                  key={project.id} 
                  className="rounded-2xl p-3 sm:p-4 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center text-white transition-colors duration-300"
                  style={{ backgroundColor: project.color || "#78716c" }}
                >
                  <Link href={`/project/${project.id}`} className="col-span-4 text-lg sm:text-xl md:text-2xl font-normal font-['Habibi'] truncate hover:underline cursor-pointer">
                    {project.title}
                  </Link>
                  <div className="col-span-2 text-left md:text-center text-base sm:text-lg md:text-2xl font-normal font-['Habibi']">
                    {new Date(project.created_at || Date.now()).toLocaleDateString("en-GB")}
                  </div>
                  <div className="col-span-2 text-left md:text-center text-base sm:text-lg md:text-2xl font-normal font-['Habibi']">
                    {project.status === "active" ? "In process" : project.status}
                  </div>
                  <div className="col-span-2 text-left md:text-center text-base sm:text-lg md:text-2xl font-normal font-['Habibi']">{project.deadline_count || 0}</div>
                  <div className="col-span-2 flex justify-start md:justify-end items-center gap-3 sm:gap-4">
                    <button
                      className="px-3.5 py-1.5 bg-black rounded-md text-white text-xs font-normal font-['Arimo'] hover:bg-gray-800"
                      onClick={() => openManagerDeadlineModal(project)}
                    >
                      Manager Deadline
                    </button>
                    <div className="relative">
                      <button
                        className="text-stone-200 text-2xl font-bold pb-2 focus:outline-none hover:text-white transition"
                        onClick={() => setActiveMenu(activeMenu === project.id ? null : project.id)}
                      >
                        ...
                      </button>
                      {activeMenu === project.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 py-1 overflow-hidden border border-gray-100">
                          <button
                            onClick={() => {
                              setProjectToEdit(project);
                              setProjectName(project.title);
                              setProjectColor(project.color || PROJECT_COLORS[0]);
                              setShowEditModal(true);
                              setActiveMenu(null);
                            }}
                            className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition font-medium"
                          >
                            Edit Project
                          </button>
                          <button
                            onClick={() => {
                              setProjectToDelete(project);
                              setShowDeleteModal(true);
                              setActiveMenu(null);
                            }}
                            className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition font-medium"
                          >
                            Delete Project
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
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="h-16 px-8 bg-white border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 bg-gray-950 rounded-md"></div>
                <span className="text-neutral-950 text-lg font-bold font-['Arimo']">A+ Flow</span>
              </div>
              <button
                className="text-3xl text-gray-400 hover:text-gray-700 leading-none"
                onClick={resetModal}
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-12 flex flex-col items-center justify-center">
              <h2 className="text-black text-4xl md:text-5xl font-normal font-['IM_FELL_Great_Primer_SC'] mb-8 text-center">
                {step === 1 ? "Create Project" : "Add Members"}
              </h2>
              <form
                className="w-full max-w-2xl flex flex-col gap-8"
                onSubmit={step === 1 ? (e) => { 
                  e.preventDefault(); 
                  if (projectName.trim()) {
                    setStep(2); 
                    setCreateError("");
                  } else {
                    setCreateError("Please enter a project name");
                  }
                } : handleCreateProject}
              >
                {step === 1 ? (
                  <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
                    <label htmlFor="projectName" className="text-black text-2xl font-normal font-['Habibi'] whitespace-nowrap">Name of Project:</label>
                    <div className="flex flex-col gap-4">
                      <input
                        id="projectName"
                        className="w-full md:w-96 h-16 bg-zinc-300 rounded-[10px] px-6 text-2xl font-normal font-['Habibi'] text-stone-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
                        placeholder="Enter Name of Project"
                        value={projectName}
                        onChange={e => setProjectName(e.target.value)}
                        autoFocus
                      />
                      {/* Color Picker */}
                      <div className="flex gap-2 flex-wrap justify-center md:justify-start">
                        {PROJECT_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setProjectColor(color)}
                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${projectColor === color ? "border-black scale-110" : "border-transparent"}`}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 w-full">
                    {/* Search Input */}
                    <div className="relative">
                      <input
                        className="w-full h-14 bg-zinc-100 rounded-[10px] px-4 text-lg text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                        placeholder="Search by email or username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {/* Search Results Dropdown */}
                      {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto z-20">
                          {searchResults.map((user) => (
                            <div
                              key={user.id}
                              className="p-3 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                              onClick={() => addMember(user)}
                            >
                              <span className="font-medium">{user.full_name || user.username}</span>
                              <span className="text-sm text-gray-500">
                                {user.email}
                                {user.username && user.username !== user.email && <span className="text-gray-400 ml-1">({user.username})</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Members List */}
                    <div className="bg-zinc-50 rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto border border-gray-200">
                      <h3 className="text-gray-500 text-sm font-bold mb-3 uppercase">Group Members</h3>
                      <div className="space-y-2">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between bg-white p-3 rounded shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs">
                                {(member.full_name || member.email || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{member.full_name || member.username}</div>
                                <div className="text-xs text-gray-500">{member.email}</div>
                              </div>
                            </div>
                            {member.id === currentUser?.id ? (
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Lead (You)</span>
                            ) : (
                              <button type="button" onClick={() => setMembers(members.filter(m => m.id !== member.id))} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {createError && (
                  <div className="text-red-500 text-center text-lg font-['Arimo']">{createError}</div>
                )}

                <div className="flex justify-end mt-8">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className={`w-full md:w-72 h-16 bg-gray-950 rounded-md flex items-center justify-center text-white text-xl font-normal font-['Arimo'] transition shadow-lg ${isCreating ? "opacity-70 cursor-not-allowed" : "hover:bg-gray-800"}`}
                  >
                    {isCreating ? "Creating..." : (step === 1 ? "Next" : "Create Project")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showManagerDeadlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manager Deadlines</h2>
                <p className="text-sm text-gray-500">{managerProject?.title || "Project"}</p>
              </div>
              <button
                className="text-2xl text-gray-400 hover:text-gray-700"
                onClick={() => setShowManagerDeadlineModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[80vh] overflow-y-auto">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Create Deadline</h3>
                {!managerLoading && managerWorkflows.length === 0 && (
                  <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    No workflows found. Create a workflow first, then create deadlines.
                  </div>
                )}
                <form className="space-y-3" onSubmit={handleCreateManagerDeadline}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
                      value={deadlineTitle}
                      onChange={(e) => setDeadlineTitle(e.target.value)}
                      placeholder="Release candidate"
                      disabled={!canManageDeadlines || managerLoading || creatingDeadline || managerWorkflows.length === 0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Workflow</label>
                    <select
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
                      value={deadlineWorkflowId}
                      onChange={(e) => setDeadlineWorkflowId(e.target.value)}
                      disabled={!canManageDeadlines || managerLoading || creatingDeadline || managerWorkflows.length === 0}
                    >
                      <option value="">Select workflow...</option>
                      {managerWorkflows.map((workflow) => (
                        <option key={workflow.id} value={workflow.id}>
                          {workflow.name || workflow.title || "Untitled workflow"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
                    <select
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
                      value={deadlineAssignee}
                      onChange={(e) => setDeadlineAssignee(e.target.value)}
                      disabled={!canManageDeadlines || managerLoading || creatingDeadline || managerWorkflows.length === 0}
                    >
                      <option value="">Select member...</option>
                      {managerMembers.map((member) => (
                        <option key={member.id} value={member.username}>
                          {member.full_name || member.username} ({member.username})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due date</label>
                    <input
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      disabled={!canManageDeadlines || managerLoading || creatingDeadline || managerWorkflows.length === 0}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!canManageDeadlines || managerLoading || creatingDeadline || managerWorkflows.length === 0}
                    className="w-full mt-1 bg-black text-white rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-60"
                  >
                    {creatingDeadline ? "Creating..." : "Create Deadline"}
                  </button>
                </form>
              </div>

              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Existing Deadlines</h3>
                {managerLoading ? (
                  <div className="text-sm text-gray-500">Loading deadlines...</div>
                ) : managerDeadlines.length === 0 ? (
                  <div className="text-sm text-gray-500">No deadlines found for this project.</div>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {managerDeadlines.map((deadline) => {
                      const draft = getDeadlineDraft(deadline);
                      return (
                      <div key={deadline.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <input
                          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm font-semibold text-gray-900"
                          value={draft.title}
                          onChange={(e) => updateDeadlineDraft(deadline.id, { title: e.target.value })}
                          disabled={!isCurrentUserProjectLead || updatingDeadlineId === deadline.id || deletingDeadlineId === deadline.id}
                        />
                        <div className="text-xs text-gray-600 mt-1">
                          Workflow: {deadline.workflow?.name || deadline.workflow?.title || "Untitled"}
                        </div>
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="date"
                            min={new Date().toISOString().slice(0, 10)}
                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-black"
                            value={draft.due_date}
                            onChange={(e) => updateDeadlineDraft(deadline.id, { due_date: e.target.value })}
                            disabled={!isCurrentUserProjectLead || updatingDeadlineId === deadline.id || deletingDeadlineId === deadline.id}
                          />
                          <select
                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-black"
                            value={draft.assigned_to}
                            onChange={(e) => updateDeadlineDraft(deadline.id, { assigned_to: e.target.value })}
                            disabled={!isCurrentUserProjectLead || updatingDeadlineId === deadline.id || deletingDeadlineId === deadline.id}
                          >
                            <option value="">Select member...</option>
                            {managerMembers.map((member) => (
                              <option key={member.id} value={member.username}>
                                {member.full_name || member.username}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <select
                            className="rounded-md border border-gray-300 px-2 py-1 text-xs text-black bg-white"
                            value={deadline.status || "pending"}
                            onChange={(e) => handleUpdateDeadlineStatus(deadline, e.target.value)}
                            disabled={!isCurrentUserProjectLead || updatingDeadlineId === deadline.id || deletingDeadlineId === deadline.id}
                          >
                            <option value="pending">pending</option>
                            <option value="in_progress">in_progress</option>
                            <option value="completed">completed</option>
                          </select>
                          <button
                            type="button"
                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 hover:bg-gray-100 disabled:opacity-60"
                            onClick={() => handleSaveDeadlineEdits(deadline)}
                            disabled={!isCurrentUserProjectLead || updatingDeadlineId === deadline.id || deletingDeadlineId === deadline.id}
                          >
                            {updatingDeadlineId === deadline.id ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100 disabled:opacity-60"
                            onClick={() => handleDeleteDeadline(deadline)}
                            disabled={!isCurrentUserProjectLead || updatingDeadlineId === deadline.id || deletingDeadlineId === deadline.id}
                          >
                            {deletingDeadlineId === deadline.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    )})}
                  </div>
                )}
              </div>

              {managerError && (
                <div className="lg:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {managerError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Edit Project</h2>
            <form onSubmit={handleUpdateProject} className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                <input
                  className="w-full h-12 bg-zinc-100 rounded-lg px-4 text-lg border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-black"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Color</label>
                <div className="flex gap-2 flex-wrap">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setProjectColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${projectColor === color ? "border-black scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-red-600">!</span>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Delete Project?</h2>
            <p className="text-gray-500 mb-8">
              Are you sure you want to delete <span className="font-bold text-gray-800">&quot;{projectToDelete?.title}&quot;</span>? This action cannot be undone and will remove all workflows and files.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-3 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
