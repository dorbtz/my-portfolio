/**
 * src/providers/SmoothScrollProvider.tsx
 * Boots Lenis smooth scroll, synced with GSAP ticker and ScrollTrigger.
 * Disabled entirely when prefers-reduced-motion: reduce OR motionOn === false.
 * Children always render — this component is side-effects only.
 *
 * The live Lenis instance is accessible via getLenis() from 'src/lib/lenis'.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { useModeStore } from '../stores/mode';
import { _setLenis } from '../lib/lenis';

type Props = {
  children: ReactNode;
};

export default function SmoothScrollProvider({ children }: Props) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    let destroyed = false;

    function shouldEnable(): boolean {
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const motionOn = useModeStore.getState().motionOn;
      return !prefersReduced && motionOn;
    }

    function createLenis(): void {
      if (!shouldEnable()) return;

      const lenis = new Lenis();
      lenisRef.current = lenis;
      _setLenis(lenis); // expose via getLenis() in src/lib/lenis

      // Sync Lenis scroll position with ScrollTrigger
      lenis.on('scroll', ScrollTrigger.update);

      // Drive Lenis via GSAP ticker for perfect sync
      gsap.ticker.lagSmoothing(0);
      const tickerCb = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tickerCb);

      // Store cleanup ref on the lenis instance (not officially typed but safe)
      (lenis as Lenis & { _tickerCb?: (t: number) => void })._tickerCb = tickerCb;
    }

    function destroyLenis(): void {
      const lenis = lenisRef.current;
      if (!lenis) return;
      const cb = (lenis as Lenis & { _tickerCb?: (t: number) => void })._tickerCb;
      if (cb) gsap.ticker.remove(cb);
      lenis.destroy();
      lenisRef.current = null;
      _setLenis(null); // clear module-level accessor
    }

    function handleChange(): void {
      if (destroyed) return;
      destroyLenis();
      createLenis();
    }

    createLenis();

    // React to motionOn store changes
    let prevMotionOn = useModeStore.getState().motionOn;
    const unsubStore = useModeStore.subscribe((state) => {
      if (state.motionOn !== prevMotionOn) {
        prevMotionOn = state.motionOn;
        handleChange();
      }
    });

    // React to OS preference changes
    const mq = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    const onMqChange = () => handleChange();
    mq?.addEventListener('change', onMqChange);

    return () => {
      destroyed = true;
      unsubStore();
      mq?.removeEventListener('change', onMqChange);
      destroyLenis();
    };
  }, []);

  return <>{children}</>;
}
