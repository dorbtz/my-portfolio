"use client";
/* eslint-disable @next/next/no-img-element */
// Plain <img> is the right call here: layered absolute-positioned media
// where next/image's automatic optimizations don't add value (sources are
// small backdrop assets the WEBM overlay sits on top of, lazy-loaded,
// only ever mounted when theme=thor).

import { useEffect, useRef, useState } from "react";

/**
 * Thor-mode Contact card visual — layered media (static backdrop +
 * always-resident transparent WEBM overlay).
 *
 * - Background PNG is clipped to a rounded "window".
 * - WEBM (VP9-alpha) sits as a SIBLING of the window so its transparent
 *   canvas can spill past the rounded frame if the aspect mismatches.
 * - Static Heimdall PNG fallback shows until the WEBM reaches `canplay`,
 *   so the user never sees a black frame (slow connections or codec gaps).
 * - The overlay seeks to frame 0 on mount so the idle state shows a
 *   single resting frame, not a black box.
 *
 * Plays once on `playing=true` then fires `onEnded`. Muted by default
 * (sound toggle ships in M8 alongside other polish).
 */

const VIDEO_WEBM = "/assets/Marvel/heimdall/heimdall.webm";
const VIDEO_MP4 = "/assets/Marvel/heimdall/heimdall3.mp4";
const IMAGE_BG = "/assets/Marvel/heimdall/heimall3-bg.png";
const IMAGE_FIGURE = "/assets/Marvel/heimdall/heimdall.png";

type Props = {
  /** True -> overlay plays from frame 0. False -> paused at frame 0. */
  playing: boolean;
  /** Fired when the overlay ends — parent flips `playing` back to false. */
  onEnded?: () => void;
  alt: string;
};

export default function HeimdallMedia({ playing, onEnded, alt }: Props) {
  const overlayRef = useRef<HTMLVideoElement>(null);
  const [figureVisible, setFigureVisible] = useState(true);

  // Force frame 0 on mount so the idle state isn't a black box.
  useEffect(() => {
    const v = overlayRef.current;
    if (!v) return;
    v.playbackRate = 1;
    const seek = () => {
      try {
        v.currentTime = 0.001;
      } catch {
        /* metadata not ready yet */
      }
    };
    if (v.readyState >= 1) seek();
    else v.addEventListener("loadedmetadata", seek, { once: true });
  }, []);

  // Play / pause in response to `playing`.
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
        /* autoplay blocked — caller will see no animation; not fatal */
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
    // Outer wrapper centers the card and caps the width — Heimdall was huge
    // when the Contact form column went wide on desktop. Cap at sm
    // (384px) and center; mobile gets the full width minus the column
    // padding. aspect-[16/10] keeps the proportions stable.
    // overflow-visible on the outer so the WEBM can spill past the card
    // border (sword sweep, glow) when the animation peaks.
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
        {figureVisible && (
          <img
            src={IMAGE_FIGURE}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            loading="lazy"
          />
        )}
      </div>
      {/* WEBM overlay sized 115% with negative offsets so it spills past the
          rounded backdrop frame when the animation extends beyond the card. */}
      <video
        ref={overlayRef}
        muted
        playsInline
        preload="auto"
        className="absolute object-contain pointer-events-none"
        style={{ width: "115%", height: "115%", left: "-7.5%", top: "-7.5%" }}
        onCanPlay={() => setFigureVisible(false)}
        onError={() => setFigureVisible(true)}
        onEnded={onEnded}
      >
        <source src={VIDEO_WEBM} type="video/webm" />
        <source src={VIDEO_MP4} type="video/mp4" />
      </video>
    </div>
  );
}
