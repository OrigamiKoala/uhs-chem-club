/**
 * unit08-thermodynamics.js — Learn world 8: Thermodynamics.
 *
 * CHART ONLY. See unit01-atoms.js for how a quest is built and flipped live.
 */

export const UNIT_08 = {
  id: 'unit08',
  order: 8,
  code: '08',
  unit: 'Unit 8',
  world: 'Ember Reach',
  place: 'Vent fields',
  title: 'Thermodynamics',
  line: 'Heat goes where it is not.',
  brief: 'Ember Reach is a plain of vents that have been leaking warmth into the sky for an age and are still not finished. The field never runs the other way, and that is the whole lesson.',

  quests: [
    {
      id: 'q1-downhill',
      title: 'Always Downhill',
      line: 'Warm finds cold. It never finds it back.',
      arena: 'field',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q2-books',
      title: 'Heat In, Heat Out',
      line: 'Some changes pay you and some charge you.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q3-spread',
      title: 'The Spread of Things',
      line: 'Count the ways it could be arranged.',
      arena: 'chamber',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q4-will-it',
      title: 'Will It Go At All',
      line: 'Two books, one verdict, and the temperature casts the vote.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    }
  ]
};
