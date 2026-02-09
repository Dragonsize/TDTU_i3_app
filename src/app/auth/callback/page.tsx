'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error: authError } = await supabase.auth.getSession();

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
        } else {
          throw new Error('No session found');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'An error occurred during sign in');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login?error=' + encodeURIComponent(err.message));
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [router]);

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-950 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-['Arimo']">Verifying your sign in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-950 font-['Arimo'] mb-2">Sign In Failed</h1>
          <p className="text-gray-600 font-['Arimo'] mb-4">{error}</p>
          <p className="text-sm text-gray-500 font-['Arimo']">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return null;
}
