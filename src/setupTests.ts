import '@testing-library/jest-dom';

// Workaround for rolldown-vite v7 SSR transform injecting __vite_ssr_exportName__
// helpers into module wrappers that aren't available in the jsdom test runtime.
// See: https://github.com/vitest-dev/vitest/issues/8754
const g = globalThis as Record<string, unknown>;
if (typeof g.__vite_ssr_exportName__ === 'undefined') {
  g.__vite_ssr_exportName__ = (_name: string, getter: () => unknown) => getter();
}

// Provide a localStorage stub for Zustand persist middleware in jsdom
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// sessionStorage stub
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});
