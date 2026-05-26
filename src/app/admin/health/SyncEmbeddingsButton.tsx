"use client";

import { useState, useTransition } from "react";
import { GlassButton } from "@/shared/ui/GlassButton";

type Result = { ok: boolean; chunks?: number; error?: string };

export function SyncEmbeddingsButton({ action }: { action: () => Promise<Result> }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function go() {
    setMsg(null);
    setErr(null);
    start(async () => {
      const r = await action();
      if (r.ok) setMsg(`Synced ${r.chunks ?? 0} chunks.`);
      else setErr(r.error ?? "Sync failed.");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <GlassButton type="button" variant="primary" disabled={pending} onClick={go}>
        {pending ? "Syncing…" : "Re-sync embeddings now"}
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
