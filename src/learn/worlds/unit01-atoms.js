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
  line: 'Turn the dial until the grit stops getting finer.',
  brief: 'Tallow is an abandoned salt-flat refinery packed with sealed Imperial salvage. An orbital buyer is inbound, and our job is certifying what is actually inside each crate.',

  quests: [
    {
      id: 'q1-grain',
      title: 'The Grain of Things',
      line: 'Calibrate the bench scope to find the fundamental grain of matter.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q1-grain.js')
    },
    {
      id: 'q2-core',
      title: 'The Inside of a Piece',
      line: 'The blade could not divide it. Something else can.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q2-core.js')
    },
    {
      id: 'q3-catalogue',
      title: 'The Catalogue Numbers',
      line: 'The scope has filed every kind it met under a number. Find out what it counts.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q3-catalogue.js')
    },
    {
      id: 'q4-ledger',
      title: 'The Buyer\'s Ledger',
      line: 'Three numbers describe any piece on this flat. The buyer wants all three.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q4-ledger.js')
    },
    {
      id: 'q5-assay',
      title: 'The Weight On The Card',
      line: 'Nothing in the hopper weighs what the card says it does.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit01/q5-assay.js')
    }
  ]
};
