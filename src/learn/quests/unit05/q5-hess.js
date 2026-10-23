/**
 * Unit 5 · Bench 5 — Hess's Law and Formation (q5-hess)
 *
 * The separator and its two routes for steam, and Ember Reach's fifth TABLETOP (plan `bench-tabletop.md`, phase T6), on the heat kit
 * (`table/kits/heat.js`). The step stack. Reactions that cannot be run in a cup are built from ones that can: each card is a measured
 * step with its own ΔH, a card can be turned round or scaled, and the cards that cancel leave the reaction wanted. Then the same idea
 * is run from the elements, where every compound has an altitude of its own.
 *
 *   1  two steps added                               -> Hess's law
 *   2  a step turned round to put CO on the product side   -> (turned, and the sign flips)
 *   3  a step doubled to cancel two NO               -> (scaled, and the ΔH scales)
 *   4  three cards cancelled into methane            -> (several corrections at once)
 *   5  why an element's value is nothing             -> standard enthalpy of formation
 *   6  products from elements, less reactants        -> (ΔH is products less reactants)
 *   7  two routes with one result                    -> state function
 *   8  an unknown formation value                    -> (worked back from a combustion)
 *
 * THE EVIDENCE IS ON THE BENCH. A stack that asks for a net hides its own ΔH (`hideSum`) but always prints the equation it adds up
 * to, so cancelling is seen; a card turned round or doubled shows its new equation and its new ΔH, so the player adds the cards as they
 * stand. The formation table never carries a note that does the sum, and the one unknown value on stage 8 is printed as "?".
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  heatTable, eqn, markCard, stackFixture, selectorFixture, plaqueFixture, stackRead, dialAt, markerRead, FORMATION_TABLE
} from '../../table/kits/heat.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bhess/i, introducedAt: 1 },
  { term: /\bstandard enthalpy of formation\b/i, introducedAt: 5 },
  { term: /\bstate function\b/i, introducedAt: 7 }
];

/** The sign of a ΔH and the idea of a bond's energy come from the benches before. */
export const BUILDS_ON = ['unit01/q6-weigh'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

// The species, spelt once, so a card's substance cancels exactly the same substance on another card.
const C = 'C(s)'; const O2 = 'O₂(g)'; const CO = 'CO(g)'; const CO2 = 'CO₂(g)'; const N2 = 'N₂(g)'; const NO = 'NO(g)'; const NO2 = 'NO₂(g)';
const H2 = 'H₂(g)'; const H2O = 'H₂O(l)'; const CH4 = 'CH₄(g)'; const CA = 'Ca(s)'; const CAO = 'CaO(s)'; const CACO3 = 'CaCO₃(s)';

/** Where the loose cards stand, the stack's tray, its readout and the answer dial on every stack stage. */
const CARD_AT = i => ({ x: 25.5, y: 10 + i * 13 });
const STACK_TRAY = { id: 'stack', label: 'The stack', at: { x: 78, y: 33 }, size: { w: 52, h: 52 }, cell: 50, cellH: 13 };
const answer = (options, start, label = 'Net ΔH (kJ/mol)') => selectorFixture('answer', label, { x: 128, y: 48 }, { options, start, w: 44 });
const stackAt = (target, hideSum) => stackFixture('wanted', { x: 128, y: 19 }, { tray: 'stack', target, hideSum, w: 44, h: 30 });

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-stack-two',
    title: 'Two Steps Down the Same Ladder',
    prompt: 'Make the stack add up to C(s) + O₂(g) → CO₂(g), then set its net ΔH.',
    briefing: {
      speaker: SPEAKER,
      body: 'Each card is a reaction someone has already measured, and the stack adds the cards that lie in its tray. Press Submit when the table shows your answer.'
    },
    widget,
    table: heatTable({
      pieces: [
        eqn('c1', CARD_AT(0), [[1, C], [0.5, O2]], [[1, CO]], -110.5),
        eqn('c2', CARD_AT(1), [[1, CO], [0.5, O2]], [[1, CO2]], -283.0)
      ],
      fixtures: [stackAt({ lhs: [[1, C], [1, O2]], rhs: [[1, CO2]] }, true), answer(['−393.5', '−172.5', '+393.5', '−110.5'], 4)],
      zones: { trays: [STACK_TRAY] }
    }),
    hints: [
      'Drag both cards into the stack and read the equation the stack adds up to.',
      'Compare what the first card makes with what the second card uses.',
      'The substance made by one step and used by the next cancels, so the steps\' enthalpy changes simply add.'
    ],
    check(state) {
      const v = dialAt(state.table, 'answer', 'value');
      if (v === 1) return { ok: true };
      if (v === 4) return { ok: false, notYet: true, msg: 'Stack the cards, add their ΔH values, and set the net.' };
      if (v === 2) return { ok: false, msg: 'Both steps follow the road to the target in the same direction, so neither should be taken off the other.' };
      if (v === 3) return { ok: false, msg: 'Both cards fall, so the total cannot rise.' };
      return { ok: false, msg: 'That is only the first step; the target needs the second as well.' };
    },
    reward: {
      log: 'The two steps added up to the whole.',
      title: 'Hess\'s Law',
      body: 'When a reaction is the sum of several steps, its ΔH is the sum of their ΔH values. This is Hess\'s law, and it lets a reaction nobody can run cleanly be built from ones that can be.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-flip-one',
    title: 'Turning a Step Round',
    prompt: 'Make the stack add up to C(s) + ½O₂(g) → CO(g), then set its net ΔH.',
    widget,
    table: heatTable({
      pieces: [
        eqn('c1', CARD_AT(0), [[1, C], [1, O2]], [[1, CO2]], -393.5),
        eqn('c2', CARD_AT(1), [[1, CO], [0.5, O2]], [[1, CO2]], -283.0)
      ],
      fixtures: [stackAt({ lhs: [[1, C], [0.5, O2]], rhs: [[1, CO]] }, true), answer(['−110.5', '−676.5', '+110.5', '−283.0'], 4)],
      zones: { trays: [STACK_TRAY] }
    }),
    hints: [
      'Pick up a card, press Flip, and watch its equation and its ΔH change.',
      'Compare the target equation with the side each card puts carbon monoxide on.',
      'A card turned round has the opposite sign, and after that the cards add.'
    ],
    check(state) {
      const v = dialAt(state.table, 'answer', 'value');
      if (v === 1) return { ok: true };
      if (v === 4) return { ok: false, notYet: true, msg: 'Stack the cards, turning one round if you need to, and set the net.' };
      if (v === 2) return { ok: false, msg: 'Added as printed, the second card leaves carbon dioxide on the wrong side of the equation.' };
      if (v === 3) return { ok: false, msg: 'The sign is backward: check which of the two cards had to be turned round and what that does to it.' };
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
    prompt: 'Make the stack add up to N₂(g) + 2 O₂(g) → 2 NO₂(g), then set its net ΔH.',
    briefing: {
      speaker: SPEAKER,
      body: 'Nitric oxide is only an intermediate here, so none of it may be left over once the cards are added.'
    },
    widget,
    table: heatTable({
      pieces: [
        eqn('c1', CARD_AT(0), [[1, N2], [1, O2]], [[2, NO]], 180.6),
        eqn('c2', CARD_AT(1), [[1, NO], [0.5, O2]], [[1, NO2]], -57.1)
      ],
      fixtures: [stackAt({ lhs: [[1, N2], [2, O2]], rhs: [[2, NO2]] }, true), answer(['+66.4', '+123.5', '−66.4', '+180.6'], 2)],
      zones: { trays: [STACK_TRAY] }
    }),
    hints: [
      'Pick up a card and press Larger or Smaller, and watch its equation and its ΔH change.',
      'Compare the nitric oxide the first card makes with the nitric oxide the second card uses.',
      'Scale the card that uses too little by the factor that makes the two amounts match, then add the cards.'
    ],
    check(state) {
      const v = dialAt(state.table, 'answer', 'value');
      if (v === 1) return { ok: true };
      if (v === 2) return { ok: false, msg: 'Added as printed, the cards leave nitric oxide over; the second card must be scaled until none is.' };
      if (v === 3) return { ok: false, msg: 'The sign is backward: the first card rises and the second falls, and the first is the larger.' };
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
    prompt: 'Make the stack add up to C(s) + 2 H₂(g) → CH₄(g), then set its net ΔH.',
    briefing: {
      speaker: SPEAKER,
      body: 'Methane is hard to build directly, but burning carbon, hydrogen and methane are all easy to measure.'
    },
    widget,
    table: heatTable({
      pieces: [
        eqn('c1', CARD_AT(0), [[1, C], [1, O2]], [[1, CO2]], -393.5),
        eqn('c2', CARD_AT(1), [[1, H2], [0.5, O2]], [[1, H2O]], -285.8),
        eqn('c3', CARD_AT(2), [[1, CH4], [2, O2]], [[1, CO2], [2, H2O]], -890.3)
      ],
      fixtures: [stackAt({ lhs: [[1, C], [2, H2]], rhs: [[1, CH4]] }, true), answer(['−74.8', '+211.0', '−1855.4', '+74.8'], 4)],
      zones: { trays: [STACK_TRAY] }
    }),
    hints: [
      'Compare the target equation with what each card makes and uses, one substance at a time.',
      'Turn or scale the cards until carbon dioxide, water and oxygen all cancel in the stack\'s equation.',
      'Add the three cards as they stand once nothing is left over but the target\'s own substances.'
    ],
    check(state) {
      const v = dialAt(state.table, 'answer', 'value');
      if (v === 1) return { ok: true };
      if (v === 4) return { ok: false, notYet: true, msg: 'Stack the cards, turned or scaled to cancel, and set the net.' };
      if (v === 2) return { ok: false, msg: 'With a single hydrogen card, one hydrogen molecule is still missing from the target\'s left side.' };
      if (v === 3) return { ok: false, msg: 'Methane must end up on the product side, which the methane card as printed does not do.' };
      return { ok: false, msg: 'The sign is backward: add the cards as they stand, with each turned or scaled card carrying its new value.' };
    },
    reward: {
      log: 'Three cards cancelled to leave methane.',
      title: 'Cancelling Several Steps',
      body: 'Each substance that is not in the target has to cancel, and the cards are turned and scaled until it does. Combining carbon\'s combustion, two hydrogens\' and methane\'s reversed gives −74.8 kJ/mol for forming methane.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-elements-zero',
    title: 'Why Elements Sit at Sea Level',
    prompt: 'Mark the statement that explains why the formation value of an element in its standard state is exactly zero.',
    briefing: {
      speaker: SPEAKER,
      body: 'The formation of a compound is the making of one mole of it from its elements in their most stable form at 1 bar, and the plaque lists those values.'
    },
    widget,
    table: heatTable({
      pieces: [
        markCard('self', 'Making an element from itself involves no change at all', { x: 124, y: 12 }),
        markCard('nobonds', 'Elements such as oxygen and hydrogen contain no bonds', { x: 124, y: 30 }),
        markCard('nothermal', 'Elements have no thermal energy at 298 K', { x: 124, y: 48 })
      ],
      fixtures: [plaqueFixture('values', 'Formation values, kJ/mol', { x: 40, y: 26 }, ['C(s, graphite)    0', 'O₂(g)    0', 'H₂(g)    0', 'CO₂(g)    −393.5', 'H₂O(l)    −285.8'], { w: 66 })]
    }),
    hints: [
      'Tap a statement to mark it, and tap it again to take the mark off.',
      'Ask what you would start from, and what you would end with, if you formed oxygen from its element.',
      'If the starting material and the finished substance are the same, nothing has happened to it.'
    ],
    check(state) {
      const t = state.table;
      const marked = ['self', 'nobonds', 'nothermal'].filter(id => t.pieces[id].props.flipped);
      if (!marked.length) return { ok: false, notYet: true, msg: 'Mark the statement that explains it.' };
      if (marked.length === 1 && marked[0] === 'self') return { ok: true };
      if (marked.includes('nobonds')) return { ok: false, msg: 'Oxygen and hydrogen both hold bonds between their atoms, so that cannot be what sets their value.' };
      if (marked.includes('nothermal')) return { ok: false, msg: 'Every substance at 298 K has thermal energy, and the table measures change from the elements, not total energy.' };
      return { ok: false, msg: 'Mark only the one statement that explains it.' };
    },
    reward: {
      log: 'The elements are the reference level.',
      title: 'Standard Enthalpy of Formation',
      body: 'The standard enthalpy of formation, ΔH°f, is the heat change to make one mole of a substance from its elements in their standard states. For those elements themselves it is zero, so they are the sea level every other compound is measured from.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-products-minus-reactants',
    title: 'Routing a Reaction Through the Elements',
    prompt: 'Make the stack add up to CaCO₃(s) → CaO(s) + CO₂(g) from the formation steps, then set its net ΔH.',
    briefing: {
      speaker: SPEAKER,
      body: 'Every compound sits at its formation altitude above the elements, so a reaction can be routed down to the elements and back up.'
    },
    widget,
    table: heatTable({
      pieces: [
        eqn('f1', CARD_AT(0), [[1, CA], [1, C], [1.5, O2]], [[1, CACO3]], FORMATION_TABLE['CaCO3(s)'].dHf),
        eqn('f2', CARD_AT(1), [[1, CA], [0.5, O2]], [[1, CAO]], FORMATION_TABLE['CaO(s)'].dHf),
        eqn('f3', CARD_AT(2), [[1, C], [1, O2]], [[1, CO2]], FORMATION_TABLE['CO2(g)'].dHf)
      ],
      fixtures: [stackAt({ lhs: [[1, CACO3]], rhs: [[1, CAO], [1, CO2]] }, true), answer(['+178.3', '−178.3', '−2235.5', '+1206.9'], 2)],
      zones: { trays: [STACK_TRAY] }
    }),
    hints: [
      'Read the formation value on each card, and turn a card round to unmake what it makes.',
      'Compare the trip down from the reactant to the elements with the trip up to the products.',
      'Add the formation values of the products, then take off the formation values of the reactants.'
    ],
    check(state) {
      const v = dialAt(state.table, 'answer', 'value');
      if (v === 1) return { ok: true };
      if (v === 2) return { ok: false, msg: 'The sign is backward: the reactants are the trip down to the elements and the products the trip back up.' };
      if (v === 3) return { ok: false, msg: 'The reactant is unmade rather than made, so its value cannot be added with the same sign as the products.' };
      return { ok: false, msg: 'That is only the trip down; the trip up to the products still has to be added.' };
    },
    reward: {
      log: 'Down to the elements and back up to the products.',
      title: 'Products Less Reactants',
      body: 'Unmaking the reactants runs each formation backwards, and making the products runs each forwards. So ΔH is the formation values of the products minus those of the reactants, which is why limestone needs heat to split.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-state-function',
    title: 'Why the Route Never Changes the Net Step',
    prompt: 'Build C(s) + O₂(g) → CO₂(g) on both stacks, by two different routes.',
    briefing: {
      speaker: SPEAKER,
      body: 'One stack takes carbon to carbon dioxide in a single step, and the other can take it through carbon monoxide.'
    },
    widget,
    table: (() => {
      const target = { lhs: [[1, C], [1, O2]], rhs: [[1, CO2]] };
      return heatTable({
        pieces: [
          eqn('a1', CARD_AT(0), [[1, C], [1, O2]], [[1, CO2]], -393.5),
          eqn('b1', CARD_AT(1), [[1, C], [0.5, O2]], [[1, CO]], -110.5),
          eqn('b2', CARD_AT(2), [[1, CO], [0.5, O2]], [[1, CO2]], -283.0)
        ],
        fixtures: [
          stackFixture('routeA', { x: 128, y: 17 }, { tray: 'routeA', target, hideSum: false, w: 44, h: 27, title: 'Route A' }),
          stackFixture('routeB', { x: 128, y: 46 }, { tray: 'routeB', target, hideSum: false, w: 44, h: 27, title: 'Route B' })
        ],
        zones: {
          trays: [
            { id: 'routeA', label: 'Route A', at: { x: 78, y: 17 }, size: { w: 52, h: 14 }, cell: 50, cellH: 13 },
            { id: 'routeB', label: 'Route B', at: { x: 78, y: 47 }, size: { w: 52, h: 27 }, cell: 50, cellH: 13 }
          ]
        }
      });
    })(),
    hints: [
      'Drag cards into a stack and read the equation and the ΔH it prints.',
      'Compare where each route begins and where each route ends, and the ΔH each prints.',
      'If a quantity is fixed by where you start and finish, the stops along the way cannot change it.'
    ],
    check(state) {
      const t = state.table;
      const A = stackRead(t, 'routeA'); const B = stackRead(t, 'routeB');
      if (A.empty || B.empty) return { ok: false, notYet: true, msg: 'Stack cards on both routes.' };
      if (!A.matches || !B.matches) return { ok: false, msg: 'A stack must add up to the reaction wanted: read the equation it prints under the one wanted.' };
      const ids = r => r.cards.map(c => c.id).sort().join(',');
      if (ids(A) === ids(B)) return { ok: false, msg: 'Those are the same cards: build the second stack by a different route.' };
      return { ok: true };
    },
    reward: {
      log: 'Both routes ended at the same net value.',
      title: 'A State Function',
      body: 'A quantity that depends only on the starting and finishing states, not on the path, is a state function. Enthalpy is one, and that is why Hess\'s law works: any route between the same two states gives the same ΔH.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-unknown-formation',
    title: 'Sealed Assay: An Unknown Formation Value',
    prompt: 'Burning carbon monoxide releases the ΔH on the plaque; set the formation value of carbon monoxide.',
    briefing: {
      speaker: SPEAKER,
      body: 'The sealed table lists every formation value but one, and the reaction\'s own ΔH is given.'
    },
    widget,
    table: heatTable({
      fixtures: [
        plaqueFixture('sealed', 'Sealed assay, kJ/mol', { x: 48, y: 28 }, ['CO(g) + ½O₂(g) → CO₂(g)    ΔH = −283.0', 'Formation values:', '  CO(g)    ?', '  O₂(g)    0', '  CO₂(g)    −393.5'], { w: 82 }),
        selectorFixture('answer', 'Formation value of CO(g)', { x: 124, y: 28 }, { options: ['−110.5', '+110.5', '−676.5', '−283.0'], start: 4, w: 44 })
      ]
    }),
    hints: [
      'Read the formation values and the reaction\'s ΔH on the plaque.',
      'Compare the reaction\'s ΔH with the products less the reactants, with the unknown left in.',
      'Write products less reactants equal to the reaction\'s ΔH and solve for the unknown.'
    ],
    check(state) {
      const v = dialAt(state.table, 'answer', 'value');
      if (v === 1) return { ok: true };
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the formation value you worked out.' };
      if (v === 2) return { ok: false, msg: 'The sign is backward: compare where carbon dioxide sits with the drop made by burning carbon monoxide.' };
      if (v === 3) return { ok: false, msg: 'The reaction\'s ΔH and the products\' value are not added; the reaction\'s ΔH equals products less reactants.' };
      return { ok: false, msg: 'That is the reaction\'s ΔH, not a formation value; the formation value is measured from the elements.' };
    },
    reward: {
      log: 'The unknown altitude was worked back from a burn.',
      title: 'Working Backwards',
      body: 'A formation value that cannot be measured directly can be found from a reaction that can. Burning carbon monoxide drops 283.0 kJ to carbon dioxide at −393.5, so carbon monoxide sits at −110.5 kJ/mol.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag cards into the stack.'],
  2: ['Drag cards into the stack; pick one up and press Flip.'],
  3: ['Drag cards into the stack; pick one up and press Larger.'],
  4: ['Drag cards into the stack; Flip and Larger change a card.'],
  5: ['Tap a statement to mark it.'],
  6: ['Drag cards into the stack; Flip turns one round.'],
  7: ['Drag cards into the two stacks.'],
  8: ['Turn the dial to the value you worked out.']
};
applyNotes(STAGES, NOTES);

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
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const stack = (...ids) => ids.map(id => put(id, 'tray:stack'));
const scale = (piece, factor) => ({ scale: { piece, factor } });

export const SOLUTIONS = [
  [...stack('c1', 'c2'), dial('answer', 'value', 1)],
  [...stack('c1', 'c2'), { flip: 'c2' }, dial('answer', 'value', 1)],
  [...stack('c1', 'c2'), scale('c2', 2), dial('answer', 'value', 1)],
  [...stack('c1', 'c2', 'c3'), scale('c2', 2), { flip: 'c3' }, dial('answer', 'value', 1)],
  [{ flip: 'self' }],
  [...stack('f1', 'f2', 'f3'), { flip: 'f1' }, dial('answer', 'value', 1)],
  [put('a1', 'tray:routeA'), put('b1', 'tray:routeB'), put('b2', 'tray:routeB')],
  [dial('answer', 'value', 1)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...stack('c1', 'c2'), dial('answer', 'value', 2)],
  [...stack('c1', 'c2'), dial('answer', 'value', 2)],
  [...stack('c1', 'c2'), dial('answer', 'value', 2)],
  [...stack('c1', 'c2', 'c3'), dial('answer', 'value', 2)],
  [{ flip: 'nobonds' }],
  [...stack('f1', 'f2', 'f3'), dial('answer', 'value', 2)],
  [put('a1', 'tray:routeA'), put('b1', 'tray:routeB')],
  [dial('answer', 'value', 2)]
];

function blankState() { return {}; }

/** Build a full bench state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the planners. */
export { stackRead };
