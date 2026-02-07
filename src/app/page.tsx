'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [email, setEmail] = useState('');

  return (
    <div className="w-[1440px] h-[2400px] relative bg-white overflow-hidden">
      <div className="w-[1438.96px] h-16 px-32 pb-px left-[1px] top-0 absolute bg-white/60 border-b border-black/10 inline-flex flex-col justify-between items-center">
        <div className="w-[1387px] h-9 inline-flex justify-between items-start">
          <div className="w-[589px] h-7 flex justify-between items-center">
            <div className="w-24 h-7 flex justify-start items-center gap-1.5">
              <div className="w-7 h-7 relative bg-gray-950 rounded-lg"></div>
              <div className="flex-1 h-5 relative">
                <div className="left-0 top-[-1px] absolute justify-start text-neutral-950 text-xl font-bold font-['Arimo'] leading-5">A+ Flow</div>
              </div>
            </div>
            <div className="w-96 h-5 flex justify-start items-center gap-5">
              <div className="w-24 inline-flex flex-col justify-center items-center gap-2.5">
                <Link href="#" className="justify-start text-gray-500 text-base font-normal font-['Inter'] leading-5">
                  Project
                </Link>
              </div>
              <div className="w-24 self-stretch inline-flex flex-col justify-center items-center gap-2.5">
                <Link href="/chatbot" className="justify-start text-gray-500 text-base font-normal font-['Arimo'] leading-5">
                  ChatBot
                </Link>
              </div>
              <div className="w-24 self-stretch inline-flex flex-col justify-center items-center gap-2.5">
                <Link href="/chatbot" className="justify-start text-gray-500 text-base font-normal font-['Arimo'] leading-5">
                  Chat
                </Link>
              </div>
              <div className="w-24 inline-flex flex-col justify-center items-center gap-2.5">
                <Link href="/files" className="justify-start text-gray-500 text-base font-normal font-['Arimo'] leading-5">
                  File
                </Link>
              </div>
            </div>
          </div>
          <div className="w-48 h-8 flex justify-start items-center gap-3.5">
            <Link href="/login" className="w-16 h-8 px-3.5 py-1.5 rounded-md flex justify-center items-center gap-1.5">
              <div className="text-center justify-start text-neutral-950 text-xs font-normal font-['Arimo'] leading-4">Sign In</div>
            </Link>
            <Link href="/login" className="w-24 h-8 px-3.5 py-1.5 bg-gray-950 rounded-md flex justify-center items-center gap-1.5">
              <div className="text-center justify-start text-white text-xs font-normal font-['Arimo'] leading-4">Get Started</div>
            </Link>
          </div>
        </div>
      </div>

      <div className="w-[1440px] h-96 left-0 top-[82px] absolute inline-flex flex-col justify-start items-start">
        <div className="w-[1418px] h-96 pr-32 flex flex-col justify-start items-start overflow-hidden">
          <div className="w-[1418px] h-96 relative">
            <div className="w-56 h-5 px-1.5 py-0.5 left-[595px] top-[24px] absolute bg-gray-100 rounded-md outline outline-1 outline-offset-[-1px] outline-black/0 inline-flex justify-center items-center gap-1 overflow-hidden">
              <div className="flex-1 text-center justify-start text-gray-950 text-xs font-normal font-['Arimo'] leading-4">
                🎉 New: AI-powered component generation
              </div>
            </div>
            <div className="w-[705px] h-16 left-[366px] top-[165px] absolute text-center justify-start text-neutral-950 text-6xl font-normal font-['Arimo'] leading-[52.50px]">
              lịch trình thông minh
            </div>
            <div className="w-[532px] h-28 pr-[0.02px] left-[443px] top-[283px] absolute inline-flex flex-col justify-between items-center">
              <Link href="/login" className="w-72 h-16 relative bg-gray-950 rounded-md">
                <div className="w-44 h-9 left-[44.01px] top-[17px] absolute text-center justify-center text-white text-xl font-normal font-['Arimo'] leading-4">
                  Start Free Trial
                </div>
                <div className="w-11 h-11 left-[202.01px] top-[13px] absolute overflow-hidden">
                  <div className="w-7 h-0 left-[9.38px] top-[22.50px] absolute outline outline-1 outline-offset-[-0.58px] outline-white"></div>
                  <div className="w-3.5 h-7 left-[22.50px] top-[9.38px] absolute outline outline-1 outline-offset-[-0.58px] outline-white"></div>
                </div>
              </Link>
            </div>
            <div className="w-[891px] h-20 left-[293px] top-[91px] absolute text-center justify-start text-neutral-950 text-6xl font-normal font-['Inter'] leading-[52.50px]">
              Hệ thống Quản Lý Việc nhóm
            </div>
          </div>
        </div>
      </div>

      <div className="w-[1438px] h-[1184px] px-3.5 left-[2px] top-[588px] absolute bg-gray-200/50 inline-flex flex-col justify-center items-center gap-14">
        <div className="self-stretch flex flex-col justify-start items-start gap-3.5">
          <div className="w-[644px] h-9 relative">
            <div className="left-[57.22px] top-[-3px] absolute text-center justify-start text-neutral-950 text-3xl font-normal font-['Arimo'] leading-9">
              Everything you need for design systems
            </div>
          </div>
          <div className="w-[588px] h-12 relative">
            <div className="w-[574px] left-[7.19px] top-[-3px] absolute text-center justify-start text-gray-500 text-base font-normal font-['Arimo'] leading-6">
              From design tokens to component libraries, our platform provides all the tools you need to build and maintain scalable design systems.
            </div>
          </div>
        </div>
        <div className="self-stretch h-[819.80px] inline-flex flex-col justify-start items-start">
          <div className="self-stretch self-stretch relative bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-black/10">
            <div className="w-80 h-20 px-5 pt-5 left-[1px] top-[1px] absolute inline-flex flex-col justify-start items-start">
              <div className="self-stretch h-7 inline-flex justify-between items-center">
                <div className="w-7 h-7 relative overflow-hidden">
                  <div className="w-px h-px left-[15.17px] top-[7px] absolute bg-gray-950 outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                  <div className="w-px h-px left-[19.83px] top-[11.67px] absolute bg-gray-950 outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                  <div className="w-px h-px left-[9.33px] top-[8.17px] absolute bg-gray-950 outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                  <div className="w-px h-px left-[7px] top-[14px] absolute bg-gray-950 outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                  <div className="w-6 h-6 left-[2.33px] top-[2.33px] absolute outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                </div>
                <div className="justify-start text-neutral-950 text-base font-normal font-['Arimo'] leading-6">Kanban Board</div>
                <div className="w-10 h-5 px-1.5 py-0.5 bg-gray-100 rounded-md outline outline-1 outline-offset-[-1px] outline-black/0 flex justify-center items-center gap-1 overflow-hidden">
                  <div className="justify-start text-gray-950 text-xs font-normal font-['Arimo'] leading-4">Core</div>
                </div>
              </div>
              <div className="self-stretch self-stretch relative"></div>
            </div>
            <div className="w-[482px] h-28 left-[29px] top-[64px] absolute">
              <div className="w-[482px] left-0 top-[-1px] absolute justify-start text-gray-500 text-sm font-normal font-['Arimo'] leading-5">
                Trực quan hóa quy trình làm việc từ &quot;Cần làm&quot; đến &quot;Hoàn thành&quot; bằng các thẻ kéo thả.Centralized design tokens for colors, typography, spacing, and more. Keep your brand consistent across all platforms.
              </div>
            </div>
          </div>

          <div className="self-stretch self-stretch relative bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-black/10">
            <div className="w-80 h-20 px-5 pt-5 left-[1px] top-[1px] absolute inline-flex flex-col justify-start items-start">
              <div className="self-stretch h-7 inline-flex justify-between items-center">
                <div className="w-7 h-7 relative overflow-hidden">
                  <div className="w-1.5 h-3.5 left-[18.67px] top-[7px] absolute outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                  <div className="w-1.5 h-3.5 left-[2.33px] top-[7px] absolute outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                </div>
                <div className="w-10 h-5 px-1.5 py-0.5 bg-gray-100 rounded-md outline outline-1 outline-offset-[-1px] outline-black/0 flex justify-center items-center gap-1 overflow-hidden">
                  <div className="justify-start text-gray-950 text-xs font-normal font-['Arimo'] leading-4">Core</div>
                </div>
              </div>
              <div className="self-stretch self-stretch relative">
                <div className="left-0 top-[-3px] absolute justify-start text-neutral-950 text-base font-normal font-['Arimo'] leading-6">
                  Component Library
                </div>
              </div>
            </div>
            <div className="w-64 h-16 left-[22px] top-[107.75px] absolute">
              <div className="w-64 left-0 top-[-1px] absolute justify-start text-gray-500 text-sm font-normal font-['Arimo'] leading-5">
                Pre-built, customizable components with comprehensive documentation and code examples.
              </div>
            </div>
          </div>

          <div className="self-stretch self-stretch relative bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-black/10">
            <div className="w-80 h-20 px-5 pt-5 left-[1px] top-[1px] absolute inline-flex flex-col justify-start items-start">
              <div className="self-stretch h-7 inline-flex justify-between items-center">
                <div className="w-7 h-7 relative overflow-hidden">
                  <div className="w-4 h-1.5 left-[2.33px] top-[17.50px] absolute outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                  <div className="w-2.5 h-2.5 left-[5.83px] top-[3.50px] absolute outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                  <div className="w-1 h-1.5 left-[22.17px] top-[17.65px] absolute outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                  <div className="w-1 h-2.5 left-[18.67px] top-[3.65px] absolute outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                </div>
                <div className="w-8 h-5 px-1.5 py-0.5 bg-gray-100 rounded-md outline outline-1 outline-offset-[-1px] outline-black/0 flex justify-center items-center gap-1 overflow-hidden">
                  <div className="justify-start text-gray-950 text-xs font-normal font-['Arimo'] leading-4">Pro</div>
                </div>
              </div>
              <div className="self-stretch self-stretch relative">
                <div className="left-0 top-[-3px] absolute justify-start text-neutral-950 text-base font-normal font-['Arimo'] leading-6">
                  Team Collaboration
                </div>
              </div>
            </div>
            <div className="w-64 h-16 left-[28px] top-[107.25px] absolute">
              <div className="w-64 left-0 top-[-1px] absolute justify-start text-gray-500 text-sm font-normal font-['Arimo'] leading-5">
                Real-time collaboration tools for designers and developers. Comment, review, and iterate together.
              </div>
            </div>
          </div>

          <div className="self-stretch self-stretch relative bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-black/10">
            <div className="w-80 h-20 px-5 pt-5 left-[1px] top-[1px] absolute inline-flex flex-col justify-start items-start">
              <div className="self-stretch h-7 inline-flex justify-between items-center">
                <div className="w-7 h-7 relative overflow-hidden">
                  <div className="w-5 h-6 left-[3.50px] top-[2.33px] absolute outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                </div>
                <div className="w-7 h-5 px-1.5 py-0.5 bg-gray-100 rounded-md outline outline-1 outline-offset-[-1px] outline-black/0 flex justify-center items-center gap-1 overflow-hidden">
                  <div className="justify-start text-gray-950 text-xs font-normal font-['Arimo'] leading-4">AI</div>
                </div>
              </div>
              <div className="self-stretch self-stretch relative">
                <div className="left-0 top-[-3px] absolute justify-start text-neutral-950 text-base font-normal font-['Arimo'] leading-6">
                  Auto-Generation
                </div>
              </div>
            </div>
            <div className="w-64 h-16 left-[22px] top-[107.75px] absolute">
              <div className="w-60 left-0 top-[-1px] absolute justify-start text-gray-500 text-sm font-normal font-['Arimo'] leading-5">
                AI-powered component and token generation from your existing designs. Save hours of manual work.
              </div>
            </div>
          </div>

          <div className="self-stretch self-stretch relative bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-black/10">
            <div className="w-80 h-24 px-5 pt-5 left-[1px] top-[1px] absolute inline-flex flex-col justify-start items-start">
              <div className="self-stretch self-stretch relative">
                <div className="left-0 top-[-3px] absolute justify-start text-neutral-950 text-base font-normal font-['Arimo'] leading-6">
                  Version Control
                </div>
              </div>
              <div className="self-stretch h-7 inline-flex justify-between items-center">
                <div className="w-7 h-7 relative overflow-hidden">
                  <div className="w-5 h-4 left-[4px] top-[5.50px] absolute bg-zinc-300 rounded-full"></div>
                </div>
                <div className="w-8 h-5 px-1.5 py-0.5 bg-gray-100 rounded-md outline outline-1 outline-offset-[-1px] outline-black/0 flex justify-center items-center gap-1 overflow-hidden">
                  <div className="justify-start text-gray-950 text-xs font-normal font-['Arimo'] leading-4">Pro</div>
                </div>
              </div>
            </div>
            <div className="w-64 h-16 left-[22px] top-[107.75px] absolute">
              <div className="w-64 left-0 top-[-1px] absolute justify-start text-gray-500 text-sm font-normal font-['Arimo'] leading-5">
                Track changes, manage releases, and maintain multiple versions of your design system.
              </div>
            </div>
          </div>

          <div className="self-stretch self-stretch relative bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-black/10">
            <div className="w-80 h-20 px-5 pt-5 left-[1px] top-[1px] absolute inline-flex flex-col justify-start items-start">
              <div className="self-stretch h-7 inline-flex justify-between items-center">
                <div className="w-7 h-7 relative overflow-hidden">
                  <div className="w-5 h-6 left-[4.67px] top-[2.33px] absolute outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                </div>
                <div className="w-16 h-5 px-1.5 py-0.5 bg-gray-100 rounded-md outline outline-1 outline-offset-[-1px] outline-black/0 flex justify-center items-center gap-1 overflow-hidden">
                  <div className="justify-start text-gray-950 text-xs font-normal font-['Arimo'] leading-4">Enterprise</div>
                </div>
              </div>
              <div className="self-stretch self-stretch relative">
                <div className="left-0 top-[-3px] absolute justify-start text-neutral-950 text-base font-normal font-['Arimo'] leading-6">
                  Enterprise Security
                </div>
              </div>
            </div>
            <div className="w-64 h-16 left-[22px] top-[107.75px] absolute">
              <div className="w-60 left-0 top-[-1px] absolute justify-start text-gray-500 text-sm font-normal font-['Arimo'] leading-5">
                SOC 2 compliant with enterprise-grade security features and single sign-on support.
              </div>
            </div>
          </div>

          <div className="self-stretch self-stretch relative bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-black/10">
            <div className="w-80 h-20 px-5 pt-5 left-[1px] top-[1px] absolute inline-flex flex-col justify-start items-start">
              <div className="self-stretch h-7 inline-flex justify-between items-center">
                <div className="w-7 h-7 relative overflow-hidden">
                  <div className="w-4 h-6 left-[5.83px] top-[2.33px] absolute outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                  <div className="w-[0.01px] h-0 left-[14px] top-[21px] absolute outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                </div>
                <div className="w-10 h-5 px-1.5 py-0.5 bg-gray-100 rounded-md outline outline-1 outline-offset-[-1px] outline-black/0 flex justify-center items-center gap-1 overflow-hidden">
                  <div className="justify-start text-gray-950 text-xs font-normal font-['Arimo'] leading-4">Core</div>
                </div>
              </div>
              <div className="self-stretch self-stretch relative">
                <div className="left-0 top-[-3px] absolute justify-start text-neutral-950 text-base font-normal font-['Arimo'] leading-6">
                  Multi-Platform
                </div>
              </div>
            </div>
            <div className="w-64 h-16 left-[22px] top-[107.75px] absolute">
              <div className="w-64 left-0 top-[-1px] absolute justify-start text-gray-500 text-sm font-normal font-['Arimo'] leading-5">
                Export tokens and components for web, mobile, and native platforms. One source of truth.
              </div>
            </div>
          </div>

          <div className="self-stretch self-stretch relative bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-black/10">
            <div className="w-80 h-20 px-5 pt-5 left-[1px] top-[1px] absolute inline-flex flex-col justify-start items-start">
              <div className="self-stretch h-7 inline-flex justify-between items-center">
                <div className="w-7 h-7 relative overflow-hidden">
                  <div className="w-5 h-5 left-[3.50px] top-[3.50px] absolute outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                  <div className="w-0 h-2.5 left-[21px] top-[10.50px] absolute outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                  <div className="w-0 h-3.5 left-[15.17px] top-[5.83px] absolute outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                  <div className="w-0 h-1 left-[9.33px] top-[16.33px] absolute outline outline-2 outline-offset-[-1.17px] outline-gray-950"></div>
                </div>
                <div className="w-8 h-5 px-1.5 py-0.5 bg-gray-100 rounded-md outline outline-1 outline-offset-[-1px] outline-black/0 flex justify-center items-center gap-1 overflow-hidden">
                  <div className="justify-start text-gray-950 text-xs font-normal font-['Arimo'] leading-4">Pro</div>
                </div>
              </div>
              <div className="self-stretch self-stretch relative">
                <div className="left-0 top-[-3px] absolute justify-start text-neutral-950 text-base font-normal font-['Arimo'] leading-6">
                  Analytics &amp; Insights
                </div>
              </div>
            </div>
            <div className="w-64 h-16 left-[22px] top-[107.75px] absolute">
              <div className="w-64 left-0 top-[-1px] absolute justify-start text-gray-500 text-sm font-normal font-['Arimo'] leading-5">
                Track component usage, adoption metrics, and design system health across your organization.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-[1434px] h-[628px] px-32 pt-px left-[6px] top-[1772px] absolute bg-gray-200/50 border-t border-black/10 inline-flex flex-col justify-start items-start">
        <div className="self-stretch h-[498px] px-3.5 pt-14 flex flex-col justify-start items-start gap-7">
          <div className="self-stretch h-80 inline-flex flex-col justify-start items-start">
            <div className="self-stretch self-stretch inline-flex flex-col justify-start items-start gap-3.5">
              <div className="self-stretch h-7 inline-flex justify-start items-center gap-1.5">
                <div className="w-7 h-7 relative bg-gray-950 rounded-lg"></div>
                <div className="w-16 h-5 relative">
                  <div className="left-0 top-[-1px] absolute justify-start text-neutral-950 text-sm font-bold font-['Arimo'] leading-5">StudyFlow</div>
                </div>
              </div>
              <div className="self-stretch h-16 relative">
                <div className="w-72 left-0 top-[-1px] absolute justify-start text-gray-500 text-sm font-normal font-['Arimo'] leading-5">
                  The complete platform for building, maintaining, and scaling design systems that help teams ship consistent experiences faster.
                </div>
              </div>
              <div className="self-stretch h-8 inline-flex justify-start items-start gap-1.5">
                <div className="flex-1 h-8 px-2.5 py-1 bg-zinc-100 rounded-md outline outline-1 outline-offset-[-1px] outline-black/0 flex justify-start items-center overflow-hidden">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-gray-500 text-xs font-normal font-['Arimo'] focus:outline-none"
                  />
                </div>
                <button className="w-20 h-8 px-3.5 py-1.5 bg-gray-950 rounded-md flex justify-center items-center gap-1.5">
                  <div className="text-center justify-start text-white text-xs font-normal font-['Arimo'] leading-4">Subscribe</div>
                </button>
              </div>
            </div>
            <div className="self-stretch self-stretch inline-flex flex-col justify-start items-start gap-3.5">
              <div className="self-stretch h-5 relative">
                <div className="left-0 top-[-1px] absolute justify-start text-neutral-950 text-sm font-normal font-['Arimo'] leading-5">Product</div>
              </div>
              <div className="self-stretch h-24 flex flex-col justify-start items-start gap-1.5">
                <div className="self-stretch h-4 relative">
                  <div className="w-11 h-4 left-0 top-0 absolute inline-flex justify-start items-start">
                    <Link href="#" className="justify-start text-gray-500 text-xs font-normal font-['Arimo'] leading-4">Features</Link>
                  </div>
                </div>
                <div className="self-stretch h-4 relative">
                  <div className="w-9 h-4 left-0 top-0 absolute inline-flex justify-start items-start">
                    <Link href="#" className="justify-start text-gray-500 text-xs font-normal font-['Arimo'] leading-4">Pricing</Link>
                  </div>
                </div>
                <div className="self-stretch h-4 relative">
                  <div className="w-14 h-4 left-0 top-0 absolute inline-flex justify-start items-start">
                    <Link href="#" className="justify-start text-gray-500 text-xs font-normal font-['Arimo'] leading-4">Changelog</Link>
                  </div>
                </div>
                <div className="self-stretch h-4 relative">
                  <div className="w-12 h-4 left-0 top-0 absolute inline-flex justify-start items-start">
                    <Link href="#" className="justify-start text-gray-500 text-xs font-normal font-['Arimo'] leading-4">Roadmap</Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="self-stretch self-stretch inline-flex flex-col justify-start items-start gap-3.5">
              <div className="self-stretch h-5 relative">
                <div className="left-0 top-[-1px] absolute justify-start text-neutral-950 text-sm font-normal font-['Arimo'] leading-5">Resources</div>
              </div>
              <div className="self-stretch h-24 flex flex-col justify-start items-start gap-1.5">
                <div className="self-stretch h-4 relative">
                  <div className="w-20 h-4 left-0 top-0 absolute inline-flex justify-start items-start">
                    <Link href="#" className="justify-start text-gray-500 text-xs font-normal font-['Arimo'] leading-4">Documentation</Link>
                  </div>
                </div>
                <div className="self-stretch h-4 relative">
                  <div className="w-9 h-4 left-0 top-0 absolute inline-flex justify-start items-start">
                    <Link href="#" className="justify-start text-gray-500 text-xs font-normal font-['Arimo'] leading-4">Guides</Link>
                  </div>
                </div>
                <div className="self-stretch h-4 relative">
                  <div className="w-14 h-4 left-0 top-0 absolute inline-flex justify-start items-start">
                    <Link href="#" className="justify-start text-gray-500 text-xs font-normal font-['Arimo'] leading-4">Templates</Link>
                  </div>
                </div>
                <div className="self-stretch h-4 relative">
                  <div className="w-6 h-4 left-0 top-0 absolute inline-flex justify-start items-start">
                    <Link href="#" className="justify-start text-gray-500 text-xs font-normal font-['Arimo'] leading-4">Blog</Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="self-stretch self-stretch inline-flex flex-col justify-start items-start gap-3.5">
              <div className="self-stretch h-5 relative">
                <div className="left-0 top-[-1px] absolute justify-start text-neutral-950 text-sm font-normal font-['Arimo'] leading-5">Company</div>
              </div>
              <div className="self-stretch h-24 flex flex-col justify-start items-start gap-1.5">
                <div className="self-stretch h-4 relative">
                  <div className="w-8 h-4 left-0 top-0 absolute inline-flex justify-start items-start">
                    <Link href="#" className="justify-start text-gray-500 text-xs font-normal font-['Arimo'] leading-4">About</Link>
                  </div>
                </div>
                <div className="self-stretch h-4 relative">
                  <div className="w-10 h-4 left-0 top-0 absolute inline-flex justify-start items-start">
                    <Link href="#" className="justify-start text-gray-500 text-xs font-normal font-['Arimo'] leading-4">Careers</Link>
                  </div>
                </div>
                <div className="self-stretch h-4 relative">
                  <div className="w-10 h-4 left-0 top-0 absolute inline-flex justify-start items-start">
                    <Link href="#" className="justify-start text-gray-500 text-xs font-normal font-['Arimo'] leading-4">Contact</Link>
                  </div>
                </div>
                <div className="self-stretch h-4 relative">
                  <div className="w-11 h-4 left-0 top-0 absolute inline-flex justify-start items-start">
                    <Link href="#" className="justify-start text-gray-500 text-xs font-normal font-['Arimo'] leading-4">Support</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="self-stretch h-px relative bg-black/10"></div>
          <div className="self-stretch h-4 inline-flex justify-between items-center">
            <div className="w-72 h-4 flex justify-start items-start gap-5">
              <div className="w-20 h-4 flex justify-start items-start">
                <Link href="#" className="justify-start text-gray-500 text-xs font-normal font-['Arimo'] leading-4">Privacy Policy</Link>
              </div>
              <div className="flex-1 h-4 flex justify-start items-start">
                <Link href="#" className="justify-start text-gray-500 text-xs font-normal font-['Arimo'] leading-4">Terms of Service</Link>
              </div>
              <div className="w-16 h-4 flex justify-start items-start">
                <Link href="#" className="justify-start text-gray-500 text-xs font-normal font-['Arimo'] leading-4">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="w-52 h-4 inline-flex justify-start items-start">
          <div className="justify-start text-gray-500 text-xs font-normal font-['Arimo'] leading-4">© 2024 DesignKit. All rights reserved.</div>
        </div>
      </div>
    </div>
  );
}