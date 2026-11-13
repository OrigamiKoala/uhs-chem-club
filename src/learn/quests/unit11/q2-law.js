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
import { applyNotes } from '../../table/notes.js';
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
      body: 'The initial-rates log records the starting concentrations you set and the initial rate measured for each run.'
    },
    prompt: 'When the concentration of A doubles, what happens to the rate?',
    widget,
    table: rateTable({
      pieces: [
        stmt('same', 'No change', { x: 18, y: 52 }),
        stmt('double', 'Doubles', { x: 52, y: 52 }),
        stmt('four', 'Four times', { x: 86, y: 52 }),
        stmt('half', 'Halves', { x: 120, y: 52 })
      ],
      fixtures: [
        kvesselFixture('v1', { x: 30, y: 22 }, {
          title: 'Manifold A',
          order: 1,
          k: 0.05,
          a0: 0.40,
          tMax: 20,
          w: 48,
          h: 32,
          logTo: 'log',
          concDials: { A: { values: [0.10, 0.20, 0.40], start: 1 } },
          concRateLaw: { k: 0.05, orders: { A: 1 } }
        }),
        rateslogFixture('log', { x: 82, y: 22 }, {
          title: 'Initial-rates log',
          species: ['A'],
          w: 42,
          h: 32
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Effect of doubling [A]', at: { x: 128, y: 22 }, size: { w: 32, h: 14 } }]
      }
    }),
    hints: [
      'Set "[A]" to 0.10 and 0.20 mol/L, press "Run" for each, and read the log.',
      'Compare the two initial rates in the log when [A] doubles.',
      'Dividing the second rate by the first gives the factor.'
    ],
    check(state) {
      const rows = state.table.fixtures.log.props.rows || [];
      if (rows.length < 2) {
        return { ok: false, notYet: true, msg: 'Run at least two concentrations of A to compare them in the log.' };
      }
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Effect of doubling [A]".' };
      if (card.id === 'four') return { ok: false, msg: 'From [A] = 0.10 to 0.20, the logged rate rose from 0.005 to 0.010, a factor of 2.' };
      if (card.id === 'same') return { ok: false, msg: 'Doubling [A] from 0.10 to 0.20 changed the rate from 0.005 to 0.010.' };
      if (card.id === 'half') return { ok: false, msg: 'The logged rate increased from 0.005 to 0.010 when [A] doubled.' };
      return { ok: true };
    },
    reward: {
      log: 'Doubling [A] doubled the initial rate.',
      title: 'Doubling [A]',
      body: 'Doubling [A] doubled the initial rate. Here the rate is directly proportional to [A].'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-b-and-c',
    title: 'B and C',
    prompt: 'What does doubling B do to the rate, and what does doubling C do?',
    widget,
    table: rateTable({
      pieces: [
        stmt('B', 'Doubling B', { x: 30, y: 52 }),
        stmt('C', 'Doubling C', { x: 64, y: 52 })
      ],
      fixtures: [
        kvesselFixture('v1', { x: 31, y: 24 }, {
          title: 'Feeds B and C',
          equation: 'A + 2 B + C → P',
          order: 1,
          k: 0.10,
          a0: 0.40,
          tMax: 20,
          w: 52,
          h: 34,
          logTo: 'log',
          concDials: {
            B: { values: [0.10, 0.20], start: 1 },
            C: { values: [0.10, 0.20], start: 1 }
          },
          concRateLaw: { k: 1.0, orders: { B: 2, C: 0 } }
        }),
        rateslogFixture('log', { x: 83, y: 24 }, {
          title: 'Initial-rates log',
          species: ['B', 'C'],
          w: 44,
          h: 34
        })
      ],
      zones: {
        trays: [
          { id: 'same', label: 'No change', at: { x: 128, y: 14 }, size: { w: 32, h: 12 }, cellH: 8 },
          { id: 'double', label: 'Doubles', at: { x: 128, y: 32 }, size: { w: 32, h: 12 }, cellH: 8 },
          { id: 'four', label: 'Four times', at: { x: 128, y: 50 }, size: { w: 32, h: 12 }, cellH: 8 }
        ]
      }
    }),
    hints: [
      'Run two trials changing only "[B]", then two trials changing only "[C]".',
      'Check how much the logged rate changes when each concentration doubles.',
      'A rate that becomes four times as large is 2²; an unchanged rate means that reactant has zero effect.'
    ],
    check(state) {
      const pieces = Object.values(state.table.pieces);
      const placed = pieces.filter(p => p.zone && p.zone.startsWith('tray:'));
      if (placed.length < 2) {
        return { ok: false, notYet: true, msg: 'Sort both "Doubling B" and "Doubling C" into the trays.' };
      }
      const zoneOf = id => pieces.find(p => p.id === id)?.zone;
      if (zoneOf('B') !== 'tray:four') {
        return { ok: false, msg: 'When [B] doubled from 0.10 to 0.20 with [C] fixed, the rate rose from 0.010 to 0.040.' };
      }
      if (zoneOf('C') !== 'tray:same') {
        return { ok: false, msg: 'When [C] doubled from 0.10 to 0.20 with [B] fixed, the rate stayed 0.010.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Doubling B quadrupled the rate; doubling C had no effect.',
      title: 'Measured Effects',
      body: 'Doubling B made the rate four times as large and doubling C changed nothing. The equation does not tell you this; only the runs do.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-write-law',
    title: 'Writing the Law',
    briefing: {
      speaker: SPEAKER,
      body: 'A rate law writes the rate as a rate constant, k, times each concentration raised to a power called its order: 1 if doubling doubles the rate, 2 if four times, 0 if no change.'
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
          h: 42,
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
          w: 68,
          h: 28
        })
      ],
      zones: {}
    }),
    hints: [
      'Turn the power dials on the rate-law board to match the log.',
      'Match each reactant\'s doubling factor to its power: 1× → 0, 2× → 1, 4× → 2.',
      'Use 2¹ = 2, 2² = 4, and 2⁰ = 1 to set the powers on A, B, and C.'
    ],
    check(state) {
      const d = state.table.fixtures.board.dials;
      const o0 = Math.round(d.o0.value);
      const o1 = Math.round(d.o1.value);
      const o2 = Math.round(d.o2.value);
      if (o0 === 0 && o1 === 0 && o2 === 0) {
        return { ok: false, notYet: true, msg: 'Set the order dials on the rate-law board.' };
      }
      if (o0 !== 1) return { ok: false, msg: 'In rows 1-2, doubling [A] doubled the rate from 0.005 to 0.010.' };
      if (o1 !== 2) return { ok: false, msg: 'In rows 2-3, doubling [B] multiplied the rate by 4 (0.010 to 0.040).' };
      if (o2 !== 0) return { ok: false, msg: 'In rows 3-4, doubling [C] left the rate unchanged at 0.040.' };
      return { ok: true };
    },
    reward: {
      log: 'Rate law = k[A][B]²; orders 1, 2, 0.',
      title: 'Rate Law & Orders',
      body: 'rate = k[A][B]². The reaction is first order in A, second order in B, and zero order in C, with rate constant k.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-find-k',
    title: 'Finding k',
    briefing: {
      speaker: SPEAKER,
      body: 'To find the rate constant k, plug one row from the log into the rate law.',
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
          h: 38,
          initialRows: [
            { NO: 0.10, 'O₂': 0.10, rate: 0.0020 },
            { NO: 0.20, 'O₂': 0.10, rate: 0.0080 }
          ]
        })
      ],
      zones: {}
    }),
    hints: [
      'Read row 1\'s concentrations and initial rate from the log, then type k.',
      'Square [NO] before multiplying by [O₂].',
      'Divide the measured rate by [NO]² × [O₂] to isolate k.'
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
      body: 'Dividing row 1\'s rate by 0.10² × 0.10 gives k = 2.0 L²/(mol²·s). Row 2 gives the exact same k.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-predict-rate',
    title: 'A Run Not Made',
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
          h: 40,
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
      'Use the rate law and k from runs 1-2 with run 3\'s concentrations, then type the rate.',
      'Remember [NO] is squared while [O₂] is to the first power.',
      'Multiply 2.0 × 0.30² × 0.20.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'rate');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Type the predicted rate for run 3.' };
      if (Math.abs(val - RUN3_RATE) <= 0.002) return { ok: true };
      if (Math.abs(val - 0.12) <= 0.01) {
        return { ok: false, msg: '0.12 treats [NO] as first order instead of squared.' };
      }
      if (Math.abs(val - 0.018) <= 0.002) {
        return { ok: false, msg: '0.018 uses [O₂] = 0.10 rather than 0.20.' };
      }
      return { ok: false, msg: `${val} mol/(L·s) does not match 2.0 × 0.30² × 0.20.` };
    },
    reward: {
      log: 'Predicted run 3 rate = 0.036 mol/(L·s).',
      title: 'Predicting a Rate',
      body: 'With k = 2.0, run 3 gives 0.036 mol/(L·s). A rate law summarizes the runs so you can predict unmeasured ones.'
    }
  }
];

applyNotes(STAGES, {
  1: ['Vary "[A]" and press "Run" to fill the log, then place one card in the slot.'],
  2: ['Vary "[B]" and "[C]" with "Run", then sort both cards into the trays.'],
  3: ['Turn the three order dials on the rate-law board.'],
  4: ['Type the rate constant k from the logged runs.'],
  5: ['Type the predicted rate for run 3.']
});

export const DEBRIEF = {
  title: 'Rate Law Complete',
  body: 'Initial-rate experiments reveal each reactant\'s order and the rate constant k, letting you predict rates for new runs.'
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
