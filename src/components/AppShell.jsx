/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Settings, ChevronDown, Moon, Sun } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { dFetch } from "@/lib/api";

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
  const [theme, setTheme] = useState("light");
  const [internalUser, setInternalUser] = useState(null);

  useEffect(() => {
    // 1. Sync internal user state with prop or localStorage
    if (user) {
      setInternalUser(user);
      localStorage.setItem("userProfile", JSON.stringify(user));
    } else {
      const savedUser = localStorage.getItem("userProfile");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && typeof parsed === 'object') {
            setInternalUser(parsed);
          }
        } catch (e) {
          console.error("Failed to parse saved user profile");
        }
      }
    }

    // 2. Theme Initialization
    const savedTheme = localStorage.getItem("theme");
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initialTheme = savedTheme || systemTheme;

    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [user]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };


  const handleLogout = async () => {
    try {
      // 1. Backend logout (clears HttpOnly cookies)
      await dFetch("/api/auth/logout", { method: "POST" });

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

  const displayName = internalUser?.full_name || internalUser?.fullname || "";
  const avatarInitial =
    (displayName && displayName.trim()[0]) ||
    (internalUser?.email && internalUser.email[0]) ||
    "U";

  return (
    <div className={`${fullHeight ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]'} bg-white dark:bg-neutral-950 flex flex-col transition-colors duration-300`}>
      <header className="w-full h-16 bg-white/60 dark:bg-neutral-900/60 border-b border-black/10 dark:border-white/10 flex items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-16 sticky top-0 z-20 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-gray-950 dark:bg-white rounded-lg"></div>
            <span className="text-neutral-950 dark:text-white text-base sm:text-xl font-bold font-['Arimo'] whitespace-nowrap">A+ Flow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-base text-gray-500 dark:text-gray-400">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActiveNav(activePath, item.href)
                    ? "font-['Inter'] text-black dark:text-white font-medium"
                    : "font-['Arimo'] hover:text-black dark:hover:text-white"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-all active:scale-95 shadow-sm"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <div
            className="relative"
            onMouseEnter={() => setIsMenuOpen(true)}
            onMouseLeave={() => setIsMenuOpen(false)}
          >
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="px-2 sm:px-3.5 py-1.5 rounded-xl flex justify-center items-center gap-2 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all duration-200">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-sm overflow-hidden group-hover:shadow-md transition-all">
                  {internalUser?.avatar_url ? (
                    <img src={internalUser.avatar_url} alt="User" className="w-full h-full object-cover" />

                  ) : (
                    avatarInitial.toUpperCase()
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-neutral-950 dark:text-white text-xs font-bold font-['Inter'] leading-tight max-w-[100px] truncate">
                    {displayName}
                  </div>
                  <div className="text-gray-400 dark:text-gray-500 text-[10px] font-medium leading-tight truncate max-w-[100px]">
                    {internalUser?.email}
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {/* User Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full pt-1 w-64 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-gray-100 dark:border-white/10 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-neutral-800/50">
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Signed in as</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{internalUser?.email}</p>
                  </div>

                  <div className="p-2">
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      View Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Account Settings
                    </Link>
                  </div>

                  <div className="p-2 border-t border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-neutral-800/20">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="md:hidden border-b border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 px-3 py-2 overflow-x-auto shrink-0">
        <div className="flex items-center gap-2 min-w-max">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActiveNav(activePath, item.href)
                  ? "px-3 py-1.5 rounded-full bg-black dark:bg-white text-white dark:text-neutral-950 text-xs font-medium"
                  : "px-3 py-1.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-neutral-700"
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
