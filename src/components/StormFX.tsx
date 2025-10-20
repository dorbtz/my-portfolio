import { useEffect, useRef, useState } from "react";
import { useThor } from "../state/thor";

type Bolt = { id: number; x: number; y: number; r: number; s: number; born: number };

export default function StormFX() {
  const { on } = useThor();
  const [bolts, setBolts] = useState<Bolt[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!on) { setBolts([]); return; }

    function spawn() {
      const n = 2 + Math.floor(Math.random() * 4); // 2–5 bolts
      const now = performance.now();
      setBolts((prev) => [
        ...prev,
        ...Array.from({ length: n }).map(() => ({
          id: ++idRef.current,
          x: Math.random() * 100,
          y: Math.random() * 100,
          r: (Math.random() - 0.5) * 40,
          s: 0.8 + Math.random() * 1.4,
          born: now,
        })),
      ]);
      // cleanup after ~900ms
      setTimeout(() => {
        const cutoff = performance.now() - 900;
        setBolts((prev) => prev.filter((b) => b.born > cutoff));
      }, 950);
    }

    const onStrike = () => spawn();
    window.addEventListener("thor:strike", onStrike);
    return () => window.removeEventListener("thor:strike", onStrike);
  }, [on]);

  if (!on) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[35] mix-blend-screen"
      style={{ contain: "layout paint size" }}
    >
      {/* soft flash wash per cycle */}
      <div className="absolute inset-0 animate-[stormFlash_600ms_ease-out]" />
      {bolts.map((b) => (
        <span
          key={b.id}
          className="absolute h-px animate-[bolt_520ms_cubic-bezier(.23,1,.32,1)]"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${180 * b.s}px`,
            transform: `rotate(${b.r}deg) translateX(-50%)`,
            background:
              "linear-gradient(90deg, rgba(255,255,255,.05) 0%, rgba(91,206,255,.9) 20%, rgba(255,255,255,1) 50%, rgba(121,210,255,.8) 80%, rgba(255,255,255,.05) 100%)",
            boxShadow:
              "0 0 12px 2px rgba(150,220,255,.75), 0 0 32px 8px rgba(120,200,255,.25)",
          }}
        />
      ))}

      <style>{`
        @keyframes stormFlash {
          0% { background: rgba(255,255,255,0.00); }
          5% { background: rgba(255,255,255,0.05); }
          15% { background: rgba(255,255,255,0.12); }
          100% { background: rgba(255,255,255,0.00); }
        }
        @keyframes bolt {
          0%   { opacity: 0; filter: blur(.5px); }
          10%  { opacity: 1; filter: blur(0); }
          100% { opacity: 0; filter: blur(1px); }
        }
      `}</style>
    </div>
  );
}
