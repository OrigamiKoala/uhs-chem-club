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
import { applyNotes } from '../../table/notes.js';
import { nukeTable, nnucFixture, nchartFixture, chartPick, pickValue, walkAt, note } from '../../table/kits/nuke.js';
import { nameOf } from '../../engine/nucdata.js';

export const meta = { stageCount: 8 };

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
const GUESS = { 'g-down': 'that it falls by one', 'g-same': 'that it stays 90', 'g-up': 'that it rises by one' };
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
      nnucFixture('nuc', { x: 36, y: 31 }, { Z, N, mode, hideAfter: true, meta: m, w: 68, h: 54, title: nucTitle }),
      nchartFixture('chart', { x: 111, y: 31 }, { z, n, marks: [{ Z, N, label: '' }], eq: { parent: { Z, A: parentA || Z + N }, particle, capture }, w: 74, h: 58 })
    ]
  });
}

/** The refusal for a square that does not balance: which of the two numbers fails, as the equation under the chart shows it. */
function balanceMiss(pk, { Z, A, pA, pZ, capture = false }) {
  const right = pk.Z + pk.N + pA;
  if (right !== A) return `On the right the mass numbers add to ${right}; on the left, ${A}.`;
  const rightZ = pk.Z + pZ; const leftZ = capture ? Z - 1 : Z;
  return `On the right the atomic numbers add to ${rightZ}; on the left, ${leftZ}.`;
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
    briefing: { speaker: SPEAKER, body: 'In a nuclear equation each nucleus is written with its mass number above and its atomic number below, as ⁴₂He for an alpha particle. The chart has a square for every nucleus: protons count across, neutrons up.' },
    prompt: 'Which nucleus is left when uranium-238 gives off an alpha particle?',
    widget,
    table: decayTable({ Z: 92, N: 146, mode: 'alpha', z: [88, 93], n: [142, 146], particle: ALPHA, nucTitle: 'Uranium-238' }),
    hints: [
      'Press "Watch the Nucleus" to see what leaves, then tap a square on the chart.',
      'Count the protons and the neutrons in what left the nucleus.',
      'The protons and neutrons before the decay are all still there afterwards, in the nucleus left or in the particle.'
    ],
    check: decayCheck({ Z: 92, N: 146, toZ: 90, toN: 144, pA: 4, pZ: 2 }),
    reward: {
      log: 'Uranium-238 to thorium-234 and an alpha particle.',
      title: 'Nuclear Equation',
      body: 'Thorium-234: 238 = 234 + 4 and 92 = 90 + 2. An equation of nuclei in which both numbers balance is a nuclear equation.',
      model: { type: 'atoms', items: [{ p: 2, n: 2, label: 'The alpha particle' }], caption: 'The alpha particle: 2 protons and 2 neutrons. Not to scale.' }
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Beta Decay',
    predict: true,
    prompt: 'Thorium-234 gives off a beta particle, an electron: what do you expect happens to its atomic number of 90?',
    widget,
    table: nukeTable({
      pieces: [
        note('g-down', 'It falls by one, to 89', { x: 34, y: 14 }),
        note('g-same', 'It stays 90', { x: 34, y: 33 }),
        note('g-up', 'It rises by one, to 91', { x: 34, y: 52 })
      ],
      fixtures: [],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 30 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'A beta particle comes out of the nucleus, which holds only protons and neutrons.',
      'An electron has a charge of −1, and the charge on both sides of the change must add up the same.',
      'Ask what one of the nucleus\'s own particles would have to become for an electron to leave it.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Watch the nucleus.' }
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
        'Press "Watch the Nucleus" and look at what changes colour inside it.',
        'Compare the count of protons and of neutrons before and after the change.',
        'The electron carries a charge of −1 and almost no mass, so balance the two numbers with that.'
      ],
      check(state) {
        const pk = chartPick(state.table, 'chart');
        if (!pk) return { ok: false, notYet: true, msg: 'Tap a square on the chart.' };
        if (pk.Z === 91 && pk.N === 143) return { ok: true };
        if (pk.Z === 90 && pk.N === 144) return { ok: false, msg: 'In the view a neutron changed colour to a proton, so the nucleus left holds a different number of protons.' };
        return { ok: false, msg: balanceMiss(pk, { Z: 90, A: 234, pA: 0, pZ: -1 }) };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Thorium-234 to protactinium-234 and a beta particle.',
          title: 'A Neutron Becomes a Proton',
          body: `Protactinium-234${g ? ` (you predicted ${g})` : ''}: a neutron became a proton and an electron left, so the mass number stayed 234 and the atomic number rose to 91.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-positron',
    title: 'A Positive Electron',
    briefing: { speaker: SPEAKER, body: 'A positron is a particle like an electron with a positive charge, written ⁰₊₁e. Some nuclei throw one out.' },
    prompt: 'Which nucleus is left when fluorine-18 gives off a positron?',
    widget,
    table: decayTable({ Z: 9, N: 9, mode: 'positron', z: [6, 10], n: [7, 11], particle: POSITRON, nucTitle: 'Fluorine-18' }),
    hints: [
      'Press "Watch the Nucleus" and look at what changes inside it.',
      'Compare the protons and the neutrons before and after, and the charge the positron took away.',
      'A positron carries +1 and almost no mass, so balance the two numbers with that.'
    ],
    check: decayCheck({ Z: 9, N: 9, toZ: 8, toN: 10, pA: 0, pZ: 1 }),
    reward: {
      log: 'Fluorine-18 to oxygen-18 and a positron.',
      title: 'Positron Emission',
      body: 'Oxygen-18: a proton became a neutron, so the atomic number fell to 8 and the mass number stayed 18. That is positron emission.',
      model: { type: 'atom', p: 8, n: 10, caption: 'Oxygen-18: 8 protons and 10 neutrons. Not to scale.' }
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-capture',
    title: 'Pulled In',
    prompt: 'Beryllium-7\'s nucleus pulls in one of its own innermost electrons: which nucleus is left?',
    widget,
    table: decayTable({ Z: 4, N: 3, mode: 'capture', z: [2, 6], n: [2, 6], particle: null, capture: true, nucTitle: 'Beryllium-7' }),
    hints: [
      'Press "Watch the Nucleus" and follow the electron from the innermost shell.',
      'Compare the protons and the neutrons before and after the electron arrives.',
      'An electron on the left of the equation counts −1 among the atomic numbers there.'
    ],
    check: decayCheck({ Z: 4, N: 3, toZ: 3, toN: 4, pA: 0, pZ: 0, capture: true }),
    reward: {
      log: 'Beryllium-7 captured an electron: lithium-7.',
      title: 'Electron Capture',
      body: 'Lithium-7: the captured electron turned a proton into a neutron, as positron emission does, without throwing anything out. That is electron capture.',
      model: { type: 'atom', p: 3, n: 4, caption: 'Lithium-7: 3 protons and 4 neutrons. Not to scale.' }
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-gamma',
    title: 'Only Energy',
    prompt: 'Technetium-99m gives off a gamma ray: which nucleus is left?',
    widget,
    table: decayTable({ Z: 43, N: 56, mode: 'gamma', z: [41, 45], n: [54, 58], particle: GAMMA, meta: true, parentA: '99m', nucTitle: 'Technetium-99m' }),
    hints: [
      'Press "Watch the Nucleus" and watch what leaves it.',
      'Count the protons and neutrons before and after.',
      'A gamma ray has no charge and no mass, so ask what it can change in the two numbers.'
    ],
    check(state) {
      const pk = chartPick(state.table, 'chart');
      if (!pk) return { ok: false, notYet: true, msg: 'Tap a square on the chart.' };
      if (pk.Z === 43 && pk.N === 56) return { ok: true };
      return { ok: false, msg: `That square is ${nameOf(pk.Z)}-${pk.Z + pk.N}; the gamma ray carried away no protons and no neutrons.` };
    },
    reward: { log: 'Technetium-99m to technetium-99 and a gamma ray.', title: 'Same Square', body: 'Technetium-99, the same square: a gamma ray carries energy only, so neither number changed. The nucleus just settled into lower energy.' }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-series',
    title: 'Uranium to Lead',
    prompt: 'Which alpha and beta steps take uranium-238 down to lead-206?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [nchartFixture('chart', { x: 75, y: 32 }, { z: [80, 93], n: [122, 147], mode: 'walk', start: { Z: 92, N: 146 }, marks: [{ Z: 92, N: 146, label: 'Uranium-238' }, { Z: 82, N: 124, label: 'Lead-206' }], w: 140, h: 62 })]
    }),
    hints: [
      'Tap "Alpha" or "Beta" to move the marker one decay at a time.',
      'Compare how each kind of step changes the mass number on the way down.',
      'Only an alpha step lowers the mass number, by 4, so count those from the fall in mass number first.'
    ],
    check(state) {
      const W = walkAt(state.table.fixtures.chart);
      if (!W.alphas && !W.betas) return { ok: false, notYet: true, msg: 'The marker has not moved yet.' };
      if (W.Z === 82 && W.N === 124) return { ok: true };
      if (W.Z < 80 || W.Z > 93 || W.N < 122 || W.N > 147) return { ok: false, msg: 'The marker has left the chart.' };
      return { ok: false, msg: `The marker stands on ${nameOf(W.Z)}-${W.Z + W.N}, not lead-206.` };
    },
    reward: { log: 'Uranium-238 to lead-206: eight alpha, six beta.', title: 'Decay Series', body: 'Eight alpha and six beta steps: only alpha lowers the mass number, by 4 each. A chain of decays ending on a stable nucleus is a decay series.' }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-thorium',
    title: 'Thorium to Lead',
    briefing: {
      speaker: SPEAKER,
      body: 'Uranium-235 decays down to lead-207. Only alpha changes the mass number, so the alphas come from its fall.',
      worked: ['235 − 207 = 28 off the mass number', '28 ÷ 4 = 7 alpha decays', '7 alphas lower 92 by 14 to 78; 4 betas raise it to 82']
    },
    prompt: 'How many alpha decays take thorium-232 down to lead-208?',
    widget,
    entry: { id: 'alphas', label: 'Alpha decays', unit: '' },
    table: nukeTable({
      pieces: [],
      fixtures: [nchartFixture('chart', { x: 75, y: 30 }, { z: [80, 93], n: [122, 146], mode: 'none', marks: [{ Z: 90, N: 142, label: 'Thorium-232' }, { Z: 82, N: 126, label: 'Lead-208' }], w: 140, h: 56 })]
    }),
    hints: [
      'Read the mass numbers of the two marked squares on the chart.',
      'Compare how far the mass number falls with what one alpha decay takes off it.',
      'Beta decays leave the mass number as it is, so the whole fall is the alphas\' work.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'alphas');
      if (v == null) return { ok: false, notYet: true, msg: 'Type the number of alpha decays.' };
      if (v === 6) return { ok: true };
      if (v === 24) return { ok: false, msg: 'The mass number falls by 24, and one alpha decay takes 4 off it.' };
      if (v === 4) return { ok: false, msg: 'Four would lower the mass number by 16, to 216.' };
      if (v === 8) return { ok: false, msg: 'Eight would lower the mass number by 32, to 200.' };
      if (v === 12) return { ok: false, msg: 'Twelve alphas would lower the mass number by 48.' };
      return { ok: false, msg: `${v} alpha decays would take the mass number from 232 to ${232 - 4 * v}.` };
    },
    reward: { log: 'Thorium-232 to lead-208: six alpha decays.', title: 'Six', body: 'Six: the mass number falls by 24, and each alpha decay takes 4. Four beta decays then bring the atomic number back up from 78 to 82.' }
  }
];

const NOTES = {
  2: ['Drag the card you choose into the slot.']
};
applyNotes(STAGES, NOTES);

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Every decay balances: the mass numbers add up the same on both sides, and so do the atomic numbers. Each kind of decay moves a nucleus a fixed step on the chart.' }]
};

/** Slips a student makes on stage 8 (typed), each refused with a reason. */
export const SLIPS = { 8: [24, 4, 8, 12, 3, 10] };

/* ---- scripts of the player's own actions ---- */
const run = id => ({ run: id });
const tap = (stage, Z, N) => ({ setDial: { fixture: 'chart', dial: 'pick', value: pickValue(STAGES[stage].table.fixtures.find(f => f.id === 'chart'), Z, N) } });
const put = (piece, to) => ({ place: { piece, to } });
const step = (a, n) => ({ setDial: { fixture: 'chart', dial: a ? 'na' : 'nb', value: n } });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
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
  walk(SERIES),
  [typed('alphas', 6)]
];

export const MISSES = [
  [run('nuc'), tap(0, 90, 146)],
  [],
  [run('nuc'), tap(2, 90, 144)],
  [run('nuc'), tap(3, 10, 8)],
  [run('nuc'), tap(4, 5, 2)],
  [run('nuc'), tap(5, 42, 56)],
  walk('aaaa'),
  [typed('alphas', 24)]
];

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}
