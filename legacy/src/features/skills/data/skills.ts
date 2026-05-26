/**
 * src/data/skills.ts
 * Skill domain data — used by SkillsTree.
 *
 * Each domain has parallel fandom metadata:
 *  - `realm`        → Yggdrasil / Norse cosmology label (used in Thor mode tree)
 *  - `island`       → One Piece location label (used in Luffy mode Grand Line map)
 *  - `gear`         → Luffy gear level (used in Luffy mode badges)
 *
 * Descriptions intentionally reference BOTH fandoms naturally — they read
 * well in either mode without per-mode overrides.
 */
export type SkillLeaf = {
  name: string;
  proficiency: number;
  description: string;
};

export type SkillDomain = {
  name: string;
  /** Norse / Asgardian realm — Thor mode (Yggdrasil tree). */
  realm: string;
  /** One Piece location — Luffy mode (Grand Line map). */
  island: string;
  /**
   * Luffy gear-level badge — Luffy mode tier indicator. Canonical chronology
   * across the manga / anime, used to label which gear Luffy was in at each
   * island arc:
   *   Base   — pre-Enies Lobby (Whiskey Peak through Water 7)
   *   Gear 2 — debuted Enies Lobby (Thriller Bark, Sabaody, Fishman Island, Punk Hazard)
   *   Gear 3 — also debuted Enies Lobby (same window as Gear 2)
   *   Gear 4 — Dressrosa onward (Boundman); Whole Cake Island adds Tankman + Snakeman
   *   Gear 5 — Wano Country awakening; current Egghead + Elbaph; Laugh Tale endgame
   */
  gear: 'Base' | 'Gear 2' | 'Gear 3' | 'Gear 4' | 'Gear 5';
  /** Accent color shared across both visualizations. */
  color: string;
  /** Canonical One Piece lore tagline — 1 sentence, used in Luffy mode map popup. */
  lore: string;
  children: SkillLeaf[];
};

// Skills are mapped to the FIRST 9 islands of the user's canonical 18-island
// One Piece voyage. As more skills get added in future portfolio passes, the
// next future island in `FUTURE_ISLANDS` (below) becomes a real SkillDomain.
//
// Gear chronology (canon, used both here and on the placeholder list):
//   Whiskey Peak → Water 7 (canon arcs ~67-322): Base form (Gear 2/3 debut at Enies Lobby AFTER Water 7)
//   Thriller Bark → Punk Hazard (post-Enies-Lobby through pre-Doflamingo): Gear 2/3
//   Dressrosa → Whole Cake Island: Gear 4 (Boundman debut at Dressrosa, Tankman/Snakeman at Whole Cake)
//   Wano Country → Laugh Tale: Gear 5 (Awakening debut at Wano)
export const SKILL_DOMAINS: SkillDomain[] = [
  {
    name: '3D / WebGL / Shaders',
    realm: 'Vanaheim',
    island: 'Whiskey Peak',
    gear: 'Base',
    color: '#34d399',
    lore: "Cactus-shaped Baroque-Works waystation — its night-time party a trap for new pirates.",
    children: [
      { name: 'React Three Fiber', proficiency: 84, description: 'Declarative 3D scenes — Asgard-grade visuals, Skypiea-grade clouds.' },
      { name: 'GLSL Shaders', proficiency: 80, description: 'Voronoi lightning, rubber-stretch swirls, bloom — Hito Hito no Mi for pixels.' },
      { name: 'drei / postprocessing', proficiency: 82, description: 'Bloom, GodRays, ChromaticAberration, AdaptiveDpr.' },
      { name: 'GLB pipeline', proficiency: 78, description: 'Draco + Meshopt + KTX2 — 50MB → 5MB, no quality loss. Compress like Brogy\'s shrink.' },
    ],
  },
  {
    name: 'Backend / APIs',
    realm: 'Jotunheim',
    island: 'Little Garden',
    gear: 'Base',
    color: '#a78bfa',
    lore: "Prehistoric jungle frozen in time — home of giant warriors Brogy and Dorry.",
    children: [
      { name: 'Node.js', proficiency: 90, description: 'Streaming, edge runtimes, RPC, queues — built on the Galley-La docks.' },
      { name: 'Supabase', proficiency: 92, description: 'RLS, Edge Functions, Realtime, Auth — full-stack speed.' },
      { name: 'REST + RPC + tRPC', proficiency: 88, description: 'Type-safe APIs end-to-end, zero codegen friction.' },
      { name: 'Edge Functions', proficiency: 85, description: 'Deno + Cloudflare Workers — sub-50ms cold starts. Faster than a Den Den Mushi call.' },
    ],
  },
  {
    name: 'Product Strategy',
    realm: 'Svartalfheim',
    island: 'Drum Island',
    gear: 'Base',
    color: '#c084fc',
    lore: "Snowy island of the Drum Castle — where Chopper joined the crew.",
    children: [
      { name: 'Discovery → MVP', proficiency: 84, description: 'Validate before building — Joy Boy didn\'t guess; Roger left a clue.' },
      { name: 'Shipping cadence', proficiency: 86, description: 'Weekly releases, feature flags, gradual rollouts.' },
      { name: 'Metrics & A/B', proficiency: 78, description: 'Decide with data, not vibes (mostly). Trust your Log Pose.' },
      { name: 'Stakeholder craft', proficiency: 82, description: 'Translate business → engineering and back. Diplomatic as Vivi.' },
    ],
  },
  {
    name: 'Databases',
    realm: 'Niflheim',
    island: 'Alabasta',
    gear: 'Base',
    color: '#6ee7b7',
    lore: "Desert kingdom of Alubarna — Vivi's homeland and the end of the Baroque Works arc.",
    children: [
      { name: 'PostgreSQL', proficiency: 88, description: 'RLS policies, partial indexes, time-series, partitioning — deep as the Calm Belt.' },
      { name: 'pgvector', proficiency: 86, description: 'Hybrid search: BM25 + cosine in a single query.' },
      { name: 'Redis', proficiency: 78, description: 'Caching, queues, pub/sub, distributed locks — fast as a Sea King.' },
      { name: 'Migrations & RLS', proficiency: 84, description: 'Zero-downtime schema changes, audit trails. Safer than Robin\'s Hana Hana clone.' },
    ],
  },
  {
    name: 'DevOps / Cloud',
    realm: 'Helheim',
    island: 'Jaya',
    gear: 'Base',
    color: '#f87171',
    lore: "Split island of Mock Town — and the launch point for the knock-up stream to Skypiea.",
    children: [
      { name: 'Vercel', proficiency: 86, description: 'ISR, edge config, preview environments, analytics.' },
      { name: 'AWS', proficiency: 78, description: 'S3, Lambda, CloudFront, IAM — survives an Ifrit kick or a Smoker chase.' },
      { name: 'GitHub Actions', proficiency: 84, description: 'CI/CD, matrix builds, reusable workflows, OIDC.' },
      { name: 'Docker', proficiency: 76, description: 'Multi-stage builds, slim images, dev-prod parity.' },
    ],
  },
  {
    name: 'Design Systems',
    realm: 'Alfheim',
    island: 'Skypiea',
    gear: 'Base',
    color: '#fbbf24',
    lore: "Sky island in the clouds — Shandora ruins, Ohm's gold bell, and Enel's empire.",
    children: [
      { name: 'Tokens & theming', proficiency: 92, description: 'Mode-switchable palettes — Thor / Luffy / dark / light. As crafted as a Doflamingo string.' },
      { name: 'Accessibility (WCAG 2.2)', proficiency: 90, description: 'Focus traps, ARIA patterns, motion preferences.' },
      { name: 'Component libraries', proficiency: 88, description: 'Headless, composable, fully typed APIs — like Sanji\'s plating.' },
      { name: 'Figma → Code', proficiency: 80, description: 'Design tokens pipeline, autolayout fidelity.' },
    ],
  },
  {
    name: 'Performance',
    realm: 'Muspelheim',
    island: 'Water 7',
    gear: 'Base',
    color: '#fb923c',
    lore: "City of canals and master shipwrights — where the Going Merry retired and the Sunny was born.",
    children: [
      { name: 'Core Web Vitals', proficiency: 92, description: 'LCP < 2.5s, INP < 200ms — every site, every device. Sharper than Zoro\'s Three-Sword Style.' },
      { name: 'Bundle audit', proficiency: 90, description: 'Lazy R3F, tree-shake the universe, sub-300KB main. Lean as a Yamato dash.' },
      { name: 'Image pipeline', proficiency: 86, description: 'AVIF + WebP + blur placeholders + responsive srcset.' },
      { name: 'Profiling (INP)', proficiency: 88, description: 'Long-task hunting, scheduler.yield, web workers — relentless as Kaido.' },
    ],
  },
  {
    name: 'TypeScript / React',
    realm: 'Midgard',
    island: 'Thriller Bark',
    gear: 'Gear 3',
    color: '#76cfff',
    lore: "Giant haunted ship-island of Gecko Moria — where Brook joined the crew.",
    children: [
      { name: 'React 19', proficiency: 95, description: 'Server components, streaming Suspense, transitions. As reliable as Sunny\'s coup de burst.' },
      { name: 'TypeScript', proficiency: 94, description: 'Generics, branded types, conditional inference — worthy of any wielder.' },
      { name: 'Next.js 15', proficiency: 90, description: 'App router, RSC, server actions, parallel routes. Routes the Going Merry would be proud of.' },
      { name: 'Tailwind v4', proficiency: 94, description: 'Tokens in CSS, layered design systems, zero-runtime.' },
      { name: 'Vite (rolldown)', proficiency: 88, description: 'Sub-second HMR, plugin authoring, edge builds. Faster than a Soru.' },
    ],
  },
  {
    name: 'AI / LLM Apps',
    realm: 'Asgard',
    island: 'Sabaody',
    gear: 'Gear 3',
    color: '#ffd700',
    lore: "Mangrove archipelago of bubble-coated trees — last stop before Fishman Island.",
    children: [
      { name: 'OpenAI / Anthropic SDKs', proficiency: 95, description: 'Wielding LLMs like Stormbreaker — tools, streaming, function calls. Drums of Liberation for your stack.' },
      { name: 'RAG pipelines', proficiency: 92, description: 'Search across the Nine Realms — or the Grand Line — of your data.' },
      { name: 'Agents & tool-use', proficiency: 90, description: 'Autonomous crews of LLMs that ship like Straw Hats with a clear log pose.' },
      { name: 'Evals & observability', proficiency: 88, description: 'Catch hallucinations before they reach Midgard. Test like Mihawk would.' },
      { name: 'Vector search / pgvector', proficiency: 90, description: 'Embeddings so dense they could lift Mjolnir or eat a Devil Fruit.' },
    ],
  },
];

/**
 * Future islands — placeholders shown on the map but with no skills attached
 * yet. As real skills are added to the portfolio they'll be promoted to
 * SKILL_DOMAINS in this same canonical order. Each placeholder still carries
 * the gear Luffy used at that arc so the chronology reads correctly.
 *
 * Order MUST stay aligned with the user's full canon list:
 *   ... → Sabaody (last visited) → Fishman Island → Punk Hazard → Dressrosa →
 *   Zou → Whole Cake Island → Wano Country → Egghead → Elbaph → Laugh Tale.
 */
export type FutureIsland = {
  island: string;
  gear: SkillDomain['gear'];
  /** Short hint about what kind of skill might land here. */
  hint: string;
  /** Canonical One Piece lore tagline. */
  lore: string;
};
/**
 * Dawn Island — Luffy's hometown and voyage origin. Distinct from the 9
 * visited skill islands: this entry has `kind: 'origin'` and no `children`
 * skill leaves. The detail popup branches on `kind` to render Luffy's
 * backstory in three lore sections instead of a skills grid.
 */
export type OriginIsland = {
  kind: 'origin';
  island: string;
  /** Sub-headline beneath the island name (e.g. region + village). */
  sub: string;
  /** Single-line lore tagline. */
  lore: string;
  /** Backstory sections rendered as parchment cards in the popup. */
  sections: { title: string; body: string }[];
};

export const DAWN_ISLAND_DATA: OriginIsland = {
  kind: 'origin',
  island: 'Dawn Island',
  sub: 'East Blue · Foosha Village',
  lore: 'East Blue. Foosha Village under Mt. Colubo — where the voyage began.',
  sections: [
    {
      title: 'The Origin Code',
      body:
        "At seven, Luffy ate the cursed Gum-Gum Fruit Shanks brought ashore. The price: never swim again. The reward: a body that turns punches into recoil. Shanks left him the iconic straw hat with one promise — bring it back when you've become a great pirate.",
    },
    {
      title: 'The Primary Directive',
      body:
        "Find the One Piece. Become King of the Pirates. The title isn't about ruling the seas — it's the title of the freest person on them. Roger said it himself before the executioner's blade fell: my treasure waits, find it.",
    },
    {
      title: 'The Awakening',
      body:
        'On Onigashima, against Kaido, the Gum-Gum Fruit revealed its real name: Hito Hito no Mi, Model Nika. The Sun God of liberation. Cartoon-physics rubber turned into reality-bending awakening — the world itself becomes elastic, and freedom becomes a force.',
    },
    {
      title: 'Luffy Logic',
      body:
        'Dream: a feast big enough that no one at the table goes hungry. Motivation: value = (dreams + actions) × the people you fight beside. Function: a chaos element that breaks oppressive systems by being too weird to predict and too stubborn to flinch.',
    },
  ],
};

export const FUTURE_ISLANDS: FutureIsland[] = [
  { island: 'Fishman Island',     gear: 'Gear 3', hint: 'Underwater realtime — coming soon',
    lore: "Underwater bubble city, 10,000 m below the Red Line — Jinbe's homeland." },
  { island: 'Punk Hazard',        gear: 'Gear 3', hint: 'Chaos engineering — coming soon',
    lore: "Fire-and-ice island of Caesar Clown's lab — where the Sanji-Nami body swap happened." },
  { island: 'Dressrosa',          gear: 'Gear 4', hint: 'Reserved for the next dossier',
    lore: "Colourful kingdom of Doflamingo's SMILE factory — Gear 4 Boundman's debut." },
  { island: 'Zou',                gear: 'Gear 4', hint: 'Reserved for the next dossier',
    lore: "Mokomo Dukedom on the back of the millennium-old elephant Zunesha." },
  { island: 'Whole Cake Island',  gear: 'Gear 4', hint: 'Reserved for the next dossier',
    lore: "Big Mom's confectionery kingdom — Sanji's wedding and Snakeman's debut." },
  { island: 'Wano Country',       gear: 'Gear 5', hint: 'Reserved for the next dossier',
    lore: "Feudal samurai nation — site of the Onigashima raid and Gear 5 awakening." },
  { island: 'Egghead',            gear: 'Gear 5', hint: 'Reserved for the next dossier',
    lore: "Vegapunk's futuristic egg-shaped lab island in the New World." },
  { island: 'Elbaph',             gear: 'Gear 5', hint: 'Reserved for the next dossier',
    lore: "Giant warrior nation under the colossal Elbaph World Tree." },
  { island: 'Laugh Tale',         gear: 'Gear 5', hint: 'The legendary final island',
    lore: "The legendary final island — where Roger laughed and the One Piece waits." },
];

/**
 * Future Marvel realms — placeholders shown as Bifrost destination orbs in
 * the upper sky of the Yggdrasil tree. Mirrors `FUTURE_ISLANDS` for the Thor
 * mode tree: as new skills land, a future realm gets promoted into a real
 * `SkillDomain` (gaining a branch, leaves, and a lore line).
 *
 * Tiers parallel Luffy's gear progression:
 *   Bifrost    — accessible via Asgard's rainbow bridge (mortal-realm tier)
 *   Mystic     — Doctor Strange / Sorcerer Supreme territory
 *   Cosmic     — Guardians-of-the-Galaxy scale, deep space
 *   Quantum    — Pym-particle / Kang-the-Conqueror sub-reality
 *   Multiversal — Beyonder / Battleworld / Eternity scale, endgame
 */
export type FutureRealm = {
  realm: string;
  tier: 'Bifrost' | 'Mystic' | 'Cosmic' | 'Quantum' | 'Multiversal';
  hint: string;
  lore: string;
};
export const FUTURE_REALMS: FutureRealm[] = [
  { realm: 'Wakanda',            tier: 'Bifrost',     hint: 'Reserved for the next dossier',
    lore: "Vibranium-rich African nation — T'Challa's kingdom and Earth's tech vanguard." },
  { realm: 'Sanctum Sanctorum',  tier: 'Mystic',      hint: 'Reserved for the next dossier',
    lore: "Doctor Strange's mystic stronghold — Earth's primary magical defense node." },
  { realm: 'Vormir',             tier: 'Mystic',      hint: 'Reserved for the next dossier',
    lore: "Soul-Stone keeper's realm — the price is a soul for a soul." },
  { realm: 'Knowhere',           tier: 'Cosmic',      hint: 'Reserved for the next dossier',
    lore: "Mining colony inside a Celestial's severed head — Guardians' base of operations." },
  { realm: 'Sakaar',             tier: 'Cosmic',      hint: 'Reserved for the next dossier',
    lore: "Junk planet of the Grandmaster — gladiator arena where Hulk reigned as champion." },
  { realm: 'Titan',              tier: 'Cosmic',      hint: 'Reserved for the next dossier',
    lore: "Thanos' devastated homeworld — site of the Doctor Strange / Tony Stark stand." },
  { realm: 'Quantum Realm',      tier: 'Quantum',     hint: 'Reserved for the next dossier',
    lore: "Subatomic dimension where time and space lose meaning — Kang's prison." },
  { realm: 'Battleworld',        tier: 'Multiversal', hint: 'Reserved for the next dossier',
    lore: "Patchwork of universes assembled by the Beyonder during Secret Wars." },
  { realm: 'Eternity',           tier: 'Multiversal', hint: 'The legendary final realm',
    lore: "The cosmic embodiment of all reality — endgame of any cosmic-tier journey." },
];
