"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  isMuted,
  isMutedWebm,
  onMuteChange,
  onWebmMuteChange,
  setMuted,
  setMutedWebm,
} from "../lib/audio";

/**
 * Floating audio toggles. Two INDEPENDENT mute pills — one for the ambient
 * theme music (Luffy drums of liberation / Thor thunder), one for the
 * contact-card WEBM audio (Heimdall sword, Den-Den snail). The user can
 * silence either, both, or neither — they don't share a flag.
 *
 * Both pills are hidden on `data-theme="hightech"` because the default
 * theme has no theme-specific audio surface. Default state for both is
 * muted (autoplay-safe) — first click in each opts in.
 */
export function SoundToggle() {
  // Hooks at top — `useSyncExternalStore` must run on every render, not
  // gated behind the `if (theme === "hightech")` short-circuit below.
  const musicMuted = useSyncExternalStore(
    (cb) => onMuteChange(() => cb()),
    isMuted,
    () => true
  );
  const webmMuted = useSyncExternalStore(
    (cb) => onWebmMuteChange(() => cb()),
    isMutedWebm,
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

  const musicLabel = theme === "thor" ? "Thunder" : "Drums";

  return (
    <div className="flex items-center gap-1.5">
      <Pill
        kind="music"
        on={!musicMuted}
        labelOn={`${musicLabel} on`}
        labelOff={`${musicLabel} off`}
        iconOn="🎵"
        iconOff="🎵"
      />
      <Pill
        kind="webm"
        on={!webmMuted}
        labelOn="Voice on"
        labelOff="Voice off"
        iconOn="🔊"
        iconOff="🔇"
      />
    </div>
  );
}

/** Single audio pill — minimal local UI so both mutes look + feel identical
 *  in the cluster while controlling different audio modules. */
function Pill({
  kind,
  on,
  labelOn,
  labelOff,
  iconOn,
  iconOff,
}: {
  kind: "music" | "webm";
  on: boolean;
  labelOn: string;
  labelOff: string;
  iconOn: string;
  iconOff: string;
}) {
  const muted = !on;
  const setter = kind === "music" ? setMuted : setMutedWebm;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={muted ? labelOff : labelOn}
      title={muted ? labelOff : labelOn}
      onClick={() => setter(muted ? false : true)}
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
      <span aria-hidden className="text-base leading-none">
        {muted ? iconOff : iconOn}
      </span>
    </button>
  );
}
