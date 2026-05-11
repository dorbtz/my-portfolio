/**
 * src/lib/secretAdminEntry.ts
 *
 * Round 63 — hidden admin entry-point.  Clicking specific letters of
 * the wordmark in the header (e.g. D → B → T for "DOR BEN TZUR",
 * each click within `SECRET_GAP_MS` of the previous) navigates to
 * /admin/login.
 *
 * This module contains ONLY the pure sequence-advancement helper +
 * the default config — no React, no DOM, no router.  The thin React
 * adapter lives in `src/components/Header.tsx`'s `LogoBlock`.  Lifting
 * the logic out as a pure function mirrors how `lib/easterEggs.ts`
 * keeps its trigger logic separate from input handling.
 *
 * Round 74: the default sequence is derived from
 * `PORTFOLIO.name` via `deriveSecretSequence` so the hidden admin
 * entry maps to *the forker's* word boundaries automatically. CMS
 * overrides (`useSiteContent('admin').secretSequence`) still win.
 */

import { PORTFOLIO, deriveSecretSequence } from './portfolioConfig';

/** Word-boundary indices of `PORTFOLIO.name` (e.g. "Dor Ben Tzur" -> [0,4,8]). */
export const SECRET_SEQUENCE: readonly number[] = deriveSecretSequence(
  PORTFOLIO.name.toUpperCase(),
);

/** Maximum gap, in ms, between consecutive sequence clicks. */
export const SECRET_GAP_MS = 1000;

export type SecretState = {
  /** Number of correct clicks so far (0 .. sequence.length). */
  progress: number;
  /** Timestamp (Date.now()) of the most recent accepted click. */
  lastClickTime: number;
};

export type SecretClick = {
  /** Index of the clicked letter within the wordmark. */
  idx: number;
  /** `Date.now()` at the click moment. */
  now: number;
};

export type SecretConfig = {
  sequence: readonly number[];
  gapMs: number;
};

export type SecretResult = SecretState & {
  /** True iff this click finished the full sequence. */
  completed: boolean;
};

/** Idle starting state.  Exported for tests + ref initialisation. */
export const INITIAL_SECRET_STATE: SecretState = { progress: 0, lastClickTime: 0 };

/**
 * Pure sequence-advancement function.  Strict-reset semantics:
 *   - Stale (gap > gapMs) → treat as fresh before evaluating.
 *   - Match → advance progress; if final → completed=true and reset.
 *   - Wrong click that happens to land on sequence[0] → restart at 1.
 *   - Anything else → reset to {0, 0}.
 *
 * Defensive: an empty `sequence` is a no-op (no completion possible);
 * a single-letter sequence completes on the first matching click.
 */
export function advanceSecretSequence(
  state: SecretState,
  click: SecretClick,
  config: SecretConfig,
): SecretResult {
  const { sequence, gapMs } = config;

  if (sequence.length === 0) {
    return { progress: 0, lastClickTime: 0, completed: false };
  }

  // Stale gap → reset before evaluating this click.
  let progress = state.progress;
  if (progress > 0 && click.now - state.lastClickTime > gapMs) {
    progress = 0;
  }

  const expected = sequence[progress];
  if (click.idx === expected) {
    const nextProgress = progress + 1;
    if (nextProgress >= sequence.length) {
      // Completed — reset state so the next click starts fresh.
      return { progress: 0, lastClickTime: 0, completed: true };
    }
    return { progress: nextProgress, lastClickTime: click.now, completed: false };
  }

  // Wrong click for current step.  If it happens to be sequence[0], treat
  // it as the start of a fresh attempt (handled at progress=0 too).
  if (click.idx === sequence[0]) {
    // For a single-letter sequence this branch already handled completion
    // above; here sequence.length >= 2 so we land at progress=1.
    return { progress: 1, lastClickTime: click.now, completed: false };
  }

  return { progress: 0, lastClickTime: 0, completed: false };
}
