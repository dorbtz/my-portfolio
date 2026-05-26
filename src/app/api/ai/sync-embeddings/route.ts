/**
 * Embeddings sync — POST /api/ai/sync-embeddings
 *
 * Bearer-auth via CRON_SECRET. Called from Vercel Cron (wired in M5/M9) and
 * from /admin/content (M7) after a project edit.
 *
 * Rebuilds the entire embeddings table from current projects + profile.
 * Idempotent (full wipe-and-rewrite). Tiny corpus, so this is fine.
 *
 * Returns { ok: true, chunks: <count> } on success.
 */
import { syncCorpus } from "@/shared/lib/ai/rag";
import { hasAIProvider } from "@/shared/lib/ai/provider";

export const runtime = "nodejs";
// Allow up to 5 min — embedding 30-50 chunks via Gemini is ~5s, but leave headroom.
export const maxDuration = 300;

export async function POST(req: Request) {
  if (!hasAIProvider()) {
    return Response.json(
      { error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured." },
      { status: 503 }
    );
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await syncCorpus();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
