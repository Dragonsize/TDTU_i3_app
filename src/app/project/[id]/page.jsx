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
          <button className="px-6 py-3 bg-black rounded-md text-white text-base font-normal font-['Arimo'] hover:bg-gray-800 transition">Member list</button>
          <button className="px-6 py-3 bg-black rounded-md text-white text-base font-normal font-['Arimo'] hover:bg-gray-800 transition">Manage workspace</button>
          <button className="px-6 py-3 bg-black rounded-md text-white text-base font-normal font-['Arimo'] hover:bg-gray-800 transition">Manager Deadline</button>
        </div>

        {/* Member List */}
        <div className="bg-zinc-300 rounded-[20px] p-6 min-h-[400px]">
          <h2 className="text-2xl font-bold mb-6 px-2">Members</h2>
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
      </main>
    </div>
  );
}
