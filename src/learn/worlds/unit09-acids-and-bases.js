/**
 * unit09-acids-and-bases.js — Learn world 9: Acids and Bases.
 *
 * Verdigris. Eight benches on the ph kit (`table/kits/ph.js`) and the Leach, a boss at the pump house of the acid marsh:
 *   1. q1-handover   — The Handover (CED 8.1)
 *   2. q2-scale      — Reading the Scale (CED 8.1, 8.2)
 *   3. q3-weak       — Weak Acids and Bases (CED 8.3)               built (the vertical slice)
 *   4. q4-structure  — Acid Strength and Structure (CED 8.6)
 *   5. q5-salts      — Neutralization and Salts (CED 8.4)
 *   6. q6-titrate    — Titration Curves (CED 8.5, 8.7)
 *   7. q7-buffer     — Buffers (CED 8.4, 8.8, 8.9)
 *   8. q8-capacity   — pKa, Protonation and Capacity (CED 8.7, 8.10, 8.11)
 *   9. boss-leach    — The Leach
 * Spec and build record: docs/plans/verdigris-world.md. A quest is `draft` with `module: null` until its bench is built.
 */

export const UNIT_09 = {
  id: 'unit09',
  order: 9,
  code: '09',
  unit: 'Unit 9',
  world: 'Verdigris',
  place: 'Acid marsh',
  title: 'Acids and Bases',
  line: 'Proton transfer, the pH scale, weak acids and bases, titrations and buffers.',
  brief: 'Acids hand protons to bases, and a pH reading counts the hydronium they leave. In Verdigris, read flasks of marsh water, find what sets an acid’s strength, follow a titration and see what holds a pH steady.',

  quests: [
    {
      id: 'q1-handover',
      title: 'The Handover',
      line: 'The Fifth calls the marsh water acid; find what an acid does to water.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit09/q1-handover.js')
    },
    {
      id: 'q2-scale',
      title: 'Reading the Scale',
      line: 'The Fifth gives one number for the marsh; find what a pH number counts.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit09/q2-scale.js')
    },
    {
      id: 'q3-weak',
      title: 'Weak Acids and Bases',
      line: 'Two tanks hold the same amount of acid; find why they do not read the same.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit09/q3-weak.js')
    },
    {
      id: 'q4-structure',
      title: 'Acid Strength and Structure',
      line: 'The Fifth ranked the tanks by what they were made of; find what sets an acid’s strength.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit09/q4-structure.js')
    },
    {
      id: 'q5-salts',
      title: 'Neutralization and Salts',
      line: 'The Fifth neutralised a tank and called it safe; measure what was left.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit09/q5-salts.js')
    },
    {
      id: 'q6-titrate',
      title: 'Titration Curves',
      line: 'The Fifth reported the moment a tank was neutral; find what a titration curve shows.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit09/q6-titrate.js')
    },
    {
      id: 'q7-buffer',
      title: 'Buffers',
      line: 'One sluice resists acid and one does not; find what in the water does.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit09/q7-buffer.js')
    },
    {
      id: 'q8-capacity',
      title: 'pKa, Protonation and Capacity',
      line: 'The sluice held, then failed; find how much it could take.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit09/q8-capacity.js')
    },
    {
      id: 'boss-leach',
      title: 'The Leach',
      line: 'The sump pump at the pump house calls every vat safe; test five vats against it.',
      arena: 'boss',
      stageCount: 5,
      status: 'live',
      module: () => import('../quests/unit09/boss-leach.js')
    }
  ]
};
