-- =============================================================================
-- 0007_messages_table.sql
-- =============================================================================
-- Purpose:
--   Create the `messages` table for the Den Den Mushi contact form.
--   Anyone (anon + authenticated) can INSERT a message; only allowlisted
--   admins (per public.is_admin()) can SELECT / UPDATE / DELETE them.
--
--   Idempotent: safe to run multiple times.
--
-- How to run:
--   Option A — Supabase SQL editor:
--     Open https://app.supabase.com → SQL Editor, paste this file, click Run.
--
--   Option B — Supabase CLI:
--     supabase db push
--
-- Depends on:
--   0003_admin_allowlist.sql  (for public.is_admin())
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL CHECK (char_length(name) >= 1),
  email       text        NOT NULL CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  message     text        NOT NULL CHECK (char_length(message) >= 10),
  mode        text        CHECK (mode IN ('thor', 'gear5')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  read_at     timestamptz,
  archived    boolean     NOT NULL DEFAULT false
);

-- ---------------------------------------------------------------------------
-- 2. Indexes — newest first + partial index for the unread inbox view
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS messages_created_at_desc_idx
  ON public.messages (created_at DESC);

CREATE INDEX IF NOT EXISTS messages_unread_idx
  ON public.messages (created_at DESC)
  WHERE read_at IS NULL AND archived = false;

-- ---------------------------------------------------------------------------
-- 3. Enable Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4. RLS Policies — allowlist-aware via public.is_admin()
-- ---------------------------------------------------------------------------

-- Drop any pre-existing policies (idempotent re-run + Round 13 seed cleanup)
DROP POLICY IF EXISTS allow_anon_insert     ON public.messages;
DROP POLICY IF EXISTS allow_admin_select    ON public.messages;
DROP POLICY IF EXISTS allow_admin_update    ON public.messages;
DROP POLICY IF EXISTS allow_admin_delete    ON public.messages;
DROP POLICY IF EXISTS messages_anon_insert  ON public.messages;
DROP POLICY IF EXISTS messages_admin_select ON public.messages;
DROP POLICY IF EXISTS messages_admin_update ON public.messages;
DROP POLICY IF EXISTS messages_admin_delete ON public.messages;

-- Anyone (anon + authenticated) can submit a message via the contact form.
CREATE POLICY messages_anon_insert
  ON public.messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only allowlisted admins can read messages.
CREATE POLICY messages_admin_select
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Only allowlisted admins can update (mark read / archive).
CREATE POLICY messages_admin_update
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only allowlisted admins can delete.
CREATE POLICY messages_admin_delete
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

COMMIT;

-- =============================================================================
-- Verification (read-only):
--   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'messages';
--   SELECT polname, polcmd FROM pg_policy
--     WHERE polrelid = 'public.messages'::regclass ORDER BY polname;
-- =============================================================================
