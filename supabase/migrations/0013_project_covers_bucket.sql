-- =============================================================================
-- 0013_project_covers_bucket.sql
-- =============================================================================
-- Purpose:
--   M4 — `project-covers` Storage bucket for project hero / cover images.
--   Public read (URL-only — listing policy dropped in 0015 per advisor),
--   admin-only write via is_admin().

insert into storage.buckets (id, name, public)
values ('project-covers', 'project-covers', true)
on conflict (id) do nothing;

-- Object-URL access for public buckets does NOT require a SELECT policy on
-- storage.objects. The SELECT policy is dropped in 0015_security_hardening.
-- (Kept here as a record of what M4 originally added, then refined.)

drop policy if exists "project_covers_admin_write" on storage.objects;
create policy "project_covers_admin_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-covers' and public.is_admin());

drop policy if exists "project_covers_admin_update" on storage.objects;
create policy "project_covers_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'project-covers' and public.is_admin())
  with check (bucket_id = 'project-covers' and public.is_admin());

drop policy if exists "project_covers_admin_delete" on storage.objects;
create policy "project_covers_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'project-covers' and public.is_admin());
