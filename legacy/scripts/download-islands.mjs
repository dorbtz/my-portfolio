/**
 * scripts/download-islands.mjs
 *
 * One-shot downloader for the 19 canonical One Piece island infobox images
 * used by the Grand Line skills map. Sources the Fandom CDN
 * (`static.wikia.nocookie.net`) — every URL was verified by the research
 * pass before being baked into this file.
 *
 * Run:  node scripts/download-islands.mjs        (or `npm run download:islands`)
 *
 * Output: public/assets/One-Piece/islands/<slug>.webp  (19 files, ~1.5 MB total)
 *
 * Idempotent — already-downloaded files are skipped unless --force is passed.
 */

import { mkdir, writeFile, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'public/assets/One-Piece/islands');

// ---- Verified Fandom CDN URLs (research pass May 2026) ---------------------
const ISLANDS = [
  { slug: 'dawn-island',       url: 'https://static.wikia.nocookie.net/onepiece/images/9/90/Dawn_Island_Infobox.png/revision/latest?cb=20250713070701' },
  { slug: 'whiskey-peak',      url: 'https://static.wikia.nocookie.net/onepiece/images/6/6c/Whisky_Peak_Infobox.png/revision/latest?cb=20240721131258' },
  { slug: 'little-garden',     url: 'https://static.wikia.nocookie.net/onepiece/images/9/9d/Little_Garden_Infobox.png/revision/latest?cb=20130824200211' },
  { slug: 'drum-island',       url: 'https://static.wikia.nocookie.net/onepiece/images/1/15/Drum_Island_Infobox.png/revision/latest?cb=20121118103731' },
  { slug: 'alabasta',          url: 'https://static.wikia.nocookie.net/onepiece/images/2/29/Arabasta_Kingdom_Infobox.png/revision/latest?cb=20240103024400' },
  { slug: 'jaya',              url: 'https://static.wikia.nocookie.net/onepiece/images/3/36/Jaya_Infobox.png/revision/latest?cb=20130413194408' },
  { slug: 'skypiea',           url: 'https://static.wikia.nocookie.net/onepiece/images/4/44/Skypiea_Infobox.png/revision/latest?cb=20240828012701' },
  { slug: 'water-7',           url: 'https://static.wikia.nocookie.net/onepiece/images/9/93/Water_7_Infobox.png/revision/latest?cb=20160819212754' },
  { slug: 'thriller-bark',     url: 'https://static.wikia.nocookie.net/onepiece/images/3/37/Thriller_Bark_Infobox.png/revision/latest?cb=20230118010929' },
  { slug: 'sabaody',           url: 'https://static.wikia.nocookie.net/onepiece/images/c/ca/Sabaody_Archipelago_Infobox.png/revision/latest?cb=20151021143218' },
  { slug: 'fishman-island',    url: 'https://static.wikia.nocookie.net/onepiece/images/7/78/Fish-Man_Island_Infobox.png/revision/latest?cb=20241201020830' },
  { slug: 'punk-hazard',       url: 'https://static.wikia.nocookie.net/onepiece/images/3/3a/Punk_Hazard_Infobox.png/revision/latest?cb=20150211161528' },
  { slug: 'dressrosa',         url: 'https://static.wikia.nocookie.net/onepiece/images/0/06/Dressrosa_Infobox.png/revision/latest?cb=20221116144641' },
  { slug: 'zou',               url: 'https://static.wikia.nocookie.net/onepiece/images/7/72/Zou_Infobox.png/revision/latest?cb=20160911164033' },
  { slug: 'whole-cake-island', url: 'https://static.wikia.nocookie.net/onepiece/images/6/61/Whole_Cake_Island_Infobox.png/revision/latest?cb=20181021025602' },
  { slug: 'wano-country',      url: 'https://static.wikia.nocookie.net/onepiece/images/c/ca/Wano_Country_Infobox.png/revision/latest?cb=20230813113201' },
  { slug: 'egghead',           url: 'https://static.wikia.nocookie.net/onepiece/images/0/07/Egghead_Infobox.png/revision/latest?cb=20250428024126' },
  { slug: 'elbaph',            url: 'https://static.wikia.nocookie.net/onepiece/images/0/0b/Elbaph_Infobox.png/revision/latest?cb=20260503161427' },
  { slug: 'laugh-tale',        url: 'https://static.wikia.nocookie.net/onepiece/images/5/50/Laugh_Tale_Infobox.png/revision/latest?cb=20190720071407' },
];

const force = process.argv.includes('--force');

function fmt(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function downloadOne({ slug, url }) {
  const out = resolve(OUT_DIR, `${slug}.webp`);
  if (!force && (await exists(out))) {
    return { slug, skipped: true };
  }
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; portfolio-island-bot)' },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  // Sanity check — Fandom serves WebP but the URL ends in .png. Verify the
  // RIFF/WEBP magic bytes so we don't accidentally save a 404 HTML page.
  const isWebp =
    buf.length > 12 &&
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
  if (!isWebp) {
    throw new Error(`response is not WebP (${buf.length} bytes)`);
  }
  await writeFile(out, buf);
  return { slug, bytes: buf.length };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`[islands] Output dir: ${OUT_DIR}`);
  console.log(`[islands] Downloading ${ISLANDS.length} images${force ? ' (force re-download)' : ''}...\n`);

  let totalBytes = 0;
  let okCount = 0;
  let skipCount = 0;
  const failures = [];

  for (const island of ISLANDS) {
    try {
      const result = await downloadOne(island);
      if (result.skipped) {
        console.log(`  · ${island.slug.padEnd(20)} skipped (already exists)`);
        skipCount++;
      } else {
        console.log(`  ✓ ${island.slug.padEnd(20)} ${fmt(result.bytes)}`);
        totalBytes += result.bytes;
        okCount++;
      }
    } catch (err) {
      console.error(`  ✗ ${island.slug.padEnd(20)} FAIL: ${err.message}`);
      failures.push(island.slug);
    }
  }

  console.log(`\n[islands] Done.`);
  console.log(`  Downloaded: ${okCount}  Skipped: ${skipCount}  Failed: ${failures.length}`);
  console.log(`  Total new bytes: ${fmt(totalBytes)}`);
  if (failures.length) {
    console.error(`  Failed slugs: ${failures.join(', ')}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[islands] Fatal:', err);
  process.exit(1);
});
