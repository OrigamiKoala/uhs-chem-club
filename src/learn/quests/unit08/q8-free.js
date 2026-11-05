/**
 * Unit 8 · Bench 8 — Free Energy and K (q8-free)
 *
 * Teeter's plotting hut, on the pans kit (`table/kits/pans.js`, the favourability plotter in `pans-free.js`). A settling pan draws a
 * reaction as bars: faint at the start, solid where it settles. Eight stages and ONE click: the belief that a positive ΔG° means a
 * reaction never happens. ΔG° and its sign are Ember Reach's (`unit05/q7-gibbs`); K is the bench before.
 *
 *   1  PREDICT: what does a pan of a reaction with ΔG° = +8 kJ/mol hold once it settles?
 *   2  TEST: three pans, three ΔG° cards                      -> sign of ΔG° against K above or below 1, and the order
 *   3  TYPED: K for ΔG° = −10 kJ/mol at 298 K, past the pans  -> ΔG° = −RT ln K
 *   4  two pans warmed, each at two temperatures              -> K changes with temperature through ΔG° = ΔH° − TΔS°
 *   5  three salts, the two pulls of each                     -> dissolving is a ΔG question
 *   6  a cold pack in a beaker                                -> a change can cool its water and still run (entropy wins)
 *   7  cards on a stack: ATP with glucose + Pi                -> coupled reactions (ΔG° values add)
 *   8  three reactions, sealed                                -> the lowest ΔG settles with the most product
 *
 * THE WRONG MODEL IS ON THE TABLE. Card 1 of the prediction says no product forms. The pan with ΔG° = +8 kJ/mol settles holding some.
 *
 * SIMPLIFICATIONS, stated on the bench or in a reward: ΔH° and ΔS° are held constant over a stage's temperatures; K is dimensionless
 * (amounts in mol/L or bar over their standard values); the ATP values are for the biochemical standard state at pH 7; spontaneous
 * says nothing about speed. ΔG = ΔG° + RT ln Q is beyond the exam's equation list and is not a stage here.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  pansTable, note, tag, selectorFixture, plaqueFixture, stackFixture, stackRead, stackGap, eqn, pieceIn, dialValue
} from '../../table/kits/pans.js';
import { kbarsFixture, pullsFixture } from '../../table/kits/pans-free.js';
import { MODEL_PAN, WARM, DISSOLVE, pulls, coldPack, COUPLE, coupledPair, settledAt, columnRead, T_BENCH } from '../../engine/eqdata-free.js';
import { kFromDeltaG } from '../../engine/eqdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bcoupled reaction\b/i, introducedAt: 7 }
];

/** ΔG° and its sign are Ember Reach's, and the pans and K are the bench before. (`unit08/q2-k` is added when that bench is built.) */
export const BUILDS_ON = ['unit05/q7-gibbs', 'unit08/q1-both'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit08/q8-free';

/* ------------------------------------------------------------------
   THE NUMBERS (every one is a planner's: `engine/eqdata-free.js`)
   ------------------------------------------------------------------ */

const fmt1 = v => `${v < 0 ? '−' : '+'}${(Math.abs(v) + 1e-9).toFixed(1)}`;
const amt = v => (v >= 0.01 ? v.toPrecision(3) : v.toPrecision(2));
const sigK = v => (v >= 100 ? v.toPrecision(3) : v >= 1 ? v.toPrecision(3) : v.toPrecision(2));

// Stages 1 and 2: model reactions A ⇌ B, 1.00 mol/L of A at the start, T = 298 K.
const DG_PREDICT = 8;
const PANS2 = [{ id: 'p1', dG: -3 }, { id: 'p2', dG: 8 }, { id: 'p3', dG: 2 }];
const CARD_OF = { p1: 'tm3', p2: 't8', p3: 't2' };
const CARD_LABEL = { tm3: 'ΔG° −3 kJ/mol', t8: 'ΔG° +8 kJ/mol', t2: 'ΔG° +2 kJ/mol' };
const read2 = dG => settledAt(MODEL_PAN, dG, T_BENCH);

// Stage 3: two pans to read K from, then the figure past them.
const K_PANS = [-2, -4];
const DG_TYPED = -10;
const K_TYPED = kFromDeltaG(DG_TYPED, T_BENCH);

const GUESS = {
  none: 'No product forms',
  little: 'A little product forms, mostly reactant is left',
  even: 'About equal amounts of reactant and product',
  most: 'Mostly product forms'
};

// Stage 4: two real reactions, each at two temperatures.
const warmCols = r => r.Ts.map(T => ({ dH: r.dH, dS: r.dS, T }));
const subOf = r => `ΔH° ${fmt1(r.dH)} kJ  ΔS° ${fmt1(r.dS)} J/K`;
const warmProduct = (r, i) => {
  const last = r.sys.order[r.sys.order.length - 1];
  return columnRead(r.sys, warmCols(r)[i]).amounts[last];
};

// Stage 5 and 6: salts dissolving, 1 mol to aqueous ions at 298 K.
const SALT_ORDER = ['agcl', 'nacl', 'baso4'];
const SALT_RANGE = [-40, 70];
const SALT_ANSWER = SALT_ORDER.indexOf('nacl') + 1;
const PACK = { waterG: 500, T0: 25, mol: 1 };
const PACK_READ = coldPack(DISSOLVE.nh4cl, PACK);
const NH4 = pulls({ ...DISSOLVE.nh4cl, T: T_BENCH });

// Stage 8: three reactions at 298 K, ΔH in kJ/mol and ΔS in J/(mol·K).
const REACTIONS8 = [{ dH: -35, dS: -90 }, { dH: 40, dS: 200 }, { dH: -30, dS: -120 }];
const ANSWER8 = 2;

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'A Positive ΔG°',
    // A PREDICT STAGE: the pans are not on the table. The guess is made here and comes back with the test.
    predict: true,
    prompt: `Predict what a pan of a reaction with ΔG° = +${DG_PREDICT} kJ/mol holds once it has settled, starting from reactant alone.`,
    widget,
    table: pansTable({
      pieces: [
        note('none', GUESS.none, { x: 30, y: 14 }),
        note('little', GUESS.little, { x: 78, y: 14 }),
        note('even', GUESS.even, { x: 30, y: 36 }),
        note('most', GUESS.most, { x: 78, y: 36 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the four cards and the slot.',
      'Think about what a positive ΔG° has meant for whether a change runs.',
      'Commit to the card closest to what you expect the settled pan to hold; the pans come next.'
    ],
    check(state) {
      const card = pieceIn(state.table, 'guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = pieceIn(state.table, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Prediction',
      body: 'Next, three pans of different reactions are settled, and their ΔG° cards are laid on them.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-sign',
    title: 'ΔG° and Where a Pan Settles',
    get prompt() {
      const g = recall(QUEST_KEY);
      return g && GUESS[g] ? `You predicted "${GUESS[g]}". Lay each ΔG° card on the pan it belongs to.` : 'Lay each ΔG° card on the pan it belongs to.';
    },
    widget,
    table: pansTable({
      pieces: [
        tag('tm3', CARD_LABEL.tm3, { x: 38, y: 66.5 }),
        tag('t8', CARD_LABEL.t8, { x: 75, y: 66.5 }),
        tag('t2', CARD_LABEL.t2, { x: 112, y: 66.5 })
      ],
      fixtures: PANS2.map((p, i) => kbarsFixture(p.id, { x: 24 + i * 50, y: 23 }, { title: `Pan ${i + 1}`, sys: MODEL_PAN, cols: [{ dG: p.dG }], w: 44, h: 42 })),
      zones: {
        slots: PANS2.map((p, i) => ({ id: `s${i + 1}`, label: `Pan ${i + 1} card`, at: { x: 24 + i * 50, y: 51 }, size: { w: 26, h: 9 } }))
      }
    }, { h: 74 }),
    hints: [
      'Use the "Run" key on each pan and the three ΔG° cards.',
      'Compare how much product each pan holds with the ΔG° on the cards.',
      'Put the pans in order by the product they hold, put the cards in order by ΔG°, and pair them off.'
    ],
    check(state) {
      const t = state.table;
      const laid = PANS2.map((p, i) => pieceIn(t, `s${i + 1}`));
      if (laid.some(c => !c)) return { ok: false, notYet: true, msg: 'Lay a card on each pan.' };
      const bad = PANS2.findIndex((p, i) => laid[i].id !== CARD_OF[p.id]);
      if (bad < 0) return { ok: true };
      const r = read2(PANS2[bad].dG);
      return { ok: false, msg: `Pan ${bad + 1} settles with ${amt(r.amounts.B)} mol/L of product and ${amt(r.amounts.A)} mol/L of reactant, and the card on it reads ${CARD_LABEL[laid[bad].id]}.` };
    },
    get reward() {
      const g = recall(QUEST_KEY);
      const r8 = read2(DG_PREDICT);
      const verdict = !g || !GUESS[g] ? '' : g === 'little' ? `You predicted a little product, and the +${DG_PREDICT} pan held ${amt(r8.amounts.B)} mol/L. ` : g === 'none' ? `You predicted no product, but the +${DG_PREDICT} pan held ${amt(r8.amounts.B)} mol/L. ` : `The +${DG_PREDICT} pan held ${amt(r8.amounts.B)} mol/L of product, which is not what you predicted. `;
      return {
        log: 'The lower the ΔG°, the more product the pan held.',
        title: 'ΔG° Sets K',
        body: `${verdict}The more negative the ΔG°, the more product a pan holds when it settles. A negative ΔG° settles with more product than reactant, so K is above 1; a positive ΔG° settles with less, so K is below 1, but never none.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-typed-k',
    title: 'K From ΔG°',
    prompt: `Type the K of a reaction with a ΔG° of ${fmt1(DG_TYPED).replace('+', '')} kJ/mol at ${T_BENCH} K.`,
    entry: { id: 'k', label: 'K', unit: '' },
    widget,
    table: pansTable({
      fixtures: [
        kbarsFixture('a', { x: 26, y: 25 }, { title: 'Pan A', sys: MODEL_PAN, cols: [{ dG: K_PANS[0] }], showDG: true }),
        kbarsFixture('b', { x: 76, y: 25 }, { title: 'Pan B', sys: MODEL_PAN, cols: [{ dG: K_PANS[1] }], showDG: true }),
        plaqueFixture('given', 'Given', { x: 126, y: 18 }, ['ΔG° = −RT ln K', 'R = 8.314 J/(mol·K)', `T = ${T_BENCH} K`, 'Standard states'], { w: 44 })
      ]
    }),
    hints: [
      'Use the "Run" key on both pans, the plate and the answer box.',
      'Divide the product bar by the reactant bar on each pan and set that against the ΔG° printed over it.',
      'Turn the ΔG° into joules to match R, divide by RT, and put the opposite sign on the power of e.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'k');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type K as a number above zero.' };
      if (Math.abs(v - K_TYPED) / K_TYPED <= 0.02) return { ok: true };
      const ks = K_PANS.map(d => settledAt(MODEL_PAN, d, T_BENCH).K);
      const reads = `Pan A at ${fmt1(K_PANS[0])} kJ/mol and Pan B at ${fmt1(K_PANS[1])} kJ/mol settle with K ${sigK(ks[0])} and ${sigK(ks[1])}.`;
      if (Math.abs(Math.log(v)) < 0.05) return { ok: false, msg: `A K of ${v} would leave a pan with about equal amounts of reactant and product, and both pans on the bench hold far more product than reactant.` };
      if (v < 1) return { ok: false, msg: `A K of ${v} would leave a pan with more reactant than product, and both pans on the bench hold more product than reactant.` };
      return { ok: false, msg: `${reads} A K of ${v} does not follow the same pattern at ${fmt1(DG_TYPED)} kJ/mol.` };
    },
    reward: {
      log: 'K came from ΔG° with ΔG° = −RT ln K.',
      title: 'ΔG° and K',
      body: 'ΔG° = −RT ln K connects the free energy to where a reaction settles: the more negative the ΔG°, the larger the K, and ΔG° = 0 gives K = 1. R is in joules, so a ΔG° in kJ/mol is turned into J/mol first.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-warm',
    title: 'Warming a Pan',
    prompt: 'Set each dial to what warming does to the amount of product the pan holds.',
    widget,
    table: pansTable({
      fixtures: [
        kbarsFixture('r1', { x: 37, y: 26 }, { title: WARM.n2o4.eq, sys: WARM.n2o4.sys, cols: warmCols(WARM.n2o4), showDG: true, showT: true, w: 70, h: 46, sub: subOf(WARM.n2o4) }),
        kbarsFixture('r2', { x: 113, y: 26 }, { title: WARM.wgs.eq, sys: WARM.wgs.sys, cols: warmCols(WARM.wgs), showDG: true, showT: true, w: 70, h: 46, sub: subOf(WARM.wgs) }),
        selectorFixture('d1', 'Product, N₂O₄ pan', { x: 37, y: 58 }, { options: ['More product', 'Less product', ' '], start: 3, w: 46 }),
        selectorFixture('d2', 'Product, CO + H₂O pan', { x: 113, y: 58 }, { options: ['More product', 'Less product', ' '], start: 3, w: 46 })
      ]
    }, { h: 72 }),
    hints: [
      'Use the "Run" key on both pans and the two answer dials.',
      'Compare the blue bars in the two columns of each pan.',
      'Read each pan from its cooler column to its warmer one and set the dial to what the product bars did.'
    ],
    check(state) {
      const t = state.table;
      const a = dialValue(t, 'd1'); const b = dialValue(t, 'd2');
      if (a === 3 || b === 3) return { ok: false, notYet: true, msg: 'Set both dials.' };
      const want = r => (warmProduct(r, 1) > warmProduct(r, 0) ? 1 : 2);
      const one = a === want(WARM.n2o4);
      const two = b === want(WARM.wgs);
      if (one && two) return { ok: true };
      const r = one ? WARM.wgs : WARM.n2o4;
      const prod = r.sys.names[r.sys.order[r.sys.order.length - 1]];
      return { ok: false, msg: `On the ${r.eq} pan the ${prod} bar reads ${amt(warmProduct(r, 0))} ${r.sys.unit} at ${r.Ts[0]} K and ${amt(warmProduct(r, 1))} ${r.sys.unit} at ${r.Ts[1]} K.` };
    },
    reward: {
      log: 'Warming raised the product of one pan and lowered it on the other.',
      title: 'Temperature Moves K',
      body: `K changes with temperature because ΔG° = ΔH° − TΔS° does. Warming the N₂O₄ pan, which takes in heat, raised the product from ${amt(warmProduct(WARM.n2o4, 0))} to ${amt(warmProduct(WARM.n2o4, 1))} bar, and warming the pan that gives out heat lowered it.`
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-salts',
    title: 'Salts in Water',
    prompt: `Set the dial to the salt that dissolves on its own at ${T_BENCH} K.`,
    widget,
    table: pansTable({
      fixtures: [
        ...SALT_ORDER.map((id, i) => pullsFixture(`s${i + 1}`, { x: 24 + i * 50, y: 21 }, { title: `Salt ${i + 1}`, change: { dH: DISSOLVE[id].dH, dS: DISSOLVE[id].dS }, range: SALT_RANGE })),
        selectorFixture('pick', 'Dissolves on its own', { x: 75, y: 52 }, { options: ['Salt 1', 'Salt 2', 'Salt 3', ' '], start: 4, w: 56 })
      ]
    }),
    hints: [
      'Use the three sets of bars and the answer dial.',
      'Compare the amber bar and the green bar of each salt.',
      'A change runs on its own when ΔH − TΔS is below zero, so work out the net for each salt.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === SALT_ANSWER) return { ok: true };
      const s = pulls({ ...DISSOLVE[SALT_ORDER[v - 1]], T: T_BENCH });
      return { ok: false, msg: `Salt ${v} takes in ${fmt1(s.dH)} kJ/mol and its spreading is worth ${fmt1(s.TdS)} kJ/mol.` };
    },
    get reward() {
      const g = id => pulls({ ...DISSOLVE[id], T: T_BENCH });
      return {
        log: 'Salt 2 dissolved because its spreading outweighed its heat.',
        title: 'Dissolving Is a ΔG Question',
        body: `Salt 2 was sodium chloride: it takes in heat, yet its ΔG of dissolving is ${fmt1(g('nacl').dG)} kJ/mol, so it dissolves. Salts 1 and 3, silver chloride and barium sulfate, have ΔG of ${fmt1(g('agcl').dG)} and ${fmt1(g('baso4').dG)} kJ/mol, so very little dissolves.`
      };
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-cold',
    title: 'A Cold Pack',
    prompt: 'Lay the card that explains what happens in the beaker.',
    widget,
    table: pansTable({
      pieces: [
        note('cw2', 'Dissolving only runs when it gives out heat', { x: 26, y: 60 }),
        note('cw1', 'The spreading is worth more than the heat taken in', { x: 76, y: 60 }),
        note('cw3', 'The salt dissolved without taking in any heat', { x: 126, y: 60 })
      ],
      fixtures: [
        pullsFixture('cup', { x: 42, y: 24 }, { title: 'Salt in water', change: { dH: DISSOLVE.nh4cl.dH, dS: DISSOLVE.nh4cl.dS }, range: SALT_RANGE, water: PACK, w: 80, h: 36 })
      ],
      zones: { slots: [{ id: 'why', label: 'What the beaker shows', at: { x: 122, y: 22 }, size: { w: 36, h: 14 } }] }
    }, { h: 72 }),
    hints: [
      'Use the "Run" key on the beaker and the three cards.',
      'Compare the amber bar and the green bar, and what the thermometer and the salt left report.',
      'Choose the card that agrees with every reading: the bars, the thermometer and the salt left.'
    ],
    check(state) {
      const c = pieceIn(state.table, 'why');
      if (!c) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      if (c.id === 'cw1') return { ok: true };
      const fall = `The water fell from ${PACK_READ.T0.toFixed(1)} °C to ${PACK_READ.T1.toFixed(1)} °C`;
      if (c.id === 'cw2') return { ok: false, msg: `${fall}, and the salt left is ${PACK_READ.left.toFixed(2)} mol.` };
      return { ok: false, msg: `The ΔH bar points right at ${fmt1(NH4.dH)} kJ/mol, and ${fall.charAt(0).toLowerCase()}${fall.slice(1)}.` };
    },
    get reward() {
      return {
        log: 'The salt dissolved while its water cooled.',
        title: 'Entropy Can Win',
        body: `The salt took in ${NH4.dH.toFixed(1)} kJ/mol of heat, so its water cooled, and it still dissolved because its spreading TΔS is worth ${NH4.TdS.toFixed(1)} kJ/mol. A change can cool its water and run on its own when the spreading is larger.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-couple',
    title: 'Two Reactions Together',
    prompt: 'Make the stack add up to glucose + ATP → glucose-6-phosphate + ADP, then set its net ΔG°.',
    widget,
    table: pansTable({
      pieces: [
        eqn('g6p', { x: 25.5, y: 10 }, COUPLE.g6p.lhs, COUPLE.g6p.rhs, COUPLE.g6p.dG, { symbol: 'ΔG°' }),
        eqn('pcr', { x: 25.5, y: 23 }, COUPLE.pcr.lhs, COUPLE.pcr.rhs, COUPLE.pcr.dG, { symbol: 'ΔG°' }),
        eqn('atp', { x: 25.5, y: 36 }, COUPLE.atp.lhs, COUPLE.atp.rhs, COUPLE.atp.dG, { symbol: 'ΔG°' })
      ],
      fixtures: [
        stackFixture('wanted', { x: 128, y: 18 }, { tray: 'stack', target: { lhs: [[1, 'glucose'], [1, 'ATP']], rhs: [[1, 'glucose-6-phosphate'], [1, 'ADP']] }, hideSum: true, w: 44, h: 30, symbol: 'ΔG°' }),
        selectorFixture('answer', 'Net ΔG° (kJ/mol)', { x: 128, y: 42 }, { options: ['−16.7', '+44.3', '+16.7', '−44.3'], start: 4, w: 44 }),
        plaqueFixture('ph', 'Given', { x: 26, y: 58 }, ['ΔG° at pH 7 and 298 K', 'Pi is phosphate'], { w: 44 })
      ],
      zones: { trays: [{ id: 'stack', label: 'The stack', at: { x: 78, y: 33 }, size: { w: 52, h: 52 }, cell: 50, cellH: 13 }] }
    }, { h: 70 }),
    hints: [
      'Use the three cards, the stack and the answer dial.',
      'Compare the substances on each card with the reaction wanted, and look for one that stands on both sides.',
      'Stack the cards whose shared substances cancel to leave the reaction wanted, and add their ΔG° values for the net.'
    ],
    check(state) {
      const t = state.table;
      const r = stackRead(t, 'wanted');
      if (r.empty) return { ok: false, notYet: true, msg: 'Stack the cards first.' };
      if (!r.matches) return { ok: false, msg: `The stack adds up to a different reaction from the one wanted: ${stackGap(t, 'wanted')}.` };
      const v = dialValue(t, 'answer');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 1) return { ok: true };
      const opts = ['−16.7', '+44.3', '+16.7', '−44.3'];
      return { ok: false, msg: `The two cards in the stack read ${fmt1(COUPLE.atp.dG)} and ${fmt1(COUPLE.g6p.dG)} kJ/mol, and the net you set is ${opts[v - 1]} kJ/mol.` };
    },
    get reward() {
      const pair = coupledPair(COUPLE.atp.dG, COUPLE.g6p.dG);
      return {
        log: 'Pairing the two reactions made a net ΔG° below zero.',
        title: 'Coupled Reactions',
        body: `Two reactions that share a substance can be added, and their ΔG° values add. ATP hydrolysis (${fmt1(COUPLE.atp.dG)} kJ/mol) paired with glucose + Pi → glucose-6-phosphate (${fmt1(COUPLE.g6p.dG)}) nets ${fmt1(pair.dG)}, so the pair runs: a coupled reaction.`
      };
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-sealed',
    title: 'Three Reactions',
    prompt: `Set the dial to the reaction whose pan would settle with the most product at ${T_BENCH} K.`,
    widget,
    table: pansTable({
      fixtures: [
        ...REACTIONS8.map((c, i) => pullsFixture(`x${i + 1}`, { x: 24 + i * 50, y: 21 }, { title: `Reaction ${i + 1}`, change: c, range: [-50, 70] })),
        selectorFixture('pick', 'Most product', { x: 75, y: 52 }, { options: ['Reaction 1', 'Reaction 2', 'Reaction 3', ' '], start: 4, w: 56 })
      ]
    }),
    hints: [
      'Use the three sets of bars and the answer dial.',
      'Compare the amber bar and the green bar of each reaction, not the amber bar alone.',
      'The reaction with the lowest ΔH − TΔS has the largest K and settles with the most product.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === ANSWER8) return { ok: true };
      const a = pulls({ ...REACTIONS8[v - 1], T: T_BENCH }); const b = pulls({ ...REACTIONS8[ANSWER8 - 1], T: T_BENCH });
      return { ok: false, msg: `Reaction ${v} has ΔH ${fmt1(a.dH)} and TΔS ${fmt1(a.TdS)} kJ/mol; Reaction ${ANSWER8} has ΔH ${fmt1(b.dH)} and TΔS ${fmt1(b.TdS)} kJ/mol.` };
    },
    reward: {
      log: 'The lowest ΔG settled with the most product.',
      title: 'Free Energy Decides',
      body: 'A pan settles with the most product where ΔH − TΔS is lowest, even when that reaction takes in heat. ΔG° says where a reaction settles, not how fast it gets there; a negative ΔG° can still take years.'
    }
  }
];

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = {
  title: 'Free Energy and K',
  body: 'ΔG° sets K: the lower it is, the more product a pan holds when it settles.'
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const run = fid => ({ run: fid });
const typed = (entry, value) => ({ type: { entry, value } });
const stack = (...ids) => ids.map(id => put(id, 'tray:stack'));
const runAll = (...ids) => ids.map(run);

export const SOLUTIONS = [
  [put('little', 'slot:guess')],
  [...runAll('p1', 'p2', 'p3'), put('tm3', 'slot:s1'), put('t8', 'slot:s2'), put('t2', 'slot:s3')],
  [...runAll('a', 'b'), typed('k', '56.6')],
  [...runAll('r1', 'r2'), dial('d1', 'value', 1), dial('d2', 'value', 2)],
  [dial('pick', 'value', SALT_ANSWER)],
  [run('cup'), put('cw1', 'slot:why')],
  [...stack('atp', 'g6p'), dial('answer', 'value', 1)],
  [dial('pick', 'value', ANSWER8)]
];

export const MISSES = [
  [],
  [...runAll('p1', 'p2', 'p3'), put('t8', 'slot:s1'), put('tm3', 'slot:s2'), put('t2', 'slot:s3')],
  [...runAll('a', 'b'), typed('k', '1')],
  [...runAll('r1', 'r2'), dial('d1', 'value', 2), dial('d2', 'value', 2)],
  [dial('pick', 'value', 1)],
  [run('cup'), put('cw2', 'slot:why')],
  [...stack('atp', 'g6p'), dial('answer', 'value', 2)],
  [dial('pick', 'value', 1)]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/** For `tools/lib/teeter-q8-checks.mjs`. */
export const CHECKS = { K_TYPED, DG_TYPED, PACK_READ, SALT_ANSWER, ANSWER8, REACTIONS8 };
