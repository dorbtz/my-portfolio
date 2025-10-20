// src/components/Skills.tsx
import { useState } from "react";
import Section from "./Section";
import Title from "./Title";

type Skill = {
  name: string;
  level: number;           // 0..100
  proof?: string | string[];
};

const SKILLS: Skill[] = [
  { name: "React", level: 90, proof: `// Proof
function useToggle(){
  const [v,set] = useState(false);
  return { v, on: () => set(true), off: () => set(false) }
}` },
  { name: "TypeScript", level: 88, proof: ["Type-safe props", "Generics for hooks", "Zod validation"] },
  { name: "Tailwind", level: 92, proof: ["Design tokens", "v4 migration", "Utility-first systems"] },
  { name: "Vite", level: 85 },
  { name: "Playwright", level: 70, proof: ["UI smoke tests", "Visual diffs", "CI run"] },
  { name: "Node", level: 75, proof: ["API routes", "SSR + edge", "Perf budgets"] },
];

export default function Skills() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <Section id="skills" className="section">
      <Title eyebrow="Skills">Skills</Title>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {SKILLS.map((s, idx) => (
          <article key={s.name} className="card skill-card">
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold text-xl">{s.name}</h3>
              <span className="opacity-75">{s.level}%</span>
            </div>

            <div className="mt-3 h-2 w-full rounded-full bg-[rgba(255,255,255,.08)] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent2"
                style={{ width: `${s.level}%` }}
              />
            </div>

            {/* Proof area — only show teaser + button; modal holds code/list */}
            {s.proof ? (
              <div className="mt-4">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setOpenIdx(idx)}
                >
                  Show proof
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {/* Modal — simple, keyboard friendly */}
      {openIdx !== null ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenIdx(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative max-w-2xl w-full card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-lg">{SKILLS[openIdx].name} — Proof</h4>
              <button className="btn btn-outline btn-sm" onClick={() => setOpenIdx(null)}>Close</button>
            </div>

            {/* Render proof intelligently */}
            <div className="proof-body">
              {Array.isArray(SKILLS[openIdx].proof) ? (
                <ul className="list-disc pl-5 space-y-1 opacity-90">
                  {SKILLS[openIdx].proof!.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              ) : (
                <pre className="code-block" aria-label="Code proof">
                  <code>{SKILLS[openIdx].proof}</code>
                </pre>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Section>
  );
}
