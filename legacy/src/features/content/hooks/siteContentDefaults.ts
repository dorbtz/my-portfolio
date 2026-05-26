/**
 * src/features/content/hooks/siteContentDefaults.ts
 *
 * Static fallback copy for the entire site. The CMS hook layers DB values on
 * top of these — so every field always has a value, even before the network
 * fetch resolves. Components prefer DB → defaults.
 *
 * IMPORTANT: when you add a new editable field in an admin page, add the
 * matching default here so the type contract holds and first paint is safe.
 *
 * Source of truth before this file existed:
 *   - Hero copy:     `src/components/Hero.tsx`
 *   - About copy:    `src/components/About.tsx`
 *   - Contact COPY:  `src/components/Contact.tsx`
 *   - Projects copy: `src/components/Projects.tsx`
 *   - Skills domains: `src/data/skills.ts` (SKILL_DOMAINS, FUTURE_REALMS)
 *
 * This file is intentionally pure data — no React imports — so it can be
 * consumed by the seed script (`scripts/seed-site-content.mjs`) as well.
 */

import { SKILL_DOMAINS, FUTURE_REALMS, FUTURE_ISLANDS } from '../../skills/data/skills';
import type { SiteSection, SiteMode } from '../types';

type DefaultsBag = Record<SiteSection, Record<SiteMode, Record<string, unknown>>>;

// --------------------------------------------------------------------------
// HERO — per mode
// --------------------------------------------------------------------------

export const HERO_DEFAULTS = {
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
} as const;

// --------------------------------------------------------------------------
// ABOUT — per mode
// --------------------------------------------------------------------------

export const ABOUT_DEFAULTS = {
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
} as const;

// --------------------------------------------------------------------------
// PROJECTS — per mode (the FOCUS_AREAS_BY_MODE bag + search/empty copy)
// --------------------------------------------------------------------------

export const PROJECTS_DEFAULTS = {
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
} as const;

// --------------------------------------------------------------------------
// CONTACT — per mode (mirrors the existing COPY object)
// --------------------------------------------------------------------------

export const CONTACT_DEFAULTS = {
  thor: {
    eyebrow: 'Bifrost direct line',
    title: 'Send Word to Asgard',
    sub: "Heimdall sees all. Drop a message — I’ll answer before the storm rolls in.",
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
    modelAlt: 'Den Den Luffy Gear 5 — animated messenger snail',
    modelCaption: 'Den Den Luffy Gear 5',
  },
} as const;

// --------------------------------------------------------------------------
// SKILLS — UNIFIED across modes (single source of truth, Yggdrasil + Grand Line
// both render from this same data). Stored in `shared`, not per-mode.
// --------------------------------------------------------------------------

export const SKILLS_DEFAULTS = {
  thor: {
    domains: SKILL_DOMAINS,
    futureRealms: FUTURE_REALMS,
    futureIslands: FUTURE_ISLANDS,
  },
  gear5: {
    domains: SKILL_DOMAINS,
    futureRealms: FUTURE_REALMS,
    futureIslands: FUTURE_ISLANDS,
  },
} as const;

// --------------------------------------------------------------------------
// ADMIN — per mode (Round 64 — Phase B of the hidden D-B-T admin entry).
//
// `secretSequence` is a list of 0-indexed character positions in the
// "DOR BEN TZUR" wordmark.  The default [0, 4, 8] resolves to D · B · T.
// `secretGapMs` is the maximum gap (ms) between consecutive sequence
// clicks before the buffer is reset.  Both modes share the same default
// — admins can diverge them later via the admin editor.
// --------------------------------------------------------------------------

export const ADMIN_DEFAULTS = {
  thor: {
    secretSequence: [0, 4, 8] as number[],
    secretGapMs: 1000,
  },
  gear5: {
    secretSequence: [0, 4, 8] as number[],
    secretGapMs: 1000,
  },
} as const;

// --------------------------------------------------------------------------
// Aggregated bag — what `useSiteContent()` reads from.
// --------------------------------------------------------------------------

export const siteContentDefaults: DefaultsBag = {
  hero: HERO_DEFAULTS,
  about: ABOUT_DEFAULTS,
  skills: SKILLS_DEFAULTS,
  projects: PROJECTS_DEFAULTS,
  contact: CONTACT_DEFAULTS,
  admin: ADMIN_DEFAULTS,
};
