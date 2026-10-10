/**
 * unit05-equilibrium.js — Learn world 5: Equilibrium.
 *
 * CHART ONLY. See unit01-atoms.js for how a quest is built and flipped live.
 */

export const UNIT_05 = {
  id: 'unit05',
  order: 5,
  code: '05',
  unit: 'Unit 5',
  world: 'Teeter',
  place: 'Salt pans',
  title: 'Equilibrium',
  line: 'Both ways at once, and still.',
  brief: 'The pans on Teeter never fill and never dry. Something is running in both directions at the same rate, and the trick is learning to lean on it.',

  quests: [
    {
      id: 'q1-both-ways',
      title: 'Running Both Ways',
      line: 'A level that holds while everything underneath keeps moving.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q2-the-number',
      title: 'The Number That Holds',
      line: 'Different starts, same settled ratio.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q3-lean',
      title: 'Lean On It',
      line: 'Push the pan and watch where it pushes back.',
      arena: 'bench',
      stageCount: 8,
      status: 'draft',
      module: null
    },
    {
      id: 'q4-harvest',
      title: 'Taking the Harvest',
      line: 'Keep removing what you want and the pan keeps making it.',
      arena: 'field',
      stageCount: 8,
      status: 'draft',
      module: null
    }
  ]
};
