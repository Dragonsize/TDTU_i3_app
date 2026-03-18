'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  }, [searchParams]);

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
    <div className="w-full min-h-screen bg-white overflow-hidden">
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gray-950 rounded-lg"></div>
              <span className="text-xl font-bold text-neutral-950 font-['Arimo']">A+ Flow</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-black font-['IM_FELL_Great_Primer_SC'] mb-2">
              Set a new password
            </h1>
            <p className="text-sm md:text-base text-gray-600 font-['Arimo']">
              Choose a strong password to secure your account.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col">
                <label className="text-gray-800 text-sm md:text-base font-semibold font-['Nunito'] mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-300 text-gray-900 text-sm md:text-base font-normal font-['Nunito'] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all placeholder-gray-400"
                  required
                />
              </div>

              <div className="flex flex-col">
                <label className="text-gray-800 text-sm md:text-base font-semibold font-['Nunito'] mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white rounded-xl shadow-sm border border-slate-300 text-gray-900 text-sm md:text-base font-normal font-['Nunito'] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all placeholder-gray-400"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 text-sm font-['Nunito']">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded-lg text-green-700 text-sm font-['Nunito']">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-gray-950 hover:bg-black text-white text-sm md:text-base font-bold font-['Nunito'] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>

              <div className="text-center mt-4">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 text-sm font-['Arimo'] transition-colors"
                >
                  ← Back to login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

