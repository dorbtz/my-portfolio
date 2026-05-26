/**
 * src/lib/audio.ts
 * Howler-based lazy audio layer.
 *
 * API: playSfx(name, opts?), stopSfx(name), setAudioMuted(bool)
 *
 * Howler is **dynamically imported** on the first user gesture. Importing
 * `howler` synchronously at module level instantiates an AudioContext probe
 * that the browser blocks before any user interaction, producing repeated
 * "AudioContext was not allowed to start" warnings on page load.
 *
 * By deferring the import to a `pointerdown` / `keydown` / `touchstart`
 * handler, the AudioContext is created INSIDE the gesture and the browser
 * permits it cleanly — no warnings.
 */

import { useModeStore } from '../stores/mode';

export type SfxName =
  | 'thunder.short'
  | 'hammer.ring'
  | 'bifrost.hum'
  | 'drums.liberation';

const FILE_MAP: Record<SfxName, string> = {
  'thunder.short': '/sounds/thunder-1.mp3',
  'hammer.ring': '/sounds/hammer-ring.mp3',
  'bifrost.hum': '/sounds/bifrost-hum.mp3',
  'drums.liberation': '/sounds/drums_of_liberation.mp3',
};

const KNOWN_FILES: ReadonlySet<SfxName> = new Set<SfxName>([
  'thunder.short',
  'drums.liberation',
]);

const HTML5_FILES: ReadonlySet<SfxName> = new Set<SfxName>([
  'drums.liberation',
]);

const LOOP_NAMES: ReadonlySet<SfxName> = new Set<SfxName>([
  'drums.liberation',
]);

// ---------------------------------------------------------------------------
// Lazy Howler import — promise resolves to the loaded module's { Howl, Howler }
// after the FIRST user gesture. Until then it stays null and `playSfx` is a
// silent no-op.
// ---------------------------------------------------------------------------
type HowlerModule = typeof import('howler');
let howlerModulePromise: Promise<HowlerModule> | null = null;

// Loose-typed cache of Howl instances keyed by sound name.
const cache = new Map<SfxName, unknown>();
const failedNames = new Set<SfxName>();

function loadHowler(): Promise<HowlerModule> {
  if (!howlerModulePromise) {
    howlerModulePromise = import('howler').then((mod) => {
      // Disable Howler's automatic unlock probing — the dynamic import
      // already happens inside a user gesture, so the AudioContext is
      // allowed to start cleanly. autoUnlock=true would re-trigger probes
      // outside the gesture window and re-introduce the warnings.
      mod.Howler.autoUnlock = false;
      // Bump pool just in case any HTML5 streamer re-triggers rapidly.
      mod.Howler.html5PoolSize = 30;
      return mod;
    });
  }
  return howlerModulePromise;
}

async function buildHowl(name: SfxName): Promise<unknown> {
  const { Howl } = await loadHowler();
  const src = FILE_MAP[name];
  const isKnown = KNOWN_FILES.has(name);
  const shouldLoop = LOOP_NAMES.has(name);
  const useHtml5 = HTML5_FILES.has(name);
  return new Howl({
    src: [src],
    preload: isKnown,
    html5: useHtml5,
    loop: shouldLoop,
    volume: 0.45,
    onloaderror: (_id, err) => {
      console.warn(`[audio] missing file: ${src}`, err);
      failedNames.add(name);
      cache.set(name, null);
    },
  });
}

async function getHowl(name: SfxName): Promise<unknown | null> {
  if (failedNames.has(name)) return null;
  if (cache.has(name)) return cache.get(name) ?? null;
  const howl = await buildHowl(name);
  cache.set(name, howl);
  return howl;
}

// ---------------------------------------------------------------------------
// Module-init: arm a one-shot listener so Howler loads on first user gesture
// and known SFX are warmed up. Doing this inside the gesture handler is what
// keeps the AudioContext quiet on page load.
// ---------------------------------------------------------------------------
let gestureFired = false;

if (typeof window !== 'undefined') {
  const fireWarmOnce = () => {
    if (gestureFired) return;
    gestureFired = true;
    loadHowler()
      .then(() => Promise.all(Array.from(KNOWN_FILES).map((n) => getHowl(n))))
      .catch(() => { /* ignore — failed sounds are tracked individually */ });
    window.removeEventListener('pointerdown', fireWarmOnce);
    window.removeEventListener('keydown', fireWarmOnce);
    window.removeEventListener('touchstart', fireWarmOnce);
  };
  window.addEventListener('pointerdown', fireWarmOnce, { once: true, passive: true });
  window.addEventListener('keydown', fireWarmOnce, { once: true });
  window.addEventListener('touchstart', fireWarmOnce, { once: true, passive: true });
}

export type SfxOptions = {
  volume?: number;
};

// ---------------------------------------------------------------------------
// Public API — fire-and-forget. `playSfx` is async-internally but exposes a
// sync signature so existing call sites don't need to await.
// ---------------------------------------------------------------------------

export function playSfx(name: SfxName, opts: SfxOptions = {}): void {
  if (typeof window === 'undefined') return;
  if (!useModeStore.getState().soundOn) return;
  if (!gestureFired) return; // silent no-op until first user gesture

  void (async () => {
    const howl = (await getHowl(name)) as
      | { play(): number; volume(v: number): unknown; playing(): boolean }
      | null;
    if (!howl) return;
    if (opts.volume !== undefined) howl.volume(opts.volume);
    if (LOOP_NAMES.has(name) && howl.playing()) return;
    try {
      howl.play();
    } catch (err) {
      console.warn(`[audio] play() failed for ${name}:`, err);
    }
  })();
}

export function stopSfx(name: SfxName): void {
  const howl = cache.get(name) as { stop(): unknown } | null | undefined;
  if (howl) howl.stop();
}

export function setAudioMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  // Lazy-load Howler on first mute call (rare path — only fires after
  // gesture-triggered warm load). Safe to swallow the promise.
  void loadHowler().then((mod) => mod.Howler.mute(muted));
}
