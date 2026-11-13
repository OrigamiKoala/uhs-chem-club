/**
 * Unit 8 · Bench 4 — Combining K (q4-properties)
 *
 * Teeter's K-rule bench, on the pans kit (`table/kits/pans.js`, `pans-ratio.js`, `pans-cards.js`). Four stages on real reactions:
 *
 *   1  The Same Vessel, Written Backwards (N₂O₄ ⇌ 2 NO₂ vs 2 NO₂ ⇌ N₂O₄ on the ratio board) -> 1/K
 *   2  PREDICT: what happens to K when every coefficient in H₂ + I₂ ⇌ 2 HI is doubled?
 *   3  Every Coefficient Doubled (observe HI on K reader, answer 2 SO₂ + O₂ ⇌ 2 SO₃ doubled)  -> K²
 *   4  Two Reactions in a Row (observe N₂ + O₂ ⇌ 2 NO and 2 NO + O₂ ⇌ 2 NO₂, answer water-gas) -> K₁ × K₂
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { pansTable, note, pieceIn } from '../../table/kits/pans.js';
import { vesselFixture, rigParts, tile, rigRead } from '../../table/kits/pans-ratio.js';
import { rxnCard, kTile, checkFixture, checkLog, fmtRxn } from '../../table/kits/pans-cards.js';
import { Q4, fmtK, kScale, kAdd, netOfCards } from '../../engine/eqdata.js';
import { clipFixture } from '../../table/kits/pans-clips.js';

export const meta = { stageCount: 4 };

export const VOCABULARY = [];

export const BUILDS_ON = ['unit08/q2-k'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit08/q4-properties';
const GUESS = {
  doubles: 'K doubles',
  same: 'K stays the same',
  squares: 'K is multiplied by itself',
  halves: 'K is halved'
};
const TALL = { h: 74 };

/* ------------------------------------------------------------------ the numbers */

const T1 = { right: '6.70', a: '−0.150', b: '0.850', c: '0.0225' };
const T3 = { right: fmtK(kScale(Q4.so3.K, 2)), a: fmtK(2 * Q4.so3.K), b: fmtK(Q4.so3.K), c: fmtK(Q4.so3.K / 2) };
const K4 = kAdd(Q4.wg1.K, Q4.wg2.K);
const T4 = { right: fmtK(K4), a: fmtK(Q4.wg1.K + Q4.wg2.K), b: fmtK(Q4.wg1.K / Q4.wg2.K), c: fmtK(Q4.wg1.K - Q4.wg2.K) };

/* ------------------------------------------------------------------ layout */

const CARD_X = 26;
const TILE_AT = [{ x: 121, y: 34 }, { x: 139, y: 34 }, { x: 121, y: 48 }, { x: 139, y: 48 }];
const tiles = (labels) => labels.map((l, i) => kTile(`t${i + 1}`, l, TILE_AT[i]));
const CHK_TRAY = { id: 'chk', label: 'On the K reader', at: { x: 82, y: 14 }, size: { w: 58, h: 14 }, cell: 50, cellH: 13 };
const answerSlot = label => ({ id: 'ans', label, at: { x: 130, y: 14 }, size: { w: 34, h: 11 } });
const checkAt = (mix, order, y = 44, h = 36) => checkFixture('check', { x: 82, y }, { tray: 'chk', mix, order, w: 58, h, title: 'K reader' });

const readOf = (t, eq) => checkLog(t, 'check').find(e => e.eq === eq)?.k ?? null;

function tileCheck(state, want, why) {
  const t = state.table;
  const tile = pieceIn(t, 'ans');
  if (!tile) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
  if (tile.label === want) return { ok: true };
  return { ok: false, msg: why(t, tile) };
}

const eqOf = (card, o = {}) => fmtRxn(netSidesOf(card, o));
function netSidesOf(card, { flipped = false, scale = 1 } = {}) {
  const net = netOfCards([{ ...card, flipped, scale }]);
  const lhs = Object.entries(net).filter(([, n]) => n < 0).map(([s, n]) => [-n, s]);
  const rhs = Object.entries(net).filter(([, n]) => n > 0).map(([s, n]) => [n, s]);
  return { lhs, rhs };
}

const guessLine = () => { const g = recall(QUEST_KEY); return g && GUESS[g] ? g : null; };

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const rig = rigParts('rig', { x: 56, y: 62 }, { vsl: 'pans', top: 2, bottom: 2, w: 104 });
    return {
      id: 's1-reverse',
      title: 'The Same Vessel, Written Backwards',
      prompt: 'What is K for 2 NO₂ ⇌ N₂O₄ in this same settled vessel?',
      widget,
      table: pansTable({
        pieces: [
          tile('t-NO21', 'n2o4_rev', 'NO2', 1, { x: 118, y: 31 }),
          tile('t-NO22', 'n2o4_rev', 'NO2', 2, { x: 138, y: 31 }),
          tile('t-N2O41', 'n2o4_rev', 'N2O4', 1, { x: 118, y: 45 }),
          ...[T1.a, T1.right, T1.b, T1.c].map((l, i) => kTile(`t${i + 1}`, l, [{ x: 118, y: 59 }, { x: 138, y: 59 }, { x: 118, y: 73 }, { x: 138, y: 73 }][i]))
        ],
        fixtures: [
          vesselFixture('pans', { x: 56, y: 21 }, { system: 'n2o4_rev', pans: [{ start: { N2O4: 0.3 } }], settled: true, showEq: true, showK: true, w: 104, titles: ['Settled vessel (298 K)'] }),
          rig.fixture
        ],
        zones: { slots: [...rig.slots, answerSlot('K of 2 NO₂ ⇌ N₂O₄')] }
      }, { h: 86 }),
      hints: [
        'Place the particle cards on the ratio board for 2 NO₂ ⇌ N₂O₄, then lay the matching K card in the slot.',
        'For 2 NO₂ ⇌ N₂O₄, N₂O₄ is the product and NO₂ is the reactant.',
        'Compare the ratio board reading for N₂O₄ ÷ NO₂² with the reading for NO₂² ÷ N₂O₄.'
      ],
      check(state) {
        return tileCheck(state, T1.right, t => {
          const r = rigRead(t, 'rig');
          return r.laid
            ? `The ratio board reads ${fmtK(r.readings[0])} for that arrangement; N₂O₄ ÷ NO₂² gives K for 2 NO₂ ⇌ N₂O₄.`
            : 'Place N₂O₄ and NO₂² on the ratio board to read the reversed K.';
        });
      },
      reward: {
        log: 'The reversed reaction had K = 1 ÷ 0.15 = 6.7.',
        title: 'K of the Reverse Reaction',
        body: 'The vessel is the same; only the ratio is written the other way up, so the new K is 1 ÷ 0.15 = 6.7.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Doubling a Reaction',
    predict: true,
    prompt: 'What happens to K when every coefficient in H₂ + I₂ ⇌ 2 HI is doubled?',
    widget,
    table: pansTable({
      pieces: [note('doubles', GUESS.doubles, { x: 30, y: 14 }), note('same', GUESS.same, { x: 78, y: 14 }), note('squares', GUESS.squares, { x: 30, y: 36 }), note('halves', GUESS.halves, { x: 78, y: 36 })],
      fixtures: [clipFixture('clip', { x: 124, y: 55 }, 'react', { title: 'A settled vessel', from: 110, kf: 0.1, kr: 0.05, seed: 6, span: 36, h: 32 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 36, h: 14 } }] }
    }, { h: 78 }),
    hints: [
      'Drag one of the four prediction cards into the slot.',
      'Think about what doubling every coefficient does to the powers in K.',
      'K is a ratio of powers; decide what doubling every power does to that ratio.'
    ],
    check(state) {
      if (!pieceIn(state.table, 'guess')) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = pieceIn(state.table, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Prediction',
      body: 'Next, the K reader measures a reaction with every coefficient doubled.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-double',
    title: 'Every Coefficient Doubled',
    get prompt() {
      const g = guessLine();
      const q = 'What is K for 4 SO₂ + 2 O₂ ⇌ 4 SO₃ when K is 280 for 2 SO₂ + O₂ ⇌ 2 SO₃?';
      return g ? `You predicted "${GUESS[g]}". ${q}` : q;
    },
    widget,
    table: pansTable({
      pieces: [
        rxnCard('p', { x: CARD_X, y: 12 }, Q4.hi),
        rxnCard('r', { x: CARD_X, y: 28 }, Q4.so3),
        ...tiles([T3.a, T3.b, T3.right, T3.c])
      ],
      fixtures: [checkAt(Q4.mixHI, ['H₂', 'I₂', 'HI'])],
      zones: { trays: [CHK_TRAY], slots: [answerSlot('K of 4 SO₂ + 2 O₂ ⇌ 4 SO₃')] }
    }, TALL),
    hints: [
      'Lay H₂ + I₂ ⇌ 2 HI on the K reader, press "Larger" while holding it, and press "Read K".',
      'Compare the K the reader gives for H₂ + I₂ ⇌ 2 HI with the K for 2 H₂ + 2 I₂ ⇌ 4 HI.',
      'See how 54 changed when doubled, then apply that same change to 280.'
    ],
    check(state) {
      return tileCheck(state, T3.right, t => {
        const eq = eqOf(Q4.hi, { scale: 2 });
        const k = readOf(t, eq);
        return k ? `The K reader gave ${k} for ${eq} (from 54); that card does not apply the same change to 280.` : 'The K reader has not read a doubled card yet.';
      });
    },
    get reward() {
      const g = guessLine();
      const said = !g ? '' : g === 'squares' ? 'You predicted K would be multiplied by itself, and the reader agreed. ' : g === 'doubles' ? 'You predicted K would double; the reader gave 54 × 54 instead. ' : 'The reader did not agree with your prediction, which is how a guess gets better. ';
      return {
        log: 'Doubling every coefficient squared K.',
        title: 'K to a Power',
        body: `${said}Doubling every coefficient doubles every power in the ratio, so K is squared: 280 × 280 = 78,400. The mixture itself is no different.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's5-add',
    title: 'Two Reactions in a Row',
    prompt: 'What is K for C(s) + 2 H₂O ⇌ CO₂ + 2 H₂?',
    widget,
    table: pansTable({
      pieces: [
        rxnCard('c1', { x: CARD_X, y: 8 }, Q4.no1),
        rxnCard('c2', { x: CARD_X, y: 22 }, Q4.no2),
        rxnCard('x', { x: CARD_X, y: 38 }, Q4.wg1),
        rxnCard('y', { x: CARD_X, y: 52 }, Q4.wg2),
        ...tiles([T4.a, T4.c, T4.right, T4.b])
      ],
      fixtures: [checkAt(Q4.mixNO, ['N₂', 'O₂', 'NO', 'NO₂'], 52, 32)],
      zones: { trays: [{ ...CHK_TRAY, at: { x: 82, y: 19 }, size: { w: 58, h: 24 } }], slots: [answerSlot('K of net reaction')] }
    }, TALL),
    hints: [
      'Lay both N₂ + O₂ ⇌ 2 NO and 2 NO + O₂ ⇌ 2 NO₂ on the K reader and press "Read K".',
      'Compare the K of the pair (1.00) with the two printed K values (4.00 and 0.250).',
      'Combine 2.50 and 1.40 the same way the K reader combined 4.00 and 0.250.'
    ],
    check(state) {
      return tileCheck(state, T4.right, t => {
        const k = readOf(t, 'N₂ + 2 O₂ ⇌ 2 NO₂');
        return k ? `The K reader gave ${k} for the pair (4.00 and 0.250); that card does not combine 2.50 and 1.40 the same way.` : 'The K reader has not read the two cards together yet.';
      });
    },
    reward: {
      log: 'Two added reactions multiplied their K values.',
      title: 'Adding Reactions',
      body: 'The CO made by the first step is used by the second, so it cancels from the reaction and from the ratio: K is K₁ × K₂.'
    }
  }
];

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = {
  title: 'Combining K',
  body: 'Flip a reaction and K becomes 1 ÷ K; double it and K is squared; add two reactions and their K values multiply.'
};

const put = (piece, to) => ({ place: { piece, to } });
const scale = (piece, factor = 2) => ({ scale: { piece, factor } });

export const SOLUTIONS = [
  [put('t-N2O41', 'slot:rig.t1'), put('t-NO22', 'slot:rig.b1'), put('t2', 'slot:ans')],
  [put('squares', 'slot:guess')],
  [put('p', 'tray:chk'), scale('p', 2), { run: 'check' }, put('t3', 'slot:ans')],
  [put('c1', 'tray:chk'), put('c2', 'tray:chk'), { run: 'check' }, put('t3', 'slot:ans')]
];

export const MISSES = [
  [put('t1', 'slot:ans')],
  [],
  [put('p', 'tray:chk'), scale('p', 2), { run: 'check' }, put('t1', 'slot:ans')],
  [put('c1', 'tray:chk'), put('c2', 'tray:chk'), { run: 'check' }, put('t1', 'slot:ans')]
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

export const CHECKS = { T1, T3, T4, K4 };
