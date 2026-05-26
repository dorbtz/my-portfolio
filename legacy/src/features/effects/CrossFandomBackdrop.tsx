/**
 * CrossFandomBackdrop — always-on decorative backdrop behind all content.
 * z-index: -1 (behind everything). Purely CSS/SVG — no canvas, no rAF.
 *
 * Layer 1: Kirby Dots SVG pattern (Marvel cosmic) — opacity 3-5%
 * Layer 2: Manga screentone (diagonal lines) — opacity 3-5%
 * Layer 3: Corner torn-paper decorations
 *
 * Mode-aware: Thor shifts dot pattern cooler/blue, Gear 5 warmer/gold.
 * Smooth CSS transition on mode change.
 */
import { useMode } from '../../shared/stores/mode';

export default function CrossFandomBackdrop() {
  const mode = useMode();
  const isThor = mode === 'thor';

  return (
    <div
      className="cross-fandom-backdrop"
      aria-hidden="true"
      data-mode={mode}
    >
      {/* Layer 1: Kirby Dots — repeating radial SVG pattern */}
      <div
        className="cross-fandom-backdrop__dots"
        style={{
          '--dot-color': isThor
            ? 'rgba(76, 207, 255, 0.65)'
            : 'rgba(255, 215, 90, 0.65)',
        } as React.CSSProperties}
      />

      {/* Layer 2: Manga screentone — diagonal ruled lines */}
      <div className="cross-fandom-backdrop__screentone" />

      {/* Layer 3: Torn-paper corner decorations */}
      {/* Top-left: ragged comic edge */}
      <svg
        className="cross-fandom-backdrop__corner cross-fandom-backdrop__corner--tl"
        viewBox="0 0 120 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0 0 L0 120 Q6 110 12 115 Q18 120 24 112 Q30 104 36 108 Q42 112 48 106 Q54 100 60 104 Q66 108 72 100 Q78 92 84 96 Q90 100 96 90 Q102 80 108 84 Q114 88 120 76 L120 0 Z"
          fill="currentColor"
          opacity="0.04"
        />
        {/* Panel border lines */}
        <line x1="0" y1="0" x2="120" y2="0" stroke="currentColor" strokeWidth="2.5" opacity="0.12" />
        <line x1="0" y1="0" x2="0" y2="120" stroke="currentColor" strokeWidth="2.5" opacity="0.12" />
      </svg>

      {/* Top-right: panel edge */}
      <svg
        className="cross-fandom-backdrop__corner cross-fandom-backdrop__corner--tr"
        viewBox="0 0 120 120"
        preserveAspectRatio="none"
      >
        <path
          d="M120 0 L0 0 L0 76 Q6 80 12 74 Q18 68 24 72 Q30 76 36 68 Q42 60 48 64 Q54 68 60 60 Q66 52 72 56 Q78 60 84 52 Q90 44 96 48 Q102 52 108 42 Q114 32 120 38 Z"
          fill="currentColor"
          opacity="0.04"
        />
        <line x1="0" y1="0" x2="120" y2="0" stroke="currentColor" strokeWidth="2.5" opacity="0.12" />
        <line x1="120" y1="0" x2="120" y2="120" stroke="currentColor" strokeWidth="2.5" opacity="0.12" />
      </svg>

      {/* Bottom-left corner: slight torn look */}
      <svg
        className="cross-fandom-backdrop__corner cross-fandom-backdrop__corner--bl"
        viewBox="0 0 120 120"
        preserveAspectRatio="none"
      >
        <line x1="0" y1="120" x2="120" y2="120" stroke="currentColor" strokeWidth="2.5" opacity="0.1" />
        <line x1="0" y1="0" x2="0" y2="120" stroke="currentColor" strokeWidth="2.5" opacity="0.1" />
      </svg>

      {/* Bottom-right corner */}
      <svg
        className="cross-fandom-backdrop__corner cross-fandom-backdrop__corner--br"
        viewBox="0 0 120 120"
        preserveAspectRatio="none"
      >
        <line x1="0" y1="120" x2="120" y2="120" stroke="currentColor" strokeWidth="2.5" opacity="0.1" />
        <line x1="120" y1="0" x2="120" y2="120" stroke="currentColor" strokeWidth="2.5" opacity="0.1" />
        {/* Small rune mark — dual fandom stamp */}
        <text x="88" y="108" fontSize="18" fontFamily="serif" fill="currentColor" opacity="0.08">ᛟ</text>
      </svg>
    </div>
  );
}
