'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

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
          redirectTo: `${window.location.origin}/dashboard`,
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
      // Call backend register endpoint with email/password
      // Backend will create user in Supabase, auto-confirm, and create JWT session
      const registerResponse = await fetch('/api/auth/register-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          password,
          fullname: fullName,
        }),
        credentials: 'include',
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.detail || 'Failed to create account');
      }

      // Store user profile in localStorage
      const sessionResult = await registerResponse.json();
      localStorage.setItem('userProfile', JSON.stringify(sessionResult.user));

      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
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
              Join Us
            </h1>
            <p className="text-lg md:text-xl text-gray-600 font-['Arimo']">
              Create your A+ Flow account to get started
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 lg:p-16 border border-gray-200/50">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Full Name Input */}
              <div className="flex flex-col">
                <label className="text-gray-800 text-lg md:text-xl font-semibold font-['Nunito'] mb-3">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-5 py-4 bg-white rounded-xl shadow-sm border border-slate-300 text-gray-900 text-lg font-normal font-['Nunito'] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all placeholder-gray-400"
                  required
                />
              </div>

              {/* Email Input */}
              <div className="flex flex-col">
                <label className="text-gray-800 text-lg md:text-xl font-semibold font-['Nunito'] mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-5 py-4 bg-white rounded-xl shadow-sm border border-slate-300 text-gray-900 text-lg font-normal font-['Nunito'] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all placeholder-gray-400"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="flex flex-col">
                <label className="text-gray-800 text-lg md:text-xl font-semibold font-['Nunito'] mb-3">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-white rounded-xl shadow-sm border border-slate-300 text-gray-900 text-lg font-normal font-['Nunito'] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all placeholder-gray-400"
                  required
                />
                <p className="text-xs md:text-sm text-gray-500 font-['Nunito'] mt-2">
                  At least 6 characters
                </p>
              </div>

              {/* Confirm Password Input */}
              <div className="flex flex-col">
                <label className="text-gray-800 text-lg md:text-xl font-semibold font-['Nunito'] mb-3">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

              {/* Success Message */}
              {success && (
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg text-green-700 font-['Nunito']">
                  <p className="font-semibold">Success!</p>
                  <p className="text-sm mt-1">{success}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gray-950 hover:bg-black text-white text-lg font-bold font-['Nunito'] rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mt-10"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              {/* Divider */}
              <div className="relative flex items-center my-8">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 text-gray-500 font-['Inter'] font-medium">or</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              {/* Google Sign Up Button */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
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

              {/* Already Have Account Link */}
              <div className="text-center">
                <p className="text-gray-600 text-base font-['Nunito'] mb-4">
                  Already have an account?
                </p>
                <Link href="/login" className="w-full py-3 px-6 border-2 border-gray-300 hover:border-gray-700 hover:bg-gray-100 text-gray-800 text-base font-semibold font-['Nunito'] rounded-xl transition-all inline-block">
                  Sign In
                </Link>
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
    </div>
  );
}
