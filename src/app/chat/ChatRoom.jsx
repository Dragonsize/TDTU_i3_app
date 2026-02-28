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

  useEffect(() => {
    fetch("/api/chat/channels", { credentials: "include" })
      .then((res) => res.json())
      .then(setChannels);
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

  return (
    <div className="flex h-[80vh] border rounded-xl shadow-lg overflow-hidden bg-white">
      {/* Channel list */}
      <aside className="w-64 bg-neutral-100 border-r flex flex-col">
        <div className="p-4 font-bold text-lg border-b">Channels</div>
        <div className="flex-1 overflow-y-auto">
          {channels.map((ch) => (
            <button
              key={ch.id}
              className={`w-full text-left px-4 py-2 hover:bg-neutral-200 ${selectedChannel?.id === ch.id ? "bg-neutral-300 font-bold" : ""}`}
              onClick={() => setSelectedChannel(ch)}
            >
              {ch.name}
            </button>
          ))}
        </div>
      </aside>
      {/* Chat area */}
      <section className="flex-1 flex flex-col">
        <div className="p-4 border-b font-semibold text-xl bg-white">
          {selectedChannel ? selectedChannel.name : "Select a channel"}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-zinc-50">
          {loading ? (
            <div className="text-gray-400">Loading messages...</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2">
                <img src={msg.profiles?.avatar_url || "https://placehold.co/40x40"} alt="avatar" className="w-8 h-8 rounded-full" />
                <div>
                  <div className="text-xs text-gray-500">{msg.profiles?.username || "User"} <span className="ml-2 text-[10px]">{new Date(msg.sent_at).toLocaleString()}</span></div>
                  <div className="bg-white rounded px-3 py-2 shadow text-gray-900 max-w-xl break-words" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.message) }} />
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Input */}
        <form className="p-4 border-t flex gap-2 bg-white" onSubmit={handleSend}>
          <input
            className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring"
            type="text"
            value={input}
            onChange={(e) => setInput(sanitizeInput(e.target.value))}
            placeholder="Type a message..."
            maxLength={2000}
            autoComplete="off"
            required
          />
          <button
            type="submit"
            className="bg-neutral-800 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={sending || !input.trim()}
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
