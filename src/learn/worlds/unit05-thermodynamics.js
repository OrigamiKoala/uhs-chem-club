/**
 * unit05-thermodynamics.js — Learn world 5: Thermodynamics.
 *
 * Ember Reach. Seven benches on the calorimeter and thermodynamic bench
 * (`engine/calorimeter.js`), and The Crucible, a boss encounter at the caldera rim:
 *   1. q1-flow        — Heat and Temperature (CED 6.1–6.3)
 *   2. q2-calorimetry — Calorimetry (CED 6.4)
 *   3. q3-enthalpy    — Enthalpy of Reaction (CED 6.6)
 *   4. q4-bonds       — Bond Enthalpies (CED 6.7)
 *   5. q5-hess        — Hess's Law and Formation (CED 6.8, 6.9)
 *   6. q6-entropy     — Entropy (CED 9.1, 9.2)
 *   7. q7-gibbs       — Free Energy (CED 9.3, 9.4, 9.6)
 *   8. boss-crucible  — The Crucible (CED 6.4, 6.7, 6.8, 9.2, 9.3)
 */

export const UNIT_05 = {
  id: 'unit05',
  order: 5,
  code: '05',
  unit: 'Unit 5',
  world: 'Ember Reach',
  place: 'Volcanic vent field',
  title: 'Thermodynamics',
  line: 'Heat into and out of a cup, the energy in bonds, and why some changes run on their own.',
  brief:
    'The vents at Ember Reach never cool. Everything that happens here either gives heat to the rock around it or takes heat from it, and the only instrument that never lies is a well-insulated cup with a thermometer in the lid.',

  quests: [
    {
      id: 'q1-flow',
      title: 'Heat and Temperature',
      line: 'Touch a hot block to a cold one, watch both thermometers settle, and mark which way energy crossed the boundary.',
      arena: 'bench',
      stageCount: 4,
      status: 'live',
      module: () => import('../quests/unit05/q1-flow.js')
    },
    {
      id: 'q2-calorimetry',
      title: 'Calorimetry',
      line: 'Catch a reaction’s heat in a weighed water bath and turn a thermometer rise into joules and kilojoules per mole.',
      arena: 'bench',
      stageCount: 4,
      status: 'live',
      module: () => import('../quests/unit05/q2-calorimetry.js')
    },
    {
      id: 'q3-enthalpy',
      title: 'Enthalpy of Reaction',
      line: 'Express heat per mole with the system’s sign, flip and scale thermochemical equations, and compare fuels per gram.',
      arena: 'bench',
      stageCount: 3,
      status: 'live',
      module: () => import('../quests/unit05/q3-enthalpy.js')
    },
    {
      id: 'q4-bonds',
      title: 'Bond Enthalpies',
      line: 'Climb uphill to break reactant bonds into free atoms, drop downhill as product bonds snap together, and compare the two.',
      arena: 'bench',
      stageCount: 5,
      status: 'live',
      module: () => import('../quests/unit05/q4-bonds.js')
    },
    {
      id: 'q5-hess',
      title: "Hess's Law and Formation",
      line: 'Stack reaction steps on an enthalpy altitude ladder and measure compounds from the elemental sea-level baseline.',
      arena: 'bench',
      stageCount: 4,
      status: 'live',
      module: () => import('../quests/unit05/q5-hess.js')
    },
    {
      id: 'q6-entropy',
      title: 'Entropy',
      line: 'Open the stopcock on a partitioned chamber, count the ways particles can spread out, and read ΔS° across phases and reactions.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit05/q6-entropy.js')
    },
    {
      id: 'q7-gibbs',
      title: 'Free Energy',
      line: 'Balance ΔH against −TΔS on the plotter, find the temperature where ice melts, and drive an uphill reaction by coupling.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit05/q7-gibbs.js')
    },
    {
      id: 'boss-crucible',
      title: 'The Crucible',
      line: 'Crack the Fifth Guild’s geothermal siphon core at the caldera rim across five thermodynamic phases.',
      arena: 'boss',
      stageCount: 5,
      status: 'live',
      module: () => import('../quests/unit05/boss-crucible.js')
    }
  ]
};

export const UNIT05 = UNIT_05;
export default UNIT_05;
