"use client";

import { COOKIES, COOKIE_MAX_AGE, type ColorScheme, type Locale, type Theme } from "./types";

/** Write a cookie that the SSR resolver can read on the next request. */
function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/** Set theme: update <html data-theme> + persist cookie. No round-trip. */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  setCookie(COOKIES.theme, theme);
}

/** Set color scheme: update <html data-scheme> + persist cookie. */
export function applyScheme(scheme: ColorScheme) {
  if (scheme === "auto") {
    delete document.documentElement.dataset.scheme;
  } else {
    document.documentElement.dataset.scheme = scheme;
  }
  setCookie(COOKIES.scheme, scheme);
}

/** Set locale: update <html lang> + <html dir> + persist cookie. */
export function applyLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "he" ? "rtl" : "ltr";
  setCookie(COOKIES.locale, locale);
}
