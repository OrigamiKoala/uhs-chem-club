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
import { applyNotes } from '../../table/notes.js';
import { nukeTable, nchartFixture, nnucFixture, nchoiceFixture, chosenIndex, chartMove, pickValue, chartPick, note } from '../../table/kits/nuke.js';
import { nameOf, stable, stepOf, DECAY } from '../../engine/nucdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bband of stability\b/i, introducedAt: 1 },
  { term: /\bstrong nuclear force\b/i, introducedAt: 3 },
  { term: /\bneutron-to-proton ratio\b/i, introducedAt: 7 }
];

/** Every kind of decay as a step on the chart (bench 3). */
export const BUILDS_ON = ['unit14/q3-equations'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit14/q4-stability';
const GUESS = { 'g-same': 'as many', 'g-more': 'more', 'g-fewer': 'fewer' };
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

const inSlot = (state, slot) => Object.values(state.table.pieces).find(p => p.zone === `slot:${slot}`) || null;

/** A stage that asks which decay brings a marked nucleus toward the band, answered on the chart's legend of moves. */
function moveStage({ id, title, prompt, briefing = null, Z, N, label, z, n, answer, hints, reward }) {
  return {
    id, title, prompt, widget,
    ...(briefing ? { briefing: { speaker: SPEAKER, body: briefing } } : {}),
    table: nukeTable({ pieces: [], fixtures: [nchartFixture('chart', { x: 74, y: 31 }, { z, n, band: true, line: true, mode: 'move', marks: [{ Z, N, label }], preview: false, w: 140, h: 60 })] }),
    hints,
    check(state) {
      const mv = chartMove(state.table, 'chart');
      if (!mv) return { ok: false, notYet: true, msg: 'Tap one of the moves on the chart.' };
      if (mv === answer) return { ok: true };
      const s = stepOf(mv); const to = { Z: Z + s.dZ, N: N + s.dN };
      return { ok: false, msg: `${DECAY[mv].name[0].toUpperCase()}${DECAY[mv].name.slice(1)} lands on ${nameOf(to.Z)}-${to.Z + to.N}, which is not a filled square.` };
    },
    reward
  };
}

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-band',
    title: 'The Stable Squares',
    briefing: { speaker: SPEAKER, body: 'On this chart a filled square is a stable nucleus, one that never decays, and the dashed line marks where protons equal neutrons. Tap a column to read an element\'s stable nuclei.' },
    prompt: 'For elements up to calcium, how do the neutrons of a stable nucleus compare with its protons?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        nchartFixture('chart', { x: 52, y: 31 }, { z: [1, 20], n: [0, 28], band: true, line: true, mode: 'columns', w: 100, h: 60 }),
        nchoiceFixture('ans', 'Neutrons compared with protons', { x: 126, y: 32 }, { options: ['About equal', 'About twice as many', 'Fewer'], w: 42 })
      ]
    }),
    hints: [
      'Tap columns on the chart to read which nuclei of each element are stable.',
      'Compare where the filled squares sit with the dashed line of equal numbers.',
      'A square on the line holds as many neutrons as protons; a square above it holds more.'
    ],
    check(state) {
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three statements.' };
      if (pick === 1) return { ok: true };
      if (pick === 2) return { ok: false, msg: 'Calcium has a stable nucleus with 20 protons and 20 neutrons.' };
      return { ok: false, msg: 'Every filled square up to calcium sits on the dashed line or just above it.' };
    },
    reward: { log: 'Up to calcium, stable nuclei hold about as many neutrons as protons.', title: 'Band of Stability', body: 'About equal: the filled squares lie on the line or just above it. The stable nuclei make a band on the chart, the band of stability.' }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'The Heavy End',
    predict: true,
    prompt: 'Lead-208 is stable and holds 82 protons: how many neutrons do you expect it holds, compared with its protons?',
    widget,
    table: nukeTable({
      pieces: [
        note('g-same', 'As many as its protons', { x: 34, y: 14 }),
        note('g-more', 'More than its protons', { x: 34, y: 33 }),
        note('g-fewer', 'Fewer than its protons', { x: 34, y: 52 })
      ],
      fixtures: [],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 30 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'Lead-208\'s mass number, 208, is its protons and neutrons together.',
      'Protons all carry a positive charge, and like charges repel.',
      'Think about what a nucleus with many protons would need more of to hold together.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Look at the whole band.' }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's3-heavy',
      title: 'Repulsion and the Strong Force',
      briefing: { speaker: SPEAKER, body: 'Every proton repels every other proton in the nucleus. The strong nuclear force holds protons and neutrons together, but only those that touch.' },
      get prompt() { const g = guess(); return `Do stable heavy nuclei hold more neutrons than protons, as many, or fewer?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: nukeTable({
        pieces: [],
        fixtures: [
          nchartFixture('chart', { x: 52, y: 31 }, { z: [1, 83], n: [0, 127], band: true, line: true, mode: 'columns', w: 100, h: 60 }),
          nnucFixture('nuc', { x: 126, y: 16 }, { follow: 'chart', w: 44, h: 30, title: 'Repulsion and hold' }),
          nchoiceFixture('ans', 'Stable heavy nuclei hold', { x: 124, y: 48 }, { options: ['More neutrons', 'As many', 'Fewer neutrons'], w: 40 })
        ]
      }),
      hints: [
        'Tap a light column and a heavy column on the chart, and read the counts under the nucleus view.',
        'Compare how the proton pairs that repel grow with how the touching pairs held grow, from a small nucleus to a big one.',
        'A neutron adds to the strong force\'s hold without adding any repulsion, so ask what a big nucleus needs more of.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three statements.' };
        if (pick === 1) return { ok: true };
        return { ok: false, msg: 'Lead\'s stable nuclei hold 122 to 126 neutrons with their 82 protons.' };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Heavy stable nuclei hold more neutrons than protons.',
          title: 'Strong Nuclear Force',
          body: `More${g ? ` (you predicted ${g})` : ''}: the band bends above the line. Extra neutrons add the strong nuclear force's hold without adding any repulsion.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  moveStage({
    id: 's4-above',
    title: 'Too Many Neutrons',
    briefing: 'The keys beside the chart are the three moves a decay can make, each drawn as an arrow. A nucleus off the band decays, and the decay moves it one of those ways.',
    prompt: 'Carbon-14 sits above the band: which decay brings it toward the band?',
    Z: 6, N: 8, label: 'Carbon-14', z: [1, 10], n: [0, 12], answer: 'beta',
    hints: [
      'Find carbon-14 on the chart, the filled squares near it, and the three arrows in the legend.',
      'Compare carbon-14\'s neutrons with those of the stable carbons in its column.',
      'Follow each arrow from carbon-14 in your head and ask which one heads toward the filled squares.'
    ],
    reward: { log: 'Carbon-14 decays by beta decay onto nitrogen-14.', title: 'Above the Band', body: 'Beta decay: a neutron becomes a proton, moving carbon-14 onto nitrogen-14, a filled square.' }
  }),

  /* ---------------------------------------------------------------- 5 */
  moveStage({
    id: 's5-below',
    title: 'Too Few Neutrons',
    prompt: 'Oxygen-15 sits below the band: which decay brings it toward the band?',
    Z: 8, N: 7, label: 'Oxygen-15', z: [1, 10], n: [0, 12], answer: 'positron',
    hints: [
      'Find oxygen-15 on the chart, the filled squares near it, and the three arrows in the legend.',
      'Compare oxygen-15\'s neutrons with those of the stable oxygens in its column.',
      'Follow each arrow from oxygen-15 in your head and ask which one heads toward the filled squares.'
    ],
    reward: { log: 'Oxygen-15 decays by positron emission onto nitrogen-15.', title: 'Below the Band', body: 'Positron emission: a proton becomes a neutron, moving oxygen-15 onto nitrogen-15. Electron capture would make the same move.' }
  }),

  /* ---------------------------------------------------------------- 6 */
  moveStage({
    id: 's6-past',
    title: 'Past Lead',
    prompt: 'Polonium-210 holds 84 protons, more than any stable nucleus: which decay does it undergo?',
    Z: 84, N: 126, label: 'Polonium-210', z: [76, 90], n: [118, 132], answer: 'alpha',
    hints: [
      'Find polonium-210 on the chart and the last column that has filled squares.',
      'Count how many protons polonium-210 has beyond that last column.',
      'Compare how many protons each arrow takes away with how far polonium-210 is past the band\'s end.'
    ],
    reward: { log: 'Polonium-210 decays by alpha decay onto lead-206.', title: 'Past the End', body: 'Alpha: it takes away two protons and two neutrons at once, landing on lead-206. No nucleus with more than 83 protons is stable.' }
  }),

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-ratio',
    title: 'The Ratio',
    briefing: {
      speaker: SPEAKER,
      body: 'A nucleus\'s neutron-to-proton ratio is its neutrons divided by its protons.',
      worked: ['Iron-56: 26 protons, 56 − 26 = 30 neutrons', '30 ÷ 26 = 1.15 neutrons for each proton']
    },
    prompt: 'What is the neutron-to-proton ratio of stable gold-197?',
    widget,
    entry: { id: 'ratio', label: 'Neutrons per proton', unit: '' },
    table: nukeTable({ pieces: [], fixtures: [nchartFixture('chart', { x: 74, y: 31 }, { z: [70, 83], n: [112, 124], band: true, line: false, mode: 'pick', marks: [{ Z: 79, N: 118, label: 'Gold-197' }], w: 140, h: 60 })] }),
    hints: [
      'Tap the marked square to read its protons and neutrons.',
      'Compare the neutrons with the protons as a division.',
      'Divide the neutrons by the protons, not the protons by the neutrons.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ratio');
      if (v == null) return { ok: false, notYet: true, msg: 'Type the ratio in the field.' };
      if (v >= 1.48 && v <= 1.5 + 1e-9) return { ok: true };
      if (Math.abs(v - 2.49) < 0.02) return { ok: false, msg: 'That is 197 ÷ 79: the mass number counts the protons too.' };
      if (Math.abs(v - 0.67) < 0.02) return { ok: false, msg: 'That is 79 ÷ 118: protons for each neutron.' };
      if (Math.abs(v - 1) < 0.01) return { ok: false, msg: 'Gold-197 does not sit where protons equal neutrons.' };
      if (v > 50) return { ok: false, msg: `${v} is the number of neutrons, not the ratio.` };
      return { ok: false, msg: `A ratio of ${v} with 79 protons would mean ${Math.round(v * 79)} neutrons.` };
    },
    reward: { log: 'Gold-197: 118 neutrons for 79 protons, 1.49.', title: 'Neutron-to-Proton Ratio', body: '1.49: 118 neutrons for 79 protons. Heavy stable nuclei hold about one and a half neutrons for each proton.' }
  },

  /* ---------------------------------------------------------------- 8 */
  moveStage({
    id: 's8-vial',
    title: 'The Fifth\'s Isotope',
    prompt: 'A sealed vial holds a nucleus of 27 protons and 33 neutrons: which decay will it undergo?',
    Z: 27, N: 33, label: 'The vial', z: [20, 32], n: [24, 38], answer: 'beta',
    hints: [
      'Find the vial\'s square on the chart and the filled squares in its column.',
      'Compare the vial\'s neutrons with those of the stable nucleus of the same element.',
      'Follow each arrow from the vial\'s square in your head and ask which one heads toward the filled squares.'
    ],
    reward: { log: 'Cobalt-60 decays by beta decay onto nickel-60.', title: 'One Neutron Too Many', body: 'Beta decay: one neutron more than cobalt-59, the stable one, so a neutron becomes a proton, and cobalt-60 becomes nickel-60.' }
  })
];

const NOTES = { 2: ['Drag the card you choose into the slot.'] };
applyNotes(STAGES, NOTES);

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Stable nuclei lie in a band that bends toward more neutrons as nuclei grow. A nucleus off the band decays toward it: beta from above, positron emission from below, alpha past lead.' }]
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
  [tap(6, 79, 118), typed('ratio', 1.49)],
  [move('beta')]
];

export const MISSES = [
  [col(20), choose(2)],
  [],
  [col(82), choose(2)],
  [move('positron')],
  [move('beta')],
  [move('beta')],
  [tap(6, 79, 118), typed('ratio', 2.49)],
  [move('positron')]
];

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export { chartPick, stable };
