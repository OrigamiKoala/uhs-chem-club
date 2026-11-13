/**
 * Unit 11 · Bench 1 — How Fast (q1-watch)
 *
 * The storm-belt cracking manifold, on the rate kit (`table/kits/rate.js`).
 * Six stages and ONE click: students think a faster reaction ends with more product;
 * both vessels end at 0.40 mol/L, and the faster one climbs more steeply.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  rateTable, kvesselFixture, rateLeadFixture, choiceFixture, pickable, stmt
} from '../../table/kits/rate.js';

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\breaction rates?\b/i, introducedAt: 2 }
];

export const BUILDS_ON = [];

const SPEAKER = 'Vess';

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit11/q1-watch';

const GUESS_LABELS = {
  steeper: 'It climbs more steeply',
  higher: 'It ends higher',
  later: 'It starts later'
};

// Stage 2: both end at 0.40 mol/L; Vessel 2 reaches it much faster (k = 0.25 vs 0.08).
const V1 = { order: 1, k: 0.08, a0: 0.40, tMax: 30 };
const V2 = { order: 1, k: 0.25, a0: 0.40, tMax: 30 };

// Stage 3: average rate over first 10 s: 0.60 -> 0.20 mol/L => 0.040 mol/(L·s).
const AVG_RATE = 0.04;

// Stage 6: Change dial presets (k values relative to baseline k = 0.08).
const CHANGE_OPTIONS = ['Baseline', 'More A', 'Higher T', 'Powdered solid', 'Larger vessel'];
const CHANGE_PRESETS = [
  { k: 0.08, a0: 0.40 },
  { k: 0.08, a0: 0.70 },
  { k: 0.22, a0: 0.40 },
  { k: 0.18, a0: 0.40 },
  { k: 0.04, a0: 0.25 }
];

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Fast and Slow',
    predict: true,
    prompt: 'Two reactions end with the same amount of product: how does the faster one\'s graph differ?',
    widget,
    table: rateTable({
      pieces: [
        stmt('steeper', 'It climbs more steeply', { x: 96, y: 14 }),
        stmt('higher', 'It ends higher', { x: 96, y: 30 }),
        stmt('later', 'It starts later', { x: 96, y: 46 })
      ],
      fixtures: [
        rateLeadFixture('clip', { x: 40, y: 27 }, { scene: 'rates', title: 'Watch first', w: 66, h: 30 })
      ],
      zones: {
        slots: [{ id: 'guess', label: 'My prediction', at: { x: 132, y: 30 }, size: { w: 28, h: 14 } }]
      }
    }),
    hints: [
      'Watch how the curve in the preview climbs as product forms.',
      'A faster reaction makes more product in each second.',
      'Making the same final amount in less time changes the slope, not the height.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place one prediction card in "My prediction".' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked for the two-vessel test.',
      title: 'Prediction Locked',
      body: 'You locked in your prediction. Now run two vessels side by side to test it.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-two-vessels',
    title: 'Two Vessels',
    briefing: {
      speaker: SPEAKER,
      body: 'Reaction rate is how fast the concentration of a substance changes, in moles per litre (mol/L) each second.'
    },
    get prompt() {
      const g = recall(QUEST_KEY);
      return g
        ? `You predicted "${GUESS_LABELS[g]}". Run both vessels: which reaction has the higher rate?`
        : 'Which reaction has the higher rate?';
    },
    widget,
    table: rateTable({
      pieces: [],
      fixtures: [
        pickable(kvesselFixture('v1', { x: 38, y: 24 }, { ...V1, title: 'Vessel 1', w: 64, h: 34 }), 1, 'pick'),
        pickable(kvesselFixture('v2', { x: 110, y: 24 }, { ...V2, title: 'Vessel 2', w: 64, h: 34 }), 2, 'pick'),
        choiceFixture('pick', 'Higher rate', { x: 74, y: 52 }, { options: ['Vessel 1', 'Vessel 2', ' '] })
      ],
      zones: {}
    }),
    hints: [
      'Press "Run" on both vessels and tap the one that finishes sooner.',
      'Compare how steeply the two product lines climb.',
      'Both end at the same concentration, so what differs is how long each took to get there.'
    ],
    check(state) {
      const t = state.table;
      if (!t.fixtures.v1.props.ran || !t.fixtures.v2.props.ran) {
        return { ok: false, notYet: true, msg: 'Press "Run" on both Vessel 1 and Vessel 2 first.' };
      }
      const pick = Math.round(t.fixtures.pick.dials.value.value);
      if (pick === 3) return { ok: false, notYet: true, msg: 'Tap the vessel with the higher reaction rate.' };
      if (pick === 1) {
        return { ok: false, msg: 'Vessel 2 reached 0.40 mol/L product much earlier than Vessel 1, with a steeper line.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Vessel 2 climbed more steeply to 0.40 mol/L.',
      title: 'Reaction Rate',
      get body() {
        const g = recall(QUEST_KEY);
        const tail = g === 'steeper' ? ' Your prediction matched what the vessels showed.' : '';
        return `Vessel 2's product rose faster, so its line is steeper. The steepness of the concentration-time line is the reaction rate.${tail}`;
      }
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-average-rate',
    title: 'Putting a Number on It',
    briefing: {
      speaker: SPEAKER,
      body: 'Average reaction rate equals change in concentration divided by time.',
      worked: [
        'Other run: 0.40 mol/L at 0 s, 0.10 mol/L at 20 s',
        'Change = 0.40 − 0.10 = 0.30 mol/L in 20 s',
        'Average rate = 0.30 ÷ 20 = 0.015 mol/(L·s)'
      ]
    },
    prompt: 'What is the average rate of this reaction over its first 10 seconds, in mol/L each second?',
    entry: { id: 'rate', label: 'Average rate', unit: 'mol/(L·s)' },
    widget,
    table: rateTable({
      pieces: [],
      fixtures: [
        kvesselFixture('v1', { x: 75, y: 28 }, {
          title: 'Reactant A',
          order: 1,
          k: Math.log(3) / 10,
          a0: 0.60,
          tMax: 15,
          mode: 'reactant',
          w: 112,
          h: 40,
          markedPoints: [
            { t: 0, v: 0.60, label: '(0 s, 0.60)', dx: 2, dy: 2 },
            { t: 10, v: 0.20, label: '(10 s, 0.20)', dx: 2, dy: -2 }
          ]
        })
      ],
      zones: {}
    }),
    hints: [
      'Press "Run" to trace the curve and read the two marked points.',
      'Find how much the reactant concentration dropped between 0 s and 10 s.',
      'Divide that concentration change by the 10 s time interval.'
    ],
    check(state) {
      if (!state.table.fixtures.v1.props.ran) {
        return { ok: false, notYet: true, msg: 'Press "Run" on the vessel to trace the curve first.' };
      }
      const val = entryNumber(state.table, 'rate');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Type the average rate in mol/(L·s).' };
      if (Math.abs(val - AVG_RATE) <= 0.002) return { ok: true };
      if (Math.abs(val - 0.40) <= 0.02) {
        return { ok: false, msg: 'At 0.40 mol/(L·s), 10 s would use 4.00 mol/L, more than the 0.60 mol/L present.' };
      }
      if (Math.abs(val - 0.02) <= 0.002) {
        return { ok: false, msg: 'At 0.020 mol/(L·s), 10 s would leave 0.40 mol/L, not 0.20 mol/L.' };
      }
      return { ok: false, msg: `At ${val} mol/(L·s) over 10 s, concentration would fall by ${(val * 10).toFixed(2)} mol/L instead of 0.40 mol/L.` };
    },
    reward: {
      log: 'Measured average rate = 0.04 mol/(L·s) over 10 s.',
      title: 'Average Rate',
      body: 'Over 10 seconds the concentration fell 0.40 mol/L, giving an average rate of 0.04 mol/(L·s).'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-slowing-down',
    title: 'Slowing Down',
    prompt: 'Where on this curve is the reaction fastest?',
    widget,
    table: rateTable({
      pieces: [],
      fixtures: [
        kvesselFixture('v1', { x: 75, y: 28 }, {
          title: 'Reactant decay',
          order: 1,
          k: 0.12,
          a0: 0.80,
          tMax: 30,
          mode: 'reactant',
          w: 112,
          h: 40,
          tapZones: [
            { x0: 0.0, x1: 0.22, label: '0-5 s' },
            { x0: 0.34, x1: 0.56, label: '10-15 s' },
            { x0: 0.68, x1: 1.0, label: '20-30 s' }
          ]
        })
      ],
      zones: {}
    }),
    hints: [
      'Press "Run", watch the particles, and tap one of the three stretches on the curve.',
      'Compare how steep the curve is at the start versus the end.',
      'The reaction is fastest where the curve is steepest and most reactant remains.'
    ],
    check(state) {
      const f = state.table.fixtures.v1;
      if (!f.props.ran) return { ok: false, notYet: true, msg: 'Press "Run" to trace the curve first.' };
      const z = Math.round(f.dials.zone.value);
      if (z === 4) return { ok: false, notYet: true, msg: 'Tap one of the three stretches on the curve.' };
      if (z === 2) return { ok: false, msg: 'Between 10 s and 15 s the curve is already gentler than at 0-5 s.' };
      if (z === 3) return { ok: false, msg: 'Between 20 s and 30 s the curve is nearly flat and few reactant particles remain.' };
      return { ok: true };
    },
    reward: {
      log: 'Fastest at 0-5 s where most reactant remains.',
      title: 'Rate Over Time',
      body: 'At the start, most reactant is present and the curve is steepest. As reactant is used up, the curve flattens and the rate falls.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-stoich',
    title: 'Two for One',
    prompt: 'For 2 A → B, how does the rate at which A is used compare with the rate at which B forms?',
    widget,
    table: rateTable({
      pieces: [
        stmt('same', 'The same', { x: 96, y: 14 }),
        stmt('twice', 'Twice as fast', { x: 96, y: 30 }),
        stmt('half', 'Half as fast', { x: 96, y: 46 })
      ],
      fixtures: [
        kvesselFixture('v1', { x: 39, y: 28 }, {
          title: 'Reaction',
          equation: '2 A → B',
          order: 1,
          k: 0.08,
          a0: 0.80,
          tMax: 30,
          stoich: { a: 2, b: 1 },
          mode: 'both',
          showCounts: true,
          w: 68,
          h: 40
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Rate of A vs B', at: { x: 132, y: 30 }, size: { w: 28, h: 14 } }]
      }
    }),
    hints: [
      'Press "Run" and watch the counts of A used and B formed.',
      'Compare the number of A particles lost with the number of B particles gained.',
      'Each B that forms takes some number of A with it, as the equation says; use that to compare the two changes.'
    ],
    check(state) {
      if (!state.table.fixtures.v1.props.ran) {
        return { ok: false, notYet: true, msg: 'Press "Run" to watch the particle counts first.' };
      }
      const p = Object.values(state.table.pieces).find(x => x.zone === 'slot:ans');
      if (!p) return { ok: false, notYet: true, msg: 'Place a card in "Rate of A vs B".' };
      if (p.id === 'same') return { ok: false, msg: 'Compare the two counts: the number of A used is not the number of B formed.' };
      if (p.id === 'half') return { ok: false, msg: 'The counts show more A used than B formed in the same time, not fewer.' };
      return { ok: true };
    },
    reward: {
      log: 'For 2 A → B, A is consumed twice as fast as B forms.',
      title: 'Stoichiometry and Rate',
      body: 'Two A particles are used for each B formed, so A disappears twice as fast as B appears.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-factors',
    title: 'Three Changes',
    prompt: 'Which changes make this reaction faster?',
    widget,
    table: rateTable({
      pieces: [
        stmt('moreA', 'More A', { x: 94, y: 10 }),
        stmt('hotter', 'Higher T', { x: 94, y: 24 }),
        stmt('powder', 'Powdered solid', { x: 94, y: 38 }),
        stmt('bigger', 'Larger vessel', { x: 94, y: 52 })
      ],
      fixtures: [
        kvesselFixture('v1', { x: 38, y: 28 }, {
          title: 'Compare to baseline',
          order: 1,
          k: 0.08,
          a0: 0.40,
          tMax: 30,
          mode: 'product',
          w: 64,
          h: 40,
          baseline: { order: 1, k: 0.08, a0: 0.40 },
          changeDial: {
            label: 'Change',
            options: CHANGE_OPTIONS,
            presets: CHANGE_PRESETS
          }
        })
      ],
      zones: {
        trays: [
          { id: 'faster', label: 'Faster', at: { x: 129, y: 16 }, size: { w: 32, h: 16 }, cellH: 8 },
          { id: 'slower', label: 'Slower', at: { x: 129, y: 35 }, size: { w: 32, h: 12 }, cellH: 8 },
          { id: 'same', label: 'No change', at: { x: 129, y: 52 }, size: { w: 32, h: 12 }, cellH: 8 }
        ]
      }
    }),
    hints: [
      'Pick each setting on the "Change" dial, press "Run", and compare its curve with the dashed baseline.',
      'See which changes give a steeper curve than the baseline.',
      'More particles in the same volume, faster particles, and more exposed surface speed collisions; a larger vessel spreads them out.'
    ],
    check(state) {
      const pieces = Object.values(state.table.pieces);
      const placed = pieces.filter(p => p.zone && p.zone.startsWith('tray:'));
      if (placed.length < 4) {
        return { ok: false, notYet: true, msg: 'Sort all four change cards into Faster, Slower, or No change.' };
      }
      const inTray = id => pieces.filter(p => p.zone === `tray:${id}`).map(p => p.id);
      const f = inTray('faster');
      const s = inTray('slower');
      if (!s.includes('bigger')) {
        return { ok: false, msg: 'In the larger vessel, the curve climbs more gently than the dashed baseline.' };
      }
      if (!f.includes('moreA') || !f.includes('hotter') || !f.includes('powder')) {
        return { ok: false, msg: 'More A, Higher T, and Powdered solid all climb more steeply than the dashed baseline.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Higher concentration, higher T, and powdered solid speed the reaction; larger vessel slows it.',
      title: 'Factors Affecting Rate',
      body: 'More particles in the same volume, higher temperature, and more exposed surface all gave steeper lines. A larger vessel spread particles out and slowed it.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-stoich-rate',
    title: 'Rate of Each Substance',
    briefing: {
      speaker: SPEAKER,
      body: 'One reaction has one rate, but each substance changes by its own amount. A substance with a bigger coefficient changes faster.',
      worked: [
        'Other reaction: 2 A → B, A used at 0.040 mol/(L·s)',
        'Two A go for each B, so B forms at half that: 0.020 mol/(L·s)'
      ]
    },
    prompt: 'How fast does NH₃ form in N₂ + 3 H₂ → 2 NH₃ while H₂ is used at 0.060 mol/(L·s)?',
    entry: { id: 'rate_b', label: 'Rate NH₃ forms', unit: 'mol/(L·s)' },
    widget,
    table: rateTable({
      pieces: [],
      fixtures: [
        kvesselFixture('v1', { x: 75, y: 28 }, {
          title: 'H₂ and NH₃',
          equation: '3 H₂ → 2 NH₃',
          order: 1,
          k: 0.08,
          a0: 0.90,
          tMax: 30,
          stoich: { a: 3, b: 2 },
          mode: 'both',
          showCounts: true,
          w: 112,
          h: 40
        })
      ],
      zones: {}
    }),
    hints: [
      'Press "Run" and compare how many H₂ are used with how many NH₃ form.',
      'In the same time, the counts differ by the ratio in the equation.',
      'Scale the given rate by the same ratio, and check that the answer is smaller or larger as the counts show.'
    ],
    check(state) {
      if (!state.table.fixtures.v1.props.ran) {
        return { ok: false, notYet: true, msg: 'Press "Run" to see the counts first.' };
      }
      const val = entryNumber(state.table, 'rate_b');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Type the rate in mol/(L·s).' };
      if (Math.abs(val - 0.04) <= 0.0015) return { ok: true };
      if (Math.abs(val - 0.06) <= 0.0015) return { ok: false, msg: 'The counts show fewer NH₃ formed than H₂ used, so the two rates are not equal.' };
      if (val > 0.06) return { ok: false, msg: 'The counts show NH₃ forming more slowly than H₂ is used, but that value is faster.' };
      return { ok: false, msg: 'Compare that value with the counts: how many NH₃ form for each H₂ used?' };
    },
    reward: {
      log: 'NH₃ forms at 0.060 × 2/3 = 0.040 mol/(L·s).',
      title: 'Rates and Coefficients',
      body: 'For every 3 H₂ used, 2 NH₃ form, so NH₃ forms at two thirds of the rate H₂ is used: 0.040 mol/(L·s).'
    }
  }
];

applyNotes(STAGES, {
  1: ['Watch the preview, then drop one prediction card into the slot.'],
  2: ['Press "Run" on both vessels, then tap the faster one.'],
  3: ['Press "Run", then type the average rate from 0 s to 10 s.'],
  4: ['Press "Run", then tap one of the three stretches on the curve.'],
  5: ['Press "Run" to watch the counts, then place one card in the slot.'],
  6: ['Test each setting on the "Change" dial with "Run", then sort all four cards.']
});

export const DEBRIEF = {
  title: 'Manifold Rate Check Complete',
  body: 'Reaction rate is the steepness of concentration against time, set by stoichiometry, concentration, temperature, and surface area.'
};

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const runFx = fixture => ({ run: { fixture } });

export const SOLUTIONS = [
  [put('steeper', 'slot:guess')],
  [runFx('v1'), runFx('v2'), dial('pick', 'value', 2)],
  [runFx('v1'), { type: { entry: 'rate', value: '0.04' } }],
  [runFx('v1'), dial('v1', 'zone', 1)],
  [runFx('v1'), put('twice', 'slot:ans')],
  [runFx('v1'), put('moreA', 'tray:faster'), put('hotter', 'tray:faster'), put('powder', 'tray:faster'), put('bigger', 'tray:slower')],
  [runFx('v1'), { type: { entry: 'rate_b', value: '0.04' } }]
];

export const MISSES = [
  [],
  [runFx('v1'), runFx('v2'), dial('pick', 'value', 1)],
  [runFx('v1'), { type: { entry: 'rate', value: '0.40' } }],
  [runFx('v1'), dial('v1', 'zone', 3)],
  [runFx('v1'), put('same', 'slot:ans')],
  [runFx('v1'), put('moreA', 'tray:faster'), put('hotter', 'tray:faster'), put('powder', 'tray:faster'), put('bigger', 'tray:faster')],
  [runFx('v1'), { type: { entry: 'rate_b', value: '0.06' } }]
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

export const CHECKS = { V1, V2, AVG_RATE, CHANGE_PRESETS };
