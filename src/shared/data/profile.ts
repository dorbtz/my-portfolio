/**
 * Canonical profile + resume content. Sourced from SPEC.md §7 (verbatim).
 * One source of truth — the /resume page renders this, the JSON-LD emits this,
 * the about section card pulls from this. Don't fork copy elsewhere.
 */
import type { EducationItem, EmploymentItem, MilitaryItem, Profile, SkillGroup } from "@/types/profile";

export const PROFILE: Profile = {
  name: "Dor Ben Tzur",
  email: "dbtzur@gmail.com",
  location: "Rehovot, Israel",
  linkedin: "https://www.linkedin.com/in/dorbtz/",
  github: "https://github.com/dorbtz",
  headline: "Full-Stack & AI Engineer",
  tagline:
    "Full-stack engineering, AI-augmented. I ship modern web apps and live AI features end-to-end.",
  bioShort:
    "Full-stack engineer in Rehovot. I build modern web apps and ship live AI features — Next.js, React, Supabase, Vercel AI Gateway.",
  bioLong:
    "I'm a self-motivated full-stack developer with a strong focus on modern web architecture, 3D interactive experiences, and AI-driven product features. I work end-to-end: design, schema, server, UI, deploy. My current stack of choice is Next.js 16, Supabase, and Vercel AI Gateway — and I use Claude and Gemini daily as part of my development loop.",
};

export const SKILL_GROUPS: readonly SkillGroup[] = [
  {
    id: "languages",
    label: "Languages",
    skills: [
      { name: "TypeScript" },
      { name: "Python" },
      { name: "JavaScript" },
      { name: "SQL" },
      { name: "HTML" },
      { name: "CSS" },
    ],
  },
  {
    id: "frontend",
    label: "Frontend",
    skills: [
      { name: "React 19" },
      { name: "Next.js 16" },
      { name: "Tailwind v4" },
      { name: "Three.js" },
      { name: "React Three Fiber" },
      { name: "Framer Motion" },
    ],
  },
  {
    id: "backend",
    label: "Backend & data",
    skills: [
      { name: "Node.js" },
      { name: "Supabase" },
      { name: "PostgreSQL" },
      { name: "REST APIs" },
      { name: "Server Actions" },
      { name: "pgvector" },
    ],
  },
  {
    id: "ai",
    label: "AI / ML",
    skills: [
      { name: "Vercel AI Gateway" },
      { name: "AI SDK v6" },
      { name: "RAG pipelines" },
      { name: "Prompt engineering" },
      { name: "AI agents" },
      { name: "Claude · Gemini" },
    ],
  },
  {
    id: "devops",
    label: "DevOps & tooling",
    skills: [
      { name: "Vercel" },
      { name: "Git / GitHub" },
      { name: "Docker" },
      { name: "CI/CD" },
      { name: "Claude Code" },
      { name: "MCP" },
    ],
  },
] as const;

export const EDUCATION: readonly EducationItem[] = [
  {
    title: "Advanced Generative AI & Modern Web Architecture",
    org: "Independent Study",
    period: "2024 – Present",
    bullets: [
      "AI Integration — Gemini, Claude, AI agent architecture, prompt engineering",
      "Modern frameworks — React Three Fiber, Three.js, Next.js, Tailwind, Supabase",
    ],
  },
  {
    title: "Full-Stack Web Development",
    org: "John Bryce, Tel-Aviv",
    period: "2021 – 2022",
    bullets: [
      "Languages — Python, JavaScript, TypeScript, HTML5, CSS3",
      "Stack — React, Node.js, REST APIs, Flask, Django",
      "Data — PostgreSQL, MongoDB, MySQL",
      "Tools — Git/GitHub, Docker",
    ],
  },
] as const;

export const EMPLOYMENT: readonly EmploymentItem[] = [
  {
    title: "Independent Full-Stack & AI Developer",
    org: "Self-Employed",
    period: "2024 – Present",
    bullets: [
      'Autonomous AI Architecture — Engineered an intelligent "AI Brain" system in Python with advanced prompt engineering to orchestrate purpose-built AI agents.',
      "3D Game Development — Architected and shipped Nebula-1, an interactive 3D sci-fi strategy browser game on React Three Fiber + Three.js.",
      "Full-Stack Platforms — Designed and deployed a custom-built portfolio on Next.js + Tailwind + Supabase with Vercel integration. (This site.)",
      "AI-Driven Development — Accelerated SDLC by integrating Gemini + Claude Code for rapid prototyping, debugging, and feature implementation.",
    ],
  },
  {
    title: "Deputy Branch Manager",
    org: "Wolt Market, Rehovot",
    period: "2023 – 2024",
    bullets: [
      "Managed daily operations and led a team to consistently exceed business KPIs.",
      "Optimized workflows and analyzed financial metrics to maximize branch profitability.",
      "Resolved complex customer-service and operational issues.",
    ],
  },
  {
    title: "Technical Support & Customer Service Representative",
    org: "Rehovot Municipality",
    period: "2021 – 2022",
    bullets: [
      "Delivered front-line technical support and problem resolution for city residents.",
      "Managed high-volume inquiry data via municipal CRM systems.",
    ],
  },
] as const;

export const MILITARY: readonly MilitaryItem[] = [
  {
    title: "Company Sergeant Major — Operations & Logistics Manager",
    org: "Israel Defense Forces (IDF)",
    period: "2015 – 2017",
    description:
      "Directed unit logistics and daily operations. Championed soldier welfare; built a disciplined and motivated team environment.",
  },
  {
    title: "Head of Office",
    org: "Israel Defense Forces (IDF)",
    period: "2014 – 2015",
    description:
      "Managed the comprehensive operations of a senior commanding officer's bureau — complex schedules, cross-functional meetings, strategic communications.",
  },
] as const;
