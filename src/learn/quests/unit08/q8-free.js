/**
 * Unit 8 · Bench 8 — Free Energy and K (q8-free)
 *
 * Teeter's plotting hut, on the pans kit (`table/kits/pans.js`, the favourability plotter in `pans-free.js`). A settling vessel draws a
 * reaction as bars: faint at the start, solid where it settles. Seven stages and ONE click: the belief that a positive ΔG° means a
 * reaction never happens. ΔG° and its sign are Ember Reach's (`unit05/q7-gibbs`); K is the bench before.
 *
 *   1  PREDICT: what does a vessel of a reaction with ΔG° = +8 kJ/mol hold once it settles?
 *   2  TEST: three vessels, three ΔG° cards                   -> sign of ΔG° against K above or below 1, and the order
 *   3  TYPED: K for ΔG° = −10 kJ/mol at 298 K                 -> ΔG° = −RT ln K
 *   4  three salts, ΔH and TΔS of each                        -> dissolving is a ΔG question
 *   5  a cold pack in a beaker                                -> a change can cool its water and still run (entropy wins)
 *   6  cards on a stack: ATP with glucose + Pi                -> coupled reactions (ΔG° values add)
 *   7  three reactions, sealed                                -> the lowest ΔG settles with the most product
 *
 * THE WRONG MODEL IS ON THE TABLE. Card 1 of the prediction says no product forms. The vessel with ΔG° = +8 kJ/mol settles holding some.
 *
 * SIMPLIFICATIONS, stated on the bench or in a reward: ΔH° and ΔS° are held constant; K is dimensionless
 * (amounts in mol/L or bar over their standard values); the ATP values are for the biochemical standard state at pH 7; spontaneous
 * says nothing about speed. ΔG = ΔG° + RT ln Q is beyond the exam's equation list and is not a stage here.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import {
  pansTable, note, tag, plaqueFixture, stackFixture, stackRead, stackGap, eqn, pieceIn, dialValue
} from '../../table/kits/pans.js';
import { kbarsFixture, pullsFixture } from '../../table/kits/pans-free.js';
import { MODEL_PAN, DISSOLVE, pulls, coldPack, COUPLE, coupledPair, settledAt, T_BENCH } from '../../engine/eqdata-free.js';
import { kFromDeltaG } from '../../engine/eqdata.js';

import { clipFixture } from '../../table/kits/pans-clips.js';
import { choiceFixture, pickable } from '../../table/kits/pans-choice.js';
export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\bcoupled reaction\b/i, introducedAt: 6 }
];

export const BUILDS_ON = ['unit05/q7-gibbs', 'unit08/q2-k'];

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

// Stage 3: two vessels to read K from, then the figure past them.
const K_PANS = [-2, -4];
const DG_TYPED = -10;
const K_TYPED = kFromDeltaG(DG_TYPED, T_BENCH);

const GUESS = {
  none: 'No product forms',
  little: 'A little product forms, mostly reactant is left',
  even: 'About equal amounts of reactant and product',
  most: 'Mostly product forms'
};

// Stage 4 and 5: salts dissolving, 1 mol to aqueous ions at 298 K.
const SALT_ORDER = ['agcl', 'nacl', 'baso4'];
const SALT_RANGE = [-40, 70];
const SALT_ANSWER = SALT_ORDER.indexOf('nacl') + 1;
const PACK = { waterG: 500, T0: 25, mol: 1 };
const PACK_READ = coldPack(DISSOLVE.nh4cl, PACK);
const NH4 = pulls({ ...DISSOLVE.nh4cl, T: T_BENCH });

// Stage 7: three reactions at 298 K, ΔH in kJ/mol and ΔS in J/(mol·K).
const REACTIONS8 = [{ dH: -35, dS: -90 }, { dH: 40, dS: 200 }, { dH: -30, dS: -120 }];
const ANSWER8 = 2;

/* ------------------------------------------------------------------
   THE SEVEN STAGES
   ------------------------------------------------------------------ */

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'A Positive ΔG°',
    // A PREDICT STAGE: the vessels are not on the table. The guess is made here and comes back with the test.
    predict: true,
    briefing: {
      speaker: 'Vess',
      body: 'ΔG° = ΔH − TΔS combines reaction heat (ΔH) and temperature in kelvin times entropy change (TΔS). When ΔG° is negative, the reaction runs toward products from standard amounts.'
    },
    prompt: `Starting from reactant alone in a reaction with ΔG° = +${DG_PREDICT} kJ/mol, what does the vessel hold once settled?`,
    widget,
    table: pansTable({
      pieces: [
        note('none', GUESS.none, { x: 30, y: 14 }),
        note('little', GUESS.little, { x: 78, y: 14 }),
        note('even', GUESS.even, { x: 30, y: 36 }),
        note('most', GUESS.most, { x: 78, y: 36 })
      ],
      fixtures: [clipFixture('clip', { x: 124, y: 55 }, 'hill', { title: 'ΔG° and the wells', dG: -4, h: 32 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 36, h: 14 } }] }
    }, { h: 78 }),
    hints: [
      'Lay one of the four cards in the slot.',
      'Think about what a positive ΔG° means for how far a reaction runs.',
      'Commit to the card closest to what you expect the settled vessel to hold.'
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
      body: 'Next, three vessels of different reactions are settled, and their ΔG° cards are laid on them.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-sign',
    title: 'ΔG° and Where a Vessel Settles',
    get prompt() {
      const g = recall(QUEST_KEY);
      return g && GUESS[g] ? `You predicted "${GUESS[g]}". Which ΔG° belongs to which vessel?` : 'Which ΔG° belongs to which vessel?';
    },
    widget,
    table: pansTable({
      pieces: [
        tag('tm3', CARD_LABEL.tm3, { x: 38, y: 66.5 }),
        tag('t8', CARD_LABEL.t8, { x: 75, y: 66.5 }),
        tag('t2', CARD_LABEL.t2, { x: 112, y: 66.5 })
      ],
      fixtures: PANS2.map((p, i) => kbarsFixture(p.id, { x: 24 + i * 50, y: 23 }, { title: `Vessel ${i + 1}`, sys: MODEL_PAN, cols: [{ dG: p.dG }], w: 44, h: 42 })),
      zones: {
        slots: PANS2.map((p, i) => ({ id: `s${i + 1}`, label: `Vessel ${i + 1} card`, at: { x: 24 + i * 50, y: 51 }, size: { w: 26, h: 9 } }))
      }
    }, { h: 74 }),
    hints: [
      'Press "Run" on each vessel, then lay a ΔG° card in each slot.',
      'Compare how much product each vessel holds with the ΔG° on the cards.',
      'A more negative ΔG° means more product when settled.'
    ],
    check(state) {
      const t = state.table;
      const laid = PANS2.map((p, i) => pieceIn(t, `s${i + 1}`));
      if (laid.some(c => !c)) return { ok: false, notYet: true, msg: 'Lay a card on each vessel.' };
      const bad = PANS2.findIndex((p, i) => laid[i].id !== CARD_OF[p.id]);
      if (bad < 0) return { ok: true };
      const r = read2(PANS2[bad].dG);
      return { ok: false, msg: `Vessel ${bad + 1} settles with ${amt(r.amounts.B)} mol/L of product and ${amt(r.amounts.A)} mol/L of reactant, and the card on it reads ${CARD_LABEL[laid[bad].id]}.` };
    },
    get reward() {
      const g = recall(QUEST_KEY);
      const r8 = read2(DG_PREDICT);
      const verdict = !g || !GUESS[g] ? '' : g === 'little' ? `You predicted a little product, and the +${DG_PREDICT} vessel held ${amt(r8.amounts.B)} mol/L. ` : g === 'none' ? `You predicted no product, but the +${DG_PREDICT} vessel held ${amt(r8.amounts.B)} mol/L. ` : `The +${DG_PREDICT} vessel held ${amt(r8.amounts.B)} mol/L of product, which is not what you predicted. `;
      return {
        log: 'The lower the ΔG°, the more product the vessel held.',
        title: 'ΔG° Sets K',
        body: `${verdict}The more negative the ΔG°, the more product the vessel holds. A positive ΔG° gives less product than reactant, but never none.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-typed-k',
    title: 'K From ΔG°',
    briefing: {
      speaker: 'Vess',
      body: 'ΔG° and K are tied by K = e^(−ΔG° ÷ RT), where R is 8.314 J/(mol·K), T is kelvin (298 K = 25 °C), and ΔG° is in joules. Use exp(x) on the calculator.',
      worked: [
        'For ΔG° = −5.0 kJ/mol at 298 K:',
        '−ΔG° = 5000 J/mol',
        'RT = 8.314 × 298 = 2478 J/mol',
        '5000 ÷ 2478 = 2.02',
        'K = exp(2.02) = 7.5'
      ]
    },
    prompt: `What is K for a reaction with ΔG° = ${fmt1(DG_TYPED).replace('+', '')} kJ/mol at ${T_BENCH} K?`,
    entry: { id: 'k', label: 'K', unit: '' },
    widget,
    table: pansTable({
      fixtures: [
        kbarsFixture('a', { x: 26, y: 25 }, { title: 'Vessel A', sys: MODEL_PAN, cols: [{ dG: K_PANS[0] }], showDG: true }),
        kbarsFixture('b', { x: 76, y: 25 }, { title: 'Vessel B', sys: MODEL_PAN, cols: [{ dG: K_PANS[1] }], showDG: true }),
        plaqueFixture('given', 'Given', { x: 126, y: 18 }, ['ΔG° = −RT ln K', 'R = 8.314 J/(mol·K)', `T = ${T_BENCH} K`, 'Standard states'], { w: 44 })
      ]
    }),
    hints: [
      'Use the calculator and the answer box.',
      'Turn −10.0 kJ/mol into joules first to match R = 8.314 J/(mol·K).',
      'Divide −ΔG° in J/mol by RT, then take exp of that number.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'k');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type K as a number above zero.' };
      if (Math.abs(v - K_TYPED) / K_TYPED <= 0.02) return { ok: true };
      const ks = K_PANS.map(d => settledAt(MODEL_PAN, d, T_BENCH).K);
      const reads = `Vessel A at ${fmt1(K_PANS[0])} kJ/mol and Vessel B at ${fmt1(K_PANS[1])} kJ/mol settle with K ${sigK(ks[0])} and ${sigK(ks[1])}.`;
      if (Math.abs(Math.log(v)) < 0.05) return { ok: false, msg: `A K of ${v} would leave a vessel with about equal amounts of reactant and product, and both vessels on the bench hold far more product than reactant.` };
      if (v < 1) return { ok: false, msg: `A K of ${v} would leave a vessel with more reactant than product, and both vessels on the bench hold more product than reactant.` };
      return { ok: false, msg: `${reads} A K of ${v} does not follow the same pattern at ${fmt1(DG_TYPED)} kJ/mol.` };
    },
    reward: {
      log: 'K came from ΔG° with ΔG° = −RT ln K.',
      title: 'ΔG° and K',
      body: 'K is 57. A ΔG° of zero would give K = 1, and each step more negative multiplies K.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-salts',
    title: 'Salts in Water',
    prompt: `Which salt has a negative ΔG of dissolving at ${T_BENCH} K?`,
    widget,
    table: pansTable({
      fixtures: [
        ...SALT_ORDER.map((id, i) => pickable(pullsFixture(`s${i + 1}`, { x: 24 + i * 50, y: 21 }, { title: `Salt ${i + 1}`, change: { dH: DISSOLVE[id].dH, dS: DISSOLVE[id].dS }, range: SALT_RANGE }), i + 1)),
        choiceFixture('pick', 'Negative ΔG', { x: 75, y: 52 }, { options: ['Salt 1', 'Salt 2', 'Salt 3', ' '], start: 4, w: 56 })
      ]
    }),
    hints: [
      'Compare the ΔH and TΔS bars of each salt, then tap the salt you choose.',
      'Remember ΔG = ΔH − TΔS.',
      'Look for the salt whose TΔS bar reaches past its ΔH bar.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Tap one to choose it.' };
      if (v === SALT_ANSWER) return { ok: true };
      const s = pulls({ ...DISSOLVE[SALT_ORDER[v - 1]], T: T_BENCH });
      return { ok: false, msg: `Salt ${v} has ΔH ${fmt1(s.dH)} kJ/mol and TΔS ${fmt1(s.TdS)} kJ/mol.` };
    },
    get reward() {
      const g = id => pulls({ ...DISSOLVE[id], T: T_BENCH });
      return {
        log: 'Salt 2 had a negative ΔG because TΔS outweighed ΔH.',
        title: 'Dissolving Is a ΔG Question',
        body: `Salt 2, sodium chloride, takes in heat but its TΔS is larger, so ΔG is ${fmt1(g('nacl').dG)} kJ/mol and it dissolves. For the other two ΔG is large and positive, and very little dissolves.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-cold',
    title: 'A Cold Pack',
    prompt: 'Why does this salt dissolve although it cools the water?',
    widget,
    table: pansTable({
      pieces: [
        note('cw2', 'Dissolving only happens when it gives out heat', { x: 26, y: 60 }),
        note('cw1', 'TΔS is larger than the heat taken in', { x: 76, y: 60 }),
        note('cw3', 'The salt dissolved without taking in any heat', { x: 126, y: 60 })
      ],
      fixtures: [
        pullsFixture('cup', { x: 42, y: 24 }, { title: 'Salt in water', change: { dH: DISSOLVE.nh4cl.dH, dS: DISSOLVE.nh4cl.dS }, range: SALT_RANGE, water: PACK, w: 80, h: 36 })
      ],
      zones: { slots: [{ id: 'why', label: 'What the beaker shows', at: { x: 122, y: 22 }, size: { w: 36, h: 14 } }] }
    }, { h: 72 }),
    hints: [
      'Press "Run" on the beaker, then lay a card in the slot.',
      'Compare the ΔH and TΔS bars with what the thermometer and the salt left report.',
      'The salt only dissolves if ΔH − TΔS is negative, even though heat is taken in.'
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
        body: `The salt took in ${NH4.dH.toFixed(1)} kJ/mol, so the water cooled, but TΔS was ${NH4.TdS.toFixed(1)} kJ/mol, so ΔG was negative.`
      };
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-couple',
    title: 'Two Reactions Together',
    briefing: 'ATP is the molecule cells use to carry energy. Splitting it into ADP and phosphate has a ΔG° of −30.5 kJ/mol.',
    prompt: 'Which reactions add up to glucose + ATP → glucose-6-phosphate + ADP?',
    widget,
    table: pansTable({
      pieces: [
        eqn('g6p', { x: 25.5, y: 10 }, COUPLE.g6p.lhs, COUPLE.g6p.rhs, COUPLE.g6p.dG, { symbol: 'ΔG°' }),
        eqn('pcr', { x: 25.5, y: 23 }, COUPLE.pcr.lhs, COUPLE.pcr.rhs, COUPLE.pcr.dG, { symbol: 'ΔG°' }),
        eqn('atp', { x: 25.5, y: 36 }, COUPLE.atp.lhs, COUPLE.atp.rhs, COUPLE.atp.dG, { symbol: 'ΔG°' })
      ],
      fixtures: [
        stackFixture('wanted', { x: 126, y: 32 }, { tray: 'stack', target: { lhs: [[1, 'glucose'], [1, 'ATP']], rhs: [[1, 'glucose-6-phosphate'], [1, 'ADP']] }, w: 48, h: 48, symbol: 'ΔG°', ladder: { lo: -35, hi: 20 } }),
        plaqueFixture('ph', 'Given', { x: 26, y: 58 }, ['ΔG° at pH 7 and 298 K', 'Pi is phosphate'], { w: 44 })
      ],
      zones: { trays: [{ id: 'stack', label: 'The stack', at: { x: 76, y: 33 }, size: { w: 50, h: 52 }, cell: 48, cellH: 13 }] }
    }, { h: 78 }),
    hints: [
      'Drag two reaction cards into the stack tray.',
      'Look for a substance that stands on opposite sides of the two cards so it cancels.',
      'Stack the cards whose remaining reactants and products match glucose + ATP → glucose-6-phosphate + ADP.'
    ],
    check(state) {
      const t = state.table;
      const r = stackRead(t, 'wanted');
      if (r.empty) return { ok: false, notYet: true, msg: 'Stack the cards first.' };
      if (!r.matches) return { ok: false, msg: `The stack adds up to a different reaction from the one wanted: ${stackGap(t, 'wanted')}.` };
      return { ok: true };
    },
    get reward() {
      const pair = coupledPair(COUPLE.atp.dG, COUPLE.g6p.dG);
      return {
        log: 'Pairing the two reactions made a net ΔG° below zero.',
        title: 'Coupled Reactions',
        body: `Adding phosphate to glucose has ΔG° of ${fmt1(COUPLE.g6p.dG)} kJ/mol; added to ATP splitting at ${fmt1(COUPLE.atp.dG)}, the pair nets ${fmt1(pair.dG)} and runs. This is a coupled reaction.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-sealed',
    title: 'Three Reactions',
    prompt: `Which reaction settles with the most product at ${T_BENCH} K?`,
    widget,
    table: pansTable({
      fixtures: [
        ...REACTIONS8.map((c, i) => pickable(pullsFixture(`x${i + 1}`, { x: 24 + i * 50, y: 21 }, { title: `Reaction ${i + 1}`, change: c, range: [-50, 70] }), i + 1)),
        choiceFixture('pick', 'Most product', { x: 75, y: 52 }, { options: ['Reaction 1', 'Reaction 2', 'Reaction 3', ' '], start: 4, w: 56 })
      ]
    }),
    hints: [
      'Compare the ΔH and TΔS bars of each reaction, then tap the reaction you choose.',
      'Compare both bars together, not ΔH alone.',
      'ΔG° decides where a vessel settles, and it is made of both bars.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 4) return { ok: false, notYet: true, msg: 'Tap one to choose it.' };
      if (v === ANSWER8) return { ok: true };
      const a = pulls({ ...REACTIONS8[v - 1], T: T_BENCH }); const b = pulls({ ...REACTIONS8[ANSWER8 - 1], T: T_BENCH });
      return { ok: false, msg: `Reaction ${v} has ΔH ${fmt1(a.dH)} and TΔS ${fmt1(a.TdS)} kJ/mol; Reaction ${ANSWER8} has ΔH ${fmt1(b.dH)} and TΔS ${fmt1(b.TdS)} kJ/mol.` };
    },
    reward: {
      log: 'The lowest ΔG settled with the most product.',
      title: 'Free Energy Decides',
      body: 'The reaction with the most negative ΔH − TΔS has the largest K, even though it takes in heat. ΔG° says where a vessel settles, not how fast.'
    }
  }
];

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = {
  title: 'Free Energy and K',
  body: 'ΔG° sets K: the lower it is, the more product a vessel holds when it settles.'
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
  [dial('pick', 'value', SALT_ANSWER)],
  [run('cup'), put('cw1', 'slot:why')],
  [...stack('atp', 'g6p')],
  [dial('pick', 'value', ANSWER8)]
];

export const MISSES = [
  [],
  [...runAll('p1', 'p2', 'p3'), put('t8', 'slot:s1'), put('tm3', 'slot:s2'), put('t2', 'slot:s3')],
  [...runAll('a', 'b'), typed('k', '1')],
  [dial('pick', 'value', 1)],
  [run('cup'), put('cw2', 'slot:why')],
  [...stack('pcr', 'g6p')],
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
