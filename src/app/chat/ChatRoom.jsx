/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { dFetch } from "@/lib/api";
import { 
  ArrowLeft, 
  Plus, 
  MoreVertical, 
  Send, 
  Search, 
  Settings, 
  Users, 
  MessageSquare, 
  Trash2, 
  UserPlus, 
  Edit3, 
  Menu, 
  X,
  Target,
  Hash,
  ChevronLeft,
  Paperclip,
  PlusCircle,
  MoreHorizontal,
  Info,
  CheckCircle2
} from "lucide-react";

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

  // Fetch members on active channel change
  useEffect(() => {
    if (activeChannel) {
      dFetch(`/api/chat/channels/${activeChannel.id}/members`)
        .then(res => res.ok ? res.json() : [])
        .then(setChannelMembers)
        .catch(console.error);
    } else {
      setChannelMembers([]);
    }
  }, [activeChannel, showMembersModal]);

  const amIAdmin = activeChannel?.created_by === user?.id || channelMembers.some(m => m.id === user?.id && (m.role === "admin" || m.role === "lead"));

  // Fetch Channels on Mount
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await dFetch("/api/chat/channels");
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
    const interval = setInterval(fetchChannels, 15000);
    return () => clearInterval(interval);
  }, []);

  // Search users effect
  useEffect(() => {
    if (targetEmail.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      dFetch(`/api/users/search?q=${encodeURIComponent(targetEmail)}`)
        .then((res) => res.json())
        .then((data) => setSearchResults(data || []));
    }, 300);
    return () => clearTimeout(timer);
  }, [targetEmail]);

  // WebSocket for real-time messages
  useEffect(() => {
    if (!activeChannel || !user) return;

    setMessages([]);
    
    // Fetch initial history
    const fetchInitialMessages = async () => {
      try {
        const res = await dFetch(`/api/chat/messages?channel_id=${activeChannel.id}&limit=50`);
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
        const res = await dFetch("/api/auth/me");
        if (res.ok) {
          const authData = await res.json();
          token = authData.ws_token || "";
        }
      } catch (e) {
        console.error("Failed to fetch ws token", e);
      }

      const isVercel = window.location.hostname.includes("vercel.app");
      const backendHost = isVercel ? "backend-for-tdtu-i3.onrender.com" : window.location.host;
      const protocol = isVercel ? "wss:" : (window.location.protocol === "https:" ? "wss:" : "ws:");
      const wsUrl = `${protocol}//${backendHost}/api/chat/ws?channel_id=${activeChannel.id}&access_token=${token}`;

      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const newMsg = JSON.parse(event.data);
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            scrollToBottom();
            return [...prev, newMsg];
          });
        } catch (e) {
          console.error("Error parsing websocket message", e);
        }
      };
    };

    connectWs();
    return () => { if (ws) ws.close(); };
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
        body: JSON.stringify({ channel_id: activeChannel.id, message: inputText.trim() }),
      });
      if (res.ok) setInputText("");
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return;
    try {
      const payload = { emails: selectedUsers.map(u => u.email) };
      const res = await fetch("/api/chat/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newChannel = await res.json();
        setChannels(prev => [newChannel, ...prev]);
        setActiveChannel(newChannel);
        setSelectedUsers([]);
        setTargetEmail("");
        setShowNewChannelModal(false);
      }
    } catch (error) { console.error(error); }
  };

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

  const fetchProjects = useCallback(async () => {
    const res = await dFetch("/api/projects", { credentials: "include" });
    if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
    }
  }, []);

  useEffect(() => {
    if (showAssignProjectModal || showNewChannelModal) {
      fetchProjects();
    }
  }, [showAssignProjectModal, showNewChannelModal, fetchProjects]);

  const getChannelInitials = (name) => {
    return name.substring(0, 1).toUpperCase();
  };

  const formatTime = (isoString) => {
    try {
      return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) { return ""; }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-gray-50/50">
      
      {/* Sidebar - Redesigned as modern panel */}
      <aside 
        className={`${isSidebarOpen ? "w-80" : "w-0"} bg-white border-r border-gray-100 flex flex-col transition-all duration-300 overflow-hidden shrink-0 shadow-sm`}
      >
        <div className="p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="w-10 h-10 rounded-2xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all text-gray-500 hover:text-gray-900 group"
              title="Dashboard"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <h2 className="font-extrabold text-2xl text-gray-900 tracking-tight">Chats</h2>
          </div>
          <button 
            onClick={() => setShowNewChannelModal(true)}
            className="w-10 h-10 rounded-2xl bg-gray-900 hover:bg-black flex items-center justify-center transition-all text-white shadow-lg shadow-gray-200"
            title="New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pb-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full h-11 bg-gray-50 border-0 rounded-2xl pl-12 pr-4 text-sm font-medium text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-gray-900/5 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1 custom-scrollbar">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel)}
              className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center gap-4 group ${
                activeChannel?.id === channel.id
                  ? "bg-gray-900 text-white shadow-lg shadow-gray-200"
                  : "bg-white hover:bg-gray-50 border border-transparent hover:border-gray-100"
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-inner ${
                activeChannel?.id === channel.id ? "bg-white/20" : "bg-blue-600 shadow-blue-200/50"
              }`}>
                {getChannelInitials(channel.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm truncate ${activeChannel?.id === channel.id ? "text-white" : "text-gray-900"}`}>
                  {channel.name}
                </div>
                <div className={`text-[11px] font-medium truncate mt-0.5 ${activeChannel?.id === channel.id ? "text-white/60" : "text-gray-400"}`}>
                  Active Session
                </div>
              </div>
              {activeChannel?.id !== channel.id && (
                 <div className="w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100" />
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0 overflow-hidden">
        
        {/* Header - Premium Navigation Bar */}
        <header className="h-20 border-b border-gray-100 flex items-center px-8 justify-between bg-white/80 backdrop-blur-sm shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isSidebarOpen ? "bg-gray-50 text-gray-500" : "bg-gray-900 text-white shadow-lg"}`}
            >
              {isSidebarOpen ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5 rotate-180" />}
            </button>
            <div className="flex items-center gap-4 min-w-0">
              {activeChannel && (
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black border border-blue-100 flex-shrink-0">
                  <Hash className="w-5 h-5" />
                </div>
              )}
              <div className="truncate">
                <h3 className="font-extrabold text-lg text-gray-900 leading-tight truncate">
                  {activeChannel ? activeChannel.name : "Select a conversation"}
                </h3>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Live Project Thread
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeChannel && (
              <>
                <button 
                  onClick={() => setShowMembersModal(true)}
                  className="w-10 h-10 rounded-2xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all border border-gray-100"
                  title="Team Members"
                >
                  <Users className="w-5 h-5" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-10 h-10 rounded-2xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all border border-gray-100"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-3xl shadow-2xl border border-gray-100 p-2 z-20 animate-fadeIn origin-top-right">
                       <button onClick={() => { setShowRenameModal(true); setShowDropdown(false); }} className="w-full px-4 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-2xl flex items-center gap-3 transition-colors">
                        <Edit3 className="w-4 h-4 text-gray-400" /> Rename Chat
                      </button>
                      <button onClick={() => { setShowAddMemberModal(true); setShowDropdown(false); }} className="w-full px-4 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-2xl flex items-center gap-3 transition-colors">
                        <UserPlus className="w-4 h-4 text-gray-400" /> Invite Teammate
                      </button>
                      <button onClick={() => { setShowAssignProjectModal(true); setShowDropdown(false); }} className="w-full px-4 py-3 text-left text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-2xl flex items-center gap-3 transition-colors border-b border-gray-50 mb-1">
                        <Target className="w-4 h-4 text-gray-400" /> Link to Project
                      </button>
                      <button className="w-full px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl flex items-center gap-3 transition-colors">
                        <Trash2 className="w-4 h-4" /> Archive Thread
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Message Stream */}
        <div 
          className="flex-1 overflow-y-auto px-8 py-8 space-y-8 bg-white/50 custom-scrollbar"
          ref={chatContainerRef}
        >
          {messages.length === 0 && activeChannel && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                 <h4 className="font-extrabold text-xl text-gray-900">Beginning of the story</h4>
                 <p className="text-sm text-gray-400 max-w-xs mx-auto mt-2">Send your first message to start the collaboration in this channel.</p>
              </div>
            </div>
          )}

          {messages.map((msg, index) => {
            const isSelf = msg.sender_id === user?.id;
            const nextMsg = messages[index + 1];
            const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;
            
            return (
              <div key={msg.id || index} className={`flex gap-4 ${isSelf ? "flex-row-reverse" : "flex-row"} group`}>
                <div className={`w-10 h-10 shrink-0 flex items-end justify-center ${isLastInGroup ? "opacity-100" : "opacity-0"}`}>
                   <div className="w-10 h-10 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-black text-gray-600 overflow-hidden">
                      {msg.profiles?.avatar_url ? (
                        <img src={msg.profiles.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (msg.profiles?.username?.[0] || "U").toUpperCase()}
                   </div>
                </div>

                <div className={`flex flex-col max-w-[70%] ${isSelf ? "items-end text-right" : "items-start text-left"}`}>
                  {!isSelf && isLastInGroup && (
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2 ml-2">
                       {msg.profiles?.username || "Teammate"} • {formatTime(msg.sent_at)}
                    </span>
                  )}
                  <div 
                    className={`px-5 py-3.5 rounded-[28px] text-sm font-semibold leading-relaxed shadow-sm transition-transform active:scale-[0.99] ${
                      isSelf 
                        ? "bg-gray-900 text-white rounded-tr-none" 
                        : "bg-white text-gray-900 border border-gray-100 rounded-tl-none"
                    }`}
                  >
                    {msg.message}
                  </div>
                  {isSelf && isLastInGroup && (
                    <div className="flex items-center gap-1.5 mt-2 mr-2">
                       <span className="text-[10px] font-bold text-gray-400 uppercase">{formatTime(msg.sent_at)}</span>
                       <CheckCircle2 className="w-3 h-3 text-blue-500" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar - Floating Style */}
        <div className="px-8 py-8 shrink-0 relative bg-white/80 backdrop-blur-md border-t border-gray-100">
           <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-4">
              <div className="flex-1 bg-gray-50 border border-gray-100 rounded-[32px] p-2 hover:bg-gray-100/50 hover:border-gray-200 transition-all flex items-end gap-2 shadow-sm focus-within:bg-white focus-within:ring-4 focus-within:ring-gray-900/5 focus-within:border-gray-900/10">
                 <button type="button" className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors bg-white rounded-[24px] border border-gray-100 ml-1 mb-1">
                    <PlusCircle className="w-5 h-5" />
                 </button>
                 <textarea
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder={activeChannel ? `Communicate in #${activeChannel.name}...` : "Select a thread..."}
                    disabled={!activeChannel}
                    className="flex-1 bg-transparent border-0 outline-none text-sm font-bold text-gray-900 py-4 px-2 min-h-[56px] max-h-48 resize-none placeholder:text-gray-300"
                 />
                 <button
                    type="submit"
                    disabled={!inputText.trim() || !activeChannel}
                    className="w-12 h-12 bg-gray-900 text-white rounded-[24px] flex items-center justify-center hover:bg-black disabled:opacity-30 disabled:hover:bg-gray-900 transition-all transform active:scale-95 shadow-lg shadow-gray-200 mr-1 mb-1"
                 >
                    <Send className="w-5 h-5" />
                 </button>
              </div>
           </form>
           <p className="text-center text-[9px] font-extrabold text-gray-400 uppercase tracking-[0.2em] mt-6">
              Encrypted Real-time Professional Communication
           </p>
        </div>

        {/* Modals: Standardized rounded-3xl White Cards */}
        {showNewChannelModal && (
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] shadow-2xl p-10 w-full max-w-xl border border-white relative">
              <button 
                className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 transition-all"
                onClick={() => setShowNewChannelModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-8">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                   <Plus className="w-3 h-3" /> New Discussion
                </span>
                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Start Conversation</h3>
                <p className="text-sm text-gray-400 mt-2 font-medium">Select teammates to create a new collaboration thread.</p>
              </div>

              <form onSubmit={handleCreateChannel} className="space-y-6">
                <div>
                   <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-3 ml-1">Team Selection</label>
                   <div className="flex flex-wrap gap-2 mb-4 min-h-[44px]">
                    {selectedUsers.length === 0 && <p className="text-xs text-gray-300 italic py-2 ml-1">No one selected yet...</p>}
                    {selectedUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 pl-4 pr-1 py-1 rounded-2xl animate-fadeIn">
                        <span className="text-sm font-bold text-gray-900">{u.full_name || u.username}</span>
                        <button type="button" onClick={() => setSelectedUsers(prev => prev.filter(x => x.id !== u.id))} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white text-gray-400 hover:text-red-500 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input
                      type="text"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      placeholder="Search by name or email address..."
                      className="w-full h-14 bg-gray-50 border-0 rounded-2xl pl-12 pr-4 text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 transition-all"
                      autoFocus
                    />
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-2 rounded-2xl overflow-hidden border border-gray-50 shadow-xl divide-y divide-gray-50">
                      {searchResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          className="w-full p-4 hover:bg-gray-50 text-left flex items-center justify-between transition-colors bg-white group"
                          onClick={() => {
                            if (!selectedUsers.find(x => x.id === u.id)) setSelectedUsers(prev => [...prev, u]);
                            setTargetEmail(""); setSearchResults([]);
                          }}
                        >
                          <div>
                            <p className="font-bold text-sm text-gray-900">{u.full_name || u.username}</p>
                            <p className="text-[11px] font-medium text-gray-400">{u.email}</p>
                          </div>
                          <PlusCircle className="w-5 h-5 text-gray-200 group-hover:text-blue-500 transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={selectedUsers.length === 0}
                  className="w-full h-14 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-20 flex items-center justify-center gap-2"
                >
                  Confirm and Create Chat
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Members List Modal - Redesigned */}
        {showMembersModal && (
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xl flex items-center justify-center p-4">
             <div className="bg-white rounded-[40px] shadow-2xl p-10 w-full max-w-xl border border-white relative max-h-[85vh] flex flex-col">
              <button className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 transition-all" onClick={() => setShowMembersModal(false)}>
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-8 shrink-0">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">
                   <Users className="w-3 h-3" /> Team Directory
                </span>
                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">Active Members</h3>
                <p className="text-sm text-gray-400 mt-2 font-medium">Managing collaborators for this discussion.</p>
              </div>

              <div className="overflow-y-auto flex-1 space-y-4 pr-4 custom-scrollbar">
                {channelMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-4 rounded-3xl bg-gray-50/50 border border-gray-100/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-sm font-black text-gray-900 overflow-hidden border border-gray-100">
                        {m.avatar_url ? <img src={m.avatar_url} alt="Av" className="w-full h-full object-cover" /> : (m.username?.[0] || "U").toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                           {m.full_name || m.username}
                           {m.role === 'admin' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                        </div>
                        <div className={`text-[10px] font-bold uppercase tracking-widest ${m.role === 'admin' ? "text-blue-500" : "text-gray-400"}`}>{m.role || 'Member'}</div>
                      </div>
                    </div>
                    {amIAdmin && m.id !== user?.id && (
                      <button className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}