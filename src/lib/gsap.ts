/**
 * src/lib/gsap.ts
 * Single registration point for GSAP and plugins.
 * Import this instead of importing GSAP directly so plugins register once.
 *
 * Plugin import path used: gsap/<PluginName>
 * GSAP 3.12+ (Webflow acquisition, free since 2024) ships SplitText, DrawSVGPlugin,
 * and ScrambleTextPlugin directly from the main 'gsap' package — no 'gsap-trial' needed.
 * Confirmed available in gsap@3.15.0 (the version pinned in package.json).
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { useModeStore } from '../stores/mode';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin);

/** Run a callback only when the user allows motion (OS preference + in-app toggle). */
export function withMotion(cb: () => void): void {
  if (typeof window === 'undefined') return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;
  if (!useModeStore.getState().motionOn) return;
  cb();
}

// Module-lifetime subscriber: refresh ScrollTrigger when motionOn flips.
export let unsubMotionWatcher: (() => void) | null = null;
if (typeof window !== 'undefined') {
  let prevMotionOn = useModeStore.getState().motionOn;
  unsubMotionWatcher = useModeStore.subscribe((state) => {
    if (state.motionOn !== prevMotionOn) {
      prevMotionOn = state.motionOn;
      ScrollTrigger.refresh();
    }
  });
}

export { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin };
