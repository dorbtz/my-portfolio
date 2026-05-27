"use client";

import { useEffect, useState, type ReactNode } from "react";
import { applyScheme, applyTheme } from "../lib/theme/client";
import { THEME_VALUES, type ColorScheme, type Theme } from "../lib/theme/types";

type ThemeGlyph =
  | { kind: "emoji"; value: string }
  | { kind: "mask"; src: string; alt: string };

const LABELS: Record<Theme, { label: string; glyph: ThemeGlyph; aria: string }> = {
  hightech: {
    label: "High-Tech",
    glyph: { kind: "emoji", value: "✨" },
    aria: "Switch to High-Tech theme",
  },
  thor: {
    label: "Thor",
    glyph: { kind: "mask", src: "/assets/Marvel/mjolnir.png", alt: "Mjolnir" },
    aria: "Switch to Thor theme",
  },
  luffy: {
    label: "Luffy",
    glyph: { kind: "mask", src: "/assets/One-Piece/nika-symbol.png", alt: "Nika sun symbol" },
    aria: "Switch to Luffy theme",
  },
};

const SCHEME_LABELS: Record<ColorScheme, { glyph: string; aria: string }> = {
  auto: { glyph: "◑", aria: "Use system color scheme" },
  light: { glyph: "☼", aria: "Switch to light mode" },
  dark: { glyph: "☽", aria: "Switch to dark mode" },
};

/**
 * Glyph renderer.
 *  - emoji: short Unicode glyph (used for High-Tech ✨ since there's no brand icon)
 *  - mask : the PNG's alpha channel becomes a mask; the fill is currentColor.
 *           Result: the icon picks up the button's text color — dark in light
 *           mode, white in dark mode, accent-contrast when the button is active.
 *           Works perfectly for monochrome / silhouette PNGs.
 */
function renderGlyph(g: ThemeGlyph): ReactNode {
  if (g.kind === "emoji") return <span aria-hidden>{g.value}</span>;
  return (
    <span
      aria-label={g.alt}
      role="img"
      className="theme-glyph"
      style={{
        WebkitMaskImage: `url(${g.src})`,
        maskImage: `url(${g.src})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        backgroundColor: "currentColor",
        width: 20,
        height: 20,
        display: "inline-block",
      }}
    />
  );
}

type Props = {
  initialTheme: Theme;
  initialScheme: ColorScheme;
};

export function ThemeSwitcher({ initialTheme, initialScheme }: Props) {
  // Seed with the SSR-passed values so hydration matches the server render,
  // then subscribe to <html data-theme>/<html data-scheme> via
  // MutationObserver so the active button is ALWAYS in sync with the live
  // DOM state — even after a remount (e.g. the MobileSettingsMenu
  // dropdown unmounts the switcher on close and remounts it on open; with
  // the old code that remount reset the active button to the SSR-time
  // theme, so reopening the menu always showed Luffy regardless of the
  // currently-applied theme).
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [scheme, setScheme] = useState<ColorScheme>(initialScheme);

  useEffect(() => {
    const el = document.documentElement;
    const read = () => {
      const t = el.dataset.theme;
      if (t === "hightech" || t === "thor" || t === "luffy") setTheme(t);
      const s = el.dataset.scheme;
      if (s === "light" || s === "dark") setScheme(s);
      else if (s === undefined) setScheme("auto");
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme", "data-scheme"] });
    return () => obs.disconnect();
  }, []);

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
                "inline-flex items-center justify-center",
                "transition-[background-color,color,transform] duration-snap ease-snap",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
                "active:scale-[0.96]",
                active
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                  : "text-[var(--color-text)] hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)]",
              ].join(" ")}
              title={label}
            >
              {renderGlyph(glyph)}
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
