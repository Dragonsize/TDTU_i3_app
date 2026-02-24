"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getProfile } from "../lib/supabaseClient.js";

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      const data = await getProfile();
      setProfile(data);
    }
    fetchProfile();
  }, []);

  if (!profile) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-600 cursor-pointer border-4 border-white shadow-lg hover:shadow-xl transition" title="Change avatar">
          {/* Avatar: fallback to first letter if no avatar */}
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span>{profile.full_name ? profile.full_name[0].toUpperCase() : "U"}</span>
          )}
        </div>
        <div className="text-xl font-semibold mt-2">{profile.full_name || "User"}</div>
        <div className="text-gray-500">{profile.email}</div>
        {/* Add more settings here */}
        <div className="mt-8 w-full">
          <h2 className="text-lg font-bold mb-2">Account Settings</h2>
          <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
            <div><span className="font-medium">Email:</span> {profile.email}</div>
            <div><span className="font-medium">Full Name:</span> {profile.full_name}</div>
            {/* Add more fields as needed */}
          </div>
        </div>
      </div>
    </div>
  );
}
