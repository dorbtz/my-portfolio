/**
 * src/data/project-fixtures.ts
 *
 * Mode-aware fictional project fixtures for the portfolio.
 * Used by Hero.tsx (latest project chip) and Projects section when Supabase
 * returns zero rows (offline / cold-start fallback).
 *
 * Cover URLs reference /public/assets/seed/*.webp — these files are already in
 * the repo, so there are no 404s. The existing <ImageFallback> component
 * gracefully handles any missing image with a text placeholder anyway.
 */

import type { Project } from '../../../types/project';

const now = new Date();

// ---------------------------------------------------------------------------
// Helper — create a stable ISO date string offset by N days from today.
// ---------------------------------------------------------------------------
function daysAgo(days: number): string {
  return new Date(now.getTime() - days * 86_400_000).toISOString();
}

// ===========================================================================
// THOR FIXTURES — Asgardian / Marvel-themed AI engineering projects
// Round 75: `THOR_FIXTURES` (and `GEAR5_FIXTURES`) are now post-processed
// with `{ placeholder: true }` at the bottom of this file, so every
// consumer (Projects section, /projects page, getProject fallback) sees
// the rows pre-flagged.  The raw inline definitions below stay clean for
// readability — only the exported arrays carry the flag.
// ===========================================================================
const RAW_THOR_FIXTURES: Project[] = [
  {
    id: 'mjolnir-ui-forge',
    slug: 'mjolnir-ui-forge',
    title: 'Mjolnir UI Forge',
    subtitle: 'The design system worthy of Asgard.',
    summary: 'A battle-hardened design system — component forge, token vault, and live storybook — built for teams that ship at Mjolnir speed.',
    description:
      'Mjolnir UI Forge is the foundational design system I built to bring Asgardian consistency across a suite of AI products. Every primitive — from typography scales to motion tokens — was hand-forged and documented in a living Storybook instance, then published as an NPM package with strict semver discipline.\n\nThe forge includes a Figma ↔ code sync pipeline powered by Tokens Studio, a GSAP-animated component playground, and an automated visual-regression suite with Playwright + Percy. Teams using the forge shipped features 40% faster in the quarter after adoption.',
    tags: ['design-system', 'frontend', 'dx'],
    stack: ['React', 'TypeScript', 'Storybook', 'Radix UI', 'GSAP', 'Tokens Studio'],
    tech: ['React', 'TypeScript', 'Storybook', 'Radix UI', 'GSAP', 'Tokens Studio'],
    role: 'Design systems lead',
    status: 'shipped',
    mode: 'thor',
    priority: 3,
    sortOrder: 1,
    featured: true,
    coverUrl: '/assets/Marvel/thor-strike.png',
    metrics: [
      { label: 'Components', value: '120+' },
      { label: 'Ship velocity', value: '+40%' },
      { label: 'A11y score', value: '98/100' },
    ],
    responsibilities: [
      'Token architecture & Figma sync pipeline',
      'Accessibility audit to WCAG 2.2 AA across all primitives',
      'Automated visual-regression with Playwright + Percy',
      'NPM publish workflow with semver enforcement',
    ],
    outcomes: [
      'Adopted by 3 product squads in week one',
      'Zero design-debt incidents in Q3 post-launch',
      'Storybook used as single source of truth for designers + engineers',
    ],
    createdAt: daysAgo(180),
    updatedAt: daysAgo(14),
    heroImageAlt: 'Mjolnir UI Forge design system component playground',
  },
  {
    id: 'bifrost-pipeline',
    slug: 'bifrost-pipeline',
    title: 'Bifrost Pipeline',
    subtitle: 'Observability across the Nine Realms of your stack.',
    summary: 'A full-stack AI observability platform that traces LLM calls, measures evals, and surfaces drift before it strikes.',
    description:
      'Named after the rainbow bridge linking all Nine Realms, Bifrost Pipeline is an observability platform for LLM-powered applications. It captures every OpenAI / Anthropic API call, traces token spend, measures answer quality via automated eval harnesses, and sends Slack alerts when latency or cost metrics drift past configurable thresholds.\n\nThe system ingests data via a lightweight SDK shim (< 2 KB gzip), stores structured traces in Supabase, and surfaces insights in a real-time React dashboard with drill-down views per model, prompt template, and user segment. It replaced a patchwork of Datadog dashboards and cut MTTR for LLM regressions from days to under an hour.',
    tags: ['ai', 'observability', 'saas', 'llm'],
    stack: ['React', 'TypeScript', 'Supabase', 'OpenAI', 'Anthropic', 'Node.js', 'Recharts'],
    tech: ['React', 'TypeScript', 'Supabase', 'OpenAI', 'Anthropic', 'Node.js'],
    role: 'Founding engineer',
    status: 'shipped',
    mode: 'thor',
    priority: 3,
    sortOrder: 2,
    featured: true,
    coverUrl: '/assets/Marvel/thor-almigthy.png',
    metrics: [
      { label: 'MTTR', value: '< 1 hr' },
      { label: 'Token savings', value: '22%' },
      { label: 'Evals / day', value: '14k+' },
    ],
    responsibilities: [
      'SDK shim design (< 2 KB, zero latency overhead)',
      'Real-time Supabase subscription pipeline',
      'Eval harness with automated LLM-as-judge scoring',
      'Cost anomaly detection + Slack alert hooks',
    ],
    outcomes: [
      'MTTR for LLM regressions reduced from days to < 1 hour',
      '22% token cost reduction through prompt-length insights',
      'Adopted by 2 external teams within 30 days of launch',
    ],
    createdAt: daysAgo(150),
    updatedAt: daysAgo(7),
    heroImageAlt: 'Bifrost Pipeline observability dashboard',
  },
  {
    id: 'stormbreaker-ci',
    slug: 'stormbreaker-ci',
    title: 'Stormbreaker CI',
    subtitle: 'DevOps forged to cleave build times in half.',
    summary: 'A GitHub Actions workflow library and CI template that cuts average build time by 52% using intelligent caching, matrix sharding, and AI-assisted test selection.',
    description:
      'Stormbreaker CI is a reusable GitHub Actions workflow library I designed for TypeScript / React monorepos. The core innovation is an AI-assisted test-selection layer: a lightweight model analyses changed files and git blame data to predict which test suites are most likely to catch regressions, then schedules those first on a sharded matrix runner.\n\nCombined with Turborepo remote caching and predictive cache warming, the overall CI wall-clock time dropped from 18 minutes to under 9 on the primary product. The library ships as a versioned GitHub Actions marketplace action and a companion CLI for local dry-runs.',
    tags: ['devops', 'ci', 'dx', 'ai'],
    stack: ['GitHub Actions', 'Node.js', 'TypeScript', 'Turborepo', 'Docker', 'OpenAI'],
    tech: ['GitHub Actions', 'Node.js', 'TypeScript', 'Turborepo', 'Docker', 'OpenAI'],
    role: 'Platform engineer',
    status: 'shipped',
    mode: 'thor',
    priority: 2,
    sortOrder: 3,
    featured: false,
    coverUrl: '/assets/Marvel/captain-america.png',
    metrics: [
      { label: 'Build time', value: '-52%' },
      { label: 'Flaky tests', value: '-80%' },
      { label: 'Cache hit rate', value: '91%' },
    ],
    responsibilities: [
      'AI-assisted test selection algorithm',
      'Turborepo remote cache configuration',
      'Matrix sharding with dynamic runner allocation',
      'GitHub Actions Marketplace publication',
    ],
    outcomes: [
      'CI wall-clock reduced from 18 min to < 9 min',
      'Flaky test rate cut by 80% via deterministic runner seeding',
      '91% cache hit rate on production branch runs',
    ],
    createdAt: daysAgo(90),
    updatedAt: daysAgo(21),
    heroImageAlt: 'Stormbreaker CI GitHub Actions workflow dashboard',
  },
  {
    id: 'asgard-codex',
    slug: 'asgard-codex',
    title: 'Asgard Codex',
    subtitle: 'All knowledge, one Bifrost query away.',
    summary: 'An internal AI knowledge base that turns documentation, Confluence pages, and GitHub wikis into a searchable RAG assistant with source citations.',
    description:
      'Asgard Codex is an internal RAG (Retrieval-Augmented Generation) assistant that ingests documents from Confluence, Notion, GitHub wikis, and PDF uploads, chunks them with semantic boundaries, embeds them using OpenAI text-embedding-3-large, and stores vectors in a Supabase pgvector table.\n\nEngineers query the codex via a sleek React chat interface that streams answers in real-time and cites exact source paragraphs with page links. A background re-indexing job runs every 6 hours to pick up new documentation. Onboarding time for new engineers dropped by 35% in the first quarter after deployment.',
    tags: ['ai', 'rag', 'knowledge-base', 'llm'],
    stack: ['React', 'TypeScript', 'Supabase', 'pgvector', 'OpenAI', 'Node.js', 'Vercel'],
    tech: ['React', 'TypeScript', 'Supabase', 'pgvector', 'OpenAI', 'Node.js'],
    role: 'AI engineer',
    status: 'shipped',
    mode: 'thor',
    priority: 2,
    sortOrder: 4,
    featured: false,
    coverUrl: '/assets/Marvel/ironman.png',
    metrics: [
      { label: 'Docs indexed', value: '8 200+' },
      { label: 'Onboarding time', value: '-35%' },
      { label: 'Query latency', value: '< 1.2 s' },
    ],
    responsibilities: [
      'Semantic chunking pipeline with overlap tuning',
      'pgvector hybrid search (BM25 + cosine similarity)',
      'Streaming SSE chat interface in React',
      'Automated re-indexing cron job via Supabase Edge Functions',
    ],
    outcomes: [
      'New-engineer onboarding time reduced by 35%',
      'Replaced 4 separate search tools with one unified interface',
      'Zero hallucinated answers in 30-day eval (source-grounding enforced)',
    ],
    createdAt: daysAgo(60),
    updatedAt: daysAgo(3),
    heroImageAlt: 'Asgard Codex internal AI knowledge base chat interface',
  },
  {
    id: 'lokis-mirror',
    slug: 'lokis-mirror',
    title: "Loki's Mirror",
    subtitle: 'Chaos engineering for AI — find the illusions before production does.',
    summary: "A chaos-engineering and contract-testing harness for LLM-backed APIs — Loki's Mirror shows you exactly where your AI responses diverge from their spec.",
    description:
      "Named for the god of mischief, Loki's Mirror is a testing harness designed for AI applications where determinism is a myth. It runs LLM API calls against a contract spec (JSON Schema + natural-language invariants), records response distributions across 100 repeated shots, and flags schema violations, tone drift, and harmful-content edge cases.\n\nThe harness integrates with Vitest for unit-level contract tests and ships a standalone dashboard that plots answer variance over time. A chaos-injection mode introduces adversarial prompts from a curated red-team dataset to probe model robustness. Used to catch 3 critical prompt-injection vulnerabilities before a customer-facing launch.",
    tags: ['testing', 'ai', 'chaos', 'llm', 'security'],
    stack: ['TypeScript', 'Vitest', 'Node.js', 'OpenAI', 'Anthropic', 'React'],
    tech: ['TypeScript', 'Vitest', 'Node.js', 'OpenAI', 'Anthropic', 'React'],
    role: 'Lead engineer',
    status: 'in-progress',
    mode: 'thor',
    priority: 1,
    sortOrder: 5,
    featured: false,
    coverUrl: '/assets/Marvel/magneto.png',
    metrics: [
      { label: 'Vulnerabilities found', value: '3 pre-launch' },
      { label: 'Contract checks / run', value: '340+' },
      { label: 'Variance reduction', value: '28%' },
    ],
    responsibilities: [
      'LLM contract specification language (JSON Schema + NL invariants)',
      'Statistical distribution analysis across repeated shots',
      'Red-team adversarial prompt library (500+ entries)',
      'Vitest plugin for inline contract assertions',
    ],
    outcomes: [
      'Caught 3 prompt-injection vulnerabilities before public launch',
      'Reduced answer variance by 28% via prompt-engineering insights',
      'Adopted as mandatory gate in the AI product CI pipeline',
    ],
    createdAt: daysAgo(30),
    heroImageAlt: "Loki's Mirror chaos engineering dashboard for LLM testing",
  },
  {
    id: 'yggdrasil-atlas',
    slug: 'yggdrasil-atlas',
    title: 'Yggdrasil Atlas',
    subtitle: 'A data warehouse that spans all Nine Realms of your product.',
    summary: 'A RAG-powered data warehouse assistant that lets non-technical stakeholders query petabyte-scale product analytics in plain English — with cited SQL.',
    description:
      'Yggdrasil Atlas connects to a Snowflake data warehouse via a metadata crawler that builds a semantic schema graph (tables, columns, foreign keys, business definitions). When a stakeholder types a plain-English question, Atlas uses GPT-4o to generate candidate SQL queries, explains each step in plain language, and cites the exact columns used.\n\nA human-in-the-loop review step lets data engineers approve or edit generated SQL before first-run to prevent costly full-table scans. The system ships a React query playground with result charting via Recharts, and a Slack bot that runs scheduled reports every Monday morning.',
    tags: ['ai', 'data', 'rag', 'llm', 'analytics'],
    stack: ['React', 'TypeScript', 'Supabase', 'Snowflake', 'OpenAI', 'Recharts', 'Node.js'],
    tech: ['React', 'TypeScript', 'Supabase', 'Snowflake', 'OpenAI', 'Recharts'],
    role: 'AI engineer & frontend lead',
    status: 'in-progress',
    mode: 'thor',
    priority: 1,
    sortOrder: 6,
    featured: false,
    coverUrl: '/assets/Marvel/spiderman.png',
    metrics: [
      { label: 'Tables indexed', value: '3 400+' },
      { label: 'Query accuracy', value: '87%' },
      { label: 'Time-to-insight', value: '-70%' },
    ],
    responsibilities: [
      'Semantic schema graph crawler for Snowflake',
      'Text-to-SQL pipeline with GPT-4o + chain-of-thought prompting',
      'Human-in-the-loop SQL review workflow',
      'Recharts result visualisation layer',
    ],
    outcomes: [
      'Non-technical stakeholders self-serve 80% of analytics requests',
      'Time-to-insight reduced by 70% vs. waiting for data team',
      'Generated SQL passed cost-safety gate on 94% of first-run queries',
    ],
    createdAt: daysAgo(14),
    heroImageAlt: 'Yggdrasil Atlas data warehouse AI query interface',
  },
];

// ===========================================================================
// GEAR 5 FIXTURES — Straw Hat Pirates crew (10 wanted-poster placeholders)
//
// Real canonical Straw Hat data: bounties from Egghead arc, roles, dreams,
// and Devil Fruit / specialty notes — paired with each crew member's
// portfolio-equivalent AI engineering specialty.
//
// Wanted poster images live locally at /public/assets/One-Piece/wanted/.
// All crew members (including the captain Luffy) use the high-quality
// capitalized PNG wanted posters added in May 2026 (Luffy.png, Zoro.png,
// Nami.png, etc.). ImageFallback gracefully handles any missing file with
// a styled wanted-poster placeholder.
// ===========================================================================
const RAW_GEAR5_FIXTURES: Project[] = [
  // ---------------------------------------------------------------------
  // 1. CAPTAIN — Monkey D. Luffy (3,000,000,000 berries)
  // ---------------------------------------------------------------------
  {
    id: 'straw-hat-luffy',
    slug: 'straw-hat-luffy',
    title: 'Monkey D. Luffy',
    subtitle: 'Captain · "Strawhat" · Sun God Nika · Future Pirate King',
    summary:
      'The captain who eats Devil Fruits and ships features. Awakened Hito Hito no Mi, Model: Nika — the rubber-and-sun god of joy, freedom, and impossible velocity.',
    description:
      "Monkey D. Luffy — captain of the Straw Hat Pirates, future Pirate King, and current Yonko of the New World. Born in Foosha Village, trained by Garp and Shanks, and freshly awakened to Gear 5: the Joy Boy form of the Hito Hito no Mi, Model: Nika. Bounty: ฿3,000,000,000 after Egghead.\n\nIn the portfolio metaphor: the captain figure — the founding engineer and product owner who steers the ship from MVP to launch with relentless joy and zero respect for the impossible. Specialty: end-to-end AI product ownership, multi-agent orchestration, and shipping at Gear 5 velocity.",
    tags: ['captain', 'leadership', 'ai-agents', 'awakened'],
    stack: ['React', 'TypeScript', 'Supabase', 'OpenAI', 'Anthropic', 'Vercel'],
    tech: ['React', 'TypeScript', 'Supabase', 'OpenAI', 'Anthropic'],
    role: 'Captain / Founding engineer',
    status: 'shipped',
    mode: 'gear5',
    priority: 3,
    sortOrder: 1,
    featured: true,
    coverUrl: '/assets/One-Piece/wanted/luffy.png',
    metrics: [
      { label: 'Bounty', value: '฿3,000,000,000' },
      { label: 'Devil Fruit', value: 'Hito Hito no Mi, Model: Nika (Awakened)' },
      { label: 'Dream', value: 'Pirate King' },
    ],
    responsibilities: [
      'Lead the crew across the Grand Line — from East Blue to Laugh Tale',
      'Eat Devil Fruits, build features, defy gravity',
      'Awaken Gear 5 when production goes down',
      'Trust the crew, share the meat, fight the world',
    ],
    outcomes: [
      'Defeated Crocodile, Lucci, Doflamingo, Katakuri, Big Mom (assist), Kaido',
      'Liberated Wano with the Drums of Liberation',
      'Reached Yonko status with a ฿3,000,000,000 bounty',
    ],
    createdAt: daysAgo(200),
    updatedAt: daysAgo(2),
    heroImageAlt: "Monkey D. Luffy — Captain of the Straw Hat Pirates, Pirate King candidate",
  },
  // ---------------------------------------------------------------------
  // 2. SWORDSMAN — Roronoa Zoro (1,111,000,000 berries)
  // ---------------------------------------------------------------------
  {
    id: 'straw-hat-zoro',
    slug: 'straw-hat-zoro',
    title: 'Roronoa Zoro',
    subtitle: 'First mate · Three-Sword Style · Future World\'s Greatest Swordsman',
    summary:
      'The swordsman who fights with three blades. Wado Ichimonji, Sandai Kitetsu, and Enma — slashing through frontend, backend, and infra in a single Asura.',
    description:
      "Roronoa Zoro — first mate of the Straw Hats, master of Santoryu (Three-Sword Style). Apprentice to Mihawk, wielder of Wado Ichimonji (his promise to Kuina), Sandai Kitetsu, and Enma (formerly Oden's blade). Awakened Conqueror's Haki on Onigashima. Bounty: ฿1,111,000,000.\n\nIn the portfolio metaphor: the senior platform engineer who runs three frameworks at once — Web Components, React, Vue — from a single source of truth. Three swords, one stack, zero compromise.",
    tags: ['swordsman', 'platform', 'tooling', 'haki'],
    stack: ['TypeScript', 'Vite', 'Web Components', 'React', 'Vue 3', 'GSAP'],
    tech: ['TypeScript', 'Vite', 'Web Components', 'React'],
    role: 'First mate / Platform engineer',
    status: 'shipped',
    mode: 'gear5',
    priority: 3,
    sortOrder: 2,
    featured: true,
    coverUrl: '/assets/One-Piece/wanted/Zoro.png',
    metrics: [
      { label: 'Bounty', value: '฿1,111,000,000' },
      { label: 'Style', value: 'Santoryu — Three-Sword Style' },
      { label: 'Dream', value: "World's Greatest Swordsman" },
    ],
    responsibilities: [
      'Three-sword build pipeline (React, Vue, vanilla Web Components)',
      'Conqueror\'s Haki for production incidents',
      'Defeat any opponent with a single Asura',
      'Get lost — but always show up at the right moment',
    ],
    outcomes: [
      'Defeated Mr. 1, Kaku, Hody, Pica, King',
      'Awakened Conqueror\'s Haki at Onigashima',
      'Inherited Enma — wields Oden\'s former blade',
    ],
    createdAt: daysAgo(190),
    updatedAt: daysAgo(5),
    heroImageAlt: "Roronoa Zoro — Three-Sword Style swordsman of the Straw Hats",
  },
  // ---------------------------------------------------------------------
  // 3. NAVIGATOR — Nami (366,000,000 berries)
  // ---------------------------------------------------------------------
  {
    id: 'straw-hat-nami',
    slug: 'straw-hat-nami',
    title: 'Nami',
    subtitle: 'Navigator · Cat Burglar · Cartographer of the World',
    summary:
      'The navigator who charts every storm and every treasure. Clima-Tact in hand, log-pose to the next island — analytics dashboards with sub-200ms latency.',
    description:
      "Nami — navigator of the Straw Hat Pirates and one of the greatest cartographers alive. Wields the Sorcery Clima-Tact (an Usopp invention powered by Weatheria science) to manipulate weather mid-battle. Bounty: ฿366,000,000. Dream: draw a complete map of the world.\n\nIn the portfolio metaphor: the data and analytics specialist — real-time dashboards, AI-narrative summaries, weather-pattern anomaly detection. If you need to know where the storm is and where the treasure's buried, you ask Nami.",
    tags: ['navigator', 'analytics', 'dashboards', 'cartography'],
    stack: ['React', 'TypeScript', 'Supabase', 'D3', 'Recharts', 'OpenAI'],
    tech: ['React', 'TypeScript', 'Supabase', 'D3'],
    role: 'Navigator / Data engineer',
    status: 'shipped',
    mode: 'gear5',
    priority: 2,
    sortOrder: 3,
    featured: false,
    coverUrl: '/assets/One-Piece/wanted/Nami.png',
    metrics: [
      { label: 'Bounty', value: '฿366,000,000' },
      { label: 'Weapon', value: 'Sorcery Clima-Tact' },
      { label: 'Dream', value: 'Complete world atlas' },
    ],
    responsibilities: [
      'Chart the Grand Line — and the dashboard',
      'Predict storms before they hit production',
      'Treasure detection — every berry, every metric, accounted for',
      'Wield the Clima-Tact for weather-control DDoS mitigation',
    ],
    outcomes: [
      'Mapped Alabasta, Skypiea, Water 7, Wano',
      'Stole 50 million berries from Buggy in chapter 1',
      'Survived Arlong Park — and shipped the dashboard the same week',
    ],
    createdAt: daysAgo(180),
    updatedAt: daysAgo(8),
    heroImageAlt: "Nami — Navigator of the Straw Hat Pirates",
  },
  // ---------------------------------------------------------------------
  // 4. SNIPER — Usopp / God Usopp (500,000,000 berries)
  // ---------------------------------------------------------------------
  {
    id: 'straw-hat-usopp',
    slug: 'straw-hat-usopp',
    title: 'Usopp (a.k.a. God Usopp)',
    subtitle: 'Sniper · Inventor · Brave Warrior of the Sea',
    summary:
      "The sniper whose lies become real. Kabuto in hand, observation Haki sharpened — long-range precision testing and pop-green plant ammunition for production.",
    description:
      "Usopp — sniper, inventor, and the Straw Hats' brave warrior of the sea. Son of Yasopp (Red-Hair Pirates' sniper). Wields the Black Kabuto and Pop Greens grown from Boin Archipelago seeds. Awakened Observation Haki at Dressrosa, where he was renamed God Usopp after striking down Sugar. Bounty: ฿500,000,000.\n\nIn the portfolio metaphor: the QA / testing / observability lead — long-range precision, every edge case mapped, every vulnerability shot down before production. The lies (mocks, fixtures) become real (passing tests).",
    tags: ['sniper', 'qa', 'testing', 'observability'],
    stack: ['Vitest', 'Playwright', 'TypeScript', 'Sentry', 'OpenTelemetry'],
    tech: ['Vitest', 'Playwright', 'TypeScript'],
    role: 'Sniper / QA engineer',
    status: 'shipped',
    mode: 'gear5',
    priority: 2,
    sortOrder: 4,
    featured: false,
    coverUrl: '/assets/One-Piece/wanted/Usopp.png',
    metrics: [
      { label: 'Bounty', value: '฿500,000,000' },
      { label: 'Weapon', value: 'Black Kabuto + Pop Greens' },
      { label: 'Dream', value: 'Brave Warrior of the Sea' },
    ],
    responsibilities: [
      'Long-range precision testing — Pop Green for every regression',
      'Observation Haki for production incident detection',
      'Invent and ship the Clima-Tact, Black Kabuto, every Sunny gimmick',
      'Tell tall tales until they come true',
    ],
    outcomes: [
      'Defeated Daddy the Father, Perona, Trebol, Sugar',
      'Awakened Observation Haki at Dressrosa',
      'Promoted to "God Usopp" — bounty 5x in a single arc',
    ],
    createdAt: daysAgo(170),
    updatedAt: daysAgo(12),
    heroImageAlt: "Usopp — Sniper of the Straw Hat Pirates, God Usopp of Dressrosa",
  },
  // ---------------------------------------------------------------------
  // 5. COOK — Vinsmoke Sanji (1,032,000,000 berries)
  // ---------------------------------------------------------------------
  {
    id: 'straw-hat-sanji',
    slug: 'straw-hat-sanji',
    title: 'Vinsmoke Sanji',
    subtitle: 'Cook · Black Leg Style · Awakened Vinsmoke',
    summary:
      "The cook who fights with his legs and refuses to use his hands. Black Leg Style + Raid Suit + awakened germa-modifications — UX so refined it belongs at the All Blue.",
    description:
      "Vinsmoke Sanji — cook of the Straw Hats, third son of the Vinsmoke Family, master of Black Leg Style learned under Zeff. Wields no weapons (his hands are for cooking only). After Whole Cake Island, his germa-modified physiology awakened — exoskeleton, super-speed, and resistance to hellfire. Bounty: ฿1,032,000,000. Dream: find the All Blue.\n\nIn the portfolio metaphor: the UX / design-systems perfectionist — every component plated like a five-star dish, every interaction tasted before it ships. Refuses to use his hands on backend code (that's not his place); kicks ass on frontend craft.",
    tags: ['cook', 'ux', 'design-systems', 'craft'],
    stack: ['React', 'Tailwind v4', 'Figma', 'GSAP', 'Storybook'],
    tech: ['React', 'Tailwind', 'Figma'],
    role: 'Cook / UX engineer',
    status: 'shipped',
    mode: 'gear5',
    priority: 2,
    sortOrder: 5,
    featured: false,
    coverUrl: '/assets/One-Piece/wanted/Sanji.png',
    metrics: [
      { label: 'Bounty', value: '฿1,032,000,000' },
      { label: 'Style', value: 'Black Leg Style + Ifrit Jambe' },
      { label: 'Dream', value: 'The All Blue' },
    ],
    responsibilities: [
      'Plate every component like a Baratie special',
      'Diable Jambe / Ifrit Jambe for production hot-paths',
      'Never let a lady (or a junior dev) go hungry',
      'Refuse to use hands on backend code — kicks only',
    ],
    outcomes: [
      'Defeated Mr. 2 Bon Clay, Jabra, Pekoms, Queen',
      'Survived Whole Cake Island and Onigashima',
      "Awakened Vinsmoke physiology — speed of Soru, body of steel",
    ],
    createdAt: daysAgo(160),
    updatedAt: daysAgo(15),
    heroImageAlt: "Vinsmoke Sanji — Cook of the Straw Hats, Black Leg Style master",
  },
  // ---------------------------------------------------------------------
  // 6. DOCTOR — Tony Tony Chopper (1,000 berries)
  // ---------------------------------------------------------------------
  {
    id: 'straw-hat-chopper',
    slug: 'straw-hat-chopper',
    title: 'Tony Tony Chopper',
    subtitle: 'Doctor · Hito Hito no Mi · Monster Point',
    summary:
      "The reindeer doctor with a Devil Fruit and seven Rumble-Ball transformations. Brilliant medical AI, plus Monster Point for when the bug is too big.",
    description:
      "Tony Tony Chopper — doctor of the Straw Hats, ate the Hito Hito no Mi (Human-Human Fruit). Trained under Dr. Hiriluk and Dr. Kureha on Drum Island. Uses Rumble Balls to access seven transformations — Walk Point, Brain Point, Heavy Point, Jumping Point, Arm Point, Horn Point, Kung Fu Point — plus Monster Point. Bounty: ฿1,000 (the world thinks he's a pet).\n\nIn the portfolio metaphor: the healthcheck / monitoring / medical-AI specialist. Brilliant diagnostic reasoning at Brain Point, full-system response at Monster Point. Underestimated by the world — by far the most useful crew member.",
    tags: ['doctor', 'monitoring', 'medical-ai', 'observability'],
    stack: ['Node.js', 'OpenTelemetry', 'Sentry', 'Supabase', 'OpenAI'],
    tech: ['Node.js', 'OpenTelemetry', 'OpenAI'],
    role: 'Doctor / SRE',
    status: 'shipped',
    mode: 'gear5',
    priority: 2,
    sortOrder: 6,
    featured: false,
    coverUrl: '/assets/One-Piece/wanted/Chopper.png',
    metrics: [
      { label: 'Bounty', value: '฿1,000 (mistaken for pet)' },
      { label: 'Devil Fruit', value: 'Hito Hito no Mi (Human-Human Fruit)' },
      { label: 'Dream', value: 'Cure every disease' },
    ],
    responsibilities: [
      'Healthcheck every endpoint — and every crewmate',
      '7 Rumble-Ball transformations for any incident shape',
      'Monster Point reserved for production fires only',
      'Carry medical AI knowledge — and a tanuki disguise (he is not a tanuki)',
    ],
    outcomes: [
      'Defeated Gedatsu, Kumadori, Daruma',
      'Cured Sanji at Whole Cake Island',
      'Survived Drum Island, Sabaody, and Punk Hazard',
    ],
    createdAt: daysAgo(150),
    updatedAt: daysAgo(20),
    heroImageAlt: "Tony Tony Chopper — Doctor of the Straw Hat Pirates",
  },
  // ---------------------------------------------------------------------
  // 7. ARCHAEOLOGIST — Nico Robin (930,000,000 berries)
  // ---------------------------------------------------------------------
  {
    id: 'straw-hat-robin',
    slug: 'straw-hat-robin',
    title: 'Nico Robin',
    subtitle: 'Archaeologist · Demon Child of Ohara · Hana Hana no Mi',
    summary:
      "The only person alive who can read the Poneglyphs. Hana Hana no Mi blooms a hundred limbs — RAG over forbidden history, parallel data pipelines.",
    description:
      "Nico Robin — archaeologist of the Straw Hats, last survivor of Ohara, the only person alive who can read Poneglyphs (the ancient writing of the Void Century). Ate the Hana Hana no Mi (Flower-Flower Fruit), which lets her bloom replicas of any body part anywhere within range. Awakened the fruit at Egghead. Bounty: ฿930,000,000.\n\nIn the portfolio metaphor: the data archaeology / RAG specialist — reads forbidden history (legacy databases), runs parallel data pipelines (Hana Hana parallelism), and unlocks the True History of any product's analytics.",
    tags: ['archaeologist', 'data', 'rag', 'history'],
    stack: ['Python', 'Supabase', 'pgvector', 'OpenAI', 'LangChain'],
    tech: ['Python', 'pgvector', 'OpenAI'],
    role: 'Archaeologist / Data scientist',
    status: 'shipped',
    mode: 'gear5',
    priority: 2,
    sortOrder: 7,
    featured: false,
    coverUrl: '/assets/One-Piece/wanted/Robin.png',
    metrics: [
      { label: 'Bounty', value: '฿930,000,000' },
      { label: 'Devil Fruit', value: 'Hana Hana no Mi (Awakened)' },
      { label: 'Dream', value: 'Read the True History (Rio Poneglyph)' },
    ],
    responsibilities: [
      'Decipher Poneglyphs and legacy database schemas',
      'Hana Hana parallelism — bloom 100 hands across 100 nodes',
      'Read the True History of every product analytics',
      'Carry the weight of the Void Century — and the changelog',
    ],
    outcomes: [
      'Read Road Poneglyphs at Skypiea, Zou, Whole Cake, Wano',
      'Awakened Hana Hana no Mi → Demon Bloom',
      'Defeated Yama, Tesoro\'s lieutenants, Black Maria',
    ],
    createdAt: daysAgo(140),
    updatedAt: daysAgo(25),
    heroImageAlt: "Nico Robin — Archaeologist of the Straw Hat Pirates, Demon Child of Ohara",
  },
  // ---------------------------------------------------------------------
  // 8. SHIPWRIGHT — Franky / Cutty Flam (394,000,000 berries)
  // ---------------------------------------------------------------------
  {
    id: 'straw-hat-franky',
    slug: 'straw-hat-franky',
    title: 'Franky (Cutty Flam)',
    subtitle: 'Shipwright · Cyborg · Builder of the Thousand Sunny',
    summary:
      "The cyborg shipwright who built the Thousand Sunny and an army of Pacifista BMs. SUUUPER CI/CD, infra-as-code, and a body fueled by cola.",
    description:
      "Franky (real name: Cutty Flam) — shipwright of the Straw Hats, cyborg powered by cola. Apprentice of Tom (the legendary shipwright who built Gol D. Roger's Oro Jackson). Built the Thousand Sunny from Adam Wood. After the timeskip, rebuilt himself into Battle Franky 37 with armaments designed by Vegapunk's Pacifista blueprints. Bounty: ฿394,000,000.\n\nIn the portfolio metaphor: the DevOps / infra / shipwright — builds the platform itself. CI/CD pipelines, container infrastructure, the Thousand Sunny of every product. Powered by espresso (the cola of the engineering world).",
    tags: ['shipwright', 'devops', 'infra', 'ci-cd'],
    stack: ['Docker', 'GitHub Actions', 'Terraform', 'AWS', 'Cloudflare'],
    tech: ['Docker', 'GitHub Actions', 'AWS'],
    role: 'Shipwright / DevOps engineer',
    status: 'shipped',
    mode: 'gear5',
    priority: 2,
    sortOrder: 8,
    featured: false,
    coverUrl: '/assets/One-Piece/wanted/Franky.png',
    metrics: [
      { label: 'Bounty', value: '฿394,000,000' },
      { label: 'Body', value: 'Battle Franky 37 (cyborg, cola-fueled)' },
      { label: 'Dream', value: 'Build the ship that reaches Laugh Tale' },
    ],
    responsibilities: [
      'Build and maintain the Thousand Sunny (CI/CD pipeline)',
      'Coup de Burst for emergency deploys',
      'Refuel cola (espresso) every 30 minutes',
      "Yell SUUUPER!! at every successful prod release",
    ],
    outcomes: [
      'Built Thousand Sunny from Adam Wood',
      'Defeated Senor Pink, Sasaki',
      'Inherited Vegapunk\'s Pacifista blueprints (canonically)',
    ],
    createdAt: daysAgo(130),
    updatedAt: daysAgo(28),
    heroImageAlt: "Franky — Shipwright cyborg of the Straw Hat Pirates",
  },
  // ---------------------------------------------------------------------
  // 9. MUSICIAN — Brook / Soul King (383,000,000 berries)
  // ---------------------------------------------------------------------
  {
    id: 'straw-hat-brook',
    slug: 'straw-hat-brook',
    title: 'Brook (Soul King)',
    subtitle: 'Musician · Yomi Yomi no Mi · Soul-soul fencer',
    summary:
      "The skeleton musician who came back from the dead. Yomi Yomi no Mi gives him a second life — and a Whisper-grade audio pipeline for every meeting.",
    description:
      "Brook — musician and second swordsman of the Straw Hats. Ate the Yomi Yomi no Mi (Revive-Revive Fruit) which gave him a second life after he died. World-famous as the Soul King — solo musical career between adventures. Wields Soul Solid, a cane-sword that channels his soul-energy into freezing attacks. Bounty: ฿383,000,000.\n\nIn the portfolio metaphor: the audio / streaming / real-time specialist — Whisper transcription, voice diarisation, streaming SSE pipelines. Like a soul that survives death, his audio captures everything (laughter, hesitation, the decision moment) and plays it back as structured insight.",
    tags: ['musician', 'audio', 'streaming', 'real-time'],
    stack: ['Whisper', 'OpenAI', 'WebSockets', 'React', 'Web Audio API'],
    tech: ['Whisper', 'WebSockets', 'OpenAI'],
    role: 'Musician / Audio engineer',
    status: 'shipped',
    mode: 'gear5',
    priority: 1,
    sortOrder: 9,
    featured: false,
    coverUrl: '/assets/One-Piece/wanted/Brook.png',
    metrics: [
      { label: 'Bounty', value: '฿383,000,000' },
      { label: 'Devil Fruit', value: 'Yomi Yomi no Mi (Revive-Revive)' },
      { label: 'Dream', value: 'Reunite with Laboon at Reverse Mountain' },
    ],
    responsibilities: [
      'Stream every meeting through the Whisper proxy',
      'Soul-energy chord progressions for diarisation embeddings',
      'Yohohoho! at every successful test pass',
      'Carry the Rumbar Pirates\' song to Laboon (eventually)',
    ],
    outcomes: [
      'Defeated Big Pan, Ryuma, Zeus (assist)',
      'Released chart-topping albums as Soul King during timeskip',
      'Survived 50 years as a skeleton in the Florian Triangle',
    ],
    createdAt: daysAgo(120),
    updatedAt: daysAgo(35),
    heroImageAlt: "Brook the Soul King — Musician of the Straw Hat Pirates",
  },
  // ---------------------------------------------------------------------
  // 10. HELMSMAN — Jinbe (1,100,000,000 berries)
  // ---------------------------------------------------------------------
  {
    id: 'straw-hat-jinbe',
    slug: 'straw-hat-jinbe',
    title: 'Jinbe',
    subtitle: 'Helmsman · Knight of the Sea · Fish-Man Karate master',
    summary:
      "The whale-shark fish-man and former Warlord. Fish-Man Karate master, knight of the sea — backend orchestration with the calm of someone who has fought Big Mom alone.",
    description:
      "Jinbe — helmsman of the Straw Hats, former Warlord of the Sea, captain of the Sun Pirates. Whale-shark fish-man and master of Fish-Man Karate (which uses water itself as a weapon). Bounty: ฿1,100,000,000. Officially joined the crew at Wano after escaping Whole Cake Island.\n\nIn the portfolio metaphor: the senior backend / orchestration engineer — calm under pressure, decades of experience, fights Big Mom (production load) alone if needed. Steers the ship through the rough seas of distributed systems.",
    tags: ['helmsman', 'backend', 'orchestration', 'distributed-systems'],
    stack: ['Node.js', 'Supabase', 'Postgres', 'Redis', 'Kafka'],
    tech: ['Node.js', 'Postgres', 'Redis'],
    role: 'Helmsman / Backend lead',
    status: 'shipped',
    mode: 'gear5',
    priority: 2,
    sortOrder: 10,
    featured: false,
    coverUrl: '/assets/One-Piece/wanted/Jinbe.png',
    metrics: [
      { label: 'Bounty', value: '฿1,100,000,000' },
      { label: 'Style', value: 'Fish-Man Karate (Karakusagawara Seiken etc.)' },
      { label: 'Dream', value: 'Coexistence between fish-men and humans' },
    ],
    responsibilities: [
      'Steer the Thousand Sunny through every storm',
      'Fish-Man Karate for production load — water as weapon',
      'Honor the debt to Tiger and the Sun Pirates',
      'Mediate between crew members (and microservices)',
    ],
    outcomes: [
      'Survived a fight with Big Mom one-on-one',
      'Defeated Wadatsumi, Who\'s-Who',
      'Officially joined the Straw Hats at Wano',
    ],
    createdAt: daysAgo(110),
    updatedAt: daysAgo(40),
    heroImageAlt: "Jinbe — Helmsman of the Straw Hat Pirates, Knight of the Sea",
  },
];

// ===========================================================================
// Helper — returns the correct fixture array for the active mode.
// ===========================================================================
export function getFixturesForMode(mode: 'thor' | 'gear5'): Project[] {
  return mode === 'thor' ? THOR_FIXTURES : GEAR5_FIXTURES;
  // (Both arrays are tagged with `placeholder: true` at the bottom of this
  // file.  Round 75.)
}

// ===========================================================================
// Mode detection — classify any Project (fixture OR Supabase row) as
// belonging to the Thor (Marvel/Asgard) world or the Luffy (One Piece) world.
//
// We scan slug, title, subtitle, summary, and tags for signature keywords
// from each universe. Returns null for mode-neutral projects so they remain
// visible in both modes.
// ===========================================================================

const THOR_KEYWORDS = [
  'thor', 'asgard', 'asgardian', 'mjolnir', 'mjölnir', 'bifrost', 'bifröst',
  'stormbreaker', 'loki', 'yggdrasil', 'odin', 'valhalla', 'avengers',
  'avenger', 'marvel', 'mcu', 'midgard', 'jotunheim', 'ragnarok', 'heimdall',
  'sif', 'frigga', 'hela', 'wakanda', 'shield',
  // Extra Thor-mode signal words used by user-authored Supabase rows that
  // historically leaked into Luffy mode (Bifrost Pipeline carried "Nine
  // Realms" in its subtitle but no other strong Thor token; Asgard Codex
  // talked about "Norse" + "Asgard"; Stormbreaker CI relied solely on the
  // tool name). Adding these short signal words and the realm taxonomy makes
  // the heuristic robust even when the explicit `mode` column is absent.
  'nine realms', 'nine-realms', 'norse', 'realm', 'realms',
  'rune', 'runic', 'aesir', 'vanir', 'fenrir', 'valkyrie',
  'ragnarök',
];

const GEAR5_KEYWORDS = [
  'luffy', 'one-piece', 'one piece', 'straw-hat', 'straw hat', 'strawhat',
  'gear5', 'gear 5', 'nika', 'wano', 'mugiwara', 'pirate', 'devil-fruit',
  'devil fruit', 'haki', 'zoro', 'nami', 'sanji', 'usopp', 'chopper',
  'robin', 'franky', 'brook', 'jinbe', 'shanks', 'ace', 'sabo', 'oda',
  'grand-line', 'grand line', 'yonko', 'shichibukai', 'poneglyph',
  'den-den-mushi', 'den den mushi', 'berries', 'berry',
  // NOTE: 'bounty' was previously a Gear 5 keyword but it appears in Thor
  // copy too (e.g. CI test bounties). It now lives only in Gear 5 fixture
  // metric labels; the explicit `mode` field is the authoritative signal.
];

/**
 * Classify a project as belonging to the Thor world, the Gear 5 / One Piece
 * world, or neither (mode-neutral).
 *
 * Resolution order:
 *   1. Explicit `project.mode` field (set via admin UI or SQL).
 *   2. Keyword scan over slug + title + subtitle + summary + tags.
 *   3. `null` (neutral) when nothing matches.
 *
 * Thor keywords are checked BEFORE Gear 5 keywords so that ambiguous tokens
 * like "bounty" (which can appear in either universe) do not auto-classify a
 * Norse project as a One Piece one.
 */
export function getProjectMode(project: Project): 'thor' | 'gear5' | null {
  // 1. Explicit mode column wins over every heuristic.
  if (project.mode === 'thor' || project.mode === 'gear5') return project.mode;

  const haystack = [
    project.slug ?? '',
    project.title ?? '',
    project.subtitle ?? '',
    project.summary ?? '',
    ...(project.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();

  // 2. Thor keywords first — they are more specific (named characters,
  // realms, weapons). A Norse project never accidentally classifies as Gear 5.
  if (THOR_KEYWORDS.some((k) => haystack.includes(k))) return 'thor';
  if (GEAR5_KEYWORDS.some((k) => haystack.includes(k))) return 'gear5';
  return null;
}

/**
 * Filter a list of projects so only those matching the active mode are kept.
 *
 * - Projects clearly tagged with the active mode's keywords are included.
 * - Projects clearly tagged with the OTHER mode's keywords are excluded.
 * - Mode-neutral projects (no signature keywords) are included in both modes.
 *
 * If filtering would yield zero results (e.g. user has only neutral or
 * other-mode projects in Supabase), we fall back to the mode's fixture set
 * so the section never renders empty.
 */
export function filterProjectsByMode(
  projects: Project[],
  mode: 'thor' | 'gear5',
): Project[] {
  const filtered = projects.filter((p) => {
    const projectMode = getProjectMode(p);
    return projectMode === mode || projectMode === null;
  });
  if (filtered.length > 0) return filtered;
  return getFixturesForMode(mode);
}

// ---------------------------------------------------------------------------
// Round 75 — placeholder-tagged exports.  These are the canonical exports
// every consumer should use; the raw arrays above are intentionally not
// exported.  `placeholder: true` lets the admin "Include placeholder
// examples" toggle distinguish bundled fixtures from real Supabase rows
// at runtime, and lets <ProjectCard> draw a small "PLACEHOLDER" badge.
// ---------------------------------------------------------------------------
export const THOR_FIXTURES: Project[] = RAW_THOR_FIXTURES.map((p) => ({ ...p, placeholder: true }));
export const GEAR5_FIXTURES: Project[] = RAW_GEAR5_FIXTURES.map((p) => ({ ...p, placeholder: true }));

// ---------------------------------------------------------------------------
// Legacy default export — keep for any existing imports.
// Points to Thor fixtures (the original default theme).
// ---------------------------------------------------------------------------
export const projectFixtures: Project[] = THOR_FIXTURES;
