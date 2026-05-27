"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { isMuted, onMuteChange, setMuted } from "../lib/audio";

/**
 * Ambient music toggle — single pill that mutes the per-theme background
 * loop (Luffy drums of liberation / Thor thunder). Hidden on
 * `data-theme="hightech"` because the default theme has no audio. Default
 * is muted (autoplay-safe); first click opts in.
 */
export function SoundToggle() {
  const musicMuted = useSyncExternalStore(
    (cb) => onMuteChange(() => cb()),
    isMuted,
    () => true
  );
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

  if (theme === "hightech") return null;

  const label = theme === "thor" ? "Thunder" : "Drums";

  return (
    <div className="flex items-center gap-1.5">
      <Pill on={!musicMuted} labelOn={`${label} on`} labelOff={`${label} off`} />
    </div>
  );
}

function Pill({ on, labelOn, labelOff }: { on: boolean; labelOn: string; labelOff: string }) {
  const muted = !on;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={muted ? labelOff : labelOn}
      title={muted ? labelOff : labelOn}
      onClick={() => setMuted(muted ? false : true)}
      className={[
        "glass rounded-pill h-10 min-w-10 px-2.5 flex items-center gap-1 select-none",
        "transition-[background-color,color,transform] duration-snap ease-snap",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]",
        "active:scale-[0.96]",
        muted
          ? "text-[var(--color-text)] hover:bg-[color-mix(in_oklab,var(--color-text)_8%,transparent)] opacity-70"
          : "bg-[var(--color-accent)] text-[var(--color-accent-contrast)]",
      ].join(" ")}
    >
      <span aria-hidden className="text-base leading-none">🎵</span>
    </button>
  );
}
