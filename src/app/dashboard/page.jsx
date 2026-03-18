'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      localStorage.removeItem('userProfile');
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-950 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-['Arimo']">Loading...</p>
        </div>
      </div>
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
            Your dashboard is ready. Start managing your projects and team workflow.
          </p>
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
              Manage and track your active projects
            </p>
            <Link
              href="#"
              className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold font-['Arimo'] hover:bg-blue-200 transition-colors"
            >
              View Projects →
            </Link>
          </div>

          {/* Teams Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-xl font-bold text-neutral-950 font-['Arimo'] mb-2">
              Team Members
            </h3>
            <p className="text-gray-600 font-['Arimo'] mb-4">
              Collaborate with your team members
            </p>
            <Link
              href="#"
              className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold font-['Arimo'] hover:bg-purple-200 transition-colors"
            >
              View Teams →
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
              View upcoming deadlines and events
            </p>
            <Link
              href="#"
              className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold font-['Arimo'] hover:bg-green-200 transition-colors"
            >
              View Calendar →
            </Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
