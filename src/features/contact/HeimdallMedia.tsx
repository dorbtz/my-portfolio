"use client";
/* eslint-disable @next/next/no-img-element */
// Plain <img> is the right call here: layered absolute-positioned media
// where next/image's automatic optimizations don't add value (single
// backdrop the WEBM overlay sits on top of, lazy-loaded, only ever
// mounted when theme=thor).

import { useEffect, useRef, useSyncExternalStore } from "react";
import { isMutedWebm, onWebmMuteChange } from "@/shared/lib/audio";

/**
 * Thor-mode Contact card visual — heimall3-bg.png (the painted backdrop)
 * with the Heimdall sword sweep overlaid in the exact same spot on every
 * screen size.
 *
 * Cross-platform video strategy:
 *   - <source webm> first  -> Chrome / Firefox / Edge play it with full
 *                              VP9-alpha transparency, layered cleanly on
 *                              top of the bifrost backdrop.
 *   - <source mp4> fallback -> Safari / iOS use this; the MP4 has a black
 *                              background baked in. We keep `mix-blend-mode:
 *                              screen` so any black blends to nothing on
 *                              the dark Asgard backdrop, AND we render the
 *                              video INSIDE the bg-card's overflow-hidden
 *                              wrapper so any leftover black halo is clipped
 *                              at the card edge instead of spilling onto
 *                              the page (the iOS "black box" bug the user
 *                              reported).
 */

// HEVC-with-alpha source for Safari/iOS — drop the file at this path
// (codec tag MUST be `hvc1`, encode via Rotato Converter on Windows or
// hevc_videotoolbox on macOS) and Safari picks it FIRST, getting real
// transparency. Until that file exists Safari falls through to WebM/MP4
// (where alpha is dropped → black bg shows inside the card).
const VIDEO_HEVC = "/assets/Marvel/heimdall/heimdall-hevc.mp4";
const VIDEO_WEBM = "/assets/Marvel/heimdall/heimdall.webm";
const VIDEO_MP4 = "/assets/Marvel/heimdall/heimdall.mp4";
const IMAGE_BG = "/assets/Marvel/heimdall/heimall3-bg.png";

type Props = {
  /** True -> overlay plays from frame 0. False -> paused at frame 0. */
  playing: boolean;
  /** Fired when the overlay ends — parent flips `playing` back to false. */
  onEnded?: () => void;
  alt: string;
};

export default function HeimdallMedia({ playing, onEnded, alt }: Props) {
  const overlayRef = useRef<HTMLVideoElement>(null);
  // INDEPENDENT mute for the WEBM voice — separate from the ambient music
  // toggle. Muted by default; flips when the user clicks the Voice pill.
  const webmMuted = useSyncExternalStore(
    (cb) => onWebmMuteChange(() => cb()),
    isMutedWebm,
    () => true
  );

  // Seek to frame 0 once metadata is ready so the idle state shows the
  // resting first frame instead of a black box.
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
    // 4/5 portrait so the bifrost backdrop fits top-to-bottom.
    <div
      className="relative w-full max-w-[320px] mx-auto aspect-[4/5] isolate"
      aria-label={alt}
      role="img"
    >
      {/* Clipped stage — bg image + video share this overflow-hidden,
          rounded wrapper. Any MP4-black halo from iOS gets clipped at the
          rounded edge instead of leaking onto the page. */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <img
          src={IMAGE_BG}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="lazy"
        />
        {/* Source order matters:
              1. HEVC-alpha MP4 (hvc1) — Safari/iOS pick this and get real
                 transparency on the bifrost backdrop. Until the file
                 exists at the path above, Safari fails the load and
                 silently falls through to source #2/#3.
              2. WebM/VP9-alpha — Chrome/Firefox/Edge use this with full
                 alpha. Safari can decode VP9 but strips the alpha plane
                 (Apple has never shipped VP9-alpha support — confirmed
                 across iOS 13–18 per Jake Archibald's 2024 research +
                 BobbyKegel 2025).
              3. MP4 (H.264) — legacy fallback, no alpha. */}
        <video
          ref={overlayRef}
          muted={webmMuted}
          playsInline
          preload="auto"
          poster={IMAGE_BG}
          className="absolute object-contain pointer-events-none"
          style={{
            width: "130%",
            height: "130%",
            left: "-5%",
            top: "-15%",
          }}
          onEnded={onEnded}
        >
          <source src={VIDEO_HEVC} type='video/mp4; codecs="hvc1"' />
          <source src={VIDEO_WEBM} type="video/webm" />
          <source src={VIDEO_MP4} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
