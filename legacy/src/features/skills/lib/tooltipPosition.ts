/**
 * src/lib/tooltipPosition.ts
 *
 * Pure utility for computing viewport-safe tooltip coordinates.
 * Extracted from SkillsTree.tsx so it can be unit-tested in isolation
 * without importing any React or browser modules.
 */

/**
 * computeTooltipPosition — pure helper that calculates where to place a
 * tooltip so it always stays inside the viewport.
 *
 * @param clusterRect  getBoundingClientRect() of the anchor element.
 * @param viewport     { width, height } of the visible viewport.
 * @param tooltipSize  Estimated { width, height } of the tooltip box.
 * @returns { left, top } viewport-fixed CSS coordinates.
 *
 * Logic:
 *   - Preferred position: just above the anchor, horizontally centred.
 *   - If that spills off the right edge, pin to viewport right minus margin.
 *   - If that spills off the left edge, pin to viewport left plus margin.
 *   - If that spills off the top, push tooltip below the anchor instead.
 */
export function computeTooltipPosition(
  clusterRect: { top: number; left: number; width: number; height: number },
  viewport: { width: number; height: number },
  tooltipSize: { width: number; height: number },
): { left: number; top: number } {
  const MARGIN = 8;
  const TAIL_CLEARANCE = 12; // gap between cluster edge and tooltip

  // Desired horizontal centre
  const desiredLeft = clusterRect.left + clusterRect.width / 2 - tooltipSize.width / 2;
  // Desired position: tooltip sits above the anchor
  const desiredTop = clusterRect.top - tooltipSize.height - TAIL_CLEARANCE;

  // Clamp horizontal within viewport margins
  const left = Math.max(MARGIN, Math.min(viewport.width - tooltipSize.width - MARGIN, desiredLeft));

  // If tooltip would go above viewport, flip it below the anchor instead
  const top =
    desiredTop < MARGIN
      ? clusterRect.top + clusterRect.height + TAIL_CLEARANCE
      : desiredTop;

  return { left, top };
}
