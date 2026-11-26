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
import {
  heatTable, eqn, note, leadFixture, stackFixture, stackRead, FORMATION_TABLE
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
/** The stack with its energy ladder (hideSum hides the live ΔH total on puzzle stages until Submit). */
const stackAt = (target, ladder) => stackFixture('wanted', { x: 128, y: 27 }, { tray: 'stack', target, hideSum: true, w: 44, h: 44, ladder });

/** A stage whose answer is the stack itself: refuse an empty or mismatched stack by what the stack prints. */
function stackAnswer(state) {
  const t = state.table;
  const r = stackRead(t, 'wanted');
  if (r.empty) return { ok: false, notYet: true, msg: 'Add cards to the stack first.' };
  if (r.matches) return { ok: true };
  return { ok: false, msg: 'Your stack adds up to a different reaction than the target; compare both reactions substance by substance.' };
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
    prompt: 'Carbon can burn to CO₂ in one step or via CO in two steps: which route releases more total heat?',
    widget,
    table: heatTable({
      pieces: [
        note('one', 'The one-step route', { x: 24, y: 16 }),
        note('two', 'The two-step route', { x: 70, y: 16 }),
        note('same', 'Both release the same', { x: 116, y: 16 })
      ],
      fixtures: [leadFixture('lead', { x: 36, y: 44 }, { scene: 'routes', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 114, y: 46 }, size: { w: 48, h: 20 } }] }
    }),
    hints: [
      'Watch the clip: one route goes straight from carbon to CO₂, while the other stops at CO first.',
      'Notice that both routes start with the exact same carbon and oxygen and finish with the same CO₂.',
      'Think of walking between two floors: does taking one long staircase or two short ones change your total height climbed?'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction recorded.',
      title: 'Hypothesis Recorded',
      body: 'Your prediction for the two routes is saved. Test it on the bench.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-routes',
    title: 'Two Routes, One Total',
    briefing: {
      speaker: SPEAKER,
      body: [
        'Each card is a measured step with its ΔH; (s) marks a solid and (g) a gas.',
        'Stacking cards adds their reactions, canceling any substance produced in one step and consumed in another.',
        'The energy ladder beside each stack moves up or down by each card\'s ΔH.'
      ]
    },
    prompt: 'Build both routes to CO₂: does burning carbon in two steps release the same heat as one?',
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
          stackFixture('routeA', { x: 128, y: 17 }, { tray: 'routeA', target, hideSum: false, w: 44, h: 27, title: 'Route A', ladder: { lo: -420, hi: 30 } }),
          stackFixture('routeB', { x: 128, y: 46 }, { tray: 'routeB', target, hideSum: false, w: 44, h: 27, title: 'Route B', ladder: { lo: -420, hi: 30 } })
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
      'Check the reactants and products on each card against the target reaction at the top of both stacks.',
      'Place the one-step card in Route A and the two CO-pathway cards in Route B so CO cancels out.',
      'Compare the two energy ladders: both routes connect the same reactants to the same product.'
    ],
    check(state) {
      const t = state.table;
      const A = stackRead(t, 'routeA'); const B = stackRead(t, 'routeB');
      if (A.empty || B.empty) return { ok: false, notYet: true, msg: 'Add cards to both routes.' };
      if (!A.matches) return { ok: false, msg: 'Route A does not add up to the target reaction yet.' };
      if (!B.matches) return { ok: false, msg: 'Route B does not add up to the target reaction yet.' };
      const ids = r => r.cards.map(c => c.id).sort().join(',');
      if (ids(A) === ids(B)) return { ok: false, msg: 'Both routes have the same cards.' };
      return { ok: true };
    },
    reward: {
      log: 'Both routes ended at the same total.',
      title: 'Hess\'s Law',
      body: 'Both routes released 393.5 kJ and ended at the exact same level. A reaction\'s total enthalpy change depends only on its start and end, never the steps in between: this is Hess\'s law.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-methane',
    title: 'Building Methane',
    briefing: { speaker: SPEAKER, body: 'Tap any card to Flip it (reversing its arrow and ΔH sign) or press Larger to double it. Using Hess\'s law, we can combine known steps to find an unmeasured reaction.' },
    prompt: 'Which steps, flipped or doubled as needed, add up to C(s) + 2 H₂(g) → CH₄(g)?',
    widget,
    table: heatTable({
      pieces: [
        eqn('c1', CARD_AT(0), [[1, C], [1, O2]], [[1, CO2]], -393.5),
        eqn('c2', CARD_AT(1), [[1, H2], [0.5, O2]], [[1, H2O]], -285.8),
        eqn('c3', CARD_AT(2), [[1, CH4], [2, O2]], [[1, CO2], [2, H2O]], -890.3)
      ],
      fixtures: [stackAt({ lhs: [[1, C], [2, H2]], rhs: [[1, CH4]] }, { lo: -1900, hi: 900 })],
      zones: { trays: [STACK_TRAY] }
    }),
    hints: [
      'Compare the target reaction at the top with the combined reaction printed below it.',
      'Spot any substance that is on the wrong side of the arrow, or has the wrong coefficient.',
      'Flip a card to move a substance to the opposite side, and press Larger to double its amounts.'
    ],
    check(state) { return stackAnswer(state); },
    reward: {
      log: 'Three cards canceled to leave methane.',
      title: 'Canceling Steps',
      body: 'Flipping the methane card changed its ΔH from −890.3 kJ to +890.3 kJ, and doubling the hydrogen card doubled its ΔH. CO₂ and H₂O canceled out, leaving ΔH = −74.8 kJ.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-formation',
    title: 'Down to the Elements and Back',
    briefing: { speaker: SPEAKER, body: 'The standard enthalpy of formation of a compound is ΔH for forming one mole of it from its pure elements (like carbon and oxygen).' },
    prompt: 'Which formation steps, flipped as needed, add up to CaCO₃(s) → CaO(s) + CO₂(g)?',
    widget,
    table: heatTable({
      pieces: [
        eqn('f1', CARD_AT(0), [[1, CA], [1, C], [1.5, O2]], [[1, CACO3]], FORMATION_TABLE['CaCO3(s)'].dHf),
        eqn('f2', CARD_AT(1), [[1, CA], [0.5, O2]], [[1, CAO]], FORMATION_TABLE['CaO(s)'].dHf),
        eqn('f3', CARD_AT(2), [[1, C], [1, O2]], [[1, CO2]], FORMATION_TABLE['CO2(g)'].dHf)
      ],
      fixtures: [stackAt({ lhs: [[1, CACO3]], rhs: [[1, CAO], [1, CO2]] }, { lo: -2300, hi: 1300 })],
      zones: { trays: [STACK_TRAY] }
    }),
    hints: [
      'Compare the target reaction at the top with the combined reaction printed below it.',
      'Check which substance appears on the wrong side of the arrow compared to the target.',
      'A reactant must be broken down into its elements, which is its formation step run in reverse.'
    ],
    check(state) { return stackAnswer(state); },
    reward: {
      log: 'Broken down to elements and rebuilt into CaO and CO₂.',
      title: 'Formation Steps',
      body: 'The stack broke CaCO₃ into its elements and built CaO and CO₂ from them, giving ΔH = +178.3 kJ. Overall, ΔH equals the standard enthalpy of formation of products minus reactants.'
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
      body: 'By Hess\'s law, a reaction\'s enthalpy change is the same no matter which steps it takes, so you can combine measured reactions to find an unmeasured one. Using formation enthalpies, ΔH always equals products minus reactants.'
    }
  ]
};

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
  [...stack('c1', 'c2', 'c3'), scale('c2', 2), { flip: 'c3' }],
  [...stack('f1', 'f2', 'f3'), { flip: 'f1' }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('a1', 'tray:routeA'), put('b1', 'tray:routeB')],
  [...stack('c1', 'c2', 'c3'), { flip: 'c3' }],
  [...stack('f1', 'f2', 'f3')]
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
    onLoad(r) {
      if (r.index === 1) {
        const g = recall(QUEST_KEY);
        if (g && GUESS_LABEL[g]) r.frame.note(`You predicted: ${GUESS_LABEL[g]}. Test both routes on the bench.`);
      }
    }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the planners. */
export { stackRead };
