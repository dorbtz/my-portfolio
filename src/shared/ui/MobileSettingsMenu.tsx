"use client";

import { useEffect, useRef, useState } from "react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { LangSwitcher } from "./LangSwitcher";
import { SoundToggle } from "./SoundToggle";
import type { ColorScheme, Locale, Theme } from "../lib/theme/types";

type Props = {
  initialTheme: Theme;
  initialScheme: ColorScheme;
  initialLocale: Locale;
};

/**
 * Mobile-only collapsed settings cluster. Renders as a single glass icon
 * button anchored top-right below the sticky header; tapping it opens a
 * compact card with the same Theme + Language + Sound controls the desktop
 * cluster exposes, grouped under short labels.  Replaces the stacked floating
 * pills (which overlapped the hero content on small viewports).
 *
 * Closes on:
 *   - Pressing the close button
 *   - Tapping outside the panel
 *   - Pressing Esc
 */
export function MobileSettingsMenu({ initialTheme, initialScheme, initialLocale }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label={open ? "Close settings menu" : "Open settings menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={[
          "glass rounded-pill w-12 h-12 grid place-items-center select-none",
          "transition-[background-color,color,transform] duration-snap ease-snap",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
          "active:scale-[0.96]",
          open
            ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
            : "text-[var(--color-text)] hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)]",
        ].join(" ")}
      >
        {/* Settings glyph — gear-like, accessible */}
        <svg
          aria-hidden
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Site settings"
          className={[
            "absolute right-0 top-full mt-2 glass rounded-lg p-3",
            "w-[min(320px,calc(100vw-1rem))]",
            "flex flex-col shadow-2xl",
            // Stays inside viewport on very narrow phones
            "max-h-[calc(100dvh-5.5rem)] overflow-y-auto",
          ].join(" ")}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-caption uppercase tracking-[0.18em] text-muted font-semibold">
              Settings
            </p>
            <button
              type="button"
              aria-label="Close settings"
              onClick={() => setOpen(false)}
              className="w-8 h-8 grid place-items-center rounded-full text-fg hover:bg-[color-mix(in_oklab,var(--color-text)_10%,transparent)] transition-colors"
            >
              <span aria-hidden className="text-xl leading-none">×</span>
            </button>
          </div>

          <Section label="Theme">
            <div className="flex justify-center">
              <ThemeSwitcher
                initialTheme={initialTheme}
                initialScheme={initialScheme}
              />
            </div>
          </Section>

          <Section label="Language">
            <div className="flex justify-center">
              <LangSwitcher initialLocale={initialLocale} />
            </div>
          </Section>

          {/* SoundToggle self-hides on hightech theme. The Section wrapper
              still renders its label even when empty so the menu layout
              doesn't jump on theme switch. */}
          <Section label="Sound">
            <div className="flex justify-center min-h-[2.5rem] items-center">
              <SoundToggle />
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

/** Tiny section wrapper — small uppercase label + a thin divider above
 *  (skipped on the first section). Keeps the menu rhythm consistent. */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 py-2.5 border-t border-[var(--color-border)] first:border-t-0">
      <p className="text-caption uppercase tracking-[0.14em] text-muted text-center font-medium">
        {label}
      </p>
      {children}
    </section>
  );
}
