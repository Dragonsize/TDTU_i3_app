'use client';
import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-white">
      {/* Header */}
      <header className="w-full h-14 md:h-16 bg-white/60 backdrop-blur-sm border-b border-black/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-4 md:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-6 md:w-7 h-6 md:h-7 bg-gray-950 rounded-lg"></div>
            <span className="text-lg md:text-xl font-bold text-neutral-950 font-['Arimo']">A+ Flow</span>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/login" className="px-4 md:px-6 h-9 md:h-10 bg-zinc-300 rounded-full flex items-center justify-center text-black text-sm md:text-base font-normal font-['Arimo'] hover:bg-zinc-400 transition-colors duration-200">
              Login
            </Link>
            <Link href="/signup" className="px-4 md:px-6 h-9 md:h-10 bg-zinc-300 rounded-full flex items-center justify-center text-black text-sm md:text-base font-normal font-['Arimo'] hover:bg-zinc-400 transition-colors duration-200">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-20 lg:py-32 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center">
          {/* Badge */}
          <div className="mb-6 md:mb-8 px-3 md:px-4 py-1.5 md:py-2 bg-gray-100 rounded-full border border-black/0">
            <span className="text-gray-950 text-xs md:text-sm font-normal font-['Arimo']">🎉 New: AI-powered features coming soon</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-950 text-center font-['Inter'] leading-tight mb-3 md:mb-4">
            Team Work Management System
          </h1>

          {/* Subtitle */}
          <div className="text-3xl md:text-4xl lg:text-5xl font-semibold text-blue-600 text-center font-['Arimo'] leading-tight mb-8 md:mb-12">
            Smart Scheduling
          </div>

          {/* Description */}
          <p className="text-base md:text-lg text-gray-600 text-center font-['Arimo'] leading-relaxed max-w-2xl mb-10 md:mb-14">
            Everything you need for managing projects, collaborating with teams, and organizing your workflow in one unified platform.
          </p>

          {/* CTA Button */}
          <Link href="/login" className="w-full sm:w-auto px-8 md:px-12 h-12 md:h-14 lg:h-16 bg-gray-950 rounded-lg flex items-center justify-center gap-2 md:gap-3 hover:bg-gray-800 transition-colors duration-200 shadow-lg hover:shadow-xl">
            <span className="text-white text-lg md:text-xl font-semibold font-['Arimo']">Get Started</span>
            <svg className="w-5 md:w-6 h-5 md:h-6" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

        {/* Features Section */}
      <section className="w-full py-16 md:py-24 lg:py-32 px-4 md:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16 lg:mb-20">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-950 font-['Arimo'] leading-tight mb-4 md:mb-6">
              Everything you need for seamless teamwork
            </h2>
            <p className="text-base md:text-lg text-gray-600 font-['Arimo'] leading-relaxed max-w-3xl mx-auto">
              From project planning to real-time collaboration, our platform provides all the tools you need to organize, execute, and deliver projects successfully.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
            {/* Kanban Board */}
            <div className="group bg-white rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
              <div className="flex items-start justify-between mb-4 md:mb-6">
                <div className="w-10 md:w-12 h-10 md:h-12 border-2 border-blue-600 rounded-lg group-hover:bg-blue-50 transition-colors"></div>
                <span className="px-2 md:px-3 py-1 md:py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs md:text-sm font-semibold font-['Arimo']">
                  Core
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-neutral-950 font-['Arimo'] mb-2 md:mb-3">
                Kanban Board
              </h3>
              <p className="text-sm md:text-base text-gray-600 font-['Arimo'] leading-relaxed">
                Visualize your entire workflow with intuitive drag-and-drop task management. Move items seamlessly from "To Do" through "In Progress" to "Done".
              </p>
            </div>

            {/* Component Library */}
            <div className="group bg-white rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-lg hover:border-purple-200 transition-all duration-300">
              <div className="flex items-start justify-between mb-4 md:mb-6">
                <div className="w-10 md:w-12 h-10 md:h-12 flex gap-1.5 md:gap-2">
                  <div className="flex-1 h-10 md:h-12 border-2 border-purple-600 rounded-lg group-hover:bg-purple-50 transition-colors"></div>
                  <div className="flex-1 h-10 md:h-12 border-2 border-purple-600 rounded-lg group-hover:bg-purple-50 transition-colors"></div>
                </div>
                <span className="px-2 md:px-3 py-1 md:py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs md:text-sm font-semibold font-['Arimo']">
                  Core
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-neutral-950 font-['Arimo'] mb-2 md:mb-3">
                Team Collaboration
              </h3>
              <p className="text-sm md:text-base text-gray-600 font-['Arimo'] leading-relaxed">
                Work together in real-time with built-in comments, assignments, and activity tracking. Keep everyone on the same page.
              </p>
            </div>

            {/* Analytics & Insights */}
            <div className="group bg-white rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-lg hover:border-green-200 transition-all duration-300">
              <div className="flex items-start justify-between mb-4 md:mb-6">
                <div className="w-10 md:w-12 h-10 md:h-12 border-2 border-green-600 rounded-xl group-hover:bg-green-50 transition-colors"></div>
                <span className="px-2 md:px-3 py-1 md:py-1.5 bg-green-100 text-green-700 rounded-full text-xs md:text-sm font-semibold font-['Arimo']">
                  Pro
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-neutral-950 font-['Arimo'] mb-2 md:mb-3">
                Analytics & Insights
              </h3>
              <p className="text-sm md:text-base text-gray-600 font-['Arimo'] leading-relaxed">
                Track progress with beautiful dashboards and reports. Monitor team productivity, identify bottlenecks, and optimize workflows.
              </p>
            </div>

            {/* Smart Scheduling */}
            <div className="group bg-white rounded-2xl border border-gray-200 p-6 md:p-8 hover:shadow-lg hover:border-orange-200 transition-all duration-300">
              <div className="flex items-start justify-between mb-4 md:mb-6">
                <div className="w-10 md:w-12 h-10 md:h-12 border-2 border-orange-600 rounded-lg group-hover:bg-orange-50 transition-colors flex items-center justify-center">
                  <div className="w-6 md:w-7 h-6 md:h-7 border-2 border-orange-600 rounded"></div>
                </div>
                <span className="px-2 md:px-3 py-1 md:py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs md:text-sm font-semibold font-['Arimo']">
                  Smart
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-neutral-950 font-['Arimo'] mb-2 md:mb-3">
                Smart Scheduling
              </h3>
              <p className="text-sm md:text-base text-gray-600 font-['Arimo'] leading-relaxed">
                Intelligent scheduling with deadline management, calendar integration, and automated reminders to keep projects on track.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 bg-white py-8 md:py-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
            {/* Left - Brand */}
            <div className="flex items-center gap-2">
              <div className="w-6 md:w-7 h-6 md:h-7 bg-gray-950 rounded-lg"></div>
              <span className="text-base md:text-lg font-bold text-neutral-950 font-['Arimo']">A+ Flow</span>
            </div>

            {/* Center - Copyright */}
            <p className="text-gray-500 text-xs md:text-sm font-['Arimo']">© 2026 A+ Flow. All rights reserved.</p>

            {/* Right - Links */}
            <div className="flex items-center gap-4 md:gap-6">
              <Link href="#" className="text-gray-500 text-xs md:text-sm font-['Arimo'] hover:text-gray-950 transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="#" className="text-gray-500 text-xs md:text-sm font-['Arimo'] hover:text-gray-950 transition-colors duration-200">
                Terms
              </Link>
              <Link href="#" className="text-gray-500 text-xs md:text-sm font-['Arimo'] hover:text-gray-950 transition-colors duration-200">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
