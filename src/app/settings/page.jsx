"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AppShell from "@/components/AppShell";
import { dFetch } from "@/lib/api";
import { User, Mail, Key, Bot, Link as LinkIcon, LogOut, Edit2, Check, X, Shield, Cpu } from "lucide-react";

export default function SettingsPage() {
  const [profile, setProfile] = useState({ full_name: "", email: "", avatar_url: null });
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [chatbotApiKey, setChatbotApiKey] = useState("");
  const [chatbotProvider, setChatbotProvider] = useState("openai-compatible");
  const [chatbotApiBase, setChatbotApiBase] = useState("https://api.openai.com/v1");
  const [chatbotModel, setChatbotModel] = useState("gpt-4o-mini");
  const [chatbotSaved, setChatbotSaved] = useState("");
  const router = useRouter();

  useEffect(() => {
    dFetch("/api/profile")

      .then((res) => res.json())
      .then((data) => {
        if (data.profile) setProfile(data.profile);
        else router.push("/login");
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    setChatbotApiKey(localStorage.getItem("chatbot_api_key") || "");
    setChatbotProvider(localStorage.getItem("chatbot_provider") || "openai-compatible");
    setChatbotApiBase(localStorage.getItem("chatbot_api_base") || "https://api.openai.com/v1");
    setChatbotModel(localStorage.getItem("chatbot_api_model") || "gpt-4o-mini");
  }, []);

  useEffect(() => {
    if (chatbotProvider === "google-ai-studio" && !chatbotApiBase) {
      setChatbotApiBase("https://generativelanguage.googleapis.com/v1beta");
    }
  }, [chatbotProvider, chatbotApiBase]);

  const handleRename = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await dFetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      // 1. Backend logout
      await dFetch("/api/auth/logout", { method: "POST" });
      
      // 2. Supabase logout
      const { supabase } = await import("@/lib/supabaseClient");
      if (supabase) {
        await supabase.auth.signOut();
      }

      // 3. Clear local cache
      localStorage.removeItem("userProfile");
      
      // 4. Redirect
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Logout failed, but you are being redirected");
      router.push("/login");
    }
  };

  const handleSaveChatbotSettings = () => {
    localStorage.setItem("chatbot_api_key", chatbotApiKey.trim());
    localStorage.setItem("chatbot_provider", chatbotProvider);
    localStorage.setItem(
      "chatbot_api_base",
      chatbotApiBase.trim() || (chatbotProvider === "google-ai-studio" ? "https://generativelanguage.googleapis.com/v1beta" : "https://api.openai.com/v1")
    );
    localStorage.setItem("chatbot_api_model", chatbotModel.trim() || (chatbotProvider === "google-ai-studio" ? "gemini-1.5-flash" : "gpt-4o-mini"));
    setChatbotSaved("Chatbot API settings saved successfully!");
    setTimeout(() => setChatbotSaved(""), 3000);
  };

  return (
    <AppShell user={profile} activePath="/settings" contentClassName="flex-1 bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">Settings</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2 shadow-sm">
            <X className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Profile Summary & Danger Zone */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Profile Avatar Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center transition-all hover:shadow-md">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-5xl font-bold text-blue-600 border-4 border-white shadow-xl overflow-hidden mb-5 relative">
                {profile.avatar_url ? (
                  <Image 
                    src={profile.avatar_url} 
                    alt="avatar" 
                    fill
                    sizes="128px"
                    className="object-cover" 
                  />
                ) : (
                  <span>{profile.full_name ? profile.full_name[0].toUpperCase() : "U"}</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{profile.full_name || "User"}</h2>
              <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-2">
                <Mail className="w-4 h-4" /> {profile.email}
              </p>
            </div>

            {/* Danger Zone Card */}
            <div className="bg-red-50/50 rounded-3xl border border-red-100 p-6">
              <h3 className="text-red-800 font-bold mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Danger Zone
              </h3>
              <p className="text-red-600/80 text-sm mb-5 leading-relaxed">
                Log out of your account on this device. You will need to sign in again to access your projects.
              </p>
              <button 
                onClick={handleLogout} 
                className="w-full flex items-center justify-center gap-2 bg-red-600 text-white rounded-xl py-3 font-medium hover:bg-red-700 transition-colors shadow-sm shadow-red-200 active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
          
          {/* Right Column - Account Details & API Config */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Account Information Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-white/50">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-500" />
                  Personal Information
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Email Box */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="truncate">{profile.email}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 ml-1">Your email address is used for authentication and cannot be changed.</p>
                  </div>

                  {/* Name Box */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    {editing ? (
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1 text-gray-700">
                          <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            className="w-full border border-blue-200 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Enter new name"
                            disabled={saving}
                            autoFocus
                          />
                        </div>
                        <button
                          className="flex items-center justify-center bg-blue-600 text-white w-12 h-12 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm shadow-blue-200"
                          onClick={handleRename}
                          disabled={saving || !newName.trim()}
                          title="Save change"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          className="flex items-center justify-center bg-gray-100 text-gray-600 w-12 h-12 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
                          onClick={() => { setEditing(false); setNewName(""); }}
                          disabled={saving}
                          title="Cancel"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl group hover:border-blue-200 transition-colors">
                        <div className="flex items-center gap-3 text-gray-800">
                          <User className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          <span className="font-medium">{profile.full_name || "Set your full name"}</span>
                        </div>
                        <button
                          className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          onClick={() => { setEditing(true); setNewName(profile.full_name || ""); }}
                        >
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Chatbot Config Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
              <div className="px-6 py-5 border-b border-gray-100 bg-white/50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-500" />
                  AI Assistant Settings
                </h3>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Provider</label>
                  <div className="relative text-gray-700">
                    <Bot className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={chatbotProvider}
                      onChange={(e) => setChatbotProvider(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white"
                    >
                      <option value="openai-compatible">OpenAI Compatible (OpenAI, OpenRouter, Together, Groq)</option>
                      <option value="google-ai-studio">Google AI Studio (Gemini)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
                  <div className="relative text-gray-700">
                    <Key className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      value={chatbotApiKey}
                      onChange={(e) => setChatbotApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-300 font-mono"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 ml-1">
                    Leave blank to use the default server key. An API key here stores locally and overrides the default.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Base URL</label>
                    <div className="relative text-gray-700">
                      <LinkIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={chatbotApiBase}
                        onChange={(e) => setChatbotApiBase(e.target.value)}
                        placeholder={chatbotProvider === "google-ai-studio" ? "https://generativelanguage.googleapis.com/v1beta" : "https://api.openai.com/v1"}
                        className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Model</label>
                    <div className="relative text-gray-700">
                      <Cpu className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={chatbotModel}
                        onChange={(e) => setChatbotModel(e.target.value)}
                        placeholder={chatbotProvider === "google-ai-studio" ? "gemini-1.5-flash" : "gpt-4o-mini"}
                        className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-gray-50">
                  <div className="text-sm font-medium text-emerald-600 min-h-[1.25rem]">
                    {chatbotSaved && (
                      <span className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                        <Check className="w-4 h-4" /> {chatbotSaved}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleSaveChatbotSettings}
                    className="flex items-center gap-2 bg-gray-900 text-white rounded-xl px-6 py-2.5 font-medium hover:bg-black transition-all active:scale-[0.98] shadow-sm shadow-gray-200"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
