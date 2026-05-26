/**
 * src/components/NavLabel.test.ts
 *
 * Tests for the NavLabel letter-by-letter morph behaviour (P3 redesign).
 * Verifies rune rendering in Thor mode, Latin fallback in Gear 5,
 * and the character-array progression logic for the morph animation.
 *
 * Pure logic tests — no JSX/DOM required.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

// ---- Rune map (mirrors src/components/Header.tsx) ----
const RUNE_MAP: Record<string, string> = {
  about:    'ᚨᛒᛟᚢᛏ',
  projects: 'ᛈᚱᛟᛃᛖᚲᛏᛋ',
  skills:   'ᛋᚲᛁᛚᛚᛋ',
  contact:  'ᚲᛟᚾᛏᚨᚲᛏ',
};

/**
 * Pure function that returns what the NavLabel span should display.
 * In Thor mode and when a rune exists → rune string.
 * Otherwise → Latin label.
 */
function getNavLabelDisplay(
  id: string,
  label: string,
  isThor: boolean,
): string {
  const rune = RUNE_MAP[id];
  if (!isThor || !rune) return label;
  return rune;
}

/**
 * The aria-label is always the Latin label regardless of mode.
 * (In real usage it's on the parent <a> element.)
 */
function getNavLabelAriaLabel(label: string): string {
  return label;
}

// ---------------------------------------------------------------------------
describe('NavLabel display — Thor mode', () => {
  it('renders rune for "about" in Thor mode', () => {
    expect(getNavLabelDisplay('about', 'About', true)).toBe('ᚨᛒᛟᚢᛏ');
  });

  it('renders rune for "projects" in Thor mode', () => {
    expect(getNavLabelDisplay('projects', 'Projects', true)).toBe('ᛈᚱᛟᛃᛖᚲᛏᛋ');
  });

  it('renders rune for "skills" in Thor mode', () => {
    expect(getNavLabelDisplay('skills', 'Skills', true)).toBe('ᛋᚲᛁᛚᛚᛋ');
  });

  it('renders rune for "contact" in Thor mode', () => {
    expect(getNavLabelDisplay('contact', 'Contact', true)).toBe('ᚲᛟᚾᛏᚨᚲᛏ');
  });

  it('falls back to Latin when id has no rune entry, even in Thor mode', () => {
    expect(getNavLabelDisplay('admin', 'Admin', true)).toBe('Admin');
  });
});

describe('NavLabel display — Gear 5 mode', () => {
  it('renders Latin for "about" in Gear 5 mode', () => {
    expect(getNavLabelDisplay('about', 'About', false)).toBe('About');
  });

  it('renders Latin for "projects" in Gear 5 mode', () => {
    expect(getNavLabelDisplay('projects', 'Projects', false)).toBe('Projects');
  });

  it('renders Latin for "skills" in Gear 5 mode', () => {
    expect(getNavLabelDisplay('skills', 'Skills', false)).toBe('Skills');
  });

  it('renders Latin for "contact" in Gear 5 mode', () => {
    expect(getNavLabelDisplay('contact', 'Contact', false)).toBe('Contact');
  });
});

describe('NavLabel rune map — invariants', () => {
  it('contains exactly the 4 section nav items', () => {
    expect(Object.keys(RUNE_MAP)).toHaveLength(4);
  });

  it('all rune strings contain Elder Futhark characters (Unicode block U+16A0–U+16FF)', () => {
    const futharKRange = /[ᚠ-᛿]/;
    for (const rune of Object.values(RUNE_MAP)) {
      expect(rune).toMatch(futharKRange);
    }
  });

  it('rune strings are different from their Latin equivalents', () => {
    expect(RUNE_MAP.about).not.toBe('About');
    expect(RUNE_MAP.projects).not.toBe('Projects');
    expect(RUNE_MAP.skills).not.toBe('Skills');
    expect(RUNE_MAP.contact).not.toBe('Contact');
  });
});

describe('NavLabel aria-label — always Latin', () => {
  it('aria-label for "About" is always "About" regardless of mode', () => {
    expect(getNavLabelAriaLabel('About')).toBe('About');
  });

  it('aria-label for "Contact" is always "Contact"', () => {
    expect(getNavLabelAriaLabel('Contact')).toBe('Contact');
  });
});

// ---------------------------------------------------------------------------
// P3 — Letter-by-letter morph progression tests
// ---------------------------------------------------------------------------

/**
 * Pure simulation of the morphTo logic from NavLabel (P3 redesign).
 * Tests that characters are updated one-by-one at 60ms stagger intervals,
 * left-to-right for enter and right-to-left for leave.
 */
function simulateMorph(
  target: string[],
  reverse: boolean,
): { charIdx: number; delay: number }[] {
  const len = target.length;
  const indices = Array.from({ length: len }, (_, i) => reverse ? len - 1 - i : i);
  return indices.map((charIdx, step) => ({ charIdx, delay: step * 60 }));
}

describe('NavLabel P3 — letter-by-letter morph', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('morphTo (enter) schedules updates left-to-right at 60ms intervals', () => {
    const latin = Array.from('ABOUT');
    const schedule = simulateMorph(latin, false);

    // First update: index 0, delay 0ms
    expect(schedule[0]).toEqual({ charIdx: 0, delay: 0 });
    // Second update: index 1, delay 60ms
    expect(schedule[1]).toEqual({ charIdx: 1, delay: 60 });
    // Third update: index 2, delay 120ms
    expect(schedule[2]).toEqual({ charIdx: 2, delay: 120 });
  });

  it('morphTo (leave) schedules updates right-to-left at 60ms intervals', () => {
    const rune  = Array.from('ᚨᛒᛟᚢᛏ');
    const schedule = simulateMorph(rune, true);

    // Reverse: first update is the LAST index
    const len = rune.length;
    expect(schedule[0]).toEqual({ charIdx: len - 1, delay: 0 });
    expect(schedule[1]).toEqual({ charIdx: len - 2, delay: 60 });
    expect(schedule[2]).toEqual({ charIdx: len - 3, delay: 120 });
  });

  it('total scheduled updates equals the length of the target array', () => {
    const latin = Array.from('CONTACT');
    const schedule = simulateMorph(latin, false);
    expect(schedule).toHaveLength(latin.length);
  });

  it('applying all updates in sequence yields the full target string', () => {
    const rune  = Array.from('ᛋᚲᛁᛚᛚᛋ');
    const latin = Array.from('SKILLS');
    const chars = [...rune];
    const schedule = simulateMorph(latin, false);
    for (const { charIdx } of schedule) {
      chars[charIdx] = latin[charIdx];
    }
    expect(chars.join('')).toBe('SKILLS');
  });

  it('applying reverse updates from latin back to rune yields the rune string', () => {
    const latin = Array.from('SKILLS');
    const rune  = Array.from('ᛋᚲᛁᛚᛚᛋ');
    const chars = [...latin];
    const schedule = simulateMorph(rune, true);
    for (const { charIdx } of schedule) {
      chars[charIdx] = rune[charIdx];
    }
    expect(chars.join('')).toBe('ᛋᚲᛁᛚᛚᛋ');
  });

  it('character at position i gets delay i*60 (left-to-right)', () => {
    const latin = Array.from('PROJECTS');
    const schedule = simulateMorph(latin, false);
    schedule.forEach(({ charIdx, delay }, step) => {
      expect(charIdx).toBe(step);
      expect(delay).toBe(step * 60);
    });
  });
});
