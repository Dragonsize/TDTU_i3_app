# Frontend API keys

This document lists environment variables that are safe to expose to the frontend.

## Required in .env.local (frontend)

- NEXT_PUBLIC_SUPABASE_URL
  - Purpose: Supabase project URL used by the frontend client.
  - Example: https://<project>.supabase.co

- NEXT_PUBLIC_SUPABASE_ANON_KEY
  - Purpose: Supabase anonymous key used by the frontend client.
  - Scope: Public client key with Row Level Security enforced in Supabase.

## Not for frontend exposure

- SUPABASE_URL
- SUPABASE_ANON_KEY
- JWT_SECRET_KEY
- FEATHERLESS_API_KEY
- Any service role keys

