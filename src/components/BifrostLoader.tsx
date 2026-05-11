/**
 * src/components/BifrostLoader.tsx
 * First-visit full-viewport overlay with a conic-gradient Bifrost beam.
 * Shown for 1.2s then fades (300ms). Click anywhere to skip.
 * Skipped entirely on prefers-reduced-motion: reduce.
 * Uses sessionStorage 'pf:bifrost-seen' to skip on repeat visits.
 */
import { useEffect, useRef, useState } from 'react';
import { playSfx } from '../lib/audio';

const SESSION_KEY = 'pf:bifrost-seen';

function hasSeenThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // sessionStorage blocked
  }
}

export default function BifrostLoader() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const dismissed = useRef(false);
  // Both timers captured in refs so both can be cleared on unmount.
  const autoTimerRef = useRef<number | null>(null);
  const fadeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Skip on reduced-motion
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || hasSeenThisSession()) return;

    setVisible(true);

    // Auto-dismiss after 1.2s
    autoTimerRef.current = window.setTimeout(() => {
      dismiss();
    }, 1200) as unknown as number;

    return () => {
      if (autoTimerRef.current !== null) window.clearTimeout(autoTimerRef.current);
      if (fadeTimerRef.current !== null) window.clearTimeout(fadeTimerRef.current);
    };
  }, []);

  function dismiss() {
    if (dismissed.current) return;
    dismissed.current = true;
    markSeen();
    setExiting(true);

    // Wait for fade-out then unmount
    fadeTimerRef.current = window.setTimeout(() => {
      setVisible(false);
      // Fire bifrost.hum sound (silent no-op if file missing)
      playSfx('bifrost.hum');
    }, 320) as unknown as number;
  }

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      onClick={dismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#060a18',
        transition: 'opacity 300ms ease',
        opacity: exiting ? 0 : 1,
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      {/* Bifrost beam — conic gradient rotating */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '80vw',
            height: '200vh',
            background:
              'conic-gradient(from 180deg at 50% -10%, ' +
              '#e53548 0deg, #1aa0e6 60deg, #4af7ff 90deg, ' +
              '#a060ff 130deg, #ff6b6b 180deg, #e53548 360deg)',
            opacity: 0.85,
            filter: 'blur(18px)',
            transform: 'translateY(-40%)',
            animation: 'bifrost-beam 1.4s ease-in-out forwards',
          }}
        />
      </div>

      {/* Center logo / text */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          color: '#fff',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          animation: 'bifrost-fade-in 0.5s ease forwards',
        }}
      >
        <div
          style={{
            fontSize: 'clamp(2rem, 6vw, 4rem)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1,
            textShadow: '0 0 40px rgba(118, 207, 255, 0.8)',
          }}
        >
          ᛒᛁᚠᚱᛟᛋᛏ
        </div>
        <div
          style={{
            marginTop: '0.75rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.36em',
            textTransform: 'uppercase',
            opacity: 0.7,
          }}
        >
          Bifrost — Loading
        </div>
      </div>

      <style>{`
        @keyframes bifrost-beam {
          0%   { transform: translateY(-100%) scaleX(0.4); opacity: 0; }
          25%  { transform: translateY(-60%) scaleX(0.7); opacity: 0.7; }
          60%  { transform: translateY(-40%) scaleX(1);   opacity: 0.85; }
          100% { transform: translateY(-20%) scaleX(1.1); opacity: 0.9; }
        }
        @keyframes bifrost-fade-in {
          0%   { opacity: 0; transform: translateY(12px); }
          60%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
