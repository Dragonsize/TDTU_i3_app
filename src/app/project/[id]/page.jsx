"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id;
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
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
        console.error("Error loading project:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!project) return <div className="min-h-screen flex items-center justify-center">Project not found.</div>;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center overflow-auto">
      <div className="w-[1440px] h-[900px] relative bg-white overflow-hidden shadow-lg shrink-0">
      <div className="w-[1438.96px] h-16 px-32 pb-px left-[-1.43px] top-[0.08px] absolute bg-white/60 border-b border-black/10 inline-flex flex-col justify-between items-center z-10">
        <div className="w-[1387px] h-9 inline-flex justify-between items-start">
          <div className="w-[589px] h-7 flex justify-between items-center">
            <Link href="/dashboard" className="w-24 h-7 flex justify-start items-center gap-1.5 cursor-pointer">
              <div className="w-7 h-7 relative bg-gray-950 rounded-lg"></div>
              <div className="flex-1 h-5 relative">
                <div className="left-0 top-[-1px] absolute justify-start text-neutral-950 text-xl font-bold font-['Arimo'] leading-5">A+ Flow</div>
              </div>
            </Link>
            <div className="w-96 h-5 flex justify-start items-center gap-5">
              <Link href="/project" className="w-24 inline-flex flex-col justify-center items-center gap-2.5 cursor-pointer">
                <div className="justify-start text-gray-500 text-base font-normal font-['Inter'] leading-5 hover:text-black">Project</div>
              </Link>
              <Link href="/chatbot" className="w-24 self-stretch inline-flex flex-col justify-center items-center gap-2.5 cursor-pointer">
                <div className="justify-start text-gray-500 text-base font-normal font-['Arimo'] leading-5 hover:text-black">ChatBot</div>
              </Link>
              <Link href="/chat" className="w-24 self-stretch inline-flex flex-col justify-center items-center gap-2.5 cursor-pointer">
                <div className="justify-start text-gray-500 text-base font-normal font-['Arimo'] leading-5 hover:text-black">Chat</div>
              </Link>
              <Link href="/files" className="w-24 inline-flex flex-col justify-center items-center gap-2.5 cursor-pointer">
                <div className="justify-start text-gray-500 text-base font-normal font-['Arimo'] leading-5 hover:text-black">File </div>
              </Link>
            </div>
          </div>
          <div className="w-20 h-8 flex justify-start items-center gap-3.5">
            <div className="w-16 h-8 px-3.5 py-1.5 rounded-md flex justify-center items-center gap-1.5">
              <img className="w-10 h-10 rounded-full" src="https://placehold.co/41x41" alt="User" />
              <div className="text-center justify-start text-neutral-950 text-xs font-normal font-['Arimo'] leading-4">User</div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Details */}
      <div className="w-60 left-[39px] top-[97px] absolute text-center justify-center text-neutral-950 text-4xl font-normal font-['Habibi']">{project.title}</div>
      
      <div className="left-[110px] top-[163px] absolute text-center justify-start text-black text-2xl font-normal font-['Habibi']">Day Create</div>
      <div className="w-60 left-[223px] top-[162px] absolute text-center justify-start text-black text-2xl font-normal font-['Habibi']">{project.created_at ? new Date(project.created_at).toLocaleDateString("en-GB") : "-"}</div>
      
      <div className="left-[112px] top-[226px] absolute text-center justify-start text-black text-2xl font-normal font-['Habibi']">Status</div>
      <div className="w-60 left-[190px] top-[225px] absolute text-center justify-start text-black text-2xl font-normal font-['Habibi']">{project.status === "active" ? "In process" : project.status}</div>
      
      <div className="left-[96px] top-[290px] absolute text-center justify-start text-black text-2xl font-normal font-['Arimo'] leading-4">Created by</div>
      <div className="left-[247px] top-[293px] absolute text-center justify-start text-black text-base font-normal font-['Arimo'] leading-4">{project.creator?.full_name || project.creator?.username || "Unknown"}</div>

      {/* Action Buttons */}
      <div className="w-44 h-14 px-3.5 py-1.5 left-[1190px] top-[373px] absolute bg-black rounded-md inline-flex justify-center items-center gap-1.5 cursor-pointer hover:bg-gray-800 transition">
        <div className="text-center justify-start text-white text-base font-normal font-['Arimo'] leading-4">Manager Deadline</div>
      </div>
      <div className="w-44 h-14 px-3.5 py-1.5 left-[46px] top-[401px] absolute bg-black rounded-md inline-flex justify-center items-center gap-1.5 cursor-pointer hover:bg-gray-800 transition">
        <div className="flex justify-center items-center gap-2.5">
          <div className="text-center justify-start text-white text-base font-normal font-['Arimo'] leading-4">Member list</div>
        </div>
      </div>
      <div className="w-44 h-14 px-3.5 py-1.5 left-[973px] top-[372px] absolute bg-black rounded-md inline-flex justify-center items-center gap-1.5 cursor-pointer hover:bg-gray-800 transition">
        <div className="text-center justify-start text-white text-base font-normal font-['Arimo'] leading-4">Manage workspace</div>
      </div>

      {/* Member List */}
      <div className="w-[1345px] h-96 left-[51px] top-[450px] absolute bg-zinc-300 rounded-lg overflow-y-auto p-6 flex flex-col gap-4">
        {members.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">No members found</div>
        ) : (
          members.map((member) => (
            <div key={member.id} className="w-[1177px] h-24 bg-stone-500 rounded-[20px] flex items-center px-8 shrink-0 mx-auto relative">
              <div className="text-black text-2xl font-normal font-['ABeeZee']">
                {member.full_name || member.username} <span className="text-lg opacity-70">({member.username})</span>
                {member.role && <span className="text-sm ml-2 opacity-60 uppercase">- {member.role}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </div>
  );
}
