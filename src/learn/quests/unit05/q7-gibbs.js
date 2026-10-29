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
  heatTable, note, gCard, plotFixture, markerFixture, markerRead, plaqueFixture, selectorFixture, dialAt, whereIs, plotRead, plotAt, gibbsFreeEnergy, crossingTemperature, fixed
} from '../../table/kits/heat.js';

export const meta = { stageCount: 5 };

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
const T_SALT = crossingTemperature(25.7, 108);
const SALT_FIRST = SALT.Ts.find(T => gibbsFreeEnergy(SALT.dH, SALT.dS, T) < 0);
// Stage 4: ammonia synthesis gives out 92 kJ per mole of reaction and loses 199 J/(mol·K) of spreading; ΔG at 298 K is -32.7 kJ.
const HABER = { dH: -92, dS: -199, T: 298 };
const HABER_DG = gibbsFreeEnergy(HABER.dH, HABER.dS, HABER.T);
// The four answers on the dial: the right one first, then the slips a student makes.
const HABER_OPTIONS = ['−92 kJ', '+59,210 kJ', '−32.7 kJ', '−151 kJ', '—'];
const HABER_RIGHT = 3;
// Stage 5: melting ice takes in 6.01 kJ per mole and gains 22.0 J/(mol·K).
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
      'Commit to the card you expect based on whether endothermic dissolution can occur spontaneously.'
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
      body: 'Next, inspect the free energy balance across different temperatures on the plot.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-plot',
    title: 'Heat Against Spreading',
    prompt: 'Set the marker to the temperature in kelvin at which the salt starts to dissolve on its own.',
    widget,
    table: heatTable({
      fixtures: [
        plotFixture('plot', { x: 44, y: 30 }, { dH: SALT.dH, dS: SALT.dS, Ts: SALT.Ts, tempStart: 1, hideCrossing: true, words: true, title: 'Cold-pack salt in water', w: 64 }),
        markerFixture('T', 'Starts to dissolve at', { x: 118, y: 30 }, { min: 150, max: 350, step: 5, start: 150, unit: 'K', w: 52 })
      ]
    }),
    hints: [
      'Use the "Temperature" dial, the line printed under the plot and the marker.',
      'Compare the net at two neighbouring settings, one above zero and one below.',
      'The net moves steadily between two settings, so the zero lies in proportion between them.'
    ],
    check(state) {
      const v = markerRead(state.table, 'T');
      if (v === 150) return { ok: false, notYet: true, msg: 'Set the marker to the temperature.' };
      if (Math.abs(v - T_SALT) <= 12) return { ok: true };
      return { ok: false, msg: `At ${v} K the net reads ${fixed(gibbsFreeEnergy(SALT.dH, SALT.dS, v), 1, true)} kJ.` };
    },
    reward: {
      log: 'The net went below zero once it was warm enough.',
      title: 'Free Energy',
      body: 'A process that occurs without sustained external energy input is spontaneous, determined by the Gibbs free energy change: ΔG = ΔH − TΔS. Even an endothermic process can be spontaneous at sufficiently high temperatures when positive entropy change outweighs enthalpy.'
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
      'Examine the signs of ΔH and ΔS in ΔG = ΔH − TΔS to determine temperature dependence.'
    ],
    check(state) {
      const t = state.table;
      const want = { 'both-help': 'always', 'both-oppose': 'never', 'high-t': 'high', 'low-t': 'low' };
      if (Object.keys(want).some(k => !['always', 'never', 'high', 'low'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Every card needs a tray.' };
      const wrong = Object.entries(want).find(([k, v]) => whereIs(t, k) !== v);
      if (!wrong) return { ok: true };
      const { dH, dS } = t.pieces[wrong[0]].props;
      return { ok: false, msg: `The line for "${t.pieces[wrong[0]].label}" reads ${fixed(gibbsFreeEnergy(dH, dS, 100), 0, true)} kJ at 100 K and ${fixed(gibbsFreeEnergy(dH, dS, 600), 0, true)} kJ at 600 K.` };
    },
    reward: {
      log: 'Each case was sorted by its line.',
      title: 'Temperature as a Lever',
      body: 'When ΔH and ΔS have opposing thermodynamic effects, temperature determines spontaneity. High temperatures favor the entropy term (TΔS), whereas low temperatures make the enthalpy term (ΔH) dominant.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-number',
    title: 'Free Energy at 298 K',
    prompt: 'Set the answer to the free energy change ΔG of this reaction at 298 K.',
    widget,
    table: heatTable({
      fixtures: [
        plaqueFixture('facts', 'N₂ + 3 H₂ → 2 NH₃', { x: 52, y: 26 }, [
          'ΔH = −92 kJ',
          'ΔS = −199 J/(mol·K)',
          'T = 298 K',
          'ΔG = ΔH − TΔS'
        ], { w: 70 }),
        selectorFixture('answer', 'ΔG at 298 K', { x: 116, y: 46 }, { options: HABER_OPTIONS, start: HABER_OPTIONS.length, w: 52 })
      ]
    }),
    hints: [
      'Use the plate of facts and the answer dial.',
      'Compare the size of ΔH in kJ with the size of TΔS, which carries the units of ΔS.',
      'Work out TΔS in kJ, then subtract it from ΔH, keeping the sign of ΔS.'
    ],
    check(state) {
      const k = dialAt(state.table, 'answer', 'value');
      if (k === HABER_RIGHT) return { ok: true };
      if (k === HABER_OPTIONS.length) return { ok: false, notYet: true, msg: 'Set the figure you worked out.' };
      if (k === 4) return { ok: false, msg: 'The plate gives ΔS as a loss, and that figure makes the reaction run harder than its heat alone.' };
      if (k === 1) return { ok: false, msg: 'That is ΔH alone, and the plate also gives a ΔS and a temperature.' };
      return { ok: false, msg: 'That figure is about 640 times the ΔH on the plate: kJ and J are not the same size.' };
    },
    reward: {
      log: 'ΔG at 298 K came to −32.7 kJ.',
      title: 'ΔG From ΔH and ΔS',
      body: 'ΔG = ΔH − TΔS with ΔS in J/(mol·K) turned into kJ/(mol·K): TΔS = 298 K × (−0.199 kJ/K) = −59.3 kJ, so ΔG = −92 − (−59.3) = −32.7 kJ. A negative ΔG means the reaction runs on its own at this temperature, though less strongly than ΔH alone suggests.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-ice',
    title: 'Where Ice Starts to Melt',
    prompt: 'Set the marker to the temperature in kelvin at which ice starts to melt.',
    widget,
    table: heatTable({
      fixtures: [
        plotFixture('plot', { x: 44, y: 30 }, { dH: ICE.dH, dS: ICE.dS, Ts: ICE.Ts, tempStart: 1, hideCrossing: true, words: true, title: 'Melting ice', w: 64 }),
        plaqueFixture('facts', 'Melting ice', { x: 118, y: 16 }, ['ΔH = +6.01 kJ', 'ΔS = +22.0 J/(mol·K)', 'ΔG = ΔH − TΔS'], { w: 52 }),
        markerFixture('T', 'Ice starts to melt at', { x: 118, y: 44 }, { min: 223, max: 323, step: 10, start: 223, unit: 'K', w: 52 })
      ]
    }),
    hints: [
      'Use the "Temperature" dial and the marker.',
      'Work out the temperature from the plate, then turn the dial to that setting to check the net there.',
      'At the melting point ΔG is zero, so ΔH and TΔS are equal once ΔS is in kJ.'
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
      body: 'The net free energy change for melting ice crosses zero at 273 K, where ΔH = TΔS. Below 273 K, ΔG > 0 and ice remains solid; above 273 K, ΔG < 0 and melting is spontaneous.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the card you choose into the slot.'],
  2: ['Turn the "Temperature" dial.'],
  3: ['Drag each card into a tray.'],
  4: ['Turn the answer dial.'],
  5: ['Turn the "Temperature" dial; set the marker.']
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
      body: 'Spontaneity is governed by Gibbs free energy: ΔG = ΔH − TΔS. Enthalpy and entropy can either cooperate or compete, with temperature scaling the entropy contribution to determine whether a process proceeds spontaneously.'
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
  [dial('T', 'value', 240)],
  [...sort({ 'both-help': 'always', 'both-oppose': 'never', 'high-t': 'high', 'low-t': 'low' })],
  [dial('answer', 'value', HABER_RIGHT)],
  [dial('plot', 'temp', 3), dial('T', 'value', 273)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial('T', 'value', 300)],
  [...sort({ 'both-help': 'always', 'both-oppose': 'never', 'high-t': 'low', 'low-t': 'high' })],
  [dial('answer', 'value', 2)],
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
export const CHECKS = { SALT, SALT_FIRST, T_SALT, ICE, T_ICE, HABER, HABER_DG, HABER_OPTIONS, HABER_RIGHT };
export { plotRead, plotAt };
