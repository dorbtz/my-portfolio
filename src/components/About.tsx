import Section from "./Section";
import Title from "./Title";

export default function About() {
  return (
    <Section id="about">
      <Title id="about" eyebrow="About" align="left">About</Title>
      <p className="mt-4 opacity-80 max-w-3xl reveal">
        I build responsive, accessible, and fast UIs. I love interaction design and tasteful motion—
        and yes, I’m a Marvel fan with a soft spot for Thor’s worldbuilding and visuals.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="card reveal">
          <h3 className="font-semibold">Highlights</h3>
          <ul className="mt-3 space-y-2 opacity-80">
            <li>Performance-first: code-splitting, prefetch, content-visibility.</li>
            <li>DX & quality: TypeScript, tests, CI/CD, a11y checks.</li>
            <li>Design sense: tokens, responsive systems, micro-interactions.</li>
          </ul>
        </div>

        <div className="card reveal">
          <h3 className="font-semibold">Journey</h3>
          <ul className="mt-3 space-y-2 opacity-80 text-sm">
            <li><b>2025</b> — Built this portfolio (Tailwind v4, React, tokens, print-ready resume).</li>
            <li><b>2024</b> — Shipped multiple apps with React/TS + perf budgets.</li>
            <li><b>2023</b> — Design systems work: component library; docs + a11y rules.</li>
          </ul>
        </div>
      </div>
    </Section>
  );
}
