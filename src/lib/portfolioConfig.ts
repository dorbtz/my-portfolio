/**
 * src/lib/portfolioConfig.ts
 *
 * Single source of truth for the portfolio owner's identity. Reads
 * `VITE_PORTFOLIO_*` environment variables with safe fallbacks so the
 * project still boots without a `.env` (placeholder text appears in
 * the UI to make missing config obvious).
 *
 * To customize for a fork: copy `.env.example` -> `.env` and fill in
 * the `VITE_PORTFOLIO_*` block. See README "Customizing for your fork".
 */

// `import.meta.env.*` is loosely typed in this project (no vite/client
// reference), so coerce to string|undefined explicitly to keep the
// resulting PORTFOLIO field types as `string`. The fallbacks below
// guarantee a non-empty string for everything except the optional
// fields (bio, tagline, github, linkedin) which default to "".
function envStr(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

export const PORTFOLIO = {
  name: envStr(import.meta.env.VITE_PORTFOLIO_NAME) ?? 'Your Name Here',
  title: envStr(import.meta.env.VITE_PORTFOLIO_TITLE) ?? 'Your Title',
  bio: envStr(import.meta.env.VITE_PORTFOLIO_BIO) ?? '',
  tagline: envStr(import.meta.env.VITE_PORTFOLIO_TAGLINE) ?? '',
  github: envStr(import.meta.env.VITE_PORTFOLIO_GITHUB_URL) ?? '',
  linkedin: envStr(import.meta.env.VITE_PORTFOLIO_LINKEDIN_URL) ?? '',
} as const;

/**
 * Word-first-letter indices, e.g. "Dor Ben Tzur" -> [0, 4, 8].
 * Used to derive the hidden admin-entry secret sequence so it adapts
 * to the forker's name automatically (initials-of-name pattern).
 */
export function deriveSecretSequence(name: string): number[] {
  const out: number[] = [];
  let prev = ' ';
  for (let i = 0; i < name.length; i++) {
    if (prev === ' ' && name[i] !== ' ') out.push(i);
    prev = name[i];
  }
  return out;
}
