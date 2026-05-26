"use client";

import { useState, useTransition } from "react";
import { GlassButton } from "@/shared/ui/GlassButton";

type Result = { ok: boolean; deleted?: number; error?: string };

export function PurgeTranslationsButton({ action }: { action: () => Promise<Result> }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function go() {
    if (!confirm("Purge ALL cached Hebrew translations? Next HE page load will re-translate everything from scratch (takes a few seconds per section).")) return;
    setMsg(null);
    setErr(null);
    start(async () => {
      const r = await action();
      if (r.ok) setMsg(`Deleted ${r.deleted ?? 0} cached translations.`);
      else setErr(r.error ?? "Purge failed.");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <GlassButton type="button" variant="ghost" disabled={pending} onClick={go}>
        {pending ? "Purging…" : "Purge HE translation cache"}
      </GlassButton>
      {msg && (
        <p role="status" className="text-body-sm text-[#10b981]">
          {msg}
        </p>
      )}
      {err && (
        <p role="alert" className="text-body-sm text-[var(--color-accent)]">
          {err}
        </p>
      )}
    </div>
  );
}
