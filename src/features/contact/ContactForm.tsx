"use client";

import { useState, useTransition, type FormEvent } from "react";
import { GlassButton } from "@/shared/ui/GlassButton";
import { submitMessage } from "./actions";

/**
 * Contact form. Submits via a Server Action that:
 *   1. Validates server-side and inserts to Supabase `messages`
 *   2. Fires the per-theme media animation (Heimdall / Den-Den)
 *   3. Kicks off the AI classifier in the background (M6) — not awaited
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim() || !body.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("That email doesn't look right.");
      return;
    }
    // Trigger the per-theme media animation immediately for snappy feedback.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pf-contact-submit"));
    }
    startTransition(async () => {
      const result = await submitMessage({ name: name.trim(), email: email.trim(), message: body.trim() });
      if (result.ok) {
        setSent(true);
      } else {
        setError(result.error);
      }
    });
  }

  const status: "idle" | "submitting" | "sent" | "error" =
    sent ? "sent" : isPending ? "submitting" : error ? "error" : "idle";

  if (status === "sent") {
    return (
      <div role="status" aria-live="polite" className="text-center py-6">
        <p className="text-h3 font-semibold">Got it. ✨</p>
        <p className="text-body text-muted mt-2">
          Your message is in the inbox. I&apos;ll reply within a couple of days.
        </p>
      </div>
    );
  }

  const fieldBase =
    "w-full px-4 py-3 rounded-md bg-[color-mix(in_oklab,var(--color-text)_4%,transparent)] border border-line text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-shadow";

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <label className="grid gap-1.5">
        <span className="text-caption uppercase tracking-wider text-muted">Name</span>
        <input
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={fieldBase}
        />
      </label>
      <label className="grid gap-1.5">
        <span className="text-caption uppercase tracking-wider text-muted">Email</span>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={fieldBase}
        />
      </label>
      <label className="grid gap-1.5">
        <span className="text-caption uppercase tracking-wider text-muted">Message</span>
        <textarea
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          className={fieldBase + " resize-y min-h-[120px]"}
        />
      </label>
      {error && (
        <p role="alert" className="text-body-sm text-[var(--color-accent)]">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <GlassButton
          type="submit"
          variant="primary"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Sending…" : "Send"}
        </GlassButton>
      </div>
    </form>
  );
}
