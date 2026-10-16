/**
 * Unit 5 · Bench 4 — Bond Enthalpies (q4-bonds)
 *
 * The bond crank and the bond ledger. A crank pulls one bond into free atoms and
 * prints what that costs; a ledger lists every bond a reaction breaks and every
 * bond it forms, with the two running totals. The energy of a reaction is the
 * climb to free atoms less the drop into products.
 *
 *   1  pulling H–H apart                        -> bond enthalpy
 *   2  letting the atoms snap back              -> (forming releases what breaking cost)
 *   3  which bonds burning methane breaks       -> (broken and formed bonds)
 *   4  the sum for burning methane              -> (ΔH is broken less formed)
 *   5  the sum against the calorimeter          -> average bond enthalpy
 *   6  why burning still releases heat          -> (the stronger products)
 *   7  a double bond against a single one       -> bond order
 *   8  a reaction that climbs                   -> (weaker products make it endothermic)
 *
 * THE EVIDENCE IS ON THE BENCH. Stage 2's crank has its cost switched off
 * (`hideCost`), so the energy released is reasoned from stage 1 rather than read
 * off the plate. A ledger always shows its totals but, on the stages that ask for
 * the net, never the net itself (`hideNet`).
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { mountThermo, makeStateFor } from '../../engine/thermomount.js';
import { BOND_ENTHALPIES, bondEnthalpySum } from '../../engine/thermodata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bbond enthalpy\b/i, introducedAt: 1 },
  { term: /\baverage bond enthalpies\b/i, introducedAt: 5 },
  { term: /\bbond order\b/i, introducedAt: 7 }
];

/** Bonds are Ligar's first bench. */
export const BUILDS_ON = ['unit03/q1-joins'];

const SPEAKER = 'Vess';

/** A key whose label says what it does carries no legend. */
export function toolNoteFor() { return null; }

const choice = (id, label) => ({ id, label });

const CH4_SUMS = bondEnthalpySum(
  [{ bond: 'C-H', count: 4 }, { bond: 'O=O', count: 2 }],
  [{ bond: 'C=O', count: 2 }, { bond: 'O-H', count: 4 }]
); // broken 2648, formed 3450, net -802

const NO_BROKEN = [{ bond: 'N≡N', count: 1 }, { bond: 'O=O', count: 1 }];
const NO_FORMED = [{ bond: 'N=O', count: 2, dH: 631 }];
const NO_SUMS = bondEnthalpySum(NO_BROKEN, NO_FORMED); // broken 1443, formed 1262, net +181

const CH4_BROKEN = [{ bond: 'C-H', count: 4 }, { bond: 'O=O', count: 2 }];
const CH4_FORMED = [{ bond: 'C=O', count: 2 }, { bond: 'O-H', count: 4 }];

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-break-hh',
    title: 'Pulling Two Atoms Out of Their Well',
    prompt: 'Press "Pull Bond" and give the energy in kJ/mol needed to pull one mole of H–H bonds apart.',
    briefing: {
      speaker: SPEAKER,
      body: 'Two bonded hydrogen atoms sit in a well of energy made by their shared electrons, and the crank pulls them out of it.'
    },
    rigs: [
      { id: 'hh-break', label: 'H–H Pull Crank', head: 'bonds', submode: 'crank', bond: 'H-H', pulled: false, forming: false }
    ],
    toggleAction: { group: 'Crank', label: 'Pull Bond' },
    widget: { type: 'number', label: 'Energy to break H–H (kJ/mol)', min: 236, max: 636, step: 50 },
    hints: [
      'Press "Pull Bond" and watch the two atoms separate.',
      'Compare the plate before and after the pull for the energy it prints.',
      'Enter the figure the crank prints for pulling the atoms completely apart.'
    ],
    check(state) {
      if (state.number === BOND_ENTHALPIES['H-H'].dH) return { ok: true };
      return { ok: false, msg: 'Pull the bond and read the energy printed on the plate beneath the atoms.' };
    },
    reward: {
      log: 'The crank printed what the bond costs.',
      title: 'Bond Enthalpy',
      body: 'The energy needed to break one mole of a gaseous bond into separate atoms is its bond enthalpy, and for H–H it is 436 kJ/mol. Breaking a bond always takes energy in.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-form-hh',
    title: 'Falling Back Into the Same Well',
    prompt: 'When free hydrogen atoms snap together into H–H bonds, what happens to the energy?',
    briefing: {
      speaker: SPEAKER,
      body: 'The crank now runs the other way: two free atoms fall back together.'
    },
    rigs: [
      { id: 'hh-form', label: 'H + H to H–H', head: 'bonds', submode: 'crank', bond: 'H-H', pulled: true, forming: true, hideCost: true }
    ],
    widget: {
      type: 'choice',
      label: 'What forming the bond does',
      options: [
        choice('release', 'It releases the same energy that breaking the bond took in'),
        choice('absorb', 'It absorbs the same energy again'),
        choice('zero', 'It exchanges no energy at all')
      ]
    },
    hints: [
      'Compare this plate with the one where you pulled the atoms apart.',
      'Compare the two trips: one climbs out of the well, and this one falls back in.',
      'A trip back down between the same two levels undoes what the trip up cost.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose what happens.' };
      if (state.choice === 'release') return { ok: true };
      if (state.choice === 'absorb') return { ok: false, msg: 'Pulling the atoms apart took energy in, and falling back into the well cannot take it in again.' };
      return { ok: false, msg: 'The atoms end in a different place from where they began, so their energy changes.' };
    },
    reward: {
      log: 'The fall back released what the climb cost.',
      title: 'Forming a Bond',
      body: 'Forming a bond is the exact reverse of breaking it. The atoms fall back into the well and give out the same energy that pulling them out took in.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-count-methane',
    title: 'Taking Inventory of Broken and Formed Bonds',
    prompt: 'Sort each bond by whether burning methane breaks it or forms it.',
    briefing: {
      speaker: SPEAKER,
      body: 'Methane burns in oxygen to make carbon dioxide and water, and the ledger lists every bond on both sides.'
    },
    rigs: [
      {
        id: 'ch4-ledger', label: 'CH₄ + 2 O₂ to CO₂ + 2 H₂O', head: 'bonds', submode: 'ledger',
        broken: CH4_BROKEN, formed: CH4_FORMED, hideNet: true
      }
    ],
    widget: {
      type: 'bins',
      label: 'Assign each bond',
      bins: [choice('broken', 'Broken'), choice('formed', 'Formed')],
      items: [
        choice('ch', 'The C–H bonds of methane'),
        choice('oo', 'The O=O bonds of oxygen'),
        choice('co', 'The C=O bonds of carbon dioxide'),
        choice('oh', 'The O–H bonds of water')
      ]
    },
    hints: [
      'Read the two columns of the ledger.',
      'Compare each bond in the list with the molecules on the left and right of the equation.',
      'Bonds in the starting molecules are broken, and bonds in the new molecules are formed.'
    ],
    check(state) {
      const want = { ch: 'broken', oo: 'broken', co: 'formed', oh: 'formed' };
      if (Object.keys(want).some(k => !state.bins[k])) return { ok: false, notYet: true, msg: 'Place all four bonds first.' };
      if (Object.entries(want).every(([k, v]) => state.bins[k] === v)) return { ok: true };
      return { ok: false, msg: 'Check which side of the equation each molecule is on: the starting molecules lose their bonds, and the new ones gain theirs.' };
    },
    reward: {
      log: 'The ledger was sorted into two columns.',
      title: 'Broken and Formed',
      body: 'A reaction breaks every bond in its starting molecules and forms every bond in its products. Burning one methane takes 4 C–H and 2 O=O bonds apart and builds 2 C=O and 4 O–H bonds.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-estimate-dh',
    title: 'Up to Free Atoms, Down to Products',
    prompt: 'Use the bond ledger to estimate ΔH for burning methane, in kJ/mol.',
    briefing: {
      speaker: SPEAKER,
      body: 'The ledger adds up the energy of every bond broken and of every bond formed.'
    },
    rigs: [
      {
        id: 'ch4-ledger', label: 'Methane Bond Ledger', head: 'bonds', submode: 'ledger',
        broken: CH4_BROKEN, formed: CH4_FORMED, hideNet: true
      }
    ],
    widget: {
      type: 'choice',
      label: 'Estimated ΔH',
      options: [
        choice('minus', '−802 kJ/mol'),
        choice('plus', '+802 kJ/mol'),
        choice('total', '+6098 kJ/mol'),
        choice('broken', '+2648 kJ/mol')
      ]
    },
    hints: [
      'Read the total for the bonds broken and the total for the bonds formed at the foot of the ledger.',
      'Compare what it costs to reach free atoms with what is paid back by building the products.',
      'Take the energy to break the bonds and subtract the energy released by forming the new ones.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === 'minus') return { ok: true };
      if (state.choice === 'plus') return { ok: false, msg: 'The sign is backward: ask which total is the larger, the climb to free atoms or the drop into products.' };
      if (state.choice === 'total') return { ok: false, msg: 'The formed bonds give energy back, so the two totals must not simply be added.' };
      return { ok: false, msg: 'That is only the cost of breaking bonds; the energy from forming the new ones still has to be taken off.' };
    },
    reward: {
      log: 'The drop outweighed the climb.',
      title: 'Broken Less Formed',
      body: 'A reaction climbs to free atoms by breaking its bonds and then drops into its products by forming new ones. ΔH is the energy of the bonds broken minus the energy of the bonds formed.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-why-estimate',
    title: 'Why the Table Estimate Differs from the Cup',
    prompt: 'Why does the bond estimate for burning methane differ from the calorimeter value on the plate?',
    briefing: {
      speaker: SPEAKER,
      body: 'The plate sets the estimate beside what a calorimeter measured for the same reaction.'
    },
    rigs: [
      {
        id: 'ch4-compare', label: 'Bond Estimate and Calorimeter', head: 'bonds', submode: 'ledger',
        broken: CH4_BROKEN, formed: CH4_FORMED, calorimeterDH: -890
      }
    ],
    widget: {
      type: 'choice',
      label: 'Reason for the difference',
      options: [
        choice('avg-gas', 'Table values are averages for gas molecules, and the calorimeter makes liquid water'),
        choice('broken-exo', 'The calorimeter forgot to count the energy of breaking the C–H bonds'),
        choice('exact', 'Bond enthalpies apply only to ionic solids, not to gases')
      ]
    },
    hints: [
      'Compare the estimate on the plate with the measured value beneath it.',
      'Compare the conditions the table assumes with the conditions in the calorimeter.',
      'Ask whether a bond in one molecule costs exactly what the same kind of bond costs in every other, and what state the water is in.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'avg-gas') return { ok: true };
      if (state.choice === 'broken-exo') return { ok: false, msg: 'A calorimeter measures the whole reaction, so it cannot miss a step of it.' };
      return { ok: false, msg: 'The bonds on the plate are all in gas molecules, so a rule about ionic solids cannot be the reason.' };
    },
    reward: {
      log: 'The table gives an estimate, not a measurement.',
      title: 'Average Bond Enthalpies',
      body: 'Tabulated bond enthalpies are averages over many gas-phase molecules, so a sum from them is only an estimate. A calorimeter measures the real reaction, including the heat given out when steam condenses.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-why-burning-exo',
    title: 'Why Burning Still Releases Heat',
    prompt: 'If breaking bonds costs energy, why does burning methane still release heat?',
    briefing: {
      speaker: SPEAKER,
      body: 'A common idea is that heat comes from bonds snapping, and the ledger shows both sides of the account.'
    },
    rigs: [
      {
        id: 'ch4-myth', label: 'Cost and Payoff', head: 'bonds', submode: 'ledger',
        broken: CH4_BROKEN, formed: CH4_FORMED
      }
    ],
    widget: {
      type: 'choice',
      label: 'Where the heat comes from',
      options: [
        choice('strong-products', 'The new bonds release more energy than breaking the old ones cost'),
        choice('break-ch', 'Breaking the C–H bonds releases heat as they snap apart'),
        choice('no-break', 'No bonds are broken; the atoms only rearrange')
      ]
    },
    hints: [
      'Compare the total for breaking bonds with the total for forming them on the plate.',
      'Compare the direction each of the two columns moves the energy of the system.',
      'Heat is released when what is paid back by the new bonds is larger than what the old ones cost.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose where the heat comes from.' };
      if (state.choice === 'strong-products') return { ok: true };
      if (state.choice === 'break-ch') return { ok: false, msg: 'Pulling atoms out of a bond is the climb, so it always takes energy in.' };
      return { ok: false, msg: 'The ledger lists bonds on the starting side, and they must be taken apart for the new ones to form.' };
    },
    reward: {
      log: 'The payoff was larger than the cost.',
      title: 'Where the Heat Comes From',
      body: 'Breaking bonds never releases energy. Fuels burn hot because their atoms snap into stronger, lower-energy product bonds, and the energy those bonds give out is more than the old ones cost.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-double-vs-single',
    title: 'Single and Double Bond Wells',
    prompt: 'Compare the two bonds on the plates; which needs more energy to break?',
    briefing: {
      speaker: SPEAKER,
      body: 'Both cranks hold two carbon atoms, one joined by a single shared pair and one by two.'
    },
    rigs: [
      { id: 'cc-single', label: 'C–C Bond', head: 'bonds', submode: 'crank', bond: 'C-C', pulled: false },
      { id: 'cc-double', label: 'C=C Bond', head: 'bonds', submode: 'crank', bond: 'C=C', pulled: false }
    ],
    widget: {
      type: 'choice',
      label: 'The bond that needs more energy',
      options: [
        choice('higher', 'The double bond, C=C'),
        choice('lower', 'The single bond, C–C'),
        choice('equal', 'They need the same energy')
      ]
    },
    hints: [
      'Read the energy printed on each plate.',
      'Compare the two figures with the number of electron pairs shared in each bond.',
      'The bond with more shared pairs holds the nuclei more tightly, so it sits in a deeper well.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a bond.' };
      if (state.choice === 'higher') return { ok: true };
      if (state.choice === 'lower') return { ok: false, msg: 'Compare the two figures on the plates; they are not in that order.' };
      return { ok: false, msg: 'The two plates print different energies, so the bonds are not equal.' };
    },
    reward: {
      log: 'The double bond cost more to break.',
      title: 'Bond Order',
      body: 'Between the same two elements, a higher bond order pulls the nuclei closer into a deeper well, so it takes more energy to break. A triple bond is stronger than a double, and a double is stronger than a single.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-predict-sign',
    title: 'A Reaction That Climbs',
    prompt: 'Use the bond ledger to estimate ΔH for N₂ + O₂ → 2 NO, in kJ/mol.',
    briefing: {
      speaker: SPEAKER,
      body: 'Air is mostly nitrogen and oxygen, and the ledger lists the bonds in these two gases and in nitric oxide.'
    },
    rigs: [
      {
        id: 'no', label: 'N₂ + O₂ to 2 NO', head: 'bonds', submode: 'ledger',
        broken: NO_BROKEN, formed: NO_FORMED, hideNet: true
      }
    ],
    widget: {
      type: 'choice',
      label: 'Estimated ΔH',
      options: [
        choice('plus', '+181 kJ/mol'),
        choice('minus', '−181 kJ/mol'),
        choice('big', '+2705 kJ/mol'),
        choice('zero', '0 kJ/mol')
      ]
    },
    hints: [
      'Read the total for the bonds broken and the total for the bonds formed.',
      'Compare the two totals before you subtract, and decide which sign the answer must have.',
      'Take the energy to break the bonds and subtract the energy released by forming the new ones.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === 'plus') return { ok: true };
      if (state.choice === 'minus') return { ok: false, msg: 'The sign is backward: compare which of the two totals is larger.' };
      if (state.choice === 'big') return { ok: false, msg: 'The formed bonds pay energy back, so their total is taken off the broken total, not added to it.' };
      return { ok: false, msg: 'The two totals on the ledger are not equal, so the difference cannot be nothing.' };
    },
    reward: {
      log: 'Weaker product bonds made the reaction climb.',
      title: 'A Climbing Reaction',
      body: 'Here the bonds formed pay back less than the bonds broken cost, so ΔH is positive and the reaction absorbs heat. Not every reaction runs downhill, which is why nitrogen and oxygen sit side by side in air.'
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'Every reaction climbs to free atoms by breaking its bonds and then drops into its products by forming new ones. When the new bonds are stronger the drop is larger, ΔH is negative, and the reaction releases heat.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Bond enthalpies let you estimate the heat of a reaction nobody has measured yet. They are averages, so the answer is a guide, not a reading.'
    },
    {
      heading: 'Next',
      body: 'The next bench finds the heat of a reaction by stacking known steps instead of counting bonds.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Which statement about bond breaking and bond forming is correct?',
    options: [
      { id: 'a', label: 'Breaking a bond absorbs energy, and forming a bond releases energy' },
      { id: 'b', label: 'Breaking a bond releases energy, and forming a bond absorbs energy' },
      { id: 'c', label: 'Both breaking and forming a bond release energy' },
      { id: 'd', label: 'Both breaking and forming a bond absorb energy' }
    ],
    answer: 'a',
    explanation: 'Pulling atoms out of an attraction takes energy in, and letting them fall back into it gives the same energy out.'
  },
  {
    question: 'Breaking H–H (436 kJ/mol) and Cl–Cl (242 kJ/mol) and forming two H–Cl bonds (431 kJ/mol each) gives what ΔH for H₂ + Cl₂ → 2 HCl?',
    options: [
      { id: 'a', label: '−184 kJ' },
      { id: 'b', label: '+184 kJ' },
      { id: 'c', label: '−862 kJ' },
      { id: 'd', label: '+678 kJ' }
    ],
    answer: 'a',
    explanation: 'Breaking costs 436 + 242 = 678 kJ and forming gives back 2 × 431 = 862 kJ, so ΔH is 678 − 862 = −184 kJ.'
  },
  {
    question: 'Which of these bonds between carbon atoms has the highest bond enthalpy?',
    options: [
      { id: 'a', label: 'C≡C, the triple bond' },
      { id: 'b', label: 'C=C, the double bond' },
      { id: 'c', label: 'C–C, the single bond' }
    ],
    answer: 'a',
    explanation: 'More shared electron pairs hold the nuclei closer in a deeper well, so the triple bond takes the most energy to break.'
  },
  {
    question: 'For 2 H₂ + O₂ → 2 H₂O (gas), use H–H = 436, O=O = 498 and O–H = 463 kJ/mol. What is the estimated ΔH?',
    options: [
      { id: 'a', label: '−482 kJ' },
      { id: 'b', label: '+482 kJ' },
      { id: 'c', label: '−1852 kJ' },
      { id: 'd', label: '+1370 kJ' }
    ],
    answer: 'a',
    explanation: 'Breaking 2 H–H and 1 O=O costs 1370 kJ, and forming 4 O–H gives back 1852 kJ, so ΔH is 1370 − 1852 = −482 kJ.'
  },
  {
    question: 'Breaking the bonds of a fuel takes energy, yet burning it releases heat. Why?',
    options: [
      { id: 'a', label: 'The product bonds are stronger, so forming them releases more than breaking the fuel’s bonds cost' },
      { id: 'b', label: 'Breaking the fuel’s bonds releases heat once the first bond has snapped' },
      { id: 'c', label: 'The oxygen supplies all of the energy and the fuel supplies none' }
    ],
    answer: 'a',
    explanation: 'Energy is released when the total paid back by new bonds is larger than the total spent breaking old ones.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
export const SOLUTIONS = [
  { number: BOND_ENTHALPIES['H-H'].dH },
  { choice: 'release' },
  { bins: { ch: 'broken', oo: 'broken', co: 'formed', oh: 'formed' } },
  { choice: 'minus' },
  { choice: 'avg-gas' },
  { choice: 'strong-products' },
  { choice: 'higher' },
  { choice: 'plus' }
];

export const MISSES = [
  { number: 336 },
  { choice: 'absorb' },
  { bins: { ch: 'formed', oo: 'broken', co: 'formed', oh: 'formed' } },
  { choice: 'plus' },
  { choice: 'broken-exo' },
  { choice: 'break-ch' },
  { choice: 'lower' },
  { choice: 'minus' }
];

export const stateFor = makeStateFor(STAGES);

export function mount(container, ctx) {
  return mountThermo(container, ctx, { STAGES, DEBRIEF, toolNoteFor });
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { CH4_SUMS, NO_SUMS };
