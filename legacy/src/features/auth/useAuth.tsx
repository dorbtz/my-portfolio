import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../shared/lib/supabase";
import { AuthCtx } from "./useAuth.helpers";

// Round 74 — This file ONLY exports the AuthProvider component so the
// react-refresh/only-export-components lint rule passes. The `useAuth`
// hook + AuthState type live in `useAuth.helpers.ts`; consumers now
// import the hook from there directly.

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setLoading(false);
      return;
    }
    // initial session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    // listen for changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({ user, loading }), [user, loading]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
