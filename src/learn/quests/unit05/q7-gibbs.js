/**
 * Unit 5 · Bench 7 — Free Energy (q7-gibbs)
 *
 * The turbine hall's control room, on the heat kit (`table/kits/heat.js`). A plot of the net balance of a change against temperature,
 * with a dial that walks along it, and cards that each carry such a line. Whether a change runs on its own depends on two pulls, the heat it
 * takes in or gives out and the spreading it gains, and temperature turns up the second. Four stages and ONE click: the belief that a change
 * which takes heat in will not run by itself.
 *
 *   1  PREDICT: a cold pack takes heat in as its salt dissolves; does it dissolve on its own?
 *   2  TEST: turn the dial to the lowest temperature at which it does   -> spontaneous change, free energy
 *   3  four kinds of change sorted by when they run                     -> temperature as a lever
 *   4  the temperature at which ice starts to melt                       -> the crossing
 *
 * THE WRONG MODEL IS ON THE TABLE. "It stays solid" is a card, and the plot prints the two pulls in plain words, HEAT and SPREAD, and their
 * NET: the heat pull is positive at every setting and the net still goes below zero once the spread has grown enough. The symbols
 * come after, on the reward card.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  heatTable, note, gCard, plotFixture, markerFixture, markerRead, whereIs, plotRead, plotAt, gibbsFreeEnergy, crossingTemperature, fixed
} from '../../table/kits/heat.js';

export const meta = { stageCount: 4 };

export const VOCABULARY = [
  { term: /\bspontaneous\b/i, introducedAt: 2 },
  { term: /\bfree energy\b/i, introducedAt: 2 }
];

/** Heat and spreading are earned in the benches before this one. */
export const BUILDS_ON = ['unit05/q3-enthalpy', 'unit05/q6-entropy'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

const QUEST_KEY = 'unit05/q7-gibbs';
const GUESS_LABEL = { on: '"It dissolves on its own"', off: '"It stays solid"', warm: '"Only if it is warmed"' };

// Stage 2: ammonium nitrate dissolving takes in 25.7 kJ per mole and gains 108 J/(mol·K) of spreading.
const SALT = { dH: 25.7, dS: 108, Ts: [150, 200, 250, 298, 350] };
const SALT_FIRST = SALT.Ts.find(T => gibbsFreeEnergy(SALT.dH, SALT.dS, T) < 0);
// Stage 4: melting ice takes in 6.01 kJ per mole and gains 22.0 J/(mol·K).
const ICE = { dH: 6.01, dS: 22.0, Ts: [250, 260, 273, 285, 300] };
const T_ICE = crossingTemperature(ICE.dH, ICE.dS);

/* ------------------------------------------------------------------
   THE FOUR STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'A Pack That Chills',
    // A PREDICT STAGE: the plot is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'A cold pack takes heat from the water as its salt dissolves: will the salt dissolve on its own at room temperature?',
    widget,
    table: heatTable({
      pieces: [
        note('on', 'It dissolves on its own', { x: 24, y: 16 }),
        note('off', 'It stays solid', { x: 70, y: 16 }),
        note('warm', 'Only if it is warmed', { x: 116, y: 16 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 70, y: 44 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the three cards and the slot.',
      'Picture a cold pack squeezed in a warm room, and what the water in it does.',
      'There is no wrong guess yet; commit to the card you would bet on.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'You have picked the answer you would bet on. Next, a plot will show the salt\'s balance at each temperature from a freezer to a warm room.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-plot',
    title: 'Heat Against Spreading',
    get prompt() {
      const guess = recall(QUEST_KEY);
      return guess && GUESS_LABEL[guess]
        ? `You predicted ${GUESS_LABEL[guess]}: turn the dial to the lowest temperature at which the salt dissolves on its own.`
        : 'Turn the dial to the lowest temperature at which the salt dissolves on its own.';
    },
    widget,
    table: heatTable({
      fixtures: [
        plotFixture('plot', { x: 44, y: 30 }, { dH: SALT.dH, dS: SALT.dS, Ts: SALT.Ts, tempStart: 1, hideCrossing: true, words: true, title: 'Cold-pack salt in water', w: 64 })
      ]
    }),
    hints: [
      'Use the "Temperature" dial and read the line printed under the plot.',
      'Compare the net at each setting, and look for where it changes sign.',
      'A change runs on its own wherever the net is below zero, so keep the coldest setting that reads below it.'
    ],
    check(state) {
      const r = plotRead(state.table, 'plot');
      if (r.T === SALT.Ts[0]) return { ok: false, notYet: true, msg: 'The dial is where it started: turn it and read the net at each setting.' };
      if (r.T === SALT_FIRST) return { ok: true };
      if (r.dG < 0) return { ok: false, msg: 'A colder setting also reads below zero.' };
      return { ok: false, msg: `At ${r.T} K the net reads ${fixed(r.dG, 1, true)} kJ.` };
    },
    get reward() {
      const guess = recall(QUEST_KEY);
      const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 'on'
        ? 'You bet on it dissolving, and the plot agreed. '
        : 'The plot did not agree with your bet, which is how a guess gets better. ';
      return {
        log: 'The net went below zero once it was warm enough.',
        title: 'Free Energy',
        body: `${verdict}A change that runs on its own is spontaneous, and what decides it is the free energy: the heat the change takes in, set against the spreading it gains, which grows with temperature. A cold pack takes heat in yet is spontaneous at room temperature, because spreading wins once it is warm enough.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-four-signs',
    title: 'The Four Cases',
    prompt: 'Sort the four kinds of change by the temperatures at which they run on their own.',
    widget,
    table: heatTable({
      pieces: [
        gCard('both-help', 'Heat out, spreads out', { x: 20, y: 14 }, { dH: -40, dS: 100 }),
        gCard('both-oppose', 'Heat in, crowds', { x: 54, y: 14 }, { dH: 40, dS: -100 }),
        gCard('high-t', 'Heat in, spreads out', { x: 88, y: 14 }, { dH: 40, dS: 100 }),
        gCard('low-t', 'Heat out, crowds', { x: 122, y: 14 }, { dH: -40, dS: -100 })
      ],
      zones: {
        trays: [
          { id: 'always', label: 'At every temperature', at: { x: 20, y: 47 }, size: { w: 32, h: 23 }, cell: 31, cellH: 22 },
          { id: 'never', label: 'At no temperature', at: { x: 54, y: 47 }, size: { w: 32, h: 23 }, cell: 31, cellH: 22 },
          { id: 'high', label: 'Only when hot', at: { x: 88, y: 47 }, size: { w: 32, h: 23 }, cell: 31, cellH: 22 },
          { id: 'low', label: 'Only when cold', at: { x: 122, y: 47 }, size: { w: 32, h: 23 }, cell: 31, cellH: 22 }
        ]
      }
    }),
    hints: [
      'Use the four cards and the four trays.',
      'Follow each card\'s line from the cold end to the hot end and compare it with the shaded strip.',
      'A line that stays on one side never changes its verdict, and a line that crosses flips it at one temperature.'
    ],
    check(state) {
      const t = state.table;
      const want = { 'both-help': 'always', 'both-oppose': 'never', 'high-t': 'high', 'low-t': 'low' };
      if (Object.keys(want).some(k => !['always', 'never', 'high', 'low'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Every card needs a tray.' };
      const wrong = Object.entries(want).find(([k, v]) => whereIs(t, k) !== v);
      if (!wrong) return { ok: true };
      return { ok: false, msg: `The card "${t.pieces[wrong[0]].label}" does not belong in the "${t.zones.trays[whereIs(t, wrong[0])].label}" tray.` };
    },
    reward: {
      log: 'Each case was sorted by its line.',
      title: 'Temperature as a Lever',
      body: 'When the heat and the spreading pull the same way, the verdict is the same at every temperature. When they pull against each other, temperature tips the balance: a high temperature lets spreading win, and a low one lets the heat win.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-ice',
    title: 'Where Ice Starts to Melt',
    prompt: 'Set the marker to the temperature in kelvin at which ice starts to melt.',
    widget,
    table: heatTable({
      fixtures: [
        plotFixture('plot', { x: 44, y: 30 }, { dH: ICE.dH, dS: ICE.dS, Ts: ICE.Ts, tempStart: 1, hideCrossing: true, words: true, title: 'Melting ice', w: 64 }),
        markerFixture('T', 'Ice starts to melt at', { x: 118, y: 40 }, { min: 223, max: 323, step: 10, start: 223, unit: 'K', w: 52 })
      ]
    }),
    hints: [
      'Use the "Temperature" dial and the marker.',
      'Compare the net at each setting, and look for where it changes sign.',
      'Ice starts to melt at the temperature where the net is zero, so set the marker there.'
    ],
    check(state) {
      const t = state.table;
      const v = markerRead(t, 'T');
      if (v === 223) return { ok: false, notYet: true, msg: 'Set the marker to the temperature.' };
      if (Math.abs(v - T_ICE) <= 2) return { ok: true };
      return { ok: false, msg: `At ${v} K the net balance reads ${fixed(gibbsFreeEnergy(ICE.dH, ICE.dS, v), 2, true)} kJ.` };
    },
    reward: {
      log: 'The line crossed zero at the melting point.',
      title: 'The Crossing',
      body: 'The net balance for melting ice crosses zero at 273 K, where the heat melting costs exactly equals the spreading it gains. Below it ice stays solid, and above it ice melts, which is why the crossing temperature is the melting point.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the card you choose into the slot.'],
  2: ['Turn the "Temperature" dial.'],
  3: ['Drag each card into a tray.'],
  4: ['Turn the "Temperature" dial; set the marker.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'Two pulls decide whether a change runs on its own: the heat it gives out or takes in, and the spreading it gains. The free energy, ΔG = ΔH − TΔS, sets them against each other, and temperature turns up the spreading until a change that takes heat in can still run.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'This one balance explains why ice melts, why a cold pack works and why some pipes run without pumps. Nothing in it is a rule to memorise.'
    },
    {
      heading: 'Next',
      body: 'The caldera rim holds the Fifth Guild\'s siphon core, and every tool from this world will be needed to crack it.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'A reaction has ΔH = −50 kJ/mol and ΔS = −100 J/(mol·K). What is ΔG at 300 K?',
    options: [
      { id: 'a', label: '−20 kJ/mol' },
      { id: 'b', label: '+20 kJ/mol' },
      { id: 'c', label: '−80 kJ/mol' },
      { id: 'd', label: '+30 kJ/mol' }
    ],
    answer: 'a',
    explanation: 'TΔS is 300 K × (−0.100 kJ/(mol·K)) = −30 kJ, so ΔG = −50 − (−30) = −20 kJ/mol.'
  },
  {
    question: 'A change has ΔH > 0 and ΔS > 0. When is it spontaneous?',
    options: [
      { id: 'a', label: 'Only at high temperature' },
      { id: 'b', label: 'Only at low temperature' },
      { id: 'c', label: 'At every temperature' },
      { id: 'd', label: 'At no temperature' }
    ],
    answer: 'a',
    explanation: 'Entropy gain only outweighs the heat cost once T is large enough, so ΔG turns negative at high temperature.'
  },
  {
    question: 'Melting has ΔH = +6.01 kJ/mol and ΔS = +22.0 J/(mol·K). At what temperature is ΔG zero?',
    options: [
      { id: 'a', label: '273 K' },
      { id: 'b', label: '132 K' },
      { id: 'c', label: '2.73 K' },
      { id: 'd', label: '546 K' }
    ],
    answer: 'a',
    explanation: 'Set ΔH = TΔS and solve: T = 6010 J/mol divided by 22.0 J/(mol·K), which is 273 K.'
  },
  {
    question: 'An uphill reaction has ΔG = +60 kJ and is coupled to a reaction with ΔG = −90 kJ. What is the combined ΔG?',
    options: [
      { id: 'a', label: '−30 kJ' },
      { id: 'b', label: '+30 kJ' },
      { id: 'c', label: '+150 kJ' },
      { id: 'd', label: '−150 kJ' }
    ],
    answer: 'a',
    explanation: 'The two free energy changes add, giving +60 + (−90) = −30 kJ, so the coupled pair runs.'
  },
  {
    question: 'Why does graphite not appear from a diamond at room temperature when ΔG is negative?',
    options: [
      { id: 'a', label: 'The change is far too slow because of a large activation energy' },
      { id: 'b', label: 'A negative ΔG means the change is forbidden' },
      { id: 'c', label: 'Diamond has a lower free energy than graphite' }
    ],
    answer: 'a',
    explanation: 'ΔG tells you whether a change can run, not how fast, and a large barrier can make a favourable change immeasurably slow.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const sort = spec => Object.entries(spec).map(([id, tray]) => put(id, `tray:${tray}`));

export const SOLUTIONS = [
  [put('on', 'slot:guess')],
  [dial('plot', 'temp', SALT.Ts.indexOf(SALT_FIRST) + 1)],
  [...sort({ 'both-help': 'always', 'both-oppose': 'never', 'high-t': 'high', 'low-t': 'low' })],
  [dial('plot', 'temp', 3), dial('T', 'value', 273)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial('plot', 'temp', 2)],
  [...sort({ 'both-help': 'always', 'both-oppose': 'never', 'high-t': 'low', 'low-t': 'high' })],
  [dial('plot', 'temp', 5), dial('T', 'value', 303)]
];

function blankState() { return {}; }

/** Build a full bench state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { SALT, SALT_FIRST, ICE, T_ICE };
export { plotRead, plotAt };
