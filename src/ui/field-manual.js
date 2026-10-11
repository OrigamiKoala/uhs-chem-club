/**
 * field-manual.js — The Field Manual: vocabulary as a collection.
 * Pure data registry of earned terms, status computation, and 2D overlay component.
 */

import { esc } from './layout.js';

export const FIELD_MANUAL_TERMS = [
  // --- Campaign (Charge Gardens of Erebus) ---
  {
    id: 'camp_0',
    term: 'Opposites Attract',
    road: 'campaign',
    stageLabel: 'Pylon 1',
    stageIndex: 0,
    route: '#/quest',
    title: 'Opposite Charges Pull Together',
    body: 'Regions with extra negative charge (red) naturally pull toward hungry positive spots (blue) to link together and form a chemical bond.'
  },
  {
    id: 'camp_1',
    term: 'Making Room',
    road: 'campaign',
    stageLabel: 'Pylon 2',
    stageIndex: 1,
    route: '#/quest',
    title: 'Pushing Out Old Connections',
    body: 'Atoms can only hold so many bonds at once. When a new piece snaps on, it bumps an attached piece out so there is enough room.'
  },
  {
    id: 'camp_2',
    term: 'Givers & Receivers',
    road: 'campaign',
    stageLabel: 'Pylon 3',
    stageIndex: 2,
    route: '#/quest',
    title: 'Charge Givers and Receivers',
    body: 'Red spots have spare negative charge to share; blue spots are hungry positive centers looking for a partner.'
  },
  {
    id: 'camp_3',
    term: 'Physical Crowding',
    road: 'campaign',
    stageLabel: 'Pylon 4',
    stageIndex: 3,
    route: '#/quest',
    title: 'Atoms Take Up 3D Space',
    body: 'Atoms have physical size. Big neighboring groups can crowd around a reactive spot and physically block incoming pieces from reaching it.'
  },
  {
    id: 'camp_4',
    term: 'The Open Path',
    road: 'campaign',
    stageLabel: 'Pylon 5',
    stageIndex: 4,
    route: '#/quest',
    title: 'Choosing the Unblocked Route',
    body: 'When a molecule has several hungry spots, an incoming piece naturally heads for the one with a clear, uncrowded path.'
  },
  {
    id: 'camp_5',
    term: 'Empty Seats Pull Hard',
    road: 'campaign',
    stageLabel: 'Pylon 6',
    stageIndex: 5,
    route: '#/quest',
    title: 'Vacant Spots Are Super Hungry',
    body: 'When an attached piece breaks off and leaves an empty bond slot behind, the vacant center becomes strongly positive and eagerly pulls in a new partner.'
  },
  {
    id: 'camp_6',
    term: 'Passing Pieces Along',
    road: 'campaign',
    stageLabel: 'Pylon 7',
    stageIndex: 6,
    route: '#/quest',
    title: 'Hopping Along a Chain',
    body: 'Tiny, light pieces like hydrogen can easily hop between partner atoms, trading places in quick step-by-step handoffs.'
  },
  {
    id: 'camp_10',
    term: 'Push-and-Leave',
    road: 'campaign',
    stageLabel: 'Pylon 11',
    stageIndex: 10,
    route: '#/quest',
    title: 'Pushing In as One Leaves',
    body: 'In single-step reactions, the incoming piece connects from the open back side at the exact moment the old piece pops free.'
  },
  {
    id: 'camp_18',
    term: 'Leave First, Then Fill',
    road: 'campaign',
    stageLabel: 'Pylon 19',
    stageIndex: 18,
    route: '#/quest',
    title: 'Leaving First to Open a Seat',
    body: 'When a center is packed with big groups, the old piece must drift away first to clear an empty seat before a new piece can land.'
  },

  // --- Learn Unit 1: Tallow (Atoms, Elements, Core) ---
  {
    id: 'u1_atom',
    term: 'Atom',
    road: 'unit01',
    questKey: 'unit01/q1-grain',
    stageLabel: 'Bench 1, Stage 1',
    stageIndex: 0,
    route: '#/learn/unit01/q1-grain',
    title: 'The Discrete Floor of Matter',
    body: 'The indivisible building block of ordinary matter, retaining chemical identity.'
  },
  {
    id: 'u1_element',
    term: 'Element',
    road: 'unit01',
    questKey: 'unit01/q1-grain',
    stageLabel: 'Bench 1, Stage 2',
    stageIndex: 1,
    route: '#/learn/unit01/q1-grain',
    title: 'Single-Kind Substance',
    body: 'A pure chemical substance composed entirely of atoms having the same atomic number.'
  },
  {
    id: 'u1_mixture',
    term: 'Mixture',
    road: 'unit01',
    questKey: 'unit01/q1-grain',
    stageLabel: 'Bench 1, Stage 2',
    stageIndex: 1,
    route: '#/learn/unit01/q1-grain',
    title: 'Physical Combination',
    body: 'Two or more distinct substances mingled without forming chemical bonds, separable by physical means.'
  },
  {
    id: 'u1_molecule',
    term: 'Molecule',
    road: 'unit01',
    questKey: 'unit01/q1-grain',
    stageLabel: 'Bench 1, Stage 5',
    stageIndex: 4,
    route: '#/learn/unit01/q1-grain',
    title: 'Bonded Atomic Cluster',
    body: 'An electrically neutral group of two or more atoms held together by covalent chemical bonds.'
  },
  {
    id: 'u1_compound',
    term: 'Compound',
    road: 'unit01',
    questKey: 'unit01/q1-grain',
    stageLabel: 'Bench 1, Stage 6',
    stageIndex: 5,
    route: '#/learn/unit01/q1-grain',
    title: 'Fixed Stoichiometric Substance',
    body: 'A chemical substance composed of atoms from two or more elements joined in fixed proportions.'
  },
  {
    id: 'u1_nucleus',
    term: 'Nucleus',
    road: 'unit01',
    questKey: 'unit01/q2-core',
    stageLabel: 'Bench 2, Stage 1',
    stageIndex: 0,
    route: '#/learn/unit01/q2-core',
    title: 'Dense Atomic Center',
    body: 'The small, heavy, positively charged core of an atom containing protons and neutrons.'
  },
  {
    id: 'u1_proton',
    term: 'Proton',
    road: 'unit01',
    questKey: 'unit01/q2-core',
    stageLabel: 'Bench 2, Stage 2',
    stageIndex: 1,
    route: '#/learn/unit01/q2-core',
    title: 'Positive Nuclear Grain',
    body: 'A subatomic particle bearing a positive unit charge, defining the elemental identity of the atom.'
  },
  {
    id: 'u1_neutron',
    term: 'Neutron',
    road: 'unit01',
    questKey: 'unit01/q2-core',
    stageLabel: 'Bench 2, Stage 2',
    stageIndex: 1,
    route: '#/learn/unit01/q2-core',
    title: 'Neutral Nuclear Mass',
    body: 'An uncharged subatomic particle present in atomic nuclei, contributing mass without changing charge.'
  },
  {
    id: 'u1_shell',
    term: 'Electron Shell',
    road: 'unit01',
    questKey: 'unit01/q2-core',
    stageLabel: 'Bench 2, Stage 4',
    stageIndex: 3,
    route: '#/learn/unit01/q2-core',
    title: 'Quantized Orbit Levels',
    body: 'Concentric energy levels surrounding the nucleus populated by orbiting electrons.'
  },
  {
    id: 'u1_valence',
    term: 'Valence Electron',
    road: 'unit01',
    questKey: 'unit01/q2-core',
    stageLabel: 'Bench 2, Stage 5',
    stageIndex: 4,
    route: '#/learn/unit01/q2-core',
    title: 'Outermost Reactive Shell',
    body: 'Electrons in the outermost shell that participate in chemical bond formation.'
  },
  {
    id: 'u1_isotope',
    term: 'Isotope',
    road: 'unit01',
    questKey: 'unit01/q2-core',
    stageLabel: 'Bench 2, Stage 6',
    stageIndex: 5,
    route: '#/learn/unit01/q2-core',
    title: 'Varying Neutron Count',
    body: 'Forms of the same chemical element having identical proton counts but different mass numbers.'
  },
  {
    id: 'u1_ion',
    term: 'Ion',
    road: 'unit01',
    questKey: 'unit01/q2-core',
    stageLabel: 'Bench 2, Stage 7',
    stageIndex: 6,
    route: '#/learn/unit01/q2-core',
    title: 'Charged Particle',
    body: 'An atom or group of atoms that has gained or lost one or more valence electrons, carrying a net electric charge.'
  },

  // --- Learn Unit 2: Lanternfall (Light and Electrons) ---
  {
    id: 'u2l_wavelength',
    term: 'Wavelength',
    road: 'unit02',
    questKey: 'unit02/q1-wave',
    stageLabel: 'Bench 1, Stage 1',
    stageIndex: 0,
    route: '#/learn/unit02/q1-wave',
    title: 'Distance Between Crests',
    body: 'The distance from one crest of a wave to the next, which sets its colour in visible light.'
  },
  {
    id: 'u2l_frequency',
    term: 'Frequency',
    road: 'unit02',
    questKey: 'unit02/q1-wave',
    stageLabel: 'Bench 1, Stage 1',
    stageIndex: 0,
    route: '#/learn/unit02/q1-wave',
    title: 'Crests Per Second',
    body: 'The number of wave crests that pass a point each second, measured in hertz.'
  },
  {
    id: 'u2l_c',
    term: 'Speed of Light',
    road: 'unit02',
    questKey: 'unit02/q1-wave',
    stageLabel: 'Bench 1, Stage 3',
    stageIndex: 2,
    route: '#/learn/unit02/q1-wave',
    title: 'One Fixed Product',
    body: 'Wavelength times frequency equals 3.00 × 10⁸ m/s for every colour of light in a vacuum.'
  },
  {
    id: 'u2l_em',
    term: 'Electromagnetic Spectrum',
    road: 'unit02',
    questKey: 'unit02/q1-wave',
    stageLabel: 'Bench 1, Stage 6',
    stageIndex: 5,
    route: '#/learn/unit02/q1-wave',
    title: 'Every Kind of Light',
    body: 'The full range of wavelengths of light, from radio waves through visible light to X-rays and gamma rays.'
  },
  {
    id: 'u2l_threshold',
    term: 'Threshold Frequency',
    road: 'unit02',
    questKey: 'unit02/q2-photon',
    stageLabel: 'Bench 2, Stage 2',
    stageIndex: 1,
    route: '#/learn/unit02/q2-photon',
    title: 'Where the Counter Wakes',
    body: 'The lowest frequency of light that frees any electron from a given metal.'
  },
  {
    id: 'u2l_photon',
    term: 'Photon',
    road: 'unit02',
    questKey: 'unit02/q2-photon',
    stageLabel: 'Bench 2, Stage 3',
    stageIndex: 2,
    route: '#/learn/unit02/q2-photon',
    title: 'A Packet of Light',
    body: 'A single quantum of light, carrying an energy fixed by its frequency, E = hν.'
  },
  {
    id: 'u2l_workfunction',
    term: 'Work Function',
    road: 'unit02',
    questKey: 'unit02/q2-photon',
    stageLabel: 'Bench 2, Stage 6',
    stageIndex: 5,
    route: '#/learn/unit02/q2-photon',
    title: 'What the Metal Holds Back',
    body: 'The least energy needed to free an electron from the surface of a metal.'
  },
  {
    id: 'u2l_linespectrum',
    term: 'Line Spectrum',
    road: 'unit02',
    questKey: 'unit02/q3-lines',
    stageLabel: 'Bench 3, Stage 1',
    stageIndex: 0,
    route: '#/learn/unit02/q3-lines',
    title: 'A Few Exact Colours',
    body: 'The bright lines a glowing gas gives out, which no other gas shares.'
  },
  {
    id: 'u2l_energylevel',
    term: 'Energy Level',
    road: 'unit02',
    questKey: 'unit02/q3-lines',
    stageLabel: 'Bench 3, Stage 4',
    stageIndex: 3,
    route: '#/learn/unit02/q3-lines',
    title: 'The Rungs of an Atom',
    body: 'One of the fixed energies an electron in an atom can have; light is given out or taken in as it moves between two of them.'
  },
  {
    id: 'u2l_bohr',
    term: 'Bohr Model',
    road: 'unit02',
    questKey: 'unit02/q3-lines',
    stageLabel: 'Bench 3, Stage 6',
    stageIndex: 5,
    route: '#/learn/unit02/q3-lines',
    title: 'Hydrogen from One Formula',
    body: "A model putting hydrogen's electron on levels at -2.18 × 10⁻¹⁸ J divided by n squared, which predicts its visible lines."
  },
  {
    id: 'u2l_orbital',
    term: 'Orbital',
    road: 'unit02',
    questKey: 'unit02/q4-cloud',
    stageLabel: 'Bench 4, Stage 2',
    stageIndex: 1,
    route: '#/learn/unit02/q4-cloud',
    title: 'A Cloud of Probability',
    body: 'A region around the nucleus where an electron is likely to be found, drawn from where many shots of it land.'
  },
  {
    id: 'u2l_node',
    term: 'Node',
    road: 'unit02',
    questKey: 'unit02/q4-cloud',
    stageLabel: 'Bench 4, Stage 4',
    stageIndex: 3,
    route: '#/learn/unit02/q4-cloud',
    title: 'Where It Is Never Found',
    body: 'A shell or plane inside an orbital where the electron is never found.'
  },
  {
    id: 'u2l_uncertainty',
    term: 'Uncertainty Principle',
    road: 'unit02',
    questKey: 'unit02/q4-cloud',
    stageLabel: 'Bench 4, Stage 8',
    stageIndex: 7,
    route: '#/learn/unit02/q4-cloud',
    title: 'No Path to Draw',
    body: "An electron's position and speed cannot both be known exactly at once, so it has no path."
  },
  {
    id: 'u2l_pauli',
    term: 'Pauli Exclusion Principle',
    road: 'unit02',
    questKey: 'unit02/q5-numbers',
    stageLabel: 'Bench 5, Stage 5',
    stageIndex: 4,
    route: '#/learn/unit02/q5-numbers',
    title: 'One Address Each',
    body: 'No two electrons in an atom can share all four quantum numbers.'
  },
  {
    id: 'u2l_hund',
    term: "Hund's Rule",
    road: 'unit02',
    questKey: 'unit02/q6-filling',
    stageLabel: 'Bench 6, Stage 2',
    stageIndex: 1,
    route: '#/learn/unit02/q6-filling',
    title: 'Spread Before Pairing',
    body: 'Electrons occupy the boxes of a row singly, all pointing the same way, before any pair up.'
  },
  {
    id: 'u2l_noblegas',
    term: 'Noble-Gas Notation',
    road: 'unit02',
    questKey: 'unit02/q6-filling',
    stageLabel: 'Bench 6, Stage 5',
    stageIndex: 4,
    route: '#/learn/unit02/q6-filling',
    title: 'The Core in One Symbol',
    body: 'Writing a closed core as a noble gas symbol in brackets, followed by the rows beyond it.'
  },
  {
    id: 'u2l_binding',
    term: 'Binding Energy',
    road: 'unit02',
    questKey: 'unit02/q7-pes',
    stageLabel: 'Bench 7, Stage 3',
    stageIndex: 2,
    route: '#/learn/unit02/q7-pes',
    title: 'How Tightly It Is Held',
    body: 'The energy needed to remove an electron from an atom; the closer to the nucleus, the larger.'
  },
  {
    id: 'u2l_zeff',
    term: 'Effective Nuclear Charge',
    road: 'unit02',
    questKey: 'unit02/q8-trends',
    stageLabel: 'Bench 8, Stage 2',
    stageIndex: 1,
    route: '#/learn/unit02/q8-trends',
    title: 'The Charge It Feels',
    body: 'The nuclear charge an outer electron actually feels after the electrons in between have shielded it.'
  },
  {
    id: 'u2l_ie',
    term: 'Ionization Energy',
    road: 'unit02',
    questKey: 'unit02/q8-trends',
    stageLabel: 'Bench 8, Stage 6',
    stageIndex: 5,
    route: '#/learn/unit02/q8-trends',
    title: 'The Cost of One Electron',
    body: 'The energy needed to strip the outermost electron from a gaseous atom.'
  },
  {
    id: 'u2l_en',
    term: 'Electronegativity',
    road: 'unit02',
    questKey: 'unit02/q8-trends',
    stageLabel: 'Bench 8, Stage 8',
    stageIndex: 7,
    route: '#/learn/unit02/q8-trends',
    title: 'Pull on a Shared Pair',
    body: "An atom's pull on a pair of electrons it shares; it rises across a period and falls down a group."
  },
  {
    id: 'u2l_absorbance',
    term: 'Absorbance',
    road: 'unit02',
    questKey: 'unit02/q9-absorb',
    stageLabel: 'Bench 9, Stage 4',
    stageIndex: 3,
    route: '#/learn/unit02/q9-absorb',
    title: 'How Much the Cuvette Dims',
    body: 'The logarithmic measure of how much light a sample takes out of a beam.'
  },
  {
    id: 'u2l_beer',
    term: 'Beer–Lambert Law',
    road: 'unit02',
    questKey: 'unit02/q9-absorb',
    stageLabel: 'Bench 9, Stage 7',
    stageIndex: 6,
    route: '#/learn/unit02/q9-absorb',
    title: 'A = εbc',
    body: 'Absorbance is proportional to path length and to concentration.'
  },

  // --- Learn Unit 3: Ligar (Bonds, Lattices) ---
  {
    id: 'u2_bond',
    term: 'Chemical Bond',
    road: 'unit03',
    questKey: 'unit03/q1-joins',
    stageLabel: 'Bench 1, Stage 1',
    stageIndex: 0,
    route: '#/learn/unit03/q1-joins',
    title: 'Attractive Force',
    body: 'An enduring attractive interaction between atoms, ions, or molecules enabling formation of chemical compounds.'
  },
  {
    id: 'u2_covalent',
    term: 'Covalent Bond',
    road: 'unit03',
    questKey: 'unit03/q1-joins',
    stageLabel: 'Bench 1, Stage 2',
    stageIndex: 1,
    route: '#/learn/unit03/q1-joins',
    title: 'Shared Electron Pair',
    body: 'A chemical linkage formed by the mutual sharing of one or more pairs of electrons between atoms.'
  },
  {
    id: 'u2_ionic',
    term: 'Ionic Bond',
    road: 'unit03',
    questKey: 'unit03/q1-joins',
    stageLabel: 'Bench 1, Stage 4',
    stageIndex: 3,
    route: '#/learn/unit03/q1-joins',
    title: 'Electrostatic Attraction',
    body: 'A chemical bond formed through electrostatic attraction between oppositely charged ions.'
  },
  {
    id: 'u2_lattice',
    term: 'Crystal Lattice',
    road: 'unit03',
    questKey: 'unit03/q2-lattice',
    stageLabel: 'Bench 2, Stage 1',
    stageIndex: 0,
    route: '#/learn/unit03/q2-lattice',
    title: 'Ordered 3D Framework',
    body: 'A symmetrical, repeating three-dimensional arrangement of atoms, ions, or molecules in a crystalline solid.'
  },
  {
    id: 'u2_mole',
    term: 'The Mole',
    road: 'unit01',
    questKey: 'unit01/q6-weigh',
    stageLabel: 'Bench 6, Stage 4',
    stageIndex: 3,
    route: '#/learn/unit01/q6-weigh',
    title: 'Counting by Mass',
    body: 'The SI unit of amount of substance containing exactly 6.02214076 × 10²³ elementary entities.'
  }
];


/**
 * Ligar's later benches. Each term sits at the stage whose reward card earns it,
 * so the Manual is a record of the same schedule the quests keep.
 * [quest id, bench number, stage number, term, title, body]
 */
const LIGAR_LATER = [
  ['q3-distance', 3, 1, 'Potential Energy Curve', 'Energy at Every Separation', 'A plot of the energy of two atoms against the distance between them. Its lowest point marks where the pair is most stable.'],
  ['q3-distance', 3, 1, 'Bond Length', 'The Bottom of the Well', 'The separation between two bonded nuclei at which the potential energy is a minimum.'],
  ['q3-distance', 3, 2, 'Bond Energy', 'The Depth of the Well', 'The energy needed to pull two bonded atoms completely apart, measured from the bottom of the potential energy curve to zero.'],
  ['q3-distance', 3, 5, 'Bond Order (Length and Strength)', 'More Pairs, Shorter Bond', 'The number of shared pairs between two atoms. A higher bond order gives a shorter, stronger bond.'],
  ['q3-distance', 3, 7, 'Lattice Energy', 'What Holds a Lattice', 'The energy needed to separate an ionic solid into its gaseous ions. It rises with ion charge and falls with ion size.'],
  ['q4-dots', 4, 1, 'Lewis Structure', 'Every Electron Placed', 'A drawing that shows each valence electron of a molecule as a bond or as a lone pair on an atom.'],
  ['q4-dots', 4, 1, 'Lone Pair', 'A Pair on One Atom', 'A pair of valence electrons held on a single atom and not shared in a bond.'],
  ['q4-dots', 4, 1, 'Octet Rule', 'Eight Round an Atom', 'Atoms tend to have eight electrons round them in a bond-and-lone-pair count, two for hydrogen.'],
  ['q4-dots', 4, 4, 'Central Atom', 'The Atom in the Middle', 'The atom that the others attach to. An atom that can share only one pair, like hydrogen or fluorine, can never be it.'],
  ['q4-dots', 4, 5, 'Polyatomic Ion', 'A Charged Group', 'A group of atoms bonded together that carries an overall charge.'],
  ['q4-dots', 4, 6, 'Incomplete Octet', 'Fewer Than Eight', 'An atom with fewer than eight electrons round it in a stable molecule, as boron in BF₃.'],
  ['q4-dots', 4, 7, 'Free Radical', 'An Unpaired Electron', 'A species with an odd number of electrons, so one electron is left unpaired. Free radicals are highly reactive.'],
  ['q4-dots', 4, 8, 'Expanded Octet', 'Past Eight', 'An atom on the third period or below holding more than eight electrons, as sulfur in SF₆.'],
  ['q5-resonance', 5, 1, 'Formal Charge', 'Brought Minus Owned', 'The valence electrons an atom brings minus the electrons it owns in a drawing, counting each bond as one and each lone pair as two.'],
  ['q5-resonance', 5, 4, 'Resonance', 'A Blend of Drawings', 'When no single drawing fits a measured molecule, the real molecule is a blend of equivalent drawings, as in ozone.'],
  ['q5-resonance', 5, 5, 'Resonance Structures', 'Same Atoms, Electrons Elsewhere', 'Drawings of one molecule that differ only in where the electrons sit.'],
  ['q5-resonance', 5, 6, 'Fractional Bond Order', 'Four Pairs over Three Bonds', 'A bond order that is not a whole number, which arises when electrons are shared among several bonds.'],
  ['q5-resonance', 5, 7, 'Delocalized Electrons', 'Spread over Several Atoms', 'Electrons that are shared among more than two atoms rather than held in a single bond.'],
  ['q6-shape', 6, 1, 'Electron Domain', 'A Region of Electrons', 'A bond (single, double or triple) or a lone pair on a central atom. Each domain pushes the others away.'],
  ['q6-shape', 6, 2, 'VSEPR Theory', 'Domains Push Apart', 'Electron domains arrange themselves as far apart as possible, which fixes the shape of a molecule.'],
  ['q6-shape', 6, 3, 'Trigonal Pyramidal', 'Three Atoms and a Lone Pair', 'The shape of a molecule with three atoms and one lone pair on the central atom, as in NH₃.'],
  ['q6-shape', 6, 4, 'Bent', 'Two Atoms and Lone Pairs', 'The shape of a molecule with two atoms and one or two lone pairs on the central atom, as in water.'],
  ['q6-shape', 6, 6, 'Trigonal Bipyramidal and Seesaw', 'Five Domains', 'Five domains form a trigonal bipyramid. A lone pair takes a place round the middle, giving the seesaw shape of SF₄.'],
  ['q6-shape', 6, 7, 'Octahedral and Square Planar', 'Six Domains', 'Six domains point to the corners of an octahedron. Two opposite lone pairs leave four atoms in a square plane.'],
  ['q6-shape', 6, 8, 'Electron and Molecular Geometry', 'Domains versus Atoms', 'The electron geometry names the arrangement of all domains; the molecular geometry names only where the atoms are.'],
  ['q7-polarity', 7, 1, 'Polar Bond', 'An Uneven Pull', 'A bond in which the atom that pulls the shared pair harder carries a partial negative charge and the other a partial positive one.'],
  ['q7-polarity', 7, 2, 'Nonpolar Covalent, Polar Covalent', 'From Even to Handed Over', 'Equal sharing is nonpolar covalent, unequal sharing is polar covalent, and complete transfer is ionic.'],
  ['q7-polarity', 7, 3, 'Molecular Dipole', 'A Net Pull', 'The overall separation of charge in a molecule whose bond pulls do not cancel. Such a molecule turns in an electric field.'],
  ['q7-polarity', 7, 4, 'Bond Dipole', 'An Arrow Along a Bond', 'The pull of one polar bond, drawn as an arrow toward the more electronegative atom. Bond dipoles add or cancel.'],
  ['q8-hybrid', 8, 2, 'Hybrid Orbital (sp³)', 'Four Equal Lobes', 'One s and three p orbitals blend into four equivalent sp³ orbitals at 109.5 degrees.'],
  ['q8-hybrid', 8, 3, 'sp² Hybridization', 'Three Lobes and a p Orbital', 'One s and two p orbitals blend into three sp² orbitals at 120 degrees, leaving one p orbital.'],
  ['q8-hybrid', 8, 4, 'sp Hybridization', 'Two Lobes and Two p Orbitals', 'One s and one p orbital blend into two sp orbitals at 180 degrees, leaving two p orbitals.'],
  ['q8-hybrid', 8, 5, 'Sigma and Pi Bonds', 'End-on and Side-on', 'A sigma bond is overlap along the bond axis; a pi bond is side-to-side overlap of p orbitals above and below it.'],
  ['q8-hybrid', 8, 7, 'Restricted Rotation', 'Double Bonds Hold Still', 'A pi bond is broken by twisting, so groups cannot turn freely about a double bond.'],
  ['q9-orbitals', 9, 1, 'Bonding and Antibonding Orbitals', 'Two Boxes from Two', 'Combining two atomic orbitals makes a lower bonding orbital and a higher antibonding orbital.'],
  ['q9-orbitals', 9, 8, 'The Order Switch', 'π below σ up to Nitrogen', 'In diatomic molecules up to N₂ the π2p orbitals lie below σ2p, because the 2s and 2p orbitals mix. From O₂ up the order is reversed.']
];

for (const [questId, bench, stage, term, title, body] of LIGAR_LATER) {
  FIELD_MANUAL_TERMS.push({
    id: `u3_${questId.split('-')[0]}_s${stage}_${term.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`,
    term,
    road: 'unit03',
    questKey: `unit03/${questId}`,
    stageLabel: `Bench ${bench}, Stage ${stage}`,
    stageIndex: stage - 1,
    route: `#/learn/unit03/${questId}`,
    title,
    body
  });
}


/**
 * Bellows. Each term sits at the stage whose reward card earns it, so the Manual is
 * a record of the same schedule the quests keep.
 * [quest id, bench number, stage number, term, title, body]
 */
const BELLOWS = [
  ['q1-knocks', 1, 1, 'Pressure', 'The Push of the Knocks', 'The combined force of all the particles of a gas striking a wall, divided by the area of the wall. It rises when the particles knock more often or harder.'],
  ['q1-knocks', 1, 3, 'Kinetic Energy', 'The Energy of Motion', 'The energy a particle has because it is moving. Temperature measures the average kinetic energy of the particles of a substance.'],
  ['q1-knocks', 1, 4, 'Maxwell–Boltzmann Distribution', 'A Spread of Speeds', 'The spread of particle speeds in a gas: a curve with a peak. Heating moves the peak to higher speeds and flattens the curve.'],
  ['q1-knocks', 1, 6, 'Atmospheres, Kilopascals, mmHg', 'One Push, Three Scales', 'Three units of pressure: one atmosphere (atm) is 101.3 kilopascals (kPa) is 760 millimetres of mercury (mmHg).'],
  ['q1-knocks', 1, 7, 'Absolute Zero and Kelvin', 'The Coldest Possible', 'The temperature, −273.15 °C, at which particles would have no motion left to lose. The kelvin scale counts from it, so 0 K is absolute zero.'],
  ['q1-knocks', 1, 8, 'Kinetic Molecular Theory', 'A Crowd of Moving Particles', 'A gas is a crowd of tiny particles in constant random motion, far apart, and its pressure is their knocking on the walls.'],
  ['q2-laws', 2, 1, "Boyle's Law", 'Pressure Against Volume', 'At a fixed temperature and amount, the pressure of a gas rises as its volume falls: pressure times volume stays the same.'],
  ['q2-laws', 2, 2, 'Inversely Proportional', 'As One Falls, the Other Rises', 'Two quantities are inversely proportional when their product stays constant, so one rises by the factor the other falls.'],
  ['q2-laws', 2, 3, "Charles's Law", 'Volume Against Temperature', 'At a fixed pressure and amount, the volume of a gas is proportional to its kelvin temperature.'],
  ['q2-laws', 2, 5, "Gay-Lussac's Law", 'Pressure Against Temperature', 'At a fixed volume and amount, the pressure of a gas is proportional to its kelvin temperature.'],
  ['q2-laws', 2, 6, "Avogadro's Law", 'Volume Against Amount', 'At a fixed temperature and pressure, the volume of a gas is proportional to the amount of gas: equal amounts fill equal volumes.'],
  ['q2-laws', 2, 7, 'Combined Gas Law', 'Three Quantities at Once', 'For a fixed amount of gas, pressure times volume over kelvin temperature is constant, so P₁V₁/T₁ = P₂V₂/T₂.'],
  ['q3-ideal', 3, 1, 'Molar Volume', 'What a Mole Fills', 'The volume of one mole of a gas: about 22.4 litres at 0 °C and 1 atm, whichever gas it is.'],
  ['q3-ideal', 3, 2, 'Gas Constant and the Ideal Gas Law', 'One Number for Every Gas', 'PV = nRT. The gas constant R is 8.314 J/(mol·K), or 0.0821 L·atm/(mol·K), and its value depends on the units of pressure and volume.'],
  ['q4-mixtures', 4, 1, 'Partial Pressure', 'A Gas\'s Share of the Push', 'The pressure a gas in a mixture would exert if it were alone in the container.'],
  ['q4-mixtures', 4, 1, "Dalton's Law", 'Partial Pressures Add', 'The total pressure of a mixture of gases is the sum of the partial pressures of its gases.'],
  ['q4-mixtures', 4, 3, 'Mole Fraction', 'A Share of the Moles', 'The moles of one substance in a mixture divided by the total moles. A partial pressure is the mole fraction times the total pressure.'],
  ['q5-speed', 5, 4, 'Effusion', 'Through a Pinhole', 'The escape of a gas through a very small hole. A lighter gas effuses faster because its particles move faster.'],
  ['q5-speed', 5, 5, "Graham's Law", 'Rate Against Molar Mass', 'The rate of effusion is inversely proportional to the square root of the molar mass. This goes beyond the exam.'],
  ['q5-speed', 5, 7, 'Diffusion', 'A Random Walk of Collisions', 'The spreading of one substance through another by the random motion of its particles. It is slow because each collision turns the particle aside.'],
  ['q6-real', 6, 4, 'Ideal Gas and Real Gas', 'Where the Law Stops', 'An ideal gas has particles with no size and no attractions. Every actual gas is a real gas, which departs from the gas law at high pressure and low temperature.'],
  ['q6-real', 6, 7, 'van der Waals Equation', 'Two Corrections', 'The gas law corrected for the volume of the particles and for the attractions between them: (P + an²/V²)(V − nb) = nRT. This goes beyond the exam.']
];

for (const [questId, bench, stage, term, title, body] of BELLOWS) {
  FIELD_MANUAL_TERMS.push({
    id: `u4_${questId.split('-')[0]}_s${stage}_${term.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`,
    term,
    road: 'unit04',
    questKey: `unit04/${questId}`,
    stageLabel: `Bench ${bench}, Stage ${stage}`,
    stageIndex: stage - 1,
    route: `#/learn/unit04/${questId}`,
    title,
    body
  });
}

/**
 * Checks whether a term is earned based on session state.
 */
export function isTermEarned(term, sessionState = {}) {
  if (term.road === 'campaign') {
    const q1Prog = (sessionState.progress || []).find(p => p.quest_id === 'q1');
    const reached = q1Prog ? Number(q1Prog.stage_reached || 0) : 0;
    return reached > term.stageIndex;
  }
  if (term.questKey && sessionState.learn) {
    const rec = sessionState.learn[term.questKey];
    if (!rec) return false;
    if (rec.completedAt) return true;
    return Array.isArray(rec.stages) && rec.stages.includes(term.stageIndex);
  }
  return false;
}

/**
 * Computes logged term stats for the player.
 */
export function getFieldManualStats(sessionState = {}) {
  let earnedCount = 0;
  const byRoad = {
    campaign: { total: 0, earned: 0 },
    unit01: { total: 0, earned: 0 },
    unit02: { total: 0, earned: 0 },
    unit03: { total: 0, earned: 0 },
    unit04: { total: 0, earned: 0 }
  };

  for (const t of FIELD_MANUAL_TERMS) {
    const r = byRoad[t.road] || byRoad.campaign;
    r.total++;
    if (isTermEarned(t, sessionState)) {
      earnedCount++;
      r.earned++;
    }
  }

  return {
    total: FIELD_MANUAL_TERMS.length,
    earned: earnedCount,
    byRoad
  };
}

/**
 * Renders the Field Manual overlay HTML markup.
 */
export function renderFieldManualModal(sessionState = {}, activeFilter = 'all') {
  const stats = getFieldManualStats(sessionState);

  const filtered = FIELD_MANUAL_TERMS.filter(t => {
    if (activeFilter === 'all') return true;
    return t.road === activeFilter;
  });

  return `
    <div class="field-manual-overlay">
      <div class="field-manual-header">
        <div>
          <span class="eyebrow lit" style="color: var(--accent-gold);">FIELD MANUAL</span>
          <h2 class="section-title" style="margin: 2px 0 0;">Collected Vocabulary</h2>
        </div>
        <div class="stat-tile" style="text-align: right;">
          <div class="stat-label">Terms Logged</div>
          <div class="stat-value">${stats.earned} / ${stats.total}</div>
        </div>
      </div>

      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <button type="button" class="btn-chip fm-filter-btn ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">All (${stats.earned}/${stats.total})</button>
        <button type="button" class="btn-chip fm-filter-btn ${activeFilter === 'campaign' ? 'active' : ''}" data-filter="campaign">Campaign (${stats.byRoad.campaign.earned}/${stats.byRoad.campaign.total})</button>
        <button type="button" class="btn-chip fm-filter-btn ${activeFilter === 'unit01' ? 'active' : ''}" data-filter="unit01">Tallow (${stats.byRoad.unit01.earned}/${stats.byRoad.unit01.total})</button>
        <button type="button" class="btn-chip fm-filter-btn ${activeFilter === 'unit02' ? 'active' : ''}" data-filter="unit02">Lanternfall (${stats.byRoad.unit02.earned}/${stats.byRoad.unit02.total})</button>
        <button type="button" class="btn-chip fm-filter-btn ${activeFilter === 'unit03' ? 'active' : ''}" data-filter="unit03">Ligar (${stats.byRoad.unit03.earned}/${stats.byRoad.unit03.total})</button>
        <button type="button" class="btn-chip fm-filter-btn ${activeFilter === 'unit04' ? 'active' : ''}" data-filter="unit04">Bellows (${stats.byRoad.unit04.earned}/${stats.byRoad.unit04.total})</button>
      </div>

      <div class="field-manual-grid">
        ${filtered.map(t => {
          const earned = isTermEarned(t, sessionState);
          if (!earned) {
            return `
              <div class="field-manual-term-card unearned">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.4rem;">
                  <span class="term-blank"></span>
                  <span class="tag" style="font-size: 0.6rem;">${esc(t.stageLabel)}</span>
                </div>
                <div style="font-family: var(--font-mono); font-size: 0.74rem; color: var(--text-muted); font-style: italic;">
                  // Withheld until stage complete
                </div>
              </div>
            `;
          }

          return `
            <div class="field-manual-term-card">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
                <span style="font-family: var(--font-display); font-size: 0.95rem; font-weight: 700; color: var(--accent-amber); letter-spacing: 0.08em; text-transform: uppercase;">
                  ${esc(t.term)}
                </span>
                <span class="tag live" style="font-size: 0.62rem;">${esc(t.stageLabel)}</span>
              </div>
              <div style="font-family: var(--font-mono); font-size: 0.76rem; font-weight: 600; color: var(--text-bright); margin-bottom: 0.3rem;">
                ${esc(t.title)}
              </div>
              <div style="font-family: var(--font-mono); font-size: 0.73rem; color: var(--text-secondary); line-height: 1.45; margin-bottom: 0.75rem;">
                ${esc(t.body)}
              </div>
              <div style="text-align: right;">
                <a href="${t.route}" class="btn-secondary fm-revisit-link" style="font-size: 0.68rem; padding: 4px 10px; text-decoration: none;">
                  Revisit Stage
                </a>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
