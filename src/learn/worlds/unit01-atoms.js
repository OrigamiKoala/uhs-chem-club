/**
 * unit01-atoms.js — Learn world 1: Atoms.
 *
 * CHART ONLY. Each quest is its own game module under src/learn/quests/, written
 * the way the Charge Gardens was written. Point a quest's `module` at that file
 * and flip its `status` to 'live'; the world goes live when it has one live quest.
 *
 * Quests are played in order. `stageCount` is the intended length and is what the
 * map shows before the quest exists; the module reports the real figure once built.
 *
 * SIX BENCHES. The road runs from "what is the smallest piece" to "describe any
 * piece with three numbers", then weighs it: atomic mass, then the mole. The mole
 * was Ligar's and later Kettle's; it moved here on 2026-10-10 because Bellows,
 * Ember Reach and Mirrowen all need it, and AP Unit 1 teaches it beside atomic
 * mass. `q6-weigh` stands at site 6 on Tallow's ground (the site-5 hopper gantry,
 * laid a second time), so at T4 it is worked on a real bench like the rest.
 */

export const UNIT_01 = {
  id: 'unit01',
  order: 1,
  code: '01',
  unit: 'Unit 1',
  world: 'Tallow',
  place: 'Salt flats',
  title: 'Atoms',
  line: 'Atomic structure, elements, and the periodic table.',
  brief: 'Investigate the structure of atoms, subatomic particles, isotopes, atomic mass and the mole across six benches.',

  quests: [
    {
      id: 'q1-grain',
      title: 'Atoms, Elements and Mixtures',
      line: 'Sort samples into elements, compounds, and mixtures.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q1-grain.js')
    },
    {
      id: 'q2-core',
      title: 'Inside an Atom',
      line: 'Probe the nucleus, protons, neutrons, and electron shells.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q2-core.js')
    },
    {
      id: 'q3-catalogue',
      title: 'The Periodic Table',
      line: 'Lay every element in order and read the repeating pattern.',
      arena: 'bench',
      stageCount: 7,
      status: 'live',
      module: () => import('../quests/unit01/q3-catalogue.js')
    },
    {
      id: 'q4-ledger',
      title: 'Isotopes and Ions',
      line: 'Track protons, neutrons, and electrons to describe isotopes and ions.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q4-ledger.js')
    },
    {
      id: 'q5-assay',
      title: 'Atomic Mass',
      line: 'Calculate average atomic mass from isotope abundances.',
      arena: 'bench',
      stageCount: 10,
      status: 'live',
      module: () => import('../quests/unit01/q5-assay.js')
    },
    {
      id: 'q6-weigh',
      title: 'Counting By Weight',
      line: 'Use molar mass to count atoms and molecules by weight.',
      arena: 'bench',
      stageCount: 12,
      status: 'live',
      module: () => import('../quests/unit01/q6-weigh.js')
    },
    {
      id: 'boss-hopper',
      title: 'The Hopper',
      line: 'Synthesize atomic structure and mass across five phases.',
      arena: 'boss',
      stageCount: 5,
      status: 'live',
      module: () => import('../quests/unit01/boss-hopper.js')
    }
  ]
};
