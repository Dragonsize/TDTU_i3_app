'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [savedProfile, setSavedProfile] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      setSavedProfile(JSON.parse(storedProfile));
    }
  }, []);

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      setIsDark(savedTheme === 'true');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  const handleSignIn = () => {
    setIsLoading(true);
    router.push('/login');
  };

  const handleQuickSignIn = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      console.error('Quick sign-in error:', error);
    }
    router.push('/login');
  };

  return (
    <div className="font-display bg-[#f7f6f8] dark:bg-[#050505] text-slate-900 dark:text-white transition-all duration-300 min-h-screen relative">
      <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>

      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-4 px-8 bg-white/80 dark:bg-[#1a1025]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <img src="/avt.jpg" alt="ITZone" className="w-12 h-12 rounded-full object-cover border-2 border-primary" />
          
          {/* Theme Toggle */}
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

          {/* Sign In Button */}
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className={`bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center gap-2 font-bold ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            {isLoading ? <LoadingSpinner /> : <span className="material-symbols-outlined text-xl">login</span>}
            <span>{isLoading ? 'Working...' : 'Sign In'}</span>
          </button>

          {/* Quick Sign In */}
          {savedProfile && (
            <button
              onClick={handleQuickSignIn}
              disabled={isLoading}
              className={`bg-white/80 dark:bg-white/10 text-slate-900 dark:text-white px-5 py-2 rounded-xl transition-all border border-slate-200 dark:border-white/10 flex items-center gap-2 font-semibold ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 hover:border-primary/40'}`}
            >
              <img src="/avt.jpg" alt="Saved account" className="w-5 h-5 rounded-full" />
              <span>{savedProfile?.fullname ? `Use ${savedProfile.fullname.split(' ').pop()}` : 'Use saved account'}</span>
            </button>
          )}
        </div>
      </nav>

      <main className="pt-20">
        <section className="relative px-4 lg:px-40 py-20 lg:py-32 overflow-hidden">
          <div className="max-w-[1200px] mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative z-10">
              <h1 className="text-5xl lg:text-7xl font-black leading-tight tracking-tight text-slate-900 dark:text-white mb-6">
                Hệ thống <span className="text-gradient">Quản Lý</span> Việc nhóm lịch trình thông minh
              </h1>
              <p className="text-lg text-slate-600 dark:text-white/60 leading-relaxed mb-8 max-w-xl">
                Group Work & Schedule Management System - Your all-in-one platform with AI assistance, smart calendar management, document sharing, and workflow tracking.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className={`bg-primary text-white px-8 py-4 rounded-xl text-base font-bold transition-all hover:shadow-[0_0_20px_rgba(127,19,236,0.4)] ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'}`}
                >
                  {isLoading ? 'Working...' : 'Get Started'}
                </button>
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
            <h2 className="text-slate-900 dark:text-white text-3xl lg:text-5xl font-black mb-4 tracking-tight">Everything you need</h2>
            <p className="text-slate-600 dark:text-white/50 text-lg max-w-2xl">
              A powerful platform designed for teams with AI assistance, organization tools, and project collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard icon="smart_toy" title="AI Chatbot" description="Get instant answers and assistance with our intelligent AI-powered assistant." />
            <FeatureCard icon="calendar_month" title="Smart Calendar" description="Organize schedules, track deadlines, and avoid conflicts." />
            <FeatureCard icon="task" title="Workflows" description="Break projects into workflows and assign roles with deadlines." />
            <FeatureCard icon="folder" title="Documents" description="Store and share project documents with your team." />
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

function LoadingSpinner() {
  return (
    <span className="inline-flex items-center justify-center">
      <span className="h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin"></span>
    </span>
  );
}