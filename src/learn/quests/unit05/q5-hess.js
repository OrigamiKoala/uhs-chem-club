/**
 * Unit 5 · Bench 5 — Hess's Law and Formation (q5-hess)
 *
 * The separator and its two routes for steam, on the heat kit (`table/kits/heat.js`). The step stack. Reactions that cannot be run in a
 * cup are built from ones that can: each card is a measured step with its own energy change, a card can be turned round or doubled, and
 * the cards that cancel leave the reaction wanted. Four stages and ONE click: the belief that a longer route costs, or gives out, more.
 *
 *   1  PREDICT: carbon to carbon dioxide in one step or through carbon monoxide in two: which route gives out more heat?
 *   2  TEST: build the reaction on two stacks by two routes                -> Hess's law
 *   3  methane from three burning cards (turned round and doubled)        -> (cancelling steps)
 *   4  limestone from the elements, up and down                            -> standard enthalpy of formation
 *
 * THE WRONG MODEL IS ON THE TABLE. "The two-step route gives out more" is a card, and two stacks print their totals side by side: the
 * same figure. The handle is a ledger that does not care about the road: only where you started and where you finished.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  heatTable, eqn, note, stackFixture, selectorFixture, stackRead, dialAt, FORMATION_TABLE
} from '../../table/kits/heat.js';

export const meta = { stageCount: 4 };

export const VOCABULARY = [
  { term: /\bhess's law\b/i, introducedAt: 2 },
  { term: /\bstandard enthalpy of formation\b/i, introducedAt: 4 }
];

/** Moles are Tallow's; the energy of a reaction is the bench before this one. */
export const BUILDS_ON = ['unit01/q6-weigh', 'unit05/q3-enthalpy'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

const QUEST_KEY = 'unit05/q5-hess';
const GUESS_LABEL = { one: '"The one-step route"', two: '"The two-step route"', same: '"Both give out the same"' };

// The species, spelt once, so a card's substance cancels exactly the same substance on another card.
const C = 'C(s)'; const O2 = 'O₂(g)'; const CO = 'CO(g)'; const CO2 = 'CO₂(g)';
const H2 = 'H₂(g)'; const H2O = 'H₂O(l)'; const CH4 = 'CH₄(g)'; const CA = 'Ca(s)'; const CAO = 'CaO(s)'; const CACO3 = 'CaCO₃(s)';

/** Where the loose cards stand, the stack's tray, its readout and the answer dial on every stack stage. */
const CARD_AT = i => ({ x: 25.5, y: 10 + i * 13 });
const STACK_TRAY = { id: 'stack', label: 'The stack', at: { x: 78, y: 33 }, size: { w: 52, h: 52 }, cell: 50, cellH: 13 };
const answer = (options, start, label = 'Net ΔH (kJ/mol)') => selectorFixture('answer', label, { x: 128, y: 48 }, { options, start, w: 44 });
const stackAt = (target, hideSum) => stackFixture('wanted', { x: 128, y: 19 }, { tray: 'stack', target, hideSum, w: 44, h: 30 });

/** A stage whose answer is a number set on the dial after stacking: refuse an empty or mismatched stack by what the stack prints. */
function stackAnswer(state, want) {
  const t = state.table;
  const r = stackRead(t, 'wanted');
  if (r.empty) return { ok: false, notYet: true, msg: 'Stack the cards first.' };
  if (!r.matches) return { ok: false, msg: 'The stack adds up to a different reaction from the one wanted.' };
  const v = dialAt(t, 'answer', 'value');
  if (v === want) return { ok: true };
  return { ok: false, msg: 'The net you set is not the total for the cards in the stack.' };
}

/* ------------------------------------------------------------------
   THE FOUR STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'One Step or Two?',
    // A PREDICT STAGE: the stacks are not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Carbon can burn to carbon dioxide in one step or through carbon monoxide in two: which route gives out more heat?',
    widget,
    table: heatTable({
      pieces: [
        note('one', 'The one-step route', { x: 24, y: 16 }),
        note('two', 'The two-step route', { x: 70, y: 16 }),
        note('same', 'Both give out the same', { x: 116, y: 16 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 70, y: 44 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the three cards and the slot.',
      'Picture the carbon starting in the same place and finishing in the same place by either route.',
      'There is no wrong guess yet; commit to the card you would bet on.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'You have picked the route you would bet on. Next, each route can be built from measured steps and its total read.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-routes',
    title: 'Two Routes, One Total',
    get prompt() {
      const guess = recall(QUEST_KEY);
      return guess && GUESS_LABEL[guess]
        ? `You predicted ${GUESS_LABEL[guess]}: build C(s) + O₂(g) → CO₂(g) on both stacks, by two different routes.`
        : 'Build C(s) + O₂(g) → CO₂(g) on both stacks, by two different routes.';
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
      'Use the three cards and the two stacks.',
      'Compare the total each stack prints, and where each route begins and ends.',
      'If a quantity depends only on where you start and finish, the stops along the way cannot change it.'
    ],
    check(state) {
      const t = state.table;
      const A = stackRead(t, 'routeA'); const B = stackRead(t, 'routeB');
      if (A.empty || B.empty) return { ok: false, notYet: true, msg: 'Stack cards on both routes.' };
      if (!A.matches) return { ok: false, msg: 'Route A adds up to a different reaction from the one wanted.' };
      if (!B.matches) return { ok: false, msg: 'Route B adds up to a different reaction from the one wanted.' };
      const ids = r => r.cards.map(c => c.id).sort().join(',');
      if (ids(A) === ids(B)) return { ok: false, msg: 'Both routes hold the same cards.' };
      return { ok: true };
    },
    get reward() {
      const guess = recall(QUEST_KEY);
      const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 'same'
        ? 'You predicted this, and both stacks agreed. '
        : 'Both stacks printed the same total, which did not match your bet. ';
      return {
        log: 'Both routes ended at the same total.',
        title: 'Hess\'s Law',
        body: `${verdict}However many steps the carbon took, the heat came to the same −393.5 kJ. The heat of a reaction depends only on where it starts and where it finishes, never on the route, which is Hess's law.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-methane',
    title: 'Building Methane',
    prompt: 'Make the stack add up to C(s) + 2 H₂(g) → CH₄(g), then set its net ΔH.',
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
      'Use the three cards, the stack and the answer dial, and pick a card up for "Flip" and "Larger".',
      'Compare the target equation with what each card makes and uses, one substance at a time.',
      'Turn or double cards until carbon dioxide, water and oxygen all cancel, then add the cards as they stand.'
    ],
    check(state) { return stackAnswer(state, 1); },
    reward: {
      log: 'Three cards cancelled to leave methane.',
      title: 'Cancelling Steps',
      body: 'Every substance that is not in the target has to cancel, so cards are turned round and doubled until it does. Burning carbon, burning two hydrogens and running the methane card backwards leaves −74.8 kJ for building methane, a reaction no cup could run.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-formation',
    title: 'Down to the Elements and Back',
    prompt: 'Make the stack add up to CaCO₃(s) → CaO(s) + CO₂(g) from the formation steps, then set its net ΔH.',
    widget,
    table: heatTable({
      pieces: [
        eqn('f1', CARD_AT(0), [[1, CA], [1, C], [1.5, O2]], [[1, CACO3]], FORMATION_TABLE['CaCO3(s)'].dHf),
        eqn('f2', CARD_AT(1), [[1, CA], [0.5, O2]], [[1, CAO]], FORMATION_TABLE['CaO(s)'].dHf),
        eqn('f3', CARD_AT(2), [[1, C], [1, O2]], [[1, CO2]], FORMATION_TABLE['CO2(g)'].dHf)
      ],
      fixtures: [stackAt({ lhs: [[1, CACO3]], rhs: [[1, CAO], [1, CO2]] }, true), answer(['+178.3', '−178.3', '−2235.5', '+1206.9'], 3)],
      zones: { trays: [STACK_TRAY] }
    }),
    hints: [
      'Use the three formation cards, the stack and the answer dial, and pick a card up for "Flip".',
      'Compare the trip down from the reactant to the elements with the trip up to the products.',
      'Turn the reactant\'s card round so it is unmade, then add the three cards.'
    ],
    check(state) { return stackAnswer(state, 1); },
    reward: {
      log: 'Down to the elements and back up to the products.',
      title: 'Products Less Reactants',
      body: 'The heat to make one mole of a substance from its elements is its standard enthalpy of formation, and the elements themselves sit at zero, like sea level. A reaction is then the formation values of its products minus those of its reactants, which is why limestone needs heat to split.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the card you choose into the slot.'],
  2: ['Drag cards into the two stacks.'],
  3: ['Drag cards into the stack; pick one up for Flip or Larger.'],
  4: ['Drag cards into the stack; pick one up for Flip.']
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
      body: 'The heat of a reaction depends only on where it starts and where it finishes, so steps can be added, turned round and doubled, and a reaction nobody can run can still be worked out from ones that were measured. Measured from the elements, every compound sits at a height of its own.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'With a table of formation values you can predict the heat of a reaction nobody has ever run, and check a stranger\'s claim about one against the same ledger.'
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
  [put('same', 'slot:guess')],
  [put('a1', 'tray:routeA'), put('b1', 'tray:routeB'), put('b2', 'tray:routeB')],
  [...stack('c1', 'c2', 'c3'), scale('c2', 2), { flip: 'c3' }, dial('answer', 'value', 1)],
  [...stack('f1', 'f2', 'f3'), { flip: 'f1' }, dial('answer', 'value', 1)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('a1', 'tray:routeA'), put('b1', 'tray:routeB')],
  [...stack('c1', 'c2', 'c3'), dial('answer', 'value', 2)],
  [...stack('f1', 'f2', 'f3'), dial('answer', 'value', 2)]
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
