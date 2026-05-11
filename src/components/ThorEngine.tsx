/**
 * src/components/ThorEngine.tsx
 * Orchestrates random lightning bursts + synced thunder audio.
 * Thor mode: dispatches thor:strike + plays thunder.
 * Gear 5 mode: occasional sun-flare CSS pulse — no audio.
 */
import { useEffect, useRef, useState } from 'react';
import { useMode, useSoundOn, useEffectsActive } from '../stores/mode';
import { playSfx } from '../lib/audio';

// Hoisted outside the component — pure utilities, no reason to recreate each render.
const delay = (ms: number): Promise<void> =>
  new Promise<void>((r) => setTimeout(r, ms));
const rand = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

export default function ThorEngine() {
  const mode = useMode();
  const soundOn = useSoundOn();
  const effectsActive = useEffectsActive();
  const cancelledRef = useRef(false);
  const [sunFlare, setSunFlare] = useState(false);

  // Thor mode loop — only runs when the user has explicitly engaged the
  // storm via the Hero stat-tile (effectsActive=true). Toggling off
  // immediately stops the loop via the cleanup effect.
  useEffect(() => {
    if (mode !== 'thor' || !effectsActive) return;

    cancelledRef.current = false;
    let cancelled = false;

    async function run() {
      while (!cancelled) {
        await delay(rand(4000, 10000));
        if (cancelled) break;

        const bursts = Math.random() < 0.25 ? 2 : 1;
        for (let i = 0; i < bursts; i++) {
          window.dispatchEvent(new CustomEvent('thor:strike'));

          if (i === 0 && soundOn) {
            setTimeout(() => {
              playSfx('thunder.short', { volume: 0.35 });
            }, rand(80, 200));
          }

          await delay(rand(90, 220));
          if (cancelled) break;
        }
      }
    }

    run();
    return () => {
      cancelled = true;
      cancelledRef.current = true;
    };
  }, [mode, soundOn, effectsActive]);

  // Gear 5 mode: occasional sun-flare pulse — also gated on effectsActive.
  useEffect(() => {
    if (mode !== 'gear5' || !effectsActive) return;

    let cancelled = false;
    async function runFlares() {
      while (!cancelled) {
        await delay(rand(5000, 14000));
        if (cancelled) break;
        setSunFlare(true);
        await delay(1200);
        setSunFlare(false);
      }
    }
    runFlares();
    return () => { cancelled = true; setSunFlare(false); };
  }, [mode, effectsActive]);

  if (mode === 'gear5') {
    return (
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[35]"
        style={{
          transition: 'opacity 600ms ease',
          opacity: sunFlare ? 1 : 0,
          background: sunFlare
            ? 'radial-gradient(60% 60% at 50% 10%, rgba(255,238,88,0.18), transparent 70%)'
            : 'none',
        }}
      />
    );
  }

  return null;
}
