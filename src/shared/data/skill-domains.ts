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

/**
 * Positions on WORLDMAP.jpeg (4096 × 2085, ~2:1) — % coords.
 *
 *   East Blue (top-right quadrant): Dawn Island origin
 *   Paradise (Grand Line band, RIGHT of Red Line, going east → west toward
 *      the Red Line): 9 visited skill islands
 *   Red Line (vertical center): Mariejois on top, Fishman Island under it
 *   New World (Grand Line band, LEFT of Red Line, going east):
 *      Fishman → ... → Elbaph (current) → Laugh Tale (future)
 *
 * Coordinates eyeballed from the canon map's painted islands.  Nudge in
 * here if any marker lands clearly off-island — both halves live here.
 */
export const ISLAND_POSITIONS: readonly { x: number; y: number }[] = [
  // Paradise — eastern entry near Reverse Mountain, working west toward Red Line
  { x: 60, y: 48 }, // 0 Whiskey Peak — first Paradise island, east end
  { x: 64, y: 51 }, // 1 Little Garden
  { x: 68, y: 52 }, // 2 Drum Island
  { x: 72, y: 53 }, // 3 Alabasta
  { x: 76, y: 54 }, // 4 Jaya
  { x: 76, y: 46 }, // 5 Skypiea — sky island ABOVE Jaya (knock-up stream)
  { x: 80, y: 53 }, // 6 Water 7
  { x: 84, y: 52 }, // 7 Thriller Bark
  { x: 88, y: 51 }, // 8 Sabaody — foot of Red Line on the Paradise side
];

// ============================================================
// FUTURE — Marvel realms + One Piece islands reserved for next dossiers
// ============================================================

export type FutureRealm = {
  realm: string;
  tier: "Bifrost" | "Mystic" | "Cosmic" | "Quantum" | "Multiversal";
  color: string;
  hint: string;
  lore: string;
};

export const FUTURE_REALMS: readonly FutureRealm[] = [
  {
    realm: "Wakanda",
    tier: "Bifrost",
    color: "#76cfff",
    hint: "Reserved for the next dossier",
    lore: "Vibranium-rich nation — T'Challa's kingdom and Earth's tech vanguard.",
  },
  {
    realm: "Sanctum Sanctorum",
    tier: "Mystic",
    color: "#c084fc",
    hint: "Reserved for the next dossier",
    lore: "Doctor Strange's mystic stronghold — Earth's primary magical defense.",
  },
  {
    realm: "Vormir",
    tier: "Mystic",
    color: "#c084fc",
    hint: "Reserved for the next dossier",
    lore: "Soul-Stone keeper's realm — a soul for a soul.",
  },
  {
    realm: "Knowhere",
    tier: "Cosmic",
    color: "#ffd700",
    hint: "Reserved for the next dossier",
    lore: "Mining colony inside a Celestial's severed head — Guardians' base.",
  },
  {
    realm: "Sakaar",
    tier: "Cosmic",
    color: "#ffd700",
    hint: "Reserved for the next dossier",
    lore: "Junk planet of the Grandmaster — arena where Hulk reigned.",
  },
  {
    realm: "Titan",
    tier: "Cosmic",
    color: "#ffd700",
    hint: "Reserved for the next dossier",
    lore: "Thanos' devastated homeworld — site of the Strange / Stark stand.",
  },
  {
    realm: "Quantum Realm",
    tier: "Quantum",
    color: "#34d399",
    hint: "Reserved for the next dossier",
    lore: "Subatomic dimension where time and space lose meaning — Kang's prison.",
  },
  {
    realm: "Battleworld",
    tier: "Multiversal",
    color: "#ff6bd6",
    hint: "Reserved for the next dossier",
    lore: "Patchwork of universes assembled by the Beyonder during Secret Wars.",
  },
  {
    realm: "Eternity",
    tier: "Multiversal",
    color: "#ff6bd6",
    hint: "The legendary final realm",
    lore: "The cosmic embodiment of all reality — endgame of any cosmic-tier journey.",
  },
];

export const FUTURE_REALM_STARS: readonly StarPos[] = [
  { x: 14, y: 22, tier: "top" }, // Wakanda — far-left upper canopy
  { x: 18, y: 42, tier: "mid" }, // Sanctum — left outer branch
  { x: 10, y: 60, tier: "mid" }, // Vormir — far-left lower branch
  { x: 86, y: 22, tier: "top" }, // Knowhere — far-right upper canopy
  { x: 82, y: 42, tier: "mid" }, // Sakaar — right outer branch
  { x: 90, y: 60, tier: "mid" }, // Titan — far-right lower branch
  { x: 38, y: 12, tier: "top" }, // Quantum — left sky
  { x: 50, y: 6,  tier: "top" }, // Battleworld — sky peak
  { x: 62, y: 12, tier: "top" }, // Eternity — right sky
];

/**
 * Post-Paradise islands. Status reflects canon as of the current arc:
 *   visited : Fishman Island → Wano Country + Egghead (already crossed)
 *   current : Elbaph (the arc the manga is in right now)
 *   future  : Laugh Tale (the legendary final island, alone)
 */
export type IslandStatus = "visited" | "current" | "future";

export type FutureIsland = {
  island: string;
  file: string; // filename in /assets/One-Piece/islands/
  gear: "Gear 3" | "Gear 4" | "Gear 5";
  color: string;
  status: IslandStatus;
  hint: string;
  lore: string;
};

export const FUTURE_ISLANDS: readonly FutureIsland[] = [
  {
    island: "Fishman Island",
    file: "fishman-island",
    gear: "Gear 3",
    color: "#76cfff",
    status: "visited",
    hint: "Crossing into the New World (canon-visited)",
    lore: "Underwater bubble city 10,000m below the Red Line — Jinbe's homeland.",
  },
  {
    island: "Punk Hazard",
    file: "punk-hazard",
    gear: "Gear 3",
    color: "#fb923c",
    status: "visited",
    hint: "Canon-visited (post-Paradise)",
    lore: "Fire-and-ice island of Caesar Clown's lab.",
  },
  {
    island: "Dressrosa",
    file: "dressrosa",
    gear: "Gear 4",
    color: "#f87171",
    status: "visited",
    hint: "Canon-visited (Gear 4 Boundman debut)",
    lore: "Doflamingo's SMILE factory kingdom — Gear 4 Boundman's debut.",
  },
  {
    island: "Zou",
    file: "zou",
    gear: "Gear 4",
    color: "#a78bfa",
    status: "visited",
    hint: "Canon-visited",
    lore: "Mokomo Dukedom on the back of the millennium-old elephant Zunesha.",
  },
  {
    island: "Whole Cake Island",
    file: "whole-cake-island",
    gear: "Gear 4",
    color: "#fbbf24",
    status: "visited",
    hint: "Canon-visited (Snakeman debut)",
    lore: "Big Mom's confectionery kingdom — Snakeman's debut.",
  },
  {
    island: "Wano Country",
    file: "wano-country",
    gear: "Gear 5",
    color: "#ffd700",
    status: "visited",
    hint: "Canon-visited (Gear 5 awakening)",
    lore: "Feudal samurai nation — site of Onigashima and Gear 5 awakening.",
  },
  {
    island: "Egghead",
    file: "egghead",
    gear: "Gear 5",
    color: "#34d399",
    status: "visited",
    hint: "Canon-visited",
    lore: "Vegapunk's futuristic egg-shaped lab island in the New World.",
  },
  {
    island: "Elbaph",
    file: "elbaph",
    gear: "Gear 5",
    color: "#ffc60b",
    status: "current",
    hint: "Current arc",
    lore: "Giant warrior nation under the colossal Elbaph World Tree — the Straw Hats are here now.",
  },
  {
    island: "Laugh Tale",
    file: "laugh-tale",
    gear: "Gear 5",
    color: "#ff6bd6",
    status: "future",
    hint: "The legendary final island",
    lore: "Roger laughed — and the One Piece waits.",
  },
];

/**
 * New World positions on WORLDMAP.jpeg — start at Fishman Island (under
 * Red Line, on the New World side which is the LEFT half of the map) and
 * flow west then loop back. Eyeballed from the canon yellow trail.
 */
export const FUTURE_ISLAND_POSITIONS: readonly { x: number; y: number }[] = [
  { x: 44, y: 56 }, // 0 Fishman Island   — under Red Line at center
  { x: 40, y: 53 }, // 1 Punk Hazard
  { x: 35, y: 52 }, // 2 Dressrosa
  { x: 30, y: 53 }, // 3 Zou
  { x: 25, y: 51 }, // 4 Whole Cake Island
  { x: 20, y: 52 }, // 5 Wano Country
  { x: 15, y: 51 }, // 6 Egghead
  { x: 9,  y: 49 }, // 7 Elbaph (current arc) — far-left New World
  { x: 4,  y: 51 }, // 8 Laugh Tale (future)
];

/** Dawn Island — Luffy's origin. Special: backstory sections, not skills. */
export type OriginIsland = {
  island: string;
  file: string;
  sub: string;
  lore: string;
  sections: { title: string; body: string }[];
  pos: { x: number; y: number };
};

export const DAWN_ISLAND: OriginIsland = {
  island: "Dawn Island",
  file: "dawn-island",
  sub: "East Blue · Foosha Village",
  lore: "East Blue. Foosha Village under Mt. Colubo — where the voyage began.",
  // East Blue quadrant on the WORLDMAP.jpeg — upper-right area, on the
  // pink Straw Hat journey trail through East Blue.
  pos: { x: 78, y: 25 },
  sections: [
    {
      title: "The Origin Code",
      body:
        "At seven, Luffy ate the cursed Gum-Gum Fruit Shanks brought ashore. The price: never swim again. The reward: a body that turns punches into recoil. Shanks left him the straw hat with one promise — bring it back when you've become a great pirate.",
    },
    {
      title: "The Primary Directive",
      body:
        "Find the One Piece. Become King of the Pirates — the freest person on the seas. Roger said it himself before the executioner's blade fell: my treasure waits, find it.",
    },
    {
      title: "The Awakening",
      body:
        "On Onigashima, against Kaido, the Gum-Gum Fruit revealed its real name: Hito Hito no Mi, Model Nika. The Sun God of liberation. Reality itself becomes elastic; freedom becomes a force.",
    },
  ],
};
