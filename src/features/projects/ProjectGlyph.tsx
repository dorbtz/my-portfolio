"use client";

import { useEffect, useState } from "react";

/**
 * Reactive per-theme glyph for ProjectCard. Server Components don't re-render
 * on theme toggle (cookie changes are only read on the next navigation), so
 * the glyph SVG mask source has to be picked client-side via a MutationObserver
 * on `<html data-theme>`. Renders nothing for the HighTech default + nothing
 * when the parent card already has a cover image.
 */
type Props = {
  /** Pass `null` from the server when the card has a coverUrl. */
  hasCover: boolean;
};

const THEME_GLYPH: Record<"thor" | "luffy", string> = {
  thor: "/assets/Marvel/mjolnir.png",
  luffy: "/assets/One-Piece/nika-symbol.png",
};

export function ProjectGlyph({ hasCover }: Props) {
  const [theme, setTheme] = useState<"hightech" | "thor" | "luffy">("hightech");

  useEffect(() => {
    const el = document.documentElement;
    const read = () => {
      const v = el.dataset.theme;
      if (v === "thor" || v === "luffy" || v === "hightech") setTheme(v);
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  if (hasCover) return null;
  if (theme === "hightech") return null;
  const glyph = THEME_GLYPH[theme];

  return (
    <span
      aria-hidden
      className="absolute top-3 right-3 w-10 h-10 pointer-events-none opacity-25"
      style={{
        WebkitMaskImage: `url(${glyph})`,
        maskImage: `url(${glyph})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        backgroundColor: "currentColor",
      }}
    />
  );
}
