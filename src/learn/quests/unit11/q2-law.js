/**
 * Unit 11 · Bench 2 — The Rate Law (q2-law)
 *
 * Initial-rates manifold, on the rate kit (`table/kits/rate.js`).
 * Five stages and ONE click: stoichiometric coefficients do NOT give the rate-law orders;
 * only measuring initial rates does.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import {
  rateTable, kvesselFixture, rateslogFixture, rateboardFixture, stmt
} from '../../table/kits/rate.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\brate laws?\b/i, introducedAt: 3 },
  { term: /\borders?\b/i, introducedAt: 3 },
  { term: /\brate constants?\b/i, introducedAt: 3 }
];

export const BUILDS_ON = ['unit11/q1-watch'];

const SPEAKER = 'Vess';

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

// Stage 4 & 5: 2 NO + O2 -> 2 NO2, rate = k[NO]^2[O2], k = 2.0 L^2/(mol^2·s)
const K_NO = 2.0;
const RUN3_RATE = 0.036;

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-double-a',
    title: 'Doubling A',
    briefing: {
      speaker: SPEAKER,
      body: 'The three feeds are A, B, and C, and brackets like [A] mean concentration in mol/L. Initial rate is the reaction speed at the very start, before reactant runs low.'
    },
    prompt: 'When the concentration of feed A doubles, what happens to the initial rate?',
    widget,
    table: rateTable({
      pieces: [
        stmt('same', 'No change', { x: 18, y: 53 }),
        stmt('double', 'Doubles', { x: 52, y: 53 }),
        stmt('four', 'Four times', { x: 86, y: 53 }),
        stmt('half', 'Halves', { x: 120, y: 53 })
      ],
      fixtures: [
        kvesselFixture('v1', { x: 28, y: 22 }, {
          title: 'Feed A',
          order: 1,
          k: 0.05,
          a0: 0.40,
          tMax: 20,
          w: 50,
          h: 36,
          logTo: 'log',
          concDials: { A: { values: [0.10, 0.20, 0.40], start: 1 } },
          concRateLaw: { k: 0.05, orders: { A: 1 } }
        }),
        rateslogFixture('log', { x: 78, y: 22 }, {
          title: 'Initial-rates log',
          species: ['A'],
          w: 44,
          h: 36
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Effect of doubling [A]', at: { x: 128, y: 22 }, size: { w: 38, h: 14 } }]
      }
    }),
    hints: [
      'Set "[A]" to 0.10 and press "Run", then set "[A]" to 0.20 and press "Run".',
      'Compare the two initial rates in the log when [A] doubles.',
      'Check how many times larger the second rate is than the first.'
    ],
    check(state) {
      const rows = state.table.fixtures.log.props.rows || [];
      if (rows.length < 2) {
        return { ok: false, notYet: true, msg: 'Run at least two concentrations of A to compare them in the log.' };
      }
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Effect of doubling [A]".' };
      if (card.id === 'four') return { ok: false, msg: 'Check the two rows in the log: the rate did not jump by 4×.' };
      if (card.id === 'same') return { ok: false, msg: 'Check the two rows in the log: the rate changed when [A] doubled.' };
      if (card.id === 'half') return { ok: false, msg: 'Check the two rows in the log: the rate went up, not down.' };
      return { ok: true };
    },
    reward: {
      log: 'Doubling [A] doubled the initial rate.',
      title: 'Doubling [A]',
      body: 'Doubling [A] doubled the initial rate, so rate rises in step with [A].'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-b-and-c',
    title: 'B and C',
    prompt: 'What happens to the rate when you double B, and when you double C?',
    widget,
    table: rateTable({
      pieces: [
        stmt('B', 'Doubling B', { x: 30, y: 53 }),
        stmt('C', 'Doubling C', { x: 64, y: 53 })
      ],
      fixtures: [
        kvesselFixture('v1', { x: 29, y: 22 }, {
          title: 'Feeds B and C',
          equation: 'A + 2 B + C → P',
          order: 1,
          k: 0.10,
          a0: 0.40,
          tMax: 20,
          w: 52,
          h: 40,
          logTo: 'log',
          concDials: {
            B: { values: [0.10, 0.20], start: 1 },
            C: { values: [0.10, 0.20], start: 1 }
          },
          concRateLaw: { k: 1.0, orders: { B: 2, C: 0 } }
        }),
        rateslogFixture('log', { x: 80, y: 22 }, {
          title: 'Initial-rates log',
          species: ['B', 'C'],
          w: 44,
          h: 40
        })
      ],
      zones: {
        trays: [
          { id: 'same', label: 'No change', at: { x: 129, y: 12 }, size: { w: 38, h: 13 }, cellH: 8 },
          { id: 'double', label: 'Doubles', at: { x: 129, y: 31 }, size: { w: 38, h: 13 }, cellH: 8 },
          { id: 'four', label: 'Four times', at: { x: 129, y: 50 }, size: { w: 38, h: 13 }, cellH: 8 }
        ]
      }
    }),
    hints: [
      'Change one dial at a time: run the baseline, double only [B] and run, then reset [B] and double only [C].',
      'Compare each new row in the log with the baseline row.',
      'See how many times larger the rate gets when [B] doubles, and whether doubling [C] changes it at all.'
    ],
    check(state) {
      const pieces = Object.values(state.table.pieces);
      const placed = pieces.filter(p => p.zone && p.zone.startsWith('tray:'));
      if (placed.length < 2) {
        return { ok: false, notYet: true, msg: 'Sort both "Doubling B" and "Doubling C" into the trays.' };
      }
      const zoneOf = id => pieces.find(p => p.id === id)?.zone;
      if (zoneOf('B') !== 'tray:four') {
        return { ok: false, msg: 'Compare two rows in the log where only [B] doubles and [C] stays the same.' };
      }
      if (zoneOf('C') !== 'tray:same') {
        return { ok: false, msg: 'Compare two rows in the log where only [C] doubles and [B] stays the same.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Doubling B quadrupled the rate; doubling C had no effect.',
      title: 'Measured Effects',
      body: 'Doubling B made the rate four times as fast (2² = 4), while doubling C changed nothing. Only testing the feeds reveals this.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-write-law',
    title: 'Writing the Law',
    briefing: {
      speaker: SPEAKER,
      body: 'A rate law has the form rate = k[A]^a[B]^b[C]^c, where k is the rate constant and each exponent is a feed\'s order. Doubling a feed gives 1× rate for order 0, 2× for order 1, and 4× for order 2.'
    },
    prompt: 'What is the rate law for this reaction?',
    widget,
    table: rateTable({
      pieces: [],
      fixtures: [
        rateslogFixture('log', { x: 40, y: 30 }, {
          title: 'Measured log',
          species: ['A', 'B', 'C'],
          w: 66,
          h: 44,
          initialRows: [
            { A: 0.10, B: 0.10, C: 0.10, rate: 0.005 },
            { A: 0.20, B: 0.10, C: 0.10, rate: 0.010 },
            { A: 0.20, B: 0.20, C: 0.10, rate: 0.040 },
            { A: 0.20, B: 0.20, C: 0.20, rate: 0.040 }
          ]
        }),
        rateboardFixture('board', { x: 112, y: 30 }, {
          title: 'Rate-law board',
          species: ['A', 'B', 'C'],
          maxOrder: 2,
          w: 68,
          h: 44
        })
      ],
      zones: {}
    }),
    hints: [
      'Tap 0, 1, or 2 on each reactant\'s row on the rate-law board.',
      'Pick two rows in the log where only one concentration changes.',
      'Match each doubling effect to its order: 1× is order 0, 2× is order 1, and 4× is order 2.'
    ],
    check(state) {
      const d = state.table.fixtures.board.dials;
      const o0 = Math.round(d.o0.value);
      const o1 = Math.round(d.o1.value);
      const o2 = Math.round(d.o2.value);
      if (o0 === 0 && o1 === 0 && o2 === 0) {
        return { ok: false, notYet: true, msg: 'Set the order dials on the rate-law board.' };
      }
      if (o0 !== 1 || o1 !== 2 || o2 !== 0) {
        return { ok: false, msg: 'At least one order does not match the log. Pick two rows where only one feed changes and check how much the rate scales.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Rate law = k[A][B]²; orders 1, 2, 0.',
      title: 'Rate Law & Orders',
      body: 'The rate law is rate = k[A][B]²: first order in A, second order in B, zero order in C, with rate constant k.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-find-k',
    title: 'Finding k',
    briefing: {
      speaker: SPEAKER,
      body: 'Plug any row from the log into the rate law to solve for k. Its units, L²/(mol²·s), make the rate come out in mol/(L·s).',
      worked: [
        'Example: rate = 0.020 = k × 0.10 × 0.20²',
        '0.10 × 0.04 = 0.0040',
        'k = 0.020 ÷ 0.0040 = 5.0'
      ]
    },
    prompt: 'What is the rate constant k for this reaction?',
    entry: { id: 'k', label: 'Rate constant k', unit: 'L²/(mol²·s)' },
    widget,
    table: rateTable({
      pieces: [],
      fixtures: [
        rateslogFixture('log', { x: 75, y: 28 }, {
          title: '2 NO + O₂ → 2 NO₂',
          species: ['NO', 'O₂'],
          rateLawText: 'rate = k[NO]²[O₂]',
          w: 96,
          h: 40,
          initialRows: [
            { NO: 0.10, 'O₂': 0.10, rate: 0.0020 },
            { NO: 0.20, 'O₂': 0.10, rate: 0.0080 }
          ]
        })
      ],
      zones: {}
    }),
    hints: [
      'Read row 1\'s concentrations and initial rate from the log.',
      'Square [NO] first, then multiply by [O₂].',
      'Since rate = k[NO]²[O₂], one row gives you every number except k.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'k');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Type the value of k.' };
      if (Math.abs(val - K_NO) <= 0.05) return { ok: true };
      const r1 = val * 0.10 * 0.10 * 0.10;
      return { ok: false, msg: `With k = ${val}, row 1 gives ${r1.toFixed(5)} mol/(L·s), not 0.0020.` };
    },
    reward: {
      log: 'Rate constant k = 2.0 L²/(mol²·s).',
      title: 'Rate Constant k',
      body: 'Row 1 gives k = 0.0020 ÷ (0.10² × 0.10) = 2.0 L²/(mol²·s). Row 2 gives the exact same k.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-predict-rate',
    title: 'A Run Not Made',
    briefing: {
      speaker: SPEAKER,
      body: 'Use the rate law at the top of the log with run 3\'s concentrations to predict its rate.'
    },
    prompt: 'What will the rate be in run 3?',
    entry: { id: 'rate', label: 'Run 3 rate', unit: 'mol/(L·s)' },
    widget,
    table: rateTable({
      pieces: [],
      fixtures: [
        rateslogFixture('log', { x: 75, y: 28 }, {
          title: '2 NO + O₂ → 2 NO₂',
          species: ['NO', 'O₂'],
          rateLawText: 'rate = 2.0 [NO]²[O₂]',
          w: 96,
          h: 42,
          initialRows: [
            { NO: 0.10, 'O₂': 0.10, rate: 0.0020 },
            { NO: 0.20, 'O₂': 0.10, rate: 0.0080 },
            { NO: 0.30, 'O₂': 0.20, rate: null }
          ]
        })
      ],
      zones: {}
    }),
    hints: [
      'Read the rate law at the top of the log and run 3\'s concentrations.',
      'Remember that [NO] is squared while [O₂] is to the first power.',
      'The same rate law and k = 2.0 apply to run 3\'s concentrations.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'rate');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Type the predicted rate for run 3.' };
      if (Math.abs(val - RUN3_RATE) <= 0.002) return { ok: true };
      if (Math.abs(val - 0.12) <= 0.01) {
        return { ok: false, msg: '0.12 treats [NO] as first order instead of squared.' };
      }
      if (Math.abs(val - 0.018) <= 0.002) {
        return { ok: false, msg: '0.018 uses [O₂] = 0.10 instead of 0.20.' };
      }
      return { ok: false, msg: `${val} mol/(L·s) does not match 2.0 × 0.30² × 0.20.` };
    },
    reward: {
      log: 'Predicted run 3 rate = 0.036 mol/(L·s).',
      title: 'Predicting a Rate',
      body: 'With k = 2.0, run 3 gives 0.036 mol/(L·s). A rate law lets you predict rates for runs you have not measured yet.'
    }
  }
];


export const DEBRIEF = {
  title: 'Rate Law Complete',
  body: 'Initial-rate runs reveal each reactant\'s order and the rate constant k, letting you predict rates for new mixtures.'
};

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const runFx = fixture => ({ run: { fixture } });

export const SOLUTIONS = [
  [runFx('v1'), dial('v1', 'A', 2), runFx('v1'), put('double', 'slot:ans')],
  [runFx('v1'), dial('v1', 'B', 2), runFx('v1'), dial('v1', 'C', 2), runFx('v1'), put('B', 'tray:four'), put('C', 'tray:same')],
  [dial('board', 'o0', 1), dial('board', 'o1', 2), dial('board', 'o2', 0)],
  [{ type: { entry: 'k', value: '2.0' } }],
  [{ type: { entry: 'rate', value: '0.036' } }]
];

export const MISSES = [
  [runFx('v1'), dial('v1', 'A', 2), runFx('v1'), put('four', 'slot:ans')],
  [put('B', 'tray:double'), put('C', 'tray:same')],
  [dial('board', 'o0', 1), dial('board', 'o1', 1), dial('board', 'o2', 0)],
  [{ type: { entry: 'k', value: '0.2' } }],
  [{ type: { entry: 'rate', value: '0.12' } }]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() {}
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export const CHECKS = { K_NO, RUN3_RATE };
