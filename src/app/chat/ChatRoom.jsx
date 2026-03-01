"use client";

import React, { useState, useEffect, useRef } from "react";

export default function ChatRoom({ user }) {
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [ws, setWs] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [targetEmail, setTargetEmail] = useState("");
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // { userId: username }
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

  // Show modal automatically if no channels exist
  useEffect(() => {
    if (channels.length === 0) {
      setShowNewChannelModal(true);
    }
  }, [channels]);

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

    // Use production WebSocket URL if available, otherwise fallback to localhost
    const usernameEncoded = encodeURIComponent(user.username || user.full_name || "User");
    // Use the deployed backend API base URL for production WebSocket
    let WS_BASE_URL = process.env.NEXT_PUBLIC_CHAT_WS_URL || (typeof window !== 'undefined' && window.NEXT_PUBLIC_CHAT_WS_URL) || "ws://localhost:3001";

    // Get ws_access_token from cookies (non-httpOnly, set by backend for WebSocket auth)
    function getCookie(name) {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    }
    const wsAccessToken = getCookie('ws_access_token');
    const socketUrl = `${WS_BASE_URL}?channel_id=${activeChannel.id}&user_id=${user.id}&username=${usernameEncoded}${wsAccessToken ? `&token=${wsAccessToken}` : ''}`;
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
    if (!targetEmail.trim()) return;

    // Only allow creating a DM channel if the input matches a valid user
    const foundUser = searchResults.find(u => u.email === targetEmail.trim());
    if (!foundUser) {
      alert("Please select a valid user from the list to create a channel.");
      return;
    }
    const payload = { email: foundUser.email };

    try {
      const res = await fetch("/api/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newChannel = await res.json();
        setChannels((prev) => [...prev, newChannel]);
        setActiveChannel(newChannel);
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

  // Fetch projects for assign dropdown
  useEffect(() => {
    if (showAssignProjectModal) {
      fetch("/api/projects").then(res => res.json()).then(setProjects);
    }
  }, [showAssignProjectModal]);

  // Fetch members when modal opens
  useEffect(() => {
    if (showMembersModal && activeChannel) {
      fetch(`/api/chat/channels/${activeChannel.id}/members`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed to fetch members");
        })
        .then(setChannelMembers)
        .catch(console.error);
    }
  }, [showMembersModal, activeChannel]);

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
      // Optionally refetch channel members
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
    <div className="flex h-full w-full bg-white dark:bg-background-dark font-['Inter']">
      {/* Sidebar */}
      <div 
        className={`$
          isSidebarOpen ? "w-80" : "w-0"
        } bg-gray-50 dark:bg-[#18181b] border-r border-gray-200 dark:border-zinc-800 flex flex-col transition-all duration-300 overflow-hidden`}
      >
        <div className="p-5 flex justify-between items-center">
          <h2 className="font-['Arimo'] font-bold text-2xl text-neutral-950 dark:text-white">Chats</h2>
          <button 
            onClick={() => setShowNewChannelModal(true)}
            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 flex items-center justify-center transition-colors text-gray-700 dark:text-white"
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
                          setTargetEmail(u.email);
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
                  disabled={!targetEmail.trim()}
                >
                  Create Chat
                </button>
              </form>
            </div>
          </div>
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
      <div className="flex-1 flex flex-col h-full relative">
        {/* Chat Header with channel actions */}
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
            {/* Channel actions: only show if user is creator */}
            {activeChannel && (
              <div className="flex gap-2 ml-4 items-center">
                <button onClick={() => setShowMembersModal(true)} className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 font-medium">Members</button>
                {activeChannel.created_by === user?.id && (
                  <>
                    <button onClick={() => setShowRenameModal(true)} className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700">Rename</button>
                    <button onClick={() => setShowAddMemberModal(true)} className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700">Add Member</button>
                    <button onClick={() => setShowAssignProjectModal(true)} className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700">Assign Project</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rename Channel Modal */}
        {showRenameModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-xs relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-900" onClick={() => setShowRenameModal(false)}>&times;</button>
              <h4 className="font-bold mb-2">Rename Channel</h4>
              <form onSubmit={handleRenameChannel}>
                <input className="w-full border px-3 py-2 rounded mb-3 text-black" value={renameValue} onChange={e => setRenameValue(e.target.value)} autoFocus />
                <button type="submit" className="w-full bg-gray-950 text-white py-2 rounded">Save</button>
              </form>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-xs relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-900" onClick={() => setShowAddMemberModal(false)}>&times;</button>
              <h4 className="font-bold mb-2">Add Member</h4>
              <form onSubmit={handleAddMember}>
                <input className="w-full border px-3 py-2 rounded mb-3 text-black" value={addMemberValue} onChange={e => setAddMemberValue(e.target.value)} placeholder="User email..." autoFocus />
                <button type="submit" className="w-full bg-gray-950 text-white py-2 rounded">Add</button>
              </form>
            </div>
          </div>
        )}

        {/* Assign Project Modal */}
        {showAssignProjectModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-xs relative">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-900" onClick={() => setShowAssignProjectModal(false)}>&times;</button>
              <h4 className="font-bold mb-2">Assign to Project</h4>
              <form onSubmit={handleAssignProject}>
                <select className="w-full border px-3 py-2 rounded mb-3" value={assignProjectValue} onChange={e => setAssignProjectValue(e.target.value)}>
                  <option value="">Select project...</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button type="submit" className="w-full bg-gray-950 text-white py-2 rounded">Assign</button>
              </form>
            </div>
          </div>
        )}

        {/* Members List Modal */}
        {showMembersModal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm relative max-h-[80vh] flex flex-col">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-900" onClick={() => setShowMembersModal(false)}>&times;</button>
              <h4 className="font-bold mb-4 text-lg">Channel Members</h4>
              <div className="overflow-y-auto flex-1 space-y-3">
                {channelMembers.length === 0 ? (
                  <p className="text-gray-500 text-sm">Loading members...</p>
                ) : (
                  channelMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden">
                        {m.avatar_url ? <img src={m.avatar_url} alt={m.username} className="w-full h-full object-cover" /> : (m.full_name || m.username)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{m.full_name || m.username}</div>
                        <div className="text-xs text-gray-500 capitalize">{m.role}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

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
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-950/10 focus:border-gray-950 transition-all text-sm text-black font-medium placeholder-gray-400"
              style={{ fontSize: '1.05rem', letterSpacing: '0.01em' }}
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