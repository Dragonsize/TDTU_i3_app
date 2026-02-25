"use client";
import React, { useState } from "react";

export default function ProjectPage() {
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");

  // ...existing code...

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
            <div className="w-[1440px] h-[900px] relative bg-white overflow-hidden rounded-xl shadow-lg">
              {/* Modal header bar */}
              <div className="w-[1438.96px] h-16 px-32 pb-px left-[1px] top-[13px] absolute bg-white/60 border-b border-black/10 inline-flex flex-col justify-between items-center">
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
              {/* Modal Title */}
              <div className="w-96 h-14 left-[97px] top-[90px] absolute justify-start text-black text-5xl font-normal font-['IM_FELL_Great_Primer_SC']">Create Project</div>
              {/* Input Row BG */}
              <div className="w-96 h-16 left-[600px] top-[415px] absolute bg-zinc-300 rounded-[10px]"></div>
              {/* Input Placeholder/Text */}
              <div className="left-[634px] top-[435px] absolute text-center justify-center text-stone-600 text-2xl font-normal font-['Habibi']">Enter Name of Project</div>
              {/* Label */}
              <div className="left-[393px] top-[435px] absolute text-center justify-center text-black text-2xl font-normal font-['Habibi']">Name of Project:</div>
              {/* Next Button */}
              <div className="w-72 h-16 left-[1134px] top-[809px] absolute bg-gray-950 rounded-md">
                <div className="w-44 h-9 left-[44.01px] top-[17px] absolute text-center justify-center text-white text-xl font-normal font-['Arimo'] leading-4">Next</div>
                <div className="w-11 h-11 left-[202.01px] top-[13px] absolute overflow-hidden">
                  <div className="w-7 h-0 left-[9.38px] top-[22.50px] absolute outline outline-1 outline-offset-[-0.58px] outline-white"></div>
                  <div className="w-3.5 h-7 left-[22.50px] top-[9.38px] absolute outline outline-1 outline-offset-[-0.58px] outline-white"></div>
                </div>
              </div>
              {/* Close modal on background click */}
              <button
                className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-700 z-10"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ×
              </button>
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
