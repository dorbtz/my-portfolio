# SPEC.md — Portfolio v2

> Living source of truth for the Portfolio v2 rebuild. Updated **before** every milestone, never after. If code disagrees with this document, the code is wrong.
>
> **Status:** Draft (M0 in progress)
> **Owner:** Dor Ben Tzur
> **Last updated:** 2026-05-26
> **Approval gate:** Sign-off on this file is required before M1 begins.

---

## Table of contents

1. [Vision & positioning](#1-vision--positioning)
2. [Goals & non-goals](#2-goals--non-goals)
3. [Information architecture](#3-information-architecture)
4. [Design system — Apple Liquid Glass](#4-design-system--apple-liquid-glass)
5. [Theme system](#5-theme-system)
6. [Content model (Supabase)](#6-content-model-supabase)
7. [Resume content](#7-resume-content)
8. [Projects seed](#8-projects-seed)
9. [AI architecture](#9-ai-architecture)
10. [Auth & admin](#10-auth--admin)
11. [Performance budgets](#11-performance-budgets)
12. [Accessibility](#12-accessibility)
13. [Environment variables](#13-environment-variables)
14. [i18n & RTL](#14-i18n--rtl)
15. [Deployment](#15-deployment)
16. [Open questions / TBD](#16-open-questions--tbd)

---

## 1. Vision & positioning

### Elevator pitch
**Dor Ben Tzur — Full-Stack & AI Engineer.** A portfolio that doesn't just *describe* AI work; it *runs* it. The site is a live demonstration of modern web architecture: Apple Liquid Glass design, streaming RAG chatbot, multi-provider AI Gateway routing, and a privately-observed performance dashboard you can show recruiters in real time. Two playful themes (Thor, Luffy) sit behind the default High-Tech experience for those who want to discover them.

### Audience (in priority order)
1. **AI-focused hiring managers & technical recruiters** scanning portfolios for signals of real shipping ability with modern AI stacks.
2. **Engineering peers** evaluating depth (architecture, performance, accessibility).
3. **Collaborators / clients** looking for someone who can ship end-to-end.
4. **Curious visitors** who appreciate the playful themes / easter eggs.

### Brand voice for the default High-Tech theme
- Confident, restrained, technical. Sentences earn their length.
- Avoids buzzwords ("synergy", "leverage", "transform"). Names the actual stack and the actual outcome.
- First-person singular ("I built X"). No corporate "we".

### What makes this portfolio different
- **The site is also a portfolio piece.** It uses every technology it claims expertise in.
- **Three themes, one data layer.** Hot-swap Apple Glass → Asgardian → Pirate without a page reload, without losing context, without forking content.
- **An AI co-pilot that knows the site.** RAG over projects/about/skills, citation-style answers, scoped refusals.
- **A public `/status` page.** Live Web Vitals, build status, AI spend — anyone can verify the engineering claims.

---

## 2. Goals & non-goals

### Goals
- **G1.** Land the message "I ship modern AI/full-stack" within 5 seconds of page load (mobile p75 LCP ≤ 1.5s).
- **G2.** Be readable + usable on iPhone SE (320px viewport) in every theme.
- **G3.** Demonstrate AI integration that recruiters can actually try: chatbot, recommender, playground.
- **G4.** Lighthouse: ≥95 Performance, 100 Accessibility, 100 Best Practices, ≥95 SEO on every public route.
- **G5.** SPEC.md remains accurate; every architectural decision in the codebase is traceable to a section here.

### Non-goals (explicit)
- Full professional Hebrew translation reviewed by a human — HE mode is AI-generated *fun* mode, labeled as such.
- Locales beyond EN + HE.
- SSR'd Thor / Luffy themes (bots and SEO see High-Tech only).
- Mobile native app, e-commerce, payments, multi-tenant editing, third-party API.
- Auto-pulling repos from GitHub — projects are curated manually.
- Migrating the 7 existing contact messages into v2's inbox UI.

---

## 3. Information architecture

```
dorbtz.com
├─ /                         Home (Hero · About · Projects · Skills · Contact — single-page scroll)
├─ /projects                 Full projects index (filterable)
├─ /projects/[slug]          Project detail (ISR)
├─ /case-studies             MDX long-form index
├─ /case-studies/[slug]      MDX case study
├─ /playground               3 live AI demos
├─ /resume                   Server-rendered PDF + JSON-LD Person schema
├─ /status                   PUBLIC live perf dash
├─ /admin                    Dashboard hub (auth required)
│  ├─ /admin/content         CRUD: projects, skills, sections
│  ├─ /admin/messages        Contact inbox + AI classification
│  ├─ /admin/health          Internal observability (superset of /status)
│  ├─ /admin/mcp             Chatbot tool catalog (read-only)
│  └─ /admin/account         Magic-link / password / username settings
└─ /admin/login              Auth surface (public)

Floating overlays (every public route):
  · ThemeSwitcher    (top-right)
  · LangSwitcher     (top-right, next to ThemeSwitcher)
  · Chatbot          (bottom-right; collapsed by default)
```

**Sitemap & robots:**
- `/sitemap.xml` auto-generated from routes + Supabase project slugs.
- `/robots.txt` allows all public routes; disallows `/admin/*` and `/api/*`.

**OpenGraph / Twitter cards:**
- Per-route OG image (dynamic via `@vercel/og`): home → branded glass card with name + tagline; project pages → cover + title overlay.

---

## 4. Design system — Apple Liquid Glass

### Type scale
| Token | Size (px) | Line height | Weight | Usage |
|---|---|---|---|---|
| `--text-display` | 64 (clamp 40→64) | 1.05 | 700 | Hero headline |
| `--text-h1` | 40 (clamp 30→40) | 1.1 | 700 | Section titles |
| `--text-h2` | 28 (clamp 22→28) | 1.2 | 600 | Card titles |
| `--text-h3` | 20 | 1.3 | 600 | Sub-titles |
| `--text-body` | 17 | 1.55 | 400 | Body copy |
| `--text-body-sm` | 15 | 1.5 | 400 | Secondary body |
| `--text-caption` | 13 | 1.4 | 500 | Captions, meta |

Fonts: **Geist Sans** (UI + body), **Geist Mono** (code), **Inter Tight** fallback. Self-hosted via `next/font` (no Google Fonts request at runtime).

### Spacing scale (4px base)
`--space-1`=4 · `-2`=8 · `-3`=12 · `-4`=16 · `-5`=24 · `-6`=32 · `-7`=48 · `-8`=64 · `-9`=96 · `-10`=128

### Radius
`--radius-sm`=8 · `--radius-md`=14 · `--radius-lg`=22 · `--radius-xl`=32 · `--radius-pill`=999

### Glass surface tokens (per theme + scheme)
| Token | Purpose |
|---|---|
| `--glass-bg` | Translucent fill (e.g. `rgba(255,255,255,0.55)` light, `rgba(20,22,28,0.55)` dark) |
| `--glass-border` | 1px inner highlight border |
| `--glass-blur` | `backdrop-filter: blur(20px) saturate(180%)` |
| `--glass-shadow` | Soft elevated shadow |
| `--glass-vibrancy` | Per-theme tint that bleeds through the blur |

### Motion (spring physics — `motion/react`)
| Token | Stiffness | Damping | Mass | Usage |
|---|---|---|---|---|
| `--spring-snap` | 380 | 32 | 0.8 | Buttons, toggles |
| `--spring-glide` | 220 | 28 | 1.0 | Cards, page enters |
| `--spring-soft` | 140 | 22 | 1.2 | Background drifts |

Honors `prefers-reduced-motion: reduce` — all motion above this threshold becomes a 120ms opacity fade only.

### Breakpoints (mobile-first)
| Token | Width | Notes |
|---|---|---|
| baseline | 320px | iPhone SE — every layout MUST work at this width |
| `sm` | 480px | Larger phones |
| `md` | 768px | Tablets / large phones landscape |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Standard desktop |
| `2xl` | 1536px | Large desktop |

**Mandatory at 320px:** all text ≥ 15px, all tap targets ≥ 44×44px, no horizontal overflow, no clipped glass corners, no overlapping floating widgets.

### High-Tech theme tokens (default)
| Token | Light | Dark |
|---|---|---|
| `--accent` | `#7C3AED` (deep violet) | `#00D4FF` (electric cyan) |
| `--bg` | `#F7F8FA` | `#0B0D12` |
| `--text` | `#0B0D12` | `#F7F8FA` |
| `--text-muted` | `#5B6172` | `#A1A6B3` |
| `--glass-bg` | `rgba(255,255,255,0.55)` | `rgba(20,22,28,0.55)` |
| `--glass-vibrancy` | `rgba(124,58,237,0.10)` | `rgba(0,212,255,0.08)` |

### Thor theme tokens
| Token | Light | Dark |
|---|---|---|
| `--accent` | `#0A4DFF` (Bifrost blue) | `#F5C518` (Mjolnir gold) |
| `--bg` | `#EEF1F8` | `#0A0F1E` |
| `--text` | `#0A0F1E` | `#F5F7FF` |
| `--glass-vibrancy` | `rgba(10,77,255,0.10)` | `rgba(245,197,24,0.10)` |

### Luffy theme tokens
| Token | Light | Dark |
|---|---|---|
| `--accent` | `#D90429` (Wanted red) | `#FFC60B` (Sunny yellow) |
| `--bg` | `#FFFBE8` (parchment) | `#1A0F08` |
| `--text` | `#1A0F08` | `#FFFBE8` |
| `--glass-vibrancy` | `rgba(217,4,41,0.08)` | `rgba(255,198,11,0.10)` |

All text/background combinations validated at WCAG AAA (contrast ≥ 7:1) in both schemes.

---

## 5. Theme system

### State model
Two independent values, both persisted:
- `theme` ∈ `hightech` | `thor` | `luffy` (default: `hightech`)
- `colorScheme` ∈ `auto` | `light` | `dark` (default: `auto` → follows OS via `prefers-color-scheme`)
- `locale` ∈ `en` | `he` (default: `en`) — see §14

Persistence:
1. **Cookie** `pf-theme`, `pf-scheme`, `pf-locale` (SameSite=Lax, 1 year) — readable in Server Components for SSR-correct first paint.
2. **localStorage** mirror for instant client-side reads.

### Render strategy (no flash)
1. Root layout reads cookies (Server Component).
2. Sets `<html data-theme="…" data-scheme="…" lang="…" dir="…">` on the server.
3. CSS uses `[data-theme="hightech"][data-scheme="dark"] { … }` selectors keyed on those attributes.
4. Theme switcher client-side updates cookie + DOM attribute + localStorage in one transaction.

### Per-theme effects (dynamically imported)
| Theme | Module | Triggers |
|---|---|---|
| hightech | `themes/hightech/effects/glass-shimmer.tsx` | Subtle parallax shimmer on glass surfaces |
| thor | `themes/thor/effects/lightning.tsx` | Lightning crack on theme activate; hammer-hover micro-strike |
| thor | `themes/thor/effects/bifrost.tsx` | Bifrost rainbow on `M-J-O-L` combo |
| luffy | `themes/luffy/effects/strawhat-rain.tsx` | Straw-hat confetti on `L-U-F-F-Y` combo |
| luffy | `themes/luffy/effects/wanted-stamp.tsx` | Wanted-poster stamp on theme activate |

Only the active theme's effect bundle is loaded (`next/dynamic` + per-route `loadable`).

### Easter eggs (preserved from v1)
- **Hammer hover** on logo → unlocks Thor theme + lightning crack.
- **Straw hat click** on the 'O' in "Dor" → unlocks Luffy theme + wanted stamp.
- **`M-J-O-L` keyboard combo** → Bifrost rainbow + Thor activate.
- **`L-U-F-F-Y` keyboard combo** → straw-hat rain + Luffy activate.

---

## 6. Content model (Supabase)

### Tables (post-migration)

```mermaid
erDiagram
    profiles ||--o{ admin_emails : "email"
    projects ||--o{ embeddings : "source"
    site_content ||--o{ embeddings : "source"
    messages ||--o| message_rate_limit : "ip"
    site_content ||--o{ translations_cache : "source"
    projects ||--o{ translations_cache : "source"

    profiles {
      uuid id PK
      text full_name
      text username UK
      text email UK
      text bio_short
      text bio_long
      text avatar_url
      jsonb links
      timestamptz updated_at
    }
    projects {
      uuid id PK
      text slug UK
      text title
      text tagline
      text problem
      text role
      text writeup
      text[] stack
      text[] tags
      text cover_url
      text live_url
      text repo_url
      text status     "shipped | wip | concept"
      int priority
      int sort_order
      bool featured
      timestamptz created_at
      timestamptz updated_at
    }
    site_content {
      uuid id PK
      text section    "hero | about | skills | contact | resume | playground"
      text key
      text content_type "text | md | json"
      text en
      jsonb metadata
      timestamptz updated_at
    }
    messages {
      uuid id PK
      text name
      text email
      text body
      text classification "recruiter | collaboration | spam | question | other"
      text suggested_reply
      text origin_ip
      timestamptz created_at
    }
    message_rate_limit {
      text ip PK
      int count
      timestamptz window_start
    }
    admin_emails {
      text email PK
      timestamptz added_at
      text added_by
    }
    embeddings {
      uuid id PK
      text source_table   "projects | site_content"
      uuid source_id
      text chunk
      vector "embedding(1536)"
      timestamptz updated_at
    }
    translations_cache {
      text key PK         "sha256(source + content_type)"
      text source_table
      uuid source_id
      text content_type
      text en
      text he
      timestamptz created_at
    }
```

### Migration plan
1. **New:** `embeddings` table + `pgvector` extension + cosine-distance index.
2. **New:** `translations_cache` table + `(source_table, source_id)` index.
3. **New:** `project-covers` storage bucket (public-read, admin-write via RLS).
4. **Alter:** `site_content` — drop unused theme-specific rows, add `content_type` enum, normalize `key` naming.
5. **Alter:** `projects` — add `tagline`, `problem`, `role`, `writeup`, `cover_url`, `sort_order`, `status` if missing.
6. **Keep verbatim:** `admin_emails`, `is_admin()`, `lookup_admin_email_by_username`, `messages`, `message_rate_limit`, RLS policies.
7. **Seed:** Lumen project (full detail, see §8) + 5 placeholders.

All migrations are additive; the current site keeps working against the same DB until M9 removes `legacy/`.

---

## 7. Resume content

Mastered here. Supabase `profiles.bio_long` and the rendered PDF are both generated from this content. The on-site `/resume` route renders this same source as HTML + downloadable PDF + JSON-LD.

### Identity
- **Name:** Dor Ben Tzur
- **Email:** dbtzur@gmail.com
- **Location:** Rehovot, Israel
- **LinkedIn:** linkedin.com/in/dorbtz
- **GitHub:** github.com/dorbtz

### Profile
Innovative, self-motivated Full-Stack Developer with extensive experience designing and implementing modern web architectures, including 3D interactive applications and AI-driven solutions. Working stack: React Three Fiber, Next.js, Supabase, Vercel AI Gateway, generative AI tooling (Claude, Gemini).

### Education
**Advanced Generative AI & Modern Web Architecture** *(2024 – Present, self-directed)*
Ongoing intensive learning in AI tooling and modern frontend architectures.
- AI Integration — Generative AI tools (Gemini, Claude), AI agent architecture, prompt engineering
- Modern Frameworks — React Three Fiber (R3F), Three.js, Next.js, Tailwind CSS, Supabase

**Full-Stack Web Development** *(2021 – 2022, John Bryce, Tel-Aviv)*
Hands-on training in full-cycle web applications and database management.
- Languages — Python, JavaScript, TypeScript, HTML5, CSS3
- Frontend & Backend — React, Node.js, REST APIs, Flask, Django
- Databases — PostgreSQL, MongoDB, MySQL
- Tools — Git/GitHub, Docker

### Employment
**Independent Full-Stack & AI Developer** *(2024 – Present, Self-Employed)*
- **Autonomous AI Architecture** — Engineered an intelligent "AI Brain" system in Python using advanced prompt engineering to orchestrate and deploy dynamic, purpose-built AI agents.
- **3D Game Development** — Architected and shipped **Nebula-1**, an interactive 3D sci-fi strategy browser game on React Three Fiber + Three.js.
- **Full-Stack Web Platforms** — Designed and deployed a custom-built portfolio architecture on Next.js + Tailwind CSS + Supabase (PostgreSQL) with seamless Vercel integration. (This site.)
- **AI-Driven Development** — Accelerated SDLC by integrating Gemini + Claude Code for rapid prototyping, complex debugging, and feature implementation.

**Deputy Branch Manager** — Wolt Market, Rehovot *(2023 – 2024)*
- Managed daily operations and led a dynamic team to consistently exceed business KPIs.
- Optimized workflows and analyzed financial metrics to maximize branch profitability.
- Resolved complex customer service and operational issues.

**Technical Support & Customer Service Representative** — Rehovot Municipality *(2021 – 2022)*
- Delivered front-line technical support and problem resolution for city residents.
- Managed high-volume inquiry data via municipal CRM systems.

### Military service (IDF)
- **Company Sergeant Major / Operations & Logistics Manager** *(2015 – 2017)* — Directed unit logistics and daily operations.
- **Head of Office** *(2014 – 2015)* — Managed senior commanding officer's bureau; complex schedules, cross-functional meetings, strategic communications.

### Skills
Full-Stack Development · AI Integration · Prompt Engineering · Team Leadership

### Languages
Hebrew (native) · English (fluent)

### JSON-LD (emitted on `/resume`)
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Dor Ben Tzur",
  "email": "mailto:dbtzur@gmail.com",
  "url": "https://dorbtz.com",
  "image": "https://dorbtz.com/og/dor.jpg",
  "sameAs": [
    "https://github.com/dorbtz",
    "https://linkedin.com/in/dorbtz"
  ],
  "jobTitle": "Full-Stack & AI Engineer",
  "address": { "@type": "PostalAddress", "addressLocality": "Rehovot", "addressCountry": "IL" },
  "knowsLanguage": ["he", "en"],
  "knowsAbout": [
    "Full-Stack Web Development",
    "Generative AI",
    "AI Agent Architecture",
    "Prompt Engineering",
    "Next.js",
    "React Three Fiber",
    "Supabase",
    "Vercel"
  ]
}
```

---

## 8. Projects seed

### Lumen — real project (featured #1)
| Field | Value |
|---|---|
| `slug` | `lumen` |
| `title` | Lumen |
| `tagline` | Discover films by mood, not by genre grid. |
| `problem` | Movie discovery is stuck on genre grids. Users want mood-based discovery, transparent recommendations, and a way to connect their viewing history with reflection. |
| `role` | Solo design + engineering. Architecture, data model, AI pipeline, UI, deploy. |
| `stack` | Next.js 16 (App Router, RSC, View Transitions) · TypeScript · Tailwind v4 · Framer Motion · Neon Postgres + pgvector + Drizzle · Upstash Redis · Clerk · Google Gemini via Vercel AI SDK · Mux (HLS) · TMDB · Serwist (PWA) · Vitest + Playwright |
| `tags` | AI · RAG · Next.js · Liquid Glass · pgvector · PWA |
| `live_url` | https://lumen.dorbtz.com (currently https://lumen-smoky.vercel.app — will be re-pointed) |
| `repo_url` | https://github.com/dorbtz/Lumen-Project |
| `status` | shipped |
| `featured` | true |
| `priority` | 100 |
| `cover_url` | `project-covers/lumen.png` (to source from repo screenshots) |

**Write-up (3–4 sentences for the card):**
> A Netflix + IMDB hybrid built on Apple's visionOS material language. Onboard with 10 film ratings → a personal taste embedding; recommendations stream live from a 2D mood dial (valence × arousal) with three transparent reasons per pick. A nightly cron auto-renders a shareable recap card from journal entries — Wrapped-style, but personal. Built solo in 6 weeks on free-tier infrastructure (Next 16, Neon pgvector, Upstash Redis, Clerk, Gemini via Vercel AI SDK).

**Case study (`/case-studies/lumen`):** long-form MDX with architecture diagram, the taste-embedding pipeline, how Why-Cards are generated, and what shipping a PWA on Turbopack taught me.

### Placeholders (slugs, will be filled in via `/admin/content` after launch)
| Slug | Working title | Category |
|---|---|---|
| `nebula-1` | Nebula-1 | 3D strategy game (R3F + Three.js) — mentioned in resume |
| `ai-brain` | AI Brain | Python autonomous-agent orchestrator — mentioned in resume |
| `placeholder-3` | TBD | TBD |
| `placeholder-4` | TBD | TBD |
| `placeholder-5` | TBD | TBD |

Each placeholder ships with: empty cover (auto-generated gradient), "Coming soon" badge, draft status (hidden from public until featured = true).

---

## 9. AI architecture

### Provider — Google Gemini direct (free tier)
- Chat / RAG / recommend / classify: `gemini-2.0-flash` (free, 1500 req/day, fast)
- Embeddings: `text-embedding-004` (free, 768 dim)
- Image gen (playground): deferred — Gemini doesn't expose generally-available
  image generation on the free tier. M6 playground ships with text demos only;
  image demo reserved for when paid tier or AI Gateway is enabled.

Single env var: `GOOGLE_GENERATIVE_AI_API_KEY` (from https://aistudio.google.com/apikey).
No credit card required. The AI SDK abstracts provider — swapping to Vercel AI
Gateway (or Anthropic, OpenAI direct, etc.) is a one-line change in
`src/shared/lib/ai/provider.ts`.

### Cost guardrails
- **Free tier ceiling** (Gemini AI Studio): 1500 requests/day, 1M tokens/day.
  Way more than a portfolio chatbot needs. Per-IP rate limits below stay
  conservative so a single visitor can't burn the daily ceiling.
- **Per-IP rate limit** (in-memory in dev; per-row in `message_rate_limit`
  in prod with TTL via a cron):
  - `/api/ai/chat` — 20 messages / 1 hour
  - `/api/ai/recommend` — 30 / 1 hour
  - `/api/ai/playground/*` — 10 / 1 hour
  - Admins (via session check) bypass limits.
- **Embeddings sync** — daily cron only; on-demand only for new admin edits (debounced).
- **Translations cache** — every translation key persisted; second view = zero AI cost.

### RAG pipeline (chatbot)
1. **Chunking** — projects: per-row JSON-stringified (small enough to fit in 1 chunk). site_content: per-row. case-studies: split MDX by H2 (target 400–800 token chunks).
2. **Embedding** — Gemini `text-embedding-004`, 768 dim, batched.
3. **Storage** — Supabase `embeddings` table (now `vector(768)`), `cosine` ivfflat index (`lists=100`).
4. **Retrieval** — top-5 by cosine similarity, with minimum threshold 0.55.
5. **Generation** — `streamText` against `gemini-2.0-flash` with retrieved chunks as system context. Cite source via `[1]` markers mapped to project slugs.
6. **Re-rank** — none in v1 (top-5 from a small corpus is fine). Add later if recall is poor.

### System prompt — RAG chatbot (verbatim)
```
You are the AI co-pilot for dorbtz.com, the portfolio site of Dor Ben Tzur, a full-stack and AI engineer based in Rehovot, Israel.

Your job: answer questions about Dor's projects, skills, experience, and engineering work. Cite sources using [1], [2] markers that map to project slugs or site sections shown in the context.

When you don't know: say so plainly and suggest the user contact Dor via the contact form on this page.

You may answer:
- Anything about Dor's listed projects, skills, employment history, or technical decisions
- General questions about technologies Dor works with (Next.js, Supabase, AI, etc.), staying brief
- Recommendations about which of Dor's projects fit a given role or need

You should politely decline:
- Off-topic chitchat ("tell me a joke", "what's the weather"): redirect to portfolio topics
- Requests to write code for the user: redirect to /playground
- Personal information about Dor not on this site

Tone: confident, technical, concise. Match the user's language (English or Hebrew). Never invent projects or claims that aren't in the provided context.
```

### System prompt — project recommender
```
Given a description of the role or project the visitor is hiring for, rank Dor's projects by relevance. For each top-3 pick, return a single-sentence "why this matches" tied to specific stack or capability overlap.

Input: role description (free text)
Output: JSON { picks: [{ slug, why }] }
Constraints: only return projects from the provided list; never invent.
```

### Playground demos (`/playground`)
1. **Image generator** — `openai/gpt-image-1` via Gateway. User prompt → image. Rate-limit 5/hour/IP.
2. **Structured-output extractor** — paste arbitrary text → returns Zod-validated JSON with `{ people: [...], orgs: [...], dates: [...], sentiment: -1..1 }`.
3. **Streaming code reviewer** — paste a code snippet (≤ 2KB) → streaming review with 1) summary, 2) bugs, 3) suggestions.

### AI contact classification (background)
On message submit:
1. Persist message immediately.
2. Fire-and-forget Server Action calls `gpt-4o-mini` → `{ classification, suggested_reply }`.
3. Update message row when classification returns.
4. Failure path: leave classification null; admin sees raw message regardless.

---

## 10. Auth & admin

### Auth flows (preserved from v1, ported to Server Actions)
- **Magic link** — Supabase OTP → redirect to `/admin` → session.
- **Email + password** — for admins who set one via `/admin/account`.
- **Username + password** — RPC `lookup_admin_email_by_username` resolves username → email → password flow.

All three gated by `admin_emails` allowlist; RLS enforces server-side. Client pre-checks for UX only.

### Allowlist lifecycle
- Single SQL row in `admin_emails` is the source of truth.
- Only existing admins can add new ones (`is_admin()` SECURITY INVOKER on writes).
- History tracked in `admin_emails_history` (already migrated).

### Admin route guards
Next.js middleware (`middleware.ts`):
- Any `/admin/**` route reads Supabase session cookie.
- No session → redirect to `/admin/login`.
- Session present but not in `admin_emails` → redirect to `/` with `?reason=not_admin`.

Server Actions for admin mutations:
- Re-check session + allowlist on every call (defense in depth).
- All writes via Supabase service client run in transactions with `SET LOCAL request.jwt.claim.role = 'authenticated'` so RLS still applies.

### Admin pages summary
| Route | Purpose |
|---|---|
| `/admin` | Dashboard hub: recent messages, recent edits, health summary |
| `/admin/content` | CRUD: projects, skills, sections, hero, about, contact copy. Drag-to-reorder. Image upload to Supabase Storage |
| `/admin/messages` | Inbox + AI classification + draft reply + mark read |
| `/admin/health` | Internal observability — Web Vitals API, Vercel build status, AI Gateway spend, allowlist roster, bundle stats |
| `/admin/mcp` | Read-only catalog of chatbot tools and their schemas |
| `/admin/account` | Set password, change username, sign out |

`/status` is a PUBLIC subset of `/admin/health` — no auth, no allowlist.

---

## 11. Performance budgets

### Lighthouse targets (mobile, 4G throttling)
| Route | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| `/` | ≥ 95 | 100 | 100 | ≥ 95 |
| `/projects` | ≥ 95 | 100 | 100 | ≥ 95 |
| `/projects/lumen` | ≥ 95 | 100 | 100 | ≥ 95 |
| `/resume` | ≥ 95 | 100 | 100 | ≥ 95 |
| `/playground` | ≥ 90 | 100 | 100 | ≥ 95 |
| `/admin/*` | n/a | 100 | 100 | n/a |

### Web Vitals (real-user p75, mobile, 24h Speed Insights)
- LCP ≤ 1.5s
- INP ≤ 150ms
- CLS ≤ 0.05
- TTFB ≤ 400ms

### Bundle ceilings (gzipped, per route)
- JS first-load ≤ 90 KB
- CSS first-load ≤ 30 KB
- Per-theme effect bundle ≤ 25 KB (dynamic import)
- AI chatbot widget (lazy) ≤ 40 KB

### Image strategy
- All non-decorative images via `next/image` with AVIF + WebP automatic.
- Project covers: 1920×1080 master, served via `next/image` `sizes`.
- Hero portraits: 800×800, AVIF, blurDataURL placeholder.

### Caching
- Static pages: ISR with `revalidate` on admin edit (via `revalidateTag`).
- API routes: appropriate `Cache-Control` per endpoint; chat is no-cache.
- Embeddings: 24h re-embed cron, no per-request embedding generation.

---

## 12. Accessibility

### Standard
WCAG 2.2 Level AA across every public route. Internal admin meets Level AA too.

### Specific commitments
- **Color contrast** — every text/bg combination in every theme/scheme ≥ 7:1 (AAA).
- **Focus visible** — every focusable element has a 2px ring in `--accent` with 4px offset; never removed.
- **Keyboard** — tab order matches visual order; no keyboard traps; theme switcher, chatbot, and contact form all fully keyboard-operable.
- **Screen reader** — proper landmarks (`<main>`, `<nav>`, `<header>`, `<footer>`); ARIA labels on icon-only buttons; live regions for chatbot streaming + form async results.
- **Motion** — `prefers-reduced-motion: reduce` collapses all spring physics to 120ms opacity fades; lightning/rain effects suppressed entirely.
- **RTL** — when `lang="he"`, `dir="rtl"` on `<html>`; logical CSS properties (`margin-inline-start` etc); mirrored glass curves and easter-egg effects.
- **Touch targets** — minimum 44×44px on every interactive element (per WCAG 2.5.5).

### Verification
- axe-core run on every public route in CI (Playwright).
- Manual NVDA + VoiceOver smoke pass before M9.

---

## 13. Environment variables

| Name | Where set | Purpose | Required |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + `.env.local` | Supabase project URL | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + `.env.local` | Supabase anon key (client-safe) | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel only | Server-side admin writes (Server Actions) | yes |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Vercel + `.env.local` | Google AI Studio key (free tier). Backs Gemini chat + embeddings + translate | yes |
| `RESEND_API_KEY` | Vercel only | Resend SMTP (Supabase auth + transactional) | yes |
| `NEXT_PUBLIC_SITE_URL` | Vercel + `.env.local` | Canonical URL (e.g. `https://dorbtz.com`) | yes |
| `VERCEL_API_TOKEN` | Vercel only | For /admin/health → Vercel deployment status | yes |
| `CRON_SECRET` | Vercel only | Bearer auth for cron endpoints | yes |
| `NEXT_PUBLIC_PORTFOLIO_NAME` | Vercel + `.env.local` | Owner name (default "Dor Ben Tzur") | yes |
| `NEXT_PUBLIC_PORTFOLIO_TITLE` | Vercel + `.env.local` | Owner title (default "Full-Stack & AI Engineer") | yes |

Local dev uses `.env.local` (gitignored). `.env.example` is committed with empty values + comments.

---

## 14. i18n & RTL

### Strategy
**English is canonical.** Hebrew is a "fun" toggle generated by AI on first request and cached forever in Supabase. Labeled `תרגום אוטומטי (Beta)` so visitors know it's machine-generated.

### Translation pipeline
1. User clicks Lang switcher → `pf-locale=he` cookie set → page re-renders.
2. Server reads `pf-locale`; for every visible string, lookup in `translations_cache`.
3. **Cache hit** → render translation. **Cache miss** → call `ai/translate` Server Action (Anthropic via Gateway with a glossary system prompt), persist, render.
4. First request to a HE page takes ~1s extra; subsequent requests are zero-cost.

### Glossary (verbatim in translate system prompt)
Never translate: `Dor Ben Tzur`, `Lumen`, `Nebula-1`, `Mjolnir`, `Luffy`, `Bifrost`, `Asgard`, `Next.js`, `Vercel`, `Supabase`, `React`, brand names.

### RTL CSS
- Tailwind v4 logical properties (`ms-4` not `ml-4`, `pe-2` not `pr-2`).
- Glass corners auto-mirror (radius is symmetrical).
- Icons with directionality (arrows, chevrons) flip via `[dir="rtl"] .flip-rtl { transform: scaleX(-1); }`.
- Easter eggs: straw-hat-rain and lightning angles mirror to match reading direction.

### Chatbot language
- Detects user-message language; replies in the same language.
- System prompt instructs Hebrew responses use the same glossary.

---

## 15. Deployment

### Branch strategy
- `main` — production (current Vite site). Stays live during rebuild.
- `v2-hightech` — rebuild branch. Vercel deploys a preview URL per push.
- Single PR `v2-hightech → main` at M9. Merge = cutover.

### Vercel project
- Existing: `dorbtz-portfolio` (URL: https://dorbtz-portfolio.vercel.app).
- Same project, new branch. Preview deploys auto-generated.

### Custom domain (M9)
- `dorbtz.com` → Vercel apex
  - A record `76.76.21.21` (Vercel IP)
  - or `CNAME @ → cname.vercel-dns.com` (if registrar supports apex CNAME)
- `www.dorbtz.com` → 308 to `dorbtz.com`
- Project subdomain pattern: `<project>.dorbtz.com` (e.g. `lumen.dorbtz.com`) — each project has its own Vercel project; portfolio only links out.

### Supabase auth allowlist (Site URL + Redirect URLs)
- Site URL: `https://dorbtz.com`
- Redirect URLs: `https://dorbtz.com/**`, `https://dorbtz-portfolio.vercel.app/**`, `https://dorbtz-portfolio-git-*.vercel.app/**` (preview), `http://localhost:3000/**`

### Supabase SMTP (Resend)
- Resend Marketplace install → API key auto-provisioned as `RESEND_API_KEY`.
- Supabase Dashboard → Auth → SMTP: enable Custom, host `smtp.resend.com`, port `465`, user `resend`, pass `$RESEND_API_KEY`, sender `noreply@dorbtz.com` (after DNS verify).
- Supabase Dashboard → Auth → Rate Limits: email send = `10/hour`.

### CI / CD
- Vercel handles build + deploy on push.
- GitHub Actions runs `typecheck` + `lint` + `vitest` + `playwright` + Lighthouse CI on PRs.
- Bundle-size check enforced in CI per §11.

---

## 16. Open questions / TBD

These are non-blocking — defaults are listed; user can amend before M0 sign-off or at any later milestone.

| # | Question | Default proposal | Status |
|---|---|---|---|
| Q1 | High-Tech accent color exact | violet `#7C3AED` light / cyan `#00D4FF` dark | Open |
| Q2 | Lumen cover image source | Pull from repo screenshots, optimize via Sharp | Open |
| Q3 | 5 placeholder project names | Nebula-1 + AI Brain confirmed; 3 still TBD | Open |
| Q4 | Playground demo specifics | image-gen + JSON extractor + code reviewer | Open |
| Q5 | Chatbot system-prompt exact wording | Drafted in §9 | Open |
| Q6 | Custom domain DNS provider | TBD (Namecheap? Cloudflare? Vercel?) | Open |
| Q7 | Resume PDF rendering engine | `@react-pdf/renderer` (server-side, no headless Chrome) | Open |
| Q8 | MDX case-study toolchain | `@next/mdx` + `remark-gfm` + `rehype-pretty-code` | Open |
| Q9 | Image upload mechanism in /admin/content | `next-cloudinary`? Direct Supabase Storage upload? | Open |
| Q10 | Analytics retention / privacy notice | Need a `/privacy` page if we collect IPs for rate-limit + Web Analytics | Open |

---

*End of SPEC.md — v0.1 draft for M0 sign-off.*
