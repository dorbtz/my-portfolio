"use client";

import { useState } from "react";
import { applyScheme, applyTheme } from "../lib/theme/client";
import { THEME_VALUES, type ColorScheme, type Theme } from "../lib/theme/types";

const LABELS: Record<Theme, { label: string; glyph: string; aria: string }> = {
  hightech: { label: "High-Tech", glyph: "✨", aria: "Switch to High-Tech theme" },
  thor: { label: "Thor", glyph: "⚡", aria: "Switch to Thor theme" },
  luffy: { label: "Luffy", glyph: "🏴", aria: "Switch to Luffy theme" },
};

const SCHEME_LABELS: Record<ColorScheme, { glyph: string; aria: string }> = {
  auto: { glyph: "◑", aria: "Use system color scheme" },
  light: { glyph: "☼", aria: "Switch to light mode" },
  dark: { glyph: "☽", aria: "Switch to dark mode" },
};

type Props = {
  initialTheme: Theme;
  initialScheme: ColorScheme;
};

export function ThemeSwitcher({ initialTheme, initialScheme }: Props) {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [scheme, setScheme] = useState<ColorScheme>(initialScheme);

  function onThemeChange(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }
  function onSchemeChange(next: ColorScheme) {
    setScheme(next);
    applyScheme(next);
  }

  return (
    <div className="glass rounded-pill p-1 flex items-center gap-1" role="group" aria-label="Theme controls">
      <div role="radiogroup" aria-label="Visual theme" className="flex items-center gap-1">
        {THEME_VALUES.map((t) => {
          const { label, glyph, aria } = LABELS[t];
          const active = theme === t;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={aria}
              onClick={() => onThemeChange(t)}
              className={[
                "h-9 min-w-[44px] px-3 rounded-pill text-body-sm font-medium select-none",
                "transition-[background-color,color,transform] duration-snap ease-snap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
                "active:scale-[0.96]",
                active
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                  : "text-[var(--color-text)] hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)]",
              ].join(" ")}
              title={label}
            >
              <span aria-hidden>{glyph}</span>
              <span className="sr-only">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="w-px h-6 bg-[var(--color-border)] mx-1" aria-hidden />

      <div role="radiogroup" aria-label="Color scheme" className="flex items-center gap-1">
        {(Object.keys(SCHEME_LABELS) as ColorScheme[]).map((s) => {
          const { glyph, aria } = SCHEME_LABELS[s];
          const active = scheme === s;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={aria}
              onClick={() => onSchemeChange(s)}
              className={[
                "h-9 w-9 min-w-[44px] rounded-pill text-body-sm select-none grid place-items-center",
                "transition-[background-color,color,transform] duration-snap ease-snap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
                "active:scale-[0.96]",
                active
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                  : "text-[var(--color-text)] hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)]",
              ].join(" ")}
            >
              <span aria-hidden>{glyph}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
