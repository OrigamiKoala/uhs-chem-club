/**
 * unit12-transition-metals.js — Learn world 12: Lodestone (the transition metals). Spec and build record: `docs/plans/lodestone-world.md`.
 */

export const UNIT_12 = {
  id: 'unit12',
  order: 12,
  code: '12',
  unit: 'Unit 12',
  world: 'Lodestone',
  place: 'Iron canyons',
  title: 'Transition Metals',
  beyondAp: true,
  line: 'd electrons, multiple charges, complex ions, shapes, colour, and magnetism.',
  brief: 'Explore how fourth-row metals arrange their d electrons, form multiple charges and complex ions, and produce colour and magnetism.',

  quests: [
    { id: 'q1-dblock', title: 'The d-Block', line: 'The Fifth\'s manifest calls every drum iron salt.', arena: 'bench', stageCount: 6, status: 'live', module: () => import('../quests/unit12/q1-dblock.js') },
    { id: 'q2-charges', title: 'Oxidation States', line: 'The manifest gives every metal a single charge.', arena: 'bench', stageCount: 6, status: 'live', module: () => import('../quests/unit12/q2-charges.js') },
    { id: 'q3-complex', title: 'Complex Ions', line: 'Drums turned deep blue where ammonia spilled.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit12/q3-complex.js') },
    { id: 'q4-shapes', title: 'Coordination Isomers', line: 'Two drums share one formula but behave differently.', arena: 'bench', stageCount: 6, status: 'live', module: () => import('../quests/unit12/q4-shapes.js') },
    { id: 'q5-colour', title: 'Crystal Field Color', line: 'Colour is the only label left on the drums.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit12/q5-colour.js') },
    { id: 'q6-spin', title: 'Magnetism', line: 'The Coil pulls some drums and ignores others.', arena: 'bench', stageCount: 7, status: 'live', module: () => import('../quests/unit12/q6-spin.js') },
    { id: 'boss-coil', title: 'The Coil', line: 'Shut down the Fifth\'s sorting magnet.', arena: 'boss', stageCount: 5, status: 'live', module: () => import('../quests/unit12/boss-coil.js') }
  ]
};
