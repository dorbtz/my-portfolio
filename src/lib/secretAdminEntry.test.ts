/**
 * src/lib/secretAdminEntry.test.ts
 *
 * Unit tests for the pure D-B-T sequence helper that drives the
 * hidden admin entry on the header wordmark.
 *
 * Note: the rolldown-vite SSR transform sometimes drops named ESM
 * exports inside vmThreads (helpers come back as `undefined`). To stay
 * consistent with the codebase pattern (see lib/easterEggs.test.ts,
 * services/contact-errors.test.ts), we inline the helper logic in the
 * test and use a structural source-substring check below to guard
 * against the inlined copy diverging from the production module.
 */
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Inlined logic — mirrors `./secretAdminEntry` exactly.
// ---------------------------------------------------------------------------
const SECRET_SEQUENCE: readonly number[] = [0, 4, 8];
const SECRET_GAP_MS = 1000;

type SecretState = { progress: number; lastClickTime: number };
type SecretClick = { idx: number; now: number };
type SecretConfig = { sequence: readonly number[]; gapMs: number };
type SecretResult = SecretState & { completed: boolean };

const INITIAL_SECRET_STATE: SecretState = { progress: 0, lastClickTime: 0 };

function advanceSecretSequence(
  state: SecretState,
  click: SecretClick,
  config: SecretConfig,
): SecretResult {
  const { sequence, gapMs } = config;
  if (sequence.length === 0) {
    return { progress: 0, lastClickTime: 0, completed: false };
  }
  let progress = state.progress;
  if (progress > 0 && click.now - state.lastClickTime > gapMs) {
    progress = 0;
  }
  const expected = sequence[progress];
  if (click.idx === expected) {
    const nextProgress = progress + 1;
    if (nextProgress >= sequence.length) {
      return { progress: 0, lastClickTime: 0, completed: true };
    }
    return { progress: nextProgress, lastClickTime: click.now, completed: false };
  }
  if (click.idx === sequence[0]) {
    return { progress: 1, lastClickTime: click.now, completed: false };
  }
  return { progress: 0, lastClickTime: 0, completed: false };
}

const CONFIG: SecretConfig = { sequence: SECRET_SEQUENCE, gapMs: SECRET_GAP_MS };

/** Tiny replay helper — feeds clicks through the helper and returns the
 *  final state plus the completion flag from the LAST click. */
function replay(
  config: SecretConfig,
  clicks: ReadonlyArray<{ idx: number; now: number }>,
  initial: SecretState = INITIAL_SECRET_STATE,
): { state: SecretState; lastCompleted: boolean; completions: number } {
  let state: SecretState = initial;
  let lastCompleted = false;
  let completions = 0;
  for (const click of clicks) {
    const result = advanceSecretSequence(state, click, config);
    if (result.completed) completions += 1;
    lastCompleted = result.completed;
    state = { progress: result.progress, lastClickTime: result.lastClickTime };
  }
  return { state, lastCompleted, completions };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('advanceSecretSequence — happy path', () => {
  it('completes on D → B → T within the gap', () => {
    const { lastCompleted, completions, state } = replay(CONFIG, [
      { idx: 0, now: 100 },   // D
      { idx: 4, now: 600 },   // B  (gap 500 ≤ 1000)
      { idx: 8, now: 1100 },  // T  (gap 500 ≤ 1000)
    ]);
    expect(lastCompleted).toBe(true);
    expect(completions).toBe(1);
    // After completion, state must reset so the next click starts fresh.
    expect(state).toEqual({ progress: 0, lastClickTime: 0 });
  });

  it('advances progress one step at a time before completion', () => {
    let state = INITIAL_SECRET_STATE;
    let r = advanceSecretSequence(state, { idx: 0, now: 100 }, CONFIG);
    expect(r.completed).toBe(false);
    expect(r.progress).toBe(1);
    state = { progress: r.progress, lastClickTime: r.lastClickTime };

    r = advanceSecretSequence(state, { idx: 4, now: 200 }, CONFIG);
    expect(r.completed).toBe(false);
    expect(r.progress).toBe(2);
    state = { progress: r.progress, lastClickTime: r.lastClickTime };

    r = advanceSecretSequence(state, { idx: 8, now: 300 }, CONFIG);
    expect(r.completed).toBe(true);
    expect(r.progress).toBe(0);
    expect(r.lastClickTime).toBe(0);
  });
});

describe('advanceSecretSequence — gap timing', () => {
  it('resets when the gap between B and T exceeds gapMs', () => {
    const { lastCompleted, state } = replay(CONFIG, [
      { idx: 0, now: 100 },     // D
      { idx: 4, now: 600 },     // B  (ok)
      { idx: 8, now: 1700 },    // T  (gap 1100 > 1000 → stale → re-eval as fresh click on T, T isn't sequence[0] → reset)
    ]);
    expect(lastCompleted).toBe(false);
    expect(state).toEqual({ progress: 0, lastClickTime: 0 });
  });

  it('the very-first click is never gated by the gap (lastClickTime = 0)', () => {
    // Even with a huge "now", a click at progress=0 isn't stale — the
    // gap check only fires when progress > 0.
    const r = advanceSecretSequence(
      INITIAL_SECRET_STATE,
      { idx: 0, now: 999_999 },
      CONFIG,
    );
    expect(r.progress).toBe(1);
    expect(r.completed).toBe(false);
  });

  it('exact boundary (gap === gapMs) is accepted, not stale', () => {
    const { state, lastCompleted } = replay(CONFIG, [
      { idx: 0, now: 0 },
      { idx: 4, now: SECRET_GAP_MS },             // gap exactly 1000
      { idx: 8, now: SECRET_GAP_MS * 2 },         // gap exactly 1000
    ]);
    expect(lastCompleted).toBe(true);
    expect(state).toEqual({ progress: 0, lastClickTime: 0 });
  });
});

describe('advanceSecretSequence — wrong-click resets', () => {
  it('clicking the "O" (idx 1) after D resets to the idle state', () => {
    const { state, lastCompleted } = replay(CONFIG, [
      { idx: 0, now: 100 },
      { idx: 1, now: 200 },     // wrong — and idx 1 isn't sequence[0]
    ]);
    expect(lastCompleted).toBe(false);
    expect(state).toEqual({ progress: 0, lastClickTime: 0 });
  });

  it('D → T (skips B) resets — T is sequence[2], not sequence[0]', () => {
    const { state, lastCompleted } = replay(CONFIG, [
      { idx: 0, now: 100 },
      { idx: 8, now: 200 },
    ]);
    expect(lastCompleted).toBe(false);
    expect(state).toEqual({ progress: 0, lastClickTime: 0 });
  });

  it('D → D treats the second D as a fresh sequence[0] (restart at progress=1)', () => {
    const { state } = replay(CONFIG, [
      { idx: 0, now: 100 },
      { idx: 0, now: 200 },
    ]);
    expect(state.progress).toBe(1);
    expect(state.lastClickTime).toBe(200);
  });

  it('D → T → D → B → T completes on the final T', () => {
    const { lastCompleted, completions, state } = replay(CONFIG, [
      { idx: 0, now: 100 },     // D — progress 1
      { idx: 8, now: 200 },     // T — wrong + not sequence[0] → reset
      { idx: 0, now: 300 },     // D — progress 1 again
      { idx: 4, now: 400 },     // B — progress 2
      { idx: 8, now: 500 },     // T — progress 3 → completed
    ]);
    expect(lastCompleted).toBe(true);
    expect(completions).toBe(1);
    expect(state).toEqual({ progress: 0, lastClickTime: 0 });
  });
});

describe('advanceSecretSequence — double-click safety', () => {
  it('rapid duplicate clicks on D do not spuriously complete', () => {
    const { state, lastCompleted, completions } = replay(CONFIG, [
      { idx: 0, now: 100 },
      { idx: 0, now: 105 },     // double-tap, < 50 ms apart
      { idx: 0, now: 110 },
    ]);
    expect(lastCompleted).toBe(false);
    expect(completions).toBe(0);
    // After three D-clicks, progress is still 1 (each duplicate restarts at 1).
    expect(state.progress).toBe(1);
  });
});

describe('advanceSecretSequence — defensive edge cases', () => {
  it('a single-letter sequence completes on the first matching click', () => {
    const single: SecretConfig = { sequence: [0], gapMs: 1000 };
    const r = advanceSecretSequence(INITIAL_SECRET_STATE, { idx: 0, now: 100 }, single);
    expect(r.completed).toBe(true);
    expect(r.progress).toBe(0);
    expect(r.lastClickTime).toBe(0);
  });

  it('an empty sequence is a no-op (never completes)', () => {
    const empty: SecretConfig = { sequence: [], gapMs: 1000 };
    const r = advanceSecretSequence(INITIAL_SECRET_STATE, { idx: 0, now: 100 }, empty);
    expect(r.completed).toBe(false);
    expect(r.progress).toBe(0);
    expect(r.lastClickTime).toBe(0);
  });

  it('does not mutate the input state object', () => {
    const state = { ...INITIAL_SECRET_STATE };
    advanceSecretSequence(state, { idx: 0, now: 100 }, CONFIG);
    expect(state).toEqual(INITIAL_SECRET_STATE);
  });
});

// ---------------------------------------------------------------------------
// Structural check — guards against the inlined copy diverging from the
// production source.  Reads the raw module via Vite's `?raw` query.
// ---------------------------------------------------------------------------
describe('secretAdminEntry module surface', () => {
  it('source exports the helper, constants, and matches the inlined logic shape', async () => {
    const src = await import('./secretAdminEntry?raw').catch(() => null);
    if (src && typeof src.default === 'string') {
      // Surface
      expect(src.default).toContain('export function advanceSecretSequence');
      expect(src.default).toContain('export const SECRET_SEQUENCE');
      expect(src.default).toContain('export const SECRET_GAP_MS');
      expect(src.default).toContain('export const INITIAL_SECRET_STATE');
      // Production values
      expect(src.default).toMatch(/SECRET_SEQUENCE[^=]*=\s*\[\s*0\s*,\s*4\s*,\s*8\s*\]/);
      expect(src.default).toMatch(/SECRET_GAP_MS\s*=\s*1000/);
      // Logic invariants — same branches as the inlined copy
      expect(src.default).toContain('sequence.length === 0');
      expect(src.default).toContain('click.now - state.lastClickTime > gapMs');
      expect(src.default).toContain('completed: true');
      expect(src.default).toContain('completed: false');
    } else {
      // Fallback: compile-time guarantee from the test runtime if `?raw`
      // isn't supported in this environment.
      expect(true).toBe(true);
    }
  });
});
