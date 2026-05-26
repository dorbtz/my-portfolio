/**
 * src/components/HeimdallMedia.tsx
 *
 * Round 65 — Thor-mode Contact card mirrors the Den Den Mushi layered-
 * media structure.  Replaces the lazy R3F `ContactGlbScene` (heimdall.glb)
 * with a static PNG backdrop + an always-visible transparent WEBM overlay
 * that plays its animation when the user submits the form.
 *
 *   .heimdall-media                 ← outer wrapper (overflow:visible)
 *     .heimdall-media__window       ← overflow:hidden + rounded corners
 *       <img class="…__base">       ← static background PNG, clipped
 *                                     to the rounded window
 *     <video class="…__video">      ← WEBM overlay — SIBLING to the
 *                                     window so its transparent canvas
 *                                     can spill past the rounded frame
 *                                     when the video aspect doesn't
 *                                     match the card aspect exactly.
 *
 * Audio routing matches DenDenLuffyMedia: the webm carries audio when
 * the global SoundToggle is on, muted otherwise.  The overlay seeks to
 * frame 0 on mount so the idle state shows the resting Heimdall figure
 * on top of the background instead of a black box.
 */

import { useEffect, useRef, useState } from 'react';
import { useSoundOn } from '../../shared/stores/mode';

// Round 68: swapped heimdall3.webm → heimdall.webm per user (new asset).
const VIDEO_WEBM = '/assets/Marvel/heimdall/heimdall.webm';
// MP4 fallback for browsers without VP9-alpha (Safari).  Still pointing
// at heimdall3.mp4 — the only mp4 currently shipped in this folder; if
// you produce a heimdall.mp4 to match the new webm, swap it here.
const VIDEO_MP4 = '/assets/Marvel/heimdall/heimdall3.mp4';
// NB: filename intentionally "heimall3-bg.png" (the user shipped the
// asset with the existing "heimall" typo on disk; we don't rename here).
const IMAGE_BG = '/assets/Marvel/heimdall/heimall3-bg.png';
// Round 73 — static figure fallback.  Painted PNG of Heimdall in his
// resting pose; rendered as a sibling beneath the WEBM and hidden once
// the video fires `canplay` (first frame paint-ready).  If the WEBM
// errors out or never reaches `canplay` (slow connection, codec gap),
// the static figure stays on screen so the user always sees Heimdall.
const IMAGE_FIGURE = '/assets/Marvel/heimdall/heimdall.png';

type Props = {
  /** When true the overlay webm plays from the beginning; when false it pauses at frame 0. */
  playing: boolean;
  /** Fired when the OVERLAY (webm) ends — parent flips `playing` back to false. */
  onEnded?: () => void;
  alt: string;
  /** Round 34 — admin-uploaded backdrop URL (PNG). Falls back to bundled asset. */
  imageUrlOverride?: string;
  /** Round 34 — admin-uploaded animation URL (WEBM). Falls back to bundled asset. */
  videoUrlOverride?: string;
};

export default function HeimdallMedia({
  playing,
  onEnded,
  alt,
  imageUrlOverride,
  videoUrlOverride,
}: Props) {
  const figureSrc = imageUrlOverride?.trim() || IMAGE_FIGURE;
  const videoWebmSrc = videoUrlOverride?.trim() || VIDEO_WEBM;
  const overlayRef = useRef<HTMLVideoElement>(null);
  // SoundToggle in the header drives this — when off the overlay stays
  // muted, when on it plays its audio track.
  const soundOn = useSoundOn();
  // Round 73: static figure fallback visibility.  Starts true; flips to
  // false once the video reaches `canplay`.  Stays true on video error.
  const [figureVisible, setFigureVisible] = useState(true);

  // Force the overlay to render its first frame on mount so the idle
  // state isn't a black box.  Lock playbackRate to 1.
  useEffect(() => {
    const v = overlayRef.current;
    if (!v) return;
    v.playbackRate = 1;
    const apply = () => {
      try { v.currentTime = 0.001; } catch { /* metadata not ready */ }
    };
    if (v.readyState >= 1) apply();
    else v.addEventListener('loadedmetadata', apply, { once: true });
  }, []);

  // Reactive mute: keep the overlay's mute state in sync with the
  // global SoundToggle so the user can mute/unmute mid-playback.
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.muted = !soundOn;
    overlay.volume = 1;
  }, [soundOn]);

  // Play / pause the overlay in response to the `playing` prop.
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (!playing) {
      overlay.pause();
      try { overlay.currentTime = 0.001; } catch { /* ignore */ }
      return;
    }

    overlay.playbackRate = 1;
    try { overlay.currentTime = 0; } catch { /* ignore */ }
    const p = overlay.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }, [playing]);

  return (
    <div
      className={`heimdall-media${playing ? ' heimdall-media--playing' : ''}`}
      aria-busy={playing || undefined}
      aria-label={alt}
    >
      {/* WINDOW — overflow:hidden + rounded corners.  The static Heimdall
          background image sits inside this clipped frame. */}
      <div className="heimdall-media__window">
        <img
          className="heimdall-media__base"
          src={IMAGE_BG}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </div>

      {/* STATIC FIGURE FALLBACK — SIBLING to the window, positioned
          identically to the WEBM so the silhouette lines up.  Visible
          on mount; hidden once the video fires `canplay`.  Stays
          visible if the video errors. */}
      {figureVisible && (
        <img
          className="heimdall-media__figure"
          src={figureSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      )}

      {/* WEBM — SIBLING to the window (not inside it), so its transparent
          canvas can overflow outside the rounded frame and overlap the
          Contact form when the video aspect is slightly wider than the
          card aspect.  pointer-events:none keeps the form operable. */}
      <video
        ref={overlayRef}
        key={videoWebmSrc /* re-mount when admin uploads a new file */}
        className="heimdall-media__video"
        muted
        playsInline
        preload="auto"
        onEnded={() => onEnded?.()}
        onCanPlay={() => setFigureVisible(false)}
        onError={() => setFigureVisible(true)}
        aria-hidden="true"
      >
        <source src={videoWebmSrc} type="video/webm" />
        {/* MP4 fallback only used when no admin override is set; if the
            admin uploaded a custom WEBM we trust they verified browser
            support for their target audience. */}
        {!videoUrlOverride && <source src={VIDEO_MP4} type="video/mp4" />}
        <track kind="captions" />
      </video>
    </div>
  );
}
