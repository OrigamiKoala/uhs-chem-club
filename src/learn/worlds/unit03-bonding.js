/**
 * unit02-molecules.js — Learn world 2: Molecules.
 *
 * Ligar. Four benches, in the order the ideas have to arrive in: what a join IS,
 * what each kind of join builds, why a compound only ever has one recipe, and
 * how you count atoms far too small to count.
 *
 * See unit01-atoms.js for how a quest is built and flipped live.
 */

export const UNIT_02 = {
  id: 'unit02',
  order: 2,
  code: '02',
  unit: 'Unit 2',
  world: 'Ligar',
  place: 'Basalt arches',
  title: 'Molecules',
  line: 'Chemical bonding, molecular structures, and stoichiometry.',
  brief: 'Learn how chemical bonds form, what structures they build, and how to measure chemical quantities by mass.',

  quests: [
    {
      id: 'q1-joins',
      title: 'What Holds',
      line: 'How chemical bonds form between atoms.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit02/q1-joins.js')
    },
    {
      id: 'q2-lattice',
      title: 'Stone and Wire',
      line: 'Structure and properties of ionic, molecular, and network solids.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit02/q2-lattice.js')
    },
    {
      id: 'q3-recipe',
      title: 'The Same Recipe',
      line: 'Definite proportions and percent composition in compounds.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit02/q3-recipe.js')
    },
    {
      id: 'q4-weigh',
      title: 'Counting By Weight',
      line: 'Using molar mass to count atoms and molecules by weighing.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit02/q4-weigh.js')
    }
  ]
};
