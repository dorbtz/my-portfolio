/**
 * scripts/optimize-models.mjs
 * Asset compression pipeline for GLB models.
 * Produces Draco-compressed and meshopt-encoded variants of the Thor hammer.
 *
 * Run:  node scripts/optimize-models.mjs
 *       npm run build:models
 *
 * Outputs:
 *   public/assets/thor-hammer.draco.glb   — Draco geometry compression
 *   public/assets/thor-hammer.meshopt.glb — EXT_meshopt_compression
 *
 * The original public/assets/thor-hammer.glb is NOT modified; it stays as the
 * <model-viewer> fallback for low/mid capability tiers.
 */

import { NodeIO } from '@gltf-transform/core';
import { KHRDracoMeshCompression, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { draco, meshopt, dedup, prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { MeshoptEncoder } from 'meshoptimizer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, statSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const INPUT = resolve(ROOT, 'public/assets/thor-hammer.glb');
const OUT_DRACO = resolve(ROOT, 'public/assets/thor-hammer.draco.glb');
const OUT_MESHOPT = resolve(ROOT, 'public/assets/thor-hammer.meshopt.glb');

// ---- helpers ----------------------------------------------------------------

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function report(label, inputPath, outputPath) {
  const inSize = statSync(inputPath).size;
  const outSize = statSync(outputPath).size;
  const pct = (((inSize - outSize) / inSize) * 100).toFixed(1);
  console.log(
    `  ${label}: ${formatBytes(inSize)} → ${formatBytes(outSize)} (${pct}% smaller)`
  );
}

// ---- main -------------------------------------------------------------------

async function main() {
  if (!existsSync(INPUT)) {
    console.error(`[optimize-models] Input not found: ${INPUT}`);
    process.exit(1);
  }

  console.log('[optimize-models] Initialising...');

  // Initialise draco encoder/decoder modules
  const dracoEncoder = await draco3d.createEncoderModule();
  const dracoDecoder = await draco3d.createDecoderModule();

  // Initialise meshopt encoder
  await MeshoptEncoder.ready;

  // ---- Draco variant --------------------------------------------------------
  console.log('[optimize-models] Compressing with Draco...');
  {
    const io = new NodeIO()
      .registerExtensions([KHRDracoMeshCompression])
      .registerDependencies({
        'draco3d.encoder': dracoEncoder,
        'draco3d.decoder': dracoDecoder,
      });

    const doc = await io.read(INPUT);

    await doc.transform(
      dedup(),
      prune(),
      draco({
        method: 'edgebreaker',
        encodeSpeed: 1,   // slowest encode = best compression
        decodeSpeed: 7,   // fast decode for end-user
        quantizePosition: 14,
        quantizeNormal: 10,
        quantizeColor: 8,
        quantizeTexcoord: 12,
      })
    );

    await io.write(OUT_DRACO, doc);
    report('Draco', INPUT, OUT_DRACO);
  }

  // ---- Meshopt variant ------------------------------------------------------
  console.log('[optimize-models] Compressing with Meshopt...');
  {
    const io = new NodeIO()
      .registerExtensions([EXTMeshoptCompression])
      .registerDependencies({ 'meshopt.encoder': MeshoptEncoder });

    const doc = await io.read(INPUT);

    await doc.transform(
      dedup(),
      prune(),
      meshopt({ encoder: MeshoptEncoder })
    );

    await io.write(OUT_MESHOPT, doc);
    report('Meshopt', INPUT, OUT_MESHOPT);
  }

  console.log('[optimize-models] Done. Outputs:');
  console.log(`  ${OUT_DRACO}`);
  console.log(`  ${OUT_MESHOPT}`);
}

main().catch((err) => {
  console.error('[optimize-models] Fatal:', err);
  process.exit(1);
});
