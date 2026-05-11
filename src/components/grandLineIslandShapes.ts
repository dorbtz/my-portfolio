/**
 * src/components/grandLineIslandShapes.ts
 *
 * Hand-authored stylized silhouette path data for each Grand Line island.
 * Each path is drawn in a 100×100 local coordinate system so it composes
 * cleanly with <svg viewBox="0 0 100 100">. Shapes are recognizable canon
 * silhouettes, NOT pixel-traced — Drum has two snowy peaks, Skypiea is a
 * cloud, Wano is hook-shaped, Whole Cake is a fluted cake-circle, Punk
 * Hazard splits fire/ice, Dressrosa is a flower-spiral, etc.
 *
 * Each shape is then used as both a <clipPath> for the island image AND
 * as the visible outline stroke (vector-effect: non-scaling-stroke) so
 * the silhouette reads at any zoom.
 *
 * SECURITY NOTE — Round 25 (Phase 4):
 * The `overlay` property is raw SVG markup rendered via React's
 * `dangerouslySetInnerHTML`.  These overlay strings are AUTHOR-CONTROLLED
 * in this codebase (hand-written below, not user-supplied).  NEVER pipe
 * user-supplied SVG through this property — that would create an XSS
 * vector.  If a future feature needs dynamic overlays, sanitize through
 * DOMPurify (or equivalent) before assignment.
 */

export type IslandShapeDef = {
  /** kebab-case slug matching public/assets/One-Piece/islands/<slug>.webp */
  slug: string;
  /** SVG path data describing a stylized canon silhouette in 100x100 box */
  pathD: string;
  /** Render size on the map (% of canvas width). */
  sizePct: number;
  /**
   * Optional thematic SVG overlay rendered on top of the photo, INSIDE the
   * silhouette clip-path.  Drawn in the 100x100 local SVG box.  Use for
   * canon landmarks: cactus, volcano, castle, fortress, etc.  See SECURITY
   * NOTE in the file header.
   */
  overlay?: string;
};

export const ISLAND_SHAPES: Record<string, IslandShapeDef> = {
  // Dawn Island — Foosha Village hill + Mt. Colubo bump on the right.
  'dawn-island': {
    slug: 'dawn-island',
    sizePct: 4.4,
    pathD: 'M 12 70 Q 20 40 38 38 Q 50 22 60 38 Q 78 28 86 60 Q 92 78 78 84 Q 50 92 22 84 Q 8 78 12 70 Z',
  },
  // Whiskey Peak — twin cactus spires (Baroque Works waystation).
  'whiskey-peak': {
    slug: 'whiskey-peak',
    sizePct: 3.8,
    pathD: 'M 18 84 L 22 32 Q 24 18 30 18 Q 36 18 38 32 L 42 60 L 58 60 L 62 32 Q 64 18 70 18 Q 76 18 78 32 L 82 84 Q 50 92 18 84 Z',
    // 3 cactus columns (vertical green with horizontal arms).
    overlay:
      '<g fill="#2d6e3a" stroke="#1a4521" stroke-width="0.6" stroke-linejoin="round" opacity="0.92">' +
      '<path d="M 22 78 L 22 38 Q 22 32 26 32 Q 30 32 30 38 L 30 50 L 36 50 L 36 56 L 30 56 L 30 78 Z" />' +
      '<path d="M 46 80 L 46 30 Q 46 22 52 22 Q 58 22 58 30 L 58 44 L 64 44 L 64 50 L 58 50 L 58 80 Z" />' +
      '<path d="M 70 78 L 70 36 Q 70 30 74 30 Q 78 30 78 36 L 78 78 Z" />' +
      '</g>',
  },
  // Little Garden — primeval jungle blob with Rex skull bump.
  'little-garden': {
    slug: 'little-garden',
    sizePct: 4.4,
    pathD: 'M 10 64 Q 14 38 30 32 Q 40 18 52 26 Q 64 16 76 28 Q 92 36 90 60 Q 94 80 78 86 Q 50 94 22 86 Q 6 80 10 64 Z',
    // Volcano cone + skeleton bone arch in foreground.
    overlay:
      '<g opacity="0.9">' +
      '<path d="M 28 78 L 50 32 L 72 78 Z" fill="#5a3a25" stroke="#2d1c10" stroke-width="0.8" />' +
      '<path d="M 42 38 Q 50 26 58 38 L 56 44 L 50 38 L 44 44 Z" fill="#e25c2c" opacity="0.85" />' +
      '<path d="M 18 80 Q 18 70 26 70 Q 34 70 34 80" fill="none" stroke="#f0e6d4" stroke-width="2.5" stroke-linecap="round" />' +
      '<circle cx="20" cy="78" r="2.4" fill="#f0e6d4" />' +
      '<circle cx="32" cy="78" r="2.4" fill="#f0e6d4" />' +
      '</g>',
  },
  // Drum Island — twin snowy peaks (Drum Castle silhouette).
  'drum-island': {
    slug: 'drum-island',
    sizePct: 3.8,
    pathD: 'M 10 86 L 22 50 L 32 28 L 42 56 L 50 38 L 58 56 L 68 28 L 78 50 L 90 86 Q 50 94 10 86 Z',
    // Snow-capped castle on a cliff: tall narrow rectangle with crenelations + white snow triangle.
    overlay:
      '<g opacity="0.95">' +
      '<rect x="38" y="50" width="24" height="34" fill="#3a2d20" stroke="#1a1008" stroke-width="0.6" />' +
      '<rect x="38" y="50" width="4" height="6" fill="#3a2d20" />' +
      '<rect x="46" y="50" width="4" height="6" fill="#3a2d20" />' +
      '<rect x="54" y="50" width="4" height="6" fill="#3a2d20" />' +
      '<rect x="58" y="50" width="4" height="6" fill="#3a2d20" />' +
      '<path d="M 36 50 L 50 36 L 64 50 Z" fill="#fafafa" stroke="#c8d4dc" stroke-width="0.4" />' +
      '<rect x="46" y="62" width="4" height="6" fill="#fff8e8" opacity="0.85" />' +
      '<rect x="52" y="62" width="4" height="6" fill="#fff8e8" opacity="0.85" />' +
      '</g>',
  },
  // Alabasta — crescent dune with Alubarna ridge.
  'alabasta': {
    slug: 'alabasta',
    sizePct: 4.6,
    pathD: 'M 8 56 Q 18 30 42 32 Q 54 18 66 32 Q 88 30 92 56 Q 96 80 78 84 Q 50 92 22 84 Q 4 80 8 56 Z',
    // Palm tree silhouette + small palace dome with crescent flag.
    overlay:
      '<g opacity="0.92">' +
      '<rect x="20" y="48" width="2.4" height="32" fill="#4a3018" />' +
      '<path d="M 21 48 Q 12 44 8 50 M 21 48 Q 30 44 34 50 M 21 48 Q 18 40 14 38 M 21 48 Q 24 40 28 38" stroke="#3d6e2a" stroke-width="1.6" fill="none" stroke-linecap="round" />' +
      '<path d="M 50 80 L 50 60 Q 50 50 60 50 Q 70 50 70 60 L 70 80 Z" fill="#d4a070" stroke="#7a5028" stroke-width="0.6" />' +
      '<path d="M 50 60 Q 60 46 70 60" fill="#c08050" stroke="#7a5028" stroke-width="0.5" />' +
      '<rect x="59" y="36" width="0.8" height="14" fill="#3a2010" />' +
      '<path d="M 59.8 36 L 70 39 Q 64 41 70 44 L 59.8 47 Z" fill="#d92626" />' +
      '</g>',
  },
  // Jaya — split half-island (the upper half got knock-up-streamed to Skypiea).
  'jaya': {
    slug: 'jaya',
    sizePct: 3.4,
    pathD: 'M 12 70 Q 18 38 38 38 L 42 22 L 48 38 L 50 28 L 50 86 Q 30 92 14 84 Q 8 78 12 70 Z',
    // Anchor + small ship icon (the Mock Town vibe).
    overlay:
      '<g opacity="0.9" fill="none" stroke="#1a0d05" stroke-width="0.8" stroke-linecap="round">' +
      '<line x1="30" y1="46" x2="30" y2="74" />' +
      '<line x1="22" y1="50" x2="38" y2="50" />' +
      '<path d="M 18 66 Q 30 80 42 66" stroke-width="1.2" />' +
      '<circle cx="30" cy="44" r="2.2" fill="#c8a040" stroke="#1a0d05" />' +
      '<path d="M 24 84 L 38 84 L 35 78 L 27 78 Z" fill="#5a3a1a" stroke="#1a0d05" />' +
      '<line x1="31" y1="78" x2="31" y2="68" stroke-width="0.6" />' +
      '<path d="M 28 70 L 31 68 L 31 76 Z" fill="#fff8e8" stroke="none" />' +
      '</g>',
  },
  // Skypiea — fluffy cloud with multiple bumps.
  'skypiea': {
    slug: 'skypiea',
    sizePct: 4.4,
    pathD: 'M 10 64 Q 8 50 22 48 Q 22 32 38 34 Q 44 22 56 28 Q 66 22 74 34 Q 90 32 90 50 Q 96 64 84 70 Q 78 84 60 80 Q 48 90 36 80 Q 18 84 14 72 Q 6 70 10 64 Z',
    // White cloud puff outline + small angel-wing silhouette + golden light shaft from above.
    overlay:
      '<g opacity="0.95">' +
      '<path d="M 28 56 Q 26 48 36 46 Q 38 38 50 40 Q 56 34 64 40 Q 74 38 74 48 Q 80 56 70 60 Q 64 70 50 66 Q 36 68 32 60 Q 24 60 28 56 Z" fill="#fffaef" stroke="#e0d4be" stroke-width="0.5" />' +
      '<path d="M 50 38 Q 42 32 38 34 Q 44 36 50 42 Q 56 36 62 34 Q 58 32 50 38 Z" fill="#fffaef" stroke="#cfc0a4" stroke-width="0.4" />' +
      '<path d="M 50 14 L 48 32 L 52 32 Z" fill="#ffd966" opacity="0.7" />' +
      '<circle cx="50" cy="14" r="2" fill="#fff8e8" opacity="0.9" />' +
      '</g>',
  },
  // Water 7 — gear-tooth round (city of canals + dock notches).
  'water-7': {
    slug: 'water-7',
    sizePct: 4.0,
    pathD: 'M 30 16 L 38 22 L 50 16 L 62 22 L 70 16 L 78 28 L 84 38 L 90 50 L 84 62 L 78 72 L 70 84 L 62 78 L 50 84 L 38 78 L 30 84 L 22 72 L 16 62 L 10 50 L 16 38 L 22 28 Z',
    // Tall fountain icon with arched water spouts.
    overlay:
      '<g opacity="0.92">' +
      '<rect x="44" y="60" width="12" height="20" fill="#7a8a98" stroke="#3a4a55" stroke-width="0.5" />' +
      '<rect x="40" y="56" width="20" height="6" fill="#9aacba" stroke="#3a4a55" stroke-width="0.5" />' +
      '<rect x="48" y="34" width="4" height="22" fill="#7a8a98" />' +
      '<circle cx="50" cy="32" r="3" fill="#5fa6c8" />' +
      '<path d="M 50 32 Q 40 36 36 50" fill="none" stroke="#bde0f0" stroke-width="1.4" stroke-linecap="round" />' +
      '<path d="M 50 32 Q 60 36 64 50" fill="none" stroke="#bde0f0" stroke-width="1.4" stroke-linecap="round" />' +
      '<path d="M 50 32 Q 50 22 50 18" fill="none" stroke="#bde0f0" stroke-width="1.4" stroke-linecap="round" />' +
      '</g>',
  },
  // Enies Lobby — Round 36 (follow-up): rebuilt around the hand-authored
  // transparent map icon (3-tier vertical fortress: Tower of Justice spire
  // on top, mid plateau with castle, rounded base over the Endless
  // Waterfall).  The path is a tall capsule sized to comfortably contain
  // the icon's visible content; with `imageFit="meet"` on the silhouette
  // the transparent gaps simply read as empty water around the structure.
  // No hand-drawn overlay needed — the icon already renders all the
  // architecture (towers, castles, jade roofs, waterfall trail).
  'enies-lobby': {
    slug: 'enies-lobby',
    sizePct: 5.0,
    // Tall vertical capsule: top arc traces the Tower of Justice spire,
    // the right/left curves flow down past the mid-plateau and rounded
    // base, and close at the bottom over the Endless Waterfall void.
    pathD: 'M 30 4 Q 50 -2 70 4 Q 86 22 86 50 Q 86 78 80 92 Q 65 100 50 100 Q 35 100 20 92 Q 14 78 14 50 Q 14 22 30 4 Z',
  },
  // Thriller Bark — giant ship-island lump with mast notch on top.
  'thriller-bark': {
    slug: 'thriller-bark',
    sizePct: 4.4,
    pathD: 'M 8 58 Q 14 40 28 38 L 32 22 L 38 38 L 50 26 L 62 38 L 68 22 L 72 38 Q 88 38 92 60 Q 96 82 80 86 Q 50 94 20 86 Q 4 82 8 58 Z',
    // Gothic ship hull silhouette with single mast + skull lantern.
    overlay:
      '<g opacity="0.92">' +
      '<path d="M 18 70 Q 50 84 82 70 L 76 80 Q 50 88 24 80 Z" fill="#2a1a10" stroke="#0a0500" stroke-width="0.5" />' +
      '<rect x="49" y="36" width="2" height="34" fill="#3a2510" />' +
      '<path d="M 51 40 L 68 44 L 51 52 Z" fill="#1a0d05" stroke="#000" stroke-width="0.4" />' +
      '<circle cx="60" cy="44" r="2.2" fill="#fff8e8" />' +
      '<circle cx="58.6" cy="43.4" r="0.6" fill="#1a0d05" />' +
      '<circle cx="61.4" cy="43.4" r="0.6" fill="#1a0d05" />' +
      '<rect x="58" y="46" width="4" height="1" fill="#1a0d05" />' +
      '</g>',
  },
  // Sabaody — round mangrove root with bubble notch.
  'sabaody': {
    slug: 'sabaody',
    sizePct: 4.2,
    pathD: 'M 10 60 Q 14 30 38 30 Q 50 12 62 30 Q 86 30 90 60 Q 92 80 76 86 Q 50 92 24 86 Q 8 80 10 60 Z',
    // 3 large mangrove tree silhouettes with bubble dots floating around.
    overlay:
      '<g opacity="0.9">' +
      '<path d="M 22 78 Q 22 50 30 38 Q 38 50 38 78 Z" fill="#2d4a25" stroke="#1a3010" stroke-width="0.6" />' +
      '<path d="M 42 78 Q 42 44 50 30 Q 58 44 58 78 Z" fill="#3d6e2a" stroke="#1a3010" stroke-width="0.6" />' +
      '<path d="M 62 78 Q 62 50 70 38 Q 78 50 78 78 Z" fill="#2d4a25" stroke="#1a3010" stroke-width="0.6" />' +
      '<circle cx="20" cy="42" r="2" fill="none" stroke="#bde0f0" stroke-width="0.5" />' +
      '<circle cx="36" cy="34" r="1.6" fill="none" stroke="#bde0f0" stroke-width="0.5" />' +
      '<circle cx="64" cy="32" r="2.4" fill="none" stroke="#bde0f0" stroke-width="0.5" />' +
      '<circle cx="80" cy="40" r="1.8" fill="none" stroke="#bde0f0" stroke-width="0.5" />' +
      '</g>',
  },
  // Fishman Island — round bubble dome.
  'fishman-island': {
    slug: 'fishman-island',
    sizePct: 4.2,
    pathD: 'M 50 12 Q 88 18 90 50 Q 88 84 50 88 Q 12 84 10 50 Q 12 18 50 12 Z',
    // Large bubble outline encasing the photo (because it's underwater).
    overlay:
      '<g opacity="0.85">' +
      '<circle cx="50" cy="50" r="38" fill="none" stroke="#bde0f0" stroke-width="1.6" />' +
      '<circle cx="50" cy="50" r="34" fill="none" stroke="#fffaef" stroke-width="0.4" opacity="0.55" />' +
      '<path d="M 28 30 Q 38 22 48 26" fill="none" stroke="#fffaef" stroke-width="1.2" stroke-linecap="round" opacity="0.7" />' +
      '<circle cx="32" cy="36" r="1.2" fill="#fffaef" opacity="0.7" />' +
      '</g>',
  },
  // Punk Hazard — split fire/ice asymmetric crescent.
  'punk-hazard': {
    slug: 'punk-hazard',
    sizePct: 3.8,
    pathD: 'M 8 62 Q 14 32 36 36 L 50 18 L 58 36 Q 84 30 92 60 L 84 70 L 76 60 L 70 78 L 56 64 L 48 84 L 40 64 L 28 78 L 22 60 L 14 70 Z',
    // Vertical split: red flame on left half, blue ice crystal on right half.
    overlay:
      '<g opacity="0.95">' +
      '<rect x="0" y="0" width="50" height="100" fill="#e25c2c" opacity="0.32" />' +
      '<rect x="50" y="0" width="50" height="100" fill="#5fa6c8" opacity="0.32" />' +
      '<path d="M 30 78 Q 24 60 30 50 Q 26 42 32 36 Q 36 46 34 56 Q 40 50 38 64 Q 36 72 30 78 Z" fill="#ff7c42" stroke="#a02810" stroke-width="0.4" />' +
      '<path d="M 70 36 L 70 78 M 64 42 L 76 72 M 76 42 L 64 72 M 60 50 L 80 50 M 60 60 L 80 60" stroke="#bde0f0" stroke-width="0.9" stroke-linecap="round" />' +
      '</g>',
  },
  // Dressrosa — flower-spiral (heart-with-petals shape).
  'dressrosa': {
    slug: 'dressrosa',
    sizePct: 4.4,
    pathD: 'M 50 14 Q 28 14 22 32 Q 8 38 16 56 Q 8 72 28 78 Q 32 92 50 84 Q 68 92 72 78 Q 92 72 84 56 Q 92 38 78 32 Q 72 14 50 14 Z',
    // Birdcage silhouette: vertical bars in a dome overlaid centre.
    overlay:
      '<g opacity="0.88" fill="none" stroke="#5a3a1a" stroke-width="0.8" stroke-linecap="round">' +
      '<path d="M 20 78 Q 20 36 50 32 Q 80 36 80 78" />' +
      '<line x1="28" y1="78" x2="28" y2="40" />' +
      '<line x1="36" y1="78" x2="36" y2="36" />' +
      '<line x1="44" y1="78" x2="44" y2="33" />' +
      '<line x1="50" y1="78" x2="50" y2="32" />' +
      '<line x1="56" y1="78" x2="56" y2="33" />' +
      '<line x1="64" y1="78" x2="64" y2="36" />' +
      '<line x1="72" y1="78" x2="72" y2="40" />' +
      '<path d="M 18 78 L 82 78" stroke-width="1.2" />' +
      '<path d="M 50 24 L 48 32 L 52 32 Z" fill="#5a3a1a" stroke="none" />' +
      '</g>',
  },
  // Zou — elephant-back curve (long high arch with leg bumps).
  'zou': {
    slug: 'zou',
    sizePct: 4.4,
    pathD: 'M 8 72 Q 12 50 24 50 Q 32 30 48 32 Q 68 28 78 50 Q 92 52 90 72 L 84 86 L 76 76 L 64 86 L 52 76 L 40 86 L 28 76 L 16 86 Z',
    // Massive elephant silhouette dominating the silhouette: legs + trunk.
    overlay:
      '<g opacity="0.9" fill="#5a4a3a" stroke="#2a1d10" stroke-width="0.6" stroke-linejoin="round">' +
      '<path d="M 18 72 Q 18 44 38 40 Q 60 38 70 50 Q 78 50 80 56 Q 84 60 80 64 L 78 70 L 78 84 L 70 84 L 70 72 L 56 72 L 56 84 L 48 84 L 48 72 L 36 72 L 36 84 L 28 84 L 28 70 Q 18 70 18 72 Z" />' +
      '<path d="M 78 56 Q 86 54 88 60 Q 88 70 84 74 Q 82 70 82 64" fill="#5a4a3a" />' +
      '<circle cx="34" cy="48" r="1.4" fill="#1a0d05" stroke="none" />' +
      '<path d="M 24 50 L 28 46 L 30 50" fill="none" stroke="#fffaef" stroke-width="0.4" />' +
      '</g>',
  },
  // Whole Cake Island — fluted cake circle with crown notches.
  'whole-cake-island': {
    slug: 'whole-cake-island',
    sizePct: 5.0,
    pathD: 'M 14 80 L 18 56 L 14 40 L 22 44 L 26 28 L 34 38 L 38 22 L 46 34 L 50 18 L 54 34 L 62 22 L 66 38 L 74 28 L 78 44 L 86 40 L 82 56 L 86 80 Q 50 88 14 80 Z',
    // Layered cake icon with cherry on top.
    overlay:
      '<g opacity="0.95" stroke="#7a3030" stroke-width="0.5">' +
      '<rect x="22" y="64" width="56" height="18" rx="2" fill="#f8d4d4" />' +
      '<rect x="28" y="48" width="44" height="18" rx="2" fill="#fae0e0" />' +
      '<rect x="36" y="34" width="28" height="16" rx="2" fill="#fff0f0" />' +
      '<path d="M 22 68 Q 30 64 38 68 Q 46 64 54 68 Q 62 64 70 68 Q 76 64 78 68" fill="none" stroke="#e8a0a0" stroke-width="0.6" />' +
      '<path d="M 28 52 Q 36 48 44 52 Q 52 48 60 52 Q 66 48 72 52" fill="none" stroke="#e8a0a0" stroke-width="0.6" />' +
      '<circle cx="50" cy="28" r="3.2" fill="#d92626" stroke="#7a1010" stroke-width="0.5" />' +
      '<path d="M 50 25 Q 54 18 58 18" fill="none" stroke="#3d6e2a" stroke-width="0.8" />' +
      '</g>',
  },
  // Wano Country — hook (Japan-shape, curved stretched arc).
  'wano-country': {
    slug: 'wano-country',
    sizePct: 5.0,
    pathD: 'M 16 22 Q 28 18 36 28 Q 44 18 50 32 Q 60 26 64 42 Q 76 44 78 60 Q 86 66 80 78 Q 70 86 60 80 Q 52 90 44 80 Q 32 86 26 72 Q 14 70 16 56 Q 8 46 16 36 Z',
    // Pagoda silhouette (3-tier roof) + waterfall stripe.
    overlay:
      '<g opacity="0.92">' +
      '<rect x="2" y="34" width="6" height="44" fill="#bde0f0" opacity="0.55" />' +
      '<path d="M 4 34 L 6 78 M 6 34 L 4 78" stroke="#5fa6c8" stroke-width="0.4" />' +
      '<rect x="44" y="64" width="20" height="14" fill="#7a4030" stroke="#3a1a10" stroke-width="0.5" />' +
      '<path d="M 38 64 L 70 64 L 64 56 L 44 56 Z" fill="#a03020" stroke="#3a1a10" stroke-width="0.5" />' +
      '<path d="M 40 50 L 68 50 L 62 42 L 46 42 Z" fill="#c04030" stroke="#3a1a10" stroke-width="0.5" />' +
      '<path d="M 42 36 L 66 36 L 60 28 L 48 28 Z" fill="#c04030" stroke="#3a1a10" stroke-width="0.5" />' +
      '<rect x="53" y="22" width="2" height="6" fill="#3a1a10" />' +
      '<rect x="51" y="68" width="6" height="10" fill="#1a0d05" />' +
      '</g>',
  },
  // Egghead — egg oval (Vegapunk's lab).
  'egghead': {
    slug: 'egghead',
    sizePct: 4.0,
    pathD: 'M 50 10 Q 80 14 86 44 Q 90 76 64 86 Q 50 92 36 86 Q 10 76 14 44 Q 20 14 50 10 Z',
    // Hexagonal hologram pattern + a single giant EGG oval shape.
    overlay:
      '<g opacity="0.88">' +
      '<ellipse cx="50" cy="54" rx="20" ry="26" fill="#fff8e8" stroke="#5fa6c8" stroke-width="0.6" />' +
      '<g fill="none" stroke="#34d399" stroke-width="0.5" opacity="0.75">' +
      '<path d="M 26 36 L 32 34 L 38 36 L 38 42 L 32 44 L 26 42 Z" />' +
      '<path d="M 62 36 L 68 34 L 74 36 L 74 42 L 68 44 L 62 42 Z" />' +
      '<path d="M 26 60 L 32 58 L 38 60 L 38 66 L 32 68 L 26 66 Z" />' +
      '<path d="M 62 60 L 68 58 L 74 60 L 74 66 L 68 68 L 62 66 Z" />' +
      '</g>' +
      '<circle cx="50" cy="50" r="2" fill="#34d399" opacity="0.8" />' +
      '</g>',
  },
  // Elbaph — tall tree-trunk silhouette (World Tree base).
  'elbaph': {
    slug: 'elbaph',
    sizePct: 4.6,
    pathD: 'M 22 84 Q 16 60 20 44 Q 14 30 26 26 Q 36 14 48 22 Q 60 14 70 26 Q 84 28 80 44 Q 86 60 78 84 Q 50 90 22 84 Z',
    // Massive world-tree silhouette (trunk + canopy) + small viking helmet.
    overlay:
      '<g opacity="0.92">' +
      '<rect x="44" y="44" width="12" height="36" fill="#5a3a1a" stroke="#2a1810" stroke-width="0.5" />' +
      '<path d="M 44 50 L 36 62 L 38 80 M 56 52 L 64 64 L 62 80 M 46 56 L 40 70 M 54 56 L 60 70" stroke="#5a3a1a" stroke-width="1.4" fill="none" stroke-linecap="round" />' +
      '<ellipse cx="50" cy="36" rx="28" ry="22" fill="#3d6e2a" stroke="#1a3010" stroke-width="0.6" />' +
      '<ellipse cx="50" cy="32" rx="18" ry="12" fill="#5a8a3a" opacity="0.7" />' +
      '<path d="M 36 78 Q 38 70 44 70 L 56 70 Q 62 70 64 78 L 60 78 L 60 74 L 40 74 L 40 78 Z" fill="#9aacba" stroke="#3a4a55" stroke-width="0.5" />' +
      '<path d="M 38 72 Q 36 66 32 64 L 32 70 M 62 72 Q 64 66 68 64 L 68 70" stroke="#9aacba" stroke-width="1" fill="none" />' +
      '</g>',
  },
  // Laugh Tale — mysterious island, smooth round shape (locked).
  'laugh-tale': {
    slug: 'laugh-tale',
    sizePct: 4.2,
    pathD: 'M 50 12 Q 78 16 86 38 Q 92 56 84 72 Q 76 88 50 88 Q 24 88 16 72 Q 8 56 14 38 Q 22 16 50 12 Z',
    // No themed overlay — Laugh Tale is rendered with the existing locked
    // overlay (?? glyph) by IslandSilhouette when locked={true}.
  },
};
