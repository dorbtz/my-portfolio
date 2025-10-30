import type { Project } from "../types/project";

const now = new Date();

export const projectFixtures: Project[] = [
  {
    id: "vectorops",
    slug: "vectorops",
    title: "VectorOps — Keyboard-First Tasking",
    subtitle: "Command palette meets timeline planning for high-output teams.",
    summary:
      "Raycast-style command palette with Kanban ↔ Timeline views, built for speed and clarity.",
    description:
      "VectorOps blends rich real-time planning with keyboard-first ergonomics. I led the product direction, built the Supabase-backed data layer, and delivered a motion-safe UI with <60ms interactions.",
    tags: ["product", "ux", "saas"],
    stack: ["React", "TypeScript", "Vite", "Supabase", "Tailwind CSS"],
    tech: ["React", "TypeScript", "Vite", "Supabase", "Tailwind CSS"],
    role: "Lead engineer & product designer",
    status: "shipped",
    priority: 3,
    sortOrder: 1,
    featured: true,
    liveUrl: "https://vectorops.vercel.app",
    repoUrl: "https://github.com/yourname/vectorops",
    coverUrl: "/assets/projects/vectorops.webp",
    gallery: [
      "/assets/projects/vectorops-board.webp",
      "/assets/projects/vectorops-timeline.webp",
    ],
    metrics: [
      { label: "MRR", value: "$18k" },
      { label: "Latency", value: "<60ms" },
    ],
    links: [
      { label: "Product Hunt", url: "https://www.producthunt.com/", icon: "launch" },
      { label: "Design deck", url: "https://example.com/vectorops-deck.pdf" },
    ],
    responsibilities: [
      "Product discovery & direction",
      "Data modelling & Supabase RLS",
      "Design system & motion language",
    ],
    outcomes: [
      "Team onboarded 200 beta users in 72h",
      "Task create-to-assign flow reduced to 3 keystrokes",
    ],
    heroVideoUrl: "https://player.vimeo.com/video/76979871",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 120).toISOString(),
    updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    heroImageAlt: "VectorOps dashboard with keyboard palette",
  },
  {
    id: "lobo-boutique-luxe",
    slug: "lobo-boutique-luxe",
    title: "Lobo Boutique Luxe — Shopify Theme",
    subtitle: "Luxury storefront with animated hero, swatches, VIP tiers, and marble-parallax integration.",
    summary:
      "Custom OS 2.0 storefront with premium merchandising, real-time inventory, and bespoke VIP flows.",
    description:
      "I delivered a premium Shopify experience for a DTC boutique, shipping responsive merchandising modules, backstage VIP membership flows, and delightful touches like parallax marble reveals and luxe typography.",
    tags: ["ecommerce", "brand", "theme"],
    stack: ["Shopify", "Liquid", "TypeScript", "Tailwind CSS"],
    tech: ["Shopify", "Liquid", "TypeScript", "Tailwind CSS"],
    role: "Frontend lead",
    status: "shipped",
    priority: 2,
    sortOrder: 2,
    featured: true,
    liveUrl: "https://thelobo.club",
    repoUrl: "https://github.com/yourname/lobo-boutique-luxe",
    coverUrl: "/assets/projects/lobo.webp",
    gallery: [
      "/assets/projects/lobo-home.webp",
      "/assets/projects/lobo-product.webp",
    ],
    metrics: [
      { label: "Conversion", value: "+28%" },
      { label: "AOV", value: "+19%" },
    ],
    links: [
      { label: "Live walkthrough", url: "https://example.com/lobo-walkthrough.mp4", icon: "video" },
      { label: "Style guide", url: "https://example.com/lobo-style.pdf" },
    ],
    responsibilities: [
      "Theme architecture & performance",
      "Headless customer tiers",
      "Interactive product visualisation",
    ],
    outcomes: [
      "Checkout drop-off reduced by 32%",
      "VIP tier adoption doubled within 3 weeks",
    ],
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 220).toISOString(),
    heroImageAlt: "Lobo Boutique Luxe storefront hero",
  },
  {
    id: "tasteworld",
    slug: "tasteworld",
    title: "TasteWorld — Social Recipes",
    subtitle: "Short-form food video platform with AI translation and recipe generation.",
    summary:
      "Explore, save, and cook with AI-assisted recipes across languages, communities, and cuisines.",
    description:
      "TasteWorld blends creation tools with AI translation to help food lovers share, translate, and cook recipes in real-time. I owned the mobile-first UX, collaborative playlisting, and Supabase data sync.",
    tags: ["consumer", "video", "ai"],
    stack: ["React", "TypeScript", "Supabase", "Tailwind CSS"],
    tech: ["React", "TypeScript", "Supabase", "Tailwind CSS"],
    role: "Founding engineer",
    status: "in-progress",
    priority: 1,
    sortOrder: 3,
    featured: false,
    liveUrl: undefined,
    repoUrl: "https://github.com/yourname/tasteworld",
    coverUrl: "/assets/projects/tasteworld.webp",
    gallery: [
      "/assets/projects/tasteworld-feed.webp",
      "/assets/projects/tasteworld-recipe.webp",
    ],
    metrics: [{ label: "Waitlist", value: "4.1k" }],
    links: [
      { label: "Prototype", url: "https://example.com/tasteworld-prototype", icon: "figma" },
    ],
    responsibilities: [
      "Realtime collaboration",
      "Internationalisation & AI workflows",
      "Creator analytics",
    ],
    outcomes: [
      "Waitlist conversion hit 38%",
      "Recipe publish cadence improved 3x",
    ],
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    heroImageAlt: "TasteWorld mobile feed",
  },
];
