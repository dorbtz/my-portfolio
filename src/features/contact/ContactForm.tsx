"use client";

import { useState, useTransition, type FormEvent } from "react";
import { GlassButton } from "@/shared/ui/GlassButton";
import { useClientStrings } from "@/shared/lib/i18n/client-strings";
import { submitMessage } from "./actions";

/**
 * Contact form. Submits via a Server Action that:
 *   1. Validates server-side and inserts to Supabase `messages`
 *   2. Fires the per-theme media animation (Heimdall / Den-Den)
 *   3. Kicks off the AI classifier in the background (M6) — not awaited
 */
export function ContactForm() {
  const t = useClientStrings().contact;
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
      setError(t.fillAll);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t.badEmail);
      return;
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
        <p className="text-h3 font-semibold">{t.sentTitle}</p>
        <p className="text-body text-muted mt-2">{t.sentBody}</p>
      </div>
    );
  }

  const fieldBase =
    "w-full px-4 py-3 rounded-md bg-[color-mix(in_oklab,var(--color-text)_4%,transparent)] border border-line text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-shadow";

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <label className="grid gap-1.5">
        <span className="text-caption uppercase tracking-wider text-muted">{t.nameLabel}</span>
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
        <span className="text-caption uppercase tracking-wider text-muted">{t.emailLabel}</span>
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
        <span className="text-caption uppercase tracking-wider text-muted">{t.messageLabel}</span>
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
          {status === "submitting" ? t.sending : t.send}
        </GlassButton>
      </div>
    </form>
  );
}
