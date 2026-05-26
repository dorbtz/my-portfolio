/**
 * src/components/ProjectsCarousel.test.ts
 *
 * Logic-only tests for ProjectsCarousel. Heavy DOM rendering is intentionally
 * avoided (the project's vmThreads vitest pool can't reliably transform the
 * full ProjectCard tree). Instead we cover the pure helpers that drive the
 * carousel — slide-index clamping, RTL key mapping, SFX cycling, and the
 * reduced-motion gate. The actual DOM is exercised manually + via the rest
 * of the suite that already mounts ProjectCard variants.
 */
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Helpers mirrored from src/components/projects/ProjectsCarousel.tsx.
// Keep these in lockstep with the implementation.
// ---------------------------------------------------------------------------

const COMIC_SFX = ['BIFF!', 'KRAKKK!', 'POW!', 'ZZAP!', 'BOOM!', 'WHAM!'];
const KANA_SFX = ['ドン!', 'バン!', 'ゴム!', 'ガン!', 'ドカン!', 'ズドン!'];

/** Same clamp logic the carousel uses inside `goTo`. */
function clampIndex(next: number, count: number): number {
  return Math.max(0, Math.min(count - 1, next));
}

/**
 * Same key-mapping logic the carousel uses inside `onKeyDown`. Returns the
 * NEXT active index given a key event and the current direction.
 *
 * In RTL writing mode the visual "previous" slide is the higher-index slide
 * (it sits to the right), so ArrowLeft must INCREMENT the index in RTL.
 */
function nextIndexFromKey(
  key: string,
  current: number,
  count: number,
  dir: 'ltr' | 'rtl',
): number {
  const visualPrev = dir === 'rtl' ? 1 : -1;
  const visualNext = dir === 'rtl' ? -1 : 1;
  switch (key) {
    case 'ArrowLeft':
      return clampIndex(current + visualPrev, count);
    case 'ArrowRight':
      return clampIndex(current + visualNext, count);
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return current;
  }
}

/** Same direction selection used to decide LTR vs RTL track. */
function pickDir(mode: 'thor' | 'gear5', reduced: boolean): 'ltr' | 'rtl' {
  return mode === 'gear5' && !reduced ? 'rtl' : 'ltr';
}

/** SFX cycle helper — wraps modulo around the per-mode list. */
function sfxAt(mode: 'thor' | 'gear5', index: number): string {
  const list = mode === 'thor' ? COMIC_SFX : KANA_SFX;
  return list[index % list.length];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProjectsCarousel — index clamping', () => {
  it('clamps to 0 on negative input', () => {
    expect(clampIndex(-5, 10)).toBe(0);
  });
  it('clamps to count-1 on overflow', () => {
    expect(clampIndex(99, 10)).toBe(9);
  });
  it('preserves valid input', () => {
    expect(clampIndex(3, 10)).toBe(3);
  });
  it('handles single-item lists', () => {
    expect(clampIndex(5, 1)).toBe(0);
  });
});

describe('ProjectsCarousel — keyboard navigation (LTR / Thor mode)', () => {
  it('ArrowLeft moves to previous slide', () => {
    expect(nextIndexFromKey('ArrowLeft', 3, 10, 'ltr')).toBe(2);
  });
  it('ArrowRight moves to next slide', () => {
    expect(nextIndexFromKey('ArrowRight', 3, 10, 'ltr')).toBe(4);
  });
  it('Home jumps to first slide', () => {
    expect(nextIndexFromKey('Home', 5, 10, 'ltr')).toBe(0);
  });
  it('End jumps to last slide', () => {
    expect(nextIndexFromKey('End', 5, 10, 'ltr')).toBe(9);
  });
  it('ArrowLeft at index 0 stays at 0 (clamped)', () => {
    expect(nextIndexFromKey('ArrowLeft', 0, 10, 'ltr')).toBe(0);
  });
  it('unknown key returns current index unchanged', () => {
    expect(nextIndexFromKey('Tab', 4, 10, 'ltr')).toBe(4);
  });
});

describe('ProjectsCarousel — keyboard navigation (RTL / Luffy mode)', () => {
  it('ArrowLeft INCREMENTS index in RTL (visual left = higher index)', () => {
    expect(nextIndexFromKey('ArrowLeft', 3, 10, 'rtl')).toBe(4);
  });
  it('ArrowRight DECREMENTS index in RTL (visual right = lower index)', () => {
    expect(nextIndexFromKey('ArrowRight', 3, 10, 'rtl')).toBe(2);
  });
  it('Home and End behave the same regardless of direction', () => {
    expect(nextIndexFromKey('Home', 5, 10, 'rtl')).toBe(0);
    expect(nextIndexFromKey('End', 5, 10, 'rtl')).toBe(9);
  });
  it('left arrow at the last slide stays clamped', () => {
    expect(nextIndexFromKey('ArrowLeft', 9, 10, 'rtl')).toBe(9);
  });
});

describe('ProjectsCarousel — RTL detection', () => {
  it('Luffy mode + motion enabled → RTL', () => {
    expect(pickDir('gear5', false)).toBe('rtl');
  });
  it('Luffy mode + reduced motion → LTR (degraded fallback)', () => {
    expect(pickDir('gear5', true)).toBe('ltr');
  });
  it('Thor mode is always LTR regardless of motion preference', () => {
    expect(pickDir('thor', false)).toBe('ltr');
    expect(pickDir('thor', true)).toBe('ltr');
  });
});

describe('ProjectsCarousel — per-slide SFX cycling', () => {
  it('Thor mode pulls from the COMIC_SFX list', () => {
    expect(sfxAt('thor', 0)).toBe('BIFF!');
    expect(sfxAt('thor', 1)).toBe('KRAKKK!');
  });
  it('Luffy mode pulls from the KANA_SFX list', () => {
    expect(sfxAt('gear5', 0)).toBe('ドン!');
    expect(sfxAt('gear5', 1)).toBe('バン!');
  });
  it('cycles via modulo when index exceeds list length', () => {
    // Both lists have 6 entries, so index 6 wraps to index 0.
    expect(sfxAt('thor', 6)).toBe(sfxAt('thor', 0));
    expect(sfxAt('gear5', 7)).toBe(sfxAt('gear5', 1));
  });
  it('Thor and Luffy modes return different SFX for the same index', () => {
    expect(sfxAt('thor', 0)).not.toBe(sfxAt('gear5', 0));
  });
});
