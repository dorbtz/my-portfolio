import Section from "./Section";
import Title from "./Title";

type Skill = {
  name: string;
  level: number;
  note: string;
};

const SKILLS: Skill[] = [
  {
    name: "React",
    level: 92,
    note: "Server components, streaming Suspense data, custom hooks, and micro-interactions that feel native.",
  },
  {
    name: "TypeScript",
    level: 90,
    note: "Type-safe APIs, discriminated unions, generics for hooks, and Zod-powered runtime validation.",
  },
  {
    name: "Tailwind",
    level: 94,
    note: "Design tokens, deeply themed systems, and Tailwind v4 primitives backing component libraries.",
  },
  {
    name: "Vite",
    level: 86,
    note: "SSR/SSG pipelines, plugin authoring, instant HMR, and edge-ready deployments.",
  },
  {
    name: "Playwright",
    level: 74,
    note: "Visual regression suites, accessibility assertions, and CI smoke tests that guard UX polish.",
  },
  {
    name: "Node",
    level: 78,
    note: "API routes, edge middleware, streaming functions, and observability instrumentation.",
  },
] as const;

export default function Skills() {
  return (
    <Section id="skills" label="Skills">
      <Title
        className="reveal"
        eyebrow="Capabilities"
        description="Engineering depth and design intuition working together from concept to iteration to launch."
      >
        Multidisciplinary craft, ready to ship.
      </Title>

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {SKILLS.map((skill) => (
          <article key={skill.name} className="card skill-card">
            <header className="skill-card__header">
              <h3 className="skill-card__title">{skill.name}</h3>
            </header>

            <div className="skill-card__progress" aria-hidden="true">
              <div className="skill-card__track">
                <div
                  className="skill-card__gauge"
                  style={{ width: `${skill.level}%` }}
                />
              </div>
              <span className="skill-card__value">{skill.level}%</span>
            </div>

            <p className="skill-card__note">{skill.note}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

