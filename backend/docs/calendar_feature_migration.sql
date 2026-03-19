-- Calendar feature migration (idempotent)
-- Run in Supabase SQL editor if calendar_events table does not exist in your environment.

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NULL REFERENCES public.projects(id),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  title text NOT NULL,
  description text NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  event_type text DEFAULT 'meeting',
  color text NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT calendar_events_time_check CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_start
ON public.calendar_events (user_id, start_time);

CREATE INDEX IF NOT EXISTS idx_calendar_events_project_start
ON public.calendar_events (project_id, start_time);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_end
ON public.calendar_events (user_id, end_time);

CREATE TABLE IF NOT EXISTS public.busy_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  description text NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT busy_times_time_check CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_busy_times_user_start
ON public.busy_times (user_id, start_time);
