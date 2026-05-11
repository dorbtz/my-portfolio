/**
 * src/lib/lenis.ts
 * Shared module-level Lenis singleton accessor.
 * SmoothScrollProvider writes to _lenisInstance; consumers call getLenis().
 * Keeping this separate from the provider avoids react-refresh/only-export-components violations.
 */
import type Lenis from 'lenis';

let _lenisInstance: Lenis | null = null;

/** Set by SmoothScrollProvider on init. Do not call from outside the provider. */
export function _setLenis(instance: Lenis | null): void {
  _lenisInstance = instance;
}

/** Returns the live Lenis instance, or null when Lenis is not active. */
export function getLenis(): Lenis | null {
  return _lenisInstance;
}
