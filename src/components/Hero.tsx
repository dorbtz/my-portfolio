import { useEffect, useMemo, useRef, useState } from "react";
import Section from "./Section";
import ModelViewer from "./ModelViewer";
import { useThor } from "../state/thor";
import { listProjects } from "../services/projects";
import { projectFixtures } from "../data/project-fixtures";
import type { Project } from "../types/project";

const TITLES = [
  "design engineering",
  "interaction choreography",
  "Thor-inspired storytelling",
  "AI-accelerated workflows",
] as const;

const HIGHLIGHTS = [
  {
    label: "Specialty",
    value: "Design systems",
    detail: "Tokens, inclusive motion, and delightful interactions.",
  },
  {
    label: "Stack",
    value: "React + Vite + TS",
    detail: "Edge-ready builds with DX joy and performance budgets.",
  },
  {
    label: "Availability",
    value: "Q1 2026",
    detail: "Remote + Tel Aviv collaborations, product or brand-led.",
  },
] as const;

export default function Hero() {
  const haloRef = useRef<HTMLDivElement>(null);
  const [titleIndex, setTitleIndex] = useState(0);
  const [latestProject, setLatestProject] = useState<Project | null>(() => selectLatest(projectFixtures));
  const { on: thorOn } = useThor();

  useEffect(() => {
    const id = window.setInterval(
      () => setTitleIndex((index) => (index + 1) % TITLES.length),
      3200
    );
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const projects = await listProjects();
        if (!cancelled && projects.length) {
          setLatestProject(selectLatest(projects));
        }
      } catch (error) {
        console.warn("[Hero] Using fixture data for latest project", error);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const halo = haloRef.current;
    if (!halo) return;

    const handlePointer = (event: PointerEvent) => {
      const x = ((event.clientX / window.innerWidth) - 0.5) * 40;
      const y = ((event.clientY / window.innerHeight) - 0.5) * 24;
      halo.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    window.addEventListener("pointermove", handlePointer);
    return () => window.removeEventListener("pointermove", handlePointer);
  }, []);

  const quickStats = useMemo(() => {
    const latestDetail = latestProject?.summary?.trim() || latestProject?.description?.trim();
    const latestLink = latestProject?.slug ? `/projects/${latestProject.slug}` : undefined;
    const items = [
      {
        label: "Latest drop",
        value: latestProject?.title ?? "Coming soon",
        detail: latestDetail ?? "Fresh work is in production. Stay tuned.",
        href: latestLink,
      },
      {
        label: "Thor mode",
        value: thorOn ? "Engaged" : "Standby",
        detail: thorOn
          ? "Storm FX are live. Keep exploring."
          : "Toggle storm mode in the header for weather.",
      },
    ];
    return items;
  }, [latestProject, thorOn]);

  return (
    <Section
      id="hero"
      label="Hero"
      className="relative overflow-hidden pt-[calc(var(--hdr-h)+3.5rem)] lg:pt-[calc(var(--hdr-h)+5rem)]"
    >
      <div className="absolute inset-x-0 -top-24 -z-20 flex justify-center">
        <div className="h-[520px] w-[520px] rounded-full bg-gradient-to-br from-[rgb(var(--color-accent)/0.35)] via-[rgb(var(--color-accent-2)/0.28)] to-transparent blur-[140px]" />
      </div>
      <div
        ref={haloRef}
        className="pointer-events-none absolute right-[8%] top-[12%] -z-10 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-[rgb(var(--color-highlight)/0.55)] to-transparent opacity-80 blur-[110px]"
      />

      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] xl:gap-20">
        <div className="reveal flex flex-col gap-6 lg:gap-8">
          <span className="eyebrow">Digital Product Engineer</span>
          <h1 className="max-w-2xl text-[clamp(2.8rem,5vw+1rem,4.8rem)] font-semibold leading-[1.05] tracking-[-0.04em]">
            Crafting <span className="gradient-text">Apple-level polish</span> for bold digital brands.
          </h1>
          <p
            className="max-w-xl text-lg leading-7 sm:text-xl sm:leading-8"
            style={{ color: "rgb(var(--color-muted) / 0.8)" }}
          >
            I blend cinematic motion, purposeful storytelling, and rock-solid engineering so every interaction feels inevitable.
            Right now I'm deep into{" "}
            <span className="font-medium" style={{ color: "rgb(var(--color-ink))" }}>
              {TITLES[titleIndex]}
            </span>{" "}
            to push the web beyond templates.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a href="/#projects" className="btn btn-primary" data-thor-hover>
              View projects
            </a>
            <a href="/#about" className="btn btn-outline" data-thor-hover>
              Discover my approach
            </a>
          </div>

          <div className="grid gap-4 pt-2 sm:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <div key={item.label} className="glass-tile rounded-2xl space-y-2">
                <span
                  className="text-xs uppercase tracking-[0.26em]"
                  style={{ color: "rgb(var(--color-muted) / 0.65)" }}
                >
                  {item.label}
                </span>
                <p className="text-lg font-semibold" style={{ color: "rgb(var(--color-ink))" }}>
                  {item.value}
                </p>
                <p className="text-sm leading-5" style={{ color: "rgb(var(--color-muted) / 0.8)" }}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="reveal relative mx-auto flex w-full max-w-[540px] flex-col items-center">
          <div className="absolute -inset-10 -z-10 rounded-[40px] bg-gradient-to-br from-[rgb(var(--color-accent)/0.18)] via-transparent to-[rgb(var(--color-accent-2)/0.25)] blur-3xl" />
          <div className="card w-full overflow-hidden pb-8 pt-[3.5rem]">
            <div
              className="absolute left-1/2 top-[-28px] flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em]"
              style={{ borderColor: "rgb(var(--color-border-strong) / 0.24)", background: "rgb(var(--color-bg-soft) / 0.6)" }}
            >
              <span>Spotlight</span>
            </div>
            <ModelViewer
              src="/assets/thor-hammer.glb"
              alt="Thor hammer floating in spotlight"
              autoRotate
              autoRotateDelay={1600}
              cameraControls
              exposure={1.12}
              shadowIntensity={1.35}
              
              toneMapping="agx"
              interactionPrompt="none"
              className="h-[420px] w-full rounded-[28px]"
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {quickStats.map((stat) => (
                <div key={stat.label} className="glass-tile rounded-2xl">
                  <p
                    className="text-xs uppercase tracking-[0.26em]"
                    style={{ color: "rgb(var(--color-muted) / 0.65)" }}
                  >
                    {stat.label}
                  </p>
                  {stat.href ? (
                    <a
                      href={stat.href}
                      className="mt-2 inline-flex items-center gap-1 text-base font-semibold text-[rgb(var(--color-highlight))]"
                      data-thor-hover
                    >
                      {stat.value}
                      <span aria-hidden>→</span>
                    </a>
                  ) : (
                    <p className="mt-2 text-base font-semibold" style={{ color: "rgb(var(--color-ink))" }}>
                      {stat.value}
                    </p>
                  )}
                  <p className="mt-1 text-xs leading-5" style={{ color: "rgb(var(--color-muted) / 0.75)" }}>
                    {stat.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function selectLatest(projects: Project[]): Project | null {
  if (!projects.length) return null;
  return [...projects]
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const safeA = Number.isFinite(aTime) ? aTime : 0;
      const safeB = Number.isFinite(bTime) ? bTime : 0;
      return safeB - safeA;
    })[0] ?? null;
}



