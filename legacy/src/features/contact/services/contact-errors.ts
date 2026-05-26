/**
 * src/services/contact-errors.ts
 *
 * Pure error-translation helpers for the contact-message insert path.
 * Lives in its own file so tests can import without pulling the Supabase
 * client or the Zustand mode store (both of which trigger rolldown-vite
 * SSR transform issues in the vmThreads test environment).
 *
 * Round 21: introduced alongside migration 0010 (per-IP rate limit on
 * anonymous message inserts).  When the BEFORE INSERT trigger raises
 * 'rate_limited' (errcode 42501), we surface a friendly user message
 * instead of the raw exception text.
 *
 * Round 54: translate Postgres CHECK constraint violations (errcode
 * 23514) on the `messages` table into friendly per-field messages so
 * users see "your email looks wrong" instead of the raw
 * 'violates check constraint "messages_email_check"' string.
 *
 * The `messages` table has these CHECK constraints (see migration
 * 0007_messages_table.sql):
 *   messages_name_check     char_length(name) >= 1
 *   messages_email_check    email ~* '^[^@]+@[^@]+\.[^@]+$'
 *   messages_message_check  char_length(message) >= 10
 *   messages_mode_check     mode IN ('thor', 'gear5')
 */

/** User-facing message for the rate-limit branch. */
export const RATE_LIMITED_MESSAGE =
  'Too many messages from your network. Try again in an hour.';

/** Generic fallback when Supabase returns an error with no message. */
export const GENERIC_FAILURE_MESSAGE =
  'Failed to send message. Please try again.';

/** CHECK constraint violation messages — one per constraint. */
export const NAME_TOO_SHORT_MESSAGE =
  'Please enter your name.';

export const EMAIL_INVALID_MESSAGE =
  'That email address doesn’t look right. Please double-check it.';

export const MESSAGE_TOO_SHORT_MESSAGE =
  'Your message is too short — please write at least 10 characters.';

export const MODE_INVALID_MESSAGE =
  'Something went wrong with the form. Please refresh the page and try again.';

/**
 * Translate a Supabase error from the `messages` insert into a
 * user-friendly string.
 *
 * Branches handled:
 *   - rate-limit trigger (errcode 42501 / message contains rate_limited)
 *   - CHECK constraint violations (errcode 23514) — one branch per
 *     known constraint name on `messages`
 *   - empty error -> generic fallback
 *   - unknown error -> the raw message (or generic fallback if blank)
 */
export function translateMessageInsertError(
  err: { message?: string; code?: string } | null | undefined,
): string {
  if (!err) return GENERIC_FAILURE_MESSAGE;

  const rawMsg = typeof err.message === 'string' ? err.message : '';
  const lowerMsg = rawMsg.toLowerCase();

  // Rate-limit (Round 21).  Trigger raises with errcode 42501; the message
  // is the literal 'rate_limited'.  Match both code AND message defensively.
  if (
    err.code === '42501' ||
    lowerMsg.includes('rate_limited')
  ) {
    return RATE_LIMITED_MESSAGE;
  }

  // CHECK constraint violations (Postgres errcode 23514).  The error
  // message text contains the constraint name; map each to a friendly
  // message that points at the offending field.
  if (
    err.code === '23514' ||
    lowerMsg.includes('violates check constraint')
  ) {
    if (lowerMsg.includes('messages_message_check')) return MESSAGE_TOO_SHORT_MESSAGE;
    if (lowerMsg.includes('messages_email_check'))   return EMAIL_INVALID_MESSAGE;
    if (lowerMsg.includes('messages_name_check'))    return NAME_TOO_SHORT_MESSAGE;
    if (lowerMsg.includes('messages_mode_check'))    return MODE_INVALID_MESSAGE;
    // Unknown CHECK constraint — generic fallback so we don't leak
    // 'violates check constraint "..."' to the user.
    return GENERIC_FAILURE_MESSAGE;
  }

  return rawMsg || GENERIC_FAILURE_MESSAGE;
}
