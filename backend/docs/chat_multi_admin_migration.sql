-- Multi-admin migration for chat_channel_members
-- Run in Supabase SQL editor once before deploying UI that uses role updates/removals.

ALTER TABLE public.chat_channel_members
ADD COLUMN IF NOT EXISTS role text;

UPDATE public.chat_channel_members
SET role = 'member'
WHERE role IS NULL;

ALTER TABLE public.chat_channel_members
ALTER COLUMN role SET DEFAULT 'member';

ALTER TABLE public.chat_channel_members
ALTER COLUMN role SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chat_channel_members_role_check'
    ) THEN
        ALTER TABLE public.chat_channel_members
        ADD CONSTRAINT chat_channel_members_role_check
        CHECK (role IN ('admin', 'member'));
    END IF;
END
$$;

-- Backfill creator membership as admin
UPDATE public.chat_channel_members m
SET role = 'admin'
FROM public.chat_channels c
WHERE c.id = m.channel_id
  AND c.created_by = m.user_id;

CREATE INDEX IF NOT EXISTS idx_chat_channel_members_channel_role
ON public.chat_channel_members (channel_id, role);

CREATE INDEX IF NOT EXISTS idx_chat_channel_members_channel_user
ON public.chat_channel_members (channel_id, user_id);

-- Verification helpers
-- 1) must be 0
-- SELECT COUNT(*) FROM public.chat_channel_members WHERE role IS NULL;
-- 2) must be 0
-- SELECT COUNT(*) FROM public.chat_channel_members WHERE role NOT IN ('admin', 'member');
-- 3) creators missing admin role should be 0
-- SELECT COUNT(*)
-- FROM public.chat_channels c
-- JOIN public.chat_channel_members m ON m.channel_id = c.id AND m.user_id = c.created_by
-- WHERE m.role <> 'admin';
