/**
 * Unit 14 · Bench 3 — Balancing the Nucleus (q3-equations)
 *
 * The beam target hall in Cinder Halo's third crater, on the nuke kit. Eight stages and ONE click: the belief that losing an electron
 * leaves the element unchanged. The nucleus view answers it: in beta decay a neutron turns into a proton as the electron leaves, so the
 * atomic number RISES. Every stage is the same act (find the nucleus left, on the chart of nuclides) on a new kind of decay, and the
 * nuclear equation under the chart writes the student's answer in, so the two numbers that must balance are in front of them.
 *
 *   1  uranium-238 gives off an alpha particle                        -> thorium-234; a nuclear equation balances both numbers
 *   2  PREDICT: thorium-234 gives off a beta particle; its atomic number?
 *   3  TEST: watch the neutron turn                                    -> protactinium-234
 *   4  fluorine-18 gives off a positron                               -> oxygen-18; positron emission
 *   5  beryllium-7 pulls in an inner electron                         -> lithium-7; electron capture
 *   6  technetium-99m gives off a gamma ray                           -> technetium-99, the same square
 *   7  walk uranium-238 down to lead-206 by alpha and beta steps       -> 8 and 6; a decay series
 *   8  thorium-232 to lead-208 (typed, worked case in the briefing)    -> 6 alphas
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { nukeTable, nnucFixture, nchartFixture, chartPick, pickValue, walkAt, note } from '../../table/kits/nuke.js';
import { nameOf } from '../../engine/nucdata.js';

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\bnuclear equations?\b/i, introducedAt: 1 },
  { term: /\bpositron emission\b/i, introducedAt: 4 },
  { term: /\belectron capture\b/i, introducedAt: 5 },
  { term: /\bdecay series\b/i, introducedAt: 7 }
];

/** Alpha, beta and gamma (bench 2); mass number and isotopes (Tallow `q4-ledger`). */
export const BUILDS_ON = ['unit14/q2-what-comes-off', 'unit01/q4-ledger'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit14/q3-equations';
const GUESS = { 'g-down': 'falls to 89', 'g-same': 'stays 90', 'g-up': 'rises to 91' };
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

const inSlot = (state, slot) => Object.values(state.table.pieces).find(p => p.zone === `slot:${slot}`) || null;
const ALPHA = { A: 4, Z: 2, sym: 'He' };
const BETA = { A: 0, Z: '−1', sym: 'e' };
const POSITRON = { A: 0, Z: '+1', sym: 'e' };
const GAMMA = { A: 0, Z: 0, sym: 'γ' };

/** A decay stage: the nucleus view on the left, the chart and its equation on the right. */
function decayTable({ Z, N, mode, z, n, particle, capture = false, meta: m = false, parentA = null, nucTitle }) {
  return nukeTable({
    pieces: [],
    fixtures: [
      nnucFixture('nuc', { x: 35, y: 31 }, { Z, N, mode, hideAfter: true, meta: m, w: 66, h: 54, title: nucTitle }),
      nchartFixture('chart', { x: 110, y: 31 }, { z, n, marks: [{ Z, N, label: '' }], eq: { parent: { Z, A: parentA || Z + N }, particle, capture }, w: 78, h: 60 })
    ]
  });
}

/** The refusal for a square that does not balance: which of the two numbers fails, as the equation under the chart shows it. */
function balanceMiss(pk, { Z, A, pA, pZ, capture = false }) {
  const right = pk.Z + pk.N + pA;
  if (right !== A) return `The mass numbers do not balance: left is ${A}, right adds to ${right}.`;
  const rightZ = pk.Z + pZ; const leftZ = capture ? Z - 1 : Z;
  if (capture) return `The atomic numbers do not balance: left is ${Z} + (−1) = ${leftZ}, right is ${rightZ}.`;
  return `The atomic numbers do not balance: left is ${leftZ}, right adds to ${rightZ}.`;
}
function decayCheck({ Z, N, toZ, toN, pA, pZ, capture = false }) {
  return state => {
    const pk = chartPick(state.table, 'chart');
    if (!pk) return { ok: false, notYet: true, msg: 'Tap a square on the chart.' };
    if (pk.Z === toZ && pk.N === toN) return { ok: true };
    return { ok: false, msg: balanceMiss(pk, { Z, A: Z + N, pA, pZ, capture }) };
  };
}

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-alpha',
    title: 'Alpha Decay',
    briefing: { speaker: SPEAKER, body: 'In a nuclear equation, each nucleus shows its mass number on top and atomic number on the bottom (like ⁴₂He for an alpha particle). On the chart, protons increase to the right and neutrons increase upward.' },
    prompt: 'Which nucleus is left when uranium-238 gives off an alpha particle?',
    widget,
    table: decayTable({ Z: 92, N: 146, mode: 'alpha', z: [88, 93], n: [142, 146], particle: ALPHA, nucTitle: 'Uranium-238' }),
    hints: [
      'Press "Watch the Nucleus" to see what leaves, then tap a square on the chart.',
      'Count how many protons and neutrons left the nucleus.',
      'All protons and neutrons before decay must be accounted for afterward in the new nucleus and the particle.'
    ],
    check: decayCheck({ Z: 92, N: 146, toZ: 90, toN: 144, pA: 4, pZ: 2 }),
    reward: {
      log: 'Uranium-238 to thorium-234 and an alpha particle.',
      title: 'Nuclear Equation',
      body: 'Thorium-234: 238 = 234 + 4 and 92 = 90 + 2. An equation where both mass numbers and atomic numbers balance on each side is a nuclear equation.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Beta Decay',
    predict: true,
    prompt: 'When thorium-234 (90 protons) ejects one electron, how many protons will it have left?',
    widget,
    table: nukeTable({
      pieces: [
        note('g-down', 'Drops by 1, to 89', { x: 32, y: 14 }),
        note('g-same', 'Stays at 90', { x: 32, y: 33 }),
        note('g-up', 'Rises by 1, to 91', { x: 32, y: 52 })
      ],
      fixtures: [nnucFixture('nuc', { x: 112, y: 44 }, { Z: 90, N: 144, mode: null, w: 56, h: 32, title: 'Thorium-234 (90 protons)' })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 46, h: 15 } }] }
    }),
    hints: [
      'There is no wrong prediction, so drag the card you expect into the slot.',
      'An electron has a −1 charge, and total charge must stay the same before and after decay.',
      'Think about what particle inside the nucleus could change when a negative electron leaves.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Drag a prediction card into the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Watch thorium-234 decay on the next bench to test your prediction.' }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's3-beta',
      title: 'Inside Beta Decay',
      get prompt() { const g = guess(); return `Which nucleus is left when thorium-234 gives off a beta particle?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: decayTable({ Z: 90, N: 144, mode: 'beta', z: [88, 93], n: [140, 145], particle: BETA, nucTitle: 'Thorium-234' }),
      hints: [
        'Press "Watch the Nucleus" and watch the ringed particle change color.',
        'Compare the proton and neutron counts before and after decay.',
        'A beta particle has charge −1 and zero mass number, so balance both numbers accordingly.'
      ],
      check(state) {
        const pk = chartPick(state.table, 'chart');
        if (!pk) return { ok: false, notYet: true, msg: 'Tap a square on the chart.' };
        if (pk.Z === 91 && pk.N === 143) return { ok: true };
        if (pk.Z === 90 && pk.N === 144) return { ok: false, msg: 'A grey neutron turned into a rust proton, so the proton count changed.' };
        return { ok: false, msg: balanceMiss(pk, { Z: 90, A: 234, pA: 0, pZ: -1 }) };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Thorium-234 to protactinium-234 and a beta particle.',
          title: 'A Neutron Becomes a Proton',
          body: `Protactinium-234.${g ? ` You predicted: ${g}.` : ''} A neutron turned into a proton as the electron left, raising the atomic number to 91 while keeping the mass number at 234.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-positron',
    title: 'A Positive Electron',
    briefing: { speaker: SPEAKER, body: 'A positron is like an electron with a positive charge, written ⁰₊₁e. Nuclei with too many protons can eject one.' },
    prompt: 'Which nucleus is left when fluorine-18 gives off a positron?',
    widget,
    table: decayTable({ Z: 9, N: 9, mode: 'positron', z: [6, 10], n: [7, 11], particle: POSITRON, nucTitle: 'Fluorine-18' }),
    hints: [
      'Press "Watch the Nucleus" and watch the ringed particle change color.',
      'Compare the proton and neutron counts before and after the positron leaves.',
      'A positron has charge +1 and zero mass number, so balance both numbers accordingly.'
    ],
    check: decayCheck({ Z: 9, N: 9, toZ: 8, toN: 10, pA: 0, pZ: 1 }),
    reward: {
      log: 'Fluorine-18 to oxygen-18 and a positron.',
      title: 'Positron Emission',
      body: 'Oxygen-18: a proton turned into a neutron, dropping the atomic number to 8 while keeping the mass number at 18. This is positron emission.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-capture',
    title: 'Pulled In',
    briefing: { speaker: SPEAKER, body: 'In electron capture, an electron appears on the left side of the equation because the nucleus pulls it in.' },
    prompt: 'Which nucleus is left after beryllium-7 pulls an inner electron into its nucleus?',
    widget,
    table: decayTable({ Z: 4, N: 3, mode: 'capture', z: [2, 6], n: [2, 6], particle: null, capture: true, nucTitle: 'Beryllium-7' }),
    hints: [
      'Press "Watch the Nucleus" and watch the inner electron fall into the nucleus.',
      'Compare the proton and neutron counts before and after the electron is captured.',
      'An electron on the left side adds −1 to the left-side atomic number total.'
    ],
    check: decayCheck({ Z: 4, N: 3, toZ: 3, toN: 4, pA: 0, pZ: 0, capture: true }),
    reward: {
      log: 'Beryllium-7 captured an electron: lithium-7.',
      title: 'Electron Capture',
      body: 'Lithium-7: the captured electron turned a proton into a neutron without ejecting a particle. This is electron capture.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-gamma',
    title: 'Only Energy',
    briefing: { speaker: SPEAKER, body: 'The "m" in technetium-99m means the nucleus holds extra energy. It releases that energy as a gamma ray.' },
    prompt: 'Which nucleus is left after technetium-99m gives off a gamma ray?',
    widget,
    table: decayTable({ Z: 43, N: 56, mode: 'gamma', z: [41, 45], n: [54, 58], particle: GAMMA, meta: true, parentA: '99m', nucTitle: 'Technetium-99m' }),
    hints: [
      'Press "Watch the Nucleus" and tap the resulting square (it can be the starting square).',
      'Compare the proton and neutron counts before and after the gamma ray leaves.',
      'A gamma ray has no mass and no charge, so think about what can change.'
    ],
    check(state) {
      const pk = chartPick(state.table, 'chart');
      if (!pk) return { ok: false, notYet: true, msg: 'Tap a square on the chart.' };
      if (pk.Z === 43 && pk.N === 56) return { ok: true };
      return { ok: false, msg: `That is ${nameOf(pk.Z)}-${pk.Z + pk.N}, but a gamma ray carries away no protons or neutrons.` };
    },
    reward: { log: 'Technetium-99m to technetium-99 and a gamma ray.', title: 'Same Square', body: 'Technetium-99, the same square: a gamma ray carries energy only, so neither protons nor neutrons change. The nucleus simply drops to lower energy.' }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-series',
    title: 'Uranium to Lead',
    briefing: {
      speaker: SPEAKER,
      body: 'Each alpha decay lowers the mass number by 4, while each beta decay raises the atomic number by 1. Step uranium-238 down to lead-206.',
      worked: ['Uranium-235 to lead-207: mass drops by 235 − 207 = 28', '28 ÷ 4 = 7 alpha decays (protons drop: 92 − 14 = 78)', '82 − 78 = 4 beta decays']
    },
    prompt: 'Which alpha and beta steps turn uranium-238 into lead-206?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [nchartFixture('chart', { x: 75, y: 31 }, { z: [80, 93], n: [122, 147], mode: 'walk', start: { Z: 92, N: 146 }, marks: [{ Z: 92, N: 146, label: 'Uranium-238' }, { Z: 82, N: 124, label: 'Lead-206' }], w: 144, h: 62 })]
    }),
    hints: [
      'Tap "Alpha" or "Beta" to move the marker one decay at a time (any order that stays on the chart works).',
      'Notice how each type of step changes the mass number.',
      'Only alpha decay lowers the mass number (by 4 each), so divide the 32-unit mass drop by 4 first.'
    ],
    check(state) {
      const W = walkAt(state.table.fixtures.chart);
      if (!W.alphas && !W.betas) return { ok: false, notYet: true, msg: 'Move the marker with the Alpha or Beta buttons first.' };
      if (W.Z === 82 && W.N === 124) return { ok: true };
      if (W.Z < 80 || W.Z > 93 || W.N < 122 || W.N > 147) return { ok: false, msg: 'The marker went off the chart; press Undo and mix alpha and beta steps.' };
      return { ok: false, msg: `The marker is on ${nameOf(W.Z)}-${W.Z + W.N}, not lead-206; the total mass number must drop by 32.` };
    },
    reward: { log: 'Uranium-238 to lead-206: eight alpha, six beta.', title: 'Decay Series', body: 'Eight alpha and six beta steps turn uranium-238 into lead-206. A chain of decays ending in a stable nucleus is a decay series.' }
  }
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'In every nuclear equation, mass numbers and atomic numbers both balance across the arrow. Each type of decay moves a nucleus by a fixed step on the chart.' }]
};

export const SLIPS = {};

/* ---- scripts of the player's own actions ---- */
const run = id => ({ run: id });
const tap = (stage, Z, N) => ({ setDial: { fixture: 'chart', dial: 'pick', value: pickValue(STAGES[stage].table.fixtures.find(f => f.id === 'chart'), Z, N) } });
const put = (piece, to) => ({ place: { piece, to } });
const step = (a, n) => ({ setDial: { fixture: 'chart', dial: a ? 'na' : 'nb', value: n } });
/** The uranium-238 series in its real order: a = alpha, b = beta. */
const SERIES = 'abbaaaaabbabba';
function walk(seq) {
  let na = 0; let nb = 0;
  return [...seq].map(c => (c === 'a' ? step(true, ++na) : step(false, ++nb)));
}

export const SOLUTIONS = [
  [run('nuc'), tap(0, 90, 144)],
  [put('g-same', 'slot:guess')],
  [run('nuc'), tap(2, 91, 143)],
  [run('nuc'), tap(3, 8, 10)],
  [run('nuc'), tap(4, 3, 4)],
  [run('nuc'), tap(5, 43, 56)],
  walk(SERIES)
];

export const MISSES = [
  [run('nuc'), tap(0, 90, 146)],
  [],
  [run('nuc'), tap(2, 90, 144)],
  [run('nuc'), tap(3, 10, 8)],
  [run('nuc'), tap(4, 5, 2)],
  [run('nuc'), tap(5, 42, 56)],
  walk('aaaa')
];

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}
