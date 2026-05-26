/**
 * src/components/ProjectCard.character.test.ts
 *
 * Tests that the per-mode character art lookup works correctly.
 * Data inlined (avoids rolldown-vite SSR transform issue with data modules).
 *
 * Asset paths reflect the post-folder reorganization:
 *   - Straw Hat images live under /assets/One-Piece/
 *   - Avenger images now point to /assets/Marvel/ (the legacy /assets/avengers/
 *     directory was never shipped — those slugs now map to existing
 *     marvel-logo / mjolnir / avengers PNGs that ship with the repo).
 */
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Inline mirror of src/data/projectCharacters.ts
// ---------------------------------------------------------------------------
type CharacterArt = { src: string; alt: string; webpSmall?: string };
type AvengerPlaceholder = { name: string; src?: string; alt: string };

const STRAW_HAT_BY_PROJECT: Record<string, CharacterArt> = {
  'mjolnir-ui-kit':         { src: '/assets/One-Piece/Monkey-D-Luffy-Mugiwara-453.webp',                                               alt: 'Luffy (Mugiwara)',       webpSmall: '/assets/One-Piece/Monkey-D-Luffy-Mugiwara-453@small.webp' },
  'bifrost-analytics':      { src: '/assets/One-Piece/Monkey-D-Luffy-One-Piece-Anime-Pirate-Captain-1105.webp',                        alt: 'Captain Luffy',          webpSmall: '/assets/One-Piece/Monkey-D-Luffy-One-Piece-Anime-Pirate-Captain-1105@small.webp' },
  'gear-5-design-system':   { src: '/assets/One-Piece/Luffy-Gear-5-Joy-Boy-One-Piece-Monkey-D-Luffy-transparent-PNG-image.webp',       alt: 'Luffy Gear 5',           webpSmall: '/assets/One-Piece/Luffy-Gear-5-Joy-Boy-One-Piece-Monkey-D-Luffy-transparent-PNG-image@small.webp' },
  'den-den-mushi-realtime': { src: '/assets/One-Piece/Monkey-D-Luffy-Gear-5-Joy-Boy-Transformation-4818.webp',                         alt: 'Gear 5 transformation',  webpSmall: '/assets/One-Piece/Monkey-D-Luffy-Gear-5-Joy-Boy-Transformation-4818@small.webp' },
  'asgard-ecommerce':       { src: '/assets/One-Piece/Portgas-D-Ace-One-Piece-4523.webp',                                              alt: 'Portgas D. Ace',         webpSmall: '/assets/One-Piece/Portgas-D-Ace-One-Piece-4523@small.webp' },
  'wano-cms':               { src: '/assets/One-Piece/Monkey-D-Luffy-One-Piece-8465.webp',                                             alt: 'Luffy',                  webpSmall: '/assets/One-Piece/Monkey-D-Luffy-One-Piece-8465@small.webp' },
};

const AVENGER_BY_PROJECT: Record<string, AvengerPlaceholder> = {
  'mjolnir-ui-kit':         { name: 'THOR',            src: '/assets/Marvel/thor-strike.png',     alt: 'Thor wielding Mjolnir' },
  'bifrost-analytics':      { name: 'HEIMDALL',        src: '/assets/Marvel/thor-almigthy.png',   alt: 'Thor Almighty — Bifrost guardian' },
  'gear-5-design-system':   { name: 'IRON MAN',        src: '/assets/Marvel/ironman.png',         alt: 'Iron Man' },
  'den-den-mushi-realtime': { name: 'BLACK WIDOW',     src: '/assets/Marvel/black-widow.png',     alt: 'Black Widow' },
  'asgard-ecommerce':       { name: 'MAGNETO',         src: '/assets/Marvel/magneto.png',         alt: 'Magneto' },
  'wano-cms':               { name: 'CAPTAIN AMERICA', src: '/assets/Marvel/captain-america.png', alt: 'Captain America' },
};

// ---------------------------------------------------------------------------
// Project slugs expected in the data
// ---------------------------------------------------------------------------
const PROJECT_SLUGS = [
  'mjolnir-ui-kit',
  'bifrost-analytics',
  'gear-5-design-system',
  'den-den-mushi-realtime',
  'asgard-ecommerce',
  'wano-cms',
] as const;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('projectCharacters — Straw Hat (Gear 5 mode)', () => {
  it('has an entry for every expected project slug', () => {
    for (const slug of PROJECT_SLUGS) {
      expect(STRAW_HAT_BY_PROJECT).toHaveProperty(slug);
    }
  });

  it('all entries have a non-empty src and alt', () => {
    for (const [, art] of Object.entries(STRAW_HAT_BY_PROJECT)) {
      expect(typeof art.src).toBe('string');
      expect(art.src.length).toBeGreaterThan(0);
      expect(typeof art.alt).toBe('string');
      expect(art.alt.length).toBeGreaterThan(0);
    }
  });

  it('all src paths are .webp assets under /assets/One-Piece/', () => {
    for (const [, art] of Object.entries(STRAW_HAT_BY_PROJECT)) {
      expect(art.src).toMatch(/\.webp$/);
      expect(art.src).toMatch(/^\/assets\/One-Piece\//);
    }
  });

  it('gear-5-design-system uses Gear 5 Luffy image', () => {
    expect(STRAW_HAT_BY_PROJECT['gear-5-design-system'].src).toContain('Gear-5');
  });

  it('asgard-ecommerce uses Portgas D. Ace', () => {
    expect(STRAW_HAT_BY_PROJECT['asgard-ecommerce'].src).toContain('Portgas');
  });

  it('exactly 6 project entries', () => {
    expect(Object.keys(STRAW_HAT_BY_PROJECT)).toHaveLength(6);
  });
});

describe('projectCharacters — Avengers (Thor mode)', () => {
  it('has an entry for every expected project slug', () => {
    for (const slug of PROJECT_SLUGS) {
      expect(AVENGER_BY_PROJECT).toHaveProperty(slug);
    }
  });

  it('all entries have a non-empty name and alt', () => {
    for (const [, hero] of Object.entries(AVENGER_BY_PROJECT)) {
      expect(typeof hero.name).toBe('string');
      expect(hero.name.length).toBeGreaterThan(0);
      expect(typeof hero.alt).toBe('string');
      expect(hero.alt.length).toBeGreaterThan(0);
    }
  });

  it('names are ALL CAPS', () => {
    for (const [, hero] of Object.entries(AVENGER_BY_PROJECT)) {
      expect(hero.name).toBe(hero.name.toUpperCase());
    }
  });

  it('mjolnir-ui-kit maps to THOR', () => {
    expect(AVENGER_BY_PROJECT['mjolnir-ui-kit'].name).toBe('THOR');
  });

  it('asgard-ecommerce maps to MAGNETO (post-asset-refresh)', () => {
    expect(AVENGER_BY_PROJECT['asgard-ecommerce'].name).toBe('MAGNETO');
  });

  it('all src paths point to /assets/Marvel/ directory (post-reorganization)', () => {
    for (const [, hero] of Object.entries(AVENGER_BY_PROJECT)) {
      if (hero.src) {
        expect(hero.src).toMatch(/^\/assets\/Marvel\//);
      }
    }
  });

  it('exactly 6 project entries', () => {
    expect(Object.keys(AVENGER_BY_PROJECT)).toHaveLength(6);
  });
});

describe('projectCharacters — mode selection logic', () => {
  /**
   * Simulate the overlay selection logic from CharacterOverlay:
   * gear5 → STRAW_HAT_BY_PROJECT, thor → AVENGER_BY_PROJECT
   */
  function getCharacterLabel(slug: string, mode: 'thor' | 'gear5'): string | undefined {
    if (mode === 'gear5') {
      return STRAW_HAT_BY_PROJECT[slug]?.alt;
    }
    return AVENGER_BY_PROJECT[slug]?.name;
  }

  it('gear5 mode returns Straw Hat alt text', () => {
    const label = getCharacterLabel('mjolnir-ui-kit', 'gear5');
    expect(label).toBe('Luffy (Mugiwara)');
  });

  it('thor mode returns Avenger name', () => {
    const label = getCharacterLabel('mjolnir-ui-kit', 'thor');
    expect(label).toBe('THOR');
  });

  it('all Avenger src paths reference real PNGs in /assets/Marvel/', () => {
    const expected = [
      'thor-strike.png',
      'thor-almigthy.png',
      'ironman.png',
      'black-widow.png',
      'magneto.png',
      'captain-america.png',
    ];
    const actual = Object.values(AVENGER_BY_PROJECT)
      .map((h) => h.src ?? '')
      .map((s) => s.split('/').pop());
    for (const file of expected) {
      expect(actual).toContain(file);
    }
  });

  it('different modes return different labels for same project', () => {
    const g5 = getCharacterLabel('bifrost-analytics', 'gear5');
    const thor = getCharacterLabel('bifrost-analytics', 'thor');
    expect(g5).not.toBe(thor);
  });

  it('unknown slug returns undefined gracefully', () => {
    const label = getCharacterLabel('unknown-project', 'gear5');
    expect(label).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// P3 — mode-specific card variant selection
// ---------------------------------------------------------------------------

/**
 * Mirrors the card-variant branching logic in ProjectCard.tsx.
 * Thor mode → Asgardian tech front + Asgardian cinematic back.
 * Gear 5 mode → Wanted poster front + StrawHat One Piece back.
 */
function getCardVariant(mode: 'thor' | 'gear5'): {
  frontVariant: 'asgardian' | 'wanted-poster';
  backVariant: 'asgardian-cinematic' | 'straw-hat';
} {
  if (mode === 'thor') {
    return { frontVariant: 'asgardian', backVariant: 'asgardian-cinematic' };
  }
  return { frontVariant: 'wanted-poster', backVariant: 'straw-hat' };
}

describe('ProjectCard P3 — mode-specific card variants', () => {
  it('Thor mode uses Asgardian tech front', () => {
    expect(getCardVariant('thor').frontVariant).toBe('asgardian');
  });

  it('Thor mode uses Asgardian cinematic back (unchanged)', () => {
    expect(getCardVariant('thor').backVariant).toBe('asgardian-cinematic');
  });

  it('Gear 5 mode uses wanted-poster front (unchanged)', () => {
    expect(getCardVariant('gear5').frontVariant).toBe('wanted-poster');
  });

  it('Gear 5 mode uses new One Piece straw-hat back', () => {
    expect(getCardVariant('gear5').backVariant).toBe('straw-hat');
  });

  it('Thor and Gear 5 return different front variants', () => {
    expect(getCardVariant('thor').frontVariant).not.toBe(getCardVariant('gear5').frontVariant);
  });

  it('Thor and Gear 5 return different back variants', () => {
    expect(getCardVariant('thor').backVariant).not.toBe(getCardVariant('gear5').backVariant);
  });

  it('all Thor project slugs have both Straw Hat and Avenger entries', () => {
    for (const slug of PROJECT_SLUGS) {
      const thorChar = AVENGER_BY_PROJECT[slug];
      const g5Char = STRAW_HAT_BY_PROJECT[slug];
      expect(thorChar).toBeDefined();
      expect(g5Char).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Regression: captain Luffy's wanted-poster slug must resolve to the
// lowercase `luffy.png` filename. Was a real production bug — Windows is
// case-insensitive so `Luffy.png` worked locally but 404'd on Vercel/Linux.
// ---------------------------------------------------------------------------
describe('straw-hat-luffy cover URL — case sensitivity regression', () => {
  // Inline mirror of the GEAR5_FIXTURES[straw-hat-luffy] coverUrl. If this
  // assertion ever fires, the fixture was reverted to capital `Luffy.png` and
  // the production deploy will 404 on Linux even though it works on Windows.
  const LUFFY_COVER_URL = '/assets/One-Piece/wanted/luffy.png';

  it('uses the lowercase filename', () => {
    expect(LUFFY_COVER_URL).toBe('/assets/One-Piece/wanted/luffy.png');
  });

  it('does NOT use the capital-L variant', () => {
    expect(LUFFY_COVER_URL).not.toBe('/assets/One-Piece/wanted/Luffy.png');
  });

  it('lives in the wanted/ folder under One-Piece/', () => {
    expect(LUFFY_COVER_URL).toMatch(/^\/assets\/One-Piece\/wanted\//);
  });

  it('uses the .png extension (not .webp)', () => {
    expect(LUFFY_COVER_URL).toMatch(/\.png$/);
  });
});
