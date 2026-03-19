"use client";

import Link from "next/link";
import React from "react";

const NAV_ITEMS = [
  { href: "/project", label: "Project" },
  { href: "/calendar", label: "Calendar" },
  { href: "/chatbot", label: "ChatBot" },
  { href: "/chat", label: "Chat" },
  { href: "/files", label: "Files" },
];

function isActiveNav(activePath, href) {
  if (!activePath) return false;
  return activePath === href || activePath.startsWith(`${href}/`);
}

export default function AppShell({ user, activePath, contentClassName = "", fullHeight = false, children }) {
  const displayName = user?.full_name || user?.fullname || "";
  const avatarInitial =
    (displayName && displayName.trim()[0]) ||
    (user?.email && user.email[0]) ||
    "U";

  return (
    <div className={`${fullHeight ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'} bg-white flex flex-col`}>
      <header className="w-full h-16 bg-white/60 border-b border-black/10 flex items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-16 sticky top-0 z-20 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-gray-950 rounded-lg"></div>
            <span className="text-neutral-950 text-base sm:text-xl font-bold font-['Arimo'] whitespace-nowrap">A+ Flow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-base text-gray-500">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActiveNav(activePath, item.href)
                    ? "font-['Inter'] text-black font-medium"
                    : "font-['Arimo'] hover:text-black"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link href="/settings" className="flex items-center gap-2" title="Settings">
          <div className="px-2 sm:px-3.5 py-1.5 rounded-md flex justify-center items-center gap-1.5 hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="User" className="w-full h-full object-cover" />
              ) : (
                avatarInitial.toUpperCase()
              )}
            </div>
            <div className="hidden sm:block text-center text-neutral-950 text-xs font-normal font-['Arimo'] leading-4 max-w-[120px] truncate">
              {displayName}
            </div>
          </div>
        </Link>
      </header>

      <nav className="md:hidden border-b border-black/10 bg-white px-3 py-2 overflow-x-auto shrink-0">
        <div className="flex items-center gap-2 min-w-max">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActiveNav(activePath, item.href)
                  ? "px-3 py-1.5 rounded-full bg-black text-white text-xs font-medium"
                  : "px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200"
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className={contentClassName}>{children}</div>
    </div>
  );
}
