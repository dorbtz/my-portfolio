import { useEffect, useRef } from "react";
import { useThor } from "../state/thor";

/** Orchestrates random lightning bursts + synced thunder audio app-wide */
export default function ThorEngine() {
  const { on } = useThor();
  const stopped = useRef(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;

  useEffect(() => {
    if (!audio.current) {
      const el = new Audio("/sounds/thunder-1.mp3"); // put your mp3 in public/sounds/
      el.preload = "auto";
      el.volume = 0.35;
      audio.current = el;
    }
  }, []);

  useEffect(() => {
    stopped.current = !on;
    if (!on) return;

    let cancelled = false;
    async function run() {
      while (!cancelled && on) {
        await delay(rand(4000, 10000)); // cooldown 4–10s
        if (cancelled || !on) break;

        // 1–2 quick flashes per cycle
        const bursts = Math.random() < 0.25 ? 2 : 1;
        for (let i = 0; i < bursts; i++) {
          window.dispatchEvent(new CustomEvent("thor:strike"));
          if (i === 0 && audio.current) {
            setTimeout(() => {
              audio.current!.currentTime = 0;
              audio.current!.play().catch(() => {});
            }, rand(80, 200)); // thunder just after first flash
          }
          await delay(rand(90, 220));
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [on]);

  return null;
}
