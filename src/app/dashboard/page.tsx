'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/useTranslations';

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [profile, setProfile] = useState<any>(null);

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

  useEffect(() => {
    // Get profile from localStorage
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    } else {
      // Redirect to login if no profile
      router.push('/login');
    }
  }, [router]);

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
      // Clear local storage
      localStorage.removeItem('userProfile');
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
      className={`font-display bg-[#f7f6f8] dark:bg-[#050505] text-slate-900 dark:text-white min-h-screen relative ${isExpanded ? 'md:pr-64' : 'md:pr-20'} pr-0 transition-[padding-right] duration-300`}
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
            <NavItem icon="dashboard" label={t('dashboard')} isExpanded={isExpanded} href="/dashboard" active />
            <NavItem icon="smart_toy" label={t('aiChatbot')} isExpanded={isExpanded} href="/chatbot" />
            <NavItem icon="calendar_month" label={t('calendar')} isExpanded={isExpanded} href="/calendar" />
            <NavItem icon="storefront" label={t('marketplace')} isExpanded={isExpanded} href="/marketplace" />
            <NavItem icon="inventory_2" label={t('myListings')} isExpanded={isExpanded} href="/listings" />
            <NavItem icon="account_circle" label={t('settings')} isExpanded={isExpanded} href="/settings" />
          </div>

          <div className="flex flex-col items-center gap-6 w-full px-4" />
        </div>
      </nav>

      <main className="px-4 lg:px-40 py-12 relative">
        <div className="mb-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-4xl lg:text-6xl font-black mb-4 tracking-tight text-slate-900 dark:text-white break-words">
              {t('welcomeBack')}, <span className="text-gradient inline-block">{profile.fullname?.split(' ').pop() || 'Student'}</span>
            </h1>
            <p className="text-slate-600 dark:text-white/60 text-lg">
              {t('personalizedHub')}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all hover:scale-105 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 px-5 py-3 font-bold whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span>{t('logout')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <StatCard icon="chat" label={t('aiConversations')} value="0" color="primary" />
          <StatCard icon="event" label={t('upcomingEvents')} value="0" color="secondary" />
          <StatCard icon="sell" label={t('activeListings')} value="0" color="primary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">person</span>
                {t('profileInformation')}
              </h2>
              <div className="space-y-4">
                <ProfileField label={t('fullName')} value={profile.fullname} />
                <ProfileField label={t('email')} value={profile.email} />
                <ProfileField label={t('location')} value={`${profile.city}, ${profile.country}`} />
                <ProfileField label={t('timezone')} value={profile.timezone} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">calendar_today</span>
                {t('calendarEvents')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{t('noUpcomingEvents')}</p>
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
