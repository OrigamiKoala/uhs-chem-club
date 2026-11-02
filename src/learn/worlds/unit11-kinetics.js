/**
 * unit11-kinetics.js — Learn world 11: Kinetics.
 *
 * CHART ONLY. See unit01-atoms.js for how a quest is built and flipped live.
 */

export const UNIT_11 = {
  id: 'unit11',
  order: 11,
  code: '11',
  unit: 'Unit 11',
  world: 'Quicklight',
  place: 'Storm belt',
  title: 'Kinetics',
  line: 'Reaction rates, rate laws, activation energy, and catalysis.',
  brief: 'Examine reaction rates, experimental rate laws, collision theory, activation energy, and catalysts across four benches.',

  quests: [
    {
      id: 'q1-stopwatch',
      title: 'On the Stopwatch',
      line: 'Two changes, both certain, a century apart.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q2-crowding',
      title: 'Crowding the Floor',
      line: 'More of it in the same room, and more of it meets.',
      arena: 'chamber',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q3-the-hill',
      title: 'Over the Hill',
      line: 'A knock that is too soft does nothing at all.',
      arena: 'chamber',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q4-shortcut',
      title: 'The Shortcut',
      line: 'Something helps, and comes back out untouched.',
      arena: 'chamber',
      stageCount: 8,
      status: 'draft',
      module: null
    }
  ]
};
