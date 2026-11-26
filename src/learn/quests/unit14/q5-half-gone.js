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

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bhalf-li(fe|ves)\b/i, introducedAt: 1 },
  { term: /\brate constant\b/i, introducedAt: 6 },
  { term: /\bradiocarbon dating\b/i, introducedAt: 7 }
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
const iodine = (o = {}) => ndecayFixture('grid', { x: 60, y: 31 }, { grids: [{ N0: 256, seed: 7 }], half: I131, unit: 'day', max: 24, plot: 'count', title: 'Iodine-131', ...o });

/** Slips a student makes on the typed stages, each refused with a reason. */
export const SLIPS = { 5: [0, 51, 16, 32, 128, 6], 6: [5.55, 0.125, 11.6, 0.693, 8, 0.0625], 7: [5730, 11460, 45840, 22920, 2865] };

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-half',
    title: 'Half the Nuclei',
    briefing: { speaker: SPEAKER, body: 'Each radioactive nucleus has the same chance of decaying in any day, whatever has happened before. The grid shows 256 nuclei of iodine-131 on one clock.' },
    prompt: 'How many days pass before half of the iodine-131 nuclei have decayed?',
    widget,
    table: nukeTable({ pieces: [], fixtures: [iodine()] }),
    hints: [
      'Tap "Wait 1 day" to move the clock on, and "Back" to move it back.',
      'Watch the count of nuclei left under the grid against the 256 you started with.',
      'Stop the clock on the first day the grid holds half the nuclei it started with.'
    ],
    check(state) {
      const r = decayRead(state.table, 'grid');
      if (!r.t) return { ok: false, notYet: true, msg: 'The clock has not moved yet.' };
      if (r.t === 8) return { ok: true };
      return { ok: false, msg: `On day ${r.t} the grid holds ${r.left[0]} of the 256.` };
    },
    reward: { log: 'Iodine-131: 128 of 256 left after 8 days.', title: 'Half-Life', body: 'Eight days: 128 of the 256 are left. The time for half of the nuclei of a radioactive sample to decay is its half-life.' }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Two Half-Lives',
    predict: true,
    prompt: 'After 8 days, half of the iodine-131 is left: how much do you expect is left after 16 days?',
    widget,
    table: nukeTable({
      pieces: [note('g-none', 'None of it', { x: 34, y: 14 }), note('g-quarter', 'A quarter of it', { x: 34, y: 33 }), note('g-half', 'Still half of it', { x: 34, y: 52 })],
      fixtures: [],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 30 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'Each nucleus still there has the same chance of decaying as on the first day.',
      'In the second 8 days, ask how many nuclei there are to decay.',
      'Half of what was there decays in each half-life, and what was there has changed.'
    ],
    check(state) {
      if (!inSlot(state, 'guess')) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = inSlot(state, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Run the clock.' }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's3-sixteen',
      title: 'Sixteen Days',
      get prompt() { const g = guess(); return `How much of the iodine-131 is left after 16 days?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: nukeTable({ pieces: [], fixtures: [iodine(), nchoiceFixture('ans', 'After 16 days', { x: 134, y: 32 }, { options: ['None', 'A quarter', 'A half'], w: 28 })] }),
      hints: [
        'Run the clock to 16 days.',
        'Compare what is left at day 16 with what was left at day 8.',
        'The second 8 days halve the 128 that were still there, not the 256.'
      ],
      check(state) {
        const pick = chosenIndex(state.table, 'ans');
        if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three.' };
        if (pick === 2) return { ok: true };
        return { ok: false, msg: pick === 1 ? 'At day 16 the grid still holds 64 nuclei.' : 'At day 8 the grid held 128; at day 16 it holds 64.' };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Iodine-131: 64 of 256 left after 16 days.',
          title: 'Half Again',
          body: `A quarter${g ? ` (you predicted ${g})` : ''}: in the second 8 days half of the 128 still there decayed, leaving 64. Each half-life halves what is left, so it never reaches zero in a whole half-life.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-amount',
    title: 'Big Sample, Small Sample',
    prompt: 'Which takes longer to lose half its nuclei: 256 nuclei of iodine-131, or 64?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        ndecayFixture('grid', { x: 60, y: 31 }, { grids: [{ N0: 256, seed: 7, label: '256' }, { N0: 64, seed: 11, label: '64' }], half: I131, unit: 'day', max: 24, plot: 'count', title: 'Iodine-131, two samples' }),
        nchoiceFixture('ans', 'Takes longer', { x: 134, y: 32 }, { options: ['The 256', 'The 64', 'Neither'], w: 28 })
      ]
    }),
    hints: [
      'Run the clock and watch both grids.',
      'Find the day each grid has half its nuclei left.',
      'Each nucleus decays with the same chance whatever its neighbours do, so think about what a bigger sample changes.'
    ],
    check(state) {
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three.' };
      if (pick === 3) return { ok: true };
      return { ok: false, msg: 'On day 8 the large grid holds 128 of 256 and the small grid 32 of 64.' };
    },
    reward: { log: 'Both samples halve in 8 days.', title: 'The Same Half-Life', body: 'Neither: both halved in 8 days. The half-life does not depend on how much there is, the mark of a first-order process.' }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-five',
    title: 'Five Half-Lives',
    prompt: 'How many of 256 iodine-131 nuclei are left after 40 days?',
    widget,
    entry: { id: 'left', label: 'Nuclei left', unit: '' },
    table: nukeTable({ pieces: [], fixtures: [iodine()] }),
    hints: [
      'The clock runs to 24 days: read the grid on days 8, 16 and 24.',
      'Compare how much each 8 days takes away with how much was there at its start.',
      'Count how many half-lives 40 days is, and halve 256 that many times.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'left');
      if (v == null) return { ok: false, notYet: true, msg: 'Type the number of nuclei left.' };
      if (v === 8) return { ok: true };
      if (v === 0) return { ok: false, msg: 'At day 24 the grid still holds 32, and each 8 days leaves half of what was there.' };
      if (v === 16) return { ok: false, msg: '16 is what 32 days leaves: four halvings.' };
      if (v === 32) return { ok: false, msg: '32 is the grid on day 24.' };
      if (v === 128) return { ok: false, msg: '128 is the grid on day 8.' };
      return { ok: false, msg: `The grid read 256, 128, 64, 32 on days 0, 8, 16 and 24, and ${v} does not continue that.` };
    },
    reward: { log: 'Five half-lives: 8 of 256 left.', title: 'Halving and Halving', body: 'Eight: forty days is five half-lives, and 256 halved five times is 128, 64, 32, 16, then 8.' }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-k',
    title: 'The Rate Constant',
    briefing: {
      speaker: SPEAKER,
      body: 'For first-order decay the rate constant k is the fraction of the nuclei that decay in each day, for short times, and t½ = 0.693 / k. The plot here is ln of the nuclei left, which falls in a straight line.',
      worked: ['Cobalt-60: t½ = 5.27 years', 'k = 0.693 ÷ 5.27 = 0.132 per year']
    },
    prompt: 'What is the rate constant of iodine-131, in per day?',
    widget,
    entry: { id: 'k', label: 'k, per day', unit: '' },
    table: nukeTable({ pieces: [], fixtures: [iodine({ plot: 'ln', w: 112 }), plaqueFixture('ref', 'First order', { x: 134, y: 20 }, ['t½ = 0.693 / k'], { w: 28 })] }),
    hints: [
      'Run the clock and watch the points on the plot of ln(nuclei left).',
      'Read the half-life from the grid as you did on the first stage.',
      'The plate links the half-life you can read off the grid to k, as the worked case did for cobalt-60.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'k');
      if (v == null) return { ok: false, notYet: true, msg: 'Type the rate constant in the field.' };
      if (v >= 0.085 && v <= 0.0875 + 1e-9) return { ok: true };
      if (Math.abs(v - 5.55) < 0.05) return { ok: false, msg: 'That is 0.693 × 8; the plate divides 0.693 by k.' };
      if (Math.abs(v - 0.125) < 0.002) return { ok: false, msg: 'That is 1 ÷ 8; the plate has 0.693 on top.' };
      if (Math.abs(v - 11.6) < 0.1) return { ok: false, msg: 'That is 8 ÷ 0.693, upside down.' };
      if (Math.abs(v - 0.693) < 0.001) return { ok: false, msg: '0.693 is the constant on the plate, not k.' };
      return { ok: false, msg: `With k = ${v} the half-life would be ${(0.693 / v).toFixed(1)} days, and the grid halved in 8.` };
    },
    reward: { log: 'Iodine-131: k = 0.0866 per day.', title: 'Rate Constant', body: '0.0866 per day: 0.693 ÷ 8. A bigger rate constant means a shorter half-life, and ln of what is left falls by k every day.' }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-carbon',
    title: 'The Carbon Clock',
    briefing: {
      speaker: SPEAKER,
      body: 'A living thing keeps the same share of carbon-14 as the air, about 15.3 counts per minute for each gram of its carbon. Once it dies none is added, and its carbon-14 halves every 5,730 years.',
      worked: ['A bone counts 7.7, half of 15.3', 'One half-life: 5,730 years old']
    },
    prompt: 'How old is a bone whose carbon-14 counts 1.9 per minute per gram?',
    widget,
    entry: { id: 'age', label: 'Age, years', unit: '' },
    table: nukeTable({
      pieces: [],
      fixtures: [
        ndecayFixture('grid', { x: 60, y: 31 }, { grids: [{ N0: 256, seed: 5, label: 'Carbon-14 in a dead bone' }], half: 5730, unit: 'year', step: 1000, max: 12000, plot: 'count', rate: C14_LIVING, rateUnit: 'per minute per gram', rateDp: 1, title: 'Carbon-14 after death' }),
        plaqueFixture('ref', 'The old bone', { x: 134, y: 20 }, ['1.9 per minute', 'per gram'], { w: 28 })
      ]
    }),
    hints: [
      'Move the clock in thousands of years and watch the count rate.',
      'Compare 1.9 with 15.3: how many times smaller is it?',
      'Count how many halvings take 15.3 down to 1.9, and each halving is one half-life.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'age');
      if (v == null) return { ok: false, notYet: true, msg: 'Type the age in years.' };
      if (v >= 16900 && v <= 17500) return { ok: true };
      if (Math.abs(v - 5730) < 100) return { ok: false, msg: 'After 5,730 years the bone would count 7.7, half the living count.' };
      if (Math.abs(v - 11460) < 150) return { ok: false, msg: 'After 11,460 years the bone would count 3.8, a quarter.' };
      return { ok: false, msg: `After ${commas(v)} years the bone would count ${(C14_LIVING * Math.pow(2, -v / 5730)).toFixed(1)} per minute per gram.` };
    },
    reward: { log: 'The bone: three half-lives, 17,190 years.', title: 'Radiocarbon Dating', body: 'About 17,190 years: 15.3 halves to 7.7, 3.8, then 1.9, three half-lives. Finding an age from the carbon-14 left is radiocarbon dating.' }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-vial',
    title: 'The Unlabelled Vial',
    prompt: 'Which isotope is in the sealed vial?',
    widget,
    table: nukeTable({
      pieces: [],
      fixtures: [
        ndecayFixture('grid', { x: 50, y: 31 }, { grids: [{ N0: 256, seed: 13, label: 'The vial' }], half: 6.01, unit: 'hour', step: 1, max: 18, plot: 'count', rate: 1600, title: 'The sealed vial', w: 96 }),
        plaqueFixture('ref', 'Half-lives', { x: 124, y: 15 }, ['Fluorine-18: 1.8 hours', 'Technetium-99m: 6.0 hours', 'Iodine-131: 8.0 days'], { w: 46 }),
        nchoiceFixture('ans', 'The vial holds', { x: 124, y: 46 }, { options: ['Fluorine-18', 'Technetium-99m', 'Iodine-131'], w: 44 })
      ]
    }),
    hints: [
      'Move the clock on hour by hour and watch the vial\'s count rate.',
      'Find how many hours the count rate takes to halve.',
      'An isotope\'s half-life is its own, whatever the amount, so match the time you measured to the plate.'
    ],
    check(state) {
      const pick = chosenIndex(state.table, 'ans');
      if (!pick) return { ok: false, notYet: true, msg: 'Tap one of the three.' };
      if (pick === 2) return { ok: true };
      return { ok: false, msg: pick === 1 ? 'In 2 hours the vial\'s count rate fell from 1,600 to about 1,270, not to half.' : 'In 12 hours the vial\'s count rate fell from 1,600 to about 400.' };
    },
    reward: { log: 'The vial halves every 6 hours: technetium-99m.', title: 'Its Own Signature', body: 'Technetium-99m: the count rate halved every 6 hours. A half-life belongs to the isotope, so it tells you which isotope you have.' }
  }
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'In each half-life, half of the nuclei still there decay, whatever the amount. What is left halves and halves again and never reaches zero in a whole step.' }]
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
  [...clock(24), typed('left', 8)],
  [...clock(8), typed('k', 0.0866)],
  [...clock(12), typed('age', 17190)],
  [...clock(12), choose(2)]
];

export const MISSES = [
  clock(16),
  [],
  [...clock(16), choose(1)],
  [...clock(8), choose(1)],
  [...clock(24), typed('left', 0)],
  [...clock(8), typed('k', 5.55)],
  [...clock(12), typed('age', 11460)],
  [...clock(12), choose(1)]
];

function blankState() { return {}; }

export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}
