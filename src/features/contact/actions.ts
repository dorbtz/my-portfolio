"use server";

/**
 * Server Actions for the Contact form (M6).
 *
 *  submitMessage:
 *    1. Validates the form on the server (defense-in-depth — client also validates).
 *    2. Inserts the message into Supabase `messages` via the anon client.
 *       The existing `messages_anon_insert` RLS policy permits visitor inserts.
 *    3. Fire-and-forget: kicks off the AI classifier in the background.
 *       Failure to classify does NOT block the user's send.
 *
 *  classifyMessage:
 *    Internal background worker. Calls Gemini, writes classification +
 *    suggested_reply to the row via the service-role client.
 */
import { generateText } from "ai";
import { chatModel, hasAIProvider } from "@/shared/lib/ai/provider";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";

const CLASSIFY_SYSTEM = `You classify a message sent through a personal portfolio's contact form.

Return STRICT JSON of shape { "classification": "<one-of>", "suggested_reply": "<short tone for the owner>" }.

classification MUST be exactly one of:
  - "recruiter"      : someone hiring or sourcing for a role
  - "collaboration"  : someone proposing a project / partnership / co-build
  - "spam"           : irrelevant, automated, or scam-looking
  - "question"       : a genuine question (technical, advice, etc.)
  - "other"          : anything that doesn't cleanly fit the above

suggested_reply is ONE short sentence (max 20 words) describing what tone or
opener the owner should use when replying (NOT the reply itself). Examples:
  - "Warm + concrete: confirm interest + ask about role specifics."
  - "Polite decline; this is mass-sent recruiter spam."
  - "Detailed technical answer with code reference."

Output ONLY the JSON — no preamble, no fences.`;

const Classification = ["recruiter", "collaboration", "spam", "question", "other"] as const;
type Classification = (typeof Classification)[number];

export type SubmitResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) throw new Error("Supabase service role env missing.");
  return createServerClient(url, serviceRole, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

export async function submitMessage(input: {
  name: string;
  email: string;
  message: string;
}): Promise<SubmitResult> {
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim().toLowerCase();
  const message = (input.message ?? "").trim();

  if (name.length < 1) return { ok: false, error: "Please share your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, error: "That email doesn't look right." };
  if (message.length < 10)
    return { ok: false, error: "Please write a few sentences (≥10 chars)." };
  if (message.length > 4000)
    return { ok: false, error: "Message is too long (max 4000 chars)." };

  // Persist via the per-request (anon) client. RLS allows anon INSERT.
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ name, email, message })
    .select("id")
    .single();
  if (error || !data) {
    console.warn("[contact/submit] insert failed", error?.message);
    return { ok: false, error: "Couldn't save your message. Please email Dor directly." };
  }
  const id = data.id as string;

  // Fire-and-forget classification — never blocks the user's send. Errors are logged.
  if (hasAIProvider()) {
    void classifyMessage({ id, name, email, message }).catch((err) => {
      console.warn("[contact/classify] failed for", id, err);
    });
  }

  return { ok: true, id };
}

async function classifyMessage(row: {
  id: string;
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const prompt = `From: ${row.name} <${row.email}>\n\nMessage:\n${row.message}`;
  let raw = "";
  try {
    const { text } = await generateText({
      model: chatModel(),
      system: CLASSIFY_SYSTEM,
      prompt,
      temperature: 0.2,
      maxRetries: 1,
    });
    raw = text;
  } catch {
    return;
  }

  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  let parsed: { classification?: unknown; suggested_reply?: unknown } = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return;
  }
  const c = parsed.classification;
  const s = parsed.suggested_reply;
  if (typeof c !== "string" || !(Classification as readonly string[]).includes(c)) return;
  if (typeof s !== "string") return;

  const admin = adminClient();
  const { error } = await admin
    .from("messages")
    .update({
      classification: c,
      suggested_reply: s.slice(0, 280), // belt + braces vs over-long output
      classified_at: new Date().toISOString(),
    })
    .eq("id", row.id);
  if (error) console.warn("[contact/classify] update failed", error.message);
}
