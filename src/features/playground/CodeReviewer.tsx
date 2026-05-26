"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useMemo, useState, type FormEvent } from "react";
import { GlassButton } from "@/shared/ui/GlassButton";

const PLACEHOLDER = `// paste a code snippet (any language, up to 2KB)
function pluralize(n, word) {
  return word + (n !== 1 ? "s" : "");
}
`;

export function CodeReviewer() {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/ai/playground/code-review" }),
    []
  );
  const { messages, sendMessage, status, error } = useChat({ transport });
  const [code, setCode] = useState(PLACEHOLDER);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || status === "submitted" || status === "streaming") return;
    sendMessage(
      { text: trimmed },
      { body: { code: trimmed } }
    );
  }

  const lastAssistant = [...(messages as UIMessage[])].reverse().find((m) => m.role === "assistant");
  const replyText = lastAssistant
    ? lastAssistant.parts
        .map((p) => (p.type === "text" ? p.text : ""))
        .filter(Boolean)
        .join("")
    : "";

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <label className="grid gap-1.5">
        <span className="text-caption uppercase tracking-wider text-muted">
          Your snippet
        </span>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={8}
          spellCheck={false}
          maxLength={2048}
          className="w-full font-mono text-body-sm leading-relaxed p-3 rounded-md bg-[color-mix(in_oklab,var(--color-text)_6%,transparent)] border border-line text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent resize-y"
        />
        <span className="text-caption text-muted">{code.length} / 2048 chars</span>
      </label>
      <div className="flex items-center justify-between gap-2">
        <p className="text-caption text-muted">Free tier — 10 reviews / hour.</p>
        <GlassButton
          type="submit"
          variant="primary"
          size="sm"
          disabled={!code.trim() || status === "submitted" || status === "streaming"}
        >
          {status === "submitted" || status === "streaming" ? "Reviewing…" : "Review"}
        </GlassButton>
      </div>
      {error && (
        <p role="alert" className="text-body-sm text-[var(--color-accent)]">
          {error.message ?? "Something went wrong."}
        </p>
      )}
      {(replyText || status === "submitted") && (
        <div className="rounded-md border border-line p-4 bg-[color-mix(in_oklab,var(--color-text)_3%,transparent)] mt-1">
          {replyText ? (
            <pre className="whitespace-pre-wrap text-body-sm text-fg font-sans leading-relaxed">
              {replyText}
            </pre>
          ) : (
            <p className="text-caption text-muted">Thinking…</p>
          )}
        </div>
      )}
    </form>
  );
}
