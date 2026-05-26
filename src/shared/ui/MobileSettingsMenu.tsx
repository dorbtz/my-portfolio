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
            "absolute right-0 top-full mt-2 glass rounded-lg p-4",
            "w-[min(290px,calc(100vw-1.5rem))]",
            "flex flex-col gap-4 shadow-2xl",
            // Ensure menu stays inside viewport on very narrow phones
            "max-h-[calc(100dvh-5.5rem)] overflow-y-auto",
          ].join(" ")}
        >
          <div className="flex items-center justify-between">
            <p className="text-caption uppercase tracking-[0.16em] text-muted">
              Settings
            </p>
            <button
              type="button"
              aria-label="Close settings"
              onClick={() => setOpen(false)}
              className="w-8 h-8 grid place-items-center rounded-full text-fg hover:bg-[color-mix(in_oklab,var(--color-text)_10%,transparent)] transition-colors"
            >
              <span aria-hidden className="text-lg leading-none">×</span>
            </button>
          </div>

          <section className="flex flex-col gap-2">
            <p className="text-caption text-muted">Theme</p>
            <ThemeSwitcher
              initialTheme={initialTheme}
              initialScheme={initialScheme}
            />
          </section>

          <section className="flex flex-col gap-2">
            <p className="text-caption text-muted">Language</p>
            <LangSwitcher initialLocale={initialLocale} />
          </section>

          <section className="flex flex-col gap-2">
            <p className="text-caption text-muted">Sound</p>
            {/* SoundToggle self-hides on hightech theme — that's fine; the
                Sound section just collapses to its label in that case. */}
            <SoundToggle />
          </section>
        </div>
      )}
    </div>
  );
}
