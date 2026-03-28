'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dFetch } from '@/lib/api';

import {
  BarChart3,
  Layout,
  Users,
  CalendarDays,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  LayoutGrid,
  MessageSquare,
  FileText,
  Flag,
  Gauge,
  ChevronRight
} from 'lucide-react';
import AppShell from '@/components/AppShell';

const FEATURE_CARDS = [
  {
    title: 'Project Orchestration',
    description: 'Manage workspaces, members, and track complex progress.',
    href: '/signup',
    icon: LayoutGrid,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    linkColor: 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300',
    linkBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
  },
  {
    title: 'Visual Scheduling',
    description: 'Create events, schedules, and team meeting planning.',
    href: '/signup',
    icon: CalendarDays,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    linkColor: 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300',
    linkBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
  },
  {
    title: 'Unified Communication',
    description: 'Coordinate in channels and direct messages seamlessly.',
    href: '/signup',
    icon: MessageSquare,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    linkColor: 'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300',
    linkBg: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
  },
];

const METRIC_ITEMS = [
  { label: 'Active Teams', value: '12k+', icon: Users, color: 'text-blue-500' },
  { label: 'Messages Synced', value: '45m+', icon: MessageSquare, color: 'text-amber-500' },
  { label: 'Files Managed', value: '1.2m+', icon: FileText, color: 'text-sky-500' },
  { label: 'Uptime Protocol', value: '99.9%', icon: Shield, color: 'text-emerald-500' },
  { label: 'System Velocity', value: '+340%', icon: Zap, color: 'text-purple-500' },
];

export default function Home() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await dFetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          router.replace('/dashboard');
          return;
        }
      } catch (err) {
        console.warn('Session check failed:', err);
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [router]);

  if (checkingSession) {
    return (
      <div className="w-full min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 bg-gray-950 dark:bg-white rounded-xl animate-pulse"></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">A+ Flow</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell contentClassName="flex-1 bg-gray-50/50 dark:bg-neutral-950/50 min-h-screen transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">

        {/* Hero Area Mirroring Dashboard Header */}
        <div className="mb-12 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-100 dark:border-blue-900/30 mb-6">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Platform Evolution v2.43 Live</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[0.9] flex flex-col md:flex-row items-center gap-4 mb-4">
            <Gauge className="w-10 h-10 md:w-16 md:h-16 text-blue-500 animate-pulse" />
            Welcome to the homepage
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg max-w-2xl mt-4 leading-relaxed font-medium">
            Redefining team orchestration for high-performance units. Experience the same precision before and after you sign in.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
            <Link href="/signup" className="px-8 py-4 bg-gray-950 dark:bg-white text-white dark:text-black rounded-2xl text-sm font-black uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-xl">
              Start Free Trial
            </Link>
            <Link href="/login" className="px-8 py-4 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-white/10 text-gray-900 dark:text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all active:scale-95">
              Sign In
            </Link>
          </div>
        </div>

        {/* Marketing Metrics Row (Mirroring Stat Items) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-12">
          {METRIC_ITEMS.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-white/10 shadow-sm p-4 hover:shadow-md transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color} transition-transform group-hover:scale-110`} />
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest truncate">{label}</span>
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{value}</div>
            </div>
          ))}
        </div>

        {/* Feature Cards Grid (Mirroring Nav Cards) */}
        <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden mb-12">
          <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-neutral-800/20">
            <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">Core Platform Features</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-white/5">
            {FEATURE_CARDS.map(({ title, description, href, icon: Icon, iconBg, iconColor, linkColor, linkBg }) => (
              <div key={title} className="p-8 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all group">
                <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 font-medium">{description}</p>
                <Link
                  href={href}
                  className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest ${linkColor} ${linkBg} rounded-xl px-4 py-2.5 transition-all`}
                >
                  Join Flow <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Social Proof / Callout (Mirroring Upcoming Items section but with marketing content) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/10 p-8 flex flex-col justify-center items-center text-center group transition-all hover:border-blue-200 dark:hover:border-blue-900/50">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-3 tracking-tight">Built for Teams</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-xs">
              From startups to Fortune 500s, A+ Flow scales with your team&apos;s ambition.
            </p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/10 p-8 flex flex-col justify-center items-center text-center group transition-all hover:border-emerald-200 dark:hover:border-emerald-900/50">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-3 tracking-tight">Security First</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-xs">
              Enterprise-grade encryption and protocol management for your mission-critical data.
            </p>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
