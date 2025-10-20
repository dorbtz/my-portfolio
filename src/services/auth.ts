import { supabase } from "../lib/supabaseClient";

export async function signInWithEmail(email: string) {
  if (!supabase) throw new Error("Supabase is not configured");
  // Update this to your production site origin in Supabase Auth settings later
  const redirectTo = `${window.location.origin}/admin/projects`;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
  return true;
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}
