"use client";

import { useState, useTransition, type FormEvent } from "react";
import { GlassButton } from "@/shared/ui/GlassButton";
import { setPassword } from "./actions";

export function SetPasswordForm() {
  const [pending, start] = useTransition();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData();
    fd.set("password", pw);
    fd.set("confirm", confirm);
    start(async () => {
      const r = await setPassword(fd);
      if (r.ok) {
        setSaved(true);
        setPw("");
        setConfirm("");
      } else {
        setError(r.error ?? "Failed to update.");
      }
    });
  }

  const field =
    "w-full px-3 py-2 rounded-md bg-[color-mix(in_oklab,var(--color-text)_4%,transparent)] border border-line text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent";

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <label className="grid gap-1.5">
        <span className="text-caption uppercase tracking-wider text-muted">New password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          minLength={8}
          required
          disabled={pending}
          className={field}
        />
      </label>
      <label className="grid gap-1.5">
        <span className="text-caption uppercase tracking-wider text-muted">Confirm</span>
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={8}
          required
          disabled={pending}
          className={field}
        />
      </label>
      {error && (
        <p role="alert" className="text-body-sm text-[var(--color-accent)]">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="text-body-sm text-[#10b981]">
          Password updated ✓
        </p>
      )}
      <div className="flex justify-end">
        <GlassButton type="submit" variant="primary" size="sm" disabled={pending || !pw || !confirm}>
          {pending ? "Saving…" : "Update password"}
        </GlassButton>
      </div>
    </form>
  );
}
