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
    { id: 'q1-halves', title: 'Half-Reactions', line: 'Splitting a redox reaction and balancing what moves.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q2-activity', title: 'Which Metal Gives', line: 'The activity series, from metals dropped into each other\'s salts.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q3-galvanic', title: 'Galvanic Cells', line: 'Two half-cells, a wire and a salt bridge.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q4-potential', title: 'Cell Potential', line: 'Each marsh cell reads a different voltage; find what sets the number.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit10/q4-potential.js') },
    { id: 'q5-load', title: 'Under Load', line: 'Why a cell runs down, and concentration cells.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q6-electrolysis', title: 'Electrolysis', line: 'Driving a reaction uphill, and Faraday\'s law.', arena: 'bench', stageCount: 8, status: 'draft', module: null }
  ]
};
