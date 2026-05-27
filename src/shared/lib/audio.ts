/**
 * Tiny audio utility — no Howler / no extra deps. Uses the native
 * HTMLAudioElement, with three guarantees that keep autoplay-blocking
 * browsers + accessibility quiet:
 *
 *   1. Audio elements are created lazily, the FIRST time a sound is asked
 *      for (so the page does no audio work when ambient theming is silent).
 *   2. Play is gated on the first real user gesture (pointerdown / keydown /
 *      touchstart). Calls before that gesture are NO-OPS — never queued.
 *   3. One mute flag persisted to localStorage as `pf-sound` covering the
 *      ambient theme music (Luffy drums of liberation, Thor thunder).
 *      Default = muted (autoplay-safe). One floating pill flips it.
 *
 * Public API: playSfx, startLoop, stopLoop, setMuted, isMuted, onMuteChange,
 * isReady, stopAll. Use it from "use client" components only.
 */

export type SfxName = "thunder" | "drums";

const FILES: Record<SfxName, string> = {
  thunder: "/sounds/thunder-1.mp3",
  drums: "/sounds/drums_of_liberation.mp3",
};

const VOLUMES: Record<SfxName, number> = {
  thunder: 0.35,
  drums: 0.28,
};

const LOOPS: Record<SfxName, boolean> = {
  thunder: false,
  drums: true,
};

const STORAGE_KEY_MUSIC = "pf-sound"; // ambient theme music: "on" | "off"

let cache: Partial<Record<SfxName, HTMLAudioElement>> = {};
let gestureFired = false;
let muted = readInitialMuted(STORAGE_KEY_MUSIC);
const muteListeners = new Set<(muted: boolean) => void>();

function readInitialMuted(key: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === "on") return false;
    if (stored === "off") return true;
  } catch {
    /* ignore */
  }
  return true; // default: muted (autoplay-safe)
}

function persistMuted(key: string, next: boolean) {
  try {
    window.localStorage.setItem(key, next ? "off" : "on");
  } catch {
    /* ignore */
  }
}

/** Register a one-shot listener for the first user gesture. */
if (typeof window !== "undefined") {
  const arm = () => {
    if (gestureFired) return;
    gestureFired = true;
    window.removeEventListener("pointerdown", arm);
    window.removeEventListener("keydown", arm);
    window.removeEventListener("touchstart", arm);
  };
  window.addEventListener("pointerdown", arm, { once: true, passive: true });
  window.addEventListener("keydown", arm, { once: true });
  window.addEventListener("touchstart", arm, { once: true, passive: true });
}

function getEl(name: SfxName): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  let el = cache[name];
  if (!el) {
    el = new Audio(FILES[name]);
    el.preload = "auto";
    el.volume = VOLUMES[name];
    el.loop = LOOPS[name];
    cache[name] = el;
  }
  return el;
}

export function isReady(): boolean {
  return gestureFired;
}

export function isMuted(): boolean {
  return muted;
}

export function onMuteChange(fn: (muted: boolean) => void): () => void {
  muteListeners.add(fn);
  return () => muteListeners.delete(fn);
}

export function setMuted(next: boolean): void {
  if (muted === next) return;
  muted = next;
  persistMuted(STORAGE_KEY_MUSIC, next);
  muteListeners.forEach((fn) => fn(next));
  // Pause everything when muting — keep elements cached so unmute is instant.
  if (next) {
    for (const el of Object.values(cache)) {
      try {
        el?.pause();
      } catch {
        /* ignore */
      }
    }
  }
}

export function playSfx(name: SfxName): void {
  if (typeof window === "undefined") return;
  if (muted || !gestureFired) return;
  const el = getEl(name);
  if (!el) return;
  try {
    el.currentTime = 0;
    void el.play();
  } catch {
    /* ignore */
  }
}

export function startLoop(name: SfxName): void {
  if (typeof window === "undefined") return;
  if (muted || !gestureFired) return;
  const el = getEl(name);
  if (!el) return;
  if (!el.paused) return;
  try {
    void el.play();
  } catch {
    /* ignore */
  }
}

export function stopLoop(name: SfxName): void {
  const el = cache[name];
  if (!el) return;
  try {
    el.pause();
    el.currentTime = 0;
  } catch {
    /* ignore */
  }
}

/** Stop everything currently playing. Used on theme switch. */
export function stopAll(): void {
  for (const el of Object.values(cache)) {
    try {
      el?.pause();
      if (el) el.currentTime = 0;
    } catch {
      /* ignore */
    }
  }
}
