/**
 * src/hooks/useCapability.ts
 * Detects hardware capability tier and reactive media-query features.
 * SSR-safe: returns a sensible 'mid' default when window is unavailable.
 */
import { useEffect, useState } from 'react';
import { computeTier } from './computeTier';
import type { CapabilityTier } from './computeTier';

export type { CapabilityTier };
export { computeTier };

export type Capability = {
  tier: CapabilityTier;
  coarsePointer: boolean;
  reducedMotion: boolean;
  lowBattery: boolean;
  hardwareCores: number;
  deviceMemory: number;
};

export function getStaticValues(): {
  hardwareCores: number;
  deviceMemory: number;
} {
  if (typeof navigator === 'undefined') {
    return { hardwareCores: 4, deviceMemory: 4 };
  }
  const hardwareCores = navigator.hardwareConcurrency ?? 4;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  return { hardwareCores, deviceMemory };
}

function getMediaMatches(): { coarsePointer: boolean; reducedMotion: boolean } {
  if (typeof window === 'undefined') {
    return { coarsePointer: false, reducedMotion: false };
  }
  return {
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
}

export function useCapability(): Capability {
  const { hardwareCores, deviceMemory } = getStaticValues();
  const initial = getMediaMatches();

  const [coarsePointer, setCoarsePointer] = useState(initial.coarsePointer);
  const [reducedMotion, setReducedMotion] = useState(initial.reducedMotion);
  const [lowBattery, setLowBattery] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const coarseMq = window.matchMedia('(pointer: coarse)');
    const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');

    const onCoarseChange = (e: MediaQueryListEvent) => setCoarsePointer(e.matches);
    const onReducedChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);

    coarseMq.addEventListener('change', onCoarseChange);
    reducedMq.addEventListener('change', onReducedChange);

    return () => {
      coarseMq.removeEventListener('change', onCoarseChange);
      reducedMq.removeEventListener('change', onReducedChange);
    };
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{
        charging: boolean;
        level: number;
        addEventListener: (event: string, handler: () => void) => void;
        removeEventListener: (event: string, handler: () => void) => void;
      }>;
    };
    if (!nav.getBattery) return;

    // battery captured here so cleanup can remove listeners after the promise resolves.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let battery: any | null = null;
    let cancelled = false;

    const update = () => {
      if (!cancelled && battery) {
        setLowBattery(!battery.charging && battery.level < 0.2);
      }
    };

    nav.getBattery().then((b) => {
      if (cancelled) return;
      battery = b;
      update();
      b.addEventListener('chargingchange', update);
      b.addEventListener('levelchange', update);
    }).catch(() => {/* getBattery not supported */});

    return () => {
      cancelled = true;
      if (battery) {
        battery.removeEventListener('chargingchange', update);
        battery.removeEventListener('levelchange', update);
      }
    };
  }, []);

  const tier = computeTier(hardwareCores, deviceMemory, coarsePointer, reducedMotion, lowBattery);

  return {
    tier,
    coarsePointer,
    reducedMotion,
    lowBattery,
    hardwareCores,
    deviceMemory,
  };
}
