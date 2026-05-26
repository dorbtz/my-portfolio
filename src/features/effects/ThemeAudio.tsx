"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { isMuted, onMuteChange, startLoop, stopLoop } from "@/shared/lib/audio";

/**
 * Ambient per-theme audio loop. Lives at the root next to ThemeAmbience.
 *   Luffy  -> Drums of Liberation loop
 *   Thor   -> no ambient loop (thunder bursts fire in StormFX on each flash)
 *   HighTech -> silent
 *
 * Self-gates on data-theme + the audio module's mute flag + the first
 * user gesture (audio module is silent until then).
 */
export function ThemeAudio() {
  const [theme, setTheme] = useState<"hightech" | "thor" | "luffy">("hightech");
  const muted = useSyncExternalStore(
    (cb) => onMuteChange(() => cb()),
    isMuted,
    () => true
  );

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

  useEffect(() => {
    if (theme !== "luffy") {
      stopLoop("drums");
      return;
    }
    if (muted) {
      stopLoop("drums");
      return;
    }
    // Try to start; if the user hasn't gestured yet the audio module
    // silently no-ops. We re-attempt on the next user pointer event below.
    startLoop("drums");
    const retry = () => startLoop("drums");
    window.addEventListener("pointerdown", retry, { once: true });
    window.addEventListener("keydown", retry, { once: true });
    return () => {
      window.removeEventListener("pointerdown", retry);
      window.removeEventListener("keydown", retry);
      stopLoop("drums");
    };
  }, [theme, muted]);

  return null;
}
