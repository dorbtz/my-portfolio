"use client";

import { useState } from "react";
import { applyLocale } from "../lib/theme/client";
import { LOCALE_VALUES, type Locale } from "../lib/theme/types";

const LABELS: Record<Locale, { label: string; aria: string }> = {
  en: { label: "EN", aria: "Switch to English" },
  he: { label: "עברית", aria: "עבור לעברית" },
};

type Props = {
  initialLocale: Locale;
};

/**
 * Lang switcher. Only flips <html lang> + <html dir> + cookie for now.
 * Translation pipeline is wired in M6 — the cookie is the same so when M6
 * lands the cached AI translations will start rendering automatically.
 */
export function LangSwitcher({ initialLocale }: Props) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  return (
    <div
      role="radiogroup"
      aria-label="Language"
      className="glass rounded-pill p-1 flex items-center gap-1"
    >
      {LOCALE_VALUES.map((l) => {
        const { label, aria } = LABELS[l];
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={aria}
            onClick={() => {
              setLocale(l);
              applyLocale(l);
            }}
            className={[
              "h-9 px-3 min-w-[44px] rounded-pill text-body-sm font-medium select-none",
              "transition-[background-color,color,transform] duration-snap ease-snap",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
              "active:scale-[0.96]",
              active
                ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                : "text-[var(--color-text)] hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)]",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
