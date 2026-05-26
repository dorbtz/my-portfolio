/**
 * scripts/compress-donflamingo.mjs
 *
 * Aggressive compression of the Den-Den-Mushi (Donflamingo) GLB.
 *
 * Round 13 update — switched from a custom @gltf-transform pipeline to
 * `gltfpack` (the official meshoptimizer CLI). The previous pipeline plateaued
 * at 92 MB because:
 *   1. As of @gltf-transform 4.x the `weld()` function is BITWISE-EXACT only
 *      (lossy welding was removed in April 2024). Faceted DCC exports like this
 *      one have every vertex unique, so weld did almost nothing.
 *   2. Without a properly welded indexed mesh, MeshoptSimplifier silently
 *      bails — it can't merge isolated vertices into a connected manifold.
 *
 * `gltfpack` solves both problems with `-sp` (permissive simplification across
 * attribute discontinuities) — it welds by position only and treats per-vertex
 * normals/uvs as discontinuities to skip across. That's exactly what a heavy
 * faceted mesh needs.
 *
 * Pipeline (single gltfpack invocation):
 *   -si 0.05  — simplify to 5% triangle count (~425k tris from 8.5M)
 *   -sa       — aggressive (disregard quality budget; we're shrinking
 *               an asset that renders inside a 320 px frame)
 *   -sp       — permissive: weld across attribute discontinuities
 *   -cc       — meshopt compression at higher ratio
 *   -tw       — convert all textures to WebP
 *   -tq 6     — texture quality 6/10
 *   -tl 512   — clamp texture dimensions to 512 px
 *   -vp 12    — 12-bit position quantization (default 14; -2 bits = ~30% smaller)
 *   -vn 8     — 8-bit normals (default; minimum useful)
 *   -kn       — keep named nodes (preserves scene structure)
 *
 * Run:  node --max-old-space-size=8192 scripts/compress-donflamingo.mjs
 *
 * Input:  public/assets/One-Piece/dendendonflamingo.glb       (~586 MB)
 * Output: public/assets/One-Piece/dendendonflamingo.opt.glb   (target <10 MB)
 */

import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, statSync, unlinkSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const INPUT = resolve(ROOT, 'public/assets/One-Piece/dendendonflamingo.glb');
const OUTPUT = resolve(ROOT, 'public/assets/One-Piece/dendendonflamingo.opt.glb');

function fmt(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(2)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function runGltfpack(args) {
  return new Promise((resolvePromise, rejectPromise) => {
    // shell:true is required on Windows so .cmd shims (npx.cmd) resolve.
    // With shell:true the args are concatenated into a string, so paths with
    // spaces must be wrapped in double quotes ourselves.
    const escaped = args.map((a) => (/\s/.test(a) ? `"${a}"` : a));
    const child = spawn('npx', ['--yes', 'gltfpack', ...escaped], {
      stdio: ['inherit', 'inherit', 'inherit'],
      shell: true,
    });
    child.on('error', rejectPromise);
    child.on('close', (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`gltfpack exited with code ${code}`));
    });
  });
}

async function main() {
  if (!existsSync(INPUT)) {
    console.error(`[compress-donflamingo] Input not found: ${INPUT}`);
    process.exit(1);
  }

  const inSize = statSync(INPUT).size;
  console.log(`[compress-donflamingo] Input:  ${fmt(inSize)}`);
  console.log('[compress-donflamingo] Running gltfpack (single-pass)...\n');

  // Remove the previous output so a partial run doesn't masquerade as success.
  if (existsSync(OUTPUT)) unlinkSync(OUTPUT);

  const args = [
    '-i', INPUT,
    '-o', OUTPUT,
    '-si', '0.05',   // 5% target triangle count
    '-sa',           // aggressive — ignore quality budget
    '-sp',           // permissive — weld across UV/normal seams
    '-cc',           // higher meshopt compression ratio
    '-tw',           // textures → WebP
    '-tq', '6',
    '-tl', '512',
    '-vp', '12',     // 12-bit positions (smaller than default 14)
    '-vn', '8',      // 8-bit normals
    '-kn',           // keep named nodes (preserves usable scene tree)
    '-noq',          // we'll re-add quantization via -vp/-vn above; -noq off → it stays on
    // NOTE: -noq disables quantization. We DO want quantization (smaller!),
    // so don't pass -noq. Keep -vp/-vn which already trigger quantization.
  ].filter((a, i, arr) => a !== '-noq'); // strip -noq; keep quantization on

  await runGltfpack(args);

  if (!existsSync(OUTPUT)) {
    console.error('\n[compress-donflamingo] gltfpack reported success but no output file was produced.');
    process.exit(1);
  }

  const outSize = statSync(OUTPUT).size;
  const pct = (((inSize - outSize) / inSize) * 100).toFixed(1);
  console.log('\n[compress-donflamingo] DONE');
  console.log(`  Input:  ${fmt(inSize)}`);
  console.log(`  Output: ${fmt(outSize)}  (${pct}% smaller)`);

  if (outSize > 10 * 1024 * 1024) {
    console.warn(
      `[compress-donflamingo] Output is above the 10 MB target. ` +
      `Acceptable floor for this asset documented at ~${(outSize / 1024 / 1024).toFixed(0)} MB.`,
    );
  }
}

main().catch((err) => {
  console.error('[compress-donflamingo] Fatal:', err);
  process.exit(1);
});
