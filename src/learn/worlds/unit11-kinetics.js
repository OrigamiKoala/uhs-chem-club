/**
 * unit11-kinetics.js — Learn world 11: Quicklight (Kinetics).
 */

export const UNIT_11 = {
  id: 'unit11',
  order: 11,
  code: '11',
  unit: 'Unit 11',
  world: 'Quicklight',
  place: 'Storm belt',
  title: 'Kinetics',
  line: 'Reaction rates, rate laws, mechanisms, activation energy, and catalysis.',
  brief: 'Measure reaction rates, find rate laws, test collisions, trace reaction steps, and see how catalysts work across six refinery benches.',

  quests: [
    {
      id: 'q1-watch',
      title: 'Reaction Rates',
      line: 'Two feed lines make the same fuel, yet one tower is already overheating.',
      arena: 'bench',
      stageCount: 7,
      status: 'live',
      module: () => import('../quests/unit11/q1-watch.js')
    },
    {
      id: 'q2-law',
      title: 'The Rate Law',
      line: 'Three feeds enter the manifold, yet only two change how fast the tank heats.',
      arena: 'bench',
      stageCount: 5,
      status: 'live',
      module: () => import('../quests/unit11/q2-law.js')
    },
    {
      id: 'q3-time',
      title: 'Integrated Rate Laws',
      line: 'Half the fuel broke down in twenty seconds. How long until half of what is left is gone?',
      arena: 'bench',
      stageCount: 7,
      status: 'live',
      module: () => import('../quests/unit11/q3-time.js')
    },
    {
      id: 'q4-collide',
      title: 'Activation Energy',
      line: 'Fuel vapour sits in the cold tank without burning, even though burning releases energy.',
      arena: 'bench',
      stageCount: 9,
      status: 'live',
      module: () => import('../quests/unit11/q4-collide.js')
    },
    {
      id: 'q5-steps',
      title: 'Reaction Mechanisms',
      line: 'The additive runs in two steps, and only one of them controls how fast the tank burns.',
      arena: 'bench',
      stageCount: 7,
      status: 'live',
      module: () => import('../quests/unit11/q5-steps.js')
    },
    {
      id: 'q6-shortcut',
      title: 'Catalysts',
      line: 'A trace of powder in the vent speeds the burn tenfold and never runs out.',
      arena: 'bench',
      stageCount: 5,
      status: 'live',
      module: () => import('../quests/unit11/q6-shortcut.js')
    },
    {
      id: 'boss-flare',
      title: 'The Flare',
      line: 'Stabilize the runaway cracking tower.',
      arena: 'boss',
      stageCount: 5,
      status: 'live',
      module: () => import('../quests/unit11/boss-flare.js')
    }
  ]
};
