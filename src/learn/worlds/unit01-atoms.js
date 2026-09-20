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
  line: 'What everything is made of, and how to tell one kind from another.',
  brief: 'Tallow is an abandoned refinery on a salt flat. Five benches are still working, and each one answers a different question about what matter is made of.',

  quests: [
    {
      id: 'q1-grain',
      title: 'Atoms, Elements and Mixtures',
      line: 'Zoom in until matter stops being smooth.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q1-grain.js')
    },
    {
      id: 'q2-core',
      title: 'Inside an Atom',
      line: 'Protons, neutrons and electrons, and where each one sits.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q2-core.js')
    },
    {
      id: 'q3-catalogue',
      title: 'The Periodic Table',
      line: 'Line the elements up by proton count and a pattern appears.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q3-catalogue.js')
    },
    {
      id: 'q4-ledger',
      title: 'Isotopes and Ions',
      line: 'Three numbers are enough to describe any atom.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q4-ledger.js')
    },
    {
      id: 'q5-assay',
      title: 'Atomic Mass',
      line: 'Why the mass on the card is never a whole number.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q5-assay.js')
    }
  ]
};
