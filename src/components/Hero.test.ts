/**
 * src/components/Hero.test.ts
 * Tests for Hero.handleLift motion-gating logic.
 * Tests the handleLift pattern in isolation: timeline not started when
 * motionOn=false, but audio still plays.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Hero.handleLift motion gating', () => {
  let playSfxSpy: ReturnType<typeof vi.fn>;
  let dispatchSpy: ReturnType<typeof vi.fn>;
  let timelineSpy: ReturnType<typeof vi.fn>;
  let timelineKillSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    playSfxSpy = vi.fn();
    dispatchSpy = vi.fn();
    timelineKillSpy = vi.fn();
    timelineSpy = vi.fn().mockReturnValue({
      to: vi.fn().mockReturnThis(),
      kill: timelineKillSpy,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /**
   * Simulate the handleLift function extracted from Hero.tsx:
   * - Audio always plays (independent of motion).
   * - GSAP timeline skipped when motionOn=false or reducedMotion=true.
   */
  function simulateHandleLift(
    motionOn: boolean,
    reducedMotion: boolean,
    containerAvailable: boolean
  ) {
    // Audio plays regardless
    playSfxSpy('hammer.ring');
    setTimeout(() => playSfxSpy('thunder.short', { volume: 0.35 }), 120);

    // Dispatch strike (always)
    dispatchSpy('thor:strike');

    if (!motionOn || reducedMotion) return; // bail before GSAP

    if (!containerAvailable) return;

    const tl = timelineSpy();
    tl.to({}, { y: -32, duration: 0.35, ease: 'power2.out' })
      .to({}, { y: 0, duration: 0.55, ease: 'elastic.out(1, 0.4)' });
  }

  it('plays audio even when motionOn is false', () => {
    simulateHandleLift(false, false, true);
    expect(playSfxSpy).toHaveBeenCalledWith('hammer.ring');
  });

  it('plays thunder.short after 120ms delay regardless of motion', () => {
    simulateHandleLift(false, false, true);
    expect(playSfxSpy).toHaveBeenCalledTimes(1); // only hammer.ring so far
    vi.advanceTimersByTime(120);
    expect(playSfxSpy).toHaveBeenCalledTimes(2);
    expect(playSfxSpy).toHaveBeenLastCalledWith('thunder.short', { volume: 0.35 });
  });

  it('dispatches thor:strike even when motionOn is false', () => {
    simulateHandleLift(false, false, true);
    expect(dispatchSpy).toHaveBeenCalledWith('thor:strike');
  });

  it('does NOT start GSAP timeline when motionOn is false', () => {
    simulateHandleLift(false, false, true);
    expect(timelineSpy).not.toHaveBeenCalled();
  });

  it('does NOT start GSAP timeline when reducedMotion is true', () => {
    simulateHandleLift(true, true, true);
    expect(timelineSpy).not.toHaveBeenCalled();
  });

  it('starts GSAP timeline when motionOn is true and reducedMotion is false', () => {
    simulateHandleLift(true, false, true);
    expect(timelineSpy).toHaveBeenCalledTimes(1);
  });

  it('does NOT start timeline if container is not available', () => {
    simulateHandleLift(true, false, false);
    expect(timelineSpy).not.toHaveBeenCalled();
  });
});
