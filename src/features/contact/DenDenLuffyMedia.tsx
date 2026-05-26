"use client";
/* eslint-disable @next/next/no-img-element */
// Plain <img> is the right call here: layered absolute-positioned media
// where next/image's automatic optimizations don't add value (sources are
// small backdrop assets the WEBM overlay sits on top of, lazy-loaded,
// only ever mounted when theme=luffy).

import { useEffect, useRef } from "react";

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
const VIDEO_MP4 = "/assets/One-Piece/dendenluffy/dendenluffyg5-live.mp4";
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
    // Cap width so the Den-Den-Mushi doesn't dominate the Contact form on
    // wide screens. overflow-visible so the snail's wobble + receiver
    // lift extend past the rounded backdrop card border ("getting out
    // of the card" as the user described).
    <div
      className="relative w-full max-w-sm mx-auto aspect-[16/10] isolate overflow-visible"
      aria-label={alt}
      role="img"
    >
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <img
          src={IMAGE_BG}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      {/* WEBM overlay sized 120% and offset so the snail's animation
          spills out of the card frame at the bounce peak. */}
      <video
        ref={overlayRef}
        muted
        playsInline
        preload="auto"
        className="absolute object-contain pointer-events-none"
        style={{ width: "120%", height: "120%", left: "-10%", top: "-10%" }}
        onEnded={onEnded}
      >
        <source src={VIDEO_WEBM} type="video/webm" />
        <source src={VIDEO_MP4} type="video/mp4" />
      </video>
    </div>
  );
}
