/**
 * Unit 14 · Bench 4 — Which Nuclei Last (q4-stability)
 *
 * The separation hall in Cinder Halo's fourth crater, on the nuke kit. Eight stages and ONE click: the belief that a stable nucleus holds
 * as many neutrons as protons. The chart answers it: the stable squares bend above that line as nuclei grow, and the nucleus view shows
 * why (every proton pushes on every other, while the strong nuclear force holds only touching nucleons, so a big nucleus needs extra
 * neutrons). The rest of the bench reads the band: a nucleus off it decays toward it, by the move the chart's legend draws.
 *
 *   1  the stable squares up to calcium                               -> about equal: the band of stability
 *   2  PREDICT: lead-208, 82 protons: more, as many or fewer neutrons?
 *   3  TEST: the whole band, with pushes and holds drawn              -> more; the strong nuclear force
 *   4  carbon-14, above the band                                      -> beta decay
 *   5  oxygen-15, below the band                                      -> positron emission
 *   6  polonium-210, past the band's end                              -> alpha decay
 *   7  gold-197's neutron-to-proton ratio (typed)                     -> 1.49
 *   8  SEALED: 27 protons, 33 neutrons                               -> beta decay
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { nukeTable, nchartFixture, nnucFixture, nchoiceFixture, chosenIndex, chartMove, pickValue, chartPick, note } from '../../table/kits/nuke.js';
import { nameOf, stable, stepOf, DECAY } from '../../engine/nucdata.js';

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\bband of stability\b/i, introducedAt: 1 },
  { term: /\bstrong nuclear force\b/i, introducedAt: 3 },
  { term: /\bneutron-to-proton ratio\b/i, introducedAt: 7 }
];

/** Every kind of decay as a step on the chart (bench 3). */
export const BUILDS_ON = ['unit14/q3-equations'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit14/q4-stability';
const GUESS = { 'g-same': 'the same number', 'g-more': 'more', 'g-fewer': 'fewer' };
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

const inSlot = (state, slot) => Object.values(state.table.pieces).find(p => p.zone === `slot:${slot}`) || null;

/** A stage that asks which decay brings a marked nucleus toward the band, answered on the chart's legend of moves. */
function moveStage({ id, title, prompt, briefing = null, Z, N, label, z, n, answer, hints, reward }) {
  return {
    id, title, prompt, widget,
    ...(briefing ? { briefing: { speaker: SPEAKER, body: briefing } } : {}),
    table: nukeTable({ pieces: [], fixtures: [nchartFixture('chart', { x: 74, y: 31 }, { z, n, band: true, line: true, mode: 'move', marks: [{ Z, N, label }], preview: true, w: 142, h: 60 })] }),
    hints,
    check(state) {
      const mv = chartMove(state.table, 'chart');
      if (!mv) return { ok: false, notYet: true, msg: 'Tap one of the moves on the chart.' };
      if (mv === answer) return { ok: true };
      const s = stepOf(mv); const to = { Z: Z + s.dZ, N: N + s.dN };
      return { ok: false, msg: `${DECAY[mv].name[0].toUpperCase()}${DECAY[mv].name.slice(1)} lands on ${nameOf(to.Z)}-${to.Z + to.N}, which is not stable (not a filled square).` };
    },
    reward
  };
}

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-band',
    title: 'The Stable Squares',
    briefing: { speaker: SPEAKER, body: 'Filled amber squares are stable nuclei that never decay, and the dashed line marks equal protons and neutrons. Tap any column to inspect an element\'s stable isotopes.' },
    prompt: 'For elements up to calcium, how does a stable nucleus\'s neutron count compare with its proton count?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        nchartFixture('chart', { x: 52, y: 31 }, { z: [1, 20], n: [0, 28], band: true, line: true, mode: 'columns', w: 100, h: 60 }),
        nchoiceFixture('ans', 'Neutrons compared with protons', { x: 126, y: 32 }, { options: ['About equal', 'About twice as many', 'Fewer'], w: 42 })
      ]
    }),
    hints: [
      'Tap columns on the chart to see which isotopes of each element are stable.',
      'Compare where the filled squares sit relative to the dashed equal-number line.',
      'Squares on the dashed line have equal neutrons and protons, while squares above it have more neutrons.'
    ],
    check(state) {
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three choices.' };
      if (pick === 1) return { ok: true };
      if (pick === 2) return { ok: false, msg: 'Stable calcium has 20 protons and 20 neutrons, not twice as many.' };
      return { ok: false, msg: 'Every filled square up to calcium sits on or just above the dashed line.' };
    },
    reward: { log: 'Up to calcium, stable nuclei hold about as many neutrons as protons.', title: 'Band of Stability', body: 'About equal: the filled squares sit on or just above the line. Together, all stable nuclei form the band of stability.' }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'The Heavy End',
    predict: true,
    prompt: 'With 82 protons, do you expect stable lead to have more, fewer, or the same number of neutrons?',
    widget,
    table: nukeTable({
      pieces: [
        note('g-same', 'Same as protons', { x: 34, y: 14 }),
        note('g-more', 'More than protons', { x: 34, y: 33 }),
        note('g-fewer', 'Fewer than protons', { x: 34, y: 52 })
      ],
      fixtures: [],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 30 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'There is no wrong prediction, so drag the card you expect into the slot.',
      'Protons all have a positive charge, and like charges repel each other.',
      'Think about what a nucleus packed with 82 protons needs to hold together.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Drag a prediction card into the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Check the full band of stability on the next bench to test your prediction.' }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's3-heavy',
      title: 'Repulsion and the Strong Force',
      briefing: { speaker: SPEAKER, body: 'Every proton repels every other proton in the nucleus. The strong nuclear force pulls touching protons and neutrons together.' },
      get prompt() { const g = guess(); return `Do stable heavy nuclei have more neutrons than protons, the same number, or fewer?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: nukeTable({
        pieces: [],
        fixtures: [
          nchartFixture('chart', { x: 52, y: 31 }, { z: [1, 83], n: [0, 127], band: true, line: true, mode: 'columns', w: 100, h: 60 }),
          nnucFixture('nuc', { x: 126, y: 16 }, { follow: 'chart', w: 46, h: 31, title: 'Repulsion and hold' }),
          nchoiceFixture('ans', 'Stable heavy nuclei hold', { x: 124, y: 48 }, { options: ['More neutrons', 'The same number', 'Fewer neutrons'], w: 42 })
        ]
      }),
      hints: [
        'Tap a light column and a heavy column on the chart, and watch the repulsion and hold bars.',
        'Notice where the amber band bends relative to the dashed line for heavy elements.',
        'Neutrons add strong-force attraction without adding electrical repulsion, so ask what heavy nuclei need more of.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three choices.' };
        if (pick === 1) return { ok: true };
        return { ok: false, msg: 'Stable lead nuclei hold 122 to 126 neutrons alongside their 82 protons.' };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Heavy stable nuclei hold more neutrons than protons.',
          title: 'Strong Nuclear Force',
          body: `More neutrons.${g ? ` You predicted ${g}.` : ''} The band bends upward because extra neutrons add strong nuclear force attraction without adding proton repulsion.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  moveStage({
    id: 's4-above',
    title: 'Too Many Neutrons',
    briefing: 'The buttons beside the chart preview three decay moves. Unstable nuclei decay toward the filled amber squares.',
    prompt: 'Which decay moves carbon-14 from above the band of stability onto the band?',
    Z: 6, N: 8, label: 'Carbon-14', z: [1, 10], n: [0, 12], answer: 'beta',
    hints: [
      'Tap each decay button beside the chart to preview where its arrow lands.',
      'Compare carbon-14\'s neutron count with the stable carbon isotopes in its column.',
      'Pick the decay whose arrow lands on a filled amber square.'
    ],
    reward: { log: 'Carbon-14 decays by beta decay onto nitrogen-14.', title: 'Above the Band', body: 'Beta decay: a neutron turns into a proton, moving carbon-14 onto stable nitrogen-14.' }
  }),

  /* ---------------------------------------------------------------- 5 */
  moveStage({
    id: 's5-below',
    title: 'Too Few Neutrons',
    prompt: 'Which decay moves oxygen-15 from below the band of stability onto the band?',
    Z: 8, N: 7, label: 'Oxygen-15', z: [1, 10], n: [0, 12], answer: 'positron',
    hints: [
      'Tap each decay button beside the chart to preview where its arrow lands.',
      'Compare oxygen-15\'s neutron count with the stable oxygen isotopes in its column.',
      'Pick the decay whose arrow lands on a filled amber square.'
    ],
    reward: { log: 'Oxygen-15 decays by positron emission onto nitrogen-15.', title: 'Below the Band', body: 'Positron emission: a proton turns into a neutron, moving oxygen-15 onto stable nitrogen-15.' }
  }),

  /* ---------------------------------------------------------------- 6 */
  moveStage({
    id: 's6-past',
    title: 'Past Lead',
    briefing: 'No nucleus with more than 83 protons is stable. Nuclei past the dashed line must lose protons to reach the band.',
    prompt: 'With 84 protons past the end of the band, which decay brings polonium-210 onto the band?',
    Z: 84, N: 126, label: 'Polonium-210', z: [76, 90], n: [118, 132], answer: 'alpha',
    hints: [
      'Find polonium-210 past the 83-proton line and tap the decay buttons to preview.',
      'Compare how many protons each decay removes.',
      'Pick the decay whose arrow lands on a filled amber square.'
    ],
    reward: { log: 'Polonium-210 decays by alpha decay onto lead-206.', title: 'Past the End', body: 'Alpha decay: it removes 2 protons and 2 neutrons at once, landing on stable lead-206.' }
  }),

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-ratio',
    title: 'The Ratio',
    briefing: {
      speaker: SPEAKER,
      body: 'A nucleus\'s neutron-to-proton ratio is its number of neutrons divided by its number of protons.',
      worked: ['Iron-56: 26 protons, 56 − 26 = 30 neutrons', '30 ÷ 26 = 1.15 neutrons per proton']
    },
    prompt: 'What is the neutron-to-proton ratio of stable gold-197?',
    widget,
    entry: { id: 'ratio', label: 'Neutrons per proton', unit: '' },
    table: nukeTable({ pieces: [], fixtures: [nchartFixture('chart', { x: 74, y: 31 }, { z: [70, 83], n: [112, 124], band: true, line: false, mode: 'pick', marks: [{ Z: 79, N: 118, label: 'Gold-197' }], w: 140, h: 60 })] }),
    hints: [
      'Tap the marked gold-197 square to read its proton and neutron counts.',
      'Set up a division comparing the neutrons to the protons.',
      'Divide neutrons by protons, not protons by neutrons.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ratio');
      if (v == null) return { ok: false, notYet: true, msg: 'Type the ratio in the box.' };
      if (v >= 1.48 && v <= 1.5 + 1e-9) return { ok: true };
      if (Math.abs(v - 2.49) < 0.02) return { ok: false, msg: 'That is 197 ÷ 79, which uses the mass number (protons plus neutrons) instead of neutrons alone.' };
      if (Math.abs(v - 0.67) < 0.02) return { ok: false, msg: 'That is 79 ÷ 118, protons per neutron instead of neutrons per proton.' };
      if (Math.abs(v - 1) < 0.01) return { ok: false, msg: 'Gold-197 has more neutrons than protons, so its ratio is greater than 1.' };
      if (v > 50) return { ok: false, msg: `${v} is the number of neutrons, not the ratio.` };
      return { ok: false, msg: `A ratio of ${v} with 79 protons would mean ${Math.round(v * 79)} neutrons.` };
    },
    reward: { log: 'Gold-197: 118 neutrons for 79 protons, 1.49.', title: 'Neutron-to-Proton Ratio', body: '1.49 (118 neutrons ÷ 79 protons). Heavy stable nuclei hold roughly one and a half neutrons for every proton.' }
  }
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Stable nuclei form a band that curves toward more neutrons for heavier elements. Unstable nuclei decay toward the band: beta from above, positron emission from below, and alpha past 83 protons.' }]
};

/** Slips a student makes on stage 7 (typed), each refused with a reason. */
export const SLIPS = { 7: [2.49, 0.67, 1, 118, 1.15, 2] };

/* ---- scripts of the player's own actions ---- */
const put = (piece, to) => ({ place: { piece, to } });
const choose = n => ({ setDial: { fixture: 'ans', dial: 'value', value: n } });
const col = Z => ({ setDial: { fixture: 'chart', dial: 'pick', value: Z } });
const move = m => ({ setDial: { fixture: 'chart', dial: 'move', value: ['alpha', 'beta', 'positron'].indexOf(m) + 1 } });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const tap = (stage, Z, N) => ({ setDial: { fixture: 'chart', dial: 'pick', value: pickValue(STAGES[stage].table.fixtures.find(f => f.id === 'chart'), Z, N) } });

export const SOLUTIONS = [
  [col(20), choose(1)],
  [put('g-same', 'slot:guess')],
  [col(8), col(82), choose(1)],
  [move('positron'), move('beta')],
  [move('positron')],
  [move('alpha')],
  [tap(6, 79, 118), typed('ratio', 1.49)]
];

export const MISSES = [
  [col(20), choose(2)],
  [],
  [col(82), choose(2)],
  [move('positron')],
  [move('beta')],
  [move('beta')],
  [tap(6, 79, 118), typed('ratio', 2.49)]
];

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export { chartPick, stable };
