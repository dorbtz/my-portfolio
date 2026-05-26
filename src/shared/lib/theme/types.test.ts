import { describe, expect, it } from "vitest";
import {
  COOKIES,
  COOKIE_MAX_AGE,
  DEFAULTS,
  LOCALE_VALUES,
  SCHEME_VALUES,
  THEME_VALUES,
  isLocale,
  isScheme,
  isTheme,
} from "./types";

/** Theme / scheme / locale guards protect against bad cookie values reaching
 *  the SSR resolver. Each guard rejects everything that isn't an exact match. */
describe("theme/types — type guards", () => {
  it("accepts every documented theme value", () => {
    for (const t of THEME_VALUES) expect(isTheme(t)).toBe(true);
  });
  it("rejects unknown / malformed theme values", () => {
    for (const bad of ["HIGHTECH", "gear5", "", null, undefined, 42, {}]) {
      expect(isTheme(bad)).toBe(false);
    }
  });

  it("accepts every documented scheme value", () => {
    for (const s of SCHEME_VALUES) expect(isScheme(s)).toBe(true);
  });
  it("rejects unknown scheme values (e.g. system, AUTO)", () => {
    for (const bad of ["system", "AUTO", "", null, 1]) {
      expect(isScheme(bad)).toBe(false);
    }
  });

  it("accepts only en / he locales", () => {
    for (const l of LOCALE_VALUES) expect(isLocale(l)).toBe(true);
    expect(isLocale("en-US")).toBe(false);
    expect(isLocale("ar")).toBe(false);
  });

  it("default state is hightech / auto / en", () => {
    expect(DEFAULTS).toEqual({ theme: "hightech", scheme: "auto", locale: "en" });
  });

  it("cookie names are stable (changing breaks all existing sessions)", () => {
    expect(COOKIES).toEqual({
      theme: "pf-theme",
      scheme: "pf-scheme",
      locale: "pf-locale",
    });
  });

  it("cookie max age is one year", () => {
    expect(COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 365);
  });
});
