/**
 * src/hooks/computeTier.ts
 * Pure capability tier utility — no React deps, safe for direct test import.
 */

export type CapabilityTier = 'high' | 'mid' | 'low';

/**
 * Compute device capability tier.
 * @param lowBattery — when true, demotes 'high' → 'mid'.
 *   Battery alone does not demote 'mid' → 'low'; that threshold
 *   is reserved for hardware-constrained devices.
 */
export function computeTier(
  hardwareCores: number,
  deviceMemory: number,
  coarsePointer: boolean,
  reducedMotion: boolean,
  lowBattery = false
): CapabilityTier {
  if (
    hardwareCores <= 2 ||
    deviceMemory <= 2 ||
    (coarsePointer && reducedMotion)
  ) {
    return 'low';
  }
  if (hardwareCores >= 8 && deviceMemory >= 8 && !coarsePointer) {
    // Demote from high when battery is low — preserves charge without killing UX.
    return lowBattery ? 'mid' : 'high';
  }
  return 'mid';
}
