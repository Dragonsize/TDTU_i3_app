'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPassword() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // When Supabase redirects here with an access token in the URL hash,
  // the JS client handles it internally. We just need to wait a moment so that
  // the session is available before allowing password update.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      // Supabase will process this automatically via the client.
      // We keep the page simple and focus on updating the password.
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      setSuccess('Password updated successfully. Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50/50 dark:bg-neutral-950 flex items-center justify-center p-4 transition-colors duration-300 font-['Inter']">

      <div className="w-full max-w-[440px] relative z-10">
        {/* Header/Logo Area */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group transition-all hover:scale-105">
            <div className="w-10 h-10 bg-gray-950 dark:bg-white rounded-xl shadow-lg flex items-center justify-center">
              <div className="w-5 h-5 bg-white/20 dark:bg-black/20 rounded-md border border-white/30 dark:border-black/30"></div>
            </div>
            <span className="text-xl font-bold text-gray-950 dark:text-white tracking-tight font-['Arimo'] uppercase">A+ Flow</span>
          </Link>

          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight uppercase leading-tight">
            Reset Protocol
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Define a new high-entropy access key for your account
          </p>
        </div>

        {/* Clean Dashboard-style Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-xl p-8 md:p-10 relative overflow-hidden">

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">
                  New Access Key
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-neutral-800/50 border border-gray-100 dark:border-white/5 rounded-2xl text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  required
                />
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">
                  Verify Key
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-neutral-800/50 border border-gray-100 dark:border-white/5 rounded-2xl text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                {success}
              </div>
            )}

            {/* Reset Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-tr from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'CONFIRM RESET'}
              </div>
            </button>

            {/* Bottom Link */}
            <div className="text-center mt-6">
              <Link href="/login" className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors inline-flex items-center gap-2 group">
                <span className="transition-transform group-hover:translate-x-[-2px]">←</span> Go to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

