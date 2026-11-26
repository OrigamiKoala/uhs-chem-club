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
import {
  rateTable, kvesselFixture, plotterFixture, plaqueFixture, stmt
} from '../../table/kits/rate.js';

export const meta = { stageCount: 7 };

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

// Stage 4: Three reactions shuffled (R1 = second order, R2 = zero order, R3 = first order)
const R1_PTS = planKineticsRun({ order: 2, k: 0.12, a0: 0.80, tMax: 40, nSteps: 4 }).points;
const R2_PTS = planKineticsRun({ order: 0, k: 0.015, a0: 0.80, tMax: 40, nSteps: 4 }).points;
const R3_PTS = planKineticsRun({ order: 1, k: 0.045, a0: 0.80, tMax: 40, nSteps: 4 }).points;

// Stage 5: t1/2 = 15 s => k = 0.693 / 15 = 0.0462 s^-1
const T_HALF_5 = 15;
const K_5 = 0.693 / T_HALF_5;
const A_40 = 0.8 * Math.exp(-K_5 * 40);

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-half-life',
    title: 'Half, Then Half Again',
    prompt: 'How does the time to lose the second half compare with the time to lose the first half?',
    widget,
    table: rateTable({
      pieces: [
        stmt('longer', 'Longer', { x: 22, y: 53 }),
        stmt('same', 'The same', { x: 56, y: 53 }),
        stmt('shorter', 'Shorter', { x: 90, y: 53 })
      ],
      fixtures: [
        kvesselFixture('v1', { x: 50, y: 23 }, {
          title: 'Fuel breakdown',
          equation: 'A → products',
          order: 1,
          k: K_20,
          a0: 0.80,
          tMax: 45,
          mode: 'reactant',
          halfLives: true,
          w: 88,
          h: 36
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Second halving', at: { x: 126, y: 23 }, size: { w: 38, h: 14 } }]
      }
    }),
    hints: [
      'Press "Run" and watch the halving markers appear on the curve.',
      'Compare the time for the first halving with the time for the second.',
      'Equal time gaps mean the halving time stays constant.'
    ],
    check(state) {
      if (!state.table.fixtures.v1.props.ran) {
        return { ok: false, notYet: true, msg: 'Press "Run" to trace the curve and its halving markers first.' };
      }
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Second halving".' };
      if (card.id === 'longer' || card.id === 'shorter') {
        return { ok: false, msg: 'Check the two time intervals marked above the curve.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'First and second halvings both took 20 s.',
      title: 'Half-Life',
      body: 'Both halvings took 20 s. That repeating time gap is the reaction\'s half-life.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-three-halves',
    title: 'After Three Half-Lives',
    briefing: {
      speaker: SPEAKER,
      body: 'Each half-life cuts the remaining reactant in half: ½ (0.50) after one, ¼ (0.25) after two. You can type a decimal (0.125) or a fraction (1/8).'
    },
    prompt: 'What fraction of the reactant is left after three half-lives?',
    entry: { id: 'frac', label: 'Fraction left', unit: '' },
    widget,
    table: rateTable({
      pieces: [],
      fixtures: [
        kvesselFixture('v1', { x: 75, y: 28 }, {
          title: 'Fuel decay · half-life = 20 s',
          order: 1,
          k: K_20,
          a0: 0.80,
          tMax: 65,
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
      'Look at the three dotted half-life markers on the curve.',
      'Each half-life cuts what is left in half again.',
      'After two half-lives ¼ (0.25) remains, and the third half-life halves that again.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'frac');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Type the remaining fraction (for example 0.125 or 1/8).' };
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
      body: 'After three half-lives, ½ × ½ × ½ = 0.125 (⅛) remains. Each half-life cuts what is left in half.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-which-plot',
    title: 'Which Plot Is Straight',
    briefing: {
      speaker: SPEAKER,
      body: 'ln[A] is the natural log of [A] (the ln key on a calculator). For a reaction with equal half-lives, one of these three plots turns into a straight line.'
    },
    prompt: 'Which plot of this reaction\'s data forms a straight line?',
    widget,
    table: rateTable({
      pieces: [
        stmt('A', '[A] vs t', { x: 22, y: 53 }),
        stmt('lnA', 'ln[A] vs t', { x: 56, y: 53 }),
        stmt('invA', '1/[A] vs t', { x: 90, y: 53 })
      ],
      fixtures: [
        plotterFixture('plot', { x: 50, y: 23 }, {
          title: 'Fuel readings',
          datasets: [{ label: 'Fuel', points: N2O5_POINTS }],
          w: 88,
          h: 36
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Straight plot', at: { x: 126, y: 23 }, size: { w: 38, h: 14 } }]
      }
    }),
    hints: [
      'Switch the "Plot" dial through [A], ln[A], and 1/[A] and compare each to the dashed straightedge.',
      'Look for the plot where every point sits right on the dashed line.',
      'A reaction with a constant half-life straightens out on one specific plot.'
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
      body: 'ln[A] versus time is a straight line. That is the signature of a first-order reaction.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-three-reactions',
    title: 'Three Reactions',
    briefing: {
      speaker: SPEAKER,
      body: 'A straight [A] plot means zero order, a straight ln[A] plot means first order, and a straight 1/[A] plot means second order.'
    },
    prompt: 'What is the order of each reaction?',
    widget,
    table: rateTable({
      pieces: [
        stmt('R1', 'R1', { x: 92, y: 14 }),
        stmt('R2', 'R2', { x: 92, y: 30 }),
        stmt('R3', 'R3', { x: 92, y: 46 })
      ],
      fixtures: [
        plotterFixture('plot', { x: 38, y: 28 }, {
          title: 'Plotter',
          datasets: [
            { label: 'R1', points: R1_PTS },
            { label: 'R2', points: R2_PTS },
            { label: 'R3', points: R3_PTS }
          ],
          w: 68,
          h: 44
        })
      ],
      zones: {
        trays: [
          { id: 'zero', label: 'Zero order', at: { x: 130, y: 12 }, size: { w: 36, h: 13 }, cellH: 8 },
          { id: 'first', label: 'First order', at: { x: 130, y: 31 }, size: { w: 36, h: 13 }, cellH: 8 },
          { id: 'second', label: 'Second order', at: { x: 130, y: 50 }, size: { w: 36, h: 13 }, cellH: 8 }
        ]
      }
    }),
    hints: [
      'Select each reaction (R1, R2, R3) and check [A], ln[A], and 1/[A] against the dashed line.',
      'Match each reaction\'s straight plot to its order: [A] is zero, ln[A] is first, 1/[A] is second.',
      'Test each reaction one by one, since their labels are shuffled.'
    ],
    check(state) {
      const pieces = Object.values(state.table.pieces);
      const placed = pieces.filter(p => p.zone && p.zone.startsWith('tray:'));
      if (placed.length < 3) return { ok: false, notYet: true, msg: 'Sort all three reactions (R1, R2, R3) into the order trays.' };
      const zoneOf = id => pieces.find(p => p.id === id)?.zone;
      if (zoneOf('R1') !== 'tray:second') return { ok: false, msg: 'Check which plot is straight for R1.' };
      if (zoneOf('R2') !== 'tray:zero') return { ok: false, msg: 'Check which plot is straight for R2.' };
      if (zoneOf('R3') !== 'tray:first') return { ok: false, msg: 'Check which plot is straight for R3.' };
      return { ok: true };
    },
    reward: {
      log: 'R1 is second order, R2 is zero order, R3 is first order.',
      title: 'Integrated Rate Laws',
      body: 'R2 had a straight [A] plot (zero order), R3 had a straight ln[A] plot (first order), and R1 had a straight 1/[A] plot (second order).'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-k-halflife',
    title: 'k From the Half-Life',
    briefing: {
      speaker: SPEAKER,
      body: 'For a first-order reaction, k = 0.693 ÷ half-life (where 0.693 is ln 2). The unit 1/s means "per second".',
      worked: [
        'Example: half-life = 10 s',
        'k = 0.693 ÷ 10 = 0.0693 1/s'
      ]
    },
    prompt: 'What is k for this first-order reaction, in 1/s?',
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
          readout: 'Half-life = 15 s',
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
      'Read the half-life from the curve markers.',
      'Rearrange t½ = 0.693 / k on the plate to solve for k.',
      'A shorter half-life means a faster reaction and a larger k.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'k');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Type the rate constant k in 1/s.' };
      if (Math.abs(val - K_5) <= 0.002) return { ok: true };
      if (Math.abs(val - 0.693 * T_HALF_5) <= 0.5) {
        return { ok: false, msg: 'k should be small when the half-life is long. Divide 0.693 by 15, do not multiply.' };
      }
      if (Math.abs(val - T_HALF_5 / 0.693) <= 1.0) {
        return { ok: false, msg: 'Dividing 15 by 0.693 flips the formula upside down. Divide 0.693 by 15 instead.' };
      }
      return { ok: false, msg: `${val} 1/s gives a half-life of ${(0.693 / val).toFixed(1)} s, not 15 s.` };
    },
    reward: {
      log: 'k = 0.693 / 15 = 0.0462 1/s.',
      title: 'Half-Life and k',
      body: 'A 15 s half-life gives k = 0.693 ÷ 15 = 0.0462 1/s. Shorter half-lives always mean larger k.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-integrated',
    title: 'How Much Is Left',
    beyondAp: true,
    briefing: {
      speaker: SPEAKER,
      body: 'The straight ln[A] line has slope −k, which gives ln[A] = ln[A]₀ − kt, where [A]₀ is the starting concentration.',
      worked: [
        'Another run: [A]₀ = 0.50 mol/L, k = 0.10 1/s, t = 10 s',
        'ln[A] = ln 0.50 − 0.10 × 10 = −0.693 − 1.0 = −1.693',
        '[A] = e^(−1.693) = 0.18 mol/L'
      ]
    },
    prompt: 'How much reactant is left after 40 s, in mol/L?',
    entry: { id: 'left', label: 'Reactant left', unit: 'mol/L' },
    widget,
    table: rateTable({
      pieces: [],
      fixtures: [
        kvesselFixture('v1', { x: 48, y: 28 }, {
          title: 'First-order decay',
          order: 1,
          k: K_5,
          a0: 0.80,
          tMax: 30,
          extendTo: 45,
          mode: 'reactant',
          freezeAt: 1,
          noRun: true,
          w: 80,
          h: 40
        }),
        plaqueFixture('eq', 'The run', { x: 118, y: 28 }, ['[A]₀ = 0.80 mol/L', 'k = 0.0462 1/s'], { w: 46 })
      ],
      zones: {}
    }),
    hints: [
      'The solid curve stops at 30 s, so 40 s lies on the dashed extension.',
      'Estimate first: 40 s is between two half-lives (30 s) and three half-lives (45 s).',
      'Because 40 s lies between 30 s and 45 s, [A] must fall between 0.20 and 0.10 mol/L.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'left');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Type the concentration left in mol/L.' };
      if (Math.abs(val - A_40) <= 0.006) return { ok: true };
      if (val >= 0.2) return { ok: false, msg: 'At 30 s (two half-lives), 0.20 mol/L is left. At 40 s, less must remain.' };
      if (val < 0.1) return { ok: false, msg: 'At 45 s (three half-lives), 0.10 mol/L is left. At 40 s, more must remain.' };
      return { ok: false, msg: 'That is in the right range (between 0.10 and 0.20 mol/L), so double-check your ln[A] = ln[A]₀ − kt math.' };
    },
    reward: {
      log: '[A] after 40 s = 0.80 × e^(−0.0462 × 40) = 0.126 mol/L.',
      title: 'Integrated Rate Law',
      body: 'About 0.126 mol/L remains, right between 0.20 at two half-lives and 0.10 at three. The integrated rate law works for any time.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-second-order-halves',
    title: 'A Second-Order Reaction',
    prompt: 'For this second-order reaction (straight 1/[A] plot), how does the second halving time compare with the first?',
    widget,
    table: rateTable({
      pieces: [
        stmt('longer', 'Longer', { x: 22, y: 53 }),
        stmt('same', 'The same', { x: 56, y: 53 }),
        stmt('shorter', 'Shorter', { x: 90, y: 53 })
      ],
      fixtures: [
        kvesselFixture('v1', { x: 50, y: 23 }, {
          title: 'Second-order decay',
          equation: '2 NO₂ → 2 NO + O₂',
          order: 2,
          k: 0.0625,
          a0: 0.80,
          tMax: 70,
          mode: 'reactant',
          halfLives: true,
          w: 88,
          h: 36
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Second halving', at: { x: 126, y: 23 }, size: { w: 38, h: 14 } }]
      }
    }),
    hints: [
      'Press "Run" and read the time marked for each halving.',
      'Compare this with the first-order reaction, where both halvings took the same time.',
      'Because rate depends on [A]², losing half the reactant slows the reaction down sharply.'
    ],
    check(state) {
      if (!state.table.fixtures.v1.props.ran) {
        return { ok: false, notYet: true, msg: 'Press "Run" to trace the curve and its halving markers first.' };
      }
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Second halving".' };
      if (card.id === 'same') return { ok: false, msg: 'The markers show 20 s for the first halving and a different time for the second.' };
      if (card.id === 'shorter') return { ok: false, msg: 'The second halving spans more seconds on the axis than the first.' };
      return { ok: true };
    },
    reward: {
      log: 'Second-order halvings: 20 s, then 40 s.',
      title: 'Second-Order Half-Life',
      body: 'The second halving took twice as long (40 s vs 20 s) because less reactant means far fewer collisions. Only first-order reactions have a constant half-life.'
    }
  }
];


export const DEBRIEF = {
  title: 'Decay Plots Complete',
  body: 'First-order reactions have a constant half-life (t½ = 0.693/k). Checking whether [A], ln[A], or 1/[A] plots straight tells you if a reaction is zero, first, or second order.'
};

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const runFx = fixture => ({ run: { fixture } });

export const SOLUTIONS = [
  [runFx('v1'), put('same', 'slot:ans')],
  [{ type: { entry: 'frac', value: '0.125' } }],
  [dial('plot', 'plot', 2), put('lnA', 'slot:ans')],
  [put('R1', 'tray:second'), put('R2', 'tray:zero'), put('R3', 'tray:first')],
  [{ type: { entry: 'k', value: '0.0462' } }],
  [{ type: { entry: 'left', value: '0.126' } }],
  [runFx('v1'), put('longer', 'slot:ans')]
];

export const MISSES = [
  [runFx('v1'), put('longer', 'slot:ans')],
  [{ type: { entry: 'frac', value: '0.25' } }],
  [put('A', 'slot:ans')],
  [put('R1', 'tray:first'), put('R2', 'tray:first'), put('R3', 'tray:second')],
  [{ type: { entry: 'k', value: '10.4' } }],
  [{ type: { entry: 'left', value: '0.30' } }],
  [runFx('v1'), put('same', 'slot:ans')]
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

export const CHECKS = { K_20, T_HALF_5, K_5, A_40 };
