/**
 * CinematicOverlay — fixed-position decorative layer, mode-aware.
 *
 * Thor mode (MCU-cinematic):
 *  - Letterbox bars (32px) top + bottom, only on home
 *  - MCU-style chyron "ASGARD · NEW MEXICO · 2026" bottom-left on hero load
 *  - Thin gold + electric-blue gradient hairlines along viewport edges
 *
 * Gear 5 mode (manga):
 *  - Hand-drawn ink edges at viewport corners
 *  - Floating kana SFX ("ドン!") drifts from corner, fades after 1.5s
 *  - White-burst pulse over bottom-right every ~10s
 *
 * Both modes: page-corner curl (top-right). Respects motion preferences.
 */
import { useEffect, useRef, useState } from 'react';
import { useMode, useMotionOn } from '../../shared/stores/mode';

// Kana SFX that drift in Gear 5 mode
const KANA_SFX = ['ドン!', 'ボン!', 'ズキュン!', 'バン!'];

function useIsHome() {
  const [isHome, setIsHome] = useState(
    typeof window !== 'undefined' ? window.location.pathname === '/' : true
  );
  useEffect(() => {
    const check = () => setIsHome(window.location.pathname === '/');
    window.addEventListener('popstate', check);
    return () => window.removeEventListener('popstate', check);
  }, []);
  return isHome;
}

export default function CinematicOverlay() {
  const mode = useMode();
  const motionOn = useMotionOn();
  const isThor = mode === 'thor';
  const isHome = useIsHome();

  // Chyron state — appears briefly after mount in Thor mode
  const [showChyron, setShowChyron] = useState(false);
  const chyronTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Kana SFX state
  const [kanaVisible, setKanaVisible] = useState(false);
  const [kanaText, setKanaText] = useState('ドン!');
  const kanaInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // White-burst state (Gear 5)
  const [burstVisible, setBurstVisible] = useState(false);
  const burstInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Thor mode: show chyron briefly on mount / mode switch
    if (isThor && isHome) {
      if (chyronTimer.current) clearTimeout(chyronTimer.current);
      // Delay so page has settled
      chyronTimer.current = setTimeout(() => {
        setShowChyron(true);
        chyronTimer.current = setTimeout(() => setShowChyron(false), 4000);
      }, 800);
    } else {
      setShowChyron(false);
    }

    return () => {
      if (chyronTimer.current) clearTimeout(chyronTimer.current);
    };
  }, [isThor, isHome]);

  useEffect(() => {
    // Gear 5 mode: occasional kana SFX drift
    if (!isThor && motionOn) {
      kanaInterval.current = setInterval(() => {
        const sfx = KANA_SFX[Math.floor(Math.random() * KANA_SFX.length)];
        setKanaText(sfx);
        setKanaVisible(true);
        setTimeout(() => setKanaVisible(false), 1500);
      }, 8000);
    }
    return () => {
      if (kanaInterval.current) clearInterval(kanaInterval.current);
    };
  }, [isThor, motionOn]);

  useEffect(() => {
    // Gear 5: white-burst pulse every ~10s
    if (!isThor && motionOn) {
      burstInterval.current = setInterval(() => {
        setBurstVisible(true);
        setTimeout(() => setBurstVisible(false), 1200);
      }, 10000);
    }
    return () => {
      if (burstInterval.current) clearInterval(burstInterval.current);
    };
  }, [isThor, motionOn]);

  return (
    <div className="cinematic-overlay" aria-hidden="true">
      {/* ---- BOTH MODES: Page-corner curl (top-right) ---- */}
      <svg
        className="cinematic-overlay__page-curl"
        viewBox="0 0 60 60"
        fill="none"
      >
        {/* Curl shadow */}
        <path
          d="M60 0 L60 60 L40 60 Q50 50 55 40 Q60 28 60 0"
          fill="rgba(0,0,0,0.18)"
        />
        {/* Curl face */}
        <path
          d="M60 0 L40 0 L40 40 Q50 38 55 30 Q60 20 60 0"
          fill="currentColor"
          opacity="0.06"
        />
        {/* Curl crease */}
        <line x1="40" y1="0" x2="60" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.18" />
      </svg>

      {/* ---- THOR MODE ---- */}
      {isThor && (
        <>
          {/* Round 75 — letterbox bars removed per user feedback (the
              "movie black bars" at top/bottom were clipping the section
              edges in Thor mode).  Gold + blue hairlines stay. */}

          {/* Gold + blue gradient hairlines along viewport edges */}
          <div className="cinematic-overlay__edge-hairline cinematic-overlay__edge-hairline--top-thor" />
          <div className="cinematic-overlay__edge-hairline cinematic-overlay__edge-hairline--bottom-thor" />

          {/* MCU-style chyron */}
          {showChyron && (
            <div
              className={['cinematic-overlay__chyron', motionOn ? 'cinematic-overlay__chyron--animate' : ''].join(' ')}
              style={{ fontFamily: 'var(--font-cinematic)' }}
            >
              <span className="cinematic-overlay__chyron-bar" />
              <span className="cinematic-overlay__chyron-text">
                ASGARD &nbsp;&middot;&nbsp; NEW MEXICO &nbsp;&middot;&nbsp; 2026
              </span>
            </div>
          )}
        </>
      )}

      {/* ---- GEAR 5 MODE ---- */}
      {!isThor && (
        <>
          {/* Ink edge accents at viewport corners */}
          <svg className="cinematic-overlay__ink-edge cinematic-overlay__ink-edge--tl" viewBox="0 0 80 80" fill="none">
            <path
              d="M0 0 Q8 4 5 10 Q2 16 7 20 Q12 24 8 30 Q4 36 10 40 Q16 44 11 50 Q6 56 12 62 Q18 68 13 74 Q8 80 16 80"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.25"
            />
            <path
              d="M0 0 Q4 8 10 5 Q16 2 20 7 Q24 12 30 8 Q36 4 40 10 Q44 16 50 11 Q56 6 62 12 Q68 18 74 13 Q80 8 80 16"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.25"
            />
          </svg>

          <svg className="cinematic-overlay__ink-edge cinematic-overlay__ink-edge--br" viewBox="0 0 80 80" fill="none">
            <path
              d="M80 80 Q72 76 75 70 Q78 64 73 60 Q68 56 72 50 Q76 44 70 40 Q64 36 69 30 Q74 24 68 18 Q62 12 67 6 Q72 0 64 0"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.25"
            />
            <path
              d="M80 80 Q76 72 70 75 Q64 78 60 73 Q56 68 50 72 Q44 76 40 70 Q36 64 30 69 Q24 74 18 68 Q12 62 6 67 Q0 72 0 64"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.25"
            />
          </svg>

          {/* Gold + sky hairlines */}
          <div className="cinematic-overlay__edge-hairline cinematic-overlay__edge-hairline--top-gear5" />
          <div className="cinematic-overlay__edge-hairline cinematic-overlay__edge-hairline--bottom-gear5" />

          {/* Kana SFX drift */}
          {kanaVisible && (
            <span
              className={['cinematic-overlay__kana', motionOn ? 'cinematic-overlay__kana--animate' : ''].join(' ')}
              style={{ fontFamily: 'var(--font-jp)' }}
            >
              {kanaText}
            </span>
          )}

          {/* White burst — Nika cloud pulse */}
          {burstVisible && motionOn && (
            <div className="cinematic-overlay__nika-burst" />
          )}
        </>
      )}
    </div>
  );
}
