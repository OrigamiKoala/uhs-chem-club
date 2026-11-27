/**
 * Unit 14 · Bench 5 — Half Gone, Then Half Again (q5-half-gone)
 *
 * The cask vault in Cinder Halo's fifth crater, on the nuke kit. Eight stages and ONE click: the belief that two half-lives make a whole,
 * so the sample is all gone. The decaying grid answers it: in the second eight days half of the nuclei STILL THERE decay, so a quarter
 * is left, then an eighth. The bench carries the AP's one nuclear statement: radioactive decay is first order, its half-life is the same
 * for any amount, ln of what is left falls in a straight line, and t½ = 0.693 / k.
 *
 *   1  256 iodine-131 nuclei on a clock                               -> 8 days to half: the half-life
 *   2  PREDICT: how much is left after 16 days?
 *   3  TEST: run the clock to 16 days                                 -> a quarter
 *   4  256 nuclei and 64 on one clock                                 -> both halve in 8 days
 *   5  how many of 256 are left after 40 days (typed, past the clock) -> 8
 *   6  the rate constant (typed; worked case in the briefing)        -> 0.0866 per day
 *   7  a bone counting an eighth of a living bone's carbon-14 (typed)  -> 17,190 years: radiocarbon dating
 *   8  SEALED: an unlabelled vial's count rate over hours              -> technetium-99m
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { nukeTable, ndecayFixture, decayRead, nchoiceFixture, chosenIndex, note, plaqueFixture } from '../../table/kits/nuke.js';
import { commas } from '../../table/kits/nuke-draw.js';
import { C14_LIVING } from '../../engine/nucdata.js';

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\bhalf-li(fe|ves)\b/i, introducedAt: 1 },
  { term: /\brate constant\b/i, introducedAt: 5 },
  { term: /\bradiocarbon dating\b/i, introducedAt: 6 }
];

/** Radioactive decay and count rate (bench 1); first order, half-life and the rate constant (Quicklight `q3-time`). */
export const BUILDS_ON = ['unit14/q1-still-warm', 'unit11/q3-time'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit14/q5-half-gone';
const GUESS = { 'g-none': 'none', 'g-quarter': 'a quarter', 'g-half': 'a half' };
const widget = { type: 'table', label: 'The bench' };
const I131 = 8.02;

export function toolNoteFor() { return null; }

const inSlot = (state, slot) => Object.values(state.table.pieces).find(p => p.zone === `slot:${slot}`) || null;
const iodine = ({ at = { x: 60, y: 31 }, ...o } = {}) => ndecayFixture('grid', at, { grids: [{ N0: 256, seed: 7 }], half: I131, unit: 'day', max: 24, plot: 'count', title: 'Iodine-131', ...o });

/** Slips a student makes on the typed stages, each refused with a reason. */
export const SLIPS = { 5: [5.55, 0.125, 11.6, 0.693, 8, 0.0625], 6: [5730, 11460, 45840, 22920, 2865] };

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-half',
    title: 'Half the Nuclei',
    briefing: { speaker: SPEAKER, body: 'Each radioactive nucleus has the same chance of decaying on any day, regardless of its age. The grid shows 256 iodine-131 nuclei on one clock.' },
    prompt: 'On which day have half of the iodine-131 nuclei decayed?',
    widget,
    table: nukeTable({ pieces: [], fixtures: [iodine()] }),
    hints: [
      'Tap "Wait 1 day" to advance the clock and "Back" to step backward.',
      'Watch the remaining count under the grid compared with the starting 256.',
      'Stop the clock on the day 128 nuclei remain, then press Submit.'
    ],
    check(state) {
      const r = decayRead(state.table, 'grid');
      if (!r.t) return { ok: false, notYet: true, msg: 'Advance the clock first.' };
      if (r.t === 8) return { ok: true };
      return { ok: false, msg: `On day ${r.t}, ${r.left[0]} of 256 nuclei remain (${r.left[0] > 128 ? 'more' : 'less'} than half, 128).` };
    },
    reward: { log: 'Iodine-131: 128 of 256 left after 8 days.', title: 'Half-Life', body: 'Eight days: 128 of 256 nuclei remain. The time it takes for half of a radioactive sample to decay is its half-life.' }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Two Half-Lives',
    predict: true,
    prompt: 'If half of the iodine-131 remains after 8 days, how much do you expect remains after 16 days?',
    widget,
    table: nukeTable({
      pieces: [note('g-none', 'None', { x: 34, y: 14 }), note('g-quarter', 'A quarter', { x: 34, y: 33 }), note('g-half', 'Still half', { x: 34, y: 52 })],
      fixtures: [],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 30 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'There is no wrong prediction, so drag the card you expect into the slot.',
      'During the second 8 days, ask how many nuclei are left to decay.',
      'Each half-life cuts the remaining amount in half, starting from whatever is still there.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Drag a prediction card into the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Run the iodine-131 clock to day 16 on the next bench to test your prediction.' }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's3-sixteen',
      title: 'Sixteen Days',
      get prompt() { const g = guess(); return `How much iodine-131 remains after 16 days?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: nukeTable({ pieces: [], fixtures: [iodine({ bigStep: 8, w: 108, at: { x: 56, y: 31 } }), nchoiceFixture('ans', 'After 16 days', { x: 131, y: 32 }, { options: ['None (0 of 256)', 'A quarter (64 of 256)', 'A half (128 of 256)'], w: 34 })] }),
      hints: [
        'Advance the clock to day 16 using "Wait 8 days" or "Wait 1 day".',
        'Compare how many nuclei remain at day 16 with day 8.',
        'The second 8 days cut the remaining 128 nuclei in half, not the original 256.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three choices.' };
        const r = decayRead(state.table, 'grid');
        if (pick === 2) return { ok: true };
        if (r.t < 16) return { ok: false, msg: 'Run the clock to day 16 first to see how many nuclei remain.' };
        return { ok: false, msg: pick === 1 ? 'At day 16, 64 of 256 nuclei remain (one quarter of the start).' : 'Day 8 left 128 nuclei, and day 16 leaves 64 (one quarter of 256).' };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Iodine-131: 64 of 256 left after 16 days.',
          title: 'Half Again',
          body: `A quarter.${g ? ` You predicted ${g}.` : ''} Each half-life halves whatever remains, so the amount gets smaller without reaching zero in any whole number of half-lives.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-amount',
    title: 'Big Sample, Small Sample',
    prompt: 'Which takes longer to lose half its nuclei: 256 iodine-131 nuclei or 64?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        ndecayFixture('grid', { x: 60, y: 31 }, { grids: [{ N0: 256, seed: 7, label: '256' }, { N0: 64, seed: 11, label: '64' }], half: I131, unit: 'day', bigStep: 8, max: 24, plot: 'count', title: 'Iodine-131, two samples' }),
        nchoiceFixture('ans', 'Takes longer', { x: 134, y: 32 }, { options: ['The 256 sample', 'The 64 sample', 'Both take the same time'], w: 28 })
      ]
    }),
    hints: [
      'Advance the clock to day 8 and compare both grids and the fraction-left graph.',
      'Check which day each grid drops to half its starting nuclei.',
      'Every nucleus decays independently with the same odds, so ask whether sample size changes the half-life.'
    ],
    check(state) {
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three choices.' };
      if (pick === 3) return { ok: true };
      const r = decayRead(state.table, 'grid');
      if (r.t < 8) return { ok: false, msg: 'Run the clock to day 8 first to compare how fast both grids halve.' };
      return { ok: false, msg: 'On day 8, the large grid dropped to 128 of 256 and the small grid dropped to 32 of 64: both halved together.' };
    },
    reward: { log: 'Both samples halve in 8 days.', title: 'The Same Half-Life', body: 'Both take 8 days. Half-life depends only on the isotope, not on how much sample you start with.' }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-k',
    title: 'The Rate Constant',
    briefing: {
      speaker: SPEAKER,
      body: 'The rate constant k measures how fast an isotope decays: a larger k means a shorter half-life, linked by t½ = 0.693 / k.',
      worked: ['Cobalt-60: t½ = 5.27 years', 'k = 0.693 ÷ 5.27 = 0.132 per year']
    },
    prompt: 'What is the rate constant k of iodine-131, in per day?',
    widget,
    entry: { id: 'k', label: 'k, per day', unit: '' },
    table: nukeTable({ pieces: [], fixtures: [iodine({ bigStep: 8, plot: 'count', w: 112 }), plaqueFixture('ref', 'Rate constant', { x: 134, y: 20 }, ['t½ = 0.693 / k'], { w: 28 })] }),
    hints: [
      'Find iodine-131\'s half-life from the grid (8 days).',
      'Use the formula on the plate to solve for k.',
      'Rearrange t½ = 0.693 / k the same way as the cobalt-60 example.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'k');
      if (v == null) return { ok: false, notYet: true, msg: 'Type the rate constant in the box.' };
      if (v >= 0.085 && v <= 0.0875 + 1e-9) return { ok: true };
      if (Math.abs(v - 5.55) < 0.05) return { ok: false, msg: 'A longer half-life means a smaller k, so divide 0.693 by the half-life instead of multiplying.' };
      if (Math.abs(v - 0.125) < 0.002) return { ok: false, msg: 'That is 1 ÷ 8; use 0.693 on top.' };
      if (Math.abs(v - 11.6) < 0.1) return { ok: false, msg: 'That is 8 ÷ 0.693, which is flipped upside down.' };
      if (Math.abs(v - 0.693) < 0.001) return { ok: false, msg: '0.693 is the constant in the formula, not k.' };
      return { ok: false, msg: `With k = ${v}, the half-life would be ${(0.693 / v).toFixed(1)} days, but this grid halves in 8 days.` };
    },
    reward: { log: 'Iodine-131: k = 0.0866 per day.', title: 'Rate Constant', body: '0.0866 per day (0.693 ÷ 8). A larger rate constant always means a shorter half-life.' }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-carbon',
    title: 'The Carbon Clock',
    briefing: {
      speaker: SPEAKER,
      body: 'Living wood gives 15.3 carbon-14 counts per minute per gram. Once cut or burned, its carbon-14 halves every 5,730 years.',
      worked: ['Charred wood at 7.7 is half of 15.3', '1 half-life = 5,730 years old']
    },
    prompt: 'How old is crater charcoal counting 1.9 per minute per gram?',
    widget,
    entry: { id: 'age', label: 'Age, years', unit: '' },
    table: nukeTable({
      pieces: [],
      fixtures: [
        ndecayFixture('grid', { x: 58, y: 31 }, { grids: [{ N0: 256, seed: 5, label: 'Carbon-14 in charred wood' }], half: 5730, unit: 'year', step: 1000, bigStep: 5, max: 24000, plot: 'count', rate: C14_LIVING, rateUnit: 'per minute per gram', rateDp: 1, title: 'Carbon-14 after death', w: 110 }),
        plaqueFixture('ref', 'Crater wood', { x: 134, y: 24 }, ['Now: 1.9 /min/g', 'Living: 15.3 /min/g', 't½: 5,730 years'], { w: 32 })
      ]
    }),
    hints: [
      'Advance the clock to see when the count rate drops to 1.9 per minute per gram.',
      'Count how many times 15.3 must be halved to reach 1.9.',
      'Multiply the number of half-lives by 5,730 years.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'age');
      if (v == null) return { ok: false, notYet: true, msg: 'Type the age in years.' };
      if (v >= 16800 && v <= 17500) return { ok: true };
      if (Math.abs(v - 5730) < 100) return { ok: false, msg: 'After 5,730 years (one half-life), the count would be 7.7.' };
      if (Math.abs(v - 11460) < 150) return { ok: false, msg: 'After 11,460 years (two half-lives), the count would be 3.8.' };
      return { ok: false, msg: `After ${commas(v)} years, the count would be ${(C14_LIVING * Math.pow(2, -v / 5730)).toFixed(1)} per minute per gram.` };
    },
    reward: { log: 'The charred wood: three half-lives, about 17,190 years.', title: 'Radiocarbon Dating', body: 'About 17,190 years: 15.3 halves three times (7.7, 3.8, 1.9), giving three half-lives. Measuring age from remaining carbon-14 is radiocarbon dating.' }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-vial',
    title: 'The Unlabelled Vial',
    prompt: 'Which isotope is inside the sealed camp vial?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        ndecayFixture('grid', { x: 50, y: 31 }, { grids: [{ N0: 256, seed: 13, label: 'The vial' }], half: 6.01, unit: 'hour', step: 1, bigStep: 6, max: 18, plot: 'count', rate: 1600, title: 'The sealed vial', w: 96 }),
        plaqueFixture('ref', 'Half-lives', { x: 124, y: 15 }, ['Fluorine-18: 1.8 hours', 'Technetium-99m: 6.0 hours', 'Iodine-131: 8.0 days'], { w: 46 }),
        nchoiceFixture('ans', 'The vial holds', { x: 124, y: 46 }, { options: ['Iodine-131', 'Technetium-99m', 'Fluorine-18'], w: 44 })
      ]
    }),
    hints: [
      'Advance the clock hour by hour and watch the vial\'s count rate.',
      'Find how many hours it takes the count rate to drop from 1,600 to 800.',
      'Match the half-life you measured to the reference list.'
    ],
    check(state) {
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three choices.' };
      if (pick === 2) return { ok: true };
      const r = decayRead(state.table, 'grid');
      if (r.t < 2) return { ok: false, msg: 'Advance the clock first to see how fast the count rate drops.' };
      return { ok: false, msg: pick === 3 ? 'In 2 hours, the count rate only dropped from 1,600 to about 1,270, not half.' : 'In 6 hours, the count rate already halved to 800, far faster than 8 days.' };
    },
    reward: { log: 'The vial halves every 6 hours: technetium-99m.', title: 'Its Own Signature', body: 'Technetium-99m: the count rate halved every 6 hours. Every isotope has its own half-life, which helps identify it.' }
  }
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Every half-life cuts the remaining radioactive nuclei in half, regardless of sample size. That steady halving lets you date old samples and identify unknown isotopes.' }]
};

/* ---- scripts of the player's own actions ---- */
const put = (piece, to) => ({ place: { piece, to } });
const choose = n => ({ setDial: { fixture: 'ans', dial: 'value', value: n } });
const clock = steps => Array.from({ length: steps }, (_, i) => ({ setDial: { fixture: 'grid', dial: 't', value: i + 1 } }));
const typed = (entry, value) => ({ type: { entry, value: String(value) } });

export const SOLUTIONS = [
  clock(8),
  [put('g-none', 'slot:guess')],
  [...clock(16), choose(2)],
  [...clock(8), choose(3)],
  [...clock(8), typed('k', 0.0866)],
  [...clock(17), typed('age', 17190)],
  [...clock(6), choose(2)]
];

export const MISSES = [
  clock(16),
  [],
  [...clock(16), choose(1)],
  [...clock(8), choose(1)],
  [...clock(8), typed('k', 5.55)],
  [...clock(12), typed('age', 11460)],
  [...clock(6), choose(3)]
];

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}
