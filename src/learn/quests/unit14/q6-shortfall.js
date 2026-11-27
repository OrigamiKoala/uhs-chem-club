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

export const meta = { stageCount: 7 };

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
    prompt: 'Does a helium-4 nucleus have more, less, or the same mass as its four separate parts?',
    widget,
    table: nukeTable({
      pieces: [note('g-more', 'More mass than its parts', { x: 32, y: 14 }), note('g-same', 'Same mass as its parts', { x: 32, y: 33 }), note('g-less', 'Less mass than its parts', { x: 32, y: 52 })],
      fixtures: [nscaleFixture('scale', { x: 112, y: 44 }, { left: null, right: null, leftLabel: '4 separate parts', rightLabel: 'Helium-4 nucleus', w: 66, h: 32, title: 'Balance (ready to weigh)' })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 46, h: 14 } }] }
    }),
    hints: [
      'There is no wrong prediction, so drag the card you expect into the slot.',
      'Think about whether the four particles have more energy apart or bound together.',
      'Ask whether a change in energy could show up as a change in mass.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Drag a prediction card into the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Compare helium-4 against its separate protons and neutrons on the balance next.' }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's2-balance',
      title: 'The Balance',
      get prompt() { const g = guess(); return `Does a helium-4 nucleus have the same mass as its separate protons and neutrons?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: nukeTable({
        pieces: [],
        fixtures: [
          nscaleFixture('scale', { x: 56, y: 31 }, { build: true, right: 'He4', rightLabel: 'Helium-4 nucleus', showDiff: true, w: 104, h: 50 }),
          nchoiceFixture('ans', 'The nucleus has', { x: 130, y: 32 }, { options: ['Same mass', 'More mass', 'Less mass'], w: 34 })
        ]
      }),
      hints: [
        'Tap "Add Proton" and "Add Neutron" until the left pan holds 2 protons and 2 neutrons.',
        'Compare the two pan readings down to the last decimal place.',
        'The balance tips down toward the heavier side.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three choices.' };
        if (pick === 3) return { ok: true };
        const r = scaleRead(state.table, 'scale');
        if (r.left == null) return { ok: false, msg: 'Load protons and neutrons onto the left pan first.' };
        return { ok: false, msg: `The left pan reads ${r.left.toFixed(3)} u and the helium-4 nucleus reads ${r.right.toFixed(3)} u.` };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Helium-4 weighs 0.0304 u less than its parts.',
          title: 'Mass Defect',
          body: `Less mass.${g ? ` You predicted ${g}.` : ''} Helium-4 has 0.0304 u less mass than its separate parts, and that missing mass is its mass defect.`
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
      body: 'Mass and energy are equivalent (E = mc²): 1 u of mass equals 931.5 MeV, an energy unit sized for single nuclei.',
      worked: ['Deuterium: 2.016 u apart vs. 2.014 u together (0.002388 u missing)', '0.002388 u × 931.5 MeV/u = 2.22 MeV']
    },
    prompt: 'How much energy, in MeV, holds a helium-4 nucleus together?',
    widget,
    entry: { id: 'mev', label: 'Energy, MeV', unit: 'MeV' },
    table: nukeTable({
      pieces: [],
      fixtures: [
        nscaleFixture('scale', { x: 56, y: 31 }, { left: 'He4-parts', right: 'He4', leftLabel: '2 protons + 2 neutrons', rightLabel: 'Helium-4 nucleus', showDiff: true, w: 104, h: 50 }),
        plaqueFixture('ref', 'Mass as energy', { x: 132, y: 22 }, ['1 u = 931.5 MeV'], { w: 30 })
      ]
    }),
    hints: [
      'Read the two pan masses and their difference on the balance.',
      'Find how much mass is missing when the parts combine into helium-4.',
      'Multiply that missing mass by 931.5 MeV/u, just like the deuterium example.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'mev');
      if (v == null) return { ok: false, notYet: true, msg: 'Type the energy in MeV.' };
      if (v >= 27.9 && v <= 28.6) return { ok: true };
      if (v < 0.05) return { ok: false, msg: `${v} is the missing mass in u; multiply by 931.5 to convert u to MeV.` };
      if (v > 3000) return { ok: false, msg: 'That converts the entire pan\'s mass into energy, not just the missing mass.' };
      if (Math.abs(v - 2.22) < 0.05) return { ok: false, msg: '2.22 MeV is for deuterium from the example.' };
      if (Math.abs(v - 7.07) < 0.05) return { ok: false, msg: 'That is the energy per particle rather than for all four particles together.' };
      return { ok: false, msg: `${v} MeV equals ${(v / 931.5).toFixed(4)} u of mass; check the difference shown on the balance.` };
    },
    reward: { log: 'Helium-4: 0.0304 u, 28.3 MeV.', title: 'Binding Energy', body: '28.3 MeV: the energy equivalent of the mass defect. The energy needed to pull a nucleus apart into free protons and neutrons is its binding energy.' }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-curve',
    title: 'Held Tightest',
    briefing: { speaker: SPEAKER, body: 'Binding energy per nucleon is a nucleus\'s total binding energy divided by its protons and neutrons. Higher on the curve means more tightly held.' },
    prompt: 'Which nucleus holds each of its protons and neutrons most tightly?',
    widget,
    table: nukeTable({ pieces: [], fixtures: [ncurveFixture('curve', { x: 75, y: 31 }, { w: 140, h: 58 })] }),
    hints: [
      'Tap points along the curve to read their values.',
      'Compare the heights of points across the entire curve.',
      'The most tightly bound nucleus sits at the highest point on the curve.'
    ],
    check(state) {
      const p = curvePick(state.table, 'curve');
      if (!p) return { ok: false, notYet: true, msg: 'Tap a point on the curve.' };
      if (p.name === 'Fe-56' || p.name === 'Ni-62') return { ok: true };
      return { ok: false, msg: `${longName(p.name)} is at ${be1(p.name)} MeV per nucleon, but a higher point sits on the curve.` };
    },
    reward: { log: 'Iron-56 and nickel-62 top the curve at 8.8 MeV.', title: 'Binding Energy per Nucleon', body: 'Iron-56 and nickel-62 peak at 8.8 MeV per nucleon. Nuclei near iron are the most tightly bound, with higher binding energy per nucleon than lighter or heavier nuclei.' }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-fission',
    title: 'Splitting Uranium',
    briefing: { speaker: SPEAKER, body: 'When a slow neutron hits uranium-235, the nucleus splits in two. The balance compares total mass before and after the split.' },
    prompt: 'Does splitting uranium-235 into barium-141 and krypton-92 release energy or absorb energy?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        nchainFixture('chamber', { x: 42, y: 17 }, { mode: 'split', w: 80, h: 32 }),
        nscaleFixture('scale', { x: 42, y: 48 }, { left: 'U235-fuel', right: 'U235-split', leftLabel: 'Before', rightLabel: 'After', hideRightUntil: 'chamber', showDiff: true, w: 80, h: 30, title: 'Balance' }),
        nchoiceFixture('ans', 'Splitting it', { x: 118, y: 32 }, { options: ['Absorbs energy', 'Releases energy'], w: 54 })
      ]
    }),
    hints: [
      'Press "Fire Neutron" and compare the balance readings before and after.',
      'Compare total mass before the split with total mass after it.',
      'Any mass that disappears after the split is released as energy.'
    ],
    check(state) {
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the two choices.' };
      if (!chainRead(state.table, 'chamber').fired) return { ok: false, notYet: true, msg: 'Press "Fire Neutron" first to split the uranium-235 nucleus.' };
      if (pick === 2) return { ok: true };
      return { ok: false, msg: 'After the split, the pieces have 0.186 u less mass (235.867 u vs. 236.053 u), so that missing mass became energy.' };
    },
    reward: { log: 'Fission of uranium-235: 0.186 u less (about 173 MeV).', title: 'Fission', body: 'Releases energy: the pieces have 0.186 u less mass, releasing about 173 MeV. A heavy nucleus splitting into two lighter ones is fission.' }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-chain',
    title: 'The Chain',
    briefing: { speaker: SPEAKER, body: 'Each uranium-235 fission frees three neutrons that can split more nuclei. Control rods absorb neutrons to regulate the reaction.' },
    prompt: 'Out of each fission\'s three neutrons, how many must the rods absorb to keep the reaction steady?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        nchainFixture('chamber', { x: 56, y: 31 }, { mode: 'chain', w: 110, h: 56 }),
        nchoiceFixture('ans', 'Absorbed (of 3)', { x: 132, y: 32 }, { options: ['0', '1', '2', '3'], w: 32 })
      ]
    }),
    hints: [
      'Try each rod setting and press "Fire Neutron" to watch four generations.',
      'Watch how the number of fissions changes from generation to generation at each setting.',
      'A steady reaction keeps exactly 1 fission in every generation.'
    ],
    check(state) {
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the four choices.' };
      if (pick === 3) return { ok: true };
      return { ok: false, msg: ['With 0 absorbed, each generation tripled: 1, 3, 9, 27.', 'With 1 absorbed, each generation doubled: 1, 2, 4, 8.', '', 'With all 3 absorbed, the reaction stopped after 1 fission.'][pick - 1] };
    },
    reward: { log: 'Two of three soaked up: one fission causes one more.', title: 'Chain Reaction', body: 'Two absorbed: each fission triggers exactly one more (1, 1, 1, 1). Self-sustaining fissions form a chain reaction, and a steady one is critical.' }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-fusion',
    title: 'Joining Hydrogen',
    prompt: 'Which releases energy: joining two hydrogen-2 nuclei into helium-4, or splitting helium-4 apart?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        nscaleFixture('scale', { x: 42, y: 16 }, { left: 'H2-pair', right: 'He4', leftLabel: 'Two hydrogen-2 nuclei', rightLabel: 'Helium-4 nucleus', showDiff: true, w: 80, h: 30 }),
        ncurveFixture('curve', { x: 42, y: 48 }, { marks: [{ name: 'H-2' }, { name: 'He-4' }], all: false, w: 80, h: 32, title: 'The curve' }),
        nchoiceFixture('ans', 'Energy is released by', { x: 118, y: 32 }, { options: ['Splitting helium-4', 'Joining them'], w: 54 })
      ]
    }),
    hints: [
      'Compare both pans of the balance and tap the two points on the curve.',
      'Check which side has less mass and which nucleus sits higher on the curve.',
      'A reaction releases energy when the products have less mass than the starting nuclei.'
    ],
    check(state) {
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the two choices.' };
      if (pick === 2) return { ok: true };
      return { ok: false, msg: 'Helium-4 has 0.0256 u less mass than two hydrogen-2 nuclei (4.002 u vs. 4.027 u), so joining them releases energy.' };
    },
    reward: { log: 'Joining hydrogen-2 into helium-4 gives 0.0256 u out.', title: 'Fusion', body: 'Joining them: helium-4 has 0.0256 u less mass and sits higher on the curve. Light nuclei combining into a heavier one is fusion.' }
  }
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'A nucleus has less mass than its separate parts, and that missing mass is its binding energy. Splitting heavy nuclei or joining light ones moves toward iron and releases energy.' }]
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
  [fire, choose(2)],
  [fire, rods(1), fire, rods(2), fire, choose(3)],
  [pt(1), pt(2), choose(2)]
];

export const MISSES = [
  [],
  [...add('np', 2), ...add('nn', 2), choose(1)],
  [typed('mev', 0.0304)],
  [ptName('U-238')],
  [fire, choose(1)],
  [fire, rods(1), fire, choose(2)],
  [choose(1)]
];

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export { chainRead };
