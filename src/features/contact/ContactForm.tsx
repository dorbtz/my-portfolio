"use client";

import { useState, type FormEvent } from "react";
import { GlassButton } from "@/shared/ui/GlassButton";

/**
 * Visual + client-side validation for the contact form. The Server Action
 * that writes to Supabase `messages` + the AI classifier wire up in M6.
 * For now, submitting shows a friendly "received" state without a backend.
 */
export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

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
    setStatus("submitting");
    // Tell ThemeContactMedia to play the Heimdall / Den-Den-Mushi overlay
    // animation. The wrapper listens for this custom event.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pf-contact-submit"));
    }
    // Stub: M6 replaces this with a Server Action that persists to Supabase
    // messages + runs the AI classifier in the background.
    setTimeout(() => setStatus("sent"), 600);
  }

  if (status === "sent") {
    return (
      <div role="status" aria-live="polite" className="text-center py-6">
        <p className="text-h3 font-semibold">Got it. ✨</p>
        <p className="text-body text-muted mt-2">
          (Inbox persistence + AI classification ship in M6 — for now this is
          a UI-only preview. Email me directly if it&apos;s urgent.)
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
