'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        throw new Error(resetError.message);
      }

      setSuccess('If that email exists, we sent a reset link.');
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
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
              Reset your password
            </h1>
            <p className="text-sm md:text-base text-gray-600 font-['Arimo']">
              Enter the email associated with your account and we&apos;ll send you a reset link.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col">
                <label className="text-gray-800 text-sm md:text-base font-semibold font-['Nunito'] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
                {loading ? 'Sending...' : 'Send reset link'}
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

