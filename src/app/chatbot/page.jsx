
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChatbotPage() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/profile", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.profile) router.push("/login");
      })
      .catch(() => router.push("/login"));
  }, [router]);
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full h-16 bg-white/60 border-b border-black/10 flex items-center justify-between px-8 lg:px-32 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-gray-950 rounded-lg"></div>
            <span className="text-neutral-950 text-xl font-bold font-['Arimo']">A+ Flow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-base text-gray-500">
            <Link href="/project" className="font-['Inter'] text-black font-medium">Project</Link>
            <Link href="/chatbot" className="font-['Arimo'] hover:text-black cursor-pointer">ChatBot</Link>
            <Link href="/chat" className="font-['Arimo'] hover:text-black cursor-pointer">Chat</Link>
            <Link href="/files" className="font-['Arimo'] hover:text-black cursor-pointer">File</Link>
          </nav>
        </div>
        <Link href="/settings" className="flex items-center gap-2" title="Settings">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 border-2 border-white">
            {/* TODO: fetch user info for initials if needed */}
            U
          </div>
        </Link>
      </header>
      <div className="flex items-center justify-center text-2xl font-bold min-h-[calc(100vh-4rem)]">
        Chatbot placeholder page
      </div>
    </div>
  );
}
