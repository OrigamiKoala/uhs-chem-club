/**
 * unit09-kinetics.js — Learn world 9: Kinetics.
 *
 * CHART ONLY. See unit01-atoms.js for how a quest is built and flipped live.
 */

export const UNIT_09 = {
  id: 'unit09',
  order: 9,
  code: '09',
  unit: 'Unit 9',
  world: 'Quicklight',
  place: 'Storm belt',
  title: 'Kinetics',
  line: 'Whether it happens is one question. How fast is another.',
  brief: 'Quicklight runs a belt of dry lightning that never touches down twice in the same hour. Everything in the belt is possible; almost nothing is quick.',

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
