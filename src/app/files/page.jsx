'use client';
import React from 'react';
import Link from 'next/link';

export default function FilesPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="w-full h-16 bg-white/60 border-b border-black/10 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gray-950 rounded-lg"></div>
              <span className="text-xl font-bold text-neutral-950 font-['Arimo']">A+ Flow</span>
            </Link>
            <nav className="hidden md:flex items-center gap-5 text-base text-gray-500 font-['Arimo']">
              <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Project</Link>
              <Link href="/chatbot" className="hover:text-gray-900 transition-colors">ChatBot</Link>
              <Link href="/chat" className="hover:text-gray-900 transition-colors">Chat</Link>
              <Link href="/files" className="text-gray-900">File</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="px-3.5 py-1.5 rounded-md flex items-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              <div className="text-neutral-950 text-xs font-normal font-['Arimo']">User</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center text-black text-5xl font-normal font-['Instrument_Sans']">Files</div>

        <section className="mt-10 relative">
          <div className="bg-zinc-300 rounded-[20px] h-[520px] md:h-[620px]"></div>

          <div className="absolute left-8 top-8 flex flex-col items-start gap-4">
            <div className="w-32 h-32 bg-gray-200 rounded-2xl"></div>
            <div className="w-16 h-5 bg-neutral-400/70 rounded-lg"></div>
            <div className="text-base font-normal font-['Instrument_Sans'] text-black/80">file 1</div>
          </div>

          <div className="absolute left-44 top-9 w-28 h-24 bg-stone-300 rounded-[29px] flex items-center justify-center">
            <div className="opacity-50 text-6xl font-normal font-['Instrument_Sans'] text-black">+</div>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 top-40 text-center text-black text-2xl font-normal font-['Instrument_Sans']">
            Upload Files
          </div>
        </section>
      </main>
    </div>
  );
}
