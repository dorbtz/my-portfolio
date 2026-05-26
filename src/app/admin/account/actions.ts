"use server";

import { requireAdmin } from "@/shared/lib/auth/server";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";

const MIN = 8;

export async function setPassword(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const pw = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (pw.length < MIN) return { ok: false, error: `Password must be at least ${MIN} characters.` };
  if (pw !== confirm) return { ok: false, error: "Passwords don't match." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: pw });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
