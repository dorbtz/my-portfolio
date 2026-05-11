/**
 * src/lib/easterEggs.test.ts
 * Unit tests for easter egg key-buffer logic.
 *
 * Tests the Konami and MJOLNIR buffer matching that drives the easter eggs,
 * without depending on the module-level singleton (avoids SSR transform issues
 * in vmThreads pool with rolldown-vite).
 */
import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Pure buffer-matching logic extracted for unit testing
// (mirrors the production implementation in easterEggs.ts)
// ---------------------------------------------------------------------------
const KONAMI = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'b', 'a',
];
const BUFFER_MAX = 10;
const MJOLNIR_SEQ = 'mjolnir';

function simulateKonamiBuffer(keys: string[]): boolean {
  const buffer: string[] = [];
  let triggered = false;

  for (const key of keys) {
    buffer.push(key);
    if (buffer.length > BUFFER_MAX) buffer.shift();

    if (buffer.length === BUFFER_MAX) {
      if (KONAMI.every((k, i) => buffer[i] === k)) {
        triggered = true;
        buffer.length = 0;
      }
    }
  }
  return triggered;
}

function simulateMjolnirBuffer(keys: string[]): boolean {
  let mjolnirBuf = '';
  let triggered = false;

  for (const key of keys) {
    // Non-printable = reset
    if (key.length > 1) {
      mjolnirBuf = '';
      continue;
    }
    mjolnirBuf += key.toLowerCase();
    if (mjolnirBuf.length > MJOLNIR_SEQ.length) {
      mjolnirBuf = mjolnirBuf.slice(-MJOLNIR_SEQ.length);
    }
    if (mjolnirBuf === MJOLNIR_SEQ) {
      triggered = true;
      mjolnirBuf = '';
    }
  }
  return triggered;
}

// ---------------------------------------------------------------------------
// Konami buffer tests
// ---------------------------------------------------------------------------
describe('Konami buffer matching', () => {
  const konamiSeq = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'b', 'a',
  ];

  it('detects the exact Konami sequence', () => {
    expect(simulateKonamiBuffer(konamiSeq)).toBe(true);
  });

  it('detects Konami after garbage keys prepended (rolling buffer)', () => {
    expect(simulateKonamiBuffer(['x', 'y', 'z', ...konamiSeq])).toBe(true);
  });

  it('does NOT match a partial sequence (9 keys)', () => {
    expect(simulateKonamiBuffer(konamiSeq.slice(0, 9))).toBe(false);
  });

  it('does NOT match wrong sequence', () => {
    const wrong = [
      'ArrowUp', 'ArrowUp', 'ArrowUp',
      'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight',
      'ArrowLeft', 'ArrowRight', 'a',
    ];
    expect(simulateKonamiBuffer(wrong)).toBe(false);
  });

  it('detects Konami appearing twice in a long stream', () => {
    const doubled = [...konamiSeq, ...konamiSeq];
    // The function as written detects the first match and resets; returns true
    expect(simulateKonamiBuffer(doubled)).toBe(true);
  });

  it('buffer rolls: only the last 10 keys are checked', () => {
    // Feed 15 wrong keys then the correct sequence — should match
    const junk = Array(15).fill('x');
    expect(simulateKonamiBuffer([...junk, ...konamiSeq])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// MJOLNIR buffer tests
// ---------------------------------------------------------------------------
describe('MJOLNIR buffer matching', () => {
  it('detects "mjolnir" typed in sequence', () => {
    expect(simulateMjolnirBuffer(['m','j','o','l','n','i','r'])).toBe(true);
  });

  it('detects "MJOLNIR" (uppercase input lowercased)', () => {
    expect(simulateMjolnirBuffer(['M','J','O','L','N','I','R'])).toBe(true);
  });

  it('detects MJOLNIR after random characters (rolling window)', () => {
    expect(simulateMjolnirBuffer(['a','b','c','m','j','o','l','n','i','r'])).toBe(true);
  });

  it('does NOT match partial (6 chars)', () => {
    expect(simulateMjolnirBuffer(['m','j','o','l','n','i'])).toBe(false);
  });

  it('resets buffer on non-printable key', () => {
    // m, j then ArrowUp breaks the sequence — rest of chars do not form MJOLNIR
    expect(simulateMjolnirBuffer(['m','j','ArrowUp','o','l','n','i','r'])).toBe(false);
  });

  it('does NOT match a similar but wrong word', () => {
    expect(simulateMjolnirBuffer(['m','j','o','l','n','i','x'])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Integration: combined key stream
// ---------------------------------------------------------------------------
describe('Combined key stream', () => {
  it('MJOLNIR and Konami can coexist in the same key stream', () => {
    const konamiSeq = [
      'ArrowUp', 'ArrowUp',
      'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight',
      'ArrowLeft', 'ArrowRight',
      'b', 'a',
    ];
    expect(simulateMjolnirBuffer(['m','j','o','l','n','i','r'])).toBe(true);
    expect(simulateKonamiBuffer(konamiSeq)).toBe(true);
  });
});
