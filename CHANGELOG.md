# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [Semantic Versioning](https://semver.org/).

## [Unreleased] — `v2-hightech` branch

Complete rebuild of the portfolio. Replaces the Vite + dual-fandom site with Next.js 16 + Supabase + Vercel AI Gateway. Thor and Luffy become themes (skin + effects only), not separate content paths. New default theme is Apple Liquid Glass High-Tech.

### Milestones (in flight)
- **M0** — SPEC.md + branch + changelog *(this commit)*
- **M1** — Next.js 16 skeleton, current Vite src moved to `legacy/`
- **M2** — Theme system + Apple Liquid Glass tokens
- **M3** — Public pages (Hero, About, Projects, Skills, Contact, Resume, Case Studies)
- **M4** — Supabase data migration (pgvector, translations_cache, slimmer schema)
- **M5** — RAG chatbot via Vercel AI Gateway
- **M6** — Other 3 AI features (recommender, playground, contact classify) + Hebrew "fun" toggle (RTL)
- **M7** — Slim admin panel (content, messages, health, mcp, account)
- **M8** — Easter eggs, accessibility, performance, SEO, tests
- **M9** — Custom domain `dorbtz.com`, merge to main, tag v2.0.0

See `SPEC.md` for full architecture.

---

## [1.0.0] — 2026-05-25

Initial dual-fandom portfolio shipped on Vercel.
- React 19 + Vite (rolldown) + Tailwind v4
- Supabase auth (magic link + password + username) + RLS allowlist
- Dual modes: Thor (Marvel) + Luffy (One Piece)
- Admin panel for content / messages / health / MCP
- Feature-Sliced Design architecture
- 25 test files / 514 tests on Vitest
- Deployed at https://dorbtz-portfolio.vercel.app
