/**
 * unit02-molecules.js — Learn world 2: Molecules.
 *
 * CHART ONLY. See unit01-atoms.js for how a quest is built and flipped live.
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
      arena: 'chamber',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q2-shapes',
      title: 'The Shape It Takes',
      line: 'Joined pieces push each other as far apart as they can get.',
      arena: 'chamber',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q3-pull',
      title: 'The Uneven Pull',
      line: 'A join can be lopsided, and the whole thing leans with it.',
      arena: 'chamber',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q4-lattice',
      title: 'Stone and Wire',
      line: 'Why one salvage shatters and the next one bends.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    }
  ]
};
