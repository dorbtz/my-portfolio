/**
 * MjolnirSigil — stylized Mjolnir hammer framed in a circle of Elder Futhark runes.
 * Authored from scratch: hammer + rune ring + lightning forks. No images or copyrighted art.
 * Scales cleanly from 24px to 96px+.
 */
export interface MjolnirSigilProps {
  size?: number;
  className?: string;
  color?: string;
}

export default function MjolnirSigil({
  size = 32,
  className,
  color = 'currentColor',
}: MjolnirSigilProps) {
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
    >
      {/* Outer rune ring — circle border, thick + slightly irregular */}
      <circle
        cx="50"
        cy="50"
        r="46"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray="6 2.5 4 3 5 2"
        fill="none"
        opacity="0.85"
      />

      {/* Inner ring — thinner, decorative triquetra feel */}
      <circle
        cx="50"
        cy="50"
        r="40"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="2 4 3 3"
        fill="none"
        opacity="0.4"
      />

      {/* === Mjolnir Hammer === */}
      {/* Head — squared, heavy */}
      <rect
        x="28"
        y="20"
        width="44"
        height="28"
        rx="2.5"
        fill={color}
        opacity="0.95"
      />
      {/* Head inner detail — top bevel line */}
      <line x1="32" y1="25" x2="68" y2="25" stroke="rgba(0,0,0,0.28)" strokeWidth="2" strokeLinecap="round" />
      {/* Head inner detail — bottom bevel line */}
      <line x1="32" y1="43" x2="68" y2="43" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round" />

      {/* Handle grip band — narrow rectangle between head and grip */}
      <rect
        x="44"
        y="48"
        width="12"
        height="5"
        rx="1"
        fill={color}
        opacity="0.7"
      />

      {/* Handle — short and stout */}
      <rect
        x="46"
        y="53"
        width="8"
        height="22"
        rx="1.5"
        fill={color}
        opacity="0.88"
      />

      {/* Handle cross-wrap lines */}
      <line x1="46" y1="58" x2="54" y2="58" stroke="rgba(0,0,0,0.3)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="46" y1="63" x2="54" y2="63" stroke="rgba(0,0,0,0.3)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="46" y1="68" x2="54" y2="68" stroke="rgba(0,0,0,0.3)" strokeWidth="1.2" strokeLinecap="round" />

      {/* Handle pommel — small disc at base */}
      <ellipse cx="50" cy="75" rx="5" ry="2.5" fill={color} opacity="0.75" />

      {/* === Elder Futhark rune marks on hammer head === */}
      {/* ᚦ Thurisaz — left side */}
      <text
        x="33"
        y="38"
        fontSize="10"
        fontWeight="900"
        fill="rgba(0,0,0,0.45)"
        textAnchor="middle"
        fontFamily="serif"
      >ᚦ</text>
      {/* ᛟ Othala — center */}
      <text
        x="50"
        y="38"
        fontSize="10"
        fontWeight="900"
        fill="rgba(0,0,0,0.45)"
        textAnchor="middle"
        fontFamily="serif"
      >ᛟ</text>
      {/* ᚱ Raidho — right */}
      <text
        x="67"
        y="38"
        fontSize="10"
        fontWeight="900"
        fill="rgba(0,0,0,0.45)"
        textAnchor="middle"
        fontFamily="serif"
      >ᚱ</text>

      {/* === Lightning forks — corner accents === */}
      {/* Top-left fork */}
      <polyline
        points="12,14 17,20 14,24 19,30"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.7"
      />
      {/* Top-right fork */}
      <polyline
        points="88,14 83,20 86,24 81,30"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.7"
      />
      {/* Bottom-left spark */}
      <polyline
        points="14,78 18,72 16,68"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
      />
      {/* Bottom-right spark */}
      <polyline
        points="86,78 82,72 84,68"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
      />

      {/* === Rune dots around ring (8 positions — clock positions) === */}
      {/* N */}
      <circle cx="50" cy="5" r="1.8" fill={color} opacity="0.55" />
      {/* NE */}
      <circle cx="74" cy="11" r="1.4" fill={color} opacity="0.45" />
      {/* E */}
      <circle cx="95" cy="50" r="1.8" fill={color} opacity="0.55" />
      {/* SE */}
      <circle cx="74" cy="89" r="1.4" fill={color} opacity="0.45" />
      {/* S */}
      <circle cx="50" cy="95" r="1.8" fill={color} opacity="0.55" />
      {/* SW */}
      <circle cx="26" cy="89" r="1.4" fill={color} opacity="0.45" />
      {/* W */}
      <circle cx="5" cy="50" r="1.8" fill={color} opacity="0.55" />
      {/* NW */}
      <circle cx="26" cy="11" r="1.4" fill={color} opacity="0.45" />
    </svg>
  );
}
