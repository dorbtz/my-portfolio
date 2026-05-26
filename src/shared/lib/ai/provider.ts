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

/** Chat + RAG + classifier + translator. Gemini 2.5 Flash is the current
 *  free-tier default; gemini-2.0-flash moved to paid-only for new accounts. */
export const chatModel = () => google("gemini-2.5-flash");

/**
 * Text embeddings via `gemini-embedding-001` (the v1beta replacement for the
 * deprecated `text-embedding-004`). Default output is 3072 dims; we force
 * 768 dims via providerOptions on every embed() call to match the
 * `vector(768)` column. See EMBED_PROVIDER_OPTIONS below.
 */
export const embedModel = () => google.textEmbeddingModel("gemini-embedding-001");

/**
 * Apply to every embed() / embedMany() call so the returned vector matches
 * the `vector(768)` column in public.embeddings.
 */
export const EMBED_PROVIDER_OPTIONS = {
  google: { outputDimensionality: 768 },
} as const;

/** True if the env is wired. Used to short-circuit calls with a friendly message. */
export function hasAIProvider(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}

/** Single sentence the chatbot returns when the provider isn't configured. */
export const PROVIDER_NOT_CONFIGURED_MESSAGE =
  "The AI chat isn't configured yet. Add `GOOGLE_GENERATIVE_AI_API_KEY` to your `.env` (free key from https://aistudio.google.com/apikey) and refresh.";
