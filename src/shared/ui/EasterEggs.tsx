"use client";

import { useEffect, useRef } from "react";
import { applyTheme } from "../lib/theme/client";

/**
 * Hidden theme-switch combos. Listen at document level for ordered key
 * sequences and flip the theme + dispatch a one-shot effect event.
 *
 *   M-J-O-L  (M, J, O, L)         -> Thor theme + bifrost flash event
 *   L-U-F-F-Y (L, U, F, F, Y)     -> Luffy theme + strawhat rain event
 *   K-O-N-A-M-I (K,O,N,A,M,I)     -> Konami nod, cycles theme
 *
 * Effect events are dispatched on window:
 *   "pf-easter-thor"  -> consumers can render a one-shot Bifrost flash
 *   "pf-easter-luffy" -> consumers can render a one-shot straw-hat rain
 *
 * Ignores keypresses inside input/textarea/contentEditable so it doesn't
 * fight the chatbot or forms.
 */

const COMBOS: Array<{ keys: string[]; theme: "thor" | "luffy" | null; event?: string }> = [
  { keys: ["m", "j", "o", "l"], theme: "thor", event: "pf-easter-thor" },
  { keys: ["l", "u", "f", "f", "y"], theme: "luffy", event: "pf-easter-luffy" },
  // Konami: ↑↑↓↓←→←→ba — just for fun; cycles theme
  {
    keys: [
      "arrowup",
      "arrowup",
      "arrowdown",
      "arrowdown",
      "arrowleft",
      "arrowright",
      "arrowleft",
      "arrowright",
      "b",
      "a",
    ],
    theme: null,
  },
];

const MAX_BUFFER = 12;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  return false;
}

function endsWith<T>(arr: T[], suffix: T[]): boolean {
  if (suffix.length > arr.length) return false;
  for (let i = 0; i < suffix.length; i++) {
    if (arr[arr.length - suffix.length + i] !== suffix[i]) return false;
  }
  return true;
}

export function EasterEggs() {
  const buf = useRef<string[]>([]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k.length === 0) return;
      buf.current = [...buf.current, k].slice(-MAX_BUFFER);
      for (const c of COMBOS) {
        if (endsWith(buf.current, c.keys)) {
          buf.current = [];
          if (c.theme) {
            applyTheme(c.theme);
            if (c.event) window.dispatchEvent(new CustomEvent(c.event));
          } else {
            // Konami: cycle hightech -> thor -> luffy -> hightech
            const current = document.documentElement.dataset.theme ?? "hightech";
            const next = current === "hightech" ? "thor" : current === "thor" ? "luffy" : "hightech";
            applyTheme(next as "hightech" | "thor" | "luffy");
            window.dispatchEvent(
              new CustomEvent(next === "thor" ? "pf-easter-thor" : next === "luffy" ? "pf-easter-luffy" : "pf-easter-hightech")
            );
          }
          break;
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
