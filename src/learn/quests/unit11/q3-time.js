/**
 * Unit 11 · Bench 3 — Concentration Over Time (q3-time)
 *
 * Decay tank catwalk, on the rate kit (`table/kits/rate.js`).
 * Five stages and ONE click: students expect the second halving to take longer as
 * the reaction slows down; for first-order decay, every half-life is identical.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { planKineticsRun } from '../../engine/ratedata.js';
import { applyNotes } from '../../table/notes.js';
import {
  rateTable, kvesselFixture, plotterFixture, plaqueFixture, stmt
} from '../../table/kits/rate.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\bhalf-li(fe|ves)\b/i, introducedAt: 1 },
  { term: /\bfirst[- ]order\b/i, introducedAt: 3 },
  { term: /\bzero[- ]order\b/i, introducedAt: 4 },
  { term: /\bsecond[- ]order\b/i, introducedAt: 4 }
];

export const BUILDS_ON = ['unit11/q2-law'];

const SPEAKER = 'Vess';

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

// Stage 1-3: 1st-order N2O5 decay with t1/2 = 20 s
const K_20 = Math.LN2 / 20;
const N2O5_POINTS = [
  { t: 0, A: 0.80 },
  { t: 10, A: 0.80 * Math.exp(-K_20 * 10) },
  { t: 20, A: 0.40 },
  { t: 30, A: 0.80 * Math.exp(-K_20 * 30) },
  { t: 40, A: 0.20 },
  { t: 60, A: 0.10 }
];

// Stage 4: Three reactions (R1 = zero order, R2 = first order, R3 = second order)
const R1_PTS = planKineticsRun({ order: 0, k: 0.015, a0: 0.80, tMax: 40, nSteps: 4 }).points;
const R2_PTS = planKineticsRun({ order: 1, k: 0.045, a0: 0.80, tMax: 40, nSteps: 4 }).points;
const R3_PTS = planKineticsRun({ order: 2, k: 0.12, a0: 0.80, tMax: 40, nSteps: 4 }).points;

// Stage 5: t1/2 = 15 s => k = 0.693 / 15 = 0.0462 s^-1
const T_HALF_5 = 15;
const K_5 = 0.693 / T_HALF_5;

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-half-life',
    title: 'Half, Then Half Again',
    prompt: 'How does the time for the second halving compare with the first?',
    widget,
    table: rateTable({
      pieces: [
        stmt('longer', 'Longer', { x: 22, y: 53 }),
        stmt('same', 'The same', { x: 56, y: 53 }),
        stmt('shorter', 'Shorter', { x: 90, y: 53 })
      ],
      fixtures: [
        kvesselFixture('v1', { x: 52, y: 23 }, {
          title: '2 N₂O₅ → 4 NO₂ + O₂',
          order: 1,
          k: K_20,
          a0: 0.80,
          tMax: 45,
          mode: 'reactant',
          halfLives: true,
          w: 90,
          h: 34
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Second halving', at: { x: 126, y: 23 }, size: { w: 32, h: 14 } }]
      }
    }),
    hints: [
      'Press "Run" and watch the halving markers appear on the curve.',
      'Compare the time marked for the first halving with the second.',
      'When both intervals are equal, the halving time is constant.'
    ],
    check(state) {
      if (!state.table.fixtures.v1.props.ran) {
        return { ok: false, notYet: true, msg: 'Press "Run" to trace the curve and its halving markers first.' };
      }
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Second halving".' };
      if (card.id === 'longer') return { ok: false, msg: 'The markers on the curve show 20 s for the first halving and 20 s for the second.' };
      if (card.id === 'shorter') return { ok: false, msg: 'Both halvings took 20 s on the curve.' };
      return { ok: true };
    },
    reward: {
      log: 'First and second halvings both took 20 s.',
      title: 'Half-Life',
      body: 'Each halving took 20 s. That constant interval is the reaction\'s half-life.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-three-halves',
    title: 'After Three Half-Lives',
    briefing: {
      speaker: SPEAKER,
      body: 'Each half-life multiplies the remaining reactant by one-half.',
      worked: [
        'After 1 half-life: ½ (0.50) remains',
        'After 2 half-lives: ½ × ½ = ¼ (0.25) remains'
      ]
    },
    prompt: 'What fraction (as a decimal) of the reactant is left after three half-lives?',
    entry: { id: 'frac', label: 'Fraction left', unit: '' },
    widget,
    table: rateTable({
      pieces: [],
      fixtures: [
        kvesselFixture('v1', { x: 75, y: 28 }, {
          title: 'N₂O₅ decay · t½ = 20 s',
          order: 1,
          k: K_20,
          a0: 0.80,
          tMax: 45,
          mode: 'reactant',
          halfLives: true,
          freezeAt: 1,
          noRun: true,
          w: 106,
          h: 40
        })
      ],
      zones: {}
    }),
    hints: [
      'Read the remaining concentrations after 1 and 2 half-lives, then type the fraction at 3.',
      'Each half-life cuts the remaining amount in half again.',
      'Multiply ½ × ½ × ½ (or divide 0.25 by 2).'
    ],
    check(state) {
      const val = entryNumber(state.table, 'frac');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Type the remaining fraction as a decimal.' };
      if (Math.abs(val - 0.125) <= 0.005) return { ok: true };
      if (Math.abs(val - 0.25) <= 0.01) {
        return { ok: false, msg: '0.25 is the fraction left after 2 half-lives (40 s), not 3.' };
      }
      if (Math.abs(val - 0.333) <= 0.02) {
        return { ok: false, msg: 'Each half-life multiplies the remaining amount by ½, not 1/3.' };
      }
      return { ok: false, msg: `${val} is not (½)³.` };
    },
    reward: {
      log: 'Fraction left after 3 half-lives = 0.125 (1/8).',
      title: 'Repeated Halving',
      body: 'After three half-lives, ½ × ½ × ½ = 0.125 (⅛) remains. Each half-life multiplies what is left by one-half.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-which-plot',
    title: 'Which Plot Is Straight',
    briefing: {
      speaker: SPEAKER,
      body: 'The plotter redraws the same concentration readings three ways: [A], ln[A], or 1/[A] against time. Here ln is the natural logarithm key on your calculator, used to straighten a curve.'
    },
    prompt: 'Which plot of this reaction\'s readings is a straight line?',
    widget,
    table: rateTable({
      pieces: [
        stmt('A', '[A] vs t', { x: 22, y: 53 }),
        stmt('lnA', 'ln[A] vs t', { x: 56, y: 53 }),
        stmt('invA', '1/[A] vs t', { x: 90, y: 53 })
      ],
      fixtures: [
        plotterFixture('plot', { x: 52, y: 23 }, {
          title: 'N₂O₅ readings',
          datasets: [{ label: 'N₂O₅', points: N2O5_POINTS }],
          w: 88,
          h: 34
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Straight plot', at: { x: 126, y: 23 }, size: { w: 32, h: 14 } }]
      }
    }),
    hints: [
      'Turn the "Plot" dial through [A], ln[A], and 1/[A] and check against the dashed straightedge.',
      'See which set of points lies directly on the straight line.',
      'A first-order exponential decay becomes linear when you plot ln[A] against time.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Straight plot".' };
      if (card.id === 'A') return { ok: false, msg: 'Against the straightedge, [A] vs time curves downward.' };
      if (card.id === 'invA') return { ok: false, msg: 'Against the straightedge, 1/[A] vs time curves upward.' };
      return { ok: true };
    },
    reward: {
      log: 'ln[A] vs time is straight for N2O5.',
      title: 'First-Order Plot',
      body: 'ln[A] against time is straight. That straight line is the mark of a first-order reaction.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-three-reactions',
    title: 'Three Reactions',
    prompt: 'What is the order of each reaction?',
    widget,
    table: rateTable({
      pieces: [
        stmt('R1', 'R1', { x: 94, y: 14 }),
        stmt('R2', 'R2', { x: 94, y: 30 }),
        stmt('R3', 'R3', { x: 94, y: 46 })
      ],
      fixtures: [
        plotterFixture('plot', { x: 38, y: 28 }, {
          title: 'Plotter',
          datasets: [
            { label: 'R1', points: R1_PTS },
            { label: 'R2', points: R2_PTS },
            { label: 'R3', points: R3_PTS }
          ],
          w: 66,
          h: 38
        })
      ],
      zones: {
        trays: [
          { id: 'zero', label: 'Zero order', at: { x: 130, y: 14 }, size: { w: 30, h: 12 }, cellH: 8 },
          { id: 'first', label: 'First order', at: { x: 130, y: 31 }, size: { w: 30, h: 12 }, cellH: 8 },
          { id: 'second', label: 'Second order', at: { x: 130, y: 48 }, size: { w: 30, h: 12 }, cellH: 8 }
        ]
      }
    }),
    hints: [
      'Select each reaction ("R1", "R2", "R3") and check "[A]", "ln[A]", and "1/[A]" against the straightedge.',
      'Straight [A] is zero order, straight ln[A] is first order, and straight 1/[A] is second order.',
      'Match each reaction\'s straight plot to its order tray.'
    ],
    check(state) {
      const pieces = Object.values(state.table.pieces);
      const placed = pieces.filter(p => p.zone && p.zone.startsWith('tray:'));
      if (placed.length < 3) return { ok: false, notYet: true, msg: 'Sort all three reactions (R1, R2, R3) into the order trays.' };
      const zoneOf = id => pieces.find(p => p.id === id)?.zone;
      if (zoneOf('R1') !== 'tray:zero') return { ok: false, msg: 'For R1, [A] vs time lies on the straightedge, while ln[A] and 1/[A] curve.' };
      if (zoneOf('R2') !== 'tray:first') return { ok: false, msg: 'For R2, ln[A] vs time lies on the straightedge.' };
      if (zoneOf('R3') !== 'tray:second') return { ok: false, msg: 'For R3, 1/[A] vs time lies on the straightedge.' };
      return { ok: true };
    },
    reward: {
      log: 'R1 is zero order, R2 is first order, R3 is second order.',
      title: 'Integrated Rate Laws',
      body: 'Zero-order gives a straight [A] plot, first-order gives a straight ln[A] plot, and second-order gives a straight 1/[A] plot.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-k-halflife',
    title: 'k From the Half-Life',
    briefing: {
      speaker: SPEAKER,
      body: 'For a first-order reaction, k = 0.693 ÷ half-life.',
      worked: [
        'Example: half-life = 10 s',
        'k = 0.693 ÷ 10 = 0.0693 each second'
      ]
    },
    prompt: 'What is k for this first-order reaction?',
    entry: { id: 'k', label: 'Rate constant k', unit: '1/s' },
    widget,
    table: rateTable({
      pieces: [],
      fixtures: [
        kvesselFixture('v1', { x: 48, y: 28 }, {
          title: 'First-order decay',
          order: 1,
          k: Math.LN2 / T_HALF_5,
          a0: 0.80,
          tMax: 35,
          mode: 'reactant',
          halfLives: true,
          freezeAt: 1,
          noRun: true,
          w: 80,
          h: 40
        }),
        plaqueFixture('eq', 'First-order half-life', { x: 118, y: 28 }, ['t½ = 0.693 / k'], { w: 46 })
      ],
      zones: {}
    }),
    hints: [
      'Read the half-life from the curve markers, then type k.',
      'Use the relation on the plate: k = 0.693 ÷ half-life.',
      'Divide 0.693 by 15 s.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'k');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Type the rate constant k in 1/s.' };
      if (Math.abs(val - K_5) <= 0.002) return { ok: true };
      if (Math.abs(val - 0.693 * T_HALF_5) <= 0.5) {
        return { ok: false, msg: '0.693 × 15 gives 10.4, which would give a half-life under 0.1 s.' };
      }
      if (Math.abs(val - T_HALF_5 / 0.693) <= 1.0) {
        return { ok: false, msg: 'Dividing 15 by 0.693 inverts the formula.' };
      }
      return { ok: false, msg: `${val} 1/s gives a half-life of ${(0.693 / val).toFixed(1)} s, not 15 s.` };
    },
    reward: {
      log: 'k = 0.693 / 15 = 0.0462 1/s.',
      title: 'Half-Life and k',
      body: 'A half-life of 15 s gives k = 0.693 ÷ 15 = 0.0462 each second. Shorter half-lives mean larger k.'
    }
  }
];

applyNotes(STAGES, {
  1: ['Press "Run", then place one card in the slot.'],
  2: ['Read the half-life markers, then type the fraction remaining after 3 half-lives.'],
  3: ['Cycle the "Plot" dial to test each graph against the straightedge, then place one card.'],
  4: ['Check each reaction across all three plots, then sort R1, R2, and R3.'],
  5: ['Read t½ from the curve, then type k.']
});

export const DEBRIEF = {
  title: 'Decay Plots Complete',
  body: 'First-order decay has a constant half-life (t½ = 0.693/k), and straight plots of [A], ln[A], or 1/[A] distinguish zero, first, and second order.'
};

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const runFx = fixture => ({ run: { fixture } });

export const SOLUTIONS = [
  [runFx('v1'), put('same', 'slot:ans')],
  [{ type: { entry: 'frac', value: '0.125' } }],
  [dial('plot', 'plot', 2), put('lnA', 'slot:ans')],
  [put('R1', 'tray:zero'), put('R2', 'tray:first'), put('R3', 'tray:second')],
  [{ type: { entry: 'k', value: '0.0462' } }]
];

export const MISSES = [
  [runFx('v1'), put('longer', 'slot:ans')],
  [{ type: { entry: 'frac', value: '0.25' } }],
  [put('A', 'slot:ans')],
  [put('R1', 'tray:first'), put('R2', 'tray:first'), put('R3', 'tray:second')],
  [{ type: { entry: 'k', value: '10.4' } }]
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

export const CHECKS = { K_20, T_HALF_5, K_5 };
