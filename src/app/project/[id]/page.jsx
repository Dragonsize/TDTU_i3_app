"use client";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${id}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setProject(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!project) return <div className="min-h-screen flex items-center justify-center">Project not found.</div>;

  return (
    <div className="w-[1440px] h-[900px] relative bg-white overflow-hidden mx-auto">
      <div className="w-[1438.96px] h-16 px-32 pb-px left-[-1.43px] top-[0.08px] absolute bg-white/60 border-b border-black/10 inline-flex flex-col justify-between items-center">
        <div className="w-[1387px] h-9 inline-flex justify-between items-start">
          <div className="w-[589px] h-7 flex justify-between items-center">
            <div className="w-24 h-7 flex justify-start items-center gap-1.5">
              <div className="w-7 h-7 relative bg-gray-950 rounded-lg"></div>
              <div className="flex-1 h-5 relative">
                <div className="left-0 top-[-1px] absolute justify-start text-neutral-950 text-xl font-bold font-['Arimo'] leading-5">A+ Flow</div>
              </div>
            </div>
            <div className="w-96 h-5 flex justify-start items-center gap-5">
              <div className="w-24 inline-flex flex-col justify-center items-center gap-2.5">
                <div className="justify-start text-gray-500 text-base font-normal font-['Inter'] leading-5">Project</div>
              </div>
              <div className="w-24 self-stretch inline-flex flex-col justify-center items-center gap-2.5">
                <div className="justify-start text-gray-500 text-base font-normal font-['Arimo'] leading-5">ChatBot</div>
              </div>
              <div className="w-24 self-stretch inline-flex flex-col justify-center items-center gap-2.5">
                <div className="justify-start text-gray-500 text-base font-normal font-['Arimo'] leading-5">Chat</div>
              </div>
              <div className="w-24 inline-flex flex-col justify-center items-center gap-2.5">
                <div className="justify-start text-gray-500 text-base font-normal font-['Arimo'] leading-5">File </div>
              </div>
            </div>
          </div>
          <div className="w-20 h-8 flex justify-start items-center gap-3.5">
            <div className="w-16 h-8 px-3.5 py-1.5 rounded-md flex justify-center items-center gap-1.5">
              <img className="w-10 h-10" src="https://placehold.co/41x41" />
              <div className="text-center justify-start text-neutral-950 text-xs font-normal font-['Arimo'] leading-4">User</div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-60 left-[39px] top-[97px] absolute text-center justify-center text-neutral-950 text-4xl font-normal font-['Habibi']">{project.title}</div>
      <div className="w-60 left-[223px] top-[162px] absolute text-center justify-start text-black text-2xl font-normal font-['Habibi']">{project.created_at ? new Date(project.created_at).toLocaleDateString("en-GB") : "-"}</div>
      <div className="w-60 left-[770px] top-[546px] absolute text-center justify-start text-white text-2xl font-normal font-['Habibi']">{project.deadline_count || 0}</div>
      <div className="w-60 left-[190px] top-[225px] absolute text-center justify-start text-black text-2xl font-normal font-['Habibi']">{project.status === "active" ? "In process" : project.status}</div>
      <div className="w-44 h-14 px-3.5 py-1.5 left-[1190px] top-[373px] absolute bg-black rounded-md inline-flex justify-center items-center gap-1.5">
        <div className="text-center justify-start text-white text-base font-normal font-['Arimo'] leading-4">Manager Deadline</div>
      </div>
      <div className="w-44 h-14 px-3.5 py-1.5 left-[46px] top-[401px] absolute bg-black rounded-md inline-flex justify-center items-center gap-1.5">
        <div className="flex justify-center items-center gap-2.5">
          <div className="text-center justify-start text-white text-base font-normal font-['Arimo'] leading-4">Member list</div>
        </div>
      </div>
      <div className="w-44 h-14 px-3.5 py-1.5 left-[973px] top-[372px] absolute bg-black rounded-md inline-flex justify-center items-center gap-1.5">
        <div className="text-center justify-start text-white text-base font-normal font-['Arimo'] leading-4">Manage workspace</div>
      </div>
      <div className="left-[112px] top-[226px] absolute text-center justify-start text-black text-2xl font-normal font-['Habibi']">Status</div>
      <div className="left-[110px] top-[163px] absolute text-center justify-start text-black text-2xl font-normal font-['Habibi']">Day Create</div>
      <div className="w-9 left-[1249px] top-[461px] absolute text-center justify-center text-stone-200 text-5xl font-normal font-['IM_FELL_Great_Primer_SC']">...</div>
      <div className="left-[96px] top-[290px] absolute text-center justify-start text-black text-2xl font-normal font-['Arimo'] leading-4">Creater by</div>
      <div className="left-[247px] top-[293px] absolute text-center justify-start text-black text-base font-normal font-['Arimo'] leading-4">{project.lead_name || "-"}</div>
      <div className="w-[1345px] h-96 left-[51px] top-[450px] absolute bg-zinc-300"></div>
      <div className="w-[1177px] h-24 left-[138px] top-[474px] absolute bg-stone-500 rounded-[20px]"></div>
      <div className="w-96 left-[138px] top-[506px] absolute text-center justify-start text-black text-2xl font-normal font-['ABeeZee']">{project.lead_name || "-"}({project.lead_id || "-"})</div>
    </div>
  );
}
