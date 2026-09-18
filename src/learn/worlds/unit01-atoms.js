/**
 * unit01-atoms.js — Learn world 1: Atoms.
 *
 * CHART ONLY. Each quest is its own game module under src/learn/quests/, written
 * the way the Charge Gardens was written. Point a quest's `module` at that file
 * and flip its `status` to 'live'; the world goes live when it has one live quest.
 *
 * Quests are played in order. `stageCount` is the intended length and is what the
 * map shows before the quest exists; the module reports the real figure once built.
 */

export const UNIT_01 = {
  id: 'unit01',
  order: 1,
  code: '01',
  unit: 'Unit 1',
  world: 'Tallow',
  place: 'Salt flats',
  title: 'Atoms',
  line: 'Turn the dial until the grit stops getting finer.',
  brief: 'Tallow is a flat white nothing with good salvage under it. No buyer pays for a crate marked "assorted", so the work here is finding out what the stuff actually is.',

  quests: [
    {
      id: 'q1-grain',
      title: 'The Grain of Things',
      line: 'Magnify far enough and the picture stops changing.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q1-grain.js')
    },
    {
      id: 'q2-counting',
      title: 'The Counting Problem',
      line: 'A number too large to count, counted anyway.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q3-catalogue',
      title: 'The Catalogue Numbers',
      line: 'The scope orders every kind it meets. Find out what it is counting.',
      arena: 'chamber',
      stageCount: 10,
      status: 'draft',
      module: null
    }
  ]
};
