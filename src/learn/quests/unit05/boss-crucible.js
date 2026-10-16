/**
 * boss-crucible.js — Learn world 5 elite: THE CRUCIBLE.
 *
 * The Fifth Guild's geothermal siphon core at the rim of the caldera. It is made
 * of everything Ember Reach measured, and each of its five phases puts one bench
 * back in front of the player with a new substance on the plate and the Crucible
 * standing behind it, glowing as the reading changes:
 *
 *   1  the jacket    heat caught by a weighed water jacket                  (bench 2)
 *   2  the coil      ΔH for ammonia from a bond ledger                      (bench 4)
 *   3  the slag      ΔH for splitting iron oxide from a stack of steps      (bench 5)
 *   4  the vent      ΔS for splitting steam from an entropy table           (bench 6)
 *   5  the seal      the temperature at which a decomposition tips over     (bench 7)
 *
 * The fight keeps every rule a bench stage keeps. A phase prompt states the
 * objective and never the route. A hint rung is one sentence and never the
 * answer. Nothing blocks a correct commit. A miss costs one point of Integrity
 * and three knock the rig back, with every reading and hint still kept.
 *
 * Clearing it files the Case File clue `clue_ember_siphon`. The boss pays no XP:
 * the main story never does.
 */

import { mountThermo, makeStateFor } from '../../engine/thermomount.js';
import { SPECIFIC_HEAT_WATER, FORMATION_TABLE, bondEnthalpySum, heatTransfer, crossingTemperature } from '../../engine/thermodata.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = [
  'unit05/q2-calorimetry', 'unit05/q4-bonds', 'unit05/q5-hess', 'unit05/q6-entropy', 'unit05/q7-gibbs'
];

const SPEAKER = 'Vess';

/** A key whose label says what it does carries no legend. */
export function toolNoteFor() { return null; }

const choice = (id, label) => ({ id, label });

const JACKET_KJ = heatTransfer(500, SPECIFIC_HEAT_WATER, 20) / 1000; // 41.84
const NH3 = bondEnthalpySum(
  [{ bond: 'N≡N', count: 1 }, { bond: 'H-H', count: 3 }],
  [{ bond: 'N-H', count: 6 }]
); // broken 2253, formed 2346, net -93
const T_SEAL = crossingTemperature(176, 160); // 1100

/* ------------------------------------------------------------------
   THE FIVE PHASES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 'p1-jacket',
    title: 'Phase 1 · The Jacket',
    briefing: {
      speaker: SPEAKER,
      body: 'This is the siphon core the Fifth Guild built at the rim, and each phase puts one of the benches in front of it again. A miss costs the rig a point of Integrity; three knock it back, and nothing you have read is lost.'
    },
    prompt: 'How much heat did the water jacket absorb from the Crucible?',
    encounter: {
      species: 'the crucible',
      act: 'Meter Heat',
      intent: 'The Crucible dumps its surplus heat into the water jacket around it.'
    },
    rigs: [
      {
        id: 'jacket', label: 'Cooling Jacket', head: 'cup', hideHeat: true, hideVerdict: true,
        waterMass: 500, waterTInit: 20.0, TFinal: 40.0, sublabel: '500 g of water'
      }
    ],
    reference: ['q = m × c × ΔT', 'c of water = 4.184 J/(g·°C)', '1 kJ = 1000 J'],
    widget: {
      type: 'choice',
      label: 'Heat absorbed',
      options: [
        choice('right', '41.8 kJ'),
        choice('half', '20.9 kJ'),
        choice('double', '83.7 kJ'),
        choice('units', '41800 kJ')
      ]
    },
    hints: [
      'Read the jacket’s mass and its temperature rise from the plate.',
      'Compare the mass, the specific heat capacity and the rise, each of which the heat depends on.',
      'Multiply the three together, then turn the joules into kilojoules.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === 'right') return { ok: true };
      if (state.choice === 'units') return { ok: false, msg: 'The sum comes out in joules, and a kilojoule is a thousand of them.' };
      return { ok: false, msg: 'Check that the sum uses the jacket’s whole mass and the whole of its temperature rise, each once.' };
    },
    reward: {
      log: 'The jacket’s warming gave the heat.',
      title: 'Jacket Vented',
      body: 'The heat a bath absorbs is its mass times its specific heat capacity times its temperature rise. The Crucible’s surplus went into the water, and the jacket now reads true.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 'p2-bonds',
    title: 'Phase 2 · The Coil',
    prompt: 'Estimate ΔH for N₂ + 3 H₂ → 2 NH₃ from the bond ledger, in kJ/mol.',
    encounter: {
      species: 'the crucible',
      act: 'Balance Bonds',
      intent: 'Nitrogen and hydrogen charge the Crucible’s synthesis coil.'
    },
    rigs: [
      {
        id: 'nh3-bonds', label: 'N₂ + 3 H₂ to 2 NH₃', head: 'bonds', submode: 'ledger',
        broken: [{ bond: 'N≡N', count: 1 }, { bond: 'H-H', count: 3 }],
        formed: [{ bond: 'N-H', count: 6 }],
        hideNet: true
      }
    ],
    widget: {
      type: 'choice',
      label: 'Estimated ΔH',
      options: [
        choice('right', '−93 kJ/mol'),
        choice('flipped', '+93 kJ/mol'),
        choice('formed', '−2346 kJ/mol'),
        choice('total', '+4599 kJ/mol')
      ]
    },
    hints: [
      'Read the total for the bonds broken and the total for the bonds formed.',
      'Compare the cost of reaching free atoms with the payoff of building the product.',
      'Take the energy to break the bonds and subtract the energy released by forming the new ones.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === 'right') return { ok: true };
      if (state.choice === 'flipped') return { ok: false, msg: 'The sign is backward: compare which of the two totals is the larger.' };
      if (state.choice === 'formed') return { ok: false, msg: 'That is only the energy of the bonds formed; the cost of the bonds broken still has to be counted.' };
      return { ok: false, msg: 'The bonds formed give energy back, so their total is taken off the broken total, not added to it.' };
    },
    reward: {
      log: 'The product bonds paid back more than they cost.',
      title: 'Coil Cooled',
      body: 'Forming six N–H bonds gives back slightly more than breaking N≡N and three H–H bonds costs, so ammonia’s synthesis releases heat. The coil’s own energy has gone out of it.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 'p3-hess',
    title: 'Phase 3 · The Slag',
    prompt: 'Make the stack add up to Fe₂O₃(s) → 2 Fe(s) + 1.5 O₂(g) and give its ΔH.',
    encounter: {
      species: 'the crucible',
      act: 'Stack Steps',
      intent: 'Molten iron slag seals the plates of the Crucible’s lower exchanger.'
    },
    rigs: [
      {
        id: 'fe-hess', label: 'Iron Oxide Stack', head: 'hess', submode: 'stack', hideSum: true,
        targetEq: 'Fe₂O₃(s) → 2 Fe(s) + 1.5 O₂(g)',
        cards: [
          { id: 'c1', eq: 'Fe₂O₃(s) + 3 CO(g) → 2 Fe(s) + 3 CO₂(g)', dH: -24.8 },
          { id: 'c2', eq: '3 CO(g) + 1.5 O₂(g) → 3 CO₂(g)', revEq: '3 CO₂(g) → 3 CO(g) + 1.5 O₂(g)', dH: -849.0 }
        ]
      }
    ],
    cardControls: [{ cardId: 'c2', label: 'Card 2', allowFlip: true }],
    widget: {
      type: 'choice',
      label: 'Net ΔH (kJ/mol)',
      options: [
        choice('right', '+824.2'),
        choice('noflip', '−873.8'),
        choice('minus', '−824.2'),
        choice('second', '+849.0')
      ]
    },
    hints: [
      'Compare the target equation with the side each card puts carbon monoxide and carbon dioxide on.',
      'Use the keys to turn a card round, and watch what happens to its ΔH.',
      'Turn the card that has the wrong side, so that everything not in the target cancels, then add the cards.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === 'right') return { ok: true };
      if (state.choice === 'noflip') return { ok: false, msg: 'Added as printed, the cards leave carbon dioxide and carbon monoxide uncancelled.' };
      if (state.choice === 'minus') return { ok: false, msg: 'The sign is backward: one card is turned round, and the other keeps its own.' };
      return { ok: false, msg: 'That is only the turned card; the first card is still to be added.' };
    },
    reward: {
      log: 'The slag came apart in two steps.',
      title: 'Slag Cracked',
      body: 'Turning the second card round makes the carbon oxides cancel and leaves iron oxide splitting into iron and oxygen. Hess’s law gave the climb without anyone running the reaction.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 'p4-entropy',
    title: 'Phase 4 · The Vent',
    prompt: 'Find ΔS° for 2 H₂O(g) → 2 H₂(g) + O₂(g) from the entropy table.',
    encounter: {
      species: 'the crucible',
      act: 'Count Gas',
      intent: 'The Crucible’s top vent splits steam into two different gases.'
    },
    rigs: [
      {
        id: 'steam-s0', label: 'Steam Splitting Table', head: 'hess', submode: 'formation',
        hideSeaLevel: true, columnLabel: 'S° (J/(mol·K))',
        targetEq: '2 H₂O(g) → 2 H₂(g) + O₂(g)',
        reactants: [{ formula: 'H₂O(g)', n: 2, dHf: FORMATION_TABLE['H2O(g)'].S0 }],
        products: [
          { formula: 'H₂(g)', n: 2, dHf: FORMATION_TABLE['H2(g)'].S0 },
          { formula: 'O₂(g)', n: 1, dHf: FORMATION_TABLE['O2(g)'].S0 }
        ]
      }
    ],
    widget: {
      type: 'choice',
      label: 'ΔS° (J/(mol·K))',
      options: [
        choice('right', '+89.0'),
        choice('flipped', '−89.0'),
        choice('single', '+277.8'),
        choice('products', '+466.6')
      ]
    },
    hints: [
      'Read the S° and the amount of each substance from the table.',
      'Compare the total for the products with the total for the reactants, counting every mole.',
      'Add the entropies of the products, then take off those of the reactants, each multiplied by its moles.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === 'right') return { ok: true };
      if (state.choice === 'flipped') return { ok: false, msg: 'The sign is backward: two moles of gas become three, and the table shows which total is larger.' };
      if (state.choice === 'single') return { ok: false, msg: 'The equation has two moles of steam, and each mole carries its own entropy.' };
      return { ok: false, msg: 'That is only the products’ total; the reactants’ entropy still has to be taken off.' };
    },
    reward: {
      log: 'Two moles of gas became three.',
      title: 'Vent Sealed',
      body: 'Splitting steam turns two moles of gas into three, so the products hold more entropy than the reactants. ΔS° is positive, and the Crucible’s vent loses its pressure.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 'p5-gibbs',
    title: 'Phase 5 · The Seal',
    prompt: 'At what temperature in kelvin does ΔG reach zero for the limestone seal on the plate?',
    encounter: {
      species: 'the crucible',
      act: 'Find Crossing',
      intent: 'The Crucible drives its core up toward the heat at which its limestone seal gives way.'
    },
    rigs: [
      {
        id: 'core-gibbs', label: 'Limestone Seal', head: 'gibbs', eq: 'CaCO₃(s) → CaO(s) + CO₂(g)',
        dH: 176, dS: 160, T: 900, TMin: 600, TMax: 1400, hideCrossing: true, hideTug: true
      }
    ],
    reference: ['ΔG = ΔH − T × ΔS'],
    widget: { type: 'number', label: 'Temperature where ΔG is zero (K)', min: 700, max: 1500, step: 100 },
    hints: [
      'Read the ΔH, the ΔS and their units from the plate.',
      'Compare the units of ΔH and ΔS before you put them in one equation.',
      'Set ΔG to zero, put both in the same unit, and solve for the temperature.'
    ],
    check(state) {
      if (state.number === T_SEAL) return { ok: true };
      return { ok: false, msg: 'Check that ΔH and ΔS are in the same energy unit before you divide one by the other.' };
    },
    reward: {
      log: 'The seal gave way at its crossing point.',
      title: 'Seal Broken',
      body: 'Above ΔH divided by ΔS, the TΔS term outweighs the heat the limestone costs and ΔG turns negative. The Crucible’s core stands open.'
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  clueAwarded: 'clue_ember_siphon',
  sections: [
    {
      heading: 'What You Found',
      body: 'The Crucible splits along its firebrick seams. Inside is a heat exchanger that carried megawatts away from the shelters without a wisp of steam reaching the sky.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every phase was a bench you had already worked: a bath, a ledger of bonds, a stack of steps, a table of entropies and a balance of two terms. That is all of Ember Reach, and it was enough to read the machine.'
    },
    {
      heading: 'Next',
      body: 'The siphon manifold goes into the Case File. The raiders were feeding a hidden endothermic process far below the crust, and no thermometer at the surface could have seen it.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'A 250 g bath of water (c = 4.184 J/(g·°C)) warms by 4.0 °C. How much heat did it absorb?',
    options: [
      { id: 'a', label: '4180 J' },
      { id: 'b', label: '1050 J' },
      { id: 'c', label: '2090 J' },
      { id: 'd', label: '16 700 J' }
    ],
    answer: 'a',
    explanation: 'Heat is mass times c times the rise: 250 g × 4.184 J/(g·°C) × 4.0 °C is about 4180 J.'
  },
  {
    question: 'Breaking bonds costs 1370 kJ and forming new ones gives back 1852 kJ. What is the estimated ΔH?',
    options: [
      { id: 'a', label: '−482 kJ' },
      { id: 'b', label: '+482 kJ' },
      { id: 'c', label: '−3222 kJ' },
      { id: 'd', label: '+3222 kJ' }
    ],
    answer: 'a',
    explanation: 'ΔH is the energy of the bonds broken minus the energy of the bonds formed: 1370 − 1852 = −482 kJ.'
  },
  {
    question: 'A → B has ΔH = +80 kJ and C → B has ΔH = +30 kJ. What is ΔH for A → C?',
    options: [
      { id: 'a', label: '+50 kJ' },
      { id: 'b', label: '−50 kJ' },
      { id: 'c', label: '+110 kJ' },
      { id: 'd', label: '−110 kJ' }
    ],
    answer: 'a',
    explanation: 'Turn the second step round to give B → C with ΔH = −30 kJ, then add it to the first: +80 − 30 = +50 kJ.'
  },
  {
    question: 'Which reaction has a positive ΔS°?',
    options: [
      { id: 'a', label: '2 N₂O(g) → 2 N₂(g) + O₂(g)' },
      { id: 'b', label: '2 NO₂(g) → N₂O₄(g)' },
      { id: 'c', label: 'Ag⁺(aq) + Cl⁻(aq) → AgCl(s)' }
    ],
    answer: 'a',
    explanation: 'The first makes three moles of gas from two. The other two use up gas or free ions and lose entropy.'
  },
  {
    question: 'A decomposition has ΔH = +60 kJ/mol and ΔS = +100 J/(mol·K). Above what temperature is it spontaneous?',
    options: [
      { id: 'a', label: '600 K' },
      { id: 'b', label: '6.0 K' },
      { id: 'c', label: '60 K' },
      { id: 'd', label: '1670 K' }
    ],
    answer: 'a',
    explanation: 'The crossing temperature is ΔH divided by ΔS: 60 000 J/mol divided by 100 J/(mol·K) is 600 K.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
export const SOLUTIONS = [
  { choice: 'right' },
  { choice: 'right' },
  { choice: 'right' },
  { choice: 'right' },
  { number: T_SEAL }
];

export const MISSES = [
  { choice: 'half' },
  { choice: 'flipped' },
  { choice: 'noflip' },
  { choice: 'single' },
  { number: 700 }
];

export const stateFor = makeStateFor(STAGES);

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  // Clearing the last phase files the clue. The boss pays no XP, so this is not a rail.
  const bossCtx = {
    ...ctx,
    reportComplete() {
      ctx.reportComplete();
      session.recordClue?.(DEBRIEF.clueAwarded);
    }
  };
  return mountThermo(container, bossCtx, { STAGES, DEBRIEF, toolNoteFor });
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { JACKET_KJ, NH3, T_SEAL };
