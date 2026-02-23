'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function FilesPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('/api/documents', { credentials: 'include' });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.detail || 'Failed to load files');
        }
        const data = await response.json();
        setFiles(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to load files');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="w-full h-16 bg-white/60 border-b border-black/10 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gray-950 rounded-lg"></div>
              <span className="text-xl font-bold text-neutral-950 font-['Arimo']">A+ Flow</span>
            </Link>
            <nav className="hidden md:flex items-center gap-5 text-base text-gray-500 font-['Arimo']">
              <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Project</Link>
              <Link href="/chatbot" className="hover:text-gray-900 transition-colors">ChatBot</Link>
              <Link href="/chat" className="hover:text-gray-900 transition-colors">Chat</Link>
              <Link href="/files" className="text-gray-900">File</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="px-3.5 py-1.5 rounded-md flex items-center gap-1.5">
              <div className="w-10 h-10 rounded-full bg-gray-200"></div>
              <div className="text-neutral-950 text-xs font-normal font-['Arimo']">User</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center text-black text-5xl font-normal font-['Instrument_Sans']">Files</div>

        <section className="mt-10">
          <div className="bg-zinc-300 rounded-[20px] min-h-[520px] md:min-h-[620px] p-6 md:p-10">
            <div className="flex items-center justify-between mb-6">
              <div className="text-black text-2xl font-normal font-['Instrument_Sans']">Your Files</div>
              <div className="text-sm text-gray-600 font-['Arimo']">{files.length} items</div>
            </div>

            {loading ? (
              <div className="text-center text-gray-700 font-['Arimo']">Loading files...</div>
            ) : error ? (
              <div className="text-center text-red-600 font-['Arimo']">{error}</div>
            ) : files.length === 0 ? (
              <div className="text-center text-gray-700 font-['Arimo']">No files yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="bg-white/80 rounded-2xl p-4 shadow-sm border border-white">
                    <div className="w-14 h-14 bg-gray-200 rounded-xl mb-3"></div>
                    <div className="text-base text-black font-normal font-['Instrument_Sans'] truncate">
                      {file.filename || 'Untitled'}
                    </div>
                    <div className="text-xs text-gray-600 font-['Arimo'] mt-1">
                      {file.project_id ? 'Shared to project' : 'Private'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
