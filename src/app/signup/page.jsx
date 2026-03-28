'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { dFetch } from '@/lib/api';

export default function SignUp() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGoogleSignUp = async () => {
    try {
      setError('');
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Use the callback page so we can exchange Supabase session
          // for backend session cookies (access_token/refresh_token).
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to sign up with Google');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const normalizedEmail = email.trim();
      const normalizedFullName = fullName.trim();

      // Call backend register endpoint with email/password
      // Backend will create user in Supabase, auto-confirm, and create JWT session
      const registerResponse = await dFetch('/api/auth/register-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: normalizedEmail,
          password,
          fullname: normalizedFullName,
        }),
      });

      if (registerResponse.ok) {
        // Store user profile in localStorage
        const sessionResult = await registerResponse.json();
        localStorage.setItem('userProfile', JSON.stringify(sessionResult.user));

        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
        return;
      }

      const backendError = await registerResponse.json().catch(() => null);
      const shouldFallback = [404, 405, 500, 502, 503, 504].includes(registerResponse.status);
      if (!shouldFallback) {
        throw new Error(backendError?.detail || 'Failed to create account');
      }

      // Fallback: sign up via Supabase, then create backend session/profile.
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: normalizedFullName,
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (signUpData.session?.access_token) {
        const token = signUpData.session.access_token;
        const registerViaTokenResponse = await dFetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: token,
            fullname: normalizedFullName,
          }),
        });

        if (!registerViaTokenResponse.ok) {
          const registerViaTokenError = await registerViaTokenResponse.json().catch(() => null);
          throw new Error(registerViaTokenError?.detail || 'Could not initialize your account session');
        }

        const registerViaTokenResult = await registerViaTokenResponse.json();
        localStorage.setItem('userProfile', JSON.stringify(registerViaTokenResult.user));

        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
        return;
      }

      setSuccess('Account created. Please check your email to confirm, then sign in.');
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50/50 dark:bg-neutral-950 flex items-center justify-center p-4 transition-colors duration-300 font-['Inter']">
      
      <div className="w-full max-w-[480px] relative z-10">
        {/* Header/Logo Area */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group transition-all hover:scale-105">
            <div className="w-10 h-10 bg-gray-950 dark:bg-white rounded-xl shadow-lg flex items-center justify-center">
              <div className="w-5 h-5 bg-white/20 dark:bg-black/20 rounded-md border border-white/30 dark:border-black/30"></div>
            </div>
            <span className="text-xl font-bold text-gray-950 dark:text-white tracking-tight font-['Arimo'] uppercase">A+ Flow</span>
          </Link>
          
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight uppercase leading-tight">
            Initialise Protocol
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Join the premium network for intelligent project orchestration
          </p>
        </div>

        {/* Clean Dashboard-style Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-gray-100 dark:border-white/10 shadow-xl p-8 md:p-10 relative overflow-hidden">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name Input */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">
                  Agent Descriptor / Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-neutral-800/50 border border-gray-100 dark:border-white/5 rounded-2xl text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  required
                />
              </div>

              {/* Email Input */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">
                  Communication Index / Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-5 py-3.5 bg-gray-50/50 dark:bg-neutral-800/50 border border-gray-100 dark:border-white/5 rounded-2xl text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">
                  Access Key
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

            {/* Signup Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-tr from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'CONNECT TO NETWORK'}
              </div>
            </button>

            {/* Social Separator */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-100 dark:border-white/5"></div>
              <span className="mx-4 text-gray-400 dark:text-gray-500 text-[9px] font-black uppercase tracking-[0.3em]">Alternate Protocol</span>
              <div className="flex-grow border-t border-gray-100 dark:border-white/5"></div>
            </div>

            {/* Google Signup */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full py-3.5 px-6 bg-white dark:bg-neutral-800 border border-gray-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-900/50 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 group shadow-sm"
            >
              <svg className="w-4 h-4 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Fast Track with Google
            </button>

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-4">
                Active connection exists?
              </p>
              <Link 
                href="/login" 
                className="w-full py-4 border border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-neutral-800/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:bg-white dark:hover:bg-neutral-800 hover:shadow-md inline-block text-center active:scale-95"
              >
                Return to Login
              </Link>
            </div>

            {/* Bottom Link */}
            <div className="text-center mt-6">
              <Link href="/" className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors inline-flex items-center gap-2 group">
                <span className="transition-transform group-hover:translate-x-[-2px]">←</span> Return to Base
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
