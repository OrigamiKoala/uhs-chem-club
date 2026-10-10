/**
 * unit02-quantum.js — Learn world 2: Light and Electrons.
 *
 * CHART ONLY. Planned in `docs/plans/learn-quests.md`. Tallow left the
 * player with electrons on rings at fixed distances and no reason why; this
 * world is the reason. It runs from light as a wave, through the photon and
 * the line spectrum, to orbitals, configurations, the photoelectron spectrum
 * and the periodic trends they explain, and ends on how much light a sample
 * absorbs.
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
    { id: 'q1-wave', title: 'Light as a Wave', line: 'Wavelength, frequency, and the spectrum.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q2-photon', title: 'Photons', line: 'Light arrives in packets, and frequency sets their energy.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q3-lines', title: 'Line Spectra', line: 'Only certain colours, because only certain energies.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q4-cloud', title: 'Orbitals', line: 'Where an electron is likely to be found, and the shapes that makes.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q5-numbers', title: 'Quantum Numbers', line: 'Four numbers that name every electron.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q6-filling', title: 'Electron Configuration', line: 'The order orbitals fill, and the exceptions.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q7-pes', title: 'Photoelectron Spectroscopy', line: 'Reading an atom from the electrons knocked out of it.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q8-trends', title: 'Periodic Trends', line: 'Size, ionization energy, and electronegativity from the pull of the core.', arena: 'bench', stageCount: 8, status: 'draft', module: null },
    { id: 'q9-absorb', title: 'Spectroscopy', line: 'What each kind of light does to a molecule, and how much is absorbed.', arena: 'bench', stageCount: 8, status: 'draft', module: null }
  ]
};
