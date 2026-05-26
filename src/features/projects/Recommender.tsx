"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { GlassCard } from "@/shared/ui/GlassCard";
import { GlassButton } from "@/shared/ui/GlassButton";
import { useClientStrings } from "@/shared/lib/i18n/client-strings";

/**
 * Smart project recommender. Lives at the top of /projects.
 *
 * Visitor describes the role they're hiring for; Gemini picks the top
 * 3 most-relevant projects with a one-sentence rationale each. Falls
 * back to the first 3 non-draft projects if the AI call fails.
 */

type Pick = { slug: string; why: string };

export function Recommender() {
  const t = useClientStrings().recommender;
  const [role, setRole] = useState("");
  const [picks, setPicks] = useState<Pick[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = role.trim();
    if (!trimmed) return;
    setStatus("loading");
    setError(null);
    setDegraded(false);
    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: trimmed }),
      });
      const data = (await res.json()) as { picks?: Pick[]; error?: string; degraded?: boolean };
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status}).`);
        setStatus("error");
        return;
      }
      setPicks(data.picks ?? []);
      setDegraded(Boolean(data.degraded));
      setStatus("idle");
    } catch {
      setError(t.networkError);
      setStatus("error");
    }
  }

  return (
    <GlassCard padding={6} className="mb-8">
      <p className="text-caption uppercase tracking-wider text-accent">{t.eyebrow}</p>
      <h2 className="text-h2 font-semibold mt-1">{t.title}</h2>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder={t.placeholder}
          maxLength={600}
          className="flex-1 h-11 px-4 rounded-pill bg-[color-mix(in_oklab,var(--color-text)_4%,transparent)] border border-line text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
          aria-label={t.inputAria}
          disabled={status === "loading"}
        />
        <GlassButton
          type="submit"
          variant="primary"
          disabled={!role.trim() || status === "loading"}
        >
          {status === "loading" ? t.picking : t.recommend}
        </GlassButton>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-body-sm text-[var(--color-accent)]">
          {error}
        </p>
      )}

      {picks && picks.length > 0 && (
        <div className="mt-6">
          <p className="text-caption uppercase tracking-wider text-muted">
            {degraded ? t.topPicksDegraded : t.topPicks}
          </p>
          <ul className="grid gap-3 mt-3">
            {picks.map((p, i) => (
              <li key={p.slug}>
                <Link
                  href={`/projects/${p.slug}`}
                  className="block p-4 rounded-md border border-line hover:border-[var(--color-accent)] transition-colors group"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="text-accent font-semibold">#{i + 1}</span>
                    <span className="text-body font-semibold group-hover:text-accent transition-colors">
                      /{p.slug}
                    </span>
                  </div>
                  <p className="text-body-sm text-muted mt-1">{p.why}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {picks && picks.length === 0 && (
        <p className="mt-4 text-body-sm text-muted">{t.none}</p>
      )}
    </GlassCard>
  );
}
