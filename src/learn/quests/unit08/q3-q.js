/**
 * Unit 8 · Bench 3 — Which Way It Goes (q3-q)
 *
 * The test vessel and its Q marker (`table/kits/pans-ratio.js`): a mixture card goes in a slot, the vessel shows a bar for each
 * substance and the marker sets the mixture's ratio Q against the fixed K line. Six stages:
 *
 *   1  lay the mixture that is already at equilibrium                -> Q equals K, does not change when run
 *   2  PREDICT: a mixture with far more isobutane than butane
 *   3  TEST: run it                                                  -> Q above K runs toward reactants
 *   4  lay the mixture that will make more isobutane (no Run key)    -> equal amounts are not equilibrium; Q < K decides
 *   5  lay the mixture that will make more NO₂ (2 NO₂ ⇌ N₂O₄)        -> coefficients square amounts in Q
 *   6  three mixtures sorted by Q against K (no vessel, plate with K)
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { pansTable, selectorFixture, plaqueFixture, note, tag, pieceIn, dialValue } from '../../table/kits/pans.js';
import { testVessel, mixCard, qkRead } from '../../table/kits/pans-ratio.js';
import { K_SYSTEMS, runMixture, systemRatio, fmtNum, spName } from '../../engine/eqdata.js';
import { clipFixture } from '../../table/kits/pans-clips.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\bQ\b/, introducedAt: 1 },
  { term: /\breaction quotient\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit08/q2-k'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const KEY_CLICK = 'unit08/q3-q#click';
const BUT = K_SYSTEMS.butane;
const SO = K_SYSTEMS.so3;

const GUESS_CLICK = {
  more: 'It makes still more isobutane',
  stay: 'It stays as it is',
  back: 'Some of the isobutane turns back into butane',
  all: 'All of the isobutane turns back into butane'
};

/* ---------------------------------------------------------------- the mixtures */

const S1 = [
  { id: 'c1', label: 'Mixture 1', amounts: { butane: 0.5, isobutane: 1.0 } },
  { id: 'c2', label: 'Mixture 2', amounts: { butane: 1.0, isobutane: 0.5 } },
  { id: 'c3', label: 'Mixture 3', amounts: { butane: 0.25, isobutane: 1.5 } }
];
const CLICK_MIX = { butane: 0.1, isobutane: 1.9 };
const S4 = [
  { id: 'm1', label: 'Mixture 1', amounts: { butane: 0.6, isobutane: 0.6 } },
  { id: 'm2', label: 'Mixture 2', amounts: { butane: 0.3, isobutane: 1.5 } },
  { id: 'm3', label: 'Mixture 3', amounts: { butane: 0.35, isobutane: 0.7 } }
];
const S5 = [
  { id: 'n1', label: 'Mixture 1', amounts: { NO2: 0.1, N2O4: 0.1 } },
  { id: 'n2', label: 'Mixture 2', amounts: { NO2: 0.5, N2O4: 0.5 } },
  { id: 'n3', label: 'Mixture 3', amounts: { NO2: 0.2, N2O4: 0.268 } }
];
const S6 = [
  { id: 'q1', label: 'Mixture 1', amounts: { SO2: 0.1, O2: 0.2, SO3: 0.4 } },
  { id: 'q2', label: 'Mixture 2', amounts: { SO2: 0.1, O2: 0.02, SO3: 0.4 } },
  { id: 'q3', label: 'Mixture 3', amounts: { SO2: 0.1, O2: 0.175, SO3: 0.7 } }
];

/* ---------------------------------------------------------------- layout */

const TABLE_H = 72;
const TV_AT = { x: 62, y: 22 };
const SEAT_AT = { x: 62 - 59 + 14.5, y: 22 - 20 + 22 };
const cardAt = i => ({ x: 18 + i * 28, y: 58 });

const vessel = (system, q, extra = {}) => testVessel('tv', TV_AT, { system, q, ...extra });
const cardOf = (system, c, i, extra = {}) => mixCard(c.id, c.label, cardAt(i), system, c.amounts, extra);
const seated = (system, id, label, amounts, extra = {}) => mixCard(id, label, SEAT_AT, system, amounts, { fixed: true, zone: 'slot:tv.seat', ...extra });

const sysOf = system => K_SYSTEMS[system];

function ranText(system, c) {
  const sys = sysOf(system);
  const r = runMixture(sys, Object.fromEntries(Object.keys(sys.species).map(s => [s, c.amounts[s] ?? 0])));
  const parts = Object.keys(sys.species).map(s => `${spName(sys, s)} ${fmtNum(c.amounts[s] ?? 0, 3)} to ${fmtNum(r.after[s], 3)}`);
  return `When run, ${c.label} goes ${parts.join(', ')} ${sys.unit}.`;
}

const wayOf = (system, c) => runMixture(sysOf(system), Object.fromEntries(Object.keys(sysOf(system).species).map(s => [s, c.amounts[s] ?? 0]))).dir;

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

const wayDial = options => selectorFixture('dir', 'Which way it moves', { x: 62, y: 56 }, { options: [...options, ' '], start: options.length + 1, w: 66 });

const stageCards = (system, cards, extra = {}) => ({
  pieces: cards.map((c, i) => cardOf(system, c, i)),
  fixtures: [vessel(system, true, extra).fixture],
  zones: { slots: [vessel(system, true, extra).seat] }
});

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-at-rest',
    title: 'Already at Equilibrium',
    briefing: {
      speaker: 'Vess',
      body: 'Q, the reaction quotient, is the same ratio as K, worked out for any mixture whether or not it has settled. The marker shows Q and the line shows K.'
    },
    prompt: 'Which mixture is already at equilibrium?',
    widget,
    table: pansTable({
      pieces: S1.map((c, i) => cardOf('butane', c, i)),
      fixtures: [vessel('butane', true).fixture],
      zones: { slots: [vessel('butane', true).seat] }
    }, { h: TABLE_H }),
    hints: [
      'Lay each mixture card in the vessel and press "Run".',
      'Compare where the Q marker stands against the K line for each mixture.',
      'A mixture at equilibrium has Q equal to K and does not change when run.'
    ],
    check: seatCheck('butane', S1, 'none', (c, r) => (r.ran
      ? `${c.label} moved when it was run: its Q marker went from ${fmtNum(r.Q0, 3)} to the K line.`
      : `The Q marker stands at ${fmtNum(r.Q0, 3)} and the K line at ${fmtNum(BUT.K, 3)}.`)),
    reward: {
      log: 'The mixture with Q on K did not change.',
      title: 'Q, the Ratio Now',
      body: 'The mixture with Q, the reaction quotient, on K did not change when run. At equilibrium, Q equals K.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Far More Isobutane',
    predict: true,
    prompt: 'What does this mixture do when it is left alone?',
    widget,
    table: pansTable({
      pieces: [
        mixCard('m-click', 'Mixture', { x: 28, y: 14 }, 'butane', CLICK_MIX, { fixed: true }),
        tag('k-note', `K for butane ⇌ isobutane is ${fmtNum(BUT.K, 2)}`, { x: 74, y: 14 }),
        note('more', GUESS_CLICK.more, { x: 30, y: 38 }),
        note('stay', GUESS_CLICK.stay, { x: 78, y: 38 }),
        note('back', GUESS_CLICK.back, { x: 30, y: 58 }),
        note('all', GUESS_CLICK.all, { x: 78, y: 58 })
      ],
      fixtures: [clipFixture('clip', { x: 126, y: 17 }, 'react', { title: 'Starting with mostly isobutane', b0: 40, kf: 0.1, kr: 0.05, seed: 3, span: 30, h: 24, w: 40 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 126, y: 48 }, size: { w: 36, h: 14 } }] }
    }, { h: TABLE_H }),
    hints: [
      'Drag one of the four prediction cards into the slot.',
      'Compare the amounts on the mixture card with K = 2.0.',
      'Decide whether isobutane ÷ butane is above or below 2.0.'
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
    get prompt() { return guessLine('Which way does a mixture run when its Q is above K?', GUESS_CLICK, KEY_CLICK); },
    widget,
    table: pansTable({
      pieces: [seated('butane', 'c-click', 'Mixture', CLICK_MIX)],
      fixtures: [vessel('butane', true).fixture, wayDial(['Toward butane', 'Toward isobutane', 'Stays as it is'])],
      zones: { slots: [vessel('butane', true).seat] }
    }, { h: 66 }),
    hints: [
      'Press "Run" on the vessel, then set the answer dial.',
      'Watch which bar rises, which falls, and which way the Q marker moves.',
      'See which substance forms as Q falls back to the K line.'
    ],
    check(state) {
      const v = dialValue(state.table, 'dir');
      if (v === 4) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === 1) return { ok: true };
      return { ok: false, msg: ranText('butane', { label: 'the mixture', amounts: CLICK_MIX }) };
    },
    get reward() {
      const g = recall(KEY_CLICK);
      const verdict = g === 'more' ? 'You predicted it would make more isobutane, and it did the opposite. ' : g === 'back' || g === 'all' ? 'You predicted isobutane would turn back, and it did. ' : g === 'stay' ? 'You predicted no change, and it moved. ' : '';
      const Q = CLICK_MIX.isobutane / CLICK_MIX.butane;
      return {
        log: 'The mixture with Q above K made more butane.',
        title: 'Above K Runs Backward',
        body: `${verdict}Q was ${fmtNum(Q, 2)} against a K of ${fmtNum(BUT.K, 2)}, and isobutane turned back into butane until Q reached K. Above K a reaction runs toward reactants; below K, toward products.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-forward',
    title: 'Which Makes More Isobutane',
    prompt: 'Which mixture will make more isobutane when left alone?',
    widget,
    table: pansTable(stageCards('butane', S4, { noRun: true }), { h: TABLE_H }),
    hints: [
      'Lay each mixture card in the vessel to see its Q marker against K.',
      'Compare where Q stands relative to K for each of the three mixtures.',
      'From the last stage, decide whether Q needs to be above or below K to make more product.'
    ],
    check: seatCheck('butane', S4, 'forward', (c, r) => `${c.label} has Q = ${fmtNum(r.Q0, 3)} against K = ${fmtNum(BUT.K, 3)}.`),
    reward: {
      log: 'The mixture with equal amounts had Q below K and made more isobutane.',
      title: 'Equal Amounts Move Too',
      body: `Mixture 1 held equal amounts, so its Q was ${fmtNum(S4[0].amounts.isobutane / S4[0].amounts.butane, 2)}, below the K of ${fmtNum(BUT.K, 2)}, and it makes more isobutane. Equal amounts are not equilibrium.`
    }
  },

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const tv = testVessel('tv', { x: 58, y: 22 }, { system: 'n2o4', q: true, w: 112 });
    tv.fixture.props.gate = { fixtureDial: 'ans', dial: 'value', start: 4 };
    tv.fixture.props.gateMsg = 'Select a mixture on Makes more NO₂ first, then press "Run".';
    return {
      id: 's7-equal-pressures',
      title: 'Which Makes More NO₂',
      prompt: 'Which mixture will make more NO₂ when it is left alone?',
      widget,
      table: pansTable({
        pieces: S5.map((c, i) => cardOf('n2o4', c, i)),
        fixtures: [
          tv.fixture,
          selectorFixture('ans', 'Makes more NO₂', { x: 133, y: 22 }, { options: ['Mixture 1', 'Mixture 2', 'Mixture 3', ' '], start: 4, w: 30 })
        ],
        zones: { slots: [tv.seat] }
      }, { h: TABLE_H }),
      hints: [
        'Select a mixture on Makes more NO₂, then lay a mixture card in the vessel and press "Run".',
        'Compare the Q marker with the K line for the two mixtures that have equal pressures.',
        'Test each mixture and see which one puts Q above K so it runs toward NO₂.'
      ],
      check(state) {
        const v = Math.round(dialValue(state.table, 'ans', 'value'));
        if (v === 4) return { ok: false, notYet: true, msg: 'Select a mixture on Makes more NO₂.' };
        const c = S5[v - 1];
        if (wayOf('n2o4', c) === 'reverse') return { ok: true };
        return { ok: false, msg: ranText('n2o4', c) };
      },
      reward: {
        log: 'Two mixtures with equal pressures moved in opposite directions.',
        title: 'Same Pressures, Opposite Ways',
        body: 'Mixtures 1 and 2 each held equal pressures of NO₂ and N₂O₄, yet they ran opposite ways. NO₂ enters Q squared, so the size of the pressures matters, not only their ratio.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const slots = [
      { id: 'go-p', label: 'Makes more product', at: { x: 124, y: 12 }, size: { w: 40, h: 14 } },
      { id: 'go-r', label: 'Makes more reactant', at: { x: 124, y: 31 }, size: { w: 40, h: 14 } },
      { id: 'stay', label: 'Does not change', at: { x: 124, y: 50 }, size: { w: 40, h: 14 } }
    ];
    const WAY = { 'go-p': 'forward', 'go-r': 'reverse', stay: 'none' };
    return {
      id: 's8-sealed',
      title: 'Three Sealed Mixtures',
      prompt: 'Which way will each mixture run?',
      widget,
      table: pansTable({
        pieces: S6.map((c, i) => mixCard(c.id, c.label, { x: 20 + i * 28, y: 52 }, 'so3', c.amounts)),
        fixtures: [
          plaqueFixture('eq', SO.eq, { x: 48, y: 18 }, [
            `K = ${fmtNum(SO.K, 3)} (at ${SO.T} K)`,
            'Q = SO₃² ÷ (SO₂² × O₂)'
          ], { w: 76 })
        ],
        zones: { slots }
      }, { h: TABLE_H }),
      hints: [
        'Calculate Q from the amounts on each mixture card, then place it in a slot.',
        'Square SO₃ and SO₂ when working out Q = SO₃² ÷ (SO₂² × O₂).',
        'Compare each mixture\'s Q with K = 280 to see which way it runs.'
      ],
      check(state) {
        const t = state.table;
        const placed = slots.map(s => [s, pieceIn(t, s.id)]);
        if (placed.some(([, c]) => !c)) return { ok: false, notYet: true, msg: 'Lay a card in each of the three slots.' };
        for (const [s, p] of placed) {
          const c = S6.find(x => x.id === p.id);
          if (wayOf('so3', c) !== WAY[s.id]) {
            const q = systemRatio(SO, c.amounts);
            return { ok: false, msg: `${c.label} has Q = ${fmtNum(q, 3)} against K = ${fmtNum(SO.K, 3)}.` };
          }
        }
        return { ok: true };
      },
      reward: {
        log: 'Each mixture went the way its Q against K said.',
        title: 'Reading Q Anywhere',
        body: 'Below K a mixture makes products, above K it makes reactants, and on K it does not change.'
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
  [dial('ans', 'value', 1), put('n1', 'slot:tv.seat'), { run: 'tv' }],
  [put('q1', 'slot:go-p'), put('q2', 'slot:go-r'), put('q3', 'slot:stay')]
];

export const MISSES = [
  [put('c2', 'slot:tv.seat')],
  [],
  [dial('dir', 'value', 2)],
  [put('m2', 'slot:tv.seat')],
  [dial('ans', 'value', 2), put('n2', 'slot:tv.seat'), { run: 'tv' }],
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

export const CHECKS = { S1, CLICK_MIX, S4, S5, S6 };
