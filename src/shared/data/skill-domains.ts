/**
 * Skill domain data — shared between the Thor mode Yggdrasil tree and
 * the Luffy mode Grand Line map. Same 9 domains, each carrying both a
 * Norse realm + a One Piece island label so the two visualizations
 * read the same data with zero duplication.
 *
 * Ported verbatim from v1 (legacy/src/features/skills/data/skills.ts).
 * Brand names + tech labels stay EN — pinned by the HE translator glossary.
 */

export type SkillLeaf = {
  name: string;
  proficiency: number;
  description: string;
};

export type SkillDomain = {
  name: string;
  realm: string;
  island: string;
  gear: "Base" | "Gear 2" | "Gear 3" | "Gear 4" | "Gear 5";
  color: string;
  lore: string;
  children: SkillLeaf[];
};

export const SKILL_DOMAINS: readonly SkillDomain[] = [
  {
    name: "3D / WebGL / Shaders",
    realm: "Vanaheim",
    island: "Whiskey Peak",
    gear: "Base",
    color: "#34d399",
    lore: "Cactus-shaped Baroque-Works waystation — a trap for new pirates.",
    children: [
      { name: "React Three Fiber", proficiency: 84, description: "Declarative 3D scenes." },
      { name: "GLSL Shaders", proficiency: 80, description: "Voronoi lightning, bloom, custom postprocessing." },
      { name: "drei / postprocessing", proficiency: 82, description: "Bloom, GodRays, ChromaticAberration." },
      { name: "GLB pipeline", proficiency: 78, description: "Draco + Meshopt + KTX2 — 50MB → 5MB." },
    ],
  },
  {
    name: "Backend / APIs",
    realm: "Jotunheim",
    island: "Little Garden",
    gear: "Base",
    color: "#a78bfa",
    lore: "Prehistoric jungle frozen in time — home of giants Brogy and Dorry.",
    children: [
      { name: "Node.js", proficiency: 90, description: "Streaming, edge runtimes, queues." },
      { name: "Supabase", proficiency: 92, description: "RLS, Edge Functions, Realtime, Auth." },
      { name: "REST + RPC", proficiency: 88, description: "Type-safe APIs end-to-end." },
      { name: "Edge Functions", proficiency: 85, description: "Sub-50ms cold starts." },
    ],
  },
  {
    name: "Product Strategy",
    realm: "Svartalfheim",
    island: "Drum Island",
    gear: "Base",
    color: "#c084fc",
    lore: "Snowy island of the Drum Castle — where Chopper joined the crew.",
    children: [
      { name: "Discovery → MVP", proficiency: 84, description: "Validate before building." },
      { name: "Shipping cadence", proficiency: 86, description: "Weekly releases, feature flags." },
      { name: "Metrics & A/B", proficiency: 78, description: "Decide with data, mostly." },
      { name: "Stakeholder craft", proficiency: 82, description: "Translate business ↔ engineering." },
    ],
  },
  {
    name: "Databases",
    realm: "Niflheim",
    island: "Alabasta",
    gear: "Base",
    color: "#6ee7b7",
    lore: "Desert kingdom of Alubarna — Vivi's homeland.",
    children: [
      { name: "PostgreSQL", proficiency: 88, description: "RLS, partial indexes, partitioning." },
      { name: "pgvector", proficiency: 86, description: "Hybrid search: BM25 + cosine." },
      { name: "Redis", proficiency: 78, description: "Caching, queues, pub/sub." },
      { name: "Migrations & RLS", proficiency: 84, description: "Zero-downtime schema changes." },
    ],
  },
  {
    name: "DevOps / Cloud",
    realm: "Helheim",
    island: "Jaya",
    gear: "Base",
    color: "#f87171",
    lore: "Mock Town — and the knock-up stream to Skypiea.",
    children: [
      { name: "Vercel", proficiency: 86, description: "ISR, edge config, preview envs." },
      { name: "AWS", proficiency: 78, description: "S3, Lambda, CloudFront, IAM." },
      { name: "GitHub Actions", proficiency: 84, description: "CI/CD, matrix builds, OIDC." },
      { name: "Docker", proficiency: 76, description: "Multi-stage builds, slim images." },
    ],
  },
  {
    name: "Design Systems",
    realm: "Alfheim",
    island: "Skypiea",
    gear: "Base",
    color: "#fbbf24",
    lore: "Sky island in the clouds — Shandora ruins, Ohm's gold bell.",
    children: [
      { name: "Tokens & theming", proficiency: 92, description: "Mode-switchable palettes." },
      { name: "Accessibility (WCAG 2.2)", proficiency: 90, description: "Focus traps, ARIA, motion preferences." },
      { name: "Component libraries", proficiency: 88, description: "Headless, composable, fully typed." },
      { name: "Figma → Code", proficiency: 80, description: "Design tokens pipeline." },
    ],
  },
  {
    name: "Performance",
    realm: "Muspelheim",
    island: "Water 7",
    gear: "Base",
    color: "#fb923c",
    lore: "City of canals — where the Going Merry retired and the Sunny was born.",
    children: [
      { name: "Core Web Vitals", proficiency: 92, description: "LCP < 2.5s, INP < 200ms." },
      { name: "Bundle audit", proficiency: 90, description: "Tree-shake everything, sub-300KB main." },
      { name: "Image pipeline", proficiency: 86, description: "AVIF + WebP + blur placeholders." },
      { name: "Profiling (INP)", proficiency: 88, description: "Long-task hunting, web workers." },
    ],
  },
  {
    name: "TypeScript / React",
    realm: "Midgard",
    island: "Thriller Bark",
    gear: "Gear 3",
    color: "#76cfff",
    lore: "Giant haunted ship-island of Gecko Moria — where Brook joined the crew.",
    children: [
      { name: "React 19", proficiency: 95, description: "Server components, streaming Suspense." },
      { name: "TypeScript", proficiency: 94, description: "Generics, branded types, conditional inference." },
      { name: "Next.js 16", proficiency: 90, description: "App router, RSC, server actions, Turbopack." },
      { name: "Tailwind v4", proficiency: 94, description: "Tokens in CSS, layered design systems." },
    ],
  },
  {
    name: "AI / LLM Apps",
    realm: "Asgard",
    island: "Sabaody",
    gear: "Gear 3",
    color: "#ffd700",
    lore: "Mangrove archipelago of bubble-coated trees — last stop before Fishman Island.",
    children: [
      { name: "Vercel AI Gateway", proficiency: 92, description: "Multi-provider routing, observability." },
      { name: "RAG pipelines", proficiency: 92, description: "Embeddings + pgvector + cosine retrieval." },
      { name: "Agents & tool-use", proficiency: 90, description: "Autonomous LLM crews with clear plans." },
      { name: "Evals & observability", proficiency: 88, description: "Catch hallucinations before prod." },
      { name: "Gemini · Claude", proficiency: 95, description: "Daily-driver LLMs in the dev loop." },
    ],
  },
] as const;

/** Star positions on YGGDRASIL.png — indexed parallel to SKILL_DOMAINS.
 *  Tuned for the 16:10 PNG; expressed as % so they scale with the container. */
export type StarPos = { x: number; y: number; tier: "top" | "mid" | "root" };

export const REALM_STARS: readonly StarPos[] = [
  { x: 26, y: 30, tier: "top" },  // Vanaheim
  { x: 30, y: 56, tier: "mid" },  // Jotunheim
  { x: 70, y: 56, tier: "mid" },  // Svartalfheim
  { x: 32, y: 78, tier: "root" }, // Niflheim
  { x: 68, y: 78, tier: "root" }, // Helheim
  { x: 73, y: 30, tier: "top" },  // Alfheim
  { x: 50, y: 86, tier: "root" }, // Muspelheim
  { x: 50, y: 56, tier: "mid" },  // Midgard
  { x: 50, y: 22, tier: "top" },  // Asgard
];

/** Filenames in public/assets/One-Piece/islands/ — indexed parallel to SKILL_DOMAINS. */
export const ISLAND_FILES: readonly string[] = [
  "whiskey-peak",
  "little-garden",
  "drum-island",
  "alabasta",
  "jaya",
  "skypiea",
  "water-7",
  "thriller-bark",
  "sabaody",
];

/** Positions along the Grand Line spiral — % coords inside a 16:9 container. */
export const ISLAND_POSITIONS: readonly { x: number; y: number }[] = [
  { x: 12, y: 70 }, // Whiskey Peak
  { x: 22, y: 38 }, // Little Garden
  { x: 32, y: 72 }, // Drum Island
  { x: 42, y: 35 }, // Alabasta
  { x: 50, y: 78 }, // Jaya
  { x: 60, y: 20 }, // Skypiea
  { x: 70, y: 60 }, // Water 7
  { x: 80, y: 30 }, // Thriller Bark
  { x: 90, y: 65 }, // Sabaody
];
