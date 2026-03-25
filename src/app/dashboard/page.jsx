'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import PageLoader from '@/components/PageLoader';
import {
  LayoutGrid, MessageSquare, FileText, Flag, CalendarDays,
  Users, Bot, AlertCircle, ChevronRight, Gauge
} from 'lucide-react';

const NAV_CARDS = [
  {
    title: 'Projects',
    description: 'Manage workspaces, members, and track progress.',
    href: '/project',
    icon: LayoutGrid,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    linkColor: 'text-blue-600 hover:text-blue-700',
    linkBg: 'hover:bg-blue-50',
  },
  {
    title: 'Calendar',
    description: 'Create events, schedules, and team meeting planning.',
    href: '/calendar',
    icon: CalendarDays,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    linkColor: 'text-emerald-600 hover:text-emerald-700',
    linkBg: 'hover:bg-emerald-50',
  },
  {
    title: 'Team Availability',
    description: 'Compare member calendars and schedule meetings fast.',
    href: '/calendar',
    icon: Users,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    linkColor: 'text-purple-600 hover:text-purple-700',
    linkBg: 'hover:bg-purple-50',
  },
  {
    title: 'Chat',
    description: 'Coordinate in channels and direct messages.',
    href: '/chat',
    icon: MessageSquare,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    linkColor: 'text-amber-600 hover:text-amber-700',
    linkBg: 'hover:bg-amber-50',
  },
  {
    title: 'Files',
    description: 'Store and share project documents securely.',
    href: '/files',
    icon: FileText,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    linkColor: 'text-sky-600 hover:text-sky-700',
    linkBg: 'hover:bg-sky-50',
  },
  {
    title: 'AI Assistant',
    description: 'Get quick help with onboarding and guidance.',
    href: '/chatbot',
    icon: Bot,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    linkColor: 'text-indigo-600 hover:text-indigo-700',
    linkBg: 'hover:bg-indigo-50',
  },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ projects: 0, channels: 0, files: 0, deadlines: 0, events: 0 });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [dashboardError, setDashboardError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDashboardState = async () => {
    const now = new Date();
    const in30Days = new Date(now);
    in30Days.setDate(now.getDate() + 30);

    const [projectsRes, channelsRes, docsRes, deadlinesRes, eventsRes] = await Promise.all([
      fetch('/api/projects', { credentials: 'include' }),
      fetch('/api/chat/channels', { credentials: 'include' }),
      fetch('/api/documents', { credentials: 'include' }),
      fetch('/api/deadlines?days=14', { credentials: 'include' }),
      fetch(`/api/calendar/events?start=${encodeURIComponent(now.toISOString())}&end=${encodeURIComponent(in30Days.toISOString())}`, { credentials: 'include' }),
    ]);

    const [projects, channels, documents, deadlines, events] = await Promise.all([
      projectsRes.ok ? projectsRes.json() : [],
      channelsRes.ok ? channelsRes.json() : [],
      docsRes.ok ? docsRes.json() : [],
      deadlinesRes.ok ? deadlinesRes.json() : [],
      eventsRes.ok ? eventsRes.json() : [],
    ]);

    const safeProjects = Array.isArray(projects) ? projects : [];
    const safeChannels = Array.isArray(channels) ? channels : [];
    const safeDocuments = Array.isArray(documents) ? documents : [];
    const safeDeadlines = Array.isArray(deadlines) ? deadlines : [];
    const safeEvents = Array.isArray(events) ? events : [];

    safeDeadlines.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    safeEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    setStats({ projects: safeProjects.length, channels: safeChannels.length, files: safeDocuments.length, deadlines: safeDeadlines.length, events: safeEvents.length });
    setUpcomingDeadlines(safeDeadlines.slice(0, 4));
    setUpcomingEvents(safeEvents.slice(0, 4));
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (!response.ok) { router.push('/login'); return; }
        const data = await response.json();
        setUser(data.user);
        const profileResponse = await fetch('/api/profile', { credentials: 'include' });
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          localStorage.setItem('userProfile', JSON.stringify(profileData.profile));
          setUser((prev) => ({ ...prev, ...profileData.profile }));
        }
        await fetchDashboardState();
      } catch (err) {
        setDashboardError('Could not load dashboard insights.');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <AppShell user={user} activePath="/dashboard" contentClassName="flex-1">
        <PageLoader label="Loading..." />
      </AppShell>
    );
  }

  const STAT_ITEMS = [
    { label: 'Projects', value: stats.projects, icon: LayoutGrid, color: 'text-blue-500' },
    { label: 'Channels', value: stats.channels, icon: MessageSquare, color: 'text-amber-500' },
    { label: 'Files', value: stats.files, icon: FileText, color: 'text-sky-500' },
    { label: 'Deadlines (14d)', value: stats.deadlines, icon: Flag, color: 'text-red-500' },
    { label: 'Events (30d)', value: stats.events, icon: CalendarDays, color: 'text-emerald-500' },
  ];

  return (
    <AppShell user={user} activePath="/dashboard" contentClassName="flex-1 bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Gauge className="w-8 h-8 text-blue-500" />
            Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1.5">
            Welcome back, <span className="font-semibold text-gray-700">{user?.full_name?.split(' ')[0] || user?.fullname?.split(' ')[0] || 'User'}</span>! Here&apos;s your workspace overview.
          </p>
        </div>

        {dashboardError && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {dashboardError}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {STAT_ITEMS.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">{label}</span>
              </div>
              <div className="text-2xl font-extrabold text-gray-900">{value}</div>
            </div>
          ))}
        </div>

        {/* Nav Cards Grid */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Quick Access</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {NAV_CARDS.map(({ title, description, href, icon: Icon, iconBg, iconColor, linkColor, linkBg }) => (
              <div key={title} className="p-6 hover:bg-gray-50/70 transition-colors">
                <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{description}</p>
                <Link
                  href={href}
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${linkColor} ${linkBg} rounded-lg px-2.5 py-1.5 transition-colors`}
                >
                  Open <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-500" />
              <h3 className="text-base font-bold text-gray-900">Upcoming Deadlines</h3>
              <span className="ml-1 text-xs text-gray-400">(14 days)</span>
            </div>
            <div className="p-4 space-y-2">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No upcoming deadlines.</p>
              ) : (
                upcomingDeadlines.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-semibold text-gray-800 truncate">{item.title}</span>
                    <span className="text-xs text-gray-400 ml-3 flex-shrink-0 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(item.due_date).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base font-bold text-gray-900">Upcoming Events</h3>
              <span className="ml-1 text-xs text-gray-400">(30 days)</span>
            </div>
            <div className="p-4 space-y-2">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No upcoming events.</p>
              ) : (
                upcomingEvents.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-semibold text-gray-800 truncate">{item.title}</span>
                    <span className="text-xs text-gray-400 ml-3 flex-shrink-0 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(item.start_time).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
