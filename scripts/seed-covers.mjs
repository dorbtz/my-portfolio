/**
 * scripts/seed-covers.mjs
 *
 * Generates 6 placeholder WebP cover images for the themed seed projects.
 * Each image is 1280x720 with a themed gradient background and an SVG text
 * overlay containing the project title and a mode glyph.
 *
 * Usage (run once after installing sharp as a dev dependency):
 *   npm install --save-dev sharp
 *   node scripts/seed-covers.mjs
 *
 * Output: public/seed/<slug>.webp
 *
 * The script is idempotent — re-running overwrites existing files.
 * Do NOT commit node_modules or the npm install output; commit only the
 * generated .webp files under public/seed/.
 *
 * Fallback note:
 *   If sharp fails to install on Windows (native binary issues), the script
 *   will automatically write .svg files instead and print a warning. In that
 *   case update supabase/seed/001_themed_projects.sql cover_url values from
 *   /seed/<slug>.webp to /seed/<slug>.svg (a comment in that file documents
 *   this deviation).
 */

import { createRequire } from 'module';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'public', 'seed');
const WIDTH = 1280;
const HEIGHT = 720;

// ─── Project definitions ──────────────────────────────────────────────────────
// Each project maps to a visual theme.
// Thor-themed projects: dark blue / crimson / gold palette  ⚡
// One Piece / Gear 5 themed projects: white / gold / sky-blue palette  ☀
const PROJECTS = [
  {
    slug: 'mjolnir-ui-kit',
    title: 'Mjolnir UI Kit',
    glyph: '⚡',
    // Dark Asgardian blue to deep crimson gradient
    gradientStops: [
      { offset: 0,   color: '#0a0e2a' },
      { offset: 0.5, color: '#1a1040' },
      { offset: 1,   color: '#4a1020' },
    ],
    textColor: '#e5c84a',     // Asgardian gold
    glyphColor: '#e5c84a',
    accentLine: '#e5351a',    // Thor red
  },
  {
    slug: 'bifrost-analytics',
    title: 'Bifrost Analytics',
    glyph: '⚡',
    // Deep navy to violet — Bifrost prismatic
    gradientStops: [
      { offset: 0,   color: '#050a1a' },
      { offset: 0.4, color: '#0a1a50' },
      { offset: 1,   color: '#2a0a4a' },
    ],
    textColor: '#1aa0e6',     // Bifrost blue
    glyphColor: '#1aa0e6',
    accentLine: '#a020d0',    // violet
  },
  {
    slug: 'gear-5-design-system',
    title: 'Gear 5 Design System',
    glyph: '☀',
    // White to warm cream to gold — Sun God Nika
    gradientStops: [
      { offset: 0,   color: '#fffdf5' },
      { offset: 0.5, color: '#fff8e0' },
      { offset: 1,   color: '#fde98a' },
    ],
    textColor: '#a06000',     // deep gold
    glyphColor: '#d4980a',
    accentLine: '#e8a020',
  },
  {
    slug: 'den-den-mushi-realtime',
    title: 'Den Den Mushi Chat',
    glyph: '☀',
    // Sky blue to light aqua — Grand Line seas
    gradientStops: [
      { offset: 0,   color: '#e8f6ff' },
      { offset: 0.5, color: '#b8e8ff' },
      { offset: 1,   color: '#7dcef0' },
    ],
    textColor: '#104080',     // deep sea blue
    glyphColor: '#d4980a',
    accentLine: '#2080c0',
  },
  {
    slug: 'asgard-ecommerce',
    title: 'Asgard Ecommerce',
    glyph: '⚡',
    // Dark slate to warm black — Norse forge
    gradientStops: [
      { offset: 0,   color: '#0a0808' },
      { offset: 0.5, color: '#1a1410' },
      { offset: 1,   color: '#2a1e0a' },
    ],
    textColor: '#d4b060',     // hammered gold
    glyphColor: '#d4b060',
    accentLine: '#8a6020',
  },
  {
    slug: 'wano-cms',
    title: 'Wano CMS',
    glyph: '☀',
    // Ochre / vermilion — ukiyo-e Wano woodblock
    gradientStops: [
      { offset: 0,   color: '#f5e8c8' },
      { offset: 0.5, color: '#e8c080' },
      { offset: 1,   color: '#c85020' },
    ],
    textColor: '#200808',     // ink black-red
    glyphColor: '#c82020',
    accentLine: '#801000',
  },
];

// ─── SVG template ─────────────────────────────────────────────────────────────
function buildSvg(project) {
  const { gradientStops, title, textColor, glyphColor, accentLine, glyph } = project;

  const stops = gradientStops
    .map(s => `<stop offset="${s.offset}" stop-color="${s.color}" />`)
    .join('\n      ');

  // Wrap long titles by splitting at spaces
  const words = title.split(' ');
  let lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length > 16 && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  const lineHeight = 80;
  const totalTextHeight = lines.length * lineHeight;
  const startY = (HEIGHT / 2) - (totalTextHeight / 2) + lineHeight / 2;

  const textEls = lines
    .map((line, i) =>
      `<text x="640" y="${startY + i * lineHeight}" text-anchor="middle"
           font-family="'Segoe UI', Arial, sans-serif"
           font-size="72" font-weight="800" letter-spacing="2"
           fill="${textColor}"
           paint-order="stroke"
           stroke="#00000055" stroke-width="4">${line}</text>`)
    .join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      ${stops}
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />

  <!-- Decorative accent line -->
  <line x1="80" y1="${HEIGHT - 80}" x2="${WIDTH - 80}" y2="${HEIGHT - 80}"
        stroke="${accentLine}" stroke-width="3" opacity="0.6" />
  <line x1="80" y1="80" x2="${WIDTH - 80}" y2="80"
        stroke="${accentLine}" stroke-width="1" opacity="0.3" />

  <!-- Corner badge -->
  <circle cx="${WIDTH - 60}" cy="60" r="36" fill="${glyphColor}" opacity="0.15" />
  <text x="${WIDTH - 60}" y="76" text-anchor="middle"
        font-size="36">${glyph}</text>

  <!-- Project title -->
  ${textEls}

  <!-- Slug label (bottom-left) -->
  <text x="80" y="${HEIGHT - 48}"
        font-family="'Courier New', monospace" font-size="22" letter-spacing="1"
        fill="${textColor}" opacity="0.55">${project.slug}</text>
</svg>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Attempt to load sharp (dev dependency).
  let sharp;
  try {
    const require = createRequire(import.meta.url);
    sharp = require('sharp');
    console.log('sharp loaded — generating WebP files.');
  } catch {
    console.warn(
      'WARNING: sharp is not available. Falling back to SVG output.\n' +
      'Install sharp with: npm install --save-dev sharp\n' +
      'Then re-run: node scripts/seed-covers.mjs\n' +
      'If you keep the SVG files, update cover_url paths in\n' +
      '  supabase/seed/001_themed_projects.sql\n' +
      'from /seed/<slug>.webp  →  /seed/<slug>.svg'
    );
    sharp = null;
  }

  for (const project of PROJECTS) {
    const svg = buildSvg(project);

    if (sharp) {
      const outPath = join(OUTPUT_DIR, `${project.slug}.webp`);
      await sharp(Buffer.from(svg))
        .resize(WIDTH, HEIGHT)
        .webp({ quality: 85 })
        .toFile(outPath);
      console.log(`  ✓  ${project.slug}.webp`);
    } else {
      // SVG fallback — saves as .svg (NOT .webp)
      const outPath = join(OUTPUT_DIR, `${project.slug}.svg`);
      writeFileSync(outPath, svg, 'utf8');
      console.log(`  ✓  ${project.slug}.svg  (SVG fallback)`);
    }
  }

  console.log(`\nDone. ${PROJECTS.length} cover files written to public/seed/`);
  if (!sharp) {
    console.warn(
      '\nRemember: update supabase/seed/001_themed_projects.sql cover_url\n' +
      'values to use .svg extension if keeping the SVG fallback files.'
    );
  }
}

main().catch(err => {
  console.error('seed-covers.mjs failed:', err);
  process.exit(1);
});
