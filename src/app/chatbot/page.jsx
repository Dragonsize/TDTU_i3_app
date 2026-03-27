"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import PageLoader from "@/components/PageLoader";
import { dFetch } from "@/lib/api";
import { Bot, Send, Sparkles, AlertCircle, Loader2 } from "lucide-react";

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
  const messagesEndRef = useRef(null);
  const placeholderText = STARTER_PROMPTS[messages.length % STARTER_PROMPTS.length];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await dFetch('/api/profile');
        const data = await response.json();
        if (!data.profile) { router.push('/login'); return; }
        setUser(data.profile);
      } catch { router.push('/login'); }
      finally { setLoading(false); }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <AppShell user={user} activePath="/chatbot" contentClassName="flex-1">
        <PageLoader label="Loading..." />
      </AppShell>
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

      const res = await dFetch("/api/chatbot", {
        method: "POST",
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
      if (!res.ok) throw new Error(data.detail || "Failed to get chatbot response");
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

  const handleStarterPrompt = (prompt) => {
    if (sending) return;
    const syntheticEvent = { preventDefault: () => {} };
    sendQuestion(syntheticEvent, prompt);
  };

  return (
    <AppShell user={user} activePath="/chatbot" contentClassName="flex-1 bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 h-full flex flex-col">

        {/* Header */}
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3 mb-6">
          <Bot className="w-8 h-8 text-indigo-500" />
          AI Assistant
        </h1>

        {/* Starter Prompts */}
        <div className="flex flex-wrap gap-2 mb-4">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleStarterPrompt(prompt)}
              disabled={sending}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm p-5 overflow-y-auto space-y-4 min-h-0">
          {messages.map((msg, idx) => (
            <div key={`${msg.role}-${idx}`} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-indigo-600" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                  msg.role === "user"
                    ? "bg-gray-900 text-white rounded-br-sm"
                    : "bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0">
                <Bot className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={sendQuestion} className="mt-4 flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={placeholderText}
            className="flex-1 h-11 bg-white border border-gray-200 rounded-xl px-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !question.trim()}
            className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-xl px-5 h-11 text-sm font-semibold hover:bg-black transition-all active:scale-[0.98] disabled:opacity-60 shadow-sm"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </form>
      </div>
    </AppShell>
  );
}
