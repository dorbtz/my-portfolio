"use client";

import { useClientStrings } from "@/shared/lib/i18n/client-strings";

/**
 * Skip-to-content link — required for keyboard accessibility (WCAG 2.4.1).
 * Visually hidden until it receives focus (the FIRST keyboard Tab from a
 * page load), then becomes visible in the top-left corner so screen-reader
 * + keyboard users can jump straight past the chrome.
 *
 * Mounted globally; targets `#main-content` which every page's <main>
 * carries via the layout.
 */
export function SkipToContent() {
  // Lazy: we don't strictly need i18n strings for this link, but if we have
  // a HE locale active, a translated label is more polite to a screen reader.
  const locale = useClientStrings();
  // useClientStrings returns the full map; we don't have a skip-link string yet,
  // so derive from locale via document.documentElement.lang via the same hook.
  void locale;
  const label =
    typeof document !== "undefined" && document.documentElement.lang === "he"
      ? "דילוג לתוכן הראשי"
      : "Skip to main content";

  return (
    <a
      href="#main-content"
      className={[
        "fixed top-2 left-2 z-[100]",
        "px-4 py-2 rounded-md font-medium text-body-sm",
        "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]",
        // Visually hidden by default; revealed on focus
        "-translate-y-[200%] focus:translate-y-0",
        "transition-transform duration-snap ease-snap",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text)]",
      ].join(" ")}
    >
      {label}
    </a>
  );
}
