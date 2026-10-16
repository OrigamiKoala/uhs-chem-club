/**
 * Unit 5 · Bench 5 — Hess's Law and Formation (q5-hess)
 *
 * The step stack. Reactions that cannot be run in a cup are built from ones that
 * can: each card is a measured step with its own ΔH, a card can be flipped or
 * doubled, and the cards that cancel leave the reaction wanted. Then the same idea
 * is run from the elements, where every compound has an altitude of its own.
 *
 *   1  two steps added                               -> Hess's law
 *   2  a step flipped to put CO on the product side   -> (flip, and the sign flips)
 *   3  a step doubled to cancel two NO               -> (scale, and the ΔH scales)
 *   4  three cards cancelled into methane            -> (several corrections at once)
 *   5  why an element's value is nothing             -> standard enthalpy of formation
 *   6  products from elements, less reactants        -> (ΔH is products less reactants)
 *   7  two routes with one result                    -> state function
 *   8  an unknown formation value                    -> (worked back from a combustion)
 *
 * THE EVIDENCE IS ON THE BENCH. A stack that asks for a net hides its own sum
 * (`hideSum`), and the flip and double keys change the card the player is reading,
 * so the player adds the cards as they stand. The formation table never carries a
 * note that does the sum, and the one unknown value on stage 8 is printed as "?".
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { mountThermo, makeStateFor } from '../../engine/thermomount.js';
import { FORMATION_TABLE } from '../../engine/thermodata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bhess/i, introducedAt: 1 },
  { term: /\bstandard enthalpy of formation\b/i, introducedAt: 5 },
  { term: /\bstate function\b/i, introducedAt: 7 }
];

/** The sign of a ΔH and the idea of a bond's energy come from the benches before. */
export const BUILDS_ON = ['unit01/q6-weigh'];

const SPEAKER = 'Vess';

/** A key whose label says what it does carries no legend. */
export function toolNoteFor() { return null; }

const choice = (id, label) => ({ id, label });

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-stack-two',
    title: 'Two Steps Down the Same Ladder',
    prompt: 'Find ΔH for C(s) + O₂(g) → CO₂(g) by adding the two steps on the stack.',
    briefing: {
      speaker: SPEAKER,
      body: 'Each card is a reaction someone has already measured, and the ladder beside them climbs or falls by each card’s ΔH in turn.'
    },
    rigs: [
      {
        id: 'hess1',
        label: 'Two-Step Carbon Stack',
        head: 'hess',
        submode: 'stack',
        targetEq: 'C(s) + O₂(g) → CO₂(g)',
        hideSum: true,
        cards: [
          { id: 'c1', eq: 'C(s) + ½O₂(g) → CO(g)', dH: -110.5 },
          { id: 'c2', eq: 'CO(g) + ½O₂(g) → CO₂(g)', dH: -283.0 }
        ]
      }
    ],
    widget: {
      type: 'choice',
      label: 'Net ΔH (kJ/mol)',
      options: [
        choice('sum', '−393.5'),
        choice('diff', '−172.5'),
        choice('plus', '+393.5'),
        choice('first', '−110.5')
      ]
    },
    hints: [
      'Read the two cards and the target equation at the top of the plate.',
      'Compare what the first card makes with what the second card uses.',
      'The substance made by one step and used by the next cancels, so the steps’ enthalpy changes simply add.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === 'sum') return { ok: true };
      if (state.choice === 'diff') return { ok: false, msg: 'Both steps follow the road to the target in the same direction, so neither should be taken off the other.' };
      if (state.choice === 'plus') return { ok: false, msg: 'Both cards fall, so the total cannot rise.' };
      return { ok: false, msg: 'That is only the first step; the target needs the second as well.' };
    },
    reward: {
      log: 'The two steps added up to the whole.',
      title: 'Hess’s Law',
      body: 'When a reaction is the sum of several steps, its ΔH is the sum of their ΔH values. This is Hess’s law, and it lets a reaction nobody can run cleanly be built from ones that can be.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-flip-one',
    title: 'Flipping a Step',
    prompt: 'Make the stack add up to C(s) + ½O₂(g) → CO(g) and give its ΔH.',
    briefing: {
      speaker: SPEAKER,
      body: 'Carbon cannot easily be burned to stop at carbon monoxide, but both cards on the stack can be measured in a cup.'
    },
    rigs: [
      {
        id: 'hess2',
        label: 'Reach CO(g)',
        head: 'hess',
        submode: 'stack',
        targetEq: 'C(s) + ½O₂(g) → CO(g)',
        hideSum: true,
        cards: [
          { id: 'c1', eq: 'C(s) + O₂(g) → CO₂(g)', revEq: 'CO₂(g) → C(s) + O₂(g)', dH: -393.5 },
          { id: 'c2', eq: 'CO(g) + ½O₂(g) → CO₂(g)', revEq: 'CO₂(g) → CO(g) + ½O₂(g)', dH: -283.0 }
        ]
      }
    ],
    cardControls: [{ cardId: 'c2', label: 'Card 2', allowFlip: true }],
    widget: {
      type: 'choice',
      label: 'Net ΔH (kJ/mol)',
      options: [
        choice('flip', '−110.5'),
        choice('noflip', '−676.5'),
        choice('plus', '+110.5'),
        choice('second', '−283.0')
      ]
    },
    hints: [
      'Compare the target equation with the side each card puts carbon monoxide on.',
      'Use the keys to turn a card round, and watch what happens to its ΔH.',
      'A card turned round has the opposite sign, and after that the cards add.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === 'flip') return { ok: true };
      if (state.choice === 'noflip') return { ok: false, msg: 'Added as printed, the second card leaves carbon dioxide on the wrong side of the equation.' };
      if (state.choice === 'plus') return { ok: false, msg: 'The sign is backward: check which of the two cards had to be turned round and what that does to it.' };
      return { ok: false, msg: 'That is only one card; the first card is needed too.' };
    },
    reward: {
      log: 'A turned card has the opposite sign.',
      title: 'Reversing a Step',
      body: 'Running a step backwards changes the sign of its ΔH, just as it did for a whole reaction. Turning the second card round makes carbon dioxide cancel and leaves carbon forming carbon monoxide.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-double-one',
    title: 'Scaling a Step',
    prompt: 'Make the stack add up to N₂(g) + 2 O₂(g) → 2 NO₂(g) and give its ΔH.',
    briefing: {
      speaker: SPEAKER,
      body: 'Nitric oxide is only an intermediate here, so none of it may be left over once the cards are added.'
    },
    rigs: [
      {
        id: 'hess3',
        label: 'Reach 2 NO₂(g)',
        head: 'hess',
        submode: 'stack',
        targetEq: 'N₂(g) + 2 O₂(g) → 2 NO₂(g)',
        hideSum: true,
        cards: [
          { id: 'c1', eq: 'N₂(g) + O₂(g) → 2 NO(g)', dH: 180.6 },
          { id: 'c2', eq: 'NO(g) + ½O₂(g) → NO₂(g)', dH: -57.1 }
        ]
      }
    ],
    cardControls: [{ cardId: 'c2', label: 'Card 2', allowMult: true, multValues: [1, 2] }],
    widget: {
      type: 'choice',
      label: 'Net ΔH (kJ/mol)',
      options: [
        choice('doubled', '+66.4'),
        choice('single', '+123.5'),
        choice('minus', '−66.4'),
        choice('first', '+180.6')
      ]
    },
    hints: [
      'Compare the nitric oxide the first card makes with the nitric oxide the second card uses.',
      'Use the keys to scale a card, and watch what happens to its ΔH as well as its equation.',
      'Scale the card that uses too little by the factor that makes the two amounts match, then add the cards.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === 'doubled') return { ok: true };
      if (state.choice === 'single') return { ok: false, msg: 'Added as printed, the cards leave nitric oxide over; the second card must be scaled until none is.' };
      if (state.choice === 'minus') return { ok: false, msg: 'The sign is backward: the first card rises and the second falls, and the first is the larger.' };
      return { ok: false, msg: 'That is only the first card; the second must be added too.' };
    },
    reward: {
      log: 'A doubled card doubles its ΔH.',
      title: 'Scaling a Step',
      body: 'Multiplying a step by a number multiplies its ΔH by the same number. Doubling the second card uses up both nitric oxide molecules and leaves +66.4 kJ for the whole reaction.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-three-cards',
    title: 'Building Methane from Three Combustion Cards',
    prompt: 'Make the stack add up to C(s) + 2 H₂(g) → CH₄(g) and give its ΔH.',
    briefing: {
      speaker: SPEAKER,
      body: 'Methane is hard to build directly, but burning carbon, hydrogen and methane are all easy to measure.'
    },
    rigs: [
      {
        id: 'hess4',
        label: 'Three-Card Methane Stack',
        head: 'hess',
        submode: 'stack',
        targetEq: 'C(s) + 2 H₂(g) → CH₄(g)',
        hideSum: true,
        cards: [
          { id: 'c1', eq: 'C(s) + O₂(g) → CO₂(g)', dH: -393.5 },
          { id: 'c2', eq: 'H₂(g) + ½O₂(g) → H₂O(l)', dH: -285.8 },
          { id: 'c3', eq: 'CH₄(g) + 2 O₂(g) → CO₂(g) + 2 H₂O(l)', revEq: 'CO₂(g) + 2 H₂O(l) → CH₄(g) + 2 O₂(g)', dH: -890.3 }
        ]
      }
    ],
    cardControls: [
      { cardId: 'c2', label: 'Card 2', allowMult: true, multValues: [1, 2] },
      { cardId: 'c3', label: 'Card 3', allowFlip: true }
    ],
    widget: {
      type: 'choice',
      label: 'Net ΔH (kJ/mol)',
      options: [
        choice('right', '−74.8'),
        choice('unscaled', '+211.0'),
        choice('unflipped', '−1855.4'),
        choice('plus', '+74.8')
      ]
    },
    hints: [
      'Compare the target equation with what each card makes and uses, one substance at a time.',
      'Use the keys to turn or scale the cards until carbon dioxide, water and oxygen all cancel.',
      'Add the three cards as they stand once nothing is left over but the target’s own substances.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === 'right') return { ok: true };
      if (state.choice === 'unscaled') return { ok: false, msg: 'With a single hydrogen card, one hydrogen molecule is still missing from the target’s left side.' };
      if (state.choice === 'unflipped') return { ok: false, msg: 'Methane must end up on the product side, which the methane card as printed does not do.' };
      return { ok: false, msg: 'The sign is backward: add the cards as they stand, with each turned or scaled card carrying its new value.' };
    },
    reward: {
      log: 'Three cards cancelled to leave methane.',
      title: 'Cancelling Several Steps',
      body: 'Each substance that is not in the target has to cancel, and the cards are turned and scaled until it does. Combining carbon’s combustion, two hydrogens’ and methane’s reversed gives −74.8 kJ/mol for forming methane.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-elements-zero',
    title: 'Why Elements Sit at Sea Level',
    prompt: 'Why is the formation value of an element in its standard state exactly zero?',
    briefing: {
      speaker: SPEAKER,
      body: 'The formation of a compound is the making of one mole of it from its elements in their most stable form at 1 bar, and the plate tabulates those values.'
    },
    rigs: [
      {
        id: 'sea-level',
        label: 'Elemental Reference Baseline',
        head: 'hess',
        submode: 'formation',
        targetEq: 'C(s, graphite) + O₂(g) → CO₂(g)',
        reactants: [
          { formula: 'C(s, graphite)', n: 1, dHf: 0 },
          { formula: 'O₂(g)', n: 1, dHf: 0 }
        ],
        products: [{ formula: 'CO₂(g)', n: 1, dHf: -393.5 }]
      }
    ],
    widget: {
      type: 'choice',
      label: 'Reason',
      options: [
        choice('self', 'Making an element from itself involves no change at all'),
        choice('no-bonds', 'Elements such as oxygen and hydrogen contain no bonds'),
        choice('zero-temp', 'Elements have no thermal energy at 298 K')
      ]
    },
    hints: [
      'Read the definition of formation in the briefing, and the values for the elements on the plate.',
      'Ask what you would start from, and what you would end with, if you formed oxygen from its element.',
      'If the starting material and the finished substance are the same, nothing has happened to it.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'self') return { ok: true };
      if (state.choice === 'no-bonds') return { ok: false, msg: 'Oxygen and hydrogen both hold bonds between their atoms, so that cannot be what sets their value.' };
      return { ok: false, msg: 'Every substance at 298 K has thermal energy, and the table measures change from the elements, not total energy.' };
    },
    reward: {
      log: 'The elements are the reference level.',
      title: 'Standard Enthalpy of Formation',
      body: 'The standard enthalpy of formation, ΔH°f, is the heat change to make one mole of a substance from its elements in their standard states. For those elements themselves it is zero, so they are the sea level every other value is measured from.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-products-minus-reactants',
    title: 'Routing a Reaction Through the Elements',
    prompt: 'Use the formation values on the plate to find ΔH for CaCO₃(s) → CaO(s) + CO₂(g).',
    briefing: {
      speaker: SPEAKER,
      body: 'Every compound sits at its formation altitude above the elements, so a reaction can be routed down to the elements and back up.'
    },
    rigs: [
      {
        id: 'lime',
        label: 'Limestone Decomposition',
        head: 'hess',
        submode: 'formation',
        targetEq: 'CaCO₃(s) → CaO(s) + CO₂(g)',
        reactants: [{ formula: 'CaCO₃(s)', n: 1, dHf: FORMATION_TABLE['CaCO3(s)'].dHf }],
        products: [
          { formula: 'CaO(s)', n: 1, dHf: FORMATION_TABLE['CaO(s)'].dHf },
          { formula: 'CO₂(g)', n: 1, dHf: FORMATION_TABLE['CO2(g)'].dHf }
        ]
      }
    ],
    widget: {
      type: 'choice',
      label: 'ΔH (kJ/mol)',
      options: [
        choice('right', '+178.3'),
        choice('flipped', '−178.3'),
        choice('all', '−2235.5'),
        choice('react', '+1206.9')
      ]
    },
    hints: [
      'Read the formation value of each substance on the plate.',
      'Compare the trip down from the reactant to the elements with the trip up to the products.',
      'Add the formation values of the products, then take off the formation values of the reactants.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === 'right') return { ok: true };
      if (state.choice === 'flipped') return { ok: false, msg: 'The sign is backward: the reactants are the trip down to the elements and the products the trip back up.' };
      if (state.choice === 'all') return { ok: false, msg: 'The reactant is unmade rather than made, so its value cannot be added with the same sign as the products.' };
      return { ok: false, msg: 'That is only the trip down; the trip up to the products still has to be added.' };
    },
    reward: {
      log: 'Down to the elements and back up to the products.',
      title: 'Products Less Reactants',
      body: 'Unmaking the reactants runs each formation backwards, and making the products runs each forwards. So ΔH is the formation values of the products minus those of the reactants, which is why limestone needs a kiln’s heat.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-state-function',
    title: 'Why the Route Never Changes the Net Step',
    prompt: 'Carbon reaches carbon dioxide by two routes with the same net ΔH; why does the route not matter?',
    briefing: {
      speaker: SPEAKER,
      body: 'One plate takes carbon to carbon dioxide in a single step, and the other takes it through carbon monoxide.'
    },
    rigs: [
      {
        id: 'routeA',
        label: 'Route A: Direct',
        head: 'hess',
        submode: 'stack',
        targetEq: 'C(s) + O₂(g) → CO₂(g)',
        cards: [{ id: 'a1', eq: 'C(s) + O₂(g) → CO₂(g)', dH: -393.5 }]
      },
      {
        id: 'routeB',
        label: 'Route B: Through CO',
        head: 'hess',
        submode: 'stack',
        targetEq: 'C(s) + O₂(g) → CO₂(g)',
        cards: [
          { id: 'b1', eq: 'C(s) + ½O₂(g) → CO(g)', dH: -110.5 },
          { id: 'b2', eq: 'CO(g) + ½O₂(g) → CO₂(g)', dH: -283.0 }
        ]
      }
    ],
    widget: {
      type: 'choice',
      label: 'Reason',
      options: [
        choice('state-fn', 'Enthalpy depends only on the starting and finishing states'),
        choice('same-speed', 'Both routes run at the same speed'),
        choice('no-interm', 'Carbon monoxide has no enthalpy of its own')
      ]
    },
    hints: [
      'Read the net value at the foot of each plate.',
      'Compare where each route begins and where each route ends.',
      'If a quantity is fixed by where you start and finish, the stops along the way cannot change it.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'state-fn') return { ok: true };
      if (state.choice === 'same-speed') return { ok: false, msg: 'Nothing on the plates says anything about how fast either route runs, and ΔH is not a rate.' };
      return { ok: false, msg: 'Carbon monoxide has a card of its own on route B, and its steps are part of the sum.' };
    },
    reward: {
      log: 'Both routes ended at the same net value.',
      title: 'A State Function',
      body: 'A quantity that depends only on the starting and finishing states, not on the path, is a state function. Enthalpy is one, and that is why Hess’s law works: any route between the same two states gives the same ΔH.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-unknown-formation',
    title: 'Sealed Assay: An Unknown Formation Value',
    prompt: 'Burning carbon monoxide releases the ΔH on the plate; find the formation value of carbon monoxide.',
    briefing: {
      speaker: SPEAKER,
      body: 'The sealed table lists every formation value but one, and the reaction’s own ΔH is given.'
    },
    rigs: [
      {
        id: 'co-unknown',
        label: 'Sealed CO(g) Assay',
        head: 'hess',
        submode: 'formation',
        targetEq: 'CO(g) + ½O₂(g) → CO₂(g)  (ΔH = −283.0 kJ)',
        reactants: [
          { formula: 'CO(g)', n: 1, dHf: '?' },
          { formula: '½ O₂(g)', n: 0.5, dHf: 0 }
        ],
        products: [{ formula: 'CO₂(g)', n: 1, dHf: -393.5 }]
      }
    ],
    widget: {
      type: 'choice',
      label: 'Formation value of CO(g) (kJ/mol)',
      options: [
        choice('right', '−110.5'),
        choice('plus', '+110.5'),
        choice('sum', '−676.5'),
        choice('rxn', '−283.0')
      ]
    },
    hints: [
      'Read the formation values and the reaction’s ΔH on the plate.',
      'Compare the reaction’s ΔH with the products less the reactants, with the unknown left in.',
      'Write products less reactants equal to the reaction’s ΔH and solve for the unknown.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === 'right') return { ok: true };
      if (state.choice === 'plus') return { ok: false, msg: 'The sign is backward: compare where carbon dioxide sits with the drop made by burning carbon monoxide.' };
      if (state.choice === 'sum') return { ok: false, msg: 'The reaction’s ΔH and the products’ value are not added; the reaction’s ΔH equals products less reactants.' };
      return { ok: false, msg: 'That is the reaction’s ΔH, not a formation value; the formation value is measured from the elements.' };
    },
    reward: {
      log: 'The unknown altitude was worked back from a burn.',
      title: 'Working Backwards',
      body: 'A formation value that cannot be measured directly can be found from a reaction that can. Burning carbon monoxide drops 283.0 kJ to carbon dioxide at −393.5, so carbon monoxide sits at −110.5 kJ/mol.'
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
      body: 'Enthalpy is an altitude, so any route between two states gives the same ΔH. Steps can be added, turned round and scaled, and every compound can be placed above the sea level of its elements.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'With a table of formation values you can predict the heat of a reaction nobody has ever run. The table is the whole of thermochemistry in one page.'
    },
    {
      heading: 'Next',
      body: 'The next bench leaves the heat behind and asks why some changes happen on their own at all.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'A → B has ΔH = −50 kJ and B → C has ΔH = +120 kJ. What is ΔH for A → C?',
    options: [
      { id: 'a', label: '+70 kJ' },
      { id: 'b', label: '−70 kJ' },
      { id: 'c', label: '+170 kJ' },
      { id: 'd', label: '−170 kJ' }
    ],
    answer: 'a',
    explanation: 'The steps follow on from each other, so their enthalpy changes add: −50 + 120 = +70 kJ.'
  },
  {
    question: 'N₂ + 2 O₂ → 2 NO₂ has ΔH = +66.4 kJ. What is ΔH for ½N₂ + O₂ → NO₂?',
    options: [
      { id: 'a', label: '+33.2 kJ' },
      { id: 'b', label: '+132.8 kJ' },
      { id: 'c', label: '−33.2 kJ' },
      { id: 'd', label: '+66.4 kJ' }
    ],
    answer: 'a',
    explanation: 'Halving the equation halves its ΔH, so the reaction that makes one NO₂ has half the value.'
  },
  {
    question: 'Which of these has a standard enthalpy of formation of exactly zero?',
    options: [
      { id: 'a', label: 'O₂(g)' },
      { id: 'b', label: 'O(g)' },
      { id: 'c', label: 'CO(g)' },
      { id: 'd', label: 'H₂O(g)' }
    ],
    answer: 'a',
    explanation: 'Oxygen gas is the element in its most stable form, so forming it from itself changes nothing. A lone oxygen atom is not the standard state.'
  },
  {
    question: 'Using ΔH°f(H₂O(l)) = −285.8 kJ/mol, what is ΔH for 2 H₂(g) + O₂(g) → 2 H₂O(l)?',
    options: [
      { id: 'a', label: '−571.6 kJ' },
      { id: 'b', label: '−285.8 kJ' },
      { id: 'c', label: '+571.6 kJ' },
      { id: 'd', label: '0 kJ' }
    ],
    answer: 'a',
    explanation: 'The elements sit at zero, and two moles of liquid water are formed from them, so ΔH is 2 × (−285.8) = −571.6 kJ.'
  },
  {
    question: 'Why does Hess’s law work?',
    options: [
      { id: 'a', label: 'Enthalpy is a state function, so it depends only on the starting and finishing states' },
      { id: 'b', label: 'Every step of a reaction has the same ΔH' },
      { id: 'c', label: 'Intermediate substances always carry no enthalpy' }
    ],
    answer: 'a',
    explanation: 'Because enthalpy depends only on the states at either end, any set of steps joining them must add to the same total.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
export const SOLUTIONS = [
  { choice: 'sum' },
  { choice: 'flip' },
  { choice: 'doubled' },
  { choice: 'right' },
  { choice: 'self' },
  { choice: 'right' },
  { choice: 'state-fn' },
  { choice: 'right' }
];

export const MISSES = [
  { choice: 'diff' },
  { choice: 'noflip' },
  { choice: 'single' },
  { choice: 'unscaled' },
  { choice: 'no-bonds' },
  { choice: 'flipped' },
  { choice: 'same-speed' },
  { choice: 'plus' }
];

export const stateFor = makeStateFor(STAGES);

export function mount(container, ctx) {
  return mountThermo(container, ctx, { STAGES, DEBRIEF, toolNoteFor });
}
