/**
 * AI provider — one place to swap the LLM stack.
 *
 * Currently routes to Google Gemini (free tier from Google AI Studio).
 * The AI SDK's provider interface is uniform, so swapping to Anthropic,
 * OpenAI, or the Vercel AI Gateway is a one-line change here — every
 * caller (chatbot, recommender, classifier, translator) keeps working.
 *
 * Setup:
 *   1. https://aistudio.google.com/apikey -> Create API key (free, no card)
 *   2. Add GOOGLE_GENERATIVE_AI_API_KEY=<key> to .env (or .env.local)
 *   3. Restart `npm run dev`
 *
 * Free-tier limits (Gemini 2.0 Flash, as of 2026):
 *   - 15 requests / minute
 *   - 1500 requests / day
 *   - 1M tokens / day
 * Plenty for a portfolio chatbot.
 */
import { google } from "@ai-sdk/google";

/** Chat + RAG + classifier + translator. Gemini 2.0 Flash is fast + cheap. */
export const chatModel = () => google("gemini-2.0-flash");

/**
 * 768-dim text embeddings. Matches the `vector(768)` column in the
 * embeddings table (changed from 1536d via migration 0016).
 */
export const embedModel = () => google.textEmbeddingModel("text-embedding-004");

/** True if the env is wired. Used to short-circuit calls with a friendly message. */
export function hasAIProvider(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

/** Single sentence the chatbot returns when the provider isn't configured. */
export const PROVIDER_NOT_CONFIGURED_MESSAGE =
  "The AI chat isn't configured yet. Add `GOOGLE_GENERATIVE_AI_API_KEY` to your `.env` (free key from https://aistudio.google.com/apikey) and refresh.";
