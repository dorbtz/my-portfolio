/**
 * src/features/admin-allowlist/services/allowlist.ts
 *
 * CRUD for the public.admin_emails table. Server enforces who can mutate
 * via the same is_admin() RLS used everywhere else.
 *
 * NB: in Round 13 only the SELECT policy existed on admin_emails (any
 * client can read so the magic-link gate works). For these admin write
 * paths to succeed, you'll need INSERT / DELETE policies guarded by
 * is_admin(); see migration 0008 (added in this round).
 *
 * On every write we invalidate the in-memory cache in
 * src/services/adminAllowlist.ts so the magic-link gate sees the change
 * immediately.
 */
import { supabase } from '../../../lib/supabase';
import { clearAdminAllowlistCache } from '../../../services/adminAllowlist';

export type AdminEmailRow = { email: string; previous_emails?: string[] };

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RX.test(email.trim());
}

export async function listAdmins(): Promise<AdminEmailRow[]> {
  const { data, error } = await supabase
    .from('admin_emails')
    .select('email, previous_emails')
    .order('email', { ascending: true });
  if (error) throw new Error(error.message || 'Failed to load allowlist.');
  return (data ?? []) as AdminEmailRow[];
}

export async function addAdmin(rawEmail: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  if (!isValidEmail(email)) {
    throw new Error('Please enter a valid email address.');
  }
  const { error } = await supabase
    .from('admin_emails')
    .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true });
  if (error) throw new Error(error.message || 'Failed to add admin.');
  clearAdminAllowlistCache();
}

export async function removeAdmin(rawEmail: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  const { error } = await supabase
    .from('admin_emails')
    .delete()
    .eq('email', email);
  if (error) throw new Error(error.message || 'Failed to remove admin.');
  clearAdminAllowlistCache();
}
