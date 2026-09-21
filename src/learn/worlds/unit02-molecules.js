/**
 * unit02-molecules.js — Learn world 2: Molecules.
 *
 * Ligar. Four benches, in the order the ideas have to arrive in: what a join IS,
 * what each kind of join builds, why a compound only ever has one recipe, and
 * how you count pieces far too small to count.
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
  line: 'Nothing here stands alone.',
  brief: 'Ligar is a field of black stone arches that should have fallen a thousand years ago. The arches teach the same lesson as the cargo: what holds a thing up is what it is joined to.',

  quests: [
    {
      id: 'q1-joins',
      title: 'What Holds',
      line: 'Some pieces cling, some will not touch.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit02/q1-joins.js')
    },
    {
      id: 'q2-lattice',
      title: 'Stone and Wire',
      line: 'Why one block shatters and the next one will not break.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit02/q2-lattice.js')
    },
    {
      id: 'q3-recipe',
      title: 'The Same Recipe',
      line: 'Every batch of it comes out the same way.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit02/q3-recipe.js')
    },
    {
      id: 'q4-weigh',
      title: 'Counting By Weight',
      line: 'Nobody has ever counted them. The yard still knows how many.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit02/q4-weigh.js')
    }
  ]
};
