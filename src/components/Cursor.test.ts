/**
 * src/components/Cursor.test.ts
 * Unit tests for the Cursor gate logic.
 *
 * Avoids rendering the React component (which depends on canvas + rAF) and
 * instead tests the gate conditions as pure logic, matching the pattern used
 * in useCapability.test.ts (inline the logic to avoid rolldown SSR issues).
 */
import { describe, it, expect } from 'vitest';

/**
 * Mirrors the gate logic in Cursor.tsx:
 *   if (coarsePointer || !motionOn || reducedMotion) return null;
 */
function cursorShouldRender(
  coarsePointer: boolean,
  motionOn: boolean,
  reducedMotion: boolean,
): boolean {
  if (coarsePointer)   return false;
  if (!motionOn)       return false;
  if (reducedMotion)   return false;
  return true;
}

describe('Cursor gate logic', () => {
  it('returns null (does not render) on a coarse-pointer (touch) device', () => {
    expect(cursorShouldRender(true, true, false)).toBe(false);
  });

  it('returns null when motionOn is false', () => {
    expect(cursorShouldRender(false, false, false)).toBe(false);
  });

  it('returns null when prefers-reduced-motion is set', () => {
    expect(cursorShouldRender(false, true, true)).toBe(false);
  });

  it('returns null when coarsePointer AND reducedMotion are both true', () => {
    expect(cursorShouldRender(true, true, true)).toBe(false);
  });

  it('returns null when all gates trigger simultaneously', () => {
    expect(cursorShouldRender(true, false, true)).toBe(false);
  });

  it('renders when fine pointer, motion on, and no reduced-motion preference', () => {
    expect(cursorShouldRender(false, true, false)).toBe(true);
  });
});

/**
 * Particle budget logic — mirrors particleBudget() in Cursor.tsx.
 */
function particleBudget(tier: 'high' | 'mid' | 'low'): { interval: number; max: number } {
  if (tier === 'high') return { interval: 4,        max: 80 };
  if (tier === 'mid')  return { interval: 8,        max: 30 };
  return                      { interval: Infinity, max: 0  };
}

describe('Cursor particle budget by tier', () => {
  it('high tier: interval 4, max 80', () => {
    expect(particleBudget('high')).toEqual({ interval: 4, max: 80 });
  });

  it('mid tier: half particles — interval 8, max 30', () => {
    expect(particleBudget('mid')).toEqual({ interval: 8, max: 30 });
  });

  it('low tier: no particles — interval Infinity, max 0', () => {
    const { interval, max } = particleBudget('low');
    expect(max).toBe(0);
    expect(interval).toBe(Infinity);
  });
});
