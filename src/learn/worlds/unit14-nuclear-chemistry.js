/**
 * unit14-nuclear-chemistry.js — Learn world 14: Cinder Halo (nuclear chemistry). Spec and build record: `docs/plans/cinderhalo-world.md`.
 *
 * The last world on the road, and the only one where the piece that would not divide in world 1 finally does: the nucleus changes.
 * The four-quest draft chart this replaces kept the ids `q1-still-warm` and `q2-what-comes-off`; its `q3-half-gone` and
 * `q4-the-shortfall` are now `q5-half-gone` and `q6-shortfall` (never built or played, so no progress names them).
 */

export const UNIT_14 = {
  id: 'unit14',
  order: 14,
  code: '14',
  unit: 'Unit 14',
  world: 'Cinder Halo',
  place: 'Crater sea',
  title: 'Nuclear Chemistry',
  line: 'Radioactivity, the three radiations, nuclear equations, stability, half-life, and the energy in a nucleus.',
  brief: 'Count radiation and find what stops it, balance nuclear equations, find which nuclei last, time a decay by its half-life, and weigh the energy that holds a nucleus together.',

  quests: [
    { id: 'q1-still-warm', title: 'Still Warm', line: 'Heat with no fire under it.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit14/q1-still-warm.js') },
    { id: 'q2-what-comes-off', title: 'What Comes Off', line: 'Three things leave the ore, and paper stops only one.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit14/q2-what-comes-off.js') },
    { id: 'q3-equations', title: 'Balancing the Nucleus', line: 'The slag holds elements the ore never had.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit14/q3-equations.js') },
    { id: 'q4-stability', title: 'Which Nuclei Last', line: 'Some of the Fifth\'s made nuclei will not keep.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q5-half-gone', title: 'Half Gone, Then Half Again', line: 'A countdown that never quite reaches nothing.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q6-shortfall', title: 'The Missing Weight', line: 'The pieces weigh less together than they did apart.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'boss-core', title: 'The Transmutation Core', line: 'Shut down the Fifth\'s reactor.', arena: 'boss', stageCount: 5, status: 'draft', module: null }
  ]
};
