-- =============================================================================
-- 001_themed_projects.sql
-- =============================================================================
-- Purpose:
--   Seed 6 themed placeholder projects for the Thor / Gear 5 dual-mode portfolio.
--   Rows are idempotent: re-running performs an upsert (INSERT … ON CONFLICT DO
--   UPDATE), so it is safe to execute multiple times without producing duplicates.
--
-- Owner UUID:
--   All rows are seeded with a sentinel owner UUID:
--     00000000-0000-0000-0000-000000000000
--   After running this seed you MUST claim ownership. Replace the sentinel with
--   your Supabase auth UID (visible in Authentication → Users in the dashboard):
--
--     UPDATE projects
--        SET owner = '<your-auth-uid>'
--      WHERE owner = '00000000-0000-0000-0000-000000000000';
--
-- Cover images:
--   cover_url values point to /seed/<slug>.webp (or .svg — see note below).
--   These files live in public/seed/ in the repository so the first paint works
--   without needing Supabase Storage uploads. Replace them any time by dropping a
--   new file at the same path, or uploading via the admin UI (which will set a
--   Supabase Storage URL and update the row automatically).
--
-- How to run:
--   Option A — Supabase SQL editor:
--     Open https://app.supabase.com → SQL Editor, paste this file, click Run.
--
--   Option B — psql CLI:
--     psql -h <db-host> -U postgres -d postgres \
--          -f supabase/seed/001_themed_projects.sql
--
--   Option C — Supabase CLI (if configured):
--     supabase db reset          (runs all files in supabase/seed/ in order)
--   or targeted:
--     psql "$SUPABASE_DB_URL" -f supabase/seed/001_themed_projects.sql
--
-- Compatibility: PostgreSQL 15+ (Supabase default as of 2025).
-- =============================================================================

BEGIN;

INSERT INTO public.projects (
    slug,
    title,
    subtitle,
    summary,
    description,
    tags,
    stack,
    tech,
    role,
    status,
    mode,
    priority,
    sort_order,
    featured,
    live_url,
    repo_url,
    cover_url,
    hero_image_alt,
    hero_video_url,
    gallery,
    links,
    metrics,
    responsibilities,
    outcomes,
    owner,
    created_at,
    updated_at
)
VALUES

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Mjolnir UI Kit  (featured · shipped · sort 10)
-- ─────────────────────────────────────────────────────────────────────────────
(
    'mjolnir-ui-kit',
    'Mjolnir UI Kit',
    'A thunderous React component library that strikes with precision and micro-interaction power.',
    'Mjolnir UI Kit is a battle-hardened component library built for engineers who demand both visual weight and blazing runtime performance. Every component carries the rune-forged discipline of Asgard''s finest craftsmen, delivering micro-interactions worthy of the God of Thunder himself. Only those found worthy — that is, those who write semantic, accessible markup — may wield it.',
    E'Modern UIs suffer from two plagues simultaneously: bloated component bundles that cripple Lighthouse scores, and sterile design systems devoid of personality. Teams choose between performance and delight as if they were mutually exclusive. Mjolnir UI Kit was built to shatter that false choice — much as Bifrost shatters the boundary between realms.\n\nEvery token, every easing curve, and every interaction in the kit is intentional. The library ships with a runic typography easter egg: cycle through heading variants with a keyboard shortcut and watch Elder Futhark inscriptions fade in beneath the Latin glyphs — a nod to the ancient power underlying modern interfaces. Micro-interactions use GSAP-quality spring physics baked into pure CSS custom properties, keeping the runtime bundle lean. Tree-shakeable by default, each component adds only the bytes it needs to the final bundle.\n\nIn production, the kit achieved a 98 Lighthouse performance score on the host portfolio and reduced design-system onboarding time by 40 % across three product teams. It is the load-bearing foundation beneath every Thor-mode component in this portfolio — every lightning bolt, every runic glow, every hammer hover effect traces its lineage back to Mjolnir UI Kit''s token layer.',
    '["design-system", "performance"]'::jsonb,
    '["React", "TypeScript", "Tailwind CSS"]'::jsonb,
    '["React", "TypeScript", "Tailwind CSS"]'::jsonb,
    'Lead Design-System Engineer',
    'shipped',
    'thor',
    10,
    10,
    true,
    '#',
    '#',
    '/seed/mjolnir-ui-kit.webp',
    'Mjolnir UI Kit component showcase on a dark Asgardian background',
    null,
    '[]'::jsonb,
    '[{"label": "Docs", "url": "#", "type": "docs"}, {"label": "Live", "url": "#", "type": "live"}, {"label": "Repo", "url": "#", "type": "repo"}]'::jsonb,
    '[{"label": "Lighthouse Score", "value": "98"}, {"label": "Bundle size (gzip)", "value": "4.2 kB"}, {"label": "Component count", "value": "42"}]'::jsonb,
    '["Designed and documented 42 accessible components from scratch", "Authored the runic typography easter-egg system and Elder Futhark glyph map", "Established Spring-physics CSS custom-property token system", "Published tree-shakeable ESM build with per-component code-splitting", "Wrote Storybook stories and automated visual regression tests"]'::jsonb,
    '["Lighthouse performance score of 98 on the reference implementation", "40 % reduction in design-system onboarding time across three product teams", "Zero accessibility violations (axe-core audit)", "Adopted as the shared component foundation for the full Thor-mode portfolio"]'::jsonb,
    '00000000-0000-0000-0000-000000000000'::uuid,
    now(),
    now()
),

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Bifrost Analytics  (featured · shipped · sort 20)
-- ─────────────────────────────────────────────────────────────────────────────
(
    'bifrost-analytics',
    'Bifrost Analytics',
    'A multi-realm event pipeline and real-time dashboard that lights up like the rainbow bridge.',
    'Bifrost Analytics is a full-stack observability platform that ingests, processes, and visualises event streams from multiple data realms in real time. Inspired by the prismatic bridge connecting the Nine Realms, it makes every metric beautiful and every anomaly impossible to miss. This is the dashboard Heimdall would build — all-seeing, always-on, zero latency.',
    E'Product teams typically juggle three or four disconnected tools to get from raw event ingestion to an actionable dashboard: a queue, a transform layer, a warehouse, and finally a BI tool bolted on top. Each seam is a place where data gets lost, delayed, or misinterpreted. Bifrost Analytics collapses the entire pipeline into a single, coherent system — a rainbow bridge from event to insight with no gaps in between.\n\nThe architecture uses Supabase Realtime''s PostgreSQL change-data-capture to stream aggregated metrics to the browser without any polling. A server-side pipeline de-duplicates and upserts events idempotently, so the dashboard is safe to backfill and re-run without inflating counts. The UI renders a prismatic colour band — one hue per event type — that shifts and pulses as new data arrives, giving operators an at-a-glance health view that mirrors Bifrost''s own chromatic brilliance. Thor-mode hover states reveal per-realm breakdowns via a portal-style drawer, while Gear 5 mode re-skins the same data in warm gold-and-cream charts fit for the sunny seas of the Grand Line.\n\nAt peak load the pipeline sustains 3,200 events per second through a single Supabase project with sub-200 ms end-to-end latency from ingest to rendered pixel. The real-time subscription model replaced a previous 30-second polling loop, cutting database read load by 94 %.',
    '["saas", "devtools", "realtime"]'::jsonb,
    '["React", "TypeScript", "Supabase", "PostgreSQL", "Vite"]'::jsonb,
    '["React", "TypeScript", "Supabase", "PostgreSQL", "Vite"]'::jsonb,
    'Full-Stack Engineer & Data Architect',
    'shipped',
    'thor',
    20,
    20,
    true,
    '#',
    '#',
    '/seed/bifrost-analytics.webp',
    'Bifrost Analytics dashboard showing prismatic real-time event streams',
    null,
    '[]'::jsonb,
    '[{"label": "Live", "url": "#", "type": "live"}, {"label": "Repo", "url": "#", "type": "repo"}, {"label": "Docs", "url": "#", "type": "docs"}]'::jsonb,
    '[{"label": "Events / sec (peak)", "value": "3,200"}, {"label": "End-to-end latency", "value": "< 200 ms"}, {"label": "DB read load reduction", "value": "94 %"}]'::jsonb,
    '["Designed idempotent event-ingest pipeline with upsert de-duplication", "Implemented Supabase Realtime CDC subscription replacing a 30-second polling loop", "Built the prismatic live-chart component with per-realm hue mapping", "Authored backfill tooling safe for concurrent production use", "Established row-level security policies for multi-tenant event isolation"]'::jsonb,
    '["Pipeline sustains 3,200 events / sec through a single Supabase project", "End-to-end latency under 200 ms from ingest to rendered pixel", "94 % reduction in database read load vs. previous polling approach", "Multi-tenant event isolation validated by security audit"]'::jsonb,
    '00000000-0000-0000-0000-000000000000'::uuid,
    now(),
    now()
),

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Gear 5 Design System  (in-progress · sort 30)
-- ─────────────────────────────────────────────────────────────────────────────
(
    'gear-5-design-system',
    'Gear 5 Design System',
    'Cartoon-physics-inspired tokens for joyful product experiences — rubber easings, sun-god gradients, and "Drums of Liberation" haptic patterns.',
    'The Gear 5 Design System captures the unbridled joy and elastic freedom of Luffy''s Sun God Nika awakening and translates it into a disciplined token architecture. Rubber easings that snap with anime-grade spring physics, a warm white-and-gold palette channelling Sun God radiance, and haptic feedback patterns inspired by the Drums of Liberation make every interaction feel like a moment of liberation. This is what design feels like when it smiles.',
    E'Most design systems solve for consistency and neglect delight. The result is software that looks correct but feels sterile — interfaces nobody loves. Gear 5 Design System was born from a contrarian bet: what if rigorous token architecture and maximum joyfulness were not in tension but were in fact the same goal? The same discipline that produces rubber-band spring curves also produces predictable, testable, scalable motion.\n\nThe system defines three tiers of motion tokens: micro (< 150 ms, sub-perceptual snap on tap targets), meso (150–500 ms, the Gear 5 "stretch and squash" reveal animations), and macro (> 500 ms, the full Drums of Liberation scene transitions). All three resolve to CSS custom properties consumed by Framer Motion variants, so a single token change propagates everywhere with no component edits. Sun-god gradient tokens live in a separate semantic layer — `--sun-radiance-50` through `--sun-radiance-900` — providing a coherent light-to-gold ramp that passes WCAG 2.2 AA contrast at every step.\n\nThe haptic pattern library is a first-of-its-kind addition: named patterns like `drums.liberation` map to Web Vibration API sequences so the same token that drives a visual animation can also drive a device rumble, creating a cross-sensory experience that is still fully opt-in and reduced-motion safe. Work is ongoing as the system moves toward its 1.0 stable release.',
    '["design-system", "brand", "ux"]'::jsonb,
    '["React", "TypeScript", "Tailwind CSS", "Framer Motion"]'::jsonb,
    '["React", "TypeScript", "Tailwind CSS", "Framer Motion"]'::jsonb,
    'Lead Design-System Engineer',
    'in-progress',
    'gear5',
    30,
    30,
    false,
    '#',
    '#',
    '/seed/gear-5-design-system.webp',
    'Gear 5 Design System token playground showing sun-god gradient and rubber easing curves',
    null,
    '[]'::jsonb,
    '[{"label": "Repo", "url": "#", "type": "repo"}, {"label": "Docs", "url": "#", "type": "docs"}]'::jsonb,
    '[{"label": "Motion tokens", "value": "120+"}, {"label": "Gradient steps (sun-god)", "value": "10"}, {"label": "WCAG AA pass rate", "value": "100 %"}]'::jsonb,
    '["Defined three-tier motion token architecture (micro / meso / macro)", "Built sun-god gradient semantic token ramp with WCAG AA compliance at every step", "Implemented Drums of Liberation haptic pattern library via Web Vibration API", "Authored Framer Motion variant presets consuming CSS custom properties", "Integrated reduced-motion and low-power fallback layer"]'::jsonb,
    '["120+ motion tokens with full CSS custom-property resolution", "100 % WCAG 2.2 AA contrast pass rate across the sun-god gradient ramp", "Haptic patterns opt-in and gracefully degraded on unsupported devices", "System powers all Gear 5 mode interactions in this portfolio"]'::jsonb,
    '00000000-0000-0000-0000-000000000000'::uuid,
    now(),
    now()
),

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Den Den Mushi Realtime Chat  (shipped · sort 40)
-- ─────────────────────────────────────────────────────────────────────────────
(
    'den-den-mushi-realtime',
    'Den Den Mushi Realtime Chat',
    'A snail-mascot chat widget with reactive expressions, live presence over Supabase Realtime, and voice-note "transmissions".',
    'Den Den Mushi Realtime Chat brings the iconic transponder snail of One Piece to life as a fully functional embeddable chat widget. The mascot reacts dynamically to conversation state — idle curl when quiet, alert antennae when someone is typing, ringing shell animation on incoming message. Powered by Supabase Realtime for sub-100 ms presence and message delivery, it makes real-time communication as delightful as it is fast.',
    E'Chat widgets are universally boring: a grey bubble in a corner, a canned "We''ll reply in 24 hours" message, and zero personality. Den Den Mushi Realtime Chat is the answer to the question: what if your chat widget had a soul? The snail mascot is not decoration — it is a state machine that communicates system status through expressive animation, reducing the cognitive load of interpreting connection and typing indicators.\n\nUnder the hood the widget uses Supabase Realtime''s Presence and Broadcast channels. Presence tracks connected users with a low-latency heartbeat; Broadcast delivers messages peer-to-peer without touching the database, keeping latency under 80 ms even on intercontinental connections. Voice notes — the "transmissions" — are recorded via the Web Audio API, stored in Supabase Storage, and played back with a retro rotary-dial waveform visualiser that would make even the Den Den Mushi in Marineford proud. The entire widget bundles under 18 kB gzipped, small enough to embed in any page without a second thought.\n\nThe mascot''s expression library contains twelve states mapped to an XState finite-state machine, ensuring transitions are deterministic and testable. In Thor mode the snail wears a tiny Asgardian helmet; in Gear 5 mode it sprouts a straw hat — a cosmetic toggle that required exactly zero changes to the underlying state machine.',
    '["realtime", "saas", "ux"]'::jsonb,
    '["React", "TypeScript", "Supabase", "Node.js"]'::jsonb,
    '["React", "TypeScript", "Supabase", "Node.js"]'::jsonb,
    'Full-Stack Engineer',
    'shipped',
    'gear5',
    40,
    40,
    false,
    '#',
    '#',
    '/seed/den-den-mushi-realtime.webp',
    'Den Den Mushi chat widget with snail mascot in active conversation state',
    null,
    '[]'::jsonb,
    '[{"label": "Live", "url": "#", "type": "live"}, {"label": "Repo", "url": "#", "type": "repo"}, {"label": "Docs", "url": "#", "type": "docs"}]'::jsonb,
    '[{"label": "Message latency (p99)", "value": "< 80 ms"}, {"label": "Widget bundle (gzip)", "value": "18 kB"}, {"label": "Mascot expression states", "value": "12"}]'::jsonb,
    '["Built XState finite-state machine for 12 mascot expression states", "Implemented Supabase Realtime Presence for sub-100 ms user tracking", "Developed voice-note recording and playback with Web Audio API waveform visualiser", "Engineered Broadcast peer-to-peer message delivery bypassing the database write path", "Added Thor / Gear 5 cosmetic skin layer with zero state-machine changes"]'::jsonb,
    '["Sub-80 ms p99 message delivery across intercontinental connections", "Widget bundle under 18 kB gzipped — zero embed friction", "12 deterministic mascot states fully covered by unit tests", "Voice note feature adopted as a first-class communication tool by beta users"]'::jsonb,
    '00000000-0000-0000-0000-000000000000'::uuid,
    now(),
    now()
),

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Asgard Ecommerce  (in-progress · sort 50)
-- ─────────────────────────────────────────────────────────────────────────────
(
    'asgard-ecommerce',
    'Asgard Ecommerce',
    'A headless storefront for a Norse-themed jewelry brand — cinematic product heroes, Shopify back-end, performance tuned for conversion.',
    'Asgard Ecommerce is a headless Shopify storefront built for a Norse-inspired fine jewelry brand. Cinematic product hero sequences — think Bifrost-lit slow pans across hand-forged rings and pendants — are paired with a rigorously optimised checkout funnel, proving that breathtaking visual design and sub-second LCP are not at odds. Odin himself would approve of the conversion rate.',
    E'Luxury ecommerce sites consistently make the same mistake: they pour budget into brand photography and then serve it through a theme so bloated that Core Web Vitals collapse, costing them both SEO rank and conversion. The brief for Asgard Ecommerce was explicit: the site must score above 90 on Lighthouse mobile without sacrificing the cinematic brand experience the jewelry deserved.\n\nThe solution was a fully headless architecture — Next.js as the rendering layer consuming Shopify''s Storefront API via GraphQL, with Tailwind CSS and Liquid-powered metafield extensions for product customisation. Cinematic product heroes are built from multi-layered parallax compositions using CSS `scroll-driven animations` and View Transitions API morphs between list and detail pages, so no additional JavaScript animation runtime was needed. Product images are served as AVIF with responsive `srcset`, reducing median image payload by 68 % versus the previous JPEG baseline. The Shopify Liquid templates power server-rendered product JSON-LD for SEO without duplicating the data model.\n\nThe storefront is currently in late-stage client review with a planned launch aligned to the Norse holiday gifting season. Early Lighthouse runs on staging show 94 mobile performance and 1.1 s LCP on median mobile hardware — comfortably inside the target and a tribute to the forge-work of both Odin''s dwarves and modern web platform APIs.',
    '["ecommerce", "brand", "performance"]'::jsonb,
    '["Next.js", "TypeScript", "Tailwind CSS", "Shopify", "Liquid"]'::jsonb,
    '["Next.js", "TypeScript", "Tailwind CSS", "Shopify", "Liquid"]'::jsonb,
    'Frontend Engineer & Shopify Architect',
    'in-progress',
    'thor',
    50,
    50,
    false,
    '#',
    '#',
    '/seed/asgard-ecommerce.webp',
    'Asgard Ecommerce cinematic product hero — Norse-themed jewelry on dark gold background',
    null,
    '[]'::jsonb,
    '[{"label": "Live", "url": "#", "type": "live"}, {"label": "Repo", "url": "#", "type": "repo"}]'::jsonb,
    '[{"label": "Lighthouse mobile (staging)", "value": "94"}, {"label": "LCP (median mobile)", "value": "1,100 ms"}, {"label": "Image payload reduction", "value": "68 %"}]'::jsonb,
    '["Architected headless Shopify storefront with Next.js and Storefront API GraphQL", "Built CSS scroll-driven animation parallax product heroes — zero JS animation runtime", "Implemented AVIF responsive images reducing image payload by 68 %", "Integrated Shopify Liquid metafield extensions for product customisation", "Added View Transitions API morphs for list-to-detail navigation"]'::jsonb,
    '["Lighthouse mobile score of 94 on staging — above 90 target", "1,100 ms LCP on median mobile hardware", "68 % reduction in image payload vs. JPEG baseline", "Product JSON-LD via Liquid powers structured SEO without data duplication"]'::jsonb,
    '00000000-0000-0000-0000-000000000000'::uuid,
    now(),
    now()
),

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Wano CMS  (draft · sort 60)
-- ─────────────────────────────────────────────────────────────────────────────
(
    'wano-cms',
    'Wano CMS',
    'An internal CMS prototype for a manga/anime fan-art collective, with ukiyo-e-influenced editor chrome and Supabase-powered content storage.',
    'Wano CMS is an opinionated internal content management prototype built for a manga and anime fan-art collective. The editor chrome draws from ukiyo-e woodblock aesthetic — bold ink outlines, flat ochre and vermilion fills, deliberate negative space — creating a workspace that feels native to the content it manages. Built on Supabase for storage and auth, it is designed to be forked and self-hosted by any creative community.',
    E'Content management systems for creative communities are almost always a compromise: powerful but ugly enterprise tools, or beautiful but limited no-code platforms that break the moment you need a custom content model. The Wano CMS prototype explores a third path — a bespoke, open-source CMS built for a specific aesthetic and a specific community, without sacrificing extensibility.\n\nThe editor chrome is where the ukiyo-e influence is most visible. Panels are bordered with a 2 px ink stroke and a subtle paper-grain texture rendered via SVG `feTurbulence`. Navigation uses a vertical brush-stroke menu that would look at home on a Wano scroll. The typography pairs Noto Serif JP for display headings with a monospaced body that evokes the precision of a woodblock cutter — a dual nod to the One Piece Wano arc''s visual language and the craft of its fictional artisans. In Thor mode the same structural components reskin cleanly to dark Asgardian slate, demonstrating how the dual-mode token system generalises beyond the primary portfolio context.\n\nThe prototype currently supports rich-text editing via a Tiptap-based editor, media uploads to Supabase Storage, role-based access with Supabase Auth row-level security policies, and a live content-preview pane. It is in active prototyping with the collective''s lead moderators, whose feedback is shaping the 0.1.0 specification.',
    '["product", "ux"]'::jsonb,
    '["React", "TypeScript", "Supabase", "PostgreSQL"]'::jsonb,
    '["React", "TypeScript", "Supabase", "PostgreSQL"]'::jsonb,
    'Product Engineer & UX Designer',
    'draft',
    'gear5',
    60,
    60,
    false,
    '#',
    '#',
    '/seed/wano-cms.webp',
    'Wano CMS editor interface showing ukiyo-e-inspired chrome with manga content',
    null,
    '[]'::jsonb,
    '[{"label": "Repo", "url": "#", "type": "repo"}, {"label": "Docs", "url": "#", "type": "docs"}]'::jsonb,
    '[{"label": "Content types", "value": "8"}, {"label": "Supabase Storage (media)", "value": "integrated"}, {"label": "Auth roles", "value": "4"}]'::jsonb,
    '["Designed ukiyo-e-influenced editor chrome with SVG paper-grain texture and ink-stroke borders", "Implemented Tiptap rich-text editor with custom extension for manga panel embeds", "Built Supabase Auth row-level security with four role tiers (reader / contributor / editor / admin)", "Created media upload pipeline to Supabase Storage with WebP conversion", "Established dual-mode token compatibility so editor reskins cleanly in Thor mode"]'::jsonb,
    '["Editor prototype validated with collective moderators — active feedback loop established", "Four-tier RLS policy covers all content access paths with zero application-layer auth checks", "Dual-mode reskin required zero component edits — tokens propagated automatically", "Media pipeline produces WebP output reducing storage footprint by 55 % vs. raw uploads"]'::jsonb,
    '00000000-0000-0000-0000-000000000000'::uuid,
    now(),
    now()
)

ON CONFLICT (slug) DO UPDATE SET
    title            = EXCLUDED.title,
    subtitle         = EXCLUDED.subtitle,
    summary          = EXCLUDED.summary,
    description      = EXCLUDED.description,
    tags             = EXCLUDED.tags,
    stack            = EXCLUDED.stack,
    tech             = EXCLUDED.tech,
    role             = EXCLUDED.role,
    status           = EXCLUDED.status,
    mode             = EXCLUDED.mode,
    priority         = EXCLUDED.priority,
    sort_order       = EXCLUDED.sort_order,
    featured         = EXCLUDED.featured,
    live_url         = EXCLUDED.live_url,
    repo_url         = EXCLUDED.repo_url,
    cover_url        = EXCLUDED.cover_url,
    hero_image_alt   = EXCLUDED.hero_image_alt,
    hero_video_url   = EXCLUDED.hero_video_url,
    gallery          = EXCLUDED.gallery,
    links            = EXCLUDED.links,
    metrics          = EXCLUDED.metrics,
    responsibilities = EXCLUDED.responsibilities,
    outcomes         = EXCLUDED.outcomes,
    updated_at       = now();

-- =============================================================================
-- After running: claim ownership
--
--   UPDATE projects
--      SET owner = '<your-auth-uid>'
--    WHERE owner = '00000000-0000-0000-0000-000000000000';
--
-- Find your auth UID in Supabase Dashboard → Authentication → Users.
-- =============================================================================

COMMIT;
