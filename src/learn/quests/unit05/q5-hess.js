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
/** The stack with its energy ladder. The stack prints its own total: building it right is the whole answer. */
const stackAt = (target, ladder) => stackFixture('wanted', { x: 128, y: 27 }, { tray: 'stack', target, hideSum: false, w: 44, h: 44, ladder });

/** A stage whose answer is the stack itself: refuse an empty or mismatched stack by what the stack prints. */
function stackAnswer(state) {
  const t = state.table;
  const r = stackRead(t, 'wanted');
  if (r.empty) return { ok: false, notYet: true, msg: 'Stack the cards first.' };
  if (r.matches) return { ok: true };
  return { ok: false, msg: 'The stack adds up to a different reaction from the one wanted: compare the two reactions printed on it, one substance at a time.' };
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
      fixtures: [leadFixture('lead', { x: 36, y: 44 }, { scene: 'react', w: 62, h: 30, lhs: [[1, 'C'], [1, 'O₂']], rhs: [[1, 'CO₂']] })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 118, y: 46 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Watch the clip: carbon and oxygen join to make carbon dioxide.',
      'Both routes start with carbon and oxygen, and both end with carbon dioxide.',
      'Think about climbing between two floors by one long staircase or by two short ones.'
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
      log: 'Prediction recorded.',
      title: 'Hypothesis Recorded',
      body: 'Your prediction for the two routes is recorded. Test it on the bench.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-routes',
    title: 'Two Routes, One Total',
    briefing: { speaker: SPEAKER, body: 'Each card is one measured step with its ΔH, where (s) marks a solid and (g) a gas. A stack adds its cards: a substance made by one card and used up by another cancels, and the energy ladder beside the stack steps down or up by the ΔH of each card.' },
    prompt: 'Does burning carbon in two steps give out the same heat as burning it in one?',
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
      'Read what each card uses up and what it makes, and the reaction printed at the top of both stacks.',
      'Compare the ΔH each stack prints, and where each energy ladder ends.',
      'Both routes start with the same substances and end with the same substance, so think about what that means for the energy between them.'
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
    reward: {
      log: 'Both routes ended at the same total.',
      title: 'Hess\'s Law',
      body: 'Both routes gave out 393.5 kJ, and both ladders ended at the same level. The heat of a reaction is the same whichever steps it takes: this is Hess\'s law.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-methane',
    title: 'Building Methane',
    briefing: { speaker: SPEAKER, body: 'A step run backwards has the opposite ΔH, and a step doubled has double the ΔH. With Hess\'s law, steps like these add up to the ΔH of a reaction nobody has measured directly.' },
    prompt: 'Which steps, flipped or made larger as needed, add up to C(s) + 2 H₂(g) → CH₄(g)?',
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
      'Compare the reaction wanted with the reaction the stack prints under it.',
      'Find a substance that the stack has on the wrong side of the arrow, or has too few of.',
      'A card with a wanted substance on the wrong side has to run backwards, and a card that supplies too little has to be made larger.'
    ],
    check(state) { return stackAnswer(state); },
    reward: {
      log: 'Three cards cancelled to leave methane.',
      title: 'Cancelling Steps',
      body: 'Flipping the methane card turned its ΔH from −890.3 kJ to +890.3 kJ, and doubling the hydrogen card doubled its ΔH. The CO₂ and H₂O cancelled, leaving ΔH = −74.8 kJ for making methane.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-formation',
    title: 'Down to the Elements and Back',
    briefing: { speaker: SPEAKER, body: 'The standard enthalpy of formation of a substance is the ΔH of making one mole of it from its elements. Each card on this bench is one formation step.' },
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
      'Compare the reaction wanted with the reaction the stack prints under it.',
      'CaCO₃ is used up in the reaction wanted, but its formation card makes it.',
      'A substance that is used up has to be taken apart into its elements, which is its formation step run backwards.'
    ],
    check(state) { return stackAnswer(state); },
    reward: {
      log: 'Down to the elements and back up to the products.',
      title: 'Products Less Reactants',
      body: 'The stack took CaCO₃ apart into its elements, then built CaO and CO₂ from them: ΔH = +178.3 kJ. The total is the standard enthalpy of formation of everything made, minus that of what was used up.'
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
      body: 'The heat of a reaction is the same whichever steps it takes, so the ΔH of a reaction nobody has measured can be found by adding steps that have been. Formation steps always work: add the standard enthalpies of formation of the products and take away those of the reactants.'
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
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the planners. */
export { stackRead };
