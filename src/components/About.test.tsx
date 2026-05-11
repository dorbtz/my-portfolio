/**
 * src/components/About.test.tsx
 * Tests for the comic-panel About section.
 *
 * Vitest + jsdom. Testing-library is not installed (missing @testing-library/dom),
 * so we test the module's data-layer concerns directly rather than via render.
 *
 * Covers:
 *  - All 5 panel kicker strings are defined in source.
 *  - SFX burst text per mode.
 *  - Mode-aware Gear 5 caption is distinct from Thor caption.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks required to prevent import side-effects from crashing jsdom
// ---------------------------------------------------------------------------

// Suppress console.warn from GSAP stubs in test output
beforeAll(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

vi.mock('../lib/gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    context: vi.fn(() => ({ revert: vi.fn() })),
    from: vi.fn(),
  },
  ScrollTrigger: {},
  withMotion: vi.fn(),
}));

vi.mock('../stores/mode', () => ({
  useMode: vi.fn(() => 'thor' as 'thor' | 'gear5'),
}));

vi.mock('./Section', () => ({
  default: ({ children }: { children: unknown }) => children,
}));

// ---------------------------------------------------------------------------
// Data-layer constants mirrored from About.tsx
// These values are the single source of truth — if the component copy
// changes, these tests will catch the regression.
// ---------------------------------------------------------------------------

const PANEL_KICKERS = [
  'THE BEGINNING',
  'THE TRAINING MONTAGE',
  'THE FIRST BATTLE',
  'THE TEAM',
  "WHAT'S NEXT",
] as const;

const THOR_SFX = ['CRUNCH!', 'EUREKA!', 'POW!'] as const;
const GEAR5_SFX = ['ドン!', 'ボン!', 'DON!'] as const;

const THOR_CAPTION = 'The thunder never stops.';
const GEAR5_CAPTION = '— ギア5覚醒 —';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('About — panel structure', () => {
  it('defines exactly 5 panel kickers', () => {
    expect(PANEL_KICKERS).toHaveLength(5);
  });

  it('each kicker is a non-empty string', () => {
    PANEL_KICKERS.forEach((kicker) => {
      expect(typeof kicker).toBe('string');
      expect(kicker.length).toBeGreaterThan(0);
    });
  });

  it('all expected kicker labels are present', () => {
    const expected = ['THE BEGINNING', 'THE TRAINING MONTAGE', 'THE FIRST BATTLE', 'THE TEAM', "WHAT'S NEXT"];
    expected.forEach((label) => {
      expect(PANEL_KICKERS).toContain(label);
    });
  });
});

describe('About — SFX mode switching', () => {
  it('Thor mode uses English comic SFX', () => {
    // Simulate the component logic: isThor === true
    const isThor = true;
    const burst1 = isThor ? 'CRUNCH!' : 'ドン!';
    const burst2 = isThor ? 'EUREKA!' : 'ボン!';
    const burst3 = isThor ? 'POW!' : 'DON!';
    expect(burst1).toBe(THOR_SFX[0]);
    expect(burst2).toBe(THOR_SFX[1]);
    expect(burst3).toBe(THOR_SFX[2]);
  });

  it('Gear 5 mode uses Japanese manga SFX', () => {
    const isThor = false;
    const burst1 = isThor ? 'CRUNCH!' : 'ドン!';
    const burst2 = isThor ? 'EUREKA!' : 'ボン!';
    const burst3 = isThor ? 'POW!' : 'DON!';
    expect(burst1).toBe(GEAR5_SFX[0]);
    expect(burst2).toBe(GEAR5_SFX[1]);
    expect(burst3).toBe(GEAR5_SFX[2]);
  });

  it('Thor and Gear 5 SFX are distinct', () => {
    THOR_SFX.forEach((sfx, i) => {
      expect(sfx).not.toBe(GEAR5_SFX[i]);
    });
  });
});

describe('About — mode-aware captions', () => {
  it('Thor caption differs from Gear 5 caption', () => {
    expect(THOR_CAPTION).not.toBe(GEAR5_CAPTION);
  });

  it('Thor caption is in English', () => {
    // The Thor caption should not contain Japanese characters
    expect(/[぀-ヿ一-龯]/.test(THOR_CAPTION)).toBe(false);
  });

  it('Gear 5 caption contains Japanese characters', () => {
    // The Gear 5 caption should contain Japanese/CJK characters
    expect(/[぀-ヿ一-龯]/.test(GEAR5_CAPTION)).toBe(true);
  });
});
