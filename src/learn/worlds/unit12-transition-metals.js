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
  line: 'd electrons, many charges, complex ions, their shapes, colour and magnetism.',
  brief: 'Read the d electrons of the fourth-row metals, the charges they take, the complex ions they form, and why those are coloured and some are pulled by a magnet.',

  quests: [
    { id: 'q1-dblock', title: 'The d-Block', line: 'The Fifth\'s manifest calls every drum iron salt.', arena: 'bench', stageCount: 6, status: 'live', module: () => import('../quests/unit12/q1-dblock.js') },
    { id: 'q2-charges', title: 'Many Charges', line: 'The manifest gives every metal a single charge.', arena: 'bench', stageCount: 6, status: 'live', module: () => import('../quests/unit12/q2-charges.js') },
    { id: 'q3-complex', title: 'Complex Ions', line: 'Drums went deep blue where ammonia was spilled.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit12/q3-complex.js') },
    { id: 'q4-shapes', title: 'Shapes and Isomers', line: 'Two drums list one formula and behave differently.', arena: 'bench', stageCount: 6, status: 'draft', module: null },
    { id: 'q5-colour', title: 'Colour', line: 'Colour is the only label left on the drums.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q6-spin', title: 'Magnetism', line: 'The Coil pulls some drums and leaves others.', arena: 'bench', stageCount: 7, status: 'draft', module: null },
    { id: 'boss-coil', title: 'The Coil', line: 'Shut down the Fifth\'s sorting magnet.', arena: 'boss', stageCount: 5, status: 'draft', module: null }
  ]
};
