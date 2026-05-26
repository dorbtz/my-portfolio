"use client";
/* eslint-disable @next/next/no-img-element */
// Plain <img> is the right call here: layered absolute-positioned media
// where next/image's automatic optimizations don't add value (sources are
// small backdrop assets the WEBM overlay sits on top of, lazy-loaded,
// only ever mounted when theme=luffy).

import { useEffect, useRef, useSyncExternalStore } from "react";
import { isMutedWebm, onWebmMuteChange } from "@/shared/lib/audio";

/**
 * Luffy-mode Contact card visual — static background image with a
 * transparent WEBM overlay of the Den-Den-Mushi snail at rest.
 *
 * On `playing=true` the snail animates (rings); when `playing=false` it
 * pauses at frame 0 so the resting snail stays visible.
 *
 * Muted by default (sound toggle ships in M8 alongside other polish).
 */

const VIDEO_WEBM = "/assets/One-Piece/dendenluffy/dendenluffyg5-live-transparent.webm";
const IMAGE_BG = "/assets/One-Piece/dendenluffy/DenDenBackground.png";

type Props = {
  /** True -> overlay plays from frame 0. False -> paused at frame 0. */
  playing: boolean;
  /** Fired when the overlay ends — parent flips `playing` back to false. */
  onEnded?: () => void;
  alt: string;
};

export default function DenDenLuffyMedia({ playing, onEnded, alt }: Props) {
  const overlayRef = useRef<HTMLVideoElement>(null);
  // INDEPENDENT mute for the WEBM voice — separate from the ambient music
  // (drums) toggle. Muted by default; flips when the user clicks the Voice pill.
  const webmMuted = useSyncExternalStore(
    (cb) => onWebmMuteChange(() => cb()),
    isMutedWebm,
    () => true
  );

  useEffect(() => {
    const v = overlayRef.current;
    if (!v) return;
    v.playbackRate = 1;
    const seek = () => {
      try {
        v.currentTime = 0.001;
      } catch {
        /* metadata not ready */
      }
    };
    if (v.readyState >= 1) seek();
    else v.addEventListener("loadedmetadata", seek, { once: true });
  }, []);

  useEffect(() => {
    const v = overlayRef.current;
    if (!v) return;
    if (playing) {
      try {
        v.currentTime = 0;
      } catch {
        /* ok */
      }
      void v.play().catch(() => {
        /* autoplay blocked — not fatal */
      });
    } else {
      v.pause();
      try {
        v.currentTime = 0;
      } catch {
        /* ok */
      }
    }
  }, [playing]);

  return (
    // Outer stage is wider so the snail WEBM has room to grow without being
    // clipped, while the actual painted bg-image card is INSET (narrower)
    // inside the stage. End result: the wooden-bar card reads as a smaller
    // tabletop scene, and the snail looms over it — exactly what the user
    // asked for ("background card less wide, snail can be bigger, animation
    // has room to work").
    <div
      className="relative w-full max-w-[380px] mx-auto aspect-[16/11] isolate overflow-visible"
      aria-label={alt}
      role="img"
    >
      {/* Painted bg card — narrower than the stage (~72 % width), full
          height, centred. Rounded + clipped so the wood texture reads as
          a discrete tabletop card. */}
      <div
        className="absolute top-0 bottom-0 overflow-hidden rounded-lg"
        style={{ left: "14%", right: "14%" }}
      >
        <img
          src={IMAGE_BG}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      {/* Snail WEBM sized 185 % so it visibly looms over the tabletop.
          `mix-blend-mode: screen` cancels the black background iOS Safari
          paints when it drops the VP9 alpha channel — black blended with
          the dark wood backdrop disappears, restoring the cut-out look
          without re-encoding the WEBM. */}
      <video
        ref={overlayRef}
        muted={webmMuted}
        playsInline
        preload="auto"
        className="absolute object-contain pointer-events-none"
        style={{
          width: "185%",
          height: "185%",
          left: "0%",
          top: "-40%",
          mixBlendMode: "screen",
        }}
        onEnded={onEnded}
      >
        <source src={VIDEO_WEBM} type="video/webm" />
      </video>
    </div>
  );
}
