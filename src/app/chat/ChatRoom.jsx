"use client";

import React, { useState, useEffect, useRef } from "react";

export default function ChatRoom({ user }) {
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [ws, setWs] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [newChannelName, setNewChannelName] = useState("");
  const [showNewChannelInput, setShowNewChannelInput] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // { userId: username }
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // 1. Fetch Channels on Mount
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch("/api/chat/channels");
        if (res.ok) {
          const data = await res.json();
          setChannels(data);
          if (data.length > 0) {
            setActiveChannel(data[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch channels", error);
      }
    };
    fetchChannels();
  }, []);

  // 2. Handle Active Channel Changes (Fetch History & Connect WS)
  useEffect(() => {
    if (!activeChannel || !user) return;

    // Reset messages
    setMessages([]);
    setTypingUsers({});

    // Fetch Message History
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/messages?channel_id=${activeChannel.id}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
          scrollToBottom();
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    };
    fetchMessages();

    // Connect WebSocket
    // Using localhost:3001 as defined in your websocket_server.js
    const usernameEncoded = encodeURIComponent(user.username || user.full_name || "User");
    const socketUrl = `ws://localhost:3001?channel_id=${activeChannel.id}&user_id=${user.id}&username=${usernameEncoded}`;
    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      console.log("Connected to chat server");
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "new_message") {
          setMessages((prev) => [...prev, payload.data]);
          scrollToBottom();
        } else if (payload.type === "typing") {
          setTypingUsers((prev) => {
            const next = { ...prev };
            if (payload.isTyping) {
              next[payload.user_id] = payload.username || "Someone";
            } else {
              delete next[payload.user_id];
            }
            return next;
          });
        } else if (payload.error) {
          console.error("WS Error:", payload.error);
        }
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };

    socket.onclose = () => {
      console.log("Disconnected from chat server");
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [activeChannel, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    // Send start typing event if not already typing
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      ws.send(JSON.stringify({ type: "typing", isTyping: true }));
    }

    // Debounce stop typing event
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      ws.send(JSON.stringify({ type: "typing", isTyping: false }));
    }, 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

    const messagePayload = {
      message: inputText.trim(),
    };

    ws.send(JSON.stringify(messagePayload));
    setInputText("");
    
    // Clear typing status immediately on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    isTypingRef.current = false;
    ws.send(JSON.stringify({ type: "typing", isTyping: false }));
    
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      const res = await fetch("/api/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newChannelName }),
      });
      
      if (res.ok) {
        const newChannel = await res.json();
        setChannels([...channels, newChannel]);
        setActiveChannel(newChannel);
        setNewChannelName("");
        setShowNewChannelInput(false);
      }
    } catch (error) {
      console.error("Failed to create channel", error);
    }
  };

  // Helper to format time
  const formatTime = (isoString) => {
    try {
      return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
      return "";
    }
  };

  // Get list of people typing (excluding self, though backend handles that too)
  const typingText = Object.values(typingUsers).join(", ");
  const isAnyoneTyping = Object.keys(typingUsers).length > 0;

  // Generate a random-ish color for channel avatars based on name
  const getChannelColor = (name) => {
    const colors = ["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"];
    return colors[name.length % colors.length];
  };

  return (
    <div className="flex h-full w-full bg-white font-['Inter']">
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarOpen ? "w-80" : "w-0"
        } bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}
      >
        <div className="p-5 flex justify-between items-center">
          <h2 className="font-['Arimo'] font-bold text-2xl text-neutral-950">Chats</h2>
          <button 
            onClick={() => setShowNewChannelInput(!showNewChannelInput)}
            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors text-gray-700"
            title="New Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>

        {showNewChannelInput && (
          <form onSubmit={handleCreateChannel} className="p-3 border-b border-gray-200 bg-white">
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="Channel name..."
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-gray-950 bg-gray-100 focus:bg-white transition-all"
              autoFocus
            />
          </form>
        )}

        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel)}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 group ${
                activeChannel?.id === channel.id
                  ? "bg-white shadow-sm ring-1 ring-black/5"
                  : "hover:bg-gray-200/50"
              }`}
            >
              <div className={`w-10 h-10 rounded-full ${getChannelColor(channel.name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                {channel.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">{channel.name}</div>
                <div className="text-xs text-gray-500 truncate">Click to open chat</div>
              </div>
            </button>
          ))}
          {channels.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-4">
              No channels yet
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Chat Header */}
        <div className="h-16 border-b border-gray-200 flex items-center px-6 justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-500 hover:text-gray-950 lg:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h3 className="font-['Arimo'] font-bold text-lg text-neutral-950 flex items-center gap-3">
              {activeChannel && (
                <div className={`w-8 h-8 rounded-full ${getChannelColor(activeChannel.name)} flex items-center justify-center text-white text-xs`}>#</div>
              )}
              {activeChannel ? activeChannel.name : "Select a chat"}
            </h3>
          </div>
        </div>

        {/* Messages List */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-white"
          ref={chatContainerRef}
        >
          {messages.map((msg, index) => {
            const isSelf = msg.sender_id === user.id;
            const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id;
            
            return (
              <div 
                key={msg.id || index} 
                className={`flex gap-3 ${isSelf ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 shrink-0">
                  {showAvatar && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden border border-gray-100">
                      {msg.profiles?.avatar_url ? (
                        <img src={msg.profiles.avatar_url} alt="User" className="w-full h-full object-cover" />
                      ) : (
                        (msg.profiles?.username || "U")[0].toUpperCase()
                      )}
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col max-w-[70%] ${isSelf ? "items-end" : "items-start"}`}>
                  {showAvatar && !isSelf && (
                    <span className="text-xs text-gray-500 mb-1 ml-1">
                      {msg.profiles?.username || "Unknown"}
                    </span>
                  )}
                  <div 
                    className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                      isSelf 
                        ? "bg-gray-950 text-white rounded-tr-none" 
                        : "bg-gray-100 text-gray-900 rounded-tl-none"
                    }`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {formatTime(msg.sent_at)}
                  </span>
                </div>
              </div>
            );
          })}
          
          {/* Typing Indicator */}
          {isAnyoneTyping && (
            <div className="text-xs text-gray-400 italic ml-12 animate-pulse">
              {typingText} {Object.keys(typingUsers).length === 1 ? "is" : "are"} typing...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white shrink-0">
          <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={activeChannel ? `Message #${activeChannel.name}` : "Select a channel to chat"}
              disabled={!activeChannel}
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-950/10 focus:border-gray-950 transition-all text-sm"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || !activeChannel}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-950 disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}