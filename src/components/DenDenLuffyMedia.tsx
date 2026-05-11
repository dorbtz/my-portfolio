/**
 * src/components/DenDenLuffyMedia.tsx
 *
 * Round 51 — base mp4 swapped for a static background image.
 *
 *   .den-den-luffy                 ← outer wrapper (overflow:visible)
 *     .den-den-luffy__window       ← overflow:hidden + rounded corners
 *       <img class="…__base">      ← static background PNG, clipped
 *                                    to the rounded window
 *     <video class="…__video">     ← WEBM overlay — SIBLING to the
 *                                    window so its transparent canvas
 *                                    can spill past the rounded frame
 *                                    if the card is narrower than the
 *                                    video's native 1.83:1 aspect.
 *
 * Sync logic was removed — there's no second clock to align with now
 * that the base is a still image.  The overlay just plays from frame
 * 0 when `playing` flips true and pauses + resets when it flips back.
 *
 * Audio routing preserved: the webm carries audio when SoundToggle is
 * on, muted otherwise; the global SoundToggle in the header drives
 * the reactive mute effect.
 */

import { useEffect, useRef } from 'react';
import { useSoundOn } from '../stores/mode';

const VIDEO_WEBM = '/assets/One-Piece/dendenluffy/dendenluffyg5-live-transparent.webm';
const VIDEO_MP4 = '/assets/One-Piece/dendenluffy/dendenluffyg5-live.mp4';
const IMAGE_BG = '/assets/One-Piece/dendenluffy/DenDenBackground.png';

type Props = {
  /** When true the overlay webm plays from the beginning; when false it pauses at frame 0. */
  playing: boolean;
  /** Fired when the OVERLAY (webm) ends — parent flips `playing` back to false. */
  onEnded?: () => void;
  alt: string;
  /** Round 34 — admin-uploaded backdrop URL. Falls back to bundled asset. */
  imageUrlOverride?: string;
  /** Round 34 — admin-uploaded animation URL. Falls back to bundled asset. */
  videoUrlOverride?: string;
};

export default function DenDenLuffyMedia({
  playing,
  onEnded,
  alt,
  imageUrlOverride,
  videoUrlOverride,
}: Props) {
  const imageBgSrc = imageUrlOverride?.trim() || IMAGE_BG;
  const videoWebmSrc = videoUrlOverride?.trim() || VIDEO_WEBM;
  const overlayRef = useRef<HTMLVideoElement>(null);
  // SoundToggle in the header drives this — when off the overlay stays
  // muted, when on it plays its audio track.
  const soundOn = useSoundOn();

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
      className={`den-den-luffy${playing ? ' den-den-luffy--playing' : ''}`}
      aria-busy={playing || undefined}
      aria-label={alt}
    >
      {/* WINDOW — overflow:hidden + rounded corners.  The static
          background image sits inside this clipped frame. */}
      <div className="den-den-luffy__window">
        <img
          className="den-den-luffy__base"
          src={imageBgSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      </div>

      {/* WEBM — SIBLING to the window (not inside it), so its transparent
          canvas can overflow outside the rounded frame and overlap the
          Contact form.  pointer-events:none keeps the form operable.
          High z-index so it always paints above the form column. */}
      <video
        ref={overlayRef}
        key={videoWebmSrc /* re-mount when admin uploads a new file */}
        className="den-den-luffy__video"
        muted
        playsInline
        preload="auto"
        onEnded={() => onEnded?.()}
        aria-hidden="true"
      >
        <source src={videoWebmSrc} type="video/webm" />
        {!videoUrlOverride && <source src={VIDEO_MP4} type="video/mp4" />}
        <track kind="captions" />
      </video>
    </div>
  );
}
