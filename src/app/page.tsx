'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <div className={`min-h-screen relative transition-all duration-300 ${isExpanded ? "md:pr-64" : "md:pr-20"}`}>
      <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>

      {/* Navigation Sidebar */}
      <nav className={`fixed right-0 top-0 h-screen py-8 z-50 flex flex-col items-center justify-between border-l border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#1a1025]/80 backdrop-blur-md transition-all duration-300 ${isExpanded ? "w-64" : "w-20"}`}>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-8 -left-5 bg-white dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-md hover:scale-110 transition"
        >
          <span className="material-symbols-outlined text-sm">{isExpanded ? "chevron_right" : "chevron_left"}</span>
        </button>

        <div className="flex flex-col items-center gap-8 w-full px-4">
          <img src="/avt.jpg" className="w-10 h-10 rounded-full border-2 border-primary object-cover" alt="Logo" />
          <div className="flex flex-col gap-4 w-full">
            <NavItem icon="manage_search" label="Hackathons" expanded={isExpanded} />
            <NavItem icon="group_add" label="Find Team" expanded={isExpanded} />
            <NavItem icon="rocket_launch" label="Projects" expanded={isExpanded} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 w-full px-4">
          <button onClick={() => setIsDark(!isDark)} className="material-symbols-outlined text-primary cursor-pointer">
            {isDark ? "dark_mode" : "light_mode"}
          </button>
          <Link href="/login" className="bg-primary text-white p-3 rounded-xl hover:scale-105 transition flex items-center justify-center gap-2 w-full">
            <span className="material-symbols-outlined">login</span>
            {isExpanded && <span className="font-bold uppercase text-xs">Sign In</span>}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-6 lg:px-40 py-32">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-6xl lg:text-8xl font-black mb-6 tracking-tight">Team <span className="text-gradient">3</span>.</h1>
            <p className="text-lg text-slate-600 dark:text-white/60 mb-8 max-w-lg leading-relaxed">
              Connecting TDTU students to global hackathons and AI-powered teammate matching. Join the elite network of innovators.
            </p>
            <button className="bg-primary text-white px-10 py-4 rounded-xl font-bold hover:shadow-[0_0_30px_rgba(127,19,236,0.4)] transition-all">
              Get Started
            </button>
          </div>
          
          <div className="hidden lg:block relative animate-in fade-in zoom-in duration-1000">
            <div className="rounded-3xl border border-white/10 overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500 glass-effect">
              <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b" className="opacity-60 grayscale hover:grayscale-0 transition duration-700" alt="Tech Workspace" />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Widget */}
      <div id="gcal-widget-container" className="animate-in slide-in-from-bottom duration-500">
        <div className="bg-[#252535] p-3 flex justify-between items-center border-b border-white/5">
          <span className="text-[10px] font-bold tracking-widest uppercase text-white/50">Lịch bận của tôi</span>
          <span className="material-symbols-outlined text-xs cursor-pointer opacity-50 hover:opacity-100">close</span>
        </div>
        <div className="p-4 space-y-3">
          <input type="text" placeholder="Hoạt động (VD: Taekwondo)" className="gcal-input" />
          <div className="grid grid-cols-2 gap-2">
            <input type="datetime-local" className="gcal-input" />
            <input type="datetime-local" className="gcal-input" />
          </div>
          <button className="w-full bg-primary py-2 rounded-md font-bold text-sm hover:bg-opacity-80 transition">Lưu Lịch</button>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, expanded }: { icon: string, label: string, expanded: boolean }) {
  return (
    <div className={`flex items-center gap-4 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group ${!expanded && "justify-center"}`}>
      <span className="material-symbols-outlined text-slate-500 group-hover:text-primary transition-colors">{icon}</span>
      {expanded && <span className="font-medium text-sm animate-in fade-in slide-in-from-right-2">{label}</span>}
    </div>
  );
}