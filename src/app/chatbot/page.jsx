
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

export default function ChatbotPage() {
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
    <AppShell user={user} activePath="/chatbot" contentClassName="flex-1">
      <div className="flex items-center justify-center text-lg sm:text-2xl font-bold min-h-[calc(100dvh-4rem)] px-4 text-center">
        Chatbot placeholder page
      </div>
    </AppShell>
  );
}
