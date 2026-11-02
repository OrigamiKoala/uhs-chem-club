/**
 * unit08-equilibrium.js — Learn world 8: Equilibrium.
 *
 * CHART ONLY. See unit01-atoms.js for how a quest is built and flipped live.
 */

export const UNIT_08 = {
  id: 'unit08',
  order: 8,
  code: '08',
  unit: 'Unit 8',
  world: 'Teeter',
  place: 'Salt pans',
  title: 'Equilibrium',
  line: 'Dynamic equilibrium, equilibrium constants, and Le Chatelier’s principle.',
  brief: 'Explore reversible reactions, dynamic equilibrium, equilibrium constants, and Le Chatelier’s principle across four benches.',

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
