'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [publicUser, setPublicUser] = useState<any>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setPublicUser(data.session.user);
      }
      setSessionChecked(true);
    };

    syncSession();
  }, []);

  const handlePublicProfile = async (user: any) => {
    const emailValue = user.email || '';
    const fullnameValue = user.user_metadata?.full_name || emailValue;

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: emailValue,
          email: emailValue,
          fullname: fullnameValue
        })
      });
      const data = await response.json();
      const storedProfile = data?.profile || {
        username: emailValue,
        email: emailValue,
        fullname: fullnameValue
      };

      localStorage.setItem('userProfile', JSON.stringify(storedProfile));
      window.location.href = '/dashboard';
    } catch {
      localStorage.setItem('userProfile', JSON.stringify({
        username: emailValue,
        email: emailValue,
        fullname: fullnameValue
      }));
      window.location.href = '/dashboard';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });

        if (error) throw error;

        if (data?.user && !data?.session) {
          setMessage('Check your email to confirm your account.');
        } else if (data?.user) {
          await handlePublicProfile(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data?.user) {
          await handlePublicProfile(data.user);
        }
      }
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
          <p className="text-slate-600 dark:text-white/60">Sign in to your account</p>
        </div>

        <div className="bg-white dark:bg-[#1a1025] border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-xl">
          {publicUser && sessionChecked ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">You’re already signed in</h2>
              <p className="text-slate-600 dark:text-white/60 text-sm">
                Signed in as {publicUser.email}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handlePublicProfile(publicUser)}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold transition-all"
                >
                  Continue to Dashboard
                </button>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    localStorage.removeItem('userProfile');
                    setPublicUser(null);
                  }}
                  className="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-3 rounded-xl font-bold transition-all"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-white">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-white">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter your email"
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

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm text-primary hover:underline"
                  >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setError('');
                    setMessage('');
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: {
                        redirectTo: `${window.location.origin}/login`
                      }
                    });
                    if (error) setError(error.message);
                    setLoading(false);
                  }}
                  className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 py-3 rounded-xl font-bold transition-all hover:shadow-[0_0_20px_rgba(127,19,236,0.2)]"
                >
                  Continue with Google
                </button>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl text-sm">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold transition-all hover:shadow-[0_0_20px_rgba(127,19,236,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </form>
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
