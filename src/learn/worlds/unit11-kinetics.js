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
  brief: 'Investigate reaction rates, experimental rate laws, integrated plots, collision theory, mechanisms, and catalysts across six refinery benches.',

  quests: [
    {
      id: 'q1-watch',
      title: 'How Fast',
      line: 'Two feed lines yield the same fuel, yet one tower is already overheating.',
      arena: 'bench',
      stageCount: 6,
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
      title: 'Concentration Over Time',
      line: 'Half the peroxide broke down in twenty seconds; how long until half of what remains is gone?',
      arena: 'bench',
      stageCount: 5,
      status: 'live',
      module: () => import('../quests/unit11/q3-time.js')
    },
    {
      id: 'q4-collide',
      title: 'Collisions and the Hill',
      line: 'Fuel vapour sits in the cold tank without burning, even though burning releases energy.',
      arena: 'bench',
      stageCount: 7,
      status: 'live',
      module: () => import('../quests/unit11/q4-collide.js')
    },
    {
      id: 'q5-steps',
      title: 'Steps',
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
      status: 'draft',
      module: null
    }
  ]
};
