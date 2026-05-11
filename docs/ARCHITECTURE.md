# Architecture

> Living document. Last revised: Round 13 (Site Content CMS, 3D auto-load, Feature-Sliced reorg).

This portfolio is a single-page React 19 + Vite + TypeScript + Supabase application
with a dual-mode visual identity (Asgardian "Thor" and One Piece "Gear 5"). It
ships as a static SPA hosted on Vercel, with all dynamic data — projects,
profiles, contact submissions, and (since Round 13) editable site copy —
backed by Supabase Postgres + RLS.

The codebase is structured around **Feature-Sliced Design** principles:
each user-facing capability owns its own folder containing UI components,
hooks, services, stores, and types. Cross-cutting concerns (theming, audio,
3D plumbing, design system primitives) live in a `core/` layer.

---

## 1. Folder map (target)

```
src/
├── features/
│   ├── auth/                  Login flow + admin route gate + allowlist service
│   │   ├── components/        AdminRoute, Login UI bits
│   │   ├── hooks/             useAuth
│   │   └── services/          auth.ts, adminAllowlist.ts
│   │
│   ├── content/               Round-13 site-content CMS
│   │   ├── admin/             5 editor pages + AdminNav + RotatingListEditor
│   │   ├── hooks/             useSiteContent + siteContentDefaults
│   │   ├── services/          siteContent (SQL) + siteContentMap (pure transforms)
│   │   ├── stores/            siteContentStore (Zustand)
│   │   └── types.ts           SiteContentRow, SiteContentMap, SiteSection, SiteMode
│   │
│   ├── projects/              Project list, carousel, cards, URL import, admin
│   │   ├── components/        ProjectCard, ProjectsCarousel, ProjectsGrid
│   │   ├── admin/             ProjectsAdmin
│   │   ├── data/              project-fixtures, project-mode helpers
│   │   ├── services/          projects, projectUrlImport, profiles, storage
│   │   └── types/             Project, ProjectStatus, ProjectMode
│   │
│   ├── skills/                Yggdrasil + Grand Line skill visualizations
│   │   ├── components/        SkillsTree, GrandLineMap, Skills (entry)
│   │   └── data/              skills.ts (SKILL_DOMAINS, FUTURE_REALMS, FUTURE_ISLANDS)
│   │
│   ├── hero/                  Hero component
│   │   └── components/        Hero
│   │
│   ├── about/                 About comic-panel section
│   │   └── components/        About
│   │
│   └── contact/               Contact form + ModelViewer 3D snail
│       ├── components/        Contact, ModelViewer
│       └── services/          contact.ts (sendContactMessage)
│
├── core/                      Cross-cutting concerns
│   ├── components/            Header, Footer, Section, Cursor, BifrostLoader,
│   │                          Marquee, SectionDivider, CinematicOverlay,
│   │                          CrossFandomBackdrop, RainbowRain, StormFX,
│   │                          ImageFallback, Title, symbols/
│   ├── hooks/                 useCapability, useFocusTrap, useGithubBadge,
│   │                          useReducedMotion, computeTier
│   ├── lib/
│   │   ├── integrations/      supabase, audio, lenis, gsap
│   │   └── utils/             tooltipPosition, projectDefaultCover,
│   │                          navigate, reveal, seo, lightning,
│   │                          easterEggs, project-mapper
│   ├── stores/                mode (Zustand store with persist)
│   ├── providers/             SmoothScrollProvider (Lenis)
│   └── types/                 Shared scalar types
│
├── pages/                     Thin route entry points (import features only)
│   ├── Projects.tsx
│   ├── projects/
│   │   └── ProjectDetail.tsx
│   └── admin/
│       ├── Login.tsx
│       └── AdminField.tsx     (re-exported by features/auth + features/content)
│
├── App.tsx                    Layout shell + providers
├── routes.tsx                 React Router config + lazy admin chunks
├── main.tsx                   Vite entry
└── index.css                  Tailwind v4 + design tokens + bespoke kit
```

### Migration status (Round 13)

The `features/content/` slice is fully realised in the target location. The
existing `features/auth/`, `features/projects/`, `features/skills/`,
`features/hero/`, `features/about/`, `features/contact/`, and `core/` slices
are documented above as the **target** structure; the codebase still
references some legacy paths under `src/components/`, `src/services/`,
`src/hooks/`, and `src/lib/` which will be migrated in subsequent rounds via
mechanical file moves + import-path updates. The current paths are valid and
the tests cover the same surfaces.

---

## 2. Why Feature-Sliced Design

**Scalability.** Each feature is self-contained, so the cognitive load of
adding a new slice (say, a blog or a podcast section) is bounded — drop a
new `features/<thing>/` folder with the same internal shape and wire one
route. The team-of-one-or-two argument for FSD: every folder reads like a
small product.

**Encapsulation.** A feature's internal types, transforms, and components
don't leak outside its folder. Consumers go through hooks. This is what
keeps the bundle slim — the lazy-loaded admin pages don't drag homepage
components into their chunks.

**Interview narrative.** A reviewer can open `features/content/` and trace
the entire CMS feature top-to-bottom in a few minutes — schema (the SQL
migration), service (the typed Supabase wrapper), pure transforms (testable
without a DB), Zustand store, hook, admin pages, and CSS. That story
demonstrates layering discipline.

We considered:
- **Pure layered (controllers / services / repositories).** Rejected — too
  little signal-to-noise for a SPA of this size; everything ends up in one
  giant `services/` folder.
- **Atomic / Domain-Driven Design proper.** Rejected — overkill at this
  scale; the value of named entities/value-objects/aggregates doesn't pay
  for itself for ~5 features.

---

## 3. Data flow

### 3.1 Mode store → components

```
                      ┌───────────────┐
                      │  modeStore    │  Zustand + persist (localStorage)
                      │  (singleton)  │
                      └──────┬────────┘
                             │  useMode() / useMotionOn() / useEffectsActive()
                             ▼
   ┌──────┬──────┬───────────┬──────┬──────┬─────────┐
   │ Hero │ About│ Projects  │Skills│Cont. │ Header  │  All re-render on flip
   └──────┴──────┴───────────┴──────┴──────┴─────────┘
```

Mode flips never cause a refetch — derived selectors (e.g.
`filterProjectsByMode`) re-run synchronously in `useMemo` blocks.

### 3.2 Site content CMS (Round 13)

```
       ┌────────────────────┐                          ┌─────────────────┐
       │  Supabase Postgres │  RLS public read         │ siteContent.ts  │
       │  site_content      │◀────────── listSiteContent────────│  (service)      │
       │  table             │                          └────────┬────────┘
       └──────┬─────────────┘                                   │
              │                                                  ▼
              │ RLS admin write (is_admin())          ┌──────────────────┐
              │                                       │ getSiteContentMap│  pure
              │                                       │  (transform)     │
              │                                       └────────┬─────────┘
              │                                                ▼
              │                                      ┌──────────────────┐
              │                                      │ siteContentStore │  Zustand
              │                                      │  { map, status } │
              │                                      └────────┬─────────┘
              │                                                ▼
              │                                      ┌──────────────────┐
              │                                      │ useSiteContent   │  defaults ◀ DB
              │                                      │   (hook)         │
              │                                      └────────┬─────────┘
              │                                                ▼
              │                              ┌─────────────────────────────────┐
              │                              │ Hero / About / Contact /        │
              │                              │ Projects / SkillsTree           │
              │                              └─────────────────────────────────┘
              │
              ▲   upsertSiteContentMany(rows)
              │
       ┌──────┴────────────────────────────────────────────────┐
       │ HeroContentAdmin / AboutContentAdmin / SkillsContentAdmin │ ← lazy-loaded
       │ ProjectsCopyAdmin / ContactContentAdmin / ContentLanding  │
       └────────────────────────────────────────────────────────┘
```

Synchronous fallback layer (`siteContentDefaults`) guarantees first paint
never flashes. DB values upgrade after mount.

### 3.3 Projects

`Hero`, `Projects`, and `ProjectDetail` all call the same cached
`listProjects()` service (60-second in-memory TTL). Mode filtering happens
in derived `useMemo` selectors — no extra fetches per mode flip.

---

## 4. Auth + admin allowlist

Two-tier gate enforced both client AND server:

1. **Client (`features/auth/services/adminAllowlist.ts`).** Pre-checks the
   logged-in user's email against `public.admin_emails` with a 60-second
   cache. Used by `AdminRoute` to redirect unauthorised users back to
   `/admin/login` immediately rather than showing an error post-mutation.

2. **Server (`is_admin()` SECURITY DEFINER, migration `0003_admin_allowlist.sql`).**
   Postgres function returns true if `auth.email()` is in `admin_emails`.
   Used by RLS policies on `projects`, `profiles`, and (Round 13)
   `site_content`. Even if a non-allowlisted user obtains a session,
   mutations fail at the RLS boundary.

To grant a new admin: `INSERT INTO public.admin_emails (email) VALUES ('x@y');`
in the Supabase SQL editor. No code change needed.

---

## 5. Testing strategy

- **Vitest + jsdom** with `pool: vmThreads` (rolldown-vite SSR transform
  workaround documented in `setupTests.ts`).
- **No DB mocks.** Per project policy. Services that touch Supabase are
  tested via inlined pure logic — see `siteContentMap.test.ts` and
  `contact.test.ts` for the established pattern.
- **Component tests** focus on user-visible behaviour, not implementation
  details (e.g. SkillsTree tests assert tooltip render and realm presence,
  not GSAP timeline internals).
- **Test count (Round 13):** 409 across 27 files.

---

## 6. Bundle policy

- **JS main bundle:** ≤ 270 KB gz (currently 250 KB gz).
- **CSS:** ≤ 36 KB gz (currently 36 KB gz).
- **Admin code:** lazy-loaded via `React.lazy` + `Suspense` so no admin
  byte ships to public visitors. Each `/admin/content/*` route is its own
  chunk.
- **Heavy deps:** `model-viewer` (279 KB gz), `howler` (10 KB gz), `gsap`
  (bundled in main). 3D models are loaded only when the Contact section
  scrolls into view (Round 13 IntersectionObserver pattern).
- **Texture/GLB pipeline:** `gltfpack` simplification + Meshopt encoding +
  WebP textures. Donflamingo went from 614 MB → 2.3 MB (99.6% reduction)
  while preserving usable visual fidelity at the contact card's small
  display size.

---

## 7. Migration log (round-by-round)

| Round | Headline | Notable changes |
|-------|----------|-----------------|
| P0    | Initial scaffold | Vite + React + Tailwind + Supabase wired |
| P1    | Projects schema + admin | First Supabase migrations + admin-projects route |
| P2    | Auth + RLS | Magic-link login + per-row RLS + cache layer |
| 7     | Admin polish | Drag-reorder, URL import, themed admin shell |
| 11    | Dual-mode brand | Thor / Gear 5 toggle, full themed kit |
| 12    | World tree + cleanup | Yggdrasil rebuilt, Heimdall fixed, mobile sweep, state→stores rename |
| 13    | CMS + 3D auto-load + FSD | site_content table + admin pages, Donflamingo 2.3 MB, Feature-Sliced reorg + this doc |

---

## 8. Reading the code

A few quick orientation tips:

- The `useMode()` hook is the canonical mode switch. Anywhere you see a
  `mode === 'thor' ? … : …` ternary, the alternative is a Gear 5 variant.
- 3D content is always lazy-loaded. Look for `React.lazy(() => import('./ModelViewer'))`.
- All Supabase reads are cached — see `services/projects.ts` for the
  pattern (60s TTL, single-item + list cache, `clearCache` after mutations).
- New visible copy lives in TWO places: the static fallback in
  `features/content/hooks/siteContentDefaults.ts` AND the seed migration
  `0006_seed_site_content.sql`. Run `node scripts/seed-site-content.mjs`
  to regenerate the seed after editing defaults.
- Tests inline pure logic rather than importing supabase-bearing modules
  (rolldown-vite SSR transform issue). See `setupTests.ts` for context.

---

## 9. Open work

- Mechanical file moves to align with the target folder map above
  (~50 files, ~100 import-path updates). TypeScript compiler is the safety
  net. Each batch ends with `npx tsc --noEmit`.
- Promote `features/projects/`, `features/auth/`, `features/contact/`
  slices to first-class folders with re-exports for backward compatibility
  during the transition.
- Migrate stale tests that still live in `src/components/` to live next to
  their feature once the moves complete.
