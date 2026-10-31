/**
 * Unit 7 · Bench 4 — Balancing Equations (q4-balance)
 *
 * The furnace control room, on the pot kit (`table/kits/pot.js`, instruments in `pot-balance.js`): an equation BOARD (a line of formulas
 * with a dial under it for each number the player sets), a particle WINDOW that draws exactly what the board says, an atom LEDGER that
 * counts each side without ever ticking, and a tally, a set of state tiles and a formula builder where a stage needs them. Every count
 * comes from `reactdata.js` (`parseEquation`, `atomLedger`, `balance`) through `reactdata-balance.js`; nothing on the table is authored.
 * Eight stages and ONE click: the belief that to balance an equation you change the little numbers inside a formula.
 *
 *   1  count the oxygen atoms the window shows before and after H2 + O2 -> H2O (tally dials)         -> chemical equation, reactant, product
 *   2  PREDICT: how to make the atoms agree (change a small number / put a number in front / add an atom)
 *   3  TEST: the board with both kinds of dial. A small number turned makes H2O2: the atoms agree, the molecule is not water -> coefficient
 *   4  the furnace recipe: a pot's diagram, with carbon monoxide left over; set the board to describe the change
 *   5  state tiles under each substance of 2 Na + 2 H2O -> 2 NaOH + H2; the window draws how each sits  -> state symbol
 *   6  propane burning: the ledger and four dials
 *   7  Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O: the ledger counts PO4 and OH as one piece each
 *   8  sealed: P4 + 5 O2 -> 2 (sealed bags); build the formula of what is in them
 *
 * THE TEACHING STANCE. The ledger prints counts and never a verdict. A refusal names what the window or the ledger shows, never the
 * rule. The held model is a card on the predict stage and a dial on the test stage.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { potTable, plaqueFixture, stmt } from '../../table/kits/pot.js';
import { eqBench, boardRead, windowRead, ledgerRead, tallyRead, tallyFixture, formulaFixture, formulaRead, stateTile } from '../../table/kits/pot-balance.js';
import { parseEquation, parseFormula, pretty, atomLedger } from '../../engine/reactdata.js';
import { diagramOf, smallestCoefs, STATE_OF, STATE_PICTURE, groupLedger } from '../../engine/reactdata-balance.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bchemical equations?\b/i, introducedAt: 1 },
  { term: /\breactants?\b/i, introducedAt: 1 },
  { term: /\bproducts?\b/i, introducedAt: 1 },
  { term: /\bcoefficients?\b/i, introducedAt: 3 },
  { term: /\bstate symbols?\b/i, introducedAt: 5 }
];

/** Conservation of mass is the first bench's; solid, liquid and gas pictures are Mirrowen's. */
export const BUILDS_ON = ['unit07/q1-recipe', 'unit06/q1-states'];

/** The room this quest's table stands in at T4: Kettle has no world to stand in yet (`rooms.js`). */
export const ROOM = 'foundry';

const SPEAKER = 'Vess';
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit07/q4-balance';

/* ------------------------------------------------------------------
   THE CASES
   ------------------------------------------------------------------ */

const EQ_WATER = 'H2 + O2 -> H2O';
const EQ_FURNACE = 'Fe2O3 + CO -> Fe + CO2';
const FURNACE_POT = { Fe2O3: 1, CO: 4 };
const EQ_SODIUM = '2 Na + 2 H2O -> 2 NaOH + H2';
const EQ_PROPANE = 'C3H8 + O2 -> CO2 + H2O';
const EQ_PHOSPHATE = 'Ca(OH)2 + H3PO4 -> Ca3(PO4)2 + H2O';
const EQ_SEALED = 'P4 + 5 O2 -> 2 P2O5';
const SEALED_AT = 2;
const SEALED_FORMULA = 'P2O5';
const GROUPS = ['Ca', 'H', 'OH', 'PO4'];

const FURNACE = diagramOf(EQ_FURNACE, FURNACE_POT);
const PHOSPHATE_COEFS = smallestCoefs(EQ_PHOSPHATE);
const PROPANE_COEFS = smallestCoefs(EQ_PROPANE);
const WATER_COEFS = smallestCoefs(EQ_WATER);
const O_ROW = atomLedger(parseEquation(EQ_WATER)).rows.find(r => r.el === 'O');

const GUESS = { chg: 'Change a small number', front: 'Put a number in front', add: 'Add the missing atom' };

/* ------------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------------ */

const board = t => boardRead(t, 'bd');
const untouched = r => r.coefs.every(n => n === 1) && !Object.keys(r.subs).length;
const rowOf = (rows) => rows.find(r => r.left !== r.right);
const countsMsg = (row) => `The ledger counts ${pretty(row.el)}: ${row.left} on the left and ${row.right} on the right.`;

/** A balanced-or-not verdict for a board stage: the ledger's first row that disagrees, named by what it prints. */
function ledgerMiss(t, lid = 'led') {
  const { rows } = ledgerRead(t, lid);
  const row = rowOf(rows);
  return row ? countsMsg(row) : null;
}

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const b = eqBench({ eq: EQ_WATER, dialed: [], lex: 0, ledger: false });
    return {
      id: 's1-count',
      title: 'Count the Atoms',
      prompt: 'Count the oxygen atoms the window shows before the change and after it, and set the tally to match.',
      widget,
      table: potTable({ fixtures: [...b.fixtures, tallyFixture('tally', { x: 39, y: 37 })], zones: { slots: [] } }),
      hints: [
        'Use the "Oxygen before" and "Oxygen after" dials on the tally.',
        'Count the oxygen balls in the left half of the window, then in the right half.',
        'Each cluster is one molecule, so add up the oxygen atoms of every cluster in a half.'
      ],
      check(state) {
        const v = tallyRead(state.table, 'tally');
        if (v.before === 0 && v.after === 0) return { ok: false, notYet: true, msg: 'Set the tally dials to your count.' };
        if (v.before !== O_ROW.left) return { ok: false, msg: 'The left half of the window does not show that many oxygen atoms.' };
        if (v.after !== O_ROW.right) return { ok: false, msg: 'The right half of the window does not show that many oxygen atoms.' };
        return { ok: true };
      },
      reward: {
        log: 'H₂ + O₂ → H₂O shows 2 oxygen atoms before and 1 after.',
        title: 'Reactants and Products',
        body: 'A chemical equation writes a change with the reactants, the substances before the arrow, and the products, the substances after it. This one shows 2 oxygen atoms before the change and 1 after it, and atoms are not destroyed.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'A Way to Agree',
    predict: true,
    prompt: 'Choose how you would make the oxygen atoms agree on both sides of H₂ + O₂ → H₂O.',
    widget,
    table: potTable({
      pieces: Object.entries(GUESS).map(([id, label], i) => stmt(id, label, { x: 24 + (i % 2) * 38, y: 10 + Math.floor(i / 2) * 16 })),
      fixtures: [plaqueFixture('eq', 'Equation', { x: 116, y: 12 }, ['H₂ + O₂ → H₂O'], { w: 50 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 116, y: 38 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the three cards and the slot.',
      'Think about what each change does to the atoms on the board and to the substances themselves.',
      'Commit to the way you expect to work, then test it on the board in the next part.'
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
      body: 'Next, try it on the board and watch the ledger and the window.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const b = eqBench({ eq: EQ_WATER, dialed: 'all', sub: { at: 2, el: 'O' }, lex: 1, ledger: 'atoms', boardTitle: 'Equation' });
    return {
      id: 's3-agree',
      title: 'Make Them Agree',
      get prompt() {
        const g = recall(QUEST_KEY);
        const pre = g && GUESS[g] ? `You chose "${GUESS[g]}". ` : '';
        return `${pre}Make the atoms on the left of the arrow agree with the atoms on the right.`;
      },
      widget,
      table: potTable({ fixtures: b.fixtures, zones: { slots: [] } }),
      hints: [
        'Use the dials on the board and read the ledger.',
        'After each turn of a dial, compare the two columns of the ledger and look at what the window redraws.',
        'One kind of dial changes how many molecules there are and the other changes which molecule it is.'
      ],
      check(state) {
        const t = state.table;
        const r = board(t);
        if (untouched(r)) return { ok: false, notYet: true, msg: 'Turn a dial on the board.' };
        const changed = Object.keys(r.subs).map(i => r.plan.species[i].f);
        if (changed.length) return { ok: false, msg: `The window now shows ${pretty(changed[0])} after the change, a different molecule from the one you started with.` };
        const miss = ledgerMiss(t);
        if (miss) return { ok: false, msg: miss };
        return { ok: true };
      },
      get reward() {
        const g = recall(QUEST_KEY);
        const verdict = g === 'chg' ? 'Changing the small number made the counts agree, but for a different molecule. ' : g === 'front' ? 'Your guess held. ' : '';
        return {
          log: '2 H₂ + O₂ → 2 H₂O agrees; H₂ + O₂ → H₂O₂ is a different molecule.',
          title: 'The Coefficient',
          body: `${verdict}A coefficient is the number in front of a formula: it counts molecules, so the atoms change and the substance does not. A small number inside a formula is part of what the substance is.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const b = eqBench({ eq: EQ_FURNACE, dialed: 'all', lex: 2, ledger: false, pot: { eq: EQ_FURNACE, feed: FURNACE_POT }, boardTitle: 'Equation' });
    return {
      id: 's4-furnace',
      title: 'The Furnace Recipe',
      prompt: 'Set the board so the equation describes the change in the window.',
      widget,
      table: potTable({ fixtures: b.fixtures, zones: { slots: [] } }),
      hints: [
        'Use the four dials on the board.',
        'Compare what the window shows before the change with what it shows after, one substance at a time.',
        'Only molecules that changed belong in the equation: a substance still there afterwards was not all used.'
      ],
      check(state) {
        const t = state.table;
        const r = board(t);
        if (untouched(r)) return { ok: false, notYet: true, msg: 'Turn a dial on the board.' };
        const want = FURNACE.coefs;
        const sp = r.plan.species;
        for (let i = 0; i < sp.length; i++) {
          if (r.coefs[i] === want[i]) continue;
          const left = FURNACE.after.find(([f]) => f === sp[i].f);
          if (i < r.nl && left) return { ok: false, msg: `The window shows ${left[1]} ${pretty(sp[i].f)} still there after the change.` };
          return { ok: false, msg: `The board does not match the number of ${pretty(sp[i].f)} in the window.` };
        }
        return { ok: true };
      },
      reward: {
        log: 'The furnace recipe: Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂.',
        title: 'The Furnace Recipe',
        body: 'The furnace recipe is Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂. Only the molecules that changed belong in an equation, so the carbon monoxide left over afterwards is not counted.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const b = eqBench({ eq: EQ_SODIUM, dialed: [], states: true, phases: true, lex: 2, ledger: false, boardTitle: 'Equation' });
    const order = ['aq', 'g', 's', 'l'];
    return {
      id: 's5-states',
      title: 'Which State',
      prompt: 'Write the state of each substance after it on the board.',
      widget,
      table: potTable({
        pieces: order.map((s, i) => stateTile(`t_${s}`, s, { x: 12 + i * 19, y: 54 })),
        fixtures: b.fixtures,
        zones: { slots: b.slots }
      }),
      hints: [
        'Drag a tile into the slot under each substance.',
        'Look at how the particles of each substance are drawn in the window: locked in rows, jumbled, far apart or among water.',
        'Match each way of sitting to the word printed on a tile.'
      ],
      check(state) {
        const t = state.table;
        const r = board(t);
        const sp = r.plan.species;
        let missing = false;
        for (let i = 0; i < sp.length; i++) {
          const have = r.states[i];
          if (!have) { missing = true; continue; }
          if (have !== STATE_OF[sp[i].f]) return { ok: false, msg: `${pretty(sp[i].f)} is marked (${have}), but the window does not draw its particles ${STATE_PICTURE[have]}.` };
        }
        if (missing) return { ok: false, notYet: true, msg: 'Every substance needs a tile.' };
        return { ok: true };
      },
      reward: {
        log: '2 Na(s) + 2 H₂O(l) → 2 NaOH(aq) + H₂(g).',
        title: 'State Symbols',
        body: 'A state symbol in brackets after a formula says what state the substance is in: (s) solid, (l) liquid, (g) gas, (aq) dissolved in water. The equation now says what the window shows.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const b = eqBench({ eq: EQ_PROPANE, dialed: 'all', lex: 2, ledger: 'atoms', boardTitle: 'Equation' });
    return {
      id: 's6-propane',
      title: 'Propane',
      prompt: 'Make the atom counts agree on both sides for propane burning in oxygen.',
      widget,
      table: potTable({ fixtures: b.fixtures, zones: { slots: [] } }),
      hints: [
        'Use the four dials on the board and read the ledger.',
        'Compare the two columns of the ledger one atom at a time, and turn a dial to see which rows move.',
        'Set the atoms that appear in only one substance on each side first, and leave oxygen, which appears in two, for last.'
      ],
      check(state) {
        const t = state.table;
        const r = board(t);
        if (untouched(r)) return { ok: false, notYet: true, msg: 'Turn a dial on the board.' };
        const miss = ledgerMiss(t);
        return miss ? { ok: false, msg: miss } : { ok: true };
      },
      reward: {
        log: 'C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O.',
        title: 'Burning Propane',
        body: 'C₃H₈ + 5 O₂ → 3 CO₂ + 4 H₂O. Oxygen is in both products, so its count depends on the other two coefficients, and every row of the ledger has to agree at once.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const b = eqBench({ eq: EQ_PHOSPHATE, dialed: 'all', lex: 2, ledger: 'groups', rings: true, groups: GROUPS, boardTitle: 'Equation' });
    return {
      id: 's7-groups',
      title: 'Groups That Stay Whole',
      prompt: 'Make the pieces on the left of the arrow agree with the pieces on the right.',
      widget,
      table: potTable({ fixtures: b.fixtures, zones: { slots: [] } }),
      hints: [
        'Use the four dials on the board and read the ledger of pieces.',
        'Look at the rings in the window: what is inside a ring stays whole, so compare how many of each ring stand on each side.',
        'Balance the pieces that appear in only one substance on each side first, then the one that appears in two.'
      ],
      check(state) {
        const t = state.table;
        const r = board(t);
        if (untouched(r)) return { ok: false, notYet: true, msg: 'Turn a dial on the board.' };
        const miss = ledgerMiss(t);
        return miss ? { ok: false, msg: miss } : { ok: true };
      },
      reward: {
        log: '3 Ca(OH)₂ + 2 H₃PO₄ → Ca₃(PO₄)₂ + 6 H₂O.',
        title: 'Groups That Stay Whole',
        body: 'A group of atoms that stays together through the change, like PO₄ or OH, can be counted as one piece. In 3 Ca(OH)₂ + 2 H₃PO₄ → Ca₃(PO₄)₂ + 6 H₂O the two PO₄ groups on the right are the two from H₃PO₄.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const b = eqBench({ eq: EQ_SEALED, dialed: [], sealed: [SEALED_AT], lex: 2, ledger: false, boardTitle: 'Equation' });
    return {
      id: 's8-sealed',
      title: 'Sealed Bags',
      prompt: 'Build the formula of the substance in the sealed bags.',
      widget,
      table: potTable({ fixtures: [...b.fixtures, formulaFixture('fm', { x: 39, y: 40 }, { elements: ['P', 'O'] })], zones: { slots: [] } }),
      hints: [
        'Use the "P atoms" and "O atoms" dials to build the formula of one bag.',
        'Count the atoms of each kind in the left half of the window, then see how many sealed bags the right half holds.',
        'The atoms in the bags are the atoms that went in, shared equally among the bags.'
      ],
      check(state) {
        const r = formulaRead(state.table, 'fm');
        if (!r.formula) return { ok: false, notYet: true, msg: 'Turn the formula dials.' };
        const want = parseFormula(SEALED_FORMULA);
        const same = Object.keys(want).length === Object.keys(r.counts).length && Object.entries(want).every(([el, n]) => r.counts[el] === n);
        if (same) return { ok: true };
        return { ok: false, msg: `${r.text} has ${r.counts.P || 0} P and ${r.counts.O || 0} O, and the window shows 2 sealed bags after the change.` };
      },
      reward: {
        log: 'P₄ + 5 O₂ → 2 P₂O₅.',
        title: 'An Unknown Formula',
        body: 'The 4 phosphorus and 10 oxygen atoms that went in are the atoms in the 2 bags, so each bag holds P₂O₅. A balanced equation lets you work out a formula from the atoms that have to be there.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Set both tally dials to your count.'],
  2: ['Drag the card you choose into the slot.'],
  3: ['Turn the board dials and read the ledger.'],
  4: ['Turn the board dials. The window cannot be changed.'],
  5: ['Drag a tile into the slot under each substance.'],
  6: ['Turn the board dials and read the ledger.'],
  7: ['Turn the board dials and read the ledger.'],
  8: ['Turn the formula dials to build the formula.']
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
      body: 'A balanced equation has the same atoms on both sides, and the only way to get there is with the numbers in front. The furnace recipe is Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const coef = (i, v) => dial('bd', `c${i}`, v);

export const SOLUTIONS = [
  [dial('tally', 'before', 2), dial('tally', 'after', 1)],
  [put('front', 'slot:guess')],
  [coef(0, 2), coef(2, 2)],
  [coef(1, 3), coef(2, 2), coef(3, 3)],
  [put('t_s', 'slot:bd.s0'), put('t_l', 'slot:bd.s1'), put('t_aq', 'slot:bd.s2'), put('t_g', 'slot:bd.s3')],
  [coef(1, 5), coef(2, 3), coef(3, 4)],
  [coef(0, 3), coef(1, 2), coef(3, 6)],
  [dial('fm', 'el_P', 2), dial('fm', 'el_O', 5)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [dial('tally', 'before', 2), dial('tally', 'after', 2)],
  [],
  [dial('bd', 'sub', 2)],
  [coef(1, 4), coef(2, 2), coef(3, 3)],
  [put('t_g', 'slot:bd.s0')],
  [coef(1, 2), coef(2, 3), coef(3, 4)],
  [coef(0, 3), coef(1, 1), coef(3, 3)],
  [dial('fm', 'el_P', 4), dial('fm', 'el_O', 5)]
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
    STAGES, DEBRIEF, blankState, toolNoteFor, room: ROOM,
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = {
  EQ_WATER, EQ_FURNACE, FURNACE_POT, EQ_SODIUM, EQ_PROPANE, EQ_PHOSPHATE, EQ_SEALED, SEALED_AT, SEALED_FORMULA, GROUPS, GUESS,
  answers: { oRow: O_ROW, water: WATER_COEFS, furnace: FURNACE.coefs, furnaceAfter: FURNACE.after, propane: PROPANE_COEFS, phosphate: PHOSPHATE_COEFS }
};
export { boardRead, windowRead, ledgerRead, tallyRead, formulaRead, groupLedger };
