import { createClient } from "@supabase/supabase-js";

// Auth config:
// - persistSession: store the session in localStorage so the user stays signed in
//   across page refreshes / route changes. Without this, every refresh kicks the
//   admin back to /admin/login.
// - autoRefreshToken: silently refresh the access token before it expires (default
//   1 h JWT). With refresh tokens lasting ~1 week, this gives effectively
//   indefinite sessions for active users.
// - storageKey: explicit so it's stable across deploys and easy to clear.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "sb-portfolio-auth",
    },
  }
);