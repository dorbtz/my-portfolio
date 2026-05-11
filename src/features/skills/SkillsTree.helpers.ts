/**
 * src/components/SkillsTree.helpers.ts
 *
 * Non-component exports extracted from SkillsTree.tsx so that the
 * `react-refresh/only-export-components` lint rule is happy. Importers
 * (most notably the admin tree editor `SkillsTreeEditor`) consume the
 * coordinate tables + tier color map from here; the live SkillsTree
 * component re-uses the same values via direct import.
 *
 * Round 74 split — content unchanged from SkillsTree.tsx, only the
 * file boundary moved.
 */

export type StarPos = { x: number; y: number; tier: 'top' | 'mid' | 'root' };

/** 9 visited skill-domain stars, indexed parallel to SKILL_DOMAINS in
 *  src/data/skills.ts. Order:
 *   0 Vanaheim  · 1 Jotunheim · 2 Svartalfheim · 3 Niflheim · 4 Helheim
 *   5 Alfheim   · 6 Muspelheim · 7 Midgard     · 8 Asgard
 *
 *  Round 34 — exported so the Thor-mode admin tree editor
 *  (SkillsTreeEditor) can reuse the exact same coordinates as the live
 *  YggdrasilTree without duplication / drift. */
export const REALM_STARS: ReadonlyArray<StarPos> = [
  { x: 26, y: 30, tier: 'top'  }, // 0 Vanaheim — left canopy
  { x: 30, y: 56, tier: 'mid'  }, // 1 Jotunheim — left mid-branch
  { x: 70, y: 56, tier: 'mid'  }, // 2 Svartalfheim — right mid-branch
  { x: 32, y: 78, tier: 'root' }, // 3 Niflheim — left root
  { x: 68, y: 78, tier: 'root' }, // 4 Helheim — right root
  { x: 73, y: 30, tier: 'top'  }, // 5 Alfheim — right canopy
  { x: 50, y: 86, tier: 'root' }, // 6 Muspelheim — center root
  { x: 50, y: 56, tier: 'mid'  }, // 7 Midgard — trunk center
  { x: 50, y: 22, tier: 'top'  }, // 8 Asgard — canopy peak
];

/** 9 future-realm stars, indexed parallel to FUTURE_REALMS in src/data/skills.ts.
 *  Spread across the outer canopy / sky so visited stars stay legible.
 *
 *  Round 34 — exported for SkillsTreeEditor reuse (see REALM_STARS note). */
export const FUTURE_STARS: ReadonlyArray<StarPos> = [
  { x: 14, y: 22, tier: 'top'  }, // 0 Wakanda — far-left upper canopy
  { x: 18, y: 42, tier: 'mid'  }, // 1 Sanctum Sanctorum — left outer branch
  { x: 10, y: 60, tier: 'mid'  }, // 2 Vormir — far-left lower branch
  { x: 86, y: 22, tier: 'top'  }, // 3 Knowhere — far-right upper canopy
  { x: 82, y: 42, tier: 'mid'  }, // 4 Sakaar — right outer branch
  { x: 90, y: 60, tier: 'mid'  }, // 5 Titan — far-right lower branch
  { x: 38, y: 12, tier: 'top'  }, // 6 Quantum Realm — left sky
  { x: 50, y: 6,  tier: 'top'  }, // 7 Battleworld — sky peak
  { x: 62, y: 12, tier: 'top'  }, // 8 Eternity — right sky
];

export const TIER_COLORS: Record<'Bifrost' | 'Mystic' | 'Cosmic' | 'Quantum' | 'Multiversal', string> = {
  Bifrost:     '#76cfff',
  Mystic:      '#c084fc',
  Cosmic:      '#ffd700',
  Quantum:     '#34d399',
  Multiversal: '#ff6bd6',
};
