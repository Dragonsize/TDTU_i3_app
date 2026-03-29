
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import AppShell from "@/components/AppShell";
import PageLoader from "@/components/PageLoader";
import SkeletonLoader from "@/components/SkeletonLoader";
import { dFetch } from "@/lib/api";

const ChatRoom = dynamic(() => import("./ChatRoom"), { ssr: false });

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await dFetch('/api/profile');
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
      <AppShell user={user} activePath="/chat" contentClassName="flex-1 bg-gray-50/50 dark:bg-neutral-950/50" fullHeight={true}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
          <SkeletonLoader type="chat-channels" />
        </div>
      </AppShell>
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
