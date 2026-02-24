"use client";
import React from "react";

export default function UserAvatar() {
  let user = null;
  if (typeof window !== 'undefined') {
    try { user = JSON.parse(localStorage.getItem('userProfile')); } catch {}
  }
  const email = user?.email || '';
  const avatarLetter = email ? email[0].toUpperCase() : 'T';
  return (
    <div
      className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 border-2 border-white hover:shadow-lg transition cursor-pointer"
      onClick={() => window.location.href = '/settings'}
      title="Account settings"
    >
      <span>{avatarLetter}</span>
    </div>
  );
}
