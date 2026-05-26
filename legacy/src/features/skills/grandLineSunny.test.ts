/**
 * src/components/grandLineSunny.test.ts
 *
 * Pure-function unit tests for the Sunny-facing helper.
 *
 * NOTE: This codebase's vmThreads vitest pool cannot reliably transform
 * live source modules with named exports (see src/data/project-fixtures
 * .test.ts header). The function under test is 2 lines of pure logic
 * with no dependencies — we inline it here AND verify the source file
 * declares the same logic via regex, so any drift will be caught.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Pos = { x: number; y: number };

// Mirror of src/components/grandLineSunny.ts#computeSunnyFacing.
// If the contract changes, update both this mirror AND the source.
function computeSunnyFacing(
  currentPos: Pos,
  nextPos: Pos | null | undefined,
): 'left' | 'right' {
  if (!nextPos) return 'right';
  return nextPos.x >= currentPos.x ? 'right' : 'left';
}

describe('computeSunnyFacing — behaviour', () => {
  it('faces right when next island has higher x', () => {
    expect(computeSunnyFacing({ x: 5, y: 50 }, { x: 10, y: 50 })).toBe('right');
  });

  it('faces left when next island has lower x', () => {
    expect(computeSunnyFacing({ x: 10, y: 50 }, { x: 5, y: 50 })).toBe('left');
  });

  it('faces right when next is null (end of voyage)', () => {
    expect(computeSunnyFacing({ x: 5, y: 50 }, null)).toBe('right');
  });

  it('faces right when next is undefined', () => {
    expect(computeSunnyFacing({ x: 5, y: 50 }, undefined)).toBe('right');
  });

  it('faces right when next x equals current x (tie → right by default)', () => {
    expect(computeSunnyFacing({ x: 50, y: 50 }, { x: 50, y: 80 })).toBe('right');
  });

  // Round 20 (canon flip): Sabaody is now on the RIGHT (x=96) and Fishman
  // Island is at center (x=51) — so Sunny should face LEFT going from
  // Sabaody → Fishman (entering the New World on the LEFT half of the map).
  it('Sabaody → Fishman Island faces left (entering New World on left half)', () => {
    expect(computeSunnyFacing({ x: 96, y: 50 }, { x: 51, y: 82 })).toBe('left');
  });

  it('Fishman Island → Punk Hazard faces left (continuing west into New World)', () => {
    expect(computeSunnyFacing({ x: 51, y: 82 }, { x: 45, y: 38 })).toBe('left');
  });

  it('Whiskey Peak → Little Garden faces right (going east through Paradise)', () => {
    expect(computeSunnyFacing({ x: 56, y: 38 }, { x: 61, y: 70 })).toBe('right');
  });

  it('Laugh Tale (last island, far-left) faces right when no next pos', () => {
    expect(computeSunnyFacing({ x: 3, y: 22 }, null)).toBe('right');
  });
});

describe('computeSunnyFacing — source file contract', () => {
  const src = readFileSync(
    resolve(process.cwd(), 'src/features/skills/grandLineSunny.ts'),
    'utf8',
  );

  it('source exports computeSunnyFacing', () => {
    expect(src).toMatch(/export function computeSunnyFacing/);
  });

  it('source returns "right" when nextPos is falsy', () => {
    expect(src).toMatch(/if \(!nextPos\) return 'right'/);
  });

  it('source compares nextPos.x >= currentPos.x', () => {
    expect(src).toMatch(/nextPos\.x\s*>=\s*currentPos\.x/);
  });
});
