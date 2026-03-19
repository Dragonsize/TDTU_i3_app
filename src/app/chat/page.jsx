
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import AppShell from "@/components/AppShell";

const ChatRoom = dynamic(() => import("./ChatRoom"), { ssr: false });

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <AppShell user={user} activePath="/chat" contentClassName="flex-1 min-h-0 overflow-hidden flex flex-col" fullHeight={true}>
      <main className="flex-1 w-full overflow-hidden flex flex-col">
        <ChatRoom user={user} />
      </main>
    </AppShell>
  );
}
