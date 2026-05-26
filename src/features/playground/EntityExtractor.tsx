"use client";

import { useState, type FormEvent } from "react";
import { GlassButton } from "@/shared/ui/GlassButton";

const PLACEHOLDER = `Paste a paragraph and I'll extract people, organizations, dates, and sentiment.

Example: "Andy Jassy announced at AWS re:Invent 2024 that Amazon would invest heavily in agentic AI, partnering with Anthropic to bring Claude into more enterprise workloads."`;

type Entities = {
  people: string[];
  orgs: string[];
  dates: string[];
  sentiment: number;
};

function sentimentLabel(s: number): { label: string; color: string } {
  if (s > 0.4) return { label: `${s.toFixed(2)} (positive)`, color: "#10b981" };
  if (s < -0.4) return { label: `${s.toFixed(2)} (negative)`, color: "#ef4444" };
  return { label: `${s.toFixed(2)} (neutral)`, color: "var(--color-text-muted)" };
}

export function EntityExtractor() {
  const [text, setText] = useState("");
  const [entities, setEntities] = useState<Entities | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/ai/playground/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = (await res.json()) as { entities?: Entities; error?: string };
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status}).`);
        setStatus("error");
        return;
      }
      setEntities(data.entities ?? null);
      setStatus("idle");
    } catch {
      setError("Network error — please try again.");
      setStatus("error");
    }
  }

  const s = entities ? sentimentLabel(entities.sentiment) : null;

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <label className="grid gap-1.5">
        <span className="text-caption uppercase tracking-wider text-muted">Your text</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          maxLength={4096}
          placeholder={PLACEHOLDER}
          className="w-full p-3 rounded-md bg-[color-mix(in_oklab,var(--color-text)_4%,transparent)] border border-line text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent resize-y"
        />
        <span className="text-caption text-muted">{text.length} / 4096 chars</span>
      </label>
      <div className="flex items-center justify-between gap-2">
        <p className="text-caption text-muted">Free tier — 10 extractions / hour.</p>
        <GlassButton
          type="submit"
          variant="primary"
          size="sm"
          disabled={!text.trim() || status === "loading"}
        >
          {status === "loading" ? "Extracting…" : "Extract"}
        </GlassButton>
      </div>
      {error && (
        <p role="alert" className="text-body-sm text-[var(--color-accent)]">
          {error}
        </p>
      )}
      {entities && (
        <div className="grid gap-3 mt-2">
          <EntityChips label="People" items={entities.people} />
          <EntityChips label="Organizations" items={entities.orgs} />
          <EntityChips label="Dates" items={entities.dates} />
          {s && (
            <div>
              <p className="text-caption uppercase tracking-wider text-muted">Sentiment</p>
              <p className="text-body font-medium mt-1" style={{ color: s.color }}>
                {s.label}
              </p>
            </div>
          )}
        </div>
      )}
    </form>
  );
}

function EntityChips({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-caption uppercase tracking-wider text-muted">{label}</p>
      {items.length === 0 ? (
        <p className="text-body-sm text-muted mt-1">—</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5 mt-2">
          {items.map((it) => (
            <li
              key={it}
              className="px-2.5 py-1 rounded-pill text-body-sm border border-line bg-[color-mix(in_oklab,var(--color-text)_4%,transparent)] text-fg"
            >
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
