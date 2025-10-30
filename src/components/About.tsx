import Section from "./Section";
import Title from "./Title";

const MILESTONES = [
  {
    year: "2025",
    title: "VectorOps control center",
    blurb: "Shipped a realtime analytics cockpit with collaborative motion and audio cues.",
  },
  {
    year: "2024",
    title: "Design systems partner",
    blurb: "Guided product teams on tokens, accessibility, and multi-brand UI kits shipping to production.",
  },
  {
    year: "2023",
    title: "Brand-to-code bridge",
    blurb: "Led boutique builds translating art direction into performant, animated frontends.",
  },
] as const;

const VALUES = [
  {
    label: "Design strategy",
    detail: "Translate brand tone into scalable tokens, responsive grids, and purposeful motion.",
  },
  {
    label: "Performance-first",
    detail: "Vitally fast: code-splitting, edge rendering, streaming data, and observability.",
  },
  {
    label: "Inclusive UX",
    detail: "WCAG-aware components, keyboard flows, dark/light parity, and semantic storytelling.",
  },
  {
    label: "Delivery rhythm",
    detail: "Sprint-ready rituals, crisp documentation, and collaboration that lifts the whole team.",
  },
] as const;

const METRICS = [
  { label: "Avg. Lighthouse", value: "96+" },
  { label: "Collab score", value: "17 happy teams" },
  { label: "Turnaround", value: "2 - 4 weeks" },
  { label: "Thor toggles", value: "Countless toggles" },
] as const;

export default function About() {
  return (
    <Section id="about" label="About">
      <Title className="reveal"
        eyebrow="Overview"
        description="A design-engineering partner who brings clarity, motion, and Marvel-grade delight to every product collaboration."
      >
        Designing with intention. Shipping with precision.
      </Title>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:gap-12">
        <article className="card space-y-8">
          <header>
            <h3 className="text-xl font-semibold" style={{ color: "rgb(var(--color-ink))" }}>
              Creative ethos
            </h3>
            <p className="mt-2 text-base leading-7" style={{ color: "rgb(var(--color-muted) / 0.82)" }}>
              I balance cinematic storytelling with disciplined systems thinking. Every component earns its place,
              every animation has a narrative role, and every build is ready for scale in dark or light, Thor on or off.
            </p>
          </header>

          <div className="grid gap-5 sm:grid-cols-2">
            {VALUES.map((value) => (
              <div key={value.label} className="glass-tile rounded-2xl space-y-2 p-4">
                <p className="text-sm font-semibold" style={{ color: "rgb(var(--color-ink))" }}>
                  {value.label}
                </p>
                <p className="text-sm leading-6" style={{ color: "rgb(var(--color-muted) / 0.8)" }}>
                  {value.detail}
                </p>
              </div>
            ))}
          </div>
        </article>

        <aside className="grid gap-7">
          <div className="card space-y-5">
            <h3 className="text-lg font-semibold" style={{ color: "rgb(var(--color-ink))" }}>
              Recent milestones
            </h3>
            <ol className="space-y-4">
              {MILESTONES.map((item) => (
                <li key={item.year} className="relative pl-5">
                  <span
                    className="absolute left-0 top-1 block h-2 w-2 rounded-full bg-gradient-to-tr from-[rgb(var(--color-accent))] to-[rgb(var(--color-accent-2))]"
                    aria-hidden="true"
                  />
                  <p className="text-xs uppercase tracking-[0.28em]" style={{ color: "rgb(var(--color-muted) / 0.6)" }}>
                    {item.year}
                  </p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: "rgb(var(--color-ink))" }}>
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6" style={{ color: "rgb(var(--color-muted) / 0.78)" }}>
                    {item.blurb}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="glass-tile rounded-2xl space-y-4 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em]" style={{ color: "rgb(var(--color-muted) / 0.7)" }}>
              Collaboration style
            </h3>
            <p className="text-base leading-7" style={{ color: "rgb(var(--color-muted) / 0.85)" }}>
              Weekly design/engineering rituals, async Looms, Figma-to-code bridges, and a shared obsession with details.
            </p>
            <p className="text-sm" style={{ color: "rgb(var(--color-muted) / 0.7)" }}>
              Tools I love: Linear, FigJam, Storybook, Playwright, Supabase, Midjourney, and Marvel lore.
            </p>
          </div>
        </aside>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {METRICS.map((metric) => (
          <div
            key={metric.label}
            className="glass-tile rounded-2xl px-5 py-6"
            style={{ borderColor: "rgb(var(--color-border-strong) / 0.18)" }}
          >
            <p className="text-xs uppercase tracking-[0.26em]" style={{ color: "rgb(var(--color-muted) / 0.6)" }}>
              {metric.label}
            </p>
            <p className="mt-2 text-xl font-semibold" style={{ color: "rgb(var(--color-ink))" }}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}

