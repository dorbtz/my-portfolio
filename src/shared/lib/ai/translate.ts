/**
 * EN -> HE translation cache + Gemini fallback.
 *
 * Architecture (per SPEC.md §14):
 *   - EN is canonical; HE is generated on demand and cached forever in
 *     Supabase `translations_cache` (key = sha256(en + content_type)).
 *   - Cache HIT  -> returns instantly, zero AI cost.
 *   - Cache MISS -> calls Gemini, persists the result, returns it. The
 *     first HE visitor for a given string pays a small penalty; everyone
 *     after gets a free cache hit.
 *   - On Gemini failure we log + fall back to the EN string (the page
 *     stays rendered, just temporarily un-translated).
 *
 * Two model choices:
 *   - For translations we use gemini-2.5-flash-lite (15 RPM free tier,
 *     vs gemini-2.5-flash's 5 RPM) — same Hebrew quality, 3× headroom.
 *   - tBatchTranslate sends N strings in ONE call (JSON in / JSON out),
 *     so a fresh HE page render costs ~4 Gemini calls (one per section)
 *     instead of one per string. Cached strings cost zero.
 *
 * Glossary: hard-pinned terms never get translated. Listed in SYSTEM_PROMPT.
 */
import "server-only";
import { createHash } from "node:crypto";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { hasAIProvider } from "./provider";
import { createServerClient } from "@supabase/ssr";

type Locale = "en" | "he";

/** Higher free-tier quota than gemini-2.5-flash (used by the chatbot). */
const TRANSLATE_MODEL = "gemini-2.5-flash-lite";

const TRANSLATE_GLOSSARY = `Brand names and tech proper nouns MUST stay in Latin script (do NOT translate, do NOT transliterate):
Dor Ben Tzur, Lumen, Nebula-1, AI Brain, Mjolnir, Thor, Luffy, Nika,
Bifrost, Asgard, Wolt, John Bryce, IDF, Next.js, React, Supabase, Vercel,
Tailwind, TypeScript, JavaScript, Python, GitHub, LinkedIn, Gemini, Claude,
OpenAI, Anthropic, Geist, Bangers, Bebas Neue, pgvector, Postgres,
PostgreSQL, MongoDB, MySQL, Docker, Three.js, React Three Fiber,
Framer Motion, AI SDK, RAG, MCP, REST, API, HTML, CSS, SQL, AVIF, WebP.`;

const BATCH_SYSTEM_PROMPT = `You are a senior Hebrew (he-IL) UX writer for an Israeli tech startup. You
translate short snippets of website copy from English to modern, natural,
spoken Hebrew that an Israeli developer/recruiter reads on a portfolio site.

Input: a JSON object { "input": [<en1>, <en2>, ...] }.
Output: STRICT JSON in exactly this shape, no preamble, no markdown fence:
  { "translations": [<he1>, <he2>, ...] }
The translations array MUST have the same length as input, same order.

HEBREW QUALITY RULES — these are non-negotiable:

1. Register: modern conversational Hebrew (לשון דבורה). Never Biblical, never
   over-formal newspaper style. Write the way Wix, Monday.com, and AppsFlyer
   write their Hebrew product copy.

2. Don't translate word-for-word from English syntax. Re-shape the sentence
   into natural Hebrew word order even if that changes the structure.
   ✗ "אני אוהב לבנות תוכנה ש-X"  (calque)
   ✓ "אני בונה תוכנה ש-X"        (natural)

3. Gender neutrality:
   - UI labels: use noun phrases, never imperative verbs.
     ✗ "צפה באתר" (masc. imperative)  ✓ "לאתר" (directional noun)
   - When a verb IS unavoidable, use third-person singular describing the
     SYSTEM, not the user: "מתרגם…" not "תרגם".
   - When referring to the user's gender, use the masculine form (standard
     Hebrew default) but only if context makes a verb form unavoidable.

4. Definite article ה־:
   - When an adjective or possessive modifies a definite noun, the ה־ MUST
     attach to the modifier too.
       ✓ "כל הפרויקטים"   ✗ "כל פרויקטים"
       ✓ "הבעיה המרכזית"  ✗ "הבעיה מרכזית"
   - Do not invent unnecessary ה־ — proper nouns and possessive constructs
     don't get one.

5. Possessives — prefer inflected forms over "שלי" suffixes when shorter:
     ✓ "תפקידי" (1 word, professional)
     △ "התפקיד שלי" (2 words, conversational — only when emphasis warrants)

6. Quote marks: use Hebrew quotation marks: ״״ for outer, ׳׳ for inner.
   English smart quotes "…" should become ״…״.

7. Numbers, dates, URLs: preserve verbatim.

8. Markdown / HTML tags: preserve verbatim, including spacing.

9. Glossary — these tokens MUST appear in the output EXACTLY as written,
   in Latin script, never transliterated, never translated:
${TRANSLATE_GLOSSARY}

10. Arrows: → in the source becomes ← in Hebrew (RTL flip). Vice versa.

11. If the source string is a single word that is itself a glossary item or
    a brand name, return it unchanged.

12. Never add a translator's note, never apologize, never explain. Return
    only the JSON object.`;

/** Sha-256 hex digest. Used as the cache key. */
function makeKey(en: string, contentType: string): string {
  return createHash("sha256").update(`${contentType}::${en}`).digest("hex");
}

/** Service-role client used here for cache writes (anon can only read). */
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) throw new Error("Supabase service-role env vars missing.");
  return createServerClient(url, serviceRole, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

async function batchTranslate(strings: string[]): Promise<string[] | null> {
  if (strings.length === 0) return [];
  try {
    const { text } = await generateText({
      model: google(TRANSLATE_MODEL),
      system: BATCH_SYSTEM_PROMPT,
      prompt: JSON.stringify({ input: strings }),
      temperature: 0.2,
      maxRetries: 1,
    });
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as { translations?: unknown };
    if (
      !parsed ||
      !Array.isArray(parsed.translations) ||
      parsed.translations.length !== strings.length
    ) {
      return null;
    }
    const out: string[] = [];
    for (const v of parsed.translations) {
      if (typeof v !== "string") return null;
      out.push(v.trim());
    }
    return out;
  } catch (err) {
    console.warn("[i18n/translate] batch Gemini call failed", err);
    return null;
  }
}

/** Read a batch of cache rows. Returns map keyed by `key`. */
async function readCache(keys: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (keys.length === 0) return out;
  try {
    const supabase = adminClient();
    const { data, error } = await supabase
      .from("translations_cache")
      .select("key,he")
      .in("key", keys);
    if (error || !data) return out;
    for (const row of data as Array<{ key: string; he: string }>) out.set(row.key, row.he);
  } catch {
    // fail-open
  }
  return out;
}

/** Bulk upsert misses. Best-effort; failure to write does not break the render. */
async function writeCache(
  rows: Array<{ key: string; en: string; he: string; contentType: string }>
): Promise<void> {
  if (rows.length === 0) return;
  try {
    const supabase = adminClient();
    await supabase.from("translations_cache").upsert(
      rows.map((r) => ({
        key: r.key,
        source_table: "text",
        content_type: r.contentType,
        en: r.en,
        he: r.he,
      })),
      { onConflict: "key" }
    );
  } catch (err) {
    console.warn("[i18n/translate] cache write failed", err);
  }
}

/**
 * Single-string translate. Cache read; if miss, single batched call with
 * just that string. Prefer tMany for sections so the batch is larger.
 */
export async function t(
  en: string,
  locale: Locale = "en",
  contentType: string = "text"
): Promise<string> {
  if (!en || locale === "en" || !hasAIProvider()) return en;
  const key = makeKey(en, contentType);
  const cached = await readCache([key]);
  const hit = cached.get(key);
  if (hit) return hit;
  const translated = await batchTranslate([en]);
  if (!translated) return en;
  void writeCache([{ key, en, he: translated[0], contentType }]);
  return translated[0];
}

/**
 * Batch translator for a section. Single cache round-trip, then a SINGLE
 * Gemini call for all misses. Returns a Record<en, he> map.
 *
 * Designed for the localize() helper used by Server Components.
 */
export async function tMany(
  texts: Array<{ en: string; contentType?: string }>,
  locale: Locale = "en"
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  if (locale === "en" || texts.length === 0 || !hasAIProvider()) {
    for (const { en } of texts) out[en] = en;
    return out;
  }

  // Deduplicate by EN+contentType so the same string used twice in a section
  // only consumes one cache lookup + one Gemini slot.
  const seen = new Map<string, { en: string; contentType: string }>();
  for (const t of texts) {
    const ct = t.contentType ?? "text";
    const key = makeKey(t.en, ct);
    if (!seen.has(key)) seen.set(key, { en: t.en, contentType: ct });
  }
  const allKeys = [...seen.keys()];

  // 1) cache lookup for everything
  const cached = await readCache(allKeys);

  // 2) collect misses (skip cached items)
  const misses: Array<{ key: string; en: string; contentType: string }> = [];
  for (const [key, { en, contentType }] of seen) {
    if (!cached.has(key)) misses.push({ key, en, contentType });
  }

  // 3) if there are misses, ONE Gemini batched call translates them all
  if (misses.length > 0) {
    const translations = await batchTranslate(misses.map((m) => m.en));
    if (translations) {
      const writes: Array<{ key: string; en: string; he: string; contentType: string }> = [];
      for (let i = 0; i < misses.length; i++) {
        const he = translations[i] ?? misses[i].en;
        cached.set(misses[i].key, he);
        writes.push({ key: misses[i].key, en: misses[i].en, he, contentType: misses[i].contentType });
      }
      void writeCache(writes);
    }
  }

  // 4) build the EN -> HE response map. Falls back to EN for any string
  //    still not in the cache map (rare — only when batchTranslate failed).
  for (const t of texts) {
    const ct = t.contentType ?? "text";
    const key = makeKey(t.en, ct);
    out[t.en] = cached.get(key) ?? t.en;
  }
  return out;
}
