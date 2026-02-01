'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <div
      className={`font-display bg-[#f7f6f8] dark:bg-[#050505] text-slate-900 dark:text-white transition-all duration-300 min-h-screen relative ${isExpanded ? 'md:pr-64' : 'md:pr-20'} pr-0`}
    >
      <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>

      <nav
        className={`fixed right-0 top-0 h-screen py-8 z-50 flex flex-col items-center justify-between border-l border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#1a1025]/80 backdrop-blur-md shadow-2xl dark:shadow-none transition-all duration-300 ${isExpanded ? 'w-64' : 'w-0 md:w-20'} overflow-visible`}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`absolute top-8 -right-5 -translate-x-1/2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-110 transition-transform z-50 ${isExpanded ? '' : 'md:flex'}`}
        >
          <span className="material-symbols-outlined text-sm">{isExpanded ? 'chevron_right' : 'chevron_left'}</span>
        </button>

        <div
          className={`flex flex-col items-center justify-between w-full h-full overflow-hidden ${isExpanded ? 'opacity-100 w-64' : 'opacity-0 md:opacity-100 md:w-20'} transition-opacity duration-200`}
        >
          <div className="flex flex-col items-center gap-2 w-full px-4">
            <div className="flex items-center gap-3 w-full justify-center">
              <div className="items-center justify-center">
                <img src="/avt.jpg" alt="bolt icon" className="w-9 h-9 rounded-full object-cover" />
              </div>
              {isExpanded && (
                <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden animate-fade-in">
                  ITZone
                </h2>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full px-4">
            <NavItem icon="manage_search" label="Hackathons" isExpanded={isExpanded} />
            <NavItem icon="group_add" label="Find Team" isExpanded={isExpanded} />
            <NavItem icon="rocket_launch" label="Projects" isExpanded={isExpanded} />
            <NavItem icon="school" label="Mentors" isExpanded={isExpanded} />
          </div>

          <div className="flex flex-col items-center gap-6 w-full px-4">
            <div className={`flex items-center ${isExpanded ? 'w-full justify-between' : 'justify-center'} px-2 transition-all`}>
              {isExpanded && <span className="text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">Dark Mode</span>}
              <button
                onClick={() => setIsDark(!isDark)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${isDark ? 'bg-primary' : 'bg-slate-300'}`}
                title="Toggle Theme"
              >
                <div
                  className={`absolute top-1 left-1 bg-white rounded-full w-4 h-4 shadow-md transform transition-transform duration-300 flex items-center justify-center ${isDark ? 'translate-x-6' : 'translate-x-0'}`}
                >
                  <span className="material-symbols-outlined text-[10px] text-slate-800">
                    {isDark ? 'dark_mode' : 'light_mode'}
                  </span>
                </div>
              </button>
            </div>

            <div
              className={`rounded-full border border-white/10 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all shrink-0 ${isExpanded ? 'size-12' : 'size-10'}`}
            >
              <img
                alt="User avatar"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDio-LSFjDCNkAEARepkcmo_gjp0z0vU2f7tpQZ-118cJSXgEgmKUMkp7tGw1G_GC9mUgDQ80aRx_sJpxIZdx5y9eGhwSx2e14YQKbd08BBZubIEmsdwC9u0VWCHCzabu_S0ByD6ywNQjXOw7L4PGvnJjo8TfngOXHT-Rjlub0rbrnb6Gl30dQ7IrH4yJriag2_tc99q2fdZ9eQKkdRzKRlZLdfJ-KCNOkpH8Awty6poHQicdRMWAABstrCWBVXD5epFSZ7iN0KmBM"
              />
            </div>

            <Link
              href="/login"
              className={`bg-primary hover:bg-primary/90 text-white rounded-xl transition-all hover:scale-105 shadow-lg shadow-primary/20 flex items-center justify-center ${isExpanded ? 'w-full py-3 gap-2' : 'p-2'}`}
            >
              <span className="material-symbols-outlined shrink-0">login</span>
              {isExpanded && <span className="font-bold whitespace-nowrap overflow-hidden animate-fade-in">Sign In</span>}
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative px-4 lg:px-40 py-20 lg:py-32 overflow-hidden">
          <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative z-10">
              <h1 className="text-5xl lg:text-7xl font-black leading-tight tracking-tight text-slate-900 dark:text-white mb-6">
                Team <span className="text-gradient">3</span>.
              </h1>
              <p className="text-lg text-slate-600 dark:text-white/60 leading-relaxed mb-8 max-w-xl">
                Connecting students to global hackathons and AI-powered teammate matching. Join the elite network of student innovators and turn ideas into reality.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="bg-primary text-white px-8 py-4 rounded-xl text-base font-bold transition-all hover:shadow-[0_0_20px_rgba(127,19,236,0.4)]"
                >
                  Get Started
                </Link>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative w-full aspect-square">
                <div className="absolute inset-0 rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 rotate-3 translate-x-4 shadow-2xl dark:shadow-none">
                  <img
                    alt="Tech workspace with glowing displays"
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6mdBxQYWGIcLyuM_3CtTA85w_hhh01Fu58Tzvx5vN-zRy9cxPgq3wyxbOc11t-DF9fB1VqwSHyTcPjNKWS-2zdQ1Rnwy8DP8HDObzN9S8X5Zejam2wcXCR0PKwrBqm_iZ4KPqJ_Yyhvup_1MONiBxBLGo2AfsYoRnHVT5G_tUVeccsD_Q8Va4SIIJV0dMgtj8sa3A3hmDXVhM4_ro60mkGA9ycRdh-bjKp8OohiRuUvr9elFtGxfsqriIBcrmJ_V6P3Q2jyd9fnw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent dark:from-[#050505]/80 dark:to-transparent"></div>
                </div>

                <div className="absolute -bottom-10 right-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-2xl min-w-[200px]">
                  <div className="flex items-center gap-4">
                    <img
                      alt="Student profile photo"
                      className="size-12 rounded-full border-2 border-primary"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuClarNm-nL_dz66Wiq97hOGeAbPq0-qLV1aqHZd1CI6ebsv_og1Cv8I6q0VNs-XHIQLd86ByxboqZSLamgcaXCnd9UlDUBO2Si757YYmAqqC_GEabSwh43iY0QfgNGuSpVrv09m3Yf4frSPacmf8kkxVA3jnkIhCnissjKTNhkwRV4BZJGeJV6xsG8l3NIYnMvzj3cgMgWRWh5WVcLjy2dT4Ej4YGuIvdCmsdZ7VOvb7v_w4FeENxdSCAKrgF_DaulBNLnkzqwjQ_8"
                    />
                    <div>
                      <p className="text-slate-900 dark:text-white font-bold">Trợ lí em Linh</p>
                      <p className="text-xs text-primary font-medium">Sinh viên năm 2 khoa học máy tính</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 lg:px-40 py-24 relative">
          <div className="mb-16">
            <h2 className="text-slate-900 dark:text-white text-3xl lg:text-5xl font-black mb-4 tracking-tight">Everything you need to win</h2>
            <p className="text-slate-600 dark:text-white/50 text-lg max-w-2xl">
              Our futuristic platform provides the tools for student developers to excel from concept to code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard icon="explore" title="Discover Events" description="Browse and join global hackathons seamlessly with one-click registration." />
            <FeatureCard icon="groups_3" title="Dream Teams" description="AI-powered teammate matching based on complementary skill sets." />
            <FeatureCard icon="auto_awesome_motion" title="Winning Archives" description="Showcase your builds and explore winning projects from around the world." />
            <FeatureCard icon="psychology" title="Mentor Matching" description="Get industry expert guidance for your build from senior engineers." />
          </div>
        </section>
      </main>

      <footer className="px-4 lg:px-40 py-20 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#050505]/50 transition-colors duration-300">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl">bolt</span>
              </div>
              <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight">TDTU</h2>
            </div>
            <p className="text-slate-600 dark:text-white/40 text-sm leading-relaxed mb-6">
              Dự án cho cuộc thi phần mềm IT-ZONE Team 3.
            </p>
            <div className="flex gap-4">
              <a className="text-slate-400 hover:text-primary dark:text-white/40 dark:hover:text-white transition-colors" href="#">
                <span className="material-symbols-outlined">public</span>
              </a>
              <a className="text-slate-400 hover:text-primary dark:text-white/40 dark:hover:text-white transition-colors" href="#">
                <span className="material-symbols-outlined">share</span>
              </a>
              <a className="text-slate-400 hover:text-primary dark:text-white/40 dark:hover:text-white transition-colors" href="#">
                <span className="material-symbols-outlined">alternate_email</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-5 -mb-16 pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 dark:text-white/20 text-xs">© 2026 IT-ZONE TEAM 3. All rights reserved.</p>
          <div className="flex gap-6">
            <a className="text-slate-500 hover:text-primary dark:text-white/20 dark:hover:text-white text-xs" href="#">
              Điều khoản sử dụng
            </a>
            <a className="text-slate-500 hover:text-primary dark:text-white/20 dark:hover:text-white text-xs" href="#">
              Chính sách bảo mật
            </a>
            <a className="text-slate-500 hover:text-primary dark:text-white/20 dark:hover:text-white text-xs" href="#">
              Cookie dữ liệu
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavItem({ icon, label, isExpanded }: { icon: string; label: string; isExpanded: boolean }) {
  return (
    <a
      href="#"
      className={`group relative flex items-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors ${isExpanded ? 'w-full px-4 py-3 gap-3 justify-start' : 'justify-center w-10 h-10 mx-auto'}`}
    >
      <span className="material-symbols-outlined text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-white transition-colors shrink-0">
        {icon}
      </span>
      {isExpanded ? (
        <span className="text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap overflow-hidden animate-fade-in">{label}</span>
      ) : (
        <span className="absolute right-full mr-4 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {label}
        </span>
      )}
    </a>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none group p-6 rounded-2xl transition-all hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-primary/30">
      <div className="size-14 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <h3 className="text-slate-900 dark:text-white text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-600 dark:text-white/50 text-sm leading-relaxed">{description}</p>
    </div>
  );
}