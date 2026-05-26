"use client";

import { useEffect, useState } from "react";

/**
 * Lightweight one-shot visual effects fired by the EasterEggs combo
 * listener. Plays for ~1.4s then unmounts.
 *
 *   pf-easter-thor  -> radial Bifrost flash sweep (gold + blue)
 *   pf-easter-luffy -> straw-hat / wanted-stamp rain
 *
 * Honors prefers-reduced-motion: skips the animation, just dispatches
 * a brief opacity blink.
 */

type Effect = "thor" | "luffy" | null;

export function EasterEggEffects() {
  const [effect, setEffect] = useState<Effect>(null);

  useEffect(() => {
    function onThor() {
      setEffect("thor");
      window.setTimeout(() => setEffect(null), 1400);
    }
    function onLuffy() {
      setEffect("luffy");
      window.setTimeout(() => setEffect(null), 1400);
    }
    window.addEventListener("pf-easter-thor", onThor);
    window.addEventListener("pf-easter-luffy", onLuffy);
    return () => {
      window.removeEventListener("pf-easter-thor", onThor);
      window.removeEventListener("pf-easter-luffy", onLuffy);
    };
  }, []);

  if (!effect) return null;

  if (effect === "thor") {
    return (
      <div aria-hidden className="fixed inset-0 z-[60] pointer-events-none easter-thor-flash" />
    );
  }
  // Luffy: small grid of straw-hat-flag icons falling
  return (
    <div aria-hidden className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="easter-luffy-drop absolute top-[-2rem] text-2xl"
          style={{
            left: `${(i / 11) * 100}%`,
            animationDelay: `${i * 0.05}s`,
          }}
        >
          🏴
        </span>
      ))}
    </div>
  );
}
