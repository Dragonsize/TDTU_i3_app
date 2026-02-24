import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';


export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to get current user's profile from API
export async function getProfile() {
	const res = await fetch('/api/profile', { credentials: 'include' });
	if (!res.ok) throw new Error('Failed to fetch profile');
	const data = await res.json();
	return data.profile;
}
