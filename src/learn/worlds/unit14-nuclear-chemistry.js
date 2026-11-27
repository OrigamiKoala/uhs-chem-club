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
  beyondAp: true,
  line: 'Radioactivity, radiation shielding, nuclear equations, stability, half-life, and nuclear energy.',
  brief: 'Measure radiation and test what stops it, balance nuclear equations, see which nuclei are stable, time decay with half-lives, and measure the energy binding a nucleus together.',

  quests: [
    { id: 'q1-still-warm', title: 'Still Warm', line: 'Warm ore drums with no fire nearby.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit14/q1-still-warm.js') },
    { id: 'q2-what-comes-off', title: 'What Comes Off', line: 'Three types of radiation, and paper stops only one.', arena: 'bench', stageCount: 6, status: 'live', module: () => import('../quests/unit14/q2-what-comes-off.js') },
    { id: 'q3-equations', title: 'Balancing the Nucleus', line: 'The reactor slag holds elements nobody loaded in.', arena: 'bench', stageCount: 7, status: 'live', module: () => import('../quests/unit14/q3-equations.js') },
    { id: 'q4-stability', title: 'Which Nuclei Last', line: 'Some nuclei in the Fifth\'s store keep decaying.', arena: 'bench', stageCount: 7, status: 'live', module: () => import('../quests/unit14/q4-stability.js') },
    { id: 'q5-half-gone', title: 'Half Gone, Then Half Again', line: 'A steady halving that acts like a clock.', arena: 'bench', stageCount: 7, status: 'live', module: () => import('../quests/unit14/q5-half-gone.js') },
    { id: 'q6-shortfall', title: 'The Missing Weight', line: 'A nucleus has less mass than its separate parts.', arena: 'bench', stageCount: 7, status: 'live', module: () => import('../quests/unit14/q6-shortfall.js') },
    { id: 'boss-core', title: 'The Transmutation Core', line: 'Shut down the Fifth\'s reactor.', arena: 'boss', stageCount: 5, status: 'live', module: () => import('../quests/unit14/boss-core.js') }
  ]
};
