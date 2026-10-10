/**
 * unit10-nuclear-chemistry.js — Learn world 10: Nuclear Chemistry.
 *
 * CHART ONLY. See unit01-atoms.js for how a quest is built and flipped live.
 *
 * This is the last world on the road, and the only one where the piece that
 * would not divide in world 1 finally does.
 */

export const UNIT_10 = {
  id: 'unit10',
  order: 10,
  code: '10',
  unit: 'Unit 10',
  world: 'Cinder Halo',
  place: 'Crater sea',
  title: 'Nuclear Chemistry',
  line: 'The thing that would not divide, dividing.',
  brief: 'Cinder Halo is a ring of craters that are still warm and no one can say from what. Whatever happened here went deeper than any furnace can reach.',

  quests: [
    {
      id: 'q1-still-warm',
      title: 'Still Warm',
      line: 'Heat with no fire under it.',
      arena: 'field',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q2-what-comes-off',
      title: 'What Comes Off',
      line: 'Three things leave the crater, and paper stops only one.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q3-half-gone',
      title: 'Half Gone, Then Half Again',
      line: 'A countdown that never quite reaches nothing.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q4-the-shortfall',
      title: 'The Missing Weight',
      line: 'The pieces weigh less together than they did apart.',
      arena: 'chamber',
      stageCount: 8,
      status: 'draft',
      module: null
    }
  ]
};
