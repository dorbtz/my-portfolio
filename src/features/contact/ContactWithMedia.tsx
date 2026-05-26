"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ThemeContactMedia } from "./ThemeContactMedia";

/**
 * Glue layer between ContactForm and the per-theme media widget.
 *
 * Children: the ContactForm. When the form fires the global custom event
 * `pf-contact-submit`, this wrapper sets `playing=true` so HeimdallMedia /
 * DenDenLuffyMedia plays its overlay once, then resets via onEnded.
 *
 * Decoupled via a window event so the form doesn't need to know whether
 * a media widget is present (HighTech theme renders nothing).
 */
export function ContactWithMedia({ children }: { children: ReactNode }) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const handler = () => setPlaying(true);
    window.addEventListener("pf-contact-submit", handler);
    return () => window.removeEventListener("pf-contact-submit", handler);
  }, []);

  return (
    <div className="grid gap-5">
      <ThemeContactMedia playing={playing} onEnded={() => setPlaying(false)} />
      {children}
    </div>
  );
}
