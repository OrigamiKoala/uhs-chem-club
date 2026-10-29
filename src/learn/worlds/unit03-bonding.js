/**
 * unit03-bonding.js — Learn world 3: Bonding.
 *
 * Ligar. The road runs from what a join IS, through what each kind of join
 * builds, to how far apart two bonded atoms sit, how a molecule is drawn, what
 * shape it takes, which way its charge leans, and the orbitals that hold it
 * together. Benches one and two are built; the rest are charted and planned in
 * `docs/plans/learn-quests.md`.
 *
 * Counting by mass (the old benches three and four, `q3-recipe` and `q4-weigh`)
 * moved to Kettle when the road was reordered: it is the start of stoichiometry,
 * not the end of bonding.
 *
 * See unit01-atoms.js for how a quest is built and flipped live.
 */

export const UNIT_03 = {
  id: 'unit03',
  order: 3,
  code: '03',
  unit: 'Unit 3',
  world: 'Ligar',
  place: 'Basalt arches',
  title: 'Bonding',
  line: 'Chemical bonding, molecular structure, and orbitals.',
  brief: 'Learn how chemical bonds form, how molecules are drawn and shaped, and which orbitals hold them together.',

  quests: [
    {
      id: 'q1-joins',
      title: 'What Holds',
      line: 'Distinguish ionic, covalent, and metallic bonding.',
      arena: 'bench',
      stageCount: 5,
      status: 'live',
      module: () => import('../quests/unit03/q1-joins.js')
    },
    {
      id: 'q2-lattice',
      title: 'Stone and Wire',
      line: 'Relate macroscopic properties to crystal lattices and networks.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit03/q2-lattice.js')
    },
    {
      id: 'q3-distance',
      title: 'Bond Energy',
      line: 'Examine potential energy curves and bond energies.',
      arena: 'bench',
      stageCount: 6,
      status: 'live',
      module: () => import('../quests/unit03/q3-distance.js')
    },
    {
      id: 'q4-dots',
      title: 'Lewis Structures',
      line: 'Construct Lewis structures and apply the octet rule.',
      arena: 'bench',
      stageCount: 6,
      status: 'live',
      module: () => import('../quests/unit03/q4-dots.js')
    },
    {
      id: 'q5-resonance',
      title: 'Resonance',
      line: 'Model resonance hybrids with intermediate bond orders.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit03/q5-resonance.js')
    },
    {
      id: 'q6-shape',
      title: 'Molecular Shape',
      line: 'Predict three-dimensional geometries using VSEPR theory.',
      arena: 'bench',
      stageCount: 10,
      status: 'live',
      module: () => import('../quests/unit03/q6-shape.js')
    },
    {
      id: 'q7-polarity',
      title: 'Polarity',
      line: 'Determine molecular polarity from bond dipoles and symmetry.',
      arena: 'bench',
      stageCount: 5,
      status: 'live',
      module: () => import('../quests/unit03/q7-polarity.js')
    },
    {
      id: 'q8-hybrid',
      title: 'Hybridization',
      line: 'Form hybrid orbitals, sigma bonds, and pi bonds.',
      arena: 'bench',
      stageCount: 9,
      status: 'live',
      module: () => import('../quests/unit03/q8-hybrid.js')
    },
    {
      id: 'q9-orbitals',
      title: 'Molecular Orbitals',
      line: 'Optional, beyond AP: fill molecular orbitals and explain paramagnetism.',
      arena: 'bench',
      stageCount: 3,
      status: 'live',
      optional: true,
      module: () => import('../quests/unit03/q9-orbitals.js')
    },
    {
      id: 'boss-warden',
      title: 'Basalt Warden',
      line: 'Apply bonding concepts to analyze the basalt warden.',
      arena: 'boss',
      stageCount: 5,
      status: 'live',
      module: () => import('../quests/unit03/boss-warden.js')
    }
  ]
};
