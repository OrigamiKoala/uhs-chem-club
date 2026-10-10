/**
 * unit06-acids-and-bases.js — Learn world 6: Acids and Bases.
 *
 * CHART ONLY. See unit01-atoms.js for how a quest is built and flipped live.
 */

export const UNIT_06 = {
  id: 'unit06',
  order: 6,
  code: '06',
  unit: 'Unit 6',
  world: 'Verdigris',
  place: 'Acid marsh',
  title: 'Acids and Bases',
  line: 'Something gives it up, something takes it.',
  brief: 'The marsh on Verdigris eats boots, hull plate and survey drones at different speeds. Everything down there is either handing something over or grabbing for it.',

  quests: [
    {
      id: 'q1-handover',
      title: 'The Handover',
      line: 'One passes it along, one reaches for it.',
      arena: 'chamber',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q2-strength',
      title: 'How Much Lets Go',
      line: 'Two marsh waters, the same count, very different bite.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q3-the-scale',
      title: 'Reading the Scale',
      line: 'Every step on the gauge is ten times the last.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q4-neutral',
      title: 'Bringing It Level',
      line: 'Add the opposite until the gauge sits in the middle.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    }
  ]
};
