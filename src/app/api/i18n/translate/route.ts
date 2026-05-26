/**
 * Batch translate endpoint — POST /api/i18n/translate
 *
 * Body: { locale: "he", texts: [{ en, contentType? }, ...] }
 * Out:  { translations: { "<en>": "<he>" } }
 *
 * Called from the client when the user flips to HE so the page can be
 * re-rendered with cached translations. Also used by /api/i18n/sync to
 * pre-warm the cache.
 *
 * Rate-limited by IP (30 batches / hour). Falls open: returns EN on Gemini
 * failure so the page stays rendered.
 */
import { tMany } from "@/shared/lib/ai/translate";
import { clientKey, rateLimit } from "@/shared/lib/ai/rate-limit";
import { hasAIProvider } from "@/shared/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

type TranslateInput = { en: string; contentType?: string };

export async function POST(req: Request) {
  if (!hasAIProvider()) {
    return Response.json(
      { error: "AI provider not configured — set GOOGLE_GENERATIVE_AI_API_KEY." },
      { status: 503 }
    );
  }

  const rl = rateLimit({
    key: `i18n:translate:${clientKey(req.headers)}`,
    limit: 30,
    windowSec: 60 * 60,
  });
  if (!rl.ok) {
    return Response.json(
      { error: "Too many translation requests." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { locale?: string; texts?: TranslateInput[] } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (body.locale !== "he") {
    return Response.json({ error: "Only locale=he is supported." }, { status: 400 });
  }

  const texts = Array.isArray(body.texts) ? body.texts : [];
  if (texts.length === 0) {
    return Response.json({ translations: {} });
  }
  if (texts.length > 50) {
    return Response.json(
      { error: "Batch too large (max 50 strings per request)." },
      { status: 400 }
    );
  }

  try {
    const translations = await tMany(texts, "he");
    return Response.json({ translations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
