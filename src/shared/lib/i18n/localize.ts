/**
 * Localize-a-batch helper for Server Components.
 *
 * Usage:
 *   export async function Hero() {
 *     const { locale } = await readThemeState();
 *     const t = await localize(locale, [
 *       { en: "Get in touch",    contentType: "cta" },
 *       { en: "Some long copy.", contentType: "hero" },
 *     ]);
 *     return <h1>{t("Some long copy.")}</h1>;
 *   }
 *
 * First HE render pays the Gemini cost (sequential, ~500ms per uncached
 * string). Subsequent renders hit Supabase cache (~10ms / string).
 *
 * Returns the EN string as-is if locale="en" or any step fails — so the
 * page always renders, even when the AI provider is offline.
 */
import "server-only";
import { tMany } from "@/shared/lib/ai/translate";
import type { Locale } from "@/shared/lib/theme/types";

export type LocalizeInput = { en: string; contentType?: string };

export type Translator = (en: string) => string;

export async function localize(
  locale: Locale,
  inputs: LocalizeInput[]
): Promise<Translator> {
  if (locale === "en" || inputs.length === 0) {
    return (en) => en;
  }
  const map = await tMany(inputs, locale);
  return (en) => map[en] ?? en;
}
