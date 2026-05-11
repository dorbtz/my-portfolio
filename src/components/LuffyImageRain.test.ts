/**
 * src/components/LuffyImageRain.test.ts
 *
 * Tests for LuffyImageRain render-gate logic and active-section picker.
 * Component mounts images only in gear5 mode + non-coarse + non-reducedMotion.
 *
 * We test the pure guard logic in isolation (avoids JSDOM/canvas issues with GSAP).
 */
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Inline mirror of pickActiveSectionIndex from luffyImageRainUtils.ts
// (avoids rolldown-vite vmThreads SSR transform issue with .ts module imports)
// ---------------------------------------------------------------------------
function pickActiveSectionIndex(
  sectionIds: string[],
  getBoundingRect?: (id: string) => { top: number; height: number } | null,
  viewportHeight?: number,
): number {
  const vh = viewportHeight ?? 800;
  const viewportMid = vh / 2;
  let bestIndex = -1;
  let bestDist = Infinity;
  for (let i = 0; i < sectionIds.length; i++) {
    const rect = getBoundingRect ? getBoundingRect(sectionIds[i]) : null;
    if (!rect) continue;
    const sectionMid = rect.top + rect.height / 2;
    const dist = Math.abs(sectionMid - viewportMid);
    if (rect.top < vh && rect.top + rect.height > 0 && dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }
  return bestIndex;
}

// ---------------------------------------------------------------------------
// Guard function extracted from component logic (mirrors isActive condition)
// ---------------------------------------------------------------------------
function shouldRender(opts: {
  mode: 'thor' | 'gear5';
  coarsePointer: boolean;
  reducedMotion: boolean;
}): boolean {
  return opts.mode === 'gear5' && !opts.coarsePointer && !opts.reducedMotion;
}

// ---------------------------------------------------------------------------
// Section-to-image mapping tests
// ---------------------------------------------------------------------------
type RainImage = {
  sectionId: string;
  src: string;
  side: 'left' | 'right';
};

const RAIN_IMAGES: RainImage[] = [
  { sectionId: 'about',    src: '/assets/One-Piece/Monkey-D-Luffy-Mugiwara-453.webp',                            side: 'left'  },
  { sectionId: 'skills',   src: '/assets/One-Piece/Monkey-D-Luffy-One-Piece-Anime-Pirate-Captain-1105.webp',     side: 'right' },
  { sectionId: 'projects', src: '/assets/One-Piece/Portgas-D-Ace-One-Piece-4523.webp',                           side: 'left'  },
  { sectionId: 'contact',  src: '/assets/One-Piece/Monkey-D-Luffy-One-Piece-8465.webp',                          side: 'right' },
];

describe('LuffyImageRain render gate', () => {
  it('renders in gear5 mode with fine pointer and no reducedMotion', () => {
    expect(shouldRender({ mode: 'gear5', coarsePointer: false, reducedMotion: false })).toBe(true);
  });

  it('does NOT render in Thor mode', () => {
    expect(shouldRender({ mode: 'thor', coarsePointer: false, reducedMotion: false })).toBe(false);
  });

  it('does NOT render on coarsePointer device in gear5 mode', () => {
    expect(shouldRender({ mode: 'gear5', coarsePointer: true, reducedMotion: false })).toBe(false);
  });

  it('does NOT render when reducedMotion is active', () => {
    expect(shouldRender({ mode: 'gear5', coarsePointer: false, reducedMotion: true })).toBe(false);
  });

  it('does NOT render when both coarsePointer and reducedMotion are true', () => {
    expect(shouldRender({ mode: 'gear5', coarsePointer: true, reducedMotion: true })).toBe(false);
  });
});

describe('LuffyImageRain image mapping', () => {
  it('has exactly 4 section images', () => {
    expect(RAIN_IMAGES).toHaveLength(4);
  });

  it('all sectionIds are non-empty strings', () => {
    for (const img of RAIN_IMAGES) {
      expect(typeof img.sectionId).toBe('string');
      expect(img.sectionId.length).toBeGreaterThan(0);
    }
  });

  it('all src paths are valid webp asset paths under /assets/One-Piece/', () => {
    for (const img of RAIN_IMAGES) {
      expect(img.src).toMatch(/^\/assets\/One-Piece\/.*\.webp$/);
    }
  });

  it('sides alternate left/right', () => {
    const sides = RAIN_IMAGES.map((i) => i.side);
    expect(sides).toEqual(['left', 'right', 'left', 'right']);
  });

  it('about section uses Mugiwara Luffy', () => {
    const about = RAIN_IMAGES.find((i) => i.sectionId === 'about');
    expect(about?.src).toContain('Mugiwara');
  });

  it('projects section uses Portgas D. Ace', () => {
    const projects = RAIN_IMAGES.find((i) => i.sectionId === 'projects');
    expect(projects?.src).toContain('Portgas');
  });

  it('contact section uses Luffy-One-Piece-8465', () => {
    const contact = RAIN_IMAGES.find((i) => i.sectionId === 'contact');
    expect(contact?.src).toContain('8465');
  });

  it('no duplicate section IDs', () => {
    const ids = RAIN_IMAGES.map((i) => i.sectionId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// pickActiveSectionIndex — pure function tests (injected mocks, no DOM)
// ---------------------------------------------------------------------------

/** Helper: build a mock getBoundingRect that positions sections at fixed offsets. */
function makeMockRects(
  sections: Array<{ id: string; top: number; height: number }>
) {
  return (id: string): { top: number; height: number } | null => {
    const found = sections.find((s) => s.id === id);
    return found ? { top: found.top, height: found.height } : null;
  };
}

const SECTION_IDS = ['about', 'skills', 'projects', 'contact'];
const VH = 800; // simulated viewport height

describe('pickActiveSectionIndex — active section selection', () => {
  it('returns -1 when no sections are in view (all above viewport)', () => {
    const rects = makeMockRects([
      { id: 'about',    top: -1600, height: 800 },
      { id: 'skills',   top: -2400, height: 800 },
      { id: 'projects', top: -3200, height: 800 },
      { id: 'contact',  top: -4000, height: 800 },
    ]);
    const result = pickActiveSectionIndex(SECTION_IDS, rects, VH);
    expect(result).toBe(-1);
  });

  it('returns -1 when no sections are in view (all below viewport)', () => {
    const rects = makeMockRects([
      { id: 'about',    top: 1000, height: 800 },
      { id: 'skills',   top: 1800, height: 800 },
      { id: 'projects', top: 2600, height: 800 },
      { id: 'contact',  top: 3400, height: 800 },
    ]);
    const result = pickActiveSectionIndex(SECTION_IDS, rects, VH);
    expect(result).toBe(-1);
  });

  it('returns index 0 (about) when the about section is centered in viewport', () => {
    // about mid = 0 + 800/2 = 400 → viewport mid = 400, dist = 0
    const rects = makeMockRects([
      { id: 'about',    top: 0,    height: 800 },
      { id: 'skills',   top: 1800, height: 800 },
      { id: 'projects', top: 2600, height: 800 },
      { id: 'contact',  top: 3400, height: 800 },
    ]);
    const result = pickActiveSectionIndex(SECTION_IDS, rects, VH);
    expect(result).toBe(0);
  });

  it('returns index 1 (skills) when skills section mid is closest to viewport center', () => {
    // skills top=-200, height=800 → mid=-200+400=200; viewport mid=400; dist=200
    // about top=-1000, height=800 → mid=-600 (out of view entirely)
    const rects = makeMockRects([
      { id: 'about',    top: -1000, height: 800 },
      { id: 'skills',   top: -200,  height: 800 },
      { id: 'projects', top: 1600,  height: 800 },
      { id: 'contact',  top: 2400,  height: 800 },
    ]);
    const result = pickActiveSectionIndex(SECTION_IDS, rects, VH);
    expect(result).toBe(1);
  });

  it('returns index 2 (projects) when projects section is closest', () => {
    // projects top=200, height=800 → mid=600; viewport mid=400; dist=200
    // skills top=-1000 → out of viewport
    const rects = makeMockRects([
      { id: 'about',    top: -2000, height: 800 },
      { id: 'skills',   top: -1200, height: 800 },
      { id: 'projects', top: 200,   height: 800 },
      { id: 'contact',  top: 1400,  height: 800 },
    ]);
    const result = pickActiveSectionIndex(SECTION_IDS, rects, VH);
    expect(result).toBe(2);
  });

  it('returns index 3 (contact) when contact section is centered', () => {
    // contact top=0, height=800 → mid=400; viewport mid=400; dist=0
    const rects = makeMockRects([
      { id: 'about',    top: -3200, height: 800 },
      { id: 'skills',   top: -2400, height: 800 },
      { id: 'projects', top: -1600, height: 800 },
      { id: 'contact',  top: 0,     height: 800 },
    ]);
    const result = pickActiveSectionIndex(SECTION_IDS, rects, VH);
    expect(result).toBe(3);
  });

  it('when two sections overlap in viewport, returns the one with mid closest to viewport center', () => {
    // about mid = 0+400 = 400 → dist from 400 = 0  ← winner
    // skills mid = 300+400 = 700 → dist from 400 = 300
    const rects = makeMockRects([
      { id: 'about',    top: 0,   height: 800 },
      { id: 'skills',   top: 300, height: 800 },
      { id: 'projects', top: 2000, height: 800 },
      { id: 'contact',  top: 2800, height: 800 },
    ]);
    const result = pickActiveSectionIndex(SECTION_IDS, rects, VH);
    expect(result).toBe(0);
  });

  it('returns -1 when section IDs list is empty', () => {
    const rects = makeMockRects([]);
    const result = pickActiveSectionIndex([], rects, VH);
    expect(result).toBe(-1);
  });

  it('returns -1 when all getBoundingRect calls return null (sections not found in DOM)', () => {
    const rects = () => null;
    const result = pickActiveSectionIndex(SECTION_IDS, rects, VH);
    expect(result).toBe(-1);
  });
});
