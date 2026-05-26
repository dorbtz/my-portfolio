/**
 * EN -> HE translation cache + Gemini fallback.
 *
 * Architecture (per SPEC.md §14):
 *   - EN is canonical; HE is generated on demand and cached forever in
 *     Supabase `translations_cache` (key = sha256(en + content_type)).
 *   - Cache HIT  -> returns instantly, zero AI cost.
 *   - Cache MISS -> calls Gemini, persists the result, returns it. The
 *     first HE visitor for a given string pays a ~500ms penalty; everyone
 *     after gets a free cache hit.
 *   - On Gemini failure we log + fall back to the EN string (the page
 *     stays rendered, just temporarily un-translated).
 *
 * Glossary: hard-pinned terms never get translated. Listed in SYSTEM_PROMPT.
 */
import "server-only";
import { createHash } from "node:crypto";
import { generateText } from "ai";
import { chatModel, hasAIProvider } from "./provider";
import { createServerClient } from "@supabase/ssr";

type Locale = "en" | "he";

const TRANSLATE_SYSTEM_PROMPT = `You translate short snippets of website copy from English to Hebrew (he-IL).

Rules:
- Return ONLY the translated Hebrew string. No prefix, no explanation, no quotes.
- Preserve Markdown / HTML tags exactly.
- Preserve URLs verbatim.
- Preserve numbers and dates verbatim unless the surrounding language style demands otherwise.
- Match the source's register (professional, casual, etc.).
- These terms MUST stay verbatim in English / Latin script (do NOT translate):
  Dor Ben Tzur, Lumen, Nebula-1, AI Brain, Mjolnir, Thor, Luffy, Nika,
  Bifrost, Asgard, Wolt, John Bryce, IDF, Next.js, React, Supabase,
  Vercel, Tailwind, TypeScript, JavaScript, Python, GitHub, LinkedIn,
  Gemini, Claude, OpenAI, Anthropic, Geist, Bangers, Bebas Neue,
  pgvector, Postgres, PostgreSQL, MongoDB, MySQL, Docker, Three.js,
  React Three Fiber, Framer Motion, AI SDK, RAG, MCP, REST, API.`;

/** Sha-256 hex digest. Used as the cache key. */
function makeKey(en: string, contentType: string): string {
  return createHash("sha256").update(`${contentType}::${en}`).digest("hex");
}

/** Service-role client used here for cache writes (anon can only read). */
function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error("Supabase service-role env vars missing.");
  }
  return createServerClient(url, serviceRole, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

async function callGemini(en: string): Promise<string> {
  const { text } = await generateText({
    model: chatModel(),
    system: TRANSLATE_SYSTEM_PROMPT,
    prompt: en,
    temperature: 0.2,
    maxRetries: 1,
  });
  return text.trim();
}

/**
 * Translate a single string to the requested locale. Returns the EN string
 * unchanged if locale="en" or the AI provider isn't configured.
 *
 * @param en           The canonical English string.
 * @param locale       Target locale.
 * @param contentType  Free-form tag — used in the cache key so the same
 *                     EN string can have different translations per context
 *                     (e.g. "nav" vs "hero" vs "project:lumen.tagline").
 */
export async function t(
  en: string,
  locale: Locale = "en",
  contentType: string = "text"
): Promise<string> {
  if (!en) return en;
  if (locale === "en") return en;
  if (!hasAIProvider()) return en; // fail-open: render EN if no key

  const key = makeKey(en, contentType);
  const supabase = createSupabaseAdminClient();

  // 1) Read cache
  try {
    const { data, error } = await supabase
      .from("translations_cache")
      .select("he")
      .eq("key", key)
      .maybeSingle();
    if (!error && data?.he) return data.he;
  } catch (err) {
    console.warn("[i18n/translate] cache read failed, will call Gemini", err);
  }

  // 2) Call Gemini
  let he = en;
  try {
    he = await callGemini(en);
  } catch (err) {
    console.warn("[i18n/translate] Gemini call failed, falling back to EN", err);
    return en;
  }

  // 3) Persist (best-effort; we still return the value even if the upsert fails)
  try {
    await supabase.from("translations_cache").upsert(
      {
        key,
        source_table: "text",
        content_type: contentType,
        en,
        he,
      },
      { onConflict: "key" }
    );
  } catch (err) {
    console.warn("[i18n/translate] cache write failed", err);
  }

  return he;
}

/**
 * Batch translator. Reads all cache entries in one round-trip, then translates
 * the misses sequentially (Gemini free tier likes serial requests). Returns a
 * map from each input EN string to its HE translation (or EN on failure).
 */
export async function tMany(
  texts: Array<{ en: string; contentType?: string }>,
  locale: Locale = "en"
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  if (locale === "en" || !hasAIProvider() || texts.length === 0) {
    for (const { en } of texts) out[en] = en;
    return out;
  }
  // Run sequentially to respect free-tier RPM limits. With ~30 chunks this is
  // ~15s on a cold cache, ~50ms on a warm one.
  for (const { en, contentType } of texts) {
    out[en] = await t(en, locale, contentType ?? "text");
  }
  return out;
}
