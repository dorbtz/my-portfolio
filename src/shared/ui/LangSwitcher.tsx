"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
 * Lang switcher.
 *
 *  1. applyLocale flips <html lang> + <html dir> + cookie instantly (no flash).
 *  2. router.refresh() then re-fetches the current page from the server,
 *     which re-runs the Server Components — they read the new cookie and
 *     pass content through localize(), which hits the Supabase
 *     translations_cache (or calls Gemini on cache miss, persisting the
 *     result for everyone).
 *
 * First HE click on a page is slow (~3-10s for the AI calls); subsequent
 * visits hit cache and are instant. A "Translating…" indicator covers
 * the delay so the user knows something is happening.
 */
export function LangSwitcher({ initialLocale }: Props) {
  // Seed from SSR-passed value, then subscribe to <html lang> so the
  // active button always reflects the live DOM state — necessary because
  // MobileSettingsMenu unmounts/remounts this on every open/close, and
  // without live sync the remount resets the active button to the
  // SSR-time locale (showed EN even after switching to HE).
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [pending, start] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const el = document.documentElement;
    const read = () => {
      const v = el.lang;
      if (v === "en" || v === "he") setLocale(v);
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["lang"] });
    return () => obs.disconnect();
  }, []);

  function pick(next: Locale) {
    if (next === locale && !pending) return;
    setLocale(next);
    applyLocale(next);
    start(() => {
      router.refresh();
    });
  }

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
            onClick={() => pick(l)}
            disabled={pending}
            className={[
              "h-9 px-3 min-w-[44px] rounded-pill text-body-sm font-medium select-none",
              "transition-[background-color,color,transform,opacity] duration-snap ease-snap",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
              "active:scale-[0.96] disabled:cursor-wait",
              active
                ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                : "text-[var(--color-text)] hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)]",
            ].join(" ")}
          >
            {label}
          </button>
        );
      })}
      {pending && (
        <span
          aria-live="polite"
          className="text-caption text-muted px-2 hidden sm:inline"
        >
          {locale === "he" ? "מתרגם…" : "Translating…"}
        </span>
      )}
    </div>
  );
}
