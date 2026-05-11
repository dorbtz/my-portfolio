/**
 * src/data/projectCharacters.ts
 * Per-project character art for the ProjectCard overlay.
 *
 * Luffy mode: Straw Hat crew — small character glyph in the corner of each
 *   wanted poster. For local crew portraits we have, use them. For everyone
 *   else, the overlay falls back to a styled name badge (matching the
 *   existing Avengers fallback path) — keeps the wanted-poster aesthetic
 *   without depending on flaky external CDN hot-links.
 *
 * Thor mode: Avengers — only the Marvel/Mjolnir source images that actually
 *   exist on disk are referenced. Slugs without a matching image use the
 *   text-badge fallback (handled by CharacterOverlay's onError).
 *
 * Asset organization (post-folder reorganization):
 *   - /assets/Marvel/          — Marvel/MCU images, mjolnir.png, heimdall.glb
 *   - /assets/One-Piece/       — One Piece character images
 *   - /assets/One-Piece/wanted — wanted poster PNGs (capitalized)
 */

export type CharacterArt = {
  /** Optional image src — when missing OR 404, the badge fallback shows. */
  src?: string;
  alt: string;
  /** Display name shown in the fallback badge. */
  name: string;
  webpSmall?: string;
};

export type AvengerPlaceholder = {
  name: string;
  src?: string;
  alt: string;
};

// =============================================================================
// Straw Hat crew → wanted-card overlay
// =============================================================================
export const STRAW_HAT_BY_PROJECT: Record<string, CharacterArt> = {
  // Captain — local Luffy asset
  'straw-hat-luffy': {
    src: '/assets/One-Piece/Monkey-D-Luffy-Mugiwara-453.webp',
    alt: 'Monkey D. Luffy (Mugiwara)',
    name: 'LUFFY',
    webpSmall: '/assets/One-Piece/Monkey-D-Luffy-Mugiwara-453@small.webp',
  },
  // Swordsman — text badge fallback (no local asset)
  'straw-hat-zoro': {
    name: 'ZORO',
    alt: 'Roronoa Zoro',
  },
  // Navigator — text badge fallback
  'straw-hat-nami': {
    name: 'NAMI',
    alt: 'Nami the Navigator',
  },
  // Sniper — text badge fallback
  'straw-hat-usopp': {
    name: 'USOPP',
    alt: 'Usopp / God Usopp',
  },
  // Cook — text badge fallback
  'straw-hat-sanji': {
    name: 'SANJI',
    alt: 'Vinsmoke Sanji',
  },
  // Doctor — text badge fallback
  'straw-hat-chopper': {
    name: 'CHOPPER',
    alt: 'Tony Tony Chopper',
  },
  // Archaeologist — text badge fallback
  'straw-hat-robin': {
    name: 'ROBIN',
    alt: 'Nico Robin',
  },
  // Shipwright — text badge fallback
  'straw-hat-franky': {
    name: 'FRANKY',
    alt: 'Franky / Cutty Flam',
  },
  // Musician — text badge fallback
  'straw-hat-brook': {
    name: 'BROOK',
    alt: 'Brook / Soul King',
  },
  // Helmsman — text badge fallback
  'straw-hat-jinbe': {
    name: 'JINBE',
    alt: 'Jinbe — Knight of the Sea',
  },

  // ---- Legacy/admin slugs (kept for backwards compat with Supabase rows) ----
  'mjolnir-ui-kit': {
    src: '/assets/One-Piece/Monkey-D-Luffy-Mugiwara-453.webp',
    alt: 'Luffy (Mugiwara)',
    name: 'LUFFY',
    webpSmall: '/assets/One-Piece/Monkey-D-Luffy-Mugiwara-453@small.webp',
  },
  'bifrost-analytics': {
    src: '/assets/One-Piece/Monkey-D-Luffy-One-Piece-Anime-Pirate-Captain-1105.webp',
    alt: 'Captain Luffy',
    name: 'LUFFY',
    webpSmall: '/assets/One-Piece/Monkey-D-Luffy-One-Piece-Anime-Pirate-Captain-1105@small.webp',
  },
  'gear-5-design-system': {
    src: '/assets/One-Piece/Luffy-Gear-5-Joy-Boy-One-Piece-Monkey-D-Luffy-transparent-PNG-image.webp',
    alt: 'Luffy Gear 5',
    name: 'GEAR 5',
    webpSmall: '/assets/One-Piece/Luffy-Gear-5-Joy-Boy-One-Piece-Monkey-D-Luffy-transparent-PNG-image@small.webp',
  },
  'den-den-mushi-realtime': {
    src: '/assets/One-Piece/Monkey-D-Luffy-Gear-5-Joy-Boy-Transformation-4818.webp',
    alt: 'Gear 5 transformation',
    name: 'GEAR 5',
    webpSmall: '/assets/One-Piece/Monkey-D-Luffy-Gear-5-Joy-Boy-Transformation-4818@small.webp',
  },
  'asgard-ecommerce': {
    src: '/assets/One-Piece/Portgas-D-Ace-One-Piece-4523.webp',
    alt: 'Portgas D. Ace',
    name: 'ACE',
    webpSmall: '/assets/One-Piece/Portgas-D-Ace-One-Piece-4523@small.webp',
  },
  'wano-cms': {
    src: '/assets/One-Piece/Monkey-D-Luffy-One-Piece-8465.webp',
    alt: 'Luffy',
    name: 'LUFFY',
    webpSmall: '/assets/One-Piece/Monkey-D-Luffy-One-Piece-8465@small.webp',
  },
};

// =============================================================================
// Avenger placeholders (Thor mode)
// Only entries with a `src` for an asset that actually exists on disk are
// included. Other entries have just `name` so the CharacterOverlay shows a
// styled text badge. The /assets/avengers/<char>.webp images were never
// shipped — substituting mjolnir.png / marvel-logo for the slugs that
// previously pointed there means the user always sees a real image instead
// of a 404 → text-badge fallback.
// =============================================================================
export const AVENGER_BY_PROJECT: Record<string, AvengerPlaceholder> = {
  // ---- Thor canon fixtures ----
  // Each slug maps to a real character PNG present on disk under
  // /public/assets/Marvel/. These were all swapped in May 2026 when the
  // Marvel asset folder was refreshed (see deliverable mapping notes).
  'mjolnir-ui-forge':  { name: 'THOR',     src: '/assets/Marvel/thor-strike.png',     alt: 'Thor wielding Mjolnir' },
  // Heimdall is shipped as a 3D model (heimdall.glb) — not an image. Use
  // the all-mighty Thor portrait as the visual stand-in for the Bifrost.
  'bifrost-pipeline':  { name: 'HEIMDALL', src: '/assets/Marvel/thor-almigthy.png',   alt: 'Thor Almighty — Bifrost guardian' },
  'stormbreaker-ci':   { name: 'CAPTAIN',  src: '/assets/Marvel/captain-america.png', alt: 'Captain America — CI/CD shield' },
  'asgard-codex':      { name: 'IRON MAN', src: '/assets/Marvel/ironman.png',         alt: 'Iron Man — the codex of intellect' },
  'lokis-mirror':      { name: 'MAGNETO',  src: '/assets/Marvel/magneto.png',         alt: 'Magneto — manipulation incarnate' },
  'yggdrasil-atlas':   { name: 'SPIDER',   src: '/assets/Marvel/spiderman.png',       alt: 'Spider-Man — web of data' },

  // ---- Legacy slugs (kept for backwards compat with older Supabase rows) ----
  'mjolnir-ui-kit':         { name: 'THOR',            src: '/assets/Marvel/thor-strike.png',     alt: 'Thor wielding Mjolnir' },
  'bifrost-analytics':      { name: 'HEIMDALL',        src: '/assets/Marvel/thor-almigthy.png',   alt: 'Thor Almighty — Bifrost guardian' },
  'gear-5-design-system':   { name: 'IRON MAN',        src: '/assets/Marvel/ironman.png',         alt: 'Iron Man' },
  'den-den-mushi-realtime': { name: 'BLACK WIDOW',     src: '/assets/Marvel/black-widow.png',     alt: 'Black Widow' },
  'asgard-ecommerce':       { name: 'MAGNETO',         src: '/assets/Marvel/magneto.png',         alt: 'Magneto' },
  'wano-cms':               { name: 'CAPTAIN AMERICA', src: '/assets/Marvel/captain-america.png', alt: 'Captain America' },
};
