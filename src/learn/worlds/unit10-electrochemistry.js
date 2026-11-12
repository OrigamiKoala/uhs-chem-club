/**
 * unit10-electrochemistry.js — Learn world 10: Electrochemistry.
 *
 * CHART ONLY. Planned in `docs/plans/learn-quests.md`. Verdigris ends on one
 * substance handing a proton to another; Brinewire is the same idea with an
 * electron, and a wire to make it do work.
 *
 * See unit01-atoms.js for how a quest is built and flipped live.
 */

export const UNIT_10 = {
  id: 'unit10',
  order: 10,
  code: '10',
  unit: 'Unit 10',
  world: 'Brinewire',
  place: 'Copper marsh',
  title: 'Electrochemistry',
  line: 'Redox reactions, galvanic cells, and cell potentials.',
  brief: 'Explore oxidation-reduction reactions, galvanic cells, standard reduction potentials, and electrolysis across six benches.',

  quests: [
    { id: 'q1-halves', title: 'Half-Reactions', line: 'The pylons are rotting; find what moves when a metal rots.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit10/q1-halves.js') },
    { id: 'q2-activity', title: 'Which Metal Gives', line: 'Two bolts on one pylon rot at different speeds; find which metal gives.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit10/q2-activity.js') },
    { id: 'q3-galvanic', title: 'Galvanic Cells', line: 'Every marsh cell stopped when a bridge was cut; find what keeps one running.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit10/q3-galvanic.js') },
    { id: 'q4-potential', title: 'Cell Potential', line: 'Each marsh cell reads a different voltage; find what sets the number.', arena: 'bench', stageCount: 7, status: 'live', module: () => import('../quests/unit10/q4-potential.js') },
    { id: 'q5-load', title: 'Under Load', line: 'The marsh cells fade over a day; find what a cell does as it runs.', arena: 'bench', stageCount: 7, status: 'live', module: () => import('../quests/unit10/q5-load.js') },
    { id: 'q6-electrolysis', title: 'Electrolysis', line: 'Someone is pushing current into the pools; find what it does.', arena: 'bench', stageCount: 7, status: 'live', module: () => import('../quests/unit10/q6-electrolysis.js') },
    { id: 'boss-clamp', title: 'The Clamp', line: 'The drain clamp holds five cells; test each of them against what you have read.', arena: 'boss', stageCount: 5, status: 'live', module: () => import('../quests/unit10/boss-clamp.js') }
  ]
};
