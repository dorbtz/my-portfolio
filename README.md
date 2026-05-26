# dorbtz.com — Next.js 16 + Supabase + Gemini portfolio

Personal portfolio for **Dor Ben Tzur** ([dorbtz.com](https://dorbtz.com)) — a Full-Stack & AI engineer site with **Apple Liquid Glass** as the High-Tech default and **Thor** / **Luffy** as bonus themes layered on top. AI is the headline feature: a RAG chatbot over the site's own content, a smart project recommender, a 3-demo `/playground`, and AI-classified contact messages.

Originally crafted by [Dor Ben Tzur](https://github.com/dorbtz). MIT-licensed.

> **Live:** [https://dorbtz.com](https://dorbtz.com)

## Table of Contents

- [Highlights](#highlights)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [Theme system](#theme-system)
- [AI surface](#ai-surface)
- [i18n (English + Hebrew)](#i18n-english--hebrew)
- [Admin panel](#admin-panel)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Security](#security)
- [Credits](#credits)
- [License](#license)

## Highlights

- **Next.js 16 App Router** — Server Components + Server Actions + Turbopack. Pages render server-side with SSR-correct theme cookies (no flash of unstyled / wrong theme).
- **Apple Liquid Glass design system** — frosted vibrancy + soft blurs + spring motion + 22pt+ rounded corners. Light + dark variants per theme. Tailwind v4 with custom CSS-variable tokens.
- **Three themes, one data set** — a single `theme` cookie (`hightech` / `thor` / `luffy`) + a `colorScheme` (`auto` / `light` / `dark`) swap palettes, fonts, and decorative layers on `<html data-theme>`. Same projects, same skills, three skins.
- **Interactive Skills viz** — Yggdrasil tree (Thor) and a canonical Grand Line map (Luffy) on top of the painted [fan world map](https://www.deviantart.com/sadjiri). Hover for the island name, click for the manga / MCU-dossier card with sepia island-photo backdrop.
- **AI flagship** — RAG chatbot (Gemini 2.5 Flash + pgvector), smart project recommender, `/playground` (image-gen + JSON extract + code review), AI-classified contact form.
- **EN + HE** — Hebrew translation via Gemini 2.5 Flash Lite, persisted to `translations_cache`, batched per section. UI chrome strings hand-curated (Wix / Monday.com / Geektime conventions).
- **Slim admin** — Supabase-auth gated `/admin` with content CRUD, message inbox + AI classifier, public `/status` health page, MCP tool catalog, account settings. Per-theme Marvel / Straw-Hat icons hot-swap on theme toggle.
- **Bonus theme atmosphere** — Drums of Liberation loop (Luffy), thunder-on-flash StormFX (Thor), Devil-Fruit manga panel + Mjolnir Bifrost disc on the hero, Heimdall + Den-Den-Mushi WEBM on Contact, with independent mute toggles for ambient music vs WEBM voice.
- **Accessibility-first** — WCAG 2.2 AA target, skip-to-content, focus-visible rings, `prefers-reduced-motion` honoured everywhere, 44 px tap targets on mobile, RTL-aware logical properties.

## Tech stack

| Layer | Library |
|---|---|
| Framework | **Next.js 16** App Router (Server Components, Server Actions, Cache Components, Turbopack) |
| UI | React 19 + TypeScript 5.9 |
| Styling | **Tailwind v4** (CSS-variable tokens, `@theme` block) |
| Backend | **Supabase** (Postgres + Auth + Storage + RLS + pgvector) |
| AI | **Google Gemini** via `@ai-sdk/google` — `gemini-2.5-flash` (chat), `gemini-2.5-flash-lite` (translate), `gemini-embedding-001` (768-dim embeddings) |
| AI SDK | Vercel AI SDK v6 (`useChat`, `streamText`, `DefaultChatTransport`) |
| Audio | Native `HTMLAudioElement` — no Howler / no extra deps |
| Tests | Vitest |
| Lint | ESLint (flat config) + typescript-eslint + `next/core-web-vitals` |
| Hosting | Vercel (Production branch: `main` → dorbtz.com) |

## Architecture

```
dorbtz.com (Vercel · Next.js 16 · Fluid Compute · Node 20)
│
├─ Public site
│  ├─ /                       Hero · About · Projects · Skills · Contact (single-page)
│  ├─ /projects/[slug]        Project detail (ISR)
│  ├─ /case-studies           MDX long-form scaffold
│  ├─ /playground             3 live AI demos
│  ├─ /resume                 PDF download + JSON-LD Person schema
│  ├─ /status                 PUBLIC live Web Vitals + AI spend + build status
│  └─ Floating widgets        Theme switcher + Lang switcher + Sound pills + RAG chatbot
│
├─ /admin (Supabase auth + admin_emails allowlist)
│  ├─ /admin/content          CRUD: projects, skills, sections, hero, about, contact
│  ├─ /admin/messages         Inbox + AI classifier + suggested replies
│  ├─ /admin/health           Internal dashboard (superset of /status)
│  ├─ /admin/mcp              Read-only catalog of chatbot tools
│  └─ /admin/account          Magic-link login + password + username
│
├─ Server Actions / Route Handlers
│  ├─ api/ai/chat             Streaming RAG (Gemini Flash)
│  ├─ api/ai/recommend        Smart project recommender
│  ├─ api/ai/playground/*     Per-demo handlers (extract, code-review)
│  ├─ api/ai/sync-embeddings  Cron: re-embed content on change
│  ├─ api/i18n/translate      AI translate EN→HE, cache to Supabase
│  └─ auth/callback           Supabase magic-link redirect
│
└─ Supabase
   ├─ profiles, projects, admin_emails, site_content, messages,
   │   message_rate_limit, embeddings (pgvector), translations_cache
   ├─ Storage: avatars, contact-media, project-covers
   └─ RLS: writes gated by `is_admin()` SECURITY INVOKER
```

Folder layout (Feature-Sliced):

```
src/
├─ app/                    Next.js App Router (route segments)
├─ features/
│  ├─ hero, about, projects, skills, contact, resume, case-studies, playground
│  ├─ ai-chat              RAG chatbot + MessageBubble (markdown renderer + RTL detect)
│  ├─ effects              StormFX, LuffyImageRain, ThemeAmbience, ThemeAudio
│  ├─ chrome               Header + Footer
│  └─ admin-*              Content / messages / health / mcp / account
├─ shared/
│  ├─ ui                   GlassCard, GlassButton, AppleSpring, FloatingControls, SoundToggle
│  ├─ lib                  audio, theme, i18n, supabase, ai, queries
│  └─ data                 profile, sections, skill-domains
└─ types
```

## Quick start

```bash
git clone https://github.com/dorbtz/my-portfolio.git
cd my-portfolio
npm install
cp .env.example .env.local       # if .env.example exists; otherwise create .env.local
# edit .env.local — see Environment variables below
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Required | Scope | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | client | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | client | Supabase **anon** (publishable) key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | **server-only** | Never expose to the browser. Used by admin Server Actions + cron |
| `GOOGLE_GENERATIVE_AI_API_KEY` | yes | server | Gemini key from [Google AI Studio](https://aistudio.google.com) |
| `CRON_SECRET` | yes | server | Random shared secret. Authenticates `/api/ai/sync-embeddings` |
| `NEXT_PUBLIC_SITE_URL` | optional | client | Defaults to `https://dorbtz.com` in production |

`.env.local` is gitignored. Production values live in Vercel → Project → Settings → Environment Variables.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Link locally:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
3. Apply migrations:
   ```bash
   supabase db push
   ```
   Or paste each `supabase/migrations/*.sql` into the SQL editor in order.
4. Seed the admin allowlist:
   ```sql
   INSERT INTO public.admin_emails (email) VALUES ('you@example.com');
   ```
5. Copy the URL + anon key + service-role key from Project Settings → API into `.env.local`.

Key tables added in v2: `embeddings` (pgvector, 768d, sequential scan — small corpus), `translations_cache` (sha256 key → en + he + content_type + created_at), `messages_ai_classification` (classifier output + suggested reply).

## Theme system

- One `theme` cookie (`hightech` / `thor` / `luffy`) + one `colorScheme` cookie (`auto` / `light` / `dark`).
- SSR-correct: the layout reads cookies on the server and writes `data-theme` + `data-scheme` to `<html>` before the first paint — no FOUC.
- Client components subscribe to `data-theme` via `MutationObserver` for live hot-swap (admin nav icons, project glyphs, theme audio, ambient layers all flip in place without a refresh).
- Each theme owns a CSS-variable file (`src/shared/themes/<name>.css`). All components read tokens; never hardcode colors.
- Per-theme decorative layers (`LuffyImageRain`, `StormFX`, `ThemeHeroPanel`, `ThemeArtStrip`, `ThemeAudio`) self-gate on `data-theme` and lazy-import only when their theme is active.

## AI surface

- **RAG chatbot** (bottom-right floating widget) — `useChat` against `/api/ai/chat`. System prompt scopes answers to portfolio + light professional Q&A. IP rate limit (20 msg/hour visitor). Citations rendered as accent superscript chips by the in-house markdown renderer (`MessageBubble.tsx`) — no external markdown lib, ~80 KB saved.
- **Smart project recommender** — Server Action on `/projects` that picks the best matching project for a free-text intent.
- **`/playground`** — three live demos: image generation, structured-JSON extractor, streaming code reviewer.
- **AI-classified contact form** — background Server Action runs Gemini on submit, stores `category`, `urgency`, `suggested_reply` on the message row.
- **Embeddings sync** — Vercel Cron daily: chunk site_content + projects, embed via `gemini-embedding-001` (768d), upsert to `embeddings`. Retrieval is sequential scan (ivfflat is pathological at small corpus sizes).

## i18n (English + Hebrew)

- EN is canonical. HE is generated on-demand via `gemini-2.5-flash-lite` (15 RPM tier vs Flash's 5 RPM), batched one call per section.
- `translations_cache` table keyed by SHA-256 of source text + content type — every HE string is generated once across all users.
- UI chrome (nav, buttons, status labels) is **hand-curated** in `src/shared/lib/i18n/chrome.ts` against Israeli tech-industry conventions (Wix, Monday.com, Geektime sources) — never AI-translated.
- Brand names (Next.js, React, Supabase, GitHub, Claude, Gemini, etc.) stay in Latin even inside Hebrew text — pinned by the translator glossary.
- RTL via `<html dir="rtl">` + Tailwind v4 logical properties. The admin chrome stays LTR even in HE mode (short labels render fine inside an LTR container).
- Hebrew CV PDF lives at `public/cv/dor-ben-tzur-he.pdf` — hand-curated from a real PDF, not AI-generated.

## Admin panel

`/admin` is gated by:
1. Supabase auth (magic link or password)
2. `admin_emails` allowlist (server-side check via `isAllowlistedAdmin`)
3. `public.is_admin()` SECURITY INVOKER function called from every RLS policy on write

Sections:
- `/admin` — dashboard
- `/admin/content` — projects + sections CRUD
- `/admin/messages` — inbox + AI classification + suggested reply
- `/admin/health` — internal Web Vitals + AI spend + allowlist roster
- `/admin/mcp` — read-only chatbot tool catalog
- `/admin/account` — magic-link / password / username

Per-theme decorative icons (Marvel for Thor, full Straw-Hat roster for Luffy) hot-swap on theme toggle via a Client Component subscribing to `data-theme`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Next dev server with Turbopack at http://localhost:3000 |
| `npm run build` | Production build (Turbopack) |
| `npm start` | Serve production build |
| `npm run lint` | ESLint (`next/core-web-vitals` + flat config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest run mode |
| `npm run test:watch` | Vitest watch mode |

## Deployment

- Production branch is `main`. Every push to `main` triggers a Vercel build that auto-deploys to dorbtz.com.
- Preview deploys per pushed branch + per pull request.
- Vercel uses `npm install` (not `npm ci`), which matches the CI workflow.
- All env vars listed above must be set in Vercel → Project → Settings → Environment Variables for the Production environment.

## Security

- **No secrets in git history.** `.env.local` is gitignored; the service-role key never goes to the client (`grep -rn "service_role" src/` returns nothing).
- **RLS on every protected table.** Every migration enables RLS and defines explicit policies gated by `is_admin()`.
- **`is_admin()` is `SECURITY INVOKER`**, called from RLS — bypassing the client-side `adminAllowlist.ts` check does not bypass the database.
- **Rate limiting.** Contact form: per-IP rate-limit in `message_rate_limit`. Chatbot: 20 msg/hour per visitor IP, admin bypass.
- **Hard AI spend cap** at the Gateway layer (configured in Vercel AI Gateway dashboard, not in code).
- **No `dangerouslySetInnerHTML`** anywhere in v2 source.

## Credits

- Built by **Dor Ben Tzur** ([github.com/dorbtz](https://github.com/dorbtz) · [linkedin.com/in/dorbtz](https://linkedin.com/in/dorbtz)).
- **Crafted with [Claude](https://claude.com/claude-code)** — agentic development assistant.
- Marvel and One Piece are trademarks of their respective owners; the bonus themes are fan-art and not affiliated with either franchise.
- Geist + Inter Tight fonts via Vercel + Google Fonts.
- Bangers, Bebas Neue fonts via Google Fonts (SIL Open Font License).
- One Piece world map (used as the Grand Line skill viz base) is the canonical fan map by Sadjiri on DeviantArt.

## License

MIT — see [LICENSE](./LICENSE).
