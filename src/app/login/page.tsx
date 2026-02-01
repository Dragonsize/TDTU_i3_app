'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setProfile(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Check if fullname is valid
      if (data.profile.fullname === 'Không tìm thấy') {
        throw new Error('Invalid credentials - profile not found');
      }

      // Store profile in localStorage
      localStorage.setItem('userProfile', JSON.stringify(data.profile));
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f6f8] dark:bg-[#050505] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <h1 className="text-4xl font-black">
              Team <span className="text-gradient">3</span>.
            </h1>
          </Link>
          <p className="text-slate-600 dark:text-white/60">Sign in to your TDTU account</p>
        </div>

        <div className="bg-white dark:bg-[#1a1025] border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-xl">
          {!profile ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-white">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-white">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold transition-all hover:shadow-[0_0_20px_rgba(127,19,236,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Profile</h2>
              <div className="space-y-3">
                <ProfileField label="Full Name" value={profile.fullname} />
                <ProfileField label="Email" value={profile.email} />
                <ProfileField label="Country" value={profile.country} />
                <ProfileField label="City" value={profile.city} />
                <ProfileField label="Timezone" value={profile.timezone} />
              </div>
              <button
                onClick={() => {
                  setProfile(null);
                  setUsername('');
                  setPassword('');
                }}
                className="w-full mt-6 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-3 rounded-xl font-bold transition-all"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-slate-600 dark:text-white/60 hover:text-primary transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="border-b border-slate-200 dark:border-white/10 pb-2">
      <dt className="text-xs font-medium text-slate-500 dark:text-white/50">{label}</dt>
      <dd className="text-sm font-medium text-slate-900 dark:text-white mt-1">{value || 'N/A'}</dd>
    </div>
  );
}
