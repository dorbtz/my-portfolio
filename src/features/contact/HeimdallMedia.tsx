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
 * with the transparent Heimdall WEBM (sword sweep, glow) overlaid in the
 * exact same spot on every screen size.
 *
 * Per user request the cartoon heimdall.png foreground figure was dropped;
 * only the painted backdrop + the WEBM remain. The WEBM is sized larger
 * than the frame (135 %) and offset so it sits visually centred while
 * spilling slightly past the card border at the animation peak.
 */

const VIDEO_WEBM = "/assets/Marvel/heimdall/heimdall.webm";
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
    // 4/5 aspect (taller than the previous 16/10) so the portrait Asgard
    // backdrop — runic doorway at the top, full bifrost descending,
    // golden floor + runic mandala at the bottom — actually fits.
    // 320 px wide keeps the card narrow on every breakpoint per user
    // request. Background uses `object-cover` with the natural centre
    // position so the bifrost reads top-to-bottom without crushing.
    <div
      className="relative w-full max-w-[320px] mx-auto aspect-[4/5] isolate overflow-visible"
      aria-label={alt}
      role="img"
    >
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <img
          src={IMAGE_BG}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="lazy"
        />
      </div>
      {/* WEBM overlay sized 150 %. iOS Safari drops the alpha channel on
          VP9-alpha WEBMs, painting black where the transparent area
          should be — `mix-blend-mode: screen` makes that black composite
          to nothing on top of the darker Asgard backdrop, restoring the
          cut-out look without re-encoding the video. */}
      <video
        ref={overlayRef}
        muted={webmMuted}
        playsInline
        preload="auto"
        className="absolute object-contain pointer-events-none"
        style={{
          width: "150%",
          height: "150%",
          left: "0%",
          top: "-25%",
          mixBlendMode: "screen",
        }}
        onEnded={onEnded}
      >
        <source src={VIDEO_WEBM} type="video/webm" />
      </video>
    </div>
  );
}
