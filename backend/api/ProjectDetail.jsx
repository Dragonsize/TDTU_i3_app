import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch project details and members in parallel
        const [projRes, memRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/members`)
        ]);

        if (projRes.ok && memRes.ok) {
          const projData = await projRes.json();
          const memData = await memRes.json();
          setProject(projData);
          setMembers(memData);
        } else {
          console.error("Failed to fetch project data");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchData();
  }, [projectId]);

  if (loading) return <div className="p-10">Loading...</div>;
  if (!project) return <div className="p-10">Project not found</div>;

  return (
    <div className="w-[1440px] h-[900px] relative bg-white overflow-hidden mx-auto shadow-lg my-4">
      {/* Header */}
      <div className="w-[1438.96px] h-16 px-32 pb-px left-[-1.43px] top-[0.08px] absolute bg-white/60 border-b border-black/10 inline-flex flex-col justify-between items-center">
        <div className="w-[1387px] h-9 inline-flex justify-between items-start mt-3">
          <div className="w-[589px] h-7 flex justify-between items-center">
            <div className="w-24 h-7 flex justify-start items-center gap-1.5">
              <div className="w-7 h-7 relative bg-gray-950 rounded-lg"></div>
              <div className="flex-1 h-5 relative">
                <div className="left-0 top-[-1px] absolute justify-start text-neutral-950 text-xl font-bold font-['Arimo'] leading-5">
                  {project.title}
                </div>
              </div>
            </div>
            {/* Navigation Links */}
            <div className="w-96 h-5 flex justify-start items-center gap-5">
              <div className="w-24 inline-flex flex-col justify-center items-center gap-2.5"><div className="text-gray-500 text-base font-normal font-['Inter']">Project</div></div>
              <div className="w-24 inline-flex flex-col justify-center items-center gap-2.5"><div className="text-gray-500 text-base font-normal font-['Arimo']">ChatBot</div></div>
              <div className="w-24 inline-flex flex-col justify-center items-center gap-2.5"><div className="text-gray-500 text-base font-normal font-['Arimo']">Chat</div></div>
              <div className="w-24 inline-flex flex-col justify-center items-center gap-2.5"><div className="text-gray-500 text-base font-normal font-['Arimo']">File</div></div>
            </div>
          </div>
          <div className="w-20 h-8 flex justify-start items-center gap-3.5">
            <div className="w-16 h-8 px-3.5 py-1.5 rounded-md flex justify-center items-center gap-1.5">
              <img className="w-10 h-10 rounded-full" src="https://placehold.co/41x41" alt="User" />
              <div className="text-center text-neutral-950 text-xs font-normal font-['Arimo']">User</div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="w-full left-[39px] top-[97px] absolute text-left text-neutral-950 text-4xl font-normal font-['Habibi']">
        {project.title}
      </div>
      
      <div className="left-[110px] top-[163px] absolute text-black text-2xl font-normal font-['Habibi']">Day Create</div>
      <div className="w-60 left-[223px] top-[162px] absolute text-black text-2xl font-normal font-['Habibi']">
        {new Date(project.created_at).toLocaleDateString()}
      </div>

      <div className="left-[112px] top-[226px] absolute text-black text-2xl font-normal font-['Habibi']">Status</div>
      <div className="w-60 left-[190px] top-[225px] absolute text-black text-2xl font-normal font-['Habibi']">
        {project.status}
      </div>

      <div className="left-[96px] top-[290px] absolute text-black text-2xl font-normal font-['Arimo'] leading-4">Created by</div>
      <div className="left-[247px] top-[293px] absolute text-black text-base font-normal font-['Arimo'] leading-4">
        {project.creator?.full_name || 'Unknown'}
      </div>

      {/* Action Buttons */}
      <div className="w-44 h-14 px-3.5 py-1.5 left-[46px] top-[401px] absolute bg-black rounded-md inline-flex justify-center items-center gap-1.5 cursor-pointer">
        <div className="text-white text-base font-normal font-['Arimo']">Member list</div>
      </div>
      <div className="w-44 h-14 px-3.5 py-1.5 left-[973px] top-[372px] absolute bg-black rounded-md inline-flex justify-center items-center gap-1.5 cursor-pointer">
        <div className="text-white text-base font-normal font-['Arimo']">Manage workspace</div>
      </div>
      <div className="w-44 h-14 px-3.5 py-1.5 left-[1190px] top-[373px] absolute bg-black rounded-md inline-flex justify-center items-center gap-1.5 cursor-pointer">
        <div className="text-white text-base font-normal font-['Arimo']">Manager Deadline</div>
      </div>

      {/* Dynamic Member List */}
      {/* I converted the absolute list to a flex container so it handles multiple members properly */}
      <div className="w-[1345px] h-96 left-[51px] top-[450px] absolute bg-zinc-300 rounded-lg overflow-y-auto p-8 flex flex-col gap-4">
        {members.map((member) => (
          <div key={member.id} className="w-[1177px] h-24 bg-stone-500 rounded-[20px] flex items-center px-8 shrink-0 mx-auto">
            <div className="text-black text-2xl font-normal font-['ABeeZee']">
              {member.full_name} ({member.username}) <span className="text-sm opacity-70">- {member.role}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}