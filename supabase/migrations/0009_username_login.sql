-- 0009_username_login.sql
--
-- Username-based admin sign-in.
--
-- The Supabase JS client cannot sign in by username — it only accepts an
-- email + password. To support `signInWithUsernameAndPassword`, the client
-- first calls this RPC to translate a username into the matching admin
-- email, then uses that email with `signInWithPassword`.
--
-- Security:
--   * SECURITY DEFINER so anon callers can run it without read access to
--     `auth.users` or `public.profiles`.
--   * Returns NULL on miss (unknown username OR username belongs to a
--     non-allowlisted email). Never throws, never enumerates which case
--     occurred.
--   * `STABLE` so PostgREST can plan it safely.
--   * Username comparison is case-insensitive (lower()).
--   * `search_path = public` to prevent function-hijack attacks.

CREATE OR REPLACE FUNCTION public.lookup_admin_email_by_username(p_username text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT u.email::text
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  JOIN public.admin_emails a ON lower(a.email) = lower(u.email)
  WHERE lower(p.username) = lower(p_username)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_admin_email_by_username(text) TO anon, authenticated;
