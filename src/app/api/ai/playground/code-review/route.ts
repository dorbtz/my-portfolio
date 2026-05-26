/**
 * Streaming code reviewer — POST /api/ai/playground/code-review
 * Body: { code: string }
 * Out:  text/event-stream (AI SDK ui-stream)
 *
 * Returns a 3-section review: summary, bugs, suggestions. Streams live so
 * the user sees text appearing word-by-word.
 *
 * Rate-limited 10/hour/IP. Max input 2KB.
 */
import { streamText } from "ai";
import { chatModel, hasAIProvider, PROVIDER_NOT_CONFIGURED_MESSAGE } from "@/shared/lib/ai/provider";
import { clientKey, rateLimit } from "@/shared/lib/ai/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are an expert senior engineer reviewing a code snippet from a
visitor of Dor Ben Tzur's portfolio playground.

Structure your reply with exactly 3 short markdown sections, in this order:

## Summary
One paragraph (2-3 sentences) explaining what the code does and the overall
quality. Be precise about the language / framework if visible.

## Bugs
Bullet list of any bugs / correctness issues. If none, write "None found in this snippet."
For each: bug, why it's a bug, one-line fix suggestion.

## Suggestions
Bullet list of style / safety / perf improvements. Keep it concise — top 3 max.

Tone: friendly, concise, technical. Don't restate the code.`;

export async function POST(req: Request) {
  if (!hasAIProvider()) {
    return Response.json({ error: PROVIDER_NOT_CONFIGURED_MESSAGE }, { status: 503 });
  }
  const rl = rateLimit({
    key: `ai:playground:codereview:${clientKey(req.headers)}`,
    limit: 10,
    windowSec: 60 * 60,
  });
  if (!rl.ok) {
    return Response.json(
      { error: "Too many requests. Take a breather." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }
  let body: { code?: string } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const code = (body.code ?? "").trim();
  if (!code) return Response.json({ error: "code is required." }, { status: 400 });
  if (code.length > 2048)
    return Response.json({ error: "Snippet too long (max 2KB)." }, { status: 400 });

  const result = streamText({
    model: chatModel(),
    system: SYSTEM,
    prompt: `Review this code:\n\n\`\`\`\n${code}\n\`\`\``,
    temperature: 0.3,
    maxRetries: 1,
  });
  return result.toUIMessageStreamResponse();
}
