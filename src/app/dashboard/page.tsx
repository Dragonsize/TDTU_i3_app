'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    
    // Get profile from sessionStorage
    const storedProfile = sessionStorage.getItem('userProfile');
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    } else {
      // Redirect to login if no profile
      router.push('/login');
    }
  }, [isDark, router]);

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookies
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local session storage
      sessionStorage.removeItem('userProfile');
      router.push('/');
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f7f6f8] dark:bg-[#050505] flex items-center justify-center">
        <div className="animate-pulse text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

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
          className={`absolute top-1/2 -translate-y-1/2 -left-5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-110 transition-transform z-50 ${isExpanded ? '' : 'md:flex'}`}
        >
          <span className="material-symbols-outlined text-sm">{isExpanded ? 'chevron_right' : 'chevron_left'}</span>
        </button>

        <div
          className={`flex flex-col items-center justify-between w-full h-full overflow-hidden ${isExpanded ? 'opacity-100 w-64' : 'opacity-0 md:opacity-100 md:w-20'} transition-opacity duration-200`}
        >
          <div className="flex flex-col items-center gap-2 w-full px-4">
            <div className="flex items-center gap-3 w-full justify-center">
              <div className="items-center justify-center">
                <img src="/avt.jpg" alt="ITZone" className="w-9 h-9 rounded-full object-cover" />
              </div>
              {isExpanded && (
                <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden animate-fade-in">
                  ITZone
                </h2>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full px-4">
            <NavItem icon="dashboard" label="Dashboard" isExpanded={isExpanded} href="/dashboard" active />
            <NavItem icon="smart_toy" label="AI Chatbot" isExpanded={isExpanded} href="#" />
            <NavItem icon="calendar_month" label="Calendar" isExpanded={isExpanded} href="#" />
            <NavItem icon="storefront" label="Marketplace" isExpanded={isExpanded} href="#" />
            <NavItem icon="inventory_2" label="My Listings" isExpanded={isExpanded} href="#" />
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

            <button
              onClick={handleLogout}
              className={`bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all hover:scale-105 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 ${isExpanded ? 'w-full py-3 px-4' : 'w-12 h-12'}`}
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              {isExpanded && <span className="font-bold whitespace-nowrap overflow-hidden animate-fade-in">Logout</span>}
            </button>
          </div>
        </div>
      </nav>

      <main className="px-4 lg:px-40 py-12 relative">
        <div className="mb-12">
          <h1 className="text-4xl lg:text-6xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">
            Welcome back, <span className="text-gradient">{profile.fullname?.split(' ')[-1] || 'Student'}</span>
          </h1>
          <p className="text-slate-600 dark:text-white/60 text-lg">
            Your personalized hub for AI assistance, calendar management, and marketplace activity.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <StatCard icon="chat" label="AI Conversations" value="0" color="primary" />
          <StatCard icon="event" label="Upcoming Events" value="0" color="secondary" />
          <StatCard icon="sell" label="Active Listings" value="0" color="primary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">person</span>
                Profile Information
              </h2>
              <div className="space-y-4">
                <ProfileField label="Full Name" value={profile.fullname} />
                <ProfileField label="Email" value={profile.email} />
                <ProfileField label="Location" value={`${profile.city}, ${profile.country}`} />
                <ProfileField label="Timezone" value={profile.timezone} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                Calendar Events
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">No upcoming events scheduled.</p>
            </div>

            <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">shopping_bag</span>
                Recent Orders
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">No recent marketplace activity.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, isExpanded, href, active }: { icon: string; label: string; isExpanded: boolean; href: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center rounded-xl transition-colors ${
        active 
          ? 'bg-primary/10 dark:bg-primary/20' 
          : 'hover:bg-slate-100 dark:hover:bg-white/10'
      } ${isExpanded ? 'w-full px-4 py-3 gap-3 justify-start' : 'justify-center w-10 h-10 mx-auto'}`}
    >
      <span className={`material-symbols-outlined transition-colors shrink-0 ${
        active 
          ? 'text-primary' 
          : 'text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-white'
      }`}>
        {icon}
      </span>
      {isExpanded ? (
        <span className={`font-medium whitespace-nowrap overflow-hidden animate-fade-in ${
          active 
            ? 'text-primary dark:text-primary' 
            : 'text-slate-600 dark:text-slate-300'
        }`}>{label}</span>
      ) : (
        <span className="absolute right-full mr-4 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {label}
        </span>
      )}
    </Link>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-6 hover:scale-105 transition-transform">
      <div className="flex items-center justify-between mb-4">
        <div className={`size-12 rounded-xl bg-${color}/20 flex items-center justify-center text-${color}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        <div className="text-3xl font-black text-slate-900 dark:text-white">{value}</div>
      </div>
      <p className="text-slate-600 dark:text-slate-400 font-medium">{label}</p>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 border-b border-slate-200 dark:border-white/5 last:border-0">
      <span className="text-slate-500 dark:text-slate-400 font-medium min-w-[140px]">{label}</span>
      <span className="text-slate-900 dark:text-white font-semibold">{value || 'N/A'}</span>
    </div>
  );
}
