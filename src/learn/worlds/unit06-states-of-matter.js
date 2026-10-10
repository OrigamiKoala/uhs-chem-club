/**
 * unit03-states-of-matter.js — Learn world 3: States of Matter.
 *
 * CHART ONLY. See unit01-atoms.js for how a quest is built and flipped live.
 */

export const UNIT_03 = {
  id: 'unit03',
  order: 3,
  code: '03',
  unit: 'Unit 3',
  world: 'Mirrowen',
  place: 'Tidal shelf',
  title: 'States of Matter',
  line: 'Same stuff, three tempers.',
  brief: 'Mirrowen has a tide that comes in as ice and leaves as steam. Nothing on the shelf changes what it is made of, only how tightly it is holding on.',

  quests: [
    {
      id: 'q1-tempers',
      title: 'Three Tempers',
      line: 'Locked, sliding, or gone entirely.',
      arena: 'chamber',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q2-grip',
      title: 'The Grip Between',
      line: 'What one group does to the group beside it.',
      arena: 'chamber',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q3-crossing',
      title: 'The Crossing',
      line: 'Pour heat in and the temperature stops moving. Find out where it went.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q4-dissolve',
      title: 'Taken Into Solution',
      line: 'A solid goes missing and is still in the jar.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    }
  ]
};
