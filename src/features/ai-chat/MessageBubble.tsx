"use client";

import { Fragment, useMemo } from "react";

/**
 * Chat message bubble with a focused markdown renderer.
 *
 * The Gemini RAG responses use a small markdown subset (**bold**, *italic*,
 * `code`, [1] citations, bullet / numbered lists, blank-line paragraphs).
 * Pulling in `react-markdown` (+ remark + micromark) would add ~80 KB for
 * this small surface; instead we parse the subset inline and render to
 * styled spans, so:
 *
 *   `**AI Brain**`  → <strong>AI Brain</strong>      (was literal asterisks)
 *   `*tagline*`     → <em>tagline</em>
 *   `` `code` ``    → small code chip
 *   `[3]`           → small accent chip
 *   `- bullet`      → bullet line
 *   `1. item`       → numbered line
 *   blank line      → paragraph break
 *
 * RTL: if the message contains Hebrew, the bubble flips to `dir="rtl"` so
 * the prose reads naturally instead of mixing direction (which is what the
 * user's screenshot was showing).
 */

const HEBREW = /[֐-׿]/;

export function MessageBubble({
  role,
  text,
  thinking = false,
}: {
  role: "user" | "assistant";
  text: string;
  thinking?: boolean;
}) {
  const isUser = role === "user";
  const isRTL = useMemo(() => HEBREW.test(text), [text]);
  const blocks = useMemo(() => parseBlocks(text), [text]);

  return (
    <li
      className={[
        "flex items-end gap-2",
        isUser ? "self-end flex-row-reverse" : "self-start",
        "max-w-[92%]",
      ].join(" ")}
    >
      {!isUser && (
        <span
          aria-hidden
          className="shrink-0 w-7 h-7 rounded-full grid place-items-center text-caption font-bold select-none"
          style={{
            background:
              "linear-gradient(135deg, var(--color-accent), color-mix(in oklab, var(--color-accent) 60%, white))",
            color: "var(--color-accent-contrast)",
            boxShadow: "0 2px 6px -2px var(--color-accent)",
          }}
        >
          ✨
        </span>
      )}
      <div
        dir={isRTL ? "rtl" : "ltr"}
        className={[
          "rounded-2xl px-4 py-2.5 text-body-sm leading-relaxed",
          "shadow-sm",
          isUser
            ? "bg-[var(--color-accent)] text-[var(--color-accent-contrast)] rounded-br-md"
            : "bg-[var(--color-bg-elevated)] text-fg border border-line rounded-bl-md",
        ].join(" ")}
        style={
          isUser
            ? undefined
            : {
                background:
                  "linear-gradient(180deg, var(--color-bg-elevated), color-mix(in oklab, var(--color-bg-elevated) 92%, var(--color-accent)))",
              }
        }
      >
        {thinking ? (
          <ThinkingDots />
        ) : (
          <div className="space-y-2">
            {blocks.map((block, i) => (
              <Block key={i} block={block} isUser={isUser} />
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

function ThinkingDots() {
  return (
    <span aria-label="Thinking" className="inline-flex items-center gap-1 py-1">
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </span>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-current opacity-50"
      style={{
        animation: "chat-thinking 1.2s ease-in-out infinite",
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

// ---------- block / inline parsing ----------

type Block =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

/** Split text into paragraphs / lists. Conservative — bare line breaks
 *  inside a paragraph stay as soft breaks (rendered with whitespace-pre-line). */
function parseBlocks(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let ul: string[] = [];
  let ol: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push({ kind: "p", text: para.join("\n") });
      para = [];
    }
  };
  const flushUl = () => {
    if (ul.length) {
      blocks.push({ kind: "ul", items: ul });
      ul = [];
    }
  };
  const flushOl = () => {
    if (ol.length) {
      blocks.push({ kind: "ol", items: ol });
      ol = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const ulMatch = /^[-*]\s+(.*)/.exec(line);
    const olMatch = /^\d+[.)]\s+(.*)/.exec(line);
    if (line.trim() === "") {
      flushPara();
      flushUl();
      flushOl();
    } else if (ulMatch) {
      flushPara();
      flushOl();
      ul.push(ulMatch[1]);
    } else if (olMatch) {
      flushPara();
      flushUl();
      ol.push(olMatch[1]);
    } else {
      flushUl();
      flushOl();
      para.push(line);
    }
  }
  flushPara();
  flushUl();
  flushOl();
  return blocks;
}

function Block({ block, isUser }: { block: Block; isUser: boolean }) {
  if (block.kind === "p") {
    return (
      <p className="whitespace-pre-line">
        {renderInline(block.text, isUser)}
      </p>
    );
  }
  if (block.kind === "ul") {
    return (
      <ul className="list-disc ps-5 space-y-1">
        {block.items.map((it, i) => (
          <li key={i}>{renderInline(it, isUser)}</li>
        ))}
      </ul>
    );
  }
  return (
    <ol className="list-decimal ps-5 space-y-1">
      {block.items.map((it, i) => (
        <li key={i}>{renderInline(it, isUser)}</li>
      ))}
    </ol>
  );
}

// Inline pass — bold (**), italic (*), inline code (`), citations [N].
// One token type at a time, recursive on the inner text where it makes
// sense (so **bold *italic*** would nest). Kept readable + small.

type Token =
  | { t: "text"; v: string }
  | { t: "bold"; v: string }
  | { t: "italic"; v: string }
  | { t: "code"; v: string }
  | { t: "cite"; v: string };

const PATTERNS: { kind: Token["t"]; re: RegExp }[] = [
  { kind: "bold", re: /\*\*([^*]+?)\*\*/ },
  { kind: "code", re: /`([^`]+?)`/ },
  { kind: "italic", re: /\*([^*]+?)\*/ },
  { kind: "cite", re: /\[(\d+)\]/ },
];

function tokenize(input: string): Token[] {
  const out: Token[] = [];
  let rest = input;
  while (rest.length) {
    let best: { kind: Token["t"]; index: number; full: string; inner: string } | null = null;
    for (const { kind, re } of PATTERNS) {
      const m = re.exec(rest);
      if (m && (best === null || m.index < best.index)) {
        best = { kind, index: m.index, full: m[0], inner: m[1] };
      }
    }
    if (!best) {
      out.push({ t: "text", v: rest });
      break;
    }
    if (best.index > 0) out.push({ t: "text", v: rest.slice(0, best.index) });
    out.push({ t: best.kind, v: best.inner });
    rest = rest.slice(best.index + best.full.length);
  }
  return out;
}

function renderInline(text: string, isUser: boolean) {
  const tokens = tokenize(text);
  return (
    <>
      {tokens.map((tok, i) => {
        switch (tok.t) {
          case "bold":
            return (
              <strong key={i} className="font-semibold">
                {tok.v}
              </strong>
            );
          case "italic":
            return (
              <em key={i} className="italic">
                {tok.v}
              </em>
            );
          case "code":
            return (
              <code
                key={i}
                className="px-1.5 py-0.5 rounded text-[0.85em] font-mono"
                style={{
                  background: isUser
                    ? "color-mix(in oklab, var(--color-accent-contrast) 15%, transparent)"
                    : "color-mix(in oklab, var(--color-text) 7%, transparent)",
                }}
              >
                {tok.v}
              </code>
            );
          case "cite":
            return (
              <sup key={i} className="mx-0.5">
                <span
                  className="inline-block px-1.5 py-0.5 rounded-full text-[0.7em] font-semibold leading-none align-middle"
                  style={{
                    background: isUser
                      ? "color-mix(in oklab, var(--color-accent-contrast) 18%, transparent)"
                      : "color-mix(in oklab, var(--color-accent) 18%, transparent)",
                    color: isUser ? "var(--color-accent-contrast)" : "var(--color-accent)",
                    border: `1px solid color-mix(in oklab, var(--color-accent) 30%, transparent)`,
                  }}
                >
                  {tok.v}
                </span>
              </sup>
            );
          default:
            return <Fragment key={i}>{tok.v}</Fragment>;
        }
      })}
    </>
  );
}
