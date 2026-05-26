/**
 * Static section copy for the home page. Lives here as the canonical source;
 * Supabase `site_content` overlay in M4 will optionally override per key.
 */

export const HERO = {
  eyebrow: "Full-Stack & AI Engineer",
  headline: "Full-stack engineering, AI-augmented.",
  subhead:
    "I design and ship modern web apps and live AI features end-to-end — Next.js, Supabase, Vercel AI Gateway. Currently building Lumen, an Apple-Liquid-Glass movie discovery experience.",
  ctaPrimary: { label: "See Lumen", href: "/projects/lumen" },
  ctaSecondary: { label: "Get in touch", href: "#contact" },
} as const;

export const ABOUT = {
  eyebrow: "About",
  title: "Build, integrate, ship.",
  body:
    "I'm Dor Ben Tzur, a self-motivated full-stack engineer in Rehovot. I work end-to-end on modern web apps — architecture, schema, server, UI, deploy — and integrate generative AI features (RAG, agents, structured output) as a first-class part of the product. My daily loop runs on Next.js, Supabase, and AI-augmented development with Claude and Gemini.",
  highlights: [
    {
      title: "Modern architecture",
      body: "Server Components, Server Actions, Cache Components, edge-aware rendering. Apple Liquid Glass design language.",
    },
    {
      title: "AI as a first-class feature",
      body: "RAG over content, smart recommenders, streaming chat, live playground demos — backed by the Vercel AI Gateway.",
    },
    {
      title: "End-to-end shipping",
      body: "From DB schema and RLS policies through to a11y-passing, Lighthouse-95+ public surfaces. Solo or in a team.",
    },
  ],
} as const;

export const CONTACT = {
  eyebrow: "Contact",
  title: "Let's build something.",
  body:
    "Hiring? Collaborating? Curious about a project? Drop a line. I read everything and reply quickly.",
  emailLabel: "Or just email me at",
  emailValue: "dbtzur@gmail.com",
} as const;
