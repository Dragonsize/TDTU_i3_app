"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Link from "next/link";


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

  if (loading || userLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!project) return <div className="min-h-screen flex items-center justify-center">Project not found.</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full h-16 bg-white/60 border-b border-black/10 flex items-center justify-between px-8 lg:px-32 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-gray-950 rounded-lg"></div>
            <span className="text-neutral-950 text-xl font-bold font-['Arimo']">A+ Flow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-base text-gray-500">
            <Link href="/project" className="font-['Inter'] text-black font-medium">Project</Link>
            <Link href="/chatbot" className="font-['Arimo'] hover:text-black cursor-pointer">ChatBot</Link>
            <Link href="/chat" className="font-['Arimo'] hover:text-black cursor-pointer">Chat</Link>
            <Link href="/files" className="font-['Arimo'] hover:text-black cursor-pointer">Files</Link>
          </nav>
        </div>
          <Link href="/settings" className="flex items-center gap-2" title="Settings">
            <div className="px-3.5 py-1.5 rounded-md flex justify-center items-center gap-1.5 hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden">
                {currentUser?.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="User" className="w-full h-full object-cover" />
                ) : (
                  currentUser && (currentUser.full_name?.[0]?.toUpperCase() || currentUser.email?.[0]?.toUpperCase())
                )}
              </div>
              <div className="text-center justify-start text-neutral-950 text-xs font-normal font-['Arimo'] leading-4">
                {currentUser?.full_name || ""}
              </div>
            </div>
          </Link>
      </header>

      <main className="max-w-[1440px] mx-auto p-8 lg:px-32 py-12">
        {/* Project Info */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-normal font-['Habibi'] text-neutral-950 mb-8">{project.title}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="relative w-[95vw] max-w-[540px] h-[70vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="w-full h-14 px-6 bg-white/60 border-b border-black/10 flex items-center justify-between">
                      <span className="text-neutral-950 text-lg font-bold font-['Arimo']">Deadlines</span>
                      <button className="text-2xl text-gray-400 hover:text-gray-700" onClick={() => setShowDeadlineModal(false)}>&times;</button>
                    </div>
                    {/* Modal Content */}
                    <div className="flex-1 bg-white flex flex-col items-center pt-6">
                      <div className="w-full flex flex-col items-center">
                        <div className="w-full max-w-[420px] h-[340px] bg-zinc-300 rounded-[16px] mx-auto relative p-4 overflow-y-auto">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-[95vw] max-w-[540px] h-[70vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="w-full h-14 px-6 bg-white/60 border-b border-black/10 flex items-center justify-between">
              <span className="text-neutral-950 text-lg font-bold font-['Arimo']">Workspace</span>
              <button className="text-2xl text-gray-400 hover:text-gray-700" onClick={() => setShowWorkspaceModal(false)}>&times;</button>
            </div>
            {/* Modal Content */}
            <div className="flex-1 bg-white flex flex-col items-center pt-6">
              <div className="w-full flex flex-col items-center">
                <div className="w-full max-w-[420px] h-[340px] bg-zinc-300 rounded-[16px] mx-auto relative p-4 overflow-y-auto">
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
                    onClick={() => setShowCreateFlowModal(true)}
                  >
                    + Create Flow
                  </button>
                      {/* Create Flow Modal */}
                      {showCreateFlowModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                          <div className="relative w-[95vw] max-w-[480px] h-[70vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="w-full h-14 px-6 bg-white/60 border-b border-black/10 flex items-center justify-between">
                              <span className="text-neutral-950 text-lg font-bold font-['Arimo']">Create Workspace Flow</span>
                              <button className="text-2xl text-gray-400 hover:text-gray-700" onClick={() => setShowCreateFlowModal(false)}>&times;</button>
                            </div>
                            {/* Modal Content */}
                            <form className="flex-1 bg-white flex flex-col items-center pt-6 px-6" onSubmit={handleCreateFlowSubmit}>
                              <div className="w-full flex flex-col gap-4">
                                <label className="text-black text-base font-normal font-['Arimo']">Flow Name</label>
                                <input type="text" className="w-full rounded-md border border-gray-300 px-3 py-2 text-base" value={newFlowName} onChange={e => setNewFlowName(e.target.value)} required />
                                <label className="text-black text-base font-normal font-['Arimo']">Description</label>
                                <textarea className="w-full rounded-md border border-gray-300 px-3 py-2 text-base" value={newFlowDesc} onChange={e => setNewFlowDesc(e.target.value)} />
                                <label className="text-black text-base font-normal font-['Arimo']">Deadline</label>
                                <input type="date" className="w-full rounded-md border border-gray-300 px-3 py-2 text-base" value={newFlowDeadline} onChange={e => setNewFlowDeadline(e.target.value)} required />
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
        <div className="bg-zinc-300 rounded-[20px] p-6 min-h-[400px]">
          <div className="text-white text-2xl font-bold mb-6 px-2">Members</div>
          <div className="flex flex-col gap-4">
            {members.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">No members found</div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="w-full bg-stone-500 rounded-[20px] flex items-center px-8 py-4 relative">
                  <div className="text-black text-xl md:text-2xl font-normal font-['ABeeZee']">
                    {member.full_name || member.username} 
                    <span className="text-lg opacity-70 ml-2">({member.username})</span>
                    {member.role && <span className="text-sm ml-2 opacity-60 uppercase">- {member.role}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        // ...existing code...
        // Workspace Flow Creation Backend Integration
        // (Moved to top of ProjectDetailPage)
                if (!workflowRes.ok) throw new Error("Failed to create workflow");
          const workflow = await workflowRes.json();
          // 2. Assign members
          for (const memberId of selectedFlowMembers) {
            const member = members.find(m => m.id === memberId);
            if (!member) continue;
            await fetch(`/api/workflows/${workflow.id}/members`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: member.username, role: member.role || "member" })
            });
          }
          // 3. Create deadline (assign to lead or first member)
          const deadlineAssignee = members.find(m => m.id === selectedFlowMembers[0]);
          await fetch(`/api/workflows/${workflow.id}/deadlines`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `${newFlowName} Deadline`, due_date: newFlowDeadline, assigned_to: deadlineAssignee.username })
          });
          // 4. Refresh workspace list
          setShowCreateFlowModal(false);
          setNewFlowName("");
          setNewFlowDesc("");
          setNewFlowDeadline("");
          setSelectedFlowMembers([]);
          // Optionally, refetch workspaces
          setWorkspaceLoading(true);
          fetch(`/api/projects/${id}/workflows`, { credentials: "include" })
            .then(res => res.json())
            .then(data => setWorkspaces(Array.isArray(data) ? data : []))
            .catch(() => setWorkspaces([]))
            .finally(() => setWorkspaceLoading(false));
        } catch (err) {
          alert("Failed to create workspace flow: " + err.message);
        }
      };
      </main>
    </div>
  );
}
