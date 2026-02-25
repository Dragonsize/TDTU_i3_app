"use client";
import React, { useState } from "react";

export default function ProjectPage() {
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  return (
    <div className="min-h-screen bg-white overflow-x-auto">
      {/* Header */}
      <header className="w-full h-16 bg-white/60 border-b border-black/10 flex items-center px-32 pb-px">
        <div className="w-full flex justify-between items-center">
          {/* Logo and Nav */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 bg-gray-950 rounded-lg"></div>
              <span className="text-neutral-950 text-xl font-bold font-['Arimo']">A+ Flow</span>
            </div>
            <nav className="flex items-center gap-5 text-base text-gray-500">
              <span className="font-['Inter']">Project</span>
              <span className="font-['Arimo']">ChatBot</span>
              <span className="font-['Arimo']">Chat</span>
              <span className="font-['Arimo']">File</span>
            </nav>
          </div>
          {/* User Avatar Placeholder */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 border-2 border-white">
              <img className="w-10 h-10 rounded-full object-cover" src="https://placehold.co/41x41" alt="User" />
            </div>
            <div className="text-neutral-950 text-xs font-normal font-['Arimo']">User</div>
          </div>
        </div>
      </header>

      {/* Search Bar and New Project */}
      <div className="relative max-w-[1440px] mx-auto">
        <div className="absolute left-[100.92px] top-[168.85px] w-[1034px] h-16 bg-zinc-300 rounded-[20px]"></div>
        <div className="absolute left-[127.55px] top-[190.08px] text-black/40 text-4xl font-normal font-['Arimo'] leading-4">Search Your project</div>
        <div className="absolute left-[1148.90px] top-[163.12px] w-48 h-16 bg-zinc-300 rounded-[20px]"></div>
        <div className="absolute left-[1148.90px] top-[163.12px] w-48 h-16 bg-zinc-300 rounded-[20px] flex items-center justify-center">
          <button
            className="w-44 h-14 flex items-center justify-center text-black text-xl font-normal font-['IM_FELL_Great_Primer_SC'] bg-zinc-300 rounded-[20px] border border-gray-300 cursor-pointer hover:bg-zinc-400 transition"
            type="button"
            onClick={() => setShowModal(true)}
          >
            NEW PROJECT
          </button>
        </div>

        {/* Modal for creating new project (updated to match sample) */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-[1440px] h-[900px] relative bg-white overflow-hidden rounded-xl shadow-lg flex flex-col">
              {/* Modal header bar */}
              <div className="w-full h-16 px-32 pb-px bg-white/60 border-b border-black/10 flex items-center justify-between relative">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 bg-gray-950 rounded-lg"></div>
                  <span className="text-neutral-950 text-xl font-bold font-['Arimo']">A+ Flow</span>
                </div>
                <nav className="flex items-center gap-5 text-base text-gray-500">
                  <span className="font-['Inter']">Project</span>
                  <span className="font-['Arimo']">ChatBot</span>
                  <span className="font-['Arimo']">Chat</span>
                  <span className="font-['Arimo']">File</span>
                </nav>
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 border-2 border-white">
                    <img className="w-10 h-10 rounded-full object-cover" src="https://placehold.co/41x41" alt="User" />
                  </div>
                  <div className="text-neutral-950 text-xs font-normal font-['Arimo']">User</div>
                </div>
                <button
                  className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-700 z-10"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              {/* Modal Title */}
              <div className="flex-1 flex flex-col justify-center items-center relative">
                <div className="w-full max-w-2xl mx-auto">
                  <div className="text-black text-5xl font-normal font-['IM_FELL_Great_Primer_SC'] mb-16 mt-8">Create Project</div>
                  <form
                    className="flex flex-col items-center gap-8"
                    onSubmit={e => { e.preventDefault(); setShowModal(false); }}
                  >
                    <div className="flex flex-row items-center gap-6 w-full justify-center">
                      <label htmlFor="projectName" className="text-black text-2xl font-normal font-['Habibi'] whitespace-nowrap">Name of Project:</label>
                      <input
                        id="projectName"
                        className="w-96 h-16 bg-zinc-300 rounded-[10px] px-4 text-2xl font-normal font-['Habibi'] text-stone-600 focus:outline-none"
                        placeholder="Enter Name of Project"
                        value={projectName}
                        onChange={e => setProjectName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-72 h-16 bg-gray-950 rounded-md flex items-center justify-center mt-16 ml-auto text-white text-xl font-normal font-['Arimo'] hover:bg-gray-800 transition"
                    >
                      Next
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Headers */}
        <div className="absolute left-[138px] top-[272px] w-[1177px] h-16 bg-white rounded-[20px]"></div>
        <div className="absolute left-[168px] top-[288px] text-black text-2xl font-normal font-['Habibi']">Name Project</div>
        <div className="absolute left-[516px] top-[288px] text-black text-2xl font-normal font-['Habibi']">Day Create</div>
        <div className="absolute left-[706px] top-[288px] text-black text-2xl font-normal font-['Habibi']">Status</div>
        <div className="absolute left-[855px] top-[288px] text-black text-2xl font-normal font-['Habibi']">Deadline</div>

        {/* Table Divider */}
        <div className="absolute left-[101.35px] top-[247.84px] w-[1235px] h-0 outline outline-1 outline-offset-[-0.5px] outline-black"></div>

        {/* Project Rows */}
        {/* Row 1 */}
        <div className="absolute left-[138px] top-[364px] w-[1165px] h-16 bg-stone-500 rounded-[20px]"></div>
        <div className="absolute left-[114px] top-[383px] w-60 text-center text-white text-2xl font-normal font-['Habibi']">Robot Lau sàn</div>
        <div className="absolute left-[478px] top-[383px] w-60 text-center text-white text-2xl font-normal font-['Habibi']">12/01/2026</div>
        <div className="absolute left-[634px] top-[383px] w-60 text-center text-white text-2xl font-normal font-['Habibi']">In process</div>
        <div className="absolute left-[783px] top-[383px] w-60 text-center text-white text-2xl font-normal font-['Habibi']">3</div>
        <div className="absolute left-[1119px] top-[383px] w-28 h-8 px-3.5 py-1.5 bg-black rounded-md flex items-center justify-center">
          <div className="text-white text-xs font-normal font-['Arimo']">Manager Deadline</div>
        </div>
        <div className="absolute left-[1245px] top-[356px] w-9 text-center text-stone-200 text-5xl font-normal font-['IM_FELL_Great_Primer_SC']">...</div>

        {/* Row 2 */}
        <div className="absolute left-[138px] top-[466px] w-[1165px] h-16 bg-stone-500 rounded-[20px]"></div>
        <div className="absolute left-[138px] top-[485px] w-80 text-center text-white text-2xl font-normal font-['Habibi']">Phần mềm máy tính cầm tay</div>
        <div className="absolute left-[478px] top-[485px] w-60 text-center text-white text-2xl font-normal font-['Habibi']">1/12/2025</div>
        <div className="absolute left-[634px] top-[485px] w-60 text-center text-white text-2xl font-normal font-['Habibi']">In process</div>
        <div className="absolute left-[783px] top-[485px] w-60 text-center text-white text-2xl font-normal font-['Habibi']">3</div>
        <div className="absolute left-[1119px] top-[484px] w-28 h-8 px-3.5 py-1.5 bg-black rounded-md flex items-center justify-center">
          <div className="text-white text-xs font-normal font-['Arimo']">Manager Deadline</div>
        </div>
        <div className="absolute left-[1249px] top-[461px] w-9 text-center text-stone-200 text-5xl font-normal font-['IM_FELL_Great_Primer_SC']">...</div>

        {/* Main Table BG */}
        <div className="absolute left-[101.41px] top-[258.84px] w-[1235px] h-[580px] bg-zinc-300 rounded-[20px]"></div>
      </div>
    </div>
  );
}
