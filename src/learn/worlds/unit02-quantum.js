/**
 * unit02-quantum.js — Learn world 2: Light and Electrons.
 *
 * ALL NINE BENCHES ARE BUILT, and Lanternfall is walkable ground at T4
 * (`three/lanternfall.js`). Tallow left the player with electrons on rings at
 * fixed distances and no reason why; this world is the reason. It runs from
 * light as a wave, through the photon and the line spectrum, to orbitals,
 * quantum numbers, configurations, the photoelectron spectrum and the
 * periodic trends they explain, and ends on how much light a sample absorbs.
 * Planned in `docs/plans/learn-quests.md`; the ground in
 * `docs/plans/lanternfall-world.md`.
 *
 * See unit01-atoms.js for how a quest is built and flipped live.
 */

export const UNIT_02 = {
  id: 'unit02',
  order: 2,
  code: '02',
  unit: 'Unit 2',
  world: 'Lanternfall',
  place: 'Aurora ice',
  title: 'Light and Electrons',
  line: 'Light, energy levels, orbitals, and periodic trends.',
  brief: 'Find out why electrons sit only at certain energies, how light reveals them, and how their arrangement shapes the periodic table.',

  quests: [
    { id: 'q1-wave', title: 'Light as a Wave', line: 'Tune spare lamps while the beacons stay dark.', arena: 'bench', stageCount: 4, status: 'live', module: () => import('../quests/unit02/q1-wave.js') },
    { id: 'q2-photon', title: 'Photons', line: 'Test why the moths drink violet and shun red.', arena: 'bench', stageCount: 5, status: 'live', module: () => import('../quests/unit02/q2-photon.js') },
    { id: 'q3-lines', title: 'Line Spectra', line: 'Read each beacon gas by its lines.', arena: 'bench', stageCount: 5, status: 'live', module: () => import('../quests/unit02/q3-lines.js') },
    { id: 'q4-cloud', title: 'Orbitals', line: 'Map where the beacon electrons hide.', arena: 'bench', stageCount: 5, status: 'live', module: () => import('../quests/unit02/q4-cloud.js') },
    { id: 'q5-numbers', title: 'Quantum Numbers', line: 'Give every electron its address.', arena: 'bench', stageCount: 5, status: 'live', optional: true, module: () => import('../quests/unit02/q5-numbers.js') },
    { id: 'q6-filling', title: 'Electron Configuration', line: 'Fill each atom the way nature does.', arena: 'bench', stageCount: 5, status: 'live', module: () => import('../quests/unit02/q6-filling.js') },
    { id: 'q7-pes', title: 'Photoelectron Spectroscopy', line: 'Knock electrons out to weigh each shell.', arena: 'bench', stageCount: 5, status: 'live', module: () => import('../quests/unit02/q7-pes.js') },
    { id: 'q8-trends', title: 'Periodic Trends', line: 'Chart how hard each atom pulls its electrons.', arena: 'bench', stageCount: 5, status: 'live', module: () => import('../quests/unit02/q8-trends.js') },
    { id: 'q9-absorb', title: 'Spectroscopy', line: 'Measure what murky water does to light.', arena: 'bench', stageCount: 8, status: 'live', module: () => import('../quests/unit02/q9-absorb.js') },
    { id: 'boss-eater', title: 'The Lantern-Eater', line: 'Starve the Lantern-Eater and take its lens.', arena: 'boss', stageCount: 5, status: 'live', module: () => import('../quests/unit02/boss-eater.js') }
  ]
};
