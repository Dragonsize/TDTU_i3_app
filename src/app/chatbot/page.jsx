
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

const STARTER_PROMPTS = [
  "How do I create a new project?",
  "How can I create a workflow for this project?",
  "How do I assign members to a workflow?",
  "How do I create a deadline and assign it?",
  "Show me how to set a team meeting from calendar.",
];

export default function ChatbotPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! Ask me anything about your project workflows, deadlines, chat, files, or scheduling.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const placeholderText = STARTER_PROMPTS[messages.length % STARTER_PROMPTS.length];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/profile', { credentials: 'include' });
        const data = await response.json();
        if (!data.profile) {
          router.push('/login');
          return;
        }
        setUser(data.profile);
      } catch (err) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="w-full min-h-[100dvh] bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-950 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-['Arimo']">Loading...</p>
        </div>
      </div>
    );
  }

  const sendQuestion = async (e, overrideQuestion = "") => {
    e.preventDefault();
    const trimmed = (overrideQuestion || question).trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setQuestion("");

    try {
      const apiKey = localStorage.getItem("chatbot_api_key") || "";
      const apiBase = localStorage.getItem("chatbot_api_base") || "";
      const model = localStorage.getItem("chatbot_api_model") || "";

      const res = await fetch("/api/chatbot", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-chatbot-api-key": apiKey } : {}),
        },
        body: JSON.stringify({
          question: trimmed,
          ...(apiBase ? { api_base: apiBase } : {}),
          ...(model ? { model } : {}),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || "Failed to get chatbot response");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.answer || "No response." }]);
    } catch (err) {
      setError(err.message || "Failed to get chatbot response");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I could not answer right now. Check your API settings in Settings page." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleStarterPrompt = (prompt, sendNow = false) => {
    if (sending) return;
    setQuestion(prompt);
    if (!sendNow) return;

    // Submit starter immediately for quick onboarding.
    const syntheticEvent = { preventDefault: () => {} };
    sendQuestion(syntheticEvent, prompt);
  };

  return (
    <AppShell user={user} activePath="/chatbot" contentClassName="flex-1">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 min-h-[calc(100dvh-4rem)] flex flex-col">
        <div className="mb-3">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 font-['Arimo']">Project Chatbot</h1>
          <p className="text-sm text-slate-600 mt-1">Configure API key/base/model in Settings to use your own AI provider.</p>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleStarterPrompt(prompt, true)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex-1 rounded-xl border border-slate-200 bg-white shadow-sm p-3 sm:p-4 overflow-auto space-y-3">
          {messages.map((msg, idx) => (
            <div key={`${msg.role}-${idx}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                  msg.role === "user"
                    ? "bg-[#1a73e8] text-white"
                    : "bg-slate-100 text-slate-900"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={sendQuestion} className="mt-3 flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={placeholderText}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/30"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !question.trim()}
            className="rounded-lg bg-[#1a73e8] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#1765cc] disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      </main>
    </AppShell>
  );
}
