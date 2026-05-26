"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Theme } from "@/shared/lib/theme/types";

/**
 * Theme-conditional contact media. Reads the current theme from <html
 * data-theme="..."> (set by the Server Component layout) and lazy-loads
 * only the asset bundle needed for the active theme:
 *
 *   - Thor   -> HeimdallMedia (Marvel)
 *   - Luffy  -> DenDenLuffyMedia (One Piece)
 *   - HighTech -> nothing rendered (clean default)
 *
 * The widget reads from the DOM rather than from a cookie so it auto-
 * updates the instant the user clicks the theme switcher — no reload.
 *
 * `playing` is owned by the parent (ContactForm flips it on submit so
 * the WEBM plays once when a message is sent).
 */

const HeimdallMedia = dynamic(() => import("./HeimdallMedia"), {
  ssr: false,
  loading: () => <MediaPlaceholder />,
});

const DenDenLuffyMedia = dynamic(() => import("./DenDenLuffyMedia"), {
  ssr: false,
  loading: () => <MediaPlaceholder />,
});

function MediaPlaceholder() {
  return (
    <div
      aria-hidden
      className="w-full aspect-[16/10] rounded-lg bg-[color-mix(in_oklab,var(--color-text)_4%,transparent)]"
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

type Props = {
  playing: boolean;
  onEnded?: () => void;
};

export function ThemeContactMedia({ playing, onEnded }: Props) {
  const theme = useActiveTheme();
  if (theme === "thor") {
    return <HeimdallMedia playing={playing} onEnded={onEnded} alt="Heimdall watches the realms" />;
  }
  if (theme === "luffy") {
    return (
      <DenDenLuffyMedia
        playing={playing}
        onEnded={onEnded}
        alt="Den-Den-Mushi snail transponder ringing"
      />
    );
  }
  return null;
}
