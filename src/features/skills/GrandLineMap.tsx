/**
 * src/components/GrandLineMap.tsx
 *
 * One Piece world-map view of the skills section. Round 19 rebuild:
 *   - Map backdrop now reads as the canon One Piece world map: 4 Sea
 *     quadrants (North/East/West/South Blue) with corner labels and
 *     atmosphere island silhouettes, an organic Red Line (Y-axis), a
 *     horizontal Grand Line band (X-axis), two Calm Belt stripes flanking
 *     it, and a glowing Reverse Mountain X at the center.
 *   - Each island rendered as a hand-authored stylized SVG silhouette
 *     (clipPath on the real .webp) — no more identical rounded cards.
 *   - Hover any island silhouette → small floating tooltip card (name +
 *     domain + gear), suppressed during drag-pan.
 *   - Click any visited island → existing skills-grid popup.
 *   - Click Dawn Island → new origin popup with Luffy backstory (4 lore
 *     sections including The Origin Code / Primary Directive / Awakening /
 *     Luffy Logic).
 *   - Click Laugh Tale → "Locked" popup. The silhouette has a dark overlay
 *     and a giant `?` glyph because the One Piece is still a mystery.
 *   - Sunny ship now sits closer to its host island (offset 14% instead of
 *     22%) and its facing direction is computed from the next-island
 *     bearing via `computeSunnyFacing` — bowsprit always points where the
 *     voyage is heading.
 *   - "World Codex" button on the map header opens a collapsible drawer
 *     with 4 lore cards: World Coordinate System, Devil Fruits, Haki,
 *     Luffy Logic. Closed by default.
 */

import { useEffect, useId, useMemo, useRef, useState, useCallback } from 'react';
import {
  SKILL_DOMAINS as DEFAULT_DOMAINS,
  FUTURE_ISLANDS,
  DAWN_ISLAND_DATA,
  type SkillDomain,
  type FutureIsland,
  type OriginIsland,
} from './data/skills';
import { useMotionOn } from '../../shared/stores/mode';
import { useSiteContent } from '../content/hooks/useSiteContent';
import { ISLAND_SHAPES } from './grandLineIslandShapes';
import { WORLD_CODEX } from './grandLineCodex';
import { computeSunnyFacing, type Pos } from './grandLineSunny';
import { computeTooltipPosition } from './lib/tooltipPosition';

/** Hook helper — CMS domains with fallback. */
function useGrandLineDomains(): SkillDomain[] {
  const copy = useSiteContent('skills');
  return useMemo<SkillDomain[]>(
    () => (Array.isArray(copy.domains) && copy.domains.length
      ? (copy.domains as SkillDomain[])
      : DEFAULT_DOMAINS),
    [copy.domains],
  );
}

/** Hook helper — CMS futureIslands with fallback to canon. Round 36: the
 *  admin editor persists `futureIslands` as a CMS row (head dropped on each
 *  promotion); the live map MUST read that same row, otherwise the static
 *  fallback will re-render the just-promoted island as a "coming soon"
 *  duplicate. */
function useGrandLineFutures(): FutureIsland[] {
  const copy = useSiteContent('skills');
  return useMemo<FutureIsland[]>(
    () => (Array.isArray(copy.futureIslands) && copy.futureIslands.length
      ? (copy.futureIslands as FutureIsland[])
      : FUTURE_ISLANDS),
    [copy.futureIslands],
  );
}

// kebab-case island slug → matches downloaded image filename in
// /public/assets/One-Piece/islands/<slug>.webp
function slugifyIsland(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
function islandImageUrl(name: string): string {
  return `/assets/One-Piece/islands/${slugifyIsland(name)}.webp`;
}

// ---------------------------------------------------------------------------
// Layout — Round 36 cylindrical-projection rewrite.
// Coordinate system: x∈[0,100], y∈[0,100], central Red Line at x=51.
//
// Paradise (visited skills) — RIGHT half, ordered LEFT→RIGHT.  Voyage exits
// the right edge after Sabaody and the world wraps cylindrically to the
// LEFT edge, where the New World begins with Fishman Island under the
// LEFT-edge Red Line strip.
//
// New World — LEFT half, ordered LEFT→RIGHT (mirror of Paradise's visual
// rhythm).  Fishman Island sits at x≈4 under the left-edge Red Line strip
// and the voyage reads east through the New World to Laugh Tale, which is
// the rightmost slot in the New World, just west of the centre Red Line.
//
// Total: 18 entries (9 visited Paradise + 9 future New World incl. Laugh Tale).
// Dawn Island (origin) is rendered separately at DAWN_ISLAND_POS.
//
// Atmospheric extras NOT part of ALL_ISLAND_POS:
//   - Skypiea is a visited slot AND a vertical-pair atmospheric overlay above Jaya.
//   - Enies Lobby is east of Water 7 — sea-train linked, no skill data.
// ---------------------------------------------------------------------------

const ALL_ISLAND_POS: Pos[] = [
  // ---- Paradise (RIGHT of central Red Line at x=51) — visited skill islands ----
  { x: 56, y: 42 },  //  0 Whiskey Peak       (just east of centre, slight north)
  { x: 60, y: 68 },  //  1 Little Garden      (drops south after Whiskey Peak)
  { x: 65, y: 22 },  //  2 Drum Island        (northern snow-detour)
  { x: 71, y: 56 },  //  3 Alabasta           (back south to desert)
  { x: 78, y: 70 },  //  4 Jaya               (south-eastern Paradise)
  { x: 78, y: 18 },  //  5 Skypiea            (sky island, directly above Jaya)
  { x: 86, y: 50 },  //  6 Water 7            (mid-Paradise, Enies Lobby east)
  { x: 91, y: 72 },  //  7 Thriller Bark      (southern gothic)
  { x: 96, y: 38 },  //  8 Sabaody            (eastern edge — voyage exits east)
  // ---- Cylindrical wrap: Sabaody → right-edge → left-edge → Fishman ----
  // ---- New World (LEFT of central Red Line) — future islands LEFT→RIGHT ----
  { x:  4, y: 70 },  //  9 Fishman Island     (left-edge Red Line, wrap entry point)
  { x: 10, y: 36 },  // 10 Punk Hazard        (north drift after Fishman, fire/ice)
  { x: 16, y: 64 },  // 11 Dressrosa          (south, colourful)
  { x: 22, y: 24 },  // 12 Zou                (far north, elephant silhouette)
  { x: 28, y: 56 },  // 13 Whole Cake Island  (centre-mid, candy aesthetic)
  { x: 34, y: 70 },  // 14 Wano Country       (south, samurai fortress)
  { x: 40, y: 30 },  // 15 Egghead            (north, futurist lab)
  { x: 45, y: 58 },  // 16 Elbaph             (near centre, world tree)
  { x: 48, y: 22 },  // 17 Laugh Tale         (rightmost in NW, just before centre Red Line)
];

// ---------------------------------------------------------------------------
// Round 36 — canon-name → position lookup.  When admin promotes a future
// island the visited array grows by 1 and the future array shrinks by 1;
// without name-based lookup, the future-render falls onto the wrong slot
// (and a duplicate appears at the freshly-promoted position).  Rendering by
// canonical island name keeps every island anchored to its world-map slot
// regardless of how many futures have been promoted.
// ---------------------------------------------------------------------------
const VISITED_CANON_NAMES = [
  'Whiskey Peak', 'Little Garden', 'Drum Island', 'Alabasta', 'Jaya',
  'Skypiea', 'Water 7', 'Thriller Bark', 'Sabaody',
];
const FUTURE_CANON_NAMES = [
  'Fishman Island', 'Punk Hazard', 'Dressrosa', 'Zou', 'Whole Cake Island',
  'Wano Country', 'Egghead', 'Elbaph', 'Laugh Tale',
];
const ISLAND_POS_BY_NAME: Record<string, Pos> = (() => {
  const map: Record<string, Pos> = {};
  VISITED_CANON_NAMES.forEach((name, i) => {
    if (ALL_ISLAND_POS[i]) map[name] = ALL_ISLAND_POS[i];
  });
  FUTURE_CANON_NAMES.forEach((name, i) => {
    const pos = ALL_ISLAND_POS[VISITED_CANON_NAMES.length + i];
    if (pos) map[name] = pos;
  });
  return map;
})();

// ---------------------------------------------------------------------------
// Atmospheric / off-route nodes — NOT in ALL_ISLAND_POS.
// ---------------------------------------------------------------------------
/** Enies Lobby — judicial fortress east of Water 7, sea-train linked.
 *  Round 36 (follow-up): nudged east so the sea-train tracks have visible
 *  span between the two silhouettes (Water 7 button visual right edge ≈ 88,
 *  Enies Lobby button visual left edge ≈ 91.5 → 3.5% gap for the rails). */
const ENIES_LOBBY_POS: Pos = { x: 94, y: 50 };
/** Public path to the new transparent Enies Lobby map icon (3-tier vertical
 *  fortress with Tower of Justice on top).  Used as the photo backdrop
 *  inside the Enies Lobby silhouette — replaces the old Water 7 webp hack. */
const ENIES_LOBBY_ICON = '/assets/One-Piece/icons/enies-lobby-map-icon-transparent.png';

const RED_LINE_X = 51;
// Round 20: Dawn Island moved to the EAST BLUE quadrant (TOP-RIGHT) per
// canon. Luffy's hometown Foosha Village is in East Blue. Position picked
// so it sits clearly inside the East Blue rectangle (x>51, y<42) and not
// on the Grand Line band (y:42-58).
const DAWN_ISLAND: Pos = { x: 88, y: 8 };

// Gear → badge color.
const GEAR_COLOR: Record<SkillDomain['gear'], string> = {
  'Base':   '#5a6b7d',
  'Gear 2': '#e74c3c',
  'Gear 3': '#e67e22',
  'Gear 4': '#8e44ad',
  'Gear 5': '#f1c40f',
};

// ---------------------------------------------------------------------------
// Map background — Round 19: 4 Sea quadrants with corner labels +
// atmosphere island silhouettes, organic Red Line, Grand Line corridor with
// labels, Calm Belts flanking it, glowing Reverse Mountain X at center.
// ---------------------------------------------------------------------------

/** A small atmosphere blob for the sea quadrants (decorative only). */
function AtmosphereBlob({ d, opacity = 0.16 }: { d: string; opacity?: number }) {
  return <path d={d} fill="#5a4a32" opacity={opacity} />;
}

/** A wave ripple arc — drawn around an island for atmosphere. */
function WaveRipple({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <path
      d={`M ${cx - r} ${cy} Q ${cx} ${cy - r * 0.35} ${cx + r} ${cy}`}
      fill="none"
      stroke="#fff"
      strokeWidth="0.18"
      opacity="0.32"
    />
  );
}

/** Sea King fin — a small dark triangle emerging from a calm belt. */
function SeaKingFin({ cx, cy, scale = 1 }: { cx: number; cy: number; scale?: number }) {
  const w = 1.2 * scale;
  const h = 1.6 * scale;
  return (
    <path
      d={`M ${cx - w} ${cy} Q ${cx} ${cy - h} ${cx + w} ${cy} Z`}
      fill="#1a0d05"
      opacity="0.42"
    />
  );
}

/** Snow cap cluster — small white triangles for mountain peaks. */
function SnowCap({ cx, cy, w = 1.2 }: { cx: number; cy: number; w?: number }) {
  return (
    <path
      d={`M ${cx - w} ${cy} L ${cx} ${cy - w * 0.9} L ${cx + w} ${cy} Z`}
      fill="#f9f9f9"
      opacity="0.7"
    />
  );
}

function MapBackground() {
  return (
    <svg
      className="grand-line-map__bg"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="presentation"
      focusable="false"
    >
      <defs>
        <radialGradient id="glm-paper" cx="50%" cy="50%" r="70%">
          <stop offset="0%"   stopColor="#ede0c4" />
          <stop offset="100%" stopColor="#f5ead8" />
        </radialGradient>
        <pattern id="glm-waves" x="0" y="0" width="2.4" height="1.2" patternUnits="userSpaceOnUse">
          <path d="M 0 0.6 Q 0.6 0 1.2 0.6 Q 1.8 1.2 2.4 0.6" fill="none" stroke="#c8dff0" strokeWidth="0.12" opacity="0.55" />
        </pattern>
        <pattern id="glm-waves-dense" x="0" y="0" width="1.6" height="0.9" patternUnits="userSpaceOnUse">
          <path d="M 0 0.45 Q 0.4 0 0.8 0.45 Q 1.2 0.9 1.6 0.45" fill="none" stroke="#7eb8d4" strokeWidth="0.09" opacity="0.7" />
        </pattern>
        {/* Round 21: Red Line gradient — 3 shades of red simulate
            mountain shadow (bottom darker, middle brightest, top
            mid-tone).  Replaces the flat tile pattern. */}
        <linearGradient id="glm-redline-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#7a1f15" />
          <stop offset="48%"  stopColor="#c0392b" />
          <stop offset="60%"  stopColor="#e8554a" />
          <stop offset="100%" stopColor="#7a1f15" />
        </linearGradient>
        <pattern id="glm-redline-tex" x="0" y="0" width="1.2" height="1.2" patternUnits="userSpaceOnUse">
          <rect width="1.2" height="1.2" fill="url(#glm-redline-grad)" />
          <line x1="0"   y1="0"   x2="1.2" y2="1.2" stroke="rgba(0,0,0,0.22)" strokeWidth="0.08" />
          <line x1="0"   y1="1.2" x2="1.2" y2="0"   stroke="rgba(255,255,255,0.10)" strokeWidth="0.06" />
        </pattern>
        <radialGradient id="glm-x-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#ffd966" stopOpacity="0.95" />
          <stop offset="55%"  stopColor="#ffaf3a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffaf3a" stopOpacity="0" />
        </radialGradient>
        {/* Round 26 — Red Line is now drawn as FIVE separate red pieces
            (no mask, no central dot).  See the central RedLineMountains
            component below for the 5 individual <path> elements that form
            the canon X-gap geometry naturally:
              1. North main (large, above the X-zone)
              2. South main (large, below the X-zone)
              3. West wedge (>-shaped, west of centre)
              4. East upper wedge (small, NE of centre)
              5. East lower wedge (small, SE of centre)
            The water gaps between these 5 shapes ARE the X-rivers — no
            overlay strokes needed.  The Reverse Mountain label sits in
            the Paradise zone (right of centre) per user spec. */}
        {/* Round 21: arrow marker for the voyage path dashes (used in
            VoyagePath component below). */}
        <marker
          id="glm-path-arrow"
          viewBox="0 0 6 6"
          refX="3"
          refY="3"
          markerWidth="3"
          markerHeight="3"
          orient="auto"
        >
          <path d="M 0 0 L 6 3 L 0 6 Z" fill="#5a3a1a" opacity="0.85" />
        </marker>
      </defs>

      {/* Base parchment + global wave texture */}
      <rect x="0" y="0" width="100" height="100" fill="url(#glm-paper)" />
      <rect x="0" y="0" width="100" height="100" fill="url(#glm-waves)" opacity="0.55" />

      {/* ===== 4 Sea quadrants ===== */}
      {/* North Blue (top-left) */}
      <rect x="0"  y="0"  width="49" height="42" fill="#7fb6c8" opacity="0.18" />
      {/* East Blue (top-right) — Luffy's home */}
      <rect x="51" y="0"  width="49" height="42" fill="#9dc8e0" opacity="0.18" />
      {/* West Blue (bottom-left) */}
      <rect x="0"  y="58" width="49" height="42" fill="#3d6e8a" opacity="0.20" />
      {/* South Blue (bottom-right) */}
      <rect x="51" y="58" width="49" height="42" fill="#7ec0a8" opacity="0.18" />

      {/* Round 25 (Phase 1): atmosphere islands re-distributed to clear the
          new edge Red Line strips at x:0-2.5 and x:97.5-100.  All blobs now
          sit at x>=4 and x<=95 to leave the wrap-around mountain ridges
          uncluttered. */}
      {/* North Blue — 8 silhouettes */}
      <AtmosphereBlob d="M 10 14 Q 14 8 20 12 Q 24 14 20 18 Q 14 20 10 14 Z" />
      <AtmosphereBlob d="M 28 26 Q 34 22 38 26 Q 40 30 34 32 Q 28 30 28 26 Z" />
      <AtmosphereBlob d="M 38 8 Q 42 4 46 8 Q 44 12 38 8 Z" />
      <AtmosphereBlob d="M 6 30 Q 10 26 14 30 Q 16 34 10 35 Q 6 33 6 30 Z" opacity={0.13} />
      <AtmosphereBlob d="M 18 4 Q 24 0 28 4 Q 26 8 20 8 Q 18 6 18 4 Z" opacity={0.13} />
      <AtmosphereBlob d="M 30 14 Q 33 12 36 14 Q 35 16 31 16 Z" opacity={0.14} />
      <AtmosphereBlob d="M 14 22 Q 18 19 22 22 Q 21 25 16 25 Q 14 24 14 22 Z" opacity={0.12} />
      <AtmosphereBlob d="M 42 30 Q 45 27 47 30 Q 46 33 43 33 Z" opacity={0.13} />

      {/* East Blue — 8 silhouettes */}
      <AtmosphereBlob d="M 60 8 Q 66 4 70 8 Q 70 12 64 12 Q 60 12 60 8 Z" />
      <AtmosphereBlob d="M 76 14 Q 82 10 86 14 Q 84 18 78 18 Q 76 16 76 14 Z" />
      <AtmosphereBlob d="M 84 30 Q 88 26 92 30 Q 90 34 84 30 Z" />
      <AtmosphereBlob d="M 54 16 Q 58 12 62 16 Q 60 20 56 20 Q 54 18 54 16 Z" opacity={0.13} />
      <AtmosphereBlob d="M 72 4  Q 76 0  80 4  Q 78 7  74 7  Z" opacity={0.13} />
      <AtmosphereBlob d="M 90 8  Q 93 4  95 8  Q 93 12 90 8  Z" opacity={0.13} />
      <AtmosphereBlob d="M 64 26 Q 68 22 72 26 Q 70 30 66 30 Q 64 28 64 26 Z" opacity={0.12} />
      <AtmosphereBlob d="M 80 30 Q 83 28 86 30 Q 85 33 81 33 Z" opacity={0.13} />

      {/* West Blue — 8 silhouettes */}
      <AtmosphereBlob d="M 8 70 Q 14 66 18 70 Q 18 74 12 74 Q 8 72 8 70 Z" />
      <AtmosphereBlob d="M 22 88 Q 28 84 32 88 Q 30 92 24 92 Q 22 90 22 88 Z" />
      <AtmosphereBlob d="M 36 76 Q 42 72 46 76 Q 44 80 38 80 Q 36 78 36 76 Z" />
      <AtmosphereBlob d="M 6 82  Q 10 78 14 82  Q 12 86  8 85  Z" opacity={0.13} />
      <AtmosphereBlob d="M 16 64 Q 20 60 24 64 Q 22 68 18 68 Q 16 66 16 64 Z" opacity={0.13} />
      <AtmosphereBlob d="M 30 70 Q 34 67 38 70 Q 37 73 32 73 Z" opacity={0.13} />
      <AtmosphereBlob d="M 42 90 Q 45 87 47 90 Q 45 93 43 93 Z" opacity={0.12} />
      <AtmosphereBlob d="M 28 78 Q 31 75 34 78 Q 33 81 29 81 Z" opacity={0.13} />

      {/* South Blue — 8 silhouettes */}
      <AtmosphereBlob d="M 60 88 Q 66 84 70 88 Q 68 92 62 92 Q 60 90 60 88 Z" />
      <AtmosphereBlob d="M 78 70 Q 84 66 88 70 Q 86 74 80 74 Q 78 72 78 70 Z" />
      <AtmosphereBlob d="M 86 84 Q 92 80 94 84 Q 92 88 86 84 Z" />
      <AtmosphereBlob d="M 54 70 Q 58 66 62 70 Q 60 74 56 74 Q 54 72 54 70 Z" opacity={0.13} />
      <AtmosphereBlob d="M 70 78 Q 74 74 78 78 Q 76 82 72 82 Q 70 80 70 78 Z" opacity={0.13} />
      <AtmosphereBlob d="M 90 70 Q 93 67 95 70 Q 93 73 90 73 Z" opacity={0.13} />
      <AtmosphereBlob d="M 80 90 Q 83 87 86 90 Q 84 93 81 93 Z" opacity={0.12} />
      <AtmosphereBlob d="M 64 76 Q 67 73 70 76 Q 69 79 65 79 Z" opacity={0.13} />

      {/* Round 21: wave ripples around atmospheric clusters (decorative). */}
      <WaveRipple cx={14} cy={20}  r={3} />
      <WaveRipple cx={32} cy={32}  r={3} />
      <WaveRipple cx={66} cy={14}  r={3} />
      <WaveRipple cx={82} cy={20}  r={3} />
      <WaveRipple cx={12} cy={76}  r={3} />
      <WaveRipple cx={42} cy={82}  r={3} />
      <WaveRipple cx={64} cy={92}  r={3} />
      <WaveRipple cx={84} cy={74}  r={3} />

      {/* Round 21: snow caps on the upper Calm Belt area (north mountainous). */}
      <SnowCap cx={20} cy={36} w={1.0} />
      <SnowCap cx={40} cy={36} w={1.2} />
      <SnowCap cx={70} cy={36} w={1.1} />
      <SnowCap cx={88} cy={36} w={0.9} />

      {/* Sea labels — letter-spaced display font, low opacity backdrop typography.
          Round 25 (Phase 1): nudged inward from 3/97 to 4/96 to clear the
          new wrap-around Red Line edge strips at x:0-2.5 and x:97.5-100. */}
      <text x="4"  y="6"  fontSize="3.4" fontWeight="700" fill="#1a4866" opacity="0.32" letterSpacing="0.5"
            className="glm-sea-label">NORTH BLUE</text>
      <text x="96" y="6"  textAnchor="end" fontSize="3.4" fontWeight="700" fill="#1a4866" opacity="0.32" letterSpacing="0.5"
            className="glm-sea-label">EAST BLUE</text>
      <text x="4"  y="98" fontSize="3.4" fontWeight="700" fill="#1a3a55" opacity="0.34" letterSpacing="0.5"
            className="glm-sea-label">WEST BLUE</text>
      <text x="96" y="98" textAnchor="end" fontSize="3.4" fontWeight="700" fill="#1a4866" opacity="0.32" letterSpacing="0.5"
            className="glm-sea-label">SOUTH BLUE</text>

      {/* ===== Calm Belt (above) ===== */}
      <rect x="0" y="37" width="100" height="5" fill="#fff8e8" opacity="0.55" />
      {/* Round 21: 3 Sea King fins per belt (more atmospheric than the
          tiny humps that were here before). */}
      <SeaKingFin cx={14} cy={41.4} scale={1.3} />
      <SeaKingFin cx={46} cy={41.4} scale={1.5} />
      <SeaKingFin cx={78} cy={41.4} scale={1.2} />
      <text x="3.5" y="40.6" fontSize="1.4" fontWeight="600" fill="#1a0d05" opacity="0.55" letterSpacing="0.3"
            className="glm-calm-belt-label">CALM BELT</text>

      {/* ===== Grand Line band ===== */}
      <rect x="0" y="42" width="100" height="16" fill="#b8d8e8" opacity="0.30" />
      <rect x="0" y="42" width="100" height="16" fill="url(#glm-waves-dense)" opacity="0.7" />
      {/* Round 20 (canon flip): NEW WORLD on the LEFT half, PARADISE on the
          RIGHT half — matches the official One Piece world map. */}
      <text x={RED_LINE_X / 2}                  y="51" textAnchor="middle" fontSize="2.2" fontWeight="700"
            fill="#8b2020" letterSpacing="0.55" opacity="0.65" className="glm-grand-line-label">GRAND LINE · NEW WORLD</text>
      <text x={RED_LINE_X + (100 - RED_LINE_X) / 2} y="51" textAnchor="middle" fontSize="2.2" fontWeight="700"
            fill="#1a4866" letterSpacing="0.55" opacity="0.65" className="glm-grand-line-label">GRAND LINE · PARADISE</text>

      {/* ===== Calm Belt (below) ===== */}
      <rect x="0" y="58" width="100" height="5" fill="#fff8e8" opacity="0.55" />
      <SeaKingFin cx={20} cy={62.4} scale={1.3} />
      <SeaKingFin cx={52} cy={62.4} scale={1.5} />
      <SeaKingFin cx={84} cy={62.4} scale={1.2} />
      <text x="3.5" y="61.6" fontSize="1.4" fontWeight="600" fill="#1a0d05" opacity="0.55" letterSpacing="0.3"
            className="glm-calm-belt-label">CALM BELT</text>

      {/* ===== Red Line — Round 26 FIVE-piece rebuild =====
          Drawn as 5 separate <path> shapes (no mask, no overlay X strokes,
          no central red dot).  The water gaps BETWEEN the pieces naturally
          form the X-shaped Reverse Mountain entry rivers — there's no
          icon-style X painted on top.

          The 5 pieces: */}

      {/* PIECE 1 — NORTH MAIN (large, top half above the X-zone).
          Shape: tall rectangle with a JAGGED bottom edge that dips to a
          downward `v` notch at the centre — that's the upper half of the
          X gap. */}
      <path
        d={`M ${RED_LINE_X - 2.3} 0
            L ${RED_LINE_X - 1.8} 4 L ${RED_LINE_X - 2.5} 9 L ${RED_LINE_X - 1.6} 14
            L ${RED_LINE_X - 2.4} 20 L ${RED_LINE_X - 1.5} 26 L ${RED_LINE_X - 2.6} 32
            L ${RED_LINE_X - 1.7} 38 L ${RED_LINE_X - 2.5} 41
            L ${RED_LINE_X - 1.0} 44 L ${RED_LINE_X} 46.5 L ${RED_LINE_X + 1.0} 44
            L ${RED_LINE_X + 2.5} 41 L ${RED_LINE_X + 1.7} 38 L ${RED_LINE_X + 2.6} 32
            L ${RED_LINE_X + 1.5} 26 L ${RED_LINE_X + 2.4} 20 L ${RED_LINE_X + 1.6} 14
            L ${RED_LINE_X + 2.5} 9  L ${RED_LINE_X + 1.8} 4  L ${RED_LINE_X + 2.3} 0 Z`}
        fill="url(#glm-redline-tex)"
        stroke="#3a1008"
        strokeWidth="0.18"
      />

      {/* PIECE 2 — SOUTH MAIN (large, bottom half below the X-zone).
          Shape: tall rectangle with a JAGGED top edge that rises to an
          upward `^` notch at the centre — lower half of the X gap. */}
      <path
        d={`M ${RED_LINE_X - 2.3} 100
            L ${RED_LINE_X - 1.7} 96 L ${RED_LINE_X - 2.5} 92 L ${RED_LINE_X - 1.7} 86
            L ${RED_LINE_X - 2.4} 80 L ${RED_LINE_X - 1.7} 74 L ${RED_LINE_X - 2.5} 68
            L ${RED_LINE_X - 1.6} 62 L ${RED_LINE_X - 2.5} 59
            L ${RED_LINE_X - 1.0} 56 L ${RED_LINE_X} 53.5 L ${RED_LINE_X + 1.0} 56
            L ${RED_LINE_X + 2.5} 59 L ${RED_LINE_X + 1.6} 62 L ${RED_LINE_X + 2.5} 68
            L ${RED_LINE_X + 1.7} 74 L ${RED_LINE_X + 2.4} 80 L ${RED_LINE_X + 1.7} 86
            L ${RED_LINE_X + 2.5} 92 L ${RED_LINE_X + 1.7} 96 L ${RED_LINE_X + 2.3} 100 Z`}
        fill="url(#glm-redline-tex)"
        stroke="#3a1008"
        strokeWidth="0.18"
      />

      {/* PIECE 3 — WEST WEDGE (small `>` shape pointing right toward
          centre, sitting on the WEST flank of the Red Line in the X-zone). */}
      <path
        d={`M ${RED_LINE_X - 2.5} 46
            L ${RED_LINE_X - 1.6} 48
            L ${RED_LINE_X - 0.9} 50
            L ${RED_LINE_X - 1.6} 52
            L ${RED_LINE_X - 2.5} 54 Z`}
        fill="url(#glm-redline-tex)"
        stroke="#3a1008"
        strokeWidth="0.18"
      />

      {/* PIECE 4 — EAST UPPER WEDGE (small piece on the east, above the
          mid-line — together with Piece 5 forms the canonical "East
          mountain split into 2 sub-pieces"). */}
      <path
        d={`M ${RED_LINE_X + 2.5} 46
            L ${RED_LINE_X + 1.4} 47.5
            L ${RED_LINE_X + 0.7} 49
            L ${RED_LINE_X + 1.5} 49
            L ${RED_LINE_X + 2.5} 49 Z`}
        fill="url(#glm-redline-tex)"
        stroke="#3a1008"
        strokeWidth="0.18"
      />

      {/* PIECE 5 — EAST LOWER WEDGE (small piece on the east, below the
          mid-line). */}
      <path
        d={`M ${RED_LINE_X + 2.5} 51
            L ${RED_LINE_X + 1.5} 51
            L ${RED_LINE_X + 0.7} 51
            L ${RED_LINE_X + 1.4} 52.5
            L ${RED_LINE_X + 2.5} 54 Z`}
        fill="url(#glm-redline-tex)"
        stroke="#3a1008"
        strokeWidth="0.18"
      />

      {/* Bright spine highlight on N + S pieces only — adds depth without
          touching the X-zone wedges. */}
      <path
        d={`M ${RED_LINE_X - 0.3} 0 L ${RED_LINE_X + 0.3} 0 L ${RED_LINE_X + 0.3} 41 L ${RED_LINE_X - 0.3} 41 Z`}
        fill="#f08070"
        opacity="0.55"
      />
      <path
        d={`M ${RED_LINE_X - 0.3} 59 L ${RED_LINE_X + 0.3} 59 L ${RED_LINE_X + 0.3} 100 L ${RED_LINE_X - 0.3} 100 Z`}
        fill="#f08070"
        opacity="0.55"
      />

      {/* Round 25 (Phase 1) — Edge Red Line wrap-around strips.
          The world map is a cylindrical projection: the Red Line continues
          past the eastern edge (x≈100) and re-enters from the western edge
          (x≈0).  We draw two thin decorative strips at the canvas edges to
          telegraph the wrap.  No labels, no clickable area, no snow caps
          (would clip the canvas border).  Geometry is the central ridge
          path scaled to ~50% width and shifted to x=0..2.5 (west) and
          x=97.5..100 (east).  Same gradient texture for visual cohesion. */}
      {/* West edge strip — Round 36 (follow-up): wider top + bottom WINGS
          flaring east into the canvas (toward North Blue at top, toward
          West Blue at bottom).  Apex of the ">" sits in the Grand Line band
          where the strip is narrowest; the wings widen to ~6% at the very
          top / bottom edges.  Two layers preserved: outer flank shadow
          + inner red body. */}
      {/* West edge strip — outer flank shadow (wider ">" wings) */}
      <path
        d={`M 0 0
            L 6.0 0
            L 4.6 8
            L 3.4 16
            L 2.5 24
            L 2.0 32
            L 1.8 42
            L 1.8 58
            L 2.0 68
            L 2.5 76
            L 3.4 84
            L 4.6 92
            L 6.0 100
            L 0 100 Z`}
        fill="#5a1810"
        opacity="0.7"
      />
      {/* West edge strip — main red body (slightly inset from the shadow) */}
      <path
        d={`M 0.4 0
            L 5.2 0
            L 4.0 8
            L 2.9 16
            L 2.1 24
            L 1.6 32
            L 1.4 42
            L 1.4 58
            L 1.6 68
            L 2.1 76
            L 2.9 84
            L 4.0 92
            L 5.2 100
            L 0.4 100 Z`}
        fill="url(#glm-redline-tex)"
        opacity="0.85"
      />

      {/* East edge strip — outer flank shadow */}
      <path
        d={`M 97.5 0
            L 97.4 5 L 98.0 10 L 97.4 16 L 98.0 22 L 97.5 28 L 98.0 34
            L 97.4 40 L 98.0 46 L 97.5 52 L 98.0 58 L 97.4 64 L 98.0 70
            L 97.5 76 L 98.0 82 L 97.4 88 L 98.0 94 L 97.5 100
            L 100 100 L 99.5 94 L 100 88 L 99.4 82 L 100 76
            L 99.4 70 L 100 64 L 99.4 58 L 100 52 L 99.5 46
            L 100 40 L 99.4 34 L 100 28 L 99.5 22 L 100 16
            L 99.4 10 L 100 5  L 100 0 Z`}
        fill="#5a1810"
        opacity="0.7"
      />
      {/* East edge strip — main red body */}
      <path
        d={`M 98.0 0
            L 98.3 8 L 98.0 16 L 98.5 24 L 98.0 32 L 98.3 40
            L 98.0 48 L 98.5 56 L 98.0 64 L 98.3 72 L 98.0 80
            L 98.5 88 L 98.0 96 L 98.0 100
            L 99.6 100 L 99.3 92 L 99.7 84 L 99.3 76 L 99.6 68
            L 99.2 60 L 99.6 52 L 99.3 44 L 99.6 36 L 99.2 28
            L 99.6 20 L 99.3 12 L 99.6 4 L 99.6 0 Z`}
        fill="url(#glm-redline-tex)"
        opacity="0.85"
      />

      {/* Snow caps along the Red Line spine (it's the tallest mountain on the world).
          Skip the X-zone (y:42-58) — those would float in the carved rivers. */}
      <SnowCap cx={RED_LINE_X} cy={4}  w={0.8} />
      <SnowCap cx={RED_LINE_X} cy={20} w={0.7} />
      <SnowCap cx={RED_LINE_X} cy={34} w={0.8} />
      <SnowCap cx={RED_LINE_X} cy={66} w={0.7} />
      <SnowCap cx={RED_LINE_X} cy={82} w={0.8} />
      <SnowCap cx={RED_LINE_X} cy={94} w={0.7} />

      {/* ===== Reverse Mountain — Round 26: 5 Red Line pieces above
          already form the X-gap geometry naturally.  Only thing we paint
          on top is:
            (a) a faint gold halo at the convergence (atmosphere only),
            (b) the descending canal flowing DOWN-RIGHT into Paradise
                (the route ships sail after summiting Reverse Mountain),
            (c) the "Reverse Mountain" label in the Paradise zone. */}

      {/* Soft gold halo behind the X-convergence (atmosphere) */}
      <circle cx={RED_LINE_X} cy="50" r="6" fill="url(#glm-x-glow)" opacity="0.55" />

      {/* Descending canal — Bezier from the centre of the X-convergence
          curving DOWN-RIGHT into Paradise. */}
      <defs>
        <marker
          id="glm-canal-arrow"
          viewBox="0 0 6 6"
          refX="3"
          refY="3"
          markerWidth="2.6"
          markerHeight="2.6"
          orient="auto"
        >
          <path d="M 0 0 L 6 3 L 0 6 Z" fill="#1c5a7e" />
        </marker>
      </defs>
      <path
        d={`M ${RED_LINE_X + 0.5} 51 Q ${RED_LINE_X + 1.8} 53 ${RED_LINE_X + 3.8} 55`}
        fill="none"
        stroke="#1c5a7e"
        strokeWidth="0.95"
        strokeLinecap="round"
        opacity="0.92"
        markerEnd="url(#glm-canal-arrow)"
      />

      {/* Label — sits in the PARADISE zone (right of Red Line) with a
          short leader pointing back to the convergence point. */}
      <line
        x1={RED_LINE_X + 0.8} y1="50"
        x2={RED_LINE_X + 4.5} y2="48"
        stroke="#1a0d05"
        strokeWidth="0.18"
        opacity="0.7"
      />
      <text
        x={RED_LINE_X + 4.8}
        y="48.3"
        textAnchor="start"
        fontSize="1.5"
        fontWeight="700"
        fill="#1a0d05"
        opacity="0.92"
        letterSpacing="0.18"
        className="glm-reverse-mtn-label"
      >
        Reverse Mountain
      </text>

      {/* Outer parchment border */}
      <rect x="0.5" y="0.5" width="99" height="99" fill="none" stroke="#c4a87a" strokeWidth="0.4" strokeDasharray="1.2 0.6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// BezierVoyagePath — Round 22: replaces the previous em-dash / arrow glyph
// trail with ONE continuous cubic-bezier path.  Each segment between
// waypoints is a smooth `S` curve, control points offset perpendicular to
// the segment direction so revisits (e.g. Water 7 visited twice) get a
// slight Y offset and don't overlap.
//
// Animation: stroke-dashoffset reveal — total path length set as both
// strokeDasharray and strokeDashoffset, then animated to 0 over ~3 s when
// the section enters the viewport.  Replaces the 100-staggered text glyphs
// with a single SVG element (cheaper, smoother, "voyage progressing" feel
// preserved).
// ---------------------------------------------------------------------------
// Round 25 (Phase 3): Reverse Mountain crossing point — central Red Line
// at the X-cut intersection.  Bezier voyage routes through this when crossing
// from Paradise (right of centre) to the New World (left of centre).
const REVERSE_MOUNTAIN_POS: Pos = { x: 51, y: 50 };

/**
 * Build a cubic-bezier `d` string from a list of waypoints.  Uses an
 * `M` move-to followed by alternating `C` / `S` commands.  Control
 * points are derived as midpoints offset perpendicular to the local
 * segment direction (creates a natural "wave" instead of a polyline).
 *
 * `revisitOffsets` is a parallel array of vertical offsets in `%` to
 * apply per waypoint (used for revisits, where 2nd/3rd visit gets a
 * +0.3% Y nudge so the path doesn't draw over itself).
 *
 * `hardCornersAt` is an optional set of segment indices where smooth
 * chaining (`S`) should be replaced by an explicit `C` so the bezier can
 * change direction abruptly without inheriting the previous segment's
 * tangent.  Used for the Reverse Mountain U-turn — without a hard corner
 * there, the mirrored control point pulls the curve westward into the
 * New World, visibly crossing the central Red Line.
 */
function buildBezierPath(
  waypoints: Pos[],
  revisitOffsets: number[],
  hardCornersAt: ReadonlySet<number> = new Set(),
): string {
  if (waypoints.length === 0) return '';
  const adjusted = waypoints.map((p, i) => ({ x: p.x, y: p.y + (revisitOffsets[i] ?? 0) }));
  let d = `M ${adjusted[0].x.toFixed(2)} ${adjusted[0].y.toFixed(2)}`;
  for (let i = 1; i < adjusted.length; i++) {
    const a = adjusted[i - 1];
    const b = adjusted[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    // Perpendicular offset for the control point — alternates sign per
    // segment so the curve weaves gently north / south.
    const sign = i % 2 === 0 ? 1 : -1;
    const perpX = (-dy / len) * sign * 1.2;
    const perpY = (dx / len) * sign * 1.2;
    if (i === 1 || hardCornersAt.has(i)) {
      // Explicit `C` — hard corner.  Both control points set fresh so the
      // direction can change abruptly without smooth-chain inheritance.
      const cx1 = a.x + dx * 0.3 + perpX;
      const cy1 = a.y + dy * 0.3 + perpY;
      const cx2 = a.x + dx * 0.7 + perpX;
      const cy2 = a.y + dy * 0.7 + perpY;
      d += ` C ${cx1.toFixed(2)} ${cy1.toFixed(2)} ${cx2.toFixed(2)} ${cy2.toFixed(2)} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
    } else {
      // S command: smooth chaining — the first control point is the
      // mirror of the previous segment's second control.  Only the
      // second control point is needed.
      const cx2 = a.x + dx * 0.7 + perpX;
      const cy2 = a.y + dy * 0.7 + perpY;
      d += ` S ${cx2.toFixed(2)} ${cy2.toFixed(2)} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
    }
  }
  return d;
}

// Cylindrical-wrap helpers — voyage exits the right edge after Sabaody and
// re-enters the left edge at Fishman Island (the world is a globe; the flat
// map shows it as wrap-around).  These are the points where the voyage path
// touches the canvas edges so the arrow visibly leaves east and arrives west.
const WRAP_EXIT_EAST: Pos = { x: 100, y: 38 };  // east of Sabaody — voyage exits east
const WRAP_ENTER_WEST: Pos = { x: 0, y: 70 };   // west of Fishman — voyage enters west

function BezierVoyagePath({ shipIdx, animate }: { shipIdx: number; animate: boolean }) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathLen, setPathLen] = useState<number>(600);

  // Round 36 — split the voyage into two cylindrical legs:
  //   Paradise leg : Dawn → Reverse Mountain → Whisky → … → (Sabaody | east edge)
  //   New-World leg: west edge → Fishman → … → current
  // Paradise leg is always rendered.  New-World leg only appears once the
  // ship has crossed from Paradise (shipIdx ≥ 9).
  const { paradiseD, newWorldD, endpoint, hasNewWorld } = useMemo(() => {
    const paradiseLast = Math.min(shipIdx, 8);
    const paradiseStops = ALL_ISLAND_POS.slice(0, paradiseLast + 1);
    // Round 36 (follow-up) — Reverse Mountain U-turn anchor.
    // The path must approach the central Red Line from the EAST (Dawn side),
    // touch RM, and reverse back into Paradise WITHOUT crossing into the
    // New World.  Inserting an explicit "depart" anchor just east of RM,
    // combined with a hard-corner at the matching segment index, breaks
    // the smooth-chain mirror that previously pulled the bezier westward.
    const RM_DEPART: Pos = { x: 53.2, y: 49.5 };
    const paradiseWps: Pos[] = [DAWN_ISLAND, REVERSE_MOUNTAIN_POS, RM_DEPART, ...paradiseStops];
    // Hard-corner at the segment LEAVING Reverse Mountain (i = 2 — RM → DEPART)
    // so the curve doesn't smooth-chain into the New World, AND at the next
    // segment (DEPART → first Paradise island) so the post-U-turn direction
    // is set fresh from the east-side anchor.
    const hardCorners = new Set<number>([2, 3]);
    const enteredNewWorld = shipIdx >= 9;
    if (enteredNewWorld) paradiseWps.push(WRAP_EXIT_EAST);
    const paradiseD = buildBezierPath(paradiseWps, paradiseWps.map(() => 0), hardCorners);

    let newWorldD = '';
    let lastEndpoint: Pos = paradiseWps[paradiseWps.length - 1];
    if (enteredNewWorld) {
      const nwStops = ALL_ISLAND_POS.slice(9, shipIdx + 1);
      const nwWps: Pos[] = [WRAP_ENTER_WEST, ...nwStops];
      newWorldD = buildBezierPath(nwWps, nwWps.map(() => 0));
      lastEndpoint = nwWps[nwWps.length - 1];
    }
    return { paradiseD, newWorldD, endpoint: lastEndpoint, hasNewWorld: enteredNewWorld };
  }, [shipIdx]);

  // Measure paradise path length for the dashoffset reveal animation.
  useEffect(() => {
    if (!pathRef.current) return;
    try {
      const len = pathRef.current.getTotalLength();
      if (len > 0) setPathLen(len);
    } catch {
      // ignore — leaves estimate
    }
  }, [paradiseD]);

  return (
    <svg
      className="grand-line-map__path"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="presentation"
      focusable="false"
    >
      <defs>
        <marker
          id="glm-bezier-arrow"
          viewBox="0 0 6 6"
          refX="3"
          refY="3"
          markerWidth="3.4"
          markerHeight="3.4"
          orient="auto"
        >
          <path d="M 0 0 L 6 3 L 0 6 Z" fill="#5a3a1a" opacity="0.95" />
        </marker>
      </defs>
      <path
        ref={pathRef}
        d={paradiseD}
        fill="none"
        stroke="#5a3a1a"
        strokeWidth="0.4"
        strokeLinecap="round"
        strokeDasharray="0.8 0.6"
        markerEnd={hasNewWorld ? undefined : 'url(#glm-bezier-arrow)'}
        opacity={0.9}
        style={
          animate
            ? {
                strokeDasharray: `${pathLen}`,
                strokeDashoffset: pathLen,
                animation: 'glm-bezier-reveal 3000ms cubic-bezier(0.22,1,0.36,1) forwards',
              }
            : undefined
        }
      />
      {newWorldD && (
        <path
          d={newWorldD}
          fill="none"
          stroke="#5a3a1a"
          strokeWidth="0.4"
          strokeLinecap="round"
          strokeDasharray="0.8 0.6"
          markerEnd="url(#glm-bezier-arrow)"
          opacity={0.9}
        />
      )}
      {/* Endpoint dot — marks where the Sunny is right now */}
      <circle cx={endpoint.x} cy={endpoint.y} r="0.6" fill="#c8a040" stroke="#1a0d05" strokeWidth="0.15" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Round 25 (Phase 3) — CloudLinkSkypieaJaya
// Vertical dashed white-to-cyan stroke from Skypiea (sky) down to Jaya (sea),
// with a soft radial glow at Skypiea's bottom (the descending light shaft).
// Pure decorative SVG — no interaction.  Hidden when reduced motion is on
// (the gradient + dash pattern would visually shimmer; keep it static then).
// ---------------------------------------------------------------------------
function CloudLinkSkypieaJaya() {
  // Skypiea (78, 18) → Jaya (78, 70), shaft of light descending.
  const x = 78;
  const yTop = 22; // start just below Skypiea silhouette
  const yBot = 66; // end just above Jaya silhouette
  return (
    <svg
      className="grand-line-map__cloud-link"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="presentation"
      focusable="false"
    >
      <defs>
        <linearGradient id="glm-cloud-link-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#fffaef" stopOpacity="0.9" />
          <stop offset="50%"  stopColor="#9dd6f0" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#5fa6c8" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id="glm-cloud-link-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fffaef" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#fffaef" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Soft glow halo at Skypiea's bottom — descending light shaft origin */}
      <circle cx={x} cy={yTop} r="2.4" fill="url(#glm-cloud-link-glow)" />
      {/* Dashed shaft of light — vertical line, white-to-cyan gradient stroke */}
      <line
        x1={x} y1={yTop} x2={x} y2={yBot}
        stroke="url(#glm-cloud-link-grad)"
        strokeWidth="0.55"
        strokeDasharray="0.9 0.6"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// SeaTrainTracks — two parallel rails between Water 7 (visual right edge ~88)
// and Enies Lobby (visual left edge ~91.5).  Round 36 (follow-up): widened
// from the previous near-invisible 3% span (86 → 89) to a 4% span between
// the actual silhouette edges, with thicker strokes + darker contrast so
// the rail-bed reads from a distance.  Mimics a railroad — distinctive
// from the dashed sea voyage path.
// ---------------------------------------------------------------------------
function SeaTrainTracks() {
  const x1 = 88;     // east edge of Water 7 silhouette
  const x2 = 91.6;   // west edge of Enies Lobby silhouette
  const y = 50;
  const railOffset = 0.55; // vertical separation of the two rails (was 0.35)
  const tieCount = 8;
  const ties: number[] = [];
  for (let i = 0; i <= tieCount; i++) {
    ties.push(x1 + ((x2 - x1) * i) / tieCount);
  }
  return (
    <svg
      className="grand-line-map__sea-train"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      role="presentation"
      focusable="false"
    >
      {/* Soft rail-bed shadow — gives the tracks a "wood deck over water" feel */}
      <rect
        x={x1 - 0.2}
        y={y - railOffset - 0.5}
        width={x2 - x1 + 0.4}
        height={(railOffset + 0.5) * 2}
        fill="#1a0d05"
        opacity="0.18"
        rx="0.3"
      />
      {/* Top rail */}
      <line x1={x1} y1={y - railOffset} x2={x2} y2={y - railOffset}
            stroke="#2a1808" strokeWidth="0.32" strokeLinecap="round" opacity="0.95" />
      {/* Bottom rail */}
      <line x1={x1} y1={y + railOffset} x2={x2} y2={y + railOffset}
            stroke="#2a1808" strokeWidth="0.32" strokeLinecap="round" opacity="0.95" />
      {/* Crossbar ties */}
      {ties.map((tx, i) => (
        <line key={i}
              x1={tx} y1={y - railOffset - 0.35} x2={tx} y2={y + railOffset + 0.35}
              stroke="#5a3a1a" strokeWidth="0.22" strokeLinecap="round" opacity="0.9" />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// IslandSilhouette — clipPath-filled image button.
// Used for ALL 19 islands (Dawn + 9 visited + 9 future).
// ---------------------------------------------------------------------------
type IslandModifier = 'visited' | 'current' | 'active' | 'future' | 'origin';

function IslandSilhouette({
  slug,
  name,
  pos,
  sizePct,
  pathD,
  overlay,
  modifier,
  locked = false,
  ariaLabel,
  ariaExpanded,
  ariaControls,
  imageHrefOverride,
  imageFit = 'slice',
  onClick,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
}: {
  slug: string;
  name: string;
  pos: Pos;
  sizePct: number;
  pathD: string;
  /** Round 25 (Phase 4): optional thematic SVG overlay (raw markup). */
  overlay?: string;
  modifier: IslandModifier;
  locked?: boolean;
  ariaLabel: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  /** Round 36 (follow-up): override the default `islandImageUrl(name)` lookup.
   *  Used by Enies Lobby which has a hand-authored transparent icon instead
   *  of an islands/<slug>.webp photo backdrop. */
  imageHrefOverride?: string;
  /** Round 36 (follow-up): `xMidYMid <fit>` for the photo.  Default 'slice'
   *  fills the silhouette (cropping); 'meet' letterboxes (keeping the whole
   *  image visible against transparent gaps).  Use 'meet' for transparent
   *  PNG icons whose visible content has a different aspect than the
   *  silhouette path. */
  imageFit?: 'slice' | 'meet';
  onClick?: () => void;
  onPointerEnter?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerLeave?: () => void;
  onFocus?: (e: React.FocusEvent<HTMLButtonElement>) => void;
  onBlur?: () => void;
}) {
  const reactId = useId();
  const clipId = `glm-clip-${slug}-${reactId.replace(/[:]/g, '')}`;
  const modifierClass = `glm-isle--${modifier}`;
  return (
    <button
      type="button"
      data-island={slug}
      className={`glm-isle ${modifierClass}${locked ? ' glm-isle--locked' : ''}`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${sizePct}%` }}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="glm-isle__svg">
        <defs>
          <clipPath id={clipId}>
            <path d={pathD} />
          </clipPath>
        </defs>
        <image
          href={imageHrefOverride ?? islandImageUrl(name)}
          x="0"
          y="0"
          width="100"
          height="100"
          preserveAspectRatio={`xMidYMid ${imageFit}`}
          clipPath={`url(#${clipId})`}
        />
        <path d={pathD} className="glm-isle__outline" />
        {locked && (
          <>
            <path d={pathD} className="glm-isle__lock-overlay" />
            <text x="50" y="58" className="glm-isle__lock-glyph">?</text>
          </>
        )}
      </svg>
      {/* Round 26: themed canon icon (cactus, castle, fortress, egg…) is
          rendered as a SMALL BADGE to the upper-right of the silhouette
          instead of overlaid on the photo — keeps the island image
          unobscured while still telegraphing the canon landmark.
          SECURITY NOTE in grandLineIslandShapes.ts — strings are author-
          controlled, never user input. */}
      {overlay && !locked && (
        <span className="glm-isle__icon-badge" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <g dangerouslySetInnerHTML={{ __html: overlay }} />
          </svg>
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Sunny ship marker — Round 19: lower offset, dynamic facing class.
// ---------------------------------------------------------------------------
function SunnyMarker({
  pos,
  motionOn,
  facing,
}: {
  pos: Pos;
  motionOn: boolean;
  facing: 'left' | 'right';
}) {
  const facingClass =
    facing === 'left'
      ? 'grand-line-map__sunny--facing-left'
      : 'grand-line-map__sunny--facing-right';
  return (
    <div
      className={`grand-line-map__sunny ${facingClass}${motionOn ? ' grand-line-map__sunny--bob' : ''}`}
      style={{ left: `${pos.x}%`, top: `${pos.y - 14}%` }}
      aria-hidden="true"
    >
      <img
        src="/assets/One-Piece/Thousand-Sunny-Ship.png"
        alt=""
        decoding="async"
        loading="lazy"
        draggable={false}
      />
      <span className="grand-line-map__sunny-label">Sunny</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Selected popup discriminated union
// ---------------------------------------------------------------------------
type SelectedEntry =
  | { kind: 'skill'; idx: number }
  | { kind: 'origin' }
  | { kind: 'locked'; island: string };

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function GrandLineMap() {
  const motionOn = useMotionOn();
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<SelectedEntry | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pathAnimated, setPathAnimated] = useState(false);
  const [codexOpen, setCodexOpen] = useState(false);
  // Round 26: dynamic fit-zoom — measure viewport on mount/resize and
  // pick the larger of (viewportW / 1900, viewportH / CANVAS_NAT_H) so
  // the canvas fills the dominant axis.  Capped at 1.0 so super-wide
  // displays don't over-stretch beyond the canvas's authoring scale.
  const CANVAS_NAT_W = 1900;
  const CANVAS_NAT_H = (1900 * 13) / 31; // ≈ 796.77, aspect 31/13
  const ZOOM_MAX = 2.0;
  const [zoom, setZoom] = useState<number>(0.65);
  const [fitZoom, setFitZoom] = useState<number>(0.65);
  const setZoomClamped = useCallback((v: number) => {
    setZoom((prev) => {
      const next = Math.max(fitZoom, Math.min(ZOOM_MAX, v));
      return Math.abs(next - prev) < 0.001 ? prev : next;
    });
  }, [fitZoom]);

  // Measure viewport and recompute fitZoom on mount + resize.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const compute = () => {
      const w = vp.clientWidth;
      const h = vp.clientHeight;
      if (w <= 0 || h <= 0) return;
      const horizontalFit = w / CANVAS_NAT_W;
      const verticalFit = h / CANVAS_NAT_H;
      // min-fit guarantees the whole map fits inside the viewport with
      // no overflow on either axis.
      const fit = Math.min(horizontalFit, verticalFit);
      const clamped = Math.min(fit, 1.0);
      setFitZoom((prev) => (Math.abs(prev - clamped) < 0.001 ? prev : clamped));
      setZoom((prev) => (prev < clamped - 0.001 ? clamped : prev));
    };
    compute();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', compute);
      return () => window.removeEventListener('resize', compute);
    }
    const ro = new ResizeObserver(compute);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [CANVAS_NAT_W, CANVAS_NAT_H]);
  const [hoverInfo, setHoverInfo] = useState<{
    name: string;
    domain: string;
    gear: SkillDomain['gear'] | null;
    left: number;
    top: number;
  } | null>(null);
  const detailId = useId();
  const codexPanelId = `glm-codex-panel-${detailId.replace(/[:]/g, '')}`;
  const SKILL_DOMAINS = useGrandLineDomains();
  const FUTURE_ISLANDS_LIVE = useGrandLineFutures();

  const shipIdx = SKILL_DOMAINS.length - 1;

  useEffect(() => {
    if (!motionOn) {
      setPathAnimated(true);
      return;
    }
    const node = viewportRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setPathAnimated(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setPathAnimated(true);
            obs.disconnect();
            return;
          }
        }
      },
      { threshold: 0.25 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [motionOn]);

  useEffect(() => {
    if (selected === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selected]);

  // Drag-to-pan for mouse users on narrow viewports.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    let pressed = false;
    let startX = 0;
    let startY = 0;
    let startScrollLeft = 0;
    let startScrollTop = 0;
    let moved = false;
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if ((e.target as HTMLElement).closest('button, a, [role="button"]')) return;
      // Round 26: only allow drag-pan when the user has zoomed IN past
      // the default fit.  At fit zoom the entire map is visible inside
      // the container, so dragging would just expose empty space — and
      // would interfere with normal click selection of islands.
      if (zoom <= fitZoom + 0.001) return;
      pressed = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      startScrollLeft = vp.scrollLeft;
      startScrollTop = vp.scrollTop;
      try { vp.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!pressed) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
      // Round 26 (refined): with the canvas now sized in pixels (not
      // transform-scaled), the browser's native scroll boundaries match
      // the visual extent automatically — setting scrollLeft/scrollTop
      // past the max gets clamped by the browser, so the user can no
      // longer drag past the map's visible edges.
      vp.scrollLeft = startScrollLeft - dx;
      vp.scrollTop = startScrollTop - dy;
      if (moved && !isDragging) {
        setIsDragging(true);
        setHoverInfo(null);
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!pressed) return;
      pressed = false;
      try { vp.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      requestAnimationFrame(() => setIsDragging(false));
      moved = false;
    };
    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('pointermove', onPointerMove);
    vp.addEventListener('pointerup', onPointerUp);
    vp.addEventListener('pointercancel', onPointerUp);
    return () => {
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('pointermove', onPointerMove);
      vp.removeEventListener('pointerup', onPointerUp);
      vp.removeEventListener('pointercancel', onPointerUp);
    };
    // Round 26: zoom + fitZoom in deps so the drag-disabled-at-fit
    // guard re-binds with current values when the user zooms in/out.
  }, [isDragging, zoom, fitZoom]);

  // Round 22: ctrl/meta + wheel zoom on the viewport.  Pinch-to-zoom on
  // touch is handled via two-finger touchstart/touchmove distance delta.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const delta = -e.deltaY * 0.0015; // tuned for trackpad pinch + mouse wheel
      setZoomClamped(zoom + delta);
    };
    let pinchStartDist = 0;
    let pinchStartZoom = 1;
    const touchDist = (touches: TouchList): number => {
      if (touches.length < 2) return 0;
      const a = touches[0];
      const b = touches[1];
      return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStartDist = touchDist(e.touches);
        pinchStartZoom = zoom;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || pinchStartDist === 0) return;
      e.preventDefault();
      const dist = touchDist(e.touches);
      const ratio = dist / pinchStartDist;
      setZoomClamped(pinchStartZoom * ratio);
    };
    const onTouchEnd = () => {
      pinchStartDist = 0;
    };
    vp.addEventListener('wheel', onWheel, { passive: false });
    vp.addEventListener('touchstart', onTouchStart, { passive: true });
    vp.addEventListener('touchmove', onTouchMove, { passive: false });
    vp.addEventListener('touchend', onTouchEnd);
    return () => {
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('touchstart', onTouchStart);
      vp.removeEventListener('touchmove', onTouchMove);
      vp.removeEventListener('touchend', onTouchEnd);
    };
  }, [zoom, setZoomClamped]);

  // Hover tooltip handler — suppressed during drag.
  function handleHoverEnter(
    e: React.PointerEvent<HTMLButtonElement> | React.FocusEvent<HTMLButtonElement>,
    info: { name: string; domain: string; gear: SkillDomain['gear'] | null },
  ) {
    if (isDragging) return;
    const anchor = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pos = computeTooltipPosition(
      anchor,
      { width: window.innerWidth, height: window.innerHeight },
      { width: 180, height: 80 },
    );
    setHoverInfo({ ...info, left: pos.left, top: pos.top });
  }
  function handleHoverLeave() {
    setHoverInfo(null);
  }

  // Round 25: ALL_ISLAND_POS has 17 entries (9 Paradise + 8 New World).
  // Plus Dawn Island (origin) and Laugh Tale (off-route mystery) = 19 total.
  const totalIslands = ALL_ISLAND_POS.length + 2;

  // Sunny facing — based on next island bearing.
  const currentPos = ALL_ISLAND_POS[shipIdx];
  const nextPos = ALL_ISLAND_POS[shipIdx + 1] ?? null;
  const sunnyFacing = computeSunnyFacing(currentPos, nextPos);

  const selectedDomain =
    selected?.kind === 'skill' ? SKILL_DOMAINS[selected.idx] : null;

  return (
    <div className="grand-line-map" data-testid="grand-line-map">
      <header className="grand-line-map__hero">
        <span className="grand-line-map__eyebrow">
          Skill Expedition · {SKILL_DOMAINS.length} of {totalIslands} islands · Base → Gear 5
        </span>
        <div className="grand-line-map__hero-row">
          <h2 className="grand-line-map__title">The Grand Line — Skill Voyage</h2>
          <button
            type="button"
            className="glm-codex-toggle"
            onClick={() => setCodexOpen((v) => !v)}
            aria-expanded={codexOpen}
            aria-controls={codexPanelId}
          >
            World Codex {codexOpen ? '▴' : '▾'}
          </button>
        </div>
        <p className="grand-line-map__sub">
          Sail from Dawn Island. The Sunny marks where the journey is right now.
          Click any island to open its dossier — drag to explore the parchment.
        </p>
      </header>

      {codexOpen && (
        <section id={codexPanelId} className="glm-codex" aria-label="World Codex">
          {WORLD_CODEX.map((card) => (
            <article key={card.id} className="dossier-card" data-open="true">
              <div className="dossier-card__header">
                <h3 className="dossier-card__title">{card.title}</h3>
              </div>
              <div className="dossier-card__body">
                {/* Round 26: manga-style line formatting.  Each codex line
                    follows a "Label — body" shape (e.g. "Observation Haki
                    — packet sniffing for intent.").  Split on the em-dash
                    so the label can be rendered as a bold display-font
                    subhead, separated from the body — matches the manga
                    info-block aesthetic the user asked for. */}
                {card.body.map((p, i) => {
                  const m = p.match(/^([^—]{2,40})\s*—\s+(.+)$/);
                  if (m) {
                    return (
                      <p key={i} className="glm-codex__line">
                        <strong className="glm-codex__label">{m[1].trim()}</strong>
                        <span className="glm-codex__sep" aria-hidden="true"> — </span>
                        <span>{m[2]}</span>
                      </p>
                    );
                  }
                  return <p key={i} className="glm-codex__line">{p}</p>;
                })}
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Round 26 — Viewport wrapper + sibling toolbar.  The toolbar
          USED to live inside `.grand-line-map__viewport`, but children of
          a scrolling container scroll WITH the container even when they
          are `position:absolute`.  Moving the toolbar out as a SIBLING of
          the viewport (both inside this `__viewport-wrap` div with
          `position:relative`) anchors it to the wrapper's top-right —
          the toolbar now stays put when the user drag-pans the map. */}
      <div className="grand-line-map__viewport-wrap">
        {/* Zoom toolbar — sticks to top-right of the viewport area. */}
        <div className="grand-line-map__zoom-toolbar" role="toolbar" aria-label="Map zoom">
          <button
            type="button"
            className="grand-line-map__zoom-btn"
            onClick={() => setZoomClamped(zoom + 0.2)}
            aria-label="Zoom in"
            disabled={zoom >= ZOOM_MAX - 0.001}
          >
            +
          </button>
          <button
            type="button"
            className="grand-line-map__zoom-btn"
            onClick={() => setZoomClamped(zoom - 0.2)}
            aria-label="Zoom out"
            disabled={zoom <= fitZoom + 0.001}
          >
            −
          </button>
          <button
            type="button"
            className="grand-line-map__zoom-btn grand-line-map__zoom-btn--reset"
            onClick={() => setZoom(fitZoom)}
            aria-label="Reset zoom (fit to view)"
            disabled={Math.abs(zoom - fitZoom) < 0.001}
          >
            ⤾
          </button>
        </div>

        {/* The actual scrolling viewport — toolbar above is now its
            sibling, not its child, so dragging this doesn't move it. */}
        <div
          ref={viewportRef}
          className={[
            'grand-line-map__viewport',
            isDragging && 'grand-line-map__viewport--dragging',
            // Round 26: visual cue that drag is disabled at fit zoom.
            zoom <= fitZoom + 0.001 && 'grand-line-map__viewport--at-fit',
          ].filter(Boolean).join(' ')}
          role="region"
          aria-label="Grand Line voyage map"
        >
        <div
          ref={canvasRef}
          className="grand-line-map__canvas"
          style={{
            // Pixel sizing computed from zoom — layout box matches visual
            // exactly so browser-native scroll boundaries clamp correctly
            // when user drag-pans past the map edge.
            width: `${CANVAS_NAT_W * zoom}px`,
            height: `${CANVAS_NAT_H * zoom}px`,
          }}
        >
          <MapBackground />
          <BezierVoyagePath shipIdx={shipIdx} animate={motionOn && !pathAnimated} />
          <CloudLinkSkypieaJaya />
          <SeaTrainTracks />

          {/* Dawn Island — origin (Round 19: now an interactive silhouette) */}
          {(() => {
            const def = ISLAND_SHAPES['dawn-island'];
            return (
              <IslandSilhouette
                key="dawn-island"
                slug="dawn-island"
                name="Dawn Island"
                pos={DAWN_ISLAND}
                sizePct={def.sizePct}
                pathD={def.pathD}
                overlay={def.overlay}
                modifier="origin"
                ariaLabel="Dawn Island — voyage origin (Luffy's hometown). Click for backstory."
                ariaExpanded={selected?.kind === 'origin'}
                ariaControls={detailId}
                onClick={() =>
                  setSelected((prev) =>
                    prev?.kind === 'origin' ? null : { kind: 'origin' },
                  )
                }
                onPointerEnter={(e) =>
                  handleHoverEnter(e, {
                    name: DAWN_ISLAND_DATA.island,
                    domain: DAWN_ISLAND_DATA.sub,
                    gear: null,
                  })
                }
                onPointerLeave={handleHoverLeave}
                onFocus={(e) =>
                  handleHoverEnter(e, {
                    name: DAWN_ISLAND_DATA.island,
                    domain: DAWN_ISLAND_DATA.sub,
                    gear: null,
                  })
                }
                onBlur={handleHoverLeave}
              />
            );
          })()}

          {/* Real (visited) skill islands — interactive silhouettes */}
          {SKILL_DOMAINS.map((domain, i) => {
            const pos = ALL_ISLAND_POS[i];
            const isSelected = selected?.kind === 'skill' && selected.idx === i;
            const isShip = i === shipIdx;
            const slug = slugifyIsland(domain.island);
            const def = ISLAND_SHAPES[slug];
            if (!def) return null;
            const modifier: IslandModifier = isSelected
              ? 'active'
              : isShip
              ? 'current'
              : 'visited';
            return (
              <IslandSilhouette
                key={domain.island}
                slug={slug}
                name={domain.island}
                pos={pos}
                sizePct={def.sizePct}
                pathD={def.pathD}
                overlay={def.overlay}
                modifier={modifier}
                ariaLabel={`${domain.island} — ${domain.name} — ${domain.gear}.${isShip ? ' Current location.' : ''} Click for skills.`}
                ariaExpanded={isSelected}
                ariaControls={detailId}
                onClick={() =>
                  setSelected((prev) =>
                    prev?.kind === 'skill' && prev.idx === i
                      ? null
                      : { kind: 'skill', idx: i },
                  )
                }
                onPointerEnter={(e) =>
                  handleHoverEnter(e, {
                    name: domain.island,
                    domain: domain.name,
                    gear: domain.gear,
                  })
                }
                onPointerLeave={handleHoverLeave}
                onFocus={(e) =>
                  handleHoverEnter(e, {
                    name: domain.island,
                    domain: domain.name,
                    gear: domain.gear,
                  })
                }
                onBlur={handleHoverLeave}
              />
            );
          })}

          {/* Future placeholder islands — silhouette + outline.
              Round 36: futures come from CMS (live `useGrandLineFutures()`)
              and are filtered against the visited domain names so a freshly-
              promoted island never renders twice.  Position is resolved by
              CANONICAL NAME (ISLAND_POS_BY_NAME) so each island stays in its
              world-map slot regardless of the queue's current length —
              previously the position lookup was `ALL_ISLAND_POS[visitedCount + i]`
              which shifted every future east by one slot on each promotion. */}
          {(() => {
            const visitedNames = new Set(SKILL_DOMAINS.map((d) => d.island));
            return FUTURE_ISLANDS_LIVE.filter((p) => !visitedNames.has(p.island)).map((p: FutureIsland) => {
              const pos = ISLAND_POS_BY_NAME[p.island];
              const slug = slugifyIsland(p.island);
              const def = ISLAND_SHAPES[slug];
              if (!def || !pos) return null;
              return (
                <IslandSilhouette
                  key={p.island}
                  slug={slug}
                  name={p.island}
                  pos={pos}
                  sizePct={def.sizePct}
                  pathD={def.pathD}
                  overlay={def.overlay}
                  modifier="future"
                  ariaLabel={`${p.island} — future skill placeholder — ${p.hint}`}
                  ariaControls={detailId}
                  onPointerEnter={(e) =>
                    handleHoverEnter(e, {
                      name: p.island,
                      domain: '— soon —',
                      gear: p.gear,
                    })
                  }
                  onPointerLeave={handleHoverLeave}
                  onFocus={(e) =>
                    handleHoverEnter(e, {
                      name: p.island,
                      domain: '— soon —',
                      gear: p.gear,
                    })
                  }
                  onBlur={handleHoverLeave}
                />
              );
            });
          })()}

          {/* Round 36 (follow-up) — Enies Lobby uses the hand-authored
              transparent map icon (3-tier vertical: Tower of Justice spire,
              middle plateau with castle, rounded base over the Endless
              Waterfall).  imageFit="meet" so the entire icon is visible
              against transparent letterbox gaps; the silhouette path is a
              tall capsule sized to comfortably contain the visible art.
              Sea-train tracks rendered separately in <SeaTrainTracks/>. */}
          {(() => {
            const def = ISLAND_SHAPES['enies-lobby'];
            if (!def) return null;
            return (
              <IslandSilhouette
                key="enies-lobby"
                slug="enies-lobby"
                name="enies lobby"
                pos={ENIES_LOBBY_POS}
                sizePct={def.sizePct}
                pathD={def.pathD}
                modifier="future"
                imageHrefOverride={ENIES_LOBBY_ICON}
                imageFit="meet"
                ariaLabel="Enies Lobby — judicial fortress, sea-train linked to Water 7"
                onPointerEnter={(e) =>
                  handleHoverEnter(e, {
                    name: 'Enies Lobby',
                    domain: 'Sea-train fortress',
                    gear: null,
                  })
                }
                onPointerLeave={handleHoverLeave}
                onFocus={(e) =>
                  handleHoverEnter(e, {
                    name: 'Enies Lobby',
                    domain: 'Sea-train fortress',
                    gear: null,
                  })
                }
                onBlur={handleHoverLeave}
              />
            );
          })()}

          {/* Round 36: Laugh Tale is now part of the canonical future
              sequence (rightmost slot in the New World, just west of the
              central Red Line) — rendered above by the futures loop using
              ISLAND_POS_BY_NAME['Laugh Tale'].  No longer a separate
              "off-route locked corner". */}

          {/* Thousand Sunny — sits on the LAST visited island */}
          <SunnyMarker pos={currentPos} motionOn={motionOn} facing={sunnyFacing} />
        </div>
      </div>

      {/* Hover tooltip — viewport-fixed; pointer-events:none so it never
          intercepts clicks. */}
      {hoverInfo && (
        <div
          className="glm-tooltip"
          style={{ left: hoverInfo.left, top: hoverInfo.top, position: 'fixed' }}
          role="tooltip"
        >
          <div className="glm-tooltip__name">{hoverInfo.name}</div>
          <div className="glm-tooltip__domain">{hoverInfo.domain}</div>
          {hoverInfo.gear && (
            <span
              className="glm-tooltip__gear"
              style={{
                background: GEAR_COLOR[hoverInfo.gear],
                color: hoverInfo.gear === 'Gear 5' ? '#1a0d05' : '#fffaef',
              }}
            >
              {hoverInfo.gear}
            </span>
          )}
        </div>
      )}

      {/* Round 22: detail popups now render INSIDE an overlay wrapper that
          sits absolutely over the viewport — so the popup is always within
          the bounded map area and doesn't push the page layout down. */}
      {(selectedDomain || selected?.kind === 'origin' || selected?.kind === 'locked') && (
      <div className="grand-line-map__detail-overlay" role="presentation">
      {/* Skill detail popup */}
      {selectedDomain && (
        <div
          id={detailId}
          className="grand-line-map__detail"
          role="region"
          aria-label={`${selectedDomain.name} skills`}
        >
          <header className="grand-line-map__detail-head">
            <div>
              <p className="grand-line-map__detail-island">{selectedDomain.island}</p>
              <h3 className="grand-line-map__detail-domain">{selectedDomain.name}</h3>
              <p className="grand-line-map__detail-lore">{selectedDomain.lore}</p>
            </div>
            <span
              className="grand-line-map__detail-gear"
              style={{
                background: GEAR_COLOR[selectedDomain.gear],
                color: selectedDomain.gear === 'Gear 5' ? '#1a0d05' : '#fffaef',
              }}
            >
              {selectedDomain.gear}
            </span>
            <button
              type="button"
              className="grand-line-map__detail-close"
              onClick={() => setSelected(null)}
              aria-label="Close skill dossier"
            >
              ✕
            </button>
          </header>
          <ul className="grand-line-map__detail-skills">
            {selectedDomain.children.map((leaf) => (
              <li key={leaf.name} className="grand-line-map__detail-skill">
                <div className="grand-line-map__detail-row">
                  <span className="grand-line-map__detail-name">{leaf.name}</span>
                  <span className="grand-line-map__detail-pct">{leaf.proficiency}%</span>
                </div>
                <div className="grand-line-map__detail-bar" aria-hidden="true">
                  <span
                    className="grand-line-map__detail-bar-fill"
                    style={{
                      width: `${leaf.proficiency}%`,
                      background: selectedDomain.color,
                      transition: motionOn ? 'width 600ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
                    }}
                  />
                </div>
                <p className="grand-line-map__detail-desc">{leaf.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Origin (Dawn Island) detail popup */}
      {selected?.kind === 'origin' && (
        <OriginDetailPopup
          id={detailId}
          data={DAWN_ISLAND_DATA}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Locked (Laugh Tale) detail popup */}
      {selected?.kind === 'locked' && (
        <LockedDetailPopup
          id={detailId}
          island={selected.island}
          onClose={() => setSelected(null)}
        />
      )}
      </div>
      )}
      </div>{/* /grand-line-map__viewport-wrap */}

      {/* Screen-reader-only flat list */}
      <ul className="sr-only" aria-label="All islands in voyage order">
        <li>Dawn Island (Origin) — Luffy's hometown, Foosha Village</li>
        {SKILL_DOMAINS.map((d) => (
          <li key={d.island}>
            {d.island} ({d.gear}) — {d.name}
            <ul>
              {d.children.map((leaf) => (
                <li key={leaf.name}>{leaf.name}: {leaf.proficiency}%</li>
              ))}
            </ul>
          </li>
        ))}
        {FUTURE_ISLANDS.map((p) => (
          <li key={p.island}>{p.island} ({p.gear}) — placeholder for future skill</li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Origin / Locked popup sub-components
// ---------------------------------------------------------------------------
function OriginDetailPopup({
  id,
  data,
  onClose,
}: {
  id: string;
  data: OriginIsland;
  onClose: () => void;
}) {
  return (
    <div
      id={id}
      className="grand-line-map__detail grand-line-map__detail--origin"
      role="region"
      aria-label={`${data.island} — origin lore`}
    >
      <header className="grand-line-map__detail-head">
        <div>
          <p className="grand-line-map__detail-island">{data.sub}</p>
          <h3 className="grand-line-map__detail-domain">{data.island}</h3>
          <p className="grand-line-map__detail-lore">{data.lore}</p>
        </div>
        <button
          type="button"
          className="grand-line-map__detail-close"
          onClick={onClose}
          aria-label="Close origin dossier"
        >
          ✕
        </button>
      </header>
      <div className="glm-origin-sections">
        {data.sections.map((section) => (
          <article key={section.title} className="glm-origin-section">
            <h4 className="glm-origin-section__title">{section.title}</h4>
            <p className="glm-origin-section__body">{section.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function LockedDetailPopup({
  id,
  island,
  onClose,
}: {
  id: string;
  island: string;
  onClose: () => void;
}) {
  return (
    <div
      id={id}
      className="grand-line-map__detail grand-line-map__detail--locked"
      role="region"
      aria-label={`${island} — locked`}
    >
      <header className="grand-line-map__detail-head">
        <div>
          <p className="grand-line-map__detail-island">Locked</p>
          <h3 className="grand-line-map__detail-domain">{island}</h3>
          <p className="grand-line-map__detail-lore">
            The legendary final island — still a mystery in canon.
          </p>
        </div>
        <button
          type="button"
          className="grand-line-map__detail-close"
          onClick={onClose}
          aria-label="Close locked dossier"
        >
          ✕
        </button>
      </header>
      <p className="glm-locked-body">
        The four Road Poneglyphs reveal Laugh Tale only when their
        coordinates intersect. Until the crew gathers all four, the path
        stays hidden.
      </p>
    </div>
  );
}
