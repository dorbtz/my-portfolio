"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { GlassButton } from "@/shared/ui/GlassButton";
import { sendMagicLink, signInWithPassword } from "./actions";

/**
 * Two sign-in flows in one card:
 *  - Magic link (default, top form) — email-only OTP
 *  - Email/username + password (collapsible bottom form)
 *
 * After password sign-in we router.refresh() so the middleware re-evaluates
 * and the layout pulls in the new session.
 */
export function LoginForms() {
  const router = useRouter();
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [magicError, setMagicError] = useState<string | null>(null);
  const [magicPending, startMagic] = useTransition();

  const [showPw, setShowPw] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwPending, startPw] = useTransition();

  function onMagic(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (magicPending) return;
    setMagicError(null);
    const fd = new FormData();
    fd.set("email", magicEmail);
    startMagic(async () => {
      const r = await sendMagicLink(fd);
      if (r.ok) setMagicSent(true);
      else setMagicError(r.error);
    });
  }

  function onPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pwPending) return;
    setPwError(null);
    const fd = new FormData();
    fd.set("identifier", identifier);
    fd.set("password", password);
    startPw(async () => {
      const r = await signInWithPassword(fd);
      if (r.ok) {
        router.replace("/admin");
        router.refresh();
      } else {
        setPwError(r.error);
      }
    });
  }

  const field =
    "w-full px-4 py-3 rounded-md bg-[color-mix(in_oklab,var(--color-text)_4%,transparent)] border border-line text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent";

  return (
    <div className="grid gap-5">
      {magicSent ? (
        <div role="status" className="text-center py-3">
          <p className="text-h3 font-semibold">Check your inbox.</p>
          <p className="text-body-sm text-muted mt-2">
            We sent a sign-in link to <strong>{magicEmail}</strong>. Click it and you&apos;re in.
          </p>
        </div>
      ) : (
        <form onSubmit={onMagic} noValidate className="grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-caption uppercase tracking-wider text-muted">Email</span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              value={magicEmail}
              onChange={(e) => setMagicEmail(e.target.value)}
              required
              className={field}
              disabled={magicPending}
            />
          </label>
          {magicError && (
            <p role="alert" className="text-body-sm text-[var(--color-accent)]">
              {magicError}
            </p>
          )}
          <GlassButton type="submit" variant="primary" disabled={magicPending}>
            {magicPending ? "Sending…" : "Send magic link"}
          </GlassButton>
        </form>
      )}

      <button
        type="button"
        onClick={() => setShowPw((v) => !v)}
        className="text-body-sm text-muted hover:text-accent underline-offset-4 hover:underline transition-colors"
      >
        {showPw ? "Use magic link instead ↑" : "Already set a password? Sign in here ↓"}
      </button>

      {showPw && (
        <form onSubmit={onPassword} noValidate className="grid gap-3">
          <label className="grid gap-1.5">
            <span className="text-caption uppercase tracking-wider text-muted">
              Email or username
            </span>
            <input
              type="text"
              autoComplete="username"
              spellCheck={false}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className={field}
              disabled={pwPending}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-caption uppercase tracking-wider text-muted">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={field}
              disabled={pwPending}
            />
          </label>
          {pwError && (
            <p role="alert" className="text-body-sm text-[var(--color-accent)]">
              {pwError}
            </p>
          )}
          <GlassButton type="submit" variant="primary" disabled={pwPending}>
            {pwPending ? "Signing in…" : "Sign in"}
          </GlassButton>
        </form>
      )}
    </div>
  );
}
