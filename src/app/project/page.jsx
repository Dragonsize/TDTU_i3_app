"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function ProjectPage() {
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects from API on load
  useEffect(() => {
    fetch("/api/projects", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch projects", err);
        setLoading(false);
      });
  }, []);

  // Handle creating a new project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: projectName }),
        credentials: "include",
      });
      if (res.ok) {
        const newProject = await res.json();
        setProjects([...projects, newProject]); // Add new project to list
        setShowModal(false);
        setProjectName("");
      }
    } catch (error) {
      console.error("Failed to create project", error);
    }
  };

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
            <Link href="/file" className="font-['Arimo'] hover:text-black cursor-pointer">File</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 border-2 border-white overflow-hidden">
            <img className="w-full h-full object-cover" src="https://placehold.co/41x41" alt="User" />
          </div>
          <div className="text-neutral-950 text-xs font-normal font-['Arimo'] hidden sm:block">User</div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto p-8 lg:px-32 py-12">
        {/* Search and Action Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="relative w-full md:w-2/3">
            <div className="w-full h-16 bg-zinc-300 rounded-[20px] flex items-center px-6">
              <span className="text-black/40 text-xl font-normal font-['Arimo']">Search Your project</span>
            </div>
          </div>
          <button
            className="w-full md:w-48 h-16 flex items-center justify-center text-black text-xl font-normal font-['IM_FELL_Great_Primer_SC'] bg-zinc-300 rounded-[20px] border border-gray-300 cursor-pointer hover:bg-zinc-400 transition shadow-sm"
            type="button"
            onClick={() => setShowModal(true)}
          >
            NEW PROJECT
          </button>
        </div>

        {/* Project Table */}
        <div className="bg-zinc-300 rounded-[20px] p-6 min-h-[580px]">
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
            ) : (
              projects.map((project) => (
                <div key={project.id} className="bg-stone-500 rounded-[20px] p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-white">
                  <div className="col-span-4 text-xl md:text-2xl font-normal font-['Habibi'] truncate">{project.title}</div>
                  <div className="col-span-2 text-center text-xl md:text-2xl font-normal font-['Habibi']">
                    {project.created_at ? new Date(project.created_at).toLocaleDateString() : "N/A"}
                  </div>
                  <div className="col-span-2 text-center text-xl md:text-2xl font-normal font-['Habibi'] capitalize">{project.status || "Active"}</div>
                  <div className="col-span-2 text-center text-xl md:text-2xl font-normal font-['Habibi']">-</div>
                  <div className="col-span-2 flex justify-end items-center gap-4">
                    <button className="px-3.5 py-1.5 bg-black rounded-md text-white text-xs font-normal font-['Arimo'] hover:bg-gray-800">
                      Manager Deadline
                    </button>
                    <button className="text-stone-200 text-2xl font-bold pb-2">...</button>
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
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-12 flex flex-col items-center justify-center">
              <h2 className="text-black text-4xl md:text-5xl font-normal font-['IM_FELL_Great_Primer_SC'] mb-12 text-center">Create Project</h2>
              <form
                className="w-full max-w-2xl flex flex-col gap-8"
                onSubmit={handleCreateProject}
              >
                <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
                  <label htmlFor="projectName" className="text-black text-2xl font-normal font-['Habibi'] whitespace-nowrap">Name of Project:</label>
                  <input
                    id="projectName"
                    className="w-full md:w-96 h-16 bg-zinc-300 rounded-[10px] px-6 text-2xl font-normal font-['Habibi'] text-stone-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    placeholder="Enter Name of Project"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex justify-end mt-8">
                  <button
                    type="submit"
                    className="w-full md:w-72 h-16 bg-gray-950 rounded-md flex items-center justify-center text-white text-xl font-normal font-['Arimo'] hover:bg-gray-800 transition shadow-lg"
                  >
                    Next
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
