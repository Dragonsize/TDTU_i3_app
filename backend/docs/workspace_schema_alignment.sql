-- Workspace schema alignment for workflow creation
-- Run in Supabase SQL editor (idempotent).
-- Goal: align schema with backend create_workflow expectations.

-- 1) Ensure workspaces uses name (not title) and has a members array.
ALTER TABLE public.workspaces
ADD COLUMN IF NOT EXISTS name text;

ALTER TABLE public.workspaces
ADD COLUMN IF NOT EXISTS members uuid[];

ALTER TABLE public.workspaces
ALTER COLUMN members SET DEFAULT '{}'::uuid[];

-- If a title column exists from older iterations, backfill name once.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'workspaces'
      AND column_name = 'title'
  ) THEN
    EXECUTE '
      UPDATE public.workspaces
      SET name = COALESCE(name, title)
      WHERE (name IS NULL OR btrim(name) = '''')
    ';
  END IF;
END
$$;

-- 2) Backfill members from assignments/creator before any strict checks.
-- IMPORTANT: do NOT set empty arrays; production trigger rejects them.
UPDATE public.workspaces w
SET members = COALESCE(
  (
    SELECT array_agg(DISTINCT wa.user_id)
    FROM public.workspace_assignments wa
    WHERE wa.workspace_id = w.id
  ),
  CASE WHEN w.creator_id IS NOT NULL THEN ARRAY[w.creator_id]::uuid[] ELSE NULL END
)
WHERE w.members IS NULL
   OR array_length(w.members, 1) IS NULL
   OR array_length(w.members, 1) = 0;

-- 3) Ensure each workspace has at least one member in members[].
-- This matches the production rule reported in logs.
CREATE OR REPLACE FUNCTION public.ensure_workspace_has_member()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.members IS NULL OR array_length(NEW.members, 1) IS NULL OR array_length(NEW.members, 1) < 1 THEN
    RAISE EXCEPTION 'Workspace must have at least one assigned member';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE t.tgrelid = 'public.workspaces'::regclass
      AND NOT t.tgisinternal
      AND (
        t.tgname = 'trg_workspace_has_member'
        OR p.proname IN ('ensure_workspace_has_member', 'check_workspace_members_not_empty')
      )
  ) THEN
    CREATE TRIGGER trg_workspace_has_member
    BEFORE INSERT OR UPDATE ON public.workspaces
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_workspace_has_member();
  END IF;
END
$$;

-- 4) Keep workspace_assignments in sync with members[] for existing records.
INSERT INTO public.workspace_assignments (workspace_id, user_id, role)
SELECT w.id, member_id, 'member'
FROM public.workspaces w
CROSS JOIN LATERAL unnest(w.members) AS member_id
LEFT JOIN public.workspace_assignments a
  ON a.workspace_id = w.id AND a.user_id = member_id
WHERE a.id IS NULL;

-- Verification
-- A) Must be 0
-- SELECT COUNT(*) FROM public.workspaces WHERE members IS NULL OR array_length(members, 1) IS NULL OR array_length(members, 1) = 0;
-- B) Check columns
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='workspaces';
