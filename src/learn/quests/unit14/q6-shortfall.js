/**
 * Unit 14 · Bench 6 — The Missing Weight (q6-shortfall)
 *
 * The fuel-pool hall in Cinder Halo's sixth crater, on the nuke kit. Eight stages and ONE click: the belief that a whole weighs exactly
 * the sum of its parts. The balance answers it: a helium-4 nucleus weighs 0.0304 u less than two protons and two neutrons. That missing
 * mass is the energy that binds it (E = mc², 931.5 MeV for each u); the curve of binding energy per nucleon peaks near iron, so splitting
 * a heavy nucleus or joining light ones gives energy out, and a chain reaction runs when each fission causes one more.
 *
 *   1  PREDICT: does helium-4 weigh more, less or the same as its parts?
 *   2  TEST: load the balance                                         -> less: the mass defect
 *   3  the energy that holds helium-4 together (typed, worked case)   -> 28.3 MeV: binding energy
 *   4  the curve of binding energy per nucleon                        -> iron-56 holds its nucleons tightest
 *   5  uranium-235 split, weighed before and after                    -> energy out: fission
 *   6  the chain chamber with the rods at three settings              -> two of three soaked up: critical
 *   7  two hydrogen-2 nuclei against helium-4                         -> joining gives energy out: fusion
 *   8  SEALED: three unnamed points on the curve                      -> the one at the top gives energy neither way
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { nukeTable, nscaleFixture, scaleRead, ncurveFixture, curvePick, nchainFixture, chainRead, nchoiceFixture, chosenIndex, note, plaqueFixture } from '../../table/kits/nuke.js';
import { BE_PER_NUCLEON, longName } from '../../engine/nucdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bmass defect\b/i, introducedAt: 2 },
  { term: /\bbinding energy\b/i, introducedAt: 3 },
  { term: /\bbinding energy per nucleon\b/i, introducedAt: 4 },
  { term: /\bfission\b/i, introducedAt: 5 },
  { term: /\bchain reactions?\b/i, introducedAt: 6 },
  { term: /\bfusion\b/i, introducedAt: 7 }
];

/** Nuclear equations (bench 3) and the band of stability (bench 4); the mass unit u (Tallow `q2-core`). */
export const BUILDS_ON = ['unit14/q3-equations', 'unit14/q4-stability', 'unit01/q2-core'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit14/q6-shortfall';
const GUESS = { 'g-more': 'more', 'g-less': 'less', 'g-same': 'the same' };
const widget = { type: 'table', label: 'The bench' };

export function toolNoteFor() { return null; }

const inSlot = (state, slot) => Object.values(state.table.pieces).find(p => p.zone === `slot:${slot}`) || null;
const be1 = name => (Math.round((BE_PER_NUCLEON.find(r => r.name === name).be + 1e-9) * 10) / 10).toFixed(1);

/** Slips a student makes on stage 3 (typed), each refused with a reason. */
export const SLIPS = { 3: [0.0304, 3756, 3727, 2.22, 7.07, 0.03] };

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Whole or Parts',
    predict: true,
    prompt: 'A helium-4 nucleus is two protons and two neutrons: do you expect it to weigh more, less or the same as those four apart?',
    widget,
    table: nukeTable({
      pieces: [note('g-more', 'More than its parts', { x: 34, y: 14 }), note('g-same', 'The same as its parts', { x: 34, y: 33 }), note('g-less', 'Less than its parts', { x: 34, y: 52 })],
      fixtures: [],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 30 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'A nucleus holds together, so pulling its protons and neutrons apart takes energy.',
      'Think about whether the four parts have more energy apart or together.',
      'Ask whether energy put into something could show up as mass.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Weigh them.' }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's2-balance',
      title: 'The Balance',
      get prompt() { const g = guess(); return `Does a helium-4 nucleus weigh the same as the protons and neutrons it is made of?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: nukeTable({
        pieces: [],
        fixtures: [
          nscaleFixture('scale', { x: 56, y: 31 }, { build: true, right: 'He4', rightLabel: 'Helium-4 nucleus', w: 104, h: 50 }),
          nchoiceFixture('ans', 'The nucleus weighs', { x: 130, y: 32 }, { options: ['The same', 'More', 'Less'], w: 34 })
        ]
      }),
      hints: [
        'Tap "Add Proton" and "Add Neutron" until the left pan holds what a helium-4 nucleus is made of.',
        'Compare the two masses the pans print, to the last decimal place.',
        'The beam tips toward the heavier pan.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three statements.' };
        if (pick === 3) return { ok: true };
        const r = scaleRead(state.table, 'scale');
        if (r.left == null) return { ok: false, msg: 'The left pan is empty: nothing has been weighed against the nucleus.' };
        return { ok: false, msg: `The pans read ${r.left.toFixed(6)} u on the left and ${r.right.toFixed(6)} u for the nucleus.` };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Helium-4 weighs 0.030376 u less than its parts.',
          title: 'Mass Defect',
          body: `Less${g ? ` (you predicted ${g})` : ''}: 0.030376 u less than two protons and two neutrons apart. The mass a nucleus lacks against its separate parts is its mass defect.`,
          model: { type: 'atom', p: 2, n: 2, caption: 'Helium-4: 2 protons and 2 neutrons, lighter together than apart. Not to scale.' }
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-energy',
    title: 'Mass Into Energy',
    briefing: {
      speaker: SPEAKER,
      body: 'Mass and energy are one thing in two forms, E = mc²: 1 u of mass is 931.5 MeV of energy, where an MeV is a unit of energy sized for one nucleus. Deuterium, one proton and one neutron, lacks 0.002388 u.',
      worked: ['Deuterium: 2.015941 u apart, 2.013553 u together', '0.002388 u × 931.5 MeV per u = 2.22 MeV']
    },
    prompt: 'How much energy, in MeV, holds a helium-4 nucleus together?',
    widget,
    entry: { id: 'mev', label: 'Energy, MeV', unit: 'MeV' },
    table: nukeTable({
      pieces: [],
      fixtures: [
        nscaleFixture('scale', { x: 56, y: 31 }, { left: 'He4-parts', right: 'He4', leftLabel: '2 protons + 2 neutrons', rightLabel: 'Helium-4 nucleus', w: 104, h: 50 }),
        plaqueFixture('ref', 'Mass as energy', { x: 132, y: 22 }, ['1 u = 931.5 MeV'], { w: 30 })
      ]
    }),
    hints: [
      'Read the two masses on the balance.',
      'Find how much mass the nucleus lacks against its parts.',
      'Turn that missing mass into energy with the plate, as the worked case did for deuterium.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'mev');
      if (v == null) return { ok: false, notYet: true, msg: 'Type the energy in MeV.' };
      if (v >= 28.1 && v <= 28.5) return { ok: true };
      if (v < 0.05) return { ok: false, msg: `${v} is the missing mass in u; the plate turns u into MeV.` };
      if (v > 3000) return { ok: false, msg: 'That turns the whole of a pan\'s mass into energy, not the part the nucleus lacks.' };
      if (Math.abs(v - 2.22) < 0.05) return { ok: false, msg: '2.22 MeV is deuterium\'s, from the worked case.' };
      if (Math.abs(v - 7.07) < 0.05) return { ok: false, msg: 'That is the energy for each one of the four protons and neutrons.' };
      return { ok: false, msg: `${v} MeV is the energy of ${(v / 931.5).toFixed(6)} u of mass; the balance shows a different difference.` };
    },
    reward: { log: 'Helium-4: 0.030376 u, 28.3 MeV.', title: 'Binding Energy', body: '28.3 MeV: the mass defect as energy. The energy needed to pull a nucleus apart into its protons and neutrons is its binding energy.' }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-curve',
    title: 'Held Tightest',
    briefing: { speaker: SPEAKER, body: 'Binding energy per nucleon is a nucleus\'s binding energy shared out over its protons and neutrons: the higher it is, the more tightly each one is held.' },
    prompt: 'Which nucleus holds each of its protons and neutrons most tightly?',
    widget,
    table: nukeTable({ pieces: [], fixtures: [ncurveFixture('curve', { x: 75, y: 31 }, { w: 140, h: 58 })] }),
    hints: [
      'Tap points on the curve to read them.',
      'Compare the heights of the points across the whole curve.',
      'The most tightly held nucleons belong to the nucleus whose point stands highest.'
    ],
    check(state) {
      const p = curvePick(state.table, 'curve');
      if (!p) return { ok: false, notYet: true, msg: 'Tap a point on the curve.' };
      if (p.name === 'Fe-56' || p.name === 'Ni-62') return { ok: true };
      return { ok: false, msg: `${longName(p.name)} reads ${be1(p.name)} MeV per nucleon, and points round mass number 60 stand higher.` };
    },
    reward: { log: 'Iron-56 and nickel-62 top the curve at 8.8 MeV.', title: 'Binding Energy per Nucleon', body: 'Iron-56 and nickel-62, at 8.8 MeV for each nucleon. Nuclei near iron are the most tightly bound; lighter and heavier ones hold theirs less tightly.' }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-fission',
    title: 'Splitting Uranium',
    briefing: { speaker: SPEAKER, body: 'When a slow neutron enters a uranium-235 nucleus, the nucleus can split in two. The balance weighs everything before and after.' },
    prompt: 'Does splitting uranium-235 into barium-141 and krypton-92 give energy out or take energy in?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        nchainFixture('chamber', { x: 42, y: 17 }, { mode: 'split', w: 80, h: 32 }),
        nscaleFixture('scale', { x: 42, y: 48 }, { left: 'U235-fuel', right: 'U235-split', leftLabel: 'Before', rightLabel: 'After', w: 80, h: 30, title: 'Balance' }),
        nchoiceFixture('ans', 'Splitting it', { x: 118, y: 32 }, { options: ['Gives energy out', 'Takes energy in'], w: 54 })
      ]
    }),
    hints: [
      'Press "Fire Neutron" and read what the balance weighs before and after.',
      'Compare the mass before the split with the mass after it.',
      'Mass that goes missing has become energy, as it did in the helium nucleus.'
    ],
    check(state) {
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the two statements.' };
      if (pick === 1) return { ok: true };
      return { ok: false, msg: 'The balance reads 236.052595 u before and 235.866571 u after.' };
    },
    reward: { log: 'Fission of uranium-235: 0.186 u less after.', title: 'Fission', body: 'Out: the pieces weigh 0.186 u less than the uranium and its neutron. A heavy nucleus splitting into two lighter ones is fission.' }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-chain',
    title: 'The Chain',
    briefing: { speaker: SPEAKER, body: 'A fission like the one you watched frees three neutrons, and each can split another nucleus. Control rods soak up neutrons.' },
    prompt: 'Of each fission\'s three neutrons, how many must the rods soak up for the reaction to hold steady?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        nchainFixture('chamber', { x: 58, y: 31 }, { mode: 'chain', w: 112, h: 56 }),
        nchoiceFixture('ans', 'Soaked up', { x: 134, y: 32 }, { options: ['0', '1', '2', '3'], w: 26 })
      ]
    }),
    hints: [
      'Set the rods with the keys and press "Fire Neutron" at each setting.',
      'Compare how the number of fissions changes from one generation to the next at each setting.',
      'Holding steady means each generation has as many fissions as the one before.'
    ],
    check(state) {
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the four.' };
      if (pick === 3) return { ok: true };
      return { ok: false, msg: ['With none soaked up, each generation tripled: 1, 3, 9, 27.', 'With one soaked up, each generation doubled: 1, 2, 4, 8.', '', 'With all three soaked up, it stopped after one fission.'][pick - 1] };
    },
    reward: { log: 'Two of three soaked up: one fission causes one more.', title: 'Chain Reaction', body: 'Two: then each fission causes exactly one more. A run of fissions whose neutrons cause more is a chain reaction, and one that holds steady is critical.' }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-fusion',
    title: 'Joining Hydrogen',
    prompt: 'Which gives energy out: joining two hydrogen-2 nuclei into helium-4, or splitting helium-4 into two hydrogen-2?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        nscaleFixture('scale', { x: 42, y: 17 }, { left: 'H2-pair', right: 'He4', leftLabel: 'Two hydrogen-2 nuclei', rightLabel: 'Helium-4 nucleus', w: 80, h: 32 }),
        ncurveFixture('curve', { x: 42, y: 49 }, { marks: [{ name: 'H-2' }, { name: 'He-4' }], all: false, w: 80, h: 30, title: 'The curve' }),
        nchoiceFixture('ans', 'Energy comes out from', { x: 118, y: 32 }, { options: ['Joining them', 'Splitting helium-4'], w: 54 })
      ]
    }),
    hints: [
      'Read both pans of the balance, and tap the two points on the curve.',
      'Compare which side weighs less, and which nucleus holds its nucleons more tightly.',
      'A change gives energy out when what it makes weighs less than what it started from.'
    ],
    check(state) {
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the two statements.' };
      if (pick === 1) return { ok: true };
      return { ok: false, msg: 'The balance reads 4.027106 u for two hydrogen-2 nuclei and 4.001506 u for helium-4.' };
    },
    reward: { log: 'Joining hydrogen-2 into helium-4 gives 0.0256 u out.', title: 'Fusion', body: 'Joining them: helium-4 weighs 0.0256 u less and sits far higher on the curve. Light nuclei joining into a heavier one is fusion, which powers the stars.' }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-neither',
    title: 'Neither Way',
    prompt: 'Which marked nucleus could give energy out neither by splitting nor by joining with another?',
    widget,
    table: nukeTable({ pieces: [], fixtures: [ncurveFixture('curve', { x: 75, y: 31 }, { marks: [{ name: 'He-4', label: 'X' }, { name: 'Fe-56', label: 'Y' }, { name: 'U-238', label: 'Z' }], all: false, w: 140, h: 58 })] }),
    hints: [
      'Tap the three marked points to read them.',
      'For each mark, look at which way along the curve its nucleons would be held more tightly.',
      'A change gives energy out only when it moves nucleons up the curve.'
    ],
    check(state) {
      const p = curvePick(state.table, 'curve');
      if (!p) return { ok: false, notYet: true, msg: 'Tap a marked point.' };
      if (p.name === 'Fe-56') return { ok: true };
      if (p.name === 'He-4') return { ok: false, msg: 'X sits at mass number 4, with points higher on the curve to its right.' };
      return { ok: false, msg: 'Z sits at mass number 238, with points higher on the curve to its left.' };
    },
    reward: { log: 'Y, iron-56, at the top: no energy either way.', title: 'The Top of the Curve', body: 'Y, iron-56, at the top: splitting it or joining it would move its nucleons down the curve, so either change would take energy in.' }
  }
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'A nucleus weighs less than its parts, and the missing mass is the energy that binds it. Splitting heavy nuclei or joining light ones moves toward iron and gives energy out.' }]
};

/* ---- scripts of the player's own actions ---- */
const put = (piece, to) => ({ place: { piece, to } });
const choose = n => ({ setDial: { fixture: 'ans', dial: 'value', value: n } });
const add = (dial, n) => Array.from({ length: n }, (_, i) => ({ setDial: { fixture: 'scale', dial, value: i + 1 } }));
const pt = i => ({ setDial: { fixture: 'curve', dial: 'pick', value: i } });
const ptName = name => pt(BE_PER_NUCLEON.findIndex(r => r.name === name) + 1);
const rods = i => ({ setDial: { fixture: 'chamber', dial: 'rods', value: i } });
const fire = { run: 'chamber' };
const typed = (entry, value) => ({ type: { entry, value: String(value) } });

export const SOLUTIONS = [
  [put('g-same', 'slot:guess')],
  [...add('np', 2), ...add('nn', 2), choose(3)],
  [typed('mev', 28.3)],
  [ptName('U-238'), ptName('Fe-56')],
  [fire, choose(1)],
  [fire, rods(1), fire, rods(2), fire, choose(3)],
  [pt(1), pt(2), choose(1)],
  [pt(1), pt(3), pt(2)]
];

export const MISSES = [
  [],
  [...add('np', 2), ...add('nn', 2), choose(1)],
  [typed('mev', 0.0304)],
  [ptName('U-238')],
  [fire, choose(2)],
  [fire, rods(1), fire, choose(2)],
  [choose(2)],
  [pt(3)]
];

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export { chainRead };
