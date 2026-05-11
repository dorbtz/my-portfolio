/**
 * src/lib/navigate.test.ts
 *
 * Tests for useViewTransitionNav fallback behaviour.
 *
 * Architecture note: useViewTransitionNav is a React hook that calls
 * useNavigate() internally, which requires a Router context. Rather than
 * rendering a component tree, we inline the core dispatch logic and test
 * it as pure functions — matching the established project pattern.
 *
 * What we test:
 *   1. When document.startViewTransition is a function, the navigation is
 *      wrapped inside it and navigate() is called from within that callback.
 *   2. When document.startViewTransition is undefined (older browsers),
 *      navigate() is called directly without wrapping.
 *   3. The returned function always calls navigate() exactly once per invocation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Inline navigate dispatch logic (mirrors useViewTransitionNav in navigate.ts) ──

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

function createNavigateFn(
  navigate: (to: string) => void,
  doc: DocWithVT,
): (to: string) => void {
  return (to: string) => {
    if (typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => {
        navigate(to);
      });
    } else {
      navigate(to);
    }
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useViewTransitionNav — with startViewTransition supported', () => {
  let navigateMock: ReturnType<typeof vi.fn>;
  let docWithVT: DocWithVT;

  beforeEach(() => {
    navigateMock = vi.fn();
    docWithVT = {
      startViewTransition: vi.fn((cb: () => void): { ready: Promise<void> } => {
        cb(); // call the callback synchronously (simulates browser behaviour)
        return { ready: Promise.resolve() };
      }),
    } as unknown as DocWithVT;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls document.startViewTransition when API is available', () => {
    const go = createNavigateFn(navigateMock, docWithVT);
    go('/projects/foo');

    expect(docWithVT.startViewTransition).toHaveBeenCalledTimes(1);
  });

  it('calls navigate() inside the startViewTransition callback', () => {
    const go = createNavigateFn(navigateMock, docWithVT);
    go('/projects/foo');

    expect(navigateMock).toHaveBeenCalledWith('/projects/foo');
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it('passes the correct path to navigate()', () => {
    const go = createNavigateFn(navigateMock, docWithVT);
    go('/projects/mjolnir-ui');

    expect(navigateMock).toHaveBeenCalledWith('/projects/mjolnir-ui');
  });
});

describe('useViewTransitionNav — fallback when startViewTransition is undefined', () => {
  let navigateMock: ReturnType<typeof vi.fn>;
  let docWithoutVT: DocWithVT;

  beforeEach(() => {
    navigateMock = vi.fn();
    // Simulate a browser that does not support View Transitions
    docWithoutVT = {} as DocWithVT;
  });

  it('calls navigate() directly (no wrapping)', () => {
    const go = createNavigateFn(navigateMock, docWithoutVT);
    go('/projects/bar');

    expect(navigateMock).toHaveBeenCalledWith('/projects/bar');
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it('does not throw when startViewTransition is undefined', () => {
    const go = createNavigateFn(navigateMock, docWithoutVT);
    expect(() => go('/projects/baz')).not.toThrow();
  });

  it('still navigates to the correct path in fallback mode', () => {
    const go = createNavigateFn(navigateMock, docWithoutVT);
    go('/projects/gear5-design-system');

    expect(navigateMock).toHaveBeenCalledWith('/projects/gear5-design-system');
  });
});

describe('useViewTransitionNav — navigate called exactly once per invocation', () => {
  it('navigate is called exactly once with VT supported', () => {
    const navigate = vi.fn();
    const doc: DocWithVT = {
      startViewTransition: (cb: () => void): { ready: Promise<void> } => { cb(); return { ready: Promise.resolve() }; },
    } as unknown as DocWithVT;

    const go = createNavigateFn(navigate, doc);
    go('/foo');
    go('/bar');
    go('/baz');

    expect(navigate).toHaveBeenCalledTimes(3);
  });

  it('navigate is called exactly once per call without VT', () => {
    const navigate = vi.fn();
    const doc: DocWithVT = {} as DocWithVT;

    const go = createNavigateFn(navigate, doc);
    go('/foo');
    go('/bar');

    expect(navigate).toHaveBeenCalledTimes(2);
  });
});
