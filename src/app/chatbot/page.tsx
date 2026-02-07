'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

export default function Chatbot() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDark, setIsDark] = useState(true);
  
  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      title: 'Chat 1',
      messages: [
        {
          role: 'assistant',
          content: 'Hello! I\'m your personal AI assistance'
        }
      ]
    },
    {
      id: '2',
      title: 'Chat 2',
      messages: []
    }
  ]);
  const [activeChat, setActiveChat] = useState('1');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentMessages = chats.find(c => c.id === activeChat)?.messages || [];

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      setIsDark(savedTheme === 'true');
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setChats(prev => prev.map(chat => 
      chat.id === activeChat 
        ? { ...chat, messages: [...chat.messages, userMessage] }
        : chat
    ));
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input })
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer || 'Sorry, I didn\'t understand your question.'
      };
      
      setChats(prev => prev.map(chat => 
        chat.id === activeChat 
          ? { ...chat, messages: [...chat.messages, assistantMessage] }
          : chat
      ));
    } catch (error) {
      console.error('Error:', error);
      setChats(prev => prev.map(chat => 
        chat.id === activeChat 
          ? { ...chat, messages: [...chat.messages, {
              role: 'assistant',
              content: 'Sorry, an error occurred. Please try again.'
            }] }
          : chat
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`font-display bg-white dark:bg-[#2b2b2b] text-slate-900 dark:text-white transition-all duration-300 min-h-screen flex ${isExpanded ? 'md:pr-64' : 'md:pr-20'} pr-0`}
    >
      {/* Left Sidebar - Chat List */}
      <div className="w-64 bg-[#3a3a3a] dark:bg-[#1f1f1f] border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-2 h-2 bg-white rounded-full"></span>
            <h2 className="text-white font-semibold">StudyFlow</h2>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">AI Chatbot</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
                activeChat === chat.id
                  ? 'bg-[#4a4a4a] text-white'
                  : 'text-slate-300 hover:bg-[#353535]'
              }`}
            >
              {chat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2b2b2b] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img src="/avt.jpg" alt="Linh" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Linh</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/login')}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary"
            >
              Sign In
            </button>
            <button className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              Get started
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#f5f5f5] dark:bg-[#2b2b2b]">
          <div className="max-w-4xl mx-auto space-y-4">
            {currentMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-start gap-3">
                    <img src="/avt.jpg" alt="AI" className="w-8 h-8 rounded-full object-cover mt-1" />
                    <div className="bg-white dark:bg-[#3a3a3a] rounded-2xl rounded-tl-none px-5 py-3 max-w-[70%] shadow-sm">
                      <p className="text-slate-900 dark:text-white">{message.content}</p>
                    </div>
                  </div>
                )}
                {message.role === 'user' && (
                  <div className="bg-primary text-white rounded-2xl rounded-tr-none px-5 py-3 max-w-[70%] shadow-sm">
                    <p>{message.content}</p>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3">
                  <img src="/avt.jpg" alt="AI" className="w-8 h-8 rounded-full object-cover mt-1" />
                  <div className="bg-white dark:bg-[#3a3a3a] rounded-2xl px-5 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2b2b2b] p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 bg-[#f5f5f5] dark:bg-[#3a3a3a] rounded-full px-6 py-3 border border-slate-200 dark:border-slate-600">
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <span className="material-symbols-outlined text-xl">attach_file</span>
              </button>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <span className="material-symbols-outlined text-xl">mood</span>
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type..."
                className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-primary hover:bg-primary/90 text-white rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-xl">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Navigation */}
      <nav
        className={`fixed right-0 top-0 h-screen py-8 z-50 flex flex-col items-center justify-between border-l border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#1a1025]/80 backdrop-blur-md shadow-2xl dark:shadow-none transition-all duration-300 ${isExpanded ? 'w-64' : 'w-0 md:w-20'} overflow-visible`}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`absolute top-1/2 -translate-y-1/2 -left-5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:scale-110 transition-transform z-50 ${isExpanded ? '' : 'md:flex'}`}
        >
          <span className="material-symbols-outlined text-sm">{isExpanded ? 'chevron_right' : 'chevron_left'}</span>
        </button>

        <div
          className={`flex flex-col items-center justify-between w-full h-full overflow-hidden ${isExpanded ? 'opacity-100 w-64' : 'opacity-0 md:opacity-100 md:w-20'} transition-opacity duration-200`}
        >
          <div className="flex flex-col items-center gap-2 w-full px-4">
            <div className="flex items-center gap-3 w-full justify-center">
              <div className="items-center justify-center">
                <img src="/avt.jpg" alt="ITZone" className="w-9 h-9 rounded-full object-cover" />
              </div>
              {isExpanded && (
                <h2 className="text-slate-900 dark:text-white text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden animate-fade-in">
                  ITZone
                </h2>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full px-4">
            <NavItem icon="dashboard" label="Dashboard" isExpanded={isExpanded} href="/dashboard" />
            <NavItem icon="smart_toy" label="AI Chatbot" isExpanded={isExpanded} href="/chatbot" active />
            <NavItem icon="calendar_month" label="Calendar" isExpanded={isExpanded} href="/calendar" />
            <NavItem icon="account_circle" label="Settings" isExpanded={isExpanded} href="/settings" />
          </div>

          <div className="flex flex-col items-center gap-6 w-full px-4" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ icon, label, isExpanded, href, active }: { icon: string; label: string; isExpanded: boolean; href: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center rounded-xl transition-colors ${
        active 
          ? 'bg-primary/10 dark:bg-primary/20' 
          : 'hover:bg-slate-100 dark:hover:bg-white/10'
      } ${isExpanded ? 'w-full px-4 py-3 gap-3 justify-start' : 'justify-center w-10 h-10 mx-auto'}`}
    >
      <span className={`material-symbols-outlined transition-colors shrink-0 ${
        active 
          ? 'text-primary' 
          : 'text-slate-500 dark:text-slate-400 group-hover:text-primary dark:group-hover:text-white'
      }`}>
        {icon}
      </span>
      {isExpanded ? (
        <span className={`font-medium whitespace-nowrap overflow-hidden animate-fade-in ${
          active 
            ? 'text-primary dark:text-primary' 
            : 'text-slate-600 dark:text-slate-300'
        }`}>{label}</span>
      ) : (
        <span className="absolute right-full mr-4 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {label}
        </span>
      )}
    </Link>
  );
}
