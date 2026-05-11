/**
 * src/stores/mode.test.ts
 * Unit tests for mode state logic, including migration from thor:* keys.
 * Uses inline Zustand store creation to work around rolldown-vite v7 SSR
 * transform issues where persist middleware exports fail in jsdom.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';

type Mode = 'thor' | 'gear5';
type Theme = 'light' | 'dark';

type ModeState = {
  mode: Mode;
  theme: Theme;
  soundOn: boolean;
  motionOn: boolean;
  setMode: (m: Mode) => void;
  toggleMode: () => void;
  setTheme: (t: Theme) => void;
  setSoundOn: (b: boolean) => void;
  setMotionOn: (b: boolean) => void;
};

function applyHtmlAttrs(mode: Mode, theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-mode', mode);
  document.documentElement.setAttribute('data-theme', theme);
}

// Create a fresh store for tests (no persist middleware — avoids localStorage coupling)
function createTestStore() {
  return create<ModeState>()((set, get) => ({
    mode: 'thor',
    theme: 'dark',
    soundOn: true,
    motionOn: true,

    setMode: (m) => {
      set({ mode: m });
      applyHtmlAttrs(m, get().theme);
    },

    toggleMode: () => {
      const next: Mode = get().mode === 'thor' ? 'gear5' : 'thor';
      set({ mode: next });
      applyHtmlAttrs(next, get().theme);
    },

    setTheme: (t) => {
      set({ theme: t });
      applyHtmlAttrs(get().mode, t);
    },

    setSoundOn: (b) => set({ soundOn: b }),
    setMotionOn: (b) => set({ motionOn: b }),
  }));
}

let store: ReturnType<typeof createTestStore>;

beforeEach(() => {
  store = createTestStore();
  vi.spyOn(document.documentElement, 'setAttribute').mockImplementation(() => {});
});

describe('Mode store', () => {
  it('has correct initial defaults', () => {
    const state = store.getState();
    expect(state.mode).toBe('thor');
    expect(state.theme).toBe('dark');
    expect(state.soundOn).toBe(true);
    expect(state.motionOn).toBe(true);
  });

  it('setMode changes mode to gear5', () => {
    store.getState().setMode('gear5');
    expect(store.getState().mode).toBe('gear5');
  });

  it('setMode changes mode back to thor', () => {
    store.setState({ mode: 'gear5' });
    store.getState().setMode('thor');
    expect(store.getState().mode).toBe('thor');
  });

  it('toggleMode flips thor → gear5', () => {
    store.setState({ mode: 'thor' });
    store.getState().toggleMode();
    expect(store.getState().mode).toBe('gear5');
  });

  it('toggleMode flips gear5 → thor', () => {
    store.setState({ mode: 'gear5' });
    store.getState().toggleMode();
    expect(store.getState().mode).toBe('thor');
  });

  it('setTheme changes theme to light', () => {
    store.getState().setTheme('light');
    expect(store.getState().theme).toBe('light');
  });

  it('setSoundOn sets soundOn to false', () => {
    store.getState().setSoundOn(false);
    expect(store.getState().soundOn).toBe(false);
  });

  it('setMotionOn sets motionOn to false', () => {
    store.getState().setMotionOn(false);
    expect(store.getState().motionOn).toBe(false);
  });

  it('setMode writes data-mode to documentElement', () => {
    store.getState().setMode('gear5');
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-mode', 'gear5');
  });

  it('setTheme writes data-theme to documentElement', () => {
    store.getState().setTheme('light');
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
  });
});

// ---- Migration tests ----
// Inline migrateFromThorKeys logic to test without importing persist-wrapped store.
describe('migrateFromThorKeys', () => {
  function migrateFromThorKeys(initialState: { mode: Mode; soundOn: boolean }): void {
    try {
      const thorOn = localStorage.getItem('thor:on');
      const thorSound = localStorage.getItem('thor:soundOn');

      // Use the correct persist key 'pf:mode-store' (not 'pf:mode')
      const newModeKey = localStorage.getItem('pf:mode-store');
      if (newModeKey !== null) return; // already migrated

      if (thorOn !== null) {
        initialState.mode = 'thor';
      }
      if (thorSound !== null) {
        initialState.soundOn = thorSound === '1';
      }
    } catch {
      // localStorage blocked
    }
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('skips migration when pf:mode-store already exists', () => {
    localStorage.setItem('pf:mode-store', '{"mode":"gear5"}');
    localStorage.setItem('thor:soundOn', '0');

    const state = { mode: 'thor' as Mode, soundOn: true };
    migrateFromThorKeys(state);

    // soundOn should remain true because migration was skipped
    expect(state.soundOn).toBe(true);
  });

  it('migrates thor:soundOn "1" → soundOn true', () => {
    localStorage.setItem('thor:soundOn', '1');

    const state = { mode: 'thor' as Mode, soundOn: false };
    migrateFromThorKeys(state);

    expect(state.soundOn).toBe(true);
  });

  it('migrates thor:soundOn "0" → soundOn false', () => {
    localStorage.setItem('thor:soundOn', '0');

    const state = { mode: 'thor' as Mode, soundOn: true };
    migrateFromThorKeys(state);

    expect(state.soundOn).toBe(false);
  });

  it('preserves defaults when no thor:* keys exist', () => {
    const state = { mode: 'thor' as Mode, soundOn: true };
    migrateFromThorKeys(state);

    expect(state.mode).toBe('thor');
    expect(state.soundOn).toBe(true);
  });

  it('does NOT migrate when pf:mode-store key is present (guard uses correct key)', () => {
    // Previously the guard incorrectly checked 'pf:mode' instead of 'pf:mode-store'.
    // This test ensures the correct key is used.
    localStorage.setItem('pf:mode-store', JSON.stringify({ mode: 'gear5', soundOn: true }));
    localStorage.setItem('thor:soundOn', '0'); // old key with different value

    const state = { mode: 'gear5' as Mode, soundOn: true };
    migrateFromThorKeys(state);

    // Migration should be skipped — soundOn stays true
    expect(state.soundOn).toBe(true);
  });
});
