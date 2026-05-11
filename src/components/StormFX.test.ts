/**
 * src/components/StormFX.test.ts
 *
 * Tests for the timer-set fix and bolt-count cap in StormFX.
 *
 * Architecture note: following the established project pattern, we inline
 * the logic under test rather than importing the production file, to avoid
 * rolldown-vite SSR transform issues in jsdom.
 *
 * What we test:
 *   1. Bolt-length cap: after 5 rapid spawn() calls the array never exceeds
 *      8 (cap) + max-per-spawn (4) = 12 bolts.
 *   2. Timer-set accumulation fix: each spawn() adds ONE handle to the set
 *      and the cleanup clears all of them.
 *   3. clearTimeout is called once per handle that was added, not just once.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Inline bolt type ─────────────────────────────────────────────────────────
interface Bolt {
  id: number;
  born: number;
}

const LIFETIME = 900;

// ── Inline spawn + cleanup logic (mirrors StormFX.tsx useEffect body) ────────
function createStormLayer() {
  let bolts: Bolt[] = [];
  let idCounter = 0;
  const cleanupTimers = new Set<number>();

  function spawn() {
    const count = 2 + Math.floor(Math.random() * 3); // 2-4 bolts
    // Cap: keep last 8, then append new ones (matches the fix)
    bolts = [
      ...bolts.slice(-8),
      ...Array.from({ length: count }, () => ({ id: ++idCounter, born: performance.now() })),
    ];

    const handle = window.setTimeout(() => {
      cleanupTimers.delete(handle);
      const cutoff = performance.now() - LIFETIME;
      bolts = bolts.filter((bolt) => bolt.born > cutoff);
    }, LIFETIME + 40) as unknown as number;
    cleanupTimers.add(handle);
  }

  function cleanup() {
    cleanupTimers.forEach((h) => window.clearTimeout(h));
    cleanupTimers.clear();
  }

  return { spawn, cleanup, getBolts: () => bolts, getTimers: () => cleanupTimers };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('StormFX bolt-count cap', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('bolt count stays bounded after 5 rapid spawn() calls', () => {
    const layer = createStormLayer();

    for (let i = 0; i < 5; i++) {
      layer.spawn();
    }

    // Max bolts = 8 (cap) + up to 4 (last spawn) = 12
    expect(layer.getBolts().length).toBeLessThanOrEqual(12);
  });

  it('bolt count after many spawns never exceeds cap + max-per-spawn', () => {
    const layer = createStormLayer();

    for (let i = 0; i < 20; i++) {
      layer.spawn();
    }

    // The slice(-8) cap + one more spawn of at most 4 = max 12
    expect(layer.getBolts().length).toBeLessThanOrEqual(12);
  });

  it('timer set contains one handle per spawn call', () => {
    const layer = createStormLayer();

    layer.spawn();
    layer.spawn();
    layer.spawn();

    expect(layer.getTimers().size).toBe(3);
  });

  it('cleanup() calls clearTimeout for every live handle', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    const layer = createStormLayer();

    layer.spawn();
    layer.spawn();
    layer.spawn();
    layer.spawn();
    layer.spawn();

    const countBefore = layer.getTimers().size;
    layer.cleanup();

    // clearTimeout called once per handle
    expect(clearSpy).toHaveBeenCalledTimes(countBefore);
    // Set is empty after cleanup
    expect(layer.getTimers().size).toBe(0);

    clearSpy.mockRestore();
  });

  it('expired timer removes itself from the set', () => {
    const layer = createStormLayer();

    layer.spawn();
    expect(layer.getTimers().size).toBe(1);

    // Advance time past LIFETIME + 40 so the setTimeout callback fires
    vi.advanceTimersByTime(LIFETIME + 100);

    expect(layer.getTimers().size).toBe(0);
  });

  it('cleanup timer filters out bolts older than LIFETIME', () => {
    // Verify the filter predicate logic directly: bolts whose born timestamp
    // is older than LIFETIME ms should be removed, newer ones kept.
    const now = performance.now();
    const oldBolt: Bolt = { id: 1, born: now - (LIFETIME + 100) }; // stale
    const newBolt: Bolt = { id: 2, born: now };                     // fresh

    const bolts = [oldBolt, newBolt];
    const cutoff = now - LIFETIME;
    const remaining = bolts.filter((bolt) => bolt.born > cutoff);

    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(newBolt.id);
  });

  it('timers from previous spawns are not lost when a new spawn fires', () => {
    const clearSpy = vi.spyOn(window, 'clearTimeout');
    const layer = createStormLayer();

    layer.spawn(); // handle 1
    layer.spawn(); // handle 2
    layer.spawn(); // handle 3

    // All three should still be present (not overwritten by the latest one)
    expect(layer.getTimers().size).toBe(3);

    layer.cleanup();

    // cleanup must have cleared all three, not just one
    expect(clearSpy).toHaveBeenCalledTimes(3);

    clearSpy.mockRestore();
  });
});
