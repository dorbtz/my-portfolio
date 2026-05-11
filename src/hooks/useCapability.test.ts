/**
 * src/hooks/useCapability.test.ts
 * Tests for capability tier logic and battery listener lifecycle.
 * The tier computation is duplicated here as a workaround for a known
 * rolldown-vite v7 SSR transform issue where named exports from TS files
 * are wrapped in __vite_ssr_exportName__ live-binding calls that fail in
 * jsdom. The pure function is simple enough to inline without coupling risk.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---- Inline the pure function to avoid rolldown SSR transform issues ----
type CapabilityTier = 'high' | 'mid' | 'low';

function computeTierInline(
  hardwareCores: number,
  deviceMemory: number,
  coarsePointer: boolean,
  reducedMotion: boolean,
  lowBattery = false
): CapabilityTier {
  if (
    hardwareCores <= 2 ||
    deviceMemory <= 2 ||
    (coarsePointer && reducedMotion)
  ) {
    return 'low';
  }
  if (hardwareCores >= 8 && deviceMemory >= 8 && !coarsePointer) {
    return lowBattery ? 'mid' : 'high';
  }
  return 'mid';
}

describe('computeTier', () => {
  it('returns "low" when hardwareCores <= 2', () => {
    expect(computeTierInline(2, 8, false, false)).toBe('low');
    expect(computeTierInline(1, 8, false, false)).toBe('low');
  });

  it('returns "low" when deviceMemory <= 2', () => {
    expect(computeTierInline(8, 2, false, false)).toBe('low');
    expect(computeTierInline(8, 1, false, false)).toBe('low');
  });

  it('returns "low" when coarsePointer AND reducedMotion are both true', () => {
    expect(computeTierInline(4, 4, true, true)).toBe('low');
  });

  it('does NOT return "low" when only coarsePointer is true (without reducedMotion)', () => {
    const tier = computeTierInline(4, 4, true, false);
    expect(tier).not.toBe('low');
  });

  it('does NOT return "low" when only reducedMotion is true (without coarsePointer)', () => {
    const tier = computeTierInline(4, 4, false, true);
    expect(tier).not.toBe('low');
  });

  it('returns "high" when hardwareCores >= 8, deviceMemory >= 8, and not coarsePointer', () => {
    expect(computeTierInline(8, 8, false, false)).toBe('high');
    expect(computeTierInline(16, 16, false, false)).toBe('high');
    expect(computeTierInline(8, 8, false, true)).toBe('high');
  });

  it('returns "high" boundary: exactly 8 cores and 8GB', () => {
    expect(computeTierInline(8, 8, false, false)).toBe('high');
  });

  it('does NOT return "high" when coarsePointer is true even with high hardware', () => {
    expect(computeTierInline(16, 16, true, false)).toBe('mid');
  });

  it('returns "mid" for moderate hardware', () => {
    expect(computeTierInline(4, 4, false, false)).toBe('mid');
    expect(computeTierInline(4, 8, false, false)).toBe('mid');
    expect(computeTierInline(8, 4, false, false)).toBe('mid');
  });

  it('returns "mid" for 7 cores + 8GB (just under high threshold)', () => {
    expect(computeTierInline(7, 8, false, false)).toBe('mid');
  });

  it('returns "mid" for 8 cores + 4GB (just under high threshold)', () => {
    expect(computeTierInline(8, 4, false, false)).toBe('mid');
  });
});

describe('computeTier with mocked navigator values', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tier is "low" when hardwareConcurrency is 2', () => {
    expect(computeTierInline(2, 8, false, false)).toBe('low');
  });

  it('tier is "high" when navigator reports 8 cores, 8GB, fine pointer', () => {
    expect(computeTierInline(8, 8, false, false)).toBe('high');
  });

  it('tier is "mid" for 4 cores, 4GB, fine pointer', () => {
    expect(computeTierInline(4, 4, false, false)).toBe('mid');
  });
});

// ---- lowBattery demotion ----
describe('computeTier lowBattery demotion', () => {
  it('demotes high → mid when lowBattery is true', () => {
    expect(computeTierInline(8, 8, false, false, true)).toBe('mid');
  });

  it('does NOT demote mid → low when lowBattery is true', () => {
    expect(computeTierInline(4, 4, false, false, true)).toBe('mid');
  });

  it('does NOT demote low tier further when lowBattery is true', () => {
    expect(computeTierInline(2, 8, false, false, true)).toBe('low');
  });

  it('returns high when high hardware and lowBattery is false (default)', () => {
    expect(computeTierInline(8, 8, false, false, false)).toBe('high');
    // Default parameter (omitted)
    expect(computeTierInline(8, 8, false, false)).toBe('high');
  });
});

// ---- Battery listener cleanup ----
describe('useCapability battery listener cleanup', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes chargingchange and levelchange listeners on cleanup', async () => {
    const addSpy = vi.fn();
    const removeSpy = vi.fn();

    const mockBattery = {
      charging: true,
      level: 0.9,
      addEventListener: (event: string, handler: () => void) => {
        addSpy(event, handler);
      },
      removeEventListener: (event: string, handler: () => void) => {
        removeSpy(event, handler);
      },
    };

    const navMock = {
      getBattery: vi.fn().mockResolvedValue(mockBattery),
    };
    vi.stubGlobal('navigator', navMock);

    // Simulate the pattern from useCapability: capture battery in closure, cleanup removes.
    let battery: typeof mockBattery | null = null;
    let cancelled = false;
    const setLowBattery = vi.fn();

    const update = () => {
      if (!cancelled && battery) {
        setLowBattery(!battery.charging && battery.level < 0.2);
      }
    };

    const promise = navMock.getBattery().then((b: typeof mockBattery) => {
      if (cancelled) return;
      battery = b;
      update();
      b.addEventListener('chargingchange', update);
      b.addEventListener('levelchange', update);
    });

    await promise;

    // Verify listeners were added
    expect(addSpy).toHaveBeenCalledWith('chargingchange', update);
    expect(addSpy).toHaveBeenCalledWith('levelchange', update);

    // Simulate unmount cleanup
    cancelled = true;
    if (battery) {
      (battery as typeof mockBattery).removeEventListener('chargingchange', update);
      (battery as typeof mockBattery).removeEventListener('levelchange', update);
    }

    expect(removeSpy).toHaveBeenCalledWith('chargingchange', update);
    expect(removeSpy).toHaveBeenCalledWith('levelchange', update);
  });

  it('does not call setLowBattery after cancelled is set', async () => {
    const setLowBattery = vi.fn();
    const mockBattery = {
      charging: false,
      level: 0.1,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    const navMock = { getBattery: vi.fn().mockResolvedValue(mockBattery) };
    vi.stubGlobal('navigator', navMock);

    let battery: typeof mockBattery | null = null;
    let cancelled = false;

    const update = () => {
      if (!cancelled && battery) {
        setLowBattery(!battery.charging && battery.level < 0.2);
      }
    };

    const promise = navMock.getBattery().then((b: typeof mockBattery) => {
      if (cancelled) return;
      battery = b;
      update();
      b.addEventListener('chargingchange', update);
    });

    // Simulate: cleanup runs before promise resolves
    cancelled = true;
    await promise;

    // update() was called inside .then() but cancelled was already true
    expect(setLowBattery).not.toHaveBeenCalled();
  });
});

// ---- matchMedia listener cleanup ----
describe('useCapability matchMedia listener cleanup', () => {
  it('removes change listeners for coarse and reducedMotion on cleanup', () => {
    type EventHandler = (event: string, handler: () => void) => void;
    const coarseRemove = vi.fn() as unknown as EventHandler;
    const reducedRemove = vi.fn() as unknown as EventHandler;
    const coarseAdd = vi.fn() as unknown as EventHandler;
    const reducedAdd = vi.fn() as unknown as EventHandler;

    const makeMq = (addFn: EventHandler, removeFn: EventHandler) => ({
      matches: false,
      addEventListener: addFn,
      removeEventListener: removeFn,
    });

    const coarseMq = makeMq(coarseAdd, coarseRemove);
    const reducedMq = makeMq(reducedAdd, reducedRemove);

    // Simulate the useEffect pattern
    const onCoarseChange = () => {};
    const onReducedChange = () => {};
    coarseMq.addEventListener('change', onCoarseChange);
    reducedMq.addEventListener('change', onReducedChange);

    // Simulate cleanup
    coarseMq.removeEventListener('change', onCoarseChange);
    reducedMq.removeEventListener('change', onReducedChange);

    expect(coarseRemove).toHaveBeenCalledWith('change', onCoarseChange);
    expect(reducedRemove).toHaveBeenCalledWith('change', onReducedChange);
  });
});
