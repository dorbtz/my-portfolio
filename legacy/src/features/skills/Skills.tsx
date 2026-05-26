/**
 * src/components/Skills.tsx
 *
 * Skills section — Grand Line / Yggdrasil tree as the SOLE visualization.
 * The bento grid was removed in favour of a single mode-aware skill tree
 * (Yggdrasil for Thor, Grand Line map for Luffy) that already encodes
 * domains, proficiency tiers, and gear/realm metadata.
 */
import Section from '../../shared/ui/Section';
import SkillsTree from './SkillsTree';

export default function Skills() {
  return (
    <Section id="skills" label="Skills">
      {/* Visible title removed — section is in the menu. SR-only h2 keeps a11y. */}
      <h2 className="sr-only">Skills — multidisciplinary craft, mapped across realms</h2>

      <SkillsTree />
    </Section>
  );
}
