# Copilot Instructions — TDTU_i3_app

## Architecture & data flow
- Frontend is Next.js App Router under src/app (client components). Backend is a single FastAPI app in [api/index.py](api/index.py), wired by Vercel rewrites in [vercel.json](vercel.json).
- API routing is REST-style under /api/* (auth, profile, projects, schedules, documents, chatbot).
- Supabase is the single data store. Frontend auth uses @supabase/supabase-js in [src/lib/supabaseClient.ts](src/lib/supabaseClient.ts). Backend DB access is via supabase-py inside [api/index.py](api/index.py).
- JWT sessions are issued by the backend and stored in httpOnly cookies (see [api/index.py](api/index.py)).
- Frontend data flow example: Dashboard calls /api/projects and /api/deadlines with credentials (see [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)).

## Project-specific conventions
- User session info is stored in localStorage under userProfile for UI display; backend authorization relies on httpOnly cookies (see [src/app/login/page.tsx](src/app/login/page.tsx)).
- UI theming is localStorage-driven (darkMode) and applied via documentElement.classList.toggle('dark') (see [src/app/settings/page.tsx](src/app/settings/page.tsx)).
- Localization is a lightweight key-based map in [src/lib/translations.ts](src/lib/translations.ts) with a hook [src/lib/useTranslations.ts](src/lib/useTranslations.ts); keep new strings in both en/vi.
- Notifications are demo/local only: service worker in public/sw.js and helpers in [src/lib/pushNotifications.ts](src/lib/pushNotifications.ts) + [src/lib/usePushNotifications.ts](src/lib/usePushNotifications.ts). Backend notification endpoints are placeholders in [api/index.py](api/index.py).
- Styles are Tailwind CSS + custom utility classes in [src/app/globals.css](src/app/globals.css) (e.g., grid-bg, glass-effect, text-gradient). Follow existing utility class conventions for new UI.

## Workflows & env
- Dev workflow: npm run dev (Next.js). Build: npm run build. Lint: npm run lint (see [package.json](package.json)).
- Environment variables:
  - Frontend expects NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see [src/lib/supabaseClient.ts](src/lib/supabaseClient.ts)).
  - Backend expects SUPABASE_URL and SUPABASE_ANON_KEY (see [api/index.py](api/index.py)).
  - JWT secret comes from JWT_SECRET_KEY (see [api/index.py](api/index.py)).

## When adding features
- Prefer REST-style routes under /api/* in [api/index.py](api/index.py) and add corresponding frontend fetch calls with credentials.
- When reading/writing project data, use the Supabase client in [api/index.py](api/index.py) to keep table access consistent.
- For new pages, follow the existing navigation layout pattern (NavItem + right-side rail) seen in [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx), [src/app/chatbot/page.tsx](src/app/chatbot/page.tsx), and [src/app/settings/page.tsx](src/app/settings/page.tsx).
