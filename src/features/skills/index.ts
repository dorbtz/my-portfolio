/**
 * src/features/skills/index.ts
 *
 * Barrel exports for the skills feature. See docs/ARCHITECTURE.md for the
 * target folder layout. Implementations currently live at:
 *   - src/components/Skills.tsx
 *   - src/components/SkillsTree.tsx
 *   - src/components/GrandLineMap.tsx
 *   - src/data/skills.ts
 */

export { default as Skills } from '../../components/Skills';
export { default as SkillsTree } from '../../components/SkillsTree';
export { default as GrandLineMap } from '../../components/GrandLineMap';
export {
  SKILL_DOMAINS,
  FUTURE_REALMS,
  FUTURE_ISLANDS,
  type SkillDomain,
  type SkillLeaf,
  type FutureRealm,
  type FutureIsland,
} from '../../data/skills';
