export type Theme = "hightech" | "thor" | "luffy";
export type ColorScheme = "auto" | "light" | "dark";
export type Locale = "en" | "he";

export const THEME_VALUES: readonly Theme[] = ["hightech", "thor", "luffy"] as const;
export const SCHEME_VALUES: readonly ColorScheme[] = ["auto", "light", "dark"] as const;
export const LOCALE_VALUES: readonly Locale[] = ["en", "he"] as const;

export const DEFAULTS = {
  theme: "hightech" as Theme,
  scheme: "auto" as ColorScheme,
  locale: "en" as Locale,
} as const;

export const COOKIES = {
  theme: "pf-theme",
  scheme: "pf-scheme",
  locale: "pf-locale",
} as const;

/** One year. Cookie persistence target. */
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isTheme(v: unknown): v is Theme {
  return typeof v === "string" && (THEME_VALUES as readonly string[]).includes(v);
}
export function isScheme(v: unknown): v is ColorScheme {
  return typeof v === "string" && (SCHEME_VALUES as readonly string[]).includes(v);
}
export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALE_VALUES as readonly string[]).includes(v);
}
