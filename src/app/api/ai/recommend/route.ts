/**
 * Smart project recommender — POST /api/ai/recommend
 *
 * Body: { role: string }   (free-form description of the role / project)
 * Out:  { picks: [{ slug, why }] }
 *
 * Pipeline:
 *   1. rate-limit by IP (30/hour)
 *   2. fetch all non-draft projects from Supabase
 *   3. ask Gemini to rank top 3 with a one-sentence "why this matches"
 *   4. validate the model output against the project slug list (drop
 *      hallucinations); return at most 3 valid picks
 *
 * Falls open: returns the first 3 non-draft projects (priority order)
 * with a generic reason if Gemini fails. UI always renders something.
 */
import { generateText } from "ai";
import { chatModel, hasAIProvider } from "@/shared/lib/ai/provider";
import { clientKey, rateLimit } from "@/shared/lib/ai/rate-limit";
import { getAllProjects } from "@/shared/data/queries";

export const runtime = "nodejs";
export const maxDuration = 60;

type Pick = { slug: string; why: string };

const SYSTEM = `You rank Dor Ben Tzur's projects for a visitor who described what they're hiring for.

Input: a "Role" string + a JSON array of projects (slug, title, tagline, stack, tags, status).
Output: STRICT JSON of shape { "picks": [{ "slug": "<slug>", "why": "<one-sentence rationale>" }, ...] }

Rules:
- Return AT MOST 3 picks, ordered most-relevant first.
- "slug" MUST be one of the slugs in the provided list. Never invent.
- "why" is ONE concise sentence (max 25 words) tying specific overlap between
  the role and the project's stack / domain to the user's need.
- Prefer shipped + featured projects when the match quality is comparable.
- Skip projects that genuinely don't fit; don't pad to 3.
- Output ONLY the JSON — no preamble, no markdown fence, no commentary.`;

function parsePicksJson(raw: string, validSlugs: Set<string>): Pick[] {
  // Strip code fences if the model added them
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }
  if (!parsed || typeof parsed !== "object" || !("picks" in parsed)) return [];
  const picks = (parsed as { picks: unknown }).picks;
  if (!Array.isArray(picks)) return [];
  const out: Pick[] = [];
  for (const p of picks) {
    if (typeof p !== "object" || p === null) continue;
    const slug = (p as Record<string, unknown>).slug;
    const why = (p as Record<string, unknown>).why;
    if (typeof slug !== "string" || typeof why !== "string") continue;
    if (!validSlugs.has(slug)) continue;
    out.push({ slug, why });
    if (out.length === 3) break;
  }
  return out;
}

export async function POST(req: Request) {
  if (!hasAIProvider()) {
    return Response.json({ picks: [], error: "AI provider not configured." }, { status: 503 });
  }

  const rl = rateLimit({
    key: `ai:recommend:${clientKey(req.headers)}`,
    limit: 30,
    windowSec: 60 * 60,
  });
  if (!rl.ok) {
    return Response.json(
      { picks: [], error: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { role?: string } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ picks: [], error: "Invalid JSON body." }, { status: 400 });
  }
  const role = (body.role ?? "").trim();
  if (!role) {
    return Response.json({ picks: [], error: "role is required." }, { status: 400 });
  }
  if (role.length > 600) {
    return Response.json({ picks: [], error: "role too long (max 600 chars)." }, { status: 400 });
  }

  const all = await getAllProjects();
  const ranked = all.filter((p) => p.status !== "draft" && p.status !== "archived");
  if (ranked.length === 0) {
    return Response.json({ picks: [] });
  }
  const validSlugs = new Set(ranked.map((p) => p.slug));

  const projectSummaries = ranked.map((p) => ({
    slug: p.slug,
    title: p.title,
    tagline: p.tagline,
    stack: p.stack,
    tags: p.tags,
    status: p.status,
  }));

  const userPrompt =
    `Role: ${role}\n\nProjects:\n${JSON.stringify(projectSummaries, null, 2)}`;

  try {
    const { text } = await generateText({
      model: chatModel(),
      system: SYSTEM,
      prompt: userPrompt,
      temperature: 0.3,
      maxRetries: 1,
    });
    const picks = parsePicksJson(text, validSlugs);
    if (picks.length === 0) {
      // Model produced nothing usable — fall through to safe default below
      throw new Error("no valid picks");
    }
    return Response.json({ picks });
  } catch (err) {
    console.warn("[ai/recommend] Gemini failed, returning safe default", err);
    const fallback: Pick[] = ranked.slice(0, 3).map((p) => ({
      slug: p.slug,
      why: `${p.title} — ${p.tagline}`,
    }));
    return Response.json({ picks: fallback, degraded: true });
  }
}
