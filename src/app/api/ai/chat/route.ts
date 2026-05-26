/**
 * Streaming chat endpoint — POST /api/ai/chat
 *
 * Body: { messages: [{ role, content }, ...] }
 * Out:  AI SDK UI-stream (text/event-stream)
 *
 * Pipeline:
 *   1. rate-limit by IP (20/hour)
 *   2. take last user message -> embed -> retrieve top-5 chunks
 *   3. build system prompt with retrieved context
 *   4. streamText against Gemini
 *
 * If GOOGLE_GENERATIVE_AI_API_KEY isn't set, returns a friendly 503 explaining
 * how to add it. UI degrades gracefully.
 */
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { chatModel, hasAIProvider, PROVIDER_NOT_CONFIGURED_MESSAGE } from "@/shared/lib/ai/provider";
import { retrieve } from "@/shared/lib/ai/rag";
import { CHAT_SYSTEM_PROMPT, formatContext } from "@/shared/lib/ai/system-prompt";
import { clientKey, rateLimit } from "@/shared/lib/ai/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!hasAIProvider()) {
    return Response.json({ error: PROVIDER_NOT_CONFIGURED_MESSAGE }, { status: 503 });
  }

  // 20 messages per hour per IP. Admins can bypass via M7 session check (TBD).
  const rl = rateLimit({
    key: `ai:chat:${clientKey(req.headers)}`,
    limit: 20,
    windowSec: 60 * 60,
  });
  if (!rl.ok) {
    return Response.json(
      { error: "Too many messages. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { messages?: UIMessage[] } = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const messages = body.messages ?? [];
  if (messages.length === 0) {
    return Response.json({ error: "messages[] is required." }, { status: 400 });
  }

  // Use the last user message as the retrieval query.
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const queryText = lastUserMsg
    ? lastUserMsg.parts
        .map((p) => (p.type === "text" ? p.text : ""))
        .filter(Boolean)
        .join(" ")
    : "";

  let context = "(retrieval not yet run)";
  if (queryText) {
    try {
      // 0.3 floor is calibrated for gemini-embedding-001 @ 768d (lower than
      // OpenAI text-embedding-3-small). Top-5 picks are enough for ~15 chunks.
      const chunks = await retrieve(queryText, { topK: 5, minScore: 0.3 });
      context = formatContext(chunks);
    } catch (err) {
      console.warn("[ai/chat] retrieval failed; falling back to empty context", err);
      context = "(retrieval temporarily unavailable — answer from general site knowledge only)";
    }
  }

  const system = `${CHAT_SYSTEM_PROMPT}\n\nContext (retrieved from the portfolio):\n${context}`;

  const modelMessages = await convertToModelMessages(messages);
  const result = streamText({
    model: chatModel(),
    system,
    messages: modelMessages,
    temperature: 0.4,
    maxRetries: 1,
  });

  return result.toUIMessageStreamResponse();
}
