/**
 * src/components/luffyImageRainUtils.ts
 *
 * Pure utility for LuffyImageRain: active-section picker.
 * Isolated from GSAP/React imports so it can be unit-tested directly.
 */

/**
 * Returns the index of the section whose vertical midpoint is closest to the
 * viewport center. Returns -1 when no section is currently in view.
 *
 * @param sectionIds  - Array of section element IDs (without '#').
 * @param getBoundingRect - Injected for testing; defaults to live DOM queries.
 * @param viewportHeight  - Injected for testing; defaults to window.innerHeight.
 */
export function pickActiveSectionIndex(
  sectionIds: string[],
  getBoundingRect?: (id: string) => { top: number; height: number } | null,
  viewportHeight?: number,
): number {
  const vh = viewportHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 800);
  const viewportMid = vh / 2;

  let bestIndex = -1;
  let bestDist = Infinity;

  for (let i = 0; i < sectionIds.length; i++) {
    let rect: { top: number; height: number } | null = null;
    if (getBoundingRect) {
      rect = getBoundingRect(sectionIds[i]);
    } else {
      const el = document.getElementById(sectionIds[i]);
      if (el) rect = el.getBoundingClientRect();
    }
    if (!rect) continue;

    const sectionMid = rect.top + rect.height / 2;
    const dist = Math.abs(sectionMid - viewportMid);

    // Only consider the section "active" if it overlaps the viewport at all
    if (rect.top < vh && rect.top + rect.height > 0 && dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }

  return bestIndex;
}
