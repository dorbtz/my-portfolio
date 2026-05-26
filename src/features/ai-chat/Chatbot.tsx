"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { GlassCard } from "@/shared/ui/GlassCard";
import { GlassButton } from "@/shared/ui/GlassButton";

/**
 * Floating Chatbot widget. Bottom-right glass surface (mirrors the
 * top-right theme/lang cluster). Collapsed by default; expands into a
 * fixed-height conversation panel.
 *
 * Streams via @ai-sdk/react's useChat against /api/ai/chat. Renders the
 * conversation with citation markers ([1], [2]) styled as accent chips.
 */
export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({});

  // Auto-scroll to latest message when content streams in.
  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || status === "submitted" || status === "streaming") return;
    setInput("");
    sendMessage({ text });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open AI chat"
        className={[
          "fixed z-50 right-[max(env(safe-area-inset-right),0.75rem)]",
          "bottom-[max(env(safe-area-inset-bottom),0.75rem)]",
          "glass rounded-pill px-4 h-12 min-w-[44px]",
          "inline-flex items-center gap-2 text-body-sm font-medium text-fg",
          "transition-transform duration-snap ease-snap hover:-translate-y-0.5 active:scale-[0.97]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        ].join(" ")}
      >
        <span aria-hidden>✨</span>
        <span>Ask my portfolio</span>
      </button>
    );
  }

  return (
    <div
      // dir="ltr" pins the panel's internal layout regardless of page direction.
      dir="ltr"
      className={[
        "fixed z-50 right-[max(env(safe-area-inset-right),0.75rem)]",
        "bottom-[max(env(safe-area-inset-bottom),0.75rem)]",
        "w-[min(380px,calc(100vw-1.5rem))] max-h-[min(640px,calc(100dvh-2rem))]",
        "flex flex-col",
      ].join(" ")}
      role="dialog"
      aria-label="AI chat"
    >
      <GlassCard padding={4} className="flex flex-col gap-3 h-full overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-caption uppercase tracking-wider text-accent">AI co-pilot</p>
            <p className="text-body-sm font-semibold">Ask my portfolio</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="w-9 h-9 grid place-items-center rounded-pill text-fg hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <span aria-hidden>×</span>
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto rounded-md p-2 border border-line bg-[color-mix(in_oklab,var(--color-text)_3%,transparent)] min-h-[180px]"
        >
          {messages.length === 0 ? (
            <p className="text-body-sm text-muted p-3">
              Hi — ask about Dor&apos;s work, stack, or any project. I can also
              recommend projects that match a role you&apos;re hiring for.
            </p>
          ) : (
            <ul className="flex flex-col gap-2 p-1">
              {(messages as UIMessage[]).map((m) => {
                // Concatenate the text parts; ignore tool/data/source parts in M5
                // (we add tool-calling later if needed).
                const text = m.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .filter(Boolean)
                  .join("");
                return (
                  <li
                    key={m.id}
                    className={[
                      "rounded-md px-3 py-2 text-body-sm whitespace-pre-wrap",
                      m.role === "user"
                        ? "self-end bg-[var(--color-accent)] text-[var(--color-accent-contrast)] max-w-[85%]"
                        : "self-start bg-[var(--color-bg-elevated)] text-fg max-w-[95%] border border-line",
                    ].join(" ")}
                  >
                    {text}
                  </li>
                );
              })}
              {status === "submitted" && (
                <li className="self-start text-caption text-muted px-3 py-2">Thinking…</li>
              )}
            </ul>
          )}
        </div>

        {error && (
          <p role="alert" className="text-caption text-[var(--color-accent)]">
            {error.message ?? "Something went wrong."}
          </p>
        )}

        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about Dor's work…"
            className="flex-1 h-11 px-4 rounded-pill bg-[color-mix(in_oklab,var(--color-text)_4%,transparent)] border border-line text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
            aria-label="Your message"
            disabled={status === "submitted" || status === "streaming"}
          />
          <GlassButton
            type="submit"
            variant="primary"
            size="sm"
            disabled={!input.trim() || status === "submitted" || status === "streaming"}
          >
            Send
          </GlassButton>
        </form>
      </GlassCard>
    </div>
  );
}
