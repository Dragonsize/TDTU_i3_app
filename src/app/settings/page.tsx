'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from '../../lib/useTranslations';

export default function Settings() {
  const router = useRouter();
  const { t } = useTranslations();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [language, setLanguage] = useState('vi');
  const [profileVisibility, setProfileVisibility] = useState('public');

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      setIsDark(savedTheme === 'true');
    }
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
    const savedVisibility = localStorage.getItem('profileVisibility');
    if (savedVisibility) {
      setProfileVisibility(savedVisibility);
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  React.useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  React.useEffect(() => {
    localStorage.setItem('profileVisibility', profileVisibility);
  }, [profileVisibility]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('userProfile');
      router.push('/');
    }
  };

  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden">
      <div className="w-full max-w-[1440px] min-h-screen relative mx-auto">
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
            <NavItem icon="dashboard" label={t('dashboard')} isExpanded={isExpanded} href="/dashboard" />
            <NavItem icon="smart_toy" label={t('aiChatbot')} isExpanded={isExpanded} href="/chatbot" />
            <NavItem icon="calendar_month" label={t('calendar')} isExpanded={isExpanded} href="/calendar" />
            <NavItem icon="account_circle" label={t('settings')} isExpanded={isExpanded} href="/settings" active />
          </div>

          <div className="flex flex-col items-center gap-6 w-full px-4" />
        </div>
      </nav>

      <main className="px-4 lg:px-40 py-12 relative">
        <div className="mb-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl lg:text-6xl font-black mb-4 tracking-tight text-slate-900 dark:text-white">
              {t('accountSettings')}
            </h1>
            <p className="text-slate-600 dark:text-white/60 text-lg">
              {t('manageProfile')}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">palette</span>
                {t('appearance')}
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900 dark:text-white font-semibold">{t('theme')}</p>
                  <p className="text-slate-600 dark:text-white/50 text-sm">{t('switchTheme')}</p>
                </div>
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
            </div>

            <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">translate</span>
                {t('language')}
              </h2>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-slate-900 dark:text-white font-semibold">{t('appLanguage')}</p>
                  <p className="text-slate-600 dark:text-white/50 text-sm">{t('chooseLanguage')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-4 py-2 rounded-xl border transition-all ${language === 'en' ? 'bg-primary text-white border-primary' : 'bg-white/70 dark:bg-white/10 text-slate-700 dark:text-white/80 border-slate-200 dark:border-white/10'}`}
                  >
                    {t('english')}
                  </button>
                  <button
                    onClick={() => setLanguage('vi')}
                    className={`px-4 py-2 rounded-xl border transition-all ${language === 'vi' ? 'bg-primary text-white border-primary' : 'bg-white/70 dark:bg-white/10 text-slate-700 dark:text-white/80 border-slate-200 dark:border-white/10'}`}
                  >
                    {t('vietnamese')}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">shield_lock</span>
                {t('privacy')}
              </h2>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-slate-900 dark:text-white font-semibold">{t('profileVisibility')}</p>
                  <p className="text-slate-600 dark:text-white/50 text-sm">{t('defaultPublic')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setProfileVisibility('public')}
                    className={`px-4 py-2 rounded-xl border transition-all ${profileVisibility === 'public' ? 'bg-primary text-white border-primary' : 'bg-white/70 dark:bg-white/10 text-slate-700 dark:text-white/80 border-slate-200 dark:border-white/10'}`}
                  >
                    {t('public')}
                  </button>
                  <button
                    onClick={() => setProfileVisibility('private')}
                    className={`px-4 py-2 rounded-xl border transition-all ${profileVisibility === 'private' ? 'bg-primary text-white border-primary' : 'bg-white/70 dark:bg-white/10 text-slate-700 dark:text-white/80 border-slate-200 dark:border-white/10'}`}
                  >
                    {t('private')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/50 dark:bg-transparent dark:glass-effect border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">info</span>
                {t('notes')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                {t('settingsSaved')}
              </p>
            </div>
          </div>
        </div>
      </main>
        </div>
      </div>
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
      <span
        className={`material-symbols-outlined transition-colors shrink-0 ${
          active
            ? 'text-primary'
            : 'text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-white'
        }`}
      >
        {icon}
      </span>
      {isExpanded ? (
        <span
          className={`font-medium whitespace-nowrap overflow-hidden animate-fade-in ${
            active ? 'text-primary dark:text-primary' : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          {label}
        </span>
      ) : (
        <span className="absolute right-full mr-4 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {label}
        </span>
      )}
    </Link>
  );
}
