import { useEffect, useRef, useState } from "react";
import { useThor } from "../state/thor";

type Point = { x: number; y: number };

type Bolt = {
  id: number;
  x: number; // vw
  y: number; // vh
  width: number;
  height: number;
  rotation: number;
  born: number;
  thickness: number;
  paths: Point[][];
};

const LIFETIME = 900;

function createBolt(id: number): Bolt {
  const width = 160 + Math.random() * 120;
  const height = 260 + Math.random() * 180;
  const segments = 5 + Math.floor(Math.random() * 4);
  const centerX = width / 2;
  const amplitude = width * 0.28;
  const thickness = 1.6 + Math.random() * 0.9;

  const mainPath: Point[] = [];
  for (let i = 0; i <= segments; i++) {
    const progress = i / segments;
    const wander = (Math.random() - 0.5) * amplitude;
    mainPath.push({
      x: centerX + wander,
      y: progress * height,
    });
  }

  const branchCount = Math.random() > 0.6 ? 2 : 1;
  const branches: Point[][] = [];

  for (let b = 0; b < branchCount; b++) {
    const startIndex = 1 + Math.floor(Math.random() * (segments - 2));
    const branchLength = height * (0.25 + Math.random() * 0.25);
    const branchSegments = 2 + Math.floor(Math.random() * 3);
    const direction = Math.random() > 0.5 ? 1 : -1;
    const start = mainPath[startIndex];

    const branch: Point[] = [{ ...start }];
    for (let i = 1; i <= branchSegments; i++) {
      const progress = i / branchSegments;
      branch.push({
        x: start.x + direction * (branchLength * 0.25) * progress + (Math.random() - 0.5) * 18,
        y: start.y + branchLength * progress,
      });
    }
    branches.push(branch);
  }

  return {
    id,
    x: Math.random() * 100,
    y: 10 + Math.random() * 60,
    width,
    height,
    rotation: (Math.random() - 0.5) * 18,
    born: performance.now(),
    thickness,
    paths: [mainPath, ...branches],
  };
}

export default function StormFX() {
  const { on } = useThor();
  const [bolts, setBolts] = useState<Bolt[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!on) {
      setBolts([]);
      return;
    }

    function spawn() {
      const count = 2 + Math.floor(Math.random() * 3);
      setBolts((prev) => [
        ...prev,
        ...Array.from({ length: count }, () => createBolt(++idRef.current)),
      ]);

      window.setTimeout(() => {
        const cutoff = performance.now() - LIFETIME;
        setBolts((prev) => prev.filter((bolt) => bolt.born > cutoff));
      }, LIFETIME + 40);
    }

    const onStrike = () => spawn();
    spawn();
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
      <div className="absolute inset-0 animate-[stormFlash_720ms_ease-out]" />
      {bolts.map((bolt) => {
        const gradientId = `bolt-gradient-${bolt.id}`;
        return (
          <svg
            key={bolt.id}
            viewBox={`0 0 ${bolt.width} ${bolt.height}`}
            className="absolute animate-[bolt_620ms_cubic-bezier(.18,.88,.32,1)]"
            style={{
              left: `${bolt.x}vw`,
              top: `${bolt.y}vh`,
              width: `${bolt.width}px`,
              height: `${bolt.height}px`,
              transform: `translate(-50%, -18%) rotate(${bolt.rotation}deg)`,
              filter:
                "drop-shadow(0 0 18px rgba(170,220,255,0.65)) drop-shadow(0 0 42px rgba(110,190,255,0.3))",
            }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                <stop offset="15%" stopColor="rgba(195,235,255,0.8)" />
                <stop offset="55%" stopColor="rgba(255,255,255,1)" />
                <stop offset="85%" stopColor="rgba(150,215,255,0.85)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            {bolt.paths.map((path, index) => (
              <polyline
                key={index}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth={(index === 0 ? bolt.thickness : bolt.thickness * 0.65) * 1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={index === 0 ? 1 : 0.8}
                points={path.map((point) => `${point.x},${point.y}`).join(" ")}
              />
            ))}
          </svg>
        );
      })}

      <style>{`
        @keyframes stormFlash {
          0% { background: rgba(255,255,255,0); }
          12% { background: rgba(180,220,255,0.18); }
          28% { background: rgba(110,160,255,0.12); }
          100% { background: rgba(255,255,255,0); }
        }
        @keyframes bolt {
          0%   { opacity: 0; filter: blur(1.5px); }
          16%  { opacity: 1; filter: blur(0.4px); }
          32%  { opacity: 0.65; filter: blur(0.8px); }
          48%  { opacity: 0.95; filter: blur(0.2px); }
          100% { opacity: 0; filter: blur(2px); }
        }
      `}</style>
    </div>
  );
}

