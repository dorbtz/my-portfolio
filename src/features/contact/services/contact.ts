/**
 * src/services/contact.ts
 * Contact message service — inserts into the `messages` Supabase table.
 *
 * Schema (see supabase/seed/002_messages_table.sql):
 *   id          uuid pk default gen_random_uuid()
 *   name        text not null
 *   email       text not null
 *   message     text not null
 *   mode        text          (thor | gear5)
 *   created_at  timestamptz default now()
 *   read_at     timestamptz
 *   archived    boolean default false
 *
 * Round 21: rate-limit error translation.  Migration 0010 enforces a
 * per-IP 3-per-hour ceiling on anon inserts.  When the BEFORE INSERT
 * trigger raises 'rate_limited' (errcode 42501), the pure helper in
 * `./contact-errors` translates it into a friendly user-facing string
 * instead of leaking the raw exception text into the UI.
 */
import { supabase } from '../../../shared/lib/supabase';
import { useModeStore } from '../../../shared/stores/mode';
import {
  translateMessageInsertError,
  RATE_LIMITED_MESSAGE,
} from './contact-errors';

// Re-export so existing import sites continue to work transparently.
export { translateMessageInsertError, RATE_LIMITED_MESSAGE };

export type ContactPayload = {
  name: string;
  email: string;
  message: string;
};

/**
 * Insert a contact message into the messages table.
 * Captures the current portfolio mode (thor | gear5) automatically.
 * Throws a user-friendly Error on Supabase error.
 */
export async function sendContactMessage(payload: ContactPayload): Promise<void> {
  const mode = useModeStore.getState().mode;

  const { error } = await supabase.from('messages').insert({
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    message: payload.message.trim(),
    mode,
  });

  if (error) {
    throw new Error(translateMessageInsertError(error));
  }
}
