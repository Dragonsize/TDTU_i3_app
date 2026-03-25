"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function ChatRoom({ user }) {
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [targetEmail, setTargetEmail] = useState("");
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberValue, setAddMemberValue] = useState("");
  const [showAssignProjectModal, setShowAssignProjectModal] = useState(false);
  const [assignProjectValue, setAssignProjectValue] = useState("");
  const [projects, setProjects] = useState([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [channelMembers, setChannelMembers] = useState([]);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Fetch members on active channel change to evaluate role privileges
  useEffect(() => {
    if (activeChannel) {
      fetch(`/api/chat/channels/${activeChannel.id}/members`)
        .then(res => res.ok ? res.json() : [])
        .then(setChannelMembers)
        .catch(console.error);
    } else {
      setChannelMembers([]);
    }
  }, [activeChannel, showMembersModal]);

  const amIAdmin = activeChannel?.created_by === user?.id || channelMembers.some(m => m.id === user?.id && (m.role === "admin" || m.role === "lead"));
  const lastMessageSignatureRef = useRef("");

  // 1. Fetch Channels on Mount (and poll gently so users notice new chats)
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch("/api/chat/channels");
        if (res.ok) {
          const data = await res.json();
          setChannels(data);
          setActiveChannel(prev => prev || (data.length > 0 ? data[0] : null));
        }
      } catch (error) {
        console.error("Failed to fetch channels", error);
      }
    };
    fetchChannels();
    const interval = setInterval(fetchChannels, 10000);
    return () => clearInterval(interval);
  }, []);

  // Search users effect
  useEffect(() => {
    if (targetEmail.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/users/search?q=${encodeURIComponent(targetEmail)}`)
        .then((res) => res.json())
        .then((data) => setSearchResults(data || []));
    }, 300);
    return () => clearTimeout(timer);
  }, [targetEmail]);


  // 2. Setup WebSocket for real-time messages for the active channel
  useEffect(() => {
    if (!activeChannel || !user) return;

    setMessages([]);
    lastMessageSignatureRef.current = "";

    // Fetch initial history
    const fetchInitialMessages = async () => {
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
    
    fetchInitialMessages();

    let ws = null;

    const connectWs = async () => {
      let token = "";
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const authData = await res.json();
          token = authData.ws_token || "";
        }
      } catch (e) {
        console.error("Failed to fetch ws token", e);
      }

      // If running on Vercel, bypass the Next.js API proxy and connect directly to Render
      const isVercel = window.location.hostname.includes("vercel.app");
      const backendHost = isVercel ? "backend-for-tdtu-i3.onrender.com" : window.location.host;
      const protocol = isVercel ? "wss:" : (window.location.protocol === "https:" ? "wss:" : "ws:");
      const wsUrl = `${protocol}//${backendHost}/api/chat/ws?channel_id=${activeChannel.id}&access_token=${token}`;

      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const newMsg = JSON.parse(event.data);
          setMessages((prev) => {
            // Avoid duplicates if we already have it
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }
            scrollToBottom();
            return [...prev, newMsg];
          });
        } catch (e) {
          console.error("Error parsing websocket message", e);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    };

    connectWs();

    return () => {
      if (ws) ws.close();
    };
  }, [activeChannel, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChannel) return;

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel_id: activeChannel.id,
          message: inputText.trim(),
        }),
      });

      if (res.ok) {
        setInputText("");
      }
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return;

    const payload = { emails: selectedUsers.map(u => u.email) };

    try {
      const res = await fetch("/api/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newChannel = await res.json();
        setChannels((prev) => {
          // Prevent duplicates if interval just fetched
          if (prev.find(c => c.id === newChannel.id)) return prev;
          return [...prev, newChannel];
        });
        setActiveChannel(newChannel);
        setSelectedUsers([]);
        setTargetEmail("");
        setShowNewChannelModal(false);
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Failed to create channel", error);
    }
  };

  const handleDeleteChannel = async (e, channelId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat?")) return;

    try {
      const res = await fetch(`/api/chat/channels/${channelId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setChannels((prev) => prev.filter((c) => c.id !== channelId));
        if (activeChannel?.id === channelId) {
          setActiveChannel(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Failed to delete channel", error);
    }
  };

  const handleLeaveChannel = async (e, channelId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to leave this chat?")) return;

    try {
      const res = await fetch(`/api/chat/channels/${channelId}/leave`, {
        method: "DELETE",
      });

      if (res.ok) {
        setChannels((prev) => prev.filter((c) => c.id !== channelId));
        if (activeChannel?.id === channelId) {
          setActiveChannel(null);
          setMessages([]);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to leave channel");
      }
    } catch (error) {
      console.error("Failed to leave channel", error);
    }
  };

  const handleToggleAdmin = async (e, memberId, currentRole) => {
    e.stopPropagation();
    const newRole = currentRole === "admin" ? "member" : "admin";
    const actionText = currentRole === "admin" ? "remove admin privileges from" : "promote";
    if (!confirm(`Are you sure you want to ${actionText} this user?`)) return;

    try {
      const res = await fetch(`/api/chat/channels/${activeChannel.id}/members/${memberId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setChannelMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to update role");
      }
    } catch (error) {
      console.error("Failed to change role", error);
    }
  };

  const handleRemoveMember = async (e, memberId) => {
    e.stopPropagation();
    if (!activeChannel) return;
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const res = await fetch(`/api/chat/channels/${activeChannel.id}/members/${memberId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setChannelMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to remove member");
      }
    } catch (error) {
      console.error("Failed to remove member", error);
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

  // Generate a random-ish color for channel avatars based on name
  const getChannelColor = (name) => {
    const colors = ["bg-blue-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"];
    return colors[name.length % colors.length];
  };

  // Fetch projects for assign dropdown and quick-create
  useEffect(() => {
    if (showAssignProjectModal || showNewChannelModal) {
      fetch("/api/projects", { credentials: "include" })
        .then(res => res.json())
        .then(data => setProjects(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [showAssignProjectModal, showNewChannelModal]);

  // --- Handlers for channel actions ---
  const handleRenameChannel = async (e) => {
    e.preventDefault();
    if (!renameValue.trim() || !activeChannel) return;
    const res = await fetch(`/api/chat/channels/${activeChannel.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue.trim() })
    });
    if (res.ok) {
      const updated = await res.json();
      setChannels(channels.map(c => c.id === updated.id ? updated : c));
      setActiveChannel(updated);
      setShowRenameModal(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addMemberValue.trim() || !activeChannel) return;
    const res = await fetch(`/api/chat/channels/${activeChannel.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: addMemberValue.trim() })
    });
    if (res.ok) {
      setShowAddMemberModal(false);
      setAddMemberValue("");
      fetch(`/api/chat/channels/${activeChannel.id}/members`)
        .then((r) => (r.ok ? r.json() : []))
        .then(setChannelMembers)
        .catch(console.error);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.detail || "Failed to add member");
    }
  };

  const handleAssignProject = async (e) => {
    e.preventDefault();
    if (!assignProjectValue || !activeChannel) return;
    const res = await fetch(`/api/chat/channels/${activeChannel.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: assignProjectValue })
    });
    if (res.ok) {
      const updated = await res.json();
      setChannels(channels.map(c => c.id === updated.id ? updated : c));
      setActiveChannel(updated);
      setShowAssignProjectModal(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-white dark:bg-background-dark font-['Inter']">
      {/* Sidebar */}
      <div 
        className={`${isSidebarOpen ? "w-60 sm:w-72 md:w-80" : "w-0"} bg-gray-50 dark:bg-[#18181b] border-r border-gray-200 dark:border-zinc-800 flex flex-col transition-all duration-300 overflow-hidden shrink-0`}
      >
        <div className="p-3 sm:p-4 md:p-5 flex justify-between items-center border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link 
              href="/dashboard"
              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 flex items-center justify-center transition-colors text-gray-700 dark:text-white flex-shrink-0"
              title="Back to Dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
            <h2 className="font-['Arimo'] font-bold text-xl sm:text-2xl text-neutral-950 dark:text-white">Chats</h2>
          </div>
          <button 
            onClick={() => setShowNewChannelModal(true)}
            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 flex items-center justify-center transition-colors text-gray-700 dark:text-white flex-shrink-0"
            title="New Chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>

        {/* Messenger-style modal for new channel creation */}
        {showNewChannelModal && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 w-full max-w-md relative animate-fadeIn">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                onClick={() => setShowNewChannelModal(false)}
                title="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Start a new chat</h3>
              <form onSubmit={handleCreateChannel}>
                <div className="mb-4 space-y-3 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-100 dark:border-zinc-700">
                  <div className="text-xs font-bold text-gray-500 uppercase">Quick Sync</div>
                  <select 
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-950 dark:focus:ring-white transition"
                    onChange={async (e) => {
                      if (!e.target.value) return;
                      const projId = e.target.value;
                      const proj = projects.find(p => p.id === projId);
                      if (proj) {
                        setNewChannelName(proj.title || proj.name || "Project Chat");
                        try {
                          const res = await fetch(`/api/projects/${projId}/members`, { credentials: "include" });
                          if (res.ok) {
                            const members = await res.json();
                            const toAdd = (Array.isArray(members) ? members : []).filter(m => !selectedUsers.find(u => u.id === m.id) && m.id !== user?.id);
                            if (toAdd.length > 0) {
                              setSelectedUsers(prev => [...prev, ...toAdd]);
                            }
                          }
                        } catch (err) { console.error(err); }
                      }
                      e.target.value = "";
                    }}
                  >
                    <option value="">Load members from Project...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.title || p.name}</option>)}
                  </select>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-1 bg-gray-200 dark:bg-zinc-700 px-3 py-1.5 rounded-full text-sm">
                      <span className="text-gray-900 dark:text-white font-medium">{u.full_name || u.username}</span>
                      <button type="button" onClick={() => setSelectedUsers(prev => prev.filter(x => x.id !== u.id))} className="text-gray-500 hover:text-gray-900 dark:hover:text-white ml-1">
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="Search user by name or email..."
                  className="w-full px-4 py-3 text-base border border-gray-300 dark:border-zinc-700 rounded-full focus:outline-none focus:border-gray-950 dark:focus:border-white bg-gray-100 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-900 text-gray-900 dark:text-white transition-all mb-2"
                  autoFocus
                />
                {searchResults.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto z-20">
                    {searchResults.map((u) => (
                      <div
                        key={u.id}
                        className="p-3 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer flex flex-col border-b border-gray-50 dark:border-zinc-800 last:border-0"
                        onClick={() => {
                          if (!selectedUsers.find(x => x.id === u.id)) {
                            setSelectedUsers(prev => [...prev, u]);
                          }
                          setTargetEmail("");
                          setSearchResults([]);
                        }}
                      >
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{u.full_name || u.username}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{u.email}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="submit"
                  className="mt-4 w-full bg-gray-950 dark:bg-white text-white dark:text-gray-950 font-semibold py-2 rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                  disabled={selectedUsers.length === 0}
                >
                  Create Chat
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2 sm:px-3 pb-3 space-y-1">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel)}
              className={`w-full text-left p-2 sm:p-3 rounded-xl transition-all flex items-center gap-2 sm:gap-3 group ${
                activeChannel?.id === channel.id
                  ? "bg-white shadow-sm ring-1 ring-black/5"
                  : "hover:bg-gray-200/50"
              }`}
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${getChannelColor(channel.name)} flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0`}>
                {channel.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs sm:text-sm text-gray-900 truncate">{channel.name}</div>
                <div className="text-[10px] sm:text-xs text-gray-500 truncate">Click to open chat</div>
              </div>
              
              {/* Delete Button (Visible on Hover) */}
              {channel.created_by === user?.id && (
                <div 
                  onClick={(e) => handleDeleteChannel(e, channel.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-full transition-all"
                  title="Delete Chat"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </div>
              )}
            </button>
          ))}
          {channels.length === 0 && (
            <div className="text-center text-gray-400 dark:text-gray-500 text-sm py-4">
              No channels yet. <button className="underline text-gray-700 dark:text-white hover:text-gray-950 dark:hover:text-gray-300" onClick={() => setShowNewChannelModal(true)}>Start a new chat</button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        {/* Chat Header with channel actions */}
        <div className="h-14 sm:h-16 border-b border-gray-200 flex items-center px-3 sm:px-4 md:px-6 justify-between bg-white shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-500 hover:text-gray-950 flex-shrink-0 md:hidden"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h3 className="font-['Arimo'] font-bold text-base sm:text-lg text-neutral-950 flex items-center gap-2 sm:gap-3 min-w-0">
              {activeChannel && (
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${getChannelColor(activeChannel.name)} flex items-center justify-center text-white text-xs flex-shrink-0`}>#</div>
              )}
              <span className="truncate">{activeChannel ? activeChannel.name : "Select a chat"}</span>
            </h3>
            {/* Channel actions Messenger-style modern 3-dots */}
            {activeChannel && (
              <div className="relative ml-2 sm:ml-4">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="5" r="1"></circle>
                    <circle cx="12" cy="19" r="1"></circle>
                  </svg>
                </button>
                
                {showDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-700 py-1.5 z-20 flex flex-col text-sm animate-fadeIn origin-top-right">
                      <button onClick={() => { setShowMembersModal(true); setShowDropdown(false); }} className="px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2">
                        View Members
                      </button>
                      
                      {amIAdmin && (
                        <>
                          <button onClick={() => { setShowRenameModal(true); setShowDropdown(false); }} className="px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2">
                            Rename Chat
                          </button>
                          <button onClick={() => { setShowAddMemberModal(true); setShowDropdown(false); }} className="px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2">
                            Add Member
                          </button>
                          <button onClick={() => { setShowAssignProjectModal(true); setShowDropdown(false); }} className="px-4 py-2.5 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 flex items-center gap-2 border-b border-gray-100 dark:border-zinc-700">
                            Assign Project
                          </button>
                          <button onClick={(e) => { setShowDropdown(false); handleDeleteChannel(e, activeChannel.id); }} className="px-4 py-2.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 font-medium mt-1">
                            Delete Chat
                          </button>
                        </>
                      )}
                      
                      {!amIAdmin && !activeChannel?.project_id && (
                        <button onClick={(e) => { setShowDropdown(false); handleLeaveChannel(e, activeChannel.id); }} className="px-4 py-2.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 font-medium border-t border-gray-100 dark:border-zinc-700 mt-1">
                          Leave Chat
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rename Channel Modal */}
        {showRenameModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 w-full max-w-xs relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-900 dark:hover:text-white" onClick={() => setShowRenameModal(false)}>&times;</button>
              <h4 className="font-bold mb-3 text-gray-900 dark:text-white">Rename Channel</h4>
              <form onSubmit={handleRenameChannel}>
                <input className="w-full border dark:border-zinc-700 px-3 py-2 rounded mb-4 text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-zinc-600" value={renameValue} onChange={e => setRenameValue(e.target.value)} autoFocus />
                <button type="submit" className="w-full bg-gray-950 dark:bg-white text-white dark:text-gray-900 font-bold py-2 rounded transition-colors">Save</button>
              </form>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 w-full max-w-xs relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-900 dark:hover:text-white" onClick={() => setShowAddMemberModal(false)}>&times;</button>
              <h4 className="font-bold mb-3 text-gray-900 dark:text-white">Add Member</h4>
              <form onSubmit={handleAddMember}>
                <input className="w-full border dark:border-zinc-700 px-3 py-2 rounded mb-4 text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-zinc-600" value={addMemberValue} onChange={e => setAddMemberValue(e.target.value)} placeholder="User email..." autoFocus />
                <button type="submit" className="w-full bg-gray-950 dark:bg-white text-white dark:text-gray-900 font-bold py-2 rounded transition-colors">Add</button>
              </form>
            </div>
          </div>
        )}

        {/* Assign Project Modal */}
        {showAssignProjectModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 w-full max-w-xs relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-900 dark:hover:text-white" onClick={() => setShowAssignProjectModal(false)}>&times;</button>
              <h4 className="font-bold mb-3 text-gray-900 dark:text-white">Assign to Project</h4>
              <form onSubmit={handleAssignProject}>
                <select className="w-full border dark:border-zinc-700 px-3 py-2 rounded mb-4 text-black dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-zinc-600" value={assignProjectValue} onChange={e => setAssignProjectValue(e.target.value)}>
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button type="submit" className="w-full bg-gray-950 dark:bg-white text-white dark:text-gray-900 font-bold py-2 rounded transition-colors">Assign</button>
              </form>
            </div>
          </div>
        )}

        {/* Members List Modal */}
        {showMembersModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 w-full max-w-sm relative max-h-[80vh] flex flex-col">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-900 dark:hover:text-white" onClick={() => setShowMembersModal(false)}>&times;</button>
              <h4 className="font-bold mb-4 text-lg text-gray-900 dark:text-white">Channel Members</h4>
              <div className="overflow-y-auto flex-1 space-y-3 pr-2">
                {channelMembers.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Loading members...</p>
                ) : (
                  channelMembers.map(m => (
                    <div key={m.id} className="flex items-center justify-between gap-3 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 overflow-hidden shrink-0">
                          {m.avatar_url ? <img src={m.avatar_url} alt={m.username} className="w-full h-full object-cover" /> : (m.full_name || m.username)[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate flex items-center gap-2">
                            <span className="truncate">{m.full_name || m.username}</span>
                            {(activeChannel?.created_by === m.id || m.role === 'admin' || m.role === "lead") && (
                              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">Admin</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-zinc-400 capitalize truncate">{m.role}</div>
                        </div>
                      </div>

                      {amIAdmin && activeChannel?.created_by !== m.id && m.id !== user?.id && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {!activeChannel?.project_id && m.role !== "lead" && (
                            <button
                              onClick={(e) => handleToggleAdmin(e, m.id, m.role)}
                              className="text-xs px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                              {m.role === "admin" ? "Remove Admin" : "Make Admin"}
                            </button>
                          )}
                          <button
                            onClick={(e) => handleRemoveMember(e, m.id)}
                            className="text-xs px-2 py-1 rounded border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages List */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 bg-white"
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
                <div className={`flex flex-col max-w-xs sm:max-w-sm md:max-w-md ${isSelf ? "items-end" : "items-start"}`}>
                  {showAvatar && !isSelf && (
                    <span className="text-xs text-gray-500 mb-1 ml-1">
                      {msg.profiles?.username || "Unknown"}
                    </span>
                  )}
                  <div 
                    className={`px-3 sm:px-4 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed ${
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
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-2 sm:px-3 md:px-6 py-2 sm:py-3 md:py-4 border-t border-gray-200 bg-white shrink-0">
          <form onSubmit={handleSendMessage} className="relative max-w-4xl mx-auto">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={activeChannel ? `Message #${activeChannel.name}` : "Select a channel to chat"}
              disabled={!activeChannel}
              className="w-full pl-3 sm:pl-4 pr-10 sm:pr-12 py-2 sm:py-3 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-950/20 focus:border-gray-950 focus:bg-white transition-all text-xs sm:text-sm text-black placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || !activeChannel}
              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 text-gray-400 hover:text-gray-950 disabled:opacity-50 disabled:hover:text-gray-400 transition-colors flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-5 sm:h-5">
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