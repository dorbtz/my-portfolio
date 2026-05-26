-- =============================================================================
-- 0015_security_hardening.sql
-- =============================================================================
-- Purpose:
--   M4 — addresses Supabase advisor lints introduced by 0012 + 0013:
--     1. Move pgvector out of `public` into `extensions` schema.
--     2. Drop the broad SELECT policy on project-covers — public bucket
--        object URLs work without RLS; the policy only enabled bucket
--        listing, which is not needed for URL-based access.
--
--   Pre-existing lints on avatars/contact-media buckets, the message
--   rate-limit function search_path, and Auth leaked-password protection
--   are intentionally left for a separate hardening pass (M8 polish).

alter extension vector set schema extensions;

drop policy if exists "project_covers_public_read" on storage.objects;
