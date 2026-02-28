"use client";
import React, { useEffect, useState, useRef } from "react";
import DOMPurify from "dompurify";

function sanitizeInput(input) {
  // Remove dangerous chars, trim, and limit length
  let text = input.replace(/[<>"'`;]|--|\/\*|\*\//g, "").trim();
  if (text.length > 2000) text = text.slice(0, 2000);
  return text;
}

export default function ChatRoom({ user }) {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const [apiError, setApiError] = useState(null);
  useEffect(() => {
    fetch("/api/chat/channels", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          let msg = "";
          try { msg = (await res.json()).detail || res.statusText; } catch { msg = res.statusText; }
          throw new Error(msg || "API error");
        }
        return res.json();
      })
      .then(setChannels)
      .catch((err) => setApiError(err.message || "Chat API unavailable"));
  }, []);

  useEffect(() => {
    if (!selectedChannel) return;
    setLoading(true);
    fetch(`/api/chat/messages?channel_id=${selectedChannel.id}&limit=30`, { credentials: "include" })
      .then((res) => res.json())
      .then((msgs) => setMessages(msgs || []))
      .finally(() => setLoading(false));
  }, [selectedChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedChannel) return;
    const clean = sanitizeInput(input);
    setSending(true);
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ channel_id: selectedChannel.id, message: clean }),
    });
    if (res.ok) {
      setInput("");
      // Reload messages
      fetch(`/api/chat/messages?channel_id=${selectedChannel.id}&limit=30`, { credentials: "include" })
        .then((res) => res.json())
        .then((msgs) => setMessages(msgs || []));
    }
    setSending(false);
  };

  if (apiError) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded shadow">
          <div className="font-bold mb-2">Chat feature unavailable</div>
          <div>{apiError}</div>
          <div className="mt-2 text-xs text-gray-500">Please try again later or contact support.</div>
        </div>
      </div>
    );
  }

  // Messenger-style layout
  return (
    <div className="flex h-[80vh] border rounded-2xl shadow-lg overflow-hidden bg-white">
      {/* Sidebar: Channel list */}
      <aside className="w-80 bg-neutral-100 border-r flex flex-col">
        <div className="p-5 font-bold text-2xl border-b flex items-center gap-2 bg-white">
          <span className="text-blue-600">Messenger</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {channels.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
              <div className="text-gray-400 text-center">No channels yet.<br/>Create your first chat channel to start messaging.</div>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-semibold shadow"
                onClick={() => alert('Channel creation UI coming soon!')}
              >
                + New Channel
              </button>
            </div>
          ) : (
            channels.map((ch) => (
              <button
                key={ch.id}
                className={`w-full flex items-center gap-3 px-5 py-3 hover:bg-blue-100 transition-all ${selectedChannel?.id === ch.id ? "bg-blue-50 font-bold text-blue-700" : "text-gray-800"}`}
                onClick={() => setSelectedChannel(ch)}
              >
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <img src={ch.avatar_url || "https://placehold.co/40x40"} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                </div>
                <div className="flex-1 text-left">
                  <div className="truncate">{ch.name}</div>
                  <div className="text-xs text-gray-500 truncate">{ch.last_message_at ? new Date(ch.last_message_at).toLocaleString() : ""}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>
      {/* Main chat area */}
      <section className="flex-1 flex flex-col bg-gradient-to-br from-blue-50 to-white">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-white/80 backdrop-blur sticky top-0 z-10">
          {selectedChannel && (
            <>
              <img src={selectedChannel.avatar_url || "https://placehold.co/40x40"} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
              <div className="flex flex-col">
                <span className="font-bold text-lg">{selectedChannel.name}</span>
                <span className="text-xs text-gray-500">Channel</span>
              </div>
            </>
          )}
          {!selectedChannel && <span className="text-gray-400">Select a channel</span>}
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 flex flex-col" style={{ minHeight: 0 }}>
          {loading ? (
            <div className="text-gray-400">Loading messages...</div>
          ) : (
            messages.length === 0 ? (
              <div className="text-gray-400 text-center my-8">No messages yet.</div>
            ) : (
              messages.map((msg) => {
                const isMe = user && msg.sender_id === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    {!isMe && (
                      <img src={msg.profiles?.avatar_url || "https://placehold.co/40x40"} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                    )}
                    <div className={`max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <div
                        className={`px-4 py-2 rounded-2xl shadow text-base break-words ${isMe ? "bg-blue-500 text-white" : "bg-white text-gray-900 border"}`}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.message) }}
                      />
                      <span className="text-xs text-gray-400 mt-1">
                        {msg.profiles?.username || (isMe ? "You" : "User")} · {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {isMe && (
                      <img src={user?.avatar_url || "https://placehold.co/40x40"} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                    )}
                  </div>
                );
              })
            )
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Input */}
        {selectedChannel && (
          <form className="px-6 py-4 border-t bg-white flex gap-3 items-center" onSubmit={handleSend}>
            <input
              className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring text-base bg-gray-50"
              type="text"
              value={input}
              onChange={(e) => setInput(sanitizeInput(e.target.value))}
              placeholder="Type a message..."
              maxLength={2000}
              autoComplete="off"
              required
              disabled={sending}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold disabled:opacity-50"
              disabled={sending || !input.trim()}
            >
              Send
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
