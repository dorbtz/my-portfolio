-- =============================================================================
-- 0014_seed_projects.sql
-- =============================================================================
-- Purpose:
--   M4 — seed the projects table with the canonical v2 set: Lumen (real),
--   Nebula-1 + AI Brain (in-progress), and 3 placeholder slots the admin
--   panel (M7) will replace.
--
-- Mapping (Project type field <- DB column):
--   tagline <- subtitle
--   writeup <- description
--   problem <- problem  (new column from 0012)
--   status:  shipped|in-progress|draft|archived  (matches existing CHECK)
--
-- Idempotent via the unique constraint on slug.

insert into public.projects
  (slug, title, subtitle, problem, role, description,
   stack, tags, status, featured, priority, sort_order,
   live_url, repo_url, cover_url)
values
  (
    'lumen',
    'Lumen',
    'Discover films by mood, not by genre grid.',
    'Movie discovery is stuck on genre grids. Users want mood-based discovery, transparent recommendations, and a way to connect viewing history with reflection.',
    'Solo design + engineering. Architecture, data model, AI pipeline, UI, deploy.',
    'A Netflix + IMDB hybrid built on Apple''s visionOS material language. Onboard with 10 film ratings to seed a personal taste embedding; recommendations stream live from a 2D mood dial (valence × arousal) with three transparent reasons per pick. A nightly cron auto-renders a shareable recap card from your journal entries — Wrapped-style, but personal. Shipped solo in 6 weeks on free-tier infrastructure.',
    ARRAY['Next.js 16','TypeScript','Tailwind v4','Framer Motion','Neon Postgres','pgvector','Drizzle ORM','Upstash Redis','Clerk','Vercel AI SDK','Google Gemini','Mux (HLS)','TMDB','Serwist (PWA)','Vitest','Playwright'],
    ARRAY['AI','RAG','Next.js','Liquid Glass','pgvector','PWA'],
    'shipped', true, 100, 0,
    'https://lumen.dorbtz.com',
    'https://github.com/dorbtz/Lumen-Project',
    null
  ),
  (
    'nebula-1',
    'Nebula-1',
    'Interactive 3D sci-fi strategy in the browser.',
    'Browser 3D games tend to feel like demos. I wanted to ship a real strategy loop — fleet management, real-time exploration, persistent state — that runs at 60fps on a laptop GPU.',
    'Solo architecture + engineering. Renderer, gameplay, networking, deploy.',
    'An interactive sci-fi strategy game built on React Three Fiber + Three.js. Real-time WebGL scenes, instanced rendering for fleets, persistent state via Supabase, asset pipeline with glTF optimization. Targets 60fps on integrated graphics.',
    ARRAY['React Three Fiber','Three.js','TypeScript','Vite','Supabase','Zustand','GLTF'],
    ARRAY['3D','WebGL','React Three Fiber','Game'],
    'in-progress', true, 90, 1, null, null, null
  ),
  (
    'ai-brain',
    'AI Brain',
    'An autonomous agent orchestrator in Python.',
    'Building one-off AI agents is fast; making them cooperate and self-deploy is hard. AI Brain is a system for spinning up purpose-built agents on demand and orchestrating their work.',
    'Solo architecture + engineering. Prompt design, agent framework, deploy pipeline.',
    'A Python framework that uses advanced prompt engineering to spin up dynamic, purpose-built AI agents — each scoped to a task, coordinated by a central planner. Built to be the back-of-house for AI features on top of public-facing apps.',
    ARRAY['Python','Claude','Gemini','Prompt Engineering','AI Agents'],
    ARRAY['AI','Agents','Python','LLM'],
    'in-progress', false, 80, 2, null, null, null
  ),
  ('placeholder-4', 'Project Four', 'Coming soon.',
   'Reserved slot. Real project lands here via /admin/content after launch.',
   '—', 'Placeholder.', ARRAY[]::text[], ARRAY[]::text[],
   'draft', false, 10, 3, null, null, null),
  ('placeholder-5', 'Project Five', 'Coming soon.',
   'Reserved slot. Real project lands here via /admin/content after launch.',
   '—', 'Placeholder.', ARRAY[]::text[], ARRAY[]::text[],
   'draft', false, 10, 4, null, null, null),
  ('placeholder-6', 'Project Six', 'Coming soon.',
   'Reserved slot. Real project lands here via /admin/content after launch.',
   '—', 'Placeholder.', ARRAY[]::text[], ARRAY[]::text[],
   'draft', false, 10, 5, null, null, null)
on conflict (slug) do update set
  title       = excluded.title,
  subtitle    = excluded.subtitle,
  problem     = excluded.problem,
  role        = excluded.role,
  description = excluded.description,
  stack       = excluded.stack,
  tags        = excluded.tags,
  status      = excluded.status,
  featured    = excluded.featured,
  priority    = excluded.priority,
  sort_order  = excluded.sort_order,
  live_url    = excluded.live_url,
  repo_url    = excluded.repo_url,
  updated_at  = now();
