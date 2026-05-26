"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { GlassCard } from "@/shared/ui/GlassCard";
import { GlassButton } from "@/shared/ui/GlassButton";
import { useClientStrings } from "@/shared/lib/i18n/client-strings";
import { MessageBubble } from "./MessageBubble";

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
  const t = useClientStrings().chatbot;

  // useChat() in AI SDK v6 defaults to POST /api/chat. Our route lives at
  // /api/ai/chat (namespaced under /api/ai/*) so we provide the URL explicitly.
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/ai/chat" }),
    []
  );
  const { messages, sendMessage, status, error } = useChat({ transport });

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
        aria-label={t.triggerAria}
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
        <span>{t.triggerLabel}</span>
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
            <p className="text-caption uppercase tracking-wider text-accent">{t.eyebrow}</p>
            <p className="text-body-sm font-semibold">{t.title}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t.closeAria}
            className="w-9 h-9 grid place-items-center rounded-pill text-fg hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <span aria-hidden>×</span>
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto rounded-lg p-3 border border-line bg-[color-mix(in_oklab,var(--color-text)_3%,transparent)] min-h-[200px]"
        >
          {messages.length === 0 ? (
            <p className="text-body-sm text-muted p-3">{t.emptyState}</p>
          ) : (
            <ul className="flex flex-col gap-3 p-1">
              {(messages as UIMessage[]).map((m) => {
                const text = m.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .filter(Boolean)
                  .join("");
                return (
                  <MessageBubble
                    key={m.id}
                    role={m.role === "user" ? "user" : "assistant"}
                    text={text}
                  />
                );
              })}
              {status === "submitted" && (
                <MessageBubble role="assistant" text="" thinking />
              )}
            </ul>
          )}
        </div>

        {error && (
          <p role="alert" className="text-caption text-[var(--color-accent)]">
            {error.message ?? t.fallbackError}
          </p>
        )}

        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.placeholder}
            className="flex-1 h-11 px-4 rounded-pill bg-[color-mix(in_oklab,var(--color-text)_4%,transparent)] border border-line text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
            aria-label={t.inputAria}
            disabled={status === "submitted" || status === "streaming"}
          />
          <GlassButton
            type="submit"
            variant="primary"
            size="sm"
            disabled={!input.trim() || status === "submitted" || status === "streaming"}
          >
            {t.send}
          </GlassButton>
        </form>
      </GlassCard>
    </div>
  );
}
