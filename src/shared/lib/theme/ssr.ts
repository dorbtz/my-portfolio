import { cookies } from "next/headers";
import { COOKIES, DEFAULTS, isLocale, isScheme, isTheme, type ColorScheme, type Locale, type Theme } from "./types";

export type ThemeState = {
  theme: Theme;
  scheme: ColorScheme;
  locale: Locale;
};

/** Read the persisted theme cookies. Server Component only. */
export async function readThemeState(): Promise<ThemeState> {
  const store = await cookies();
  const rawTheme = store.get(COOKIES.theme)?.value;
  const rawScheme = store.get(COOKIES.scheme)?.value;
  const rawLocale = store.get(COOKIES.locale)?.value;
  return {
    theme: isTheme(rawTheme) ? rawTheme : DEFAULTS.theme,
    scheme: isScheme(rawScheme) ? rawScheme : DEFAULTS.scheme,
    locale: isLocale(rawLocale) ? rawLocale : DEFAULTS.locale,
  };
}
