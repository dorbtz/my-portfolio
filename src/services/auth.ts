import { supabase } from "../lib/supabase";

export async function signInWithEmail(email: string) {
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
  await supabase.auth.signOut();
}
