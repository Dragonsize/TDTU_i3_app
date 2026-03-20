"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";



export default function SettingsPage() {

  const [profile, setProfile] = useState({ full_name: "", email: "", avatar_url: null });
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [chatbotApiKey, setChatbotApiKey] = useState("");
  const [chatbotApiBase, setChatbotApiBase] = useState("https://api.openai.com/v1");
  const [chatbotModel, setChatbotModel] = useState("gpt-4o-mini");
  const [chatbotSaved, setChatbotSaved] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/profile", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) setProfile(data.profile);
        else router.push("/login");
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    setChatbotApiKey(localStorage.getItem("chatbot_api_key") || "");
    setChatbotApiBase(localStorage.getItem("chatbot_api_base") || "https://api.openai.com/v1");
    setChatbotModel(localStorage.getItem("chatbot_api_model") || "gpt-4o-mini");
  }, []);

  const handleRename = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ full_name: newName })
      });
      if (!res.ok) throw new Error("Failed to update name");
      const data = await res.json();
      setProfile((prev) => ({ ...prev, full_name: data.profile.full_name }));
      setEditing(false);
      setNewName("");
    } catch (err) {
      setError(err.message || "Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      localStorage.removeItem("userProfile");
      router.push("/login");
    } catch (err) {
      setError("Logout failed");
    }
  };

  const handleSaveChatbotSettings = () => {
    localStorage.setItem("chatbot_api_key", chatbotApiKey.trim());
    localStorage.setItem("chatbot_api_base", chatbotApiBase.trim() || "https://api.openai.com/v1");
    localStorage.setItem("chatbot_api_model", chatbotModel.trim() || "gpt-4o-mini");
    setChatbotSaved("Chatbot API settings saved.");
    setTimeout(() => setChatbotSaved(""), 2500);
  };

  return (
    <AppShell user={profile} activePath="/settings" contentClassName="flex-1">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl font-bold text-gray-600 cursor-pointer border-4 border-white shadow-lg hover:shadow-xl transition" title="Change avatar">
          {/* Avatar: fallback to first letter if no avatar */}
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span>{profile.full_name ? profile.full_name[0].toUpperCase() : "U"}</span>
          )}
        </div>
        <div className="text-xl font-semibold mt-2">
          {editing ? (
            <div className="flex gap-2 items-center">
              <input
                className="border rounded px-2 py-1 text-base"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Enter new name"
                disabled={saving}
              />
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-60"
                onClick={handleRename}
                disabled={saving || !newName.trim()}
              >Save</button>
              <button
                className="text-gray-500 px-2 py-1 hover:underline"
                onClick={() => { setEditing(false); setNewName(""); }}
                disabled={saving}
              >Cancel</button>
            </div>
          ) : (
            <span>{profile.full_name || "User"}</span>
          )}
        </div>
        <button
          className="mt-1 text-xs text-blue-600 hover:underline"
          onClick={() => { setEditing(true); setNewName(profile.full_name || ""); }}
          disabled={editing}
        >Rename</button>
        <div className="text-gray-500">{profile.email}</div>
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        <div className="mt-8 w-full">
          <h2 className="text-lg font-bold mb-2">Account Settings</h2>
          <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
            <div><span className="font-medium">Email:</span> {profile.email}</div>
            <div><span className="font-medium">Full Name:</span> {profile.full_name}</div>
            {/* Add more fields as needed */}
          </div>
        </div>

        <div className="mt-6 w-full">
          <h2 className="text-lg font-bold mb-2">Chatbot API</h2>
          <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-700">API Key</label>
            <input
              type="password"
              value={chatbotApiKey}
              onChange={(e) => setChatbotApiKey(e.target.value)}
              placeholder="Paste your API key"
              className="border rounded px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-500">
              Leave blank to use the default server key. If you enter a key here, it overrides the default for your browser.
            </p>

            <label className="text-sm font-medium text-gray-700">API Base URL</label>
            <input
              type="text"
              value={chatbotApiBase}
              onChange={(e) => setChatbotApiBase(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="border rounded px-3 py-2 text-sm"
            />

            <label className="text-sm font-medium text-gray-700">Model</label>
            <input
              type="text"
              value={chatbotModel}
              onChange={(e) => setChatbotModel(e.target.value)}
              placeholder="gpt-4o-mini"
              className="border rounded px-3 py-2 text-sm"
            />

            <button
              onClick={handleSaveChatbotSettings}
              className="mt-1 bg-gray-900 text-white rounded py-2 text-sm font-medium hover:bg-black"
            >
              Save Chatbot API Settings
            </button>
            {chatbotSaved && <div className="text-green-600 text-sm">{chatbotSaved}</div>}
          </div>
        </div>
        <button
          className="mt-8 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
          onClick={handleLogout}
        >Logout</button>
      </div>
    </div>
    </AppShell>
  );
}
