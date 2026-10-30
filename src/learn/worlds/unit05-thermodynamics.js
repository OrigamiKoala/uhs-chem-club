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
  line: 'Thermal energy transfer, reaction enthalpy, bond energies, entropy, and Gibbs free energy.',
  brief:
    'Thermodynamics governs energy transformations and spontaneity. In Ember Reach, explore heat transfer in calorimetry, multi-step reaction enthalpies, and the balance of enthalpy and entropy.',

  quests: [
    {
      id: 'q1-flow',
      title: 'Heat and Temperature',
      line: 'Touch a hot block to a cold one, observe temperature equalization, and identify the direction of thermal energy transfer.',
      arena: 'bench',
      stageCount: 5,
      status: 'live',
      module: () => import('../quests/unit05/q1-flow.js')
    },
    {
      id: 'q2-calorimetry',
      title: 'Calorimetry',
      line: 'Measure heat in a water bath: specific heat capacity, melting ice and a reaction\'s energy.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit05/q2-calorimetry.js')
    },
    {
      id: 'q3-enthalpy',
      title: 'Enthalpy of Reaction',
      line: 'Relate reaction heat to molar enthalpy, reaction stoichiometry, and fuel energy density.',
      arena: 'bench',
      stageCount: 8,
      status: 'live',
      module: () => import('../quests/unit05/q3-enthalpy.js')
    },
    {
      id: 'q4-bonds',
      title: 'Bond Enthalpies',
      line: 'Estimate reaction enthalpy by balancing the energy required to break bonds with energy released forming bonds.',
      arena: 'bench',
      stageCount: 6,
      status: 'live',
      module: () => import('../quests/unit05/q4-bonds.js')
    },
    {
      id: 'q5-hess',
      title: "Hess's Law and Formation",
      line: 'Combine multi-step reaction enthalpies using Hess\'s law and standard enthalpies of formation.',
      arena: 'bench',
      stageCount: 4,
      status: 'live',
      module: () => import('../quests/unit05/q5-hess.js')
    },
    {
      id: 'q6-entropy',
      title: 'Entropy',
      line: 'Model particle dispersal across microstates and evaluate entropy changes across phase transitions and reactions.',
      arena: 'bench',
      stageCount: 5,
      status: 'live',
      module: () => import('../quests/unit05/q6-entropy.js')
    },
    {
      id: 'q7-gibbs',
      title: 'Free Energy',
      line: 'Evaluate spontaneity by balancing enthalpy and entropy across temperatures using Gibbs free energy.',
      arena: 'bench',
      stageCount: 6,
      status: 'live',
      module: () => import('../quests/unit05/q7-gibbs.js')
    },
    {
      id: 'boss-crucible',
      title: 'The Crucible',
      line: 'Solve five thermodynamic challenges across calorimetry, bond energies, Hess\'s law, entropy, and free energy.',
      arena: 'boss',
      stageCount: 5,
      status: 'live',
      module: () => import('../quests/unit05/boss-crucible.js')
    }
  ]
};

export const UNIT05 = UNIT_05;
export default UNIT_05;
