/**
 * src/features/admin-messages/services/messages.ts
 *
 * Service layer for the contact-form inbox. All operations are RLS-gated
 * server-side via the public.is_admin() function from migration 0007.
 */
import { supabase } from '../../../lib/supabase';

export type MessageMode = 'thor' | 'gear5';

export type MessageRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  mode: MessageMode | null;
  created_at: string;
  read_at: string | null;
  archived: boolean;
};

export type MessageFilter = 'all' | 'unread' | 'archived' | 'thor' | 'gear5';

/**
 * Fetch up to `limit` messages newest-first, optionally filtered.
 * The unread filter excludes archived rows.
 */
export async function listMessages(
  filter: MessageFilter = 'all',
  limit = 100,
): Promise<MessageRow[]> {
  let q = supabase
    .from('messages')
    .select('id, name, email, message, mode, created_at, read_at, archived')
    .order('created_at', { ascending: false })
    .limit(limit);

  switch (filter) {
    case 'unread':
      q = q.is('read_at', null).eq('archived', false);
      break;
    case 'archived':
      q = q.eq('archived', true);
      break;
    case 'thor':
      q = q.eq('mode', 'thor');
      break;
    case 'gear5':
      q = q.eq('mode', 'gear5');
      break;
    case 'all':
    default:
      // no extra filter
      break;
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message || 'Failed to load messages.');
  return (data ?? []) as MessageRow[];
}

/** Set read_at to now() (or clear it if `read` is false). */
export async function setReadStatus(id: string, read: boolean): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: read ? new Date().toISOString() : null })
    .eq('id', id);
  if (error) throw new Error(error.message || 'Failed to update message.');
}

/** Convenience — flip read flag without caller computing the inverse. */
export async function toggleRead(row: MessageRow): Promise<void> {
  await setReadStatus(row.id, row.read_at === null);
}

export async function setArchived(id: string, archived: boolean): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ archived })
    .eq('id', id);
  if (error) throw new Error(error.message || 'Failed to archive message.');
}

export async function deleteMessage(id: string): Promise<void> {
  const { error } = await supabase.from('messages').delete().eq('id', id);
  if (error) throw new Error(error.message || 'Failed to delete message.');
}

/** Short snippet for the collapsed row view. */
export function snippet(text: string, max = 80): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1)}…`;
}
