/**
 * src/lib/lightning.ts
 * Pure utility — SVG path generation for procedural lightning bolts.
 * No React dependencies, usable in any context.
 */

export type Point = { x: number; y: number };

/**
 * Midpoint-displacement algorithm for jagged lightning paths.
 *
 * @param start     - Start coordinate in SVG user-space.
 * @param end       - End coordinate in SVG user-space.
 * @param displacement - Initial maximum perpendicular offset (halved each iteration).
 * @param detail    - Number of subdivision iterations (5 → 2^5 = 32 segments).
 * @returns An SVG "d" attribute string beginning with "M" and using "L" line commands.
 */
export function generateLightningPath(
  start: Point,
  end: Point,
  displacement = 80,
  detail = 5,
): string {
  // Build an array of points via midpoint displacement.
  let points: Point[] = [start, end];

  let disp = displacement;
  for (let i = 0; i < detail; i++) {
    const next: Point[] = [];
    for (let j = 0; j < points.length - 1; j++) {
      const a = points[j];
      const b = points[j + 1];

      // Midpoint
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;

      // Perpendicular direction (rotate segment 90°)
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const px = -dy / len;
      const py = dx / len;

      // Displace midpoint perpendicular to segment
      const offset = (Math.random() - 0.5) * 2 * disp;
      next.push(a, { x: mx + px * offset, y: my + py * offset });
    }
    next.push(points[points.length - 1]);
    points = next;
    disp /= 2;
  }

  return 'M ' + points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' L ');
}

/**
 * Generates a main bolt path plus a set of smaller branch bolt paths.
 *
 * @param start         - Start point.
 * @param end           - End point.
 * @param displacement  - Main bolt displacement magnitude.
 * @param detail        - Main bolt detail iterations.
 * @param branchCount   - How many branches to spawn (default 2).
 * @returns Array of SVG "d" strings: index 0 is the main bolt, rest are branches.
 */
export function generateBoltWithBranches(
  start: Point,
  end: Point,
  displacement = 80,
  detail = 5,
  branchCount = 2,
): string[] {
  const mainPath = generateLightningPath(start, end, displacement, detail);
  const results: string[] = [mainPath];

  for (let b = 0; b < branchCount; b++) {
    // Branch starts somewhere in the upper-half of the bolt
    const t = 0.3 + Math.random() * 0.4;
    const branchStart: Point = {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
    };

    // Branch ends off to the side and somewhat below the start
    const angle = (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 6 + Math.random() * Math.PI / 6);
    const baseLength = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
    );
    const branchLength = baseLength * (0.25 + Math.random() * 0.25);

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const baseAngle = Math.atan2(dy, dx);
    const branchAngle = baseAngle + angle;

    const branchEnd: Point = {
      x: branchStart.x + Math.cos(branchAngle) * branchLength,
      y: branchStart.y + Math.sin(branchAngle) * branchLength,
    };

    results.push(generateLightningPath(branchStart, branchEnd, displacement * 0.5, detail - 1));
  }

  return results;
}
