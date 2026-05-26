/**
 * Structured entity extractor — POST /api/ai/playground/extract
 * Body: { text: string }
 * Out:  { entities: { people, orgs, dates, sentiment }, raw?, error? }
 *
 * One-shot Gemini call with strict JSON output. Validates + sanitizes.
 * Rate-limited 10/hour/IP. Max input 4KB.
 */
import { generateText } from "ai";
import { chatModel, hasAIProvider, PROVIDER_NOT_CONFIGURED_MESSAGE } from "@/shared/lib/ai/provider";
import { clientKey, rateLimit } from "@/shared/lib/ai/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `Extract entities from the text the user provides. Return STRICT JSON only.

Schema:
{
  "people":    ["<full name>", ...],
  "orgs":      ["<organization>", ...],
  "dates":     ["<date or date phrase as it appears>", ...],
  "sentiment": <number between -1.0 and 1.0>
}

Rules:
- Each list may be empty if nothing of that type is in the text.
- Deduplicate. Preserve original capitalization.
- sentiment: -1 = very negative, 0 = neutral, 1 = very positive. Be calibrated.
- Output ONLY the JSON. No preamble, no markdown fence, no commentary.`;

type Entities = {
  people: string[];
  orgs: string[];
  dates: string[];
  sentiment: number;
};

function parseEntities(raw: string): Entities | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    const obj = JSON.parse(cleaned);
    if (!obj || typeof obj !== "object") return null;
    const asArr = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, 25) : [];
    const sentiment =
      typeof obj.sentiment === "number" && Number.isFinite(obj.sentiment)
        ? Math.max(-1, Math.min(1, obj.sentiment))
        : 0;
    return {
      people: asArr(obj.people),
      orgs: asArr(obj.orgs),
      dates: asArr(obj.dates),
      sentiment,
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (!hasAIProvider()) {
    return Response.json({ error: PROVIDER_NOT_CONFIGURED_MESSAGE }, { status: 503 });
  }
  const rl = rateLimit({
    key: `ai:playground:extract:${clientKey(req.headers)}`,
    limit: 10,
    windowSec: 60 * 60,
  });
  if (!rl.ok) {
    return Response.json(
      { error: "Too many requests. Take a breather." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }
  let body: { text?: string } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const text = (body.text ?? "").trim();
  if (!text) return Response.json({ error: "text is required." }, { status: 400 });
  if (text.length > 4096)
    return Response.json({ error: "Text too long (max 4KB)." }, { status: 400 });

  try {
    const { text: raw } = await generateText({
      model: chatModel(),
      system: SYSTEM,
      prompt: text,
      temperature: 0.1,
      maxRetries: 1,
    });
    const entities = parseEntities(raw);
    if (!entities) {
      return Response.json(
        { error: "Couldn't parse the model output. Try a different input.", raw },
        { status: 502 }
      );
    }
    return Response.json({ entities });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
