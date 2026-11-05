/**
 * Unit 8 · Bench 4 — Combining K (q4-properties)
 *
 * Teeter's card-sorting house, on the pans kit (`table/kits/pans.js`, `pans-cards.js`). A reaction can be written in many ways; the K of
 * each way is a different number. The pan check holds a sealed mixture at equilibrium, and its "Read K" key gives the K of whatever
 * reaction the cards on it make, as the ratio of the amounts in the bars. Eight stages and ONE click: the belief that writing a reaction
 * twice as large doubles its K.
 *
 *   1  flip a card on the check, then give the K of a card the check cannot read     -> 1/K for the reverse reaction
 *   2  PREDICT: what does writing the reaction twice as large do to K?
 *   3  TEST: double a card on the check, then a card it cannot read                  -> K raised to a power
 *   4  a card written half as large (K given for the doubled card)                  -> the square root
 *   5  two cards on the check, then two it cannot read                                -> the K of two added reactions is the product
 *   6  stack three cards into a wanted reaction                                       -> flip, enlarge, cancel
 *   7  a stack that is already built: its K from the printed K values                 -> rules as shorthand
 *   8  typed: the K of a wanted reaction from two printed K values
 *
 * THE WRONG MODEL IS ON THE TABLE. The prediction offers "K doubles"; the check reads the doubled card at K squared.
 *
 * Substances are letters (A, B, C ...): the rules of K do not depend on the chemistry. The K printed on a card is a given; the K of a
 * rewritten card is never printed, it is read from the mixture. Stage 5 of the spec ("Kp from Kc", beyond the exam) is not built.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { pansTable, note, pieceIn } from '../../table/kits/pans.js';
import { rxnCard, kTile, checkFixture, stackFixture, stackMatches, stackCards, checkLog, fmtRxn } from '../../table/kits/pans-cards.js';
import { Q4, fmtK, kReverse, kScale, kAdd, kOfCardByRule, netOfCards } from '../../engine/eqdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [];

/** K itself is q2's; this bench only rewrites it. */
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
const TALL = { h: 70 };

/* ------------------------------------------------------------------ the numbers (all from engine/eqdata.js) */

const neg = k => `−${fmtK(k)}`;
const T1 = { right: fmtK(kReverse(Q4.flipOne.K)), a: neg(Q4.flipOne.K), b: fmtK(1 - Q4.flipOne.K), c: fmtK(Q4.flipOne.K * Q4.flipOne.K) };
const T3 = { right: fmtK(kScale(Q4.doubleOne.K, 2)), a: fmtK(2 * Q4.doubleOne.K), b: fmtK(Q4.doubleOne.K), c: fmtK(Q4.doubleOne.K / 2) };
const K4 = kScale(Q4.halfOne.K, 0.5);
const T4 = { right: fmtK(K4), a: fmtK(Q4.halfOne.K / 2), b: fmtK(2 * Q4.halfOne.K), c: fmtK(kScale(Q4.halfOne.K, 2)) };
const K5 = kAdd(Q4.addX.K, Q4.addY.K);
const T5 = { right: fmtK(K5), a: fmtK(Q4.addX.K + Q4.addY.K), b: fmtK(Q4.addX.K / Q4.addY.K), c: fmtK(Q4.addX.K - Q4.addY.K) };
const K7 = kAdd(kOfCardByRule(Q4.readA, { scale: Q4.readA.scale }), kOfCardByRule(Q4.readB, { flipped: true }));
const T7 = {
  right: fmtK(K7),
  a: fmtK(kAdd(kScale(Q4.readA.K, 2), Q4.readB.K)),
  b: fmtK(kAdd(Q4.readA.K, kReverse(Q4.readB.K))),
  c: fmtK(kScale(Q4.readA.K, 2) + kReverse(Q4.readB.K))
};
const K8 = kAdd(kScale(Q4.typedA.K, 2), kReverse(Q4.typedB.K));

const TARGET6 = { A: -2, B: -2, D: 2 };
const WANT6 = '2 A + 2 B ⇌ 2 D';
const WANT8 = '2 A ⇌ C';

/* ------------------------------------------------------------------ layout */

const CARD_X = 26;
const TILE_AT = [{ x: 121, y: 34 }, { x: 139, y: 34 }, { x: 121, y: 48 }, { x: 139, y: 48 }];
const tiles = (labels) => labels.map((l, i) => kTile(`t${i + 1}`, l, TILE_AT[i]));
const CHK_TRAY = { id: 'chk', label: 'On the check', at: { x: 82, y: 14 }, size: { w: 58, h: 14 }, cell: 50, cellH: 13 };
const answerSlot = label => ({ id: 'ans', label, at: { x: 130, y: 14 }, size: { w: 34, h: 11 } });
const checkAt = (mix, order, y = 44, h = 36) => checkFixture('check', { x: 82, y }, { tray: 'chk', mix, order, w: 58, h });

/** What the check has read for an equation: its K as printed, or null. */
const readOf = (t, eq) => checkLog(t, 'check').find(e => e.eq === eq)?.k ?? null;

/** A tile stage: a tile in the slot, the right one passes, a wrong one is refused with what the check has shown. */
function tileCheck(state, want, why) {
  const t = state.table;
  const tile = pieceIn(t, 'ans');
  if (!tile) return { ok: false, notYet: true, msg: 'Lay a tile in the slot.' };
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
  {
    id: 's1-reverse',
    title: 'The Other Way Round',
    prompt: 'Lay the K tile for E ⇌ 2 D, which is the card 2 D ⇌ E written in the reverse direction.',
    widget,
    table: pansTable({
      pieces: [
        rxnCard('p', { x: CARD_X, y: 12 }, Q4.P),
        rxnCard('q', { x: CARD_X, y: 28 }, Q4.flipOne),
        ...tiles([T1.b, T1.right, T1.a, T1.c])
      ],
      fixtures: [checkAt(Q4.mixP, ['A', 'B', 'C'])],
      zones: { trays: [CHK_TRAY], slots: [answerSlot('K of E ⇌ 2 D')] }
    }, TALL),
    hints: [
      'Use the pan check with "Read K", the "Flip" key while you hold a card, and the tiles.',
      'Compare the K the check reads for A + B ⇌ C as it is written with the K it reads when the card is flipped.',
      'Find how the K changed when the card was flipped, then make that same change to the K printed on the other card.'
    ],
    check(state) {
      return tileCheck(state, T1.right, t => {
        const eq = eqOf(Q4.P, { flipped: true });
        const k = readOf(t, eq);
        return k ? `The check read ${eq} at K ${k} when A + B ⇌ C, printed with K ${fmtK(Q4.P.K)}, was flipped; that tile does not make the same change to the K on 2 D ⇌ E.` : 'The check has not read a flipped card yet.';
      });
    },
    reward: {
      log: 'A flipped card read at one over its K.',
      title: 'K of the Reverse Reaction',
      body: 'Writing a reaction the other way round swaps its products and reactants in the ratio, so the new K is 1 divided by the old K. The mixture is the same; only the way the reaction is written changed.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Doubling a Reaction',
    // A PREDICT STAGE: no check, no card, no tile. The guess comes back with the test.
    predict: true,
    prompt: 'What happens to the K of A + B ⇌ C when every amount in it is doubled?',
    widget,
    table: pansTable({
      pieces: [note('doubles', GUESS.doubles, { x: 30, y: 14 }), note('same', GUESS.same, { x: 78, y: 14 }), note('squares', GUESS.squares, { x: 30, y: 36 }), note('halves', GUESS.halves, { x: 78, y: 36 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the four cards and the slot.',
      'Think about whether doubling every amount in the same reaction changes the mixture or only the way it is written.',
      'K is a ratio of amounts, so work out what that ratio becomes when every amount in it is doubled.'
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
      body: 'Next, the pan check reads the K of a card with every amount doubled.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-double',
    title: 'Every Amount Doubled',
    get prompt() {
      const g = guessLine();
      return g ? `You predicted "${GUESS[g]}". Lay the tile for the K of F + G ⇌ H when every amount in it is doubled.` : 'Lay the tile for the K of F + G ⇌ H when every amount in it is doubled.';
    },
    widget,
    table: pansTable({
      pieces: [
        rxnCard('p', { x: CARD_X, y: 12 }, Q4.P),
        rxnCard('r', { x: CARD_X, y: 28 }, Q4.doubleOne),
        ...tiles([T3.a, T3.b, T3.right, T3.c])
      ],
      fixtures: [checkAt(Q4.mixP, ['A', 'B', 'C'])],
      zones: { trays: [CHK_TRAY], slots: [answerSlot('K of F + G ⇌ H')] }
    }, TALL),
    hints: [
      'Use the pan check with "Read K", the "Larger" key while you hold a card, and the tiles.',
      'Compare the K the check reads for A + B ⇌ C as it is written with the K it reads when every amount in the card is doubled.',
      'Find how the K changed when every amount was doubled, then make that same change to the K printed on the other card.'
    ],
    check(state) {
      return tileCheck(state, T3.right, t => {
        const eq = eqOf(Q4.P, { scale: 2 });
        const k = readOf(t, eq);
        return k ? `The check read ${eq} at K ${k}, and A + B ⇌ C is printed with K ${fmtK(Q4.P.K)}; that tile does not make the same change to the K on F + G ⇌ H.` : 'The check has not read a card made larger yet.';
      });
    },
    get reward() {
      const g = guessLine();
      const said = !g ? '' : g === 'squares' ? 'You predicted the K would be multiplied by itself, and the check agreed. ' : g === 'doubles' ? 'You predicted K would double; the check read the doubled card at a very different number. ' : 'The check did not agree with your prediction, which is how a guess gets better. ';
      return {
        log: 'A card with every amount doubled read at K squared.',
        title: 'K to a Power',
        body: `${said}Multiplying every amount in a reaction by c raises its K to the power c. Doubling every amount squares K; it does not double it.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-half',
    title: 'Every Amount Halved',
    prompt: 'Lay the K tile for M + N ⇌ W, which is 2 M + 2 N ⇌ 2 W with every amount halved.',
    widget,
    table: pansTable({
      pieces: [
        rxnCard('p', { x: CARD_X, y: 12 }, Q4.P),
        rxnCard('m', { x: CARD_X, y: 28 }, Q4.halfOne),
        ...tiles([T4.b, T4.c, T4.a, T4.right])
      ],
      fixtures: [checkAt(Q4.mixP, ['A', 'B', 'C'])],
      zones: { trays: [CHK_TRAY], slots: [answerSlot('K of M + N ⇌ W')] }
    }, TALL),
    hints: [
      'Use the pan check with "Read K", the "Larger" key while you hold a card, and the tiles.',
      'Read the check for A + B ⇌ C as written and with every amount doubled, and compare the two K values.',
      'Doubling every amount changed K by a rule on the check; the card on the table is already doubled, so undo that change on its printed K.'
    ],
    check(state) {
      return tileCheck(state, T4.right, t => {
        const eq = eqOf(Q4.P, { scale: 2 });
        const k = readOf(t, eq);
        return k ? `The check read ${eq} at K ${k}, and A + B ⇌ C is printed with K ${fmtK(Q4.P.K)}; that tile does not undo that change on the K of 2 M + 2 N ⇌ 2 W.` : 'The check has not read a card made larger yet.';
      });
    },
    reward: {
      log: 'A card with every amount halved read at the square root of its K.',
      title: 'K to a Fraction',
      body: 'Halving every amount in a reaction takes the square root of its K, which undoes the squaring that doubling does. Multiplying every amount by c raises K to the power c.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-add',
    title: 'Two Reactions in a Row',
    prompt: 'Lay the tile for the K of the reaction X ⇌ Z.',
    widget,
    table: pansTable({
      pieces: [
        rxnCard('c1', { x: CARD_X, y: 8 }, Q4.chain1),
        rxnCard('c2', { x: CARD_X, y: 22 }, Q4.chain2),
        rxnCard('x', { x: CARD_X, y: 38 }, Q4.addX),
        rxnCard('y', { x: CARD_X, y: 52 }, Q4.addY),
        ...tiles([T5.a, T5.c, T5.right, T5.b])
      ],
      fixtures: [checkFixtureTwo()],
      zones: { trays: [{ ...CHK_TRAY, at: { x: 82, y: 21 }, size: { w: 58, h: 28 } }], slots: [answerSlot('K of X ⇌ Z')] }
    }, TALL),
    hints: [
      'Use the pan check with "Read K", the four cards, and the tiles.',
      'Compare the K the check reads for each of A ⇌ B and B ⇌ C alone with the K it reads for both lying on it.',
      'Find how the two single K values combine into the K of the pair, then combine the two cards in the question the same way.'
    ],
    check(state) {
      return tileCheck(state, T5.right, t => {
        const k = readOf(t, 'A ⇌ C');
        return k ? `The check read A ⇌ C at K ${k}, with A ⇌ B printed at K ${fmtK(Q4.chain1.K)} and B ⇌ C at K ${fmtK(Q4.chain2.K)}; that tile does not combine the K values of X ⇌ Y and Y ⇌ Z the same way.` : 'The check has not read two cards lying together yet.';
      });
    },
    reward: {
      log: 'Two added reactions read at the product of their K values.',
      title: 'Adding Reactions',
      body: 'When two reactions add up to a third, the K of the third is the K of one times the K of the other. The substance in the middle cancels from the reaction, and its amount cancels from the ratio.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-stack',
    title: 'Reach the Reaction',
    prompt: `Stack the cards so that they add up to ${WANT6}.`,
    widget,
    table: pansTable({
      pieces: [
        rxnCard('a', { x: CARD_X, y: 12 }, Q4.buildA),
        rxnCard('b', { x: CARD_X, y: 28 }, Q4.buildB),
        rxnCard('c', { x: CARD_X, y: 44 }, Q4.buildC)
      ],
      fixtures: [stackFixture('stack', { x: 130, y: 24 }, { tray: 'stack', wanted: WANT6, w: 40, h: 32 })],
      zones: { trays: [{ id: 'stack', label: 'The stack', at: { x: 80, y: 30 }, size: { w: 56, h: 42 }, cell: 50, cellH: 13 }] }
    }),
    hints: [
      'Use the three cards, the "Flip" and "Larger" keys while you hold a card, and the stack.',
      'Compare what the stack adds up to with the wanted reaction, substance by substance.',
      'A substance must appear once on each side to cancel, so flip a card that has it on the wrong side and multiply cards with "Larger" until the amounts match.'
    ],
    check(state) {
      const t = state.table;
      const cards = stackCards(t, 'stack');
      if (!cards.length) return { ok: false, notYet: true, msg: 'Stack the cards first.' };
      if (stackMatches(t, 'stack', TARGET6)) return { ok: true };
      return { ok: false, msg: 'The stack adds up to a different reaction from the one wanted.' };
    },
    reward: {
      log: 'The stack added up to the wanted reaction.',
      title: 'Cancelling to a Wanted Reaction',
      body: 'To reach a wanted reaction, flip a card to put a substance on the side it is needed, multiply cards with "Larger" until the amounts match, and let what is left over cancel.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-read',
    title: 'A Stack Already Built',
    prompt: 'Lay the tile for the K of the reaction the stack adds up to.',
    widget,
    table: pansTable({
      pieces: [
        rxnCard('s1', { x: 28, y: 14 }, Q4.readA, { zone: 'tray:stack' }),
        rxnCard('s2', { x: 28, y: 28 }, Q4.readB, { zone: 'tray:stack' }),
        ...tiles([T7.a, T7.b, T7.c, T7.right])
      ],
      fixtures: [stackFixture('stack', { x: 82, y: 22 }, { tray: 'stack', wanted: null, w: 50, h: 32 })],
      zones: { trays: [{ id: 'stack', label: 'The stack', at: { x: 28, y: 21 }, size: { w: 54, h: 28 }, cell: 50, cellH: 13 }], slots: [answerSlot('K of the stack')] }
    }),
    hints: [
      'Use the stack, the two cards in it, and the tiles.',
      'Read how each card in the stack has been changed (flipped, multiplied, or both), beside the K it was printed with.',
      'Change each printed K as its card was changed, then combine the changed values the way the cards are combined.'
    ],
    check(state) {
      return tileCheck(state, T7.right, t => {
        const cards = stackCards(t, 'stack');
        const flipped = cards.filter(c => c.flipped).map(c => c.id).join(', ');
        return `The stack holds ${cards.length} cards, ${flipped ? 'one flipped' : 'none flipped'} and one multiplied; that tile does not match the K values printed on them changed to fit.`;
      });
    },
    reward: {
      log: 'The stack read at the product of its changed K values.',
      title: 'Reading a Stack',
      body: 'The K of a stack is the product of its cards\' changed K values: 1 divided by K for a flipped card, and K to the power c for a card written c times as large.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-typed',
    title: 'The Wanted K',
    prompt: `Type the K of the reaction ${WANT8}.`,
    entry: { id: 'k', label: 'K (write 0.0005 as 5e-4)', unit: '' },
    widget,
    table: pansTable({
      pieces: [
        rxnCard('a', { x: CARD_X, y: 12 }, Q4.typedA),
        rxnCard('b', { x: CARD_X, y: 28 }, Q4.typedB)
      ],
      fixtures: [stackFixture('stack', { x: 130, y: 24 }, { tray: 'stack', wanted: WANT8, w: 40, h: 32 })],
      zones: { trays: [{ id: 'stack', label: 'The stack', at: { x: 80, y: 24 }, size: { w: 56, h: 28 }, cell: 50, cellH: 13 }] }
    }),
    hints: [
      'Use the two cards, the "Flip" and "Larger" keys, the stack and the number field.',
      'Compare what the stack adds up to with the wanted reaction to see how each card must be changed.',
      'Change each printed K as its card was changed, then combine the changed values the way the cards are combined.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'k');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the K in the field.' };
      if (Math.abs(v - K8) <= 0.03 * K8) return { ok: true };
      const near = x => Math.abs(v - x) <= 0.03 * x;
      const shown = fmtK(v);
      if (near(kAdd(kScale(Q4.typedA.K, 2), Q4.typedB.K))) return { ok: false, msg: `${shown} uses the K printed on C ⇌ 2 B as it stands, and the wanted reaction has C on the other side.` };
      if (near(kAdd(Q4.typedA.K, kReverse(Q4.typedB.K)))) return { ok: false, msg: `${shown} uses the K printed on A ⇌ B as it stands, and the wanted reaction has 2 A.` };
      if (near(kScale(Q4.typedA.K, 2) + kReverse(Q4.typedB.K))) return { ok: false, msg: `${shown} is the changed K values added together.` };
      return { ok: false, msg: `${shown} is not the K of ${WANT8} from these two cards.` };
    },
    reward: {
      log: 'The K of the wanted reaction came from two printed K values.',
      title: 'K Without a Measurement',
      body: 'The K of a reaction made from other reactions needs no new measurement: flip, enlarge and add the cards, and change the K values by the same rules.'
    }
  }
];

function checkFixtureTwo() {
  return checkFixture('check', { x: 82, y: 53 }, { tray: 'chk', mix: Q4.mixChain, order: ['A', 'B', 'C'], w: 58, h: 34 });
}

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = {
  title: 'Combining K',
  body: 'The K of a rewritten reaction follows from the K of the first by rule: 1 over K when flipped, a power when scaled, a product when added.'
};

const put = (piece, to) => ({ place: { piece, to } });
const flip = piece => ({ flip: piece });
const larger = (piece, factor) => ({ scale: { piece, factor } });
const read = { run: 'check' };

export const SOLUTIONS = [
  [put('p', 'tray:chk'), read, flip('p'), read, put('t2', 'slot:ans')],
  [put('squares', 'slot:guess')],
  [put('p', 'tray:chk'), read, larger('p', 2), read, put('t3', 'slot:ans')],
  [put('p', 'tray:chk'), larger('p', 2), read, put('t4', 'slot:ans')],
  [put('c1', 'tray:chk'), read, put('c2', 'tray:chk'), read, put('t3', 'slot:ans')],
  [put('a', 'tray:stack'), larger('a', 2), put('b', 'tray:stack'), flip('b'), larger('b', 2)],
  [put('t4', 'slot:ans')],
  [put('a', 'tray:stack'), larger('a', 2), put('b', 'tray:stack'), flip('b'), { type: { entry: 'k', value: fmtK(K8) } }]
];

export const MISSES = [
  [put('p', 'tray:chk'), flip('p'), read, put('t1', 'slot:ans')],
  [],
  [put('p', 'tray:chk'), larger('p', 2), read, put('t1', 'slot:ans')],
  [put('p', 'tray:chk'), larger('p', 2), read, put('t1', 'slot:ans')],
  [put('c1', 'tray:chk'), put('c2', 'tray:chk'), read, put('t1', 'slot:ans')],
  [put('a', 'tray:stack'), put('b', 'tray:stack')],
  [put('t1', 'slot:ans')],
  [put('a', 'tray:stack'), larger('a', 2), put('b', 'tray:stack'), { type: { entry: 'k', value: '0.128' } }]
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

export const CHECKS = { K8, K7, K5, K4: K4, T1, T3, T4, T5, T7, WANT6, WANT8, TARGET6 };
