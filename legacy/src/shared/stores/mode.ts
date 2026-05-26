/**
 * src/stores/mode.ts
 * Single source of truth for Thor / Gear 5 dual-mode state.
 * Persists to localStorage. Writes data-mode / data-theme to <html>
 * synchronously on creation so first paint is correct.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Mode = 'thor' | 'gear5';
export type Theme = 'light' | 'dark';

export type ModeState = {
  mode: Mode;
  theme: Theme;
  soundOn: boolean;
  motionOn: boolean;
  /**
   * Whether the mode's signature effects are *active*.
   *   - Luffy/Gear 5: Sun God Nika "Awakened" — drums of liberation loop +
   *     awaken event listeners fire.
   *   - Thor: storm "Engaged" — strike events + lightning loops fire.
   *
   * Intentionally OPT-IN. Resets to `false` on every `setMode` / `toggleMode`
   * so switching modes never auto-blasts effects at the user. The Hero stat
   * tile is the only UI that flips this flag.
   */
  effectsActive: boolean;
  setMode: (m: Mode) => void;
  toggleMode: () => void;
  setTheme: (t: Theme) => void;
  setSoundOn: (b: boolean) => void;
  setMotionOn: (b: boolean) => void;
  setEffectsActive: (b: boolean) => void;
  toggleEffects: () => void;
};

/** One-time migration from the old thor.tsx localStorage keys. */
function migrateFromThorKeys(initialState: { mode: Mode; soundOn: boolean }): void {
  try {
    const thorOn = localStorage.getItem('thor:on');
    const thorSound = localStorage.getItem('thor:soundOn');

    // Only migrate if old keys exist and new persist key hasn't been written yet.
    // 'pf:mode-store' is the actual key used by the persist middleware (name option).
    const newModeKey = localStorage.getItem('pf:mode-store');
    if (newModeKey !== null) return; // already migrated

    if (thorOn !== null) {
      // thor:on === "1" means Thor mode was active; default is thor so no change needed
      // User never explicitly chose gear5 from the old store, so keep thor
      initialState.mode = 'thor';
    }
    if (thorSound !== null) {
      initialState.soundOn = thorSound === '1';
    }
  } catch {
    // localStorage blocked
  }
}

/** Apply data-mode / data-theme to <html> immediately (SSR-safe). */
function applyHtmlAttrs(mode: Mode, theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-mode', mode);
  document.documentElement.setAttribute('data-theme', theme);
}

/** Theme is now derived from mode: Thor → dark, Luffy/Gear5 → light. */
function themeFromMode(mode: Mode): Theme {
  return mode === 'thor' ? 'dark' : 'light';
}

// Compute initial values before store creation so first paint is correct.
function computeInitial(): Pick<ModeState, 'mode' | 'theme' | 'soundOn' | 'motionOn' | 'effectsActive'> {
  let mode: Mode = 'thor';
  let soundOn = true;
  let motionOn = true;

  try {
    const raw = localStorage.getItem('pf:mode-store');
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ModeState>;
      if (parsed.mode === 'thor' || parsed.mode === 'gear5') mode = parsed.mode;
      if (typeof parsed.soundOn === 'boolean') soundOn = parsed.soundOn;
      if (typeof parsed.motionOn === 'boolean') motionOn = parsed.motionOn;
    } else {
      // Try to migrate from old keys
      const candidate = { mode, soundOn };
      migrateFromThorKeys(candidate);
      mode = candidate.mode;
      soundOn = candidate.soundOn;
    }
  } catch {
    // localStorage blocked or JSON invalid — use defaults
  }

  // effectsActive is intentionally NOT persisted — every fresh load starts
  // dormant so we never spook a returning visitor with autoplay audio.
  return { mode, theme: themeFromMode(mode), soundOn, motionOn, effectsActive: false };
}

const initial = computeInitial();
// Apply to <html> synchronously before React renders.
applyHtmlAttrs(initial.mode, initial.theme);

export const useModeStore = create<ModeState>()(
  persist(
    (set, get) => ({
      ...initial,

      setMode: (m) => {
        const t = themeFromMode(m);
        // Mode change always resets effects to OFF — opt-in only via stat tile.
        set({ mode: m, theme: t, effectsActive: false });
        applyHtmlAttrs(m, t);
      },

      toggleMode: () => {
        const next: Mode = get().mode === 'thor' ? 'gear5' : 'thor';
        const t = themeFromMode(next);
        // Mode change always resets effects to OFF — opt-in only via stat tile.
        set({ mode: next, theme: t, effectsActive: false });
        applyHtmlAttrs(next, t);
      },

      setTheme: (t) => {
        // Theme is derived from mode in the unified toggle model. Keep API for
        // backward compatibility but ignore — only mode drives theme.
        set({ theme: t });
        applyHtmlAttrs(get().mode, t);
      },

      setSoundOn: (b) => set({ soundOn: b }),

      setMotionOn: (b) => set({ motionOn: b }),

      setEffectsActive: (b) => set({ effectsActive: b }),

      toggleEffects: () => set({ effectsActive: !get().effectsActive }),
    }),
    {
      name: 'pf:mode-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ---- Selector hooks (single-field subscriptions = minimal re-renders) ----

export function useMode(): Mode {
  return useModeStore((s) => s.mode);
}

export function useTheme(): Theme {
  return useModeStore((s) => s.theme);
}

export function useSoundOn(): boolean {
  return useModeStore((s) => s.soundOn);
}

export function useMotionOn(): boolean {
  return useModeStore((s) => s.motionOn);
}

export function useEffectsActive(): boolean {
  return useModeStore((s) => s.effectsActive);
}
