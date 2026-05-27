"use client";
/* eslint-disable @next/next/no-img-element */
// Plain <img> is the right call here: layered absolute-positioned media
// where next/image's automatic optimizations don't add value (sources are
// small backdrop assets the WEBM overlay sits on top of, lazy-loaded,
// only ever mounted when theme=luffy).

import { useEffect, useRef, useSyncExternalStore } from "react";
import { isMutedWebm, onWebmMuteChange } from "@/shared/lib/audio";

/**
 * Luffy-mode Contact card visual — wooden-table backdrop with the
 * Den-Den-Mushi snail overlaid.
 *
 * Cross-platform video strategy mirrors HeimdallMedia:
 *   - <source webm> primary  -> Chrome / Firefox / Edge use VP9 alpha
 *                                so the snail floats cleanly above the
 *                                wood-grain bg.
 *   - <source mp4>  fallback -> Safari / iOS use the MP4 (no alpha,
 *                                solid bg). `mix-blend-mode: screen`
 *                                blends the dark areas into the wood-
 *                                grain, and the video lives INSIDE the
 *                                bg-card's overflow-hidden wrapper so any
 *                                leftover halo is clipped at the card
 *                                edge instead of leaking onto the cream
 *                                page (the iOS "black box" bug the user
 *                                reported).
 *
 * Muted by default (Voice pill flips both Heimdall + Snail WEBM audio).
 */

// HEVC-with-alpha source for Safari/iOS — drop the file at this path
// (codec tag MUST be `hvc1`, encode via Rotato Converter on Windows or
// hevc_videotoolbox on macOS) and Safari picks it FIRST, getting real
// transparency. Until that file exists Safari falls through to WebM/MP4
// (where alpha is dropped → black bg shows inside the card).
const VIDEO_HEVC = "/assets/One-Piece/dendenluffy/dendenluffyg5-live-transparent-hevc.mp4";
const VIDEO_WEBM = "/assets/One-Piece/dendenluffy/dendenluffyg5-live-transparent.webm";
const VIDEO_MP4 = "/assets/One-Piece/dendenluffy/dendenluffyg5-live-transparent.mp4";
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
    // 16/11 stage — bg card spans the full width now (no narrower inset),
    // and the video lives INSIDE the card so its black overflow on iOS
    // gets clipped at the rounded card edge instead of leaking onto the
    // cream page.
    <div
      className="relative w-full max-w-[380px] mx-auto aspect-[16/11] isolate"
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
        {/* Source order matters:
              1. HEVC-alpha MP4 (hvc1) — Safari/iOS pick this and get real
                 transparency on the wood-grain backdrop.
              2. WebM/VP9-alpha — Chrome/Firefox/Edge use this with full
                 alpha. Safari decodes VP9 but strips alpha (never been
                 supported on Safari — confirmed across iOS 13–18 per
                 Jake Archibald 2024).
              3. MP4 (H.264) — legacy fallback, no alpha. */}
        <video
          ref={overlayRef}
          muted={webmMuted}
          playsInline
          preload="auto"
          poster={IMAGE_BG}
          className="absolute object-contain pointer-events-none"
          style={{
            width: "140%",
            height: "140%",
            left: "-5%",
            top: "-20%",
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
