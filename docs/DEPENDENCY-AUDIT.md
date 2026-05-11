# Dependency Audit

A snapshot of which packages in `package.json` are actively imported by the
app vs. installed but unused. Generated as part of the GitHub-readiness
pass — none of the unused candidates are removed yet, this doc is just the
to-do list for a future cleanup PR.

## Runtime dependencies

| Package | Status | Notes |
|---|---|---|
| `react`, `react-dom` | ✅ Used | Core framework. |
| `react-router-dom` | ✅ Used | All routing in `src/routes.tsx`. |
| `zustand` | ✅ Used | Mode + theme store in `src/stores/mode.ts`. |
| `@supabase/supabase-js` | ✅ Used | `src/lib/supabase.ts` and every admin / data service. |
| `@tailwindcss/vite` | ✅ Used | Build-time Tailwind v4 plugin. |
| `gsap` | ✅ Used | All scroll FX, hero animations, divider transitions. |
| `lenis` | ✅ Used | `src/lib/lenis.ts` smooth-scroll bootstrap. |
| `howler` | ✅ Used | `src/lib/audio.ts` — sound effects + drums loop. |
| `motion` | ⚠️ Unused | No `import` in `src/`. GSAP is the active animation lib. Safe to remove (`npm uninstall motion`). |
| `fuse.js` | ⚠️ Unused | No `import` in `src/`. Project search uses plain string includes. Safe to remove. |
| `d3-hierarchy` | ⚠️ Unused | Skill tree renders via custom layout, not d3. Also drop `@types/d3-hierarchy`. |
| `d3-shape` | ⚠️ Unused | Same — also drop `@types/d3-shape`. |

## Dev dependencies

| Package | Status | Notes |
|---|---|---|
| `vite` (npm:rolldown-vite), `@vitejs/plugin-react` | ✅ Used | Dev server + build. |
| `typescript`, `@types/*` | ✅ Used | Compiler + ambient types. |
| `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals` | ✅ Used | Linting (CI gate). |
| `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` | ✅ Used | Unit / component tests. |
| `tailwindcss`, `@tailwindcss/postcss`, `postcss`, `autoprefixer` | ✅ Used | CSS pipeline. |
| `@gltf-transform/cli` | ⚠️ Likely unused | Verify against `scripts/optimize-models.mjs` before removing — that script may shell out to it. |
| `sharp` | ⚠️ Likely unused | Verify against `scripts/optimize-luffy-assets.mjs` first. |

## Suggested cleanup command (deferred)

When ready, the safe-to-remove block is:

```bash
npm uninstall motion fuse.js d3-hierarchy d3-shape \
  @types/d3-hierarchy @types/d3-shape
```

For `@gltf-transform/cli` and `sharp`, first inspect the two `scripts/*.mjs`
files; if they don't `import` either package (they may shell out to a CLI
binary instead), those can also be uninstalled.

## Method

- `grep -rln "from .X." src/` for each runtime dep.
- `npm ls X` to confirm no transitive consumer.
- Cross-checked against `package-lock.json` — top-level deps match
  `package.json`, no version drift.
