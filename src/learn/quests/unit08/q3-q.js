/**
 * Unit 8 · Bench 3 — Which Way It Goes (q3-q)
 *
 * The test vessel and its gauge (`table/kits/pans-ratio.js`): a mixture card goes in a slot, the vessel shows a bar for each substance and the
 * gauge sets the mixture's ratio (a marker on a scale, a tenfold step to a tick) against the fixed K line. "Run" leaves the mixture alone
 * until it settles. Eight stages and ONE click: the belief that a reaction always runs toward its products.
 *
 *   1  lay the mixture that is already at equilibrium         -> the marker is Q, the ratio of a mixture that may not have settled
 *   2  PREDICT: a mixture with far more B than A              (the held model: it makes still more B)
 *   3  TEST: run it                                           -> it ran toward A: the click
 *   4  lay the mixture that will make more B                  (the equal-looking one does)
 *   5  PREDICT (a new reaction, H₂ + I₂ ⇌ 2 HI, K = 54): a mixture with more HI than either reactant
 *   6  TEST: run it                                           -> it made more HI: Q against K decides, not which amount is larger
 *   7  lay the mixture that will make more NO₂ (2 NO₂ ⇌ N₂O₄, two mixtures have equal pressures and go opposite ways)
 *   8  sealed: three mixtures of 2 SO₂ + O₂ ⇌ 2 SO₃ sorted by the way each goes
 *
 * THE RULE IS NEVER PRINTED. The player runs mixtures and sees where the marker starts, which bars move, and where the marker ends (on the
 * K line); the reward of stage 3 says it once the bench has shown it. The gauge prints numbers (Q and K), not a comparison.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { pansTable, selectorFixture, note, tag, pieceIn, dialValue } from '../../table/kits/pans.js';
import { testVessel, mixCard, qkRead } from '../../table/kits/pans-ratio.js';
import { K_SYSTEMS, runMixture, fmtNum, spName } from '../../engine/eqdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bQ\b/, introducedAt: 1 },
  { term: /\breaction quotient\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit08/q2-k'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const KEY_CLICK = 'unit08/q3-q#click';
const KEY_NEW = 'unit08/q3-q#new';
const AB = K_SYSTEMS.ab;
const HI = K_SYSTEMS.hi;
const NO = K_SYSTEMS.n2o4;
const SO = K_SYSTEMS.so3;

const GUESS_CLICK = {
  more: 'It makes still more B',
  stay: 'It stays as it is',
  back: 'Some of the B turns back into A',
  all: 'All of the B turns back into A'
};
const GUESS_NEW = {
  more: 'It makes more HI',
  back: 'It makes more H₂ and I₂',
  stay: 'It stays as it is'
};

/* ---------------------------------------------------------------- the mixtures (inputs; every figure shown is the planner's) */

const S1 = [
  { id: 'c1', label: 'Mixture 1', amounts: { A: 0.5, B: 1.0 } },
  { id: 'c2', label: 'Mixture 2', amounts: { A: 1.0, B: 0.5 } },
  { id: 'c3', label: 'Mixture 3', amounts: { A: 0.25, B: 1.5 } }
];
const CLICK_MIX = { A: 0.1, B: 1.9 };
const S4 = [
  { id: 'm1', label: 'Mixture 1', amounts: { A: 0.6, B: 0.6 } },
  { id: 'm2', label: 'Mixture 2', amounts: { A: 0.3, B: 1.5 } },
  { id: 'm3', label: 'Mixture 3', amounts: { A: 0.35, B: 0.7 } }
];
const NEW_MIX = { H2: 0.4, I2: 0.4, HI: 1.0 };
const S7 = [
  { id: 'n1', label: 'Mixture 1', amounts: { NO2: 0.1, N2O4: 0.1 } },
  { id: 'n2', label: 'Mixture 2', amounts: { NO2: 0.5, N2O4: 0.5 } },
  { id: 'n3', label: 'Mixture 3', amounts: { NO2: 0.2, N2O4: 0.268 } }
];
const S8 = [
  { id: 'q1', label: 'Mixture 1', amounts: { SO2: 0.1, O2: 0.2, SO3: 0.4 } },
  { id: 'q2', label: 'Mixture 2', amounts: { SO2: 0.1, O2: 0.02, SO3: 0.4 } },
  { id: 'q3', label: 'Mixture 3', amounts: { SO2: 0.1, O2: 0.175, SO3: 0.7 } }
];

/* ---------------------------------------------------------------- layout */

const TABLE_H = 72;
const TV_AT = { x: 62, y: 22 };
const SEAT_AT = { x: 62 - 59 + 14.5, y: 22 - 20 + 22 };
const cardAt = i => ({ x: 18 + i * 28, y: 58 });

/** The test vessel for a stage, its fixture and its seat slot. */
const vessel = (system, q) => testVessel('tv', TV_AT, { system, q });
const cardOf = (system, c, i, extra = {}) => mixCard(c.id, c.label, cardAt(i), system, c.amounts, extra);
/** One mixture card standing in the vessel's slot, fixed, for a stage whose question is about that one mixture. */
const seated = (system, id, label, amounts, extra = {}) => mixCard(id, label, SEAT_AT, system, amounts, { fixed: true, zone: 'slot:tv.seat', ...extra });

const sysOf = system => K_SYSTEMS[system];
const names = (sys, sps) => sps.map(s => spName(sys, s)).join(' and ');

/** What a mixture does when it is left alone, as a sentence of figures from the planner. */
function ranText(system, c) {
  const sys = sysOf(system);
  const r = runMixture(sys, Object.fromEntries(Object.keys(sys.species).map(s => [s, c.amounts[s] ?? 0])));
  const parts = Object.keys(sys.species).map(s => `${spName(sys, s)} ${fmtNum(c.amounts[s] ?? 0, 3)} to ${fmtNum(r.after[s], 3)}`);
  return `When run, ${c.label} goes ${parts.join(', ')} ${sys.unit}.`;
}

/** Which way a mixture goes: 'forward' (toward the products), 'reverse', 'none'. */
const wayOf = (system, c) => runMixture(sysOf(system), Object.fromEntries(Object.keys(sysOf(system).species).map(s => [s, c.amounts[s] ?? 0]))).dir;

/** The stage of "lay the mixture that goes the given way": the card in the vessel's slot is the answer. */
function seatCheck(system, cards, way, whyNot) {
  return state => {
    const seat = pieceIn(state.table, 'tv.seat');
    if (!seat) return { ok: false, notYet: true, msg: 'Lay a mixture card in the vessel.' };
    const c = cards.find(x => x.id === seat.id);
    if (wayOf(system, c) === way) return { ok: true };
    return { ok: false, msg: whyNot(c, qkRead(state.table, 'tv')) };
  };
}

const guessLine = (sentence, guesses, key) => {
  const g = recall(key);
  return g && guesses[g] ? `You predicted "${guesses[g]}". ${sentence}` : sentence;
};

const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const put = (piece, to) => ({ place: { piece, to } });

/** The answer dial of the two test stages. */
const wayDial = options => selectorFixture('dir', 'Which way it moves', { x: 62, y: 56 }, { options: [...options, ' '], start: options.length + 1, w: 66 });

const stageCards = (system, cards) => ({
  pieces: cards.map((c, i) => cardOf(system, c, i)),
  fixtures: [vessel(system, true).fixture],
  zones: { slots: [vessel(system, true).seat] }
});

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-at-rest',
    title: 'Already at Rest',
    prompt: 'Lay the mixture that is already in equilibrium.',
    widget,
    table: pansTable({
      pieces: S1.map((c, i) => cardOf('ab', c, i)),
      fixtures: [vessel('ab', false).fixture],
      zones: { slots: [vessel('ab', false).seat] }
    }, { h: TABLE_H }),
    hints: [
      'Use the cards, the slot in the vessel and the "Run" key.',
      'Compare where the marker stands with the K line for each mixture, and watch what each does when run.',
      'Lay each card in the vessel in turn, press "Run", and watch whether the bars move.'
    ],
    check: seatCheck('ab', S1, 'none', (c, r) => (r.ran
      ? `${c.label} moved when it was run: its marker went from ${fmtNum(r.Q0, 3)} to the K line.`
      : `The marker stands at ${fmtNum(r.Q0, 3)} and the K line at ${fmtNum(AB.K, 3)}.`)),
    reward: {
      log: 'The mixture whose marker sat on the K line did not change.',
      title: 'Q, the Ratio Now',
      body: 'The marker is Q, the reaction quotient: the same ratio as K, worked out for a mixture that may not have settled yet. A mixture at equilibrium has Q equal to K, and it does not change when run.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Far More B',
    // A PREDICT STAGE: the vessel is not on the table. The guess is made here and comes back with the test.
    predict: true,
    prompt: 'Which best describes what this mixture does when it is left alone?',
    widget,
    table: pansTable({
      pieces: [
        mixCard('m-click', 'Mixture', { x: 28, y: 14 }, 'ab', CLICK_MIX, { fixed: true }),
        tag('k-note', `K for A ⇌ B is ${fmtNum(AB.K, 2)}`, { x: 72, y: 14 }),
        note('more', GUESS_CLICK.more, { x: 30, y: 38 }),
        note('stay', GUESS_CLICK.stay, { x: 78, y: 38 }),
        note('back', GUESS_CLICK.back, { x: 30, y: 58 }),
        note('all', GUESS_CLICK.all, { x: 78, y: 58 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 126, y: 48 }, size: { w: 36, h: 14 } }] }
    }, { h: TABLE_H }),
    hints: [
      'Use the four cards and the slot.',
      'Compare how much B this mixture holds with how much B a settled pan of A ⇌ B holds.',
      'Set the amounts on the mixture card against the K printed beside it.'
    ],
    check(state) {
      const card = pieceIn(state.table, 'guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = pieceIn(state.table, 'guess');
      if (card) remember(KEY_CLICK, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Prediction',
      body: 'Next, the mixture goes into the test vessel and is run.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-runs-back',
    title: 'Run It',
    get prompt() { return guessLine('Press "Run" and set the dial to the way the mixture moves.', GUESS_CLICK, KEY_CLICK); },
    widget,
    table: pansTable({
      pieces: [seated('ab', 'c-click', 'Mixture', CLICK_MIX)],
      fixtures: [vessel('ab', true).fixture, wayDial(['Toward A', 'Toward B', 'Stays as it is'])],
      zones: { slots: [vessel('ab', true).seat] }
    }, { h: 66 }),
    hints: [
      'Use the "Run" key and the answer dial.',
      'Watch the bars and the marker move when the mixture is run.',
      'Compare which bar rose and which fell, and where the marker went, against the K line.'
    ],
    check(state) {
      const v = dialValue(state.table, 'dir');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 1) return { ok: true };
      return { ok: false, msg: ranText('ab', { label: 'the mixture', amounts: CLICK_MIX }) };
    },
    get reward() {
      const g = recall(KEY_CLICK);
      const verdict = g === 'more' ? 'You predicted it would make more B, and it did the opposite. ' : g === 'back' || g === 'all' ? 'You predicted that B would turn back, and it did. ' : g === 'stay' ? 'You predicted it would stay as it is, and it moved. ' : '';
      const Q = CLICK_MIX.B / CLICK_MIX.A;
      return {
        log: 'The mixture with far more B than A made more A.',
        title: 'It Ran Backward',
        body: `${verdict}Its Q was ${fmtNum(Q, 2)} against a K of ${fmtNum(AB.K, 2)}, and the reaction ran toward A until Q fell to K. A reaction runs toward its products only while Q is below K, and toward its reactants while Q is above K.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-forward',
    title: 'Which Makes More B',
    prompt: 'Lay the mixture that will make more B when it is left alone.',
    widget,
    table: pansTable(stageCards('ab', S4), { h: TABLE_H }),
    hints: [
      'Use the cards, the slot in the vessel and the "Run" key.',
      'Compare the marker with the K line for each mixture, and run any you are unsure of.',
      'Lay the mixtures in the vessel one at a time; the one you want is the one whose bar of B rises when it is run.'
    ],
    check: seatCheck('ab', S4, 'forward', c => ranText('ab', c)),
    reward: {
      log: 'The mixture with equal amounts made more B.',
      title: 'Equal Amounts Move Too',
      body: `Mixture 1 held equal amounts of A and B, and its Q was ${fmtNum(S4[0].amounts.B / S4[0].amounts.A, 2)}, below the K of ${fmtNum(AB.K, 2)}, so it made more B. Equal amounts are not equilibrium; Q equal to K is.`
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-predict',
    title: 'A New Reaction',
    predict: true,
    prompt: 'Which best describes what this mixture does when it is left alone?',
    widget,
    table: pansTable({
      pieces: [
        mixCard('m-new', 'Mixture', { x: 28, y: 14 }, 'hi', NEW_MIX, { fixed: true }),
        tag('k-note', `K for H₂ + I₂ ⇌ 2 HI is ${fmtNum(HI.K, 2)}`, { x: 72, y: 14 }),
        note('more', GUESS_NEW.more, { x: 30, y: 40 }),
        note('back', GUESS_NEW.back, { x: 78, y: 40 }),
        note('stay', GUESS_NEW.stay, { x: 30, y: 60 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 126, y: 50 }, size: { w: 36, h: 14 } }] }
    }, { h: TABLE_H }),
    hints: [
      'Use the three cards and the slot.',
      'Compare the amounts on the mixture card with the K printed beside it.',
      'Work out this reaction\'s ratio for the mixture, and set it against K.'
    ],
    check(state) {
      const card = pieceIn(state.table, 'guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = pieceIn(state.table, 'guess');
      if (card) remember(KEY_NEW, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Prediction',
      body: 'Next, the mixture goes into the test vessel and is run.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-test-new',
    title: 'Run the New Mixture',
    get prompt() { return guessLine('Press "Run" and set the dial to the way the mixture moves.', GUESS_NEW, KEY_NEW); },
    widget,
    table: pansTable({
      pieces: [seated('hi', 'c-new', 'Mixture', NEW_MIX)],
      fixtures: [vessel('hi', true).fixture, wayDial(['Makes more HI', 'Makes more H₂ and I₂', 'Stays as it is'])],
      zones: { slots: [vessel('hi', true).seat] }
    }, { h: 66 }),
    hints: [
      'Use the "Run" key and the answer dial.',
      'Compare the marker with the K line before and after the run.',
      'The marker ends on the K line, so see which bars had to change to put it there.'
    ],
    check(state) {
      const v = dialValue(state.table, 'dir');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 1) return { ok: true };
      return { ok: false, msg: ranText('hi', { label: 'the mixture', amounts: NEW_MIX }) };
    },
    get reward() {
      const g = recall(KEY_NEW);
      const verdict = g === 'more' ? 'You predicted more HI, and it did. ' : g === 'back' ? 'You predicted that HI would turn back, but it made more. ' : g === 'stay' ? 'You predicted no change, but it moved. ' : '';
      const Q = (NEW_MIX.HI ** 2) / (NEW_MIX.H2 * NEW_MIX.I2);
      return {
        log: 'The mixture made more HI although it already held more HI than H₂.',
        title: 'Q Against K',
        body: `${verdict}Its Q was ${fmtNum(Q, 2)} against a K of ${fmtNum(HI.K, 2)}, so it made more HI even though HI was already the larger amount. Which amount is larger does not decide the direction; Q against K does.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-equal-pressures',
    title: 'Which Makes More NO₂',
    prompt: 'Lay the mixture that will make more NO₂ when it is left alone.',
    widget,
    table: pansTable(stageCards('n2o4', S7), { h: TABLE_H }),
    hints: [
      'Use the cards, the slot in the vessel and the "Run" key.',
      'Compare the marker with the K line for each mixture, and run any you are unsure of.',
      'Lay the mixtures in the vessel one at a time; the one you want is the one whose bar of NO₂ rises when it is run.'
    ],
    check: seatCheck('n2o4', S7, 'reverse', c => ranText('n2o4', c)),
    reward: {
      log: 'Two mixtures with equal pressures moved in opposite directions.',
      title: 'Same Pressures, Opposite Ways',
      body: `Mixtures 1 and 2 each held equal pressures of NO₂ and N₂O₄, yet one made more N₂O₄ and the other more NO₂. The 2 in the equation puts NO₂ in the ratio twice over, so the pressures alone cannot tell the direction; Q against K does.`
    }
  },

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const slots = [
      { id: 'go-p', label: 'Makes SO₃', at: { x: 137, y: 11 }, size: { w: 26, h: 14 } },
      { id: 'go-r', label: 'Makes SO₂ and O₂', at: { x: 137, y: 31 }, size: { w: 26, h: 14 } },
      { id: 'stay', label: 'No change', at: { x: 137, y: 51 }, size: { w: 26, h: 14 } }
    ];
    const WAY = { 'go-p': 'forward', 'go-r': 'reverse', stay: 'none' };
    return {
      id: 's8-sealed',
      title: 'Three Sealed Mixtures',
      prompt: 'Lay each mixture under the way it will move when it is left alone.',
      widget,
      table: pansTable({
        pieces: S8.map((c, i) => cardOf('so3', c, i, { sealed: true })),
        fixtures: [vessel('so3', true).fixture],
        zones: { slots: [vessel('so3', true).seat, ...slots] }
      }, { h: TABLE_H }),
      hints: [
        'Use the cards, the slot in the vessel, the "Run" key and the three slots at the right.',
        'Lay each card in the vessel and compare its marker with the K line.',
        'Check the marker against the line for every mixture, then run any that you are unsure of.'
      ],
      check(state) {
        const t = state.table;
        const placed = slots.map(s => [s, pieceIn(t, s.id)]);
        if (placed.some(([, c]) => !c)) return { ok: false, notYet: true, msg: 'Lay a card under each of the three ways.' };
        for (const [s, p] of placed) {
          const c = S8.find(x => x.id === p.id);
          if (wayOf('so3', c) !== WAY[s.id]) return { ok: false, msg: ranText('so3', c) };
        }
        return { ok: true };
      },
      reward: {
        log: 'Each mixture went the way its Q against K said.',
        title: 'Reading Q Anywhere',
        body: `Q is worked out the way K is, from any mixture: each amount raised to its coefficient. Below K the reaction makes products, above K it makes reactants, and on K it does not change.`
      }
    };
  })()
];

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = {
  title: 'Which Way It Goes',
  body: 'A mixture moves until its Q reaches K: toward the products when Q is below K, toward the reactants when it is above.'
};

export const SOLUTIONS = [
  [put('c1', 'slot:tv.seat')],
  [put('back', 'slot:guess')],
  [dial('dir', 'value', 1)],
  [put('m1', 'slot:tv.seat')],
  [put('more', 'slot:guess')],
  [dial('dir', 'value', 1)],
  [put('n1', 'slot:tv.seat')],
  [put('q1', 'slot:go-p'), put('q2', 'slot:go-r'), put('q3', 'slot:stay')]
];

export const MISSES = [
  [put('c2', 'slot:tv.seat')],
  [],
  [dial('dir', 'value', 2)],
  [put('m2', 'slot:tv.seat')],
  [],
  [dial('dir', 'value', 2)],
  [put('n2', 'slot:tv.seat')],
  [put('q1', 'slot:go-r'), put('q2', 'slot:go-p'), put('q3', 'slot:stay')]
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

export const CHECKS = { S1, CLICK_MIX, S4, NEW_MIX, S7, S8 };
void NO; void SO; void names;
