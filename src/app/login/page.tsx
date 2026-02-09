'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMagicLink, setLoadingMagicLink] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showMagicLinkModal, setShowMagicLinkModal] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  const handleMagicLinkSignIn = async () => {
    if (!magicLinkEmail) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoadingMagicLink(true);
      setError('');
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: magicLinkEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      setMagicLinkSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoadingMagicLink(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Sign in with Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (data.session?.access_token) {
        // Create backend session
        const sessionResponse = await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ access_token: data.session.access_token }),
          credentials: 'include',
        });

        if (!sessionResponse.ok) {
          throw new Error('Failed to create backend session');
        }

        // Store user profile in localStorage
        const sessionData = await sessionResponse.json();
        localStorage.setItem('userProfile', JSON.stringify(sessionData.user));

        // Redirect to dashboard
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white overflow-hidden">
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Header Section */}
          <div className="text-center mb-16 md:mb-20">
            <Link href="/" className="inline-flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-gray-950 rounded-lg"></div>
              <span className="text-2xl font-bold text-neutral-950 font-['Arimo']">A+ Flow</span>
            </Link>
            
            <h1 className="text-5xl md:text-7xl font-bold text-black text-center leading-tight mb-4 font-['IM_FELL_Great_Primer_SC']">
              Welcome Back
            </h1>
            <p className="text-lg md:text-xl text-gray-600 font-['Arimo']">
              Sign in to your A+ Flow account
            </p>
          </div>

          {/* Form Container - Wider and More Spacious */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 lg:p-16 border border-gray-200/50">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Email Input */}
              <div className="flex flex-col">
                <label className="text-gray-800 text-lg md:text-xl font-semibold font-['Nunito'] mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-5 py-4 bg-white rounded-xl shadow-sm border border-slate-300 text-gray-900 text-lg font-normal font-['Nunito'] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all placeholder-gray-400"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-gray-800 text-lg md:text-xl font-semibold font-['Nunito']">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-gray-700 text-sm md:text-base font-medium font-['Inter'] hover:text-black transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-white rounded-xl shadow-sm border border-slate-300 text-gray-900 text-lg font-normal font-['Nunito'] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all placeholder-gray-400"
                  required
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 font-['Nunito']">
                  <p className="font-semibold">Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              )}

              {/* Magic Link Success Message */}
              {magicLinkSent && (
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg text-green-700 font-['Nunito']">
                  <p className="font-semibold">Check your email!</p>
                  <p className="text-sm mt-1">We've sent you a magic link to sign in.</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gray-950 hover:bg-black text-white text-lg font-bold font-['Nunito'] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mt-10"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* Divider */}
              <div className="relative flex items-center my-8">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 text-gray-500 font-['Inter'] font-medium">or</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-6 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-800 text-base font-semibold font-['Nunito'] rounded-xl transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Email Magic Link Button */}
              <button
                type="button"
                onClick={() => setShowMagicLinkModal(true)}
                className="w-full py-3 px-6 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-800 text-base font-semibold font-['Nunito'] rounded-xl transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Continue with Email Link
              </button>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-gray-600 text-base font-['Nunito'] mb-4">
                  Don't have an account?
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/signup')}
                  className="w-full py-3 px-6 border-2 border-gray-300 hover:border-gray-700 hover:bg-gray-100 text-gray-800 text-base font-semibold font-['Nunito'] rounded-xl transition-all"
                >
                  Create Account
                </button>
              </div>

              {/* Back to Home Link */}
              <div className="text-center mt-8">
                <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm font-['Arimo'] transition-colors">
                  ← Back to Home
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Magic Link Modal */}
      {showMagicLinkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-950 font-['Arimo']">
                Sign in with Email Link
              </h2>
              <button
                onClick={() => {
                  setShowMagicLinkModal(false);
                  setMagicLinkSent(false);
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!magicLinkSent ? (
              <>
                <p className="text-gray-600 font-['Arimo'] mb-6">
                  Enter your email address and we'll send you a magic link to sign in instantly.
                </p>

                {/* Error Message in Modal */}
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 font-['Nunito']">
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <input
                  type="email"
                  value={magicLinkEmail}
                  onChange={(e) => setMagicLinkEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-5 py-4 bg-white rounded-xl shadow-sm border border-slate-300 text-gray-900 text-lg font-normal font-['Nunito'] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all placeholder-gray-400 mb-6"
                  autoFocus
                />

                <button
                  onClick={handleMagicLinkSignIn}
                  disabled={loadingMagicLink || !magicLinkEmail}
                  className="w-full py-4 px-6 bg-gray-950 hover:bg-black text-white text-lg font-bold font-['Nunito'] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loadingMagicLink ? 'Sending...' : 'Send Magic Link'}
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-950 font-['Arimo'] mb-2">
                  Check your email!
                </h3>
                <p className="text-gray-600 font-['Arimo'] mb-2">
                  We've sent a magic link to:
                </p>
                <p className="text-gray-950 font-semibold font-['Arimo'] mb-6">
                  {magicLinkEmail}
                </p>
                <p className="text-sm text-gray-500 font-['Arimo']">
                  Click the link in your email to sign in. The link will expire in 1 hour.
                </p>
                <button
                  onClick={() => {
                    setShowMagicLinkModal(false);
                    setMagicLinkSent(false);
                    setMagicLinkEmail('');
                  }}
                  className="mt-6 w-full py-3 px-6 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-800 text-base font-semibold font-['Nunito'] rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
