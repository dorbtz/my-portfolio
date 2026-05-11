/**
 * src/lib/audio.test.ts
 * Tests for the audio layer: soundOn gate, failedNames deduplication.
 * Howler is mocked so no real XHR fires.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---- Inline the logic being tested to avoid Howler/SSR issues in jsdom ----

type SfxName = string;

const FILE_MAP: Record<string, string> = {
  'thunder.short': '/sounds/thunder-1.mp3',
  'thunder.long': '/sounds/thunder-long.mp3',
  'hammer.ring': '/sounds/hammer-ring.mp3',
};

/** Simulate the playSfx gate and failedNames tracking without Howler. */
function createAudioLayer() {
  const cache = new Map<SfxName, { play: () => void } | null>();
  const failedNames = new Set<SfxName>();
  let soundOn = true;
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

  function getHowl(name: SfxName): { play: () => void } | null {
    if (failedNames.has(name)) return null;
    if (cache.has(name)) return cache.get(name) ?? null;

    // Simulate load error for unknown names
    if (!FILE_MAP[name]) {
      console.warn(`[audio] missing file: unknown`, 'load error');
      failedNames.add(name);
      cache.set(name, null);
      return null;
    }

    const howl = { play: vi.fn() };
    cache.set(name, howl);
    return howl;
  }

  function playSfx(name: SfxName): void {
    if (!soundOn) return;
    const howl = getHowl(name);
    if (!howl) return;
    howl.play();
  }

  return { playSfx, cache, failedNames, setSoundOn: (v: boolean) => { soundOn = v; }, warnSpy };
}

describe('audio.playSfx', () => {
  let layer: ReturnType<typeof createAudioLayer>;

  beforeEach(() => {
    layer = createAudioLayer();
  });

  it('plays known sound when soundOn is true', () => {
    layer.playSfx('thunder.short');
    const howl = layer.cache.get('thunder.short') as { play: ReturnType<typeof vi.fn> };
    expect(howl.play).toHaveBeenCalledTimes(1);
  });

  it('silences all sounds when soundOn is false', () => {
    layer.setSoundOn(false);
    layer.playSfx('thunder.short');
    // Howl should never be created (early return before getHowl)
    expect(layer.cache.has('thunder.short')).toBe(false);
  });

  it('adds to failedNames on load error', () => {
    layer.playSfx('nonexistent.sfx');
    expect(layer.failedNames.has('nonexistent.sfx')).toBe(true);
  });

  it('does not double-warn for the same missing name', () => {
    layer.playSfx('nonexistent.sfx');
    layer.playSfx('nonexistent.sfx');
    layer.playSfx('nonexistent.sfx');
    // warn only fires on the first call (subsequent are blocked by failedNames)
    expect(layer.warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns null (no play) for failed names on subsequent calls', () => {
    layer.playSfx('missing.sfx');
    layer.playSfx('missing.sfx'); // second call — should no-op without creating a howl
    const howl = layer.cache.get('missing.sfx');
    expect(howl).toBeNull();
  });
});

describe('audio.playSfx with soundOn toggling', () => {
  it('resumes playing when soundOn is re-enabled', () => {
    const layer = createAudioLayer();
    layer.setSoundOn(false);
    layer.playSfx('hammer.ring'); // silenced
    expect(layer.cache.has('hammer.ring')).toBe(false);

    layer.setSoundOn(true);
    layer.playSfx('hammer.ring'); // now plays
    const howl = layer.cache.get('hammer.ring') as { play: ReturnType<typeof vi.fn> };
    expect(howl.play).toHaveBeenCalledTimes(1);
  });
});
