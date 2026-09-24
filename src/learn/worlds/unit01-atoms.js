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
 * FIVE BENCHES, AND THE LAST TWO ARE THE END OF THE UNIT. The road runs from
 * "what is the smallest piece" to "describe any piece with three numbers" and
 * stops there. Counting by weighing — the mole and molar mass — is Ligar's, not
 * Tallow's: a unit that has only just learned what a proton is has no business
 * being handed Avogadro's number.
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
  brief: 'Investigate the structure of atoms, subatomic particles, isotopes, and atomic mass across five benches.',

  quests: [
    {
      id: 'q1-grain',
      title: 'Atoms, Elements and Mixtures',
      line: 'Distinguish atoms, elements, compounds, and mixtures.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q1-grain.js')
    },
    {
      id: 'q2-core',
      title: 'Inside an Atom',
      line: 'Protons, neutrons, and electron shells.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q2-core.js')
    },
    {
      id: 'q3-catalogue',
      title: 'The Periodic Table',
      line: 'Periodic patterns, periods, and groups.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q3-catalogue.js')
    },
    {
      id: 'q4-ledger',
      title: 'Isotopes and Ions',
      line: 'Atomic number, mass number, and ions.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q4-ledger.js')
    },
    {
      id: 'q5-assay',
      title: 'Atomic Mass',
      line: 'Isotopes and average atomic mass.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q5-assay.js')
    }
  ]
};
