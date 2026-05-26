import { useState } from 'react';

/**
 * NikaSun — Sun God Nika emblem.
 *
 * To use the REAL Sun God Nika symbol from the One Piece series:
 *   Drop an image at `public/assets/One-Piece/nika-symbol.png` (or .svg / .webp).
 *   This component will load it automatically and fall back to the SVG below
 *   only if the file is missing.
 *
 * Recommended: a transparent PNG or SVG, square aspect ratio, ~256px source.
 *
 * The SVG fallback is a hand-authored woodblock-print sun face — used until
 * a real asset is provided.
 */
export interface NikaSunProps {
  size?: number;
  className?: string;
  color?: string;
  /** Override the asset path. Defaults to /assets/One-Piece/nika-symbol.webp. */
  src?: string;
  /**
   * When true, applies `filter: brightness(0) invert(1) opacity(0.85)` so the
   * symbol reads as white — use this in Thor mode where the background is dark
   * and the natural gold/coloured asset would be invisible.
   */
  forceWhite?: boolean;
}

const DEFAULT_SRC = '/assets/One-Piece/nika-symbol.webp';

export default function NikaSun({
  size = 32,
  className,
  color = 'currentColor',
  src = DEFAULT_SRC,
  forceWhite = false,
}: NikaSunProps) {
  const [imageFailed, setImageFailed] = useState(false);

  // CSS filter that renders any image as a white silhouette at 85% opacity.
  const whiteFilter = 'brightness(0) invert(1) opacity(0.85)';

  if (!imageFailed) {
    return (
      <img
        src={src}
        width={size}
        height={size}
        alt=""
        aria-hidden="true"
        className={className}
        style={{
          display: 'inline-block',
          objectFit: 'contain',
          // Apply white filter when in Thor mode so the symbol stays visible
          // against the dark Asgardian background.
          filter: forceWhite ? whiteFilter : undefined,
        }}
        onError={() => setImageFailed(true)}
      />
    );
  }

  // ---- SVG fallback (renders only if the image above 404s) ----
  const cx = 50;
  const cy = 50;
  const faceR = 22;
  const rayInner = 25;
  const rayOuter = 46;
  const rayCount = 12;

  const rays = Array.from({ length: rayCount }, (_, i) => {
    const baseAngle = (i * 360) / rayCount;
    const rad = (baseAngle * Math.PI) / 180;
    const halfWidth = 4;
    const waveAmt = 3.5;

    const inner = (r: number, angle: number) => ({
      x: cx + r * Math.cos((angle * Math.PI) / 180),
      y: cy + r * Math.sin((angle * Math.PI) / 180),
    });

    const perpRad = rad + Math.PI / 2;
    const perpX = Math.cos(perpRad);
    const perpY = Math.sin(perpRad);

    const bLeft = inner(rayInner, baseAngle);
    const baseL = { x: bLeft.x - perpX * halfWidth, y: bLeft.y - perpY * halfWidth };
    const baseR = { x: bLeft.x + perpX * halfWidth, y: bLeft.y + perpY * halfWidth };

    const midDist = (rayInner + rayOuter) / 2;
    const ctrlL = {
      x: cx + midDist * Math.cos(rad) - perpX * waveAmt,
      y: cy + midDist * Math.sin(rad) - perpY * waveAmt,
    };
    const ctrlR = {
      x: cx + midDist * Math.cos(rad) + perpX * waveAmt,
      y: cy + midDist * Math.sin(rad) + perpY * waveAmt,
    };
    const tip = {
      x: cx + rayOuter * Math.cos(rad),
      y: cy + rayOuter * Math.sin(rad),
    };

    const d = [
      `M ${baseL.x.toFixed(2)} ${baseL.y.toFixed(2)}`,
      `Q ${ctrlL.x.toFixed(2)} ${ctrlL.y.toFixed(2)} ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`,
      `Q ${ctrlR.x.toFixed(2)} ${ctrlR.y.toFixed(2)} ${baseR.x.toFixed(2)} ${baseR.y.toFixed(2)}`,
      'Z',
    ].join(' ');

    return (
      <path
        key={i}
        d={d}
        fill={color}
        opacity="0.82"
        strokeLinecap="round"
        stroke={color}
        strokeWidth="0.8"
      />
    );
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={forceWhite ? { filter: whiteFilter } : undefined}
    >
      <circle cx={cx} cy={cy} r="48" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 3 6 2" fill="none" opacity="0.35" />
      {rays}
      <circle cx={cx} cy={cy} r={faceR} fill={color} opacity="0.95" />
      <circle cx={cx} cy={cy} r={faceR - 2.5} stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" fill="none" />
      <circle cx={cx - 7} cy={cy - 4} r="3.5" fill="rgba(0,0,0,0.72)" />
      <circle cx={cx + 7} cy={cy - 4} r="3.5" fill="rgba(0,0,0,0.72)" />
      <circle cx={cx - 5.8} cy={cy - 5.4} r="1.1" fill="rgba(255,255,255,0.65)" />
      <circle cx={cx + 8.2} cy={cy - 5.4} r="1.1" fill="rgba(255,255,255,0.65)" />
      <path d={`M ${cx - 9} ${cy + 5} Q ${cx} ${cy + 14} ${cx + 9} ${cy + 5}`} stroke="rgba(0,0,0,0.72)" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d={`M ${cx - 7} ${cy + 8} Q ${cx} ${cy + 15} ${cx + 7} ${cy + 8}`} stroke="rgba(0,0,0,0.35)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <ellipse cx={cx - 12} cy={cy + 7} rx="4" ry="2.5" fill="rgba(0,0,0,0.18)" />
      <ellipse cx={cx + 12} cy={cy + 7} rx="4" ry="2.5" fill="rgba(0,0,0,0.18)" />
      <path
        d={`M ${cx - 22} ${cy + 5} Q ${cx - 26} ${cy + 18} ${cx - 18} ${cy + 20} Q ${cx - 10} ${cy + 26} ${cx} ${cy + 23} Q ${cx + 10} ${cy + 26} ${cx + 18} ${cy + 20} Q ${cx + 26} ${cy + 18} ${cx + 22} ${cy + 5}`}
        fill={color}
        opacity="0.78"
        stroke={color}
        strokeWidth="0.5"
      />
    </svg>
  );
}
