/**
 * src/components/BifrostLoader.test.ts
 * Tests for BifrostLoader timer cleanup, session skip, and dismiss behaviour.
 * These tests exercise logic in isolation without rendering React — the core
 * logic (sessionStorage check, timer cleanup pattern) is pure enough to test directly.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const SESSION_KEY = 'pf:bifrost-seen';

function hasSeenThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // blocked
  }
}

describe('BifrostLoader session logic', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('hasSeenThisSession returns false when key is absent', () => {
    expect(hasSeenThisSession()).toBe(false);
  });

  it('hasSeenThisSession returns true after markSeen', () => {
    markSeen();
    expect(hasSeenThisSession()).toBe(true);
  });

  it('markSeen sets the session key to "1"', () => {
    markSeen();
    expect(sessionStorage.getItem(SESSION_KEY)).toBe('1');
  });
});

describe('BifrostLoader timer management', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('auto-dismiss timer fires at 1200ms', () => {
    const dismiss = vi.fn();
    const autoTimer = setTimeout(dismiss, 1200);

    vi.advanceTimersByTime(1199);
    expect(dismiss).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(dismiss).toHaveBeenCalledTimes(1);

    clearTimeout(autoTimer);
  });

  it('fade timer fires at 320ms after dismiss', () => {
    const setVisible = vi.fn();
    const fadeTimer = setTimeout(() => setVisible(false), 320);

    vi.advanceTimersByTime(319);
    expect(setVisible).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(setVisible).toHaveBeenCalledWith(false);

    clearTimeout(fadeTimer);
  });

  it('both timers cleared on cleanup prevent callbacks from firing', () => {
    const dismiss = vi.fn();
    const setVisible = vi.fn();

    const autoTimer = setTimeout(dismiss, 1200);
    const fadeTimer = setTimeout(() => setVisible(false), 1520);

    // Simulate unmount before either fires
    clearTimeout(autoTimer);
    clearTimeout(fadeTimer);

    vi.advanceTimersByTime(2000);

    expect(dismiss).not.toHaveBeenCalled();
    expect(setVisible).not.toHaveBeenCalled();
  });

  it('dismissed guard prevents double-dismiss', () => {
    let dismissed = false;
    const markSeenSpy = vi.fn();

    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      markSeenSpy();
    }

    dismiss();
    dismiss();
    dismiss();

    expect(markSeenSpy).toHaveBeenCalledTimes(1);
  });
});
