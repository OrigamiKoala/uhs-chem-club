/**
 * unit07-gases.js — Learn world 7: Gases.
 *
 * CHART ONLY. See unit01-atoms.js for how a quest is built and flipped live.
 */

export const UNIT_07 = {
  id: 'unit07',
  order: 7,
  code: '07',
  unit: 'Unit 7',
  world: 'Bellows',
  place: 'Cloud deck',
  title: 'Gases',
  line: 'Squeeze it, warm it, watch it answer.',
  brief: 'There is no ground on Bellows, only deck after deck of pressurised cloud. Every gauge on the ship was calibrated somewhere in that column.',

  quests: [
    {
      id: 'q1-drumming',
      title: 'The Drumming on the Wall',
      line: 'Pressure is a great many small knocks.',
      arena: 'chamber',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q2-trades',
      title: 'Room for Room',
      line: 'Give it less space and it pushes harder.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q3-one-law',
      title: 'One Gauge for All of It',
      line: 'Four dials that turn out to be one relationship.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q4-mixtures',
      title: 'Sharing the Tank',
      line: 'Each one pushes as if the others were not there.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    }
  ]
};
