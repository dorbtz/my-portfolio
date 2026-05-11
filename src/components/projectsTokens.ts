// Round 60 (follow-up) — Tailwind utility removed; the Projects
// section's padding is now controlled by a higher-specificity CSS
// rule (`section#projects` in src/index.css) that beats the global
// .section padding without depending on Tailwind utility ordering.
export const PROJECTS_SECTION_PADDING = "" as const;
export const PROJECTS_GRID_SPACING = "mt-16" as const;
export const PROJECTS_GRID_GAP = "gap-9 xl:gap-12" as const;
