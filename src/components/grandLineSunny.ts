/**
 * src/components/grandLineSunny.ts
 *
 * Pure helper for computing the Thousand Sunny's facing direction on the
 * Grand Line map based on its current position and the next destination.
 *
 * Co-located in its own file so:
 *   - It can be unit-tested without importing GrandLineMap.tsx (which
 *     drags in React, the SVG components, and the entire skill data set).
 *   - Future helpers (e.g. arrival angle, scaling-by-distance) live next
 *     to it instead of swelling the main component file.
 */

export type Pos = { x: number; y: number };

/**
 * computeSunnyFacing — returns 'right' or 'left' based on whether the
 * voyage's NEXT waypoint is to the right or left of the current position.
 *
 * @param currentPos  Where the Sunny currently sits.
 * @param nextPos     The next waypoint, or null/undefined at end of voyage.
 * @returns 'right' when nextPos is missing or has higher x; 'left' otherwise.
 *
 * Sabaody (x=47) → Fishman Island (x=54.5) → 'right' (faces toward New World).
 * Last island (no next) → 'right' (default — looking toward the horizon).
 */
export function computeSunnyFacing(
  currentPos: Pos,
  nextPos: Pos | null | undefined,
): 'left' | 'right' {
  if (!nextPos) return 'right';
  return nextPos.x >= currentPos.x ? 'right' : 'left';
}
