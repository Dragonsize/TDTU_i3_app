"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Settings, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

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
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401 && !window.location.pathname.startsWith('/login')) {
        router.push('/login');
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      // 1. Backend logout (clears HttpOnly cookies)
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      
      // 2. Supabase logout (clears client-side session)
      if (supabase) {
        await supabase.auth.signOut();
      }
      
      // 3. Clear local cache
      localStorage.removeItem("userProfile");
      
      // 4. Redirect
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      // Fallback redirect even if fetch fails
      router.push("/login");
    }
  };

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

        <div 
          className="relative"
          onMouseEnter={() => setIsMenuOpen(true)}
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="px-2 sm:px-3.5 py-1.5 rounded-xl flex justify-center items-center gap-2 hover:bg-gray-100 transition-all duration-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-sm overflow-hidden group-hover:shadow-md transition-all">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="User" className="w-full h-full object-cover" />
                ) : (
                  avatarInitial.toUpperCase()
                )}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-neutral-950 text-xs font-bold font-['Inter'] leading-tight max-w-[100px] truncate">
                  {displayName}
                </div>
                <div className="text-gray-400 text-[10px] font-medium leading-tight truncate max-w-[100px]">
                  {user?.email}
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* User Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full pt-1 w-64 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Signed in as</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                
                <div className="p-2">
                  <Link 
                    href="/settings" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    View Profile
                  </Link>
                  <Link 
                    href="/settings" 
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Account Settings
                  </Link>
                </div>

                <div className="p-2 border-t border-gray-50 bg-gray-50/30">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
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
