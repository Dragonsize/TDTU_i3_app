'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [email, setEmail] = useState('');

  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden">
      <div className="w-full min-h-screen relative mx-auto">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-black/10 bg-white/60 backdrop-blur-md">
          <nav className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-950 rounded-lg"></div>
              <span className="text-xl font-bold">A+ Flow</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="#" className="text-gray-600 hover:text-gray-900">Project</Link>
              <Link href="/chatbot" className="text-gray-600 hover:text-gray-900">ChatBot</Link>
              <Link href="/files" className="text-gray-600 hover:text-gray-900">File</Link>
              <Link href="/calendar" className="text-gray-600 hover:text-gray-900">Calendar</Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login" className="px-3.5 py-1.5 text-xs font-normal hover:bg-gray-100 rounded-md transition-colors">
                Sign In
              </Link>
              <Link href="/login" className="px-3.5 py-1.5 bg-gray-950 text-white text-xs font-normal rounded-md hover:opacity-90 transition-opacity">
                Get Started
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-2 mb-6 px-3 py-1.5 bg-gray-100 rounded-md">
              <span className="text-gray-950 text-xs font-normal">🎉 New: AI-powered component generation</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Hệ thống Quản Lý <br/>
              <span className="text-gradient">Việc nhóm lịch trình thông minh</span>
            </h1>
            
            <p className="text-base lg:text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Everything you need for building, maintaining, and scaling your team workflows. From design tokens to component libraries, our platform provides all the tools you need.
            </p>

            <Link href="/login" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-950 text-white rounded-md font-semibold hover:opacity-90 transition-opacity">
              <span>Start Free Trial</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-200/50 py-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Everything you need for design systems</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                From design tokens to component libraries, our platform provides all the tools you need to build and maintain scalable design systems.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FeatureCard 
                icon="dashboard"
                title="Kanban Board"
                badge="Core"
                description="Trực quan hóa quy trình làm việc từ 'Cần làm' đến 'Hoàn thành' bằng các thẻ kéo thả. Centralized design tokens for colors, typography, spacing, and more."
              />
              <FeatureCard 
                icon="layers"
                title="Component Library"
                badge="Core"
                description="Pre-built, customizable components with comprehensive documentation and code examples."
              />
              <FeatureCard 
                icon="group"
                title="Team Collaboration"
                badge="Pro"
                description="Real-time collaboration tools for designers and developers. Comment, review, and iterate together."
              />
              <FeatureCard 
                icon="auto_fix_high"
                title="Auto-Generation"
                badge="AI"
                description="AI-powered component and token generation from your existing designs. Save hours of manual work."
              />
              <FeatureCard 
                icon="history"
                title="Version Control"
                badge="Pro"
                description="Track changes, manage releases, and maintain multiple versions of your design system."
              />
              <FeatureCard 
                icon="lock"
                title="Enterprise Security"
                badge="Enterprise"
                description="SOC 2 compliant with enterprise-grade security features and single sign-on support."
              />
              <FeatureCard 
                icon="devices"
                title="Multi-Platform"
                badge="Core"
                description="Export tokens and components for web, mobile, and native platforms. One source of truth."
              />
              <FeatureCard 
                icon="analytics"
                title="Analytics & Insights"
                badge="Pro"
                description="Track component usage, adoption metrics, and design system health across your organization."
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-200/50 border-t border-black/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 bg-gray-950 rounded-lg"></div>
                  <span className="font-bold text-sm">StudyFlow</span>
                </div>
                <p className="text-gray-600 text-sm mb-6">
                  The complete platform for building, maintaining, and scaling design systems that help teams ship consistent experiences faster.
                </p>
                <div className="flex gap-4">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-zinc-100 border border-black/10 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button className="px-3.5 py-1.5 bg-gray-950 text-white text-xs font-normal rounded-md hover:opacity-90 transition-opacity">
                    Subscribe
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-4">Product</h3>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-600 text-xs hover:text-gray-900">Features</Link></li>
                  <li><Link href="#" className="text-gray-600 text-xs hover:text-gray-900">Pricing</Link></li>
                  <li><Link href="#" className="text-gray-600 text-xs hover:text-gray-900">Changelog</Link></li>
                  <li><Link href="#" className="text-gray-600 text-xs hover:text-gray-900">Roadmap</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-4">Resources</h3>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-600 text-xs hover:text-gray-900">Documentation</Link></li>
                  <li><Link href="#" className="text-gray-600 text-xs hover:text-gray-900">Guides</Link></li>
                  <li><Link href="#" className="text-gray-600 text-xs hover:text-gray-900">Templates</Link></li>
                  <li><Link href="#" className="text-gray-600 text-xs hover:text-gray-900">Blog</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-4">Company</h3>
                <ul className="space-y-2">
                  <li><Link href="#" className="text-gray-600 text-xs hover:text-gray-900">About</Link></li>
                  <li><Link href="#" className="text-gray-600 text-xs hover:text-gray-900">Careers</Link></li>
                  <li><Link href="#" className="text-gray-600 text-xs hover:text-gray-900">Contact</Link></li>
                  <li><Link href="#" className="text-gray-600 text-xs hover:text-gray-900">Support</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-black/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-gray-600 text-xs">© 2024 StudyFlow. All rights reserved.</p>
              <div className="flex gap-8">
                <Link href="#" className="text-gray-600 text-xs hover:text-gray-900">Privacy Policy</Link>
                <Link href="#" className="text-gray-600 text-xs hover:text-gray-900">Terms of Service</Link>
                <Link href="#" className="text-gray-600 text-xs hover:text-gray-900">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, badge, description }: { icon: string; title: string; badge: string; description: string }) {
  return (
    <div className="bg-white border border-black/10 rounded-xl p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-base text-gray-950">{icon}</span>
          </div>
          <h3 className="font-semibold text-base">{title}</h3>
        </div>
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-md text-gray-950">
          {badge}
        </span>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
