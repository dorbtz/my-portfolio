/**
 * scripts/seed-site-content.mjs
 *
 * One-shot generator for `supabase/migrations/0006_seed_site_content.sql`.
 *
 * Reads the canonical defaults from
 *   src/features/content/hooks/siteContentDefaults.ts
 * via tsx/esbuild loader and emits an INSERT statement per (section, mode,
 * field) cell. The generated SQL is idempotent — uses ON CONFLICT DO NOTHING
 * — so re-running the migration after manual admin edits won't clobber them.
 *
 * Run:  node scripts/seed-site-content.mjs
 *
 * The skills domains/futureRealms are stored as a single shared row each
 * (mode IS NULL) — they're identical across both modes. Hero/About/Projects/
 * Contact copy is per-mode (separate row per mode).
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT = resolve(ROOT, 'supabase/migrations/0006_seed_site_content.sql');

// Inline a copy of the defaults instead of importing TS — keeps this script
// runnable as plain ESM without a TypeScript loader. Kept in lockstep with
// `src/features/content/hooks/siteContentDefaults.ts` (single source of truth
// at runtime is still that file; this is a transcription for the seed).

const HERO_DEFAULTS = {
  thor: {
    rotatingTitles: [
      'AI engineering · Asgardian polish',
      'LLM agents that actually ship',
      'RAG pipelines that strike true',
      'Cinematic frontends · Mjolnir-grade craft',
    ],
    paragraphPrefix:
      "LLM agents, RAG pipelines, and cinematic frontends — engineered with the discipline of an Asgardian smith. Right now I'm deep into ",
    paragraphSuffix: '— ready for senior roles & contracts.',
    cta1Label: '⚡ VIEW WORK',
    cta2Label: '⚡ HIRE ME',
    statSpecialtyLabel: 'Specialty',
    statSpecialtyValue: 'AI + LLM apps',
    statSpecialtyDetail: 'Agents, RAG, evals, vector search, OpenAI/Anthropic SDKs.',
    statStackLabel: 'Stack',
    statStackValue: 'React · TS · Supabase',
    statStackDetail: 'Edge-ready builds with sub-200ms INP and 95+ Lighthouse.',
    statAvailabilityLabel: 'Availability',
    statAvailabilityValue: 'Q2 2026',
    statAvailabilityDetail: 'Remote + Tel Aviv. Senior roles & contracts.',
    modeToggleLabel: 'Thor mode',
    modeToggleActiveValue: 'Engaged',
    modeToggleDormantValue: 'Resting',
    modeToggleActiveDetail: 'Storm FX are live. Tap to silence the thunder.',
    modeToggleDormantDetail: 'Storm dormant. Tap to summon the lightning.',
    latestDropLabel: 'Latest drop',
    latestDropFallbackTitle: 'Coming soon',
    latestDropFallbackDetail: 'Fresh work is in production. Stay tuned.',
  },
  gear5: {
    rotatingTitles: [
      'AI engineering at Gear 5 velocity',
      'Sun God of LLM workflows',
      'Awakened front-end · joy of use',
      'Building like a Pirate King',
    ],
    paragraphPrefix:
      "Like Luffy at Gear 5, I build with joy and impossible velocity. AI agents, real-time UIs, frontend that flies. Right now I'm stretching into ",
    paragraphSuffix: "— let's build something legendary.",
    cta1Label: 'SET SAIL →',
    cta2Label: 'JOIN MY CREW →',
    statSpecialtyLabel: 'Specialty',
    statSpecialtyValue: 'AI + LLM apps',
    statSpecialtyDetail: 'Agents, RAG, evals, vector search, OpenAI/Anthropic SDKs.',
    statStackLabel: 'Stack',
    statStackValue: 'React · TS · Supabase',
    statStackDetail: 'Edge-ready builds with sub-200ms INP and 95+ Lighthouse.',
    statAvailabilityLabel: 'Availability',
    statAvailabilityValue: 'Q2 2026',
    statAvailabilityDetail: 'Remote + Tel Aviv. Senior roles & contracts.',
    modeToggleLabel: 'Gear 5',
    modeToggleActiveValue: 'Awakened',
    modeToggleDormantValue: 'Dormant',
    modeToggleActiveDetail: 'Joy is the ultimate weapon. Tap to rest.',
    modeToggleDormantDetail: 'Sun God Nika sleeps. Tap to awaken Gear 5.',
    latestDropLabel: 'Latest drop',
    latestDropFallbackTitle: 'Coming soon',
    latestDropFallbackDetail: 'Fresh work is in production. Stay tuned.',
  },
};

const ABOUT_DEFAULTS = {
  thor: {
    panel1Kicker: 'THE BEGINNING',
    panel1Caption: 'Every hero has an origin. Mine had a blinking cursor.',
    panel1Body1:
      'One line of code. Hello, world. A question I couldn’t unhear: "What if I could make the screen do anything?" Whosoever holds that question, if they be patient enough, shall possess the power.',
    panel1Body2:
      'From scrappy HTML pages to full-stack apps shipping to real users — the obsession never changed, only the tools. The dream was always to build something people love to use.',
    panel2Kicker: 'THE TRAINING MONTAGE',
    panel2Caption: 'Mt. Colubo was a metaphor. The grind was real.',
    panel2Body1:
      'React, TypeScript, Node, then deeper — Postgres internals, GLSL shaders, accessibility specs at 2 AM. Every framework a new gear. Every paradigm a new transformation. Gear 2 was speed. Gear 3 was scale.',
    panel2Body2:
      'Then the LLM wave hit. RAG pipelines, agent orchestration, evals, vector search. Gear 4 unlocked. Suddenly the screen could think back.',
    panel3Kicker: 'THE FIRST BATTLE',
    panel3Caption: 'Production. Real users. No respawn.',
    panel3Body1:
      'First feature in front of real users — a real-time collab layer that had to work on day one. It did. Then a 3 AM page: a query timeout under load. Welcome to production. Welcome to the Grand Line.',
    panel3Body2:
      'Lesson learned: performance is a feature, error states are first-class citizens, and every screen deserves a keyboard. Mjolnir doesn’t fly itself.',
    panel4Kicker: 'THE CREW',
    panel4Caption: 'No Pirate King sails alone. No Avenger flies solo.',
    panel4Body1:
      'Designers, PMs, ML engineers, infra wizards — the Straw Hats of every project. Pairing with brilliant people on hard problems is the whole point. Code reviews are how we lift each other’s craft.',
    panel4Body2:
      'Collaboration is the real superpower. Mjolnir is just the delivery mechanism. Gum-Gum-Bazooka, but for shipping features.',
    panel5Kicker: "WHAT'S NEXT",
    panel5Caption: 'The thunder never stops.',
    panel5Body1:
      'Building AI-powered products where Asgardian engineering polish meets agent-grade reasoning. RAG over your data, LLM agents that ship, R3F scenes that ship, design systems that scale.',
    panel5Body2:
      'Open to senior roles & contracts. If the challenge is worthy of Mjolnir, reach out.',
    burst1: 'CRUNCH!',
    burst2: 'EUREKA!',
    burst3: 'POW!',
  },
  gear5: {
    panel1Kicker: 'THE BEGINNING',
    panel1Caption: 'Every hero has an origin. Mine had a blinking cursor.',
    panel1Body1:
      'One line of code. Hello, world. A question I couldn’t unhear: "What if I could make the screen do anything?" Whosoever holds that question, if they be patient enough, shall possess the power.',
    panel1Body2:
      'From scrappy HTML pages to full-stack apps shipping to real users — the obsession never changed, only the tools. The dream was always to build something people love to use.',
    panel2Kicker: 'THE TRAINING MONTAGE',
    panel2Caption: 'Mt. Colubo was a metaphor. The grind was real.',
    panel2Body1:
      'React, TypeScript, Node, then deeper — Postgres internals, GLSL shaders, accessibility specs at 2 AM. Every framework a new gear. Every paradigm a new transformation. Gear 2 was speed. Gear 3 was scale.',
    panel2Body2:
      'Then the LLM wave hit. RAG pipelines, agent orchestration, evals, vector search. Gear 4 unlocked. Suddenly the screen could think back.',
    panel3Kicker: 'THE FIRST BATTLE',
    panel3Caption: 'Production. Real users. No respawn.',
    panel3Body1:
      'First feature in front of real users — a real-time collab layer that had to work on day one. It did. Then a 3 AM page: a query timeout under load. Welcome to production. Welcome to the Grand Line.',
    panel3Body2:
      'Lesson learned: performance is a feature, error states are first-class citizens, and every screen deserves a keyboard. Mjolnir doesn’t fly itself.',
    panel4Kicker: 'THE CREW',
    panel4Caption: 'No Pirate King sails alone. No Avenger flies solo.',
    panel4Body1:
      'Designers, PMs, ML engineers, infra wizards — the Straw Hats of every project. Pairing with brilliant people on hard problems is the whole point. Code reviews are how we lift each other’s craft.',
    panel4Body2:
      'Collaboration is the real superpower. Mjolnir is just the delivery mechanism. Gum-Gum-Bazooka, but for shipping features.',
    panel5Kicker: "WHAT'S NEXT",
    panel5Caption: '— ギア5覚醒 —',
    panel5Body1:
      '覚醒。 Gear 5 unlocked. Building AI-powered products that ship at impossible speed — RAG, agents, evals, frontend that flies. The next arc is all about joy of use.',
    panel5Body2:
      "If your product needs Sun God-level craft and AI-grade velocity — let's build something legendary.",
    burst1: 'ドン!',
    burst2: 'ボン!',
    burst3: 'DON!',
  },
};

const PROJECTS_DEFAULTS = {
  thor: {
    searchPlaceholder: 'Search the realms — Mjolnir, Bifrost, Asgard…',
    focusAreas: ['Asgard', 'Bifrost ops', 'Mjolnir-grade UI'],
    emptyState:
      'No projects match that search just yet. Try another keyword or reach out for a bespoke walkthrough.',
  },
  gear5: {
    searchPlaceholder: 'Search the crew — Luffy, Zoro, bounty…',
    focusAreas: ['Captain & crew', 'Grand Line voyages', 'Wanted bounties'],
    emptyState:
      'No projects match that search just yet. Try another keyword or reach out for a bespoke walkthrough.',
  },
};

const CONTACT_DEFAULTS = {
  thor: {
    eyebrow: 'Bifrost direct line',
    title: 'Send Word to Asgard',
    sub: 'Heimdall sees all. Drop a message — I’ll answer before the storm rolls in.',
    nameLabel: 'Your name',
    namePlaceholder: 'Wanderer of the realms',
    emailLabel: 'Your email',
    emailPlaceholder: 'midgard@example.com',
    messageLabel: 'Your message',
    messagePlaceholder: 'What does the realm need today?',
    submit: 'Open the Bifrost',
    sending: 'Opening Bifrost…',
    success: 'Message reached Asgard. Heimdall has eyes on it.',
    modelAlt: 'Heimdall — guardian of the Bifrost',
    modelCaption: 'Heimdall · The All-Seeing',
  },
  gear5: {
    eyebrow: 'Den Den Mushi line',
    title: 'Call the Captain',
    sub: 'Pick up the snail. Drop a message — answered between heists across the Grand Line.',
    nameLabel: 'Your name',
    namePlaceholder: 'Pirate alias',
    emailLabel: 'Your email',
    emailPlaceholder: 'crew@grand-line.example',
    messageLabel: 'Your message',
    messagePlaceholder: 'Spill the bounty…',
    submit: 'Send the transmission',
    sending: 'Pururururu…',
    success: 'Message received. Captain will get back to you.',
    modelAlt: 'Doflamingo Den Den Mushi — 3D messenger snail',
    modelCaption: 'Doflamingo Den Den Mushi',
  },
};

// SQL escape: wrap in single quotes, double-up internal quotes.
function sqlString(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}
function sqlJsonb(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

const inserts = [];

function emit(section, mode, field, value) {
  const modeLit = mode === null ? 'NULL' : sqlString(mode);
  inserts.push(
    `INSERT INTO public.site_content (section, mode, field, value) ` +
    `VALUES (${sqlString(section)}, ${modeLit}, ${sqlString(field)}, ${sqlJsonb(value)}) ` +
    `ON CONFLICT (section, mode, field) DO NOTHING;`,
  );
}

// We need a separate path for the "shared" (mode IS NULL) rows because
// Postgres treats NULL as distinct in a multi-column UNIQUE — those upserts
// must target the partial unique index `(section, field) WHERE mode IS NULL`.
function emitUnified(section, field, value) {
  inserts.push(
    `INSERT INTO public.site_content (section, mode, field, value) ` +
    `VALUES (${sqlString(section)}, NULL, ${sqlString(field)}, ${sqlJsonb(value)}) ` +
    `ON CONFLICT (section, field) WHERE mode IS NULL DO NOTHING;`,
  );
}

for (const [mode, bag] of Object.entries(HERO_DEFAULTS)) {
  for (const [field, value] of Object.entries(bag)) emit('hero', mode, field, value);
}
for (const [mode, bag] of Object.entries(ABOUT_DEFAULTS)) {
  for (const [field, value] of Object.entries(bag)) emit('about', mode, field, value);
}
for (const [mode, bag] of Object.entries(PROJECTS_DEFAULTS)) {
  for (const [field, value] of Object.entries(bag)) emit('projects', mode, field, value);
}
for (const [mode, bag] of Object.entries(CONTACT_DEFAULTS)) {
  for (const [field, value] of Object.entries(bag)) emit('contact', mode, field, value);
}

// Skills are unified (single source of truth, both modes render from the same
// data). The skills.ts arrays themselves are large — we only seed a metadata
// row that confirms the table is initialized; the real data continues to live
// in src/data/skills.ts and is pushed to the DB only when an admin explicitly
// edits a domain (the SkillsContentAdmin page handles that). This keeps the
// seed migration small and avoids duplicating ~5 KB of constants in SQL.
emitUnified('skills', 'seedMarker', { initialized: true, source: 'src/data/skills.ts' });

const sql =
  `-- =============================================================================\n` +
  `-- 0006_seed_site_content.sql\n` +
  `-- =============================================================================\n` +
  `-- Auto-generated by scripts/seed-site-content.mjs.\n` +
  `-- Re-run that script if the canonical defaults in\n` +
  `--   src/features/content/hooks/siteContentDefaults.ts\n` +
  `-- change, then re-apply this migration.\n` +
  `--\n` +
  `-- Idempotent: ON CONFLICT DO NOTHING — never overwrites admin edits.\n` +
  `-- =============================================================================\n` +
  `\n` +
  `BEGIN;\n\n` +
  inserts.join('\n') +
  `\n\nCOMMIT;\n`;

writeFileSync(OUT, sql, 'utf8');
console.log(`[seed-site-content] Wrote ${inserts.length} INSERTs → ${OUT}`);
