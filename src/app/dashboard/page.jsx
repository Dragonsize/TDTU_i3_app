'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import PageLoader from '@/components/PageLoader';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    projects: 0,
    channels: 0,
    files: 0,
    deadlines: 0,
    events: 0,
  });
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
      fetch(`/api/calendar/events?start=${encodeURIComponent(now.toISOString())}&end=${encodeURIComponent(in30Days.toISOString())}`, {
        credentials: 'include',
      }),
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

    setStats({
      projects: safeProjects.length,
      channels: safeChannels.length,
      files: safeDocuments.length,
      deadlines: safeDeadlines.length,
      events: safeEvents.length,
    });
    setUpcomingDeadlines(safeDeadlines.slice(0, 4));
    setUpcomingEvents(safeEvents.slice(0, 4));
  };

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (!response.ok) {
          router.push('/login');
          return;
        }

        const data = await response.json();
        setUser(data.user);

        // Also get profile data
        const profileResponse = await fetch('/api/profile', {
          credentials: 'include',
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          localStorage.setItem('userProfile', JSON.stringify(profileData.profile));
          setUser((prev) => ({ ...prev, ...profileData.profile }));
        }

        await fetchDashboardState();
      } catch (err) {
        console.error('Auth check failed:', err);
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

  return (
    <AppShell user={user} activePath="/dashboard" contentClassName="flex-1">

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-950 font-['Inter'] leading-tight mb-3 md:mb-4">
            Welcome Back, {user?.fullname?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-base md:text-lg text-gray-600 font-['Arimo']">
            Your workspace now includes projects, chat, documents, and team meeting planning.
          </p>
        </div>

        {dashboardError && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {dashboardError}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5 mb-10">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500 font-['Arimo']">Projects</div>
            <div className="text-2xl font-bold font-['Inter'] text-neutral-950 mt-1">{stats.projects}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500 font-['Arimo']">Channels</div>
            <div className="text-2xl font-bold font-['Inter'] text-neutral-950 mt-1">{stats.channels}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500 font-['Arimo']">Files</div>
            <div className="text-2xl font-bold font-['Inter'] text-neutral-950 mt-1">{stats.files}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500 font-['Arimo']">Deadlines (14d)</div>
            <div className="text-2xl font-bold font-['Inter'] text-neutral-950 mt-1">{stats.deadlines}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500 font-['Arimo']">Events (30d)</div>
            <div className="text-2xl font-bold font-['Inter'] text-neutral-950 mt-1">{stats.events}</div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Projects Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-neutral-950 font-['Arimo'] mb-2">
              Projects
            </h3>
            <p className="text-gray-600 font-['Arimo'] mb-4">
              Manage project workspaces, members, and progress.
            </p>
            <Link
              href="/project"
              className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold font-['Arimo'] hover:bg-blue-200 transition-colors"
            >
              View Projects →
            </Link>
          </div>

          {/* Team Planner Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-xl font-bold text-neutral-950 font-['Arimo'] mb-2">
              Team Availability
            </h3>
            <p className="text-gray-600 font-['Arimo'] mb-4">
              Compare member calendars and schedule meetings fast.
            </p>
            <Link
              href="/calendar"
              className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold font-['Arimo'] hover:bg-purple-200 transition-colors"
            >
              Open Planner →
            </Link>
          </div>

          {/* Calendar Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="text-xl font-bold text-neutral-950 font-['Arimo'] mb-2">
              Calendar
            </h3>
            <p className="text-gray-600 font-['Arimo'] mb-4">
              Create events, edit schedules, and manage timeline.
            </p>
            <Link
              href="/calendar"
              className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold font-['Arimo'] hover:bg-green-200 transition-colors"
            >
              View Calendar →
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-xl font-bold text-neutral-950 font-['Arimo'] mb-2">Chat</h3>
            <p className="text-gray-600 font-['Arimo'] mb-4">Coordinate in channels and direct messages.</p>
            <Link href="/chat" className="inline-block px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-semibold font-['Arimo'] hover:bg-yellow-200 transition-colors">
              Open Chat →
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📁</span>
            </div>
            <h3 className="text-xl font-bold text-neutral-950 font-['Arimo'] mb-2">Files</h3>
            <p className="text-gray-600 font-['Arimo'] mb-4">Store and share project documents securely.</p>
            <Link href="/files" className="inline-block px-4 py-2 bg-sky-100 text-sky-700 rounded-lg font-semibold font-['Arimo'] hover:bg-sky-200 transition-colors">
              View Files →
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-bold text-neutral-950 font-['Arimo'] mb-2">Assistant</h3>
            <p className="text-gray-600 font-['Arimo'] mb-4">Use chatbot help for quick onboarding and guidance.</p>
            <Link href="/chatbot" className="inline-block px-4 py-2 bg-pink-100 text-pink-700 rounded-lg font-semibold font-['Arimo'] hover:bg-pink-200 transition-colors">
              Ask Chatbot →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-bold font-['Arimo'] text-neutral-950 mb-3">Upcoming Deadlines</h3>
            <div className="space-y-2">
              {upcomingDeadlines.length === 0 && (
                <p className="text-sm text-gray-500 font-['Arimo']">No upcoming deadlines in the next 14 days.</p>
              )}
              {upcomingDeadlines.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 px-3 py-2">
                  <div className="text-sm font-semibold text-neutral-900">{item.title}</div>
                  <div className="text-xs text-gray-500">Due: {new Date(item.due_date).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-bold font-['Arimo'] text-neutral-950 mb-3">Upcoming Events</h3>
            <div className="space-y-2">
              {upcomingEvents.length === 0 && (
                <p className="text-sm text-gray-500 font-['Arimo']">No upcoming events in the next 30 days.</p>
              )}
              {upcomingEvents.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-100 px-3 py-2">
                  <div className="text-sm font-semibold text-neutral-900">{item.title}</div>
                  <div className="text-xs text-gray-500">Starts: {new Date(item.start_time).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
