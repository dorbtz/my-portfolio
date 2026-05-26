/**
 * src/components/grandLineCodex.ts
 *
 * Static lore data for the World Codex panel — collapsible drawer below the
 * map header that explains the broader One Piece world-system (geography,
 * Devil Fruits, Haki, Luffy persona). Data-driven so future copy edits are
 * one-line.
 */

export type CodexCard = {
  id: string;
  title: string;
  body: string[];
};

export const WORLD_CODEX: ReadonlyArray<CodexCard> = [
  {
    id: 'world-coords',
    title: 'World Coordinate System',
    body: [
      'The Red Line is the Y-axis — a continental ring that crosses the world from pole to pole.',
      'The Grand Line is the X-axis — a magnetic equator where compasses fail and Log Poses rule.',
      'The four Blues fill each quadrant. North, East, West, South.',
      'Reverse Mountain is the only legal entry: ocean currents climb the slope and dump ships into the Grand Line.',
      'The Calm Belts flank the Grand Line. No wind. No current. Sea Kings the size of cathedrals lurk below.',
    ],
  },
  {
    id: 'devil-fruits',
    title: 'Devil Fruits',
    body: [
      'Three families: Paramecia (body modification), Zoan (animal transformation), Logia (elemental being).',
      'Constraint: one fruit per soul. Eat a second and the body explodes.',
      'Trade-off: lose the ability to swim — sea water drains your strength on contact.',
      'Exception: Sea Stone. A mineral that emits the same energy as the sea. Cuffs, bullets, walls — it neutralises any fruit user.',
    ],
  },
  {
    id: 'haki',
    title: 'Haki',
    body: [
      'Observation Haki — packet sniffing for intent. Sense danger, predict moves, hear voices in the wind.',
      'Armament Haki — the firewall. A second skin of will that lets you punch ghosts and Logia bodies.',
      "Conqueror's Haki — system override. Few are born with it. It bends weaker wills into unconsciousness or submission.",
      'Haki transcends all. A fruitless fighter with mastered Haki beats a Logia with none.',
    ],
  },
  {
    id: 'luffy-logic',
    title: 'Luffy Logic',
    body: [
      'Dream: a feast big enough that no one at the table goes hungry. The world-wide banquet.',
      'Motivation: value = (dreams + actions) × the people you fight beside.',
      'Function: a chaos element. He breaks oppressive systems by being too weird to predict and too stubborn to flinch.',
      "Free first. Strong because of it. Pirate King is the title of the freest person alive — and he's coming for it.",
    ],
  },
];
