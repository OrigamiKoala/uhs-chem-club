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

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  heatTable, eqn, note, tag, plaqueFixture, stackFixture, leadFixture, stackRead, whereIs, FORMATION_TABLE
} from '../../table/kits/heat.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\bstate function\b/i, introducedAt: 2 },
  { term: /\bhess's law\b/i, introducedAt: 2 },
  { term: /\bstandard state\b/i, introducedAt: 4 },
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

/** Where the loose cards stand, the stack's tray, and its readout on every stack stage. */
const CARD_AT = i => ({ x: 25.5, y: 10 + i * 13 });
const STACK_TRAY = { id: 'stack', label: '', at: { x: 78, y: 33 }, size: { w: 52, h: 52 }, cell: 50, cellH: 13 };
/** The stack with its energy ladder (hideSum hides the live ΔH total on puzzle stages until Submit). */
const stackAt = (target, ladder) => stackFixture('wanted', { x: 128, y: 27 }, { tray: 'stack', target, hideSum: true, title: '', w: 44, h: 44, ladder });

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
      'One route goes straight from carbon to CO₂, while the other stops at CO first.',
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
      title: 'Hess\'s Law and State Functions',
      body: 'A reaction\'s total enthalpy change depends only on its reactants and products, never the steps in between: this is Hess\'s Law. Enthalpy is a state function.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-methane',
    title: 'Building Methane',
    briefing: { speaker: SPEAKER, body: 'Tap any card to Flip it (reversing its arrow and ΔH sign), Duplicate it to add another copy, or Remove an extra copy. Using Hess\'s Law, combine known steps to design the target heating reaction.' },
    prompt: 'Which steps, flipped or duplicated as needed, add up to C(s) + 2 H₂(g) → CH₄(g)?',
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
      'Spot any substance that is on the wrong side of the arrow, or needs two copies.',
      'Flip a card to move a substance to the opposite side, and press Duplicate to add a second copy of a step.'
    ],
    check(state) { return stackAnswer(state); },
    reward: {
      log: 'Three cards canceled to leave methane.',
      title: 'Canceling Steps',
      body: 'Flipping the methane card changed its ΔH from −890.3 kJ to +890.3 kJ, and duplicating the hydrogen card doubled its ΔH. CO₂ and H₂O canceled out, leaving ΔH = −74.8 kJ.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-standard-states',
    title: 'Elements in Standard States',
    briefing: {
      speaker: SPEAKER,
      body: [
        'Every element has a standard state — its most stable physical form at room temperature (25 °C) and 1 atm, such as C(s), O₂(g), H₂(g), and Ca(s).',
        'A compound\'s standard enthalpy of formation (ΔH°f) is the heat change for making 1 mole of that compound directly from its pure elements in their standard states. Pure elements in standard states have ΔH°f = 0.'
      ]
    },
    prompt: 'Sort each substance: is it an element in its standard state (ΔH°f = 0) or a compound?',
    widget,
    table: heatTable({
      pieces: [
        tag('o2', 'O₂(g)', { x: 24, y: 16 }),
        tag('co2', 'CO₂(g)', { x: 24, y: 31 }),
        tag('c', 'C(s) graphite', { x: 24, y: 46 }),
        tag('h2o', 'H₂O(l)', { x: 54, y: 16 }),
        tag('ca', 'Ca(s)', { x: 54, y: 31 }),
        tag('caco3', 'CaCO₃(s)', { x: 54, y: 46 })
      ],
      zones: {
        trays: [
          { id: 'elem', label: 'Element in standard state (ΔH°f = 0)', labelBelow: true, at: { x: 112, y: 16 }, size: { w: 62, h: 20 }, cell: 20, cellH: 10 },
          { id: 'comp', label: 'Compound (formed from elements)', labelBelow: true, at: { x: 112, y: 45 }, size: { w: 62, h: 20 }, cell: 20, cellH: 10 }
        ]
      }
    }),
    hints: [
      'Look at how many different elements appear in each formula.',
      'A pure element in its standard state contains only one kind of atom in its normal 25 °C form.',
      'O₂(g), C(s), and Ca(s) are pure elements in standard states (ΔH°f = 0); CO₂, H₂O, and CaCO₃ are compounds.'
    ],
    check(state) {
      const t = state.table;
      const want = { o2: 'elem', c: 'elem', ca: 'elem', co2: 'comp', h2o: 'comp', caco3: 'comp' };
      if (Object.keys(want).some(k => !['elem', 'comp'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Sort all six cards into the two trays.' };
      const wrong = Object.entries(want).find(([k, v]) => whereIs(t, k) !== v);
      if (!wrong) return { ok: true };
      const pc = t.pieces[wrong[0]];
      return { ok: false, msg: `${pc.label} is ${wrong[1] === 'elem' ? 'a pure element in its standard state (ΔH°f = 0)' : 'a compound made of multiple elements'}.` };
    },
    reward: {
      log: 'Pure elements in standard states have ΔH°f = 0.',
      title: 'Standard States and Formation',
      body: 'Every element in its standard state (like O₂(g), C(s), and Ca(s)) has ΔH°f = 0. A compound\'s standard enthalpy of formation (ΔH°f) is ΔH for forming 1 mole from those elements.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-formation',
    title: 'Down to the Elements and Back',
    briefing: {
      speaker: SPEAKER,
      body: [
        'Because enthalpy is a state function (Hess\'s Law), we can imagine ANY reaction taking a two-part detour:',
        'First, break every reactant down into its pure elements in standard states (reversing their formation steps). Second, build the products from those elements.'
      ]
    },
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
      'CaCO₃ is a reactant, so we need to break it down into its pure elements.',
      'Flip the CaCO₃ formation card so CaCO₃ is on the left, then add the CaO and CO₂ formation cards.'
    ],
    check(state) { return stackAnswer(state); },
    reward: {
      log: 'Broken down to elements and rebuilt into CaO and CO₂.',
      title: 'Detour Through Elements',
      body: 'Breaking CaCO₃ into elements (+1206.9 kJ) and forming CaO (−635.1 kJ) and CO₂ (−393.5 kJ) gives ΔH° = +178.3 kJ: always Σ ΔH°f(products) − Σ ΔH°f(reactants).'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-formation-calc',
    title: 'Calculating ΔH° From Formation Values',
    briefing: {
      speaker: SPEAKER,
      body: 'Use ΔH°rxn = Σ ΔH°f(products) − Σ ΔH°f(reactants). Multiply each ΔH°f by its coefficient in the balanced equation, and remember elements in standard states have ΔH°f = 0.'
    },
    prompt: 'Using the formation enthalpies on the bench, what is ΔH° for CH₄(g) + 2 O₂(g) → CO₂(g) + 2 H₂O(l)?',
    entry: { id: 'dh', label: 'Reaction ΔH°', unit: 'kJ' },
    widget,
    table: heatTable({
      fixtures: [
        plaqueFixture('eq', 'Target Heating Reaction', { x: 46, y: 28 }, [
          'CH₄(g) + 2 O₂(g) → CO₂(g) + 2 H₂O(l)',
          'ΔH°rxn = Σ ΔH°f(products) − Σ ΔH°f(reactants)'
        ], { w: 74 }),
        plaqueFixture('tbl', 'Standard Enthalpies of Formation (ΔH°f)', { x: 116, y: 28 }, [
          'CH₄(g):  −74.8 kJ/mol',
          'O₂(g):    0.0 kJ/mol  (standard state)',
          'CO₂(g):  −393.5 kJ/mol',
          'H₂O(l):  −285.8 kJ/mol'
        ], { w: 62 })
      ]
    }),
    hints: [
      'Sum the products first: 1 × ΔH°f(CO₂) + 2 × ΔH°f(H₂O).',
      'Sum the reactants: 1 × ΔH°f(CH₄) + 2 × 0 (since O₂(g) is an element in its standard state).',
      'Subtract reactants from products: (−393.5 + 2 × −285.8) − (−74.8).'
    ],
    check(state) {
      const v = entryNumber(state.table, 'dh');
      if (v == null || Number.isNaN(v)) return { ok: false, notYet: true, msg: 'Enter ΔH° in kJ (include the sign).' };
      if (Math.abs(v - (-890.3)) <= 1.5) return { ok: true };
      return { ok: false, msg: `Check your coefficients and signs: products total −965.1 kJ and reactants total −74.8 kJ; subtract reactants from products.` };
    },
    reward: {
      log: 'Calculated ΔH° = −890.3 kJ for burning methane.',
      title: 'Formation Enthalpies in Action',
      body: 'Products (−965.1 kJ) minus reactants (−74.8 kJ) gives ΔH° = −890.3 kJ. Because enthalpy is a state function, formation tables let you calculate ΔH° for almost any reaction.'
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
      body: 'Because enthalpy is a state function, Hess\'s Law lets you combine measured reactions to design multi-step heating processes. Using standard enthalpies of formation, ΔH°rxn always equals Σ ΔH°f(products) − Σ ΔH°f(reactants).'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const stack = (...ids) => ids.map(id => put(id, 'tray:stack'));

export const SOLUTIONS = [
  [put('same', 'slot:guess')],
  [put('a1', 'tray:routeA'), put('b1', 'tray:routeB'), put('b2', 'tray:routeB')],
  [...stack('c1', 'c2', 'c3'), { duplicate: 'c2' }, { flip: 'c3' }],
  [put('o2', 'tray:elem'), put('c', 'tray:elem'), put('ca', 'tray:elem'), put('co2', 'tray:comp'), put('h2o', 'tray:comp'), put('caco3', 'tray:comp')],
  [...stack('f1', 'f2', 'f3'), { flip: 'f1' }],
  [{ type: { entry: 'dh', value: '-890.3' } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('a1', 'tray:routeA'), put('b1', 'tray:routeB')],
  [...stack('c1', 'c2', 'c3'), { flip: 'c3' }],
  [put('o2', 'tray:comp'), put('c', 'tray:elem'), put('ca', 'tray:elem'), put('co2', 'tray:comp'), put('h2o', 'tray:comp'), put('caco3', 'tray:comp')],
  [...stack('f1', 'f2', 'f3')],
  [{ type: { entry: 'dh', value: '-604.5' } }]
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
