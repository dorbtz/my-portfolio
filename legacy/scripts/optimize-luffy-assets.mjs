/**
 * scripts/optimize-luffy-assets.mjs
 *
 * Convert the large Luffy / One Piece PNG assets in public/assets/ into
 * smaller WebP versions. Original PNGs stay on disk so any consumer can
 * still <img src=*.png> as a fallback.
 *
 * Usage:
 *   npm run build:assets
 *   (or directly: node scripts/optimize-luffy-assets.mjs)
 *
 * Generates a paired .webp file next to each input PNG. A second size
 * ("@small.webp") is also produced for use as a thumbnail / blur-up.
 */

import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = path.resolve(__dirname, '..', 'public', 'assets');

// Patterns to optimize. We avoid touching mjolnir.png (already small) and
// any GLB models. We DO optimize the user-dropped Luffy / One Piece / Marvel PNGs.
const TARGET_PATTERNS = [
  /^Luffy-/i,
  /^Monkey-D/i,
  /^Gomu-Gomu/i,
  /^Portgas-/i,
  /^One-Piece-Logo/i,
  /^nika-symbol/i,
  /^marvel-/i,
];

const SIZES = [
  { suffix: '', maxWidth: 1200, quality: 82 },
  { suffix: '@small', maxWidth: 480, quality: 78 },
];

async function main() {
  const files = await readdir(ASSETS_DIR);
  const pngs = files.filter(
    (f) =>
      /\.png$/i.test(f) && TARGET_PATTERNS.some((re) => re.test(f))
  );

  if (pngs.length === 0) {
    console.log('No matching PNGs to optimize.');
    return;
  }

  console.log(`Optimizing ${pngs.length} PNG(s) → WebP\n`);

  let totalIn = 0;
  let totalOut = 0;

  for (const png of pngs) {
    const input = path.join(ASSETS_DIR, png);
    const inSize = (await stat(input)).size;
    totalIn += inSize;

    for (const { suffix, maxWidth, quality } of SIZES) {
      const baseName = path.basename(png, path.extname(png));
      const outName = `${baseName}${suffix}.webp`;
      const output = path.join(ASSETS_DIR, outName);

      await sharp(input)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality, effort: 5 })
        .toFile(output);

      const outSize = (await stat(output)).size;
      totalOut += outSize;
      const ratio = ((1 - outSize / inSize) * 100).toFixed(1);
      console.log(
        `  ${png}` +
          (suffix ? ` (${suffix.replace('@', '')})` : '') +
          ` → ${outName}: ${(outSize / 1024).toFixed(0)} kB (${ratio}% smaller)`
      );
    }
  }

  console.log(
    `\nTotal: ${(totalIn / 1024).toFixed(0)} kB in → ${(totalOut / 1024).toFixed(0)} kB out` +
      ` (${((1 - totalOut / totalIn) * 100).toFixed(1)}% reduction)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
