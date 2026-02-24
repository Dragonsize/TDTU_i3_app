"use client";
import React from "react";

export default function UserAvatar() {
  let user = null;
  if (typeof window !== 'undefined') {
    try { user = JSON.parse(localStorage.getItem('userProfile')); } catch {}
  }
  const fullName = user?.full_name || 'User';
  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/settings'} title="Account settings">
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 border-2 border-white hover:shadow-lg transition">
        <span>{fullName[0]}</span>
      </div>
      <div className="text-neutral-950 text-xs font-normal font-['Arimo']">{fullName}</div>
    </div>
  );
}
