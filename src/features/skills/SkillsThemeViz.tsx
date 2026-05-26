"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Theme } from "@/shared/lib/theme/types";

/**
 * Theme-conditional Skills visualization. Reads the active theme from
 * <html data-theme> and lazy-loads only the bundle for the active theme:
 *
 *   - thor    -> SkillsYggdrasil (Marvel — 9 realm stars on YGGDRASIL.png)
 *   - luffy   -> SkillsGrandLine (One Piece — 9 island thumbnails along the line)
 *   - hightech -> nothing (the existing chip grid is the high-tech UX)
 *
 * Watches data-theme via MutationObserver so switching themes hot-swaps
 * the viz without a reload.
 */

const SkillsYggdrasil = dynamic(
  () => import("./SkillsYggdrasil").then((m) => m.SkillsYggdrasil),
  { ssr: false, loading: () => <Placeholder /> }
);
const SkillsGrandLine = dynamic(
  () => import("./SkillsGrandLine").then((m) => m.SkillsGrandLine),
  { ssr: false, loading: () => <Placeholder /> }
);

function Placeholder() {
  return (
    <div
      aria-hidden
      className="w-full rounded-lg bg-[color-mix(in_oklab,var(--color-text)_4%,transparent)]"
      style={{ aspectRatio: "16 / 9" }}
    />
  );
}

function useActiveTheme(): Theme {
  const [theme, setTheme] = useState<Theme>("hightech");
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
  return theme;
}

export function SkillsThemeViz() {
  const theme = useActiveTheme();
  if (theme === "thor") return <SkillsYggdrasil />;
  if (theme === "luffy") return <SkillsGrandLine />;
  return null;
}
