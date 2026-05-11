-- =============================================================================
-- 0008_admin_emails_writes.sql
-- =============================================================================
-- Purpose:
--   Allow the in-app /admin/allowlist page to add/remove admin emails. The
--   original 0003 migration only created a public SELECT policy on
--   public.admin_emails — INSERT / DELETE were possible only via the service
--   role (i.e. the SQL editor). This migration adds is_admin()-gated INSERT
--   and DELETE policies so an authenticated allowlisted admin can manage the
--   roster from the UI.
--
--   Idempotent: safe to run multiple times.
--
-- Depends on:
--   0003_admin_allowlist.sql  (for public.is_admin() and admin_emails table)
-- =============================================================================

BEGIN;

DROP POLICY IF EXISTS admin_emails_admin_insert ON public.admin_emails;
CREATE POLICY admin_emails_admin_insert
  ON public.admin_emails
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS admin_emails_admin_delete ON public.admin_emails;
CREATE POLICY admin_emails_admin_delete
  ON public.admin_emails
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Note: no UPDATE policy by design. The single column (email) is the PK;
-- "renaming" an admin should be a delete + insert so audit log makes sense.

COMMIT;
